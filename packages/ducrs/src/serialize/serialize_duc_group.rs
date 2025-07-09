use flatbuffers::{self, FlatBufferBuilder, WIPOffset};
use crate::generated::duc::{DucGroup as FbDucGroup, DucGroupBuilder};
use crate::types::DucGroup;
use super::serialize_duc_element::{serialize_element_background, serialize_element_stroke};

pub fn serialize_duc_group<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    group: &DucGroup,
) -> WIPOffset<FbDucGroup<'a>> {
    let id = builder.create_string(&group.id);
    let label = builder.create_string(&group.label);
    let description = if let Some(desc) = &group.description {
        Some(builder.create_string(desc))
    } else {
        None
    };
    let labeling_color = builder.create_string(&group.labeling_color);

    let stroke_override = if let Some(stroke) = &group.stroke_override {
        Some(serialize_element_stroke(builder, stroke))
    } else {
        None
    };

    let background_override = if let Some(background) = &group.background_override {
        Some(serialize_element_background(builder, background))
    } else {
        None
    };

    let mut group_builder = DucGroupBuilder::new(builder);
    group_builder.add_id(id);
    group_builder.add_label(label);
    group_builder.add_is_collapsed(group.is_collapsed);
    if let Some(desc) = description {
        group_builder.add_description(desc);
    }
    group_builder.add_no_plot(group.no_plot);
    group_builder.add_locked(group.locked);
    group_builder.add_is_visible(group.is_visible);
    group_builder.add_opacity(group.opacity);
    group_builder.add_labeling_color(labeling_color);

    if let Some(stroke) = stroke_override {
        group_builder.add_stroke_override(stroke);
    }
    if let Some(background) = background_override {
        group_builder.add_background_override(background);
    }
    group_builder.add_clip(group.clip);

    group_builder.finish()
} 