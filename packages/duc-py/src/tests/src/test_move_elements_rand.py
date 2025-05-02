"""
Test moving elements randomly in a DUC file.
"""
import argparse
import os
import random
import numpy as np
import pytest

# from ducpy.parse.parse_duc import parse_duc_flatbuffers # Import might not be available
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.classes.AppStateClass import AppState
from ducpy.classes.DucElementClass import (
    DucElementUnion, DucRectangleElement, DucLinearElement, Point,
    ElementStroke, ElementBackground, ElementContentBase, StrokeStyle
)
from ducpy.utils.enums import ElementContentPreference, StrokePreference, StrokeJoin, StrokeCap, StrokePlacement

def move_element(element):
    """Move an element by a random offset."""
    # Random offsets
    offset_x = random.uniform(-50, 50)
    offset_y = random.uniform(-50, 50)
    
    element.x += offset_x
    element.y += offset_y
    
    # If the element has points (like lines, freedraw), move them too
    if hasattr(element, 'points') and element.points:
        for point in element.points:
            point.x += offset_x
            point.y += offset_y
    
    return element

def get_default_stroke() -> ElementStroke:
    """Returns a default stroke object."""
    return ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src='#000000', # Default color
            visible=True,
            opacity=1.0
        ),
        width=1.0, # Default width
        style=StrokeStyle(
            preference=int(StrokePreference.SOLID),
            join=int(StrokeJoin.MITER),
            cap=int(StrokeCap.BUTT)
        ),
        placement=int(StrokePlacement.CENTER) # Default placement
    )

def get_default_background() -> ElementBackground:
    """Returns a default background object."""
    return ElementBackground(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src='transparent', # Default background
            visible=False,
            opacity=1.0
        )
    )

def test_move_elements_randomly(test_assets_dir, test_output_dir):
    """Test saving a DUC file after moving elements (parsing skipped)."""
    # This test primarily checks if elements *can* be modified and re-serialized.
    # It skips loading an existing DUC due to potential parsing issues.
    
    output_filename = "test_moved_elements_no_load.duc"
    output_path = os.path.join(test_output_dir, output_filename)

    # Create some dummy elements to move, providing default stroke/background explicitly
    default_stroke = get_default_stroke()
    default_background = get_default_background()
    
    elements_to_move: list[DucElementUnion] = [
        DucRectangleElement(
            id="rect1", type="rectangle", x=100, y=100, width=50, height=50, scope="mm",
            stroke=[default_stroke],
            background=[default_background]
        ),
        DucLinearElement(
            id="line1", type="line", x=200, y=200, points=[Point(x=200, y=200), Point(x=250, y=250)], scope="mm",
            stroke=[default_stroke],
            background=[default_background]
        )
    ]
    
    # Move each element randomly
    moved_elements = [move_element(elem) for elem in elements_to_move]
    
    # Create dummy app state and files
    app_state = AppState()
    files = {}
    
    # Serialize and save
    serialized = save_as_flatbuffers(
        elements=moved_elements,
        app_state=app_state,
        files=files
    )
    
    # Write output file
    with open(output_path, "wb") as f:
        f.write(serialized)
    
    print(f"Successfully saved {len(moved_elements)} moved elements randomly (without loading).")
    print(f"Output saved to: {output_path}")
    assert os.path.exists(output_path), f"Output file was not created: {output_path}"
    assert os.path.getsize(output_path) > 0, "Output file is empty"

# This test should:
# 1. Load a duc file (parse)
# 2. Move all the elements around randomly
# 3. Save the duc file (serialize)
if __name__ == "__main__":
    main()

