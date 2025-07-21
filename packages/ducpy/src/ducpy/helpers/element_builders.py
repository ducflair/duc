"""
Helper functions for creating DUC elements with a user-friendly API.
"""
from math import pi
from typing import List, Optional, Union
import uuid
import time
from ..classes.ElementsClass import (
    DucRectangleElement, DucEllipseElement, DucPolygonElement,
    DucElementBase, DucElementStylesBase, ElementWrapper, BoundElement
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
