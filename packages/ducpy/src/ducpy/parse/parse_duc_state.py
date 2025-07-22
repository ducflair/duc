from typing import List, Optional

# Import the dataclasses
from ..classes.DataStateClass import (DictionaryEntry, DisplayPrecision, DucGlobalState,
                                      DucGroup, DucLayer, DucLocalState,
                                      DucRegion)
from ..classes.ElementsClass import DucLayerOverrides
from ..classes.StandardsClass import (AlternateUnits, AngularUnitSystem,
                                      DimensionValidationRules, DucCommonStyle,
                                      DynamicSnapSettings, GridSettings,
                                      GridStyle, IdentifiedCommonStyle,
                                      IdentifiedDimensionStyle,
                                      IdentifiedDocStyle, IdentifiedFCFStyle,
                                      IdentifiedGridSettings,
                                      IdentifiedHatchStyle,
                                      IdentifiedLeaderStyle,
                                      IdentifiedSnapSettings,
                                      IdentifiedStackLikeStyle,
                                      IdentifiedTableStyle,
                                      IdentifiedTextStyle, IdentifiedUcs,
                                      IdentifiedView, IdentifiedViewportStyle,
                                      IdentifiedXRayStyle, Identifier,
                                      IsometricGridSettings, LayerSnapFilters,
                                      LayerValidationRules, LinearUnitSystem,
                                      PolarGridSettings, PolarTrackingSettings,
                                      PrimaryUnits, SnapMarkerSettings,
                                      SnapMarkerStyle, SnapMarkerStyleEntry,
                                      SnapOverride, SnapSettings, Standard,
                                      StandardOverrides, StandardStyles,
                                      StandardUnits, StandardValidation,
                                      StandardViewSettings, TrackingLineStyle,
                                      UnitPrecision, UnitSystemBase)
from ..Duc._UnitSystemBase import _UnitSystemBase as FBSUnitSystemBase
from ..Duc.AlternateUnits import AlternateUnits as FBSAlternateUnits
from ..Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ..Duc.AngularUnitSystem import AngularUnitSystem as FBSAngularUnitSystem
from ..Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ..Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ..Duc.DictionaryEntry import DictionaryEntry as FBSDictionaryEntry
from ..Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ..Duc.DimensionValidationRules import \
    DimensionValidationRules as FBSDimensionValidationRules
from ..Duc.DucCommonStyle import DucCommonStyle as FBSDucCommonStyle
# Import FlatBuffers generated classes with aliases
from ..Duc.DucGlobalState import DucGlobalState as FBSDucGlobalState
from ..Duc.DucGroup import DucGroup as FBSDucGroup
from ..Duc.DucLayer import DucLayer as FBSDucLayer
from ..Duc.DucLocalState import DucLocalState as FBSDucLocalState
from ..Duc.DucRegion import DucRegion as FBSDucRegion
from ..Duc.DynamicSnapSettings import \
    DynamicSnapSettings as FBSDynamicSnapSettings
from ..Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ..Duc.GRID_TYPE import GRID_TYPE
from ..Duc.GridSettings import GridSettings as FBSGridSettings
from ..Duc.GridStyle import GridStyle as FBSGridStyle
from ..Duc.IdentifiedCommonStyle import \
    IdentifiedCommonStyle as FBSIdentifiedCommonStyle
from ..Duc.IdentifiedDimensionStyle import \
    IdentifiedDimensionStyle as FBSIdentifiedDimensionStyle
from ..Duc.IdentifiedDocStyle import \
    IdentifiedDocStyle as FBSIdentifiedDocStyle
from ..Duc.IdentifiedFCFStyle import \
    IdentifiedFCFStyle as FBSIdentifiedFCFStyle
from ..Duc.IdentifiedGridSettings import \
    IdentifiedGridSettings as FBSIdentifiedGridSettings
from ..Duc.IdentifiedHatchStyle import \
    IdentifiedHatchStyle as FBSIdentifiedHatchStyle
from ..Duc.IdentifiedLeaderStyle import \
    IdentifiedLeaderStyle as FBSIdentifiedLeaderStyle
from ..Duc.IdentifiedSnapSettings import \
    IdentifiedSnapSettings as FBSIdentifiedSnapSettings
from ..Duc.IdentifiedStackLikeStyle import \
    IdentifiedStackLikeStyle as FBSIdentifiedStackLikeStyle
from ..Duc.IdentifiedTableStyle import \
    IdentifiedTableStyle as FBSIdentifiedTableStyle
from ..Duc.IdentifiedTextStyle import \
    IdentifiedTextStyle as FBSIdentifiedTextStyle
from ..Duc.IdentifiedUcs import IdentifiedUcs as FBSIdentifiedUcs
from ..Duc.IdentifiedView import IdentifiedView as FBSIdentifiedView
from ..Duc.IdentifiedViewportStyle import \
    IdentifiedViewportStyle as FBSIdentifiedViewportStyle
from ..Duc.IdentifiedXRayStyle import \
    IdentifiedXRayStyle as FBSIdentifiedXRayStyle
from ..Duc.Identifier import Identifier as FBSIdentifier
from ..Duc.IsometricGridSettings import \
    IsometricGridSettings as FBSIsometricGridSettings
from ..Duc.LayerSnapFilters import LayerSnapFilters as FBSLayerSnapFilters
from ..Duc.LayerValidationRules import \
    LayerValidationRules as FBSLayerValidationRules
from ..Duc.LinearUnitSystem import LinearUnitSystem as FBSLinearUnitSystem
from ..Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ..Duc.PolarGridSettings import PolarGridSettings as FBSPolarGridSettings
from ..Duc.PolarTrackingSettings import \
    PolarTrackingSettings as FBSPolarTrackingSettings
from ..Duc.PrimaryUnits import PrimaryUnits as FBSPrimaryUnits
from ..Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ..Duc.SNAP_MODE import SNAP_MODE
from ..Duc.SNAP_OVERRIDE_BEHAVIOR import SNAP_OVERRIDE_BEHAVIOR
from ..Duc.SnapMarkerSettings import \
    SnapMarkerSettings as FBSSnapMarkerSettings
from ..Duc.SnapMarkerStyle import SnapMarkerStyle as FBSSnapMarkerStyle
from ..Duc.SnapMarkerStyleEntry import \
    SnapMarkerStyleEntry as FBSSnapMarkerStyleEntry
from ..Duc.SnapOverride import SnapOverride as FBSSnapOverride
from ..Duc.SnapSettings import SnapSettings as FBSSnapSettings
from ..Duc.Standard import Standard as FBSStandard
from ..Duc.StandardOverrides import StandardOverrides as FBSStandardOverrides
from ..Duc.StandardStyles import StandardStyles as FBSStandardStyles
from ..Duc.StandardUnits import StandardUnits as FBSStandardUnits
from ..Duc.StandardValidation import \
    StandardValidation as FBSStandardValidation
from ..Duc.StandardViewSettings import \
    StandardViewSettings as FBSStandardViewSettings
# Import Enums used in parsing
from ..Duc.TEXT_ALIGN import TEXT_ALIGN
from ..Duc.TrackingLineStyle import TrackingLineStyle as FBSTrackingLineStyle
from ..Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ..Duc.UnitPrecision import UnitPrecision as FBSUnitPrecision
# Import parsing functions from elements for dependencies
from .parse_duc_element import (parse_fbs_duc_dimension_style,
                                parse_fbs_duc_doc_style,
                                parse_fbs_duc_feature_control_frame_style,
                                parse_fbs_duc_hatch_style, parse_fbs_duc_head,
                                parse_fbs_duc_leader_style,
                                parse_fbs_duc_stack_base,
                                parse_fbs_duc_stack_like_styles,
                                parse_fbs_duc_table_style,
                                parse_fbs_duc_text_style,
                                parse_fbs_duc_ucs,
                                parse_fbs_duc_view,
                                parse_fbs_duc_viewport_style,
                                parse_fbs_duc_xray_style,
                                parse_fbs_element_background,
                                parse_fbs_element_stroke,
                                parse_fbs_geometric_point,
                                parse_fbs_identifier)


def parse_fbs_dictionary_entry(fbs_dict_entry: FBSDictionaryEntry) -> DictionaryEntry:
    key_bytes = fbs_dict_entry.Key()
    value_bytes = fbs_dict_entry.Value()
    return DictionaryEntry(
        key=key_bytes.decode('utf-8') if key_bytes is not None else "",
        value=value_bytes.decode('utf-8') if value_bytes is not None else ""
    )

def parse_fbs_duc_global_state(fbs_global_state: FBSDucGlobalState) -> DucGlobalState:
  if fbs_global_state is None:
    return None
  return DucGlobalState(
      name=fbs_global_state.Name().decode('utf-8') if fbs_global_state.Name() else None,
      view_background_color=fbs_global_state.ViewBackgroundColor().decode('utf-8'),
      main_scope=fbs_global_state.MainScope().decode('utf-8'),
      dash_spacing_scale=fbs_global_state.DashSpacingScale(),
      is_dash_spacing_affected_by_viewport_scale=bool(fbs_global_state.IsDashSpacingAffectedByViewportScale()),
      scope_exponent_threshold=fbs_global_state.ScopeExponentThreshold(),
      dimensions_associative_by_default=bool(fbs_global_state.DimensionsAssociativeByDefault()),
      use_annotative_scaling=bool(fbs_global_state.UseAnnotativeScaling()),
      display_precision=DisplayPrecision(
          linear=fbs_global_state.DisplayPrecisionLinear(),
          angular=fbs_global_state.DisplayPrecisionAngular()
      )
  )

def parse_fbs_duc_local_state(fbs_local_state: FBSDucLocalState) -> DucLocalState:
    if fbs_local_state is None:
        return None
    active_grid_settings_list = [fbs_local_state.ActiveGridSettings(i).decode('utf-8') for i in range(fbs_local_state.ActiveGridSettingsLength())]
    return DucLocalState(
        scope=fbs_local_state.Scope().decode('utf-8') if fbs_local_state.Scope() is not None else "",
        active_standard_id=fbs_local_state.ActiveStandardId().decode('utf-8') if fbs_local_state.ActiveStandardId() is not None else "",
        scroll_x=fbs_local_state.ScrollX(),
        scroll_y=fbs_local_state.ScrollY(),
        zoom=fbs_local_state.Zoom(),
        active_grid_settings=active_grid_settings_list,
        active_snap_settings=fbs_local_state.ActiveSnapSettings().decode('utf-8') if fbs_local_state.ActiveSnapSettings() else None,
        is_binding_enabled=bool(fbs_local_state.IsBindingEnabled()),
        current_item_stroke=parse_fbs_element_stroke(fbs_local_state.CurrentItemStroke()),
        current_item_background=parse_fbs_element_background(fbs_local_state.CurrentItemBackground()),
        current_item_opacity=fbs_local_state.CurrentItemOpacity(),
        current_item_font_family=fbs_local_state.CurrentItemFontFamily().decode('utf-8') if fbs_local_state.CurrentItemFontFamily() is not None else "",
        current_item_font_size=fbs_local_state.CurrentItemFontSize(),
        current_item_text_align=fbs_local_state.CurrentItemTextAlign() if fbs_local_state.CurrentItemTextAlign() is not None else None,
        current_item_start_line_head=parse_fbs_duc_head(fbs_local_state.CurrentItemStartLineHead()),
        current_item_end_line_head=parse_fbs_duc_head(fbs_local_state.CurrentItemEndLineHead()),
        current_item_roundness=fbs_local_state.CurrentItemRoundness(),
        pen_mode=bool(fbs_local_state.PenMode()),
        view_mode_enabled=bool(fbs_local_state.ViewModeEnabled()),
        objects_snap_mode_enabled=bool(fbs_local_state.ObjectsSnapModeEnabled()),
        grid_mode_enabled=bool(fbs_local_state.GridModeEnabled()),
        outline_mode_enabled=bool(fbs_local_state.OutlineModeEnabled())
    )

def parse_fbs_duc_group(fbs_group: FBSDucGroup) -> DucGroup:
    return DucGroup(
        id=fbs_group.Id().decode('utf-8') if fbs_group.Id() is not None else "",
        stack_base=parse_fbs_duc_stack_base(fbs_group.StackBase()) # Assuming parse_fbs_duc_stack_base is in elements parsing
    )

def parse_fbs_duc_region(fbs_region: FBSDucRegion) -> DucRegion:
    return DucRegion(
        id=fbs_region.Id().decode('utf-8') if fbs_region.Id() is not None else "",
        stack_base=parse_fbs_duc_stack_base(fbs_region.StackBase()), # Assuming parse_fbs_duc_stack_base is in elements parsing
        boolean_operation=fbs_region.BooleanOperation() if fbs_region.BooleanOperation() is not None else None
    )

def parse_fbs_duc_layer(fbs_layer: FBSDucLayer) -> DucLayer:
    return DucLayer(
        id=fbs_layer.Id().decode('utf-8') if fbs_layer.Id() else "",
        stack_base=parse_fbs_duc_stack_base(fbs_layer.StackBase()) if fbs_layer.StackBase() else None, # Assuming parse_fbs_duc_stack_base is in elements parsing
        readonly=bool(fbs_layer.Readonly()),
        overrides=DucLayerOverrides(
            stroke=parse_fbs_element_stroke(fbs_layer.Overrides().Stroke()) if fbs_layer.Overrides() and fbs_layer.Overrides().Stroke() else None,
            background=parse_fbs_element_background(fbs_layer.Overrides().Background()) if fbs_layer.Overrides() and fbs_layer.Overrides().Background() else None
        ) if fbs_layer.Overrides() else None
    )

def parse_fbs_unit_system_base(fbs_unit_base: FBSUnitSystemBase) -> UnitSystemBase:
    return UnitSystemBase(
        system=fbs_unit_base.System() if fbs_unit_base.System() is not None else None,
        precision=fbs_unit_base.Precision(),
        suppress_leading_zeros=bool(fbs_unit_base.SuppressLeadingZeros()),
        suppress_trailing_zeros=bool(fbs_unit_base.SuppressTrailingZeros())
    )

def parse_fbs_linear_unit_system(fbs_linear_unit: FBSLinearUnitSystem) -> LinearUnitSystem:
    return LinearUnitSystem(
        base=parse_fbs_unit_system_base(fbs_linear_unit.Base()),
        format=fbs_linear_unit.Format() if fbs_linear_unit.Format() is not None else None,
        decimal_separator=fbs_linear_unit.DecimalSeparator() if fbs_linear_unit.DecimalSeparator() is not None else None,
        suppress_zero_feet=bool(fbs_linear_unit.SuppressZeroFeet()),
        suppress_zero_inches=bool(fbs_linear_unit.SuppressZeroInches())
    )

def parse_fbs_angular_unit_system(fbs_angular_unit: FBSAngularUnitSystem) -> AngularUnitSystem:
    return AngularUnitSystem(
        base=parse_fbs_unit_system_base(fbs_angular_unit.Base()),
        format=fbs_angular_unit.Format() if fbs_angular_unit.Format() is not None else None
    )

def parse_fbs_alternate_units(fbs_alternate_units: FBSAlternateUnits) -> AlternateUnits:
    return AlternateUnits(
        base=parse_fbs_unit_system_base(fbs_alternate_units.Base()),
        format=fbs_alternate_units.Format() if fbs_alternate_units.Format() is not None else None,
        is_visible=bool(fbs_alternate_units.IsVisible()),
        multiplier=fbs_alternate_units.Multiplier()
    )

def parse_fbs_primary_units(fbs_primary_units: FBSPrimaryUnits) -> PrimaryUnits:
    return PrimaryUnits(
        linear=parse_fbs_linear_unit_system(fbs_primary_units.Linear()),
        angular=parse_fbs_angular_unit_system(fbs_primary_units.Angular())
    )

def parse_fbs_standard_units(fbs_standard_units: FBSStandardUnits) -> StandardUnits:
    return StandardUnits(
        primary_units=parse_fbs_primary_units(fbs_standard_units.PrimaryUnits()),
        alternate_units=parse_fbs_alternate_units(fbs_standard_units.AlternateUnits())
    )

def parse_fbs_unit_precision(fbs_unit_precision: FBSUnitPrecision) -> UnitPrecision:
    return UnitPrecision(
        linear=fbs_unit_precision.Linear(),
        angular=fbs_unit_precision.Angular(),
        area=fbs_unit_precision.Area(),
        volume=fbs_unit_precision.Volume()
    )

def parse_fbs_standard_overrides(fbs_overrides: FBSStandardOverrides) -> StandardOverrides:
    active_grid_settings_id_list = [fbs_overrides.ActiveGridSettingsId(i).decode('utf-8') for i in range(fbs_overrides.ActiveGridSettingsIdLength())]
    return StandardOverrides(
        main_scope=fbs_overrides.MainScope().decode('utf-8'),
        elements_stroke_width_override=fbs_overrides.ElementsStrokeWidthOverride(),
        common_style_id=fbs_overrides.CommonStyleId().decode('utf-8'),
        stack_like_style_id=fbs_overrides.StackLikeStyleId().decode('utf-8'),
        text_style_id=fbs_overrides.TextStyleId().decode('utf-8'),
        dimension_style_id=fbs_overrides.DimensionStyleId().decode('utf-8'),
        leader_style_id=fbs_overrides.LeaderStyleId().decode('utf-8'),
        feature_control_frame_style_id=fbs_overrides.FeatureControlFrameStyleId().decode('utf-8'),
        table_style_id=fbs_overrides.TableStyleId().decode('utf-8'),
        doc_style_id=fbs_overrides.DocStyleId().decode('utf-8'),
        viewport_style_id=fbs_overrides.ViewportStyleId().decode('utf-8'),
        plot_style_id=fbs_overrides.PlotStyleId().decode('utf-8'),
        hatch_style_id=fbs_overrides.HatchStyleId().decode('utf-8'),
        active_grid_settings_id=active_grid_settings_id_list,
        active_snap_settings_id=fbs_overrides.ActiveSnapSettingsId().decode('utf-8'),
        dash_line_override=fbs_overrides.DashLineOverride().decode('utf-8'),
        unit_precision=parse_fbs_unit_precision(fbs_overrides.UnitPrecision())
    )

def parse_fbs_duc_common_style(fbs_common_style: FBSDucCommonStyle) -> DucCommonStyle:
    return DucCommonStyle(
        background=parse_fbs_element_background(fbs_common_style.Background()),
        stroke=parse_fbs_element_stroke(fbs_common_style.Stroke())
    )

def parse_fbs_identified_common_style(fbs_identified_common_style: FBSIdentifiedCommonStyle) -> IdentifiedCommonStyle:
    return IdentifiedCommonStyle(
        id=parse_fbs_identifier(fbs_identified_common_style.Id()),
        style=parse_fbs_duc_common_style(fbs_identified_common_style.Style())
    )

def parse_fbs_identified_stack_like_style(fbs_identified_stack_like_style: FBSIdentifiedStackLikeStyle) -> IdentifiedStackLikeStyle:
    return IdentifiedStackLikeStyle(
        id=parse_fbs_identifier(fbs_identified_stack_like_style.Id()),
        style=parse_fbs_duc_stack_like_styles(fbs_identified_stack_like_style.Style())
    )

def parse_fbs_identified_text_style(fbs_identified_text_style: FBSIdentifiedTextStyle) -> IdentifiedTextStyle:
    return IdentifiedTextStyle(
        id=parse_fbs_identifier(fbs_identified_text_style.Id()),
        style=parse_fbs_duc_text_style(fbs_identified_text_style.Style())
    )

def parse_fbs_identified_dimension_style(fbs_identified_dim_style: FBSIdentifiedDimensionStyle) -> IdentifiedDimensionStyle:
    return IdentifiedDimensionStyle(
        id=parse_fbs_identifier(fbs_identified_dim_style.Id()),
        style=parse_fbs_duc_dimension_style(fbs_identified_dim_style.Style())
    )

def parse_fbs_identified_leader_style(fbs_identified_leader_style: FBSIdentifiedLeaderStyle) -> IdentifiedLeaderStyle:
    return IdentifiedLeaderStyle(
        id=parse_fbs_identifier(fbs_identified_leader_style.Id()),
        style=parse_fbs_duc_leader_style(fbs_identified_leader_style.Style())
    )

def parse_fbs_identified_fcf_style(fbs_identified_fcf_style: FBSIdentifiedFCFStyle) -> IdentifiedFCFStyle:
    return IdentifiedFCFStyle(
        id=parse_fbs_identifier(fbs_identified_fcf_style.Id()),
        style=parse_fbs_duc_feature_control_frame_style(fbs_identified_fcf_style.Style())
    )

def parse_fbs_identified_table_style(fbs_identified_table_style: FBSIdentifiedTableStyle) -> IdentifiedTableStyle:
    return IdentifiedTableStyle(
        id=parse_fbs_identifier(fbs_identified_table_style.Id()),
        style=parse_fbs_duc_table_style(fbs_identified_table_style.Style())
    )

def parse_fbs_identified_doc_style(fbs_identified_doc_style: FBSIdentifiedDocStyle) -> IdentifiedDocStyle:
    return IdentifiedDocStyle(
        id=parse_fbs_identifier(fbs_identified_doc_style.Id()),
        style=parse_fbs_duc_doc_style(fbs_identified_doc_style.Style())
    )

def parse_fbs_identified_viewport_style(fbs_identified_viewport_style: FBSIdentifiedViewportStyle) -> IdentifiedViewportStyle:
    return IdentifiedViewportStyle(
        id=parse_fbs_identifier(fbs_identified_viewport_style.Id()),
        style=parse_fbs_duc_viewport_style(fbs_identified_viewport_style.Style())
    )

def parse_fbs_identified_hatch_style(fbs_identified_hatch_style: FBSIdentifiedHatchStyle) -> IdentifiedHatchStyle:
    return IdentifiedHatchStyle(
        id=parse_fbs_identifier(fbs_identified_hatch_style.Id()),
        style=parse_fbs_duc_hatch_style(fbs_identified_hatch_style.Style())
    )

def parse_fbs_identified_xray_style(fbs_identified_xray_style: FBSIdentifiedXRayStyle) -> IdentifiedXRayStyle:
    return IdentifiedXRayStyle(
        id=parse_fbs_identifier(fbs_identified_xray_style.Id()),
        style=parse_fbs_duc_xray_style(fbs_identified_xray_style.Style())
    )

def parse_fbs_standard_styles(fbs_standard_styles: FBSStandardStyles) -> StandardStyles:
    common_styles = [parse_fbs_identified_common_style(fbs_standard_styles.CommonStyles(i)) for i in range(fbs_standard_styles.CommonStylesLength())]
    stack_like_styles = [parse_fbs_identified_stack_like_style(fbs_standard_styles.StackLikeStyles(i)) for i in range(fbs_standard_styles.StackLikeStylesLength())]
    text_styles = [parse_fbs_identified_text_style(fbs_standard_styles.TextStyles(i)) for i in range(fbs_standard_styles.TextStylesLength())]
    dimension_styles = [parse_fbs_identified_dimension_style(fbs_standard_styles.DimensionStyles(i)) for i in range(fbs_standard_styles.DimensionStylesLength())]
    leader_styles = [parse_fbs_identified_leader_style(fbs_standard_styles.LeaderStyles(i)) for i in range(fbs_standard_styles.LeaderStylesLength())]
    feature_control_frame_styles = [parse_fbs_identified_fcf_style(fbs_standard_styles.FeatureControlFrameStyles(i)) for i in range(fbs_standard_styles.FeatureControlFrameStylesLength())]
    table_styles = [parse_fbs_identified_table_style(fbs_standard_styles.TableStyles(i)) for i in range(fbs_standard_styles.TableStylesLength())]
    doc_styles = [parse_fbs_identified_doc_style(fbs_standard_styles.DocStyles(i)) for i in range(fbs_standard_styles.DocStylesLength())]
    viewport_styles = [parse_fbs_identified_viewport_style(fbs_standard_styles.ViewportStyles(i)) for i in range(fbs_standard_styles.ViewportStylesLength())]
    hatch_styles = [parse_fbs_identified_hatch_style(fbs_standard_styles.HatchStyles(i)) for i in range(fbs_standard_styles.HatchStylesLength())]
    xray_styles = [parse_fbs_identified_xray_style(fbs_standard_styles.XrayStyles(i)) for i in range(fbs_standard_styles.XrayStylesLength())]

    return StandardStyles(
        common_styles=common_styles,
        stack_like_styles=stack_like_styles,
        text_styles=text_styles,
        dimension_styles=dimension_styles,
        leader_styles=leader_styles,
        feature_control_frame_styles=feature_control_frame_styles,
        table_styles=table_styles,
        doc_styles=doc_styles,
        viewport_styles=viewport_styles,
        hatch_styles=hatch_styles,
        xray_styles=xray_styles
    )

def parse_fbs_grid_style(fbs_grid_style: FBSGridStyle) -> GridStyle:
    dash_pattern_list = [fbs_grid_style.DashPattern(i) for i in range(fbs_grid_style.DashPatternLength())]
    return GridStyle(
        color=fbs_grid_style.Color().decode('utf-8'),
        opacity=fbs_grid_style.Opacity(),
        dash_pattern=dash_pattern_list
    )

def parse_fbs_polar_grid_settings(fbs_polar_grid: FBSPolarGridSettings) -> PolarGridSettings:
    return PolarGridSettings(
        radial_divisions=fbs_polar_grid.RadialDivisions(),
        radial_spacing=fbs_polar_grid.RadialSpacing(),
        show_labels=bool(fbs_polar_grid.ShowLabels())
    )

def parse_fbs_isometric_grid_settings(fbs_iso_grid: FBSIsometricGridSettings) -> IsometricGridSettings:
    return IsometricGridSettings(
        left_angle=fbs_iso_grid.LeftAngle(),
        right_angle=fbs_iso_grid.RightAngle()
    )

def parse_fbs_grid_settings(fbs_grid_settings: FBSGridSettings) -> GridSettings:
    return GridSettings(
        type=fbs_grid_settings.Type() if fbs_grid_settings.Type() is not None else None,
        readonly=bool(fbs_grid_settings.Readonly()),
        display_type=fbs_grid_settings.DisplayType() if fbs_grid_settings.DisplayType() is not None else None,
        is_adaptive=bool(fbs_grid_settings.IsAdaptive()),
        x_spacing=fbs_grid_settings.XSpacing(),
        y_spacing=fbs_grid_settings.YSpacing(),
        subdivisions=fbs_grid_settings.Subdivisions(),
        origin=parse_fbs_geometric_point(fbs_grid_settings.Origin()),
        rotation=fbs_grid_settings.Rotation(),
        follow_ucs=bool(fbs_grid_settings.FollowUcs()),
        major_style=parse_fbs_grid_style(fbs_grid_settings.MajorStyle()),
        minor_style=parse_fbs_grid_style(fbs_grid_settings.MinorStyle()),
        show_minor=bool(fbs_grid_settings.ShowMinor()),
        min_zoom=fbs_grid_settings.MinZoom(),
        max_zoom=fbs_grid_settings.MaxZoom(),
        auto_hide=bool(fbs_grid_settings.AutoHide()),
        polar_settings=parse_fbs_polar_grid_settings(fbs_grid_settings.PolarSettings()),
        isometric_settings=parse_fbs_isometric_grid_settings(fbs_grid_settings.IsometricSettings()),
        enable_snapping=bool(fbs_grid_settings.EnableSnapping())
    )

def parse_fbs_snap_override(fbs_snap_override: FBSSnapOverride) -> SnapOverride:
    return SnapOverride(
        key=fbs_snap_override.Key().decode('utf-8'),
        behavior=fbs_snap_override.Behavior() if fbs_snap_override.Behavior() is not None else None
    )

def parse_fbs_dynamic_snap_settings(fbs_dynamic_snap: FBSDynamicSnapSettings) -> DynamicSnapSettings:
    return DynamicSnapSettings(
        enabled_during_drag=bool(fbs_dynamic_snap.EnabledDuringDrag()),
        enabled_during_rotation=bool(fbs_dynamic_snap.EnabledDuringRotation()),
        enabled_during_scale=bool(fbs_dynamic_snap.EnabledDuringScale())
    )

def parse_fbs_polar_tracking_settings(fbs_polar_tracking: FBSPolarTrackingSettings) -> PolarTrackingSettings:
    angles_list = [fbs_polar_tracking.Angles(i) for i in range(fbs_polar_tracking.AnglesLength())]
    return PolarTrackingSettings(
        enabled=bool(fbs_polar_tracking.Enabled()),
        angles=angles_list,
        increment_angle=fbs_polar_tracking.IncrementAngle(),
        track_from_last_point=bool(fbs_polar_tracking.TrackFromLastPoint()),
        show_polar_coordinates=bool(fbs_polar_tracking.ShowPolarCoordinates())
    )

def parse_fbs_tracking_line_style(fbs_tracking_line: FBSTrackingLineStyle) -> TrackingLineStyle:
    dash_pattern_list = [fbs_tracking_line.DashPattern(i) for i in range(fbs_tracking_line.DashPatternLength())]
    return TrackingLineStyle(
        color=fbs_tracking_line.Color().decode('utf-8'),
        opacity=fbs_tracking_line.Opacity(),
        dash_pattern=dash_pattern_list
    )

def parse_fbs_layer_snap_filters(fbs_layer_snap_filters: FBSLayerSnapFilters) -> LayerSnapFilters:
    include_layers_list = [fbs_layer_snap_filters.IncludeLayers(i).decode('utf-8') for i in range(fbs_layer_snap_filters.IncludeLayersLength())]
    exclude_layers_list = [fbs_layer_snap_filters.ExcludeLayers(i).decode('utf-8') for i in range(fbs_layer_snap_filters.ExcludeLayersLength())]
    return LayerSnapFilters(
        include_layers=include_layers_list,
        exclude_layers=exclude_layers_list
    )

def parse_fbs_snap_marker_style(fbs_snap_marker_style: FBSSnapMarkerStyle) -> SnapMarkerStyle:
    return SnapMarkerStyle(
        shape=fbs_snap_marker_style.Shape() if fbs_snap_marker_style.Shape() is not None else None,
        color=fbs_snap_marker_style.Color().decode('utf-8')
    )

def parse_fbs_snap_marker_style_entry(fbs_snap_marker_entry: FBSSnapMarkerStyleEntry) -> SnapMarkerStyleEntry:
    return SnapMarkerStyleEntry(
        key=fbs_snap_marker_entry.Key() if fbs_snap_marker_entry.Key() is not None else None,
        value=parse_fbs_snap_marker_style(fbs_snap_marker_entry.Value())
    )

def parse_fbs_snap_marker_settings(fbs_snap_markers: FBSSnapMarkerSettings) -> SnapMarkerSettings:
    styles_list = [parse_fbs_snap_marker_style_entry(fbs_snap_markers.Styles(i)) for i in range(fbs_snap_markers.StylesLength())]
    return SnapMarkerSettings(
        enabled=bool(fbs_snap_markers.Enabled()),
        size=fbs_snap_markers.Size(),
        duration=fbs_snap_markers.Duration(),
        styles=styles_list
    )

def parse_fbs_snap_settings(fbs_snap_settings: FBSSnapSettings) -> SnapSettings:
    active_object_snap_modes_list = [fbs_snap_settings.ActiveObjectSnapModes(i) for i in range(fbs_snap_settings.ActiveObjectSnapModesLength())]
    snap_priority_list = [fbs_snap_settings.SnapPriority(i) for i in range(fbs_snap_settings.SnapPriorityLength())]
    element_type_filters_list = [fbs_snap_settings.ElementTypeFilters(i).decode('utf-8') for i in range(fbs_snap_settings.ElementTypeFiltersLength())]

    return SnapSettings(
        readonly=bool(fbs_snap_settings.Readonly()),
        twist_angle=fbs_snap_settings.TwistAngle(),
        snap_tolerance=fbs_snap_settings.SnapTolerance(),
        object_snap_aperture=fbs_snap_settings.ObjectSnapAperture(),
        is_ortho_mode_on=bool(fbs_snap_settings.IsOrthoModeOn()),
        polar_tracking=parse_fbs_polar_tracking_settings(fbs_snap_settings.PolarTracking()),
        is_object_snap_on=bool(fbs_snap_settings.IsObjectSnapOn()),
        active_object_snap_modes=active_object_snap_modes_list,
        snap_priority=snap_priority_list,
        show_tracking_lines=bool(fbs_snap_settings.ShowTrackingLines()),
        tracking_line_style=parse_fbs_tracking_line_style(fbs_snap_settings.TrackingLineStyle()),
        dynamic_snap=parse_fbs_dynamic_snap_settings(fbs_snap_settings.DynamicSnap()),
        temporary_overrides=[parse_fbs_snap_override(fbs_snap_settings.TemporaryOverrides(i)) for i in range(fbs_snap_settings.TemporaryOverridesLength())],
        incremental_distance=fbs_snap_settings.IncrementalDistance(),
        magnetic_strength=fbs_snap_settings.MagneticStrength(),
        layer_snap_filters=parse_fbs_layer_snap_filters(fbs_snap_settings.LayerSnapFilters()),
        element_type_filters=element_type_filters_list,
        snap_mode=fbs_snap_settings.SnapMode() if fbs_snap_settings.SnapMode() is not None else None,
        snap_markers=parse_fbs_snap_marker_settings(fbs_snap_settings.SnapMarkers()),
        construction_snap_enabled=bool(fbs_snap_settings.ConstructionSnapEnabled()),
        snap_to_grid_intersections=bool(fbs_snap_settings.SnapToGridIntersections())
    )

def parse_fbs_identified_grid_settings(fbs_identified_grid: FBSIdentifiedGridSettings) -> IdentifiedGridSettings:
    return IdentifiedGridSettings(
        id=parse_fbs_identifier(fbs_identified_grid.Id()),
        settings=parse_fbs_grid_settings(fbs_identified_grid.Settings())
    )

def parse_fbs_identified_snap_settings(fbs_identified_snap: FBSIdentifiedSnapSettings) -> IdentifiedSnapSettings:
    return IdentifiedSnapSettings(
        id=parse_fbs_identifier(fbs_identified_snap.Id()),
        settings=parse_fbs_snap_settings(fbs_identified_snap.Settings())
    )

def parse_fbs_identified_ucs(fbs_identified_ucs: FBSIdentifiedUcs) -> IdentifiedUcs:
    return IdentifiedUcs(
        id=parse_fbs_identifier(fbs_identified_ucs.Id()),
        ucs=parse_fbs_duc_ucs(fbs_identified_ucs.Ucs())
    )

def parse_fbs_identified_view(fbs_identified_view: FBSIdentifiedView) -> IdentifiedView:
    return IdentifiedView(
        id=parse_fbs_identifier(fbs_identified_view.Id()),
        view=parse_fbs_duc_view(fbs_identified_view.View())
    )

def parse_fbs_standard_view_settings(fbs_view_settings: FBSStandardViewSettings) -> StandardViewSettings:
    views_list = [parse_fbs_identified_view(fbs_view_settings.Views(i)) for i in range(fbs_view_settings.ViewsLength())]
    ucs_list = [parse_fbs_identified_ucs(fbs_view_settings.Ucs(i)) for i in range(fbs_view_settings.UcsLength())]
    grid_settings_list = [parse_fbs_identified_grid_settings(fbs_view_settings.GridSettings(i)) for i in range(fbs_view_settings.GridSettingsLength())]
    snap_settings_list = [parse_fbs_identified_snap_settings(fbs_view_settings.SnapSettings(i)) for i in range(fbs_view_settings.SnapSettingsLength())]
    return StandardViewSettings(
        views=views_list,
        ucs=ucs_list,
        grid_settings=grid_settings_list,
        snap_settings=snap_settings_list
    )

def parse_fbs_dimension_validation_rules(fbs_dim_validation: FBSDimensionValidationRules) -> DimensionValidationRules:
    allowed_precisions_list = [fbs_dim_validation.AllowedPrecisions(i) for i in range(fbs_dim_validation.AllowedPrecisionsLength())]
    return DimensionValidationRules(
        min_text_height=fbs_dim_validation.MinTextHeight(),
        max_text_height=fbs_dim_validation.MaxTextHeight(),
        allowed_precisions=allowed_precisions_list
    )

def parse_fbs_layer_validation_rules(fbs_layer_validation: FBSLayerValidationRules) -> LayerValidationRules:
    prohibited_layer_names_list = [fbs_layer_validation.ProhibitedLayerNames(i).decode('utf-8') for i in range(fbs_layer_validation.ProhibitedLayerNamesLength())]
    return LayerValidationRules(
        prohibited_layer_names=prohibited_layer_names_list
    )

def parse_fbs_standard_validation(fbs_standard_validation: FBSStandardValidation) -> StandardValidation:
    return StandardValidation(
        dimension_rules=parse_fbs_dimension_validation_rules(fbs_standard_validation.DimensionRules()),
        layer_rules=parse_fbs_layer_validation_rules(fbs_standard_validation.LayerRules())
    )

def parse_fbs_standard(fbs_standard: FBSStandard) -> Standard:
    return Standard(
        identifier=parse_fbs_identifier(fbs_standard.Identifier()),
        version=fbs_standard.Version().decode('utf-8'),
        readonly=bool(fbs_standard.Readonly()),
        overrides=parse_fbs_standard_overrides(fbs_standard.Overrides()),
        styles=parse_fbs_standard_styles(fbs_standard.Styles()),
        view_settings=parse_fbs_standard_view_settings(fbs_standard.ViewSettings()),
        units=parse_fbs_standard_units(fbs_standard.Units()),
        validation=parse_fbs_standard_validation(fbs_standard.Validation())
    )
