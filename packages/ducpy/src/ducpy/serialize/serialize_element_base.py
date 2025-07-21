"""
Element base serialization functions for duc.fbs schema.
This module provides serialization for element base structures and common element properties.
"""

import flatbuffers
from typing import List, Optional
import numpy as np

# Import dataclasses from comprehensive classes
from ducpy.classes.ElementsClass import (
    DucElementStylesBase, DucElementBase, DucStackLikeStyles, DucStackBase,
    DucStackElementBase, DucLinearElementBase
)

# Import FlatBuffers generated classes
from ducpy.Duc._DucElementStylesBase import (
    _DucElementStylesBaseStart, _DucElementStylesBaseEnd,
    _DucElementStylesBaseAddStroke, _DucElementStylesBaseAddBackground,
    _DucElementStylesBaseAddOpacity, _DucElementStylesBaseStartStrokeVector, _DucElementStylesBaseStartBackgroundVector,
    _DucElementStylesBaseAddRoundness, _DucElementStylesBaseAddBlending
)
from ducpy.Duc._DucElementBase import (
    _DucElementBaseStart, _DucElementBaseEnd,
    _DucElementBaseAddId, _DucElementBaseAddX,
    _DucElementBaseAddY, _DucElementBaseAddWidth, _DucElementBaseAddHeight,
    _DucElementBaseAddAngle, _DucElementBaseAddFrameId, _DucElementBaseAddStyles,
    _DucElementBaseAddGroupIds, _DucElementBaseAddBoundElements, 
    _DucElementBaseAddLocked, _DucElementBaseAddLink, _DucElementBaseAddLabel,
    _DucElementBaseAddIsVisible,
    _DucElementBaseAddScope, _DucElementBaseAddIsDeleted,
    _DucElementBaseStartGroupIdsVector, _DucElementBaseStartBoundElementsVector,
    _DucElementBaseAddZIndex, _DucElementBaseAddLayerId, _DucElementBaseAddDescription,
    _DucElementBaseAddIndex, _DucElementBaseAddSeed, _DucElementBaseAddVersion,
    _DucElementBaseAddVersionNonce, _DucElementBaseAddUpdated, _DucElementBaseAddIsPlot,
    _DucElementBaseAddIsAnnotative, _DucElementBaseAddCustomData,
    _DucElementBaseStartRegionIdsVector
)
from ducpy.Duc.DucStackLikeStyles import (
    DucStackLikeStylesStart, DucStackLikeStylesEnd,
    DucStackLikeStylesAddOpacity, DucStackLikeStylesAddLabelingColor
)
from ducpy.Duc._DucStackBase import (
    _DucStackBaseStart, _DucStackBaseEnd,
    _DucStackBaseAddLabel, _DucStackBaseAddDescription,
    _DucStackBaseAddIsCollapsed, _DucStackBaseAddIsPlot,
    _DucStackBaseAddIsVisible, _DucStackBaseAddLocked,
    _DucStackBaseAddStyles
)
from ducpy.Duc._DucStackElementBase import (
    _DucStackElementBaseStart, _DucStackElementBaseEnd,
    _DucStackElementBaseAddStackBase, _DucStackElementBaseAddBase
)
from ducpy.Duc._DucLinearElementBase import (
    _DucLinearElementBaseStart, _DucLinearElementBaseEnd,
    _DucLinearElementBaseAddBase, _DucLinearElementBaseAddStartBinding,
    _DucLinearElementBaseAddEndBinding
)

# Import from base elements
from .serialize_base_elements import (
    serialize_fbs_element_stroke, serialize_fbs_element_background, 
    serialize_fbs_bound_element, serialize_fbs_duc_point_binding
)


def serialize_fbs_duc_element_styles_base(builder: flatbuffers.Builder, styles_base: DucElementStylesBase) -> int:
    """Serialize DucElementStylesBase to FlatBuffers."""
    # Serialize stroke list
    stroke_offsets = []
    for stroke_item in styles_base.stroke:
        stroke_offsets.append(serialize_fbs_element_stroke(builder, stroke_item))
    
    _DucElementStylesBaseStartStrokeVector(builder, len(stroke_offsets))
    for offset in reversed(stroke_offsets):
        builder.PrependUOffsetTRelative(offset)
    stroke_vector = builder.EndVector()

    # Serialize background list
    background_offsets = []
    for background_item in styles_base.background:
        background_offsets.append(serialize_fbs_element_background(builder, background_item))
    
    _DucElementStylesBaseStartBackgroundVector(builder, len(background_offsets))
    for offset in reversed(background_offsets):
        builder.PrependUOffsetTRelative(offset)
    background_vector = builder.EndVector()
    
    _DucElementStylesBaseStart(builder)
    _DucElementStylesBaseAddStroke(builder, stroke_vector)
    _DucElementStylesBaseAddBackground(builder, background_vector)
    _DucElementStylesBaseAddOpacity(builder, styles_base.opacity)
    if styles_base.roundness is not None:
        _DucElementStylesBaseAddRoundness(builder, styles_base.roundness)
    if styles_base.blending is not None:
        _DucElementStylesBaseAddBlending(builder, styles_base.blending)
    return _DucElementStylesBaseEnd(builder)


def serialize_fbs_duc_element_base(builder: flatbuffers.Builder, element_base: DucElementBase) -> int:
    """Serialize DucElementBase to FlatBuffers."""
    id_offset = builder.CreateString(element_base.id)
    frame_id_offset = builder.CreateString(element_base.frame_id) if element_base.frame_id else None
    styles_offset = serialize_fbs_duc_element_styles_base(builder, element_base.styles) if element_base.styles else None
    link_offset = builder.CreateString(element_base.link) if element_base.link else None
    label_offset = builder.CreateString(element_base.label) if element_base.label else None
    scope_offset = builder.CreateString(element_base.scope) if element_base.scope else None
    description_offset = builder.CreateString(element_base.description) if element_base.description else None
    index_offset = builder.CreateString(element_base.index) if element_base.index else None
    custom_data_offset = builder.CreateString(element_base.custom_data) if element_base.custom_data else None
    layer_id_offset = builder.CreateString(element_base.layer_id) # layer_id is a mandatory string

    # Serialize group IDs vector
    if element_base.group_ids:
        group_ids_offsets = []
        for group_id in element_base.group_ids:
            group_ids_offsets.append(builder.CreateString(group_id))
        
        _DucElementBaseStartGroupIdsVector(builder, len(group_ids_offsets))
        for offset in reversed(group_ids_offsets):
            builder.PrependUOffsetTRelative(offset)
        group_ids_vector = builder.EndVector()
    else:
        group_ids_vector = None
    
    # Serialize region IDs vector
    if element_base.region_ids:
        region_ids_offsets = []
        for region_id in element_base.region_ids:
            region_ids_offsets.append(builder.CreateString(region_id))
        
        _DucElementBaseStartRegionIdsVector(builder, len(region_ids_offsets))
        for offset in reversed(region_ids_offsets):
            builder.PrependUOffsetTRelative(offset)
        region_ids_vector = builder.EndVector()
    else:
        region_ids_vector = None

    # Serialize bound elements vector
    if element_base.bound_elements:
        bound_elements_offsets = []
        for bound_element in element_base.bound_elements:
            bound_elements_offsets.append(serialize_fbs_bound_element(builder, bound_element))
        
        _DucElementBaseStartBoundElementsVector(builder, len(bound_elements_offsets))
        for offset in reversed(bound_elements_offsets):
            builder.PrependUOffsetTRelative(offset)
        bound_elements_vector = builder.EndVector()
    else:
        bound_elements_vector = None
    
    _DucElementBaseStart(builder)
    _DucElementBaseAddId(builder, id_offset)
    _DucElementBaseAddX(builder, element_base.x)
    _DucElementBaseAddY(builder, element_base.y)
    _DucElementBaseAddWidth(builder, element_base.width)
    _DucElementBaseAddHeight(builder, element_base.height)
    _DucElementBaseAddAngle(builder, element_base.angle)
    if frame_id_offset is not None:
        _DucElementBaseAddFrameId(builder, frame_id_offset)
    if styles_offset is not None:
        _DucElementBaseAddStyles(builder, styles_offset)
    if group_ids_vector is not None:
        _DucElementBaseAddGroupIds(builder, group_ids_vector)
    if region_ids_vector is not None:
        _DucElementBaseAddRegionIds(builder, region_ids_vector)
    if bound_elements_vector is not None:
        _DucElementBaseAddBoundElements(builder, bound_elements_vector)
    _DucElementBaseAddLocked(builder, element_base.locked)
    if link_offset is not None:
        _DucElementBaseAddLink(builder, link_offset)
    if label_offset is not None:
        _DucElementBaseAddLabel(builder, label_offset)
    _DucElementBaseAddIsVisible(builder, element_base.is_visible)
    if scope_offset is not None:
        _DucElementBaseAddScope(builder, scope_offset)
    _DucElementBaseAddIsDeleted(builder, element_base.is_deleted)
    _DucElementBaseAddZIndex(builder, element_base.z_index)
    _DucElementBaseAddLayerId(builder, layer_id_offset) # Always add layer_id
    if description_offset is not None:
        _DucElementBaseAddDescription(builder, description_offset)
    if index_offset is not None:
        _DucElementBaseAddIndex(builder, index_offset)
    _DucElementBaseAddSeed(builder, element_base.seed)
    _DucElementBaseAddVersion(builder, element_base.version)
    _DucElementBaseAddVersionNonce(builder, element_base.version_nonce)
    _DucElementBaseAddUpdated(builder, element_base.updated)
    _DucElementBaseAddIsPlot(builder, element_base.is_plot)
    _DucElementBaseAddIsAnnotative(builder, element_base.is_annotative)
    if custom_data_offset is not None:
        _DucElementBaseAddCustomData(builder, custom_data_offset)
    
    return _DucElementBaseEnd(builder)


def serialize_fbs_duc_stack_like_styles(builder: flatbuffers.Builder, stack_styles: DucStackLikeStyles) -> int:
    """Serialize DucStackLikeStyles to FlatBuffers."""
    labeling_color_offset = builder.CreateString(stack_styles.labeling_color)
    
    DucStackLikeStylesStart(builder)
    DucStackLikeStylesAddOpacity(builder, stack_styles.opacity)
    DucStackLikeStylesAddLabelingColor(builder, labeling_color_offset)
    return DucStackLikeStylesEnd(builder)


def serialize_fbs_duc_stack_base(builder: flatbuffers.Builder, stack_base: DucStackBase) -> int:
    """Serialize DucStackBase to FlatBuffers."""
    
    _DucStackBaseStart(builder)
    return _DucStackBaseEnd(builder)


def serialize_fbs_duc_stack_element_base(builder: flatbuffers.Builder, stack_element_base: DucStackElementBase) -> int:
    """Serialize DucStackElementBase to FlatBuffers."""
    stack_base_offset = serialize_fbs_duc_stack_base(builder, stack_element_base.stack_base) if stack_element_base.stack_base else None
    element_base_offset = serialize_fbs_duc_element_base(builder, stack_element_base.base) if stack_element_base.base else None # Corrected from .element_base
    
    _DucStackElementBaseStart(builder)
    if stack_base_offset is not None:
        _DucStackElementBaseAddStackBase(builder, stack_base_offset)
    if element_base_offset is not None:
        _DucStackElementBaseAddBase(builder, element_base_offset)
    return _DucStackElementBaseEnd(builder)


def serialize_fbs_duc_linear_element_base(builder: flatbuffers.Builder, linear_base: DucLinearElementBase) -> int:
    """Serialize DucLinearElementBase to FlatBuffers."""
    element_base_offset = serialize_fbs_duc_element_base(builder, linear_base.element_base) if linear_base.element_base else None
    start_binding_offset = serialize_fbs_duc_point_binding(builder, linear_base.start_binding) if linear_base.start_binding else None
    end_binding_offset = serialize_fbs_duc_point_binding(builder, linear_base.end_binding) if linear_base.end_binding else None
    
    _DucLinearElementBaseStart(builder)
    if element_base_offset is not None:
        _DucLinearElementBaseAddBase(builder, element_base_offset)
    if start_binding_offset is not None:
        _DucLinearElementBaseAddStartBinding(builder, start_binding_offset)
    if end_binding_offset is not None:
        _DucLinearElementBaseAddEndBinding(builder, end_binding_offset)
    return _DucLinearElementBaseEnd(builder)
