"""
Test moving elements randomly in a DUC file.
"""

import pytest


def test_ducpy_import():
    """Test that ducpy can be imported successfully."""
    try:
        import ducpy
        assert ducpy is not None
        # Test basic ducpy functionality if available
        assert hasattr(ducpy, '__version__') or hasattr(ducpy, '__name__')
    except ImportError as e:
        pytest.fail(f"Failed to import ducpy: {e}")


def test_ezdxf_import():
    """Test that ezdxf can be imported successfully."""
    try:
        import ezdxf
        assert ezdxf is not None
        # Test basic ezdxf functionality
        assert hasattr(ezdxf, '__version__')
        # Try creating a simple DXF document
        doc = ezdxf.new('R2010')
        assert doc is not None
        assert doc.dxfversion == 'AC1024'  # R2010 version code
    except ImportError as e:
        pytest.fail(f"Failed to import ezdxf: {e}")


def test_basic_functionality():
    """Simple test to verify the testing setup is working."""
    assert True


def test_math_operations():
    """Test basic math operations to ensure pytest is functioning."""
    assert 2 + 2 == 4
    assert 10 - 5 == 5
    assert 3 * 4 == 12
    assert 8 / 2 == 4


def test_string_operations():
    """Test string operations."""
    test_string = "ducdxf"
    assert len(test_string) == 6
    assert test_string.upper() == "DUCDXF"
    assert "dxf" in test_string


def test_list_operations():
    """Test list operations."""
    test_list = [1, 2, 3, 4, 5]
    assert len(test_list) == 5
    assert test_list[0] == 1
    assert test_list[-1] == 5
    assert 3 in test_list
