"""
Helper functions for creating element styles with a user-friendly API.
Each ELEMENT_CONTENT_PREFERENCE has its own dedicated method.
"""
from typing import List, Optional, Union
from ..classes.ElementsClass import (
    DucElementStylesBase, ElementBackground, ElementStroke, ElementContentBase,
    StrokeStyle, StrokeSides, TilingProperties, DucHatchStyle, DucImageFilter,
    DucPoint, CustomHatchPattern
)
from ..Duc.ELEMENT_CONTENT_PREFERENCE import ELEMENT_CONTENT_PREFERENCE
from ..Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ..Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ..Duc.STROKE_JOIN import STROKE_JOIN
from ..Duc.STROKE_CAP import STROKE_CAP
from ..Duc.STROKE_SIDE_PREFERENCE import STROKE_SIDE_PREFERENCE
from ..Duc.BLENDING import BLENDING
from ..Duc.HATCH_STYLE import HATCH_STYLE


# Utility functions for creating default objects
def _create_default_tiling_properties() -> TilingProperties:
    """Create default tiling properties."""
    return TilingProperties(size_in_percent=100.0, angle=0.0)

def _create_default_hatch_style() -> DucHatchStyle:
    """Create default hatch style."""
    return DucHatchStyle(
        pattern_name="", 
        pattern_scale=1.0, 
        pattern_angle=0.0,
        pattern_origin=DucPoint(x=0.0, y=0.0, mirroring=None),
        pattern_double=False,
        hatch_style=HATCH_STYLE.NORMAL,
        custom_pattern=CustomHatchPattern(name="", description="", lines=[])
    )

def _create_default_image_filter() -> DucImageFilter:
    """Create default image filter."""
    return DucImageFilter(brightness=1.0, contrast=1.0)


def create_solid_content(color: str, opacity: float = 1.0, visible: bool = True) -> ElementContentBase:
    """
    Create solid color content.
    
    Args:
        color: Hex color string (e.g., "#FF0000")
        opacity: Content opacity (0.0 to 1.0)
        visible: Whether content is visible
        
    Returns:
        ElementContentBase: Solid color content
    """
    return ElementContentBase(
        src=color,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None  # Keep None to avoid type issues for now
    )


def create_fill_content(color: str, opacity: float = 1.0, visible: bool = True) -> ElementContentBase:
    """
    Create fill content (solid color or gradient).
    
    Args:
        color: Hex color string or gradient definition
        opacity: Content opacity (0.0 to 1.0) 
        visible: Whether content is visible
        
    Returns:
        ElementContentBase: Fill content
    """
    return ElementContentBase(
        src=color,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None  # Keep None to avoid type issues for now
    )


def create_image_content(
    image_src: str, 
    opacity: float = 1.0, 
    visible: bool = True,
    fit_mode: Optional[str] = None  # Changed to str to avoid enum issues
) -> ElementContentBase:
    """
    Create image content with various fit modes.
    
    Args:
        image_src: Can be a fileId, url, or frame element's content `@el/${elementId}`
        opacity: Content opacity (0.0 to 1.0)
        visible: Whether content is visible
        fit_mode: How image fits (FIT, TILE, STRETCH) - string for now
        
    Returns:
        ElementContentBase: Image content
    """
    return ElementContentBase(
        src=image_src,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None  # Keep None to avoid type issues for now
    )


def create_hatch_content(
    pattern: str,
    opacity: float = 1.0,
    visible: bool = True
) -> ElementContentBase:
    """
    Create hatch pattern content.
    
    Args:
        pattern: Hatch pattern definition
        opacity: Content opacity (0.0 to 1.0)
        visible: Whether content is visible
        
    Returns:
        ElementContentBase: Hatch content
    """
    return ElementContentBase(
        src=pattern,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None  # Keep None to avoid type issues for now
    )


def create_background(content: ElementContentBase) -> ElementBackground:
    """
    Create element background from content.
    
    Args:
        content: Content created by create_solid_content, create_image_content, etc.
        
    Returns:
        ElementBackground: Background with the specified content
    """
    return ElementBackground(content=content)


def create_stroke(
    content: ElementContentBase,
    width: float,
    placement: STROKE_PLACEMENT = STROKE_PLACEMENT.INSIDE,
    style: Optional[StrokeStyle] = None,
    sides: Optional[StrokeSides] = None
) -> ElementStroke:
    """
    Create element stroke from content.
    
    Args:
        content: Content created by create_solid_content, etc.
        width: Stroke width
        placement: Where to place the stroke (INSIDE, CENTER, OUTSIDE)
        style: Custom stroke style (defaults to solid)
        sides: Custom stroke sides (defaults to all sides)
        
    Returns:
        ElementStroke: Stroke with the specified content and properties
    """
    if style is None:
        style = StrokeStyle(
            dash=[],
            dash_line_override="",
            preference=STROKE_PREFERENCE.SOLID,
            cap=STROKE_CAP.ROUND,
            join=STROKE_JOIN.ROUND,
            dash_cap=STROKE_CAP.ROUND,
            miter_limit=4.0
        )
    
    if sides is None:
        sides = StrokeSides(
            values=[],
            preference=STROKE_SIDE_PREFERENCE.ALL
        )
    
    return ElementStroke(
        content=content,
        width=width,
        style=style,
        stroke_sides=sides,
        placement=placement
    )


def create_simple_styles(
    roundness: float = 0.0,
    opacity: float = 1.0,
    backgrounds: Optional[List[ElementBackground]] = None,
    strokes: Optional[List[ElementStroke]] = None,
    blending: Optional[BLENDING] = None
) -> DucElementStylesBase:
    """
    Create element styles from pre-built backgrounds and strokes.
    
    Args:
        roundness: Corner roundness for rectangles
        opacity: Element opacity (0.0 to 1.0) 
        backgrounds: List of backgrounds created with create_background()
        strokes: List of strokes created with create_stroke()
        blending: Blending mode
        
    Returns:
        DucElementStylesBase: Configured styles
    """
    return DucElementStylesBase(
        roundness=roundness,
        background=backgrounds or [],
        stroke=strokes or [],
        opacity=opacity,
        blending=blending
    )


# Flexible style creation functions
def create_fill_style(content, roundness: float = 0.0, opacity: float = 1.0) -> DucElementStylesBase:
    """Create a fill style with the given content (solid, image, hatch, etc)."""
    background = create_background(content)
    return create_simple_styles(roundness=roundness, opacity=opacity, backgrounds=[background])

def create_stroke_style(content, width: float = 1.0, placement: STROKE_PLACEMENT = STROKE_PLACEMENT.INSIDE, opacity: float = 1.0) -> DucElementStylesBase:
    """Create a stroke style with the given content and width."""
    stroke = create_stroke(content, width=width, placement=placement)
    return create_simple_styles(opacity=opacity, strokes=[stroke])

def create_fill_and_stroke_style(
    fill_content: ElementContentBase, 
    stroke_content: ElementContentBase, 
    stroke_width: float = 1.0, 
    roundness: float = 0.0,
    opacity: float = 1.0,
    placement: STROKE_PLACEMENT = STROKE_PLACEMENT.INSIDE
) -> DucElementStylesBase:
    """Create a style with both fill and stroke using the provided contents."""
    background = create_background(fill_content)
    stroke = create_stroke(stroke_content, width=stroke_width, placement=placement)
    return create_simple_styles(roundness=roundness, opacity=opacity, backgrounds=[background], strokes=[stroke])

# Content creation helpers for common cases
def create_solid_style(color: str, opacity: float = 1.0):
    """Create solid content for use with create_fill_style or create_stroke_style."""
    return create_solid_content(color, opacity)

def create_hatch_style(color: str, spacing: float = 5.0, angle: float = 45.0, opacity: float = 1.0):
    """Create hatch content for use with create_fill_style or create_stroke_style."""
    return create_hatch_content(color, spacing, angle, opacity)
