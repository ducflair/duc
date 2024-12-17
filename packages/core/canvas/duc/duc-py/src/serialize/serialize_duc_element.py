import flatbuffers
from ..Duc.DucElement import *
from ..Duc.Point import *
from ..Duc.PointBinding import *
from ..Duc.BoundElement import *
from ..models.DucElement import DucElementUnion, Point as ModelPoint, PointBinding as ModelPointBinding, BoundElement as ModelBoundElement

def serialize_duc_element(builder: flatbuffers.Builder, element: DucElementUnion) -> int:
    id_offset = builder.CreateString(element.id)
    type_offset = builder.CreateString(element.type)
    index_offset = builder.CreateString(str(element.index) if element.index is not None else "")
    scope_offset = builder.CreateString(element.scope)
    writing_layer_offset = builder.CreateString(element.writing_layer)
    label_offset = builder.CreateString(element.label) if element.label else None
    roundness_type_offset = builder.CreateString(str(element.roundness_type)) if element.roundness_type else None
    background_color_offset = builder.CreateString(element.background_color)
    stroke_color_offset = builder.CreateString(element.stroke_color)
    stroke_style_offset = builder.CreateString(element.stroke_style.value)
    fill_style_offset = builder.CreateString(element.fill_style.value)
    frame_id_offset = builder.CreateString(element.frame_id) if element.frame_id else None
    link_offset = builder.CreateString(element.link) if element.link else None
    custom_data_offset = builder.CreateString(element.custom_data) if element.custom_data else None

    group_ids_vector = None
    if hasattr(element, 'group_ids') and element.group_ids:
        group_ids_offsets = [builder.CreateString(gid) for gid in element.group_ids]
        DucElementStartGroupIdsVector(builder, len(group_ids_offsets))
        for gid_offset in reversed(group_ids_offsets):
            builder.PrependUOffsetTRelative(gid_offset)
        group_ids_vector = builder.EndVector()

    # Create bound elements vector
    bound_elements_vector = None
    if element.bound_elements:
        bound_elements_offsets = []
        for be in element.bound_elements:
            be_id_offset = builder.CreateString(be.id)
            be_type_offset = builder.CreateString(be.type)
            BoundElementStart(builder)
            BoundElementAddId(builder, be_id_offset)
            BoundElementAddType(builder, be_type_offset)
            bound_elements_offsets.append(BoundElementEnd(builder))
        
        builder.StartVector(4, len(bound_elements_offsets), 4)
        for be_offset in reversed(bound_elements_offsets):
            builder.PrependUOffsetTRelative(be_offset)
        bound_elements_vector = builder.EndVector()

    # Start building DucElement
    DucElementStart(builder)
    DucElementAddId(builder, id_offset)
    DucElementAddType(builder, type_offset)
    DucElementAddX(builder, element.x)
    DucElementAddY(builder, element.y)
    DucElementAddIndex(builder, index_offset)
    DucElementAddScope(builder, scope_offset)
    DucElementAddWritingLayer(builder, writing_layer_offset)
    if label_offset:
        DucElementAddLabel(builder, label_offset)
    DucElementAddIsVisible(builder, element.is_visible)
    if roundness_type_offset:
        DucElementAddRoundnessType(builder, roundness_type_offset)
    if element.roundness_value is not None:
        DucElementAddRoundnessValue(builder, element.roundness_value)
    DucElementAddBackgroundColor(builder, background_color_offset)
    DucElementAddStrokeColor(builder, stroke_color_offset)
    DucElementAddStrokeWidth(builder, element.stroke_width)
    DucElementAddStrokeStyle(builder, stroke_style_offset)
    DucElementAddFillStyle(builder, fill_style_offset)
    DucElementAddStrokePlacement(builder, element.stroke_placement.value)
    DucElementAddOpacity(builder, element.opacity)
    DucElementAddWidth(builder, element.width)
    DucElementAddHeight(builder, element.height)
    DucElementAddAngle(builder, element.angle)
    DucElementAddIsDeleted(builder, element.is_deleted)
    if group_ids_vector is not None:
        DucElementAddGroupIds(builder, group_ids_vector)
    if frame_id_offset:
        DucElementAddFrameId(builder, frame_id_offset)
    if bound_elements_vector is not None:
        DucElementAddBoundElements(builder, bound_elements_vector)
    if link_offset:
        DucElementAddLink(builder, link_offset)
    DucElementAddLocked(builder, element.locked)
    if custom_data_offset:
        DucElementAddCustomData(builder, custom_data_offset)
    DucElementAddIsStrokeDisabled(builder, element.is_stroke_disabled)
    DucElementAddIsBackgroundDisabled(builder, element.is_background_disabled)

    # Add type-specific properties
    if element.type == 'text':
        font_family_offset = builder.CreateString(str(element.font_family))
        text_offset = builder.CreateString(element.text)
        text_align_offset = builder.CreateString(element.text_align.value)
        vertical_align_offset = builder.CreateString(element.vertical_align)
        container_id_offset = builder.CreateString(element.container_id) if element.container_id else None
        original_text_offset = builder.CreateString(element.original_text)

        DucElementAddFontSize(builder, element.font_size)
        DucElementAddFontFamily(builder, font_family_offset)
        DucElementAddText(builder, text_offset)
        DucElementAddTextAlign(builder, text_align_offset)
        DucElementAddVerticalAlign(builder, vertical_align_offset)
        if container_id_offset:
            DucElementAddContainerId(builder, container_id_offset)
        DucElementAddOriginalText(builder, original_text_offset)
        DucElementAddLineHeight(builder, element.line_height)
        DucElementAddAutoResize(builder, element.auto_resize)

    elif element.type in ['line', 'arrow']:
        points_offsets = []
        for point in element.points:
            PointStart(builder)
            PointAddX(builder, point.x)
            PointAddY(builder, point.y)
            points_offsets.append(PointEnd(builder))
        
        DucElementStartPointsVector(builder, len(points_offsets))
        for point_offset in reversed(points_offsets):
            builder.PrependUOffsetTRelative(point_offset)
        points_vector = builder.EndVector()

        if element.last_committed_point:
            PointStart(builder)
            PointAddX(builder, element.last_committed_point.x)
            PointAddY(builder, element.last_committed_point.y)
            last_committed_point_offset = PointEnd(builder)
            DucElementAddLastCommittedPoint(builder, last_committed_point_offset)

        if element.start_binding:
            start_binding_element_id_offset = builder.CreateString(element.start_binding.element_id)
            PointBindingStart(builder)
            PointBindingAddElementId(builder, start_binding_element_id_offset)
            PointBindingAddFocus(builder, element.start_binding.focus)
            PointBindingAddGap(builder, element.start_binding.gap)
            start_binding_offset = PointBindingEnd(builder)
            DucElementAddStartBinding(builder, start_binding_offset)

        if element.end_binding:
            end_binding_element_id_offset = builder.CreateString(element.end_binding.element_id)
            PointBindingStart(builder)
            PointBindingAddElementId(builder, end_binding_element_id_offset)
            PointBindingAddFocus(builder, element.end_binding.focus)
            PointBindingAddGap(builder, element.end_binding.gap)
            end_binding_offset = PointBindingEnd(builder)
            DucElementAddEndBinding(builder, end_binding_offset)

        start_arrowhead_offset = builder.CreateString(element.start_arrowhead) if element.start_arrowhead else None
        end_arrowhead_offset = builder.CreateString(element.end_arrowhead) if element.end_arrowhead else None

        DucElementAddPoints(builder, points_vector)
        if start_arrowhead_offset:
            DucElementAddStartArrowhead(builder, start_arrowhead_offset)
        if end_arrowhead_offset:
            DucElementAddEndArrowhead(builder, end_arrowhead_offset)

    elif element.type == 'freedraw':
        points_offsets = []
        for point in element.points:
            PointStart(builder)
            PointAddX(builder, point.x)
            PointAddY(builder, point.y)
            points_offsets.append(PointEnd(builder))
        
        DucElementStartPointsVector(builder, len(points_offsets))
        for point_offset in reversed(points_offsets):
            builder.PrependUOffsetTRelative(point_offset)
        points_vector = builder.EndVector()

        pressures_vector = DucElementStartPressuresVector(builder, element.pressures)

        DucElementAddPoints(builder, points_vector)
        DucElementAddPressures(builder, pressures_vector)
        DucElementAddSimulatePressure(builder, element.simulate_pressure)

    elif element.type == 'image':
        file_id_offset = builder.CreateString(element.file_id)
        status_offset = builder.CreateString(element.status)

        PointStart(builder)
        PointAddX(builder, element.scale.x)
        PointAddY(builder, element.scale.y)
        scale_offset = PointEnd(builder)

        DucElementAddFileId(builder, file_id_offset)
        DucElementAddStatus(builder, status_offset)
        DucElementAddScale(builder, scale_offset)

    elif element.type in ['frame', 'magicframe']:
        name_offset = builder.CreateString(element.name)
        DucElementAddName(builder, name_offset)
        DucElementAddIsCollapsed(builder, element.is_collapsed)

    elif element.type == 'group':
        group_id_ref_offset = builder.CreateString(element.group_id_ref)
        DucElementAddGroupIdRef(builder, group_id_ref_offset)
        DucElementAddIsCollapsed(builder, element.is_collapsed)

    return DucElementEnd(builder)
