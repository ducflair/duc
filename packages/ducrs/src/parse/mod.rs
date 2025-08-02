pub mod parse_duc_block;
pub mod parse_duc_element;
pub mod parse_duc_group;
pub mod parse_external_files;
pub mod parse_state;

use crate::generated::duc::*;
use crate::types;
use flatbuffers::{self};

/// Parse a Duc flatbuffer binary into our Rust types
pub fn parse_duc_file(data: &[u8]) -> Result<types::ExportedDataState, &'static str> {
    let exported_data = flatbuffers::root::<ExportedDataState>(data)
        .map_err(|_| "Invalid FlatBuffer data")?;

    let elements = exported_data
        .elements()
        .map(|elements_fb| {
            elements_fb
                .iter()
                .filter_map(|el| parse_duc_element::parse_element_wrapper(&el))
                .collect()
        })
        .unwrap_or_else(Vec::new);

    let blocks = exported_data
        .blocks()
        .map(|blocks_fb| {
            blocks_fb
                .iter()
                .map(|block| parse_duc_block::parse_duc_block(&block))
                .collect()
        })
        .unwrap_or_else(Vec::new);

    let groups = exported_data
        .groups()
        .map(|groups_fb| {
            groups_fb
                .iter()
                .map(|group| parse_duc_group::parse_duc_group(group))
                .collect()
        })
        .unwrap_or_else(Vec::new);

    let duc_local_state = exported_data
        .duc_local_state()
        .map(|state| parse_state::parse_duc_local_state(&state))
        .unwrap();

    let duc_global_state = exported_data
        .duc_global_state()
        .map(|state| parse_state::parse_duc_global_state(&state))
        .unwrap();

    let external_files = exported_data
        .external_files()
        .map(|files_fb| {
            files_fb
                .iter()
                .map(|entry| parse_external_files::parse_duc_external_file_entry(&entry))
                .collect()
        })
        .unwrap_or_else(Vec::new);

    Ok(types::ExportedDataState {
        data_type: exported_data.type_().unwrap_or("").to_string(),
        source: exported_data.source().unwrap_or("").to_string(),
        version: exported_data.version().unwrap_or("").to_string(),
        thumbnail: exported_data.thumbnail().map(|v| v.to_vec()).unwrap_or_default(),
        dictionary: vec![], // Placeholder
        elements,
        blocks,
        groups,
        regions: vec![],   // Placeholder
        layers: vec![],    // Placeholder
        standards: vec![], // Placeholder
        duc_local_state,
        duc_global_state,
        external_files,
        version_graph: None, // Placeholder
    })
}