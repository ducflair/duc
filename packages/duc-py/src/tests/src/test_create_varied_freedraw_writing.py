"""
Test creating varied freedraw elements with different writing properties.
"""
import os
import math
import random
import string

from ducpy.classes.DucElementClass import DucFreeDrawElement, DucFreeDrawEnds, Point
from ducpy.classes.AppStateClass import AppState
from ducpy.serialize.serialize_duc import save_as_flatbuffers
from ducpy.parse.parse_duc import parse_duc_flatbuffers

def generate_random_id(length=8):
    """Generate a random alphanumeric ID"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color():
    """Generate a random hex color"""
    return f"#{random.randint(0, 0xFFFFFF):06x}"

def generate_handwriting_points(start_x, start_y, text_pattern="hello"):
    """Generate points that simulate handwriting"""
    points = []
    x, y = start_x, start_y
    
    if text_pattern == "hello":
        # Simulate writing "hello"
        # h
        points.extend([
            Point(x=x, y=y), Point(x=x, y=y+30),  # vertical line
            Point(x=x, y=y+15), Point(x=x+15, y=y+15),  # horizontal
            Point(x=x+15, y=y), Point(x=x+15, y=y+30)  # second vertical
        ])
        x += 25
        
        # e
        points.extend([
            Point(x=x, y=y+20), Point(x=x+10, y=y+15), Point(x=x+10, y=y+25), Point(x=x, y=y+30)
        ])
        x += 20
        
        # l
        points.extend([
            Point(x=x, y=y), Point(x=x, y=y+30)
        ])
        x += 10
        
        # l
        points.extend([
            Point(x=x, y=y), Point(x=x, y=y+30)
        ])
        x += 10
        
        # o
        for i in range(16):
            angle = i * 2 * math.pi / 16
            px = x + 8 + 6 * math.cos(angle)
            py = y + 20 + 6 * math.sin(angle)
            points.append(Point(x=px, y=py))
            
    elif text_pattern == "signature":
        # Simulate a flowing signature
        for i in range(50):
            wave_x = x + i * 3
            wave_y = y + 15 + 10 * math.sin(i * 0.3) * math.exp(-i * 0.02)
            points.append(Point(x=wave_x, y=wave_y))
            
    elif text_pattern == "scribble":
        # Random scribble pattern
        for i in range(30):
            x += random.uniform(-5, 10)
            y += random.uniform(-8, 8)
            points.append(Point(x=x, y=y))
            
    elif text_pattern == "arrow":
        # Draw an arrow shape
        points.extend([
            Point(x=x, y=y+15), Point(x=x+40, y=y+15),  # shaft
            Point(x=x+30, y=y+5), Point(x=x+40, y=y+15), Point(x=x+30, y=y+25)  # head
        ])
        
    return points

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

    for config in freedraw_configs:
        # Generate random pressure data for varying line width
        pressures = [random.uniform(0.3, 1.0) for _ in range(random.randint(10, 25))]
        
        # Generate points for the freedraw path
        path_points = []
        num_points = random.randint(5, 15)
        for i in range(num_points):
            x_offset = (i / (num_points - 1)) * config["width"]
            y_offset = (math.sin(i / (num_points - 1) * math.pi * 2) * config["height"] / 4) + (config["height"] / 2)
            path_points.append(Point(x=config["x"] + x_offset, y=config["y"] + y_offset))

        # Create start and end configurations
        start_config = DucFreeDrawEnds(
            cap=config["start_cap"],
            taper=config["start_taper"],
            easing=config["easing"]
        )
        
        end_config = DucFreeDrawEnds(
            cap=config["end_cap"],
            taper=config["end_taper"],
            easing=config["easing"]
        )
        
        freedraw_element = DucFreeDrawElement(
            id=generate_random_id(),
            x=config["x"],
            y=config["y"],
            width=config["width"],
            height=config["height"],
            angle=random.uniform(-5, 5),  # Slight random rotation
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
            points=path_points,  # Add the generated points here
            pressures=pressures,
            simulate_pressure=random.choice([True, False]),
            thinning=config["thinning"],
            smoothing=config["smoothing"],
            streamline=config["streamline"],
            easing=config["easing"],
            start=start_config,
            end=end_config,
            size=config["size"]
            # Note: svg_path is excluded as requested
        )
        elements.append(freedraw_element)

    # Create some specialized freedraw elements
    specialized_freedraws = [
        DucFreeDrawElement(
            id=generate_random_id(),
            x=50,
            y=480,
            width=120,
            height=80,
            angle=0,
            opacity=0.9,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="High Pressure Varied",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            points=[Point(x=50, y=480), Point(x=100, y=500), Point(x=170, y=490)], # Added points
            pressures=[1.0, 0.8, 0.9, 1.0, 0.7, 0.95, 0.85, 1.0],
            simulate_pressure=False,
            thinning=0.2,
            smoothing=0.6,
            streamline=0.4,
            easing="ease-in-out",
            start=DucFreeDrawEnds(cap=True, taper=0.1, easing="ease-in"),
            end=DucFreeDrawEnds(cap=True, taper=0.9, easing="ease-out"),
            size=18.0
        ),
        DucFreeDrawElement(
            id=generate_random_id(),
            x=200,
            y=480,
            width=160,
            height=60,
            angle=15,
            opacity=0.7,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="Low Pressure Consistent",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            points=[Point(x=200, y=480), Point(x=250, y=490), Point(x=300, y=485), Point(x=350, y=500)], # Added points
            pressures=[0.3, 0.35, 0.32, 0.38, 0.31, 0.36],
            simulate_pressure=True,
            thinning=0.9,
            smoothing=0.1,
            streamline=0.8,
            easing="linear",
            start=DucFreeDrawEnds(cap=False, taper=0.0, easing="linear"),
            end=DucFreeDrawEnds(cap=False, taper=0.0, easing="linear"),
            size=3.0
        ),
        DucFreeDrawElement(
            id=generate_random_id(),
            x=400,
            y=480,
            width=140,
            height=90,
            angle=-10,
            opacity=1.0,
            is_visible=True,
            is_deleted=False,
            locked=False,
            scope="main",
            label="Extreme Taper",
            group_ids=[],
            bound_elements=[],
            link="",
            frame_id="",
            z_index=len(elements) + 1,
            points=[Point(x=400, y=480), Point(x=450, y=550), Point(x=500, y=490), Point(x=540, y=520)], # Added points
            pressures=[0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5],
            simulate_pressure=False,
            thinning=0.5,
            smoothing=0.5,
            streamline=0.5,
            easing="ease",
            start=DucFreeDrawEnds(cap=True, taper=0.95, easing="ease-in"),  # Extreme start taper
            end=DucFreeDrawEnds(cap=True, taper=0.98, easing="ease-out"),    # Extreme end taper
            size=20.0
        )
    ]

    elements.extend(specialized_freedraws)

    # Create app state
    app_state = AppState()

    # Test serialization and save to file
    output_file = os.path.join(test_output_dir, "test_varied_freedraw_writing.duc")
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

    # Verify all elements are freedraw elements
    freedraw_elements = [e for e in parsed_elements if hasattr(e, 'thinning')]
    assert len(freedraw_elements) == len(elements), f"Expected {len(elements)} freedraw elements, got {len(freedraw_elements)}"

    # Check specific freedraw properties
    smooth_thick = next((e for e in freedraw_elements if e.label == "Smooth Thick Line"), None)
    assert smooth_thick is not None, "Smooth Thick Line not found"
    assert smooth_thick.thinning == 0.1, f"Expected thinning 0.1, got {smooth_thick.thinning}"
    assert smooth_thick.smoothing == 0.8, f"Expected smoothing 0.8, got {smooth_thick.smoothing}"
    assert smooth_thick.streamline == 0.7, f"Expected streamline 0.7, got {smooth_thick.streamline}"
    assert len(smooth_thick.points) > 0, "Smooth Thick Line has no points"

    rough_thin = next((e for e in freedraw_elements if e.label == "Rough Thin Line"), None)
    assert rough_thin is not None, "Rough Thin Line not found"
    assert rough_thin.thinning == 0.8, f"Expected thinning 0.8, got {rough_thin.thinning}"
    assert rough_thin.start.cap == False, f"Expected start_cap False, got {rough_thin.start.cap}"
    assert len(rough_thin.points) > 0, "Rough Thin Line has no points"

    calligraphy = next((e for e in freedraw_elements if e.label == "Calligraphy Style"), None)
    assert calligraphy is not None, "Calligraphy Style not found"
    assert calligraphy.start.taper == 0.5, f"Expected start_taper 0.5, got {calligraphy.start.taper}"
    assert calligraphy.end.taper == 0.8, f"Expected end_taper 0.8, got {calligraphy.end.taper}"
    assert len(calligraphy.points) > 0, "Calligraphy Style has no points"

    extreme_taper = next((e for e in freedraw_elements if e.label == "Extreme Taper"), None)
    assert extreme_taper is not None, "Extreme Taper not found"
    assert extreme_taper.start.taper == 0.95, f"Expected start_taper 0.95, got {extreme_taper.start.taper}"
    assert extreme_taper.end.taper == 0.98, f"Expected end_taper 0.98, got {extreme_taper.end.taper}"
    assert len(extreme_taper.points) > 0, "Extreme Taper has no points"

    # Verify pressure data
    high_pressure = next((e for e in freedraw_elements if e.label == "High Pressure Varied"), None)
    assert high_pressure is not None, "High Pressure Varied not found"
    assert len(high_pressure.pressures) == 8, f"Expected 8 pressure points, got {len(high_pressure.pressures)}"
    assert max(high_pressure.pressures) == 1.0, f"Expected max pressure 1.0, got {max(high_pressure.pressures)}"
    assert len(high_pressure.points) > 0, "High Pressure Varied has no points"

    low_pressure = next((e for e in freedraw_elements if e.label == "Low Pressure Consistent"), None)
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