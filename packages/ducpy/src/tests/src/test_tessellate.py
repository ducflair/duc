"""Tests for CAD and BIM model tessellation engine (ducpy.tessellate)."""

from pathlib import Path
import json
import pytest

import ducpy as duc


def test_tessellate_model_code_box():
    code = """
from build123d import *
from ocp_vscode import show, Animation

b = Box(10, 20, 30)
show(b)
a = Animation()
a.add_track("/Group/Box", "tx", [0, 4], [0, 20])
a.animate(speed=2)
"""
    result = duc.tessellate_model_code(code=code, model_type="python")
    assert result["success"] is True
    assert result["kind"] == "parametric-json"
    assert isinstance(result["payload"], str)

    parsed = json.loads(result["payload"])
    assert "instances" in parsed
    assert "shapes" in parsed
    assert parsed["animation"] == {"tracks": [["/Group/Box", "tx", [0, 4], [0, 20]]], "speed": 2}
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


def test_empty_code_returns_successful_empty_model():
    result = duc.tessellate_model_code(code="print('finished')", model_type="python")
    assert result["success"] and result["kind"] == "empty"
    assert "finished" in result["stdout"]



def test_ifc_project_stores_and_recovers_authored_motion(tmp_path):
    import ifcopenshell.api
    from ducpy.tessellate.shims import scopture_collect_ifc_preview
    run = ifcopenshell.api.run
    model = run("project.create_file")
    project = run("root.create_entity", model, ifc_class="IfcProject")
    run("unit.assign_unit", model)
    context = run("context.add_context", model, context_type="Model")
    body = run("context.add_context", model, context_type="Model", context_identifier="Body",
               target_view="MODEL_VIEW", parent=context)
    wall = run("root.create_entity", model, ifc_class="IfcWall")
    shape = run("geometry.add_wall_representation", model, context=body, length=2, height=1, thickness=0.1)
    run("geometry.assign_representation", model, product=wall, representation=shape)
    settings = run("pset.add_pset", model, product=project, name="ScoptureMotion")
    tracks = [[wall.GlobalId, "tx", [0, 1], [0, 2]]]
    run("pset.edit_pset", model, pset=settings, properties={"ExplodeTracks": json.dumps(tracks)})
    path = tmp_path / "authored.ifc"
    model.write(str(path))
    preview = json.loads(scopture_collect_ifc_preview({}, output_path=path))
    assert preview["explode"] == tracks
    assert preview["parts"][0]["ifc"]["globalId"] == wall.GlobalId
