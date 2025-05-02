import argparse
import uuid
import os
import base64
from typing import Dict

from ..ducpy.classes.DucElementClass import DucElementUnion, DucRectangleElement
from ..ducpy.classes.AppStateClass import AppState
from ..ducpy.classes.BinaryFilesClass import BinaryFiles
from ..ducpy.utils.ElementTypes import (
    ElementBackground, ElementStroke, ElementContentBase, StrokeStyle, StrokeSides
)
from ..ducpy.utils.enums import (
    ElementType, ElementContentPreference, StrokePreference,
    StrokePlacement, StrokeJoin, StrokeCap
)
from ..ducpy.serialize.serialize_duc import save_as_flatbuffers

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

def create_data_url(mime_type: str, image_bytes: bytes) -> str:
    """Create a data URL from image bytes."""
    base64_data = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:{mime_type};base64,{base64_data}"

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

def main():
    parser = argparse.ArgumentParser(description='Create a DUC file with an image binary file')
    parser.add_argument('-o', '--output', required=True, help='Output DUC file path')
    parser.add_argument('-i', '--image', default=None, 
                        help='Image file path (defaults to assets/infinite-zoom-math.png)')
    
    args = parser.parse_args()
    
    # Default image path
    if args.image is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        args.image = os.path.join(script_dir, 'assets', 'infinite-zoom-math.png')
    
    # Validate image path
    if not os.path.exists(args.image):
        raise FileNotFoundError(f"Image file not found: {args.image}")
    
    # Read image file
    image_bytes = read_image_file(args.image)
    
    # Get current timestamp in milliseconds
    current_time_ms = int(os.path.getmtime(args.image) * 1000)  # Convert to milliseconds
    
    # Create binary file entry
    mime_type = "image/png"
    image_id = "image1"
    
    # Create a custom dict instead of using BinaryFiles directly
    # This is needed because the serialize_binary_files function expects different attribute names
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
    
    try:
        # Serialize and save
        duc_bytes = save_as_flatbuffers([element], app_state, binary_files)
        
        with open(args.output, 'wb') as f:
            f.write(duc_bytes)
        
        print(f"Created DUC file with an image element at {args.output}")
        print(f"Image size: {len(image_bytes)} bytes")
        print(f"DUC file size: {len(duc_bytes)} bytes")
        
    except Exception as e:
        print(f"Failed to save file: {str(e)}")
        raise

if __name__ == '__main__':
    main() 