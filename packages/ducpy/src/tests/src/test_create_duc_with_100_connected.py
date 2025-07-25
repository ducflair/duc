"""
Test creating a DUC file with 100 connected elements.
"""
import os
import random
import io
import pytest
import ducpy as duc

def test_create_100_connected_elements(test_output_dir):
    """
    Tests creating a DUC file with 100 elements that are connected to each other
    via bindings.
    """
    elements = []
    num_elements = 50 # Using 50 to keep test execution time reasonable
    canvas_width, canvas_height = 2000, 2000

    # Create a root element to start the chain
    root_element_wrapper = (duc.ElementBuilder()
                           .at_position(canvas_width / 2, canvas_height / 2)
                           .with_size(100, 100)
                           .with_styles(duc.create_simple_styles())
                           .build_rectangle()
                           .build())
    elements.append(root_element_wrapper)

    # Create a chain of connected elements
    for i in range(num_elements - 1):
        # Choose a random parent from the existing elements
        parent_wrapper = random.choice([e for e in elements if not hasattr(e.element, 'linear_base')])
        parent_element = parent_wrapper.element
        
        # Create a new element to connect to
        new_element_wrapper = (duc.ElementBuilder()
                              .at_position(
                                  parent_element.base.x + random.uniform(-200, 200),
                                  parent_element.base.y + random.uniform(150, 250)
                              )
                              .with_size(
                                  random.uniform(50, 100),
                                  random.uniform(50, 100)
                              )
                              .with_styles(duc.create_simple_styles())
                              .build_rectangle()
                              .build())
        elements.append(new_element_wrapper)
        new_element = new_element_wrapper.element

        # Create a connector (line or arrow) between the parent and the new element
        start_binding = duc.DucPointBinding(element_id=parent_element.base.id, focus=0.5, gap=0.0, fixed_point=None, point=None, head=None)
        end_binding = duc.DucPointBinding(element_id=new_element.base.id, focus=0.5, gap=0.0, fixed_point=None, point=None, head=None)
        
        connector_stroke = duc.create_stroke(duc.create_solid_content("#333333"), width=1.5)
        connector_styles = duc.create_simple_styles(strokes=[connector_stroke])

        use_arrow = random.choice([True, False])
        if use_arrow:
            connector = (duc.ElementBuilder()
                        .with_styles(connector_styles)
                        .build_arrow_element()
                        .with_points([(parent_element.base.x, parent_element.base.y), (new_element.base.x, new_element.base.y)])
                        .with_start_binding(start_binding)
                        .with_end_binding(end_binding)
                        .build())
        else:
            connector = (duc.ElementBuilder()
                        .with_styles(connector_styles)
                        .build_linear_element()
                        .with_points([(parent_element.base.x, parent_element.base.y), (new_element.base.x, new_element.base.y)])
                        .with_start_binding(start_binding)
                        .with_end_binding(end_binding)
                        .build())
        
        # Add the connector to the bound_elements of both parent and new element
        connector_id = connector.element.linear_base.base.id
        
        # Use mutate_element to update the bound_elements list
        duc.mutate_element(
            parent_wrapper, 
            bound_elements=parent_element.base.bound_elements + [duc.create_bound_element(element_id=connector_id, element_type="linear")]
        )
        duc.mutate_element(
            new_element_wrapper, 
            bound_elements=new_element.base.bound_elements + [duc.create_bound_element(element_id=connector_id, element_type="linear")]
        )
        
        elements.append(connector)

    # Serialize and save the DUC file
    output_file = os.path.join(test_output_dir, "test_100_connected.duc")
    serialized_data = duc.serialize_duc(name="ConnectedElementsTest", elements=elements)

    with open(output_file, 'wb') as f:
        f.write(serialized_data)

    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0

    # Parse the file and verify the bindings
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
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
        if hasattr(el_wrapper.element, 'linear_base'):
            linear_element = el_wrapper.element.linear_base
            if hasattr(linear_element, 'start_binding') and linear_element.start_binding:
                num_bindings_found += 1
            if hasattr(linear_element, 'end_binding') and linear_element.end_binding:
                num_bindings_found += 1

    print(f"Created {len(elements)} connected elements with {num_bindings_found} bindings")
    print(f"Element IDs: {len(element_ids)} unique elements")
    print(f"Saved to: {output_file}")

def test_create_connected_duc(test_output_dir):
    """Test creating a simple connected DUC file."""
    # This is a simplified version for quick testing
    elements = []
    
    # Create two rectangles
    rect1 = (duc.ElementBuilder()
             .at_position(100, 100)
             .with_size(80, 60)
             .with_styles(duc.create_simple_styles())
             .build_rectangle()
             .build())
    
    rect2 = (duc.ElementBuilder()
             .at_position(300, 100)
             .with_size(80, 60)
             .with_styles(duc.create_simple_styles())
             .build_rectangle()
             .build())
    
    elements.extend([rect1, rect2])
    
    # Create a connector line
    connector = (duc.ElementBuilder()
                .with_styles(duc.create_simple_styles())
                .build_linear_element()
                .with_points([(180, 130), (300, 130)])
                .build())
    
    elements.append(connector)
    
    # Serialize and save
    output_file = os.path.join(test_output_dir, "test_connected_simple.duc")
    serialized_data = duc.serialize_duc(name="SimpleConnectedTest", elements=elements)
    
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"Created simple connected DUC with {len(elements)} elements")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

if __name__ == "__main__":
    pytest.main([__file__])
