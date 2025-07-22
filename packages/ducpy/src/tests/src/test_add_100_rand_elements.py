"""
Test adding 100 random elements to a DUC file.
"""
import os
import random
import pytest
import ducpy as duc

def create_random_rectangle(x: float, y: float):
    """Create a rectangle element with random dimensions."""
    return duc.create_rectangle(
        x=x,
        y=y,
        width=random.uniform(50, 150),
        height=random.uniform(50, 150),
        angle=random.uniform(0, 360),
        styles=duc.create_stroke_style(
            duc.create_solid_content("#000000"),
            width=2.0
        )
    )

def create_random_line(x: float, y: float):
    """Create a linear element with random path."""
    # Create a simple line with 2-30 random points
    num_points = random.randint(2, 30)
    points = [(x, y)]  # Start at given position
    
    for i in range(1, num_points):
        # Add points with some random offset
        x_offset = random.uniform(-50, 50)
        y_offset = random.uniform(-50, 50)
        points.append((x + x_offset, y + y_offset))
    
    return duc.create_linear_element(
        points=points,
        styles=duc.create_stroke_style(
            duc.create_solid_content("#0000FF"),
            width=2.0
        )
    )
def create_random_elements(num_elements: int = 100):
    """Create a list of random elements."""
    elements = []
    canvas_width = 2000
    canvas_height = 2000
    
    for _ in range(num_elements):
        x = random.uniform(0, canvas_width)
        y = random.uniform(0, canvas_height)
        
        if random.random() < 0.5:
            elements.append(create_random_rectangle(x, y))
        else:
            elements.append(create_random_line(x, y))
            
    return elements

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

def test_add_100_random_elements(test_output_dir):
    """Test adding 100 random elements and saving."""
    num_elements = 100
    output_file = os.path.join(test_output_dir, "test_100_random.duc")

    # Create elements using the clean API
    elements = create_random_elements(num_elements)
    
    # Serialize using the clean API
    serialized_bytes = duc.serialize_duc(
        name="RandomElementsTest",
        elements=elements
    )
    
    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"
    
    # Write to file
    with open(output_file, 'wb') as f:
        f.write(serialized_bytes)
    
    print(f"Created DUC file with {len(elements)} random elements at {output_file}")
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"
    
# This test should:
# 1. Load a duc file (parse)
# 2. Add 100 random elements to the file
# 3. Save the duc file (serialize)
if __name__ == "__main__":
    pytest.main([__file__])
