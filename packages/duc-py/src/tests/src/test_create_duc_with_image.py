"""
Test creating a DUC file with an image binary file.
"""
import os
import base64
import uuid
from typing import Dict

import pytest

from ducpy.classes.DucElementClass import DucElementUnion, DucRectangleElement
from ducpy.classes.AppStateClass import AppState
from ducpy.utils.ElementTypes import (
    ElementBackground, ElementStroke, ElementContentBase, StrokeStyle, StrokeSides
)
from ducpy.utils.enums import (
    ElementType, ElementContentPreference, StrokePreference,
    StrokePlacement, StrokeJoin, StrokeCap
)
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.serialize.serialize_binary_files import create_binary_files_dict_from_list

scope = "mm"

def create_image_element(x: float, y: float, width: float, height: float, image_id: str) -> DucElementUnion:
    """Create an image element that references a binary file."""
    # Create stroke and background with image reference
    stroke = ElementStroke(
        content=ElementContentBase(
            preference=int(ElementContentPreference.SOLID),
            src="#000000",
            visible=True,
            opacity=1.0
        ),
        width=0.0,  # No stroke for image
        style=StrokeStyle(
            preference=int(StrokePreference.SOLID),
            join=int(StrokeJoin.MITER),
            cap=int(StrokeCap.BUTT)
        ),
        placement=int(StrokePlacement.INSIDE)
    )

    background = ElementBackground(
        content=ElementContentBase(
            preference=int(ElementContentPreference.STRETCH),  # Using STRETCH for image
            src=image_id,  # Reference to the binary file ID
            visible=True,
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

def read_image_file(file_path: str) -> bytes:
    """Read image file as bytes."""
    with open(file_path, 'rb') as f:
        return f.read()

def test_create_duc_with_image(test_assets_dir, test_output_dir):
    """Test creating a DUC file with two embedded images."""
    # Image 1 details
    image_filename1 = "infinite-zoom-math.png"
    image_id1 = "image1_zoom"
    mime_type1 = "image/png"
    image_path1 = os.path.join(test_assets_dir, image_filename1)

    # Image 2 details
    image_filename2 = "rect.png" # Second image
    image_id2 = "image2_rect"
    mime_type2 = "image/png"
    image_path2 = os.path.join(test_assets_dir, image_filename2)
    
    output_filename = "test_with_image.duc"
    output_path = os.path.join(test_output_dir, output_filename)
    
    # Validate image paths
    assert os.path.exists(image_path1), f"Image file not found: {image_path1}"
    assert os.path.exists(image_path2), f"Image file not found: {image_path2}"
    
    # Read image files
    image_bytes1 = read_image_file(image_path1)
    image_bytes2 = read_image_file(image_path2)
    
    # Get current timestamps in milliseconds
    current_time_ms1 = int(os.path.getmtime(image_path1) * 1000)
    current_time_ms2 = int(os.path.getmtime(image_path2) * 1000)
    
    # Create the binary_files dictionary using the new list-based helper
    binary_files = create_binary_files_dict_from_list([
        {
            "image_id": image_id1, # This will be the key in binary_files and the 'id' in data
            "mime_type": mime_type1,
            "image_bytes": image_bytes1,
            "timestamp_ms": current_time_ms1
        },
        {
            "image_id": image_id2, # This will be the key in binary_files and the 'id' in data
            "mime_type": mime_type2,
            "image_bytes": image_bytes2,
            "timestamp_ms": current_time_ms2
        }
    ])
    
    # Create image elements that reference the binary files
    element1 = create_image_element(
        x=50,
        y=50,
        width=300,
        height=200,
        image_id=image_id1 # Reference to the key in binary_files
    )
    element2 = create_image_element(
        x=400,
        y=100,
        width=250,
        height=150,
        image_id=image_id2 # Reference to the key in binary_files
    )
    
    # Create minimal app state
    app_state = AppState()
    # app_state = None
    
    # Serialize and save
    duc_bytes = save_as_flatbuffers([element1, element2], app_state, binary_files) # Pass both elements
    
    with open(output_path, 'wb') as f:
        f.write(duc_bytes)
    
    print(f"Created DUC file with two image elements at {output_path}")
    print(f"Image 1 ('{image_filename1}') size: {len(image_bytes1)} bytes")
    print(f"Image 2 ('{image_filename2}') size: {len(image_bytes2)} bytes")
    print(f"Total image data size: {len(image_bytes1) + len(image_bytes2)} bytes")
    print(f"DUC file size: {len(duc_bytes)} bytes")
    
    assert os.path.exists(output_path), f"Output file was not created: {output_path}"
    assert os.path.getsize(output_path) > (len(image_bytes1) + len(image_bytes2)), "DUC file should be larger than the sum of the image sizes" 