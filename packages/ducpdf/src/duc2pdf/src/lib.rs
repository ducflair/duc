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
            // No scale provided, calculate required scale to fit within bounds
            let max_coord = x.abs().max(y.abs());
            let required_scale = MAX_COORDINATE_MM / max_coord * 0.95; // 5% safety margin
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
            duc::types::DucElementEnum::DucMermaidElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucTableElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucImageElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucTextElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucLinearElement(elem) => &elem.linear_base.base,
            duc::types::DucElementEnum::DucArrowElement(elem) => &elem.linear_base.base,
            duc::types::DucElementEnum::DucFreeDrawElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucFrameElement(elem) => &elem.stack_element_base.base,
            duc::types::DucElementEnum::DucPlotElement(elem) => &elem.stack_element_base.base,
            duc::types::DucElementEnum::DucViewportElement(elem) => &elem.linear_base.base,
            duc::types::DucElementEnum::DucXRayElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucLeaderElement(elem) => &elem.linear_base.base,
            duc::types::DucElementEnum::DucDimensionElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucFeatureControlFrameElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucDocElement(elem) => &elem.base,
            duc::types::DucElementEnum::DucParametricElement(elem) => &elem.base,
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

/// Calculate required scale to fit content within safe bounds
pub fn calculate_required_scale(
    data: &duc::types::ExportedDataState,
    crop_offset: Option<(f64, f64)>,
) -> f64 {
    let (min_x, min_y, width, height) = calculate_bounding_box(data);

    // Apply offset if cropping - assume coordinates are already in millimeters
    let (effective_min_x, effective_min_y) = if let Some((offset_x_mm, offset_y_mm)) = crop_offset {
        // With offset, we're essentially moving the viewport, so adjust the bounding box accordingly
        (min_x - offset_x_mm, min_y - offset_y_mm)
    } else {
        (min_x, min_y)
    };

    let max_x = effective_min_x + width;
    let max_y = effective_min_y + height;

    // Find the maximum coordinate in any direction from the DUC content
    let max_coord_from_content = effective_min_x
        .abs()
        .max(effective_min_y.abs())
        .max(max_x.abs())
        .max(max_y.abs());

    // CRITICAL: Always check coordinate limits
    if max_coord_from_content <= MAX_COORDINATE_MM {
        return 1.0; // No scaling needed for content
    }

    // Calculate scale with 5% safety margin to ensure coordinates stay within limits
    MAX_COORDINATE_MM / max_coord_from_content * 0.95
}

/// Calculate required scale to fit both content AND crop dimensions within safe bounds
pub fn calculate_required_scale_with_crop_dimensions(
    data: &duc::types::ExportedDataState,
    crop_offset: Option<(f64, f64)>,
    crop_width: Option<f64>,
    crop_height: Option<f64>,
) -> f64 {
    // First, calculate scale based on content
    let content_scale = calculate_required_scale(data, crop_offset);

    // Then, calculate scale based on crop dimensions if provided
    let crop_scale = if let (Some(width), Some(height)) = (crop_width, crop_height) {
        // The crop dimensions define the viewport size, so we need to ensure they fit within PDF bounds
        let max_crop_dimension = width.max(height);

        if max_crop_dimension <= MAX_COORDINATE_MM {
            None // No scaling needed for crop dimensions
        } else {
            Some(MAX_COORDINATE_MM / max_crop_dimension * 0.95) // 5% safety margin
        }
    } else {
        None // No crop dimensions to consider
    };

    // Use the more restrictive scale (smaller value) to ensure both content and crop dimensions fit
    match crop_scale {
        Some(crop_scale) => content_scale.min(crop_scale),
        None => content_scale,
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

/// Main conversion function with options
pub fn convert_duc_to_pdf_with_options(
    duc_data: &[u8],
    options: ConversionOptions,
) -> ConversionResult<Vec<u8>> {
    let mut normalized_options = options;
    normalized_options.background_color =
        normalize_background_color(normalized_options.background_color);

    // Parse DUC data
    let exported_data =
        duc::parse::parse(duc_data).map_err(|e| ConversionError::InvalidDucData(e.to_string()))?;

    // Use the builder to convert
    builder::DucToPdfBuilder::new(exported_data, normalized_options)?.build()
}

/// WASM binding for the main conversion function
#[wasm_bindgen]
pub fn convert_duc_to_pdf_rs(duc_data: &[u8]) -> Vec<u8> {
    match convert_duc_to_pdf_with_options(duc_data, ConversionOptions::default()) {
        Ok(pdf_bytes) => pdf_bytes,
        Err(e) => {
            // Log error with context
            error_handling::log_error_details(
                &e,
                duc_data.len(),
                "Standard conversion (default options)",
            );

            // Create structured error info and convert to WASM bytes
            let error_info = error_handling::create_error_info(&e, duc_data.len(), None);
            error_handling::error_to_wasm_bytes(&error_info)
        }
    }
}

/// Conversion function with crop mode
pub fn convert_duc_to_pdf_crop(
    duc_data: &[u8],
    offset_x: f64,
    offset_y: f64,
) -> ConversionResult<Vec<u8>> {
    convert_duc_to_pdf_crop_with_options(duc_data, offset_x, offset_y, None, None, None)
}

/// Conversion function with crop mode and specific dimensions
pub fn convert_duc_to_pdf_crop_with_dimensions(
    duc_data: &[u8],
    offset_x: f64,
    offset_y: f64,
    width: f64,
    height: f64,
) -> ConversionResult<Vec<u8>> {
    convert_duc_to_pdf_crop_with_options(
        duc_data,
        offset_x,
        offset_y,
        Some(width),
        Some(height),
        None,
    )
}

pub fn convert_duc_to_pdf_crop_with_options(
    duc_data: &[u8],
    offset_x: f64,
    offset_y: f64,
    width: Option<f64>,
    height: Option<f64>,
    background_color: Option<String>,
) -> ConversionResult<Vec<u8>> {
    let options = ConversionOptions {
        mode: ConversionMode::Crop {
            offset_x,
            offset_y,
            width,
            height,
        },
        background_color,
        ..Default::default()
    };
    convert_duc_to_pdf_with_options(duc_data, options)
}

/// WASM binding for crop conversion
#[wasm_bindgen]
pub fn convert_duc_to_pdf_crop_wasm(
    duc_data: &[u8],
    offset_x: f64,
    offset_y: f64,
    width: Option<f64>,
    height: Option<f64>,
    background_color: Option<String>,
) -> Vec<u8> {
    // Validate basic inputs first
    if let Err(validation_error) = error_handling::validate_basic_inputs(
        duc_data,
        Some(offset_x),
        Some(offset_y),
        width,
        height,
    ) {
        let error_info = error_handling::WasmErrorInfo {
            error: validation_error.clone(),
            error_type: "ValidationError".to_string(),
            details: validation_error,
            duc_data_length: duc_data.len(),
            conversion_context: None,
        };
        return error_handling::error_to_wasm_bytes(&error_info);
    }

    let normalized_background = normalize_background_color(background_color);

    match convert_duc_to_pdf_crop_with_options(
        duc_data,
        offset_x,
        offset_y,
        width,
        height,
        normalized_background.clone(),
    ) {
        Ok(pdf_bytes) => pdf_bytes,
        Err(e) => {
            // Log error with context and crop details
            error_handling::log_error_details(&e, duc_data.len(), "Crop conversion");
            error_handling::log_crop_details(offset_x, offset_y, width, height);

            // Create structured error info with crop context
            let crop_options = ConversionOptions {
                mode: ConversionMode::Crop {
                    offset_x,
                    offset_y,
                    width,
                    height,
                },
                background_color: normalized_background,
                ..Default::default()
            };
            let error_info =
                error_handling::create_error_info(&e, duc_data.len(), Some(&crop_options));
            error_handling::error_to_wasm_bytes(&error_info)
        }
    }
}
