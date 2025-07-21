from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union

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
class DucGlobalState:
    view_background_color: str
    main_scope: str
    dash_spacing_scale: float
    is_dash_spacing_affected_by_viewport_scale: bool
    scope_exponent_threshold: int
    dimensions_associative_by_default: bool
    use_annotative_scaling: bool
    display_precision_linear: int
    display_precision_angular: int
    name: Optional[str] = None

@dataclass
class DucLocalState:
    scope: str
    active_standard_id: str
    scroll_x: float
    scroll_y: float
    zoom: float
    is_binding_enabled: bool
    current_item_stroke: ElementStroke
    current_item_background: ElementBackground
    current_item_opacity: float
    current_item_font_family: str
    current_item_font_size: float
    current_item_start_line_head: DucHead
    current_item_end_line_head: DucHead
    current_item_roundness: float
    pen_mode: bool
    view_mode_enabled: bool
    objects_snap_mode_enabled: bool
    grid_mode_enabled: bool
    outline_mode_enabled: bool
    active_grid_settings: List[str] = field(default_factory=list)
    active_snap_settings: Optional[str] = None
    current_item_text_align: Optional[TEXT_ALIGN] = None

@dataclass
class JSONPatchOperation:
    op: str
    path: str
    value: str # Stored as serialized JSON string

@dataclass
class VersionBase:
    id: str
    timestamp: int
    is_manual_save: bool
    parent_id: Optional[str]
    description: Optional[str]
    user_id: Optional[str]

@dataclass
class Checkpoint(VersionBase):
    data: bytes
    size_bytes: int

@dataclass
class Delta(VersionBase):
    patch: List[JSONPatchOperation]

@dataclass
class VersionGraphMetadata:
    last_pruned: int
    total_size: int
    pruning_level: Optional[PRUNING_LEVEL] = None

@dataclass
class VersionGraph:
    checkpoints: List[Checkpoint]
    deltas: List[Delta]
    metadata: VersionGraphMetadata
    user_checkpoint_version_id: Optional[str] = None
    latest_version_id: Optional[str] = None

@dataclass
class DucExternalFileData:
    mime_type: str
    id: str
    data: bytes
    created: int
    last_retrieved: int

@dataclass
class DucExternalFileEntry:
    key: str
    value: DucExternalFileData

@dataclass
class ExportedDataState:
    type: str
    version: str
    source: str
    duc_local_state: DucLocalState
    duc_global_state: DucGlobalState
    version_graph: VersionGraph 
    version_legacy: Optional[int] = None
    thumbnail: bytes = b''
    dictionary: List[DictionaryEntry] = field(default_factory=list)
    elements: List[ElementWrapper] = field(default_factory=list)
    blocks: List[DucBlock] = field(default_factory=list)
    groups: List[DucGroup] = field(default_factory=list)
    regions: List[DucRegion] = field(default_factory=list)
    layers: List[DucLayer] = field(default_factory=list)
    standards: List[Standard] = field(default_factory=list)
    files: List[DucExternalFileEntry] = field(default_factory=list)