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

def create_binary_files_dict(mime_type: str, image_id: str, image_bytes: bytes, timestamp_ms: int) -> Dict[str, Dict]:
    """
    Creates a dictionary that will be correctly serialized by the serialize_binary_files function.
    This approach avoids modifying the BinaryFiles class.
    """
    # Create a dictionary with the exact structure expected by the serialization function
    return {
        image_id: {
            "id": image_id,
            "mimeType": mime_type,
            "created": timestamp_ms,
            "last_retrieved": timestamp_ms,
            "data": image_bytes
        }
    }

def test_create_duc_with_image(test_assets_dir, test_output_dir):
    """Test creating a DUC file with an embedded image."""
    image_filename = "infinite-zoom-math.png"
    output_filename = "test_with_image.duc"
    image_path = os.path.join(test_assets_dir, image_filename)
    output_path = os.path.join(test_output_dir, output_filename)
    
    # Validate image path
    assert os.path.exists(image_path), f"Image file not found: {image_path}"
    
    # Read image file
    image_bytes = read_image_file(image_path)
    
    # Get current timestamp in milliseconds
    current_time_ms = int(os.path.getmtime(image_path) * 1000)  # Convert to milliseconds
    
    # Create binary file entry
    mime_type = "image/png"
    image_id = "image1"
    
    # Create a custom dict instead of using BinaryFiles directly
    binary_files = create_binary_files_dict(
        mime_type=mime_type,
        image_id=image_id,
        image_bytes=image_bytes,
        timestamp_ms=current_time_ms
    )
    
    # Create image element that references the binary file
    element = create_image_element(
        x=100,
        y=100,
        width=400,
        height=300,
        image_id=image_id
    )
    
    # Create minimal app state
    app_state = AppState()
    
    # Serialize and save
    duc_bytes = save_as_flatbuffers([element], app_state, binary_files)
    
    with open(output_path, 'wb') as f:
        f.write(duc_bytes)
    
    print(f"Created DUC file with an image element at {output_path}")
    print(f"Image size: {len(image_bytes)} bytes")
    print(f"DUC file size: {len(duc_bytes)} bytes")
    
    assert os.path.exists(output_path), f"Output file was not created: {output_path}"
    assert os.path.getsize(output_path) > len(image_bytes), "DUC file should be larger than the image" 