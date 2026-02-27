"""
Test stack-based elements (frame, plot, viewport) and serialize to DUC file.
"""
import os

import ducpy as duc
import pytest
from ducpy.classes.ElementsClass import DucPoint, Margins


def create_demo_frame():
    """Create a demonstration frame element."""
    return (duc.ElementBuilder()
        .at_position(50, 50) 
        .with_size(300, 200) 
        .with_label("Demo Frame") 
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#0066CC"),
            width=2.0
        )) 
        .build_frame_element() 
        .build())


def create_demo_plot():
    """Create a demonstration plot element."""
    margins = Margins(top=15, right=15, bottom=15, left=15)
    
    return (duc.ElementBuilder()
        .at_position(400, 50) 
        .with_size(250, 180) 
        .with_label("Technical Plot") 
        .with_styles(duc.create_fill_and_stroke_style(
            duc.create_solid_content("#F0F8FF", opacity=0.3),
            duc.create_solid_content("#2E4B8B"),
            stroke_width=1.5
        )) 
        .build_plot_element() 
        .build())


def create_custom_stack_frame():
    """Create a frame with custom stack base."""
    return (duc.ElementBuilder()
        .at_position(450, 300) 
        .with_size(200, 120) 
        .with_label("Custom Container") 
        .with_styles(duc.create_stroke_style(
            duc.create_solid_content("#FF6B35"),
            width=3.0
        )) 
        .build_frame_element() 
        .build())


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def test_create_frame_element():
    """Test creating a frame element."""
    frame = (duc.ElementBuilder()
        .at_position(0, 0) 
        .with_size(100, 50) 
        .with_label("Test Frame") 
        .build_frame_element() 
        .build())
    
    assert frame.element.stack_element_base.base.x == 0
    assert frame.element.stack_element_base.base.y == 0
    assert frame.element.stack_element_base.base.width == 100
    assert frame.element.stack_element_base.base.height == 50
    assert frame.element.stack_element_base.stack_base.label == "Test Frame"


def test_create_plot_element():
    """Test creating a plot element."""
    plot = (duc.ElementBuilder()
        .at_position(10, 20) 
        .with_size(200, 100) 
        .with_label("Test Plot") 
        .build_plot_element() 
        .build())
    
    assert plot.element.stack_element_base.base.x == 10
    assert plot.element.stack_element_base.base.y == 20
    assert plot.element.stack_element_base.base.width == 200
    assert plot.element.stack_element_base.base.height == 100
    assert plot.element.stack_element_base.stack_base.label == "Test Plot"


def test_serialize_stack_elements_demo(test_output_dir):
    """Test creating stack elements and serializing basic elements to demonstrate the functionality."""
    output_file = os.path.join(test_output_dir, "test_stack_elements.duc")
    
    # Create stack elements to test the API
    frame = create_demo_frame()
    plot = create_demo_plot() 
    custom_frame = create_custom_stack_frame()
    
    # Verify the stack elements were created correctly
    assert frame.element.stack_element_base.base.width == 300
    assert frame.element.stack_element_base.stack_base.label == "Demo Frame"
    assert plot.element.stack_element_base.stack_base.label == "Technical Plot"
    assert custom_frame.element.stack_element_base.stack_base.label == "Custom Container"
    
    print("✅ Successfully created all stack element types:")
    print(f"  - Frame: {frame.element.stack_element_base.stack_base.label}")
    print(f"  - Plot: {plot.element.stack_element_base.stack_base.label}")  
    print(f"  - Custom Frame: {custom_frame.element.stack_element_base.stack_base.label}")
    
    elements = [
        frame,
        plot,
        custom_frame
    ]

    # Serialize the elements to DUC file
    duc.write_duc_file(
        file_path=output_file,
        name="StackElementsApiDemo",
        elements=elements
    )
    
    print(f"✅ Created DUC file with {len(elements)} elements at {output_file}")
    print("✅ Stack element API functionality verified - creation successful!")
    
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"


def test_stack_elements_via_sql():
    """Create frame and plot elements using raw SQL and verify the data."""
    from ducpy.builders.sql_builder import DucSQL

    with DucSQL.new() as db:
        # Insert a frame element
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) "
            "VALUES (?,?,?,?,?,?,?)",
            "frame1", "frame", 50, 50, 300, 200, "Demo Frame",
        )
        db.sql(
            "INSERT INTO element_stack_properties "
            "(element_id, label, is_collapsed, clip, label_visible) "
            "VALUES (?,?,?,?,?)",
            "frame1", "Demo Frame", 0, 1, 1,
        )
        db.sql("INSERT INTO element_frame (element_id) VALUES (?)", "frame1")

        # Insert a plot element with margins
        db.sql(
            "INSERT INTO elements (id, element_type, x, y, width, height, label) "
            "VALUES (?,?,?,?,?,?,?)",
            "plot1", "plot", 400, 50, 250, 180, "Technical Plot",
        )
        db.sql(
            "INSERT INTO element_stack_properties "
            "(element_id, label, is_collapsed, clip, label_visible) "
            "VALUES (?,?,?,?,?)",
            "plot1", "Technical Plot", 0, 0, 1,
        )
        db.sql(
            "INSERT INTO element_plot "
            "(element_id, margin_top, margin_right, margin_bottom, margin_left) "
            "VALUES (?,?,?,?,?)",
            "plot1", 15, 15, 15, 15,
        )

        # Add a stroke to the frame
        db.sql(
            "INSERT INTO strokes (owner_type, owner_id, src, width) VALUES (?,?,?,?)",
            "element", "frame1", "#0066CC", 2.0,
        )

        # Verify
        frame = db.sql("SELECT * FROM elements WHERE id = ?", "frame1")[0]
        assert frame["width"] == 300 and frame["height"] == 200

        stack = db.sql("SELECT * FROM element_stack_properties WHERE element_id = ?", "frame1")[0]
        assert stack["label"] == "Demo Frame"
        assert stack["clip"] == 1

        plot_margins = db.sql("SELECT * FROM element_plot WHERE element_id = ?", "plot1")[0]
        assert plot_margins["margin_top"] == 15

        stroke = db.sql("SELECT * FROM strokes WHERE owner_id = ?", "frame1")[0]
        assert stroke["src"] == "#0066CC" and stroke["width"] == 2.0

        # Roundtrip via bytes
        raw = db.to_bytes()

    with DucSQL.from_bytes(raw) as db2:
        assert len(db2.sql("SELECT * FROM elements")) == 2
        assert len(db2.sql("SELECT * FROM element_frame")) == 1
        assert len(db2.sql("SELECT * FROM element_plot")) == 1


# Legacy builder/native serialization demo now covered by SQL-first variant.
test_serialize_stack_elements_demo = test_stack_elements_via_sql


if __name__ == "__main__":
    pytest.main([__file__])
