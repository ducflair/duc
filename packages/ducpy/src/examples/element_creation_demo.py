#!/usr/bin/env python3
"""
Example demonstrating the refactored and new element creation functionality.
"""

import ducpy as duc


def demo_basic_elements():
    """Demo basic elements with improved modular code."""
    print("=== Basic Elements Demo ===")
    
    # Create basic shapes - now using modular helpers internally
    rect = duc.create_rectangle(0, 0, 100, 50, label="Sample Rectangle")
    ellipse = duc.create_ellipse(110, 0, 60, 40, label="Sample Ellipse")
    poly = duc.create_polygon(200, 0, 50, 50, sides=6, label="Hexagon")
    
    print(f"Rectangle ID: {rect.element.base.id}")
    print(f"Ellipse ID: {ellipse.element.base.id}")  
    print(f"Polygon sides: {poly.element.sides}")
    
    # Demonstrate mutation with random versioning
    original_version = rect.element.base.version
    duc.mutate_element(rect, x=10, label="Moved Rectangle")
    print(f"Version changed: {original_version} -> {rect.element.base.version}")


def demo_linear_elements():
    """Demo linear and arrow elements."""
    print("\n=== Linear Elements Demo ===")
    
    # Create a simple line
    line_points = [(0, 0), (50, 25), (100, 0)]
    line = duc.create_linear_element(line_points, label="Sample Line")
    print(f"Line has {len(line.element.linear_base.points)} points")
    
    # Create an arrow
    arrow_points = [(0, 50), (75, 100)]
    arrow = duc.create_arrow_element(arrow_points, label="Sample Arrow")
    print(f"Arrow element type: {type(arrow.element).__name__}")


def demo_text_elements():
    """Demo text elements with new versioning."""
    print("\n=== Text Elements Demo ===")
    
    text = duc.create_text_element(
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
    frame = duc.create_frame_element(
        x=0, y=150, width=200, height=100,
        label="Technical Frame"
    )
    print(f"Frame stack label: {frame.element.stack_element_base.stack_base.label}")
    
    # Create a plot with margins
    plot = duc.create_plot_element(
        x=220, y=150, width=180, height=120,
        margins=duc.create_margins(top=5, right=5, bottom=5, left=5),
        label="Engineering Plot"
    )
    print(f"Plot is marked as plot: {plot.element.stack_element_base.stack_base.is_plot}")
    print(f"Plot margins: {plot.element.layout.margins.top}mm")
    
    # Create a viewport
    viewport_points = [(0, 0), (80, 0), (80, 60), (0, 60), (0, 0)]

    view = duc.create_view(
        scroll_x=0, scroll_y=0, zoom=1.5, twist_angle=0,
        center_x=40, center_y=30, scope="mm"
    )
    viewport = duc.create_viewport_element(
        points=viewport_points, view=view, scale=0.75,
        label="Detail Viewport"
    )
    print(f"Viewport zoom: {viewport.element.view.zoom}x")
    print(f"Viewport scale: {viewport.element.scale}")


def demo_custom_stack_base():
    """Demo custom stack base creation."""
    print("\n=== Custom Stack Base Demo ===")
    
    # Use it in a frame
    custom_frame = duc.create_frame_element(
        x=50, y=280, width=150, height=80,
        stack_base=duc.create_stack_base(
          label="Custom Container",
          is_collapsed=False,
          opacity=0.8,
          labeling_color="#0066CC"
        )
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
