from Duc.DucElement import DucElement
from ..models.DucElement import (
    DucElementUnion, DucTextElement, DucArrowElement, DucLineElement,
    DucFreeDrawElement, DucImageElement, DucFrameElement, DucGroupElement,
    DucRectangleElement, DucEllipseElement, DucDiamondElement,
    Point, PointBinding, BoundElement
)
from ..enums import FillStyle, StrokePlacement, StrokeStyle, TextAlign, ElementType

def parse_duc_element(element: DucElement) -> DucElementUnion:
    element_type = element.Type().decode('utf-8')
    
    base_attrs = {
        "id": element.Id().decode('utf-8'),
        "type": element_type,
        "x": element.X(),
        "y": element.Y(),
        "width": element.Width(),
        "height": element.Height(),
        "angle": element.Angle(),
        "stroke_color": element.StrokeColor().decode('utf-8'),
        "background_color": element.BackgroundColor().decode('utf-8'),
        "fill_style": FillStyle(element.FillStyle().decode('utf-8')),
        "stroke_width": element.StrokeWidth(),
        "stroke_style": StrokeStyle(element.StrokeStyle().decode('utf-8')),
        "stroke_placement": StrokePlacement(element.StrokePlacement().decode('utf-8')),
        "roughness": element.Roughness(),
        "opacity": element.Opacity(),
        "group_ids": [id.decode('utf-8') for id in element.GroupIdsAsNumpy()],
        "frame_id": element.FrameId().decode('utf-8') if element.FrameId() else None,
        "roundness": {
            "type": element.RoundnessType().decode('utf-8'),
            "value": element.RoundnessValue()
        } if element.RoundnessType() else None,
        "seed": element.Seed(),
        "version": element.Version(),
        "version_nonce": element.VersionNonce(),
        "is_deleted": element.IsDeleted(),
        "bound_elements": [
            BoundElement(id=be.Id().decode('utf-8'), type=be.Type().decode('utf-8'))
            for be in [element.BoundElements(i) for i in range(element.BoundElementsLength())]
        ] if element.BoundElementsLength() > 0 else None,
        "updated": element.Updated(),
        "link": element.Link().decode('utf-8') if element.Link() else None,
        "locked": element.Locked(),
        "custom_data": element.CustomData().decode('utf-8') if element.CustomData() else None,
        "label": element.Label().decode('utf-8') if element.Label() else None,
        "writing_layer": element.WritingLayer().decode('utf-8'),
        "scope": element.Scope().decode('utf-8'),
        "index": element.Index().decode('utf-8'),
        "is_visible": element.IsVisible(),
        "is_stroke_disabled": element.IsStrokeDisabled(),
        "is_background_disabled": element.IsBackgroundDisabled(),
    }

    if element_type == ElementType.TEXT.value:
        return DucTextElement(
            **base_attrs,
            text=element.Text().decode('utf-8'),
            font_size=element.FontSize(),
            font_family=element.FontFamily().decode('utf-8'),
            text_align=TextAlign(element.TextAlign().decode('utf-8')),
            vertical_align=element.VerticalAlign().decode('utf-8'),
            container_id=element.ContainerId().decode('utf-8') if element.ContainerId() else None,
            original_text=element.OriginalText().decode('utf-8'),
            auto_resize=element.AutoResize(),
            line_height=element.LineHeight(),
        )
    elif element_type in [ElementType.LINE.value, ElementType.ARROW.value]:
        linear_attrs = {
            **base_attrs,
            "points": [Point(p.X(), p.Y()) for p in [element.Points(i) for i in range(element.PointsLength())]],
            "last_committed_point": Point(element.LastCommittedPoint().X(), element.LastCommittedPoint().Y()) if element.LastCommittedPoint() else None,
            "start_binding": PointBinding(
                element_id=element.StartBinding().ElementId().decode('utf-8'),
                focus=element.StartBinding().Focus(),
                gap=element.StartBinding().Gap(),
            ) if element.StartBinding() else None,
            "end_binding": PointBinding(
                element_id=element.EndBinding().ElementId().decode('utf-8'),
                focus=element.EndBinding().Focus(),
                gap=element.EndBinding().Gap(),
            ) if element.EndBinding() else None,
            "start_arrowhead": element.StartArrowhead().decode('utf-8') if element.StartArrowhead() else None,
            "end_arrowhead": element.EndArrowhead().decode('utf-8') if element.EndArrowhead() else None,
        }
        if element_type == ElementType.ARROW.value:
            return DucArrowElement(**linear_attrs, elbowed=element.Elbowed())
        else:
            return DucLineElement(**linear_attrs)
    elif element_type == ElementType.FREEDRAW.value:
        return DucFreeDrawElement(
            **base_attrs,
            points=[Point(p.X(), p.Y()) for p in [element.Points(i) for i in range(element.PointsLength())]],
            pressures=element.PressuresAsNumpy().tolist(),
            simulate_pressure=element.SimulatePressure(),
            last_committed_point=Point(element.LastCommittedPoint().X(), element.LastCommittedPoint().Y()) if element.LastCommittedPoint() else None,
        )
    elif element_type == ElementType.IMAGE.value:
        return DucImageElement(
            **base_attrs,
            status=element.Status().decode('utf-8'),
            file_id=element.FileId().decode('utf-8'),
            scale=Point(element.Scale().X(), element.Scale().Y()),
        )
    elif element_type in [ElementType.FRAME.value, ElementType.MAGICFRAME.value]:
        return DucFrameElement(
            **base_attrs,
            name=element.Name().decode('utf-8'),
            is_collapsed=element.IsCollapsed(),
        )
    elif element_type == ElementType.GROUP.value:
        return DucGroupElement(
            **base_attrs,
            group_id_ref=element.GroupIdRef().decode('utf-8'),
            is_collapsed=element.IsCollapsed(),
        )
    elif element_type == ElementType.RECTANGLE.value:
        return DucRectangleElement(**base_attrs)
    elif element_type == ElementType.ELLIPSE.value:
        return DucEllipseElement(**base_attrs)
    elif element_type == ElementType.DIAMOND.value:
        return DucDiamondElement(**base_attrs)
    else:
        raise ValueError(f"Unknown element type: {element_type}")
