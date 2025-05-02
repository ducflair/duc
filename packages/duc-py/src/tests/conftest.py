"""
Pytest configuration file for the ducpy tests.
"""
import os
import pytest


@pytest.fixture
def test_assets_dir():
    """Return the path to the assets directory."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")


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
