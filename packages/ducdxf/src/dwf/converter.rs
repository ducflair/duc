use crate::error::{ConversionError, ConversionResult};
use crate::options::ConversionOptions;
use duc::types::*;
use roxmltree::Document as XmlDocument;
use std::collections::HashMap;
use std::io::{Cursor, Read};
use zip::ZipArchive;

#[derive(Debug)]
struct DwfSheet {
    title: String,
    image_bytes: Option<(Vec<u8>, String)>, // (bytes, extension)
}

fn create_content(src: String, opacity: f64) -> ElementContentBase {
    ElementContentBase {
        preference: None,
        src,
        visible: true,
        opacity,
        tiling: None,
        hatch: None,
        image_filter: None,
    }
}

/// Converts a DWF package to DUC ExportedDataState.
pub fn convert_dwf_to_duc_state(
    dwf_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<ExportedDataState> {
    let cursor = Cursor::new(dwf_bytes);
    let mut archive = ZipArchive::new(cursor).map_err(|e| {
        ConversionError::DwfParse(format!("Failed to open DWF zip archive: {}", e))
    })?;

    // 1. Read manifest.xml
    let mut manifest_xml = String::new();
    let mut title_from_manifest = None;

    if let Ok(mut manifest_file) = archive.by_name("manifest.xml") {
        manifest_file.read_to_string(&mut manifest_xml).ok();
    }

    let mut sheets: Vec<DwfSheet> = Vec::new();

    if !manifest_xml.is_empty() {
        if let Ok(xml_doc) = XmlDocument::parse(&manifest_xml) {
            for node in xml_doc.descendants() {
                if node.has_tag_name("Section") {
                    let section_title = node
                        .attribute("title")
                        .unwrap_or("Untitled Sheet")
                        .to_string();

                    if title_from_manifest.is_none() {
                        title_from_manifest = Some(section_title.clone());
                    }

                    // Find child resources for thumbnail or graphic
                    let mut sheet_image = None;
                    for child in node.descendants() {
                        if child.has_tag_name("Resource") {
                            let role = child.attribute("role").unwrap_or("");
                            let mime = child.attribute("mime").unwrap_or("");
                            let href = child.attribute("href").unwrap_or("");

                            if (role == "thumbnail" || role == "preview" || mime.starts_with("image/"))
                                && !href.is_empty()
                            {
                                let zip_path = href.replace('\\', "/");
                                let zip_path_win = href.replace('/', "\\");

                                let zip_idx = archive
                                    .index_for_name(&zip_path)
                                    .or_else(|| archive.index_for_name(&zip_path_win));

                                let file_data = if let Some(idx) = zip_idx {
                                    archive.by_index(idx).ok().and_then(|mut f| {
                                        let mut buf = Vec::new();
                                        f.read_to_end(&mut buf).ok().map(|_| buf)
                                    })
                                } else {
                                    None
                                };

                                if let Some(bytes) = file_data {
                                    let ext = if mime == "image/jpeg" || href.ends_with(".jpg") {
                                        "jpg".to_string()
                                    } else {
                                        "png".to_string()
                                    };
                                    sheet_image = Some((bytes, ext));
                                    break;
                                }
                            }
                        }
                    }

                    sheets.push(DwfSheet {
                        title: section_title,
                        image_bytes: sheet_image,
                    });
                }
            }
        }
    }

    // Fallback: If no sheets found in manifest, scan archive for any jpg/png images
    if sheets.is_empty() || sheets.iter().all(|s| s.image_bytes.is_none()) {
        for i in 0..archive.len() {
            if let Ok(mut f) = archive.by_index(i) {
                let name = f.name().to_string();
                let lower = name.to_lowercase();
                if lower.ends_with(".jpg") || lower.ends_with(".png") || lower.ends_with(".jpeg") {
                    let mut bytes = Vec::new();
                    if f.read_to_end(&mut bytes).is_ok() && bytes.len() > 1024 {
                        let ext = if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
                            "jpg".to_string()
                        } else {
                            "png".to_string()
                        };
                        sheets.push(DwfSheet {
                            title: format!("Sheet {}", sheets.len() + 1),
                            image_bytes: Some((bytes, ext)),
                        });
                        break;
                    }
                }
            }
        }
    }

    if sheets.is_empty() {
        return Err(ConversionError::EmptyDrawing);
    }

    let mut elements: Vec<ElementWrapper> = Vec::new();
    let mut external_files: HashMap<String, DucExternalFile> = HashMap::new();
    let mut external_files_data: HashMap<String, serde_bytes::ByteBuf> = HashMap::new();

    let mut current_y = 0.0;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);

    for (idx, sheet) in sheets.iter().enumerate() {
        let (img_w, img_h) = if let Some((img_bytes, _ext)) = &sheet.image_bytes {
            image::load_from_memory(img_bytes)
                .map(|img| (img.width() as f64, img.height() as f64))
                .unwrap_or((841.89, 595.28))
        } else {
            (841.89, 595.28)
        };

        let plot_id = format!("plot_dwf_{}", idx + 1);
        let plot_w = img_w.max(200.0);
        let plot_h = img_h.max(200.0);

        let plot_elem = DucPlotElement {
            stack_element_base: DucStackElementBase {
                base: DucElementBase {
                    id: plot_id.clone(),
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![ElementBackground {
                            content: create_content(
                                options.background_color.clone().unwrap_or_else(|| "#ffffff".to_string()),
                                1.0,
                            ),
                        }],
                        stroke: vec![ElementStroke {
                            content: create_content("#000000".to_string(), 0.25),
                            width: 0.5,
                            style: StrokeStyle {
                                preference: Some(STROKE_PREFERENCE::SOLID),
                                cap: None,
                                join: None,
                                dash: None,
                                dash_line_override: None,
                                dash_cap: None,
                                miter_limit: None,
                            },
                            placement: Some(STROKE_PLACEMENT::INSIDE),
                            stroke_sides: None,
                        }],
                        opacity: 1.0,
                    },
                    x: 0.0,
                    y: current_y,
                    width: plot_w,
                    height: plot_h,
                    angle: 0.0,
                    label: sheet.title.clone(),
                    description: None,
                    is_visible: true,
                    seed: 1000 + idx as i32,
                    version: 1,
                    version_nonce: 2000 + idx as i32,
                    updated: now,
                    index: None,
                    is_plot: true,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: None,
                    frame_id: None,
                    bound_elements: None,
                    z_index: 0.0,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                stack_base: DucStackBase {
                    label: sheet.title.clone(),
                    description: None,
                    is_collapsed: false,
                    is_plot: true,
                    is_visible: true,
                    locked: false,
                    styles: DucStackLikeStyles { opacity: 1.0 },
                },
                clip: true,
                label_visible: true,
            },
            style: DucPlotStyle {},
            layout: PlotLayout {
                margins: Margins {
                    top: 0.0,
                    right: 0.0,
                    bottom: 0.0,
                    left: 0.0,
                },
            },
        };

        elements.push(ElementWrapper {
            element: DucElementEnum::DucPlotElement(plot_elem),
        });

        // Add image element if available
        if let Some((img_bytes, ext)) = &sheet.image_bytes {
            let file_id = format!("file_dwf_{}", idx + 1);
            let rev_id = format!("rev_dwf_{}", idx + 1);

            let mut revisions = HashMap::new();
            revisions.insert(
                rev_id.clone(),
                ExternalFileRevisionMeta {
                    id: rev_id.clone(),
                    size_bytes: img_bytes.len() as i64,
                    checksum: None,
                    source_name: Some(format!("sheet_{}.{}", idx + 1, ext)),
                    mime_type: format!("image/{}", if ext == "jpg" { "jpeg" } else { ext }),
                    message: None,
                    created: now,
                    last_retrieved: Some(now),
                },
            );

            external_files.insert(
                file_id.clone(),
                DucExternalFile {
                    id: file_id.clone(),
                    active_revision_id: rev_id.clone(),
                    updated: now,
                    revisions,
                    version: Some(1),
                },
            );

            external_files_data.insert(
                rev_id,
                serde_bytes::ByteBuf::from(img_bytes.clone()),
            );

            let img_elem = DucImageElement {
                base: DucElementBase {
                    id: format!("img_dwf_{}", idx + 1),
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![],
                        stroke: vec![],
                        opacity: 1.0,
                    },
                    x: 0.0,
                    y: current_y,
                    width: plot_w,
                    height: plot_h,
                    angle: 0.0,
                    label: sheet.title.clone(),
                    description: None,
                    is_visible: true,
                    seed: 2000 + idx as i32,
                    version: 1,
                    version_nonce: 3000 + idx as i32,
                    updated: now,
                    index: None,
                    is_plot: false,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: None,
                    frame_id: Some(plot_id.clone()),
                    bound_elements: None,
                    z_index: 1.0,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                file_id: Some(file_id),
                status: IMAGE_STATUS::SAVED,
                scale: vec![1.0, 1.0],
                crop: None,
                filter: None,
            };

            elements.push(ElementWrapper {
                element: DucElementEnum::DucImageElement(img_elem),
            });
        }

        current_y += plot_h + options.vertical_spacing;
    }

    Ok(ExportedDataState {
        id: Some("ducdxf-export".to_string()),
        version: "1.0.0".to_string(),
        source: "ducdxf".to_string(),
        data_type: "drawing".to_string(),
        dictionary: None,
        thumbnail: None,
        charter: None,
        issues: vec![],
        elements,
        blocks: vec![],
        block_instances: vec![],
        block_collections: vec![],
        groups: vec![],
        regions: vec![],
        layers: vec![],
        duc_local_state: None,
        duc_global_state: Some(DucGlobalState {
            view_background_color: options.background_color.clone().unwrap_or_else(|| "#ffffff".to_string()),
        }),
        version_graph: None,
        external_files: if external_files.is_empty() { None } else { Some(external_files) },
        external_files_data: if external_files_data.is_empty() { None } else { Some(external_files_data) },
    })
}

/// Converts a DWF package to DUC bytes.
pub fn convert_dwf_to_duc(
    dwf_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    let state = convert_dwf_to_duc_state(dwf_bytes, options)?;
    duc::serialize::serialize_duc_to_bytes(&state).map_err(|e| {
        ConversionError::DucSerialization(format!("Serialization error: {}", e))
    })
}
