"""
Test creating varied ellipse and polygon elements.
"""
import os
import math
import random
import string

from ducpy.classes.DucElementClass import DucEllipseElement, DucPolygonElement, ElementBackground, ElementStroke, ElementContentBase, StrokeStyleProps
from ducpy.classes.AppStateClass import AppState
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.parse.parse_duc import parse_duc_flatbuffers

def generate_random_id(length=8):
    """Generate a random string ID"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color():
    """Generate a random hex color"""
    return f"#{random.randint(0, 0xFFFFFF):06x}"

def create_random_background():
    return [ElementBackground(
        content=ElementContentBase(
            preference=random.randint(0, 2),  # Random FillStyle
            src=generate_random_color(),
            visible=True,
            opacity=random.uniform(0.5, 1.0)
        )
    )]

def create_random_stroke():
    return [ElementStroke(
        content=ElementContentBase(
            preference=random.randint(0, 2),  # Random FillStyle
            src=generate_random_color(),
            visible=True,
            opacity=random.uniform(0.7, 1.0)
        ),
        width=random.uniform(1.0, 5.0),
        style=StrokeStyleProps(
            preference=random.randint(0, 2),  # Random StrokePreference
            cap=random.choice([0, 1, 2]),      # Random StrokeCap
            join=random.choice([0, 1, 2]),     # Random StrokeJoin
            dash=[] if random.random() < 0.5 else [random.uniform(5, 15), random.uniform(2, 8)], # Random dash pattern
            dash_cap=random.choice([0, 1, 2]), # Random StrokeCap
            miter_limit=random.uniform(1.0, 10.0)
        ),
        placement=random.choice([10, 11, 12]) # Random StrokePlacement
    )]

def test_create_varied_ellipses_and_polygons(test_output_dir):
    """Test creating varied ellipse and polygon elements with different properties"""

    elements = []

    # Create different types of ellipses
    ellipse_configs = [
        {"x": 50, "y": 50, "width": 100, "height": 100, "ratio": 1.0, "start_angle": 0, "end_angle": 360, "label": "Perfect Circle"},
        {"x": 200, "y": 50, "width": 150, "height": 75, "ratio": 0.5, "start_angle": 0, "end_angle": 360, "label": "Horizontal Ellipse"},
        {"x": 400, "y": 50, "width": 80, "height": 120, "ratio": 1.5, "start_angle": 0, "end_angle": 360, "label": "Vertical Ellipse"},
        {"x": 50, "y": 200, "width": 120, "height": 120, "ratio": 1.0, "start_angle": 45, "end_angle": 315, "label": "3/4 Circle Arc"},
        {"x": 200, "y": 200, "width": 100, "height": 100, "ratio": 1.0, "start_angle": 0, "end_angle": 180, "label": "Half Circle"},
        {"x": 350, "y": 200, "width": 80, "height": 80, "ratio": 1.0, "start_angle": 90, "end_angle": 270, "label": "Quarter Circle"},
    ]

    for config in ellipse_configs:
        ellipse_element = DucEllipseElement(
            id=generate_random_id(),
            x=config["x"],
            y=config["y"],
            width=config["width"],
            height=config["height"],
            angle=random.uniform(0, 45),  # Some rotation
            opacity=random.uniform(0.7, 1.0),
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label=config["label"],
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            ratio=config["ratio"],
            start_angle=config["start_angle"],
            end_angle=config["end_angle"],
            show_aux_crosshair=random.choice([True, False]),
            background=create_random_background(), # Add background
            stroke=create_random_stroke() # Add stroke
        )
        elements.append(ellipse_element)

    # Create different types of polygons
    polygon_configs = [
        {"x": 50, "y": 350, "width": 80, "height": 80, "sides": 3, "label": "Triangle"},
        {"x": 150, "y": 350, "width": 80, "height": 80, "sides": 4, "label": "Square"},
        {"x": 250, "y": 350, "width": 80, "height": 80, "sides": 5, "label": "Pentagon"},
        {"x": 350, "y": 350, "width": 80, "height": 80, "sides": 6, "label": "Hexagon"},
        {"x": 450, "y": 350, "width": 80, "height": 80, "sides": 8, "label": "Octagon"},
        {"x": 50, "y": 450, "width": 100, "height": 60, "sides": 12, "label": "Dodecagon"},
        {"x": 200, "y": 450, "width": 120, "height": 120, "sides": 16, "label": "16-sided Polygon"},
    ]

    for config in polygon_configs:
        polygon_element = DucPolygonElement(
            id=generate_random_id(),
            x=config["x"],
            y=config["y"],
            width=config["width"],
            height=config["height"],
            angle=random.uniform(0, 90),  # Random rotation
            opacity=random.uniform(0.8, 1.0),
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label=config["label"],
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            sides=config["sides"],
            background=create_random_background(), # Add background
            stroke=create_random_stroke() # Add stroke
        )
        elements.append(polygon_element)

    # Create some specialized ellipses with aux crosshairs
    specialized_ellipses = [
        DucEllipseElement(
            id=generate_random_id(),
            x=400,
            y=450,
            width=150,
            height=100,
            angle=30,
            opacity=0.9,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="Rotated Ellipse with Crosshair",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            ratio=0.67,
            start_angle=0,
            end_angle=360,
            show_aux_crosshair=True,
            background=create_random_background(), # Add background
            stroke=create_random_stroke() # Add stroke
        ),
        DucEllipseElement(
            id=generate_random_id(),
            x=600,
            y=350,
            width=80,
            height=140,
            angle=0,
            opacity=1.0,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="Tall Ellipse Arc",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            ratio=1.75,
            start_angle=30,
            end_angle=150,
            show_aux_crosshair=False,
            background=create_random_background(), # Add background
            stroke=create_random_stroke() # Add stroke
        )
    ]

    elements.extend(specialized_ellipses)

    # Create some complex polygons with irregular properties
    complex_polygons = [
        DucPolygonElement(
            id=generate_random_id(),
            x=600,
            y=150,
            width=60,
            height=120,  # Non-square aspect ratio
            angle=15,
            opacity=0.75,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="Tall Triangle",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            sides=3,
            background=create_random_background(), # Add background
            stroke=create_random_stroke() # Add stroke
        ),
        DucPolygonElement(
            id=generate_random_id(),
            x=700,
            y=200,
            width=140,
            height=70,  # Wide aspect ratio
            angle=45,
            opacity=0.85,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="Wide Hexagon",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            sides=6,
            background=create_random_background(), # Add background
            stroke=create_random_stroke() # Add stroke
        )
    ]

    elements.extend(complex_polygons)

    # Create app state
    app_state = AppState()

    # Test serialization and save to file
    output_file = os.path.join(test_output_dir, "test_varied_ellipses_and_polygons.duc")
    serialized_data = save_as_flatbuffers(elements, app_state, {})
    
    # Save to file
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
    
    print(f"Serialized {len(elements)} elements successfully!")
    print(f"Saved to: {output_file}")

    # Test parsing
    import io
    parsed_data = parse_duc_flatbuffers(io.BytesIO(serialized_data))
    parsed_elements = parsed_data['elements']
    parsed_app_state = parsed_data['appState']
    parsed_binary_files = parsed_data['files']
    print(f"Parsed {len(parsed_elements)} elements successfully!")

    # Verify the parsed data
    assert len(parsed_elements) == len(elements), f"Expected {len(elements)} elements, got {len(parsed_elements)}"

    # Verify all elements are ellipse or polygon elements
    ellipses_and_polygons = [e for e in parsed_elements if hasattr(e, 'sides') or hasattr(e, 'ratio')]
    assert len(ellipses_and_polygons) == len(elements), f"Expected {len(elements)} ellipse/polygon elements, got {len(ellipses_and_polygons)}"

    # Verify background and stroke are present for all elements
    for element in ellipses_and_polygons:
        assert len(element.background) > 0, f"Element {element.id} has no background"
        assert len(element.stroke) > 0, f"Element {element.id} has no stroke"
        assert element.background[0].content.src is not None, f"Element {element.id} background color is None"
        assert element.stroke[0].content.src is not None, f"Element {element.id} stroke color is None"
        assert element.stroke[0].width > 0, f"Element {element.id} stroke width is 0"

    # Check specific ellipse properties
    perfect_circle = next((e for e in ellipses_and_polygons if e.label == "Perfect Circle"), None)
    assert perfect_circle is not None, "Perfect Circle not found"
    assert perfect_circle.ratio == 1.0, f"Expected ratio 1.0, got {perfect_circle.ratio}"
    assert perfect_circle.start_angle == 0, f"Expected start_angle 0, got {perfect_circle.start_angle}"

    rotated_ellipse = next((e for e in ellipses_and_polygons if e.label == "Rotated Ellipse with Crosshair"), None)
    assert rotated_ellipse is not None, "Rotated Ellipse with Crosshair not found"
    assert rotated_ellipse.show_aux_crosshair == True, f"Expected show_aux_crosshair True, got {rotated_ellipse.show_aux_crosshair}"

    # Check specific polygon properties
    triangle = next((e for e in ellipses_and_polygons if e.label == "Triangle"), None)
    assert triangle is not None, "Triangle not found"
    assert triangle.sides == 3, f"Expected sides 3, got {triangle.sides}"

    hexagon = next((e for e in ellipses_and_polygons if e.label == "Hexagon"), None)
    assert hexagon is not None, "Hexagon not found"
    assert hexagon.sides == 6, f"Expected sides 6, got {hexagon.sides}"

    # Verify variety in angles
    angles = [e.angle for e in ellipses_and_polygons]
    assert len(set(angles)) > 1, "Expected variety in angles"

    # Verify variety in opacities
    opacities = [e.opacity for e in ellipses_and_polygons]
    assert min(opacities) < 0.8, "Expected some lower opacities"
    assert max(opacities) > 0.9, "Expected some higher opacities"

    # Verify file was created
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

    print("✅ Varied ellipses and polygons test passed!")
    print(f"   Created {len(ellipses_and_polygons)} ellipse and polygon elements")
    print(f"   Angles: {sorted(list(set(angles)))}")
    print(f"   Opacities: {min(opacities):.1f} - {max(opacities):.1f}")

if __name__ == "__main__":
    test_output_dir = os.path.join(os.path.dirname(__file__), 'test_output')
    test_create_varied_ellipses_and_polygons(test_output_dir) 