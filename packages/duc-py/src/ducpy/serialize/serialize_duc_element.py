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
    StartPressuresV3Vector, StartStrokeVector, StartBackgroundVector
)
from ..Duc.DucElement import *
from ..Duc.Point import (
    Start as PointStart,
    End as PointEnd,
    AddXV3 as AddPointX,
    AddYV3 as AddPointY,
    AddIsCurve as AddPointIsCurve,
    AddMirroring as AddPointMirroring,
    AddBorderRadius as AddPointBorderRadius,
    AddHandleIn as AddPointHandleIn,
    AddHandleOut as AddPointHandleOut,
    AddPeer as AddPointPeer
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
    AddPreference, AddSrc, AddVisible, AddOpacity, AddTiling
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
from ..classes.DucElementClass import BoundElement, DucElement, DucElementUnion, ImageCrop, Point, BezierHandle, PointBinding, BindingPoint, ElementStroke, ElementBackground, ElementContentBase, StrokeStyle, StrokeSides, TilingProperties
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

logger = logging.getLogger(__name__)

def serialize_bezier_handle(builder: flatbuffers.Builder, handle: BezierHandle):
    BezierHandleStart(builder)
    AddBezierHandleX(builder, handle.x)
    AddBezierHandleY(builder, handle.y)
    return BezierHandleEnd(builder)

def serialize_point(builder: flatbuffers.Builder, point: Point):
    if not point:
        return None
      
    handle_in_offset = serialize_bezier_handle(builder, point.handle_in) if point.handle_in else None  # Added null check
    handle_out_offset = serialize_bezier_handle(builder, point.handle_out) if point.handle_out else None  # Added null check
  
    PointStart(builder)
    AddPointX(builder, point.x)
    AddPointY(builder, point.y)
    AddPointIsCurve(builder, point.is_curve)
    AddPointMirroring(builder, point.mirroring)
    AddPointBorderRadius(builder, point.border_radius)
    if handle_in_offset:
        AddPointHandleIn(builder, handle_in_offset)
    if handle_out_offset:
        AddPointHandleOut(builder, handle_out_offset)
    if point.peer:
        AddPointPeer(builder, point.peer)
    return PointEnd(builder)

def serialize_binding_point(builder: flatbuffers.Builder, binding: BindingPoint):
    BindingPointStart(builder)
    AddBindingPointIndex(builder, binding.index)
    AddBindingPointOffset(builder, binding.offset)
    return BindingPointEnd(builder)

def serialize_point_binding(builder: flatbuffers.Builder, binding: PointBinding):
    id_offset = builder.CreateString(binding.element_id)
    fixed_point_offset = serialize_point(builder, binding.fixed_point)
    
    BindingElementStart(builder)
    AddBindingElementId(builder, id_offset)
    AddBindingFocus(builder, binding.focus)
    AddBindingGap(builder, binding.gap)
    if fixed_point_offset:
        AddBindingFixedPoint(builder, fixed_point_offset)
    if binding.point:
        point_offset = serialize_binding_point(builder, binding.point)
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
        # Opacity is required
        AddOpacity(builder, float(content.get('opacity', 1.0)))  # Default to 1.0
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
        AddOpacity(builder, float(getattr(content, 'opacity', 1.0)))  # Default to 1.0
        if tiling_offset is not None:
            AddTiling(builder, tiling_offset)
    
    # Return the table offset
    return ElementContentBaseEnd(builder)

def serialize_stroke_style(builder: flatbuffers.Builder, style: StrokeStyle):
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
        # Create ALL string offsets first
        id_offset = builder.CreateString(element.id)  # ID is required
        type_offset = builder.CreateString(element.type)  # Type is required
        link_offset = builder.CreateString(element.link) if element.link else None
        label_offset = builder.CreateString(element.label) if element.label else None
        scope_offset = builder.CreateString(element.scope) if element.scope else None
        frame_id_offset = builder.CreateString(element.frame_id) if element.frame_id else None
        text_offset = builder.CreateString(element.text) if hasattr(element, 'text') and element.text else None
        container_id_offset = builder.CreateString(element.container_id) if hasattr(element, 'container_id') and element.container_id else None
        file_id_offset = builder.CreateString(element.file_id) if hasattr(element, 'file_id') and element.file_id else None
        status_offset = builder.CreateString(element.status) if hasattr(element, 'status') and element.status else None
        group_id_ref_offset = builder.CreateString(element.group_id_ref) if hasattr(element, 'group_id_ref') and element.group_id_ref else None
        font_family_offset = builder.CreateString(str(element.font_family)) if hasattr(element, 'font_family') and element.font_family is not None else None
        
        # Create ALL vectors first
        group_ids_vector = None
        if element.group_ids and len(element.group_ids) > 0:
            group_ids = [builder.CreateString(id) for id in element.group_ids]
            StartGroupIdsVector(builder, len(group_ids))
            for offset in reversed(group_ids):
                builder.PrependUOffsetTRelative(offset)
            group_ids_vector = builder.EndVector()

        bound_elements_vector = None
        if element.bound_elements and len(element.bound_elements) > 0:
            bound_elements = [serialize_bound_element(builder, binding) for binding in element.bound_elements]
            StartBoundElementsVector(builder, len(bound_elements))
            for offset in reversed(bound_elements):
                builder.PrependUOffsetTRelative(offset)
            bound_elements_vector = builder.EndVector()
        
        stroke_vector = None
        if element.stroke:
            strokes = element.stroke if isinstance(element.stroke, list) else [element.stroke]
            stroke_vector = serialize_element_stroke(builder, strokes)

        background_vector = None
        if element.background:
            backgrounds = element.background if isinstance(element.background, list) else [element.background]
            background_vector = serialize_element_background(builder, backgrounds)
        
        # Create ALL type-specific vectors and offsets
        points_vector = None
        pressures_vector = None
        last_committed_point_offset = None
        start_binding_offset = None
        end_binding_offset = None
        scale_offset = None
        crop_offset = None
        
        if element.type == ElementType.LINE or element.type == ElementType.ARROW:
            if element.points:
                points_vector = serialize_points(builder, element.points)
            if element.last_committed_point:
                last_committed_point_offset = serialize_point(builder, element.last_committed_point)
            if hasattr(element, 'start_binding') and element.start_binding:
                start_binding_offset = serialize_point_binding(builder, element.start_binding)
            if hasattr(element, 'end_binding') and element.end_binding:
                end_binding_offset = serialize_point_binding(builder, element.end_binding)
        
        elif element.type == ElementType.FREEDRAW:
            if element.points:
                points_vector = serialize_points(builder, element.points)
            if element.pressures:
                pressures_vector = serialize_pressures(builder, element.pressures)
            if element.last_committed_point:
                last_committed_point_offset = serialize_point(builder, element.last_committed_point)
        
        elif element.type == ElementType.IMAGE:
            if hasattr(element, 'scale') and element.scale:
                scale_offset = serialize_simple_point(builder, element.scale[0], element.scale[1])
            if hasattr(element, 'crop') and element.crop:
                crop_offset = serialize_image_crop(builder, element.crop)
        
        # NOW start building the DucElement table
        DucElementStart(builder)
        
        # Add required fields first - these must always be present
        AddId(builder, id_offset)  # ID is required
        AddType(builder, type_offset)  # Type is required
        
        # Add base properties - these should be added if they exist
        # Note: We're using v3 fields only, v2 fields should remain null
        if element.x is not None:
            AddXV3(builder, element.x)
        if element.y is not None:
            AddYV3(builder, element.y) 
        if element.width is not None:
            AddWidthV3(builder, element.width)
        if element.height is not None:
            AddHeightV3(builder, element.height)
        if element.angle is not None:
            AddAngleV3(builder, element.angle)
        if frame_id_offset:
            AddFrameId(builder, frame_id_offset)
        if stroke_vector is not None:
            AddStroke(builder, stroke_vector)
        if background_vector is not None:
            AddBackground(builder, background_vector)
        if element.opacity is not None:
            AddOpacity(builder, element.opacity)
        if group_ids_vector:
            AddGroupIds(builder, group_ids_vector)
        if bound_elements_vector:
            AddBoundElements(builder, bound_elements_vector)
        if element.roundness is not None:
            AddRoundness(builder, element.roundness)
        if element.locked is not None:
            AddLocked(builder, element.locked)
        if link_offset:
            AddLink(builder, link_offset)
        if label_offset:
            AddLabel(builder, label_offset)
        if element.is_visible is not None:
            AddIsVisible(builder, element.is_visible)
        if element.blending is not None:
            AddBlending(builder, element.blending)
        if element.subset is not None:
            AddSubset(builder, element.subset)
        if scope_offset:
            AddScope(builder, scope_offset)
        if element.is_deleted is not None:
            AddIsDeleted(builder, element.is_deleted)
        if element.z_index is not None:
            AddZIndex(builder, element.z_index)
        
        # Add type-specific properties
        if element.type == ElementType.TEXT:
            if text_offset:
                AddText(builder, text_offset)
            if element.font_size is not None:
                AddFontSizeV3(builder, element.font_size)
            if font_family_offset:
                AddFontFamily(builder, font_family_offset)
            if element.text_align:
                AddTextAlignV3(builder, element.text_align)
            if element.vertical_align is not None:
                AddVerticalAlignV3(builder, element.vertical_align)
            if element.line_height is not None:
                AddLineHeightV3(builder, element.line_height)
            if element.auto_resize is not None:
                AddAutoResize(builder, element.auto_resize)
            if container_id_offset:
                AddContainerId(builder, container_id_offset)
        
        elif element.type == ElementType.LINE or element.type == ElementType.ARROW:
            if points_vector:
                AddPoints(builder, points_vector)
            if last_committed_point_offset:
                AddLastCommittedPoint(builder, last_committed_point_offset)
            if start_binding_offset:
                AddStartBinding(builder, start_binding_offset)
            if end_binding_offset:
                AddEndBinding(builder, end_binding_offset)
            if element.type == ElementType.ARROW and hasattr(element, 'elbowed'):
                AddElbowed(builder, element.elbowed)
        
        elif element.type == ElementType.FREEDRAW:
            if points_vector:
                AddPoints(builder, points_vector)
            if pressures_vector:
                AddPressuresV3(builder, pressures_vector)
            if last_committed_point_offset:
                AddLastCommittedPoint(builder, last_committed_point_offset)
            if element.simulate_pressure is not None:
                AddSimulatePressure(builder, element.simulate_pressure)
        
        elif element.type == ElementType.IMAGE:
            if file_id_offset:
                AddFileId(builder, file_id_offset)
            if status_offset:
                AddStatus(builder, status_offset)
            if scale_offset:
                AddScaleV3(builder, scale_offset)
            if crop_offset:
                AddCrop(builder, crop_offset)
        
        elif element.type == ElementType.FRAME or element.type == ElementType.GROUP or element.type == ElementType.MAGIC_FRAME:
            if element.is_collapsed is not None:
                AddIsCollapsed(builder, element.is_collapsed)
            if hasattr(element, 'clip'):
                AddClip(builder, element.clip)
            if element.type == ElementType.GROUP and group_id_ref_offset:
                AddGroupIdRef(builder, group_id_ref_offset)
        
        # Return the table offset
        return DucElementEnd(builder)
    except Exception as e:
        logger.error(f"Failed to serialize element {element.id}: {str(e)}")
        raise
