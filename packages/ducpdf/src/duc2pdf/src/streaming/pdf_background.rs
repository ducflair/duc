/// PDF Background Renderer
///
/// This module handles background (fill) rendering for PDF, including:
/// - Multiple backgrounds with different colors
/// - Path overrides for selective background application
/// - Proper fill rules (even-odd for complex paths)
/// - Color parsing and opacity
use crate::ConversionResult;
use bigcolor::BigColor;
use duc::types::{DucPath, ElementBackground, ElementContentBase};
use hipdf::lopdf::{content::Operation, Object};
use std::collections::BTreeSet;

pub struct PdfBackgroundRenderer;

impl PdfBackgroundRenderer {
    /// Parse color from content base and return RGB values with opacity
    pub fn parse_color(content: &ElementContentBase) -> Option<(f32, f32, f32, f32)> {
        if !content.visible {
            return None;
        }

        let mut color = BigColor::new(&content.src);
        let alpha = content.opacity as f32;
        color.set_alpha(alpha);

        // Get RGB components
        let rgb = color.to_rgb();
        Some((
            rgb.r as f32 / 255.0,
            rgb.g as f32 / 255.0,
            rgb.b as f32 / 255.0,
            alpha,
        ))
    }

    /// Apply background color to PDF operations
    pub fn apply_background_color(
        background: &ElementBackground,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        if !background.content.visible {
            return Ok(ops);
        }

        if let Some((r, g, b, _alpha)) = Self::parse_color(&background.content) {
            // Set fill color (RGB)
            ops.push(Operation::new(
                "rg",
                vec![Object::Real(r), Object::Real(g), Object::Real(b)],
            ));
        }

        Ok(ops)
    }

    /// Render linear element backgrounds with path overrides
    ///
    /// This handles selective background application based on line indices.
    /// Paths with invisible backgrounds become holes in the fill.
    pub fn render_linear_element_backgrounds(
        default_backgrounds: &[ElementBackground],
        paths_with_indices: &[(Vec<Operation>, Vec<usize>)], // PDF ops + line indices
        path_overrides: &[DucPath],
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        if paths_with_indices.is_empty() || default_backgrounds.is_empty() {
            return Ok(ops);
        }

        // Get primary background
        let primary_background = &default_backgrounds[0];

        // Create override map for quick lookup
        let override_map: std::collections::HashMap<BTreeSet<usize>, &ElementBackground> =
            path_overrides
                .iter()
                .filter_map(|p| {
                    p.background
                        .as_ref()
                        .map(|bg| (p.line_indices.iter().map(|&i| i as usize).collect(), bg))
                })
                .collect();

        // Group paths by their final visible background color
        let mut fills_to_render: std::collections::HashMap<String, Vec<Operation>> =
            std::collections::HashMap::new();
        let mut hole_paths: Vec<Operation> = Vec::new();

        for (path_ops, line_indices) in paths_with_indices {
            let indices_set: BTreeSet<usize> = line_indices.iter().cloned().collect();
            let background = override_map
                .get(&indices_set)
                .copied()
                .unwrap_or(primary_background);

            if !background.content.visible {
                // This path is a hole
                hole_paths.extend(path_ops.clone());
            } else {
                // This path is visible
                fills_to_render
                    .entry(background.content.src.clone())
                    .or_insert_with(Vec::new)
                    .extend(path_ops.clone());
            }
        }

        // Render each visible fill group
        for (color_src, mut fill_path_ops) in fills_to_render {
            // Add holes to this fill group
            fill_path_ops.extend(hole_paths.clone());

            // Create dummy content to parse color
            let temp_content = ElementContentBase {
                src: color_src,
                visible: true,
                opacity: primary_background.content.opacity,
                preference: primary_background.content.preference,
                tiling: primary_background.content.tiling.clone(),
                hatch: None,
                image_filter: None,
            };

            if let Some((r, g, b, _alpha)) = Self::parse_color(&temp_content) {
                // Set fill color
                ops.push(Operation::new(
                    "rg",
                    vec![Object::Real(r), Object::Real(g), Object::Real(b)],
                ));

                // Add path operations
                ops.extend(fill_path_ops);

                // Fill using even-odd rule (handles holes correctly)
                ops.push(Operation::new("f*", vec![]));
            }
        }

        Ok(ops)
    }
}
