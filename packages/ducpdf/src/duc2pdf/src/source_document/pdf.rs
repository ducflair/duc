use hipdf::lopdf::{decode_text_string, Dictionary, Document, Object, ObjectId};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const EMBEDDED_VISIBILITY: &[u8] = b"DucEmbeddedVisible";

#[derive(Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase")]
pub struct DocumentView {
    pub hidden_pages: Vec<usize>,
    pub layers: BTreeMap<String, bool>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageInfo {
    name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sheet_index: Option<u32>,
    width: f32,
    height: f32,
    mm_per_point: Option<f64>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    measurements: Vec<super::measure::PageMeasure>,
}

#[derive(Serialize)]
pub struct LayerInfo {
    id: String,
    name: String,
    visible: bool,
}

#[derive(Serialize)]
pub struct PdfInfo {
    pages: Vec<PageInfo>,
    layers: Vec<LayerInfo>,
}

pub(super) struct Group {
    stable_key: Option<String>,
    pub(super) id: ObjectId,
    pub name: String,
    visible: bool,
}
impl Group {
    pub fn key(&self) -> String {
        self.stable_key
            .clone()
            .unwrap_or_else(|| format!("{}:{}", self.id.0, self.id.1))
    }
}

fn oc_properties(doc: &Document) -> Option<&Dictionary> {
    doc.catalog()
        .ok()?
        .get_deref(b"OCProperties", doc)
        .ok()?
        .as_dict()
        .ok()
}

pub(super) fn groups(doc: &Document) -> Vec<Group> {
    let Some(props) = oc_properties(doc) else {
        return vec![];
    };
    let config = props.get_deref(b"D", doc).and_then(Object::as_dict).ok();
    let contains = |key: &[u8], id| {
        config
            .and_then(|d| d.get_deref(key, doc).ok()?.as_array().ok())
            .is_some_and(|refs| refs.iter().any(|r| r.as_reference().ok() == Some(id)))
    };
    let default_on = config.and_then(|d| d.get(b"BaseState").ok()?.as_name().ok()) != Some(b"OFF");
    props
        .get_deref(b"OCGs", doc)
        .and_then(Object::as_array)
        .into_iter()
        .flatten()
        .filter_map(|obj| {
            let id = obj.as_reference().ok()?;
            let dict = doc.get_dictionary(id).ok()?;
            let name = decode_text_string(dict.get(b"Name").ok()?).ok()?;
            Some(Group {
                stable_key: dict
                    .get(b"DucLayerId")
                    .ok()
                    .and_then(|v| decode_text_string(v).ok()),
                id,
                name,
                visible: !contains(b"OFF", id) && (contains(b"ON", id) || default_on),
            })
        })
        .collect()
}

pub(super) fn inherited_raw<'a>(doc: &'a Document, id: ObjectId, key: &[u8]) -> Option<&'a Object> {
    let mut dict = doc.get_dictionary(id).ok()?;
    for _ in 0..64 {
        if let Ok(value) = dict.get(key) {
            return Some(value);
        }
        dict = dict.get_deref(b"Parent", doc).ok()?.as_dict().ok()?;
    }
    None
}

fn inherited<'a>(doc: &'a Document, id: ObjectId, key: &[u8]) -> Option<&'a Object> {
    doc.dereference(inherited_raw(doc, id, key)?)
        .ok()
        .map(|(_, value)| value)
}

fn page_box(doc: &Document, id: ObjectId, key: &[u8]) -> Option<[f32; 4]> {
    inherited(doc, id, key)?
        .as_array()
        .ok()?
        .iter()
        .map(Object::as_float)
        .collect::<Result<Vec<_>, _>>()
        .ok()?
        .try_into()
        .ok()
}

fn legacy_plot_scale(doc: &Document) -> Option<f64> {
    let info = doc.trailer.get_deref(b"Info", doc).ok()?.as_dict().ok()?;
    if decode_text_string(info.get(b"Producer").ok()?).ok()? != "ducpdf" {
        return None;
    }
    let subject = decode_text_string(info.get(b"Subject").ok()?).ok()?;
    let ratio = subject.strip_prefix("Scale: ")?.trim().split_once(':')?;
    let mm = 25.4 / 72.0 * ratio.1.parse::<f64>().ok()? / ratio.0.parse::<f64>().ok()?;
    (mm.is_finite() && mm > 0.).then_some(mm)
}

pub fn inspect(bytes: &[u8]) -> Result<PdfInfo, String> {
    let doc = Document::load_mem(bytes).map_err(|e| e.to_string())?;
    inspect_document(&doc)
}

pub(super) fn inspect_document(doc: &Document) -> Result<PdfInfo, String> {
    let layers = groups(doc)
        .into_iter()
        .map(|g| LayerInfo {
            id: g.key(),
            name: g.name,
            visible: g.visible,
        })
        .collect();
    let page_ids = doc.get_pages();
    // Older ducpdf releases stored the first plot's scale in document metadata.
    let legacy_scale = (page_ids.len() == 1)
        .then(|| legacy_plot_scale(doc))
        .flatten();
    let pages = page_ids
        .into_values()
        .map(|id| {
            let page = doc.get_dictionary(id).map_err(|e| e.to_string())?;
            let rect = page_box(doc, id, b"CropBox")
                .or_else(|| page_box(doc, id, b"MediaBox"))
                .ok_or("Missing PDF page bounds")?;
            let name = page.get(b"DucSpace").and_then(decode_text_string).ok();
            let mm_per_point = page
                .get(b"DucMillimetresPerPoint")
                .and_then(Object::as_float)
                .ok()
                .map(f64::from)
                .filter(|v| v.is_finite() && *v > 0.0)
                .or(legacy_scale);
            let (mut width, mut height) = ((rect[2] - rect[0]).abs(), (rect[3] - rect[1]).abs());
            let rotation = inherited(doc, id, b"Rotate")
                .and_then(|v| v.as_i64().ok())
                .unwrap_or(0);
            let measurements = super::measure::viewports(doc, page, rect, rotation);
            if rotation.rem_euclid(180) == 90 {
                std::mem::swap(&mut width, &mut height);
            }
            Ok(PageInfo {
                name,
                sheet_index: page.get(b"DucWorkbookSheet").and_then(Object::as_i64).ok().and_then(|n| u32::try_from(n).ok()),
                width,
                height,
                mm_per_point,
                measurements,
            })
        })
        .collect::<Result<_, String>>()?;
    Ok(PdfInfo { pages, layers })
}

pub(super) fn set_layers(
    doc: &mut Document,
    groups: &[Group],
    overrides: &BTreeMap<String, bool>,
    embedding: bool,
) -> Result<(), String> {
    if groups.is_empty() {
        return Ok(());
    }
    let mut props = oc_properties(doc).cloned().unwrap_or_default();
    let mut config = props
        .get_deref(b"D", doc)
        .and_then(Object::as_dict)
        .cloned()
        .unwrap_or_default();
    let (mut on, mut off) = (vec![], vec![]);
    for group in groups {
        let visible = *overrides.get(&group.key()).unwrap_or(&group.visible);
        if visible { &mut on } else { &mut off }.push(Object::Reference(group.id));
        if embedding {
            doc.get_dictionary_mut(group.id)
                .map_err(|e| e.to_string())?
                .set(EMBEDDED_VISIBILITY, visible);
        }
    }
    // Explicit per-element choices take precedence over automatic usage applications.
    if !overrides.is_empty() {
        config.remove(b"AS");
    }
    config.set("ON", on);
    config.set("OFF", off);
    props.set("D", config);
    doc.catalog_mut()
        .map_err(|e| e.to_string())?
        .set("OCProperties", props);
    Ok(())
}

pub(super) fn save(doc: &mut Document) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    doc.save_to(&mut bytes).map_err(|e| e.to_string())?;
    Ok(bytes)
}

pub fn with_layers(
    bytes: &[u8],
    overrides: &BTreeMap<String, bool>,
    embedding: bool,
) -> Result<Option<Vec<u8>>, String> {
    if overrides.is_empty() && !embedding {
        return Ok(None);
    }
    let mut doc = Document::load_mem(bytes).map_err(|e| e.to_string())?;
    let groups = groups(&doc);
    if groups.is_empty() {
        return Ok(None);
    }
    set_layers(&mut doc, &groups, overrides, embedding)?;
    save(&mut doc).map(Some)
}

/// Export the selected original sheets at their native page sizes.
pub fn export_view(bytes: &[u8], view: &DocumentView) -> Result<Vec<u8>, String> {
    let mut doc = Document::load_mem(bytes).map_err(|e| e.to_string())?;
    let pages = doc.get_pages();
    let hidden: std::collections::BTreeSet<_> = view.hidden_pages.iter().copied().collect();
    let removed: Vec<_> = pages
        .keys()
        .enumerate()
        .filter_map(|(index, number)| hidden.contains(&index).then_some(*number))
        .collect();
    if removed.len() == pages.len() {
        return Err("Select at least one PDF page to export".into());
    }
    if !view.layers.is_empty() {
        let groups = groups(&doc);
        set_layers(&mut doc, &groups, &view.layers, false)?;
    }
    if !removed.is_empty() {
        doc.delete_pages(&removed);
        doc.prune_objects();
    }
    save(&mut doc)
}
