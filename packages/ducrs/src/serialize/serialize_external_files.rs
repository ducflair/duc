use flatbuffers::{self, FlatBufferBuilder, WIPOffset};
use std::collections::HashMap;

// Import the Rust DucExternalFileData type
use crate::types::*;

// Use the generated FlatBuffers code from the correct module
use crate::generated::duc::{
    DucExternalFileData as FbBinaryFileData, BinaryFileDataBuilder, 
    DucExternalFiles, BinaryFilesBuilder,
    BinaryFilesEntryBuilder
};

/// Serialize a DucExternalFileData to FlatBuffers
pub fn serialize_binary_file<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    file: &DucExternalFileData,
) -> WIPOffset<FbBinaryFileData<'a>> {
    let id = builder.create_string(&file.id);
    let mime_type = builder.create_string(&file.mime_type);
    
    // Create binary data vector if provided
    let data_vector = if let Some(binary_data) = &file.binary_data {
        builder.create_vector(binary_data.as_slice())
    } else {
        builder.create_vector(&[] as &[u8])
    };
    
    let mut file_builder = BinaryFileDataBuilder::new(builder);
    file_builder.add_id(id);
    file_builder.add_mime_type(mime_type);
    file_builder.add_created(file.created);
    
    if let Some(last_retrieved) = file.last_retrieved {
        file_builder.add_last_retrieved(last_retrieved);
    }
    
    file_builder.add_data(data_vector);
    
    file_builder.finish()
}

/// Serialize a collection of DucExternalFileData to FlatBuffers
pub fn serialize_binary_files<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    files: &HashMap<String, DucExternalFileData>,
) -> WIPOffset<DucExternalFiles<'a>> {
    let mut entries_vec = Vec::with_capacity(files.len());
    
    for (key, file) in files {
        let key_offset = builder.create_string(key);
        
        // Serialize the binary file
        let value = serialize_binary_file(builder, file);
        
        // Create entry
        let mut entry_builder = BinaryFilesEntryBuilder::new(builder);
        entry_builder.add_key(key_offset);
        entry_builder.add_value(value);
        
        entries_vec.push(entry_builder.finish());
    }
    
    let entries = builder.create_vector(&entries_vec);
    
    let mut files_builder = BinaryFilesBuilder::new(builder);
    files_builder.add_entries(entries);
    
    files_builder.finish()
} 