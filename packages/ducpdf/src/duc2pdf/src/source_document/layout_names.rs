//! Match emitted paper sheets to their tab names when dwgpdf omits empty layouts.
use acadrust::{
    document::CadDocument,
    entities::{EntityType, Viewport},
    objects::Layout,
};
use dwgpdf::cad::bounds::{entity_intersects_bbox, BoundingBox};
use std::collections::HashMap;

pub(super) fn block_name<'a>(doc: &'a CadDocument, layout: &Layout) -> Option<&'a str> {
    let by_handle = doc.block_records.iter().find(|r| {
        (layout.block_record.value() != 0 && r.handle == layout.block_record)
            || (layout.handle.value() != 0 && r.layout == layout.handle)
    });
    by_handle
        .or_else(|| {
            let tab = if layout.tab_order <= 1 {
                String::new()
            } else {
                (layout.tab_order - 1).to_string()
            };
            [
                layout.name.clone(),
                format!("*Paper_Space{tab}"),
                format!("*Paper_Space{}", layout.tab_order),
                "*Paper_Space".into(),
            ]
            .iter()
            .find_map(|name| {
                doc.block_records
                    .iter()
                    .find(|r| r.name.eq_ignore_ascii_case(name))
            })
        })
        .map(|r| r.name.as_str())
}

pub(super) fn model_view(v: &Viewport) -> bool {
    let overall = (v.center.x - v.view_center.x).abs() < 1e-3
        && (v.center.y - v.view_center.y).abs() < 1e-3
        && (v.height - v.view_height).abs() < 1e-3;
    v.id != 1 && !overall && v.status.is_on && v.width > 0. && v.height > 0. && v.view_height > 0.
}

pub(super) fn emitted_name_candidates(
    doc: &CadDocument,
    layouts: &[&Layout],
    count: usize,
) -> Vec<String> {
    if layouts.len() == count {
        return layouts.iter().map(|l| l.name.clone()).collect();
    }
    if count == 0 {
        return vec![];
    }
    let mut cache = HashMap::new();
    layouts
        .iter()
        .filter(|layout| {
            let Some(block) = block_name(doc, layout) else {
                return false;
            };
            let mut views = Vec::new();
            for entity in doc.entities_in_block(block) {
                let EntityType::Viewport(v) = entity else {
                    return true;
                };
                if !model_view(v) {
                    continue;
                }
                let w = v.view_height * v.width / v.height;
                views.push(BoundingBox {
                    min_x: v.view_center.x - w / 2.,
                    max_x: v.view_center.x + w / 2.,
                    min_y: v.view_center.y - v.view_height / 2.,
                    max_y: v.view_center.y + v.view_height / 2.,
                });
            }
            // dwgpdf 1.0 uses twenty model hits for viewport-only tabs.
            let mut hits = 0;
            if !views.is_empty() {
                for entity in doc.entities_in_block("*Model_Space") {
                    for view in &views {
                        if entity_intersects_bbox(doc, entity, view, &mut cache) {
                            hits += 1;
                            if hits == 20 {
                                return true;
                            }
                        }
                    }
                }
            }
            false
        })
        .map(|l| l.name.clone())
        .collect()
}
