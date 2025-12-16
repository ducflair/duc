use std::sync::Arc;
use wasm_bindgen::prelude::*;

/// Result type for conversion operations
#[derive(serde::Serialize)]
pub struct SvgPage {
    pub svg: String,
}

#[derive(serde::Serialize)]
pub struct ConversionResult {
    pub pages: Vec<SvgPage>,
}

/// Convert PDF bytes to an array of SVG strings (one per page)
pub fn convert_pdf_to_svg_pages(pdf_bytes: &[u8]) -> Result<Vec<String>, String> {
    // Wrap bytes in Arc for hayro API
    let data: Arc<dyn AsRef<[u8]> + Send + Sync> = Arc::new(pdf_bytes.to_vec());

    // Parse PDF
    let pdf = hayro::Pdf::new(data).map_err(|e| format!("Failed to parse PDF: {:?}", e))?;

    let settings = hayro::InterpreterSettings::default();
    let mut svg_pages = Vec::new();

    // Convert each page to SVG
    for page in pdf.pages().iter() {
        let svg_string = hayro_svg::convert(&page, &settings);
        svg_pages.push(svg_string);
    }

    Ok(svg_pages)
}

/// WASM binding: Convert PDF bytes to JSON array of SVG pages
#[wasm_bindgen]
pub fn convert_pdf_to_svg_rs(pdf_data: &[u8]) -> Result<String, JsValue> {
    match convert_pdf_to_svg_pages(pdf_data) {
        Ok(svg_strings) => {
            let pages: Vec<SvgPage> = svg_strings.into_iter().map(|svg| SvgPage { svg }).collect();

            let result = ConversionResult { pages };

            serde_json::to_string(&result)
                .map_err(|e| JsValue::from_str(&format!("JSON serialization failed: {}", e)))
        }
        Err(e) => Err(JsValue::from_str(&e)),
    }
}
