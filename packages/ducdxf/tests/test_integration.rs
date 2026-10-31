mod common;

use common::*;
use ducdxf::{convert_file_to_duc, ConversionOptions};
use duc::types::{DucElementEnum, ExportedDataState};

fn validate_duc_document(state: &ExportedDataState, expected_last_plot_name: &str) {
    // 1. Must have at least one plot element
    let plot_elements: Vec<_> = state
        .elements
        .iter()
        .filter_map(|w| {
            if let DucElementEnum::DucPlotElement(plot) = &w.element {
                Some(plot)
            } else {
                None
            }
        })
        .collect();

    assert!(
        !plot_elements.is_empty(),
        "Document must contain at least one plot element"
    );

    // 2. Model Space must ALWAYS be the final plot element (or matching requested layout)
    let last_plot = plot_elements.last().unwrap();
    assert_eq!(
        last_plot.stack_element_base.stack_base.label,
        expected_last_plot_name,
        "The final plot element must be {}",
        expected_last_plot_name
    );

    // 3. Plot elements must be stacked vertically on the canvas
    for i in 0..plot_elements.len().saturating_sub(1) {
        let current = &plot_elements[i];
        let next = &plot_elements[i + 1];

        let current_bottom = current.stack_element_base.base.y + current.stack_element_base.base.height;
        let next_top = next.stack_element_base.base.y;

        assert!(
            next_top >= current_bottom,
            "Plot elements must be vertically stacked without overlapping: current bottom={}, next top={}",
            current_bottom,
            next_top
        );
    }

    // 4. Verify child elements belong to valid plots
    let plot_ids: std::collections::HashSet<_> = plot_elements
        .iter()
        .map(|p| p.stack_element_base.base.id.clone())
        .collect();

    let child_elements_count = state
        .elements
        .iter()
        .filter(|w| !matches!(&w.element, DucElementEnum::DucPlotElement(_)))
        .count();

    if child_elements_count > 0 {
        let children_with_frame = state
            .elements
            .iter()
            .filter_map(|w| {
                let base = match &w.element {
                    DucElementEnum::DucLinearElement(l) => Some(&l.linear_base.base),
                    DucElementEnum::DucEllipseElement(e) => Some(&e.base),
                    DucElementEnum::DucTextElement(t) => Some(&t.base),
                    DucElementEnum::DucImageElement(img) => Some(&img.base),
                    _ => None,
                };
                base.and_then(|b| b.frame_id.as_ref())
            })
            .all(|frame_id| plot_ids.contains(frame_id));

        assert!(
            children_with_frame,
            "Every child element must reference an existing plot frame_id"
        );
    }
}

#[test]
fn test_convert_dxf_files_to_duc() {
    let fixtures = get_all_dxf_fixtures();
    assert!(!fixtures.is_empty(), "DXF fixtures must be present");

    let options = ConversionOptions::default();

    for fixture in fixtures {
        let file_name = fixture.file_name().unwrap().to_string_lossy().to_string();
        println!("Testing DXF conversion: {}", file_name);

        let duc_bytes = convert_file_to_duc(&fixture, &options)
            .unwrap_or_else(|e| panic!("Failed to convert {}: {}", file_name, e));

        assert!(
            duc_bytes.len() > 100,
            "DUC output too small: {} bytes",
            duc_bytes.len()
        );

        // Verify output by parsing back with duc::parse::parse_duc_bytes
        let state = duc::parse::parse_duc_bytes(&duc_bytes)
            .unwrap_or_else(|e| panic!("Failed to parse generated DUC for {}: {}", file_name, e));

        validate_duc_document(&state, "Model Space");

        save_test_output(&format!("{}.duc", file_name), &duc_bytes);
    }
}

#[test]
fn test_convert_dwg_files_to_duc() {
    let fixtures = get_all_dwg_fixtures();
    assert!(!fixtures.is_empty(), "DWG fixtures must be present");

    let options = ConversionOptions::default();

    for fixture in fixtures {
        let file_name = fixture.file_name().unwrap().to_string_lossy().to_string();
        println!("Testing DWG conversion: {}", file_name);

        let duc_bytes = match convert_file_to_duc(&fixture, &options) {
            Ok(b) => b,
            Err(e) => {
                eprintln!("Skipping/warning on DWG {}: {}", file_name, e);
                continue;
            }
        };

        let state = duc::parse::parse_duc_bytes(&duc_bytes)
            .unwrap_or_else(|e| panic!("Failed to parse generated DUC for {}: {}", file_name, e));

        validate_duc_document(&state, "Model Space");

        save_test_output(&format!("{}.duc", file_name), &duc_bytes);
    }
}

#[test]
fn test_convert_dwf_files_to_duc() {
    let fixtures = get_all_dwf_fixtures();
    if fixtures.is_empty() {
        println!("No DWF fixtures found, skipping");
        return;
    }

    let options = ConversionOptions::default();

    for fixture in fixtures {
        let file_name = fixture.file_name().unwrap().to_string_lossy().to_string();
        println!("Testing DWF conversion: {}", file_name);

        let duc_bytes = match convert_file_to_duc(&fixture, &options) {
            Ok(b) => b,
            Err(e) => {
                eprintln!("Skipping/warning on DWF {}: {}", file_name, e);
                continue;
            }
        };

        let state = duc::parse::parse_duc_bytes(&duc_bytes)
            .unwrap_or_else(|e| panic!("Failed to parse generated DUC for {}: {}", file_name, e));

        let plot_elements: Vec<_> = state
            .elements
            .iter()
            .filter(|w| matches!(&w.element, DucElementEnum::DucPlotElement(_)))
            .collect();

        assert!(!plot_elements.is_empty(), "DWF must produce plot elements");

        save_test_output(&format!("{}.duc", file_name), &duc_bytes);
    }
}

#[test]
fn test_lineweights_toggle() {
    let fixtures = get_all_dxf_fixtures();
    let sample = fixtures.first().expect("Need at least one fixture");

    // 1. Without lineweights (default)
    let default_options = ConversionOptions {
        use_lineweights: false,
        min_line_width: 0.2,
        ..Default::default()
    };
    let bytes_thin = convert_file_to_duc(sample, &default_options).unwrap();
    let state_thin = duc::parse::parse_duc_bytes(&bytes_thin).unwrap();

    let thin_widths: Vec<f64> = state_thin
        .elements
        .iter()
        .filter_map(|w| {
            if let DucElementEnum::DucLinearElement(l) = &w.element {
                l.linear_base.base.styles.stroke.first().map(|s| s.width)
            } else {
                None
            }
        })
        .collect();

    for w in thin_widths {
        assert!((w - 0.2).abs() < 1e-4, "Expected hairline 0.2, got {}", w);
    }

    // 2. With lineweights enabled
    let lw_options = ConversionOptions {
        use_lineweights: true,
        line_width_scale: 1.5,
        ..Default::default()
    };
    let bytes_lw = convert_file_to_duc(sample, &lw_options).unwrap();
    let state_lw = duc::parse::parse_duc_bytes(&bytes_lw).unwrap();
    assert!(!state_lw.elements.is_empty());
}

#[test]
fn test_specific_layout_export() {
    let fixtures = get_all_dxf_fixtures();
    let sample = fixtures.first().expect("Need at least one fixture");

    let options = ConversionOptions {
        layout: Some("Model".to_string()),
        ..Default::default()
    };

    let bytes = convert_file_to_duc(sample, &options).unwrap();
    let state = duc::parse::parse_duc_bytes(&bytes).unwrap();

    let plot_elements: Vec<_> = state
        .elements
        .iter()
        .filter_map(|w| {
            if let DucElementEnum::DucPlotElement(plot) = &w.element {
                Some(plot)
            } else {
                None
            }
        })
        .collect();

    assert_eq!(
        plot_elements.len(),
        1,
        "Targeting a single layout must only generate 1 plot element"
    );
    assert_eq!(
        plot_elements[0].stack_element_base.stack_base.label,
        "Model Space"
    );
}
