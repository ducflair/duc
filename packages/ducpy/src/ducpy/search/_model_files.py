"""Internal helpers for reading model-linked external files from DUC data."""

from __future__ import annotations

import logging
import os
import sqlite3
from pathlib import Path

from ..parse import get_external_file

logger = logging.getLogger(__name__)


def is_sqlite_duc(duc_source: str | Path) -> bool:
    """Return whether ``duc_source`` is a SQLite-backed DUC container."""

    try:
        with open(duc_source, "rb") as source:
            return source.read(16) == b"SQLite format 3\x00"
    except OSError:
        return False


def _external_file_bytes_from_sqlite(
    duc_source: str | Path,
    file_id: str,
) -> bytes | None:
    try:
        with sqlite3.connect(os.fspath(duc_source)) as conn:
            row = conn.execute(
                """
                SELECT data.data
                FROM external_files AS file
                JOIN external_file_revision_data AS data
                  ON data.revision_id = file.active_revision_id
                WHERE file.id = ?
                """,
                (str(file_id),),
            ).fetchone()
    except sqlite3.Error as exc:
        logger.debug("Failed to read external file %s from SQLite DUC: %s", file_id, exc)
        return None
    return bytes(row[0]) if row and row[0] is not None else None


def external_file_bytes(duc_source: str | Path, file_id: str) -> bytes | None:
    """Read the active revision of a model-linked external file."""

    if is_sqlite_duc(duc_source):
        return _external_file_bytes_from_sqlite(duc_source, file_id)

    try:
        external = get_external_file(str(duc_source), str(file_id))
    except Exception as exc:
        logger.debug("Failed to read external file %s from serialized DUC: %s", file_id, exc)
        return None
    if not external:
        return None

    data_map = external.get("data") or {}
    revision_id = external.get("active_revision_id")
    if revision_id is None:
        revision_id = (external.get("file") or {}).get("active_revision_id")
    blob = None
    if revision_id is not None:
        blob = data_map.get(revision_id) or data_map.get(str(revision_id))
    if blob is None and data_map:
        blob = next(iter(data_map.values()))
    return bytes(blob) if blob else None
