"""
Test script for DXF text style (STYLE table) to DUC conversion.

This script creates a simple DXF file with various text styles,
converts it to DUC, and verifies the conversion.
"""

import os
import sys
import ezdxf
from pathlib import Path
import math

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ducxf.dxf_to_duc import convert_dxf_to_duc
from ducxf.common import TextStyleConverter
import ducpy as duc


def create_test_dxf_with_text_styles(output_path: str):
    """
    Create a test DXF file with various text style definitions.
    """
    print("Creating test DXF file with text styles...")
    
    doc = ezdxf.new("R2018")
    msp = doc.modelspace()
    
    # Add custom text styles
    # Note: ezdxf uses the add_text_style or new method for R2018+
    
    # Style 1: Standard style with fixed height
    if "TITLE" not in doc.styles:
        doc.styles.add(
            name="TITLE",
            font="arial.ttf",
            dxfattribs={
                "height": 24.0,  # Fixed height
                "width": 1.0,
                "oblique": 0.0,
            }
        )
        print("  Added text style: TITLE")
    
    # Style 2: Italic style with oblique angle
    if "ITALIC_TEXT" not in doc.styles:
        doc.styles.add(
            name="ITALIC_TEXT",
            font="times.ttf",
            dxfattribs={
                "height": 12.0,
                "width": 1.0,
                "oblique": 15.0,  # 15 degree slant
            }
        )
        print("  Added text style: ITALIC_TEXT")
    
    # Style 3: Condensed text with width factor
    if "CONDENSED" not in doc.styles:
        doc.styles.add(
            name="CONDENSED",
            font="arial.ttf",
            dxfattribs={
                "height": 0.0,  # Variable height
                "width": 0.7,   # 70% width
                "oblique": 0.0,
            }
        )
        print("  Added text style: CONDENSED")
    
    # Style 4: Backwards text (mirrored)
    if "BACKWARDS" not in doc.styles:
        doc.styles.add(
            name="BACKWARDS",
            font="arial.ttf",
            dxfattribs={
                "height": 10.0,
                "width": 1.0,
                "oblique": 0.0,
                "flags": 4,  # Bit 2: backwards
            }
        )
        print("  Added text style: BACKWARDS")
    
    # Style 5: Upside-down text
    if "UPSIDEDOWN" not in doc.styles:
        doc.styles.add(
            name="UPSIDEDOWN",
            font="arial.ttf",
            dxfattribs={
                "height": 10.0,
                "width": 1.0,
                "oblique": 0.0,
                "flags": 16,  # Bit 4: upside-down
            }
        )
        print("  Added text style: UPSIDEDOWN")
    
    # Style 6: SHX font (AutoCAD font)
    if "ROMANS" not in doc.styles:
        doc.styles.add(
            name="ROMANS",
            font="romans.shx",
            dxfattribs={
                "height": 0.0,  # Variable
                "width": 1.0,
                "oblique": 0.0,
            }
        )
        print("  Added text style: ROMANS")
    
    # Create some text entities using different styles
    y_offset = 0
    styles_to_use = ["TITLE", "ITALIC_TEXT", "CONDENSED", "BACKWARDS", "ROMANS"]
    for style_name in styles_to_use:
        if style_name in doc.styles:
            dxfattribs = {"style": style_name}
            if doc.styles.get(style_name).dxf.height == 0:
                dxfattribs["height"] = 10.0
            msp.add_text(
                f"Sample text in {style_name}",
                dxfattribs=dxfattribs,
            ).set_placement((0, y_offset))
            y_offset += 15
    
    doc.saveas(output_path)
    print(f"✅ Created test DXF: {output_path}")
    return output_path


def test_text_style_converter():
    """Test the TextStyleConverter utility functions."""
    print("\n" + "="*60)
    print("Testing TextStyleConverter...")
    print("="*60)
    
    # Test font name parsing
    test_fonts = [
        ("arial.ttf", "Arial"),
        ("romans.shx", "Times New Roman"),
        ("txt.shx", "Arial"),
        ("times.ttf", "Times New Roman"),
        ("monotxt.shx", "Courier New"),
        ("simplex.shx", "Arial"),
    ]
    
    print("\nFont name mapping tests:")
    for dxf_font, expected_family in test_fonts:
        result = TextStyleConverter.parse_font_name(dxf_font)
        print(f"  {dxf_font:20s} → {result:20s} ", end="")
        assert result == expected_family, f"Expected {expected_family}, got {result}"
        print("✅")
    
    # Test generation flags parsing
    print("\nGeneration flags tests:")
    
    # Test backwards flag (bit 2 = 4)
    flags = TextStyleConverter.parse_generation_flags(4)
    assert flags['is_backwards'] == True, "Backwards flag not set"
    assert flags['is_upside_down'] == False, "Upside-down should be False"
    print("  Backwards flag (4): ✅")
    
    # Test upside-down flag (bit 4 = 16)
    flags = TextStyleConverter.parse_generation_flags(16)
    assert flags['is_backwards'] == False, "Backwards should be False"
    assert flags['is_upside_down'] == True, "Upside-down flag not set"
    print("  Upside-down flag (16): ✅")
    
    # Test vertical flag (bit 5 = 32)
    flags = TextStyleConverter.parse_generation_flags(32)
    assert flags['is_vertical'] == True, "Vertical flag not set"
    print("  Vertical flag (32): ✅")
    
    # Test combined flags
    flags = TextStyleConverter.parse_generation_flags(20)  # 4 + 16
    assert flags['is_backwards'] == True, "Backwards should be True"
    assert flags['is_upside_down'] == True, "Upside-down should be True"
    print("  Combined flags (20): ✅")
    
    # Test angle conversion
    print("\nAngle conversion tests:")
    test_angles = [
        (0, 0),
        (90, math.pi / 2),
        (180, math.pi),
        (15, math.radians(15)),
    ]
    
    for degrees, expected_radians in test_angles:
        result = TextStyleConverter.degrees_to_radians(degrees)
        print(f"  {degrees:3d}° → {result:.4f} rad ", end="")
        assert abs(result - expected_radians) < 0.0001, f"Expected {expected_radians}, got {result}"
        print("✅")
    
    print("\n✅ All TextStyleConverter tests passed!")


def test_conversion():
    """Test the full DXF to DUC conversion with text styles."""
    print("\n" + "="*60)
    print("Testing DXF to DUC Conversion...")
    print("="*60)
    
    # Create test files in temp directory
    test_dir = Path(__file__).parent / "temp"
    test_dir.mkdir(exist_ok=True)
    
    dxf_path = test_dir / "test_text_styles.dxf"
    duc_path = test_dir / "test_text_styles.duc"
    
    # Create test DXF
    create_test_dxf_with_text_styles(str(dxf_path))
    
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
        if standard.styles:
            if standard.styles.text_styles:
                print(f"  Text styles: {len(standard.styles.text_styles)}")
                for i, style in enumerate(standard.styles.text_styles[:10]):  # Show first 10
                    print(f"    {i+1}. {style.id.name}")
                    if style.style:
                        s = style.style
                        print(f"       Font: {s.font_family}, Size: {s.font_size}")
                        if s.width_factor != 1.0:
                            print(f"       Width factor: {s.width_factor}")
                        if s.oblique_angle != 0:
                            print(f"       Oblique: {math.degrees(s.oblique_angle):.1f}°")
                        if s.is_backwards or s.is_upside_down:
                            flags = []
                            if s.is_backwards:
                                flags.append("backwards")
                            if s.is_upside_down:
                                flags.append("upside-down")
                            print(f"       Flags: {', '.join(flags)}")
            
            if standard.styles.common_styles:
                print(f"  Common styles (linetypes): {len(standard.styles.common_styles)}")
    
    print("\n✅ Conversion test completed successfully!")


def main():
    """Run all tests."""
    print("="*60)
    print("DXF Text Style to DUC Conversion - Test Suite")
    print("="*60)
    
    try:
        # Test 1: Converter utilities
        test_text_style_converter()
        
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
