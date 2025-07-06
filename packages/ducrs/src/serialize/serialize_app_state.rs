use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::types::*;
use crate::generated::duc::{
    AppState as FbAppState, AppStateBuilder,
    DucGroup as FbDucGroup, DucGroupBuilder,
    LinearElementEditor as FbLinearElementEditor, LinearElementEditorBuilder,
    PointerDownState as FbPointerDownState, PointerDownStateBuilder,
    SegmentMidpointState as FbSegmentMidpointState, SegmentMidpointStateBuilder,
};

use super::serialize_duc_element::{serialize_point, serialize_simple_point, serialize_element_stroke, serialize_element_background};

/// Serializes a Rust AppState into a FlatBuffers AppState
pub fn serialize_app_state<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    app_state: &AppState,
) -> WIPOffset<FbAppState<'a>> {
    // Create all string and vector offsets first to avoid multiple mutable borrows
    
    // Prepare current item styles
    let stroke_offset = if let Some(stroke) = &app_state.current_item_stroke {
        Some(serialize_element_stroke(builder, stroke))
    } else {
        None
    };
    
    let bg_offset = if let Some(background) = &app_state.current_item_background {
        Some(serialize_element_background(builder, background))
    } else {
        None
    };

    // Font settings
    let font_family_offset = builder.create_string(&format!("{}", app_state.current_item_font_family as i8));
    
    // View settings
    let view_bg_color_offset = builder.create_string(&app_state.view_background_color);
    let scope_offset = builder.create_string(&app_state.scope);
    let main_scope_offset = builder.create_string(&app_state.main_scope);
    
    // Groups
    let groups_offset = if !app_state.groups.is_empty() {
        let mut groups_vec = Vec::with_capacity(app_state.groups.len());
        for group in &app_state.groups {
            groups_vec.push(serialize_duc_group(builder, group));
        }
        Some(builder.create_vector(&groups_vec))
    } else {
        None
    };
    
    // Cursor
    let cursor_button_offset = if let Some(cursor_button) = &app_state.cursor_button {
        Some(builder.create_string(cursor_button))
    } else {
        None
    };
    
    // Document name
    let name_offset = if let Some(name) = &app_state.name {
        Some(builder.create_string(name))
    } else {
        None
    };
    
    // Last pointer down
    let last_pointer_down_offset = if let Some(last_pointer_down) = &app_state.last_pointer_down_with {
        Some(builder.create_string(last_pointer_down))
    } else {
        None
    };
    
    // Selected element IDs
    let selected_ids_offset = if !app_state.selected_element_ids.is_empty() {
        let mut ids = Vec::with_capacity(app_state.selected_element_ids.len());
        for (id, is_selected) in &app_state.selected_element_ids {
            if *is_selected {
                ids.push(builder.create_string(id));
            }
        }
        if !ids.is_empty() {
            Some(builder.create_vector(&ids))
        } else {
            None
        }
    } else {
        None
    };
    
    // Linear element editor
    let editor_offset = if let Some(editor) = &app_state.editing_linear_element {
        Some(serialize_linear_element_editor(builder, editor))
    } else {
        None
    };
    
    // Now build the AppState with all prepared offsets
    let mut app_state_builder = AppStateBuilder::new(builder);
    
    // Frame rendering properties
    app_state_builder.add_frame_rendering_enabled(app_state.frame_rendering.enabled);
    app_state_builder.add_frame_rendering_name(app_state.frame_rendering.name);
    app_state_builder.add_frame_rendering_outline(app_state.frame_rendering.outline);
    app_state_builder.add_frame_rendering_clip(app_state.frame_rendering.clip);
    
    // Current item style properties
    if let Some(stroke) = stroke_offset {
        app_state_builder.add_current_item_stroke(stroke);
    }
    
    if let Some(bg) = bg_offset {
        app_state_builder.add_current_item_background(bg);
    }
    
    app_state_builder.add_current_item_opacity(app_state.current_item_opacity);
    
    // Font settings
    app_state_builder.add_current_item_font_family_v2(font_family_offset);
    app_state_builder.add_current_item_font_size_v3(app_state.current_item_font_size);
    app_state_builder.add_current_item_text_align_v3(app_state.current_item_text_align as i8);
    
    // Line heads
    if let Some(start_head) = app_state.current_item_start_line_head {
        app_state_builder.add_current_item_start_line_head(start_head as i8);
    }
    
    if let Some(end_head) = app_state.current_item_end_line_head {
        app_state_builder.add_current_item_end_line_head(end_head as i8);
    }
    
    app_state_builder.add_current_item_roundness_v3(app_state.current_item_roundness);
    
    if let Some(subset) = app_state.current_item_subset {
        app_state_builder.add_current_item_subset(subset as i8);
    }
    
    // View settings
    app_state_builder.add_view_background_color(view_bg_color_offset);
    app_state_builder.add_scope(scope_offset);
    app_state_builder.add_main_scope(main_scope_offset);
    app_state_builder.add_standard(app_state.standard as i8);
    
    // Groups
    if let Some(groups) = groups_offset {
        app_state_builder.add_groups(groups);
    }
    
    // Scroll position
    app_state_builder.add_scroll_x(app_state.scroll_x as f32);
    app_state_builder.add_scroll_y(app_state.scroll_y as f32);
    
    // Cursor
    if let Some(button) = cursor_button_offset {
        app_state_builder.add_cursor_button(button);
    }
    
    app_state_builder.add_scrolled_outside(app_state.scrolled_outside);
    
    // Document name
    if let Some(name) = name_offset {
        app_state_builder.add_name(name);
    }
    
    // Zoom
    app_state_builder.add_zoom(app_state.zoom.value as f32);
    
    // Last pointer down
    if let Some(pointer) = last_pointer_down_offset {
        app_state_builder.add_last_pointer_down_with(pointer);
    }
    
    // Selected element IDs
    if let Some(ids) = selected_ids_offset {
        app_state_builder.add_selected_element_ids(ids);
    }
    
    // Grid and other settings
    app_state_builder.add_grid_size(app_state.grid_size);
    app_state_builder.add_grid_mode_enabled(app_state.grid_mode_enabled);
    app_state_builder.add_grid_step(app_state.grid_step);
    app_state_builder.add_scale_ratio_locked(app_state.scale_ratio_locked);
    
    // Display settings
    app_state_builder.add_display_all_point_distances(app_state.display_all_point_distances);
    app_state_builder.add_display_distance_on_drawing(app_state.display_distance_on_drawing);
    app_state_builder.add_display_all_point_coordinates(app_state.display_all_point_coordinates);
    app_state_builder.add_display_all_point_info_selected(app_state.display_all_point_info_selected);
    app_state_builder.add_display_root_axis(app_state.display_root_axis);
    
    app_state_builder.add_coord_decimal_places_v3(app_state.coord_decimal_places);
    app_state_builder.add_scope_exponent_threshold(app_state.scope_exponent_threshold);
    app_state_builder.add_line_bending_mode(app_state.line_bending_mode);
    app_state_builder.add_zoom_step(app_state.zoom_step);
    
    // Render settings
    app_state_builder.add_anti_aliasing(app_state.anti_aliasing as i8);
    app_state_builder.add_v_sync(app_state.v_sync);
    app_state_builder.add_debug_rendering(app_state.debug_rendering);
    
    // Linear element editor
    if let Some(editor) = editor_offset {
        app_state_builder.add_editing_linear_element(editor);
    }
    
    app_state_builder.finish()
}

/// Helper function to serialize a DucGroup
fn serialize_duc_group<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    group: &DucGroup,
) -> WIPOffset<FbDucGroup<'a>> {
    // Create all string offsets first
    let id_offset = builder.create_string(&group.id);
    let group_type_offset = builder.create_string(&group.group_type);
    let label_offset = builder.create_string(&group.label);
    let scope_offset = builder.create_string(&group.scope);
    
    // Build the group with prepared offsets
    let mut group_builder = DucGroupBuilder::new(builder);
    group_builder.add_id(id_offset);
    group_builder.add_type_(group_type_offset);
    group_builder.add_is_collapsed(group.is_collapsed);
    group_builder.add_label(label_offset);
    group_builder.add_scope(scope_offset);
    
    group_builder.finish()
}

/// Helper function to serialize a LinearElementEditor
fn serialize_linear_element_editor<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    editor: &LinearElementEditor,
) -> WIPOffset<FbLinearElementEditor<'a>> {
    // Create all string and vector offsets first
    let element_id_offset = builder.create_string(&editor.element_id);
    
    // Serialize selected points
    let selected_indices_offset = if !editor.selected_points_indices.is_empty() {
        Some(builder.create_vector(&editor.selected_points_indices))
    } else {
        None
    };
    
    // Serialize pointer down state
    let pointer_down_state_offset = serialize_pointer_down_state(builder, &editor.pointer_down_state);
    
    // Serialize pointer offset
    let pointer_offset_offset = serialize_simple_point(builder, &editor.pointer_offset);
    
    // Serialize start and end binding elements
    let start_binding_element_offset = builder.create_string(&editor.start_binding_element);
    let end_binding_element_offset = builder.create_string(&editor.end_binding_element);
    
    // Serialize last uncommitted point
    let last_uncommitted_point_offset = if let Some(point) = &editor.last_uncommitted_point {
        Some(serialize_point(builder, point))
    } else {
        None
    };
    
    // Serialize segment midpoint hovered coords
    let segment_mid_point_hovered_coords_offset = if let Some(coords) = &editor.segment_mid_point_hovered_coords {
        Some(serialize_point(builder, coords))
    } else {
        None
    };
    
    // Build the linear element editor with prepared offsets
    let mut editor_builder = LinearElementEditorBuilder::new(builder);
    editor_builder.add_element_id(element_id_offset);
    editor_builder.add_is_dragging(editor.is_dragging);
    editor_builder.add_pointer_down_state(pointer_down_state_offset);
    editor_builder.add_pointer_offset(pointer_offset_offset);
    editor_builder.add_start_binding_element(start_binding_element_offset);
    editor_builder.add_end_binding_element(end_binding_element_offset);
    editor_builder.add_hover_point_index(editor.hover_point_index);
    
    if let Some(indices) = selected_indices_offset {
        editor_builder.add_selected_points_indices(indices);
    }
    
    if let Some(point) = last_uncommitted_point_offset {
        editor_builder.add_last_uncommitted_point(point);
    }
    
    if let Some(coords) = segment_mid_point_hovered_coords_offset {
        editor_builder.add_segment_mid_point_hovered_coords(coords);
    }
    
    editor_builder.finish()
}

/// Helper function to serialize a PointerDownState
fn serialize_pointer_down_state<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    state: &PointerDownState,
) -> WIPOffset<FbPointerDownState<'a>> {
    // Create all vector offsets first
    let prev_selected_indices_offset = if !state.prev_selected_points_indices.is_empty() {
        Some(builder.create_vector(&state.prev_selected_points_indices))
    } else {
        None
    };
    
    // Serialize origin
    let origin_offset = if let Some(origin) = &state.origin {
        Some(serialize_simple_point(builder, origin))
    } else {
        None
    };
    
    // Serialize segment midpoint
    let segment_midpoint_offset = serialize_segment_midpoint_state(builder, &state.segment_midpoint);
    
    // Build the pointer down state with prepared offsets
    let mut state_builder = PointerDownStateBuilder::new(builder);
    state_builder.add_last_clicked_point(state.last_clicked_point);
    state_builder.add_last_clicked_is_end_point(state.last_clicked_is_end_point);
    state_builder.add_segment_midpoint(segment_midpoint_offset);
    
    if let Some(indices) = prev_selected_indices_offset {
        state_builder.add_prev_selected_points_indices(indices);
    }
    
    if let Some(o) = origin_offset {
        state_builder.add_origin(o);
    }
    
    if let Some(handle_type) = state.handle_type {
        state_builder.add_handle_type(handle_type as i8);
    }
    
    state_builder.finish()
}

/// Helper function to serialize a SegmentMidpointState
fn serialize_segment_midpoint_state<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    state: &SegmentMidpointState,
) -> WIPOffset<FbSegmentMidpointState<'a>> {
    // Serialize value
    let value_offset = if let Some(point) = &state.value {
        Some(serialize_point(builder, point))
    } else {
        None
    };
    
    // Build the segment midpoint state with prepared offsets
    let mut state_builder = SegmentMidpointStateBuilder::new(builder);
    state_builder.add_index(state.index);
    state_builder.add_added(state.added);
    
    if let Some(v) = value_offset {
        state_builder.add_value(v);
    }
    
    state_builder.finish()
} 