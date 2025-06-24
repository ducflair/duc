import flatbuffers
import logging
from typing import List, Optional, Dict, Any
from ..Duc import ElementStroke
from ..Duc.DucElement import (
    Start as DucElementStart,
    End as DucElementEnd,
    AddId, AddType, AddXV3, AddYV3, AddWidthV3, AddHeightV3, AddAngleV3,
    AddFrameId, AddStroke, AddBackground, AddOpacity, AddGroupIds,
    AddBoundElements, AddRoundness, AddLocked, AddLink, AddLabel,
    AddIsVisible, AddBlending, AddSubset, AddScope, AddIsDeleted,
    AddText, AddFontSizeV3, AddFontFamily, AddTextAlignV3, AddVerticalAlignV3,
    AddLineHeightV3, AddAutoResize, AddContainerId, AddPoints, AddPressuresV3,
    AddLastCommittedPoint, AddSimulatePressure, AddFileId, AddStatus,
    AddScaleV3, AddCrop, AddIsCollapsed, AddClip, AddGroupIdRef,
    AddStartBinding, AddEndBinding, AddElbowed,
    StartGroupIdsVector, StartBoundElementsVector, StartPointsVector,
    StartPressuresV3Vector, StartStrokeVector, StartBackgroundVector,
    AddPolygonSides, AddDocContent, AddLines, AddEllipseRatio, AddEllipseStartAngle,
    AddEllipseEndAngle, AddEllipseShowAuxCrosshair, AddFreeDrawThinning,
    AddFreeDrawSmoothing, AddFreeDrawStreamline, AddFreeDrawEasing,
    AddFreeDrawStartCap, AddFreeDrawStartTaper, AddFreeDrawStartEasing,
    AddFreeDrawEndCap, AddFreeDrawEndTaper, AddFreeDrawEndEasing,
    AddFreeDrawSvgPath, AddFreeDrawSize, AddLinearElementPathOverrides,
    StartLinesVector, StartLinearElementPathOverridesVector
)
from ..Duc.DucElement import *
from ..Duc.Point import (
    Start as PointStart,
    End as PointEnd,
    AddXV3 as AddPointX,
    AddYV3 as AddPointY,
    AddMirroring as AddPointMirroring,
)
from ..Duc.PointBinding import (
    Start as BindingElementStart,
    End as BindingElementEnd,
    AddElementId as AddBindingElementId,
    AddFocus as AddBindingFocus,
    AddGap as AddBindingGap,
    AddFixedPoint as AddBindingFixedPoint,
    AddPoint as AddBindingPoint,
    AddHead as AddBindingHead,
)
from ..Duc.BindingPoint import (
    Start as BindingPointStart,
    End as BindingPointEnd,
    AddIndex as AddBindingPointIndex,
    AddOffset as AddBindingPointOffset
)
from ..Duc.ElementContentBase import (
    Start as ElementContentBaseStart,
    End as ElementContentBaseEnd,
    AddPreference, AddSrc, AddVisible, AddOpacity as AddElementContentOpacity, AddTiling
)
from ..Duc.TilingProperties import (
    Start as TilingPropertiesStart,
    End as TilingPropertiesEnd,
    AddSizeInPercent, AddAngle, AddSpacing, AddOffsetX, AddOffsetY
)
from ..Duc.StrokeStyle import (
    Start as StrokeStyleStart,
    End as StrokeStyleEnd,
    AddPreference as AddStrokePreference,
    AddCap, AddJoin, AddDash, AddDashCap, AddMiterLimit,
    StrokeStyleStartDashVector
)
from ..Duc.StrokeSides import (
    Start as StrokeSidesStart,
    End as StrokeSidesEnd,
    AddPreference as AddStrokeSidesPreference,
    AddValues,
    StrokeSidesStartValuesVector
)
from ..Duc.ElementStroke import (
    Start as ElementStrokeStart,
    End as ElementStrokeEnd,
    AddContent, AddWidth, AddStyle, AddPlacement, AddStrokeSides
)
from ..Duc.ElementBackground import (
    Start as ElementBackgroundStart,
    End as ElementBackgroundEnd,
    AddContent as AddBackgroundContent
)
from ..Duc.SimplePoint import (
    Start as BezierHandleStart,
    End as BezierHandleEnd,
    AddX as AddBezierHandleX,
    AddY as AddBezierHandleY
)
from ..utils.enums import ElementType
from ..classes.DucElementClass import (
    DucElementUnion, DucElementBase, ImageCrop, Point, BezierHandle,
    SimplePoint, ElementStroke, ElementBackground, ElementContentBase, 
    StrokeStyleProps, StrokeSides, TilingProperties, BindingPoint, PointBinding,
    BoundElement, DucLine, DucLineReference, DucPath, DucTableStyleProps, 
    DucTableColumn, DucTableRow, DucTableCell, DucTableStyle,
    # All element types
    DucSelectionElement, DucRectangleElement, DucPolygonElement, DucEllipseElement,
    DucImageElement, DucFrameElement, DucGroupElement, DucMagicFrameElement,
    DucEmbeddableElement, DucIframeElement, DucTableElement, DucDocElement,
    DucTextElement, DucLinearElement, DucArrowElement, DucFreeDrawElement,
    DucFreeDrawEnds
)
from ..Duc.BoundElement import (
    Start as BoundElementStart,
    End as BoundElementEnd,
    AddId as AddBoundElementId,
    AddType as AddBoundElementType
)
from ..Duc.ImageCrop import (
    Start as ImageCropStart,
    End as ImageCropEnd,
    AddX as AddImageCropX,
    AddY as AddImageCropY,
    AddWidth as AddImageCropWidth,
    AddHeight as AddImageCropHeight,
    AddNaturalWidth as AddImageCropNaturalWidth,
    AddNaturalHeight as AddImageCropNaturalHeight
)
from ..Duc.SimplePoint import (
    Start as SimplePointStart,
    End as SimplePointEnd,
    AddX as AddSimplePointX,
    AddY as AddSimplePointY,
)
from ..Duc.DucLine import (
    Start as DucLineStart,
    End as DucLineEnd,
    AddStart, AddEnd
)
from ..Duc.DucLineReference import (
    Start as DucLineReferenceStart,
    End as DucLineReferenceEnd,
    AddIndex, AddHandle
)
from ..Duc.DucPath import (
    Start as DucPathStart,
    End as DucPathEnd,
    AddLineIndices, AddBackground as AddPathBackground, AddStroke as AddPathStroke,
    StartLineIndicesVector
)
from ..Duc.DucTableStyleProps import (
    Start as DucTableStylePropsStart,
    End as DucTableStylePropsEnd,
    AddBackgroundColor, AddBorderWidth, AddBorderDashes, AddBorderColor,
    AddTextColor, AddTextSize, AddTextFont, AddTextAlign,
    StartBorderDashesVector
)
from ..Duc.DucTableColumn import (
    Start as DucTableColumnStart,
    End as DucTableColumnEnd,
    AddId as AddColumnId, AddWidth as AddColumnWidth, AddStyle as AddColumnStyle
)
from ..Duc.DucTableRow import (
    Start as DucTableRowStart,
    End as DucTableRowEnd,
    AddId as AddRowId, AddHeight as AddRowHeight, AddStyle as AddRowStyle
)
from ..Duc.DucTableCell import (
    Start as DucTableCellStart,
    End as DucTableCellEnd,
    AddRowId as AddCellRowId, AddColumnId as AddCellColumnId, AddData, AddStyle as AddCellStyle
)
from ..Duc.DucTableStyle import (
    Start as DucTableStyleStart,
    End as DucTableStyleEnd,
    AddDefaultProps
)

logger = logging.getLogger(__name__)

def serialize_duc_line_reference(builder: flatbuffers.Builder, ref: DucLineReference):
    handle_offset = serialize_simple_point(builder, ref.handle.x, ref.handle.y) if ref.handle else 0
    DucLineReferenceStart(builder)
    AddIndex(builder, ref.index)
    if handle_offset:
        AddHandle(builder, handle_offset)
    return DucLineReferenceEnd(builder)

def serialize_duc_line(builder: flatbuffers.Builder, line: DucLine):
    start_offset = serialize_duc_line_reference(builder, line.start)
    end_offset = serialize_duc_line_reference(builder, line.end)
    DucLineStart(builder)
    AddStart(builder, start_offset)
    AddEnd(builder, end_offset)
    return DucLineEnd(builder)

def serialize_duc_path(builder: flatbuffers.Builder, path: DucPath):
    # Create all nested objects first
    background_offset = serialize_element_background(builder, [path.background]) if path.background else None
    stroke_offset = serialize_element_stroke(builder, [path.stroke]) if path.stroke else None
    
    # Create vector
    StartLineIndicesVector(builder, len(path.line_indices))
    for index in reversed(path.line_indices):
        builder.PrependInt32(index)
    line_indices_vector = builder.EndVector()

    # Now create the main object
    DucPathStart(builder)
    AddLineIndices(builder, line_indices_vector)
    if background_offset:
        AddPathBackground(builder, background_offset)
    if stroke_offset:
        AddPathStroke(builder, stroke_offset)
    return DucPathEnd(builder)

def serialize_duc_table_style_props(builder: flatbuffers.Builder, props: DucTableStyleProps):
    background_color_offset = builder.CreateString(props.background_color) if props.background_color else 0
    border_color_offset = builder.CreateString(props.border_color) if props.border_color else 0
    text_color_offset = builder.CreateString(props.text_color) if props.text_color else 0
    text_font_offset = builder.CreateString(props.text_font) if props.text_font else 0
    
    StartBorderDashesVector(builder, len(props.border_dashes))
    for dash in reversed(props.border_dashes):
        builder.PrependFloat64(dash)
    border_dashes_vector = builder.EndVector()

    DucTableStylePropsStart(builder)
    if background_color_offset:
        AddBackgroundColor(builder, background_color_offset)
    if props.border_width is not None:
        AddBorderWidth(builder, props.border_width)
    if border_dashes_vector:
        AddBorderDashes(builder, border_dashes_vector)
    if border_color_offset:
        AddBorderColor(builder, border_color_offset)
    if text_color_offset:
        AddTextColor(builder, text_color_offset)
    if props.text_size is not None:
        AddTextSize(builder, props.text_size)
    if text_font_offset:
        AddTextFont(builder, text_font_offset)
    if props.text_align is not None:
        AddTextAlign(builder, props.text_align)
    return DucTableStylePropsEnd(builder)

def serialize_duc_table_column(builder: flatbuffers.Builder, column: DucTableColumn):
    id_offset = builder.CreateString(column.id)
    style_offset = serialize_duc_table_style_props(builder, column.style) if column.style else 0
    
    DucTableColumnStart(builder)
    AddColumnId(builder, id_offset)
    AddColumnWidth(builder, column.width)
    if style_offset:
        AddColumnStyle(builder, style_offset)
    return DucTableColumnEnd(builder)

def serialize_duc_table_row(builder: flatbuffers.Builder, row: DucTableRow):
    id_offset = builder.CreateString(row.id)
    style_offset = serialize_duc_table_style_props(builder, row.style) if row.style else 0

    DucTableRowStart(builder)
    AddRowId(builder, id_offset)
    AddRowHeight(builder, row.height)
    if style_offset:
        AddRowStyle(builder, style_offset)
    return DucTableRowEnd(builder)

def serialize_duc_table_cell(builder: flatbuffers.Builder, cell: DucTableCell):
    row_id_offset = builder.CreateString(cell.row_id)
    column_id_offset = builder.CreateString(cell.column_id)
    data_offset = builder.CreateString(cell.data) if cell.data else 0
    style_offset = serialize_duc_table_style_props(builder, cell.style) if cell.style else 0
    
    DucTableCellStart(builder)
    AddCellRowId(builder, row_id_offset)
    AddCellColumnId(builder, column_id_offset)
    if data_offset:
        AddData(builder, data_offset)
    if style_offset:
        AddCellStyle(builder, style_offset)
    return DucTableCellEnd(builder)

def serialize_duc_table_style(builder: flatbuffers.Builder, style: DucTableStyle):
    default_props_offset = serialize_duc_table_style_props(builder, style.default_props) if style.default_props else 0
    
    DucTableStyleStart(builder)
    if default_props_offset:
        AddDefaultProps(builder, default_props_offset)
    return DucTableStyleEnd(builder)

def serialize_bezier_handle(builder: flatbuffers.Builder, handle: BezierHandle):
    BezierHandleStart(builder)
    AddBezierHandleX(builder, handle.x)
    AddBezierHandleY(builder, handle.y)
    return BezierHandleEnd(builder)

def serialize_point(builder: flatbuffers.Builder, point: Point):
    if not point:
        return None
  
    PointStart(builder)
    AddPointX(builder, point.x)
    AddPointY(builder, point.y)
    if point.mirroring is not None:
        AddPointMirroring(builder, point.mirroring)
    return PointEnd(builder)

def serialize_binding_point(builder: flatbuffers.Builder, binding: BindingPoint):
    BindingPointStart(builder)
    AddBindingPointIndex(builder, binding.index)
    AddBindingPointOffset(builder, binding.offset)
    return BindingPointEnd(builder)

def serialize_point_binding(builder: flatbuffers.Builder, binding: PointBinding):
    # Create all nested objects first
    id_offset = builder.CreateString(binding.element_id)
    fixed_point_offset = serialize_simple_point(builder, binding.fixed_point.x, binding.fixed_point.y)
    point_offset = serialize_binding_point(builder, binding.point) if binding.point else None
    
    # Now create the main object
    BindingElementStart(builder)
    AddBindingElementId(builder, id_offset)
    AddBindingFocus(builder, binding.focus)
    AddBindingGap(builder, binding.gap)
    if fixed_point_offset:
        AddBindingFixedPoint(builder, fixed_point_offset)
    if point_offset:
        AddBindingPoint(builder, point_offset)
    AddBindingHead(builder, binding.head)
    return BindingElementEnd(builder)
  
def serialize_tiling_properties(builder: flatbuffers.Builder, tiling: TilingProperties):
    if not tiling:
        return 0
    
    TilingPropertiesStart(builder)
    AddSizeInPercent(builder, tiling.size_in_percent)
    AddAngle(builder, tiling.angle)
    if tiling.spacing is not None:
        AddSpacing(builder, tiling.spacing)
    if tiling.offset_x is not None:
        AddOffsetX(builder, tiling.offset_x)
    if tiling.offset_y is not None:
        AddOffsetY(builder, tiling.offset_y)
    return TilingPropertiesEnd(builder)

def serialize_element_content_base(builder: flatbuffers.Builder, content: ElementContentBase):
    if not content:
        return 0
    
    # Create all string and table offsets first
    src_offset = None
    tiling_offset = None
    
    # Handle both dict and dataclass cases
    if isinstance(content, dict):
        # Create string offsets
        if content.get('src'):
            src_offset = builder.CreateString(content['src'])
        
        # Create tiling offset if needed
        if content.get('tiling'):
            tiling_offset = serialize_tiling_properties(builder, content['tiling'])
        
        # Now start building the table
        ElementContentBaseStart(builder)
        # Preference is required
        AddPreference(builder, content.get('preference', 0))  # Default to 0 (solid)
        if src_offset is not None:
            AddSrc(builder, src_offset)
        # Visible is required
        AddVisible(builder, bool(content.get('visible', True)))  # Default to True
        AddElementContentOpacity(builder, content.get('opacity'))
        if tiling_offset is not None:
            AddTiling(builder, tiling_offset)
    else:
        # Create string offsets
        if hasattr(content, 'src') and content.src:
            src_offset = builder.CreateString(content.src)
        
        # Create tiling offset if needed
        if hasattr(content, 'tiling') and content.tiling:
            tiling_offset = serialize_tiling_properties(builder, content.tiling)
        
        # Now start building the table
        ElementContentBaseStart(builder)
        # Preference is required
        AddPreference(builder, getattr(content, 'preference', 0))  # Default to 0 (solid)
        if src_offset is not None:
            AddSrc(builder, src_offset)
        # Visible is required
        AddVisible(builder, bool(getattr(content, 'visible', True)))  # Default to True
        # Opacity is required
        AddElementContentOpacity(builder, float(getattr(content, 'opacity')))
        if tiling_offset is not None:
            AddTiling(builder, tiling_offset)
    
    # Return the table offset
    return ElementContentBaseEnd(builder)

def serialize_stroke_style(builder: flatbuffers.Builder, style: StrokeStyleProps):
    if not style:
        return 0

    # Create dash vector if it exists
    dash_vector = None
    
    if isinstance(style, dict):
        if style.get('dash') and len(style['dash']) > 0:
            StrokeStyleStartDashVector(builder, len(style['dash']))
            for value in reversed(style['dash']):
                builder.PrependFloat64(value)
            dash_vector = builder.EndVector()

        StrokeStyleStart(builder)
        # Preference is required
        AddStrokePreference(builder, style.get('preference', 0))  # Default to 0 (solid)
        if style.get('cap') is not None:
            AddCap(builder, style['cap'])
        if style.get('join') is not None:
            AddJoin(builder, style['join'])
        if dash_vector:
            AddDash(builder, dash_vector)
        if style.get('dash_cap') is not None:
            AddDashCap(builder, style['dash_cap'])
        if style.get('miter_limit') is not None:
            AddMiterLimit(builder, style['miter_limit'])
    else:
        if hasattr(style, 'dash') and style.dash and len(style.dash) > 0:
            StrokeStyleStartDashVector(builder, len(style.dash))
            for value in reversed(style.dash):
                builder.PrependFloat64(value)
            dash_vector = builder.EndVector()

        StrokeStyleStart(builder)
        # Preference is required
        AddStrokePreference(builder, getattr(style, 'preference', 0))  # Default to 0 (solid)
        if hasattr(style, 'cap') and style.cap is not None:
            AddCap(builder, style.cap)
        if hasattr(style, 'join') and style.join is not None:
            AddJoin(builder, style.join)
        if dash_vector:
            AddDash(builder, dash_vector)
        if hasattr(style, 'dash_cap') and style.dash_cap is not None:
            AddDashCap(builder, style.dash_cap)
        if hasattr(style, 'miter_limit') and style.miter_limit is not None:
            AddMiterLimit(builder, style.miter_limit)
    
    # Return the table offset
    return StrokeStyleEnd(builder)

def serialize_stroke_sides(builder: flatbuffers.Builder, sides: StrokeSides):
    if not sides:
        return 0

    values_vector = None
    
    if isinstance(sides, dict):
        if sides.get('values') and len(sides.get('values', [])) > 0:
            StrokeSidesStartValuesVector(builder, len(sides['values']))
            for value in reversed(sides['values']):
                builder.PrependFloat64(value)
            values_vector = builder.EndVector()

        StrokeSidesStart(builder)
        # Preference is required
        AddStrokeSidesPreference(builder, sides.get('preference', 0))  # Default to 0 (solid)
        if values_vector:
            AddValues(builder, values_vector)
    else:
        if hasattr(sides, 'values') and sides.values and len(sides.values) > 0:
            StrokeSidesStartValuesVector(builder, len(sides.values))
            for value in reversed(sides.values):
                builder.PrependFloat64(value)
            values_vector = builder.EndVector()

        StrokeSidesStart(builder)
        # Preference is required
        AddStrokeSidesPreference(builder, getattr(sides, 'preference', 0))  # Default to 0 (solid)
        if values_vector:
            AddValues(builder, values_vector)
    
    return StrokeSidesEnd(builder)

def serialize_element_stroke(builder: flatbuffers.Builder, stroke: List[ElementStroke]):
    # Ensure stroke is iterable
    if not isinstance(stroke, list):
        return None
    
    if not stroke:
        return None

    # Create all offsets first
    stroke_offsets = []
    for entry in stroke:
        # Convert dict to ElementStroke object if needed
        if isinstance(entry, dict):
            entry = ElementStroke(
                content=ElementContentBase(**entry['content']) if entry.get('content') else None,
                width=entry.get('width', 0.0),  # Width is required
                style=StrokeStyle(**entry['style']) if entry.get('style') else None,
                placement=entry.get('placement', 11),  # Default to center placement
                stroke_sides=StrokeSides(**entry['stroke_sides']) if entry.get('stroke_sides') else None
            )
        
        # Create all nested offsets first
        entry_content_offset = None
        entry_style_offset = None
        entry_sides_offset = None
    
        if entry.content:
            entry_content_offset = serialize_element_content_base(builder, entry.content)
        if entry.style:
            entry_style_offset = serialize_stroke_style(builder, entry.style)
        if entry.stroke_sides:
            entry_sides_offset = serialize_stroke_sides(builder, entry.stroke_sides)
        
        # Now build the ElementStroke table
        ElementStrokeStart(builder)
        if entry_content_offset is not None:
            AddContent(builder, entry_content_offset)
        # Width is required
        AddWidth(builder, entry.width)
        if entry_style_offset is not None:
            AddStyle(builder, entry_style_offset)
        # Placement is required
        AddPlacement(builder, entry.placement)
        if entry_sides_offset is not None:
            AddStrokeSides(builder, entry_sides_offset)
        stroke_offset = ElementStrokeEnd(builder)
        stroke_offsets.append(stroke_offset)

    if not stroke_offsets:
        return None

    # Create the vector
    StartStrokeVector(builder, len(stroke_offsets))
    for offset in reversed(stroke_offsets):
        builder.PrependUOffsetTRelative(offset)
    return builder.EndVector()

def serialize_element_background(builder: flatbuffers.Builder, background: List[ElementBackground]):
    if not background:
        return None
      
    if not isinstance(background, list):
        return None

    # Create all offsets first
    background_offsets = []
    for entry in background:
        # Convert dict to ElementBackground object if needed
        if isinstance(entry, dict):
            entry = ElementBackground(
                content=ElementContentBase(**entry['content']) if entry.get('content') else None
            )
        
        # Create content offset first
        entry_content_offset = None
        if entry.content:
            entry_content_offset = serialize_element_content_base(builder, entry.content)
        
        # Now build the ElementBackground table
        ElementBackgroundStart(builder)
        if entry_content_offset:
            AddBackgroundContent(builder, entry_content_offset)
        background_offset = ElementBackgroundEnd(builder)
        background_offsets.append(background_offset)

    # Create the vector
    StartBackgroundVector(builder, len(background_offsets))
    for offset in reversed(background_offsets):
        builder.PrependUOffsetTRelative(offset)
    return builder.EndVector()

def serialize_pressures(builder: flatbuffers.Builder, pressures: List[float]):
    if not pressures:
        return None
    
    StartPressuresV3Vector(builder, len(pressures))
    for pressure in reversed(pressures):
        builder.PrependFloat64(pressure)
    return builder.EndVector()

def serialize_points(builder: flatbuffers.Builder, points: List[Point]):
    if not points:
        return None
    
    points_offsets = [serialize_point(builder, point) for point in points]
    StartPointsVector(builder, len(points_offsets))
    for offset in reversed(points_offsets):
        builder.PrependUOffsetTRelative(offset)
    return builder.EndVector()

def serialize_bound_element(builder: flatbuffers.Builder, bound_element: BoundElement):
    # Create string offsets first
    id_offset = builder.CreateString(bound_element.id)
    type_offset = builder.CreateString(bound_element.type)
    
    # Build the BoundElement table
    BoundElementStart(builder)
    AddBoundElementId(builder, id_offset)
    AddBoundElementType(builder, type_offset)
    return BoundElementEnd(builder)
  
def serialize_image_crop(builder: flatbuffers.Builder, crop: ImageCrop):
    if not crop:
        return None
    
    ImageCropStart(builder)
    AddImageCropX(builder, crop.x)
    AddImageCropY(builder, crop.y)
    AddImageCropWidth(builder, crop.width)
    AddImageCropHeight(builder, crop.height)
    AddImageCropNaturalWidth(builder, crop.natural_width)
    AddImageCropNaturalHeight(builder, crop.natural_height)
    return ImageCropEnd(builder)

def serialize_simple_point(builder: flatbuffers.Builder, x: float, y: float):
    SimplePointStart(builder)
    AddSimplePointX(builder, x)
    AddSimplePointY(builder, y)
    return SimplePointEnd(builder)

def serialize_duc_element(builder: flatbuffers.Builder, element: DucElementUnion):
    try:
        # Create all string offsets
        strings = {
            'id': builder.CreateString(element.id),
            'type': builder.CreateString(element.type),
            'link': builder.CreateString(element.link) if hasattr(element, 'link') and element.link else None,
            'label': builder.CreateString(element.label) if hasattr(element, 'label') and element.label else None,
            'scope': builder.CreateString(element.scope) if hasattr(element, 'scope') and element.scope else None,
            'frame_id': builder.CreateString(element.frame_id) if hasattr(element, 'frame_id') and element.frame_id else None,
            'text': builder.CreateString(element.text) if hasattr(element, 'text') and element.text else None,
            'container_id': builder.CreateString(element.container_id) if hasattr(element, 'container_id') and element.container_id else None,
            'file_id': builder.CreateString(element.file_id) if hasattr(element, 'file_id') and element.file_id else None,
            'status': builder.CreateString(element.status) if hasattr(element, 'status') and element.status else None,
            'group_id_ref': builder.CreateString(element.group_id_ref) if hasattr(element, 'group_id_ref') and element.group_id_ref else None,
            'font_family': builder.CreateString(str(element.font_family)) if hasattr(element, 'font_family') and element.font_family is not None else None,
            'doc_content': builder.CreateString(element.content) if hasattr(element, 'content') and element.content else None,
            'free_draw_easing': builder.CreateString(element.easing) if hasattr(element, 'easing') and element.easing else None,
            'free_draw_start_easing': builder.CreateString(element.start.easing) if hasattr(element, 'start') and element.start and hasattr(element.start, 'easing') and element.start.easing else None,
            'free_draw_end_easing': builder.CreateString(element.end.easing) if hasattr(element, 'end') and element.end and hasattr(element.end, 'easing') and element.end.easing else None,
            'free_draw_svg_path': builder.CreateString(element.svg_path) if hasattr(element, 'svg_path') and element.svg_path else None,
        }

        # Create all vectors
        vectors = {}
        if hasattr(element, 'group_ids') and element.group_ids:
            group_ids = [builder.CreateString(gid) for gid in element.group_ids]
            StartGroupIdsVector(builder, len(group_ids))
            for offset in reversed(group_ids): builder.PrependUOffsetTRelative(offset)
            vectors['group_ids'] = builder.EndVector()

        if hasattr(element, 'bound_elements') and element.bound_elements:
            bound_elements = [serialize_bound_element(builder, be) for be in element.bound_elements]
            StartBoundElementsVector(builder, len(bound_elements))
            for offset in reversed(bound_elements): builder.PrependUOffsetTRelative(offset)
            vectors['bound_elements'] = builder.EndVector()
        
        if hasattr(element, 'lines') and element.lines:
            line_offsets = [serialize_duc_line(builder, line) for line in element.lines]
            StartLinesVector(builder, len(line_offsets))
            for offset in reversed(line_offsets): builder.PrependUOffsetTRelative(offset)
            vectors['lines'] = builder.EndVector()
            
        if hasattr(element, 'path_overrides') and element.path_overrides:
            path_offsets = [serialize_duc_path(builder, path) for path in element.path_overrides]
            StartLinearElementPathOverridesVector(builder, len(path_offsets))
            for offset in reversed(path_offsets): builder.PrependUOffsetTRelative(offset)
            vectors['linear_element_path_overrides'] = builder.EndVector()
        
        if hasattr(element, 'points') and element.points:
            vectors['points'] = serialize_points(builder, element.points)
        
        if hasattr(element, 'pressures') and element.pressures:
            vectors['pressures'] = serialize_pressures(builder, element.pressures)

        if element.type == ElementType.TABLE:
            if hasattr(element, 'column_order') and element.column_order:
                column_order_offsets = [builder.CreateString(col) for col in element.column_order]
                StartColumnOrderVector(builder, len(column_order_offsets))
                for offset in reversed(column_order_offsets): builder.PrependUOffsetTRelative(offset)
                vectors['column_order'] = builder.EndVector()
            if hasattr(element, 'row_order') and element.row_order:
                row_order_offsets = [builder.CreateString(row) for row in element.row_order]
                StartRowOrderVector(builder, len(row_order_offsets))
                for offset in reversed(row_order_offsets): builder.PrependUOffsetTRelative(offset)
                vectors['row_order'] = builder.EndVector()
            if hasattr(element, 'columns') and element.columns:
                column_offsets = [serialize_duc_table_column(builder, col) for col in element.columns]
                StartColumnsVector(builder, len(column_offsets))
                for offset in reversed(column_offsets): builder.PrependUOffsetTRelative(offset)
                vectors['columns'] = builder.EndVector()
            if hasattr(element, 'rows') and element.rows:
                row_offsets = [serialize_duc_table_row(builder, row) for row in element.rows]
                StartRowsVector(builder, len(row_offsets))
                for offset in reversed(row_offsets): builder.PrependUOffsetTRelative(offset)
                vectors['rows'] = builder.EndVector()
            if hasattr(element, 'cells') and element.cells:
                cell_offsets = [serialize_duc_table_cell(builder, cell) for cell in element.cells]
                StartCellsVector(builder, len(cell_offsets))
                for offset in reversed(cell_offsets): builder.PrependUOffsetTRelative(offset)
                vectors['cells'] = builder.EndVector()

        # Create other offsets
        offsets = {
            'stroke': serialize_element_stroke(builder, element.stroke) if hasattr(element, 'stroke') and element.stroke else None,
            'background': serialize_element_background(builder, element.background) if hasattr(element, 'background') and element.background else None,
            'last_committed_point': serialize_point(builder, element.last_committed_point) if hasattr(element, 'last_committed_point') and element.last_committed_point else None,
            'start_binding': serialize_point_binding(builder, element.start_binding) if hasattr(element, 'start_binding') and element.start_binding else None,
            'end_binding': serialize_point_binding(builder, element.end_binding) if hasattr(element, 'end_binding') and element.end_binding else None,
            'scale': serialize_simple_point(builder, element.scale[0], element.scale[1]) if hasattr(element, 'scale') and element.scale else None,
            'crop': serialize_image_crop(builder, element.crop) if hasattr(element, 'crop') and element.crop else None,
            'table_style': serialize_duc_table_style(builder, element.table_style) if hasattr(element, 'table_style') and element.table_style else None,
        }

        # Start building the element
        DucElementStart(builder)
        
        # Add all properties
        props = {
            'id': (AddId, strings['id']),
            'type': (AddType, strings['type']),
            'x': (AddXV3, element.x) if hasattr(element, 'x') else None,
            'y': (AddYV3, element.y) if hasattr(element, 'y') else None,
            'width': (AddWidthV3, element.width) if hasattr(element, 'width') else None,
            'height': (AddHeightV3, element.height) if hasattr(element, 'height') else None,
            'angle': (AddAngleV3, element.angle) if hasattr(element, 'angle') else None,
            'frame_id': (AddFrameId, strings['frame_id']) if strings['frame_id'] else None,
            'stroke': (AddStroke, offsets['stroke']) if offsets['stroke'] else None,
            'background': (AddBackground, offsets['background']) if offsets['background'] else None,
            'opacity': (AddOpacity, element.opacity) if hasattr(element, 'opacity') else None,
            'group_ids': (AddGroupIds, vectors.get('group_ids')) if vectors.get('group_ids') else None,
            'bound_elements': (AddBoundElements, vectors.get('bound_elements')) if vectors.get('bound_elements') else None,
            'roundness': (AddRoundness, element.roundness) if hasattr(element, 'roundness') else None,
            'locked': (AddLocked, element.locked) if hasattr(element, 'locked') else None,
            'link': (AddLink, strings['link']) if strings['link'] else None,
            'label': (AddLabel, strings['label']) if strings['label'] else None,
            'is_visible': (AddIsVisible, element.is_visible) if hasattr(element, 'is_visible') else None,
            'blending': (AddBlending, element.blending) if hasattr(element, 'blending') else None,
            'subset': (AddSubset, element.subset) if hasattr(element, 'subset') else None,
            'scope': (AddScope, strings['scope']) if strings['scope'] else None,
            'is_deleted': (AddIsDeleted, element.is_deleted) if hasattr(element, 'is_deleted') else None,
            'z_index': (AddZIndex, element.z_index) if hasattr(element, 'z_index') else None,
            'polygon_sides': (AddPolygonSides, element.sides) if hasattr(element, 'sides') and element.sides is not None else None,
            'doc_content': (AddDocContent, strings['doc_content']) if strings['doc_content'] else None,
            'lines': (AddLines, vectors.get('lines')) if vectors.get('lines') else None,
            'linear_element_path_overrides': (AddLinearElementPathOverrides, vectors.get('linear_element_path_overrides')) if vectors.get('linear_element_path_overrides') else None,
        }
        
        # Type-specific properties
        if element.type == ElementType.TEXT:
            props.update({
                'text': (AddText, strings['text']) if strings['text'] else None,
                'font_size': (AddFontSizeV3, element.font_size) if hasattr(element, 'font_size') else None,
                'font_family': (AddFontFamily, strings['font_family']) if strings['font_family'] else None,
                'text_align': (AddTextAlignV3, element.text_align) if hasattr(element, 'text_align') else None,
                'vertical_align': (AddVerticalAlignV3, element.vertical_align) if hasattr(element, 'vertical_align') else None,
                'line_height': (AddLineHeightV3, element.line_height) if hasattr(element, 'line_height') else None,
                'auto_resize': (AddAutoResize, element.auto_resize) if hasattr(element, 'auto_resize') else None,
                'container_id': (AddContainerId, strings['container_id']) if strings['container_id'] else None,
            })
        elif element.type in [ElementType.LINE, ElementType.ARROW]:
            props.update({
                'points': (AddPoints, vectors.get('points')) if vectors.get('points') else None,
                'last_committed_point': (AddLastCommittedPoint, offsets['last_committed_point']) if offsets['last_committed_point'] else None,
                'start_binding': (AddStartBinding, offsets['start_binding']) if offsets['start_binding'] else None,
                'end_binding': (AddEndBinding, offsets['end_binding']) if offsets['end_binding'] else None,
                'elbowed': (AddElbowed, element.elbowed) if element.type == ElementType.ARROW and hasattr(element, 'elbowed') else None,
            })
        elif element.type == ElementType.FREEDRAW:
            props.update({
                'points': (AddPoints, vectors.get('points')) if vectors.get('points') else None,
                'pressures': (AddPressuresV3, vectors.get('pressures')) if vectors.get('pressures') else None,
                'last_committed_point': (AddLastCommittedPoint, offsets['last_committed_point']) if offsets['last_committed_point'] else None,
                'simulate_pressure': (AddSimulatePressure, element.simulate_pressure) if hasattr(element, 'simulate_pressure') else None,
                'free_draw_thinning': (AddFreeDrawThinning, element.thinning) if hasattr(element, 'thinning') else None,
                'free_draw_smoothing': (AddFreeDrawSmoothing, element.smoothing) if hasattr(element, 'smoothing') else None,
                'free_draw_streamline': (AddFreeDrawStreamline, element.streamline) if hasattr(element, 'streamline') else None,
                'free_draw_easing': (AddFreeDrawEasing, strings['free_draw_easing']) if strings['free_draw_easing'] else None,
                'free_draw_start_cap': (AddFreeDrawStartCap, element.start.cap) if hasattr(element, 'start') and element.start and hasattr(element.start, 'cap') else None,
                'free_draw_start_taper': (AddFreeDrawStartTaper, element.start.taper) if hasattr(element, 'start') and element.start and hasattr(element.start, 'taper') else None,
                'free_draw_start_easing': (AddFreeDrawStartEasing, strings['free_draw_start_easing']) if strings['free_draw_start_easing'] else None,
                'free_draw_end_cap': (AddFreeDrawEndCap, element.end.cap) if hasattr(element, 'end') and element.end and hasattr(element.end, 'cap') else None,
                'free_draw_end_taper': (AddFreeDrawEndTaper, element.end.taper) if hasattr(element, 'end') and element.end and hasattr(element.end, 'taper') else None,
                'free_draw_end_easing': (AddFreeDrawEndEasing, strings['free_draw_end_easing']) if strings['free_draw_end_easing'] else None,
                'free_draw_svg_path': (AddFreeDrawSvgPath, strings['free_draw_svg_path']) if strings['free_draw_svg_path'] else None,
                'free_draw_size': (AddFreeDrawSize, element.size) if hasattr(element, 'size') else None,
            })
        elif element.type == ElementType.IMAGE:
            props.update({
                'file_id': (AddFileId, strings['file_id']) if strings['file_id'] else None,
                'status': (AddStatus, strings['status']) if strings['status'] else None,
                'scale': (AddScaleV3, offsets['scale']) if offsets['scale'] else None,
                'crop': (AddCrop, offsets['crop']) if offsets['crop'] else None,
            })
        elif element.type == ElementType.ELLIPSE:
            props.update({
                'ellipse_ratio': (AddEllipseRatio, element.ratio) if hasattr(element, 'ratio') else None,
                'ellipse_start_angle': (AddEllipseStartAngle, element.start_angle) if hasattr(element, 'start_angle') else None,
                'ellipse_end_angle': (AddEllipseEndAngle, element.end_angle) if hasattr(element, 'end_angle') else None,
                'ellipse_show_aux_crosshair': (AddEllipseShowAuxCrosshair, element.show_aux_crosshair) if hasattr(element, 'show_aux_crosshair') else None,
            })
        elif element.type == ElementType.TABLE:
            props.update({
                'column_order': (AddColumnOrder, vectors.get('column_order')) if vectors.get('column_order') else None,
                'row_order': (AddRowOrder, vectors.get('row_order')) if vectors.get('row_order') else None,
                'columns': (AddColumns, vectors.get('columns')) if vectors.get('columns') else None,
                'rows': (AddRows, vectors.get('rows')) if vectors.get('rows') else None,
                'cells': (AddCells, vectors.get('cells')) if vectors.get('cells') else None,
                'table_style': (AddTableStyle, offsets['table_style']) if offsets['table_style'] else None,
            })
        elif element.type in [ElementType.FRAME, ElementType.GROUP, ElementType.MAGIC_FRAME]:
            props.update({
                'is_collapsed': (AddIsCollapsed, element.is_collapsed) if hasattr(element, 'is_collapsed') else None,
                'clip': (AddClip, element.clip) if hasattr(element, 'clip') else None,
                'group_id_ref': (AddGroupIdRef, strings['group_id_ref']) if element.type == ElementType.GROUP and strings['group_id_ref'] else None,
            })

        for prop in props.values():
            if prop:
                func, val = prop
                if val is not None:
                    func(builder, val)

        return DucElementEnd(builder)
    except Exception as e:
        logger.error(f"Failed to serialize element {getattr(element, 'id', 'unknown')}: {e}", exc_info=True)
        return None
