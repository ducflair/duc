"""
Pytest configuration file for the ducxf tests.
"""
import os
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[4]
TESTING_ASSETS_DIR = REPO_ROOT / "assets" / "testing"
DXF_TESTING_ASSETS_DIR = TESTING_ASSETS_DIR / "dxf-files"


@pytest.fixture
def test_assets_dir():
    """Return the path to the shared testing assets directory."""
    return str(TESTING_ASSETS_DIR)


@pytest.fixture
def test_dxf_assets_dir():
    """Return the path to the shared DXF testing assets directory."""
    return str(DXF_TESTING_ASSETS_DIR)


@pytest.fixture
def test_output_dir():
    """Return the path to the output directory and ensure it exists."""
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir 
  
  
@pytest.fixture
def test_input_dir():
    """Return the path to the input directory and ensure it exists."""
    input_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inputs")
    os.makedirs(input_dir, exist_ok=True)
    return input_dir
