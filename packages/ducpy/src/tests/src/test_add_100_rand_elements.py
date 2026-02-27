"""Create 100 random elements using raw SQL."""

import os
import random

from ducpy.builders.sql_builder import DucSQL


def test_add_100_random_elements(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_100_random_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    random.seed(42)

    with DucSQL.new(output_file) as db:
        for i in range(100):
            x = random.uniform(0, 2000)
            y = random.uniform(0, 2000)
            if i % 2 == 0:
                db.sql(
                    "INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)",
                    f"rect_{i}", "rectangle", x, y, random.uniform(50, 150), random.uniform(50, 150), f"Rect {i}",
                )
            else:
                eid = f"line_{i}"
                db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", eid, "line", x, y, 0.0, 0.0, f"Line {i}")
                db.sql("INSERT INTO element_linear (element_id) VALUES (?)", eid)
                db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, 0, x, y)
                db.sql("INSERT INTO linear_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, 1, x + random.uniform(-50, 50), y + random.uniform(-50, 50))

        assert db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"] == 100
