# The goal of this test is to create a Duc file with every single property possible to test coverage
# The test will consist of creating the Duc file first with the builders api, and then serializing it to the outputs
# Then in the end will parse the file and check if most properties are present and valid in the python state

# This duc test file must include:
# - All possible element types
# - All possible properties for each element type
# - All possible styles and settings
# - Diverse Layers, Regions, Blocks, Groups
# - Diverse Dictionary key values
# - Thumbnail image from assets (thumbnail.png)
# - On external files at least three files related to elements (test.pdf, test.step and test.jpg)
#    - Respectively these files will be necessary to link to the DucPdfElement, DucParametricElement and DucImageElement
# - Some VersionGraph history
# - Diverse Standards

"""
Comprehensive DUC file test: creates a file with every element type, property, style, layer, region, block, group, dictionary, thumbnail, external files, version graph, and standards.
Uses only the builders API.
"""
import os
import pytest
import ducpy as duc

def load_asset_bytes(filename):
    """Load asset bytes using file extension to determine subdirectory."""
    _, ext = os.path.splitext(filename.lower())
    ext = ext[1:]  # Remove the dot

    # Map extensions to subdirectories
    if ext == "pdf":
        sub_dir = "pdf-files"
    elif ext == "svg":
        sub_dir = "svg-files"
    elif ext in ["png", "jpg", "jpeg", "gif"]:
        sub_dir = "image-files"
    elif ext == "step":
        sub_dir = "step-files"
    elif ext == "duc":
        sub_dir = "duc-files"
    else:
        sub_dir = "image-files"  # default

    asset_dir = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "..", "assets", "testing"))

    with open(os.path.join(asset_dir, sub_dir, filename), "rb") as f:
        return f.read()

@pytest.fixture
def test_output_dir():
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

def test_a_duc_with_everything(test_output_dir):
    # --- Load assets ---
    thumbnail_bytes = load_asset_bytes("thumbnail.png")
    pdf_bytes = load_asset_bytes("test.pdf")
    step_bytes = load_asset_bytes("test.step")
    jpg_bytes = load_asset_bytes("test.jpg")

    # --- External files ---
    external_files = [
        (duc.StateBuilder().build_external_file()
            .with_key("pdf_file")
            .with_mime_type("application/pdf")
            .with_data(pdf_bytes)
            .build()),  
        (duc.StateBuilder().build_external_file()
            .with_key("step_file")
            .with_mime_type("application/step")
            .with_data(step_bytes)
            .build()),
        (duc.StateBuilder().build_external_file()
            .with_key("jpg_file")
            .with_mime_type("image/jpeg")
            .with_data(jpg_bytes)
            .build()),
    ]

    # --- Dictionary entries ---
    dictionary = [
        duc.DictionaryEntry(key="ProjectName", value="Everything Test"),
        duc.DictionaryEntry(key="Author", value="TestBot"),
        duc.DictionaryEntry(key="Revision", value="42"),
        duc.DictionaryEntry(key="SpecialKey", value="SpecialValue"),
    ]

    # --- Layers ---
    layers = [
        duc.StateBuilder().build_layer().with_id("layer1").with_label("Main Layer").build(),
        duc.StateBuilder().build_layer().with_id("layer2").with_label("Secondary Layer").with_readonly(True).build(),
    ]

    # --- Regions ---
    from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
    regions = [
        (duc.StateBuilder().build_region()
            .with_id("region1")
            .with_label("UnionRegion")
            .with_boolean_operation(BOOLEAN_OPERATION.UNION)
            .build()),
        (duc.StateBuilder().build_region()
            .with_id("region2")
            .with_label("SubtractRegion")
            .with_boolean_operation(BOOLEAN_OPERATION.SUBTRACT)
            .build()),
    ]

    # --- Groups ---
    groups = [
        (duc.StateBuilder().build_group()
            .with_id("group1")
            .with_label("Group1")
            .build()),
        (duc.StateBuilder().build_group()
            .with_id("group2")
            .with_label("Group2")
            .with_is_collapsed(True)
            .build()),
    ]

    # --- Standards ---
    standards = [
        duc.create_standard_complete(id="std1", name="Metric Standard"),
        duc.create_standard_complete(id="std2", name="Imperial Standard")
    ]

    # --- Version graph ---
    checkpoint = (duc.StateBuilder().build_checkpoint()
            .with_description("Initial checkpoint")
            .with_is_manual_save(True)
            .with_data(b"checkpoint")
            .build())
    delta = (duc.StateBuilder().build_delta()
            .with_patch([duc.create_json_patch_operation(op="replace", path="/elements/0/x", value="123.45")])
            .with_description("Moved element")
            .build())
    version_graph = (duc.StateBuilder().build_version_graph()
            .with_checkpoints([checkpoint])
            .with_deltas([delta])
            .with_user_checkpoint_version_id(checkpoint.id)
            .with_latest_version_id(delta.id)
            .build())

    # --- Global State ---
    global_state = (duc.StateBuilder().build_global_state()
        .with_view_background_color("#F0F0F0")
        .with_main_scope("m")
        .with_dash_spacing_scale(2.0)
        .with_is_dash_spacing_affected_by_viewport_scale(True)
        .with_scope_exponent_threshold(3)
        .with_dimensions_associative_by_default(False)
        .with_use_annotative_scaling(True)
        .with_linear_precision(4)
        .with_angular_precision(3)
        .with_pruning_level(duc.PRUNING_LEVEL.AGGRESSIVE) # Explicitly set pruning level
        .build())

    # --- Local State ---
    local_state = (duc.StateBuilder().build_local_state()
        .with_scope("cm")
        .with_active_standard_id("std1")
        .with_scroll_x(50.0)
        .with_scroll_y(75.0)
        .with_zoom(2.0)
        .with_is_binding_enabled(False)
        .with_pen_mode(True)
        .with_view_mode_enabled(True)
        .with_objects_snap_mode_enabled(False)
        .with_grid_mode_enabled(False)
        .with_outline_mode_enabled(True)
        .build())

    # --- Elements ---
    elements = []

    # Rectangle
    elements.append(duc.ElementBuilder()
        .at_position(10, 20)
        .with_size(100, 50)
        .with_label("Rectangle")
        .with_styles(duc.create_fill_and_stroke_style(
            duc.create_solid_content("#FF0000", opacity=0.8),
            duc.create_solid_content("#000000"),
            stroke_width=2.0
        ))
        .with_z_index(1.0)
        .with_locked(True)
        .with_layer_id("layer1")
        .with_region_ids(["region1"])
        .build_rectangle()
        .build())

    # Ellipse
    import math
    elements.append(duc.ElementBuilder()
        .at_position(200, 100)
        .with_size(80, 40)
        .with_label("Ellipse")
        .with_styles(duc.create_fill_and_stroke_style(
            duc.create_solid_content("#00FF00", opacity=0.6),
            duc.create_solid_content("#000000"),
            stroke_width=1.5
        ))
        .with_z_index(2.0)
        .with_locked(False)
        .with_layer_id("layer2")
        .with_region_ids(["region2"])
        .build_ellipse()
        .with_ratio(0.5)
        .with_start_angle(0.0)
        .with_end_angle(math.pi)
        .build())

    # Polygon
    elements.append(duc.ElementBuilder()
        .at_position(300, 200)
        .with_size(60, 60)
        .with_label("Pentagon")
        .with_styles(duc.create_fill_and_stroke_style(
            duc.create_solid_content("#0000FF", opacity=0.5),
            duc.create_solid_content("#FFFFFF"),
            stroke_width=1.0
        ))
        .with_z_index(3.0)
        .build_polygon()
        .with_sides(5)
        .build())

    # Linear element (polyline)
    elements.append(duc.ElementBuilder()
        .with_label("Polyline")
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#FF00FF"),
            width=2.5
        ))
        .with_z_index(4.0)
        .build_linear_element()
        .with_points([(0,0), (50,50), (100,0)])
        .build())

    # Arrow element
    elements.append(duc.ElementBuilder()
        .with_label("Arrow")
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#FFA500"),
            width=3.0
        ))
        .with_z_index(5.0)
        .build_arrow_element()
        .with_points([(150,150), (200,200)])
        .build())

    # Image element (linked to external jpg)
    elements.append(duc.ElementBuilder()
        .at_position(400, 50)
        .with_size(120, 80)
        .with_label("Image")
        .with_styles(duc.create_simple_styles())
        .with_z_index(6.0)
        .build_image_element()
        .with_file_id("jpg_file")
        .build())

    # PDF element (linked to external pdf)
    elements.append(duc.ElementBuilder()
        .at_position(500, 100)
        .with_size(100, 140)
        .with_label("PDF")
        .with_styles(duc.create_simple_styles())
        .with_z_index(7.0)
        .build_pdf_element()
        .with_file_id("pdf_file")
        .build())

    # Parametric element (linked to external step)
    elements.append(duc.ElementBuilder()
        .at_position(600, 200)
        .with_size(80, 80)
        .with_label("STEP")
        .with_styles(duc.create_simple_styles())
        .with_z_index(8.0)
        .build_parametric_element()
        .with_file_id("step_file")
        .with_source_type(duc.PARAMETRIC_SOURCE_TYPE.FILE)
        .with_code("import_file('test.step')")
        .build())

    # Text element
    elements.append(duc.ElementBuilder()
        .at_position(50, 300)
        .with_size(200, 40)
        .with_label("Text")
        .with_styles(duc.create_simple_styles())
        .with_z_index(9.0)
        .build_text_element()
        .with_text("Hello, DUC!")
        .with_text_style(duc.create_text_style(font_family="Arial", font_size=18))
        .build())

    # Table element
    table_data = [
        ["Header1", "Header2", "Header3"],
        ["Row1A", "Row1B", "Row1C"],
        ["Row2A", "Row2B", "Row2C"]
    ]
    elements.append(duc.ElementBuilder()
        .at_position(100, 400)
        .with_size(300, 120)
        .with_label("Table")
        .with_styles(duc.create_simple_styles())
        .with_z_index(10.0)
        .build_table_from_data()
        .with_data(table_data)
        .build())

    # Frame element
    elements.append(duc.ElementBuilder()
        .at_position(700, 50)
        .with_size(150, 100)
        .with_label("Frame")
        .with_styles(duc.create_simple_styles())
        .with_z_index(11.0)
        .build_frame_element()
        .build())

    # Plot element
    elements.append(duc.ElementBuilder()
        .at_position(700, 200)
        .with_size(200, 150)
        .with_label("Plot")
        .with_styles(duc.create_simple_styles())
        .with_z_index(12.0)
        .build_plot_element()
        .build())

    # Viewport element
    view = (duc.StateBuilder().build_view() 
            .with_center_x(800) 
            .with_center_y(300) 
            .with_zoom(1.5) 
            .build())
    elements.append(duc.ElementBuilder()
        .with_label("Viewport")
        .with_styles(duc.create_simple_styles())
        .with_z_index(13.0)
        .build_viewport_element()
        .with_points([(800,300), (900,300), (900,400), (800,400)])
        .with_view(view)
        .build())

    # FreeDraw element
    freedraw_points = [(i*10, 500 + (i%2)*10) for i in range(20)]
    freedraw_pressures = [0.5 + 0.02*i for i in range(20)]
    duc_freedraw_points = [duc.DucPoint(x=float(p[0]), y=float(p[1]), mirroring=None) for p in freedraw_points]
    elements.append(duc.ElementBuilder()
        .at_position(50, 500)
        .with_size(200, 50)
        .with_label("FreeDraw")
        .with_styles(duc.create_simple_styles())
        .with_z_index(14.0)
        .build_freedraw_element()
        .with_points(duc_freedraw_points)
        .with_pressures(freedraw_pressures)
        .with_size_thickness(5.0)
        .with_thinning(0.2)
        .with_smoothing(0.3)
        .with_streamline(0.4)
        .with_easing("linear")
        .build())

    # Doc element
    elements.append(duc.ElementBuilder()
        .at_position(400, 500)
        .with_size(300, 100)
        .with_label("Doc")
        .with_styles(duc.create_simple_styles())
        .with_z_index(15.0)
        .build_doc_element()
        .with_text("This is a rich text document with {{Author}} and {{Revision}}.")
        .build())

    # Dimension element (linear)
    elements.append(duc.ElementBuilder()
        .with_label("Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(16.0)
        .build_linear_dimension()
        .with_origin1(duc.DucPoint(x=100, y=600, mirroring=None))
        .with_origin2(duc.DucPoint(x=300, y=600, mirroring=None))
        .with_location(duc.DucPoint(x=200, y=580, mirroring=None))
        .build())

    # Leader element
    leader_content = duc.create_leader_text_content("Leader annotation")
    elements.append(duc.ElementBuilder()
        .at_position(350, 650)
        .with_size(50, 50)
        .with_label("Leader")
        .with_styles(duc.create_simple_styles())
        .with_z_index(17.0)
        .build_leader_element()
        .with_content_anchor_x(410)
        .with_content_anchor_y(710)
        .with_content(duc.create_leader_content(leader_content))
        .build())

    # Feature Control Frame element
    from ducpy.Duc.GDT_SYMBOL import GDT_SYMBOL
    tolerance = duc.create_tolerance_clause(value="0.05")
    datums = [duc.create_datum_reference("A"), duc.create_datum_reference("B")]
    segment = duc.create_feature_control_frame_segment(symbol=GDT_SYMBOL.POSITION, tolerance=tolerance, datums=datums)
    fcf_row = duc.FCFSegmentRow(segments=[segment])
    elements.append(duc.ElementBuilder()
        .at_position(500, 650)
        .with_size(120, 40)
        .with_label("FCF")
        .with_styles(duc.create_simple_styles())
        .with_z_index(18.0)
        .build_feature_control_frame_element()
        .with_segments([fcf_row])
        .build())


    # Mermaid element
    elements.append(duc.ElementBuilder()
        .at_position(50, 750)
        .with_size(300, 200)
        .with_label("Mermaid Diagram")
        .with_styles(duc.create_simple_styles())
        .with_z_index(20.0)
        .build_mermaid_element()
        .with_source("graph TD; A[Christmas] -->|Get money| B(Go shopping); B --> C{Let me think}; C -->|One| D[Laptop]; C -->|Two| E[iPhone]; C -->|Three] F[Car];")
        .with_theme("dark")
        .build())

    # Embeddable element
    elements.append(duc.ElementBuilder()
        .at_position(400, 750)
        .with_size(400, 250)
        .with_label("YouTube Video")
        .with_styles(duc.create_simple_styles())
        .with_z_index(21.0)
        .build_embeddable_element()
        .with_link("https://www.youtube.com/embed/dQw4w9WgXcQ")
        .build())

    # XRay element
    elements.append(duc.ElementBuilder()
        .at_position(50, 960)
        .with_size(10, 10)
        .with_label("XRay")
        .with_styles(duc.create_simple_styles())
        .with_z_index(22.0)
        .build_xray_element()
        .with_origin_x(50)
        .with_origin_y(960)
        .with_direction_x(1)
        .with_direction_y(0)
        .with_color("#FF0000")
        .with_start_from_origin(True)
        .build())

    # Aligned Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Aligned Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(23.0)
        .build_aligned_dimension()
        .with_origin1(duc.DucPoint(x=100, y=800, mirroring=None))
        .with_origin2(duc.DucPoint(x=300, y=850, mirroring=None))
        .with_location(duc.DucPoint(x=200, y=780, mirroring=None))
        .build())

    # Angular Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Angular Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(24.0)
        .build_angular_dimension()
        .with_origin1(duc.DucPoint(x=400, y=800, mirroring=None))
        .with_origin2(duc.DucPoint(x=500, y=800, mirroring=None))
        .with_location(duc.DucPoint(x=450, y=750, mirroring=None))
        .build())

    # Radius Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Radius Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(25.0)
        .build_radius_dimension()
        .with_origin1(duc.DucPoint(x=600, y=800, mirroring=None))
        .with_location(duc.DucPoint(x=650, y=850, mirroring=None))
        .build())

    # Diameter Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Diameter Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(26.0)
        .build_diameter_dimension()
        .with_origin1(duc.DucPoint(x=700, y=800, mirroring=None))
        .with_location(duc.DucPoint(x=750, y=850, mirroring=None))
        .build())

    # Arc Length Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Arc Length Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(27.0)
        .build_arc_length_dimension()
        .with_origin1(duc.DucPoint(x=800, y=800, mirroring=None))
        .with_origin2(duc.DucPoint(x=900, y=800, mirroring=None))
        .with_location(duc.DucPoint(x=850, y=750, mirroring=None))
        .build())

    # Center Mark Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Center Mark Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(28.0)
        .build_center_mark_dimension()
        .with_origin1(duc.DucPoint(x=100, y=900, mirroring=None))
        .with_location(duc.DucPoint(x=100, y=920, mirroring=None))
        .build())

    # Rotated Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Rotated Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(29.0)
        .build_rotated_dimension()
        .with_origin1(duc.DucPoint(x=200, y=900, mirroring=None))
        .with_origin2(duc.DucPoint(x=300, y=900, mirroring=None))
        .with_location(duc.DucPoint(x=250, y=880, mirroring=None))
        .build())

    # Spacing Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Spacing Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(30.0)
        .build_spacing_dimension()
        .with_origin1(duc.DucPoint(x=400, y=900, mirroring=None))
        .with_origin2(duc.DucPoint(x=500, y=900, mirroring=None))
        .with_location(duc.DucPoint(x=450, y=880, mirroring=None))
        .build())

    # Continue Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Continue Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(31.0)
        .build_continue_dimension()
        .with_origin1(duc.DucPoint(x=600, y=900, mirroring=None))
        .with_origin2(duc.DucPoint(x=700, y=900, mirroring=None))
        .with_location(duc.DucPoint(x=650, y=880, mirroring=None))
        .build())

    # Baseline Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Baseline Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(32.0)
        .build_baseline_dimension()
        .with_origin1(duc.DucPoint(x=800, y=900, mirroring=None))
        .with_origin2(duc.DucPoint(x=900, y=900, mirroring=None))
        .with_location(duc.DucPoint(x=850, y=880, mirroring=None))
        .build())

    # Jogged Linear Dimension element
    elements.append(duc.ElementBuilder()
        .with_label("Jogged Linear Dimension")
        .with_styles(duc.create_simple_styles())
        .with_z_index(33.0)
        .build_jogged_linear_dimension()
        .with_origin1(duc.DucPoint(x=100, y=1000, mirroring=None))
        .with_origin2(duc.DucPoint(x=300, y=1050, mirroring=None))
        .with_location(duc.DucPoint(x=200, y=980, mirroring=None))
        .with_jog_x(250)
        .with_jog_y(1020)
        .build())

    # --- Serialize ---
    output_file = os.path.join(test_output_dir, "test_a_duc_with_everything.duc")
    
    duc.write_duc_file(
        file_path=output_file,
        name="EverythingTest",
        elements=elements,

        blocks=[],
        groups=groups,
        regions=regions,
        layers=layers,
        standards=standards,
        dictionary=dictionary,
        thumbnail=thumbnail_bytes,
        external_files=external_files,
        version_graph=version_graph,
        duc_global_state=global_state,
        duc_local_state=local_state
    )

    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

    # --- Parse and validate ---
    # Use read_ducfile from ducpy.io
    parsed = duc.read_duc_file(output_file)
    assert parsed is not None, "Parsed state is None"
    assert parsed.elements is not None, "Parsed state missing elements"
    element_count = len(parsed.elements)
    if element_count < 32: # Updated from 33 to 32 elements
        pytest.fail(f"Not all elements present: found {element_count}, expected at least 32")
    assert parsed.blocks is not None, "Parsed state missing blocks"
    assert parsed.layers is not None, "Parsed state missing layers"
    assert parsed.regions is not None, "Parsed state missing regions"
    assert parsed.standards is not None, "Parsed state missing standards"
    assert parsed.dictionary is not None, "Parsed state missing dictionary"
    assert parsed.thumbnail is not None, "Parsed state missing thumbnail"
    assert parsed.files is not None, "Parsed state missing files"
    assert parsed.version_graph is not None, "Parsed state missing version graph"
    assert parsed.duc_global_state is not None, "Parsed state missing global state"
    assert parsed.duc_local_state is not None, "Parsed state missing local state"
    assert parsed.version_graph.metadata is not None, "Parsed state missing version graph metadata"

    print("✅ Everything test passed and file created:", output_file)