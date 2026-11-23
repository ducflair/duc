use crate::source_document;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn source_document_pdf(kind: &str, bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
    source_document::convert(kind, bytes).map_err(JsValue::from)
}

#[wasm_bindgen]
pub fn source_table_workbook(bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
    source_document::table_workbook(bytes).map_err(JsValue::from)
}

#[wasm_bindgen]
pub fn source_workbook_print(bytes: &[u8], settings: &str) -> Result<Vec<u8>, JsValue> {
    source_document::print_workbook(bytes, settings).map_err(JsValue::from)
}

#[wasm_bindgen]
pub fn source_document_info(bytes: &[u8]) -> Result<String, JsValue> {
    let info = source_document::inspect(bytes).map_err(JsValue::from)?;
    serde_json::to_string(&info).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn source_document_view(bytes: &[u8], settings: &str) -> Result<Vec<u8>, JsValue> {
    let view = serde_json::from_str(settings).map_err(|e| JsValue::from_str(&e.to_string()))?;
    source_document::export_view(bytes, &view).map_err(JsValue::from)
}

#[wasm_bindgen]
pub fn source_document_layers(bytes: &[u8], settings: &str) -> Result<Vec<u8>, JsValue> {
    let layers = serde_json::from_str(settings).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(source_document::with_layers(bytes, &layers, false)
        .map_err(JsValue::from)?
        .unwrap_or_else(|| bytes.to_vec()))
}
