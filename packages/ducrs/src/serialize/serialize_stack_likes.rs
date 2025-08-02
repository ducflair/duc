use flatbuffers::{self, FlatBufferBuilder, WIPOffset};
use crate::generated::duc::{
    _DucStackBase as FbDucStackBase, _DucStackBaseBuilder, DucGroup as FbDucGroup,
    DucGroupBuilder, DucLayer as FbDucLayer, DucLayerBuilder,
    DucLayerOverrides as FbDucLayerOverrides, DucLayerOverridesBuilder,
    DucRegion as FbDucRegion, DucRegionBuilder, DucStackLikeStyles as FbDucStackLikeStyles,
    DucStackLikeStylesBuilder,
};
use crate::types::{DucGroup, DucLayer, DucRegion, DucStackBase, DucStackLikeStyles, DucLayerOverrides};

use super::serialize_duc_element_utils::{
    serialize_element_background, serialize_element_stroke,
};

pub fn serialize_duc_group<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    group: &DucGroup,
) -> WIPOffset<FbDucGroup<'a>> {
    let id = builder.create_string(&group.id);
    let stack_base = serialize_duc_stack_base(builder, &group.stack_base);

    let mut group_builder = DucGroupBuilder::new(builder);
    group_builder.add_id(id);
    group_builder.add_stack_base(stack_base);
    group_builder.finish()
}

pub fn serialize_duc_region<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    region: &DucRegion,
) -> WIPOffset<FbDucRegion<'a>> {
    let id = builder.create_string(&region.id);
    let stack_base = serialize_duc_stack_base(builder, &region.stack_base);

    let mut region_builder = DucRegionBuilder::new(builder);
    region_builder.add_id(id);
    region_builder.add_stack_base(stack_base);

    if let Some(bool_op) = region.boolean_operation {
        region_builder.add_boolean_operation(bool_op);
    }

    region_builder.finish()
}

pub fn serialize_duc_layer<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    layer: &DucLayer,
) -> WIPOffset<FbDucLayer<'a>> {
    let id = builder.create_string(&layer.id);
    let stack_base = serialize_duc_stack_base(builder, &layer.stack_base);
    let overrides = serialize_duc_layer_overrides(builder, &layer.overrides);

    let mut layer_builder = DucLayerBuilder::new(builder);
    layer_builder.add_id(id);
    layer_builder.add_stack_base(stack_base);
    layer_builder.add_readonly(layer.readonly);
    layer_builder.add_overrides(overrides);
    layer_builder.finish()
}

fn serialize_duc_stack_base<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    stack_base: &DucStackBase,
) -> WIPOffset<FbDucStackBase<'a>> {
    let label = builder.create_string(&stack_base.label);
    let description = builder.create_string(&stack_base.description);
    let styles = serialize_duc_stack_like_styles(builder, &stack_base.styles);

    let mut stack_base_builder = _DucStackBaseBuilder::new(builder);
    stack_base_builder.add_label(label);
    stack_base_builder.add_description(description);
    stack_base_builder.add_is_collapsed(stack_base.is_collapsed);
    stack_base_builder.add_is_plot(stack_base.is_plot);
    stack_base_builder.add_is_visible(stack_base.is_visible);
    stack_base_builder.add_locked(stack_base.locked);
    stack_base_builder.add_styles(styles);
    stack_base_builder.finish()
}

pub fn serialize_duc_stack_like_styles<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    styles: &DucStackLikeStyles,
) -> WIPOffset<FbDucStackLikeStyles<'a>> {
    let labeling_color = builder.create_string(&styles.labeling_color);

    let mut styles_builder = DucStackLikeStylesBuilder::new(builder);
    styles_builder.add_opacity(styles.opacity);
    styles_builder.add_labeling_color(labeling_color);
    styles_builder.finish()
}

fn serialize_duc_layer_overrides<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    overrides: &DucLayerOverrides,
) -> WIPOffset<FbDucLayerOverrides<'a>> {
    let stroke = serialize_element_stroke(builder, &overrides.stroke);
    let background = serialize_element_background(builder, &overrides.background);

    let mut overrides_builder = DucLayerOverridesBuilder::new(builder);
    overrides_builder.add_stroke(stroke);
    overrides_builder.add_background(background);
    overrides_builder.finish()
}
