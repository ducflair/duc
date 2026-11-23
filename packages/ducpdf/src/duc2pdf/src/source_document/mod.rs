//! Source documents used by the native and WebAssembly canvas and PDF exporter.
mod cad;
pub(crate) mod artwork;
mod cad_measure;
mod cad_spaces;
mod dwf;
mod dxf_viewports;
mod layout_names;
mod measure;
mod workbook;
mod table;
pub use table::to_workbook as table_workbook;
pub use workbook::print as print_workbook;
#[cfg(not(target_arch = "wasm32"))]
mod page_source;
#[cfg(not(target_arch = "wasm32"))]
pub use page_source::PageSource;
mod pdf;
pub use pdf::{export_view, inspect, with_layers, DocumentView, PdfInfo, EMBEDDED_VISIBILITY};

pub fn convert(kind: &str, bytes: &[u8]) -> Result<Vec<u8>, String> {
    match kind {
        "dxf" | "dwg" => cad::convert(bytes),
        "dwf" => dwf::convert(bytes),
        "xlsx" => workbook::inline(bytes),
        "table" => workbook::inline_model(&table::model(bytes)?),
        "svg" => artwork::svg(bytes),
        "image" => artwork::image(bytes),
        _ => Err(format!("Unsupported source document: {kind}")),
    }
}
