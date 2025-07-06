
from ..Duc.DucElement import DucElement as DucElementBin
from ..Duc.ImageCrop import ImageCrop as ImageCropBin
from ..Duc.Point import Point as PointBin
from ..Duc.BindingPoint import BindingPoint as BindPointBin
from ..Duc.PointBinding import PointBinding as PointBindingBin
from ..Duc.ElementContentBase import ElementContentBase as ElementContentBaseBin
from ..Duc.ElementBackground import ElementBackground as ElementBackgroundBin
from ..Duc.ElementStroke import ElementStroke as ElementStrokeBin
from ..Duc.TilingProperties import TilingProperties as TilingPropertiesBin
from ..Duc.StrokeSides import StrokeSides as StrokeSidesBin
from ..Duc.SimplePoint import SimplePoint as SimplePointBin
from ..Duc.DucLine import DucLine as DucLineBin
from ..Duc.DucLineReference import DucLineReference as DucLineReferenceBin
from ..Duc.DucPath import DucPath as DucPathBin
from ..Duc.DucTableStyleProps import DucTableStyleProps as DucTableStylePropsBin
from ..Duc.DucTableColumn import DucTableColumn as DucTableColumnBin
from ..Duc.DucTableRow import DucTableRow as DucTableRowBin
from ..Duc.DucTableCell import DucTableCell as DucTableCellBin
from ..Duc.DucTableStyle import DucTableStyle as DucTableStyleBin
from ..classes.DucElementClass import (
    SimplePoint, Point, PointBinding, BoundElement, ElementStroke,
    ElementBackground, ElementContentBase, StrokeStyleProps, StrokeSides,
    TilingProperties, ImageCrop, DucLine, DucLineReference, DucPath,
    DucTableStyleProps, DucTableColumn, DucTableRow, DucTableCell, DucTableStyle,
    DucFreeDrawEnds,
    # All element types
    DucElementBase, DucTextElement, DucArrowElement, DucLinearElement,
    DucFreeDrawElement, DucImageElement, DucFrameElement, DucGroupElement,
    DucRectangleElement, DucEllipseElement, DucMagicFrameElement,
    DucSelectionElement, DucTableElement, DucPolygonElement, DucDocElement,
    DucEmbeddableElement, DucIframeElement
)
from ..utils.enums import (
    ElementType, FontFamily, TextAlign, VerticalAlign, LineHead,
    ElementContentPreference, StrokePreference, StrokePlacement,
    StrokeCap, StrokeJoin, StrokeSidePreference, Blending,
    ElementSubset, ImageStatus
)
from ..utils.constants import DEFAULT_ELEMENT_PROPS

def parse_simple_point(point: SimplePointBin) -> SimplePoint | None:
    if not point:
        return None
    
    return SimplePoint(
        x=point.X(),
        y=point.Y()
    )
    
def parse_point(point: PointBin) -> Point | None:
    if not point:
        return None
    
    return Point(
        x=point.XV3(),
        y=point.YV3(),
        mirroring=point.Mirroring() if point.Mirroring() else None,
    )

def parse_binding_point(binding_point: BindPointBin) -> dict | None:
    if not binding_point:
        return None
    
    return {
        "index": binding_point.Index(),
        "offset": binding_point.Offset()
    }

def parse_point_binding(binding: PointBindingBin) -> PointBinding | None:
    if not binding:
        return None

    return PointBinding(
        element_id=binding.ElementId().decode('utf-8'),
        focus=binding.Focus(),
        gap=binding.Gap(),
        fixed_point=parse_simple_point(binding.FixedPoint()),
        point=parse_binding_point(binding.Point()),
        head=binding.Head() if binding.Head() else None
    )

def parse_element_content_base(content: ElementContentBaseBin, defaults: ElementContentBase) -> ElementContentBase:
    if not content:
        return defaults
    
    return ElementContentBase(
        preference=content.Preference(),
        src=content.Src().decode('utf-8') if content.Src() else defaults.src,
        visible=content.Visible(),
        opacity=content.Opacity(),
        tiling=parse_tiling(content.Tiling())
    )

def parse_tiling(tiling: TilingPropertiesBin) -> TilingProperties | None:
    if not tiling:
        return None
    
    size_in_percent = tiling.SizeInPercent()
    angle = tiling.Angle()

    if size_in_percent is None or angle is None:
        return None

    return TilingProperties(
        size_in_percent=size_in_percent,
        angle=angle,
        spacing=tiling.Spacing() if tiling.Spacing() else None,
        offset_x=tiling.OffsetX() if tiling.OffsetX() else None,
        offset_y=tiling.OffsetY() if tiling.OffsetY() else None
    )

def parse_stroke_sides(stroke_sides: StrokeSidesBin) -> StrokeSides | None:
    if not stroke_sides:
        return None

    return StrokeSides(
        preference=stroke_sides.Preference(),
        values=[stroke_sides.Values(i) for i in range(stroke_sides.ValuesLength())] if stroke_sides.ValuesLength() > 0 else None
    )

def parse_element_stroke(stroke: ElementStrokeBin) -> ElementStroke | None:
    if not stroke:
        return None

    # Check for minimum required stroke properties
    has_content = bool(stroke.Content())
    has_width = stroke.Width() is not None
    has_style = bool(stroke.Style())
    
    # Return None if no essential stroke data
    if not any([has_content, has_width, has_style]):
        return None

    # Only create stroke if we have valid content
    stroke_content = parse_element_content_base(stroke.Content(), None)
    if not stroke_content or not stroke_content.src:
        return None

    return ElementStroke(
        content=stroke_content,
        width=stroke.Width(),
        style=StrokeStyleProps(
            preference=stroke.Style().Preference() if stroke.Style() else None,
            cap=stroke.Style().Cap() if stroke.Style() else None,
            join=stroke.Style().Join() if stroke.Style() else None,
            dash=[stroke.Style().Dash(i) for i in range(stroke.Style().DashLength())] if stroke.Style() and stroke.Style().DashLength() > 0 else None,
            dash_cap=stroke.Style().DashCap() if stroke.Style() else None,
            miter_limit=stroke.Style().MiterLimit() if stroke.Style() else None
        ),
        placement=stroke.Placement(),
        stroke_sides=parse_stroke_sides(stroke.StrokeSides())
    )

def parse_element_background(background: ElementBackgroundBin) -> ElementBackground | None:
    if not background:
        return None

    # Check for minimum required background properties
    bg_content = parse_element_content_base(background.Content(), None)
    if not bg_content or not bg_content.src:
        return None

    return ElementBackground(
        content=bg_content
    )

def parse_image_crop(crop: ImageCropBin) -> ImageCrop | None:
    if not crop:
        return None
    
    return ImageCrop(
        x=crop.X(),
        y=crop.Y(),
        width=crop.Width(),
        height=crop.Height(),
        natural_width=crop.NaturalWidth(),
        natural_height=crop.NaturalHeight()
    )

def parse_duc_line_reference(ref: DucLineReferenceBin) -> DucLineReference | None:
    if not ref:
        return None
    return DucLineReference(
        index=ref.Index(),
        handle=parse_simple_point(ref.Handle())
    )

def parse_duc_line(line: DucLineBin) -> DucLine | None:
    if not line:
        return None
    return DucLine(
        start=parse_duc_line_reference(line.Start()),
        end=parse_duc_line_reference(line.End())
    )

def parse_duc_path(path: DucPathBin) -> DucPath | None:
    if not path:
        return None
    
    line_indices_length = path.LineIndicesLength()
    line_indices = [path.LineIndices(i) for i in range(line_indices_length)] if line_indices_length > 0 else []

    return DucPath(
        line_indices=line_indices,
        background=parse_element_background(path.Background()),
        stroke=parse_element_stroke(path.Stroke())
    )

def parse_duc_table_style_props(props: DucTableStylePropsBin) -> DucTableStyleProps | None:
    if not props:
        return None
    
    border_dashes_length = props.BorderDashesLength()
    border_dashes = [props.BorderDashes(i) for i in range(border_dashes_length)] if border_dashes_length > 0 else []

    return DucTableStyleProps(
        background_color=props.BackgroundColor().decode('utf-8') if props.BackgroundColor() else None,
        border_width=props.BorderWidth(),
        border_dashes=border_dashes,
        border_color=props.BorderColor().decode('utf-8') if props.BorderColor() else None,
        text_color=props.TextColor().decode('utf-8') if props.TextColor() else None,
        text_size=props.TextSize(),
        text_font=props.TextFont().decode('utf-8') if props.TextFont() else None,
        text_align=props.TextAlign()
    )

def parse_duc_table_column(column: DucTableColumnBin) -> DucTableColumn | None:
    if not column:
        return None
    return DucTableColumn(
        id=column.Id().decode('utf-8'),
        width=column.Width(),
        style=parse_duc_table_style_props(column.Style())
    )

def parse_duc_table_row(row: DucTableRowBin) -> DucTableRow | None:
    if not row:
        return None
    return DucTableRow(
        id=row.Id().decode('utf-8'),
        height=row.Height(),
        style=parse_duc_table_style_props(row.Style())
    )

def parse_duc_table_cell(cell: DucTableCellBin) -> DucTableCell | None:
    if not cell:
        return None
    return DucTableCell(
        row_id=cell.RowId().decode('utf-8'),
        column_id=cell.ColumnId().decode('utf-8'),
        data=cell.Data().decode('utf-8') if cell.Data() else None,
        style=parse_duc_table_style_props(cell.Style())
    )

def parse_duc_table_style(style: DucTableStyleBin) -> DucTableStyle | None:
    if not style:
        return None
    return DucTableStyle(
        default_props=parse_duc_table_style_props(style.DefaultProps())
    )

def parse_duc_element(element: DucElementBin) -> DucElementBase:
    if not element:
        return None
    
    element_type = element.Type().decode('utf-8')
    if not element_type:
        return None

    # Parse group IDs - Fix vector parsing
    group_ids_length = element.GroupIdsLength()
    group_ids = [element.GroupIds(i).decode('utf-8') for i in range(group_ids_length)] if group_ids_length > 0 else []

    # Parse bound elements - Fix vector parsing
    bound_elements_length = element.BoundElementsLength()
    bound_elements = [
        BoundElement(
            id=be.Id().decode('utf-8'),
            type=be.Type().decode('utf-8')
        ) for be in (element.BoundElements(i) for i in range(bound_elements_length))
        if be and be.Id() and be.Type()
    ]

    # Parse strokes and backgrounds
    strokes = []
    backgrounds = []

    stroke_length = element.StrokeLength() if hasattr(element, 'StrokeLength') else 0
    if stroke_length > 0:
        strokes = [s for s in (parse_element_stroke(element.Stroke(i)) for i in range(stroke_length)) if s is not None]

    background_length = element.BackgroundLength() if hasattr(element, 'BackgroundLength') else 0
    if background_length > 0:
        backgrounds = [bg for bg in (parse_element_background(element.Background(i)) for i in range(background_length)) if bg is not None]

    # Parse lines
    lines = []
    lines_length = element.LinesLength() if hasattr(element, 'LinesLength') else 0
    if lines_length > 0:
        lines = [parse_duc_line(element.Lines(i)) for i in range(lines_length)]

    # Parse linear element path overrides
    linear_element_path_overrides = []
    overrides_length = element.LinearElementPathOverridesLength() if hasattr(element, 'LinearElementPathOverridesLength') else 0
    if overrides_length > 0:
        linear_element_path_overrides = [parse_duc_path(element.LinearElementPathOverrides(i)) for i in range(overrides_length)]

    # Parse points for linear elements and freedraw
    points = []
    if element_type in [ElementType.FREEDRAW, ElementType.LINE, ElementType.ARROW]:
        points_length = element.PointsLength()
        if points_length > 0:
            points = [parse_point(element.Points(i)) for i in range(points_length)]

    # Parse pressures for freedraw
    pressures = []
    if element_type == ElementType.FREEDRAW:
        pressures_length = element.PressuresV3Length()
        if pressures_length > 0:
            pressures = [element.PressuresV3(i) for i in range(pressures_length)]

    # Base element attributes - only include common properties that all elements have
    base_attrs = {
        "id": element.Id().decode('utf-8'),
        "x": element.XV3(),
        "y": element.YV3(),
        "is_visible": element.IsVisible(),
        "opacity": element.Opacity(),
        "width": element.WidthV3(),
        "height": element.HeightV3(),
        "angle": element.AngleV3(),
        "is_deleted": element.IsDeleted(),
        "frame_id": element.FrameId().decode('utf-8') if element.FrameId() else None,
        "link": element.Link().decode('utf-8') if element.Link() else None,
        "locked": element.Locked(),
        "group_ids": group_ids,
        "scope": element.Scope().decode('utf-8') if element.Scope() else "mm",
        "label": element.Label().decode('utf-8') if element.Label() else DEFAULT_ELEMENT_PROPS["label"],
        "bound_elements": bound_elements if bound_elements else None,
        "stroke": strokes if strokes else None,
        "background": backgrounds if backgrounds else None,
        "blending": element.Blending() if element.Blending else None,
        "roundness": element.Roundness() if element.Roundness else DEFAULT_ELEMENT_PROPS["roundness"],
        "subset": element.Subset() if element.Subset else None,
        "z_index": element.ZIndex() if element.ZIndex() else None
    }

    if element_type == ElementType.TEXT:
        return DucTextElement(
            **base_attrs,
            font_size=element.FontSizeV3(),
            font_family=FontFamily(int(element.FontFamily().decode('utf-8'))),
            text=element.Text().decode('utf-8'),
            text_align=TextAlign(element.TextAlignV3()),
            vertical_align=VerticalAlign(element.VerticalAlignV3()),
            container_id=element.ContainerId().decode('utf-8') if element.ContainerId() else None,
            original_text=element.Text().decode('utf-8'),
            line_height=element.LineHeightV3(),
            auto_resize=element.AutoResize()
        )
    elif element_type == ElementType.ARROW:
        return DucArrowElement(
            **base_attrs,
            points=points,
            lines=lines,
            path_overrides=linear_element_path_overrides,
            last_committed_point=parse_point(element.LastCommittedPoint()),
            start_binding=parse_point_binding(element.StartBinding()),
            end_binding=parse_point_binding(element.EndBinding()),
            elbowed=element.Elbowed() if element.Elbowed else False
        )
    elif element_type == ElementType.LINE:
        return DucLinearElement(
            **base_attrs,
            points=points,
            lines=lines,
            path_overrides=linear_element_path_overrides,
            last_committed_point=parse_point(element.LastCommittedPoint()),
            start_binding=parse_point_binding(element.StartBinding()),
            end_binding=parse_point_binding(element.EndBinding())
        )
    elif element_type == ElementType.FREEDRAW:
        # Parse freedraw start and end configurations
        start_config = None
        if element.FreeDrawStartCap() is not None or element.FreeDrawStartTaper() is not None or element.FreeDrawStartEasing():
            start_config = DucFreeDrawEnds(
                cap=element.FreeDrawStartCap() if element.FreeDrawStartCap() is not None else False,
                taper=element.FreeDrawStartTaper() if element.FreeDrawStartTaper() is not None else 0.0,
                easing=element.FreeDrawStartEasing().decode('utf-8') if element.FreeDrawStartEasing() else "linear"
            )
        
        end_config = None
        if element.FreeDrawEndCap() is not None or element.FreeDrawEndTaper() is not None or element.FreeDrawEndEasing():
            end_config = DucFreeDrawEnds(
                cap=element.FreeDrawEndCap() if element.FreeDrawEndCap() is not None else False,
                taper=element.FreeDrawEndTaper() if element.FreeDrawEndTaper() is not None else 0.0,
                easing=element.FreeDrawEndEasing().decode('utf-8') if element.FreeDrawEndEasing() else "linear"
            )
        
        return DucFreeDrawElement(
            **base_attrs,
            points=points,
            pressures=pressures,
            simulate_pressure=element.SimulatePressure(),
            last_committed_point=parse_point(element.LastCommittedPoint()),
            thinning=element.FreeDrawThinning() if element.FreeDrawThinning() is not None else 0.0,
            smoothing=element.FreeDrawSmoothing() if element.FreeDrawSmoothing() is not None else 0.0,
            streamline=element.FreeDrawStreamline() if element.FreeDrawStreamline() is not None else 0.0,
            easing=element.FreeDrawEasing().decode('utf-8') if element.FreeDrawEasing() else "linear",
            start=start_config,
            end=end_config,
            size=element.FreeDrawSize() if element.FreeDrawSize() is not None else 1.0,
            svg_path=element.FreeDrawSvgPath().decode('utf-8') if element.FreeDrawSvgPath() else None
        )
    elif element_type == ElementType.IMAGE:
        return DucImageElement(
            **base_attrs,
            file_id=element.FileId().decode('utf-8') if element.FileId() else None,
            status=ImageStatus(element.Status().decode('utf-8')),
            scale=(element.ScaleV3().X(), element.ScaleV3().Y()) if element.ScaleV3() else (1.0, 1.0),
            crop=parse_image_crop(element.Crop())
        )
    elif element_type == ElementType.FRAME:
        return DucFrameElement(
            **base_attrs,
            is_collapsed=element.IsCollapsed(),
            clip=element.Clip() if element.Clip else False
        )
    elif element_type == ElementType.GROUP:
        return DucGroupElement(
            **base_attrs,
            is_collapsed=element.IsCollapsed(),
            clip=element.Clip() if element.Clip else False,
            group_id_ref=element.GroupIdRef().decode('utf-8')
        )
    elif element_type == ElementType.MAGIC_FRAME:
        return DucMagicFrameElement(
            **base_attrs,
            is_collapsed=element.IsCollapsed(),
            clip=element.Clip() if element.Clip else False
        )
    elif element_type == ElementType.SELECTION:
        return DucSelectionElement(**base_attrs)
    elif element_type == ElementType.RECTANGLE:
        return DucRectangleElement(**base_attrs)
    elif element_type == ElementType.DIAMOND:
        return DucPolygonElement(
            **base_attrs,
            sides=4
        )
    elif element_type == ElementType.POLYGON:
        return DucPolygonElement(
            **base_attrs,
            sides=element.PolygonSides() if element.PolygonSides() is not None else 6
        )
    elif element_type == ElementType.ELLIPSE:
        return DucEllipseElement(
            **base_attrs,
            ratio=element.EllipseRatio() if element.EllipseRatio() is not None else 1.0,
            start_angle=element.EllipseStartAngle() if element.EllipseStartAngle() is not None else 0.0,
            end_angle=element.EllipseEndAngle() if element.EllipseEndAngle() is not None else 360.0,
            show_aux_crosshair=element.EllipseShowAuxCrosshair() if element.EllipseShowAuxCrosshair() is not None else False
        )
    elif element_type == ElementType.TABLE:
        column_order_length = element.ColumnOrderLength()
        column_order = [element.ColumnOrder(i).decode('utf-8') for i in range(column_order_length)] if column_order_length > 0 else []

        row_order_length = element.RowOrderLength()
        row_order = [element.RowOrder(i).decode('utf-8') for i in range(row_order_length)] if row_order_length > 0 else []

        columns_length = element.ColumnsLength()
        columns = [parse_duc_table_column(element.Columns(i)) for i in range(columns_length)] if columns_length > 0 else []

        rows_length = element.RowsLength()
        rows = [parse_duc_table_row(element.Rows(i)) for i in range(rows_length)] if rows_length > 0 else []

        cells_length = element.CellsLength()
        cells = [parse_duc_table_cell(element.Cells(i)) for i in range(cells_length)] if cells_length > 0 else []
        
        return DucTableElement(
            **base_attrs,
            column_order=column_order,
            row_order=row_order,
            columns=columns,
            rows=rows,
            cells=cells,
            style=parse_duc_table_style_props(element.TableStyle().DefaultProps()) if element.TableStyle() and element.TableStyle().DefaultProps() else None
        )
    elif element_type == ElementType.DOC:
        return DucDocElement(
            **base_attrs,
            content=element.DocContent().decode('utf-8') if element.DocContent() else ""
        )
    else:
        raise ValueError(f"Unknown element type: {element_type}")
