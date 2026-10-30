use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConversionError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("CAD read error: {0}")]
    CadRead(String),

    #[error("DXF parse error: {0}")]
    DxfParse(String),

    #[error("DWG parse error: {0}")]
    DwgParse(String),

    #[error("DWF parse error: {0}")]
    DwfParse(String),

    #[error("DUC serialization error: {0}")]
    DucSerialization(String),

    #[error("Unsupported CAD format or invalid header")]
    UnsupportedFormat,

    #[error("Empty drawing: no renderable entities found")]
    EmptyDrawing,

    #[error("Invalid coordinate or dimension: {0}")]
    InvalidCoordinate(String),

    #[error("Resource loading error: {0}")]
    ResourceLoad(String),
}

pub type ConversionResult<T> = Result<T, ConversionError>;
