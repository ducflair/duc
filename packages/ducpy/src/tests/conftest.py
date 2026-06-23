"""
Pytest configuration file for the ducpy tests.
"""
import os
import shutil

import pytest

from _dev.dev_utils import (
    get_testing_assets_dir,
    get_asset_bytes,
    download_fixture_from_cdn,
)


def pytest_sessionstart(session):
    """Clean the test output directory once at the start of the test session."""
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    if os.path.isdir(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)


@pytest.fixture
def test_assets_dir():
    """Return the path to the assets directory."""
    return get_testing_assets_dir()


@pytest.fixture
def load_test_asset():
    """Return a function to load test assets by filename (local or CDN fallback)."""

    def _load_asset(path: str):
        """Load an asset by its relative path (e.g. ``'pdf-files/test.pdf'``)."""
        return get_asset_bytes(path, prefer_local=True)

    return _load_asset


@pytest.fixture
def test_output_dir():
    """Return the path to the output directory (already cleaned at session start)."""
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    return output_dir


@pytest.fixture
def test_input_dir():
    """Return the path to the input directory and ensure it exists."""
    input_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inputs")
    os.makedirs(input_dir, exist_ok=True)
    return input_dir
