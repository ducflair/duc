"""
Helper functions for creating DUC elements with a user-friendly API.
"""
from math import pi
from typing import List, Optional, Union, TYPE_CHECKING
import uuid
import time

if TYPE_CHECKING:
    from ..classes.StandardsClass import Standard
from ..classes.ElementsClass import (
    DucRectangleElement, DucEllipseElement, DucPolygonElement,
    DucElementBase, DucElementStylesBase, ElementWrapper, BoundElement,
    DucLinearElement, DucLinearElementBase, DucPoint, DucLine, 
    DucLineReference, GeometricPoint, DucPointBinding, DucPath,
    PointBindingPoint, DucHead, ElementStroke, ElementBackground,
    DucArrowElement, DucTextElement, DucFrameElement, DucPlotElement,
    DucViewportElement, DucStackElementBase, DucStackBase, DucStackLikeStyles,
    PlotLayout, DucView, DucPlotStyle, DucViewportStyle, Margins
)
from .style_builders import create_simple_styles
from ducpy.utils import generate_random_id, DEFAULT_SCOPE, DEFAULT_STROKE_COLOR, DEFAULT_FILL_COLOR
from ducpy.utils.rand_utils import random_versioning

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
        
    Examples:
        # Override styling for lines 0 and 1 with red stroke
        from ducpy.helpers.style_builders import create_stroke, create_solid_content
        path_override = create_path_override(
            [0, 1], 
            stroke=create_stroke(create_solid_content("#FF0000"), width=3.0)
        )
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

def create_text_element(
    x: float,
    y: float,
    text: str,
    width: float = 100,
    height: float = 20,
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
    Create a text element.
    """
    if id is None:
        id = f"text_{uuid.uuid4().hex[:8]}"

    if styles is None:
        styles = create_simple_styles()

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
        "style": None,  # Should be set by caller if needed
        "text": text,
        "dynamic": [],
        "auto_resize": False,
        "original_text": text,
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
