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
import serialization_demo
import parsing_demo
import document_element_demo
import model_element_demo
import hvac_elbow_duct_demo
import empire_state_ifc_demo


def _run_demo(demo_module, output_dir: str | None = None) -> tuple[str, str | None]:
    """Run a demo's ``main()``, capture stdout, and return any .duc path."""
    buf = StringIO()
    with redirect_stdout(buf):
        result = demo_module.main()

    duc_path = result if isinstance(result, str) and result.endswith(".duc") else None

    return buf.getvalue(), duc_path


class TestElementCreationDemo:
    """Test the element creation demo."""
    
    def test_element_creation_demo_runs_successfully(self, test_output_dir):
        """Test that the element creation demo runs without errors."""
        output_text, _ = _run_demo(element_creation_demo, test_output_dir)

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

    def test_mutation_demo_runs_successfully(self, test_output_dir):
        """Test that the mutation demo runs without errors."""
        output_text, duc_path = _run_demo(mutation_demo, test_output_dir)

        assert "Mutation Demo" in output_text
        assert "Mutation demo complete" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)


class TestExternalFilesDemo:
    """Test the external files demo."""
    
    def test_external_files_demo_runs_successfully(self, test_output_dir):
        """Test that the external files demo runs without errors."""
        output_text, _ = _run_demo(external_files_demo, test_output_dir)

        assert "External Files Demo" in output_text
        assert "Creating a DUC object with external files..." in output_text
        assert "DUC object with external files created successfully!" in output_text
        assert "Total external files:" in output_text
        assert "External files demo complete!" in output_text


class TestSQLBuilderDemo:
    """Test the DucSQL builder demo."""

    def test_sql_builder_demo_runs_successfully(self, test_output_dir):
        """Test that the SQL builder demo runs without errors."""
        output_text, duc_path = _run_demo(sql_builder_demo, test_output_dir)

        assert "DucSQL Builder Demo" in output_text
        assert "Create new .duc" in output_text
        assert "Open existing .duc" in output_text
        assert "File round-trip" in output_text
        assert "Advanced" in output_text
        assert "Build with SQL, serialize with the high-level API" in output_text
        assert "All DucSQL demos completed successfully!" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)


class TestSerializationDemo:
    """Test the serialization demo."""

    def test_serialization_demo_runs_successfully(self, test_output_dir):
        """Test that the serialization demo runs without errors."""
        output_text, duc_path = _run_demo(serialization_demo, test_output_dir)

        assert "Serialization Demo" in output_text
        assert "Creating elements via Builder API" in output_text
        assert "Serializing to .duc format" in output_text
        assert "Successfully serialized" in output_text
        assert "Serialization demo complete" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)


class TestParsingDemo:
    """Test the parsing demo."""

    def test_parsing_demo_runs_successfully(self, test_output_dir):
        """Test that the parsing demo runs without errors."""
        output_text, _ = _run_demo(parsing_demo, test_output_dir)

        assert "Parsing Demo" in output_text
        assert "Parsing a .duc file from a file path" in output_text
        assert "Accessing element attributes" in output_text
        assert "Re-parsing from the streamed file path" in output_text
        assert "Parsing demo complete" in output_text


class TestDocumentElementDemo:
    """Test the document element demo."""
    
    def test_document_element_demo_runs_successfully(self, test_output_dir):
        """Test that the document element demo runs without errors."""
        output_text, duc_path = _run_demo(document_element_demo, test_output_dir)

        assert "Document Element Demo" in output_text
        assert "Designing rich Typst document content" in output_text
        assert "Building the Document element" in output_text
        assert "Successfully serialized DUC file" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)
        
        
class TestModelElementDemo:
    """Test the model element demo."""
    
    def test_model_element_demo_runs_successfully(self, test_output_dir):
        """Test that the model element demo runs without errors."""
        output_text, duc_path = _run_demo(model_element_demo, test_output_dir)

        assert "Model Element Demo" in output_text
        assert "Creating Python model element with build123d" in output_text
        assert "Creating Python model element with ifcopenshell" in output_text
        assert "Creating Python model element with ezdxf" in output_text
        assert "Demonstrating Non-Python model imports" in output_text
        assert "Testing model type validation" in output_text
        assert "Correctly rejected invalid model_type" in output_text
        assert "Successfully serialized DUC file to" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)


class TestHvacElbowDuctDemo:
    """Test the HVAC elbow duct example demo."""
    
    def test_hvac_elbow_duct_demo_runs_successfully(self, test_output_dir):
        """Test that the HVAC elbow duct example demo runs without errors."""
        output_text, duc_path = _run_demo(hvac_elbow_duct_demo, test_output_dir)

        assert "Successfully serialized DUC file" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)


class TestEmpireStateIfcDemo:
    """Test the Empire State Building IFC example demo."""
    
    def test_empire_state_ifc_demo_runs_successfully(self, test_output_dir):
        """Test that the Empire State Building IFC example demo runs without errors."""
        output_text, duc_path = _run_demo(empire_state_ifc_demo, test_output_dir)

        assert "Successfully serialized DUC file" in output_text
        assert duc_path is not None
        assert os.path.isfile(duc_path)


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
