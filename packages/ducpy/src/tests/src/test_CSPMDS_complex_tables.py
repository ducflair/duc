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
    
    # Create custom styles for different table types
    
    # Header style with bold, centered text
    header_text_style = duc.create_text_style(
        font_family="Arial Bold",
        font_size=14,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.MIDDLE
    )
    
    header_cell_style = duc.create_table_cell_style(
        text_style=header_text_style,
        margins=duc.Margins(top=4, right=6, bottom=4, left=6),
        alignment=duc.TABLE_CELL_ALIGNMENT.MIDDLE_CENTER
    )
    
    # Data style with left-aligned text
    data_text_style = duc.create_text_style(
        font_family="Arial",
        font_size=12,
        text_align=duc.TEXT_ALIGN.LEFT,
        vertical_align=duc.VERTICAL_ALIGN.TOP
    )
    
    data_cell_style = duc.create_table_cell_style(
        text_style=data_text_style,
        margins=duc.Margins(top=2, right=4, bottom=2, left=4),
        alignment=duc.TABLE_CELL_ALIGNMENT.TOP_LEFT
    )
    
    # Main table style with professional appearance
    main_table_style = duc.create_table_style(
        header_row_style=header_cell_style,
        data_row_style=data_cell_style,
        data_column_style=data_cell_style,
        flow_direction=duc.TABLE_FLOW_DIRECTION.DOWN
    )
    
    # Create main table using the improved API with custom styling
    main_table_data = [
        ["Element A", "Rectangle", "100x50"],
        ["Element B", "Circle", "r=25"],
        ["Element C", "Line", "length=75"],
        ["Element D", "Text", "Sample"]
    ]
    
    main_table = duc.create_table_from_data(
        x=50, y=50, width=300, height=120,
        data=main_table_data,
        column_headers=["Name", "Type", "Value"],
        column_widths=[100, 80, 120],
        row_height=30,
        style=main_table_style,
        label="Main Data Table"
    )
    elements.append(main_table)
    
    # Create summary table with compact styling
    summary_text_style = duc.create_text_style(
        font_family="Arial",
        font_size=11,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.MIDDLE
    )
    
    summary_cell_style = duc.create_table_cell_style(
        text_style=summary_text_style,
        margins=duc.Margins(top=1, right=2, bottom=1, left=2),
        alignment=duc.TABLE_CELL_ALIGNMENT.MIDDLE_CENTER
    )
    
    summary_table_style = duc.create_table_style(
        header_row_style=summary_cell_style,
        data_row_style=summary_cell_style,
        data_column_style=summary_cell_style,
        flow_direction=duc.TABLE_FLOW_DIRECTION.DOWN
    )
    
    summary_table_data = [
        ["Shapes", "3"],
        ["Text", "1"], 
        ["Total", "4"]
    ]
    
    summary_table = duc.create_table_from_data(
        x=400, y=100, width=130, height=75,
        data=summary_table_data,
        column_headers=["Category", "Count"],
        column_widths=[80, 50],
        row_height=25,
        style=summary_table_style,
        label="Summary Table"
    )
    elements.append(summary_table)
    
    # Create complex table using low-level API for maximum control
    complex_columns = [
        duc.create_table_column(id="id_col", width=60),
        duc.create_table_column(id="name_col", width=60), 
        duc.create_table_column(id="type_col", width=60),
        duc.create_table_column(id="value_col", width=60)
    ]
    
    complex_rows = [
        duc.create_table_row(id="header_row", height=35),
        duc.create_table_row(id="data_row_1", height=30),
        duc.create_table_row(id="data_row_2", height=30),
        duc.create_table_row(id="data_row_3", height=30),
        duc.create_table_row(id="data_row_4", height=30)
    ]
    
    # Create cells with advanced features
    complex_title_span = duc.create_table_cell_span(columns=4, rows=1)
    
    complex_cells = [
        # Spanning header cell
        duc.create_table_cell(
            row_id="header_row", 
            column_id="id_col", 
            data="Advanced Data Analysis Report",
            span=complex_title_span
        ),
        
        # Data cells with individual styling
        duc.create_table_cell(row_id="data_row_1", column_id="id_col", data="001"),
        duc.create_table_cell(row_id="data_row_1", column_id="name_col", data="Alpha"),
        duc.create_table_cell(row_id="data_row_1", column_id="type_col", data="Type A"),
        duc.create_table_cell(row_id="data_row_1", column_id="value_col", data="100"),
        
        duc.create_table_cell(row_id="data_row_2", column_id="id_col", data="002"),
        duc.create_table_cell(row_id="data_row_2", column_id="name_col", data="Beta"),
        duc.create_table_cell(row_id="data_row_2", column_id="type_col", data="Type B"),
        duc.create_table_cell(row_id="data_row_2", column_id="value_col", data="200"),
        
        duc.create_table_cell(row_id="data_row_3", column_id="id_col", data="003"),
        duc.create_table_cell(row_id="data_row_3", column_id="name_col", data="Gamma"),
        duc.create_table_cell(row_id="data_row_3", column_id="type_col", data="Type A"),
        duc.create_table_cell(row_id="data_row_3", column_id="value_col", data="150"),
        
        duc.create_table_cell(row_id="data_row_4", column_id="id_col", data="004"),
        duc.create_table_cell(row_id="data_row_4", column_id="name_col", data="Delta"),
        duc.create_table_cell(row_id="data_row_4", column_id="type_col", data="Type C"),
        duc.create_table_cell(row_id="data_row_4", column_id="value_col", data="300")
    ]
    
    # Advanced table with auto-sizing and custom styling
    complex_auto_size = duc.create_table_auto_size(columns=False, rows=True)
    
    # Advanced header style with different formatting
    advanced_header_style = duc.create_text_style(
        font_family="Times New Roman Bold",
        font_size=16,
        text_align=duc.TEXT_ALIGN.CENTER,
        vertical_align=duc.VERTICAL_ALIGN.MIDDLE
    )
    
    advanced_header_cell_style = duc.create_table_cell_style(
        text_style=advanced_header_style,
        margins=duc.Margins(top=6, right=8, bottom=6, left=8),
        alignment=duc.TABLE_CELL_ALIGNMENT.MIDDLE_CENTER
    )
    
    advanced_table_style = duc.create_table_style(
        header_row_style=advanced_header_cell_style,
        data_row_style=data_cell_style,
        data_column_style=data_cell_style,
        flow_direction=duc.TABLE_FLOW_DIRECTION.DOWN
    )
    
    complex_table = duc.create_table_element(
        x=100, y=300, width=240, height=150,
        columns=complex_columns,
        rows=complex_rows,
        cells=complex_cells,
        style=advanced_table_style,
        header_row_count=1,
        auto_size=complex_auto_size,
        label="Complex Data Table"
    )
    elements.append(complex_table)
    
    print(f"Created {len(elements)} DucTableElement objects")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_tables_initial.duc")
    serialized_data = duc.serialize_duc(name="TablesCSPMDS_Initial", elements=elements)
    
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
    
    # Verify table structure
    table_elements = []
    
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            table_elements.append(el_wrapper)
    
    print(f"Found {len(table_elements)} table elements")
    
    # Verify we loaded the correct number of tables
    assert len(table_elements) == 3, f"Expected 3 table elements, found {len(table_elements)}"
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying table structures...")
    
    mutations_count = 0
    
    # Resize and move tables
    for el_wrapper in loaded_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            # Scale tables based on their label
            if "Main" in el_wrapper.element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    x=el_wrapper.element.base.x + 20,
                    y=el_wrapper.element.base.y + 10,
                    width=el_wrapper.element.base.width * 1.2,
                    height=el_wrapper.element.base.height * 1.1
                )
                mutations_count += 1
            elif "Summary" in el_wrapper.element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    x=el_wrapper.element.base.x - 30,
                    y=el_wrapper.element.base.y + 25,
                    width=el_wrapper.element.base.width * 0.9,
                    height=el_wrapper.element.base.height * 0.8
                )
                mutations_count += 1
            elif "Complex" in el_wrapper.element.base.label:
                duc.mutate_element(
                    el_wrapper,
                    x=el_wrapper.element.base.x + 15,
                    y=el_wrapper.element.base.y - 20,
                    width=el_wrapper.element.base.width * 1.1,
                    height=el_wrapper.element.base.height * 1.05
                )
                mutations_count += 1
    
    print(f"Applied {mutations_count} table-related mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some table elements...")
    
    # Remove the summary table and complex table (keep only main table for final verification)
    elements_to_delete = []
    for i, el_wrapper in enumerate(loaded_elements):
        if isinstance(el_wrapper.element, duc.DucTableElement):
            if "Summary" in el_wrapper.element.base.label or "Complex" in el_wrapper.element.base.label:
                elements_to_delete.append(i)
    
    # Remove elements (in reverse order to maintain indices)
    for i in reversed(elements_to_delete):
        el = loaded_elements[i]
        print(f"Deleting table: {el.element.base.label}")
        del loaded_elements[i]
    
    print(f"Deleted {len(elements_to_delete)} table elements")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_tables_final.duc")
    final_serialized_data = duc.serialize_duc(name="TablesCSPMDS_Final", elements=loaded_elements)
    
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
    
    # Verify only table elements remain (no decorative elements)
    final_table_elements = []
    
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucTableElement):
            final_table_elements.append(el_wrapper)
        else:
            # Should not have any non-table elements in this test
            assert False, f"Found non-table element: {type(el_wrapper.element)}"
    
    print(f"Final table elements: {len(final_table_elements)}")
    
    # Should only have main table left after deletions
    assert len(final_table_elements) == 1, f"Should only have main table remaining, found {len(final_table_elements)}"
    remaining_table = final_table_elements[0]
    assert "Main" in remaining_table.element.base.label, "Remaining table should be the main table"
    
    # Verify no summary or complex tables remain
    for el_wrapper in final_table_elements:
        assert "Summary" not in el_wrapper.element.base.label, "No summary table should remain"
        assert "Complex" not in el_wrapper.element.base.label, "No complex table should remain"
    
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
