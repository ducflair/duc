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


def get_testing_assets_dir() -> str:
    """Dynamically resolve the assets/testing directory within the repository.

    This walks up the directory tree starting from the location of this file
    until it finds the `assets/testing` folder. If not found, it checks
    from the current working directory, ensuring robust relative resolution.
    """
    # Start at the location of this utility file
    path = Path(__file__).resolve().parent

    # Walk up the tree looking for assets/testing
    for parent in path.parents:
        candidate = parent / "assets" / "testing"
        if candidate.is_dir():
            return str(candidate.resolve())

    # Fallback to checking the current working directory
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        candidate = parent / "assets" / "testing"
        if candidate.is_dir():
            return str(candidate.resolve())

    raise FileNotFoundError("Could not locate repository 'assets/testing' directory.")


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


def download_fixture_from_cdn(path: str, timeout: int = 30) -> bytes:
    """Download fixture bytes from the fixture CDN with automatic fallback.

    First tries jsDelivr (``FIXTURE_CDN``).  If jsDelivr returns a plain-text
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
    except urllib.error.HTTPError:
        # non-2xx from jsDelivr – try GitHub raw immediately
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


def get_asset_bytes(path: str, prefer_local: bool = True) -> bytes:
    """Return raw bytes of a test asset, preferring a local copy if present.

    Args:
        path: Relative path inside ``src/`` (e.g. ``"pdf-files/test.pdf"``).
        prefer_local: If ``True`` (default), first look under the repository's
                      ``assets/testing`` directory before falling back to the
                      CDN.

    Returns:
        Raw bytes of the asset.
    """
    if prefer_local:
        assets_dir = get_testing_assets_dir()
        local_path = os.path.join(assets_dir, path)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()

    return download_fixture_from_cdn(path)
