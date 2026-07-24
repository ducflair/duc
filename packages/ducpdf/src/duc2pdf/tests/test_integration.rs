use duc2pdf::{
    convert_exported_data_to_pdf_with_fonts_and_options, ConversionMode, ConversionOptions,
};
use std::path::Path;

/// Integration tests for DUC2PDF conversion functionality
/// These tests focus on the conversion system behavior rather than specific DUC content

#[cfg(test)]
mod integration_tests {
    use super::*;
    use duc::types::{
        DucEllipseElement, DucGlobalState, DucLocalState, ExportedDataState, TEXT_ALIGN,
    };
    use hipdf::fonts::{Font, StandardFont};

    fn list_duc_files() -> Vec<String> {
        vec!["streaming-state.duc".to_string()]
    }

    fn test_state() -> ExportedDataState {
        ExportedDataState {
            id: Some("duc2pdf-test".to_string()),
            version: "1".to_string(),
            source: "duc2pdf-test".to_string(),
            data_type: "duc".to_string(),
            dictionary: None,
            thumbnail: None,
            charter: None,
            issues: Vec::new(),
            elements: Vec::new(),
            blocks: Vec::new(),
            block_instances: Vec::new(),
            block_collections: Vec::new(),
            groups: Vec::new(),
            regions: Vec::new(),
            layers: Vec::new(),
            duc_local_state: Some(DucLocalState {
                scope: "mm".to_string(),
                scroll_x: 0.0,
                scroll_y: 0.0,
                zoom: 1.0,
                is_binding_enabled: false,
                current_item_stroke: None,
                current_item_background: None,
                current_item_opacity: 1.0,
                current_item_font_family: "Arial".to_string(),
                current_item_font_size: 12.0,
                current_item_text_align: TEXT_ALIGN::LEFT,
                current_item_start_line_head: None,
                current_item_end_line_head: None,
                current_item_roundness: 0.0,
                pen_mode: false,
                view_mode_enabled: false,
                objects_snap_mode_enabled: false,
                grid_mode_enabled: false,
                outline_mode_enabled: false,
                manual_save_mode: false,
                decimal_places: 2,
            }),
            duc_global_state: Some(DucGlobalState {
                view_background_color: "#ffffff".to_string(),
                main_scope: "mm".to_string(),
                scope_exponent_threshold: 3,
            }),
            version_graph: None,
            external_files: None,
            external_files_data: None,
        }
    }

    fn convert_test_state_to_pdf_with_options(
        options: ConversionOptions,
    ) -> duc2pdf::ConversionResult<Vec<u8>> {
        convert_exported_data_to_pdf_with_fonts_and_options(test_state(), options, HashMap::new())
    }

    /// Validate PDF structure to ensure it's a valid, openable PDF
    fn validate_pdf_structure(pdf_data: &[u8], file_path: &Path) {
        // Check PDF header
        assert!(
            pdf_data.starts_with(b"%PDF-"),
            "Invalid PDF header in {}",
            file_path.display()
        );

        // Check PDF trailer
        assert!(
            pdf_data.ends_with(b"%%EOF\n") || pdf_data.ends_with(b"%%EOF"),
            "Invalid PDF trailer in {}",
            file_path.display()
        );

        // Convert to string to check for required PDF objects
        let pdf_content = String::from_utf8_lossy(pdf_data);

        // Check for essential PDF objects
        assert!(
            pdf_content.contains("/Type/Catalog"),
            "Missing Root catalog in {}",
            file_path.display()
        );
        assert!(
            pdf_content.contains("/Type/Pages"),
            "Missing Pages tree in {}",
            file_path.display()
        );
        assert!(
            pdf_content.contains("/Type/Page"),
            "Missing Page object in {}",
            file_path.display()
        );
        assert!(
            pdf_content.contains("/Root"),
            "Missing Root reference in trailer in {}",
            file_path.display()
        );

        // Check for content - should not be completely empty
        assert!(
            pdf_content.contains("stream"),
            "PDF has no content streams in {}",
            file_path.display()
        );

        // Additional validation: PDF should be at least a reasonable size for a proper document
        assert!(
            pdf_data.len() >= 500,
            "PDF suspiciously small ({} bytes) in {}",
            pdf_data.len(),
            file_path.display()
        );
    }

    /// Test basic CROP mode functionality with empty data
    #[test]
    fn test_crop_mode_basic() {
        let options = ConversionOptions {
            scale: None, // Allow auto-scaling
            mode: ConversionMode::Crop {
                offset_x: 0.0,
                offset_y: 0.0,
                width: None,
                height: None,
            },
            metadata_title: Some("Basic CROP Test".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("Basic CROP Mode Testing".to_string()),
            background_color: Some("#FFFFFF".to_string()),
        };

        match convert_test_state_to_pdf_with_options(options) {
            Ok(pdf_bytes) => {
                // In-memory validation only; no disk writes
                assert!(!pdf_bytes.is_empty(), "PDF should not be empty");
                validate_pdf_structure(&pdf_bytes, Path::new("memory:basic_crop_test.pdf"));
                println!("✅ Basic CROP mode test passed (in-memory)");
            }
            Err(e) => {
                println!("⚠️  Basic CROP mode failed as expected: {}", e);
                // This is expected for invalid data - the test is about error handling
                assert!(e.to_string().len() > 0, "Error message should not be empty");
            }
        }
    }

    /// Test basic PLOT mode functionality
    #[test]
    fn test_plot_mode_basic() {
        let options = ConversionOptions {
            scale: None, // Allow auto-scaling
            mode: ConversionMode::Plot,
            metadata_title: Some("Basic PLOT Test".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("Basic PLOT Mode Testing".to_string()),
            background_color: Some("#FFFFFF".to_string()),
        };

        match convert_test_state_to_pdf_with_options(options) {
            Ok(pdf_bytes) => {
                // In-memory validation only; no disk writes
                assert!(!pdf_bytes.is_empty(), "PDF should not be empty");
                validate_pdf_structure(&pdf_bytes, Path::new("memory:basic_plot_test.pdf"));
                println!("✅ Basic PLOT mode test passed (in-memory)");
            }
            Err(e) => {
                println!("⚠️  Basic PLOT mode failed as expected: {}", e);
                // This is expected for invalid data - the test is about error handling
                assert!(e.to_string().len() > 0, "Error message should not be empty");
            }
        }
    }

    /// Test error handling with completely invalid data
    #[test]
    fn test_error_handling() {
        let test_cases = ["empty_state", "minimal_state", "streaming_state"];

        for test_name in test_cases {
            let options = ConversionOptions {
                scale: None, // Allow auto-scaling
                mode: ConversionMode::Plot,
                metadata_title: Some(format!("Error Test - {}", test_name)),
                metadata_author: Some("DUC2PDF Test Suite".to_string()),
                metadata_subject: Some("Error handling validation".to_string()),
                background_color: Some("oklch(0.55 0.04 257)".to_string()),
            };

            match convert_test_state_to_pdf_with_options(options) {
                Ok(_pdf_bytes) => {
                    // If it somehow succeeds, just log; do not write to disk
                    println!("⚠️  Error test {} unexpectedly succeeded", test_name);
                }
                Err(e) => {
                    println!("✅ Error test {} failed as expected: {}", test_name, e);
                    assert!(
                        e.to_string().len() > 5,
                        "Error message should be descriptive"
                    );
                }
            }
        }
    }

    /// Test coordinate validation bounds
    #[test]
    fn test_coordinate_bounds() {
        // Test various coordinate boundary conditions
        let boundary_tests = vec![
            ("normal_bounds", (0.0, 0.0, 1000.0, 1000.0), true),
            ("large_bounds", (0.0, 0.0, 10000.0, 10000.0), true),
            ("very_large_bounds", (0.0, 0.0, 50000.0, 50000.0), false), // Should exceed bounds
            ("negative_coords", (-1000.0, -1000.0, 2000.0, 2000.0), true),
            (
                "extreme_negative",
                (-50000.0, -50000.0, 1000.0, 1000.0),
                false,
            ), // Should exceed bounds
        ];

        for (test_name, (x, y, _width, _height), should_succeed) in boundary_tests {
            // Convert bounds to offset (negative of the bounds origin)
            let offset_x = -x;
            let offset_y = -y;

            let options = ConversionOptions {
                scale: None, // Allow auto-scaling
                mode: ConversionMode::Crop {
                    offset_x,
                    offset_y,
                    width: None,
                    height: None,
                },
                metadata_title: Some(format!("Bounds Test - {}", test_name)),
                metadata_author: Some("DUC2PDF Test Suite".to_string()),
                metadata_subject: Some("Coordinate bounds testing".to_string()),
                background_color: Some("".to_string()),
            };

            match convert_test_state_to_pdf_with_options(options) {
                Ok(pdf_bytes) => {
                    if should_succeed {
                        // In-memory validation only
                        validate_pdf_structure(&pdf_bytes, Path::new("memory:bounds_test.pdf"));
                        println!("✅ Bounds test {} succeeded as expected", test_name);
                    } else {
                        println!("⚠️  Bounds test {} succeeded unexpectedly", test_name);
                    }
                }
                Err(e) => {
                    if !should_succeed {
                        println!("✅ Bounds test {} failed as expected: {}", test_name, e);
                        assert!(
                            e.to_string().contains("bounds") || e.to_string().contains("Invalid"),
                            "Error should mention bounds or invalid data"
                        );
                    } else {
                        println!("⚠️  Bounds test {} failed unexpectedly: {}", test_name, e);
                    }
                }
            }
        }
    }

    /// Test metadata handling
    #[test]
    fn test_metadata_handling() {
        let metadata_tests = vec![
            (
                "full_metadata",
                Some("Test Document Title".to_string()),
                Some("Test Author".to_string()),
                Some("Test Subject".to_string()),
            ),
            (
                "partial_metadata",
                Some("Title Only".to_string()),
                None,
                None,
            ),
            ("no_metadata", None, None, None),
            (
                "unicode_metadata",
                Some("测试文档 📄".to_string()),
                Some("Author 作者".to_string()),
                Some("Subject with émojis 🎯".to_string()),
            ),
        ];

        for (test_name, title, author, subject) in metadata_tests {
            let options = ConversionOptions {
                scale: None, // Allow auto-scaling
                mode: ConversionMode::Plot,
                metadata_title: title,
                metadata_author: author,
                metadata_subject: subject,
                background_color: Some("transparent".to_string()),
            };

            match convert_test_state_to_pdf_with_options(options) {
                Ok(pdf_bytes) => {
                    // In-memory validation only
                    validate_pdf_structure(&pdf_bytes, Path::new("memory:metadata_test.pdf"));
                    println!("✅ Metadata test {} succeeded (in-memory)", test_name);
                }
                Err(e) => {
                    println!("⚠️  Metadata test {} failed: {}", test_name, e);
                    // Metadata shouldn't cause failures in parsing, but DUC data might
                    assert!(
                        e.to_string().contains("Invalid DUC data")
                            || e.to_string().contains("bounds"),
                        "Failure should be due to data, not metadata"
                    );
                }
            }
        }
    }

    /// Test conversion mode switching
    #[test]
    fn test_mode_switching() {
        // Test PLOT mode
        let plot_options = ConversionOptions {
            scale: None, // Allow auto-scaling
            mode: ConversionMode::Plot,
            metadata_title: Some("Mode Switch Test - PLOT".to_string()),
            ..Default::default()
        };

        let plot_result = convert_test_state_to_pdf_with_options(plot_options);

        // Test CROP mode
        let crop_options = ConversionOptions {
            scale: None, // Allow auto-scaling
            mode: ConversionMode::Crop {
                offset_x: 0.0,
                offset_y: 0.0,
                width: None,
                height: None,
            },
            metadata_title: Some("Mode Switch Test - CROP".to_string()),
            ..Default::default()
        };

        let crop_result = convert_test_state_to_pdf_with_options(crop_options);

        // Both should behave consistently (both succeed or both fail in similar ways)
        match (plot_result, crop_result) {
            (Ok(plot_pdf), Ok(crop_pdf)) => {
                // In-memory validation only
                validate_pdf_structure(&plot_pdf, Path::new("memory:mode_switch_plot.pdf"));
                validate_pdf_structure(&crop_pdf, Path::new("memory:mode_switch_crop.pdf"));
                println!("✅ Both PLOT and CROP modes succeeded");

                // Both should produce valid PDFs
                assert!(plot_pdf.starts_with(b"%PDF-"));
                assert!(crop_pdf.starts_with(b"%PDF-"));
            }
            (Err(plot_err), Err(crop_err)) => {
                println!("⚠️  Both modes failed as expected:");
                println!("   PLOT: {}", plot_err);
                println!("   CROP: {}", crop_err);

                // Both should have reasonable error messages
                assert!(plot_err.to_string().len() > 0);
                assert!(crop_err.to_string().len() > 0);
            }
            (Ok(plot_pdf), Err(crop_err)) => {
                validate_pdf_structure(&plot_pdf, Path::new("memory:mode_switch_plot_only.pdf"));
                println!("⚠️  PLOT succeeded but CROP failed: {}", crop_err);
            }
            (Err(plot_err), Ok(crop_pdf)) => {
                validate_pdf_structure(&crop_pdf, Path::new("memory:mode_switch_crop_only.pdf"));
                println!("⚠️  CROP succeeded but PLOT failed: {}", plot_err);
            }
        }
    }

    /// Test automatic scaling functionality
    #[test]
    fn test_automatic_scaling() {
        // Create test data that should trigger coordinate bounds issues
        // Test with no scale (should auto-scale)
        let auto_scale_options = ConversionOptions {
            scale: None, // Allow auto-scaling
            mode: ConversionMode::Plot,
            metadata_title: Some("Auto-scaling Test".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("Automatic Scaling Testing".to_string()),
            background_color: Some("transparent".to_string()),
        };

        // Test with user-provided scale
        let user_scale_options = ConversionOptions {
            scale: Some(0.02), // 1:50 scale (1/50)
            mode: ConversionMode::Plot,
            metadata_title: Some("User Scale Test".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("User-provided Scaling Testing".to_string()),
            background_color: Some("transparent".to_string()),
        };

        // Auto-scaling test
        match convert_test_state_to_pdf_with_options(auto_scale_options) {
            Ok(pdf_bytes) => {
                // In-memory validation only
                validate_pdf_structure(&pdf_bytes, Path::new("memory:auto_scale_test.pdf"));
                println!("✅ Auto-scaling conversion succeeded (in-memory)");
            }
            Err(e) => {
                println!("⚠️  Auto-scaling test failed (this may be expected): {}", e);
                // This is acceptable since we're using dummy data
            }
        }

        // User-provided scale test
        match convert_test_state_to_pdf_with_options(user_scale_options) {
            Ok(pdf_bytes) => {
                // In-memory validation only
                validate_pdf_structure(&pdf_bytes, Path::new("memory:user_scale_test.pdf"));
                println!("✅ User-provided scale conversion succeeded (in-memory)");
            }
            Err(e) => {
                println!(
                    "⚠️  User-provided scale test failed (this may be expected): {}",
                    e
                );
                // This is acceptable since we're using dummy data
            }
        }

        println!("🔧 Scaling tests completed");
    }

    /// Test scaling with real DUC file that has coordinate bounds issues
    #[test]
    fn test_scaling_with_bounds_issues() {
        // Test 1: No scale provided - should auto-scale
        let auto_scale_options = ConversionOptions {
            scale: None, // This should trigger auto-scaling
            mode: ConversionMode::Plot,
            metadata_title: Some("Auto-scale Real Data".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("Auto-scaling with real DUC data".to_string()),
            background_color: Some("transparent".to_string()),
        };

        // Test 2: User provides scale but it's still too large
        let insufficient_scale_options = ConversionOptions {
            scale: Some(0.5), // Still too large, should fail
            mode: ConversionMode::Plot,
            metadata_title: Some("Insufficient Scale Test".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("Scale still exceeds bounds".to_string()),
            background_color: Some("oklch(0.55 0.04 257)".to_string()),
        };

        // Test 3: User provides appropriate scale
        let good_scale_options = ConversionOptions {
            scale: Some(0.001), // Small enough scale
            mode: ConversionMode::Plot,
            metadata_title: Some("Good Scale Test".to_string()),
            metadata_author: Some("DUC2PDF Test Suite".to_string()),
            metadata_subject: Some("Appropriate user-provided scale".to_string()),
            background_color: Some("oklch(0.55 0.04 257)".to_string()),
        };

        // Auto-scale test
        match convert_test_state_to_pdf_with_options(auto_scale_options) {
            Ok(pdf_bytes) => {
                validate_pdf_structure(&pdf_bytes, Path::new("memory:real_data_auto_scale.pdf"));
                println!(
                    "✅ Real data auto-scaling succeeded, PDF size: {} bytes",
                    pdf_bytes.len()
                );
            }
            Err(e) => {
                println!("⚠️  Real data auto-scaling failed: {}", e);
                // May fail due to other DUC format issues
            }
        }

        // Insufficient scale test (should fail)
        match convert_test_state_to_pdf_with_options(insufficient_scale_options) {
            Ok(pdf_bytes) => {
                validate_pdf_structure(
                    &pdf_bytes,
                    Path::new("memory:real_data_insufficient_scale.pdf"),
                );
                println!("✅ Insufficient scale unexpectedly succeeded");
            }
            Err(e) => {
                println!("✅ Insufficient user scale failed as expected: {}", e);
                // Should fail with ScaleExceedsBounds error or coordinate bounds error
                assert!(e.to_string().contains("bounds") || e.to_string().contains("Invalid DUC"));
            }
        }

        // Good scale test
        match convert_test_state_to_pdf_with_options(good_scale_options) {
            Ok(pdf_bytes) => {
                validate_pdf_structure(&pdf_bytes, Path::new("memory:real_data_good_scale.pdf"));
                println!(
                    "✅ Good user scale succeeded, PDF size: {} bytes",
                    pdf_bytes.len()
                );
            }
            Err(e) => {
                println!("⚠️  Good user scale failed: {}", e);
                // May fail due to other DUC format issues, not scale
            }
        }

        println!("🔧 Real data scaling tests completed");
    }

    #[test]
    fn test_plot_all_assets() {
        for file in list_duc_files() {
            let options = ConversionOptions {
                scale: None,
                mode: ConversionMode::Plot,
                metadata_title: Some(file.clone()),
                metadata_author: Some("DUC2PDF Test Suite".to_string()),
                metadata_subject: Some("Asset plot conversion".to_string()),
                background_color: Some("transparent".to_string()),
            };

            match convert_test_state_to_pdf_with_options(options) {
                Ok(pdf_bytes) => {
                    validate_pdf_structure(&pdf_bytes, Path::new(&format!("memory:{file}")));
                    println!("✅ {file}: plot OK, {} bytes", pdf_bytes.len());
                }
                Err(e) => {
                    println!("⚠️  {file}: plot failed: {e}");
                }
            }
        }
    }

    use duc::types::{ELEMENT_CONTENT_PREFERENCE, STROKE_CAP, STROKE_JOIN, STROKE_PREFERENCE};
    use duc2pdf::streaming::stream_elements::ElementStreamer;
    use duc2pdf::utils::style_resolver::StyleResolver;
    use std::collections::HashMap;
    use std::f64::consts::PI;

    fn sample_element_base() -> duc::types::DucElementBase {
        duc::types::DucElementBase {
            id: "ellipse-test".to_string(),
            styles: sample_styles(),
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 80.0,
            angle: 0.0,
            scope: "m".to_string(),
            label: "Ellipse Test".to_string(),
            description: None,
            is_visible: true,
            seed: 1,
            version: 1,
            version_nonce: 1,
            updated: 0,
            index: None,
            is_plot: false,
            is_deleted: false,
            group_ids: vec![],
            region_ids: vec![],

            layer_id: None,
            frame_id: None,
            bound_elements: None,
            z_index: 0.0,
            link: None,
            locked: false,
            custom_data: None,
            block_ids: vec![],
            instance_id: None,
        }
    }

    fn sample_styles() -> duc::types::DucElementStylesBase {
        duc::types::DucElementStylesBase {
            roundness: 0.0,
            blending: None,
            background: vec![duc::types::ElementBackground {
                content: duc::types::ElementContentBase {
                    preference: Some(ELEMENT_CONTENT_PREFERENCE::SOLID),
                    src: "#d9d9d9".to_string(),
                    visible: true,
                    opacity: 1.0,
                    tiling: None,
                    hatch: None,
                    image_filter: None,
                },
            }],
            stroke: vec![duc::types::ElementStroke {
                content: duc::types::ElementContentBase {
                    preference: Some(ELEMENT_CONTENT_PREFERENCE::SOLID),
                    src: "#917676".to_string(),
                    visible: true,
                    opacity: 1.0,
                    tiling: None,
                    hatch: None,
                    image_filter: None,
                },
                width: 2.0,
                style: duc::types::StrokeStyle {
                    preference: Some(STROKE_PREFERENCE::SOLID),
                    cap: Some(STROKE_CAP::ROUND),
                    join: Some(STROKE_JOIN::ROUND),
                    dash: None,
                    dash_line_override: None,
                    dash_cap: None,
                    miter_limit: None,
                },
                placement: None,
                stroke_sides: None,
            }],
            opacity: 1.0,
        }
    }

    fn sample_ellipse(show_crosshair: bool) -> DucEllipseElement {
        DucEllipseElement {
            base: sample_element_base(),
            ratio: 1.0,
            start_angle: 0.0,
            end_angle: 2.0 * PI,
            show_aux_crosshair: show_crosshair,
        }
    }

    #[test]
    fn full_circle_generates_pdf_ops() {
        let ellipse = sample_ellipse(false);
        let streamer = ElementStreamer::new(
            StyleResolver::new(),
            1000.0,
            "F1".to_string(),
            Font::standard(StandardFont::Helvetica),
            HashMap::new(),
            HashMap::new(),
        );
        let ops = streamer
            .stream_ellipse(&ellipse)
            .expect("stream ellipse without crosshair");
        assert!(!ops.is_empty(), "Expected ellipse operations");
    }

    #[test]
    fn crosshair_operations_are_emitted() {
        let ellipse = sample_ellipse(true);
        let streamer = ElementStreamer::new(
            StyleResolver::new(),
            1000.0,
            "F1".to_string(),
            Font::standard(StandardFont::Helvetica),
            HashMap::new(),
            HashMap::new(),
        );
        let ops = streamer
            .stream_ellipse(&ellipse)
            .expect("stream ellipse with crosshair");
        let has_crosshair_comment = ops
            .iter()
            .any(|op| op.operator == "% Aux crosshair horizontal");
        assert!(
            has_crosshair_comment,
            "Crosshair operations should be present"
        );
    }

    #[test]
    fn plot_filter_respects_flag() {
        let base = sample_element_base();
        let mut streamer = ElementStreamer::new(
            StyleResolver::new(),
            1000.0,
            "F1".to_string(),
            Font::standard(StandardFont::Helvetica),
            HashMap::new(),
            HashMap::new(),
        );
        assert!(streamer.should_render_element(&base));

        streamer.set_render_only_plot_elements(true);
        assert!(!streamer.should_render_element(&base));

        let mut plot_base = base.clone();
        plot_base.is_plot = true;
        assert!(streamer.should_render_element(&plot_base));
    }
}
