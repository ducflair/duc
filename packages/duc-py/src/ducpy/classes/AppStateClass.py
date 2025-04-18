from typing import Any, Dict, List, Optional, Union, Set
from dataclasses import dataclass, field

from ..utils.enums import DesignStandard, PointerType
from .DucElementClass import (
    DucElement, ElementStroke, ElementBackground, LineHead,
    TextAlign, StrokePlacement, StrokePreference, FontFamily
)
from ..utils.constants import (
    DEFAULT_APP_STATE,
    DEFAULT_GRID_SIZE,
    DEFAULT_GRID_STEP,
    DEFAULT_FONT_SIZE,
    COLOR_PALETTE,
    DEFAULT_ELEMENT_PROPS
)


@dataclass
class Zoom:
    value: float = field(default=DEFAULT_APP_STATE["zoom"]["value"])

@dataclass
class FrameRendering:
    enabled: bool = field(default=DEFAULT_APP_STATE["frameRendering"]["enabled"])
    name: bool = field(default=DEFAULT_APP_STATE["frameRendering"]["name"])
    outline: bool = field(default=DEFAULT_APP_STATE["frameRendering"]["outline"])
    clip: bool = field(default=DEFAULT_APP_STATE["frameRendering"]["clip"])

@dataclass
class AppState:
    active_embeddable_element: Optional[DucElement] = None
    active_embeddable_state: Optional[str] = None
    dragging_element: Optional[DucElement] = None
    resizing_element: Optional[DucElement] = None
    multi_element: Optional[DucElement] = None
    selection_element: Optional[DucElement] = None
    frame_to_highlight: Optional[DucElement] = None
    frame_rendering: FrameRendering = field(default_factory=FrameRendering)
    editing_frame: Optional[str] = None
    elements_to_highlight: List[DucElement] = field(default_factory=list)
    editing_element: Optional[DucElement] = None
    current_item_stroke: ElementStroke = field(default_factory=lambda: DEFAULT_APP_STATE["currentItemStroke"])
    current_item_background: ElementBackground = field(default_factory=lambda: DEFAULT_APP_STATE["currentItemBackground"])
    current_item_opacity: float = field(default=DEFAULT_APP_STATE["currentItemOpacity"])
    current_item_font_family: FontFamily = field(default=DEFAULT_APP_STATE["currentItemFontFamily"])
    current_item_font_size: float = field(default=DEFAULT_APP_STATE["currentItemFontSize"])
    current_item_text_align: TextAlign = field(default=DEFAULT_APP_STATE["currentItemTextAlign"])
    current_item_start_line_head: Optional[LineHead] = field(default=DEFAULT_APP_STATE["currentItemStartLineHead"])
    current_item_end_line_head: Optional[LineHead] = field(default=DEFAULT_APP_STATE["currentItemEndLineHead"])
    current_item_roundness: float = field(default=DEFAULT_APP_STATE["currentItemRoundness"])
    view_background_color: str = field(default=DEFAULT_APP_STATE["viewBackgroundColor"])
    scope: str = field(default=DEFAULT_APP_STATE["scope"])
    main_scope: str = field(default=DEFAULT_APP_STATE["mainScope"])
    standard: DesignStandard = field(default=DEFAULT_APP_STATE["standard"])
    groups: List['DucGroup'] = field(default_factory=list)
    scroll_x: float = field(default=DEFAULT_APP_STATE["scrollX"])
    scroll_y: float = field(default=DEFAULT_APP_STATE["scrollY"])
    cursor_button: Optional[str] = field(default=DEFAULT_APP_STATE["cursorButton"])
    scrolled_outside: bool = field(default=DEFAULT_APP_STATE["scrolledOutside"])
    name: Optional[str] = field(default=DEFAULT_APP_STATE["name"])
    zoom: Zoom = field(default_factory=Zoom)
    last_pointer_down_with: Optional[PointerType] = field(default=DEFAULT_APP_STATE["lastPointerDownWith"])
    selected_element_ids: Dict[str, bool] = field(default_factory=dict)
    previous_selected_element_ids: List[str] = field(default_factory=list)
    selected_elements_are_being_dragged: bool = False
    should_cache_ignore_zoom: bool = field(default=DEFAULT_APP_STATE["shouldCacheIgnoreZoom"])
    grid_size: int = field(default=DEFAULT_APP_STATE["gridSize"])
    selected_group_ids: List[str] = field(default_factory=list)
    editing_group_id: Optional[str] = None
    paste_dialog_shown: bool = False
    paste_dialog_data: Optional[str] = None
    scale_ratio_locked: bool = field(default=DEFAULT_APP_STATE["scaleRatioLocked"])
    display_all_point_distances: bool = field(default=DEFAULT_APP_STATE["displayAllPointDistances"])
    display_distance_on_drawing: bool = field(default=DEFAULT_APP_STATE["displayDistanceOnDrawing"])
    display_all_point_coordinates: bool = field(default=DEFAULT_APP_STATE["displayAllPointCoordinates"])
    display_all_point_info_selected: bool = field(default=DEFAULT_APP_STATE["displayAllPointInfoSelected"])
    display_root_axis: bool = field(default=DEFAULT_APP_STATE["displayRootAxis"])
    coord_decimal_places: int = field(default=DEFAULT_APP_STATE["coordDecimalPlaces"])
    line_bending_mode: bool = field(default=DEFAULT_APP_STATE["lineBendingMode"])

@dataclass
class DucGroup:
    id: str
    type: str = "group"
    is_collapsed: bool = False
    label: str = ""
    scope: str = field(default=DEFAULT_APP_STATE["scope"])
