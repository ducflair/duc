from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Dict, List, Optional, Union

from ducpy.enums import TEXT_ALIGN

if TYPE_CHECKING:
    from ducpy.classes.ElementsClass import ElementWrapper

from ducpy.classes.ElementsClass import (DucBlock, DucBlockCollection,
                                         DucBlockInstance, DucGroup, DucHead,
                                         DucLayer, DucRegion,
                                         ElementBackground, ElementStroke,
                                         ElementWrapper, GeometricPoint,
                                         Viewer3DState)


@dataclass
class DictionaryEntry:
    key: str
    value: str

@dataclass
class Actor:
    identifier: str
    name: Optional[str] = None


@dataclass
class DucCharterRequirement:
    id: str
    statement: str
    must: bool
    acceptance_criteria: Optional[List[str]] = None


@dataclass
class DucCharterConstraint:
    id: str
    statement: str
    hard: bool


@dataclass
class DucCharterDecision:
    id: str
    decision: str
    rationale: str
    accepted: bool
    decided_at: int
    issue_ids: Optional[List[str]] = None


@dataclass
class DucCharterStakeholder:
    actor: Actor
    role: str


@dataclass
class DucCharter:
    title: str
    objective: str
    phase: str
    requirements: List[DucCharterRequirement]
    constraints: List[DucCharterConstraint]
    decisions: List[DucCharterDecision]
    updated_at: int
    description: Optional[str] = None
    closed_reason: Optional[str] = None
    stakeholders: Optional[List[DucCharterStakeholder]] = None


@dataclass
class DucIssueMessage:
    id: str
    author: Actor
    content: str
    created_at: int
    reply_to_id: Optional[str] = None
    reactions: Optional[Dict[str, List[str]]] = None
    edited_at: Optional[int] = None
    deleted_at: Optional[int] = None


@dataclass
class DucIssueCanvasAnchor:
    x: float
    y: float
    scope: Optional[str] = None
    type: str = "canvas"


@dataclass
class DucIssueElementAnchor:
    element_id: str
    anchor_x: Optional[float] = None
    anchor_y: Optional[float] = None
    type: str = "element"


@dataclass
class DucIssueModelAnchor:
    element_id: str
    point: List[float]
    normal: Optional[List[float]] = None
    viewer_state: Optional[Viewer3DState] = None
    topology_id: Optional[str] = None
    type: str = "model"


DucIssueAnchor = Union[DucIssueCanvasAnchor, DucIssueElementAnchor, DucIssueModelAnchor]


@dataclass
class DucIssue:
    id: str
    local_id: int
    title: str
    status: str
    messages: List[DucIssueMessage]
    author_id: str
    created_at: int
    updated_at: int
    dismissed_reason: Optional[str] = None
    due_date: Optional[int] = None
    anchor: Optional[DucIssueAnchor] = None
    assignee_ids: Optional[List[str]] = None
    follower_ids: Optional[List[str]] = None
    deleted_at: Optional[int] = None


@dataclass
class DucGlobalState:
    view_background_color: str
    main_scope: str
    scope_exponent_threshold: int


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
class ExternalFileRevision:
    id: str
    size_bytes: int
    mime_type: str
    created: int
    checksum: Optional[str] = None
    source_name: Optional[str] = None
    message: Optional[str] = None
    last_retrieved: Optional[int] = None

@dataclass
class DucExternalFile:
    id: str
    active_revision_id: str
    updated: int
    revisions: Dict[str, ExternalFileRevision]
    version: Optional[int] = None

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
    files: Optional[Dict[str, DucExternalFile]]
    charter: Optional[DucCharter] = None
    issues: Optional[List[DucIssue]] = None
    files_data: Optional[Dict[str, bytes]] = None
    id: Optional[str] = None
