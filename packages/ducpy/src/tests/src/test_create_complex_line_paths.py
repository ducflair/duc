"""Create complex line path data using linear tables."""

import os

from ducpy.builders.sql_builder import DucSQL


def test_create_complex_line_paths(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_complex_line_paths_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        eid = "line_complex"
        db.sql("INSERT INTO elements (id, element_type, label) VALUES (?,?,?)", eid, "line", "Complex Path")
        db.sql("INSERT INTO element_linear (element_id) VALUES (?)", eid)

        pts = [(0, 0), (40, 20), (80, -10), (120, 30), (160, 0)]
        for i, (x, y) in enumerate(pts):
            db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, i, x, y)

        # 4 connected segments with handles
        for i in range(4):
            db.sql(
                "INSERT INTO linear_element_lines (element_id, sort_order, start_index, start_handle_x, start_handle_y, end_index, end_handle_x, end_handle_y) VALUES (?,?,?,?,?,?,?,?)",
                eid, i, i, pts[i][0] + 10, pts[i][1], i + 1, pts[i + 1][0] - 10, pts[i + 1][1],
            )

        db.sql("INSERT INTO linear_path_overrides (element_id, sort_order) VALUES (?,?)", eid, 0)
        pov = db.sql("SELECT id FROM linear_path_overrides WHERE element_id = ?", eid)[0]["id"]
        for i in range(4):
            db.sql("INSERT INTO linear_path_override_indices (path_override_id, sort_order, line_index) VALUES (?,?,?)", pov, i, i)

        assert db.sql("SELECT COUNT(*) AS n FROM linear_element_points WHERE element_id = ?", eid)[0]["n"] == 5
        assert db.sql("SELECT COUNT(*) AS n FROM linear_element_lines WHERE element_id = ?", eid)[0]["n"] == 4
