"""
Helper functions for creating DUC elements with a user-friendly API.
"""
from math import pi
from typing import List, Optional, Union
import uuid
import time
from ..classes.ElementsClass import (
    DucRectangleElement, DucEllipseElement, DucPolygonElement,
    DucElementBase, DucElementStylesBase, ElementWrapper, BoundElement,
    DucLinearElement, DucLinearElementBase, DucPoint, DucLine, 
    DucLineReference, GeometricPoint, DucPointBinding, DucPath,
    PointBindingPoint, DucHead, ElementStroke, ElementBackground
)
from .style_builders import create_simple_styles


def create_rectangle(
    x: float,
    y: float,
    width: float,
    height: float,
    angle: float = 0.0,
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
    Create a rectangle element with a clean, modular API.
    
    Args:
        x, y: Position
        width, height: Dimensions
        angle: Rotation angle in degrees
        styles: Element styles created with style_builders functions (defaults to transparent)
        id: Unique identifier (auto-generated if None)
        label: Human-readable label
        scope: Units ("mm", "px", etc.)
        locked: Whether element is locked
        is_visible: Whether element is visible
        z_index: Layering order
        explicit_properties_override: Optional dict to override any base or element properties.
            Can contain 'base' key for DucElementBase overrides and 'element' key for 
            DucRectangleElement overrides, or direct properties to override base.
        
    Returns:
        ElementWrapper: Wrapped rectangle element ready for serialization
        
    Examples:
        # Simple rectangle with blue fill
        create_rectangle(0, 0, 100, 50, styles=solid_fill_style("#0000FF"))
        
        # Rectangle with custom styling
        custom_styles = create_simple_styles(
            backgrounds=[create_background(create_solid_content("#FF0000"))],
            strokes=[create_stroke(create_solid_content("#000000"), 2.0)]
        )
        create_rectangle(10, 10, 200, 100, styles=custom_styles)
    """
    # Generate ID if not provided
    if id is None:
        id = f"rect_{uuid.uuid4().hex[:8]}"
    
    # Use provided styles or create default transparent styles
    if styles is None:
        styles = create_simple_styles()
    
    # Create base element with sensible defaults
    current_time = int(time.time() * 1000)  # milliseconds
    base_params = {
        "id": id,
        "styles": styles,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "angle": angle,
        "scope": scope,
        "label": label,
        "description": "",
        "is_visible": is_visible,
        "seed": hash(id) % 2147483647,  # Generate deterministic seed from ID
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
        # Only apply known base parameters to avoid unexpected keyword arguments
        known_base_params = {
            "id", "label", "scope", "locked", "is_visible", "is_deleted",
            "group_ids", "region_ids", "layer_id", "frame_id", "bound_elements", 
            "z_index", "link", "custom_data"
        }
        
        # Check if it's a base override
        if 'base' in explicit_properties_override:
            for key, value in explicit_properties_override['base'].items():
                if key in known_base_params:
                    base_params[key] = value
        else:
            # Apply known base properties from override
            for key, value in explicit_properties_override.items():
                if key in known_base_params:
                    base_params[key] = value
    
    base = DucElementBase(**base_params)
    
    # Create rectangle element
    rect_params = {"base": base}
    
    # Apply element-specific overrides if they exist in explicit_properties_override
    if explicit_properties_override and 'element' in explicit_properties_override:
        rect_params.update(explicit_properties_override['element'])
        
    rectangle = DucRectangleElement(**rect_params)
    
    # Wrap and return
    return ElementWrapper(element=rectangle)


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
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create an ellipse element with a clean, modular API.
    Similar to create_rectangle but for ellipses.
    
    Args:
        ratio: Aspect ratio of the ellipse
        explicit_properties_override: Optional dict to override any base or element properties.
            Can contain 'base' key for DucElementBase overrides and 'element' key for 
            DucEllipseElement overrides, or direct properties to override base.
        
    Examples:
        # Simple circle with red fill
        create_ellipse(0, 0, 100, 100, styles=create_fill_style(create_solid_style("#FF0000")))
    """
    if id is None:
        id = f"ellipse_{uuid.uuid4().hex[:8]}"
    
    if styles is None:
        styles = create_simple_styles()
    
    current_time = int(time.time() * 1000)
    base_params = {
        "id": id,
        "styles": styles,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "angle": angle,
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
        # Check if it's a base override
        if 'base' in explicit_properties_override:
            base_params.update(explicit_properties_override)
        else:
            # Apply to base by default
            base_params.update(explicit_properties_override)
        
    base = DucElementBase(**base_params)
    
    ellipse_params = {
        "base": base, 
        "ratio": ratio,
        "start_angle": start_angle,
        "end_angle": end_angle,
        "show_aux_crosshair": show_aux_crosshair
    }
    
    # Apply element-specific overrides if they exist in explicit_properties_override
    if explicit_properties_override and 'element' in explicit_properties_override:
        ellipse_params.update(explicit_properties_override['element'])
        
    ellipse = DucEllipseElement(**ellipse_params)
    return ElementWrapper(element=ellipse)


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
    scope: str = "mm",
    locked: bool = False,
    is_visible: bool = True,
    z_index: float = 0.0,
    explicit_properties_override: Optional[dict] = None
) -> ElementWrapper:
    """
    Create a polygon element with a clean, modular API.
    Similar to create_rectangle but for polygons.
    
    Args:
        sides: Number of polygon sides
        explicit_properties_override: Optional dict to override any base or element properties.
            Can contain 'base' key for DucElementBase overrides and 'element' key for 
            DucPolygonElement overrides, or direct properties to override base.
        
    Examples:
        # Hexagon with green fill and black stroke
        create_polygon(0, 0, 100, 100, sides=6, 
                      styles=create_fill_and_stroke_style(
                          create_solid_style("#00FF00"), 
                          create_solid_style("#000000"), 
                          stroke_width=2))
    """
    if id is None:
        id = f"polygon_{uuid.uuid4().hex[:8]}"
    
    if styles is None:
        styles = create_simple_styles()
    
    current_time = int(time.time() * 1000)
    base_params = {
        "id": id,
        "styles": styles,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "angle": angle,
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
        # Check if it's a base override
        if 'base' in explicit_properties_override:
            base_params.update(explicit_properties_override)
        else:
            # Apply to base by default
            base_params.update(explicit_properties_override)
        
    base = DucElementBase(**base_params)
    
    polygon_params = {"base": base, "sides": sides}
    
    # Apply element-specific overrides if they exist in explicit_properties_override
    if explicit_properties_override and 'element' in explicit_properties_override:
        polygon_params.update(explicit_properties_override['element'])
        
    polygon = DucPolygonElement(**polygon_params)
    return ElementWrapper(element=polygon)


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
