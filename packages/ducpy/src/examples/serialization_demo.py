#!/usr/bin/env python3
"""
Example demonstrating how to serialize elements created by the Builder API into a .duc file.

This demo shows the correct pattern for taking in-memory python elements
and streaming them to a `.duc` file.
"""

import ducpy as duc
import tempfile
from ducpy.builders.style_builders import create_fill_and_stroke_style, create_solid_content

def main():
    print("Serialization Demo")
    print("=" * 30)
    
    print("1. Creating elements via Builder API...")
    elements = []
    
    # Create some basic elements
    rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 50)
        .with_label("Sample Rectangle")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#FF6B6B"),
            stroke_content=create_solid_content("#2C3E50"),
            stroke_width=2.0
        ))
        .build_rectangle()
        .build())
    elements.append(rect)
    
    ellipse = (duc.ElementBuilder()
        .at_position(120, 0)
        .with_size(60, 40)
        .with_label("Sample Ellipse")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#4ECDC4"),
            stroke_content=create_solid_content("#34495E"),
            stroke_width=1.5
        ))
        .build_ellipse()
        .build())
    elements.append(ellipse)
    
    print(f"   Created {len(elements)} elements.")
    
    print("2. Serializing to .duc format...")
    output = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    output.close()
    duc_path = duc.serialize_duc(
        name="serialization_example",
        output_path=output.name,
        elements=elements
    )
    
    print(f"   Successfully serialized to {duc_path}.")
    print("\n✅ Serialization demo complete!")
    return duc_path

if __name__ == "__main__":
    main()
