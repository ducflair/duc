use std::collections::HashMap;
use wasm_bindgen::prelude::*;

pub mod builder;

// Initialize logger for WASM
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn init_logger() {
    console_log::init_with_level(log::Level::Info).expect("Failed to initialize logger");
}
pub mod scaling;
pub mod streaming;
pub mod utils;

mod error_handling;

// Coordinate system constants
pub const MAX_COORDINATE_MM: f64 = 4_800.0; // Safe maximum coordinate in mm
pub const MIN_PRECISION_MM: f64 = 50.0; // Minimum precision in mm
pub const PDF_USER_UNIT: f32 = 72.0 / 25.4; // Convert mm to PDF units (1 inch = 25.4mm = 72 points)

// Comfortable viewer thresholds & industry standards (ISO 216 / ISO 5455)
pub const MIN_COMFORTABLE_MM: f64 = 150.0; // A5 small edge threshold: smaller than this gets magnified
pub const MAX_COMFORTABLE_MM: f64 = 1_250.0; // Arch E / A0 threshold: larger than this gets reduced
pub const TARGET_MAX_MM: f64 = 1_189.0; // Standard A0 length (maximum standard blueprint sheet)
pub const TARGET_MIN_MM: f64 = 210.0; // Standard A4 width (minimum standard reader sheet)

/// Standard reduction ratios (1:N) per ISO 5455:1979
pub const STANDARD_REDUCTION_RATIOS: &[f64] = &[
    2.0, 2.5, 5.0, 10.0, 20.0, 25.0, 50.0, 75.0, 100.0, 125.0, 150.0, 200.0, 250.0, 500.0,
    1_000.0, 2_000.0, 2_500.0, 5_000.0, 10_000.0, 20_000.0, 50_000.0, 100_000.0,
];

/// Standard enlargement ratios (M:1) per ISO 5455:1979
pub const STANDARD_ENLARGEMENT_RATIOS: &[f64] = &[
    2.0, 2.5, 5.0, 10.0, 20.0, 25.0, 50.0, 100.0,
];

/// Formats a clean scale string (e.g. "Scale: 1:1", "Scale: 1:20", "Scale: 10:1")
pub fn format_scale_string(scale: f64) -> String {
    if !scale.is_finite() || (scale - 1.0).abs() < 1e-6 {
        "Scale: 1:1".to_string()
    } else if scale < 1.0 {
        let ratio = 1.0 / scale;
        if (ratio - ratio.round()).abs() < 1e-4 {
            format!("Scale: 1:{}", ratio.round() as i64)
        } else if ((ratio * 10.0) - (ratio * 10.0).round()).abs() < 1e-4 {
            format!("Scale: 1:{:.1}", ratio)
        } else {
            let s = format!("Scale: 1:{:.4}", ratio);
            s.trim_end_matches('0').trim_end_matches('.').to_string()
        }
    } else {
        let ratio = scale;
        if (ratio - ratio.round()).abs() < 1e-4 {
            format!("Scale: {}:1", ratio.round() as i64)
        } else if ((ratio * 10.0) - (ratio * 10.0).round()).abs() < 1e-4 {
            format!("Scale: {:.1}:1", ratio)
        } else {
            let s = format!("Scale: {:.4}:1", ratio);
            s.trim_end_matches('0').trim_end_matches('.').to_string()
        }
    }
}

/// Calculate a comfortable scale factor based on standard drawing scales (ISO 5455).
/// - Dimensions between MIN_COMFORTABLE_MM (150mm) and MAX_COMFORTABLE_MM (1250mm) remain exact 1:1.
/// - Dimensions larger than MAX_COMFORTABLE_MM are reduced (1:N) to fit comfortably on standard large sheets (<= 1189mm).
/// - Dimensions smaller than MIN_COMFORTABLE_MM are enlarged (M:1) to fit comfortably on standard reader sheets (>= 210mm).
pub fn calculate_comfortable_scale(max_dim: f64) -> f64 {
    if !max_dim.is_finite() || max_dim <= 0.0 {
        return 1.0;
    }

    if max_dim >= MIN_COMFORTABLE_MM && max_dim <= MAX_COMFORTABLE_MM {
        return 1.0;
    }

    if max_dim > MAX_COMFORTABLE_MM {
        for &ratio in STANDARD_REDUCTION_RATIOS {
            if max_dim / ratio <= TARGET_MAX_MM {
                return 1.0 / ratio;
            }
        }
        return TARGET_MAX_MM / max_dim;
    }

    // max_dim < MIN_COMFORTABLE_MM: enlargement
    for &ratio in STANDARD_ENLARGEMENT_RATIOS {
        let enlarged = max_dim * ratio;
        if enlarged >= TARGET_MIN_MM && enlarged <= MAX_COMFORTABLE_MM {
            return ratio;
        }
    }

    for &ratio in STANDARD_ENLARGEMENT_RATIOS.iter().rev() {
        if max_dim * ratio <= MAX_COMFORTABLE_MM {
            return ratio;
        }
    }

    1.0
}

fn normalize_background_color(color: Option<String>) -> Option<String> {
    color.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else if trimmed.eq_ignore_ascii_case("transparent") {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

#[derive(Debug)]
pub enum ConversionMode {
    Plot,
    Crop {
        offset_x: f64,
        offset_y: f64,
        width: Option<f64>, // Optional crop width in mm (None = use full viewport)
        height: Option<f64>, // Optional crop height in mm (None = use full viewport)
    },
}

#[derive(Debug)]
pub struct ConversionOptions {
    pub mode: ConversionMode,
    pub scale: Option<f64>, // Optional scale factor (e.g., 1.0/50.0, 1.0/10.0)
    pub background_color: Option<String>,
    pub metadata_title: Option<String>,
    pub metadata_author: Option<String>,
    pub metadata_subject: Option<String>,
}

impl Default for ConversionOptions {
    fn default() -> Self {
        Self {
            mode: ConversionMode::Plot,
            scale: None, // No scale by default, will auto-scale if needed
            background_color: None,
            metadata_title: None,
            metadata_author: None,
            metadata_subject: None,
        }
    }
}

#[derive(Debug)]
pub enum ConversionError {
    InvalidDucData(String),
    CoordinateOutOfBounds(f64, f64),
    ScaleExceedsBounds(f64, f64, f64), // (x, y, scale) - when user provided scale still exceeds bounds
    PrecisionTooHigh(f64),
    PdfGenerationError(String),
    ResourceLoadError(String),
}

impl std::fmt::Display for ConversionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConversionError::InvalidDucData(msg) => write!(f, "Invalid DUC data: {}", msg),
            ConversionError::CoordinateOutOfBounds(x, y) => {
                write!(
                    f,
                    "Coordinate ({}, {}) exceeds safe bounds of ±{}mm",
                    x, y, MAX_COORDINATE_MM
                )
            }
            ConversionError::ScaleExceedsBounds(x, y, scale) => {
                write!(f, "Coordinate ({}, {}) with user-provided scale {} still exceeds safe bounds of ±{}mm", x, y, scale, MAX_COORDINATE_MM)
            }
            ConversionError::PrecisionTooHigh(precision) => {
                write!(
                    f,
                    "Precision {} exceeds minimum allowed precision of {}mm",
                    precision, MIN_PRECISION_MM
                )
            }
            ConversionError::PdfGenerationError(msg) => write!(f, "PDF generation error: {}", msg),
            ConversionError::ResourceLoadError(msg) => write!(f, "Resource loading error: {}", msg),
        }
    }
}

impl std::error::Error for ConversionError {}

pub type ConversionResult<T> = Result<T, ConversionError>;

/// Validates coordinates are within safe bounds with optional scaling
pub fn validate_coordinates_with_scale(
    x: f64,
    y: f64,
    scale: Option<f64>,
) -> ConversionResult<f64> {
    let scaled_x = x * scale.unwrap_or(1.0);
    let scaled_y = y * scale.unwrap_or(1.0);

    if scaled_x.abs() > MAX_COORDINATE_MM || scaled_y.abs() > MAX_COORDINATE_MM {
        if scale.is_some() {
            // User provided scale but it still exceeds bounds - this is an error
            return Err(ConversionError::ScaleExceedsBounds(x, y, scale.unwrap()));
        } else {
            // No scale provided, calculate comfortable scale to fit within bounds
            let max_coord = x.abs().max(y.abs());
            let required_scale = calculate_comfortable_scale(max_coord);
            return Ok(required_scale);
        }
    }

    // Coordinates are within bounds
    Ok(scale.unwrap_or(1.0))
}

/// Calculate bounding box for DUC data in millimeters
pub fn calculate_bounding_box(data: &duc::types::ExportedDataState) -> (f64, f64, f64, f64) {
    if data.elements.is_empty() {
        return (0.0, 0.0, 0.0, 0.0);
    }

    let mut min_x = f64::MAX;
    let mut min_y = f64::MAX;
    let mut max_x = f64::MIN;
    let mut max_y = f64::MIN;

    for element_wrapper in &data.elements {
        let base = match &element_wrapper.element {
            duc::types::DucElementEnum::DucRectangleElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucPolygonElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucEllipseElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucEmbeddableElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucPdfElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucTableElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucImageElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucTextElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucLinearElement(elem) => &elem.linear_base.base,
            duc::types::DucElementEnum::DucArrowElement(elem) => &elem.linear_base.base,
            duc::types::DucElementEnum::DucFreeDrawElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucFrameElement(elem) => &elem.stack_element_base.base,
            duc::types::DucElementEnum::DucPlotElement(elem) => &elem.stack_element_base.base,
            duc::types::DucElementEnum::DucDocElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucModelElement(elem) => &elem.base,
        };

        // Assume all coordinates are already in millimeters
        let (x_mm, y_mm, width_mm, height_mm) = (base.x, base.y, base.width, base.height);

        min_x = min_x.min(x_mm);
        min_y = min_y.min(y_mm);
        max_x = max_x.max(x_mm + width_mm);
        max_y = max_y.max(y_mm + height_mm);
    }

    (min_x, min_y, max_x - min_x, max_y - min_y)
}

/// Calculate required scale to fit content within comfortable bounds
pub fn calculate_required_scale(
    data: &duc::types::ExportedDataState,
    crop_offset: Option<(f64, f64)>,
) -> f64 {
    // In Plot mode (when there are plot elements and no crop offset), scale is determined by plot element dimensions
    let has_plots = data.elements.iter().any(|elem| {
        if let duc::types::DucElementEnum::DucPlotElement(plot) = &elem.element {
            !plot.stack_element_base.base.is_deleted
        } else {
            false
        }
    });

    if has_plots && crop_offset.is_none() {
        let max_plot_dim = data
            .elements
            .iter()
            .filter_map(|elem| {
                if let duc::types::DucElementEnum::DucPlotElement(plot) = &elem.element {
                    let base = &plot.stack_element_base.base;
                    if !base.is_deleted {
                        Some(base.width.max(base.height))
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .fold(0.0, f64::max);

        return calculate_comfortable_scale(max_plot_dim);
    }

    // In fallback or crop mode without explicit dimensions, the page size is the content extent (width and height).
    // The content stream translates by (-origin_x, -origin_y), so world offsets do not affect page coordinates.
    let (_min_x, _min_y, width, height) = calculate_bounding_box(data);
    let max_dim = width.max(height);

    calculate_comfortable_scale(max_dim)
}

/// Calculate required scale to fit both content AND crop dimensions within comfortable bounds
pub fn calculate_required_scale_with_crop_dimensions(
    data: &duc::types::ExportedDataState,
    crop_offset: Option<(f64, f64)>,
    crop_width: Option<f64>,
    crop_height: Option<f64>,
) -> f64 {
    if let (Some(width), Some(height)) = (crop_width, crop_height) {
        let max_crop_dimension = width.max(height);
        calculate_comfortable_scale(max_crop_dimension)
    } else {
        calculate_required_scale(data, crop_offset)
    }
}

/// Validates coordinates are within safe bounds
pub fn validate_coordinates(x: f64, y: f64) -> ConversionResult<()> {
    if x.abs() > MAX_COORDINATE_MM || y.abs() > MAX_COORDINATE_MM {
        return Err(ConversionError::CoordinateOutOfBounds(x, y));
    }
    Ok(())
}

/// Validates precision is above minimum threshold
pub fn validate_precision(precision: f64) -> ConversionResult<()> {
    if precision < MIN_PRECISION_MM {
        return Err(ConversionError::PrecisionTooHigh(precision));
    }
    Ok(())
}

pub fn convert_exported_data_to_pdf_with_fonts_and_options(
    exported_data: duc::types::ExportedDataState,
    options: ConversionOptions,
    font_data: HashMap<String, Vec<u8>>,
) -> ConversionResult<Vec<u8>> {
    let mut normalized_options = options;
    normalized_options.background_color =
        normalize_background_color(normalized_options.background_color);

    builder::DucToPdfBuilder::new(exported_data, normalized_options, font_data)?.build()
}

/// Deserialize a JS font map (Map<string, Uint8Array>) into a Rust HashMap
fn deserialize_font_map(font_map_js: JsValue) -> HashMap<String, Vec<u8>> {
    let mut fonts = HashMap::new();
    if font_map_js.is_undefined() || font_map_js.is_null() {
        return fonts;
    }

    let entries = js_sys::try_iter(&font_map_js).ok().flatten();

    if let Some(iter) = entries {
        for entry_result in iter {
            if let Ok(entry) = entry_result {
                let pair = js_sys::Array::from(&entry);
                if pair.length() == 2 {
                    let key = pair.get(0);
                    let value = pair.get(1);
                    if let Some(family) = key.as_string() {
                        let bytes = js_sys::Uint8Array::new(&value);
                        fonts.insert(family, bytes.to_vec());
                    }
                }
            }
        }
    }
    fonts
}

fn deserialize_exported_data(
    exported_data_js: JsValue,
) -> Result<duc::types::ExportedDataState, String> {
    serde_wasm_bindgen::from_value(exported_data_js)
        .map_err(|e| format!("Failed to deserialize exported data: {}", e))
}

#[wasm_bindgen]
pub fn convert_exported_data_to_pdf_wasm(
    exported_data_js: JsValue,
    offset_x: Option<f64>,
    offset_y: Option<f64>,
    width: Option<f64>,
    height: Option<f64>,
    background_color: Option<String>,
    scale: Option<f64>,
    font_map_js: JsValue,
) -> Vec<u8> {
    if let Some(w) = width {
        if !w.is_finite() || w <= 0.0 {
            let error_info = error_handling::WasmErrorInfo {
                error: format!("Invalid width: {}", w),
                error_type: "ValidationError".to_string(),
                details: format!("width must be a positive finite number, got {}", w),
                duc_data_length: 0,
                conversion_context: None,
            };
            return error_handling::error_to_wasm_bytes(&error_info);
        }
    }

    if let Some(h) = height {
        if !h.is_finite() || h <= 0.0 {
            let error_info = error_handling::WasmErrorInfo {
                error: format!("Invalid height: {}", h),
                error_type: "ValidationError".to_string(),
                details: format!("height must be a positive finite number, got {}", h),
                duc_data_length: 0,
                conversion_context: None,
            };
            return error_handling::error_to_wasm_bytes(&error_info);
        }
    }

    let exported_data = match deserialize_exported_data(exported_data_js) {
        Ok(data) => data,
        Err(details) => {
            let error_info = error_handling::WasmErrorInfo {
                error: details.clone(),
                error_type: "ValidationError".to_string(),
                details,
                duc_data_length: 0,
                conversion_context: None,
            };
            return error_handling::error_to_wasm_bytes(&error_info);
        }
    };

    let font_data = deserialize_font_map(font_map_js);
    let normalized_background = normalize_background_color(background_color);

    let mode = if offset_x.is_some() || offset_y.is_some() {
        ConversionMode::Crop {
            offset_x: offset_x.unwrap_or(0.0),
            offset_y: offset_y.unwrap_or(0.0),
            width,
            height,
        }
    } else {
        ConversionMode::Plot
    };

    let options = ConversionOptions {
        mode,
        scale,
        background_color: normalized_background,
        ..Default::default()
    };

    match convert_exported_data_to_pdf_with_fonts_and_options(exported_data, options, font_data) {
        Ok(pdf_bytes) => pdf_bytes,
        Err(e) => {
            error_handling::log_error_details(&e, 0, "Direct exported data conversion");
            let error_info = error_handling::create_error_info(&e, 0, None);
            error_handling::error_to_wasm_bytes(&error_info)
        }
    }
}

#[cfg(test)]
mod comfortable_scaling_tests {
    use super::*;

    #[test]
    fn standard_sizes_stay_one_to_one() {
        assert_eq!(calculate_comfortable_scale(210.0), 1.0); // A4 width
        assert_eq!(calculate_comfortable_scale(297.0), 1.0); // A4 height
        assert_eq!(calculate_comfortable_scale(420.0), 1.0); // A3 height
        assert_eq!(calculate_comfortable_scale(594.0), 1.0); // A2 height
        assert_eq!(calculate_comfortable_scale(841.0), 1.0); // A1 height
        assert_eq!(calculate_comfortable_scale(1189.0), 1.0); // A0 height
        assert_eq!(calculate_comfortable_scale(1219.2), 1.0); // Arch E
    }

    #[test]
    fn oversized_drawings_reduce_to_standard_scales() {
        // 2,000mm -> 1:2 (1000mm <= 1189mm)
        assert_eq!(calculate_comfortable_scale(2000.0), 0.5);
        // 5,000mm -> 1:5 (1000mm <= 1189mm)
        assert_eq!(calculate_comfortable_scale(5000.0), 0.2);
        // 17,800mm -> 1:20 (890mm <= 1189mm)
        assert_eq!(calculate_comfortable_scale(17800.0), 0.05);
        // 50,000mm -> 1:50 (1000mm <= 1189mm)
        assert_eq!(calculate_comfortable_scale(50000.0), 0.02);
    }

    #[test]
    fn undersized_drawings_enlarge_to_standard_scales() {
        // 25mm -> 10:1 (250mm >= 210mm)
        assert_eq!(calculate_comfortable_scale(25.0), 10.0);
        // 50mm -> 5:1 (250mm >= 210mm)
        assert_eq!(calculate_comfortable_scale(50.0), 5.0);
        // 100mm -> 2.5:1 (250mm >= 210mm)
        assert_eq!(calculate_comfortable_scale(100.0), 2.5);
    }

    #[test]
    fn formats_scale_string_cleanly() {
        assert_eq!(format_scale_string(1.0), "Scale: 1:1");
        assert_eq!(format_scale_string(0.05), "Scale: 1:20");
        assert_eq!(format_scale_string(0.02), "Scale: 1:50");
        assert_eq!(format_scale_string(0.4), "Scale: 1:2.5");
        assert_eq!(format_scale_string(10.0), "Scale: 10:1");
        assert_eq!(format_scale_string(2.5), "Scale: 2.5:1");
        assert_eq!(format_scale_string(2.0), "Scale: 2:1");
    }
}
