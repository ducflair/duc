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
    
    # First create some basic elements to use in block definitions
    title_rect = duc.create_rectangle(
        x=0, y=0, width=140, height=40,
        styles=duc.create_simple_styles(),
        label="Title Rectangle"
    )
    
    title_text = duc.create_text_element(
        x=70, y=20, text="TITLE",
        styles=duc.create_simple_styles(),
        label="Title Text"
    )
    
    # Create arrow elements for symbol block
    arrow_line = duc.create_linear_element(
        points=[(0, 10), (30, 10)],
        styles=duc.create_simple_styles(),
        label="Arrow Line"
    )
    
    arrow_head = duc.create_polygon(
        x=30, y=10, sides=3, width=10, height=10,
        styles=duc.create_simple_styles(),
        label="Arrow Head"
    )
    
    # === CREATE BLOCK DEFINITIONS ===
    
    # Create a title block definition (like a Figma component)
    title_block = duc.create_block(
        id="title_block_v1",
        label="Title Block Component",
        elements=[
            title_rect,
            title_text
        ],
        description="Reusable title block for drawings",
        version=1
    )
    
    # Create arrow symbol block definition
    arrow_block = duc.create_block(
        id="arrow_symbol_v1", 
        label="Arrow Symbol Component",
        elements=[
            arrow_line,
            arrow_head
        ],
        description="Reusable arrow symbol",
        version=1
    )
    
    # === CREATE BLOCK INSTANCES ===
    
    # Create multiple instances of the title block (like Figma component instances)
    title_instance1 = duc.create_block_instance_element(
        x=100, y=100, width=140, height=40,
        block_id="title_block_v1",
        id="title_inst_1",
        label="Main Title Instance"
    )
    
    # Create title instance with element overrides (demonstrating override functionality)
    title_overrides = [
        StringValueEntry(key="title_text_content", value="CUSTOM TITLE"),
        StringValueEntry(key="title_text_color", value="#FF0000"),
        StringValueEntry(key="title_background_color", value="#F0F0F0"),
        StringValueEntry(key="width", value="120"),
        StringValueEntry(key="height", value="35"),
        StringValueEntry(key="opacity", value="0.8")
    ]
    
    title_instance2 = duc.create_block_instance_element(
        x=300, y=100, width=112, height=32,  # Smaller size (scaled down)
        block_id="title_block_v1",
        id="title_inst_2", 
        label="Secondary Title Instance",
        element_overrides=title_overrides  # Override some properties
    )
    
    # Create arrow instances pointing in different directions
    arrow_instance1 = duc.create_block_instance_element(
        x=50, y=200, width=40, height=20,
        block_id="arrow_symbol_v1",
        id="arrow_inst_1",
        label="Right Arrow Instance",
        angle=0.0
    )
    
    # Arrow instance with element overrides for custom styling and dimensions
    arrow_overrides = [
        StringValueEntry(key="arrow_color", value="#00AA00"),
        StringValueEntry(key="arrow_thickness", value="3.0"),
        StringValueEntry(key="width", value="25"),
        StringValueEntry(key="height", value="45"),
        StringValueEntry(key="angle", value=str(math.radians(45))),
        StringValueEntry(key="opacity", value="0.9")
    ]
    
    arrow_instance2 = duc.create_block_instance_element(
        x=150, y=200, width=20, height=40,  # Rotated dimensions
        block_id="arrow_symbol_v1",
        id="arrow_inst_2",
        label="Down Arrow Instance",
        angle=math.radians(90),  # Rotated 90 degrees (π/2 radians)
        element_overrides=arrow_overrides
    )
    
    arrow_instance3 = duc.create_block_instance_element(
        x=250, y=200, width=20, height=40,  # Rotated dimensions
        block_id="arrow_symbol_v1",
        id="arrow_inst_3",
        label="Up Arrow Instance",
        angle=math.radians(270),  # Rotated 270 degrees (3π/2 radians)
        element_overrides=[
            StringValueEntry(key="stroke_width", value="2.5"),
            StringValueEntry(key="stroke_color", value="#0000FF"),
            StringValueEntry(key="angle", value=str(math.radians(315))),  # Rotate to 315 degrees
        ]
    )
    
    # Add all block instances to elements list
    elements.extend([
        title_instance1,
        title_instance2, 
        arrow_instance1,
        arrow_instance2,
        arrow_instance3
    ])
    
    # Create global state with blocks
    global_state = duc.create_global_state(name="BlocksCSPMDS_Initial")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_blocks_initial.duc")
    serialized_data = duc.serialize_duc(
        name="BlocksCSPMDS_Initial", 
        elements=elements,
        blocks=[title_block, arrow_block],
        duc_global_state=global_state
    )
    
    with open(initial_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    loaded_blocks = parsed_data.blocks if hasattr(parsed_data, 'blocks') else []
    
    assert len(loaded_elements) == len(elements)
    assert len(loaded_blocks) == 2  # title_block and arrow_block
    print(f"Loaded {len(loaded_elements)} elements and {len(loaded_blocks)} block definitions")
    
    # Verify block definitions are preserved
    block_ids = [block.id for block in loaded_blocks]
    assert "title_block_v1" in block_ids
    assert "arrow_symbol_v1" in block_ids
    
    # Verify block instances reference correct blocks
    block_instances = []
    for el in loaded_elements:
        if isinstance(el.element, duc.DucBlockInstanceElement):
            block_instances.append(el)
    
    print(f"Found block instances: {len(block_instances)}")
    assert len(block_instances) == 5  # 2 title + 3 arrow instances
    
    print(f"Found {len(block_instances)} block instances")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying blocks and instances...")
    
    mutations_count = 0
    
    # Mutate block instances - move and scale them
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, DucBlockInstanceElement):
            instance = el_wrapper.element
            
            # Move title instances
            if instance.block_id == "title_block_v1":
                duc.mutate_element(
                    el_wrapper,
                    x=instance.base.x + 50,  # Move right
                    y=instance.base.y + 25   # Move down
                )
                mutations_count += 1
            
            # Rotate and resize arrow instances
            elif instance.block_id == "arrow_symbol_v1":
                # Add 45 degrees rotation and resize
                new_angle = instance.base.angle + math.radians(45)  # Add π/4 radians
                new_width = instance.base.width * 1.2
                new_height = instance.base.height * 1.2
                
                duc.mutate_element(
                    el_wrapper,
                    angle=new_angle,
                    width=new_width,
                    height=new_height
                )
                mutations_count += 1
    
    # Demonstrate element_overrides mutations
    print("🎨 MUTATE: Modifying element overrides...")
    
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, DucBlockInstanceElement):
            instance = el_wrapper.element
            
            # Add/modify overrides for title_inst_2
            if instance.base.id == "title_inst_2":
                # Add new overrides or modify existing ones
                new_overrides = [
                    StringValueEntry(key="title_text_content", value="MUTATED TITLE"),
                    StringValueEntry(key="title_border_style", value="dashed"),
                    StringValueEntry(key="title_opacity", value="0.8"),
                    StringValueEntry(key="styles", value="custom_styling"),
                    StringValueEntry(key="width", value="150"),
                    StringValueEntry(key="angle", value="15.0")
                ]
                instance.element_overrides.extend(new_overrides)
                print(f"Added element overrides to {instance.base.id}")
                mutations_count += 1
                
            # Modify existing overrides for arrow_inst_2
            elif instance.base.id == "arrow_inst_2":
                for override in instance.element_overrides:
                    if override.key == "arrow_color":
                        override.value = "#FF5500"  # Change to orange
                    elif override.key == "arrow_thickness":
                        override.value = "5.0"  # Make thicker
                    elif override.key == "width":
                        override.value = "30"  # Resize
                    elif override.key == "angle":
                        override.value = "120.0"  # Change rotation
                print(f"Modified element overrides for {instance.base.id}")
                mutations_count += 1
                
            # Test additional override types for arrow_inst_3
            elif instance.base.id == "arrow_inst_3":
                # Add style-based overrides
                style_overrides = [
                    StringValueEntry(key="styles", value="enhanced_arrow_style"),
                    StringValueEntry(key="width", value="35"),
                    StringValueEntry(key="height", value="50"),
                    StringValueEntry(key="angle", value=str(math.radians(315)))  # 315 degrees in radians
                ]
                instance.element_overrides.extend(style_overrides)
                print(f"Added style overrides to {instance.base.id}")
                mutations_count += 1
    
    print(f"Applied transformations to {mutations_count} block instances")
    
    # Mutate block definitions (would affect all instances)
    for block in loaded_blocks:
        if block.id == "title_block_v1":
            # Update version and description directly (blocks aren't ElementWrappers)
            block.version = block.version + 1
            block.description = "Updated title block with modifications"
            print(f"Updated block definition: {block.id}")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some instances and blocks...")
    
    # Remove some block instances
    instances_to_delete = []
    for i, el_wrapper in enumerate(loaded_elements):
        if isinstance(el_wrapper.element, DucBlockInstanceElement):
            instance = el_wrapper.element
            
            # Delete one title instance and one arrow instance
            if (instance.base.id == "title_inst_2" or 
                instance.base.id == "arrow_inst_3"):
                instances_to_delete.append(i)
    
    # Remove instances (in reverse order to maintain indices)
    for i in reversed(instances_to_delete):
        el = loaded_elements[i]
        instance_id = el.element.base.id
        print(f"Deleting block instance: {instance_id}")
        del loaded_elements[i]
    
    print(f"Deleted {len(instances_to_delete)} block instances")
    
    # Remove one block definition (and verify instances are affected)
    blocks_to_delete = []
    for i, block in enumerate(loaded_blocks):
        if block.id == "arrow_symbol_v1":
            blocks_to_delete.append(i)
            break
    
    for i in reversed(blocks_to_delete):
        block_id = loaded_blocks[i].id
        print(f"Deleting block definition: {block_id}")
        del loaded_blocks[i]
    
    # Also remove all instances of the deleted block
    orphaned_instances = []
    for i, el_wrapper in enumerate(loaded_elements):
        if (isinstance(el_wrapper.element, DucBlockInstanceElement) and
            el_wrapper.element.block_id == "arrow_symbol_v1"):
            orphaned_instances.append(i)
    
    for i in reversed(orphaned_instances):
        instance_id = loaded_elements[i].element.base.id
        print(f"Deleting orphaned instance: {instance_id}")
        del loaded_elements[i]
    
    print(f"Deleted {len(orphaned_instances)} orphaned instances")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_blocks_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="BlocksCSPMDS_Final", 
        elements=loaded_elements,
        blocks=loaded_blocks,
        duc_global_state=global_state
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
    final_blocks = final_parsed_data.blocks if hasattr(final_parsed_data, 'blocks') else []
    
    print(f"Final element count: {len(final_elements)}")
    print(f"Final block count: {len(final_blocks)}")
    
    # Should have fewer elements and blocks than original
    assert len(final_elements) < len(elements)
    assert len(final_blocks) < 2  # Should only have title_block left
    
    # Verify only title_block remains
    remaining_block_ids = [block.id for block in final_blocks]
    assert "title_block_v1" in remaining_block_ids
    assert "arrow_symbol_v1" not in remaining_block_ids
    
    # Verify no arrow instances remain
    remaining_instances = []
    for el in final_elements:
        if isinstance(el.element, DucBlockInstanceElement):
            remaining_instances.append(el)
    
    for el_wrapper in remaining_instances:
        assert el_wrapper.element.block_id != "arrow_symbol_v1"
    
    # Verify title instances were properly mutated
    title_instances = []
    for el in final_elements:
        if (isinstance(el.element, DucBlockInstanceElement) and
            el.element.block_id == "title_block_v1"):
            title_instances.append(el)
    
    # Should only have 1 title instance left (deleted title_inst_2)
    assert len(title_instances) == 1
    title_instance = title_instances[0].element
    assert title_instance.base.id == "title_inst_1"  # Only first instance should remain
    
    # Verify the mutations were applied (position should be moved)
    assert title_instance.base.x == 150  # 100 + 50
    assert title_instance.base.y == 125  # 100 + 25
    
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
