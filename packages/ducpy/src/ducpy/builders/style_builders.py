"""
Helper functions for creating element styles with a user-friendly API.
Each ELEMENT_CONTENT_PREFERENCE has its own dedicated method.
"""
from typing import List, Optional

from ..classes.ElementsClass import (CustomHatchPattern, DucDocStyle,
                                     DucElementStylesBase, DucHatchStyle,
                                     DucImageFilter, DucPoint, DucTableStyle,
                                     DucTextStyle, ElementBackground,
                                     ElementContentBase, ElementStroke,
                                     LineSpacing, Margins, StrokeSides,
                                     StrokeStyle, TilingProperties)
from ..enums import (BLENDING, ELEMENT_CONTENT_PREFERENCE, HATCH_STYLE,
                     LINE_SPACING_TYPE, STROKE_CAP, STROKE_JOIN,
                     STROKE_PLACEMENT, STROKE_PREFERENCE,
                     STROKE_SIDE_PREFERENCE, TEXT_ALIGN, VERTICAL_ALIGN)


def _create_default_tiling_properties() -> TilingProperties:
    """Create default tiling settings used by content builders."""
    return TilingProperties(
        size_in_percent=100.0,
        angle=0.0,
        spacing=1.0,
        offset_x=0.0,
        offset_y=0.0
    )

def _create_default_hatch_style() -> DucHatchStyle:
    """Create a neutral/default hatch style."""
    return DucHatchStyle(
        hatch_style=HATCH_STYLE.NORMAL,
        pattern_name="",
        pattern_scale=1.0,
        pattern_angle=0.0,
        pattern_origin=DucPoint(x=0.0, y=0.0, mirroring=None),
        pattern_double=False,
        custom_pattern=CustomHatchPattern(name="", lines=[])
    )

def _create_default_image_filter() -> DucImageFilter:
    """Create a neutral image filter (no brightness/contrast changes)."""
    return DucImageFilter(brightness=1.0, contrast=1.0)


def create_solid_content(color: str, opacity: float = 1.0, visible: bool = True) -> ElementContentBase:
    """Create solid color content.

    Args:
        color: Hex color string (for example, "#FF0000").
        opacity: Content opacity from 0.0 to 1.0.
        visible: Whether content should be visible.
    """
    return ElementContentBase(
        src=color,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None
    )


def create_fill_content(color: str, opacity: float = 1.0, visible: bool = True) -> ElementContentBase:
    """Create generic fill content.

    Args:
        color: Color or fill source string.
        opacity: Content opacity from 0.0 to 1.0.
        visible: Whether content should be visible.
    """
    return ElementContentBase(
        src=color,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None
    )


def create_image_content(
    image_src: str,
    opacity: float = 1.0,
    visible: bool = True,
    fit_mode: Optional[str] = None
) -> ElementContentBase:
    """Create image content.

    Args:
        image_src: Image source (file id, URL, or supported element reference).
        opacity: Content opacity from 0.0 to 1.0.
        visible: Whether content should be visible.
        fit_mode: Reserved for fit mode behavior.
    """
    return ElementContentBase(
        src=image_src,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None
    )


def create_hatch_content(
    pattern: str,
    opacity: float = 1.0,
    visible: bool = True
) -> ElementContentBase:
    """Create hatch pattern content.

    Args:
        pattern: Hatch pattern source/identifier.
        opacity: Content opacity from 0.0 to 1.0.
        visible: Whether content should be visible.
    """
    return ElementContentBase(
        src=pattern,
        visible=visible,
        opacity=opacity,
        tiling=_create_default_tiling_properties(),
        hatch=_create_default_hatch_style(),
        image_filter=_create_default_image_filter(),
        preference=None
    )


def create_background(content: Optional[ElementContentBase] = None) -> ElementBackground:
    """Create a background wrapper from content.

    If no content is provided, a solid white background is used.
    """
    if content is None:
        content = create_solid_content("#FFFFFF", opacity=1.0, visible=True)
    return ElementBackground(content=content)


def create_stroke(
    content: Optional[ElementContentBase] = None,
    width: float = 1.0,
    placement: STROKE_PLACEMENT = STROKE_PLACEMENT.INSIDE,
    style: Optional[StrokeStyle] = None,
    sides: Optional[StrokeSides] = None
) -> ElementStroke:
    """Create a stroke wrapper from content and stroke settings.

    If content is omitted, a solid black stroke is used.
    """
    if content is None:
        content = create_solid_content("#000000", opacity=1.0, visible=True)
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
    """Create base element styles from backgrounds and strokes.

    Falls back to one default background and one default stroke when omitted.
    """
    return DucElementStylesBase(
        roundness=roundness,
        background=backgrounds or [create_background()],
        stroke=strokes or [create_stroke()],
        opacity=opacity,
        blending=blending
    )


def create_fill_style(content, roundness: float = 0.0, opacity: float = 1.0) -> DucElementStylesBase:
    """Create styles configured with fill only."""
    background = create_background(content)
    return create_simple_styles(roundness=roundness, opacity=opacity, backgrounds=[background])

def create_stroke_style(content, width: float = 1.0, placement: STROKE_PLACEMENT = STROKE_PLACEMENT.INSIDE, opacity: float = 1.0) -> DucElementStylesBase:
    """Create styles configured with stroke only."""
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
    """Create styles configured with both fill and stroke."""
    background = create_background(fill_content)
    stroke = create_stroke(stroke_content, width=stroke_width, placement=placement)
    return create_simple_styles(roundness=roundness, opacity=opacity, backgrounds=[background], strokes=[stroke])

def create_solid_style(color: str, opacity: float = 1.0):
    """Convenience helper that returns solid content for style composition."""
    return create_solid_content(color, opacity)

def create_hatch_style(pattern: str, opacity: float = 1.0):
    """Convenience helper that returns hatch content for style composition."""
    return create_hatch_content(pattern, opacity)


def create_text_style(
    font_family: str = "Arial",
    font_size: float = 12,
    is_ltr: bool = True,
    text_align: Optional[TEXT_ALIGN] = None,
    vertical_align: Optional[VERTICAL_ALIGN] = None,
    line_height: float = 1.0,
    line_spacing_value: float = 1.0,
    line_spacing_type: Optional[LINE_SPACING_TYPE] = None,
    oblique_angle: float = 0.0,
    width_factor: float = 1.0,
    is_upside_down: bool = False,
    is_backwards: bool = False,
) -> DucTextStyle:
    """Create a text style instance.

    This helper provides safe defaults for alignment and line spacing.
    """
    if text_align is None:
        text_align = TEXT_ALIGN.LEFT
    if vertical_align is None:
        vertical_align = VERTICAL_ALIGN.TOP
    if line_spacing_type is None:
        line_spacing_type = LINE_SPACING_TYPE.MULTIPLE

    line_spacing = LineSpacing(value=line_spacing_value, type=line_spacing_type)

    return DucTextStyle(
        is_ltr=is_ltr,
        font_family=font_family,
        big_font_family=font_family,
        line_height=line_height,
        line_spacing=line_spacing,
        oblique_angle=oblique_angle,
        font_size=font_size,
        width_factor=width_factor,
        is_upside_down=is_upside_down,
        is_backwards=is_backwards,
        text_align=text_align,
        vertical_align=vertical_align,
    )


def create_doc_style() -> DucDocStyle:
    """DucDocStyle is empty in the current schema."""
    return DucDocStyle()


def create_table_style() -> DucTableStyle:
    """DucTableStyle is empty in the current schema."""
    return DucTableStyle()


def create_margins(
    top: float = 0.0,
    right: float = 0.0,
    bottom: float = 0.0,
    left: float = 0.0
) -> Margins:
    """Create margin values in top/right/bottom/left order."""
    return Margins(top=top, right=right, bottom=bottom, left=left)
