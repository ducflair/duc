#!/usr/bin/env python3
"""
Comprehensive demo showcasing all the builders API functionality.
This demo demonstrates how to use all the builders (Element, State, Style) 
to create complex DUC objects with various elements, styles, and configurations.
"""

import ducpy as duc
from ducpy.builders.style_builders import (
    create_solid_content, create_image_content, create_hatch_content,
    create_background, create_stroke, create_simple_styles,
    create_fill_style, create_stroke_style, create_fill_and_stroke_style,
    create_text_style, create_paragraph_formatting, create_stack_format,
    create_doc_style, create_column_layout
)
from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE


def demo_element_builders():
    """Demonstrate element builders with various styles."""
    print("=== Element Builders Demo ===")
    
    elements = []
    
    # 1. Basic shapes with styles
    rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 60)
        .with_label("Styled Rectangle")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#FF6B6B"),
            stroke_content=create_solid_content("#2C3E50"),
            stroke_width=2.0,
            roundness=8.0
        ))
        .build_rectangle()
        .build())
    elements.append(rect)
    
    ellipse = (duc.ElementBuilder()
        .at_position(120, 0)
        .with_size(80, 50)
        .with_label("Styled Ellipse")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#4ECDC4"),
            stroke_content=create_solid_content("#34495E"),
            stroke_width=1.5,
            roundness=0.0
        ))
        .build_ellipse()
        .build())
    elements.append(ellipse)
    
    # 2. Polygon with hatch pattern
    polygon = (duc.ElementBuilder()
        .at_position(220, 0)
        .with_size(70, 70)
        .with_label("Hexagon with Hatch")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_hatch_content("diagonal_hatch", opacity=0.7),
            stroke_content=create_solid_content("#8B4513"),
            stroke_width=2.5,
            roundness=0.0
        ))
        .build_polygon()
        .with_sides(6)
        .build())
    elements.append(polygon)
    
    # 3. Linear elements
    line = (duc.ElementBuilder()
        .at_position(0, 80)
        .with_label("Styled Line")
        .with_styles(create_simple_styles(
            strokes=[create_stroke(create_solid_content("#E74C3C"), width=3.0)]
        ))
        .build_linear_element()
        .with_points([(0, 0), (50, 25), (100, 0)])
        .build())
    elements.append(line)
    
    arrow = (duc.ElementBuilder()
        .at_position(120, 80)
        .with_label("Styled Arrow")
        .with_styles(create_simple_styles(
            strokes=[create_stroke(create_solid_content("#8E44AD"), width=2.5)]
        ))
        .build_arrow_element()
        .with_points([(0, 0), (80, 40)])
        .build())
    elements.append(arrow)
    
    # 4. Text elements with document styles
    text = (duc.ElementBuilder()
        .at_position(0, 140)
        .with_size(200, 40)
        .with_label("Styled Text")
        .with_styles(create_simple_styles(opacity=0.9))
        .build_text_element()
        .with_text("Hello, DucPy Builders!")
        .build())
    elements.append(text)
    
    # 5. Stack elements
    frame = (duc.ElementBuilder()
        .at_position(0, 200)
        .with_size(250, 120)
        .with_label("Technical Frame")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#F8F9FA"),
            stroke_content=create_solid_content("#495057"),
            stroke_width=2.0,
            roundness=5.0
        ))
        .build_frame_element()
        .build())
    elements.append(frame)
    
    plot = (duc.ElementBuilder()
        .at_position(270, 200)
        .with_size(200, 120)
        .with_label("Engineering Plot")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#E9ECEF"),
            stroke_content=create_solid_content("#6C757D"),
            stroke_width=1.5
        ))
        .build_plot_element()
        .with_margins(duc.Margins(top=10, right=10, bottom=10, left=10))
        .build())
    elements.append(plot)
    
    print(f"Created {len(elements)} styled elements")
    return elements


def demo_state_builders():
    """Demonstrate state builders for global and local state."""
    print("\n=== State Builders Demo ===")
    
    # 1. Global State
    global_state = (duc.StateBuilder()
        .build_global_state()
        .with_view_background_color("#F0F8FF")  # AliceBlue
        .with_main_scope("mm")
        .with_dash_spacing_scale(1.5)
        .with_dimensions_associative_by_default(True)
        .with_linear_precision(3)
        .with_angular_precision(2)
        .build())
    
    print(f"Global state scope: {global_state.main_scope}")
    
    # 2. Local State
    local_state = (duc.StateBuilder()
        .build_local_state()
        .with_scope("cm")
        .with_linear_precision(2)
        .with_angular_precision(1)
        .build())
    
    print(f"Local state scope: {local_state.scope}")
    
    return global_state, local_state


def demo_standard_builders():
    """Demonstrate standard builders with comprehensive configuration."""
    print("\n=== Standard Builders Demo ===")
    
    # 1. Unit Systems
    linear_units = duc.create_linear_unit_system(
        system=UNIT_SYSTEM.METRIC,
        precision=3,
        format=DIMENSION_UNITS_FORMAT.DECIMAL,
        decimal_separator=DECIMAL_SEPARATOR.DOT,
        suppress_trailing_zeros=True,
        suppress_leading_zeros=False,
        suppress_zero_feet=False,
        suppress_zero_inches=False
    )
    
    angular_units = duc.create_angular_unit_system(
        format=ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES,
        precision=2,
        suppress_trailing_zeros=False,
        suppress_leading_zeros=False,
        system=UNIT_SYSTEM.METRIC
    )
    
    primary_units = duc.create_primary_units(linear=linear_units, angular=angular_units)
    standard_units = duc.create_standard_units(primary_units=primary_units, alternate_units=None)
    
    # 2. Grid Settings
    grid_settings = (duc.StateBuilder()
        .build_grid_settings()
        .with_grid_type(GRID_TYPE.RECTANGULAR)
        .with_x_spacing(10.0)
        .with_y_spacing(10.0)
        .with_show_grid(True)
        .with_snap_to_grid(True)
        .with_major_line_interval(5)
        .build())
    
    # 3. Snap Settings
    snap_settings = (duc.StateBuilder()
        .build_snap_settings()
        .with_enabled(True)
        .with_snap_modes([SNAP_MODE.RUNNING, SNAP_MODE.SINGLE])
        .with_object_snap_modes([OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT])
        .with_snap_tolerance(5)
        .build())
    
    # 4. Text Style
    default_text_style = duc.IdentifiedTextStyle(
        id=duc.create_identifier("default_text_style", "Default Text Style"),
        style=create_text_style(
            font_family="Arial",
            font_size=12,
            text_align=TEXT_ALIGN.LEFT,
            vertical_align=VERTICAL_ALIGN.MIDDLE
        )
    )
    
    # 5. Complete Standard
    standard = (duc.StateBuilder()
        .build_standard()
        .with_id("comprehensive_standard")
        .with_name("Comprehensive DucPy Standard")
        .with_description("A comprehensive standard demonstrating all builders API features.")
        .with_units(standard_units)
        .with_view_settings(duc.create_standard_view_settings(
            grid_settings=[duc.IdentifiedGridSettings(
                id=duc.create_identifier("main_grid", "Main Grid"), 
                settings=grid_settings
            )],
            snap_settings=[duc.IdentifiedSnapSettings(
                id=duc.create_identifier("main_snap", "Main Snap"), 
                settings=snap_settings
            )],
            views=[], 
            ucs=[]
        ))
        .with_text_styles([default_text_style])
        .with_dimension_styles([])
        .with_tolerance_styles([])
        .with_layer_styles([])
        .with_region_styles([])
        .with_block_styles([])
        .with_override_styles([])
        .build())
    
    print(f"Standard created: {standard.name}")
    return standard


def demo_style_builders():
    """Demonstrate advanced style builders functionality."""
    print("\n=== Advanced Style Builders Demo ===")
    
    # 1. Complex multi-background style
    complex_style = create_simple_styles(
        roundness=15.0,
        opacity=0.95,
        backgrounds=[
            create_background(create_solid_content("#FFE4E1")),  # Misty Rose
            create_background(create_image_content("pattern_id"))
        ],
        strokes=[
            create_stroke(create_solid_content("#8B0000"), width=2.0),
            create_stroke(create_solid_content("#FFD700"), width=1.0, placement=STROKE_PLACEMENT.OUTSIDE)
        ]
    )
    
    # 2. Advanced text style with paragraph formatting
    paragraph_format = create_paragraph_formatting(
        first_line_indent=20.0,
        left_indent=10.0,
        right_indent=10.0,
        space_before=5.0,
        space_after=5.0,
        tab_stops=[50.0, 100.0, 150.0]
    )
    
    advanced_text_style = create_text_style(
        font_family="Times New Roman",
        font_size=16,
        text_align=TEXT_ALIGN.JUSTIFY,
        vertical_align=VERTICAL_ALIGN.TOP,
        line_height=1.5,
        oblique_angle=5.0,
        width_factor=1.1
    )
    
    advanced_doc_style = create_doc_style(
        text_style=advanced_text_style,
        paragraph=paragraph_format,
        stack_format=create_stack_format(
            auto_stack=True,
            stack_chars=["/", "\\", "#"],
            properties=duc.create_stack_format_properties(
                upper_scale=0.8,
                lower_scale=0.8,
                alignment=duc.Duc.STACKED_TEXT_ALIGN.CENTER
            )
        )
    )
    
    print("Advanced styles created successfully")
    return complex_style, advanced_doc_style


def demo_complete_duc_creation():
    """Demonstrate complete DUC object creation using all builders."""
    print("\n=== Complete DUC Creation Demo ===")
    
    # Create all components using builders
    elements = demo_element_builders()
    global_state, local_state = demo_state_builders()
    standard = demo_standard_builders()
    complex_style, advanced_doc_style = demo_style_builders()
    
    # Create the complete DUC object
    duc_object = duc.create_duc(
        name="Comprehensive Builders Demo",
        standards=[standard],
        elements=elements,
        duc_global_state=global_state,
        duc_local_state=local_state,
        external_files=[]
    )
    
    print(f"Complete DUC object created with:")
    print(f"  - {len(duc_object.elements)} elements")
    print(f"  - {len(duc_object.standards)} standards")
    print(f"  - Global state scope: {duc_object.duc_global_state.main_scope}")
    print(f"  - Local state scope: {duc_object.duc_local_state.scope}")
    
    return duc_object


def demo_serialization_roundtrip():
    """Demonstrate serialization and parsing of the complete DUC object."""
    print("\n=== Serialization Roundtrip Demo ===")
    
    # Create the DUC object
    original_duc = demo_complete_duc_creation()
    
    # Serialize to binary
    serialized_data = duc.serialize_duc(
        name=original_duc.name,
        standards=original_duc.standards,
        elements=original_duc.elements,
        duc_global_state=original_duc.duc_global_state,
        duc_local_state=original_duc.duc_local_state,
        external_files=original_duc.files
    )
    
    print(f"Serialized {len(serialized_data)} bytes")
    
    # Parse back from binary
    import io
    parsed_duc = duc.parse_duc(io.BytesIO(serialized_data))
    
    print(f"Parsed back successfully:")
    print(f"  - {len(parsed_duc.elements)} elements")
    print(f"  - {len(parsed_duc.standards)} standards")
    print(f"  - Name: {parsed_duc.name}")
    
    # Verify roundtrip
    assert len(original_duc.elements) == len(parsed_duc.elements)
    assert len(original_duc.standards) == len(parsed_duc.standards)
    assert original_duc.name == parsed_duc.name
    print("Roundtrip verification successful!")


def main():
    """Run the comprehensive builders demo."""
    print("DUC Comprehensive Builders API Demo")
    print("=" * 60)
    
    try:
        demo_serialization_roundtrip()
        print("\n" + "=" * 60)
        print("Comprehensive builders demo completed successfully!")
        print("All builders API functionality demonstrated and verified.")
        
    except Exception as e:
        print(f"Error during demo: {e}")
        raise


if __name__ == "__main__":
    main() 