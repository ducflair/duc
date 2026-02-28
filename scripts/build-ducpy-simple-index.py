#!/usr/bin/env python3
"""Build a PEP 503 Simple Repository index for ducpy with wheels served from GitHub Pages.

This script queries GitHub Releases for all ducpy tags, downloads each wheel/sdist
into the output directory so they are deployed alongside the index on GitHub Pages.
Links use relative paths, making the wheels directly accessible via CDN (e.g. jsDelivr):

    https://cdn.jsdelivr.net/gh/ducflair/duc@gh-pages/simple/ducpy/<wheel-file>

Usage:
    python3 scripts/build-ducpy-simple-index.py [output_dir]

    output_dir defaults to _site (the Pages root used by the deploy workflow)
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

REPO = "ducflair/duc"
PACKAGE_NAME = "ducpy"
REQUIRES_PYTHON = ">=3.10"


def get_ducpy_tags() -> list[str]:
    result = subprocess.run(
        ["gh", "release", "list", "--limit", "100", "--json", "tagName"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"Warning: Failed to list releases: {result.stderr}", file=sys.stderr)
        return []
    releases = json.loads(result.stdout)
    return sorted(
        [r["tagName"] for r in releases if r["tagName"].startswith(f"{PACKAGE_NAME}@")],
        key=lambda t: t.split("@", 1)[1],
        reverse=True,
    )


def get_release_assets(tag: str) -> list[dict]:
    result = subprocess.run(
        ["gh", "release", "view", tag, "--json", "assets"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return []
    assets = json.loads(result.stdout).get("assets", [])
    return [a for a in assets if a["name"].endswith((".whl", ".tar.gz"))]


def compute_sha256(filepath: Path) -> str:
    return hashlib.sha256(filepath.read_bytes()).hexdigest()


def build_index(output_dir: Path):
    simple_dir = output_dir / "simple"
    package_dir = simple_dir / PACKAGE_NAME
    package_dir.mkdir(parents=True, exist_ok=True)

    rp_escaped = REQUIRES_PYTHON.replace(">", "&gt;").replace("<", "&lt;")

    (simple_dir / "index.html").write_text(
        "<!DOCTYPE html>\n"
        "<html><head><title>Simple Package Index</title></head>\n"
        "<body>\n"
        "<h1>Simple Package Index</h1>\n"
        f'<a href="{PACKAGE_NAME}/">{PACKAGE_NAME}</a>\n'
        "</body></html>\n"
    )

    tags = get_ducpy_tags()
    print(f"Found {len(tags)} ducpy release(s)")

    links: list[str] = []

    for tag in tags:
        assets = get_release_assets(tag)
        if not assets:
            continue
        for asset in assets:
            name = asset["name"]
            dest = package_dir / name

            if not dest.exists():
                dl = subprocess.run(
                    [
                        "gh", "release", "download", tag,
                        "--pattern", name,
                        "--dir", str(package_dir),
                        "--clobber",
                    ],
                    capture_output=True,
                    text=True,
                )
                if dl.returncode != 0:
                    print(f"  WARNING: failed to download {name} from {tag}", file=sys.stderr)
                    continue

            sha = compute_sha256(dest)
            links.append(
                f'<a href="{name}#sha256={sha}" '
                f'data-requires-python="{rp_escaped}">{name}</a>'
            )
            print(f"  {tag}: {name} ({sha[:12]}...)")

    (package_dir / "index.html").write_text(
        "<!DOCTYPE html>\n"
        '<html><head><meta charset="utf-8"></head>\n'
        '<body style="margin:0;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">\n'
        '<main style="display:flex;flex-direction:column;gap:8px;align-items:flex-start;">\n'
        + "\n".join(links) + "\n"
        "</main>\n"
        "</body></html>\n"
    )

    total_size = sum(f.stat().st_size for f in package_dir.iterdir() if f.is_file() and f.name != "index.html")
    print(f"\nGenerated simple index with {len(links)} package(s) "
          f"({total_size / 1024 / 1024:.1f} MB of wheels)")


if __name__ == "__main__":
    output_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("_site")
    build_index(output_dir)
