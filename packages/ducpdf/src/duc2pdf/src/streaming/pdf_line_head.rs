/// PDF Line Head Renderer
///
/// This module renders line heads (arrows, triangles, etc.) at line endpoints.
/// It translates the Vello renderer's line head logic to PDF path operations.
use crate::ConversionResult;
use duc::generated::duc::LINE_HEAD;
use hipdf::lopdf::{content::Operation, Object};
use std::f64::consts::PI;

pub struct PdfLineHeadRenderer;

impl PdfLineHeadRenderer {
    /// Render a line head at the specified position
    ///
    /// # Arguments
    /// * `head_type` - Type of line head (arrow, triangle, etc.)
    /// * `x, y` - Position of the line endpoint
    /// * `dir_x, dir_y` - Direction vector of the line
    /// * `line_width` - Width of the line
    /// * `is_start` - Whether this is the start (true) or end (false) of the line
    pub fn render_line_head(
        head_type: LINE_HEAD,
        x: f64,
        y: f64,
        dir_x: f64,
        dir_y: f64,
        line_width: f64,
        is_start: bool,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Calculate angle from direction
        let angle = f64::atan2(dir_y, dir_x);

        // For start heads, rotate 180 degrees
        let actual_angle = if is_start { angle + PI } else { angle };

        // Calculate direction unit vector
        let dir_length = (dir_x * dir_x + dir_y * dir_y).sqrt();
        let (dir_unit_x, dir_unit_y) = if dir_length > f64::EPSILON {
            (dir_x / dir_length, dir_y / dir_length)
        } else {
            (1.0, 0.0)
        };

        // Calculate base offset for different head types
        let base_offset = match head_type {
            LINE_HEAD::ARROW | LINE_HEAD::REVERSED_ARROW => 0.0,
            LINE_HEAD::TRIANGLE | LINE_HEAD::TRIANGLE_OUTLINED => -1.6 * line_width,
            LINE_HEAD::CROSS | LINE_HEAD::OPEN_ARROW => 0.0,
            LINE_HEAD::REVERSED_TRIANGLE | LINE_HEAD::REVERSED_TRIANGLE_OUTLINED => {
                -2.8 * line_width
            }
            LINE_HEAD::CIRCLE | LINE_HEAD::CIRCLE_OUTLINED => -1.7 * line_width,
            LINE_HEAD::DIAMOND | LINE_HEAD::DIAMOND_OUTLINED => -0.6 * line_width,
            LINE_HEAD::BAR => 0.0,
            LINE_HEAD::CONE | LINE_HEAD::HALF_CONE => -0.4 * line_width,
            _ => 0.0,
        };

        // Calculate offset direction
        let (offset_dir_x, offset_dir_y) = if is_start {
            (-dir_unit_x, -dir_unit_y)
        } else {
            (dir_unit_x, dir_unit_y)
        };

        // Apply offset
        let final_x = x + (base_offset * offset_dir_x);
        let final_y = y + (base_offset * offset_dir_y);

        // Save graphics state
        ops.push(Operation::new("q", vec![]));

        // Transform: translate to position, then rotate
        let cos_angle = actual_angle.cos();
        let sin_angle = actual_angle.sin();

        ops.push(Operation::new(
            "cm",
            vec![
                Object::Real(cos_angle as f32),
                Object::Real(sin_angle as f32),
                Object::Real(-sin_angle as f32),
                Object::Real(cos_angle as f32),
                Object::Real(final_x as f32),
                Object::Real(final_y as f32),
            ],
        ));

        // Render specific head type
        ops.extend(Self::render_head_shape(head_type, line_width)?);

        // Restore graphics state
        ops.push(Operation::new("Q", vec![]));

        Ok(ops)
    }

    /// Render the specific head shape
    fn render_head_shape(
        head_type: LINE_HEAD,
        line_width: f64,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        match head_type {
            LINE_HEAD::ARROW => {
                // Simple arrow: two lines forming a V
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("S", vec![]));
            }

            LINE_HEAD::BAR => {
                // Perpendicular bar
                let size = line_width * 2.0;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real((-size / 2.0) as f32)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(0.0), Object::Real((size / 2.0) as f32)],
                ));
                ops.push(Operation::new("S", vec![]));
            }

            LINE_HEAD::CIRCLE => {
                // Filled circle
                let radius = line_width * 1.5;
                ops.extend(Self::create_circle(0.0, 0.0, radius, true)?);
            }

            LINE_HEAD::CIRCLE_OUTLINED => {
                // Outlined circle
                let radius = line_width * 1.5;
                ops.extend(Self::create_circle(0.0, 0.0, radius, false)?);
            }

            LINE_HEAD::TRIANGLE => {
                // Filled triangle
                let size = line_width * 3.0;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("B", vec![])); // Fill and stroke
            }

            LINE_HEAD::TRIANGLE_OUTLINED => {
                // Outlined triangle
                let size = line_width * 3.0;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("S", vec![])); // Stroke only
            }

            LINE_HEAD::DIAMOND => {
                // Filled diamond
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(-size as f32), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("B", vec![])); // Fill and stroke
            }

            LINE_HEAD::DIAMOND_OUTLINED => {
                // Outlined diamond
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(-size as f32), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("S", vec![])); // Stroke only
            }

            LINE_HEAD::CROSS => {
                // X shape
                let size = line_width * 2.0;
                ops.push(Operation::new(
                    "m",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((size / 2.0) as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "m",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((size / 2.0) as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("S", vec![]));
            }

            LINE_HEAD::OPEN_ARROW => {
                // Open V arrow
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real((-size / 2.0) as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("S", vec![]));
            }

            LINE_HEAD::REVERSED_ARROW => {
                // Reversed arrow (points backward)
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![
                        Object::Real(size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(size as f32), Object::Real((size / 2.0) as f32)],
                ));
                ops.push(Operation::new("S", vec![]));
            }

            LINE_HEAD::REVERSED_TRIANGLE => {
                // Reversed filled triangle
                let size = line_width * 3.0;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(size as f32), Object::Real((size / 2.0) as f32)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("B", vec![]));
            }

            LINE_HEAD::REVERSED_TRIANGLE_OUTLINED => {
                // Reversed outlined triangle
                let size = line_width * 3.0;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(size as f32), Object::Real((size / 2.0) as f32)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("S", vec![]));
            }

            LINE_HEAD::CONE => {
                // Filled cone
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((-size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("B", vec![]));
            }

            LINE_HEAD::HALF_CONE => {
                // Half cone (one side only)
                let size = line_width * 2.5;
                ops.push(Operation::new(
                    "m",
                    vec![Object::Real(0.0), Object::Real(0.0)],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![
                        Object::Real(-size as f32),
                        Object::Real((size / 2.0) as f32),
                    ],
                ));
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(-size as f32), Object::Real(0.0)],
                ));
                ops.push(Operation::new("h", vec![]));
                ops.push(Operation::new("B", vec![]));
            }

            _ => {
                // Unknown type - render nothing
            }
        }

        Ok(ops)
    }

    /// Create a circle using Bezier curves
    fn create_circle(
        cx: f64,
        cy: f64,
        radius: f64,
        filled: bool,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

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

        Ok(ops)
    }
}
