use duc::types::{DucFreeDrawElement, DucPoint};
use svgtypes::{PathParser, PathSegment};

pub(crate) const UNIT_EPSILON: f64 = 1e-9;

#[derive(Debug, Clone, Copy)]
pub struct FreeDrawBounds {
    pub min_x: f64,
    pub min_y: f64,
    pub max_x: f64,
    pub max_y: f64,
}

impl FreeDrawBounds {
    #[inline]
    pub fn width(&self) -> f64 {
        (self.max_x - self.min_x).abs()
    }

    #[inline]
    pub fn height(&self) -> f64 {
        (self.max_y - self.min_y).abs()
    }
}

#[derive(Debug, Clone)]
struct PathBounds {
    min_x: f64,
    min_y: f64,
    max_x: f64,
    max_y: f64,
    valid: bool,
}

impl PathBounds {
    fn new() -> Self {
        Self {
            min_x: f64::INFINITY,
            min_y: f64::INFINITY,
            max_x: f64::NEG_INFINITY,
            max_y: f64::NEG_INFINITY,
            valid: false,
        }
    }

    fn update(&mut self, x: f64, y: f64) {
        if !x.is_finite() || !y.is_finite() {
            return;
        }

        self.min_x = self.min_x.min(x);
        self.min_y = self.min_y.min(y);
        self.max_x = self.max_x.max(x);
        self.max_y = self.max_y.max(y);
        self.valid = true;
    }

    fn into_bounds(self) -> Option<FreeDrawBounds> {
        if self.valid {
            Some(FreeDrawBounds {
                min_x: self.min_x,
                min_y: self.min_y,
                max_x: self.max_x,
                max_y: self.max_y,
            })
        } else {
            None
        }
    }
}

fn update_line_bounds(bounds: &mut PathBounds, start: (f64, f64), end: (f64, f64)) {
    bounds.update(start.0, start.1);
    bounds.update(end.0, end.1);
}

fn update_quadratic_bounds(
    bounds: &mut PathBounds,
    p0: (f64, f64),
    p1: (f64, f64),
    p2: (f64, f64),
) {
    let mut candidates = vec![0.0, 1.0];
    for t in quadratic_extrema(p0, p1, p2) {
        add_candidate(&mut candidates, t);
    }

    candidates.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    candidates.dedup_by(|a, b| (*a - *b).abs() < UNIT_EPSILON);

    for t in candidates {
        let x = evaluate_quadratic(p0.0, p1.0, p2.0, t);
        let y = evaluate_quadratic(p0.1, p1.1, p2.1, t);
        bounds.update(x, y);
    }
}

fn update_cubic_bounds(
    bounds: &mut PathBounds,
    p0: (f64, f64),
    p1: (f64, f64),
    p2: (f64, f64),
    p3: (f64, f64),
) {
    let mut candidates = vec![0.0, 1.0];
    for t in cubic_extrema(p0, p1, p2, p3, true) {
        add_candidate(&mut candidates, t);
    }
    for t in cubic_extrema(p0, p1, p2, p3, false) {
        add_candidate(&mut candidates, t);
    }

    candidates.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    candidates.dedup_by(|a, b| (*a - *b).abs() < UNIT_EPSILON);

    for t in candidates {
        let x = evaluate_cubic(p0.0, p1.0, p2.0, p3.0, t);
        let y = evaluate_cubic(p0.1, p1.1, p2.1, p3.1, t);
        bounds.update(x, y);
    }
}

fn cubic_extrema(
    p0: (f64, f64),
    p1: (f64, f64),
    p2: (f64, f64),
    p3: (f64, f64),
    use_x: bool,
) -> Vec<f64> {
    let (p0, p1, p2, p3) = if use_x {
        (p0.0, p1.0, p2.0, p3.0)
    } else {
        (p0.1, p1.1, p2.1, p3.1)
    };

    let a = -p0 + 3.0 * p1 - 3.0 * p2 + p3;
    let b = 2.0 * (p0 - 2.0 * p1 + p2);
    let c = -p0 + p1;

    solve_quadratic(a, b, c)
}

fn quadratic_extrema(p0: (f64, f64), p1: (f64, f64), p2: (f64, f64)) -> Vec<f64> {
    let mut roots = Vec::new();

    let denom_x = p0.0 - 2.0 * p1.0 + p2.0;
    let denom_y = p0.1 - 2.0 * p1.1 + p2.1;

    if denom_x.abs() > UNIT_EPSILON {
        let t = (p0.0 - p1.0) / denom_x;
        add_candidate(&mut roots, t);
    }

    if denom_y.abs() > UNIT_EPSILON {
        let t = (p0.1 - p1.1) / denom_y;
        add_candidate(&mut roots, t);
    }

    roots
}

fn add_candidate(values: &mut Vec<f64>, value: f64) {
    if value <= UNIT_EPSILON || value >= 1.0 - UNIT_EPSILON {
        return;
    }

    if values
        .iter()
        .any(|existing| (existing - value).abs() < UNIT_EPSILON)
    {
        return;
    }

    values.push(value);
}

fn solve_quadratic(a: f64, b: f64, c: f64) -> Vec<f64> {
    let mut roots = Vec::new();

    if a.abs() < UNIT_EPSILON {
        if b.abs() < UNIT_EPSILON {
            return roots;
        }

        let t = -c / b;
        if t > UNIT_EPSILON && t < 1.0 - UNIT_EPSILON {
            roots.push(t);
        }
        return roots;
    }

    let discriminant = b * b - 4.0 * a * c;
    if discriminant < -UNIT_EPSILON {
        return roots;
    }

    let sqrt_disc = discriminant.max(0.0).sqrt();
    let denom = 2.0 * a;

    let t1 = (-b + sqrt_disc) / denom;
    let t2 = (-b - sqrt_disc) / denom;

    if t1 > UNIT_EPSILON && t1 < 1.0 - UNIT_EPSILON {
        roots.push(t1);
    }

    if t2 > UNIT_EPSILON && t2 < 1.0 - UNIT_EPSILON {
        if !roots
            .iter()
            .any(|existing| (existing - t2).abs() < UNIT_EPSILON)
        {
            roots.push(t2);
        }
    }

    roots
}

fn evaluate_quadratic(p0: f64, p1: f64, p2: f64, t: f64) -> f64 {
    let mt = 1.0 - t;
    mt * mt * p0 + 2.0 * mt * t * p1 + t * t * p2
}

fn evaluate_cubic(p0: f64, p1: f64, p2: f64, p3: f64, t: f64) -> f64 {
    let mt = 1.0 - t;
    mt * mt * mt * p0 + 3.0 * mt * mt * t * p1 + 3.0 * mt * t * t * p2 + t * t * t * p3
}

/// Calculate bounding box for a freedraw element, preferring the SVG path data when available
pub(crate) fn calculate_freedraw_bbox(freedraw: &DucFreeDrawElement) -> Option<FreeDrawBounds> {
    if let Some(path) = &freedraw.svg_path {
        if let Some(bounds) = calculate_svg_path_bbox(path) {
            return Some(bounds);
        }
    }

    calculate_freedraw_point_bbox(&freedraw.points, freedraw.size)
}

fn calculate_freedraw_point_bbox(points: &[DucPoint], stroke_size: f64) -> Option<FreeDrawBounds> {
    if points.is_empty() {
        return None;
    }

    let mut min_x = f64::INFINITY;
    let mut min_y = f64::INFINITY;
    let mut max_x = f64::NEG_INFINITY;
    let mut max_y = f64::NEG_INFINITY;

    for point in points {
        if !point.x.is_finite() || !point.y.is_finite() {
            continue;
        }
        min_x = min_x.min(point.x);
        max_x = max_x.max(point.x);
        min_y = min_y.min(point.y);
        max_y = max_y.max(point.y);
    }

    if !(min_x.is_finite() && min_y.is_finite() && max_x.is_finite() && max_y.is_finite()) {
        return None;
    }

    if stroke_size > 0.0 {
        let padding = stroke_size * 0.5;
        min_x -= padding;
        min_y -= padding;
        max_x += padding;
        max_y += padding;
    }

    Some(FreeDrawBounds {
        min_x,
        min_y,
        max_x,
        max_y,
    })
}

fn calculate_svg_path_bbox(path_data: &str) -> Option<FreeDrawBounds> {
    let mut bounds = PathBounds::new();
    let mut current = (0.0, 0.0);
    let mut subpath_start = (0.0, 0.0);
    let mut prev_cubic_ctrl: Option<(f64, f64)> = None;
    let mut prev_quad_ctrl: Option<(f64, f64)> = None;

    for segment in PathParser::from(path_data) {
        let segment = segment.ok()?;
        match segment {
            PathSegment::MoveTo { abs, x, y } => {
                let dest = if abs {
                    (x, y)
                } else {
                    (current.0 + x, current.1 + y)
                };
                current = dest;
                subpath_start = dest;
                bounds.update(dest.0, dest.1);
                prev_cubic_ctrl = None;
                prev_quad_ctrl = None;
            }
            PathSegment::LineTo { abs, x, y } => {
                let dest = if abs {
                    (x, y)
                } else {
                    (current.0 + x, current.1 + y)
                };
                update_line_bounds(&mut bounds, current, dest);
                current = dest;
                prev_cubic_ctrl = None;
                prev_quad_ctrl = None;
            }
            PathSegment::HorizontalLineTo { abs, x } => {
                let dest_x = if abs { x } else { current.0 + x };
                let dest = (dest_x, current.1);
                update_line_bounds(&mut bounds, current, dest);
                current = dest;
                prev_cubic_ctrl = None;
                prev_quad_ctrl = None;
            }
            PathSegment::VerticalLineTo { abs, y } => {
                let dest_y = if abs { y } else { current.1 + y };
                let dest = (current.0, dest_y);
                update_line_bounds(&mut bounds, current, dest);
                current = dest;
                prev_cubic_ctrl = None;
                prev_quad_ctrl = None;
            }
            PathSegment::CurveTo {
                abs,
                x1,
                y1,
                x2,
                y2,
                x,
                y,
            } => {
                let ctrl1 = if abs {
                    (x1, y1)
                } else {
                    (current.0 + x1, current.1 + y1)
                };
                let ctrl2 = if abs {
                    (x2, y2)
                } else {
                    (current.0 + x2, current.1 + y2)
                };
                let dest = if abs {
                    (x, y)
                } else {
                    (current.0 + x, current.1 + y)
                };
                update_cubic_bounds(&mut bounds, current, ctrl1, ctrl2, dest);
                current = dest;
                prev_cubic_ctrl = Some(ctrl2);
                prev_quad_ctrl = None;
            }
            PathSegment::SmoothCurveTo { abs, x2, y2, x, y } => {
                let reflected = prev_cubic_ctrl
                    .map(|(px, py)| (2.0 * current.0 - px, 2.0 * current.1 - py))
                    .unwrap_or(current);
                let ctrl2 = if abs {
                    (x2, y2)
                } else {
                    (current.0 + x2, current.1 + y2)
                };
                let dest = if abs {
                    (x, y)
                } else {
                    (current.0 + x, current.1 + y)
                };
                update_cubic_bounds(&mut bounds, current, reflected, ctrl2, dest);
                current = dest;
                prev_cubic_ctrl = Some(ctrl2);
                prev_quad_ctrl = None;
            }
            PathSegment::Quadratic { abs, x1, y1, x, y } => {
                let ctrl = if abs {
                    (x1, y1)
                } else {
                    (current.0 + x1, current.1 + y1)
                };
                let dest = if abs {
                    (x, y)
                } else {
                    (current.0 + x, current.1 + y)
                };
                update_quadratic_bounds(&mut bounds, current, ctrl, dest);
                current = dest;
                prev_quad_ctrl = Some(ctrl);
                prev_cubic_ctrl = None;
            }
            PathSegment::SmoothQuadratic { abs, x, y } => {
                let ctrl = prev_quad_ctrl
                    .map(|(px, py)| (2.0 * current.0 - px, 2.0 * current.1 - py))
                    .unwrap_or(current);
                let dest = if abs {
                    (x, y)
                } else {
                    (current.0 + x, current.1 + y)
                };
                update_quadratic_bounds(&mut bounds, current, ctrl, dest);
                current = dest;
                prev_quad_ctrl = Some(ctrl);
                prev_cubic_ctrl = None;
            }
            PathSegment::ClosePath { .. } => {
                update_line_bounds(&mut bounds, current, subpath_start);
                current = subpath_start;
                prev_cubic_ctrl = None;
                prev_quad_ctrl = None;
            }
            _ => {
                // Unsupported segment type for freedraw data; fall back to points-based bbox
                return None;
            }
        }
    }

    bounds.into_bounds()
}

pub(crate) fn format_number(value: f64) -> String {
    if value.abs() < UNIT_EPSILON {
        return "0".to_string();
    }

    let mut s = format!("{:.6}", value);
    while s.contains('.') && s.ends_with('0') {
        s.pop();
    }
    if s.ends_with('.') {
        s.pop();
    }
    if s.is_empty() {
        "0".to_string()
    } else {
        s
    }
}
