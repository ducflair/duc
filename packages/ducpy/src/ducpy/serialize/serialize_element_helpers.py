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
    DucPathAddLineIndices, DucPathStartLineIndicesVector,
    DucPathAddBackground, DucPathAddStroke
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
    LeaderContentAddLeaderContentType, LeaderContentAddContentType, LeaderContentAddContent
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
    from .serialize_base_elements import serialize_fbs_duc_line_reference
    
    start_offset = serialize_fbs_duc_line_reference(builder, line.start)
    end_offset = serialize_fbs_duc_line_reference(builder, line.end)
    
    DucLineStart(builder)
    DucLineAddStart(builder, start_offset)
    DucLineAddEnd(builder, end_offset)
    return DucLineEnd(builder)


def serialize_fbs_duc_path(builder: flatbuffers.Builder, path: DucPath) -> int:
    """Serialize DucPath to FlatBuffers."""
    from .serialize_base_elements import serialize_fbs_element_background, serialize_fbs_element_stroke
    
    line_indices_vector = None
    if path.line_indices:
        DucPathStartLineIndicesVector(builder, len(path.line_indices))
        for index in reversed(path.line_indices):
            builder.PrependInt32(index)
        line_indices_vector = builder.EndVector()
    
    background_offset = None
    if path.background:
        background_offset = serialize_fbs_element_background(builder, path.background)
    
    stroke_offset = None
    if path.stroke:
        stroke_offset = serialize_fbs_element_stroke(builder, path.stroke)
    
    DucPathStart(builder)
    if line_indices_vector is not None:
        DucPathAddLineIndices(builder, line_indices_vector)
    if background_offset is not None:
        DucPathAddBackground(builder, background_offset)
    if stroke_offset is not None:
        DucPathAddStroke(builder, stroke_offset)
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
    from .serialize_element_base import serialize_fbs_duc_element_base
    from ..Duc._DucLinearElementBase import (
        _DucLinearElementBaseStart, _DucLinearElementBaseEnd,
        _DucLinearElementBaseAddBase, _DucLinearElementBaseAddStartBinding,
        _DucLinearElementBaseAddEndBinding, _DucLinearElementBaseAddPoints,
        _DucLinearElementBaseAddLines, _DucLinearElementBaseAddPathOverrides,
        _DucLinearElementBaseAddLastCommittedPoint, _DucLinearElementBaseStartPointsVector,
        _DucLinearElementBaseStartLinesVector, _DucLinearElementBaseStartPathOverridesVector
    )
    
    element_base_offset = serialize_fbs_duc_element_base(builder, linear_base.base) if linear_base.base else None
    start_binding_offset = serialize_fbs_duc_point_binding(builder, linear_base.start_binding) if linear_base.start_binding else None
    end_binding_offset = serialize_fbs_duc_point_binding(builder, linear_base.end_binding) if linear_base.end_binding else None
    
    points_offsets = []
    for point in linear_base.points:
        points_offsets.append(serialize_fbs_duc_point(builder, point))
    
    points_vector = None
    if points_offsets:
        _DucLinearElementBaseStartPointsVector(builder, len(points_offsets))
        for offset in reversed(points_offsets):
            builder.PrependUOffsetTRelative(offset)
        points_vector = builder.EndVector()
    
    lines_offsets = []
    for line in linear_base.lines:
        lines_offsets.append(serialize_fbs_duc_line(builder, line))
    
    lines_vector = None
    if lines_offsets:
        _DucLinearElementBaseStartLinesVector(builder, len(lines_offsets))
        for offset in reversed(lines_offsets):
            builder.PrependUOffsetTRelative(offset)
        lines_vector = builder.EndVector()
    
    path_overrides_offsets = []
    for path in linear_base.path_overrides:
        path_overrides_offsets.append(serialize_fbs_duc_path(builder, path))
    
    path_overrides_vector = None
    if path_overrides_offsets:
        _DucLinearElementBaseStartPathOverridesVector(builder, len(path_overrides_offsets))
        for offset in reversed(path_overrides_offsets):
            builder.PrependUOffsetTRelative(offset)
        path_overrides_vector = builder.EndVector()
    
    last_committed_point_offset = serialize_fbs_duc_point(builder, linear_base.last_committed_point) if linear_base.last_committed_point else None
    
    _DucLinearElementBaseStart(builder)
    if element_base_offset is not None:
        _DucLinearElementBaseAddBase(builder, element_base_offset)
    if points_vector is not None:
        _DucLinearElementBaseAddPoints(builder, points_vector)
    if lines_vector is not None:
        _DucLinearElementBaseAddLines(builder, lines_vector)
    if path_overrides_vector is not None:
        _DucLinearElementBaseAddPathOverrides(builder, path_overrides_vector)
    if last_committed_point_offset is not None:
        _DucLinearElementBaseAddLastCommittedPoint(builder, last_committed_point_offset)
    if start_binding_offset is not None:
        _DucLinearElementBaseAddStartBinding(builder, start_binding_offset)
    if end_binding_offset is not None:
        _DucLinearElementBaseAddEndBinding(builder, end_binding_offset)
    return _DucLinearElementBaseEnd(builder)


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
    from ..Duc.LeaderTextBlockContent import (
        LeaderTextBlockContentStart, LeaderTextBlockContentEnd,
        LeaderTextBlockContentAddText
    )
    from ..Duc.LeaderBlockContent import (
        LeaderBlockContentStart, LeaderBlockContentEnd,
        LeaderBlockContentAddBlockId, LeaderBlockContentAddAttributeValues,
        LeaderBlockContentAddElementOverrides, LeaderBlockContentStartAttributeValuesVector,
        LeaderBlockContentStartElementOverridesVector
    )
    from .serialize_base_elements import serialize_fbs_string_value_entry
    
    content_offset = None
    content_type = 0
    
    if isinstance(content.content, LeaderTextBlockContent):
        text_offset = builder.CreateString(content.content.text)
        LeaderTextBlockContentStart(builder)
        LeaderTextBlockContentAddText(builder, text_offset)
        content_offset = LeaderTextBlockContentEnd(builder)
        content_type = 1  # LeaderTextBlockContent type
    elif isinstance(content.content, LeaderBlockContent):
        block_id_offset = builder.CreateString(content.content.block_id)
        
        attribute_values_offsets = []
        if content.content.attribute_values:
            for attr_val in content.content.attribute_values:
                attribute_values_offsets.append(serialize_fbs_string_value_entry(builder, attr_val))
        
        attribute_values_vector = None
        if attribute_values_offsets:
            LeaderBlockContentStartAttributeValuesVector(builder, len(attribute_values_offsets))
            for offset in reversed(attribute_values_offsets):
                builder.PrependUOffsetTRelative(offset)
            attribute_values_vector = builder.EndVector()
        
        element_overrides_offsets = []
        if content.content.element_overrides:
            for elem_override in content.content.element_overrides:
                element_overrides_offsets.append(serialize_fbs_string_value_entry(builder, elem_override))
        
        element_overrides_vector = None
        if element_overrides_offsets:
            LeaderBlockContentStartElementOverridesVector(builder, len(element_overrides_offsets))
            for offset in reversed(element_overrides_offsets):
                builder.PrependUOffsetTRelative(offset)
            element_overrides_vector = builder.EndVector()
        
        LeaderBlockContentStart(builder)
        LeaderBlockContentAddBlockId(builder, block_id_offset)
        if attribute_values_vector is not None:
            LeaderBlockContentAddAttributeValues(builder, attribute_values_vector)
        if element_overrides_vector is not None:
            LeaderBlockContentAddElementOverrides(builder, element_overrides_vector)
        content_offset = LeaderBlockContentEnd(builder)
        content_type = 2  # LeaderBlockContent type
    
    LeaderContentStart(builder)
    if content.leader_content_type is not None:
        LeaderContentAddLeaderContentType(builder, content.leader_content_type)
    LeaderContentAddContentType(builder, content_type)
    if content_offset is not None:
        LeaderContentAddContent(builder, content_offset)
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
    from ..Duc.DimensionBaselineData import (
        DimensionBaselineDataStart, DimensionBaselineDataEnd,
        DimensionBaselineDataAddBaseDimensionId
    )
    
    base_dimension_id_offset = None
    if baseline_data.base_dimension_id:
        base_dimension_id_offset = builder.CreateString(baseline_data.base_dimension_id)
    
    DimensionBaselineDataStart(builder)
    if base_dimension_id_offset is not None:
        DimensionBaselineDataAddBaseDimensionId(builder, base_dimension_id_offset)
    return DimensionBaselineDataEnd(builder)


def serialize_fbs_dimension_continue_data(builder: flatbuffers.Builder, continue_data: DimensionContinueData) -> int:
    """Serialize DimensionContinueData to FlatBuffers."""
    from ..Duc.DimensionContinueData import (
        DimensionContinueDataStart, DimensionContinueDataEnd,
        DimensionContinueDataAddContinueFromDimensionId
    )
    
    continue_from_dimension_id_offset = None
    if continue_data.continue_from_dimension_id:
        continue_from_dimension_id_offset = builder.CreateString(continue_data.continue_from_dimension_id)
    
    DimensionContinueDataStart(builder)
    if continue_from_dimension_id_offset is not None:
        DimensionContinueDataAddContinueFromDimensionId(builder, continue_from_dimension_id_offset)
    return DimensionContinueDataEnd(builder)


def serialize_fbs_tolerance_clause(builder: flatbuffers.Builder, tolerance: ToleranceClause) -> int:
    """Serialize ToleranceClause to FlatBuffers."""
    from ..Duc.ToleranceClause import (
        ToleranceClauseStart, ToleranceClauseEnd,
        ToleranceClauseAddValue, ToleranceClauseAddZoneType,
        ToleranceClauseAddMaterialCondition, ToleranceClauseAddFeatureModifiers,
        ToleranceClauseStartFeatureModifiersVector
    )
    
    value_offset = builder.CreateString(tolerance.value)
    
    feature_modifiers_vector = None
    if tolerance.feature_modifiers:
        ToleranceClauseStartFeatureModifiersVector(builder, len(tolerance.feature_modifiers))
        for modifier in reversed(tolerance.feature_modifiers):
            builder.PrependUint8(modifier)
        feature_modifiers_vector = builder.EndVector()
    
    ToleranceClauseStart(builder)
    ToleranceClauseAddValue(builder, value_offset)
    if tolerance.zone_type is not None:
        ToleranceClauseAddZoneType(builder, tolerance.zone_type)
    if tolerance.material_condition is not None:
        ToleranceClauseAddMaterialCondition(builder, tolerance.material_condition)
    if feature_modifiers_vector is not None:
        ToleranceClauseAddFeatureModifiers(builder, feature_modifiers_vector)
    return ToleranceClauseEnd(builder)


def serialize_fbs_datum_reference(builder: flatbuffers.Builder, datum_ref: DatumReference) -> int:
    """Serialize DatumReference to FlatBuffers."""
    from ..Duc.DatumReference import (
        DatumReferenceStart, DatumReferenceEnd,
        DatumReferenceAddLetters, DatumReferenceAddModifier
    )
    
    letters_offset = builder.CreateString(datum_ref.letters)
    
    DatumReferenceStart(builder)
    DatumReferenceAddLetters(builder, letters_offset)
    if datum_ref.modifier is not None:
        DatumReferenceAddModifier(builder, datum_ref.modifier)
    return DatumReferenceEnd(builder)


def serialize_fbs_feature_control_frame_segment(builder: flatbuffers.Builder, segment: FeatureControlFrameSegment) -> int:
    """Serialize FeatureControlFrameSegment to FlatBuffers."""
    from ..Duc.FeatureControlFrameSegment import (
        FeatureControlFrameSegmentStart, FeatureControlFrameSegmentEnd,
        FeatureControlFrameSegmentAddSymbol, FeatureControlFrameSegmentAddTolerance,
        FeatureControlFrameSegmentAddDatums, FeatureControlFrameSegmentStartDatumsVector
    )
    
    tolerance_offset = None
    if segment.tolerance:
        tolerance_offset = serialize_fbs_tolerance_clause(builder, segment.tolerance)
    
    datums_offsets = []
    if segment.datums:
        for datum in segment.datums:
            datums_offsets.append(serialize_fbs_datum_reference(builder, datum))
    
    datums_vector = None
    if datums_offsets:
        FeatureControlFrameSegmentStartDatumsVector(builder, len(datums_offsets))
        for offset in reversed(datums_offsets):
            builder.PrependUOffsetTRelative(offset)
        datums_vector = builder.EndVector()
    
    FeatureControlFrameSegmentStart(builder)
    if segment.symbol is not None:
        FeatureControlFrameSegmentAddSymbol(builder, segment.symbol)
    if tolerance_offset is not None:
        FeatureControlFrameSegmentAddTolerance(builder, tolerance_offset)
    if datums_vector is not None:
        FeatureControlFrameSegmentAddDatums(builder, datums_vector)
    return FeatureControlFrameSegmentEnd(builder)


def serialize_fbs_fcf_between_modifier(builder: flatbuffers.Builder, between_modifier: FCFBetweenModifier) -> int:
    """Serialize FCFBetweenModifier to FlatBuffers."""
    from ..Duc.FCFBetweenModifier import (
        FCFBetweenModifierStart, FCFBetweenModifierEnd,
        FCFBetweenModifierAddStart, FCFBetweenModifierAddEnd
    )
    
    start_offset = builder.CreateString(between_modifier.start)
    end_offset = builder.CreateString(between_modifier.end)
    
    FCFBetweenModifierStart(builder)
    FCFBetweenModifierAddStart(builder, start_offset)
    FCFBetweenModifierAddEnd(builder, end_offset)
    return FCFBetweenModifierEnd(builder)


def serialize_fbs_fcf_projected_zone_modifier(builder: flatbuffers.Builder, projected_zone: FCFProjectedZoneModifier) -> int:
    """Serialize FCFProjectedZoneModifier to FlatBuffers."""
    from ..Duc.FCFProjectedZoneModifier import (
        FCFProjectedZoneModifierStart, FCFProjectedZoneModifierEnd,
        FCFProjectedZoneModifierAddValue
    )
    
    FCFProjectedZoneModifierStart(builder)
    FCFProjectedZoneModifierAddValue(builder, projected_zone.value)
    return FCFProjectedZoneModifierEnd(builder)


def serialize_fbs_fcf_frame_modifiers(builder: flatbuffers.Builder, modifiers: FCFFrameModifiers) -> int:
    """Serialize FCFFrameModifiers to FlatBuffers."""
    from ..Duc.FCFFrameModifiers import (
        FCFFrameModifiersStart, FCFFrameModifiersEnd,
        FCFFrameModifiersAddAllAround, FCFFrameModifiersAddAllOver,
        FCFFrameModifiersAddContinuousFeature, FCFFrameModifiersAddBetween,
        FCFFrameModifiersAddProjectedToleranceZone
    )
    
    between_offset = None
    if modifiers.between:
        between_offset = serialize_fbs_fcf_between_modifier(builder, modifiers.between)
    
    projected_zone_offset = None
    if modifiers.projected_tolerance_zone:
        projected_zone_offset = serialize_fbs_fcf_projected_zone_modifier(builder, modifiers.projected_tolerance_zone)
    
    FCFFrameModifiersStart(builder)
    FCFFrameModifiersAddAllAround(builder, modifiers.all_around)
    FCFFrameModifiersAddAllOver(builder, modifiers.all_over)
    FCFFrameModifiersAddContinuousFeature(builder, modifiers.continuous_feature)
    if between_offset is not None:
        FCFFrameModifiersAddBetween(builder, between_offset)
    if projected_zone_offset is not None:
        FCFFrameModifiersAddProjectedToleranceZone(builder, projected_zone_offset)
    return FCFFrameModifiersEnd(builder)


def serialize_fbs_fcf_datum_definition(builder: flatbuffers.Builder, datum_def: FCFDatumDefinition) -> int:
    """Serialize FCFDatumDefinition to FlatBuffers."""
    from ..Duc.FCFDatumDefinition import (
        FCFDatumDefinitionStart, FCFDatumDefinitionEnd,
        FCFDatumDefinitionAddLetter
    )
    
    letter_offset = builder.CreateString(datum_def.letter)
    
    FCFDatumDefinitionStart(builder)
    FCFDatumDefinitionAddLetter(builder, letter_offset)
    return FCFDatumDefinitionEnd(builder)


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
