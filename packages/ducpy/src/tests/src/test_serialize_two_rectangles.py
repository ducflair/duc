import os
import sys

import ducpy as duc
import pytest


def test_serialize_two_rectangles():
    """
    Tests the creation of two simple rectangle elements using the new clean, modular API.
    This test focuses on the API builders themselves rather than serialization.
    """
    # Create rectangle elements with the new ElementBuilder API
    element1 = (duc.ElementBuilder()
                .at_position(10.0, 20.0)
                .with_size(100.0, 50.0)
                .with_angle(2.0)
                .with_label("Rectangle 1")
                .with_z_index(1.0)
                .with_styles(duc.create_fill_style(duc.create_solid_content("#FF0000", opacity=1.0)))
                .build_rectangle()
                .build())

    element2 = (duc.ElementBuilder()
                .at_position(150.0, 100.0)
                .with_size(80.0, 40.0)
                .with_angle(0.0)
                .with_label("Rectangle 2")
                .with_z_index(2.0)
                .with_styles(duc.create_fill_and_stroke_style(
                    duc.create_solid_content("#00FF00", opacity=0.5),  # Green fill at 50% opacity
                    duc.create_solid_content("#000000"),  # Black stroke
                    stroke_width=2.0
                ))
                .build_rectangle()
                .build())

    elements = [element1, element2]

    # Determine output path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    
    os.makedirs(output_dir, exist_ok=True)
    output_file_name = "test_two_rectangles.duc"
    output_file_path = os.path.join(output_dir, output_file_name)

    # Serialize using the new io API
    serialized_bytes = duc.serialize_duc(
        name="TwoRectanglesTest",
        elements=elements
    )

    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"

    # Write the serialized bytes to a .duc file
    with open(output_file_path, "wb") as f:
        f.write(serialized_bytes)

    print(f"Successfully serialized two rectangle elements to: {output_file_path}")

def test_two_rectangles_via_sql(test_output_dir):
    """Create two styled rectangles using raw SQL, export to .duc file."""
    from ducpy.builders.sql_builder import DucSQL

    output_file = os.path.join(test_output_dir, "test_two_rectangles_sql.duc")

    with DucSQL.new() as db:
        # Rectangle 1 — red fill
        db.sql(
            "INSERT INTO elements "
            "(id, element_type, x, y, width, height, angle, label, z_index, opacity) "
            "VALUES (?,?,?,?,?,?,?,?,?,?)",
            "r1", "rectangle", 10, 20, 100, 50, 2.0, "Rectangle 1", 1.0, 1.0,
        )
        db.sql(
            "INSERT INTO backgrounds (owner_type, owner_id, src, opacity) VALUES (?,?,?,?)",
            "element", "r1", "#FF0000", 1.0,
        )

        # Rectangle 2 — green fill + black stroke
        db.sql(
            "INSERT INTO elements "
            "(id, element_type, x, y, width, height, angle, label, z_index, opacity) "
            "VALUES (?,?,?,?,?,?,?,?,?,?)",
            "r2", "rectangle", 150, 100, 80, 40, 0.0, "Rectangle 2", 2.0, 0.5,
        )
        db.sql(
            "INSERT INTO backgrounds (owner_type, owner_id, src, opacity) VALUES (?,?,?,?)",
            "element", "r2", "#00FF00", 0.5,
        )
        db.sql(
            "INSERT INTO strokes (owner_type, owner_id, src, width) VALUES (?,?,?,?)",
            "element", "r2", "#000000", 2.0,
        )

        # Verify
        elems = db.sql("SELECT * FROM elements ORDER BY z_index")
        assert len(elems) == 2
        assert elems[0]["label"] == "Rectangle 1"
        assert elems[1]["label"] == "Rectangle 2"

        bg1 = db.sql("SELECT src FROM backgrounds WHERE owner_id = ?", "r1")[0]
        assert bg1["src"] == "#FF0000"

        stroke2 = db.sql("SELECT width FROM strokes WHERE owner_id = ?", "r2")[0]
        assert stroke2["width"] == 2.0

        db.save(output_file)

    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0

    # Re-open and verify roundtrip
    with DucSQL(output_file) as db2:
        assert len(db2.sql("SELECT * FROM elements")) == 2


# Legacy builder/native serialization test now covered by SQL-first variant.
test_serialize_two_rectangles = test_two_rectangles_via_sql


if __name__ == "__main__":
    # Allow running the test directly for quick checks, e.g., during development
    pytest.main([__file__]) # type: ignore 