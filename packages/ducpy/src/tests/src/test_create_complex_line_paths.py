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
    
    zigzag_element = (duc.ElementBuilder()
                      .with_label("Zigzag Line")
                      .with_styles(duc.create_stroke_style(
                          duc.create_solid_content("#0000FF"),
                          width=2.0
                      ))
                      .build_linear_element()
                      .with_points(zigzag_points)
                      .build())
    elements.append(zigzag_element)
    
    # Create a curved path with bezier handles
    curve_points = [
        (0, 200),
        (100, 150),
        (200, 250),
        (300, 200)
    ]
    
    # Define bezier curves for smooth connections
    curve_element = (duc.ElementBuilder()
                     .with_label("Smooth Bezier Curve")
                     .with_angle(15.0)  # Rotated curve
                     .with_styles(duc.create_stroke_style(
                         duc.create_solid_content("#FF0000"),
                         width=3.0
                     ))
                     .build_linear_element()
                     .with_points(curve_points)
                     .with_bezier_handles({
                         0: {'start': (25, 175), 'end': (75, 125)},  # First segment curve
                         1: {'start': (125, 175), 'end': (175, 275)},  # Second segment curve
                         2: {'start': (225, 275), 'end': (275, 175)}   # Third segment curve
                     })
                     .build())
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
    
    spiral_element = (duc.ElementBuilder()
                      .with_label("Spiral Path")
                      .with_styles(duc.create_stroke_style(
                          duc.create_solid_content("#00FF00"),
                          width=1.5
                      ))
                      .build_linear_element()
                      .with_points(spiral_points)
                      .build())
    elements.append(spiral_element)
    
    # Create rectangles using linear elements (4-point closed paths)
    rect1_points = [
        (0, 0),
        (80, 0),
        (80, 60),
        (0, 60),
        (0, 0)  # Close the rectangle
    ]
    
    rect1_element = (duc.ElementBuilder()
                     .at_position(400.0, 100.0)
                     .with_label("Rectangle 1")
                     .with_styles(duc.create_fill_and_stroke_style(
                         duc.create_solid_content("#FFFF00", opacity=0.3),  # Yellow fill
                         duc.create_solid_content("#000000"),  # Black stroke
                         stroke_width=2.0
                     ))
                     .build_linear_element()
                     .with_points(rect1_points)
                     .build())
    elements.append(rect1_element)
    
    # Create a second rectangle with different styling
    rect2_points = [
        (0, 0),
        (100, 0),
        (100, 80),
        (0, 80),
        (0, 0)  # Close the rectangle
    ]
    
    rect2_element = (duc.ElementBuilder()
                     .at_position(500.0, 100.0)
                     .with_label("Rectangle 2")
                     .with_styles(duc.create_fill_and_stroke_style(
                         duc.create_solid_content("#FF00FF", opacity=0.5),  # Magenta fill
                         duc.create_solid_content("#008000"),  # Green stroke
                         stroke_width=3.0
                     ))
                     .build_linear_element()
                     .with_points(rect2_points)
                     .build())
    elements.append(rect2_element)
    
    # Create a complex path with multiple segments and different styles
    complex_points = [
        (0, 300),
        (50, 250),
        (100, 350),
        (150, 250),
        (200, 300),
        (250, 200),
        (300, 350)
    ]
    
    complex_element = (duc.ElementBuilder()
                       .with_label("Complex Multi-Segment")
                       .with_styles(duc.create_stroke_style(
                           duc.create_solid_content("#800080"),  # Purple
                           width=4.0
                       ))
                       .build_linear_element()
                       .with_points(complex_points)
                       .build())
    elements.append(complex_element)
    
    # Create a star shape using linear elements
    star_points = []
    center_x, center_y = 400, 400
    outer_radius = 60
    inner_radius = 30
    
    for i in range(10):
        angle = i * math.pi / 5  # 36 degrees per point
        radius = outer_radius if i % 2 == 0 else inner_radius
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        star_points.append((x, y))
    
    # Close the star
    star_points.append(star_points[0])
    
    star_element = (duc.ElementBuilder()
                    .with_label("Star Shape")
                    .with_styles(duc.create_fill_and_stroke_style(
                        duc.create_solid_content("#FFA500", opacity=0.7),  # Orange fill
                        duc.create_solid_content("#000000"),  # Black stroke
                        stroke_width=2.5
                    ))
                    .build_linear_element()
                    .with_points(star_points)
                    .build())
    elements.append(star_element)
    
    # Test with Path Overrides
    # This demonstrates applying specific styles to individual segments of a linear element.
    path_override_line_points = [
        (0, 500),
        (100, 500),
        (100, 600),
        (200, 600),
        (200, 500)
    ]

    # Create a red stroke style for override
    red_stroke_content = duc.create_solid_content("#FF0000", opacity=1.0)
    red_stroke = duc.create_stroke(red_stroke_content, width=5.0)

    # Create a green fill style for override
    green_fill_content = duc.create_solid_content("#00FF00", opacity=0.5)
    green_background = duc.create_background(green_fill_content)

    # Override the first line segment (index 0) with a thick red stroke
    path_override1 = duc.create_duc_path(
        line_indices=[0],
        stroke=red_stroke
    )

    # Override the second line segment (index 1) with a green background
    path_override2 = duc.create_duc_path(
        line_indices=[1],
        background=green_background
    )

    # Override the third line segment (index 2) with both a thick red stroke and a green background
    path_override3 = duc.create_duc_path(
        line_indices=[2],
        stroke=red_stroke,
        background=green_background
    )

    path_override_element = (duc.ElementBuilder()
                             .at_position(50, 550) # Adjusted position to avoid overlap
                             .with_label("Linear with Path Overrides")
                             .with_styles(duc.create_stroke_style(
                                 duc.create_solid_content("#000000"), # Default black stroke
                                 width=1.0
                             ))
                             .build_linear_element()
                             .with_points(path_override_line_points)
                             .with_path_overrides([path_override1, path_override2, path_override3])
                             .build())
    elements.append(path_override_element)

    # Determine output path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    
    os.makedirs(output_dir, exist_ok=True)
    output_file_name = "test_complex_line_paths.duc"
    output_file_path = os.path.join(output_dir, output_file_name)

    # Serialize using the new io API
    serialized_bytes = duc.serialize_duc(
        name="ComplexLinePathsTest",
        elements=elements
    )

    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"

    # Write the serialized bytes to a .duc file
    with open(output_file_path, "wb") as f:
        f.write(serialized_bytes)

    print(f"Successfully serialized complex line paths to: {output_file_path}")
    print(f"You can now test this file with: flatc --json -o <output_json_dir> schema/duc.fbs -- {output_file_path}")

if __name__ == "__main__":
    # Allow running the test directly for quick checks, e.g., during development
    pytest.main([__file__]) # type: ignore 