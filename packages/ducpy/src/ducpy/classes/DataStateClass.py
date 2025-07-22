from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union, Any

from ducpy.Duc.PRUNING_LEVEL import PRUNING_LEVEL
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.classes.ElementsClass import (DucBlock, DucGroup, DucHead, DucLayer,
                                         DucRegion, ElementBackground,
                                         ElementStroke, ElementWrapper,
                                         GeometricPoint)
from ducpy.classes.StandardsClass import GridSettings, SnapSettings, Standard


@dataclass
class DictionaryEntry:
    key: str
    value: str

@dataclass
class DisplayPrecision:
    linear: int
    angular: int

@dataclass
class DucGlobalState:
    view_background_color: str
    main_scope: str
    dash_spacing_scale: float
    is_dash_spacing_affected_by_viewport_scale: bool
    scope_exponent_threshold: int
    dimensions_associative_by_default: bool
    use_annotative_scaling: bool
    display_precision: DisplayPrecision
    name: Optional[str] = None

@dataclass
class DucLocalState:
    scope: str
    active_standard_id: str
    scroll_x: float
    scroll_y: float
    zoom: float
    is_binding_enabled: bool
    pen_mode: bool
    view_mode_enabled: bool
    objects_snap_mode_enabled: bool
    grid_mode_enabled: bool
    outline_mode_enabled: bool
    active_grid_settings: Optional[List[str]] = None
    active_snap_settings: Optional[str] = None
    current_item_stroke: Optional[ElementStroke] = None
    current_item_background: Optional[ElementBackground] = None
    current_item_opacity: Optional[float] = None
    current_item_font_family: Optional[str] = None
    current_item_font_size: Optional[float] = None
    current_item_text_align: Optional[TEXT_ALIGN] = None
    current_item_roundness: Optional[float] = None
    current_item_start_line_head: Optional[DucHead] = None
    current_item_end_line_head: Optional[DucHead] = None

@dataclass
class JSONPatchOperation:
    op: str
    path: str
    value: Any # Value can be any JSON-serializable type

@dataclass
class VersionBase:
    id: str
    timestamp: int
    is_manual_save: bool
    parent_id: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[str] = None

@dataclass
class Checkpoint(VersionBase):
    data: bytes = b""
    size_bytes: int = 0
    type: str = "checkpoint"

@dataclass
class Delta(VersionBase):
    patch: List[JSONPatchOperation] = None
    type: str = "delta"
    
    def __post_init__(self):
        if self.patch is None:
            self.patch = []

@dataclass
class VersionGraphMetadata:
    last_pruned: int
    total_size: int
    pruning_level: PRUNING_LEVEL

@dataclass
class VersionGraph:
    checkpoints: List[Checkpoint]
    deltas: List[Delta]
    metadata: VersionGraphMetadata
    user_checkpoint_version_id: str
    latest_version_id: str

@dataclass
class DucExternalFileData:
    mime_type: str
    id: str
    data: bytes
    created: int
    last_retrieved: Optional[int] = None
    version: Optional[int] = None

@dataclass
class DucExternalFileEntry:
    key: str
    value: DucExternalFileData

@dataclass
class ExportedDataState:
    type: str
    version: str
    source: str
    thumbnail: bytes
    elements: List[ElementWrapper]
    blocks: List[DucBlock]
    groups: List[DucGroup]
    regions: List[DucRegion]
    layers: List[DucLayer]
    standards: List[Standard]
    dictionary: Dict[str, str] = field(default_factory=dict)
    duc_local_state: Optional[DucLocalState] = None
    duc_global_state: Optional[DucGlobalState] = None
    version_graph: Optional[VersionGraph] = None
    files: Optional[List[DucExternalFileEntry]] = None