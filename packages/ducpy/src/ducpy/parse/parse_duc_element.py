from typing import List, Optional, Union, Dict
import json

# Import the dataclasses from ElementsClass.py and related classes
from ..classes.ElementsClass import (
    GeometricPoint, DucUcs, DucPoint, DucView, Margins, TilingProperties,
    HatchPatternLine, CustomHatchPattern, DucHatchStyle, DucImageFilter,
    ElementContentBase, StrokeStyle, StrokeSides, ElementStroke, ElementBackground,
    DucElementStylesBase, BoundElement, DucElementBase, DucHead, PointBindingPoint,
    DucPointBinding, DucLineReference, DucLine, DucPath, DucLinearElementBase,
    DucStackLikeStyles, DucStackBase, DucStackElementBase, LineSpacing,
    DucTextStyle, DucTableCellStyle, DucTableStyle, DucLeaderStyle,
    DimensionToleranceStyle, DimensionFitStyle, DimensionLineStyle,
    DimensionExtLineStyle, DimensionSymbolStyle, DucDimensionStyle, FCFLayoutStyle,
    FCFSymbolStyle, FCFDatumStyle, DucFeatureControlFrameStyle, ParagraphFormatting,
    StackFormatProperties, StackFormat, DucDocStyle, DucViewportStyle, DucPlotStyle,
    DucXRayStyle, DucRectangleElement, DucPolygonElement, DucEllipseElement,
    DucEmbeddableElement, DucPdfElement, DucMermaidElement,
    DucTableColumn, DucTableRow, DucTableCellSpan, DucTableCell, DucTableAutoSize,
    DucTableElement, ImageCrop, DucImageElement, DucTextDynamicElementSource,
    DucTextDynamicDictionarySource, DucTextDynamicSource, DucTextDynamicPart,
    DucTextElement, DucLinearElement, DucArrowElement, DucFreeDrawEnds,
    DucFreeDrawElement, DucBlockAttributeDefinition, DucBlockDuplicationArray,
    DucBlockInstanceElement, DucFrameElement, PlotLayout, DucPlotElement,
    DucViewportElement, DucXRayElement, LeaderTextBlockContent, LeaderBlockContent,
    LeaderContent, DimensionDefinitionPoints, DimensionBindings,
    DimensionBaselineData, DimensionContinueData, DucDimensionElement, DatumReference,
    ToleranceClause, FeatureControlFrameSegment, FCFBetweenModifier, FCFProjectedZoneModifier,
    FCFFrameModifiers, FCFDatumDefinition, FCFSegmentRow, DucFeatureControlFrameElement, TextColumn,
    ColumnLayout, DucDocElement, ParametricSource, DucParametricElement, StringValueEntry, ElementWrapper, \
    DucBlock, DucBlockAttributeDefinitionEntry, DucTableColumnEntry, DucTableRowEntry, DucTableCellEntry
)

# Import Standard and PrimaryUnits from StandardsClass.py
from ..classes.StandardsClass import Standard, PrimaryUnits, Identifier

# Explicit import for DucLeaderElement to avoid naming conflict
from ..classes.ElementsClass import DucLeaderElement as DataClassDucLeaderElement

# Import FlatBuffers generated classes with aliases
from ..Duc.Identifier import Identifier as FBSIdentifier
from ..Duc.GeometricPoint import GeometricPoint as FBSGeometricPoint
from ..Duc.DucUcs import DucUcs as FBSDucUcs
from ..Duc.DucPoint import DucPoint as FBSDucPoint
from ..Duc.DucView import DucView as FBSDucView
from ..Duc.Margins import Margins as FBSMargins
from ..Duc.TilingProperties import TilingProperties as FBSTilingProperties
from ..Duc.HatchPatternLine import HatchPatternLine as FBSHatchPatternLine
from ..Duc.CustomHatchPattern import CustomHatchPattern as FBSCustomHatchPattern
from ..Duc.DucHatchStyle import DucHatchStyle as FBSDucHatchStyle
from ..Duc.DucImageFilter import DucImageFilter as FBSDucImageFilter
from ..Duc.ElementContentBase import ElementContentBase as FBSElementContentBase
from ..Duc.StrokeStyle import StrokeStyle as FBSStrokeStyle
from ..Duc.StrokeSides import StrokeSides as FBSStrokeSides
from ..Duc.ElementStroke import ElementStroke as FBSElementStroke
from ..Duc.ElementBackground import ElementBackground as FBSElementBackground
from ..Duc._DucElementStylesBase import _DucElementStylesBase as FBSDucElementStylesBase
from ..Duc.BoundElement import BoundElement as FBSBoundElement
from ..Duc._DucElementBase import _DucElementBase as FBSDucElementBase
from ..Duc.DucHead import DucHead as FBSDucHead
from ..Duc.PointBindingPoint import PointBindingPoint as FBSPointBindingPoint
from ..Duc.DucPointBinding import DucPointBinding as FBSDucPointBinding
from ..Duc.DucLineReference import DucLineReference as FBSDucLineReference
from ..Duc.DucLine import DucLine as FBSDucLine
from ..Duc.DucPath import DucPath as FBSDucPath
from ..Duc._DucLinearElementBase import _DucLinearElementBase as FBSDucLinearElementBase
from ..Duc.DucStackLikeStyles import DucStackLikeStyles as FBSDucStackLikeStyles
from ..Duc._DucStackBase import _DucStackBase as FBSDucStackBase
from ..Duc._DucStackElementBase import _DucStackElementBase as FBSDucStackElementBase
from ..Duc.LineSpacing import LineSpacing as FBSLineSpacing
from ..Duc.DucTextStyle import DucTextStyle as FBSDucTextStyle
from ..Duc.DucTableCellStyle import DucTableCellStyle as FBSDucTableCellStyle
from ..Duc.DucTableStyle import DucTableStyle as FBSDucTableStyle
from ..Duc.DucLeaderStyle import DucLeaderStyle as FBSDucLeaderStyle
from ..Duc.DimensionToleranceStyle import DimensionToleranceStyle as FBSDimensionToleranceStyle
from ..Duc.DimensionFitStyle import DimensionFitStyle as FBSDimensionFitStyle
from ..Duc.DimensionLineStyle import DimensionLineStyle as FBSDimensionLineStyle
from ..Duc.DimensionExtLineStyle import DimensionExtLineStyle as FBSDimensionExtLineStyle
from ..Duc.DimensionSymbolStyle import DimensionSymbolStyle as FBSDimensionSymbolStyle
from ..Duc.DucDimensionStyle import DucDimensionStyle as FBSDucDimensionStyle
from ..Duc.FCFLayoutStyle import FCFLayoutStyle as FBSFCFLayoutStyle
from ..Duc.FCFSymbolStyle import FCFSymbolStyle as FBSFCFSymbolStyle
from ..Duc.FCFDatumStyle import FCFDatumStyle as FBSFCFDatumStyle
from ..Duc.DucFeatureControlFrameStyle import DucFeatureControlFrameStyle as FBSDucFeatureControlFrameStyle
from ..Duc.ParagraphFormatting import ParagraphFormatting as FBSParagraphFormatting
from ..Duc.StackFormatProperties import StackFormatProperties as FBSStackFormatProperties
from ..Duc.StackFormat import StackFormat as FBSStackFormat
from ..Duc.DucDocStyle import DucDocStyle as FBSDucDocStyle
from ..Duc.DucViewportStyle import DucViewportStyle as FBSDucViewportStyle
from ..Duc.DucPlotStyle import DucPlotStyle as FBSDucPlotStyle
from ..Duc.DucXRayStyle import DucXRayStyle as FBSDucXRayStyle
from ..Duc.DucRectangleElement import DucRectangleElement as FBSDucRectangleElement
from ..Duc.DucPolygonElement import DucPolygonElement as FBSDucPolygonElement
from ..Duc.DucEllipseElement import DucEllipseElement as FBSDucEllipseElement
from ..Duc.DucEmbeddableElement import DucEmbeddableElement as FBSDucEmbeddableElement
from ..Duc.DucPdfElement import DucPdfElement as FBSDucPdfElement
from ..Duc.DucMermaidElement import DucMermaidElement as FBSDucMermaidElement
from ..Duc.DucTableColumn import DucTableColumn as FBSDucTableColumn
from ..Duc.DucTableRow import DucTableRow as FBSDucTableRow
from ..Duc.DucTableCellSpan import DucTableCellSpan as FBSDucTableCellSpan
from ..Duc.DucTableCell import DucTableCell as FBSDucTableCell
from ..Duc.DucTableColumnEntry import DucTableColumnEntry as FBSDucTableColumnEntry
from ..Duc.DucTableRowEntry import DucTableRowEntry as FBSDucTableRowEntry
from ..Duc.DucTableCellEntry import DucTableCellEntry as FBSDucTableCellEntry
from ..Duc.DucTableAutoSize import DucTableAutoSize as FBSDucTableAutoSize
from ..Duc.DucTableElement import DucTableElement as FBSDucTableElement
from ..Duc.ImageCrop import ImageCrop as FBSImageCrop
from ..Duc.DucImageElement import DucImageElement as FBSDucImageElement
from ..Duc.DucTextDynamicElementSource import DucTextDynamicElementSource as FBSDucTextDynamicElementSource
from ..Duc.DucTextDynamicDictionarySource import DucTextDynamicDictionarySource as FBSDucTextDynamicDictionarySource
from ..Duc.DucTextDynamicSource import DucTextDynamicSource as FBSDucTextDynamicSource
from ..Duc.DucTextDynamicPart import DucTextDynamicPart as FBSDucTextDynamicPart
from ..Duc.DucTextElement import DucTextElement as FBSDucTextElement
from ..Duc.DucLinearElement import DucLinearElement as FBSDucLinearElement
from ..Duc.DucArrowElement import DucArrowElement as FBSDucArrowElement
from ..Duc.DucFreeDrawEnds import DucFreeDrawEnds as FBSDucFreeDrawEnds
from ..Duc.DucFreeDrawElement import DucFreeDrawElement as FBSDucFreeDrawElement
from ..Duc.DucBlock import DucBlock as FBSDucBlock
from ..Duc.DucBlockAttributeDefinition import DucBlockAttributeDefinition as FBSDucBlockAttributeDefinition
from ..Duc.DucBlockAttributeDefinitionEntry import DucBlockAttributeDefinitionEntry as FBSDucBlockAttributeDefinitionEntry
from ..Duc.DucBlockDuplicationArray import DucBlockDuplicationArray as FBSDucBlockDuplicationArray
from ..Duc.DucBlockInstanceElement import DucBlockInstanceElement as FBSDucBlockInstanceElement
from ..Duc.DucFrameElement import DucFrameElement as FBSDucFrameElement
from ..Duc.PlotLayout import PlotLayout as FBSPlotLayout
from ..Duc.DucPlotElement import DucPlotElement as FBSDucPlotElement
from ..Duc.DucViewportElement import DucViewportElement as FBSDucViewportElement
from ..Duc.DucXRayElement import DucXRayElement as FBSDucXRayElement
from ..Duc.LeaderTextBlockContent import LeaderTextBlockContent as FBSLeaderTextBlockContent
from ..Duc.LeaderBlockContent import LeaderBlockContent as FBSLeaderBlockContent
from ..Duc.LeaderContent import LeaderContent as FBSLeaderContent
from ..Duc.LeaderContentData import LeaderContentData as LeaderContentFBType
from ..Duc.DucLeaderElement import DucLeaderElement as FBSDucLeaderElement
from ..Duc.DimensionDefinitionPoints import DimensionDefinitionPoints as FBSDimensionDefinitionPoints
from ..Duc.DimensionBindings import DimensionBindings as FBSDimensionBindings
from ..Duc.DimensionBaselineData import DimensionBaselineData as FBSDimensionBaselineData
from ..Duc.DimensionContinueData import DimensionContinueData as FBSDimensionContinueData
from ..Duc.DucDimensionElement import DucDimensionElement as FBSDucDimensionElement
from ..Duc.DatumReference import DatumReference as FBSDatumReference
from ..Duc.ToleranceClause import ToleranceClause as FBSToleranceClause
from ..Duc.FeatureControlFrameSegment import FeatureControlFrameSegment as FBSFeatureControlFrameSegment
from ..Duc.FCFBetweenModifier import FCFBetweenModifier as FBSFCFBetweenModifier
from ..Duc.FCFProjectedZoneModifier import FCFProjectedZoneModifier as FBSFCFProjectedZoneModifier
from ..Duc.FCFFrameModifiers import FCFFrameModifiers as FBSFCFFrameModifiers
from ..Duc.FCFDatumDefinition import FCFDatumDefinition as FBSFCFDatumDefinition
from ..Duc.DucFeatureControlFrameElement import DucFeatureControlFrameElement as FBSDucFeatureControlFrameElement
from ..Duc.TextColumn import TextColumn as FBSTextColumn
from ..Duc.ColumnLayout import ColumnLayout as FBSColumnLayout
from ..Duc.DucDocElement import DucDocElement as FBSDucDocElement
from ..Duc.ParametricSource import ParametricSource as FBSParametricSource
from ..Duc.DucParametricElement import DucParametricElement as FBSDucParametricElement
from ..Duc.StringValueEntry import StringValueEntry as FBSStringValueEntry
from ..Duc.Element import Element as FBSElementUnion


def parse_fbs_identifier(fbs_identifier: FBSIdentifier) -> Identifier:
    return Identifier(
        id=fbs_identifier.Id().decode('utf-8') if fbs_identifier.Id() is not None else "",
        name=fbs_identifier.Name().decode('utf-8') if fbs_identifier.Name() is not None else "",
        description=fbs_identifier.Description().decode('utf-8') if fbs_identifier.Description() is not None else ""
    )

def parse_fbs_geometric_point(fbs_geo_point: FBSGeometricPoint) -> GeometricPoint:
    if fbs_geo_point is None:
        return GeometricPoint(x=0.0, y=0.0)
    return GeometricPoint(x=fbs_geo_point.X(), y=fbs_geo_point.Y())

def parse_fbs_margins(fbs_margins: FBSMargins) -> Margins:
    return Margins(
        top=fbs_margins.Top(),
        right=fbs_margins.Right(),
        bottom=fbs_margins.Bottom(),
        left=fbs_margins.Left()
    )

def parse_fbs_tiling_properties(fbs_tiling: FBSTilingProperties) -> TilingProperties:
    return TilingProperties(
        size_in_percent=fbs_tiling.SizeInPercent(),
        angle=fbs_tiling.Angle(),
        spacing=fbs_tiling.Spacing() if fbs_tiling.Spacing() is not None else None,
        offset_x=fbs_tiling.OffsetX() if fbs_tiling.OffsetX() is not None else None,
        offset_y=fbs_tiling.OffsetY() if fbs_tiling.OffsetY() is not None else None,
    )

def parse_fbs_duc_point(fbs_point: FBSDucPoint) -> DucPoint:
    if fbs_point is None:
        return DucPoint(x=0.0, y=0.0, mirroring=None)
    return DucPoint(
        x=fbs_point.X(),
        y=fbs_point.Y(),
        mirroring=fbs_point.Mirroring() if fbs_point.Mirroring() is not None else None
    )

def parse_fbs_duc_ucs(fbs_ucs: FBSDucUcs) -> DucUcs:
    if fbs_ucs is None:
        return DucUcs(origin=GeometricPoint(x=0.0, y=0.0), angle=0.0)
    return DucUcs(
        origin=parse_fbs_geometric_point(fbs_ucs.Origin()),
        angle=fbs_ucs.Angle()
    )

def parse_fbs_duc_view(fbs_view: FBSDucView) -> DucView:
    if fbs_view is None:
        return DucView(
            scroll_x=0.0, 
            scroll_y=0.0, 
            zoom=1.0, 
            twist_angle=0.0,
            center_point=DucPoint(x=0.0, y=0.0),
            scope="mm"
        )
    return DucView(
        scroll_x=fbs_view.ScrollX(),
        scroll_y=fbs_view.ScrollY(),
        zoom=fbs_view.Zoom(),
        twist_angle=fbs_view.TwistAngle(),
        center_point=parse_fbs_duc_point(fbs_view.CenterPoint()) if fbs_view.CenterPoint() else DucPoint(x=0.0, y=0.0),
        scope=fbs_view.Scope() if fbs_view.Scope() else "mm"
    )

def parse_fbs_hatch_pattern_line(fbs_hatch_line: FBSHatchPatternLine) -> HatchPatternLine:
    offset_list = [fbs_hatch_line.Offset(i) for i in range(fbs_hatch_line.OffsetLength())]
    dash_pattern_list = [fbs_hatch_line.DashPattern(i) for i in range(fbs_hatch_line.DashPatternLength())]
    return HatchPatternLine(
        angle=fbs_hatch_line.Angle(),
        origin=parse_fbs_duc_point(fbs_hatch_line.Origin()),
        offset=offset_list,
        dash_pattern=dash_pattern_list
    )

def parse_fbs_custom_hatch_pattern(fbs_custom_hatch: FBSCustomHatchPattern) -> CustomHatchPattern:
    lines = [parse_fbs_hatch_pattern_line(fbs_custom_hatch.Lines(i)) for i in range(fbs_custom_hatch.LinesLength())]
    return CustomHatchPattern(
        name=fbs_custom_hatch.Name().decode('utf-8') if fbs_custom_hatch.Name() is not None else "",
        description=fbs_custom_hatch.Description().decode('utf-8') if fbs_custom_hatch.Description() is not None else "",
        lines=lines
    )

def parse_fbs_duc_hatch_style(fbs_hatch_style: FBSDucHatchStyle) -> DucHatchStyle:
    return DucHatchStyle(
        hatch_style=fbs_hatch_style.HatchStyle() if fbs_hatch_style.HatchStyle() is not None else None,
        pattern_name=fbs_hatch_style.PatternName().decode('utf-8') if fbs_hatch_style.PatternName() is not None else "",
        pattern_scale=fbs_hatch_style.PatternScale(),
        pattern_angle=fbs_hatch_style.PatternAngle(),
        pattern_origin=parse_fbs_duc_point(fbs_hatch_style.PatternOrigin()),
        pattern_double=bool(fbs_hatch_style.PatternDouble()),
        custom_pattern=parse_fbs_custom_hatch_pattern(fbs_hatch_style.CustomPattern())
    )

def parse_fbs_duc_image_filter(fbs_image_filter: FBSDucImageFilter) -> DucImageFilter:
    return DucImageFilter(
        brightness=fbs_image_filter.Brightness(),
        contrast=fbs_image_filter.Contrast()
    )

def parse_fbs_element_content_base(fbs_content_base: FBSElementContentBase) -> ElementContentBase:
    return ElementContentBase(
        preference=fbs_content_base.Preference() if fbs_content_base.Preference() is not None else None,
        src=fbs_content_base.Src().decode('utf-8') if fbs_content_base.Src() is not None else "",
        visible=bool(fbs_content_base.Visible()),
        opacity=fbs_content_base.Opacity(),
        tiling=parse_fbs_tiling_properties(fbs_content_base.Tiling()),
        hatch=parse_fbs_duc_hatch_style(fbs_content_base.Hatch()),
        image_filter=parse_fbs_duc_image_filter(fbs_content_base.ImageFilter())
    )

def parse_fbs_stroke_style(fbs_stroke_style: FBSStrokeStyle) -> StrokeStyle:
    dash_list = [fbs_stroke_style.Dash(i) for i in range(fbs_stroke_style.DashLength())]
    return StrokeStyle(
        preference=fbs_stroke_style.Preference() if fbs_stroke_style.Preference() is not None else None,
        cap=fbs_stroke_style.Cap() if fbs_stroke_style.Cap() is not None else None,
        join=fbs_stroke_style.Join() if fbs_stroke_style.Join() is not None else None,
        dash=dash_list,
        dash_line_override=fbs_stroke_style.DashLineOverride().decode('utf-8') if fbs_stroke_style.DashLineOverride() is not None else "",
        dash_cap=fbs_stroke_style.DashCap() if fbs_stroke_style.DashCap() is not None else None,
        miter_limit=fbs_stroke_style.MiterLimit() if fbs_stroke_style.MiterLimit() is not None else None
    )

def parse_fbs_stroke_sides(fbs_stroke_sides: FBSStrokeSides) -> StrokeSides:
    values_list = [fbs_stroke_sides.Values(i) for i in range(fbs_stroke_sides.ValuesLength())]
    return StrokeSides(
        preference=fbs_stroke_sides.Preference() if fbs_stroke_sides.Preference() is not None else None,
        values=values_list
    )

def parse_fbs_element_stroke(fbs_element_stroke: FBSElementStroke) -> ElementStroke:
    if fbs_element_stroke is None:
        return None
    return ElementStroke(
        content=parse_fbs_element_content_base(fbs_element_stroke.Content()),
        width=fbs_element_stroke.Width(),
        style=parse_fbs_stroke_style(fbs_element_stroke.Style()),
        placement=fbs_element_stroke.Placement() if fbs_element_stroke.Placement() is not None else None,
        stroke_sides=parse_fbs_stroke_sides(fbs_element_stroke.StrokeSides())
    )

def parse_fbs_element_background(fbs_element_background: FBSElementBackground) -> ElementBackground:
    if fbs_element_background is None:
        return None
    return ElementBackground(
        content=parse_fbs_element_content_base(fbs_element_background.Content())
    )

def parse_fbs_duc_element_styles_base(fbs_styles_base: FBSDucElementStylesBase) -> DucElementStylesBase:
    if fbs_styles_base is None:
        # Return a default styles base object
        return DucElementStylesBase(
            roundness=0.0,
            blending=None,
            background=[],
            stroke=[],
            opacity=1.0
        )
    background_list = [parse_fbs_element_background(fbs_styles_base.Background(i)) for i in range(fbs_styles_base.BackgroundLength())]
    stroke_list = [parse_fbs_element_stroke(fbs_styles_base.Stroke(i)) for i in range(fbs_styles_base.StrokeLength())]
    return DucElementStylesBase(
        roundness=fbs_styles_base.Roundness(),
        blending=fbs_styles_base.Blending() if fbs_styles_base.Blending() is not None else None,
        background=background_list,
        stroke=stroke_list,
        opacity=fbs_styles_base.Opacity()
    )

def parse_fbs_bound_element(fbs_bound_element: FBSBoundElement) -> BoundElement:
    return BoundElement(
        id=fbs_bound_element.Id().decode('utf-8') if fbs_bound_element.Id() is not None else "",
        type=fbs_bound_element.Type().decode('utf-8') if fbs_bound_element.Type() is not None else ""
    )

def parse_fbs_duc_element_base(fbs_element_base: FBSDucElementBase) -> DucElementBase:
    group_ids_list = [fbs_element_base.GroupIds(i).decode('utf-8') for i in range(fbs_element_base.GroupIdsLength()) if fbs_element_base.GroupIds(i) is not None]
    region_ids_list = [fbs_element_base.RegionIds(i).decode('utf-8') for i in range(fbs_element_base.RegionIdsLength()) if fbs_element_base.RegionIds(i) is not None]
    bound_elements_list = [parse_fbs_bound_element(fbs_element_base.BoundElements(i)) for i in range(fbs_element_base.BoundElementsLength())]

    return DucElementBase(
        id=fbs_element_base.Id().decode('utf-8') if fbs_element_base.Id() is not None else "",
        styles=parse_fbs_duc_element_styles_base(fbs_element_base.Styles()),
        x=fbs_element_base.X(),
        y=fbs_element_base.Y(),
        width=fbs_element_base.Width(),
        height=fbs_element_base.Height(),
        angle=fbs_element_base.Angle(),
        scope=fbs_element_base.Scope().decode('utf-8') if fbs_element_base.Scope() is not None else "",
        label=fbs_element_base.Label().decode('utf-8') if fbs_element_base.Label() is not None else "",
        description=fbs_element_base.Description().decode('utf-8') if fbs_element_base.Description() is not None else "", # type: ignore
        is_visible=bool(fbs_element_base.IsVisible()),
        seed=fbs_element_base.Seed(),
        version=fbs_element_base.Version(),
        version_nonce=fbs_element_base.VersionNonce(),
        updated=fbs_element_base.Updated(),
        index=fbs_element_base.Index().decode('utf-8') if fbs_element_base.Index() is not None else None, # type: ignore
        is_plot=bool(fbs_element_base.IsPlot()),
        is_annotative=bool(fbs_element_base.IsAnnotative()),
        is_deleted=bool(fbs_element_base.IsDeleted()),
        group_ids=group_ids_list,
        region_ids=region_ids_list,
        layer_id=fbs_element_base.LayerId().decode('utf-8') if fbs_element_base.LayerId() is not None else "",
        frame_id=fbs_element_base.FrameId().decode('utf-8') if fbs_element_base.FrameId() is not None else "", # type: ignore
        bound_elements=bound_elements_list,
        z_index=fbs_element_base.ZIndex(),
        link=fbs_element_base.Link().decode('utf-8') if fbs_element_base.Link() is not None else "", # type: ignore
        locked=bool(fbs_element_base.Locked()),
        custom_data=json.loads(fbs_element_base.CustomData().decode('utf-8')) if fbs_element_base.CustomData() is not None else None # type: ignore
    )

def parse_fbs_duc_head(fbs_head: FBSDucHead) -> DucHead:
    if fbs_head is None:
        return None
    return DucHead(
        type=fbs_head.Type() if fbs_head.Type() is not None else None,
        block_id=fbs_head.BlockId().decode('utf-8') if fbs_head.BlockId() is not None else "",
        size=fbs_head.Size()
    )

def parse_fbs_point_binding_point(fbs_point_binding_point: FBSPointBindingPoint) -> PointBindingPoint:
    if fbs_point_binding_point is None:
        return PointBindingPoint(index=0, offset=0.0)
    
    return PointBindingPoint(
        index=fbs_point_binding_point.Index(),
        offset=fbs_point_binding_point.Offset()
    )

def parse_fbs_duc_point_binding(fbs_point_binding: FBSDucPointBinding) -> DucPointBinding:
    if not fbs_point_binding:
        return None

    fbs_fixed_point = fbs_point_binding.FixedPoint()
    fixed_point = parse_fbs_geometric_point(fbs_fixed_point) if fbs_fixed_point else None

    fbs_point = fbs_point_binding.Point()
    point = parse_fbs_point_binding_point(fbs_point) if fbs_point else None

    fbs_head = fbs_point_binding.Head()
    head = parse_fbs_duc_head(fbs_head) if fbs_head else None

    return DucPointBinding(
        element_id=fbs_point_binding.ElementId().decode('utf-8') if fbs_point_binding.ElementId() else "",
        focus=fbs_point_binding.Focus(),
        gap=fbs_point_binding.Gap(),
        fixed_point=fixed_point,
        point=point,
        head=head
    )

def parse_fbs_duc_line_reference(fbs_line_ref: FBSDucLineReference) -> DucLineReference:
    return DucLineReference(
        index=fbs_line_ref.Index(),
        handle=parse_fbs_geometric_point(fbs_line_ref.Handle())
    )

def parse_fbs_duc_line(fbs_line: FBSDucLine) -> DucLine:
    return DucLine(
        start=parse_fbs_duc_line_reference(fbs_line.Start()),
        end=parse_fbs_duc_line_reference(fbs_line.End())
    )

def parse_fbs_duc_path(fbs_path: FBSDucPath) -> DucPath:
    line_indices_list = [fbs_path.LineIndices(i) for i in range(fbs_path.LineIndicesLength())]
    return DucPath(
        line_indices=line_indices_list,
        background=parse_fbs_element_background(fbs_path.Background()),
        stroke=parse_fbs_element_stroke(fbs_path.Stroke())
    )

def parse_fbs_duc_linear_element_base(fbs_linear_base: FBSDucLinearElementBase) -> DucLinearElementBase:
    points_list = [parse_fbs_duc_point(fbs_linear_base.Points(i)) for i in range(fbs_linear_base.PointsLength())]
    lines_list = [parse_fbs_duc_line(fbs_linear_base.Lines(i)) for i in range(fbs_linear_base.LinesLength())]
    path_overrides_list = [parse_fbs_duc_path(fbs_linear_base.PathOverrides(i)) for i in range(fbs_linear_base.PathOverridesLength())]

    return DucLinearElementBase(
        base=parse_fbs_duc_element_base(fbs_linear_base.Base()),
        points=points_list,
        lines=lines_list,
        path_overrides=path_overrides_list,
        last_committed_point=parse_fbs_duc_point(fbs_linear_base.LastCommittedPoint()),
        start_binding=parse_fbs_duc_point_binding(fbs_linear_base.StartBinding()),
        end_binding=parse_fbs_duc_point_binding(fbs_linear_base.EndBinding())
    )

def parse_fbs_duc_stack_like_styles(fbs_stack_styles: FBSDucStackLikeStyles) -> DucStackLikeStyles:
    if fbs_stack_styles is None:
        return None
    return DucStackLikeStyles(
        opacity=fbs_stack_styles.Opacity(),
        labeling_color=fbs_stack_styles.LabelingColor().decode('utf-8')
    )

def parse_fbs_duc_stack_base(fbs_stack_base: FBSDucStackBase) -> DucStackBase:
    return DucStackBase(
        label=fbs_stack_base.Label().decode('utf-8'),
        description=fbs_stack_base.Description().decode('utf-8') if fbs_stack_base.Description() is not None else "",
        is_collapsed=bool(fbs_stack_base.IsCollapsed()),
        is_plot=bool(fbs_stack_base.IsPlot()),
        is_visible=bool(fbs_stack_base.IsVisible()),
        locked=bool(fbs_stack_base.Locked()),
        styles=parse_fbs_duc_stack_like_styles(fbs_stack_base.Styles())
    )

def parse_fbs_duc_stack_element_base(fbs_stack_element_base: FBSDucStackElementBase) -> DucStackElementBase:
    return DucStackElementBase(
        base=parse_fbs_duc_element_base(fbs_stack_element_base.Base()),
        stack_base=parse_fbs_duc_stack_base(fbs_stack_element_base.StackBase()),
        clip=bool(fbs_stack_element_base.Clip()),
        label_visible=bool(fbs_stack_element_base.LabelVisible()),
        standard_override=fbs_stack_element_base.StandardOverride().decode('utf-8') if fbs_stack_element_base.StandardOverride() else None,
    )

def parse_fbs_line_spacing(fbs_line_spacing: FBSLineSpacing) -> LineSpacing:
    return LineSpacing(
        value=fbs_line_spacing.Value(),
        type=fbs_line_spacing.Type() if fbs_line_spacing.Type() is not None else None
    )

def parse_fbs_duc_text_style(fbs_text_style: FBSDucTextStyle) -> Optional[DucTextStyle]:
    if fbs_text_style is None:
        return None
    return DucTextStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_text_style.BaseStyle()),
        is_ltr=bool(fbs_text_style.IsLtr()),
        font_family=fbs_text_style.FontFamily().decode('utf-8') if fbs_text_style.FontFamily() else "",
        big_font_family=fbs_text_style.BigFontFamily().decode('utf-8') if fbs_text_style.BigFontFamily() else "",
        text_align=fbs_text_style.TextAlign() if fbs_text_style.TextAlign() is not None else None,
        vertical_align=fbs_text_style.VerticalAlign() if fbs_text_style.VerticalAlign() is not None else None,
        line_height=fbs_text_style.LineHeight(),
        line_spacing=parse_fbs_line_spacing(fbs_text_style.LineSpacing()),
        oblique_angle=fbs_text_style.ObliqueAngle(),
        font_size=fbs_text_style.FontSize(),
        paper_text_height=fbs_text_style.PaperTextHeight() if fbs_text_style.PaperTextHeight() is not None else None,
        width_factor=fbs_text_style.WidthFactor(),
        is_upside_down=bool(fbs_text_style.IsUpsideDown()),
        is_backwards=bool(fbs_text_style.IsBackwards())
    )

def parse_fbs_duc_table_cell_style(fbs_cell_style: FBSDucTableCellStyle) -> DucTableCellStyle:
    if fbs_cell_style is None:
        return None
    return DucTableCellStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_cell_style.BaseStyle()),
        text_style=parse_fbs_duc_text_style(fbs_cell_style.TextStyle()),
        margins=parse_fbs_margins(fbs_cell_style.Margins()),
        alignment=fbs_cell_style.Alignment() if fbs_cell_style.Alignment() is not None else None
    )

def parse_fbs_duc_table_style(fbs_table_style: FBSDucTableStyle) -> Optional[DucTableStyle]:
    if fbs_table_style is None:
        return None
    return DucTableStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_table_style.BaseStyle()),
        flow_direction=fbs_table_style.FlowDirection() if fbs_table_style.FlowDirection() is not None else None,
        header_row_style=parse_fbs_duc_table_cell_style(fbs_table_style.HeaderRowStyle()),
        data_row_style=parse_fbs_duc_table_cell_style(fbs_table_style.DataRowStyle()),
        data_column_style=parse_fbs_duc_table_cell_style(fbs_table_style.DataColumnStyle())
    )

def parse_fbs_duc_leader_style(fbs_leader_style: FBSDucLeaderStyle) -> DucLeaderStyle:
    heads_override_list = []
    for i in range(fbs_leader_style.HeadsOverrideLength()):
        heads_override_list.append(parse_fbs_duc_head(fbs_leader_style.HeadsOverride(i)))
    return DucLeaderStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_leader_style.BaseStyle()),
        heads_override=heads_override_list,
        dogleg=fbs_leader_style.Dogleg(),
        text_style=parse_fbs_duc_text_style(fbs_leader_style.TextStyle()),
        text_attachment=fbs_leader_style.TextAttachment() if fbs_leader_style.TextAttachment() is not None else None,
        block_attachment=fbs_leader_style.BlockAttachment() if fbs_leader_style.BlockAttachment() is not None else None
    )

def parse_fbs_dimension_tolerance_style(fbs_tol_style: FBSDimensionToleranceStyle) -> DimensionToleranceStyle:
    return DimensionToleranceStyle(
        enabled=bool(fbs_tol_style.Enabled()),
        display_method=fbs_tol_style.DisplayMethod() if fbs_tol_style.DisplayMethod() is not None else None,
        upper_value=fbs_tol_style.UpperValue(),
        lower_value=fbs_tol_style.LowerValue(),
        precision=fbs_tol_style.Precision(),
        text_style=parse_fbs_duc_text_style(fbs_tol_style.TextStyle())
    )

def parse_fbs_dimension_fit_style(fbs_fit_style: FBSDimensionFitStyle) -> DimensionFitStyle:
    return DimensionFitStyle(
        rule=fbs_fit_style.Rule() if fbs_fit_style.Rule() is not None else None,
        text_placement=fbs_fit_style.TextPlacement() if fbs_fit_style.TextPlacement() is not None else None,
        force_text_inside=bool(fbs_fit_style.ForceTextInside())
    )

def parse_fbs_dimension_line_style(fbs_dim_line_style: FBSDimensionLineStyle) -> DimensionLineStyle:
    return DimensionLineStyle(
        stroke=parse_fbs_element_stroke(fbs_dim_line_style.Stroke()),
        text_gap=fbs_dim_line_style.TextGap()
    )

def parse_fbs_dimension_ext_line_style(fbs_ext_line_style: FBSDimensionExtLineStyle) -> DimensionExtLineStyle:
    return DimensionExtLineStyle(
        stroke=parse_fbs_element_stroke(fbs_ext_line_style.Stroke()),
        overshoot=fbs_ext_line_style.Overshoot(),
        offset=fbs_ext_line_style.Offset()
    )

def parse_fbs_dimension_symbol_style(fbs_sym_style: FBSDimensionSymbolStyle) -> DimensionSymbolStyle:
    heads_override_list = []
    for i in range(fbs_sym_style.HeadsOverrideLength()):
        heads_override_list.append(parse_fbs_duc_head(fbs_sym_style.HeadsOverride(i)))
    return DimensionSymbolStyle(
        heads_override=heads_override_list,
        center_mark_type=fbs_sym_style.CenterMarkType() if fbs_sym_style.CenterMarkType() is not None else None,
        center_mark_size=fbs_sym_style.CenterMarkSize()
    )

def parse_fbs_duc_dimension_style(fbs_dim_style: FBSDucDimensionStyle) -> DucDimensionStyle:
    return DucDimensionStyle(
        dim_line=parse_fbs_dimension_line_style(fbs_dim_style.DimLine()),
        ext_line=parse_fbs_dimension_ext_line_style(fbs_dim_style.ExtLine()),
        text_style=parse_fbs_duc_text_style(fbs_dim_style.TextStyle()),
        symbols=parse_fbs_dimension_symbol_style(fbs_dim_style.Symbols()),
        tolerance=parse_fbs_dimension_tolerance_style(fbs_dim_style.Tolerance()),
        fit=parse_fbs_dimension_fit_style(fbs_dim_style.Fit())
    )

def parse_fbs_fcf_layout_style(fbs_fcf_layout_style: FBSFCFLayoutStyle) -> FCFLayoutStyle:
    if fbs_fcf_layout_style is None:
        return None
    return FCFLayoutStyle(
        padding=fbs_fcf_layout_style.Padding(),
        segment_spacing=fbs_fcf_layout_style.SegmentSpacing(),
        row_spacing=fbs_fcf_layout_style.RowSpacing()
    )

def parse_fbs_fcf_symbol_style(fbs_fcf_symbol_style: FBSFCFSymbolStyle) -> FCFSymbolStyle:
    if fbs_fcf_symbol_style is None:
        return None
    return FCFSymbolStyle(
        scale=fbs_fcf_symbol_style.Scale()
    )

def parse_fbs_fcf_datum_style(fbs_fcf_datum_style: FBSFCFDatumStyle) -> FCFDatumStyle:
    if fbs_fcf_datum_style is None:
        return None
    return FCFDatumStyle(
        bracket_style=fbs_fcf_datum_style.BracketStyle() if fbs_fcf_datum_style.BracketStyle() is not None else None
    )

def parse_fbs_duc_feature_control_frame_style(fbs_fcf_style: FBSDucFeatureControlFrameStyle) -> DucFeatureControlFrameStyle:
    if fbs_fcf_style is None:
        return None
    return DucFeatureControlFrameStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_fcf_style.BaseStyle()) if fbs_fcf_style.BaseStyle() else None,
        text_style=parse_fbs_duc_text_style(fbs_fcf_style.TextStyle()) if fbs_fcf_style.TextStyle() else None,
        layout=parse_fbs_fcf_layout_style(fbs_fcf_style.Layout()),
        symbols=parse_fbs_fcf_symbol_style(fbs_fcf_style.Symbols()),
        datum_style=parse_fbs_fcf_datum_style(fbs_fcf_style.DatumStyle())
    )

def parse_fbs_paragraph_formatting(fbs_para_formatting: FBSParagraphFormatting) -> ParagraphFormatting:
    tab_stops_list = [fbs_para_formatting.TabStops(i) for i in range(fbs_para_formatting.TabStopsLength())]
    return ParagraphFormatting(
        first_line_indent=fbs_para_formatting.FirstLineIndent(),
        hanging_indent=fbs_para_formatting.HangingIndent(),
        left_indent=fbs_para_formatting.LeftIndent(),
        right_indent=fbs_para_formatting.RightIndent(),
        space_before=fbs_para_formatting.SpaceBefore(),
        space_after=fbs_para_formatting.SpaceAfter(),
        tab_stops=tab_stops_list
    )

def parse_fbs_stack_format_properties(fbs_stack_props: FBSStackFormatProperties) -> StackFormatProperties:
    return StackFormatProperties(
        upper_scale=fbs_stack_props.UpperScale(),
        lower_scale=fbs_stack_props.LowerScale(),
        alignment=fbs_stack_props.Alignment() if fbs_stack_props.Alignment() is not None else None
    )

def parse_fbs_stack_format(fbs_stack_format: FBSStackFormat) -> StackFormat:
    stack_chars_list = [fbs_stack_format.StackChars(i).decode('utf-8') for i in range(fbs_stack_format.StackCharsLength())]
    return StackFormat(
        auto_stack=bool(fbs_stack_format.AutoStack()),
        stack_chars=stack_chars_list,
        properties=parse_fbs_stack_format_properties(fbs_stack_format.Properties())
    )

def parse_fbs_duc_doc_style(fbs_doc_style: FBSDucDocStyle) -> DucDocStyle:
    return DucDocStyle(
        text_style=parse_fbs_duc_text_style(fbs_doc_style.TextStyle()),
        paragraph=parse_fbs_paragraph_formatting(fbs_doc_style.Paragraph()),
        stack_format=parse_fbs_stack_format(fbs_doc_style.StackFormat())
    )

def parse_fbs_duc_viewport_style(fbs_viewport_style: FBSDucViewportStyle) -> DucViewportStyle:
    return DucViewportStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_viewport_style.BaseStyle()),
        scale_indicator_visible=bool(fbs_viewport_style.ScaleIndicatorVisible())
    )

def parse_fbs_duc_plot_style(fbs_plot_style: FBSDucPlotStyle) -> DucPlotStyle:
    return DucPlotStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_plot_style.BaseStyle())
    )

def parse_fbs_duc_xray_style(fbs_xray_style: FBSDucXRayStyle) -> DucXRayStyle:
    return DucXRayStyle(
        base_style=parse_fbs_duc_element_styles_base(fbs_xray_style.BaseStyle()),
        color=fbs_xray_style.Color().decode('utf-8')
    )

def parse_fbs_duc_rectangle_element(fbs_rect_element: FBSDucRectangleElement) -> DucRectangleElement:
    return DucRectangleElement(
        base=parse_fbs_duc_element_base(fbs_rect_element.Base())
    )

def parse_fbs_duc_polygon_element(fbs_poly_element: FBSDucPolygonElement) -> DucPolygonElement:
    return DucPolygonElement(
        base=parse_fbs_duc_element_base(fbs_poly_element.Base()),
        sides=fbs_poly_element.Sides()
    )

def parse_fbs_duc_ellipse_element(fbs_ellipse_element: FBSDucEllipseElement) -> DucEllipseElement:
    return DucEllipseElement(
        base=parse_fbs_duc_element_base(fbs_ellipse_element.Base()),
        ratio=fbs_ellipse_element.Ratio(),
        start_angle=fbs_ellipse_element.StartAngle(),
        end_angle=fbs_ellipse_element.EndAngle(),
        show_aux_crosshair=bool(fbs_ellipse_element.ShowAuxCrosshair())
    )

def parse_fbs_duc_embeddable_element(fbs_embed_element: FBSDucEmbeddableElement) -> DucEmbeddableElement:
    return DucEmbeddableElement(
        base=parse_fbs_duc_element_base(fbs_embed_element.Base()),
    )

def parse_fbs_duc_pdf_element(fbs_pdf_element: FBSDucPdfElement) -> DucPdfElement:
    return DucPdfElement(
        base=parse_fbs_duc_element_base(fbs_pdf_element.Base()),
        file_id=fbs_pdf_element.FileId().decode('utf-8')
    )

def parse_fbs_duc_mermaid_element(fbs_mermaid_element: FBSDucMermaidElement) -> DucMermaidElement:
    return DucMermaidElement(
        base=parse_fbs_duc_element_base(fbs_mermaid_element.Base()),
        source=fbs_mermaid_element.Source().decode('utf-8'),
        theme=fbs_mermaid_element.Theme().decode('utf-8'),
        svg_path=fbs_mermaid_element.SvgPath().decode('utf-8') if fbs_mermaid_element.SvgPath() is not None else None
    )

def parse_fbs_duc_table_column(fbs_table_column: FBSDucTableColumn) -> DucTableColumn:
    return DucTableColumn(
        id=fbs_table_column.Id().decode('utf-8'),
        width=fbs_table_column.Width(),
        style_overrides=parse_fbs_duc_table_cell_style(fbs_table_column.StyleOverrides())
    )

def parse_fbs_duc_table_row(fbs_table_row: FBSDucTableRow) -> DucTableRow:
    return DucTableRow(
        id=fbs_table_row.Id().decode('utf-8'),
        height=fbs_table_row.Height(),
        style_overrides=parse_fbs_duc_table_cell_style(fbs_table_row.StyleOverrides())
    )

def parse_fbs_duc_table_cell_span(fbs_cell_span: FBSDucTableCellSpan) -> DucTableCellSpan:
    if fbs_cell_span is None:
        return None
    return DucTableCellSpan(
        columns=fbs_cell_span.Columns(),
        rows=fbs_cell_span.Rows()
    )

def parse_fbs_duc_table_cell(fbs_table_cell: FBSDucTableCell) -> DucTableCell:
    return DucTableCell(
        row_id=fbs_table_cell.RowId().decode('utf-8'),
        column_id=fbs_table_cell.ColumnId().decode('utf-8'),
        data=fbs_table_cell.Data().decode('utf-8'),
        span=parse_fbs_duc_table_cell_span(fbs_table_cell.Span()),
        locked=bool(fbs_table_cell.Locked()),
        style_overrides=parse_fbs_duc_table_cell_style(fbs_table_cell.StyleOverrides())
    )

def parse_fbs_duc_table_auto_size(fbs_table_auto_size: FBSDucTableAutoSize) -> DucTableAutoSize:
    return DucTableAutoSize(
        columns=bool(fbs_table_auto_size.Columns()),
        rows=bool(fbs_table_auto_size.Rows())
    )

def parse_fbs_duc_table_element(fbs_table_element: FBSDucTableElement) -> DucTableElement:
    column_order_list = [fbs_table_element.ColumnOrder(i).decode('utf-8') for i in range(fbs_table_element.ColumnOrderLength())]
    row_order_list = [fbs_table_element.RowOrder(i).decode('utf-8') for i in range(fbs_table_element.RowOrderLength())]
    
    # Parse columns into a list of DucTableColumnEntry objects
    columns_list = []
    for i in range(fbs_table_element.ColumnsLength()):
        fbs_column_entry = fbs_table_element.Columns(i)
        column_key = fbs_column_entry.Key().decode('utf-8')
        column_value = parse_fbs_duc_table_column(fbs_column_entry.Value())
        columns_list.append(DucTableColumnEntry(key=column_key, value=column_value))

    # Parse rows into a list of DucTableRowEntry objects
    rows_list = []
    for i in range(fbs_table_element.RowsLength()):
        fbs_row_entry = fbs_table_element.Rows(i)
        row_key = fbs_row_entry.Key().decode('utf-8')
        row_value = parse_fbs_duc_table_row(fbs_row_entry.Value())
        rows_list.append(DucTableRowEntry(key=row_key, value=row_value))

    # Parse cells into a list of DucTableCellEntry objects
    cells_list = []
    for i in range(fbs_table_element.CellsLength()):
        fbs_cell_entry = fbs_table_element.Cells(i)
        cell_key = fbs_cell_entry.Key().decode('utf-8')
        cell_value = parse_fbs_duc_table_cell(fbs_cell_entry.Value())
        cells_list.append(DucTableCellEntry(key=cell_key, value=cell_value))

    return DucTableElement(
        base=parse_fbs_duc_element_base(fbs_table_element.Base()),
        style=parse_fbs_duc_table_style(fbs_table_element.Style()),
        column_order=column_order_list,
        row_order=row_order_list,
        columns=columns_list,
        rows=rows_list,
        cells=cells_list,
        header_row_count=fbs_table_element.HeaderRowCount(),
        auto_size=parse_fbs_duc_table_auto_size(fbs_table_element.AutoSize())
    )

def parse_fbs_image_crop(fbs_image_crop: FBSImageCrop) -> ImageCrop:
    if fbs_image_crop is None:
        return None
    return ImageCrop(
        x=fbs_image_crop.X(),
        y=fbs_image_crop.Y(),
        width=fbs_image_crop.Width(),
        height=fbs_image_crop.Height(),
        natural_width=fbs_image_crop.NaturalWidth(),
        natural_height=fbs_image_crop.NaturalHeight()
    )

def parse_fbs_duc_image_element(fbs_image_element: FBSDucImageElement) -> DucImageElement:
    base = parse_fbs_duc_element_base(fbs_image_element.Base())
    
    scale = [fbs_image_element.Scale(i) for i in range(fbs_image_element.ScaleLength())]
    
    return DucImageElement(
        base=base,
        scale=scale,
        status=fbs_image_element.Status(),
        file_id=fbs_image_element.FileId().decode('utf-8') if fbs_image_element.FileId() else None,
        crop=parse_fbs_image_crop(fbs_image_element.Crop()) if fbs_image_element.Crop() else None,
        filter=parse_fbs_duc_image_filter(fbs_image_element.Filter()) if fbs_image_element.Filter() else None
    )

def parse_fbs_duc_text_dynamic_element_source(fbs_dynamic_el_source: FBSDucTextDynamicElementSource) -> DucTextDynamicElementSource:
    return DucTextDynamicElementSource(
        element_id=fbs_dynamic_el_source.ElementId().decode('utf-8'),
        property=fbs_dynamic_el_source.Property() if fbs_dynamic_el_source.Property() is not None else None
    )

def parse_fbs_duc_text_dynamic_dictionary_source(fbs_dynamic_dict_source: FBSDucTextDynamicDictionarySource) -> DucTextDynamicDictionarySource:
    return DucTextDynamicDictionarySource(
        key=fbs_dynamic_dict_source.Key().decode('utf-8')
    )

def parse_fbs_duc_text_dynamic_source(fbs_dynamic_source: FBSDucTextDynamicSource) -> DucTextDynamicSource:
    source_data = None
    if fbs_dynamic_source.SourceType() == FBSDucTextDynamicSource.DucTextDynamicElementSource:
        source_data = parse_fbs_duc_text_dynamic_element_source(fbs_dynamic_source.SourceAsDucTextDynamicElementSource())
    elif fbs_dynamic_source.SourceType() == FBSDucTextDynamicSource.DucTextDynamicDictionarySource:
        source_data = parse_fbs_duc_text_dynamic_dictionary_source(fbs_dynamic_source.SourceAsDucTextDynamicDictionarySource())
    
    return DucTextDynamicSource(
        text_source_type=fbs_dynamic_source.TextSourceType() if fbs_dynamic_source.TextSourceType() is not None else None,
        source=source_data # type: ignore
    )

def parse_fbs_duc_text_dynamic_part(fbs_dynamic_part: FBSDucTextDynamicPart) -> DucTextDynamicPart:
    # Local import to avoid circular dependency
    from .parse_duc_state import parse_fbs_primary_units
    return DucTextDynamicPart(
        tag=fbs_dynamic_part.Tag().decode('utf-8'),
        source=parse_fbs_duc_text_dynamic_source(fbs_dynamic_part.Source()),
        formatting=parse_fbs_primary_units(fbs_dynamic_part.Formatting()), # Needs parse_fbs_primary_units from Standards
        cached_value=fbs_dynamic_part.CachedValue().decode('utf-8')
    )

def parse_fbs_duc_text_element(fbs_text_element: FBSDucTextElement) -> DucTextElement:
    dynamic_list = [parse_fbs_duc_text_dynamic_part(fbs_text_element.Dynamic(i)) for i in range(fbs_text_element.DynamicLength())]
    return DucTextElement(
        base=parse_fbs_duc_element_base(fbs_text_element.Base()),
        style=parse_fbs_duc_text_style(fbs_text_element.Style()),
        text=fbs_text_element.Text().decode('utf-8') if fbs_text_element.Text() is not None else "",
        dynamic=dynamic_list,
        auto_resize=bool(fbs_text_element.AutoResize()),
        container_id=fbs_text_element.ContainerId().decode('utf-8') if fbs_text_element.ContainerId() is not None else "",
        original_text=fbs_text_element.OriginalText().decode('utf-8') if fbs_text_element.OriginalText() is not None else ""
    )

def parse_fbs_duc_linear_element(fbs_linear_element: FBSDucLinearElement) -> DucLinearElement:
    return DucLinearElement(
        linear_base=parse_fbs_duc_linear_element_base(fbs_linear_element.LinearBase()),
        wipeout_below=bool(fbs_linear_element.WipeoutBelow())
    )

def parse_fbs_duc_arrow_element(fbs_arrow_element: FBSDucArrowElement) -> DucArrowElement:
    return DucArrowElement(
        linear_base=parse_fbs_duc_linear_element_base(fbs_arrow_element.LinearBase()),
        elbowed=bool(fbs_arrow_element.Elbowed())
    )

def parse_fbs_duc_free_draw_ends(fbs_ends: FBSDucFreeDrawEnds) -> DucFreeDrawEnds:
    if fbs_ends is None:
        return None
    return DucFreeDrawEnds(
        cap=bool(fbs_ends.Cap()),
        taper=fbs_ends.Taper(),
        easing=fbs_ends.Easing().decode('utf-8')
    )

def parse_fbs_duc_free_draw_element(fbs_freedraw_element: FBSDucFreeDrawElement) -> DucFreeDrawElement:
    points_list = [parse_fbs_duc_point(fbs_freedraw_element.Points(i)) for i in range(fbs_freedraw_element.PointsLength())]
    pressures_list = [fbs_freedraw_element.Pressures(i) for i in range(fbs_freedraw_element.PressuresLength())]
    return DucFreeDrawElement(
        base=parse_fbs_duc_element_base(fbs_freedraw_element.Base()),
        points=points_list,
        size=fbs_freedraw_element.Size(),
        thinning=fbs_freedraw_element.Thinning(),
        smoothing=fbs_freedraw_element.Smoothing(),
        streamline=fbs_freedraw_element.Streamline(),
        easing=fbs_freedraw_element.Easing().decode('utf-8'),
        start=parse_fbs_duc_free_draw_ends(fbs_freedraw_element.Start()),
        end=parse_fbs_duc_free_draw_ends(fbs_freedraw_element.End()),
        pressures=pressures_list,
        simulate_pressure=bool(fbs_freedraw_element.SimulatePressure()),
        last_committed_point=parse_fbs_duc_point(fbs_freedraw_element.LastCommittedPoint()),
        svg_path=fbs_freedraw_element.SvgPath().decode('utf-8') if fbs_freedraw_element.SvgPath() is not None else None
    )

def parse_fbs_duc_block_attribute_definition(fbs_attr_def: FBSDucBlockAttributeDefinition) -> DucBlockAttributeDefinition:
    return DucBlockAttributeDefinition(
        tag=fbs_attr_def.Tag().decode('utf-8'),
        prompt=fbs_attr_def.Prompt().decode('utf-8') if fbs_attr_def.Prompt() else None,
        default_value=fbs_attr_def.DefaultValue().decode('utf-8'),
        is_constant=bool(fbs_attr_def.IsConstant())
    )

def parse_fbs_duc_block_attribute_definition_entry(fbs_attr_def_entry: FBSDucBlockAttributeDefinitionEntry) -> DucBlockAttributeDefinitionEntry:
    # Assuming the entry is just a wrapper for the value
    return DucBlockAttributeDefinitionEntry(
        key=fbs_attr_def_entry.Key().decode('utf-8'),
        value=parse_fbs_duc_block_attribute_definition(fbs_attr_def_entry.Value())
    )

def parse_fbs_duc_block(fbs_block: FBSDucBlock) -> DucBlock:
    elements_list = [parse_duc_element_wrapper(fbs_block.Elements(i)) for i in range(fbs_block.ElementsLength())]
    attribute_definitions_list = [parse_fbs_duc_block_attribute_definition_entry(fbs_block.AttributeDefinitions(i)) for i in range(fbs_block.AttributeDefinitionsLength())]
    return DucBlock(
        id=fbs_block.Id().decode('utf-8'),
        label=fbs_block.Label().decode('utf-8'),
        description=fbs_block.Description().decode('utf-8') if fbs_block.Description() else None,
        version=fbs_block.Version(),
        elements=elements_list,
        attribute_definitions=attribute_definitions_list
    )

def parse_fbs_string_value_entry(fbs_entry: FBSStringValueEntry) -> StringValueEntry:
    return StringValueEntry(
        key=fbs_entry.Key().decode('utf-8'),
        value=fbs_entry.Value().decode('utf-8')
    )

def parse_fbs_duc_block_duplication_array(fbs_duplication_array: FBSDucBlockDuplicationArray) -> Optional[DucBlockDuplicationArray]:
    if fbs_duplication_array is None:
        return None
    return DucBlockDuplicationArray(
        rows=fbs_duplication_array.Rows(),
        cols=fbs_duplication_array.Cols(),
        row_spacing=fbs_duplication_array.RowSpacing(),
        col_spacing=fbs_duplication_array.ColSpacing()
    )

def parse_fbs_duc_block_instance_element(fbs_block_instance: FBSDucBlockInstanceElement) -> DucBlockInstanceElement:
    element_overrides_list = [parse_fbs_string_value_entry(fbs_block_instance.ElementOverrides(i)) for i in range(fbs_block_instance.ElementOverridesLength())]
    attribute_values_list = [parse_fbs_string_value_entry(fbs_block_instance.AttributeValues(i)) for i in range(fbs_block_instance.AttributeValuesLength())]
    return DucBlockInstanceElement(
        base=parse_fbs_duc_element_base(fbs_block_instance.Base()),
        block_id=fbs_block_instance.BlockId().decode('utf-8'),
        element_overrides=element_overrides_list,
        attribute_values=attribute_values_list,
        duplication_array=parse_fbs_duc_block_duplication_array(fbs_block_instance.DuplicationArray())
    )

def parse_fbs_duc_frame_element(fbs_frame_element: FBSDucFrameElement) -> DucFrameElement:
    return DucFrameElement(
        stack_element_base=parse_fbs_duc_stack_element_base(fbs_frame_element.StackElementBase())
    )

def parse_fbs_plot_layout(fbs_plot_layout: FBSPlotLayout) -> PlotLayout:
    return PlotLayout(
        margins=parse_fbs_margins(fbs_plot_layout.Margins())
    )

def parse_fbs_duc_plot_element(fbs_plot_element: FBSDucPlotElement) -> DucPlotElement:
    return DucPlotElement(
        stack_element_base=parse_fbs_duc_stack_element_base(fbs_plot_element.StackElementBase()),
        style=parse_fbs_duc_plot_style(fbs_plot_element.Style()),
        layout=parse_fbs_plot_layout(fbs_plot_element.Layout())
    )

def parse_fbs_duc_viewport_element(fbs_viewport_element: FBSDucViewportElement) -> DucViewportElement:
    frozen_group_ids_list = [fbs_viewport_element.FrozenGroupIds(i).decode('utf-8') for i in range(fbs_viewport_element.FrozenGroupIdsLength())]
    return DucViewportElement(
        linear_base=parse_fbs_duc_linear_element_base(fbs_viewport_element.LinearBase()),
        stack_base=parse_fbs_duc_stack_base(fbs_viewport_element.StackBase()),
        style=parse_fbs_duc_viewport_style(fbs_viewport_element.Style()),
        view=parse_fbs_duc_view(fbs_viewport_element.View()),
        scale=fbs_viewport_element.Scale(),
        shade_plot=fbs_viewport_element.ShadePlot() if fbs_viewport_element.ShadePlot() is not None else None,
        frozen_group_ids=frozen_group_ids_list,
        standard_override=fbs_viewport_element.StandardOverride().decode('utf-8') if fbs_viewport_element.StandardOverride() else None,
    )

def parse_fbs_duc_xray_element(fbs_xray_element: FBSDucXRayElement) -> DucXRayElement:
    return DucXRayElement(
        base=parse_fbs_duc_element_base(fbs_xray_element.Base()),
        style=parse_fbs_duc_xray_style(fbs_xray_element.Style()),
        origin=parse_fbs_geometric_point(fbs_xray_element.Origin()), # Corrected to GeometricPoint
        direction=parse_fbs_geometric_point(fbs_xray_element.Direction()), # Corrected to GeometricPoint
        start_from_origin=bool(fbs_xray_element.StartFromOrigin())
    )

def parse_fbs_leader_text_block_content(fbs_text_content: FBSLeaderTextBlockContent) -> LeaderTextBlockContent:
    return LeaderTextBlockContent(
        text=fbs_text_content.Text().decode('utf-8')
    )

def parse_fbs_leader_block_content(fbs_block_content: FBSLeaderBlockContent) -> LeaderBlockContent:
    attribute_values_list = [parse_fbs_string_value_entry(fbs_block_content.AttributeValues(i)) for i in range(fbs_block_content.AttributeValuesLength())]
    element_overrides_list = [parse_fbs_string_value_entry(fbs_block_content.ElementOverrides(i)) for i in range(fbs_block_content.ElementOverridesLength())]
    return LeaderBlockContent(
        block_id=fbs_block_content.BlockId().decode('utf-8'),
        attribute_values=attribute_values_list,
        element_overrides=element_overrides_list
    )

def parse_fbs_leader_content(fbs_leader_content: FBSLeaderContent) -> LeaderContent:
    if not fbs_leader_content:
        return None
        
    content_data = None
    if fbs_leader_content.ContentType() == LeaderContentFBType.LeaderTextBlockContent:
        content_data = parse_fbs_leader_text_block_content(fbs_leader_content.ContentAsLeaderTextBlockContent())
    elif fbs_leader_content.ContentType() == LeaderContentFBType.LeaderBlockContent:
        content_data = parse_fbs_leader_block_content(fbs_leader_content.ContentAsLeaderBlockContent())
    
    return LeaderContent(
        content=content_data # type: ignore
    )

def parse_fbs_duc_leader_element(fbs_leader_element: FBSDucLeaderElement) -> DataClassDucLeaderElement:
    return DataClassDucLeaderElement(
        linear_base=parse_fbs_duc_linear_element_base(fbs_leader_element.LinearBase()),
        style=parse_fbs_duc_leader_style(fbs_leader_element.Style()),
        content=parse_fbs_leader_content(fbs_leader_element.Content()),
        content_anchor=parse_fbs_geometric_point(fbs_leader_element.ContentAnchor())
    )

def parse_fbs_dimension_definition_points(fbs_def_points: FBSDimensionDefinitionPoints) -> DimensionDefinitionPoints:
    return DimensionDefinitionPoints(
        origin1=parse_fbs_geometric_point(fbs_def_points.Origin1()),
        origin2=parse_fbs_geometric_point(fbs_def_points.Origin2()),
        location=parse_fbs_geometric_point(fbs_def_points.Location()),
        center=parse_fbs_geometric_point(fbs_def_points.Center()),
        jog=parse_fbs_geometric_point(fbs_def_points.Jog())
    )

def parse_fbs_dimension_bindings(fbs_dim_bindings: FBSDimensionBindings) -> DimensionBindings:
    if fbs_dim_bindings is None:
        return None
    return DimensionBindings(
        origin1=parse_fbs_duc_point_binding(fbs_dim_bindings.Origin1()) if fbs_dim_bindings.Origin1() else None,
        origin2=parse_fbs_duc_point_binding(fbs_dim_bindings.Origin2()) if fbs_dim_bindings.Origin2() else None,
        center=parse_fbs_duc_point_binding(fbs_dim_bindings.Center()) if fbs_dim_bindings.Center() else None
    )

def parse_fbs_dimension_baseline_data(fbs_baseline_data: FBSDimensionBaselineData) -> DimensionBaselineData:
    if fbs_baseline_data is None:
        return None
    return DimensionBaselineData(
        base_dimension_id=fbs_baseline_data.BaseDimensionId().decode('utf-8') if fbs_baseline_data.BaseDimensionId() else None
    )

def parse_fbs_dimension_continue_data(fbs_continue_data: FBSDimensionContinueData) -> DimensionContinueData:
    if fbs_continue_data is None:
        return None
    return DimensionContinueData(
        continue_from_dimension_id=fbs_continue_data.ContinueFromDimensionId().decode('utf-8') if fbs_continue_data.ContinueFromDimensionId() else None
    )

def parse_fbs_duc_dimension_element(fbs_dim_element: FBSDucDimensionElement) -> DucDimensionElement:
    return DucDimensionElement(
        base=parse_fbs_duc_element_base(fbs_dim_element.Base()),
        style=parse_fbs_duc_dimension_style(fbs_dim_element.Style()),
        dimension_type=fbs_dim_element.DimensionType() if fbs_dim_element.DimensionType() is not None else None,
        definition_points=parse_fbs_dimension_definition_points(fbs_dim_element.DefinitionPoints()),
        oblique_angle=fbs_dim_element.ObliqueAngle(),
        ordinate_axis=fbs_dim_element.OrdinateAxis() if fbs_dim_element.OrdinateAxis() is not None else None,
        bindings=parse_fbs_dimension_bindings(fbs_dim_element.Bindings()) if fbs_dim_element.Bindings() else None,
        text_override=fbs_dim_element.TextOverride().decode('utf-8') if fbs_dim_element.TextOverride() else None,
        text_position=parse_fbs_geometric_point(fbs_dim_element.TextPosition()) if fbs_dim_element.TextPosition() else None,
        tolerance_override=parse_fbs_dimension_tolerance_style(fbs_dim_element.ToleranceOverride()) if fbs_dim_element.ToleranceOverride() else None,
        baseline_data=parse_fbs_dimension_baseline_data(fbs_dim_element.BaselineData()) if fbs_dim_element.BaselineData() else None,
        continue_data=parse_fbs_dimension_continue_data(fbs_dim_element.ContinueData()) if fbs_dim_element.ContinueData() else None
    )

def parse_fbs_datum_reference(fbs_datum_ref: FBSDatumReference) -> DatumReference:
    return DatumReference(
        letters=fbs_datum_ref.Letters().decode('utf-8'),
        modifier=fbs_datum_ref.Modifier() if fbs_datum_ref.Modifier() is not None else None
    )

def parse_fbs_tolerance_clause(fbs_tol_clause: FBSToleranceClause) -> ToleranceClause:
    feature_modifiers_list = [fbs_tol_clause.FeatureModifiers(i) for i in range(fbs_tol_clause.FeatureModifiersLength())]
    return ToleranceClause(
        value=fbs_tol_clause.Value().decode('utf-8'),
        zone_type=fbs_tol_clause.ZoneType() if fbs_tol_clause.ZoneType() is not None else None,
        feature_modifiers=feature_modifiers_list,
        material_condition=fbs_tol_clause.MaterialCondition() if fbs_tol_clause.MaterialCondition() is not None else None
    )

def parse_fbs_feature_control_frame_segment(fbs_fcf_segment: FBSFeatureControlFrameSegment) -> FeatureControlFrameSegment:
    datums_list = [parse_fbs_datum_reference(fbs_fcf_segment.Datums(i)) for i in range(fbs_fcf_segment.DatumsLength())]
    return FeatureControlFrameSegment(
        symbol=fbs_fcf_segment.Symbol() if fbs_fcf_segment.Symbol() is not None else None,
        tolerance=parse_fbs_tolerance_clause(fbs_fcf_segment.Tolerance()),
        datums=datums_list
    )

def parse_fbs_fcf_between_modifier(fbs_between_mod: FBSFCFBetweenModifier) -> FCFBetweenModifier:
    if fbs_between_mod is None:
        return None
    return FCFBetweenModifier(
        start=fbs_between_mod.Start().decode('utf-8'),
        end=fbs_between_mod.End().decode('utf-8')
    )

def parse_fbs_fcf_projected_zone_modifier(fbs_proj_zone_mod: FBSFCFProjectedZoneModifier) -> FCFProjectedZoneModifier:
    if fbs_proj_zone_mod is None:
        return None
    return FCFProjectedZoneModifier(
        value=fbs_proj_zone_mod.Value()
    )

def parse_fbs_fcf_frame_modifiers(fbs_frame_mod: FBSFCFFrameModifiers) -> FCFFrameModifiers:
    if fbs_frame_mod is None:
        return None
    return FCFFrameModifiers(
        all_around=bool(fbs_frame_mod.AllAround()),
        all_over=bool(fbs_frame_mod.AllOver()),
        continuous_feature=bool(fbs_frame_mod.ContinuousFeature()),
        between=parse_fbs_fcf_between_modifier(fbs_frame_mod.Between()),
        projected_tolerance_zone=parse_fbs_fcf_projected_zone_modifier(fbs_frame_mod.ProjectedToleranceZone())
    )

def parse_fbs_fcf_datum_definition(fbs_datum_def: FBSFCFDatumDefinition) -> FCFDatumDefinition:
    if fbs_datum_def is None:
        return None
    return FCFDatumDefinition(
        letter=fbs_datum_def.Letter().decode('utf-8'),
        feature_binding=parse_fbs_duc_point_binding(fbs_datum_def.FeatureBinding()) if fbs_datum_def.FeatureBinding() else None
    )

def parse_fbs_duc_feature_control_frame_element(fbs_fcf_element: FBSDucFeatureControlFrameElement) -> DucFeatureControlFrameElement:
    rows_list = []
    for i in range(fbs_fcf_element.RowsLength()):
        fbs_fcf_segment_row = fbs_fcf_element.Rows(i)
        segment_list = []
        for j in range(fbs_fcf_segment_row.SegmentsLength()):
            segment_list.append(parse_fbs_feature_control_frame_segment(fbs_fcf_segment_row.Segments(j)))
        
        # Create FCFSegmentRow dataclass instance
        fcf_segment_row = FCFSegmentRow(segments=segment_list)
        rows_list.append(fcf_segment_row)

    return DucFeatureControlFrameElement(
        base=parse_fbs_duc_element_base(fbs_fcf_element.Base()),
        style=parse_fbs_duc_feature_control_frame_style(fbs_fcf_element.Style()),
        rows=rows_list,
        frame_modifiers=parse_fbs_fcf_frame_modifiers(fbs_fcf_element.FrameModifiers()),
        leader_element_id=fbs_fcf_element.LeaderElementId().decode('utf-8') if fbs_fcf_element.LeaderElementId() else None,
        datum_definition=parse_fbs_fcf_datum_definition(fbs_fcf_element.DatumDefinition())
    )

def parse_fbs_text_column(fbs_text_column: FBSTextColumn) -> TextColumn:
    return TextColumn(
        width=fbs_text_column.Width(),
        gutter=fbs_text_column.Gutter()
    )

def parse_fbs_column_layout(fbs_column_layout: FBSColumnLayout) -> ColumnLayout:
    definitions_list = [parse_fbs_text_column(fbs_column_layout.Definitions(i)) for i in range(fbs_column_layout.DefinitionsLength())]
    return ColumnLayout(
        type=fbs_column_layout.Type() if fbs_column_layout.Type() is not None else None,
        definitions=definitions_list,
        auto_height=bool(fbs_column_layout.AutoHeight())
    )

def parse_fbs_duc_doc_element(fbs_doc_element: FBSDucDocElement) -> DucDocElement:
    dynamic_list = [parse_fbs_duc_text_dynamic_part(fbs_doc_element.Dynamic(i)) for i in range(fbs_doc_element.DynamicLength())]
    return DucDocElement(
        base=parse_fbs_duc_element_base(fbs_doc_element.Base()),
        style=parse_fbs_duc_doc_style(fbs_doc_element.Style()),
        text=fbs_doc_element.Text().decode('utf-8'),
        dynamic=dynamic_list,
        flow_direction=fbs_doc_element.FlowDirection() if fbs_doc_element.FlowDirection() is not None else None,
        columns=parse_fbs_column_layout(fbs_doc_element.Columns()),
        auto_resize=bool(fbs_doc_element.AutoResize())
    )

def parse_fbs_parametric_source(fbs_param_source: FBSParametricSource) -> ParametricSource:
    return ParametricSource(
        type=fbs_param_source.Type() if fbs_param_source.Type() is not None else None,
        code=fbs_param_source.Code().decode('utf-8'),
        file_id=fbs_param_source.FileId().decode('utf-8')
    )

def parse_fbs_duc_parametric_element(fbs_param_element: FBSDucParametricElement) -> DucParametricElement:
    return DucParametricElement(
        base=parse_fbs_duc_element_base(fbs_param_element.Base()),
        source=parse_fbs_parametric_source(fbs_param_element.Source())
    )

# Main parsing function for ElementWrapper
def parse_duc_element_wrapper(fbs_element_wrapper: FBSElementUnion) -> ElementWrapper:
    element_type = fbs_element_wrapper.ElementType()
    element_data = None
    
    element_table = fbs_element_wrapper.Element()

    if element_type == FBSElementUnion.DucRectangleElement:
        fbs_rect = FBSDucRectangleElement()
        fbs_rect.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_rectangle_element(fbs_rect)
    elif element_type == FBSElementUnion.DucPolygonElement:
        fbs_poly = FBSDucPolygonElement()
        fbs_poly.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_polygon_element(fbs_poly)
    elif element_type == FBSElementUnion.DucEllipseElement:
        fbs_ellipse = FBSDucEllipseElement()
        fbs_ellipse.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_ellipse_element(fbs_ellipse)
    elif element_type == FBSElementUnion.DucEmbeddableElement:
        fbs_embed = FBSDucEmbeddableElement()
        fbs_embed.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_embeddable_element(fbs_embed)
    elif element_type == FBSElementUnion.DucPdfElement:
        fbs_pdf = FBSDucPdfElement()
        fbs_pdf.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_pdf_element(fbs_pdf)
    elif element_type == FBSElementUnion.DucMermaidElement:
        fbs_mermaid = FBSDucMermaidElement()
        fbs_mermaid.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_mermaid_element(fbs_mermaid)
    elif element_type == FBSElementUnion.DucTableElement:
        fbs_table = FBSDucTableElement()
        fbs_table.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_table_element(fbs_table)
    elif element_type == FBSElementUnion.DucImageElement:
        fbs_image = FBSDucImageElement()
        fbs_image.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_image_element(fbs_image)
    elif element_type == FBSElementUnion.DucTextElement:
        fbs_text = FBSDucTextElement()
        fbs_text.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_text_element(fbs_text)
    elif element_type == FBSElementUnion.DucLinearElement:
        fbs_linear = FBSDucLinearElement()
        fbs_linear.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_linear_element(fbs_linear)
    elif element_type == FBSElementUnion.DucArrowElement:
        fbs_arrow = FBSDucArrowElement()
        fbs_arrow.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_arrow_element(fbs_arrow)
    elif element_type == FBSElementUnion.DucFreeDrawElement:
        fbs_freedraw = FBSDucFreeDrawElement()
        fbs_freedraw.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_free_draw_element(fbs_freedraw)
    elif element_type == FBSElementUnion.DucBlockInstanceElement:
        fbs_block_instance = FBSDucBlockInstanceElement()
        fbs_block_instance.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_block_instance_element(fbs_block_instance)
    elif element_type == FBSElementUnion.DucFrameElement:
        fbs_frame = FBSDucFrameElement()
        fbs_frame.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_frame_element(fbs_frame)
    elif element_type == FBSElementUnion.DucPlotElement:
        fbs_plot = FBSDucPlotElement()
        fbs_plot.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_plot_element(fbs_plot)
    elif element_type == FBSElementUnion.DucViewportElement:
        fbs_viewport = FBSDucViewportElement()
        fbs_viewport.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_viewport_element(fbs_viewport)
    elif element_type == FBSElementUnion.DucXRayElement:
        fbs_xray = FBSDucXRayElement()
        fbs_xray.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_xray_element(fbs_xray)
    elif element_type == FBSElementUnion.DucLeaderElement:
        fbs_leader = FBSDucLeaderElement()
        fbs_leader.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_leader_element(fbs_leader)
    elif element_type == FBSElementUnion.DucDimensionElement:
        fbs_dimension = FBSDucDimensionElement()
        fbs_dimension.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_dimension_element(fbs_dimension)
    elif element_type == FBSElementUnion.DucFeatureControlFrameElement:
        fbs_fcf = FBSDucFeatureControlFrameElement()
        fbs_fcf.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_feature_control_frame_element(fbs_fcf)
    elif element_type == FBSElementUnion.DucDocElement:
        fbs_doc = FBSDucDocElement()
        fbs_doc.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_doc_element(fbs_doc)
    elif element_type == FBSElementUnion.DucParametricElement:
        fbs_parametric = FBSDucParametricElement()
        fbs_parametric.Init(element_table.Bytes, element_table.Pos)
        element_data = parse_fbs_duc_parametric_element(fbs_parametric)

    return ElementWrapper(element=element_data)
