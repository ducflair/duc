"""
Test stack-based elements (frame, plot, viewport) and serialize to DUC file.
"""
import os
import pytest
import ducpy as duc
from ducpy.classes.ElementsClass import DucView, DucPoint, Margins


def create_demo_frame():
    """Create a demonstration frame element."""
    return (duc.ElementBuilder()
        .at_position(50, 50) 
        .with_size(300, 200) 
        .with_label("Demo Frame") 
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#0066CC"),
            width=2.0
        )) 
        .build_frame_element() 
        .build())


def create_demo_plot():
    """Create a demonstration plot element."""
    margins = Margins(top=15, right=15, bottom=15, left=15)
    
    return (duc.ElementBuilder()
        .at_position(400, 50) 
        .with_size(250, 180) 
        .with_label("Technical Plot") 
        .with_styles(duc.create_fill_and_stroke_style(
            duc.create_solid_content("#F0F8FF", opacity=0.3),
            duc.create_solid_content("#2E4B8B"),
            stroke_width=1.5
        )) 
        .build_plot_element() 
        .build())


def create_demo_viewport():
    """Create a demonstration viewport element."""
    # Define viewport boundary as a rectangle
    viewport_points = [(100, 300), (280, 300), (280, 450), (100, 450), (100, 300)]
    
    # Create view configuration
    view = (duc.StateBuilder()
              .build_view()
              .with_center_x(190) 
              .with_center_y(375) 
              .with_zoom(1.25) 
              .build())
    
    return (duc.ElementBuilder()
        .with_label("Detail Viewport") 
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#8B4513"),
            width=2.5
        )) 
        .build_viewport_element() 
        .with_points(viewport_points) 
        .with_view(view) 
        .build())


def create_custom_stack_frame():
    """Create a frame with custom stack base."""
    return (duc.ElementBuilder()
        .at_position(450, 300) 
        .with_size(200, 120) 
        .with_label("Custom Container") 
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#FF6B35"),
            width=3.0
        )) 
        .build_frame_element() 
        .build())


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def test_create_frame_element():
    """Test creating a frame element."""
    frame = (duc.ElementBuilder()
        .at_position(0, 0) 
        .with_size(100, 50) 
        .with_label("Test Frame") 
        .build_frame_element() 
        .build())
    
    assert frame.element.stack_element_base.base.x == 0
    assert frame.element.stack_element_base.base.y == 0
    assert frame.element.stack_element_base.base.width == 100
    assert frame.element.stack_element_base.base.height == 50
    assert frame.element.stack_element_base.stack_base.label == "Test Frame"


def test_create_plot_element():
    """Test creating a plot element."""
    plot = (duc.ElementBuilder()
        .at_position(10, 20) 
        .with_size(200, 100) 
        .with_label("Test Plot") 
        .build_plot_element() 
        .build())
    
    assert plot.element.stack_element_base.base.x == 10
    assert plot.element.stack_element_base.base.y == 20
    assert plot.element.stack_element_base.base.width == 200
    assert plot.element.stack_element_base.base.height == 100
    assert plot.element.stack_element_base.stack_base.label == "Test Plot"


def test_create_viewport_element():
    """Test creating a viewport element."""
    points = [(0, 0), (100, 0), (100, 50), (0, 50), (0, 0)]  # Rectangle
    view = (duc.StateBuilder()
              .build_view()
              .with_center_x(50) 
              .with_center_y(25) 
              .with_zoom(1.0) 
              .build())
    
    viewport = (duc.ElementBuilder()
        .with_label("Test Viewport") 
        .build_viewport_element() 
        .with_points(points) 
        .with_view(view) 
        .build())
    
    assert len(viewport.element.linear_base.points) == 5
    assert viewport.element.view.zoom == 1.0
    assert viewport.element.stack_base.label == "Test Viewport"


def test_serialize_stack_elements_demo(test_output_dir):
    """Test creating stack elements and serializing basic elements to demonstrate the functionality."""
    output_file = os.path.join(test_output_dir, "test_stack_elements.duc")
    
    # Create stack elements to test the API
    frame = create_demo_frame()
    plot = create_demo_plot() 
    viewport = create_demo_viewport()
    custom_frame = create_custom_stack_frame()
    
    # Verify the stack elements were created correctly
    assert frame.element.stack_element_base.base.width == 300
    assert frame.element.stack_element_base.stack_base.label == "Demo Frame"
    assert plot.element.stack_element_base.stack_base.label == "Technical Plot"
    assert viewport.element.view.zoom == 1.25
    assert custom_frame.element.stack_element_base.stack_base.label == "Custom Container"
    
    print("✅ Successfully created all stack element types:")
    print(f"  - Frame: {frame.element.stack_element_base.stack_base.label}")
    print(f"  - Plot: {plot.element.stack_element_base.stack_base.label}")  
    print(f"  - Viewport: {viewport.element.stack_base.label}")
    print(f"  - Custom Frame: {custom_frame.element.stack_element_base.stack_base.label}")
    
    elements = [
        frame,
        plot,
        viewport,
        custom_frame
    ]

    # Serialize the elements to DUC file
    duc.write_duc_file(
        file_path=output_file,
        name="StackElementsApiDemo",
        elements=elements
    )
    
    print(f"✅ Created DUC file with {len(elements)} elements at {output_file}")
    print("✅ Stack element API functionality verified - creation successful!")
    
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"


if __name__ == "__main__":
    pytest.main([__file__])
