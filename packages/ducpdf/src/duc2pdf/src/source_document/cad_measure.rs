//! Physical calibration for dwgpdf's model page and individual paper-space viewports.
use super::layout_names::{block_name, model_view};
use acadrust::{document::CadDocument, entities::EntityType, objects::Layout};
use dwgpdf::cad::bounds::{calculate_block_bounds, BoundingBox};
use hipdf::lopdf::{dictionary, text_string, Dictionary, Object};

pub(super) fn millimetres(unit: i16) -> Option<f64> {
    Some(match unit {
        1 => 25.4,
        2 => 304.8,
        3 => 1_609_344.,
        4 => 1.,
        5 => 10.,
        6 => 1000.,
        7 => 1e6,
        8 => 0.0000254,
        9 => 0.0254,
        10 => 914.4,
        11 => 1e-7,
        12 => 1e-6,
        13 => 0.001,
        14 => 100.,
        15 => 10_000.,
        16 => 100_000.,
        17 => 1e12,
        18 => 149_597_870_700_000.,
        19 => 9.4607304725808e18,
        20 => 3.085677581491367e19,
        21 => 1_200_000. / 3937.,
        22 => 100_000. / 3937.,
        23 => 3_600_000. / 3937.,
        24 => 6_336_000_000. / 3937.,
        _ => return None,
    })
}

fn size(page: &Dictionary) -> Option<(f64, f64)> {
    let rect = page.get(b"MediaBox").ok()?.as_array().ok()?;
    let dim = |i: usize| rect.get(i)?.as_float().ok().map(f64::from);
    Some((dim(2)? - dim(0)?, dim(3)? - dim(1)?))
}

pub(super) fn model(page: &mut Dictionary, mm: f64, bounds: BoundingBox, margin: f64) {
    if let Some((w, h)) = size(page) {
        let scale = ((w - 2. * margin).max(1.) / bounds.width().max(1.))
            .min((h - 2. * margin).max(1.) / bounds.height().max(1.));
        let factor = (mm / scale) as f32;
        if factor.is_finite() && factor > 0. {
            page.set("DucMillimetresPerPoint", Object::Real(factor));
        }
    }
}

pub(super) fn paper(page: &mut Dictionary, mm: f64, cad: &CadDocument, layout: &Layout) {
    let (Some((w, h)), Some(block)) = (size(page), block_name(cad, layout)) else {
        return;
    };
    let mut views = cad
        .entities_in_block(block)
        .filter_map(|entity| match entity {
            EntityType::Viewport(v) if model_view(v) => Some(v),
            _ => None,
        })
        .peekable();
    if views.peek().is_none() {
        return;
    }

    let extent = (
        (layout.max_limits.0 - layout.min_limits.0).abs(),
        (layout.max_limits.1 - layout.min_limits.1).abs(),
    );
    let fit = |left, bottom, width: f64, height: f64| {
        let s = (w / width).min(h / height);
        (
            s,
            (w - width * s) / 2. - left * s,
            (h - height * s) / 2. - bottom * s,
        )
    };
    // Use the same paper transform as dwgpdf; model scale may differ on every viewport.
    let (scale, tx, ty) = if layout.paper_width > 10. && layout.paper_height > 10. {
        if extent.0 > 0.01 && extent.1 > 0.01 {
            fit(
                layout.min_limits.0.min(layout.max_limits.0),
                layout.min_limits.1.min(layout.max_limits.1),
                extent.0,
                extent.1,
            )
        } else {
            let bounds = calculate_block_bounds(cad, block);
            if bounds.is_valid() {
                fit(
                    bounds.min_x,
                    bounds.min_y,
                    bounds.width().max(1.),
                    bounds.height().max(1.),
                )
            } else {
                (72. / 25.4, 0., 0.)
            }
        }
    } else {
        let bounds = calculate_block_bounds(cad, block);
        (1., 20. - bounds.min_x, 20. - bounds.min_y)
    };
    let mut ports = Vec::new();
    for view in views {
        let factor = (mm * view.view_height / (view.height * scale)) as f32;
        let bbox = [
            (view.center.x - view.width / 2.) * scale + tx,
            (view.center.y - view.height / 2.) * scale + ty,
            (view.center.x + view.width / 2.) * scale + tx,
            (view.center.y + view.height / 2.) * scale + ty,
        ]
        .map(|n| n as f32);
        if !factor.is_finite() || factor <= 0. || !bbox.iter().all(|n| n.is_finite()) {
            continue;
        }
        let format = |unit: &str, c: f32| {
            Object::Dictionary(dictionary! {
                "Type" => "NumberFormat", "U" => text_string(unit), "C" => Object::Real(c)
            })
        };
        let measure = dictionary! {
            "Type" => "Measure", "Subtype" => "RL",
            "R" => text_string(&format!("1 pt = {factor} mm")),
            "X" => vec![format("mm", factor)], "D" => vec![format("mm", 1.)],
            "A" => vec![format("mm²", 1.)]
        };
        ports.push(Object::Dictionary(dictionary! {
            "Type" => "Viewport", "BBox" => bbox.map(Object::Real).to_vec(), "Measure" => measure
        }));
    }
    if !ports.is_empty() {
        page.set("VP", ports);
    }
}
