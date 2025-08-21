"""
CSPMDS Test for Local and Global States: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of state management elements in DUC files.
"""
import os
import pytest

import ducpy as duc
from ducpy.builders import mutate_builder


def test_cspmds_local_and_global_states(test_output_dir):
    """
    CSPMDS test for local and global states:
    - Create: Create state management elements
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify state properties
    - Delete: Remove some state elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating state management elements...")
    
    elements = []
    
    # Create base elements for state management using builders API
    rect1 = (duc.ElementBuilder()
              .at_position(100, 100)
              .with_size(80, 60)
              .with_styles(duc.create_simple_styles())
              .with_label("Base Rectangle 1")
              .build_rectangle()
              .build())
    
    rect2 = (duc.ElementBuilder()
              .at_position(300, 100)
              .with_size(80, 60)
              .with_styles(duc.create_simple_styles())
              .with_label("Base Rectangle 2")
              .build_rectangle()
              .build())
    
    # Create global state using the builder API
    global_state = (duc.StateBuilder()
        .with_id("global_state_1")
        .with_name("Test Global State")
        .with_description("Test global state for CSPMDS")
        .with_version("1.0")
        .with_readonly(False)
        .with_extra(
            view_background_color="#FFFFFF",
            main_scope="mm",
            dash_spacing_scale=1.0,
            is_dash_spacing_affected_by_viewport_scale=False,
            scope_exponent_threshold=6,
            dimensions_associative_by_default=True,
            use_annotative_scaling=False,
            linear_precision=2,
            angular_precision=2
        )
        .build_global_state()
        .build())
    
    # Create local state using the builder API
    local_state = (duc.StateBuilder()
        .with_id("local_state_1")
        .with_name("Test Local State")
        .with_description("Test local state for CSPMDS")
        .with_version("1.0")
        .with_readonly(False)
        .with_extra(
            scope="mm",
            active_standard_id="default",
            scroll_x=0.0,
            scroll_y=0.0,
            zoom=1.0,
            is_binding_enabled=True,
            pen_mode=False,
            view_mode_enabled=False,
            objects_snap_mode_enabled=True,
            grid_mode_enabled=True,
            outline_mode_enabled=False
        )
        .build_local_state()
        .build())
    
    # Add all elements to the list
    elements.extend([rect1, rect2])
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_local_and_global_states.duc")
    duc.write_duc_file(
        file_path=output_file,
        name="LocalAndGlobalStatesTest",
        elements=elements,
        duc_global_state=global_state,
        duc_local_state=local_state
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(elements)} elements and states")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    parsed_global_state = parsed_data.duc_global_state if hasattr(parsed_data, 'duc_global_state') else None
    parsed_local_state = parsed_data.duc_local_state if hasattr(parsed_data, 'duc_local_state') else None
    
    assert parsed_elements is not None
    assert parsed_global_state is not None
    assert parsed_local_state is not None
    print(f"✅ Parsed {len(parsed_elements)} elements and states")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying state properties...")
    # Access the main_scope through the extra attributes
    if hasattr(parsed_global_state, 'main_scope'):
        mutate_builder.mutate_global_state(parsed_global_state, main_scope="cm")
    if hasattr(parsed_local_state, 'scope'):
        mutate_builder.mutate_local_state(parsed_local_state, scope="cm")
    print("✅ Mutated state properties")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing one element...")
    elements_to_keep = parsed_elements[:-1]
    print(f"✅ Kept {len(elements_to_keep)} elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    final_file = os.path.join(test_output_dir, "test_local_and_global_states_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="LocalAndGlobalStatesTestFinal",
        elements=elements_to_keep,
        duc_global_state=parsed_global_state,
        duc_local_state=parsed_local_state
    )
    assert os.path.exists(final_file) and os.path.getsize(final_file) > 0
    print(f"✅ Final state saved with {len(elements_to_keep)} elements")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    final_parsed = duc.read_duc_file(final_file)
    
    # Check that the states exist and have the expected number of elements
    assert final_parsed.duc_global_state is not None
    assert final_parsed.duc_local_state is not None
    assert len(final_parsed.elements) == len(elements_to_keep)
    print("✅ CSPMDS Local and Global States test completed successfully!")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])