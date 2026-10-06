use acadrust::types::color::Color;

/// Standard AutoCAD Color Index (ACI) 256 table.
/// Index 0 is ByBlock, 256 is ByLayer. 1-255 are standard indexed colors.
pub const AUTOCAD_COLOR_INDEX: [u32; 256] = [
    0x000000, 0xFF0000, 0xFFFF00, 0x00FF00, 0x00FFFF, 0x0000FF, 0xFF00FF, 0xFFFFFF,
    0x808080, 0xC0C0C0, 0xFF0000, 0xFF7F7F, 0xCC0000, 0xCC6666, 0x990000, 0x994C4C,
    0x7F0000, 0x7F3F3F, 0x4C0000, 0x4C2626, 0xFF3F00, 0xFF9F7F, 0xCC3300, 0xCC7F66,
    0x992600, 0x995F4C, 0x7F1F00, 0x7F4F3F, 0x4C1300, 0x4C2F26, 0xFF7F00, 0xFFBF7F,
    0xCC6600, 0xCC9966, 0x994C00, 0x99734C, 0x7F3F00, 0x7F5F3F, 0x4C2600, 0x4C3926,
    0xFFBF00, 0xFFDF7F, 0xCC9900, 0xCCB266, 0x997300, 0x99864C, 0x7F5F00, 0x7F6F3F,
    0x4C3900, 0x4C4326, 0xFFFF00, 0xFFFF7F, 0xCCCC00, 0xCCCC66, 0x999900, 0x99994C,
    0x7F7F00, 0x7F7F3F, 0x4C4C00, 0x4C4C26, 0xBFFF00, 0xDFFF7F, 0x99CC00, 0xB2CC66,
    0x739900, 0x86994C, 0x5F7F00, 0x6F7F3F, 0x394C00, 0x434C26, 0x7FFF00, 0xBFFF7F,
    0x66CC00, 0x99CC66, 0x4C9900, 0x73994C, 0x3F7F00, 0x5F7F3F, 0x264C00, 0x394C26,
    0x3FFF00, 0x9FFF7F, 0x33CC00, 0x7FCC66, 0x269900, 0x5F994C, 0x1F7F00, 0x4F7F3F,
    0x134C00, 0x2F4C26, 0x00FF00, 0x7FFF7F, 0x00CC00, 0x66CC66, 0x009900, 0x4C994C,
    0x007F00, 0x3F7F3F, 0x004C00, 0x264C26, 0x00FF3F, 0x7FFF9F, 0x00CC33, 0x66CC7F,
    0x009926, 0x4C995F, 0x007F1F, 0x3F7F4F, 0x004C13, 0x264C2F, 0x00FF7F, 0x7FFFBF,
    0x00CC66, 0x66CC99, 0x00994C, 0x4C9973, 0x007F3F, 0x3F7F5F, 0x004C26, 0x264C39,
    0x00FFBF, 0x7FFFDF, 0x00CC99, 0x66CCB2, 0x009973, 0x4C9986, 0x007F5F, 0x3F7F6F,
    0x004C39, 0x264C43, 0x00FFFF, 0x7FFFFF, 0x00CCCC, 0x66CCCC, 0x009999, 0x4C9999,
    0x007F7F, 0x3F7F7F, 0x004C4C, 0x264C4C, 0x00BFFF, 0x7FDFFF, 0x0099CC, 0x66B2CC,
    0x007399, 0x4C8699, 0x005F7F, 0x3F6F7F, 0x00394C, 0x26434C, 0x007FFF, 0x7FBFFF,
    0x0066CC, 0x6699CC, 0x004C99, 0x4C7399, 0x003F7F, 0x3F5F7F, 0x00264C, 0x26394C,
    0x003FFF, 0x7F9FFF, 0x0033CC, 0x667FCC, 0x002699, 0x4C5F99, 0x001F7F, 0x3F4F7F,
    0x00134C, 0x262F4C, 0x0000FF, 0x7F7FFF, 0x0000CC, 0x6666CC, 0x000099, 0x4C4C99,
    0x00007F, 0x3F3F7F, 0x00004C, 0x26264C, 0x3F00FF, 0x9F7FFF, 0x3300CC, 0x7F66CC,
    0x260099, 0x5F4C99, 0x1F007F, 0x4F3F7F, 0x13004C, 0x2F264C, 0x7F00FF, 0xBF7FFF,
    0x6600CC, 0x9966CC, 0x4C0099, 0x734C99, 0x3F007F, 0x5F3F7F, 0x26004C, 0x39264C,
    0xBF00FF, 0xDF7FFF, 0x9900CC, 0xB266CC, 0x730099, 0x864C99, 0x5F007F, 0x6F3F7F,
    0x39004C, 0x43264C, 0xFF00FF, 0xFF7FFF, 0xCC00CC, 0xCC66CC, 0x990099, 0x994C99,
    0x7F007F, 0x7F3F7F, 0x4C004C, 0x4C264C, 0xFF00BF, 0xFF7FDF, 0xCC0099, 0xCC66B2,
    0x990073, 0x994C86, 0x7F005F, 0x7F3F6F, 0x4C0039, 0x4C2643, 0xFF007F, 0xFF7FBF,
    0xCC0066, 0xCC6699, 0x99004C, 0x994C73, 0x7F003F, 0x7F3F5F, 0x4C0026, 0x4C2639,
    0xFF003F, 0xFF7F9F, 0xCC0033, 0xCC667F, 0x990026, 0x994C5F, 0x7F001F, 0x7F3F4F,
    0x4C0013, 0x4C262F, 0x333333, 0x5B5B5B, 0x848484, 0xADADAD, 0xD6D6D6, 0xFFFFFF,
];

/// Converts an AutoCAD Color Index (1-255) to (r, g, b) bytes.
pub fn aci_to_rgb(index: u8) -> (u8, u8, u8) {
    let hex = AUTOCAD_COLOR_INDEX[index as usize];
    let r = ((hex >> 16) & 0xFF) as u8;
    let g = ((hex >> 8) & 0xFF) as u8;
    let b = (hex & 0xFF) as u8;
    (r, g, b)
}

/// Resolves an acadrust Color against layer color and defaults.
pub fn resolve_color(
    color: &Color,
    layer_color: Option<&Color>,
    block_color: Option<&Color>,
    default_rgb: (u8, u8, u8),
) -> (u8, u8, u8) {
    match color {
        Color::Index(idx) => {
            if *idx == 0 {
                // ByBlock
                if let Some(bc) = block_color {
                    resolve_color(bc, layer_color, None, default_rgb)
                } else {
                    default_rgb
                }
            } else if *idx == 7 {
                // Color 7 is white on dark background, black on white background
                (0, 0, 0)
            } else {
                aci_to_rgb(*idx)
            }
        }
        Color::Rgb { r, g, b } => (*r, *g, *b),
        Color::ByLayer => {
            if let Some(lc) = layer_color {
                match lc {
                    Color::ByLayer | Color::None => default_rgb,
                    _ => resolve_color(lc, None, block_color, default_rgb),
                }
            } else {
                default_rgb
            }
        }
        Color::ByBlock => {
            if let Some(bc) = block_color {
                resolve_color(bc, layer_color, None, default_rgb)
            } else {
                default_rgb
            }
        }
        Color::None => default_rgb,
    }
}

/// Converts (u8, u8, u8) RGB to hex string e.g. "#112233".
pub fn rgb_to_hex(rgb: (u8, u8, u8)) -> String {
    format!("#{:02x}{:02x}{:02x}", rgb.0, rgb.1, rgb.2)
}

/// Parses a hex color string like "#ffffff" or "ffffff" or "#fff".
pub fn parse_hex_color(hex: &str) -> Option<(u8, u8, u8)> {
    let s = hex.trim().trim_start_matches('#');
    if s.len() == 6 {
        let r = u8::from_str_radix(&s[0..2], 16).ok()?;
        let g = u8::from_str_radix(&s[2..4], 16).ok()?;
        let b = u8::from_str_radix(&s[4..6], 16).ok()?;
        Some((r, g, b))
    } else if s.len() == 3 {
        let r = u8::from_str_radix(&s[0..1], 16).ok()? * 17;
        let g = u8::from_str_radix(&s[1..2], 16).ok()? * 17;
        let b = u8::from_str_radix(&s[2..3], 16).ok()? * 17;
        Some((r, g, b))
    } else {
        None
    }
}
