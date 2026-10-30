"""Tests for CAD and BIM model tessellation engine (ducpy.tessellate)."""

from pathlib import Path
import json
import pytest

import ducpy as duc


def test_tessellate_model_code_box():
    code = """
from build123d import *
from ocp_vscode import show

b = Box(10, 20, 30)
show(b)
"""
    result = duc.tessellate_model_code(code=code, model_type="python")
    assert result["success"] is True
    assert result["kind"] == "parametric-json"
    assert isinstance(result["payload"], str)

    parsed = json.loads(result["payload"])
    assert "instances" in parsed
    assert "shapes" in parsed
    assert len(parsed["instances"]) > 0


from _dev.dev_utils import get_duc_fixture_path


def test_tessellate_duc_element_step_boeing():
    duc_path = get_duc_fixture_path("universal.duc")
    assert duc_path.exists(), f"universal.duc missing at {duc_path}"

    result = duc.tessellate_duc_element(str(duc_path), "iF5wjSVLZKD5zGNdNZzjS")
    assert result["success"] is True
    assert result["kind"] == "parametric-json"
    assert result["elementId"] == "iF5wjSVLZKD5zGNdNZzjS"

    parsed = json.loads(result["payload"])
    assert "instances" in parsed
    assert "shapes" in parsed
    assert len(parsed["instances"]) > 0


def test_tessellate_duc_element_python_script():
    duc_path = get_duc_fixture_path("universal.duc")
    assert duc_path.exists(), f"universal.duc missing at {duc_path}"

    result = duc.tessellate_duc_element(str(duc_path), "vipD8GMUxJiv1V2pJXzdU")
    assert result["success"] is True
    assert result["kind"] == "parametric-json"

    parsed = json.loads(result["payload"])
    assert "instances" in parsed
    assert "shapes" in parsed


def test_tessellate_duc_element_ifc_duplex():
    duc_path = get_duc_fixture_path("universal.duc")
    assert duc_path.exists(), f"universal.duc missing at {duc_path}"

    result = duc.tessellate_duc_element(str(duc_path), "QA6bGH0_Iqp_mEeE_977H")
    assert result["success"] is True
    assert result["kind"] == "ifc-json"

    parsed = json.loads(result["payload"])
    assert parsed.get("version") == 2
    assert "parts" in parsed
    assert len(parsed["parts"]) > 0
