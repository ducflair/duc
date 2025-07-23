"""
Standards serialization helper functions for duc.fbs schema.
This module provides serialization for Standards-related structures and sub-components.
"""

import flatbuffers
from typing import List, Optional
from .serialize_styles import serialize_fbs_standard_styles

# Import dataclasses from comprehensive classes
from ..classes.StandardsClass import (
    Standard, StandardUnits, StandardOverrides, PrimaryUnits, 
    LinearUnitSystem, AngularUnitSystem, AlternateUnits, UnitPrecision,
    UnitSystemBase, DucStackLikeStyles, DucCommonStyle, StandardStyles
)

# Import FlatBuffers generated classes for standards sub-structures
from ..Duc.Standard import (
    StandardStart, StandardEnd,
    StandardAddIdentifier, StandardAddVersion, StandardAddReadonly,
    StandardAddOverrides, StandardAddStyles, StandardAddViewSettings,
    StandardAddUnits, StandardAddValidation
)
from ..Duc.StandardUnits import (
    StandardUnitsStart, StandardUnitsEnd,
    StandardUnitsAddPrimaryUnits, StandardUnitsAddAlternateUnits
)
from ..Duc.PrimaryUnits import (
    PrimaryUnitsStart, PrimaryUnitsEnd,
    PrimaryUnitsAddLinear, PrimaryUnitsAddAngular
)
from ..Duc.LinearUnitSystem import (
    LinearUnitSystemAddFormat,
    LinearUnitSystemAddDecimalSeparator,
    LinearUnitSystemStart, LinearUnitSystemEnd,
    LinearUnitSystemAddSuppressZeroFeet, LinearUnitSystemAddSuppressZeroInches,
    LinearUnitSystemAddBase
)
from ..Duc.AngularUnitSystem import (
    AngularUnitSystemAddFormat,
    AngularUnitSystemStart, AngularUnitSystemEnd,
    AngularUnitSystemAddBase
)
from ..Duc.AlternateUnits import (
    AlternateUnitsStart, AlternateUnitsEnd,
    AlternateUnitsAddIsVisible, AlternateUnitsAddMultiplier,
    AlternateUnitsAddBase, AlternateUnitsAddFormat
)
from ..Duc._UnitSystemBase import (
    _UnitSystemBaseStart, _UnitSystemBaseEnd,
    _UnitSystemBaseAddSystem, _UnitSystemBaseAddPrecision,
    _UnitSystemBaseAddSuppressLeadingZeros, _UnitSystemBaseAddSuppressTrailingZeros
)
from ..Duc.StandardOverrides import (
    StandardOverridesStart, StandardOverridesEnd,
    StandardOverridesAddMainScope, StandardOverridesAddElementsStrokeWidthOverride,
    StandardOverridesAddCommonStyleId, StandardOverridesAddStackLikeStyleId,
    StandardOverridesAddTextStyleId, StandardOverridesAddDimensionStyleId,
    StandardOverridesAddLeaderStyleId, StandardOverridesAddFeatureControlFrameStyleId,
    StandardOverridesAddTableStyleId, StandardOverridesAddDocStyleId,
    StandardOverridesAddViewportStyleId, StandardOverridesAddPlotStyleId,
    StandardOverridesAddHatchStyleId, StandardOverridesAddActiveGridSettingsId,
    StandardOverridesAddActiveSnapSettingsId, StandardOverridesAddDashLineOverride,
    StandardOverridesAddUnitPrecision, StandardOverridesStartActiveGridSettingsIdVector
)
from ..Duc.UnitPrecision import (
    UnitPrecisionStart, UnitPrecisionEnd,
    UnitPrecisionAddLinear, UnitPrecisionAddAngular,
    UnitPrecisionAddArea, UnitPrecisionAddVolume
)

# Import base element helpers
from .serialize_base_elements import serialize_fbs_identifier


def serialize_fbs_unit_system_base(builder: flatbuffers.Builder, unit_system_base: UnitSystemBase) -> int:
    """Serialize UnitSystemBase to FlatBuffers."""
    if unit_system_base is None:
        return 0
    _UnitSystemBaseStart(builder)
    if unit_system_base.system is not None:
        _UnitSystemBaseAddSystem(builder, unit_system_base.system)
    _UnitSystemBaseAddPrecision(builder, unit_system_base.precision)
    _UnitSystemBaseAddSuppressLeadingZeros(builder, unit_system_base.suppress_leading_zeros)
    _UnitSystemBaseAddSuppressTrailingZeros(builder, unit_system_base.suppress_trailing_zeros)
    return _UnitSystemBaseEnd(builder)


def serialize_fbs_linear_unit_system(builder: flatbuffers.Builder, linear_unit: LinearUnitSystem) -> int:
    """Serialize LinearUnitSystem to FlatBuffers."""
    if linear_unit is None:
        # Return 0 offset if missing
        return 0
    
    # Serialize the base unit system
    base_offset = serialize_fbs_unit_system_base(builder, linear_unit)
    
    LinearUnitSystemStart(builder)
    LinearUnitSystemAddBase(builder, base_offset)
    if linear_unit.format is not None:
        LinearUnitSystemAddFormat(builder, linear_unit.format)
    if linear_unit.decimal_separator is not None:
        LinearUnitSystemAddDecimalSeparator(builder, linear_unit.decimal_separator)
    LinearUnitSystemAddSuppressZeroFeet(builder, linear_unit.suppress_zero_feet)
    LinearUnitSystemAddSuppressZeroInches(builder, linear_unit.suppress_zero_inches)
    return LinearUnitSystemEnd(builder)


def serialize_fbs_angular_unit_system(builder: flatbuffers.Builder, angular_unit: AngularUnitSystem) -> int:
    """Serialize AngularUnitSystem to FlatBuffers."""
    if angular_unit is None:
        # Return 0 offset if missing
        return 0
    
    # Serialize the base unit system
    base_offset = serialize_fbs_unit_system_base(builder, angular_unit)
    
    AngularUnitSystemStart(builder)
    AngularUnitSystemAddBase(builder, base_offset)
    if angular_unit.format is not None:
        AngularUnitSystemAddFormat(builder, angular_unit.format)
    return AngularUnitSystemEnd(builder)


def serialize_fbs_alternate_units(builder: flatbuffers.Builder, alternate_units: AlternateUnits) -> int:
    """Serialize AlternateUnits to FlatBuffers."""
    if alternate_units is None:
        return 0
        
    # Serialize the base unit system
    base_offset = serialize_fbs_unit_system_base(builder, alternate_units)
    
    AlternateUnitsStart(builder)
    AlternateUnitsAddBase(builder, base_offset)
    if alternate_units.format is not None:
        AlternateUnitsAddFormat(builder, alternate_units.format)
    AlternateUnitsAddIsVisible(builder, alternate_units.is_visible)
    AlternateUnitsAddMultiplier(builder, alternate_units.multiplier)
    return AlternateUnitsEnd(builder)


def serialize_fbs_primary_units(builder: flatbuffers.Builder, primary_units: PrimaryUnits) -> int:
    """Serialize PrimaryUnits to FlatBuffers."""
    linear_offset = serialize_fbs_linear_unit_system(builder, primary_units.linear)
    angular_offset = serialize_fbs_angular_unit_system(builder, primary_units.angular)
    
    PrimaryUnitsStart(builder)
    PrimaryUnitsAddLinear(builder, linear_offset)
    PrimaryUnitsAddAngular(builder, angular_offset)
    return PrimaryUnitsEnd(builder)


def serialize_fbs_unit_precision(builder: flatbuffers.Builder, unit_precision: UnitPrecision) -> int:
    """Serialize UnitPrecision to FlatBuffers."""
    UnitPrecisionStart(builder)
    UnitPrecisionAddLinear(builder, unit_precision.linear)
    UnitPrecisionAddAngular(builder, unit_precision.angular)
    UnitPrecisionAddArea(builder, unit_precision.area)
    UnitPrecisionAddVolume(builder, unit_precision.volume)
    return UnitPrecisionEnd(builder)


def serialize_fbs_standard_overrides(builder: flatbuffers.Builder, overrides: StandardOverrides) -> int:
    """Serialize StandardOverrides to FlatBuffers."""
    main_scope_offset = builder.CreateString(overrides.main_scope)
    common_style_id_offset = builder.CreateString(overrides.common_style_id)
    stack_like_style_id_offset = builder.CreateString(overrides.stack_like_style_id)
    text_style_id_offset = builder.CreateString(overrides.text_style_id)
    dimension_style_id_offset = builder.CreateString(overrides.dimension_style_id)
    leader_style_id_offset = builder.CreateString(overrides.leader_style_id)
    feature_control_frame_style_id_offset = builder.CreateString(overrides.feature_control_frame_style_id)
    table_style_id_offset = builder.CreateString(overrides.table_style_id)
    doc_style_id_offset = builder.CreateString(overrides.doc_style_id)
    viewport_style_id_offset = builder.CreateString(overrides.viewport_style_id)
    plot_style_id_offset = builder.CreateString(overrides.plot_style_id)
    hatch_style_id_offset = builder.CreateString(overrides.hatch_style_id)
    active_snap_settings_id_offset = builder.CreateString(overrides.active_snap_settings_id)
    dash_line_override_offset = builder.CreateString(overrides.dash_line_override)
    unit_precision_offset = serialize_fbs_unit_precision(builder, overrides.unit_precision)
    
    # Serialize active grid settings ID vector
    active_grid_settings_id_offsets = []
    for setting_id in overrides.active_grid_settings_id:
        active_grid_settings_id_offsets.append(builder.CreateString(setting_id))
    
    StandardOverridesStartActiveGridSettingsIdVector(builder, len(active_grid_settings_id_offsets))
    for offset in reversed(active_grid_settings_id_offsets):
        builder.PrependUOffsetTRelative(offset)
    active_grid_settings_id_vector = builder.EndVector()
    
    StandardOverridesStart(builder)
    StandardOverridesAddMainScope(builder, main_scope_offset)
    StandardOverridesAddElementsStrokeWidthOverride(builder, overrides.elements_stroke_width_override)
    StandardOverridesAddCommonStyleId(builder, common_style_id_offset)
    StandardOverridesAddStackLikeStyleId(builder, stack_like_style_id_offset)
    StandardOverridesAddTextStyleId(builder, text_style_id_offset)
    StandardOverridesAddDimensionStyleId(builder, dimension_style_id_offset)
    StandardOverridesAddLeaderStyleId(builder, leader_style_id_offset)
    StandardOverridesAddFeatureControlFrameStyleId(builder, feature_control_frame_style_id_offset)
    StandardOverridesAddTableStyleId(builder, table_style_id_offset)
    StandardOverridesAddDocStyleId(builder, doc_style_id_offset)
    StandardOverridesAddViewportStyleId(builder, viewport_style_id_offset)
    StandardOverridesAddPlotStyleId(builder, plot_style_id_offset)
    StandardOverridesAddHatchStyleId(builder, hatch_style_id_offset)
    StandardOverridesAddActiveGridSettingsId(builder, active_grid_settings_id_vector)
    StandardOverridesAddActiveSnapSettingsId(builder, active_snap_settings_id_offset)
    StandardOverridesAddDashLineOverride(builder, dash_line_override_offset)
    StandardOverridesAddUnitPrecision(builder, unit_precision_offset)
    return StandardOverridesEnd(builder)


def serialize_fbs_standard_units(builder: flatbuffers.Builder, units: StandardUnits) -> int:
    """Serialize StandardUnits to FlatBuffers."""
    if units is None:
        return 0
    primary_units_offset = serialize_fbs_primary_units(builder, units.primary_units)
    alternate_units_offset = serialize_fbs_alternate_units(builder, units.alternate_units)
    
    StandardUnitsStart(builder)
    StandardUnitsAddPrimaryUnits(builder, primary_units_offset)
    StandardUnitsAddAlternateUnits(builder, alternate_units_offset)
    return StandardUnitsEnd(builder)


def serialize_fbs_standard(builder: flatbuffers.Builder, standard: Standard) -> int:
    """Serialize Standard to FlatBuffers."""
    # Imports here to break circular dependency
    from .serialize_duc_state import (
        serialize_fbs_standard_view_settings,
        serialize_fbs_standard_validation
    )

    identifier_offset = serialize_fbs_identifier(builder, standard.identifier)
    version_offset = builder.CreateString(standard.version)
    overrides_offset = serialize_fbs_standard_overrides(builder, standard.overrides)
    # Defensive: handle missing styles
    if standard.styles is not None:
        styles_offset = serialize_fbs_standard_styles(builder, standard.styles)
    else:
        from ..classes.StandardsClass import StandardStyles
        styles_offset = serialize_fbs_standard_styles(builder, StandardStyles())
    view_settings_offset = serialize_fbs_standard_view_settings(builder, standard.view_settings)
    validation_offset = serialize_fbs_standard_validation(builder, standard.validation)
    units_offset = serialize_fbs_standard_units(builder, standard.units)

    StandardStart(builder)
    StandardAddIdentifier(builder, identifier_offset)
    StandardAddVersion(builder, version_offset)
    StandardAddReadonly(builder, standard.readonly)
    StandardAddOverrides(builder, overrides_offset)
    StandardAddStyles(builder, styles_offset)
    StandardAddViewSettings(builder, view_settings_offset)
    StandardAddUnits(builder, units_offset)
    StandardAddValidation(builder, validation_offset)
    return StandardEnd(builder)
