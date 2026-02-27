"""Create varied freedraw elements using SQL schema tables."""

import os

from ducpy.builders.sql_builder import DucSQL


def test_create_varied_freedraw_writing(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_varied_freedraw_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        for i, size in enumerate([2.0, 4.0, 8.0, 12.0, 15.0]):
            eid = f"fd_{i}"
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", eid, "freedraw", 50 + i * 60, 50 + i * 40, 200, 100, f"Freedraw {i}")
            db.sql(
                "INSERT INTO element_freedraw (element_id, size, thinning, smoothing, streamline, easing, simulate_pressure, pressures) VALUES (?,?,?,?,?,?,?,?)",
                eid, size, 0.3 + 0.1 * i, 0.2 + 0.1 * i, 0.1 + 0.1 * i, "easeOutSine", 1, b"\x00\x00\x80?\x00\x00\x40?",
            )
            for p in range(6):
                db.sql("INSERT INTO freedraw_element_points (element_id, sort_order, x, y) VALUES (?,?,?,?)", eid, p, p * 15.0, (p % 2) * 10.0)

        assert db.sql("SELECT COUNT(*) AS n FROM element_freedraw")[0]["n"] == 5
        assert db.sql("SELECT COUNT(*) AS n FROM freedraw_element_points")[0]["n"] == 30
