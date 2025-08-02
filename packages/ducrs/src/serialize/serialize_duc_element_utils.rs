use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::generated::duc::{
    _DucElementStylesBase as FbDucElementStylesBase, _DucElementStylesBaseBuilder,
    _DucElementBase as FbDucElementBase, _DucElementBaseBuilder,
    BoundElement as FbBoundElement, BoundElementBuilder,
    CustomHatchPattern as FbCustomHatchPattern, CustomHatchPatternBuilder,
    DucHatchStyle as FbDucHatchStyle, DucHatchStyleBuilder, DucHead as FbDucHead, DucHeadBuilder,
    DucImageFilter as FbDucImageFilter, DucImageFilterBuilder, DucPoint as FbDucPoint,
    ElementBackground as FbElementBackground, ElementBackgroundBuilder,
    ElementContentBase as FbElementContentBase, ElementContentBaseBuilder,
    ElementStroke as FbElementStroke, ElementStrokeBuilder, HatchPatternLine as FbHatchPatternLine,
    HatchPatternLineBuilder, LineSpacing as FbLineSpacing, LineSpacingBuilder,
    StrokeSides as FbStrokeSides, StrokeSidesBuilder, StrokeStyle as FbStrokeStyle,
    StrokeStyleBuilder, TilingProperties as FbTilingProperties, TilingPropertiesBuilder,
};
use crate::types::{
    CustomHatchPattern, DucElementStylesBase, DucHatchStyle, DucHead, DucImageFilter, DucPoint,
    ElementBackground, ElementContentBase, ElementStroke, HatchPatternLine, LineSpacing,
    StrokeSides, StrokeStyle, TilingProperties, DucElementBase, BoundElement,
};

pub fn serialize_duc_element_styles_base<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    styles: &DucElementStylesBase,
) -> WIPOffset<FbDucElementStylesBase<'a>> {
    // Serialize background elements first
    let mut background_offsets = Vec::new();
    for bg in &styles.background {
        background_offsets.push(serialize_element_background(builder, bg));
    }
    let background = builder.create_vector(&background_offsets);
    
    // Serialize stroke elements first
    let mut stroke_offsets = Vec::new();
    for s in &styles.stroke {
        stroke_offsets.push(serialize_element_stroke(builder, s));
    }
    let stroke = builder.create_vector(&stroke_offsets);

    let mut styles_builder = _DucElementStylesBaseBuilder::new(builder);
    styles_builder.add_roundness(styles.roundness);
    if let Some(blending) = styles.blending {
        styles_builder.add_blending(blending);
    }
    styles_builder.add_background(background);
    styles_builder.add_stroke(stroke);
    styles_builder.add_opacity(styles.opacity);
    styles_builder.finish()
}

pub fn serialize_element_background<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    background: &ElementBackground,
) -> WIPOffset<FbElementBackground<'a>> {
    let content = serialize_element_content_base(builder, &background.content);
    let mut background_builder = ElementBackgroundBuilder::new(builder);
    background_builder.add_content(content);
    background_builder.finish()
}

pub fn serialize_element_stroke<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    stroke: &ElementStroke,
) -> WIPOffset<FbElementStroke<'a>> {
    let content = serialize_element_content_base(builder, &stroke.content);
    let style = serialize_stroke_style(builder, &stroke.style);
    let stroke_sides = serialize_stroke_sides(builder, &stroke.stroke_sides);

    let mut stroke_builder = ElementStrokeBuilder::new(builder);
    stroke_builder.add_content(content);
    stroke_builder.add_width(stroke.width);
    stroke_builder.add_style(style);
    if let Some(placement) = stroke.placement {
        stroke_builder.add_placement(placement);
    }
    stroke_builder.add_stroke_sides(stroke_sides);
    stroke_builder.finish()
}

pub fn serialize_element_content_base<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    content: &ElementContentBase,
) -> WIPOffset<FbElementContentBase<'a>> {
    let src = builder.create_string(&content.src);
    let tiling = serialize_tiling_properties(builder, &content.tiling);
    let hatch = serialize_duc_hatch_style(builder, &content.hatch);
    let image_filter = serialize_duc_image_filter(builder, &content.image_filter);

    let mut content_builder = ElementContentBaseBuilder::new(builder);
    if let Some(preference) = content.preference {
        content_builder.add_preference(preference);
    }
    content_builder.add_src(src);
    content_builder.add_visible(content.visible);
    content_builder.add_opacity(content.opacity);
    content_builder.add_tiling(tiling);
    content_builder.add_hatch(hatch);
    content_builder.add_image_filter(image_filter);
    content_builder.finish()
}

pub fn serialize_stroke_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &StrokeStyle,
) -> WIPOffset<FbStrokeStyle<'a>> {
    let dash = builder.create_vector(&style.dash);
    let dash_line_override = builder.create_string(&style.dash_line_override);

    let mut style_builder = StrokeStyleBuilder::new(builder);
    if let Some(preference) = style.preference {
        style_builder.add_preference(preference);
    }
    if let Some(cap) = style.cap {
        style_builder.add_cap(cap);
    }
    if let Some(join) = style.join {
        style_builder.add_join(join);
    }
    style_builder.add_dash(dash);
    style_builder.add_dash_line_override(dash_line_override);
    if let Some(dash_cap) = style.dash_cap {
        style_builder.add_dash_cap(dash_cap);
    }
    if let Some(miter_limit) = style.miter_limit {
        style_builder.add_miter_limit(miter_limit);
    }
    style_builder.finish()
}

pub fn serialize_stroke_sides<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    sides: &StrokeSides,
) -> WIPOffset<FbStrokeSides<'a>> {
    let values = builder.create_vector(&sides.values);

    let mut sides_builder = StrokeSidesBuilder::new(builder);
    if let Some(preference) = sides.preference {
        sides_builder.add_preference(preference);
    }
    sides_builder.add_values(values);
    sides_builder.finish()
}

pub fn serialize_tiling_properties<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    tiling: &TilingProperties,
) -> WIPOffset<FbTilingProperties<'a>> {
    let mut tiling_builder = TilingPropertiesBuilder::new(builder);
    tiling_builder.add_size_in_percent(tiling.size_in_percent);
    tiling_builder.add_angle(tiling.angle);
    if let Some(spacing) = tiling.spacing {
        tiling_builder.add_spacing(spacing);
    }
    if let Some(offset_x) = tiling.offset_x {
        tiling_builder.add_offset_x(offset_x);
    }
    if let Some(offset_y) = tiling.offset_y {
        tiling_builder.add_offset_y(offset_y);
    }
    tiling_builder.finish()
}

pub fn serialize_duc_hatch_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    hatch: &DucHatchStyle,
) -> WIPOffset<FbDucHatchStyle<'a>> {
    let pattern_name = builder.create_string(&hatch.pattern_name);
    let pattern_origin = serialize_duc_point(builder, &hatch.pattern_origin);
    let custom_pattern = serialize_custom_hatch_pattern(builder, &hatch.custom_pattern);

    let mut hatch_builder = DucHatchStyleBuilder::new(builder);
    if let Some(hatch_style) = hatch.hatch_style {
        hatch_builder.add_hatch_style(hatch_style);
    }
    hatch_builder.add_pattern_name(pattern_name);
    hatch_builder.add_pattern_scale(hatch.pattern_scale);
    hatch_builder.add_pattern_angle(hatch.pattern_angle);
    hatch_builder.add_pattern_origin(pattern_origin);
    hatch_builder.add_pattern_double(hatch.pattern_double);
    hatch_builder.add_custom_pattern(custom_pattern);
    hatch_builder.finish()
}

pub fn serialize_duc_image_filter<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    filter: &DucImageFilter,
) -> WIPOffset<FbDucImageFilter<'a>> {
    let mut filter_builder = DucImageFilterBuilder::new(builder);
    filter_builder.add_brightness(filter.brightness);
    filter_builder.add_contrast(filter.contrast);
    filter_builder.finish()
}

pub fn serialize_custom_hatch_pattern<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    pattern: &CustomHatchPattern,
) -> WIPOffset<FbCustomHatchPattern<'a>> {
    let name = builder.create_string(&pattern.name);
    let description = builder.create_string(&pattern.description);
    let lines = builder.create_vector(
        &pattern
            .lines
            .iter()
            .map(|line| serialize_hatch_pattern_line(builder, line))
            .collect::<Vec<_>>(),
    );

    let mut pattern_builder = CustomHatchPatternBuilder::new(builder);
    pattern_builder.add_name(name);
    pattern_builder.add_description(description);
    pattern_builder.add_lines(lines);
    pattern_builder.finish()
}

pub fn serialize_hatch_pattern_line<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    line: &HatchPatternLine,
) -> WIPOffset<FbHatchPatternLine<'a>> {
    let origin = serialize_duc_point(builder, &line.origin);
    let offset = builder.create_vector(&line.offset);
    let dash_pattern = builder.create_vector(&line.dash_pattern);

    let mut line_builder = HatchPatternLineBuilder::new(builder);
    line_builder.add_angle(line.angle);
    line_builder.add_origin(origin);
    line_builder.add_offset(offset);
    line_builder.add_dash_pattern(dash_pattern);
    line_builder.finish()
}

pub fn serialize_duc_point<'a>(builder: &mut FlatBufferBuilder<'a>, point: &DucPoint) -> WIPOffset<FbDucPoint<'a>> {
    // Create DucPoint using the create method
    FbDucPoint::create(builder, &crate::generated::duc::DucPointArgs {
        x: point.x,
        y: point.y,
        mirroring: point.mirroring,
    })
}

pub fn serialize_duc_head<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    head: &DucHead,
) -> WIPOffset<FbDucHead<'a>> {
    let block_id = builder.create_string(&head.block_id);

    let mut head_builder = DucHeadBuilder::new(builder);
    if let Some(head_type) = head.head_type {
        head_builder.add_type_(head_type);
    }
    head_builder.add_block_id(block_id);
    head_builder.add_size(head.size);
    head_builder.finish()
}

pub fn serialize_line_spacing<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    spacing: &LineSpacing,
) -> WIPOffset<FbLineSpacing<'a>> {
    let mut spacing_builder = LineSpacingBuilder::new(builder);
    spacing_builder.add_value(spacing.value);
    if let Some(line_type) = spacing.line_type {
        spacing_builder.add_type_(line_type);
    }
    spacing_builder.finish()
}

// Add the missing function for serializing DucElementBase
pub fn serialize_base_duc_element_with_builder<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucElementBase,
) -> WIPOffset<FbDucElementBase<'a>> {
    let id = builder.create_string(&element.id);
    let styles = serialize_duc_element_styles_base(builder, &element.styles);
    let scope = builder.create_string(&element.scope);
    let label = builder.create_string(&element.label);
    let description = builder.create_string(&element.description);
    let index = builder.create_string(&element.index);
    
    // Create group_ids vector
    let mut group_id_offsets = Vec::new();
    for gid in &element.group_ids {
        group_id_offsets.push(builder.create_string(gid));
    }
    let group_ids = builder.create_vector(&group_id_offsets);
    
    // Create region_ids vector
    let mut region_id_offsets = Vec::new();
    for rid in &element.region_ids {
        region_id_offsets.push(builder.create_string(rid));
    }
    let region_ids = builder.create_vector(&region_id_offsets);
    
    let layer_id = builder.create_string(&element.layer_id);
    let frame_id = builder.create_string(&element.frame_id);
    
    // Create bound_elements vector
    let mut bound_element_offsets = Vec::new();
    for bound in &element.bound_elements {
        let bound_id = builder.create_string(&bound.id);
        let bound_type = builder.create_string(&bound.element_type);
        
        let bound_element = FbBoundElement::create(builder, &crate::generated::duc::BoundElementArgs {
            id: Some(bound_id),
            type_: Some(bound_type),
        });
        
        bound_element_offsets.push(bound_element);
    }
    let bound_elements = builder.create_vector(&bound_element_offsets);
    
    let link = builder.create_string(&element.link);
    let custom_data = builder.create_string(&element.custom_data);
    
    FbDucElementBase::create(builder, &crate::generated::duc::_DucElementBaseArgs {
        id: Some(id),
        styles: Some(styles),
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        angle: element.angle,
        scope: Some(scope),
        label: Some(label),
        description: Some(description),
        is_visible: element.is_visible,
        seed: element.seed,
        version: element.version,
        version_nonce: element.version_nonce,
        updated: element.updated,
        index: Some(index),
        is_plot: element.is_plot,
        is_annotative: element.is_annotative,
        is_deleted: element.is_deleted,
        group_ids: Some(group_ids),
        region_ids: Some(region_ids),
        layer_id: Some(layer_id),
        frame_id: Some(frame_id),
        bound_elements: Some(bound_elements),
        z_index: element.z_index,
        link: Some(link),
        locked: element.locked,
        custom_data: Some(custom_data),
    })
}

// Fix create_vector_of_strings functionality by manually creating string vectors
pub fn create_vector_of_strings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    strings: &[String],
) -> WIPOffset<flatbuffers::Vector<'a, flatbuffers::ForwardsUOffset<&'a str>>> {
    let mut offsets = Vec::new();
    for s in strings {
        offsets.push(builder.create_string(s));
    }
    builder.create_vector(&offsets)
}
