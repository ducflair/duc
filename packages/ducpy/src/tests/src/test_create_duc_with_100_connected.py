"""
Test creating a DUC file with 100 connected elements.
"""
import argparse
import os
import random
import uuid
from typing import List, Optional
import numpy as np
import pytest

from ducpy.classes.DucElementClass import (
    DucElementUnion, DucRectangleElement, DucLinearElement, DucArrowElement, DucTextElement,
    ElementStroke, ElementBackground, ElementContentBase, StrokeStyleProps, StrokeSides,
    Point, PointBinding, BoundElement
)
from ducpy.classes.AppStateClass import AppState
from ducpy.classes.BinaryFilesClass import BinaryFiles
from ducpy.utils.enums import (
    ElementType, ElementContentPreference, StrokePreference, StrokePlacement,
    StrokeJoin, StrokeCap, FontFamily, TextAlign, VerticalAlign
)
from ducpy.serialize.serialize_duc import save_as_flatbuffers

scope = "mm"

def create_rectangle(x: float, y: float, width: float = 100, height: float = 100) -> DucElementUnion:
    """Create a rectangle element."""
    # Create stroke and background
    stroke = ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="#000000",
            visible=True,
            opacity=1.0
        ),
        width=2.0,
        style=StrokeStyleProps(
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
        scope=scope,
        x=x,
        y=y,
        width=width,
        height=height,
        angle=0,
        is_deleted=False,
        opacity=1,
        bound_elements=[],
        group_ids=[],
        stroke=[stroke],
        background=[background]
    )

def create_line(start_x: float, start_y: float, end_x: float, end_y: float, with_arrow: bool = False) -> DucElementUnion:
    """Create a line or arrow element."""
    points = [
        Point(x=start_x, y=start_y),
        Point(x=end_x, y=end_y)
    ]
    
    # Create stroke and background
    stroke = ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="#000000",
            visible=True,
            opacity=1.0
        ),
        width=2.0,
        style=StrokeStyleProps(
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
    
    if with_arrow:
        return DucArrowElement(
            id=str(uuid.uuid4()),
            scope=scope,
            x=start_x,
            y=start_y,
            points=points,
            angle=0,
            is_deleted=False,
            opacity=1,
            bound_elements=[],
            group_ids=[],
            stroke=[stroke],
            background=[background]
        )
    else:
        return DucLinearElement(
            id=str(uuid.uuid4()),
            scope=scope,
            x=start_x,
            y=start_y,
            points=points,
            angle=0,
            is_deleted=False,
            opacity=1,
            bound_elements=[],
            group_ids=[],
            stroke=[stroke],
            background=[background]
        )

def create_text_element(x: float, y: float, text: str = "Test Text") -> DucElementUnion:
    """Create a text element."""
    # Text elements typically don't have a prominent stroke or background by default in drawing tools
    # but the class expects them. We can use minimal/transparent ones.
    stroke = ElementStroke(
        content=ElementContentBase(preference=int(ElementContentPreference.SOLID), src="#000000", visible=False, opacity=0.0),
        width=0.0,
        style=StrokeStyleProps(preference=int(StrokePreference.SOLID), join=int(StrokeJoin.MITER), cap=int(StrokeCap.BUTT)),
        placement=int(StrokePlacement.CENTER)
    )
    background = ElementBackground(
        content=ElementContentBase(preference=int(ElementContentPreference.SOLID), src="transparent", visible=False, opacity=0.0)
    )
    return DucTextElement(
        id=str(uuid.uuid4()),
        scope=scope,
        x=x,
        y=y,
        width=random.uniform(50, 200),  # Auto-adjusts with text, but provide initial
        height=random.uniform(20, 100), # Auto-adjusts with text, but provide initial
        text=text,
        font_size=random.uniform(12, 36),
        font_family=random.choice(list(FontFamily)),
        text_align=random.choice(list(TextAlign)),
        vertical_align=random.choice(list(VerticalAlign)),
        angle=0,
        is_deleted=False,
        opacity=1,
        bound_elements=[],
        group_ids=[],
        stroke=[stroke],
        background=[background]
    )

def create_point_binding(element_id: str, point: Point, focus: float = 0.5) -> PointBinding:
    """Create a point binding for an element."""
    return PointBinding(
        element_id=element_id,
        focus=focus,
        gap=0,
        fixed_point=point,
        head=0
    )

def create_bound_element(id: str, element_type: ElementType) -> BoundElement:
    """Create a bound element reference."""
    return BoundElement(id=id, type=element_type)

def create_connected_elements(num_elements: int = 100) -> List[DucElementUnion]:
    """Create a list of connected elements."""
    elements = []
    canvas_width = 2000
    canvas_height = 2000
    
    # Create initial rectangle at the center
    center_x = canvas_width / 2
    center_y = canvas_height / 2
    initial_rect = create_rectangle(center_x, center_y)
    elements.append(initial_rect)
    
    # Create remaining elements
    for i in range(num_elements - 1):
        # Randomly decide element type
        rand_choice = random.random()
        
        # Get a random existing element to connect to
        parent_element = random.choice(elements)
        parent_x = parent_element.x
        parent_y = parent_element.y
        
        # Calculate random position for new element
        distance = random.uniform(100, 300)
        new_x = parent_x + distance * random.uniform(-1, 1)
        new_y = parent_y + distance * random.uniform(-1, 1)
        
        # Create new element
        new_element: Optional[DucElementUnion] = None # Initialize new_element
        if rand_choice < 0.4: # 40% chance for rectangle
            new_element = create_rectangle(
                new_x,
                new_y,
                width=random.uniform(50, 150),
                height=random.uniform(50, 150)
            )
        elif rand_choice < 0.8: # 40% chance for line/arrow (from 0.4 to 0.8)
            is_arrow = random.random() < 0.5
            new_element = create_line(parent_x, parent_y, new_x, new_y, with_arrow=is_arrow)
            # Explicitly check if it's a DucLinearElement or DucArrowElement (which inherits start_binding)
            
            # Create bindings (if applicable)
            start_point = Point(x=parent_x, y=parent_y)
            end_point = Point(x=new_x, y=new_y)
            
            # For linear elements, we could add start/end bindings
            # but these binding features might not be implemented yet in dataclasses
            # so this would be a placeholder for fuller implementation 
            
        else: # 20% chance for text element (from 0.8 to 1.0)
            new_element = create_text_element(new_x, new_y, f"Element {i+1}")
        
        if new_element:
            elements.append(new_element)
    
    return elements

def test_create_connected_duc(test_output_dir):
    """Test creating a DUC file with 100 connected elements, including text."""
    num_elements = 100
    output_file = os.path.join(test_output_dir, "test_100_connected.duc")

    # Create elements
    elements = create_connected_elements(num_elements)
    app_state = AppState()
    files = {}
    
    # Serialize and save
    duc_bytes = save_as_flatbuffers(elements, app_state, files)
    with open(output_file, 'wb') as f:
        f.write(duc_bytes)
    
    print(f"Created DUC file with {len(elements)} connected elements at {output_file}")
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

# This test should:
# 1. Create 100 connected elements (rectangles, lines, arrows, text)
# 2. Save the duc file (serialize)
if __name__ == "__main__":
    main()




