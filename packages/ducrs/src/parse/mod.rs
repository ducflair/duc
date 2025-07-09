pub mod parse_duc_element;
pub mod parse_app_state;
pub mod parse_binary_files;
pub mod parse_renderer_state;
pub mod parse_duc_group;
pub mod parse_duc_block;

use flatbuffers::{self};
use std::collections::HashMap;

// Use explicit imports instead of glob imports to avoid ambiguity
use crate::types::DucFile;
use crate::generated::duc::*;


/// Parse a Duc flatbuffer binary into our Rust types
pub fn parse_duc_file(data: &[u8]) -> Result<DucFile, &'static str> {
    // Verify the buffer and get the root
    let exported_data = match flatbuffers::root::<ExportedDataState>(data) {
        Ok(root) => root,
        Err(_) => return Err("Invalid FlatBuffer data"),
    };
    
    // Parse elements
    let elements = if let Some(elements_fb) = exported_data.elements() {
        let mut result = Vec::with_capacity(elements_fb.len());
        for i in 0..elements_fb.len() {
            let element = elements_fb.get(i);
            
            if let Some(variant) = parse_duc_element::parse_duc_element(&element) {
                // Store the variant directly instead of extracting the base element
                result.push(variant);
            }
        }
        result
    } else {
        Vec::new()
    };
    
    // Parse app state
    let app_state = if let Some(app_state_fb) = exported_data.app_state() {
        Some(parse_app_state::parse_app_state(&app_state_fb))
    } else {
        None
    };
    
    // Parse binary files
    let (binary_files, _binary_data) = if let Some(files_fb) = exported_data.files() {
        let files = parse_binary_files::parse_binary_files(&files_fb);
        
        // Extract binary data for each file
        let mut binary_data = HashMap::new();
        
        if let Some(entries) = files_fb.entries() {
            for i in 0..entries.len() {
                // Get the entry directly without using Option
                let entry = entries.get(i);
                // Access value and key directly
                if let Some(key) = entry.key() {
                    if let Some(file_data) = entry.value() {
                        if let Some(data) = parse_binary_files::extract_binary_data(&file_data) {
                            binary_data.insert(key.to_string(), data);
                        }
                    }
                }
            }
        }
        
        (files, binary_data)
    } else {
        (HashMap::new(), HashMap::new())
    };
    
    // Parse renderer state
    let renderer_state = if let Some(renderer_state_fb) = exported_data.renderer_state() {
        Some(parse_renderer_state::parse_renderer_state(&renderer_state_fb))
    } else {
        None
    };
    
    // Parse blocks
    let blocks = if let Some(blocks_fb) = exported_data.blocks() {
        let mut result = Vec::with_capacity(blocks_fb.len());
        for i in 0..blocks_fb.len() {
            let block = blocks_fb.get(i);
            result.push(parse_duc_block::parse_duc_block(&block));
        }
        result
    } else {
        Vec::new()
    };

    // Parse groups
    let groups = if let Some(groups_fb) = exported_data.groups() {
        let mut result = Vec::with_capacity(groups_fb.len());
        for i in 0..groups_fb.len() {
            let group = groups_fb.get(i);
            result.push(parse_duc_group::parse_duc_group(group));
        }
        result
    } else {
        Vec::new()
    };

    // Get the version directly from exported_data
    let version = exported_data.version().unwrap_or("0.0.0").to_string();

    Ok(DucFile {
        elements,
        app_state,
        binary_files,
        renderer_state,
        blocks,
        groups,
        version,
    })
}