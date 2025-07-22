"""
Element serialization functions for duc.fbs schema.
This module provides comprehensive serialization for all element types and related structures.
"""

from typing import List, Optional, Union

import flatbuffers

from ..classes.ElementsClass import (
    ColumnLayout, DatumReference, DimensionBaselineData, DimensionBindings,
    DimensionContinueData, DimensionDefinitionPoints, DucArrowElement,
    DucBlock, DucBlockAttributeDefinition, DucBlockDuplicationArray,
    DucBlockInstanceElement, DucDimensionElement, DucDocElement, DucElement,
    DucEllipseElement, DucEmbeddableElement, DucFeatureControlFrameElement,
    DucFrameElement, DucFreeDrawElement, DucFreeDrawEnds, DucImageElement,
    DucLeaderElement, DucLinearElement, DucMermaidElement,
    DucParametricElement, DucPdfElement, DucPlotElement, DucPolygonElement,
    DucRectangleElement, DucTableAutoSize, DucTableCell, DucTableCellSpan,
    DucTableColumn, DucTableElement, DucTableRow,
    DucTextDynamicDictionarySource, DucTextDynamicElementSource,
    DucTextDynamicPart, DucTextDynamicSource, DucTextElement,
    DucViewportElement, DucXRayElement, ElementWrapper, FCFBetweenModifier,
    FCFDatumDefinition, FCFFrameModifiers, FCFProjectedZoneModifier,
    FeatureControlFrameSegment, ImageCrop, LeaderBlockContent, LeaderContent,
    LeaderTextBlockContent, ParametricSource, PlotLayout, TextColumn,
    ToleranceClause)
from ..Duc.DucArrowElement import DucArrowElementAddElbowed
from ..Duc.DucArrowElement import DucArrowElementAddLinearBase
from ..Duc.DucArrowElement import DucArrowElementEnd, DucArrowElementStart
from ..Duc.DucBlockInstanceElement import DucBlockInstanceElementAddBase 
from ..Duc.DucBlockInstanceElement import DucBlockInstanceElementAddElementOverrides
from ..Duc.DucBlockInstanceElement import DucBlockInstanceElementStartElementOverridesVector
from ..Duc.DucBlockInstanceElement import (
    DucBlockInstanceElementAddAttributeValues,
    DucBlockInstanceElementAddBlockId,
    DucBlockInstanceElementAddDuplicationArray, DucBlockInstanceElementEnd,
    DucBlockInstanceElementStart,
    DucBlockInstanceElementStartAttributeValuesVector)
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddBase  # Corrected to AddBase
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddDimensionType  # Corrected to AddDimensionType
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddObliqueAngle  # Added oblique_angle
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddOrdinateAxis  # Added ordinate_axis
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddTextOverride  # Added text_override
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddTextPosition  # Added text_position
from ..Duc.DucDimensionElement import \
    DucDimensionElementAddToleranceOverride  # Added tolerance_override
from ..Duc.DucDimensionElement import (DucDimensionElementAddBaselineData,
                                       DucDimensionElementAddBindings,
                                       DucDimensionElementAddContinueData,
                                       DucDimensionElementAddDefinitionPoints,
                                       DucDimensionElementAddStyle,
                                       DucDimensionElementEnd,
                                       DucDimensionElementStart)
from ..Duc.DucDocElement import DucDocElementAddBase  # Corrected to AddBase
from ..Duc.DucDocElement import \
    DucDocElementAddColumns  # Corrected to AddColumns
from ..Duc.DucDocElement import \
    DucDocElementStartDynamicVector  # Added new fields
from ..Duc.DucDocElement import (DucDocElementAddAutoResize,
                                 DucDocElementAddDynamic,
                                 DucDocElementAddFlowDirection,
                                 DucDocElementAddStyle, DucDocElementAddText,
                                 DucDocElementEnd, DucDocElementStart)
from ..Duc.DucEllipseElement import (  # Removed CreateDucEllipseElement
    DucEllipseElementAddBase, DucEllipseElementAddEndAngle,
    DucEllipseElementAddRatio, DucEllipseElementAddShowAuxCrosshair, 
    DucEllipseElementAddStartAngle, DucEllipseElementEnd, DucEllipseElementStart)
from ..Duc.DucEmbeddableElement import \
    DucEmbeddableElementAddBase  # Corrected to AddBase, removed AddSrc, AddScale, AddStatus
from ..Duc.DucEmbeddableElement import (DucEmbeddableElementEnd,
                                        DucEmbeddableElementStart)
from ..Duc.DucFeatureControlFrameElement import \
    DucFeatureControlFrameElementAddBase  # Corrected to AddBase
from ..Duc.DucFeatureControlFrameElement import \
    DucFeatureControlFrameElementAddFrameModifiers  # Corrected to AddFrameModifiers
from ..Duc.DucFeatureControlFrameElement import \
    DucFeatureControlFrameElementAddLeaderElementId  # Added leader_element_id
from ..Duc.DucFeatureControlFrameElement import \
    DucFeatureControlFrameElementAddRows  # Corrected to AddRows
from ..Duc.DucFeatureControlFrameElement import \
    DucFeatureControlFrameElementStartRowsVector  # Added new vector
from ..Duc.DucFeatureControlFrameElement import (
    DucFeatureControlFrameElementAddDatumDefinition,
    DucFeatureControlFrameElementAddStyle, DucFeatureControlFrameElementEnd,
    DucFeatureControlFrameElementStart)
from ..Duc.DucFrameElement import \
    DucFrameElementAddStackElementBase  # Corrected to AddStackElementBase, removed AddTitle, AddClippingPath
from ..Duc.DucFrameElement import DucFrameElementEnd, DucFrameElementStart
from ..Duc.DucFreeDrawElement import \
    DucFreeDrawElementAddBase  # Corrected to AddBase
from ..Duc.DucFreeDrawElement import \
    DucFreeDrawElementStartPointsVector  # Added new fields
from ..Duc.DucFreeDrawElement import (DucFreeDrawElementAddEasing,
                                      DucFreeDrawElementAddEnd,
                                      DucFreeDrawElementAddLastCommittedPoint,
                                      DucFreeDrawElementAddPoints,
                                      DucFreeDrawElementAddPressures,
                                      DucFreeDrawElementAddSimulatePressure,
                                      DucFreeDrawElementAddSize,
                                      DucFreeDrawElementAddSmoothing,
                                      DucFreeDrawElementAddStart,
                                      DucFreeDrawElementAddStreamline,
                                      DucFreeDrawElementAddSvgPath,
                                      DucFreeDrawElementAddThinning,
                                      DucFreeDrawElementEnd,
                                      DucFreeDrawElementStart)
from ..Duc.DucImageElement import \
    DucImageElementAddBase  # Corrected to AddBase
from ..Duc.DucImageElement import DucImageElementAddFilter  # Added AddFilter
from ..Duc.DucImageElement import (DucImageElementAddCrop,
                                   DucImageElementAddFileId,
                                   DucImageElementAddScale,
                                   DucImageElementAddStatus,
                                   DucImageElementEnd, DucImageElementStart)
from ..Duc.DucLeaderElement import \
    DucLeaderElementAddContentAnchor  # Added content_anchor
from ..Duc.DucLeaderElement import \
    DucLeaderElementAddLinearBase  # Corrected to AddLinearBase
from ..Duc.DucLeaderElement import (DucLeaderElementAddContent,
                                    DucLeaderElementAddStyle,
                                    DucLeaderElementEnd, DucLeaderElementStart)
from ..Duc.DucLinearElement import \
    DucLinearElementAddLinearBase  # Corrected to AddLinearBase
from ..Duc.DucLinearElement import \
    DucLinearElementAddWipeoutBelow  # Added wipeout_below
from ..Duc.DucLinearElement import DucLinearElementEnd, DucLinearElementStart
from ..Duc.DucMermaidElement import (  # Corrected to AddSource, AddTheme, AddSvgPath
    DucMermaidElementAddBase, DucMermaidElementAddSource,
    DucMermaidElementAddSvgPath, DucMermaidElementAddTheme,
    DucMermaidElementEnd, DucMermaidElementStart)
from ..Duc.DucParametricElement import (  # Removed CreateDucParametricElement
    DucParametricElementAddBase, DucParametricElementAddSource,
    DucParametricElementEnd, DucParametricElementStart)
from ..Duc.DucPdfElement import \
    DucPdfElementAddBase  # Removed CreateDucPdfElement
from ..Duc.DucPdfElement import DucPdfElementEnd, DucPdfElementStart
from ..Duc.DucPlotElement import \
    DucPlotElementAddStackElementBase  # Corrected to AddStackElementBase
from ..Duc.DucPlotElement import (DucPlotElementAddLayout,
                                  DucPlotElementAddStyle, DucPlotElementEnd,
                                  DucPlotElementStart)
from ..Duc.DucPolygonElement import (DucPolygonElementAddBase,
                                     DucPolygonElementAddSides,
                                     DucPolygonElementEnd,
                                     DucPolygonElementStart)
from ..Duc.DucRectangleElement import \
    DucRectangleElementAddBase  # Removed CreateDucRectangleElement
from ..Duc.DucRectangleElement import (DucRectangleElementEnd,
                                       DucRectangleElementStart)
from ..Duc.DucTableAutoSize import \
    DucTableAutoSizeAddColumns  # Corrected to AddColumns
from ..Duc.DucTableAutoSize import \
    DucTableAutoSizeAddRows  # Corrected to AddRows
from ..Duc.DucTableAutoSize import DucTableAutoSizeEnd, DucTableAutoSizeStart
from ..Duc.DucTableCell import DucTableCellAddColumnId  # Added AddColumnId
from ..Duc.DucTableCell import DucTableCellAddData  # Corrected to AddData
from ..Duc.DucTableCell import DucTableCellAddLocked  # Added AddLocked
from ..Duc.DucTableCell import DucTableCellAddRowId  # Added AddRowId
from ..Duc.DucTableCell import \
    DucTableCellAddStyleOverrides  # Added AddStyleOverrides
from ..Duc.DucTableCell import (DucTableCellAddSpan, DucTableCellEnd,
                                DucTableCellStart)
from ..Duc.DucTableCellSpan import \
    DucTableCellSpanAddColumns  # Corrected to AddColumns
from ..Duc.DucTableCellSpan import \
    DucTableCellSpanAddRows  # Corrected to AddRows
from ..Duc.DucTableCellSpan import DucTableCellSpanEnd, DucTableCellSpanStart
from ..Duc.DucTableColumn import DucTableColumnAddId  # Added AddId
from ..Duc.DucTableColumn import \
    DucTableColumnAddStyleOverrides  # Added AddStyleOverrides
from ..Duc.DucTableColumn import (DucTableColumnAddWidth, DucTableColumnEnd,
                                  DucTableColumnStart)
from ..Duc.DucTableElement import \
    DucTableElementAddBase  # Corrected to AddBase
from ..Duc.DucTableElement import \
    DucTableElementAddCells  # DucTableElementAddFlowDirection Removed as it belongs to DucTableStyle
from ..Duc.DucTableElement import (DucTableElementAddAutoSize,
                                   DucTableElementAddColumnOrder,
                                   DucTableElementAddColumns,
                                   DucTableElementAddHeaderRowCount,
                                   DucTableElementAddRowOrder,
                                   DucTableElementAddRows,
                                   DucTableElementAddStyle, DucTableElementEnd,
                                   DucTableElementStart,
                                   DucTableElementStartCellsVector,
                                   DucTableElementStartColumnsVector,
                                   DucTableElementStartRowsVector)
from ..Duc.DucTableRow import DucTableRowAddId  # Added AddId
from ..Duc.DucTableRow import \
    DucTableRowAddStyleOverrides  # Added AddStyleOverrides
from ..Duc.DucTableRow import (DucTableRowAddHeight, DucTableRowEnd,
                               DucTableRowStart)
from ..Duc.DucTextElement import DucTextElementAddBase  # Corrected to AddBase
from ..Duc.DucTextElement import \
    DucTextElementAddOriginalText  # Added new fields
from ..Duc.DucTextElement import DucTextElementAddText  # Corrected to AddText
from ..Duc.DucTextElement import (DucTextElementAddAutoResize,
                                  DucTextElementAddContainerId,
                                  DucTextElementAddDynamic,
                                  DucTextElementAddStyle, DucTextElementEnd,
                                  DucTextElementStart,
                                  DucTextElementStartDynamicVector)
from ..Duc.DucViewportElement import \
    DucViewportElementAddLinearBase  # Corrected to AddLinearBase
from ..Duc.DucViewportElement import \
    DucViewportElementAddStackBase  # Added AddStackBase
from ..Duc.DucViewportElement import \
    DucViewportElementStartFrozenGroupIdsVector  # Added new fields
from ..Duc.DucViewportElement import (DucViewportElementAddFrozenGroupIds,
                                      DucViewportElementAddScale,
                                      DucViewportElementAddShadePlot,
                                      DucViewportElementAddStandardOverride,
                                      DucViewportElementAddStyle,
                                      DucViewportElementAddView,
                                      DucViewportElementEnd,
                                      DucViewportElementStart)
from ..Duc.DucXRayElement import DucXRayElementAddBase  # Corrected to AddBase
from ..Duc.DucXRayElement import \
    DucXRayElementAddStartFromOrigin  # Added new fields
from ..Duc.DucXRayElement import (DucXRayElementAddDirection,
                                  DucXRayElementAddOrigin,
                                  DucXRayElementAddStyle, DucXRayElementEnd,
                                  DucXRayElementStart)
from ..Duc.Element import Element as ElementFBType
# Import FlatBuffers generated classes for all element types
from ..Duc.ElementWrapper import (  # Added ElementWrapperAddElementType
    ElementWrapperAddElement, ElementWrapperAddElementType, ElementWrapperEnd,
    ElementWrapperStart)
from ..Duc.ImageCrop import (ImageCropAddHeight,  # Removed CreateImageCrop
                             ImageCropAddWidth, ImageCropAddX, ImageCropAddY,
                             ImageCropEnd, ImageCropStart)
from ..Duc.LeaderContentData import LeaderContentData as LeaderContentFBType
# Import stack element base functions
from ..Duc._DucStackElementBase import (
    _DucStackElementBaseStart, _DucStackElementBaseEnd,
    _DucStackElementBaseAddBase, _DucStackElementBaseAddStackBase,
    _DucStackElementBaseAddClip, _DucStackElementBaseAddLabelVisible,
    _DucStackElementBaseAddStandardOverride
)
from ..Duc._DucStackBase import (
    _DucStackBaseStart, _DucStackBaseEnd,
    _DucStackBaseAddLabel, _DucStackBaseAddDescription,
    _DucStackBaseAddIsCollapsed, _DucStackBaseAddIsPlot,
    _DucStackBaseAddIsVisible, _DucStackBaseAddLocked,
    _DucStackBaseAddStyles
)
# Import from base elements, styles, and helpers
from .serialize_base_elements import (serialize_fbs_bound_element,
                                      serialize_fbs_duc_head,
                                      serialize_fbs_duc_point,
                                      serialize_fbs_duc_view,
                                      serialize_fbs_element_background,
                                      serialize_fbs_element_stroke)
# Import element base serialization (would need to be implemented)
from .serialize_element_base import serialize_fbs_duc_element_base
from .serialize_element_helpers import (
    serialize_fbs_column_layout, serialize_fbs_dimension_baseline_data,
    serialize_fbs_dimension_bindings, serialize_fbs_dimension_continue_data,
    serialize_fbs_dimension_definition_points,
    serialize_fbs_duc_block_duplication_array,
    serialize_fbs_duc_free_draw_ends, serialize_fbs_duc_linear_element_base,
    serialize_fbs_duc_path, serialize_fbs_duc_text_dynamic_part,
    serialize_fbs_fcf_datum_definition, serialize_fbs_fcf_frame_modifiers,
    serialize_fbs_feature_control_frame_segment, serialize_fbs_leader_content,
    serialize_fbs_parametric_source, serialize_fbs_plot_layout)
from .serialize_styles import (serialize_fbs_duc_dimension_style,
                               serialize_fbs_duc_doc_style,
                               serialize_fbs_duc_feature_control_frame_style,
                               serialize_fbs_duc_leader_style,
                               serialize_fbs_duc_plot_style,
                               serialize_fbs_duc_table_cell_style,
                               serialize_fbs_duc_table_style,
                               serialize_fbs_duc_text_style,
                               serialize_fbs_duc_viewport_style,
                               serialize_fbs_duc_xray_style)


def serialize_fbs_duc_rectangle_element(builder: flatbuffers.Builder, rectangle: DucRectangleElement) -> int:
    """Serialize DucRectangleElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, rectangle.base) # Corrected to .base
    
    DucRectangleElementStart(builder)
    DucRectangleElementAddBase(builder, element_base_offset) # Corrected AddElementBase to AddBase
    return DucRectangleElementEnd(builder)


def serialize_fbs_duc_polygon_element(builder: flatbuffers.Builder, polygon: DucPolygonElement) -> int:
    """Serialize DucPolygonElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, polygon.base)
    
    DucPolygonElementStart(builder)
    DucPolygonElementAddBase(builder, element_base_offset)
    DucPolygonElementAddSides(builder, polygon.sides)
    return DucPolygonElementEnd(builder)


def serialize_fbs_duc_ellipse_element(builder: flatbuffers.Builder, ellipse: DucEllipseElement) -> int:
    """Serialize DucEllipseElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, ellipse.base) # Corrected to .base
    
    DucEllipseElementStart(builder)
    DucEllipseElementAddBase(builder, element_base_offset) # Corrected to AddBase
    DucEllipseElementAddRatio(builder, ellipse.ratio) # Added ratio
    DucEllipseElementAddStartAngle(builder, ellipse.start_angle)
    DucEllipseElementAddEndAngle(builder, ellipse.end_angle)
    DucEllipseElementAddShowAuxCrosshair(builder, ellipse.show_aux_crosshair)
    return DucEllipseElementEnd(builder)


def serialize_fbs_duc_embeddable_element(builder: flatbuffers.Builder, embeddable: DucEmbeddableElement) -> int:
    """Serialize DucEmbeddableElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, embeddable.base)
    
    DucEmbeddableElementStart(builder)
    DucEmbeddableElementAddBase(builder, element_base_offset)
    # Removed src, scale, and status serialization as they are not part of DucEmbeddableElement in schema
    return DucEmbeddableElementEnd(builder)


def serialize_fbs_duc_pdf_element(builder: flatbuffers.Builder, pdf: DucPdfElement) -> int:
    """Serialize DucPdfElement to FlatBuffers."""
    base_offset = serialize_fbs_duc_element_base(builder, pdf.base) # Corrected to .base
    file_id_offset = builder.CreateString(pdf.file_id) # Added file_id serialization
    
    DucPdfElementStart(builder)
    DucPdfElementAddBase(builder, base_offset)
    DucPdfElementAddFileId(builder, file_id_offset) # Added file_id
    return DucPdfElementEnd(builder)


def serialize_fbs_duc_mermaid_element(builder: flatbuffers.Builder, mermaid: DucMermaidElement) -> int:
    """Serialize DucMermaidElement to FlatBuffers."""
    base_offset = serialize_fbs_duc_element_base(builder, mermaid.base)
    source_offset = builder.CreateString(mermaid.source)
    theme_offset = builder.CreateString(mermaid.theme) if mermaid.theme else None
    svg_path_offset = builder.CreateString(mermaid.svg_path) if mermaid.svg_path else None
    
    DucMermaidElementStart(builder)
    DucMermaidElementAddBase(builder, base_offset)
    DucMermaidElementAddSource(builder, source_offset)
    if theme_offset:
        DucMermaidElementAddTheme(builder, theme_offset)
    if svg_path_offset:
        DucMermaidElementAddSvgPath(builder, svg_path_offset)
    return DucMermaidElementEnd(builder)


def serialize_fbs_image_crop(builder: flatbuffers.Builder, crop: ImageCrop) -> int:
    """Serialize ImageCrop to FlatBuffers."""
    ImageCropStart(builder)
    ImageCropAddX(builder, crop.x)
    ImageCropAddY(builder, crop.y)
    ImageCropAddWidth(builder, crop.width)
    ImageCropAddHeight(builder, crop.height)
    ImageCropAddNaturalWidth(builder, crop.natural_width) # Added natural_width
    ImageCropAddNaturalHeight(builder, crop.natural_height) # Added natural_height
    return ImageCropEnd(builder)


def serialize_fbs_duc_image_element(builder: flatbuffers.Builder, image: DucImageElement) -> int:
    """Serialize DucImageElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, image.base)
    file_id_offset = builder.CreateString(image.file_id)
    crop_offset = serialize_fbs_image_crop(builder, image.crop) if image.crop else None
    filter_offset = serialize_fbs_duc_image_filter(builder, image.filter) if image.filter else None
    scale_vector = builder.CreateNumpyVector(image.scale) # Convert list to numpy vector
    
    DucImageElementStart(builder)
    DucImageElementAddBase(builder, element_base_offset) # Corrected to AddBase
    DucImageElementAddFileId(builder, file_id_offset)
    DucImageElementAddStatus(builder, image.status)
    DucImageElementAddScale(builder, scale_vector)
    if crop_offset is not None:
        DucImageElementAddCrop(builder, crop_offset)
    if filter_offset is not None:
        DucImageElementAddFilter(builder, filter_offset)
    return DucImageElementEnd(builder)


def serialize_fbs_duc_table_column(builder: flatbuffers.Builder, column: DucTableColumn) -> int:
    """Serialize DucTableColumn to FlatBuffers."""
    id_offset = builder.CreateString(column.id)
    style_overrides_offset = serialize_fbs_duc_table_cell_style(builder, column.style_overrides) if column.style_overrides else None
    
    DucTableColumnStart(builder)
    DucTableColumnAddId(builder, id_offset)
    DucTableColumnAddWidth(builder, column.width)
    if style_overrides_offset is not None:
        DucTableColumnAddStyleOverrides(builder, style_overrides_offset)
    return DucTableColumnEnd(builder)


def serialize_fbs_duc_table_row(builder: flatbuffers.Builder, row: DucTableRow) -> int:
    """Serialize DucTableRow to FlatBuffers."""
    id_offset = builder.CreateString(row.id)
    style_overrides_offset = serialize_fbs_duc_table_cell_style(builder, row.style_overrides) if row.style_overrides else None

    DucTableRowStart(builder)
    DucTableRowAddId(builder, id_offset)
    DucTableRowAddHeight(builder, row.height)
    if style_overrides_offset is not None:
        DucTableRowAddStyleOverrides(builder, style_overrides_offset)
    return DucTableRowEnd(builder)


def serialize_fbs_duc_table_cell_span(builder: flatbuffers.Builder, span: DucTableCellSpan) -> int:
    """Serialize DucTableCellSpan to FlatBuffers."""
    DucTableCellSpanStart(builder)
    DucTableCellSpanAddColumns(builder, span.columns)
    DucTableCellSpanAddRows(builder, span.rows)
    return DucTableCellSpanEnd(builder)


def serialize_fbs_duc_table_cell(builder: flatbuffers.Builder, cell: DucTableCell) -> int:
    """Serialize DucTableCell to FlatBuffers."""
    row_id_offset = builder.CreateString(cell.row_id)
    column_id_offset = builder.CreateString(cell.column_id)
    data_offset = builder.CreateString(cell.data)
    span_offset = serialize_fbs_duc_table_cell_span(builder, cell.span) if cell.span else None
    style_overrides_offset = serialize_fbs_duc_table_cell_style(builder, cell.style_overrides) if cell.style_overrides else None
    
    DucTableCellStart(builder)
    DucTableCellAddRowId(builder, row_id_offset)
    DucTableCellAddColumnId(builder, column_id_offset)
    DucTableCellAddData(builder, data_offset)
    if span_offset is not None:
        DucTableCellAddSpan(builder, span_offset)
    DucTableCellAddLocked(builder, cell.locked)
    if style_overrides_offset is not None:
        DucTableCellAddStyleOverrides(builder, style_overrides_offset)
    return DucTableCellEnd(builder)


def serialize_fbs_duc_table_auto_size(builder: flatbuffers.Builder, auto_size: DucTableAutoSize) -> int:
    """Serialize DucTableAutoSize to FlatBuffers."""
    DucTableAutoSizeStart(builder)
    DucTableAutoSizeAddColumns(builder, auto_size.columns)
    DucTableAutoSizeAddRows(builder, auto_size.rows)
    return DucTableAutoSizeEnd(builder)


def serialize_fbs_duc_table_element(builder: flatbuffers.Builder, table: DucTableElement) -> int:
    """Serialize DucTableElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, table.base)
    style_offset = serialize_fbs_duc_table_style(builder, table.style) if table.style else None
    
    # Serialize column order
    column_order_offsets = []
    for col_id in table.column_order:
        column_order_offsets.append(builder.CreateString(col_id))
    DucTableElementStartColumnOrderVector(builder, len(column_order_offsets))
    for offset in reversed(column_order_offsets):
        builder.PrependUOffsetTRelative(offset)
    column_order_vector = builder.EndVector()

    # Serialize row order
    row_order_offsets = []
    for row_id in table.row_order:
        row_order_offsets.append(builder.CreateString(row_id))
    DucTableElementStartRowOrderVector(builder, len(row_order_offsets))
    for offset in reversed(row_order_offsets):
        builder.PrependUOffsetTRelative(offset)
    row_order_vector = builder.EndVector()

    # Serialize columns
    columns_offsets = []
    for column_entry in table.columns:
        key_offset = builder.CreateString(column_entry.key)
        value_offset = serialize_fbs_duc_table_column(builder, column_entry.value)
        DucTableColumnEntryStart(builder)
        DucTableColumnEntryAddKey(builder, key_offset)
        DucTableColumnEntryAddValue(builder, value_offset)
        columns_offsets.append(DucTableColumnEntryEnd(builder))
    DucTableElementStartColumnsVector(builder, len(columns_offsets))
    for offset in reversed(columns_offsets):
        builder.PrependUOffsetTRelative(offset)
    columns_vector = builder.EndVector()

    # Serialize rows
    rows_offsets = []
    for row_entry in table.rows:
        key_offset = builder.CreateString(row_entry.key)
        value_offset = serialize_fbs_duc_table_row(builder, row_entry.value)
        DucTableRowEntryStart(builder)
        DucTableRowEntryAddKey(builder, key_offset)
        DucTableRowEntryAddValue(builder, value_offset)
        rows_offsets.append(DucTableRowEntryEnd(builder))
    DucTableElementStartRowsVector(builder, len(rows_offsets))
    for offset in reversed(rows_offsets):
        builder.PrependUOffsetTRelative(offset)
    rows_vector = builder.EndVector()

    # Serialize cells
    cells_offsets = []
    for cell_entry in table.cells:
        key_offset = builder.CreateString(cell_entry.key)
        value_offset = serialize_fbs_duc_table_cell(builder, cell_entry.value)
        DucTableCellEntryStart(builder)
        DucTableCellEntryAddKey(builder, key_offset)
        DucTableCellEntryAddValue(builder, value_offset)
        cells_offsets.append(DucTableCellEntryEnd(builder))
    DucTableElementStartCellsVector(builder, len(cells_offsets))
    for offset in reversed(cells_offsets):
        builder.PrependUOffsetTRelative(offset)
    cells_vector = builder.EndVector()
    
    auto_size_offset = serialize_fbs_duc_table_auto_size(builder, table.auto_size) if table.auto_size else None
    
    DucTableElementStart(builder)
    DucTableElementAddBase(builder, element_base_offset)
    DucTableElementAddColumnOrder(builder, column_order_vector)
    DucTableElementAddRowOrder(builder, row_order_vector)
    DucTableElementAddColumns(builder, columns_vector)
    DucTableElementAddRows(builder, rows_vector)
    DucTableElementAddCells(builder, cells_vector)
    DucTableElementAddHeaderRowCount(builder, table.header_row_count)
    if auto_size_offset is not None:
        DucTableElementAddAutoSize(builder, auto_size_offset)
    if style_offset is not None:
        DucTableElementAddStyle(builder, style_offset)
    return DucTableElementEnd(builder)


def serialize_fbs_duc_text_element(builder: flatbuffers.Builder, text: DucTextElement) -> int:
    """Serialize DucTextElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, text.base) # Corrected to .base
    text_offset = builder.CreateString(text.text) # Corrected to .text
    style_offset = serialize_fbs_duc_text_style(builder, text.style) if text.style else None
    container_id_offset = builder.CreateString(text.container_id) if text.container_id else None # Added container_id
    original_text_offset = builder.CreateString(text.original_text) if text.original_text else None # Added original_text
    
    # Serialize dynamic content if present
    dynamic_vector = None # Corrected to dynamic_vector
    if text.dynamic:
        dynamic_offsets = [] # Corrected to dynamic_offsets
        for dynamic_part in text.dynamic:
            dynamic_offsets.append(serialize_fbs_duc_text_dynamic_part(builder, dynamic_part))
        
        DucTextElementStartDynamicVector(builder, len(dynamic_offsets)) # Corrected to StartDynamicVector
        for offset in reversed(dynamic_offsets):
            builder.PrependUOffsetTRelative(offset)
        dynamic_vector = builder.EndVector()
    
    DucTextElementStart(builder)
    DucTextElementAddBase(builder, element_base_offset) # Corrected to AddBase
    DucTextElementAddText(builder, text_offset) # Corrected AddContent to AddText
    if dynamic_vector:
        DucTextElementAddDynamic(builder, dynamic_vector) # Corrected AddDynamicContent to AddDynamic
    if style_offset:
        DucTextElementAddStyle(builder, style_offset)
    DucTextElementAddAutoResize(builder, text.auto_resize) # Added auto_resize
    if container_id_offset:
        DucTextElementAddContainerId(builder, container_id_offset) # Added container_id
    if original_text_offset:
        DucTextElementAddOriginalText(builder, original_text_offset) # Added original_text
    return DucTextElementEnd(builder)


def serialize_fbs_duc_linear_element(builder: flatbuffers.Builder, linear: DucLinearElement) -> int:
    """Serialize DucLinearElement to FlatBuffers."""
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, linear.linear_base) # Corrected to .linear_base
    
    DucLinearElementStart(builder)
    DucLinearElementAddLinearBase(builder, linear_base_offset) # Corrected AddBase to AddLinearBase
    DucLinearElementAddWipeoutBelow(builder, linear.wipeout_below) # Added wipeout_below
    return DucLinearElementEnd(builder)


def serialize_fbs_duc_arrow_element(builder: flatbuffers.Builder, arrow: DucArrowElement) -> int:
    """Serialize DucArrowElement to FlatBuffers."""
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, arrow.linear_base) # Corrected to .linear_base
    
    DucArrowElementStart(builder)
    DucArrowElementAddLinearBase(builder, linear_base_offset) # Corrected AddBase to AddLinearBase
    DucArrowElementAddElbowed(builder, arrow.elbowed) # Added elbowed
    # Removed start_head and end_head from here, assuming they are handled in linear_base
    return DucArrowElementEnd(builder)


def serialize_fbs_duc_free_draw_element(builder: flatbuffers.Builder, free_draw: DucFreeDrawElement) -> int:
    """Serialize DucFreeDrawElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, free_draw.base) # Corrected to .base
    start_offset = serialize_fbs_duc_free_draw_ends(builder, free_draw.start) if free_draw.start else None # Added start
    end_offset = serialize_fbs_duc_free_draw_ends(builder, free_draw.end) if free_draw.end else None # Added end
    easing_offset = builder.CreateString(free_draw.easing) if free_draw.easing else None # Added easing
    svg_path_offset = builder.CreateString(free_draw.svg_path) if free_draw.svg_path else None # Added svg_path
    
    # Serialize points
    points_offsets = []
    for point in free_draw.points:
        points_offsets.append(serialize_fbs_duc_point(builder, point))
    
    DucFreeDrawElementStartPointsVector(builder, len(points_offsets)) # Corrected to StartPointsVector
    for offset in reversed(points_offsets):
        builder.PrependUOffsetTRelative(offset)
    points_vector = builder.EndVector()

    # Serialize pressures
    pressures_vector = builder.CreateNumpyVector(free_draw.pressures) # Added pressures

    last_committed_point_offset = serialize_fbs_duc_point(builder, free_draw.last_committed_point) if free_draw.last_committed_point else None # Added last_committed_point
    
    DucFreeDrawElementStart(builder)
    DucFreeDrawElementAddBase(builder, element_base_offset) # Corrected to AddBase
    DucFreeDrawElementAddPoints(builder, points_vector)
    DucFreeDrawElementAddSize(builder, free_draw.size) # Added size
    DucFreeDrawElementAddThinning(builder, free_draw.thinning) # Added thinning
    DucFreeDrawElementAddSmoothing(builder, free_draw.smoothing) # Added smoothing
    DucFreeDrawElementAddStreamline(builder, free_draw.streamline) # Added streamline
    if easing_offset:
        DucFreeDrawElementAddEasing(builder, easing_offset) # Added easing
    if start_offset:
        DucFreeDrawElementAddStart(builder, start_offset) # Added start
    if end_offset:
        DucFreeDrawElementAddEnd(builder, end_offset) # Added end
    DucFreeDrawElementAddPressures(builder, pressures_vector) # Added pressures
    DucFreeDrawElementAddSimulatePressure(builder, free_draw.simulate_pressure) # Added simulate_pressure
    if last_committed_point_offset:
        DucFreeDrawElementAddLastCommittedPoint(builder, last_committed_point_offset) # Added last_committed_point
    if svg_path_offset:
        DucFreeDrawElementAddSvgPath(builder, svg_path_offset) # Added svg_path
    return DucFreeDrawElementEnd(builder)


def serialize_fbs_duc_block_instance_element(builder: flatbuffers.Builder, block_instance: DucBlockInstanceElement) -> int:
    """Serialize DucBlockInstanceElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, block_instance.base) # Corrected to .base
    block_id_offset = builder.CreateString(block_instance.block_id)
    duplication_array_offset = serialize_fbs_duc_block_duplication_array(builder, block_instance.duplication_array) if block_instance.duplication_array else None
    
    # Serialize attribute values
    attribute_values_offsets = []
    if block_instance.attribute_values:
        for attr_value in block_instance.attribute_values:
            key_offset = builder.CreateString(attr_value.key)
            value_offset = builder.CreateString(attr_value.value)
            StringValueEntryStart(builder)
            StringValueEntryAddKey(builder, key_offset)
            StringValueEntryAddValue(builder, value_offset)
            attribute_values_offsets.append(StringValueEntryEnd(builder))
    
    DucBlockInstanceElementStartAttributeValuesVector(builder, len(attribute_values_offsets))
    for offset in reversed(attribute_values_offsets):
        builder.PrependUOffsetTRelative(offset)
    attribute_values_vector = builder.EndVector()

    # Serialize element overrides
    element_overrides_offsets = []
    if block_instance.element_overrides:
        for elem_override in block_instance.element_overrides:
            key_offset = builder.CreateString(elem_override.key)
            value_offset = builder.CreateString(elem_override.value)
            StringValueEntryStart(builder)
            StringValueEntryAddKey(builder, key_offset)
            StringValueEntryAddValue(builder, value_offset)
            element_overrides_offsets.append(StringValueEntryEnd(builder))
    DucBlockInstanceElementStartElementOverridesVector(builder, len(element_overrides_offsets))
    for offset in reversed(element_overrides_offsets):
        builder.PrependUOffsetTRelative(offset)
    element_overrides_vector = builder.EndVector()
    
    DucBlockInstanceElementStart(builder)
    DucBlockInstanceElementAddBase(builder, element_base_offset) # Corrected to AddBase
    DucBlockInstanceElementAddBlockId(builder, block_id_offset)
    DucBlockInstanceElementAddAttributeValues(builder, attribute_values_vector)
    DucBlockInstanceElementAddElementOverrides(builder, element_overrides_vector)
    if duplication_array_offset:
        DucBlockInstanceElementAddDuplicationArray(builder, duplication_array_offset)
    return DucBlockInstanceElementEnd(builder)


def serialize_fbs_duc_stack_base(builder: flatbuffers.Builder, stack_base) -> int:
    """Serialize DucStackBase to FlatBuffers."""
    # Serialize label
    label_offset = None
    if stack_base.label:
        label_offset = builder.CreateString(stack_base.label)
    
    # Serialize description
    description_offset = None
    if stack_base.description:
        description_offset = builder.CreateString(stack_base.description)
    
    # Serialize styles if present
    styles_offset = None
    if hasattr(stack_base, 'styles') and stack_base.styles:
        # This would need a separate implementation for styles serialization
        pass
    
    _DucStackBaseStart(builder)
    if label_offset:
        _DucStackBaseAddLabel(builder, label_offset)
    if description_offset:
        _DucStackBaseAddDescription(builder, description_offset)
    _DucStackBaseAddIsCollapsed(builder, getattr(stack_base, 'is_collapsed', False))
    _DucStackBaseAddIsPlot(builder, getattr(stack_base, 'is_plot', False))
    _DucStackBaseAddIsVisible(builder, getattr(stack_base, 'is_visible', True))
    _DucStackBaseAddLocked(builder, getattr(stack_base, 'locked', False))
    if styles_offset:
        _DucStackBaseAddStyles(builder, styles_offset)
    return _DucStackBaseEnd(builder)


def serialize_fbs_duc_stack_element_base(builder: flatbuffers.Builder, stack_element_base) -> int:
    """Serialize DucStackElementBase to FlatBuffers."""
    # Serialize base element
    base_offset = serialize_fbs_duc_element_base(builder, stack_element_base.base)
    
    # Serialize stack base
    stack_base_offset = serialize_fbs_duc_stack_base(builder, stack_element_base.stack_base)
    
    # Serialize clip if present
    clip_offset = None
    if hasattr(stack_element_base, 'clip') and stack_element_base.clip:
        # This would need clip serialization implementation
        pass
    
    # Serialize standard override if present
    standard_override_offset = None
    if hasattr(stack_element_base, 'standard_override') and stack_element_base.standard_override:
        # This would need standard override serialization implementation
        pass
    
    _DucStackElementBaseStart(builder)
    _DucStackElementBaseAddBase(builder, base_offset)
    _DucStackElementBaseAddStackBase(builder, stack_base_offset)
    if clip_offset:
        _DucStackElementBaseAddClip(builder, clip_offset)
    _DucStackElementBaseAddLabelVisible(builder, getattr(stack_element_base, 'label_visible', True))
    if standard_override_offset:
        _DucStackElementBaseAddStandardOverride(builder, standard_override_offset)
    return _DucStackElementBaseEnd(builder)


def serialize_fbs_duc_frame_element(builder: flatbuffers.Builder, frame: DucFrameElement) -> int:
    """Serialize DucFrameElement to FlatBuffers."""
    stack_element_base_offset = serialize_fbs_duc_stack_element_base(builder, frame.stack_element_base)
    
    DucFrameElementStart(builder)
    DucFrameElementAddStackElementBase(builder, stack_element_base_offset)
    return DucFrameElementEnd(builder)


def serialize_fbs_duc_plot_element(builder: flatbuffers.Builder, plot: DucPlotElement) -> int:
    """Serialize DucPlotElement to FlatBuffers."""
    stack_element_base_offset = serialize_fbs_duc_stack_element_base(builder, plot.stack_element_base)
    layout_offset = serialize_fbs_plot_layout(builder, plot.layout) if plot.layout else None
    style_offset = serialize_fbs_duc_plot_style(builder, plot.style) if plot.style else None
    
    DucPlotElementStart(builder)
    DucPlotElementAddStackElementBase(builder, stack_element_base_offset)
    if layout_offset:
        DucPlotElementAddLayout(builder, layout_offset)
    if style_offset:
        DucPlotElementAddStyle(builder, style_offset)
    return DucPlotElementEnd(builder)


def serialize_fbs_duc_viewport_element(builder: flatbuffers.Builder, viewport: DucViewportElement) -> int:
    """Serialize DucViewportElement to FlatBuffers."""
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, viewport.linear_base)
    stack_base_offset = serialize_fbs_duc_stack_base(builder, viewport.stack_base)
    view_offset = serialize_fbs_duc_view(builder, viewport.view)
    style_offset = serialize_fbs_duc_viewport_style(builder, viewport.style) if viewport.style else None
    
    # Serialize frozen group IDs
    frozen_group_ids_vector = None
    if viewport.frozen_group_ids:
        frozen_group_ids_offsets = []
        for group_id in viewport.frozen_group_ids:
            frozen_group_ids_offsets.append(builder.CreateString(group_id))
        DucViewportElementStartFrozenGroupIdsVector(builder, len(frozen_group_ids_offsets))
        for offset in reversed(frozen_group_ids_offsets):
            builder.PrependUOffsetTRelative(offset)
        frozen_group_ids_vector = builder.EndVector()

    # Serialize standard override
    standard_override_offset = serialize_fbs_standard(builder, viewport.standard_override) if viewport.standard_override else None
    
    DucViewportElementStart(builder)
    DucViewportElementAddLinearBase(builder, linear_base_offset) # Corrected to AddLinearBase
    DucViewportElementAddStackBase(builder, stack_base_offset)
    DucViewportElementAddView(builder, view_offset)
    DucViewportElementAddScale(builder, viewport.scale)
    DucViewportElementAddShadePlot(builder, viewport.shade_plot)
    if style_offset:
        DucViewportElementAddStyle(builder, style_offset)
    if frozen_group_ids_vector:
        DucViewportElementAddFrozenGroupIds(builder, frozen_group_ids_vector)
    if standard_override_offset:
        DucViewportElementAddStandardOverride(builder, standard_override_offset)
    return DucViewportElementEnd(builder)


def serialize_fbs_duc_xray_element(builder: flatbuffers.Builder, xray: DucXRayElement) -> int:
    """Serialize DucXRayElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, xray.base)
    origin_offset = serialize_fbs_duc_point(builder, xray.origin)
    direction_offset = serialize_fbs_duc_point(builder, xray.direction)
    style_offset = serialize_fbs_duc_xray_style(builder, xray.style) if xray.style else None
    
    DucXRayElementStart(builder)
    DucXRayElementAddBase(builder, element_base_offset)
    if style_offset:
        DucXRayElementAddStyle(builder, style_offset)
    DucXRayElementAddOrigin(builder, origin_offset)
    DucXRayElementAddDirection(builder, direction_offset)
    DucXRayElementAddStartFromOrigin(builder, xray.start_from_origin)
    return DucXRayElementEnd(builder)


def serialize_fbs_leader_text_block_content(builder: flatbuffers.Builder, content: LeaderTextBlockContent) -> int:
    text_offset = builder.CreateString(content.text)
    LeaderTextBlockContentStart(builder)
    LeaderTextBlockContentAddText(builder, text_offset)
    return LeaderTextBlockContentEnd(builder)

def serialize_fbs_leader_block_content(builder: flatbuffers.Builder, content: LeaderBlockContent) -> int:
    block_id_offset = builder.CreateString(content.block_id)

    # Serialize attribute values
    attribute_values_offsets = []
    if content.attribute_values:
        for attr_value in content.attribute_values:
            key_offset = builder.CreateString(attr_value.key)
            value_offset = builder.CreateString(attr_value.value)
            StringValueEntryStart(builder)
            StringValueEntryAddKey(builder, key_offset)
            StringValueEntryAddValue(builder, value_offset)
            attribute_values_offsets.append(StringValueEntryEnd(builder))
    LeaderBlockContentStartAttributeValuesVector(builder, len(attribute_values_offsets))
    for offset in reversed(attribute_values_offsets):
        builder.PrependUOffsetTRelative(offset)
    attribute_values_vector = builder.EndVector()

    # Serialize element overrides
    element_overrides_offsets = []
    if content.element_overrides:
        for elem_override in content.element_overrides:
            key_offset = builder.CreateString(elem_override.key)
            value_offset = builder.CreateString(elem_override.value)
            StringValueEntryStart(builder)
            StringValueEntryAddKey(builder, key_offset)
            StringValueEntryAddValue(builder, value_offset)
            element_overrides_offsets.append(StringValueEntryEnd(builder))
    LeaderBlockContentStartElementOverridesVector(builder, len(element_overrides_offsets))
    for offset in reversed(element_overrides_offsets):
        builder.PrependUOffsetTRelative(offset)
    element_overrides_vector = builder.EndVector()
    
    LeaderBlockContentStart(builder)
    LeaderBlockContentAddBlockId(builder, block_id_offset)
    LeaderBlockContentAddAttributeValues(builder, attribute_values_vector)
    LeaderBlockContentAddElementOverrides(builder, element_overrides_vector)
    return LeaderBlockContentEnd(builder)

def serialize_fbs_leader_content(builder: flatbuffers.Builder, content: LeaderContent) -> int:
    """Serialize LeaderContent to FlatBuffers."""
    content_offset = None
    content_type = None
    
    if isinstance(content.content, LeaderTextBlockContent):
        content_offset = serialize_fbs_leader_text_block_content(builder, content.content)
        content_type = LeaderContentFBType.LeaderTextBlockContent 
    elif isinstance(content.content, LeaderBlockContent):
        content_offset = serialize_fbs_leader_block_content(builder, content.content)
        content_type = LeaderContentFBType.LeaderBlockContent
    else:
        raise ValueError(f"Unsupported leader content type: {type(content.content)}")
    
    LeaderContentStart(builder)
    LeaderContentAddLeaderContentType(builder, content_type)
    LeaderContentAddContent(builder, content_offset)
    return LeaderContentEnd(builder)


def serialize_fbs_duc_leader_element(builder: flatbuffers.Builder, leader: DucLeaderElement) -> int:
    """Serialize DucLeaderElement to FlatBuffers."""
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, leader.linear_base)
    content_anchor_offset = None
    if leader.content_anchor:
        from ..Duc.GeometricPoint import CreateGeometricPoint
        content_anchor_offset = CreateGeometricPoint(builder, leader.content_anchor.x, leader.content_anchor.y)
    content_offset = serialize_fbs_leader_content(builder, leader.content) if leader.content else None
    style_offset = serialize_fbs_duc_leader_style(builder, leader.style) if leader.style else None
    
    DucLeaderElementStart(builder)
    DucLeaderElementAddLinearBase(builder, linear_base_offset)
    if content_offset:
        DucLeaderElementAddContent(builder, content_offset)
    if style_offset:
        DucLeaderElementAddStyle(builder, style_offset)
    if content_anchor_offset:
        DucLeaderElementAddContentAnchor(builder, content_anchor_offset)
    return DucLeaderElementEnd(builder)


def serialize_fbs_dimension_definition_points(builder: flatbuffers.Builder, definition_points: DimensionDefinitionPoints) -> int:
    """Serialize DimensionDefinitionPoints to FlatBuffers."""
    origin1_offset = serialize_fbs_geometric_point(builder, definition_points.origin1) # Corrected to geometric_point
    origin2_offset = serialize_fbs_geometric_point(builder, definition_points.origin2) # Corrected to geometric_point
    location_offset = serialize_fbs_geometric_point(builder, definition_points.location) # Corrected to geometric_point
    center_offset = serialize_fbs_geometric_point(builder, definition_points.center) # Corrected to geometric_point
    jog_offset = serialize_fbs_geometric_point(builder, definition_points.jog) # Corrected to geometric_point

    DimensionDefinitionPointsStart(builder)
    DimensionDefinitionPointsAddOrigin1(builder, origin1_offset)
    DimensionDefinitionPointsAddOrigin2(builder, origin2_offset)
    DimensionDefinitionPointsAddLocation(builder, location_offset)
    DimensionDefinitionPointsAddCenter(builder, center_offset)
    DimensionDefinitionPointsAddJog(builder, jog_offset)
    return DimensionDefinitionPointsEnd(builder)


def serialize_fbs_dimension_baseline_data(builder: flatbuffers.Builder, baseline_data: DimensionBaselineData) -> int:
    """Serialize DimensionBaselineData to FlatBuffers."""
    base_dimension_id_offset = builder.CreateString(baseline_data.base_dimension_id) if baseline_data.base_dimension_id else None # Added base_dimension_id
    
    DimensionBaselineDataStart(builder)
    if base_dimension_id_offset:
        DimensionBaselineDataAddBaseDimensionId(builder, base_dimension_id_offset) # Added base_dimension_id
    return DimensionBaselineDataEnd(builder)


def serialize_fbs_dimension_continue_data(builder: flatbuffers.Builder, continue_data: DimensionContinueData) -> int:
    """Serialize DimensionContinueData to FlatBuffers."""
    continue_from_dimension_id_offset = builder.CreateString(continue_data.continue_from_dimension_id) if continue_data.continue_from_dimension_id else None # Added continue_from_dimension_id
    
    DimensionContinueDataStart(builder)
    if continue_from_dimension_id_offset:
        DimensionContinueDataAddContinueFromDimensionId(builder, continue_from_dimension_id_offset) # Added continue_from_dimension_id
    return DimensionContinueDataEnd(builder)


def serialize_fbs_duc_dimension_element(builder: flatbuffers.Builder, dimension: DucDimensionElement) -> int:
    """Serialize DucDimensionElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, dimension.base) # Corrected to .base
    definition_points_offset = serialize_fbs_dimension_definition_points(builder, dimension.definition_points)
    text_override_offset = builder.CreateString(dimension.text_override) if dimension.text_override else None
    text_position_offset = serialize_fbs_geometric_point(builder, dimension.text_position) if dimension.text_position else None
    tolerance_override_offset = serialize_fbs_dimension_tolerance_style(builder, dimension.tolerance_override) if dimension.tolerance_override else None
    bindings_offset = serialize_fbs_dimension_bindings(builder, dimension.bindings) if dimension.bindings else None
    baseline_data_offset = serialize_fbs_dimension_baseline_data(builder, dimension.baseline_data) if dimension.baseline_data else None
    continue_data_offset = serialize_fbs_dimension_continue_data(builder, dimension.continue_data) if dimension.continue_data else None
    style_offset = serialize_fbs_duc_dimension_style(builder, dimension.style) if dimension.style else None
    
    DucDimensionElementStart(builder)
    DucDimensionElementAddBase(builder, element_base_offset) # Corrected to AddBase
    DucDimensionElementAddDefinitionPoints(builder, definition_points_offset)
    DucDimensionElementAddDimensionType(builder, dimension.dimension_type) # Corrected to AddDimensionType
    DucDimensionElementAddObliqueAngle(builder, dimension.oblique_angle)
    DucDimensionElementAddOrdinateAxis(builder, dimension.ordinate_axis)
    if bindings_offset:
        DucDimensionElementAddBindings(builder, bindings_offset)
    if text_override_offset:
        DucDimensionElementAddTextOverride(builder, text_override_offset)
    if text_position_offset:
        DucDimensionElementAddTextPosition(builder, text_position_offset)
    if tolerance_override_offset:
        DucDimensionElementAddToleranceOverride(builder, tolerance_override_offset)
    if baseline_data_offset:
        DucDimensionElementAddBaselineData(builder, baseline_data_offset)
    if continue_data_offset:
        DucDimensionElementAddContinueData(builder, continue_data_offset)
    if style_offset:
        DucDimensionElementAddStyle(builder, style_offset)
    return DucDimensionElementEnd(builder)


def serialize_fbs_datum_reference(builder: flatbuffers.Builder, datum_ref: DatumReference) -> int:
    letters_offset = builder.CreateString(datum_ref.letters)
    DatumReferenceStart(builder)
    DatumReferenceAddLetters(builder, letters_offset)
    DatumReferenceAddModifier(builder, datum_ref.modifier)
    return DatumReferenceEnd(builder)

def serialize_fbs_tolerance_clause(builder: flatbuffers.Builder, tolerance_clause: ToleranceClause) -> int:
    value_offset = builder.CreateString(tolerance_clause.value)
    feature_modifiers_offsets = []
    if tolerance_clause.feature_modifiers:
        for modifier in tolerance_clause.feature_modifiers:
            feature_modifiers_offsets.append(modifier)
    ToleranceClauseStartFeatureModifiersVector(builder, len(feature_modifiers_offsets))
    for offset in reversed(feature_modifiers_offsets):
        builder.PrependUint8(offset)
    feature_modifiers_vector = builder.EndVector()
    
    ToleranceClauseStart(builder)
    ToleranceClauseAddValue(builder, value_offset)
    ToleranceClauseAddZoneType(builder, tolerance_clause.zone_type)
    ToleranceClauseAddFeatureModifiers(builder, feature_modifiers_vector)
    ToleranceClauseAddMaterialCondition(builder, tolerance_clause.material_condition)
    return ToleranceClauseEnd(builder)

def serialize_fbs_feature_control_frame_segment(builder: flatbuffers.Builder, segment: FeatureControlFrameSegment) -> int:
    tolerance_offset = serialize_fbs_tolerance_clause(builder, segment.tolerance)
    datums_offsets = []
    if segment.datums:
        for datum in segment.datums:
            datums_offsets.append(serialize_fbs_datum_reference(builder, datum))
    FeatureControlFrameSegmentStartDatumsVector(builder, len(datums_offsets))
    for offset in reversed(datums_offsets):
        builder.PrependUOffsetTRelative(offset)
    datums_vector = builder.EndVector()

    FeatureControlFrameSegmentStart(builder)
    FeatureControlFrameSegmentAddSymbol(builder, segment.symbol)
    FeatureControlFrameSegmentAddTolerance(builder, tolerance_offset)
    FeatureControlFrameSegmentAddDatums(builder, datums_vector)
    return FeatureControlFrameSegmentEnd(builder)

def serialize_fbs_fcf_between_modifier(builder: flatbuffers.Builder, between: FCFBetweenModifier) -> int:
    start_offset = builder.CreateString(between.start)
    end_offset = builder.CreateString(between.end)
    FCFBetweenModifierStart(builder)
    FCFBetweenModifierAddStart(builder, start_offset)
    FCFBetweenModifierAddEnd(builder, end_offset)
    return FCFBetweenModifierEnd(builder)

def serialize_fbs_fcf_projected_zone_modifier(builder: flatbuffers.Builder, projected_zone: FCFProjectedZoneModifier) -> int:
    FCFProjectedZoneModifierStart(builder)
    FCFProjectedZoneModifierAddValue(builder, projected_zone.value)
    return FCFProjectedZoneModifierEnd(builder)

def serialize_fbs_fcf_frame_modifiers(builder: flatbuffers.Builder, modifiers: FCFFrameModifiers) -> int:
    between_offset = serialize_fbs_fcf_between_modifier(builder, modifiers.between) if modifiers.between else None
    projected_tolerance_zone_offset = serialize_fbs_fcf_projected_zone_modifier(builder, modifiers.projected_tolerance_zone) if modifiers.projected_tolerance_zone else None

    FCFFrameModifiersStart(builder)
    FCFFrameModifiersAddAllAround(builder, modifiers.all_around)
    FCFFrameModifiersAddAllOver(builder, modifiers.all_over)
    FCFFrameModifiersAddContinuousFeature(builder, modifiers.continuous_feature)
    if between_offset:
        FCFFrameModifiersAddBetween(builder, between_offset)
    if projected_tolerance_zone_offset:
        FCFFrameModifiersAddProjectedToleranceZone(builder, projected_tolerance_zone_offset)
    return FCFFrameModifiersEnd(builder)

def serialize_fbs_fcf_datum_definition(builder: flatbuffers.Builder, datum_def: FCFDatumDefinition) -> int:
    letter_offset = builder.CreateString(datum_def.letter)
    feature_binding_offset = serialize_fbs_duc_point_binding(builder, datum_def.feature_binding) if datum_def.feature_binding else None

    FCFDatumDefinitionStart(builder)
    FCFDatumDefinitionAddLetter(builder, letter_offset)
    if feature_binding_offset:
        FCFDatumDefinitionAddFeatureBinding(builder, feature_binding_offset)
    return FCFDatumDefinitionEnd(builder)


def serialize_fbs_duc_feature_control_frame_element(builder: flatbuffers.Builder, fcf: DucFeatureControlFrameElement) -> int:
    """Serialize DucFeatureControlFrameElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, fcf.base)
    modifiers_offset = serialize_fbs_fcf_frame_modifiers(builder, fcf.frame_modifiers) if fcf.frame_modifiers else None
    datum_definition_offset = serialize_fbs_fcf_datum_definition(builder, fcf.datum_definition) if fcf.datum_definition else None
    style_offset = serialize_fbs_duc_feature_control_frame_style(builder, fcf.style) if fcf.style else None
    leader_element_id_offset = builder.CreateString(fcf.leader_element_id) if fcf.leader_element_id else None
    
    # Serialize rows (list of lists of segments)
    rows_offsets = []
    for row_segments in fcf.rows:
        segments_in_row_offsets = []
        for segment in row_segments:
            segments_in_row_offsets.append(serialize_fbs_feature_control_frame_segment(builder, segment))
        FeatureControlFrameElementStartSegmentsVector(builder, len(segments_in_row_offsets))
        for offset in reversed(segments_in_row_offsets):
            builder.PrependUOffsetTRelative(offset)
        rows_offsets.append(builder.EndVector())
    
    # Create vector of row vectors
    DucFeatureControlFrameElementStartRowsVector(builder, len(rows_offsets))
    for offset in reversed(rows_offsets):
        builder.PrependUOffsetTRelative(offset)
    rows_vector = builder.EndVector()

    DucFeatureControlFrameElementStart(builder)
    DucFeatureControlFrameElementAddBase(builder, element_base_offset)
    DucFeatureControlFrameElementAddRows(builder, rows_vector)
    if modifiers_offset:
        DucFeatureControlFrameElementAddFrameModifiers(builder, modifiers_offset)
    if datum_definition_offset:
        DucFeatureControlFrameElementAddDatumDefinition(builder, datum_definition_offset)
    if style_offset:
        DucFeatureControlFrameElementAddStyle(builder, style_offset)
    if leader_element_id_offset:
        DucFeatureControlFrameElementAddLeaderElementId(builder, leader_element_id_offset)
    return DucFeatureControlFrameElementEnd(builder)


def serialize_fbs_duc_doc_element(builder: flatbuffers.Builder, doc: DucDocElement) -> int:
    """Serialize DucDocElement to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, doc.base)
    column_layout_offset = serialize_fbs_column_layout(builder, doc.columns) if doc.columns else None
    text_offset = builder.CreateString(doc.text)
    style_offset = serialize_fbs_duc_doc_style(builder, doc.style) if doc.style else None

    # Serialize dynamic parts
    dynamic_vector = None
    if doc.dynamic:
        dynamic_offsets = []
        for dynamic_part in doc.dynamic:
            dynamic_offsets.append(serialize_fbs_duc_text_dynamic_part(builder, dynamic_part))
        DucDocElementStartDynamicVector(builder, len(dynamic_offsets))
        for offset in reversed(dynamic_offsets):
            builder.PrependUOffsetTRelative(offset)
        dynamic_vector = builder.EndVector()

    DucDocElementStart(builder)
    DucDocElementAddBase(builder, element_base_offset)
    if column_layout_offset:
        DucDocElementAddColumns(builder, column_layout_offset)
    DucDocElementAddText(builder, text_offset)
    if dynamic_vector:
        DucDocElementAddDynamic(builder, dynamic_vector)
    DucDocElementAddFlowDirection(builder, doc.flow_direction)
    DucDocElementAddAutoResize(builder, doc.auto_resize)
    if style_offset:
        DucDocElementAddStyle(builder, style_offset)
    return DucDocElementEnd(builder)


def serialize_fbs_duc_parametric_element(builder: flatbuffers.Builder, parametric: DucParametricElement) -> int:
    """Serialize DucParametricElement to FlatBuffers."""
    base_offset = serialize_fbs_duc_element_base(builder, parametric.base) # Corrected to .base
    source_offset = serialize_fbs_parametric_source(builder, parametric.source)
    
    DucParametricElementStart(builder)
    DucParametricElementAddBase(builder, base_offset)
    DucParametricElementAddSource(builder, source_offset)
    return DucParametricElementEnd(builder)


def serialize_fbs_element_wrapper(builder: flatbuffers.Builder, element_wrapper: ElementWrapper) -> int:
    """Serialize ElementWrapper to FlatBuffers using comprehensive element type handling."""
    element = element_wrapper.element
    element_offset = None
    element_type = None
    
    if isinstance(element, DucRectangleElement):
        element_offset = serialize_fbs_duc_rectangle_element(builder, element)
        element_type = ElementFBType.DucRectangleElement
    elif isinstance(element, DucPolygonElement):
        element_offset = serialize_fbs_duc_polygon_element(builder, element)
        element_type = ElementFBType.DucPolygonElement
    elif isinstance(element, DucEllipseElement):
        element_offset = serialize_fbs_duc_ellipse_element(builder, element)
        element_type = ElementFBType.DucEllipseElement
    elif isinstance(element, DucEmbeddableElement):
        element_offset = serialize_fbs_duc_embeddable_element(builder, element)
        element_type = ElementFBType.DucEmbeddableElement
    elif isinstance(element, DucPdfElement):
        element_offset = serialize_fbs_duc_pdf_element(builder, element)
        element_type = ElementFBType.DucPdfElement
    elif isinstance(element, DucMermaidElement):
        element_offset = serialize_fbs_duc_mermaid_element(builder, element)
        element_type = ElementFBType.DucMermaidElement
    elif isinstance(element, DucTableElement):
        element_offset = serialize_fbs_duc_table_element(builder, element)
        element_type = ElementFBType.DucTableElement
    elif isinstance(element, DucImageElement):
        element_offset = serialize_fbs_duc_image_element(builder, element)
        element_type = ElementFBType.DucImageElement
    elif isinstance(element, DucTextElement):
        element_offset = serialize_fbs_duc_text_element(builder, element)
        element_type = ElementFBType.DucTextElement
    elif isinstance(element, DucLinearElement):
        element_offset = serialize_fbs_duc_linear_element(builder, element)
        element_type = ElementFBType.DucLinearElement
    elif isinstance(element, DucArrowElement):
        element_offset = serialize_fbs_duc_arrow_element(builder, element)
        element_type = ElementFBType.DucArrowElement
    elif isinstance(element, DucFreeDrawElement):
        element_offset = serialize_fbs_duc_free_draw_element(builder, element)
        element_type = ElementFBType.DucFreeDrawElement
    elif isinstance(element, DucBlockInstanceElement):
        element_offset = serialize_fbs_duc_block_instance_element(builder, element)
        element_type = ElementFBType.DucBlockInstanceElement
    elif isinstance(element, DucFrameElement):
        element_offset = serialize_fbs_duc_frame_element(builder, element)
        element_type = ElementFBType.DucFrameElement
    elif isinstance(element, DucPlotElement):
        element_offset = serialize_fbs_duc_plot_element(builder, element)
        element_type = ElementFBType.DucPlotElement
    elif isinstance(element, DucViewportElement):
        element_offset = serialize_fbs_duc_viewport_element(builder, element)
        element_type = ElementFBType.DucViewportElement
    elif isinstance(element, DucXRayElement):
        element_offset = serialize_fbs_duc_xray_element(builder, element)
        element_type = ElementFBType.DucXRayElement
    elif isinstance(element, DucLeaderElement):
        element_offset = serialize_fbs_duc_leader_element(builder, element)
        element_type = ElementFBType.DucLeaderElement
    elif isinstance(element, DucDimensionElement):
        element_offset = serialize_fbs_duc_dimension_element(builder, element)
        element_type = ElementFBType.DucDimensionElement
    elif isinstance(element, DucFeatureControlFrameElement):
        element_offset = serialize_fbs_duc_feature_control_frame_element(builder, element)
        element_type = ElementFBType.DucFeatureControlFrameElement
    elif isinstance(element, DucDocElement):
        element_offset = serialize_fbs_duc_doc_element(builder, element)
        element_type = ElementFBType.DucDocElement
    elif isinstance(element, DucParametricElement):
        element_offset = serialize_fbs_duc_parametric_element(builder, element)
        element_type = ElementFBType.DucParametricElement
    else:
        raise ValueError(f"Unsupported element type: {type(element)}")
    
    ElementWrapperStart(builder)
    ElementWrapperAddElementType(builder, element_type)
    ElementWrapperAddElement(builder, element_offset)
    return ElementWrapperEnd(builder)
