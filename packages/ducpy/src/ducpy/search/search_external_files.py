"""Scoped external-file search helpers."""

from __future__ import annotations

import logging
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from ..parse import get_external_file
from .image_ocr import extract_image_text_with_ocr
from .search_pdf import extract_pdf_text_for_search

logger = logging.getLogger(__name__)

_SUPPORTED_EXTERNAL_ELEMENT_TYPES = {"pdf", "image"}


@dataclass(frozen=True, slots=True)
class ExternalFileSearchTarget:
    file_id: str
    revision_id: str | None = None


@dataclass(frozen=True, slots=True)
class PageSpan:
    page: int
    start: int
    end: int


@dataclass(frozen=True, slots=True)
class ExtractedExternalText:
    text: str
    pages: tuple[PageSpan, ...] = ()
    used_ocr: bool = False


@dataclass(frozen=True, slots=True)
class ResolvedExternalFileSearchTarget:
    file_id: str
    revision_id: str
    element_id: str | None = None


def _compress_whitespace(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(str(value).split())


def element_file_id(element: dict[str, Any]) -> str | None:
    file_id = element.get("file_id")
    if file_id is None:
        file_ids = element.get("file_ids") or []
        if file_ids:
            file_id = file_ids[0]
    return str(file_id) if file_id is not None else None


def _normalize_target(value: ExternalFileSearchTarget | dict[str, Any] | tuple[Any, ...] | str) -> ExternalFileSearchTarget:
    if isinstance(value, ExternalFileSearchTarget):
        return value
    if isinstance(value, str):
        return ExternalFileSearchTarget(file_id=value)
    if isinstance(value, tuple):
        if not value:
            raise ValueError("external_file_targets tuples must include a file id")
        if len(value) == 1:
            return ExternalFileSearchTarget(file_id=str(value[0]))
        return ExternalFileSearchTarget(file_id=str(value[0]), revision_id=None if value[1] is None else str(value[1]))
    if isinstance(value, dict):
        file_id = value.get("file_id") or value.get("id")
        if not file_id:
            raise ValueError("external_file_targets dicts must include file_id")
        revision_id = value.get("revision_id")
        return ExternalFileSearchTarget(file_id=str(file_id), revision_id=None if revision_id is None else str(revision_id))
    raise TypeError("Unsupported external_file_targets entry")


def _dedupe_targets(targets: Iterable[ResolvedExternalFileSearchTarget]) -> tuple[ResolvedExternalFileSearchTarget, ...]:
    by_pair: dict[tuple[str, str], set[str] | None] = {}

    for target in targets:
        pair = (target.file_id, target.revision_id)
        if pair not in by_pair:
            by_pair[pair] = None if target.element_id is None else {target.element_id}
            continue
        if by_pair[pair] is None:
            continue
        if target.element_id is None:
            by_pair[pair] = None
            continue
        by_pair[pair].add(target.element_id)

    resolved: list[ResolvedExternalFileSearchTarget] = []
    for file_id, revision_id in sorted(by_pair):
        element_ids = by_pair[(file_id, revision_id)]
        if element_ids is None:
            resolved.append(
                ResolvedExternalFileSearchTarget(
                    file_id=file_id,
                    revision_id=revision_id,
                    element_id=None,
                )
            )
            continue
        for element_id in sorted(element_ids):
            resolved.append(
                ResolvedExternalFileSearchTarget(
                    file_id=file_id,
                    revision_id=revision_id,
                    element_id=element_id,
                )
            )
    return tuple(resolved)


def _has_table(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
        (table_name,),
    ).fetchone()
    return row is not None


def _fetch_active_revision_ids(conn: sqlite3.Connection, file_ids: Iterable[str]) -> dict[str, str]:
    file_ids = sorted({str(file_id) for file_id in file_ids if file_id})
    if not file_ids:
        return {}
    placeholders = ", ".join("?" for _ in file_ids)
    rows = conn.execute(
        f"SELECT id, active_revision_id FROM external_files WHERE id IN ({placeholders})",
        tuple(file_ids),
    ).fetchall()
    return {
        str(row["id"]): str(row["active_revision_id"])
        for row in rows
        if row["id"] is not None and row["active_revision_id"] is not None
    }


def _fetch_live_external_file_ids(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute(
        """
        SELECT DISTINCT dgc.file_id AS file_id
        FROM document_grid_config AS dgc
        JOIN elements AS e ON e.id = dgc.element_id
        WHERE e.element_type = 'pdf'
          AND e.is_deleted = 0
          AND dgc.file_id IS NOT NULL

        UNION

        SELECT DISTINCT ei.file_id AS file_id
        FROM element_image AS ei
        JOIN elements AS e ON e.id = ei.element_id
        WHERE e.element_type = 'image'
          AND e.is_deleted = 0
          AND ei.file_id IS NOT NULL
        """
    ).fetchall()
    return {str(row["file_id"]) for row in rows if row["file_id"] is not None}


def _fetch_element_external_refs(conn: sqlite3.Connection, element_ids: Iterable[str]) -> list[tuple[str, str]]:
    element_ids = sorted({str(element_id) for element_id in element_ids if element_id})
    if not element_ids:
        return []
    placeholders = ", ".join("?" for _ in element_ids)
    bindings = tuple(element_ids)
    rows = conn.execute(
        f"""
        SELECT e.id AS element_id, dgc.file_id AS file_id
        FROM elements AS e
        JOIN document_grid_config AS dgc ON dgc.element_id = e.id
        WHERE e.id IN ({placeholders})
          AND e.element_type = 'pdf'
          AND e.is_deleted = 0
          AND dgc.file_id IS NOT NULL

        UNION ALL

        SELECT e.id AS element_id, ei.file_id AS file_id
        FROM elements AS e
        JOIN element_image AS ei ON ei.element_id = e.id
        WHERE e.id IN ({placeholders})
          AND e.element_type = 'image'
          AND e.is_deleted = 0
          AND ei.file_id IS NOT NULL
        """,
        bindings + bindings,
    ).fetchall()
    return [
        (str(row["element_id"]), str(row["file_id"]))
        for row in rows
        if row["element_id"] is not None and row["file_id"] is not None
    ]


def resolve_external_file_search_targets(
    conn: sqlite3.Connection,
    *,
    search_all_external_files: bool = False,
    external_file_targets: Iterable[ExternalFileSearchTarget | dict[str, Any] | tuple[Any, ...] | str] | None = None,
    external_file_element_ids: Iterable[str] | None = None,
) -> tuple[ResolvedExternalFileSearchTarget, ...]:
    resolved: list[ResolvedExternalFileSearchTarget] = []

    if search_all_external_files:
        active_revisions = _fetch_active_revision_ids(conn, _fetch_live_external_file_ids(conn))
        resolved.extend(
            ResolvedExternalFileSearchTarget(file_id=file_id, revision_id=revision_id)
            for file_id, revision_id in active_revisions.items()
        )

    element_refs = _fetch_element_external_refs(conn, external_file_element_ids or ())
    active_element_revisions = _fetch_active_revision_ids(
        conn,
        (file_id for _element_id, file_id in element_refs),
    )
    resolved.extend(
        ResolvedExternalFileSearchTarget(
            file_id=file_id,
            revision_id=active_element_revisions[file_id],
            element_id=element_id,
        )
        for element_id, file_id in element_refs
        if file_id in active_element_revisions
    )

    normalized_targets = [_normalize_target(target) for target in (external_file_targets or ())]
    active_target_revisions = _fetch_active_revision_ids(
        conn,
        (target.file_id for target in normalized_targets if target.revision_id is None),
    )
    resolved.extend(
        ResolvedExternalFileSearchTarget(
            file_id=target.file_id,
            revision_id=target.revision_id or active_target_revisions[target.file_id],
        )
        for target in normalized_targets
        if target.revision_id is not None or target.file_id in active_target_revisions
    )

    return _dedupe_targets(resolved)


def _external_active_revision_id(external: dict[str, Any]) -> str | None:
    revision_id = external.get("active_revision_id")
    if revision_id is None:
        revision_id = external.get("file", {}).get("active_revision_id")
    return str(revision_id) if revision_id is not None else None


def _external_revision_blob(external: dict[str, Any], revision_id: str) -> bytes | None:
    data_map = external.get("data") or {}
    revision_data = data_map.get(revision_id)
    if revision_data is None:
        revision_data = data_map.get(str(revision_id))
    if revision_data is None and data_map:
        first_key = next(iter(data_map.keys()))
        revision_data = data_map[first_key]
    if not revision_data:
        return None
    return bytes(revision_data)


def _external_revision_meta(external: dict[str, Any], revision_id: str) -> dict[str, Any] | None:
    revisions = external.get("revisions")
    if revisions is None:
        revisions = external.get("file", {}).get("revisions")
    if isinstance(revisions, dict):
        revision = revisions.get(revision_id)
        if revision is None:
            revision = revisions.get(str(revision_id))
        if isinstance(revision, dict):
            return revision
        return None
    if isinstance(revisions, list):
        for revision in revisions:
            if not isinstance(revision, dict):
                continue
            candidate_id = revision.get("id") or revision.get("revision_id")
            if candidate_id is not None and str(candidate_id) == str(revision_id):
                return revision
    return None


def _external_revision_mime_type(
    external: dict[str, Any],
    revision_id: str,
    *,
    fallback_element_type: str | None,
) -> str:
    revision = _external_revision_meta(external, revision_id)
    if revision:
        mime_type = revision.get("mime_type") or revision.get("mimeType")
        if mime_type:
            return str(mime_type)
    if fallback_element_type == "pdf":
        return "application/pdf"
    if fallback_element_type == "image":
        return "image/unknown"
    return ""


def extract_image_text_for_search(image_bytes: bytes, *, ocr_language: str) -> ExtractedExternalText:
    text, used_ocr = extract_image_text_with_ocr(image_bytes, ocr_language=ocr_language)
    return ExtractedExternalText(text=_compress_whitespace(text), used_ocr=used_ocr)


def load_external_file_text(
    duc_source: str | Path,
    target: ResolvedExternalFileSearchTarget,
    *,
    fallback_element_type: str | None,
    ocr_language: str,
) -> ExtractedExternalText:
    external = get_external_file(str(duc_source), str(target.file_id))
    if not external:
        return ExtractedExternalText(text="")

    revision_id = target.revision_id or _external_active_revision_id(external)
    if revision_id is None:
        return ExtractedExternalText(text="")

    data = _external_revision_blob(external, revision_id)
    if data is None:
        return ExtractedExternalText(text="")

    mime_type = _external_revision_mime_type(
        external,
        revision_id,
        fallback_element_type=fallback_element_type,
    ).lower()

    if "pdf" in mime_type:
        text, raw_pages, used_ocr = extract_pdf_text_for_search(data, ocr_language=ocr_language)
        return ExtractedExternalText(
            text=text,
            pages=tuple(PageSpan(page=page, start=start, end=end) for page, start, end in raw_pages),
            used_ocr=used_ocr,
        )

    if mime_type.startswith("image/"):
        return extract_image_text_for_search(data, ocr_language=ocr_language)

    return ExtractedExternalText(text="")


def resolve_external_file_search_targets_from_parsed_duc(
    duc_source: str | Path,
    duc_data: dict[str, Any],
    *,
    search_all_external_files: bool = False,
    external_file_targets: Iterable[ExternalFileSearchTarget | dict[str, Any] | tuple[Any, ...] | str] | None = None,
    external_file_element_ids: Iterable[str] | None = None,
) -> tuple[ResolvedExternalFileSearchTarget, ...]:
    elements = duc_data.get("elements", []) or []
    elements_by_id = {
        str(element.get("id")): element
        for element in elements
        if element.get("id") and not element.get("is_deleted")
    }
    external_cache: dict[str, dict[str, Any] | None] = {}

    def load_external(file_id: str) -> dict[str, Any] | None:
        if file_id not in external_cache:
            external_cache[file_id] = get_external_file(str(duc_source), file_id)
        return external_cache[file_id]

    def active_revision_id(file_id: str) -> str | None:
        external = load_external(file_id)
        if not external:
            return None
        return _external_active_revision_id(external)

    resolved: list[ResolvedExternalFileSearchTarget] = []

    if search_all_external_files:
        for element in elements:
            if element.get("is_deleted") or element.get("type") not in _SUPPORTED_EXTERNAL_ELEMENT_TYPES:
                continue
            file_id = element_file_id(element)
            if not file_id:
                continue
            revision_id = active_revision_id(file_id)
            if revision_id is None:
                continue
            resolved.append(
                ResolvedExternalFileSearchTarget(
                    file_id=file_id,
                    revision_id=revision_id,
                )
            )

    for element_id in {str(value) for value in (external_file_element_ids or ()) if value}:
        element = elements_by_id.get(element_id)
        if not element or element.get("type") not in _SUPPORTED_EXTERNAL_ELEMENT_TYPES:
            continue
        file_id = element_file_id(element)
        if not file_id:
            continue
        revision_id = active_revision_id(file_id)
        if revision_id is None:
            continue
        resolved.append(
            ResolvedExternalFileSearchTarget(
                file_id=file_id,
                revision_id=revision_id,
                element_id=element_id,
            )
        )

    for target in (_normalize_target(value) for value in (external_file_targets or ())):
        revision_id = target.revision_id or active_revision_id(target.file_id)
        if revision_id is None:
            continue
        resolved.append(
            ResolvedExternalFileSearchTarget(
                file_id=target.file_id,
                revision_id=revision_id,
            )
        )

    return _dedupe_targets(resolved)


def _fetch_external_revision_row(conn: sqlite3.Connection, file_id: str, revision_id: str) -> sqlite3.Row | None:
    try:
        return conn.execute(
            """
            SELECT
                efr.file_id AS file_id,
                efr.id AS revision_id,
                efr.mime_type AS mime_type,
                efrd.data AS data_blob
            FROM external_file_revisions AS efr
            LEFT JOIN external_file_revision_data AS efrd ON efrd.revision_id = efr.id
            WHERE efr.file_id = ?
              AND efr.id = ?
            LIMIT 1
            """,
            (file_id, revision_id),
        ).fetchone()
    except sqlite3.DatabaseError:
        return conn.execute(
            """
            SELECT
                efr.file_id AS file_id,
                efr.id AS revision_id,
                efr.mime_type AS mime_type,
                efr.data AS data_blob
            FROM external_file_revisions AS efr
            WHERE efr.file_id = ?
              AND efr.id = ?
            LIMIT 1
            """,
            (file_id, revision_id),
        ).fetchone()


def ensure_external_file_search_index(
    conn: sqlite3.Connection,
    *,
    targets: Iterable[ResolvedExternalFileSearchTarget],
    ocr_language: str = "eng",
) -> dict[tuple[str, str], ExtractedExternalText]:
    resolved_targets = tuple(targets)
    if not resolved_targets:
        return {}
    if not _has_table(conn, "external_file_text_index"):
        return {}
    if not _has_table(conn, "search_external_file_text"):
        return {}

    now_ms = int(time.time() * 1000)
    extracted_by_target: dict[tuple[str, str], ExtractedExternalText] = {}

    for file_id, revision_id in sorted({(target.file_id, target.revision_id) for target in resolved_targets}):
        revision_row = _fetch_external_revision_row(conn, file_id, revision_id)
        if revision_row is None:
            continue
        blob = revision_row["data_blob"]
        if blob is None:
            continue

        mime_type = str(revision_row["mime_type"] or "")
        mime_type_lower = mime_type.lower()
        if "pdf" in mime_type_lower:
            text, raw_pages, used_ocr = extract_pdf_text_for_search(bytes(blob), ocr_language=ocr_language)
            extracted = ExtractedExternalText(
                text=text,
                pages=tuple(PageSpan(page=page, start=start, end=end) for page, start, end in raw_pages),
                used_ocr=used_ocr,
            )
        elif mime_type_lower.startswith("image/"):
            extracted = extract_image_text_for_search(bytes(blob), ocr_language=ocr_language)
        else:
            continue

        extracted_by_target[(file_id, revision_id)] = extracted
        conn.execute(
            """
            INSERT INTO external_file_text_index (
                file_id,
                revision_id,
                mime_type,
                extracted_text,
                has_ocr,
                updated
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(file_id, revision_id) DO UPDATE SET
                mime_type = excluded.mime_type,
                extracted_text = excluded.extracted_text,
                has_ocr = excluded.has_ocr,
                updated = excluded.updated
            """,
            (
                file_id,
                revision_id,
                mime_type,
                extracted.text,
                1 if extracted.used_ocr else 0,
                now_ms,
            ),
        )

    return extracted_by_target


def query_external_file_search_rows(
    conn: sqlite3.Connection,
    *,
    expression: str,
    limit: int,
    targets: Iterable[ResolvedExternalFileSearchTarget],
) -> list[sqlite3.Row]:
    resolved_targets = tuple(targets)
    if not resolved_targets:
        return []
    if not _has_table(conn, "external_file_text_index"):
        return []
    if not _has_table(conn, "search_external_file_text"):
        return []

    values_clause = ", ".join("(?, ?, ?)" for _ in resolved_targets)
    bindings: list[Any] = []
    for target in resolved_targets:
        bindings.extend((target.file_id, target.revision_id, target.element_id))
    bindings.extend((expression, limit))

    return conn.execute(
        f"""
        WITH external_scope(file_id, revision_id, element_id) AS (
            VALUES {values_clause}
        )
        SELECT DISTINCT
            e.id AS element_id,
            e.element_type,
            e.label,
            e.description,
            efti.extracted_text AS candidate_text_1,
            NULL AS candidate_text_2,
            NULL AS candidate_text_3,
            efti.file_id AS external_file_id,
            efti.revision_id AS external_revision_id,
            CASE
                WHEN ef.active_revision_id = efti.revision_id
                    THEN bm25(search_external_file_text, 3.5) / 1.35
                ELSE bm25(search_external_file_text, 3.5) * 1.15
            END AS fts_rank,
            'search_external_file_text' AS source_table
        FROM search_external_file_text
        JOIN external_file_text_index AS efti
            ON efti.id = search_external_file_text.rowid
        JOIN (
            SELECT element_id, file_id
            FROM document_grid_config
            WHERE file_id IS NOT NULL
            UNION ALL
            SELECT element_id, file_id
            FROM element_image
            WHERE file_id IS NOT NULL
        ) AS efm
            ON efm.file_id = efti.file_id
        JOIN elements AS e
            ON e.id = efm.element_id
        LEFT JOIN external_files AS ef
            ON ef.id = efti.file_id
        WHERE search_external_file_text MATCH ?
          AND e.element_type IN ('pdf', 'image')
          AND e.is_deleted = 0
          AND EXISTS (
              SELECT 1
              FROM external_scope AS scope
              WHERE scope.file_id = efti.file_id
                AND scope.revision_id = efti.revision_id
                AND (scope.element_id IS NULL OR scope.element_id = e.id)
          )
        ORDER BY fts_rank
        LIMIT ?
        """,
        tuple(bindings),
    ).fetchall()
