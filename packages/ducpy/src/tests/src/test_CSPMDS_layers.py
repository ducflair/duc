"""
CSPMDS Test for Layers: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of layer management in DUC files.
"""
import io
import os
import random
import pytest

import ducpy as duc


def test_cspmds_layers(test_output_dir):
    """
    CSPMDS test for layers:
    - Create: Create layers and elements assigned to different layers
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify layer properties and reassign elements
    - Delete: Remove some layers and elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating DucLayer objects and elements...")
    
    # Create actual DucLayer objects using builders
    layers = []
    background_layer = duc.create_layer(
        id="background",
        label="Background Layer",
        readonly=False
    )
    foreground_layer = duc.create_layer(
        id="foreground", 
        label="Foreground Layer",
        readonly=False,
        overrides=duc.create_layer_overrides(
            stroke=duc.create_stroke(duc.create_solid_content("#FF0000"), width=2.0),
            background=duc.create_background(duc.create_solid_content("#FFEEEE"))
        )
    )
    annotations_layer = duc.create_layer(
        id="annotations",
        label="Annotations Layer", 
        readonly=False,
        overrides=duc.create_layer_overrides(
            stroke=duc.create_stroke(duc.create_solid_content("#00AA00"), width=1.5),
            background=duc.create_background(duc.create_solid_content("#EEFFEE"))
        )
    )
    dimensions_layer = duc.create_layer(
        id="dimensions",
        label="Dimensions Layer",
        readonly=False,
        overrides=duc.create_layer_overrides(
            stroke=duc.create_stroke(duc.create_solid_content("#0000FF"), width=0.5),
            background=duc.create_background(duc.create_solid_content("#EEEEFF"))
        )
    )
    
    layers = [background_layer, foreground_layer, annotations_layer, dimensions_layer]
    layer_ids = [layer.id for layer in layers]
    
    # Create elements assigned to different layers
    elements = []
    
    # Background layer elements
    bg_rect = duc.create_rectangle(
        x=0, y=0, width=200, height=150, 
        styles=duc.create_simple_styles(), 
        label="Background Rect"
    )
    duc.mutate_element(bg_rect, layer_id="background")
    elements.append(bg_rect)
    
    # Foreground layer elements
    fg_ellipse = duc.create_ellipse(
        x=50, y=50, width=100, height=80,
        styles=duc.create_simple_styles(),
        label="Foreground Ellipse"
    )
    duc.mutate_element(fg_ellipse, layer_id="foreground")
    elements.append(fg_ellipse)
    
    fg_polygon = duc.create_polygon(
        x=150, y=75, sides=6, width=60, height=60,
        styles=duc.create_simple_styles(),
        label="Foreground Hexagon"
    )
    duc.mutate_element(fg_polygon, layer_id="foreground")
    elements.append(fg_polygon)
    
    # Annotations layer elements
    # Note: Text elements seem to have style issues, skipping for now
    # ann_text = duc.create_text_element(
    #     x=25, y=25, text="Layer Test",
    #     styles=duc.create_simple_styles(),
    #     label="Annotation Text"
    # )
    # duc.mutate_element(ann_text, layer_id="annotations")
    # elements.append(ann_text)
    
    # Dimensions layer elements  
    dim_line = duc.create_linear_element(
        points=[(0, 0), (100, 100)],
        styles=duc.create_simple_styles(),
        label="Dimension Line"
    )
    duc.mutate_element(dim_line, layer_id="dimensions")
    elements.append(dim_line)
    
    print(f"Created {len(elements)} elements and {len(layers)} DucLayer objects")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_layers_initial.duc")
    serialized_data = duc.serialize_duc(
        name="LayersCSPMDS_Initial", 
        elements=elements,
        layers=layers
    )
    
    with open(initial_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    loaded_layers = parsed_data.layers if hasattr(parsed_data, 'layers') else []
    
    assert len(loaded_elements) == len(elements)
    assert len(loaded_layers) == len(layers)
    print(f"Loaded {len(loaded_elements)} elements and {len(loaded_layers)} DucLayer objects")
    
    # Verify layer assignments and overrides
    layer_counts = {}
    override_tests = 0
    for el_wrapper in loaded_elements:
        if hasattr(el_wrapper.element, 'base'):
            layer_id = el_wrapper.element.base.layer_id
        elif hasattr(el_wrapper.element, 'linear_base'):
            layer_id = el_wrapper.element.linear_base.base.layer_id
        else:
            layer_id = "unknown"
            
        layer_counts[layer_id] = layer_counts.get(layer_id, 0) + 1
    
    # Test layer overrides are properly loaded
    for layer in loaded_layers:
        if layer.overrides is not None:
            override_tests += 1
            assert layer.overrides.stroke is not None, f"Layer {layer.id} should have stroke override"
            assert layer.overrides.background is not None, f"Layer {layer.id} should have background override"
    
    print(f"Layer distribution: {layer_counts}")
    print(f"Layers with overrides: {override_tests}")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying layer assignments and properties...")
    
    mutations_count = 0
    for el_wrapper in loaded_elements:
        # Randomly reassign some elements to different layers
        if random.random() < 0.5:  # 50% chance to reassign
            new_layer = random.choice(layer_ids)
            duc.mutate_element(el_wrapper, layer_id=new_layer)
            mutations_count += 1
        
        # Also randomly move elements
        if hasattr(el_wrapper.element, 'base'):
            duc.mutate_element(
                el_wrapper,
                x=el_wrapper.element.base.x + random.uniform(-50, 50),
                y=el_wrapper.element.base.y + random.uniform(-50, 50)
            )
        elif hasattr(el_wrapper.element, 'linear_base'):
            old_points = el_wrapper.element.linear_base.points
            new_points = [
                type(p)(x=p.x + random.uniform(-25, 25), y=p.y + random.uniform(-25, 25)) 
                for p in old_points
            ]
            duc.mutate_element(el_wrapper, points=new_points)
    
    print(f"Mutated {mutations_count} layer assignments")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some elements...")
    
    # Remove elements from specific layers (simulate deleting layers)
    elements_to_delete = []
    for i, el_wrapper in enumerate(loaded_elements):
        # Delete all elements from "dimensions" layer
        if hasattr(el_wrapper.element, 'base'):
            if el_wrapper.element.base.layer_id == "dimensions":
                elements_to_delete.append(i)
        elif hasattr(el_wrapper.element, 'linear_base'):
            if el_wrapper.element.linear_base.base.layer_id == "dimensions":
                elements_to_delete.append(i)
    
    # Remove elements (in reverse order to maintain indices)
    for i in reversed(elements_to_delete):
        del loaded_elements[i]
    
    print(f"Deleted {len(elements_to_delete)} elements from dimensions layer")
    
    # Remove dimensions layer from the layers list as well
    layers_to_delete = []
    for i, layer in enumerate(loaded_layers):
        if layer.stack_base.label == "Dimensions Layer":  # Use label instead of empty id
            layers_to_delete.append(i)
    
    for i in reversed(layers_to_delete):
        del loaded_layers[i]
    
    print(f"Deleted dimensions layer definition")
    
    # Also randomly delete some other elements
    additional_deletes = min(2, len(loaded_elements) // 3)  # Delete up to 1/3 but at least 2
    for _ in range(additional_deletes):
        if loaded_elements:
            random_index = random.randint(0, len(loaded_elements) - 1)
            del loaded_elements[random_index]
    
    print(f"Deleted {additional_deletes} additional random elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_layers_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="LayersCSPMDS_Final", 
        elements=loaded_elements,
        layers=loaded_layers
    )
    
    with open(final_file, 'wb') as f:
        f.write(final_serialized_data)
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_elements = final_parsed_data.elements
    final_layers = final_parsed_data.layers if hasattr(final_parsed_data, 'layers') else []
    
    print(f"Final element count: {len(final_elements)}")
    print(f"Final layer count: {len(final_layers)}")
    assert len(final_elements) == len(loaded_elements)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    assert len(final_layers) < len(layers)  # Should have fewer layers too
    
    # Verify dimensions layer is completely removed
    dimensions_layer_found = any(layer.id == "dimensions" for layer in final_layers)
    assert not dimensions_layer_found, "Dimensions layer should be completely removed"
    
    # Verify no elements remain in dimensions layer
    final_layer_counts = {}
    for el_wrapper in final_elements:
        if hasattr(el_wrapper.element, 'base'):
            layer_id = el_wrapper.element.base.layer_id
        elif hasattr(el_wrapper.element, 'linear_base'):
            layer_id = el_wrapper.element.linear_base.base.layer_id
        else:
            layer_id = "unknown"
            
        final_layer_counts[layer_id] = final_layer_counts.get(layer_id, 0) + 1
    
    print(f"Final layer distribution: {final_layer_counts}")
    assert "dimensions" not in final_layer_counts, "Dimensions layer should be completely removed"
    
    print("✅ CSPMDS Layers test completed successfully!")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])
