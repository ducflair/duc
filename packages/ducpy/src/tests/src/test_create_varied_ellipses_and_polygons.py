"""
Test creating varied ellipse and polygon elements.
"""
import os
import math
import random
import string
import io
import pytest
import ducpy as duc

def test_create_varied_ellipses_and_polygons(test_output_dir):
    """Test creating varied ellipse and polygon elements with different properties."""
    elements = []

    # Configuration for different ellipses
    ellipse_configs = [
        {"x": 50, "y": 50, "width": 100, "height": 100, "ratio": 1.0, "start_angle": 0, "end_angle": 360, "label": "Perfect Circle"},
        {"x": 200, "y": 50, "width": 150, "height": 75, "ratio": 0.5, "start_angle": 0, "end_angle": 360, "label": "Horizontal Ellipse"},
        {"x": 400, "y": 50, "width": 80, "height": 120, "ratio": 1.5, "start_angle": 0, "end_angle": 360, "label": "Vertical Ellipse"},
        {"x": 50, "y": 200, "width": 120, "height": 120, "ratio": 1.0, "start_angle": 45, "end_angle": 315, "label": "3/4 Circle Arc"},
    ]

    for i, config in enumerate(ellipse_configs):
        elements.append(duc.ElementBuilder()
            .at_position(config["x"], config["y"])
            .with_size(config["width"], config["height"])
            .with_angle(random.uniform(0, math.pi / 4))
            .with_label(config["label"])
            .with_styles(duc.create_fill_and_stroke_style(
                duc.create_solid_content(duc.generate_random_color()),
                duc.create_solid_content(duc.generate_random_color()),
                opacity=random.uniform(0.7, 1.0)
            ))
            .with_z_index(i)
            .build_ellipse()
            .with_ratio(config["ratio"])
            .with_start_angle(math.radians(config["start_angle"]))
            .with_end_angle(math.radians(config["end_angle"]))
            .with_show_aux_crosshair(random.choice([True, False]))
            .build())

    # Configuration for different polygons
    polygon_configs = [
        {"x": 50, "y": 350, "width": 80, "height": 80, "sides": 3, "label": "Triangle"},
        {"x": 150, "y": 350, "width": 80, "height": 80, "sides": 4, "label": "Square"},
        {"x": 250, "y": 350, "width": 80, "height": 80, "sides": 5, "label": "Pentagon"},
        {"x": 350, "y": 350, "width": 80, "height": 80, "sides": 6, "label": "Hexagon"},
    ]

    for i, config in enumerate(polygon_configs):
        elements.append(duc.ElementBuilder()
            .at_position(config["x"], config["y"])
            .with_size(config["width"], config["height"])
            .with_angle(random.uniform(0, math.pi / 2))
            .with_label(config["label"])
            .with_styles(duc.create_fill_and_stroke_style(
                duc.create_solid_content(duc.generate_random_color()),
                duc.create_solid_content(duc.generate_random_color()),
                opacity=random.uniform(0.7, 1.0)
            ))
            .with_z_index(len(ellipse_configs) + i)
            .build_polygon()
            .with_sides(config["sides"])
            .build())

    # Serialize and save to file using the new io.py methods
    output_file = os.path.join(test_output_dir, "test_varied_ellipses_and_polygons.duc")
    
    duc.write_duc_file(
        file_path=output_file,
        name="VariedShapesTest",
        elements=elements
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0

    # Parse and verify the data using the new io.py methods
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    
    assert len(parsed_elements) == len(elements)

    # Verify properties of parsed elements
    for original_el_wrapper in elements:
        original_el = original_el_wrapper.element
        parsed_el_wrapper = next((p for p in parsed_elements if p.element.base.id == original_el.base.id), None)
        assert parsed_el_wrapper is not None, f"Element with ID {original_el.base.id} not found in parsed data."
        
        parsed_el = parsed_el_wrapper.element
        
        assert parsed_el.base.label == original_el.base.label
        assert parsed_el.base.styles.opacity == pytest.approx(original_el.base.styles.opacity)
        
        if hasattr(original_el, 'ratio'): # It's an ellipse
            assert parsed_el.ratio == pytest.approx(original_el.ratio)
            assert parsed_el.start_angle == pytest.approx(original_el.start_angle)
            assert parsed_el.end_angle == pytest.approx(original_el.end_angle)
        
        if hasattr(original_el, 'sides'): # It's a polygon
            assert parsed_el.sides == original_el.sides

    print(f"Successfully created and verified {len(elements)} varied ellipse and polygon elements")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

if __name__ == "__main__":
    pytest.main([__file__])
