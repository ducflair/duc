// This is an integration test for ducrs serialization.

use duc::serialize::serialize_duc_file; 
use duc::{
    DucElement, AppState, DucFile, DucElementVariant, DucRectangleElement,
    FontFamily, FrameRendering, Zoom, TextAlign, DesignStandard, AntiAliasing
};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;

// Helper function to get the root of the ducrs package for test output
fn get_crate_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

// Helper function to ensure the output directory exists
fn ensure_output_dir(crate_root: &PathBuf) -> PathBuf {
    let output_dir = crate_root.join("tests").join("output");
    fs::create_dir_all(&output_dir).expect("Failed to create test output directory");
    output_dir
}

#[test]
fn test_serialize_two_rectangles_rs() {
    // Define two simple rectangle elements
    let element1 = DucElement {
        id: "rect_rs_1".to_string(),
        element_type: "rectangle".to_string(),
        x: 10.0,
        y: 20.0,
        width: 100.0,
        height: 50.0,
        angle: 0.0,
        z_index: 1,
        opacity: 1.0,
        locked: false,
        is_visible: true,
        scope: "mm".to_string(),
        stroke: Vec::new(),     
        background: Vec::new(),
        group_ids: Vec::new(),
        bound_elements: None,
        // Required fields
        subset: None,
        label: "Rectangle 1".to_string(),
        roundness: 0.0,
        blending: None,
        seed: None,
        version: None,
        version_nonce: None,
        is_deleted: false,
        frame_id: None,
        updated: None,
        index: None,
        link: None,
        custom_data: None,
    };

    let element2 = DucElement {
        id: "rect_rs_2".to_string(),
        element_type: "rectangle".to_string(),
        x: 150.0,
        y: 100.0,
        width: 80.0,
        height: 40.0,
        angle: 0.0,
        z_index: 2,
        opacity: 1.0,
        locked: false,
        is_visible: true,
        scope: "mm".to_string(),
        stroke: Vec::new(),
        background: Vec::new(),
        group_ids: Vec::new(),
        bound_elements: None,
        // Required fields
        subset: None,
        label: "Rectangle 2".to_string(),
        roundness: 0.0,
        blending: None,
        seed: None,
        version: None,
        version_nonce: None,
        is_deleted: false,
        frame_id: None,
        updated: None,
        index: None,
        link: None,
        custom_data: None,
    };

    // Convert to DucElementVariant
    let variant1 = DucElementVariant::Rectangle(DucRectangleElement { base: element1 });
    let variant2 = DucElementVariant::Rectangle(DucRectangleElement { base: element2 });
    
    let elements = vec![variant1, variant2];
    
    // Create a minimal AppState
    let app_state = AppState {
        active_embeddable_element: None,
        active_embeddable_state: None,
        dragging_element: None,
        resizing_element: None,
        multi_element: None,
        selection_element: None,
        frame_to_highlight: None,
        frame_rendering: FrameRendering {
            enabled: false,
            name: false,
            outline: false,
            clip: false,
        },
        editing_frame: None,
        elements_to_highlight: None,
        editing_element: None,
        current_item_stroke: None,
        current_item_background: None,
        current_item_opacity: 1.0,
        current_item_font_family: FontFamily::Virgil,
        current_item_font_size: 12.0,
        current_item_text_align: TextAlign::Left,
        current_item_start_line_head: None,
        current_item_end_line_head: None,
        current_item_roundness: 0.0,
        current_item_subset: None,
        view_background_color: "#FFFFFF".to_string(),
        scope: "mm".to_string(),
        main_scope: "mm".to_string(),
        standard: DesignStandard::ISO,
        groups: Vec::new(),
        scroll_x: 0.0,
        scroll_y: 0.0,
        cursor_button: None,
        scrolled_outside: false,
        name: None,
        zoom: Zoom { value: 1.0 },
        last_pointer_down_with: None,
        selected_element_ids: HashMap::new(),
        previous_selected_element_ids: None,
        selected_elements_are_being_dragged: None,
        should_cache_ignore_zoom: None,
        grid_size: 20,
        grid_mode_enabled: false,
        grid_step: 2,
        selected_group_ids: None,
        editing_group_id: None,
        paste_dialog_shown: None,
        paste_dialog_data: None,
        scale_ratio_locked: false,
        display_all_point_distances: false,
        display_distance_on_drawing: false,
        display_all_point_coordinates: false,
        display_all_point_info_selected: false,
        display_root_axis: false,
        coord_decimal_places: 2,
        scope_exponent_threshold: 3,
        line_bending_mode: false,
        editing_linear_element: None,
        anti_aliasing: AntiAliasing::Analytic,
        v_sync: true,
        debug_rendering: false,
        zoom_step: 0.1,
    };

    // Initialize binary_files as an empty HashMap
    let binary_files = HashMap::new(); 

    let duc_file_to_serialize = DucFile {
        elements,
        app_state: Some(app_state),
        binary_files,
    };

    // Determine output path
    let crate_root = get_crate_root();
    let output_dir = ensure_output_dir(&crate_root);
    let output_file_name = "two_rectangles_test_rs.duc";
    let output_file_path = output_dir.join(output_file_name);

    // Serialize the DucFile
    let serialization_result = serialize_duc_file(&duc_file_to_serialize);

    assert!(serialization_result.is_ok(), "Serialization failed: {:?}", serialization_result.err());
    let serialized_bytes = serialization_result.unwrap();
    assert!(!serialized_bytes.is_empty(), "Serialization returned empty bytes");

    // Write the serialized bytes to a .duc file
    let mut file = File::create(&output_file_path).expect("Failed to create output .duc file");
    file.write_all(&serialized_bytes).expect("Failed to write serialized bytes to file");

    println!("Successfully serialized two rectangle elements to: {:?}", output_file_path);
    println!("You can now test this file with: flatc --json -o <output_json_dir> schema/duc.fbs -- {:?}", output_file_path);
} 