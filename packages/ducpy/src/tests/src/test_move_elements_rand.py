"""Random movement mutation test using raw SQL updates."""

import os
import random

from ducpy.builders.sql_builder import DucSQL


def test_move_elements_randomly(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_move_elements_randomly_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    random.seed(7)

    with DucSQL.new(output_file) as db:
        ids = []
        for i, t in enumerate(["rectangle", "ellipse", "polygon", "line"]):
            eid = f"e{i}"
            ids.append(eid)
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", eid, t, 100 + i * 50, 100 + i * 50, 50, 50, t)
            if t == "polygon":
                db.sql("INSERT INTO element_polygon (element_id, sides) VALUES (?,?)", eid, 6)
            if t == "line":
                db.sql("INSERT INTO element_linear (element_id) VALUES (?)", eid)
                db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, 0, 0.0, 0.0)
                db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, 1, 100.0, 50.0)

        for eid in ids:
            nx = random.uniform(0, 500)
            ny = random.uniform(0, 500)
            db.sql("UPDATE elements SET x = ?, y = ? WHERE id = ?", nx, ny, eid)

        moved = db.sql("SELECT x, y FROM elements")
        assert len(moved) == 4
        assert all(row["x"] >= 0 for row in moved)
