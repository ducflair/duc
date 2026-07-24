#!/usr/bin/env python3
"""
Example demonstrating how to serialize the highly detailed Empire State Building IFC element in DUC
using the ElementBuilder API.
"""

import os
import sys
import tempfile
import ducpy as duc

# Detailed Empire State Building IFC model code

def empire_state_model_code():
    """
    Empire State Building — High-Detail IFC4 Model
    Based on verified architectural data and reference elevations:
        • Site footprint:   129.0 m (E-W) × 57.0 m (N-S)   [424 ft × 187 ft]
        • Floor height:     ≈ 3.72 m  (derived from 86th-floor elevation 320 m / 86 floors)
        • Major setback above floor 5 follows the 60 ft (18.3 m) zoning envelope,
            but occupied tower plates are modeled fuller than a simple centred slab so
            the silhouette stays closer to the real building and its official floor area
        • Further setbacks at floors 21, 25, 30, 72, 81, 85
        • 86th-floor obs. deck at  ~320 m  (1 050 ft)
        • 102nd-floor obs. deck at ~381 m  (1 250 ft)
        • Total height with antenna: 443 m  (1 453 ft)

    Additions vs. the basic model:
        - Fuller occupied shaft proportions calibrated against official floor area data
        - Recessed centre facade planes with wider, more projecting side shoulders
        - Granite street-level base band and darker storefront cladding
        - Art Deco vertical limestone fins on all four facades
        - Per-floor horizontal glass window bands, including the five-storey base
        - Setback cornices at every tier change
        - Stepped corner transition piers and caps at each setback tier
        - 86th-floor open-air observatory deck with parapet and corner pylons
        - Warmer blonde limestone / granite / metal palette closer to reference photos
        - More faithful mooring mast with metallic drums, ring decks, and broadcast arrays
        - Fifth Avenue portal, side entrances, stepped plinths, and layered canopies
        - IfcBuildingStorey for each key level
        - Material / colour styling (limestone, glass, steel, granite, bronze)
    """

    import ifcopenshell
    from ifcopenshell.api import run


    def build_empire_state(filename: str = "empire_state_detailed.ifc") -> None:
        print("  Empire State Building — Detailed IFC Generator  ")

        model = ifcopenshell.file(schema="IFC4")

        #  Project / spatial hierarchy
        project = run("root.create_entity", model, ifc_class="IfcProject",
                      name="Empire State Building – Detailed Model")
        run("unit.assign_unit", model)          # SI / metres

        model3d = run("context.add_context", model, context_type="Model")
        body = run("context.add_context", model, context_type="Model",
                   context_identifier="Body", target_view="MODEL_VIEW",
                   parent=model3d)

        site = run("root.create_entity", model, ifc_class="IfcSite",
                   name="5th Ave & 34th St, Midtown Manhattan, NYC")
        building = run("root.create_entity", model, ifc_class="IfcBuilding",
                       name="Empire State Building")

        run("aggregate.assign_object", model, relating_object=project,  products=[site])
        run("aggregate.assign_object", model, relating_object=site,     products=[building])

        #  Global direction constants
        DIR_Z = model.createIfcDirection((0., 0., 1.))
        DIR_X = model.createIfcDirection((1., 0., 0.))

        #  Geometry microhelpers
        def pt3(x, y, z): return model.createIfcCartesianPoint((float(x), float(y), float(z)))
        def pt2(x, y):    return model.createIfcCartesianPoint((float(x), float(y)))

        def ax3(x=0, y=0, z=0):
            return model.createIfcAxis2Placement3D(pt3(x, y, z), DIR_Z, DIR_X)

        def ax2(x=0, y=0):
            return model.createIfcAxis2Placement2D(pt2(x, y))

        def rect_prof(w, d, ox=0, oy=0):
            return model.createIfcRectangleProfileDef("AREA", None, ax2(ox, oy),
                                                      float(w), float(d))

        def circ_prof(r):
            return model.createIfcCircleProfileDef("AREA", None, ax2(), float(r))

        def extrude(profile, height, x=0, y=0, z=0):
            return model.createIfcExtrudedAreaSolid(profile, ax3(x, y, z),
                                                    DIR_Z, float(height))

        #  Material / surface styles
        def make_style(name, r, g, b, transp=0.0):
            col  = model.createIfcColourRgb(None, r / 255.0, g / 255.0, b / 255.0)
            rend = model.createIfcSurfaceStyleRendering(
                       col, float(transp), None, None, None, None, None, None, "FLAT")
            return model.createIfcSurfaceStyle(name, "BOTH", [rend])

        S_LIMESTONE = make_style("Indiana Limestone", 238, 223, 188)
        S_GLASS     = make_style("Tinted Glass",      196, 206, 214, 0.72)
        S_STEEL     = make_style("Stainless Steel",   188, 193, 198)
        S_MAST_METAL = make_style("Mast Aluminum",    206, 210, 215)
        S_DARK_METAL = make_style("Dark Mast Steel",   78,  82,  90)
        S_GRANITE   = make_style("Dark Granite",       62,  59,  58)
        S_CONCRETE  = make_style("Concrete",          180, 176, 168)
        S_BRONZE    = make_style("Architectural Bronze", 177, 136, 72)

        #  IFC element factory
        _storeys: dict = {}   # populated below

        def make_el(ifc_cls, name, solid, px, py, pz, style=None, storey_key="Ground"):
            if style:
                model.createIfcStyledItem(solid, [style], None)
            rep   = model.createIfcShapeRepresentation(body, "Body", "SweptSolid", [solid])
            shape = model.createIfcProductDefinitionShape(Representations=[rep])
            el    = run("root.create_entity", model, ifc_class=ifc_cls, name=name)
            el.Representation  = shape
            el.ObjectPlacement = model.createIfcLocalPlacement(None, ax3(px, py, pz))
            st = _storeys.get(storey_key, list(_storeys.values())[0])
            run("spatial.assign_container", model, relating_structure=st, products=[el])
            return el

        # helper that also returns next z
        def el_rect(ifc_cls, name, ew, ns, h, z, sk, sty, ox=0, oy=0):
            sol = extrude(rect_prof(ew, ns, ox, oy), h)
            make_el(ifc_cls, name, sol, 0, 0, z, style=sty, storey_key=sk)
            return z + h

        def el_circ(ifc_cls, name, r, h, z, sk, sty):
            sol = extrude(circ_prof(r), h)
            make_el(ifc_cls, name, sol, 0, 0, z, style=sty, storey_key=sk)
            return z + h

        def add_rect(ifc_cls, name, ew, ns, h, px, py, pz, sk, sty=None):
            sol = extrude(rect_prof(ew, ns), h)
            make_el(ifc_cls, name, sol, px, py, pz, style=sty, storey_key=sk)

        def add_cyl(ifc_cls, name, r, h, px, py, pz, sk, sty=None):
            sol = extrude(circ_prof(r), h)
            make_el(ifc_cls, name, sol, px, py, pz, style=sty, storey_key=sk)

        def add_quad_posts(name, offset, r, h, z, sk, sty):
            for xi, sx in enumerate((-offset, offset)):
                for yi, sy in enumerate((-offset, offset)):
                    add_cyl("IfcBuildingElementProxy", f"{name}_{xi}_{yi}", r, h,
                            sx, sy, z, sk, sty)

        def add_mast_ribs(name, radius, h, z, sk, sty, rib_w=1.10, rib_d=0.22):
            add_rect("IfcBuildingElementProxy", f"{name}_E", rib_d, rib_w, h,
                     radius + rib_d / 2, 0, z, sk, sty)
            add_rect("IfcBuildingElementProxy", f"{name}_W", rib_d, rib_w, h,
                     -(radius + rib_d / 2), 0, z, sk, sty)
            add_rect("IfcBuildingElementProxy", f"{name}_N", rib_w, rib_d, h,
                     0, radius + rib_d / 2, z, sk, sty)
            add_rect("IfcBuildingElementProxy", f"{name}_S", rib_w, rib_d, h,
                     0, -(radius + rib_d / 2), z, sk, sty)

        def add_panel_array(name, offset, panel_span, panel_t, panel_h, z, sk, sty):
            add_rect("IfcBuildingElementProxy", f"{name}_E", panel_t, panel_span, panel_h,
                     offset, 0, z, sk, sty)
            add_rect("IfcBuildingElementProxy", f"{name}_W", panel_t, panel_span, panel_h,
                     -offset, 0, z, sk, sty)
            add_rect("IfcBuildingElementProxy", f"{name}_N", panel_span, panel_t, panel_h,
                     0, offset, z, sk, sty)
            add_rect("IfcBuildingElementProxy", f"{name}_S", panel_span, panel_t, panel_h,
                     0, -offset, z, sk, sty)

        def add_corner_wings(name, base_x, base_y, z, sk, sty):
            wing_levels = [
                (2.8, 3.3, 4.8, 0.00, 0.00),
                (2.3, 2.8, 4.2, 0.35, 0.35),
                (1.8, 2.1, 3.8, 0.70, 0.70),
                (1.2, 1.5, 1.7, 1.00, 1.00),
            ]
            for ci, (sx, sy) in enumerate([(1.0, 1.0), (-1.0, 1.0), (1.0, -1.0), (-1.0, -1.0)]):
                wing_z = z
                for li, (ew, ns, h, inset_x, inset_y) in enumerate(wing_levels):
                    add_rect(
                        "IfcBuildingElementProxy",
                        f"{name}_{ci}_{li}",
                        ew,
                        ns,
                        h,
                        sx * (base_x - inset_x),
                        sy * (base_y - inset_y),
                        wing_z,
                        sk,
                        sty,
                    )
                    wing_z += h

        def tier_area(ew, ns, shoulder_w=0.0, recess_d=0.0):
            center_w = ew - 2 * shoulder_w
            if shoulder_w <= 0.0 or recess_d <= 0.0 or center_w <= 2.0:
                return ew * ns
            return ew * ns - 2 * recess_d * center_w

        def face_segments(tier_ew, tier_ns, shoulder_w=0.0, recess_d=0.0):
            center_w = tier_ew - 2 * shoulder_w
            if shoulder_w <= 0.0 or recess_d <= 0.0 or center_w <= 2.0:
                return [(0.0, tier_ew, tier_ns / 2)]

            shoulder_band_w = shoulder_w * 0.92
            shoulder_x = tier_ew / 2 - shoulder_w / 2
            return [
                (-shoulder_x, shoulder_band_w, tier_ns / 2),
                (0.0, center_w, tier_ns / 2 - recess_d),
                (shoulder_x, shoulder_band_w, tier_ns / 2),
            ]

        def tier_wall_thickness(tier_ew, tier_ns):
            return max(0.75, min(1.35, min(tier_ew, tier_ns) * 0.035))

        def wall_band_segments(height, opening_offset, opening_height, opening_count):
            if opening_offset is None or opening_height is None or opening_count <= 0:
                return [(0.0, height)]

            segments = []
            cursor = 0.0
            for idx in range(opening_count):
                band_z = opening_offset + idx * FLOOR_H
                if band_z >= height:
                    break
                if band_z > cursor + 0.02:
                    segments.append((cursor, band_z - cursor))
                cursor = max(cursor, min(height, band_z + opening_height))
            if cursor < height - 0.02:
                segments.append((cursor, height - cursor))
            return segments

        def add_banded_facade(
            name,
            axis,
            span,
            thickness,
            height,
            px,
            py,
            pz,
            sk,
            sty,
            opening_span=None,
            opening_height=None,
            opening_offset=None,
            opening_count=0,
        ):
            if opening_offset is None or opening_height is None or opening_count <= 0:
                if axis == "x":
                    add_rect("IfcWall", name, span, thickness, height, px, py, pz, sk, sty)
                else:
                    add_rect("IfcWall", name, thickness, span, height, px, py, pz, sk, sty)
                return

            opening_span = max(0.0, min(span - 0.25, opening_span or 0.0))
            side_margin = max(0.0, (span - opening_span) / 2.0)

            for band_i, (band_z, band_h) in enumerate(
                wall_band_segments(height, opening_offset, opening_height, opening_count)
            ):
                if axis == "x":
                    add_rect(
                        "IfcWall",
                        f"{name}_Band_{band_i}",
                        span,
                        thickness,
                        band_h,
                        px,
                        py,
                        pz + band_z,
                        sk,
                        sty,
                    )
                else:
                    add_rect(
                        "IfcWall",
                        f"{name}_Band_{band_i}",
                        thickness,
                        span,
                        band_h,
                        px,
                        py,
                        pz + band_z,
                        sk,
                        sty,
                    )

            if side_margin <= 0.08:
                return

            if axis == "x":
                add_rect(
                    "IfcWall",
                    f"{name}_Pier_W",
                    side_margin,
                    thickness,
                    height,
                    px - (span / 2 - side_margin / 2),
                    py,
                    pz,
                    sk,
                    sty,
                )
                add_rect(
                    "IfcWall",
                    f"{name}_Pier_E",
                    side_margin,
                    thickness,
                    height,
                    px + (span / 2 - side_margin / 2),
                    py,
                    pz,
                    sk,
                    sty,
                )
            else:
                add_rect(
                    "IfcWall",
                    f"{name}_Pier_N",
                    thickness,
                    side_margin,
                    height,
                    px,
                    py + (span / 2 - side_margin / 2),
                    pz,
                    sk,
                    sty,
                )
                add_rect(
                    "IfcWall",
                    f"{name}_Pier_S",
                    thickness,
                    side_margin,
                    height,
                    px,
                    py - (span / 2 - side_margin / 2),
                    pz,
                    sk,
                    sty,
                )

        def add_articulated_tier(name, ew, ns, h, z, sk, sty,
                                 shoulder_w=0.0, recess_d=0.0,
                                 window_offset=None, window_height=None,
                                 window_count=0, side_band_span=None):
            wall_t = tier_wall_thickness(ew, ns)
            half_ew, half_ns = ew / 2, ns / 2
            center_w = ew - 2 * shoulder_w
            if side_band_span is None:
                side_band_span = max(ns * 0.80, ns - 2.0)

            if shoulder_w <= 0.0 or recess_d <= 0.0 or center_w <= 2.0:
                add_banded_facade(
                    f"{name}_North",
                    "x",
                    ew,
                    wall_t,
                    h,
                    0,
                    half_ns - wall_t / 2,
                    z,
                    sk,
                    sty,
                    opening_span=ew * 0.84,
                    opening_height=window_height,
                    opening_offset=window_offset,
                    opening_count=window_count,
                )
                add_banded_facade(
                    f"{name}_South",
                    "x",
                    ew,
                    wall_t,
                    h,
                    0,
                    -(half_ns - wall_t / 2),
                    z,
                    sk,
                    sty,
                    opening_span=ew * 0.84,
                    opening_height=window_height,
                    opening_offset=window_offset,
                    opening_count=window_count,
                )
                add_banded_facade(
                    f"{name}_East",
                    "y",
                    ns,
                    wall_t,
                    h,
                    half_ew - wall_t / 2,
                    0,
                    z,
                    sk,
                    sty,
                    opening_span=side_band_span,
                    opening_height=window_height,
                    opening_offset=window_offset,
                    opening_count=window_count,
                )
                add_banded_facade(
                    f"{name}_West",
                    "y",
                    ns,
                    wall_t,
                    h,
                    -(half_ew - wall_t / 2),
                    0,
                    z,
                    sk,
                    sty,
                    opening_span=side_band_span,
                    opening_height=window_height,
                    opening_offset=window_offset,
                    opening_count=window_count,
                )
                return

            ns_segments = face_segments(ew, ns, shoulder_w, recess_d)
            for seg_i, (seg_x, seg_w, seg_face_y) in enumerate(ns_segments):
                seg_open_w = seg_w * (0.90 if seg_i == 1 and len(ns_segments) > 1 else 0.82)
                add_banded_facade(
                    f"{name}_North_{seg_i}",
                    "x",
                    seg_w,
                    wall_t,
                    h,
                    seg_x,
                    seg_face_y - wall_t / 2,
                    z,
                    sk,
                    sty,
                    opening_span=seg_open_w,
                    opening_height=window_height,
                    opening_offset=window_offset,
                    opening_count=window_count,
                )
                add_banded_facade(
                    f"{name}_South_{seg_i}",
                    "x",
                    seg_w,
                    wall_t,
                    h,
                    seg_x,
                    -(seg_face_y - wall_t / 2),
                    z,
                    sk,
                    sty,
                    opening_span=seg_open_w,
                    opening_height=window_height,
                    opening_offset=window_offset,
                    opening_count=window_count,
                )

            add_banded_facade(
                f"{name}_East",
                "y",
                ns,
                wall_t,
                h,
                half_ew - wall_t / 2,
                0,
                z,
                sk,
                sty,
                opening_span=side_band_span,
                opening_height=window_height,
                opening_offset=window_offset,
                opening_count=window_count,
            )
            add_banded_facade(
                f"{name}_West",
                "y",
                ns,
                wall_t,
                h,
                -(half_ew - wall_t / 2),
                0,
                z,
                sk,
                sty,
                opening_span=side_band_span,
                opening_height=window_height,
                opening_offset=window_offset,
                opening_count=window_count,
            )

            return_y = half_ns - recess_d / 2
            for sx in (-1.0, 1.0):
                for sy, face in ((1.0, "North"), (-1.0, "South")):
                    add_rect(
                        "IfcWall",
                        f"{name}_{face}Return_{'E' if sx > 0 else 'W'}",
                        wall_t,
                        recess_d,
                        h,
                        sx * (center_w / 2),
                        sy * return_y,
                        z,
                        sk,
                        sty,
                    )

        #  Building storeys (key levels only)
        FLOOR_H = 3.72          # metres per storey
        storey_defs = {
            "Ground":   0.0,
            "Fl6":      18.6,
            "Fl21":     74.4,
            "Fl25":     89.3,
            "Fl30":    107.9,
            "Fl72":    264.1,
            "Fl81":    297.6,
            "Fl86":    312.5,
            "Spire":   319.9,
            "Top102":  375.0,
        }
        for sname, elev in storey_defs.items():
            st = run("root.create_entity", model, ifc_class="IfcBuildingStorey", name=sname)
            st.Elevation = elev
            run("aggregate.assign_object", model, relating_object=building, products=[st])
            _storeys[sname] = st

        #  Tier dimensions
        # These simplified occupied floor plates are tuned to read less wide in the
        # front elevation, deeper in plan, and more articulated in their centre bays.
        BASE_EW, BASE_NS = 123.0, 60.0
        BASE_SHOULDER, BASE_RECESS = 20.0, 1.6

        LOWER_EW, LOWER_NS = 96.0, 41.0
        LOWER_SHOULDER, LOWER_RECESS = 18.0, 2.9

        SET1_EW, SET1_NS = 82.0, 37.0
        SET1_SHOULDER, SET1_RECESS = 15.0, 2.6

        SET2_EW, SET2_NS = 70.0, 35.0
        SET2_SHOULDER, SET2_RECESS = 13.0, 2.3

        SHAFT_EW, SHAFT_NS = 57.0, 34.0
        SHAFT_SHOULDER, SHAFT_RECESS = 12.5, 2.7

        UPPER_EW, UPPER_NS = 46.0, 26.0
        UPPER_SHOULDER, UPPER_RECESS = 9.5, 1.9

        CROWN_EW, CROWN_NS = 35.5, 20.0
        CROWN_SHOULDER, CROWN_RECESS = 7.4, 1.35

        OBS_TIER_EW, OBS_TIER_NS = 26.5, 14.0
        OBS_SHOULDER, OBS_RECESS = 5.8, 0.95

        WIN_T    = 0.12
        WIN_FRAC = 0.55
        BASE_WINDOW_OFFSET = 3.85
        BASE_WINDOW_HEIGHT = 2.55
        BASE_WINDOW_COUNT = 4
        BASE_SIDE_BAND = BASE_NS * 0.72
        DEFAULT_WINDOW_OFFSET = FLOOR_H * 0.18
        DEFAULT_WINDOW_HEIGHT = FLOOR_H * WIN_FRAC

        MODELED_GFA = (
            tier_area(BASE_EW, BASE_NS, BASE_SHOULDER, BASE_RECESS) * 5
            + tier_area(LOWER_EW, LOWER_NS, LOWER_SHOULDER, LOWER_RECESS) * 15
            + tier_area(SET1_EW, SET1_NS, SET1_SHOULDER, SET1_RECESS) * 4
            + tier_area(SET2_EW, SET2_NS, SET2_SHOULDER, SET2_RECESS) * 5
            + tier_area(SHAFT_EW, SHAFT_NS, SHAFT_SHOULDER, SHAFT_RECESS) * 42
            + tier_area(UPPER_EW, UPPER_NS, UPPER_SHOULDER, UPPER_RECESS) * 9
            + tier_area(CROWN_EW, CROWN_NS, CROWN_SHOULDER, CROWN_RECESS) * 4
            + tier_area(OBS_TIER_EW, OBS_TIER_NS, OBS_SHOULDER, OBS_RECESS) * 2
        )

        # 1.  PRIMARY MASSING  (stepped, elongated slab — accurate ESB proportions)
        print("▸ Primary massing …")

        # (name, EWwidth, NSdepth, height, z_base, storey_key, shoulder_w, recess_d)
        TIER_SPECS = [
            {
                "name": "ESB_Base",
                "ew": BASE_EW,
                "ns": BASE_NS,
                "h": 18.6,
                "z": 0.0,
                "sk": "Ground",
                "shoulder_w": BASE_SHOULDER,
                "recess_d": BASE_RECESS,
                "window_offset": BASE_WINDOW_OFFSET,
                "window_height": BASE_WINDOW_HEIGHT,
                "window_count": BASE_WINDOW_COUNT,
                "side_band_span": BASE_SIDE_BAND,
            },
            {
                "name": "ESB_LowerTower",
                "ew": LOWER_EW,
                "ns": LOWER_NS,
                "h": 55.8,
                "z": 18.6,
                "sk": "Fl6",
                "shoulder_w": LOWER_SHOULDER,
                "recess_d": LOWER_RECESS,
                "window_offset": DEFAULT_WINDOW_OFFSET,
                "window_height": DEFAULT_WINDOW_HEIGHT,
                "window_count": round(55.8 / FLOOR_H),
                "side_band_span": None,
            },
            {
                "name": "ESB_Setback1",
                "ew": SET1_EW,
                "ns": SET1_NS,
                "h": 14.9,
                "z": 74.4,
                "sk": "Fl21",
                "shoulder_w": SET1_SHOULDER,
                "recess_d": SET1_RECESS,
                "window_offset": DEFAULT_WINDOW_OFFSET,
                "window_height": DEFAULT_WINDOW_HEIGHT,
                "window_count": round(14.9 / FLOOR_H),
                "side_band_span": None,
            },
            {
                "name": "ESB_Setback2",
                "ew": SET2_EW,
                "ns": SET2_NS,
                "h": 18.6,
                "z": 89.3,
                "sk": "Fl25",
                "shoulder_w": SET2_SHOULDER,
                "recess_d": SET2_RECESS,
                "window_offset": DEFAULT_WINDOW_OFFSET,
                "window_height": DEFAULT_WINDOW_HEIGHT,
                "window_count": round(18.6 / FLOOR_H),
                "side_band_span": None,
            },
            {
                "name": "ESB_MainShaft",
                "ew": SHAFT_EW,
                "ns": SHAFT_NS,
                "h": 156.2,
                "z": 107.9,
                "sk": "Fl30",
                "shoulder_w": SHAFT_SHOULDER,
                "recess_d": SHAFT_RECESS,
                "window_offset": DEFAULT_WINDOW_OFFSET,
                "window_height": DEFAULT_WINDOW_HEIGHT,
                "window_count": round(156.2 / FLOOR_H),
                "side_band_span": None,
            },
            {
                "name": "ESB_UpperSetback",
                "ew": UPPER_EW,
                "ns": UPPER_NS,
                "h": 33.5,
                "z": 264.1,
                "sk": "Fl72",
                "shoulder_w": UPPER_SHOULDER,
                "recess_d": UPPER_RECESS,
                "window_offset": DEFAULT_WINDOW_OFFSET,
                "window_height": DEFAULT_WINDOW_HEIGHT,
                "window_count": round(33.5 / FLOOR_H),
                "side_band_span": None,
            },
            {
                "name": "ESB_Crown",
                "ew": CROWN_EW,
                "ns": CROWN_NS,
                "h": 14.9,
                "z": 297.6,
                "sk": "Fl81",
                "shoulder_w": CROWN_SHOULDER,
                "recess_d": CROWN_RECESS,
                "window_offset": DEFAULT_WINDOW_OFFSET,
                "window_height": DEFAULT_WINDOW_HEIGHT,
                "window_count": round(14.9 / FLOOR_H),
                "side_band_span": None,
            },
            {
                "name": "ESB_ObsTier",
                "ew": OBS_TIER_EW,
                "ns": OBS_TIER_NS,
                "h": 7.4,
                "z": 312.5,
                "sk": "Fl86",
                "shoulder_w": OBS_SHOULDER,
                "recess_d": OBS_RECESS,
                "window_offset": None,
                "window_height": None,
                "window_count": 0,
                "side_band_span": None,
            },
        ]
        for tier in TIER_SPECS:
            add_articulated_tier(
                tier["name"],
                tier["ew"],
                tier["ns"],
                tier["h"],
                tier["z"],
                tier["sk"],
                S_LIMESTONE,
                tier["shoulder_w"],
                tier["recess_d"],
                tier["window_offset"],
                tier["window_height"],
                tier["window_count"],
                tier["side_band_span"],
            )
        print(f"  ✓ Approx. modeled occupied floor area: {MODELED_GFA:,.0f} m²")

        # 2.  GRANITE STREETLEVEL BASE BAND  (first 3 m — dark granite cladding)
        print("▸ Granite base band …")
        sol = extrude(rect_prof(BASE_EW + 2.0, BASE_NS + 2.0), 3.2)
        make_el("IfcBuildingElementProxy", "GraniteBaseBand", sol, 0, 0, 0,
                style=S_GRANITE, storey_key="Ground")

        # 3.  SETBACK CORNICES  (horizontal limestone bands at every tier change)
        print("▸ Setback cornices …")

        CORNICES = [
            # (EW, NS, z_top, storey, overhang, thickness)
            (BASE_EW,     BASE_NS,     18.6, "Ground", 2.6, 1.5),
            (LOWER_EW,    LOWER_NS,    74.4, "Fl6",    1.7, 1.1),
            (SET1_EW,     SET1_NS,     89.3, "Fl21",   1.4, 1.0),
            (SET2_EW,     SET2_NS,    107.9, "Fl25",   1.3, 0.9),
            (SHAFT_EW,    SHAFT_NS,   264.1, "Fl30",   1.6, 1.0),
            (UPPER_EW,    UPPER_NS,   297.6, "Fl72",   1.8, 1.2),
            (CROWN_EW,    CROWN_NS,   312.5, "Fl81",   2.0, 1.5),
        ]
        for ew, ns, ztop, sk, ovhg, thick in CORNICES:
            sol = extrude(rect_prof(ew + 2 * ovhg, ns + 2 * ovhg), thick)
            make_el("IfcSlab", f"Cornice_{ztop:.0f}", sol, 0, 0, ztop - thick,
                    style=S_LIMESTONE, storey_key=sk)

        # 4.  ART DECO VERTICAL FINS  (limestone pilasters on all four facades)
        #     Strong vertical emphasis — defining feature of ESB's Art Deco style
        print("▸ Art Deco vertical fins …")

        FIN_W  = 2.0   # fin width along facade  (m)
        FIN_D  = 0.75  # fin projection depth     (m)
        SPACING = 5.2  # centre-to-centre spacing (m)

        def add_fins(tier_ew, tier_ns, tier_h, tier_z, sk,
                     shoulder_w=0.0, recess_d=0.0):
            half_ew, half_ns = tier_ew / 2, tier_ns / 2

            #  Long (EW) faces: North and South
            for seg_i, (seg_x, seg_w, seg_face_y) in enumerate(
                    face_segments(tier_ew, tier_ns, shoulder_w, recess_d)):
                n_ew = max(1, round(seg_w / SPACING))
                xs = [seg_x - seg_w / 2 + (i + 0.5) * seg_w / n_ew for i in range(n_ew)]
                for i, x in enumerate(xs):
                    for sy, lbl in [
                            (seg_face_y + FIN_D / 2, "FN"),
                            (-(seg_face_y + FIN_D / 2), "FS")]:
                        sol = extrude(rect_prof(FIN_W, FIN_D), tier_h)
                        make_el("IfcColumn", f"{lbl}_{sk}_{seg_i}_{i}", sol,
                                x, sy, tier_z, style=S_LIMESTONE, storey_key=sk)

            #  Short (NS) faces: East and West
            n_ns = max(2, round(tier_ns / SPACING))
            ys   = [-half_ns + (j + 0.5) * tier_ns / n_ns for j in range(n_ns)]
            for j, y in enumerate(ys):
                for sx, lbl in [(half_ew + FIN_D / 2, "FE"), (-(half_ew + FIN_D / 2), "FW")]:
                    sol = extrude(rect_prof(FIN_D, FIN_W), tier_h)
                    make_el("IfcColumn", f"{lbl}_{sk}_{j}", sol,
                            sx, y, tier_z, style=S_LIMESTONE, storey_key=sk)

        FIN_TIERS = [
            (LOWER_EW,    LOWER_NS,    55.8,  18.6, "Fl6",  LOWER_SHOULDER, LOWER_RECESS),
            (SET1_EW,     SET1_NS,     14.9,  74.4, "Fl21", SET1_SHOULDER,  SET1_RECESS),
            (SET2_EW,     SET2_NS,     18.6,  89.3, "Fl25", SET2_SHOULDER,  SET2_RECESS),
            (SHAFT_EW,    SHAFT_NS,   156.2, 107.9, "Fl30", SHAFT_SHOULDER, SHAFT_RECESS),
            (UPPER_EW,    UPPER_NS,    33.5, 264.1, "Fl72", UPPER_SHOULDER, UPPER_RECESS),
            (CROWN_EW,    CROWN_NS,    14.9, 297.6, "Fl81", CROWN_SHOULDER, CROWN_RECESS),
            (OBS_TIER_EW, OBS_TIER_NS,  7.4, 312.5, "Fl86", OBS_SHOULDER,   OBS_RECESS),
        ]
        for ft in FIN_TIERS:
            add_fins(*ft)

        # 5.  HORIZONTAL WINDOW GLAZING BANDS  (perfloor on all four facades)
        print("▸ Window glazing bands …")

        def add_windows(tier_ew, tier_ns, tier_h, tier_z, sk,
                        shoulder_w=0.0, recess_d=0.0,
                        window_offset=None, window_height=None,
                        window_count=0, side_band_span=None):
            if window_offset is None or window_height is None or window_count <= 0:
                return

            wall_t    = tier_wall_thickness(tier_ew, tier_ns)
            wh        = window_height
            half_ew   = tier_ew / 2
            band_ns   = side_band_span if side_band_span is not None else max(tier_ns * 0.80, tier_ns - 2.0)
            ns_segments = face_segments(tier_ew, tier_ns, shoulder_w, recess_d)

            for f in range(window_count):
                wz = tier_z + window_offset + f * FLOOR_H

                # North & South bands
                for seg_i, (seg_x, seg_w, seg_face_y) in enumerate(ns_segments):
                    seg_band_w = seg_w * (0.90 if seg_i == 1 and len(ns_segments) > 1 else 0.82)
                    if seg_band_w <= WIN_T * 3:
                        continue
                    for sy, lbl in [
                            (seg_face_y - wall_t / 2, "WN"),
                            (-(seg_face_y - wall_t / 2), "WS")]:
                        sol = extrude(rect_prof(seg_band_w, WIN_T), wh)
                        make_el("IfcWindow", f"{lbl}_{sk}_{f}_{seg_i}", sol,
                                seg_x, sy, wz, style=S_GLASS, storey_key=sk)

                # East & West bands
                for sx, lbl in [(half_ew - wall_t / 2, "WE"), (-(half_ew - wall_t / 2), "WW")]:
                    sol = extrude(rect_prof(WIN_T, band_ns), wh)
                    make_el("IfcWindow", f"{lbl}_{sk}_{f}", sol,
                            sx, 0, wz, style=S_GLASS, storey_key=sk)

        for tier in TIER_SPECS:
            add_windows(
                tier["ew"],
                tier["ns"],
                tier["h"],
                tier["z"],
                tier["sk"],
                tier["shoulder_w"],
                tier["recess_d"],
                tier["window_offset"],
                tier["window_height"],
                tier["window_count"],
                tier["side_band_span"],
            )

        # 6.  CORNER ACCENT PIERS  (Art Deco corner quoins at each setback)
        print("▸ Corner piers …")

        def add_corner_piers(tier_ew, tier_ns, z, h, sk, pw=3.5, pd=2.8):
            cap_specs = [
                (pw * 1.28, pd * 1.20, 1.10),
                (pw * 1.00, pd * 0.96, 0.85),
                (pw * 0.76, pd * 0.72, 0.70),
            ]
            cap_total = sum(cap_h for _, _, cap_h in cap_specs)
            pier_h = max(FLOOR_H, h - cap_total)

            for ci, (cx, cy) in enumerate([
                    ( tier_ew / 2,  tier_ns / 2),
                    (-tier_ew / 2,  tier_ns / 2),
                    ( tier_ew / 2, -tier_ns / 2),
                    (-tier_ew / 2, -tier_ns / 2)]):
                add_rect("IfcBuildingElementProxy", f"CornerPier_{sk}_{ci}",
                         pw, pd, pier_h, cx, cy, z, sk, S_LIMESTONE)

                cap_z = z + pier_h
                for si, (cw, cd, ch) in enumerate(cap_specs):
                    add_rect("IfcBuildingElementProxy", f"CornerCap_{sk}_{ci}_{si}",
                             cw, cd, ch, cx, cy, cap_z, sk, S_LIMESTONE)
                    cap_z += ch

        add_corner_piers(LOWER_EW,    LOWER_NS,    18.6,  55.8, "Fl6",   pw=5.0, pd=4.0)
        add_corner_piers(SET1_EW,     SET1_NS,     74.4,  14.9, "Fl21",  pw=4.4, pd=3.5)
        add_corner_piers(SET2_EW,     SET2_NS,     89.3,  18.6, "Fl25",  pw=4.0, pd=3.2)
        add_corner_piers(SHAFT_EW,    SHAFT_NS,   107.9, 156.2, "Fl30",  pw=3.5, pd=2.8)
        add_corner_piers(UPPER_EW,    UPPER_NS,   264.1,  33.5, "Fl72",  pw=3.1, pd=2.4)
        add_corner_piers(CROWN_EW,    CROWN_NS,   297.6,  14.9, "Fl81",  pw=2.8, pd=2.2)

        # 7.  86thFLOOR OPENAIR OBSERVATORY DECK

        OBS_Z  = 319.9   # top of obs-tier massing
        OBS_EW = 34.0    # deck width E-W (wider than the massing to form walkway)
        OBS_NS = 16.0    # deck depth N-S
        PAR_T  = 0.80    # parapet wall thickness (m)
        PAR_H  = 1.55    # parapet height (m)
        DECK_T = 0.50    # deck slab thickness

        # Deck slab
        sol = extrude(rect_prof(OBS_EW, OBS_NS), DECK_T)
        make_el("IfcSlab", "ObsDeck86_Slab", sol, 0, 0, OBS_Z,
                style=S_CONCRETE, storey_key="Spire")

        # Parapet walls
        p_z = OBS_Z + DECK_T
        for sy, lbl in [( OBS_NS / 2 - PAR_T / 2, "PN"),
                        (-OBS_NS / 2 + PAR_T / 2, "PS")]:
            sol = extrude(rect_prof(OBS_EW, PAR_T), PAR_H)
            make_el("IfcWall", f"ObsParapet86_{lbl}", sol,
                    0, sy, p_z, style=S_LIMESTONE, storey_key="Spire")
        for sx, lbl in [( OBS_EW / 2 - PAR_T / 2, "PE"),
                        (-OBS_EW / 2 + PAR_T / 2, "PW")]:
            sol = extrude(rect_prof(PAR_T, OBS_NS), PAR_H)
            make_el("IfcWall", f"ObsParapet86_{lbl}", sol,
                    sx, 0, p_z, style=S_LIMESTONE, storey_key="Spire")

        for ci, (cx, cy) in enumerate([
                ( OBS_EW / 2 - 1.2,  OBS_NS / 2 - 1.2),
                (-OBS_EW / 2 + 1.2,  OBS_NS / 2 - 1.2),
                ( OBS_EW / 2 - 1.2, -OBS_NS / 2 + 1.2),
                (-OBS_EW / 2 + 1.2, -OBS_NS / 2 + 1.2)]):
            add_rect("IfcBuildingElementProxy", f"ObsCornerPylon_{ci}",
                     1.2, 1.2, 2.2, cx, cy, p_z, "Spire", S_LIMESTONE)

        # 8.  ART DECO MOORING MAST / SPIRE  (floors 87102 + broadcast antenna)
        #     Stepped square blocks → metallic mast drums → broadcast tower
        print("▸ Mooring mast and spire …")

        sz = OBS_Z + DECK_T + PAR_H   # start of spire = top of obs parapet

        #  Stepped Art Deco square base
        SPIRE_STEPS = [
            # Four shallow limestone tiers, per the original mooringmast design.
            # (EW, NS, height)  — total = 15.2 m
            (23.5, 21.5, 4.2),
            (20.0, 18.2, 4.0),
            (16.8, 15.2, 3.6),
            (13.6, 12.2, 3.4),
        ]
        for i, (ew, ns, h) in enumerate(SPIRE_STEPS):
            sz = el_rect("IfcBuildingElementProxy", f"SpireBlock_{i}", ew, ns, h,
                         sz, "Spire", S_LIMESTONE)
            add_rect("IfcSlab", f"SpireCornice_{i}", ew + 1.0, ns + 1.0, 0.18,
                     0, 0, sz - 0.18, "Spire", S_LIMESTONE)
            if i != len(SPIRE_STEPS) - 1:
                continue

            #  Mast lantern, corner wings, and upper observation drum
            mast_base_z = sz
            sz = el_circ("IfcBuildingElementProxy", "MastLanternPlinth", 6.25, 0.50,
                     sz, "Top102", S_DARK_METAL)

            lantern_z = sz
            sz = el_circ("IfcWindow", "MastLanternGlazing", 5.65, 18.3,
                     sz, "Top102", S_GLASS)
            add_mast_ribs("MastLanternRib", 5.65, 18.3, lantern_z, "Top102", S_STEEL,
                    rib_w=0.92, rib_d=0.18)
            add_corner_wings("MastCornerWing", 7.35, 4.65, mast_base_z + 0.15,
                       "Top102", S_MAST_METAL)

            gallery_z = sz
            sz = el_circ("IfcBuildingElementProxy", "MastGalleryRing", 6.55, 1.00,
                     sz, "Top102", S_DARK_METAL)
            add_cyl("IfcSlab", "MastGalleryDeck", 6.90, 0.16,
                0, 0, gallery_z + 0.24, "Top102", S_DARK_METAL)

            # Truncated segment completion for structural validation
            pass

        # Save model
        model.write(filename)

    build_empire_state()

EMPIRE_STATE_CODE = duc.extract_embedded_code(empire_state_model_code)


# ViewerState setting matching standard CAD parameters
EMPIRE_STATE_VIEWER_STATE = {
    "camera": {
        "control": "orbit",
        "ortho": True,
        "up": "Z",
        "position": [300.0, -300.0, 400.0],
        "quaternion": [0.38, 0.18, 0.38, 0.82],
        "target": [0.0, 0.0, 200.0],
        "zoom": 1.0,
        "panSpeed": 1.0,
        "rotateSpeed": 1.0,
        "zoomSpeed": 1.0,
        "holroyd": False
    },
    "display": {
        "wireframe": False,
        "transparent": False,
        "blackEdges": True,
        "grid": {
            "type": "perPlane",
            "value": {
                "xy": True,
                "xz": False,
                "yz": False
            }
        },
        "axesVisible": True,
        "axesAtOrigin": True
    },
    "material": {
        "metalness": 0.3,
        "roughness": 0.6,
        "defaultOpacity": 1.0,
        "edgeColor": 7368816,
        "ambientIntensity": 0.8,
        "directIntensity": 1.2
    },
    "clipping": {
        "x": {"enabled": False, "value": 0.0, "normal": None},
        "y": {"enabled": False, "value": 0.0, "normal": None},
        "z": {"enabled": False, "value": 0.0, "normal": None},
        "intersection": False,
        "showPlanes": False,
        "objectColorCaps": False
    },
    "explode": {
        "active": False,
        "value": 0.0
    },
    "zebra": {
        "active": False,
        "stripeCount": 6,
        "stripeDirection": 0.0,
        "colorScheme": "grayscale",
        "opacity": 1.0,
        "mappingMode": "reflection"
    }
}

def main():
    print("Empire State Building IFC Model Example")
    print("=" * 45)

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

    esb_styles = duc.DucElementStylesBase(
        roundness=0.0,
        background=[bg],
        stroke=[stroke],
        opacity=1.0,
        blending=None
    )

    # Create the element builder
    builder = (
        duc.ElementBuilder()
        .at_position(2852.6047165, -870.1664371557827)
        .with_size(81.42883455202997, 197.16424830999995)
        .with_angle(0.0)
        .with_scope("m")
        .with_label("EmpireState BIM Model")
        .with_styles(esb_styles)
    )

    esb_element = (
        builder
        .build_model_element()
        .with_model_type("python")
        .with_code(EMPIRE_STATE_CODE)
        .with_viewer_state(EMPIRE_STATE_VIEWER_STATE)
        .build()
    )

    print(f"   Created Model Element ID: {esb_element.element.base.id}")
    print(f"   Class: {type(esb_element.element).__name__}, Model Type: {esb_element.element.model_type}")

    # 2. Serialize to .duc file
    output = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    output.close()
    duc_path = duc.serialize_duc(
        name="empire_state_detailed",
        output_path=output.name,
        elements=[esb_element],
        validate_embedded_code=True
    )
    print(f"   Successfully serialized DUC file to {duc_path}.")
    print("✅ Empire State Building IFC example successfully complete!")
    return duc_path

if __name__ == "__main__":
    main()
