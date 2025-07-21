"""
State serialization functions for duc.fbs schema.
This module provides serialization for global and local state structures.
"""

import flatbuffers
from typing import List, Optional

# Import dataclasses from comprehensive classes
from ..classes.DataStateClass import (
    DucGlobalState, DucLocalState, DucBlock, DucGroup, DucRegion, DucLayer
)
from ..classes.StandardsClass import Standard, StandardViewSettings, StandardValidation, GridSettings, SnapSettings, DimensionValidationRules, LayerValidationRules, IdentifiedGridSettings, IdentifiedSnapSettings, IdentifiedUcs, IdentifiedView, GridStyle, SnapOverride, DynamicSnapSettings, PolarTrackingSettings, TrackingLineStyle, LayerSnapFilters, SnapMarkerStyle, SnapMarkerStyleEntry, SnapMarkerSettings, DucUcs, DucView, PolarGridSettings, IsometricGridSettings
from ..classes.ElementsClass import ElementStroke, ElementBackground, GeometricPoint

# Import FlatBuffers generated classes
from ..Duc.DucGlobalState import (
    DucGlobalStateStart, DucGlobalStateEnd,
    DucGlobalStateAddName, DucGlobalStateAddViewBackgroundColor,
    DucGlobalStateAddMainScope, DucGlobalStateAddDashSpacingScale,
    DucGlobalStateAddIsDashSpacingAffectedByViewportScale,
    DucGlobalStateAddScopeExponentThreshold,
    DucGlobalStateAddDimensionsAssociativeByDefault,
    DucGlobalStateAddUseAnnotativeScaling,
    DucGlobalStateAddDisplayPrecisionLinear,
    DucGlobalStateAddDisplayPrecisionAngular
)
from ..Duc.DucLocalState import (
    DucLocalStateStart, DucLocalStateEnd,
    DucLocalStateAddScope, DucLocalStateAddActiveStandardId,
    DucLocalStateAddScrollX, DucLocalStateAddScrollY, DucLocalStateAddZoom,
    DucLocalStateAddActiveGridSettings, DucLocalStateAddActiveSnapSettings,
    DucLocalStateAddIsBindingEnabled, DucLocalStateAddCurrentItemStroke,
    DucLocalStateAddCurrentItemBackground, DucLocalStateAddCurrentItemOpacity,
    DucLocalStateAddCurrentItemFontFamily,
    DucLocalStateStartActiveGridSettingsVector
)
from ..Duc.DucBlock import (
    DucBlockStart, DucBlockEnd,
    DucBlockAddId, DucBlockAddLabel, DucBlockAddDescription,
    DucBlockAddVersion, DucBlockAddElements, DucBlockAddAttributeDefinitions,
    DucBlockStartElementsVector, DucBlockStartAttributeDefinitionsVector
)
from ..Duc.DucGroup import (
    DucGroupStart, DucGroupEnd,
    DucGroupAddId, DucGroupAddStackBase
)
from ..Duc.DucRegion import (
    DucRegionStart, DucRegionEnd,
    DucRegionAddId, DucRegionAddStackBase, DucRegionAddBooleanOperation
)
from ..Duc.DucLayer import (
    DucLayerStart, DucLayerEnd,
    DucLayerAddId, DucLayerAddStackBase, DucLayerAddReadonly, DucLayerAddOverrides
)
from ..Duc.StandardViewSettings import (
    StandardViewSettingsStart, StandardViewSettingsEnd,
    StandardViewSettingsAddViews, StandardViewSettingsAddUcs,
    StandardViewSettingsAddGridSettings, StandardViewSettingsAddSnapSettings,
    StandardViewSettingsStartViewsVector, StandardViewSettingsStartUcsVector,
    StandardViewSettingsStartGridSettingsVector, StandardViewSettingsStartSnapSettingsVector
)
from ..Duc.GridSettings import (
    GridSettingsStart, GridSettingsEnd,
    GridSettingsAddType, GridSettingsAddReadonly, GridSettingsAddDisplayType,
    GridSettingsAddIsAdaptive, GridSettingsAddXSpacing, GridSettingsAddYSpacing,
    GridSettingsAddSubdivisions, GridSettingsAddOrigin, GridSettingsAddRotation,
    GridSettingsAddFollowUcs, GridSettingsAddMajorStyle, GridSettingsAddMinorStyle,
    GridSettingsAddShowMinor, GridSettingsAddMinZoom, GridSettingsAddMaxZoom,
    GridSettingsAddAutoHide, GridSettingsAddPolarSettings, GridSettingsAddIsometricSettings,
    GridSettingsAddEnableSnapping
)
from ..Duc.SnapSettings import (
    SnapSettingsStart, SnapSettingsEnd,
    SnapSettingsAddReadonly, SnapSettingsAddTwistAngle, SnapSettingsAddSnapTolerance,
    SnapSettingsAddObjectSnapAperture, SnapSettingsAddIsOrthoModeOn, SnapSettingsAddPolarTracking,
    SnapSettingsAddIsObjectSnapOn, SnapSettingsAddActiveObjectSnapModes,
    SnapSettingsAddSnapPriority, SnapSettingsAddShowTrackingLines,
    SnapSettingsAddTrackingLineStyle, SnapSettingsAddDynamicSnap,
    SnapSettingsAddTemporaryOverrides, SnapSettingsAddIncrementalDistance,
    SnapSettingsAddMagneticStrength, SnapSettingsAddLayerSnapFilters,
    SnapSettingsAddElementTypeFilters, SnapSettingsAddSnapMode,
    SnapSettingsAddSnapMarkers, SnapSettingsAddConstructionSnapEnabled,
    SnapSettingsAddSnapToGridIntersections, SnapSettingsStartActiveObjectSnapModesVector,
    SnapSettingsStartSnapPriorityVector, SnapSettingsStartTemporaryOverridesVector,
    SnapSettingsStartElementTypeFiltersVector
)
from ..Duc.StandardValidation import (
    StandardValidationStart, StandardValidationEnd,
    StandardValidationAddDimensionRules, StandardValidationAddLayerRules
)
from ..Duc.DimensionValidationRules import (
    DimensionValidationRulesStart, DimensionValidationRulesEnd,
    DimensionValidationRulesAddMinTextHeight, DimensionValidationRulesAddMaxTextHeight,
    DimensionValidationRulesAddAllowedPrecisions, DimensionValidationRulesStartAllowedPrecisionsVector
)
from ..Duc.LayerValidationRules import (
    LayerValidationRulesStart, LayerValidationRulesEnd,
    LayerValidationRulesAddProhibitedLayerNames, LayerValidationRulesStartProhibitedLayerNamesVector
)
from ..Duc.IdentifiedGridSettings import (
    IdentifiedGridSettingsStart, IdentifiedGridSettingsEnd,
    IdentifiedGridSettingsAddId, IdentifiedGridSettingsAddSettings
)
from ..Duc.IdentifiedSnapSettings import (
    IdentifiedSnapSettingsStart, IdentifiedSnapSettingsEnd,
    IdentifiedSnapSettingsAddId, IdentifiedSnapSettingsAddSettings
)
from ..Duc.IdentifiedUcs import (
    IdentifiedUcsStart, IdentifiedUcsEnd,
    IdentifiedUcsAddId, IdentifiedUcsAddUcs
)
from ..Duc.IdentifiedView import (
    IdentifiedViewStart, IdentifiedViewEnd,
    IdentifiedViewAddId, IdentifiedViewAddView
)
from ..Duc.DucView import (
    DucViewStart, DucViewEnd,
    DucViewAddScrollX, DucViewAddScrollY, DucViewAddZoom,
    DucViewAddTwistAngle, DucViewAddCenterPoint, DucViewAddScope
)
from ..Duc.DucUcs import (
    DucUcsStart, DucUcsEnd,
    DucUcsAddOrigin, DucUcsAddAngle
)
from ..Duc.PolarGridSettings import (
    PolarGridSettingsStart, PolarGridSettingsEnd,
    PolarGridSettingsAddRadialDivisions, PolarGridSettingsAddRadialSpacing,
    PolarGridSettingsAddShowLabels
)
from ..Duc.IsometricGridSettings import (
    IsometricGridSettingsStart, IsometricGridSettingsEnd,
    IsometricGridSettingsAddLeftAngle, IsometricGridSettingsAddRightAngle
)
from ..Duc.GridStyle import (
    GridStyleStart, GridStyleEnd,
    GridStyleAddColor, GridStyleAddOpacity, GridStyleAddDashPattern,
    GridStyleStartDashPatternVector
)
from ..Duc.SnapOverride import (
    SnapOverrideStart, SnapOverrideEnd,
    SnapOverrideAddKey, SnapOverrideAddBehavior
)
from ..Duc.DynamicSnapSettings import (
    DynamicSnapSettingsStart, DynamicSnapSettingsEnd,
    DynamicSnapSettingsAddEnabledDuringDrag, DynamicSnapSettingsAddEnabledDuringRotation,
    DynamicSnapSettingsAddEnabledDuringScale
)
from ..Duc.PolarTrackingSettings import (
    PolarTrackingSettingsStart, PolarTrackingSettingsEnd,
    PolarTrackingSettingsAddEnabled, PolarTrackingSettingsAddAngles,
    PolarTrackingSettingsAddIncrementAngle, PolarTrackingSettingsAddTrackFromLastPoint,
    PolarTrackingSettingsAddShowPolarCoordinates, PolarTrackingSettingsStartAnglesVector
)
from ..Duc.TrackingLineStyle import (
    TrackingLineStyleStart, TrackingLineStyleEnd,
    TrackingLineStyleAddColor, TrackingLineStyleAddOpacity, TrackingLineStyleAddDashPattern,
    TrackingLineStyleStartDashPatternVector
)
from ..Duc.LayerSnapFilters import (
    LayerSnapFiltersStart, LayerSnapFiltersEnd,
    LayerSnapFiltersAddIncludeLayers, LayerSnapFiltersAddExcludeLayers,
    LayerSnapFiltersStartIncludeLayersVector, LayerSnapFiltersStartExcludeLayersVector
)
from ..Duc.SnapMarkerStyle import (
    SnapMarkerStyleStart, SnapMarkerStyleEnd,
    SnapMarkerStyleAddShape, SnapMarkerStyleAddColor
)
from ..Duc.SnapMarkerStyleEntry import (
    SnapMarkerStyleEntryStart, SnapMarkerStyleEntryEnd,
    SnapMarkerStyleEntryAddKey, SnapMarkerStyleEntryAddValue
)
from ..Duc.SnapMarkerSettings import (
    SnapMarkerSettingsStart, SnapMarkerSettingsEnd,
    SnapMarkerSettingsAddEnabled, SnapMarkerSettingsAddSize, SnapMarkerSettingsAddDuration,
    SnapMarkerSettingsAddStyles, SnapMarkerSettingsStartStylesVector
)


# Import from base elements and standards helpers
from .serialize_base_elements import (
    serialize_fbs_identifier, serialize_fbs_element_stroke, serialize_fbs_element_background,
    serialize_fbs_geometric_point, serialize_fbs_stack_base
)


def serialize_fbs_duc_global_state(builder: flatbuffers.Builder, global_state: DucGlobalState) -> int:
    """Serialize DucGlobalState to FlatBuffers."""
    if global_state is None:
        return 0
    name_offset = builder.CreateString(global_state.name) if global_state.name else None
    view_background_color_offset = builder.CreateString(global_state.view_background_color)
    main_scope_offset = builder.CreateString(global_state.main_scope)
    
    DucGlobalStateStart(builder)
    if name_offset is not None:
        DucGlobalStateAddName(builder, name_offset)
    DucGlobalStateAddViewBackgroundColor(builder, view_background_color_offset)
    DucGlobalStateAddMainScope(builder, main_scope_offset)
    DucGlobalStateAddDashSpacingScale(builder, global_state.dash_spacing_scale)
    DucGlobalStateAddIsDashSpacingAffectedByViewportScale(builder, global_state.is_dash_spacing_affected_by_viewport_scale)
    DucGlobalStateAddScopeExponentThreshold(builder, global_state.scope_exponent_threshold)
    DucGlobalStateAddDimensionsAssociativeByDefault(builder, global_state.dimensions_associative_by_default)
    DucGlobalStateAddUseAnnotativeScaling(builder, global_state.use_annotative_scaling)
    DucGlobalStateAddDisplayPrecisionLinear(builder, global_state.display_precision_linear)
    DucGlobalStateAddDisplayPrecisionAngular(builder, global_state.display_precision_angular)
    return DucGlobalStateEnd(builder)


def serialize_fbs_duc_local_state(builder: flatbuffers.Builder, local_state: DucLocalState) -> int:
    """Serialize DucLocalState to FlatBuffers."""
    if local_state is None:
        return 0
    scope_offset = builder.CreateString(local_state.scope)
    active_standard_id_offset = builder.CreateString(local_state.active_standard_id)
    active_snap_settings_offset = builder.CreateString(local_state.active_snap_settings) if local_state.active_snap_settings else None
    current_item_font_family_offset = builder.CreateString(local_state.current_item_font_family)
    
    # Serialize active grid settings
    if local_state.active_grid_settings:
        grid_settings_offsets = []
        for setting in local_state.active_grid_settings:
            grid_settings_offsets.append(builder.CreateString(setting))
        
        DucLocalStateStartActiveGridSettingsVector(builder, len(grid_settings_offsets))
        for offset in reversed(grid_settings_offsets):
            builder.PrependUOffsetTRelative(offset)
        active_grid_settings_vector = builder.EndVector()
    else:
        active_grid_settings_vector = None
    
    current_item_stroke_offset = serialize_fbs_element_stroke(builder, local_state.current_item_stroke)
    current_item_background_offset = serialize_fbs_element_background(builder, local_state.current_item_background)
    
    DucLocalStateStart(builder)
    DucLocalStateAddScope(builder, scope_offset)
    DucLocalStateAddActiveStandardId(builder, active_standard_id_offset)
    DucLocalStateAddScrollX(builder, local_state.scroll_x)
    DucLocalStateAddScrollY(builder, local_state.scroll_y)
    DucLocalStateAddZoom(builder, local_state.zoom)
    if active_grid_settings_vector is not None:
        DucLocalStateAddActiveGridSettings(builder, active_grid_settings_vector)
    if active_snap_settings_offset is not None:
        DucLocalStateAddActiveSnapSettings(builder, active_snap_settings_offset)
    DucLocalStateAddIsBindingEnabled(builder, local_state.is_binding_enabled)
    DucLocalStateAddCurrentItemStroke(builder, current_item_stroke_offset)
    DucLocalStateAddCurrentItemBackground(builder, current_item_background_offset)
    DucLocalStateAddCurrentItemOpacity(builder, local_state.current_item_opacity)
    DucLocalStateAddCurrentItemFontFamily(builder, current_item_font_family_offset)
    return DucLocalStateEnd(builder)


def serialize_fbs_duc_block(builder: flatbuffers.Builder, block: DucBlock) -> int:
    """Serialize DucBlock to FlatBuffers."""
    id_offset = builder.CreateString(block.id)
    label_offset = builder.CreateString(block.label) # Use label_offset for label as per schema
    description_offset = builder.CreateString(block.description) if block.description else None
    
    # Serialize elements
    elements_offsets = []
    for element in block.elements:
        from .serialize_elements import serialize_fbs_element_wrapper
        elements_offsets.append(serialize_fbs_element_wrapper(builder, element))
    
    DucBlockStartElementsVector(builder, len(elements_offsets))
    for offset in reversed(elements_offsets):
        builder.PrependUOffsetTRelative(offset)
    elements_vector = builder.EndVector()
    
    # Serialize attribute definitions
    attribute_definitions_offsets = []
    for attribute in block.attribute_definitions:
        from .serialize_element_helpers import serialize_fbs_duc_block_attribute_definition_entry
        attribute_definitions_offsets.append(serialize_fbs_duc_block_attribute_definition_entry(builder, attribute))

    DucBlockStartAttributeDefinitionsVector(builder, len(attribute_definitions_offsets))
    for offset in reversed(attribute_definitions_offsets):
        builder.PrependUOffsetTRelative(offset)
    attribute_definitions_vector = builder.EndVector()
    
    DucBlockStart(builder)
    DucBlockAddId(builder, id_offset)
    DucBlockAddLabel(builder, label_offset)
    DucBlockAddVersion(builder, block.version)
    if description_offset:
        DucBlockAddDescription(builder, description_offset)
    if elements_vector is not None:
        DucBlockAddElements(builder, elements_vector)
    if attribute_definitions_vector is not None:
        DucBlockAddAttributeDefinitions(builder, attribute_definitions_vector)
    return DucBlockEnd(builder)


def serialize_fbs_duc_group(builder: flatbuffers.Builder, group: DucGroup) -> int:
    """Serialize DucGroup to FlatBuffers."""
    id_offset = builder.CreateString(group.id)
    stack_base_offset = serialize_fbs_stack_base(builder, group.stack_base)
    
    DucGroupStart(builder)
    DucGroupAddId(builder, id_offset)
    DucGroupAddStackBase(builder, stack_base_offset)
    return DucGroupEnd(builder)


def serialize_fbs_duc_region(builder: flatbuffers.Builder, region: DucRegion) -> int:
    """Serialize DucRegion to FlatBuffers."""
    stack_base_offset = serialize_fbs_stack_base(builder, region.stack_base)
    
    DucRegionStart(builder)
    DucRegionAddStackBase(builder, stack_base_offset)
    if region.boolean_operation is not None:
        DucRegionAddBooleanOperation(builder, region.boolean_operation)
    return DucRegionEnd(builder)


def serialize_fbs_duc_layer(builder: flatbuffers.Builder, layer: DucLayer) -> int:
    """Serialize DucLayer to FlatBuffers."""
    stack_base_offset = serialize_fbs_stack_base(builder, layer.stack_base)
    
    overrides_offset = None
    if layer.overrides:
        from .serialize_element_base import serialize_fbs_duc_layer_overrides
        overrides_offset = serialize_fbs_duc_layer_overrides(builder, layer.overrides)
    
    DucLayerStart(builder)
    DucLayerAddStackBase(builder, stack_base_offset)
    DucLayerAddReadonly(builder, layer.readonly)
    if overrides_offset is not None:
        DucLayerAddOverrides(builder, overrides_offset)
    return DucLayerEnd(builder)


def serialize_fbs_grid_style(builder: flatbuffers.Builder, grid_style: GridStyle) -> int:
    """Serialize GridStyle to FlatBuffers."""
    color_offset = builder.CreateString(grid_style.color)
    dash_pattern_offset = None
    if grid_style.dash_pattern:
        dash_pattern_offset = builder.CreateNumpyVector(np.array(grid_style.dash_pattern, dtype=np.float64))
    
    GridStyleStart(builder)
    GridStyleAddColor(builder, color_offset)
    GridStyleAddOpacity(builder, grid_style.opacity)
    if dash_pattern_offset is not None:
        GridStyleAddDashPattern(builder, dash_pattern_offset)
    return GridStyleEnd(builder)


def serialize_fbs_polar_grid_settings(builder: flatbuffers.Builder, polar_settings: PolarGridSettings) -> int:
    """Serialize PolarGridSettings to FlatBuffers."""
    PolarGridSettingsStart(builder)
    PolarGridSettingsAddRadialDivisions(builder, polar_settings.radial_divisions)
    PolarGridSettingsAddRadialSpacing(builder, polar_settings.radial_spacing)
    PolarGridSettingsAddShowLabels(builder, polar_settings.show_labels)
    return PolarGridSettingsEnd(builder)


def serialize_fbs_isometric_grid_settings(builder: flatbuffers.Builder, isometric_settings: IsometricGridSettings) -> int:
    """Serialize IsometricGridSettings to FlatBuffers."""
    IsometricGridSettingsStart(builder)
    IsometricGridSettingsAddLeftAngle(builder, isometric_settings.left_angle)
    IsometricGridSettingsAddRightAngle(builder, isometric_settings.right_angle)
    return IsometricGridSettingsEnd(builder)


def serialize_fbs_grid_settings(builder: flatbuffers.Builder, grid_settings: GridSettings) -> int:
    """Serialize GridSettings to FlatBuffers."""
    origin_offset = serialize_fbs_geometric_point(builder, grid_settings.origin)
    major_style_offset = serialize_fbs_grid_style(builder, grid_settings.major_style)
    minor_style_offset = serialize_fbs_grid_style(builder, grid_settings.minor_style)
    polar_settings_offset = serialize_fbs_polar_grid_settings(builder, grid_settings.polar_settings) if grid_settings.polar_settings else None
    isometric_settings_offset = serialize_fbs_isometric_grid_settings(builder, grid_settings.isometric_settings) if grid_settings.isometric_settings else None

    GridSettingsStart(builder)
    if grid_settings.type is not None:
        GridSettingsAddType(builder, grid_settings.type)
    GridSettingsAddReadonly(builder, grid_settings.readonly)
    if grid_settings.display_type is not None:
        GridSettingsAddDisplayType(builder, grid_settings.display_type)
    GridSettingsAddIsAdaptive(builder, grid_settings.is_adaptive)
    GridSettingsAddXSpacing(builder, grid_settings.x_spacing)
    GridSettingsAddYSpacing(builder, grid_settings.y_spacing)
    GridSettingsAddSubdivisions(builder, grid_settings.subdivisions)
    GridSettingsAddOrigin(builder, origin_offset)
    GridSettingsAddRotation(builder, grid_settings.rotation)
    GridSettingsAddFollowUcs(builder, grid_settings.follow_ucs)
    GridSettingsAddMajorStyle(builder, major_style_offset)
    GridSettingsAddMinorStyle(builder, minor_style_offset)
    GridSettingsAddShowMinor(builder, grid_settings.show_minor)
    GridSettingsAddMinZoom(builder, grid_settings.min_zoom)
    GridSettingsAddMaxZoom(builder, grid_settings.max_zoom)
    GridSettingsAddAutoHide(builder, grid_settings.auto_hide)
    if polar_settings_offset is not None:
        GridSettingsAddPolarSettings(builder, polar_settings_offset)
    if isometric_settings_offset is not None:
        GridSettingsAddIsometricSettings(builder, isometric_settings_offset)
    GridSettingsAddEnableSnapping(builder, grid_settings.enable_snapping)
    return GridSettingsEnd(builder)


def serialize_fbs_snap_override(builder: flatbuffers.Builder, snap_override: SnapOverride) -> int:
    """Serialize SnapOverride to FlatBuffers."""
    key_offset = builder.CreateString(snap_override.key)
    SnapOverrideStart(builder)
    SnapOverrideAddKey(builder, key_offset)
    if snap_override.behavior is not None:
        SnapOverrideAddBehavior(builder, snap_override.behavior)
    return SnapOverrideEnd(builder)


def serialize_fbs_dynamic_snap_settings(builder: flatbuffers.Builder, dynamic_snap_settings: DynamicSnapSettings) -> int:
    """Serialize DynamicSnapSettings to FlatBuffers."""
    DynamicSnapSettingsStart(builder)
    DynamicSnapSettingsAddEnabledDuringDrag(builder, dynamic_snap_settings.enabled_during_drag)
    DynamicSnapSettingsAddEnabledDuringRotation(builder, dynamic_snap_settings.enabled_during_rotation)
    DynamicSnapSettingsAddEnabledDuringScale(builder, dynamic_snap_settings.enabled_during_scale)
    return DynamicSnapSettingsEnd(builder)


def serialize_fbs_polar_tracking_settings(builder: flatbuffers.Builder, polar_tracking_settings: PolarTrackingSettings) -> int:
    """Serialize PolarTrackingSettings to FlatBuffers."""
    angles_offset = None
    if polar_tracking_settings.angles:
        angles_offset = builder.CreateNumpyVector(np.array(polar_tracking_settings.angles, dtype=np.float64))
    
    PolarTrackingSettingsStart(builder)
    PolarTrackingSettingsAddEnabled(builder, polar_tracking_settings.enabled)
    if angles_offset is not None:
        PolarTrackingSettingsAddAngles(builder, angles_offset)
    PolarTrackingSettingsAddIncrementAngle(builder, polar_tracking_settings.increment_angle)
    PolarTrackingSettingsAddTrackFromLastPoint(builder, polar_tracking_settings.track_from_last_point)
    PolarTrackingSettingsAddShowPolarCoordinates(builder, polar_tracking_settings.show_polar_coordinates)
    return PolarTrackingSettingsEnd(builder)


def serialize_fbs_tracking_line_style(builder: flatbuffers.Builder, tracking_line_style: TrackingLineStyle) -> int:
    """Serialize TrackingLineStyle to FlatBuffers."""
    color_offset = builder.CreateString(tracking_line_style.color)
    dash_pattern_offset = None
    if tracking_line_style.dash_pattern:
        dash_pattern_offset = builder.CreateNumpyVector(np.array(tracking_line_style.dash_pattern, dtype=np.float64))
    
    TrackingLineStyleStart(builder)
    TrackingLineStyleAddColor(builder, color_offset)
    TrackingLineStyleAddOpacity(builder, tracking_line_style.opacity)
    if dash_pattern_offset is not None:
        TrackingLineStyleAddDashPattern(builder, dash_pattern_offset)
    return TrackingLineStyleEnd(builder)


def serialize_fbs_layer_snap_filters(builder: flatbuffers.Builder, layer_snap_filters: LayerSnapFilters) -> int:
    """Serialize LayerSnapFilters to FlatBuffers."""
    include_layers_offsets = []
    for layer in layer_snap_filters.include_layers:
        include_layers_offsets.append(builder.CreateString(layer))
    
    exclude_layers_offsets = []
    for layer in layer_snap_filters.exclude_layers:
        exclude_layers_offsets.append(builder.CreateString(layer))

    LayerSnapFiltersStart(builder)
    if include_layers_offsets:
        LayerSnapFiltersAddIncludeLayers(builder, LayerSnapFiltersStartIncludeLayersVector(builder, len(include_layers_offsets)))
        for offset in reversed(include_layers_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    if exclude_layers_offsets:
        LayerSnapFiltersAddExcludeLayers(builder, LayerSnapFiltersStartExcludeLayersVector(builder, len(exclude_layers_offsets)))
        for offset in reversed(exclude_layers_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    return LayerSnapFiltersEnd(builder)


def serialize_fbs_snap_marker_style(builder: flatbuffers.Builder, snap_marker_style: SnapMarkerStyle) -> int:
    """Serialize SnapMarkerStyle to FlatBuffers."""
    color_offset = builder.CreateString(snap_marker_style.color)
    SnapMarkerStyleStart(builder)
    if snap_marker_style.shape is not None:
        SnapMarkerStyleAddShape(builder, snap_marker_style.shape)
    SnapMarkerStyleAddColor(builder, color_offset)
    return SnapMarkerStyleEnd(builder)


def serialize_fbs_snap_marker_style_entry(builder: flatbuffers.Builder, entry: SnapMarkerStyleEntry) -> int:
    """Serialize SnapMarkerStyleEntry to FlatBuffers."""
    value_offset = serialize_fbs_snap_marker_style(builder, entry.value)
    SnapMarkerStyleEntryStart(builder)
    SnapMarkerStyleEntryAddKey(builder, entry.key)
    SnapMarkerStyleEntryAddValue(builder, value_offset)
    return SnapMarkerStyleEntryEnd(builder)


def serialize_fbs_snap_marker_settings(builder: flatbuffers.Builder, snap_marker_settings: SnapMarkerSettings) -> int:
    """Serialize SnapMarkerSettings to FlatBuffers."""
    styles_offsets = []
    for style_entry in snap_marker_settings.styles:
        styles_offsets.append(serialize_fbs_snap_marker_style_entry(builder, style_entry))

    SnapMarkerSettingsStart(builder)
    SnapMarkerSettingsAddEnabled(builder, snap_marker_settings.enabled)
    SnapMarkerSettingsAddSize(builder, snap_marker_settings.size)
    SnapMarkerSettingsAddDuration(builder, snap_marker_settings.duration)
    if styles_offsets:
        SnapMarkerSettingsAddStyles(builder, SnapMarkerSettingsStartStylesVector(builder, len(styles_offsets)))
        for offset in reversed(styles_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    return SnapMarkerSettingsEnd(builder)


def serialize_fbs_snap_settings(builder: flatbuffers.Builder, snap_settings: SnapSettings) -> int:
    """Serialize SnapSettings to FlatBuffers."""
    polar_tracking_offset = serialize_fbs_polar_tracking_settings(builder, snap_settings.polar_tracking) if snap_settings.polar_tracking else None
    tracking_line_style_offset = serialize_fbs_tracking_line_style(builder, snap_settings.tracking_line_style) if snap_settings.tracking_line_style else None
    dynamic_snap_offset = serialize_fbs_dynamic_snap_settings(builder, snap_settings.dynamic_snap) if snap_settings.dynamic_snap else None
    layer_snap_filters_offset = serialize_fbs_layer_snap_filters(builder, snap_settings.layer_snap_filters) if snap_settings.layer_snap_filters else None
    snap_markers_offset = serialize_fbs_snap_marker_settings(builder, snap_settings.snap_markers) if snap_settings.snap_markers else None

    active_object_snap_modes_vector = None
    if snap_settings.active_object_snap_modes:
        SnapSettingsStartActiveObjectSnapModesVector(builder, len(snap_settings.active_object_snap_modes))
        for mode in reversed(snap_settings.active_object_snap_modes):
            builder.PrependUOffsetTRelative(mode)
        active_object_snap_modes_vector = builder.EndVector()

    snap_priority_vector = None
    if snap_settings.snap_priority:
        SnapSettingsStartSnapPriorityVector(builder, len(snap_settings.snap_priority))
        for priority in reversed(snap_settings.snap_priority):
            builder.PrependUOffsetTRelative(priority)
        snap_priority_vector = builder.EndVector()

    temporary_overrides_offsets = []
    if snap_settings.temporary_overrides:
        for override in snap_settings.temporary_overrides:
            temporary_overrides_offsets.append(serialize_fbs_snap_override(builder, override))
        SnapSettingsStartTemporaryOverridesVector(builder, len(temporary_overrides_offsets))
        for offset in reversed(temporary_overrides_offsets):
            builder.PrependUOffsetTRelative(offset)
        temporary_overrides_vector = builder.EndVector()
    else:
        temporary_overrides_vector = None

    element_type_filters_offsets = []
    if snap_settings.element_type_filters:
        for element_type in snap_settings.element_type_filters:
            element_type_filters_offsets.append(builder.CreateString(element_type))
        SnapSettingsStartElementTypeFiltersVector(builder, len(element_type_filters_offsets))
        for offset in reversed(element_type_filters_offsets):
            builder.PrependUOffsetTRelative(offset)
        element_type_filters_vector = builder.EndVector()
    else:
        element_type_filters_vector = None

    SnapSettingsStart(builder)
    SnapSettingsAddReadonly(builder, snap_settings.readonly)
    SnapSettingsAddTwistAngle(builder, snap_settings.twist_angle)
    SnapSettingsAddSnapTolerance(builder, snap_settings.snap_tolerance)
    SnapSettingsAddObjectSnapAperture(builder, snap_settings.object_snap_aperture)
    SnapSettingsAddIsOrthoModeOn(builder, snap_settings.is_ortho_mode_on)
    if polar_tracking_offset is not None:
        SnapSettingsAddPolarTracking(builder, polar_tracking_offset)
    SnapSettingsAddIsObjectSnapOn(builder, snap_settings.is_object_snap_on)
    if active_object_snap_modes_vector is not None:
        SnapSettingsAddActiveObjectSnapModes(builder, active_object_snap_modes_vector)
    if snap_priority_vector is not None:
        SnapSettingsAddSnapPriority(builder, snap_priority_vector)
    SnapSettingsAddShowTrackingLines(builder, snap_settings.show_tracking_lines)
    if tracking_line_style_offset is not None:
        SnapSettingsAddTrackingLineStyle(builder, tracking_line_style_offset)
    if dynamic_snap_offset is not None:
        SnapSettingsAddDynamicSnap(builder, dynamic_snap_offset)
    if temporary_overrides_vector is not None:
        SnapSettingsAddTemporaryOverrides(builder, temporary_overrides_vector)
    SnapSettingsAddIncrementalDistance(builder, snap_settings.incremental_distance)
    SnapSettingsAddMagneticStrength(builder, snap_settings.magnetic_strength)
    if layer_snap_filters_offset is not None:
        SnapSettingsAddLayerSnapFilters(builder, layer_snap_filters_offset)
    if element_type_filters_vector is not None:
        SnapSettingsAddElementTypeFilters(builder, element_type_filters_vector)
    if snap_settings.snap_mode is not None:
        SnapSettingsAddSnapMode(builder, snap_settings.snap_mode)
    if snap_markers_offset is not None:
        SnapSettingsAddSnapMarkers(builder, snap_markers_offset)
    SnapSettingsAddConstructionSnapEnabled(builder, snap_settings.construction_snap_enabled)
    SnapSettingsAddSnapToGridIntersections(builder, snap_settings.snap_to_grid_intersections)
    return SnapSettingsEnd(builder)


def serialize_fbs_identified_grid_settings(builder: flatbuffers.Builder, identified_settings: IdentifiedGridSettings) -> int:
    """Serialize IdentifiedGridSettings to FlatBuffers."""
    id_offset = serialize_fbs_identifier(builder, identified_settings.id)
    settings_offset = serialize_fbs_grid_settings(builder, identified_settings.settings)
    
    IdentifiedGridSettingsStart(builder)
    IdentifiedGridSettingsAddId(builder, id_offset)
    IdentifiedGridSettingsAddSettings(builder, settings_offset)
    return IdentifiedGridSettingsEnd(builder)


def serialize_fbs_identified_snap_settings(builder: flatbuffers.Builder, identified_settings: IdentifiedSnapSettings) -> int:
    """Serialize IdentifiedSnapSettings to FlatBuffers."""
    id_offset = serialize_fbs_identifier(builder, identified_settings.id)
    settings_offset = serialize_fbs_snap_settings(builder, identified_settings.settings)
    
    IdentifiedSnapSettingsStart(builder)
    IdentifiedSnapSettingsAddId(builder, id_offset)
    IdentifiedSnapSettingsAddSettings(builder, settings_offset)
    return IdentifiedSnapSettingsEnd(builder)


def serialize_fbs_duc_ucs(builder: flatbuffers.Builder, ucs: DucUcs) -> int:
    """Serialize DucUcs to FlatBuffers."""
    origin_offset = serialize_fbs_geometric_point(builder, ucs.origin)

    DucUcsStart(builder)
    DucUcsAddOrigin(builder, origin_offset)
    DucUcsAddAngle(builder, ucs.angle)
    return DucUcsEnd(builder)


def serialize_fbs_identified_ucs(builder: flatbuffers.Builder, identified_ucs: IdentifiedUcs) -> int:
    """Serialize IdentifiedUcs to FlatBuffers."""
    id_offset = serialize_fbs_identifier(builder, identified_ucs.id)
    ucs_offset = serialize_fbs_duc_ucs(builder, identified_ucs.ucs)
    
    IdentifiedUcsStart(builder)
    IdentifiedUcsAddId(builder, id_offset)
    IdentifiedUcsAddUcs(builder, ucs_offset)
    return IdentifiedUcsEnd(builder)


def serialize_fbs_duc_view(builder: flatbuffers.Builder, view: DucView) -> int:
    """Serialize DucView to FlatBuffers."""
    center_point_offset = serialize_fbs_geometric_point(builder, view.center_point)
    scope_offset = builder.CreateString(view.scope)

    DucViewStart(builder)
    DucViewAddScrollX(builder, view.scroll_x)
    DucViewAddScrollY(builder, view.scroll_y)
    DucViewAddZoom(builder, view.zoom)
    DucViewAddTwistAngle(builder, view.twist_angle)
    DucViewAddCenterPoint(builder, center_point_offset)
    DucViewAddScope(builder, scope_offset)
    return DucViewEnd(builder)


def serialize_fbs_identified_view(builder: flatbuffers.Builder, identified_view: IdentifiedView) -> int:
    """Serialize IdentifiedView to FlatBuffers."""
    id_offset = serialize_fbs_identifier(builder, identified_view.id)
    view_offset = serialize_fbs_duc_view(builder, identified_view.view)
    
    IdentifiedViewStart(builder)
    IdentifiedViewAddId(builder, id_offset)
    IdentifiedViewAddView(builder, view_offset)
    return IdentifiedViewEnd(builder)


def serialize_fbs_standard_view_settings(builder: flatbuffers.Builder, view_settings: StandardViewSettings) -> int:
    """Serialize StandardViewSettings to FlatBuffers."""
    views_offsets = []
    for view in view_settings.views:
        views_offsets.append(serialize_fbs_identified_view(builder, view))
    
    ucs_offsets = []
    for ucs in view_settings.ucs:
        ucs_offsets.append(serialize_fbs_identified_ucs(builder, ucs))

    grid_settings_offsets = []
    for grid_setting in view_settings.grid_settings:
        grid_settings_offsets.append(serialize_fbs_identified_grid_settings(builder, grid_setting))

    snap_settings_offsets = []
    for snap_setting in view_settings.snap_settings:
        snap_settings_offsets.append(serialize_fbs_identified_snap_settings(builder, snap_setting))

    StandardViewSettingsStart(builder)
    if views_offsets:
        StandardViewSettingsAddViews(builder, StandardViewSettingsStartViewsVector(builder, len(views_offsets)))
        for offset in reversed(views_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    if ucs_offsets:
        StandardViewSettingsAddUcs(builder, StandardViewSettingsStartUcsVector(builder, len(ucs_offsets)))
        for offset in reversed(ucs_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    if grid_settings_offsets:
        StandardViewSettingsAddGridSettings(builder, StandardViewSettingsStartGridSettingsVector(builder, len(grid_settings_offsets)))
        for offset in reversed(grid_settings_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    if snap_settings_offsets:
        StandardViewSettingsAddSnapSettings(builder, StandardViewSettingsStartSnapSettingsVector(builder, len(snap_settings_offsets)))
        for offset in reversed(snap_settings_offsets):
            builder.PrependUOffsetTRelative(offset)
        builder.EndVector()
    return StandardViewSettingsEnd(builder)


def serialize_fbs_dimension_validation_rules(builder: flatbuffers.Builder, rules: DimensionValidationRules) -> int:
    """Serialize DimensionValidationRules to FlatBuffers."""
    allowed_precisions_vector = None
    if rules.allowed_precisions:
        DimensionValidationRulesStartAllowedPrecisionsVector(builder, len(rules.allowed_precisions))
        for precision in reversed(rules.allowed_precisions):
            builder.PrependInt32(precision)
        allowed_precisions_vector = builder.EndVector()

    DimensionValidationRulesStart(builder)
    DimensionValidationRulesAddMinTextHeight(builder, rules.min_text_height)
    DimensionValidationRulesAddMaxTextHeight(builder, rules.max_text_height)
    if allowed_precisions_vector is not None:
        DimensionValidationRulesAddAllowedPrecisions(builder, allowed_precisions_vector)
    return DimensionValidationRulesEnd(builder)


def serialize_fbs_layer_validation_rules(builder: flatbuffers.Builder, rules: LayerValidationRules) -> int:
    """Serialize LayerValidationRules to FlatBuffers."""
    prohibited_layer_names_vector = None
    if rules.prohibited_layer_names:
        LayerValidationRulesStartProhibitedLayerNamesVector(builder, len(rules.prohibited_layer_names))
        for name in reversed(rules.prohibited_layer_names):
            builder.PrependUOffsetTRelative(builder.CreateString(name))
        prohibited_layer_names_vector = builder.EndVector()
    
    LayerValidationRulesStart(builder)
    if prohibited_layer_names_vector is not None:
        LayerValidationRulesAddProhibitedLayerNames(builder, prohibited_layer_names_vector)
    return LayerValidationRulesEnd(builder)


def serialize_fbs_standard_validation(builder: flatbuffers.Builder, validation: StandardValidation) -> int:
    """Serialize StandardValidation to FlatBuffers."""
    dimension_rules_offset = serialize_fbs_dimension_validation_rules(builder, validation.dimension_rules) if validation.dimension_rules else None
    layer_rules_offset = serialize_fbs_layer_validation_rules(builder, validation.layer_rules) if validation.layer_rules else None

    StandardValidationStart(builder)
    if dimension_rules_offset is not None:
        StandardValidationAddDimensionRules(builder, dimension_rules_offset)
    if layer_rules_offset is not None:
        StandardValidationAddLayerRules(builder, layer_rules_offset)
    return StandardValidationEnd(builder)
