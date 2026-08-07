"""Tests for the DUC model-element search module (``search_models`` / ``search_ezdxf``).

Covers three layers:

* **engine detection** — classifying a model element as ezdxf / ifc / build123d /
  unsupported from its ``model_type`` or (for Python models) its imports;
* **ezdxf text extraction** — pulling user-authored text out of a DXF, both from a
  linked external file and from Python code that builds the drawing;
* **ranked search** — ``search_duc_models`` scoring that text against a query.

The asset-backed tests use ``assets/testing/duc-files/universal.duc``, which holds
10 model elements spanning every engine (incl. a python/ezdxf model that *generates*
the text "EMPIRE STATE BUILDING ...", a dxf-file model with "...Wipeout..." notes,
and two dwg models that need conversion).
"""

from __future__ import annotations

import json
import ssl
import urllib.error
from pathlib import Path

import ezdxf
import pytest
from ezdxf.math import Vec2
from ezdxf.render import mleader

from ducpy.builders.sql_builder import DucSQL
from ducpy.parse import list_external_files, parse_duc
from ducpy.search import (
    DWGDXF_WASM_PATH_ENV,
    DWGDXF_WASM_URL,
    DwgConversionNotAvailable,
    ModelEngine,
    convert_dwg_to_dxf,
    detect_model_engine,
    extract_model_dxf_text,
    search_duc_models,
)
import ducpy.search.search_ezdxf as search_ezdxf_module
from ducpy.search.search_ezdxf import extract_dxf_text, extract_drawing_text
from ducpy.search.search_models import (
    extract_python_imports,
    model_element_info,
    resolve_model_search_targets,
)

ASSET = "universal.duc"


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _asset_input_path(filename: str) -> Path:
    return Path(__file__).resolve().parents[5] / "assets" / "testing" / "duc-files" / filename


def _model_by_label(parsed_asset: dict, label: str) -> dict:
    for element in parsed_asset.get("elements", []) or []:
        if element.get("type") == "model" and not element.get("is_deleted") and element.get("label") == label:
            return element
    raise AssertionError(f"No model element labelled {label!r} in asset")


def _run_model_search(query, *, test_output_dir, test_name, limit=50, run_code=False):
    asset_path = _asset_input_path(ASSET)
    assert asset_path.exists(), f"Missing asset file: {asset_path}"

    output_dir = Path(test_output_dir) / "search_results" / "model_elements"

    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"{test_name}.json"
    if json_path.exists():
        json_path.unlink()

    response = search_duc_models(asset_path, query, output_path=json_path, limit=limit, run_code=run_code)
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    return payload, response, json_path


def _build_sample_dxf_bytes(tmp_path: Path) -> bytes:
    """A DXF carrying one of every kind of user text we claim to extract."""
    doc = ezdxf.new(setup=True)
    msp = doc.modelspace()
    doc.layers.add("Notes")
    msp.add_text("Hello Drawing Text", dxfattribs={"layer": "Notes"})
    msp.add_mtext("Multiline\\PRoom Schedule")
    block = doc.blocks.new(name="TITLEBLOCK")
    block.add_attdef(tag="TITLE", insert=(0, 0), text="Default Title")
    ref = msp.add_blockref("TITLEBLOCK", (0, 0))
    ref.add_attrib(tag="TITLE", text="Project Alpha", insert=(0, 0))
    dim = msp.add_linear_dim(base=(0, 5), p1=(0, 0), p2=(10, 0), text="Custom Dim Text")
    dim.render()
    link = msp.add_text("Link Text")
    link.set_hyperlink("https://example.com", description="Example Site")
    doc.header.custom_vars.append("Author", "Jane Doe")
    doc.layout("Layout1").add_text("Sheet Note A1")

    leader = msp.add_multileader_mtext("Standard")
    leader.set_content("Leader\nNote")
    leader.add_leader_line(mleader.ConnectionSide.left, [Vec2(0, 0)])
    leader.build(insert=Vec2(1, 1))

    path = tmp_path / "sample.dxf"
    doc.saveas(path)
    return path.read_bytes()


def _build_sqlite_dxf_model(tmp_path: Path, dxf_bytes: bytes) -> tuple[Path, dict]:
    path = tmp_path / "sqlite-model.duc"
    element_id = "sqlite-model"
    file_id = "sqlite-dxf"
    revision_id = "sqlite-dxf-r1"

    with DucSQL.new(path) as db:
        db.conn.execute(
            "INSERT INTO elements (id, element_type, label) VALUES (?, ?, ?)",
            (element_id, "model", "SQLite DXF model"),
        )
        db.conn.execute(
            "INSERT INTO element_model (element_id, model_type) VALUES (?, ?)",
            (element_id, "dxf"),
        )
        db.conn.execute(
            "INSERT INTO external_files (id, active_revision_id, updated, version) "
            "VALUES (?, ?, ?, ?)",
            (file_id, revision_id, 1, 1),
        )
        db.conn.execute(
            "INSERT INTO external_file_revisions "
            "(id, file_id, size_bytes, mime_type, created) VALUES (?, ?, ?, ?, ?)",
            (revision_id, file_id, len(dxf_bytes), "application/dxf", 1),
        )
        db.conn.execute(
            "INSERT INTO external_file_revision_chunks "
            "(revision_id, chunk_index, offset_bytes, size_bytes, data) VALUES (?, ?, ?, ?, ?)",
            (revision_id, 0, 0, len(dxf_bytes), dxf_bytes),
        )
        db.conn.execute(
            "INSERT INTO model_element_files (element_id, file_id, sort_order) "
            "VALUES (?, ?, ?)",
            (element_id, file_id, 0),
        )

    element = {
        "id": element_id,
        "type": "model",
        "label": "SQLite DXF model",
        "model_type": "dxf",
        "file_ids": [file_id],
    }
    return path, element


# --------------------------------------------------------------------------- #
# Engine detection — synthetic, fast
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "code, expected",
    [
        ("import ezdxf\ndoc = ezdxf.readfile(p)", ModelEngine.EZDXF),
        ("import ifcopenshell\nm = ifcopenshell.open(p)", ModelEngine.IFC),
        ("from build123d import Box\nb = Box(1, 1, 1)", ModelEngine.BUILD123D),
        ("from build123d import import_step\npart = import_step(p)", ModelEngine.BUILD123D),
        ("import numpy as np\nprint(np)", ModelEngine.UNSUPPORTED),
        ("", ModelEngine.UNSUPPORTED),
    ],
)
def test_detect_engine_from_python_imports(code, expected):
    element = {"type": "model", "model_type": "python", "code": code}
    assert detect_model_engine(element) is expected


@pytest.mark.parametrize(
    "model_type, expected",
    [
        ("dxf", ModelEngine.EZDXF),
        ("dwg", ModelEngine.EZDXF),
        ("ifc", ModelEngine.IFC),
        ("step", ModelEngine.BUILD123D),
        ("stl", ModelEngine.BUILD123D),
        ("STEP", ModelEngine.BUILD123D),  # normalised to lower-case
        ("obj", ModelEngine.UNSUPPORTED),
    ],
)
def test_detect_engine_from_file_model_type(model_type, expected):
    element = {"type": "model", "model_type": model_type, "file_ids": ["f1"]}
    assert detect_model_engine(element) is expected


def test_detect_engine_broken_python_uses_regex_fallback():
    # Code that does not parse must still be classified via the regex fallback.
    element = {"type": "model", "model_type": "python", "code": "import ezdxf\ndef oops(:\n    pass"}
    assert detect_model_engine(element) is ModelEngine.EZDXF


def test_extract_python_imports_top_level_modules():
    code = "import ezdxf\nimport os.path as p\nfrom build123d import *\nfrom . import sibling"
    assert extract_python_imports(code) == {"ezdxf", "os", "build123d"}


# --------------------------------------------------------------------------- #
# Engine detection — against the universal.duc asset
# --------------------------------------------------------------------------- #
def test_universal_model_engine_classification():
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    targets = resolve_model_search_targets(parsed)
    engines_by_label = {target.label: target.engine for target in targets}

    expected = {
        "Model 1 (5)": ModelEngine.IFC,        # python + ifcopenshell
        "Model 8": ModelEngine.IFC,            # ifc file
        "Model 4 (1)": ModelEngine.BUILD123D,  # python + build123d
        "Model 24 (4)": ModelEngine.BUILD123D,
        "Scopture Model": ModelEngine.BUILD123D,
        "Model 10": ModelEngine.BUILD123D,     # step file
        "Model 7 (3)": ModelEngine.EZDXF,      # python + ezdxf
        "Model 7": ModelEngine.EZDXF,          # dxf file
        "Model 11": ModelEngine.EZDXF,         # dwg file
        "Model 12": ModelEngine.EZDXF,         # dwg file
    }
    for label, engine in expected.items():
        assert engines_by_label.get(label) is engine, f"{label} -> {engines_by_label.get(label)}"

    # Nothing in this asset should be unclassifiable.
    assert all(target.engine is not ModelEngine.UNSUPPORTED for target in targets)


# --------------------------------------------------------------------------- #
# ezdxf extraction — synthetic, fast
# --------------------------------------------------------------------------- #
def test_extract_dxf_text_covers_every_kind(tmp_path):
    dxf_bytes = _build_sample_dxf_bytes(tmp_path)
    result = extract_dxf_text(dxf_bytes)
    blob = result.text

    for needle in (
        "Hello Drawing Text",   # TEXT
        "Room Schedule",        # MTEXT (formatting codes stripped)
        "Project Alpha",        # ATTRIB
        "TITLE",                # ATTDEF tag
        "Custom Dim Text",      # DIMENSION override
        "Notes",                # layer name
        "TITLEBLOCK",           # block name
        "Sheet Note A1",        # paperspace TEXT
        "example.com",          # hyperlink
        "Jane Doe",             # custom drawing property
        "Leader Note",          # MULTILEADER MTEXT, formatting stripped
    ):
        assert needle in blob, f"missing extracted text: {needle!r}"

    kinds = {item.kind for item in result.items}
    assert {
        "text",
        "mtext",
        "attrib",
        "dimension",
        "mleader",
        "layer",
        "block",
        "layout",
    } <= kinds


def test_extract_drawing_text_accepts_live_drawing():
    doc = ezdxf.new()
    doc.modelspace().add_text("Captured Note")
    texts = [item.text for item in extract_drawing_text(doc).items if item.kind == "text"]
    assert "Captured Note" in texts


def test_extract_dxf_text_handles_empty_and_garbage_bytes():
    assert extract_dxf_text(b"").items == ()
    assert extract_dxf_text(b"not a dxf at all").items == ()


def test_extract_dxf_text_gracefully_handles_dwg_conversion_failure(monkeypatch):
    def fail_conversion(_data):
        raise DwgConversionNotAvailable("offline")

    monkeypatch.setattr(search_ezdxf_module, "convert_dwg_to_dxf", fail_conversion)
    assert extract_dxf_text(b"AC1027-invalid-dwg").items == ()


def test_acad_table_uses_ezdxf_content_reader(monkeypatch):
    from ezdxf.entities import acad_table

    class FakeTable:
        def dxftype(self):
            return "ACAD_TABLE"

    monkeypatch.setattr(
        acad_table,
        "read_acad_table_content",
        lambda _entity: [["Header", "Cell value"], ["", "Second row"]],
    )
    items = list(search_ezdxf_module._iter_table_text(FakeTable(), "Model", "0"))
    assert [item.text for item in items] == ["Header", "Cell value", "Second row"]
    assert all(item.kind == "table" for item in items)


def test_python_code_execution_is_opt_in_by_default(monkeypatch):
    def unexpected_execution(*_args, **_kwargs):
        pytest.fail("embedded model code should not execute by default")

    monkeypatch.setattr(
        search_ezdxf_module,
        "_run_and_capture_drawings",
        unexpected_execution,
    )
    element = {
        "type": "model",
        "model_type": "python",
        "code": "import ezdxf\ndoc = ezdxf.new()",
        "file_ids": [],
    }
    assert extract_model_dxf_text("unused.duc", element).items == ()


def test_dwg_converter_uses_pinned_wasm_url():
    assert DWGDXF_WASM_URL == (
        "https://cdn.jsdelivr.net/npm/dwgdxf@2.0.1/dist/wasm/dwgdxf_bg.wasm"
    )


def test_convert_dwg_to_dxf_rejects_untrusted_wasm(tmp_path):
    wasm_path = tmp_path / "untrusted.wasm"
    wasm_path.write_bytes(b"\0asm" + b"not-the-pinned-module")

    with pytest.raises(DwgConversionNotAvailable, match="integrity"):
        convert_dwg_to_dxf(b"AC1027........", wasm_path=wasm_path)


def test_convert_dwg_to_dxf_rejects_empty_input():
    with pytest.raises(ValueError, match="must not be empty"):
        convert_dwg_to_dxf(b"")


def test_wasm_path_environment_variable_is_honored(tmp_path, monkeypatch):
    wasm_path = tmp_path / "offline.wasm"
    wasm_path.write_bytes(b"\0asm" + b"not-the-pinned-module")
    monkeypatch.setenv(DWGDXF_WASM_PATH_ENV, str(wasm_path))

    with pytest.raises(DwgConversionNotAvailable, match="integrity"):
        convert_dwg_to_dxf(b"AC1027-env-path")


def test_wasm_download_retries_with_certifi_after_certificate_failure(monkeypatch):
    calls = []

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return b"wasm"

    def urlopen(_url, *, context, timeout):
        calls.append((context, timeout))
        if len(calls) == 1:
            raise urllib.error.URLError(ssl.SSLCertVerificationError("certificate verify failed"))
        return Response()

    monkeypatch.setattr(search_ezdxf_module.urllib.request, "urlopen", urlopen)

    assert search_ezdxf_module._download_wasm("https://example.test/dwgdxf.wasm", timeout_seconds=3) == b"wasm"
    assert len(calls) == 2
    assert all(isinstance(context, ssl.SSLContext) for context, _timeout in calls)


def _require_dwg_converter() -> None:
    try:
        search_ezdxf_module._resolve_wasm_path(
            None,
            wasm_url=DWGDXF_WASM_URL,
            timeout_seconds=30.0,
        )
    except DwgConversionNotAvailable as exc:
        pytest.skip(f"DWG converter is unavailable: {exc}")


# --------------------------------------------------------------------------- #
# ezdxf extraction — against the universal.duc asset
# --------------------------------------------------------------------------- #
def test_sqlite_backed_dxf_model_searches_active_revision(tmp_path):
    dxf_bytes = _build_sample_dxf_bytes(tmp_path)
    duc_path, element = _build_sqlite_dxf_model(tmp_path, dxf_bytes)

    file_meta = list_external_files(duc_path)
    assert file_meta[0].active_revision_id == "sqlite-dxf-r1"

    extracted = extract_model_dxf_text(duc_path, element, run_code=False)
    assert "Hello Drawing Text" in extracted.text

    response = search_duc_models(
        duc_path,
        "Hello Drawing Text",
        output_path=tmp_path / "sqlite-search.json",
    )
    assert response.total_hits == 1
    assert response.results[0].element_id == element["id"]


def test_python_model_supports_legacy_external_files_mapping(tmp_path, monkeypatch):
    dxf_bytes = _build_sample_dxf_bytes(tmp_path)
    def stream_fixture(_source, _file_id, output_path):
        Path(output_path).write_bytes(dxf_bytes)
        return len(dxf_bytes)

    monkeypatch.setattr(search_ezdxf_module, "stream_active_external_file_to_path", stream_fixture)
    element = {
        "type": "model",
        "model_type": "python",
        "file_ids": ["legacy-dxf"],
        "code": (
            "import ezdxf\n"
            "path = external_files['legacy-dxf']['path']\n"
            "doc = ezdxf.readfile(path)\n"
            "doc.modelspace().add_text('Generated through external_files')\n"
        ),
    }

    result = extract_model_dxf_text("unused.duc", element, run_code=True)
    assert "Generated through external_files" in result.text


def test_extract_text_from_external_dxf_model():
    """The dxf-file model ("Model 7") yields its MTEXT notes — no code executed."""
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    element = _model_by_label(parsed, "Model 7")
    assert (element.get("model_type") or "").lower() == "dxf"

    result = extract_model_dxf_text(_asset_input_path(ASSET), element, run_code=False)
    assert result.items, "expected text from the external DXF"
    assert any("Wipeout" in item.text for item in result.items)


@pytest.mark.slow
def test_extract_text_from_python_ezdxf_model_runs_code():
    """The python/ezdxf model ("Model 7 (3)") generates its text in code."""
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    element = _model_by_label(parsed, "Model 7 (3)")
    assert (element.get("model_type") or "").lower() == "python"

    result = extract_model_dxf_text(_asset_input_path(ASSET), element, run_code=True)
    assert any("EMPIRE STATE BUILDING" in item.text for item in result.items)


@pytest.mark.slow
def test_extract_text_from_dwg_model_via_wasm():
    """The pinned WASM converts Model 11's DWG before ezdxf extracts its text."""
    _require_dwg_converter()
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    element = _model_by_label(parsed, "Model 11")
    assert model_element_info(element).engine is ModelEngine.EZDXF
    assert (element.get("model_type") or "").lower() == "dwg"

    result = extract_model_dxf_text(_asset_input_path(ASSET), element, run_code=False)
    assert len(result.items) > 100
    assert any("ELECTRICAL LEGEND" in item.text for item in result.items)


# --------------------------------------------------------------------------- #
# Ranked search — search_duc_models against the asset
# --------------------------------------------------------------------------- #
def test_search_finds_external_dxf_content(test_output_dir, request):
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    expected_id = _model_by_label(parsed, "Model 7")["id"]

    payload, response, json_path = _run_model_search(
        "Wipeout", test_output_dir=test_output_dir, test_name=request.node.name, run_code=False
    )
    assert payload["query"] == "Wipeout"
    assert payload["total_hits"] >= 1
    assert payload["results"][0]["element_id"] == expected_id
    assert payload["results"][0]["element_type"] == "model"
    assert any("wipeout" in match.lower() for match in payload["results"][0]["matches"])
    assert response.output_path == str(json_path)


@pytest.mark.slow
def test_search_finds_python_generated_content(test_output_dir, request):
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    expected_ids = {
        _model_by_label(parsed, "Model 7 (3)")["id"],  # Python-generated DXF
        _model_by_label(parsed, "Model 1 (5)")["id"],  # Python-generated IFC
    }

    payload, _response, _json_path = _run_model_search(
        "EMPIRE STATE BUILDING", test_output_dir=test_output_dir, test_name=request.node.name, run_code=True
    )
    result_ids = [result["element_id"] for result in payload["results"]]
    assert payload["total_hits"] >= 2
    assert expected_ids <= set(result_ids)
    assert result_ids[0] in expected_ids
    assert any("empire state building" in match.lower() for match in payload["results"][0]["matches"])


@pytest.mark.slow
def test_search_finds_dwg_content_after_wasm_conversion(test_output_dir, request):
    _require_dwg_converter()
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    expected_id = _model_by_label(parsed, "Model 11")["id"]

    payload, _response, _json_path = _run_model_search(
        "ELECTRICAL LEGEND",
        test_output_dir=test_output_dir,
        test_name=request.node.name,
        run_code=False,
    )
    assert payload["total_hits"] >= 1
    assert payload["results"][0]["element_id"] == expected_id
    assert any("electrical legend" in match.lower() for match in payload["results"][0]["matches"])


def test_search_ignores_python_syntax(test_output_dir, request):
    # "ifcopenshell" only appears in embedded Python source, never in extracted
    # content or labels — so model search must not surface it.
    payload, _response, _json_path = _run_model_search(
        "ifcopenshell", test_output_dir=test_output_dir, test_name=request.node.name, run_code=False
    )
    assert payload["total_hits"] == 0
    assert payload["results"] == []


def test_search_matches_model_label(test_output_dir, request):
    parsed = parse_duc(str(_asset_input_path(ASSET)))
    expected_id = _model_by_label(parsed, "Scopture Model")["id"]

    payload, _response, _json_path = _run_model_search(
        "Scopture Model", test_output_dir=test_output_dir, test_name=request.node.name, run_code=False
    )
    assert payload["total_hits"] >= 1
    assert payload["results"][0]["element_id"] == expected_id


def test_search_gibberish_returns_empty(test_output_dir, request):
    payload, _response, json_path = _run_model_search(
        "zzznotarealtokenzzz", test_output_dir=test_output_dir, test_name=request.node.name, run_code=False
    )
    assert payload["total_hits"] == 0
    assert payload["all_element_ids"] == []
    assert payload["results"] == []
    assert json.loads(json_path.read_text(encoding="utf-8")) == payload


def test_search_empty_query_raises_value_error():
    with pytest.raises(ValueError, match="at least one searchable token"):
        search_duc_models(_asset_input_path(ASSET), "", run_code=False)


def test_search_respects_limit(test_output_dir, request):
    payload, _response, _json_path = _run_model_search(
        "Model", test_output_dir=test_output_dir, test_name=request.node.name, limit=2, run_code=False
    )
    assert payload["total_hits"] >= 2
    assert len(payload["results"]) == 2
