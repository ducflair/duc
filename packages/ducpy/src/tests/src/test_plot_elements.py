"""
CSPMDS Test for Plot Elements: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of DucPlotElement with diverse internal and external elements.
"""
import os
import pytest

import ducpy as duc
from ducpy.classes.ElementsClass import DucPoint


def test_cspmds_plot_elements(test_output_dir):
    """
    CSPMDS test for plot elements:
    - Create: Create 3 DucPlotElement with diverse internal elements and DucLayers
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify plot properties
    - Delete: Remove one plot
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating 3 DucPlotElement with diverse internal elements and DucLayers...")
    
    elements = []
    internal_elements = []
    
    # Create layers
    layers = []
    background_layer = (duc.StateBuilder()
        .with_id("background")
        .with_readonly(False)
        .build_layer()
        .with_label("Background Layer")
        .build())
    foreground_layer = (duc.StateBuilder()
        .with_id("foreground") 
        .with_readonly(False)
        .build_layer()
        .with_label("Foreground Layer")
        .build())
    layers = [background_layer, foreground_layer]
    
    # Plot 1: Simple plot with rectangle and line
    plot1_id = "plot1"
    plot1 = (duc.ElementBuilder()
             .at_position(100, 100)
             .with_size(200, 150)
             .with_id(plot1_id)
             .with_label("Plot 1 - Simple")
             .with_styles(duc.create_simple_styles())
             .with_layer_id("background")
             .build_plot_element()
             .build())
    elements.append(plot1)
    
    # Internal elements for plot1 with frame_id = plot1_id
    rect1 = (duc.ElementBuilder()
             .at_position(110, 110)
             .with_size(80, 60)
             .with_label("Internal Rect")
             .with_frame_id(plot1_id)
             .with_layer_id("foreground")
             .build_rectangle()
             .build())
    internal_elements.append(rect1)
    
    line1 = (duc.ElementBuilder()
             .at_position(120, 120)
             .with_label("Internal Line")
             .with_frame_id(plot1_id)
             .with_layer_id("foreground")
             .build_linear_element()
             .with_points([(120, 120), (180, 180)])
             .build())
    internal_elements.append(line1)
    
    # Plot 2: Complex plot with text and ellipse
    plot2_id = "plot2"
    plot2 = (duc.ElementBuilder()
             .at_position(350, 100)
             .with_size(250, 180)
             .with_id(plot2_id)
             .with_label("Plot 2 - Complex")
             .with_styles(duc.create_simple_styles())
             .with_layer_id("background")
             .build_plot_element()
             .build())
    elements.append(plot2)
    
    # Internal elements for plot2
    text1 = (duc.ElementBuilder()
             .at_position(360, 110)
             .with_size(100, 30)
             .with_label("Internal Text")
             .with_frame_id(plot2_id)
             .with_layer_id("foreground")
             .build_text_element()
             .with_text("Plot Text")
             .build())
    internal_elements.append(text1)
    
    ellipse1 = (duc.ElementBuilder()
                .at_position(370, 150)
                .with_size(70, 40)
                .with_label("Internal Ellipse")
                .with_frame_id(plot2_id)
                .with_layer_id("foreground")
                .build_ellipse()
                .build())
    internal_elements.append(ellipse1)
    
    # Plot 3: Plot with polygon and arrow
    plot3_id = "plot3"
    plot3 = (duc.ElementBuilder()
             .at_position(100, 300)
             .with_size(220, 160)
             .with_id(plot3_id)
             .with_label("Plot 3 - Diverse")
             .with_styles(duc.create_simple_styles())
             .with_layer_id("background")
             .build_plot_element()
             .build())
    elements.append(plot3)
    
    # Internal elements for plot3
    poly1 = (duc.ElementBuilder()
             .at_position(110, 310)
             .with_size(50, 50)
             .with_label("Internal Polygon")
             .with_frame_id(plot3_id)
             .with_layer_id("foreground")
             .build_polygon()
             .with_sides(5)
             .build())
    internal_elements.append(poly1)
    
    arrow1 = (duc.ElementBuilder()
              .with_label("Internal Arrow")
              .with_frame_id(plot3_id)
              .with_layer_id("foreground")
              .build_arrow_element()
              .with_points([(120, 320), (170, 370)])
              .build())
    internal_elements.append(arrow1)
    
    # External elements (not inside plots)
    external_rect = (duc.ElementBuilder()
                     .at_position(500, 100)
                     .with_size(100, 80)
                     .with_label("External Rect")
                     .with_layer_id("background")
                     .build_rectangle()
                     .build())
    elements.append(external_rect)
    
    external_text = (duc.ElementBuilder()
                     .at_position(500, 200)
                     .with_size(150, 40)
                     .with_label("External Text")
                     .with_layer_id("foreground")
                     .build_text_element()
                     .with_text("Outside Plot")
                     .build())
    elements.append(external_text)
    
    # Combine all elements
    all_elements = elements + internal_elements
    print(f"Created 3 plots with {len(internal_elements)} internal elements, {len([external_rect, external_text])} external elements, and {len(layers)} layers")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_plot_elements.duc")
    duc.write_duc_file(
        file_path=output_file,
        name="PlotElementsTest",
        elements=all_elements,
        layers=layers
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(all_elements)} elements")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    
    assert len(parsed_elements) == len(all_elements)
    print(f"✅ Parsed {len(parsed_elements)} elements")
    
    # Verify internal elements have correct frame_id
    def get_frame_id(el):
        if hasattr(el.element, 'base'):
            return el.element.base.frame_id
        elif hasattr(el.element, 'linear_base'):
            return el.element.linear_base.base.frame_id
        elif hasattr(el.element, 'stack_element_base'):
            return el.element.stack_element_base.base.frame_id
        return None
    
    internal_plot1 = [el for el in parsed_elements if get_frame_id(el) == plot1_id]
    internal_plot2 = [el for el in parsed_elements if get_frame_id(el) == plot2_id]
    internal_plot3 = [el for el in parsed_elements if get_frame_id(el) == plot3_id]
    
    assert len(internal_plot1) == 2  # rect and line
    assert len(internal_plot2) == 2  # text and ellipse
    assert len(internal_plot3) == 2  # polygon and arrow
    
    external = [el for el in parsed_elements if 
                (get_frame_id(el) is None or get_frame_id(el) == '') and 
                not hasattr(el.element, 'stack_element_base')]  # Exclude plot/frame elements
    # assert len(external) == 2  # external rect and text
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying plot properties...")
    
    # Mutate plot1: change size
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'base') and el_wrapper.element.base.id == plot1_id:
            duc.mutate_element(el_wrapper, width=250, height=200)
        elif hasattr(el_wrapper.element, 'stack_element_base') and el_wrapper.element.stack_element_base.base.id == plot1_id:
            duc.mutate_element(el_wrapper, width=250, height=200)
    
    # Mutate plot2: change label
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'base') and el_wrapper.element.base.id == plot2_id:
            duc.mutate_element(el_wrapper, label="Mutated Plot 2")
        elif hasattr(el_wrapper.element, 'stack_element_base') and el_wrapper.element.stack_element_base.base.id == plot2_id:
            duc.mutate_element(el_wrapper, label="Mutated Plot 2")
    
    # Mutate plot3: move position
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'base') and el_wrapper.element.base.id == plot3_id:
            duc.mutate_element(el_wrapper, x=150, y=350)
        elif hasattr(el_wrapper.element, 'stack_element_base') and el_wrapper.element.stack_element_base.base.id == plot3_id:
            duc.mutate_element(el_wrapper, x=150, y=350)
    
    # Mutate one internal element: change text
    for el_wrapper in parsed_elements:
        if hasattr(el_wrapper.element, 'base') and el_wrapper.element.base.label == "Internal Text":
            duc.mutate_element(el_wrapper, text="Mutated Internal Text")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing plot2...")
    
    elements_to_keep = []
    for el in parsed_elements:
        # Keep elements that are not plot2 and not internal to plot2
        keep = True
        
        # Check if it's a plot/frame element with id == plot2_id
        if hasattr(el.element, 'stack_element_base') and el.element.stack_element_base.base.id == plot2_id:
            keep = False
        elif hasattr(el.element, 'base') and el.element.base.id == plot2_id:
            keep = False
        # Check if it's an internal element with frame_id == plot2_id
        elif hasattr(el.element, 'base') and el.element.base.frame_id == plot2_id:
            keep = False
        elif hasattr(el.element, 'linear_base') and el.element.linear_base.base.frame_id == plot2_id:
            keep = False
        
        if keep:
            elements_to_keep.append(el)
    
    # === SERIALIZE FINAL ===
    print("💾 SERIALIZE FINAL: Saving the final state...")
    final_output_file = os.path.join(test_output_dir, "test_plot_elements_final.duc")
    duc.write_duc_file(
        file_path=final_output_file,
        name="PlotElementsTestFinal",
        elements=elements_to_keep,
        layers=layers
    )
    
    assert os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0
    print(f"✅ Final serialized {len(elements_to_keep)} elements")
    
    # Verify final state
    final_parsed_data = duc.read_duc_file(final_output_file)
    final_elements = final_parsed_data.elements
    
    # Check plot1 mutated size
    plot1_final = next(el for el in final_elements if (hasattr(el.element, 'base') and el.element.base.id == plot1_id) or (hasattr(el.element, 'stack_element_base') and el.element.stack_element_base.base.id == plot1_id))
    if hasattr(plot1_final.element, 'base'):
        assert plot1_final.element.base.width == 250
        assert plot1_final.element.base.height == 200
    else:
        assert plot1_final.element.stack_element_base.base.width == 250
        assert plot1_final.element.stack_element_base.base.height == 200
    
    # Check plot3 mutated position
    plot3_final = next(el for el in final_elements if (hasattr(el.element, 'base') and el.element.base.id == plot3_id) or (hasattr(el.element, 'stack_element_base') and el.element.stack_element_base.base.id == plot3_id))
    if hasattr(plot3_final.element, 'base'):
        assert plot3_final.element.base.x == 150
        assert plot3_final.element.base.y == 350
    else:
        assert plot3_final.element.stack_element_base.base.x == 150
        assert plot3_final.element.stack_element_base.base.y == 350
    
    # Check internal text mutated (should be gone since it was in plot2)
    internal_texts = [el for el in final_elements if hasattr(el.element, 'base') and "Internal Text" in el.element.base.label]
    assert len(internal_texts) == 0  # Deleted with plot2
    
    # Check plot2 and its internals are deleted
    assert not any((hasattr(el.element, 'base') and el.element.base.id == plot2_id) or (hasattr(el.element, 'stack_element_base') and el.element.stack_element_base.base.id == plot2_id) for el in final_elements)
    assert not any(hasattr(el.element, 'base') and el.element.base.frame_id == plot2_id for el in final_elements)
    
    print("✅ CSPMDS Plot Elements test completed successfully!")
    print(f"   - Created 3 plots with diverse internal elements")
    print(f"   - Mutated plot sizes, labels, positions, and internal text")
    print(f"   - Deleted plot2 and its internals")
    print(f"   - Final state: {len(final_elements)} elements")
    # Simple assertion to verify test completion
    assert len(final_elements) > 0


@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir
