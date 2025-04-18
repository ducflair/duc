import os
import random
import numpy as np
import argparse
from pathlib import Path
from nanoid import generate
from ..ducpy.parse.parse_duc import parse_duc_flatbuffers
from ..ducpy.serialize.serialize_duc import save_as_flatbuffers
from ..ducpy.classes.DucElementClass import (
    DucTextElement, DucRectangleElement, DucEllipseElement,
    DucDiamondElement, DucFreeDrawElement, Point,
    ElementStroke, ElementBackground, ElementContentBase
)
from ..ducpy.utils.ElementTypes import StrokeStyle
from ..ducpy.utils.enums import (
    ElementType, FontFamily, TextAlign, VerticalAlign,
    ElementContentPreference, StrokePreference, StrokePlacement,
    StrokeJoin, StrokeCap
)
from ..ducpy.utils.constants import DEFAULT_ELEMENT_PROPS, COLOR_PALETTE

def create_random_element():
    # Choose random element type
    element_type = random.choice([
        ElementType.TEXT,
        ElementType.RECTANGLE,
        ElementType.ELLIPSE,
        ElementType.DIAMOND,
        ElementType.FREEDRAW
    ])

    # Convert COLOR_PALETTE to a list of color values for random selection
    colors = list(COLOR_PALETTE.values())

    # Create stroke and background objects
    stroke = ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src=random.choice(colors),
            visible=True,
            opacity=100
        ),
        width=2,
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
            src=random.choice(colors),
            visible=True,
            opacity=10
        )
    )

    # Base properties for all elements with more reasonable random ranges
    base_props = {
        "id": generate(),
        "type": element_type,
        "x": random.uniform(-2000, 2000),  # Expanded x range
        "y": random.uniform(-2000, 2000),  # Expanded y range
        "width": 200,  # Kept existing width range
        "height": random.uniform(50, 300),  # Kept existing height range
        "angle": random.uniform(0, 2 * np.pi),
        "stroke": [stroke],  # Use the created stroke object
        "background": [background],  # Use the created background object
        "opacity": random.uniform(0.3, 1.0),
        "scope": "mm"
    }

    if element_type == ElementType.TEXT:
        return DucTextElement(
            **base_props,
            text=f"Random Text {random.randint(1, 100)}",
            font_size=random.uniform(12, 48),
            font_family=int(FontFamily.ROBOTO_MONO),
            text_align=int(random.choice(list(TextAlign))),
            vertical_align=int(random.choice(list(VerticalAlign)))
        )
    elif element_type == ElementType.FREEDRAW:
        # Create random points for freedraw
        num_points = random.randint(5, 20)
        points = []
        pressures = []
        x, y = base_props["x"], base_props["y"]
        
        for _ in range(num_points):
            x += random.uniform(-20, 20)
            y += random.uniform(-20, 20)
            points.append(Point(x=x, y=y))
            pressures.append(random.uniform(0.3, 1.0))

        return DucFreeDrawElement(
            **base_props,
            points=points,
            pressures=pressures,
            simulate_pressure=True
        )
    elif element_type == ElementType.RECTANGLE:
        return DucRectangleElement(**base_props)
    elif element_type == ElementType.ELLIPSE:
        return DucEllipseElement(**base_props)
    elif element_type == ElementType.DIAMOND:
        return DucDiamondElement(**base_props)

def main():
    parser = argparse.ArgumentParser(description='Add 100 random elements to a DUC file')
    parser.add_argument('input', type=str, help='Path to input DUC file')
    parser.add_argument(
        '-o', '--output',
        type=str,
        help='Path to output DUC file (default: input_with_100_elements.duc)',
        default=None
    )

    args = parser.parse_args()

    # Convert to absolute paths
    input_path = Path(args.input).resolve()
    if args.output:
        output_path = Path(args.output).resolve()
    else:
        # Default output path is in the same directory as input with modified name
        output_path = input_path.parent / f"{input_path.stem}_with_100_elements.duc"

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Read and parse input file
    with open(input_path, "rb") as f:
        duc_data = parse_duc_flatbuffers(f)

    # Add 100 random elements
    for _ in range(100):
        duc_data["elements"].append(create_random_element())

    # Serialize and save
    serialized = save_as_flatbuffers(
        elements=duc_data["elements"],
        app_state=duc_data["appState"],
        files=duc_data["files"]
    )

    # Write output file
    with open(output_path, "wb") as f:
        f.write(serialized)

    print(f"Successfully added 100 random elements.")
    print(f"Input file: {input_path}")
    print(f"Output saved to: {output_path}")


# This test should:
# 1. Load a duc file (parse)
# 2. Add 100 random elements to the file
# 3. Save the duc file (serialize)
if __name__ == "__main__":
    main()
