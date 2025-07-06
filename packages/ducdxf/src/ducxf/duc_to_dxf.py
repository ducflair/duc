"""
Module for converting DUC format to DXF format.
"""

import os
import math
import base64
from typing import Dict, List, Tuple, Any, Optional, Union
import tempfile
from pathlib import Path

# Import ducpy for working with DUC files
try:
    import ducpy
except ImportError:
    raise ImportError("ducpy module is required. Install it using 'pip install ducpy'")

# Import ezdxf for working with DXF files
try:
    import ezdxf
    from ezdxf.math import Vec2, Vec3
except ImportError:
    raise ImportError("ezdxf module is required. Install it with 'pip install ezdxf'")

# Import common utilities
from .common import (
    DXF_SUPPORTED_VERSIONS,
    DEFAULT_DXF_VERSION,
    DEFAULT_LAYER,
    ColorMapping,
    ElementTypeMapping,
    map_stroke_style,
    Point2D,
)

# Import shape detection utilities
from .utils.shape_detection import detect_shape

def convert_duc_to_dxf(
    duc_path: Union[str, Path],
    dxf_path: Optional[Union[str, Path]] = None,
    dxf_version: str = DEFAULT_DXF_VERSION,
) -> str:
    """
    Convert a DUC file to DXF format.
    
    Args:
        duc_path: Path to the DUC file
        dxf_path: Optional path for the output DXF file. If not provided, 
                  replaces the .duc extension with .dxf
        dxf_version: DXF version to use (default: R2018)
    
    Returns:
        Path to the created DXF file
    """
    # Validate inputs
    duc_path = Path(duc_path)
    if not duc_path.exists():
        raise FileNotFoundError(f"DUC file not found: {duc_path}")
    
    if dxf_version not in DXF_SUPPORTED_VERSIONS:
        raise ValueError(f"Unsupported DXF version: {dxf_version}. Supported versions: {', '.join(DXF_SUPPORTED_VERSIONS)}")
    
    # Determine output path if not provided
    if dxf_path is None:
        dxf_path = duc_path.with_suffix(".dxf")
    else:
        dxf_path = Path(dxf_path)
    
    # Parse the DUC file
    duc_data = ducpy.parse.parse_duc(duc_path)
    
    # Create a new DXF document
    doc = ezdxf.new(dxf_version)
    msp = doc.modelspace()
    
    # Process all elements in the DUC file
    if hasattr(duc_data, "elements") and duc_data.elements:
        for element in duc_data.elements:
            _add_element_to_dxf(element, msp, doc)
    
    # Save the DXF file
    doc.saveas(dxf_path)
    
    return str(dxf_path)

def _add_element_to_dxf(element: Any, msp: Any, doc: Any) -> None:
    """
    Add a DUC element to the DXF modelspace.
    
    Args:
        element: The DUC element to convert
        msp: The DXF modelspace
        doc: The DXF document
    """
    # Skip elements without type or points
    if not hasattr(element, "type") or not hasattr(element, "points") or not element.points:
        return
    
    # Get element type
    element_type = element.type.lower() if hasattr(element, "type") else "unknown"
    
    # Map to DXF entity type
    dxf_type = ElementTypeMapping.get_dxf_type(element_type)
    
    # Get style properties
    style_props = {}
    if hasattr(element, "style"):
        style_props = map_stroke_style(element.style)
    
    # Process based on element type
    if element_type == "rectangle":
        _add_rectangle(element, msp, style_props)
    elif element_type == "ellipse":
        _add_ellipse(element, msp, style_props)
    elif element_type == "line":
        _add_line(element, msp, style_props)
    elif element_type == "text":
        _add_text(element, msp, style_props)
    elif element_type == "draw" or element_type == "polyline":
        _add_polyline(element, msp, style_props)
    elif element_type == "image":
        _add_image(element, msp, doc, style_props)
    # Add more element types as needed
    else:
        # Default to polyline for unknown types
        _add_polyline(element, msp, style_props)

def _add_rectangle(element: Any, msp: Any, style_props: Dict[str, Any]) -> None:
    """Add a rectangle element to the DXF modelspace"""
    # Extract points
    points = _get_element_points(element)
    if len(points) < 2:
        return  # Need at least 2 points for a rectangle
    
    # For a rectangle, we need to create a closed polyline with 4 vertices
    # We assume the first and last points define opposite corners
    x1, y1 = points[0]
    x2, y2 = points[-1]
    
    # Create rectangle vertices
    vertices = [
        (x1, y1),
        (x2, y1),
        (x2, y2),
        (x1, y2),
        (x1, y1)  # Close the polyline
    ]
    
    # Create polyline
    polyline = msp.add_lwpolyline(vertices, dxfattribs=style_props)
    polyline.close(True)  # Ensure it's closed

def _add_ellipse(element: Any, msp: Any, style_props: Dict[str, Any]) -> None:
    """Add an ellipse element to the DXF modelspace"""
    # Extract points
    points = _get_element_points(element)
    if len(points) < 2:
        return  # Need at least 2 points for an ellipse
    
    # For an ellipse, we need center and major/minor axis lengths
    # We assume the first point is the center and calculate radii from bounds
    
    # Find bounding box
    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    
    # Calculate center and radius
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    radius_x = (max_x - min_x) / 2
    radius_y = (max_y - min_y) / 2
    
    # If radii are very close, create a circle
    if abs(radius_x - radius_y) < 0.001:
        msp.add_circle((center_x, center_y, 0), radius_x, dxfattribs=style_props)
    else:
        # Create ellipse - DXF uses a different representation with major axis and ratio
        major_axis = Vec3(radius_x, 0, 0)
        ratio = radius_y / radius_x
        msp.add_ellipse(
            center=(center_x, center_y, 0),
            major_axis=major_axis,
            ratio=ratio,
            dxfattribs=style_props
        )

def _add_line(element: Any, msp: Any, style_props: Dict[str, Any]) -> None:
    """Add a line element to the DXF modelspace"""
    # Extract points
    points = _get_element_points(element)
    if len(points) < 2:
        return  # Need at least 2 points for a line
    
    # Create a simple line between first and last points
    start_point = points[0]
    end_point = points[-1]
    
    msp.add_line(
        start=(start_point[0], start_point[1], 0),
        end=(end_point[0], end_point[1], 0),
        dxfattribs=style_props
    )

def _add_text(element: Any, msp: Any, style_props: Dict[str, Any]) -> None:
    """Add a text element to the DXF modelspace"""
    # Extract text content
    text_content = ""
    if hasattr(element, "text"):
        text_content = element.text
    elif hasattr(element, "content") and hasattr(element.content, "text"):
        text_content = element.content.text
    
    if not text_content:
        return  # No text to add
    
    # Extract position (use first point as insertion point)
    points = _get_element_points(element)
    if not points:
        return  # No position information
    
    insertion_point = (points[0][0], points[0][1], 0)
    
    # Extract text properties
    text_height = 2.5  # Default height
    if hasattr(element, "style") and "fontSize" in element.style:
        text_height = element.style["fontSize"] / 10  # Scale appropriately
    
    # Text alignment
    halign = "LEFT"  # Default
    valign = "BASELINE"  # Default
    if hasattr(element, "style") and "textAlign" in element.style:
        align = element.style["textAlign"].upper()
        if align == "CENTER":
            halign = "CENTER"
        elif align == "RIGHT":
            halign = "RIGHT"
    
    # Combine style props with text-specific attributes
    text_props = {
        **style_props,
        "height": text_height,
        "style": "Standard",  # Default text style
    }
    
    # Add text entity
    msp.add_text(
        text=text_content,
        dxfattribs=text_props,
        insert=insertion_point,
        halign=halign,
        valign=valign
    )

def _add_polyline(element: Any, msp: Any, style_props: Dict[str, Any]) -> None:
    """Add a polyline element to the DXF modelspace"""
    # Extract points
    points = _get_element_points(element)
    if len(points) < 2:
        return  # Need at least 2 points for a polyline
    
    # Determine if the polyline should be closed
    closed = False
    if hasattr(element, "closed") and element.closed:
        closed = True
    
    # Add the polyline
    polyline = msp.add_lwpolyline(points, dxfattribs=style_props)
    if closed:
        polyline.close(True)

def _add_image(element: Any, msp: Any, doc: Any, style_props: Dict[str, Any]) -> None:
    """Add an image element to the DXF modelspace"""
    # Check if we have image data
    image_data = None
    if hasattr(element, "image") and hasattr(element.image, "data"):
        image_data = element.image.data
    elif hasattr(element, "content") and hasattr(element.content, "data"):
        image_data = element.content.data
    
    if not image_data:
        return  # No image data
    
    # Extract position and size information
    points = _get_element_points(element)
    if len(points) < 2:
        return  # Need at least 2 points for image bounds
    
    # Find bounding box
    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    
    # Image size
    width = max_x - min_x
    height = max_y - min_y
    
    # Save image data to temporary file
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        # Decode base64 data if needed
        if isinstance(image_data, str) and image_data.startswith("data:image"):
            # Extract the base64 part
            img_format, img_data = image_data.split(",", 1)
            binary_data = base64.b64decode(img_data)
            temp_file.write(binary_data)
        elif isinstance(image_data, bytes):
            temp_file.write(image_data)
        else:
            return  # Unsupported image data format
        
        temp_file_path = temp_file.name
    
    try:
        # Add image definition
        img_def = doc.add_image_def(filename=temp_file_path, size_in_pixels=(width, height))
        
        # Add image to modelspace
        msp.add_image(
            image_def=img_def,
            insert=(min_x, min_y, 0),  # Lower-left corner
            size_in_units=(width, height),
            rotation=0
        )
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file_path)
        except:
            pass

def _get_element_points(element: Any) -> List[Point2D]:
    """
    Extract points from a DUC element.
    
    Args:
        element: The DUC element
    
    Returns:
        List of points as (x, y) tuples
    """
    points = []
    
    # Check for points attribute
    if hasattr(element, "points") and element.points:
        for point in element.points:
            if hasattr(point, "x") and hasattr(point, "y"):
                points.append((point.x, point.y))
            elif isinstance(point, (list, tuple)) and len(point) >= 2:
                points.append((point[0], point[1]))
    
    return points

# Additional helper functions can be added as needed 