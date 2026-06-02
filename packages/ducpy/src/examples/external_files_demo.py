"""
Example demonstrating the creation and management of external files within a DUC object.
"""

import ducpy as duc


def create_duc_with_external_files():
    """
    Creates a DUC object and adds multiple external file entries to it
    using the builder pattern.
    """
    print("Creating a DUC object with external files...")

    # Create dummy data for external files
    dummy_image_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0cIDATx\xda\xed\xc1\x01\x01\x00\x00\x00\xc2\xa0\xf7Om\x00\x00\x00\x00IEND\xaeB`\x82"
    dummy_pdf_data = b"%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Count 0>> endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n123\n%%EOF"

    image_file_entry = (duc.StateBuilder()
        .build_external_file()
        .with_key("my_image_key")
        .with_mime_type("image/png")
        .with_data(dummy_image_data)
        .build())

    pdf_file_entry = (duc.StateBuilder()
        .build_external_file()
        .with_key("document_123")
        .with_mime_type("application/pdf")
        .with_data(dummy_pdf_data)
        .build())

    global_state = (duc.StateBuilder()
        .build_global_state()
        .with_main_scope("mm")
        .build())

    local_state = (duc.StateBuilder()
        .build_local_state()
        .build())

    duc_object_files = {image_file_entry.id: image_file_entry, pdf_file_entry.id: pdf_file_entry}

    print("DUC object with external files created successfully!")
    print(f"Total external files: {len(duc_object_files)}")
    return duc_object_files, global_state, local_state


def main():
    """Run the external files demo."""
    print("External Files Demo")
    print("=" * 30)
    create_duc_with_external_files()
    print("\nExternal files demo complete!")


if __name__ == "__main__":
    main()
