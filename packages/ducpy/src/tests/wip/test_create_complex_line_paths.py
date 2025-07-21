"""
Test creating complex linear elements with paths and connections.
"""
import os
import math
import random
import string

from packages.ducpy.src.ducpy.classes.ElementsClass import (
    DucLinearElement, Point, DucLineReference, DucLine, SimplePoint,
    PointBinding, BindingPoint, BoundElement, ElementContentBase,
    ElementStroke, ElementBackground, StrokeStyleProps, DucPath
)
from ducpy.classes.AppStateClass import AppState
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.parse.parse_duc import parse_duc_flatbuffers

def generate_random_id(length=8):
    """Generate a random string ID"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color():
    """Generate a random hex color"""
    return f"#{random.randint(0, 0xFFFFFF):06x}"

def test_create_complex_line_paths(test_output_dir):
    """Test creating complex linear elements with paths and connections"""
    
    elements = []
    
    # Create a complex zigzag line
    zigzag_points = []
    for i in range(8):
        x = i * 50
        y = 100 + (50 if i % 2 == 0 else -50)
        zigzag_points.append(Point(x=x, y=y))
    
    zigzag_lines = []
    for i in range(len(zigzag_points) - 1):
        start_ref = DucLineReference(index=i)
        end_ref = DucLineReference(index=i + 1)
        zigzag_lines.append(DucLine(start=start_ref, end=end_ref))
    
    zigzag_element = DucLinearElement(
        id=generate_random_id(),
        x=50.0,
        y=50.0,
        width=350.0,
        height=100.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Zigzag Line",
        group_ids=[],
        bound_elements=[],
        link="",
        frame_id="",
        z_index=1,
        points=zigzag_points,
        lines=zigzag_lines
    )
    elements.append(zigzag_element)
    
    # Create a curved path with Bezier handles
    curve_points = [
        Point(x=0, y=0),
        Point(x=100, y=-50),
        Point(x=200, y=50),
        Point(x=300, y=0)
    ]
    
    curve_lines = []
    for i in range(len(curve_points) - 1):
        # Add Bezier handles for smooth curves
        start_handle = SimplePoint(x=25, y=0) if i == 0 else SimplePoint(x=50, y=-25)
        end_handle = SimplePoint(x=-25, y=0) if i == len(curve_points) - 2 else SimplePoint(x=-50, y=25)
        
        start_ref = DucLineReference(index=i, handle=start_handle)
        end_ref = DucLineReference(index=i + 1, handle=end_handle)
        curve_lines.append(DucLine(start=start_ref, end=end_ref))
    
    curve_element = DucLinearElement(
        id=generate_random_id(),
        x=50.0,
        y=200.0,
        width=300.0,
        height=100.0,
        angle=15.0,  # Rotated curve
        opacity=0.8,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Curved Path",
        group_ids=[],
        bound_elements=[],
        link="",
        frame_id="",
        z_index=2,
        points=curve_points,
        lines=curve_lines
    )
    elements.append(curve_element)
    
    # Create a complex spiral
    spiral_points = []
    spiral_lines = []
    center_x, center_y = 200, 400
    
    for i in range(20):
        angle = i * math.pi / 4  # 45 degrees per step
        radius = 5 + i * 3  # Expanding radius
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        spiral_points.append(Point(x=x, y=y))
        
        if i > 0:
            start_ref = DucLineReference(index=i - 1)
            end_ref = DucLineReference(index=i)
            spiral_lines.append(DucLine(start=start_ref, end=end_ref))
    
    spiral_element = DucLinearElement(
        id=generate_random_id(),
        x=center_x - 70,
        y=center_y - 70,
        width=140.0,
        height=140.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Spiral Path",
        group_ids=[],
        bound_elements=[],
        link="",
        frame_id="",
        z_index=3,
        points=spiral_points,
        lines=spiral_lines
    )
    elements.append(spiral_element)
    
    # Create connected elements with bindings
    rect1_id = generate_random_id()
    rect2_id = generate_random_id()
    connector_id = generate_random_id()
    
    # First rectangle (simulated as a 4-point linear element)
    rect1_points = [
        Point(x=0, y=0),
        Point(x=80, y=0),
        Point(x=80, y=60),
        Point(x=0, y=60),
        Point(x=0, y=0)  # Close the rectangle
    ]
    
    rect1_lines = []
    for i in range(len(rect1_points) - 1):
        start_ref = DucLineReference(index=i)
        end_ref = DucLineReference(index=i + 1)
        rect1_lines.append(DucLine(start=start_ref, end=end_ref))
    
    rect1_element = DucLinearElement(
        id=rect1_id,
        x=400.0,
        y=100.0,
        width=80.0,
        height=60.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Rectangle 1",
        group_ids=[],
        bound_elements=[BoundElement(id=connector_id, type="line")],
        link="",
        frame_id="",
        z_index=4,
        points=rect1_points,
        lines=rect1_lines
    )
    elements.append(rect1_element)
    
    # Second rectangle
    rect2_points = [
        Point(x=0, y=0),
        Point(x=80, y=0), 
        Point(x=80, y=60),
        Point(x=0, y=60),
        Point(x=0, y=0)
    ]
    
    rect2_lines = []
    for i in range(len(rect2_points) - 1):
        start_ref = DucLineReference(index=i)
        end_ref = DucLineReference(index=i + 1)
        rect2_lines.append(DucLine(start=start_ref, end=end_ref))
    
    rect2_element = DucLinearElement(
        id=rect2_id,
        x=400.0,
        y=250.0,
        width=80.0,
        height=60.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Rectangle 2",
        group_ids=[],
        bound_elements=[BoundElement(id=connector_id, type="line")],
        link="",
        frame_id="",
        z_index=5,
        points=rect2_points,
        lines=rect2_lines
    )
    elements.append(rect2_element)
    
    # Connector line between rectangles
    connector_points = [
        Point(x=0, y=0),  # Will bind to rect1
        Point(x=0, y=90)  # Will bind to rect2
    ]
    
    connector_lines = [
        DucLine(
            start=DucLineReference(index=0),
            end=DucLineReference(index=1)
        )
    ]
    
    # Create bindings
    start_binding = PointBinding(
        element_id=rect1_id,
        focus=0.5,
        gap=0.0,
        point=BindingPoint(index=2, offset=0.5),  # Bottom edge center
        head=1,  # No arrow
        fixed_point=SimplePoint(x=40, y=60)
    )
    
    end_binding = PointBinding(
        element_id=rect2_id,
        focus=0.5,
        gap=0.0,
        point=BindingPoint(index=0, offset=0.5),  # Top edge center
        head=2,  # Arrow head
        fixed_point=SimplePoint(x=40, y=0)
    )
    
    connector_element = DucLinearElement(
        id=connector_id,
        x=440.0,  # Middle x between rectangles
        y=160.0,  # Start y
        width=0.0,
        height=90.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Connector Line",
        group_ids=[],
        bound_elements=[],
        link="",
        frame_id="",
        z_index=6,
        points=connector_points,
        lines=connector_lines,
        start_binding=start_binding,
        end_binding=end_binding
    )
    elements.append(connector_element)
    
    # Create a complex path with path overrides
    base_points = [
        Point(x=0, y=0),
        Point(x=50, y=50),
        Point(x=100, y=0),
        Point(x=150, y=-50),
        Point(x=200, y=0)
    ]
    
    base_lines = []
    for i in range(len(base_points) - 1):
        start_ref = DucLineReference(index=i)
        end_ref = DucLineReference(index=i + 1)
        base_lines.append(DucLine(start=start_ref, end=end_ref))
    
    # Create path overrides with different styling
    content_base = ElementContentBase(
        preference=1,
        src="#000000",
        visible=True,
        opacity=1.0
    )
    
    stroke_style = StrokeStyleProps(
        preference=1,
        dash=[10.0, 5.0]  # Dashed line
    )
    
    stroke = ElementStroke(
        content=content_base,
        width=3.0,
        style=stroke_style,
        placement=11  # Center
    )
    
    background = ElementBackground(content=content_base)
    
    # Create a simpler path element without overrides for now
    complex_path_element = DucLinearElement(
        id=generate_random_id(),
        x=50.0,
        y=450.0,
        width=200.0,
        height=100.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Complex Path with Overrides",
        group_ids=[],
        bound_elements=[],
        link="",
        frame_id="",
        z_index=7,
        points=base_points,
        lines=base_lines
    )
    elements.append(complex_path_element)
    
    # Create app state
    app_state = AppState()
    
    # Test serialization and save to file
    output_file = os.path.join(test_output_dir, "test_complex_line_paths.duc")
    serialized_data = save_as_flatbuffers(elements, app_state, {})
    
    # Save to file
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
    
    print(f"Serialized {len(elements)} elements successfully!")
    print(f"Saved to: {output_file}")
    
    # Test parsing
    import io
    parsed_data = parse_duc_flatbuffers(io.BytesIO(serialized_data))
    parsed_elements = parsed_data['elements']
    parsed_app_state = parsed_data['appState']
    parsed_binary_files = parsed_data['files']
    print(f"Parsed {len(parsed_elements)} elements successfully!")
    
    # Verify the parsed data
    assert len(parsed_elements) == len(elements), f"Expected {len(elements)} elements, got {len(parsed_elements)}"
    
    # Verify specific elements
    zigzag_parsed = next((e for e in parsed_elements if e.label == "Zigzag Line"), None)
    assert zigzag_parsed is not None, "Zigzag element not found"
    assert len(zigzag_parsed.points) == 8, f"Expected 8 points, got {len(zigzag_parsed.points)}"
    assert len(zigzag_parsed.lines) == 7, f"Expected 7 lines, got {len(zigzag_parsed.lines)}"
    
    curve_parsed = next((e for e in parsed_elements if e.label == "Curved Path"), None)
    assert curve_parsed is not None, "Curve element not found"
    assert curve_parsed.angle == 15.0, f"Expected angle 15.0, got {curve_parsed.angle}"
    
    spiral_parsed = next((e for e in parsed_elements if e.label == "Spiral Path"), None)
    assert spiral_parsed is not None, "Spiral element not found"
    assert len(spiral_parsed.points) == 20, f"Expected 20 points, got {len(spiral_parsed.points)}"
    
    connector_parsed = next((e for e in parsed_elements if e.label == "Connector Line"), None)
    assert connector_parsed is not None, "Connector element not found"
    assert connector_parsed.start_binding is not None, "Start binding missing"
    assert connector_parsed.end_binding is not None, "End binding missing"
    
    complex_path_parsed = next((e for e in parsed_elements if e.label == "Complex Path with Overrides"), None)
    assert complex_path_parsed is not None, "Complex path element not found"
    
    # Verify file was created
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

    print("✅ Complex line paths test passed!")

if __name__ == "__main__":
    test_output_dir = "."  # Replace with your desired output directory
    test_create_complex_line_paths(test_output_dir) 