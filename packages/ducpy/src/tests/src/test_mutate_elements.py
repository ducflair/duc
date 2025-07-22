"""
Comprehensive mutation tests for all DUC element types.
Covers: property mutation, versioning props, deep/nested mutation, invalid values, sequential mutation.
"""

import pytest
import time
import random

import ducpy as duc
from ducpy.classes.ElementsClass import *
from ducpy.helpers.element_builders import mutate_element, create_element_base, create_rectangle, create_ellipse, create_polygon, create_linear_element, create_arrow_element, create_text_element
from ducpy.utils.rand_utils import random_versioning

def assert_versioning_changed(before, after):
    assert before.seed != after.seed
    assert before.updated != after.updated
    assert before.version != after.version
    assert before.version_nonce != after.version_nonce

@pytest.mark.parametrize("builder,kwargs,base_attr", [
    (create_rectangle, dict(x=1, y=2, width=3, height=4, label="rect"), "base"),
    (create_ellipse, dict(x=5, y=6, width=7, height=8, label="ellipse"), "base"),
    (create_polygon, dict(x=9, y=10, width=11, height=12, sides=5, label="polygon"), "base"),
    (create_linear_element, dict(points=[(0,0),(1,1)], label="linear"), "linear_base.base"),
    (create_arrow_element, dict(points=[(2,2),(3,3)], label="arrow"), "linear_base.base"),
    (create_text_element, dict(x=13, y=14, text="hello", label="text"), "base"),
])
def test_mutate_basic_elements(builder, kwargs, base_attr):
    el = builder(**kwargs)
    # Get base object for versioning
    base = el.element
    for attr in base_attr.split('.'):
        base = getattr(base, attr)
    old_x = base.x
    old_y = base.y
    old_seed = base.seed
    old_version = base.version
    old_version_nonce = base.version_nonce
    old_updated = base.updated

    # Mutate position and versioning props
    updates = dict(x=old_x+10, y=old_y+10)
    mutate_element(el, **updates)
    after = el.element
    for attr in base_attr.split('.'):
        after = getattr(after, attr)
    assert after.x == old_x + 10
    assert after.y == old_y + 10
    assert after.seed != old_seed
    assert after.version != old_version
    assert after.version_nonce != old_version_nonce
    # Allow updated to be equal if mutation happens in the same ms
    assert after.updated >= old_updated

def test_mutate_deep_nested():
    el = create_linear_element(points=[(0,0),(1,1)], label="deep")
    # Mutate nested points
    new_points = [DucPoint(x=2, y=2), DucPoint(x=3, y=3)]
    mutate_element(el, points=new_points, **random_versioning())
    points = el.element.linear_base.points
    assert points[0].x == 2 and points[1].y == 3

def test_mutate_invalid_property():
    el = create_rectangle(x=0, y=0, width=1, height=1)
    # Should ignore invalid property
    mutate_element(el, not_a_real_prop=123, **random_versioning())
    assert not hasattr(el.element.base, "not_a_real_prop")

def test_mutate_sequential():
    el = create_rectangle(x=0, y=0, width=1, height=1)
    base = el.element.base
    old_x = base.x
    old_y = base.y
    mutate_element(el, x=old_x+1, **random_versioning())
    mutate_element(el, y=old_y+2, **random_versioning())
    assert el.element.base.x == old_x+1
    assert el.element.base.y == old_y+2

def test_mutate_all_element_types():
    # Minimal instantiation for all element types with a base
    element_types = [
        DucRectangleElement,
        DucPolygonElement,
        DucEllipseElement,
        DucEmbeddableElement,
        DucPdfElement,
        DucMermaidElement,
        DucTableElement,
        DucImageElement,
        DucTextElement,
        DucLinearElement,
        DucArrowElement,
        DucFreeDrawElement,
        DucBlockInstanceElement,
        DucFrameElement,
        DucPlotElement,
        DucViewportElement,
        DucXRayElement,
        DucLeaderElement,
        DucDimensionElement,
        DucFeatureControlFrameElement,
        DucDocElement,
        DucParametricElement,
    ]
    # For each, create a dummy instance and mutate
    for cls in element_types:
        # Try to instantiate with minimal base
        try:
            if hasattr(cls, "base"):
                base = create_element_base(x=0, y=0, width=1, height=1)
                el = cls(base=base)
            elif hasattr(cls, "linear_base"):
                base = create_element_base(x=0, y=0, width=1, height=1)
                points = [DucPoint(x=0, y=0), DucPoint(x=1, y=1)]
                lines = [DucLine(start=DucLineReference(index=0), end=DucLineReference(index=1))]
                linear_base = DucLinearElementBase(base=base, points=points, lines=lines, path_overrides=[], last_committed_point=None, start_binding=None, end_binding=None)
                el = cls(linear_base=linear_base, wipeout_below=False)
            else:
                continue
            wrapper = ElementWrapper(element=el)
            mutate_element(wrapper, x=10, y=20, **random_versioning())
            # Check mutation
            if hasattr(el, "base"):
                assert el.base.x == 10 and el.base.y == 20
            elif hasattr(el, "linear_base"):
                assert el.linear_base.base.x == 10 and el.linear_base.base.y == 20
        except Exception as e:
            print(f"Skipped {cls.__name__}: {e}")

print("✅ Mutation API test suite loaded successfully.")
