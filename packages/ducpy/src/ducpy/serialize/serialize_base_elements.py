"""
Base element serialization functions for duc.fbs schema.
This module provides serialization for basic data structures and common elements.
"""

import flatbuffers
from typing import List, Optional

# Import dataclasses from comprehensive classes
from ..classes.ElementsClass import (
    Identifier, GeometricPoint, DucUcs, DucPoint, DucView, Margins,
    TilingProperties, HatchPatternLine, CustomHatchPattern, DucHatchStyle,
    DucImageFilter, ElementContentBase, StrokeStyle, StrokeSides,
    ElementStroke, ElementBackground, BoundElement, DucHead,
    PointBindingPoint, DucPointBinding, DucLineReference, DucLine, DucPath,
    DucStackBase, DucStackLikeStyles
)

# Import FlatBuffers generated classes
from ..Duc.Identifier import (
    IdentifierStart, IdentifierEnd,
    IdentifierAddId, IdentifierAddName, IdentifierAddDescription
)
from ..Duc.GeometricPoint import CreateGeometricPoint
from ..Duc.DucUcs import (
    DucUcsStart, DucUcsEnd,
    DucUcsAddOrigin, DucUcsAddAngle
)
from ..Duc.DucPoint import (
    DucPointStart, DucPointEnd,
    DucPointAddX, DucPointAddY, DucPointAddMirroring
)
from ..Duc.DucView import (
    DucViewStart, DucViewEnd,
    DucViewAddScrollX, DucViewAddScrollY, DucViewAddZoom,
    DucViewAddTwistAngle, DucViewAddCenterPoint, DucViewAddScope
)
from ..Duc.Margins import (
    MarginsStart, MarginsEnd,
    MarginsAddTop, MarginsAddRight, MarginsAddBottom, MarginsAddLeft
)
from ..Duc.TilingProperties import (
    TilingPropertiesStart, TilingPropertiesEnd,
    TilingPropertiesAddSizeInPercent, TilingPropertiesAddAngle,
    TilingPropertiesAddSpacing, TilingPropertiesAddOffsetX, TilingPropertiesAddOffsetY
)
from ..Duc.HatchPatternLine import (
    HatchPatternLineStart, HatchPatternLineEnd,
    HatchPatternLineAddAngle, HatchPatternLineAddOrigin, HatchPatternLineAddOffset,
    HatchPatternLineAddDashPattern, HatchPatternLineStartOffsetVector,
    HatchPatternLineStartDashPatternVector
)
from ..Duc.CustomHatchPattern import (
    CustomHatchPatternStart, CustomHatchPatternEnd,
    CustomHatchPatternAddLines, CustomHatchPatternStartLinesVector
)
from ..Duc.DucHatchStyle import (
    DucHatchStyleStart, DucHatchStyleEnd,
    DucHatchStyleAddHatchStyle, DucHatchStyleAddPatternName, DucHatchStyleAddPatternScale,
    DucHatchStyleAddPatternAngle, DucHatchStyleAddPatternOrigin, DucHatchStyleAddPatternDouble, DucHatchStyleAddCustomPattern
)
from ..Duc.DucImageFilter import (
    DucImageFilterStart, DucImageFilterEnd,
    DucImageFilterAddBrightness, DucImageFilterAddContrast
)
from ..Duc.ElementContentBase import (
    ElementContentBaseStart, ElementContentBaseEnd,
    ElementContentBaseAddPreference, ElementContentBaseAddSrc,
    ElementContentBaseAddVisible, ElementContentBaseAddOpacity, ElementContentBaseAddTiling,
    ElementContentBaseAddHatch, ElementContentBaseAddImageFilter
)
from ..Duc.StrokeStyle import (
    StrokeStyleStart, StrokeStyleEnd,
    StrokeStyleAddPreference, StrokeStyleAddCap, StrokeStyleAddJoin,
    StrokeStyleAddDash, StrokeStyleAddDashCap, StrokeStyleAddMiterLimit,
    StrokeStyleStartDashVector
)
from ..Duc.StrokeSides import (
    StrokeSidesStart, StrokeSidesEnd,
    StrokeSidesAddPreference, StrokeSidesAddValues,
    StrokeSidesStartValuesVector
)
from ..Duc.ElementStroke import (
    ElementStrokeStart, ElementStrokeEnd,
    ElementStrokeAddContent, ElementStrokeAddWidth, ElementStrokeAddStyle,
    ElementStrokeAddPlacement, ElementStrokeAddStrokeSides
)
from ..Duc.ElementBackground import (
    ElementBackgroundStart, ElementBackgroundEnd,
    ElementBackgroundAddContent
)
from ..Duc.BoundElement import (
    BoundElementStart, BoundElementEnd,
    BoundElementAddId, BoundElementAddType
)
from ..Duc.DucHead import (
    DucHeadStart, DucHeadEnd,
    DucHeadAddSize
)
from ..Duc.PointBindingPoint import (
    PointBindingPointStart, PointBindingPointEnd,
    PointBindingPointAddIndex, PointBindingPointAddOffset
)
from ..Duc.DucPointBinding import (
    DucPointBindingStart, DucPointBindingEnd,
    DucPointBindingAddElementId, DucPointBindingAddFocus,
    DucPointBindingAddGap, DucPointBindingAddFixedPoint,
    DucPointBindingAddPoint, DucPointBindingAddHead
)
from ..Duc.DucLineReference import (
    DucLineReferenceStart, DucLineReferenceEnd,
    DucLineReferenceAddIndex, DucLineReferenceAddHandle
)
from ..Duc.DucLine import (
    DucLineStart, DucLineEnd,
    DucLineAddStart, DucLineAddEnd
)
from ..Duc.DucPath import (
    DucPathStart, DucPathEnd,
    DucPathAddLineIndices, DucPathStartLineIndicesVector
)
from ..Duc._DucStackBase import (
    _DucStackBaseStart, _DucStackBaseEnd,
    _DucStackBaseAddLabel, _DucStackBaseAddDescription,
    _DucStackBaseAddIsCollapsed, _DucStackBaseAddIsPlot,
    _DucStackBaseAddIsVisible, _DucStackBaseAddLocked,
    _DucStackBaseAddStyles
)

def serialize_fbs_identifier(builder: flatbuffers.Builder, identifier: Identifier) -> int:
    """Serialize Identifier to FlatBuffers."""
    id_offset = builder.CreateString(identifier.id)
    name_offset = builder.CreateString(identifier.name)
    description_offset = builder.CreateString(identifier.description) if identifier.description else None
    
    IdentifierStart(builder)
    IdentifierAddId(builder, id_offset)
    IdentifierAddName(builder, name_offset)
    if description_offset is not None:
        IdentifierAddDescription(builder, description_offset)
    return IdentifierEnd(builder)


def serialize_fbs_geometric_point(builder: flatbuffers.Builder, point: GeometricPoint) -> int:
    """Serialize GeometricPoint to FlatBuffers."""
    return CreateGeometricPoint(builder, point.x, point.y)


def serialize_fbs_duc_ucs(builder: flatbuffers.Builder, ucs: DucUcs) -> int:
    """Serialize DucUcs to FlatBuffers."""
    origin_offset = serialize_fbs_geometric_point(builder, ucs.origin)
    
    DucUcsStart(builder)
    DucUcsAddOrigin(builder, origin_offset)
    DucUcsAddAngle(builder, ucs.angle)
    return DucUcsEnd(builder)


def serialize_fbs_duc_point(builder: flatbuffers.Builder, point: DucPoint) -> int:
    """Serialize DucPoint to FlatBuffers."""
    DucPointStart(builder)
    DucPointAddX(builder, point.x)
    DucPointAddY(builder, point.y)
    if point.mirroring is not None:
        DucPointAddMirroring(builder, point.mirroring)
    return DucPointEnd(builder)


def serialize_fbs_duc_view(builder: flatbuffers.Builder, view: DucView) -> int:
    """Serialize DucView to FlatBuffers."""
    center_point_offset = serialize_fbs_duc_point(builder, view.center_point)
    scope_offset = builder.CreateString(view.scope)
    
    DucViewStart(builder)
    DucViewAddScrollX(builder, view.scroll_x)
    DucViewAddScrollY(builder, view.scroll_y)
    DucViewAddZoom(builder, view.zoom)
    DucViewAddTwistAngle(builder, view.twist_angle)
    DucViewAddCenterPoint(builder, center_point_offset)
    DucViewAddScope(builder, scope_offset)
    return DucViewEnd(builder)


def serialize_fbs_margins(builder: flatbuffers.Builder, margins: Margins) -> int:
    """Serialize Margins to FlatBuffers."""
    MarginsStart(builder)
    MarginsAddTop(builder, margins.top)
    MarginsAddRight(builder, margins.right)
    MarginsAddBottom(builder, margins.bottom)
    MarginsAddLeft(builder, margins.left)
    return MarginsEnd(builder)


def serialize_fbs_tiling_properties(builder: flatbuffers.Builder, tiling: TilingProperties) -> int:
    """Serialize TilingProperties to FlatBuffers."""
    TilingPropertiesStart(builder)
    TilingPropertiesAddSizeInPercent(builder, tiling.size_in_percent)
    TilingPropertiesAddAngle(builder, tiling.angle)
    if tiling.spacing is not None:
        TilingPropertiesAddSpacing(builder, tiling.spacing)
    if tiling.offset_x is not None:
        TilingPropertiesAddOffsetX(builder, tiling.offset_x)
    if tiling.offset_y is not None:
        TilingPropertiesAddOffsetY(builder, tiling.offset_y)
    return TilingPropertiesEnd(builder)


def serialize_fbs_hatch_pattern_line(builder: flatbuffers.Builder, hatch_line: HatchPatternLine) -> int:
    """Serialize HatchPatternLine to FlatBuffers."""
    origin_offset = serialize_fbs_duc_point(builder, hatch_line.origin)
    
    # Create offset vector
    HatchPatternLineStartOffsetVector(builder, len(hatch_line.offset))
    for offset in reversed(hatch_line.offset):
        builder.PrependFloat64(offset)
    offset_vector = builder.EndVector()
    
    # Create dash pattern vector
    HatchPatternLineStartDashPatternVector(builder, len(hatch_line.dash_pattern))
    for dash in reversed(hatch_line.dash_pattern):
        builder.PrependFloat64(dash)
    dash_pattern_vector = builder.EndVector()
    
    HatchPatternLineStart(builder)
    HatchPatternLineAddAngle(builder, hatch_line.angle)
    HatchPatternLineAddOrigin(builder, origin_offset)
    HatchPatternLineAddOffset(builder, offset_vector)
    HatchPatternLineAddDashPattern(builder, dash_pattern_vector)
    return HatchPatternLineEnd(builder)


def serialize_fbs_custom_hatch_pattern(builder: flatbuffers.Builder, custom_hatch: CustomHatchPattern) -> int:
    """Serialize CustomHatchPattern to FlatBuffers."""
    # Serialize lines
    lines_offsets = []
    for line in custom_hatch.lines:
        lines_offsets.append(serialize_fbs_hatch_pattern_line(builder, line))
    
    CustomHatchPatternStartLinesVector(builder, len(lines_offsets))
    for offset in reversed(lines_offsets):
        builder.PrependUOffsetTRelative(offset)
    lines_vector = builder.EndVector()
    
    CustomHatchPatternStart(builder)
    CustomHatchPatternAddLines(builder, lines_vector)
    return CustomHatchPatternEnd(builder)


def serialize_fbs_duc_hatch_style(builder: flatbuffers.Builder, hatch_style: DucHatchStyle) -> int:
    """Serialize DucHatchStyle to FlatBuffers."""
    custom_pattern_offset = serialize_fbs_custom_hatch_pattern(builder, hatch_style.custom_pattern) if hatch_style.custom_pattern else None
    
    pattern_name_offset = builder.CreateString(hatch_style.pattern_name)
    pattern_origin_offset = serialize_fbs_duc_point(builder, hatch_style.pattern_origin)

    DucHatchStyleStart(builder)
    DucHatchStyleAddHatchStyle(builder, hatch_style.hatch_style)
    DucHatchStyleAddPatternName(builder, pattern_name_offset)
    DucHatchStyleAddPatternScale(builder, hatch_style.pattern_scale)
    DucHatchStyleAddPatternAngle(builder, hatch_style.pattern_angle)
    DucHatchStyleAddPatternOrigin(builder, pattern_origin_offset)
    DucHatchStyleAddPatternDouble(builder, hatch_style.pattern_double)
    if custom_pattern_offset is not None:
        DucHatchStyleAddCustomPattern(builder, custom_pattern_offset)
    return DucHatchStyleEnd(builder)


def serialize_fbs_duc_image_filter(builder: flatbuffers.Builder, image_filter: DucImageFilter) -> int:
    """Serialize DucImageFilter to FlatBuffers."""
    DucImageFilterStart(builder)
    DucImageFilterAddBrightness(builder, image_filter.brightness)
    DucImageFilterAddContrast(builder, image_filter.contrast)
    return DucImageFilterEnd(builder)


def serialize_fbs_element_content_base(builder: flatbuffers.Builder, content_base: ElementContentBase) -> int:
    """Serialize ElementContentBase to FlatBuffers."""
    src_offset = builder.CreateString(content_base.src) if content_base.src else None
    tiling_offset = serialize_fbs_tiling_properties(builder, content_base.tiling) if content_base.tiling else None
    hatch_offset = serialize_fbs_duc_hatch_style(builder, content_base.hatch) if content_base.hatch else None
    image_filter_offset = serialize_fbs_duc_image_filter(builder, content_base.image_filter) if content_base.image_filter else None
    
    ElementContentBaseStart(builder)
    if content_base.preference is not None:
        ElementContentBaseAddPreference(builder, content_base.preference)
    if src_offset is not None:
        ElementContentBaseAddSrc(builder, src_offset)
    ElementContentBaseAddVisible(builder, content_base.visible)
    ElementContentBaseAddOpacity(builder, content_base.opacity)
    if tiling_offset is not None:
        ElementContentBaseAddTiling(builder, tiling_offset)
    if hatch_offset is not None:
        ElementContentBaseAddHatch(builder, hatch_offset)
    if image_filter_offset is not None:
        ElementContentBaseAddImageFilter(builder, image_filter_offset)
    return ElementContentBaseEnd(builder)


def serialize_fbs_stroke_style(builder: flatbuffers.Builder, stroke_style: StrokeStyle) -> int:
    """Serialize StrokeStyle to FlatBuffers."""
    dash_line_override_offset = builder.CreateString(stroke_style.dash_line_override) if stroke_style.dash_line_override else None
    
    # Create dash vector
    dash_vector_offset = None
    if stroke_style.dash:
        dash_vector_offset = builder.CreateNumpyVector(np.array(stroke_style.dash, dtype=np.float64))
        
    StrokeStyleStart(builder)
    if stroke_style.preference is not None:
        StrokeStyleAddPreference(builder, stroke_style.preference)
    if stroke_style.cap is not None:
        StrokeStyleAddCap(builder, stroke_style.cap)
    if stroke_style.join is not None:
        StrokeStyleAddJoin(builder, stroke_style.join)
    if dash_vector_offset is not None:
        StrokeStyleAddDash(builder, dash_vector_offset)
    if dash_line_override_offset is not None:
        StrokeStyleAddDashLineOverride(builder, dash_line_override_offset)
    if stroke_style.dash_cap is not None:
        StrokeStyleAddDashCap(builder, stroke_style.dash_cap)
    if stroke_style.miter_limit is not None:
        StrokeStyleAddMiterLimit(builder, stroke_style.miter_limit)
    return StrokeStyleEnd(builder)


def serialize_fbs_stroke_sides(builder: flatbuffers.Builder, stroke_sides: StrokeSides) -> int:
    """Serialize StrokeSides to FlatBuffers."""
    # Create values vector
    values_vector_offset = None
    if stroke_sides.values:
        values_vector_offset = builder.CreateNumpyVector(np.array(stroke_sides.values, dtype=np.float64))
    
    StrokeSidesStart(builder)
    if stroke_sides.preference is not None:
        StrokeSidesAddPreference(builder, stroke_sides.preference)
    if values_vector_offset is not None:
        StrokeSidesAddValues(builder, values_vector_offset)
    return StrokeSidesEnd(builder)


def serialize_fbs_element_stroke(builder: flatbuffers.Builder, element_stroke: ElementStroke) -> int:
    """Serialize ElementStroke to FlatBuffers."""
    content_offset = serialize_fbs_element_content_base(builder, element_stroke.content) if element_stroke.content else None
    style_offset = serialize_fbs_stroke_style(builder, element_stroke.style) if element_stroke.style else None
    stroke_sides_offset = serialize_fbs_stroke_sides(builder, element_stroke.stroke_sides) if element_stroke.stroke_sides else None
    
    ElementStrokeStart(builder)
    if content_offset is not None:
        ElementStrokeAddContent(builder, content_offset)
    ElementStrokeAddWidth(builder, element_stroke.width)
    if style_offset is not None:
        ElementStrokeAddStyle(builder, style_offset)
    if element_stroke.placement is not None:
        ElementStrokeAddPlacement(builder, element_stroke.placement)
    if stroke_sides_offset is not None:
        ElementStrokeAddStrokeSides(builder, stroke_sides_offset)
    return ElementStrokeEnd(builder)


def serialize_fbs_element_background(builder: flatbuffers.Builder, element_background: ElementBackground) -> int:
    """Serialize ElementBackground to FlatBuffers."""
    content_offset = serialize_fbs_element_content_base(builder, element_background.content) if element_background.content else None
    
    ElementBackgroundStart(builder)
    if content_offset is not None:
        ElementBackgroundAddContent(builder, content_offset)
    return ElementBackgroundEnd(builder)


def serialize_fbs_bound_element(builder: flatbuffers.Builder, bound_element: BoundElement) -> int:
    """Serialize BoundElement to FlatBuffers."""
    id_offset = builder.CreateString(bound_element.id)
    type_offset = builder.CreateString(bound_element.type) # Assuming type is a string representing DucElementType
    
    BoundElementStart(builder)
    BoundElementAddId(builder, id_offset)
    BoundElementAddType(builder, type_offset)
    return BoundElementEnd(builder)


def serialize_fbs_duc_head(builder: flatbuffers.Builder, duc_head: DucHead) -> int:
    """Serialize DucHead to FlatBuffers."""
    block_id_offset = builder.CreateString(duc_head.block_id) if duc_head.block_id else None

    DucHeadStart(builder)
    if duc_head.type is not None:
        DucHeadAddType(builder, duc_head.type)
    if block_id_offset is not None:
        DucHeadAddBlockId(builder, block_id_offset)
    DucHeadAddSize(builder, duc_head.size)
    return DucHeadEnd(builder)


def serialize_fbs_point_binding_point(builder: flatbuffers.Builder, binding_point: PointBindingPoint) -> int:
    """Serialize PointBindingPoint to FlatBuffers."""
    # The offset in PointBindingPoint is a double, not a DucPoint. Correcting this.
    
    PointBindingPointStart(builder)
    PointBindingPointAddIndex(builder, binding_point.index)
    PointBindingPointAddOffset(builder, binding_point.offset) # Direct use of double offset
    return PointBindingPointEnd(builder)


def serialize_fbs_duc_point_binding(builder: flatbuffers.Builder, point_binding: DucPointBinding) -> int:
    """Serialize DucPointBinding to FlatBuffers."""
    element_id_offset = builder.CreateString(point_binding.element_id) if point_binding.element_id else None
    fixed_point_offset = serialize_fbs_geometric_point(builder, point_binding.fixed_point) if point_binding.fixed_point else None
    point_offset = serialize_fbs_point_binding_point(builder, point_binding.point) if point_binding.point else None
    head_offset = serialize_fbs_duc_head(builder, point_binding.head) if point_binding.head else None
    
    DucPointBindingStart(builder)
    if element_id_offset is not None:
        DucPointBindingAddElementId(builder, element_id_offset)
    DucPointBindingAddFocus(builder, point_binding.focus)
    DucPointBindingAddGap(builder, point_binding.gap)
    if fixed_point_offset is not None:
        DucPointBindingAddFixedPoint(builder, fixed_point_offset)
    if point_offset is not None:
        DucPointBindingAddPoint(builder, point_offset)
    if head_offset is not None:
        DucPointBindingAddHead(builder, head_offset)
    return DucPointBindingEnd(builder)


def serialize_fbs_duc_line_reference(builder: flatbuffers.Builder, line_ref: DucLineReference) -> int:
    """Serialize DucLineReference to FlatBuffers."""
    handle_offset = serialize_fbs_geometric_point(builder, line_ref.handle) if line_ref.handle else None

    DucLineReferenceStart(builder)
    DucLineReferenceAddIndex(builder, line_ref.index)
    if handle_offset is not None:
        DucLineReferenceAddHandle(builder, handle_offset)
    return DucLineReferenceEnd(builder)


def serialize_fbs_duc_line(builder: flatbuffers.Builder, duc_line: DucLine) -> int:
    """Serialize DucLine to FlatBuffers."""
    # Correcting field names based on schema: start and end are DucLineReference objects
    start_offset = serialize_fbs_duc_line_reference(builder, duc_line.start)
    end_offset = serialize_fbs_duc_line_reference(builder, duc_line.end)
    
    DucLineStart(builder)
    DucLineAddStart(builder, start_offset)
    DucLineAddEnd(builder, end_offset)
    return DucLineEnd(builder)


def serialize_fbs_duc_path(builder: flatbuffers.Builder, duc_path: DucPath) -> int:
    """Serialize DucPath to FlatBuffers."""
    # Serialize line indices
    line_indices_vector_offset = None
    if duc_path.line_indices:
        DucPathStartLineIndicesVector(builder, len(duc_path.line_indices))
        for index in reversed(duc_path.line_indices):
            builder.PrependInt32(index)
        line_indices_vector_offset = builder.EndVector()
    
    background_offset = serialize_fbs_element_background(builder, duc_path.background) if duc_path.background else None
    stroke_offset = serialize_fbs_stroke_style(builder, duc_path.stroke) if duc_path.stroke else None

    DucPathStart(builder)
    if line_indices_vector_offset is not None:
        DucPathAddLineIndices(builder, line_indices_vector_offset)
    if background_offset is not None:
        DucPathAddBackground(builder, background_offset)
    if stroke_offset is not None:
        DucPathAddStroke(builder, stroke_offset)
    return DucPathEnd(builder)


def serialize_fbs_stack_base(builder: flatbuffers.Builder, stack_base: DucStackBase) -> int:
    """Serialize DucStackBase to FlatBuffers."""
    # Import here to break circular dependency
    from .serialize_styles import serialize_fbs_duc_stack_like_styles

    label_offset = builder.CreateString(stack_base.label) if stack_base.label else None
    description_offset = builder.CreateString(stack_base.description) if stack_base.description else None
    styles_offset = serialize_fbs_duc_stack_like_styles(builder, stack_base.styles) if stack_base.styles else None

    _DucStackBaseStart(builder)
    if label_offset is not None:
        _DucStackBaseAddLabel(builder, label_offset)
    if description_offset is not None:
        _DucStackBaseAddDescription(builder, description_offset)
    _DucStackBaseAddIsCollapsed(builder, stack_base.is_collapsed)
    _DucStackBaseAddIsPlot(builder, stack_base.is_plot)
    _DucStackBaseAddIsVisible(builder, stack_base.is_visible)
    _DucStackBaseAddLocked(builder, stack_base.locked)
    if styles_offset is not None:
        _DucStackBaseAddStyles(builder, styles_offset)
    return _DucStackBaseEnd(builder)
