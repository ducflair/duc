"""
Elegant Standard Construction Example

This demonstrates how to create complex standards using nested builders
with a clean, elegant API that leverages the full power of the DucPy
standards system.
"""

import ducpy as duc
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE


def create_architectural_standard():
    """
    Creates a comprehensive architectural drawing standard demonstrating
    elegant nested construction with all standard components.
    """
    # Create nested grid settings with precision
    grid_settings = duc.create_grid_settings(
        type=GRID_TYPE.RECTANGULAR,
        x_spacing=12.0,  # 1 foot spacing
        y_spacing=12.0,
        major_line_interval=12,  # Major lines every 12 feet
        show_grid=True,
        snap_to_grid=True
    )
    
    # Create advanced snap settings with multiple modes
    snap_settings = duc.create_snap_settings(
        enabled=True,
        snap_modes=[SNAP_MODE.RUNNING, SNAP_MODE.SINGLE],
        object_snap_modes=[
            OBJECT_SNAP_MODE.ENDPOINT,
            OBJECT_SNAP_MODE.MIDPOINT,
            OBJECT_SNAP_MODE.CENTER,
            OBJECT_SNAP_MODE.INTERSECTION,
            OBJECT_SNAP_MODE.PERPENDICULAR
        ],
        snap_tolerance=10.0,
        tracking_enabled=True
    )
    
    # Create sophisticated polar tracking
    polar_tracking = duc.create_polar_tracking_settings(
        enabled=True,
        increment_angle=15.0,  # 15-degree increments
        angles=[22.5, 45.0, 67.5],  # Common architectural angles
        track_from_last_point=True
    )
    
    # Create precise linear unit system for architectural work
    linear_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.IMPERIAL,
        precision=16,  # 1/16" precision
        format=duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL,
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_trailing_zeros=False,
        suppress_leading_zeros=True,
        suppress_zero_feet=False,
        suppress_zero_inches=False
    )
    
    # Create angular unit system with decimal degrees
    angular_units = duc.create_angular_unit_system(
        format=ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES,
        precision=2,
        suppress_trailing_zeros=False
    )
    
    # Compose the complete standard with nested components
    architectural_standard = duc.create_standard_complete(
        id="arch_2024",
        name="Architectural Standard 2024",
        description="Professional architectural drawing standard with precision grid, snap, and units",
        units=duc.create_standard_units_simple(
            linear_units=linear_units,
            angular_units=angular_units,
            measurement_scale=1.0,
            annotation_scale=1.0
        ),
        validation=duc.create_standard_validation_simple(
            enforce_precision=True,
            validate_dimensions=True,
            require_units=True,
            check_tolerances=True
        ),
        overrides=duc.create_standard_overrides_simple(
            allow_user_modifications=True,
            inherit_from_template=True,
            lock_critical_settings=False
        ),
        styles=duc.create_standard_styles_simple(
            default_text_height=3.0,  # 3mm text height
            default_line_weight=0.25,
            dimension_text_height=2.5,
            leader_text_height=2.0
        ),
        view_settings=duc.create_standard_view_settings_simple(
            default_viewport_scale=1.0,
            show_grid=True,
            show_snap_markers=True,
            highlight_constraints=True
        ),
        grid_settings=grid_settings,
        snap_settings=snap_settings,
        polar_tracking_settings=polar_tracking
    )
    
    return architectural_standard


def create_mechanical_standard():
    """
    Creates a mechanical engineering standard with metric units
    and tight tolerances.
    """
    # Metric grid with 5mm spacing
    grid_settings = duc.create_grid_settings(
        type=GRID_TYPE.RECTANGULAR,
        x_spacing=5.0,
        y_spacing=5.0,
        major_line_interval=10,
        show_grid=True,
        snap_to_grid=True
    )
    
    # Precision snap settings for mechanical work
    snap_settings = duc.create_snap_settings(
        enabled=True,
        snap_modes=[SNAP_MODE.RUNNING, SNAP_MODE.SINGLE],
        object_snap_modes=[
            OBJECT_SNAP_MODE.ENDPOINT,
            OBJECT_SNAP_MODE.MIDPOINT,
            OBJECT_SNAP_MODE.CENTER,
            OBJECT_SNAP_MODE.TANGENT,
            OBJECT_SNAP_MODE.PERPENDICULAR,
            OBJECT_SNAP_MODE.PARALLEL
        ],
        snap_tolerance=5.0,  # Tighter tolerance
        tracking_enabled=True
    )
    
    # Metric linear units with high precision
    linear_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.METRIC,
        precision=3,  # 0.001mm precision
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_trailing_zeros=True,
        suppress_leading_zeros=True
    )
    
    # Angular units in degrees/minutes/seconds for precision
    angular_units = duc.create_angular_unit_system(
        format=ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS,
        precision=1,  # 1 arc-second precision
        suppress_trailing_zeros=True
    )
    
    # Create the mechanical standard
    mechanical_standard = duc.create_standard_complete(
        id="mech_iso",
        name="Mechanical Engineering Standard ISO",
        description="ISO-compliant mechanical drawing standard with metric units and precision",
        units=duc.create_standard_units_simple(
            linear_units=linear_units,
            angular_units=angular_units,
            measurement_scale=1.0,
            annotation_scale=1.0
        ),
        validation=duc.create_standard_validation_simple(
            enforce_precision=True,
            validate_dimensions=True,
            require_units=True,
            check_tolerances=True,
            tolerance_stack_analysis=True
        ),
        overrides=duc.create_standard_overrides_simple(
            allow_user_modifications=False,  # Strict ISO compliance
            inherit_from_template=True,
            lock_critical_settings=True
        ),
        styles=duc.create_standard_styles_simple(
            default_text_height=2.5,
            default_line_weight=0.13,  # ISO standard line weight
            dimension_text_height=2.0,
            leader_text_height=1.8
        ),
        view_settings=duc.create_standard_view_settings_simple(
            default_viewport_scale=1.0,
            show_grid=True,
            show_snap_markers=True,
            highlight_constraints=True,
            show_dimensions=True
        ),
        grid_settings=grid_settings,
        snap_settings=snap_settings
    )
    
    return mechanical_standard


def demonstrate_standard_variations():
    """
    Demonstrates how to create multiple standard variations
    from a common base configuration.
    """
    # Base configuration for engineering standards
    base_grid = duc.create_grid_settings(
        grid_type=GRID_TYPE.RECTANGULAR,
        x_spacing=10.0,
        y_spacing=10.0,
        show_grid=True,
        snap_to_grid=True
    )
    
    base_snap = duc.create_snap_settings(
        enabled=True,
        snap_modes=[SNAP_MODE.RUNNING, SNAP_MODE.SINGLE],
        object_snap_modes=[OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT, OBJECT_SNAP_MODE.CENTER],
        snap_tolerance=8.0
    )
    
    # Variation 1: Imperial with fractions
    imperial_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.IMPERIAL,
        precision=32,  # 1/32" precision
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_zero_feet=True
    )
    
    imperial_standard = duc.create_standard_complete(
        id="imperial_eng",
        name="Imperial Engineering Standard",
        description="US customary units with fractional precision",
        units=duc.create_standard_units_simple(
            linear_units=imperial_units,
            angular_units=duc.create_angular_unit_system(
                format=ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES,
                precision=2
            )
        ),
        grid_settings=base_grid,
        snap_settings=base_snap
    )
    
    # Variation 2: Metric with decimals
    metric_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.METRIC,
        precision=2,
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_trailing_zeros=False
    )
    
    metric_standard = duc.create_standard_complete(
        id="metric_eng",
        name="Metric Engineering Standard",
        description="Metric units with decimal precision",
        units=duc.create_standard_units_simple(
            linear_units=metric_units,
            angular_units=duc.create_angular_unit_system(
                format=ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES,
                precision=1
            )
        ),
        grid_settings=base_grid,
        snap_settings=base_snap
    )
    
    return imperial_standard, metric_standard


if __name__ == "__main__":
    # Demonstrate elegant standard construction
    print("Creating architectural standard...")
    arch_std = create_architectural_standard()
    print(f"Created: {arch_std.identifier.name}")
    print(f"Description: {arch_std.identifier.description}")
    print(f"Linear units: {arch_std.units.primary_units.linear.system} with precision {arch_std.units.primary_units.linear.precision}")
    print()
    
    print("Creating mechanical standard...")
    mech_std = create_mechanical_standard()
    print(f"Created: {mech_std.identifier.name}")
    print(f"Linear units: {mech_std.units.primary_units.linear.system} with precision {mech_std.units.primary_units.linear.precision}")
    print()
    
    print("Creating standard variations...")
    imperial, metric = demonstrate_standard_variations()
    print(f"Imperial: {imperial.identifier.name} - {imperial.units.primary_units.linear.system}")
    print(f"Metric: {metric.identifier.name} - {metric.units.primary_units.linear.system}")
    print()
    
    print("✓ All standards created successfully with elegant nested construction!")
