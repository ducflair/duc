"""Create varied ellipse and polygon elements via SQL schema tables."""

import os

from ducpy.builders.sql_builder import DucSQL


def test_create_varied_ellipses_and_polygons(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_varied_ellipses_and_polygons_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        ellipse_cfg = [
            ("el1", 50, 50, 100, 100, 1.0, 0.0, 6.283185307),
            ("el2", 200, 50, 150, 75, 0.5, 0.0, 6.283185307),
            ("el3", 400, 50, 80, 120, 1.5, 0.785398163, 5.497787144),
        ]
        for eid, x, y, w, h, ratio, sa, ea in ellipse_cfg:
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", eid, "ellipse", x, y, w, h, eid)
            db.sql("INSERT INTO element_ellipse (element_id, ratio, start_angle, end_angle, show_aux_crosshair) VALUES (?,?,?,?,?)", eid, ratio, sa, ea, 1)

        poly_cfg = [("p3", 3), ("p4", 4), ("p5", 5), ("p6", 6)]
        for i, (eid, sides) in enumerate(poly_cfg):
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", eid, "polygon", 50 + i * 90, 350, 80, 80, eid)
            db.sql("INSERT INTO element_polygon (element_id, sides) VALUES (?,?)", eid, sides)

        assert db.sql("SELECT COUNT(*) AS n FROM element_ellipse")[0]["n"] == 3
        assert db.sql("SELECT COUNT(*) AS n FROM element_polygon")[0]["n"] == 4
