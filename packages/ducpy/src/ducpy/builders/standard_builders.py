"""
Helper functions for creating Standard objects with safe defaults and a user-friendly API.
"""
import math
from typing import List, Optional
from ducpy.classes.StandardsClass import (
    Identifier, Standard, StandardViewSettings, StandardOverrides, UnitPrecision,
    StandardStyles, GridSettings, SnapSettings, IdentifiedGridSettings, IdentifiedSnapSettings,
    DucCommonStyle, DucTextStyle, DucDocStyle, IdentifiedCommonStyle, IdentifiedTextStyle, IdentifiedDocStyle,
    PolarGridSettings, IsometricGridSettings, SnapOverride, DynamicSnapSettings, PolarTrackingSettings,
    TrackingLineStyle, LayerSnapFilters, SnapMarkerStyle, SnapMarkerStyleEntry, SnapMarkerSettings,
    LinearUnitSystem, AngularUnitSystem, AlternateUnits, PrimaryUnits, StandardUnits,
    DimensionValidationRules, LayerValidationRules, StandardValidation
)
from ducpy.Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ducpy.Duc.SNAP_OVERRIDE_BEHAVIOR import SNAP_OVERRIDE_BEHAVIOR
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT

def create_identifier(id: str, name: str, description: str = "") -> Identifier:
    return Identifier(id=id, name=name, description=description)

def create_standard_overrides(
    main_scope: str = "mm",
    unit_precision: Optional[UnitPrecision] = None,
    elements_stroke_width_override: float = 0.0,
    common_style_id: str = "",
    stack_like_style_id: str = "",
    text_style_id: str = "",
    dimension_style_id: str = "",
    leader_style_id: str = "",
    feature_control_frame_style_id: str = "",
    table_style_id: str = "",
    doc_style_id: str = "",
    viewport_style_id: str = "",
    plot_style_id: str = "",
    hatch_style_id: str = "",
    dash_line_override: str = "",
    active_grid_settings_id: Optional[List[str]] = None,
    active_snap_settings_id: str = ""
) -> StandardOverrides:
    if unit_precision is None:
        unit_precision = UnitPrecision(linear=2, angular=2, area=2, volume=2)
    if active_grid_settings_id is None:
        active_grid_settings_id = []
    return StandardOverrides(
        main_scope=main_scope,
        unit_precision=unit_precision,
        elements_stroke_width_override=elements_stroke_width_override,
        common_style_id=common_style_id,
        stack_like_style_id=stack_like_style_id,
        text_style_id=text_style_id,
        dimension_style_id=dimension_style_id,
        leader_style_id=leader_style_id,
        feature_control_frame_style_id=feature_control_frame_style_id,
        table_style_id=table_style_id,
        doc_style_id=doc_style_id,
        viewport_style_id=viewport_style_id,
        plot_style_id=plot_style_id,
        hatch_style_id=hatch_style_id,
        dash_line_override=dash_line_override,
        active_grid_settings_id=active_grid_settings_id,
        active_snap_settings_id=active_snap_settings_id
    )

def create_standard_view_settings(
    grid_settings: Optional[List[GridSettings]] = None,
    snap_settings: Optional[List[SnapSettings]] = None,
    views: Optional[List] = None,
    ucs: Optional[List] = None
) -> StandardViewSettings:
    grid_entries = []
    snap_entries = []
    if grid_settings:
        grid_entries = [
            IdentifiedGridSettings(
                id=create_identifier(f"grid_{i}", f"Grid {i}"),
                settings=grid_settings[i]
            ) for i in range(len(grid_settings))
        ]
    if snap_settings:
        snap_entries = [
            IdentifiedSnapSettings(
                id=create_identifier(f"snap_{i}", f"Snap {i}"),
                settings=snap_settings[i]
            ) for i in range(len(snap_settings))
        ]
    if views is None:
        views = []
    if ucs is None:
        ucs = []
    return StandardViewSettings(
        grid_settings=grid_entries,
        snap_settings=snap_entries,
        views=views,
        ucs=ucs
    )

def create_standard_styles(
    common_styles: Optional[List] = None,
    text_styles: Optional[List] = None,
    doc_styles: Optional[List] = None
) -> StandardStyles:
    # Accepts lists of tuples: (id, style)
    common_styles_objs = []
    text_styles_objs = []
    doc_styles_objs = []
    if common_styles:
        for id_str, style in common_styles:
            common_styles_objs.append(
                IdentifiedCommonStyle(id=create_identifier(id_str, id_str), style=style)
            )
    if text_styles:
        for id_str, style in text_styles:
            text_styles_objs.append(
                IdentifiedTextStyle(id=create_identifier(id_str, id_str), style=style)
            )
    if doc_styles:
        for id_str, style in doc_styles:
            doc_styles_objs.append(
                IdentifiedDocStyle(id=create_identifier(id_str, id_str), style=style)
            )
    return StandardStyles(
        common_styles=common_styles_objs,
        text_styles=text_styles_objs,
        doc_styles=doc_styles_objs
    )

def create_standard(
    id: str,
    name: str,
    version: str = "1.0",
    readonly: bool = False,
    view_settings: Optional[StandardViewSettings] = None,
    overrides: Optional[StandardOverrides] = None,
    styles: Optional[StandardStyles] = None,
    units: Optional[StandardUnits] = None,
    validation: Optional[StandardValidation] = None
) -> Standard:
    if view_settings is None:
        view_settings = create_standard_view_settings()
    if overrides is None:
        overrides = create_standard_overrides()
    return Standard(
        identifier=create_identifier(id, name),
        version=version,
        readonly=readonly,
        view_settings=view_settings,
        overrides=overrides,
        styles=styles,
        units=units,
        validation=validation
    )

# --- Additional Builder Functions for StandardsClass dataclasses ---

def create_polar_grid_settings(radial_divisions: int = 8, radial_spacing: float = 10.0, show_labels: bool = True) -> PolarGridSettings:
    return PolarGridSettings(
        radial_divisions=radial_divisions,
        radial_spacing=radial_spacing,
        show_labels=show_labels
    )

def create_isometric_grid_settings(left_angle: float = math.radians(30.0), right_angle: float = math.radians(30.0)) -> IsometricGridSettings:
    return IsometricGridSettings(
        left_angle=left_angle,
        right_angle=right_angle
    )

def create_snap_override(key="ctrl", behavior=None):
    return SnapOverride(key=key, behavior=behavior)

def create_dynamic_snap_settings(enabled_during_drag=True, enabled_during_rotation=True, enabled_during_scale=True):
    return DynamicSnapSettings(
        enabled_during_drag=enabled_during_drag,
        enabled_during_rotation=enabled_during_rotation,
        enabled_during_scale=enabled_during_scale
    )

def create_polar_tracking_settings(enabled=True, angles=None, track_from_last_point=True, show_polar_coordinates=True, increment_angle=None):
    if angles is None:
        angles = [math.radians(0), math.radians(90), math.radians(180), math.radians(270)]  # 0, 90, 180, 270 degrees in radians
    return PolarTrackingSettings(
        enabled=enabled,
        angles=angles,
        track_from_last_point=track_from_last_point,
        show_polar_coordinates=show_polar_coordinates,
        increment_angle=increment_angle
    )

def create_tracking_line_style(color="#FF0000", opacity=0.7, dash_pattern=None):
    if dash_pattern is None:
        dash_pattern = [2.0, 2.0]
    return TrackingLineStyle(
        color=color,
        opacity=opacity,
        dash_pattern=dash_pattern
    )

def create_layer_snap_filters(include_layers=None, exclude_layers=None):
    if include_layers is None:
        include_layers = []
    if exclude_layers is None:
        exclude_layers = []
    return LayerSnapFilters(
        include_layers=include_layers,
        exclude_layers=exclude_layers
    )

def create_snap_marker_style(shape=SNAP_MARKER_SHAPE.SQUARE, color="#00FF00"):
    return SnapMarkerStyle(shape=shape, color=color)

def create_snap_marker_style_entry(key=OBJECT_SNAP_MODE.ENDPOINT, value=None):
    if value is None:
        value = create_snap_marker_style()
    return SnapMarkerStyleEntry(key=key, value=value)

def create_snap_marker_settings(enabled=True, size=8, styles=None, duration=None):
    if styles is None:
        styles = [create_snap_marker_style_entry()]
    return SnapMarkerSettings(
        enabled=enabled,
        size=size,
        styles=styles,
        duration=duration
    )

def create_linear_unit_system(
    precision: int = 2, 
    suppress_leading_zeros: bool = False, 
    suppress_trailing_zeros: bool = True, 
    suppress_zero_feet: bool = True, 
    suppress_zero_inches: bool = True, 
    system: UNIT_SYSTEM = UNIT_SYSTEM.METRIC,
    format: DIMENSION_UNITS_FORMAT = DIMENSION_UNITS_FORMAT.DECIMAL, 
    decimal_separator: DECIMAL_SEPARATOR = DECIMAL_SEPARATOR.DOT
) -> LinearUnitSystem:
    return LinearUnitSystem(
        precision=precision,
        suppress_leading_zeros=suppress_leading_zeros,
        suppress_trailing_zeros=suppress_trailing_zeros,
        suppress_zero_feet=suppress_zero_feet,
        suppress_zero_inches=suppress_zero_inches,
        system=system,
        format=format,
        decimal_separator=decimal_separator
    )

def create_angular_unit_system(
    precision: int = 2, 
    suppress_leading_zeros: bool = False, 
    suppress_trailing_zeros: bool = True, 
    system: UNIT_SYSTEM = UNIT_SYSTEM.METRIC, 
    format: ANGULAR_UNITS_FORMAT = ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES
) -> AngularUnitSystem:
    return AngularUnitSystem(
        precision=precision,
        suppress_leading_zeros=suppress_leading_zeros,
        suppress_trailing_zeros=suppress_trailing_zeros,
        system=system,
        format=format
    )

def create_alternate_units(
    precision: int = 2, 
    suppress_leading_zeros: bool = False, 
    suppress_trailing_zeros: bool = True, 
    system: UNIT_SYSTEM = UNIT_SYSTEM.IMPERIAL, 
    is_visible: bool = True, 
    multiplier: float = 1.0,
    format: DIMENSION_UNITS_FORMAT = DIMENSION_UNITS_FORMAT.DECIMAL
) -> AlternateUnits:
    return AlternateUnits(
        precision=precision,
        suppress_leading_zeros=suppress_leading_zeros,
        suppress_trailing_zeros=suppress_trailing_zeros,
        system=system,
        is_visible=is_visible,
        multiplier=multiplier,
        format=format
    )

def create_primary_units(linear: Optional[LinearUnitSystem] = None, angular: Optional[AngularUnitSystem] = None) -> PrimaryUnits:
    if linear is None:
        linear = create_linear_unit_system()
    if angular is None:
        angular = create_angular_unit_system()
    return PrimaryUnits(linear=linear, angular=angular)

def create_standard_units(primary_units: Optional[PrimaryUnits] = None, alternate_units: Optional[AlternateUnits] = None) -> StandardUnits:
    if primary_units is None:
        primary_units = create_primary_units()
    if alternate_units is None:
        alternate_units = create_alternate_units()
    return StandardUnits(primary_units=primary_units, alternate_units=alternate_units)

def create_dimension_validation_rules(min_text_height=1.0, max_text_height=100.0, allowed_precisions=None):
    if allowed_precisions is None:
        allowed_precisions = [0, 1, 2, 3, 4]
    return DimensionValidationRules(
        min_text_height=min_text_height,
        max_text_height=max_text_height,
        allowed_precisions=allowed_precisions
    )

def create_layer_validation_rules(prohibited_layer_names=None):
    if prohibited_layer_names is None:
        prohibited_layer_names = ["0", "defpoints"]
    return LayerValidationRules(prohibited_layer_names=prohibited_layer_names)

def create_standard_validation(dimension_rules=None, layer_rules=None):
    if dimension_rules is None:
        dimension_rules = create_dimension_validation_rules()
    if layer_rules is None:
        layer_rules = create_layer_validation_rules()
    return StandardValidation(dimension_rules=dimension_rules, layer_rules=layer_rules)

def create_grid_settings(
    grid_type=None,
    x_spacing: float = 10.0,
    y_spacing: float = 10.0,
    major_line_interval: int = 10,
    show_grid: bool = True,
    snap_to_grid: bool = False,
    is_adaptive: bool = False,
    subdivisions: int = 10,
    origin_x: float = 0.0,
    origin_y: float = 0.0,
    rotation: float = 0.0,
    follow_ucs: bool = True,
    show_minor: bool = True,
    min_zoom: float = 0.1,
    max_zoom: float = 100.0,
    auto_hide: bool = False,
    readonly: bool = False,
    display_type=None,
    major_color: str = "#808080",
    minor_color: str = "#C0C0C0",
    type=None,
    polar_settings: Optional[PolarGridSettings] = None,
    isometric_settings: Optional[IsometricGridSettings] = None
) -> GridSettings:
    from ducpy.Duc.GRID_TYPE import GRID_TYPE
    from ducpy.Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
    from ducpy.classes.ElementsClass import GeometricPoint
    from ducpy.classes.StandardsClass import GridStyle
    
    if grid_type is None:
        grid_type = type if type is not None else GRID_TYPE.RECTANGULAR
    if display_type is None:
        display_type = GRID_DISPLAY_TYPE.LINES
    
    origin = GeometricPoint(x=origin_x, y=origin_y)
    
    # Create default grid styles with configurable colors
    major_style = GridStyle(
        color=major_color,
        opacity=1.0,
        dash_pattern=[]
    )
    minor_style = GridStyle(
        color=minor_color, 
        opacity=0.5,
        dash_pattern=[]
    )
    
    return GridSettings(
        is_adaptive=is_adaptive,
        x_spacing=x_spacing,
        y_spacing=y_spacing,
        subdivisions=subdivisions,
        origin=origin,
        rotation=rotation,
        follow_ucs=follow_ucs,
        major_style=major_style,
        minor_style=minor_style,
        show_minor=show_minor,
        min_zoom=min_zoom,
        max_zoom=max_zoom,
        auto_hide=auto_hide,
        enable_snapping=snap_to_grid,
        readonly=readonly,
        type=grid_type,
        display_type=display_type,
        polar_settings=polar_settings,
        isometric_settings=isometric_settings
    )

def create_snap_settings(
    enabled: bool = True,
    snap_modes: Optional[List] = None,
    object_snap_modes: Optional[List] = None,
    snap_tolerance: float = 10.0,
    object_snap_aperture: Optional[int] = None,
    tracking_enabled: bool = False,
    readonly: bool = False,
    twist_angle: float = 0.0,
    is_ortho_mode_on: bool = False,
    is_object_snap_on: Optional[bool] = None,
    show_tracking_lines: bool = True,
    construction_snap_enabled: bool = True,
    incremental_distance: Optional[float] = None,
    magnetic_strength: Optional[float] = None,
    snap_mode=None,
    active_object_snap_modes: Optional[List] = None
) -> SnapSettings:
    from ducpy.Duc.SNAP_MODE import SNAP_MODE
    from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
    
    if snap_modes is None:
        snap_modes = [SNAP_MODE.RUNNING, SNAP_MODE.SINGLE]
    if object_snap_modes is None:
        object_snap_modes = [OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT]
    if active_object_snap_modes is None:
        active_object_snap_modes = object_snap_modes
    if is_object_snap_on is None:
        is_object_snap_on = enabled
    if object_snap_aperture is None:
        object_snap_aperture = int(snap_tolerance * 0.5)
    
    # Create default polar tracking settings
    polar_tracking = create_polar_tracking_settings(enabled=tracking_enabled)
    
    # Create default dynamic snap settings
    dynamic_snap = create_dynamic_snap_settings()
    
    # Create default snap marker settings
    snap_markers = create_snap_marker_settings()
    
    return SnapSettings(
        readonly=readonly,
        twist_angle=twist_angle,
        snap_tolerance=int(snap_tolerance),
        object_snap_aperture=object_snap_aperture,
        is_ortho_mode_on=is_ortho_mode_on,
        polar_tracking=polar_tracking,
        is_object_snap_on=is_object_snap_on,
        active_object_snap_modes=active_object_snap_modes,
        snap_priority=active_object_snap_modes,
        show_tracking_lines=show_tracking_lines,
        dynamic_snap=dynamic_snap,
        snap_markers=snap_markers,
        construction_snap_enabled=construction_snap_enabled,
        tracking_line_style=None,
        temporary_overrides=None,
        incremental_distance=incremental_distance,
        magnetic_strength=magnetic_strength,
        layer_snap_filters=None,
        element_type_filters=None,
        snap_mode=snap_mode if snap_mode is not None else (snap_modes[0] if snap_modes else None)
    )

def create_standard_units_simple(
    linear_units: Optional[LinearUnitSystem] = None,
    angular_units: Optional[AngularUnitSystem] = None,
    measurement_scale: float = 1.0,
    annotation_scale: float = 1.0,
    alternate_units: Optional[AlternateUnits] = None
) -> StandardUnits:
    if linear_units is None:
        linear_units = create_linear_unit_system()
    if angular_units is None:
        angular_units = create_angular_unit_system()
    if alternate_units is None:
        alternate_units = create_alternate_units()
    
    primary_units = create_primary_units(linear=linear_units, angular=angular_units)
    
    return StandardUnits(
        primary_units=primary_units,
        alternate_units=alternate_units
    )

def create_standard_validation_simple(
    enforce_precision: bool = True,
    validate_dimensions: bool = True,
    require_units: bool = True,
    check_tolerances: bool = False,
    tolerance_stack_analysis: bool = False,
    dimension_rules: Optional[DimensionValidationRules] = None,
    layer_rules: Optional[LayerValidationRules] = None
) -> StandardValidation:
    if dimension_rules is None:
        dimension_rules = create_dimension_validation_rules()
    if layer_rules is None:
        layer_rules = create_layer_validation_rules()
    return StandardValidation(
        dimension_rules=dimension_rules,
        layer_rules=layer_rules
    )

def create_standard_overrides_simple(
    allow_user_modifications: bool = True,
    inherit_from_template: bool = True,
    lock_critical_settings: bool = False,
    main_scope: str = "mm",
    unit_precision: Optional[UnitPrecision] = None
) -> StandardOverrides:
    if unit_precision is None:
        unit_precision = UnitPrecision(linear=2, angular=2, area=2, volume=2)
    return StandardOverrides(
        main_scope=main_scope,
        unit_precision=unit_precision
    )

def create_standard_styles_simple(
    default_text_height: float = 2.5,
    default_line_weight: float = 0.25,
    dimension_text_height: float = 2.0,
    leader_text_height: float = 1.8
) -> StandardStyles:
    return StandardStyles()

def create_standard_view_settings_simple(
    default_viewport_scale: float = 1.0,
    show_grid: bool = True,
    show_snap_markers: bool = True,
    highlight_constraints: bool = False,
    show_dimensions: bool = False
) -> StandardViewSettings:
    return StandardViewSettings()

def create_standard_complete(
    id: str,
    name: str,
    description: str = "",
    version: str = "1.0",
    readonly: bool = False,
    units: Optional[StandardUnits] = None,
    validation: Optional[StandardValidation] = None,
    overrides: Optional[StandardOverrides] = None,
    styles: Optional[StandardStyles] = None,
    view_settings: Optional[StandardViewSettings] = None,
    grid_settings: Optional[GridSettings] = None,
    snap_settings: Optional[SnapSettings] = None,
    polar_tracking_settings: Optional[PolarTrackingSettings] = None
) -> Standard:
    identifier = create_identifier(id, name, description)
    
    if units is None:
        units = create_standard_units_simple()
    if validation is None:
        validation = create_standard_validation_simple()
    if overrides is None:
        overrides = create_standard_overrides_simple()
    if styles is None:
        styles = create_standard_styles_simple()
    if view_settings is None:
        view_settings = create_standard_view_settings_simple()
    
    return Standard(
        identifier=identifier,
        version=version,
        readonly=readonly,
        overrides=overrides,
        styles=styles,
        view_settings=view_settings,
        units=units,
        validation=validation
    )
