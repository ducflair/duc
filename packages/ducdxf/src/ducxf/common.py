"""
Common utilities and constants for DUC <-> DXF conversion.
"""

import math
from enum import Enum
from typing import Dict, List, Tuple, Any, Optional, Union
import re

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

# Linetype conversion utilities
class LinetypeConverter:
    """Utilities for converting between DXF linetypes and DUC stroke styles."""
    
    @staticmethod
    def parse_dxf_pattern(pattern: List[Union[float, str]]) -> Dict[str, Any]:
        """
        Parse DXF linetype pattern into DUC-compatible components.
        
        Args:
            pattern: DXF pattern list where:
                - First element may be total length (optional)
                - Positive values = line segments
                - Negative values = gaps
                - Zero = dot
                - String elements = complex pattern with text/shapes
        
        Returns:
            dict with:
                - dash_pattern: List of floats for simple dash patterns
                - is_complex: Boolean indicating if pattern has text/shapes
                - complex_elements: List of parsed complex elements (if any)
        """
        result = {
            "dash_pattern": [],
            "is_complex": False,
            "complex_elements": [],
            "description": ""
        }
        
        if not pattern:
            return result
        
        # Convert pattern elements
        dash_pattern = []
        for elem in pattern:
            if isinstance(elem, str):
                # Complex linetype with text or shapes
                result["is_complex"] = True
                parsed = LinetypeConverter._parse_complex_element(elem)
                if parsed:
                    result["complex_elements"].append(parsed)
            elif isinstance(elem, (int, float)):
                # Simple numeric pattern element
                # Convert to absolute value for dash pattern
                # In DUC, dash pattern is [line, gap, line, gap, ...]
                dash_pattern.append(abs(float(elem)))
        
        result["dash_pattern"] = dash_pattern
        return result
    
    @staticmethod
    def _parse_complex_element(element_str: str) -> Optional[Dict[str, Any]]:
        """
        Parse complex linetype element (text or shape).
        
        Format examples:
            - Text: ["GAS",STANDARD,S=.1,U=0.0,X=-0.1,Y=-.05]
            - Shape: [132,ltypeshp.shx,x=-.1,s=.1]
        
        Args:
            element_str: Complex element string from DXF
        
        Returns:
            Parsed element dict or None if parsing fails
        """
        # Remove brackets and split
        clean_str = element_str.strip('[]')
        if not clean_str:
            return None
        
        parts = [p.strip() for p in clean_str.split(',')]
        if not parts:
            return None
        
        # Check if it's a text element (starts with quoted text)
        if parts[0].startswith('"') or parts[0].startswith("'"):
            return LinetypeConverter._parse_text_element(parts)
        else:
            return LinetypeConverter._parse_shape_element(parts)
    
    @staticmethod
    def _parse_text_element(parts: List[str]) -> Dict[str, Any]:
        """Parse text element from complex linetype."""
        result = {
            "type": "text",
            "text": parts[0].strip('"\"'),
            "style": parts[1] if len(parts) > 1 else "STANDARD",
            "scale": 0.1,
            "rotation": 0.0,
            "x_offset": 0.0,
            "y_offset": 0.0
        }
        
        # Parse parameters like S=.1, U=0.0, X=-0.1, Y=-.05
        for part in parts[2:]:
            if '=' in part:
                key, value = part.split('=', 1)
                key = key.strip().upper()
                try:
                    val = float(value.strip())
                    if key == 'S':
                        result['scale'] = val
                    elif key == 'U':
                        result['rotation'] = val
                    elif key == 'X':
                        result['x_offset'] = val
                    elif key == 'Y':
                        result['y_offset'] = val
                except ValueError:
                    pass
        
        return result
    
    @staticmethod
    def _parse_shape_element(parts: List[str]) -> Dict[str, Any]:
        """Parse shape element from complex linetype."""
        result = {
            "type": "shape",
            "shape_index": 0,
            "shape_file": "",
            "scale": 0.1,
            "x_offset": 0.0,
            "y_offset": 0.0
        }
        
        # First part is shape index
        try:
            result["shape_index"] = int(parts[0])
        except ValueError:
            pass
        
        # Second part is shape file
        if len(parts) > 1:
            result["shape_file"] = parts[1].strip()
        
        # Parse parameters like x=-.1, s=.1
        for part in parts[2:]:
            if '=' in part:
                key, value = part.split('=', 1)
                key = key.strip().lower()
                try:
                    val = float(value.strip())
                    if key == 's':
                        result['scale'] = val
                    elif key == 'x':
                        result['x_offset'] = val
                    elif key == 'y':
                        result['y_offset'] = val
                except ValueError:
                    pass
        
        return result
    
    @staticmethod
    def convert_dxf_pattern_to_duc_dash(pattern: List[Union[float, str]]) -> List[float]:
        """
        Convert DXF pattern to DUC dash pattern (simplified, ignoring complex elements).
        
        Args:
            pattern: DXF pattern list
        
        Returns:
            List of floats representing dash pattern [line, gap, line, gap, ...]
        """
        parsed = LinetypeConverter.parse_dxf_pattern(pattern)
        return parsed["dash_pattern"]
    
    @staticmethod
    def pattern_to_description(name: str, pattern: List[Union[float, str]]) -> str:
        """
        Generate a description for a linetype pattern.
        
        Args:
            name: Linetype name
            pattern: DXF pattern
        
        Returns:
            Human-readable description
        """
        parsed = LinetypeConverter.parse_dxf_pattern(pattern)
        
        if parsed["is_complex"]:
            return f"{name} (complex pattern with {len(parsed['complex_elements'])} elements)"
        elif parsed["dash_pattern"]:
            return f"{name} (dash pattern)"
        else:
            return f"{name} (continuous)"


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