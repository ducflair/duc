#!/usr/bin/env python3
"""
Example demonstrating the refactored and new element creation functionality.
"""

from ducpy.builders.element_builders import (
    create_rectangle, create_ellipse, create_polygon,
    create_linear_element, create_arrow_element, create_text_element,
    create_frame_element, create_plot_element, create_viewport_element,
    create_stack_base, mutate_element
)
from ducpy.builders.style_builders import create_simple_styles, create_solid_content
from ducpy.classes.ElementsClass import DucView, DucPoint, Margins


def demo_basic_elements():
    """Demo basic elements with improved modular code."""
    print("=== Basic Elements Demo ===")
    
    # Create basic shapes - now using modular helpers internally
    rect = create_rectangle(0, 0, 100, 50, label="Sample Rectangle")
    ellipse = create_ellipse(110, 0, 60, 40, label="Sample Ellipse")
    poly = create_polygon(200, 0, 50, 50, sides=6, label="Hexagon")
    
    print(f"Rectangle ID: {rect.element.base.id}")
    print(f"Ellipse ID: {ellipse.element.base.id}")  
    print(f"Polygon sides: {poly.element.sides}")
    
    # Demonstrate mutation with random versioning
    original_version = rect.element.base.version
    mutate_element(rect, x=10, label="Moved Rectangle")
    print(f"Version changed: {original_version} -> {rect.element.base.version}")


def demo_linear_elements():
    """Demo linear and arrow elements."""
    print("\n=== Linear Elements Demo ===")
    
    # Create a simple line
    line_points = [(0, 0), (50, 25), (100, 0)]
    line = create_linear_element(line_points, label="Sample Line")
    print(f"Line has {len(line.element.linear_base.points)} points")
    
    # Create an arrow
    arrow_points = [(0, 50), (75, 100)]
    arrow = create_arrow_element(arrow_points, label="Sample Arrow")
    print(f"Arrow element type: {type(arrow.element).__name__}")


def demo_text_elements():
    """Demo text elements with new versioning."""
    print("\n=== Text Elements Demo ===")
    
    text = create_text_element(
        x=0, y=100, text="Hello, DucPy!",
        width=150, height=25,
        label="Sample Text"
    )
    print(f"Text content: '{text.element.text}'")
    print(f"Text uses random versioning: {text.element.base.version > 0}")


def demo_stack_elements():
    """Demo new stack-based elements."""
    print("\n=== Stack Elements Demo ===")
    
    # Create a frame
    frame = create_frame_element(
        x=0, y=150, width=200, height=100,
        label="Technical Frame"
    )
    print(f"Frame stack label: {frame.element.stack_element_base.stack_base.label}")
    
    # Create a plot with margins
    margins = Margins(top=5, right=5, bottom=5, left=5)
    plot = create_plot_element(
        x=220, y=150, width=180, height=120,
        margins=margins,
        label="Engineering Plot"
    )
    print(f"Plot is marked as plot: {plot.element.stack_element_base.stack_base.is_plot}")
    print(f"Plot margins: {plot.element.layout.margins.top}mm")
    
    # Create a viewport
    viewport_points = [(0, 0), (80, 0), (80, 60), (0, 60), (0, 0)]
    view = DucView(
        scroll_x=0, scroll_y=0, zoom=1.5, twist_angle=0,
        center_point=DucPoint(x=40, y=30), scope="mm"
    )
    viewport = create_viewport_element(
        points=viewport_points, view=view, scale=0.75,
        label="Detail Viewport"
    )
    print(f"Viewport zoom: {viewport.element.view.zoom}x")
    print(f"Viewport scale: {viewport.element.scale}")


def demo_custom_stack_base():
    """Demo custom stack base creation."""
    print("\n=== Custom Stack Base Demo ===")
    
    # Create custom stack base
    custom_stack = create_stack_base(
        label="Custom Container",
        is_collapsed=False,
        opacity=0.8,
        labeling_color="#0066CC"
    )
    
    # Use it in a frame
    custom_frame = create_frame_element(
        x=50, y=280, width=150, height=80,
        stack_base=custom_stack
    )
    
    print(f"Custom stack opacity: {custom_frame.element.stack_element_base.stack_base.styles.opacity}")
    print(f"Custom stack color: {custom_frame.element.stack_element_base.stack_base.styles.labeling_color}")


if __name__ == "__main__":
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
