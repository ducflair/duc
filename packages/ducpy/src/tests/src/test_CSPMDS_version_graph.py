"""Version graph lifecycle test against the new SQL schema."""

import os
import time

from ducpy.builders.sql_builder import DucSQL


def test_cspmds_version_graph(test_output_dir):
    output_file = os.path.join(test_output_dir, "cspmds_version_graph_sql.duc")
    now = int(time.time() * 1000)

    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        db.sql(
            "INSERT INTO version_chains (id, schema_version, start_version, root_checkpoint_id) "
            "VALUES (?,?,?,?)",
            "chain_1", 1, 0, "cp_1",
        )

        db.sql(
            "INSERT INTO checkpoints "
            "(id, parent_id, chain_id, version_number, schema_version, timestamp, description, data, size_bytes) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            "cp_1", None, "chain_1", 1, 1, now, "Initial snapshot", b"state_v1", 8,
        )
        db.sql(
            "INSERT INTO checkpoints "
            "(id, parent_id, chain_id, version_number, schema_version, timestamp, description, data, size_bytes) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            "cp_2", "cp_1", "chain_1", 2, 1, now + 1, "Second snapshot", b"state_v2", 8,
        )

        db.sql(
            "INSERT INTO deltas "
            "(id, parent_id, base_checkpoint_id, chain_id, delta_sequence, version_number, schema_version, timestamp, description, changeset, size_bytes) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            "d_1", None, "cp_2", "chain_1", 1, 3, 1, now + 2, "move element", b"delta_1", 7,
        )
        db.sql(
            "INSERT INTO deltas "
            "(id, parent_id, base_checkpoint_id, chain_id, delta_sequence, version_number, schema_version, timestamp, description, changeset, size_bytes) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            "d_2", "d_1", "cp_2", "chain_1", 2, 4, 1, now + 3, "scale element", b"delta_2", 7,
        )

        db.sql(
            "UPDATE version_graph "
            "SET current_version = ?, current_schema_version = ?, user_checkpoint_version_id = ?, latest_version_id = ?, total_size = ? "
            "WHERE id = 1",
            4, 1, "cp_2", "d_2", 30,
        )

        db.sql(
            "INSERT INTO schema_migrations "
            "(from_schema_version, to_schema_version, migration_name, migration_sql, applied_at, boundary_checkpoint_id) "
            "VALUES (?,?,?,?,?,?)",
            1, 2, "v1_to_v2", "ALTER TABLE elements ADD COLUMN test_col TEXT;", now + 4, "cp_3",
        )
        db.sql(
            "INSERT INTO version_chains (id, schema_version, start_version, root_checkpoint_id) "
            "VALUES (?,?,?,?)",
            "chain_2", 2, 5, "cp_3",
        )
        db.sql(
            "INSERT INTO checkpoints "
            "(id, parent_id, chain_id, version_number, schema_version, timestamp, description, is_schema_boundary, data, size_bytes) "
            "VALUES (?,?,?,?,?,?,?,?,?,?)",
            "cp_3", None, "chain_2", 5, 2, now + 5, "Schema boundary", 1, b"state_v3", 8,
        )

        db.sql("UPDATE deltas SET description = ? WHERE id = ?", "move element updated", "d_1")
        db.sql("DELETE FROM deltas WHERE id = ?", "d_1")

        assert db.sql("SELECT COUNT(*) AS n FROM checkpoints")[0]["n"] == 3
        assert db.sql("SELECT COUNT(*) AS n FROM deltas")[0]["n"] == 1
        assert db.sql("SELECT current_schema_version FROM version_graph")[0]["current_schema_version"] == 1
        assert db.sql("SELECT COUNT(*) AS n FROM schema_migrations")[0]["n"] == 1

    with DucSQL(output_file) as db2:
        assert db2.sql("SELECT latest_version_id FROM version_graph")[0]["latest_version_id"] == "d_2"
        assert db2.sql("SELECT COUNT(*) AS n FROM version_chains")[0]["n"] == 2