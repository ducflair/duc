import os
import sys
import pytest
import ducpy as duc


def test_serialize_two_rectangles():
    """
    Tests the creation of two simple rectangle elements using the new clean, modular API.
    This test focuses on the API builders themselves rather than serialization.
    """
    # Create rectangle elements with the clean, modular API using numpy-style imports
    element1 = duc.create_rectangle(
        x=10.0,
        y=20.0,
        width=100.0,
        height=50.0,
        angle=2.0,
        label="Rectangle 1",
        styles=duc.create_fill_style(duc.create_solid_content("#FF0000", opacity=1.0)),  # Red fill style
        z_index=1.0
    )

    element2 = duc.create_rectangle(
        x=150.0,
        y=100.0,
        width=80.0,
        height=40.0,
        angle=0.0,
        label="Rectangle 2",
        styles=duc.create_fill_and_stroke_style(
            duc.create_solid_content("#00FF00", opacity=0.5),  # Green fill at 50% opacity
            duc.create_solid_content("#000000"),  # Black stroke
            stroke_width=2.0
        ),
        z_index=2.0
    )

    elements = [element1, element2]

    # Determine output path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    
    os.makedirs(output_dir, exist_ok=True)
    output_file_name = "two_rectangles_test.duc"
    output_file_path = os.path.join(output_dir, output_file_name)

    # Serialize using the clean API - no need to construct ExportedDataState manually!
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
    print(f"You can now test this file with: flatc --json -o <output_json_dir> schema/duc.fbs -- {output_file_path}")

if __name__ == "__main__":
    # Allow running the test directly for quick checks, e.g., during development
    pytest.main([__file__]) # type: ignore 