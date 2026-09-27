#!/usr/bin/env python3
"""Create two colored Python Model elements with a reusable CAD dependency."""

import tempfile

import ducpy as duc


SCREW_MODEL_ID = "socket_head_screw"
HOUSING_MODEL_ID = "bolted_bearing_housing"


def socket_head_screw_model_code():
    from build123d import (
        Axis,
        BuildPart,
        BuildSketch,
        Cone,
        Cylinder,
        Locations,
        Mode,
        RegularPolygon,
        extrude,
    )
    from ocp_vscode import show

    shank_diameter = 6.0
    shank_length = 18.0
    head_diameter = 10.0
    head_height = 5.0
    socket_radius = 2.4
    socket_depth = 3.0
    tip_length = 1.5
    thread_pitch = 1.5
    thread_depth = 0.35

    screw_color = (0.72, 0.76, 0.82)

    def make_socket_head_screw(
        shank_diameter=shank_diameter,
        shank_length=shank_length,
        head_diameter=head_diameter,
        head_height=head_height,
        socket_radius=socket_radius,
        socket_depth=socket_depth,
        tip_length=tip_length,
        thread_pitch=thread_pitch,
        thread_depth=thread_depth,
    ):
        shank_radius = shank_diameter / 2
        thread_height = min(0.45, thread_pitch * 0.35)

        with BuildPart() as screw:
            with Locations((0, 0, -shank_length)):
                Cylinder(shank_radius, shank_length)

            Cylinder(head_diameter / 2, head_height)

            with Locations((0, 0, -shank_length - tip_length)):
                Cone(0, shank_radius, tip_length)

            ridge_count = max(1, int(shank_length / thread_pitch))
            for index in range(ridge_count):
                ridge_z = -shank_length + index * thread_pitch
                with Locations((0, 0, ridge_z)):
                    Cylinder(shank_radius + thread_depth, thread_height)

            with BuildSketch(screw.faces().sort_by(Axis.Z)[-1]):
                RegularPolygon(radius=socket_radius, side_count=6)

            extrude(amount=-socket_depth, mode=Mode.SUBTRACT)

        return screw.part

    preview_screw = make_socket_head_screw()
    show(
        preview_screw,
        names=["Socket Head Screw"],
        colors=[screw_color],
    )


def bolted_bearing_housing_model_code():
    from math import cos, radians, sin

    from build123d import BuildPart, Cylinder, Location, Locations, Mode
    from ocp_vscode import show

    from duc_model.socket_head_screw import make_socket_head_screw

    flange_radius = 50.0
    flange_height = 10.0
    hub_radius = 28.0
    hub_height = 28.0
    shaft_radius = 12.0
    bolt_count = 8
    bolt_circle_radius = 40.0
    bolt_clearance_diameter = 6.8

    housing_color = (0.76, 0.32, 0.10)
    screw_color = (0.72, 0.76, 0.82)

    with BuildPart() as bearing_housing:
        Cylinder(flange_radius, flange_height)
        Cylinder(hub_radius, hub_height)
        Cylinder(shaft_radius, hub_height, mode=Mode.SUBTRACT)

        bolt_locations = []
        for index in range(bolt_count):
            angle = 360.0 * index / bolt_count
            x = bolt_circle_radius * cos(radians(angle))
            y = bolt_circle_radius * sin(radians(angle))
            bolt_locations.append((x, y))

            with Locations((x, y, 0)):
                Cylinder(
                    bolt_clearance_diameter / 2,
                    flange_height,
                    mode=Mode.SUBTRACT,
                )

    assembly_screw = make_socket_head_screw(
        shank_diameter=6.0,
        shank_length=9.0,
        head_diameter=10.0,
        head_height=5.0,
        socket_radius=2.4,
        socket_depth=3.0,
    )
    screws = [
        assembly_screw.moved(Location((x, y, flange_height)))
        for x, y in bolt_locations
    ]

    show(
        bearing_housing.part,
        *screws,
        names=[
            "Bearing Housing",
            *[f"Socket Head Screw {index + 1}" for index in range(len(screws))],
        ],
        colors=[housing_color, *([screw_color] * len(screws))],
    )


def main():
    print("Modular Model Elements Demo")
    print("=" * 30)

    screw_code = duc.extract_embedded_code(socket_head_screw_model_code)
    screw_model = (
        duc.ElementBuilder()
        .with_id(SCREW_MODEL_ID)
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Socket Head Screw")
        .build_model_element()
        .with_code(screw_code)
        .build()
    )

    housing_code = duc.extract_embedded_code(bolted_bearing_housing_model_code)
    housing_model = (
        duc.ElementBuilder()
        .with_id(HOUSING_MODEL_ID)
        .at_position(120.0, 0.0)
        .with_size(180.0, 180.0)
        .with_label("Bolted Bearing Housing")
        .build_model_element()
        .with_code(housing_code)
        .build()
    )

    output = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    output.close()

    # Modular imports resolve against the complete element set in Scopture.
    # Ducpy's embedded-code validator currently executes each model in isolation.
    duc_path = duc.serialize_duc(
        name="modular_model_elements_example",
        output_path=output.name,
        elements=[screw_model, housing_model],
        validate_embedded_code=False,
    )

    print(f"Created reusable screw Model element: {SCREW_MODEL_ID}")
    print(f"Created importing housing Model element: {HOUSING_MODEL_ID}")
    print(f"Successfully serialized DUC file to {duc_path}.")
    return duc_path


if __name__ == "__main__":
    main()
