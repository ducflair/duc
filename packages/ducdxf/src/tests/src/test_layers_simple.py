#!/usr/bin/env python3
"""
Simple test to verify layer conversion works without full test infrastructure.
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import ezdxf
from ducxf.dxf_to_duc import (
    convert_layers,
    linetype_to_dash_pattern,
    lineweight_to_width,
    get_hex_from_aci
)

def test_linetype_conversion():
    """Test linetype to dash pattern conversion."""
    print("Testing linetype conversion...")
    
    # Continuous
    assert linetype_to_dash_pattern('CONTINUOUS') == []
    print("  ✓ CONTINUOUS → []")
    
    # Dashed
    pattern = linetype_to_dash_pattern('DASHED')
    assert len(pattern) == 2
    print(f"  ✓ DASHED → {pattern}")
    
    # Case insensitive
    assert linetype_to_dash_pattern('dashed') == linetype_to_dash_pattern('DASHED')
    print("  ✓ Case insensitive")
    
    print("✅ Linetype conversion tests passed!\n")


def test_lineweight_conversion():
    """Test lineweight conversion."""
    print("Testing lineweight conversion...")
    
    assert lineweight_to_width(25) == 0.25
    print("  ✓ 25 → 0.25mm")
    
    assert lineweight_to_width(100) == 1.0
    print("  ✓ 100 → 1.0mm")
    
    assert lineweight_to_width(-1) is None
    print("  ✓ -1 (BYLAYER) → None")
    
    print("✅ Lineweight conversion tests passed!\n")


def test_layer_conversion():
    """Test full layer conversion."""
    print("Testing layer conversion...")
    
    # Create a test DXF document
    doc = ezdxf.new('R2010')
    
    # Add some test layers
    doc.layers.add('TestLayer1', color=1)  # Red
    doc.layers.add('TestLayer2', color=2)  # Yellow
    
    layer = doc.layers.add('ComplexLayer', color=3)  # Green
    layer.lock()
    layer.dxf.plot = 1
    layer.transparency = 0.5
    
    # Convert layers
    duc_layers = convert_layers(doc)
    
    print(f"  Converted {len(duc_layers)} layers")
    
    # Check layer 0 exists
    layer_0 = next((l for l in duc_layers if l.id == '0'), None)
    assert layer_0 is not None
    print("  ✓ Layer 0 exists")
    
    # Check TestLayer1
    test_layer_1 = next((l for l in duc_layers if l.id == 'TestLayer1'), None)
    assert test_layer_1 is not None
    assert test_layer_1.stack_base.label == 'TestLayer1'
    print("  ✓ TestLayer1 converted")
    
    # Check ComplexLayer
    complex_layer = next((l for l in duc_layers if l.id == 'ComplexLayer'), None)
    assert complex_layer is not None
    assert complex_layer.stack_base.locked is True
    assert complex_layer.stack_base.is_plot is True
    # Use approx comparison due to ezdxf integer storage (0-255 internally)
    assert abs(complex_layer.stack_base.styles.opacity - 0.5) < 0.01
    print("  ✓ ComplexLayer with properties converted")
    
    print("✅ Layer conversion tests passed!\n")


if __name__ == '__main__':
    try:
        test_linetype_conversion()
        test_lineweight_conversion()
        test_layer_conversion()
        print("=" * 50)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 50)
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
