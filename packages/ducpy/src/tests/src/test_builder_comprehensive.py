"""Comprehensive schema smoke test using raw SQL."""

from ducpy.builders.sql_builder import DucSQL


def test_comprehensive_builder_api():
    with DucSQL.new() as db:
        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", "r1", "rectangle", 10, 20, 100, 50, "Rect")
        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", "e1", "ellipse", 30, 40, 80, 80, "Ellipse")
        db.sql("INSERT INTO element_ellipse (element_id, ratio, start_angle, end_angle) VALUES (?,?,?,?)", "e1", 1.0, 0.0, 6.283185307)
        db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)", "t1", "text", 0, 0, 120, 30, "Text")
        db.sql("INSERT INTO element_text (element_id, text, original_text) VALUES (?,?,?)", "t1", "hello", "hello")

        assert db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"] == 3
        assert db.sql("SELECT COUNT(*) AS n FROM element_text")[0]["n"] == 1
