import argparse
import random
import uuid
from typing import List, Dict

from ..ducpy.classes.DucElementClass import DucElementUnion, DucLinearElement, DucRectangleElement
from ..ducpy.classes.AppStateClass import AppState
from ..ducpy.classes.BinaryFilesClass import BinaryFiles
from ..ducpy.utils.ElementTypes import (
    BoundElement, BindingPoint, ElementBackground, Point, PointBinding,
    ElementStroke, ElementContentBase, StrokeStyle, StrokeSides
)
from ..ducpy.utils.enums import (
    ElementType, ElementContentPreference, StrokePreference,
    StrokePlacement, StrokeJoin, StrokeCap
)
from ..ducpy.serialize.serialize_duc import save_as_flatbuffers

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
    element_type = ElementType.ARROW if with_arrow else ElementType.LINE
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
        type=element_type,
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

def create_point_binding(element_id: str, point: Point, focus: float = 0.5) -> PointBinding:
    """Create a point binding for an element."""
    return PointBinding(
        element_id=element_id,
        focus=focus,
        gap=0,
        fixed_point=point,
        head=0
    )

def create_bound_element(id: str) -> BoundElement:
    """Create a bound element reference."""
    return BoundElement(id=id, type=ElementType.RECTANGLE)

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
        # Randomly decide whether to create a rectangle or line
        is_rectangle = random.random() < 0.3
        
        # Get a random existing element to connect to
        parent_element = random.choice(elements)
        parent_x = parent_element.x
        parent_y = parent_element.y
        
        # Calculate random position for new element
        angle = random.uniform(0, 2 * 3.14159)
        distance = random.uniform(100, 300)
        new_x = parent_x + distance * random.uniform(-1, 1)
        new_y = parent_y + distance * random.uniform(-1, 1)
        
        # Create new element
        if is_rectangle:
            new_element = create_rectangle(
                new_x,
                new_y,
                width=random.uniform(50, 150),
                height=random.uniform(50, 150)
            )
        else:
            # Create line/arrow connecting to parent
            is_arrow = random.random() < 0.5
            new_element = create_line(parent_x, parent_y, new_x, new_y, with_arrow=is_arrow)
            
            # Add bindings for lines/arrows
            start_binding = create_point_binding(
                parent_element.id,
                Point(x=parent_x, y=parent_y)
            )
            new_element.start_binding = start_binding
        
        # Create bound element references
        parent_element.bound_elements.append(create_bound_element(new_element.id))
        new_element.bound_elements.append(create_bound_element(parent_element.id))
        
        elements.append(new_element)
    
    return elements

def main():
    parser = argparse.ArgumentParser(description='Create a DUC file with 100 connected elements')
    parser.add_argument('-o', '--output', required=True, help='Output DUC file path')
    
    args = parser.parse_args()
    
    # Create elements
    elements = create_connected_elements()
    
    # Create minimal app state
    app_state = AppState()
    
    # Create empty files dictionary
    files: Dict[str, BinaryFiles] = {}
    
    # Serialize and save
    duc_bytes = save_as_flatbuffers(elements, app_state, files)
    
    with open(args.output, 'wb') as f:
        f.write(duc_bytes)
    
    print(f"Created DUC file with {len(elements)} connected elements at {args.output}")

if __name__ == '__main__':
    main()

# This test should:
# 1. Create 100 random elements that are all connected via BoundElement / BindingPoint / PointBinding, consisting of linear elements and rectangles.
# 2. Serialize the elements to a duc file
# 3. Save the duc file




