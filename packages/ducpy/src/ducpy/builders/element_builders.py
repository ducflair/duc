"""
Helper functions for creating DUC elements with a user-friendly API.
Only the 15 element types from duc.sql / types.rs are supported.
"""
import math
from dataclasses import dataclass, field
from math import pi
from typing import Any, Dict, List, Optional, Union

import numpy as np
from ducpy.enums import (IMAGE_STATUS, STROKE_CAP, STROKE_JOIN,
                         STROKE_PLACEMENT, STROKE_PREFERENCE, TEXT_ALIGN,
                         VERTICAL_ALIGN)
from ducpy.utils import (DEFAULT_FILL_COLOR, DEFAULT_SCOPE,
                         DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
                         generate_random_id)
from ducpy.utils.rand_utils import random_versioning

from ..classes.ElementsClass import (BoundElement, DocumentGridConfig,
                                     DucArrowElement, DucDocElement,
                                     DucDocStyle, DucElementBase,
                                     DucElementStylesBase, DucEllipseElement,
                                     DucEmbeddableElement, DucFrameElement,
                                     DucFreeDrawElement, DucFreeDrawEnds,
                                     DucHead, DucImageElement, DucImageFilter,
                                     DucLine, DucLinearElement,
                                     DucLinearElementBase, DucLineReference,
                                     DucModelElement, DucPath, DucPdfElement,
                                     DucPlotElement, DucPlotStyle, DucPoint,
                                     DucPointBinding, DucPolygonElement,
                                     DucRectangleElement, DucStackBase,
                                     DucStackElementBase, DucStackLikeStyles,
                                     DucTableElement, DucTableStyle,
                                     DucTextElement, DucTextStyle,
                                     ElementBackground, ElementContentBase,
                                     ElementStroke, ElementWrapper,
                                     GeometricPoint, ImageCrop, Margins,
                                     PlotLayout, StringValueEntry, StrokeStyle)
from .style_builders import (create_doc_style, create_simple_styles,
                             create_table_style, create_text_style)


def _create_element_wrapper(element_class, base_params, element_params, explicit_properties_override=None):
    """Helper function to create an ElementWrapper with the given parameters."""
    if not base_params.get('id'):
        base_params['id'] = generate_random_id()

    versioning = random_versioning()
    base_params.setdefault('seed', versioning['seed'])
    base_params.setdefault('version', versioning['version'])
    base_params.setdefault('version_nonce', versioning['version_nonce'])
    base_params.setdefault('updated', versioning['updated'])

    base_params.setdefault('group_ids', [])
    base_params.setdefault('block_ids', [])
    base_params.setdefault('region_ids', [])
    base_params.setdefault('instance_id', None)

    base_params.setdefault('styles', DucElementStylesBase(
        roundness=0.0,
        stroke=[ElementStroke(
            content=ElementContentBase(
                preference=None,
                src="",
                visible=True,
                opacity=1.0,
                tiling=None,
                hatch=None,
                image_filter=DucImageFilter(brightness=1.0, contrast=1.0)
            ),
            width=DEFAULT_STROKE_WIDTH,
            style=StrokeStyle(
                preference=STROKE_PREFERENCE.SOLID,
                dash=None,
                dash_line_override=None,
                cap=None,
                join=None,
                dash_cap=None,
                miter_limit=None
            ),
            placement=STROKE_PLACEMENT.CENTER,
            stroke_sides=None
        )],
        background=[ElementBackground(
            content=ElementContentBase(
                preference=None,
                src="",
                visible=True,
                opacity=1.0,
                tiling=None,
                hatch=None,
                image_filter=DucImageFilter(brightness=1.0, contrast=1.0)
            )
        )],
        opacity=1.0,
        blending=None
    ))

    base_element = DucElementBase(**base_params)

    if element_class == DucLinearElement:
        points = element_params.get('points', [])
        duc_points = [
            DucPoint(x=float(p[0]), y=float(p[1]), mirroring=None) if isinstance(p, tuple) else p
            for p in points
        ]
        linear_base = DucLinearElementBase(
            base=base_element,
            points=duc_points,
            lines=element_params.get('lines', []),
            path_overrides=element_params.get('path_overrides', []),
            last_committed_point=element_params.get('last_committed_point'),
            start_binding=element_params.get('start_binding'),
            end_binding=element_params.get('end_binding')
        )
        specific_element = element_class(
            linear_base=linear_base,
            wipeout_below=element_params.get('wipeout_below', False)
        )
    elif element_class == DucArrowElement:
        points = element_params.get('points', [])
        duc_points = [
            DucPoint(x=float(p[0]), y=float(p[1]), mirroring=None) if isinstance(p, tuple) else p
            for p in points
        ]
        linear_base = DucLinearElementBase(
            base=base_element,
            points=duc_points,
            lines=[],
            path_overrides=[],
            last_committed_point=None,
            start_binding=element_params.get('start_binding'),
            end_binding=element_params.get('end_binding')
        )
        specific_element = element_class(
            linear_base=linear_base,
            elbowed=element_params.get('elbowed', False)
        )
    elif element_class == DucPlotElement:
        stack_base = element_params.get('stack_base')
        if stack_base is None:
            stack_base = DucStackBase(
                label=base_params.get('label', ""),
                is_collapsed=False,
                is_plot=True,
                is_visible=True,
                locked=False,
                styles=DucStackLikeStyles(opacity=1.0),
                description=base_params.get('description', "")
            )
        stack_element_base = DucStackElementBase(
            base=base_element,
            stack_base=stack_base,
            clip=element_params.get('clip', False),
            label_visible=element_params.get('label_visible', True),
        )
        plot_style = element_params.get('style') or DucPlotStyle()
        margins = element_params.get('margins') or Margins(top=10.0, right=10.0, bottom=10.0, left=10.0)
        layout = PlotLayout(margins=margins)
        specific_element = element_class(
            stack_element_base=stack_element_base,
            style=plot_style,
            layout=layout
        )
    elif element_class == DucDocElement:
        default_grid_config = DocumentGridConfig(
            columns=1, gap_x=0.0, gap_y=0.0, first_page_alone=False, scale=1.0)
        specific_element = element_class(
            base=base_element,
            style=element_params.get('style') or DucDocStyle(),
            text=element_params.get('text', ""),
            grid_config=element_params.get('grid_config', default_grid_config),
            file_id=element_params.get('file_id'),
        )
    elif element_class == DucFrameElement:
        stack_base = element_params.get('stack_base')
        if stack_base is None:
            stack_base = DucStackBase(
                label=base_params.get('label', ""),
                is_collapsed=False,
                is_plot=True,
                is_visible=True,
                locked=False,
                styles=DucStackLikeStyles(opacity=1.0),
                description=base_params.get('description', "")
            )
        stack_element_base = DucStackElementBase(
            base=base_element,
            stack_base=stack_base,
            clip=element_params.get('clip', False),
            label_visible=element_params.get('label_visible', True),
        )
        specific_element = element_class(stack_element_base=stack_element_base)
    elif element_class == DucImageElement:
        scale = element_params.get('scale', [1.0, 1.0])
        if isinstance(scale, list):
            element_params['scale'] = np.array(scale, dtype=np.float32)
        element_params['base'] = base_element
        specific_element = element_class(**element_params)
    elif element_class == DucFreeDrawElement:
        points = element_params.get('points', [])
        duc_points = [
            DucPoint(x=float(p[0]), y=float(p[1]), mirroring=None) if isinstance(p, tuple) else p
            for p in points
        ]
        element_params['points'] = duc_points
        pressures = element_params.get('pressures', [])
        if isinstance(pressures, list):
            element_params['pressures'] = np.array(pressures, dtype=np.float32)
        element_params['base'] = base_element
        specific_element = element_class(**element_params)
    elif element_class == DucTableElement:
        specific_element = element_class(
            base=base_element,
            style=element_params.get('style') or DucTableStyle(),
            file_id=element_params.get('file_id'),
        )
    else:
        element_params['base'] = base_element
        if element_class.__name__ == "DucTextElement":
            if 'container_id' not in element_params:
                element_params['container_id'] = None
        specific_element = element_class(**element_params)

    if explicit_properties_override:
        for key, value in explicit_properties_override.items():
            try:
                setattr(specific_element, key, value)
            except AttributeError:
                pass

    return ElementWrapper(element=specific_element)


@dataclass
class BaseElementParams:
    x: float
    y: float
    width: float
    height: float
    scope: str
    angle: float = 0.0
    styles: Optional[DucElementStylesBase] = None
    id: Optional[str] = None
    label: str = ""
    locked: bool = False
    is_visible: bool = True
    z_index: float = 0.0
    description: str = ""
    group_ids: Optional[List[str]] = field(default_factory=list)
    region_ids: Optional[List[str]] = field(default_factory=list)
    layer_id: str = ""
    frame_id: Optional[str] = None
    bound_elements: Optional[List[BoundElement]] = field(default_factory=list)
    link: str = ""
    custom_data: str = ""
    is_plot: bool = True
    is_deleted: bool = False
    index: Optional[str] = None
    instance_id: Optional[str] = None


class ElementBuilder:
    def __init__(
        self,
        x: float = 0.0,
        y: float = 0.0,
        width: float = 1.0,
        height: float = 1.0,
        scope: str = DEFAULT_SCOPE
    ):
        self.base = BaseElementParams(x=x, y=y, width=width, height=height, scope=scope)
        self.extra = {}

    def at_position(self, x: float, y: float):
        self.base.x = x; self.base.y = y; return self

    def with_size(self, width: float, height: float):
        self.base.width = width; self.base.height = height; return self

    def with_angle(self, angle: float):
        self.base.angle = angle; return self

    def with_styles(self, styles: DucElementStylesBase):
        self.base.styles = styles; return self

    def with_id(self, id: str):
        self.base.id = id; return self

    def with_label(self, label: str):
        self.base.label = label; return self

    def with_scope(self, scope: str):
        self.base.scope = scope; return self

    def with_locked(self, locked: bool):
        self.base.locked = locked; return self

    def with_visible(self, is_visible: bool):
        self.base.is_visible = is_visible; return self

    def with_instance_id(self, instance_id: str):
        self.base.instance_id = instance_id; return self

    def with_z_index(self, z_index: float):
        self.base.z_index = z_index; return self

    def with_description(self, description: str):
        self.base.description = description; return self

    def with_group_ids(self, group_ids: List[str]):
        self.base.group_ids = group_ids; return self

    def with_region_ids(self, region_ids: List[str]):
        self.base.region_ids = region_ids; return self

    def with_layer_id(self, layer_id: str):
        self.base.layer_id = layer_id; return self

    def with_frame_id(self, frame_id: str):
        self.base.frame_id = frame_id; return self

    def with_bound_elements(self, bound_elements: List[BoundElement]):
        self.base.bound_elements = bound_elements; return self

    def with_bound_element(self, element_id: str, element_type: str):
        if self.base.bound_elements is None:
            self.base.bound_elements = []
        self.base.bound_elements.append(BoundElement(id=element_id, type=element_type))
        return self

    def with_link(self, link: str):
        self.base.link = link; return self

    def with_custom_data(self, custom_data: str):
        self.base.custom_data = custom_data; return self

    def with_plot(self, is_plot: bool):
        self.base.is_plot = is_plot; return self

    def with_deleted(self, is_deleted: bool):
        self.base.is_deleted = is_deleted; return self

    def with_index(self, index: str):
        self.base.index = index; return self

    def with_extra(self, **kwargs):
        self.extra.update(kwargs); return self

    def build_rectangle(self):
        return RectangleElementBuilder(self.base, self.extra)

    def build_ellipse(self):
        return EllipseElementBuilder(self.base, self.extra)

    def build_polygon(self):
        return PolygonElementBuilder(self.base, self.extra)

    def build_linear_element(self):
        return LinearElementBuilder(self.base, self.extra)

    def build_arrow_element(self):
        return ArrowElementBuilder(self.base, self.extra)

    def build_image_element(self):
        return ImageElementBuilder(self.base, self.extra)

    def build_pdf_element(self):
        return PdfElementBuilder(self.base, self.extra)

    def build_text_element(self):
        return TextElementBuilder(self.base, self.extra)

    def build_table_element(self):
        return TableElementBuilder(self.base, self.extra)

    def build_frame_element(self):
        return FrameElementBuilder(self.base, self.extra)

    def build_plot_element(self):
        return PlotElementBuilder(self.base, self.extra)

    def build_freedraw_element(self):
        return FreeDrawElementBuilder(self.base, self.extra)

    def build_doc_element(self):
        return DocElementBuilder(self.base, self.extra)

    def build_embeddable_element(self):
        return EmbeddableElementBuilder(self.base, self.extra)

    def build_model_element(self):
        return ModelElementBuilder(self.base, self.extra)


def create_duc_path(
    line_indices: List[int],
    background: Optional[ElementBackground] = None,
    stroke: Optional[ElementStroke] = None
) -> DucPath:
    return DucPath(line_indices=line_indices, background=background, stroke=stroke)


def create_bound_element(element_id: str, element_type: str) -> BoundElement:
    return BoundElement(id=element_id, type=element_type)


class ElementSpecificBuilder:
    def __init__(self, base: BaseElementParams, extra: dict):
        self.base = base
        self.extra = extra.copy()


class RectangleElementBuilder(ElementSpecificBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        return _create_element_wrapper(DucRectangleElement, base_params, {},
                                       self.extra.get('explicit_properties_override'))


class EllipseElementBuilder(ElementSpecificBuilder):
    def with_ratio(self, ratio: float):
        self.extra["ratio"] = ratio; return self
    def with_start_angle(self, start_angle: float):
        self.extra["start_angle"] = start_angle; return self
    def with_end_angle(self, end_angle: float):
        self.extra["end_angle"] = end_angle; return self
    def with_show_aux_crosshair(self, show_aux_crosshair: bool):
        self.extra["show_aux_crosshair"] = show_aux_crosshair; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "ratio": self.extra.get('ratio', 1.0),
            "start_angle": self.extra.get('start_angle', 0.0),
            "end_angle": self.extra.get('end_angle', 2 * pi),
            "show_aux_crosshair": self.extra.get('show_aux_crosshair', False),
        }
        return _create_element_wrapper(DucEllipseElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class PolygonElementBuilder(ElementSpecificBuilder):
    def with_sides(self, sides: int):
        self.extra["sides"] = sides; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        return _create_element_wrapper(DucPolygonElement, base_params,
                                       {"sides": self.extra.get('sides', 3)},
                                       self.extra.get('explicit_properties_override'))


class LinearElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: List[tuple]):
        self.extra["points"] = points; return self
    def with_lines(self, lines: Optional[List[DucLine]]):
        self.extra["lines"] = lines; return self
    def with_path_overrides(self, path_overrides: Optional[List[DucPath]]):
        self.extra["path_overrides"] = path_overrides; return self
    def with_last_committed_point(self, lcp: Optional[DucPoint]):
        self.extra["last_committed_point"] = lcp; return self
    def with_start_binding(self, sb: Optional[DucPointBinding]):
        self.extra["start_binding"] = sb; return self
    def with_end_binding(self, eb: Optional[DucPointBinding]):
        self.extra["end_binding"] = eb; return self
    def with_wipeout_below(self, wipeout_below: bool):
        self.extra["wipeout_below"] = wipeout_below; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "points": self.extra.get('points', []),
            "lines": self.extra.get('lines', []),
            "path_overrides": self.extra.get('path_overrides', []),
            "last_committed_point": self.extra.get('last_committed_point'),
            "start_binding": self.extra.get('start_binding'),
            "end_binding": self.extra.get('end_binding'),
            "wipeout_below": self.extra.get('wipeout_below', False)
        }
        return _create_element_wrapper(DucLinearElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class ArrowElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: List[tuple]):
        self.extra["points"] = points; return self
    def with_start_binding(self, sb: Optional[DucPointBinding]):
        self.extra["start_binding"] = sb; return self
    def with_end_binding(self, eb: Optional[DucPointBinding]):
        self.extra["end_binding"] = eb; return self
    def with_elbowed(self, elbowed: bool):
        self.extra["elbowed"] = elbowed; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "points": self.extra.get('points', []),
            "start_binding": self.extra.get('start_binding'),
            "end_binding": self.extra.get('end_binding'),
            "elbowed": self.extra.get('elbowed', False)
        }
        return _create_element_wrapper(DucArrowElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class ImageElementBuilder(ElementSpecificBuilder):
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id; return self
    def with_scale(self, scale: List[float]):
        self.extra["scale"] = scale; return self
    def with_status(self, status: IMAGE_STATUS):
        self.extra["status"] = status; return self
    def with_crop(self, crop: Optional[ImageCrop]):
        self.extra["crop"] = crop; return self
    def with_filter(self, f: Optional[DucImageFilter]):
        self.extra["filter"] = f; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "scale": self.extra.get('scale', [1.0, 1.0]),
            "status": self.extra.get('status', IMAGE_STATUS.SAVED),
            "file_id": self.extra.get('file_id'),
            "crop": self.extra.get('crop'),
            "filter": self.extra.get('filter'),
        }
        return _create_element_wrapper(DucImageElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class PdfElementBuilder(ElementSpecificBuilder):
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id; return self
    def with_grid_config(self, grid_config: DocumentGridConfig):
        self.extra["grid_config"] = grid_config; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        default_grid_config = DocumentGridConfig(
            columns=1, gap_x=0.0, gap_y=0.0, first_page_alone=False, scale=1.0)
        element_params = {
            "file_id": self.extra.get('file_id'),
            "grid_config": self.extra.get('grid_config', default_grid_config),
        }
        return _create_element_wrapper(DucPdfElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class TextElementBuilder(ElementSpecificBuilder):
    def with_text(self, text: str):
        self.extra["text"] = text; return self
    def with_text_style(self, text_style: Optional[DucTextStyle]):
        self.extra["text_style"] = text_style; return self
    def with_auto_resize(self, auto_resize: bool):
        self.extra["auto_resize"] = auto_resize; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        text_style = self.extra.get('text_style') or create_text_style()
        element_params = {
            "style": text_style,
            "text": self.extra.get('text', ''),
            "auto_resize": self.extra.get('auto_resize', False),
            "original_text": self.extra.get('text', ''),
        }
        return _create_element_wrapper(DucTextElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class TableElementBuilder(ElementSpecificBuilder):
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id; return self
    def with_table_style(self, style: Optional[DucTableStyle]):
        self.extra["style"] = style; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "style": self.extra.get('style'),
            "file_id": self.extra.get('file_id'),
        }
        return _create_element_wrapper(DucTableElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class FrameElementBuilder(ElementSpecificBuilder):
    def with_stack_base(self, stack_base: Optional[DucStackBase]):
        self.extra["stack_base"] = stack_base; return self
    def with_clip(self, clip: bool):
        self.extra["clip"] = clip; return self
    def with_label_visible(self, label_visible: bool):
        self.extra["label_visible"] = label_visible; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "stack_base": self.extra.get('stack_base'),
            "clip": self.extra.get('clip', False),
            "label_visible": self.extra.get('label_visible', True),
        }
        return _create_element_wrapper(DucFrameElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class PlotElementBuilder(ElementSpecificBuilder):
    def with_margins(self, margins: Optional[Margins]):
        self.extra["margins"] = margins; return self
    def with_style(self, style: Optional[DucPlotStyle]):
        self.extra["style"] = style; return self
    def with_stack_base(self, stack_base: Optional[DucStackBase]):
        self.extra["stack_base"] = stack_base; return self
    def with_clip(self, clip: bool):
        self.extra["clip"] = clip; return self
    def with_label_visible(self, label_visible: bool):
        self.extra["label_visible"] = label_visible; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "stack_base": self.extra.get('stack_base'),
            "clip": self.extra.get('clip', False),
            "label_visible": self.extra.get('label_visible', True),
            "style": self.extra.get('style'),
            "margins": self.extra.get('margins')
        }
        return _create_element_wrapper(DucPlotElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class FreeDrawElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: list):
        self.extra["points"] = points; return self
    def with_pressures(self, pressures: list):
        self.extra["pressures"] = pressures; return self
    def with_size_thickness(self, size: float):
        self.extra["size"] = size; return self
    def with_thinning(self, thinning: float):
        self.extra["thinning"] = thinning; return self
    def with_smoothing(self, smoothing: float):
        self.extra["smoothing"] = smoothing; return self
    def with_streamline(self, streamline: float):
        self.extra["streamline"] = streamline; return self
    def with_easing(self, easing: str):
        self.extra["easing"] = easing; return self
    def with_simulate_pressure(self, simulate_pressure: bool):
        self.extra["simulate_pressure"] = simulate_pressure; return self
    def with_start_cap(self, cap: bool):
        self.extra["start_cap"] = cap; return self
    def with_start_taper(self, taper: float):
        self.extra["start_taper"] = taper; return self
    def with_start_easing(self, easing: str):
        self.extra["start_easing"] = easing; return self
    def with_end_cap(self, cap: bool):
        self.extra["end_cap"] = cap; return self
    def with_end_taper(self, taper: float):
        self.extra["end_taper"] = taper; return self
    def with_end_easing(self, easing: str):
        self.extra["end_easing"] = easing; return self
    def with_last_committed_point(self, lcp: Optional[DucPoint]):
        self.extra["last_committed_point"] = lcp; return self
    def with_svg_path(self, svg_path: Optional[str]):
        self.extra["svg_path"] = svg_path; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()

        start_ends = None
        if any(self.extra.get(k) is not None for k in ('start_cap', 'start_taper', 'start_easing')):
            start_ends = DucFreeDrawEnds(
                cap=self.extra.get('start_cap', True),
                taper=self.extra.get('start_taper', 0.0),
                easing=self.extra.get('start_easing', "linear")
            )
        end_ends = None
        if any(self.extra.get(k) is not None for k in ('end_cap', 'end_taper', 'end_easing')):
            end_ends = DucFreeDrawEnds(
                cap=self.extra.get('end_cap', True),
                taper=self.extra.get('end_taper', 0.0),
                easing=self.extra.get('end_easing', "linear")
            )

        element_params = {
            "points": self.extra.get('points', []),
            "pressures": self.extra.get('pressures', []),
            "size": self.extra.get('size', 1.0),
            "thinning": self.extra.get('thinning', 0.0),
            "smoothing": self.extra.get('smoothing', 0.0),
            "streamline": self.extra.get('streamline', 0.0),
            "easing": self.extra.get('easing', "linear"),
            "simulate_pressure": self.extra.get('simulate_pressure', False),
            "start": start_ends,
            "end": end_ends,
            "last_committed_point": self.extra.get('last_committed_point'),
            "svg_path": self.extra.get('svg_path'),
        }
        return _create_element_wrapper(DucFreeDrawElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class DocElementBuilder(ElementSpecificBuilder):
    def with_text(self, text: str):
        self.extra["text"] = text; return self
    def with_doc_style(self, style: Optional[DucDocStyle]):
        self.extra["style"] = style; return self
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id; return self
    def with_grid_config(self, grid_config: DocumentGridConfig):
        self.extra["grid_config"] = grid_config; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "style": self.extra.get('style'),
            "text": self.extra.get('text', ""),
            "file_id": self.extra.get('file_id'),
            "grid_config": self.extra.get('grid_config'),
        }
        return _create_element_wrapper(DucDocElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))


class EmbeddableElementBuilder(ElementSpecificBuilder):
    def with_link(self, link: str):
        self.extra["link"] = link; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        if 'link' in self.extra:
            base_params['link'] = self.extra['link']
        return _create_element_wrapper(DucEmbeddableElement, base_params, {},
                                       self.extra.get('explicit_properties_override'))


class ModelElementBuilder(ElementSpecificBuilder):
    def with_model_type(self, model_type: str):
        self.extra["model_type"] = model_type; return self
    def with_code(self, code: str):
        self.extra["code"] = code; return self
    def with_svg_path(self, svg_path: str):
        self.extra["svg_path"] = svg_path; return self
    def with_file_ids(self, file_ids: List[str]):
        self.extra["file_ids"] = file_ids; return self
    def with_viewer_state(self, viewer_state):
        self.extra["viewer_state"] = viewer_state; return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "file_ids": self.extra.get('file_ids', []),
            "model_type": self.extra.get('model_type'),
            "code": self.extra.get('code'),
            "svg_path": self.extra.get('svg_path'),
            "viewer_state": self.extra.get('viewer_state'),
        }
        return _create_element_wrapper(DucModelElement, base_params, element_params,
                                       self.extra.get('explicit_properties_override'))
