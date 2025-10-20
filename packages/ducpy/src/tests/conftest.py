"""
Pytest configuration file for the ducpy tests.
"""
import os
import pytest


def get_asset_subdirectory(filename):
    """Determine the appropriate subdirectory based on file extension."""
    _, ext = os.path.splitext(filename.lower())
    ext = ext[1:]  # Remove the dot

    if ext == "pdf":
        return "pdf-files"
    elif ext == "svg":
        return "svg-files"
    elif ext in ["png", "jpg", "jpeg", "gif"]:
        return "image-files"
    elif ext == "step":
        return "step-files"
    elif ext == "duc":
        return "duc-files"
    else:
        return "image-files"  # default


@pytest.fixture
def test_assets_dir():
    """Return the path to the assets directory."""
    # Go up to the root duc directory and then to assets/testing
    return os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "assets", "testing"))


@pytest.fixture
def load_test_asset():
    """Return a function to load test assets by filename."""
    assets_dir = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "assets", "testing"))

    def _load_asset(filename):
        sub_dir = get_asset_subdirectory(filename)
        with open(os.path.join(assets_dir, sub_dir, filename), "rb") as f:
            return f.read()

    return _load_asset


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
