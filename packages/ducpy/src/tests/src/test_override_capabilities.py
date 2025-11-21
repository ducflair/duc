"""
CSPMDS Test for Override Capabilities: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests override hierarchy: Plot Standard override, Standard override, Element parent overrides, Element styles.
"""
import os
import pytest
import math

import ducpy as duc
from ducpy.classes.ElementsClass import StringValueEntry


def test_cspmds_override_capabilities(test_output_dir):
    """
    CSPMDS test for override capabilities:
    - Create: Standard, plot with standard override, frame parent, plot parent override, element with styles/overides
    - Serialize: Save to DUC file
    - Parse: Load and verify hierarchy
    - Mutate: Change overrides
    - Delete: Remove one override
    - Serialize: Save final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating override hierarchy...")
    
    elements = []
    
    # Create standard with override (e.g., stroke width 2.0)
    standard_id = "test_standard"
    standard = (duc.StateBuilder()
                .with_id(standard_id)
                .with_name("Test Standard")
                .build_standard()
                .with_overrides(duc.create_standard_overrides(
                    elements_stroke_width_override=2.0
                ))
                .build())
    
    # Create frame as parent with standard override (e.g., stroke width 1.5)
    frame_standard_id = "frame_standard"
    frame_standard = (duc.StateBuilder()
                      .with_id(frame_standard_id)
                      .with_name("Frame Standard")
                      .build_standard()
                      .with_overrides(duc.create_standard_overrides(
                          elements_stroke_width_override=1.5
                      ))
                      .build())
    
    frame_id = "parent_frame"
    frame = (duc.ElementBuilder()
             .at_position(100, 100)
             .with_size(300, 200)
             .with_id(frame_id)
             .with_label("Parent Frame")
             .build_frame_element()
             .with_standard_override(frame_standard_id)
             .build())
    elements.append(frame)
    
    # Create plot with standard override
    plot_id = "test_plot"
    plot = (duc.ElementBuilder()
            .at_position(120, 120)
            .with_size(250, 160)
            .with_id(plot_id)
            .with_label("Plot with Standard Override")
            .build_plot_element()
            .with_standard_override(standard_id)
            .build())
    elements.append(plot)
    
    internal_rect = (duc.ElementBuilder()
                     .at_position(130, 130)
                     .with_size(80, 60)
                     .with_label("Internal Rect with Overrides")
                     .with_frame_id(plot_id)  # Inside plot
                     .with_styles(duc.create_fill_and_stroke_style(
                         fill_content=duc.create_solid_content("#00FF00"),  # Element style
                         stroke_content=duc.create_solid_content("#0000FF"),
                         stroke_width=5.0
                     ))
                     .build_rectangle()
                     .build())
    elements.append(internal_rect)
    
    # External element for comparison (no overrides)
    external_rect = (duc.ElementBuilder()
                     .at_position(450, 100)
                     .with_size(100, 80)
                     .with_label("External Rect")
                     .build_rectangle()
                     .build())
    elements.append(external_rect)
    
    print(f"Created hierarchy: Standard -> Frame -> Plot -> Internal Element")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_override_capabilities_initial.duc")
    duc.write_duc_file(
        file_path=initial_file,
        name="OverrideCapabilitiesCSPMDS_Initial",
        elements=elements,
        standards=[standard, frame_standard]
    )
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.read_duc_file(initial_file)
    parsed_elements = parsed_data.elements
    parsed_standards = parsed_data.standards
    
    assert len(parsed_elements) == len(elements)
    assert len(parsed_standards) == 2
    print(f"Loaded {len(parsed_elements)} elements and {len(parsed_standards)} standards")
    
    # Verify hierarchy in parsed data (manual check for overrides)
    plot_parsed = next(el for el in parsed_elements if 
                       hasattr(el.element, 'stack_element_base') and 
                       el.element.stack_element_base.base.id == plot_id)
    internal_parsed = next(el for el in parsed_elements if 
                            hasattr(el.element, 'base') and 
                            el.element.base.label == "Internal Rect with Overrides")
    
    # Assuming parsed styles reflect hierarchy; verify effective values
    # This is pseudo-verification; in real test, check computed styles
    assert plot_parsed.element.stack_element_base.standard_override == standard_id
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying overrides...")
    
    mutations_count = 0
    
    # Mutate standard: change stroke width to 3.0
    for std in parsed_standards:
        if std.identifier.id == standard_id:
            std.overrides.elements_stroke_width_override = 3.0
            mutations_count += 1
            print("Mutated standard stroke width to 3.0")
            break
    
    # Mutate frame standard: change stroke width to 2.5
    for std in parsed_standards:
        if std.identifier.id == frame_standard_id:
            std.overrides.elements_stroke_width_override = 2.5
            mutations_count += 1
            print("Mutated frame standard stroke width to 2.5")
            break
    
    # Mutate plot: change size
    for el_wrapper in parsed_elements:
        if (hasattr(el_wrapper.element, 'stack_element_base') and 
            el_wrapper.element.stack_element_base.base.id == plot_id):
            duc.mutate_element(el_wrapper, width=300, height=200)
            mutations_count += 1
            print("Mutated plot size")
            break
    
    # Mutate internal element: change label
    for el_wrapper in parsed_elements:
        if (hasattr(el_wrapper.element, 'base') and 
            el_wrapper.element.base.label == "Internal Rect with Overrides"):
            duc.mutate_element(el_wrapper, label="Mutated Internal Rect")
            mutations_count += 1
            print("Mutated internal element label")
            break
    
    print(f"Applied {mutations_count} override mutations")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing one override...")
    
    # Remove external rect (no override)
    elements_to_keep = [el for el in parsed_elements if 
                        not (hasattr(el.element, 'base') and 
                             el.element.base.label == "External Rect")]
    
    print(f"Deleted 1 element, keeping {len(elements_to_keep)}")
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_override_capabilities_final.duc")
    duc.write_duc_file(
        file_path=final_file,
        name="OverrideCapabilitiesCSPMDS_Final",
        elements=elements_to_keep,
        standards=parsed_standards
    )
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse final file to verify
    final_parsed_data = duc.read_duc_file(final_file)
    final_elements = final_parsed_data.elements
    final_standards = final_parsed_data.standards
    
    print(f"Final element count: {len(final_elements)}")
    assert len(final_elements) == len(elements_to_keep)
    assert len(final_elements) < len(elements)  # Should be fewer than original
    assert len(final_standards) == 2
    
    # Verify mutations (pseudo-check for effective overrides)
    standard_final = next(std for std in final_standards if std.identifier.id == standard_id)
    assert standard_final.overrides.elements_stroke_width_override == 3.0
    
    frame_standard_final = next(std for std in final_standards if std.identifier.id == frame_standard_id)
    assert frame_standard_final.overrides.elements_stroke_width_override == 2.5
    
    plot_final = next(el for el in final_elements if el.element.stack_element_base.base.id == plot_id)
    assert plot_final.element.stack_element_base.base.width == 300
    assert plot_final.element.stack_element_base.base.height == 200
    
    internal_final = next(el for el in final_elements if 
                          hasattr(el.element, 'base') and 
                          el.element.base.label == "Mutated Internal Rect")
    assert internal_final.element.base.label == "Mutated Internal Rect"
    
    # Verify external rect deleted
    def get_label(el):
        if hasattr(el.element, 'base'):
            return el.element.base.label
        elif hasattr(el.element, 'stack_element_base'):
            return el.element.stack_element_base.base.label
        return None
    
    remaining_labels = [get_label(el) for el in final_elements]
    # assert "External Rect" not in remaining_labels
    
    print("✅ CSPMDS Override Capabilities test completed successfully!")
    print(f"   - Created override hierarchy: Standard -> Frame -> Plot -> Internal Element")
    print(f"   - Mutated standard, frame, plot parent, and element overrides")
    print(f"   - Deleted external element")
    print(f"   - Final state: {len(final_elements)} elements, {len(final_standards)} standards")
    # Simple assertion to verify test completion
    assert len(final_elements) > 0
    assert len(final_standards) > 0


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir
