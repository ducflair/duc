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

from ..builders.sql_builder import DucSQL
from ..parse import parse_duc
from .search_external_files import (
    ExternalFileSearchTarget,
    ExtractedExternalText,
    PageSpan,
    element_file_id,
    ensure_external_file_search_index,
    load_external_file_text,
    query_external_file_search_rows,
    resolve_external_file_search_targets,
    resolve_external_file_search_targets_from_parsed_duc,
)

__all__ = [
    "DucElementSearchResult",
    "DucFileSearchResult",
    "DucSearchResponse",
    "DucSearchResult",
    "ExternalFileSearchTarget",
    "search_duc_elements",
]

_TOKEN_RE = re.compile(r"[\w]+", re.UNICODE)
_FILE_AGGREGATE_TYPES = {"pdf", "image", "table", "doc"}

@dataclass(slots=True)
class DucSearchResult:
    """Compatibility placeholder for exported result types."""


@dataclass(slots=True)
class DucElementSearchResult:
    """One result row for a single element.

    ``match_pages[i]`` is the starting page number (as a string) for the text
    in ``matches[i]``.  The two lists always have the same length, and
    ``match_pages`` is ``None`` for results that are not backed by a
    PDF/image external file.
    """

    element_id: str
    element_type: str
    matches: list[str]
    score: float
    match_pages: list[str] | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "element_id": self.element_id,
            "element_type": self.element_type,
            "matches": self.matches,
            "score": round(self.score, 6),
        }
        if self.match_pages is not None:
            d["match_pages"] = self.match_pages
        return d


@dataclass(slots=True)
class DucFileSearchResult:
    """One grouped result row for repeated file-backed elements.

    ``match_pages[i]`` is the starting page number (as a string) for the text
    in ``matches[i]``.  The two lists always have the same length, and
    ``match_pages`` is ``None`` for results that are not backed by a
    PDF/image external file.
    """

    file_id: str
    element_type: str
    matches: list[str]
    score: float
    hits: int
    element_ids: list[str]
    match_pages: list[str] | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "file_id": self.file_id,
            "element_type": self.element_type,
            "matches": self.matches,
            "score": round(self.score, 6),
            "hits": self.hits,
            "element_ids": self.element_ids,
        }
        if self.match_pages is not None:
            d["match_pages"] = self.match_pages
        return d


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


def _merge_pages(
    current: tuple[int, ...] | None,
    incoming: tuple[int, ...] | None,
) -> tuple[int, ...] | None:
    if not current:
        return incoming
    if not incoming:
        return current
    return tuple(sorted({*current, *incoming}))


@dataclass(frozen=True, slots=True)
class _MatchContext:
    text: str
    pages: tuple[int, ...] | None = None


@dataclass(slots=True)
class _ElementAggregate:
    element_id: str
    raw_element_type: str
    label: str
    description: str | None
    match_scores: dict[str, tuple[str, float, tuple[int, ...] | None]] = field(default_factory=dict)
    best_score: float = 0.0
    file_id: str | None = None

    def add_match(
        self,
        text: str,
        score: float,
        pages: tuple[int, ...] | None = None,
    ) -> None:
        normalized = _normalize_text(text)
        current = self.match_scores.get(normalized)
        merged_pages = _merge_pages(current[2] if current else None, pages)
        if current is None or score > current[1]:
            self.match_scores[normalized] = (text, score, merged_pages)
        elif merged_pages != current[2]:
            self.match_scores[normalized] = (current[0], current[1], merged_pages)
        if score > self.best_score:
            self.best_score = score

    @property
    def ordered_matches(self) -> list[str]:
        ordered = sorted(
            self.match_scores.values(),
            key=lambda item: (-item[1], _normalize_text(item[0]), item[0]),
        )
        return [text for text, _score, _pages in ordered]

    @property
    def ordered_match_pages(self) -> list[str] | None:
        if not self.match_scores:
            return None
        ordered = sorted(
            self.match_scores.values(),
            key=lambda item: (-item[1], _normalize_text(item[0]), item[0]),
        )
        result: list[str] = []
        for _text, _score, pages in ordered:
            if pages:
                result.append(str(pages[0]))
            else:
                result.append("")
        return result if any(v for v in result) else None

    @property
    def is_pdf_or_image(self) -> bool:
        return self.raw_element_type in ("pdf", "image")

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
                NULL AS candidate_text_2,
                NULL AS candidate_text_3,
                bm25(search_element_text, 6.0) AS fts_rank,
                'search_element_text' AS source_table
            FROM search_element_text
            JOIN element_text AS et ON et.rowid = search_element_text.rowid
            JOIN elements AS e ON e.id = et.element_id
            WHERE search_element_text MATCH ?
              AND e.is_deleted = 0
            ORDER BY bm25(search_element_text, 6.0)
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
)


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    without_marks = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    collapsed = " ".join(without_marks.casefold().split())
    return collapsed


def _tokenize(value: str | None) -> list[str]:
    return _TOKEN_RE.findall(_normalize_text(value))


def _compress_whitespace(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(str(value).split())


def _clip_with_ellipsis(text: str, start: int, end: int) -> str:
    body = text[start:end].strip()
    if not body:
        return ""
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    return f"{prefix}{body}{suffix}"


def _pages_for_range(
    page_spans: tuple[PageSpan, ...],
    start: int,
    end: int,
) -> tuple[int, ...] | None:
    if not page_spans:
        return None
    end = max(start + 1, end)
    pages = [span.page for span in page_spans if start < span.end and end > span.start]
    if not pages:
        return None
    return tuple(sorted(set(pages)))


def _build_match_contexts(
    query: str,
    raw_text: str,
    *,
    page_spans: tuple[PageSpan, ...] = (),
    max_length: int = 220,
) -> list[_MatchContext]:

    compact = _compress_whitespace(raw_text)
    if not compact:
        return []
    if len(compact) <= max_length:
        return [_MatchContext(compact, _pages_for_range(page_spans, 0, len(compact)))]

    query_phrase = _compress_whitespace(query).casefold()
    folded = compact.casefold()
    query_tokens = [token for token in re.findall(r"[\\w]+", query_phrase, re.UNICODE) if len(token) >= 2]

    anchors: list[tuple[int, int, float]] = []

    if query_phrase:
        start = 0
        while True:
            idx = folded.find(query_phrase, start)
            if idx < 0:
                break
            anchors.append((idx, len(query_phrase), 3.0))
            start = idx + max(1, len(query_phrase))

    for token in dict.fromkeys(query_tokens):
        for match in re.finditer(re.escape(token), folded):
            anchors.append((match.start(), len(token), 1.0 + min(len(token), 12) / 12.0))

    if not anchors:
        return [_MatchContext(_clip_with_ellipsis(compact, 0, max_length), _pages_for_range(page_spans, 0, max_length))]

    window = max(80, max_length - 6)
    candidates: list[tuple[float, int, str, tuple[int, ...] | None]] = []
    seen_windows: set[tuple[int, int]] = set()

    for anchor, anchor_length, anchor_weight in anchors:
        start = max(0, anchor - window // 2)
        end = min(len(compact), start + window)
        start = max(0, end - window)

        while start > 0 and compact[start - 1].isalnum():
            start -= 1
        while end < len(compact) and compact[end - 1].isalnum():
            end += 1

        window_key = (start, end)
        if window_key in seen_windows:
            continue
        seen_windows.add(window_key)

        snippet = _clip_with_ellipsis(compact, start, end)
        if not snippet:
            continue

        snippet_folded = snippet.casefold()
        phrase_bonus = 2.0 if query_phrase and query_phrase in snippet_folded else 0.0
        token_hits = sum(1.0 for token in query_tokens if token in snippet_folded)
        score = anchor_weight + phrase_bonus + token_hits
        candidates.append((score, start, snippet, _pages_for_range(page_spans, anchor, anchor + anchor_length)))

    candidates.sort(key=lambda item: (-item[0], item[1]))
    snippets: list[_MatchContext] = []
    seen_snippets: dict[str, int] = {}
    for _score, _start, snippet, pages in candidates:
        normalized = _normalize_text(snippet)
        existing_index = seen_snippets.get(normalized)
        if existing_index is not None:
            current = snippets[existing_index]
            snippets[existing_index] = _MatchContext(current.text, _merge_pages(current.pages, pages))
            continue
        seen_snippets[normalized] = len(snippets)
        snippets.append(_MatchContext(snippet, pages))

    if not snippets:
        return [_MatchContext(_clip_with_ellipsis(compact, 0, max_length), _pages_for_range(page_spans, 0, max_length))]
    return snippets


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

    contains_query = bool(query_normalized and query_normalized in normalized)
    # OCR output can emit a whole text line without spaces between words, turning
    # "AIR NATIONAL GUARD RANGE" into "airnationalguardrange".
    # Matching the query with spacing removed keeps such concatenated OCR output
    # searchable. Guarded by a minimum length to avoid spurious short-substring hits.
    query_nospace = query_normalized.replace(" ", "")
    normalized_nospace = normalized.replace(" ", "")
    contains_query_nospace = bool(
        query_nospace
        and len(query_nospace) >= 4
        and query_nospace in normalized_nospace
    )

    text_quality = max(
        field_exact,
        field_prefix,
        token_coverage,
        0.7 * similarity_score,
        0.9 if contains_query_nospace else 0.0,
    )
    meaningful_match = (
        field_exact == 1.0
        or field_prefix > 0.0
        or contains_query
        or contains_query_nospace
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
    external_targets: tuple[Any, ...] = (),
    external_text_by_revision: dict[tuple[str, str], ExtractedExternalText] | None = None,
) -> list[_ElementAggregate]:
    aggregates: dict[str, _ElementAggregate] = {}
    external_text_by_revision = external_text_by_revision or {}

    def apply_row(
        row: sqlite3.Row,
        *,
        source_weight: float,
        variant_boost: float,
        page_spans: tuple[PageSpan, ...] = (),
    ) -> None:
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
        for index, raw_text in enumerate((row["candidate_text_1"], row["candidate_text_2"], row["candidate_text_3"])):
            score, _similarity = _evaluate_match_text(
                query,
                raw_text,
                fts_rank=fts_rank,
                source_weight=source_weight,
                variant_boost=variant_boost,
            )
            if score <= 0.0 or not raw_text:
                continue
            match_page_spans = page_spans if index == 0 else ()
            for match in _build_match_contexts(query, str(raw_text), page_spans=match_page_spans):
                aggregate.add_match(match.text, score, match.pages)

    for _variant_name, expression, variant_boost in _build_query_variants(query):
        for source in _SOURCE_QUERIES:
            rows = conn.execute(source.sql, (expression, limit_per_source)).fetchall()
            for row in rows:
                apply_row(row, source_weight=source.source_weight, variant_boost=variant_boost)

        if external_targets:
            external_rows = query_external_file_search_rows(
                conn,
                expression=expression,
                limit=limit_per_source,
                targets=external_targets,
            )
            for row in external_rows:
                key = (str(row["external_file_id"]), str(row["external_revision_id"]))
                extracted = external_text_by_revision.get(key)
                apply_row(
                    row,
                    source_weight=0.92,
                    variant_boost=variant_boost,
                    page_spans=extracted.pages if extracted else (),
                )

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

    return file_ids


def _collect_candidates_from_parsed_duc(
    duc_source: str | Path,
    duc_data: dict[str, Any],
    query: str,
    *,
    limit: int,
    ocr_language: str,
    search_all_external_files: bool,
    external_file_targets: list[ExternalFileSearchTarget | dict[str, Any] | tuple[Any, ...] | str] | None,
    external_file_element_ids: list[str] | None,
) -> list[_ElementAggregate]:
    elements = duc_data.get("elements", []) or []
    aggregates: dict[str, _ElementAggregate] = {}
    field_weights = {
        "label": 0.8,
        "description": 0.9,
        "text": 1,
    }

    resolved_external_targets = resolve_external_file_search_targets_from_parsed_duc(
        duc_source,
        duc_data,
        search_all_external_files=search_all_external_files,
        external_file_targets=external_file_targets,
        external_file_element_ids=external_file_element_ids,
    )
    targets_by_file_id: dict[str, list[Any]] = {}
    for target in resolved_external_targets:
        targets_by_file_id.setdefault(target.file_id, []).append(target)
    external_text_cache: dict[tuple[str, str], ExtractedExternalText] = {}

    def _external_texts_for(element: dict[str, Any]) -> list[tuple[ExtractedExternalText, float]]:
        element_type = element.get("type")
        element_id = element.get("id")
        if element_type not in {"pdf", "image"} or not element_id:
            return []
        file_id = element_file_id(element)
        if not file_id:
            return []

        matches: list[tuple[ExtractedExternalText, float]] = []
        for target in targets_by_file_id.get(file_id, []):
            if target.element_id is not None and target.element_id != element_id:
                continue
            cache_key = (target.file_id, target.revision_id)
            if cache_key not in external_text_cache:
                external_text_cache[cache_key] = load_external_file_text(
                    duc_source,
                    target,
                    fallback_element_type=str(element_type),
                    ocr_language=ocr_language,
                )
            extracted = external_text_cache[cache_key]
            if not extracted.text:
                continue
            matches.append((extracted, 0.92 if element_type == "pdf" else 0.9))
        return matches

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
                    for match in _build_match_contexts(query, str(raw_text)):
                        aggregate.add_match(match.text, score, match.pages)

            for extracted_text, source_weight in _external_texts_for(element):
                score, _similarity = _evaluate_match_text(
                    query,
                    extracted_text.text,
                    fts_rank=None,
                    source_weight=source_weight,
                    variant_boost=variant_boost,
                )
                if score > 0.0:
                    for match in _build_match_contexts(
                        query,
                        extracted_text.text,
                        page_spans=extracted_text.pages,
                    ):
                        aggregate.add_match(match.text, score, match.pages)

    results = [aggregate for aggregate in aggregates.values() if aggregate.best_score > 0.0]
    element_lookup = {element.get("id"): element for element in elements}
    for aggregate in results:
        element = element_lookup.get(aggregate.element_id, {})
        aggregate.file_id = element_file_id(element)

    results.sort(key=lambda item: (-item.best_score, item.raw_element_type.casefold(), item.element_id))
    return results[:limit]


def _search_non_sqlite_duc(
    duc_file: Path,
    query: str,
    *,
    output_path: Path,
    limit: int,
    ocr_language: str,
    search_all_external_files: bool,
    external_file_targets: list[ExternalFileSearchTarget | dict[str, Any] | tuple[Any, ...] | str] | None,
    external_file_element_ids: list[str] | None,
) -> DucSearchResponse:
    duc_data = parse_duc(str(duc_file))
    candidates = _collect_candidates_from_parsed_duc(
        duc_file,
        duc_data,
        query,
        limit=limit,
        ocr_language=ocr_language,
        search_all_external_files=search_all_external_files,
        external_file_targets=external_file_targets,
        external_file_element_ids=external_file_element_ids,
    )
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
                match_pages=candidate.ordered_match_pages if candidate.is_pdf_or_image else None,
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
                    match_pages=candidate.ordered_match_pages if candidate.is_pdf_or_image else None,
                )
            )
            continue

        merged_matches: dict[str, tuple[str, float, tuple[int, ...] | None]] = {}
        for candidate in group:
            for normalized, (text, score, pages) in candidate.match_scores.items():
                current = merged_matches.get(normalized)
                if current is None or score > current[1]:
                    merged_matches[normalized] = (text, score, _merge_pages(current[2] if current else None, pages))
                elif pages:
                    merged_matches[normalized] = (current[0], current[1], _merge_pages(current[2], pages))

        ordered = sorted(
            merged_matches.values(),
            key=lambda item: (-item[1], _normalize_text(item[0]), item[0]),
        )
        ordered_matches = [text for text, _score, _pages in ordered]
        match_pages_list: list[str] | None = None
        if any(pages for _text, _score, pages in ordered):
            match_pages_list = [str(sorted(pages)[0]) if pages else "" for _text, _score, pages in ordered]

        results.append(
            DucFileSearchResult(
                file_id=file_id,
                element_type=raw_type,
                matches=ordered_matches,
                score=max(candidate.best_score for candidate in group),
                hits=len(group),
                element_ids=[candidate.element_id for candidate in group],
                match_pages=match_pages_list,
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
    ocr_language: str = "eng",
    search_all_external_files: bool = False,
    external_file_targets: list[ExternalFileSearchTarget | dict[str, Any] | tuple[Any, ...] | str] | None = None,
    external_file_element_ids: list[str] | None = None,
) -> DucSearchResponse:
    """Search DUC elements and export ordered results to JSON."""

    duc_file = Path(duc_path)
    if not duc_file.exists():
        raise FileNotFoundError(f"DUC file not found: {duc_file}")
    if limit <= 0:
        raise ValueError("limit must be greater than zero")

    destination = Path(output_path) if output_path else _default_output_path(duc_file, query)
    use_external_search = bool(
        search_all_external_files
        or external_file_targets
        or external_file_element_ids
    )

    try:
        with DucSQL(duc_file) as db:
            resolved_external_targets = resolve_external_file_search_targets(
                db.conn,
                search_all_external_files=search_all_external_files,
                external_file_targets=external_file_targets,
                external_file_element_ids=external_file_element_ids,
            ) if use_external_search else ()
            external_text_by_revision = ensure_external_file_search_index(
                db.conn,
                targets=resolved_external_targets,
                ocr_language=ocr_language,
            ) if resolved_external_targets else {}
            candidates = _collect_candidates(
                db.conn,
                query,
                limit_per_source=max(limit * 3, 25),
                external_targets=resolved_external_targets,
                external_text_by_revision=external_text_by_revision,
            )[:limit]
            file_id_map = _resolve_file_ids(db.conn, [candidate.element_id for candidate in candidates])
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
    except sqlite3.DatabaseError:
        return _search_non_sqlite_duc(
            duc_file,
            query,
            output_path=destination,
            limit=limit,
            ocr_language=ocr_language,
            search_all_external_files=search_all_external_files,
            external_file_targets=external_file_targets,
            external_file_element_ids=external_file_element_ids,
        )
