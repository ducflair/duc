"""Tests for semantic build123d/STEP/STL model search."""

from __future__ import annotations

import struct
from pathlib import Path

from build123d import Box, Compound, RigidJoint, Shape, export_step

from ducpy.builders.sql_builder import DucSQL
from ducpy.parse import parse_duc
from ducpy.search import (
    extract_build123d_path_text,
    extract_build123d_shape_text,
    extract_model_build123d_text,
    search_duc_models,
)

ASSET = "universal.duc"


def _asset_input_path(filename: str) -> Path:
    return Path(__file__).resolve().parents[5] / "assets" / "testing" / "duc-files" / filename


def _model_by_label(parsed_asset: dict, label: str) -> dict:
    for element in parsed_asset.get("elements", []) or []:
        if (
            element.get("type") == "model"
            and not element.get("is_deleted")
            and element.get("label") == label
        ):
            return element
    raise AssertionError(f"No model element labelled {label!r} in asset")


def _build_step_bytes(tmp_path: Path) -> bytes:
    housing = Box(10, 8, 4)
    housing.label = "Search Gear Housing"
    assembly = Compound(
        children=[housing],
        label="Search Gear Assembly",
        material="Anodized Aluminum",
    )
    RigidJoint("drive shaft mount", assembly)
    path = tmp_path / "search-assembly.step"
    assert export_step(assembly, path)

    # A raw comment is deliberately present to prove the extractor reads only
    # approved semantic entities rather than STEP source text.
    contents = path.read_text(encoding="latin-1")
    path.write_text(
        contents.replace("DATA;", "/* Raw Step Secret Must Stay Hidden */\nDATA;", 1),
        encoding="latin-1",
    )
    return path.read_bytes()


def _ascii_stl(name: str) -> bytes:
    return (
        f"solid {name}\n"
        "facet normal 0 0 1\n"
        " outer loop\n"
        "  vertex 0 0 0\n"
        "  vertex 1 0 0\n"
        "  vertex 0 1 0\n"
        " endloop\n"
        "endfacet\n"
        f"endsolid {name}\n"
    ).encode("ascii")


def _binary_stl_with_text_header(header_text: str) -> bytes:
    header = header_text.encode("ascii").ljust(80, b" ")[:80]
    triangle = struct.pack(
        "<12fH",
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0,
        0,
    )
    return header + struct.pack("<I", 1) + triangle


def _build_sqlite_step_model(tmp_path: Path, step_bytes: bytes) -> tuple[Path, dict]:
    path = tmp_path / "sqlite-step-model.duc"
    element_id = "sqlite-step-model"
    file_id = "sqlite-step"
    revision_id = "sqlite-step-r1"

    with DucSQL.new(path) as db:
        db.conn.execute(
            "INSERT INTO elements (id, element_type, label) VALUES (?, ?, ?)",
            (element_id, "model", "SQLite STEP model"),
        )
        db.conn.execute(
            "INSERT INTO element_model (element_id, model_type) VALUES (?, ?)",
            (element_id, "step"),
        )
        db.conn.execute(
            "INSERT INTO external_files (id, active_revision_id, updated, version) "
            "VALUES (?, ?, ?, ?)",
            (file_id, revision_id, 1, 1),
        )
        db.conn.execute(
            "INSERT INTO external_file_revisions "
            "(id, file_id, size_bytes, mime_type, created) VALUES (?, ?, ?, ?, ?)",
            (revision_id, file_id, len(step_bytes), "application/step", 1),
        )
        db.conn.execute(
            "INSERT INTO external_file_revision_chunks "
            "(revision_id, chunk_index, offset_bytes, size_bytes, data) VALUES (?, ?, ?, ?, ?)",
            (revision_id, 0, 0, len(step_bytes), step_bytes),
        )
        db.conn.execute(
            "INSERT INTO model_element_files (element_id, file_id, sort_order) "
            "VALUES (?, ?, ?)",
            (element_id, file_id, 0),
        )

    element = {
        "id": element_id,
        "type": "model",
        "label": "SQLite STEP model",
        "model_type": "step",
        "file_ids": [file_id],
    }
    return path, element


def test_extract_shape_text_covers_labels_material_joints_and_viewer_names():
    child = Box(2, 3, 4)
    child.label = "Bearing Carrier"
    root = Compound(
        children=[child],
        label="Pump Assembly",
        material="Stainless Steel",
    )
    RigidJoint("inlet flange", root)

    result = extract_build123d_shape_text(
        [root, root], viewer_names=["Rendered Pump", "Rendered Pump"]
    )

    assert "Pump Assembly" in result.texts_by_kind("label")
    assert "Bearing Carrier" in result.texts_by_kind("label")
    assert result.texts_by_kind("material") == ["Stainless Steel"]
    assert result.texts_by_kind("joint") == ["inlet flange"]
    assert result.texts_by_kind("viewer_name") == ["Rendered Pump"]


def test_step_search_uses_model_metadata_not_raw_source(tmp_path):
    step_bytes = _build_step_bytes(tmp_path)
    path = tmp_path / "semantic.step"
    path.write_bytes(step_bytes)

    result = extract_build123d_path_text(path, "step")

    assert "Search Gear Assembly" in result.text
    assert "Search Gear Housing" in result.text
    assert "Raw Step Secret Must Stay Hidden" not in result.text
    assert "ISO-10303-21" not in result.text


def test_stl_search_accepts_ascii_name_but_never_binary_header(tmp_path):
    ascii_path = tmp_path / "ascii.stl"
    ascii_path.write_bytes(_ascii_stl("Search Rotor"))
    assert extract_build123d_path_text(ascii_path, "stl").text == "Search Rotor"

    binary_path = tmp_path / "binary.stl"
    binary_path.write_bytes(_binary_stl_with_text_header("solid Binary Header Secret"))
    assert extract_build123d_path_text(binary_path, "stl").items == ()

    invalid_path = tmp_path / "invalid.stl"
    invalid_path.write_text("solid Source Only Secret\nendsolid Source Only Secret\n")
    assert extract_build123d_path_text(invalid_path, "stl").items == ()


def test_python_execution_is_opt_in_captures_function_local_and_restores_patches():
    code = (
        "from build123d import *\n"
        "from ocp_vscode import show\n"
        "def make_model():\n"
        "    gear = Box(1, 1, 1)\n"
        "    gear.label = 'Function Local Gear'\n"
        "    model = Compound(\n"
        "        children=[gear], label='Gearbox Assembly', material='Bronze'\n"
        "    )\n"
        "    RigidJoint('shaft mount', model)\n"
        "    show(model, names=['Rendered Gearbox'])\n"
        "make_model()\n"
        "source_only_secret = 'Never Materialized Source Secret'\n"
        "print('Never Search Stdout Secret')\n"
        "raise RuntimeError('Never Search Exception Secret')\n"
    )
    element = {"model_type": "python", "code": code, "file_ids": []}
    original_shape_init = Shape.__init__

    assert extract_model_build123d_text("unused.duc", element).items == ()

    result = extract_model_build123d_text("unused.duc", element, run_code=True)
    assert "Function Local Gear" in result.text
    assert "Gearbox Assembly" in result.text
    assert "Bronze" in result.text
    assert "shaft mount" in result.text
    assert "Rendered Gearbox" in result.text
    assert "Never Materialized Source Secret" not in result.text
    assert "Never Search Stdout Secret" not in result.text
    assert "Never Search Exception Secret" not in result.text
    assert Shape.__init__ is original_shape_init


def test_sqlite_step_model_is_ranked_by_imported_label(tmp_path):
    step_bytes = _build_step_bytes(tmp_path)
    duc_path, element = _build_sqlite_step_model(tmp_path, step_bytes)

    extracted = extract_model_build123d_text(duc_path, element)
    assert "Search Gear Housing" in extracted.text

    response = search_duc_models(
        duc_path,
        "Search Gear Housing",
        output_path=tmp_path / "step-search.json",
    )
    assert response.total_hits == 1
    assert response.results[0].element_id == element["id"]


def test_universal_step_model_extracts_and_searches_real_product_metadata(tmp_path):
    asset_path = _asset_input_path(ASSET)
    parsed = parse_duc(str(asset_path))
    element = _model_by_label(parsed, "Model 10")

    extracted = extract_model_build123d_text(asset_path, element)
    assert "Test Part" in extracted.text

    response = search_duc_models(
        asset_path,
        "Test Part",
        output_path=tmp_path / "universal-step-search.json",
    )
    assert element["id"] in response.all_element_ids


def test_universal_python_build123d_model_captures_viewer_name():
    asset_path = _asset_input_path(ASSET)
    parsed = parse_duc(str(asset_path))
    element = _model_by_label(parsed, "Scopture Model")

    result = extract_model_build123d_text(asset_path, element, run_code=True)
    assert "Scopture Model" in result.texts_by_kind("viewer_name")
