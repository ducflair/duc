"""
CSPMDS Test for Blocks and Instances: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of DucBlock and DucBlockInstanceElement in DUC files.
"""
import io
import math
import os
import random
import pytest

import ducpy as duc
from ducpy.classes.ElementsClass import DucBlockInstanceElement, StringValueEntry


def test_cspmds_blocks_and_instances(test_output_dir):
    """
    CSPMDS test for blocks and instances (like Figma components):
    - Create: Create DucBlock definitions and DucBlockInstanceElement instances
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify blocks and instances
    - Delete: Remove some instances and blocks
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating DucBlock definitions and instances...")
    
    elements = []
    
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
    
    # === CREATE BLOCK DEFINITIONS ===
    
    # Create a title block definition (like a Figma component)
    title_block = duc.create_block(
        id="title_block_v1",
        label="Title Block Component",
        elements=[
            title_rect,
            title_text
        ],
        description="Reusable title block for drawings"
    )
    
    # Create arrow symbol block definition
    arrow_block = duc.create_block(
        id="arrow_symbol_v1", 
        label="Arrow Symbol Component",
        elements=[
            arrow_line,
            arrow_head
        ],
        description="Reusable arrow symbol"
    )
    
    # === CREATE BLOCK INSTANCES ===
    
    # Create multiple instances of the title block (like Figma component instances)
    title_instance1 = (duc.ElementBuilder()
                       .at_position(100, 100)
                       .with_size(140, 40)
                       .with_id("title_inst_1")
                       .with_label("Main Title Instance")
                       .build_block_instance_element()
                       .with_block_id("title_block_v1")
                       .build())
    
    # Create title instance with element overrides (demonstrating override functionality)
    title_overrides = [
        duc.create_string_value_entry(key="title_text_content", value="CUSTOM TITLE"),
        duc.create_string_value_entry(key="title_text_color", value="#FF0000"),
        duc.create_string_value_entry(key="title_background_color", value="#F0F0F0"),
        duc.create_string_value_entry(key="width", value="120"),
        duc.create_string_value_entry(key="height", value="35"),
        duc.create_string_value_entry(key="opacity", value="0.8")
    ]
    
    title_instance2 = (duc.ElementBuilder()
                       .at_position(300, 100)
                       .with_size(120, 35)
                       .with_id("title_inst_2")
                       .with_label("Custom Title Instance")
                       .build_block_instance_element()
                       .with_block_id("title_block_v1")
                       .with_element_overrides(title_overrides)
                       .build())
    
    # Create arrow instances
    arrow_instance1 = (duc.ElementBuilder()
                       .at_position(100, 200)
                       .with_size(40, 20)
                       .with_id("arrow_inst_1")
                       .with_label("Arrow Instance 1")
                       .build_block_instance_element()
                       .with_block_id("arrow_symbol_v1")
                       .build())
    
    arrow_instance2 = (duc.ElementBuilder()
                       .at_position(200, 200)
                       .with_size(40, 20)
                       .with_id("arrow_inst_2")
                       .with_label("Arrow Instance 2")
                       .build_block_instance_element()
                       .with_block_id("arrow_symbol_v1")
                       .build())
    
    # Add all elements to the list
    elements.extend([
        title_instance1,
        title_instance2,
        arrow_instance1,
        arrow_instance2
    ])
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_blocks_instances.duc")
    duc.write_duc_file(
        file_path=output_file,
        name="BlocksAndInstancesTest",
        elements=elements,
        blocks=[title_block, arrow_block]
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(elements)} elements and {len([title_block, arrow_block])} blocks")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    parsed_blocks = parsed_data.blocks if hasattr(parsed_data, 'blocks') else []
    
    assert len(parsed_elements) == len(elements)
    assert len(parsed_blocks) == 2
    print(f"✅ Parsed {len(parsed_elements)} elements and {len(parsed_blocks)} blocks")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying blocks and instances...")
    
    # Mutate some instances
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'block_id') and el_wrapper.element.block_id == "title_block_v1":
            # Move title instances
            duc.mutate_element(el_wrapper, x=el_wrapper.element.base.x + 50, y=el_wrapper.element.base.y + 20)

            # Additionally, mutate element overrides for title_instance2
            if el_wrapper.element.base.id == "title_inst_2":
                current_overrides = el_wrapper.element.element_overrides or []
                # Find and update existing override for 'title_text_content'
                updated_overrides = []
                found_text_override = False
                for override in current_overrides:
                    if override.key == "title_text_content":
                        updated_overrides.append(duc.create_string_value_entry(key="title_text_content", value="MUTATED CUSTOM TITLE"))
                        found_text_override = True
                    elif override.key == "title_text_color":
                        updated_overrides.append(duc.create_string_value_entry(key="title_text_color", value="#0000FF")) # Change to blue
                    else:
                        updated_overrides.append(override)
                
                # If not found, add it (though it should be there from creation)
                if not found_text_override:
                    updated_overrides.append(duc.create_string_value_entry(key="title_text_content", value="MUTATED CUSTOM TITLE"))

                # Mutate the element_overrides list
                duc.mutate_element(el_wrapper, element_overrides=updated_overrides)
                print(f"Mutated element_overrides for {el_wrapper.element.base.label}")

        elif hasattr(el_wrapper.element, 'block_id') and el_wrapper.element.block_id == "arrow_symbol_v1":
            # Scale arrow instances
            duc.mutate_element(el_wrapper, width=el_wrapper.element.base.width * 1.5, height=el_wrapper.element.base.height * 1.5)
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some instances...")
    
    # Remove one arrow instance
    elements_to_keep = [el for el in parsed_elements if not (hasattr(el.element, 'block_id') and el.element.block_id == "arrow_symbol_v1" and el.element.base.id == "arrow_inst_2")]
    
    # === SERIALIZE FINAL ===
    print("💾 SERIALIZE FINAL: Saving the final state...")
    final_output_file = os.path.join(test_output_dir, "test_blocks_instances_final.duc")
    duc.write_duc_file(
        file_path=final_output_file,
        name="BlocksAndInstancesTestFinal",
        elements=elements_to_keep,
        blocks=parsed_blocks
    )
    
    assert os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0
    print(f"✅ Final serialized {len(elements_to_keep)} elements and {len(parsed_blocks)} blocks")
    
    # Verify the final state
    final_parsed_data = duc.read_duc_file(final_output_file)
    final_elements = final_parsed_data.elements
    final_blocks = final_parsed_data.blocks if hasattr(final_parsed_data, 'blocks') else []
    
    assert len(final_elements) == len(elements_to_keep)
    assert len(final_blocks) == 2
    
    # Count block instances by type
    title_instances = [el for el in final_elements if hasattr(el.element, 'block_id') and el.element.block_id == "title_block_v1"]
    arrow_instances = [el for el in final_elements if hasattr(el.element, 'block_id') and el.element.block_id == "arrow_symbol_v1"]
    
    assert len(title_instances) == 2  # Both title instances should remain
    assert len(arrow_instances) == 1  # Only one arrow instance should remain

    # Verify mutations on title_instance2 element overrides
    parsed_title_instance2 = next( (el for el in final_elements if hasattr(el.element, 'block_id') and el.element.block_id == "title_block_v1" and el.element.base.id == "title_inst_2"), None)
    assert parsed_title_instance2 is not None, "title_inst_2 not found in final parsed elements."

    found_text_content_override = False
    found_text_color_override = False
    for override in parsed_title_instance2.element.element_overrides:
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
    print(f"   - Created {len(elements)} initial elements")
    print(f"   - Created {len([title_block, arrow_block])} block definitions")
    print(f"   - Mutated instances (position and scale)")
    print(f"   - Deleted 1 arrow instance")
    print(f"   - Final state: {len(final_elements)} elements, {len(final_blocks)} blocks")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])
