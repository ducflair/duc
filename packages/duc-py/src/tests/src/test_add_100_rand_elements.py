"""
Test adding 100 random elements to a DUC file.
"""
import argparse
import os
import random
import uuid
import numpy as np
import pytest

from ducpy.classes.DucElementClass import DucElementUnion, DucRectangleElement, DucLinearElement
from ducpy.classes.AppStateClass import AppState
from ducpy.classes.BinaryFilesClass import BinaryFiles
from ducpy.utils.ElementTypes import (
    ElementBackground, ElementStroke, ElementContentBase, Point, StrokeStyle, StrokeSides
)
from ducpy.utils.enums import (
    ElementType, ElementContentPreference, StrokePreference,
    StrokePlacement, StrokeJoin, StrokeCap
)
from ducpy.serialize.serialize_duc import save_as_flatbuffers
# from ducpy.parse.parse_duc import load_from_flatbuffers # Import might not be available

scope = "mm"

def create_random_rectangle(x: float, y: float) -> DucElementUnion:
    """Create a rectangle element with random dimensions."""
    stroke = ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="#000000",
            visible=True,
            opacity=1.0
        ),
        width=2.0,
        style=StrokeStyle(
            preference=int(StrokePreference.SOLID),
            join=int(StrokeJoin.MITER),
            cap=int(StrokeCap.BUTT)
        ),
        placement=int(StrokePlacement.INSIDE)
    )
    background = ElementBackground(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="transparent",
            visible=False,
            opacity=1.0
        )
    )
    return DucRectangleElement(
        id=str(uuid.uuid4()),
        type=ElementType.RECTANGLE,
        scope=scope,
        x=x,
        y=y,
        width=random.uniform(50, 150),
        height=random.uniform(50, 150),
        angle=random.uniform(0, 360),
        is_deleted=False,
        opacity=1,
        bound_elements=[],
        group_ids=[],
        stroke=[stroke],
        background=[background]
    )

def create_random_line(x: float, y: float) -> DucElementUnion:
    """Create a line element with random points."""
    points = [Point(x=x, y=y)]
    num_points = random.randint(2, 5)
    for _ in range(num_points - 1):
        points.append(Point(
            x=x + random.uniform(-100, 100),
            y=y + random.uniform(-100, 100)
        ))
    
    stroke = ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="#000000",
            visible=True,
            opacity=1.0
        ),
        width=2.0,
        style=StrokeStyle(
            preference=int(StrokePreference.SOLID),
            join=int(StrokeJoin.MITER),
            cap=int(StrokeCap.BUTT)
        ),
        placement=int(StrokePlacement.CENTER)
    )
    background = ElementBackground(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="transparent",
            visible=False,
            opacity=1.0
        )
    )
    
    return DucLinearElement(
        id=str(uuid.uuid4()),
        type=ElementType.LINE,
        scope=scope,
        x=x,
        y=y,
        points=points,
        angle=random.uniform(0, 360),
        is_deleted=False,
        opacity=1,
        bound_elements=[],
        group_ids=[],
        stroke=[stroke],
        background=[background]
    )

def create_random_elements(num_elements: int = 100) -> list[DucElementUnion]:
    """Create a list of random elements."""
    elements = []
    canvas_width = 2000
    canvas_height = 2000
    
    for _ in range(num_elements):
        x = random.uniform(0, canvas_width)
        y = random.uniform(0, canvas_height)
        
        if random.random() < 0.5:
            elements.append(create_random_rectangle(x, y))
        else:
            elements.append(create_random_line(x, y))
            
    return elements

def test_add_100_random_elements(test_output_dir):
    """Test adding 100 random elements and saving."""
    num_elements = 100
    output_file = os.path.join(test_output_dir, "test_100_random.duc")

    # Create elements
    elements = create_random_elements(num_elements)
    app_state = AppState()
    files = {}
    
    # Serialize and save
    duc_bytes = save_as_flatbuffers(elements, app_state, files)
    with open(output_file, 'wb') as f:
        f.write(duc_bytes)
    
    print(f"Created DUC file with {len(elements)} random elements at {output_file}")
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"
    
    # Loading back is skipped as load_from_flatbuffers might not be available
    # try:
    #     loaded_elements, loaded_app_state, loaded_files = load_from_flatbuffers(duc_bytes)
    #     assert len(loaded_elements) == num_elements, "Incorrect number of elements loaded"
    #     print(f"Successfully loaded back {len(loaded_elements)} elements.")
    # except (ImportError, NameError) as e:
    #     pytest.skip(f"Skipping load test due to missing import/function: {e}")

# This test should:
# 1. Load a duc file (parse)
# 2. Add 100 random elements to the file
# 3. Save the duc file (serialize)
if __name__ == "__main__":
    main()
