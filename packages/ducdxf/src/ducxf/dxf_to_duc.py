"""
Module for converting DXF format to DUC format.
"""

import os
import math
import base64
import uuid
from typing import Dict, List, Tuple, Any, Optional, Union, Set
from pathlib import Path
import tempfile

# Import ducpy for working with DUC files
try:
    import ducpy
    from ducpy.utils import ElementTypes
except ImportError:
    raise ImportError("ducpy module is required. Install it using 'pip install ducpy'")

# Import ezdxf for working with DXF files
try:
    import ezdxf
    from ezdxf.layouts import Modelspace
    from ezdxf.entities import DXFEntity
except ImportError:
    raise ImportError("ezdxf module is required. Install it with 'pip install ezdxf'")

# Import common utilities
from .common import (
    DEFAULT_LAYER,
    ColorMapping,
    ElementTypeMapping,
    Point2D,
)

# Import shape detection utilities
from .utils.shape_detection import detect_shape

def convert_dxf_to_duc(
    dxf_path: Union[str, Path],
    duc_path: Optional[Union[str, Path]] = None,
) -> str:
    """
    Convert a DXF file to DUC format.
    
    Args:
        dxf_path: Path to the DXF file
        duc_path: Optional path for the output DUC file. If not provided, 
                  replaces the .dxf extension with .duc
    
    Returns:
        Path to the created DUC file
    """
    # Validate inputs
    dxf_path = Path(dxf_path)
    if not dxf_path.exists():
        raise FileNotFoundError(f"DXF file not found: {dxf_path}")
    
    # Determine output path if not provided
    if duc_path is None:
        duc_path = dxf_path.with_suffix(".duc")
    else:
        duc_path = Path(duc_path)
    
    # Load the DXF file
    try:
        dxf_doc = ezdxf.readfile(dxf_path)
    except Exception as e:
        raise ValueError(f"Failed to read DXF file: {e}")
    
    # Create a DUC document structure
    duc_doc = _create_empty_duc_document()
    
    # Get modelspace
    msp = dxf_doc.modelspace()
    
    # Process all entities in modelspace
    for entity in msp:
        # Skip non-graphical entities
        if not hasattr(entity, "dxftype"):
            continue
        
        # Convert entity to DUC element
        duc_element = _convert_entity_to_duc_element(entity)
        if duc_element:
            duc_doc["elements"].append(duc_element)
    
    # Create binary files collection (for images)
    binary_files = _process_images(dxf_doc, msp)
    if binary_files:
        duc_doc["binaryFiles"] = binary_files
    
    # Create app state
    duc_doc["appState"] = _create_app_state()
    
    # Serialize DUC document
    ducpy.serialize.serialize_duc(duc_doc, duc_path)
    
    return str(duc_path)

def _create_empty_duc_document() -> Dict[str, Any]:
    """
    Create an empty DUC document structure.
    
    Returns:
        Dict with the basic DUC document structure
    """
    return {
        "version": 1,
        "elements": [],
        "appState": {},
        "binaryFiles": {}
    }

def _create_app_state() -> Dict[str, Any]:
    """
    Create a basic app state for the DUC document.
    
    Returns:
        Dict with app state information
    """
    return {
        "viewportX": 0,
        "viewportY": 0,
        "viewportZoom": 1,
        "selectedElementIds": [],
        "currentItemType": "select"
    }

def _convert_entity_to_duc_element(entity: DXFEntity) -> Optional[Dict[str, Any]]:
    """
    Convert a DXF entity to a DUC element.
    
    Args:
        entity: The DXF entity to convert
    
    Returns:
        Dict representing the DUC element, or None if conversion is not possible
    """
    dxf_type = entity.dxftype()
    
    # Map DXF type to DUC type
    duc_type = ElementTypeMapping.get_duc_type(dxf_type)
    
    # Get entity properties
    common_props = _get_common_entity_props(entity)
    
    # Create base element structure
    element = {
        "id": str(uuid.uuid4()),
        "type": duc_type,
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "points": [],
        "style": _convert_entity_style(entity),
        "isLocked": False,
        "isDeleted": False,
        "groupIds": [],
        **common_props
    }
    
    # Handle specific entity types
    if dxf_type == "LINE":
        _convert_line(entity, element)
    elif dxf_type == "LWPOLYLINE":
        _convert_lwpolyline(entity, element)
    elif dxf_type == "POLYLINE":
        _convert_polyline(entity, element)
    elif dxf_type == "CIRCLE":
        _convert_circle(entity, element)
    elif dxf_type == "ELLIPSE":
        _convert_ellipse(entity, element)
    elif dxf_type == "TEXT" or dxf_type == "MTEXT":
        _convert_text(entity, element)
    elif dxf_type == "IMAGE":
        _convert_image(entity, element)
    elif dxf_type == "HATCH":
        _convert_hatch(entity, element)
    else:
        # Unsupported entity type
        return None
    
    # Calculate bounding box
    if element["points"]:
        x_coords = [p["x"] for p in element["points"]]
        y_coords = [p["y"] for p in element["points"]]
        
        element["x"] = min(x_coords)
        element["y"] = min(y_coords)
        element["width"] = max(x_coords) - element["x"]
        element["height"] = max(y_coords) - element["y"]
    
    return element

def _get_common_entity_props(entity: DXFEntity) -> Dict[str, Any]:
    """
    Extract common properties from a DXF entity.
    
    Args:
        entity: The DXF entity
    
    Returns:
        Dict with common properties
    """
    props = {}
    
    # Layer information
    if hasattr(entity, "dxf") and hasattr(entity.dxf, "layer"):
        layer = entity.dxf.layer
        if layer and layer != "0":
            props["layer"] = layer
    
    return props

def _convert_entity_style(entity: DXFEntity) -> Dict[str, Any]:
    """
    Convert DXF entity style properties to DUC style.
    
    Args:
        entity: The DXF entity
    
    Returns:
        Dict with DUC style properties
    """
    style = {
        "stroke": {
            "width": 1,
            "style": "solid",
            "color": [0, 0, 0, 1]  # Default black
        },
        "fill": None
    }
    
    # Color
    if hasattr(entity, "dxf") and hasattr(entity.dxf, "color"):
        aci_color = entity.dxf.color
        rgba = ColorMapping.aci_to_duc_rgba(aci_color)
        style["stroke"]["color"] = list(rgba)
    
    # Line weight
    if hasattr(entity, "dxf") and hasattr(entity.dxf, "lineweight"):
        # Convert from DXF lineweight to DUC stroke width
        # DXF: lineweight is in 100th of mm, -1 means default
        lineweight = entity.dxf.lineweight
        if lineweight > 0:
            style["stroke"]["width"] = lineweight / 100  # Scale appropriately
    
    # Line type
    if hasattr(entity, "dxf") and hasattr(entity.dxf, "linetype"):
        linetype = entity.dxf.linetype
        if linetype == "DASHED":
            style["stroke"]["style"] = "dashed"
        elif linetype == "DOTTED":
            style["stroke"]["style"] = "dotted"
        # Add more mappings as needed
    
    return style

def _convert_line(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF LINE entity to DUC line element.
    
    Args:
        entity: The DXF LINE entity
        element: The DUC element dict to update
    """
    # Get start and end points
    start_point = (entity.dxf.start.x, entity.dxf.start.y)
    end_point = (entity.dxf.end.x, entity.dxf.end.y)
    
    # Add points to the element
    element["points"] = [
        {"x": start_point[0], "y": start_point[1]},
        {"x": end_point[0], "y": end_point[1]}
    ]

def _convert_lwpolyline(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF LWPOLYLINE entity to DUC element.
    
    Args:
        entity: The DXF LWPOLYLINE entity
        element: The DUC element dict to update
    """
    # Get all vertices
    points = []
    for vertex in entity.vertices():
        # LWPOLYLINE vertices are (x, y, bulge) tuples
        x, y = vertex[0], vertex[1]
        points.append({"x": x, "y": y})
    
    # Add points to the element
    element["points"] = points
    
    # Set closed property
    if hasattr(entity, "closed") and entity.closed:
        element["closed"] = True
    
    # Try to detect common shapes
    element["type"] = detect_shape(points)

def _convert_polyline(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF POLYLINE entity to DUC element.
    
    Args:
        entity: The DXF POLYLINE entity
        element: The DUC element dict to update
    """
    # Get all vertices
    points = []
    for vertex in entity.vertices():
        # Extract x, y coordinates from vertex
        if hasattr(vertex, "dxf"):
            x, y = vertex.dxf.location.x, vertex.dxf.location.y
            points.append({"x": x, "y": y})
    
    # Add points to the element
    element["points"] = points
    
    # Set closed property
    if hasattr(entity, "is_closed") and entity.is_closed:
        element["closed"] = True
    
    # Try to detect common shapes
    element["type"] = detect_shape(points)

def _convert_circle(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF CIRCLE entity to DUC ellipse element.
    
    Args:
        entity: The DXF CIRCLE entity
        element: The DUC element dict to update
    """
    # Set type to ellipse (circle is a special case)
    element["type"] = "ellipse"
    
    # Get center and radius
    center_x = entity.dxf.center.x
    center_y = entity.dxf.center.y
    radius = entity.dxf.radius
    
    # Create points for a circle
    # We use 4 points at cardinal directions plus the center
    element["points"] = [
        {"x": center_x, "y": center_y},              # Center
        {"x": center_x + radius, "y": center_y},     # Right
        {"x": center_x, "y": center_y + radius},     # Top
        {"x": center_x - radius, "y": center_y},     # Left
        {"x": center_x, "y": center_y - radius}      # Bottom
    ]

def _convert_ellipse(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF ELLIPSE entity to DUC ellipse element.
    
    Args:
        entity: The DXF ELLIPSE entity
        element: The DUC element dict to update
    """
    # Set type to ellipse
    element["type"] = "ellipse"
    
    # Get ellipse parameters
    center_x = entity.dxf.center.x
    center_y = entity.dxf.center.y
    
    # Major and minor axis
    major_x = entity.dxf.major_axis.x
    major_y = entity.dxf.major_axis.y
    minor_length = entity.dxf.ratio * math.sqrt(major_x**2 + major_y**2)
    
    # Calculate the angle of the major axis
    major_angle = math.atan2(major_y, major_x)
    
    # Minor axis direction
    minor_x = -math.sin(major_angle) * minor_length
    minor_y = math.cos(major_angle) * minor_length
    
    # Create points for the ellipse
    # Center, major axis, minor axis
    element["points"] = [
        {"x": center_x, "y": center_y},                          # Center
        {"x": center_x + major_x, "y": center_y + major_y},      # Major axis
        {"x": center_x + minor_x, "y": center_y + minor_y}       # Minor axis
    ]

def _convert_text(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF TEXT or MTEXT entity to DUC text element.
    
    Args:
        entity: The DXF TEXT or MTEXT entity
        element: The DUC element dict to update
    """
    # Set type to text
    element["type"] = "text"
    
    # Get text content
    text_content = ""
    if entity.dxftype() == "TEXT":
        text_content = entity.dxf.text
    else:  # MTEXT
        text_content = entity.text
    
    # Add text content
    element["text"] = text_content
    
    # Get insertion point
    if entity.dxftype() == "TEXT":
        insert_x = entity.dxf.insert.x
        insert_y = entity.dxf.insert.y
    else:  # MTEXT
        insert_x = entity.dxf.insert.x
        insert_y = entity.dxf.insert.y
    
    # Add insertion point
    element["points"] = [{"x": insert_x, "y": insert_y}]
    
    # Get text height
    if hasattr(entity, "dxf") and hasattr(entity.dxf, "height"):
        height = entity.dxf.height
        element["style"]["fontSize"] = height * 10  # Scale appropriately
    
    # Get text alignment
    if entity.dxftype() == "TEXT" and hasattr(entity, "dxf"):
        if hasattr(entity.dxf, "halign"):
            halign = entity.dxf.halign
            if halign == 1:  # CENTER
                element["style"]["textAlign"] = "center"
            elif halign == 2:  # RIGHT
                element["style"]["textAlign"] = "right"
            else:  # Default to LEFT
                element["style"]["textAlign"] = "left"

def _convert_image(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF IMAGE entity to DUC image element.
    
    Args:
        entity: The DXF IMAGE entity
        element: The DUC element dict to update
    """
    # Set type to image
    element["type"] = "image"
    
    # Get insertion point and size
    insert_x = entity.dxf.insert.x
    insert_y = entity.dxf.insert.y
    
    # Get image size
    if hasattr(entity, "dxf") and hasattr(entity.dxf, "image_size"):
        width = entity.dxf.image_size.x
        height = entity.dxf.image_size.y
    else:
        # Default size if not available
        width = 100
        height = 100
    
    # Create points for image corners
    element["points"] = [
        {"x": insert_x, "y": insert_y},                      # Bottom-left
        {"x": insert_x + width, "y": insert_y},              # Bottom-right
        {"x": insert_x + width, "y": insert_y + height},     # Top-right
        {"x": insert_x, "y": insert_y + height}              # Top-left
    ]
    
    # Image path - store the reference to be processed later
    if hasattr(entity, "image_def") and hasattr(entity.image_def, "filename"):
        element["image_path"] = entity.image_def.filename

def _convert_hatch(entity: DXFEntity, element: Dict[str, Any]) -> None:
    """
    Convert DXF HATCH entity to DUC element.
    
    Args:
        entity: The DXF HATCH entity
        element: The DUC element dict to update
    """
    # Set type based on shape detection
    element["type"] = "draw"  # Default
    
    # Get boundary paths
    paths = []
    for path in entity.paths:
        points = []
        for vertex in path.vertices:
            points.append({"x": vertex[0], "y": vertex[1]})
        
        if points:
            paths.append(points)
    
    if paths:
        # Use the first path as the element's points
        element["points"] = paths[0]
        
        # Set closed property
        element["closed"] = True
        
        # Try to detect common shapes
        element["type"] = detect_shape(paths[0])
    
    # Add fill style
    if hasattr(entity, "dxf"):
        fill_color = None
        if hasattr(entity.dxf, "color"):
            aci_color = entity.dxf.color
            rgba = ColorMapping.aci_to_duc_rgba(aci_color)
            fill_color = list(rgba)
        
        if fill_color:
            element["style"]["fill"] = fill_color

def _process_images(dxf_doc: Any, msp: Modelspace) -> Dict[str, Any]:
    """
    Process images in the DXF document and create binary files data.
    
    Args:
        dxf_doc: The DXF document
        msp: The modelspace
    
    Returns:
        Dict with binary files data
    """
    binary_files = {}
    
    # Process all image entities
    for entity in msp.query("IMAGE"):
        if hasattr(entity, "image_def") and hasattr(entity.image_def, "filename"):
            image_path = entity.image_def.filename
            
            # Check if the image file exists
            if not os.path.exists(image_path):
                continue
            
            try:
                # Read image file
                with open(image_path, "rb") as f:
                    image_data = f.read()
                
                # Create unique ID for the image
                image_id = str(uuid.uuid4())
                
                # Add to binary files
                binary_files[image_id] = {
                    "id": image_id,
                    "mimeType": _get_mime_type(image_path),
                    "data": base64.b64encode(image_data).decode("utf-8")
                }
                
                # Update image entities with the binary file reference
                for img_entity in msp.query("IMAGE"):
                    if hasattr(img_entity, "image_def") and img_entity.image_def.filename == image_path:
                        for element in binary_files.get("elements", []):
                            if element.get("type") == "image" and element.get("image_path") == image_path:
                                element["image"] = {"fileId": image_id}
                                # Remove temporary reference
                                if "image_path" in element:
                                    del element["image_path"]
            except Exception as e:
                print(f"Error processing image {image_path}: {e}")
    
    return binary_files

def _get_mime_type(file_path: str) -> str:
    """
    Get MIME type based on file extension.
    
    Args:
        file_path: Path to the file
    
    Returns:
        MIME type string
    """
    extension = os.path.splitext(file_path)[1].lower()
    
    mime_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".tif": "image/tiff",
        ".tiff": "image/tiff"
    }
    
    return mime_types.get(extension, "application/octet-stream") 