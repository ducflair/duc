#!/usr/bin/env python3
"""
Test suite for all example demos to ensure they work correctly.
This test file runs all the example demos and verifies their output.
"""

import os
import sys
from contextlib import redirect_stdout
from io import StringIO

import pytest

# Add the examples directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'examples'))

import element_creation_demo
import external_files_demo
import mutation_demo
import sql_builder_demo


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


class TestSQLBuilderDemo:
    """Test the DucSQL builder demo."""

    def test_sql_builder_demo_runs_successfully(self):
        """Test that the SQL builder demo runs without errors."""
        output = StringIO()
        with redirect_stdout(output):
            sql_builder_demo.main()

        output_text = output.getvalue()
        assert "DucSQL Builder Demo" in output_text
        assert "Create new .duc" in output_text
        assert "Open existing .duc" in output_text
        assert "Bytes round-trip" in output_text
        assert "Advanced" in output_text
        assert "All DucSQL demos completed successfully!" in output_text


class TestStyleBuilders:
    """Test that style builders produce valid style objects."""
    
    def test_solid_content_creation(self):
        from ducpy.builders.style_builders import create_solid_content
        
        solid_content = create_solid_content("#FF0000", opacity=0.8)
        assert solid_content.src == "#FF0000"
        assert solid_content.opacity == 0.8
        assert solid_content.visible is True
    
    def test_fill_and_stroke_style_creation(self):
        from ducpy.builders.style_builders import (
            create_fill_and_stroke_style, create_solid_content)
        
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
    
    def test_text_style_creation(self):
        import ducpy as duc
        from ducpy.builders.style_builders import create_text_style
        
        text_style = create_text_style(
            font_family="Arial",
            font_size=14,
            text_align=duc.TEXT_ALIGN.LEFT
        )
        assert text_style.font_family == "Arial"
        assert text_style.font_size == 14


if __name__ == "__main__":
    pytest.main([__file__, "-v"])