"""Tests to verify embedded code validation during DUC serialization for Document and Model elements."""

import os
import pytest
import ducpy as duc

# --- Helper Functions representing embedded code blocks ---

def valid_build123d_model():
    from build123d import Box
    from ocp_vscode import show

    b = Box(1, 1, 1)
    show(b)

def invalid_build123d_model():
    from build123d import Box
    from ocp_vscode import show

    b = Box(0, 0, 0)
    show(b)

def valid_ifcopenshell_model():
    import ifcopenshell
    from ocp_vscode import show

    MODEL_FILE_ID = "real_ifc_file"
    MODEL_PATH = resolve_external_file(MODEL_FILE_ID)
    model = ifcopenshell.open(MODEL_PATH)
    show(model)

def invalid_ifcopenshell_model():
    import ifcopenshell
    f = ifcopenshell.file()
    f.create_entity('IfcNonExistentEntity')

def valid_ezdxf_model():
    import ezdxf

    MODEL_FILE_ID = "real_dxf_file"
    MODEL_PATH = resolve_external_file(MODEL_FILE_ID)
    doc = ezdxf.readfile(MODEL_PATH)
    msp = doc.modelspace()
    print("Modelspace entities:", len(msp))

def invalid_ezdxf_model():
    import ezdxf
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_line('invalid', 'invalid')


# --- Test Cases ---

def test_typst_validation_success(test_output_dir):
    """Verify that a Document element with valid Typst syntax serializes successfully."""
    valid_typst = (
        "= Valid Document Title\n"
        "This is *valid* Typst content.\n"
        "We can have headings, formatting, and structural components."
    )
    
    doc_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(400.0, 200.0)
        .with_label("Valid Typst Doc")
        .build_doc_element()
        .with_text(valid_typst)
        .build()
    )
    
    serialized_bytes = duc.serialize_duc(
        name="ValidTypstDocTest",
        elements=[doc_element],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    output_path = os.path.join(test_output_dir, "test_typst_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_typst_validation_failure():
    """Verify that a Document element with invalid Typst syntax fails serialization."""
    invalid_typst = (
        "= Invalid Document\n"
        "#let x = [\n"
        "This Typst content is invalid."
    )
    
    doc_element = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(400.0, 200.0)
        .with_label("Invalid Typst Doc")
        .build_doc_element()
        .with_text(invalid_typst)
        .build()
    )
    
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
    valid_python = duc.extract_embedded_code(valid_build123d_model)
    
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

    serialized_bytes = duc.serialize_duc(
        name="ValidBuild123dModelTest",
        elements=[model_element],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    output_path = os.path.join(test_output_dir, "test_build123d_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_build123d_validation_failure():
    """Verify that a Model element with invalid build123d logic fails serialization."""
    invalid_python = duc.extract_embedded_code(invalid_build123d_model)
    
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
    
    with pytest.raises(duc.DucSerializationValidationError) as excinfo:
        duc.serialize_duc(
            name="InvalidBuild123dModelTest",
            elements=[model_element],
            validate_embedded_code=True
        )
    
    assert "Python validation failed" in str(excinfo.value)
    # OCP exception class changed across versions (Standard_Failure → Standard_DomainError)
    assert "standard_" in str(excinfo.value).lower()


def test_ifcopenshell_validation_success(test_output_dir, test_assets_dir):
    """Verify that a Model element with valid ifcopenshell Python syntax and a real file serializes successfully."""
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

    valid_python = duc.extract_embedded_code(valid_ifcopenshell_model)
    
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

    serialized_bytes = duc.serialize_duc(
        name="ValidIfcModelTest",
        elements=[model_element],
        external_files=[external_file],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    output_path = os.path.join(test_output_dir, "test_ifc_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_ifcopenshell_validation_failure():
    """Verify that a Model element with invalid ifcopenshell logic fails serialization."""
    invalid_python = duc.extract_embedded_code(invalid_ifcopenshell_model)
    
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
    dxf_file_path = os.path.join(test_assets_dir, "dxf-files", "columns_R2007.dxf")
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

    valid_python = duc.extract_embedded_code(valid_ezdxf_model)
    
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

    serialized_bytes = duc.serialize_duc(
        name="ValidEzdxfModelTest",
        elements=[model_element],
        external_files=[external_file],
        validate_embedded_code=True
    )
    
    assert serialized_bytes is not None
    assert len(serialized_bytes) > 0

    output_path = os.path.join(test_output_dir, "test_ezdxf_validation_success.duc")
    with open(output_path, "wb") as f:
        f.write(serialized_bytes)


def test_ezdxf_validation_failure():
    """Verify that a Model element with invalid ezdxf logic fails serialization."""
    invalid_python = duc.extract_embedded_code(invalid_ezdxf_model)
    
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
    with pytest.raises(ValueError) as excinfo:
        (
            duc.ElementBuilder()
            .build_model_element()
            .with_model_type("build123d")
        )
    assert "Invalid model_type" in str(excinfo.value)
    assert "Allowed types" in str(excinfo.value)

    with pytest.raises(ValueError) as excinfo:
        duc.DucModelElement(
            base=duc.ElementBuilder().with_styles(duc.create_fill_style(duc.create_solid_content("#000000"))).build_rectangle().build().element.base,
            file_ids=[],
            model_type="invalid_type"
        )
    assert "Invalid model_type" in str(excinfo.value)
