"""
Test suite for DXF to DUC layer conversion.

Tests cover:
- Default layer (layer 0)
- Custom layers with various properties
- Layer colors (ACI and RGB)
- Layer state flags (on/off, frozen/thawed, locked/unlocked)
- Plot flags
- Transparency
- Linetypes and lineweights
"""
import pytest
import ezdxf
import tempfile
import os
from ducxf.dxf_to_duc import (
    convert_layers,
    linetype_to_dash_pattern,
    lineweight_to_width,
    get_hex_from_aci
)


class TestLineTypeConversion:
    """Test linetype name to dash pattern conversion."""
    
    def test_continuous_linetype(self):
        """Continuous linetype should return empty dash pattern."""
        assert linetype_to_dash_pattern('CONTINUOUS') == []
        assert linetype_to_dash_pattern('continuous') == []
        assert linetype_to_dash_pattern('BYLAYER') == []
        assert linetype_to_dash_pattern('BYBLOCK') == []
    
    def test_dashed_linetype(self):
        """Dashed linetype should return dash pattern."""
        pattern = linetype_to_dash_pattern('DASHED')
        assert len(pattern) == 2
        assert pattern[0] > 0  # dash length
        assert pattern[1] > 0  # gap length
    
    def test_dashdot_linetype(self):
        """Dash-dot linetype should return 4-element pattern."""
        pattern = linetype_to_dash_pattern('DASHDOT')
        assert len(pattern) == 4
    
    def test_dot_linetype(self):
        """Dot linetype should return short dash pattern."""
        pattern = linetype_to_dash_pattern('DOT')
        assert len(pattern) == 2
        assert pattern[0] < 1.0  # very short dash
    
    def test_center_linetype(self):
        """Center linetype should return pattern for long-short-long."""
        pattern = linetype_to_dash_pattern('CENTER')
        assert len(pattern) == 4
    
    def test_unknown_linetype(self):
        """Unknown linetype should default to continuous (empty)."""
        assert linetype_to_dash_pattern('UNKNOWNTYPE') == []
    
    def test_case_insensitive(self):
        """Linetype matching should be case insensitive."""
        assert linetype_to_dash_pattern('dashed') == linetype_to_dash_pattern('DASHED')
        assert linetype_to_dash_pattern('DoT') == linetype_to_dash_pattern('DOT')


class TestLineweightConversion:
    """Test DXF lineweight to DUC stroke width conversion."""
    
    def test_positive_lineweight(self):
        """Positive lineweights should convert from 1/100mm to mm."""
        assert lineweight_to_width(25) == 0.25  # 0.25mm
        assert lineweight_to_width(50) == 0.50  # 0.50mm
        assert lineweight_to_width(100) == 1.0  # 1.0mm
        assert lineweight_to_width(13) == 0.13  # 0.13mm
    
    def test_bylayer_lineweight(self):
        """BYLAYER lineweight (-1) should return None."""
        assert lineweight_to_width(-1) is None
    
    def test_byblock_lineweight(self):
        """BYBLOCK lineweight (-2) should return None."""
        assert lineweight_to_width(-2) is None
    
    def test_default_lineweight(self):
        """DEFAULT lineweight (-3) should return None."""
        assert lineweight_to_width(-3) is None


class TestLayerConversion:
    """Test DXF layer table to DUC layers conversion."""
    
    def test_default_layer(self):
        """Layer 0 should always exist with default properties."""
        doc = ezdxf.new('R2010')
        layers = convert_layers(doc)
        
        # Find layer 0
        layer_0 = next((l for l in layers if l.id == '0'), None)
        assert layer_0 is not None
        assert layer_0.stack_base.label == '0'
        assert layer_0.stack_base.is_visible is True
        assert layer_0.stack_base.locked is False
    
    def test_custom_layer_basic(self):
        """Custom layer should be converted with basic properties."""
        doc = ezdxf.new('R2010')
        doc.layers.add('MyLayer', color=1)  # Red
        
        layers = convert_layers(doc)
        my_layer = next((l for l in layers if l.id == 'MyLayer'), None)
        
        assert my_layer is not None
        assert my_layer.stack_base.label == 'MyLayer'
        assert my_layer.stack_base.is_visible is True
    
    def test_layer_color_aci(self):
        """Layer color should be converted from ACI to hex."""
        doc = ezdxf.new('R2010')
        doc.layers.add('RedLayer', color=1)  # ACI 1 = Red
        doc.layers.add('YellowLayer', color=2)  # ACI 2 = Yellow
        doc.layers.add('GreenLayer', color=3)  # ACI 3 = Green
        
        layers = convert_layers(doc)
        
        red_layer = next((l for l in layers if l.id == 'RedLayer'), None)
        assert red_layer.overrides.stroke.content.src == get_hex_from_aci(1)
        
        yellow_layer = next((l for l in layers if l.id == 'YellowLayer'), None)
        assert yellow_layer.overrides.stroke.content.src == get_hex_from_aci(2)
        
        green_layer = next((l for l in layers if l.id == 'GreenLayer'), None)
        assert green_layer.overrides.stroke.content.src == get_hex_from_aci(3)
    
    def test_layer_color_rgb(self):
        """Layer with RGB color should be converted to hex."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('RGBLayer')
        layer.rgb = (255, 128, 64)  # Custom RGB color
        
        layers = convert_layers(doc)
        rgb_layer = next((l for l in layers if l.id == 'RGBLayer'), None)
        
        assert rgb_layer.overrides.stroke.content.src == "#FF8040"
    
    def test_layer_off(self):
        """Layer that is off should not be visible."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('OffLayer')
        layer.off()
        
        layers = convert_layers(doc)
        off_layer = next((l for l in layers if l.id == 'OffLayer'), None)
        
        assert off_layer.stack_base.is_visible is False
    
    def test_layer_frozen(self):
        """Frozen layer should not be visible."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('FrozenLayer')
        layer.freeze()
        
        layers = convert_layers(doc)
        frozen_layer = next((l for l in layers if l.id == 'FrozenLayer'), None)
        
        assert frozen_layer.stack_base.is_visible is False
    
    def test_layer_locked(self):
        """Locked layer should have locked flag set."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('LockedLayer')
        layer.lock()
        
        layers = convert_layers(doc)
        locked_layer = next((l for l in layers if l.id == 'LockedLayer'), None)
        
        assert locked_layer.stack_base.locked is True
    
    def test_layer_unlocked(self):
        """Unlocked layer should have locked flag false."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('UnlockedLayer')
        layer.unlock()
        
        layers = convert_layers(doc)
        unlocked_layer = next((l for l in layers if l.id == 'UnlockedLayer'), None)
        
        assert unlocked_layer.stack_base.locked is False
    
    def test_layer_plot_flag_on(self):
        """Layer with plot flag should have is_plot True."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('PlotLayer')
        layer.dxf.plot = 1  # Plot enabled
        
        layers = convert_layers(doc)
        plot_layer = next((l for l in layers if l.id == 'PlotLayer'), None)
        
        assert plot_layer.stack_base.is_plot is True
    
    def test_layer_plot_flag_off(self):
        """Layer with no-plot flag should have is_plot False."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('NoPlotLayer')
        layer.dxf.plot = 0  # Plot disabled
        
        layers = convert_layers(doc)
        no_plot_layer = next((l for l in layers if l.id == 'NoPlotLayer'), None)
        
        assert no_plot_layer.stack_base.is_plot is False
    
    def test_layer_transparency(self):
        """Layer transparency should be converted to opacity."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('TransparentLayer')
        layer.transparency = 0.5  # 50% transparent
        
        layers = convert_layers(doc)
        transparent_layer = next((l for l in layers if l.id == 'TransparentLayer'), None)
        
        # Opacity should be 1.0 - transparency (use approx due to ezdxf integer storage)
        assert transparent_layer.stack_base.styles.opacity == pytest.approx(0.5, abs=0.01)
    
    def test_layer_opaque(self):
        """Layer with no transparency should have full opacity."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('OpaqueLayer')
        layer.transparency = 0.0  # Fully opaque
        
        layers = convert_layers(doc)
        opaque_layer = next((l for l in layers if l.id == 'OpaqueLayer'), None)
        
        assert opaque_layer.stack_base.styles.opacity == 1.0
    
    def test_multiple_layers(self):
        """Multiple layers should all be converted."""
        doc = ezdxf.new('R2010')
        doc.layers.add('Layer1', color=1)
        doc.layers.add('Layer2', color=2)
        doc.layers.add('Layer3', color=3)
        
        layers = convert_layers(doc)
        
        # Should have layer 0 (default) + 3 custom layers
        assert len(layers) >= 4
        
        layer_ids = [l.id for l in layers]
        assert '0' in layer_ids
        assert 'Layer1' in layer_ids
        assert 'Layer2' in layer_ids
        assert 'Layer3' in layer_ids
    
    def test_layer_linetype(self):
        """Layer linetype should be stored (for future element use)."""
        doc = ezdxf.new('R2010', setup=True)  # setup=True loads standard linetypes
        layer = doc.layers.add('DashedLayer')
        layer.dxf.linetype = 'DASHED'
        
        # Note: linetype is converted via helper function
        dash_pattern = linetype_to_dash_pattern('DASHED')
        assert len(dash_pattern) > 0
    
    def test_layer_lineweight(self):
        """Layer lineweight should be converted to stroke width."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('ThickLayer')
        layer.dxf.lineweight = 50  # 0.50mm
        
        width = lineweight_to_width(50)
        assert width == 0.50
    
    def test_layer_combined_properties(self):
        """Layer with multiple properties should convert all correctly."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('ComplexLayer', color=5)  # Blue
        layer.lock()
        layer.transparency = 0.3
        layer.dxf.plot = 1
        layer.dxf.lineweight = 25  # 0.25mm
        
        layers = convert_layers(doc)
        complex_layer = next((l for l in layers if l.id == 'ComplexLayer'), None)
        
        assert complex_layer is not None
        assert complex_layer.stack_base.locked is True
        assert complex_layer.stack_base.is_plot is True
        assert complex_layer.stack_base.styles.opacity == pytest.approx(0.7, abs=0.01)  # 1.0 - 0.3
        assert complex_layer.overrides.stroke.content.src == get_hex_from_aci(5)


class TestLayerEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_layer_table(self):
        """Document with only default layer should work."""
        doc = ezdxf.new('R2010')
        layers = convert_layers(doc)
        
        # Should at least have layer 0
        assert len(layers) >= 1
    
    def test_layer_missing_optional_properties(self):
        """Layer without optional properties should use defaults."""
        doc = ezdxf.new('R2010')
        layer = doc.layers.add('MinimalLayer')
        
        # Don't set any optional properties
        layers = convert_layers(doc)
        minimal_layer = next((l for l in layers if l.id == 'MinimalLayer'), None)
        
        assert minimal_layer is not None
        # Should have reasonable defaults
        assert minimal_layer.stack_base.is_visible is True
        assert minimal_layer.stack_base.locked is False
    
    def test_layer_special_characters_name(self):
        """Layer with special characters in name should be handled."""
        doc = ezdxf.new('R2010')
        special_name = 'Layer-With_Special.Chars'
        doc.layers.add(special_name)
        
        layers = convert_layers(doc)
        special_layer = next((l for l in layers if l.id == special_name), None)
        
        assert special_layer is not None
        assert special_layer.stack_base.label == special_name


class TestEndToEndLayerConversion:
    """Integration tests for layer conversion in full DXF to DUC workflow."""
    
    def test_layer_conversion_in_duc_file(self):
        """Layers should be properly included in final DUC file."""
        from ducxf.dxf_to_duc import convert_dxf_to_duc
        
        # Create a test DXF file
        doc = ezdxf.new('R2010')
        doc.layers.add('TestLayer1', color=1)
        doc.layers.add('TestLayer2', color=2)
        
        # Add some entities on these layers
        msp = doc.modelspace()
        msp.add_line((0, 0), (10, 10), dxfattribs={'layer': 'TestLayer1'})
        msp.add_circle((5, 5), radius=3, dxfattribs={'layer': 'TestLayer2'})
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.dxf', delete=False) as dxf_file:
            dxf_path = dxf_file.name
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.duc', delete=False) as duc_file:
            duc_path = duc_file.name
        
        try:
            doc.saveas(dxf_path)
            convert_dxf_to_duc(dxf_path, duc_path)
            
            # Verify the DUC file was created
            assert os.path.exists(duc_path)
            assert os.path.getsize(duc_path) > 0
        finally:
            # Cleanup
            if os.path.exists(dxf_path):
                os.unlink(dxf_path)
            if os.path.exists(duc_path):
                os.unlink(duc_path)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
