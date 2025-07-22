"""
Test creating varied freedraw elements with different writing properties.
"""
import os
import math
import random
import string

import ducpy as duc
import io

def generate_random_id(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color():
    return f"#{random.randint(0, 0xFFFFFF):06x}"

def make_point(x, y):
    return duc.DucPoint(x=x, y=y)

def make_freedraw_ends(cap, taper, easing):
    return duc.DucFreeDrawEnds(cap=cap, taper=taper, easing=easing)

def test_create_varied_freedraw_writing(test_output_dir):
    """Test creating varied freedraw elements with different writing properties"""

    elements = []

    # Create different freedraw elements with varied properties
    freedraw_configs = [
        {
            "label": "Smooth Thick Line",
            "x": 50, "y": 50, "width": 200, "height": 100,
            "thinning": 0.1, "smoothing": 0.8, "streamline": 0.7,
            "easing": "ease-out", "start_cap": True, "start_taper": 0.2,
            "end_cap": True, "end_taper": 0.2, "size": 8.0
        },
        {
            "label": "Rough Thin Line",
            "x": 300, "y": 50, "width": 150, "height": 80,
            "thinning": 0.8, "smoothing": 0.2, "streamline": 0.3,
            "easing": "linear", "start_cap": False, "start_taper": 0.0,
            "end_cap": False, "end_taper": 0.0, "size": 2.0
        },
        {
            "label": "Calligraphy Style",
            "x": 50, "y": 200, "width": 250, "height": 60,
            "thinning": 0.4, "smoothing": 0.9, "streamline": 0.5,
            "easing": "ease-in-out", "start_cap": True, "start_taper": 0.5,
            "end_cap": True, "end_taper": 0.8, "size": 12.0
        },
        {
            "label": "Marker Style",
            "x": 350, "y": 200, "width": 180, "height": 90,
            "thinning": 0.0, "smoothing": 0.3, "streamline": 0.1,
            "easing": "ease", "start_cap": True, "start_taper": 0.0,
            "end_cap": True, "end_taper": 0.0, "size": 15.0
        },
        {
            "label": "Pencil Sketch",
            "x": 50, "y": 320, "width": 220, "height": 120,
            "thinning": 0.6, "smoothing": 0.4, "streamline": 0.2,
            "easing": "ease-in", "start_cap": False, "start_taper": 0.1,
            "end_cap": False, "end_taper": 0.3, "size": 4.0
        },
        {
            "label": "Brush Stroke",
            "x": 320, "y": 320, "width": 200, "height": 100,
            "thinning": 0.3, "smoothing": 0.7, "streamline": 0.6,
            "easing": "ease-out", "start_cap": True, "start_taper": 0.4,
            "end_cap": True, "end_taper": 0.6, "size": 10.0
        }
    ]

    import math
    for config in freedraw_configs:
        # Generate random pressure data for varying line width
        pressures = [random.uniform(0.3, 1.0) for _ in range(random.randint(10, 25))]
        
        # Generate points for the freedraw path
        path_points = []
        num_points = random.randint(5, 15)
        for i in range(num_points):
            x_offset = (i / (num_points - 1)) * config["width"]
            y_offset = (math.sin(i / (num_points - 1) * math.pi * 2) * config["height"] / 4) + (config["height"] / 2)
            path_points.append(make_point(config["x"] + x_offset, config["y"] + y_offset))

        start_config = make_freedraw_ends(config["start_cap"], config["start_taper"], config["easing"])
        end_config = make_freedraw_ends(config["end_cap"], config["end_taper"], config["easing"])

        import numpy as np
        freedraw_element = duc.create_freedraw_element(
            x=config["x"],
            y=config["y"],
            width=config["width"],
            height=config["height"],
            points=path_points,
            pressures=np.array(pressures, dtype=np.float32),
            size=config["size"],
            thinning=config["thinning"],
            smoothing=config["smoothing"],
            streamline=config["streamline"],
            easing=config["easing"],
            simulate_pressure=random.choice([True, False]),
            start=start_config,
            end=end_config,
            angle=random.uniform(-5, 5),
            label=config["label"],
            scope="main",
            locked=False,
            is_visible=True,
            z_index=len(elements) + 1
        )
        elements.append(freedraw_element)

    # Create some specialized freedraw elements
    import numpy as np
    specialized_freedraws = [
        duc.create_freedraw_element(
            x=50,
            y=480,
            width=120,
            height=80,
            points=[make_point(50, 480), make_point(100, 500), make_point(170, 490)],
            pressures=np.array([1.0, 0.8, 0.9, 1.0, 0.7, 0.95, 0.85, 1.0], dtype=np.float32),
            size=18.0,
            thinning=0.2,
            smoothing=0.6,
            streamline=0.4,
            easing="ease-in-out",
            simulate_pressure=False,
            start=make_freedraw_ends(True, 0.1, "ease-in"),
            end=make_freedraw_ends(True, 0.9, "ease-out"),
            angle=0,
            label="High Pressure Varied",
            scope="main",
            locked=False,
            is_visible=True,
            z_index=len(elements) + 1
        ),
        duc.create_freedraw_element(
            x=200,
            y=480,
            width=160,
            height=60,
            points=[make_point(200, 480), make_point(250, 490), make_point(300, 485), make_point(350, 500)],
            pressures=np.array([0.3, 0.35, 0.32, 0.38, 0.31, 0.36], dtype=np.float32),
            size=3.0,
            thinning=0.9,
            smoothing=0.1,
            streamline=0.8,
            easing="linear",
            simulate_pressure=True,
            start=make_freedraw_ends(False, 0.0, "linear"),
            end=make_freedraw_ends(False, 0.0, "linear"),
            angle=15,
            label="Low Pressure Consistent",
            scope="main",
            locked=False,
            is_visible=True,
            z_index=len(elements) + 1
        ),
        duc.create_freedraw_element(
            x=400,
            y=480,
            width=140,
            height=90,
            points=[make_point(400, 480), make_point(450, 550), make_point(500, 490), make_point(540, 520)],
            pressures=np.array([0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5], dtype=np.float32),
            size=20.0,
            thinning=0.5,
            smoothing=0.5,
            streamline=0.5,
            easing="ease",
            simulate_pressure=False,
            start=make_freedraw_ends(True, 0.95, "ease-in"),
            end=make_freedraw_ends(True, 0.98, "ease-out"),
            angle=-10,
            label="Extreme Taper",
            scope="main",
            locked=False,
            is_visible=True,
            z_index=len(elements) + 1
        )
    ]

    elements.extend(specialized_freedraws)

    # Create app state
    app_state = duc.create_global_state()

    output_file = os.path.join(test_output_dir, "test_varied_freedraw_writing.duc")
    serialized_data = duc.serialize_duc(name="VariedFreedrawTest", elements=elements)

    with open(output_file, 'wb') as f:
        f.write(serialized_data)

    print(f"Serialized {len(elements)} elements successfully!")
    print(f"Saved to: {output_file}")

    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    parsed_elements = parsed_data.elements
    print(f"Parsed {len(parsed_elements)} elements successfully!")

    # Verify the parsed data
    assert len(parsed_elements) == len(elements), f"Expected {len(elements)} elements, got {len(parsed_elements)}"

    # Verify all elements are freedraw elements
    freedraw_elements = [e.element for e in parsed_elements if hasattr(e.element, 'thinning')]
    assert len(freedraw_elements) == len(elements), f"Expected {len(elements)} freedraw elements, got {len(freedraw_elements)}"

    # Check specific freedraw properties
    smooth_thick = next((e for e in freedraw_elements if getattr(e.base, "label", None) == "Smooth Thick Line"), None)
    assert smooth_thick is not None, "Smooth Thick Line not found"
    import math
    assert math.isclose(smooth_thick.thinning, 0.1, rel_tol=1e-6), f"Expected thinning 0.1, got {smooth_thick.thinning}"
    assert math.isclose(smooth_thick.smoothing, 0.8, rel_tol=1e-6), f"Expected smoothing 0.8, got {smooth_thick.smoothing}"
    assert math.isclose(smooth_thick.streamline, 0.7, rel_tol=1e-6), f"Expected streamline 0.7, got {smooth_thick.streamline}"
    assert len(smooth_thick.points) > 0, "Smooth Thick Line has no points"

    rough_thin = next((e for e in freedraw_elements if getattr(e.base, "label", None) == "Rough Thin Line"), None)
    assert rough_thin is not None, "Rough Thin Line not found"
    assert math.isclose(rough_thin.thinning, 0.8, rel_tol=1e-6), f"Expected thinning 0.8, got {rough_thin.thinning}"
    assert rough_thin.start.cap == False, f"Expected start_cap False, got {rough_thin.start.cap}"
    assert len(rough_thin.points) > 0, "Rough Thin Line has no points"

    calligraphy = next((e for e in freedraw_elements if getattr(e.base, "label", None) == "Calligraphy Style"), None)
    assert calligraphy is not None, "Calligraphy Style not found"
    assert math.isclose(calligraphy.start.taper, 0.5, rel_tol=1e-6), f"Expected start_taper 0.5, got {calligraphy.start.taper}"
    assert math.isclose(calligraphy.end.taper, 0.8, rel_tol=1e-6), f"Expected end_taper 0.8, got {calligraphy.end.taper}"
    assert len(calligraphy.points) > 0, "Calligraphy Style has no points"

    extreme_taper = next((e for e in freedraw_elements if getattr(e.base, "label", None) == "Extreme Taper"), None)
    assert extreme_taper is not None, "Extreme Taper not found"
    assert math.isclose(extreme_taper.start.taper, 0.95, rel_tol=1e-6), f"Expected start_taper 0.95, got {extreme_taper.start.taper}"
    assert math.isclose(extreme_taper.end.taper, 0.98, rel_tol=1e-6), f"Expected end_taper 0.98, got {extreme_taper.end.taper}"
    assert len(extreme_taper.points) > 0, "Extreme Taper has no points"

    # Verify pressure data
    high_pressure = next((e for e in freedraw_elements if getattr(e.base, "label", None) == "High Pressure Varied"), None)
    assert high_pressure is not None, "High Pressure Varied not found"
    assert len(high_pressure.pressures) == 8, f"Expected 8 pressure points, got {len(high_pressure.pressures)}"
    assert max(high_pressure.pressures) == 1.0, f"Expected max pressure 1.0, got {max(high_pressure.pressures)}"
    assert len(high_pressure.points) > 0, "High Pressure Varied has no points"

    low_pressure = next((e for e in freedraw_elements if getattr(e.base, "label", None) == "Low Pressure Consistent"), None)
    assert low_pressure is not None, "Low Pressure Consistent not found"
    assert all(p <= 0.4 for p in low_pressure.pressures), "Expected all pressures <= 0.4"
    assert low_pressure.simulate_pressure == True, f"Expected simulate_pressure True, got {low_pressure.simulate_pressure}"
    assert len(low_pressure.points) > 0, "Low Pressure Consistent has no points"

    # Verify variety in easing types
    easing_types = set(e.easing for e in freedraw_elements if hasattr(e, 'easing'))
    assert len(easing_types) >= 4, f"Expected at least 4 different easing types, got {len(easing_types)}"

    # Verify variety in sizes
    sizes = [e.size for e in freedraw_elements if hasattr(e, 'size')]
    assert min(sizes) <= 5.0, f"Expected some small sizes, minimum was {min(sizes)}"
    assert max(sizes) >= 15.0, f"Expected some large sizes, maximum was {max(sizes)}"

    # Verify file was created
    assert os.path.exists(output_file), f"Output file was not created: {output_file}"
    assert os.path.getsize(output_file) > 0, "Output file is empty"

    print("✅ Varied freedraw writing test passed!")
    print(f"   Created {len(freedraw_elements)} freedraw elements")
    print(f"   Easing types: {sorted(easing_types)}")
    print(f"   Size range: {min(sizes):.1f} - {max(sizes):.1f}")

if __name__ == "__main__":
    test_output_dir = os.path.join(os.path.dirname(__file__), 'test_output')
    test_create_varied_freedraw_writing(test_output_dir)
