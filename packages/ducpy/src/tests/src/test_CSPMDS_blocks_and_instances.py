"""SQL-schema test for blocks and block instances."""

import os
import time

from ducpy.builders.sql_builder import DucSQL


def test_cspmds_blocks_and_instances(test_output_dir):
    output_file = os.path.join(test_output_dir, "cspmds_blocks_instances_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)
    now = int(time.time() * 1000)

    with DucSQL.new(output_file) as db:
        db.sql("INSERT INTO blocks (id, label, description, version) VALUES (?,?,?,?)", "blk_title", "Title Block", "Test block", 1)
        db.sql(
            "INSERT INTO block_metadata (owner_type, owner_id, source, usage_count, created_at, updated_at) VALUES (?,?,?,?,?,?)",
            "block", "blk_title", "test", 0, now, now,
        )

        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)",
            "src_rect", "rectangle", 0, 0, 140, 40, "Title Rectangle",
        )
        db.sql("INSERT INTO element_block_memberships (element_id, block_id, sort_order) VALUES (?,?,?)", "src_rect", "blk_title", 0)

        db.sql(
            "INSERT INTO block_instances (id, block_id, version, dup_rows, dup_cols, dup_row_spacing, dup_col_spacing) VALUES (?,?,?,?,?,?,?)",
            "inst_1", "blk_title", 1, 2, 3, 30.0, 40.0,
        )
        db.sql("INSERT INTO block_instance_overrides (instance_id, key, value) VALUES (?,?,?)", "inst_1", "title", "Drawing A")

        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, instance_id) VALUES (?,?,?,?,?,?,?,?)",
            "inst_rect", "rectangle", 200, 200, 140, 40, "Instance Rect", "inst_1",
        )

        assert db.sql("SELECT COUNT(*) AS n FROM blocks")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM block_instances")[0]["n"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM element_block_memberships")[0]["n"] == 1

        db.sql("UPDATE blocks SET version = 2 WHERE id = ?", "blk_title")
        db.sql("DELETE FROM elements WHERE id = ?", "inst_rect")
        db.sql("DELETE FROM block_instance_overrides WHERE instance_id = ?", "inst_1")
        db.sql("DELETE FROM block_instances WHERE id = ?", "inst_1")

        assert db.sql("SELECT COUNT(*) AS n FROM block_instances")[0]["n"] == 0
