"""
Test script for DXF linetype to DUC conversion.

This script creates a simple DXF file with various linetypes,
converts it to DUC, and verifies the conversion.
"""

import os
import sys
import ezdxf
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ducxf.dxf_to_duc import convert_dxf_to_duc
from ducxf.common import LinetypeConverter
import ducpy as duc


def create_test_dxf_with_linetypes(output_path: str):
    """
    Create a test DXF file with various linetype definitions.
    """
    print("Creating test DXF file with linetypes...")
    
    doc = ezdxf.new("R2018")
    msp = doc.modelspace()
    
    # Add custom linetypes
    linetypes_to_add = [
        ("CUSTOM_DASHED", "Custom Dashed ---- ---- ---- ----", [0.5, -0.25]),
        ("CUSTOM_DASHDOT", "Custom DashDot ---- . ---- .", [0.5, -0.1, 0.0, -0.1]),
        ("CUSTOM_COMPLEX", "Complex with spacing ----  ----  ----", [1.0, -0.5]),
    ]
    
    for name, desc, pattern in linetypes_to_add:
        if name not in doc.linetypes:
            doc.linetypes.add(
                name=name,
                pattern=pattern,
                description=desc,
            )
            print(f"  Added linetype: {name}")
    
    # Create some lines using different linetypes
    y_offset = 0
    for name, _, _ in linetypes_to_add:
        msp.add_line((0, y_offset), (10, y_offset), dxfattribs={"linetype": name})
        y_offset += 2
    
    # Also use some standard linetypes
    if "DASHED" in doc.linetypes:
        msp.add_line((0, y_offset), (10, y_offset), dxfattribs={"linetype": "DASHED"})
        y_offset += 2
    
    doc.saveas(output_path)
    print(f"✅ Created test DXF: {output_path}")
    return output_path


def test_linetype_converter():
    """Test the LinetypeConverter utility functions."""
    print("\n" + "="*60)
    print("Testing LinetypeConverter...")
    print("="*60)
    
    # Test simple pattern
    simple_pattern = [0.5, -0.25]
    parsed = LinetypeConverter.parse_dxf_pattern(simple_pattern)
    print(f"\nSimple pattern {simple_pattern}:")
    print(f"  Dash pattern: {parsed['dash_pattern']}")
    print(f"  Is complex: {parsed['is_complex']}")
    assert parsed['dash_pattern'] == [0.5, 0.25], "Simple pattern conversion failed"
    assert not parsed['is_complex'], "Simple pattern incorrectly marked as complex"
    print("  ✅ Simple pattern test passed")
    
    # Test complex pattern (this would be from a real DXF complex linetype)
    # Note: In real DXF, complex patterns would be strings, but we'll test our parser
    complex_str = '["GAS",STANDARD,S=.1,U=0.0,X=-0.1,Y=-.05]'
    parsed_complex = LinetypeConverter._parse_complex_element(complex_str)
    print(f"\nComplex element '{complex_str}':")
    print(f"  Parsed: {parsed_complex}")
    assert parsed_complex['type'] == 'text', "Complex element type not recognized"
    assert parsed_complex['text'] == 'GAS', "Text not parsed correctly"
    print("  ✅ Complex element test passed")
    
    # Test pattern description
    desc = LinetypeConverter.pattern_to_description("TEST", [0.5, -0.25])
    print(f"\nPattern description: '{desc}'")
    assert "TEST" in desc, "Linetype name not in description"
    print("  ✅ Description test passed")


def test_conversion():
    """Test the full DXF to DUC conversion with linetypes."""
    print("\n" + "="*60)
    print("Testing DXF to DUC Conversion...")
    print("="*60)
    
    # Create test files in temp directory
    test_dir = Path(__file__).parent / "temp"
    test_dir.mkdir(exist_ok=True)
    
    dxf_path = test_dir / "test_linetypes.dxf"
    duc_path = test_dir / "test_linetypes.duc"
    
    # Create test DXF
    create_test_dxf_with_linetypes(str(dxf_path))
    
    # Convert to DUC
    print(f"\n{'='*60}")
    print("Starting conversion...")
    print("="*60)
    convert_dxf_to_duc(str(dxf_path), str(duc_path))
    
    # Verify DUC file was created
    assert duc_path.exists(), "DUC file was not created"
    print(f"\n✅ DUC file created: {duc_path}")
    print(f"   Size: {duc_path.stat().st_size} bytes")
    
    # Read back and verify
    print("\nReading DUC file back...")
    duc_data = duc.read_duc_file(str(duc_path))
    
    print(f"  Standards: {len(duc_data.standards) if duc_data.standards else 0}")
    if duc_data.standards and len(duc_data.standards) > 0:
        standard = duc_data.standards[0]
        print(f"  Standard name: {standard.identifier.name}")
        if standard.styles and standard.styles.common_styles:
            print(f"  Common styles (linetypes): {len(standard.styles.common_styles)}")
            for i, style in enumerate(standard.styles.common_styles[:5]):  # Show first 5
                print(f"    {i+1}. {style.id.name}")
                if style.style.stroke and style.style.stroke.style:
                    dash = style.style.stroke.style.dash
                    print(f"       Dash pattern: {list(dash) if dash else '[]'}")
    
    print("\n✅ Conversion test completed successfully!")


def main():
    """Run all tests."""
    print("="*60)
    print("DXF Linetype to DUC Conversion - Test Suite")
    print("="*60)
    
    try:
        # Test 1: Converter utilities
        test_linetype_converter()
        
        # Test 2: Full conversion
        test_conversion()
        
        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED!")
        print("="*60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
