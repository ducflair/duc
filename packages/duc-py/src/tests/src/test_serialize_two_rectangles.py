import os
import pytest

from ducpy.classes.DucElementClass import DucElement
from ducpy.utils.enums import ElementType  # Assuming ElementType.RECTANGLE provides the correct type string
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.classes.AppStateClass import AppState
# from ducpy.classes.AppStateClass import AppState # Not strictly needed if passing None
# from ducpy.classes.BinaryFilesClass import BinaryFiles # Not strictly needed if passing {}

def test_serialize_two_rectangles():
    """
    Tests the serialization of two simple rectangle elements.
    The output can be used to verify flatc conversion.
    """
    # Define two simple rectangle elements
    # Ensure that ElementType.RECTANGLE is the correct string representation (e.g., "rectangle")
    # or replace with the literal string if necessary.
    element1 = DucElement(
        id="rect_1",
        type=ElementType.RECTANGLE,  # Or "rectangle" if ElementType.RECTANGLE is not the string itself
        x=10.0,
        y=20.0,
        width=100.0,
        height=50.0,
        angle=0.0,
        z_index=1,
        opacity=1.0,
        locked=False,
        is_visible=True,
        scope="mm",
        # Minimal other fields, relying on dataclass defaults for lists etc.
        stroke=[],
        background=[],
        group_ids=[],
        bound_elements=[]
    )

    element2 = DucElement(
        id="rect_2",
        type=ElementType.RECTANGLE, # Or "rectangle"
        x=150.0,
        y=100.0,
        width=80.0,
        height=40.0,
        angle=0.0,
        z_index=2,
        opacity=1.0,
        locked=False,
        is_visible=True,
        stroke=[],
        background=[],
        group_ids=[],
        scope="mm",
        bound_elements=[]
    )

    elements = [element1, element2]
    app_state = AppState()  # No specific app state needed for this test
    binary_files = {}  # No binary files needed for this test

    # Determine output path
    # Assumes the test is run from a context where 'packages' is accessible
    # or that ducpy is installed and paths are resolved correctly.
    # For robustness in a typical pytest setup within the project:
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    # Navigate from src/ to tests/ then to output/
    # tests/src/test_serialize_two_rectangles.py -> tests/output/
    output_dir = os.path.join(current_script_path, "..", "output")
    
    os.makedirs(output_dir, exist_ok=True)
    output_file_name = "two_rectangles_test.duc"
    output_file_path = os.path.join(output_dir, output_file_name)

    # Serialize the elements
    # The 'name' parameter in save_as_flatbuffers is for metadata, not filename
    serialized_bytes = save_as_flatbuffers(elements, app_state, binary_files, name="TwoRectanglesTest")

    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"

    # Write the serialized bytes to a .duc file
    with open(output_file_path, "wb") as f:
        f.write(serialized_bytes)

    print(f"Successfully serialized two rectangle elements to: {output_file_path}")
    print(f"You can now test this file with: flatc --json -o <output_json_dir> schema/duc.fbs -- {output_file_path}")

if __name__ == "__main__":
    # Allow running the test directly for quick checks, e.g., during development
    pytest.main([__file__]) 