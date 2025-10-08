/// PDF Linear Element Renderer
/// 
/// This module handles the rendering of DucLinearElement to PDF operations.
/// It translates the Vello renderer's BezPath logic into PDF path construction
/// commands, supporting:
/// - Straight lines and Bezier curves (quadratic and cubic)
/// - Closed and open paths
/// - Fill paths with minimal cycles (faces)
/// - Stroke paths with all segments
/// - Path overrides for selective styling

use crate::ConversionResult;
use duc::types::{DucLine, DucLinearElement, DucPoint, GeometricPoint};
use hipdf::lopdf::{Object, content::Operation};
use std::collections::{BTreeMap, HashSet};

pub struct PdfLinearRenderer;

impl PdfLinearRenderer {
    /// Stream a linear element to PDF operations
    pub fn stream_linear(linear: &DucLinearElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        let points = &linear.linear_base.points;
        let lines = &linear.linear_base.lines;
        
        if points.is_empty() || lines.is_empty() {
            return Ok(ops);
        }
        
        // Create stroke path (all segments)
        let stroke_path_ops = Self::create_stroke_path(points, lines)?;
        
        // Create fill paths (minimal closed loops only)
        let fill_paths_ops = Self::create_fill_paths(points, lines)?;
        
        // Determine what to render based on styles
        let has_background = !linear.linear_base.base.styles.background.is_empty();
        let has_stroke = !linear.linear_base.base.styles.stroke.is_empty();
        
        if has_background && !fill_paths_ops.is_empty() {
            // Render fills first
            ops.extend(fill_paths_ops);
            
            if has_stroke {
                // Then render strokes on top
                ops.extend(stroke_path_ops);
            }
        } else if has_stroke {
            // Stroke only
            ops.extend(stroke_path_ops);
        }
        
        Ok(ops)
    }

    /// Transform a Duc point from the top-left DUC system to PDF local coordinates
    /// (origin at top-left after the element translation, positive Y upwards in PDF)
    fn transform_point_to_pdf(point: &DucPoint) -> (f64, f64) {
        (point.x, -point.y)
    }

    /// Transform a geometric control point to PDF local coordinates
    fn transform_handle_to_pdf(handle: &GeometricPoint) -> (f64, f64) {
        (handle.x, -handle.y)
    }
    
    /// Create PDF path operations for stroking (includes all line segments)
    fn create_stroke_path(points: &[DucPoint], lines: &[DucLine]) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        if points.is_empty() || lines.is_empty() {
            return Ok(ops);
        }
        
        // Track which lines have been consumed
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
                
                // Validate indices
                let s_idx = line.start.index;
                let e_idx = line.end.index;
                
                if s_idx < 0 || e_idx < 0 || s_idx >= points.len() as i32 || e_idx >= points.len() as i32 {
                    break;
                }
                
                if !subpath_started {
                    // Start new subpath
                    let start_point = &points[s_idx as usize];
                    let (start_x, start_y) = Self::transform_point_to_pdf(start_point);
                    ops.push(Operation::new(
                        "m",
                        vec![Object::Real(start_x as f32), Object::Real(start_y as f32)],
                    ));
                    subpath_started = true;
                }
                
                // Add segment (line or curve)
                let start_point = &points[s_idx as usize];
                let end_point = &points[e_idx as usize];
                
                ops.extend(Self::add_segment(
                    start_point,
                    end_point,
                    &line.start.handle,
                    &line.end.handle,
                )?);
                
                // Try to find next connected line
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
                        // Check if we should close the path
                        let first_line = &lines[first_line_idx];
                        if e_idx == first_line.start.index {
                            ops.push(Operation::new("h", vec![])); // Close path
                        }
                        break;
                    }
                }
            }
        }
        
        // Stroke the path
        ops.push(Operation::new("S", vec![]));
        
        Ok(ops)
    }
    
    /// Create PDF path operations for filling (minimal closed loops only)
    fn create_fill_paths(points: &[DucPoint], lines: &[DucLine]) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        if points.is_empty() || lines.is_empty() {
            return Ok(ops);
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
        
        // Find all minimal cycles
        for start_node_idx in adj.keys().copied() {
            let mut stack = vec![(start_node_idx, vec![start_node_idx], vec![])];
            
            while let Some((current_node_idx, path, used_line_indices)) = stack.pop() {
                if path.len() > points.len() {
                    continue;
                }
                
                if let Some(neighbors) = adj.get(&current_node_idx) {
                    for (neighbor_idx, _line, line_idx) in neighbors {
                        // Avoid immediate backtracking
                        if path.len() >= 2 && *neighbor_idx == path[path.len() - 2] {
                            continue;
                        }
                        
                        // Found a cycle
                        if *neighbor_idx == start_node_idx && path.len() >= 2 {
                            let cycle_nodes = path.clone();
                            let mut cycle_line_indices = used_line_indices.clone();
                            cycle_line_indices.push(*line_idx);
                            
                            // Check if cycle is minimal (no shortcuts)
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
                                    
                                    // Render this cycle
                                    let mut render_path_nodes = cycle_nodes;
                                    render_path_nodes.push(start_node_idx);
                                    
                                    // Start path at first node
                                    let start_point = &points[render_path_nodes[0] as usize];
                                    let (start_x, start_y) = Self::transform_point_to_pdf(start_point);
                                    ops.push(Operation::new(
                                        "m",
                                        vec![Object::Real(start_x as f32), Object::Real(start_y as f32)],
                                    ));
                                    
                                    // Add segments for cycle
                                    for i in 0..(render_path_nodes.len() - 1) {
                                        let p1_idx = render_path_nodes[i];
                                        let p2_idx = render_path_nodes[i + 1];
                                        
                                        if let Some((_, connecting_line, _)) = adj.get(&p1_idx)
                                            .and_then(|n| n.iter().find(|(idx, _, _)| *idx == p2_idx)) 
                                        {
                                            let p1 = &points[p1_idx as usize];
                                            let p2 = &points[p2_idx as usize];
                                            
                                            let (start_handle, end_handle) = 
                                                if connecting_line.start.index == p1_idx {
                                                    (&connecting_line.start.handle, &connecting_line.end.handle)
                                                } else {
                                                    (&connecting_line.end.handle, &connecting_line.start.handle)
                                                };
                                            
                                            ops.extend(Self::add_segment(p1, p2, start_handle, end_handle)?);
                                        }
                                    }
                                    
                                    // Close the cycle
                                    ops.push(Operation::new("h", vec![]));
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
        
        if !ops.is_empty() {
            // Fill using even-odd rule (matches Vello's EvenOdd fill)
            ops.push(Operation::new("f*", vec![])); // f* = fill with even-odd rule
        }
        
        Ok(ops)
    }
    
    /// Add a segment to the path (line or Bezier curve)
    fn add_segment(
        start_point: &DucPoint,
        end_point: &DucPoint,
        start_handle: &Option<GeometricPoint>,
        end_handle: &Option<GeometricPoint>,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        let (p0_x, p0_y) = Self::transform_point_to_pdf(start_point);
        let (p3_x, p3_y) = Self::transform_point_to_pdf(end_point);
        
        match (start_handle, end_handle) {
            // Cubic Bezier curve (both handles present)
            (Some(start_h), Some(end_h)) if start_h.x.is_finite() && start_h.y.is_finite() 
                                          && end_h.x.is_finite() && end_h.y.is_finite() => {
                let (cp1_x, cp1_y) = Self::transform_handle_to_pdf(start_h);
                let (cp2_x, cp2_y) = Self::transform_handle_to_pdf(end_h);

                if cp1_x.is_finite() && cp1_y.is_finite() && cp2_x.is_finite() && cp2_y.is_finite() {
                    ops.push(Operation::new(
                        "c",
                        vec![
                            Object::Real(cp1_x as f32),
                            Object::Real(cp1_y as f32),
                            Object::Real(cp2_x as f32),
                            Object::Real(cp2_y as f32),
                            Object::Real(p3_x as f32),
                            Object::Real(p3_y as f32),
                        ],
                    ));
                } else {
                    ops.push(Operation::new(
                        "l",
                        vec![Object::Real(p3_x as f32), Object::Real(p3_y as f32)],
                    ));
                }
            }
            // Quadratic curve (single handle) - convert to cubic
            _ if start_handle.is_some() || end_handle.is_some() => {
                if let Some(h) = start_handle.as_ref().or(end_handle.as_ref()) {
                    let (c_x, c_y) = Self::transform_handle_to_pdf(h);
                    
                    // Convert quadratic to cubic using original coordinates, then transform the result.
                    // cp1 = p0 + 2/3 * (c - p0)
                    let cp1_x_orig = start_point.x + (2.0 / 3.0) * (h.x - start_point.x);
                    let cp1_y_orig = start_point.y + (2.0 / 3.0) * (h.y - start_point.y);

                    // cp2 = p3 + 2/3 * (c - p3)
                    let cp2_x_orig = end_point.x + (2.0 / 3.0) * (h.x - end_point.x);
                    let cp2_y_orig = end_point.y + (2.0 / 3.0) * (h.y - end_point.y);

                    // Now transform the final control points to PDF coordinates
                    let (cp1_x, cp1_y) = Self::transform_handle_to_pdf(&GeometricPoint { x: cp1_x_orig, y: cp1_y_orig });
                    let (cp2_x, cp2_y) = Self::transform_handle_to_pdf(&GeometricPoint { x: cp2_x_orig, y: cp2_y_orig });
                    
                    if cp1_x.is_finite() && cp1_y.is_finite() && cp2_x.is_finite() && cp2_y.is_finite() {
                        ops.push(Operation::new(
                            "c",
                            vec![
                                Object::Real(cp1_x as f32),
                                Object::Real(cp1_y as f32),
                                Object::Real(cp2_x as f32),
                                Object::Real(cp2_y as f32),
                                Object::Real(p3_x as f32),
                                Object::Real(p3_y as f32),
                            ],
                        ));
                    } else {
                        // Fallback to straight line
                        ops.push(Operation::new(
                            "l",
                            vec![Object::Real(p3_x as f32), Object::Real(p3_y as f32)],
                        ));
                    }
                }
            }
            // Straight line
            _ => {
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(p3_x as f32), Object::Real(p3_y as f32)],
                ));
            }
        }
        
        Ok(ops)
    }
}
