"""
Helper serialization functions for complex element sub-structures.
This module provides serialization for complex sub-components used across multiple element types.
"""

import flatbuffers
from typing import List, Optional

# Import dataclasses from comprehensive classes
from ..classes.ElementsClass import (
    # Text-related structures
    DucTextDynamicPart, DucTextDynamicSource, DucTextDynamicElementSource,
    DucTextDynamicDictionarySource,
    
    # FreeDraw structures
    DucFreeDrawEnds, DucPath, DucLine, DucLineReference,
    
    # Block structures
    DucBlockDuplicationArray, DucBlockAttributeDefinition,
    
    # Plot structures
    PlotLayout,
    
    # Leader structures
    LeaderContent, LeaderTextBlockContent, LeaderBlockContent,
    
    # Dimension structures
    DimensionDefinitionPoints, DimensionBindings, DimensionBaselineData, DimensionContinueData,
    
    # Feature Control Frame structures
    FeatureControlFrameSegment, FCFFrameModifiers, FCFDatumDefinition, FCFBetweenModifier,
    FCFProjectedZoneModifier, DatumReference, ToleranceClause,
    
    # Doc structures
    ColumnLayout, TextColumn,
    
    # Parametric structures
    ParametricSource,
    
    # Base structures
    DucLinearElementBase,
)
from ..classes.StandardsClass import SnapMarkerStyle

# Import FlatBuffers generated classes for sub-structures
from ..Duc.DucTextDynamicPart import (
    DucTextDynamicPartStart, DucTextDynamicPartEnd,
    DucTextDynamicPartAddSource
)
from ..Duc.DucTextDynamicSource import (
    DucTextDynamicSourceStart, DucTextDynamicSourceEnd
)
from ..Duc.DucPath import (
    DucPathStart, DucPathEnd,
    DucPathAddLineIndices, DucPathStartLineIndicesVector
)
from ..Duc.DucLine import (
    DucLineStart, DucLineEnd,
    DucLineAddStart, DucLineAddEnd
)
from ..Duc.DucFreeDrawEnds import (
    DucFreeDrawEndsStart, DucFreeDrawEndsEnd,
    DucFreeDrawEndsAddCap, DucFreeDrawEndsAddTaper, DucFreeDrawEndsAddEasing
)
from ..Duc.DucBlockDuplicationArray import (
    DucBlockDuplicationArrayStart, DucBlockDuplicationArrayEnd,
    DucBlockDuplicationArrayAddRows, DucBlockDuplicationArrayAddCols,
    DucBlockDuplicationArrayAddRowSpacing, DucBlockDuplicationArrayAddColSpacing
)
from ..Duc.PlotLayout import (
    PlotLayoutStart, PlotLayoutEnd,
    PlotLayoutAddMargins
)
from ..Duc.Margins import Margins
from ..Duc.LeaderContent import (
    LeaderContentStart, LeaderContentEnd,
    LeaderContentAddLeaderContentType
)
from ..Duc.DimensionDefinitionPoints import (
    DimensionDefinitionPointsStart, DimensionDefinitionPointsEnd,
    DimensionDefinitionPointsAddOrigin1, DimensionDefinitionPointsAddOrigin2,
    DimensionDefinitionPointsAddLocation, DimensionDefinitionPointsAddCenter,
    DimensionDefinitionPointsAddJog
)
from ..Duc.DimensionBindings import (
    DimensionBindingsStart, DimensionBindingsEnd,
    DimensionBindingsAddOrigin1, DimensionBindingsAddOrigin2, DimensionBindingsAddCenter
)
from ..Duc.ParametricSource import (
    ParametricSourceStart, ParametricSourceEnd,
    ParametricSourceAddType, ParametricSourceAddCode, ParametricSourceAddFileId
)
from ..Duc.ColumnLayout import (
    ColumnLayoutStart, ColumnLayoutEnd,
    ColumnLayoutAddType, ColumnLayoutAddDefinitions, ColumnLayoutStartDefinitionsVector,
    ColumnLayoutAddAutoHeight
)
from ..Duc.TextColumn import (
    TextColumnStart, TextColumnEnd,
    TextColumnAddWidth, TextColumnAddGutter
)
from ..Duc.SnapMarkerStyle import (
    SnapMarkerStyleStart, SnapMarkerStyleEnd,
    SnapMarkerStyleAddShape, SnapMarkerStyleAddColor
)
from ..Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE

# Import base element helpers
from .serialize_base_elements import (
    serialize_fbs_duc_point, serialize_fbs_duc_head, serialize_fbs_margins,
    serialize_fbs_duc_point_binding
)


def serialize_fbs_duc_text_dynamic_source(builder: flatbuffers.Builder, source: DucTextDynamicSource) -> int:
    """Serialize DucTextDynamicSource to FlatBuffers."""
    DucTextDynamicSourceStart(builder)
    # Add specific source type fields based on the actual union type
    return DucTextDynamicSourceEnd(builder)


def serialize_fbs_duc_text_dynamic_part(builder: flatbuffers.Builder, dynamic_part: DucTextDynamicPart) -> int:
    """Serialize DucTextDynamicPart to FlatBuffers."""
    content_offset = builder.CreateString(dynamic_part.content)
    source_offset = serialize_fbs_duc_text_dynamic_source(builder, dynamic_part.source) if dynamic_part.source else None
    
    DucTextDynamicPartStart(builder)
    if source_offset:
        DucTextDynamicPartAddSource(builder, source_offset)
    return DucTextDynamicPartEnd(builder)


def serialize_fbs_duc_line(builder: flatbuffers.Builder, line: DucLine) -> int:
    """Serialize DucLine to FlatBuffers."""
    start_offset = serialize_fbs_duc_point(builder, line.start)
    end_offset = serialize_fbs_duc_point(builder, line.end)
    
    DucLineStart(builder)
    DucLineAddStart(builder, start_offset)
    DucLineAddEnd(builder, end_offset)
    return DucLineEnd(builder)


def serialize_fbs_duc_path(builder: flatbuffers.Builder, path: DucPath) -> int:
    """Serialize DucPath to FlatBuffers."""
    # Serialize lines
    lines_offsets = []
    for line in path.lines:
        lines_offsets.append(serialize_fbs_duc_line(builder, line))
    
    DucPathStartLineIndicesVector(builder, len(lines_offsets))
    for offset in reversed(lines_offsets):
        builder.PrependUOffsetTRelative(offset)
    lines_vector = builder.EndVector()
    
    DucPathStart(builder)
    DucPathAddLineIndices(builder, lines_vector)
    return DucPathEnd(builder)


def serialize_fbs_duc_free_draw_ends(builder: flatbuffers.Builder, free_draw_ends: DucFreeDrawEnds) -> int:
    """Serialize DucFreeDrawEnds to FlatBuffers."""
    # Removed: start_head_offset and end_head_offset creation as they are not present in DucFreeDrawEnds
    
    easing_offset = None
    if free_draw_ends.easing:
        easing_offset = builder.CreateString(free_draw_ends.easing)

    DucFreeDrawEndsStart(builder)
    # Removed: if start_head_offset is not None: DucFreeDrawEndsAddStartHead(builder, start_head_offset)
    # Removed: if end_head_offset is not None: DucFreeDrawEndsAddEndHead(builder, end_head_offset)
    DucFreeDrawEndsAddCap(builder, free_draw_ends.cap)
    DucFreeDrawEndsAddTaper(builder, free_draw_ends.taper)
    if easing_offset:
        DucFreeDrawEndsAddEasing(builder, easing_offset)
    return DucFreeDrawEndsEnd(builder)


def serialize_fbs_duc_linear_element_base(builder: flatbuffers.Builder, linear_base: DucLinearElementBase) -> int:
    """Serialize DucLinearElementBase to FlatBuffers."""
    # This needs to be implemented based on the actual structure
    # For now, return a placeholder
    return 0


def serialize_fbs_duc_block_duplication_array(builder: flatbuffers.Builder, duplication_array: DucBlockDuplicationArray) -> int:
    """Serialize DucBlockDuplicationArray to FlatBuffers."""
    DucBlockDuplicationArrayStart(builder)
    DucBlockDuplicationArrayAddRows(builder, duplication_array.rows)
    DucBlockDuplicationArrayAddCols(builder, duplication_array.cols)
    DucBlockDuplicationArrayAddRowSpacing(builder, duplication_array.row_spacing)
    DucBlockDuplicationArrayAddColSpacing(builder, duplication_array.col_spacing)
    return DucBlockDuplicationArrayEnd(builder)


def serialize_fbs_plot_layout(builder: flatbuffers.Builder, plot_layout: PlotLayout) -> int:
    """Serialize PlotLayout to FlatBuffers."""
    margins_offset = None
    if plot_layout.margins:
        margins_offset = serialize_fbs_margins(builder, plot_layout.margins)

    PlotLayoutStart(builder)
    if margins_offset:
        PlotLayoutAddMargins(builder, margins_offset)
    return PlotLayoutEnd(builder)


def serialize_fbs_leader_content(builder: flatbuffers.Builder, content: LeaderContent) -> int:
    """Serialize LeaderContent to FlatBuffers."""
    text_block_content_offset = None
    block_content_offset = None
    
    if isinstance(content, LeaderTextBlockContent):
        # Serialize text block content
        pass
    elif isinstance(content, LeaderBlockContent):
        # Serialize block content
        pass
    
    LeaderContentStart(builder)
    LeaderContentAddType(builder, content.type)
    if text_block_content_offset:
        LeaderContentAddTextBlockContent(builder, text_block_content_offset)
    if block_content_offset:
        LeaderContentAddBlockContent(builder, block_content_offset)
    return LeaderContentEnd(builder)


def serialize_fbs_dimension_definition_points(builder: flatbuffers.Builder, definition_points: DimensionDefinitionPoints) -> int:
    """Serialize DimensionDefinitionPoints to FlatBuffers."""
    origin1_offset = serialize_fbs_duc_point(builder, definition_points.origin1)
    origin2_offset = serialize_fbs_duc_point(builder, definition_points.origin2)
    location_offset = serialize_fbs_duc_point(builder, definition_points.location) if definition_points.location else None
    center_offset = serialize_fbs_duc_point(builder, definition_points.center) if definition_points.center else None
    jog_offset = serialize_fbs_duc_point(builder, definition_points.jog) if definition_points.jog else None
    
    DimensionDefinitionPointsStart(builder)
    DimensionDefinitionPointsAddOrigin1(builder, origin1_offset)
    DimensionDefinitionPointsAddOrigin2(builder, origin2_offset)
    if location_offset is not None:
        DimensionDefinitionPointsAddLocation(builder, location_offset)
    if center_offset is not None:
        DimensionDefinitionPointsAddCenter(builder, center_offset)
    if jog_offset is not None:
        DimensionDefinitionPointsAddJog(builder, jog_offset)
    return DimensionDefinitionPointsEnd(builder)


def serialize_fbs_dimension_bindings(builder: flatbuffers.Builder, bindings: DimensionBindings) -> int:
    """Serialize DimensionBindings to FlatBuffers."""
    origin1_offset = serialize_fbs_duc_point_binding(builder, bindings.origin1) if bindings.origin1 else None
    origin2_offset = serialize_fbs_duc_point_binding(builder, bindings.origin2) if bindings.origin2 else None
    center_offset = serialize_fbs_duc_point_binding(builder, bindings.center) if bindings.center else None

    DimensionBindingsStart(builder)
    if origin1_offset is not None:
        DimensionBindingsAddOrigin1(builder, origin1_offset)
    if origin2_offset is not None:
        DimensionBindingsAddOrigin2(builder, origin2_offset)
    if center_offset is not None:
        DimensionBindingsAddCenter(builder, center_offset)
    return DimensionBindingsEnd(builder)


def serialize_fbs_dimension_baseline_data(builder: flatbuffers.Builder, baseline_data: DimensionBaselineData) -> int:
    """Serialize DimensionBaselineData to FlatBuffers."""
    # Implementation needed based on actual structure
    return 0


def serialize_fbs_dimension_continue_data(builder: flatbuffers.Builder, continue_data: DimensionContinueData) -> int:
    """Serialize DimensionContinueData to FlatBuffers."""
    # Implementation needed based on actual structure
    return 0


def serialize_fbs_feature_control_frame_segment(builder: flatbuffers.Builder, segment: FeatureControlFrameSegment) -> int:
    """Serialize FeatureControlFrameSegment to FlatBuffers."""
    # Implementation needed based on actual structure
    return 0


def serialize_fbs_fcf_frame_modifiers(builder: flatbuffers.Builder, modifiers: FCFFrameModifiers) -> int:
    """Serialize FCFFrameModifiers to FlatBuffers."""
    # Implementation needed based on actual structure
    return 0


def serialize_fbs_fcf_datum_definition(builder: flatbuffers.Builder, datum_def: FCFDatumDefinition) -> int:
    """Serialize FCFDatumDefinition to FlatBuffers."""
    # Implementation needed based on actual structure
    return 0


def serialize_fbs_text_column(builder: flatbuffers.Builder, text_column: TextColumn) -> int:
    """Serialize TextColumn to FlatBuffers."""
    TextColumnStart(builder)
    TextColumnAddWidth(builder, text_column.width)
    TextColumnAddGutter(builder, text_column.gutter)
    return TextColumnEnd(builder)


def serialize_fbs_column_layout(builder: flatbuffers.Builder, column_layout: ColumnLayout) -> int:
    """Serialize ColumnLayout to FlatBuffers."""
    definitions_offset = None
    if column_layout.definitions:
        definitions_offsets = []
        for definition in column_layout.definitions:
            definitions_offsets.append(serialize_fbs_text_column(builder, definition))
        
        ColumnLayoutStartDefinitionsVector(builder, len(definitions_offsets))
        for offset in reversed(definitions_offsets):
            builder.PrependUOffsetTRelative(offset)
        definitions_offset = builder.EndVector()
    
    ColumnLayoutStart(builder)
    ColumnLayoutAddType(builder, column_layout.type)
    if definitions_offset is not None:
        ColumnLayoutAddDefinitions(builder, definitions_offset)
    ColumnLayoutAddAutoHeight(builder, column_layout.auto_height)
    return ColumnLayoutEnd(builder)


def serialize_fbs_parametric_source(builder: flatbuffers.Builder, parametric_source: ParametricSource) -> int:
    """Serialize ParametricSource to FlatBuffers."""
    code_offset = builder.CreateString(parametric_source.code) if parametric_source.code else None
    file_id_offset = builder.CreateString(parametric_source.file_id) if parametric_source.file_id else None
    
    ParametricSourceStart(builder)
    if parametric_source.type is not None:
        ParametricSourceAddType(builder, parametric_source.type)
    if code_offset is not None:
        ParametricSourceAddCode(builder, code_offset)
    if file_id_offset is not None:
        ParametricSourceAddFileId(builder, file_id_offset)
    return ParametricSourceEnd(builder)


def serialize_fbs_snap_marker_style(builder: flatbuffers.Builder, style: SnapMarkerStyle) -> int:
    """Serialize SnapMarkerStyle to FlatBuffers."""
    color_offset = builder.CreateString(style.color)

    SnapMarkerStyleStart(builder)
    SnapMarkerStyleAddShape(builder, style.shape)
    SnapMarkerStyleAddColor(builder, color_offset)
    return SnapMarkerStyleEnd(builder)
