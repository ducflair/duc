"""
Helper functions for creating DUC elements with a user-friendly API.
"""
import math
import time
import uuid
from dataclasses import dataclass, field
from math import pi
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

import numpy as np

if TYPE_CHECKING:
    from ..classes.StandardsClass import Standard

import random
import time

from ducpy.Duc.AXIS import AXIS
from ducpy.Duc.BLOCK_ATTACHMENT import BLOCK_ATTACHMENT
from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ducpy.Duc.COLUMN_TYPE import COLUMN_TYPE
from ducpy.Duc.DIMENSION_FIT_RULE import DIMENSION_FIT_RULE
from ducpy.Duc.DIMENSION_TEXT_PLACEMENT import DIMENSION_TEXT_PLACEMENT
from ducpy.Duc.DIMENSION_TYPE import DIMENSION_TYPE
from ducpy.Duc.FEATURE_MODIFIER import FEATURE_MODIFIER
from ducpy.Duc.GDT_SYMBOL import GDT_SYMBOL
from ducpy.Duc.IMAGE_STATUS import IMAGE_STATUS
from ducpy.Duc.LEADER_CONTENT_TYPE import LEADER_CONTENT_TYPE
from ducpy.Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ducpy.Duc.MARK_ELLIPSE_CENTER import MARK_ELLIPSE_CENTER
from ducpy.Duc.MATERIAL_CONDITION import MATERIAL_CONDITION
from ducpy.Duc.PARAMETRIC_SOURCE_TYPE import PARAMETRIC_SOURCE_TYPE
from ducpy.Duc.STACKED_TEXT_ALIGN import STACKED_TEXT_ALIGN
from ducpy.Duc.STROKE_CAP import STROKE_CAP
from ducpy.Duc.STROKE_JOIN import STROKE_JOIN
from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ducpy.Duc.TABLE_CELL_ALIGNMENT import TABLE_CELL_ALIGNMENT
from ducpy.Duc.TABLE_FLOW_DIRECTION import TABLE_FLOW_DIRECTION
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.TEXT_FLOW_DIRECTION import TEXT_FLOW_DIRECTION
from ducpy.Duc.TOLERANCE_DISPLAY import TOLERANCE_DISPLAY
from ducpy.Duc.TOLERANCE_ZONE_TYPE import TOLERANCE_ZONE_TYPE
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ducpy.Duc.VIEWPORT_SHADE_PLOT import VIEWPORT_SHADE_PLOT
from ducpy.utils import (DEFAULT_FILL_COLOR, DEFAULT_SCOPE,
                         DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
                         generate_random_id)
from ducpy.utils.rand_utils import random_versioning

from ..classes.ElementsClass import (BLOCK_ATTACHMENT, BoundElement,
                                     ColumnLayout, DatumReference,
                                     DimensionBaselineData, DimensionBindings,
                                     DimensionContinueData,
                                     DimensionDefinitionPoints,
                                     DimensionExtLineStyle, DimensionFitStyle,
                                     DimensionLineStyle, DimensionSymbolStyle,
                                     DimensionToleranceStyle,
                                     DocumentGridConfig, DucArrowElement,
                                     DucBlock, DucBlockAttributeDefinition,
                                     DucBlockAttributeDefinitionEntry,
                                     DucBlockDuplicationArray,
                                     DucBlockInstance, DucDimensionElement,
                                     DucDimensionStyle, DucDocElement,
                                     DucDocStyle, DucElementBase,
                                     DucElementStylesBase, DucEllipseElement,
                                     DucEmbeddableElement,
                                     DucFeatureControlFrameElement,
                                     DucFeatureControlFrameStyle,
                                     DucFrameElement, DucFreeDrawElement,
                                     DucFreeDrawEnds, DucHead, DucImageElement,
                                     DucImageFilter, DucLayer,
                                     DucLayerOverrides, DucLeaderElement,
                                     DucLeaderStyle, DucLine, DucLinearElement,
                                     DucLinearElementBase, DucLineReference,
                                     DucMermaidElement, DucParametricElement,
                                     DucPath, DucPdfElement, DucPlotElement,
                                     DucPlotStyle, DucPoint, DucPointBinding,
                                     DucPolygonElement, DucRectangleElement,
                                     DucRegion, DucStackBase,
                                     DucStackElementBase, DucStackLikeStyles,
                                     DucTableAutoSize, DucTableCell,
                                     DucTableCellEntry, DucTableCellSpan,
                                     DucTableCellStyle, DucTableColumn,
                                     DucTableColumnEntry, DucTableElement,
                                     DucTableRow, DucTableRowEntry,
                                     DucTableStyle, DucTextDynamicPart,
                                     DucTextElement, DucTextStyle, DucView,
                                     DucViewportElement, DucViewportStyle,
                                     DucXRayElement, DucXRayStyle,
                                     ElementBackground, ElementContentBase,
                                     ElementStroke, ElementWrapper,
                                     FCFBetweenModifier, FCFDatumDefinition,
                                     FCFDatumStyle, FCFFrameModifiers,
                                     FCFLayoutStyle, FCFProjectedZoneModifier,
                                     FCFSegmentRow, FCFSymbolStyle,
                                     FeatureControlFrameSegment,
                                     GeometricPoint, ImageCrop,
                                     LeaderBlockContent, LeaderContent,
                                     LeaderTextBlockContent, Margins,
                                     ParagraphFormatting, ParametricSource,
                                     PlotLayout, PointBindingPoint,
                                     StackFormat, StackFormatProperties,
                                     StringValueEntry, StrokeStyle, TextColumn,
                                     ToleranceClause)
from .style_builders import (create_column_layout, create_doc_style,
                             create_paragraph_formatting, create_simple_styles,
                             create_stack_format,
                             create_stack_format_properties,
                             create_text_column, create_text_style)


def _create_element_wrapper(element_class, base_params, element_params, explicit_properties_override=None):
    """Helper function to create an ElementWrapper with the given parameters."""
    # Create the base DucElementBase
    from ducpy.utils import generate_random_id
    from ducpy.utils.rand_utils import random_versioning

    # Generate ID if not provided
    if not base_params.get('id'):
        base_params['id'] = generate_random_id()
    # Set default values using rand_utils
    versioning = random_versioning()
    base_params.setdefault('seed', versioning['seed'])
    base_params.setdefault('version', versioning['version'])
    base_params.setdefault('version_nonce', versioning['version_nonce'])
    base_params.setdefault('updated', versioning['updated'])

    # Set required list fields with defaults
    base_params.setdefault('group_ids', [])
    base_params.setdefault('block_ids', [])
    base_params.setdefault('region_ids', [])
    base_params.setdefault('instance_id', None)

    # Set required optional fields with defaults
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
    
    # Handle special cases for different element types
    if element_class == DucLinearElement:
        # Convert tuple points to DucPoint objects
        points = element_params.get('points', [])
        duc_points = []
        for point in points:
            if isinstance(point, tuple):
                # Provide default mirroring as None
                duc_points.append(DucPoint(x=float(point[0]), y=float(point[1]), mirroring=None))
            else:
                duc_points.append(point)
        
        # Create linear base first
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
        # Convert tuple points to DucPoint objects
        points = element_params.get('points', [])
        duc_points = []
        for point in points:
            if isinstance(point, tuple):
                duc_points.append(DucPoint(x=float(point[0]), y=float(point[1]), mirroring=None))
            else:
                duc_points.append(point)
        
        # Create linear base first
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
    elif element_class == DucViewportElement:
        # Convert tuple points to DucPoint objects
        points = element_params.get('points', [])
        duc_points = []
        for point in points:
            if isinstance(point, tuple):
                duc_points.append(DucPoint(x=float(point[0]), y=float(point[1]), mirroring=None))
            else:
                duc_points.append(point)
        
        # Create linear base first
        linear_base = DucLinearElementBase(
            base=base_element,
            points=duc_points,
            lines=[],
            path_overrides=[],
            last_committed_point=None,
            start_binding=element_params.get('start_binding'),
            end_binding=element_params.get('end_binding')
        )
        # Create stack base if provided, otherwise use default
        stack_base = element_params.get('stack_base')
        if stack_base is None:
            stack_base = DucStackBase(
                label=base_params.get('label', ""),
                is_collapsed=False,
                is_plot=True,
                is_visible=True,
                locked=False,
                styles=DucStackLikeStyles(opacity=1.0, labeling_color="#000"),
                description=base_params.get('description', "")
            )
        # Create viewport style
        from ducpy.builders.style_builders import create_simple_styles
        viewport_style = element_params.get('style')
        if viewport_style is None:
            viewport_style = DucViewportStyle(scale_indicator_visible=True)
        specific_element = element_class(
            linear_base=linear_base,
            stack_base=stack_base,
            style=viewport_style,
            view=element_params.get('view'),
            scale=element_params.get('scale', 1.0),
            shade_plot=element_params.get('shade_plot'),
            frozen_group_ids=element_params.get('frozen_group_ids', []),
            standard_override=element_params.get('standard_override')
        )
    elif element_class == DucPlotElement:
        # Create stack base if provided, otherwise use default
        stack_base = element_params.get('stack_base')
        if stack_base is None:
            stack_base = DucStackBase(
                label=base_params.get('label', ""),
                is_collapsed=False,
                is_plot=True,
                is_visible=True,
                locked=False,
                styles=DucStackLikeStyles(opacity=1.0, labeling_color="#000"),
                description=base_params.get('description', "")
            )
        # Create stack element base
        stack_element_base = DucStackElementBase(
            base=base_element,
            stack_base=stack_base,
            clip=element_params.get('clip', False),
            label_visible=element_params.get('label_visible', True),
            standard_override=element_params.get('standard_override')
        )
        # Create plot style
        from ducpy.builders.style_builders import create_simple_styles
        plot_style = element_params.get('style')
        if plot_style is None:
            plot_style = DucPlotStyle()
        # Create plot layout
        margins = element_params.get('margins')
        if margins is None:
            margins = Margins(top=10.0, right=10.0, bottom=10.0, left=10.0)
        layout = PlotLayout(margins=margins)
        specific_element = element_class(
            stack_element_base=stack_element_base,
            style=plot_style,
            layout=layout
        )
    elif element_class == DucLeaderElement:
        # Create linear base first
        linear_base = DucLinearElementBase(
            base=base_element,
            points=element_params.get('points', []),
            lines=[],
            path_overrides=[],
            last_committed_point=None,
            start_binding=element_params.get('start_binding'),
            end_binding=element_params.get('end_binding')
        )
        # Create leader style
        from ducpy.builders.style_builders import (create_simple_styles,
                                                   create_text_style)
        leader_style = element_params.get('style')
        if leader_style is None:
            text_style = create_text_style()
            leader_style = DucLeaderStyle(
                text_style=text_style,
                text_attachment=VERTICAL_ALIGN.TOP,
                block_attachment=BLOCK_ATTACHMENT.CENTER_EXTENTS
            )
        # Create content anchor point
        content_anchor_x = element_params.get('content_anchor_x', 0.0)
        content_anchor_y = element_params.get('content_anchor_y', 0.0)
        content_anchor = GeometricPoint(x=content_anchor_x, y=content_anchor_y)
        specific_element = element_class(
            linear_base=linear_base,
            style=leader_style,
            content_anchor=content_anchor,
            content=element_params.get('content')
        )
    elif element_class == DucDocElement:
        # Create doc style
        from ducpy.builders.style_builders import (create_paragraph_formatting,
                                                   create_simple_styles,
                                                   create_stack_format,
                                                   create_text_style)
        doc_style = element_params.get('style')
        if doc_style is None:
            text_style = create_text_style()
            paragraph = create_paragraph_formatting()
            stack_format = create_stack_format()
            doc_style = DucDocStyle(
                text_style=text_style,
                paragraph=paragraph,
                stack_format=stack_format
            )
        # Create column layout
        columns_layout = element_params.get('columns')
        if columns_layout is None:
            from ducpy.builders.style_builders import (create_column_layout,
                                                       create_text_column)
            text_column = create_text_column(width=100.0)
            columns_layout = create_column_layout(definitions=[text_column])
        default_grid_config = DocumentGridConfig(
            columns=1,
            gap_x=0.0,
            gap_y=0.0,
            align_items=0,
            first_page_alone=False,
        )
        specific_element = element_class(
            base=base_element,
            style=doc_style,
            text=element_params.get('text', ""),
            dynamic=element_params.get('dynamic', []),
            columns=columns_layout,
            auto_resize=element_params.get('auto_resize', False),
            flow_direction=element_params.get('flow_direction'),
            file_id=element_params.get('file_id'),
            grid_config=element_params.get('grid_config', default_grid_config),
        )
    elif element_class == DucDimensionElement:
        # Create dimension style
        from ducpy.builders.style_builders import (create_simple_styles,
                                                   create_solid_content,
                                                   create_stroke,
                                                   create_text_style)
        dimension_style = element_params.get('style')
        if dimension_style is None:
            text_style = create_text_style()
            solid_content = create_solid_content("#000000", opacity=1.0, visible=True)
            stroke = create_stroke(solid_content, width=1.0)
            dimension_style = DucDimensionStyle(
                dim_line=DimensionLineStyle(
                    stroke=stroke,
                    text_gap=1.0
                ),
                ext_line=DimensionExtLineStyle(
                    stroke=stroke,
                    overshoot=1.0,
                    offset=1.0
                ),
                text_style=text_style,
                symbols=DimensionSymbolStyle(
                    center_mark_size=2.0,
                    center_mark_type=MARK_ELLIPSE_CENTER.MARK,
                    heads_override=None
                ),
                tolerance=DimensionToleranceStyle(
                    enabled=False,
                    upper_value=0.0,
                    lower_value=0.0,
                    precision=2,
                    display_method=TOLERANCE_DISPLAY.NONE,
                    text_style=text_style
                ),
                fit=DimensionFitStyle(
                    force_text_inside=False,
                    rule=DIMENSION_FIT_RULE.BEST_FIT,
                    text_placement=DIMENSION_TEXT_PLACEMENT.BESIDE_LINE
                )
            )
        # Create definition points
        origin1 = element_params.get('origin1')
        origin2 = element_params.get('origin2')
        location = element_params.get('location')
        
        # Convert origin1, origin2, location to GeometricPoint if they are tuples
        if isinstance(origin1, tuple):
            origin1 = GeometricPoint(x=float(origin1[0]), y=float(origin1[1]))
        if isinstance(origin2, tuple):
            origin2 = GeometricPoint(x=float(origin2[0]), y=float(origin2[1]))
        if isinstance(location, tuple):
            location = GeometricPoint(x=float(location[0]), y=float(location[1]))
        
        if origin1 is None or origin2 is None or location is None:
            # Create default points if not provided
            origin1 = GeometricPoint(x=0.0, y=0.0)
            origin2 = GeometricPoint(x=100.0, y=0.0)
            location = GeometricPoint(x=50.0, y=-20.0)
        
        definition_points = DimensionDefinitionPoints(
            origin1=origin1,
            origin2=origin2,
            location=location,
            center=None,
            jog=None
        )
        specific_element = element_class(
            base=base_element,
            style=dimension_style,
            definition_points=definition_points,
            oblique_angle=element_params.get('oblique_angle', 0.0),
            dimension_type=element_params.get('dimension_type', DIMENSION_TYPE.LINEAR),
            ordinate_axis=element_params.get('ordinate_axis'),
            bindings=element_params.get('bindings'),
            text_override=element_params.get('text_override'),
            baseline_data=element_params.get('baseline_data'),
            continue_data=element_params.get('continue_data'),
            text_position=None,
            tolerance_override=None
        )
    elif element_class == DucFeatureControlFrameElement:
        # Create feature control frame style
        from ducpy.builders.style_builders import (create_simple_styles,
                                                   create_text_style)
        fcf_style = element_params.get('style')
        if fcf_style is None:
            text_style = create_text_style()
            fcf_style = DucFeatureControlFrameStyle(
                text_style=text_style,
                layout=FCFLayoutStyle(padding=2.0, segment_spacing=1.0, row_spacing=1.0),
                symbols=FCFSymbolStyle(scale=1.0),
                datum_style=FCFDatumStyle()
            )
        specific_element = element_class(
            base=base_element,
            style=fcf_style,
            rows=element_params.get('rows', []),
            frame_modifiers=element_params.get('frame_modifiers'),
            leader_element_id=element_params.get('leader_element_id'),
            datum_definition=element_params.get('datum_definition')
        )
    elif element_class == DucXRayElement:
        # Create xray style
        from ducpy.builders.style_builders import create_simple_styles
        xray_style = DucXRayStyle(
            color=element_params.get('color', "#FF0000")
        )
        # Create origin and direction points
        origin = DucPoint(
            x=element_params.get('origin_x', 0.0),
            y=element_params.get('origin_y', 0.0),
            mirroring=None
        )
        direction = DucPoint(
            x=element_params.get('direction_x', 1.0),
            y=element_params.get('direction_y', 0.0),
            mirroring=None
        )
        specific_element = element_class(
            base=base_element,
            style=xray_style,
            origin=origin,
            direction=direction,
            start_from_origin=element_params.get('start_from_origin', False)
        )
    elif element_class == DucFrameElement:
        # Create stack base if provided, otherwise use default
        stack_base = element_params.get('stack_base')
        if stack_base is None:
            stack_base = DucStackBase(
                label=base_params.get('label', ""),
                is_collapsed=False,
                is_plot=True,
                is_visible=True,
                locked=False,
                styles=DucStackLikeStyles(opacity=1.0, labeling_color="#000"),
                description=base_params.get('description', "")
            )
        # Create stack element base
        stack_element_base = DucStackElementBase(
            base=base_element,
            stack_base=stack_base,
            clip=element_params.get('clip', False),
            label_visible=element_params.get('label_visible', True),
            standard_override=element_params.get('standard_override')
        )
        specific_element = element_class(
            stack_element_base=stack_element_base
        )
    elif element_class == DucImageElement:
        # Convert scale list to numpy array if needed
        scale = element_params.get('scale', [1.0, 1.0])
        if isinstance(scale, list):
            element_params['scale'] = np.array(scale, dtype=np.float32)
        
        # Default case: add base to element_params and create
        element_params['base'] = base_element
        specific_element = element_class(**element_params)
    elif element_class == DucFreeDrawElement:
        # Convert points to DucPoint objects if they are tuples
        points = element_params.get('points', [])
        duc_points = []
        for point in points:
            if isinstance(point, tuple):
                duc_points.append(DucPoint(x=float(point[0]), y=float(point[1]), mirroring=None))
            else:
                duc_points.append(point)
        element_params['points'] = duc_points

        # Convert pressures list to numpy array if needed
        pressures = element_params.get('pressures', [])
        if isinstance(pressures, list):
            element_params['pressures'] = np.array(pressures, dtype=np.float32)
        
        # Default case: add base to element_params and create
        element_params['base'] = base_element
        specific_element = element_class(**element_params)
    else:
        # Default case: add base to element_params and create
        element_params['base'] = base_element
        if element_class.__name__ == "DucTextElement":
            if 'container_id' not in element_params:
                element_params['container_id'] = None
        specific_element = element_class(**element_params)
    
    # Apply explicit properties override if provided
    if explicit_properties_override:
        for key, value in explicit_properties_override.items():
            try:
                setattr(specific_element, key, value)
            except AttributeError:
                # Skip if attribute doesn't exist
                pass
    # Create and return the wrapper
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
    custom_data: Union[str, Dict[str, Any]] = ""
    is_plot: bool = True
    is_annotative: bool = False
    is_deleted: bool = False
    index: Optional[int] = None
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
        self.base = BaseElementParams(
            x=x,
            y=y,
            width=width,
            height=height,
            scope=scope
        )
        self.extra = {}

    def at_position(self, x: float, y: float):
        self.base.x = x
        self.base.y = y
        return self

    def with_size(self, width: float, height: float):
        self.base.width = width
        self.base.height = height
        return self

    def with_angle(self, angle: float):
        self.base.angle = angle
        return self

    def with_styles(self, styles: DucElementStylesBase):
        self.base.styles = styles
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_label(self, label: str):
        self.base.label = label
        return self

    def with_scope(self, scope: str):
        self.base.scope = scope
        return self

    def with_locked(self, locked: bool):
        self.base.locked = locked
        return self

    def with_visible(self, is_visible: bool):
        self.base.is_visible = is_visible
        return self

    def with_instance_id(self, instance_id: str):
        self.base.instance_id = instance_id
        return self

    def with_z_index(self, z_index: float):
        self.base.z_index = z_index
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def with_group_ids(self, group_ids: List[str]):
        self.base.group_ids = group_ids
        return self

    def with_region_ids(self, region_ids: List[str]):
        self.base.region_ids = region_ids
        return self

    def with_layer_id(self, layer_id: str):
        self.base.layer_id = layer_id
        return self

    def with_frame_id(self, frame_id: str):
        self.base.frame_id = frame_id
        return self

    def with_bound_elements(self, bound_elements: List[BoundElement]):
        self.base.bound_elements = bound_elements
        return self

    def with_bound_element(self, element_id: str, element_type: str):
        """Adds a single bound element to the current element."""
        if self.base.bound_elements is None:
            self.base.bound_elements = []
        self.base.bound_elements.append(BoundElement(id=element_id, type=element_type))
        return self

    def with_link(self, link: str):
        self.base.link = link
        return self

    def with_custom_data(self, custom_data: Union[str, Dict[str, Any]]):
        self.base.custom_data = custom_data
        return self

    def with_plot(self, is_plot: bool):
        self.base.is_plot = is_plot
        return self

    def with_annotative(self, is_annotative: bool):
        self.base.is_annotative = is_annotative
        return self

    def with_deleted(self, is_deleted: bool):
        self.base.is_deleted = is_deleted
        return self

    def with_index(self, index: int):
        self.base.index = index
        return self

    def with_extra(self, **kwargs):
        self.extra.update(kwargs)
        return self

    # Build methods that return element-specific builders
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

    def build_parametric_element(self):
        return ParametricElementBuilder(self.base, self.extra)

    def build_text_element(self):
        return TextElementBuilder(self.base, self.extra)

    def build_table_from_data(self):
        return TableFromDataBuilder(self.base, self.extra)

    def build_table_element(self):
        return TableElementBuilder(self.base, self.extra)

    def build_frame_element(self):
        return FrameElementBuilder(self.base, self.extra)

    def build_plot_element(self):
        return PlotElementBuilder(self.base, self.extra)

    def build_viewport_element(self):
        return ViewportElementBuilder(self.base, self.extra)

    def build_freedraw_element(self):
        return FreeDrawElementBuilder(self.base, self.extra)

    def build_doc_element(self):
        return DocElementBuilder(self.base, self.extra)

    def build_linear_dimension(self):
        return LinearDimensionBuilder(self.base, self.extra)

    def build_aligned_dimension(self):
        return AlignedDimensionBuilder(self.base, self.extra)

    def build_angular_dimension(self):
        return AngularDimensionBuilder(self.base, self.extra)

    def build_radius_dimension(self):
        return RadiusDimensionBuilder(self.base, self.extra)

    def build_diameter_dimension(self):
        return DiameterDimensionBuilder(self.base, self.extra)

    def build_arc_length_dimension(self):
        return ArcLengthDimensionBuilder(self.base, self.extra)

    def build_center_mark_dimension(self):
        return CenterMarkDimensionBuilder(self.base, self.extra)

    def build_rotated_dimension(self):
        return RotatedDimensionBuilder(self.base, self.extra)

    def build_spacing_dimension(self):
        return SpacingDimensionBuilder(self.base, self.extra)

    def build_continue_dimension(self):
        return ContinueDimensionBuilder(self.base, self.extra)

    def build_baseline_dimension(self):
        return BaselineDimensionBuilder(self.base, self.extra)

    def build_jogged_linear_dimension(self):
        return JoggedLinearDimensionBuilder(self.base, self.extra)

    def build_leader_element(self):
        return LeaderElementBuilder(self.base, self.extra)

    def build_feature_control_frame_element(self):
        return FeatureControlFrameElementBuilder(self.base, self.extra)


    def build_mermaid_element(self):
        return MermaidElementBuilder(self.base, self.extra)

    def build_embeddable_element(self):
        return EmbeddableElementBuilder(self.base, self.extra)

    def build_xray_element(self):
        return XrayElementBuilder(self.base, self.extra)


def create_duc_path(
    line_indices: List[int],
    background: Optional[ElementBackground] = None,
    stroke: Optional[ElementStroke] = None
) -> DucPath:
    """Helper function to create a DucPath object for path overrides."""
    return DucPath(
        line_indices=line_indices,
        background=background,
        stroke=stroke
    )

def create_datum_reference(
    letters: str,
    modifier: Optional[MATERIAL_CONDITION] = None
) -> DatumReference:
    """Helper function to create a DatumReference object."""
    return DatumReference(
        letters=letters,
        modifier=modifier
    )

def create_tolerance_clause(
    value: str,
    zone_type: Optional[TOLERANCE_ZONE_TYPE] = None,
    feature_modifiers: Optional[List[FEATURE_MODIFIER]] = None,
    material_condition: Optional[MATERIAL_CONDITION] = None
) -> ToleranceClause:
    """Helper function to create a ToleranceClause object."""
    return ToleranceClause(
        value=value,
        zone_type=zone_type,
        feature_modifiers=feature_modifiers or [],
        material_condition=material_condition
    )

def create_fcf_segment(
    symbol: GDT_SYMBOL,
    tolerance: ToleranceClause,
    datums: List[DatumReference]
) -> FeatureControlFrameSegment:
    """Helper function to create a FeatureControlFrameSegment object."""
    return FeatureControlFrameSegment(
        symbol=symbol,
        tolerance=tolerance,
        datums=datums
    )

def create_fcf_segment_row(
    segments: List[FeatureControlFrameSegment]
) -> FCFSegmentRow:
    """Helper function to create an FCFSegmentRow object."""
    return FCFSegmentRow(
        segments=segments
    )

def create_bound_element(
    element_id: str,
    element_type: str
) -> BoundElement:
    """Helper to create a BoundElement using a builder-like approach."""
    return BoundElement(id=element_id, type=element_type)

def create_table_column(
    id: str,
    width: float = 100.0,
    style_overrides: Optional[DucElementStylesBase] = None
) -> DucTableColumn:
    """Helper to create a DucTableColumn object."""
    return DucTableColumn(id=id, width=width, style_overrides=style_overrides)

def create_table_row(
    id: str,
    height: float = 30.0,
    style_overrides: Optional[DucElementStylesBase] = None
) -> DucTableRow:
    """Helper to create a DucTableRow object."""
    return DucTableRow(id=id, height=height, style_overrides=style_overrides)

def create_table_cell_span(
    columns: int = 1,
    rows: int = 1
) -> DucTableCellSpan:
    """Helper to create a DucTableCellSpan object."""
    return DucTableCellSpan(columns=columns, rows=rows)

def create_table_cell(
    row_id: str,
    column_id: str,
    data: str = "",
    locked: bool = False,
    span: Optional[DucTableCellSpan] = None,
    style_overrides: Optional[DucElementStylesBase] = None
) -> DucTableCell:
    """Helper to create a DucTableCell object."""
    if span is None:
        span = create_table_cell_span()
    return DucTableCell(
        row_id=row_id,
        column_id=column_id,
        data=data,
        locked=locked,
        span=span,
        style_overrides=style_overrides
    )

def create_table_auto_size(
    columns: bool = True,
    rows: bool = True
) -> DucTableAutoSize:
    """Helper to create a DucTableAutoSize object."""
    return DucTableAutoSize(columns=columns, rows=rows)

def create_table_column_entry(
    key: str,
    value: DucTableColumn
) -> DucTableColumnEntry:
    """Helper to create a DucTableColumnEntry object."""
    return DucTableColumnEntry(key=key, value=value)

def create_table_row_entry(
    key: str,
    value: DucTableRow
) -> DucTableRowEntry:
    """Helper to create a DucTableRowEntry object."""
    return DucTableRowEntry(key=key, value=value)

def create_table_cell_entry(
    key: str,
    value: DucTableCell
) -> DucTableCellEntry:
    """Helper to create a DucTableCellEntry object."""
    return DucTableCellEntry(key=key, value=value)

# Base class for element-specific builders
class ElementSpecificBuilder:
    def __init__(self, base: BaseElementParams, extra: dict):
        self.base = base
        self.extra = extra.copy()


# Rectangle-specific builder
class RectangleElementBuilder(ElementSpecificBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        return _create_element_wrapper(
            DucRectangleElement,
            base_params,
            {},
            self.extra.get('explicit_properties_override')
        )


# Ellipse-specific builder
class EllipseElementBuilder(ElementSpecificBuilder):
    def with_ratio(self, ratio: float):
        self.extra["ratio"] = ratio
        return self

    def with_start_angle(self, start_angle: float):
        self.extra["start_angle"] = start_angle
        return self

    def with_end_angle(self, end_angle: float):
        self.extra["end_angle"] = end_angle
        return self

    def with_show_aux_crosshair(self, show_aux_crosshair: bool):
        self.extra["show_aux_crosshair"] = show_aux_crosshair
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "ratio": self.extra.get('ratio', 1.0),
            "start_angle": self.extra.get('start_angle', 0.0),
            "end_angle": self.extra.get('end_angle', 2 * pi),
            "show_aux_crosshair": self.extra.get('show_aux_crosshair', False),
        }
        return _create_element_wrapper(
            DucEllipseElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Polygon-specific builder
class PolygonElementBuilder(ElementSpecificBuilder):
    def with_sides(self, sides: int):
        self.extra["sides"] = sides
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {"sides": self.extra.get('sides', 3)}
        return _create_element_wrapper(
            DucPolygonElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Linear element-specific builder
class LinearElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: List[tuple]):
        self.extra["points"] = points
        return self

    def with_lines(self, lines: Optional[List[DucLine]]):
        self.extra["lines"] = lines
        return self

    def with_bezier_handles(self, bezier_handles: Optional[dict]):
        self.extra["bezier_handles"] = bezier_handles
        return self

    def with_line_definitions(self, line_definitions: Optional[List[dict]]):
        self.extra["line_definitions"] = line_definitions
        return self

    def with_path_overrides(self, path_overrides: Optional[List[DucPath]]):
        self.extra["path_overrides"] = path_overrides
        return self

    def with_last_committed_point(self, last_committed_point: Optional[DucPoint]):
        self.extra["last_committed_point"] = last_committed_point
        return self

    def with_start_binding(self, start_binding: Optional[DucPointBinding]):
        self.extra["start_binding"] = start_binding
        return self

    def with_end_binding(self, end_binding: Optional[DucPointBinding]):
        self.extra["end_binding"] = end_binding
        return self

    def with_wipeout_below(self, wipeout_below: bool):
        self.extra["wipeout_below"] = wipeout_below
        return self

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
        return _create_element_wrapper(
            DucLinearElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Arrow element-specific builder
class ArrowElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: List[tuple]):
        self.extra["points"] = points
        return self

    def with_start_binding(self, start_binding: Optional[DucPointBinding]):
        self.extra["start_binding"] = start_binding
        return self

    def with_end_binding(self, end_binding: Optional[DucPointBinding]):
        self.extra["end_binding"] = end_binding
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "points": self.extra.get('points', []),
            "start_binding": self.extra.get('start_binding'),
            "end_binding": self.extra.get('end_binding'),
            "elbowed": self.extra.get('elbowed', False)
        }
        return _create_element_wrapper(
            DucArrowElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Image element-specific builder
class ImageElementBuilder(ElementSpecificBuilder):
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id
        return self

    def with_scale(self, scale: List[float]):
        self.extra["scale"] = scale
        return self

    def with_status(self, status: IMAGE_STATUS):
        self.extra["status"] = status
        return self

    def with_crop(self, crop: Optional[ImageCrop]):
        self.extra["crop"] = crop
        return self

    def with_filter(self, filter: Optional[DucImageFilter]):
        self.extra["filter"] = filter
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "scale": self.extra.get('scale', [1.0, 1.0]),
            "status": self.extra.get('status', IMAGE_STATUS.SAVED),
            "file_id": self.extra.get('file_id'),
            "crop": self.extra.get('crop'),
            "filter": self.extra.get('filter'),
        }
        return _create_element_wrapper(
            DucImageElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# PDF element-specific builder
class PdfElementBuilder(ElementSpecificBuilder):
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id
        return self

    def with_grid_config(self, grid_config: DocumentGridConfig):
        self.extra["grid_config"] = grid_config
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        default_grid_config = DocumentGridConfig(
            columns=1,
            gap_x=0.0,
            gap_y=0.0,
            align_items=0,
            first_page_alone=False,
        )
        element_params = {
            "file_id": self.extra.get('file_id'),
            "grid_config": self.extra.get('grid_config', default_grid_config),
        }
        return _create_element_wrapper(
            DucPdfElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Parametric element-specific builder
class ParametricElementBuilder(ElementSpecificBuilder):
    def with_file_id(self, file_id: str):
        self.extra["file_id"] = file_id
        return self

    def with_source_type(self, source_type: PARAMETRIC_SOURCE_TYPE):
        self.extra["source_type"] = source_type
        return self

    def with_code(self, code: str):
        self.extra["code"] = code
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        param_source = ParametricSource(
            type=self.extra.get('source_type', PARAMETRIC_SOURCE_TYPE.FILE),
            code=self.extra.get('code', ""),
            file_id=self.extra.get('file_id', "")
        )
        element_params = {
            "source": param_source,
        }
        return _create_element_wrapper(
            DucParametricElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Text element-specific builder
class TextElementBuilder(ElementSpecificBuilder):
    def with_text(self, text: str):
        self.extra["text"] = text
        return self

    def with_text_style(self, text_style: Optional[DucTextStyle]):
        self.extra["text_style"] = text_style
        return self

    def with_auto_resize(self, auto_resize: bool):
        self.extra["auto_resize"] = auto_resize
        return self

    def with_dynamic(self, dynamic: Optional[List[DucTextDynamicPart]]):
        self.extra["dynamic"] = dynamic
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        # Create a default text style if none provided
        text_style = self.extra.get('text_style')
        if text_style is None:
            from ducpy.builders.style_builders import create_text_style
            text_style = create_text_style()
        
        element_params = {
            "style": text_style,
            "text": self.extra.get('text', ''),
            "dynamic": self.extra.get('dynamic', []),
            "auto_resize": self.extra.get('auto_resize', False),
            "original_text": self.extra.get('text', ''),
        }
        return _create_element_wrapper(
            DucTextElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Table from data builder
class TableFromDataBuilder(ElementSpecificBuilder):
    def with_data(self, data: List[List[str]]):
        self.extra["data"] = data
        return self

    def with_column_headers(self, column_headers: Optional[List[str]]):
        self.extra["column_headers"] = column_headers
        return self

    def with_column_widths(self, column_widths: Optional[List[float]]):
        self.extra["column_widths"] = column_widths
        return self

    def with_row_height(self, row_height: float):
        self.extra["row_height"] = row_height
        return self

    def with_header_row_count(self, header_row_count: int):
        self.extra["header_row_count"] = header_row_count
        return self

    def with_table_style(self, style: Optional[DucTableStyle]):
        self.extra["style"] = style
        return self

    def with_auto_size(self, auto_size: Optional[DucTableAutoSize]):
        self.extra["auto_size"] = auto_size
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        data = self.extra.get('data', [])
        n_rows = len(data)
        n_cols = len(data[0]) if data else 0
        
        # Generate column and row IDs
        column_ids = [f"col{i}" for i in range(n_cols)]
        row_ids = [f"row{j}" for j in range(n_rows)]
        
        # Create columns
        column_widths = self.extra.get('column_widths')
        columns = [DucTableColumnEntry(key=col_id, value=DucTableColumn(id=col_id, width=column_widths[i] if column_widths and i < len(column_widths) else 100.0, style_overrides=None)) for i, col_id in enumerate(column_ids)]
        # Create rows
        row_height = self.extra.get('row_height', 30)
        rows = [DucTableRowEntry(key=row_id, value=DucTableRow(id=row_id, height=row_height, style_overrides=None)) for row_id in row_ids]
        # Create cells
        cells = []
        for j, row_id in enumerate(row_ids):
            for i, col_id in enumerate(column_ids):
                cells.append(DucTableCellEntry(
                    key=f"{row_id}_{col_id}",
                    value=DucTableCell(
                        row_id=row_id,
                        column_id=col_id,
                        data=data[j][i] if j < len(data) and i < len(data[j]) else "",
                        locked=False,
                        span=DucTableCellSpan(columns=1, rows=1),
                        style_overrides=None
                    )
                ))
        
        # Create the table element
        element_params = {
            "style": self.extra.get('style'),
            "column_order": column_ids,
            "row_order": row_ids,
            "columns": columns,
            "rows": rows,
            "cells": cells,
            "header_row_count": self.extra.get('header_row_count', 0),
            "auto_size": self.extra.get('auto_size') or DucTableAutoSize(columns=True, rows=True),
        }
        return _create_element_wrapper(
            DucTableElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Table element builder
class TableElementBuilder(ElementSpecificBuilder):
    def with_columns(self, columns: List[DucTableColumn]):
        self.extra["columns"] = columns
        return self

    def with_rows(self, rows: List[DucTableRow]):
        self.extra["rows"] = rows
        return self

    def with_cells(self, cells: List[DucTableCell]):
        self.extra["cells"] = cells
        return self

    def with_table_style(self, style: Optional[DucTableStyle]):
        self.extra["style"] = style
        return self

    def with_header_row_count(self, header_row_count: int):
        self.extra["header_row_count"] = header_row_count
        return self

    def with_auto_size(self, auto_size: Optional[DucTableAutoSize]):
        self.extra["auto_size"] = auto_size
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        # Ensure style is always set
        style = self.extra.get('style')
        if style is None:
            from ducpy.builders.style_builders import (create_simple_styles,
                                                       create_text_style)
            style = DucTableStyle(
                    header_row_style=DucTableCellStyle(
                    text_style=create_text_style(),
                    margins=Margins(top=0.0, right=0.0, bottom=0.0, left=0.0),
                    alignment=TABLE_CELL_ALIGNMENT.MIDDLE_LEFT
                ),
                data_row_style=DucTableCellStyle(
                    text_style=create_text_style(),
                    margins=Margins(top=0.0, right=0.0, bottom=0.0, left=0.0),
                    alignment=TABLE_CELL_ALIGNMENT.MIDDLE_LEFT
                ),
                data_column_style=DucTableCellStyle(
                    text_style=create_text_style(),
                    margins=Margins(top=0.0, right=0.0, bottom=0.0, left=0.0),
                    alignment=TABLE_CELL_ALIGNMENT.MIDDLE_LEFT
                ),
                flow_direction=TABLE_FLOW_DIRECTION.DOWN
            )
        
        # Extract column_order and row_order from the provided columns and rows
        columns_list = self.extra.get('columns', [])
        rows_list = self.extra.get('rows', [])
        column_order = [col.key for col in columns_list]
        row_order = [row.key for row in rows_list]

        element_params = {
            "column_order": column_order,
            "row_order": row_order,
            "columns": columns_list,
            "rows": rows_list,
            "cells": self.extra.get('cells', []),
            "style": style,
            "header_row_count": self.extra.get('header_row_count', 1),
            "auto_size": self.extra.get('auto_size', DucTableAutoSize(columns=True, rows=True)),
        }
        return _create_element_wrapper(
            DucTableElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Frame element builder
class FrameElementBuilder(ElementSpecificBuilder):
    def with_stack_base(self, stack_base: Optional[DucStackBase]):
        self.extra["stack_base"] = stack_base
        return self

    def with_clip(self, clip: bool):
        self.extra["clip"] = clip
        return self

    def with_label_visible(self, label_visible: bool):
        self.extra["label_visible"] = label_visible
        return self

    def with_standard_override(self, standard_override: Optional["Standard"]):
        self.extra["standard_override"] = standard_override
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "stack_base": self.extra.get('stack_base'),
            "clip": self.extra.get('clip', False),
            "label_visible": self.extra.get('label_visible', True),
            "standard_override": self.extra.get('standard_override'),
        }
        return _create_element_wrapper(
            DucFrameElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Plot element builder
class PlotElementBuilder(ElementSpecificBuilder):
    def with_margins(self, margins: Optional[Margins]):
        self.extra["margins"] = margins
        return self

    def with_style(self, style: Optional[DucPlotStyle]):
        self.extra["style"] = style
        return self

    def with_stack_base(self, stack_base: Optional[DucStackBase]):
        self.extra["stack_base"] = stack_base
        return self

    def with_clip(self, clip: bool):
        self.extra["clip"] = clip
        return self

    def with_label_visible(self, label_visible: bool):
        self.extra["label_visible"] = label_visible
        return self

    def with_standard_override(self, standard_override: Optional["Standard"]):
        self.extra["standard_override"] = standard_override
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "stack_base": self.extra.get('stack_base'),
            "clip": self.extra.get('clip', False),
            "label_visible": self.extra.get('label_visible', True),
            "standard_override": self.extra.get('standard_override'),
            "style": self.extra.get('style'),
            "margins": self.extra.get('margins')
        }
        return _create_element_wrapper(
            DucPlotElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Viewport element builder
class ViewportElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: List[tuple]):
        self.extra["points"] = points
        return self

    def with_view(self, view: DucView):
        self.extra["view"] = view
        return self

    def with_view_scale(self, scale: float):
        self.extra["scale"] = scale
        return self

    def with_viewport_style(self, style: Optional[DucViewportStyle]):
        self.extra["style"] = style
        return self

    def with_stack_base(self, stack_base: Optional[DucStackBase]):
        self.extra["stack_base"] = stack_base
        return self

    def with_standard_override(self, standard_override: Optional["Standard"]):
        self.extra["standard_override"] = standard_override
        return self

    def with_shade_plot(self, shade_plot: Optional[VIEWPORT_SHADE_PLOT]):
        self.extra["shade_plot"] = shade_plot
        return self

    def with_frozen_group_ids(self, frozen_group_ids: Optional[List[str]]):
        self.extra["frozen_group_ids"] = frozen_group_ids
        return self

    def with_start_binding(self, start_binding: Optional[DucPointBinding]):
        self.extra["start_binding"] = start_binding
        return self

    def with_end_binding(self, end_binding: Optional[DucPointBinding]):
        self.extra["end_binding"] = end_binding
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "points": self.extra.get('points', []),
            "start_binding": self.extra.get('start_binding'),
            "end_binding": self.extra.get('end_binding'),
            "stack_base": self.extra.get('stack_base'),
            "style": self.extra.get('style'),
            "view": self.extra.get('view'),
            "scale": self.extra.get('scale', 1.0),
            "shade_plot": self.extra.get('shade_plot'),
            "frozen_group_ids": self.extra.get('frozen_group_ids', []),
            "standard_override": self.extra.get('standard_override')
        }
        return _create_element_wrapper(
            DucViewportElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# FreeDraw element builder
class FreeDrawElementBuilder(ElementSpecificBuilder):
    def with_points(self, points: list):
        self.extra["points"] = points
        return self

    def with_pressures(self, pressures: list):
        self.extra["pressures"] = pressures
        return self

    def with_size_thickness(self, size: float):
        self.extra["size"] = size
        return self

    def with_thinning(self, thinning: float):
        self.extra["thinning"] = thinning
        return self

    def with_smoothing(self, smoothing: float):
        self.extra["smoothing"] = smoothing
        return self

    def with_streamline(self, streamline: float):
        self.extra["streamline"] = streamline
        return self

    def with_easing(self, easing: str):
        self.extra["easing"] = easing
        return self

    def with_simulate_pressure(self, simulate_pressure: bool):
        self.extra["simulate_pressure"] = simulate_pressure
        return self

    def with_start_cap(self, cap: bool):
        self.extra["start_cap"] = cap
        return self

    def with_start_taper(self, taper: float):
        self.extra["start_taper"] = taper
        return self

    def with_start_easing(self, easing: str):
        self.extra["start_easing"] = easing
        return self

    def with_end_cap(self, cap: bool):
        self.extra["end_cap"] = cap
        return self

    def with_end_taper(self, taper: float):
        self.extra["end_taper"] = taper
        return self

    def with_end_easing(self, easing: str):
        self.extra["end_easing"] = easing
        return self

    def with_last_committed_point(self, last_committed_point: Optional[DucPoint]):
        self.extra["last_committed_point"] = last_committed_point
        return self

    def with_svg_path(self, svg_path: Optional[str]):
        self.extra["svg_path"] = svg_path
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        
        start_cap = self.extra.get('start_cap')
        start_taper = self.extra.get('start_taper')
        start_easing = self.extra.get('start_easing')
        start_ends = None
        if start_cap is not None or start_taper is not None or start_easing is not None:
            start_ends = DucFreeDrawEnds(
                cap=start_cap if start_cap is not None else True,  # Default to True if not provided
                taper=start_taper if start_taper is not None else 0.0,
                easing=start_easing if start_easing is not None else "linear"
            )

        end_cap = self.extra.get('end_cap')
        end_taper = self.extra.get('end_taper')
        end_easing = self.extra.get('end_easing')
        end_ends = None
        if end_cap is not None or end_taper is not None or end_easing is not None:
            end_ends = DucFreeDrawEnds(
                cap=end_cap if end_cap is not None else True,  # Default to True if not provided
                taper=end_taper if end_taper is not None else 0.0,
                easing=end_easing if end_easing is not None else "linear"
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
        return _create_element_wrapper(
            DucFreeDrawElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Doc element builder
class DocElementBuilder(ElementSpecificBuilder):
    def with_text(self, text: str):
        self.extra["text"] = text
        return self

    def with_doc_style(self, style: Optional[DucDocStyle]):
        self.extra["style"] = style
        return self

    def with_columns_layout(self, columns: Optional[ColumnLayout]):
        self.extra["columns"] = columns
        return self

    def with_auto_resize(self, auto_resize: bool):
        self.extra["auto_resize"] = auto_resize
        return self

    def with_flow_direction(self, flow_direction: Optional[TEXT_FLOW_DIRECTION]):
        self.extra["flow_direction"] = flow_direction
        return self

    def with_dynamic(self, dynamic: Optional[List[DucTextDynamicPart]]):
        self.extra["dynamic"] = dynamic
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "style": self.extra.get('style'),
            "text": self.extra.get('text', ""),
            "dynamic": self.extra.get('dynamic', []),
            "columns": self.extra.get('columns'),
            "auto_resize": self.extra.get('auto_resize', False),
            "flow_direction": self.extra.get('flow_direction')
        }
        return _create_element_wrapper(
            DucDocElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Dimension builders
class LinearDimensionBuilder(ElementSpecificBuilder):
    def with_origin1(self, origin1: GeometricPoint):
        self.extra["origin1"] = origin1
        return self

    def with_origin2(self, origin2: GeometricPoint):
        self.extra["origin2"] = origin2
        return self

    def with_location(self, location: GeometricPoint):
        self.extra["location"] = location
        return self

    def with_dimension_style(self, style: Optional[DucDimensionStyle]):
        self.extra["style"] = style
        return self

    def with_text_override(self, text_override: Optional[str]):
        self.extra["text_override"] = text_override
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "style": self.extra.get('style'),
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "dimension_type": self.extra.get('dimension_type', DIMENSION_TYPE.LINEAR),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "text_override": self.extra.get('text_override'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data')
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class AlignedDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.ALIGNED,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class AngularDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.ANGULAR,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class RadiusDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.RADIUS,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class DiameterDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.DIAMETER,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class ArcLengthDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.ARC_LENGTH,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class CenterMarkDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.CENTER_MARK,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class RotatedDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.ROTATED,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class SpacingDimensionBuilder(LinearDimensionBuilder):
    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.SPACING,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class ContinueDimensionBuilder(LinearDimensionBuilder):
    def with_continue_from_dimension_id(self, continue_from_dimension_id: str):
        self.extra["continue_from_dimension_id"] = continue_from_dimension_id
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.CONTINUE,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class BaselineDimensionBuilder(LinearDimensionBuilder):
    def with_base_dimension_id(self, base_dimension_id: str):
        self.extra["base_dimension_id"] = base_dimension_id
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.BASELINE,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


class JoggedLinearDimensionBuilder(LinearDimensionBuilder):
    def with_jog_x(self, jog_x: float):
        self.extra["jog_x"] = jog_x
        return self

    def with_jog_y(self, jog_y: float):
        self.extra["jog_y"] = jog_y
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin1": self.extra.get('origin1'),
            "origin2": self.extra.get('origin2'),
            "location": self.extra.get('location'),
            "dimension_type": DIMENSION_TYPE.JOGGED_LINEAR,
            "oblique_angle": self.extra.get('oblique_angle', 0.0),
            "jog_x": self.extra.get('jog_x'),
            "jog_y": self.extra.get('jog_y'),
            "style": self.extra.get('style'),
            "text_override": self.extra.get('text_override'),
            "ordinate_axis": self.extra.get('ordinate_axis'),
            "bindings": self.extra.get('bindings'),
            "baseline_data": self.extra.get('baseline_data'),
            "continue_data": self.extra.get('continue_data'),
        }
        return _create_element_wrapper(
            DucDimensionElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Leader element builder
class LeaderElementBuilder(ElementSpecificBuilder):
    def with_content_anchor_x(self, content_anchor_x: float):
        self.extra["content_anchor_x"] = content_anchor_x
        return self

    def with_content_anchor_y(self, content_anchor_y: float):
        self.extra["content_anchor_y"] = content_anchor_y
        return self

    def with_content(self, content: Optional[LeaderContent]):
        self.extra["content"] = content
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "points": self.extra.get('points', []),
            "start_binding": self.extra.get('start_binding'),
            "end_binding": self.extra.get('end_binding'),
            "style": self.extra.get('style'),
            "content_anchor_x": self.extra.get('content_anchor_x', 0.0),
            "content_anchor_y": self.extra.get('content_anchor_y', 0.0),
            "content": self.extra.get('content')
        }
        # Create leader style with default dogleg
        leader_style = element_params.get('style')
        if leader_style is None:
            from ducpy.builders.style_builders import (create_simple_styles,
                                                       create_text_style)
            text_style = create_text_style()
            leader_style = DucLeaderStyle(
                text_style=text_style,
                text_attachment=VERTICAL_ALIGN.TOP,
                block_attachment=BLOCK_ATTACHMENT.CENTER_EXTENTS,
                dogleg=self.extra.get('dogleg', 0.0), # Set default dogleg here
                heads_override=None
            )
        element_params['style'] = leader_style # Update element_params with the new style
        return _create_element_wrapper(
            DucLeaderElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Feature Control Frame element builder
class FeatureControlFrameElementBuilder(ElementSpecificBuilder):
    def with_segments(self, segments: List[FCFSegmentRow]):
        self.extra["rows"] = segments
        return self

    def with_frame_modifiers(self, frame_modifiers: Optional[FCFFrameModifiers]):
        self.extra["frame_modifiers"] = frame_modifiers
        return self

    def with_leader_element_id(self, leader_element_id: Optional[str]):
        self.extra["leader_element_id"] = leader_element_id
        return self

    def with_datum_definition(self, datum_definition: Optional[FCFDatumDefinition]):
        self.extra["datum_definition"] = datum_definition
        return self

    def with_style(self, style: Optional[DucFeatureControlFrameStyle]):
        self.extra["style"] = style
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "style": self.extra.get('style', DucFeatureControlFrameStyle(
                text_style=create_text_style(),
                layout=FCFLayoutStyle(padding=2.0, segment_spacing=1.0, row_spacing=1.0),
                symbols=FCFSymbolStyle(scale=1.0),
                datum_style=FCFDatumStyle(bracket_style=None)
            )),
            "rows": self.extra.get('rows', []),
            "frame_modifiers": self.extra.get('frame_modifiers'),
            "leader_element_id": self.extra.get('leader_element_id'),
            "datum_definition": self.extra.get('datum_definition')
        }
        return _create_element_wrapper(
            DucFeatureControlFrameElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )





# Mermaid element builder
class MermaidElementBuilder(ElementSpecificBuilder):
    def with_source(self, source: str):
        self.extra["source"] = source
        return self

    def with_theme(self, theme: Optional[str]):
        self.extra["theme"] = theme
        return self

    def with_svg_path(self, svg_path: Optional[str]):
        self.extra["svg_path"] = svg_path
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "source": self.extra.get('source', ''),
            "theme": self.extra.get('theme'),
            "svg_path": self.extra.get('svg_path')
        }
        return _create_element_wrapper(
            DucMermaidElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Embeddable element builder
class EmbeddableElementBuilder(ElementSpecificBuilder):
    def with_link(self, link: str):
        self.extra["link"] = link
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        # Set the link property on the base params if provided
        if 'link' in self.extra:
            base_params['link'] = self.extra['link']
        element_params = {}
        return _create_element_wrapper(
            DucEmbeddableElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


# Xray element builder
class XrayElementBuilder(ElementSpecificBuilder):
    def with_origin_x(self, origin_x: float):
        self.extra["origin_x"] = origin_x
        return self

    def with_origin_y(self, origin_y: float):
        self.extra["origin_y"] = origin_y
        return self

    def with_direction_x(self, direction_x: float):
        self.extra["direction_x"] = direction_x
        return self

    def with_direction_y(self, direction_y: float):
        self.extra["direction_y"] = direction_y
        return self

    def with_color(self, color: str):
        self.extra["color"] = color
        return self

    def with_start_from_origin(self, start_from_origin: bool):
        self.extra["start_from_origin"] = start_from_origin
        return self

    def build(self) -> ElementWrapper:
        base_params = self.base.__dict__.copy()
        element_params = {
            "origin_x": self.extra.get("origin_x", 0.0),
            "origin_y": self.extra.get("origin_y", 0.0),
            "direction_x": self.extra.get("direction_x", 1.0),
            "direction_y": self.extra.get("direction_y", 0.0),
            "color": self.extra.get("color", "#FF0000"),
            "start_from_origin": self.extra.get("start_from_origin", False),
        }
        return _create_element_wrapper(
            DucXRayElement,
            base_params,
            element_params,
            self.extra.get('explicit_properties_override')
        )


