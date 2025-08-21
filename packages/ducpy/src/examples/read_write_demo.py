"""
Example demonstrating the reading and writing of DUC objects to binary files.
"""

import ducpy as duc
from a_duc_creation_demo import create_sample_duc_object # Re-use the creation function
import os
import io
from ducpy.utils.io import write_duc_file, read_duc_file

OUTPUT_FILE = "output_duc_file.bin"

def demonstrate_read_write():
    """
    Creates a sample DUC object, serializes it to a binary file,
    and then parses it back from the file.
    """
    print("Demonstrating DUC object read/write...")

    # 1. Create a sample DUC object
    original_duc = create_sample_duc_object()
    print(f"Original DUC object elements: {len(original_duc.elements)}")

    # 2. Serialize the DUC object to a binary file using ducpy.utils.io.write_duc_file
    print(f"Serializing DUC object to {OUTPUT_FILE} using ducpy.utils.io.write_duc_file...")
    write_duc_file(
        file_path=OUTPUT_FILE,
        name="sample_duc",
        elements=original_duc.elements,
        standards=original_duc.standards,
        duc_global_state=original_duc.duc_global_state,
        duc_local_state=original_duc.duc_local_state,
        external_files=original_duc.files
    )
    print(f"Successfully serialized to {OUTPUT_FILE}")

    # 3. Parse the DUC object back from the binary file using ducpy.utils.io.read_duc_file
    print(f"Parsing DUC object from {OUTPUT_FILE} using ducpy.utils.io.read_duc_file...")
    parsed_duc = read_duc_file(OUTPUT_FILE)

    print("Successfully parsed DUC object!")
    print(f"Parsed DUC object elements: {len(parsed_duc.elements)}")
    print(f"Parsed DUC global state scope: {parsed_duc.duc_global_state.main_scope}")

    # 4. Verify some properties (optional, but good for testing)
    assert len(original_duc.elements) == len(parsed_duc.elements)
    assert original_duc.duc_global_state.main_scope == parsed_duc.duc_global_state.main_scope
    print("Verification successful: Original and parsed DUC objects match key properties.")

    # Clean up the created file
    os.remove(OUTPUT_FILE)
    print(f"Cleaned up: {OUTPUT_FILE}")

    print("\nRead/Write demo complete!")

if __name__ == "__main__":
    demonstrate_read_write()
