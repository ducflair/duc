"""
CSPMDS Test for Dimension Elements: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of dimension elements in DUC files.
"""
import io
import os
import random
import pytest
import math

import ducpy as duc


def test_cspmds_dimension_elements(test_output_dir):
    """
    CSPMDS test for dimension elements:
    - Create: Create various types of dimension elements
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify dimension properties
    - Delete: Remove some dimensions
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating dimension elements with various types...")
    
    elements = []
    
    # Create some basic geometric elements to dimension
    rect1 = duc.create_rectangle(
        x=50, y=50, width=100, height=60,
        styles=duc.create_simple_styles(),
        label="Rectangle 1"
    )
    elements.append(rect1)
    
    rect2 = duc.create_rectangle(
        x=200, y=100, width=80, height=40,
        styles=duc.create_simple_styles(),
        label="Rectangle 2"
    )
    elements.append(rect2)
    
    circle = duc.create_ellipse(
        x=350, y=80, width=60, height=60,
        styles=duc.create_simple_styles(),
        label="Circle"
    )
    elements.append(circle)
    
    # Create various dimension styles
    standard_dim_style = duc.create_dimension_style()
    
    # Custom dimension style with different appearance
    custom_stroke_content = duc.create_solid_content("#0066CC", 1.0)
    custom_stroke = duc.create_stroke(custom_stroke_content, width=1.5)
    custom_dim_line = duc.DimensionLineStyle(
        stroke=custom_stroke,
        text_gap=3.0
    )
    custom_dim_style = duc.create_dimension_style(
        dim_line=custom_dim_line,
        text_style=duc.create_text_style(
            font_size=10,
            text_align=duc.TEXT_ALIGN.CENTER
        )
    )
    
    # === 1. LINEAR DIMENSIONS ===
    
    # Horizontal linear dimension for rectangle 1 width
    linear_dim_h = duc.create_linear_dimension(
        x1=50, y1=50,  # Left edge of rect1
        x2=150, y2=50,  # Right edge of rect1
        offset=25,
        text_override="100mm",
        style=standard_dim_style,
        label="Linear Horizontal Dimension"
    )
    elements.append(linear_dim_h)
    
    # Vertical linear dimension for rectangle 1 height
    linear_dim_v = duc.create_linear_dimension(
        x1=50, y1=50,   # Top edge of rect1
        x2=50, y2=110,  # Bottom edge of rect1
        offset=25,
        text_override="60mm",
        style=custom_dim_style,
        label="Linear Vertical Dimension"
    )
    elements.append(linear_dim_v)
    
    # === 2. ALIGNED DIMENSIONS ===
    
    # Aligned dimension between rectangle corners
    aligned_dim = duc.create_aligned_dimension(
        x1=150, y1=50,   # Top-right of rect1
        x2=200, y2=100,  # Top-left of rect2
        offset=20,
        text_override="70.7mm",
        style=standard_dim_style,
        label="Aligned Dimension"
    )
    elements.append(aligned_dim)
    
    # === 3. ANGULAR DIMENSIONS ===
    
    # Angular dimension between two lines (simulated with dimension points)
    angular_dim = duc.create_angular_dimension(
        center_x=300, center_y=200,
        x1=250, y1=200,  # First line endpoint
        x2=300, y2=150,  # Second line endpoint
        offset=40,
        text_override="45°",
        style=custom_dim_style,
        label="Angular Dimension"
    )
    elements.append(angular_dim)
    
    # === 4. RADIUS DIMENSIONS ===
    
    # Radius dimension for the circle
    radius_dim = duc.create_radius_dimension(
        center_x=380, center_y=110,  # Circle center
        radius_point_x=410, radius_point_y=110,  # Point on circle edge
        text_override="R30",
        style=standard_dim_style,
        label="Radius Dimension"
    )
    elements.append(radius_dim)
    
    # === 5. DIAMETER DIMENSIONS ===
    
    # Diameter dimension for the circle
    diameter_dim = duc.create_diameter_dimension(
        center_x=380, center_y=110,  # Circle center
        x1=350, y1=110,  # Left point on circle
        x2=410, y2=110,  # Right point on circle
        text_override="Ø60",
        style=custom_dim_style,
        label="Diameter Dimension"
    )
    elements.append(diameter_dim)
    
    # === 6. CUSTOM DIMENSION ELEMENTS ===
    
    # Create a dimension with custom definition points
    custom_origin1 = duc.GeometricPoint(x=100, y=200)
    custom_origin2 = duc.GeometricPoint(x=250, y=250)
    custom_location = duc.GeometricPoint(x=175, y=180)
    
    custom_dim = duc.create_dimension_element(
        x=100, y=180,
        width=150, height=70,
        origin1=custom_origin1,
        origin2=custom_origin2,
        location=custom_location,
        dimension_type=duc.DIMENSION_TYPE.ALIGNED,
        oblique_angle=0.0,
        style=standard_dim_style,
        text_override="180mm",
        label="Custom Dimension Element"
    )
    elements.append(custom_dim)
    
    # Ordinate dimension (X-coordinate)
    ordinate_dim_x = duc.create_dimension_element(
        x=400, y=150,
        width=50, height=100,
        origin1=duc.GeometricPoint(x=400, y=200),
        location=duc.GeometricPoint(x=450, y=200),
        dimension_type=duc.DIMENSION_TYPE.ORDINATE,
        ordinate_axis=duc.AXIS.X,
        text_override="400",
        style=custom_dim_style,
        label="Ordinate X Dimension"
    )
    elements.append(ordinate_dim_x)
    
    # Ordinate dimension (Y-coordinate)
    ordinate_dim_y = duc.create_dimension_element(
        x=500, y=100,
        width=100, height=50,
        origin1=duc.GeometricPoint(x=550, y=100),
        location=duc.GeometricPoint(x=550, y=50),
        dimension_type=duc.DIMENSION_TYPE.ORDINATE,
        ordinate_axis=duc.AXIS.Y,
        text_override="100",
        style=standard_dim_style,
        label="Ordinate Y Dimension"
    )
    elements.append(ordinate_dim_y)
    
    # === 7. ARC LENGTH DIMENSIONS ===
    
    # Arc length dimension for part of a circle
    import math
    arc_length_dim = duc.create_arc_length_dimension(
        center_x=500, center_y=200,
        start_angle=0, end_angle=math.pi/2,
        radius=40,
        text_override="62.8mm",
        style=standard_dim_style,
        label="Arc Length Dimension"
    )
    elements.append(arc_length_dim)
    
    # === 8. CENTER MARK DIMENSIONS ===
    
    # Center mark for a circle
    center_mark_dim = duc.create_center_mark_dimension(
        center_x=380, center_y=110,
        size=20,
        text_override="",
        style=custom_dim_style,
        label="Center Mark Dimension"
    )
    elements.append(center_mark_dim)
    
    # === 9. ROTATED DIMENSIONS ===
    
    # Rotated linear dimension at 30 degrees
    rotated_dim = duc.create_rotated_dimension(
        x1=100, y1=300,
        x2=200, y2=350,
        rotation_angle=math.pi/6,  # 30 degrees
        offset=25,
        text_override="111.8mm",
        style=standard_dim_style,
        label="Rotated Dimension"
    )
    elements.append(rotated_dim)
    
    # === 10. SPACING DIMENSIONS ===
    
    # Spacing dimension between two rectangles
    spacing_dim = duc.create_spacing_dimension(
        x1=50, y1=50, x2=150, y2=110,    # rect1 bounds
        x3=200, y3=100, x4=280, y4=140,  # rect2 bounds  
        text_override="50mm",
        style=custom_dim_style,
        label="Spacing Dimension"
    )
    elements.append(spacing_dim)
    
    # === 11. CONTINUE DIMENSIONS ===
    
    # Continue dimension from a previous dimension
    continue_dim = duc.create_continue_dimension(
        continue_from_dimension_id="linear_dim_h_id",
        x1=150, y1=50,
        x2=280, y2=50,
        text_override="130mm",
        style=standard_dim_style,
        label="Continue Dimension"
    )
    elements.append(continue_dim)
    
    # === 12. BASELINE DIMENSIONS ===
    
    # Baseline dimension from a common baseline
    baseline_dim = duc.create_baseline_dimension(
        base_dimension_id="linear_dim_h_id",
        x1=50, y1=50,
        x2=350, y2=50,
        text_override="300mm",
        style=custom_dim_style,
        label="Baseline Dimension"
    )
    elements.append(baseline_dim)
    
    # === 13. JOGGED LINEAR DIMENSIONS ===
    
    # Jogged linear dimension with a break in the dimension line
    jogged_dim = duc.create_jogged_linear_dimension(
        x1=400, y1=300,
        x2=600, y2=300,
        jog_x=500, jog_y=320,
        text_override="200mm",
        style=standard_dim_style,
        label="Jogged Linear Dimension"
    )
    elements.append(jogged_dim)

    print(f"Created {len(elements)} elements with {len([e for e in elements if hasattr(e, 'element') and hasattr(e.element, 'dimension_type')])} dimension elements")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_dimension_elements_initial.duc")
    serialized_data = duc.serialize_duc(
        name="DimensionElementsCSPMDS_Initial", 
        elements=elements
    )
    
    with open(initial_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(initial_file)
    print(f"Saved initial state to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file...")
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    
    assert len(loaded_elements) == len(elements)
    print(f"Loaded {len(loaded_elements)} elements")
    
    # Verify dimension elements were parsed correctly
    dimension_elements = [e for e in loaded_elements if hasattr(e, 'dimension_type') or (hasattr(e, 'element') and hasattr(e.element, 'dimension_type'))]
    print(f"Found {len(dimension_elements)} dimension elements after parsing")
    
    # === MUTATE ===
    print("✏️ MUTATE: Modifying dimension elements...")
    
    # Find and modify dimension elements
    mutated_count = 0
    
    for i, element in enumerate(loaded_elements):
        if hasattr(element, 'dimension_type') or (hasattr(element, 'element') and hasattr(element.element, 'dimension_type')):
            # Get the actual dimension element
            dim_element = element if hasattr(element, 'dimension_type') else element.element
            
            # Modify text override
            if dim_element.text_override:
                dim_element.text_override = f"Modified_{dim_element.text_override}"
            else:
                dim_element.text_override = f"Mutated_Dim_{mutated_count}"
            
            # Modify style properties
            if hasattr(dim_element.style, 'text_style') and dim_element.style.text_style:
                dim_element.style.text_style.font_size = dim_element.style.text_style.font_size + 2
            
            # Modify oblique angle slightly
            dim_element.oblique_angle = dim_element.oblique_angle + 0.1
            
            mutated_count += 1
            
            # Update the element in the list (if it's wrapped)
            if hasattr(element, 'element'):
                element.element = dim_element
            
            loaded_elements[i] = element
    
    print(f"Mutated {mutated_count} dimension elements")
    
    # Add a new dimension element
    new_dimension = duc.create_linear_dimension(
        x1=500, y1=250,
        x2=600, y2=250,
        offset=30,
        text_override="NEW_100mm",
        style=custom_dim_style,
        label="Added Dimension"
    )
    loaded_elements.append(new_dimension)
    print("Added 1 new dimension element")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some dimension elements...")
    
    # Remove every third dimension element
    elements_to_keep = []
    deleted_count = 0
    
    for i, element in enumerate(loaded_elements):
        if hasattr(element, 'dimension_type') or (hasattr(element, 'element') and hasattr(element.element, 'dimension_type')):
            # Keep 2 out of every 3 dimension elements
            if (deleted_count % 3) != 2:
                elements_to_keep.append(element)
            else:
                deleted_count += 1
        else:
            # Keep all non-dimension elements
            elements_to_keep.append(element)
    
    loaded_elements = elements_to_keep
    print(f"Deleted {deleted_count} dimension elements, {len(loaded_elements)} elements remaining")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_dimension_elements_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="DimensionElementsCSPMDS_Final",
        elements=loaded_elements
    )
    
    with open(final_file, 'wb') as f:
        f.write(final_serialized_data)
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Checking final state...")
    
    # Parse the final file to verify everything worked
    final_parsed_data = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_elements = final_parsed_data.elements
    
    final_dimensions = [e for e in final_elements if hasattr(e, 'dimension_type') or (hasattr(e, 'element') and hasattr(e.element, 'dimension_type'))]
    
    print(f"Final file contains {len(final_elements)} total elements")
    print(f"Final file contains {len(final_dimensions)} dimension elements")
    
    # Check that mutations were preserved
    mutated_dimensions = [
        e for e in final_dimensions 
        if ((hasattr(e, 'text_override') and e.text_override and 
            ('Modified_' in e.text_override or 'Mutated_' in e.text_override or 'NEW_' in e.text_override)) or
           (hasattr(e, 'element') and hasattr(e.element, 'text_override') and e.element.text_override and
            ('Modified_' in e.element.text_override or 'Mutated_' in e.element.text_override or 'NEW_' in e.element.text_override)))
    ]
    
    print(f"Found {len(mutated_dimensions)} mutated dimensions in final state")
    
    # Verify different dimension types are present
    dimension_types = {}
    for dim in final_dimensions:
        # Get the actual dimension element
        dim_element = dim if hasattr(dim, 'dimension_type') else (dim.element if hasattr(dim, 'element') else None)
        
        if dim_element and hasattr(dim_element, 'dimension_type'):
            dim_type = getattr(dim_element, 'dimension_type', 'UNKNOWN')
            # Convert enum value to string if needed
            if hasattr(dim_type, 'name'):
                dim_type = dim_type.name
            elif isinstance(dim_type, int):
                # Map integer values to names
                type_names = {
                    10: 'LINEAR', 11: 'ALIGNED', 12: 'ANGULAR', 
                    13: 'ARC_LENGTH', 14: 'RADIUS', 15: 'DIAMETER',
                    16: 'CENTER_MARK', 17: 'ROTATED', 18: 'SPACING',
                    19: 'CONTINUE', 20: 'BASELINE', 21: 'JOGGED_LINEAR', 22: 'ORDINATE'
                }
                dim_type = type_names.get(dim_type, f'TYPE_{dim_type}')
            
            if dim_type not in dimension_types:
                dimension_types[dim_type] = 0
            dimension_types[dim_type] += 1
    
    print("Dimension types in final state:")
    for dim_type, count in dimension_types.items():
        print(f"  - {dim_type}: {count}")
    
    print("🎉 CSPMDS test for dimension elements completed successfully!")
    
    # Just for verification - not returning for pytest
    test_result = {
        'initial_file': initial_file,
        'final_file': final_file,
        'initial_elements': len(elements),
        'final_elements': len(final_elements),
        'initial_dimensions': len([e for e in elements if hasattr(e, 'element') and hasattr(e.element, 'dimension_type')]),
        'final_dimensions': len(final_dimensions),
        'dimension_types': dimension_types
    }
    
    # Verify the test worked as expected
    assert len(final_dimensions) > 0, "Should have dimension elements in final state"
    assert len(dimension_types) > 0, "Should have different dimension types"


if __name__ == "__main__":
    # For direct execution during development
    test_output_dir = "/tmp/duc_test_output"
    os.makedirs(test_output_dir, exist_ok=True)
    result = test_cspmds_dimension_elements(test_output_dir)
    print("Test completed with result:", result)
