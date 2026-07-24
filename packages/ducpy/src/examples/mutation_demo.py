#!/usr/bin/env python3
"""
Example demonstrating the `mutate` API for elements, global state, and
external file entries in DUC.

This demo shows how to:
  1. Build an initial set of elements and supporting state via the
     standard builder API.
  2. Apply targeted mutations to the elements, the global state, and an
     external file entry using `duc.mutate_*` helpers.
  3. Serialize the resulting DUC object into a `.duc` file.
"""

import tempfile

import ducpy as duc


def main():
    print("Mutation Demo")
    print("=" * 30)

    # ------------------------------------------------------------------
    # 1. Build the initial elements + state using the existing builders.
    # ------------------------------------------------------------------
    rect = (duc.ElementBuilder()
        .at_position(0, 0)
        .with_size(100, 50)
        .with_label("Initial Rectangle")
        .build_rectangle()
        .build())

    ellipse = (duc.ElementBuilder()
        .at_position(140, 0)
        .with_size(60, 40)
        .with_label("Initial Ellipse")
        .build_ellipse()
        .build())

    elements = [rect, ellipse]

    duc_global_state = (duc.StateBuilder()
        .build_global_state()
        .with_name("mutation_demo")
        .with_main_scope("mm")
        .build())

    duc_local_state = (duc.StateBuilder()
        .build_local_state()
        .build())

    # A sample external file entry to exercise mutate_external_file.
    external_file = (duc.StateBuilder()
        .build_external_file()
        .with_key("logo")
        .with_mime_type("image/png")
        .with_data(b"\x89PNG\r\n\x1a\n" + b"\x00" * 16)
        .build())

    # ------------------------------------------------------------------
    # 2. Apply mutations using the duc.mutate_* API.
    #    Each helper mutates in place and also stamps fresh versioning
    #    metadata (seed, updated, version, version_nonce) where
    #    applicable.
    # ------------------------------------------------------------------

    # 2a. Mutate the rectangle: move it, resize it, rename, hide it.
    duc.mutate_element(
        rect,
        x=20,
        y=30,
        width=150,
        label="Mutated Rectangle",
        is_visible=False,
    )

    # 2b. Mutate the ellipse: rename and move (size stays the same).
    duc.mutate_element(
        ellipse,
        x=200,
        y=75,
        label="Mutated Ellipse",
    )

    # 2c. Mutate the global state (zoom level, background, name).
    duc.mutate_global_state(
        duc_global_state,
        view_background_color="#1E1E2E",
        name="mutation_demo_updated",
    )

    # 2d. Mutate the local state (scroll position, grid mode).
    duc.mutate_local_state(
        duc_local_state,
        scroll_x=42.0,
        scroll_y=17.5,
        grid_mode_enabled=False,
    )

    # 2e. Mutate the external file entry's metadata.
    duc.mutate_external_file(
        external_file,
        version=2,
    )

    # ------------------------------------------------------------------
    # 3. Serialize the mutated objects into a .duc file.
    # ------------------------------------------------------------------
    output = tempfile.NamedTemporaryFile(suffix=".duc", delete=False)
    output.close()
    duc_path = duc.serialize_duc(
        name="mutation_demo",
        output_path=output.name,
        elements=elements,
        duc_global_state=duc_global_state,
        duc_local_state=duc_local_state,
        external_files=[external_file],
    )

    print(f"   Mutated {len(elements)} elements.")
    print(f"   Global state main scope -> {duc_global_state.main_scope!r}")
    print(f"   Local state scroll -> ({duc_local_state.scroll_x}, {duc_local_state.scroll_y})")
    print(f"   External file version -> {external_file.version}")
    print(f"   Serialized to {duc_path}.")
    print("\n✅ Mutation demo complete!")
    return duc_path


if __name__ == "__main__":
    main()
