use crate::generated::duc::{DucBlock as FbDucBlock};
use crate::types::{DucBlock, DucBlockAttribute, DucBlockAttributeDetails, SimplePoint};
use super::parse_duc_element;

pub fn parse_duc_block(
    block_fb: &FbDucBlock,
) -> DucBlock {
    let id = block_fb.id().unwrap_or("").to_string();
    let label = block_fb.label().unwrap_or("").to_string();
    let description = block_fb.description().unwrap_or("").to_string();
    let version = block_fb.version();

    // Parse elements
    let elements = if let Some(elements_fb) = block_fb.elements() {
        let mut result = Vec::with_capacity(elements_fb.len());
        for i in 0..elements_fb.len() {
            let element = elements_fb.get(i);
            if let Some(variant) = parse_duc_element::parse_duc_element(&element) {
                result.push(variant);
            }
        }
        result
    } else {
        Vec::new()
    };

    // Parse attributes
    let attributes = if let Some(attributes_fb) = block_fb.attributes() {
        let mut result = Vec::with_capacity(attributes_fb.len());
        for i in 0..attributes_fb.len() {
            let attr = attributes_fb.get(i);
            let name = attr.name().unwrap_or("").to_string();
            let details = if let Some(details_fb) = attr.details() {
                DucBlockAttributeDetails {
                    tag: details_fb.tag().unwrap_or("").to_string(),
                    default_value: details_fb.default_value().unwrap_or("").to_string(),
                    prompt: details_fb.prompt().unwrap_or("").to_string(),
                    position: if let Some(pos) = details_fb.position() {
                        SimplePoint {
                            x: pos.x(),
                            y: pos.y(),
                        }
                    } else {
                        SimplePoint { x: 0.0, y: 0.0 }
                    },
                }
            } else {
                DucBlockAttributeDetails {
                    tag: "".to_string(),
                    default_value: "".to_string(),
                    prompt: "".to_string(),
                    position: SimplePoint { x: 0.0, y: 0.0 },
                }
            };

            result.push(DucBlockAttribute { name, details });
        }
        result
    } else {
        Vec::new()
    };

    DucBlock {
        id,
        label,
        description,
        version,
        elements,
        attributes,
    }
}