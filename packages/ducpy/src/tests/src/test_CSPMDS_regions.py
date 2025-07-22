"""
CSPMDS Test for Regions: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of region management in DUC files.
"""
import io
import os
import random
import pytest

import ducpy as duc
from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION


def test_cspmds_regions(test_output_dir):
    """
    CSPMDS test for regions:
    - Create: Create elements assigned to different regions
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify region assignments
    - Delete: Remove some regions and elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating DucRegion objects and elements...")
    
    # Create actual DucRegion objects using builders
    regions = []
    region_a = duc.create_region(
        id="region_A",
        label="Region A - Primary",
        boolean_operation=BOOLEAN_OPERATION.UNION
    )
    region_b = duc.create_region(
        id="region_B", 
        label="Region B - Secondary",
        boolean_operation=BOOLEAN_OPERATION.SUBTRACT
    )
    region_c = duc.create_region(
        id="region_C",
        label="Region C - Intersection",
        boolean_operation=BOOLEAN_OPERATION.INTERSECT
    )
    region_d = duc.create_region(
        id="region_D",
        label="Region D - Exclude",
        boolean_operation=BOOLEAN_OPERATION.EXCLUDE
    )
    
    regions = [region_a, region_b, region_c, region_d]
    region_ids = [r.id for r in regions]
    
    elements = []
    
    # Create elements and assign them to regions
    for i in range(12):  # Create 12 elements
        region_id = region_ids[i % len(region_ids)]  # Distribute across regions
        
        if i % 4 == 0:
            # Rectangle
            element = duc.create_rectangle(
                x=i*30, y=i*20, width=40, height=30,
                styles=duc.create_simple_styles(),
                label=f"Rect_{i}_in_{region_id}"
            )
        elif i % 4 == 1:
            # Ellipse
            element = duc.create_ellipse(
                x=i*30, y=i*20, width=35, height=25,
                styles=duc.create_simple_styles(),
                label=f"Ellipse_{i}_in_{region_id}"
            )
        elif i % 4 == 2:
            # Polygon
            element = duc.create_polygon(
                x=i*30, y=i*20, sides=5+i%3, width=30, height=30,
                styles=duc.create_simple_styles(),
                label=f"Polygon_{i}_in_{region_id}"
            )
        else:
            # Linear element
            element = duc.create_linear_element(
                points=[(i*30, i*20), (i*30+50, i*20+30)],
                styles=duc.create_simple_styles(),
                label=f"Line_{i}_in_{region_id}"
            )
        
        # Assign to region using mutate_element
        duc.mutate_element(element, region_ids=[region_id])
        elements.append(element)
    
    print(f"Created {len(elements)} elements and {len(regions)} DucRegion objects")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_regions_initial.duc")
    serialized_data = duc.serialize_duc(
        name="RegionsCSPMDS_Initial", 
        elements=elements,
        regions=regions
    )
    
    with open(initial_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    loaded_regions = parsed_data.regions if hasattr(parsed_data, 'regions') else []
    
    assert len(loaded_elements) == len(elements)
    assert len(loaded_regions) == len(regions)
    print(f"Loaded {len(loaded_elements)} elements and {len(loaded_regions)} DucRegion objects")
    
    # Verify region assignments
    region_counts = {}
    for el_wrapper in loaded_elements:
        if hasattr(el_wrapper.element, 'base'):
            region_ids = el_wrapper.element.base.region_ids
        elif hasattr(el_wrapper.element, 'linear_base'):
            region_ids = el_wrapper.element.linear_base.base.region_ids
        else:
            region_ids = []
            
        for region_id in region_ids:
            region_counts[region_id] = region_counts.get(region_id, 0) + 1
    
    print(f"Initial region distribution: {region_counts}")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying region assignments...")
    
    mutations_count = 0
    
    for el_wrapper in loaded_elements:
        # Randomly reassign some elements to different regions
        if random.random() < 0.4:  # 40% chance to reassign
            available_regions = [r for r in region_ids if r in ["region_A", "region_B", "region_D"]]  # Skip region_C for now
            if available_regions:
                new_regions = random.sample(available_regions, k=min(random.randint(1, 2), len(available_regions)))  # 1-2 regions
                duc.mutate_element(el_wrapper, region_ids=new_regions)
                mutations_count += 1
        
        # Also randomly move elements within their regions
        if hasattr(el_wrapper.element, 'base'):
            duc.mutate_element(
                el_wrapper,
                x=el_wrapper.element.base.x + random.uniform(-30, 30),
                y=el_wrapper.element.base.y + random.uniform(-30, 30)
            )
        elif hasattr(el_wrapper.element, 'linear_base'):
            old_points = el_wrapper.element.linear_base.points
            new_points = [
                type(p)(x=p.x + random.uniform(-20, 20), y=p.y + random.uniform(-20, 20)) 
                for p in old_points
            ]
            duc.mutate_element(el_wrapper, points=new_points)
    
    print(f"Mutated {mutations_count} region assignments")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing elements from specific regions...")
    
    # Remove all elements from region_C (simulate deleting the region)
    elements_to_delete = []
    for i, el_wrapper in enumerate(loaded_elements):
        if hasattr(el_wrapper.element, 'base'):
            region_ids = el_wrapper.element.base.region_ids
        elif hasattr(el_wrapper.element, 'linear_base'):
            region_ids = el_wrapper.element.linear_base.base.region_ids
        else:
            region_ids = []
            
        # Delete if element is ONLY in region_C
        if region_ids == ["region_C"]:
            elements_to_delete.append(i)
    
    # Remove elements (in reverse order to maintain indices)
    for i in reversed(elements_to_delete):
        el = loaded_elements[i]
        label = getattr(el.element.base if hasattr(el.element, 'base') else el.element.linear_base.base, 'label', 'unknown')
        print(f"Deleting element exclusively in region_C: {label}")
        del loaded_elements[i]
    
    print(f"Deleted {len(elements_to_delete)} elements exclusively in region_C")
    
    # Remove region_C from the regions list as well
    regions_to_delete = []
    for i, region in enumerate(loaded_regions):
        # Check both id and label since parsing might have issues with id
        if region.id == "region_C" or "Region C" in region.stack_base.label:
            regions_to_delete.append(i)
    
    for i in reversed(regions_to_delete):
        del loaded_regions[i]
    
    print(f"Deleted region_C definition")
    
    # Remove elements that are in multiple regions including region_C by updating their region_ids
    for el_wrapper in loaded_elements:
        if hasattr(el_wrapper.element, 'base'):
            region_ids = el_wrapper.element.base.region_ids
        elif hasattr(el_wrapper.element, 'linear_base'):
            region_ids = el_wrapper.element.linear_base.base.region_ids
        else:
            region_ids = []
            
        if "region_C" in region_ids:
            new_region_ids = [rid for rid in region_ids if rid != "region_C"]
            duc.mutate_element(el_wrapper, region_ids=new_region_ids)
            print(f"Removed region_C from element with multiple regions")
    
    # Also randomly delete some other elements
    additional_deletes = min(2, len(loaded_elements) // 4)  # Delete up to 1/4 but max 2
    for _ in range(additional_deletes):
        if loaded_elements:
            random_index = random.randint(0, len(loaded_elements) - 1)
            del loaded_elements[random_index]
    
    print(f"Deleted {additional_deletes} additional random elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_regions_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="RegionsCSPMDS_Final", 
        elements=loaded_elements,
        regions=loaded_regions
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
    final_regions = final_parsed_data.regions if hasattr(final_parsed_data, 'regions') else []
    
    print(f"Final element count: {len(final_elements)}")
    print(f"Final region count: {len(final_regions)}")
    assert len(final_elements) == len(loaded_elements)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    assert len(final_regions) < len(regions)  # Should have fewer regions too
    
    # Verify region_C is completely removed
    region_c_found = any(r.id == "region_C" or "Region C" in r.stack_base.label for r in final_regions)
    assert not region_c_found, "Region C should be completely removed"
    
    # Verify no elements are exclusively in region_C
    final_region_counts = {}
    elements_with_region_c = 0
    
    for el_wrapper in final_elements:
        if hasattr(el_wrapper.element, 'base'):
            region_ids = el_wrapper.element.base.region_ids
        elif hasattr(el_wrapper.element, 'linear_base'):
            region_ids = el_wrapper.element.linear_base.base.region_ids
        else:
            region_ids = []
            
        # Check if any element is exclusively in region_C
        if region_ids == ["region_C"]:
            elements_with_region_c += 1
            
        for region_id in region_ids:
            final_region_counts[region_id] = final_region_counts.get(region_id, 0) + 1
    
    print(f"Final region distribution: {final_region_counts}")
    assert elements_with_region_c == 0, "No elements should be exclusively in region_C"
    
    print("✅ CSPMDS Regions test completed successfully!")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])
