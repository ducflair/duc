#!/usr/bin/env python3
"""
Example demonstrating how to build, configure, and serialize Model elements in DUC using real CAD/BIM assets.

This demo showcases:
1. build123d: Python parametric model element using ocp-vscode show()
2. ifcopenshell: IFC BIM model element using real IFC files and ocp-vscode show()
3. ezdxf: DXF vector drawing element using real DXF files and ezdxf.readfile()
4. Default model_type values and validation checks (ValueErrors)
5. Non-python model types (e.g. step/ifc) using DUC external files & resolve_external_file()
"""

import os
import ducpy as duc

def main():
    print("Model Element Demo")
    print("=" * 30)
    
    # 0. Resolve the testing assets directory dynamically
    current_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.normpath(os.path.join(current_dir, "..", "..", "..", "..", "assets", "testing"))
    print(f"Testing Assets Directory resolved to: {assets_dir}")
    
    # Define paths to real test files
    ifc_file_path = os.path.join(assets_dir, "ifc-files", "NVW_DCR-LOD100_Arch.ifc")
    dxf_file_path = os.path.join(assets_dir, "dxf-files", "Minimal_DXF_AC1021.dxf")
    step_file_path = os.path.join(assets_dir, "step-files", "123Block_Color.stp")

    print("\n1. Creating Python model element with build123d...")
    # build123d uses ocp-vscode show() to output the parametric 3D preview
    build123d_code = """from ocp_vscode import show
from build123d import *

# Construct a simple box shape
b = Box(1.0, 1.0, 1.0)
show(b)
"""
    # model_type defaults to "python" if omitted
    build123d_model = (
        duc.ElementBuilder()
        .at_position(0.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Parametric Box Shape")
        .build_model_element()
        .with_code(build123d_code)
        .build()
    )
    print(f"   Created build123d model (defaults to model_type: '{build123d_model.element.model_type}')")

    print("\n2. Creating Python model element with ifcopenshell and a REAL IFC file...")
    # Read the real IFC file bytes
    with open(ifc_file_path, "rb") as f:
        ifc_bytes = f.read()
        
    # Build a DUC external file object for the IFC file
    ifc_external_file = (
        duc.StateBuilder()
        .with_id("real_ifc_file")
        .build_external_file()
        .with_mime_type("application/x-ifc")
        .with_data(ifc_bytes)
        .build()
    )

    ifcopenshell_code = f"""from ocp_vscode import show
import ifcopenshell

# Standalone validation fallback resolver pointing to the real file path
if "resolve_external_file" not in globals() and "resolve_external_file" not in __builtins__.__dict__:
    def resolve_external_file(file_id):
        return {repr(ifc_file_path)}

MODEL_FILE_ID = "real_ifc_file"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

# Open the real IFC file and show its contents
model = ifcopenshell.open(MODEL_PATH)
show(model)
"""
    ifc_model = (
        duc.ElementBuilder()
        .at_position(120.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Real IFC Structure Model")
        .build_model_element()
        .with_model_type("python")
        .with_code(ifcopenshell_code)
        .with_file_ids(["real_ifc_file"])
        .build()
    )
    print(f"   Created ifcopenshell model with real IFC file '{os.path.basename(ifc_file_path)}' ({len(ifc_bytes)} bytes)")

    print("\n3. Creating Python model element with ezdxf and a REAL DXF file...")
    # Read the real DXF file bytes
    with open(dxf_file_path, "rb") as f:
        dxf_bytes = f.read()
        
    # Build a DUC external file object for the DXF file
    dxf_external_file = (
        duc.StateBuilder()
        .with_id("real_dxf_file")
        .build_external_file()
        .with_mime_type("application/dxf")
        .with_data(dxf_bytes)
        .build()
    )

    ezdxf_code = f"""import ezdxf

# Standalone validation fallback resolver pointing to the real file path
if "resolve_external_file" not in globals() and "resolve_external_file" not in __builtins__.__dict__:
    def resolve_external_file(file_id):
        return {repr(dxf_file_path)}

MODEL_FILE_ID = "real_dxf_file"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

# Read the DXF drawing
doc = ezdxf.readfile(MODEL_PATH)
msp = doc.modelspace()
print("DXF Modelspace entities:", len(msp))
"""
    dxf_model = (
        duc.ElementBuilder()
        .at_position(240.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("Real DXF Layout Drawing")
        .build_model_element()
        .with_model_type("python")
        .with_code(ezdxf_code)
        .with_file_ids(["real_dxf_file"])
        .build()
    )
    print(f"   Created ezdxf model with real DXF file '{os.path.basename(dxf_file_path)}' ({len(dxf_bytes)} bytes)")

    print("\n4. Demonstrating Non-Python model imports (via external STEP files)...")
    # Read the real STEP file bytes
    with open(step_file_path, "rb") as f:
        step_bytes = f.read()
        
    # Build a DUC external file object for the STEP file
    step_external_file = (
        duc.StateBuilder()
        .with_id("real_step_file")
        .build_external_file()
        .with_mime_type("model/step")
        .with_data(step_bytes)
        .build()
    )

    step_importer_code = f"""from ocp_vscode import show
from build123d import *

# Standalone validation fallback resolver pointing to the real file path
if "resolve_external_file" not in globals() and "resolve_external_file" not in __builtins__.__dict__:
    def resolve_external_file(file_id):
        return {repr(step_file_path)}

MODEL_FILE_ID = "real_step_file"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

# Import the STEP geometry and showcase it
part = import_step(MODEL_PATH)
show(part)
"""
    step_model = (
        duc.ElementBuilder()
        .at_position(360.0, 0.0)
        .with_size(100.0, 100.0)
        .with_label("STEP Solid Block Assembly")
        .build_model_element()
        .with_model_type("step")
        .with_file_ids(["real_step_file"])
        .with_code(step_importer_code)
        .build()
    )
    print(f"   Created STEP model with real STEP file '{os.path.basename(step_file_path)}' ({len(step_bytes)} bytes)")

    print("\n5. Testing model type validation (ValueErrors)...")
    # Attempting to assign an unsupported type (e.g. "build123d" directly) throws a ValueError
    try:
        (
            duc.ElementBuilder()
            .build_model_element()
            .with_model_type("build123d")
        )
    except ValueError as exc:
        print(f"   \u274c Correctly rejected invalid model_type: {exc}")

    print("\n6. Serializing all valid model elements into .duc file...")
    # Register all DUC external files as part of serialization
    duc_bytes = duc.serialize_duc(
        name="model_element_example",
        elements=[build123d_model, ifc_model, dxf_model, step_model],
        external_files=[ifc_external_file, dxf_external_file, step_external_file],
        validate_embedded_code=True
    )
    print(f"   Successfully serialized DUC file containing {len(duc_bytes)} bytes.")
    print("\n\u2705 Model element demo complete!")

if __name__ == "__main__":
    main()
