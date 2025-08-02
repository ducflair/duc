use super::serialize_duc_element::serialize_element_wrapper;
use crate::generated::duc::{
    self as fb, DucBlock as FbDucBlock, DucBlockAttributeDefinitionBuilder,
    DucBlockAttributeDefinitionEntryBuilder, DucBlockBuilder,
};
use crate::types;
use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

pub fn serialize_duc_block<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    block: &types::DucBlock,
) -> WIPOffset<FbDucBlock<'a>> {
    let id = builder.create_string(&block.id);
    let label = builder.create_string(&block.label);
    let description = builder.create_string(&block.description);
    
    // Serialize elements first
    let element_offsets: Vec<_> = block
        .elements
        .iter()
        .map(|element| serialize_element_wrapper(builder, element))
        .collect();
    let elements = builder.create_vector(&element_offsets);
    
    // Serialize attribute definitions
    let attr_offsets: Vec<_> = block
        .attribute_definitions
        .iter()
        .map(|attr_entry| serialize_duc_block_attribute_definition_entry(builder, attr_entry))
        .collect();
    let attribute_definitions = builder.create_vector(&attr_offsets);

    let mut block_builder = DucBlockBuilder::new(builder);
    block_builder.add_id(id);
    block_builder.add_label(label);
    block_builder.add_description(description);
    block_builder.add_version(block.version);
    block_builder.add_elements(elements);
    block_builder.add_attribute_definitions(attribute_definitions);
    block_builder.finish()
}

fn serialize_duc_block_attribute_definition_entry<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    entry: &types::DucBlockAttributeDefinitionEntry,
) -> WIPOffset<fb::DucBlockAttributeDefinitionEntry<'a>> {
    let key = builder.create_string(&entry.key);
    let value = serialize_duc_block_attribute_definition(builder, &entry.value);

    let mut entry_builder = DucBlockAttributeDefinitionEntryBuilder::new(builder);
    entry_builder.add_key(key);
    entry_builder.add_value(value);
    entry_builder.finish()
}

fn serialize_duc_block_attribute_definition<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    definition: &types::DucBlockAttributeDefinition,
) -> WIPOffset<fb::DucBlockAttributeDefinition<'a>> {
    let tag = builder.create_string(&definition.tag);
    let prompt = builder.create_string(&definition.prompt);
    let default_value = builder.create_string(&definition.default_value);

    let mut definition_builder = DucBlockAttributeDefinitionBuilder::new(builder);
    definition_builder.add_tag(tag);
    definition_builder.add_prompt(prompt);
    definition_builder.add_default_value(default_value);
    definition_builder.add_is_constant(definition.is_constant);
    definition_builder.finish()
}
