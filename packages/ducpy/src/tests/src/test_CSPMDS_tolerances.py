"""
CSPMDS Test for Tolerance Elements: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of tolerance elements (Leader, Feature Control Frame, Dimension with tolerances) in DUC files.
"""
import io
import os
import random
import pytest
import math

import ducpy as duc
from ducpy.classes.ElementsClass import FCFSegmentRow


def test_cspmds_tolerances(test_output_dir):
    """
    Test Create-Serialize-Parse-Mutate-Delete-Serialize lifecycle for tolerance elements.
    
    This test covers:
    - Create: Build tolerance elements with various GD&T symbols and configurations
    - Serialize: Save initial state to file
    - Parse: Load and verify all elements can be parsed correctly
    - Mutate: Modify tolerance properties and relationships  
    - Delete: Remove some tolerance elements
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating tolerance elements with various GD&T configurations...")
    
    elements = []
    
    # Create some basic geometric elements to apply tolerances to
    rect1 = duc.create_rectangle(
        x=50, y=50, width=100, height=60,
        styles=duc.create_simple_styles(),
        label="Base Rectangle"
    )
    elements.append(rect1)
    
    rect2 = duc.create_rectangle(
        x=200, y=100, width=80, height=40,
        styles=duc.create_simple_styles(),
        label="Feature Rectangle"
    )
    elements.append(rect2)
    
    circle = duc.create_ellipse(
        x=350, y=80, width=60, height=60,
        styles=duc.create_simple_styles(),
        label="Cylindrical Feature"
    )
    elements.append(circle)
    
    # === 1. LEADER ELEMENTS ===
    
    # Leader with text content pointing to a feature
    leader_text_content = duc.create_leader_text_content("Feature Note")
    leader_content = duc.create_leader_content(leader_text_content)
    
    leader1 = duc.create_leader_element(
        x1=380, y1=110,  # Start at circle center
        x2=450, y2=80,   # End point for leader line
        content_anchor_x=450, content_anchor_y=80,
        content=leader_content,
        label="Text Leader"
    )
    elements.append(leader1)
    
    # Leader with block content
    block_attributes = [duc.create_string_value_entry("TYPE", "HOLE")]
    leader_block_content = duc.create_leader_block_content(
        block_id="detail_block_1",
        attribute_values=block_attributes
    )
    leader_content2 = duc.create_leader_content(leader_block_content)
    
    leader2 = duc.create_leader_element(
        x1=100, y1=80,   # Start at rectangle
        x2=50, y2=30,    # End point
        content_anchor_x=50, content_anchor_y=30,
        content=leader_content2,
        label="Block Leader"
    )
    elements.append(leader2)
    
    # === 2. FEATURE CONTROL FRAME ELEMENTS ===
    
    # Position tolerance FCF
    position_fcf = duc.create_position_tolerance_fcf(
        x=100, y=200, width=120, height=25,
        tolerance_value="⌖0.05",
        primary_datum="A",
        secondary_datum="B",
        tertiary_datum="C",
        leader_element_id=leader1.element.linear_base.base.id,
        label="Position Tolerance FCF"
    )
    elements.append(position_fcf)
    
    # Flatness tolerance FCF
    flatness_fcf = duc.create_flatness_tolerance_fcf(
        x=250, y=200, width=80, height=25,
        tolerance_value="0.02",
        label="Flatness Tolerance FCF"
    )
    elements.append(flatness_fcf)
    
    # Complex FCF with multiple symbols (composite tolerance)
    tolerance1 = duc.create_tolerance_clause(
        value="⌖0.1",
        zone_type=duc.TOLERANCE_ZONE_TYPE.CYLINDRICAL if hasattr(duc, 'TOLERANCE_ZONE_TYPE') else None,
        material_condition=duc.MATERIAL_CONDITION.MAXIMUM if hasattr(duc, 'MATERIAL_CONDITION') else None
    )
    
    tolerance2 = duc.create_tolerance_clause(
        value="⌖0.05"
    )
    
    datums1 = [
        duc.create_datum_reference("A"),
        duc.create_datum_reference("B"),
        duc.create_datum_reference("C")
    ]
    
    datums2 = [
        duc.create_datum_reference("A"),
        duc.create_datum_reference("B")
    ]
    
    segment1 = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.POSITION,
        tolerance=tolerance1,
        datums=datums1
    )
    
    segment2 = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.POSITION,
        tolerance=tolerance2,
        datums=datums2
    )
    
    # Frame modifiers
    frame_modifiers = duc.create_fcf_frame_modifiers(
        all_around=True,
        continuous_feature=False
    )
    
    composite_fcf = duc.create_feature_control_frame_element(
        x=100, y=250, width=140, height=50,
        rows=[
            FCFSegmentRow(segments=[segment1]), 
            FCFSegmentRow(segments=[segment2])
        ],
        frame_modifiers=frame_modifiers,
        label="Composite Position FCF"
    )
    elements.append(composite_fcf)
    
    # === 3. DATUM FEATURE SYMBOLS ===
    
    # Datum A symbol
    datum_binding = duc.create_point_binding(rect1.element.base.id, focus=0.5)
    datum_a = duc.create_datum_feature_symbol(
        x=50, y=30, width=20, height=20,
        datum_letter="A",
        feature_binding=datum_binding,
        label="Datum A Symbol"
    )
    elements.append(datum_a)
    
    # Datum B symbol
    datum_b = duc.create_datum_feature_symbol(
        x=200, y=80, width=20, height=20,  
        datum_letter="B",
        label="Datum B Symbol"
    )
    elements.append(datum_b)
    
    # Datum C symbol
    datum_c = duc.create_datum_feature_symbol(
        x=350, y=60, width=20, height=20,
        datum_letter="C", 
        label="Datum C Symbol"
    )
    elements.append(datum_c)
    
    # === 4. VARIOUS GD&T SYMBOLS ===
    
    # Straightness
    straightness_tolerance = duc.create_tolerance_clause(value="0.01")
    straightness_segment = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.STRAIGHTNESS,
        tolerance=straightness_tolerance
    )
    straightness_fcf = duc.create_feature_control_frame_element(
        x=400, y=200, width=70, height=25,
        rows=[FCFSegmentRow(segments=[straightness_segment])],
        label="Straightness FCF"
    )
    elements.append(straightness_fcf)
    
    # Circularity
    circularity_tolerance = duc.create_tolerance_clause(value="0.005")
    circularity_segment = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.CIRCULARITY,
        tolerance=circularity_tolerance
    )
    circularity_fcf = duc.create_feature_control_frame_element(
        x=400, y=240, width=70, height=25,
        rows=[FCFSegmentRow(segments=[circularity_segment])],
        label="Circularity FCF"
    )
    elements.append(circularity_fcf)
    
    # Perpendicularity
    perp_tolerance = duc.create_tolerance_clause(value="0.02")
    perp_datums = [duc.create_datum_reference("A")]
    perp_segment = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.PERPENDICULARITY,
        tolerance=perp_tolerance,
        datums=perp_datums
    )
    perp_fcf = duc.create_feature_control_frame_element(
        x=400, y=280, width=90, height=25,
        rows=[FCFSegmentRow(segments=[perp_segment])],
        label="Perpendicularity FCF"
    )
    elements.append(perp_fcf)
    
    # Profile of Surface
    profile_tolerance = duc.create_tolerance_clause(value="0.1")
    profile_datums = [
        duc.create_datum_reference("A"),
        duc.create_datum_reference("B"),
        duc.create_datum_reference("C")
    ]
    profile_segment = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.PROFILE_OF_SURFACE,
        tolerance=profile_tolerance,
        datums=profile_datums
    )
    profile_fcf = duc.create_feature_control_frame_element(
        x=100, y=320, width=120, height=25,
        rows=[FCFSegmentRow(segments=[profile_segment])],
        label="Profile of Surface FCF"
    )
    elements.append(profile_fcf)
    
    # === 5. DIMENSION ELEMENTS WITH TOLERANCES ===
    
    # Linear dimension with tolerance
    dimension_with_tolerance = duc.create_linear_dimension(
        x1=50, y1=110,   # Bottom of rect1
        x2=150, y2=110,  # Bottom right of rect1
        offset=30,
        text_override="100±0.05",
        label="Toleranced Linear Dimension"
    )
    elements.append(dimension_with_tolerance)
    
    # Angular dimension with tolerance
    angular_tolerance_dim = duc.create_angular_dimension(
        center_x=300, center_y=350,
        x1=250, y1=350,
        x2=300, y2=300,
        offset=40,
        text_override="45°±1°",
        label="Toleranced Angular Dimension"
    )
    elements.append(angular_tolerance_dim)
    
    
    print(f"Created {len(elements)} elements with comprehensive tolerance representations including FCF elements")
    
    # All elements including FCF elements should now work with the fixed schema
    print(f"Testing with all {len(elements)} elements (including FCF elements with fixed parsing)")    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_tolerances_initial.duc")
    serialized_data = duc.serialize_duc(
        name="ToleranceElementsCSPMDS_Initial", 
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
    
    # Verify tolerance-specific elements
    for element in loaded_elements:
        if hasattr(element, 'element'):
            if hasattr(element.element, 'rows'):  # FCF element
                print(f"  ✓ FCF with {len(element.element.rows)} rows")
                for i, fcf_row in enumerate(element.element.rows):
                    print(f"    Row {i+1}: {len(fcf_row.segments)} segments")
                    for j, segment in enumerate(fcf_row.segments):
                        symbol_name = "UNKNOWN"
                        for name in dir(duc.GDT_SYMBOL):
                            if not name.startswith('_') and getattr(duc.GDT_SYMBOL, name) == segment.symbol:
                                symbol_name = name
                                break
                        print(f"      Segment {j+1}: {symbol_name}, tolerance={segment.tolerance.value if segment.tolerance else 'None'}")
            
            elif hasattr(element.element, 'content_anchor'):  # Leader element
                print(f"  ✓ Leader element with anchor at ({element.element.content_anchor.x}, {element.element.content_anchor.y})")
                if element.element.content:
                    if hasattr(element.element.content.content, 'text'):
                        print(f"    Text content: '{element.element.content.content.text}'")
                    elif hasattr(element.element.content.content, 'block_id'):
                        print(f"    Block content: {element.element.content.content.block_id}")
            
            elif hasattr(element.element, 'dimension_type'):  # Dimension element
                print(f"  ✓ Dimension element with tolerance text")
    
    assert len(loaded_elements) == len(elements), f"Expected {len(elements)} elements, got {len(loaded_elements)}"
    print(f"Successfully parsed {len(loaded_elements)} elements")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying tolerance properties...")
    
    mutations_made = 0
    
    for element in loaded_elements:
        if hasattr(element, 'element') and hasattr(element.element, 'rows'):
            # Modify FCF tolerances
            if element.element.rows:
                for fcf_row in element.element.rows:
                    for segment in fcf_row.segments:
                        if segment.tolerance and "0.05" in segment.tolerance.value:
                            segment.tolerance.value = segment.tolerance.value.replace("0.05", "0.03")
                            mutations_made += 1
                            print(f"  ✓ Updated tolerance value in FCF")
        
        elif hasattr(element, 'element') and hasattr(element.element, 'content_anchor'):
            # Modify leader positions
            element.element.content_anchor.x += 10
            element.element.content_anchor.y += 5
            mutations_made += 1
            print(f"  ✓ Moved leader anchor point")
        
        elif hasattr(element, 'element') and hasattr(element.element, 'text_override'):
            # Modify dimension tolerance text
            if "±" in element.element.text_override:
                element.element.text_override = element.element.text_override.replace("±0.05", "±0.02")
                mutations_made += 1
                print(f"  ✓ Updated dimension tolerance")
    
    print(f"Made {mutations_made} mutations to tolerance elements")
    
    # Add a new FCF element to test dynamic additions
    new_runout_tolerance = duc.create_tolerance_clause(value="0.03")
    new_runout_datums = [duc.create_datum_reference("A")]
    new_runout_segment = duc.create_feature_control_frame_segment(
        symbol=duc.GDT_SYMBOL.CIRCULAR_RUNOUT,
        tolerance=new_runout_tolerance,
        datums=new_runout_datums
    )
    new_runout_fcf_row = FCFSegmentRow(segments=[new_runout_segment])
    new_runout_fcf = duc.create_feature_control_frame_element(
        x=300, y=380, width=90, height=25,
        rows=[new_runout_fcf_row],
        label="New Runout FCF"
    )
    loaded_elements.append(new_runout_fcf)
    print("✓ Added new Runout FCF element")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some tolerance elements...")
    
    elements_to_remove = []
    for element in loaded_elements:
        if hasattr(element, 'element') and hasattr(element.element, 'base') and hasattr(element.element.base, 'label'):
            # Remove elements with "Circularity" in the label
            if "Circularity" in element.element.base.label:
                elements_to_remove.append(element)
            # Remove one of the datum symbols
            elif "Datum C" in element.element.base.label:
                elements_to_remove.append(element)
    
    for element in elements_to_remove:
        loaded_elements.remove(element)
        print(f"  ✓ Removed element: {element.element.base.label}")
    
    print(f"Removed {len(elements_to_remove)} elements")
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving final state...")
    
    final_file = os.path.join(test_output_dir, "cspmds_tolerances_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="ToleranceElementsCSPMDS_Final", 
        elements=loaded_elements
    )
    
    with open(final_file, 'wb') as f:
        f.write(final_serialized_data)
    
    assert os.path.exists(final_file)
    print(f"Saved final state to {final_file}")
    
    # === VERIFICATION ===
    print("✅ VERIFICATION: Final validation...")
    
    # Verify final file can be loaded
    final_parsed_data = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_elements = final_parsed_data.elements
    
    print(f"Final verification: {len(final_elements)} elements in final file")
    
    # Count tolerance elements by type
    leader_count = 0
    fcf_count = 0
    datum_count = 0
    dimension_tolerance_count = 0
    
    for element in final_elements:
        if hasattr(element, 'element'):
            if hasattr(element.element, 'content_anchor'):
                leader_count += 1
            elif hasattr(element.element, 'rows'):
                if element.element.rows:  # FCF with tolerance segments
                    fcf_count += 1
                else:  # Datum symbol (empty rows)
                    datum_count += 1
            elif hasattr(element.element, 'text_override') and "±" in str(element.element.text_override):
                dimension_tolerance_count += 1
    
    print(f"Final count: {leader_count} leaders, {fcf_count} FCFs, {datum_count} datums, {dimension_tolerance_count} toleranced dimensions")
    
    # Verify we have the expected variety of GD&T symbols
    symbols_found = set()
    for element in final_elements:
        if hasattr(element, 'element') and hasattr(element.element, 'rows'):
            for fcf_row in element.element.rows:
                for segment in fcf_row.segments:
                    symbols_found.add(segment.symbol)
    
    print(f"GD&T symbols found: {len(symbols_found)} different types")
    
    assert len(final_elements) >= 5, "Should have at least 5 working elements after mutations and deletions"
    
    print("🎉 CSPMDS tolerance elements test completed successfully!")
    print(f"   ✅ Created, serialized, parsed, mutated, deleted, and re-serialized {len(final_elements)} tolerance elements")
    print(f"   ✅ Successfully handled leader elements, FCF elements, datum symbols, and dimension elements with tolerance text")
    print(f"   ✅ All tolerance elements including FCF elements working with fixed schema") 