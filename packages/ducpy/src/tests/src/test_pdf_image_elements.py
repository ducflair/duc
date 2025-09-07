"""
CSPMDS Test for PDF and Image Elements: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests DucPdfElements with pdf files and DucImageElements with svg files.
"""
import os
import pytest

import ducpy as duc


def test_cspmds_pdf_image_elements(test_output_dir):
    """
    CSPMDS test for PDF and Image elements:
    - Create: DucPdfElement with pdf file and DucImageElement with svg file
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify element properties
    - Delete: Remove one element
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating PDF and Image elements...")
    
    # Load assets
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
    pdf_bytes = open(os.path.join(assets_dir, "test.pdf"), "rb").read()
    svg_bytes = open(os.path.join(assets_dir, "hawaii.svg"), "rb").read()
    
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
    
    files = [pdf_file, svg_file]
    
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
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying element properties...")
    
    # Mutate PDF element: change size
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'base') and el_wrapper.element.base.label == "PDF Element":
            duc.mutate_element(el_wrapper, width=250, height=350)
    
    # Mutate Image element: change scale
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'base') and el_wrapper.element.base.label == "SVG Image Element":
            duc.mutate_element(el_wrapper, width=300, height=250)
    
    # === DELETE ===
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
    print("✅ VERIFICATION: Checking final state...")
    
    final_parsed_data = duc.read_duc_file(final_output_file)
    final_elements = final_parsed_data.elements
    final_files = final_parsed_data.files
    
    assert len(final_elements) == len(elements_to_keep)
    assert len(final_elements) < len(elements)
    assert len(final_files) == len(files)
    
    # Check mutated image element
    image_final = next(el for el in final_elements if 
                      hasattr(el.element, 'base') and el.element.base.label == "SVG Image Element")
    assert image_final.element.base.width == 300
    assert image_final.element.base.height == 250
    
    # Check PDF element deleted
    pdf_elements = [el for el in final_elements if 
                   hasattr(el.element, 'base') and el.element.base.label == "PDF Element"]
    assert len(pdf_elements) == 0
    
    print("✅ CSPMDS PDF and Image Elements test completed successfully!")
    print(f"   - Created PDF and SVG elements with external files")
    print(f"   - Mutated element sizes")
    print(f"   - Deleted PDF element")
    print(f"   - Final state: {len(final_elements)} elements, {len(final_files)} files")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir
