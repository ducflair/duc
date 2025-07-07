pub mod serialize_duc_element;
pub mod serialize_app_state;
pub mod serialize_binary_files;

use flatbuffers::{self, FlatBufferBuilder};
use crate::types::DucFile;
use std::error::Error;
use std::fmt;
// Removed file system and regex related imports for runtime parsing

// Use explicit imports instead of glob imports to avoid ambiguity
use crate::generated::duc::ExportedDataStateBuilder;
use crate::mime_types;

// Define error type for serialization errors
#[derive(Debug)]
pub struct SerializationError {
    message: String,
}

impl SerializationError {
    pub fn new(message: &str) -> Self {
        SerializationError {
            message: message.to_string(),
        }
    }
}

impl fmt::Display for SerializationError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Serialization error: {}", self.message)
    }
}

impl Error for SerializationError {}

// Define a default schema version (non-const approach to avoid parse in const)
fn get_schema_version() -> String {
    // Get the schema version from the environment variable set at build time
    env!("DUC_SCHEMA_VERSION").to_string()
}

/// Serialize a Rust DucFile into a FlatBuffer binary
pub fn serialize_duc_file(file: &DucFile) -> Result<Vec<u8>, Box<dyn Error>> {
    // Create a new FlatBufferBuilder with a reasonable initial size
    let mut builder = FlatBufferBuilder::with_capacity(1024 * 1024);
    
    // Serialize elements
    let elements_vec = if !file.elements.is_empty() {
        let mut elements = Vec::with_capacity(file.elements.len());
        
        for element in &file.elements {
            let element_offset = serialize_duc_element::serialize_duc_element(&mut builder, element);
            elements.push(element_offset);
        }
        
        Some(builder.create_vector(&elements))
    } else {
        None
    };
    
    // Serialize app state
    let app_state = if let Some(app_state) = &file.app_state {
        Some(serialize_app_state::serialize_app_state(&mut builder, app_state))
    } else {
        None
    };
    
    // Serialize binary files
    let binary_files = serialize_binary_files::serialize_binary_files(&mut builder, &file.binary_files);
    
    // Build the ExportedDataState
    let file_type = builder.create_string(mime_types::DUC);
    let source = builder.create_string("duc-rs");
    
    let version_string = builder.create_string(&get_schema_version());
    
    let mut exported_data_builder = ExportedDataStateBuilder::new(&mut builder);
    exported_data_builder.add_type_(file_type);
    exported_data_builder.add_version(version_string);
    exported_data_builder.add_source(source);
    
    if let Some(elements) = elements_vec {
        exported_data_builder.add_elements(elements);
    }
    
    if let Some(app_state_offset) = app_state {
        exported_data_builder.add_app_state(app_state_offset);
    }
    
    exported_data_builder.add_files(binary_files);
    
    let exported_data = exported_data_builder.finish();
    
    // Finish the FlatBuffer and get the buffer
    builder.finish(exported_data, None);
    let buffer = builder.finished_data().to_vec();
    
    Ok(buffer)
}