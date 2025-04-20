from ..Duc.AppState import AppState as FlatBuffersAppState
from ..utils.constants import DEFAULT_APP_STATE
from ..classes.AppStateClass import AppState, Zoom, FrameRendering, DucGroup
from ..classes.DucElementClass import DucElement
from ..utils.enums import (
    DesignStandard, PointerType, FontFamily, TextAlign,
    ElementContentPreference, StrokePreference, StrokePlacement,
    StrokeCap, StrokeJoin, StrokeSidePreference
)
from ..parse.parse_duc_element import parse_duc_element

def parse_app_state(app_state: FlatBuffersAppState) -> AppState:
    if not app_state:
        return AppState()

    # Parse frame rendering
    frame_rendering = FrameRendering(
        enabled=app_state.FrameRenderingEnabled() if app_state.FrameRenderingEnabled() else DEFAULT_APP_STATE["frameRendering"]["enabled"],
        name=app_state.FrameRenderingName() if app_state.FrameRenderingName() else DEFAULT_APP_STATE["frameRendering"]["name"],
        outline=app_state.FrameRenderingOutline() if app_state.FrameRenderingOutline() else DEFAULT_APP_STATE["frameRendering"]["outline"],
        clip=app_state.FrameRenderingClip() if app_state.FrameRenderingClip() else DEFAULT_APP_STATE["frameRendering"]["clip"]
    )

    # Parse zoom
    zoom = Zoom(
      value=app_state.Zoom() if app_state.Zoom() else DEFAULT_APP_STATE["zoom"]["value"]
    )

    # Parse groups
    groups = []
    for i in range(app_state.GroupsLength()):
        group = app_state.Groups(i)
        if group:
            groups.append(DucGroup(
                id=group.Id().decode('utf-8'),
                type=group.Type().decode('utf-8') if group.Type() else "group",
                is_collapsed=group.IsCollapsed(),
                label=group.Label().decode('utf-8') if group.Label() else "",
                scope=group.Scope().decode('utf-8') if group.Scope() else DEFAULT_APP_STATE["scope"]
            ))

    # Parse selected element IDs
    selected_element_ids = {}
    for i in range(app_state.SelectedElementIdsLength()):
        element_id = app_state.SelectedElementIds(i)
        if element_id:
            selected_element_ids[element_id.decode('utf-8')] = True

    try:
        font_family = FontFamily(int(app_state.CurrentItemFontFamilyV2())) if app_state.CurrentItemFontFamilyV2() else DEFAULT_APP_STATE["currentItemFontFamily"]
    except ValueError:
        # Fall back to default font family if the value is invalid
        font_family = DEFAULT_APP_STATE["currentItemFontFamily"]
    
    # Create AppState with all parsed values
    return AppState(
        frame_rendering=frame_rendering,
        zoom=zoom,
        groups=groups,
        selected_element_ids=selected_element_ids,
        name=app_state.Name().decode('utf-8') if app_state.Name() else None,
        last_pointer_down_with=PointerType(app_state.LastPointerDownWith().decode('utf-8')) if app_state.LastPointerDownWith() else None,
        grid_size=app_state.GridSize() or DEFAULT_APP_STATE["gridSize"],
        scroll_x=app_state.ScrollX() or DEFAULT_APP_STATE["scrollX"],
        scroll_y=app_state.ScrollY() or DEFAULT_APP_STATE["scrollY"],
        cursor_button=app_state.CursorButton().decode('utf-8') if app_state.CursorButton() else None,
        scrolled_outside=app_state.ScrolledOutside(),
        scope=app_state.Scope().decode('utf-8') if app_state.Scope() else DEFAULT_APP_STATE["scope"],
        current_item_stroke=app_state.CurrentItemStroke() or DEFAULT_APP_STATE["currentItemStroke"],
        current_item_background=app_state.CurrentItemBackground() or DEFAULT_APP_STATE["currentItemBackground"],
        current_item_opacity=app_state.CurrentItemOpacity() or DEFAULT_APP_STATE["currentItemOpacity"],
        current_item_font_family=font_family,
        current_item_font_size=app_state.CurrentItemFontSizeV3() or DEFAULT_APP_STATE["currentItemFontSize"],
        current_item_text_align=TextAlign(app_state.CurrentItemTextAlignV3()) if app_state.CurrentItemTextAlignV3() else DEFAULT_APP_STATE["currentItemTextAlign"],
        current_item_start_line_head=app_state.CurrentItemStartLineHead() or DEFAULT_APP_STATE["currentItemStartLineHead"],
        current_item_end_line_head=app_state.CurrentItemEndLineHead() or DEFAULT_APP_STATE["currentItemEndLineHead"],
        current_item_roundness=app_state.CurrentItemRoundnessV3() or DEFAULT_APP_STATE["currentItemRoundness"],
        view_background_color=app_state.ViewBackgroundColor().decode('utf-8') if app_state.ViewBackgroundColor() else DEFAULT_APP_STATE["viewBackgroundColor"],
        scale_ratio_locked=app_state.ScaleRatioLocked(),
        display_all_point_distances=app_state.DisplayAllPointDistances(),
        display_distance_on_drawing=app_state.DisplayDistanceOnDrawing(),
        display_all_point_coordinates=app_state.DisplayAllPointCoordinates(),
        display_all_point_info_selected=app_state.DisplayAllPointInfoSelected(),
        display_root_axis=app_state.DisplayRootAxis(),
        coord_decimal_places=app_state.CoordDecimalPlacesV3() or DEFAULT_APP_STATE["coordDecimalPlaces"],
        line_bending_mode=app_state.LineBendingMode(),
    )
