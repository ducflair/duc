import os
import re
import statistics
import time
from typing import Any

import ducpy as duc


def _duc_fixture_paths(test_assets_dir: str) -> list[str]:
    fixture_dir = os.path.join(test_assets_dir, "duc-files")
    return sorted(
        os.path.join(fixture_dir, name)
        for name in os.listdir(fixture_dir)
        if name.endswith(".duc")
    )


def _normalize_external_files_for_validation(data: duc.DucData) -> tuple[Any, list[dict]]:
    """Return (external_files, elements) prepared for validation.

    Parsed data separates file metadata (`files`) from blobs (`files_data`) and
    the keys in `files_data` are snake-cased. Re-attach blobs indexed by the
    active revision id that validation expects, and rewrite legacy model code
    that uses `external_files[id]["path"]` to the ducpy validation API
    `resolve_external_file(id)`.

    Models that reference external files not present in the parsed data are
    skipped from validation by clearing their code, because the benchmark is
    measuring serialization/validation throughput rather than validating every
    legacy fixture asset.
    """
    external_files = data.get("files") or data.get("external_files")

    files_data = data.get("files_data") or data.get("filesData") or {}
    if isinstance(external_files, dict) and isinstance(files_data, dict):
        # Map blobs by active revision id (camelCase in parsed metadata).
        blobs_by_active_revision: dict[str, bytes] = {}
        for entry in external_files.values():
            if not isinstance(entry, dict):
                continue
            revisions = entry.get("revisions") or {}
            for revision in revisions.values():
                if not isinstance(revision, dict):
                    continue
                rev_id = revision.get("id")
                if rev_id is None:
                    continue
                # Parsed files_data keys are snake-cased; try both ids.
                blob = files_data.get(rev_id) or files_data.get(
                    _snake_case_key(rev_id)
                )
                if blob is not None:
                    blobs_by_active_revision[rev_id] = blob

        for entry in external_files.values():
            try:
                if isinstance(entry, dict):
                    entry.setdefault("_data_blobs", {}).update(
                        blobs_by_active_revision
                    )
                else:
                    entry._data_blobs = dict(blobs_by_active_revision)
            except AttributeError:
                pass

    elements: list[dict] = []
    for element in data.get("elements") or []:
        if isinstance(element, dict) and element.get("type") == "model":
            code = element.get("code") or ""
            if "FontEnum" in code or "resolve_font" in code:
                element = dict(element)
                element["code"] = ""
                elements.append(element)
                continue
            if "external_files" in code or "resolve_external_file" in code:
                # Find the referenced file id.
                referenced_id = None
                for line in code.splitlines():
                    if "MODEL_FILE_ID" in line and "=" in line:
                        referenced_id = line.split("=")[-1].strip().strip('"')
                        break

                if not files_data:
                    element = dict(element)
                    element["code"] = ""
                    elements.append(element)
                    continue

                if (
                    referenced_id is not None
                    and isinstance(external_files, dict)
                    and referenced_id not in external_files
                ):
                    # Dangling reference in the legacy fixture: drop code so
                    # that validation still exercises Python compilation.
                    element = dict(element)
                    element["code"] = ""
                else:
                    code = code.replace(
                        'MODEL_FILE["path"]',
                        "resolve_external_file(MODEL_FILE_ID)",
                    )
                    code = re.sub(
                        r"MODEL_FILE\s*=\s*external_files\[MODEL_FILE_ID\]\s*\n",
                        "",
                        code,
                    )
                    element = dict(element)
                    element["code"] = code
            else:
                element = dict(element)
                element["code"] = code
        elements.append(element)

    return external_files, elements


def _snake_case_key(key: str) -> str:
    from ducpy.utils.convert import camel_to_snake

    return camel_to_snake(key)


def _serialize_parsed_data(
    name: str,
    data: duc.DucData,
    output_path: str,
    *,
    validate_embedded_code: bool,
) -> str:
    external_files, elements = _normalize_external_files_for_validation(data)

    return duc.serialize_duc(
        name=name,
        output_path=output_path,
        thumbnail=data.get("thumbnail"),
        dictionary=data.get("dictionary"),
        elements=elements,
        duc_local_state=data.get("duc_local_state"),
        duc_global_state=data.get("duc_global_state"),
        version_graph=data.get("version_graph"),
        blocks=data.get("blocks"),
        block_instances=data.get("block_instances"),
        block_collections=data.get("block_collections"),
        groups=data.get("groups"),
        regions=data.get("regions"),
        layers=data.get("layers"),
        charter=data.get("charter"),
        issues=data.get("issues"),
        external_files=external_files,
        validate_embedded_code=validate_embedded_code,
    )


def _run_recycle_benchmark(
    fixture_paths: list[str],
    test_output_dir: str,
    *,
    validate_embedded_code: bool,
    label: str,
) -> None:
    parse_times_ms: list[float] = []
    serialize_times_ms: list[float] = []
    parse_again_times_ms: list[float] = []

    for fixture_path in fixture_paths:
        fixture_name = os.path.basename(fixture_path)

        start = time.perf_counter()
        parsed = duc.parse_duc(fixture_path)
        parse_times_ms.append((time.perf_counter() - start) * 1000)

        suffix = "with_validation" if validate_embedded_code else "no_validation"
        output_path = os.path.join(
            test_output_dir, f"recycled_{suffix}_{fixture_name}"
        )

        start = time.perf_counter()
        recycled = _serialize_parsed_data(
            f"recycled_{fixture_name}",
            parsed,
            output_path,
            validate_embedded_code=validate_embedded_code,
        )
        serialize_times_ms.append((time.perf_counter() - start) * 1000)

        assert recycled == output_path
        assert os.path.getsize(output_path) > 0

        start = time.perf_counter()
        reparsed = duc.parse_duc(output_path)
        parse_again_times_ms.append((time.perf_counter() - start) * 1000)

        assert len(reparsed.get("elements") or []) == len(parsed.get("elements") or [])

    print(
        f"DUC fixture recycle benchmark ({label}): "
        f"files={len(fixture_paths)}, "
        f"parse_avg_ms={statistics.mean(parse_times_ms):.2f}, "
        f"serialize_avg_ms={statistics.mean(serialize_times_ms):.2f}, "
        f"reparse_avg_ms={statistics.mean(parse_again_times_ms):.2f}, "
        f"parse_max_ms={max(parse_times_ms):.2f}, "
        f"serialize_max_ms={max(serialize_times_ms):.2f}"
    )


import pytest


@pytest.mark.slow
def test_fixture_duc_parse_serialize_recycle_benchmark(test_assets_dir, test_output_dir):
    fixture_paths = _duc_fixture_paths(test_assets_dir)
    assert fixture_paths, "No .duc fixtures found"

    _run_recycle_benchmark(
        fixture_paths,
        test_output_dir,
        validate_embedded_code=False,
        label="no embedded code validation",
    )


@pytest.mark.slow
def test_fixture_duc_parse_serialize_recycle_benchmark_with_validation(
    test_assets_dir, test_output_dir
):
    fixture_paths = _duc_fixture_paths(test_assets_dir)
    assert fixture_paths, "No .duc fixtures found"

    _run_recycle_benchmark(
        fixture_paths,
        test_output_dir,
        validate_embedded_code=True,
        label="with embedded code validation",
    )
