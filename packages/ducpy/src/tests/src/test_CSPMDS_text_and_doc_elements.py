"""
CSPMDS Test for Text and Doc Elements: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of DucTextElement and DucDocElement with comprehensive text features.
"""
import io
import os
import random
import pytest

import ducpy as duc


def test_cspmds_text_and_doc_elements(test_output_dir):
    """
    CSPMDS test for text and doc elements:
    - Create: Create various text and document elements with different styles and features
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify text content, styles, and formatting
    - Delete: Remove some text elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating DucTextElement and DucDocElement objects...")
    
    elements = []
    
    # Create various text styles for different purposes
    
    # Title text style - large, bold, centered
    title_text_style = duc.create_text_style(
        font_family="Arial Bold",
        font_size=24,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.MIDDLE,
        line_height=1.2
    )
    
    # Header text style - medium, bold, left-aligned
    header_text_style = duc.create_text_style(
        font_family="Arial Bold",
        font_size=18,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP,
        line_height=1.3
    )
    
    # Body text style - normal, readable
    body_text_style = duc.create_text_style(
        font_family="Arial",
        font_size=12,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP,
        line_height=1.5
    )
    
    # Caption text style - small, italic
    caption_text_style = duc.create_text_style(
        font_family="Arial Italic",
        font_size=10,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.BOTTOM,
        line_height=1.1
    )
    
    # Code text style - monospace
    code_text_style = duc.create_text_style(
        font_family="Courier New",
        font_size=11,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP,
        line_height=1.4
    )
    
    # === CREATE TEXT ELEMENTS ===
    
    # 1. Document title
    title_element = duc.create_text_element(
        x=200, y=50, width=400, height=40,
        text="Technical Drawing Specification Document",
        text_style=title_text_style,
        auto_resize=True,
        label="Document Title"
    )
    elements.append(title_element)
    
    # 2. Section header
    section_header = duc.create_text_element(
        x=50, y=120, width=300, height=30,
        text="1. General Requirements",
        text_style=header_text_style,
        auto_resize=False,
        label="Section Header"
    )
    elements.append(section_header)
    
    # 3. Body text with line breaks
    body_text = duc.create_text_element(
        x=50, y=170, width=500, height=100,
        text="""This document outlines the technical specifications for mechanical drawings.
All dimensions shall be in millimeters unless otherwise specified.
Tolerances shall conform to ISO 2768-m standard.
Materials and finishes are specified in the accompanying schedules.""",
        text_style=body_text_style,
        auto_resize=False,
        label="Body Text"
    )
    elements.append(body_text)
    
    # 4. Technical note with special formatting
    technical_note = duc.create_text_element(
        x=400, y=120, width=250, height=60,
        text="NOTE: All welds shall be\ninspected per AWS D1.1\nstandards before final\nassembly.",
        text_style=body_text_style,
        auto_resize=True,
        label="Technical Note"
    )
    elements.append(technical_note)
    
    # 5. Caption text
    caption_element = duc.create_text_element(
        x=150, y=290, width=200, height=20,
        text="Figure 1: Assembly Overview",
        text_style=caption_text_style,
        auto_resize=True,
        label="Figure Caption"
    )
    elements.append(caption_element)
    
    # 6. Code or part number
    part_number = duc.create_text_element(
        x=500, y=290, width=150, height=25,
        text="P/N: MEC-2025-001-REV-A",
        text_style=code_text_style,
        auto_resize=True,
        label="Part Number"
    )
    elements.append(part_number)
    
    # 7. Multi-line technical specification
    tech_spec = duc.create_text_element(
        x=50, y=330, width=300, height=120,
        text="""
          MATERIAL SPECIFICATIONS:
            • Base Material: ASTM A36 Steel
            • Coating: Hot-Dip Galvanized
            • Thickness: 6mm ± 0.5mm
            • Surface Finish: 125 μin Ra max
            • Heat Treatment: Stress Relieved
        """,
        text_style=body_text_style,
        auto_resize=False,
        label="Technical Specifications"
    )
    elements.append(tech_spec)
    
    # === CREATE DOC ELEMENTS ===
    
    # Create document styles for rich text formatting
    
    # Document heading style
    doc_heading_style = duc.create_text_style(
        font_family="Times New Roman Bold",
        font_size=16,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP,
        line_height=1.4
    )
    
    # Document body style
    doc_body_style = duc.create_text_style(
        font_family="Times New Roman",
        font_size=12,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP,
        line_height=1.6
    )
    
    # Create paragraph formatting
    paragraph_formatting = duc.create_paragraph_formatting(
        first_line_indent=12.0,
        hanging_indent=0.0,
        left_indent=6.0,
        right_indent=6.0,
        space_before=6.0,
        space_after=6.0,
        tab_stops=[24.0, 48.0, 72.0, 96.0]
    )

    # Create stack format for fractions and special text
    stack_format_props = duc.create_stack_format_properties(
        upper_scale=0.7,
        lower_scale=0.7,
        alignment=duc.STACKED_TEXT_ALIGN.CENTER
    )

    stack_format = duc.create_stack_format(
        auto_stack=True,
        stack_chars=["/", "\\", "#"],
        properties=stack_format_props
    )

    # Create comprehensive document style
    doc_style = duc.create_doc_style(
        text_style=doc_body_style,
        paragraph=paragraph_formatting,
        stack_format=stack_format
    )

    # Create column layout for multi-column text
    text_columns = [
        duc.create_text_column(width=200, gutter=20),
        duc.create_text_column(width=200, gutter=0)
    ]

    column_layout = duc.create_column_layout(
        definitions=text_columns,
        auto_height=True,
        column_type=duc.COLUMN_TYPE.STATIC_COLUMNS
    )    # 8. Rich document element with advanced formatting
    rich_document = duc.create_doc_element(
        x=400, y=330, width=420, height=200,
        text="""DESIGN METHODOLOGY

This section describes the systematic approach used in the mechanical design process. The methodology incorporates industry best practices and follows established engineering principles.

Key Design Principles:
1. Structural integrity and safety factors
2. Manufacturing feasibility and cost optimization  
3. Material selection based on service environment
4. Compliance with applicable codes and standards

The design process includes iterative analysis using finite element methods to ensure optimal performance under specified loading conditions. All calculations assume standard atmospheric conditions unless noted otherwise.

Special attention is given to fatigue analysis for components subject to cyclic loading, with safety factors applied per ASME standards.""",
        style=doc_style,
        columns=column_layout,
        auto_resize=False,
        flow_direction=duc.TEXT_FLOW_DIRECTION.LEFT_TO_RIGHT,
        label="Rich Document"
    )
    elements.append(rich_document)
    
    # 9. Simple document with different formatting
    simple_doc_style = duc.create_doc_style(
        text_style=doc_heading_style,
        paragraph=duc.create_paragraph_formatting(
            first_line_indent=0.0,
            hanging_indent=0.0,
            left_indent=0.0,
            right_indent=0.0,
            space_before=0.0,
            space_after=12.0,
            tab_stops=[]
        ),
        stack_format=stack_format
    )

    single_column = duc.create_column_layout(
        definitions=[duc.create_text_column(width=300, gutter=0)],
        auto_height=True,
        column_type=duc.COLUMN_TYPE.STATIC_COLUMNS
    )
    
    revision_history = duc.create_doc_element(
        x=50, y=480, width=300, height=100,
        text="""REVISION HISTORY
Rev A: Initial release - 2025-01-15
Rev B: Updated tolerances - 2025-02-20
Rev C: Material specification change - 2025-03-10""",
        style=simple_doc_style,
        columns=single_column,
        auto_resize=True,
        flow_direction=duc.TEXT_FLOW_DIRECTION.LEFT_TO_RIGHT,
        label="Revision History"
    )
    elements.append(revision_history)
    
    print(f"Created {len(elements)} text and document elements")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_text_doc_initial.duc")
    serialized_data = duc.serialize_duc(name="TextDocCSPMDS_Initial", elements=elements)
    
    with open(initial_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    
    assert len(loaded_elements) == len(elements)
    print(f"Loaded {len(loaded_elements)} elements")
    
    # Verify element types
    text_elements = []
    doc_elements = []
    
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, duc.DucTextElement):
            text_elements.append(el_wrapper)
        elif isinstance(el_wrapper.element, duc.DucDocElement):
            doc_elements.append(el_wrapper)
    
    print(f"Found {len(text_elements)} text elements and {len(doc_elements)} doc elements")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying text content and formatting...")
    
    mutations_count = 0
    
    # Mutate text elements
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, duc.DucTextElement):
            element = el_wrapper.element
            
            # Update document title
            if "Document Title" in element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    text="UPDATED: Technical Drawing Specification Document v2.0",
                    width=element.base.width * 1.1
                )
                mutations_count += 1
                print(f"Updated title text")
            
            # Update section headers
            elif "Section Header" in element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    text="1. REVISED General Requirements"
                )
                mutations_count += 1
                print(f"Updated section header")
            
            # Update body text
            elif "Body Text" in element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    text=element.text + "\n\nUPDATE: This revision includes new safety requirements."
                )
                mutations_count += 1
                print(f"Updated body text")
            
            # Move and resize technical note
            elif "Technical Note" in element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    x=element.base.x + 50,
                    y=element.base.y + 20,
                    width=element.base.width * 1.2,
                    text="CRITICAL NOTE: All welds shall be\ninspected per AWS D1.1 standards\nand documented before final assembly."
                )
                mutations_count += 1
                print(f"Updated and moved technical note")
        
        # Mutate document elements  
        elif isinstance(el_wrapper.element, duc.DucDocElement):
            element = el_wrapper.element
            
            # Update rich document
            if "Rich Document" in element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    text=element.text.replace("DESIGN METHODOLOGY", "UPDATED DESIGN METHODOLOGY"),
                    height=element.base.height * 1.1
                )
                mutations_count += 1
                print(f"Updated rich document content")
            
            # Update revision history
            elif "Revision History" in element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    text=element.text + "\nRev D: Updated per new requirements - 2025-07-22"
                )
                mutations_count += 1
                print(f"Updated revision history")
    
    print(f"Applied {mutations_count} text/document mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some text elements...")
    
    # Remove caption and part number elements
    elements_to_delete = []
    for i, el_wrapper in enumerate(loaded_elements):
        if isinstance(el_wrapper.element, (duc.DucTextElement, duc.DucDocElement)):
            element = el_wrapper.element
            if ("Figure Caption" in element.base.label or 
                "Part Number" in element.base.label):
                elements_to_delete.append(i)
    
    # Remove elements (in reverse order to maintain indices)
    for i in reversed(elements_to_delete):
        el = loaded_elements[i]
        print(f"Deleting text element: {el.element.base.label}")
        del loaded_elements[i]
    
    print(f"Deleted {len(elements_to_delete)} text elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_text_doc_final.duc")
    final_serialized_data = duc.serialize_duc(name="TextDocCSPMDS_Final", elements=loaded_elements)
    
    with open(final_file, 'wb') as f:
        f.write(final_serialized_data)
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_elements = final_parsed_data.elements
    
    print(f"Final element count: {len(final_elements)}")
    assert len(final_elements) == len(loaded_elements)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    
    # Verify element types remain consistent
    final_text_elements = []
    final_doc_elements = []
    
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucTextElement):
            final_text_elements.append(el_wrapper)
        elif isinstance(el_wrapper.element, duc.DucDocElement):
            final_doc_elements.append(el_wrapper)
        else:
            # Should only have text and doc elements
            assert False, f"Found unexpected element type: {type(el_wrapper.element)}"
    
    print(f"Final text elements: {len(final_text_elements)}")
    print(f"Final doc elements: {len(final_doc_elements)}")
    
    # Verify mutations were applied by checking updated content
    title_found = False
    updated_content_found = False
    
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucTextElement):
            if "UPDATED:" in el_wrapper.element.text:
                title_found = True
            if "UPDATE:" in el_wrapper.element.text:
                updated_content_found = True
        elif isinstance(el_wrapper.element, duc.DucDocElement):
            if "UPDATED DESIGN METHODOLOGY" in el_wrapper.element.text:
                updated_content_found = True
    
    assert title_found, "Title should contain 'UPDATED:'"
    assert updated_content_found, "Some content should contain updates"
    
    # Verify deleted elements are gone
    remaining_labels = [el.element.base.label for el in final_elements]
    assert "Figure Caption" not in remaining_labels, "Figure caption should be deleted"
    assert "Part Number" not in remaining_labels, "Part number should be deleted"
    
    print("✅ CSPMDS Text and Doc Elements test completed successfully!")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])