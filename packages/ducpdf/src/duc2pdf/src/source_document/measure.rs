//! Rectilinear PDF measurement viewports in displayed (top-left) page coordinates.
use hipdf::lopdf::{decode_text_string, Dictionary, Document, Object};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageMeasure {
    bounds: [f32; 4],
    mm_per_point: f64,
}

fn axis_scale(doc: &Document, measure: &Dictionary, axis: &[u8]) -> Option<f64> {
    let formats = measure.get_deref(axis, doc).ok()?.as_array().ok()?;
    let format = doc.dereference(formats.first()?).ok()?.1.as_dict().ok()?;
    let factor = f64::from(format.get(b"C").ok()?.as_float().ok()?);
    let units = decode_text_string(format.get(b"U").ok()?)
        .ok()?
        .trim()
        .to_ascii_lowercase();
    let mm = match units.as_str() {
        "mm" | "millimeter" | "millimeters" | "millimetre" | "millimetres" => 1.0,
        "cm" | "centimeter" | "centimeters" | "centimetre" | "centimetres" => 10.0,
        "m" | "meter" | "meters" | "metre" | "metres" => 1000.0,
        "km" | "kilometre" | "kilometres" | "kilometer" | "kilometers" => 1e6,
        "in" | "in." | "inch" | "inches" | "\"" => 25.4,
        "ft" | "ft." | "foot" | "feet" | "'" => 304.8,
        "yd" | "yd." | "yard" | "yards" => 914.4,
        _ => return None,
    };
    (factor.is_finite() && factor > 0.).then_some(mm * factor)
}

pub fn viewports(
    doc: &Document,
    page: &Dictionary,
    crop: [f32; 4],
    rotation: i64,
) -> Vec<PageMeasure> {
    let screen = |x: f32, y: f32| match rotation.rem_euclid(360) {
        90 => (y - crop[1], x - crop[0]),
        180 => (crop[2] - x, y - crop[1]),
        270 => (crop[3] - y, crop[2] - x),
        _ => (x - crop[0], crop[3] - y),
    };
    let Some(ports) = page
        .get_deref(b"VP", doc)
        .ok()
        .and_then(|obj| obj.as_array().ok())
    else {
        return vec![];
    };
    ports
        .iter()
        .filter_map(|obj| {
            let viewport = doc.dereference(obj).ok()?.1.as_dict().ok()?;
            let measure = viewport.get_deref(b"Measure", doc).ok()?.as_dict().ok()?;
            if measure
                .get(b"Subtype")
                .ok()
                .and_then(|obj| obj.as_name().ok())
                .unwrap_or(b"RL")
                != b"RL"
            {
                return None;
            }
            let scale = axis_scale(doc, measure, b"X")?;
            if measure.has(b"Y") && (axis_scale(doc, measure, b"Y")? - scale).abs() > scale * 1e-6 {
                return None;
            }
            let bbox = viewport.get_deref(b"BBox", doc).ok()?.as_array().ok()?;
            let [x1, y1, x2, y2] = <[Object; 4]>::try_from(bbox.clone()).ok()?;
            let (left, top) = screen(x1.as_float().ok()?, y1.as_float().ok()?);
            let (right, bottom) = screen(x2.as_float().ok()?, y2.as_float().ok()?);
            Some(PageMeasure {
                bounds: [
                    left.min(right),
                    top.min(bottom),
                    left.max(right),
                    top.max(bottom),
                ],
                mm_per_point: scale,
            })
        })
        .collect()
}
