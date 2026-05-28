"""Tests to verify embedded code validation during DUC serialization for Document and Model elements."""

import os
import pytest
import ducpy as duc

def test_typst_validation_success(test_output_dir):
    """Verify that a Document element with valid Typst syntax serializes successfully."""
    valid_typst = (
        "= Valid Document Title\n"
        "This is *valid* Typst content.\n"
        "We can have headings, formatting, and structural components."
    )
    
    # Create the Document element
    doc_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(400.0, 200.0)
        .with_label("Valid Typst Doc")
        .build_doc_element()
        .with_text(valid_typst)
        .build()
    )
    
    # Serialize it
    serialized_bytes = duc.serialize_duc(
        name="ValidTypstDocTest",
        elements=[doc_element],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    # Write to output for reference/inspection
    output_path = os.path.join(test_output_dir, "test_typst_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_typst_validation_failure():
    """Verify that a Document element with invalid Typst syntax fails serialization."""
    invalid_typst = (
        "= Invalid Document\n"
        "#let x = [\n"  # Unclosed delimiter syntax error
        "This Typst content is invalid."
    )
    
    # Create the Document element
    doc_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(400.0, 200.0)
        .with_label("Invalid Typst Doc")
        .build_doc_element()
        .with_text(invalid_typst)
        .build()
    )
    
    # Serialize it and expect an error
    with pytest.raises(duc.DucSerializationValidationError) as excinfo:
        duc.serialize_duc(
            name="InvalidTypstDocTest",
            elements=[doc_element],
            validate_embedded_code=True
        )
    
    assert "Typst validation failed" in str(excinfo.value)
    assert "unclosed delimiter" in str(excinfo.value).lower()


def test_build123d_validation_success(test_output_dir):
    """Verify that a Model element with valid build123d Python syntax serializes successfully."""
    valid_python = (
        "from ocp_vscode import show\n"
        "from build123d import *\n\n"
        "# Create a shape\n"
        "b = Box(1, 1, 1)\n"
        "show(b)\n"
    )
    
    # Create the Model element (model_type defaults to "python" if not specified)
    model_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Valid build123d Model")
        .build_model_element()
        .with_code(valid_python)
        .build()
    )
    
    assert model_element.element.model_type == "python"

    # Serialize it
    serialized_bytes = duc.serialize_duc(
        name="ValidBuild123dModelTest",
        elements=[model_element],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    # Write to output for reference/inspection
    output_path = os.path.join(test_output_dir, "test_build123d_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_build123d_validation_failure():
    """Verify that a Model element with invalid build123d logic fails serialization."""
    invalid_python = (
        "from ocp_vscode import show\n"
        "from build123d import *\n\n"
        "b = Box(0, 0, 0)\n"  # Valid Python syntax, but invalid shape definition in build123d
        "show(b)\n"
    )
    
    # Create the Model element
    model_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Invalid build123d Model")
        .build_model_element()
        .with_model_type("python")
        .with_code(invalid_python)
        .build()
    )
    
    # Serialize it and expect an error
    with pytest.raises(duc.DucSerializationValidationError) as excinfo:
        duc.serialize_duc(
            name="InvalidBuild123dModelTest",
            elements=[model_element],
            validate_embedded_code=True
        )
    
    assert "Python validation failed" in str(excinfo.value)
    assert "standard_failure" in str(excinfo.value).lower()


def test_ifcopenshell_validation_success(test_output_dir, test_assets_dir):
    """Verify that a Model element with valid ifcopenshell Python syntax and a real file serializes successfully."""
    # Load the real IFC file
    ifc_file_path = os.path.join(test_assets_dir, "ifc-files", "NVW_DCR-LOD100_Arch.ifc")
    with open(ifc_file_path, "rb") as f:
        ifc_bytes = f.read()
        
    external_file = (
        duc.StateBuilder()
        .with_id("real_ifc_file")
        .build_external_file()
        .with_mime_type("application/x-ifc")
        .with_data(ifc_bytes)
        .build()
    )

    valid_python = f"""from ocp_vscode import show
import ifcopenshell

# Standalone validation fallback resolver pointing to the real file path
if "resolve_external_file" not in globals() and "resolve_external_file" not in __builtins__.__dict__:
    def resolve_external_file(file_id):
        return {repr(ifc_file_path)}

MODEL_FILE_ID = "real_ifc_file"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

model = ifcopenshell.open(MODEL_PATH)
show(model)
"""
    
    # Create the Model element
    model_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Valid ifcopenshell Model")
        .build_model_element()
        .with_code(valid_python)
        .with_file_ids(["real_ifc_file"])
        .build()
    )
    
    assert model_element.element.model_type == "python"

    # Serialize it
    serialized_bytes = duc.serialize_duc(
        name="ValidIfcModelTest",
        elements=[model_element],
        external_files=[external_file],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    # Write to output for reference/inspection
    output_path = os.path.join(test_output_dir, "test_ifc_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_ifcopenshell_validation_failure():
    """Verify that a Model element with invalid ifcopenshell logic fails serialization."""
    invalid_python = (
        "import ifcopenshell\n"
        "f = ifcopenshell.file()\n"
        "f.create_entity('IfcNonExistentEntity')\n"  # Valid Python syntax, but entity doesn't exist
    )
    
    # Create the Model element
    model_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Invalid ifcopenshell Model")
        .build_model_element()
        .with_model_type("python")
        .with_code(invalid_python)
        .build()
    )
    
    # Serialize it and expect an error
    with pytest.raises(duc.DucSerializationValidationError) as excinfo:
        duc.serialize_duc(
            name="InvalidIfcModelTest",
            elements=[model_element],
            validate_embedded_code=True
        )
    
    assert "Python validation failed" in str(excinfo.value)
    assert "not found in schema" in str(excinfo.value).lower()


def test_ezdxf_validation_success(test_output_dir, test_assets_dir):
    """Verify that a Model element with valid ezdxf Python syntax and a real file serializes successfully."""
    # Load the real DXF file
    dxf_file_path = os.path.join(test_assets_dir, "dxf-files", "Minimal_DXF_AC1021.dxf")
    with open(dxf_file_path, "rb") as f:
        dxf_bytes = f.read()
        
    external_file = (
        duc.StateBuilder()
        .with_id("real_dxf_file")
        .build_external_file()
        .with_mime_type("application/dxf")
        .with_data(dxf_bytes)
        .build()
    )

    valid_python = f"""import ezdxf

# Standalone validation fallback resolver pointing to the real file path
if "resolve_external_file" not in globals() and "resolve_external_file" not in __builtins__.__dict__:
    def resolve_external_file(file_id):
        return {repr(dxf_file_path)}

MODEL_FILE_ID = "real_dxf_file"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

doc = ezdxf.readfile(MODEL_PATH)
msp = doc.modelspace()
print("Modelspace entities:", len(msp))
"""
    
    # Create the Model element
    model_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Valid ezdxf Model")
        .build_model_element()
        .with_code(valid_python)
        .with_file_ids(["real_dxf_file"])
        .build()
    )
    
    assert model_element.element.model_type == "python"

    # Serialize it
    serialized_bytes = duc.serialize_duc(
        name="ValidEzdxfModelTest",
        elements=[model_element],
        external_files=[external_file],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    # Write to output for reference/inspection
    output_path = os.path.join(test_output_dir, "test_ezdxf_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_ezdxf_validation_failure():
    """Verify that a Model element with invalid ezdxf logic fails serialization."""
    invalid_python = (
        "import ezdxf\n"
        "doc = ezdxf.new()\n"
        "msp = doc.modelspace()\n"
        "msp.add_line('invalid', 'invalid')\n"  # Valid Python syntax, but invalid coordinates for line
    )
    
    # Create the Model element
    model_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Invalid ezdxf Model")
        .build_model_element()
        .with_model_type("python")
        .with_code(invalid_python)
        .build()
    )
    
    # Serialize it and expect an error
    with pytest.raises(duc.DucSerializationValidationError) as excinfo:
        duc.serialize_duc(
            name="InvalidEzdxfModelTest",
            elements=[model_element],
            validate_embedded_code=True
        )
    
    assert "Python validation failed" in str(excinfo.value)
    assert "invalid argument count" in str(excinfo.value).lower()


def test_model_type_enforcement_raises_error():
    """Verify that an invalid model type (like 'build123d') correctly raises a ValueError at the builder and class level."""
    # 1. Test builder level enforcement
    with pytest.raises(ValueError) as excinfo:
        (
            duc.ElementBuilder()
            .build_model_element()
            .with_model_type("build123d")  # Invalid model type!
        )
    assert "Invalid model_type" in str(excinfo.value)
    assert "Allowed types" in str(excinfo.value)

    # 2. Test class level post-init enforcement
    with pytest.raises(ValueError) as excinfo:
        # Construct directly without the builder
        base = duc.ElementBuilder().base.__dict__.copy()
        # Set missing/default fields manually to satisfy constructor
        from ducpy.builders.element_builders import _create_element_wrapper
        from ducpy.classes.ElementsClass import DucModelElement
        
        duc.DucModelElement(
            base=duc.ElementBuilder().with_styles(duc.create_fill_style(duc.create_solid_content("#000000"))).build_rectangle().build().element.base,
            file_ids=[],
            model_type="invalid_type"  # Invalid!
        )
    assert "Invalid model_type" in str(excinfo.value)
