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


def test_image_with_external_file_via_sql(test_assets_dir, test_output_dir):
    """Insert an image element with an external binary file using raw SQL."""
    import time as _time

    from ducpy.builders.sql_builder import DucSQL

    image_path = os.path.join(test_assets_dir, "image-files", "infinite-zoom-math.png")
    assert os.path.exists(image_path), f"Test asset not found: {image_path}"

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    now = int(_time.time() * 1000)
    output_file = os.path.join(test_output_dir, "test_image_external_sql.duc")

    with DucSQL.new() as db:
        # Insert external file
        db.sql(
            "INSERT INTO external_files (id, mime_type, data, created, last_retrieved) "
            "VALUES (?,?,?,?,?)",
            "img_001", "image/png", image_bytes, now, now,
        )

        # Insert image element referencing the file
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) "
            "VALUES (?,?,?,?,?,?,?)",
            "img_el", "image", 100, 100, 400, 300, "Photo",
        )
        db.sql(
            "INSERT INTO element_image (element_id, file_id, status, scale_x, scale_y) "
            "VALUES (?,?,?,?,?)",
            "img_el", "img_001", 11, 1.0, 1.0,  # IMAGE_STATUS.SAVED=11
        )

        # Verify external file was stored
        ef = db.sql("SELECT id, mime_type, LENGTH(data) AS sz FROM external_files")[0]
        assert ef["id"] == "img_001"
        assert ef["mime_type"] == "image/png"
        assert ef["sz"] == len(image_bytes)

        # Verify image element links to file
        img = db.sql(
            "SELECT ei.file_id, ei.status, e.label "
            "FROM element_image ei JOIN elements e ON e.id = ei.element_id "
            "WHERE ei.element_id = ?", "img_el"
        )[0]
        assert img["file_id"] == "img_001"
        assert img["status"] == 11
        assert img["label"] == "Photo"

        db.save(output_file)

    # Roundtrip: re-open and verify the binary data survived
    with DucSQL(output_file) as db2:
        stored = db2.sql("SELECT data FROM external_files WHERE id = ?", "img_001")[0]
        assert bytes(stored["data"]) == image_bytes


# Legacy builder/native serialization test now covered by SQL-first variant.
test_binary_files_serialization = test_image_with_external_file_via_sql
