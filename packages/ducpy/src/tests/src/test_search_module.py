"""Tests for the DUC element search module."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from ducpy.parse import parse_duc_lazy
from ducpy.search import search_duc_elements


def _asset_input_path(filename: str) -> Path:
    return Path(__file__).resolve().parents[5] / "assets" / "testing" / "duc-files" / filename


def _run_asset_search(
    asset_name: str,
    query: str,
    *,
    test_output_dir: str,
    test_name: str,
    limit: int = 50,
) -> tuple[dict, object, Path, dict]:
    asset_path = _asset_input_path(asset_name)
    assert asset_path.exists(), f"Missing asset file: {asset_path}"

    json_path = Path(test_output_dir+"/search_results") /  f"{test_name}.json"
    if json_path.exists():
        json_path.unlink()

    response = search_duc_elements(asset_path, query, output_path=json_path, limit=limit)
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    parsed_asset = parse_duc_lazy(str(asset_path))
    return payload, response, json_path, parsed_asset


def _find_elements(parsed_asset: dict, *, element_type: str | None = None, label_prefix: str | None = None) -> list[dict]:
    elements = parsed_asset.get("elements", []) or []
    matches: list[dict] = []
    for element in elements:
        if element.get("is_deleted"):
            continue
        if element_type is not None and element.get("type") != element_type:
            continue
        label = element.get("label") or ""
        if label_prefix is not None and not str(label).startswith(label_prefix):
            continue
        matches.append(element)
    return matches


def test_search_exact_rectangle_result_from_blocks_instances_asset(test_output_dir, request):
    payload, response, json_path, parsed_asset = _run_asset_search(
        "blocks_instances.duc",
        "Rectangle 1",
        test_output_dir=test_output_dir,
        test_name=request.node.name,
    )
    exact = next(element for element in parsed_asset["elements"] if element.get("label") == "Rectangle 1")

    assert payload["query"] == "Rectangle 1"
    assert payload["total_hits"] >= 1
    assert payload["results"][0]["element_id"] == exact["id"]
    assert payload["results"][0]["element_type"] == "rectangle"
    assert payload["results"][0]["matches"][0] == "Rectangle 1"
    assert response.output_path == str(json_path)


def test_search_groups_repeated_pdf_file_results(test_output_dir, request):
    payload, response, _json_path, parsed_asset = _run_asset_search(
        "universal.duc",
        "Pdf 1",
        test_output_dir=test_output_dir,
        test_name=request.node.name,
        limit=2,
    )
    pdf_elements = [element for element in parsed_asset["elements"] if element.get("type") == "pdf" and element.get("file_id")]
    duplicated_file_id = next(
        file_id for file_id, count in Counter(element["file_id"] for element in pdf_elements).items() if count > 1
    )
    selected = [element for element in pdf_elements if element.get("file_id") == duplicated_file_id]
    assert len(selected) == 2

    assert payload["query"] == "Pdf 1"
    assert payload["total_hits"] == 2
    assert set(payload["all_element_ids"]) == {element["id"] for element in selected}
    assert len(payload["results"]) == 1

    grouped = payload["results"][0]
    assert grouped["file_id"] == duplicated_file_id
    assert grouped["element_type"] == "pdf"
    assert grouped["hits"] == 2
    assert set(grouped["element_ids"]) == {element["id"] for element in selected}
    assert grouped["matches"][0] == "Pdf 1"
    assert set(grouped["matches"]) == {element["label"] for element in selected}
    assert grouped["score"] == round(max(result.score for result in response.results), 6)


def test_search_prefix_query_rec_returns_multiple_rectangle_matches(test_output_dir, request):
    payload, response, _json_path, parsed_asset = _run_asset_search(
        "blocks_instances.duc",
        "rec",
        test_output_dir=test_output_dir,
        test_name=request.node.name,
    )
    rectangle_count = len(_find_elements(parsed_asset, element_type="rectangle", label_prefix="Rectangle"))
    assert rectangle_count >= 4

    assert payload["query"] == "rec"
    assert payload["total_hits"] >= 4
    assert len(payload["results"]) >= 4
    assert response.results[0].score >= response.results[-1].score
    assert payload["results"][0]["element_type"] == "rectangle"
    assert "rec" in payload["results"][0]["matches"][0].lower()
    assert sum(result["element_type"] == "rectangle" for result in payload["results"]) >= 4
    assert all(any("rec" in match.lower() for match in result["matches"]) for result in payload["results"][:4])


def test_search_text_query_linear_finds_text_content(test_output_dir, request):
    payload, _response, _json_path, parsed_asset = _run_asset_search(
        "universal.duc",
        "Linear",
        test_output_dir=test_output_dir,
        test_name=request.node.name,
    )
    expected = next(element for element in parsed_asset["elements"] if element.get("type") == "text" and element.get("text") == "Linear")

    assert payload["query"] == "Linear"
    assert payload["total_hits"] >= 1
    assert payload["results"][0]["element_id"] == expected["id"]
    assert payload["results"][0]["element_type"] == "text"
    assert any("linear" in match.lower() for match in payload["results"][0]["matches"])


def test_search_gibberish_query_returns_empty_results(test_output_dir, request):
    payload, _response, json_path, parsed_asset = _run_asset_search(
        "universal.duc",
        "siauhfbohasbjflasvl",
        test_output_dir=test_output_dir,
        test_name=request.node.name,
    )
    assert len(parsed_asset.get("elements", [])) > 0

    assert payload["query"] == "siauhfbohasbjflasvl"
    assert payload["total_hits"] == 0
    assert payload["all_element_ids"] == []
    assert payload["results"] == []
    assert json.loads(json_path.read_text(encoding="utf-8")) == payload