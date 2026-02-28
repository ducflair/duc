"""Plot/frame/layer integration test using SQL schema tables."""

import os

from ducpy.builders.sql_builder import DucSQL


def test_cspmds_plot_elements(test_output_dir):
    output_file = os.path.join(test_output_dir, "test_plot_elements_sql.duc")
    if os.path.exists(output_file):
        os.remove(output_file)

    with DucSQL.new(output_file) as db:
        # Layers
        for lid, label in [("plot_layer", "Plot Layer"), ("external_layer", "External Layer")]:
            db.sql("INSERT INTO stack_properties (id, label) VALUES (?,?)", lid, label)
            db.sql("INSERT INTO layers (id, readonly) VALUES (?,?)", lid, 0)

        # 3 plots
        for i in range(3):
            pid = f"plot_{i}"
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id) VALUES (?,?,?,?,?,?,?,?)", pid, "plot", 50 + i * 220, 50, 200, 150, f"Plot {i}", "plot_layer")
            db.sql("INSERT INTO element_stack_properties (element_id, label, clip) VALUES (?,?,?)", pid, f"Plot {i}", 1)
            db.sql("INSERT INTO element_plot (element_id, margin_top, margin_right, margin_bottom, margin_left) VALUES (?,?,?,?,?)", pid, 10.0, 10.0, 10.0, 10.0)

            # internal elements bound to plot frame
            for j in range(2):
                eid = f"plot_{i}_rect_{j}"
                db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, frame_id, layer_id) VALUES (?,?,?,?,?,?,?,?,?)", eid, "rectangle", 60 + j * 30, 60 + j * 20, 40, 30, eid, pid, "plot_layer")

        # external elements not in plot
        for i in range(2):
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label, layer_id) VALUES (?,?,?,?,?,?,?,?)", f"ext_{i}", "ellipse", 800 + i * 80, 120, 60, 60, f"External {i}", "external_layer")
            db.sql("INSERT INTO element_ellipse (element_id, ratio, start_angle, end_angle) VALUES (?,?,?,?)", f"ext_{i}", 1.0, 0.0, 6.283185307)

        assert db.sql("SELECT COUNT(*) AS n FROM element_plot")[0]["n"] == 3
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE frame_id IS NOT NULL")[0]["n"] == 6
        assert db.sql("SELECT COUNT(*) AS n FROM layers")[0]["n"] == 2
