import os
import random
import numpy as np
import argparse
from pathlib import Path
from ..ducpy.parse.parse_duc import parse_duc_flatbuffers
from ..ducpy.serialize.serialize_duc import save_as_flatbuffers
from ..ducpy.classes.DucElementClass import (
    DucElement, DucTextElement, DucRectangleElement, DucEllipseElement,
    DucDiamondElement, DucFreeDrawElement, DucLinearElement, Point
)

def move_element_randomly(element: DucElement):
    # Random translation
    dx = random.uniform(-500, 500)
    dy = random.uniform(-500, 500)
    
    # Random rotation
    dangle = random.uniform(-np.pi/2, np.pi/2)
    
    # Apply translation
    element.x += dx
    element.y += dy
    
    # Apply rotation
    element.angle = (element.angle + dangle) % (2 * np.pi)
    
    # Special handling for elements with points (FreeDraw and Linear elements)
    if isinstance(element, (DucFreeDrawElement, DucLinearElement)) and element.points:
        # Move all points by the same translation to maintain shape
        for point in element.points:
            point.x += dx
            point.y += dy
            
        # If there's a last committed point, move it too
        if element.last_committed_point:
            element.last_committed_point.x += dx
            element.last_committed_point.y += dy

def main():
    parser = argparse.ArgumentParser(description='Move all elements randomly in a DUC file')
    parser.add_argument('input', type=str, help='Path to input DUC file')
    parser.add_argument(
        '-o', '--output',
        type=str,
        help='Path to output DUC file (default: input_moved.duc)',
        default=None
    )
    parser.add_argument(
        '--max-distance',
        type=float,
        help='Maximum distance to move elements (default: 500)',
        default=500
    )
    parser.add_argument(
        '--max-rotation',
        type=float,
        help='Maximum rotation in radians (default: pi/2)',
        default=np.pi/2
    )

    args = parser.parse_args()

    # Convert to absolute paths
    input_path = Path(args.input).resolve()
    if args.output:
        output_path = Path(args.output).resolve()
    else:
        # Default output path is in the same directory as input with modified name
        output_path = input_path.parent / f"{input_path.stem}_moved.duc"

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Read and parse input file
    with open(input_path, "rb") as f:
        duc_data = parse_duc_flatbuffers(f)

    # Move each element randomly
    for element in duc_data["elements"]:
        move_element_randomly(element)

    # Serialize and save
    serialized = save_as_flatbuffers(
        elements=duc_data["elements"],
        app_state=duc_data["appState"],
        files=duc_data["files"]
    )

    # Write output file
    with open(output_path, "wb") as f:
        f.write(serialized)

    print(f"Successfully moved all elements randomly.")
    print(f"Input file: {input_path}")
    print(f"Output saved to: {output_path}")

# This test should:
# 1. Load a duc file (parse)
# 2. Move all the elements around randomly
# 3. Save the duc file (serialize)
if __name__ == "__main__":
    main()

