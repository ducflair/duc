from dataclasses import dataclass, field
from typing import List, Optional, Dict, Union, Any, TYPE_CHECKING

from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ducpy.Duc.SNAP_OVERRIDE_BEHAVIOR import SNAP_OVERRIDE_BEHAVIOR
from ducpy.Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.PRUNING_LEVEL import PRUNING_LEVEL

from ducpy.classes.ElementsClass import (
    DucCommonStyle, DucStackLikeStyles, DucTextStyle, DucDimensionStyle,
    DucLeaderStyle, DucFeatureControlFrameStyle, DucTableStyle, DucDocStyle,
    DucViewportStyle, DucHatchStyle, DucXRayStyle, DucUcs, DucView, Identifier
)

@dataclass
class GridStyle:
    color: str
    opacity: float
    dash_pattern: Optional[List[float]]

@dataclass
class PolarGridSettings:
    radial_divisions: int
    radial_spacing: float
    show_labels: bool

@dataclass
class IsometricGridSettings:
    left_angle: float
    right_angle: float

@dataclass
class GridSettings:
    is_adaptive: bool
    x_spacing: float
    y_spacing: float
    subdivisions: int
    origin: "GeometricPoint"
    rotation: float
    follow_ucs: bool
    major_style: GridStyle
    minor_style: GridStyle
    show_minor: bool
    min_zoom: float
    max_zoom: float
    auto_hide: bool
    enable_snapping: bool
    readonly: bool
    type: GRID_TYPE
    display_type: GRID_DISPLAY_TYPE
    polar_settings: Optional[PolarGridSettings]
    isometric_settings: Optional[IsometricGridSettings]

@dataclass
class SnapOverride:
    key: str
    behavior: Optional[SNAP_OVERRIDE_BEHAVIOR]

@dataclass
class DynamicSnapSettings:
    enabled_during_drag: bool
    enabled_during_rotation: bool
    enabled_during_scale: bool

@dataclass
class PolarTrackingSettings:
    enabled: bool
    angles: List[float]
    track_from_last_point: bool
    show_polar_coordinates: bool
    increment_angle: Optional[float]

@dataclass
class TrackingLineStyle:
    color: str
    opacity: float
    dash_pattern: List[float]

@dataclass
class LayerSnapFilters:
    include_layers: List[str]
    exclude_layers: List[str]

@dataclass
class SnapMarkerStyle:
    shape: SNAP_MARKER_SHAPE
    color: str

@dataclass
class SnapMarkerStyleEntry:
    key: OBJECT_SNAP_MODE
    value: SnapMarkerStyle

@dataclass
class SnapMarkerSettings:
    enabled: bool
    size: int
    styles: List[SnapMarkerStyleEntry]
    duration: Optional[int] = None

@dataclass
class SnapSettings:
    readonly: bool
    twist_angle: float
    snap_tolerance: int
    object_snap_aperture: int
    is_ortho_mode_on: bool
    polar_tracking: PolarTrackingSettings
    is_object_snap_on: bool
    active_object_snap_modes: List[OBJECT_SNAP_MODE]
    snap_priority: List[OBJECT_SNAP_MODE]
    show_tracking_lines: bool
    dynamic_snap: DynamicSnapSettings
    snap_markers: SnapMarkerSettings
    construction_snap_enabled: bool
    tracking_line_style: Optional[TrackingLineStyle]
    temporary_overrides: Optional[List[SnapOverride]]
    incremental_distance: Optional[float]
    magnetic_strength: Optional[float]
    layer_snap_filters: Optional[LayerSnapFilters]
    element_type_filters: Optional[List[str]]
    snap_mode: Optional[SNAP_MODE]
    snap_to_grid_intersections: Optional[bool]

@dataclass
class UnitSystemBase:
    precision: int
    suppress_leading_zeros: bool
    suppress_trailing_zeros: bool
    system: UNIT_SYSTEM

@dataclass
class LinearUnitSystem(UnitSystemBase):
    suppress_zero_feet: bool
    suppress_zero_inches: bool
    format: DIMENSION_UNITS_FORMAT
    decimal_separator: DECIMAL_SEPARATOR

@dataclass
class AngularUnitSystem(UnitSystemBase):
    format: ANGULAR_UNITS_FORMAT

@dataclass
class AlternateUnits(UnitSystemBase):
    is_visible: bool
    multiplier: float
    format: DIMENSION_UNITS_FORMAT

@dataclass
class PrimaryUnits:
    linear: Optional[LinearUnitSystem]
    angular: Optional[AngularUnitSystem]

@dataclass
class StandardUnits:
    primary_units: PrimaryUnits
    alternate_units: AlternateUnits

@dataclass
class UnitPrecision:
    linear: int
    angular: int
    area: int
    volume: int

@dataclass
class StandardOverrides:
    unit_precision: Optional[UnitPrecision]
    main_scope: Optional[str]
    elements_stroke_width_override: Optional[float]
    common_style_id: Optional[str]
    stack_like_style_id: Optional[str]
    text_style_id: Optional[str]
    dimension_style_id: Optional[str]
    leader_style_id: Optional[str]
    feature_control_frame_style_id: Optional[str]
    table_style_id: Optional[str]
    doc_style_id: Optional[str]
    viewport_style_id: Optional[str]
    plot_style_id: Optional[str]
    hatch_style_id: Optional[str]
    active_grid_settings_id: Optional[List[str]]
    active_snap_settings_id: Optional[str]
    dash_line_override: Optional[str]

@dataclass
class IdentifiedCommonStyle:
    id: Identifier
    style: "DucCommonStyle"

@dataclass
class IdentifiedStackLikeStyle:
    id: Identifier
    style: "DucStackLikeStyles"

@dataclass
class IdentifiedTextStyle:
    id: Identifier
    style: "DucTextStyle"

@dataclass
class IdentifiedDimensionStyle:
    id: Identifier
    style: "DucDimensionStyle"

@dataclass
class IdentifiedLeaderStyle:
    id: Identifier
    style: "DucLeaderStyle"

@dataclass
class IdentifiedFCFStyle:
    id: Identifier
    style: "DucFeatureControlFrameStyle"

@dataclass
class IdentifiedTableStyle:
    id: Identifier
    style: "DucTableStyle"

@dataclass
class IdentifiedDocStyle:
    id: Identifier
    style: "DucDocStyle"

@dataclass
class IdentifiedViewportStyle:
    id: Identifier
    style: "DucViewportStyle"

@dataclass
class IdentifiedHatchStyle:
    id: Identifier
    style: "DucHatchStyle"

@dataclass
class IdentifiedXRayStyle:
    id: Identifier
    style: "DucXRayStyle"

@dataclass
class StandardStyles:
    common_styles: List[IdentifiedCommonStyle] = field(default_factory=list)
    stack_like_styles: List[IdentifiedStackLikeStyle] = field(default_factory=list)
    text_styles: List[IdentifiedTextStyle] = field(default_factory=list)
    dimension_styles: List[IdentifiedDimensionStyle] = field(default_factory=list)
    leader_styles: List[IdentifiedLeaderStyle] = field(default_factory=list)
    feature_control_frame_styles: List[IdentifiedFCFStyle] = field(default_factory=list)
    table_styles: List[IdentifiedTableStyle] = field(default_factory=list)
    doc_styles: List[IdentifiedDocStyle] = field(default_factory=list)
    viewport_styles: List[IdentifiedViewportStyle] = field(default_factory=list)
    hatch_styles: List[IdentifiedHatchStyle] = field(default_factory=list)
    xray_styles: List[IdentifiedXRayStyle] = field(default_factory=list)

@dataclass
class IdentifiedGridSettings:
    id: Identifier
    settings: "GridSettings"

@dataclass
class IdentifiedSnapSettings:
    id: Identifier
    settings: "SnapSettings"

@dataclass
class IdentifiedUcs:
    id: Identifier
    ucs: "DucUcs"

@dataclass
class IdentifiedView:
    id: Identifier
    view: "DucView"

@dataclass
class StandardViewSettings:
    views: List[IdentifiedView]
    ucs: List[IdentifiedUcs]
    grid_settings: List[IdentifiedGridSettings]
    snap_settings: List[IdentifiedSnapSettings]

@dataclass
class DimensionValidationRules:
    min_text_height: float
    max_text_height: float
    allowed_precisions: List[int]

@dataclass
class LayerValidationRules:
    prohibited_layer_names: List[str]

@dataclass
class StandardValidation:
    dimension_rules: Optional[DimensionValidationRules]
    layer_rules: Optional[LayerValidationRules]

@dataclass
class Standard:
    identifier: Identifier
    version: str
    readonly: bool
    overrides: Optional[StandardOverrides]
    styles: Optional[StandardStyles]
    view_settings: Optional[StandardViewSettings]
    units: Optional[StandardUnits]
    validation: Optional[StandardValidation]

