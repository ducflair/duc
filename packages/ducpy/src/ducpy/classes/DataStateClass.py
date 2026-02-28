from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

from ducpy.enums import PRUNING_LEVEL, TEXT_ALIGN

if TYPE_CHECKING:
    from ducpy.classes.ElementsClass import ElementWrapper

from ducpy.classes.ElementsClass import (DucBlock, DucBlockCollection,
                                         DucBlockInstance, DucGroup, DucHead,
                                         DucLayer, DucRegion,
                                         ElementBackground, ElementStroke,
                                         ElementWrapper, GeometricPoint)


@dataclass
class DictionaryEntry:
    key: str
    value: str

@dataclass
class DucGlobalState:
    view_background_color: str
    main_scope: str
    scope_exponent_threshold: int
    name: Optional[str]
    pruning_level: Optional[PRUNING_LEVEL] = None

@dataclass
class DucLocalState:
    scope: str
    scroll_x: float
    scroll_y: float
    zoom: float
    is_binding_enabled: bool
    pen_mode: bool
    view_mode_enabled: bool
    objects_snap_mode_enabled: bool
    grid_mode_enabled: bool
    outline_mode_enabled: bool
    current_item_stroke: Optional["ElementStroke"]
    current_item_background: Optional["ElementBackground"]
    current_item_opacity: Optional[float]
    current_item_font_family: Optional[str]
    current_item_font_size: Optional[float]
    current_item_text_align: Optional["TEXT_ALIGN"]
    current_item_roundness: Optional[float]
    current_item_start_line_head: Optional["DucHead"]
    current_item_end_line_head: Optional["DucHead"]
    manual_save_mode: Optional[bool] = None
    decimal_places: int = 2

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
    version_number: int = 0
    schema_version: int = 0
    is_schema_boundary: bool = False
    data: bytes = b''
    size_bytes: int = 0
    type: str = 'checkpoint'

@dataclass
class Delta(VersionBase):
    version_number: int = 0
    schema_version: int = 0
    base_checkpoint_id: str = ''
    payload: bytes = b''
    size_bytes: int = 0
    type: str = 'delta'

@dataclass
class SchemaMigration:
    from_schema_version: int
    to_schema_version: int
    migration_name: str
    applied_at: int
    migration_checksum: Optional[str] = None
    boundary_checkpoint_id: Optional[str] = None

@dataclass
class VersionChain:
    id: str
    schema_version: int
    start_version: int
    end_version: Optional[int] = None
    migration: Optional[SchemaMigration] = None
    root_checkpoint_id: Optional[str] = None

@dataclass
class VersionGraphMetadata:
    current_version: int
    current_schema_version: int
    chain_count: int
    last_pruned: int
    total_size: int

@dataclass
class VersionGraph:
    checkpoints: List[Checkpoint]
    deltas: List[Delta]
    chains: List[VersionChain]
    metadata: VersionGraphMetadata
    user_checkpoint_version_id: str
    latest_version_id: str

@dataclass
class DisplayPrecision:
    linear: int = 2
    angular: int = 2

@dataclass
class DucExternalFileData:
    mime_type: str
    id: str
    data: bytes
    created: int
    last_retrieved: Optional[int]

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
    blocks: List["DucBlock"]
    block_instances: List["DucBlockInstance"]
    block_collections: List["DucBlockCollection"]
    groups: List["DucGroup"]
    regions: List["DucRegion"]
    layers: List["DucLayer"]
    dictionary: Dict[str, str]
    duc_local_state: Optional[DucLocalState]
    duc_global_state: Optional[DucGlobalState]
    version_graph: Optional[VersionGraph]
    files: Optional[List[DucExternalFileEntry]]
    id: Optional[str] = None