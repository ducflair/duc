/// PDF Stroke Renderer
///
/// This module handles stroke rendering for PDF, including:
/// - Stroke placement (inside/outside/center)
/// - Dash patterns and offsets
/// - Line caps and joins
/// - Miter limits
/// - Path offsetting for stroke placement
use crate::ConversionResult;
use duc::types::{ElementStroke, STROKE_CAP, STROKE_JOIN, STROKE_PLACEMENT};
use hipdf::lopdf::{content::Operation, Object};

pub struct PdfStrokeRenderer;

impl PdfStrokeRenderer {
    /// Apply stroke style to PDF operations
    pub fn apply_stroke_style(stroke: &ElementStroke) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        if !stroke.content.visible {
            return Ok(ops);
        }

        // Set line width
        ops.push(Operation::new("w", vec![Object::Real(stroke.width as f32)]));

        // Set line cap style
        if let Some(cap) = stroke.style.cap {
            let cap_style = match cap {
                STROKE_CAP::BUTT => 0,
                STROKE_CAP::ROUND => 1,
                STROKE_CAP::SQUARE => 2,
            };
            ops.push(Operation::new("J", vec![Object::Integer(cap_style)]));
        }

        // Set line join style
        if let Some(join) = stroke.style.join {
            let join_style = match join {
                STROKE_JOIN::MITER => 0,
                STROKE_JOIN::ROUND => 1,
                STROKE_JOIN::BEVEL => 2,
            };
            ops.push(Operation::new("j", vec![Object::Integer(join_style)]));
        }

        // Set miter limit
        if let Some(miter_limit) = stroke.style.miter_limit {
            ops.push(Operation::new("M", vec![Object::Real(miter_limit as f32)]));
        }

        // Set dash pattern
        if let Some(dash) = &stroke.style.dash {
            let dash_array: Vec<Object> = dash.iter().map(|&v| Object::Real(v as f32)).collect();

            ops.push(Operation::new(
                "d",
                vec![
                    Object::Array(dash_array),
                    Object::Real(0.0), // Default offset of 0
                ],
            ));
        }

        Ok(ops)
    }

    /// Calculate offset for stroke placement
    pub fn get_stroke_offset(stroke: &ElementStroke) -> f64 {
        match stroke.placement {
            Some(STROKE_PLACEMENT::CENTER) => 0.0,
            Some(STROKE_PLACEMENT::OUTSIDE) => stroke.width / 2.0,
            Some(STROKE_PLACEMENT::INSIDE) => -stroke.width / 2.0,
            _ => 0.0,
        }
    }

    /// Check if stroke needs offset
    pub fn needs_stroke_offset(stroke: &ElementStroke) -> bool {
        matches!(
            stroke.placement,
            Some(STROKE_PLACEMENT::INSIDE) | Some(STROKE_PLACEMENT::OUTSIDE)
        )
    }

    /// Get maximum stroke width from a list of strokes
    pub fn get_max_width(strokes: &[ElementStroke]) -> f64 {
        strokes
            .iter()
            .map(|s| s.width)
            .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .unwrap_or(0.0)
    }
}
