//! Generic Shape Streaming for DrawEmitter
//!
//! Renders rectangles (with roundness), polygons, ellipses, arrows, and freedraw
//! to any DrawEmitter implementation.

use crate::streaming::emitter::DrawEmitter;
use crate::streaming::stream_elements::ElementStreamer;
use crate::streaming::stream_linear::render_linear_to_emitter;
use crate::ConversionResult;
use duc::types::{
    DucArrowElement, DucEllipseElement, DucFreeDrawElement, DucLinearElement,
    DucPolygonElement, DucRectangleElement,
};

pub fn stream_rectangle_to_emitter<E: DrawEmitter>(
    rect: &DucRectangleElement,
    emitter: &mut E,
) -> ConversionResult<()> {
    let styles = &rect.base.styles;
    let has_background = styles
        .background
        .iter()
        .any(|background| background.content.visible);
    let has_stroke = styles.stroke.iter().any(|stroke| stroke.content.visible);

    if !has_background && !has_stroke {
        return Ok(());
    }

    append_rounded_rect_path(
        emitter,
        0.0,
        0.0,
        rect.base.width,
        rect.base.height,
        styles.roundness,
    );

    if has_background && has_stroke {
        emitter.fill_and_stroke(false);
    } else if has_background {
        emitter.fill(false);
    } else if has_stroke {
        emitter.stroke();
    }

    Ok(())
}

pub fn append_rounded_rect_path<E: DrawEmitter>(
    emitter: &mut E,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    roundness: f64,
) {
    if width <= 0.0 || height <= 0.0 || !width.is_finite() || !height.is_finite() {
        return;
    }

    let radius = roundness.max(0.0).min(width * 0.5).min(height * 0.5);
    if radius <= 0.01 {
        emitter.rect(x, y, width, height);
        return;
    }

    let right = x + width;
    let bottom = y + height;
    let kappa = 0.552_284_749_830_793_6;
    let control = radius * kappa;

    emitter.begin_path();
    emitter.move_to(x + radius, y);
    emitter.line_to(right - radius, y);
    emitter.bezier_curve_to(
        right - radius + control,
        y,
        right,
        y + radius - control,
        right,
        y + radius,
    );
    emitter.line_to(right, bottom - radius);
    emitter.bezier_curve_to(
        right,
        bottom - radius + control,
        right - radius + control,
        bottom,
        right - radius,
        bottom,
    );
    emitter.line_to(x + radius, bottom);
    emitter.bezier_curve_to(
        x + radius - control,
        bottom,
        x,
        bottom - radius + control,
        x,
        bottom - radius,
    );
    emitter.line_to(x, y + radius);
    emitter.bezier_curve_to(
        x,
        y + radius - control,
        x + radius - control,
        y,
        x + radius,
        y,
    );
    emitter.close_path();
}

pub fn stream_polygon_to_emitter<E: DrawEmitter>(
    polygon: &DucPolygonElement,
    emitter: &mut E,
) -> ConversionResult<()> {
    let linear = ElementStreamer::convert_polygon_to_linear_element(polygon);
    render_linear_to_emitter(&linear, emitter)
}

pub fn stream_ellipse_to_emitter<E: DrawEmitter>(
    ellipse: &DucEllipseElement,
    emitter: &mut E,
) -> ConversionResult<()> {
    let linear = ElementStreamer::convert_ellipse_to_linear_element(ellipse);
    render_linear_to_emitter(&linear, emitter)
}

pub fn stream_arrow_to_emitter<E: DrawEmitter>(
    arrow: &DucArrowElement,
    emitter: &mut E,
) -> ConversionResult<()> {
    render_linear_to_emitter(
        &DucLinearElement {
            linear_base: arrow.linear_base.clone(),
            wipeout_below: false,
        },
        emitter,
    )
}

pub fn stream_freedraw_to_emitter<E: DrawEmitter>(
    freedraw: &DucFreeDrawElement,
    emitter: &mut E,
) -> ConversionResult<()> {
    let points = &freedraw.points;
    if points.len() < 2 {
        return Ok(());
    }

    emitter.begin_path();
    emitter.move_to(points[0].x, points[0].y);

    if points.len() == 2 {
        emitter.line_to(points[1].x, points[1].y);
    } else {
        // Smoothing using midpoint quadratic curves
        for i in 0..(points.len() - 1) {
            let p0 = &points[i];
            let p1 = &points[i + 1];
            let mid_x = (p0.x + p1.x) / 2.0;
            let mid_y = (p0.y + p1.y) / 2.0;
            emitter.quad_curve_to(p0.x, p0.y, mid_x, mid_y);
        }
        let last = &points[points.len() - 1];
        emitter.line_to(last.x, last.y);
    }

    emitter.stroke();
    Ok(())
}
