"""
CSPMDS Test for Dimension Elements: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of dimension elements in DUC files.
"""
import io
import os
import pytest

import ducpy as duc


def test_cspmds_dimension_elements(test_output_dir):
    """
    CSPMDS test for dimension elements:
    - Create: Create dimension elements with different types
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify dimension properties
    - Delete: Remove some dimensions
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating dimension elements...")
    
    elements = []
    
    # Create base elements for dimensions using builders API
    rect1 = (duc.ElementBuilder()
              .at_position(100, 100)
              .with_size(80, 60)
              .with_styles(duc.create_simple_styles())
              .with_label("Base Rectangle 1")
              .build_rectangle()
              .build())
    
    rect2 = (duc.ElementBuilder()
              .at_position(300, 100)
              .with_size(80, 60)
              .with_styles(duc.create_simple_styles())
              .with_label("Base Rectangle 2")
              .build_rectangle()
              .build())
    
    # Create dimension elements
    
    linear_dim1 = (duc.ElementBuilder()
                   .at_position(140, 80)
                   .with_size(120, 40)
                   .with_id("linear_dim_1")
                   .with_label("Linear Dimension 1")
                   .build_linear_dimension()
                   .with_origin1((100, 100))
                   .with_origin2((180, 100))
                   .with_location((140, 80))
                   .with_text_override("80mm")
                   .build())
    
    angular_dim1 = (duc.ElementBuilder()
                    .at_position(200, 200)
                    .with_size(100, 100)
                    .with_id("angular_dim_1")
                    .with_label("Angular Dimension 1")
                    .build_angular_dimension()
                    .with_origin1((200, 200))
                    .with_origin2((250, 200))
                    .with_location((225, 175))
                    .with_text_override("45°")
                    .build())
    
    # Add a Radius Dimension
    radius_dim1 = (duc.ElementBuilder()
                   .at_position(400, 200) # Adjusted position
                   .with_size(100, 50)
                   .with_id("radius_dim_1")
                   .with_label("Radius Dimension 1")
                   .build_radius_dimension()
                   .with_origin1((450, 200)) # Center of the circle
                   .with_origin2((450 + 50, 200)) # Point on the circumference
                   .with_location((450, 250)) # Dimension line location
                   .with_text_override("R50")
                   .build())

    # Add more dimension types
    aligned_dim = (duc.ElementBuilder()
                   .at_position(50, 400)
                   .with_size(100, 40)
                   .with_id("aligned_dim_1")
                   .with_label("Aligned Dimension 1")
                   .build_aligned_dimension()
                   .with_origin1((50, 400))
                   .with_origin2((150, 440))
                   .with_location((100, 390))
                   .with_text_override("Diagonal")
                   .build())

    diameter_dim = (duc.ElementBuilder()
                    .at_position(250, 400)
                    .with_size(100, 50)
                    .with_id("diameter_dim_1")
                    .with_label("Diameter Dimension 1")
                    .build_diameter_dimension()
                    .with_origin1((300, 400))  # Center of the circle
                    .with_origin2((350, 400))  # Point on circumference, forming radius
                    .with_location((300, 450))
                    .with_text_override("Ø100")
                    .build())

    arc_length_dim = (duc.ElementBuilder()
                      .at_position(450, 400)
                      .with_size(100, 50)
                      .with_id("arc_length_dim_1")
                      .with_label("Arc Length Dimension 1")
                      .build_arc_length_dimension()
                      .with_origin1((450, 400))
                      .with_origin2((550, 400))
                      .with_location((500, 450))
                      .with_text_override("Arc L")
                      .build())

    center_mark_dim = (duc.ElementBuilder()
                       .at_position(650, 400)
                       .with_size(20, 20)
                       .with_id("center_mark_dim_1")
                       .with_label("Center Mark Dimension 1")
                       .build_center_mark_dimension()
                       .with_origin1((660, 410))
                       .with_origin2((660, 410))
                       .with_location((660, 410))
                       .with_text_override("CM")
                       .build())

    rotated_dim = (duc.ElementBuilder()
                   .at_position(50, 550)
                   .with_size(150, 40)
                   .with_id("rotated_dim_1")
                   .with_label("Rotated Dimension 1")
                   .build_rotated_dimension()
                   .with_origin1((50, 550))
                   .with_origin2((200, 550))
                   .with_location((125, 500))
                   .with_text_override("Rotated Length")
                   .build())

    spacing_dim = (duc.ElementBuilder()
                   .at_position(250, 550)
                   .with_size(100, 40)
                   .with_id("spacing_dim_1")
                   .with_label("Spacing Dimension 1")
                   .build_spacing_dimension()
                   .with_origin1((250, 550))
                   .with_origin2((350, 550))
                   .with_location((300, 520))
                   .with_text_override("Spacing")
                   .build())

    continue_dim = (duc.ElementBuilder()
                    .at_position(400, 550)
                    .with_size(100, 40)
                    .with_id("continue_dim_1")
                    .with_label("Continue Dimension 1")
                    .build_continue_dimension()
                    .with_origin1((400, 550))
                    .with_origin2((500, 550))
                    .with_location((450, 520))
                    .with_text_override("Cont. Dim")
                    .build())

    baseline_dim = (duc.ElementBuilder()
                    .at_position(550, 550)
                    .with_size(100, 40)
                    .with_id("baseline_dim_1")
                    .with_label("Baseline Dimension 1")
                    .build_baseline_dimension()
                    .with_origin1((550, 550))
                    .with_origin2((650, 550))
                    .with_location((600, 520))
                    .with_text_override("Baseline Dim")
                    .build())

    jogged_linear_dim = (duc.ElementBuilder()
                         .at_position(50, 700)
                         .with_size(150, 80)
                         .with_id("jogged_linear_dim_1")
                         .with_label("Jogged Linear Dimension 1")
                         .build_jogged_linear_dimension()
                         .with_origin1((50, 700))
                         .with_origin2((200, 700))
                         .with_location((125, 750))
                         .with_jog_x(10)
                         .with_jog_y(20)
                         .with_text_override("Jogged")
                         .build())

    # Add all elements to the list
    elements.extend([
        rect1, rect2,
        linear_dim1, angular_dim1, radius_dim1,
        aligned_dim, diameter_dim, arc_length_dim, center_mark_dim,
        rotated_dim, spacing_dim, continue_dim, baseline_dim, jogged_linear_dim
    ])
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_dimension_elements.duc")
    duc.write_duc_file(
        file_path=output_file,
        name="DimensionElementsTest",
        elements=elements
    )
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(elements)} elements")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.read_duc_file(output_file)
    parsed_elements = parsed_data.elements
    
    assert len(parsed_elements) == len(elements)
    print(f"✅ Parsed {len(parsed_elements)} elements")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying dimension elements...")
    
    # Mutate dimension properties
    for el_wrapper in parsed_elements:
        if isinstance(el_wrapper.element, duc.DucDimensionElement):
            original_x = el_wrapper.element.base.x
            original_y = el_wrapper.element.base.y
            original_text = el_wrapper.element.text_override

            # Update position and text_override
            duc.mutate_element(el_wrapper, 
                              x=original_x + 20,
                              y=original_y + 10,
                              text_override=f"MUTATED {original_text}")
            
            print(f"Mutated {el_wrapper.element.base.label}: New X={el_wrapper.element.base.x}, New Y={el_wrapper.element.base.y}, New Text='{el_wrapper.element.text_override}'")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some dimension elements...")
    
    # Remove specific dimension types to test deletion
    elements_to_keep = [el for el in parsed_elements if not (
        isinstance(el.element, duc.DucDimensionElement) and (
            el.element.dimension_type == duc.DIMENSION_TYPE.ANGULAR or
            el.element.dimension_type == duc.DIMENSION_TYPE.ARC_LENGTH or
            el.element.dimension_type == duc.DIMENSION_TYPE.SPACING
        )
    )]
    
    # === SERIALIZE FINAL ===
    print("💾 SERIALIZE FINAL: Saving the final state...")
    final_output_file = os.path.join(test_output_dir, "test_dimension_elements_final.duc")
    duc.write_duc_file(
        file_path=final_output_file,
        name="DimensionElementsTestFinal",
        elements=elements_to_keep
    )
    
    assert os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0
    print(f"✅ Final serialized {len(elements_to_keep)} elements")
    
    # Verify the final state
    final_parsed_data = duc.read_duc_file(final_output_file)
    final_elements = final_parsed_data.elements
    
    # Count dimension elements by type
    linear_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.LINEAR]
    angular_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.ANGULAR]
    radius_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.RADIUS]
    aligned_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.ALIGNED]
    diameter_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.DIAMETER]
    arc_length_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.ARC_LENGTH]
    center_mark_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.CENTER_MARK]
    rotated_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.ROTATED]
    spacing_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.SPACING]
    continue_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.CONTINUE]
    baseline_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.BASELINE]
    jogged_linear_dims = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.JOGGED_LINEAR]

    # Verify correct counts after deletion
    assert len(linear_dims) == 1
    assert len(angular_dims) == 0 # Deleted
    assert len(radius_dims) == 1
    assert len(aligned_dims) == 1
    assert len(diameter_dims) == 1
    assert len(arc_length_dims) == 0 # Deleted
    assert len(center_mark_dims) == 1
    assert len(rotated_dims) == 1
    assert len(spacing_dims) == 0 # Deleted
    assert len(continue_dims) == 1
    assert len(baseline_dims) == 1
    assert len(jogged_linear_dims) == 1
    assert len(final_elements) == len(elements_to_keep) # total elements count
    
    print(f"Final elements: {len(final_elements)}")
    print(f"Linear dimensions: {len(linear_dims)}")
    print(f"Angular dimensions: {len(angular_dims)}")
    print(f"Radius dimensions: {len(radius_dims)}")
    print(f"Aligned dimensions: {len(aligned_dims)}")
    print(f"Diameter dimensions: {len(diameter_dims)}")
    print(f"Arc Length dimensions: {len(arc_length_dims)}")
    print(f"Center Mark dimensions: {len(center_mark_dims)}")
    print(f"Rotated dimensions: {len(rotated_dims)}")
    print(f"Spacing dimensions: {len(spacing_dims)}")
    print(f"Continue dimensions: {len(continue_dims)}")
    print(f"Baseline dimensions: {len(baseline_dims)}")
    print(f"Jogged Linear dimensions: {len(jogged_linear_dims)}")

    # Verify mutations were applied to the remaining elements
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucDimensionElement):
            original_text = el_wrapper.element.text_override.replace("MUTATED ", "")
            # The base x, y of the element itself should have moved
            assert el_wrapper.element.text_override == f"MUTATED {original_text}"
            print(f"✅ Verified mutation for {el_wrapper.element.base.label}")

    print("✅ CSPMDS Dimension Elements test completed successfully!")
    print(f"   - Created {len(elements)} initial elements")
    print(f"   - Mutated dimension properties")
    print(f"   - Deleted angular, arc length, and spacing dimensions")
    print(f"   - Final state: {len(final_elements)} elements")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir
