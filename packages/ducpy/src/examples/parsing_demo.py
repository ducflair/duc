#!/usr/bin/env python3
"""
Example demonstrating how to parse a .duc file using the parsing API.

This demo shows how to read a `.duc` binary blob or file path and access
the parsed data using attribute-style access via DucData.
"""

import os
import tempfile
import ducpy as duc

def main():
    print("Parsing Demo")
    print("=" * 30)

    # First, let's create a temporary .duc file to parse
    from ducpy.builders.style_builders import create_fill_and_stroke_style, create_solid_content
    elements = [
        duc.ElementBuilder()
            .at_position(10, 20)
            .with_size(100, 50)
            .with_label("Parsed Rectangle")
            .with_styles(create_fill_and_stroke_style(
                fill_content=create_solid_content("#FF6B6B"),
                stroke_content=create_solid_content("#2C3E50"),
                stroke_width=2.0
            ))
            .build_rectangle()
            .build()
    ]
    duc_bytes = duc.serialize_duc(name="parsing_example", elements=elements)
    
    with tempfile.NamedTemporaryFile(suffix=".duc", delete=False) as tmp:
        tmp.write(duc_bytes)
        tmp_path = tmp.name

    print("1. Parsing a .duc file from a file path...")
    
    # You can pass a string path directly to parse_duc
    parsed_data = duc.parse_duc(tmp_path)
    
    print(f"   Document Source: {parsed_data.source}")
    print(f"   Parsed {len(parsed_data.elements)} elements.")
    
    print("\n2. Accessing element attributes (snake_case)...")
    
    # Element properties are accessible via dot-notation with snake_case keys
    # because parse_duc returns a DucData object.
    first_element = parsed_data.elements[0]
    print(f"   Element ID: {first_element.id}")
    print(f"   Element Type: {first_element.type}")
    print(f"   Element Label: {first_element.label}")
    print(f"   Element Position: (X: {first_element.x}, Y: {first_element.y})")
    
    print("\n3. Parsing directly from raw bytes...")
    
    # You can also pass raw bytes directly to parse_duc
    parsed_from_bytes = duc.parse_duc(duc_bytes)
    print(f"   Parsed successfully from bytes. Found {len(parsed_from_bytes.elements)} elements.")
    
    # Clean up the temporary file
    os.unlink(tmp_path)
    
    print("\n✅ Parsing demo complete!")

if __name__ == "__main__":
    main()
