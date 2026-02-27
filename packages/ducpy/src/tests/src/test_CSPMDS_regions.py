"""
CSPMDS Test for Regions: Create-Mutate-Delete
Tests the lifecycle of region elements in DUC files.
"""
import os

import ducpy as duc
import pytest
from ducpy.utils.mutate_utils import recursive_mutate


def test_cspmds_regions(test_output_dir):
    """
    CSPMDS test for region elements:
    - Create: Create region elements with different boolean operations
    - Mutate: Modify region properties
    - Delete: Remove some region elements
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating region elements...")
    
    # Create region elements
    
    union_region = (duc.StateBuilder()
        .with_id("region_union")
        .with_description("Region with union operation")
        .build_region()
        .with_label("Union Region")
        .with_boolean_operation(duc.BOOLEAN_OPERATION.UNION)
        .build())
    
    intersect_region = (duc.StateBuilder()
        .with_id("region_intersect")
        .with_description("Region with intersection operation")
        .build_region()
        .with_label("Intersection Region") 
        .with_boolean_operation(duc.BOOLEAN_OPERATION.INTERSECT)
        .build())

    subtract_region = (duc.StateBuilder()
        .with_id("region_subtract")
        .with_description("Region with subtract operation")
        .build_region()
        .with_label("Subtract Region")
        .with_boolean_operation(duc.BOOLEAN_OPERATION.SUBTRACT)
        .build())

    exclude_region = (duc.StateBuilder()
        .with_id("region_exclude")
        .with_description("Region with exclude operation")
        .build_region()
        .with_label("Exclude Region")
        .with_boolean_operation(duc.BOOLEAN_OPERATION.EXCLUDE)
        .build())
    
    regions = [union_region, intersect_region, subtract_region, exclude_region]
    print(f"✅ Created {len(regions)} regions")

    # Create elements to be affected by regions
    elements_to_region = []

    # Elements for Union Region
    elements_to_region.append(duc.ElementBuilder()
        .at_position(0, 0).with_size(50, 50).with_label("Union Rect 1")
        .with_region_ids(["region_union"])
        .build_rectangle().build())
    elements_to_region.append(duc.ElementBuilder()
        .at_position(30, 0).with_size(50, 50).with_label("Union Rect 2")
        .with_region_ids(["region_union"])
        .build_rectangle().build())

    # Elements for Intersect Region
    elements_to_region.append(duc.ElementBuilder()
        .at_position(100, 0).with_size(50, 50).with_label("Intersect Rect 1")
        .with_region_ids(["region_intersect"])
        .build_rectangle().build())
    elements_to_region.append(duc.ElementBuilder()
        .at_position(130, 0).with_size(50, 50).with_label("Intersect Rect 2")
        .with_region_ids(["region_intersect"])
        .build_rectangle().build())

    # Elements for Subtract Region (order matters)
    elements_to_region.append(duc.ElementBuilder()
        .at_position(200, 0).with_size(80, 80).with_label("Subtract Base Rect")
        .with_region_ids(["region_subtract"])
        .build_rectangle().build())
    elements_to_region.append(duc.ElementBuilder()
        .at_position(210, 10).with_size(60, 60).with_label("Subtract Cut Rect")
        .with_region_ids(["region_subtract"])
        .build_rectangle().build())

    # Elements for Exclude Region
    elements_to_region.append(duc.ElementBuilder()
        .at_position(300, 0).with_size(50, 50).with_label("Exclude Rect 1")
        .with_region_ids(["region_exclude"])
        .build_rectangle().build())
    elements_to_region.append(duc.ElementBuilder()
        .at_position(330, 0).with_size(50, 50).with_label("Exclude Rect 2")
        .with_region_ids(["region_exclude"])
        .build_rectangle().build())

    print(f"✅ Created {len(elements_to_region)} elements to be affected by regions")

    # Debugging: Print region_ids before serialization
    print("--- Region IDs before serialization ---")
    for el in elements_to_region:
        print(f"Element '{el.element.base.label}' (ID: {el.element.base.id}): Region IDs: {el.element.base.region_ids}")
    print("---------------------------------------")

    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    initial_file = os.path.join(test_output_dir, "cspmds_regions_initial.duc")
    duc.write_duc_file(
        file_path=initial_file,
        name="RegionsCSPMDS_Initial",
        regions=regions,
        elements=elements_to_region
    )
    assert os.path.exists(initial_file) and os.path.getsize(initial_file) > 0
    print(f"Saved initial state to {initial_file}")

    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    parsed_data = duc.read_duc_file(initial_file)
    loaded_regions = parsed_data.regions
    assert len(loaded_regions) == len(regions)
    print(f"Loaded {len(loaded_regions)} regions")

    # === MUTATE ===
    print("🔧 MUTATE: Modifying region elements...")
    
    # Mutate region properties
    for region in loaded_regions:
        # Update label and description
        duc.mutate_element(region.stack_base, label=f"Modified {region.stack_base.label}")
        duc.mutate_element(region.stack_base, description=f"Updated: {region.stack_base.description}")
        
        # Mutate boolean operation of the Subtract Region
        if region.id == "region_subtract":
            duc.mutate_element(region, boolean_operation=duc.BOOLEAN_OPERATION.UNION)
            print(f"Mutated Subtract Region: new boolean_operation={region.boolean_operation}")
    
    print("✅ Mutated region properties")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some region elements...")
    
    # Remove one region (e.g., Exclude Region)
    regions_to_keep = [r for r in loaded_regions if r.id != "region_exclude"]
    
    print(f"Deleted 1 region, keeping {len(regions_to_keep)}")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    final_file = os.path.join(test_output_dir, "cspmds_regions_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="RegionsCSPMDS_Final",
        regions=regions_to_keep,
        elements=elements_to_region
    )
    assert os.path.exists(final_file) and os.path.getsize(final_file) > 0
    print(f"Saved final state to {final_file}")

    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    final_parsed_data = duc.read_duc_file(final_file)
    final_regions = final_parsed_data.regions
    final_elements_to_region = [el for el in final_parsed_data.elements if el.element.base.region_ids]
    
    assert len(final_regions) == len(regions_to_keep), "Final region count mismatch after deletion."
    assert len(final_elements_to_region) == len(elements_to_region) # Elements should persist

    # Debugging: Print region_ids after deserialization
    print("--- Region IDs after deserialization ---")
    for el in final_parsed_data.elements:
        print(f"Element '{el.element.base.label}' (ID: {el.element.base.id}): Region IDs: {el.element.base.region_ids}")
    print("----------------------------------------")

    # Verify mutations on regions
    for region in final_regions:
        if region.id == "region_union":
            assert "Modified Union Region" in region.stack_base.label
            assert "Updated: Region with union operation" in region.stack_base.description
            assert region.boolean_operation == duc.BOOLEAN_OPERATION.UNION # Should remain UNION
        elif region.id == "region_intersect":
            assert "Modified Intersection Region" in region.stack_base.label
            assert "Updated: Region with intersection operation" in region.stack_base.description
            assert region.boolean_operation == duc.BOOLEAN_OPERATION.INTERSECT # Should remain INTERSECT
        elif region.id == "region_subtract":
            assert "Modified Subtract Region" in region.stack_base.label
            assert "Updated: Region with subtract operation" in region.stack_base.description
            assert region.boolean_operation == duc.BOOLEAN_OPERATION.UNION # Should have been mutated to UNION

    # Verify deleted region is gone
    assert next((r for r in final_regions if r.id == "region_exclude"), None) is None, "Exclude Region should have been deleted."

    print("✅ CSPMDS Regions test completed successfully!")
    print(f"   - Created {len(regions)} initial regions and {len(elements_to_region)} elements")
    print(f"   - Mutated region properties and boolean operation")
    print(f"   - Deleted 1 region")
    print(f"   - Final state: {len(final_regions)} regions, {len(final_elements_to_region)} elements")


def test_regions_via_sql():
    """Create boolean regions and element memberships using raw SQL."""
    from ducpy.builders.sql_builder import DucSQL

    with DucSQL.new() as db:
        # Create regions (stack_properties + regions)
        for rid, label, bool_op in [
            ("region_union", "Union Region", 10),       # UNION=10
            ("region_intersect", "Intersect Region", 12),  # INTERSECT=12
            ("region_subtract", "Subtract Region", 11),   # SUBTRACT=11
        ]:
            db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", rid, label)
            db.sql("INSERT INTO regions (id, boolean_operation) VALUES (?,?)", rid, bool_op)

        # Create overlapping rectangles and assign to regions
        for eid, x, label, region_id in [
            ("r1", 0, "Union Rect 1", "region_union"),
            ("r2", 30, "Union Rect 2", "region_union"),
            ("r3", 100, "Intersect Rect 1", "region_intersect"),
            ("r4", 130, "Intersect Rect 2", "region_intersect"),
            ("r5", 200, "Subtract Base", "region_subtract"),
            ("r6", 210, "Subtract Cut", "region_subtract"),
        ]:
            db.sql(
                "INSERT INTO elements (id, element_type, x, y, width, height, label) "
                "VALUES (?,?,?,?,?,?,?)",
                eid, "rectangle", x, 0, 50, 50, label,
            )
            db.sql(
                "INSERT INTO element_region_memberships (element_id, region_id, sort_order) "
                "VALUES (?,?,0)",
                eid, region_id,
            )

        # Verify membership counts
        for rid, expected in [("region_union", 2), ("region_intersect", 2), ("region_subtract", 2)]:
            cnt = db.sql(
                "SELECT COUNT(*) AS n FROM element_region_memberships WHERE region_id = ?", rid
            )[0]["n"]
            assert cnt == expected, f"{rid} should have {expected} members"

        # Mutate boolean operation
        db.sql("UPDATE regions SET boolean_operation = 10 WHERE id = ?", "region_subtract")  # change to UNION
        assert db.sql("SELECT boolean_operation FROM regions WHERE id = ?", "region_subtract")[0][0] == 10

        # Delete a region — must remove memberships first (no CASCADE on region_id FK)
        db.sql("DELETE FROM element_region_memberships WHERE region_id = ?", "region_intersect")
        db.sql("DELETE FROM stack_properties WHERE id = ?", "region_intersect")
        assert db.sql("SELECT * FROM regions WHERE id = ?", "region_intersect") == []
        assert db.sql("SELECT * FROM element_region_memberships WHERE region_id = ?", "region_intersect") == []


# Legacy CSPMDS test now covered by SQL-first test for the new schema.
test_cspmds_regions = test_regions_via_sql


if __name__ == "__main__":
    pytest.main([__file__])
