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

    image_path = os.path.join(test_assets_dir, "infinite-zoom-math.png")
    assert os.path.exists(image_path), f"Test asset not found: {image_path}"

    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    current_time_ms = int(os.path.getmtime(image_path) * 1000)
    mime_type = "image/png"
    image_id = "test_image"

    external_file = duc.create_external_file(
        key=image_id,
        mime_type=mime_type,
        data=image_bytes,
        id=image_id,
        last_retrieved=current_time_ms
    )

    # Use builder API for rectangle with image background
    element = duc.create_image_element(
        x=100,
        y=100,
        width=400,
        height=300,
        styles=duc.create_fill_and_stroke_style(
            fill_content=duc.create_image_content(image_id),
            stroke_content=duc.create_solid_content("#000000"),
            stroke_width=0.0
        ),
        label="Image",
        file_id=image_id
    )

    duc_path = os.path.join(test_output_dir, "test_create_image_element_with_external_file.duc")
    duc_bytes = duc.serialize_duc(
        name="BinaryFilesTest",
        elements=[element],
        external_files=[external_file]
    )

    with open(duc_path, 'wb') as f:
        f.write(duc_bytes)

    print(f"Created DUC file with external file entry at {duc_path}")
    print(f"Image ('{image_path}') size: {len(image_bytes)} bytes")
    print(f"DUC file size: {len(duc_bytes)} bytes")

    assert os.path.exists(duc_path), f"DUC file was not created: {duc_path}"
    assert os.path.getsize(duc_path) > 0, "DUC file should not be empty"
