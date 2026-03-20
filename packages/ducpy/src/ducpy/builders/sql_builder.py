"""
Thin wrapper to open .duc files as SQLite databases and run raw SQL.

A .duc file is a standard SQLite database. This builder just handles
opening/creating/exporting and exposes the raw ``sqlite3.Connection``
so you can write whatever SQL you want.

Usage::

    import ducpy as duc

    # Open existing .duc
    with duc.DucSQL("drawing.duc") as db:
        rows = db.sql("SELECT id, label FROM elements WHERE element_type = ?", "rectangle")
        db.sql("UPDATE elements SET label = ? WHERE id = ?", "new-label", rows[0]["id"])

    # Create new .duc from scratch
    with duc.DucSQL.new() as db:
        db.sql("INSERT INTO elements (id, element_type, x, y, width, height) VALUES (?,?,?,?,?,?)",
               "r1", "rectangle", 0, 0, 100, 50)
        db.save("output.duc")

    # From bytes
    with duc.DucSQL.from_bytes(raw) as db:
        print(db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"])
        modified = db.to_bytes()
"""

from __future__ import annotations

import os
import re
import sqlite3
import tempfile
from pathlib import Path
from typing import Any, List, Optional, Union

__all__ = ["DucSQL"]


_MIGRATION_RE = re.compile(r"^(\d+)_to_(\d+)$")


def _find_schema_dir() -> Optional[Path]:
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "schema"
        if (candidate / "duc.sql").exists():
            return candidate
    return None


def _get_current_schema_version() -> int:
    """Read the target user_version from duc.sql — mirrors Rust's CURRENT_VERSION."""
    schema_dir = _find_schema_dir()
    if schema_dir is None:
        return 0
    duc_sql = (schema_dir / "duc.sql").read_text(encoding="utf-8")
    m = re.search(r"PRAGMA\s+user_version\s*=\s*(\d+)", duc_sql, re.IGNORECASE)
    return int(m.group(1)) if m else 0


def _read_migrations() -> list[tuple[int, int, str]]:
    """Load all migration SQL files from schema/migrations/, sorted by from_version."""
    schema_dir = _find_schema_dir()
    if schema_dir is None:
        return []
    migrations_dir = schema_dir / "migrations"
    if not migrations_dir.exists():
        return []
    result: list[tuple[int, int, str]] = []
    for path in sorted(migrations_dir.glob("*.sql")):
        m = _MIGRATION_RE.match(path.stem)
        if m:
            result.append((int(m.group(1)), int(m.group(2)), path.read_text(encoding="utf-8")))
    result.sort(key=lambda x: x[0])
    return result


def _apply_migrations(conn: sqlite3.Connection) -> None:
    """Walk the migration chain until user_version reaches the current schema version.

    Mirrors the migration logic in Rust's ``bootstrap.rs``:
    reads ``schema/migrations/{from}_to_{to}.sql`` files in order and executes
    them until ``PRAGMA user_version`` matches the version declared in ``duc.sql``.
    Safe to call on already-current or brand-new databases.
    """
    user_version: int = conn.execute("PRAGMA user_version").fetchone()[0]
    if user_version == 0:
        return  # unversioned / brand-new DB — schema applied by DucSQL.new()
    current_version = _get_current_schema_version()
    if user_version >= current_version:
        return  # already up to date
    migrations = _read_migrations()
    current = user_version
    while current < current_version:
        migration = next(((f, t, sql) for f, t, sql in migrations if f == current), None)
        if migration is None:
            raise RuntimeError(
                f"No migration path from schema version {current} to {current_version}. "
                "Upgrade the ducpy package."
            )
        _, to_v, sql = migration
        conn.executescript(sql)
        current = conn.execute("PRAGMA user_version").fetchone()[0]


def _read_schema_sql() -> str:
    schema_dir = _find_schema_dir()
    if schema_dir is None:
        raise FileNotFoundError(
            "Could not locate schema/duc.sql. "
            "Ensure you are running from within the DUC repository."
        )
    parts: list[str] = []
    for filename in ("duc.sql", "version_control.sql", "search.sql"):
        path = schema_dir / filename
        if path.exists():
            parts.append(path.read_text(encoding="utf-8"))
    return "\n".join(parts)


def _apply_pragmas(conn: sqlite3.Connection) -> None:
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA synchronous = NORMAL")


class DucSQL:
    """Raw SQL access to a ``.duc`` SQLite database.

    Attributes:
        conn: The underlying :class:`sqlite3.Connection`.
              Use it directly for cursor-level ops, ``conn.executemany``, etc.
    """

    def __init__(self, path: Union[str, Path]):
        """Open an existing ``.duc`` file."""
        path = str(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")
        self.conn: sqlite3.Connection = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        _apply_pragmas(self.conn)
        _apply_migrations(self.conn)
        self._path: Optional[str] = path
        self._temp: Optional[str] = None
        self._closed = False

    @classmethod
    def new(cls, path: Union[str, Path, None] = None) -> DucSQL:
        """Create a new ``.duc`` database with the full schema bootstrapped.

        Pass a *path* to write to disk, or omit for in-memory.
        """
        target = str(path) if path else ":memory:"
        inst = object.__new__(cls)
        inst.conn = sqlite3.connect(target)
        inst.conn.row_factory = sqlite3.Row
        inst.conn.executescript(_read_schema_sql())
        inst._path = target if path else None
        inst._temp = None
        inst._closed = False
        return inst

    @classmethod
    def from_bytes(cls, data: bytes) -> DucSQL:
        """Open a ``.duc`` from raw bytes (temp file, cleaned up on close)."""
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        try:
            tmp.write(data)
            tmp.close()
            inst = object.__new__(cls)
            inst.conn = sqlite3.connect(tmp.name)
            inst.conn.row_factory = sqlite3.Row
            _apply_pragmas(inst.conn)
            _apply_migrations(inst.conn)
            inst._path = tmp.name
            inst._temp = tmp.name
            inst._closed = False
            return inst
        except Exception:
            os.unlink(tmp.name)
            raise

    # ------------------------------------------------------------------
    # SQL execution
    # ------------------------------------------------------------------

    def sql(self, query: str, *args: Any) -> List[sqlite3.Row]:
        """Run a SQL statement with positional ``?`` params. Returns rows."""
        return self.conn.execute(query, args).fetchall()

    def sql_dict(self, query: str, params: dict) -> List[sqlite3.Row]:
        """Run a SQL statement with named ``:key`` params. Returns rows."""
        return self.conn.execute(query, params).fetchall()

    def commit(self) -> None:
        self.conn.commit()

    def rollback(self) -> None:
        self.conn.rollback()

    # ------------------------------------------------------------------
    # Export
    # ------------------------------------------------------------------

    def save(self, path: Union[str, Path, None] = None) -> None:
        """Write the database to a file. Omit *path* to save in-place."""
        self.commit()
        target = str(path) if path else self._path
        if not target:
            raise ValueError("No path — use save(path) or to_bytes().")
        if target == self._path:
            self.conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        else:
            dst = sqlite3.connect(target)
            try:
                self.conn.backup(dst)
            finally:
                dst.close()

    def to_bytes(self) -> bytes:
        """Export the database as raw bytes."""
        self.commit()
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        try:
            tmp.close()
            dst = sqlite3.connect(tmp.name)
            self.conn.backup(dst)
            dst.close()
            with open(tmp.name, "rb") as f:
                return f.read()
        finally:
            os.unlink(tmp.name)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def close(self) -> None:
        if not getattr(self, "_closed", True):
            self.conn.close()
            self._closed = True
            if self._temp and os.path.exists(self._temp):
                os.unlink(self._temp)

    def __enter__(self) -> DucSQL:
        return self

    def __exit__(self, *exc: Any) -> None:
        if not self._closed:
            if exc[0] is None:
                self.commit()
            self.close()

    def __del__(self) -> None:
        self.close()

    def __repr__(self) -> str:
        loc = self._path or ":memory:"
        state = "closed" if self._closed else "open"
        return f"DucSQL({loc!r}, {state})"
