"""
Test header conversion from DXF to DUC format.

This module tests the convert_header function to ensure all DXF header variables
are properly converted to DUC global state, local state, and conversion context.
"""

import pytest
import ezdxf
import sys
import os

# Add the project's 'src' directory to the Python path
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from ducxf.dxf_to_duc import convert_header
import ducpy as duc
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR


@pytest.fixture
def basic_dxf_doc():
    """Create a basic DXF document for testing."""
    doc = ezdxf.new('R2010')
    return doc


@pytest.fixture
def configured_dxf_doc():
    """Create a DXF document with custom header settings."""
    doc = ezdxf.new('R2010')
    header = doc.header
    
    # Set various header variables
    header['$INSUNITS'] = 4  # millimeters
    header['$LTSCALE'] = 2.5
    header['$MEASUREMENT'] = 1  # Metric
    header['$FILLMODE'] = 0  # Fill mode off
    header['$TEXTSTYLE'] = 'Standard'
    header['$CLAYER'] = 'MyLayer'
    header['$DIMSTYLE'] = 'ISO-25'
    # Note: $MLEADERSTYLE is not supported in R2010 header, handled elsewhere
    # Note: $CANNOSCALE is not supported in R2010 header, it was introduced in later versions
    header['$CELTSCALE'] = 1.5
    header['$LUNITS'] = 2  # Decimal
    header['$AUNITS'] = 0  # Decimal degrees
    
    return doc


class TestHeaderConversionBasics:
    """Test basic header conversion functionality."""
    
    def test_convert_header_returns_tuple(self, basic_dxf_doc):
        """Test that convert_header returns a tuple with 3 elements."""
        result = convert_header(basic_dxf_doc.header, basic_dxf_doc)
        assert isinstance(result, tuple)
        assert len(result) == 3
        
        global_state, local_state, context = result
        assert global_state is not None
        assert local_state is not None
        assert isinstance(context, dict)
    
    def test_default_units(self, basic_dxf_doc):
        """Test default unit conversion when no units are specified."""
        global_state, local_state, context = convert_header(
            basic_dxf_doc.header, basic_dxf_doc
        )
        
        # Default INSUNITS in R2010 seems to be meters
        assert global_state.main_scope in ["mm", "m"]  # Allow both defaults
        assert local_state.scope in ["mm", "m"]
    
    def test_default_linetype_scale(self, basic_dxf_doc):
        """Test default linetype scale."""
        global_state, local_state, context = convert_header(
            basic_dxf_doc.header, basic_dxf_doc
        )
        
        # Default LTSCALE is 1.0
        assert global_state.dash_spacing_scale == 1.0


class TestGlobalStateConversion:
    """Test conversion of header variables to DUC global state."""
    
    def test_ltscale_conversion(self, configured_dxf_doc):
        """Test $LTSCALE conversion to dash_spacing_scale."""
        global_state, _, _ = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        assert global_state.dash_spacing_scale == 2.5
    
    def test_insunits_conversion(self, configured_dxf_doc):
        """Test $INSUNITS conversion to main_scope."""
        global_state, _, _ = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        # INSUNITS = 4 is millimeters
        assert global_state.main_scope == "mm"
    
    @pytest.mark.skip(reason="$CANNOSCALE is not settable via ezdxf header API")
    def test_cannoscale_conversion(self):
        """Test $CANNOSCALE conversion to use_annotative_scaling.
        
        Note: $CANNOSCALE was introduced in DXF R2013, but ezdxf doesn't allow
        setting it directly via the header dictionary. The conversion code
        handles this by using header.get() with a default of None.
        """
        doc = ezdxf.new('R2013')  # R2013+ supports $CANNOSCALE
        doc.header['$CANNOSCALE'] = '1:2'
        
        global_state, _, _ = convert_header(doc.header, doc)
        
        # When CANNOSCALE is set, use_annotative_scaling should be True
        assert global_state.use_annotative_scaling is True
    
    def test_no_annotative_scaling_when_cannoscale_absent(self, basic_dxf_doc):
        """Test that use_annotative_scaling is False when $CANNOSCALE is not set."""
        global_state, _, _ = convert_header(
            basic_dxf_doc.header, basic_dxf_doc
        )
        
        assert global_state.use_annotative_scaling is False


class TestLocalStateConversion:
    """Test conversion of header variables to DUC local state."""
    
    def test_fillmode_to_outline_mode(self, configured_dxf_doc):
        """Test $FILLMODE conversion to outline_mode_enabled (inverse logic)."""
        _, local_state, _ = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        # FILLMODE = 0 (fills off) should set outline_mode_enabled = True
        assert local_state.outline_mode_enabled is True
    
    def test_fillmode_on(self, basic_dxf_doc):
        """Test that FILLMODE = 1 results in outline_mode_enabled = False."""
        basic_dxf_doc.header['$FILLMODE'] = 1
        _, local_state, _ = convert_header(
            basic_dxf_doc.header, basic_dxf_doc
        )
        
        # FILLMODE = 1 (fills on) should set outline_mode_enabled = False
        assert local_state.outline_mode_enabled is False
    
    def test_textstyle_conversion(self, configured_dxf_doc):
        """Test $TEXTSTYLE conversion to font properties in context."""
        _, local_state, context = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        # Font info should be in conversion context
        assert 'font_family' in context
        assert 'font_size' in context
        assert context['font_family'] is not None
        assert context['font_size'] > 0
    
    def test_scope_matches_insunits(self, configured_dxf_doc):
        """Test that local_state.scope matches the units."""
        _, local_state, _ = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        assert local_state.scope == "mm"


class TestConversionContext:
    """Test conversion context dictionary contents."""
    
    def test_current_layer(self, configured_dxf_doc):
        """Test $CLAYER conversion to conversion context."""
        _, _, context = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        assert 'current_layer' in context
        assert context['current_layer'] == 'MyLayer'
    
    def test_current_dimstyle(self, configured_dxf_doc):
        """Test $DIMSTYLE conversion to conversion context."""
        _, _, context = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        assert 'current_dimstyle' in context
        assert context['current_dimstyle'] == 'ISO-25'
    
    def test_current_mleaderstyle(self, basic_dxf_doc):
        """Test $MLEADERSTYLE conversion to conversion context."""
        _, _, context = convert_header(
            basic_dxf_doc.header, basic_dxf_doc
        )
        
        # MLEADERSTYLE defaults to 'Standard' when not set
        assert 'current_mleaderstyle' in context
        assert context['current_mleaderstyle'] == 'Standard'
    
    def test_celtscale(self, configured_dxf_doc):
        """Test $CELTSCALE conversion to conversion context."""
        _, _, context = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        assert 'celtscale' in context
        assert context['celtscale'] == 1.5
    
    def test_standard_units_in_context(self, configured_dxf_doc):
        """Test that standard_units is included in conversion context."""
        _, _, context = convert_header(
            configured_dxf_doc.header, configured_dxf_doc
        )
        
        assert 'standard_units' in context
        assert context['standard_units'] is not None
        
        # Verify standard_units has primary_units
        standard_units = context['standard_units']
        assert hasattr(standard_units, 'primary_units')
        assert standard_units.primary_units is not None
    
    def test_default_context_values(self, basic_dxf_doc):
        """Test default values in conversion context."""
        _, _, context = convert_header(
            basic_dxf_doc.header, basic_dxf_doc
        )
        
        # Defaults - R2010 uses ISO-25 as default dimstyle
        assert context['current_layer'] == '0'
        assert context['current_dimstyle'] in ['Standard', 'ISO-25']  # Depends on DXF version
        assert context['current_mleaderstyle'] == 'Standard'
        assert context['celtscale'] == 1.0


class TestUnitSystemConversion:
    """Test unit system conversions."""
    
    def test_metric_system(self):
        """Test metric system detection."""
        doc = ezdxf.new('R2010')
        doc.header['$MEASUREMENT'] = 1  # Metric
        doc.header['$INSUNITS'] = 4  # millimeters
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.system == UNIT_SYSTEM.METRIC
    
    def test_imperial_system(self):
        """Test imperial system detection."""
        doc = ezdxf.new('R2010')
        doc.header['$MEASUREMENT'] = 0  # Imperial
        doc.header['$INSUNITS'] = 1  # inches
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.system == UNIT_SYSTEM.IMPERIAL
    
    def test_linear_units_format(self):
        """Test linear units format conversion."""
        doc = ezdxf.new('R2010')
        doc.header['$LUNITS'] = 2  # Decimal
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.format == DIMENSION_UNITS_FORMAT.DECIMAL
    
    def test_angular_units_format(self):
        """Test angular units format conversion."""
        doc = ezdxf.new('R2010')
        doc.header['$AUNITS'] = 0  # Decimal degrees
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.angular.format == ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES


class TestDimensionStylePrecision:
    """Test dimension style precision and suppression settings."""
    
    def test_precision_from_dimstyle(self):
        """Test that precision is extracted from dimension style."""
        doc = ezdxf.new('R2010')
        dimstyle = doc.dimstyles.get('Standard')
        dimstyle.dxf.dimtdec = 4  # 4 decimal places
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.precision == 4
    
    def test_decimal_separator_conversion(self):
        """Test decimal separator conversion."""
        doc = ezdxf.new('R2010')
        dimstyle = doc.dimstyles.get('Standard')
        dimstyle.dxf.dimdsep = 44  # Comma separator
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.decimal_separator == DECIMAL_SEPARATOR.COMMA
    
    def test_suppress_trailing_zeros(self):
        """Test trailing zeros suppression."""
        doc = ezdxf.new('R2010')
        dimstyle = doc.dimstyles.get('Standard')
        dimstyle.dxf.dimtzin = 1  # Bit 0: suppress trailing zeros
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.suppress_trailing_zeros is True
    
    def test_suppress_leading_zeros(self):
        """Test leading zeros suppression."""
        doc = ezdxf.new('R2010')
        dimstyle = doc.dimstyles.get('Standard')
        dimstyle.dxf.dimtzin = 4  # Bit 2: suppress leading zeros
        
        _, _, context = convert_header(doc.header, doc)
        
        standard_units = context['standard_units']
        assert standard_units.primary_units.linear.suppress_leading_zeros is True


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_missing_dimstyle(self):
        """Test handling when Standard dimstyle doesn't exist."""
        doc = ezdxf.new('R2010')
        # Remove Standard dimstyle
        if 'Standard' in doc.dimstyles:
            doc.dimstyles.remove('Standard')
        
        # Should not crash, should use defaults
        global_state, local_state, context = convert_header(doc.header, doc)
        
        assert global_state is not None
        assert local_state is not None
        assert context is not None
    
    def test_various_insert_units(self):
        """Test conversion of various INSUNITS values."""
        test_cases = [
            (1, "in"),    # Inches
            (2, "ft"),    # Feet
            (4, "mm"),    # Millimeters
            (5, "cm"),    # Centimeters
            (6, "m"),     # Meters
        ]
        
        for insunit_value, expected_scope in test_cases:
            doc = ezdxf.new('R2010')
            doc.header['$INSUNITS'] = insunit_value
            
            global_state, local_state, _ = convert_header(doc.header, doc)
            
            assert global_state.main_scope == expected_scope, \
                f"INSUNITS {insunit_value} should map to {expected_scope}"
            assert local_state.scope == expected_scope
    
    def test_custom_text_style_with_font(self):
        """Test conversion with custom text style that has font properties."""
        doc = ezdxf.new('R2010')
        
        # Create custom text style
        if 'CustomStyle' not in doc.styles:
            text_style = doc.styles.new('CustomStyle')
            text_style.dxf.font = 'Courier New'
            text_style.dxf.height = 5.0
        
        doc.header['$TEXTSTYLE'] = 'CustomStyle'
        
        _, _, context = convert_header(doc.header, doc)
        
        # Font properties are in conversion context
        assert context['font_family'] == 'Courier New'
        assert context['font_size'] == 5.0


class TestIntegration:
    """Integration tests for complete header conversion."""
    
    def test_full_header_conversion(self):
        """Test complete header conversion with all settings."""
        doc = ezdxf.new('R2010')
        header = doc.header
        
        # Configure all header variables
        header['$INSUNITS'] = 6  # Meters
        header['$LTSCALE'] = 3.0
        header['$MEASUREMENT'] = 1  # Metric
        header['$FILLMODE'] = 1  # Fill on
        header['$TEXTSTYLE'] = 'Standard'
        header['$CLAYER'] = 'Dimensions'
        header['$DIMSTYLE'] = 'ISO-25'  # Use valid dimstyle for R2010
        # Note: $MLEADERSTYLE not supported in R2010 header
        # Note: $CANNOSCALE not supported in R2010 header
        header['$CELTSCALE'] = 2.0
        header['$LUNITS'] = 3  # Engineering
        header['$AUNITS'] = 1  # Degrees/Minutes/Seconds
        
        # Configure dimstyle
        dimstyle = doc.dimstyles.get('Standard')
        dimstyle.dxf.dimtdec = 3
        dimstyle.dxf.dimtzin = 5  # Bits 0 and 2
        dimstyle.dxf.dimdsep = 46  # Dot separator
        
        # Convert
        global_state, local_state, context = convert_header(header, doc)
        
        # Verify all conversions
        assert global_state.main_scope == "m"
        assert global_state.dash_spacing_scale == 3.0
        # Note: use_annotative_scaling is False in R2010 because $CANNOSCALE is not supported
        assert global_state.use_annotative_scaling is False
        
        assert local_state.scope == "m"
        assert local_state.outline_mode_enabled is False
        
        assert context['current_layer'] == 'Dimensions'
        assert context['current_dimstyle'] == 'ISO-25'
        assert context['current_mleaderstyle'] == 'Standard'  # Default value
        assert context['celtscale'] == 2.0
        
        assert context['standard_units'] is not None
        assert context['standard_units'].primary_units.linear.precision == 3
        assert context['standard_units'].primary_units.linear.format == DIMENSION_UNITS_FORMAT.ENGINEERING
        assert context['standard_units'].primary_units.angular.format == ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS
