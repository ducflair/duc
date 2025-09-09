"""
CSP Test for PDF and Image Elements: Create-Serialize-Parse
Tests DucPdfElements with pdf files and DucImageElements with svg,     print(    print(f"✅ Parsed {len(parsed_elements)} elements and {len(parsed_files)} files")
    
    # === VERIFICATION ===parsed_elements)} elements and {len(parsed_files)} files")
    
    # === VERIFICATION ===eg files.
"""
import os
import pytest

import ducpy as duc


def test_csp_pdf_image_elements(test_output_dir):
    """
    CSP test for PDF and Image elements:
    - Create: DucPdfElement with pdf file and DucImageElements with svg, png, and jpeg files
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating PDF and Image elements...")
    
    # Load assets
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
    pdf_bytes = open(os.path.join(assets_dir, "test.pdf"), "rb").read()
    svg_bytes = open(os.path.join(assets_dir, "hawaii.svg"), "rb").read()
    png_bytes = open(os.path.join(assets_dir, "dot.png"), "rb").read()
    jpeg_bytes = open(os.path.join(assets_dir, "test.jpg"), "rb").read()
    
    # Create external files
    pdf_file = (duc.StateBuilder()
        .build_external_file()
        .with_key("test_pdf")
        .with_mime_type("application/pdf")
        .with_data(pdf_bytes)
        .build())
    
    svg_file = (duc.StateBuilder()
        .build_external_file()
        .with_key("test_svg")
        .with_mime_type("image/svg+xml")
        .with_data(svg_bytes)
        .build())
    
    png_file = (duc.StateBuilder()
        .build_external_file()
        .with_key("test_png")
        .with_mime_type("image/png")
        .with_data(png_bytes)
        .build())
    
    jpeg_file = (duc.StateBuilder()
        .build_external_file()
        .with_key("test_jpeg")
        .with_mime_type("image/jpeg")
        .with_data(jpeg_bytes)
        .build())
    
    files = [pdf_file, svg_file, png_file, jpeg_file]
    
    elements = []
    
    # PDF Element
    pdf_element = (duc.ElementBuilder()
        .at_position(100, 100)
        .with_size(200, 300)
        .with_label("PDF Element")
        .with_styles(duc.create_simple_styles())
        .build_pdf_element()
        .with_file_id("test_pdf")
        .build())
    elements.append(pdf_element)
    
    # Image Element
    image_element = (duc.ElementBuilder()
        .at_position(350, 100)
        .with_size(250, 200)
        .with_label("SVG Image Element")
        .with_styles(duc.create_simple_styles())
        .build_image_element()
        .with_file_id("test_svg")
        .with_scale([1.0, 1.0])
        .build())
    elements.append(image_element)
    
    # PNG Element
    png_element = (duc.ElementBuilder()
        .at_position(650, 100)
        .with_size(250, 200)
        .with_label("PNG Image Element (DOT)")
        .with_styles(duc.create_simple_styles())
        .build_image_element()
        .with_file_id("test_png")
        .with_scale([1.0, 1.0])
        .build())
    elements.append(png_element)
    
    # JPEG Element
    jpeg_element = (duc.ElementBuilder()
        .at_position(100, 450)
        .with_size(250, 200)
        .with_label("JPEG Image Element")
        .with_styles(duc.create_simple_styles())
        .build_image_element()
        .with_file_id("test_jpeg")
        .with_scale([1.0, 1.0])
        .build())
    elements.append(jpeg_element)
    
    print(f"Created {len(elements)} elements with {len(files)} external files")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_pdf_image_elements.duc")
    duc.write_duc_file(
        file_path=output_file,
        name="PdfImageElementsTest",
        elements=elements,
        external_files=files
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(elements)} elements and {len(files)} files")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    parsed_files = parsed_data.files
    
    assert len(parsed_elements) == len(elements)
    assert len(parsed_files) == len(files)
    print(f"✅ Parsed {len(parsed_elements)} elements and {len(parsed_files)} files")
    
    # === VERIFICATION ===
    print("🗑️ DELETE: Removing PDF element...")
    
    elements_to_keep = [el for el in parsed_elements if 
                       not (hasattr(el.element, 'base') and el.element.base.label == "PDF Element")]
    
    print(f"Deleted 1 element, keeping {len(elements_to_keep)}")
    
    # === SERIALIZE FINAL ===
    print("💾 SERIALIZE FINAL: Saving the final state...")
    final_output_file = os.path.join(test_output_dir, "test_pdf_image_elements_final.duc")
    duc.write_duc_file(
        file_path=final_output_file,
        name="PdfImageElementsTestFinal",
        elements=elements_to_keep,
        external_files=parsed_files
    )
    
    assert os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0
    print(f"✅ Final serialized {len(elements_to_keep)} elements")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking parsed elements...")
    
    assert len(parsed_elements) == 4
    assert len(parsed_files) == 4
    
    # Check PDF element
    pdf_el = next(el for el in parsed_elements if hasattr(el.element, 'base') and el.element.base.label == "PDF Element")
    assert pdf_el.element.base.width == 200
    assert pdf_el.element.base.height == 300
    
    # Check SVG element
    svg_el = next(el for el in parsed_elements if hasattr(el.element, 'base') and el.element.base.label == "SVG Image Element")
    assert svg_el.element.base.width == 250
    assert svg_el.element.base.height == 200
    
    # Check PNG element
    png_el = next(el for el in parsed_elements if hasattr(el.element, 'base') and el.element.base.label == "PNG Image Element (DOT)")
    assert png_el.element.base.width == 250
    assert png_el.element.base.height == 200

    # Check JPEG element
    jpeg_el = next(el for el in parsed_elements if hasattr(el.element, 'base') and el.element.base.label == "JPEG Image Element")
    assert jpeg_el.element.base.width == 250
    assert jpeg_el.element.base.height == 200
    
    print("✅ CSP PDF and Image Elements test completed successfully!")
    print(f"   - Created PDF, SVG, PNG, and JPEG elements with external files")
    print(f"   - Parsed {len(parsed_elements)} elements and {len(parsed_files)} files")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir
