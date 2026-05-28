#!/usr/bin/env python3
"""
Example demonstrating how to build and serialize a Document element using Typst syntax.

This demo constructs a Document element containing rich Typst content (headings,
bold formatting, lists, tables) and serializes it into a .duc file.
"""

import ducpy as duc

def main():
    print("Document Element Demo")
    print("=" * 30)
    
    print("1. Designing rich Typst document content...")
    typst_doc_text = """#set text(font: "Inter", size: 10pt)

= Engineering Specification Report

This is *Typst* content written inside a DUC Document element.
It supports advanced typesetting features, styles, and structured data layouts.

== Key Deliverables
- 3D CAD modeling of assembly blocks
- Auto-validation of parametric shape dimensions
- Direct high-fidelity PDF and SVG exports

== Specification Summary Table
#table(
  columns: (1fr, 1.5fr),
  fill: (x, y) => if y == 0 { rgb("e6f2ff") } else { none },
  [Parameter], [Target Value],
  [Primary Framework], [build123d (Python)],
  [BIM Integration], [IfcOpenShell (IFC4)],
  [Vector Interchange], [ezdxf (DXF R2010)],
)
"""
    
    print("2. Building the Document element...")
    # Using ElementBuilder to specify position, bounds, and Document details
    doc_element = (
        duc.ElementBuilder()
        .at_position(50.0, 100.0)
        .with_size(500.0, 300.0)
        .with_label("Product Specification Sheet")
        .build_doc_element()
        .with_text(typst_doc_text)
        .build()
    )
    
    print(f"   Created document element with ID: {doc_element.element.base.id}")
    print(f"   Typst content length: {len(doc_element.element.text)} characters.")
    
    print("3. Serializing to .duc format...")
    # serialize_duc runs validation on Typst elements if validate_embedded_code=True
    duc_bytes = duc.serialize_duc(
        name="document_element_example",
        elements=[doc_element],
        validate_embedded_code=True
    )
    
    print(f"   Successfully serialized DUC file ({len(duc_bytes)} bytes).")
    print("\n✅ Document element demo complete!")

if __name__ == "__main__":
    main()
