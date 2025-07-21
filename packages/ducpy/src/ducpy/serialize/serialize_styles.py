"""
Style serialization functions for duc.fbs schema.
This module provides serialization for style-related data structures.
"""

from __future__ import annotations

import flatbuffers
from typing import List, Optional
import numpy as np

# Import dataclasses from comprehensive classes
from ..classes.ElementsClass import (
    LineSpacing, DucTextStyle, DucTableCellStyle, DucTableStyle,
    DucLeaderStyle, DimensionToleranceStyle, DimensionFitStyle,
    DimensionLineStyle, DimensionExtLineStyle, DimensionSymbolStyle,
    DucDimensionStyle, FCFLayoutStyle, FCFSymbolStyle, FCFDatumStyle,
    DucFeatureControlFrameStyle, ParagraphFormatting, StackFormatProperties,
    StackFormat, DucDocStyle, DucViewportStyle, DucPlotStyle, DucXRayStyle
)

from ..classes.StandardsClass import Standard, PrimaryUnits, TrackingLineStyle, StandardStyles, IdentifiedCommonStyle, IdentifiedStackLikeStyle, IdentifiedTextStyle, IdentifiedDimensionStyle, IdentifiedLeaderStyle, IdentifiedFCFStyle, IdentifiedTableStyle, IdentifiedDocStyle, IdentifiedViewportStyle, IdentifiedHatchStyle, IdentifiedXRayStyle, DucCommonStyle, DucStackLikeStyles # Added DucCommonStyle, DucStackLikeStyles

# Import FlatBuffers generated classes for styles
from ducpy.Duc import LineSpacing
from ducpy.Duc import DucTextStyle
from ducpy.Duc import DucTableCellStyle
from ducpy.Duc import DucTableStyle
from ducpy.Duc import DucLeaderStyle
from ducpy.Duc import DimensionToleranceStyle
from ducpy.Duc import DimensionFitStyle
from ducpy.Duc import DimensionLineStyle
from ducpy.Duc import DimensionExtLineStyle
from ducpy.Duc import DimensionSymbolStyle
from ducpy.Duc import DucDimensionStyle
from ducpy.Duc import FCFLayoutStyle
from ducpy.Duc import FCFSymbolStyle
from ducpy.Duc import FCFDatumStyle
from ducpy.Duc import DucFeatureControlFrameStyle
from ducpy.Duc import ParagraphFormatting
from ducpy.Duc import StackFormatProperties
from ducpy.Duc import StackFormat
from ducpy.Duc import DucDocStyle
from ducpy.Duc import DucViewportStyle
from ducpy.Duc import DucPlotStyle
from ducpy.Duc import DucXRayStyle
from ducpy.Duc import TrackingLineStyle as FBTrackingLineStyle
from ducpy.Duc import IdentifiedCommonStyle as FBIdentifiedCommonStyle
from ducpy.Duc import IdentifiedStackLikeStyle as FBIdentifiedStackLikeStyle
from ducpy.Duc import IdentifiedTextStyle as FBIdentifiedTextStyle
from ducpy.Duc import IdentifiedDimensionStyle as FBIdentifiedDimensionStyle
from ducpy.Duc import IdentifiedLeaderStyle as FBIdentifiedLeaderStyle
from ducpy.Duc import IdentifiedFCFStyle as FBIdentifiedFCFStyle
from ducpy.Duc import IdentifiedTableStyle as FBIdentifiedTableStyle
from ducpy.Duc import IdentifiedDocStyle as FBIdentifiedDocStyle
from ducpy.Duc import IdentifiedViewportStyle as FBIdentifiedViewportStyle
from ducpy.Duc import IdentifiedHatchStyle as FBIdentifiedHatchStyle
from ducpy.Duc import IdentifiedXRayStyle as FBIdentifiedXRayStyle
from ducpy.Duc.StandardStyles import (
    StandardStylesStart, StandardStylesEnd,
    StandardStylesAddCommonStyles, StandardStylesAddStackLikeStyles,
    StandardStylesAddTextStyles, StandardStylesAddDimensionStyles,
    StandardStylesAddLeaderStyles, StandardStylesAddFeatureControlFrameStyles,
    StandardStylesAddTableStyles, StandardStylesAddDocStyles,
    StandardStylesAddViewportStyles, StandardStylesAddHatchStyles,
    StandardStylesAddXrayStyles
)
from ducpy.Duc.DucCommonStyle import DucCommonStyleStart, DucCommonStyleEnd, DucCommonStyleAddBackground, DucCommonStyleAddStroke
from ducpy.Duc.DucStackLikeStyles import DucStackLikeStylesStart, DucStackLikeStylesEnd, DucStackLikeStylesAddOpacity, DucStackLikeStylesAddLabelingColor

# Import from base elements
# Removed top-level imports to break circular dependency

from .serialize_element_base import (
    serialize_fbs_duc_element_styles_base
)
from .serialize_element_helpers import (
    serialize_fbs_snap_marker_style
)


def serialize_fbs_duc_common_style(builder: flatbuffers.Builder, common_style: DucCommonStyle) -> int:
    """Serialize DucCommonStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_element_background, serialize_fbs_element_stroke

    background_offset = serialize_fbs_element_background(builder, common_style.background) if common_style.background else None
    stroke_offset = serialize_fbs_element_stroke(builder, common_style.stroke) if common_style.stroke else None

    DucCommonStyleStart(builder)
    if background_offset is not None:
        DucCommonStyleAddBackground(builder, background_offset)
    if stroke_offset is not None:
        DucCommonStyleAddStroke(builder, stroke_offset)
    return DucCommonStyleEnd(builder)


def serialize_fbs_duc_stack_like_styles(builder: flatbuffers.Builder, stack_like_styles: DucStackLikeStyles) -> int:
    """Serialize DucStackLikeStyles to FlatBuffers."""
    labeling_color_offset = builder.CreateString(stack_like_styles.labeling_color) if stack_like_styles.labeling_color else None

    DucStackLikeStylesStart(builder)
    DucStackLikeStylesAddOpacity(builder, stack_like_styles.opacity)
    if labeling_color_offset is not None:
        DucStackLikeStylesAddLabelingColor(builder, labeling_color_offset)
    return DucStackLikeStylesEnd(builder)


def serialize_fbs_line_spacing(builder: flatbuffers.Builder, line_spacing: LineSpacing) -> int:
    """Serialize LineSpacing to FlatBuffers."""
    LineSpacing.LineSpacingStart(builder)
    LineSpacing.LineSpacingAddType(builder, line_spacing.type)
    LineSpacing.LineSpacingAddValue(builder, line_spacing.value)
    return LineSpacing.LineSpacingEnd(builder)


def serialize_fbs_duc_text_style(builder: flatbuffers.Builder, text_style: DucTextStyle) -> int:
    """Serialize DucTextStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_margins

    font_family_offset = builder.CreateString(text_style.font_family)
    line_spacing_offset = serialize_fbs_line_spacing(builder, text_style.line_spacing) if text_style.line_spacing else None
    
    DucTextStyle.DucTextStyleStart(builder)
    DucTextStyle.DucTextStyleAddFontFamily(builder, font_family_offset)
    DucTextStyle.DucTextStyleAddFontSize(builder, text_style.font_size)
    DucTextStyle.DucTextStyleAddTextAlign(builder, text_style.text_align)
    DucTextStyle.DucTextStyleAddVerticalAlign(builder, text_style.vertical_align)
    DucTextStyle.DucTextStyleAddLineHeight(builder, text_style.line_height)
    if line_spacing_offset is not None:
        DucTextStyle.DucTextStyleAddLineSpacing(builder, line_spacing_offset)
    DucTextStyle.DucTextStyleAddObliqueAngle(builder, text_style.oblique_angle)
    return DucTextStyle.DucTextStyleEnd(builder)


def serialize_fbs_duc_table_cell_style(builder: flatbuffers.Builder, cell_style: DucTableCellStyle) -> int:
    """Serialize DucTableCellStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_margins
    
    margins_offset = serialize_fbs_margins(builder, cell_style.margins) if cell_style.margins else None
    text_style_offset = serialize_fbs_duc_text_style(builder, cell_style.text_style) if cell_style.text_style else None
    
    DucTableCellStyle.DucTableCellStyleStart(builder)
    DucTableCellStyle.DucTableCellStyleAddAlignment(builder, cell_style.alignment)
    if margins_offset is not None:
        DucTableCellStyle.DucTableCellStyleAddMargins(builder, margins_offset)
    if text_style_offset is not None:
        DucTableCellStyle.DucTableCellStyleAddTextStyle(builder, text_style_offset)
    return DucTableCellStyle.DucTableCellStyleEnd(builder)


def serialize_fbs_duc_table_style(builder: flatbuffers.Builder, table_style: DucTableStyle) -> int:
    """Serialize DucTableStyle to FlatBuffers."""
    # Imports here to break circular dependency
    from .serialize_base_elements import serialize_fbs_element_stroke, serialize_fbs_element_background

    header_row_style_offset = serialize_fbs_duc_table_cell_style(builder, table_style.header_row_style) if table_style.header_row_style else None
    data_row_style_offset = serialize_fbs_duc_table_cell_style(builder, table_style.data_row_style) if table_style.data_row_style else None
    data_column_style_offset = serialize_fbs_duc_table_cell_style(builder, table_style.data_column_style) if table_style.data_column_style else None

    DucTableStyle.DucTableStyleStart(builder)
    DucTableStyle.DucTableStyleAddFlowDirection(builder, table_style.flow_direction)
    if header_row_style_offset is not None:
        DucTableStyle.DucTableStyleAddHeaderRowStyle(builder, header_row_style_offset)
    if data_row_style_offset is not None:
        DucTableStyle.DucTableStyleAddDataRowStyle(builder, data_row_style_offset)
    if data_column_style_offset is not None:
        DucTableStyle.DucTableStyleAddDataColumnStyle(builder, data_column_style_offset)
    return DucTableStyle.DucTableStyleEnd(builder)


def serialize_fbs_duc_leader_style(builder: flatbuffers.Builder, leader_style: DucLeaderStyle) -> int:
    """Serialize DucLeaderStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_duc_head

    heads_override_offsets = []
    if leader_style.heads_override:
        for head in reversed(leader_style.heads_override):
            heads_override_offsets.append(serialize_fbs_duc_head(builder, head))
        DucLeaderStyle.DucLeaderStyleStartHeadsOverrideVector(builder, len(heads_override_offsets))
        for offset in heads_override_offsets:
            builder.PrependUOffsetTRelative(offset)
        heads_override_vector = builder.EndVector()
    else:
        heads_override_vector = 0
    
    text_style_offset = serialize_fbs_duc_text_style(builder, leader_style.text_style) if leader_style.text_style else None

    DucLeaderStyle.DucLeaderStyleStart(builder)
    if heads_override_vector != 0:
        DucLeaderStyle.DucLeaderStyleAddHeadsOverride(builder, heads_override_vector)
    DucLeaderStyle.DucLeaderStyleAddDogleg(builder, leader_style.dogleg)
    if text_style_offset is not None:
        DucLeaderStyle.DucLeaderStyleAddTextStyle(builder, text_style_offset)
    DucLeaderStyle.DucLeaderStyleAddTextAttachment(builder, leader_style.text_attachment)
    DucLeaderStyle.DucLeaderStyleAddBlockAttachment(builder, leader_style.block_attachment)
    return DucLeaderStyle.DucLeaderStyleEnd(builder)


def serialize_fbs_dimension_tolerance_style(builder: flatbuffers.Builder, tolerance_style: DimensionToleranceStyle) -> int:
    """Serialize DimensionToleranceStyle to FlatBuffers."""
    text_style_offset = serialize_fbs_duc_text_style(builder, tolerance_style.text_style) if tolerance_style.text_style else None

    DimensionToleranceStyle.DimensionToleranceStyleStart(builder)
    DimensionToleranceStyle.DimensionToleranceStyleAddEnabled(builder, tolerance_style.enabled)
    DimensionToleranceStyle.DimensionToleranceStyleAddDisplayMethod(builder, tolerance_style.display_method)
    DimensionToleranceStyle.DimensionToleranceStyleAddUpperValue(builder, tolerance_style.upper_value)
    DimensionToleranceStyle.DimensionToleranceStyleAddLowerValue(builder, tolerance_style.lower_value)
    DimensionToleranceStyle.DimensionToleranceStyleAddPrecision(builder, tolerance_style.precision)
    if text_style_offset is not None:
        DimensionToleranceStyle.DimensionToleranceStyleAddTextStyle(builder, text_style_offset)
    return DimensionToleranceStyle.DimensionToleranceStyleEnd(builder)


def serialize_fbs_dimension_fit_style(builder: flatbuffers.Builder, fit_style: DimensionFitStyle) -> int:
    """Serialize DimensionFitStyle to FlatBuffers."""
    DimensionFitStyle.DimensionFitStyleStart(builder)
    DimensionFitStyle.DimensionFitStyleAddRule(builder, fit_style.rule)
    DimensionFitStyle.DimensionFitStyleAddTextPlacement(builder, fit_style.text_placement)
    DimensionFitStyle.DimensionFitStyleAddForceTextInside(builder, fit_style.force_text_inside)
    return DimensionFitStyle.DimensionFitStyleEnd(builder)


def serialize_fbs_dimension_line_style(builder: flatbuffers.Builder, line_style: DimensionLineStyle) -> int:
    """Serialize DimensionLineStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_element_stroke

    stroke_offset = serialize_fbs_element_stroke(builder, line_style.stroke) if line_style.stroke else None

    DimensionLineStyle.DimensionLineStyleStart(builder)
    if stroke_offset is not None:
        DimensionLineStyle.DimensionLineStyleAddStroke(builder, stroke_offset)
    DimensionLineStyle.DimensionLineStyleAddTextGap(builder, line_style.text_gap)
    return DimensionLineStyle.DimensionLineStyleEnd(builder)


def serialize_fbs_dimension_ext_line_style(builder: flatbuffers.Builder, ext_line_style: DimensionExtLineStyle) -> int:
    """Serialize DimensionExtLineStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_element_stroke

    stroke_offset = serialize_fbs_element_stroke(builder, ext_line_style.stroke) if ext_line_style.stroke else None

    DimensionExtLineStyle.DimensionExtLineStyleStart(builder)
    if stroke_offset is not None:
        DimensionExtLineStyle.DimensionExtLineStyleAddStroke(builder, stroke_offset)
    DimensionExtLineStyle.DimensionExtLineStyleAddOvershoot(builder, ext_line_style.overshoot)
    DimensionExtLineStyle.DimensionExtLineStyleAddOffset(builder, ext_line_style.offset)
    return DimensionExtLineStyle.DimensionExtLineStyleEnd(builder)


def serialize_fbs_dimension_symbol_style(builder: flatbuffers.Builder, symbol_style: DimensionSymbolStyle) -> int:
    """Serialize DimensionSymbolStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_duc_head

    heads_override_offsets = []
    if symbol_style.heads_override:
        for head_override in symbol_style.heads_override:
            heads_override_offsets.append(serialize_fbs_duc_head(builder, head_override))
        
        # Create vector of heads_override
        DimensionSymbolStyle.DimensionSymbolStyleStartHeadsOverrideVector(builder, len(heads_override_offsets))
        for i in reversed(range(len(heads_override_offsets))):
            builder.PrependUOffsetTRelative(heads_override_offsets[i])
        heads_override_vector_offset = builder.EndVector()

    DimensionSymbolStyle.DimensionSymbolStyleStart(builder)
    if symbol_style.heads_override:
        DimensionSymbolStyle.DimensionSymbolStyleAddHeadsOverride(builder, heads_override_vector_offset)
    DimensionSymbolStyle.DimensionSymbolStyleAddCenterMarkType(builder, symbol_style.center_mark_type)
    DimensionSymbolStyle.DimensionSymbolStyleAddCenterMarkSize(builder, symbol_style.center_mark_size)
    return DimensionSymbolStyle.DimensionSymbolStyleEnd(builder)


def serialize_fbs_duc_dimension_style(builder: flatbuffers.Builder, dimension_style: DucDimensionStyle) -> int:
    """Serialize DucDimensionStyle to FlatBuffers."""
    dim_line_offset = serialize_fbs_dimension_line_style(builder, dimension_style.dim_line) if dimension_style.dim_line else None
    ext_line_offset = serialize_fbs_dimension_ext_line_style(builder, dimension_style.ext_line) if dimension_style.ext_line else None
    text_style_offset = serialize_fbs_duc_text_style(builder, dimension_style.text_style) if dimension_style.text_style else None
    symbols_offset = serialize_fbs_dimension_symbol_style(builder, dimension_style.symbols) if dimension_style.symbols else None
    tolerance_offset = serialize_fbs_dimension_tolerance_style(builder, dimension_style.tolerance) if dimension_style.tolerance else None
    fit_offset = serialize_fbs_dimension_fit_style(builder, dimension_style.fit) if dimension_style.fit else None

    DucDimensionStyle.DucDimensionStyleStart(builder)
    if dim_line_offset is not None:
        DucDimensionStyle.DucDimensionStyleAddDimLine(builder, dim_line_offset)
    if ext_line_offset is not None:
        DucDimensionStyle.DucDimensionStyleAddExtLine(builder, ext_line_offset)
    if text_style_offset is not None:
        DucDimensionStyle.DucDimensionStyleAddTextStyle(builder, text_style_offset)
    if symbols_offset is not None:
        DucDimensionStyle.DucDimensionStyleAddSymbols(builder, symbols_offset)
    if tolerance_offset is not None:
        DucDimensionStyle.DucDimensionStyleAddTolerance(builder, tolerance_offset)
    if fit_offset is not None:
        DucDimensionStyle.DucDimensionStyleAddFit(builder, fit_offset)
    return DucDimensionStyle.DucDimensionStyleEnd(builder)


def serialize_fbs_fcf_layout_style(builder: flatbuffers.Builder, layout_style: FCFLayoutStyle) -> int:
    """Serialize FCFLayoutStyle to FlatBuffers."""
    FCFLayoutStyle.FCFLayoutStyleStart(builder)
    FCFLayoutStyle.FCFLayoutStyleAddPadding(builder, layout_style.padding)
    FCFLayoutStyle.FCFLayoutStyleAddSegmentSpacing(builder, layout_style.segment_spacing)
    FCFLayoutStyle.FCFLayoutStyleAddRowSpacing(builder, layout_style.row_spacing)
    return FCFLayoutStyle.FCFLayoutStyleEnd(builder)


def serialize_fbs_fcf_symbol_style(builder: flatbuffers.Builder, symbol_style: FCFSymbolStyle) -> int:
    """Serialize FCFSymbolStyle to FlatBuffers."""
    FCFSymbolStyle.FCFSymbolStyleStart(builder)
    FCFSymbolStyle.FCFSymbolStyleAddScale(builder, symbol_style.scale)
    return FCFSymbolStyle.FCFSymbolStyleEnd(builder)


def serialize_fbs_fcf_datum_style(builder: flatbuffers.Builder, datum_style: FCFDatumStyle) -> int:
    """Serialize FCFDatumStyle to FlatBuffers."""
    FCFDatumStyle.FCFDatumStyleStart(builder)
    if datum_style.bracket_style is not None:
        FCFDatumStyle.FCFDatumStyleAddBracketStyle(builder, datum_style.bracket_style)
    return FCFDatumStyle.FCFDatumStyleEnd(builder)


def serialize_fbs_duc_feature_control_frame_style(
    builder: flatbuffers.Builder, fcf_style: DucFeatureControlFrameStyle
) -> int:
    """Serialize DucFeatureControlFrameStyle to FlatBuffers."""
    base_style_offset = (
        serialize_fbs_duc_element_styles_base(builder, fcf_style.base_style)
        if fcf_style.base_style
        else None
    )
    text_style_offset = (
        serialize_fbs_duc_text_style(builder, fcf_style.text_style)
        if fcf_style.text_style
        else None
    )
    layout_offset = (
        serialize_fbs_fcf_layout_style(builder, fcf_style.layout)
        if fcf_style.layout
        else None
    )
    symbols_offset = (
        serialize_fbs_fcf_symbol_style(builder, fcf_style.symbols)
        if fcf_style.symbols
        else None
    )
    datum_style_offset = (
        serialize_fbs_fcf_datum_style(builder, fcf_style.datum_style)
        if fcf_style.datum_style
        else None
    )

    DucFeatureControlFrameStyle.DucFeatureControlFrameStyleStart(builder)
    if base_style_offset is not None:
        DucFeatureControlFrameStyle.DucFeatureControlFrameStyleAddBaseStyle(builder, base_style_offset)
    if text_style_offset is not None:
        DucFeatureControlFrameStyle.DucFeatureControlFrameStyleAddTextStyle(builder, text_style_offset)
    if layout_offset is not None:
        DucFeatureControlFrameStyle.DucFeatureControlFrameStyleAddLayout(builder, layout_offset)
    if symbols_offset is not None:
        DucFeatureControlFrameStyle.DucFeatureControlFrameStyleAddSymbols(builder, symbols_offset)
    if datum_style_offset is not None:
        DucFeatureControlFrameStyle.DucFeatureControlFrameStyleAddDatumStyle(builder, datum_style_offset)
    return DucFeatureControlFrameStyle.DucFeatureControlFrameStyleEnd(builder)


def serialize_fbs_paragraph_formatting(builder: flatbuffers.Builder, paragraph_formatting: ParagraphFormatting) -> int:
    """Serialize ParagraphFormatting to FlatBuffers."""
    tab_stops_offset = None
    if paragraph_formatting.tab_stops:
        tab_stops_offset = builder.CreateNumpyVector(np.array(paragraph_formatting.tab_stops, dtype=np.float64))

    ParagraphFormatting.ParagraphFormattingStart(builder)
    ParagraphFormatting.ParagraphFormattingAddFirstLineIndent(builder, paragraph_formatting.first_line_indent)
    ParagraphFormatting.ParagraphFormattingAddHangingIndent(builder, paragraph_formatting.hanging_indent)
    ParagraphFormatting.ParagraphFormattingAddLeftIndent(builder, paragraph_formatting.left_indent)
    ParagraphFormatting.ParagraphFormattingAddRightIndent(builder, paragraph_formatting.right_indent)
    ParagraphFormatting.ParagraphFormattingAddSpaceBefore(builder, paragraph_formatting.space_before)
    ParagraphFormatting.ParagraphFormattingAddSpaceAfter(builder, paragraph_formatting.space_after)
    if tab_stops_offset is not None:
        ParagraphFormatting.ParagraphFormattingAddTabStops(builder, tab_stops_offset)
    return ParagraphFormatting.ParagraphFormattingEnd(builder)


def serialize_fbs_stack_format_properties(
    builder: flatbuffers.Builder, stack_format_properties: StackFormatProperties
) -> int:
    """Serialize StackFormatProperties to FlatBuffers."""
    StackFormatProperties.StackFormatPropertiesStart(builder)
    StackFormatProperties.StackFormatPropertiesAddUpperScale(builder, stack_format_properties.upper_scale)
    StackFormatProperties.StackFormatPropertiesAddLowerScale(builder, stack_format_properties.lower_scale)
    if stack_format_properties.alignment is not None:
        StackFormatProperties.StackFormatPropertiesAddAlignment(builder, stack_format_properties.alignment)
    return StackFormatProperties.StackFormatPropertiesEnd(builder)


def serialize_fbs_stack_format(builder: flatbuffers.Builder, stack_format: StackFormat) -> int:
    """Serialize StackFormat to FlatBuffers."""
    properties_offset = serialize_fbs_stack_format_properties(builder, stack_format.properties) if stack_format.properties else None
    text_style_offset = serialize_fbs_duc_text_style(builder, stack_format.text_style) if stack_format.text_style else None
    
    StackFormat.StackFormatStart(builder)
    if properties_offset is not None:
        StackFormat.StackFormatAddProperties(builder, properties_offset)
    if text_style_offset is not None:
        StackFormat.StackFormatAddTextStyle(builder, text_style_offset)
    return StackFormat.StackFormatEnd(builder)


def serialize_fbs_duc_doc_style(builder: flatbuffers.Builder, doc_style: DucDocStyle) -> int:
    """Serialize DucDocStyle to FlatBuffers."""
    paragraph_formatting_offset = serialize_fbs_paragraph_formatting(builder, doc_style.paragraph_formatting) if doc_style.paragraph_formatting else None
    stack_format_offset = serialize_fbs_stack_format(builder, doc_style.stack_format) if doc_style.stack_format else None
    text_style_offset = serialize_fbs_duc_text_style(builder, doc_style.text_style) if doc_style.text_style else None
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_element_background

    background_offset = serialize_fbs_element_background(builder, doc_style.background) if doc_style.background else None
    
    DucDocStyle.DucDocStyleStart(builder)
    if paragraph_formatting_offset is not None:
        DucDocStyle.DucDocStyleAddParagraphFormatting(builder, paragraph_formatting_offset)
    if stack_format_offset is not None:
        DucDocStyle.DucDocStyleAddStackFormat(builder, stack_format_offset)
    if text_style_offset is not None:
        DucDocStyle.DucDocStyleAddTextStyle(builder, text_style_offset)
    if background_offset is not None:
        DucDocStyle.DucDocStyleAddBackground(builder, background_offset)
    return DucDocStyle.DucDocStyleEnd(builder)


def serialize_fbs_duc_viewport_style(builder: flatbuffers.Builder, viewport_style: DucViewportStyle) -> int:
    """Serialize DucViewportStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_element_stroke, serialize_fbs_element_background

    border_stroke_offset = serialize_fbs_element_stroke(builder, viewport_style.border_stroke) if viewport_style.border_stroke else None
    border_background_offset = serialize_fbs_element_background(builder, viewport_style.border_background) if viewport_style.border_background else None
    
    DucViewportStyle.DucViewportStyleStart(builder)
    if border_stroke_offset is not None:
        DucViewportStyle.DucViewportStyleAddBorderStroke(builder, border_stroke_offset)
    if border_background_offset is not None:
        DucViewportStyle.DucViewportStyleAddBorderBackground(builder, border_background_offset)
    DucViewportStyle.DucViewportStyleAddShadePlot(builder, viewport_style.shade_plot)
    DucViewportStyle.DucViewportStyleAddClipping(builder, viewport_style.clipping)
    DucViewportStyle.DucViewportStyleAddDisplayLocked(builder, viewport_style.display_locked)
    DucViewportStyle.DucViewportStyleAddStandardScale(builder, viewport_style.standard_scale)
    return DucViewportStyle.DucViewportStyleEnd(builder)


def serialize_fbs_duc_plot_style(builder: flatbuffers.Builder, plot_style: DucPlotStyle) -> int:
    """Serialize DucPlotStyle to FlatBuffers."""
    # Create vectors for arrays
    DucPlotStyle.DucPlotStyleStart(builder)
    # Note: Need to implement vector creation for line_weights, colors, pen_assignments, fill_patterns
    # This would require additional vector creation functions
    return DucPlotStyle.DucPlotStyleEnd(builder)


def serialize_fbs_duc_xray_style(builder: flatbuffers.Builder, xray_style: DucXRayStyle) -> int:
    """Serialize DucXRayStyle to FlatBuffers."""
    color_offset = builder.CreateString(xray_style.color)
    
    DucXRayStyle.DucXRayStyleStart(builder)
    DucXRayStyle.DucXRayStyleAddOpacity(builder, xray_style.opacity)
    DucXRayStyle.DucXRayStyleAddColor(builder, color_offset)
    DucXRayStyle.DucXRayStyleAddShowBehind(builder, xray_style.show_behind)
    DucXRayStyle.DucXRayStyleAddShowInFront(builder, xray_style.show_in_front)
    return DucXRayStyle.DucXRayStyleEnd(builder)


def serialize_fbs_tracking_line_style(builder: flatbuffers.Builder, tracking_line_style: TrackingLineStyle) -> int:
    """Serialize TrackingLineStyle to FlatBuffers."""
    color_offset = builder.CreateString(tracking_line_style.color)
    
    FBTrackingLineStyle.TrackingLineStyleStart(builder)
    FBTrackingLineStyle.TrackingLineStyleAddColor(builder, color_offset)
    FBTrackingLineStyle.TrackingLineStyleAddOpacity(builder, tracking_line_style.opacity)
    dash_pattern_offset = None
    if tracking_line_style.dash_pattern:
        dash_pattern_offset = FBTrackingLineStyle.TrackingLineStyleCreateDashPatternVector(builder, tracking_line_style.dash_pattern)
    if dash_pattern_offset is not None:
        FBTrackingLineStyle.TrackingLineStyleAddDashPattern(builder, dash_pattern_offset)
    return FBTrackingLineStyle.TrackingLineStyleEnd(builder)

def serialize_fbs_identified_common_style(builder: flatbuffers.Builder, identified_style: IdentifiedCommonStyle) -> int:
    """Serialize IdentifiedCommonStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier
    # Import here to break circular dependency
    # Removed import of serialize_fbs_duc_common_style from base_elements, as it's defined here.

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_common_style(builder, identified_style.style)

    FBIdentifiedCommonStyle.IdentifiedCommonStyleStart(builder)
    FBIdentifiedCommonStyle.IdentifiedCommonStyleAddId(builder, id_offset)
    FBIdentifiedCommonStyle.IdentifiedCommonStyleAddStyle(builder, style_offset)
    return FBIdentifiedCommonStyle.IdentifiedCommonStyleEnd(builder)

def serialize_fbs_identified_stack_like_style(builder: flatbuffers.Builder, identified_style: IdentifiedStackLikeStyle) -> int:
    """Serialize IdentifiedStackLikeStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier
    
    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_stack_like_styles(builder, identified_style.style)

    FBIdentifiedStackLikeStyle.IdentifiedStackLikeStyleStart(builder)
    FBIdentifiedStackLikeStyle.IdentifiedStackLikeStyleAddId(builder, id_offset)
    FBIdentifiedStackLikeStyle.IdentifiedStackLikeStyleAddStyle(builder, style_offset)
    return FBIdentifiedStackLikeStyle.IdentifiedStackLikeStyleEnd(builder)

def serialize_fbs_identified_text_style(builder: flatbuffers.Builder, identified_style: IdentifiedTextStyle) -> int:
    """Serialize IdentifiedTextStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_text_style(builder, identified_style.style)

    FBIdentifiedTextStyle.IdentifiedTextStyleStart(builder)
    FBIdentifiedTextStyle.IdentifiedTextStyleAddId(builder, id_offset)
    FBIdentifiedTextStyle.IdentifiedTextStyleAddStyle(builder, style_offset)
    return FBIdentifiedTextStyle.IdentifiedTextStyleEnd(builder)

def serialize_fbs_identified_dimension_style(builder: flatbuffers.Builder, identified_style: IdentifiedDimensionStyle) -> int:
    """Serialize IdentifiedDimensionStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_dimension_style(builder, identified_style.style)

    FBIdentifiedDimensionStyle.IdentifiedDimensionStyleStart(builder)
    FBIdentifiedDimensionStyle.IdentifiedDimensionStyleAddId(builder, id_offset)
    FBIdentifiedDimensionStyle.IdentifiedDimensionStyleAddStyle(builder, style_offset)
    return FBIdentifiedDimensionStyle.IdentifiedDimensionStyleEnd(builder)

def serialize_fbs_identified_leader_style(builder: flatbuffers.Builder, identified_style: IdentifiedLeaderStyle) -> int:
    """Serialize IdentifiedLeaderStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_leader_style(builder, identified_style.style)

    FBIdentifiedLeaderStyle.IdentifiedLeaderStyleStart(builder)
    FBIdentifiedLeaderStyle.IdentifiedLeaderStyleAddId(builder, id_offset)
    FBIdentifiedLeaderStyle.IdentifiedLeaderStyleAddStyle(builder, style_offset)
    return FBIdentifiedLeaderStyle.IdentifiedLeaderStyleEnd(builder)

def serialize_fbs_identified_fcf_style(builder: flatbuffers.Builder, identified_style: IdentifiedFCFStyle) -> int:
    """Serialize IdentifiedFCFStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_feature_control_frame_style(builder, identified_style.style)

    FBIdentifiedFCFStyle.IdentifiedFCFStyleStart(builder)
    FBIdentifiedFCFStyle.IdentifiedFCFStyleAddId(builder, id_offset)
    FBIdentifiedFCFStyle.IdentifiedFCFStyleAddStyle(builder, style_offset)
    return FBIdentifiedFCFStyle.IdentifiedFCFStyleEnd(builder)

def serialize_fbs_identified_table_style(builder: flatbuffers.Builder, identified_style: IdentifiedTableStyle) -> int:
    """Serialize IdentifiedTableStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_table_style(builder, identified_style.style)

    FBIdentifiedTableStyle.IdentifiedTableStyleStart(builder)
    FBIdentifiedTableStyle.IdentifiedTableStyleAddId(builder, id_offset)
    FBIdentifiedTableStyle.IdentifiedTableStyleAddStyle(builder, style_offset)
    return FBIdentifiedTableStyle.IdentifiedTableStyleEnd(builder)

def serialize_fbs_identified_doc_style(builder: flatbuffers.Builder, identified_style: IdentifiedDocStyle) -> int:
    """Serialize IdentifiedDocStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_doc_style(builder, identified_style.style)

    FBIdentifiedDocStyle.IdentifiedDocStyleStart(builder)
    FBIdentifiedDocStyle.IdentifiedDocStyleAddId(builder, id_offset)
    FBIdentifiedDocStyle.IdentifiedDocStyleAddStyle(builder, style_offset)
    return FBIdentifiedDocStyle.IdentifiedDocStyleEnd(builder)

def serialize_fbs_identified_viewport_style(builder: flatbuffers.Builder, identified_style: IdentifiedViewportStyle) -> int:
    """Serialize IdentifiedViewportStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_viewport_style(builder, identified_style.style)

    FBIdentifiedViewportStyle.IdentifiedViewportStyleStart(builder)
    FBIdentifiedViewportStyle.IdentifiedViewportStyleAddId(builder, id_offset)
    FBIdentifiedViewportStyle.IdentifiedViewportStyleAddStyle(builder, style_offset)
    return FBIdentifiedViewportStyle.IdentifiedViewportStyleEnd(builder)

def serialize_fbs_identified_hatch_style(builder: flatbuffers.Builder, identified_style: IdentifiedHatchStyle) -> int:
    """Serialize IdentifiedHatchStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_hatch_style(builder, identified_style.style)

    FBIdentifiedHatchStyle.IdentifiedHatchStyleStart(builder)
    FBIdentifiedHatchStyle.IdentifiedHatchStyleAddId(builder, id_offset)
    FBIdentifiedHatchStyle.IdentifiedHatchStyleAddStyle(builder, style_offset)
    return FBIdentifiedHatchStyle.IdentifiedHatchStyleEnd(builder)

def serialize_fbs_identified_xray_style(builder: flatbuffers.Builder, identified_style: IdentifiedXRayStyle) -> int:
    """Serialize IdentifiedXRayStyle to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_base_elements import serialize_fbs_identifier

    id_offset = serialize_fbs_identifier(builder, identified_style.id)
    style_offset = serialize_fbs_duc_xray_style(builder, identified_style.style)

    FBIdentifiedXRayStyle.IdentifiedXRayStyleStart(builder)
    FBIdentifiedXRayStyle.IdentifiedXRayStyleAddId(builder, id_offset)
    FBIdentifiedXRayStyle.IdentifiedXRayStyleAddStyle(builder, style_offset)
    return FBIdentifiedXRayStyle.IdentifiedXRayStyleEnd(builder)

def serialize_fbs_standard_styles(builder: flatbuffers.Builder, standard_styles: StandardStyles) -> int:
    """Serialize StandardStyles to FlatBuffers."""
    common_styles_offsets = []
    for style in standard_styles.common_styles:
        common_styles_offsets.append(serialize_fbs_identified_common_style(builder, style))
    
    stack_like_styles_offsets = []
    for style in standard_styles.stack_like_styles:
        stack_like_styles_offsets.append(serialize_fbs_identified_stack_like_style(builder, style))
    
    text_styles_offsets = []
    for style in standard_styles.text_styles:
        text_styles_offsets.append(serialize_fbs_identified_text_style(builder, style))

    dimension_styles_offsets = []
    for style in standard_styles.dimension_styles:
        dimension_styles_offsets.append(serialize_fbs_identified_dimension_style(builder, style))

    leader_styles_offsets = []
    for style in standard_styles.leader_styles:
        leader_styles_offsets.append(serialize_fbs_identified_leader_style(builder, style))

    feature_control_frame_styles_offsets = []
    for style in standard_styles.feature_control_frame_styles:
        feature_control_frame_styles_offsets.append(serialize_fbs_identified_fcf_style(builder, style))

    table_styles_offsets = []
    for style in standard_styles.table_styles:
        table_styles_offsets.append(serialize_fbs_identified_table_style(builder, style))

    doc_styles_offsets = []
    for style in standard_styles.doc_styles:
        doc_styles_offsets.append(serialize_fbs_identified_doc_style(builder, style))

    viewport_styles_offsets = []
    for style in standard_styles.viewport_styles:
        viewport_styles_offsets.append(serialize_fbs_identified_viewport_style(builder, style))

    hatch_styles_offsets = []
    for style in standard_styles.hatch_styles:
        hatch_styles_offsets.append(serialize_fbs_identified_hatch_style(builder, style))

    xray_styles_offsets = []
    for style in standard_styles.xray_styles:
        xray_styles_offsets.append(serialize_fbs_identified_xray_style(builder, style))
    
    StandardStylesStart(builder)
    StandardStylesAddCommonStyles(builder, builder.CreateVector(list(reversed(common_styles_offsets))))
    StandardStylesAddStackLikeStyles(builder, builder.CreateVector(list(reversed(stack_like_styles_offsets))))
    StandardStylesAddTextStyles(builder, builder.CreateVector(list(reversed(text_styles_offsets))))
    StandardStylesAddDimensionStyles(builder, builder.CreateVector(list(reversed(dimension_styles_offsets))))
    StandardStylesAddLeaderStyles(builder, builder.CreateVector(list(reversed(leader_styles_offsets))))
    StandardStylesAddFeatureControlFrameStyles(builder, builder.CreateVector(list(reversed(feature_control_frame_styles_offsets))))
    StandardStylesAddTableStyles(builder, builder.CreateVector(list(reversed(table_styles_offsets))))
    StandardStylesAddDocStyles(builder, builder.CreateVector(list(reversed(doc_styles_offsets))))
    StandardStylesAddViewportStyles(builder, builder.CreateVector(list(reversed(viewport_styles_offsets))))
    StandardStylesAddHatchStyles(builder, builder.CreateVector(list(reversed(hatch_styles_offsets))))
    StandardStylesAddXrayStyles(builder, builder.CreateVector(list(reversed(xray_styles_offsets))))
    return StandardStylesEnd(builder)
