//! Generic Linear Element Streaming for DrawEmitter
//!
//! Renders DucLinearElement paths, fills (minimal cycle faces), strokes, and
//! line heads to any DrawEmitter implementation (LopdfEmitter or TileEmitter).

use crate::streaming::emitter::DrawEmitter;
use crate::ConversionResult;
use bigcolor::BigColor;
use duc::types::{
    DucLine, DucLinearElement, DucPoint, GeometricPoint, LINE_HEAD,
};
use std::collections::{BTreeMap, HashSet};
use std::f64::consts::PI;

#[derive(Clone, Copy, Debug)]
struct Point2D {
    x: f64,
    y: f64,
}

pub fn render_linear_to_emitter<E: DrawEmitter>(
    linear: &DucLinearElement,
    emitter: &mut E,
) -> ConversionResult<()> {
    let points = &linear.linear_base.points;
    let lines = &linear.linear_base.lines;

    if points.is_empty() || lines.is_empty() {
        return Ok(());
    }

    let has_background = !linear.linear_base.base.styles.background.is_empty();
    let visible_stroke = linear
        .linear_base
        .base
        .styles
        .stroke
        .iter()
        .find(|stroke| stroke.content.visible);
    let has_stroke = visible_stroke.is_some();
    let stroke_width = visible_stroke
        .map(|stroke| stroke.width)
        .filter(|width| width.is_finite() && *width > 0.0)
        .unwrap_or(1.0);

    // 1. Render fills first (minimal closed cycles/faces)
    if has_background {
        emit_fill_paths(points, lines, emitter)?;
    }

    // 2. Render stroke paths on top
    if has_stroke {
        let stroke_points = get_trimmed_linear_points(linear, points, stroke_width);
        emit_stroke_paths(&stroke_points, lines, emitter)?;
    }

    // 3. Render line heads (arrows, circles, etc.)
    render_line_heads(linear, points, stroke_width, emitter)?;

    Ok(())
}

fn emit_fill_paths<E: DrawEmitter>(
    points: &[DucPoint],
    lines: &[DucLine],
    emitter: &mut E,
) -> ConversionResult<()> {
    if points.is_empty() || lines.is_empty() {
        return Ok(());
    }

    // Build undirected adjacency list
    let mut adj: BTreeMap<i32, Vec<(i32, &DucLine, usize)>> = BTreeMap::new();
    for (line_idx, line) in lines.iter().enumerate() {
        let start = line.start.index;
        let end = line.end.index;

        if start >= 0 && end >= 0 && start < points.len() as i32 && end < points.len() as i32 {
            adj.entry(start).or_default().push((end, line, line_idx));
            adj.entry(end).or_default().push((start, line, line_idx));
        }
    }

    let mut found_cycles = HashSet::new();
    let mut has_emitted_any = false;

    for start_node_idx in adj.keys().copied() {
        let mut stack = vec![(start_node_idx, vec![start_node_idx], vec![])];

        while let Some((current_node_idx, path, used_line_indices)) = stack.pop() {
            if path.len() > points.len() {
                continue;
            }

            if let Some(neighbors) = adj.get(&current_node_idx) {
                for (neighbor_idx, _line, line_idx) in neighbors {
                    if path.len() >= 2 && *neighbor_idx == path[path.len() - 2] {
                        continue;
                    }

                    if *neighbor_idx == start_node_idx && path.len() >= 2 {
                        let cycle_nodes = path.clone();
                        let mut cycle_line_indices = used_line_indices.clone();
                        cycle_line_indices.push(*line_idx);

                        let mut is_minimal = true;
                        let cycle_len = cycle_nodes.len();

                        if cycle_len > 2 {
                            for i in 0..cycle_len {
                                for j in (i + 1)..cycle_len {
                                    let u = cycle_nodes[i];
                                    let v = cycle_nodes[j];

                                    let is_adjacent_in_cycle =
                                        (j == i + 1) || (i == 0 && j == cycle_len - 1);

                                    if !is_adjacent_in_cycle {
                                        if let Some(neighbors_of_u) = adj.get(&u) {
                                            if neighbors_of_u.iter().any(|(n, _, _)| *n == v) {
                                                is_minimal = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if !is_minimal {
                                    break;
                                }
                            }
                        }

                        if is_minimal {
                            let mut canonical_cycle = cycle_nodes.clone();
                            canonical_cycle.sort_unstable();

                            if !found_cycles.contains(&canonical_cycle) {
                                found_cycles.insert(canonical_cycle);

                                let mut render_path_nodes = cycle_nodes;
                                render_path_nodes.push(start_node_idx);

                                let start_point = &points[render_path_nodes[0] as usize];
                                emitter.move_to(start_point.x, start_point.y);

                                for i in 0..(render_path_nodes.len() - 1) {
                                    let p1_idx = render_path_nodes[i];
                                    let p2_idx = render_path_nodes[i + 1];

                                    if let Some((_, connecting_line, _)) =
                                        adj.get(&p1_idx).and_then(|n| {
                                            n.iter().find(|(idx, _, _)| *idx == p2_idx)
                                        })
                                    {
                                        let p1 = &points[p1_idx as usize];
                                        let p2 = &points[p2_idx as usize];

                                        let (start_handle, end_handle) =
                                            if connecting_line.start.index == p1_idx {
                                                (
                                                    &connecting_line.start.handle,
                                                    &connecting_line.end.handle,
                                                )
                                            } else {
                                                (
                                                    &connecting_line.end.handle,
                                                    &connecting_line.start.handle,
                                                )
                                            };

                                        add_segment(p1, p2, start_handle, end_handle, emitter)?;
                                    }
                                }

                                emitter.close_path();
                                has_emitted_any = true;
                            }
                        }
                    } else if !path.contains(neighbor_idx) {
                        let mut new_path = path.clone();
                        new_path.push(*neighbor_idx);
                        let mut new_line_indices = used_line_indices.clone();
                        new_line_indices.push(*line_idx);
                        stack.push((*neighbor_idx, new_path, new_line_indices));
                    }
                }
            }
        }
    }

    if has_emitted_any {
        emitter.fill(true); // even-odd fill rule
    }

    Ok(())
}

fn emit_stroke_paths<E: DrawEmitter>(
    points: &[DucPoint],
    lines: &[DucLine],
    emitter: &mut E,
) -> ConversionResult<()> {
    if points.is_empty() || lines.is_empty() {
        return Ok(());
    }

    let mut visited = vec![false; lines.len()];

    for i in 0..lines.len() {
        if visited[i] {
            continue;
        }

        let mut current_line_idx = i;
        let first_line_idx = i;
        let mut subpath_started = false;

        loop {
            let line = &lines[current_line_idx];
            visited[current_line_idx] = true;

            let s_idx = line.start.index;
            let e_idx = line.end.index;

            if s_idx < 0
                || e_idx < 0
                || s_idx >= points.len() as i32
                || e_idx >= points.len() as i32
            {
                break;
            }

            if !subpath_started {
                let start_point = &points[s_idx as usize];
                emitter.move_to(start_point.x, start_point.y);
                subpath_started = true;
            }

            let start_point = &points[s_idx as usize];
            let end_point = &points[e_idx as usize];

            add_segment(
                start_point,
                end_point,
                &line.start.handle,
                &line.end.handle,
                emitter,
            )?;

            let mut next_line_opt = None;
            for (idx, next_line) in lines.iter().enumerate() {
                if visited[idx] {
                    continue;
                }
                if next_line.start.index == e_idx {
                    next_line_opt = Some(idx);
                    break;
                }
            }

            match next_line_opt {
                Some(next_idx) => {
                    current_line_idx = next_idx;
                }
                None => {
                    let first_line = &lines[first_line_idx];
                    if e_idx == first_line.start.index {
                        emitter.close_path();
                    }
                    break;
                }
            }
        }
    }

    emitter.stroke();
    Ok(())
}

fn add_segment<E: DrawEmitter>(
    start_point: &DucPoint,
    end_point: &DucPoint,
    start_handle: &Option<GeometricPoint>,
    end_handle: &Option<GeometricPoint>,
    emitter: &mut E,
) -> ConversionResult<()> {
    match (start_handle, end_handle) {
        (Some(start_h), Some(end_h))
            if start_h.x.is_finite()
                && start_h.y.is_finite()
                && end_h.x.is_finite()
                && end_h.y.is_finite() =>
        {
            emitter.bezier_curve_to(
                start_h.x,
                start_h.y,
                end_h.x,
                end_h.y,
                end_point.x,
                end_point.y,
            );
        }
        _ if start_handle.is_some() || end_handle.is_some() => {
            if let Some(h) = start_handle.as_ref().or(end_handle.as_ref()) {
                // Convert quadratic to cubic
                let cp1_x = start_point.x + (2.0 / 3.0) * (h.x - start_point.x);
                let cp1_y = start_point.y + (2.0 / 3.0) * (h.y - start_point.y);
                let cp2_x = end_point.x + (2.0 / 3.0) * (h.x - end_point.x);
                let cp2_y = end_point.y + (2.0 / 3.0) * (h.y - end_point.y);

                emitter.bezier_curve_to(
                    cp1_x,
                    cp1_y,
                    cp2_x,
                    cp2_y,
                    end_point.x,
                    end_point.y,
                );
            } else {
                emitter.line_to(end_point.x, end_point.y);
            }
        }
        _ => {
            emitter.line_to(end_point.x, end_point.y);
        }
    }
    Ok(())
}

fn get_trimmed_linear_points(
    linear: &DucLinearElement,
    points: &[DucPoint],
    line_width: f64,
) -> Vec<DucPoint> {
    if points.len() < 2 {
        return points.to_vec();
    }

    let start_clearance = linear
        .linear_base
        .start_binding
        .as_ref()
        .and_then(|binding| binding.head.as_ref())
        .and_then(|head| head.head_type.map(|head_type| (head_type, head.size)))
        .map(|(head_type, size)| get_line_head_clearance(head_type, line_width, size))
        .unwrap_or(0.0);

    let end_clearance = linear
        .linear_base
        .end_binding
        .as_ref()
        .and_then(|binding| binding.head.as_ref())
        .and_then(|head| head.head_type.map(|head_type| (head_type, head.size)))
        .map(|(head_type, size)| get_line_head_clearance(head_type, line_width, size))
        .unwrap_or(0.0);

    if start_clearance <= 0.0 && end_clearance <= 0.0 {
        return points.to_vec();
    }

    let mut trimmed = points.to_vec();
    if start_clearance > 0.0 {
        trimmed[0] = trim_endpoint_point(linear, points, 0, start_clearance);
    }
    if end_clearance > 0.0 {
        let last_index = points.len() - 1;
        trimmed[last_index] = trim_endpoint_point(linear, points, last_index, end_clearance);
    }

    trimmed
}

fn get_line_head_clearance(head_type: LINE_HEAD, line_width: f64, size_scale: f64) -> f64 {
    let normalized_size = if size_scale.is_finite() && size_scale > 0.0 {
        size_scale
    } else {
        1.0
    };
    let width = if line_width.is_finite() && line_width > 0.0 {
        line_width
    } else {
        1.0
    };
    let length = (width * 4.0).max(8.0) * normalized_size;

    match head_type {
        LINE_HEAD::CIRCLE_OUTLINED => length * 0.28 + width * 0.2,
        LINE_HEAD::TRIANGLE_OUTLINED | LINE_HEAD::DIAMOND_OUTLINED => {
            length * 0.95 + width * 0.5
        }
        _ => 0.0,
    }
}

fn trim_endpoint_point(
    linear: &DucLinearElement,
    points: &[DucPoint],
    point_index: usize,
    distance: f64,
) -> DucPoint {
    let point = &points[point_index];
    let interior = get_endpoint_interior_vector(linear, points, point_index);
    trim_point_along_vector(point, interior, distance)
}

fn trim_point_along_vector(point: &DucPoint, direction: (f64, f64), distance: f64) -> DucPoint {
    let direction_length = (direction.0 * direction.0 + direction.1 * direction.1).sqrt();
    if direction_length <= 0.001 {
        return point.clone();
    }

    let normalized = normalize_vector(direction.0, direction.1);
    let amount = distance.min((direction_length - 0.5).max(0.0));
    let mut trimmed = point.clone();
    trimmed.x += normalized.0 * amount;
    trimmed.y += normalized.1 * amount;
    trimmed
}

fn get_endpoint_interior_vector(
    linear: &DucLinearElement,
    points: &[DucPoint],
    point_index: usize,
) -> (f64, f64) {
    let point = &points[point_index];
    let tip = (point.x, point.y);
    let Some(line) = get_endpoint_line(linear, points, point_index) else {
        let fallback_index = if point_index == 0 {
            1
        } else {
            points.len().saturating_sub(2)
        };
        let fallback = points.get(fallback_index).unwrap_or(point);
        return (fallback.x - tip.0, fallback.y - tip.1);
    };

    let is_start_ref = line.start.index == point_index as i32;
    let endpoint_ref = if is_start_ref { &line.start } else { &line.end };
    let neighbor_ref = if is_start_ref { &line.end } else { &line.start };

    if let Some(handle) = endpoint_ref
        .handle
        .as_ref()
        .or(neighbor_ref.handle.as_ref())
    {
        return (handle.x - tip.0, handle.y - tip.1);
    }

    let neighbor = points.get(neighbor_ref.index as usize).unwrap_or(point);
    (neighbor.x - tip.0, neighbor.y - tip.1)
}

fn get_endpoint_line<'a>(
    linear: &'a DucLinearElement,
    points: &[DucPoint],
    point_index: usize,
) -> Option<&'a DucLine> {
    let lines = &linear.linear_base.lines;
    let preferred_neighbor = if point_index == 0 {
        1
    } else {
        points.len() as i32 - 2
    };
    let point_index = point_index as i32;

    lines
        .iter()
        .find(|line| {
            (line.start.index == point_index && line.end.index == preferred_neighbor)
                || (line.end.index == point_index && line.start.index == preferred_neighbor)
        })
        .or_else(|| {
            lines
                .iter()
                .find(|line| line.start.index == point_index || line.end.index == point_index)
        })
}

fn normalize_vector(x: f64, y: f64) -> (f64, f64) {
    let length = (x * x + y * y).sqrt();
    if length < 0.001 {
        (1.0, 0.0)
    } else {
        (x / length, y / length)
    }
}

fn get_line_head_reference(
    linear: &DucLinearElement,
    points: &[DucPoint],
    point_index: usize,
) -> (Point2D, Point2D) {
    let point = &points[point_index];
    let tip = Point2D { x: point.x, y: point.y };
    let interior_vector = get_endpoint_interior_vector(linear, points, point_index);
    let interior = normalize_vector(interior_vector.0, interior_vector.1);

    (tip, Point2D { x: tip.x + interior.0, y: tip.y + interior.1 })
}

fn render_line_heads<E: DrawEmitter>(
    linear: &DucLinearElement,
    points: &[DucPoint],
    line_width: f64,
    emitter: &mut E,
) -> ConversionResult<()> {
    if points.len() < 2 {
        return Ok(());
    }

    let Some(stroke) = linear.linear_base.base.styles.stroke.first() else {
        return Ok(());
    };
    if !stroke.content.visible || stroke.content.src.trim().is_empty() {
        return Ok(());
    }

    if let Some(binding) = &linear.linear_base.start_binding {
        if let Some(head) = &binding.head {
            if let Some(head_type) = head.head_type {
                let (tip, from) = get_line_head_reference(linear, points, 0);
                draw_single_line_head(
                    head_type,
                    tip,
                    from,
                    line_width,
                    &stroke.content.src,
                    head.size,
                    emitter,
                );
            }
        }
    }

    if let Some(binding) = &linear.linear_base.end_binding {
        if let Some(head) = &binding.head {
            if let Some(head_type) = head.head_type {
                let end_index = points.len() - 1;
                let (tip, from) = get_line_head_reference(linear, points, end_index);
                draw_single_line_head(
                    head_type,
                    tip,
                    from,
                    line_width,
                    &stroke.content.src,
                    head.size,
                    emitter,
                );
            }
        }
    }

    Ok(())
}

fn parse_color(color_src: &str) -> Option<u32> {
    if color_src.trim().is_empty() || color_src == "transparent" {
        return None;
    }
    let color = BigColor::new(color_src);
    let rgb = color.to_rgb();
    Some(((rgb.r as u32) << 24) | ((rgb.g as u32) << 16) | ((rgb.b as u32) << 8) | 255)
}

fn get_line_head_angle(head_type: LINE_HEAD, tip: Point2D, from: Point2D) -> f64 {
    let base_angle = (tip.y - from.y).atan2(tip.x - from.x);
    match head_type {
        LINE_HEAD::REVERSED_ARROW
        | LINE_HEAD::REVERSED_TRIANGLE
        | LINE_HEAD::REVERSED_TRIANGLE_OUTLINED => base_angle + PI,
        _ => base_angle,
    }
}

fn point_from_angle(point: Point2D, angle: f64, distance: f64) -> Point2D {
    Point2D {
        x: point.x + angle.cos() * distance,
        y: point.y + angle.sin() * distance,
    }
}

fn offset_perpendicular(point: Point2D, angle: f64, distance: f64) -> Point2D {
    Point2D {
        x: point.x + (angle + PI / 2.0).cos() * distance,
        y: point.y + (angle + PI / 2.0).sin() * distance,
    }
}

fn draw_single_line_head<E: DrawEmitter>(
    head_type: LINE_HEAD,
    tip: Point2D,
    from: Point2D,
    line_width: f64,
    color_src: &str,
    size_scale: f64,
    emitter: &mut E,
) {
    let Some(rgba) = parse_color(color_src) else {
        return;
    };

    let line_width = if line_width.is_finite() && line_width > 0.0 {
        line_width
    } else {
        1.0
    };
    let normalized_size = if size_scale.is_finite() && size_scale > 0.0 {
        size_scale
    } else {
        1.0
    };

    let angle = get_line_head_angle(head_type, tip, from);
    let length = (line_width * 4.0).max(8.0) * normalized_size;
    let width = (line_width * 3.0).max(6.0) * normalized_size;
    let back = point_from_angle(tip, angle + PI, length);
    let middle = point_from_angle(tip, angle + PI, length * 0.5);
    let left = offset_perpendicular(back, angle, width * 0.5);
    let right = offset_perpendicular(back, angle, -width * 0.5);

    emitter.save();
    emitter.set_fill_color(rgba);
    emitter.set_stroke_color(rgba);
    emitter.set_line_width(line_width as f32);
    emitter.set_line_cap(0);
    emitter.set_line_join(0);

    match head_type {
        LINE_HEAD::BAR => {
            let p1 = offset_perpendicular(tip, angle, (width * 1.15) * 0.5);
            let p2 = offset_perpendicular(tip, angle, -(width * 1.15) * 0.5);
            emitter.move_to(p1.x, p1.y);
            emitter.line_to(p2.x, p2.y);
            emitter.stroke();
        }
        LINE_HEAD::CIRCLE | LINE_HEAD::CIRCLE_OUTLINED => {
            let radius = length * 0.32;
            let kappa = 0.552_284_749_830_793_6;
            let c = radius * kappa;
            emitter.move_to(tip.x + radius, tip.y);
            emitter.bezier_curve_to(tip.x + radius, tip.y + c, tip.x + c, tip.y + radius, tip.x, tip.y + radius);
            emitter.bezier_curve_to(tip.x - c, tip.y + radius, tip.x - radius, tip.y + c, tip.x - radius, tip.y);
            emitter.bezier_curve_to(tip.x - radius, tip.y - c, tip.x - c, tip.y - radius, tip.x, tip.y - radius);
            emitter.bezier_curve_to(tip.x + c, tip.y - radius, tip.x + radius, tip.y - c, tip.x + radius, tip.y);
            emitter.close_path();
            if head_type == LINE_HEAD::CIRCLE {
                emitter.fill(false);
            } else {
                emitter.stroke();
            }
        }
        LINE_HEAD::DIAMOND | LINE_HEAD::DIAMOND_OUTLINED => {
            let far = point_from_angle(tip, angle + PI, length * 1.15);
            let diamond_left = offset_perpendicular(middle, angle, width * 0.55);
            let diamond_right = offset_perpendicular(middle, angle, -width * 0.55);
            emitter.move_to(tip.x, tip.y);
            emitter.line_to(diamond_left.x, diamond_left.y);
            emitter.line_to(far.x, far.y);
            emitter.line_to(diamond_right.x, diamond_right.y);
            emitter.close_path();
            if head_type == LINE_HEAD::DIAMOND {
                emitter.fill(false);
            } else {
                emitter.stroke();
            }
        }
        LINE_HEAD::CROSS => {
            let cross_len = width * 0.7;
            let p1 = offset_perpendicular(tip, angle + PI / 4.0, cross_len * 0.5);
            let p2 = offset_perpendicular(tip, angle + PI / 4.0, -cross_len * 0.5);
            let p3 = offset_perpendicular(tip, angle - PI / 4.0, cross_len * 0.5);
            let p4 = offset_perpendicular(tip, angle - PI / 4.0, -cross_len * 0.5);
            emitter.move_to(p1.x, p1.y);
            emitter.line_to(p2.x, p2.y);
            emitter.move_to(p3.x, p3.y);
            emitter.line_to(p4.x, p4.y);
            emitter.stroke();
        }
        LINE_HEAD::TRIANGLE
        | LINE_HEAD::TRIANGLE_OUTLINED
        | LINE_HEAD::REVERSED_TRIANGLE
        | LINE_HEAD::REVERSED_TRIANGLE_OUTLINED => {
            emitter.move_to(tip.x, tip.y);
            emitter.line_to(left.x, left.y);
            emitter.line_to(right.x, right.y);
            emitter.close_path();
            let is_filled = head_type != LINE_HEAD::TRIANGLE_OUTLINED
                && head_type != LINE_HEAD::REVERSED_TRIANGLE_OUTLINED;
            if is_filled {
                emitter.fill(false);
            } else {
                emitter.stroke();
            }
        }
        LINE_HEAD::ARROW | LINE_HEAD::REVERSED_ARROW => {
            emitter.move_to(left.x, left.y);
            emitter.line_to(tip.x, tip.y);
            emitter.line_to(right.x, right.y);
            emitter.stroke();
        }
        _ => {}
    }

    emitter.restore();
}
