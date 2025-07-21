"""
Test creating complex linear elements with paths and connections.
"""
import os
import math
import pytest
import ducpy as duc

def test_create_complex_line_paths(test_output_dir):
    """Test creating complex linear elements with paths, connections, bezier curves and path overrides"""
    
    elements = []
    
    # Create a complex zigzag line
    zigzag_points = []
    for i in range(8):
        x = i * 50
        y = 100 + (50 if i % 2 == 0 else -50)
        zigzag_points.append((x, y))
    
    zigzag_element = duc.create_linear_element(
        points=zigzag_points,
        label="Zigzag Line",
        styles=duc.create_stroke_style(
            duc.create_solid_content("#0000FF"),
            width=2.0
        )
    )
    elements.append(zigzag_element)
    
    # Create a curved path with bezier handles
    curve_points = [
        (0, 200),
        (100, 150),
        (200, 250),
        (300, 200)
    ]
    
    # Define bezier curves for smooth connections
    curve_element = duc.create_linear_element(
        points=curve_points,
        label="Smooth Bezier Curve",
        bezier_handles={
            0: {'start': (25, 175), 'end': (75, 125)},  # First segment curve
            1: {'start': (125, 175), 'end': (175, 275)},  # Second segment curve
            2: {'start': (225, 275), 'end': (275, 175)}   # Third segment curve
        },
        styles=duc.create_stroke_style(
            duc.create_solid_content("#FF0000"),
            width=3.0
        ),
        explicit_properties_override={
            'base': {'angle': 15.0}  # Rotated curve
        }
    )
    elements.append(curve_element)
    
    # Create a complex spiral
    spiral_points = []
    center_x, center_y = 200, 400
    
    for i in range(20):
        angle = i * math.pi / 4  # 45 degrees per step
        radius = 5 + i * 3  # Expanding radius
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        spiral_points.append((x, y))
    
    spiral_element = duc.create_linear_element(
        points=spiral_points,
        label="Spiral Path",
        styles=duc.create_stroke_style(
            duc.create_solid_content("#00FF00"),
            width=1.5
        )
    )
    elements.append(spiral_element)
    
    # Create rectangles using linear elements (4-point closed paths)
    rect1_points = [
        (0, 0),
        (80, 0),
        (80, 60),
        (0, 60),
        (0, 0)  # Close the rectangle
    ]
    
    rect1_element = duc.create_linear_element(
        points=rect1_points,
        label="Rectangle 1",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#FFFF00", opacity=0.3),  # Yellow fill
            duc.create_solid_content("#000000"),  # Black stroke
            stroke_width=2.0
        ),
        explicit_properties_override={
            'base': {'x': 400.0, 'y': 100.0}
        }
    )
    elements.append(rect1_element)
    
    rect2_points = [
        (0, 0),
        (80, 0), 
        (80, 60),
        (0, 60),
        (0, 0)
    ]
    
    rect2_element = duc.create_linear_element(
        points=rect2_points,
        label="Rectangle 2",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#FF00FF", opacity=0.3),  # Magenta fill
            duc.create_solid_content("#000000"),  # Black stroke
            stroke_width=2.0
        ),
        explicit_properties_override={
            'base': {'x': 400.0, 'y': 250.0}
        }
    )
    elements.append(rect2_element)
    
    # Connector line between rectangles with bezier curve
    connector_points = [
        (440, 160),  # Start point
        (460, 200),  # Control point
        (440, 250)   # End point
    ]
    
    connector_element = duc.create_linear_element(
        points=connector_points,
        label="Curved Connector",
        bezier_handles={
            0: {'end': (480, 180)},  # Curve the first segment
            1: {'start': (480, 220)}  # Curve the second segment
        },
        styles=duc.create_stroke_style(
            duc.create_solid_content("#000000"),
            width=2.0
        )
    )
    elements.append(connector_element)
    
    # Complex shape using the new create_complex_linear_shape function
    complex_points = [
        (0, 0), (50, 0), (100, 25), (75, 75), (25, 50)
    ]
    
    complex_line_definitions = [
        {'start': 0, 'end': 1},  # Straight line
        {'start': 1, 'end': 2, 'start_handle': (75, -10), 'end_handle': (75, 35)},  # Curved
        {'start': 2, 'end': 3, 'end_handle': (50, 90)},  # Curved end
        {'start': 3, 'end': 4, 'start_handle': (60, 60)},  # Curved start
        {'start': 4, 'end': 0}   # Close the shape
    ]
    
    complex_shape = duc.create_linear_element(
        points=complex_points,
        line_definitions=complex_line_definitions,
        label="Complex Curved Shape",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#00FFFF", opacity=0.4),  # Cyan fill
            duc.create_solid_content("#0000FF"),  # Blue stroke
            stroke_width=2.5
        ),
        explicit_properties_override={
            'base': {'x': 500.0, 'y': 300.0}
        }
    )
    elements.append(complex_shape)
    
    # Multi-path element with path overrides for different segment styling
    multi_path_points = [
        (0, 0), (60, 20), (120, 0), (180, 30), (240, 0)
    ]
    
    # Create custom lines for more control
    custom_lines = [
        duc.create_bezier_line(0, 1),  # Straight line
        duc.create_bezier_line(1, 2, start_handle=(80, 40), end_handle=(100, 40)),  # Curved
        duc.create_bezier_line(2, 3),  # Straight line  
        duc.create_bezier_line(3, 4, start_handle=(200, 50), end_handle=(220, 50))   # Curved
    ]
    
    # Create path overrides for different styling on different segments
    path_overrides = [
        duc.create_path_override([0, 2], stroke=duc.create_stroke(
            duc.create_solid_content("#FF0000"), width=4.0)),  # Red for straight segments
        duc.create_path_override([1, 3], stroke=duc.create_stroke(
            duc.create_solid_content("#00FF00"), width=2.0))   # Green for curved segments
    ]
    
    multi_path_element = duc.create_linear_element(
        points=multi_path_points,
        lines=custom_lines,
        path_overrides=path_overrides,
        label="Multi-Path Styled Line",
        explicit_properties_override={
            'base': {'x': 100.0, 'y': 500.0}
        }
    )
    elements.append(multi_path_element)
    
    # Create an advanced organic shape
    organic_points = []
    center_x, center_y = 150, 600
    num_points = 8
    
    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points
        radius = 40 + 20 * math.sin(3 * angle)  # Varying radius for organic feel
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        organic_points.append((x, y))
    
    # Close the shape
    organic_points.append(organic_points[0])
    
    # Create bezier handles for smooth organic curves
    organic_bezier_handles = {}
    for i in range(len(organic_points) - 1):
        prev_idx = (i - 1) % (len(organic_points) - 1)
        next_idx = (i + 1) % (len(organic_points) - 1)
        
        # Calculate smooth control points
        handle_strength = 15
        angle_to_prev = math.atan2(
            organic_points[prev_idx][1] - organic_points[i][1],
            organic_points[prev_idx][0] - organic_points[i][0]
        )
        angle_to_next = math.atan2(
            organic_points[next_idx][1] - organic_points[i+1][1], 
            organic_points[next_idx][0] - organic_points[i+1][0]
        )
        
        start_handle = (
            organic_points[i][0] + handle_strength * math.cos(angle_to_prev + math.pi/2),
            organic_points[i][1] + handle_strength * math.sin(angle_to_prev + math.pi/2)
        )
        end_handle = (
            organic_points[i+1][0] + handle_strength * math.cos(angle_to_next - math.pi/2),
            organic_points[i+1][1] + handle_strength * math.sin(angle_to_next - math.pi/2)
        )
        
        organic_bezier_handles[i] = {'start': start_handle, 'end': end_handle}
    
    organic_element = duc.create_linear_element(
        points=organic_points,
        bezier_handles=organic_bezier_handles,
        label="Organic Curved Shape",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#FF6B6B", opacity=0.6),  # Coral fill
            duc.create_solid_content("#2E3440"),  # Dark stroke
            stroke_width=3.0
        )
    )
    elements.append(organic_element)
    
    # Serialize using the clean API
    output_file = os.path.join(test_output_dir, "test_complex_line_paths.duc")
    serialized_data = duc.serialize_duc(
        name="ComplexLinePathsTest",
        elements=elements
    )
    
    assert serialized_data is not None, "Serialization returned None"
    assert len(serialized_data) > 0, "Serialization returned empty bytes"
    
    # Save to file
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
    
    print(f"Serialized {len(elements)} complex elements successfully!")
    print(f"Elements include:")
    print("- Zigzag polyline")  
    print("- Smooth bezier curves")
    print("- Spiral path")
    print("- Rectangular closed paths")
    print("- Curved connectors")
    print("- Complex multi-curved shapes")
    print("- Multi-path styled elements with path overrides")
    print("- Organic curved shapes with calculated bezier handles")
    print(f"Saved to: {output_file}")
    
    # Verify file was created
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

    print("✅ Complex line paths test passed!")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

if __name__ == "__main__":
    pytest.main([__file__]) 