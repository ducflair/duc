"""Create connected line graphs in SQL-backed .duc files."""

import os

from ducpy.builders.sql_builder import DucSQL


def test_create_100_connected_elements(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_100_connected_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        for i in range(100):
            eid = f"line_{i}"
            db.sql("INSERT INTO elements (id, element_type, label) VALUES (?,?,?)", eid, "line", f"Line {i}")
            db.sql("INSERT INTO element_linear (element_id) VALUES (?)", eid)
            db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, 0, i * 10.0, 0.0)
            db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, 1, i * 10.0 + 5.0, 10.0)
            if i > 0:
                db.sql("INSERT INTO element_bound_elements (element_id, bound_element_id, bound_type, sort_order) VALUES (?,?,?,?)", eid, f"line_{i-1}", "line", 0)

        assert db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"] == 100
        assert db.sql("SELECT COUNT(*) AS n FROM element_bound_elements")[0]["n"] == 99


def test_create_connected_duc(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_connected_graph_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        for i in range(10):
            eid = f"node_{i}"
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", eid, "rectangle", i * 20.0, i * 10.0, 10.0, 10.0, f"Node {i}")
            if i > 0:
                db.sql("INSERT INTO element_bound_elements (element_id, bound_element_id, bound_type, sort_order) VALUES (?,?,?,?)", eid, f"node_{i-1}", "rectangle", 0)

        assert db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"] == 10
