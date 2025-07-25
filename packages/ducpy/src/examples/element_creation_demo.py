#!/usr/bin/env python3
"""
Example demonstrating the element creation functionality using the builders API.
This demo shows how to create various types of elements using the modern builders pattern.
"""

import ducpy as duc
from ducpy.builders.style_builders import (
    create_solid_content, create_fill_and_stroke_style, create_simple_styles
)


def demo_basic_elements():
    """Demo basic elements using the builders API."""
    print("=== Basic Elements Demo ===")
    
    # Create basic shapes with styles
    rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 50)
        .with_label("Sample Rectangle")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#FF6B6B"),
            stroke_content=create_solid_content("#2C3E50"),
            stroke_width=2.0,
            roundness=5.0
        ))
        .build_rectangle()
        .build())
    
    ellipse = (duc.ElementBuilder()
        .at_position(120, 0)
        .with_size(60, 40)
        .with_label("Sample Ellipse")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#4ECDC4"),
            stroke_content=create_solid_content("#34495E"),
            stroke_width=1.5
        ))
        .build_ellipse()
        .build())
    
    poly = (duc.ElementBuilder()
        .at_position(200, 0)
        .with_size(50, 50)
        .with_label("Hexagon")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#45B7D1"),
            stroke_content=create_solid_content("#2C3E50"),
            stroke_width=1.0,
            roundness=0.0
        ))
        .build_polygon()
        .with_sides(6)
        .build())
    
    print(f"Rectangle ID: {rect.element.base.id}")
    print(f"Ellipse ID: {ellipse.element.base.id}")  
    print(f"Polygon sides: {poly.element.sides}")
    
    # Demonstrate mutation with random versioning
    original_version = rect.element.base.version
    duc.mutate_element(rect, x=10, label="Moved Rectangle")
    print(f"Version changed: {original_version} -> {rect.element.base.version}")


def demo_linear_elements():
    """Demo linear and arrow elements with styles."""
    print("\n=== Linear Elements Demo ===")
    
    # Create a styled line
    line_points = [(0, 0), (50, 25), (100, 0)]
    line = (duc.ElementBuilder()
        .with_label("Sample Line")
        .with_styles(create_simple_styles(
            strokes=[duc.create_stroke(duc.create_solid_content("#E74C3C"), width=3.0)]
        ))
        .build_linear_element()
        .with_points(line_points)
        .build())
    print(f"Line has {len(line.element.linear_base.points)} points")
    
    # Create a styled arrow
    arrow_points = [(0, 50), (75, 100)]
    arrow = (duc.ElementBuilder()
        .with_label("Sample Arrow")
        .with_styles(create_simple_styles(
            strokes=[duc.create_stroke(duc.create_solid_content("#8E44AD"), width=2.5)]
        ))
        .build_arrow_element()
        .with_points(arrow_points)
        .build())
    print(f"Arrow element type: {type(arrow.element).__name__}")


def demo_text_elements():
    """Demo text elements with styles and document formatting."""
    print("\n=== Text Elements Demo ===")
    
    text = (duc.ElementBuilder()
        .at_position(0, 100)
        .with_size(150, 25)
        .with_label("Sample Text")
        .with_styles(create_simple_styles(opacity=0.9))
        .build_text_element()
        .with_text("Hello, DucPy!")
        .build())
    print(f"Text content: '{text.element.text}'")
    print(f"Text uses random versioning: {text.element.base.version > 0}")


def demo_stack_elements():
    """Demo new stack-based elements with styles."""
    print("\n=== Stack Elements Demo ===")
    
    # Create a styled frame
    frame = (duc.ElementBuilder()
        .at_position(0, 150)
        .with_size(200, 100)
        .with_label("Technical Frame")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#F8F9FA"),
            stroke_content=create_solid_content("#495057"),
            stroke_width=2.0,
            roundness=3.0
        ))
        .build_frame_element()
        .build())
    print(f"Frame stack label: {frame.element.stack_element_base.stack_base.label}")
    
    # Create a styled plot with margins
    plot = (duc.ElementBuilder()
        .at_position(220, 150)
        .with_size(180, 120)
        .with_label("Engineering Plot")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#E9ECEF"),
            stroke_content=create_solid_content("#6C757D"),
            stroke_width=1.5
        ))
        .build_plot_element()
        .with_margins(duc.Margins(top=5, right=5, bottom=5, left=5))
        .build())
    print(f"Plot is marked as plot: {plot.element.stack_element_base.stack_base.is_plot}")
    print(f"Plot margins: {plot.element.layout.margins.top}mm")
    
    # Create a viewport
    viewport_points = [(0, 0), (80, 0), (80, 60), (0, 60), (0, 0)]

    view = (duc.StateBuilder()
        .build_view()
        .with_scroll_x(0).with_scroll_y(0).with_zoom(1.5).with_twist_angle(0)
        .with_center_x(40).with_center_y(30).with_scope("mm")
        .build())
    viewport = (duc.ElementBuilder()
        .with_label("Detail Viewport")
        .build_viewport_element()
        .with_points(viewport_points)
        .with_view(view).with_view_scale(0.75)
        .build())
    print(f"Viewport zoom: {viewport.element.view.zoom}x")
    print(f"Viewport scale: {viewport.element.scale}")


def demo_custom_stack_base():
    """Demo custom stack base creation."""
    print("\n=== Custom Stack Base Demo ===")
    
    # Use it in a frame
    custom_frame = (duc.ElementBuilder()
        .at_position(50, 280)
        .with_size(150, 80)
        .with_label("Custom Container") # Moved label to ElementBuilder
        .build_frame_element()
        .with_stack_base(duc.StateBuilder().build_stack_base()
            .with_is_collapsed(False)
            .with_styles(duc.DucStackLikeStyles(opacity=0.8, labeling_color="#0066CC"))
            .build())
        .build())
    
    print(f"Custom stack opacity: {custom_frame.element.stack_element_base.stack_base.styles.opacity}")
    print(f"Custom stack color: {custom_frame.element.stack_element_base.stack_base.styles.labeling_color}")


def main():
    """Run all element creation demos."""
    print("DucPy Element Creation Demo")
    print("=" * 40)
    
    demo_basic_elements()
    demo_linear_elements() 
    demo_text_elements()
    demo_stack_elements()
    demo_custom_stack_base()
    
    print("\n✅ All demos completed successfully!")
    print("The refactored code provides:")
    print("- Reduced code duplication")  
    print("- Consistent random versioning")
    print("- New stack-based element support")
    print("- Improved maintainability")


if __name__ == "__main__":
    main()
