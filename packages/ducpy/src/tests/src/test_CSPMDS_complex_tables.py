"""
CSPMDS Test for Complex Tables: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of complex table elements in DUC files.
"""
import io
import os
import random
import pytest

import ducpy as duc


def test_cspmds_complex_tables(test_output_dir):
    """
    CSPMDS test for complex tables:
    - Create: Create table-like structures with various elements
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify table structure and content
    - Delete: Remove some table elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating DucTableElement objects with full styling...")
    
    elements = []
    
    # Create main table using the builders API
    main_table_data = [
        ["Element A", "Rectangle", "100x50"],
        ["Element B", "Circle", "r=25"],
        ["Element C", "Line", "length=75"],
        ["Element D", "Text", "Sample"]
    ]
    
    main_table = (duc.ElementBuilder() 
        .at_position(50, 50) 
        .with_size(300, 120) 
        .with_label("Main Data Table") 
        .build_table_from_data() 
        .with_data(main_table_data) 
        .with_table_style(duc.create_table_style()) 
        .with_header_row_count(1) 
        .build())
    elements.append(main_table)
    
    # Create summary table
    summary_table_data = [
        ["Total Elements", "4"],
        ["Rectangles", "1"],
        ["Circles", "1"],
        ["Lines", "1"],
        ["Text", "1"]
    ]
    
    summary_table = (duc.ElementBuilder() 
        .at_position(400, 50) 
        .with_size(200, 150) 
        .with_label("Summary Table") 
        .build_table_from_data() 
        .with_data(summary_table_data) 
        .with_table_style(duc.create_table_style())
        .with_auto_size(duc.DucTableAutoSize(columns=False, rows=True)) 
        .build())
    elements.append(summary_table)
    
    # Create detailed table
    detailed_table_data = [
        ["ID", "Name", "Position", "Size", "Color"],
        ["001", "Rect1", "(10,20)", "100x50", "#FF0000"],
        ["002", "Circle1", "(150,100)", "r=25", "#00FF00"],
        ["003", "Line1", "(50,200)", "length=75", "#0000FF"],
        ["004", "Text1", "(300,150)", "12pt", "#000000"]
    ]
    
    # Define a custom table style
    custom_table_style = duc.create_table_style(
        base_style=duc.create_simple_styles(
            strokes=[duc.create_stroke(duc.create_solid_content("#888888"), width=1.0)],
            backgrounds=[duc.create_background(duc.create_solid_content("#F0F0F0"))]
        ),
        header_row_style=duc.create_table_cell_style(
            base_style=duc.create_simple_styles(
                strokes=[duc.create_stroke(duc.create_solid_content("#000000"), width=1.0)],
                backgrounds=[duc.create_background(duc.create_solid_content("#CCCCCC"))]
            ),
            text_style=duc.create_text_style(font_size=14.0, font_family="Arial", text_align=duc.TEXT_ALIGN.CENTER),
            margins=duc.create_margins(top=5.0, right=5.0, bottom=5.0, left=5.0),
            alignment=duc.TABLE_CELL_ALIGNMENT.MIDDLE_CENTER
        ),
        data_row_style=duc.create_table_cell_style(
            base_style=duc.create_simple_styles(
                strokes=[duc.create_stroke(duc.create_solid_content("#AAAAAA"), width=1.0)],
                backgrounds=[duc.create_background(duc.create_solid_content("#FFFFFF"))]
            ),
            text_style=duc.create_text_style(font_size=12.0, font_family="Verdana", text_align=duc.TEXT_ALIGN.LEFT),
            margins=duc.create_margins(top=2.0, right=2.0, bottom=2.0, left=2.0),
            alignment=duc.TABLE_CELL_ALIGNMENT.MIDDLE_LEFT
        ),
        data_column_style=duc.create_table_cell_style(
            base_style=duc.create_simple_styles(), # Can be overridden by row/cell styles
            text_style=duc.create_text_style(text_align=duc.TEXT_ALIGN.LEFT),
            margins=duc.create_margins(),
            alignment=duc.TABLE_CELL_ALIGNMENT.MIDDLE_LEFT
        ),
        flow_direction=duc.TABLE_FLOW_DIRECTION.DOWN
    )

    detailed_table = (duc.ElementBuilder() 
        .at_position(50, 200) 
        .with_size(500, 200) 
        .with_label("Detailed Elements Table") 
        .build_table_from_data() 
        .with_data(detailed_table_data) 
        .with_table_style(custom_table_style) 
        .build())
    elements.append(detailed_table)

    # Create a table using `build_table_element` directly
    manual_columns = [
        duc.create_table_column(id="col_manual_1", width=80.0, style_overrides=None),
        duc.create_table_column(id="col_manual_2", width=120.0, style_overrides=None),
        duc.create_table_column(id="col_manual_3", width=100.0, style_overrides=None),
    ]
    manual_rows = [
        duc.create_table_row(id="row_manual_1", height=30.0, style_overrides=None),
        duc.create_table_row(id="row_manual_2", height=40.0, style_overrides=None),
    ]
    manual_cells = [
        duc.create_table_cell(row_id="row_manual_1", column_id="col_manual_1", data="Header A", locked=False, span=duc.create_table_cell_span(columns=1, rows=1), style_overrides=None),
        duc.create_table_cell(row_id="row_manual_1", column_id="col_manual_2", data="Header B", locked=False, span=duc.create_table_cell_span(columns=1, rows=1), style_overrides=None),
        duc.create_table_cell(row_id="row_manual_1", column_id="col_manual_3", data="Header C", locked=False, span=duc.create_table_cell_span(columns=1, rows=1), style_overrides=None),
        duc.create_table_cell(row_id="row_manual_2", column_id="col_manual_1", data="Data 1", locked=False, span=duc.create_table_cell_span(columns=1, rows=1), style_overrides=None),
        duc.create_table_cell(row_id="row_manual_2", column_id="col_manual_2", data="Data 2", locked=False, span=duc.create_table_cell_span(columns=1, rows=1), style_overrides=None),
        duc.create_table_cell(row_id="row_manual_2", column_id="col_manual_3", data="Data 3", locked=False, span=duc.create_table_cell_span(columns=1, rows=1), style_overrides=None),
    ]
    manual_column_order = [col.id for col in manual_columns]
    manual_row_order = [row.id for row in manual_rows]

    manual_table = (duc.ElementBuilder() 
        .at_position(50, 450) 
        .with_size(300, 100) 
        .with_label("Manual Table") 
        .build_table_element() 
        .with_columns([duc.create_table_column_entry(key=col.id, value=col) for col in manual_columns]) 
        .with_rows([duc.create_table_row_entry(key=row.id, value=row) for row in manual_rows]) 
        .with_cells([duc.create_table_cell_entry(key=f"{cell.row_id}_{cell.column_id}", value=cell) for cell in manual_cells]) 
        .with_header_row_count(1) 
        .with_table_style(custom_table_style)
        .with_auto_size(duc.create_table_auto_size(columns=True, rows=False)) 
        .build())
    elements.append(manual_table)

    print(f"Created {len(elements)} table elements")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_complex_tables_initial.duc")
    duc.write_duc_file(
        file_path=initial_file,
        name="ComplexTablesCSPMDS_Initial",
        elements=elements
    )
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.read_duc_file(initial_file)
    loaded_elements = parsed_data.elements
    
    assert len(loaded_elements) == len(elements)
    print(f"Loaded {len(loaded_elements)} elements")
    
    # Verify element types
    table_elements = []
    
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            table_elements.append(el_wrapper)
    
    print(f"Found {len(table_elements)} table elements")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying table content and structure...")
    
    mutations_count = 0
    
    # Mutate table elements by changing their properties
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            # Update main table
            if "Main Data Table" in el_wrapper.element.base.label:
                duc.mutate_element(el_wrapper, label="Updated Main Data Table")
                mutations_count += 1
                print(f"Updated main table label")

                # Mutate cell content: change "Element A" to "Modified Element A"
                # Find the cell for "Element A" (assuming it's row 0, col 0)
                for cell_entry in el_wrapper.element.cells:
                    if cell_entry.value.row_id == el_wrapper.element.row_order[0] and \
                       cell_entry.value.column_id == el_wrapper.element.column_order[0]:
                        duc.mutate_element(cell_entry.value, data="Modified Element A")
                        print("Mutated cell content in Main Data Table")
                        break

                # Mutate column width: change width of first column
                for col_entry in el_wrapper.element.columns:
                    if col_entry.key == el_wrapper.element.column_order[0]:
                        duc.mutate_element(col_entry.value, width=150.0)
                        print("Mutated column width in Main Data Table")
                        break

                # Mutate row height: change height of second row
                for row_entry in el_wrapper.element.rows:
                    if row_entry.key == el_wrapper.element.row_order[1]:
                        duc.mutate_element(row_entry.value, height=40.0)
                        print("Mutated row height in Main Data Table")
                        break
            
            # Update summary table
            elif "Summary Table" in el_wrapper.element.base.label:
                duc.mutate_element(el_wrapper, label="Updated Summary Table")
                mutations_count += 1
                print(f"Updated summary table label")
            
            # Update detailed table
            elif "Detailed Elements Table" in el_wrapper.element.base.label:
                duc.mutate_element(el_wrapper, label="Updated Detailed Elements Table")
                mutations_count += 1
                print(f"Updated detailed table label")

            # Update manual table
            elif "Manual Table" in el_wrapper.element.base.label:
                duc.mutate_element(el_wrapper, label="Updated Manual Table")
                mutations_count += 1
                print(f"Updated manual table label")
                # Mutate a cell in the manual table
                for cell_entry in el_wrapper.element.cells:
                    if cell_entry.value.row_id == "row_manual_2" and \
                       cell_entry.value.column_id == "col_manual_1":
                        duc.mutate_element(cell_entry.value, data="Modified Data 1")
                        print("Mutated cell content in Manual Table")
                        break
    
    print(f"Applied {mutations_count} table mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some table elements...")
    
    # Remove summary table
    elements_to_delete = []
    for i, el_wrapper in enumerate(loaded_elements):
        if isinstance(el_wrapper.element, duc.DucTableElement):
            element = el_wrapper.element
            if "Summary Table" in element.base.label:
                elements_to_delete.append(i)
    
    # Remove elements (in reverse order to maintain indices)
    for i in reversed(elements_to_delete):
        el = loaded_elements[i]
        print(f"Deleting table element: {el.element.base.label}")
        del loaded_elements[i]
    
    print(f"Deleted {len(elements_to_delete)} table elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_complex_tables_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="ComplexTablesCSPMDS_Final",
        elements=loaded_elements
    )
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.read_duc_file(final_file)
    final_elements = final_parsed_data.elements
    
    print(f"Final element count: {len(final_elements)}")
    assert len(final_elements) == len(loaded_elements)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    
    # Verify element types remain consistent
    final_table_elements = []
    
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            final_table_elements.append(el_wrapper)
        else:
            # Should only have table elements
            assert False, f"Found unexpected element type: {type(el_wrapper.element)}"
    
    print(f"Final table elements: {len(final_table_elements)}")
    
    # Verify mutations were applied by checking updated labels and content
    main_table_found = False
    detailed_table_found = False
    manual_table_found = False
    
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            if el_wrapper.element.base.label == "Updated Main Data Table":
                main_table_found = True
                assert el_wrapper.element.header_row_count == 1
                # Verify cell content mutation
                for cell_entry in el_wrapper.element.cells:
                    if cell_entry.value.row_id == el_wrapper.element.row_order[0] and \
                       cell_entry.value.column_id == el_wrapper.element.column_order[0]:
                        assert cell_entry.value.data == "Modified Element A"
                        print("✅ Verified cell content mutation in Main Data Table")
                        break
                # Verify column width mutation
                for col_entry in el_wrapper.element.columns:
                    if col_entry.key == el_wrapper.element.column_order[0]:
                        assert col_entry.value.width == 150.0
                        print("✅ Verified column width mutation in Main Data Table")
                        break
                # Verify row height mutation
                for row_entry in el_wrapper.element.rows:
                    if row_entry.key == el_wrapper.element.row_order[1]:
                        assert row_entry.value.height == 40.0
                        print("✅ Verified row height mutation in Main Data Table")
                        break
            
            elif el_wrapper.element.base.label == "Updated Detailed Elements Table":
                detailed_table_found = True
                # Verify custom table style application (e.g., header text style font size)
                # Accessing default style properties through the element's style
                # Note: Direct verification of complex nested styles might be cumbersome
                # A simpler check for a distinctive style property would be more practical.
                # For now, we assume the style object itself is correctly assigned.
                assert el_wrapper.element.style.header_row_style.text_style.font_size == 14.0
                assert el_wrapper.element.style.data_row_style.text_style.font_family == "Verdana"
                print("✅ Verified custom table style in Detailed Elements Table")
            
            elif el_wrapper.element.base.label == "Updated Manual Table":
                manual_table_found = True
                assert el_wrapper.element.header_row_count == 1
                assert el_wrapper.element.auto_size.columns == True
                assert el_wrapper.element.auto_size.rows == False
                # Verify mutated cell content
                for cell_entry in el_wrapper.element.cells:
                    if cell_entry.value.row_id == "row_manual_2" and \
                       cell_entry.value.column_id == "col_manual_1":
                        assert cell_entry.value.data == "Modified Data 1"
                        print("✅ Verified cell content mutation in Manual Table")
                        break
    
    assert main_table_found, "Main Data Table not found or not updated"
    assert detailed_table_found, "Detailed Elements Table not found or not updated"
    assert manual_table_found, "Manual Table not found or not updated"

    # Verify deleted elements are gone
    remaining_labels = [el.element.base.label for el in final_elements]
    assert "Summary Table" not in remaining_labels, "Summary table should be deleted"
    
    print("✅ CSPMDS Complex Tables test completed successfully!")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


if __name__ == "__main__":
    pytest.main([__file__])
