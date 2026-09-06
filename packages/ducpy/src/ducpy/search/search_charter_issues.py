"""Search user-authored project Charter and Issue content in DUC files."""

from __future__ import annotations

import json
from collections.abc import Iterable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..parse import parse_duc
from .search_elements import (
    _build_match_contexts,
    _build_query_variants,
    _evaluate_match_text,
    _normalize_text,
    _tokenize,
)

__all__ = [
    "DucCharterIssueSearchResponse",
    "DucCharterIssueSearchResult",
    "DucCharterSearchResult",
    "DucIssueSearchResult",
    "search_duc_charter",
    "search_duc_charter_and_issues",
    "search_duc_issues",
]

_CHARTER_PHASES = {"intent", "review", "delivery", "closed"}
_ISSUE_STATUSES = {"open", "closed", "dismissed"}
_PLACEHOLDER_CHARTER_TITLES = {"untitled"}


@dataclass(slots=True)
class DucCharterSearchResult:
    """One matching Charter section or record."""

    kind: str
    record_id: str
    matches: list[str]
    match_fields: list[str]
    score: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "result_type": "charter",
            "kind": self.kind,
            "record_id": self.record_id,
            "matches": self.matches,
            "match_fields": self.match_fields,
            "score": round(self.score, 6),
        }


@dataclass(slots=True)
class DucIssueSearchResult:
    """One matching issue, aggregating matches from its discussion thread."""

    issue_id: str
    local_id: int
    title: str
    status: str
    matches: list[str]
    match_fields: list[str]
    matched_message_ids: list[str]
    score: float
    anchor: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "result_type": "issue",
            "issue_id": self.issue_id,
            "local_id": self.local_id,
            "title": self.title,
            "status": self.status,
            "matches": self.matches,
            "match_fields": self.match_fields,
            "matched_message_ids": self.matched_message_ids,
            "score": round(self.score, 6),
        }
        if self.anchor is not None:
            payload["anchor"] = self.anchor
        return payload


DucCharterIssueSearchResult = DucCharterSearchResult | DucIssueSearchResult


@dataclass(slots=True)
class DucCharterIssueSearchResponse:
    """Combined Charter and Issue search response."""

    query: str
    results: list[DucCharterIssueSearchResult]
    total_hits: int
    charter_hits: int
    issue_hits: int
    all_issue_ids: list[str]
    output_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "total_hits": self.total_hits,
            "charter_hits": self.charter_hits,
            "issue_hits": self.issue_hits,
            "all_issue_ids": self.all_issue_ids,
            "results": [result.to_dict() for result in self.results],
        }


@dataclass(frozen=True, slots=True)
class _CandidateText:
    text: str
    field_name: str
    weight: float
    exact_only: bool = False
    message_id: str | None = None


@dataclass(frozen=True, slots=True)
class _StoredMatch:
    text: str
    field_name: str
    score: float
    message_id: str | None


@dataclass(slots=True)
class _Aggregate:
    result_type: str
    kind: str
    record_id: str
    issue: dict[str, Any] | None = None
    message_scores: dict[str, float] = field(default_factory=dict)
    matches: dict[str, _StoredMatch] = field(default_factory=dict)
    best_score: float = 0.0

    def add_match(
        self,
        text: str,
        field_name: str,
        score: float,
        message_id: str | None,
    ) -> None:
        normalized = _normalize_text(text)
        current = self.matches.get(normalized)
        if current is None or score > current.score:
            self.matches[normalized] = _StoredMatch(
                text=text,
                field_name=field_name,
                score=score,
                message_id=message_id,
            )
        if message_id is not None:
            self.message_scores[message_id] = max(
                self.message_scores.get(message_id, 0.0), score
            )
        self.best_score = max(self.best_score, score)

    @property
    def ordered_matches(self) -> list[_StoredMatch]:
        return sorted(
            self.matches.values(),
            key=lambda item: (-item.score, _normalize_text(item.text), item.field_name),
        )


def _text(value: Any) -> str:
    return value if isinstance(value, str) else ""


def _candidate(
    value: Any,
    field_name: str,
    weight: float,
    *,
    exact_only: bool = False,
    message_id: str | None = None,
) -> _CandidateText | None:
    text = _text(value).strip()
    if not text:
        return None
    return _CandidateText(text, field_name, weight, exact_only, message_id)


def _candidates(values: Iterable[_CandidateText | None]) -> list[_CandidateText]:
    return [value for value in values if value is not None]


def _apply_candidates(
    aggregate: _Aggregate,
    query: str,
    candidates: Iterable[_CandidateText],
    variant_boosts: list[float],
) -> None:
    normalized_query = _normalize_text(query)
    for candidate in candidates:
        if candidate.exact_only and _normalize_text(candidate.text) != normalized_query:
            continue
        best_score = 0.0
        for variant_boost in variant_boosts:
            score, _similarity = _evaluate_match_text(
                query,
                candidate.text,
                fts_rank=None,
                source_weight=candidate.weight,
                variant_boost=variant_boost,
            )
            best_score = max(best_score, score)
        if best_score <= 0.0:
            continue
        for match in _build_match_contexts(query, candidate.text):
            aggregate.add_match(
                match.text,
                candidate.field_name,
                best_score,
                candidate.message_id,
            )


def _charter_aggregates(
    charter: dict[str, Any] | None,
    query: str,
    variant_boosts: list[float],
    *,
    phase: str | None,
) -> list[_Aggregate]:
    if not charter or (phase is not None and charter.get("phase") != phase):
        return []

    results: list[_Aggregate] = []
    title = _text(charter.get("title")).strip()
    overview = _Aggregate("charter", "charter_overview", "charter")
    overview_candidates = _candidates(
        [
            _candidate(
                title
                if _normalize_text(title) not in _PLACEHOLDER_CHARTER_TITLES
                else "",
                "title",
                0.99,
            ),
            _candidate(charter.get("objective"), "objective", 1.0),
            _candidate(charter.get("description"), "description", 0.9),
            _candidate(charter.get("closed_reason"), "closed_reason", 0.88),
        ]
    )
    _apply_candidates(overview, query, overview_candidates, variant_boosts)
    if overview.best_score > 0.0:
        results.append(overview)

    for requirement in charter.get("requirements") or []:
        aggregate = _Aggregate(
            "charter",
            "charter_requirement",
            _text(requirement.get("id")),
        )
        candidates = _candidates(
            [_candidate(requirement.get("statement"), "requirement_statement", 0.98)]
        )
        candidates.extend(
            value
            for criterion in requirement.get("acceptance_criteria") or []
            if (value := _candidate(criterion, "acceptance_criterion", 0.97))
            is not None
        )
        _apply_candidates(aggregate, query, candidates, variant_boosts)
        if aggregate.best_score > 0.0:
            results.append(aggregate)

    for constraint in charter.get("constraints") or []:
        aggregate = _Aggregate(
            "charter",
            "charter_constraint",
            _text(constraint.get("id")),
        )
        _apply_candidates(
            aggregate,
            query,
            _candidates(
                [_candidate(constraint.get("statement"), "constraint_statement", 0.97)]
            ),
            variant_boosts,
        )
        if aggregate.best_score > 0.0:
            results.append(aggregate)

    for decision in charter.get("decisions") or []:
        aggregate = _Aggregate(
            "charter",
            "charter_decision",
            _text(decision.get("id")),
        )
        _apply_candidates(
            aggregate,
            query,
            _candidates(
                [
                    _candidate(decision.get("decision"), "decision", 0.96),
                    _candidate(decision.get("rationale"), "decision_rationale", 0.92),
                ]
            ),
            variant_boosts,
        )
        if aggregate.best_score > 0.0:
            results.append(aggregate)

    for index, stakeholder in enumerate(charter.get("stakeholders") or []):
        actor = stakeholder.get("actor") or {}
        identifier = _text(actor.get("identifier"))
        aggregate = _Aggregate(
            "charter",
            "charter_stakeholder",
            identifier or "stakeholder:" + str(index),
        )
        _apply_candidates(
            aggregate,
            query,
            _candidates(
                [
                    _candidate(actor.get("name"), "stakeholder_name", 0.78),
                    _candidate(stakeholder.get("role"), "stakeholder_role", 0.7),
                    _candidate(
                        identifier, "stakeholder_identifier", 0.55, exact_only=True
                    ),
                ]
            ),
            variant_boosts,
        )
        if aggregate.best_score > 0.0:
            results.append(aggregate)
    return results


def _public_anchor(anchor: Any) -> dict[str, Any] | None:
    if not isinstance(anchor, dict):
        return None
    anchor_type = anchor.get("type")
    fields_by_type = {
        "canvas": ("type", "x", "y", "scope"),
        "element": ("type", "element_id", "anchor_x", "anchor_y"),
        "model": ("type", "element_id", "point", "normal", "topology_id"),
    }
    fields = fields_by_type.get(anchor_type)
    if fields is None:
        return None
    result = {
        field_name: anchor[field_name]
        for field_name in fields
        if anchor.get(field_name) is not None
    }
    for vector_field in ("point", "normal"):
        if isinstance(result.get(vector_field), tuple):
            result[vector_field] = list(result[vector_field])

    return result


def _issue_aggregates(
    issues: Iterable[dict[str, Any]],
    query: str,
    variant_boosts: list[float],
    *,
    status: str | None,
    include_deleted: bool,
) -> list[_Aggregate]:
    results: list[_Aggregate] = []
    for issue in issues:
        if not include_deleted and issue.get("deleted_at") is not None:
            continue
        if status is not None and issue.get("status") != status:
            continue

        issue_id = _text(issue.get("id"))
        aggregate = _Aggregate("issue", "issue", issue_id, issue=issue)
        issue_candidates = _candidates(
            [
                _candidate(issue.get("title"), "title", 1.0),
                _candidate(issue.get("dismissed_reason"), "dismissed_reason", 0.92),
                _candidate(
                    issue.get("author_id"), "author_identifier", 0.55, exact_only=True
                ),
            ]
        )
        local_id = issue.get("local_id")
        if isinstance(local_id, int) and local_id > 0:
            issue_candidates.append(
                _CandidateText("#" + str(local_id), "local_id", 1.0, True)
            )
        for assignee_id in issue.get("assignee_ids") or []:
            candidate = _candidate(
                assignee_id,
                "assignee_identifier",
                0.58,
                exact_only=True,
            )
            if candidate is not None:
                issue_candidates.append(candidate)
        for follower_id in issue.get("follower_ids") or []:
            candidate = _candidate(
                follower_id,
                "follower_identifier",
                0.52,
                exact_only=True,
            )
            if candidate is not None:
                issue_candidates.append(candidate)

        anchor = issue.get("anchor") or {}
        if isinstance(anchor, dict) and anchor.get("type") == "model":
            topology = _candidate(
                anchor.get("topology_id"),
                "topology_id",
                0.65,
                exact_only=True,
            )
            if topology is not None:
                issue_candidates.append(topology)

        for message in issue.get("messages") or []:
            if not include_deleted and message.get("deleted_at") is not None:
                continue
            message_id = _text(message.get("id")) or None
            author = message.get("author") or {}
            issue_candidates.extend(
                _candidates(
                    [
                        _candidate(
                            message.get("content"),
                            "message_content",
                            0.98,
                            message_id=message_id,
                        ),
                        _candidate(
                            author.get("name"),
                            "message_author_name",
                            0.76,
                            message_id=message_id,
                        ),
                        _candidate(
                            author.get("identifier"),
                            "message_author_identifier",
                            0.55,
                            exact_only=True,
                            message_id=message_id,
                        ),
                    ]
                )
            )

        _apply_candidates(aggregate, query, issue_candidates, variant_boosts)
        if aggregate.best_score > 0.0:
            results.append(aggregate)
    return results


def _result_from_aggregate(aggregate: _Aggregate) -> DucCharterIssueSearchResult:
    ordered = aggregate.ordered_matches
    matches = [match.text for match in ordered]
    match_fields = [match.field_name for match in ordered]
    if aggregate.result_type == "charter":
        return DucCharterSearchResult(
            kind=aggregate.kind,
            record_id=aggregate.record_id,
            matches=matches,
            match_fields=match_fields,
            score=aggregate.best_score,
        )

    issue = aggregate.issue or {}
    message_ids = sorted(
        aggregate.message_scores,
        key=lambda message_id: (-aggregate.message_scores[message_id], message_id),
    )
    return DucIssueSearchResult(
        issue_id=aggregate.record_id,
        local_id=int(issue.get("local_id") or 0),
        title=_text(issue.get("title")),
        status=_text(issue.get("status")),
        matches=matches,
        match_fields=match_fields,
        matched_message_ids=message_ids,
        score=aggregate.best_score,
        anchor=_public_anchor(issue.get("anchor")),
    )


def _validate_filter(value: str | None, allowed: set[str], name: str) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in allowed:
        choices = ", ".join(sorted(allowed))
        raise ValueError(name + " must be one of: " + choices)
    return normalized


def _default_output_path(duc_path: Path, query: str, scope: str) -> Path:
    slug_tokens = _tokenize(query)
    slug = "-".join(slug_tokens[:8]) if slug_tokens else "search"
    filename = f"{duc_path.stem}.{slug}.{scope}-search-results.json"
    return duc_path.with_name(filename)


def _search_charter_issues(
    duc_path: str | Path,
    query: str,
    *,
    include_charter: bool,
    include_issues: bool,
    output_path: str | Path | None,
    limit: int,
    phase: str | None,
    status: str | None,
    include_deleted: bool,
    output_scope: str,
) -> DucCharterIssueSearchResponse:
    duc_file = Path(duc_path)
    if not duc_file.exists():
        raise FileNotFoundError("DUC file not found: " + str(duc_file))
    if limit <= 0:
        raise ValueError("limit must be greater than zero")
    phase = _validate_filter(phase, _CHARTER_PHASES, "phase")
    status = _validate_filter(status, _ISSUE_STATUSES, "status")

    variants = _build_query_variants(query)
    variant_boosts = [variant_boost for _name, _expression, variant_boost in variants]
    duc_data = parse_duc(str(duc_file))
    aggregates: list[_Aggregate] = []
    if include_charter:
        aggregates.extend(
            _charter_aggregates(
                duc_data.get("charter"),
                query,
                variant_boosts,
                phase=phase,
            )
        )
    if include_issues:
        aggregates.extend(
            _issue_aggregates(
                duc_data.get("issues") or [],
                query,
                variant_boosts,
                status=status,
                include_deleted=include_deleted,
            )
        )
    aggregates.sort(
        key=lambda item: (
            -item.best_score,
            0 if item.result_type == "charter" else 1,
            item.kind,
            item.record_id,
        )
    )
    results = [_result_from_aggregate(aggregate) for aggregate in aggregates[:limit]]
    all_issue_ids = [
        result.issue_id
        for result in results
        if isinstance(result, DucIssueSearchResult)
    ]
    charter_hits = sum(isinstance(result, DucCharterSearchResult) for result in results)
    issue_hits = len(all_issue_ids)
    destination = (
        Path(output_path)
        if output_path is not None
        else _default_output_path(duc_file, query, output_scope)
    )
    response = DucCharterIssueSearchResponse(
        query=query,
        results=results,
        total_hits=len(results),
        charter_hits=charter_hits,
        issue_hits=issue_hits,
        all_issue_ids=all_issue_ids,
        output_path=str(destination),
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(response.to_dict(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return response


def search_duc_charter(
    duc_path: str | Path,
    query: str,
    *,
    output_path: str | Path | None = None,
    limit: int = 50,
    phase: str | None = None,
) -> DucCharterIssueSearchResponse:
    """Search user-authored fields in the project Charter."""

    return _search_charter_issues(
        duc_path,
        query,
        include_charter=True,
        include_issues=False,
        output_path=output_path,
        limit=limit,
        phase=phase,
        status=None,
        include_deleted=False,
        output_scope="charter",
    )


def search_duc_issues(
    duc_path: str | Path,
    query: str,
    *,
    output_path: str | Path | None = None,
    limit: int = 50,
    status: str | None = None,
    include_deleted: bool = False,
) -> DucCharterIssueSearchResponse:
    """Search issue titles, discussions, people, and exact reference fields."""

    return _search_charter_issues(
        duc_path,
        query,
        include_charter=False,
        include_issues=True,
        output_path=output_path,
        limit=limit,
        phase=None,
        status=status,
        include_deleted=include_deleted,
        output_scope="issue",
    )


def search_duc_charter_and_issues(
    duc_path: str | Path,
    query: str,
    *,
    output_path: str | Path | None = None,
    limit: int = 50,
    phase: str | None = None,
    status: str | None = None,
    include_deleted: bool = False,
) -> DucCharterIssueSearchResponse:
    """Search the project Charter and Issues in one ranked response."""

    return _search_charter_issues(
        duc_path,
        query,
        include_charter=True,
        include_issues=True,
        output_path=output_path,
        limit=limit,
        phase=phase,
        status=status,
        include_deleted=include_deleted,
        output_scope="charter-issue",
    )
