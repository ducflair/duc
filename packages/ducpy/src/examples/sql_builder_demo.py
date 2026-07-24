#!/usr/bin/env python3
"""
Example demonstrating direct SQLite access to .duc files via DucSQL.

A .duc file is a plain SQLite database.  DucSQL exposes the raw sqlite3
connection so you can run any SQL you want while handling the open/save/
export lifecycle for you.

Topics covered:
  1. Create a new .duc file with the full schema bootstrapped
  2. Insert elements and style data
  3. Query rows back as dict-like objects
  4. Update elements in place
  5. Export to / round-trip from a file path
  6. Open an existing .duc file
  7. Round-trip SQL-built data through the high-level parser
"""

import os
import tempfile

import ducpy as duc
from ducpy.builders.sql_builder import DucSQL


def demo_create_new():
    print("=== Create new .duc ===")

    with DucSQL.new() as db:
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "r1", "rectangle", 0, 0, 200, 100, "Main Rectangle", 1.0,
        )
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "e1", "ellipse", 250, 0, 120, 80, "Side Ellipse", 0.9,
        )

        for owner_id, colour in [("r1", "#4ECDC4"), ("e1", "#FF6B6B")]:
            db.sql(
                "INSERT INTO backgrounds (owner_type, owner_id, src, opacity) "
                "VALUES (?,?,?,?)",
                "element", owner_id, colour, 1.0,
            )

        rows = db.sql("SELECT id, element_type, label FROM elements ORDER BY id")
        for row in rows:
            print(f"  [{row['id']}] {row['element_type']} — {row['label']}")

        db.sql_dict(
            "UPDATE elements SET label = :label WHERE id = :id",
            {"label": "Renamed Rectangle", "id": "r1"},
        )

        updated = db.sql("SELECT label FROM elements WHERE id = ?", "r1")[0]
        print(f"  After rename: '{updated['label']}'")

        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        tmp.close()
        db.save(tmp.name)
        print(f"  Saved to: {tmp.name}")

    return tmp.name


def demo_open_existing(path: str):
    print("\n=== Open existing .duc ===")

    with DucSQL(path) as db:
        count = db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"]
        print(f"  Total elements: {count}")

        rows = db.sql(
            "SELECT e.id, e.label, b.src AS colour "
            "FROM elements e "
            "LEFT JOIN backgrounds b ON b.owner_type = 'element' AND b.owner_id = e.id "
            "ORDER BY e.id"
        )
        for row in rows:
            print(f"  {row['label']} → fill: {row['colour']}")

    os.unlink(path)


def demo_file_roundtrip():
    print("\n=== File round-trip ===")

    with DucSQL.new() as db:
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) "
            "VALUES (?,?,?,?,?,?,?)",
            "t1", "text", 10, 10, 300, 40, "Hello, DUC!",
        )
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        tmp.close()
        db.save(tmp.name)

    print(f"  Serialised to {tmp.name}")

    with DucSQL(tmp.name) as db:
        row = db.sql("SELECT label FROM elements WHERE id = 't1'")[0]
        print(f"  Restored label: '{row['label']}'")

    return tmp.name


def demo_advanced_connection():
    print("\n=== Advanced: direct connection access ===")

    with DucSQL.new() as db:
        records = [
            (f"el{i}", "rectangle", i * 110, 0, 100, 60, f"Box {i}", 1.0)
            for i in range(5)
        ]
        db.conn.executemany(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            records,
        )

        total = db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"]
        print(f"  Bulk-inserted {total} elements")

        tables = [
            row["name"]
            for row in db.sql(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
        ]
        print(f"  Schema tables: {', '.join(tables[:6])} …")


def demo_serialize_via_sql():
    print("\n=== Build with SQL, serialize with the high-level API ===")

    with DucSQL.new() as db:
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label, opacity) "
            "VALUES (?,?,?,?,?,?,?,?)",
            "s1", "rectangle", 0, 0, 100, 50, "From SQL", 1.0,
        )
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        tmp.close()
        db.save(tmp.name)

    parsed = duc.parse_duc(tmp.name)
    print(f"  Parsed {len(parsed.elements)} element(s) built via raw SQL.")

    return tmp.name


def main():
    print("DucSQL Builder Demo")
    print("=" * 40)

    saved_path = demo_create_new()
    demo_open_existing(saved_path)
    roundtrip_path = demo_file_roundtrip()
    demo_advanced_connection()
    demo_serialize_via_sql()

    print(f"\nAll DucSQL demos completed successfully! (round-trip file: {roundtrip_path})")
    return roundtrip_path


if __name__ == "__main__":
    main()
