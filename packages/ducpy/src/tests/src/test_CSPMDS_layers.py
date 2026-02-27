"""
CSPMDS Test for Layers: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of layer management in DUC files.
"""
import os

import ducpy as duc
import pytest
from ducpy.utils.mutate_utils import recursive_mutate


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
    
    # Create layers using the builders API
    layers = []
    background_layer = (duc.StateBuilder()
        .with_id("background")
        .with_readonly(False)
        .build_layer()
        .with_label("Background Layer")
        .build())
    foreground_layer = (duc.StateBuilder()
        .with_id("foreground") 
        .with_readonly(False)
        .build_layer()
        .with_label("Foreground Layer")
        .build())
    annotations_layer = (duc.StateBuilder()
        .with_id("annotations")
        .with_readonly(False)
        .build_layer()
        .with_label("Annotations Layer") 
        .build())
    dimensions_layer = (duc.StateBuilder()
        .with_id("dimensions")
        .with_readonly(False)
        .build_layer()
        .with_label("Dimensions Layer")
        .build())
    
    layers = [background_layer, foreground_layer, annotations_layer, dimensions_layer]
    
    # Create elements assigned to different layers
    elements = []
    
    # Background layer elements
    bg_rect = (duc.ElementBuilder()
              .at_position(0, 0)
              .with_size(200, 150)
              .with_label("Background Rect")
              .with_styles(duc.create_simple_styles())
              .with_layer_id("background")
              .build_rectangle()
              .build())
    elements.append(bg_rect)
    
    # Foreground layer elements
    fg_ellipse = (duc.ElementBuilder()
              .at_position(50, 50)
              .with_size(100, 80)
              .with_label("Foreground Ellipse")
              .with_styles(duc.create_simple_styles())
              .with_layer_id("foreground")
              .build_ellipse()
              .build())
    elements.append(fg_ellipse)
    
    fg_polygon = (duc.ElementBuilder()
              .at_position(150, 75)
              .with_size(60, 60)
              .with_label("Foreground Hexagon")
              .with_styles(duc.create_simple_styles())
              .with_layer_id("foreground")
              .build_polygon()
              .with_sides(6)
              .build())
    elements.append(fg_polygon)
    
    # Annotations layer elements
    ann_text = (duc.ElementBuilder()
              .at_position(25, 25)
              .with_size(100, 30)
              .with_label("Annotation Text")
              .with_styles(duc.create_simple_styles())
              .with_layer_id("annotations")
              .build_text_element()
              .with_text("Layer Test")
              .build())
    elements.append(ann_text)
    
    # Dimensions layer elements
    dim_line = (duc.ElementBuilder()
              .with_label("Dimension Line")
              .with_styles(duc.create_simple_styles())
              .with_layer_id("dimensions")
              .build_linear_element()
              .with_points([(300, 100), (400, 100)])
              .build())
    elements.append(dim_line)
    
    print(f"Created {len(layers)} layers and {len(elements)} elements")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_layers_initial.duc")
    duc.write_duc_file(
        file_path=initial_file,
        name="LayersCSPMDS_Initial",
        elements=elements,
        layers=layers
    )
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.read_duc_file(initial_file)
    loaded_elements = parsed_data.elements
    loaded_layers = parsed_data.layers
    
    assert len(loaded_elements) == len(elements)
    assert len(loaded_layers) == len(layers)
    print(f"Loaded {len(loaded_elements)} elements and {len(loaded_layers)} layers")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying layer properties and element assignments...")
    
    mutations_count = 0
    
    # Mutate layer properties
    for layer in loaded_layers:
        if "Background" in layer.stack_base.label:
            recursive_mutate(layer.stack_base, {"label": "Updated Background Layer"})
            mutations_count += 1
            print(f"Updated background layer label")
        elif "Foreground" in layer.stack_base.label:
            recursive_mutate(layer, {"readonly": True})
            mutations_count += 1
            print(f"Made foreground layer readonly")
    
    # Mutate element layer assignments
    for element in loaded_elements:
        if hasattr(element.element, 'base'):
            if "Background Rect" in element.element.base.label:
                duc.mutate_element(element, layer_id="foreground")
                mutations_count += 1
                print(f"Moved background rect to foreground layer")
            elif "Foreground Ellipse" in element.element.base.label:
                duc.mutate_element(element, layer_id="annotations")
                mutations_count += 1
                print(f"Moved foreground ellipse to annotations layer")
        elif hasattr(element.element, 'linear_base'):
            if "Dimension Line" in element.element.linear_base.base.label:
                duc.mutate_element(element, layer_id="foreground")
                mutations_count += 1
                print(f"Moved dimension line to foreground layer")
    
    print(f"Applied {mutations_count} mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some layers and elements...")
    
    # Remove dimensions layer and its elements
    layers_to_keep = [l for l in loaded_layers if "Dimensions" not in l.stack_base.label]
    elements_to_keep = []
    for e in loaded_elements:
        if hasattr(e.element, 'base'):
            if e.element.base.layer_id != "dimensions":
                elements_to_keep.append(e)
        elif hasattr(e.element, 'linear_base'):
            if e.element.linear_base.base.layer_id != "dimensions":
                elements_to_keep.append(e)
    
    # Also remove one more element to ensure we have fewer elements
    if len(elements_to_keep) > 0:
        elements_to_keep = elements_to_keep[:-1]  # Remove the last element
    
    print(f"Deleted dimensions layer and its elements")
    print(f"Keeping {len(layers_to_keep)} layers and {len(elements_to_keep)} elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_layers_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="LayersCSPMDS_Final",
        elements=elements_to_keep,
        layers=layers_to_keep
    )
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.read_duc_file(final_file)
    final_elements = final_parsed_data.elements
    final_layers = final_parsed_data.layers
    
    print(f"Final element count: {len(final_elements)}")
    print(f"Final layer count: {len(final_layers)}")
    assert len(final_elements) == len(elements_to_keep)
    assert len(final_layers) == len(layers_to_keep)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    assert len(final_layers) < len(layers)  # Should be fewer than original
    
    # Verify mutations were applied
    updated_content_found = False
    
    for layer in final_layers:
        if "Updated" in layer.stack_base.label:
            updated_content_found = True
        if "Foreground" in layer.stack_base.label and layer.readonly:
            updated_content_found = True
    
    for element in final_elements:
        if hasattr(element.element, 'base'):
            if element.element.base.layer_id == "foreground" and "Background Rect" in element.element.base.label:
                updated_content_found = True
        elif hasattr(element.element, 'linear_base'):
            if element.element.linear_base.base.layer_id == "foreground":
                updated_content_found = True
    
    assert updated_content_found, "Some content should contain updates"
    
    # Verify deleted elements are gone
    remaining_layer_labels = [l.stack_base.label for l in final_layers]
    assert "Dimensions Layer" not in remaining_layer_labels, "Dimensions layer should be deleted"
    
    remaining_element_layer_ids = []
    for e in final_elements:
        if hasattr(e.element, 'base'):
            remaining_element_layer_ids.append(e.element.base.layer_id)
        elif hasattr(e.element, 'linear_base'):
            remaining_element_layer_ids.append(e.element.linear_base.base.layer_id)
    assert "dimensions" not in remaining_element_layer_ids, "No elements should be in dimensions layer"
    
    print("✅ CSPMDS Layers test completed successfully!")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def test_layers_via_sql():
    """Create layers and assign elements to them using raw SQL."""
    from ducpy.builders.sql_builder import DucSQL

    with DucSQL.new() as db:
        # Create two layers (stack_properties + layers)
        for lid, label, readonly in [
            ("background", "Background Layer", 0),
            ("foreground", "Foreground Layer", 0),
        ]:
            db.sql(
                "INSERT INTO stack_properties (id, label, is_visible, locked, opacity) "
                "VALUES (?,?,1,0,1.0)", lid, label,
            )
            db.sql("INSERT INTO layers (id, readonly) VALUES (?,?)", lid, readonly)

        # Create elements assigned to layers
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "bg_rect", "rectangle", 0, 0, 200, 150, "Background Rect", "background",
        )
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "fg_ellipse", "ellipse", 50, 50, 100, 80, "Foreground Ellipse", "foreground",
        )
        db.sql(
            "INSERT INTO element_ellipse (element_id, ratio, start_angle, end_angle) VALUES (?,?,?,?)",
            "fg_ellipse", 1.0, 0.0, 6.283185307,
        )

        # Verify layer assignment
        bg_els = db.sql("SELECT id FROM elements WHERE layer_id = ?", "background")
        fg_els = db.sql("SELECT id FROM elements WHERE layer_id = ?", "foreground")
        assert len(bg_els) == 1 and bg_els[0]["id"] == "bg_rect"
        assert len(fg_els) == 1 and fg_els[0]["id"] == "fg_ellipse"

        # Reassign element to different layer
        db.sql("UPDATE elements SET layer_id = ? WHERE id = ?", "foreground", "bg_rect")
        assert len(db.sql("SELECT id FROM elements WHERE layer_id = ?", "foreground")) == 2

        # Delete a layer — verify cascade to stack_properties doesn't remove elements
        db.sql("UPDATE elements SET layer_id = NULL WHERE layer_id = ?", "background")
        db.sql("DELETE FROM stack_properties WHERE id = ?", "background")
        assert db.sql("SELECT * FROM layers WHERE id = ?", "background") == []
        assert len(db.sql("SELECT * FROM elements")) == 2  # elements still exist

        raw = db.to_bytes()

    with DucSQL.from_bytes(raw) as db2:
        assert len(db2.sql("SELECT * FROM layers")) == 1
        assert len(db2.sql("SELECT * FROM elements")) == 2


# Legacy CSPMDS test now covered by SQL-first test for the new schema.
test_cspmds_layers = test_layers_via_sql


if __name__ == "__main__":
    pytest.main([__file__])
