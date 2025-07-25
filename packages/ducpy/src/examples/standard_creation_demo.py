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
    grid_settings = (duc.StateBuilder()
        .build_grid_settings() 
        .with_grid_type(GRID_TYPE.RECTANGULAR) 
        .with_x_spacing(12.0) 
        .with_y_spacing(12.0) 
        .with_major_line_interval(12) 
        .with_show_grid(True) 
        .with_snap_to_grid(True) 
        .build())
    
    # Create advanced snap settings with multiple modes
    snap_settings = (duc.StateBuilder()
        .build_snap_settings() 
        .with_enabled(True) 
        .with_snap_modes([SNAP_MODE.RUNNING, SNAP_MODE.SINGLE]) 
        .with_object_snap_modes([
            OBJECT_SNAP_MODE.ENDPOINT,
            OBJECT_SNAP_MODE.MIDPOINT,
            OBJECT_SNAP_MODE.CENTER,
            OBJECT_SNAP_MODE.INTERSECTION,
            OBJECT_SNAP_MODE.PERPENDICULAR
        ]) 
        .with_snap_tolerance(10.0) 
        .with_tracking_enabled(True) 
        .build())
    
    # Create sophisticated polar tracking
    polar_tracking = duc.create_polar_tracking_settings(
        enabled=True,
        increment_angle=15.0,  # 15-degree increments
        angles=[22.5, 45.0, 67.5],  # Common architectural angles
        track_from_last_point=True,
        show_polar_coordinates=True
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
        suppress_trailing_zeros=False,
        suppress_leading_zeros=False,
        system=UNIT_SYSTEM.METRIC # Assuming metric as a sensible default
    )
    
    # Compose the complete standard with nested components
    architectural_standard = (duc.StateBuilder()
        .build_standard() 
        .with_id("arch_2024") 
        .with_name("Architectural Standard 2024") 
        .with_description("Professional architectural drawing standard with precision grid, snap, and units") 
        .with_units(duc.create_standard_units(
            primary_units=duc.create_primary_units(
                linear=linear_units,
                angular=angular_units
            ),
            alternate_units=None # No alternate units for now
        )) 
        .with_validation(duc.create_standard_validation(
            dimension_rules=duc.create_dimension_validation_rules(
                min_text_height=0.1, max_text_height=100.0, allowed_precisions=[0, 1, 2, 3, 4]
            ),
            layer_rules=duc.create_layer_validation_rules(
                prohibited_layer_names=["temp_layer"]
            )
        )) 
        .with_overrides(duc.create_standard_overrides(
            main_scope="architectural",
            unit_precision=duc.UnitPrecision(linear=4, angular=2, area=2, volume=2)
        )) 
        .with_styles(duc.create_standard_styles(
            common_styles=[duc.IdentifiedCommonStyle(id=duc.create_identifier("default_common", "Default Common Style"), style=duc.DucCommonStyle(
                background=duc.create_background(duc.create_solid_content("#FFFFFF", opacity=1.0)), # Default white background
                stroke=duc.create_stroke(duc.create_solid_content("#000000", opacity=1.0), width=1.0) # Default black stroke
            ))],
            text_styles=[duc.IdentifiedTextStyle(id=duc.create_identifier("default_text", "Default Text Style"), style=duc.DucTextStyle(
                base_style=duc.DucElementStylesBase(roundness=0.0, background=[], stroke=[], opacity=1.0),
                is_ltr=True,
                font_family="Arial",
                big_font_family="Arial",
                line_height=1.0,
                line_spacing=duc.LineSpacing(value=1.0, type=duc.LINE_SPACING_TYPE.AT_LEAST),
                oblique_angle=0.0,
                font_size=12,
                width_factor=1.0,
                is_upside_down=False,
                is_backwards=False,
                text_align=duc.TEXT_ALIGN.LEFT,
                vertical_align=duc.VERTICAL_ALIGN.MIDDLE,
                paper_text_height=None
            ))]
        )) 
        .with_view_settings(duc.create_standard_view_settings(
            grid_settings=[duc.IdentifiedGridSettings(id=duc.create_identifier("default_grid", "Default Grid"), settings=grid_settings)],
            snap_settings=[duc.IdentifiedSnapSettings(id=duc.create_identifier("default_snap", "Default Snap"), settings=snap_settings)],
            views=[], # No default views for now
            ucs=[] # No default UCS for now
        )) 
        .build())
    
    return architectural_standard


def create_mechanical_standard():
    """
    Creates a mechanical engineering standard with metric units
    and tight tolerances.
    """
    # Metric grid with 5mm spacing
    grid_settings = (duc.StateBuilder()
        .build_grid_settings() 
        .with_grid_type(GRID_TYPE.RECTANGULAR) 
        .with_x_spacing(5.0) 
        .with_y_spacing(5.0) 
        .with_major_line_interval(10) 
        .with_show_grid(True) 
        .with_snap_to_grid(True) 
        .build())
    
    # Precision snap settings for mechanical work
    snap_settings = (duc.StateBuilder()
        .build_snap_settings() 
        .with_enabled(True) 
        .with_snap_modes([SNAP_MODE.RUNNING, SNAP_MODE.SINGLE]) 
        .with_object_snap_modes([
            OBJECT_SNAP_MODE.ENDPOINT,
            OBJECT_SNAP_MODE.MIDPOINT,
            OBJECT_SNAP_MODE.CENTER,
            OBJECT_SNAP_MODE.TANGENT,
            OBJECT_SNAP_MODE.PERPENDICULAR,
            OBJECT_SNAP_MODE.PARALLEL
        ]) 
        .with_snap_tolerance(5.0) 
        .with_tracking_enabled(True) 
        .build())
    
    # Metric linear units with high precision
    linear_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.METRIC,
        precision=3,  # 0.001mm precision
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_trailing_zeros=True,
        suppress_leading_zeros=True,
        suppress_zero_feet=False,  # Add missing argument
        suppress_zero_inches=False, # Add missing argument
        format=duc.DIMENSION_UNITS_FORMAT.DECIMAL # Add missing argument
    )
    
    # Angular units in degrees/minutes/seconds for precision
    angular_units = duc.create_angular_unit_system(
        format=ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS,
        precision=1,  # 1 arc-second precision
        suppress_trailing_zeros=True,
        suppress_leading_zeros=False, # Add missing argument
        system=UNIT_SYSTEM.METRIC # Add missing argument
    )
    
    # Create the mechanical standard
    mechanical_standard = (duc.StateBuilder()
        .build_standard() 
        .with_id("mech_iso") 
        .with_name("Mechanical Engineering Standard ISO") 
        .with_description("ISO-compliant mechanical drawing standard with metric units and precision") 
        .with_units(duc.create_standard_units(
            primary_units=duc.create_primary_units(
                linear=linear_units,
                angular=angular_units
            ),
            alternate_units=None # No alternate units for now
        )) 
        .with_validation(duc.create_standard_validation(
            dimension_rules=duc.create_dimension_validation_rules(
                min_text_height=0.01, max_text_height=500.0, allowed_precisions=[0, 1, 2, 3, 4, 5]
            ),
            layer_rules=duc.create_layer_validation_rules(
                prohibited_layer_names=["DO_NOT_PRINT"]
            )
        )) 
        .with_overrides(duc.create_standard_overrides(
            main_scope="mechanical",
            unit_precision=duc.UnitPrecision(linear=3, angular=1, area=3, volume=3)
        )) 
        .with_styles(duc.create_standard_styles(
            common_styles=[duc.IdentifiedCommonStyle(id=duc.create_identifier("mechanical_common", "Mechanical Common Style"), style=duc.DucCommonStyle(
                background=duc.create_background(duc.create_solid_content("#F0F0F0", opacity=1.0)),
                stroke=duc.create_stroke(duc.create_solid_content("#333333", opacity=1.0), width=0.5)
            ))],
            text_styles=[duc.IdentifiedTextStyle(id=duc.create_identifier("mechanical_text", "Mechanical Text Style"), style=duc.DucTextStyle(
                base_style=duc.DucElementStylesBase(roundness=0.0, background=[], stroke=[], opacity=1.0),
                is_ltr=True,
                font_family="Roboto",
                big_font_family="Roboto",
                line_height=1.0,
                line_spacing=duc.LineSpacing(value=1.0, type=duc.LINE_SPACING_TYPE.AT_LEAST),
                oblique_angle=0.0,
                font_size=10,
                width_factor=1.0,
                is_upside_down=False,
                is_backwards=False,
                text_align=duc.TEXT_ALIGN.CENTER,
                vertical_align=duc.VERTICAL_ALIGN.MIDDLE,
                paper_text_height=None
            ))]
        )) 
        .with_view_settings(duc.create_standard_view_settings(
            grid_settings=[duc.IdentifiedGridSettings(id=duc.create_identifier("mechanical_grid", "Mechanical Grid"), settings=grid_settings)],
            snap_settings=[duc.IdentifiedSnapSettings(id=duc.create_identifier("mechanical_snap", "Mechanical Snap"), settings=snap_settings)],
            views=[],
            ucs=[]
        )) 
        .build())
    
    return mechanical_standard


def demonstrate_standard_variations():
    """
    Demonstrates how to create multiple standard variations
    from a common base configuration.
    """
    # Base configuration for engineering standards
    base_grid = (duc.StateBuilder()
        .build_grid_settings() 
        .with_grid_type(GRID_TYPE.RECTANGULAR) 
        .with_x_spacing(10.0) 
        .with_y_spacing(10.0) 
        .with_show_grid(True) 
        .with_snap_to_grid(True) 
        .build())
    
    base_snap = (duc.StateBuilder()
        .build_snap_settings() 
        .with_enabled(True) 
        .with_snap_modes([SNAP_MODE.RUNNING, SNAP_MODE.SINGLE]) 
        .with_object_snap_modes([OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT, OBJECT_SNAP_MODE.CENTER]) 
        .with_snap_tolerance(8.0) 
        .build())
    
    # Variation 1: Imperial with fractions
    imperial_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.IMPERIAL,
        precision=32,  # 1/32" precision
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_zero_feet=True,
        suppress_leading_zeros=True, # Added missing argument
        suppress_trailing_zeros=True, # Added missing argument
        suppress_zero_inches=True, # Added missing argument
        format=duc.DIMENSION_UNITS_FORMAT.FRACTIONAL # Added missing argument
    )
    
    # Angular units for variations (re-defined for clarity within this function)
    angular_units = duc.create_angular_unit_system(
        format=ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES,
        precision=2,
        suppress_trailing_zeros=False,
        suppress_leading_zeros=False,
        system=UNIT_SYSTEM.IMPERIAL # Assuming imperial as a sensible default
    )
    
    imperial_standard = (duc.StateBuilder()
        .build_standard() 
        .with_id("imperial_frac") 
        .with_name("Imperial Standard - Fractional") 
        .with_description("Imperial standard with fractional units for construction.") 
        .with_units(duc.create_standard_units(
            primary_units=duc.create_primary_units(
                linear=imperial_units,
                angular=angular_units
            ),
            alternate_units=None
        )) 
        .with_view_settings(duc.create_standard_view_settings(
            grid_settings=[duc.IdentifiedGridSettings(id=duc.create_identifier("imperial_grid", "Imperial Grid"), settings=base_grid)],
            snap_settings=[duc.IdentifiedSnapSettings(id=duc.create_identifier("imperial_snap", "Imperial Snap"), settings=base_snap)],
            views=[],
            ucs=[]
        )) 
        .build())
    
    # Variation 2: Metric with high precision
    metric_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.METRIC,
        precision=2, 
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_trailing_zeros=False,
        suppress_leading_zeros=False, # Added missing argument
        suppress_zero_feet=False, # Added missing argument
        suppress_zero_inches=False, # Added missing argument
        format=duc.DIMENSION_UNITS_FORMAT.DECIMAL # Added missing argument
    )
    
    metric_standard = (duc.StateBuilder()
        .build_standard() 
        .with_id("metric_high_prec") 
        .with_name("Metric Standard - High Precision") 
        .with_description("Metric standard for manufacturing with high precision.") 
        .with_units(duc.create_standard_units(
            primary_units=duc.create_primary_units(
                linear=metric_units,
                angular=angular_units
            ),
            alternate_units=None
        )) 
        .with_view_settings(duc.create_standard_view_settings(
            grid_settings=[duc.IdentifiedGridSettings(id=duc.create_identifier("metric_grid", "Metric Grid"), settings=base_grid)],
            snap_settings=[duc.IdentifiedSnapSettings(id=duc.create_identifier("metric_snap", "Metric Snap"), settings=base_snap)],
            views=[],
            ucs=[]
        )) 
        .build())
    
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
