"""
CSPMDS Test for Grids and Snapping: Create-Serialize-Parse-Mutate-Delete-Serialize
Validates the full lifecycle of grid and snap settings in DUC files.
"""
import os
import pytest

import ducpy as duc
from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
import math
from typing import Optional

def test_cspmds_grids_and_snapping(test_output_dir):
    """
    CSPMDS test for grids and snapping:
    - Create: Create multiple grid and snap settings
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify grid and snap settings
    - Delete: Remove some settings
    - Serialize: Save the final state
    """

    # === CREATE ===
    print("🔨 CREATE: Creating grid and snap settings...")

    # 1. Create various GridSettings using GridSettingsBuilder
    rectangular_grid = (duc.StateBuilder()
                        .with_id("grid_rect")
                        .with_name("Rectangular Grid")
                        .build_grid_settings()
                        .with_grid_type(GRID_TYPE.RECTANGULAR)
                        .with_x_spacing(10.0)
                        .with_y_spacing(10.0)
                        .with_subdivisions(5)
                        .with_display_type(GRID_DISPLAY_TYPE.LINES)
                        .with_major_color("#888888")
                        .with_minor_color("#EEEEEE")
                        .with_enable_snapping(True)
                        .build())

    isometric_grid = (duc.StateBuilder()
                      .with_id("grid_iso")
                      .with_name("Isometric Grid")
                      .build_grid_settings()
                      .with_grid_type(GRID_TYPE.ISOMETRIC)
                      .with_x_spacing(20.0)
                      .with_y_spacing(20.0)
                      .with_subdivisions(2)
                      .with_isometric_settings(duc.create_isometric_grid_settings(left_angle=math.radians(30), right_angle=math.radians(30)))
                      .build())

    polar_grid = (duc.StateBuilder()
                  .with_id("grid_polar")
                  .with_name("Polar Grid")
                  .build_grid_settings()
                  .with_grid_type(GRID_TYPE.POLAR)
                  .with_polar_settings(duc.create_polar_grid_settings(radial_divisions=8, radial_spacing=15.0, show_labels=True))
                  .build())

    # 2. Create various SnapSettings using SnapSettingsBuilder
    basic_snap = (duc.StateBuilder()
                  .with_id("snap_basic")
                  .with_name("Basic Snap Settings")
                  .build_snap_settings()
                  .with_snap_tolerance(15)
                  .with_is_object_snap_on(True)
                  .with_active_object_snap_modes([OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT])
                  .with_snap_mode(SNAP_MODE.RUNNING)
                  .build())

    advanced_snap = (duc.StateBuilder()
                     .with_id("snap_advanced")
                     .with_name("Advanced Snap Settings")
                     .build_snap_settings()
                     .with_snap_tolerance(25)
                     .with_is_object_snap_on(True)
                     .with_object_snap_aperture(10)
                     .with_polar_tracking(duc.create_polar_tracking_settings(enabled=True, angles=[0, math.pi/4, math.pi/2]))
                     .with_snap_markers(duc.create_snap_marker_settings(enabled=True, size=5, styles=[duc.create_snap_marker_style_entry(key=OBJECT_SNAP_MODE.ENDPOINT, value=duc.create_snap_marker_style(color="#FF0000", shape=SNAP_MARKER_SHAPE.SQUARE))]))
                     .build())

    # 3. Combine into Standards using StandardBuilder
    standard1 = (duc.StateBuilder()
                 .with_id("standard_rect_basic")
                 .with_name("Rectangular Grid & Basic Snap")
                 .build_standard()
                 .with_view_settings(duc.create_standard_view_settings(
                     grid_settings=[duc.create_identified_grid_settings(id="grid_rect", name="Rectangular Grid", description="", settings=rectangular_grid)],
                     snap_settings=[duc.create_identified_snap_settings(id="snap_basic", name="Basic Snap Settings", description="", settings=basic_snap)]
                 ))
                 .build())

    standard2 = (duc.StateBuilder()
                 .with_id("standard_iso_advanced")
                 .with_name("Isometric Grid & Advanced Snap")
                 .build_standard()
                 .with_view_settings(duc.create_standard_view_settings(
                     grid_settings=[duc.create_identified_grid_settings(id="grid_iso", name="Isometric Grid", description="", settings=isometric_grid)],
                     snap_settings=[duc.create_identified_snap_settings(id="snap_advanced", name="Advanced Snap Settings", description="", settings=advanced_snap)]
                 ))
                 .build())
    
    standard3 = (duc.StateBuilder()
                 .with_id("standard_polar_default")
                 .with_name("Polar Grid & Default Snap")
                 .build_standard()
                 .with_view_settings(duc.create_standard_view_settings(
                     grid_settings=[duc.create_identified_grid_settings(id="grid_polar", name="Polar Grid", description="", settings=polar_grid)]
                 ))
                 .build())

    standards = [standard1, standard2, standard3]
    print(f"Created {len(standards)} standards with detailed grid and snap settings")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_grids_snapping_initial.duc")
    duc.write_duc_file(
        file_path=initial_file,
        name="GridsSnappingCSPMDS_Initial",
        standards=standards
    )
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.read_duc_file(initial_file)
    loaded_standards = parsed_data.standards
    
    assert len(loaded_standards) == len(standards)
    print(f"Loaded {len(loaded_standards)} standards")
    
    # Helper to find settings by ID
    def find_grid_settings(standard: duc.Standard, grid_id: str) -> Optional[duc.GridSettings]:
        if standard.view_settings and standard.view_settings.grid_settings:
            for identified_grid in standard.view_settings.grid_settings:
                if identified_grid.id.id == grid_id:
                    return identified_grid.settings
        return None

    def find_snap_settings(standard: duc.Standard, snap_id: str) -> Optional[duc.SnapSettings]:
        if standard.view_settings and standard.view_settings.snap_settings:
            for identified_snap in standard.view_settings.snap_settings:
                if identified_snap.id.id == snap_id:
                    return identified_snap.settings
        return None

    # === MUTATE ===
    print("🔧 MUTATE: Modifying grid and snap settings...")
    
    mutations_count = 0
    
    # Mutate Rectangular Grid's spacing and display type
    target_standard_rect = next((s for s in loaded_standards if s.identifier.id == "standard_rect_basic"), None)
    if target_standard_rect:
        # Mutate the standard's ID
        duc.mutate_element(target_standard_rect.identifier, id=f"updated_{target_standard_rect.identifier.id}")
        print(f"Mutated Standard ID: {target_standard_rect.identifier.id}")
        
        grid_to_mutate_rect = find_grid_settings(target_standard_rect, "grid_rect")
        if grid_to_mutate_rect:
            duc.mutate_element(grid_to_mutate_rect, x_spacing=25.0, y_spacing=25.0, display_type=GRID_DISPLAY_TYPE.DOTS)
            mutations_count += 1
            print(f"Mutated Rectangular Grid: New X-spacing={grid_to_mutate_rect.x_spacing}, Display Type={grid_to_mutate_rect.display_type}")

    # Mutate Basic Snap Settings: toggle object snap, change tolerance
    target_standard_basic_snap = next((s for s in loaded_standards if s.identifier.id == "updated_standard_rect_basic"), None) # Use updated ID here
    if target_standard_basic_snap:
        snap_to_mutate_basic = find_snap_settings(target_standard_basic_snap, "snap_basic")
        if snap_to_mutate_basic:
            duc.mutate_element(snap_to_mutate_basic, is_object_snap_on=False, snap_tolerance=int(5.0))
            mutations_count += 1
            print(f"Mutated Basic Snap: Object Snap On={snap_to_mutate_basic.is_object_snap_on}, Tolerance={snap_to_mutate_basic.snap_tolerance}")

    print(f"Applied {mutations_count} mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some standards...")
    
    # Remove the Isometric Grid Standard
    standards_to_keep = [s for s in loaded_standards if s.identifier.id != "standard_iso_advanced"]
    
    print(f"Deleted 1 standard, keeping {len(standards_to_keep)}")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_grids_snapping_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="GridsSnappingCSPMDS_Final",
        standards=standards_to_keep
    )
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.read_duc_file(final_file)
    final_standards = final_parsed_data.standards
    
    print(f"Final standard count: {len(final_standards)}")
    assert len(final_standards) == len(standards_to_keep), "Final standard count mismatch after deletion."
    assert len(final_standards) < len(standards), "Should be fewer than original standards."

    # Verify remaining standards and their mutated properties
    final_standard_rect_basic = next((s for s in final_standards if s.identifier.id == "updated_standard_rect_basic"), None) # ID will be updated if Identifier was mutated
    final_standard_polar_default = next((s for s in final_standards if s.identifier.id == "standard_polar_default"), None)

    assert final_standard_rect_basic is not None, "Rectangular grid standard not found after mutation."
    assert final_standard_polar_default is not None, "Polar grid standard not found."
    assert next((s for s in final_standards if s.identifier.id == "standard_iso_advanced"), None) is None, "Isometric standard should have been deleted."

    # Verify Rectangular Grid mutations
    final_rect_grid = find_grid_settings(final_standard_rect_basic, "grid_rect")
    assert final_rect_grid is not None, "Rectangular grid settings not found in final state."
    assert final_rect_grid.x_spacing == 25.0
    assert final_rect_grid.y_spacing == 25.0
    assert final_rect_grid.display_type == GRID_DISPLAY_TYPE.DOTS
    print("✅ Verified Rectangular Grid mutations.")

    # Verify Basic Snap mutations
    final_basic_snap = find_snap_settings(final_standard_rect_basic, "snap_basic")
    assert final_basic_snap is not None, "Basic snap settings not found in final state."
    assert final_basic_snap.is_object_snap_on == False
    assert final_basic_snap.snap_tolerance == 5.0
    print("✅ Verified Basic Snap mutations.")

    # Verify Isometric Grid is gone
    assert next((s for s in final_standards if s.identifier.id == "standard_iso_advanced"), None) is None
    print("✅ Verified Isometric Grid Standard was deleted.")

    print("✅ CSPMDS Grids and Snapping test completed successfully!")
    print(f"   - Created {len(standards)} initial standards")
    print(f"   - Mutated grid and snap properties")
    print(f"   - Deleted 1 standard")
    print(f"   - Final state: {len(final_standards)} standards")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])
