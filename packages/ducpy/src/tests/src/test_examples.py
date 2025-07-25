#!/usr/bin/env python3
"""
Test suite for all example demos to ensure they work correctly.
This test file runs all the example demos and verifies their output.
"""

import pytest
import sys
import os
from io import StringIO
from contextlib import redirect_stdout

# Add the examples directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'examples'))

import style_creation_demo
import element_creation_demo
import a_duc_creation_demo
import read_write_demo
import mutation_demo
import external_files_demo


class TestStyleCreationDemo:
    """Test the style creation demo."""
    
    def test_style_creation_demo_runs_successfully(self):
        """Test that the style creation demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            style_creation_demo.main()
        
        output_text = output.getvalue()
        assert "DUC Style Builders API Demo" in output_text
        assert "Style creation demo completed successfully!" in output_text
        assert "Basic Content Creation" in output_text
        assert "Background and Stroke Creation" in output_text
        assert "Simple Style Creation" in output_text
        assert "Text Style Creation" in output_text
        assert "Document Style Creation" in output_text
        assert "Column Layout Creation" in output_text
        assert "Complex Style Combinations" in output_text
        assert "Style with Elements Demo" in output_text


class TestElementCreationDemo:
    """Test the element creation demo."""
    
    def test_element_creation_demo_runs_successfully(self):
        """Test that the element creation demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            element_creation_demo.main()
        
        output_text = output.getvalue()
        assert "Element Creation Demo" in output_text
        assert "Basic Elements Demo" in output_text
        assert "Linear Elements Demo" in output_text
        assert "Text Elements Demo" in output_text
        assert "Stack Elements Demo" in output_text
        assert "Rectangle ID:" in output_text
        assert "Ellipse ID:" in output_text
        assert "Polygon sides:" in output_text
        assert "Line has" in output_text
        assert "Arrow element type:" in output_text
        assert "Text content:" in output_text
        assert "Frame stack label:" in output_text


class TestDucCreationDemo:
    """Test the DUC creation demo."""
    
    def test_duc_creation_demo_runs_successfully(self):
        """Test that the DUC creation demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            duc_object = a_duc_creation_demo.create_sample_duc_object()
        
        output_text = output.getvalue()
        assert "Creating a sample DUC object using builders..." in output_text
        
        # Verify the DUC object was created successfully
        assert duc_object is not None
        assert hasattr(duc_object, 'elements')
        assert hasattr(duc_object, 'standards')
        assert hasattr(duc_object, 'duc_global_state')
        assert hasattr(duc_object, 'duc_local_state')
        assert hasattr(duc_object, 'files')
        
        # Verify it has some elements
        assert len(duc_object.elements) > 0
        assert len(duc_object.standards) > 0


class TestReadWriteDemo:
    """Test the read/write demo."""
    
    def test_read_write_demo_runs_successfully(self):
        """Test that the read/write demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            read_write_demo.demonstrate_read_write()
        
        output_text = output.getvalue()
        assert "Demonstrating DUC object read/write..." in output_text
        assert "Original DUC object elements:" in output_text
        assert "Serializing DUC object to" in output_text
        assert "Successfully serialized" in output_text
        assert "Parsing DUC object from" in output_text
        assert "Successfully parsed DUC object!" in output_text
        assert "Parsed DUC object elements:" in output_text
        assert "Verification successful:" in output_text
        assert "Read/Write demo complete!" in output_text


class TestMutationDemo:
    """Test the mutation demo."""
    
    def test_mutation_demo_runs_successfully(self):
        """Test that the mutation demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            mutation_demo.main()
        
        output_text = output.getvalue()
        assert "Mutation Demo" in output_text
        assert "Demonstrating element mutation..." in output_text
        assert "Initial Rectangle Properties:" in output_text
        assert "Mutating the rectangle element..." in output_text
        assert "Mutated Rectangle Properties:" in output_text
        assert "Element mutation demo complete!" in output_text


class TestExternalFilesDemo:
    """Test the external files demo."""
    
    def test_external_files_demo_runs_successfully(self):
        """Test that the external files demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            external_files_demo.main()
        
        output_text = output.getvalue()
        assert "External Files Demo" in output_text
        assert "Creating a DUC object with external files..." in output_text
        assert "DUC object with external files created successfully!" in output_text
        assert "Total external files:" in output_text
        assert "External files demo complete!" in output_text


class TestExampleIntegration:
    """Test integration between examples."""
    
    def test_examples_use_builders_api_consistently(self):
        """Test that examples consistently use the builders API."""
        # Import the examples to check they use builders API
        import style_creation_demo
        import element_creation_demo
        import a_duc_creation_demo
        
        # Check that style_creation_demo uses style builders
        assert hasattr(style_creation_demo, 'create_solid_content')
        assert hasattr(style_creation_demo, 'create_fill_and_stroke_style')
        assert hasattr(style_creation_demo, 'create_text_style')
        
        # Check that element_creation_demo uses element builders
        assert hasattr(element_creation_demo, 'duc')
        # The demo should use ElementBuilder and style builders
        
        # Check that a_duc_creation_demo uses state builders
        assert hasattr(a_duc_creation_demo, 'duc')
        # The demo should use StateBuilder
    
    def test_examples_produce_valid_duc_objects(self):
        """Test that examples produce valid DUC objects."""
        # Test DUC creation demo produces valid object
        duc_object = a_duc_creation_demo.create_sample_duc_object()
        
        # Verify the object has all required attributes
        required_attrs = ['elements', 'standards', 'duc_global_state', 'duc_local_state', 'files']
        for attr in required_attrs:
            assert hasattr(duc_object, attr)
        
        # Verify elements are properly structured
        for element in duc_object.elements:
            assert hasattr(element, 'element')
            # Check if element has base attribute (for linear elements it's linear_base)
            if hasattr(element.element, 'base'):
                assert hasattr(element.element.base, 'id')
                assert hasattr(element.element.base, 'version')
            elif hasattr(element.element, 'linear_base'):
                assert hasattr(element.element.linear_base.base, 'id')
                assert hasattr(element.element.linear_base.base, 'version')
            elif hasattr(element.element, 'stack_element_base'):
                # For stack elements, check the stack_element_base.base
                assert hasattr(element.element.stack_element_base.base, 'id')
                assert hasattr(element.element.stack_element_base.base, 'version')
            else:
                # For other element types, check the element directly
                assert hasattr(element.element, 'id')
                assert hasattr(element.element, 'version')
    
    def test_style_builders_produce_valid_styles(self):
        """Test that style builders produce valid style objects."""
        from ducpy.builders.style_builders import (
            create_solid_content, create_fill_and_stroke_style, create_text_style
        )
        
        # Test solid content creation
        solid_content = create_solid_content("#FF0000", opacity=0.8)
        assert solid_content.src == "#FF0000"
        assert solid_content.opacity == 0.8
        assert solid_content.visible is True
        
        # Test fill and stroke style creation
        fill_stroke_style = create_fill_and_stroke_style(
            fill_content=create_solid_content("#00FF00"),
            stroke_content=create_solid_content("#000000"),
            stroke_width=2.0,
            roundness=5.0
        )
        assert fill_stroke_style.roundness == 5.0
        assert len(fill_stroke_style.background) == 1
        assert len(fill_stroke_style.stroke) == 1
        assert fill_stroke_style.stroke[0].width == 2.0
        
        # Test text style creation
        import ducpy as duc
        text_style = create_text_style(
            font_family="Arial",
            font_size=14,
            text_align=duc.TEXT_ALIGN.LEFT
        )
        assert text_style.font_family == "Arial"
        assert text_style.font_size == 14


if __name__ == "__main__":
    # Run all tests
    pytest.main([__file__, "-v"]) 