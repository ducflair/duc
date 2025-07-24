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
    asset_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
    with open(os.path.join(asset_dir, filename), "rb") as f:
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
        duc.create_external_file(key="pdf_file", mime_type="application/pdf", data=pdf_bytes),
        duc.create_external_file(key="step_file", mime_type="application/step", data=step_bytes),
        duc.create_external_file(key="jpg_file", mime_type="image/jpeg", data=jpg_bytes),
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
        duc.create_layer(id="layer1", label="Main Layer"),
        duc.create_layer(id="layer2", label="Secondary Layer", readonly=True),
    ]

    # --- Regions ---
    from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
    regions = [
        duc.create_region(id="region1", label="UnionRegion", boolean_operation=BOOLEAN_OPERATION.UNION),
        duc.create_region(id="region2", label="SubtractRegion", boolean_operation=BOOLEAN_OPERATION.SUBTRACT),
    ]

    # --- Groups ---
    groups = [
        duc.create_group(id="group1", label="Group1"),
        duc.create_group(id="group2", label="Group2", is_collapsed=True),
    ]

    # --- Standards ---
    standards = [
        duc.create_standard_complete(id="std1", name="Metric Standard"),
        duc.create_standard_complete(id="std2", name="Imperial Standard"),
    ]

    # --- Version graph ---
    checkpoint = duc.create_checkpoint(description="Initial checkpoint", is_manual_save=True, data=b"checkpoint")
    delta = duc.create_delta(
        patch=[duc.create_json_patch_operation(op="replace", path="/elements/0/x", value="123.45")],
        description="Moved element"
    )
    version_graph = duc.create_version_graph(
        checkpoints=[checkpoint],
        deltas=[delta],
        user_checkpoint_version_id=checkpoint.id,
        latest_version_id=delta.id
    )

    # --- Elements ---
    elements = []

    # Rectangle
    elements.append(duc.create_rectangle(
        x=10, y=20, width=100, height=50,
        label="Rectangle",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#FF0000", opacity=0.8),
            duc.create_solid_content("#000000"),
            stroke_width=2.0
        ),
        z_index=1.0,
        explicit_properties_override={"base": {"locked": True, "layer_id": "layer1", "region_ids": ["region1"]}}
    ))

    # Ellipse
    import math
    elements.append(duc.create_ellipse(
        x=200, y=100, width=80, height=40,
        ratio=0.5, start_angle=0.0, end_angle=math.pi,
        label="Ellipse",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#00FF00", opacity=0.6),
            duc.create_solid_content("#000000"),
            stroke_width=1.5
        ),
        z_index=2.0,
        explicit_properties_override={"base": {"locked": False, "layer_id": "layer2", "region_ids": ["region2"]}}
    ))

    # Polygon
    elements.append(duc.create_polygon(
        x=300, y=200, width=60, height=60, sides=5,
        label="Pentagon",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#0000FF", opacity=0.5),
            duc.create_solid_content("#FFFFFF"),
            stroke_width=1.0
        ),
        z_index=3.0
    ))

    # Linear element (polyline)
    elements.append(duc.create_linear_element(
        points=[(0,0), (50,50), (100,0)],
        label="Polyline",
        styles=duc.create_stroke_style(
            duc.create_solid_content("#FF00FF"),
            width=2.5
        ),
        z_index=4.0
    ))

    # Arrow element
    elements.append(duc.create_arrow_element(
        points=[(150,150), (200,200)],
        label="Arrow",
        styles=duc.create_stroke_style(
            duc.create_solid_content("#FFA500"),
            width=3.0
        ),
        z_index=5.0
    ))

    # Image element (linked to external jpg)
    elements.append(duc.create_image_element(
        x=400, y=50, width=120, height=80,
        file_id="jpg_file",
        label="Image",
        styles=duc.create_simple_styles(),
        z_index=6.0
    ))

    # PDF element (linked to external pdf)
    elements.append(duc.create_pdf_element(
        x=500, y=100, width=100, height=140,
        file_id="pdf_file",
        label="PDF",
        styles=duc.create_simple_styles(),
        z_index=7.0
    ))

    # Parametric element (linked to external step)
    elements.append(duc.create_parametric_element(
        x=600, y=200, width=80, height=80,
        file_id="step_file",
        source_type=duc.PARAMETRIC_SOURCE_TYPE.FILE,
        code="import_file('test.step')",
        label="STEP",
        styles=duc.create_simple_styles(),
        z_index=8.0
    ))

    # Text element
    elements.append(duc.create_text_element(
        x=50, y=300, text="Hello, DUC!",
        width=200, height=40,
        text_style=duc.create_text_style(font_family="Arial", font_size=18),
        label="Text",
        styles=duc.create_simple_styles(),
        z_index=9.0
    ))

    # Table element
    table_data = [
        ["Header1", "Header2", "Header3"],
        ["Row1A", "Row1B", "Row1C"],
        ["Row2A", "Row2B", "Row2C"]
    ]
    elements.append(duc.create_table_from_data(
        x=100, y=400, width=300, height=120,
        data=table_data,
        label="Table",
        styles=duc.create_simple_styles(),
        z_index=10.0
    ))

    # Frame element
    elements.append(duc.create_frame_element(
        x=700, y=50, width=150, height=100,
        label="Frame",
        styles=duc.create_simple_styles(),
        z_index=11.0
    ))

    # Plot element
    elements.append(duc.create_plot_element(
        x=700, y=200, width=200, height=150,
        label="Plot",
        styles=duc.create_simple_styles(),
        z_index=12.0
    ))

    # Viewport element
    view = duc.create_view(center_x=800, center_y=300, zoom=1.5)
    elements.append(duc.create_viewport_element(
        points=[(800,300), (900,300), (900,400), (800,400)],
        view=view,
        label="Viewport",
        styles=duc.create_simple_styles(),
        z_index=13.0
    ))

    # FreeDraw element
    freedraw_points = [(i*10, 500 + (i%2)*10) for i in range(20)]
    freedraw_pressures = [0.5 + 0.02*i for i in range(20)]
    duc_freedraw_points = [duc.DucPoint(x=float(p[0]), y=float(p[1])) for p in freedraw_points]
    elements.append(duc.create_freedraw_element(
        x=50, y=500, width=200, height=50,
        points=duc_freedraw_points,
        pressures=freedraw_pressures,
        size=5.0, thinning=0.2, smoothing=0.3, streamline=0.4, easing="linear",
        label="FreeDraw",
        styles=duc.create_simple_styles(),
        z_index=14.0
    ))

    # Doc element
    elements.append(duc.create_doc_element(
        x=400, y=500, width=300, height=100,
        text="This is a rich text document with {{Author}} and {{Revision}}.",
        label="Doc",
        styles=duc.create_simple_styles(),
        z_index=15.0
    ))

    # Dimension element (linear)
    elements.append(duc.create_linear_dimension(
        x1=100, y1=600, x2=300, y2=600,
        label="Dimension",
        styles=duc.create_simple_styles(),
        z_index=16.0
    ))

    # Leader element
    leader_content = duc.create_leader_text_content("Leader annotation")
    elements.append(duc.create_leader_element(
        x1=350, y1=650, x2=400, y2=700,
        content_anchor_x=410, content_anchor_y=710,
        content=duc.create_leader_content(leader_content),
        label="Leader",
        styles=duc.create_simple_styles(),
        z_index=17.0
    ))

    # Feature Control Frame element
    from ducpy.Duc.GDT_SYMBOL import GDT_SYMBOL
    tolerance = duc.create_tolerance_clause(value="0.05")
    datums = [duc.create_datum_reference("A"), duc.create_datum_reference("B")]
    segment = duc.create_feature_control_frame_segment(symbol=GDT_SYMBOL.POSITION, tolerance=tolerance, datums=datums)
    fcf_row = duc.FCFSegmentRow(segments=[segment])
    elements.append(duc.create_feature_control_frame_element(
        x=500, y=650, width=120, height=40,
        rows=[fcf_row],
        label="FCF",
        styles=duc.create_simple_styles(),
        z_index=18.0
    ))

    # Block definition and instance
    block_elements = [
        duc.create_rectangle(x=0, y=0, width=30, height=30, label="BlockRect"),
        duc.create_text_element(x=5, y=5, text="BlockText", width=20, height=10, label="BlockText"),
    ]
    block_attr_defs = [
        duc.create_block_attribute_definition_entry(key="PN", tag="PartNumber", default_value="PN-001"),
        duc.create_block_attribute_definition_entry(key="REV", tag="Revision", default_value="A"),
    ]
    block = duc.create_block(id="block1", label="TestBlock", elements=block_elements, attribute_definitions=block_attr_defs)
    elements.append(duc.create_block_instance_element(
        x=600, y=700, width=40, height=40,
        block_id="block1",
        attribute_values=[duc.create_string_value_entry("PN", "PN-002"), duc.create_string_value_entry("REV", "B")],
        label="BlockInstance",
        styles=duc.create_simple_styles(),
        z_index=19.0
    ))

    # Mermaid element
    elements.append(duc.create_mermaid_element(
        x=50, y=750, width=300, height=200,
        source="graph TD; A[Christmas] -->|Get money| B(Go shopping); B --> C{Let me think}; C -->|One| D[Laptop]; C -->|Two| E[iPhone]; C -->|Three] F[Car];",
        label="Mermaid Diagram",
        styles=duc.create_simple_styles(),
        z_index=20.0,
        theme="dark"
    ))

    # Embeddable element
    elements.append(duc.create_embeddable_element(
        x=400, y=750, width=400, height=250,
        link="https://www.youtube.com/embed/dQw4w9WgXcQ",
        label="YouTube Video",
        styles=duc.create_simple_styles(),
        z_index=21.0
    ))

    # --- Serialize ---
    output_file = os.path.join(test_output_dir, "test_a_duc_with_everything.duc")
    
    # Use write_ducfile from ducpy.io
    duc.write_duc_file(
        file_path=output_file,
        name="EverythingTest",
        elements=elements,
        blocks=[block],
        groups=groups,
        regions=regions,
        layers=layers,
        standards=standards,
        dictionary=dictionary,
        thumbnail=thumbnail_bytes,
        external_files=external_files,
        version_graph=version_graph
    )

    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

    # --- Parse and validate ---
    # Use read_ducfile from ducpy.io
    parsed = duc.read_duc_file(output_file)
    assert parsed is not None, "Parsed state is None"
    assert hasattr(parsed, "elements"), "Parsed state missing elements"
    element_count = len(parsed.elements)
    if element_count < 21:
        pytest.fail(f"Not all elements present: found {element_count}, expected at least 21")
    assert hasattr(parsed, "blocks"), "Parsed state missing blocks"
    assert hasattr(parsed, "layers"), "Parsed state missing layers"
    assert hasattr(parsed, "regions"), "Parsed state missing regions"
    assert hasattr(parsed, "standards"), "Parsed state missing standards"
    assert hasattr(parsed, "dictionary"), "Parsed state missing dictionary"
    assert hasattr(parsed, "thumbnail"), "Parsed state missing thumbnail"
    assert hasattr(parsed, "files"), "Parsed state missing files"
    assert hasattr(parsed, "version_graph"), "Parsed state missing version graph"

    print("✅ Everything test passed and file created:", output_file)