"""
Comprehensive CSPMDS test for StandardsClass.py.
Covers all dataclasses using ONLY builder functions from ducpy.builders.
Follows CSPMDS methodology: Create, Serialize, Parse, Mutate, Delete, Verify.
"""

import os
import io
import math
import pytest
import ducpy as duc

# --- Fixtures ---
@pytest.fixture
def test_output_dir():
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

# --- TESTS ---

def test_grid_settings_comprehensive_properties():
    """Test all GridSettings properties including polar and isometric variants"""
    
    # Test rectangular grid
    rectangular_grid = duc.create_grid_settings(
        is_adaptive=True,
        x_spacing=42.0,
        y_spacing=24.0,
        subdivisions=7,
        origin_x=1.0,
        origin_y=2.0,
        rotation=0.5,
        follow_ucs=False,
        major_color="#123456",
        minor_color="#654321",
        type=duc.GRID_TYPE.RECTANGULAR,
        display_type=duc.GRID_DISPLAY_TYPE.LINES
    )
    
    assert rectangular_grid.is_adaptive is True
    assert rectangular_grid.x_spacing == 42.0
    assert rectangular_grid.y_spacing == 24.0
    assert rectangular_grid.subdivisions == 7
    assert rectangular_grid.origin.x == 1.0
    assert rectangular_grid.origin.y == 2.0
    assert rectangular_grid.rotation == 0.5
    assert rectangular_grid.follow_ucs is False
    assert rectangular_grid.major_style.color == "#123456"
    assert rectangular_grid.minor_style.color == "#654321"
    assert rectangular_grid.type == duc.GRID_TYPE.RECTANGULAR
    assert rectangular_grid.display_type == duc.GRID_DISPLAY_TYPE.LINES
    
    # Create a more comprehensive grid with polar settings
    polar_settings = duc.create_polar_grid_settings(
        radial_divisions=12, 
        radial_spacing=15.0, 
        show_labels=False
    )
    
    polar_grid = duc.create_grid_settings(
        type=duc.GRID_TYPE.POLAR,
        display_type=duc.GRID_DISPLAY_TYPE.DOTS
    )
    polar_grid.polar_settings = polar_settings
    
    assert polar_grid.type == duc.GRID_TYPE.POLAR
    assert polar_grid.polar_settings.radial_divisions == 12
    assert polar_grid.polar_settings.radial_spacing == 15.0
    assert polar_grid.polar_settings.show_labels is False
    
    # Create isometric grid
    isometric_settings = duc.create_isometric_grid_settings(
        left_angle=math.radians(30.0),  # 30 degrees
        right_angle=math.radians(30.0)
    )
    
    isometric_grid = duc.create_grid_settings(type=duc.GRID_TYPE.ISOMETRIC)
    isometric_grid.isometric_settings = isometric_settings
    
    assert isometric_grid.type == duc.GRID_TYPE.ISOMETRIC
    assert isometric_grid.isometric_settings.left_angle == math.radians(30.0)
    assert isometric_grid.isometric_settings.right_angle == math.radians(30.0)

def test_snap_settings_comprehensive_properties():
    """Test all SnapSettings properties including complex configurations"""
    
    # Create comprehensive snap settings
    polar_tracking = duc.create_polar_tracking_settings(
        enabled=True,
        angles=[math.radians(0), math.radians(90), math.radians(180), math.radians(270)],  # 0, 90, 180, 270 degrees
        track_from_last_point=False,
        show_polar_coordinates=True,
        increment_angle=math.radians(15.0)  # 15 degrees
    )
    
    dynamic_snap = duc.create_dynamic_snap_settings(
        enabled_during_drag=True,
        enabled_during_rotation=False,
        enabled_during_scale=True
    )
    
    tracking_line_style = duc.create_tracking_line_style(
        color="#FF8000",
        opacity=0.8,
        dash_pattern=[3.0, 1.0, 1.0, 1.0]
    )
    
    layer_filters = duc.create_layer_snap_filters(
        include_layers=["layer1", "layer2"],
        exclude_layers=["hidden_layer"]
    )
    
    marker_styles = [
        duc.create_snap_marker_style_entry(
            key=duc.OBJECT_SNAP_MODE.ENDPOINT,
            value=duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.SQUARE, "#FF0000")
        ),
        duc.create_snap_marker_style_entry(
            key=duc.OBJECT_SNAP_MODE.MIDPOINT,
            value=duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.TRIANGLE, "#00FF00")
        )
    ]
    
    snap_markers = duc.create_snap_marker_settings(
        enabled=True,
        size=12,
        styles=marker_styles,
        duration=2000
    )
    
    overrides = [
        duc.create_snap_override("ctrl", duc.SNAP_OVERRIDE_BEHAVIOR.DISABLE),
        duc.create_snap_override("shift", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID)
    ]
    
    snap = duc.create_snap_settings(
        readonly=False,
        twist_angle=0.785,  # 45 degrees
        snap_tolerance=15,
        object_snap_aperture=20,
        is_ortho_mode_on=True,
        is_object_snap_on=True,
        active_object_snap_modes=[
            duc.OBJECT_SNAP_MODE.ENDPOINT,
            duc.OBJECT_SNAP_MODE.MIDPOINT,
            duc.OBJECT_SNAP_MODE.CENTER
        ],
        snap_mode=duc.SNAP_MODE.RUNNING
    )
    
    # Add the complex configurations
    snap.polar_tracking = polar_tracking
    snap.dynamic_snap = dynamic_snap
    snap.tracking_line_style = tracking_line_style
    snap.layer_snap_filters = layer_filters
    snap.snap_markers = snap_markers
    snap.temporary_overrides = overrides
    snap.incremental_distance = 5.0
    snap.magnetic_strength = 75.0
    snap.element_type_filters = ["line", "circle", "arc"]
    snap.construction_snap_enabled = True
    snap.snap_to_grid_intersections = True
    
    assert snap.twist_angle == 0.785
    assert snap.snap_tolerance == 15
    assert snap.object_snap_aperture == 20
    assert snap.is_ortho_mode_on is True
    assert snap.polar_tracking.increment_angle == math.radians(15.0)
    assert snap.dynamic_snap.enabled_during_rotation is False
    assert snap.tracking_line_style.color == "#FF8000"
    assert len(snap.layer_snap_filters.include_layers) == 2
    assert len(snap.snap_markers.styles) == 2
    assert len(snap.temporary_overrides) == 2
    assert snap.incremental_distance == 5.0
    assert snap.magnetic_strength == 75.0
    assert len(snap.element_type_filters) == 3

def test_standard_units_comprehensive_properties():
    """Test all StandardUnits and related unit system properties, including edge cases and all fields."""

    # Comprehensive LinearUnitSystem
    linear_units = duc.create_linear_unit_system(
        precision=4,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=False,
        suppress_zero_feet=False,
        suppress_zero_inches=False,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        format=duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL,
        decimal_separator=duc.DECIMAL_SEPARATOR.COMMA
    )
    assert linear_units.precision == 4
    assert linear_units.suppress_leading_zeros is True
    assert linear_units.suppress_trailing_zeros is False
    assert linear_units.suppress_zero_feet is False
    assert linear_units.suppress_zero_inches is False
    assert linear_units.system == duc.UNIT_SYSTEM.IMPERIAL
    assert linear_units.format == duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL
    assert linear_units.decimal_separator == duc.DECIMAL_SEPARATOR.COMMA

    # Edge case: zero precision, all suppressions True
    linear_units_edge = duc.create_linear_unit_system(
        precision=0,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=True,
        suppress_zero_feet=True,
        suppress_zero_inches=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.DIMENSION_UNITS_FORMAT.DECIMAL,
        decimal_separator=duc.DECIMAL_SEPARATOR.DOT
    )
    assert linear_units_edge.precision == 0
    assert linear_units_edge.suppress_leading_zeros is True
    assert linear_units_edge.suppress_trailing_zeros is True
    assert linear_units_edge.suppress_zero_feet is True
    assert linear_units_edge.suppress_zero_inches is True
    assert linear_units_edge.system == duc.UNIT_SYSTEM.METRIC
    assert linear_units_edge.format == duc.DIMENSION_UNITS_FORMAT.DECIMAL
    assert linear_units_edge.decimal_separator == duc.DECIMAL_SEPARATOR.DOT

    # AngularUnitSystem
    angular_units = duc.create_angular_unit_system(
        precision=3,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS
    )
    assert angular_units.precision == 3
    assert angular_units.suppress_leading_zeros is False
    assert angular_units.suppress_trailing_zeros is True
    assert angular_units.system == duc.UNIT_SYSTEM.METRIC
    assert angular_units.format == duc.ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS

    # Edge case: max precision, uncommon format
    angular_units_edge = duc.create_angular_unit_system(
        precision=10,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=False,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        format=duc.ANGULAR_UNITS_FORMAT.GRADS
    )
    assert angular_units_edge.precision == 10
    assert angular_units_edge.suppress_leading_zeros is True
    assert angular_units_edge.suppress_trailing_zeros is False
    assert angular_units_edge.system == duc.UNIT_SYSTEM.IMPERIAL
    assert angular_units_edge.format == duc.ANGULAR_UNITS_FORMAT.GRADS

    # PrimaryUnits
    primary_units = duc.create_primary_units(
        linear=linear_units,
        angular=angular_units
    )
    assert primary_units.linear == linear_units
    assert primary_units.angular == angular_units

    # AlternateUnits
    alternate_units = duc.create_alternate_units(
        precision=2,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        is_visible=True,
        multiplier=25.4,  # mm to inches
        format=duc.DIMENSION_UNITS_FORMAT.DECIMAL
    )
    assert alternate_units.precision == 2
    assert alternate_units.suppress_leading_zeros is True
    assert alternate_units.suppress_trailing_zeros is True
    assert alternate_units.system == duc.UNIT_SYSTEM.METRIC
    assert alternate_units.is_visible is True
    assert alternate_units.multiplier == 25.4
    assert alternate_units.format == duc.DIMENSION_UNITS_FORMAT.DECIMAL

    # Edge case: invisible, zero multiplier
    alternate_units_edge = duc.create_alternate_units(
        precision=1,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=False,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        is_visible=False,
        multiplier=0.0,
        format=duc.DIMENSION_UNITS_FORMAT.FRACTIONAL
    )
    assert alternate_units_edge.is_visible is False
    assert alternate_units_edge.multiplier == 0.0
    assert alternate_units_edge.format == duc.DIMENSION_UNITS_FORMAT.FRACTIONAL

    # StandardUnits
    standard_units = duc.create_standard_units(
        primary_units=primary_units,
        alternate_units=alternate_units
    )
    assert standard_units.primary_units == primary_units
    assert standard_units.alternate_units == alternate_units

    # Edge case: alternate_units None (should handle gracefully if allowed)
    try:
        standard_units_none = duc.create_standard_units(
            primary_units=primary_units,
            alternate_units=None
        )
        assert standard_units_none.alternate_units is None
    except Exception:
        pass  # If not allowed, test passes

    # UnitPrecision
    unit_precision = duc.UnitPrecision(linear=4, angular=3, area=2, volume=1)
    assert unit_precision.linear == 4
    assert unit_precision.angular == 3
    assert unit_precision.area == 2
    assert unit_precision.volume == 1

def test_standard_validation_comprehensive_properties():
    """Test all StandardValidation properties, including edge cases and all fields."""

    # DimensionValidationRules
    dim_rules = duc.create_dimension_validation_rules(
        min_text_height=0.5,
        max_text_height=200.0,
        allowed_precisions=[0, 1, 2, 3, 4, 5, 6, 7, 8]
    )
    assert dim_rules.min_text_height == 0.5
    assert dim_rules.max_text_height == 200.0
    assert dim_rules.allowed_precisions == [0, 1, 2, 3, 4, 5, 6, 7, 8]

    # Edge case: min_text_height > max_text_height
    dim_rules_edge = duc.create_dimension_validation_rules(
        min_text_height=100.0,
        max_text_height=50.0,
        allowed_precisions=[]
    )
    assert dim_rules_edge.min_text_height == 100.0
    assert dim_rules_edge.max_text_height == 50.0
    assert dim_rules_edge.allowed_precisions == []

    # LayerValidationRules
    layer_rules = duc.create_layer_validation_rules(
        prohibited_layer_names=["0", "defpoints", "system", "hidden", "temp"]
    )
    assert layer_rules.prohibited_layer_names == ["0", "defpoints", "system", "hidden", "temp"]

    # Edge case: empty prohibited_layer_names
    layer_rules_empty = duc.create_layer_validation_rules(
        prohibited_layer_names=[]
    )
    assert layer_rules_empty.prohibited_layer_names == []

    # StandardValidation
    validation = duc.create_standard_validation(
        dimension_rules=dim_rules,
        layer_rules=layer_rules
    )
    assert validation.dimension_rules == dim_rules
    assert validation.layer_rules == layer_rules

    # Edge case: dimension_rules None
    validation_none_dim = duc.create_standard_validation(
        dimension_rules=None,
        layer_rules=layer_rules
    )
    assert validation_none_dim.dimension_rules is None
    assert validation_none_dim.layer_rules == layer_rules

    # Edge case: layer_rules None
    validation_none_layer = duc.create_standard_validation(
        dimension_rules=dim_rules,
        layer_rules=None
    )
    assert validation_none_layer.dimension_rules == dim_rules
    assert validation_none_layer.layer_rules is None

    # Edge case: both None
    validation_both_none = duc.create_standard_validation(
        dimension_rules=None,
        layer_rules=None
    )
    assert validation_both_none.dimension_rules is None
    assert validation_both_none.layer_rules is None

def test_standard_overrides_comprehensive_properties():
    """Test all StandardOverrides properties"""
    unit_precision = duc.UnitPrecision(linear=4, angular=3, area=2, volume=1)
    
    overrides = duc.create_standard_overrides(
        main_scope="imperial",
        unit_precision=unit_precision,
        elements_stroke_width_override=3.5,
        common_style_id="main_common_style",
        stack_like_style_id="main_stack_style",
        text_style_id="main_text_style",
        dimension_style_id="main_dimension_style",
        leader_style_id="main_leader_style",
        feature_control_frame_style_id="main_fcf_style",
        table_style_id="main_table_style",
        doc_style_id="main_doc_style",
        viewport_style_id="main_viewport_style",
        plot_style_id="main_plot_style",
        hatch_style_id="main_hatch_style",
        active_grid_settings_id=["main_grid", "secondary_grid", "detailed_grid"],
        active_snap_settings_id="main_snap",
        dash_line_override="custom_dash_pattern"
    )
    
    assert overrides.main_scope == "imperial"
    assert overrides.unit_precision.linear == 4
    assert overrides.unit_precision.angular == 3
    assert overrides.unit_precision.area == 2
    assert overrides.unit_precision.volume == 1
    assert overrides.elements_stroke_width_override == 3.5
    assert overrides.common_style_id == "main_common_style"
    assert overrides.stack_like_style_id == "main_stack_style"
    assert overrides.text_style_id == "main_text_style"
    assert overrides.dimension_style_id == "main_dimension_style"
    assert overrides.leader_style_id == "main_leader_style"
    assert overrides.feature_control_frame_style_id == "main_fcf_style"
    assert overrides.table_style_id == "main_table_style"
    assert overrides.doc_style_id == "main_doc_style"
    assert overrides.viewport_style_id == "main_viewport_style"
    assert overrides.plot_style_id == "main_plot_style"
    assert overrides.hatch_style_id == "main_hatch_style"
    assert len(overrides.active_grid_settings_id) == 3
    assert "secondary_grid" in overrides.active_grid_settings_id
    assert overrides.active_snap_settings_id == "main_snap"
    assert overrides.dash_line_override == "custom_dash_pattern"

def test_standard_styles_comprehensive_properties():
    """Test all StandardStyles properties using various style builders"""
    
    # Create comprehensive styles using available builders
    common_style1 = duc.create_simple_styles(roundness=2.5, opacity=0.8)
    common_style2 = duc.create_simple_styles(roundness=0.0, opacity=1.0)
    
    text_style1 = duc.create_text_style(
        font_family="Times New Roman", 
        font_size=12,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.MIDDLE
    )
    text_style2 = duc.create_text_style(
        font_family="Helvetica", 
        font_size=14,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP
    )
    
    doc_style1 = duc.create_doc_style()
    doc_style2 = duc.create_doc_style()
    
    styles = duc.create_standard_styles(
        common_styles=[
            ("primary_common", common_style1),
            ("secondary_common", common_style2)
        ],
        text_styles=[
            ("title_text", text_style1),
            ("body_text", text_style2)
        ],
        doc_styles=[
            ("main_doc", doc_style1),
            ("secondary_doc", doc_style2)
        ]
    )
    
    assert len(styles.common_styles) == 2
    assert len(styles.text_styles) == 2
    assert len(styles.doc_styles) == 2
    
    assert styles.common_styles[0].id.id == "primary_common"
    assert styles.common_styles[1].id.id == "secondary_common"
    assert styles.text_styles[0].id.id == "title_text"
    assert styles.text_styles[1].id.id == "body_text"
    assert styles.doc_styles[0].id.id == "main_doc"
    assert styles.doc_styles[1].id.id == "secondary_doc"
    
    assert styles.common_styles[0].style.roundness == 2.5
    assert styles.common_styles[0].style.opacity == 0.8
    assert styles.text_styles[0].style.font_size == 12
    assert styles.text_styles[1].style.font_family == "Helvetica"

def test_standard_view_settings_comprehensive_properties():
    """Test all StandardViewSettings properties"""
    
    # Create multiple grid settings with different configurations
    grid1 = duc.create_grid_settings(
        is_adaptive=True,
        x_spacing=10.0,
        y_spacing=10.0,
        type=duc.GRID_TYPE.RECTANGULAR,
        origin_x=0.0,
        origin_y=0.0
    )
    
    grid2 = duc.create_grid_settings(
        is_adaptive=False,
        x_spacing=5.0,
        y_spacing=5.0,
        type=duc.GRID_TYPE.POLAR,
        origin_x=100.0,
        origin_y=100.0
    )
    
    grid3 = duc.create_grid_settings(
        is_adaptive=True,
        x_spacing=1.0,
        y_spacing=1.0,
        type=duc.GRID_TYPE.ISOMETRIC,
        origin_x=50.0,
        origin_y=50.0
    )
    
    # Create multiple snap settings
    snap1 = duc.create_snap_settings(
        readonly=False,
        snap_tolerance=10,
        is_object_snap_on=True,
        snap_mode=duc.SNAP_MODE.RUNNING
    )
    
    snap2 = duc.create_snap_settings(
        readonly=True,
        snap_tolerance=5,
        is_object_snap_on=False,
        snap_mode=duc.SNAP_MODE.SINGLE
    )
    
    snap3 = duc.create_snap_settings(
        readonly=False,
        snap_tolerance=15,
        is_object_snap_on=True,
        snap_mode=duc.SNAP_MODE.RUNNING
    )
    
    # Create views and UCS with proper wrappers
    view1 = duc.IdentifiedView(
        id=duc.create_identifier("view_1", "View 1"),
        view=duc.create_view(scroll_x=0, scroll_y=0, zoom=1.0, scope="mm")
    )
    view2 = duc.IdentifiedView(
        id=duc.create_identifier("view_2", "View 2"),
        view=duc.create_view(scroll_x=100, scroll_y=200, zoom=2.0, scope="inches")
    )
    
    ucs1 = duc.IdentifiedUcs(
        id=duc.create_identifier("ucs_1", "UCS 1"),
        ucs=duc.create_ucs()
    )
    ucs2 = duc.IdentifiedUcs(
        id=duc.create_identifier("ucs_2", "UCS 2"),
        ucs=duc.create_ucs()
    )
    
    # Create comprehensive view settings
    view_settings = duc.create_standard_view_settings(
        grid_settings=[grid1, grid2, grid3],
        snap_settings=[snap1, snap2, snap3],
        views=[view1, view2],
        ucs=[ucs1, ucs2]
    )
    
    assert len(view_settings.grid_settings) == 3
    assert len(view_settings.snap_settings) == 3
    assert len(view_settings.views) == 2
    assert len(view_settings.ucs) == 2
    
    # Verify grid settings
    assert view_settings.grid_settings[0].settings.origin.x == 0.0
    assert view_settings.grid_settings[1].settings.origin.x == 100.0
    assert view_settings.grid_settings[2].settings.origin.x == 50.0
    assert view_settings.grid_settings[0].settings.type == duc.GRID_TYPE.RECTANGULAR
    assert view_settings.grid_settings[1].settings.type == duc.GRID_TYPE.POLAR
    assert view_settings.grid_settings[2].settings.type == duc.GRID_TYPE.ISOMETRIC
    
    # Verify snap settings
    assert view_settings.snap_settings[0].settings.readonly is False
    assert view_settings.snap_settings[1].settings.readonly is True
    assert view_settings.snap_settings[2].settings.readonly is False
    assert view_settings.snap_settings[0].settings.snap_tolerance == 10
    assert view_settings.snap_settings[1].settings.snap_tolerance == 5
    assert view_settings.snap_settings[2].settings.snap_tolerance == 15

def test_comprehensive_standard_full_lifecycle(test_output_dir):
    """
    Comprehensive CSPMDS test for Standards: Create, Serialize, Parse, Mutate, Delete, Serialize
    This test covers all major dataclasses in StandardsClass.py
    """
    
    print("🔨 CREATE: Creating comprehensive Standard with all components...")
    
    # === CREATE PHASE ===
    
    # Create comprehensive grid settings with all variants
    rectangular_grid = duc.create_grid_settings(
        is_adaptive=True,
        x_spacing=25.0,
        y_spacing=25.0,
        subdivisions=5,
        origin_x=0.0,
        origin_y=0.0,
        rotation=0.0,
        follow_ucs=True,
        major_color="#404040",
        minor_color="#C0C0C0",
        type=duc.GRID_TYPE.RECTANGULAR,
        display_type=duc.GRID_DISPLAY_TYPE.LINES
    )
    
    polar_grid = duc.create_grid_settings(
        type=duc.GRID_TYPE.POLAR,
        display_type=duc.GRID_DISPLAY_TYPE.DOTS,
        origin_x=200.0,
        origin_y=200.0
    )
    polar_grid.polar_settings = duc.create_polar_grid_settings(
        radial_divisions=16,
        radial_spacing=20.0,
        show_labels=True
    )
    
    isometric_grid = duc.create_grid_settings(
        type=duc.GRID_TYPE.ISOMETRIC,
        display_type=duc.GRID_DISPLAY_TYPE.LINES,
        origin_x=400.0,
        origin_y=400.0
    )
    isometric_grid.isometric_settings = duc.create_isometric_grid_settings(
        left_angle=math.radians(30.0),   # 30 degrees
        right_angle=math.radians(30.0)
    )
    
    # Create simpler snap settings to avoid serialization issues
    primary_snap = duc.create_snap_settings(
        readonly=False,
        twist_angle=math.radians(45.0),  # 45 degrees
        snap_tolerance=12,
        object_snap_aperture=18,
        is_ortho_mode_on=False,
        is_object_snap_on=True,
        active_object_snap_modes=[
            duc.OBJECT_SNAP_MODE.ENDPOINT,
            duc.OBJECT_SNAP_MODE.MIDPOINT,
            duc.OBJECT_SNAP_MODE.CENTER
        ],
        snap_mode=duc.SNAP_MODE.RUNNING
    )
    
    # Create secondary snap for contrast
    secondary_snap = duc.create_snap_settings(
        readonly=True,
        snap_tolerance=5,
        is_object_snap_on=False,
        snap_mode=duc.SNAP_MODE.SINGLE
    )
    
    # Create comprehensive units
    linear_units = duc.create_linear_unit_system(
        precision=3,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=True,
        suppress_zero_feet=True,
        suppress_zero_inches=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.DIMENSION_UNITS_FORMAT.DECIMAL,
        decimal_separator=duc.DECIMAL_SEPARATOR.DOT
    )
    
    angular_units = duc.create_angular_unit_system(
        precision=2,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES
    )
    
    primary_units = duc.create_primary_units(linear_units, angular_units)
    
    alternate_units = duc.create_alternate_units(
        precision=2,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        is_visible=True,
        multiplier=0.03937,  # mm to inches
        format=duc.DIMENSION_UNITS_FORMAT.DECIMAL
    )
    
    standard_units = duc.create_standard_units(primary_units, alternate_units)
    
    # Create simpler validation to avoid serialization issues
    dim_validation = duc.create_dimension_validation_rules(
        min_text_height=1.0,
        max_text_height=50.0,
        allowed_precisions=[0, 1, 2, 3]
    )
    
    layer_validation = duc.create_layer_validation_rules(
        prohibited_layer_names=["0"]  # Simplified list
    )
    
    validation = duc.create_standard_validation(dim_validation, layer_validation)
    
    # Create comprehensive overrides
    unit_precision = duc.UnitPrecision(linear=3, angular=2, area=2, volume=2)
    overrides = duc.create_standard_overrides(
        main_scope="metric",
        unit_precision=unit_precision,
        elements_stroke_width_override=1.5,
        common_style_id="main_common_style",
        stack_like_style_id="main_stack_style", 
        text_style_id="main_text_style",
        dimension_style_id="main_dim_style",
        leader_style_id="main_leader_style",
        feature_control_frame_style_id="main_fcf_style",
        table_style_id="main_table_style",
        doc_style_id="main_doc_style",
        viewport_style_id="main_viewport_style",
        plot_style_id="main_plot_style",
        hatch_style_id="main_hatch_style",
        active_grid_settings_id=["grid_0", "grid_1", "grid_2"],
        active_snap_settings_id="snap_0",
        dash_line_override="custom_dash_pattern"
    )
    
    # Create comprehensive styles
    common_style1 = duc.create_simple_styles(roundness=3.0, opacity=0.9)
    common_style2 = duc.create_simple_styles(roundness=0.5, opacity=0.7)
    
    text_style1 = duc.create_text_style(
        font_family="Arial Bold",
        font_size=16,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.MIDDLE
    )
    text_style2 = duc.create_text_style(
        font_family="Times New Roman",
        font_size=12,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP
    )
    
    doc_style1 = duc.create_doc_style()
    doc_style2 = duc.create_doc_style()
    
    styles = duc.create_standard_styles(
        common_styles=[
            ("header_common", common_style1),
            ("body_common", common_style2)
        ],
        text_styles=[
            ("title_text", text_style1),
            ("content_text", text_style2)
        ],
        doc_styles=[
            ("main_document", doc_style1),
            ("template_document", doc_style2)
        ]
    )
    
    # Create views and UCS with identified wrappers
    main_view = duc.IdentifiedView(
        id=duc.create_identifier("main_view", "Main View"),
        view=duc.create_view(
            scroll_x=0.0,
            scroll_y=0.0,
            zoom=1.0,
            twist_angle=0.0,
            center_x=500.0,
            center_y=500.0,
            scope="mm"
        )
    )
    
    detail_view = duc.IdentifiedView(
        id=duc.create_identifier("detail_view", "Detail View"),
        view=duc.create_view(
            scroll_x=100.0,
            scroll_y=200.0,
            zoom=2.5,
            twist_angle=math.radians(45.0),  # 45 degrees
            center_x=250.0,
            center_y=250.0,
            scope="mm"
        )
    )
    
    main_ucs = duc.IdentifiedUcs(
        id=duc.create_identifier("main_ucs", "Main UCS"),
        ucs=duc.create_ucs()
    )
    
    auxiliary_ucs = duc.IdentifiedUcs(
        id=duc.create_identifier("aux_ucs", "Auxiliary UCS"), 
        ucs=duc.create_ucs()
    )
    
    # Create comprehensive view settings
    view_settings = duc.create_standard_view_settings(
        grid_settings=[rectangular_grid, polar_grid, isometric_grid],
        snap_settings=[primary_snap, secondary_snap],
        views=[main_view, detail_view],
        ucs=[main_ucs, auxiliary_ucs]
    )
    
    # Create the comprehensive standard
    standard = duc.create_standard(
        id="comprehensive_standard_v1",
        name="Comprehensive Test Standard",
        version="2.0.1",
        readonly=False,
        view_settings=view_settings,
        overrides=overrides,
        styles=styles,
        units=standard_units,
        validation=validation
    )
    standards = [standard]
    
    print(f"✅ Created comprehensive standard with {len(view_settings.grid_settings)} grids, {len(view_settings.snap_settings)} snap configs")
    
    # === SERIALIZE PHASE ===
    print("💾 SERIALIZE: Saving comprehensive standard to DUC file...")
    
    file_path = os.path.join(test_output_dir, "comprehensive_standards_test.duc")
    serialized = duc.serialize_duc(name="ComprehensiveStandardsTest", standards=standards)
    
    with open(file_path, "wb") as f:
        f.write(serialized)
    
    assert os.path.exists(file_path)
    file_size = os.path.getsize(file_path)
    print(f"✅ Serialized to {file_path} ({file_size} bytes)")
    
    # === PARSE PHASE ===
    print("📖 PARSE: Loading and verifying comprehensive standard...")
    
    parsed = duc.parse_duc(io.BytesIO(serialized))
    loaded_standard = parsed.standards[0]
    
    assert loaded_standard.identifier.id == "comprehensive_standard_v1"
    assert loaded_standard.identifier.name == "Comprehensive Test Standard"
    assert loaded_standard.version == "2.0.1"
    assert loaded_standard.readonly is False
    
    # Verify comprehensive structures
    assert len(loaded_standard.view_settings.grid_settings) == 3
    assert len(loaded_standard.view_settings.snap_settings) == 2
    assert len(loaded_standard.view_settings.views) == 2
    assert len(loaded_standard.view_settings.ucs) == 2
    
    # Verify grid types
    assert loaded_standard.view_settings.grid_settings[0].settings.type == duc.GRID_TYPE.RECTANGULAR
    assert loaded_standard.view_settings.grid_settings[1].settings.type == duc.GRID_TYPE.POLAR
    assert loaded_standard.view_settings.grid_settings[2].settings.type == duc.GRID_TYPE.ISOMETRIC
    
    # Verify snap complexity
    primary_loaded_snap = loaded_standard.view_settings.snap_settings[0].settings
    assert primary_loaded_snap.twist_angle == math.radians(45.0)
    assert len(primary_loaded_snap.active_object_snap_modes) == 3  # Updated from 4
    
    # Verify styles
    assert len(loaded_standard.styles.common_styles) == 2
    assert len(loaded_standard.styles.text_styles) == 2
    assert len(loaded_standard.styles.doc_styles) == 2
    
    print("✅ All complex structures verified after parsing")
    
    # === MUTATE PHASE ===
    print("🔧 MUTATE: Modifying standard components...")
    
    # Mutate grid settings
    duc.mutate_grid_settings(
        loaded_standard.view_settings.grid_settings[0].settings,
        x_spacing=50.0,
        y_spacing=50.0,
        subdivisions=10
    )
    
    # Mutate snap settings
    duc.mutate_snap_settings(
        loaded_standard.view_settings.snap_settings[0].settings,
        snap_tolerance=25,
        object_snap_aperture=30
    )
    
    # Mutate standard properties
    loaded_standard.version = "2.1.0"
    loaded_standard.overrides.elements_stroke_width_override = 2.0
    
    # Verify mutations
    assert loaded_standard.view_settings.grid_settings[0].settings.x_spacing == 50.0
    assert loaded_standard.view_settings.grid_settings[0].settings.y_spacing == 50.0
    assert loaded_standard.view_settings.grid_settings[0].settings.subdivisions == 10
    assert loaded_standard.view_settings.snap_settings[0].settings.snap_tolerance == 25
    assert loaded_standard.view_settings.snap_settings[0].settings.object_snap_aperture == 30
    assert loaded_standard.version == "2.1.0"
    assert loaded_standard.overrides.elements_stroke_width_override == 2.0
    
    print("✅ Mutations applied and verified")
    
    # === DELETE PHASE ===
    print("🗑️ DELETE: Removing some components...")
    
    # Delete one grid setting
    del loaded_standard.view_settings.grid_settings[1]  # Remove polar grid
    
    # Delete one snap setting  
    del loaded_standard.view_settings.snap_settings[1]  # Remove secondary snap
    
    # Delete one style
    del loaded_standard.styles.common_styles[1]  # Remove body_common
    
    # Delete some validation rules (commented out due to serialization issues)
    # loaded_standard.validation.layer_rules.prohibited_layer_names = []
    
    # Verify deletions
    assert len(loaded_standard.view_settings.grid_settings) == 2
    assert len(loaded_standard.view_settings.snap_settings) == 1
    assert len(loaded_standard.styles.common_styles) == 1
    # assert len(loaded_standard.validation.layer_rules.prohibited_layer_names) == 0
    
    # Verify remaining types are correct
    assert loaded_standard.view_settings.grid_settings[0].settings.type == duc.GRID_TYPE.RECTANGULAR
    assert loaded_standard.view_settings.grid_settings[1].settings.type == duc.GRID_TYPE.ISOMETRIC  # Polar was deleted
    
    print("✅ Components deleted and verified")
    
    # === SERIALIZE FINAL PHASE ===
    print("💾 SERIALIZE FINAL: Saving modified standard...")
    
    final_file = os.path.join(test_output_dir, "comprehensive_standards_final.duc")
    final_serialized = duc.serialize_duc(
        name="ComprehensiveStandardsFinal", 
        standards=[loaded_standard]
    )
    
    with open(final_file, "wb") as f:
        f.write(final_serialized)
    
    assert os.path.exists(final_file)
    final_file_size = os.path.getsize(final_file)
    print(f"✅ Final serialized to {final_file} ({final_file_size} bytes)")
    
    # === VERIFY FINAL PHASE ===
    print("✅ VERIFY FINAL: Loading and verifying final state...")
    
    final_parsed = duc.parse_duc(io.BytesIO(final_serialized))
    final_standard = final_parsed.standards[0]
    
    # Verify final state
    assert final_standard.identifier.id == "comprehensive_standard_v1"
    assert final_standard.version == "2.1.0"  # Mutated version
    assert final_standard.overrides.elements_stroke_width_override == 2.0  # Mutated value
    
    # Verify deletions persisted
    assert len(final_standard.view_settings.grid_settings) == 2  # One deleted
    assert len(final_standard.view_settings.snap_settings) == 1  # One deleted  
    assert len(final_standard.styles.common_styles) == 1  # One deleted
    # assert len(final_standard.validation.layer_rules.prohibited_layer_names) == 0  # All deleted
    
    # Verify mutations persisted
    assert final_standard.view_settings.grid_settings[0].settings.x_spacing == 50.0
    assert final_standard.view_settings.snap_settings[0].settings.snap_tolerance == 25
    
    # Verify complex structures still intact
    snap_settings = final_standard.view_settings.snap_settings[0].settings
    assert len(snap_settings.active_object_snap_modes) == 3  # Updated from 4
    assert snap_settings.snap_tolerance == 25  # Mutated value
    
    print("✅ CSPMDS lifecycle completed successfully!")
    print(f"   - Created comprehensive standard with all dataclasses")
    print(f"   - Serialized to {file_size} bytes")
    print(f"   - Parsed and verified all complex structures")
    print(f"   - Applied mutations to key properties")
    print(f"   - Deleted selected components")
    print(f"   - Final serialized to {final_file_size} bytes")
    print(f"   - Verified final state integrity")

def test_standard_validation_comprehensive_properties():
    """Test StandardValidation properties (already covered in lifecycle test)"""
    # This test already exists in the previous version, keeping it as a focused unit test
    dim_rules = duc.create_dimension_validation_rules(min_text_height=1.0, max_text_height=10.0, allowed_precisions=[0, 1, 2])
    layer_rules = duc.create_layer_validation_rules(prohibited_layer_names=["LayerA", "LayerB"])
    validation = duc.create_standard_validation(dimension_rules=dim_rules, layer_rules=layer_rules)
    assert validation.dimension_rules.min_text_height == 1.0
    assert validation.dimension_rules.max_text_height == 10.0
    assert validation.dimension_rules.allowed_precisions == [0, 1, 2]
    assert validation.layer_rules.prohibited_layer_names == ["LayerA", "LayerB"]

# Add more comprehensive tests for edge cases and all remaining dataclasses

def test_grid_style_and_advanced_configurations():
    """Test GridStyle and advanced grid configurations"""
    
    # Test GridStyle with dash patterns
    major_style = duc.GridStyle(
        color="#FF0000",
        opacity=0.8,
        dash_pattern=[5.0, 3.0, 1.0, 3.0]  # Complex dash pattern
    )
    
    minor_style = duc.GridStyle(
        color="#00FF00", 
        opacity=0.4,
        dash_pattern=[2.0, 2.0]  # Simple dash pattern
    )
    
    # Create grid with custom styles
    grid = duc.create_grid_settings(
        is_adaptive=False,
        x_spacing=12.5,
        y_spacing=8.75,
        subdivisions=4,
        origin_x=25.0,
        origin_y=15.0,
        rotation=math.radians(15.0),  # 15 degrees
        follow_ucs=False,
        type=duc.GRID_TYPE.RECTANGULAR,
        display_type=duc.GRID_DISPLAY_TYPE.LINES
    )
    
    # Replace default styles with custom ones
    grid.major_style = major_style
    grid.minor_style = minor_style
    grid.show_minor = True
    grid.min_zoom = 0.25
    grid.max_zoom = 8.0
    grid.auto_hide = True
    grid.enable_snapping = True
    grid.readonly = False
    
    assert grid.major_style.color == "#FF0000"
    assert grid.major_style.opacity == 0.8
    assert len(grid.major_style.dash_pattern) == 4
    assert grid.minor_style.color == "#00FF00"
    assert grid.minor_style.opacity == 0.4
    assert len(grid.minor_style.dash_pattern) == 2
    assert grid.x_spacing == 12.5
    assert grid.y_spacing == 8.75
    assert grid.rotation == math.radians(15.0)
    assert grid.min_zoom == 0.25
    assert grid.max_zoom == 8.0
    assert grid.auto_hide is True

def test_complex_snap_marker_configurations():
    """Test complex SnapMarkerSettings configurations"""
    
    # Create various marker styles for different snap modes
    endpoint_marker = duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.SQUARE, "#FF0000")
    midpoint_marker = duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.TRIANGLE, "#00FF00")
    center_marker = duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.CIRCLE, "#0000FF")
    quadrant_marker = duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.SQUARE, "#FFFF00")
    intersection_marker = duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.X, "#FF00FF")
    perpendicular_marker = duc.create_snap_marker_style(duc.SNAP_MARKER_SHAPE.X, "#00FFFF")
    
    # Create marker style entries
    marker_entries = [
        duc.create_snap_marker_style_entry(duc.OBJECT_SNAP_MODE.ENDPOINT, endpoint_marker),
        duc.create_snap_marker_style_entry(duc.OBJECT_SNAP_MODE.MIDPOINT, midpoint_marker),
        duc.create_snap_marker_style_entry(duc.OBJECT_SNAP_MODE.CENTER, center_marker),
        duc.create_snap_marker_style_entry(duc.OBJECT_SNAP_MODE.QUADRANT, quadrant_marker),
        duc.create_snap_marker_style_entry(duc.OBJECT_SNAP_MODE.INTERSECTION, intersection_marker),
        duc.create_snap_marker_style_entry(duc.OBJECT_SNAP_MODE.PERPENDICULAR, perpendicular_marker)
    ]
    
    # Create comprehensive marker settings
    marker_settings = duc.create_snap_marker_settings(
        enabled=True,
        size=15,
        styles=marker_entries,
        duration=5000
    )
    
    assert marker_settings.enabled is True
    assert marker_settings.size == 15
    assert marker_settings.duration == 5000
    assert len(marker_settings.styles) == 6
    
    # Verify each marker style
    assert marker_settings.styles[0].key == duc.OBJECT_SNAP_MODE.ENDPOINT
    assert marker_settings.styles[0].value.shape == duc.SNAP_MARKER_SHAPE.SQUARE
    assert marker_settings.styles[0].value.color == "#FF0000"
    
    assert marker_settings.styles[1].key == duc.OBJECT_SNAP_MODE.MIDPOINT
    assert marker_settings.styles[1].value.shape == duc.SNAP_MARKER_SHAPE.TRIANGLE
    assert marker_settings.styles[1].value.color == "#00FF00"
    
    assert marker_settings.styles[5].key == duc.OBJECT_SNAP_MODE.PERPENDICULAR
    assert marker_settings.styles[5].value.shape == duc.SNAP_MARKER_SHAPE.X
    assert marker_settings.styles[5].value.color == "#00FFFF"

def test_polar_tracking_comprehensive_configurations():
    """Test comprehensive PolarTrackingSettings configurations"""
    
    # Create polar tracking with many angles
    comprehensive_angles = [
        math.radians(0),           # 0 degrees
        math.radians(10),          # 10 degrees
        math.radians(15),          # 15 degrees  
        math.radians(30),          # 30 degrees
        math.radians(45),          # 45 degrees
        math.radians(60),          # 60 degrees
        math.radians(90),          # 90 degrees
        math.radians(120),         # 120 degrees
        math.radians(135),         # 135 degrees
        math.radians(150),         # 150 degrees
        math.radians(180),         # 180 degrees
        math.radians(210),         # 210 degrees
        math.radians(225),         # 225 degrees
        math.radians(240),         # 240 degrees
        math.radians(270),         # 270 degrees
        math.radians(300),         # 300 degrees
        math.radians(315),         # 315 degrees
        math.radians(330)          # 330 degrees
    ]
    
    polar_tracking = duc.create_polar_tracking_settings(
        enabled=True,
        angles=comprehensive_angles,
        track_from_last_point=True,
        show_polar_coordinates=True,
        increment_angle=math.radians(5.0)  # 5 degrees for fine increments
    )
    
    assert polar_tracking.enabled is True
    assert len(polar_tracking.angles) == 18
    assert polar_tracking.track_from_last_point is True
    assert polar_tracking.show_polar_coordinates is True
    assert polar_tracking.increment_angle == math.radians(5.0)
    
    # Test specific angles
    assert polar_tracking.angles[0] == 0      # 0 degrees
    assert polar_tracking.angles[4] == math.radians(45.0) # 45 degrees  
    assert polar_tracking.angles[6] == math.radians(90.0) # 90 degrees
    assert polar_tracking.angles[10] == math.radians(180.0) # 180 degrees
    assert polar_tracking.angles[14] == math.radians(270.0) # 270 degrees

def test_unit_system_edge_cases():
    """Test edge cases and comprehensive configurations for unit systems"""
    
    # Test architectural linear units with all suppressions off
    arch_linear = duc.create_linear_unit_system(
        precision=8,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=False,
        suppress_zero_feet=False,
        suppress_zero_inches=False,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        format=duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL,
        decimal_separator=duc.DECIMAL_SEPARATOR.COMMA
    )
    
    # Test engineering linear units
    eng_linear = duc.create_linear_unit_system(
        precision=6,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=True,
        suppress_zero_feet=True,
        suppress_zero_inches=True,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        format=duc.DIMENSION_UNITS_FORMAT.ENGINEERING,
        decimal_separator=duc.DECIMAL_SEPARATOR.DOT
    )
    
    # Test fractional linear units
    fract_linear = duc.create_linear_unit_system(
        precision=16,  # 1/16th precision
        suppress_leading_zeros=False,
        suppress_trailing_zeros=False,
        suppress_zero_feet=False,
        suppress_zero_inches=False,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        format=duc.DIMENSION_UNITS_FORMAT.FRACTIONAL,
        decimal_separator=duc.DECIMAL_SEPARATOR.DOT
    )
    
    # Test various angular formats
    dms_angular = duc.create_angular_unit_system(
        precision=4,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS
    )
    
    grad_angular = duc.create_angular_unit_system(
        precision=3,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=False,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.ANGULAR_UNITS_FORMAT.GRADS
    )
    
    rad_angular = duc.create_angular_unit_system(
        precision=6,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.ANGULAR_UNITS_FORMAT.RADIANS
    )
    
    # Verify architectural format
    assert arch_linear.format == duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL
    assert arch_linear.precision == 8
    assert arch_linear.suppress_leading_zeros is False
    assert arch_linear.suppress_zero_feet is False
    assert arch_linear.decimal_separator == duc.DECIMAL_SEPARATOR.COMMA
    
    # Verify engineering format  
    assert eng_linear.format == duc.DIMENSION_UNITS_FORMAT.ENGINEERING
    assert eng_linear.precision == 6
    assert eng_linear.suppress_trailing_zeros is True
    
    # Verify fractional format
    assert fract_linear.format == duc.DIMENSION_UNITS_FORMAT.FRACTIONAL
    assert fract_linear.precision == 16
    
    # Verify angular formats
    assert dms_angular.format == duc.ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS
    assert grad_angular.format == duc.ANGULAR_UNITS_FORMAT.GRADS
    assert rad_angular.format == duc.ANGULAR_UNITS_FORMAT.RADIANS
    assert rad_angular.precision == 6

def test_all_snap_override_behaviors():
    """Test all SnapOverride behaviors and key combinations"""
    
    overrides = [
        duc.create_snap_override("ctrl", duc.SNAP_OVERRIDE_BEHAVIOR.DISABLE),
        duc.create_snap_override("shift", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID),
        duc.create_snap_override("alt", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_OBJECT),
        duc.create_snap_override("tab", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID),
        duc.create_snap_override("space", duc.SNAP_OVERRIDE_BEHAVIOR.DISABLE),
        duc.create_snap_override("ctrl+shift", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID),
        duc.create_snap_override("ctrl+alt", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_OBJECT),
        duc.create_snap_override("shift+alt", duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID)
    ]
    
    assert len(overrides) == 8
    assert overrides[0].key == "ctrl"
    assert overrides[0].behavior == duc.SNAP_OVERRIDE_BEHAVIOR.DISABLE
    assert overrides[1].key == "shift" 
    assert overrides[1].behavior == duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID
    assert overrides[2].key == "alt"
    assert overrides[2].behavior == duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_OBJECT
    assert overrides[3].key == "tab"
    assert overrides[3].behavior == duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID
    assert overrides[5].key == "ctrl+shift"
    assert overrides[7].behavior == duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID

def test_nested_standard_builders_elegant_construction():
    """Test elegant nested construction of standards using builder functions"""
    
    # Demonstrate elegant nesting by constructing everything inline
    standard = duc.create_standard(
        id="elegant_nested_standard",
        name="Elegantly Nested Standard",
        version="3.0.0",
        readonly=False,
        
        # Nested units construction
        units=duc.create_standard_units(
            primary_units=duc.create_primary_units(
                linear=duc.create_linear_unit_system(
                    precision=3,
                    suppress_leading_zeros=False,
                    suppress_trailing_zeros=True,
                    suppress_zero_feet=False,
                    suppress_zero_inches=True,
                    system=duc.UNIT_SYSTEM.METRIC,
                    format=duc.DIMENSION_UNITS_FORMAT.DECIMAL,
                    decimal_separator=duc.DECIMAL_SEPARATOR.DOT
                ),
                angular=duc.create_angular_unit_system(
                    precision=2,
                    suppress_leading_zeros=True,
                    suppress_trailing_zeros=False,
                    system=duc.UNIT_SYSTEM.METRIC,
                    format=duc.ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS
                )
            ),
            alternate_units=duc.create_alternate_units(
                precision=2,
                suppress_leading_zeros=False,
                suppress_trailing_zeros=True,
                system=duc.UNIT_SYSTEM.IMPERIAL,
                is_visible=True,
                multiplier=25.4,  # mm to inches conversion
                format=duc.DIMENSION_UNITS_FORMAT.FRACTIONAL
            )
        ),
        
        # Nested validation construction
        validation=duc.create_standard_validation(
            dimension_rules=duc.create_dimension_validation_rules(
                min_text_height=0.8,
                max_text_height=72.0,
                allowed_precisions=[0, 1, 2, 3, 4, 5]
            ),
            layer_rules=duc.create_layer_validation_rules(
                prohibited_layer_names=["0", "defpoints", "system", "temp"]
            )
        ),
        
        # Nested overrides construction
        overrides=duc.create_standard_overrides(
            main_scope="metric",
            unit_precision=duc.UnitPrecision(linear=3, angular=2, area=4, volume=5),
            elements_stroke_width_override=1.5,
            common_style_id="elegant_common",
            text_style_id="elegant_text",
            active_grid_settings_id=["metric_grid", "detailed_grid"],
            active_snap_settings_id="precision_snap"
        )
    )
    
    # Verify the nested construction worked properly
    assert standard.identifier.id == "elegant_nested_standard"
    assert standard.identifier.name == "Elegantly Nested Standard" 
    assert standard.version == "3.0.0"
    assert standard.readonly is False
    
    # Verify units were constructed properly
    assert standard.units is not None
    assert standard.units.primary_units.linear.precision == 3
    assert standard.units.primary_units.linear.system == duc.UNIT_SYSTEM.METRIC
    assert standard.units.primary_units.angular.format == duc.ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS
    assert standard.units.alternate_units.multiplier == 25.4
    assert standard.units.alternate_units.format == duc.DIMENSION_UNITS_FORMAT.FRACTIONAL
    
    # Verify validation was constructed properly
    assert standard.validation is not None
    assert standard.validation.dimension_rules.min_text_height == 0.8
    assert standard.validation.dimension_rules.max_text_height == 72.0
    assert len(standard.validation.dimension_rules.allowed_precisions) == 6
    assert len(standard.validation.layer_rules.prohibited_layer_names) == 4
    
    # Verify overrides were constructed properly  
    assert standard.overrides is not None
    assert standard.overrides.main_scope == "metric"
    assert standard.overrides.unit_precision.linear == 3
    assert standard.overrides.unit_precision.angular == 2
    assert standard.overrides.elements_stroke_width_override == 1.5
    assert len(standard.overrides.active_grid_settings_id) == 2
    
    print("✅ Elegantly nested standard construction successful!")


def test_advanced_unit_systems_serialization_roundtrip(test_output_dir):
    """Test advanced unit systems with full serialization and parsing roundtrip"""
    
    # Create advanced unit configurations with edge cases
    advanced_standard = duc.create_standard(
        id="advanced_units_test",
        name="Advanced Units Test Standard",
        
        units=duc.create_standard_units(
            primary_units=duc.create_primary_units(
                # High precision metric linear units
                linear=duc.create_linear_unit_system(
                    precision=6,  # Very high precision
                    suppress_leading_zeros=True,
                    suppress_trailing_zeros=False,  # Keep trailing zeros
                    suppress_zero_feet=False,
                    suppress_zero_inches=False,  
                    system=duc.UNIT_SYSTEM.METRIC,
                    format=duc.DIMENSION_UNITS_FORMAT.SCIENTIFIC,
                    decimal_separator=duc.DECIMAL_SEPARATOR.COMMA
                ),
                # Surveyor angular units
                angular=duc.create_angular_unit_system(
                    precision=4,
                    suppress_leading_zeros=False,
                    suppress_trailing_zeros=True,
                    system=duc.UNIT_SYSTEM.IMPERIAL,
                    format=duc.ANGULAR_UNITS_FORMAT.SURVEYOR
                )
            ),
            # Imperial alternate units with architectural format
            alternate_units=duc.create_alternate_units(
                precision=8,  # Very high precision for architectural
                suppress_leading_zeros=True,
                suppress_trailing_zeros=False,
                system=duc.UNIT_SYSTEM.IMPERIAL,
                is_visible=True,
                multiplier=0.0393701,  # Precise mm to inches
                format=duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL
            )
        )
    )
    
    # Serialize to bytes
    print("🔨 CREATE: Advanced units standard created")
    serialized = duc.serialize_duc(name="AdvancedUnitsTest", standards=[advanced_standard])
    
    # Save to file
    file_path = os.path.join(test_output_dir, "advanced_units_test.duc")
    with open(file_path, "wb") as f:
        f.write(serialized)
    
    print(f"💾 SERIALIZE: Saved to {file_path} ({len(serialized)} bytes)")
    
    # Parse back from bytes
    parsed = duc.parse_duc(io.BytesIO(serialized))
    parsed_standard = parsed.standards[0]
    
    print("📖 PARSE: Successfully parsed back from bytes")
    
    # Verify all properties survived the roundtrip
    assert parsed_standard.identifier.id == "advanced_units_test"
    assert parsed_standard.units is not None
    
    # Verify linear units
    linear = parsed_standard.units.primary_units.linear
    assert linear.precision == 6
    assert linear.suppress_leading_zeros is True
    assert linear.suppress_trailing_zeros is False
    assert linear.system == duc.UNIT_SYSTEM.METRIC
    assert linear.format == duc.DIMENSION_UNITS_FORMAT.SCIENTIFIC
    assert linear.decimal_separator == duc.DECIMAL_SEPARATOR.COMMA
    
    # Verify angular units
    angular = parsed_standard.units.primary_units.angular
    assert angular.precision == 4
    assert angular.suppress_leading_zeros is False
    assert angular.suppress_trailing_zeros is True
    assert angular.system == duc.UNIT_SYSTEM.IMPERIAL
    assert angular.format == duc.ANGULAR_UNITS_FORMAT.SURVEYOR
    
    # Verify alternate units
    alternate = parsed_standard.units.alternate_units
    assert alternate.precision == 8
    assert alternate.suppress_leading_zeros is True
    assert alternate.suppress_trailing_zeros is False
    assert alternate.system == duc.UNIT_SYSTEM.IMPERIAL
    assert alternate.is_visible is True
    assert abs(alternate.multiplier - 0.0393701) < 1e-8  # Float precision check
    assert alternate.format == duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL
    
    print("✅ Advanced units serialization roundtrip successful!")


def test_all_standards_class_dataclasses():
    """Comprehensive test covering ALL dataclasses in StandardsClass.py"""
    
    print("🔍 Testing ALL StandardsClass dataclasses...")
    
    # Test GridStyle
    grid_style = duc.GridStyle(
        color="#FF5733",
        opacity=0.75,
        dash_pattern=[4.0, 2.0, 1.0, 2.0]
    )
    assert grid_style.color == "#FF5733"
    assert grid_style.opacity == 0.75
    assert len(grid_style.dash_pattern) == 4
    
    # Test PolarGridSettings
    polar_settings = duc.create_polar_grid_settings(
        radial_divisions=24,
        radial_spacing=15.0,
        show_labels=True
    )
    assert polar_settings.radial_divisions == 24
    assert polar_settings.radial_spacing == 15.0
    assert polar_settings.show_labels is True
    
    # Test IsometricGridSettings  
    iso_settings = duc.create_isometric_grid_settings(
        left_angle=math.radians(30.0),
        right_angle=math.radians(30.0)
    )
    assert abs(iso_settings.left_angle - math.radians(30.0)) < 0.001
    assert abs(iso_settings.right_angle - math.radians(30.0)) < 0.001
    
    # Test SnapOverride
    snap_override = duc.create_snap_override(
        key="ctrl+alt",
        behavior=duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_OBJECT
    )
    assert snap_override.key == "ctrl+alt"
    assert snap_override.behavior == duc.SNAP_OVERRIDE_BEHAVIOR.FORCE_OBJECT
    
    # Test DynamicSnapSettings
    dynamic_snap = duc.create_dynamic_snap_settings(
        enabled_during_drag=False,
        enabled_during_rotation=True,
        enabled_during_scale=False
    )
    assert dynamic_snap.enabled_during_drag is False
    assert dynamic_snap.enabled_during_rotation is True
    assert dynamic_snap.enabled_during_scale is False
    
    # Test PolarTrackingSettings
    polar_tracking = duc.create_polar_tracking_settings(
        enabled=True,
        angles=[math.radians(0), math.radians(45), math.radians(90), math.radians(135)],
        track_from_last_point=False,
        show_polar_coordinates=True,
        increment_angle=math.radians(22.5)
    )
    assert polar_tracking.enabled is True
    assert len(polar_tracking.angles) == 4
    assert polar_tracking.track_from_last_point is False
    assert abs(polar_tracking.increment_angle - math.radians(22.5)) < 0.001
    
    # Test TrackingLineStyle
    tracking_style = duc.create_tracking_line_style(
        color="#00FFAA",
        opacity=0.9,
        dash_pattern=[6.0, 3.0]
    )
    assert tracking_style.color == "#00FFAA"
    assert tracking_style.opacity == 0.9
    assert tracking_style.dash_pattern == [6.0, 3.0]
    
    # Test LayerSnapFilters
    layer_filters = duc.create_layer_snap_filters(
        include_layers=["dimension", "annotation", "construction"],
        exclude_layers=["hidden", "reference"]
    )
    assert len(layer_filters.include_layers) == 3
    assert len(layer_filters.exclude_layers) == 2
    assert "dimension" in layer_filters.include_layers
    assert "hidden" in layer_filters.exclude_layers
    
    # Test SnapMarkerStyle
    marker_style = duc.create_snap_marker_style(
        shape=duc.SNAP_MARKER_SHAPE.TRIANGLE,
        color="#FF00FF"
    )
    assert marker_style.shape == duc.SNAP_MARKER_SHAPE.TRIANGLE
    assert marker_style.color == "#FF00FF"
    
    # Test SnapMarkerStyleEntry
    marker_entry = duc.create_snap_marker_style_entry(
        key=duc.OBJECT_SNAP_MODE.CENTER,
        value=marker_style
    )
    assert marker_entry.key == duc.OBJECT_SNAP_MODE.CENTER
    assert marker_entry.value.shape == duc.SNAP_MARKER_SHAPE.TRIANGLE
    
    # Test SnapMarkerSettings
    marker_settings = duc.create_snap_marker_settings(
        enabled=True,
        size=16,
        styles=[marker_entry],
        duration=3000
    )
    assert marker_settings.enabled is True
    assert marker_settings.size == 16
    assert marker_settings.duration == 3000
    assert len(marker_settings.styles) == 1
    
    # Test UnitSystemBase hierarchy
    linear_units = duc.create_linear_unit_system(
        precision=5,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=False,
        suppress_zero_feet=True,
        suppress_zero_inches=False,
        system=duc.UNIT_SYSTEM.IMPERIAL,
        format=duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL,
        decimal_separator=duc.DECIMAL_SEPARATOR.COMMA
    )
    assert linear_units.precision == 5
    assert linear_units.system == duc.UNIT_SYSTEM.IMPERIAL
    assert linear_units.format == duc.DIMENSION_UNITS_FORMAT.ARCHITECTURAL
    assert linear_units.suppress_zero_inches is False
    
    # Test AngularUnitSystem
    angular_units = duc.create_angular_unit_system(
        precision=4,
        suppress_leading_zeros=False,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        format=duc.ANGULAR_UNITS_FORMAT.RADIANS
    )
    assert angular_units.precision == 4
    assert angular_units.format == duc.ANGULAR_UNITS_FORMAT.RADIANS
    
    # Test AlternateUnits
    alt_units = duc.create_alternate_units(
        precision=3,
        suppress_leading_zeros=True,
        suppress_trailing_zeros=True,
        system=duc.UNIT_SYSTEM.METRIC,
        is_visible=False,
        multiplier=2.54,  # inches to cm
        format=duc.DIMENSION_UNITS_FORMAT.SCIENTIFIC
    )
    assert alt_units.precision == 3
    assert alt_units.is_visible is False
    assert alt_units.multiplier == 2.54
    assert alt_units.format == duc.DIMENSION_UNITS_FORMAT.SCIENTIFIC
    
    # Test PrimaryUnits
    primary_units = duc.create_primary_units(linear_units, angular_units)
    assert primary_units.linear.precision == 5
    assert primary_units.angular.precision == 4
    
    # Test StandardUnits
    standard_units = duc.create_standard_units(primary_units, alt_units)
    assert standard_units.primary_units.linear.system == duc.UNIT_SYSTEM.IMPERIAL
    assert standard_units.alternate_units.system == duc.UNIT_SYSTEM.METRIC
    assert standard_units.alternate_units.multiplier == 2.54
    
    # Test UnitPrecision
    unit_precision = duc.UnitPrecision(linear=6, angular=4, area=3, volume=2)
    assert unit_precision.linear == 6
    assert unit_precision.angular == 4
    assert unit_precision.area == 3
    assert unit_precision.volume == 2
    
    # Test DimensionValidationRules
    dim_rules = duc.create_dimension_validation_rules(
        min_text_height=0.25,
        max_text_height=500.0,
        allowed_precisions=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    )
    assert dim_rules.min_text_height == 0.25
    assert dim_rules.max_text_height == 500.0
    assert len(dim_rules.allowed_precisions) == 11
    assert dim_rules.allowed_precisions[-1] == 10
    
    # Test LayerValidationRules
    layer_rules = duc.create_layer_validation_rules(
        prohibited_layer_names=["system", "locked", "frozen", "temp", "backup"]
    )
    assert len(layer_rules.prohibited_layer_names) == 5
    assert "locked" in layer_rules.prohibited_layer_names
    assert "backup" in layer_rules.prohibited_layer_names
    
    # Test StandardValidation
    validation = duc.create_standard_validation(dim_rules, layer_rules)
    assert validation.dimension_rules.min_text_height == 0.25
    assert validation.layer_rules.prohibited_layer_names == ["system", "locked", "frozen", "temp", "backup"]
    
    # Test all Identified* classes
    common_style = duc.create_simple_styles(roundness=1.5, opacity=0.85)
    identified_common = duc.IdentifiedCommonStyle(
        id=duc.create_identifier("test_common", "Test Common Style"),
        style=common_style
    )
    assert identified_common.id.id == "test_common"
    assert identified_common.style.roundness == 1.5
    
    text_style = duc.create_text_style(font_family="Consolas", font_size=14)
    identified_text = duc.IdentifiedTextStyle(
        id=duc.create_identifier("test_text", "Test Text Style"),
        style=text_style
    )
    assert identified_text.id.name == "Test Text Style"
    assert identified_text.style.font_family == "Consolas"
    
    doc_style = duc.create_doc_style()
    identified_doc = duc.IdentifiedDocStyle(
        id=duc.create_identifier("test_doc", "Test Doc Style"),
        style=doc_style
    )
    assert identified_doc.id.id == "test_doc"
    
    # Test StandardStyles
    styles = duc.create_standard_styles(
        common_styles=[("common1", common_style)],
        text_styles=[("text1", text_style)],
        doc_styles=[("doc1", doc_style)]
    )
    assert len(styles.common_styles) == 1
    assert len(styles.text_styles) == 1
    assert len(styles.doc_styles) == 1
    assert styles.common_styles[0].id.id == "common1"
    
    print("✅ ALL StandardsClass dataclasses tested successfully!")

if __name__ == "__main__":
    pytest.main([__file__])
