use crate::source_document::{self, DocumentView};
use crate::{ConversionError, ConversionResult};
use duc::types::*;
use serde_bytes::ByteBuf;
use std::collections::{HashMap, HashSet};

pub fn view(base: &DucElementBase) -> DocumentView {
    base.custom_data
        .as_deref()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok())
        .and_then(|obj| serde_json::from_value(obj.get("pdfView")?.clone()).ok())
        .unwrap_or_default()
}

fn cad_kind(name: &str) -> Option<&'static str> {
    ["dwg", "dxf", "dwf"]
        .into_iter()
        .find(|kind| name.eq_ignore_ascii_case(kind))
}

pub fn model_document_source(
    model: &DucModelElement,
    files: Option<&HashMap<String, DucExternalFile>>,
) -> Option<(&'static str, String)> {
    if let Some(custom) = model
        .base
        .custom_data
        .as_deref()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok())
    {
        if let Some(output) = custom.get("modelOutput") {
            if let Some(id) = output["pdfFileId"].as_str().filter(|id| {
                files.is_some_and(|files| files.contains_key(*id))
                    && (!matches!(output["renderer"].as_str(), Some("xlsx" | "table")) || id.ends_with("_workbook1_pdf"))
            }) {
                return Some(("pdf", id.to_owned()));
            }
            if let (Some(kind), Some(id)) = (
                output["renderer"].as_str().and_then(|kind| {
                    match kind {
                        "pdf" => Some("pdf"),
                        "svg" => Some("svg"),
                        "image" => Some("image"),
                        "xlsx" => Some("xlsx"),
                        "table" => Some("table"),
                        _ => cad_kind(kind),
                    }
                }),
                output["fileId"].as_str(),
            ) {
                return Some((kind, id.to_owned()));
            }
        }
    }
    let kind = cad_kind(model.model_type.as_deref()?)?;
    let mut ids = model.file_ids.iter().filter(|id| {
        !["dwg_dxf_cache_", "model_output_", "model_preview_"]
            .iter()
            .any(|prefix| id.starts_with(prefix))
    });
    let first = ids.clone().next()?;
    let primary = ids.find(|id| {
        files
            .and_then(|f| f.get(*id))
            .and_then(|f| f.revisions.get(&f.active_revision_id))
            .is_some_and(|r| {
                r.mime_type.to_ascii_lowercase().contains(kind)
                    || r.source_name
                        .as_deref()
                        .and_then(|s| s.rsplit_once('.'))
                        .is_some_and(|(_, ext)| ext.eq_ignore_ascii_case(kind))
            })
    });
    Some((kind, primary.unwrap_or(first).clone()))
}

struct PdfResources<'a> {
    files: &'a mut HashMap<String, DucExternalFile>,
    data: &'a mut HashMap<String, ByteBuf>,
    next: usize,
}

impl PdfResources<'_> {
    fn insert(&mut self, source: &str, pdf: Vec<u8>) -> String {
        let id = loop {
            let id = format!("duc:pdf:{}", self.next);
            self.next += 1;
            if !self.files.contains_key(&id) && !self.data.contains_key(&id) {
                break id;
            }
        };
        let source = &self.files[source];
        let mut meta = source.revisions[&source.active_revision_id].clone();
        meta.id = id.clone();
        meta.size_bytes = pdf.len() as i64;
        meta.mime_type = "application/pdf".into();
        meta.checksum = None;
        meta.locator = None;
        let file = DucExternalFile {
            id: id.clone(),
            active_revision_id: id.clone(),
            updated: source.updated,
            version: source.version,
            revisions: HashMap::from([(id.clone(), meta)]),
        };
        self.files.insert(id.clone(), file);
        self.data.insert(id.clone(), pdf.into());
        id
    }
}

/// Normalize source-backed elements only inside the export snapshot. Share one unfiltered
/// PDF per source revision and one variant per combination of layer overrides.
pub fn prepare(state: &mut ExportedDataState) -> ConversionResult<()> {
    let (Some(files), Some(data)) = (&mut state.external_files, &mut state.external_files_data)
    else {
        return Ok(());
    };
    let mut resources = PdfResources {
        files,
        data,
        next: 0,
    };
    let mut converted = HashMap::new();
    let mut variants = HashMap::new();
    let mut intermediate = HashSet::new();
    for wrapper in &mut state.elements {
        let (kind, source_id, base, grid) = match &wrapper.element {
            DucElementEnum::DucTableElement(e) => {
                ("xlsx", e.file_id.clone(), &e.base, Some(&e.grid_config))
            }
            DucElementEnum::DucModelElement(e) => {
                match model_document_source(e, Some(resources.files)) {
                    Some((kind, id)) => (kind, Some(id), &e.base, None),
                    None => continue,
                }
            }
            DucElementEnum::DucPdfElement(e) => {
                ("pdf", e.file_id.clone(), &e.base, Some(&e.grid_config))
            }
            DucElementEnum::DucDocElement(e) => (
                "pdf",
                super::document_pdf::get_renderable_doc_pdf_file_id(e),
                &e.base,
                Some(&e.grid_config),
            ),
            _ => continue,
        };
        if base.is_deleted || !base.is_visible {
            continue;
        }
        let Some(id) = source_id else { continue };
        let layers = view(base).layers;
        if kind == "pdf"
            && layers.is_empty()
            && !matches!(&wrapper.element, DucElementEnum::DucModelElement(_))
        {
            continue;
        }
        let Some(file) = resources.files.get(&id) else {
            continue;
        };
        let revision = file.active_revision_id.clone();
        if !file.revisions.contains_key(&revision) {
            continue;
        }
        let Some(raw) = resources.data.get(&revision) else {
            continue;
        };
        let mut pdf_id = id.clone();
        if kind != "pdf" {
            let entry = converted.entry((kind, revision));
            pdf_id = match entry {
                std::collections::hash_map::Entry::Occupied(e) => String::clone(e.get()),
                std::collections::hash_map::Entry::Vacant(e) => {
                    let bytes = source_document::convert(kind, raw).map_err(|err| {
                        ConversionError::ResourceLoadError(format!("{kind} {id}: {err}"))
                    })?;
                    e.insert(resources.insert(&id, bytes)).clone()
                }
            };
            intermediate.insert(id);
        }
        if !layers.is_empty() {
            let entry = variants.entry((pdf_id.clone(), layers));
            let variant = match entry {
                std::collections::hash_map::Entry::Occupied(e) => String::clone(e.get()),
                std::collections::hash_map::Entry::Vacant(e) => {
                    let bytes = &resources.data[&resources.files[&pdf_id].active_revision_id];
                    let variant = source_document::with_layers(bytes, &e.key().1, false)
                        .map_err(ConversionError::ResourceLoadError)?
                        .map(|pdf| resources.insert(&pdf_id, pdf))
                        .unwrap_or_else(|| pdf_id.clone());
                    e.insert(variant).clone()
                }
            };
            intermediate.insert(pdf_id);
            pdf_id = variant;
        }
        wrapper.element = DucElementEnum::DucPdfElement(DucPdfElement {
            base: base.clone(),
            file_id: Some(pdf_id),
            grid_config: grid.cloned().unwrap_or(DocumentGridConfig {
                columns: 1,
                gap_x: 0.,
                gap_y: 0.,
                first_page_alone: false,
                scale: 1.,
            }),
        });
    }
    // Avoid decoding unused default PDFs or retaining the original CAD/XLSX alongside
    // the converted vector resources. Retain file bodies shared with other elements.
    for e in &state.elements {
        match &e.element {
            DucElementEnum::DucPdfElement(e) => {
                if let Some(id) = &e.file_id {
                    intermediate.remove(id);
                }
            }
            DucElementEnum::DucImageElement(e) => {
                if let Some(id) = &e.file_id {
                    intermediate.remove(id);
                }
            }
            DucElementEnum::DucDocElement(e) => {
                if let Some(id) = super::document_pdf::get_renderable_doc_pdf_file_id(e) {
                    intermediate.remove(&id);
                }
            }
            DucElementEnum::DucModelElement(e) => {
                for id in &e.file_ids {
                    intermediate.remove(id);
                }
            }
            _ => {}
        }
    }
    let revisions: HashSet<_> = intermediate
        .iter()
        .filter_map(|id| resources.files.remove(id))
        .map(|f| f.active_revision_id)
        .collect();
    let mut removable = revisions;
    for file in resources.files.values() {
        removable.remove(&file.active_revision_id);
    }
    for id in removable {
        resources.data.remove(&id);
    }
    Ok(())
}
