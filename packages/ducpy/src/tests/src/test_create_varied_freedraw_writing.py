"""
Test creating varied freedraw elements with different writing properties.
"""
import os
import math
import random
import string

import ducpy as duc
import io

def generate_random_id_deprecated(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color_deprecated():
    return f"#{random.randint(0, 0xFFFFFF):06x}"

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
            path_points.append((config["x"] + x_offset, config["y"] + y_offset)) # Pass tuples directly

        import numpy as np
        # Use the new ElementBuilder API for freedraw elements
        freedraw_element = (duc.ElementBuilder()
                           .at_position(config["x"], config["y"])
                           .with_size(config["width"], config["height"])
                           .with_label(config["label"])
                           .build_freedraw_element()
                           .with_points(path_points)
                           .with_pressures(np.array(pressures, dtype=np.float32))
                           .with_size_thickness(config["size"])
                           .with_thinning(config["thinning"])
                           .with_smoothing(config["smoothing"])
                           .with_streamline(config["streamline"])
                           .with_easing(config["easing"])
                           .with_start_cap(config["start_cap"])
                           .with_start_taper(config["start_taper"])
                           .with_start_easing(config["easing"])
                           .with_end_cap(config["end_cap"])
                           .with_end_taper(config["end_taper"])
                           .with_end_easing(config["easing"])
                           .build())

        elements.append(freedraw_element)

    # Determine output path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    
    os.makedirs(output_dir, exist_ok=True)
    output_file_name = "test_varied_freedraw_writing.duc"
    output_file_path = os.path.join(output_dir, output_file_name)

    # Serialize using the new io API
    serialized_bytes = duc.serialize_duc(
        name="VariedFreedrawWritingTest",
        elements=elements
    )

    assert serialized_bytes is not None, "Serialization returned None"
    assert len(serialized_bytes) > 0, "Serialization returned empty bytes"

    # Write the serialized bytes to a .duc file
    with open(output_file_path, "wb") as f:
        f.write(serialized_bytes)

    print(f"Successfully serialized varied freedraw elements to: {output_file_path}")
    print(f"You can now test this file with: flatc --json -o <output_json_dir> schema/duc.fbs -- {output_file_path}")

if __name__ == "__main__":
    # Allow running the test directly for quick checks, e.g., during development
    import pytest # type: ignore
    pytest.main([__file__])
