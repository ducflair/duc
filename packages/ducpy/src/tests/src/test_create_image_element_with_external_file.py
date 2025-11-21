"""
Tests for serializing and parsing binary files in DUC format.
"""
import os
import ducpy as duc


def create_binary_files_dict(mime_type: str, image_id: str, image_bytes: bytes, timestamp_ms: int):
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
    """Test serializing a DUC file with binary image data and external file entry using the builder API."""
    import ducpy as duc

    image_path = os.path.join(test_assets_dir, "image-files", "infinite-zoom-math.png")
    assert os.path.exists(image_path), f"Test asset not found: {image_path}"

    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    current_time_ms = int(os.path.getmtime(image_path) * 1000)
    mime_type = "image/png"
    image_id = "test_image"

    external_file = (duc.StateBuilder()
        .build_external_file()
        .with_key(image_id)
        .with_mime_type(mime_type)
        .with_data(image_bytes)
        .build())

    # Use builder API for image element
    element = (duc.ElementBuilder()
        .at_position(100, 100) 
        .with_size(400, 300) 
        .with_label("Image") 
        .with_styles(duc.create_simple_styles()) 
        .build_image_element() 
        .with_file_id(image_id) 
        .build())

    duc_path = os.path.join(test_output_dir, "test_create_image_element_with_external_file.duc")
    
    duc.write_duc_file(
        file_path=duc_path,
        name="BinaryFilesTest",
        elements=[element],
        external_files=[external_file]
    )

    print(f"Created DUC file with external file entry at {duc_path}")
    print(f"Image ('{image_path}') size: {len(image_bytes)} bytes")

    assert os.path.exists(duc_path), f"DUC file was not created: {duc_path}"
    assert os.path.getsize(duc_path) > 0, "DUC file should not be empty"
