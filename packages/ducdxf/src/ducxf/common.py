"""
Common utilities and constants for DUC <-> DXF conversion.
"""

import math
from enum import Enum
from typing import Dict, List, Tuple, Any, Optional, Union

# Type definitions
Point2D = Tuple[float, float]

# Constants
DXF_SUPPORTED_VERSIONS = ["R12", "R2000", "R2004", "R2007", "R2010", "R2013", "R2018"]
DEFAULT_DXF_VERSION = "R2018"  # Most recent version by default

# Layer name constants
DEFAULT_LAYER = "0"

# Color mapping (can be extended as needed)
class ColorMapping:
    @staticmethod
    def duc_to_aci(rgba: Tuple[float, float, float, float]) -> int:
        """Convert Duc RGBA color to AutoCAD Color Index (ACI)"""
        # Simplified mapping - could be improved with a better color matching algorithm
        r, g, b, a = rgba
        
        # For transparent objects, use a special handling
        if a < 0.5:
            return 0  # BYBLOCK
            
        # Simplified color conversion - map to nearest standard ACI color
        # This is a very basic implementation and could be improved
        if r > 0.8 and g > 0.8 and b > 0.8:
            return 7  # White
        elif r > 0.8 and g < 0.2 and b < 0.2:
            return 1  # Red
        elif r < 0.2 and g > 0.8 and b < 0.2:
            return 3  # Green
        elif r < 0.2 and g < 0.2 and b > 0.8:
            return 5  # Blue
        elif r > 0.8 and g > 0.8 and b < 0.2:
            return 2  # Yellow
        elif r < 0.2 and g > 0.8 and b > 0.8:
            return 4  # Cyan
        elif r > 0.8 and g < 0.2 and b > 0.8:
            return 6  # Magenta
        else:
            return 7  # Default to white

    @staticmethod
    def aci_to_duc_rgba(aci: int) -> Tuple[float, float, float, float]:
        """Convert AutoCAD Color Index (ACI) to Duc RGBA color"""
        # Basic conversion for standard colors
        # Could be extended for more accurate mapping
        aci_colors = {
            0: (0.0, 0.0, 0.0, 0.0),  # BYBLOCK - transparent
            1: (1.0, 0.0, 0.0, 1.0),  # Red
            2: (1.0, 1.0, 0.0, 1.0),  # Yellow
            3: (0.0, 1.0, 0.0, 1.0),  # Green
            4: (0.0, 1.0, 1.0, 1.0),  # Cyan
            5: (0.0, 0.0, 1.0, 1.0),  # Blue
            6: (1.0, 0.0, 1.0, 1.0),  # Magenta
            7: (1.0, 1.0, 1.0, 1.0),  # White/default
        }
        return aci_colors.get(aci, (0.0, 0.0, 0.0, 1.0))  # Default to black if unknown

# Helpers for geometric operations
def distance(p1: Point2D, p2: Point2D) -> float:
    """Calculate distance between two points"""
    return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)

def angle_between_points(p1: Point2D, p2: Point2D) -> float:
    """Calculate angle between two points in radians"""
    return math.atan2(p2[1] - p1[1], p2[0] - p1[0])

# Element type mapping between Duc and DXF
class ElementTypeMapping:
    # Maps Duc element types to DXF entity types
    DUC_TO_DXF = {
        "rectangle": "LWPOLYLINE",  # Rectangles become polylines in DXF
        "ellipse": "ELLIPSE",
        "diamond": "LWPOLYLINE",
        "triangle": "LWPOLYLINE",
        "line": "LINE",
        "arrow": "LWPOLYLINE",  # With arrowhead
        "draw": "LWPOLYLINE",    # Freehand drawing
        "text": "TEXT",
        "image": "IMAGE",
        # Add more mappings as needed
    }
    
    # Maps DXF entity types to Duc element types
    DXF_TO_DUC = {
        "LINE": "line",
        "LWPOLYLINE": "draw",  # Default mapping, will need to detect shapes
        "POLYLINE": "draw",
        "ELLIPSE": "ellipse",
        "CIRCLE": "ellipse",  # Circle is a special case of ellipse
        "TEXT": "text",
        "MTEXT": "text",
        "IMAGE": "image",
        # Add more mappings as needed
    }
    
    @staticmethod
    def get_dxf_type(duc_type: str) -> str:
        """Get the DXF entity type for a given Duc element type"""
        return ElementTypeMapping.DUC_TO_DXF.get(duc_type, "LWPOLYLINE")  # Default to polyline
    
    @staticmethod
    def get_duc_type(dxf_type: str) -> str:
        """Get the Duc element type for a given DXF entity type"""
        return ElementTypeMapping.DXF_TO_DUC.get(dxf_type, "draw")  # Default to freehand drawing

# Stroke style mapping
def map_stroke_style(duc_style: dict) -> Dict[str, Any]:
    """Map Duc stroke style to DXF linetype and other properties"""
    # This is a simplified mapping that could be extended
    dxf_props = {
        "linetype": "CONTINUOUS",  # Default
        "lineweight": 1,           # Default
        "color": 7                 # White/default
    }
    
    # If style information is available, map it
    if duc_style:
        # Map color
        if "stroke" in duc_style and "color" in duc_style["stroke"]:
            rgba = duc_style["stroke"]["color"]
            dxf_props["color"] = ColorMapping.duc_to_aci(rgba)
        
        # Map line thickness
        if "stroke" in duc_style and "width" in duc_style["stroke"]:
            # Scale the width appropriately for DXF
            width = duc_style["stroke"]["width"]
            dxf_props["lineweight"] = int(width * 100)  # Simple scaling, may need adjustment
        
        # Map line style (dashed, etc.)
        if "stroke" in duc_style and "style" in duc_style["stroke"]:
            style = duc_style["stroke"]["style"]
            if style == "dashed":
                dxf_props["linetype"] = "DASHED"
            elif style == "dotted":
                dxf_props["linetype"] = "DOTTED"
            # Add more mappings as needed
    
    return dxf_props 