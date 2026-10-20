//! Draw IR and Emitters (TileEmitter and LopdfEmitter)
//!
//! Defines a shared trait for vector drawing primitives so the exact same
//! scene traversal can target either:
//! 1. TileEmitter: High-performance, zero-allocation flat u32 command buffer for OffscreenCanvas
//! 2. LopdfEmitter: PDF operations for document export

use hipdf::lopdf::{content::Operation, Object};

pub const OP_SAVE: u32 = 1;
pub const OP_RESTORE: u32 = 2;
pub const OP_BEGIN_PATH: u32 = 3;
pub const OP_MOVE_TO: u32 = 4;
pub const OP_LINE_TO: u32 = 5;
pub const OP_BEZIER_CURVE_TO: u32 = 6;
pub const OP_QUAD_CURVE_TO: u32 = 7;
pub const OP_RECT: u32 = 8;
pub const OP_CLOSE_PATH: u32 = 9;
pub const OP_FILL: u32 = 10;
pub const OP_STROKE: u32 = 11;
pub const OP_FILL_AND_STROKE: u32 = 12;
pub const OP_CLIP: u32 = 13;
pub const OP_SET_FILL_COLOR: u32 = 14;
pub const OP_SET_STROKE_COLOR: u32 = 15;
pub const OP_SET_LINE_WIDTH: u32 = 16;
pub const OP_SET_LINE_CAP: u32 = 17;
pub const OP_SET_LINE_JOIN: u32 = 18;
pub const OP_SET_MITER_LIMIT: u32 = 19;
pub const OP_SET_LINE_DASH: u32 = 20;
pub const OP_SET_GLOBAL_ALPHA: u32 = 21;
pub const OP_DRAW_IMAGE: u32 = 22;
pub const OP_DRAW_TEXT: u32 = 23;

/// Shared drawing emitter trait across PDF export and direct Canvas tiles.
pub trait DrawEmitter {
    fn save(&mut self);
    fn restore(&mut self);
    fn transform(&mut self, a: f32, b: f32, c: f32, d: f32, e: f32, f: f32);

    fn set_fill_color(&mut self, rgba: u32);
    fn set_stroke_color(&mut self, rgba: u32);
    fn set_line_width(&mut self, width: f32);
    fn set_line_cap(&mut self, cap: u8); // 0 = butt, 1 = round, 2 = square
    fn set_line_join(&mut self, join: u8); // 0 = miter, 1 = round, 2 = bevel
    fn set_miter_limit(&mut self, limit: f32);
    fn set_line_dash(&mut self, dashes: &[f32], offset: f32);
    fn set_global_alpha(&mut self, alpha: f32);

    fn begin_path(&mut self);
    fn move_to(&mut self, x: f64, y: f64);
    fn line_to(&mut self, x: f64, y: f64);
    fn bezier_curve_to(&mut self, cp1x: f64, cp1y: f64, cp2x: f64, cp2y: f64, x: f64, y: f64);
    fn quad_curve_to(&mut self, cpx: f64, cpy: f64, x: f64, y: f64);
    fn rect(&mut self, x: f64, y: f64, w: f64, h: f64);
    fn close_path(&mut self);

    fn fill(&mut self, even_odd: bool);
    fn stroke(&mut self);
    fn fill_and_stroke(&mut self, even_odd: bool);
    fn clip(&mut self, even_odd: bool);

    fn draw_image(&mut self, file_id: &str, x: f64, y: f64, w: f64, h: f64);
    fn draw_text(
        &mut self,
        text: &str,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        font_size: f32,
        line_height: f32,
        font_family: &str,
        color_rgba: u32,
        align: u8,
        vertical_align: u8,
    );
}

#[derive(Clone, Copy, Debug)]
pub struct Transform2D {
    pub a: f64,
    pub b: f64,
    pub c: f64,
    pub d: f64,
    pub e: f64,
    pub f: f64,
}

impl Transform2D {
    pub fn identity() -> Self {
        Self {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 0.0,
            f: 0.0,
        }
    }

    pub fn new_tile(tile_x: f64, tile_y: f64, scale: f64) -> Self {
        Self {
            a: scale,
            b: 0.0,
            c: 0.0,
            d: scale,
            e: -tile_x * scale,
            f: -tile_y * scale,
        }
    }

    #[inline(always)]
    pub fn apply(&self, x: f64, y: f64) -> (f32, f32) {
        let rx = self.a * x + self.c * y + self.e;
        let ry = self.b * x + self.d * y + self.f;
        (rx as f32, ry as f32)
    }

    #[inline(always)]
    pub fn multiply(&self, rhs: &Transform2D) -> Self {
        Self {
            a: self.a * rhs.a + self.c * rhs.b,
            b: self.b * rhs.a + self.d * rhs.b,
            c: self.a * rhs.c + self.c * rhs.d,
            d: self.b * rhs.c + self.d * rhs.d,
            e: self.a * rhs.e + self.c * rhs.f + self.e,
            f: self.b * rhs.e + self.d * rhs.f + self.f,
        }
    }

    #[inline(always)]
    pub fn is_axis_aligned(&self) -> bool {
        self.b.abs() < 1e-6 && self.c.abs() < 1e-6
    }
}

/// Emits into a flat u32 command buffer with f32::to_bits coordinates.
/// Coordinate transforms, scale, and hairline clamping are pre-applied in f64.
pub struct TileEmitter {
    pub buffer: Vec<u32>,
    pub scale: f64,
    current_transform: Transform2D,
    transform_stack: Vec<Transform2D>,

    // Caching state to avoid redundant command emission
    cur_fill_color: u32,
    cur_stroke_color: u32,
    cur_line_width_bits: u32,
    cur_line_cap: u8,
    cur_line_join: u8,
    cur_miter_limit_bits: u32,
    cur_alpha_bits: u32,
}

impl TileEmitter {
    pub fn new(tile_x: f64, tile_y: f64, scale: f64) -> Self {
        let root = Transform2D::new_tile(tile_x, tile_y, scale);
        Self {
            buffer: Vec::with_capacity(4096),
            scale,
            current_transform: root,
            transform_stack: vec![root],
            cur_fill_color: 0,
            cur_stroke_color: 0,
            cur_line_width_bits: 0,
            cur_line_cap: 255,
            cur_line_join: 255,
            cur_miter_limit_bits: 0,
            cur_alpha_bits: 1.0_f32.to_bits(),
        }
    }

    pub fn into_buffer(self) -> Vec<u32> {
        self.buffer
    }
}

impl DrawEmitter for TileEmitter {
    fn save(&mut self) {
        self.transform_stack.push(self.current_transform);
        self.buffer.push(OP_SAVE);
    }

    fn restore(&mut self) {
        if self.transform_stack.len() > 1 {
            self.transform_stack.pop();
        }
        self.current_transform = *self.transform_stack.last().unwrap();
        self.buffer.push(OP_RESTORE);
        // Force re-issuing styles on next use because restore reverts canvas context
        self.cur_fill_color = 0;
        self.cur_stroke_color = 0;
        self.cur_line_width_bits = 0;
        self.cur_line_cap = 255;
        self.cur_line_join = 255;
        self.cur_miter_limit_bits = 0;
        self.cur_alpha_bits = 0;
    }

    fn transform(&mut self, a: f32, b: f32, c: f32, d: f32, e: f32, f: f32) {
        let local_m = Transform2D {
            a: a as f64,
            b: b as f64,
            c: c as f64,
            d: d as f64,
            e: e as f64,
            f: f as f64,
        };
        self.current_transform = self.current_transform.multiply(&local_m);
    }

    fn set_fill_color(&mut self, rgba: u32) {
        if rgba != self.cur_fill_color {
            self.cur_fill_color = rgba;
            self.buffer.push(OP_SET_FILL_COLOR);
            self.buffer.push(rgba);
        }
    }

    fn set_stroke_color(&mut self, rgba: u32) {
        if rgba != self.cur_stroke_color {
            self.cur_stroke_color = rgba;
            self.buffer.push(OP_SET_STROKE_COLOR);
            self.buffer.push(rgba);
        }
    }

    fn set_line_width(&mut self, width: f32) {
        // Hairline rule: minimum visible stroke is 1 device pixel
        let scaled_w = (width as f64 * self.scale).max(1.0) as f32;
        let bits = scaled_w.to_bits();
        if bits != self.cur_line_width_bits {
            self.cur_line_width_bits = bits;
            self.buffer.push(OP_SET_LINE_WIDTH);
            self.buffer.push(bits);
        }
    }

    fn set_line_cap(&mut self, cap: u8) {
        if cap != self.cur_line_cap {
            self.cur_line_cap = cap;
            self.buffer.push(OP_SET_LINE_CAP);
            self.buffer.push(cap as u32);
        }
    }

    fn set_line_join(&mut self, join: u8) {
        if join != self.cur_line_join {
            self.cur_line_join = join;
            self.buffer.push(OP_SET_LINE_JOIN);
            self.buffer.push(join as u32);
        }
    }

    fn set_miter_limit(&mut self, limit: f32) {
        let bits = limit.to_bits();
        if bits != self.cur_miter_limit_bits {
            self.cur_miter_limit_bits = bits;
            self.buffer.push(OP_SET_MITER_LIMIT);
            self.buffer.push(bits);
        }
    }

    fn set_line_dash(&mut self, dashes: &[f32], offset: f32) {
        self.buffer.push(OP_SET_LINE_DASH);
        self.buffer.push(dashes.len() as u32);
        let scaled_offset = (offset as f64 * self.scale) as f32;
        self.buffer.push(scaled_offset.to_bits());
        for &d in dashes {
            let scaled_d = (d as f64 * self.scale) as f32;
            self.buffer.push(scaled_d.to_bits());
        }
    }

    fn set_global_alpha(&mut self, alpha: f32) {
        let bits = alpha.to_bits();
        if bits != self.cur_alpha_bits {
            self.cur_alpha_bits = bits;
            self.buffer.push(OP_SET_GLOBAL_ALPHA);
            self.buffer.push(bits);
        }
    }

    fn begin_path(&mut self) {
        self.buffer.push(OP_BEGIN_PATH);
    }

    fn move_to(&mut self, x: f64, y: f64) {
        let (px, py) = self.current_transform.apply(x, y);
        self.buffer.push(OP_MOVE_TO);
        self.buffer.push(px.to_bits());
        self.buffer.push(py.to_bits());
    }

    fn line_to(&mut self, x: f64, y: f64) {
        let (px, py) = self.current_transform.apply(x, y);
        self.buffer.push(OP_LINE_TO);
        self.buffer.push(px.to_bits());
        self.buffer.push(py.to_bits());
    }

    fn bezier_curve_to(&mut self, cp1x: f64, cp1y: f64, cp2x: f64, cp2y: f64, x: f64, y: f64) {
        let (p1x, p1y) = self.current_transform.apply(cp1x, cp1y);
        let (p2x, p2y) = self.current_transform.apply(cp2x, cp2y);
        let (px, py) = self.current_transform.apply(x, y);
        self.buffer.push(OP_BEZIER_CURVE_TO);
        self.buffer.push(p1x.to_bits());
        self.buffer.push(p1y.to_bits());
        self.buffer.push(p2x.to_bits());
        self.buffer.push(p2y.to_bits());
        self.buffer.push(px.to_bits());
        self.buffer.push(py.to_bits());
    }

    fn quad_curve_to(&mut self, cpx: f64, cpy: f64, x: f64, y: f64) {
        let (pcx, pcy) = self.current_transform.apply(cpx, cpy);
        let (px, py) = self.current_transform.apply(x, y);
        self.buffer.push(OP_QUAD_CURVE_TO);
        self.buffer.push(pcx.to_bits());
        self.buffer.push(pcy.to_bits());
        self.buffer.push(px.to_bits());
        self.buffer.push(py.to_bits());
    }

    fn rect(&mut self, x: f64, y: f64, w: f64, h: f64) {
        if self.current_transform.is_axis_aligned() {
            let (x0, y0) = self.current_transform.apply(x, y);
            let (x1, y1) = self.current_transform.apply(x + w, y + h);
            let rx = x0.min(x1);
            let ry = y0.min(y1);
            let rw = (x1 - x0).abs();
            let rh = (y1 - y0).abs();
            self.buffer.push(OP_RECT);
            self.buffer.push(rx.to_bits());
            self.buffer.push(ry.to_bits());
            self.buffer.push(rw.to_bits());
            self.buffer.push(rh.to_bits());
        } else {
            self.move_to(x, y);
            self.line_to(x + w, y);
            self.line_to(x + w, y + h);
            self.line_to(x, y + h);
            self.close_path();
        }
    }

    fn close_path(&mut self) {
        self.buffer.push(OP_CLOSE_PATH);
    }

    fn fill(&mut self, even_odd: bool) {
        self.buffer.push(OP_FILL);
        self.buffer.push(if even_odd { 1 } else { 0 });
    }

    fn stroke(&mut self) {
        self.buffer.push(OP_STROKE);
    }

    fn fill_and_stroke(&mut self, even_odd: bool) {
        self.buffer.push(OP_FILL_AND_STROKE);
        self.buffer.push(if even_odd { 1 } else { 0 });
    }

    fn clip(&mut self, even_odd: bool) {
        self.buffer.push(OP_CLIP);
        self.buffer.push(if even_odd { 1 } else { 0 });
    }

    fn draw_image(&mut self, file_id: &str, x: f64, y: f64, w: f64, h: f64) {
        self.buffer.push(OP_DRAW_IMAGE);
        self.buffer.push((self.current_transform.a as f32).to_bits());
        self.buffer.push((self.current_transform.b as f32).to_bits());
        self.buffer.push((self.current_transform.c as f32).to_bits());
        self.buffer.push((self.current_transform.d as f32).to_bits());
        self.buffer.push((self.current_transform.e as f32).to_bits());
        self.buffer.push((self.current_transform.f as f32).to_bits());
        self.buffer.push((x as f32).to_bits());
        self.buffer.push((y as f32).to_bits());
        self.buffer.push((w as f32).to_bits());
        self.buffer.push((h as f32).to_bits());
        let utf16: Vec<u16> = file_id.encode_utf16().collect();
        self.buffer.push(utf16.len() as u32);
        for code in utf16 {
            self.buffer.push(code as u32);
        }
    }

    fn draw_text(
        &mut self,
        text: &str,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        font_size: f32,
        line_height: f32,
        font_family: &str,
        color_rgba: u32,
        align: u8,
        vertical_align: u8,
    ) {
        self.buffer.push(OP_DRAW_TEXT);
        self.buffer.push((self.current_transform.a as f32).to_bits());
        self.buffer.push((self.current_transform.b as f32).to_bits());
        self.buffer.push((self.current_transform.c as f32).to_bits());
        self.buffer.push((self.current_transform.d as f32).to_bits());
        self.buffer.push((self.current_transform.e as f32).to_bits());
        self.buffer.push((self.current_transform.f as f32).to_bits());
        self.buffer.push((x as f32).to_bits());
        self.buffer.push((y as f32).to_bits());
        self.buffer.push((w as f32).to_bits());
        self.buffer.push((h as f32).to_bits());
        self.buffer.push(font_size.to_bits());
        self.buffer.push(line_height.to_bits());
        self.buffer.push(color_rgba);
        self.buffer.push(align as u32);
        self.buffer.push(vertical_align as u32);
        let ff16: Vec<u16> = font_family.encode_utf16().collect();
        self.buffer.push(ff16.len() as u32);
        for c in ff16 {
            self.buffer.push(c as u32);
        }
        let t16: Vec<u16> = text.encode_utf16().collect();
        self.buffer.push(t16.len() as u32);
        for c in t16 {
            self.buffer.push(c as u32);
        }
    }
}

/// Emits lopdf Operations for PDF document construction.
pub struct LopdfEmitter {
    pub operations: Vec<Operation>,
}

impl LopdfEmitter {
    pub fn new() -> Self {
        Self {
            operations: Vec::with_capacity(1024),
        }
    }

    pub fn into_operations(self) -> Vec<Operation> {
        self.operations
    }
}

impl DrawEmitter for LopdfEmitter {
    fn save(&mut self) {
        self.operations.push(Operation::new("q", vec![]));
    }

    fn restore(&mut self) {
        self.operations.push(Operation::new("Q", vec![]));
    }

    fn transform(&mut self, a: f32, b: f32, c: f32, d: f32, e: f32, f: f32) {
        self.operations.push(Operation::new(
            "cm",
            vec![
                Object::Real(a),
                Object::Real(b),
                Object::Real(c),
                Object::Real(d),
                Object::Real(e),
                Object::Real(f),
            ],
        ));
    }

    fn set_fill_color(&mut self, rgba: u32) {
        let r = ((rgba >> 24) & 255) as f32 / 255.0;
        let g = ((rgba >> 16) & 255) as f32 / 255.0;
        let b = ((rgba >> 8) & 255) as f32 / 255.0;
        self.operations.push(Operation::new(
            "rg",
            vec![Object::Real(r), Object::Real(g), Object::Real(b)],
        ));
    }

    fn set_stroke_color(&mut self, rgba: u32) {
        let r = ((rgba >> 24) & 255) as f32 / 255.0;
        let g = ((rgba >> 16) & 255) as f32 / 255.0;
        let b = ((rgba >> 8) & 255) as f32 / 255.0;
        self.operations.push(Operation::new(
            "RG",
            vec![Object::Real(r), Object::Real(g), Object::Real(b)],
        ));
    }

    fn set_line_width(&mut self, width: f32) {
        self.operations
            .push(Operation::new("w", vec![Object::Real(width)]));
    }

    fn set_line_cap(&mut self, cap: u8) {
        self.operations
            .push(Operation::new("J", vec![Object::Integer(cap as i64)]));
    }

    fn set_line_join(&mut self, join: u8) {
        self.operations
            .push(Operation::new("j", vec![Object::Integer(join as i64)]));
    }

    fn set_miter_limit(&mut self, limit: f32) {
        self.operations
            .push(Operation::new("M", vec![Object::Real(limit)]));
    }

    fn set_line_dash(&mut self, dashes: &[f32], offset: f32) {
        let arr = dashes.iter().map(|&d| Object::Real(d)).collect();
        self.operations.push(Operation::new(
            "d",
            vec![Object::Array(arr), Object::Real(offset)],
        ));
    }

    fn set_global_alpha(&mut self, _alpha: f32) {
        // PDF handles alpha via ExtGState (/GS) dictionary references
    }

    fn begin_path(&mut self) {}

    fn move_to(&mut self, x: f64, y: f64) {
        self.operations.push(Operation::new(
            "m",
            vec![Object::Real(x as f32), Object::Real(-y as f32)],
        ));
    }

    fn line_to(&mut self, x: f64, y: f64) {
        self.operations.push(Operation::new(
            "l",
            vec![Object::Real(x as f32), Object::Real(-y as f32)],
        ));
    }

    fn bezier_curve_to(&mut self, cp1x: f64, cp1y: f64, cp2x: f64, cp2y: f64, x: f64, y: f64) {
        self.operations.push(Operation::new(
            "c",
            vec![
                Object::Real(cp1x as f32),
                Object::Real(-cp1y as f32),
                Object::Real(cp2x as f32),
                Object::Real(-cp2y as f32),
                Object::Real(x as f32),
                Object::Real(-y as f32),
            ],
        ));
    }

    fn quad_curve_to(&mut self, cpx: f64, cpy: f64, x: f64, y: f64) {
        // Approximate quadratic to cubic for PDF
        // (Quadratic is not a standard PDF operator)
        let cp1x = cpx;
        let cp1y = cpy;
        let cp2x = cpx;
        let cp2y = cpy;
        self.bezier_curve_to(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    fn rect(&mut self, x: f64, y: f64, w: f64, h: f64) {
        self.operations.push(Operation::new(
            "re",
            vec![
                Object::Real(x as f32),
                Object::Real(-(y + h) as f32),
                Object::Real(w as f32),
                Object::Real(h as f32),
            ],
        ));
    }

    fn close_path(&mut self) {
        self.operations.push(Operation::new("h", vec![]));
    }

    fn fill(&mut self, even_odd: bool) {
        self.operations
            .push(Operation::new(if even_odd { "f*" } else { "f" }, vec![]));
    }

    fn stroke(&mut self) {
        self.operations.push(Operation::new("S", vec![]));
    }

    fn fill_and_stroke(&mut self, even_odd: bool) {
        self.operations
            .push(Operation::new(if even_odd { "b*" } else { "b" }, vec![]));
    }

    fn clip(&mut self, even_odd: bool) {
        self.operations
            .push(Operation::new(if even_odd { "W*" } else { "W" }, vec![]));
        self.operations.push(Operation::new("n", vec![]));
    }

    fn draw_image(&mut self, _file_id: &str, _x: f64, _y: f64, _w: f64, _h: f64) {
        // PDF invokes XObject image via Do operator in Lopdf document export
    }

    fn draw_text(
        &mut self,
        _text: &str,
        _x: f64,
        _y: f64,
        _w: f64,
        _h: f64,
        _font_size: f32,
        _line_height: f32,
        _font_family: &str,
        _color_rgba: u32,
        _align: u8,
        _vertical_align: u8,
    ) {}
}
