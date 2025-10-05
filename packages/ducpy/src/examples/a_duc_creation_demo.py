"""
Example demonstrating the creation of a complete DUC object using the builder pattern.
"""

import ducpy as duc
from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ducpy.Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ducpy.Duc.VIEWPORT_SHADE_PLOT import VIEWPORT_SHADE_PLOT
from ducpy.Duc.IMAGE_STATUS import IMAGE_STATUS
from ducpy.Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.classes.DataStateClass import ExportedDataState # Changed from Duc

def create_sample_duc_object():
    """
    Creates a sample DUC object with global state, local state,
    and a variety of elements using the builder pattern.
    """
    print("Creating a sample DUC object using builders...")

    # 1. Create Global State
    global_state = (duc.StateBuilder()
        .build_global_state()
        .with_view_background_color("#F0F8FF") # AliceBlue
        .with_main_scope("mm")
        .with_dash_spacing_scale(1.5)
        .with_dimensions_associative_by_default(True)
        .with_linear_precision(3)
        .with_angular_precision(2)
        .build())

    # 2. Create Standard (as a prerequisite for local state and some elements)
    # Re-using parts from standard_creation_demo for a comprehensive example
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

    grid_settings = (duc.StateBuilder()
        .build_grid_settings()
        .with_grid_type(GRID_TYPE.RECTANGULAR)
        .with_x_spacing(10.0).with_y_spacing(10.0)
        .with_show_grid(True).with_snap_to_grid(True)
        .with_major_line_interval(5)
        .build())

    snap_settings = (duc.StateBuilder()
        .build_snap_settings()
        .with_enabled(True)
        .with_snap_modes([SNAP_MODE.RUNNING, SNAP_MODE.SINGLE])
        .with_object_snap_modes([OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT])
        .with_snap_tolerance(5) # Changed from 5.0 to 5
        .build())

    default_text_style = duc.IdentifiedTextStyle(
        id=duc.create_identifier("default_text_style", "Default Text Style"),
        style=duc.DucTextStyle(
            is_ltr=True, font_family="Arial", big_font_family="Arial",
            line_height=1.0, line_spacing=duc.LineSpacing(value=1.0, type=duc.LINE_SPACING_TYPE.AT_LEAST),
            oblique_angle=0.0, font_size=12, width_factor=1.0,
            is_upside_down=False, is_backwards=False,
            text_align=TEXT_ALIGN.LEFT, vertical_align=VERTICAL_ALIGN.MIDDLE, paper_text_height=None
        )
    )

    standard = (duc.StateBuilder()
        .build_standard()
        .with_id("sample_standard")
        .with_name("Sample DucPy Standard")
        .with_description("A standard for demonstration purposes.")
        .with_units(standard_units)
        .with_view_settings(duc.create_standard_view_settings(
            grid_settings=[duc.IdentifiedGridSettings(id=duc.create_identifier("main_grid", "Main Grid"), settings=grid_settings)],
            snap_settings=[duc.IdentifiedSnapSettings(id=duc.create_identifier("main_snap", "Main Snap"), settings=snap_settings)],
            views=[], ucs=[]
        ))
        .with_styles(duc.create_standard_styles(
            common_styles=[duc.IdentifiedCommonStyle(id=duc.create_identifier("default_common", "Default Common Style"), style=duc.DucCommonStyle(
                background=duc.create_background(duc.create_solid_content("#FFFFFF", opacity=1.0)),
                stroke=duc.create_stroke(duc.create_solid_content("#000000", opacity=1.0), width=1.0)
            ))],
            text_styles=[default_text_style]
        ))
        .build())

    # 3. Create Local State
    local_state = (duc.StateBuilder()
        .build_local_state()
        .with_active_standard_id(standard.identifier.id)
        .with_scroll_x(10.0).with_scroll_y(20.0).with_zoom(0.8)
        .with_grid_mode_enabled(True)
        .build())

    # 4. Create Elements
    elements = []

    # Rectangle
    rect = (duc.ElementBuilder()
        .at_position(0, 0).with_size(100, 50)
        .with_label("Rectangle 1")
        .build_rectangle()
        .build())
    elements.append(rect)

    # Circle (Ellipse with ratio 1.0)
    circle = (duc.ElementBuilder()
        .at_position(150, 0).with_size(50, 50)
        .with_label("Circle 1")
        .build_ellipse()
        .with_ratio(1.0)
        .build())
    elements.append(circle)

    # Polygon (Hexagon)
    hexagon = (duc.ElementBuilder()
        .at_position(250, 0).with_size(60, 60)
        .with_label("Hexagon 1")
        .build_polygon()
        .with_sides(6)
        .build())
    elements.append(hexagon)

    # Line
    line = (duc.ElementBuilder()
        .with_label("Line 1")
        .build_linear_element()
        .with_points([(10, 70), (100, 120), (200, 70)])
        .build())
    elements.append(line)

    # Arrow
    arrow = (duc.ElementBuilder()
        .with_label("Arrow 1")
        .build_arrow_element()
        .with_points([(220, 100), (280, 150)])
        .build())
    elements.append(arrow)

    # Text Element
    text_element = (duc.ElementBuilder()
        .at_position(10, 150).with_size(100, 30)
        .with_label("Greeting Text")
        .build_text_element()
        .with_text("Hello, DucPy World!")
        .with_text_style(default_text_style.style) # Re-use the defined text style
        .build())
    elements.append(text_element)

    # Frame Element
    frame = (duc.ElementBuilder()
        .at_position(5, 5).with_size(300, 200)
        .with_label("Drawing Frame")
        .build_frame_element()
        .build())
    elements.append(frame)

    # Plot Element
    plot = (duc.ElementBuilder()
        .at_position(320, 5).with_size(150, 100)
        .with_label("Detailed Plot")
        .build_plot_element()
        .with_margins(duc.Margins(top=10, bottom=10, left=10, right=10))
        .build())
    elements.append(plot)

    # Viewport Element
    viewport_points = [(0, 0), (70, 0), (70, 50), (0, 50), (0, 0)]
    viewport_view = (duc.StateBuilder()
        .build_view()
        .with_center_x(0).with_center_y(0).with_zoom(0.5)
        .build())
    viewport = (duc.ElementBuilder()
        .at_position(330, 120) # Relative to plot
        .with_size(70, 50)
        .with_label("Viewport Detail")
        .build_viewport_element()
        .with_points(viewport_points)
        .with_view(viewport_view)
        .with_view_scale(1.0)
        .with_shade_plot(VIEWPORT_SHADE_PLOT.RENDERED) # Changed from FLAT_SHADED
        .build())
    elements.append(viewport)

    # Create a simple DUC object
    duc_object = ExportedDataState(
        duc_global_state=global_state, # Corrected argument name
        duc_local_state=local_state,   # Corrected argument name
        elements=elements,
        standards=[standard],
        files=[],
        version_graph=(duc.StateBuilder().build_version_graph().with_checkpoints([]).with_deltas([]).build()), # Created VersionGraph
        groups=[],
        layers=[],
        regions=[],
        blocks=[],
        dictionary={}, # Add missing required argument
        type="", # Add missing required argument
        version="", # Add missing required argument
        source="", # Add missing required argument
        thumbnail=b"" # Add missing required argument
    )

    print("Sample DUC object created successfully!")
    print(f"Total elements: {len(duc_object.elements)}")
    print(f"Global State Background Color: {duc_object.duc_global_state.view_background_color}") # Corrected attribute
    print(f"Active Standard ID: {duc_object.duc_local_state.active_standard_id}") # Corrected attribute
    return duc_object

if __name__ == "__main__":
    sample_duc = create_sample_duc_object()
    # You can now save this duc_object to a file, manipulate it further, etc.
    print("\n----- DUC Object Details -----")
    print(f"Number of elements: {len(sample_duc.elements)}")
    print(f"Global State Main Scope: {sample_duc.duc_global_state.main_scope}") # Corrected attribute
    print(f"Local State Zoom: {sample_duc.duc_local_state.zoom}") # Corrected attribute
    print(f"Standard Name: {sample_duc.standards[0].identifier.name}")
    print("\nExample DUC object creation complete!")
