from dataclasses import dataclass, field
from typing import List, Optional

from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ducpy.Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.SNAP_OVERRIDE_BEHAVIOR import SNAP_OVERRIDE_BEHAVIOR
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM

from .ElementsClass import (DucCommonStyle, DucDimensionStyle, DucDocStyle,
                            DucFeatureControlFrameStyle, DucHatchStyle,
                            DucLeaderStyle, DucStackLikeStyles, DucTableStyle,
                            DucTextStyle, DucUcs, DucView, DucViewportStyle,
                            DucXRayStyle, ElementBackground, ElementStroke,
                            GeometricPoint, Identifier)


@dataclass
class GridStyle:
    color: str
    opacity: float
    dash_pattern: List[float]

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
    origin: GeometricPoint
    rotation: float
    follow_ucs: bool
    major_style: GridStyle
    minor_style: GridStyle
    show_minor: bool
    min_zoom: float
    max_zoom: float
    auto_hide: bool
    polar_settings: PolarGridSettings
    isometric_settings: IsometricGridSettings
    enable_snapping: bool
    readonly: bool
    type: Optional[GRID_TYPE] = None
    display_type: Optional[GRID_DISPLAY_TYPE] = None

@dataclass
class SnapOverride:
    key: str
    behavior: Optional[SNAP_OVERRIDE_BEHAVIOR] = None

@dataclass
class DynamicSnapSettings:
    enabled_during_drag: bool
    enabled_during_rotation: bool
    enabled_during_scale: bool

@dataclass
class PolarTrackingSettings:
    enabled: bool
    angles: List[float]
    increment_angle: float
    track_from_last_point: bool
    show_polar_coordinates: bool

@dataclass
class TrackingLineStyle:
    color: str
    opacity: float
    dash_pattern: List[float]

@dataclass
class LayerSnapFilters:
    include_layers: List[str] = field(default_factory=list)
    exclude_layers: List[str] = field(default_factory=list)

@dataclass
class SnapMarkerStyle:
    color: str
    shape: Optional[SNAP_MARKER_SHAPE] = None

@dataclass
class SnapMarkerStyleEntry:
    key: Optional[OBJECT_SNAP_MODE]
    value: SnapMarkerStyle

@dataclass
class SnapMarkerSettings:
    enabled: bool
    size: int
    duration: int = 0
    styles: List[SnapMarkerStyleEntry] = field(default_factory=list)

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
    tracking_line_style: TrackingLineStyle
    dynamic_snap: DynamicSnapSettings
    layer_snap_filters: LayerSnapFilters
    snap_markers: SnapMarkerSettings
    construction_snap_enabled: bool
    temporary_overrides: List[SnapOverride] = field(default_factory=list)
    incremental_distance: float = 0.0
    magnetic_strength: float = 0.0
    snap_mode: Optional[SNAP_MODE] = None
    element_type_filters: List[str] = field(default_factory=list)
    snap_to_grid_intersections: bool = False

@dataclass
class UnitSystemBase:
    precision: int
    suppress_leading_zeros: bool
    suppress_trailing_zeros: bool
    system: Optional[UNIT_SYSTEM]

@dataclass
class LinearUnitSystem(UnitSystemBase):
    suppress_zero_feet: bool
    suppress_zero_inches: bool
    format: Optional[DIMENSION_UNITS_FORMAT]
    decimal_separator: Optional[DECIMAL_SEPARATOR]

@dataclass
class AngularUnitSystem(UnitSystemBase):
    format: Optional[ANGULAR_UNITS_FORMAT] = None

@dataclass
class AlternateUnits(UnitSystemBase):
    is_visible: bool
    multiplier: float
    format: Optional[DIMENSION_UNITS_FORMAT] = None

@dataclass
class PrimaryUnits:
    linear: LinearUnitSystem
    angular: AngularUnitSystem

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
    unit_precision: UnitPrecision
    main_scope: str = ""
    elements_stroke_width_override: float = 0.0
    common_style_id: str = ""
    stack_like_style_id: str = ""
    text_style_id: str = ""
    dimension_style_id: str = ""
    leader_style_id: str = ""
    feature_control_frame_style_id: str = ""
    table_style_id: str = ""
    doc_style_id: str = ""
    viewport_style_id: str = ""
    plot_style_id: str = ""
    hatch_style_id: str = ""
    active_grid_settings_id: List[str] = field(default_factory=list)
    active_snap_settings_id: str = ""
    dash_line_override: str = ""

@dataclass
class IdentifiedCommonStyle:
    id: Identifier
    style: DucCommonStyle

@dataclass
class IdentifiedStackLikeStyle:
    id: Identifier
    style: DucStackLikeStyles

@dataclass
class IdentifiedTextStyle:
    id: Identifier
    style: DucTextStyle

@dataclass
class IdentifiedDimensionStyle:
    id: Identifier
    style: DucDimensionStyle

@dataclass
class IdentifiedLeaderStyle:
    id: Identifier
    style: DucLeaderStyle

@dataclass
class IdentifiedFCFStyle:
    id: Identifier
    style: DucFeatureControlFrameStyle

@dataclass
class IdentifiedTableStyle:
    id: Identifier
    style: DucTableStyle

@dataclass
class IdentifiedDocStyle:
    id: Identifier
    style: DucDocStyle

@dataclass
class IdentifiedViewportStyle:
    id: Identifier
    style: DucViewportStyle

@dataclass
class IdentifiedHatchStyle:
    id: Identifier
    style: DucHatchStyle

@dataclass
class IdentifiedXRayStyle:
    id: Identifier
    style: DucXRayStyle

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
    ucs: DucUcs

@dataclass
class IdentifiedView:
    id: Identifier
    view: DucView

@dataclass
class StandardViewSettings:
    views: List[IdentifiedView] = field(default_factory=list)
    ucs: List[IdentifiedUcs] = field(default_factory=list)
    grid_settings: List[IdentifiedGridSettings] = field(default_factory=list)
    snap_settings: List[IdentifiedSnapSettings] = field(default_factory=list)

@dataclass
class DimensionValidationRules:
    min_text_height: float = 0.0
    max_text_height: float = 0.0
    allowed_precisions: List[int] = field(default_factory=list)

@dataclass
class LayerValidationRules:
    prohibited_layer_names: List[str] = field(default_factory=list)

@dataclass
class StandardValidation:
    dimension_rules: DimensionValidationRules
    layer_rules: LayerValidationRules

@dataclass
class Standard:
    identifier: Identifier
    version: str
    readonly: bool
    overrides: StandardOverrides
    styles: StandardStyles
    view_settings: StandardViewSettings
    units: StandardUnits
    validation: StandardValidation

