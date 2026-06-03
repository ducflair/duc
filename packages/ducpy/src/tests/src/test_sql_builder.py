"""Tests for DucSQL — raw SQL access to .duc databases."""
import os
from pathlib import Path

import ducpy as duc
import pytest
from ducpy.builders.sql_builder import DucSQL
from _dev.dev_utils import get_testing_assets_dir


@pytest.fixture
def db():
    d = DucSQL.new()
    yield d
    d.close()


class TestLifecycle:
    def test_new_in_memory(self):
        with DucSQL.new() as db:
            app_id = db.sql("PRAGMA application_id")[0][0]
            assert app_id == 1146569567

    def test_new_to_file(self, tmp_path):
        path = tmp_path / "test.duc"
        with DucSQL.new(path) as db:
            db.sql("INSERT INTO elements (id, element_type) VALUES (?, ?)", "e1", "rectangle")
        assert path.exists()

    def test_open_existing(self, tmp_path):
        path = tmp_path / "open.duc"
        with DucSQL.new(path) as db:
            db.sql("INSERT INTO elements (id, element_type) VALUES (?, ?)", "e1", "ellipse")
        with DucSQL(path) as db:
            rows = db.sql("SELECT element_type FROM elements WHERE id = ?", "e1")
            assert rows[0]["element_type"] == "ellipse"

    def test_open_missing_raises(self):
        with pytest.raises(FileNotFoundError):
            DucSQL("/tmp/nope_abc123.duc")

    def test_from_bytes_roundtrip(self):
        with DucSQL.new() as db:
            db.sql("INSERT INTO elements (id, element_type, x, y) VALUES (?,?,?,?)",
                   "r1", "rectangle", 10, 20)
            raw = db.to_bytes()
        with DucSQL.from_bytes(raw) as db2:
            row = db2.sql("SELECT x, y FROM elements WHERE id = ?", "r1")[0]
            assert row["x"] == 10.0 and row["y"] == 20.0

    def test_from_serialized_duc_bytes(self):
        element = (
            duc.ElementBuilder()
            .at_position(10, 20)
            .with_size(100, 50)
            .build_rectangle()
            .build()
        )
        serialized = duc.serialize_duc(name="SqlSerializedBytes", elements=[element])

        assert serialized[:6] != b"SQLite"
        with DucSQL.from_bytes(serialized) as db:
            rows = db.sql("SELECT id, element_type FROM elements")
            assert rows[0]["element_type"] == "rectangle"

    def test_open_serialized_duc_file(self, tmp_path):
        element = duc.ElementBuilder().build_text_element().with_text("Hello SQL").build()
        serialized = duc.serialize_duc(name="SqlSerializedFile", elements=[element])
        path = tmp_path / "serialized.duc"
        path.write_bytes(serialized)

        with DucSQL(path) as db:
            rows = db.sql("SELECT element_type FROM elements")
            assert rows[0]["element_type"] == "text"

    def test_attach_many_serialized_duc_files(self, tmp_path):
        paths = []
        for index in range(2):
            element = duc.ElementBuilder().build_rectangle().build()
            path = tmp_path / f"drawing_{index}.duc"
            path.write_bytes(duc.serialize_duc(name=f"SqlAttach{index}", elements=[element]))
            paths.append(path)

        with DucSQL.attach_many(paths, aliases=["d0", "d1"]) as db:
            rows = db.sql(
                "SELECT 'd0' AS source, COUNT(*) AS n FROM d0.elements "
                "UNION ALL "
                "SELECT 'd1' AS source, COUNT(*) AS n FROM d1.elements"
            )
            assert [row["n"] for row in rows] == [1, 1]

    def test_attach_many_all_asset_duc_files_counts_text_elements(self):
        duc_files = sorted(Path(get_testing_assets_dir()).rglob("*.duc"))
        assert duc_files

        aliases = [f"d{index}" for index in range(len(duc_files))]
        with DucSQL.attach_many(duc_files, aliases=aliases) as db:
            query = " UNION ALL ".join(
                f"SELECT '{path.name}' AS source_file, COUNT(*) AS text_count FROM {alias}.elements WHERE element_type = 'text'"
                for alias, path in zip(aliases, duc_files)
            )
            rows = db.sql(query)

        assert len(rows) == len(duc_files)
        assert sum(row["text_count"] for row in rows) > 0

    def test_context_manager_commits(self, tmp_path):
        path = tmp_path / "cm.duc"
        with DucSQL.new(path) as db:
            db.sql("INSERT INTO elements (id, element_type) VALUES (?, ?)", "e1", "text")
        with DucSQL(path) as db:
            assert len(db.sql("SELECT * FROM elements")) == 1

    def test_close_cleans_temp(self):
        with DucSQL.new() as db:
            raw = db.to_bytes()
        db2 = DucSQL.from_bytes(raw)
        temp = db2._temp
        assert os.path.exists(temp)
        db2.close()
        assert not os.path.exists(temp)

    def test_repr(self, db):
        assert ":memory:" in repr(db)


class TestRawSQL:
    def test_insert_select(self, db):
        db.sql("INSERT INTO elements (id, element_type, x, y, width, height) VALUES (?,?,?,?,?,?)",
               "r1", "rectangle", 0, 0, 100, 50)
        rows = db.sql("SELECT * FROM elements WHERE id = ?", "r1")
        assert len(rows) == 1
        assert rows[0]["width"] == 100.0

    def test_update(self, db):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "r1", "rectangle")
        db.sql("UPDATE elements SET label = ? WHERE id = ?", "Box", "r1")
        assert db.sql("SELECT label FROM elements WHERE id = ?", "r1")[0]["label"] == "Box"

    def test_delete(self, db):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "r1", "rectangle")
        db.sql("DELETE FROM elements WHERE id = ?", "r1")
        assert db.sql("SELECT * FROM elements WHERE id = ?", "r1") == []

    def test_sql_dict_named_params(self, db):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "r1", "rectangle")
        rows = db.sql_dict("SELECT * FROM elements WHERE id = :eid", {"eid": "r1"})
        assert len(rows) == 1

    def test_multiple_rows(self, db):
        for i in range(10):
            db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", f"e{i}", "rectangle")
        rows = db.sql("SELECT COUNT(*) AS n FROM elements")
        assert rows[0]["n"] == 10

    def test_join_query(self, db):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "t1", "text")
        db.sql("INSERT INTO element_text (element_id, text, original_text) VALUES (?,?,?)",
               "t1", "Hello", "Hello")
        rows = db.sql(
            "SELECT e.id, et.text FROM elements e "
            "JOIN element_text et ON e.id = et.element_id "
            "WHERE e.id = ?", "t1"
        )
        assert rows[0]["text"] == "Hello"

    def test_rollback(self, db):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "e1", "rectangle")
        db.commit()
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "e2", "ellipse")
        db.rollback()
        assert len(db.sql("SELECT * FROM elements")) == 1

    def test_conn_direct_access(self, db):
        data = [("a1", "rectangle"), ("a2", "ellipse"), ("a3", "text")]
        db.conn.executemany("INSERT INTO elements (id, element_type) VALUES (?,?)", data)
        assert len(db.sql("SELECT * FROM elements")) == 3

    def test_schema_tables_exist(self, db):
        tables = [r["name"] for r in db.sql(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )]
        for t in ("elements", "duc_global_state", "duc_local_state",
                   "layers", "groups", "regions", "backgrounds", "strokes", "external_files"):
            assert t in tables


class TestExport:
    def test_to_bytes(self, db):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "e1", "rectangle")
        raw = db.to_bytes()
        assert raw[:6] == b"SQLite"

    def test_save_to_file(self, db, tmp_path):
        db.sql("INSERT INTO elements (id, element_type) VALUES (?,?)", "e1", "rectangle")
        path = tmp_path / "saved.duc"
        db.save(str(path))
        with DucSQL(path) as db2:
            assert len(db2.sql("SELECT * FROM elements")) == 1

    def test_save_no_path_raises(self, db):
        with pytest.raises(ValueError):
            db.save()

    def test_full_roundtrip(self):
        with DucSQL.new() as db:
            db.sql("INSERT INTO duc_global_state (id, view_background_color, main_scope) VALUES (?,?,?)",
                   1, "#ffffff", "mm")
            db.sql("INSERT INTO elements (id, element_type, x, y, width, height, label) VALUES (?,?,?,?,?,?,?)",
                   "r1", "rectangle", 10, 20, 100, 50, "My Rect")
            db.sql("INSERT INTO backgrounds (owner_type, owner_id, src) VALUES (?,?,?)",
                   "element", "r1", "#FF0000")
            raw = db.to_bytes()

        with DucSQL.from_bytes(raw) as db2:
            el = db2.sql("SELECT * FROM elements WHERE id = ?", "r1")[0]
            assert el["label"] == "My Rect"
            bg = db2.sql("SELECT src FROM backgrounds WHERE owner_id = ?", "r1")[0]
            assert bg["src"] == "#FF0000"
            gs = db2.sql("SELECT * FROM duc_global_state")[0]
            assert gs["main_scope"] == "mm"
