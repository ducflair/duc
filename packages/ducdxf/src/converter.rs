use crate::builder::CadToDucBuilder;
use crate::cad::{detect_format, load_cad_from_bytes, CadFormat};
use crate::dwf::converter::{convert_dwf_to_duc as dwf_to_duc, convert_dwf_to_duc_state};
use crate::error::{ConversionError, ConversionResult};
use crate::options::ConversionOptions;
use duc::types::ExportedDataState;
use std::path::Path;

/// High-level function to convert any supported CAD format (DXF, DWG, DWF) to DUC ExportedDataState.
pub fn convert_to_duc_state(
    input_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<ExportedDataState> {
    let format = detect_format(input_bytes);
    match format {
        CadFormat::Dwf => convert_dwf_to_duc_state(input_bytes, options),
        CadFormat::Dwg | CadFormat::Dxf | CadFormat::Unknown => {
            let doc = load_cad_from_bytes(input_bytes)?;
            let builder = CadToDucBuilder::new(&doc, options.clone())?;
            builder.build()
        }
    }
}

/// High-level function to convert any supported CAD format (DXF, DWG, DWF) to serialized DUC bytes (.duc).
pub fn convert_to_duc(
    input_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    let format = detect_format(input_bytes);
    match format {
        CadFormat::Dwf => dwf_to_duc(input_bytes, options),
        CadFormat::Dwg | CadFormat::Dxf | CadFormat::Unknown => {
            let state = convert_to_duc_state(input_bytes, options)?;
            duc::serialize::serialize_duc_to_bytes(&state).map_err(|e| {
                ConversionError::DucSerialization(format!("Serialization error: {}", e))
            })
        }
    }
}

/// Convert DXF bytes directly to DUC bytes.
pub fn convert_dxf_to_duc(
    dxf_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    let doc = load_cad_from_bytes(dxf_bytes)?;
    let builder = CadToDucBuilder::new(&doc, options.clone())?;
    let state = builder.build()?;
    duc::serialize::serialize_duc_to_bytes(&state).map_err(|e| {
        ConversionError::DucSerialization(format!("Serialization error: {}", e))
    })
}

/// Convert DWG bytes directly to DUC bytes.
pub fn convert_dwg_to_duc(
    dwg_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    let doc = load_cad_from_bytes(dwg_bytes)?;
    let builder = CadToDucBuilder::new(&doc, options.clone())?;
    let state = builder.build()?;
    duc::serialize::serialize_duc_to_bytes(&state).map_err(|e| {
        ConversionError::DucSerialization(format!("Serialization error: {}", e))
    })
}

/// Convert DWF bytes directly to DUC bytes.
pub fn convert_dwf_to_duc(
    dwf_bytes: &[u8],
    options: &ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    dwf_to_duc(dwf_bytes, options)
}

/// Convert CAD file at path to DUC bytes.
pub fn convert_file_to_duc(
    input_path: &Path,
    options: &ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    let bytes = std::fs::read(input_path).map_err(ConversionError::Io)?;
    convert_to_duc(&bytes, options)
}
