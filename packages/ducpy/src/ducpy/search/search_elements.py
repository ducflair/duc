"""Element search helpers for ``.duc`` SQLite databases.

This module uses a hybrid strategy:

1. SQLite FTS5 narrows candidates quickly from the searchable DUC tables.
2. Python applies a second ranking pass that combines:
    - FTS rank
    - exact / prefix / substring behavior
    - token coverage
    - string similarity

The JSON output is shaped for downstream consumers that need:

- the original query
- total raw element hits
- the ordered list of all matching element ids
- result rows for individual elements or grouped file-backed elements
"""

from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from ..parse import parse_duc_lazy

__all__ = [
    "DucElementSearchResult",
    "DucFileSearchResult",
    "DucSearchResponse",
    "DucSearchResult",
    "ensure_search_schema",
    "search_duc_elements",
]

_TOKEN_RE = re.compile(r"[\w]+", re.UNICODE)
_SEARCH_TABLES = {
    "search_elements",
    "search_element_text",
    "search_element_doc",
    "search_element_model",
}
_FILE_AGGREGATE_TYPES = {"pdf", "image", "table", "doc"}

@dataclass(slots=True)
class DucSearchResult:
    """Compatibility placeholder for exported result types."""


@dataclass(slots=True)
class DucElementSearchResult:
    """One result row for a single element."""

    element_id: str
    element_type: str
    matches: list[str]
    score: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "element_id": self.element_id,
            "element_type": self.element_type,
            "matches": self.matches,
            "score": round(self.score, 6),
        }


@dataclass(slots=True)
class DucFileSearchResult:
    """One grouped result row for repeated file-backed elements."""

    file_id: str
    element_type: str
    matches: list[str]
    score: float
    hits: int
    element_ids: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "file_id": self.file_id,
            "element_type": self.element_type,
            "matches": self.matches,
            "score": round(self.score, 6),
            "hits": self.hits,
            "element_ids": self.element_ids,
        }


DucSearchResult = DucElementSearchResult | DucFileSearchResult


@dataclass(slots=True)
class DucSearchResponse:
    """Search response and JSON export metadata."""

    query: str
    results: list[DucSearchResult]
    total_hits: int
    all_element_ids: list[str]
    output_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert the response to a JSON-friendly dictionary."""

        payload: dict[str, Any] = {
            "query": self.query,
            "total_hits": self.total_hits,
            "all_element_ids": self.all_element_ids,
            "results": [result.to_dict() for result in self.results],
        }
        return payload


@dataclass(slots=True)
class _ElementAggregate:
    element_id: str
    raw_element_type: str
    label: str
    description: str | None
    match_scores: dict[str, tuple[str, float]] = field(default_factory=dict)
    best_score: float = 0.0
    file_id: str | None = None

    def add_match(self, text: str, score: float) -> None:
        normalized = _normalize_text(text)
        current = self.match_scores.get(normalized)
        if current is None or score > current[1]:
            self.match_scores[normalized] = (text, score)
        if score > self.best_score:
            self.best_score = score

    @property
    def ordered_matches(self) -> list[str]:
        ordered = sorted(
            self.match_scores.values(),
            key=lambda item: (-item[1], _normalize_text(item[0]), item[0]),
        )
        return [text for text, _score in ordered]

@dataclass(frozen=True, slots=True)
class _SourceQuery:
    table_name: str
    source_weight: float
    sql: str


_SOURCE_QUERIES: tuple[_SourceQuery, ...] = (
    _SourceQuery(
        table_name="search_elements",
        source_weight=1.0,
        sql="""
            SELECT
                e.id AS element_id,
                e.element_type,
                e.label,
                e.description,
                e.label AS candidate_text_1,
                e.description AS candidate_text_2,
                NULL AS candidate_text_3,
                bm25(search_elements, 8.0, 3.0) AS fts_rank,
                'search_elements' AS source_table
            FROM search_elements
            JOIN elements AS e ON e.rowid = search_elements.rowid
            WHERE search_elements MATCH ?
              AND e.is_deleted = 0
            ORDER BY bm25(search_elements, 8.0, 3.0)
            LIMIT ?
        """,
    ),
    _SourceQuery(
        table_name="search_element_text",
        source_weight=0.94,
        sql="""
            SELECT
                e.id AS element_id,
                e.element_type,
                e.label,
                e.description,
                et.text AS candidate_text_1,
                et.original_text AS candidate_text_2,
                NULL AS candidate_text_3,
                bm25(search_element_text, 6.0, 2.0) AS fts_rank,
                'search_element_text' AS source_table
            FROM search_element_text
            JOIN element_text AS et ON et.rowid = search_element_text.rowid
            JOIN elements AS e ON e.id = et.element_id
            WHERE search_element_text MATCH ?
              AND e.is_deleted = 0
            ORDER BY bm25(search_element_text, 6.0, 2.0)
            LIMIT ?
        """,
    ),
    _SourceQuery(
        table_name="search_element_doc",
        source_weight=0.88,
        sql="""
            SELECT
                e.id AS element_id,
                e.element_type,
                e.label,
                e.description,
                ed.text AS candidate_text_1,
                NULL AS candidate_text_2,
                NULL AS candidate_text_3,
                bm25(search_element_doc, 4.0) AS fts_rank,
                'search_element_doc' AS source_table
            FROM search_element_doc
            JOIN element_doc AS ed ON ed.rowid = search_element_doc.rowid
            JOIN elements AS e ON e.id = ed.element_id
            WHERE search_element_doc MATCH ?
              AND e.is_deleted = 0
            ORDER BY bm25(search_element_doc, 4.0)
            LIMIT ?
        """,
    ),
    _SourceQuery(
        table_name="search_element_model",
        source_weight=0.72,
        sql="""
            SELECT
                e.id AS element_id,
                e.element_type,
                e.label,
                e.description,
                em.code AS candidate_text_1,
                NULL AS candidate_text_2,
                NULL AS candidate_text_3,
                bm25(search_element_model, 2.0) AS fts_rank,
                'search_element_model' AS source_table
            FROM search_element_model
            JOIN element_model AS em ON em.rowid = search_element_model.rowid
            JOIN elements AS e ON e.id = em.element_id
            WHERE search_element_model MATCH ?
              AND e.is_deleted = 0
            ORDER BY bm25(search_element_model, 2.0)
            LIMIT ?
        """,
    ),
)


def _find_schema_dir() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "schema"
        if (candidate / "search.sql").exists():
            return candidate
    raise FileNotFoundError(
        "Could not locate schema/search.sql. Ensure the search module is running inside the DUC repository."
    )


def _read_search_schema_sql() -> str:
    return (_find_schema_dir() / "search.sql").read_text(encoding="utf-8")


def ensure_search_schema(conn: sqlite3.Connection, rebuild: bool = False) -> None:
    """Create missing FTS search tables and triggers for a DUC database.

    Args:
        conn: Open SQLite connection for a ``.duc`` database.
        rebuild: When ``True``, reruns the FTS rebuild statements even if the
            search schema already exists.
    """

    existing_tables = {
        row[0]
        for row in conn.execute("SELECT name FROM sqlite_master WHERE type IN ('table', 'view')")
    }
    if rebuild or not _SEARCH_TABLES.issubset(existing_tables):
        conn.executescript(_read_search_schema_sql())
        conn.commit()


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    without_marks = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    collapsed = " ".join(without_marks.casefold().split())
    return collapsed


def _tokenize(value: str | None) -> list[str]:
    return _TOKEN_RE.findall(_normalize_text(value))


def _escape_fts_term(term: str) -> str:
    return term.replace('"', '""')


def _build_query_variants(query: str) -> list[tuple[str, str, float]]:
    tokens = _tokenize(query)
    if not tokens:
        raise ValueError("The search query must contain at least one searchable token.")

    variants: list[tuple[str, str, float]] = []
    seen: set[str] = set()

    def add_variant(name: str, expression: str, boost: float) -> None:
        if expression and expression not in seen:
            seen.add(expression)
            variants.append((name, expression, boost))

    if len(tokens) > 1:
        phrase = '"' + " ".join(_escape_fts_term(token) for token in tokens) + '"'
        add_variant("phrase", phrase, 1.0)

    exact_terms = " AND ".join(f'"{_escape_fts_term(token)}"' for token in tokens)
    add_variant("exact_terms", exact_terms, 0.97)

    prefix_terms = " AND ".join(
        f'{_escape_fts_term(token)}*' if len(token) >= 2 else f'"{_escape_fts_term(token)}"'
        for token in tokens
    )
    add_variant("prefix_terms", prefix_terms, 0.9)

    return variants


def _token_match_score(query_token: str, candidate_token: str) -> float:
    if not query_token or not candidate_token:
        return 0.0
    if candidate_token == query_token:
        return 1.0
    if candidate_token.startswith(query_token):
        return len(query_token) / max(len(candidate_token), 1)
    if query_token in candidate_token:
        return 0.75 * (len(query_token) / max(len(candidate_token), 1))
    return 0.45 * SequenceMatcher(None, query_token, candidate_token).ratio()


def _fts_rank_to_score(fts_rank: float | None) -> float:
    if fts_rank is None:
        return 0.0
    return 1.0 / (1.0 + abs(float(fts_rank)))


def _score_candidate(
    *,
    text_quality: float,
    token_coverage: float,
    field_exact: float,
    field_prefix: float,
    similarity_score: float,
    fts_rank: float | None,
    source_weight: float,
    variant_boost: float,
) -> float:
    final_score = (
        0.28 * text_quality
        + 0.20 * token_coverage
        + 0.16 * field_exact
        + 0.10 * field_prefix
        + 0.14 * similarity_score
        + 0.07 * _fts_rank_to_score(fts_rank)
        + 0.05 * source_weight
    ) * variant_boost
    return max(0.0, min(final_score, 1.0))


def _evaluate_match_text(
    query: str,
    raw_text: str | None,
    *,
    fts_rank: float | None,
    source_weight: float,
    variant_boost: float,
) -> tuple[float, float]:
    if not raw_text:
        return 0.0, 0.0

    query_normalized = _normalize_text(query)
    query_tokens = _tokenize(query)
    normalized = _normalize_text(raw_text)
    if not normalized:
        return 0.0, 0.0

    candidate_tokens = _tokenize(raw_text)
    if query_tokens and candidate_tokens:
        token_scores = [
            max((_token_match_score(query_token, candidate_token) for candidate_token in candidate_tokens), default=0.0)
            for query_token in query_tokens
        ]
        token_coverage = sum(token_scores) / len(token_scores)
    else:
        token_scores = []
        token_coverage = 0.0

    field_exact = 1.0 if normalized == query_normalized else 0.0
    field_prefix = (
        len(query_normalized) / len(normalized)
        if query_normalized and normalized.startswith(query_normalized)
        else 0.0
    )
    similarity_score = SequenceMatcher(None, query_normalized, normalized).ratio()
    text_quality = max(
        field_exact,
        field_prefix,
        token_coverage,
        0.7 * similarity_score,
    )
    contains_query = bool(query_normalized and query_normalized in normalized)
    meaningful_match = (
        field_exact == 1.0
        or field_prefix > 0.0
        or contains_query
        or (token_scores and min(token_scores) >= 0.6)
        or (similarity_score >= 0.75 and token_coverage >= 0.5)
    )
    if not meaningful_match:
        return 0.0, similarity_score

    final_score = _score_candidate(
        text_quality=text_quality,
        token_coverage=token_coverage,
        field_exact=field_exact,
        field_prefix=field_prefix,
        similarity_score=similarity_score,
        fts_rank=fts_rank,
        source_weight=source_weight,
        variant_boost=variant_boost,
    )
    return final_score, similarity_score


def _collect_candidates(
    conn: sqlite3.Connection,
    query: str,
    *,
    limit_per_source: int,
) -> list[_ElementAggregate]:
    aggregates: dict[str, _ElementAggregate] = {}

    for _variant_name, expression, variant_boost in _build_query_variants(query):
        for source in _SOURCE_QUERIES:
            rows = conn.execute(source.sql, (expression, limit_per_source)).fetchall()
            for row in rows:
                aggregate = aggregates.get(row["element_id"])
                if aggregate is None:
                    aggregate = _ElementAggregate(
                        element_id=row["element_id"],
                        raw_element_type=row["element_type"],
                        label=row["label"] or "",
                        description=row["description"],
                    )
                    aggregates[aggregate.element_id] = aggregate

                fts_rank = float(row["fts_rank"]) if row["fts_rank"] is not None else None
                for raw_text in (row["candidate_text_1"], row["candidate_text_2"], row["candidate_text_3"]):
                    score, _similarity = _evaluate_match_text(
                        query,
                        raw_text,
                        fts_rank=fts_rank,
                        source_weight=source.source_weight,
                        variant_boost=variant_boost,
                    )
                    if score > 0.0 and raw_text:
                        aggregate.add_match(raw_text, score)

    results = list(aggregates.values())
    results.sort(key=lambda item: (-item.best_score, item.raw_element_type.casefold(), item.element_id))
    return results


def _resolve_file_ids(conn: sqlite3.Connection, element_ids: list[str]) -> dict[str, str]:
    if not element_ids:
        return {}

    placeholders = ", ".join("?" for _ in element_ids)
    bindings: tuple[str, ...] = tuple(element_ids)
    file_ids: dict[str, str] = {}

    for row in conn.execute(
        f"SELECT element_id, file_id FROM document_grid_config WHERE file_id IS NOT NULL AND element_id IN ({placeholders})",
        bindings,
    ):
        file_ids[row["element_id"]] = row["file_id"]

    for row in conn.execute(
        f"SELECT element_id, file_id FROM element_image WHERE file_id IS NOT NULL AND element_id IN ({placeholders})",
        bindings,
    ):
        file_ids[row["element_id"]] = row["file_id"]

    for row in conn.execute(
        f"SELECT element_id, file_id FROM element_table WHERE file_id IS NOT NULL AND element_id IN ({placeholders})",
        bindings,
    ):
        file_ids[row["element_id"]] = row["file_id"]

    return file_ids


def _collect_candidates_from_parsed_duc(
    duc_data: dict[str, Any],
    query: str,
    *,
    limit: int,
) -> list[_ElementAggregate]:
    elements = duc_data.get("elements", []) or []
    aggregates: dict[str, _ElementAggregate] = {}
    field_weights = {
        "label": 1.0,
        "description": 0.9,
        "text": 0.94,
        "original_text": 0.88,
        "code": 0.72,
    }

    for _variant_name, _expression, variant_boost in _build_query_variants(query):
        for element in elements:
            if element.get("is_deleted"):
                continue

            element_id = element.get("id")
            element_type = element.get("type")
            if not element_id or not element_type:
                continue

            aggregate = aggregates.get(element_id)
            if aggregate is None:
                aggregate = _ElementAggregate(
                    element_id=element_id,
                    raw_element_type=element_type,
                    label=element.get("label") or "",
                    description=element.get("description"),
                )
                aggregates[element_id] = aggregate

            for field_name, source_weight in field_weights.items():
                raw_text = element.get(field_name)
                score, _similarity = _evaluate_match_text(
                    query,
                    raw_text,
                    fts_rank=None,
                    source_weight=source_weight,
                    variant_boost=variant_boost,
                )
                if score > 0.0 and raw_text:
                    aggregate.add_match(raw_text, score)

    results = [aggregate for aggregate in aggregates.values() if aggregate.best_score > 0.0]
    element_lookup = {element.get("id"): element for element in elements}
    for aggregate in results:
        element = element_lookup.get(aggregate.element_id, {})
        file_id = element.get("file_id")
        if file_id is None:
            file_ids = element.get("file_ids") or []
            if file_ids:
                file_id = file_ids[0]
        aggregate.file_id = file_id

    results.sort(key=lambda item: (-item.best_score, item.raw_element_type.casefold(), item.element_id))
    return results[:limit]


def _search_non_sqlite_duc(
    duc_file: Path,
    query: str,
    *,
    output_path: Path,
    limit: int,
) -> DucSearchResponse:
    duc_data = parse_duc_lazy(str(duc_file))
    candidates = _collect_candidates_from_parsed_duc(duc_data, query, limit=limit)
    all_element_ids, results = _build_result_payloads(candidates)
    response = DucSearchResponse(
        query=query,
        results=results,
        total_hits=len(all_element_ids),
        all_element_ids=all_element_ids,
        output_path=str(output_path),
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(response.to_dict(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return response

def _build_result_payloads(candidates: list[_ElementAggregate]) -> tuple[list[str], list[DucSearchResult]]:
    all_element_ids = [candidate.element_id for candidate in candidates]

    file_groups: dict[tuple[str, str], list[_ElementAggregate]] = {}
    ungrouped: list[_ElementAggregate] = []

    for candidate in candidates:
        if candidate.raw_element_type in _FILE_AGGREGATE_TYPES and candidate.file_id:
            file_groups.setdefault((candidate.raw_element_type, candidate.file_id), []).append(candidate)
        else:
            ungrouped.append(candidate)

    results: list[DucSearchResult] = []

    for candidate in ungrouped:
        results.append(
            DucElementSearchResult(
                element_id=candidate.element_id,
                element_type=candidate.raw_element_type,
                matches=candidate.ordered_matches,
                score=candidate.best_score,
            )
        )

    for (raw_type, file_id), group in file_groups.items():
        group.sort(key=lambda item: (-item.best_score, item.element_id))
        if len(group) == 1:
            candidate = group[0]
            results.append(
                DucElementSearchResult(
                    element_id=candidate.element_id,
                    element_type=candidate.raw_element_type,
                    matches=candidate.ordered_matches,
                    score=candidate.best_score,
                )
            )
            continue

        merged_matches: dict[str, tuple[str, float]] = {}
        for candidate in group:
            for normalized, (text, score) in candidate.match_scores.items():
                current = merged_matches.get(normalized)
                if current is None or score > current[1]:
                    merged_matches[normalized] = (text, score)

        ordered_matches = [
            text
            for text, _score in sorted(
                merged_matches.values(),
                key=lambda item: (-item[1], _normalize_text(item[0]), item[0]),
            )
        ]
        results.append(
            DucFileSearchResult(
                file_id=file_id,
                element_type=raw_type,
                matches=ordered_matches,
                score=max(candidate.best_score for candidate in group),
                hits=len(group),
                element_ids=[candidate.element_id for candidate in group],
            )
        )

    results.sort(
        key=lambda item: (
            -item.score,
            item.element_type.casefold(),
            getattr(item, "element_id", getattr(item, "file_id", "")),
        )
    )
    return all_element_ids, results


def _default_output_path(duc_path: Path, query: str) -> Path:
    slug_tokens = _tokenize(query)
    slug = "-".join(slug_tokens[:8]) if slug_tokens else "search"
    if not slug:
        slug = "search"
    return duc_path.with_name(f"{duc_path.stem}.{slug}.search-results.json")


def search_duc_elements(
    duc_path: str | Path,
    query: str,
    *,
    output_path: str | Path | None = None,
    limit: int = 50,
    ensure_schema: bool = True,
    rebuild_index: bool = False,
) -> DucSearchResponse:
    """Search DUC elements and export ordered results to JSON.

    Args:
        duc_path: Path to the ``.duc`` SQLite database.
        query: Plain-text search query.
        output_path: Optional JSON output path. When omitted, a file is created
            next to the ``.duc`` file.
        limit: Maximum number of ranked element results to keep.
        ensure_schema: Create the FTS schema if it is missing.
        rebuild_index: Rebuild the FTS indexes before searching.
    """

    duc_file = Path(duc_path)
    if not duc_file.exists():
        raise FileNotFoundError(f"DUC file not found: {duc_file}")
    if limit <= 0:
        raise ValueError("limit must be greater than zero")

    destination = Path(output_path) if output_path else _default_output_path(duc_file, query)

    try:
        conn = sqlite3.connect(duc_file)
        conn.row_factory = sqlite3.Row
        try:
            if ensure_schema:
                ensure_search_schema(conn, rebuild=rebuild_index)

            candidates = _collect_candidates(conn, query, limit_per_source=max(limit * 3, 25))[:limit]
            file_id_map = _resolve_file_ids(conn, [candidate.element_id for candidate in candidates])
            for candidate in candidates:
                candidate.file_id = file_id_map.get(candidate.element_id)

            all_element_ids, results = _build_result_payloads(candidates)
            response = DucSearchResponse(
                query=query,
                results=results,
                total_hits=len(all_element_ids),
                all_element_ids=all_element_ids,
                output_path=str(destination),
            )
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(
                json.dumps(response.to_dict(), indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            return response
        finally:
            conn.close()
    except sqlite3.DatabaseError:
        return _search_non_sqlite_duc(
            duc_file,
            query,
            output_path=destination,
            limit=limit,
        )