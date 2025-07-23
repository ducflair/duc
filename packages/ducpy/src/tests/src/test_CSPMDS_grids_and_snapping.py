"""
CSPMDS Test for Grids and Snapping: Create-Serialize-Parse-Mutate-Delete-Serialize
Validates the full lifecycle of grid and snap settings in DUC files.
"""
import os
import io
import pytest

import ducpy as duc

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

    # Create grid settings
    rectangular_grid = duc.create_grid_settings(
        is_adaptive=True,
        x_spacing=10.0,
        y_spacing=10.0,
        subdivisions=10,
        origin_x=0.0,
        origin_y=0.0,
        rotation=0.0,
        follow_ucs=True,
        major_color="#808080",
        minor_color="#E0E0E0",
        type=duc.GRID_TYPE.RECTANGULAR,
        display_type=duc.GRID_DISPLAY_TYPE.LINES
    )

    isometric_grid = duc.create_grid_settings(
        is_adaptive=False,
        x_spacing=20.0,
        y_spacing=20.0,
        subdivisions=5,
        origin_x=5.0,
        origin_y=5.0,
        rotation=0.523599,  # 30 degrees in radians
        follow_ucs=False,
        major_color="#0077FF",
        minor_color="#B0E0E6",
        type=duc.GRID_TYPE.ISOMETRIC,
        display_type=duc.GRID_DISPLAY_TYPE.DOTS
    )

    polar_grid = duc.create_grid_settings(
        is_adaptive=True,
        x_spacing=0.0,
        y_spacing=0.0,
        subdivisions=12,
        origin_x=0.0,
        origin_y=0.0,
        rotation=0.0,
        follow_ucs=True,
        major_color="#FF7700",
        minor_color="#FFDAB9",
        type=duc.GRID_TYPE.POLAR,
        display_type=duc.GRID_DISPLAY_TYPE.CROSSES
    )

    grids = [rectangular_grid, isometric_grid, polar_grid]

    # Create snap settings
    default_snap = duc.create_snap_settings(
        readonly=False,
        twist_angle=0.0,
        snap_tolerance=10,
        object_snap_aperture=10,
        is_ortho_mode_on=False,
        is_object_snap_on=True,
        active_object_snap_modes=[duc.OBJECT_SNAP_MODE.ENDPOINT, duc.OBJECT_SNAP_MODE.MIDPOINT],
        snap_mode=duc.SNAP_MODE.RUNNING
    )

    ortho_snap = duc.create_snap_settings(
        readonly=False,
        twist_angle=0.0,
        snap_tolerance=5,
        object_snap_aperture=8,
        is_ortho_mode_on=True,
        is_object_snap_on=True,
        active_object_snap_modes=[duc.OBJECT_SNAP_MODE.CENTER],
        snap_mode=duc.SNAP_MODE.SINGLE
    )

    polar_snap = duc.create_snap_settings(
        readonly=True,
        twist_angle=0.785398,  # 45 degrees in radians
        snap_tolerance=15,
        object_snap_aperture=12,
        is_ortho_mode_on=False,
        is_object_snap_on=False,
        active_object_snap_modes=[duc.OBJECT_SNAP_MODE.QUADRANT, duc.OBJECT_SNAP_MODE.INTERSECTION],
        snap_mode=duc.SNAP_MODE.RUNNING
    )

    snaps = [default_snap, ortho_snap, polar_snap]

    # Build StandardViewSettings using builder
    view_settings = duc.create_standard_view_settings(
        grid_settings=grids,
        snap_settings=snaps
    )

    # Build StandardOverrides using builder
    overrides = duc.create_standard_overrides(
        main_scope="mm"
        # You can pass other args as needed
    )

    # Build Standard using builder
    standard = duc.create_standard(
        id="std_gridsnapping",
        name="Grids & Snapping Test",
        version="1.0",
        readonly=False,
        view_settings=view_settings,
        overrides=overrides
    )

    standards = [standard]

    print(f"Created {len(grids)} grid settings and {len(snaps)} snap settings in Standard")

    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")

    initial_file = os.path.join(test_output_dir, "cspmds_gridsnapping_initial.duc")
    serialized_data = duc.serialize_duc(
        name="GridsSnappingCSPMDS_Initial",
        standards=standards
    )

    with open(initial_file, 'wb') as f:
        f.write(serialized_data)

    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")

    # === PARSE ===
    print("📖 PARSE: Loading saved file...")

    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_standard = parsed_data.standards[0]
    loaded_grids = loaded_standard.view_settings.grid_settings
    loaded_snaps = loaded_standard.view_settings.snap_settings

    assert len(loaded_grids) == len(grids)
    assert len(loaded_snaps) == len(snaps)
    print(f"Loaded {len(loaded_grids)} grids and {len(loaded_snaps)} snaps")

    # === MUTATE ===
    print("🔧 MUTATE: Modifying grid and snap settings...")

    # Mutate grid settings
    duc.mutate_grid_settings(loaded_grids[0].settings, x_spacing=25.0, y_spacing=25.0, subdivisions=20)
    duc.mutate_grid_settings(loaded_grids[1].settings, rotation=1.0472)  # 60 degrees in radians
    duc.mutate_grid_settings(loaded_grids[2].settings, is_adaptive=False, major_color="#00FF00")

    # Mutate snap settings
    duc.mutate_snap_settings(loaded_snaps[0].settings, snap_tolerance=20, is_ortho_mode_on=True)
    duc.mutate_snap_settings(loaded_snaps[1].settings, object_snap_aperture=16, is_object_snap_on=False)
    duc.mutate_snap_settings(loaded_snaps[2].settings, twist_angle=0.0, readonly=False)

    print("Applied mutations to all grid and snap settings")

    # === DELETE ===
    print("🗑️ DELETE: Removing some grid and snap settings...")

    # Remove isometric grid and ortho snap
    del loaded_grids[1]
    del loaded_snaps[1]

    loaded_standard.view_settings.grid_settings = loaded_grids
    loaded_standard.view_settings.snap_settings = loaded_snaps

    print(f"Deleted 1 grid and 1 snap setting")

    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")

    final_file = os.path.join(test_output_dir, "cspmds_gridsnapping_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="GridsSnappingCSPMDS_Final",
        standards=[loaded_standard]
    )

    with open(final_file, 'wb') as f:
        f.write(final_serialized_data)

    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")

    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")

    final_parsed_data = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_standard = final_parsed_data.standards[0]
    final_grids = final_standard.view_settings.grid_settings
    final_snaps = final_standard.view_settings.snap_settings

    print(f"Final grid count: {len(final_grids)}")
    print(f"Final snap count: {len(final_snaps)}")

    assert len(final_grids) == len(loaded_grids)
    assert len(final_snaps) == len(loaded_snaps)
    assert len(final_grids) == 2
    assert len(final_snaps) == 2

    print("✅ CSPMDS Grids and Snapping test completed successfully!")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

if __name__ == "__main__":
    pytest.main([__file__])
