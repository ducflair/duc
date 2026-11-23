use std::ops::Range;

/// Affine block-array offsets in drawing order. A crop can restrict the lattice
/// before iteration, including arrays with rotation or negative spacing.
#[derive(Clone, Copy)]
pub(crate) struct DuplicationGrid {
    pub cols: usize,
    pub rows: usize,
    pub pitch: (f64, f64),
    pub first: (f64, f64),
    pub angle: f64,
}

impl Default for DuplicationGrid {
    fn default() -> Self {
        Self {
            cols: 1,
            rows: 1,
            pitch: (0., 0.),
            first: (0., 0.),
            angle: 0.,
        }
    }
}

fn indices(count: usize, pitch: f64, lo: f64, hi: f64) -> Range<usize> {
    if pitch == 0.0 || !pitch.is_finite() {
        return if lo <= 0. && hi >= 0. { 0..count } else { 0..0 };
    }
    let (a, b) = (lo / pitch, hi / pitch);
    // Include the adjacent cell at either end for floating-point error.
    let first = (a.min(b).ceil() - 1.).clamp(0., count as f64) as usize;
    let end = (a.max(b).floor() + 2.).clamp(0., count as f64) as usize;
    first..end
}

impl DuplicationGrid {
    pub fn offsets(self, clip: Option<[f64; 4]>) -> impl Iterator<Item = (f64, f64)> {
        let (s, c) = self.angle.sin_cos();
        let (cols, rows) = if let Some([x1, y1, x2, y2]) = clip {
            let mut bounds = [
                f64::INFINITY,
                f64::INFINITY,
                f64::NEG_INFINITY,
                f64::NEG_INFINITY,
            ];
            for x in [x1 - self.first.0, x2 - self.first.0] {
                for y in [y1 - self.first.1, y2 - self.first.1] {
                    let (u, v) = (c * x + s * y, -s * x + c * y);
                    bounds = [
                        bounds[0].min(u),
                        bounds[1].min(v),
                        bounds[2].max(u),
                        bounds[3].max(v),
                    ];
                }
            }
            (
                indices(self.cols, self.pitch.0, bounds[0], bounds[2]),
                indices(self.rows, self.pitch.1, bounds[1], bounds[3]),
            )
        } else {
            (0..self.cols, 0..self.rows)
        };
        rows.flat_map(move |r| {
            cols.clone().map(move |col| {
                let (x, y) = (col as f64 * self.pitch.0, r as f64 * self.pitch.1);
                (self.first.0 + c * x - s * y, self.first.1 + s * x + c * y)
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn clip_visits_only_neighbours_in_a_rotated_hundred_million_cell_grid() {
        let grid = DuplicationGrid {
            cols: 10000,
            rows: 10000,
            pitch: (-5., 8.),
            first: (19., 37.),
            angle: 0.43,
        };
        let (s, c) = grid.angle.sin_cos();
        let (u, v) = (4999. * -5., 5001. * 8.);
        let (x, y) = (19. + c * u - s * v, 37. + s * u + c * v);
        let offsets: Vec<_> = grid
            .offsets(Some([x - 1., y - 1., x + 1., y + 1.]))
            .collect();
        assert!(offsets.len() <= 16);
        assert!(offsets
            .iter()
            .any(|&(a, b)| (a - x).abs() + (b - y).abs() < 1e-8));
    }
}
