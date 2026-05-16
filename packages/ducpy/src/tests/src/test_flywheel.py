import math
import os
import ducpy as duc
from ducpy.builders.style_builders import create_fill_and_stroke_style, create_simple_styles, create_solid_content, create_text_style

def test_create_flywheel(test_output_dir):
    center_x, center_y = 400, 300
    outer_radius, rim_thickness = 200, 30
    inner_radius = outer_radius - rim_thickness
    hub_radius, spoke_count = 40, 6

    elements = []

    outer_rim = (duc.ElementBuilder()
        .at_position(center_x - outer_radius, center_y - outer_radius)
        .with_size(outer_radius * 2, outer_radius * 2)
        .with_label("Outer Rim")
        .with_styles(create_fill_and_stroke_style(fill_content=create_solid_content("#4A90D9"), stroke_content=create_solid_content("#1E3A5F"), stroke_width=2.0))
        .build_ellipse().build())
    elements.append(outer_rim)

    inner_bg = (duc.ElementBuilder()
        .at_position(center_x - inner_radius, center_y - inner_radius)
        .with_size(inner_radius * 2, inner_radius * 2)
        .with_label("Inner Background")
        .with_styles(create_fill_and_stroke_style(fill_content=create_solid_content("#E8F0F8"), stroke_content=create_solid_content("#1E3A5F"), stroke_width=1.0))
        .build_ellipse().build())
    elements.append(inner_bg)

    hub = (duc.ElementBuilder()
        .at_position(center_x - hub_radius, center_y - hub_radius)
        .with_size(hub_radius * 2, hub_radius * 2)
        .with_label("Hub")
        .with_styles(create_fill_and_stroke_style(fill_content=create_solid_content("#2C5F8A"), stroke_content=create_solid_content("#1E3A5F"), stroke_width=2.0))
        .build_ellipse().build())
    elements.append(hub)

    center_hole = (duc.ElementBuilder()
        .at_position(center_x - 15, center_y - 15).with_size(30, 30)
        .with_label("Center Hole")
        .with_styles(create_fill_and_stroke_style(fill_content=create_solid_content("#1A3A52"), stroke_content=create_solid_content("#1E3A5F"), stroke_width=1.0))
        .build_ellipse().build())
    elements.append(center_hole)

    for i in range(spoke_count):
        a = (2 * math.pi * i) / spoke_count
        spoke = (duc.ElementBuilder()
            .with_label(f"Spoke {i}")
            .with_styles(create_simple_styles(strokes=[duc.create_stroke(create_solid_content("#5BA3E6"), width=20.0)]))
            .build_linear_element()
            .with_points([(center_x + hub_radius * math.cos(a), center_y + hub_radius * math.sin(a)), (center_x + (inner_radius - 5) * math.cos(a), center_y + (inner_radius - 5) * math.sin(a))])
            .build())
        elements.append(spoke)

    for i in range(4):
        a = (2 * math.pi * i) / 4 + math.pi / 4
        bx, by = center_x + 25 * math.cos(a), center_y + 25 * math.sin(a)
        bolt = (duc.ElementBuilder()
            .at_position(bx - 5, by - 5).with_size(10, 10).with_label(f"Bolt {i}")
            .with_styles(create_fill_and_stroke_style(fill_content=create_solid_content("#1A3A52"), stroke_content=create_solid_content("#1E3A5F"), stroke_width=1.0))
            .build_ellipse().build())
        elements.append(bolt)

    label = (duc.ElementBuilder()
        .at_position(center_x - 50, center_y + outer_radius + 40).with_size(200, 30)
        .with_label("Flywheel Label").with_styles(create_simple_styles(opacity=1.0))
        .build_text_element().with_text("Flywheel").build())
    elements.append(label)

    duc_bytes = duc.serialize_duc(name="flywheel", elements=elements)
    
    output_file_path = os.path.join(test_output_dir, "test_flywheel.duc")
    with open(output_file_path, "wb") as f:
        f.write(duc_bytes)
        
    assert os.path.exists(output_file_path)
    assert os.path.getsize(output_file_path) > 0
    print(f"Flywheel created successfully at {output_file_path}")
