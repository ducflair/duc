#!/usr/bin/env python3
"""
Example demonstrating the style builders API for creating element styles.
This demo shows how to use the builders API to create various types of styles
for DUC elements including backgrounds, strokes, text styles, and document styles.
"""

import ducpy as duc
from ducpy.builders.style_builders import (
    create_solid_content, create_image_content, create_hatch_content,
    create_background, create_stroke, create_simple_styles,
    create_fill_style, create_stroke_style, create_fill_and_stroke_style,
    create_text_style, create_paragraph_formatting, create_stack_format,
    create_doc_style, create_column_layout
)
from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ducpy.Duc.STROKE_CAP import STROKE_CAP
from ducpy.Duc.STROKE_JOIN import STROKE_JOIN
from ducpy.Duc.STROKE_SIDE_PREFERENCE import STROKE_SIDE_PREFERENCE
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ducpy.Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ducpy.Duc.COLUMN_TYPE import COLUMN_TYPE
from ducpy.Duc.STACKED_TEXT_ALIGN import STACKED_TEXT_ALIGN
from ducpy.Duc.BLENDING import BLENDING


def demo_basic_content_creation():
    """Demonstrate basic content creation."""
    print("=== Basic Content Creation ===")
    
    # Create solid color content
    solid_content = create_solid_content("#FF0000", opacity=0.8)
    print(f"Solid content: {solid_content.src}, opacity: {solid_content.opacity}")
    
    # Create image content
    image_content = create_image_content("image_file_id_123", opacity=0.9)
    print(f"Image content: {image_content.src}, opacity: {image_content.opacity}")
    
    # Create hatch content
    hatch_content = create_hatch_content("diagonal_hatch", opacity=0.7)
    print(f"Hatch content: {hatch_content.src}, opacity: {hatch_content.opacity}")


def demo_background_and_stroke_creation():
    """Demonstrate background and stroke creation."""
    print("\n=== Background and Stroke Creation ===")
    
    # Create backgrounds
    solid_bg = create_background(create_solid_content("#00FF00"))
    image_bg = create_background(create_image_content("bg_image_id"))
    hatch_bg = create_background(create_hatch_content("cross_hatch"))
    
    print(f"Created {len([solid_bg, image_bg, hatch_bg])} different backgrounds")
    
    # Create strokes
    thin_stroke = create_stroke(create_solid_content("#000000"), width=1.0)
    thick_stroke = create_stroke(create_solid_content("#FF0000"), width=3.0)
    dashed_stroke = create_stroke(
        create_solid_content("#0000FF"), 
        width=2.0,
        placement=STROKE_PLACEMENT.CENTER
    )
    
    print(f"Created {len([thin_stroke, thick_stroke, dashed_stroke])} different strokes")


def demo_simple_styles():
    """Demonstrate simple style creation."""
    print("\n=== Simple Style Creation ===")
    
    # Create a simple fill style
    fill_style = create_fill_style(create_solid_content("#FFD700"), roundness=5.0)
    print(f"Fill style with roundness: {fill_style.roundness}")
    
    # Create a stroke style
    stroke_style = create_stroke_style(
        create_solid_content("#000000"), 
        width=2.0, 
        placement=STROKE_PLACEMENT.OUTSIDE
    )
    print(f"Stroke style with width: {stroke_style.stroke[0].width}")
    
    # Create a combined style
    combined_style = create_fill_and_stroke_style(
        fill_content=create_solid_content("#87CEEB"),
        stroke_content=create_solid_content("#000000"),
        stroke_width=1.5,
        roundness=10.0,
        opacity=0.9
    )
    print(f"Combined style opacity: {combined_style.opacity}")


def demo_text_styles():
    """Demonstrate text style creation."""
    print("\n=== Text Style Creation ===")
    
    # Create a basic text style
    basic_text_style = create_text_style(
        font_family="Arial",
        font_size=14,
        text_align=TEXT_ALIGN.CENTER,
        vertical_align=VERTICAL_ALIGN.MIDDLE
    )
    print(f"Basic text style: {basic_text_style.font_family}, size: {basic_text_style.font_size}")
    
    # Create an advanced text style
    advanced_text_style = create_text_style(
        font_family="Times New Roman",
        font_size=18,
        text_align=TEXT_ALIGN.RIGHT,
        vertical_align=VERTICAL_ALIGN.BOTTOM,
        line_height=1.5,
        oblique_angle=15.0,
        width_factor=1.2
    )
    print(f"Advanced text style: oblique angle: {advanced_text_style.oblique_angle}")


def demo_document_styles():
    """Demonstrate document style creation."""
    print("\n=== Document Style Creation ===")
    
    # Create paragraph formatting
    paragraph = create_paragraph_formatting(
        first_line_indent=20.0,
        left_indent=10.0,
        right_indent=10.0,
        space_before=5.0,
        space_after=5.0,
        tab_stops=[50.0, 100.0, 150.0]
    )
    print(f"Paragraph formatting with {len(paragraph.tab_stops)} tab stops")
    
    # Create stack format for fractions
    stack_format = create_stack_format(
        auto_stack=True,
        stack_chars=["/", "\\", "#"],
        properties=duc.create_stack_format_properties(
            upper_scale=0.8,
            lower_scale=0.8,
            alignment=STACKED_TEXT_ALIGN.CENTER
        )
    )
    print(f"Stack format with {len(stack_format.stack_chars)} stack characters")
    
    # Create a complete document style
    doc_style = create_doc_style(
        text_style=create_text_style(font_family="Calibri", font_size=12),
        paragraph=paragraph,
        stack_format=stack_format
    )
    print(f"Document style created with font: {doc_style.text_style.font_family}")


def demo_column_layouts():
    """Demonstrate column layout creation."""
    print("\n=== Column Layout Creation ===")
    
    # Create a simple two-column layout
    two_column_layout = create_column_layout(
        definitions=[
            duc.create_text_column(width=200, gutter=20),
            duc.create_text_column(width=200, gutter=20)
        ],
        auto_height=True,
        column_type=COLUMN_TYPE.STATIC_COLUMNS
    )
    print(f"Two-column layout with {len(two_column_layout.definitions)} columns")
    
    # Create a dynamic column layout
    dynamic_layout = create_column_layout(
        definitions=[
            duc.create_text_column(width=150),
            duc.create_text_column(width=150),
            duc.create_text_column(width=150)
        ],
        auto_height=False,
        column_type=COLUMN_TYPE.DYNAMIC_COLUMNS
    )
    print(f"Dynamic layout with {len(dynamic_layout.definitions)} columns")


def demo_complex_styles():
    """Demonstrate complex style combinations."""
    print("\n=== Complex Style Combinations ===")
    
    # Create a style with multiple backgrounds
    multi_bg_style = create_simple_styles(
        roundness=15.0,
        opacity=0.95,
        backgrounds=[
            create_background(create_solid_content("#FFE4E1")),  # Misty Rose
            create_background(create_image_content("pattern_id"))
        ],
        strokes=[
            create_stroke(create_solid_content("#8B0000"), width=2.0),
            create_stroke(create_solid_content("#FFD700"), width=1.0, placement=STROKE_PLACEMENT.OUTSIDE)
        ],
        blending=BLENDING.MULTIPLY
    )
    print(f"Complex style with {len(multi_bg_style.background)} backgrounds and {len(multi_bg_style.stroke)} strokes")


def demo_style_with_elements():
    """Demonstrate using styles with actual elements."""
    print("\n=== Style with Elements Demo ===")
    
    # Create a styled rectangle
    styled_rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 60)
        .with_label("Styled Rectangle")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#98FB98"),  # Pale Green
            stroke_content=create_solid_content("#228B22"),  # Forest Green
            stroke_width=2.0,
            roundness=8.0
        ))
        .build_rectangle()
        .build())
    
    print(f"Created styled rectangle with ID: {styled_rect.element.base.id}")
    
    # Create a styled text element
    styled_text = (duc.ElementBuilder()
        .at_position(120, 0)
        .with_size(150, 40)
        .with_label("Styled Text")
        .with_styles(create_simple_styles(opacity=0.9))
        .build_text_element()
        .with_text("Hello, Styled World!")
        .build())
    
    print(f"Created styled text with content: '{styled_text.element.text}'")


def main():
    """Run all style creation demos."""
    print("DUC Style Builders API Demo")
    print("=" * 50)
    
    demo_basic_content_creation()
    demo_background_and_stroke_creation()
    demo_simple_styles()
    demo_text_styles()
    demo_document_styles()
    demo_column_layouts()
    demo_complex_styles()
    demo_style_with_elements()
    
    print("\n" + "=" * 50)
    print("Style creation demo completed successfully!")


if __name__ == "__main__":
    main()
