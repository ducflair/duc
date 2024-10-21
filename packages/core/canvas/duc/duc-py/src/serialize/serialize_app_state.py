import flatbuffers
from Duc.AppState import *
from Duc.DucGroup import *
from .serialize_duc_element import serialize_duc_element
from ..models.AppState import AppState

def serialize_app_state(builder: flatbuffers.Builder, app_state: AppState) -> int:
    name_offset = builder.CreateString(app_state.name)
    view_background_color_offset = builder.CreateString(app_state.view_background_color)
    cursor_button_offset = builder.CreateString(app_state.cursor_button)
    last_pointer_down_with_offset = builder.CreateString(app_state.last_pointer_down_with)
    editing_group_id_offset = builder.CreateString(app_state.editing_group_id)
    editing_frame_offset = builder.CreateString(app_state.editing_frame)

    # Create selectedElementIds vector
    selected_element_ids_offsets = [builder.CreateString(id) for id in app_state.selected_element_ids.keys()]
    AppStateStartSelectedElementIdsVector(builder, len(selected_element_ids_offsets))
    for id_offset in reversed(selected_element_ids_offsets):
        builder.PrependUOffsetTRelative(id_offset)
    selected_element_ids_vector = builder.EndVector()

    # Create previousSelectedElementIds vector
    previous_selected_element_ids_offsets = [builder.CreateString(id) for id in app_state.previous_selected_element_ids]
    AppStateStartPreviousSelectedElementIdsVector(builder, len(previous_selected_element_ids_offsets))
    for id_offset in reversed(previous_selected_element_ids_offsets):
        builder.PrependUOffsetTRelative(id_offset)
    previous_selected_element_ids_vector = builder.EndVector()

    # Create selectedGroupIds vector
    selected_group_ids_offsets = [builder.CreateString(id) for id in app_state.selected_group_ids]
    AppStateStartSelectedGroupIdsVector(builder, len(selected_group_ids_offsets))
    for id_offset in reversed(selected_group_ids_offsets):
        builder.PrependUOffsetTRelative(id_offset)
    selected_group_ids_vector = builder.EndVector()

    # Create groups vector
    groups_offsets = []
    for group in app_state.groups:
        group_id_offset = builder.CreateString(group.id)
        group_type_offset = builder.CreateString(group.type)
        group_label_offset = builder.CreateString(group.label)
        group_scope_offset = builder.CreateString(group.scope)
        group_writing_layer_offset = builder.CreateString(group.writing_layer)

        DucGroupStart(builder)
        DucGroupAddId(builder, group_id_offset)
        DucGroupAddType(builder, group_type_offset)
        DucGroupAddIsCollapsed(builder, group.is_collapsed)
        DucGroupAddLabel(builder, group_label_offset)
        DucGroupAddScope(builder, group_scope_offset)
        DucGroupAddWritingLayer(builder, group_writing_layer_offset)
        groups_offsets.append(DucGroupEnd(builder))

    AppStateStartGroupsVector(builder, len(groups_offsets))
    for group_offset in reversed(groups_offsets):
        builder.PrependUOffsetTRelative(group_offset)
    groups_vector = builder.EndVector()

    # Create elementsToHighlight vector
    elements_to_highlight_offsets = [serialize_duc_element(builder, element) for element in app_state.elements_to_highlight]
    AppStateStartElementsToHighlightVector(builder, len(elements_to_highlight_offsets))
    for element_offset in reversed(elements_to_highlight_offsets):
        builder.PrependUOffsetTRelative(element_offset)
    elements_to_highlight_vector = builder.EndVector()

    # Start building AppState
    AppStateStart(builder)
    AppStateAddName(builder, name_offset)
    AppStateAddViewBackgroundColor(builder, view_background_color_offset)
    AppStateAddGridSize(builder, app_state.grid_size)
    AppStateAddScrollX(builder, app_state.scroll_x)
    AppStateAddScrollY(builder, app_state.scroll_y)
    AppStateAddScrolledOutside(builder, app_state.scrolled_outside)
    AppStateAddZoom(builder, app_state.zoom)
    AppStateAddSelectedElementIds(builder, selected_element_ids_vector)
    AppStateAddPreviousSelectedElementIds(builder, previous_selected_element_ids_vector)
    AppStateAddSelectedElementsAreBeingDragged(builder, app_state.selected_elements_are_being_dragged)
    AppStateAddShouldCacheIgnoreZoom(builder, app_state.should_cache_ignore_zoom)
    AppStateAddSelectedGroupIds(builder, selected_group_ids_vector)
    AppStateAddEditingGroupId(builder, editing_group_id_offset)
    AppStateAddGroups(builder, groups_vector)
    AppStateAddCursorButton(builder, cursor_button_offset)
    AppStateAddLastPointerDownWith(builder, last_pointer_down_with_offset)
    AppStateAddEditingFrame(builder, editing_frame_offset)
    AppStateAddElementsToHighlight(builder, elements_to_highlight_vector)
    AppStateAddEditingElement(builder, serialize_duc_element(builder, app_state.editing_element))
    AppStateAddCurrentItemStrokeColor(builder, app_state.current_item_stroke_color)
    AppStateAddCurrentItemStrokePlacement(builder, app_state.current_item_stroke_placement)
    AppStateAddCurrentItemBackgroundColor(builder, app_state.current_item_background_color)
    AppStateAddCurrentItemFillStyle(builder, app_state.current_item_fill_style)
    AppStateAddCurrentItemStrokeWidth(builder, app_state.current_item_stroke_width)
    AppStateAddCurrentItemStrokeStyle(builder, app_state.current_item_stroke_style)
    AppStateAddCurrentItemRoughness(builder, app_state.current_item_roughness)
    AppStateAddCurrentItemOpacity(builder, app_state.current_item_opacity)
    AppStateAddCurrentItemFontFamily(builder, app_state.current_item_font_family)
    AppStateAddCurrentItemFontSize(builder, app_state.current_item_font_size)
    AppStateAddCurrentItemTextAlign(builder, app_state.current_item_text_align)
    AppStateAddCurrentItemStartArrowhead(builder, app_state.current_item_start_arrowhead)
    AppStateAddCurrentItemEndArrowhead(builder, app_state.current_item_end_arrowhead)
    AppStateAddCurrentItemRoundness(builder, app_state.current_item_roundness)

    return AppStateEnd(builder)
