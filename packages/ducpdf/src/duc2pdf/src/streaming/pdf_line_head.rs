//! PDF Line Head Renderer
//!
//! This module renders line heads (arrows, triangles, etc.) at line endpoints.
//! It translates the Pixi line head logic to PDF path operations.
use crate::ConversionResult;
use bigcolor::BigColor;
use duc::types::LINE_HEAD;
use hipdf::lopdf::{content::Operation, Object};
use std::f64::consts::PI;

pub struct PdfLineHeadRenderer;

#[derive(Clone, Copy)]
struct Point2D {
    x: f64,
    y: f64,
}

impl PdfLineHeadRenderer {
    /// Render a line head using the same local DUC-space geometry as the Pixi renderer.
    pub fn render_line_head(
        head_type: LINE_HEAD,
        tip: (f64, f64),
        from: (f64, f64),
        line_width: f64,
        color_src: &str,
        size_scale: f64,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        let Some((r, g, b)) = Self::parse_color(color_src) else {
            return Ok(ops);
        };

        let tip = Point2D { x: tip.0, y: tip.1 };
        let from = Point2D {
            x: from.0,
            y: from.1,
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

        let angle = Self::get_line_head_angle(head_type, tip, from);
        let length = (line_width * 4.0).max(8.0) * normalized_size;
        let width = (line_width * 3.0).max(6.0) * normalized_size;
        let back = Self::point_from_angle(tip, angle + PI, length);
        let middle = Self::point_from_angle(tip, angle + PI, length * 0.5);
        let left = Self::offset_perpendicular(back, angle, width * 0.5);
        let right = Self::offset_perpendicular(back, angle, -width * 0.5);

        ops.push(Operation::new("q", vec![]));
        ops.push(Operation::new(
            "RG",
            vec![Object::Real(r), Object::Real(g), Object::Real(b)],
        ));
        ops.push(Operation::new(
            "rg",
            vec![Object::Real(r), Object::Real(g), Object::Real(b)],
        ));
        ops.push(Operation::new("w", vec![Object::Real(line_width as f32)]));
        ops.push(Operation::new("J", vec![Object::Integer(0)]));
        ops.push(Operation::new("j", vec![Object::Integer(0)]));
        ops.push(Operation::new(
            "d",
            vec![Object::Array(Vec::new()), Object::Real(0.0)],
        ));

        match head_type {
            LINE_HEAD::BAR => {
                Self::draw_bar_head(&mut ops, tip, angle, width * 1.15);
            }
            LINE_HEAD::CIRCLE | LINE_HEAD::CIRCLE_OUTLINED => {
                Self::draw_circle_head(
                    &mut ops,
                    tip,
                    length * 0.32,
                    head_type == LINE_HEAD::CIRCLE,
                );
            }
            LINE_HEAD::DIAMOND | LINE_HEAD::DIAMOND_OUTLINED => {
                let far = Self::point_from_angle(tip, angle + PI, length * 1.15);
                let diamond_left = Self::offset_perpendicular(middle, angle, width * 0.55);
                let diamond_right = Self::offset_perpendicular(middle, angle, -width * 0.55);
                Self::draw_polygon_head(
                    &mut ops,
                    &[tip, diamond_left, far, diamond_right],
                    head_type == LINE_HEAD::DIAMOND,
                );
            }
            LINE_HEAD::CROSS => {
                Self::draw_cross_head(&mut ops, tip, angle, width * 0.7);
            }
            LINE_HEAD::TRIANGLE
            | LINE_HEAD::TRIANGLE_OUTLINED
            | LINE_HEAD::REVERSED_TRIANGLE
            | LINE_HEAD::REVERSED_TRIANGLE_OUTLINED => {
                Self::draw_polygon_head(
                    &mut ops,
                    &[tip, left, right],
                    head_type != LINE_HEAD::TRIANGLE_OUTLINED
                        && head_type != LINE_HEAD::REVERSED_TRIANGLE_OUTLINED,
                );
            }
            LINE_HEAD::CONE => {
                Self::draw_cone_head(&mut ops, tip, angle, length, width, false);
            }
            LINE_HEAD::HALF_CONE => {
                Self::draw_cone_head(&mut ops, tip, angle, length, width, true);
            }
            LINE_HEAD::ARROW | LINE_HEAD::REVERSED_ARROW => {
                Self::draw_open_arrow_head(&mut ops, tip, angle, length, width);
            }
            LINE_HEAD::OPEN_ARROW => {
                Self::draw_slash_head(&mut ops, tip, angle, length);
            }
        }

        ops.push(Operation::new("Q", vec![]));

        Ok(ops)
    }

    fn parse_color(color_src: &str) -> Option<(f32, f32, f32)> {
        if color_src.trim().is_empty() || color_src == "transparent" {
            return None;
        }

        let color = BigColor::new(color_src);
        let rgb = color.to_rgb();
        Some((
            rgb.r as f32 / 255.0,
            rgb.g as f32 / 255.0,
            rgb.b as f32 / 255.0,
        ))
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

    fn move_to(ops: &mut Vec<Operation>, point: Point2D) {
        ops.push(Operation::new(
            "m",
            vec![
                Object::Real(point.x as f32),
                Object::Real((-point.y) as f32),
            ],
        ));
    }

    fn line_to(ops: &mut Vec<Operation>, point: Point2D) {
        ops.push(Operation::new(
            "l",
            vec![
                Object::Real(point.x as f32),
                Object::Real((-point.y) as f32),
            ],
        ));
    }

    fn draw_open_arrow_head(
        ops: &mut Vec<Operation>,
        tip: Point2D,
        angle: f64,
        length: f64,
        width: f64,
    ) {
        let back = Self::point_from_angle(tip, angle + PI, length);
        let left = Self::offset_perpendicular(back, angle, width * 0.5);
        let right = Self::offset_perpendicular(back, angle, -width * 0.5);

        Self::move_to(ops, tip);
        Self::line_to(ops, left);
        Self::move_to(ops, tip);
        Self::line_to(ops, right);
        ops.push(Operation::new("S", vec![]));
    }

    fn draw_slash_head(ops: &mut Vec<Operation>, tip: Point2D, angle: f64, length: f64) {
        let slash_angle = angle - PI / 3.0;
        let half_length = length * 0.48;
        let a = Self::point_from_angle(tip, slash_angle, half_length);
        let b = Self::point_from_angle(tip, slash_angle + PI, half_length);

        Self::move_to(ops, a);
        Self::line_to(ops, b);
        ops.push(Operation::new("S", vec![]));
    }

    fn draw_polygon_head(ops: &mut Vec<Operation>, points: &[Point2D], filled: bool) {
        if points.is_empty() {
            return;
        }

        Self::move_to(ops, points[0]);
        for point in &points[1..] {
            Self::line_to(ops, *point);
        }
        ops.push(Operation::new("h", vec![]));
        ops.push(Operation::new(if filled { "B" } else { "S" }, vec![]));
    }

    fn draw_cone_head(
        ops: &mut Vec<Operation>,
        tip: Point2D,
        angle: f64,
        length: f64,
        width: f64,
        half_only: bool,
    ) {
        let inner = Self::point_from_angle(tip, angle + PI, length * 0.9);
        let center_base = Self::point_from_angle(tip, angle + PI, length * 0.08);
        let upper = Self::offset_perpendicular(tip, angle, width * 0.58);
        let lower = Self::offset_perpendicular(tip, angle, -width * 0.58);

        Self::move_to(ops, center_base);
        Self::line_to(ops, upper);
        Self::line_to(ops, inner);
        ops.push(Operation::new("h", vec![]));

        if !half_only {
            Self::move_to(ops, center_base);
            Self::line_to(ops, lower);
            Self::line_to(ops, inner);
            ops.push(Operation::new("h", vec![]));
        }

        ops.push(Operation::new("S", vec![]));
    }

    fn draw_circle_head(ops: &mut Vec<Operation>, center: Point2D, radius: f64, filled: bool) {
        ops.extend(Self::create_circle(center, radius, filled));
    }

    fn draw_bar_head(ops: &mut Vec<Operation>, tip: Point2D, angle: f64, size: f64) {
        let left = Self::offset_perpendicular(tip, angle, size * 0.5);
        let right = Self::offset_perpendicular(tip, angle, -size * 0.5);

        Self::move_to(ops, left);
        Self::line_to(ops, right);
        ops.push(Operation::new("S", vec![]));
    }

    fn draw_cross_head(ops: &mut Vec<Operation>, tip: Point2D, angle: f64, size: f64) {
        let a = Self::point_from_angle(tip, angle + PI / 4.0, size);
        let b = Self::point_from_angle(tip, angle + PI + PI / 4.0, size);
        let c = Self::point_from_angle(tip, angle - PI / 4.0, size);
        let d = Self::point_from_angle(tip, angle + PI - PI / 4.0, size);

        Self::move_to(ops, a);
        Self::line_to(ops, b);
        Self::move_to(ops, c);
        Self::line_to(ops, d);
        ops.push(Operation::new("S", vec![]));
    }

    /// Create a circle using Bezier curves
    fn create_circle(center: Point2D, radius: f64, filled: bool) -> Vec<Operation> {
        let mut ops = Vec::new();
        let cx = center.x;
        let cy = -center.y;

        // Magic number for Bezier circle approximation
        let kappa = 0.5522848 * radius;

        // Start at rightmost point
        ops.push(Operation::new(
            "m",
            vec![Object::Real((cx + radius) as f32), Object::Real(cy as f32)],
        ));

        // Top right curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real((cx + radius) as f32),
                Object::Real((cy + kappa) as f32),
                Object::Real((cx + kappa) as f32),
                Object::Real((cy + radius) as f32),
                Object::Real(cx as f32),
                Object::Real((cy + radius) as f32),
            ],
        ));

        // Top left curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real((cx - kappa) as f32),
                Object::Real((cy + radius) as f32),
                Object::Real((cx - radius) as f32),
                Object::Real((cy + kappa) as f32),
                Object::Real((cx - radius) as f32),
                Object::Real(cy as f32),
            ],
        ));

        // Bottom left curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real((cx - radius) as f32),
                Object::Real((cy - kappa) as f32),
                Object::Real((cx - kappa) as f32),
                Object::Real((cy - radius) as f32),
                Object::Real(cx as f32),
                Object::Real((cy - radius) as f32),
            ],
        ));

        // Bottom right curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real((cx + kappa) as f32),
                Object::Real((cy - radius) as f32),
                Object::Real((cx + radius) as f32),
                Object::Real((cy - kappa) as f32),
                Object::Real((cx + radius) as f32),
                Object::Real(cy as f32),
            ],
        ));

        ops.push(Operation::new("h", vec![])); // Close path

        if filled {
            ops.push(Operation::new("B", vec![])); // Fill and stroke
        } else {
            ops.push(Operation::new("S", vec![])); // Stroke only
        }

        ops
    }
}
