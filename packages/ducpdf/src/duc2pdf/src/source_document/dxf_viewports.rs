//! Recover DXF viewport visibility discarded by acadrust 0.5's group-90 mapping.
use acadrust::{
    document::CadDocument, entities::EntityType, io::dxf::GroupCodeValueType, types::Handle,
};

const BINARY: &[u8] = b"AutoCAD Binary DXF\r\n\x1a\0";

#[derive(Default)]
struct View {
    active: bool,
    handle: Option<u64>,
    status: Option<i32>,
    flags: Option<i32>,
}

impl View {
    fn finish(&self, cad: &mut CadDocument) {
        let Some(handle) = self.handle else {
            return;
        };
        if self.status.is_none() && self.flags.is_none() {
            return;
        }
        if let Some(EntityType::Viewport(v)) = cad.get_entity_mut(Handle::new(handle)) {
            v.status.is_on = self.status != Some(0) && self.flags.unwrap_or(0) & 0x20000 == 0;
        }
    }

    fn pair(&mut self, cad: &mut CadDocument, code: i32, value: &[u8], binary: bool) {
        if code == 0 {
            self.finish(cad);
            *self = View {
                active: value.eq_ignore_ascii_case(b"VIEWPORT"),
                ..Default::default()
            };
        } else if self.active {
            match code {
                5 => {
                    self.handle = std::str::from_utf8(value)
                        .ok()
                        .and_then(|s| u64::from_str_radix(s, 16).ok())
                }
                68 | 90 => {
                    let number = if !binary {
                        std::str::from_utf8(value).ok().and_then(|s| s.parse().ok())
                    } else if code == 68 {
                        value.try_into().ok().map(i16::from_le_bytes).map(i32::from)
                    } else {
                        value.try_into().ok().map(i32::from_le_bytes)
                    };
                    if code == 68 {
                        self.status = number;
                    } else {
                        self.flags = number;
                    }
                }
                _ => {}
            }
        }
    }
}

pub(super) fn restore(cad: &mut CadDocument, bytes: &[u8]) {
    if !cad.entities().any(|e| matches!(e, EntityType::Viewport(_))) {
        return;
    }
    let mut view = View::default();
    if let Some(mut remaining) = bytes.strip_prefix(BINARY) {
        // Named layout objects were introduced after the legacy one-byte group-code format.
        if !remaining.starts_with(&[0, 0]) {
            return;
        }
        while let Some((code, value, rest)) = binary_pair(remaining) {
            view.pair(cad, code, value, true);
            remaining = rest;
        }
    } else {
        let mut lines = bytes.split(|c| *c == b'\n');
        while let (Some(code), Some(value)) = (lines.next(), lines.next()) {
            if let Some(code) = std::str::from_utf8(code.trim_ascii())
                .ok()
                .and_then(|s| s.parse().ok())
            {
                view.pair(cad, code, value.trim_ascii(), false);
            }
        }
    }
    view.finish(cad);
}

fn binary_pair(bytes: &[u8]) -> Option<(i32, &[u8], &[u8])> {
    use GroupCodeValueType::*;
    let (code, data) = bytes.split_at_checked(2)?;
    let code = i32::from(u16::from_le_bytes(code.try_into().ok()?));
    let (value, rest) = match GroupCodeValueType::from_raw_code(code) {
        String | Handle | None => {
            let end = data.iter().position(|b| *b == 0)?;
            (&data[..end], &data[end + 1..])
        }
        BinaryData => data
            .get(1..)?
            .split_at_checked(usize::from(*data.first()?))?,
        Double | Point3D | Int64 => data.split_at_checked(8)?,
        Int32 => data.split_at_checked(4)?,
        Int16 | Byte => data.split_at_checked(2)?,
        Bool => data.split_at_checked(1)?,
    };
    Some((code, value, rest))
}
