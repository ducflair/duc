//! Tile Command Streamer
//!
//! Streams DUC elements directly into a flat u32 command buffer via TileEmitter.
//! Performs spatial bounding box culling (expanded by stroke extent), handles
//! 2D affine transforms in f64, duplication arrays, and styling.

use crate::streaming::emitter::{DrawEmitter, TileEmitter};
use crate::streaming::stream_linear::render_linear_to_emitter;
use crate::streaming::stream_shapes::{
    stream_arrow_to_emitter, stream_ellipse_to_emitter, stream_freedraw_to_emitter,
    stream_polygon_to_emitter, stream_rectangle_to_emitter,
};
use crate::utils::style_resolver::ResolvedStyles;
use crate::ConversionResult;
use bigcolor::BigColor;
use duc::types::{
    DucBlockDuplicationArray, DucBlockInstance, DucElementBase, DucElementEnum,
    DucLinearElementBase, ElementWrapper, STROKE_CAP, STROKE_JOIN,
};

pub fn stream_tile_commands(
    elements: &[&ElementWrapper],
    block_instances: &[DucBlockInstance],
    tile_x: f64,
    tile_y: f64,
    tile_w: f64,
    tile_h: f64,
    scale: f64,
) -> ConversionResult<Vec<u32>> {
    let mut emitter = TileEmitter::new(tile_x, tile_y, scale);

    // Expand tile bounds by stroke padding margin (e.g. 64px in screen space)
    // so strokes near tile edges are not cut off.
    let pad = 64.0 / scale.max(0.01);
    let min_x = tile_x - pad;
    let min_y = tile_y - pad;
    let max_x = tile_x + tile_w + pad;
    let max_y = tile_y + tile_h + pad;

    for element_wrapper in elements {
        let element = &element_wrapper.element;
        let base = get_element_base(element);

        if !base.is_visible || base.is_deleted {
            continue;
        }

        let offsets = get_element_duplication_offsets(element, block_instances)
            .unwrap_or_else(|| vec![(0.0, 0.0)]);

        let center_override = compute_element_center(element);

        for (x_off, y_off) in offsets {
            let elem_x = base.x + x_off;
            let elem_y = base.y + y_off;

            // Bounding box culling
            let (min_elem_x, max_elem_x, min_elem_y, max_elem_y) = match element {
                DucElementEnum::DucLinearElement(lin) => {
                    let mut lx1 = elem_x;
                    let mut lx2 = elem_x;
                    let mut ly1 = elem_y;
                    let mut ly2 = elem_y;
                    for p in &lin.linear_base.points {
                        lx1 = lx1.min(elem_x + p.x);
                        lx2 = lx2.max(elem_x + p.x);
                        ly1 = ly1.min(elem_y + p.y);
                        ly2 = ly2.max(elem_y + p.y);
                    }
                    (lx1, lx2, ly1, ly2)
                }
                _ => {
                    let x1 = elem_x.min(elem_x + base.width);
                    let x2 = elem_x.max(elem_x + base.width);
                    let y1 = elem_y.min(elem_y + base.height);
                    let y2 = elem_y.max(elem_y + base.height);
                    (x1, x2, y1, y2)
                }
            };

            if base.angle.abs() > 1e-4 {
                let (cx, cy) = center_override.unwrap_or((base.width / 2.0, base.height / 2.0));
                let center_x = elem_x + cx;
                let center_y = elem_y + cy;
                let radius = ((base.width * base.width + base.height * base.height).sqrt() / 2.0).max(pad);
                if center_x + radius < min_x || center_x - radius > max_x
                    || center_y + radius < min_y || center_y - radius > max_y {
                    continue;
                }
            } else {
                if max_elem_x < min_x || min_elem_x > max_x || max_elem_y < min_y || min_elem_y > max_y {
                    continue;
                }
            }

            emitter.save();

            // Set up element transform
            let (cx, cy) = center_override.unwrap_or((base.width / 2.0, base.height / 2.0));
            let angle = base.angle;

            if angle.abs() < 1e-6 {
                // Pure translation
                emitter.transform(1.0, 0.0, 0.0, 1.0, elem_x as f32, elem_y as f32);
            } else {
                let cos_a = angle.cos();
                let sin_a = angle.sin();
                let a = cos_a;
                let b = sin_a;
                let c = -sin_a;
                let d = cos_a;
                let e = elem_x + cx - (cx * cos_a - cy * sin_a);
                let f = elem_y + cy - (cx * sin_a + cy * cos_a);
                emitter.transform(
                    a as f32, b as f32, c as f32, d as f32, e as f32, f as f32,
                );
            }

            // Apply styles
            let styles = ResolvedStyles::from_base_styles(&base.styles);
            apply_styles(&styles, &mut emitter);

            // Stream shape geometry
            match element {
                DucElementEnum::DucRectangleElement(rect) => {
                    stream_rectangle_to_emitter(rect, &mut emitter)?;
                }
                DucElementEnum::DucPolygonElement(poly) => {
                    stream_polygon_to_emitter(poly, &mut emitter)?;
                }
                DucElementEnum::DucEllipseElement(ellipse) => {
                    stream_ellipse_to_emitter(ellipse, &mut emitter)?;
                }
                DucElementEnum::DucLinearElement(linear) => {
                    render_linear_to_emitter(linear, &mut emitter)?;
                }
                DucElementEnum::DucArrowElement(arrow) => {
                    stream_arrow_to_emitter(arrow, &mut emitter)?;
                }
                DucElementEnum::DucFreeDrawElement(freedraw) => {
                    stream_freedraw_to_emitter(freedraw, &mut emitter)?;
                }
                DucElementEnum::DucFrameElement(frame) => {
                    let styles = &frame.stack_element_base.base.styles;
                    crate::streaming::stream_shapes::append_rounded_rect_path(
                        &mut emitter,
                        0.0,
                        0.0,
                        frame.stack_element_base.base.width,
                        frame.stack_element_base.base.height,
                        styles.roundness,
                    );
                    emitter.stroke();
                }
                DucElementEnum::DucTableElement(table) => {
                    emitter.rect(0.0, 0.0, table.base.width, table.base.height);
                    emitter.stroke();
                }
                DucElementEnum::DucImageElement(image) => {
                    if let Some(file_id) = &image.file_id {
                        let roundness = image.base.styles.roundness;
                        if roundness > 0.0 {
                            crate::streaming::stream_shapes::append_rounded_rect_path(
                                &mut emitter,
                                0.0,
                                0.0,
                                image.base.width,
                                image.base.height,
                                roundness,
                            );
                            emitter.clip(false);
                        }
                        emitter.draw_image(file_id, 0.0, 0.0, image.base.width, image.base.height);
                    }
                }
                DucElementEnum::DucTextElement(text) => {
                    let color_rgba = base.styles.stroke.first()
                        .and_then(|s| parse_color(&s.content.src, s.content.opacity))
                        .unwrap_or(0x000000FF);
                    let align = match text.style.text_align {
                        duc::types::TEXT_ALIGN::LEFT => 0,
                        duc::types::TEXT_ALIGN::CENTER => 1,
                        duc::types::TEXT_ALIGN::RIGHT => 2,
                    };
                    let v_align = match text.style.vertical_align {
                        duc::types::VERTICAL_ALIGN::TOP => 0,
                        duc::types::VERTICAL_ALIGN::MIDDLE => 1,
                        duc::types::VERTICAL_ALIGN::BOTTOM => 2,
                    };
                    let line_height = text.style.font_size as f32 * text.style.line_height as f32;
                    emitter.draw_text(
                        &text.text,
                        0.0,
                        0.0,
                        text.base.width,
                        text.base.height,
                        text.style.font_size as f32,
                        line_height,
                        &text.style.font_family,
                        color_rgba,
                        align,
                        v_align,
                    );
                }
                _ => {}
            }

            emitter.restore();
        }
    }

    Ok(emitter.into_buffer())
}

fn apply_styles(styles: &ResolvedStyles, emitter: &mut TileEmitter) {
    if (styles.opacity - 1.0).abs() > 1e-4 {
        emitter.set_global_alpha(styles.opacity as f32);
    }

    // 1. Background / Fill
    if let Some(bg) = styles.background.iter().find(|b| b.visible) {
        if let Some(rgba) = parse_color(&bg.color, bg.opacity) {
            emitter.set_fill_color(rgba);
        }
    }

    // 2. Stroke
    if let Some(stroke) = styles.stroke.iter().find(|s| s.visible) {
        if let Some(rgba) = parse_color(&stroke.color, stroke.opacity) {
            emitter.set_stroke_color(rgba);
        }
        emitter.set_line_width(stroke.width as f32);

        let cap = match stroke.cap {
            STROKE_CAP::ROUND => 1,
            STROKE_CAP::SQUARE => 2,
            _ => 0,
        };
        emitter.set_line_cap(cap);

        let join = match stroke.join {
            STROKE_JOIN::ROUND => 1,
            STROKE_JOIN::BEVEL => 2,
            _ => 0,
        };
        emitter.set_line_join(join);

        if let Some(dash) = &stroke.dash_pattern {
            if !dash.is_empty() {
                let dashes: Vec<f32> = dash.iter().map(|&d| d as f32).collect();
                emitter.set_line_dash(&dashes, 0.0);
            }
        }
    }
}

fn parse_color(color_src: &str, opacity: f64) -> Option<u32> {
    if color_src.trim().is_empty() || color_src == "transparent" {
        return None;
    }
    let color = BigColor::new(color_src);
    let rgb = color.to_rgb();
    let a = (opacity.clamp(0.0, 1.0) * 255.0).round() as u32;
    Some(((rgb.r as u32) << 24) | ((rgb.g as u32) << 16) | ((rgb.b as u32) << 8) | a)
}

fn get_element_base(element: &DucElementEnum) -> &DucElementBase {
    match element {
        DucElementEnum::DucRectangleElement(elem) => &elem.base,
        DucElementEnum::DucPolygonElement(elem) => &elem.base,
        DucElementEnum::DucEllipseElement(elem) => &elem.base,
        DucElementEnum::DucEmbeddableElement(elem) => &elem.base,
        DucElementEnum::DucPdfElement(elem) => &elem.base,
        DucElementEnum::DucTableElement(elem) => &elem.base,
        DucElementEnum::DucImageElement(elem) => &elem.base,
        DucElementEnum::DucTextElement(elem) => &elem.base,
        DucElementEnum::DucLinearElement(elem) => &elem.linear_base.base,
        DucElementEnum::DucArrowElement(elem) => &elem.linear_base.base,
        DucElementEnum::DucFreeDrawElement(elem) => &elem.base,
        DucElementEnum::DucFrameElement(elem) => &elem.stack_element_base.base,
        DucElementEnum::DucPlotElement(elem) => &elem.stack_element_base.base,
        DucElementEnum::DucDocElement(elem) => &elem.base,
        DucElementEnum::DucModelElement(elem) => &elem.base,
    }
}

fn compute_element_center(element: &DucElementEnum) -> Option<(f64, f64)> {
    match element {
        DucElementEnum::DucLinearElement(linear) => {
            compute_linear_center(&linear.linear_base)
        }
        DucElementEnum::DucPolygonElement(poly) => {
            Some((poly.base.width / 2.0, poly.base.height / 2.0))
        }
        DucElementEnum::DucEllipseElement(ellipse) => {
            Some((ellipse.base.width / 2.0, ellipse.base.height / 2.0))
        }
        _ => None,
    }
}

fn compute_linear_center(linear_base: &DucLinearElementBase) -> Option<(f64, f64)> {
    if linear_base.points.is_empty() {
        return None;
    }

    let mut min_x = f64::INFINITY;
    let mut min_y = f64::INFINITY;
    let mut max_x = f64::NEG_INFINITY;
    let mut max_y = f64::NEG_INFINITY;

    for point in &linear_base.points {
        let x = point.x;
        let y = point.y;
        if !x.is_finite() || !y.is_finite() {
            continue;
        }
        min_x = min_x.min(x);
        min_y = min_y.min(y);
        max_x = max_x.max(x);
        max_y = max_y.max(y);
    }

    if !min_x.is_finite() || !min_y.is_finite() || !max_x.is_finite() || !max_y.is_finite() {
        return None;
    }

    Some(((min_x + max_x) / 2.0, (min_y + max_y) / 2.0))
}

fn get_element_duplication_offsets(
    element: &DucElementEnum,
    block_instances: &[DucBlockInstance],
) -> Option<Vec<(f64, f64)>> {
    let base = get_element_base(element);
    let instance_id = base.instance_id.as_ref()?;
    let block_instance = block_instances.iter().find(|inst| &inst.id == instance_id)?;
    let dup_array = block_instance.duplication_array.as_ref()?;

    if dup_array.rows <= 1 && dup_array.cols <= 1 {
        return None;
    }

    let (elem_cell_width, elem_cell_height) =
        compute_cell_dimensions(base.width, base.height, dup_array);

    let cols = dup_array.cols.max(1) as usize;
    let rows = dup_array.rows.max(1) as usize;
    let col_spacing = dup_array.col_spacing;
    let row_spacing = dup_array.row_spacing;

    let stride_x = elem_cell_width + col_spacing;
    let stride_y = elem_cell_height + row_spacing;

    let mut offsets = Vec::with_capacity(rows * cols);
    for r in 0..rows {
        for c in 0..cols {
            offsets.push((c as f64 * stride_x, r as f64 * stride_y));
        }
    }

    Some(offsets)
}

fn compute_cell_dimensions(
    total_w: f64,
    total_h: f64,
    dup: &DucBlockDuplicationArray,
) -> (f64, f64) {
    let cols = dup.cols.max(1) as f64;
    let rows = dup.rows.max(1) as f64;
    let cw = if cols > 1.0 {
        (total_w - (cols - 1.0) * dup.col_spacing) / cols
    } else {
        total_w
    };
    let ch = if rows > 1.0 {
        (total_h - (rows - 1.0) * dup.row_spacing) / rows
    } else {
        total_h
    };
    (cw, ch)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::streaming::emitter::{
        OP_MOVE_TO, OP_RECT, OP_RESTORE, OP_SAVE, OP_SET_FILL_COLOR, OP_SET_LINE_WIDTH,
        OP_SET_STROKE_COLOR,
    };

    #[test]
    fn test_tile_emitter_coordinate_mapping() {
        let mut emitter = TileEmitter::new(100.0, 200.0, 2.0);
        emitter.move_to(150.0, 250.0);
        let buf = emitter.into_buffer();

        assert_eq!(buf[0], OP_MOVE_TO);
        assert_eq!(f32::from_bits(buf[1]), 100.0);
        assert_eq!(f32::from_bits(buf[2]), 100.0);
    }

    #[test]
    fn test_tile_emitter_hairline_clamping() {
        let mut emitter = TileEmitter::new(0.0, 0.0, 0.1);
        emitter.set_line_width(0.5);
        let buf = emitter.into_buffer();

        assert_eq!(buf[0], OP_SET_LINE_WIDTH);
        assert_eq!(f32::from_bits(buf[1]), 1.0);
    }

    #[test]
    fn test_stream_rectangle_element() {
        let json_rect = r##"{
            "element": {
                "type": "rectangle",
                "id": "rect-1",
                "x": 10.0,
                "y": 20.0,
                "width": 100.0,
                "height": 50.0,
                "angle": 0.0,
                "strokeColor": "#000000",
                "backgroundColor": "#ff0000",
                "fillStyle": "solid",
                "strokeWidth": 2.0,
                "strokeStyle": "solid",
                "roughness": 0,
                "opacity": 100,
                "groupIds": [],
                "frameId": null,
                "roundness": null,
                "seed": 1,
                "version": 1,
                "versionNonce": 1,
                "isDeleted": false,
                "boundElements": null,
                "updated": 1,
                "link": null,
                "locked": false,
                "styles": {
                    "opacity": 1.0,
                    "roundness": 0.0,
                    "background": [{
                        "content": { "src": "red", "opacity": 1.0, "visible": true, "preference": "solid", "hatch": null, "image_filter": null },
                        "preference": "solid",
                        "hatch": null
                    }],
                    "stroke": [{
                        "content": { "src": "black", "opacity": 1.0, "visible": true, "preference": "solid", "hatch": null, "image_filter": null },
                        "width": 2.0,
                        "style": { "cap": "round", "join": "round", "dash_pattern": null },
                        "preference": "solid",
                        "placement": "center",
                        "stroke_sides": null
                    }]
                }
            }
        }"##;

        if let Ok(wrapper) = serde_json::from_str::<ElementWrapper>(json_rect) {
            let elements = vec![&wrapper];
            let block_instances = vec![];

            let commands = stream_tile_commands(
                &elements,
                &block_instances,
                0.0,
                0.0,
                200.0,
                200.0,
                1.0,
            )
            .expect("Stream tile commands should succeed");

            assert!(!commands.is_empty());
            assert_eq!(commands[0], OP_SAVE);
            assert!(commands.contains(&OP_SET_FILL_COLOR));
            assert!(commands.contains(&OP_SET_STROKE_COLOR));
            assert!(commands.contains(&OP_RECT));
            assert_eq!(*commands.last().unwrap(), OP_RESTORE);
        }
    }
}


