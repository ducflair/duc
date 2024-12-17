from Duc.AppState import AppState as FlatBuffersAppState
from ..constants import DEFAULT_APP_STATE
from ..models.AppState import AppState
from ..models.DucElement import DucGroupElement, DucElementUnion
from ..parse.parse_duc_element import parse_duc_element

def parse_app_state(app_state: FlatBuffersAppState) -> AppState:
    parsed_state = AppState(**DEFAULT_APP_STATE)

    if app_state:
        parsed_state.name = app_state.Name().decode('utf-8') if app_state.Name() else parsed_state.name
        parsed_state.zoom = app_state.Zoom() or parsed_state.zoom
        parsed_state.last_pointer_down_with = app_state.LastPointerDownWith().decode('utf-8') if app_state.LastPointerDownWith() else parsed_state.last_pointer_down_with
        parsed_state.selected_element_ids = {id.decode('utf-8'): True for id in app_state.SelectedElementIdsAsNumpy()}
        parsed_state.previous_selected_element_ids = [id.decode('utf-8') for id in app_state.PreviousSelectedElementIdsAsNumpy()]
        parsed_state.selected_elements_are_being_dragged = app_state.SelectedElementsAreBeingDragged()
        parsed_state.should_cache_ignore_zoom = app_state.ShouldCacheIgnoreZoom()
        parsed_state.grid_size = app_state.GridSize() or parsed_state.grid_size
        parsed_state.selected_group_ids = [id.decode('utf-8') for id in app_state.SelectedGroupIdsAsNumpy()]
        parsed_state.editing_group_id = app_state.EditingGroupId().decode('utf-8') if app_state.EditingGroupId() else parsed_state.editing_group_id
        parsed_state.scroll_x = app_state.ScrollX() or parsed_state.scroll_x
        parsed_state.scroll_y = app_state.ScrollY() or parsed_state.scroll_y
        parsed_state.cursor_button = app_state.CursorButton().decode('utf-8') if app_state.CursorButton() else parsed_state.cursor_button
        parsed_state.scrolled_outside = app_state.ScrolledOutside()
        parsed_state.scope = app_state.Scope().decode('utf-8') if app_state.Scope() else parsed_state.scope
        parsed_state.writing_layer = app_state.WritingLayer().decode('utf-8') if app_state.WritingLayer() else parsed_state.writing_layer
        parsed_state.current_item_stroke_color = app_state.CurrentItemStrokeColor().decode('utf-8') if app_state.CurrentItemStrokeColor() else parsed_state.current_item_stroke_color
        parsed_state.current_item_background_color = app_state.CurrentItemBackgroundColor().decode('utf-8') if app_state.CurrentItemBackgroundColor() else parsed_state.current_item_background_color
        parsed_state.current_item_fill_style = app_state.CurrentItemFillStyle().decode('utf-8') if app_state.CurrentItemFillStyle() else parsed_state.current_item_fill_style
        parsed_state.current_item_stroke_width = app_state.CurrentItemStrokeWidth() or parsed_state.current_item_stroke_width
        parsed_state.current_item_stroke_placement = app_state.CurrentItemStrokePlacement().decode('utf-8') if app_state.CurrentItemStrokePlacement() else parsed_state.current_item_stroke_placement
        parsed_state.current_item_stroke_style = app_state.CurrentItemStrokeStyle().decode('utf-8') if app_state.CurrentItemStrokeStyle() else parsed_state.current_item_stroke_style
        parsed_state.current_item_roughness = app_state.CurrentItemRoughness() or parsed_state.current_item_roughness
        parsed_state.current_item_opacity = app_state.CurrentItemOpacity() or parsed_state.current_item_opacity
        parsed_state.current_item_font_family = int(app_state.CurrentItemFontFamily() or parsed_state.current_item_font_family)
        parsed_state.current_item_font_size = app_state.CurrentItemFontSize() or parsed_state.current_item_font_size
        parsed_state.current_item_text_align = app_state.CurrentItemTextAlign().decode('utf-8') if app_state.CurrentItemTextAlign() else parsed_state.current_item_text_align
        parsed_state.current_item_start_arrowhead = app_state.CurrentItemStartArrowhead().decode('utf-8') if app_state.CurrentItemStartArrowhead() else parsed_state.current_item_start_arrowhead
        parsed_state.current_item_end_arrowhead = app_state.CurrentItemEndArrowhead().decode('utf-8') if app_state.CurrentItemEndArrowhead() else parsed_state.current_item_end_arrowhead
        parsed_state.current_item_roundness = app_state.CurrentItemRoundness().decode('utf-8') if app_state.CurrentItemRoundness() else parsed_state.current_item_roundness
        parsed_state.view_background_color = app_state.ViewBackgroundColor().decode('utf-8') if app_state.ViewBackgroundColor() else parsed_state.view_background_color
        parsed_state.editing_frame = app_state.EditingFrame().decode('utf-8') if app_state.EditingFrame() else parsed_state.editing_frame

        # Parse groups
        parsed_state.groups = []
        for i in range(app_state.GroupsLength()):
            group = app_state.Groups(i)
            parsed_state.groups.append(DucGroupElement(
                id=group.Id().decode('utf-8'),
                type=group.Type().decode('utf-8'),
                is_collapsed=group.IsCollapsed(),
                label=group.Label().decode('utf-8') if group.Label() else None,
                scope=group.Scope().decode('utf-8') if group.Scope() else parsed_state.scope,
                writing_layer=group.WritingLayer().decode('utf-8') if group.WritingLayer() else parsed_state.writing_layer,
            ))

        # Parse elements to highlight
        parsed_state.elements_to_highlight = []
        for i in range(app_state.ElementsToHighlightLength()):
            element = app_state.ElementsToHighlight(i)
            parsed_state.elements_to_highlight.append(parse_duc_element(element))

    return parsed_state
