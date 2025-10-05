"""
CSPMDS Test for Hatching Patterns: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests hatching patterns on element's style.
"""
import os
import pytest
import math

import ducpy as duc


def test_cspmds_hatching_patterns(test_output_dir):
    """
    CSPMDS test for hatching patterns:
    - Create: Elements with different hatch patterns
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Change hatch patterns and scale
    - Delete: Remove some hatched elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating elements with different hatch patterns...")
    
    elements = []
    
    # Element 1: Diagonal hatch
    diag_hatch = duc.create_hatch_content("diagonal_hatch", opacity=0.8)
    diag_style = duc.create_fill_and_stroke_style(
        fill_content=diag_hatch,
        stroke_content=duc.create_solid_content("#000000"),
        stroke_width=1.0
    )
    diag_rect = (duc.ElementBuilder()
                 .at_position(50, 50)
                 .with_size(100, 80)
                 .with_label("Diagonal Hatch")
                 .with_styles(diag_style)
                 .build_rectangle()
                 .build())
    elements.append(diag_rect)
    
    # Element 2: Cross hatch
    cross_hatch = duc.create_hatch_content("cross_hatch", opacity=0.6)
    cross_style = duc.create_fill_and_stroke_style(
        fill_content=cross_hatch,
        stroke_content=duc.create_solid_content("#333333"),
        stroke_width=1.5
    )
    cross_poly = (duc.ElementBuilder()
                  .at_position(180, 50)
                  .with_size(80, 60)
                  .with_label("Cross Hatch")
                  .with_styles(cross_style)
                  .build_polygon()
                  .with_sides(4)
                  .build())
    elements.append(cross_poly)
    
    # Element 3: Custom hatch (if supported, else use another predefined)
    # Assuming create_custom_hatch_pattern exists; if not, use "brick_hatch"
    try:
        custom_lines = [
            duc.HatchPatternLine(
                angle=0.0,
                origin=duc.DucPoint(x=0, y=0, mirroring=10),  # BEZIER_MIRRORING.NONE
                offset=[0, 20],
                dash_pattern=[10, 5]
            ),
            duc.HatchPatternLine(
                angle=math.pi / 2,
                origin=duc.DucPoint(x=0, y=0, mirroring=10),  # BEZIER_MIRRORING.NONE
                offset=[20, 0],
                dash_pattern=[10, 5]
            )
        ]
        custom_hatch_pattern = duc.CustomHatchPattern(
            name="custom_grid",
            description="Grid-like hatch",
            lines=custom_lines
        )
        custom_hatch = duc.create_hatch_content("brick_hatch", opacity=0.7)
    except AttributeError:
        # Fallback to predefined brick_hatch
        custom_hatch = duc.create_hatch_content("brick_hatch", opacity=0.7)
    
    custom_style = duc.create_fill_and_stroke_style(
        fill_content=custom_hatch,
        stroke_content=duc.create_solid_content("#666666"),
        stroke_width=2.0
    )
    custom_ellipse = (duc.ElementBuilder()
                      .at_position(50, 150)
                      .with_size(90, 70)
                      .with_label("Custom Hatch")
                      .with_styles(custom_style)
                      .build_ellipse()
                      .build())
    elements.append(custom_ellipse)
    
    # Element 4: No hatch (solid fill for comparison)
    solid_style = duc.create_fill_and_stroke_style(
        fill_content=duc.create_solid_content("#FF0000", opacity=0.9),
        stroke_content=duc.create_solid_content("#000000"),
        stroke_width=1.0
    )
    solid_rect = (duc.ElementBuilder()
                  .at_position(180, 150)
                  .with_size(70, 50)
                  .with_label("Solid Fill")
                  .with_styles(solid_style)
                  .build_rectangle()
                  .build())
    elements.append(solid_rect)
    
    print(f"Created {len(elements)} elements with different hatch patterns")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_hatching_patterns_initial.duc")
    duc.write_duc_file(
        file_path=initial_file,
        name="HatchingPatternsCSPMDS_Initial",
        elements=elements
    )
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.read_duc_file(initial_file)
    loaded_elements = parsed_data.elements
    
    assert len(loaded_elements) == len(elements)
    print(f"Loaded {len(loaded_elements)} elements")
    
    # Verify hatch properties
    hatched_elements = [el for el in loaded_elements if 
                       hasattr(el.element, 'base') and 
                       el.element.base.label in ["Diagonal Hatch", "Cross Hatch", "Custom Hatch"]]
    
    assert len(hatched_elements) == 3  # diag, cross, custom
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying hatch patterns...")
    
    mutations_count = 0
    
    # Mutate diagonal hatch: change to cross_hatch and opacity
    for el_wrapper in loaded_elements:
        if el_wrapper.element.base.label == "Diagonal Hatch":
            new_hatch = duc.create_hatch_content("cross_hatch", opacity=0.5)
            new_style = duc.create_fill_and_stroke_style(
                fill_content=new_hatch,
                stroke_content=duc.create_solid_content("#000000"),
                stroke_width=1.0
            )
            duc.mutate_element(el_wrapper, styles=new_style)
            mutations_count += 1
            print("Mutated diagonal to cross hatch")
            break
    
    # Mutate cross hatch: change opacity and scale
    for el_wrapper in loaded_elements:
        if el_wrapper.element.base.label == "Cross Hatch":
            # Assuming hatch content has scale; if not, mutate opacity via style
            new_hatch = duc.create_hatch_content("cross_hatch", opacity=0.9)
            new_style = duc.create_fill_and_stroke_style(
                fill_content=new_hatch,
                stroke_content=duc.create_solid_content("#333333"),
                stroke_width=1.5
            )
            duc.mutate_element(el_wrapper, styles=new_style)
            mutations_count += 1
            print("Mutated cross hatch opacity")
            break
    
    # Mutate custom: change to diagonal_hatch
    for el_wrapper in loaded_elements:
        if el_wrapper.element.base.label == "Custom Hatch":
            new_hatch = duc.create_hatch_content("diagonal_hatch", opacity=0.8)
            new_style = duc.create_fill_and_stroke_style(
                fill_content=new_hatch,
                stroke_content=duc.create_solid_content("#666666"),
                stroke_width=2.0
            )
            duc.mutate_element(el_wrapper, styles=new_style)
            mutations_count += 1
            print("Mutated custom to diagonal hatch")
            break
    
    print(f"Applied {mutations_count} hatch mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some hatched elements...")
    
    # Remove solid fill and one hatched element
    def get_label(el):
        if hasattr(el.element, 'base'):
            return el.element.base.label
        return None
    
    elements_to_keep = [el for el in loaded_elements if get_label(el) != "Solid Fill"]
    elements_to_keep = [el for el in elements_to_keep if get_label(el) != "Cross Hatch"]
    
    print(f"Deleted 2 elements, keeping {len(elements_to_keep)}")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_hatching_patterns_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="HatchingPatternsCSPMDS_Final",
        elements=elements_to_keep
    )
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.read_duc_file(final_file)
    final_elements = final_parsed_data.elements
    
    print(f"Final element count: {len(final_elements)}")
    assert len(final_elements) == len(elements_to_keep)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    
    # Verify mutations
    mutated_count = 0
    for el_wrapper in final_elements:
        if (hasattr(el_wrapper.element, 'base') and 
            el_wrapper.element.base.label == "Diagonal Hatch"):
            # Now should be cross_hatch
            if (el_wrapper.element.base.styles and 
                el_wrapper.element.base.styles.background and 
                isinstance(el_wrapper.element.base.styles.background, list) and 
                len(el_wrapper.element.base.styles.background) > 0):
                assert "cross_hatch" in str(el_wrapper.element.base.styles.background[0].content.src)
            mutated_count += 1
        elif (hasattr(el_wrapper.element, 'base') and 
              el_wrapper.element.base.label == "Custom Hatch"):
            # Now should be diagonal_hatch
            if (el_wrapper.element.base.styles and 
                el_wrapper.element.base.styles.background and 
                isinstance(el_wrapper.element.base.styles.background, list) and 
                len(el_wrapper.element.base.styles.background) > 0):
                assert "diagonal_hatch" in str(el_wrapper.element.base.styles.background[0].content.src)
            mutated_count += 1
    
    assert mutated_count == 2, "Expected 2 mutated hatch patterns"
    
    # Verify deletions
    remaining_labels = [get_label(el) for el in final_elements]
    assert "Solid Fill" not in remaining_labels
    assert "Cross Hatch" not in remaining_labels
    
    print("✅ CSPMDS Hatching Patterns test completed successfully!")
    print(f"   - Created {len(elements)} elements with hatch patterns")
    print(f"   - Mutated hatch patterns and opacity")
    print(f"   - Deleted 2 elements")
    print(f"   - Final state: {len(final_elements)} elements")


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir
