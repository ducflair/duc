pub mod serialize_duc_block;
pub mod serialize_duc_element;
pub mod serialize_duc_element_utils;
pub mod serialize_external_files;
pub mod serialize_stack_likes;
pub mod serialize_standards;
pub mod serialize_state;
pub mod serialize_version_control;

use crate::generated::duc::{DictionaryEntryBuilder, ExportedDataStateBuilder};
use crate::serialize::serialize_duc_block::serialize_duc_block;
use crate::serialize::serialize_stack_likes::{
    serialize_duc_group, serialize_duc_layer, serialize_duc_region,
};
use crate::serialize::serialize_standards::serialize_standard;
use crate::types::ExportedDataState;
use flatbuffers::{self, FlatBufferBuilder};
use std::error::Error;
use std::fmt;

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

/// Serialize a Rust ExportedDataState into a FlatBuffer binary
pub fn serialize_duc_file(file: &ExportedDataState) -> Vec<u8> {
    // Create a new FlatBufferBuilder with a reasonable initial size
    let mut builder = FlatBufferBuilder::with_capacity(1024 * 1024);

    let type_ = builder.create_string(&file.data_type);
    let source = builder.create_string(&file.source);
    let version = builder.create_string(&file.version);
    let thumbnail = builder.create_vector(&file.thumbnail);

    let dictionary_offsets: Vec<_> = file
        .dictionary
        .iter()
        .map(|entry| {
            let key = builder.create_string(&entry.key);
            let value = builder.create_string(&entry.value);
            let mut dictionary_entry_builder = DictionaryEntryBuilder::new(&mut builder);
            dictionary_entry_builder.add_key(key);
            dictionary_entry_builder.add_value(value);
            dictionary_entry_builder.finish()
        })
        .collect();
    let dictionary = builder.create_vector(&dictionary_offsets);

    let elements_offsets: Vec<_> = file
        .elements
        .iter()
        .map(|el| serialize_duc_element::serialize_element_wrapper(&mut builder, el))
        .collect();
    let elements = builder.create_vector(&elements_offsets);

    let blocks_offsets: Vec<_> = file
        .blocks
        .iter()
        .map(|block| serialize_duc_block(&mut builder, block))
        .collect();
    let blocks = builder.create_vector(&blocks_offsets);

    let groups_offsets: Vec<_> = file
        .groups
        .iter()
        .map(|group| serialize_duc_group(&mut builder, group))
        .collect();
    let groups = builder.create_vector(&groups_offsets);

    let regions_offsets: Vec<_> = file
        .regions
        .iter()
        .map(|region| serialize_duc_region(&mut builder, region))
        .collect();
    let regions = builder.create_vector(&regions_offsets);

    let layers_offsets: Vec<_> = file
        .layers
        .iter()
        .map(|layer| serialize_duc_layer(&mut builder, layer))
        .collect();
    let layers = builder.create_vector(&layers_offsets);

    let standards_offsets: Vec<_> = file
        .standards
        .iter()
        .map(|standard| serialize_standard(&mut builder, standard))
        .collect();
    let standards = builder.create_vector(&standards_offsets);

    let duc_local_state =
        serialize_state::serialize_duc_local_state(&mut builder, &file.duc_local_state);
    let duc_global_state =
        serialize_state::serialize_duc_global_state(&mut builder, &file.duc_global_state);

    let external_files_offsets: Vec<_> = file
        .external_files
        .iter()
        .map(|entry| {
            serialize_external_files::serialize_duc_external_file_entry(&mut builder, entry)
        })
        .collect();
    let external_files = builder.create_vector(&external_files_offsets);

    let version_graph = file.version_graph.as_ref().map(|graph| {
        serialize_version_control::serialize_version_graph(&mut builder, graph)
    });

    let mut exported_data_builder = ExportedDataStateBuilder::new(&mut builder);
    exported_data_builder.add_type_(type_);
    exported_data_builder.add_source(source);
    exported_data_builder.add_version(version);
    exported_data_builder.add_thumbnail(thumbnail);
    exported_data_builder.add_dictionary(dictionary);
    exported_data_builder.add_elements(elements);
    exported_data_builder.add_blocks(blocks);
    exported_data_builder.add_groups(groups);
    exported_data_builder.add_regions(regions);
    exported_data_builder.add_layers(layers);
    exported_data_builder.add_standards(standards);
    exported_data_builder.add_duc_local_state(duc_local_state);
    exported_data_builder.add_duc_global_state(duc_global_state);
    exported_data_builder.add_external_files(external_files);
    if let Some(graph) = version_graph {
        exported_data_builder.add_version_graph(graph);
    }

    let exported_data = exported_data_builder.finish();

    // Finish the FlatBuffer and get the buffer
    builder.finish(exported_data, Some("DUC_"));
    let buffer = builder.finished_data().to_vec();

    buffer
}