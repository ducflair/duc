"""
Test moving elements randomly in a DUC file.
"""
import io
import os
import random

import pytest

import ducpy as duc
from ducpy.classes.ElementsClass import DucEllipseElement, DucRectangleElement, DucPolygonElement, DucLinearElement

def test_move_elements_randomly(test_output_dir):
    """
    Tests creating a DUC file, loading it, moving elements randomly, and saving.
    """
    elements = [
        duc.create_rectangle(x=100, y=100, width=50, height=50, styles=duc.create_simple_styles(), label="Rectangle"),
        duc.create_ellipse(x=200, y=200, width=80, height=60, styles=duc.create_simple_styles(), label="Ellipse"),
        duc.create_polygon(x=300, y=150, sides=5, width=70, height=70, styles=duc.create_simple_styles(), label="Pentagon"),
        duc.create_linear_element(points=[(400, 400), (500, 450)], styles=duc.create_simple_styles(), label="Line")
    ]
    
    initial_positions = {}
    for el in elements:
        if hasattr(el.element, 'base'):
            initial_positions[el.element.base.id] = (el.element.base.x, el.element.base.y)
        elif hasattr(el.element, 'linear_base'):
            initial_positions[el.element.linear_base.base.id] = (el.element.linear_base.base.x, el.element.linear_base.base.y)
    
    output_file = os.path.join(test_output_dir, "test_move_elements_before.duc")
    
    serialized_data = duc.serialize_duc(name="MoveTestInitial", elements=elements)
    
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
        
    assert os.path.exists(output_file)
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    
    assert len(loaded_elements) == len(elements)
    
    for el_wrapper in loaded_elements:
        el = el_wrapper.element
        move_x = random.uniform(-200, 200)
        move_y = random.uniform(-200, 200)

        if isinstance(el, DucEllipseElement):
            el.base.x += move_x
            el.base.y += move_y
        elif isinstance(el, DucRectangleElement):
            el.base.x += move_x
            el.base.y += move_y
        elif isinstance(el, DucPolygonElement):
            el.base.x += move_x
            el.base.y += move_y
        elif isinstance(el, DucLinearElement):
            el.linear_base.base.x += move_x
            el.linear_base.base.y += move_y
            for point in el.linear_base.points:
                point.x += move_x
                point.y += move_y

    moved_output_file = os.path.join(test_output_dir, "test_move_elements_after.duc")
    
    moved_serialized_data = duc.serialize_duc(name="MoveTestMoved", elements=loaded_elements)
    
    with open(moved_output_file, 'wb') as f:
        f.write(moved_serialized_data)
        
    assert os.path.exists(moved_output_file)
    
    re_parsed_data = duc.parse_duc(io.BytesIO(moved_serialized_data))
    re_loaded_elements = re_parsed_data.elements
    
    assert len(re_loaded_elements) == len(elements)

    assert len(loaded_elements) == len(elements)
    
    positions_changed = 0
    for el_wrapper in re_loaded_elements:
        el = el_wrapper.element
        if hasattr(el, 'base'):
            current_pos = (el.base.x, el.base.y)
            for orig_el in elements:
                if (hasattr(orig_el.element, 'base') and 
                    orig_el.element.base.label == el.base.label):
                    initial_pos = (orig_el.element.base.x, orig_el.element.base.y)
                    if current_pos != initial_pos:
                        positions_changed += 1
                    break
        elif hasattr(el, 'linear_base'):
            current_pos = (el.linear_base.base.x, el.linear_base.base.y)
            for orig_el in elements:
                if (hasattr(orig_el.element, 'linear_base') and 
                    orig_el.element.linear_base.base.label == el.linear_base.base.label):
                    initial_pos = (orig_el.element.linear_base.base.x, orig_el.element.linear_base.base.y)
                    if current_pos != initial_pos:
                        positions_changed += 1
                    break

    assert positions_changed == len(elements)
    print(f"Successfully moved {positions_changed} elements")
    print(f"Re-parsed {len(re_loaded_elements)} elements from moved file")

    print("✅ Test for moving elements randomly passed!")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

# This test should:
# 1. Load a duc file (parse)
# 2. Move all the elements around randomly
# 3. Save the duc file (serialize)
if __name__ == "__main__":
    pytest.main([__file__])
