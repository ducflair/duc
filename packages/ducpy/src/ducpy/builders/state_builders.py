"""
Helper functions for creating DUC state-related objects with a user-friendly API.
Follows the same hierarchical builder pattern as element_builders.py.
"""
from typing import List, Optional, Dict, Any, Union, TYPE_CHECKING
import time
import uuid
import math
from dataclasses import dataclass, field
from ducpy.utils.mutate_utils import recursive_mutate

if TYPE_CHECKING:
    from ..classes.StandardsClass import Standard

from ..classes.DataStateClass import (
    DucGlobalState, DucLocalState, DisplayPrecision,
    VersionGraph, VersionGraphMetadata, Checkpoint, Delta, JSONPatchOperation,
    DucExternalFileData, DucExternalFileEntry
)
from ..classes.StandardsClass import (
    GridSettings, SnapSettings, GridStyle, PolarGridSettings, IsometricGridSettings,
    SnapOverride, DynamicSnapSettings, PolarTrackingSettings, TrackingLineStyle,
    LayerSnapFilters, SnapMarkerSettings, SnapMarkerStyle, SnapMarkerStyleEntry,
    Identifier, Standard, StandardViewSettings, StandardOverrides, UnitPrecision,
    StandardStyles, IdentifiedGridSettings, IdentifiedSnapSettings,
    DucCommonStyle, DucTextStyle, DucDocStyle, IdentifiedCommonStyle, IdentifiedTextStyle, IdentifiedDocStyle,
    LinearUnitSystem, AngularUnitSystem, AlternateUnits, PrimaryUnits, StandardUnits,
    DimensionValidationRules, LayerValidationRules, StandardValidation
)
from ..classes.ElementsClass import (
    DucView, DucUcs, DucPoint, GeometricPoint, DucGroup, DucStackBase, DucLayer, DucRegion, DucLayerOverrides, DucStackLikeStyles,
    LeaderTextBlockContent, LeaderBlockContent, LeaderContent, StringValueEntry, ToleranceClause, DatumReference, FeatureControlFrameSegment,
    DucBlockAttributeDefinition, DucBlockAttributeDefinitionEntry, DucBlock, ElementWrapper
)
from ..Duc.PRUNING_LEVEL import PRUNING_LEVEL
from ..Duc.GRID_TYPE import GRID_TYPE
from ..Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ..Duc.SNAP_MODE import SNAP_MODE
from ..Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ..Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ..Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ..Duc.SNAP_OVERRIDE_BEHAVIOR import SNAP_OVERRIDE_BEHAVIOR
from ..Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ..Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ..Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ..Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.utils.rand_utils import generate_random_id
from ..Duc.FEATURE_MODIFIER import FEATURE_MODIFIER
from ..Duc.TOLERANCE_ZONE_TYPE import TOLERANCE_ZONE_TYPE
from ..Duc.MATERIAL_CONDITION import MATERIAL_CONDITION
from ..classes.ElementsClass import DatumReference
from ..Duc.GDT_SYMBOL import GDT_SYMBOL
from ..classes.ElementsClass import FeatureControlFrameSegment
from ..classes.ElementsClass import DucBlockAttributeDefinition, DucBlockAttributeDefinitionEntry

# Base dataclass for common parameters
@dataclass
class BaseStateParams:
    id: Optional[str] = None
    name: str = ""
    description: str = ""
    version: str = "1.0"
    readonly: bool = False

# Base builder class
class StateBuilder:
    def __init__(self):
        self.base = BaseStateParams()
        self.extra = {}

    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_name(self, name: str):
        self.base.name = name
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def with_version(self, version: str):
        self.base.version = version
        return self

    def with_readonly(self, readonly: bool):
        self.base.readonly = readonly
        return self

    def with_extra(self, **kwargs):
        self.extra.update(kwargs)
        return self

    # Build methods that return specific builders
    def build_global_state(self):
        return GlobalStateBuilder(self.base, self.extra)

    def build_local_state(self):
        return LocalStateBuilder(self.base, self.extra)

    def build_view(self):
        return ViewBuilder(self.base, self.extra)

    def build_ucs(self):
        return UcsBuilder(self.base, self.extra)

    def build_group(self):
        return GroupBuilder(self.base, self.extra)

    def build_layer(self):
        return LayerBuilder(self.base, self.extra)

    def build_region(self):
        return RegionBuilder(self.base, self.extra)

    def build_standard(self):
        return StandardBuilder(self.base, self.extra)

    def build_grid_settings(self):
        return GridSettingsBuilder(self.base, self.extra)

    def build_snap_settings(self):
        return SnapSettingsBuilder(self.base, self.extra)

    def build_version_graph(self):
        return VersionGraphBuilder(self.base, self.extra)

    def build_checkpoint(self):
        return CheckpointBuilder(self.base, self.extra)

    def build_delta(self):
        return DeltaBuilder(self.base, self.extra)

    def build_external_file(self):
        return ExternalFileBuilder(self.base, self.extra)

    def build_stack_base(self):
        return StackBaseBuilder(self.base, self.extra)

# Base class for specific builders
class StateSpecificBuilder:
    def __init__(self, base: BaseStateParams, extra: dict):
        self.base = base
        self.extra = extra.copy()

# Global State Builder
class GlobalStateBuilder(StateSpecificBuilder):
    def with_view_background_color(self, color: str):
        self.extra["view_background_color"] = color
        return self

    def with_main_scope(self, scope: str):
        self.extra["main_scope"] = scope
        return self

    def with_dash_spacing_scale(self, scale: float):
        self.extra["dash_spacing_scale"] = scale
        return self

    def with_is_dash_spacing_affected_by_viewport_scale(self, affected: bool):
        self.extra["is_dash_spacing_affected_by_viewport_scale"] = affected
        return self

    def with_scope_exponent_threshold(self, threshold: int):
        self.extra["scope_exponent_threshold"] = threshold
        return self

    def with_dimensions_associative_by_default(self, associative: bool):
        self.extra["dimensions_associative_by_default"] = associative
        return self

    def with_use_annotative_scaling(self, use_annotative: bool):
        self.extra["use_annotative_scaling"] = use_annotative
        return self

    def with_linear_precision(self, precision: int):
        self.extra["linear_precision"] = precision
        return self

    def with_angular_precision(self, precision: int):
        self.extra["angular_precision"] = precision
        return self

    def build(self) -> DucGlobalState:
        return create_global_state_from_base(self.base, **self.extra)

# Local State Builder
class LocalStateBuilder(StateSpecificBuilder):
    def with_scope(self, scope: str):
        self.extra["scope"] = scope
        return self

    def with_active_standard_id(self, standard_id: str):
        self.extra["active_standard_id"] = standard_id
        return self

    def with_scroll_x(self, scroll_x: float):
        self.extra["scroll_x"] = scroll_x
        return self

    def with_scroll_y(self, scroll_y: float):
        self.extra["scroll_y"] = scroll_y
        return self

    def with_zoom(self, zoom: float):
        self.extra["zoom"] = zoom
        return self

    def with_is_binding_enabled(self, enabled: bool):
        self.extra["is_binding_enabled"] = enabled
        return self

    def with_pen_mode(self, pen_mode: bool):
        self.extra["pen_mode"] = pen_mode
        return self

    def with_view_mode_enabled(self, enabled: bool):
        self.extra["view_mode_enabled"] = enabled
        return self

    def with_objects_snap_mode_enabled(self, enabled: bool):
        self.extra["objects_snap_mode_enabled"] = enabled
        return self

    def with_grid_mode_enabled(self, enabled: bool):
        self.extra["grid_mode_enabled"] = enabled
        return self

    def with_outline_mode_enabled(self, enabled: bool):
        self.extra["outline_mode_enabled"] = enabled
        return self

    def build(self) -> DucLocalState:
        return create_local_state_from_base(self.base, **self.extra)

# View Builder
class ViewBuilder(StateSpecificBuilder):
    def with_scroll_x(self, scroll_x: float):
        self.extra["scroll_x"] = scroll_x
        return self

    def with_scroll_y(self, scroll_y: float):
        self.extra["scroll_y"] = scroll_y
        return self

    def with_zoom(self, zoom: float):
        self.extra["zoom"] = zoom
        return self

    def with_twist_angle(self, angle: float):
        self.extra["twist_angle"] = angle
        return self

    def with_center_x(self, center_x: float):
        self.extra["center_x"] = center_x
        return self

    def with_center_y(self, center_y: float):
        self.extra["center_y"] = center_y
        return self

    def with_center_point(self, center_point: DucPoint):
        self.extra["center_point"] = center_point
        return self

    def with_scope(self, scope: str):
        self.extra["scope"] = scope
        return self

    def build(self) -> DucView:
        return create_view_from_base(self.base, **self.extra)

# UCS Builder
class UcsBuilder(StateSpecificBuilder):
    def with_origin_x(self, origin_x: float):
        self.extra["origin_x"] = origin_x
        return self

    def with_origin_y(self, origin_y: float):
        self.extra["origin_y"] = origin_y
        return self

    def with_angle(self, angle: float):
        self.extra["angle"] = angle
        return self

    def build(self) -> DucUcs:
        return create_ucs_from_base(self.base, **self.extra)

# Group Builder
class GroupBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_opacity(self, opacity: float):
        self.extra["opacity"] = opacity
        return self

    def with_labeling_color(self, color: str):
        self.extra["labeling_color"] = color
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def build(self) -> DucGroup:
        return create_group_from_base(self.base, **self.extra)

# Layer Builder
class LayerBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_readonly(self, readonly: bool):
        self.extra["readonly"] = readonly
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_opacity(self, opacity: float):
        self.extra["opacity"] = opacity
        return self

    def with_labeling_color(self, color: str):
        self.extra["labeling_color"] = color
        return self

    def with_stroke_color(self, color: str):
        self.extra["stroke_color"] = color
        return self

    def with_background_color(self, color: str):
        self.extra["background_color"] = color
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def build(self) -> DucLayer:
        return create_layer_from_base(self.base, **self.extra)

# Region Builder
class RegionBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_boolean_operation(self, operation: BOOLEAN_OPERATION):
        self.extra["boolean_operation"] = operation
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_opacity(self, opacity: float):
        self.extra["opacity"] = opacity
        return self

    def with_labeling_color(self, color: str):
        self.extra["labeling_color"] = color
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def build(self) -> DucRegion:
        return create_region_from_base(self.base, **self.extra)

# Standard Builder
class StandardBuilder(StateSpecificBuilder):
    def with_validation(self, validation: StandardValidation):
        self.extra["validation"] = validation
        return self

    def with_units(self, units: StandardUnits):
        self.extra["units"] = units
        return self

    def with_styles(self, styles: StandardStyles):
        self.extra["styles"] = styles
        return self

    def with_overrides(self, overrides: StandardOverrides):
        self.extra["overrides"] = overrides
        return self

    def with_view_settings(self, view_settings: StandardViewSettings):
        self.extra["view_settings"] = view_settings
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_name(self, name: str):
        self.base.name = name
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def with_version(self, version: str):
        self.base.version = version
        return self

    def with_readonly(self, readonly: bool):
        self.base.readonly = readonly
        return self

    def build(self) -> Standard:
        return create_standard_from_base(self.base, **self.extra)

# Grid Settings Builder
class GridSettingsBuilder(StateSpecificBuilder):
    def with_grid_type(self, grid_type: GRID_TYPE):
        self.extra["grid_type"] = grid_type
        return self

    def with_x_spacing(self, spacing: float):
        self.extra["x_spacing"] = spacing
        return self

    def with_y_spacing(self, spacing: float):
        self.extra["y_spacing"] = spacing
        return self

    def with_major_line_interval(self, interval: int):
        self.extra["major_line_interval"] = interval
        return self

    def with_show_grid(self, show: bool):
        self.extra["show_grid"] = show
        return self

    def with_snap_to_grid(self, snap: bool):
        self.extra["snap_to_grid"] = snap
        return self

    def with_is_adaptive(self, adaptive: bool):
        self.extra["is_adaptive"] = adaptive
        return self

    def with_subdivisions(self, subdivisions: int):
        self.extra["subdivisions"] = subdivisions
        return self

    def with_origin_x(self, origin_x: float):
        self.extra["origin_x"] = origin_x
        return self

    def with_origin_y(self, origin_y: float):
        self.extra["origin_y"] = origin_y
        return self

    def with_rotation(self, rotation: float):
        self.extra["rotation"] = rotation
        return self

    def with_follow_ucs(self, follow: bool):
        self.extra["follow_ucs"] = follow
        return self

    def with_show_minor(self, show: bool):
        self.extra["show_minor"] = show
        return self

    def with_min_zoom(self, min_zoom: float):
        self.extra["min_zoom"] = min_zoom
        return self

    def with_max_zoom(self, max_zoom: float):
        self.extra["max_zoom"] = max_zoom
        return self

    def with_auto_hide(self, auto_hide: bool):
        self.extra["auto_hide"] = auto_hide
        return self

    def with_enable_snapping(self, enable_snapping: bool):
        self.extra["enable_snapping"] = enable_snapping
        return self

    def with_readonly(self, readonly: bool):
        self.extra["readonly"] = readonly
        return self

    def with_display_type(self, display_type: GRID_DISPLAY_TYPE):
        self.extra["display_type"] = display_type
        return self

    def with_major_color(self, color: str):
        self.extra["major_color"] = color
        return self

    def with_minor_color(self, color: str):
        self.extra["minor_color"] = color
        return self

    def with_major_style(self, style: GridStyle):
        self.extra["major_style"] = style
        return self

    def with_minor_style(self, style: GridStyle):
        self.extra["minor_style"] = style
        return self

    def with_polar_settings(self, settings: PolarGridSettings):
        self.extra["polar_settings"] = settings
        return self

    def with_isometric_settings(self, settings: IsometricGridSettings):
        self.extra["isometric_settings"] = settings
        return self

    def build(self) -> GridSettings:
        return create_grid_settings_from_base(self.base, **self.extra)

# Snap Settings Builder
class SnapSettingsBuilder(StateSpecificBuilder):
    def with_enabled(self, enabled: bool):
        self.extra["enabled"] = enabled
        return self

    def with_snap_modes(self, modes: List[SNAP_MODE]):
        self.extra["snap_modes"] = modes
        return self

    def with_object_snap_modes(self, modes: List[OBJECT_SNAP_MODE]):
        self.extra["object_snap_modes"] = modes
        return self

    def with_snap_tolerance(self, tolerance: float):
        self.extra["snap_tolerance"] = tolerance
        return self

    def with_object_snap_aperture(self, aperture: int):
        self.extra["object_snap_aperture"] = aperture
        return self

    def with_tracking_enabled(self, enabled: bool):
        self.extra["tracking_enabled"] = enabled
        return self

    def with_readonly(self, readonly: bool):
        self.extra["readonly"] = readonly
        return self

    def with_twist_angle(self, angle: float):
        self.extra["twist_angle"] = angle
        return self

    def with_is_ortho_mode_on(self, ortho: bool):
        self.extra["is_ortho_mode_on"] = ortho
        return self

    def with_is_object_snap_on(self, snap_on: bool):
        self.extra["is_object_snap_on"] = snap_on
        return self

    def with_show_tracking_lines(self, show: bool):
        self.extra["show_tracking_lines"] = show
        return self

    def with_construction_snap_enabled(self, enabled: bool):
        self.extra["construction_snap_enabled"] = enabled
        return self

    def with_incremental_distance(self, distance: float):
        self.extra["incremental_distance"] = distance
        return self

    def with_magnetic_strength(self, strength: float):
        self.extra["magnetic_strength"] = strength
        return self

    def with_snap_mode(self, mode: SNAP_MODE):
        self.extra["snap_mode"] = mode
        return self

    def with_active_object_snap_modes(self, modes: List[OBJECT_SNAP_MODE]):
        self.extra["active_object_snap_modes"] = modes
        return self

    def with_snap_priority(self, priority: List[OBJECT_SNAP_MODE]):
        self.extra["snap_priority"] = priority
        return self

    def with_dynamic_snap(self, dynamic_snap: DynamicSnapSettings):
        self.extra["dynamic_snap"] = dynamic_snap
        return self

    def with_snap_markers(self, snap_markers: SnapMarkerSettings):
        self.extra["snap_markers"] = snap_markers
        return self

    def with_tracking_line_style(self, style: TrackingLineStyle):
        self.extra["tracking_line_style"] = style
        return self

    def with_temporary_overrides(self, overrides: List[SnapOverride]):
        self.extra["temporary_overrides"] = overrides
        return self

    def with_layer_snap_filters(self, filters: LayerSnapFilters):
        self.extra["layer_snap_filters"] = filters
        return self

    def with_element_type_filters(self, filters: List[str]):
        self.extra["element_type_filters"] = filters
        return self

    def with_snap_to_grid_intersections(self, snap: bool):
        self.extra["snap_to_grid_intersections"] = snap
        return self

    def with_polar_tracking(self, settings: PolarTrackingSettings):
        self.extra["polar_tracking"] = settings
        return self

    def build(self) -> SnapSettings:
        return create_snap_settings_from_base(self.base, **self.extra)

# Version Graph Builder
class VersionGraphBuilder(StateSpecificBuilder):
    def with_checkpoints(self, checkpoints: List[Checkpoint]):
        self.extra["checkpoints"] = checkpoints
        return self

    def with_deltas(self, deltas: List[Delta]):
        self.extra["deltas"] = deltas
        return self

    def with_pruning_level(self, level: PRUNING_LEVEL):
        self.extra["pruning_level"] = level
        return self

    def with_user_checkpoint_version_id(self, version_id: str):
        self.extra["user_checkpoint_version_id"] = version_id
        return self

    def with_latest_version_id(self, version_id: str):
        self.extra["latest_version_id"] = version_id
        return self

    def build(self) -> VersionGraph:
        return create_version_graph_from_base(self.base, **self.extra)

# Checkpoint Builder
class CheckpointBuilder(StateSpecificBuilder):
    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_parent_id(self, parent_id: str):
        self.extra["parent_id"] = parent_id
        return self

    def with_is_manual_save(self, is_manual: bool):
        self.extra["is_manual_save"] = is_manual
        return self

    def with_data(self, data: bytes):
        self.extra["data"] = data
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def build(self) -> Checkpoint:
        return create_checkpoint_from_base(self.base, **self.extra)

# Delta Builder
class DeltaBuilder(StateSpecificBuilder):
    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_patch(self, patch: List[JSONPatchOperation]):
        self.extra["patch"] = patch
        return self

    def with_parent_id(self, parent_id: str):
        self.extra["parent_id"] = parent_id
        return self

    def with_is_manual_save(self, is_manual: bool):
        self.extra["is_manual_save"] = is_manual
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def build(self) -> Delta:
        return create_delta_from_base(self.base, **self.extra)

# External File Builder
class ExternalFileBuilder(StateSpecificBuilder):
    def with_key(self, key: str):
        self.extra["key"] = key
        return self

    def with_mime_type(self, mime_type: str):
        self.extra["mime_type"] = mime_type
        return self

    def with_data(self, data: bytes):
        self.extra["data"] = data
        return self

    def with_last_retrieved(self, last_retrieved: int):
        self.extra["last_retrieved"] = last_retrieved
        return self

    def build(self) -> DucExternalFileEntry:
        return create_external_file_from_base(self.base, **self.extra)

# Stack Base Builder (newly added)
class StackBaseBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_styles(self, styles: DucStackLikeStyles):
        self.extra["styles"] = styles
        return self

    def build(self) -> DucStackBase:
        return create_stack_base_from_base(self.base, **self.extra)

# Create functions for all state types
def create_global_state_from_base(base: BaseStateParams, **kwargs) -> DucGlobalState:
    display_precision = DisplayPrecision(
        linear=kwargs.get('linear_precision', 2),
        angular=kwargs.get('angular_precision', 2)
    )
    return DucGlobalState(
        view_background_color=kwargs.get('view_background_color', "#FFFFFF"),
        main_scope=kwargs.get('main_scope', "mm"),
        dash_spacing_scale=kwargs.get('dash_spacing_scale', 1.0),
        is_dash_spacing_affected_by_viewport_scale=kwargs.get('is_dash_spacing_affected_by_viewport_scale', False),
        scope_exponent_threshold=kwargs.get('scope_exponent_threshold', 6),
        dimensions_associative_by_default=kwargs.get('dimensions_associative_by_default', True),
        use_annotative_scaling=kwargs.get('use_annotative_scaling', False),
        display_precision=display_precision,
        name=base.name
    )

def create_local_state_from_base(base: BaseStateParams, **kwargs) -> DucLocalState:
    return DucLocalState(
        scope=kwargs.get('scope', "mm"),
        active_standard_id=kwargs.get('active_standard_id', "default"),
        scroll_x=kwargs.get('scroll_x', 0.0),
        scroll_y=kwargs.get('scroll_y', 0.0),
        zoom=kwargs.get('zoom', 1.0),
        is_binding_enabled=kwargs.get('is_binding_enabled', True),
        pen_mode=kwargs.get('pen_mode', False),
        view_mode_enabled=kwargs.get('view_mode_enabled', False),
        objects_snap_mode_enabled=kwargs.get('objects_snap_mode_enabled', True),
        grid_mode_enabled=kwargs.get('grid_mode_enabled', True),
        outline_mode_enabled=kwargs.get('outline_mode_enabled', False),
        active_grid_settings=kwargs.get('active_grid_settings', None),
        active_snap_settings=kwargs.get('active_snap_settings', None),
        current_item_stroke=kwargs.get('current_item_stroke', None),
        current_item_background=kwargs.get('current_item_background', None),
        current_item_opacity=kwargs.get('current_item_opacity', None),
        current_item_font_family=kwargs.get('current_item_font_family', None),
        current_item_font_size=kwargs.get('current_item_font_size', None),
        current_item_text_align=kwargs.get('current_item_text_align', None),
        current_item_roundness=kwargs.get('current_item_roundness', None),
        current_item_start_line_head=kwargs.get('current_item_start_line_head', None),
        current_item_end_line_head=kwargs.get('current_item_end_line_head', None)
    )

def create_view_from_base(base: BaseStateParams, **kwargs) -> DucView:
    center_point = kwargs.get('center_point')
    if center_point is None:
        center_point = DucPoint(x=kwargs.get('center_x', 0.0), y=kwargs.get('center_y', 0.0), mirroring=None)
    return DucView(
        scroll_x=kwargs.get('scroll_x', 0.0),
        scroll_y=kwargs.get('scroll_y', 0.0),
        zoom=kwargs.get('zoom', 1.0),
        twist_angle=kwargs.get('twist_angle', 0.0),
        center_point=center_point,
        scope=kwargs.get('scope', "mm")
    )

def create_ucs_from_base(base: BaseStateParams, **kwargs) -> DucUcs:
    origin = GeometricPoint(x=kwargs.get('origin_x', 0.0), y=kwargs.get('origin_y', 0.0))
    return DucUcs(
        origin=origin,
        angle=kwargs.get('angle', 0.0)
    )

def create_group_from_base(base: BaseStateParams, **kwargs) -> DucGroup:
    if base.id is None:
        base.id = generate_random_id()
    
    stack_base = DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=DucStackLikeStyles(
            opacity=kwargs.get('opacity', 1.0),
            labeling_color=kwargs.get('labeling_color', "#000000")
        ),
        description=base.description
    )
    
    return DucGroup(
        id=base.id,
        stack_base=stack_base
    )

def create_layer_from_base(base: BaseStateParams, **kwargs) -> DucLayer:
    if base.id is None:
        base.id = generate_random_id()
    
    stack_base = DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=DucStackLikeStyles(
            opacity=kwargs.get('opacity', 1.0),
            labeling_color=kwargs.get('labeling_color', "#000000")
        ),
        description=base.description
    )
    
    # Create layer overrides using style builders
    from .style_builders import create_solid_content, create_background, create_stroke
    
    stroke_content = create_solid_content(
        color=kwargs.get('stroke_color', "#000000"),
        opacity=1.0,
        visible=True
    )
    
    background_content = create_solid_content(
        color=kwargs.get('background_color', "#FFFFFF"),
        opacity=1.0,
        visible=True
    )
    
    stroke = create_stroke(
        content=stroke_content,
        width=1.0
    )
    
    background = create_background(background_content)
    
    overrides = DucLayerOverrides(
        stroke=stroke,
        background=background
    )
    
    return DucLayer(
        id=base.id,
        stack_base=stack_base,
        readonly=kwargs.get('readonly', False),
        overrides=overrides
    )

def create_region_from_base(base: BaseStateParams, **kwargs) -> DucRegion:
    if base.id is None:
        base.id = generate_random_id()
    
    stack_base = DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=DucStackLikeStyles(
            opacity=kwargs.get('opacity', 1.0),
            labeling_color=kwargs.get('labeling_color', "#000000")
        ),
        description=base.description
    )
    
    return DucRegion(
        id=base.id,
        stack_base=stack_base,
        boolean_operation=kwargs.get('boolean_operation', BOOLEAN_OPERATION.UNION)
    )

def create_standard_from_base(base: BaseStateParams, **kwargs) -> Standard:
    standard_overrides = kwargs.get('overrides')
    if standard_overrides is None:
        unit_precision = kwargs.get('unit_precision')
        if unit_precision is None:
            unit_precision = UnitPrecision(linear=2, angular=2, area=2, volume=2)
        standard_overrides = StandardOverrides(
            unit_precision=unit_precision,
            main_scope=kwargs.get('main_scope', ""),
            elements_stroke_width_override=None,
            common_style_id=None,
            stack_like_style_id=None,
            text_style_id=None,
            dimension_style_id=None,
            leader_style_id=None,
            feature_control_frame_style_id=None,
            table_style_id=None,
            doc_style_id=None,
            viewport_style_id=None,
            plot_style_id=None,
            hatch_style_id=None,
            active_grid_settings_id=None,
            active_snap_settings_id=None,
            dash_line_override=None
        )
    return Standard(
        identifier=create_identifier(base.id or generate_random_id(), base.name, base.description),
        version=base.version,
        readonly=base.readonly,
        view_settings=kwargs.get('view_settings'),
        overrides=standard_overrides,
        styles=kwargs.get('styles'),
        units=kwargs.get('units'),
        validation=kwargs.get('validation')
    )

def create_grid_settings_from_base(base: BaseStateParams, **kwargs) -> GridSettings:
    return GridSettings(
        is_adaptive=kwargs.get('is_adaptive', False),
        x_spacing=kwargs.get('x_spacing', 10.0),
        y_spacing=kwargs.get('y_spacing', 10.0),
        subdivisions=kwargs.get('subdivisions', 10),
        origin=GeometricPoint(x=kwargs.get('origin_x', 0.0), y=kwargs.get('origin_y', 0.0)),
        rotation=kwargs.get('rotation', 0.0),
        follow_ucs=kwargs.get('follow_ucs', True),
        major_style=kwargs.get('major_style', GridStyle(color=kwargs.get('major_color', "#808080"), opacity=1.0, dash_pattern=None)),
        minor_style=kwargs.get('minor_style', GridStyle(color=kwargs.get('minor_color', "#C0C0C0"), opacity=1.0, dash_pattern=None)),
        show_minor=kwargs.get('show_minor', True),
        min_zoom=kwargs.get('min_zoom', 0.1),
        max_zoom=kwargs.get('max_zoom', 100.0),
        auto_hide=kwargs.get('auto_hide', False),
        enable_snapping=kwargs.get('enable_snapping', False),
        readonly=base.readonly,
        type=kwargs.get('grid_type', kwargs.get('type', GRID_TYPE.RECTANGULAR)),
        display_type=kwargs.get('display_type', GRID_DISPLAY_TYPE.LINES),
        polar_settings=kwargs.get('polar_settings'),
        isometric_settings=kwargs.get('isometric_settings')
    )

def create_snap_settings_from_base(base: BaseStateParams, **kwargs) -> SnapSettings:
    return SnapSettings(
        active_object_snap_modes=kwargs.get('active_object_snap_modes', []),
        snap_tolerance=kwargs.get('snap_tolerance', 10.0),
        object_snap_aperture=kwargs.get('object_snap_aperture', 0),
        readonly=kwargs.get('readonly', base.readonly),
        twist_angle=kwargs.get('twist_angle', 0.0),
        is_ortho_mode_on=kwargs.get('is_ortho_mode_on', False),
        is_object_snap_on=kwargs.get('is_object_snap_on', True),
        show_tracking_lines=kwargs.get('show_tracking_lines', True),
        dynamic_snap=kwargs.get('dynamic_snap', DynamicSnapSettings(enabled_during_drag=False, enabled_during_rotation=False, enabled_during_scale=False)),
        snap_markers=kwargs.get('snap_markers', SnapMarkerSettings(enabled=False, size=0, styles=[], duration=None)),
        construction_snap_enabled=kwargs.get('construction_snap_enabled', True),
        tracking_line_style=kwargs.get('tracking_line_style', None),
        temporary_overrides=kwargs.get('temporary_overrides', None),
        incremental_distance=kwargs.get('incremental_distance', None),
        magnetic_strength=kwargs.get('magnetic_strength', None),
        layer_snap_filters=kwargs.get('layer_snap_filters', None),
        element_type_filters=kwargs.get('element_type_filters', None),
        snap_mode=kwargs.get('snap_mode', SNAP_MODE.RUNNING),
        snap_to_grid_intersections=kwargs.get('snap_to_grid_intersections', None),
        snap_priority=kwargs.get('snap_priority', []),
        polar_tracking=kwargs.get('polar_tracking', PolarTrackingSettings(enabled=False, angles=[], track_from_last_point=False, show_polar_coordinates=False, increment_angle=None))
    )

def create_version_graph_from_base(base: BaseStateParams, **kwargs) -> VersionGraph:
    metadata = VersionGraphMetadata(
        last_pruned=int(time.time() * 1000),
        total_size=0,
        pruning_level=kwargs.get('pruning_level', PRUNING_LEVEL.CONSERVATIVE)
    )
    return VersionGraph(
        checkpoints=kwargs.get('checkpoints', []),
        deltas=kwargs.get('deltas', []),
        metadata=metadata,
        user_checkpoint_version_id=kwargs.get('user_checkpoint_version_id', ""),
        latest_version_id=kwargs.get('latest_version_id', "")
    )

def create_checkpoint_from_base(base: BaseStateParams, **kwargs) -> Checkpoint:
    return Checkpoint(
        id=base.id or generate_random_id(),
        timestamp=int(time.time() * 1000),
        is_manual_save=kwargs.get('is_manual_save', False),
        parent_id=kwargs.get('parent_id'),
        description=base.description,
        user_id=kwargs.get('user_id'),
        type=kwargs.get('type', "checkpoint"),
        data=kwargs.get('data', b""),
        size_bytes=len(kwargs.get('data', b""))
    )

def create_delta_from_base(base: BaseStateParams, **kwargs) -> Delta:
    return Delta(
        id=base.id or generate_random_id(),
        timestamp=int(time.time() * 1000),
        is_manual_save=kwargs.get('is_manual_save', False),
        parent_id=kwargs.get('parent_id'),
        description=base.description,
        user_id=kwargs.get('user_id'),
        type=kwargs.get('type', "delta"),
        patch=kwargs.get('patch', [])
    )

def create_external_file_from_base(base: BaseStateParams, **kwargs) -> DucExternalFileEntry:
    file_data = DucExternalFileData(
        mime_type=kwargs.get('mime_type', ""),
        id=base.id or generate_random_id(),
        data=kwargs.get('data', b""),
        created=int(time.time() * 1000),
        last_retrieved=kwargs.get('last_retrieved')
    )
    return DucExternalFileEntry(
        key=kwargs.get('key', ""),
        value=file_data
    )

# Stack Base Builder (newly added)
def create_stack_base_from_base(base: BaseStateParams, **kwargs) -> DucStackBase:
    return DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=kwargs.get('styles', DucStackLikeStyles(opacity=1.0, labeling_color="#000000")),
        description=base.description
    )

# Additional helper functions from standard_builders.py
def create_identifier(id: str, name: str, description: str = "") -> Identifier:
    return Identifier(id=id, name=name, description=description)

def create_standard_overrides(**kwargs) -> StandardOverrides:
    return StandardOverrides(
        unit_precision=kwargs.get('unit_precision'),
        main_scope=kwargs.get('main_scope'),
        elements_stroke_width_override=kwargs.get('elements_stroke_width_override'),
        common_style_id=kwargs.get('common_style_id'),
        stack_like_style_id=kwargs.get('stack_like_style_id'),
        text_style_id=kwargs.get('text_style_id'),
        dimension_style_id=kwargs.get('dimension_style_id'),
        leader_style_id=kwargs.get('leader_style_id'),
        feature_control_frame_style_id=kwargs.get('feature_control_frame_style_id'),
        table_style_id=kwargs.get('table_style_id'),
        doc_style_id=kwargs.get('doc_style_id'),
        viewport_style_id=kwargs.get('viewport_style_id'),
        plot_style_id=kwargs.get('plot_style_id'),
        hatch_style_id=kwargs.get('hatch_style_id'),
        active_grid_settings_id=kwargs.get('active_grid_settings_id'),
        active_snap_settings_id=kwargs.get('active_snap_settings_id'),
        dash_line_override=kwargs.get('dash_line_override')
    )

def create_standard_view_settings(**kwargs) -> StandardViewSettings:
    return StandardViewSettings(
        views=kwargs.get('views', []),
        ucs=kwargs.get('ucs', []),
        grid_settings=kwargs.get('grid_settings', []),
        snap_settings=kwargs.get('snap_settings', [])
    )

def create_standard_styles(**kwargs) -> StandardStyles:
    return StandardStyles(
        common_styles=kwargs.get('common_styles', []),
        stack_like_styles=kwargs.get('stack_like_styles', []),
        text_styles=kwargs.get('text_styles', []),
        dimension_styles=kwargs.get('dimension_styles', []),
        leader_styles=kwargs.get('leader_styles', []),
        feature_control_frame_styles=kwargs.get('feature_control_frame_styles', []),
        table_styles=kwargs.get('table_styles', []),
        doc_styles=kwargs.get('doc_styles', []),
        viewport_styles=kwargs.get('viewport_styles', []),
        hatch_styles=kwargs.get('hatch_styles', []),
        xray_styles=kwargs.get('xray_styles', [])
    )

def create_standard_units(**kwargs) -> StandardUnits:
    return StandardUnits(
        primary_units=kwargs.get('primary_units'),
        alternate_units=kwargs.get('alternate_units')
    )

def create_standard_validation(**kwargs) -> StandardValidation:
    return StandardValidation(
        dimension_rules=kwargs.get('dimension_rules'),
        layer_rules=kwargs.get('layer_rules')
    )

def create_identified_grid_settings(
    id: str,
    name: str,
    description: str,
    settings: GridSettings
) -> IdentifiedGridSettings:
    """Create an identified grid settings object."""
    identifier = create_identifier(id, name, description)
    return IdentifiedGridSettings(
        id=identifier,
        settings=settings
    )

def create_identified_snap_settings(
    id: str,
    name: str,
    description: str,
    settings: SnapSettings
) -> IdentifiedSnapSettings:
    """Create an identified snap settings object."""
    identifier = create_identifier(id, name, description)
    return IdentifiedSnapSettings(
        id=identifier,
        settings=settings
    )

def create_polar_grid_settings(**kwargs) -> PolarGridSettings:
    return PolarGridSettings(
        radial_divisions=kwargs.get('radial_divisions'),
        radial_spacing=kwargs.get('radial_spacing'),
        show_labels=kwargs.get('show_labels', False) # Default to False if not provided
    )

def create_isometric_grid_settings(**kwargs) -> IsometricGridSettings:
    return IsometricGridSettings(**kwargs)

def create_snap_override(**kwargs) -> SnapOverride:
    return SnapOverride(**kwargs)

def create_dynamic_snap_settings(**kwargs) -> DynamicSnapSettings:
    return DynamicSnapSettings(**kwargs)

def create_polar_tracking_settings(
    enabled: bool = False,
    angles: Optional[List[float]] = None,
    increment_angle: Optional[float] = None,
    track_from_last_point: bool = False,
    show_polar_coordinates: bool = False
) -> PolarTrackingSettings:
    """Create polar tracking settings."""
    if angles is None:
        angles = []
    return PolarTrackingSettings(
        enabled=enabled,
        angles=angles,
        increment_angle=increment_angle,
        track_from_last_point=track_from_last_point,
        show_polar_coordinates=show_polar_coordinates
    )

def create_tracking_line_style(**kwargs) -> TrackingLineStyle:
    return TrackingLineStyle(**kwargs)

def create_layer_snap_filters(**kwargs) -> LayerSnapFilters:
    return LayerSnapFilters(**kwargs)

def create_snap_marker_style(**kwargs) -> SnapMarkerStyle:
    return SnapMarkerStyle(**kwargs)

def create_snap_marker_style_entry(**kwargs) -> SnapMarkerStyleEntry:
    return SnapMarkerStyleEntry(**kwargs)

def create_snap_marker_settings(**kwargs) -> SnapMarkerSettings:
    return SnapMarkerSettings(**kwargs)

def create_linear_unit_system(**kwargs) -> LinearUnitSystem:
    return LinearUnitSystem(**kwargs)

def create_angular_unit_system(**kwargs) -> AngularUnitSystem:
    return AngularUnitSystem(**kwargs)

def create_alternate_units(**kwargs) -> AlternateUnits:
    return AlternateUnits(**kwargs)

def create_primary_units(**kwargs) -> PrimaryUnits:
    return PrimaryUnits(**kwargs)

def create_dimension_validation_rules(**kwargs) -> DimensionValidationRules:
    return DimensionValidationRules(**kwargs)

def create_layer_validation_rules(**kwargs) -> LayerValidationRules:
    return LayerValidationRules(**kwargs)

def create_json_patch_operation(
    op: str,
    path: str,
    value: Any = None
) -> JSONPatchOperation:
    """Create a JSON Patch operation for version control deltas."""
    return JSONPatchOperation(
        op=op,
        path=path,
        from_path=None,
        value=value
    )

def create_leader_text_content(text: str) -> LeaderTextBlockContent:
    """Create a leader text content for leader elements."""
    return LeaderTextBlockContent(text=text)

def create_leader_block_content(block_id: str, attribute_values: Optional[List[StringValueEntry]] = None, element_overrides: Optional[List[StringValueEntry]] = None) -> LeaderBlockContent:
    """Create a leader block content for leader elements."""
    return LeaderBlockContent(
        block_id=block_id,
        attribute_values=attribute_values,
        element_overrides=element_overrides
    )

def create_leader_content(content: Union[LeaderTextBlockContent, LeaderBlockContent]) -> LeaderContent:
    """Create a leader content wrapper for leader elements."""
    return LeaderContent(content=content)

def create_tolerance_clause(
    value: str,
    feature_modifiers: Optional[List[FEATURE_MODIFIER]] = None,
    zone_type: Optional[TOLERANCE_ZONE_TYPE] = None,
    material_condition: Optional[MATERIAL_CONDITION] = None
) -> ToleranceClause:
    """Create a tolerance clause for feature control frames."""
    return ToleranceClause(
        value=value,
        feature_modifiers=feature_modifiers or [],
        zone_type=zone_type,
        material_condition=material_condition
    )

def create_datum_reference(
    letters: str,
    modifier: Optional[MATERIAL_CONDITION] = None
) -> DatumReference:
    """Create a datum reference for feature control frames."""
    return DatumReference(
        letters=letters,
        modifier=modifier
    )

def create_feature_control_frame_segment(
    symbol: GDT_SYMBOL,
    tolerance: ToleranceClause,
    datums: List[DatumReference]
) -> FeatureControlFrameSegment:
    """Create a feature control frame segment."""
    return FeatureControlFrameSegment(
        tolerance=tolerance,
        datums=datums,
        symbol=symbol
    )

def create_block_attribute_definition_entry(
    key: str,
    tag: str,
    default_value: str,
    is_constant: bool = False,
    prompt: Optional[str] = None
) -> DucBlockAttributeDefinitionEntry:
    """Create a block attribute definition entry."""
    definition = DucBlockAttributeDefinition(
        tag=tag,
        default_value=default_value,
        is_constant=is_constant,
        prompt=prompt
    )
    return DucBlockAttributeDefinitionEntry(
        key=key,
        value=definition
    )

def create_block(
    id: str,
    label: str,
    elements: List[ElementWrapper],
    attribute_definitions: Optional[List[DucBlockAttributeDefinitionEntry]] = None,
    description: Optional[str] = None
) -> DucBlock:
    """Create a block with elements and attribute definitions."""
    return DucBlock(
        id=id,
        label=label,
        version=1,
        elements=elements,
        attribute_definitions=attribute_definitions or [],
        description=description
    )

def create_string_value_entry(key: str, value: str) -> StringValueEntry:
    """Create a string value entry for block attributes."""
    return StringValueEntry(key=key, value=value)

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
    """Create a complete standard with all components."""
    identifier = Identifier(id=id, name=name, description=description)
    # Ensure overrides is always an instance of StandardOverrides
    if overrides is None:
        unit_precision = None
        if unit_precision is None:
            unit_precision = UnitPrecision(linear=2, angular=2, area=2, volume=2)
        overrides = StandardOverrides(
            unit_precision=unit_precision,
            main_scope="",
            elements_stroke_width_override=None,
            common_style_id=None,
            stack_like_style_id=None,
            text_style_id=None,
            dimension_style_id=None,
            leader_style_id=None,
            feature_control_frame_style_id=None,
            table_style_id=None,
            doc_style_id=None,
            viewport_style_id=None,
            plot_style_id=None,
            hatch_style_id=None,
            active_grid_settings_id=None,
            active_snap_settings_id=None,
            dash_line_override=None
        )
    if styles is None:
        styles = StandardStyles(
            common_styles=[],
            stack_like_styles=[],
            text_styles=[],
            dimension_styles=[],
            leader_styles=[],
            feature_control_frame_styles=[],
            table_styles=[],
            doc_styles=[],
            viewport_styles=[],
            hatch_styles=[],
            xray_styles=[]
        )
    return Standard(
        identifier=identifier,
        version=version,
        readonly=readonly,
        units=units,
        validation=validation,
        overrides=overrides,
        styles=styles,
        view_settings=view_settings
    )

