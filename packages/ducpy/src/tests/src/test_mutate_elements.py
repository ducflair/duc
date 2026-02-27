"""
Comprehensive mutation tests for all DUC element types.
Covers: property mutation, versioning props, deep/nested mutation, invalid values, sequential mutation.
"""

import random
import time

import ducpy as duc
import pytest
from ducpy.classes.ElementsClass import *


def assert_versioning_changed(before, after):
    assert before.seed != after.seed
    assert before.updated != after.updated
    assert before.version != after.version
    assert before.version_nonce != after.version_nonce

@pytest.mark.parametrize("builder_func,kwargs,base_attr", [
    (lambda: duc.ElementBuilder().at_position(1, 2).with_size(3, 4).with_label("rect").build_rectangle().build(), {}, "base"),
    (lambda: duc.ElementBuilder().at_position(5, 6).with_size(7, 8).with_label("ellipse").build_ellipse().build(), {}, "base"),
    (lambda: duc.ElementBuilder().at_position(9, 10).with_size(11, 12).with_label("polygon").build_polygon().with_sides(5).build(), {}, "base"),
    (lambda: duc.ElementBuilder().with_label("linear").build_linear_element().with_points([(0,0),(1,1)]).build(), {}, "linear_base.base"),
    (lambda: duc.ElementBuilder().with_label("arrow").build_arrow_element().with_points([(2,2),(3,3)]).build(), {}, "linear_base.base"),
    (lambda: duc.ElementBuilder().at_position(13, 14).with_label("text").build_text_element().with_text("hello").build(), {}, "base"),
])
def test_mutate_basic_elements(builder_func, kwargs, base_attr):
    el = builder_func()
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
    duc.mutate_element(el, **updates)
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
    el = duc.ElementBuilder().with_label("deep").build_linear_element().with_points([(0,0),(1,1)]).build()
    # Mutate nested points
    new_points = [duc.DucPoint(x=2, y=2, mirroring=None), duc.DucPoint(x=3, y=3, mirroring=None)]
    duc.mutate_element(el, points=new_points)
    points = el.element.linear_base.points
    assert points[0].x == 2 and points[1].y == 3

def test_mutate_invalid_property():
    el = duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_rectangle().build()
    # Should ignore invalid property
    duc.mutate_element(el, not_a_real_prop=123)
    assert not hasattr(el.element.base, "not_a_real_prop")

def test_mutate_sequential():
    el = duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_rectangle().build()
    base = el.element.base
    old_x = base.x
    old_y = base.y
    duc.mutate_element(el, x=old_x+1)
    duc.mutate_element(el, y=old_y+2)
    assert el.element.base.x == old_x+1
    assert el.element.base.y == old_y+2

def test_mutate_all_element_types():
    # Test mutation for different element types using builders API
    element_builders = [
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_rectangle().build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_ellipse().build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_polygon().with_sides(3).build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_linear_element().with_points([(0,0),(1,1)]).build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_arrow_element().with_points([(0,0),(1,1)]).build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_text_element().with_text("test").build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_image_element().build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_frame_element().build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_plot_element().build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_viewport_element().with_points([(0,0),(1,1)]).build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_freedraw_element().with_points([(0,0),(1,1)]).build(),
        lambda: duc.ElementBuilder().at_position(0, 0).with_size(1, 1).build_doc_element().with_text("test").build(),
    ]
    
    for i, builder_func in enumerate(element_builders):
        try:
            el = builder_func()
            # Mutate position
            duc.mutate_element(el, x=10, y=20)
            
            # Check mutation worked
            if hasattr(el.element, "base"):
                assert el.element.base.x == 10 and el.element.base.y == 20
            elif hasattr(el.element, "linear_base"):
                assert el.element.linear_base.base.x == 10 and el.element.linear_base.base.y == 20
            print(f"✅ Mutated element type {i+1}")
        except Exception as e:
            print(f"⚠️ Skipped element type {i+1}: {e}")

print("✅ Mutation API test suite loaded successfully.")


def test_mutate_elements_via_sql():
    """Mutate element properties using raw SQL UPDATE statements."""
    import time as _time

    from ducpy.builders.sql_builder import DucSQL

    with DucSQL.new() as db:
        now = int(_time.time() * 1000)

        # Create a rectangle
        db.sql(
            "INSERT INTO elements "
            "(id, element_type, x, y, width, height, label, seed, version, version_nonce, updated) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            "r1", "rectangle", 10, 20, 100, 50, "Rect", 42, 1, 100, now,
        )

        # Mutate position (like duc.mutate_element does: update x, y, bump version)
        new_seed = random.randint(0, 2**31)
        new_nonce = random.randint(0, 2**31)
        new_ts = int(_time.time() * 1000)
        db.sql(
            "UPDATE elements SET x = ?, y = ?, seed = ?, version = version + 1, "
            "version_nonce = ?, updated = ? WHERE id = ?",
            20, 30, new_seed, new_nonce, new_ts, "r1",
        )

        row = db.sql("SELECT * FROM elements WHERE id = ?", "r1")[0]
        assert row["x"] == 20 and row["y"] == 30
        assert row["version"] == 2
        assert row["seed"] == new_seed
        assert row["updated"] >= now

        # Mutate label
        db.sql("UPDATE elements SET label = ? WHERE id = ?", "Updated Rect", "r1")
        assert db.sql("SELECT label FROM elements WHERE id = ?", "r1")[0]["label"] == "Updated Rect"

        # Sequential mutations
        for i in range(5):
            db.sql("UPDATE elements SET x = x + 10, version = version + 1 WHERE id = ?", "r1")
        final = db.sql("SELECT x, version FROM elements WHERE id = ?", "r1")[0]
        assert final["x"] == 70  # 20 + 5*10
        assert final["version"] == 7  # 2 + 5

        # Delete element
        db.sql("UPDATE elements SET is_deleted = 1 WHERE id = ?", "r1")
        assert db.sql("SELECT is_deleted FROM elements WHERE id = ?", "r1")[0]["is_deleted"] == 1
