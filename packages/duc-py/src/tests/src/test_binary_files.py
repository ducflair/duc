"""
Tests for serializing and parsing binary files in DUC format.
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


def create_image_element(x: float, y: float, width: float, height: float, image_id: str) -> DucElementUnion:
    """Create a rectangle element that references an image."""
    scope = "mm"
    
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


def create_binary_files_dict(mime_type: str, image_id: str, image_bytes: bytes, timestamp_ms: int) -> Dict[str, Dict]:
    """
    Creates a dictionary that will be correctly serialized by the serialize_binary_files function.
    """
    return {
        image_id: {
            "id": image_id,
            "mimeType": mime_type,
            "created": timestamp_ms,
            "last_retrieved": timestamp_ms,
            "data": image_bytes
        }
    }


def test_binary_files_serialization(test_assets_dir, test_output_dir):
    """Test serializing a DUC file with binary image data."""
    # Load test image
    image_path = os.path.join(test_assets_dir, "infinite-zoom-math.png")
    assert os.path.exists(image_path), f"Test asset not found: {image_path}"
    
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    # Get timestamp
    current_time_ms = int(os.path.getmtime(image_path) * 1000)
    
    # Create binary file entry
    mime_type = "image/png"
    image_id = "test_image"
    
    binary_files = create_binary_files_dict(
        mime_type=mime_type,
        image_id=image_id,
        image_bytes=image_bytes,
        timestamp_ms=current_time_ms
    )
    
    # Create image element
    element = create_image_element(
        x=100, 
        y=100,
        width=400,
        height=300,
        image_id=image_id
    )
    
    # Create app state
    app_state = AppState()
    
    # Serialize to DUC
    duc_path = os.path.join(test_output_dir, "test_binary_files.duc")
    duc_bytes = save_as_flatbuffers([element], app_state, binary_files)
    
    # Save to file
    with open(duc_path, 'wb') as f:
        f.write(duc_bytes)
    
    # Verify file was created and has correct size
    assert os.path.exists(duc_path), f"DUC file was not created: {duc_path}"
    assert os.path.getsize(duc_path) > len(image_bytes), "DUC file should be larger than the image"
    
    # For a comprehensive test, we would also parse the file and verify the binary data,
    # but that's not required for this basic test of serialization 