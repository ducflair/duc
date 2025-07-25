"""
Random element movement test using the new builders API.
Tests moving elements randomly across the canvas.
"""
import random
import os
import pytest

import ducpy as duc


def test_move_elements_randomly():
    """Test moving elements randomly using the new builders API."""
    
    # Create elements using the new ElementBuilder API
    elements = [
        (duc.ElementBuilder()
         .at_position(100, 100)
         .with_size(50, 50)
         .with_styles(duc.create_simple_styles())
         .with_label("Rectangle")
         .build_rectangle()
         .build()),
        
        (duc.ElementBuilder()
         .at_position(200, 200)
         .with_size(60, 40)
         .with_styles(duc.create_simple_styles())
         .with_label("Ellipse")
         .build_ellipse()
         .build()),
        
        (duc.ElementBuilder()
         .at_position(300, 150)
         .with_size(80, 60)
         .with_styles(duc.create_simple_styles())
         .with_label("Polygon")
         .build_polygon()
         .with_sides(6)
         .build()),
        
        (duc.ElementBuilder()
         .at_position(150, 300)
         .with_styles(duc.create_simple_styles())
         .with_label("Line")
         .build_linear_element()
         .with_points([(0, 0), (100, 50)])
         .build()),
    ]
    
    print(f"Created {len(elements)} elements")
    
    # Move elements randomly
    for i, element in enumerate(elements):
        new_x = random.uniform(0, 500)
        new_y = random.uniform(0, 500)
        
        duc.mutate_element(element, x=new_x, y=new_y)
        print(f"Moved element {i+1} to ({new_x:.1f}, {new_y:.1f})")
    
    # Determine output path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    
    os.makedirs(output_dir, exist_ok=True)
    output_file_name = "test_move_elements_randomly.duc"
    output_file_path = os.path.join(output_dir, output_file_name)
    
    # Serialize using the new io API
    serialized_bytes = duc.serialize_duc(
        name="MoveElementsRandomlyTest",
        elements=elements
    )
    
    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"
    
    # Write the serialized bytes to a .duc file
    with open(output_file_path, "wb") as f:
        f.write(serialized_bytes)
    
    print(f"Successfully serialized moved elements to: {output_file_path}")
    print(f"You can now test this file with: flatc --json -o <output_json_dir> schema/duc.fbs -- {output_file_path}")


if __name__ == "__main__":
    # Allow running the test directly for quick checks, e.g., during development
    import pytest # type: ignore
    pytest.main([__file__])
