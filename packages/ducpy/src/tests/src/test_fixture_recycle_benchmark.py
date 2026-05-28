import os
import statistics
import time

import ducpy as duc


def _duc_fixture_paths(test_assets_dir: str) -> list[str]:
    fixture_dir = os.path.join(test_assets_dir, "duc-files")
    return sorted(
        os.path.join(fixture_dir, name)
        for name in os.listdir(fixture_dir)
        if name.endswith(".duc")
    )


def _serialize_parsed_data(name: str, data: duc.DucData) -> bytes:
    return duc.serialize_duc(
        name=name,
        thumbnail=data.get("thumbnail"),
        dictionary=data.get("dictionary"),
        elements=data.get("elements"),
        duc_local_state=data.get("local_state"),
        duc_global_state=data.get("global_state"),
        version_graph=data.get("version_graph"),
        blocks=data.get("blocks"),
        block_instances=data.get("block_instances"),
        block_collections=data.get("block_collections"),
        groups=data.get("groups"),
        regions=data.get("regions"),
        layers=data.get("layers"),
        external_files=data.get("external_files"),
        validate_embedded_code=False,
    )


def test_fixture_duc_parse_serialize_recycle_benchmark(test_assets_dir, test_output_dir):
    fixture_paths = _duc_fixture_paths(test_assets_dir)
    assert fixture_paths, "No .duc fixtures found"

    parse_times_ms: list[float] = []
    serialize_times_ms: list[float] = []
    parse_again_times_ms: list[float] = []

    for fixture_path in fixture_paths:
        fixture_name = os.path.basename(fixture_path)

        start = time.perf_counter()
        parsed = duc.parse_duc(fixture_path)
        parse_times_ms.append((time.perf_counter() - start) * 1000)

        start = time.perf_counter()
        recycled = _serialize_parsed_data(f"recycled_{fixture_name}", parsed)
        serialize_times_ms.append((time.perf_counter() - start) * 1000)

        assert recycled
        assert len(recycled) > 0

        output_path = os.path.join(test_output_dir, f"recycled_{fixture_name}")
        with open(output_path, "wb") as output_file:
            output_file.write(recycled)

        start = time.perf_counter()
        reparsed = duc.parse_duc(recycled)
        parse_again_times_ms.append((time.perf_counter() - start) * 1000)

        assert len(reparsed.get("elements") or []) == len(parsed.get("elements") or [])

    print(
        "DUC fixture recycle benchmark: "
        f"files={len(fixture_paths)}, "
        f"parse_avg_ms={statistics.mean(parse_times_ms):.2f}, "
        f"serialize_avg_ms={statistics.mean(serialize_times_ms):.2f}, "
        f"reparse_avg_ms={statistics.mean(parse_again_times_ms):.2f}, "
        f"parse_max_ms={max(parse_times_ms):.2f}, "
        f"serialize_max_ms={max(serialize_times_ms):.2f}"
    )
