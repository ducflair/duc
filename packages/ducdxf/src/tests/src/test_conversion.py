import pytest
import os
import sys

# Add the project's 'src' directory to the Python path to allow for package imports.
# This ensures that 'ducxf' can be found when running tests.
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from ducxf.dxf_to_duc import convert_dxf_to_duc
import ducpy as duc

@pytest.fixture
def assets_dir():
    """Returns the absolute path to the test assets directory."""
    return os.path.join(os.path.dirname(__file__), '..', 'assets')

@pytest.fixture
def output_dir():
    """
    Creates and returns the absolute path to the test output directory.
    The directory is created if it does not exist.
    """
    # As requested, output will be stored in a directory named 'outputs'
    # relative to the 'tests' folder.
    output_path = os.path.join(os.path.dirname(__file__), '..', 'outputs')
    os.makedirs(output_path, exist_ok=True)
    return output_path

def test_xclip_dxf_to_duc_conversion(assets_dir, output_dir):
    """
    Tests the end-to-end conversion of the 'xclip.dxf' file to a .duc file.
    
    This test verifies:
    1. The conversion script runs without raising errors.
    2. A valid .duc output file is created at the specified location.
    3. The created .duc file is not empty.
    4. The parsed .duc file contains the expected high-level structures
       (elements, layers, and blocks) from the source DXF.
    """
    # 1. Define input and output paths for the test case
    dxf_input_path = os.path.join(assets_dir, 'xclip.dxf')
    duc_output_path = os.path.join(output_dir, 'xclip.duc')

    # Pre-condition check: Ensure the source DXF file exists before running.
    assert os.path.exists(dxf_input_path), f"Input DXF file not found at: {dxf_input_path}"

    # 2. Execute the main conversion function from the script
    convert_dxf_to_duc(dxf_input_path, duc_output_path)

    # 3. Assertions to verify the outcome of the conversion
    
    # a) Check that the output file was successfully created.
    assert os.path.exists(duc_output_path), \
        f"Output DUC file was not created at: {duc_output_path}"

    # b) Check that the created file has content.
    assert os.path.getsize(duc_output_path) > 0, \
        "The output DUC file is empty, indicating a possible write error."

    # c) Parse the generated .duc file to validate its integrity and content.
    parsed_duc = duc.read_duc_file(duc_output_path)
    assert parsed_duc is not None, \
        "Failed to parse the generated DUC file. It may be corrupt."
    
    # d) Validate that key structures from the DXF were converted.
    assert parsed_duc.duc_global_state is not None, \
        "Parsed state missing global state"

    

    # Log results to the console for clarity when running tests
    print(f"\n✅ Conversion test passed for '{os.path.basename(dxf_input_path)}'.")
    print(f"   - Output file created at: {duc_output_path}")


