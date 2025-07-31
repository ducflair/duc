use std::collections::HashMap;

use crate::types::*;
use crate::parse::parse_duc_element::{parse_element_background, parse_element_stroke, parse_point, parse_line_head_option};

/// Parses a FlatBuffers AppState into our Rust AppState type
pub fn parse_app_state(app_state: &crate::generated::duc::AppState) -> crate::types::AppState {
    
    // Parse frame_rendering
    let frame_rendering = FrameRendering {
        enabled: app_state.frame_rendering_enabled(),
        name: app_state.frame_rendering_name(),
        outline: app_state.frame_rendering_outline(),
        clip: app_state.frame_rendering_clip(),
    };

    // Parse current item stroke
    let current_item_stroke = if let Some(stroke) = app_state.current_item_stroke() {
        // Use a helper function to parse ElementStroke
        parse_element_stroke(&stroke)
    } else {
        None
    };
    
    // Parse current item background
    let current_item_background = if let Some(bg) = app_state.current_item_background() {
        // Use a helper function to parse ElementBackground
        parse_element_background(&bg)
    } else {
        None
    };
    

    let current_item_opacity = app_state.current_item_opacity();
    let current_item_font_family: i8 = app_state.current_item_font_family_v2()
    .and_then(|s| s.parse::<i8>().ok()) 
    .unwrap_or(FontFamily::Virgil as i8); 
    let current_item_font_family = unsafe { std::mem::transmute(current_item_font_family) };

    let current_item_font_size = app_state.current_item_font_size_v3();
    let current_item_text_align = unsafe { std::mem::transmute(app_state.current_item_text_align_v3()) };
    let current_item_subset = app_state.current_item_subset().map(|s| unsafe { std::mem::transmute::<i8, ElementSubset>(s) });
    let current_item_start_line_head = app_state.current_item_start_line_head().and_then(|s| parse_line_head_option(s));
    let current_item_end_line_head = app_state.current_item_end_line_head().and_then(|s| parse_line_head_option(s));    
    let current_item_roundness = app_state.current_item_roundness_v3();
    let view_background_color = app_state.view_background_color().unwrap_or("#ffffff").to_string();
    let scope = app_state.scope().unwrap_or("mm").to_string();
    let main_scope = app_state.main_scope().unwrap_or("mm").to_string();
    let standard = unsafe { std::mem::transmute(app_state.standard()) };
    
    
    let scroll_x = app_state.scroll_x() as f64;
    let scroll_y = app_state.scroll_y() as f64;
    
    let cursor_button = app_state.cursor_button().map(|s| s.to_string());
    let scrolled_outside = app_state.scrolled_outside();
    let name = app_state.name().map(|s| s.to_string());    
    let zoom = Zoom {
        value: app_state.zoom() as f64,
    };

    let suggested_binding_element_id = app_state.suggested_binding_element_id().map(|s| s.to_string());
    let last_pointer_down_with = app_state.last_pointer_down_with().map(|s| s.to_string());
    let hovered_element_id = app_state.hovered_element_id().map(|s| s.to_string());
    
    let selected_element_ids = if let Some(ids) = app_state.selected_element_ids() {
        let mut map = HashMap::with_capacity(ids.len());
        for i in 0..ids.len() {
            let id = ids.get(i);
            map.insert(id.to_string(), true);
        }
        map
    } else {
        HashMap::new()
    };

    let elements_pending_erasure = app_state.elements_pending_erasure()
    .map(|ids| ids.iter().map(|id| id.to_string()).collect());

    let grid_size = app_state.grid_size();
    let grid_step = app_state.grid_step();
    let grid_mode_enabled = app_state.grid_mode_enabled();
    let scale_ratio_locked = app_state.scale_ratio_locked();
    let is_binding_enabled = app_state.is_binding_enabled();
    
    let display_all_point_distances = app_state.display_all_point_distances();
    let display_distance_on_drawing = app_state.display_distance_on_drawing();
    let display_all_point_coordinates = app_state.display_all_point_coordinates();
    let display_all_point_info_selected = app_state.display_all_point_info_selected();
    let display_root_axis = app_state.display_root_axis();
    
    let coord_decimal_places = app_state.coord_decimal_places_v3();
    let scope_exponent_threshold = app_state.scope_exponent_threshold();
    let debug_rendering = app_state.debug_rendering();
    let line_bending_mode = app_state.line_bending_mode();
    
    let anti_aliasing = unsafe { std::mem::transmute(app_state.anti_aliasing()) };
    let v_sync = app_state.v_sync();
    let zoom_step = app_state.zoom_step();
    
    // Parse LinearElementEditor
    let editing_linear_element = if let Some(editor) = app_state.editing_linear_element() {
        // Parse selected points indices
        let selected_points_indices = if let Some(indices_vec) = editor.selected_points_indices() {
            let mut result = Vec::with_capacity(indices_vec.len());
            for i in 0..indices_vec.len() {
                result.push(indices_vec.get(i));
            }
            result
        } else {
            Vec::new()
        };
        
        let pointer_down_state = {
            // Default values
            let mut prev_selected_points_indices = Vec::new();
            let mut last_clicked_point = 0;
            let mut last_clicked_is_end_point = false;
            let mut origin = None;
            let mut segment_midpoint = SegmentMidpointState {
                value: None,
                index: 0,
                added: false,
            };
            let mut handle_type = None;
            
            // Parse from flatbuffer if available
            if let Some(pds) = editor.pointer_down_state() {
                // Parse prev_selected_points_indices
                if let Some(indices_vec) = pds.prev_selected_points_indices() {
                    let mut indices = Vec::with_capacity(indices_vec.len());
                    for i in 0..indices_vec.len() {
                        indices.push(indices_vec.get(i));
                    }
                    prev_selected_points_indices = indices;
                }
                
                // Parse other fields
                last_clicked_point = pds.last_clicked_point();
                last_clicked_is_end_point = pds.last_clicked_is_end_point();
                
                if let Some(o) = pds.origin() {
                    origin = Some(SimplePoint {
                        x: o.x(),
                        y: o.y(),
                    });
                }
                
                if let Some(sm) = pds.segment_midpoint() {
                    segment_midpoint = SegmentMidpointState {
                        value: if let Some(v) = sm.value() {
                            Some(parse_point(&v))
                        } else {
                            None
                        },
                        index: sm.index(),
                        added: sm.added(),
                    };
                }
                
                handle_type = pds.handle_type().map(|ht| unsafe { std::mem::transmute::<i8, HandleType>(ht) });
            }
            
            PointerDownState {
                prev_selected_points_indices,
                prev_selected_handles: None,
                last_clicked_point,
                last_clicked_is_end_point,
                origin,
                segment_midpoint,
                handle_type,
                handle_info: None,
            }
        };
        
        let last_uncommitted_point = if let Some(p) = editor.last_uncommitted_point() {
            Some(parse_point(&p))
        } else {
            None
        };
        
        let pointer_offset = if let Some(po) = editor.pointer_offset() {
            SimplePoint {
                x: po.x(),
                y: po.y(),
            }
        } else {
            SimplePoint {
                x: 0.0,
                y: 0.0,
            }
        };
        
        let segment_mid_point_hovered_coords = if let Some(p) = editor.segment_mid_point_hovered_coords() {
            Some(parse_point(&p))
        } else {
            None
        };
        
        Some(LinearElementEditor {
            element_id: editor.element_id().unwrap_or("").to_string(),
            selected_points_indices,
            pointer_down_state,
            is_dragging: editor.is_dragging(),
            last_uncommitted_point,
            pointer_offset,
            start_binding_element: editor.start_binding_element().unwrap_or("").to_string(),
            end_binding_element: editor.end_binding_element().unwrap_or("").to_string(),
            hover_point_index: editor.hover_point_index(),
            segment_mid_point_hovered_coords,
        })
    } else {
        None
    };
    
    crate::types::AppState {
        frame_rendering,
        current_item_stroke,
        current_item_background,
        current_item_opacity,
        current_item_font_family,
        current_item_font_size,
        current_item_text_align,
        current_item_start_line_head,
        current_item_end_line_head,
        current_item_roundness,
        current_item_subset,
        view_background_color,
        scope,
        main_scope,
        standard,
        scroll_x,
        scroll_y,
        cursor_button,
        scrolled_outside,
        name,
        zoom,
        selected_element_ids,
        elements_pending_erasure,
        grid_size,
        grid_step,
        grid_mode_enabled,
        scale_ratio_locked,
        display_all_point_distances,
        display_distance_on_drawing,
        display_all_point_coordinates,
        display_all_point_info_selected,
        display_root_axis,
        coord_decimal_places,
        scope_exponent_threshold,
        line_bending_mode,
        anti_aliasing,
        v_sync,
        debug_rendering,
        zoom_step,
        hovered_element_id,
        suggested_binding_element_id,
        is_binding_enabled,
        last_pointer_down_with,
        editing_linear_element,
        editing_frame: None,
        selected_group_ids: None,
        previous_selected_element_ids: None,
        selected_elements_are_being_dragged: None,
        should_cache_ignore_zoom: None,
        editing_group_id: None,
        paste_dialog_shown: None,
        paste_dialog_data: None,
        active_embeddable_element: None,
        active_embeddable_state: None,
        dragging_element: None,
        resizing_element: None,
        multi_element: None,
        selection_element: None,
        frame_to_highlight: None,
        elements_to_highlight: None,
        editing_element: None,
    }
}