"""CSPMDS-style test for text and doc elements in the new SQL schema."""

import os

from ducpy.builders.sql_builder import DucSQL


def test_cspmds_text_and_doc_elements(test_output_dir):
    """Create, mutate, delete, and re-save text/doc elements (doc text is Typst)."""
    initial_file = os.path.join(test_output_dir, "cspmds_text_doc_initial.duc")
    final_file = os.path.join(test_output_dir, "cspmds_text_doc_final.duc")

    for p in (initial_file, final_file):
        if os.path.exists(p):
            os.remove(p)

    typst_doc = """#set text(font: \"Inter\")

= Design Methodology

This is *Typst* content for a doc element.

#table(
  columns: 2,
  [Key], [Value],
  [Revision], [A],
)
"""

    with DucSQL.new(initial_file) as db:
        # Text elements
        for eid, label, txt, x, y, w, h in [
            ("txt_title", "Document Title", "Technical Drawing Specification", 200, 50, 400, 40),
            ("txt_header", "Section Header", "1. General Requirements", 50, 120, 300, 30),
            ("txt_note", "Technical Note", "NOTE: Inspect all welds.", 400, 120, 250, 60),
            ("txt_caption", "Figure Caption", "Figure 1: Assembly Overview", 150, 290, 200, 20),
        ]:
            db.sql(
                "INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)",
                eid, "text", x, y, w, h, label,
            )
            db.sql(
                "INSERT INTO element_text "
                "(element_id, text, original_text, font_family, font_size, text_align, vertical_align, line_height) "
                "VALUES (?,?,?,?,?,?,?,?)",
                eid, txt, txt, "Arial", 12.0, 10, 10, 1.2,
            )

        # Doc element (Typst code in element_doc.text)
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)",
            "doc_rich", "doc", 400, 330, 420, 200, "Rich Document",
        )
        db.sql(
            "INSERT INTO document_grid_config (element_id, file_id, grid_columns, grid_gap_x, grid_gap_y, grid_scale) VALUES (?,?,?,?,?,?)",
            "doc_rich", None, 2, 20.0, 20.0, 1.0,
        )
        db.sql("INSERT INTO element_doc (element_id, text) VALUES (?,?)", "doc_rich", typst_doc)

        # Verify initial counts
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'text'")[0]["n"] == 4
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'doc'")[0]["n"] == 1

    with DucSQL(initial_file) as db:
        # Mutate title text
        db.sql("UPDATE element_text SET text = ? WHERE element_id = ?", "UPDATED: Technical Drawing Specification v2", "txt_title")

        # Mutate doc Typst content
        db.sql(
            "UPDATE element_doc SET text = text || ? WHERE element_id = ?",
            "\n\n== Update\n- Added safety constraints", "doc_rich",
        )

        # Delete caption
        db.sql("DELETE FROM element_text WHERE element_id = ?", "txt_caption")
        db.sql("DELETE FROM elements WHERE id = ?", "txt_caption")

        db.save(final_file)

    with DucSQL(final_file) as db:
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'text'")[0]["n"] == 3
        assert db.sql("SELECT COUNT(*) AS n FROM elements WHERE element_type = 'doc'")[0]["n"] == 1

        title = db.sql("SELECT text FROM element_text WHERE element_id = ?", "txt_title")[0]["text"]
        assert title.startswith("UPDATED:")

        doc_text = db.sql("SELECT text FROM element_doc WHERE element_id = ?", "doc_rich")[0]["text"]
        assert "#table(" in doc_text
        assert "== Update" in doc_text
