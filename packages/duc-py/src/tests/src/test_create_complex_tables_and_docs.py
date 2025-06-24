"""
Test creating complex table and document elements.
"""
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from ducpy.classes.DucElementClass import (
    DucTableElement, DucDocElement, DucTableStyleProps, DucTableColumn, 
    DucTableRow, DucTableCell, DucTableStyle
)
from ducpy.classes.AppStateClass import AppState
from ducpy.utils.ElementTypes import (
    ElementContentBase, ElementBackground
)
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.parse.parse_duc import parse_duc_flatbuffers
import random
import string

def generate_random_id(length=8):
    """Generate a random string ID"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color():
    """Generate a random hex color"""
    return f"#{random.randint(0, 0xFFFFFF):06x}"

def test_create_complex_tables_and_docs(test_output_dir):
    """Test creating complex table and document elements with various styling"""
    
    elements = []
    
    # Create a complex table with multiple columns, rows, and cells
    table_id = generate_random_id()
    
    # Define table styling
    default_style = DucTableStyleProps(
        background_color="#000000",
        border_width=1.0,
        border_dashes=[],
        border_color="#cccccc",
        text_color="#333333",
        text_size=12.0,
        text_font="Arial",
        text_align=1  # Left align
    )
    
    # Create column definitions
    columns = [
        DucTableColumn(id="col1", width=80.0, style=DucTableStyleProps(
            background_color="#f8f9fa",
            text_color="#495057",
            text_size=11.0,
            text_align=2  # Center align
        )),
        DucTableColumn(id="col2", width=150.0, style=default_style),
        DucTableColumn(id="col3", width=100.0, style=DucTableStyleProps(
            background_color="#e9ecef",
            text_color="#6c757d",
            text_size=12.0,
            text_align=3  # Right align
        )),
        DucTableColumn(id="col4", width=240.0, style=default_style)
    ]
    
    # Create row definitions
    rows = [
        DucTableRow(id="header", height=35.0, style=DucTableStyleProps(
            background_color="#007bff",
            text_color="#ffffff",
            text_size=14.0,
            text_font="Arial Bold",
            text_align=2  # Center align
        )),
        DucTableRow(id="row1", height=30.0, style=default_style),
        DucTableRow(id="row2", height=30.0, style=DucTableStyleProps(
            background_color="#f8f9fa",
            text_color="#333333",
            text_size=12.0
        )),
        DucTableRow(id="row3", height=30.0, style=default_style),
        DucTableRow(id="row4", height=30.0, style=DucTableStyleProps(
            background_color="#f8f9fa",
            text_color="#333333",
            text_size=12.0
        ))
    ]
    
    # Create table cells with varied content
    cells = [
        # Header row
        DucTableCell(row_id="header", column_id="col1", data="ID", style=rows[0].style),
        DucTableCell(row_id="header", column_id="col2", data="Product Name", style=rows[0].style),
        DucTableCell(row_id="header", column_id="col3", data="Price", style=rows[0].style),
        DucTableCell(row_id="header", column_id="col4", data="Description", style=rows[0].style),
        
        # Data rows
        DucTableCell(row_id="row1", column_id="col1", data="001", style=default_style),
        DucTableCell(row_id="row1", column_id="col2", data="Gaming Laptop", style=default_style),
        DucTableCell(row_id="row1", column_id="col3", data="$1,299.99", style=DucTableStyleProps(
            background_color="#d1ecf1",
            text_color="#0c5460",
            text_size=14.0,
            text_align=3
        )),
        DucTableCell(row_id="row1", column_id="col4", data="High-performance laptop with 16GB RAM", style=default_style),
        
        DucTableCell(row_id="row2", column_id="col1", data="002", style=default_style),
        DucTableCell(row_id="row2", column_id="col2", data="Wireless Mouse", style=default_style),
        DucTableCell(row_id="row2", column_id="col3", data="$49.99", style=DucTableStyleProps(
            background_color="#d4edda",
            text_color="#155724", 
            text_size=14.0,
            text_align=3
        )),
        DucTableCell(row_id="row2", column_id="col4", data="Ergonomic wireless mouse with precision tracking", style=default_style),
        
        DucTableCell(row_id="row3", column_id="col1", data="003", style=default_style),
        DucTableCell(row_id="row3", column_id="col2", data="Mechanical Keyboard", style=default_style),
        DucTableCell(row_id="row3", column_id="col3", data="$129.99", style=DucTableStyleProps(
            background_color="#d4edda",
            text_color="#155724",
            text_size=14.0, 
            text_align=3
        )),
        DucTableCell(row_id="row3", column_id="col4", data="Cherry MX switches with RGB backlighting", style=default_style),
        
        DucTableCell(row_id="row4", column_id="col1", data="004", style=default_style),
        DucTableCell(row_id="row4", column_id="col2", data="4K Monitor", style=default_style),
        DucTableCell(row_id="row4", column_id="col3", data="$599.99", style=DucTableStyleProps(
            background_color="#f8d7da",
            text_color="#721c24",
            text_size=14.0,
            text_align=3
        )),
        DucTableCell(row_id="row4", column_id="col4", data="27-inch 4K display with HDR support", style=default_style)
    ]
    
    # Create table style
    table_style = DucTableStyle(default_props=default_style)
    
    # Create the table element
    table_element = DucTableElement(
        id=table_id,
        x=100.0,
        y=100.0,
        width=570.0,
        height=170.0,
        angle=0.0,
        opacity=1.0,
        is_visible=True,
        is_deleted=False,
        locked=False,
        scope="main",
        label="Product Inventory Table",
        group_ids=[],
        bound_elements=[],
        link="",
        frame_id="",
        z_index=1,
        column_order=["col1", "col2", "col3", "col4"],
        row_order=["header", "row1", "row2", "row3", "row4"],
        columns=columns,
        rows=rows,
        cells=cells,
        style=default_style
    )
    
    elements.append(table_element)
    
    # Create multiple document elements with varied content
    doc_contents = [
        """# Product Documentation

## Overview
This document outlines the specifications and features of our latest product line.

### Key Features
- High performance processing
- Energy efficient design  
- User-friendly interface
- Advanced security features

### Technical Specifications
- Processor: Latest generation CPU
- Memory: Up to 32GB RAM
- Storage: SSD up to 2TB
- Connectivity: Wi-Fi 6, Bluetooth 5.0

For more information, please contact our support team.""",

        """# Meeting Notes - Q1 Planning

**Date:** March 15, 2024  
**Attendees:** Product Team, Engineering, Marketing

## Agenda Items
1. Q1 Goals Review
2. Product Roadmap Updates
3. Resource Allocation
4. Timeline Adjustments

## Action Items
- [ ] Finalize feature specifications
- [ ] Update project timeline
- [ ] Schedule design reviews
- [ ] Prepare user testing scenarios

## Next Steps
Follow up meeting scheduled for March 22nd to review progress.""",

        """# API Reference Guide

## Authentication
All API requests require authentication using an API key.

```python
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.example.com/data', headers=headers)
```

## Endpoints

### GET /users
Retrieve list of users

**Parameters:**
- `limit` (optional): Number of results to return
- `offset` (optional): Number of results to skip

**Response:**
```json
{
  "users": [...],
  "total": 150,
  "page": 1
}
```"""
    ]
    
    # Create document elements
    for i, content in enumerate(doc_contents):
        doc_id = generate_random_id()
        doc_element = DucDocElement(
            id=doc_id,
            x=100.0 + (i * 250),
            y=350.0,
            width=220.0,
            height=300.0,
            angle=0.0,
            opacity=1.0,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label=f"Document {i+1}",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=i + 2,
            content=content
        )
        elements.append(doc_element)
    
    # Create app state
    app_state = AppState()
    
    # Test serialization and save to file
    output_file = os.path.join(test_output_dir, "test_complex_tables_and_docs.duc")
    serialized_data = save_as_flatbuffers(elements, app_state, {})
    
    # Save to file
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
    
    print(f"Serialized {len(elements)} elements successfully!")
    print(f"Saved to: {output_file}")
    
    # Test parsing
    import io
    parsed_data = parse_duc_flatbuffers(io.BytesIO(serialized_data))
    parsed_elements = parsed_data['elements']
    parsed_app_state = parsed_data['appState']
    parsed_binary_files = parsed_data['files']
    print(f"Parsed {len(parsed_elements)} elements successfully!")
    
    # Verify the parsed data
    assert len(parsed_elements) == len(elements), f"Expected {len(elements)} elements, got {len(parsed_elements)}"
    
    # Verify table element
    table_parsed = next((e for e in parsed_elements if e.id == table_id), None)
    assert table_parsed is not None, "Table element not found in parsed data"
    assert len(table_parsed.columns) == 4, f"Expected 4 columns, got {len(table_parsed.columns)}"
    assert len(table_parsed.rows) == 5, f"Expected 5 rows, got {len(table_parsed.rows)}"
    assert len(table_parsed.cells) == 20, f"Expected 20 cells, got {len(table_parsed.cells)}"
    
    # Verify document elements
    doc_elements = [e for e in parsed_elements if hasattr(e, 'content')]
    assert len(doc_elements) == 3, f"Expected 3 document elements, got {len(doc_elements)}"
    
    # Verify file was created
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"
    
    print("✅ Complex tables and docs test passed!")

if __name__ == "__main__":
    test_create_complex_tables_and_docs() 