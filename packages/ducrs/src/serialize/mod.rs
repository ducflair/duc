pub mod serialize_duc_element;
pub mod serialize_app_state;
pub mod serialize_binary_files;
pub mod serialize_renderer_state;
pub mod serialize_duc_block;
pub mod serialize_duc_group;

use flatbuffers::{self, FlatBufferBuilder};
use crate::types::{mime_types, DucFile};
use std::error::Error;
use std::fmt;

// Use explicit imports instead of glob imports to avoid ambiguity
use crate::generated::duc::ExportedDataStateBuilder;
use crate::serialize::serialize_duc_block::serialize_duc_block;
use crate::serialize::serialize_duc_group::serialize_duc_group;

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

/// Serialize a Rust DucFile into a FlatBuffer binary
pub fn serialize_duc_file(file: &DucFile) -> Vec<u8> {
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
    
    // Serialize renderer state
    let renderer_state = if let Some(renderer_state) = &file.renderer_state {
        Some(serialize_renderer_state::serialize_renderer_state(&mut builder, renderer_state))
    } else {
        None
    };

    // Serialize blocks
    let blocks_offset = if !file.blocks.is_empty() {
        let mut blocks_vec = Vec::with_capacity(file.blocks.len());
        for block in &file.blocks {
            blocks_vec.push(serialize_duc_block(&mut builder, block));
        }
        Some(builder.create_vector(&blocks_vec))
    } else {
        None
    };

    // Serialize groups
    let groups_offset = if !file.groups.is_empty() {
        let mut groups_vec = Vec::with_capacity(file.groups.len());
        for group in &file.groups {
            groups_vec.push(serialize_duc_group(&mut builder, group));
        }
        Some(builder.create_vector(&groups_vec))
    } else {
        None
    };
    
    // Build the ExportedDataState
    let file_type = builder.create_string(mime_types::DUC);
    let source = builder.create_string("ducrs");
    let version = builder.create_string(&file.version);
    
    let mut exported_data_builder = ExportedDataStateBuilder::new(&mut builder);
    exported_data_builder.add_type_(file_type);
    exported_data_builder.add_version(version);
    exported_data_builder.add_source(source);
    
    if let Some(elements) = elements_vec {
        exported_data_builder.add_elements(elements);
    }
    
    if let Some(app_state_offset) = app_state {
        exported_data_builder.add_app_state(app_state_offset);
    }
    
    exported_data_builder.add_files(binary_files);
    
    if let Some(renderer_state_offset) = renderer_state {
        exported_data_builder.add_renderer_state(renderer_state_offset);
    }

    if let Some(blocks) = blocks_offset {
        exported_data_builder.add_blocks(blocks);
    }

    if let Some(groups) = groups_offset {
        exported_data_builder.add_groups(groups);
    }
    
    let exported_data = exported_data_builder.finish();
    
    // Finish the FlatBuffer and get the buffer
    builder.finish(exported_data, Some("DUC_"));
    let buffer = builder.finished_data().to_vec();
    
    buffer
}