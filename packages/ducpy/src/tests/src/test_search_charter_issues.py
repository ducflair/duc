"""Tests for project Charter and Issue search."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import ducpy as duc
from ducpy.search import (
    DucCharterSearchResult,
    DucIssueSearchResult,
    search_duc_charter,
    search_duc_charter_and_issues,
    search_duc_issues,
)


def _asset_input_path(filename: str) -> Path:
    return (
        Path(__file__).resolve().parents[5]
        / "assets"
        / "testing"
        / "duc-files"
        / filename
    )


def _build_search_fixture(path: Path) -> Path:
    charter = (
        duc.StateBuilder()
        .build_charter()
        .with_title("Permit Set")
        .with_description("Coastal laboratory modernization")
        .with_objective("Deliver a reproducible microscope platform")
        .with_phase("review")
        .add_requirement(
            "Preserve the central optical axis",
            id="requirement-optics",
            acceptance_criteria=["Alignment drift remains below five microns"],
        )
        .add_constraint(
            "Keep the existing structural grid",
            id="constraint-grid",
        )
        .add_decision(
            "Use metric units",
            "The jurisdiction requires metric submissions",
            id="decision-units",
        )
        .add_stakeholder(
            "ana@example.com",
            "Safety reviewer",
            name="Ana Silva",
        )
        .build()
    )

    issues = [
        (
            duc.StateBuilder()
            .with_id("issue-title")
            .build_issue()
            .with_local_id(12)
            .with_title("Cooling manifold conflict")
            .with_status("open")
            .with_author_id("architect@example.com")
            .add_assignee("engineer@example.com")
            .add_follower("owner@example.com")
            .add_message(
                "reviewer@example.com",
                "Seal clearance needs another inspection.",
                name="María Reviewer",
                reactions={"reaction-secret": ["reaction-actor-secret"]},
            )
            .add_message(
                "architect@example.com",
                "Seal clearance remains unresolved.",
                name="Lead Architect",
            )
            .with_model_anchor(
                "model-secret-id",
                [9876.543, 2.0, 3.0],
                normal=[0.0, 0.0, 1.0],
                topology_id="face-bearing-seat",
            )
            .build()
        ),
        (
            duc.StateBuilder()
            .with_id("issue-message")
            .build_issue()
            .with_local_id(13)
            .with_title("Review equipment routing")
            .with_status("closed")
            .with_author_id("architect@example.com")
            .add_message(
                "reviewer@example.com",
                "Cooling manifold conflict",
                name="María Reviewer",
            )
            .build()
        ),
        (
            duc.StateBuilder()
            .with_id("issue-dismissed")
            .build_issue()
            .with_local_id(14)
            .with_title("Old review note")
            .with_status("dismissed")
            .with_author_id("architect@example.com")
            .with_dismissed_reason("Duplicate optical review note")
            .build()
        ),
        (
            duc.StateBuilder()
            .with_id("issue-deleted")
            .build_issue()
            .with_local_id(15)
            .with_title("Archived gasket finding")
            .with_status("open")
            .with_author_id("architect@example.com")
            .with_deleted_at(123)
            .build()
        ),
        (
            duc.StateBuilder()
            .with_id("issue-deleted-message")
            .build_issue()
            .with_local_id(16)
            .with_title("Active issue")
            .with_status("open")
            .with_author_id("architect@example.com")
            .add_message(
                "architect@example.com",
                "Confidential spindle note",
                deleted_at=123,
            )
            .build()
        ),
    ]

    duc.serialize_duc(
        name="CharterIssueSearch",
        output_path=path,
        charter=charter,
        issues=issues,
    )
    return path


@pytest.mark.parametrize(
    ("query", "kind", "field_name"),
    [
        ("Permit Set", "charter_overview", "title"),
        ("reproducible microscope", "charter_overview", "objective"),
        ("Coastal laboratory", "charter_overview", "description"),
        ("central optical axis", "charter_requirement", "requirement_statement"),
        ("below five microns", "charter_requirement", "acceptance_criterion"),
        ("structural grid", "charter_constraint", "constraint_statement"),
        ("metric submissions", "charter_decision", "decision_rationale"),
        ("Ana Silva", "charter_stakeholder", "stakeholder_name"),
    ],
)
def test_charter_search_covers_user_authored_fields(
    tmp_path: Path,
    query: str,
    kind: str,
    field_name: str,
):
    duc_path = _build_search_fixture(tmp_path / "charter-fields.duc")

    response = search_duc_charter(
        duc_path,
        query,
        output_path=tmp_path / "charter-result.json",
    )

    assert response.charter_hits >= 1
    assert response.issue_hits == 0
    matching = [
        result
        for result in response.results
        if isinstance(result, DucCharterSearchResult) and result.kind == kind
    ]
    assert matching
    assert field_name in matching[0].match_fields


def test_charter_phase_is_a_filter_not_searchable_text(tmp_path: Path):
    duc_path = _build_search_fixture(tmp_path / "charter-phase.duc")

    assert (
        search_duc_charter(
            duc_path,
            "microscope",
            phase="review",
            output_path=tmp_path / "review.json",
        ).total_hits
        == 1
    )
    assert (
        search_duc_charter(
            duc_path,
            "microscope",
            phase="delivery",
            output_path=tmp_path / "delivery.json",
        ).total_hits
        == 0
    )
    assert (
        search_duc_charter(
            duc_path,
            "intent",
            output_path=tmp_path / "phase-as-text.json",
        ).total_hits
        == 0
    )


def test_issue_search_ranks_titles_and_aggregates_message_matches(tmp_path: Path):
    duc_path = _build_search_fixture(tmp_path / "issue-ranking.duc")

    ranked = search_duc_issues(
        duc_path,
        "Cooling manifold conflict",
        output_path=tmp_path / "ranked.json",
    )
    assert ranked.all_issue_ids[:2] == ["issue-title", "issue-message"]
    assert isinstance(ranked.results[0], DucIssueSearchResult)
    assert ranked.results[0].match_fields[0] == "title"

    aggregated = search_duc_issues(
        duc_path,
        "seal clearance",
        output_path=tmp_path / "aggregated.json",
    )
    assert aggregated.all_issue_ids == ["issue-title"]
    result = aggregated.results[0]
    assert isinstance(result, DucIssueSearchResult)
    assert len(result.matched_message_ids) == 2
    assert result.match_fields == ["message_content", "message_content"]


def test_issue_exact_references_and_anchor_navigation(tmp_path: Path):
    duc_path = _build_search_fixture(tmp_path / "issue-references.duc")

    local_id = search_duc_issues(
        duc_path,
        "#12",
        output_path=tmp_path / "local-id.json",
    )
    assert local_id.all_issue_ids == ["issue-title"]
    assert local_id.results[0].match_fields == ["local_id"]

    assignee = search_duc_issues(
        duc_path,
        "engineer@example.com",
        output_path=tmp_path / "assignee.json",
    )
    assert assignee.all_issue_ids == ["issue-title"]
    assert assignee.results[0].match_fields == ["assignee_identifier"]

    assert (
        search_duc_issues(
            duc_path,
            "engineer",
            output_path=tmp_path / "partial-identity.json",
        ).total_hits
        == 0
    )

    topology = search_duc_issues(
        duc_path,
        "face-bearing-seat",
        output_path=tmp_path / "topology.json",
    )
    assert topology.all_issue_ids == ["issue-title"]
    assert topology.results[0].anchor == {
        "type": "model",
        "element_id": "model-secret-id",
        "point": [9876.543, 2.0, 3.0],
        "normal": [0.0, 0.0, 1.0],
        "topology_id": "face-bearing-seat",
    }

    for excluded_query in ("9876.543", "model-secret-id", "reaction-secret"):
        assert (
            search_duc_issues(
                duc_path,
                excluded_query,
                output_path=tmp_path / (excluded_query.replace(".", "-") + ".json"),
            ).total_hits
            == 0
        )


def test_issue_status_filter_and_deleted_content(tmp_path: Path):
    duc_path = _build_search_fixture(tmp_path / "issue-filters.duc")

    assert search_duc_issues(
        duc_path,
        "Cooling manifold conflict",
        status="open",
        output_path=tmp_path / "open.json",
    ).all_issue_ids == ["issue-title"]
    assert search_duc_issues(
        duc_path,
        "Cooling manifold conflict",
        status="closed",
        output_path=tmp_path / "closed.json",
    ).all_issue_ids == ["issue-message"]
    assert (
        search_duc_issues(
            duc_path,
            "open",
            output_path=tmp_path / "status-as-text.json",
        ).total_hits
        == 0
    )

    assert (
        search_duc_issues(
            duc_path,
            "Archived gasket finding",
            output_path=tmp_path / "deleted-issue-hidden.json",
        ).total_hits
        == 0
    )
    assert (
        search_duc_issues(
            duc_path,
            "Confidential spindle note",
            output_path=tmp_path / "deleted-message-hidden.json",
        ).total_hits
        == 0
    )
    assert search_duc_issues(
        duc_path,
        "Archived gasket finding",
        include_deleted=True,
        output_path=tmp_path / "deleted-issue-visible.json",
    ).all_issue_ids == ["issue-deleted"]
    assert search_duc_issues(
        duc_path,
        "Confidential spindle note",
        include_deleted=True,
        output_path=tmp_path / "deleted-message-visible.json",
    ).all_issue_ids == ["issue-deleted-message"]


def test_combined_search_writes_typed_json_and_respects_limit(tmp_path: Path):
    duc_path = _build_search_fixture(tmp_path / "combined.duc")
    output_path = tmp_path / "combined.json"

    response = search_duc_charter_and_issues(
        duc_path,
        "optical",
        output_path=output_path,
        limit=2,
    )

    assert response.total_hits == 2
    assert response.charter_hits + response.issue_hits == 2
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload == response.to_dict()
    assert {result["result_type"] for result in payload["results"]} <= {
        "charter",
        "issue",
    }


def test_real_microscope_fixture_searches_charter_and_issues(tmp_path: Path):
    response = search_duc_charter_and_issues(
        _asset_input_path("microscope-core.duc"),
        "optical axis",
        output_path=tmp_path / "microscope.json",
    )

    assert response.charter_hits > 0
    assert response.issue_hits > 0
    assert any(
        isinstance(result, DucCharterSearchResult)
        and result.kind
        in {"charter_overview", "charter_requirement", "charter_decision"}
        for result in response.results
    )
    assert any(
        isinstance(result, DucIssueSearchResult)
        and "optical" in " ".join(result.matches).casefold()
        for result in response.results
    )


def test_universal_fixture_has_no_issue_hits_and_ignores_untitled_placeholder(
    tmp_path: Path,
):
    universal = _asset_input_path("universal.duc")

    assert (
        search_duc_issues(
            universal,
            "anything",
            output_path=tmp_path / "universal-issues.json",
        ).total_hits
        == 0
    )
    assert (
        search_duc_charter(
            universal,
            "Untitled",
            output_path=tmp_path / "universal-charter.json",
        ).total_hits
        == 0
    )


def test_search_validation(tmp_path: Path):
    duc_path = _build_search_fixture(tmp_path / "validation.duc")

    with pytest.raises(ValueError, match="searchable token"):
        search_duc_charter(duc_path, "   ")
    with pytest.raises(ValueError, match="limit"):
        search_duc_issues(duc_path, "optical", limit=0)
    with pytest.raises(ValueError, match="phase"):
        search_duc_charter(duc_path, "optical", phase="draft")
    with pytest.raises(ValueError, match="status"):
        search_duc_issues(duc_path, "optical", status="pending")
    with pytest.raises(FileNotFoundError):
        search_duc_issues(tmp_path / "missing.duc", "optical")
