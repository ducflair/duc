"""
CSPMDS Test for Blocks and Instances: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of DucBlock and DucBlockInstance in DUC files.
"""
import io
import math
import os
import random
import pytest

import ducpy as duc
from ducpy.classes.ElementsClass import DucBlockInstance, StringValueEntry, DucBlockDuplicationArray
from ducpy.classes.DataStateClass import ExportedDataState
from ducpy.builders.block_utils import instantiate_block

def val_get_base(element):
    if hasattr(element, "linear_base"):
        return element.linear_base.base
    return element.base


def test_cspmds_blocks_and_instances(test_output_dir):
    """
    CSPMDS test for blocks and instances (like Figma components):
    - Create: Create DucBlock definitions and DucBlockInstance instances
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify blocks and instances
    - Delete: Remove some instances and blocks
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating DucBlock definitions and instances...")
    
    # 1. Initialize State Container
    # We need a state object to hold blocks, instances, and elements
    state = ExportedDataState(
        type="DUC_DATA",
        version="2.0.0",
        source="ducpy_test",
        thumbnail=b"",
        elements=[],
        blocks=[],
        block_instances=[],
        block_collections=[],
        groups=[],
        regions=[],
        layers=[],
        standards=[],
        dictionary={},
        duc_local_state=None,
        duc_global_state=None,
        version_graph=None,
        files=[]
    )
    
    # First create some basic elements to use in block definitions using builders API
    title_rect = (duc.ElementBuilder()
                  .at_position(0, 0)
                  .with_size(140, 40)
                  .with_styles(duc.create_simple_styles())
                  .with_label("Title Rectangle")
                  .build_rectangle()
                  .build())
    
    title_text = (duc.ElementBuilder()
                  .at_position(70, 20)
                  .with_styles(duc.create_simple_styles())
                  .with_label("Title Text")
                  .build_text_element()
                  .with_text("TITLE")
                  .build())
    
    # Create arrow elements for symbol block
    arrow_line = (duc.ElementBuilder()
                  .with_styles(duc.create_simple_styles())
                  .with_label("Arrow Line")
                  .build_linear_element()
                  .with_points([(0, 10), (30, 10)])
                  .build())
    
    arrow_head = (duc.ElementBuilder()
                  .at_position(30, 10)
                  .with_size(10, 10)
                  .with_styles(duc.create_simple_styles())
                  .with_label("Arrow Head")
                  .build_polygon()
                  .with_sides(3)
                  .build())

    # We need to add these "source" elements to the state so instantiate_block can find them?
    # Actually, instantiate_block looks for elements already in the state that are bound to the block definition.
    # So we need to:
    # 1. Create Blocks
    # 2. Assign block_ids to source elements
    # 3. Add source elements to state.elements
    
    # === CREATE BLOCK DEFINITIONS ===
    
    # Create a title block definition (like a Figma component)
    title_block = duc.create_block(
        id="title_block_v1",
        label="Title Block Component",
        elements=[], # Elements list deprecated in create_block? No, but we need to link them.
        description="Reusable title block for drawings"
    )
    # create_block returns a DucBlock object.
    # We need to manually set block_ids on source elements and add them to state
    # NOTE: In a real app, higher level logic handles this. Here we simulate it.
    
    for el in [title_rect, title_text]:
        base = el.element.linear_base.base if hasattr(el.element, 'linear_base') else el.element.base
        base.block_ids = ["title_block_v1"]
        state.elements.append(el)

    
    # Create arrow symbol block definition
    arrow_block = duc.create_block(
        id="arrow_symbol_v1", 
        label="Arrow Symbol Component",
        elements=[], 
        description="Reusable arrow symbol"
    )

    for el in [arrow_line, arrow_head]:
        base = el.element.linear_base.base if hasattr(el.element, 'linear_base') else el.element.base
        base.block_ids = ["arrow_symbol_v1"]
        state.elements.append(el)
        
    # Add blocks to state
    state.blocks.extend([title_block, arrow_block])
    
    # === CREATE BLOCK INSTANCES ===
    
    # Create multiple instances of the title block using the new utility
    # Title Instance 1
    instantiate_block(
        state=state,
        block_id="title_block_v1",
        position_x=100,
        position_y=100,
        instance_id="title_inst_1"
    )
    
    # Title Instance 2 (Create first, then add overrides manually as builder doesn't support them in instantiate_block yet)
    inst_2 = instantiate_block(
        state=state,
        block_id="title_block_v1",
        position_x=300,
        position_y=100,
        instance_id="title_inst_2"
    )
    
    # Add element overrides manually to the instance metadata
    title_overrides = [
        duc.create_string_value_entry(key="title_text_content", value="CUSTOM TITLE"),
        duc.create_string_value_entry(key="title_text_color", value="#FF0000"),
        duc.create_string_value_entry(key="title_background_color", value="#F0F0F0"),
        duc.create_string_value_entry(key="width", value="120"),
        duc.create_string_value_entry(key="height", value="35"),
        duc.create_string_value_entry(key="opacity", value="0.8")
    ]
    inst_2.element_overrides = title_overrides

    # Create arrow instances
    instantiate_block(
        state=state,
        block_id="arrow_symbol_v1",
        position_x=100,
        position_y=200,
        instance_id="arrow_inst_1"
    )
    
    instantiate_block(
        state=state,
        block_id="arrow_symbol_v1",
        position_x=200,
        position_y=200,
        instance_id="arrow_inst_2"
    )
    
    # Note: instantiate_block automatically adds generated elements to state.elements 
    # and metadata to state.block_instances.
    
    # Verify counts
    # 4 source elements + (2 title instances * 2 elements) + (2 arrow instances * 2 elements) = 4 + 4 + 4 = 12 total elements
    assert len(state.elements) == 12 
    assert len(state.block_instances) == 4
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_blocks_instances.duc")
    
    # Use internal serialize function since we built the state manually
    # Or reuse write_duc_file but populate it with our state content
    duc.write_duc_file(
        file_path=output_file,
        name="BlocksAndInstancesTest",
        elements=state.elements,
        blocks=state.blocks,
        block_instances=state.block_instances
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(state.elements)} elements and {len(state.blocks)} blocks")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    parsed_blocks = parsed_data.blocks if hasattr(parsed_data, 'blocks') else []
    parsed_instances = parsed_data.block_instances if hasattr(parsed_data, 'block_instances') else []
    
    assert len(parsed_elements) == 12
    # Should be 2 elements (rect + text)
    title_inst_1_elems = [el for el in parsed_elements if val_get_base(el.element).instance_id == "title_inst_1"]
    assert len(title_inst_1_elems) == 2, f"Expected 2 elements for title_inst_1, found {len(title_inst_1_elems)}"
    
    title_inst_2_elems = [el for el in parsed_elements if val_get_base(el.element).instance_id == "title_inst_2"]
    assert len(title_inst_1_elems) == 2
    
    print(f"✅ Parsed {len(parsed_elements)} elements, {len(parsed_blocks)} blocks, {len(parsed_instances)} instances")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying blocks and instances...")
    
    # Mutate instance position: find elements belonging to title_inst_1 and move them
    # Real app would update all elements sharing instance_id.
    for el_wrapper in parsed_elements:
        if val_get_base(el_wrapper.element).instance_id == "title_inst_1":
            duc.mutate_element(el_wrapper, x=val_get_base(el_wrapper.element).x + 50, y=val_get_base(el_wrapper.element).y + 20)
            
    # Mutate overrides on the instance metadata
    instance_2_meta = next((i for i in parsed_instances if i.id == "title_inst_2"), None)
    assert instance_2_meta is not None
    
    # Create new list for overrides
    new_overrides = []
    found_text_override = False
    
    if instance_2_meta.element_overrides:
        for override in instance_2_meta.element_overrides:
            if override.key == "title_text_content":
                new_overrides.append(duc.create_string_value_entry(key="title_text_content", value="MUTATED CUSTOM TITLE"))
                found_text_override = True
            elif override.key == "title_text_color":
                new_overrides.append(duc.create_string_value_entry(key="title_text_color", value="#0000FF"))
            else:
                new_overrides.append(override)
    
    if not found_text_override:
         new_overrides.append(duc.create_string_value_entry(key="title_text_content", value="MUTATED CUSTOM TITLE"))
         
    instance_2_meta.element_overrides = new_overrides
    print(f"Mutated element_overrides for title_inst_2")

    # === DELETE ===
    print("🗑️ DELETE: Removing some instances...")
    
    # Remove arrow instance 2
    # 1. Remove metadata
    parsed_instances = [i for i in parsed_instances if i.id != "arrow_inst_2"]
    assert len(title_inst_2_elems) == 2
    
    arrow_inst_1_elems = [el for el in parsed_elements if val_get_base(el.element).instance_id == "arrow_inst_1"]
    
    # 2. Remove elements
    elements_to_keep = [el for el in parsed_elements if val_get_base(el.element).instance_id != "arrow_inst_2"]
    
    # === SERIALIZE FINAL ===
    print("💾 SERIALIZE FINAL: Saving the final state...")
    final_output_file = os.path.join(test_output_dir, "test_blocks_instances_final.duc")
    duc.write_duc_file(
        file_path=final_output_file,
        name="BlocksAndInstancesTestFinal",
        elements=elements_to_keep,
        blocks=parsed_blocks,
        block_instances=parsed_instances
    )
    
    assert os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0
    print(f"✅ Final serialized {len(elements_to_keep)} elements and {len(parsed_blocks)} blocks")
    
    # Verify the final state
    final_parsed_data = duc.read_duc_file(final_output_file)
    final_elements = final_parsed_data.elements
    final_blocks = final_parsed_data.blocks if hasattr(final_parsed_data, 'blocks') else []
    final_instances = final_parsed_data.block_instances if hasattr(final_parsed_data, 'block_instances') else []
    
    # Expected: 12 instanced elements - 2 (deleted arrow_inst_2) = 10 elements
    assert len(final_elements) == 10
    assert len(final_blocks) == 2
    assert len(final_instances) == 3
    
    # Verify mutations on title_instance2 element overrides
    final_inst_2_meta = next((i for i in final_instances if i.id == "title_inst_2"), None)
    assert final_inst_2_meta is not None
    
    found_text_content_override = False
    found_text_color_override = False
    for override in final_inst_2_meta.element_overrides:
        if override.key == "title_text_content":
            assert override.value == "MUTATED CUSTOM TITLE"
            found_text_content_override = True
        elif override.key == "title_text_color":
            assert override.value == "#0000FF"
            found_text_color_override = True

    assert found_text_content_override, "title_text_content override not found or not mutated."
    assert found_text_color_override, "title_text_color override not found or not mutated."
    print("✅ Verified element_overrides mutation for title_inst_2")
    
    print("✅ CSPMDS Blocks and Instances test completed successfully!")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])
