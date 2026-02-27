"""Broad integration test for the new SQL-backed DUC schema."""

import os
import time

import ducpy as duc
from ducpy.builders.sql_builder import DucSQL


def _load_asset_bytes(base_dir: str, filename: str) -> bytes:
    _, ext = os.path.splitext(filename.lower())
    ext = ext[1:]
    if ext == "pdf":
        sub_dir = "pdf-files"
    elif ext in {"png", "jpg", "jpeg", "gif"}:
        sub_dir = "image-files"
    elif ext == "step":
        sub_dir = "step-files"
    else:
        sub_dir = "image-files"
    with open(os.path.join(base_dir, sub_dir, filename), "rb") as f:
        return f.read()


def test_a_duc_with_everything(test_output_dir, test_assets_dir):
    output_file = os.path.join(test_output_dir, "test_a_duc_with_everything.duc")
    now = int(time.time() * 1000)

    if os.path.exists(output_file):
        os.remove(output_file)

    thumbnail = _load_asset_bytes(test_assets_dir, "thumbnail.png")
    pdf_bytes = _load_asset_bytes(test_assets_dir, "test.pdf")
    step_bytes = _load_asset_bytes(test_assets_dir, "test.step")
    jpg_bytes = _load_asset_bytes(test_assets_dir, "test.jpg")

    # Builder stream: elements
    rect_from_builder = (
        duc.ElementBuilder()
        .at_position(10, 20)
        .with_size(100, 50)
        .with_label("Rectangle")
        .with_layer_id("layer1")
        .with_z_index(1.0)
        .with_styles(
            duc.create_fill_and_stroke_style(
                duc.create_solid_content("#4E79A7", opacity=0.85),
                duc.create_solid_content("#1F2937", opacity=1.0),
                stroke_width=2.0,
            )
        )
        .build_rectangle()
        .build()
    )
    rect_sql_style_target = (
        duc.ElementBuilder()
        .at_position(130, 20)
        .with_size(100, 50)
        .with_label("Rectangle from Builder (SQL style)")
        .with_layer_id("layer1")
        .with_z_index(1.5)
        .build_rectangle()
        .build()
    )
    line_from_builder = (
        duc.ElementBuilder()
        .with_label("Polyline")
        .with_z_index(4.0)
        .build_linear_element()
        .with_points([(0, 0), (50, 50)])
        .build()
    )
    line_sql_style_target = (
        duc.ElementBuilder()
        .with_label("Polyline from Builder (SQL style)")
        .with_z_index(4.5)
        .build_linear_element()
        .with_points([(10, 10), (60, 30), (110, 10)])
        .build()
    )
    text_from_builder = (
        duc.ElementBuilder()
        .at_position(50, 300)
        .with_size(200, 40)
        .with_label("Text")
        .with_z_index(8.0)
        .build_text_element()
        .with_text("Hello, DUC!")
        .with_text_style(duc.create_text_style(font_family="Arial", font_size=18))
        .build()
    )
    text_sql_style_target = (
        duc.ElementBuilder()
        .at_position(270, 300)
        .with_size(200, 40)
        .with_label("Text from Builder (SQL style)")
        .with_z_index(8.5)
        .build_text_element()
        .with_text("Builder text with SQL-applied style")
        .with_text_style(duc.create_text_style(font_family="Arial", font_size=14))
        .build()
    )
    doc_from_builder = (
        duc.ElementBuilder()
        .at_position(400, 500)
        .with_size(300, 100)
        .with_label("Doc")
        .with_z_index(7.0)
        .build_doc_element()
        .with_text("= Typst Doc\nThis is *Typst* content with {{Author}}.")
        .build()
    )
    doc_sql_style_target = (
        duc.ElementBuilder()
        .at_position(730, 500)
        .with_size(300, 100)
        .with_label("Doc from Builder (SQL style)")
        .with_z_index(7.5)
        .build_doc_element()
        .with_text("= Typst Companion\nThis doc is builder-created and SQL-styled.")
        .build()
    )

    # Builder stream: styles and stack-like state objects.
    builder_style = duc.create_fill_and_stroke_style(
        duc.create_solid_content("#A0D468", opacity=0.75),
        duc.create_solid_content("#2D3436", opacity=1.0),
        stroke_width=2.5,
    )
    builder_layer = (
        duc.StateBuilder()
        .with_id("layer1")
        .with_readonly(False)
        .build_layer()
        .with_label("Main Layer (builder)")
        .build()
    )
    builder_group = (
        duc.StateBuilder()
        .with_id("group1")
        .build_group()
        .with_label("Group1 (builder)")
        .build()
    )
    builder_region = (
        duc.StateBuilder()
        .with_id("region1")
        .build_region()
        .with_label("UnionRegion (builder)")
        .with_boolean_operation(duc.BOOLEAN_OPERATION.UNION)
        .build()
    )

    # SQL stream: style constants applied to builder-created elements.
    sql_style_fill_src = "#F6C85F"
    sql_style_stroke_src = "#6F4E7C"
    sql_style_stroke_width = 1.75

    with DucSQL.new(output_file) as db:
        # Document metadata + dictionary
        db.sql(
            "INSERT INTO duc_document (id, version, source, data_type, thumbnail) VALUES (?,?,?,?,?)",
            "everything_doc", "3.0.0", "ducpy_test", "DUC_DATA", thumbnail,
        )
        for k, v in [("ProjectName", "Everything Test"), ("Author", "TestBot"), ("Revision", "42")]:
            db.sql("INSERT INTO document_dictionary (key, value) VALUES (?,?)", k, v)

        # Global + local state
        db.sql(
            "INSERT INTO duc_global_state (id, name, view_background_color, main_scope, scope_exponent_threshold, pruning_level) "
            "VALUES (?,?,?,?,?,?)",
            1, "Everything", "#F0F0F0", "m", 3, 30,
        )
        db.sql(
            "INSERT INTO duc_local_state (id, scope, scroll_x, scroll_y, zoom, is_binding_enabled, pen_mode, view_mode_enabled, objects_snap_mode_enabled, grid_mode_enabled, outline_mode_enabled) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            1, "cm", 50.0, 75.0, 2.0, 0, 1, 1, 0, 0, 1,
        )

        # Layers / groups / regions: one from builders, one from SQL (mashup within same families).
        db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", builder_layer.id, builder_layer.stack_base.label)
        db.sql("INSERT INTO layers (id, readonly) VALUES (?,?)", builder_layer.id, 1 if builder_layer.readonly else 0)
        db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", "layer2", "Secondary Layer (sql)")
        db.sql("INSERT INTO layers (id, readonly) VALUES (?,?)", "layer2", 1)

        db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", builder_group.id, builder_group.stack_base.label)
        db.sql("INSERT INTO groups (id) VALUES (?)", builder_group.id)
        db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", "group2", "Group2 (sql)")
        db.sql("INSERT INTO groups (id) VALUES (?)", "group2")

        db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", builder_region.id, builder_region.stack_base.label)
        db.sql("INSERT INTO regions (id, boolean_operation) VALUES (?,?)", builder_region.id, 10)
        db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", "region2", "SubtractRegion (sql)")
        db.sql("INSERT INTO regions (id, boolean_operation) VALUES (?,?)", "region2", 11)

        # External files
        db.sql("INSERT INTO external_files (id, mime_type, data, created, last_retrieved) VALUES (?,?,?,?,?)", "pdf_file", "application/pdf", pdf_bytes, now, now)
        db.sql("INSERT INTO external_files (id, mime_type, data, created, last_retrieved) VALUES (?,?,?,?,?)", "step_file", "model/step", step_bytes, now, now)
        db.sql("INSERT INTO external_files (id, mime_type, data, created, last_retrieved) VALUES (?,?,?,?,?)", "jpg_file", "image/jpeg", jpg_bytes, now, now)

        # Core elements (broad type coverage in new schema): each family has builder+SQL-created members.
        rect_base = rect_from_builder.element.base
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id, z_index) VALUES (?,?,?,?,?,?,?,?,?)",
            "rect1", "rectangle", rect_base.x, rect_base.y, rect_base.width, rect_base.height, rect_base.label, rect_base.layer_id, rect_base.z_index,
        )
        # Apply SQL-created style onto builder-created rectangle.
        db.sql("INSERT INTO backgrounds (owner_type, owner_id, src, opacity) VALUES (?,?,?,?)", "element", "rect1", sql_style_fill_src, 0.80)
        db.sql("INSERT INTO strokes (owner_type, owner_id, src, width, opacity) VALUES (?,?,?,?,?)", "element", "rect1", sql_style_stroke_src, sql_style_stroke_width, 1.0)

        # Builder-created rectangle + SQL style (same family, second item).
        rect2_base = rect_sql_style_target.element.base
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id, z_index) VALUES (?,?,?,?,?,?,?,?,?)",
            "rect2", "rectangle", rect2_base.x, rect2_base.y, rect2_base.width, rect2_base.height, rect2_base.label, rect2_base.layer_id, rect2_base.z_index,
        )
        db.sql("INSERT INTO backgrounds (owner_type, owner_id, src, opacity) VALUES (?,?,?,?)", "element", "rect2", "#FF9DA7", 0.70)
        db.sql("INSERT INTO strokes (owner_type, owner_id, src, width, opacity) VALUES (?,?,?,?,?)", "element", "rect2", "#1F2937", 2.20, 1.0)

        # SQL-created rectangle + builder-created style (same family, third item).
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id, z_index) VALUES (?,?,?,?,?,?,?,?,?)",
            "rect3", "rectangle", 260, 20, 100, 50, "Rectangle from SQL (builder style)", "layer2", 2.0,
        )
        bkg = builder_style.background[0].content
        stk = builder_style.stroke[0]
        db.sql("INSERT INTO backgrounds (owner_type, owner_id, src, opacity) VALUES (?,?,?,?)", "element", "rect3", bkg.src, bkg.opacity)
        db.sql("INSERT INTO strokes (owner_type, owner_id, src, width, opacity) VALUES (?,?,?,?,?)", "element", "rect3", stk.content.src, stk.width, stk.content.opacity)

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id, z_index) VALUES (?,?,?,?,?,?,?,?,?)", "ell1", "ellipse", 200, 100, 80, 40, "Ellipse", "layer2", 2.0)
        db.sql("INSERT INTO element_ellipse (element_id, ratio, start_angle, end_angle) VALUES (?,?,?,?)", "ell1", 0.5, 0.0, 3.1415926535)

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)", "poly1", "polygon", 300, 200, 60, 60, "Pentagon", 3.0)
        db.sql("INSERT INTO element_polygon (element_id, sides) VALUES (?,?)", "poly1", 5)

        line_base = line_from_builder.element.linear_base.base
        line_points = line_from_builder.element.linear_base.points
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "line1", "line", line_base.x, line_base.y, line_base.width, line_base.height, line_base.label, line_base.z_index,
        )
        db.sql("INSERT INTO element_linear (element_id) VALUES (?)", "line1")
        for i, p in enumerate(line_points):
            db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", "line1", i, p.x, p.y)
        db.sql("INSERT INTO strokes (owner_type, owner_id, src, width) VALUES (?,?,?,?)", "element", "line1", "#111827", 1.4)

        line2_base = line_sql_style_target.element.linear_base.base
        line2_points = line_sql_style_target.element.linear_base.points
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "line2", "line", line2_base.x, line2_base.y, line2_base.width, line2_base.height, line2_base.label, line2_base.z_index,
        )
        db.sql("INSERT INTO element_linear (element_id) VALUES (?)", "line2")
        for i, p in enumerate(line2_points):
            db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", "line2", i, p.x, p.y)
        db.sql("INSERT INTO strokes (owner_type, owner_id, src, width) VALUES (?,?,?,?)", "element", "line2", "#6F4E7C", 2.0)

        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "line3", "line", 0, 0, 0, 0, "Polyline from SQL (builder style)", 5.0,
        )
        db.sql("INSERT INTO element_linear (element_id) VALUES (?)", "line3")
        db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", "line3", 0, 0.0, 0.0)
        db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", "line3", 1, 60.0, 20.0)
        db.sql("INSERT INTO strokes (owner_type, owner_id, src, width, opacity) VALUES (?,?,?,?,?)", "element", "line3", stk.content.src, stk.width, stk.content.opacity)

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)", "img1", "image", 400, 50, 120, 80, "Image", 5.0)
        db.sql("INSERT INTO element_image (element_id, file_id, status) VALUES (?,?,?)", "img1", "jpg_file", 11)

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)", "pdf1", "pdf", 500, 100, 100, 140, "PDF", 6.0)
        db.sql("INSERT INTO document_grid_config (element_id, file_id, grid_columns, grid_scale) VALUES (?,?,?,?)", "pdf1", "pdf_file", 1, 1.0)
        db.sql("INSERT INTO element_pdf (element_id) VALUES (?)", "pdf1")

        doc_base = doc_from_builder.element.base
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "doc1", "doc", doc_base.x, doc_base.y, doc_base.width, doc_base.height, doc_base.label, doc_base.z_index,
        )
        db.sql("INSERT INTO document_grid_config (element_id, file_id, grid_columns, grid_scale) VALUES (?,?,?,?)", "doc1", None, 1, 1.0)
        db.sql("INSERT INTO element_doc (element_id, text) VALUES (?,?)", "doc1", doc_from_builder.element.text)

        # SQL-created doc with Typst content.
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "doc2", "doc", 1060, 500, 300, 100, "Doc from SQL (Typst)", 8.0,
        )
        db.sql("INSERT INTO document_grid_config (element_id, file_id, grid_columns, grid_scale) VALUES (?,?,?,?)", "doc2", None, 2, 1.0)
        db.sql(
            "INSERT INTO element_doc (element_id, text) VALUES (?,?)",
            "doc2", "= Typst SQL Doc\\nThis document is SQL-authored and complements builder docs.",
        )

        doc2_base = doc_sql_style_target.element.base
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "doc3", "doc", doc2_base.x, doc2_base.y, doc2_base.width, doc2_base.height, doc2_base.label, doc2_base.z_index,
        )
        db.sql("INSERT INTO document_grid_config (element_id, file_id, grid_columns, grid_scale) VALUES (?,?,?,?)", "doc3", None, 1, 1.0)
        db.sql("INSERT INTO element_doc (element_id, text) VALUES (?,?)", "doc3", doc_sql_style_target.element.text)

        text_base = text_from_builder.element.base
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "txt1", "text", text_base.x, text_base.y, text_base.width, text_base.height, text_base.label, text_base.z_index,
        )
        db.sql(
            "INSERT INTO element_text (element_id, text, original_text, font_family, font_size) VALUES (?,?,?,?,?)",
            "txt1", text_from_builder.element.text, text_from_builder.element.original_text, "Arial", 18.0,
        )

        text2_base = text_sql_style_target.element.base
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "txt2", "text", text2_base.x, text2_base.y, text2_base.width, text2_base.height, text2_base.label, text2_base.z_index,
        )
        db.sql(
            "INSERT INTO element_text (element_id, text, original_text, font_family, font_size) VALUES (?,?,?,?,?)",
            "txt2", text_sql_style_target.element.text, text_sql_style_target.element.original_text, "Arial", 14.0,
        )

        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)",
            "txt3", "text", 490, 300, 200, 40, "Text from SQL (builder style companion)", 9.0,
        )
        db.sql(
            "INSERT INTO element_text (element_id, text, original_text, font_family, font_size) VALUES (?,?,?,?,?)",
            "txt3", "SQL text that complements builder text", "SQL text that complements builder text", "Inter", 15.0,
        )

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)", "tbl1", "table", 100, 400, 300, 120, "Table", 9.0)
        db.sql("INSERT INTO external_files (id, mime_type, data, created, last_retrieved) VALUES (?,?,?,?,?)", "xlsx_tbl", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", b"fake-xlsx", now, now)
        db.sql("INSERT INTO element_table (element_id, file_id) VALUES (?,?)", "tbl1", "xlsx_tbl")

        # Blocks: SQL block definition that references both builder- and SQL-originated rectangles.
        db.sql("INSERT INTO blocks (id, label, description, version) VALUES (?,?,?,?)", "block_rects", "Rectangle Block", "Builder+SQL rectangle members", 1)
        db.sql(
            "INSERT INTO block_metadata (owner_type, owner_id, source, usage_count, created_at, updated_at) VALUES (?,?,?,?,?,?)",
            "block", "block_rects", "mashup_test", 2, now, now,
        )
        db.sql("INSERT INTO element_block_memberships (element_id, block_id, sort_order) VALUES (?,?,?)", "rect1", "block_rects", 0)
        db.sql("INSERT INTO element_block_memberships (element_id, block_id, sort_order) VALUES (?,?,?)", "rect3", "block_rects", 1)
        db.sql("INSERT INTO block_instances (id, block_id, version) VALUES (?,?,?)", "block_inst_1", "block_rects", 1)
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, instance_id, z_index) VALUES (?,?,?,?,?,?,?,?,?)",
            "rect_block_instance", "rectangle", 380, 20, 100, 50, "Block Instance Rectangle", "block_inst_1", 3.0,
        )

        # Frame + plot
        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)", "frame1", "frame", 700, 50, 150, 100, "Frame", 10.0)
        db.sql("INSERT INTO element_stack_properties (element_id, label) VALUES (?,?)", "frame1", "Frame")
        db.sql("INSERT INTO element_frame (element_id) VALUES (?)", "frame1")

        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, z_index) VALUES (?,?,?,?,?,?,?,?)", "plot1", "plot", 700, 200, 200, 150, "Plot", 11.0)
        db.sql("INSERT INTO element_stack_properties (element_id, label) VALUES (?,?)", "plot1", "Plot")
        db.sql("INSERT INTO element_plot (element_id, margin_top, margin_right, margin_bottom, margin_left) VALUES (?,?,?,?,?)", "plot1", 5.0, 5.0, 5.0, 5.0)

        # Version graph essentials
        db.sql("INSERT INTO version_chains (id, schema_version, start_version, root_checkpoint_id) VALUES (?,?,?,?)", "chain_1", 1, 0, "cp_1")
        db.sql("INSERT INTO checkpoints (id, chain_id, version_number, schema_version, timestamp, description, data, size_bytes) VALUES (?,?,?,?,?,?,?,?)", "cp_1", "chain_1", 1, 1, now, "initial", b"snapshot", 8)
        db.sql("INSERT INTO deltas (id, base_checkpoint_id, chain_id, delta_sequence, version_number, schema_version, timestamp, description, changeset, size_bytes) VALUES (?,?,?,?,?,?,?,?,?,?)", "d_1", "cp_1", "chain_1", 1, 2, 1, now + 1, "delta", b"changes", 7)
        db.sql("UPDATE version_graph SET current_version = ?, current_schema_version = ?, user_checkpoint_version_id = ?, latest_version_id = ? WHERE id = 1", 2, 1, "cp_1", "d_1")

        # Memberships
        db.sql("INSERT INTO element_group_memberships (element_id, group_id, sort_order) VALUES (?,?,?)", "rect1", "group1", 0)
        db.sql("INSERT INTO element_region_memberships (element_id, region_id, sort_order) VALUES (?,?,?)", "rect1", "region1", 0)
        db.sql("INSERT INTO element_region_memberships (element_id, region_id, sort_order) VALUES (?,?,?)", "rect3", "region2", 0)

    with DucSQL(output_file) as db:
        assert db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"] >= 20
        assert db.sql("SELECT COUNT(*) AS n FROM external_files")[0]["n"] >= 4
        assert db.sql("SELECT COUNT(*) AS n FROM layers")[0]["n"] == 2
        assert db.sql("SELECT COUNT(*) AS n FROM groups")[0]["n"] == 2
        assert db.sql("SELECT COUNT(*) AS n FROM regions")[0]["n"] == 2
        assert db.sql("SELECT COUNT(*) AS n FROM checkpoints")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM deltas")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM blocks")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM block_instances")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM element_block_memberships WHERE block_id = ?", "block_rects")[0]["n"] == 2

        # Verify same-family mashups exist (builder + SQL for rectangle/text/line/doc).
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'rectangle'")[0]["n"] >= 4
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'line'")[0]["n"] >= 3
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'text'")[0]["n"] >= 3
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'doc'")[0]["n"] >= 3

        # Builder-style and SQL-style both persisted and attached.
        style_rows = db.sql("SELECT owner_id, src, width FROM strokes WHERE owner_type = 'element' ORDER BY owner_id")
        style_owner_ids = {r["owner_id"] for r in style_rows}
        assert "rect1" in style_owner_ids and "rect3" in style_owner_ids

        typst_docs = db.sql("SELECT text FROM element_doc ORDER BY element_id")
        assert all("Typst" in row["text"] for row in typst_docs)
