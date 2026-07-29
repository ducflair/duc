# Examples

The source for all examples lives in `packages/ducpy/src/examples/`.

---

## Element Creation

Demonstrates building rectangles, ellipses, polygons, lines, arrows, text,
frames and plots using the fluent builder DSL.

```python
#!/usr/bin/env python3
"""
Example demonstrating the element creation functionality using the builders API.
This demo shows how to create various types of elements using the modern builders pattern.
"""

import tempfile

import ducpy as duc
from ducpy.builders.style_builders import (create_fill_and_stroke_style,
                                           create_simple_styles,
                                           create_solid_content)


def demo_basic_elements():
    """Demo basic elements using the builders API."""
    print("=== Basic Elements Demo ===")

    rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 50)
        .with_label("Sample Rectangle")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#FF6B6B"),
            stroke_content=create_solid_content("#2C3E50"),
            stroke_width=2.0,
            roundness=5.0
        ))
        .build_rectangle()
        .build())

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

    poly = (duc.ElementBuilder()
        .at_position(200, 0)
        .with_size(50, 50)
        .with_label("Hexagon")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#45B7D1"),
            stroke_content=create_solid_content("#2C3E50"),
            stroke_width=1.0,
            roundness=0.0
        ))
        .build_polygon()
        .with_sides(6)
        .build())

    print(f"Rectangle ID: {rect.element.base.id}")
    print(f"Ellipse ID: {ellipse.element.base.id}")
    print(f"Polygon sides: {poly.element.sides}")

    # Demonstrate mutation with random versioning
    duc.mutate_element(rect, x=10, label="Moved Rectangle")

    return [rect, ellipse, poly]


def demo_linear_elements():
    """Demo linear and arrow elements with styles."""
    print("\n=== Linear Elements Demo ===")

    line_points = [(0, 0), (50, 25), (100, 0)]
    line = (duc.ElementBuilder()
        .with_label("Sample Line")
        .with_styles(create_simple_styles(
            strokes=[duc.create_stroke(duc.create_solid_content("#E74C3C"), width=3.0)]
        ))
        .build_linear_element()
        .with_points(line_points)
        .build())
    print(f"Line has {len(line.element.linear_base.points)} points")

    arrow_points = [(0, 50), (75, 100)]
    arrow = (duc.ElementBuilder()
        .with_label("Sample Arrow")
        .with_styles(create_simple_styles(
            strokes=[duc.create_stroke(duc.create_solid_content("#8E44AD"), width=2.5)]
        ))
        .build_arrow_element()
        .with_points(arrow_points)
        .build())
    print(f"Arrow element type: {type(arrow.element).__name__}")

    return [line, arrow]


def demo_text_elements():
    """Demo text elements with styles and document formatting."""
    print("\n=== Text Elements Demo ===")

    text = (duc.ElementBuilder()
        .at_position(0, 100)
        .with_size(150, 25)
        .with_label("Sample Text")
        .with_styles(create_simple_styles(opacity=0.9))
        .build_text_element()
        .with_text("Hello, DucPy!")
        .build())
    print(f"Text content: '{text.element.text}'")

    return [text]


def demo_stack_elements():
    """Demo new stack-based elements with styles."""
    print("\n=== Stack Elements Demo ===")

    frame = (duc.ElementBuilder()
        .at_position(0, 150)
        .with_size(200, 100)
        .with_label("Technical Frame")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#F8F9FA"),
            stroke_content=create_solid_content("#495057"),
            stroke_width=2.0,
            roundness=3.0
        ))
        .build_frame_element()
        .build())
    print(f"Frame stack label: {frame.element.stack_element_base.stack_base.label}")

    plot = (duc.ElementBuilder()
        .at_position(220, 150)
        .with_size(180, 120)
        .with_label("Engineering Plot")
        .with_styles(create_fill_and_stroke_style(
            fill_content=create_solid_content("#E9ECEF"),
            stroke_content=create_solid_content("#6C757D"),
            stroke_width=1.5
        ))
        .build_plot_element()
        .with_margins(duc.Margins(top=5, right=5, bottom=5, left=5))
        .build())

    return [frame, plot]


def demo_custom_stack_base():
    """Demo custom stack base creation."""
    print("\n=== Custom Stack Base Demo ===")

    custom_frame = (duc.ElementBuilder()
        .at_position(50, 280)
        .with_size(150, 80)
        .with_label("Custom Container")
        .build_frame_element()
        .with_stack_base(duc.StateBuilder().build_stack_base()
            .with_is_collapsed(False)
            .with_styles(duc.DucStackLikeStyles(opacity=0.8))
            .build())
        .build())

    return [custom_frame]


def main():
    """Run all element creation demos."""
    print("DucPy Element Creation Demo")
    print("=" * 40)

    elements = []
    elements.extend(demo_basic_elements())
    elements.extend(demo_linear_elements())
    elements.extend(demo_text_elements())
    elements.extend(demo_stack_elements())
    elements.extend(demo_custom_stack_base())

    output = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    output.close()
    duc_path = duc.serialize_duc(
        name="element_creation_example",
        output_path=output.name,
        elements=elements,
    )

    print(f"\nCreated {len(elements)} elements → serialized to {duc_path}.")
    print("✅ Element creation demo complete!")
    return duc_path


if __name__ == "__main__":
    main()
```

---

## Mutating Elements

Shows how to update element properties in place and observe version changes.

```python
#!/usr/bin/env python3
"""
Example demonstrating the `mutate` API for elements, global state, and
external file entries in DUC.

This demo shows how to:
  1. Build an initial set of elements and supporting state via the
     standard builder API.
  2. Apply targeted mutations to the elements, the global state, and an
     external file entry using `duc.mutate_*` helpers.
  3. Serialize the resulting DUC object into a `.duc` file.
"""

import tempfile

import ducpy as duc


def main():
    print("Mutation Demo")
    print("=" * 30)

    # ------------------------------------------------------------------
    # 1. Build the initial elements + state using the existing builders.
    # ------------------------------------------------------------------
    rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 50)
        .with_label("Initial Rectangle")
        .build_rectangle()
        .build())

    ellipse = (duc.ElementBuilder()
        .at_position(140, 0)
        .with_size(60, 40)
        .with_label("Initial Ellipse")
        .build_ellipse()
        .build())

    elements = [rect, ellipse]

    duc_global_state = (duc.StateBuilder()
        .build_global_state()
        .with_name("mutation_demo")
        .with_main_scope("mm")
        .build())

    duc_local_state = (duc.StateBuilder()
        .build_local_state()
        .build())

    # A sample external file entry to exercise mutate_external_file.
    external_file = (duc.StateBuilder()
        .build_external_file()
        .with_key("logo")
        .with_mime_type("image/png")
        .with_data(b"\x89PNG\r\n\x1a\n" + b"\x00" * 16)
        .build())

    # ------------------------------------------------------------------
    # 2. Apply mutations using the duc.mutate_* API.
    #    Each helper mutates in place and also stamps fresh versioning
    #    metadata (seed, updated, version, version_nonce) where
    #    applicable.
    # ------------------------------------------------------------------

    # 2a. Mutate the rectangle: move it, resize it, rename, hide it.
    duc.mutate_element(
        rect,
        x=20,
        y=30,
        width=150,
        label="Mutated Rectangle",
        is_visible=False,
    )

    # 2b. Mutate the ellipse: rename and move (size stays the same).
    duc.mutate_element(
        ellipse,
        x=200,
        y=75,
        label="Mutated Ellipse",
    )

    # 2c. Mutate the global state (zoom level, background, name).
    duc.mutate_global_state(
        duc_global_state,
        view_background_color="#1E1E2E",
        name="mutation_demo_updated",
    )

    # 2d. Mutate the local state (scroll position, grid mode).
    duc.mutate_local_state(
        duc_local_state,
        scroll_x=42.0,
        scroll_y=17.5,
        grid_mode_enabled=False,
    )

    # 2e. Mutate the external file entry's metadata.
    duc.mutate_external_file(
        external_file,
        version=2,
    )

    # ------------------------------------------------------------------
    # 3. Serialize the mutated objects into a .duc file.
    # ------------------------------------------------------------------
    output = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    output.close()
    duc_path = duc.serialize_duc(
        name="mutation_demo",
        output_path=output.name,
        elements=elements,
        duc_global_state=duc_global_state,
        duc_local_state=duc_local_state,
        external_files=[external_file],
    )

    print(f"   Mutated {len(elements)} elements.")
    print(f"   Global state main scope -> {duc_global_state.main_scope!r}")
    print(f"   Local state scroll -> ({duc_local_state.scroll_x}, {duc_local_state.scroll_y})")
    print(f"   External file version -> {external_file.version}")
    print(f"   Serialized to {duc_path}.")
    print("\n✅ Mutation demo complete!")
    return duc_path


if __name__ == "__main__":
    main()
```

---

## External Files

Attaching binary blobs (images, PDFs) to a `duc` document.

```python
"""
Example demonstrating the creation and management of external files within a DUC object.
"""

import ducpy as duc


def create_duc_with_external_files():
    """
    Creates a DUC object and adds multiple external file entries to it
    using the builder pattern.
    """
    print("Creating a DUC object with external files...")

    # Create dummy data for external files
    dummy_image_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0cIDATx\xda\xed\xc1\x01\x01\x00\x00\x00\xc2\xa0\xf7Om\x00\x00\x00\x00IEND\xaeB`\x82"
    dummy_pdf_data = b"%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Count 0>> endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n123\n%%EOF"

    image_file_entry = (duc.StateBuilder()
        .build_external_file()
        .with_key("my_image_key")
        .with_mime_type("image/png")
        .with_data(dummy_image_data)
        .build())

    pdf_file_entry = (duc.StateBuilder()
        .build_external_file()
        .with_key("document_123")
        .with_mime_type("application/pdf")
        .with_data(dummy_pdf_data)
        .build())

    duc_global_state = (duc.StateBuilder()
        .build_global_state()
        .with_main_scope("mm")
        .build())

    duc_local_state = (duc.StateBuilder()
        .build_local_state()
        .build())

    duc_object_files = {image_file_entry.id: image_file_entry, pdf_file_entry.id: pdf_file_entry}

    print("DUC object with external files created successfully!")
    print(f"Total external files: {len(duc_object_files)}")
    return duc_object_files, duc_global_state, duc_local_state


def main():
    """Run the external files demo."""
    print("External Files Demo")
    print("=" * 30)
    create_duc_with_external_files()
    print("\nExternal files demo complete!")


if __name__ == "__main__":
    main()
```

---

## SQL Builder

Direct SQLite access via [`DucSQL`](autoapi/ducpy/builders/sql_builder/index.md#ducpy.builders.sql_builder.DucSQL).
Use this when you need raw queries, bulk inserts, schema introspection, or
anything beyond what the high-level builders expose.

```python
#!/usr/bin/env python3
"""
Example demonstrating direct SQLite access to .duc files via DucSQL.

A .duc file is a plain SQLite database.  DucSQL exposes the raw sqlite3
connection so you can run any SQL you want while handling the open/save/
export lifecycle for you.

Topics covered:
  1. Create a new .duc file with the full schema bootstrapped
  2. Insert elements and style data
  3. Query rows back as dict-like objects
  4. Update elements in place
  5. Export to / round-trip from a file path
  6. Open an existing .duc file
  7. Round-trip SQL-built data through the high-level parser
"""

import os
import tempfile

import ducpy as duc
from ducpy.builders.sql_builder import DucSQL


def demo_create_new():
    print("=== Create new .duc ===")

    with DucSQL.new() as db:
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "r1", "rectangle", 0, 0, 200, 100, "Main Rectangle", 1.0,
        )
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "e1", "ellipse", 250, 0, 120, 80, "Side Ellipse", 0.9,
        )

        for owner_id, colour in [("r1", "#4ECDC4"), ("e1", "#FF6B6B")]:
            db.sql(
                "INSERT INTO backgrounds (owner_type, owner_id, src, opacity) "
                "VALUES (?,?,?,?)",
                "element", owner_id, colour, 1.0,
            )

        rows = db.sql("SELECT id, element_type, label FROM elements ORDER BY id")
        for row in rows:
            print(f"  [{row['id']}] {row['element_type']} — {row['label']}")

        db.sql_dict(
            "UPDATE elements SET label = :label WHERE id = :id",
            {"label": "Renamed Rectangle", "id": "r1"},
        )

        updated = db.sql("SELECT label FROM elements WHERE id = ?", "r1")[0]
        print(f"  After rename: '{updated['label']}'")

        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        tmp.close()
        db.save(tmp.name)
        print(f"  Saved to: {tmp.name}")

    return tmp.name


def demo_open_existing(path: str):
    print("\n=== Open existing .duc ===")

    with DucSQL(path) as db:
        count = db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"]
        print(f"  Total elements: {count}")

        rows = db.sql(
            "SELECT e.id, e.label, b.src AS colour "
            "FROM elements e "
            "LEFT JOIN backgrounds b ON b.owner_type = 'element' AND b.owner_id = e.id "
            "ORDER BY e.id"
        )
        for row in rows:
            print(f"  {row['label']} → fill: {row['colour']}")

    os.unlink(path)


def demo_file_roundtrip():
    print("\n=== File round-trip ===")

    with DucSQL.new() as db:
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) "
            "VALUES (?,?,?,?,?,?,?)",
            "t1", "text", 10, 10, 300, 40, "Hello, DUC!",
        )
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        tmp.close()
        db.save(tmp.name)

    print(f"  Serialised to {tmp.name}")

    with DucSQL(tmp.name) as db:
        row = db.sql("SELECT label FROM elements WHERE id = 't1'")[0]
        print(f"  Restored label: '{row['label']}'")

    return tmp.name


def demo_advanced_connection():
    print("\n=== Advanced: direct connection access ===")

    with DucSQL.new() as db:
        records = [
            (f"el{i}", "rectangle", i * 110, 0, 100, 60, f"Box {i}", 1.0)
            for i in range(5)
        ]
        db.conn.executemany(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            records,
        )

        total = db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"]
        print(f"  Bulk-inserted {total} elements")

        tables = [
            row["name"]
            for row in db.sql(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
        ]
        print(f"  Schema tables: {', '.join(tables[:6])} …")


def demo_serialize_via_sql():
    print("\n=== Build with SQL, serialize with the high-level API ===")

    with DucSQL.new() as db:
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "s1", "rectangle", 0, 0, 100, 50, "From SQL", 1.0,
        )
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        tmp.close()
        db.save(tmp.name)

    parsed = duc.parse_duc(tmp.name)
    print(f"  Parsed {len(parsed.elements)} element(s) built via raw SQL.")

    return tmp.name


def main():
    print("DucSQL Builder Demo")
    print("=" * 40)

    saved_path = demo_create_new()
    demo_open_existing(saved_path)
    roundtrip_path = demo_file_roundtrip()
    demo_advanced_connection()
    demo_serialize_via_sql()

    print(f"\nAll DucSQL demos completed successfully! (round-trip file: {roundtrip_path})")
    return roundtrip_path


if __name__ == "__main__":
    main()
```

---

## Serialization

Demonstrates how to serialize builder-created elements directly to a .duc file using duc.serialize_duc.

```python
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
```

---

## Parsing

Demonstrates how to parse a .duc file or raw binary bytes using duc.parse_duc, allowing attribute-style access to the document’s content.

```python
#!/usr/bin/env python3
"""
Example demonstrating how to parse a .duc file using the parsing API.

This demo shows how to read a `.duc` file path and access
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
    tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    tmp.close()
    tmp_path = duc.serialize_duc(name="parsing_example", output_path=tmp.name, elements=elements)

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
    
    print("\n3. Re-parsing from the streamed file path...")
    
    parsed_again = duc.parse_duc(tmp_path)
    print(f"   Parsed successfully from path. Found {len(parsed_again.elements)} elements.")
    
    # Clean up the temporary file
    os.unlink(tmp_path)
    
    print("\n✅ Parsing demo complete!")

if __name__ == "__main__":
    main()
```
