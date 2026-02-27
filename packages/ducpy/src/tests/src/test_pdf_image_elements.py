"""PDF and image element integration test on SQL schema."""

import os
import time

from ducpy.builders.sql_builder import DucSQL


def test_csp_pdf_image_elements(test_output_dir, load_test_asset):
    output_file = os.path.join(test_output_dir, "test_pdf_image_elements_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)
    now = int(time.time() * 1000)

    pdf_bytes = load_test_asset("test.pdf")
    image_bytes = load_test_asset("test.jpg")

    with DucSQL.new(output_file) as db:
        db.sql("INSERT INTO external_files (id, mime_type, data, created, last_retrieved) VALUES (?,?,?,?,?)", "file_pdf", "application/pdf", pdf_bytes, now, now)
        db.sql("INSERT INTO external_files (id, mime_type, data, created, last_retrieved) VALUES (?,?,?,?,?)", "file_img", "image/jpeg", image_bytes, now, now)

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", "pdf_el", "pdf", 100, 100, 300, 400, "PDF")
        db.sql("INSERT INTO document_grid_config (element_id, file_id, grid_columns, grid_scale) VALUES (?,?,?,?)", "pdf_el", "file_pdf", 1, 1.0)
        db.sql("INSERT INTO element_pdf (element_id) VALUES (?)", "pdf_el")

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", "img_el", "image", 450, 100, 320, 240, "Image")
        db.sql("INSERT INTO element_image (element_id, file_id, status, scale_x, scale_y) VALUES (?,?,?,?,?)", "img_el", "file_img", 11, 1.0, 1.0)

        assert db.sql("SELECT COUNT(*) AS n FROM element_pdf")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM element_image")[0]["n"] == 1
