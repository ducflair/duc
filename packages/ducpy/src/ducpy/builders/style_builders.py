"""
Helper functions for creating element styles with a user-friendly API.
Each ELEMENT_CONTENT_PREFERENCE has its own dedicated method.
"""
from typing import List, Optional, Union
from ..classes.ElementsClass import (
    DucElementStylesBase, ElementBackground, ElementStroke, ElementContentBase,
    StrokeStyle, StrokeSides, TilingProperties, DucHatchStyle, DucImageFilter,
    DucPoint, CustomHatchPattern, DucTextStyle, LineSpacing, DucDocStyle,
    ParagraphFormatting, StackFormat, StackFormatProperties, TextColumn, ColumnLayout,
    Margins, DucTableCellStyle, DucTableStyle, TABLE_CELL_ALIGNMENT, TABLE_FLOW_DIRECTION
)
from ..Duc.ELEMENT_CONTENT_PREFERENCE import ELEMENT_CONTENT_PREFERENCE
from ..Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ..Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ..Duc.STROKE_JOIN import STROKE_JOIN
from ..Duc.STROKE_CAP import STROKE_CAP
from ..Duc.STROKE_SIDE_PREFERENCE import STROKE_SIDE_PREFERENCE
from ..Duc.BLENDING import BLENDING
from ..Duc.HATCH_STYLE import HATCH_STYLE
from ..Duc.TEXT_ALIGN import TEXT_ALIGN
from ..Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ..Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ..Duc.COLUMN_TYPE import COLUMN_TYPE
from ..Duc.STACKED_TEXT_ALIGN import STACKED_TEXT_ALIGN


# Utility functions for creating default objects
def _create_default_tiling_properties() -> TilingProperties:
    """Create default tiling properties."""
    return TilingProperties(
        size_in_percent=100.0, 
        angle=0.0,
        spacing=1.0,
        offset_x=0.0,
        offset_y=0.0
    )

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


def create_background(content: Optional[ElementContentBase] = None) -> ElementBackground:
    """
    Create element background from content.
    
    Args:
        content: Content created by create_solid_content, create_image_content, etc.
                 If None, creates a default solid white background.
        
    Returns:
        ElementBackground: Background with the specified content
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
    """
    Create element stroke from content.
    
    Args:
        content: Content created by create_solid_content, etc.
                 If None, creates a default solid black stroke.
        width: Stroke width
        placement: Where to place the stroke (INSIDE, CENTER, OUTSIDE)
        style: Custom stroke style (defaults to solid)
        sides: Custom stroke sides (defaults to all sides)
        
    Returns:
        ElementStroke: Stroke with the specified content and properties
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
        background=backgrounds or [create_background()],
        stroke=strokes or [create_stroke()],
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

def create_hatch_style(pattern: str, opacity: float = 1.0):
    """Create hatch content for use with create_fill_style or create_stroke_style."""
    return create_hatch_content(pattern, opacity)


# === Text and Document Style Builders ===

def create_text_style(
    base_style: Optional[DucElementStylesBase] = None,
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
    paper_text_height: Optional[float] = None
) -> DucTextStyle:
    """
    Create a text style for table cells or other text elements.
    
    Args:
        base_style: Base element style
        font_family: Font family name
        font_size: Font size
        is_ltr: Left-to-right text direction
        text_align: Horizontal text alignment
        vertical_align: Vertical text alignment
        line_height: Line height multiplier
        line_spacing_value: Line spacing value
        line_spacing_type: Line spacing type
        oblique_angle: Text oblique angle
        width_factor: Text width factor
        is_upside_down: Whether text is upside down
        is_backwards: Whether text is backwards
        paper_text_height: Paper text height
    """
    if base_style is None:
        base_style = create_simple_styles()
    
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
        big_font_family=font_family,  # Use same font for big text
        line_height=line_height,
        line_spacing=line_spacing,
        oblique_angle=oblique_angle,
        font_size=font_size,
        width_factor=width_factor,
        is_upside_down=is_upside_down,
        is_backwards=is_backwards,
        text_align=text_align,
        vertical_align=vertical_align,
        paper_text_height=paper_text_height
    )


def create_paragraph_formatting(
    first_line_indent: float = 0.0,
    hanging_indent: float = 0.0,
    left_indent: float = 0.0,
    right_indent: float = 0.0,
    space_before: float = 0.0,
    space_after: float = 0.0,
    tab_stops: Optional[List[float]] = None
) -> ParagraphFormatting:
    """Create paragraph formatting settings."""
    if tab_stops is None:
        tab_stops = []
    
    return ParagraphFormatting(
        first_line_indent=first_line_indent,
        hanging_indent=hanging_indent,
        left_indent=left_indent,
        right_indent=right_indent,
        space_before=space_before,
        space_after=space_after,
        tab_stops=tab_stops
    )


def create_stack_format_properties(
    upper_scale: float = 0.7,
    lower_scale: float = 0.7,
    alignment: Optional[STACKED_TEXT_ALIGN] = None
) -> StackFormatProperties:
    """Create stack format properties for stacked text."""
    if alignment is None:
        alignment = STACKED_TEXT_ALIGN.CENTER
    
    return StackFormatProperties(
        upper_scale=upper_scale,
        lower_scale=lower_scale,
        alignment=alignment
    )


def create_stack_format(
    auto_stack: bool = True,
    stack_chars: Optional[List[str]] = None,
    properties: Optional[StackFormatProperties] = None
) -> StackFormat:
    """Create stack format for fractions and special text."""
    if stack_chars is None:
        stack_chars = ["/", "\\", "#"]
    
    if properties is None:
        properties = create_stack_format_properties()
    
    return StackFormat(
        auto_stack=auto_stack,
        stack_chars=stack_chars,
        properties=properties
    )


def create_doc_style(
    text_style: Optional[DucTextStyle] = None,
    paragraph: Optional[ParagraphFormatting] = None,
    stack_format: Optional[StackFormat] = None
) -> DucDocStyle:
    """Create document style."""
    if text_style is None:
        text_style = create_text_style()
    
    if paragraph is None:
        paragraph = create_paragraph_formatting()
    
    if stack_format is None:
        stack_format = create_stack_format()
    
    return DucDocStyle(
        text_style=text_style,
        paragraph=paragraph,
        stack_format=stack_format
    )


def create_text_column(
    width: float,
    gutter: float = 0.0
) -> TextColumn:
    """Create a text column definition."""
    return TextColumn(width=width, gutter=gutter)


def create_column_layout(
    definitions: Optional[List[TextColumn]] = None,
    auto_height: bool = True,
    column_type: Optional[COLUMN_TYPE] = None
) -> ColumnLayout:
    """Create column layout for multi-column text."""
    if definitions is None:
        definitions = [create_text_column(width=200)]
    
    if column_type is None:
        column_type = COLUMN_TYPE.STATIC_COLUMNS
    
    return ColumnLayout(
        definitions=definitions,
        auto_height=auto_height,
        type=column_type
    )

def create_margins(
    top: float = 0.0,
    right: float = 0.0,
    bottom: float = 0.0,
    left: float = 0.0
) -> Margins:
    """Create margin settings."""
    return Margins(
        top=top,
        right=right,
        bottom=bottom,
        left=left
    )

def create_table_cell_style(
    base_style: Optional[DucElementStylesBase] = None,
    text_style: Optional[DucTextStyle] = None,
    margins: Optional[Margins] = None,
    alignment: Optional[TABLE_CELL_ALIGNMENT] = None
) -> DucTableCellStyle:
    """Create table cell style."""
    if base_style is None:
        base_style = create_simple_styles()
    if text_style is None:
        text_style = create_text_style()
    if margins is None:
        margins = create_margins() # Use new builder
    if alignment is None:
        alignment = TABLE_CELL_ALIGNMENT.MIDDLE_LEFT

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
    """Create table style."""
    if base_style is None:
        base_style = create_simple_styles()
    if header_row_style is None:
        header_row_style = create_table_cell_style() # Use new builder
    if data_row_style is None:
        data_row_style = create_table_cell_style() # Use new builder
    if data_column_style is None:
        data_column_style = create_table_cell_style() # Use new builder
    if flow_direction is None:
        flow_direction = TABLE_FLOW_DIRECTION.DOWN

    return DucTableStyle(
        header_row_style=header_row_style,
        data_row_style=data_row_style,
        data_column_style=data_column_style,
        flow_direction=flow_direction
    )
