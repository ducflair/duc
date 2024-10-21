from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from .DucElement import DucElementUnion
from ..enums import FillStyle, StrokePlacement, StrokeStyle, TextAlign
from ..constants import DEFAULT_DUC_ELEMENT

@dataclass
class AppState:
    active_embeddable_element: Optional[DucElementUnion] = None
    active_embeddable_state: Optional[str] = None
    dragging_element: Optional[DucElementUnion] = None
    resizing_element: Optional[DucElementUnion] = None
    multi_element: Optional[DucElementUnion] = None
    selection_element: Optional[DucElementUnion] = None
    frame_to_highlight: Optional[DucElementUnion] = None
    frame_rendering_enabled: bool = True
    frame_rendering_name: bool = True
    frame_rendering_outline: bool = True
    frame_rendering_clip: bool = True
    editing_frame: Optional[str] = None
    elements_to_highlight: List[DucElementUnion] = field(default_factory=list)
    editing_element: Optional[DucElementUnion] = None
    current_item_stroke_color: str = DEFAULT_DUC_ELEMENT["strokeColor"]
    current_item_stroke_placement: StrokePlacement = DEFAULT_DUC_ELEMENT["strokePlacement"]
    current_item_background_color: str = DEFAULT_DUC_ELEMENT["backgroundColor"]
    current_item_fill_style: FillStyle = DEFAULT_DUC_ELEMENT["fillStyle"]
    current_item_stroke_width: int = DEFAULT_DUC_ELEMENT["strokeWidth"]
    current_item_stroke_style: StrokeStyle = DEFAULT_DUC_ELEMENT["strokeStyle"]
    current_item_roughness: int = DEFAULT_DUC_ELEMENT["roughness"]
    current_item_opacity: float = DEFAULT_DUC_ELEMENT["opacity"]
    current_item_font_family: int = 10 # Roboto Mono
    current_item_font_size: int = 20
    current_item_text_align: TextAlign = TextAlign.LEFT
    current_item_start_arrowhead: str = None
    current_item_end_arrowhead: str = "arrow"
    current_item_roundness: str = "sharp"
    view_background_color: str = "#ffffff"
    scope: str = "mm"
    writing_layer: str = "notes"
    groups: List[DucElementUnion] = field(default_factory=list)
    scroll_x: float = 0
    scroll_y: float = 0
    cursor_button: str = "up"
    scrolled_outside: bool = False
    name: Optional[str] = None
    zoom: float = 1.0
    last_pointer_down_with: str = "mouse"
    selected_element_ids: Dict[str, bool] = field(default_factory=dict)
    previous_selected_element_ids: List[str] = field(default_factory=list)
    selected_elements_are_being_dragged: bool = False
    should_cache_ignore_zoom: bool = False
    grid_size: int = 20
    selected_group_ids: List[str] = field(default_factory=list)
    editing_group_id: Optional[str] = None
    paste_dialog_shown: bool = False
    paste_dialog_data: Optional[str] = None
    scale_ratio_locked: bool = False
    display_all_point_distances: bool = False
    display_distance_on_drawing: bool = True
    display_all_point_coordinates: bool = False
    display_all_point_info_selected: bool = True
    display_root_axis: bool = False
    enable_line_bending_on_edit: bool = False
    allow_independent_curve_handles: bool = False
    coord_decimal_places: int = 2
