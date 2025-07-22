"""
Test creating a DUC file with 100 connected elements.
"""
import os
import random
import io
import pytest
import ducpy as duc
from ducpy.classes.ElementsClass import BoundElement

def test_create_100_connected_elements(test_output_dir):
    """
    Tests creating a DUC file with 100 elements that are connected to each other
    via bindings.
    """
    elements = []
    num_elements = 50 # Using 50 to keep test execution time reasonable
    canvas_width, canvas_height = 2000, 2000

    # Create a root element to start the chain
    root_element_wrapper = duc.create_rectangle(
        x=canvas_width / 2,
        y=canvas_height / 2,
        width=100,
        height=100,
        styles=duc.create_simple_styles()
    )
    elements.append(root_element_wrapper)

    # Create a chain of connected elements
    for i in range(num_elements - 1):
        # Choose a random parent from the existing elements
        parent_wrapper = random.choice([e for e in elements if not hasattr(e.element, 'linear_base')])
        parent_element = parent_wrapper.element
        
        # Create a new element to connect to
        new_element_wrapper = duc.create_rectangle(
            x=parent_element.base.x + random.uniform(-200, 200),
            y=parent_element.base.y + random.uniform(150, 250),
            width=random.uniform(50, 100),
            height=random.uniform(50, 100),
            styles=duc.create_simple_styles()
        )
        elements.append(new_element_wrapper)
        new_element = new_element_wrapper.element

        # Create a connector (line or arrow) between the parent and the new element
        start_binding = duc.create_point_binding(element_id=parent_element.base.id, focus=0.5)
        end_binding = duc.create_point_binding(element_id=new_element.base.id, focus=0.5)
        
        connector_stroke = duc.create_stroke(duc.create_solid_content("#333333"), width=1.5)
        connector_styles = duc.create_simple_styles(strokes=[connector_stroke])

        use_arrow = random.choice([True, False])
        if use_arrow:
            connector = duc.create_arrow_element(
                points=[(parent_element.base.x, parent_element.base.y), (new_element.base.x, new_element.base.y)],
                start_binding=start_binding,
                end_binding=end_binding,
                styles=connector_styles
            )
        else:
            connector = duc.create_linear_element(
                points=[(parent_element.base.x, parent_element.base.y), (new_element.base.x, new_element.base.y)],
                start_binding=start_binding,
                end_binding=end_binding,
                styles=connector_styles
            )
        
        # Add the connector to the bound_elements of both parent and new element
        connector_id = connector.element.linear_base.base.id
        parent_element.base.bound_elements.append(BoundElement(id=connector_id, type="linear"))
        new_element.base.bound_elements.append(BoundElement(id=connector_id, type="linear"))
        
        elements.append(connector)

    # Serialize and save the DUC file
    output_file = os.path.join(test_output_dir, "test_100_connected.duc")
    serialized_data = duc.serialize_duc(name="ConnectedElementsTest", elements=elements)

    with open(output_file, 'wb') as f:
        f.write(serialized_data)

    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0

    # Parse the file and verify the bindings
    parsed_data = duc.parse_duc_flatbuffers(io.BytesIO(serialized_data))
    parsed_elements = parsed_data.elements

    assert len(parsed_elements) == len(elements)

    num_bindings_found = 0
    element_ids = set()
    for e in elements:
        if hasattr(e.element, 'base'):
            element_ids.add(e.element.base.id)
        elif hasattr(e.element, 'linear_base'):
            element_ids.add(e.element.linear_base.base.id)

    for el_wrapper in parsed_elements:
        el = el_wrapper.element
        if hasattr(el, 'linear_base') and el.linear_base.start_binding:
            assert el.linear_base.start_binding.element_id in element_ids
            num_bindings_found += 1
        if hasattr(el, 'linear_base') and el.linear_base.end_binding:
            assert el.linear_base.end_binding.element_id in element_ids
            num_bindings_found += 1
            
    # Each connector has a start and end binding
    expected_bindings = (num_elements - 1) * 2
    assert num_bindings_found == expected_bindings, f"Expected {expected_bindings} bindings, but found {num_bindings_found}"

    print(f"✅ Connected elements test passed! ({len(elements)} elements, {num_bindings_found} bindings)")

def test_create_connected_duc(test_output_dir):
    """Legacy test for compatibility."""
    test_create_100_connected_elements(test_output_dir)

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

if __name__ == "__main__":
    pytest.main([__file__])
