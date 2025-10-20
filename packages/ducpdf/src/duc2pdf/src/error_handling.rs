//! Error handling utilities for DUC to PDF conversion
//!
//! This module provides centralized error handling and reporting functionality
//! for WASM bindings, ensuring consistent error information propagation.

use crate::{ConversionError, ConversionOptions};
use serde::Serialize;

/// Structured error information for WASM communication
#[derive(Serialize)]
pub struct WasmErrorInfo {
    pub error: String,
    pub error_type: String,
    pub details: String,
    pub duc_data_length: usize,
    pub conversion_context: Option<ConversionContext>,
}

/// Context information about the conversion when error occurred
#[derive(Serialize)]
pub struct ConversionContext {
    pub has_offset: bool,
    pub has_dimensions: bool,
    pub has_zoom: bool,
    pub has_scale: bool,
}

/// Creates structured error information for WASM communication
pub fn create_error_info(
    error: &ConversionError,
    duc_data_length: usize,
    options: Option<&ConversionOptions>,
) -> WasmErrorInfo {
    let error_type = std::any::type_name_of_val(error);

    let details = match error {
        ConversionError::InvalidDucData(msg) => {
            format!("DUC parsing failed: {}", msg)
        }
        ConversionError::CoordinateOutOfBounds(x, y) => {
            format!(
                "Coordinate out of bounds: x={}, y={} (max allowed: ±{}). Note: This should be prevented by automatic scaling - the scaling logic may need investigation.",
                x, y, crate::MAX_COORDINATE_MM
            )
        }
        ConversionError::ScaleExceedsBounds(x, y, scale) => {
            format!(
                "Scale exceeds bounds: x={}, y={}, scale={} (max allowed: ±{}). This indicates the automatic scaling logic failed - investigate the scaling calculation.",
                x, y, scale, crate::MAX_COORDINATE_MM
            )
        }
        ConversionError::PrecisionTooHigh(precision) => {
            format!("Precision too high: {} (min allowed: {})", precision, crate::MIN_PRECISION_MM)
        }
        ConversionError::PdfGenerationError(msg) => {
            format!("PDF generation failed: {}", msg)
        }
        ConversionError::ResourceLoadError(msg) => {
            format!("Resource loading failed: {}", msg)
        }
    };

    let conversion_context = options.map(|opts| ConversionContext {
        has_offset: match &opts.mode {
            crate::ConversionMode::Crop { .. } => true,
            crate::ConversionMode::Plot => false,
        },
        has_dimensions: match &opts.mode {
            crate::ConversionMode::Crop { width, height, .. } => width.is_some() && height.is_some(),
            crate::ConversionMode::Plot => false,
        },
        has_zoom: false, // zoom is handled in JavaScript side
        has_scale: opts.scale.is_some(),
    });

    WasmErrorInfo {
        error: error.to_string(),
        error_type: error_type.to_string(),
        details,
        duc_data_length,
        conversion_context,
    }
}

/// Logs detailed error information to console
pub fn log_error_details(error: &ConversionError, duc_data_length: usize, context: &str) {
    println!("=== DUC to PDF Conversion Error ===");
    println!("Context: {}", context);
    println!("Error type: {:?}", std::any::type_name_of_val(error));
    println!("Error details: {}", error);
    println!("DUC data length: {} bytes", duc_data_length);

    // Add specific debugging information based on error type
    match error {
        ConversionError::InvalidDucData(msg) => {
            println!("DUC parsing failed: {}", msg);
            println!("Possible causes: corrupted DUC data, incomplete file transfer, or incompatible DUC version");
        }
        ConversionError::CoordinateOutOfBounds(x, y) => {
            println!("Coordinate out of bounds: x={}, y={} (max allowed: ±{})", x, y, crate::MAX_COORDINATE_MM);
            println!("⚠️  This should be prevented by automatic scaling! Investigate the scaling logic in:");
            println!("   - calculate_required_scale() function");
            println!("   - validate_all_coordinates_with_scale() function");
            println!("   - DucDataScaler scaling application");
        }
        ConversionError::ScaleExceedsBounds(x, y, scale) => {
            println!("Scale exceeds bounds: x={}, y={}, scale={} (max allowed: ±{})", x, y, scale, crate::MAX_COORDINATE_MM);
            println!("⚠️  User-provided scale still exceeds bounds! The scaling validation may need improvement.");
        }
        ConversionError::PrecisionTooHigh(precision) => {
            println!("Precision too high: {} (min allowed: {})", precision, crate::MIN_PRECISION_MM);
        }
        ConversionError::PdfGenerationError(msg) => {
            println!("PDF generation failed: {}", msg);
            println!("Possible causes: memory issues, PDF content problems, or resource loading failures");
        }
        ConversionError::ResourceLoadError(msg) => {
            println!("Resource loading failed: {}", msg);
            println!("Possible causes: missing embedded resources, font loading issues, or image processing failures");
        }
    }
}

/// Logs specific crop operation details
pub fn log_crop_details(offset_x: f64, offset_y: f64, width: Option<f64>, height: Option<f64>) {
    println!("Crop operation details:");
    println!("  Offset: x={}, y={}", offset_x, offset_y);
    if let Some(w) = width {
        println!("  Width: {}", w);
    }
    if let Some(h) = height {
        println!("  Height: {}", h);
    }
}

/// Validates basic input parameters for conversion operations
pub fn validate_basic_inputs(duc_data: &[u8], offset_x: Option<f64>, offset_y: Option<f64>, width: Option<f64>, height: Option<f64>) -> Result<(), String> {
    // Validate DUC data
    if duc_data.is_empty() {
        return Err("DUC data is empty".to_string());
    }

    // Validate numeric parameters
    if let Some(x) = offset_x {
        if !x.is_finite() {
            return Err(format!("Invalid offset_x: {} (must be finite)", x));
        }
    }

    if let Some(y) = offset_y {
        if !y.is_finite() {
            return Err(format!("Invalid offset_y: {} (must be finite)", y));
        }
    }

    if let Some(w) = width {
        if !w.is_finite() || w <= 0.0 {
            return Err(format!("Invalid width: {} (must be positive finite)", w));
        }
    }

    if let Some(h) = height {
        if !h.is_finite() || h <= 0.0 {
            return Err(format!("Invalid height: {} (must be positive finite)", h));
        }
    }

    Ok(())
}

/// Converts a ConversionError to a WASM-compatible byte vector
pub fn error_to_wasm_bytes(error_info: &WasmErrorInfo) -> Vec<u8> {
    let error_json = serde_json::to_string(error_info).unwrap_or_else(|e| {
        format!(r#"{{"error":"Failed to serialize error","details":"{}"}}"#, e)
    });

    let mut result = b"ERROR:".to_vec();
    result.extend_from_slice(error_json.as_bytes());
    result
}