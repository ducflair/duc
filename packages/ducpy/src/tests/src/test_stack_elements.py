"""
Test stack-based elements (frame, plot, viewport) and serialize to DUC file.
"""
import os
import pytest
import ducpy as duc
from ducpy.classes.ElementsClass import DucView, DucPoint, Margins


def create_demo_frame():
    """Create a demonstration frame element."""
    return duc.create_frame_element(
        x=50, y=50, width=300, height=200,
        label="Demo Frame",
        styles=duc.create_stroke_style(
            duc.create_solid_content("#0066CC"),
            width=2.0
        )
    )


def create_demo_plot():
    """Create a demonstration plot element."""
    margins = Margins(top=15, right=15, bottom=15, left=15)
    
    return duc.create_plot_element(
        x=400, y=50, width=250, height=180,
        margins=margins,
        label="Technical Plot",
        styles=duc.create_fill_and_stroke_style(
            fill_content=duc.create_solid_content("#F0F8FF", opacity=0.3),
            stroke_content=duc.create_solid_content("#2E4B8B"),
            stroke_width=1.5
        )
    )


def create_demo_viewport():
    """Create a demonstration viewport element."""
    # Define viewport boundary as a rectangle
    viewport_points = [(100, 300), (280, 300), (280, 450), (100, 450), (100, 300)]
    
    # Create view configuration
    view = duc.create_view(
        scroll_x=0.0,
        scroll_y=0.0, 
        zoom=1.25,
        twist_angle=0.0,
        center_point=DucPoint(x=190, y=375),
        scope="mm"
    )
    
    return duc.create_viewport_element(
        points=viewport_points,
        view=view,
        scale=0.5,
        label="Detail Viewport",
        styles=duc.create_stroke_style(
            duc.create_solid_content("#8B4513"),
            width=2.5
        )
    )


def create_custom_stack_frame():
    """Create a frame with custom stack base."""
    custom_stack = duc.create_stack_base(
        label="Custom Container",
        is_collapsed=False,
        opacity=0.85,
        labeling_color="#FF6B35"
    )
    
    return duc.create_frame_element(
        x=450, y=300, width=200, height=120,
        stack_base=custom_stack,
        styles=duc.create_stroke_style(
            duc.create_solid_content("#FF6B35"),
            width=3.0
        )
    )


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def test_create_frame_element():
    """Test creating a frame element."""
    frame = duc.create_frame_element(
        x=0, y=0, width=100, height=50,
        label="Test Frame"
    )
    
    assert frame.element.stack_element_base.base.x == 0
    assert frame.element.stack_element_base.base.y == 0
    assert frame.element.stack_element_base.base.width == 100
    assert frame.element.stack_element_base.base.height == 50
    assert frame.element.stack_element_base.stack_base.label == "Test Frame"


def test_create_plot_element():
    """Test creating a plot element."""
    margins = Margins(top=10, right=10, bottom=10, left=10)
    
    plot = duc.create_plot_element(
        x=10, y=20, width=200, height=100,
        margins=margins,
        label="Test Plot"
    )
    
    assert plot.element.stack_element_base.base.x == 10
    assert plot.element.stack_element_base.base.y == 20
    assert plot.element.stack_element_base.base.width == 200
    assert plot.element.stack_element_base.base.height == 100
    assert plot.element.layout.margins.top == 10
    assert plot.element.stack_element_base.stack_base.is_plot == True


def test_create_viewport_element():
    """Test creating a viewport element."""
    points = [(0, 0), (100, 0), (100, 50), (0, 50), (0, 0)]  # Rectangle
    view = DucView(
        scroll_x=0.0,
        scroll_y=0.0, 
        zoom=1.0,
        twist_angle=0.0,
        center_point=DucPoint(x=50, y=25),
        scope="mm"
    )
    
    viewport = duc.create_viewport_element(
        points=points,
        view=view,
        scale=0.5,
        label="Test Viewport"
    )
    
    assert len(viewport.element.linear_base.points) == 5
    assert viewport.element.view.zoom == 1.0
    assert viewport.element.scale == 0.5
    assert viewport.element.stack_base.label == "Test Viewport"


def test_create_stack_base():
    """Test creating a stack base."""
    stack_base = duc.create_stack_base(
        label="Custom Stack",
        is_collapsed=True,
        is_plot=True,
        opacity=0.8,
        labeling_color="#FF0000"
    )
    
    assert stack_base.label == "Custom Stack"
    assert stack_base.is_collapsed == True
    assert stack_base.is_plot == True
    assert stack_base.styles.opacity == 0.8
    assert stack_base.styles.labeling_color == "#FF0000"


def test_serialize_stack_elements_demo(test_output_dir):
    """Test creating stack elements and serializing basic elements to demonstrate the functionality."""
    output_file = os.path.join(test_output_dir, "test_stack_elements.duc")
    
    # Create stack elements to test the API (but don't serialize them yet - serialization support pending)
    frame = create_demo_frame()
    plot = create_demo_plot() 
    viewport = create_demo_viewport()
    custom_frame = create_custom_stack_frame()
    
    # Verify the stack elements were created correctly
    assert frame.element.stack_element_base.base.width == 300
    assert plot.element.stack_element_base.stack_base.is_plot == True
    assert viewport.element.view.zoom == 1.25
    assert custom_frame.element.stack_element_base.stack_base.styles.labeling_color == "#FF6B35"
    
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


    # Serialize the placeholder elements to DUC file
    serialized_bytes = duc.serialize_duc(
        name="StackElementsApiDemo",
        elements=elements
    )
    
    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"
    
    # Write to file
    with open(output_file, 'wb') as f:
        f.write(serialized_bytes)
    
    print(f"✅ Created DUC file with {len(elements)} placeholder elements at {output_file}")
    print("✅ Stack element API functionality verified - creation successful!")
    print("📝 Note: Full stack element serialization will be implemented in future updates")
    
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"


if __name__ == "__main__":
    pytest.main([__file__])
