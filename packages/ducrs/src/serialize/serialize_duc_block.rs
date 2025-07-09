use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::generated::duc::{DucBlock as FbDucBlock, DucBlockBuilder, DucBlockAttribute as FbDucBlockAttribute, DucBlockAttributeBuilder, DucBlockAttributeDetails as FbDucBlockAttributeDetails, DucBlockAttributeDetailsBuilder};
use crate::types::{DucBlock, DucBlockAttribute, DucBlockAttributeDetails};
use super::serialize_duc_element::serialize_duc_element;

pub fn serialize_duc_block<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    block: &DucBlock,
) -> WIPOffset<FbDucBlock<'a>> {
    let id = builder.create_string(&block.id);
    let label = builder.create_string(&block.label);
    let description = builder.create_string(&block.description);

    let elements = if !block.elements.is_empty() {
        let mut elements_vec = Vec::with_capacity(block.elements.len());
        for element in &block.elements {
            elements_vec.push(serialize_duc_element(builder, element));
        }
        Some(builder.create_vector(&elements_vec))
    } else {
        None
    };

    let attributes = if !block.attributes.is_empty() {
        let mut attributes_vec = Vec::with_capacity(block.attributes.len());
        for attribute in &block.attributes {
            attributes_vec.push(serialize_duc_block_attribute(builder, attribute));
        }
        Some(builder.create_vector(&attributes_vec))
    } else {
        None
    };

    let mut block_builder = DucBlockBuilder::new(builder);
    block_builder.add_id(id);
    block_builder.add_label(label);
    block_builder.add_description(description);
    block_builder.add_version(block.version);

    if let Some(elements_offset) = elements {
        block_builder.add_elements(elements_offset);
    }
    if let Some(attributes_offset) = attributes {
        block_builder.add_attributes(attributes_offset);
    }

    block_builder.finish()
}

pub fn serialize_duc_block_attribute<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    attribute: &DucBlockAttribute,
) -> WIPOffset<FbDucBlockAttribute<'a>> {
    let name = builder.create_string(&attribute.name);
    let details = serialize_duc_block_attribute_details(builder, &attribute.details);

    let mut attribute_builder = DucBlockAttributeBuilder::new(builder);
    attribute_builder.add_name(name);
    attribute_builder.add_details(details);
    attribute_builder.finish()
}

pub fn serialize_duc_block_attribute_details<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    details: &DucBlockAttributeDetails,
) -> WIPOffset<FbDucBlockAttributeDetails<'a>> {
    let tag = builder.create_string(&details.tag);
    let default_value = builder.create_string(&details.default_value);
    let prompt = builder.create_string(&details.prompt);
    let position = super::serialize_duc_element::serialize_simple_point(builder, &details.position);

    let mut details_builder = DucBlockAttributeDetailsBuilder::new(builder);
    details_builder.add_tag(tag);
    details_builder.add_default_value(default_value);
    details_builder.add_prompt(prompt);
    details_builder.add_position(position);
    details_builder.finish()
} 