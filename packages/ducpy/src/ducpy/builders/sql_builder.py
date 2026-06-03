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
import sqlite3
import tempfile
import zlib
from pathlib import Path
from typing import Any, List, Optional, Sequence, Union

import ducpy_native

__all__ = ["DucSQL", "quote_sql_identifier"]
SQLITE_HEADER_MAGIC = b"SQLite format 3\x00"


def quote_sql_identifier(value: str) -> str:
    """Quote a SQLite identifier such as an attached database alias."""
    if not value:
        raise ValueError("SQLite identifier cannot be empty.")
    return '"' + value.replace('"', '""') + '"'


def _is_sqlite_bytes(data: bytes) -> bool:
    return data.startswith(SQLITE_HEADER_MAGIC)


def _normalize_sqlite_image(data: bytes) -> bytes:
    image = bytearray(data)
    if len(image) > 19:
        if image[18] == 2:
            image[18] = 1
        if image[19] == 2:
            image[19] = 1
    return bytes(image)


def _inflate_duc_bytes(data: bytes) -> bytes:
    if _is_sqlite_bytes(data):
        return _normalize_sqlite_image(data)
    inflated = zlib.decompress(data, -zlib.MAX_WBITS)
    if not _is_sqlite_bytes(inflated):
        raise ValueError("decompressed .duc payload does not start with a SQLite header")
    return _normalize_sqlite_image(inflated)


def _deflate_duc_bytes(data: bytes) -> bytes:
    compressor = zlib.compressobj(level=-1, wbits=-zlib.MAX_WBITS)
    return compressor.compress(data) + compressor.flush()


def _write_temp_sqlite(data: bytes) -> str:
    tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    try:
        tmp.write(_inflate_duc_bytes(data))
        tmp.close()
        return tmp.name
    except Exception:
        tmp.close()
        os.unlink(tmp.name)
        raise


def _sqlite_path_for_duc(path: Union[str, Path]) -> tuple[str, Optional[str]]:
    path = str(path)
    with open(path, "rb") as f:
        data = f.read()
    if _is_sqlite_bytes(data):
        return path, None
    temp_path = _write_temp_sqlite(data)
    return temp_path, temp_path


def _get_current_schema_version() -> int:
    """Current schema version integer (e.g. 3000000) — from the Rust crate."""
    return ducpy_native.get_schema_version_int()


def _read_migrations() -> list[tuple[int, int, str]]:
    """All migrations as (from_version, to_version, sql) — from the Rust crate."""
    raw = ducpy_native.get_migrations()
    # get_migrations returns list of tuples with i64 values
    return [(int(f), int(t), sql) for f, t, sql in raw]


def _apply_migrations(conn: sqlite3.Connection) -> None:
    """Walk the migration chain until user_version reaches the current schema version.

    Mirrors the migration logic in Rust's ``bootstrap.rs``. Safe to call on
    already-current or brand-new databases.
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
    """Concatenate the three schema SQL strings shipped by the Rust crate."""
    return "\n".join([
        ducpy_native.get_duc_schema_sql(),
        ducpy_native.get_version_control_schema_sql(),
        ducpy_native.get_search_schema_sql(),
    ])


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
        sqlite_path, temp_path = _sqlite_path_for_duc(path)
        self.conn: sqlite3.Connection = sqlite3.connect(sqlite_path)
        self.conn.row_factory = sqlite3.Row
        _apply_pragmas(self.conn)
        _apply_migrations(self.conn)
        self._path: Optional[str] = sqlite_path
        self._temp: Optional[str] = temp_path
        self._attached_temps: list[str] = []
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
        inst._attached_temps = []
        inst._closed = False
        return inst

    @classmethod
    def from_bytes(cls, data: bytes) -> DucSQL:
        """Open a ``.duc`` from raw bytes (temp file, cleaned up on close)."""
        temp_path = _write_temp_sqlite(data)
        try:
            inst = object.__new__(cls)
            inst.conn = sqlite3.connect(temp_path)
            inst.conn.row_factory = sqlite3.Row
            _apply_pragmas(inst.conn)
            _apply_migrations(inst.conn)
            inst._path = temp_path
            inst._temp = temp_path
            inst._attached_temps = []
            inst._closed = False
            return inst
        except Exception:
            os.unlink(temp_path)
            raise

    @classmethod
    def attach_many(
        cls,
        paths: Sequence[Union[str, Path]],
        aliases: Optional[Sequence[str]] = None,
        read_only: bool = True,
    ) -> DucSQL:
        """Open an in-memory SQLite connection with multiple ``.duc`` files attached.

        This is useful for querying multiple drawings in one SQL statement. The
        returned ``DucSQL`` owns only the in-memory connection; attached files are
        not deleted on close.
        """
        if aliases is not None and len(aliases) != len(paths):
            raise ValueError("aliases must have the same length as paths.")

        inst = object.__new__(cls)
        inst.conn = sqlite3.connect(":memory:")
        inst.conn.row_factory = sqlite3.Row
        inst._path = None
        inst._temp = None
        inst._attached_temps = []
        inst._closed = False

        for index, path in enumerate(paths):
            alias = aliases[index] if aliases is not None else f"d{index}"
            sqlite_path, temp_path = _sqlite_path_for_duc(path)
            if temp_path:
                inst._attached_temps.append(temp_path)
            inst.conn.execute(
                f"ATTACH DATABASE ? AS {quote_sql_identifier(alias)}",
                (sqlite_path,),
            )

        if read_only:
            inst.conn.execute("PRAGMA query_only = ON")

        return inst

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

    def to_bytes(self, compressed: bool = False) -> bytes:
        """Export the database as raw bytes."""
        self.commit()
        tmp = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
        try:
            tmp.close()
            dst = sqlite3.connect(tmp.name)
            self.conn.backup(dst)
            dst.close()
            with open(tmp.name, "rb") as f:
                data = f.read()
            return _deflate_duc_bytes(data) if compressed else data
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
            for temp_path in getattr(self, "_attached_temps", []):
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

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
