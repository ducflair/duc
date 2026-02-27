"""
CSPMDS Test for Local and Global States: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of state management elements in DUC files.
"""
import os

import ducpy as duc
import pytest
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


def test_local_and_global_states_via_sql():
    """Create and mutate global/local state using raw SQL."""
    from ducpy.builders.sql_builder import DucSQL

    with DucSQL.new() as db:
        # Insert global state
        db.sql(
            "INSERT INTO duc_global_state "
            "(id, name, view_background_color, main_scope, scope_exponent_threshold, pruning_level) "
            "VALUES (?,?,?,?,?,?)",
            1, "Test Drawing", "#FFFFFF", "mm", 6, 20,
        )

        # Insert local state
        db.sql(
            "INSERT INTO duc_local_state "
            "(id, scope, scroll_x, scroll_y, zoom, is_binding_enabled, "
            "pen_mode, view_mode_enabled, objects_snap_mode_enabled, grid_mode_enabled, "
            "outline_mode_enabled, decimal_places) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            1, "mm", 0.0, 0.0, 1.0, 1, 0, 0, 1, 1, 0, 2,
        )

        # Add default current-item stroke/background via local_state owner
        db.sql(
            "INSERT INTO backgrounds (owner_type, owner_id, src, opacity) VALUES (?,?,?,?)",
            "local_state", "1", "#3498db", 1.0,
        )
        db.sql(
            "INSERT INTO strokes (owner_type, owner_id, src, width) VALUES (?,?,?,?)",
            "local_state", "1", "#000000", 1.0,
        )

        # Verify
        gs = db.sql("SELECT * FROM duc_global_state")[0]
        assert gs["name"] == "Test Drawing"
        assert gs["main_scope"] == "mm"

        ls = db.sql("SELECT * FROM duc_local_state")[0]
        assert ls["zoom"] == 1.0
        assert ls["is_binding_enabled"] == 1

        # Mutate global state
        db.sql("UPDATE duc_global_state SET main_scope = ?, view_background_color = ? WHERE id = 1", "cm", "#F0F0F0")
        gs2 = db.sql("SELECT * FROM duc_global_state")[0]
        assert gs2["main_scope"] == "cm" and gs2["view_background_color"] == "#F0F0F0"

        # Mutate local state
        db.sql("UPDATE duc_local_state SET zoom = ?, scroll_x = ?, scroll_y = ? WHERE id = 1", 2.5, 100.0, -50.0)
        ls2 = db.sql("SELECT * FROM duc_local_state")[0]
        assert ls2["zoom"] == 2.5 and ls2["scroll_x"] == 100.0

        raw = db.to_bytes()

    # Roundtrip
    with DucSQL.from_bytes(raw) as db2:
        assert db2.sql("SELECT main_scope FROM duc_global_state")[0][0] == "cm"
        assert db2.sql("SELECT zoom FROM duc_local_state")[0][0] == 2.5


# Legacy CSPMDS test now covered by SQL-first test for the new schema.
test_cspmds_local_and_global_states = test_local_and_global_states_via_sql


if __name__ == "__main__":
    pytest.main([__file__])