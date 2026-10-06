pub mod bounds;
pub mod color;
pub mod linetype;
pub mod mtext;

use crate::error::{ConversionError, ConversionResult};
use acadrust::document::CadDocument;
use acadrust::io::dwg::DwgReader;
use acadrust::io::dxf::DxfReader;
use std::io::Cursor;
use std::path::Path;

/// Detects CAD file format from bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CadFormat {
    Dwg,
    Dxf,
    Dwf,
    Unknown,
}

pub fn detect_format(bytes: &[u8]) -> CadFormat {
    if bytes.starts_with(b"(DWF V") || bytes.starts_with(b"PK\x03\x04") {
        CadFormat::Dwf
    } else if bytes.starts_with(b"AC10") {
        // AutoCAD DWG files begin with AC10xx
        CadFormat::Dwg
    } else if bytes.len() > 6
        && (bytes.starts_with(b"0\n")
            || bytes.starts_with(b"0\r\n")
            || bytes.windows(7).any(|w| w == b"SECTION"))
    {
        CadFormat::Dxf
    } else {
        // Fallback: check if ASCII text with DXF keywords
        let preview = String::from_utf8_lossy(&bytes[..512.min(bytes.len())]);
        if preview.contains("SECTION") || preview.contains("HEADER") || preview.contains("ENTITIES") {
            CadFormat::Dxf
        } else {
            CadFormat::Unknown
        }
    }
}

/// Loads a CAD document (DWG or DXF) from an in-memory buffer.
pub fn load_cad_from_bytes(bytes: &[u8]) -> ConversionResult<CadDocument> {
    let format = detect_format(bytes);
    match format {
        CadFormat::Dwg => {
            let cursor = Cursor::new(bytes.to_vec());
            let mut reader = DwgReader::from_stream(cursor);
            reader.read().map_err(|e| ConversionError::DwgParse(e.to_string()))
        }
        CadFormat::Dxf | CadFormat::Unknown => {
            let cursor = Cursor::new(bytes.to_vec());
            let reader =
                DxfReader::from_reader(cursor).map_err(|e| ConversionError::DxfParse(e.to_string()))?;
            reader.read().map_err(|e| ConversionError::DxfParse(e.to_string()))
        }
        CadFormat::Dwf => {
            Err(ConversionError::CadRead("DWF format should be processed by DWF module".to_string()))
        }
    }
}

/// Loads a CAD document from a file path.
pub fn load_cad_file(path: &Path) -> ConversionResult<CadDocument> {
    let bytes = std::fs::read(path).map_err(ConversionError::Io)?;
    load_cad_from_bytes(&bytes)
}
