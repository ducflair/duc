use flatbuffers::{self, FlatBufferBuilder, WIPOffset};
use std::collections::HashMap;

// Import the Rust BinaryFileData type
use crate::types::BinaryFileData;

// Use the generated FlatBuffers code from the correct module
use crate::duc_generated::duc::{
    BinaryFileData as FbBinaryFileData, BinaryFileDataBuilder, 
    BinaryFiles, BinaryFilesBuilder,
    BinaryFilesEntryBuilder
};

/// Parses a FlatBuffers BinaryFileData into our Rust BinaryFileData type
pub fn parse_binary_file(file_data: &FbBinaryFileData) -> BinaryFileData {
    let id = file_data.id().unwrap_or("").to_string();
    let mime_type = file_data.mime_type().unwrap_or("").to_string();
    let created = file_data.created();
    let last_retrieved = if file_data.last_retrieved() > 0 {
        Some(file_data.last_retrieved())
    } else {
        None
    };
    
    // Extract the binary data if it exists
    let binary_data = extract_binary_data(file_data);
    
    BinaryFileData {
        id,
        mime_type,
        created,
        encoding: None,
        last_retrieved,
        pending: false,
        status: "saved".to_string(),
        object_url: None,
        has_synced_to_server: true,
        saved_to_file_system: true,
        binary_data,
    }
}

/// Parses a collection of BinaryFiles from a FlatBuffers BinaryFiles table
pub fn parse_binary_files(files: &BinaryFiles) -> HashMap<String, BinaryFileData> {
    let mut result = HashMap::new();
    
    if let Some(entries) = files.entries() {
        for i in 0..entries.len() {
            let entry = entries.get(i);
            if let (Some(key), Some(file_data)) = (entry.key(), entry.value()) {
                let binary_file = parse_binary_file(&file_data);
                result.insert(key.to_string(), binary_file);
            }
        }
    }
    
    result
}

/// Serialize a BinaryFileData to FlatBuffers
pub fn serialize_binary_file<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    file: &BinaryFileData,
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

/// Serialize a collection of BinaryFileData to FlatBuffers
pub fn serialize_binary_files<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    files: &HashMap<String, BinaryFileData>,
) -> WIPOffset<BinaryFiles<'a>> {
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

/// Extracts binary data from a FlatBuffers BinaryFileData
pub fn extract_binary_data(file_data: &FbBinaryFileData) -> Option<Vec<u8>> {
    if let Some(data) = file_data.data() {
        let bytes = data.bytes();
        if !bytes.is_empty() {
            return Some(bytes.to_vec());
        }
    }
    None
}

/// Function to create a Data URL from binary data and mime type
pub fn create_data_url(binary_data: &[u8], mime_type: &str) -> String {
    use base64::{Engine as _, engine::general_purpose};
    
    let encoded = general_purpose::STANDARD.encode(binary_data);
    format!("data:{};base64,{}", mime_type, encoded)
}

/// Helper function to get a binary file by ID from a collection
pub fn find_binary_file_by_id<'a>(
    files: &'a BinaryFiles,
    id: &str,
) -> Option<FbBinaryFileData<'a>> {
    if let Some(entries) = files.entries() {
        for i in 0..entries.len() {
            let entry = entries.get(i);
            if let Some(key) = entry.key() {
                if key == id {
                    return entry.value();
                }
            }
        }
    }
    None
} 