#!/usr/bin/env python3
"""
Example demonstrating how to serialize the HVAC Elbow Duct model element in DUC
using the ElementBuilder API.
"""

import os
import sys
import ducpy as duc


def hvac_elbow_duct_model_code():
    import math
    from build123d import BuildPart, Circle, Plane, Vector, loft, add, extrude, Mode, BuildSketch
    from ocp_vscode import show

    # Parameters for the HVAC duct
    pipe_radius = 0.189
    wall_thickness = 0.003
    bend_radius = 0.42
    total_angle = 90
    num_segments = 3
    extension_len = 0.15  # Length of straight section
    bead_width = 0.010
    bead_height = 0.004

    # Calculate planes along the elbow path
    path_planes = []
    elbow_joint_indices = []
    elbow_planes = []
    segment_step = total_angle / num_segments

    for i in range(num_segments + 1):
        angle_deg = i * segment_step
        theta = math.radians(angle_deg)
        x = bend_radius * math.cos(theta)
        y = bend_radius * math.sin(theta)
        nx = -math.sin(theta)
        ny = math.cos(theta)
        p = Plane(origin=(x, y, 0), z_dir=(nx, ny, 0))
        elbow_planes.append(p)

    # Inlet start plane
    p_inlet = Plane(
        origin=elbow_planes[0].origin - Vector(elbow_planes[0].z_dir) * extension_len,
        z_dir=elbow_planes[0].z_dir
    )
    path_planes.append(p_inlet)

    # Elbow joint planes
    for p in elbow_planes:
        path_planes.append(p)
        elbow_joint_indices.append(len(path_planes) - 1)

    # Outlet end plane
    p_outlet = Plane(
        origin=elbow_planes[-1].origin + Vector(elbow_planes[-1].z_dir) * extension_len,
        z_dir=elbow_planes[-1].z_dir
    )
    path_planes.append(p_outlet)

    # Build the 3D duct assembly
    with BuildPart() as assembly:
        # Outer shell
        outer_profiles = []
        for p in path_planes:
            with BuildSketch(p) as s:
                Circle(pipe_radius)
            outer_profiles.append(s.sketch)
        outer_shell = loft(outer_profiles, ruled=True)
        add(outer_shell)

        # Connection rings at elbow joints
        for idx in elbow_joint_indices:
            p = path_planes[idx]
            with BuildPart() as ring:
                with BuildSketch(p):
                    Circle(pipe_radius + bead_height)
                extrude(amount=bead_width / 2, both=True)
            add(ring.part)

        # Subtractive hollow core
        inner_profiles = []
        for p in path_planes:
            with BuildSketch(p) as s:
                Circle(pipe_radius - wall_thickness)
            inner_profiles.append(s.sketch)
        inner_core = loft(inner_profiles, ruled=True)
        add(inner_core, mode=Mode.SUBTRACT)

    show(assembly, colors=[(200 / 255, 200 / 255, 205 / 255)])

HVAC_DUCT_CODE = duc.extract_embedded_code(hvac_elbow_duct_model_code)


HVAC_DUCT_VIEWER_STATE = {
    "camera": {
        "control": "orbit",
        "ortho": True,
        "up": "Z",
        "position": [2.1296042688814523, -1.1538968560970193, 1.638102756318444],
        "quaternion": [0.41247273362316755, 0.20961100245620948, 0.4016311806263611, 0.7903302261810627],
        "target": [0.23147000372409818, 0.23138003051280973, 0.00002999603748321534],
        "zoom": 1,
        "panSpeed": 1,
        "rotateSpeed": 1,
        "zoomSpeed": 1,
        "holroyd": False
    },
    "display": {
        "wireframe": False,
        "transparent": False,
        "blackEdges": True,
        "grid": {
            "type": "perPlane",
            "value": {
                "xy": False,
                "xz": False,
                "yz": False
            }
        },
        "axesVisible": False,
        "axesAtOrigin": False
    },
    "material": {
        "metalness": 0.5099999904632568,
        "roughness": 0.5099999904632568,
        "defaultOpacity": 0.5,
        "edgeColor": 7368816,
        "ambientIntensity": 0.6200000047683716,
        "directIntensity": 1.5299999713897705
    },
    "clipping": {
        "x": {"enabled": False, "value": 0, "normal": None},
        "y": {"enabled": False, "value": 0, "normal": None},
        "z": {"enabled": False, "value": 0, "normal": None},
        "intersection": False,
        "showPlanes": False,
        "objectColorCaps": False
    },
    "explode": {
        "active": False,
        "value": 0
    },
    "zebra": {
        "active": False,
        "stripeCount": 6,
        "stripeDirection": 0,
        "colorScheme": "grayscale",
        "opacity": 1,
        "mappingMode": "reflection"
    }
}

def main():
    print("HVAC Elbow Duct Example")
    print("=" * 30)

    bg_content = duc.ElementContentBase(
        preference=duc.ELEMENT_CONTENT_PREFERENCE.SOLID,
        src="#808080",
        visible=False,
        opacity=0.1,
        tiling=None,
        hatch=None,
        image_filter=duc.DucImageFilter(brightness=1.0, contrast=1.0)
    )
    bg = duc.ElementBackground(content=bg_content)

    stroke_content = duc.ElementContentBase(
        preference=duc.ELEMENT_CONTENT_PREFERENCE.SOLID,
        src="#808080",
        visible=False,
        opacity=1.0,
        tiling=None,
        hatch=None,
        image_filter=duc.DucImageFilter(brightness=1.0, contrast=1.0)
    )
    stroke_style = duc.StrokeStyle(
        preference=duc.STROKE_PREFERENCE.SOLID,
        cap=duc.STROKE_CAP.BUTT,
        join=duc.STROKE_JOIN.MITER,
        dash=[],
        dash_line_override=None,
        dash_cap=None,
        miter_limit=4.0
    )
    stroke = duc.ElementStroke(
        content=stroke_content,
        width=2.0,
        style=stroke_style,
        placement=duc.STROKE_PLACEMENT.INSIDE,
        stroke_sides=None
    )

    hvac_styles = duc.DucElementStylesBase(
        roundness=0.0,
        background=[bg],
        stroke=[stroke],
        opacity=1.0,
        blending=None
    )

    # Create the element builder
    builder = (
        duc.ElementBuilder()
        .at_position(-1409.5161844893837, -66.90854908297945)
        .with_size(309.36387103264786, 416.37129344905503)
        .with_scope("m")
        .with_label("Elbow Duct Model")
        .with_styles(hvac_styles)
    )

    elbow_duct_element = (
        builder
        .build_model_element()
        .with_model_type("python")
        .with_code(HVAC_DUCT_CODE)
        .with_viewer_state(HVAC_DUCT_VIEWER_STATE)
        .build()
    )

    print(f"   Created Model Element ID: {elbow_duct_element.element.base.id}")
    print(f"   Class: {type(elbow_duct_element.element).__name__}, Model Type: {elbow_duct_element.element.model_type}")

    # 2. Serialize to binary .duc file
    duc_bytes = duc.serialize_duc(
        name="hvac_elbow_duct_example",
        elements=[elbow_duct_element],
        validate_embedded_code=True
    )
    print(f"   Successfully serialized DUC file containing {len(duc_bytes)} bytes.")
    print("✅ HVAC Elbow Duct example successfully complete!")
    return duc_bytes

if __name__ == "__main__":
    main()

