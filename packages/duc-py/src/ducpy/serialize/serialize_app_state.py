import flatbuffers
from typing import Optional, Dict, Any
from ..Duc.AppState import (
    Start as AppStateStart,
    End as AppStateEnd,
    AddName, AddZoom, AddLastPointerDownWith,
    AddSelectedElementIds,
    AddGridSize, AddScrollX, AddScrollY, AddCursorButton,
    AddScrolledOutside, AddGroups, AddScope, AddMainScope,
    AddCurrentItemStroke, AddCurrentItemBackground,
    AddCurrentItemFontFamilyV2, AddViewBackgroundColor,
    AddFrameRenderingEnabled, AddFrameRenderingName,
    AddFrameRenderingOutline, AddFrameRenderingClip,
    AddCurrentItemOpacity, AddCurrentItemFontSizeV3,
    AddCurrentItemTextAlignV3, AddScaleRatioLocked,
    AddDisplayAllPointDistances, AddDisplayDistanceOnDrawing,
    AddDisplayAllPointCoordinates, AddCoordDecimalPlacesV3,
    AddDisplayAllPointInfoSelected, AddDisplayRootAxis,
    AddLineBendingMode, AddStandard, AddCurrentItemStartLineHead,
    AddCurrentItemEndLineHead, StartSelectedElementIdsVector,
    StartGroupsVector, AddCurrentItemRoundnessV3,
)
from ..Duc.DucGroup import (
    Start as DucGroupStart,
    End as DucGroupEnd,
    AddId, AddType, AddIsCollapsed,
    AddLabel, AddScope
)
from .serialize_duc_element import serialize_duc_element, serialize_element_stroke, serialize_element_background
from ..classes.AppStateClass import AppState

def serialize_app_state(builder: flatbuffers.Builder, app_state: AppState) -> int:
    # Create ALL string offsets first
    name_offset = builder.CreateString(app_state.name) if app_state.name else None
    last_pointer_down_with_offset = builder.CreateString(app_state.last_pointer_down_with) if app_state.last_pointer_down_with else None
    cursor_button_offset = builder.CreateString(app_state.cursor_button) if app_state.cursor_button else None
    scope_offset = builder.CreateString(app_state.scope) if app_state.scope else None
    main_scope_offset = builder.CreateString(app_state.main_scope) if app_state.main_scope else None
    view_background_color_offset = builder.CreateString(app_state.view_background_color) if app_state.view_background_color else None
    current_item_font_family_offset = builder.CreateString(str(app_state.current_item_font_family)) if app_state.current_item_font_family else None

    # Create ALL vectors first
    selected_element_ids_vector = None
    if app_state.selected_element_ids:
        selected_element_ids_offsets = [builder.CreateString(id) for id in app_state.selected_element_ids.keys()]
        if selected_element_ids_offsets:
            StartSelectedElementIdsVector(builder, len(selected_element_ids_offsets))
            for offset in reversed(selected_element_ids_offsets):
                builder.PrependUOffsetTRelative(offset)
            selected_element_ids_vector = builder.EndVector()

    groups_vector = None
    if app_state.groups:
        group_offsets = []
        for group in app_state.groups:
            # Create string offsets for group
            group_id_offset = builder.CreateString(group.id)
            group_type_offset = builder.CreateString(group.type)
            group_label_offset = builder.CreateString(group.label) if group.label else None
            group_scope_offset = builder.CreateString(group.scope) if group.scope else None
            
            # Build group table
            DucGroupStart(builder)
            AddId(builder, group_id_offset)
            AddType(builder, group_type_offset)
            if group.is_collapsed is not None:
                AddIsCollapsed(builder, group.is_collapsed)
            if group_label_offset:
                AddLabel(builder, group_label_offset)
            if group_scope_offset:
                AddScope(builder, group_scope_offset)
            group_offsets.append(DucGroupEnd(builder))
        
        if group_offsets:
            StartGroupsVector(builder, len(group_offsets))
            for offset in reversed(group_offsets):
                builder.PrependUOffsetTRelative(offset)
            groups_vector = builder.EndVector()

    # Create stroke and background vectors
    current_item_stroke_vector = None
    if app_state.current_item_stroke:
        current_item_stroke_vector = serialize_element_stroke(builder, app_state.current_item_stroke)

    current_item_background_vector = None
    if app_state.current_item_background:
        current_item_background_vector = serialize_element_background(builder, app_state.current_item_background)

    # Now start building the AppState table
    AppStateStart(builder)
    
    if name_offset:
        AddName(builder, name_offset)
    if app_state.zoom:
        AddZoom(builder, app_state.zoom.value)
    if last_pointer_down_with_offset:
        AddLastPointerDownWith(builder, last_pointer_down_with_offset)
    if selected_element_ids_vector:
        AddSelectedElementIds(builder, selected_element_ids_vector)
    if app_state.grid_size is not None:
        AddGridSize(builder, app_state.grid_size)
    if app_state.scroll_x is not None:
        AddScrollX(builder, app_state.scroll_x)
    if app_state.scroll_y is not None:
        AddScrollY(builder, app_state.scroll_y)
    if cursor_button_offset:
        AddCursorButton(builder, cursor_button_offset)
    if app_state.scrolled_outside is not None:
        AddScrolledOutside(builder, app_state.scrolled_outside)
    if groups_vector:
        AddGroups(builder, groups_vector)
    if scope_offset:
        AddScope(builder, scope_offset)
    if main_scope_offset:
        AddMainScope(builder, main_scope_offset)
    if current_item_stroke_vector:
        AddCurrentItemStroke(builder, current_item_stroke_vector)
    if current_item_background_vector:
        AddCurrentItemBackground(builder, current_item_background_vector)
    if current_item_font_family_offset:
        AddCurrentItemFontFamilyV2(builder, current_item_font_family_offset)
    if view_background_color_offset:
        AddViewBackgroundColor(builder, view_background_color_offset)
    if app_state.frame_rendering:
        if app_state.frame_rendering.enabled is not None:
            AddFrameRenderingEnabled(builder, app_state.frame_rendering.enabled)
        if app_state.frame_rendering.name is not None:
            AddFrameRenderingName(builder, app_state.frame_rendering.name)
        if app_state.frame_rendering.outline is not None:
            AddFrameRenderingOutline(builder, app_state.frame_rendering.outline)
        if app_state.frame_rendering.clip is not None:
            AddFrameRenderingClip(builder, app_state.frame_rendering.clip)
    if app_state.current_item_opacity is not None:
        AddCurrentItemOpacity(builder, app_state.current_item_opacity)
    if app_state.current_item_font_size is not None:
        AddCurrentItemFontSizeV3(builder, app_state.current_item_font_size)
    if app_state.current_item_text_align is not None:
        AddCurrentItemTextAlignV3(builder, app_state.current_item_text_align)
    if app_state.scale_ratio_locked is not None:
        AddScaleRatioLocked(builder, app_state.scale_ratio_locked)
    if app_state.display_all_point_distances is not None:
        AddDisplayAllPointDistances(builder, app_state.display_all_point_distances)
    if app_state.display_distance_on_drawing is not None:
        AddDisplayDistanceOnDrawing(builder, app_state.display_distance_on_drawing)
    if app_state.display_all_point_coordinates is not None:
        AddDisplayAllPointCoordinates(builder, app_state.display_all_point_coordinates)
    if app_state.coord_decimal_places is not None:
        AddCoordDecimalPlacesV3(builder, app_state.coord_decimal_places)
    if app_state.display_all_point_info_selected is not None:
        AddDisplayAllPointInfoSelected(builder, app_state.display_all_point_info_selected)
    if app_state.display_root_axis is not None:
        AddDisplayRootAxis(builder, app_state.display_root_axis)
    if app_state.line_bending_mode is not None:
        AddLineBendingMode(builder, app_state.line_bending_mode)
    if app_state.standard is not None:
        AddStandard(builder, app_state.standard)
    if app_state.current_item_start_line_head is not None:
        AddCurrentItemStartLineHead(builder, app_state.current_item_start_line_head)
    if app_state.current_item_end_line_head is not None:
        AddCurrentItemEndLineHead(builder, app_state.current_item_end_line_head)
    if app_state.current_item_roundness is not None:
        AddCurrentItemRoundnessV3(builder, app_state.current_item_roundness)

    # Return the table offset
    return AppStateEnd(builder)
