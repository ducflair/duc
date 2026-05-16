import os
import ducpy as duc
import ducpy.serialize
from ducpy.builders.style_builders import create_fill_and_stroke_style, create_simple_styles, create_solid_content
from ducpy.classes.DataStateClass import ExportedDataState

def test_empire_state_floor_plan(test_output_dir):
    elements = []

    def create_wall(x1, y1, x2, y2, label=""):
        return (duc.ElementBuilder()
            .with_label(label)
            .with_styles(create_simple_styles(
                strokes=[duc.create_stroke(create_solid_content("#000000"), width=2.0)]
            ))
            .build_linear_element()
            .with_points([(x1, y1), (x2, y2)])
            .build())

    def create_rect(x, y, w, h, fill_color="#CCCCCC", stroke_color="#000000", label=""):
        return (duc.ElementBuilder()
            .at_position(x, y)
            .with_size(w, h)
            .with_label(label)
            .with_styles(create_fill_and_stroke_style(
                fill_content=create_solid_content(fill_color),
                stroke_content=create_solid_content(stroke_color),
                stroke_width=1.5
            ))
            .build_rectangle()
            .build())

    floor_outline_points = [
        (-40, -50), (-40, -97), (40, -97), (40, -50),
        (50, -40), (100, -40), (100, 40), (50, 40),
        (40, 50), (40, 97), (-40, 97), (-40, 50),
        (-50, 40), (-100, 40), (-100, -40), (-50, -40),
        (-40, -50),
    ]

    for i in range(len(floor_outline_points) - 1):
        p1 = floor_outline_points[i]
        p2 = floor_outline_points[i + 1]
        elements.append(create_wall(p1[0], p1[1], p2[0], p2[1]))

    elements.append(create_rect(-35, -25, 30, 50, "#E0E0E0", "#000000", "West Elevator Core"))
    elements.append(create_rect(5, -25, 30, 50, "#E0E0E0", "#000000", "East Elevator Core"))
    elements.append(create_rect(-15, -45, 30, 15, "#D0D0D0", "#000000", "North Elevator Bank"))
    elements.append(create_rect(-15, 30, 30, 15, "#D0D0D0", "#000000", "South Elevator Bank"))

    for x, y, w, h, label in [(-40, -30, 5, 10, "Stair NW"), (-40, 20, 5, 10, "Stair SW"), (35, -30, 5, 10, "Stair NE"), (35, 20, 5, 10, "Stair SE")]:
        elements.append(create_rect(x, y, w, h, "#C0C0C0", "#000000", label))

    column_size = 3
    for x in [-30, -15, 0, 15, 30]:
        elements.append(create_rect(x - column_size/2, -70 - column_size/2, column_size, column_size, "#808080", "#000000"))
        elements.append(create_rect(x - column_size/2, 70 - column_size/2, column_size, column_size, "#808080", "#000000"))
    for y in [-30, -15, 0, 15, 30]:
        elements.append(create_rect(-70 - column_size/2, y - column_size/2, column_size, column_size, "#808080", "#000000"))
        elements.append(create_rect(70 - column_size/2, y - column_size/2, column_size, column_size, "#808080", "#000000"))

    for x1, y1, x2, y2, label in [(-50, -25, -5, -25, "Corridor N"), (-50, 25, -5, 25, "Corridor S"), (5, -25, 50, -25, "Corridor N"), (5, 25, 50, 25, "Corridor S"), (-35, -50, -35, -30, "Wall W1"), (-35, 30, -35, 50, "Wall W2"), (35, -50, 35, -30, "Wall E1"), (35, 30, 35, 50, "Wall E2")]:
        elements.append(create_wall(x1, y1, x2, y2, label))

    title_text = (duc.ElementBuilder()
        .at_position(-50, 110)
        .with_size(100, 15)
        .with_label("Title")
        .with_styles(create_simple_styles(opacity=1.0))
        .build_text_element()
        .with_text("EMPIRE STATE BUILDING - TYPICAL FLOOR PLAN (6th-20th Floors)")
        .build())
    elements.append(title_text)

    global_state = (duc.StateBuilder().build_global_state().with_main_scope("ft").build())
    local_state = (duc.StateBuilder().build_local_state().build())

    serialized_bytes = ducpy.serialize.serialize_duc(
        name="empire_state_floor_plan",
        elements=elements
    )

    output_file_path = os.path.join(test_output_dir, "test_empire_state_floor_plan.duc")
    with open(output_file_path, "wb") as f:
        f.write(serialized_bytes)

    assert os.path.exists(output_file_path)
    assert os.path.getsize(output_file_path) > 0
    print(f"Empire State floor plan created successfully at {output_file_path}")
