use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::generated::duc::{
    DucGlobalState as FbDucGlobalState, DucGlobalStateBuilder, DucLocalState as FbDucLocalState,
    DucLocalStateBuilder,
};
use crate::types::{DucGlobalState, DucLocalState};

use super::serialize_duc_element_utils::{
    serialize_element_background, serialize_element_stroke, serialize_duc_head,
};

pub fn serialize_duc_global_state<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    state: &DucGlobalState,
) -> WIPOffset<FbDucGlobalState<'a>> {
    let name = builder.create_string(&state.name);
    let view_background_color = builder.create_string(&state.view_background_color);
    let main_scope = builder.create_string(&state.main_scope);

    let mut state_builder = DucGlobalStateBuilder::new(builder);
    state_builder.add_name(name);
    state_builder.add_view_background_color(view_background_color);
    state_builder.add_main_scope(main_scope);
    state_builder.add_dash_spacing_scale(state.dash_spacing_scale);
    state_builder.add_is_dash_spacing_affected_by_viewport_scale(
        state.is_dash_spacing_affected_by_viewport_scale,
    );
    state_builder.add_scope_exponent_threshold(state.scope_exponent_threshold);
    state_builder.add_dimensions_associative_by_default(state.dimensions_associative_by_default);
    state_builder.add_use_annotative_scaling(state.use_annotative_scaling);
    state_builder.add_display_precision_linear(state.display_precision_linear);
    state_builder.add_display_precision_angular(state.display_precision_angular);
    state_builder.finish()
}

pub fn serialize_duc_local_state<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    state: &DucLocalState,
) -> WIPOffset<FbDucLocalState<'a>> {
    let scope = builder.create_string(&state.scope);
    let active_standard_id = builder.create_string(&state.active_standard_id);
    let string_offsets: Vec<flatbuffers::WIPOffset<&str>> = state.active_grid_settings
        .iter()
        .map(|s| builder.create_string(s))
        .collect();
    let active_grid_settings = builder.create_vector(&string_offsets);
    let active_snap_settings = builder.create_string(&state.active_snap_settings);
    let current_item_stroke = serialize_element_stroke(builder, &state.current_item_stroke);
    let current_item_background =
        serialize_element_background(builder, &state.current_item_background);
    let current_item_font_family = builder.create_string(&state.current_item_font_family);
    let current_item_start_line_head =
        serialize_duc_head(builder, &state.current_item_start_line_head);
    let current_item_end_line_head =
        serialize_duc_head(builder, &state.current_item_end_line_head);

    let mut state_builder = DucLocalStateBuilder::new(builder);
    state_builder.add_scope(scope);
    state_builder.add_active_standard_id(active_standard_id);
    state_builder.add_scroll_x(state.scroll_x);
    state_builder.add_scroll_y(state.scroll_y);
    state_builder.add_zoom(state.zoom);
    state_builder.add_active_grid_settings(active_grid_settings);
    state_builder.add_active_snap_settings(active_snap_settings);
    state_builder.add_is_binding_enabled(state.is_binding_enabled);
    state_builder.add_current_item_stroke(current_item_stroke);
    state_builder.add_current_item_background(current_item_background);
    state_builder.add_current_item_opacity(state.current_item_opacity);
    state_builder.add_current_item_font_family(current_item_font_family);
    state_builder.add_current_item_font_size(state.current_item_font_size);
    if let Some(text_align) = state.current_item_text_align {
        state_builder.add_current_item_text_align(text_align);
    }
    state_builder.add_current_item_start_line_head(current_item_start_line_head);
    state_builder.add_current_item_end_line_head(current_item_end_line_head);
    state_builder.add_current_item_roundness(state.current_item_roundness);
    state_builder.add_pen_mode(state.pen_mode);
    state_builder.add_view_mode_enabled(state.view_mode_enabled);
    state_builder.add_objects_snap_mode_enabled(state.objects_snap_mode_enabled);
    state_builder.add_grid_mode_enabled(state.grid_mode_enabled);
    state_builder.add_outline_mode_enabled(state.outline_mode_enabled);
    state_builder.finish()
}
