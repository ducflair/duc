"""
CSPMDS Test for Tolerances: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of tolerance elements in DUC files.
"""
import io
import os
import pytest

import ducpy as duc


def test_cspmds_tolerances(test_output_dir):
    """
    CSPMDS test for tolerance elements:
    - Create: Create tolerance elements with different types
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify tolerance properties
    - Delete: Remove some tolerances
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating tolerance elements...")
    
    elements = []
    
    # Create base elements for tolerances using builders API
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
    
    # Create tolerance elements
    from ducpy.classes.ElementsClass import GeometricPoint
    
    linear_tolerance1 = (duc.ElementBuilder()
                         .at_position(140, 80)
                         .with_size(120, 40)
                         .with_id("linear_tolerance_1")
                         .with_label("Linear Tolerance 1")
                         .build_linear_dimension()
                         .with_origin1((100, 100))
                         .with_origin2((180, 100))
                         .with_location((140, 80))
                         .with_text_override("80±0.1mm")
                         .build())
    
    angular_tolerance1 = (duc.ElementBuilder()
                          .at_position(200, 200)
                          .with_size(100, 100)
                          .with_id("angular_tolerance_1")
                          .with_label("Angular Tolerance 1")
                          .build_angular_dimension()
                          .with_origin1((200, 200))
                          .with_origin2((250, 200))
                          .with_location((225, 175))
                          .with_text_override("45°±0.5°")
                          .build())
    
    # Add a Feature Control Frame (FCF) element
    # This is a complex tolerance type often used in GD&T
    fcf_element = (duc.ElementBuilder()
                   .at_position(450, 150)  # Adjusted position
                   .with_size(150, 50)  # Approximate size for visualization
                   .with_id("fcf_tolerance_1")
                   .with_label("FCF Tolerance 1")
                   .build_feature_control_frame_element()
                   .with_segments([
                       duc.create_fcf_segment_row(  # First row, one segment
                           segments=[
                               duc.create_fcf_segment(
                                   symbol=duc.GDT_SYMBOL.POSITION,
                                   tolerance=duc.create_tolerance_clause(
                                       value="0.05",
                                       zone_type=duc.TOLERANCE_ZONE_TYPE.CYLINDRICAL,
                                       feature_modifiers=[duc.FEATURE_MODIFIER.DIAMETER],
                                       material_condition=duc.MATERIAL_CONDITION.MAXIMUM
                                   ),
                                   datums=[
                                       duc.create_datum_reference("A"),
                                       duc.create_datum_reference("B", modifier=duc.MATERIAL_CONDITION.LEAST),
                                       duc.create_datum_reference("C")
                                   ]
                               )
                           ]
                       )
                   ])
                   .build())

    # Add all elements to the list
    elements.extend([
        rect1, rect2,
        linear_tolerance1, angular_tolerance1, fcf_element
    ])
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving to DUC file...")
    output_file = os.path.join(test_output_dir, "test_tolerance_elements.duc")
    serialized_data = duc.serialize_duc(
        name="ToleranceElementsTest",
        elements=elements
    )
    
    with open(output_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(output_file) and os.path.getsize(output_file) > 0
    print(f"✅ Serialized {len(elements)} elements")
    
    # === PARSE ===
    print("📖 PARSE: Loading the saved file...")
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    parsed_elements = parsed_data.elements
    
    assert len(parsed_elements) == len(elements)
    print(f"✅ Parsed {len(parsed_elements)} elements")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying tolerance elements...")
    
    # Mutate tolerance properties
    for el_wrapper in parsed_elements:
        if isinstance(el_wrapper.element, duc.DucDimensionElement):
            original_x = el_wrapper.element.base.x
            original_y = el_wrapper.element.base.y
            original_text = el_wrapper.element.text_override

            # Update position and text_override for dimension elements
            duc.mutate_element(el_wrapper, 
                              x=original_x + 20,
                              y=original_y + 10,
                              text_override=f"MUTATED {original_text}")
            print(f"Mutated {el_wrapper.element.base.label}: New X={el_wrapper.element.base.x}, New Y={el_wrapper.element.base.y}, New Text='{el_wrapper.element.text_override}'")
        
        elif isinstance(el_wrapper.element, duc.DucFeatureControlFrameElement):
            # Mutate the label of the FCF element
            original_label = el_wrapper.element.base.label
            duc.mutate_element(el_wrapper, label=f"MUTATED {original_label}")
            print(f"Mutated {el_wrapper.element.base.label}")

    # === DELETE ===
    print("🗑️ DELETE: Removing some tolerance elements...")
    
    # Remove angular tolerance and one base rectangle
    elements_to_keep = [
        el for el in parsed_elements 
        if not (
            (isinstance(el.element, duc.DucDimensionElement) and "Angular" in el.element.base.label) or
            (isinstance(el.element, duc.DucRectangleElement) and "Base Rectangle 2" in el.element.base.label)
        )
    ]
    
    # === SERIALIZE FINAL ===
    print("💾 SERIALIZE FINAL: Saving the final state...")
    final_output_file = os.path.join(test_output_dir, "test_tolerance_elements_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="ToleranceElementsTestFinal",
        elements=elements_to_keep
    )
    
    with open(final_output_file, 'wb') as f:
        f.write(final_serialized_data)
    
    assert os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0
    print(f"✅ Final serialized {len(elements_to_keep)} elements")
    
    # Verify the final state
    final_parsed_data = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_elements = final_parsed_data.elements
    
    assert len(final_elements) == len(elements_to_keep), "Final element count mismatch after deletion."

    # Count element types in the final state
    linear_tolerances = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.LINEAR]
    angular_tolerances = [el for el in final_elements if isinstance(el.element, duc.DucDimensionElement) and el.element.dimension_type == duc.DIMENSION_TYPE.ANGULAR]
    fcf_elements = [el for el in final_elements if isinstance(el.element, duc.DucFeatureControlFrameElement)]
    rectangles = [el for el in final_elements if isinstance(el.element, duc.DucRectangleElement)]

    # Verify correct counts after deletion
    assert len(linear_tolerances) == 1, "Expected 1 linear tolerance to remain."
    assert len(angular_tolerances) == 0, "Expected 0 angular tolerances after deletion."
    assert len(fcf_elements) == 1, "Expected 1 FCF element to remain."
    assert len(rectangles) == 1, "Expected 1 rectangle to remain after deleting Base Rectangle 2."

    print(f"Final elements: {len(final_elements)}")
    print(f"Linear tolerances: {len(linear_tolerances)}")
    print(f"Angular tolerances: {len(angular_tolerances)}")
    print(f"FCF elements: {len(fcf_elements)}")
    print(f"Rectangles: {len(rectangles)}")

    # Verify mutations were applied to the remaining elements
    for el_wrapper in final_elements:
        if isinstance(el_wrapper.element, duc.DucDimensionElement):
            # Check for linear tolerance mutation
            if el_wrapper.element.base.id == "linear_tolerance_1":
                assert el_wrapper.element.base.x == 140 + 20 # Original x from at_position + 20
                assert el_wrapper.element.base.y == 80 + 10  # Original y from at_position + 10
                assert el_wrapper.element.text_override == "MUTATED 80±0.1mm"
                print("✅ Verified mutation for Linear Tolerance 1")

        elif isinstance(el_wrapper.element, duc.DucFeatureControlFrameElement):
            # Check for FCF element mutation
            if el_wrapper.element.base.id == "fcf_tolerance_1":
                assert el_wrapper.element.base.label == "MUTATED FCF Tolerance 1"
                print("✅ Verified mutation for FCF Tolerance 1")


    print("✅ CSPMDS Tolerances test completed successfully!")
    print(f"   - Created {len(elements)} initial elements")
    print(f"   - Mutated tolerance properties and FCF label")
    print(f"   - Deleted 1 angular tolerance and 1 base rectangle")
    print(f"   - Final state: {len(final_elements)} elements")

@pytest.fixture
def test_output_dir():
    """Create a test output directory."""
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_script_path, "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir 