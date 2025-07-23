"""
Helper functions for creating DUC elements with a user-friendly API.
"""
from math import pi
from typing import List, Optional, Union, TYPE_CHECKING
import uuid
import time

if TYPE_CHECKING:
    from ..classes.StandardsClass import Standard
    import numpy as np
from ..classes.ElementsClass import (
    DucRectangleElement, DucEllipseElement, DucPolygonElement,
    DucElementBase, DucElementStylesBase, ElementWrapper, BoundElement,
    DucLinearElement, DucLinearElementBase, DucPoint, DucLine, 
    DucLineReference, GeometricPoint, DucPointBinding, DucPath,
    PointBindingPoint, DucHead, ElementStroke, ElementBackground,
    DucArrowElement, DucTextElement, DucFrameElement, DucPlotElement,
    DucViewportElement, DucStackElementBase, DucStackBase, DucStackLikeStyles,
    PlotLayout, DucView, DucPlotStyle, DucViewportStyle, Margins,
    DucFreeDrawElement, DucBlockAttributeDefinition, DucBlockAttributeDefinitionEntry,
    DucBlock, DucBlockDuplicationArray, StringValueEntry, DucBlockInstanceElement,
    DucTableColumn, DucTableRow, DucTableCell, DucTableCellSpan, DucTableAutoSize,
    DucTableElement, DucTableStyle, DucTableCellStyle, DucTextStyle, DucLayer, DucLayerOverrides,
    DucRegion, DucDocElement, DucDocStyle, ParagraphFormatting, StackFormat, StackFormatProperties,
    TextColumn, ColumnLayout, DucTextDynamicPart, DucDimensionElement, DucDimensionStyle,
    DimensionDefinitionPoints, DimensionBindings, DimensionLineStyle, DimensionExtLineStyle,
    DimensionSymbolStyle, DimensionToleranceStyle, DimensionFitStyle, DimensionBaselineData,
    DimensionContinueData, DucLeaderElement, LeaderContent, LeaderTextBlockContent, LeaderBlockContent,
    DucFeatureControlFrameElement, ToleranceClause, FeatureControlFrameSegment, DatumReference,
    FCFFrameModifiers, FCFBetweenModifier, FCFProjectedZoneModifier, FCFDatumDefinition, FCFSegmentRow
)
from .style_builders import create_simple_styles, create_text_style, create_paragraph_formatting, create_stack_format_properties, create_stack_format, create_doc_style, create_text_column, create_column_layout
from ducpy.utils import generate_random_id, DEFAULT_SCOPE, DEFAULT_STROKE_COLOR, DEFAULT_FILL_COLOR
from ducpy.utils.rand_utils import random_versioning
from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ducpy.Duc.TABLE_CELL_ALIGNMENT import TABLE_CELL_ALIGNMENT
from ducpy.Duc.TABLE_FLOW_DIRECTION import TABLE_FLOW_DIRECTION
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ducpy.Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ducpy.Duc.TEXT_FLOW_DIRECTION import TEXT_FLOW_DIRECTION
from ducpy.Duc.COLUMN_TYPE import COLUMN_TYPE
from ducpy.Duc.STACKED_TEXT_ALIGN import STACKED_TEXT_ALIGN
from ducpy.Duc.DIMENSION_TYPE import DIMENSION_TYPE
from ducpy.Duc.AXIS import AXIS
from ducpy.Duc.GDT_SYMBOL import GDT_SYMBOL
from ducpy.Duc.LEADER_CONTENT_TYPE import LEADER_CONTENT_TYPE
from ducpy.Duc.TOLERANCE_ZONE_TYPE import TOLERANCE_ZONE_TYPE
from ducpy.Duc.MATERIAL_CONDITION import MATERIAL_CONDITION
from ducpy.Duc.FEATURE_MODIFIER import FEATURE_MODIFIER

import random
import time

def create_element_base(
    x=0.0,
    y=0.0,
    width=1.0,
    height=1.0,
    angle=0.0,
    styles=None,
    id=None,
    label="",
    scope=DEFAULT_SCOPE,
    locked=False,
    is_visible=True,
    z_index=0.0,
    description="",
    group_ids=None,
    region_ids=None,
    layer_id="",
    frame_id="",
    bound_elements=None,
    link="",
    custom_data="",
    is_plot=False,
    is_annotative=False,
    is_deleted=False,
    index=None,
) -> DucElementBase:
    """
    Create a modular DucElementBase with all required versioning and random properties.
    """
    if id is None:
        id = generate_random_id(16)
    if styles is None:
        styles = create_simple_styles()
    
    # Use random_versioning utility
    versioning = random_versioning()
    
    group_ids = group_ids or []
    region_ids = region_ids or []
    bound_elements = bound_elements or []
    return DucElementBase(
        id=id,
        styles=styles,
        x=x,
        y=y,
        width=width,
        height=height,
        angle=angle,
        scope=scope,
        label=label,
        description=description,
        is_visible=is_visible,
        seed=versioning["seed"],
        version=versioning["version"],
        version_nonce=versioning["version_nonce"],
        updated=versioning["updated"],
        index=index,
        is_plot=is_plot,
        is_annotative=is_annotative,
        is_deleted=is_deleted,
        group_ids=group_ids,
        region_ids=region_ids,
        layer_id=layer_id,
        frame_id=frame_id,
        bound_elements=bound_elements,
        z_index=z_index,
        link=link,
        locked=locked,
        custom_data=custom_data,
    )


def _apply_base_overrides(base: DucElementBase, explicit_properties_override: Optional[dict]) -> None:
    """
    Apply explicit property overrides to a DucElementBase instance.
    """
    if explicit_properties_override:
        for k, v in explicit_properties_override.get("base", {}).items():
            setattr(base, k, v)

def _create_element_wrapper(element_class, base_params: dict, element_params: dict, 
                           explicit_properties_override: Optional[dict] = None) -> ElementWrapper:
    """
    Generic helper for creating element wrappers with common pattern.
    
    Args:
        element_class: The element class to instantiate
        base_params: Parameters for creating the base element
        element_params: Parameters specific to the element
        explicit_properties_override: Optional overrides
        
    Returns:
        ElementWrapper: Wrapped element
    """
    base = create_element_base(**base_params)
    _apply_base_overrides(base, explicit_properties_override)
    
    final_element_params = {"base": base, **element_params}
    if explicit_properties_override and "element" in explicit_properties_override:
        final_element_params.update(explicit_properties_override["element"])
    
    element = element_class(**final_element_params)
    return ElementWrapper(element=element)


def create_rectangle(
    x: float,
    y: float,
    width: float,
    height: float,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a rectangle element with a clean, modular API.
    """
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    
    return _create_element_wrapper(
        DucRectangleElement, 
        base_params, 
        {}, 
        explicit_properties_override
    )


def create_ellipse(
    x: float,
    y: float,
    width: float,
    height: float,
    ratio: float = 1.0,
    start_angle: float = 0.0,
    end_angle: float = 2.0*pi,
    show_aux_crosshair: bool = False,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create an ellipse element with a clean, modular API.
    """
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    
    element_params = {
        "ratio": ratio,
        "start_angle": start_angle,
        "end_angle": end_angle,
        "show_aux_crosshair": show_aux_crosshair,
    }
    
    return _create_element_wrapper(
        DucEllipseElement, 
        base_params, 
        element_params, 
        explicit_properties_override
    )


def create_polygon(
    x: float,
    y: float,
    width: float,
    height: float,
    sides: int = 6,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a polygon element with a clean, modular API.
    """
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    
    element_params = {"sides": sides}
    
    return _create_element_wrapper(
        DucPolygonElement, 
        base_params, 
        element_params, 
        explicit_properties_override
    )


def create_linear_element(
    points: List[tuple],
    lines: Optional[List[DucLine]] = None,
    bezier_handles: Optional[dict] = None,
    line_definitions: Optional[List[dict]] = None,
    path_overrides: Optional[List[DucPath]] = None,
    last_committed_point: Optional[DucPoint] = None,
    start_binding: Optional[DucPointBinding] = None,
    end_binding: Optional[DucPointBinding] = None,
    wipeout_below: bool = False,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a linear element (line, polyline) with a clean, modular API supporting bezier curves.
    
    Args:
        points: List of (x, y) tuples defining the line path.
        lines: Optional list of DucLine objects. If None, creates lines connecting consecutive points.
               If `line_definitions` is provided, this parameter is ignored.
        bezier_handles: Optional dict mapping line indices to handle coordinates for curves.
                        Format: {line_index: {'start': (x, y), 'end': (x, y)}}.
                        This is used if `lines` or `line_definitions` are not provided.
        line_definitions: Optional list of dicts defining connections between points, with optional
                          bezier handles. Format: [{'start': 0, 'end': 1, 'start_handle': (x, y), 'end_handle': (x, y)}, ...].
                          If provided, this takes precedence over `lines` and `bezier_handles`.
        path_overrides: Optional list of DucPath objects for styling line segments.
        last_committed_point: Optional last committed point. If None, uses the last point.
        start_binding: Optional start point binding.
        end_binding: Optional end point binding.
        wipeout_below: Whether this linear element wipes out elements below it.
        styles: Element styles (defaults to transparent).
        id: Unique identifier (auto-generated if None).
        label: Human-readable label.
        scope: Units ("mm", "px", etc.).
        locked: Whether element is locked.
        is_visible: Whether element is visible.
        z_index: Layering order.
        explicit_properties_override: Optional dict to override properties.
        
    Returns:
        ElementWrapper: Wrapped linear element ready for serialization.
        
    Examples:
        # Simple line from (0,0) to (100,50)
        create_linear_element([(0, 0), (100, 50)], 
                            styles=create_stroke_style(create_solid_content("#000000")))
        
        # Curved line with bezier handles
        create_linear_element(
            [(0, 0), (100, 50)], 
            bezier_handles={0: {'start': (25, -25), 'end': (75, 75)}}
        )
        
        # Complex path with multiple segments and custom styling
        create_linear_element(
            [(0, 0), (50, 25), (100, 0), (150, 50)],
            path_overrides=[create_path_override([0, 1], stroke_style, fill_style)]
        )

        # Complex shape using line_definitions
        points = [(0, 0), (50, 0), (100, 25), (75, 75), (25, 50)]
        line_defs = [
            {'start': 0, 'end': 1},  # Straight line
            {'start': 1, 'end': 2, 'start_handle': (75, -10), 'end_handle': (75, 35)},  # Curved
            {'start': 2, 'end': 3, 'end_handle': (50, 90)},  # Curved end
            {'start': 3, 'end': 4, 'start_handle': (60, 60)},  # Curved start
            {'start': 4, 'end': 0}   # Close the shape
        ]
        create_linear_element(points=points, line_definitions=line_defs)
    """
    if not points or len(points) < 2:
        raise ValueError("Linear element requires at least 2 points")
    
    if id is None:
        id = f"linear_{uuid.uuid4().hex[:8]}"
    
    if styles is None:
        styles = create_simple_styles()
    
    # Calculate bounding box from points
    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    
    # Use first point as origin
    origin_x, origin_y = points[0]
    width = max_x - min_x if max_x != min_x else 1.0
    height = max_y - min_y if max_y != min_y else 1.0
    
    current_time = int(time.time() * 1000)
    base_params = {
        "id": id,
        "styles": styles,
        "x": origin_x,
        "y": origin_y,
        "width": width,
        "height": height,
        "angle": 0.0,
        "scope": scope,
        "label": label,
        "description": "",
        "is_visible": is_visible,
        "seed": hash(id) % 2147483647,
        "version": 1,
        "version_nonce": 0,
        "updated": current_time,
        "index": None,
        "is_plot": False,
        "is_annotative": False,
        "is_deleted": False,
        "group_ids": [],
        "region_ids": [],
        "layer_id": "",
        "frame_id": "",
        "bound_elements": [],
        "z_index": z_index,
        "link": "",
        "locked": locked,
        "custom_data": ""
    }
    
    # Apply explicit property overrides if provided
    if explicit_properties_override:
        known_base_params = {
            "id", "label", "scope", "locked", "is_visible", "is_deleted",
            "group_ids", "region_ids", "layer_id", "frame_id", "bound_elements", 
            "z_index", "link", "custom_data", "x", "y", "width", "height", "angle"
        }
        
        if 'base' in explicit_properties_override:
            for key, value in explicit_properties_override['base'].items():
                if key in base_params:
                    base_params[key] = value
        else:
            for key, value in explicit_properties_override.items():
                if key in base_params:
                    base_params[key] = value
    
    base = DucElementBase(**base_params)
    
    # Convert points to DucPoint objects
    duc_points = [DucPoint(x=float(x), y=float(y)) for x, y in points]
    
    # Prioritize line_definitions if provided, otherwise use bezier_handles or default to consecutive lines
    if line_definitions is not None:
        lines = []
        for line_def in line_definitions:
            start_idx = line_def['start']
            end_idx = line_def['end']
            start_handle = line_def.get('start_handle')
            end_handle = line_def.get('end_handle')
            
            line = create_bezier_line(start_idx, end_idx, start_handle, end_handle)
            lines.append(line)
    elif lines is None: # Only generate lines if not provided by either parameter
        lines = []
        for i in range(len(duc_points) - 1):
            start_handle = None
            end_handle = None
            
            # Add bezier handles if provided
            if bezier_handles and i in bezier_handles:
                handles = bezier_handles[i]
                if 'start' in handles:
                    start_handle = GeometricPoint(x=float(handles['start'][0]), y=float(handles['start'][1]))
                if 'end' in handles:
                    end_handle = GeometricPoint(x=float(handles['end'][0]), y=float(handles['end'][1]))
            
            start_ref = DucLineReference(index=i, handle=start_handle)
            end_ref = DucLineReference(index=i + 1, handle=end_handle)
            lines.append(DucLine(start=start_ref, end=end_ref))
    
    # Use provided path_overrides or default to empty list
    if path_overrides is None:
        path_overrides = []
    
    # Create linear base
    linear_base = DucLinearElementBase(
        base=base,
        points=duc_points,
        lines=lines,
        path_overrides=path_overrides,
        last_committed_point=last_committed_point,
        start_binding=start_binding,
        end_binding=end_binding
    )
    
    # Create linear element
    linear_params = {"linear_base": linear_base, "wipeout_below": wipeout_below}
    
    # Apply element-specific overrides if they exist
    if explicit_properties_override and 'element' in explicit_properties_override:
        linear_params.update(explicit_properties_override['element'])
        
    linear_element = DucLinearElement(**linear_params)
    return ElementWrapper(element=linear_element)


def create_path_override(
    line_indices: List[int],
    stroke: Optional[ElementStroke] = None,
    background: Optional[ElementBackground] = None
) -> DucPath:
    """
    Create a path override for styling specific segments of a linear element.
    
    Args:
        line_indices: List of line indices to apply this styling to
        stroke: Stroke styling for the path segment
        background: Background styling for the path segment
        
    Returns:
        DucPath: Path override object
    """
    if not line_indices:
        raise ValueError("Path override requires at least one line index")
    
    # Use default styling if not provided
    if stroke is None:
        from .style_builders import create_solid_content, create_stroke
        stroke = create_stroke(create_solid_content("#000000"))
    
    if background is None:
        from .style_builders import create_solid_content, create_background  
        background = create_background(create_solid_content("#FFFFFF", opacity=0))
    
    return DucPath(
        line_indices=line_indices,
        stroke=stroke,
        background=background
    )


def create_bezier_line(
    start_index: int,
    end_index: int, 
    start_handle: Optional[tuple] = None,
    end_handle: Optional[tuple] = None
) -> DucLine:
    """
    Create a bezier line connecting two points with optional control handles.
    
    Args:
        start_index: Index of the starting point
        end_index: Index of the ending point
        start_handle: Optional (x, y) tuple for the start control handle
        end_handle: Optional (x, y) tuple for the end control handle
        
    Returns:
        DucLine: Line with bezier handles
        
    Examples:
        # Curved line from point 0 to point 1
        bezier_line = create_bezier_line(0, 1, (25, -25), (75, 75))
    """
    start_handle_point = None
    end_handle_point = None
    
    if start_handle:
        start_handle_point = GeometricPoint(x=float(start_handle[0]), y=float(start_handle[1]))
    
    if end_handle:
        end_handle_point = GeometricPoint(x=float(end_handle[0]), y=float(end_handle[1]))
    
    start_ref = DucLineReference(index=start_index, handle=start_handle_point)
    end_ref = DucLineReference(index=end_index, handle=end_handle_point)
    
    return DucLine(start=start_ref, end=end_ref)

def create_arrow_element(
    points: List[tuple],
    start_binding: Optional[DucPointBinding] = None,
    end_binding: Optional[DucPointBinding] = None,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create an arrow element. This is a specialized linear element.
    """
    if id is None:
        id = f"arrow_{uuid.uuid4().hex[:8]}"

    # Create the base linear element structure
    linear_element_wrapper = create_linear_element(
        points=points,
        start_binding=start_binding,
        end_binding=end_binding,
        styles=styles,
        id=id,
        label=label,
        scope=scope,
        locked=locked,
        is_visible=is_visible,
        z_index=z_index,
        explicit_properties_override=explicit_properties_override
    )
    
    linear_base = linear_element_wrapper.element.linear_base

    # Create the arrow element from the linear base
    arrow = DucArrowElement(
        linear_base=linear_base,
        elbowed=False  # Default value, can be exposed as an argument if needed
    )
    
    return ElementWrapper(element=arrow)

def create_point_binding(element_id: str, focus: float = 0.5, gap: float = 0.0) -> DucPointBinding:
    """
    Creates a binding for a point on a linear element to another element.
    """
    return DucPointBinding(
        element_id=element_id,
        focus=focus,
        gap=gap
    )

def create_image_element(
    x: float,
    y: float,
    width: float,
    height: float,
    scale: Optional["np.ndarray"] = None,
    status=None,
    file_id: Optional[str] = None,
    crop=None,
    filter=None,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create an image element (DucImageElement) in a modular way.
    """
    import numpy as np
    base_params = {
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "styles": styles,
        "id": id,
        "label": label,
        "scope": scope,
        "locked": locked,
        "is_visible": is_visible,
        "z_index": z_index
    }
    element_params = {
        "scale": scale if scale is not None else np.array([1.0, 1.0]),
        "status": status,
        "file_id": file_id,
        "crop": crop,
        "filter": filter
    }
    from ..classes.ElementsClass import DucImageElement
    return _create_element_wrapper(
        DucImageElement,
        base_params,
        element_params,
        explicit_properties_override
    )

def create_text_element(
    x: float,
    y: float,
    text: str,
    width: float = 100,
    height: float = 20,
    text_style: Optional[DucTextStyle] = None,
    auto_resize: bool = False,
    dynamic: Optional[List[DucTextDynamicPart]] = None,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a text element with optional text styling.
    
    Args:
        x, y: Position
        text: Text content
        width, height: Size
        text_style: Optional text styling (from create_text_style())
        auto_resize: Whether to auto-resize based on content
        dynamic: Dynamic text parts
        styles: Element styles
        Other standard element parameters...
    """
    if id is None:
        id = f"text_{uuid.uuid4().hex[:8]}"

    if styles is None:
        styles = create_simple_styles()
    
    if dynamic is None:
        dynamic = []

    # Use random_versioning utility
    versioning = random_versioning()
    
    base_params = {
        "id": id,
        "styles": styles,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "angle": 0.0,
        "scope": scope,
        "label": label,
        "description": "",
        "is_visible": is_visible,
        "seed": versioning["seed"],
        "version": versioning["version"],
        "version_nonce": versioning["version_nonce"],
        "updated": versioning["updated"],
        "index": None,
        "is_plot": False,
        "is_annotative": False,
        "is_deleted": False,
        "group_ids": [],
        "region_ids": [],
        "layer_id": "",
        "frame_id": "",
        "bound_elements": [],
        "z_index": z_index,
        "link": "",
        "locked": locked,
        "custom_data": ""
    }

    if explicit_properties_override and 'base' in explicit_properties_override:
        base_params.update(explicit_properties_override['base'])

    base = DucElementBase(**base_params)

    text_params = {
        "base": base,
        "style": text_style,
        "text": text,
        "original_text": text,
        "dynamic": dynamic,
        "auto_resize": auto_resize,
        "container_id": None
    }

    if explicit_properties_override and 'element' in explicit_properties_override:
        text_params.update(explicit_properties_override['element'])

    text_element = DucTextElement(**text_params)
    return ElementWrapper(element=text_element)


from ducpy.utils.mutate_utils import recursive_mutate

def mutate_element(el, **kwargs):
    """
    Mutate any property of an element (ElementWrapper) using keyword arguments.
    Recursively traverses all nested dataclasses and sets matching properties.
    Always mutates seed, updated, version, version_nonce.
    Example: mutate_element(el, x=..., label=..., points=[...], style=..., ...)
    """
    # Always update versioning props
    versioning = random_versioning()
    kwargs.update(versioning)
    recursive_mutate(el.element, kwargs)
    return el


# Stack-based element creation functions

def create_stack_base(
    label: str = "",
    is_collapsed: bool = False,
    is_plot: bool = False,
    is_visible: bool = True,
    locked: bool = False,
    opacity: float = 1.0,
    labeling_color: str = "#000000",
    description: str = ""
) -> DucStackBase:
    """
    Create a stack base for stack-like elements.
    """
    styles = DucStackLikeStyles(
        opacity=opacity,
        labeling_color=labeling_color
    )
    
    return DucStackBase(
        label=label,
        is_collapsed=is_collapsed,
        is_plot=is_plot,
        is_visible=is_visible,
        locked=locked,
        styles=styles,
        description=description
    )

def create_stack_element_base(
    x: float,
    y: float, 
    width: float,
    height: float,
    stack_base: Optional[DucStackBase] = None,
    clip: bool = False,
    label_visible: bool = True,
    standard_override: Optional["Standard"] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> DucStackElementBase:
    """
    Create a stack element base for frame and plot elements.
    """
    if stack_base is None:
        stack_base = create_stack_base(label=label, is_visible=is_visible, locked=locked)
    
    base = create_element_base(
        x=x, y=y, width=width, height=height, angle=angle,
        styles=styles, id=id, label=label, scope=scope,
        locked=locked, is_visible=is_visible, z_index=z_index
    )
    
    _apply_base_overrides(base, explicit_properties_override)
    
    return DucStackElementBase(
        base=base,
        stack_base=stack_base,
        clip=clip,
        label_visible=label_visible,
        standard_override=standard_override
    )

def create_frame_element(
    x: float,
    y: float,
    width: float,
    height: float,
    stack_base: Optional[DucStackBase] = None,
    clip: bool = False,
    label_visible: bool = True,
    standard_override: Optional["Standard"] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a frame element.
    """
    stack_element_base = create_stack_element_base(
        x=x, y=y, width=width, height=height,
        stack_base=stack_base, clip=clip, label_visible=label_visible,
        standard_override=standard_override, angle=angle, styles=styles,
        id=id, label=label, scope=scope, locked=locked,
        is_visible=is_visible, z_index=z_index,
        explicit_properties_override=explicit_properties_override
    )
    
    frame = DucFrameElement(stack_element_base=stack_element_base)
    return ElementWrapper(element=frame)

def create_plot_element(
    x: float,
    y: float,
    width: float,
    height: float,
    margins: Optional[Margins] = None,
    style: Optional[DucPlotStyle] = None,
    stack_base: Optional[DucStackBase] = None,
    clip: bool = False,
    label_visible: bool = True,
    standard_override: Optional["Standard"] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a plot element.
    """
    if margins is None:
        margins = Margins(top=0.0, right=0.0, bottom=0.0, left=0.0)
    
    if style is None:
        from .style_builders import create_simple_styles
        style = DucPlotStyle(base_style=create_simple_styles())
    
    if stack_base is None:
        stack_base = create_stack_base(label=label, is_plot=True, is_visible=is_visible, locked=locked)
    
    stack_element_base = create_stack_element_base(
        x=x, y=y, width=width, height=height,
        stack_base=stack_base, clip=clip, label_visible=label_visible,
        standard_override=standard_override, angle=angle, styles=styles,
        id=id, label=label, scope=scope, locked=locked,
        is_visible=is_visible, z_index=z_index,
        explicit_properties_override=explicit_properties_override
    )
    
    layout = PlotLayout(margins=margins)
    plot = DucPlotElement(
        stack_element_base=stack_element_base,
        style=style,
        layout=layout
    )
    return ElementWrapper(element=plot)

def create_freedraw_element(
    x: float,
    y: float,
    width: float,
    height: float,
    points: list,
    pressures: list,
    size: float,
    thinning: float,
    smoothing: float,
    streamline: float,
    easing: str,
    simulate_pressure: bool = False,
    start=None,
    end=None,
    last_committed_point=None,
    svg_path=None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a freedraw element with a clean, modular API.
    """
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    element_params = {
        "points": points,
        "pressures": pressures,
        "size": size,
        "thinning": thinning,
        "smoothing": smoothing,
        "streamline": streamline,
        "easing": easing,
        "simulate_pressure": simulate_pressure,
        "start": start,
        "end": end,
        "last_committed_point": last_committed_point,
        "svg_path": svg_path,
    }
    return _create_element_wrapper(
        DucFreeDrawElement,
        base_params,
        element_params,
        explicit_properties_override
    )

def create_viewport_element(
    points: List[tuple],
    view: DucView,
    scale: float = 1.0,
    style: Optional[DucViewportStyle] = None,
    stack_base: Optional[DucStackBase] = None,
    standard_override: Optional["Standard"] = None,
    shade_plot = None,  # Will be set to default
    frozen_group_ids: Optional[List[str]] = None,
    start_binding: Optional[DucPointBinding] = None,
    end_binding: Optional[DucPointBinding] = None,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a viewport element.
    """
    if style is None:
        from .style_builders import create_simple_styles
        style = DucViewportStyle(
            base_style=create_simple_styles(),
            scale_indicator_visible=True
        )
        
    if stack_base is None:
        stack_base = create_stack_base(label=label, is_visible=is_visible, locked=locked)
    
    if frozen_group_ids is None:
        frozen_group_ids = []
    
    # Create linear base for the viewport boundary
    linear_element_wrapper = create_linear_element(
        points=points,
        start_binding=start_binding,
        end_binding=end_binding,
        styles=styles,
        id=id,
        label=label,
        scope=scope,
        locked=locked,
        is_visible=is_visible,
        z_index=z_index,
        explicit_properties_override=explicit_properties_override
    )
    
    linear_base = linear_element_wrapper.element.linear_base
    
    # Import the shade_plot enum if needed - for now use a default
    from ..Duc.VIEWPORT_SHADE_PLOT import VIEWPORT_SHADE_PLOT
    if shade_plot is None:
        shade_plot = VIEWPORT_SHADE_PLOT.AS_DISPLAYED  # Use default value
    
    viewport = DucViewportElement(
        linear_base=linear_base,
        stack_base=stack_base,
        style=style,
        view=view,
        scale=scale,
        standard_override=standard_override,
        shade_plot=shade_plot,
        frozen_group_ids=frozen_group_ids
    )
    
    return ElementWrapper(element=viewport)


# === Block-related builders ===

def create_block_attribute_definition(
    tag: str,
    default_value: str,
    is_constant: bool = False,
    prompt: Optional[str] = None
) -> DucBlockAttributeDefinition:
    """Create a block attribute definition."""
    return DucBlockAttributeDefinition(
        tag=tag,
        default_value=default_value,
        is_constant=is_constant,
        prompt=prompt
    )


def create_block_attribute_definition_entry(
    key: str,
    tag: str,
    default_value: str,
    is_constant: bool = False,
    prompt: Optional[str] = None
) -> DucBlockAttributeDefinitionEntry:
    """Create a block attribute definition entry."""
    attr_def = create_block_attribute_definition(tag, default_value, is_constant, prompt)
    return DucBlockAttributeDefinitionEntry(key=key, value=attr_def)


def create_block(
    id: str,
    label: str,
    elements: List[ElementWrapper],
    attribute_definitions: Optional[List[DucBlockAttributeDefinitionEntry]] = None,
    description: Optional[str] = None,
    version: int = 1
) -> DucBlock:
    """
    Create a DucBlock (block definition - like a Figma component).
    
    Args:
        id: Unique identifier for the block
        label: Human-readable name
        elements: List of elements that make up this block
        attribute_definitions: Optional list of attribute definitions
        description: Optional description
        version: Version number
    """
    if attribute_definitions is None:
        attribute_definitions = []
        
    return DucBlock(
        id=id,
        label=label,
        version=version,
        elements=elements,
        attribute_definitions=attribute_definitions,
        description=description
    )


def create_block_duplication_array(
    rows: int = 1,
    cols: int = 1,
    row_spacing: float = 0.0,
    col_spacing: float = 0.0
) -> DucBlockDuplicationArray:
    """Create a block duplication array for repeating instances."""
    return DucBlockDuplicationArray(
        rows=rows,
        cols=cols,
        row_spacing=row_spacing,
        col_spacing=col_spacing
    )


def create_string_value_entry(key: str, value: str) -> StringValueEntry:
    """Create a string value entry for block attributes."""
    return StringValueEntry(key=key, value=value)


def create_block_instance_element(
    x: float,
    y: float,
    width: float,
    height: float,
    block_id: str,
    element_overrides: Optional[List[StringValueEntry]] = None,
    attribute_values: Optional[List[StringValueEntry]] = None,
    duplication_array: Optional[DucBlockDuplicationArray] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a DucBlockInstanceElement (block instance - like a Figma component instance).
    
    Args:
        x, y, width, height: Position and size
        block_id: ID of the block definition to instance
        element_overrides: Optional list of element property overrides
        attribute_values: Optional list of attribute values
        duplication_array: Optional duplication array for repeating the instance
        Other standard element parameters...
    """
    from ..classes.ElementsClass import DucBlockInstanceElement
    
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    
    element_params = {
        "block_id": block_id,
        "element_overrides": element_overrides or [],
        "attribute_values": attribute_values or [],
        "duplication_array": duplication_array
    }
    
    return _create_element_wrapper(
        DucBlockInstanceElement,
        base_params,
        element_params,
        explicit_properties_override
    )


# === Table-related builders ===

def create_table_column(
    id: str,
    width: float,
    style_overrides: Optional[DucTableCellStyle] = None
) -> DucTableColumn:
    """Create a table column definition."""
    from ..classes.ElementsClass import DucTableColumn
    
    return DucTableColumn(
        id=id,
        width=width,
        style_overrides=style_overrides
    )


def create_table_row(
    id: str,
    height: float,
    style_overrides: Optional[DucTableCellStyle] = None
) -> DucTableRow:
    """Create a table row definition."""
    from ..classes.ElementsClass import DucTableRow
    
    return DucTableRow(
        id=id,
        height=height,
        style_overrides=style_overrides
    )


def create_table_cell(
    row_id: str,
    column_id: str,
    data: str,
    locked: bool = False,
    span: Optional[DucTableCellSpan] = None,
    style_overrides: Optional[DucTableCellStyle] = None
) -> DucTableCell:
    """Create a table cell."""
    from ..classes.ElementsClass import DucTableCell
    
    return DucTableCell(
        row_id=row_id,
        column_id=column_id,
        data=data,
        locked=locked,
        span=span,
        style_overrides=style_overrides
    )


def create_table_cell_span(columns: int = 1, rows: int = 1) -> DucTableCellSpan:
    """Create a table cell span."""
    from ..classes.ElementsClass import DucTableCellSpan
    
    return DucTableCellSpan(columns=columns, rows=rows)


def create_table_auto_size(columns: bool = True, rows: bool = True) -> DucTableAutoSize:
    """Create table auto-size settings."""
    from ..classes.ElementsClass import DucTableAutoSize
    
    return DucTableAutoSize(columns=columns, rows=rows)


def create_table_cell_style(
    base_style: Optional[DucElementStylesBase] = None,
    text_style: Optional[DucTextStyle] = None,
    margins: Optional[Margins] = None,
    alignment: Optional[TABLE_CELL_ALIGNMENT] = None,
    # Text style shortcuts
    font_family: str = "Arial",
    font_size: float = 12,
    text_align: Optional[TEXT_ALIGN] = None,
    vertical_align: Optional[VERTICAL_ALIGN] = None
) -> DucTableCellStyle:
    """
    Create a table cell style.
    
    Args:
        base_style: Base element style (stroke, background, etc.)
        text_style: Text formatting style (if None, will be created from font parameters)
        margins: Cell margins (padding)
        alignment: Cell content alignment
        font_family: Font family for text (used if text_style is None)
        font_size: Font size for text (used if text_style is None)
        text_align: Text alignment (used if text_style is None)
        vertical_align: Vertical alignment (used if text_style is None)
    """
    from ..classes.ElementsClass import DucTableCellStyle, DucTextStyle, Margins, LineSpacing
    from ..Duc.TABLE_CELL_ALIGNMENT import TABLE_CELL_ALIGNMENT
    from ..Duc.TEXT_ALIGN import TEXT_ALIGN
    from ..Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
    from ..Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
    
    if base_style is None:
        base_style = create_simple_styles()
    
    if text_style is None:
        # Create text style from provided parameters
        text_style = create_text_style(
            base_style=create_simple_styles(),
            font_family=font_family,
            font_size=font_size,
            text_align=text_align or TEXT_ALIGN.LEFT,
            vertical_align=vertical_align or VERTICAL_ALIGN.TOP
        )
    
    if margins is None:
        margins = Margins(top=2, right=2, bottom=2, left=2)
    
    if alignment is None:
        alignment = TABLE_CELL_ALIGNMENT.TOP_LEFT
    
    return DucTableCellStyle(
        base_style=base_style,
        text_style=text_style,
        margins=margins,
        alignment=alignment
    )


def create_table_style(
    base_style: Optional[DucElementStylesBase] = None,
    header_row_style: Optional[DucTableCellStyle] = None,
    data_row_style: Optional[DucTableCellStyle] = None,
    data_column_style: Optional[DucTableCellStyle] = None,
    flow_direction: Optional[TABLE_FLOW_DIRECTION] = None
) -> DucTableStyle:
    """
    Create a table style.
    
    Args:
        base_style: Base element style for the table
        header_row_style: Style for header rows
        data_row_style: Style for data rows
        data_column_style: Style for data columns
        flow_direction: Table flow direction (down/right)
    """
    from ..classes.ElementsClass import DucTableStyle
    from ..Duc.TABLE_FLOW_DIRECTION import TABLE_FLOW_DIRECTION
    
    if base_style is None:
        base_style = create_simple_styles()
    
    if header_row_style is None:
        header_row_style = create_table_cell_style()
    
    if data_row_style is None:
        data_row_style = create_table_cell_style()
    
    if data_column_style is None:
        data_column_style = create_table_cell_style()
    
    if flow_direction is None:
        flow_direction = TABLE_FLOW_DIRECTION.DOWN
    
    return DucTableStyle(
        base_style=base_style,
        header_row_style=header_row_style,
        data_row_style=data_row_style,
        data_column_style=data_column_style,
        flow_direction=flow_direction
    )


def create_table_from_data(
    x: float,
    y: float,
    width: float,
    height: float,
    data: List[List[str]],
    column_headers: Optional[List[str]] = None,
    column_widths: Optional[List[float]] = None,
    row_height: float = 30,
    header_row_count: int = 0,
    style: Optional[DucTableStyle] = None,
    auto_size: Optional[DucTableAutoSize] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a table element from 2D data array with automatic column/row/cell generation.
    
    Args:
        x, y, width, height: Position and size
        data: 2D list of strings representing table data
        column_headers: Optional list of column header names. If provided, will be used as first row
        column_widths: Optional list of column widths. If None, widths are distributed evenly
        row_height: Height for all rows
        header_row_count: Number of header rows (auto-set to 1 if column_headers provided)
        Other standard table element parameters...
        
    Example:
        # Simple usage
        table = duc.create_table_from_data(
            x=50, y=50, width=300, height=120,
            data=[
                ["Element A", "Rectangle", "100x50"],
                ["Element B", "Circle", "r=25"],
                ["Element C", "Line", "length=75"]
            ],
            column_headers=["Name", "Type", "Value"],
            column_widths=[100, 80, 120],
            label="Main Data Table"
        )
    """
    if not data:
        raise ValueError("Data cannot be empty")
    
    num_cols = len(data[0])
    num_rows = len(data)
    
    # Add headers to data if provided
    if column_headers:
        if len(column_headers) != num_cols:
            raise ValueError(f"Column headers count ({len(column_headers)}) must match data columns ({num_cols})")
        data = [column_headers] + data
        num_rows += 1
        if header_row_count == 0:
            header_row_count = 1
    
    # Generate column widths if not provided
    if column_widths is None:
        column_widths = [width / num_cols] * num_cols
    elif len(column_widths) != num_cols:
        raise ValueError(f"Column widths count ({len(column_widths)}) must match data columns ({num_cols})")
    
    # Create columns
    columns = []
    for i, col_width in enumerate(column_widths):
        columns.append(create_table_column(
            id=f"col_{i}",
            width=col_width
        ))
    
    # Create rows
    rows = []
    for i in range(num_rows):
        rows.append(create_table_row(
            id=f"row_{i}",
            height=row_height
        ))
    
    # Create cells
    cells = []
    for row_idx, row_data in enumerate(data):
        if len(row_data) != num_cols:
            raise ValueError(f"Row {row_idx} has {len(row_data)} columns, expected {num_cols}")
        
        for col_idx, cell_data in enumerate(row_data):
            cells.append(create_table_cell(
                row_id=f"row_{row_idx}",
                column_id=f"col_{col_idx}",
                data=str(cell_data)
            ))
    
    return create_table_element(
        x=x, y=y, width=width, height=height,
        columns=columns, rows=rows, cells=cells,
        style=style, header_row_count=header_row_count, auto_size=auto_size,
        angle=angle, styles=styles, id=id, label=label, scope=scope,
        locked=locked, is_visible=is_visible, z_index=z_index,
        explicit_properties_override=explicit_properties_override
    )


def create_table_element(
    x: float,
    y: float,
    width: float,
    height: float,
    columns: List[DucTableColumn],
    rows: List[DucTableRow],
    cells: List[DucTableCell],
    style: Optional[DucTableStyle] = None,
    header_row_count: int = 1,
    auto_size: Optional[DucTableAutoSize] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a DucTableElement with proper table structure.
    
    Args:
        x, y, width, height: Position and size
        columns: List of table column definitions
        rows: List of table row definitions
        cells: List of table cells
        style: Optional table style
        header_row_count: Number of header rows
        auto_size: Auto-sizing settings
        Other standard element parameters...
    """
    from ..classes.ElementsClass import (
        DucTableElement, DucTableColumnEntry, DucTableRowEntry, 
        DucTableCellEntry, DucTableStyle
    )
    
    if style is None:
        # Create default table style with all required arguments
        from ..classes.ElementsClass import DucTableCellStyle, DucTextStyle, Margins
        from ..Duc.TABLE_FLOW_DIRECTION import TABLE_FLOW_DIRECTION
        from ..Duc.TABLE_CELL_ALIGNMENT import TABLE_CELL_ALIGNMENT
        from ..Duc.TEXT_ALIGN import TEXT_ALIGN
        from ..Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
        
        # Create minimal text style
        from ..classes.ElementsClass import LineSpacing
        from ..Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
        
        default_text_style = DucTextStyle(
            base_style=create_simple_styles(),
            is_ltr=True,
            font_family="Arial",
            big_font_family="Arial",
            line_height=1.0,
            line_spacing=LineSpacing(value=1.0, type=LINE_SPACING_TYPE.MULTIPLE),
            oblique_angle=0.0,
            font_size=12,
            width_factor=1.0,
            is_upside_down=False,
            is_backwards=False,
            text_align=TEXT_ALIGN.LEFT,
            vertical_align=VERTICAL_ALIGN.TOP,
            paper_text_height=None
        )
        
        # Create minimal margins
        default_margins = Margins(top=2, right=2, bottom=2, left=2)
        
        # Create minimal cell styles with all required arguments
        default_cell_style = DucTableCellStyle(
            base_style=create_simple_styles(),
            text_style=default_text_style,
            margins=default_margins,
            alignment=TABLE_CELL_ALIGNMENT.TOP_LEFT
        )
        
        style = DucTableStyle(
            base_style=create_simple_styles(),
            header_row_style=default_cell_style,
            data_row_style=default_cell_style,
            data_column_style=default_cell_style,
            flow_direction=TABLE_FLOW_DIRECTION.DOWN
        )
    
    if auto_size is None:
        auto_size = create_table_auto_size()
    
    # Create column entries
    column_entries = []
    column_order = []
    for col in columns:
        column_entries.append(DucTableColumnEntry(key=col.id, value=col))
        column_order.append(col.id)
    
    # Create row entries  
    row_entries = []
    row_order = []
    for row in rows:
        row_entries.append(DucTableRowEntry(key=row.id, value=row))
        row_order.append(row.id)
    
    # Create cell entries
    cell_entries = []
    for cell in cells:
        cell_key = f"{cell.row_id}_{cell.column_id}"
        cell_entries.append(DucTableCellEntry(key=cell_key, value=cell))
    
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    
    element_params = {
        "style": style,
        "column_order": column_order,
        "row_order": row_order,
        "columns": column_entries,
        "rows": row_entries,
        "cells": cell_entries,
        "header_row_count": header_row_count,
        "auto_size": auto_size
    }
    
    return _create_element_wrapper(
        DucTableElement,
        base_params,
        element_params,
        explicit_properties_override
    )


# === Layer and Region builders (to be added to state_builders.py) ===

def create_layer_overrides(
    stroke: Optional[ElementStroke] = None,
    background: Optional[ElementBackground] = None
) -> DucLayerOverrides:
    """Create layer overrides for stroke and background."""
    from ..classes.ElementsClass import DucLayerOverrides
    from .style_builders import create_solid_content, create_stroke, create_background
    
    if stroke is None:
        stroke = create_stroke(create_solid_content("#000000"), width=1.0)
    if background is None:
        background = create_background(create_solid_content("#FFFFFF"))
    
    return DucLayerOverrides(stroke=stroke, background=background)


def create_layer(
    id: str,
    label: str,
    readonly: bool = False,
    stack_base: Optional[DucStackBase] = None,
    overrides: Optional[DucLayerOverrides] = None
) -> DucLayer:
    """
    Create a DucLayer.
    
    Args:
        id: Unique identifier for the layer
        label: Human-readable label
        readonly: Whether the layer is read-only
        stack_base: Stack base for layer properties
        overrides: Layer style overrides
    """
    from ..classes.ElementsClass import DucLayer
    
    if stack_base is None:
        stack_base = create_stack_base(label=label)
    
    if overrides is None:
        overrides = create_layer_overrides()
    
    return DucLayer(
        id=id,
        stack_base=stack_base,
        readonly=readonly,
        overrides=overrides
    )


def create_region(
    id: str,
    label: str,
    boolean_operation:BOOLEAN_OPERATION,
    stack_base: Optional[DucStackBase] = None
) -> DucRegion:
    """
    Create a DucRegion.
    
    Args:
        id: Unique identifier for the region
        label: Human-readable label
        boolean_operation: Boolean operation type
        stack_base: Stack base for region properties
    """
    from ..classes.ElementsClass import DucRegion
    
    if stack_base is None:
        stack_base = create_stack_base(label=label)
    
    return DucRegion(
        id=id,
        stack_base=stack_base,
        boolean_operation=boolean_operation
    )


# === Document Element builder ===

def create_doc_element(
    x: float,
    y: float,
    width: float,
    height: float,
    text: str,
    style: Optional[DucDocStyle] = None,
    columns: Optional[ColumnLayout] = None,
    auto_resize: bool = False,
    flow_direction: Optional[TEXT_FLOW_DIRECTION] = None,
    dynamic: Optional[List[DucTextDynamicPart]] = None,
    angle: float = 0.0,
    styles: Optional[DucElementStylesBase] = None,
    id: Optional[str] = None,
    label: str = "",
    scope: str = DEFAULT_SCOPE,
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a DucDocElement for rich text documents.
    
    Args:
        x, y, width, height: Position and size
        text: Document text content
        style: Document styling
        columns: Column layout for multi-column text
        auto_resize: Whether to auto-resize based on content
        flow_direction: Text flow direction
        dynamic: Dynamic text parts
        Other standard element parameters...
    """
    if style is None:
        style = create_doc_style()
    
    if columns is None:
        columns = create_column_layout()
    
    if flow_direction is None:
        flow_direction = TEXT_FLOW_DIRECTION.LEFT_TO_RIGHT
    
    if dynamic is None:
        dynamic = []
    
    base_params = {
        "x": x, "y": y, "width": width, "height": height, "angle": angle,
        "styles": styles, "id": id, "label": label, "scope": scope,
        "locked": locked, "is_visible": is_visible, "z_index": z_index
    }
    
    element_params = {
        "style": style,
        "text": text,
        "dynamic": dynamic,
        "columns": columns,
        "auto_resize": auto_resize,
        "flow_direction": flow_direction
    }
    
    return _create_element_wrapper(
        DucDocElement,
        base_params,
        element_params,
        explicit_properties_override
    )


def create_dimension_style(
    dim_line=None,
    ext_line=None,
    text_style=None,
    symbols=None,
    tolerance=None,
    fit=None
) -> DucDimensionStyle:
    """Create a dimension style with default values."""
    if dim_line is None:
        from .style_builders import create_solid_content, create_stroke
        stroke_content = create_solid_content("#000000", 1.0)
        stroke = create_stroke(stroke_content, width=1.0)
        dim_line = DimensionLineStyle(
            stroke=stroke,
            text_gap=2.0
        )
    if ext_line is None:
        from .style_builders import create_solid_content, create_stroke
        stroke_content = create_solid_content("#000000", 1.0)
        stroke = create_stroke(stroke_content, width=1.0)
        ext_line = DimensionExtLineStyle(
            stroke=stroke,
            overshoot=2.0,
            offset=1.0
        )
    if text_style is None:
        text_style = create_text_style(font_size=12)
    if symbols is None:
        from ducpy.Duc.MARK_ELLIPSE_CENTER import MARK_ELLIPSE_CENTER
        symbols = DimensionSymbolStyle(
            center_mark_size=5.0,
            center_mark_type=MARK_ELLIPSE_CENTER.MARK
        )
    if tolerance is None:
        from ducpy.Duc.TOLERANCE_DISPLAY import TOLERANCE_DISPLAY
        tolerance = DimensionToleranceStyle(
            enabled=False,
            upper_value=0.0,
            lower_value=0.0,
            precision=2,
            display_method=TOLERANCE_DISPLAY.NONE
        )
    if fit is None:
        from ducpy.Duc.DIMENSION_FIT_RULE import DIMENSION_FIT_RULE
        from ducpy.Duc.DIMENSION_TEXT_PLACEMENT import DIMENSION_TEXT_PLACEMENT
        fit = DimensionFitStyle(
            force_text_inside=False,
            rule=DIMENSION_FIT_RULE.BEST_FIT,
            text_placement=DIMENSION_TEXT_PLACEMENT.BESIDE_LINE
        )
    
    return DucDimensionStyle(
        dim_line=dim_line,
        ext_line=ext_line,
        text_style=text_style,
        symbols=symbols,
        tolerance=tolerance,
        fit=fit
    )


def create_dimension_element(
    x=0.0,
    y=0.0,
    width=100.0,
    height=20.0,
    origin1=None,
    origin2=None,
    location=None,
    dimension_type=DIMENSION_TYPE.LINEAR,
    oblique_angle=0.0,
    style=None,
    text_override=None,
    ordinate_axis=None,
    bindings=None,
    baseline_data=None,
    continue_data=None,
    **kwargs
) -> ElementWrapper:
    """
    Create a dimension element.
    
    Args:
        x, y, width, height: Basic positioning and sizing
        origin1: First origin point (GeometricPoint). If None, uses (x, y)
        origin2: Second origin point (GeometricPoint). If None, uses (x+width, y)
        location: Dimension line location (GeometricPoint). If None, uses (x+width/2, y+height)
        dimension_type: Type of dimension (DIMENSION_TYPE enum)
        oblique_angle: Oblique angle for extension lines (radians)
        style: Dimension style (DucDimensionStyle)
        text_override: Override dimension text
        ordinate_axis: For ordinate dimensions (AXIS enum)
        bindings: Point bindings to other elements (DimensionBindings)
        baseline_data: For baseline dimensions (DimensionBaselineData)
        continue_data: For continued dimensions (DimensionContinueData)
    """
    # Create default points if not provided
    if origin1 is None:
        origin1 = GeometricPoint(x=x, y=y)
    if origin2 is None:
        origin2 = GeometricPoint(x=x + width, y=y)
    if location is None:
        location = GeometricPoint(x=x + width/2, y=y + height)
    
    # Create definition points
    definition_points = DimensionDefinitionPoints(
        origin1=origin1,
        origin2=origin2,
        location=location
    )
    
    # Create default style if not provided
    if style is None:
        style = create_dimension_style()
    
    # Separate base parameters from element-specific parameters
    base_kwargs = {}
    for key, value in kwargs.items():
        if key in ['id', 'label', 'scope', 'locked', 'is_visible', 'z_index', 
                  'description', 'group_ids', 'region_ids', 'layer_id', 'frame_id',
                  'bound_elements', 'link', 'custom_data', 'is_plot', 'is_annotative',
                  'is_deleted', 'index', 'angle', 'styles']:
            base_kwargs[key] = value
    
    # Create base element
    base_params = {
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "styles": base_kwargs.get('styles', create_simple_styles()),
        **base_kwargs
    }
    
    element_params = {
        "style": style,
        "definition_points": definition_points,
        "oblique_angle": oblique_angle,
        "dimension_type": dimension_type,
        "ordinate_axis": ordinate_axis,
        "bindings": bindings,
        "text_override": text_override,
        "baseline_data": baseline_data,
        "continue_data": continue_data
    }
    
    return _create_element_wrapper(
        DucDimensionElement,
        base_params,
        element_params
    )


def create_linear_dimension(
    x1, y1, x2, y2, offset=20.0, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a linear dimension between two points."""
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2) - offset,
        width=abs(x2 - x1),
        height=offset,
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=(x1 + x2) / 2, y=min(y1, y2) - offset),
        dimension_type=DIMENSION_TYPE.LINEAR,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_aligned_dimension(
    x1, y1, x2, y2, offset=20.0, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create an aligned dimension between two points."""
    # Calculate perpendicular offset direction
    import math
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    if length > 0:
        # Perpendicular vector (normalized)
        perp_x = -dy / length
        perp_y = dx / length
        location_x = (x1 + x2) / 2 + perp_x * offset
        location_y = (y1 + y2) / 2 + perp_y * offset
    else:
        location_x = x1
        location_y = y1 - offset
    
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2),
        width=abs(x2 - x1),
        height=abs(y2 - y1),
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=location_x, y=location_y),
        dimension_type=DIMENSION_TYPE.ALIGNED,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_angular_dimension(
    center_x, center_y, x1, y1, x2, y2, offset=30.0, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create an angular dimension."""
    return create_dimension_element(
        x=center_x - offset,
        y=center_y - offset,
        width=offset * 2,
        height=offset * 2,
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=center_x, y=center_y - offset),
        definition_points=DimensionDefinitionPoints(
            origin1=GeometricPoint(x=x1, y=y1),
            origin2=GeometricPoint(x=x2, y=y2),
            center=GeometricPoint(x=center_x, y=center_y),
            location=GeometricPoint(x=center_x, y=center_y - offset)
        ),
        dimension_type=DIMENSION_TYPE.ANGULAR,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_radius_dimension(
    center_x, center_y, radius_point_x, radius_point_y, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a radius dimension."""
    return create_dimension_element(
        x=center_x,
        y=center_y,
        width=abs(radius_point_x - center_x),
        height=abs(radius_point_y - center_y),
        origin1=GeometricPoint(x=center_x, y=center_y),
        origin2=GeometricPoint(x=radius_point_x, y=radius_point_y),
        location=GeometricPoint(x=(center_x + radius_point_x) / 2, y=(center_y + radius_point_y) / 2),
        dimension_type=DIMENSION_TYPE.RADIUS,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_diameter_dimension(
    center_x, center_y, x1, y1, x2, y2, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a diameter dimension."""
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2),
        width=abs(x2 - x1),
        height=abs(y2 - y1),
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=(x1 + x2) / 2, y=(y1 + y2) / 2),
        definition_points=DimensionDefinitionPoints(
            origin1=GeometricPoint(x=x1, y=y1),
            origin2=GeometricPoint(x=x2, y=y2),
            center=GeometricPoint(x=center_x, y=center_y),
            location=GeometricPoint(x=(x1 + x2) / 2, y=(y1 + y2) / 2)
        ),
        dimension_type=DIMENSION_TYPE.DIAMETER,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_arc_length_dimension(
    center_x, center_y, start_angle, end_angle, radius, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create an arc length dimension."""
    import math
    # Calculate arc endpoints
    start_x = center_x + radius * math.cos(start_angle)
    start_y = center_y + radius * math.sin(start_angle)
    end_x = center_x + radius * math.cos(end_angle)
    end_y = center_y + radius * math.sin(end_angle)
    
    # Location is at the midpoint of the arc
    mid_angle = (start_angle + end_angle) / 2
    location_x = center_x + (radius + 20) * math.cos(mid_angle)
    location_y = center_y + (radius + 20) * math.sin(mid_angle)
    
    return create_dimension_element(
        x=center_x - radius,
        y=center_y - radius,
        width=radius * 2,
        height=radius * 2,
        origin1=GeometricPoint(x=start_x, y=start_y),
        origin2=GeometricPoint(x=end_x, y=end_y),
        location=GeometricPoint(x=location_x, y=location_y),
        definition_points=DimensionDefinitionPoints(
            origin1=GeometricPoint(x=start_x, y=start_y),
            origin2=GeometricPoint(x=end_x, y=end_y),
            center=GeometricPoint(x=center_x, y=center_y),
            location=GeometricPoint(x=location_x, y=location_y)
        ),
        dimension_type=DIMENSION_TYPE.ARC_LENGTH,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_center_mark_dimension(
    center_x, center_y, size=10, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a center mark dimension."""
    return create_dimension_element(
        x=center_x - size/2,
        y=center_y - size/2,
        width=size,
        height=size,
        origin1=GeometricPoint(x=center_x, y=center_y),
        location=GeometricPoint(x=center_x, y=center_y - size),
        definition_points=DimensionDefinitionPoints(
            origin1=GeometricPoint(x=center_x, y=center_y),
            location=GeometricPoint(x=center_x, y=center_y - size),
            center=GeometricPoint(x=center_x, y=center_y)
        ),
        dimension_type=DIMENSION_TYPE.CENTER_MARK,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_rotated_dimension(
    x1, y1, x2, y2, rotation_angle, offset=20.0, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a rotated dimension (linear dimension at a specific angle)."""
    import math
    
    # Calculate the dimension line parallel to the specified angle
    dx = x2 - x1
    dy = y2 - y1
    
    # Calculate perpendicular offset direction
    perp_x = -math.sin(rotation_angle)
    perp_y = math.cos(rotation_angle)
    
    location_x = (x1 + x2) / 2 + perp_x * offset
    location_y = (y1 + y2) / 2 + perp_y * offset
    
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2),
        width=abs(x2 - x1),
        height=abs(y2 - y1),
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=location_x, y=location_y),
        dimension_type=DIMENSION_TYPE.ROTATED,
        oblique_angle=rotation_angle,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_spacing_dimension(
    x1, y1, x2, y2, x3, y3, x4, y4, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a spacing dimension (measures distance between two objects)."""
    # First object center
    obj1_center_x = (x1 + x2) / 2
    obj1_center_y = (y1 + y2) / 2
    
    # Second object center
    obj2_center_x = (x3 + x4) / 2
    obj2_center_y = (y3 + y4) / 2
    
    # Dimension location offset from center line
    location_x = (obj1_center_x + obj2_center_x) / 2
    location_y = (obj1_center_y + obj2_center_y) / 2 - 30
    
    return create_dimension_element(
        x=min(obj1_center_x, obj2_center_x),
        y=min(obj1_center_y, obj2_center_y),
        width=abs(obj2_center_x - obj1_center_x),
        height=abs(obj2_center_y - obj1_center_y),
        origin1=GeometricPoint(x=obj1_center_x, y=obj1_center_y),
        origin2=GeometricPoint(x=obj2_center_x, y=obj2_center_y),
        location=GeometricPoint(x=location_x, y=location_y),
        dimension_type=DIMENSION_TYPE.SPACING,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_continue_dimension(
    continue_from_dimension_id, x1, y1, x2, y2, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a continued dimension (continues from a previous dimension)."""
    continue_data = DimensionContinueData(continue_from_dimension_id=continue_from_dimension_id)
    
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2),
        width=abs(x2 - x1),
        height=20,
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=(x1 + x2) / 2, y=min(y1, y2) - 20),
        dimension_type=DIMENSION_TYPE.CONTINUE,
        continue_data=continue_data,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_baseline_dimension(
    base_dimension_id, x1, y1, x2, y2, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a baseline dimension (from a common baseline)."""
    baseline_data = DimensionBaselineData(base_dimension_id=base_dimension_id)
    
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2),
        width=abs(x2 - x1),
        height=20,
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=(x1 + x2) / 2, y=min(y1, y2) - 30),
        dimension_type=DIMENSION_TYPE.BASELINE,
        baseline_data=baseline_data,
        text_override=text_override,
        style=style,
        **kwargs
    )


def create_jogged_linear_dimension(
    x1, y1, x2, y2, jog_x, jog_y, text_override=None, style=None, **kwargs
) -> ElementWrapper:
    """Create a jogged linear dimension (linear dimension with a jogged dimension line)."""
    return create_dimension_element(
        x=min(x1, x2),
        y=min(y1, y2),
        width=abs(x2 - x1),
        height=abs(y2 - y1),
        origin1=GeometricPoint(x=x1, y=y1),
        origin2=GeometricPoint(x=x2, y=y2),
        location=GeometricPoint(x=(x1 + x2) / 2, y=(y1 + y2) / 2),
        definition_points=DimensionDefinitionPoints(
            origin1=GeometricPoint(x=x1, y=y1),
            origin2=GeometricPoint(x=x2, y=y2),
            location=GeometricPoint(x=(x1 + x2) / 2, y=(y1 + y2) / 2),
            jog=GeometricPoint(x=jog_x, y=jog_y)
        ),
        dimension_type=DIMENSION_TYPE.JOGGED_LINEAR,
        text_override=text_override,
        style=style,
        **kwargs
    )

def create_margins(top: float = 0.0, right: float = 0.0, bottom: float = 0.0, left: float = 0.0) -> Margins:
    """Create margins object for layout elements."""
    return Margins(top=top, right=right, bottom=bottom, left=left)


# === TOLERANCE AND GD&T BUILDERS ===

def create_tolerance_clause(
    value: str,
    zone_type: Optional[int] = None,
    material_condition: Optional[int] = None,
    feature_modifiers: Optional[List[int]] = None
) -> ToleranceClause:
    """Create a tolerance clause for GD&T."""
    return ToleranceClause(
        value=value,
        zone_type=zone_type,
        material_condition=material_condition,
        feature_modifiers=feature_modifiers or []
    )


def create_datum_reference(
    datum_letter: str,
    material_condition: Optional[int] = None,
    modifier: str = ""
) -> DatumReference:
    """Create a datum reference for GD&T."""
    return DatumReference(
        letters=datum_letter,
        modifier=material_condition
    )


def create_feature_control_frame_segment(
    symbol: int,
    tolerance: ToleranceClause,
    datums: Optional[List[DatumReference]] = None
) -> FeatureControlFrameSegment:
    """Create a feature control frame segment."""
    return FeatureControlFrameSegment(
        symbol=symbol,
        tolerance=tolerance,
        datums=datums or []
    )


def create_fcf_frame_modifiers(
    all_around: bool = False,
    all_over: bool = False,
    continuous_feature: bool = False,
    between: Optional[FCFBetweenModifier] = None,
    projected_tolerance_zone: Optional[FCFProjectedZoneModifier] = None
) -> FCFFrameModifiers:
    """Create frame modifiers for feature control frames."""
    return FCFFrameModifiers(
        all_around=all_around,
        all_over=all_over,
        continuous_feature=continuous_feature,
        between=between,
        projected_tolerance_zone=projected_tolerance_zone
    )


def create_fcf_between_modifier(start: str, end: str) -> FCFBetweenModifier:
    """Create a between modifier for feature control frames."""
    return FCFBetweenModifier(start=start, end=end)


def create_fcf_projected_zone_modifier(value: float) -> FCFProjectedZoneModifier:
    """Create a projected zone modifier for feature control frames."""
    return FCFProjectedZoneModifier(value=value)


def create_fcf_datum_definition(
    letter: str,
    feature_binding: Optional[DucPointBinding] = None
) -> FCFDatumDefinition:
    """Create a datum definition for feature control frames."""
    return FCFDatumDefinition(
        letter=letter,
        feature_binding=feature_binding
    )


def create_feature_control_frame_element(
    x: float, y: float, width: float, height: float,
    rows: List[FCFSegmentRow],
    frame_modifiers: Optional[FCFFrameModifiers] = None,
    leader_element_id: Optional[str] = None,
    datum_definition: Optional[FCFDatumDefinition] = None,
    style=None,
    **kwargs
) -> ElementWrapper:
    """Create a feature control frame element."""
    base = create_element_base(
        x=x, y=y, width=width, height=height, **kwargs
    )
    
    if style is None:
        style = create_feature_control_frame_style()
    
    element = DucFeatureControlFrameElement(
        base=base,
        style=style,
        rows=rows,
        frame_modifiers=frame_modifiers,
        leader_element_id=leader_element_id,
        datum_definition=datum_definition
    )
    
    return ElementWrapper(element=element)


def create_feature_control_frame_style():
    """Create a default feature control frame style."""
    from .style_builders import create_simple_styles, create_text_style
    
    # Create a basic FCF style - this would need proper implementation
    # For now, return a simple object that can be serialized
    class DucFeatureControlFrameStyle:
        def __init__(self):
            self.base_style = create_simple_styles()
            self.text_style = create_text_style()
            self.layout = None
            self.symbols = None
            self.datum_style = None
    
    return DucFeatureControlFrameStyle()


def create_leader_text_content(text: str) -> LeaderTextBlockContent:
    """Create leader text block content."""
    return LeaderTextBlockContent(text=text)


def create_leader_block_content(
    block_id: str,
    attribute_values: Optional[List[StringValueEntry]] = None,
    element_overrides: Optional[List[StringValueEntry]] = None
) -> LeaderBlockContent:
    """Create leader block content."""
    return LeaderBlockContent(
        block_id=block_id,
        attribute_values=attribute_values,
        element_overrides=element_overrides
    )


def create_leader_content(
    content: Union[LeaderTextBlockContent, LeaderBlockContent]
) -> LeaderContent:
    """Create leader content."""
    return LeaderContent(content=content)


def create_leader_element(
    x1: float, y1: float, x2: float, y2: float,
    content_anchor_x: float, content_anchor_y: float,
    content: Optional[LeaderContent] = None,
    style=None,
    **kwargs
) -> ElementWrapper:
    """Create a leader element."""
    # Create DucPoints from coordinates
    duc_points = [
        DucPoint(x=x1, y=y1),
        DucPoint(x=x2, y=y2)
    ]
    
    # Create a line connecting the points
    start_ref = DucLineReference(index=0, handle=GeometricPoint(x=0, y=0))
    end_ref = DucLineReference(index=1, handle=GeometricPoint(x=0, y=0))
    lines = [DucLine(start=start_ref, end=end_ref)]
    
    # Create the last committed point
    last_committed_point = DucPoint(x=x2, y=y2)
    
    # Create empty bindings (leaders typically don't bind to specific elements)
    start_binding = DucPointBinding(
        element_id="",
        focus=0.0,
        gap=0.0
    )
    end_binding = DucPointBinding(
        element_id="",
        focus=0.0,
        gap=0.0
    )
    
    linear_base = DucLinearElementBase(
        base=create_element_base(
            x=min(x1, x2), y=min(y1, y2),
            width=abs(x2 - x1), height=abs(y2 - y1),
            **kwargs
        ),
        points=duc_points,
        lines=lines,
        path_overrides=[],
        last_committed_point=last_committed_point,
        start_binding=start_binding,
        end_binding=end_binding
    )
    
    if style is None:
        style = create_leader_style()
    
    element = DucLeaderElement(
        linear_base=linear_base,
        style=style,
        content_anchor=GeometricPoint(x=content_anchor_x, y=content_anchor_y),
        content=content
    )
    
    return ElementWrapper(element=element)


def create_leader_style():
    """Create a default leader style."""
    from .style_builders import create_simple_styles
    
    # Create a basic leader style that matches the schema
    class DucLeaderStyle:
        def __init__(self):
            self.base_style = create_simple_styles()
            self.heads_override = []  # Empty list for heads override
            self.dogleg = 10.0  # Default dogleg length
            self.text_style = None  # No text style override
            self.text_attachment = None  # No text attachment override
            self.block_attachment = None  # No block attachment override
    
    return DucLeaderStyle()


def create_position_tolerance_fcf(
    x: float, y: float, width: float, height: float,
    tolerance_value: str,
    primary_datum: str = "A",
    secondary_datum: str = "B", 
    tertiary_datum: str = "C",
    leader_element_id: Optional[str] = None,
    **kwargs
) -> ElementWrapper:
    """Create a position tolerance feature control frame."""
    # Create tolerance clause
    tolerance = create_tolerance_clause(
        value=tolerance_value,
        zone_type=None,  # Could be TOLERANCE_ZONE_TYPE.CYLINDRICAL
        material_condition=None  # Could be MATERIAL_CONDITION.MAXIMUM_MATERIAL
    )
    
    # Create datum references
    datums = [
        create_datum_reference(primary_datum),
        create_datum_reference(secondary_datum),
        create_datum_reference(tertiary_datum)
    ]
    
    # Create segment
    segment = create_feature_control_frame_segment(
        symbol=GDT_SYMBOL.POSITION,
        tolerance=tolerance,
        datums=datums
    )
    
    # Create FCFSegmentRow with single segment
    fcf_row = FCFSegmentRow(segments=[segment])
    
    # Create FCF with single row
    return create_feature_control_frame_element(
        x=x, y=y, width=width, height=height,
        rows=[fcf_row],
        leader_element_id=leader_element_id,
        **kwargs
    )


def create_flatness_tolerance_fcf(
    x: float, y: float, width: float, height: float,
    tolerance_value: str,
    leader_element_id: Optional[str] = None,
    **kwargs
) -> ElementWrapper:
    """Create a flatness tolerance feature control frame."""
    # Create tolerance clause
    tolerance = create_tolerance_clause(value=tolerance_value)
    
    # Create segment (flatness doesn't use datums)
    segment = create_feature_control_frame_segment(
        symbol=GDT_SYMBOL.FLATNESS,
        tolerance=tolerance,
        datums=[]
    )
    
    # Create FCFSegmentRow with single segment
    fcf_row = FCFSegmentRow(segments=[segment])
    
    # Create FCF with single row
    return create_feature_control_frame_element(
        x=x, y=y, width=width, height=height,
        rows=[fcf_row],
        leader_element_id=leader_element_id,
        **kwargs
    )


def create_datum_feature_symbol(
    x: float, y: float, width: float, height: float,
    datum_letter: str,
    feature_binding: Optional[DucPointBinding] = None,
    **kwargs
) -> ElementWrapper:
    """Create a datum feature symbol."""
    datum_definition = create_fcf_datum_definition(
        letter=datum_letter,
        feature_binding=feature_binding
    )
    
    return create_feature_control_frame_element(
        x=x, y=y, width=width, height=height,
        rows=[],  # Empty for datum symbols
        datum_definition=datum_definition,
        **kwargs
    )