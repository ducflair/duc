"""Tests for searching elements with external-file focused queries."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ducpy.parse import parse_duc_lazy
from ducpy.search import ExternalFileSearchTarget, search_duc_elements
from ducpy.search.image_ocr import server_side_ocr_available


_OCR_AVAILABLE = server_side_ocr_available()


def _asset_input_path(filename: str) -> Path:
    return Path(__file__).resolve().parents[5] / "assets" / "testing" / "duc-files" / filename


def _run_external_file_search(
    query: str,
    test_output_dir,
    request,
    *,
    filename: str = "universal.duc",
    output_file_name: str | None = None,
    search_all_external_files: bool = False,
    external_file_targets: list[ExternalFileSearchTarget] | None = None,
    external_file_element_ids: list[str] | None = None,
):
    asset_path = _asset_input_path(filename)
    assert asset_path.exists(), f"Missing asset file: {asset_path}"

    output_dir = Path(test_output_dir) / "search_results" / "external_files"
    output_dir.mkdir(parents=True, exist_ok=True)

    json_file_stem = output_file_name or request.node.name
    json_path = output_dir / f"{json_file_stem}.json"
    if json_path.exists():
        json_path.unlink()

    response = search_duc_elements(
        asset_path,
        query,
        output_path=json_path,
        limit=50,
        search_all_external_files=search_all_external_files,
        external_file_targets=external_file_targets,
        external_file_element_ids=external_file_element_ids,
    )

    assert json_path.exists()
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    assert payload["query"] == query
    assert response.output_path == str(json_path)

    return payload, response


def _empire_pdf_elements() -> list[dict]:
    parsed = parse_duc_lazy(str(_asset_input_path("empire-state-building.duc")))
    return [
        element
        for element in parsed["elements"]
        if element.get("type") == "pdf" and element.get("file_id") and not element.get("is_deleted")
    ]


def test_default_search_does_not_search_external_files(test_output_dir, request):
    query = "The largest single regional fire"
    payload, _ = _run_external_file_search(query, test_output_dir, request)
    assert payload["total_hits"] == 0
    assert payload["results"] == []


@pytest.mark.slow
def test_search_pdf_from_all_external_files_query(test_output_dir, request):
    payload, _ = _run_external_file_search(
        "empire state building",
        test_output_dir,
        request,
        filename="empire-state-building.duc",
        search_all_external_files=True,
    )
    pdf_results = [result for result in payload["results"] if result["element_type"] == "pdf"]
    assert len(pdf_results) == 2
    for result in pdf_results:
        mp = result.get("match_pages")
        assert mp is not None
        assert len(mp) == len(result["matches"])
        assert any(int(p) == 1 for p in mp)


@pytest.mark.slow
def test_search_pdf_from_selected_file_id_query(test_output_dir, request):
    selected = _empire_pdf_elements()
    payload, _ = _run_external_file_search(
        "empire state building",
        test_output_dir,
        request,
        filename="empire-state-building.duc",
        external_file_targets=[ExternalFileSearchTarget(file_id=selected[0]["file_id"])],
    )
    pdf_results = [result for result in payload["results"] if result["element_type"] == "pdf"]
    assert len(pdf_results) == 1
    assert pdf_results[0]["element_id"] == selected[0]["id"]
    mp = pdf_results[0].get("match_pages")
    assert mp is not None
    assert len(mp) == len(pdf_results[0]["matches"])
    assert any(int(p) == 1 for p in mp)


@pytest.mark.slow
def test_search_pdf_from_selected_element_id_query(test_output_dir, request):
    selected = _empire_pdf_elements()
    payload, _ = _run_external_file_search(
        "empire state building",
        test_output_dir,
        request,
        filename="empire-state-building.duc",
        external_file_element_ids=[selected[0]["id"]],
    )
    pdf_results = [result for result in payload["results"] if result["element_type"] == "pdf"]
    assert len(pdf_results) == 1
    assert pdf_results[0]["element_id"] == selected[0]["id"]
    mp = pdf_results[0].get("match_pages")
    assert mp is not None
    assert len(mp) == len(pdf_results[0]["matches"])
    assert any(int(p) == 1 for p in mp)


@pytest.mark.slow
def test_scanned_pdf_page_content_is_not_searchable(test_output_dir, request):
    payload, _ = _run_external_file_search(
        "AIR NATIONAL GUARD RANGE",
        test_output_dir,
        request,
        search_all_external_files=True,
    )
    assert payload["total_hits"] == 0


@pytest.mark.slow
def test_search_pdf_results_include_structured_pages(test_output_dir, request):
    payload, _ = _run_external_file_search(
        "empire",
        test_output_dir,
        request,
        filename="empire-state-building.duc",
        search_all_external_files=True,
    )
    assert payload["results"], "Expected at least one search result"
    pdf_results = [result for result in payload["results"] if result["element_type"] == "pdf"]
    assert pdf_results
    for result in pdf_results:
        mp = result.get("match_pages")
        assert mp is not None, "PDF results must have match_pages"
        assert len(mp) == len(result["matches"]), "match_pages must be parallel to matches"
    assert all("[Page" not in match for result in pdf_results for match in result["matches"])
