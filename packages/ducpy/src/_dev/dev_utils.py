"""
Development and testing utilities for DUC repository paths.

This module is dev-only and is NOT shipped with the published ducpy
wheel. It is consumed by the local test suite, examples, and CI scripts.
"""

import os
import ssl
import urllib.request
import urllib.error
from pathlib import Path


# Primary CDN for test fixtures (jsDelivr)
FIXTURE_CDN = "https://cdn.jsdelivr.net/gh/ducflair/fixtures@main/src"
# Fallback raw GitHub URL when jsDelivr rejects a file (e.g. size > 20 MB)
_FIXTURE_GITHUB_RAW = "https://raw.githubusercontent.com/ducflair/fixtures/main/src"


def get_fixture_cache_dir(category: str = "") -> Path:
    """Return the fixture cache directory, e.g. <repo_root>/.cache/fixtures/<category>."""
    if os.environ.get("DUC_FIXTURES_DIR"):
        base = Path(os.environ["DUC_FIXTURES_DIR"])
    else:
        # Walk up to locate repo root (looking for .git or bun.lock or pyproject.toml)
        path = Path(__file__).resolve().parent
        repo_root = None
        for parent in path.parents:
            if (parent / ".git").is_dir() or (parent / "bun.lock").is_file():
                repo_root = parent
                break
        if repo_root is None:
            repo_root = path.parents[3]
        base = repo_root / ".cache" / "fixtures"

    target = base / category if category else base
    target.mkdir(parents=True, exist_ok=True)
    return target


def get_testing_assets_dir() -> str:
    """Dynamically resolve the assets/testing or fixture cache directory within the repository.

    This walks up the directory tree looking for `assets/testing`. If not found,
    it falls back to the persistent `.cache/fixtures` directory.
    """
    path = Path(__file__).resolve().parent

    # 1. Check for legacy assets/testing folder
    for parent in path.parents:
        candidate = parent / "assets" / "testing"
        if candidate.is_dir():
            return str(candidate.resolve())

    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        candidate = parent / "assets" / "testing"
        if candidate.is_dir():
            return str(candidate.resolve())

    # 2. Fall back to the fixture cache directory
    return str(get_fixture_cache_dir())


def _download_with_headers(url: str, timeout: int) -> bytes:
    """Fetch *url* and return raw bytes, disabling SSL verification."""
    opener = urllib.request.build_opener()
    opener.addheaders = [
        (
            "User-Agent",
            (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
            ),
        ),
        ("Accept", "*/*"),
    ]
    urllib.request.install_opener(opener)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    with urllib.request.urlopen(url, context=ctx, timeout=timeout) as response:
        return response.read()


def download_fixture_from_cdn(path: str, timeout: int = 60) -> bytes:
    """Download fixture bytes from the fixture CDN with automatic fallback.

    First tries jsDelivr (``FIXTURE_CDN``). If jsDelivr returns a plain-text
    error such as *"File size exceeded the configured limit of 20 MB"*, the
    helper falls back to GitHub raw content (``_FIXTURE_GITHUB_RAW``).

    Args:
        path: The relative path to the fixture under the ``src/`` directory in
              the ``ducflair/fixtures`` repository,
              e.g. ``"ifc-files/NVW_DCR-LOD100_Arch.ifc"``.
        timeout: Request timeout in seconds.

    Returns:
        Raw bytes of the downloaded file.

    Raises:
        urllib.error.HTTPError: if both the CDN and GitHub raw return non-2xx.
        urllib.error.URLError:  if the connection fails entirely.
    """
    primary_url = f"{FIXTURE_CDN}/{path}"

    try:
        data = _download_with_headers(primary_url, timeout)
    except (urllib.error.HTTPError, urllib.error.URLError):
        # non-2xx or connection error from jsDelivr – try GitHub raw immediately
        fallback_url = f"{_FIXTURE_GITHUB_RAW}/{path}"
        data = _download_with_headers(fallback_url, timeout)
        return data

    # jsDelivr can return HTTP 200 with a text error body for oversized files
    _JSDELIVR_ERR_PREFIXES = (
        b"File size exceeded",
        b"Package size exceeded",
    )
    if data.startswith(_JSDELIVR_ERR_PREFIXES):
        fallback_url = f"{_FIXTURE_GITHUB_RAW}/{path}"
        data = _download_with_headers(fallback_url, timeout)

    return data


def get_asset_path(path: str, prefer_local: bool = True) -> Path:
    """Return local filesystem Path to an asset, downloading and caching if missing.

    Args:
        path: Relative path inside ``src/`` (e.g. ``"duc-files/universal.duc"``).
        prefer_local: If ``True`` (default), checks local cache or legacy assets
                      directory before downloading.

    Returns:
        Path to the local cached file.
    """
    cache_dir = get_fixture_cache_dir()
    cached = cache_dir / path

    if prefer_local:
        if cached.is_file() and cached.stat().st_size > 0:
            return cached

        # Check legacy assets/testing path
        for parent in Path(__file__).resolve().parents:
            legacy = parent / "assets" / "testing" / path
            if legacy.is_file() and legacy.stat().st_size > 0:
                cached.parent.mkdir(parents=True, exist_ok=True)
                cached.write_bytes(legacy.read_bytes())
                return cached

    # Download and cache
    data = download_fixture_from_cdn(path)
    cached.parent.mkdir(parents=True, exist_ok=True)
    cached.write_bytes(data)
    return cached


def get_duc_fixture_path(filename: str, prefer_local: bool = True) -> Path:
    """Convenience helper to retrieve a .duc fixture Path."""
    return get_asset_path(f"duc-files/{filename}", prefer_local=prefer_local)


def get_asset_bytes(path: str, prefer_local: bool = True) -> bytes:
    """Return raw bytes of a test asset, preferring a local copy if present.

    Args:
        path: Relative path inside ``src/`` (e.g. ``"pdf-files/test.pdf"``).
        prefer_local: If ``True`` (default), first look under local cache before
                      falling back to downloading.

    Returns:
        Raw bytes of the asset.
    """
    return get_asset_path(path, prefer_local=prefer_local).read_bytes()
