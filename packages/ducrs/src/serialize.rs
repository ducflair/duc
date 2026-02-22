#![allow(clippy::too_many_arguments)]
#![allow(clippy::new_ret_no_self)]

use crate::generated::duc as fb;
use crate::types;
use flatbuffers::{FlatBufferBuilder, WIPOffset};

/// Serializes the main `ExportedDataState` into a byte vector.
pub fn serialize(state: &types::ExportedDataState) -> Vec<u8> {
    let mut builder = FlatBufferBuilder::new();
    let root = serialize_exported_data_state(&mut builder, state);
    // Use the correct generated file identifier constant
    builder.finish(root, Some(fb::EXPORTED_DATA_STATE_IDENTIFIER));
    builder.finished_data().to_vec()
}

// =============================================================================
// Helper: Vector Serialization
// =============================================================================

fn serialize_vec_of_strings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    vec: &[String],
) -> Option<WIPOffset<flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<&'bldr str>>>> {
    if vec.is_empty() {
        return None;
    }
    // Collect in a separate scope to end the iterator borrow before the next builder call.
    let offsets: Vec<WIPOffset<&'bldr str>> = {
        vec.iter()
            .map(|s| builder.create_string(s.as_str()))
            .collect()
    };
    let v: WIPOffset<flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<&'bldr str>>> =
        builder.create_vector(&offsets);
    Some(v)
}

/// Helper function to compress a string using zlib compression
/// Returns the compressed byte vector
fn compress_string(s: &str) -> Vec<u8> {
    use flate2::write::ZlibEncoder;
    use flate2::Compression;
    use std::io::Write;

    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(s.as_bytes()).unwrap();
    encoder.finish().unwrap()
}

// =============================================================================
// UTILITY & GEOMETRY TYPES
// =============================================================================

fn serialize_geometric_point(point: &types::GeometricPoint) -> fb::GeometricPoint {
    fb::GeometricPoint::new(point.x, point.y)
}

fn serialize_duc_point<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    point: &types::DucPoint,
) -> WIPOffset<fb::DucPoint<'bldr>> {
    fb::DucPoint::create(
        builder,
        &fb::DucPointArgs {
            x: point.x,
            y: point.y,
            mirroring: point.mirroring,
        },
    )
}

fn serialize_vec_of_duc_points<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    vec: &[types::DucPoint],
) -> Option<WIPOffset<flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucPoint<'bldr>>>>>
{
    if vec.is_empty() {
        return None;
    }
    let offsets: Vec<WIPOffset<fb::DucPoint<'bldr>>> = vec
        .iter()
        .map(|p| serialize_duc_point(builder, p))
        .collect();
    let v: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucPoint<'bldr>>>,
    > = builder.create_vector(&offsets);
    Some(v)
}

fn serialize_identifier<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    id: &types::Identifier,
) -> WIPOffset<fb::Identifier<'bldr>> {
    let id_offset = builder.create_string(&id.id);
    let name_offset = builder.create_string(&id.name);
    let description_offset = id.description.as_ref().map(|s| builder.create_string(s));

    fb::Identifier::create(
        builder,
        &fb::IdentifierArgs {
            id: Some(id_offset),
            name: Some(name_offset),
            description: description_offset,
        },
    )
}

fn serialize_dictionary_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::DictionaryEntry,
) -> WIPOffset<fb::DictionaryEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = builder.create_string(&entry.value);

    fb::DictionaryEntry::create(
        builder,
        &fb::DictionaryEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

fn serialize_string_value_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::StringValueEntry,
) -> WIPOffset<fb::StringValueEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = builder.create_string(&entry.value);

    fb::StringValueEntry::create(
        builder,
        &fb::StringValueEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

fn serialize_duc_ucs<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    ucs: &types::DucUcs,
) -> WIPOffset<fb::DucUcs<'bldr>> {
    let origin = serialize_geometric_point(&ucs.origin);
    fb::DucUcs::create(
        builder,
        &fb::DucUcsArgs {
            origin: Some(&origin),
            angle: ucs.angle,
        },
    )
}

fn serialize_duc_view<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    view: &types::DucView,
) -> WIPOffset<fb::DucView<'bldr>> {
    let center_point_offset = serialize_duc_point(builder, &view.center_point);

    // Guide type inference explicitly for scope string
    let scope_str: WIPOffset<&'bldr str> = builder.create_string(view.scope.as_str());
    fb::DucView::create(
        builder,
        &fb::DucViewArgs {
            scroll_x: view.scroll_x,
            scroll_y: view.scroll_y,
            zoom: view.zoom,
            twist_angle: view.twist_angle,
            center_point: Some(center_point_offset),
            scope: Some(scope_str),
        },
    )
}

fn serialize_margins<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    margins: &types::Margins,
) -> WIPOffset<fb::Margins<'bldr>> {
    fb::Margins::create(
        builder,
        &fb::MarginsArgs {
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left,
        },
    )
}

// =============================================================================
// STYLING & CONTENT
// =============================================================================

fn serialize_tiling_properties<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    tiling: &types::TilingProperties,
) -> WIPOffset<fb::TilingProperties<'bldr>> {
    fb::TilingProperties::create(
        builder,
        &fb::TilingPropertiesArgs {
            size_in_percent: tiling.size_in_percent,
            angle: tiling.angle,
            spacing: Some(tiling.spacing.unwrap_or(0.0)),
            offset_x: Some(tiling.offset_x.unwrap_or(0.0)),
            offset_y: Some(tiling.offset_y.unwrap_or(0.0)),
        },
    )
}

fn serialize_hatch_pattern_line<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    line: &types::HatchPatternLine,
) -> WIPOffset<fb::HatchPatternLine<'bldr>> {
    let origin_offset = serialize_duc_point(builder, &line.origin);
    let offset_vec: WIPOffset<flatbuffers::Vector<'bldr, f64>> =
        builder.create_vector(&line.offset);
    let dash_pattern_vec: WIPOffset<flatbuffers::Vector<'bldr, f64>> =
        builder.create_vector(&line.dash_pattern);

    fb::HatchPatternLine::create(
        builder,
        &fb::HatchPatternLineArgs {
            angle: line.angle,
            origin: Some(origin_offset),
            offset: Some(offset_vec),
            dash_pattern: Some(dash_pattern_vec),
        },
    )
}

fn serialize_custom_hatch_pattern<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    pattern: &types::CustomHatchPattern,
) -> WIPOffset<fb::CustomHatchPattern<'bldr>> {
    let name_offset = builder.create_string(&pattern.name);
    let description_offset: Option<WIPOffset<&'bldr str>> = pattern.description.as_ref().map(|s| {
        let off: WIPOffset<&'bldr str> = builder.create_string(s.as_str());
        off
    });
    let lines_offsets: Vec<_> = pattern
        .lines
        .iter()
        .map(|l| serialize_hatch_pattern_line(builder, l))
        .collect();
    let lines_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::HatchPatternLine<'bldr>>>,
    > = builder.create_vector(&lines_offsets);

    fb::CustomHatchPattern::create(
        builder,
        &fb::CustomHatchPatternArgs {
            name: Some(name_offset),
            description: description_offset,
            lines: Some(lines_vec),
        },
    )
}

fn serialize_duc_hatch_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucHatchStyle,
) -> WIPOffset<fb::DucHatchStyle<'bldr>> {
    // pattern_name is a required String in types, so serialize directly
    let pattern_name_offset: Option<WIPOffset<&'bldr str>> = {
        let off: WIPOffset<&'bldr str> = builder.create_string(style.pattern_name.as_str());
        Some(off)
    };
    let pattern_origin_offset = serialize_duc_point(builder, &style.pattern_origin);
    let custom_pattern_offset = style
        .custom_pattern
        .as_ref()
        .map(|cp| serialize_custom_hatch_pattern(builder, cp));

    fb::DucHatchStyle::create(
        builder,
        &fb::DucHatchStyleArgs {
            hatch_style: Some(style.hatch_style),
            pattern_name: pattern_name_offset,
            pattern_scale: style.pattern_scale,
            pattern_angle: style.pattern_angle,
            pattern_origin: Some(pattern_origin_offset),
            pattern_double: style.pattern_double,
            custom_pattern: custom_pattern_offset,
        },
    )
}

fn serialize_duc_image_filter<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    filter: &types::DucImageFilter,
) -> WIPOffset<fb::DucImageFilter<'bldr>> {
    fb::DucImageFilter::create(
        builder,
        &fb::DucImageFilterArgs {
            brightness: filter.brightness,
            contrast: filter.contrast,
        },
    )
}

fn serialize_element_content_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    content: &types::ElementContentBase,
) -> WIPOffset<fb::ElementContentBase<'bldr>> {
    let src_offset = builder.create_string(&content.src);
    let tiling_offset: Option<WIPOffset<fb::TilingProperties>> = content
        .tiling
        .as_ref()
        .map(|t| serialize_tiling_properties(builder, t));
    let hatch_offset: Option<WIPOffset<fb::DucHatchStyle>> = content
        .hatch
        .as_ref()
        .map(|h| serialize_duc_hatch_style(builder, h));
    let image_filter_offset: Option<WIPOffset<fb::DucImageFilter>> = content
        .image_filter
        .as_ref()
        .map(|f| serialize_duc_image_filter(builder, f));

    fb::ElementContentBase::create(
        builder,
        &fb::ElementContentBaseArgs {
            preference: content.preference,
            src: Some(src_offset),
            visible: content.visible,
            opacity: content.opacity,
            tiling: tiling_offset,
            hatch: hatch_offset,
            image_filter: image_filter_offset,
        },
    )
}

fn serialize_stroke_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::StrokeStyle,
) -> WIPOffset<fb::StrokeStyle<'bldr>> {
    let dash_vec = style.dash.as_ref().map(|v| builder.create_vector(v));
    // Map Option<String> -> Option<WIPOffset<&str>> explicitly for type inference
    let dash_line_override_offset: Option<WIPOffset<&'bldr str>> = style
        .dash_line_override
        .as_ref()
        .map(|s| builder.create_string(s.as_str()));

    fb::StrokeStyle::create(
        builder,
        &fb::StrokeStyleArgs {
            preference: style.preference,
            cap: style.cap,
            join: style.join,
            dash: dash_vec,
            dash_line_override: dash_line_override_offset,
            dash_cap: style.dash_cap,
            miter_limit: style.miter_limit,
        },
    )
}

fn serialize_stroke_sides<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    sides: &types::StrokeSides,
) -> WIPOffset<fb::StrokeSides<'bldr>> {
    let values_vec = sides.values.as_ref().map(|v| builder.create_vector(v));
    fb::StrokeSides::create(
        builder,
        &fb::StrokeSidesArgs {
            preference: sides.preference,
            values: values_vec,
        },
    )
}

fn serialize_element_stroke<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    stroke: &types::ElementStroke,
) -> WIPOffset<fb::ElementStroke<'bldr>> {
    let content_offset = serialize_element_content_base(builder, &stroke.content);
    let style_offset = serialize_stroke_style(builder, &stroke.style);
    let stroke_sides_offset = stroke
        .stroke_sides
        .as_ref()
        .map(|s| serialize_stroke_sides(builder, s));

    fb::ElementStroke::create(
        builder,
        &fb::ElementStrokeArgs {
            content: Some(content_offset),
            width: stroke.width,
            style: Some(style_offset),
            placement: stroke.placement,
            stroke_sides: stroke_sides_offset,
        },
    )
}

fn serialize_element_background<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    background: &types::ElementBackground,
) -> WIPOffset<fb::ElementBackground<'bldr>> {
    let content_offset = serialize_element_content_base(builder, &background.content);
    fb::ElementBackground::create(
        builder,
        &fb::ElementBackgroundArgs {
            content: Some(content_offset),
        },
    )
}

fn serialize_duc_element_styles_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    styles: &types::DucElementStylesBase,
) -> WIPOffset<fb::_DucElementStylesBase<'bldr>> {
    let background_offsets: Vec<_> = styles
        .background
        .iter()
        .map(|b| serialize_element_background(builder, b))
        .collect();
    let background_vec = builder.create_vector(&background_offsets);

    let stroke_offsets: Vec<_> = styles
        .stroke
        .iter()
        .map(|s| serialize_element_stroke(builder, s))
        .collect();
    let stroke_vec = builder.create_vector(&stroke_offsets);

    fb::_DucElementStylesBase::create(
        builder,
        &fb::_DucElementStylesBaseArgs {
            roundness: styles.roundness,
            blending: Some(styles.blending.unwrap_or(fb::BLENDING::MULTIPLY)),
            background: Some(background_vec),
            stroke: Some(stroke_vec),
            opacity: styles.opacity,
        },
    )
}

// =============================================================================
// BASE ELEMENT & COMMON ELEMENT COMPONENTS
// =============================================================================

fn serialize_bound_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    bound_element: &types::BoundElement,
) -> WIPOffset<fb::BoundElement<'bldr>> {
    let id_offset = builder.create_string(&bound_element.id);
    let type_offset = builder.create_string(&bound_element.element_type);
    fb::BoundElement::create(
        builder,
        &fb::BoundElementArgs {
            id: Some(id_offset),
            type_: Some(type_offset),
        },
    )
}

fn serialize_duc_element_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    base: &types::DucElementBase,
) -> WIPOffset<fb::_DucElementBase<'bldr>> {
    let styles_offset = Some(serialize_duc_element_styles_base(builder, &base.styles));
    let id_offset = builder.create_string(&base.id);
    let scope_offset = builder.create_string(&base.scope);
    let label_offset = Some(builder.create_string(&base.label));
    let description_offset = base.description.as_ref().map(|s| builder.create_string(s));
    let index_offset = base.index.as_ref().map(|s| builder.create_string(s));
    let group_ids_vec = serialize_vec_of_strings(builder, &base.group_ids);
    let block_ids_vec = serialize_vec_of_strings(builder, &base.block_ids);
    let region_ids_vec = serialize_vec_of_strings(builder, &base.region_ids);
    let instance_id_offset = base.instance_id.as_ref().map(|s| builder.create_string(s));
    let layer_id_offset = base.layer_id.as_ref().map(|s| builder.create_string(s));
    let frame_id_offset = base.frame_id.as_ref().map(|s| builder.create_string(s));
    let bound_elements_offsets: Vec<_> = base
        .bound_elements
        .iter()
        .flat_map(|v| v.iter())
        .map(|be| serialize_bound_element(builder, be))
        .collect();
    let bound_elements_vec = if bound_elements_offsets.is_empty() {
        None
    } else {
        Some(builder.create_vector(&bound_elements_offsets))
    };
    let link_offset = base.link.as_ref().map(|s| builder.create_string(s));

    // Compress custom_data JSON and create byte vector
    let custom_data_offset = base.custom_data.as_ref().map(|s| {
        let compressed = compress_string(s);
        builder.create_vector::<u8>(&compressed)
    });

    fb::_DucElementBase::create(
        builder,
        &fb::_DucElementBaseArgs {
            id: Some(id_offset),
            styles: styles_offset,
            x: base.x,
            y: base.y,
            width: base.width,
            height: base.height,
            angle: base.angle,
            scope: Some(scope_offset),
            label: label_offset,
            description: description_offset,
            is_visible: base.is_visible,
            seed: base.seed,
            version: base.version,
            version_nonce: base.version_nonce,
            updated: base.updated,
            index: index_offset,
            is_plot: base.is_plot,
            is_annotative: base.is_annotative,
            is_deleted: base.is_deleted,
            group_ids: group_ids_vec,
            block_ids: block_ids_vec,
            region_ids: region_ids_vec,
            instance_id: instance_id_offset,
            layer_id: layer_id_offset,
            frame_id: frame_id_offset,
            bound_elements: bound_elements_vec,
            z_index: base.z_index,
            link: link_offset,
            locked: base.locked,
            custom_data: custom_data_offset,
        },
    )
}

fn serialize_duc_head<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    head: &types::DucHead,
) -> WIPOffset<fb::DucHead<'bldr>> {
    let block_id_offset = head
        .block_id
        .as_ref()
        .map(|s| builder.create_string(s.as_str()));
    fb::DucHead::create(
        builder,
        &fb::DucHeadArgs {
            type_: head.head_type,
            block_id: block_id_offset,
            size: head.size,
        },
    )
}

fn serialize_point_binding_point<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    pbp: &types::PointBindingPoint,
) -> WIPOffset<fb::PointBindingPoint<'bldr>> {
    fb::PointBindingPoint::create(
        builder,
        &fb::PointBindingPointArgs {
            index: pbp.index,
            offset: pbp.offset,
        },
    )
}

fn serialize_duc_point_binding<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    binding: &types::DucPointBinding,
) -> WIPOffset<fb::DucPointBinding<'bldr>> {
    let element_id_offset = builder.create_string(&binding.element_id);
    let fixed_point_built: Option<fb::GeometricPoint> = binding
        .fixed_point
        .as_ref()
        .map(|gp| serialize_geometric_point(gp));
    let fixed_point_ref: Option<&fb::GeometricPoint> = fixed_point_built.as_ref();
    let point_offset = binding
        .point
        .as_ref()
        .map(|p| serialize_point_binding_point(builder, p));
    let head_offset = binding
        .head
        .as_ref()
        .map(|h| serialize_duc_head(builder, h));

    fb::DucPointBinding::create(
        builder,
        &fb::DucPointBindingArgs {
            element_id: Some(element_id_offset),
            focus: binding.focus,
            gap: binding.gap,
            fixed_point: fixed_point_ref,
            point: point_offset,
            head: head_offset,
        },
    )
}

fn serialize_duc_line_reference<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    line_ref: &types::DucLineReference,
) -> WIPOffset<fb::DucLineReference<'bldr>> {
    // Build fb::GeometricPoint and pass Option<&fb::GeometricPoint> as required
    let handle_built: Option<fb::GeometricPoint> = line_ref
        .handle
        .as_ref()
        .map(|gp| serialize_geometric_point(gp));
    let handle_ref: Option<&fb::GeometricPoint> = handle_built.as_ref();

    fb::DucLineReference::create(
        builder,
        &fb::DucLineReferenceArgs {
            index: line_ref.index,
            handle: handle_ref,
        },
    )
}

fn serialize_duc_line<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    line: &types::DucLine,
) -> WIPOffset<fb::DucLine<'bldr>> {
    let start_offset = serialize_duc_line_reference(builder, &line.start);
    let end_offset = serialize_duc_line_reference(builder, &line.end);
    fb::DucLine::create(
        builder,
        &fb::DucLineArgs {
            start: Some(start_offset),
            end: Some(end_offset),
        },
    )
}

fn serialize_duc_path<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    path: &types::DucPath,
) -> WIPOffset<fb::DucPath<'bldr>> {
    let line_indices_vec = builder.create_vector(&path.line_indices);
    let background_offset = path
        .background
        .as_ref()
        .map(|b| serialize_element_background(builder, b));
    let stroke_offset = path
        .stroke
        .as_ref()
        .map(|s| serialize_element_stroke(builder, s));
    fb::DucPath::create(
        builder,
        &fb::DucPathArgs {
            line_indices: Some(line_indices_vec),
            background: background_offset,
            stroke: stroke_offset,
        },
    )
}

fn serialize_duc_linear_element_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    base: &types::DucLinearElementBase,
) -> WIPOffset<fb::_DucLinearElementBase<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &base.base);
    let points_vec = serialize_vec_of_duc_points(builder, &base.points);
    let lines_offsets: Vec<WIPOffset<fb::DucLine<'bldr>>> = base
        .lines
        .iter()
        .map(|l| serialize_duc_line(builder, l))
        .collect();
    let lines_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucLine<'bldr>>>,
    > = builder.create_vector(&lines_offsets);
    let path_overrides_offsets: Vec<_> = base
        .path_overrides
        .iter()
        .map(|p| serialize_duc_path(builder, p))
        .collect();
    let path_overrides_vec = builder.create_vector(&path_overrides_offsets);
    let last_committed_point_offset = base
        .last_committed_point
        .as_ref()
        .map(|p| serialize_duc_point(builder, p));
    let start_binding_offset = base
        .start_binding
        .as_ref()
        .map(|b| serialize_duc_point_binding(builder, b));
    let end_binding_offset = base
        .end_binding
        .as_ref()
        .map(|b| serialize_duc_point_binding(builder, b));

    fb::_DucLinearElementBase::create(
        builder,
        &fb::_DucLinearElementBaseArgs {
            base: Some(base_offset),
            points: points_vec,
            lines: Some(lines_vec),
            path_overrides: Some(path_overrides_vec),
            last_committed_point: last_committed_point_offset,
            start_binding: start_binding_offset,
            end_binding: end_binding_offset,
        },
    )
}

fn serialize_duc_stack_like_styles<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    styles: &types::DucStackLikeStyles,
) -> WIPOffset<fb::DucStackLikeStyles<'bldr>> {
    let labeling_color_offset = builder.create_string(&styles.labeling_color);
    fb::DucStackLikeStyles::create(
        builder,
        &fb::DucStackLikeStylesArgs {
            opacity: styles.opacity,
            labeling_color: Some(labeling_color_offset),
        },
    )
}

fn serialize_duc_stack_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    base: &types::DucStackBase,
) -> WIPOffset<fb::_DucStackBase<'bldr>> {
    let label_offset = builder.create_string(&base.label);
    let description_offset = base.description.as_ref().map(|s| builder.create_string(s));
    let styles_offset = serialize_duc_stack_like_styles(builder, &base.styles);
    fb::_DucStackBase::create(
        builder,
        &fb::_DucStackBaseArgs {
            label: Some(label_offset),
            description: description_offset,
            is_collapsed: base.is_collapsed,
            is_plot: base.is_plot,
            is_visible: base.is_visible,
            locked: base.locked,
            styles: Some(styles_offset),
        },
    )
}

fn serialize_duc_stack_element_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    base: &types::DucStackElementBase,
) -> WIPOffset<fb::_DucStackElementBase<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &base.base);
    let stack_base_offset = serialize_duc_stack_base(builder, &base.stack_base);
    // base.standard_override is Option<String> in types; map to Option<WIPOffset<&'bldr str>>
    let standard_override_offset = base
        .standard_override
        .as_deref()
        .map(|s| builder.create_string(s));
    fb::_DucStackElementBase::create(
        builder,
        &fb::_DucStackElementBaseArgs {
            base: Some(base_offset),
            stack_base: Some(stack_base_offset),
            clip: base.clip,
            label_visible: base.label_visible,
            standard_override: standard_override_offset,
        },
    )
}

// =============================================================================
// ELEMENT-SPECIFIC STYLES
// =============================================================================

fn serialize_line_spacing<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    spacing: &types::LineSpacing,
) -> WIPOffset<fb::LineSpacing<'bldr>> {
    fb::LineSpacing::create(
        builder,
        &fb::LineSpacingArgs {
            value: spacing.value,
            type_: spacing.line_type,
        },
    )
}

fn serialize_duc_text_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucTextStyle,
) -> WIPOffset<fb::DucTextStyle<'bldr>> {
    let font_family_offset = builder.create_string(&style.font_family);
    let big_font_family_offset = builder.create_string(&style.big_font_family);
    let line_spacing_offset = serialize_line_spacing(builder, &style.line_spacing);

    fb::DucTextStyle::create(
        builder,
        &fb::DucTextStyleArgs {
            is_ltr: style.is_ltr,
            font_family: Some(font_family_offset),
            big_font_family: Some(big_font_family_offset),
            text_align: Some(style.text_align),
            vertical_align: Some(style.vertical_align),
            line_height: style.line_height,
            line_spacing: Some(line_spacing_offset),
            oblique_angle: style.oblique_angle,
            font_size: style.font_size,
            paper_text_height: style.paper_text_height.unwrap_or(0.0),
            width_factor: style.width_factor,
            is_upside_down: style.is_upside_down,
            is_backwards: style.is_backwards,
        },
    )
}

fn serialize_duc_table_cell_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucTableCellStyle,
) -> WIPOffset<fb::DucTableCellStyle<'bldr>> {
    let base_style_offset = serialize_duc_element_styles_base(builder, &style.base_style);
    let text_style_offset = serialize_duc_text_style(builder, &style.text_style);
    let margins_offset = serialize_margins(builder, &style.margins);

    fb::DucTableCellStyle::create(
        builder,
        &fb::DucTableCellStyleArgs {
            base_style: Some(base_style_offset),
            text_style: Some(text_style_offset),
            margins: Some(margins_offset),
            alignment: style.alignment,
        },
    )
}

fn serialize_duc_table_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucTableStyle,
) -> WIPOffset<fb::DucTableStyle<'bldr>> {
    let header_row_style_offset = serialize_duc_table_cell_style(builder, &style.header_row_style);
    let data_row_style_offset = serialize_duc_table_cell_style(builder, &style.data_row_style);
    let data_column_style_offset =
        serialize_duc_table_cell_style(builder, &style.data_column_style);

    fb::DucTableStyle::create(
        builder,
        &fb::DucTableStyleArgs {
            flow_direction: Some(style.flow_direction),
            header_row_style: Some(header_row_style_offset),
            data_row_style: Some(data_row_style_offset),
            data_column_style: Some(data_column_style_offset),
        },
    )
}

fn serialize_duc_leader_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucLeaderStyle,
) -> WIPOffset<fb::DucLeaderStyle<'bldr>> {
    let heads_override_vec = style.heads_override.as_ref().map(|v| {
        let offsets: Vec<_> = v.iter().map(|h| serialize_duc_head(builder, h)).collect();
        builder.create_vector(&offsets)
    });
    let text_style_offset = serialize_duc_text_style(builder, &style.text_style);

    fb::DucLeaderStyle::create(
        builder,
        &fb::DucLeaderStyleArgs {
            heads_override: heads_override_vec,
            dogleg: style.dogleg.unwrap_or(0.0),
            text_style: Some(text_style_offset),
            text_attachment: Some(style.text_attachment),
            block_attachment: Some(style.block_attachment),
        },
    )
}

fn serialize_dimension_tolerance_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DimensionToleranceStyle,
) -> WIPOffset<fb::DimensionToleranceStyle<'bldr>> {
    let text_style_offset = style
        .text_style
        .as_ref()
        .map(|t| serialize_duc_text_style(builder, t));

    fb::DimensionToleranceStyle::create(
        builder,
        &fb::DimensionToleranceStyleArgs {
            enabled: style.enabled,
            display_method: Some(style.display_method),
            upper_value: style.upper_value,
            lower_value: style.lower_value,
            precision: style.precision,
            text_style: text_style_offset,
        },
    )
}

fn serialize_dimension_fit_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DimensionFitStyle,
) -> WIPOffset<fb::DimensionFitStyle<'bldr>> {
    fb::DimensionFitStyle::create(
        builder,
        &fb::DimensionFitStyleArgs {
            rule: Some(style.rule),
            text_placement: Some(style.text_placement),
            force_text_inside: style.force_text_inside,
        },
    )
}

fn serialize_dimension_line_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DimensionLineStyle,
) -> WIPOffset<fb::DimensionLineStyle<'bldr>> {
    let stroke_offset = serialize_element_stroke(builder, &style.stroke);
    fb::DimensionLineStyle::create(
        builder,
        &fb::DimensionLineStyleArgs {
            stroke: Some(stroke_offset),
            text_gap: style.text_gap,
        },
    )
}

fn serialize_dimension_ext_line_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DimensionExtLineStyle,
) -> WIPOffset<fb::DimensionExtLineStyle<'bldr>> {
    let stroke_offset = serialize_element_stroke(builder, &style.stroke);
    fb::DimensionExtLineStyle::create(
        builder,
        &fb::DimensionExtLineStyleArgs {
            stroke: Some(stroke_offset),
            overshoot: style.overshoot,
            offset: style.offset,
        },
    )
}

fn serialize_dimension_symbol_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DimensionSymbolStyle,
) -> WIPOffset<fb::DimensionSymbolStyle<'bldr>> {
    let heads_override_vec = style.heads_override.as_ref().map(|v| {
        let offsets: Vec<_> = v.iter().map(|h| serialize_duc_head(builder, h)).collect();
        builder.create_vector(&offsets)
    });
    fb::DimensionSymbolStyle::create(
        builder,
        &fb::DimensionSymbolStyleArgs {
            heads_override: heads_override_vec,
            center_mark_type: Some(style.center_mark_type),
            center_mark_size: style.center_mark_size,
        },
    )
}

fn serialize_duc_dimension_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucDimensionStyle,
) -> WIPOffset<fb::DucDimensionStyle<'bldr>> {
    let dim_line_offset = serialize_dimension_line_style(builder, &style.dim_line);
    let ext_line_offset = serialize_dimension_ext_line_style(builder, &style.ext_line);
    let text_style_offset = serialize_duc_text_style(builder, &style.text_style);
    let symbols_offset = serialize_dimension_symbol_style(builder, &style.symbols);
    let tolerance_offset = serialize_dimension_tolerance_style(builder, &style.tolerance);
    let fit_offset = serialize_dimension_fit_style(builder, &style.fit);

    fb::DucDimensionStyle::create(
        builder,
        &fb::DucDimensionStyleArgs {
            dim_line: Some(dim_line_offset),
            ext_line: Some(ext_line_offset),
            text_style: Some(text_style_offset),
            symbols: Some(symbols_offset),
            tolerance: Some(tolerance_offset),
            fit: Some(fit_offset),
        },
    )
}

fn serialize_fcf_layout_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::FCFLayoutStyle,
) -> WIPOffset<fb::FCFLayoutStyle<'bldr>> {
    fb::FCFLayoutStyle::create(
        builder,
        &fb::FCFLayoutStyleArgs {
            padding: style.padding,
            segment_spacing: style.segment_spacing,
            row_spacing: style.row_spacing,
        },
    )
}

fn serialize_fcf_symbol_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::FCFSymbolStyle,
) -> WIPOffset<fb::FCFSymbolStyle<'bldr>> {
    fb::FCFSymbolStyle::create(builder, &fb::FCFSymbolStyleArgs { scale: style.scale })
}

fn serialize_fcf_datum_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::FCFDatumStyle,
) -> WIPOffset<fb::FCFDatumStyle<'bldr>> {
    fb::FCFDatumStyle::create(
        builder,
        &fb::FCFDatumStyleArgs {
            bracket_style: Some(style.bracket_style),
        },
    )
}

fn serialize_duc_feature_control_frame_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucFeatureControlFrameStyle,
) -> WIPOffset<fb::DucFeatureControlFrameStyle<'bldr>> {
    let text_style_offset = serialize_duc_text_style(builder, &style.text_style);
    let layout_offset = serialize_fcf_layout_style(builder, &style.layout);
    let symbols_offset = serialize_fcf_symbol_style(builder, &style.symbols);
    let datum_style_offset = serialize_fcf_datum_style(builder, &style.datum_style);

    fb::DucFeatureControlFrameStyle::create(
        builder,
        &fb::DucFeatureControlFrameStyleArgs {
            text_style: Some(text_style_offset),
            layout: Some(layout_offset),
            symbols: Some(symbols_offset),
            datum_style: Some(datum_style_offset),
        },
    )
}

fn serialize_paragraph_formatting<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    format: &types::ParagraphFormatting,
) -> WIPOffset<fb::ParagraphFormatting<'bldr>> {
    let tab_stops_vec = builder.create_vector(&format.tab_stops);
    fb::ParagraphFormatting::create(
        builder,
        &fb::ParagraphFormattingArgs {
            first_line_indent: format.first_line_indent,
            hanging_indent: format.hanging_indent,
            left_indent: format.left_indent,
            right_indent: format.right_indent,
            space_before: format.space_before,
            space_after: format.space_after,
            tab_stops: Some(tab_stops_vec),
        },
    )
}

fn serialize_stack_format_properties<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    props: &types::StackFormatProperties,
) -> WIPOffset<fb::StackFormatProperties<'bldr>> {
    fb::StackFormatProperties::create(
        builder,
        &fb::StackFormatPropertiesArgs {
            upper_scale: props.upper_scale,
            lower_scale: props.lower_scale,
            alignment: Some(props.alignment),
        },
    )
}

fn serialize_stack_format<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    format: &types::StackFormat,
) -> WIPOffset<fb::StackFormat<'bldr>> {
    let stack_chars_vec = serialize_vec_of_strings(builder, &format.stack_chars);
    let properties_offset = serialize_stack_format_properties(builder, &format.properties);
    fb::StackFormat::create(
        builder,
        &fb::StackFormatArgs {
            auto_stack: format.auto_stack,
            stack_chars: stack_chars_vec,
            properties: Some(properties_offset),
        },
    )
}

fn serialize_duc_doc_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucDocStyle,
) -> WIPOffset<fb::DucDocStyle<'bldr>> {
    let text_style_offset = serialize_duc_text_style(builder, &style.text_style);
    let paragraph_offset = serialize_paragraph_formatting(builder, &style.paragraph);
    let stack_format_offset = serialize_stack_format(builder, &style.stack_format);
    fb::DucDocStyle::create(
        builder,
        &fb::DucDocStyleArgs {
            text_style: Some(text_style_offset),
            paragraph: Some(paragraph_offset),
            stack_format: Some(stack_format_offset),
        },
    )
}

fn serialize_duc_viewport_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucViewportStyle,
) -> WIPOffset<fb::DucViewportStyle<'bldr>> {
    fb::DucViewportStyle::create(
        builder,
        &fb::DucViewportStyleArgs {
            scale_indicator_visible: style.scale_indicator_visible,
        },
    )
}

fn serialize_duc_plot_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    _style: &types::DucPlotStyle,
) -> WIPOffset<fb::DucPlotStyle<'bldr>> {
    fb::DucPlotStyle::create(builder, &fb::DucPlotStyleArgs {})
}

fn serialize_duc_xray_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucXRayStyle,
) -> WIPOffset<fb::DucXRayStyle<'bldr>> {
    let color_offset = builder.create_string(&style.color);
    fb::DucXRayStyle::create(
        builder,
        &fb::DucXRayStyleArgs {
            color: Some(color_offset),
        },
    )
}

// =============================================================================
// ELEMENT DEFINITIONS
// =============================================================================

fn serialize_duc_rectangle_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucRectangleElement,
) -> WIPOffset<fb::DucRectangleElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    fb::DucRectangleElement::create(
        builder,
        &fb::DucRectangleElementArgs {
            base: Some(base_offset),
        },
    )
}

fn serialize_duc_polygon_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucPolygonElement,
) -> WIPOffset<fb::DucPolygonElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    fb::DucPolygonElement::create(
        builder,
        &fb::DucPolygonElementArgs {
            base: Some(base_offset),
            sides: element.sides,
        },
    )
}

fn serialize_duc_ellipse_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucEllipseElement,
) -> WIPOffset<fb::DucEllipseElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    fb::DucEllipseElement::create(
        builder,
        &fb::DucEllipseElementArgs {
            base: Some(base_offset),
            ratio: element.ratio,
            start_angle: element.start_angle,
            end_angle: element.end_angle,
            show_aux_crosshair: element.show_aux_crosshair,
        },
    )
}

fn serialize_duc_embeddable_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucEmbeddableElement,
) -> WIPOffset<fb::DucEmbeddableElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    fb::DucEmbeddableElement::create(
        builder,
        &fb::DucEmbeddableElementArgs {
            base: Some(base_offset),
        },
    )
}

fn serialize_duc_pdf_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucPdfElement,
) -> WIPOffset<fb::DucPdfElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let file_id_offset = element.file_id.as_deref().map(|s| builder.create_string(s));
    let grid_config_offset = serialize_document_grid_config(builder, &element.grid_config);
    fb::DucPdfElement::create(
        builder,
        &fb::DucPdfElementArgs {
            base: Some(base_offset),
            file_id: file_id_offset,
            grid_config: Some(grid_config_offset),
        },
    )
}

fn serialize_duc_mermaid_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucMermaidElement,
) -> WIPOffset<fb::DucMermaidElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let source_offset = builder.create_string(&element.source);
    let theme_offset: Option<WIPOffset<&'bldr str>> = element
        .theme
        .as_ref()
        .map(|s| builder.create_string(s.as_str()));
    let svg_path_offset = element
        .svg_path
        .as_ref()
        .map(|s| builder.create_string(s.as_str()));
    fb::DucMermaidElement::create(
        builder,
        &fb::DucMermaidElementArgs {
            base: Some(base_offset),
            source: Some(source_offset),
            theme: theme_offset,
            svg_path: svg_path_offset,
        },
    )
}

fn serialize_duc_table_column<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    col: &types::DucTableColumn,
) -> WIPOffset<fb::DucTableColumn<'bldr>> {
    let id_offset = builder.create_string(&col.id);
    let style_overrides_offset = col
        .style_overrides
        .as_ref()
        .map(|s| serialize_duc_table_cell_style(builder, s));
    fb::DucTableColumn::create(
        builder,
        &fb::DucTableColumnArgs {
            id: Some(id_offset),
            width: col.width,
            style_overrides: style_overrides_offset,
        },
    )
}

fn serialize_duc_table_row<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    row: &types::DucTableRow,
) -> WIPOffset<fb::DucTableRow<'bldr>> {
    let id_offset = builder.create_string(&row.id);
    let style_overrides_offset = row
        .style_overrides
        .as_ref()
        .map(|s| serialize_duc_table_cell_style(builder, s));
    fb::DucTableRow::create(
        builder,
        &fb::DucTableRowArgs {
            id: Some(id_offset),
            height: row.height,
            style_overrides: style_overrides_offset,
        },
    )
}

fn serialize_duc_table_cell_span<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    span: &types::DucTableCellSpan,
) -> WIPOffset<fb::DucTableCellSpan<'bldr>> {
    fb::DucTableCellSpan::create(
        builder,
        &fb::DucTableCellSpanArgs {
            columns: span.columns,
            rows: span.rows,
        },
    )
}

fn serialize_duc_table_cell<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    cell: &types::DucTableCell,
) -> WIPOffset<fb::DucTableCell<'bldr>> {
    let row_id_offset = builder.create_string(&cell.row_id);
    let column_id_offset = builder.create_string(&cell.column_id);
    let data_offset = builder.create_string(&cell.data);
    let span_offset = cell
        .span
        .as_ref()
        .map(|s| serialize_duc_table_cell_span(builder, s));
    let style_overrides_offset = cell
        .style_overrides
        .as_ref()
        .map(|s| serialize_duc_table_cell_style(builder, s));

    fb::DucTableCell::create(
        builder,
        &fb::DucTableCellArgs {
            row_id: Some(row_id_offset),
            column_id: Some(column_id_offset),
            data: Some(data_offset),
            span: span_offset,
            locked: cell.locked,
            style_overrides: style_overrides_offset,
        },
    )
}

fn serialize_duc_table_column_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::DucTableColumnEntry,
) -> WIPOffset<fb::DucTableColumnEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = serialize_duc_table_column(builder, &entry.value);
    fb::DucTableColumnEntry::create(
        builder,
        &fb::DucTableColumnEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

fn serialize_duc_table_row_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::DucTableRowEntry,
) -> WIPOffset<fb::DucTableRowEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = serialize_duc_table_row(builder, &entry.value);
    fb::DucTableRowEntry::create(
        builder,
        &fb::DucTableRowEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

fn serialize_duc_table_cell_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::DucTableCellEntry,
) -> WIPOffset<fb::DucTableCellEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = serialize_duc_table_cell(builder, &entry.value);
    fb::DucTableCellEntry::create(
        builder,
        &fb::DucTableCellEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

fn serialize_duc_table_auto_size<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    auto_size: &types::DucTableAutoSize,
) -> WIPOffset<fb::DucTableAutoSize<'bldr>> {
    fb::DucTableAutoSize::create(
        builder,
        &fb::DucTableAutoSizeArgs {
            columns: auto_size.columns,
            rows: auto_size.rows,
        },
    )
}

fn serialize_duc_table_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucTableElement,
) -> WIPOffset<fb::DucTableElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let style_offset = serialize_duc_table_style(builder, &element.style);
    let column_order_vec = serialize_vec_of_strings(builder, &element.column_order);
    let row_order_vec = serialize_vec_of_strings(builder, &element.row_order);
    let columns_offsets: Vec<_> = element
        .columns
        .iter()
        .map(|c| serialize_duc_table_column_entry(builder, c))
        .collect();
    let columns_vec = builder.create_vector(&columns_offsets);
    let rows_offsets: Vec<_> = element
        .rows
        .iter()
        .map(|r| serialize_duc_table_row_entry(builder, r))
        .collect();
    let rows_vec = builder.create_vector(&rows_offsets);
    let cells_offsets: Vec<_> = element
        .cells
        .iter()
        .map(|c| serialize_duc_table_cell_entry(builder, c))
        .collect();
    let cells_vec = builder.create_vector(&cells_offsets);
    let auto_size_offset = serialize_duc_table_auto_size(builder, &element.auto_size);

    fb::DucTableElement::create(
        builder,
        &fb::DucTableElementArgs {
            base: Some(base_offset),
            style: Some(style_offset),
            column_order: column_order_vec,
            row_order: row_order_vec,
            columns: Some(columns_vec),
            rows: Some(rows_vec),
            cells: Some(cells_vec),
            header_row_count: element.header_row_count,
            auto_size: Some(auto_size_offset),
        },
    )
}

fn serialize_image_crop<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    crop: &types::ImageCrop,
) -> WIPOffset<fb::ImageCrop<'bldr>> {
    fb::ImageCrop::create(
        builder,
        &fb::ImageCropArgs {
            x: crop.x,
            y: crop.y,
            width: crop.width,
            height: crop.height,
            natural_width: crop.natural_width,
            natural_height: crop.natural_height,
        },
    )
}

fn serialize_duc_image_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucImageElement,
) -> WIPOffset<fb::DucImageElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let file_id_offset = element.file_id.as_ref().map(|s| builder.create_string(s));
    let scale_vec = builder.create_vector(&element.scale);
    let crop_offset = element
        .crop
        .as_ref()
        .map(|c| serialize_image_crop(builder, c));
    let filter_offset = element
        .filter
        .as_ref()
        .map(|f| serialize_duc_image_filter(builder, f));

    fb::DucImageElement::create(
        builder,
        &fb::DucImageElementArgs {
            base: Some(base_offset),
            file_id: file_id_offset,
            status: Some(element.status),
            scale: Some(scale_vec),
            crop: crop_offset,
            filter: filter_offset,
        },
    )
}

fn serialize_duc_text_dynamic_element_source<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    source: &types::DucTextDynamicElementSource,
) -> WIPOffset<fb::DucTextDynamicElementSource<'bldr>> {
    let element_id_offset = builder.create_string(&source.element_id);
    fb::DucTextDynamicElementSource::create(
        builder,
        &fb::DucTextDynamicElementSourceArgs {
            element_id: Some(element_id_offset),
            property: source.property,
        },
    )
}

fn serialize_duc_text_dynamic_dictionary_source<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    source: &types::DucTextDynamicDictionarySource,
) -> WIPOffset<fb::DucTextDynamicDictionarySource<'bldr>> {
    let key_offset = builder.create_string(&source.key);
    fb::DucTextDynamicDictionarySource::create(
        builder,
        &fb::DucTextDynamicDictionarySourceArgs {
            key: Some(key_offset),
        },
    )
}

fn serialize_duc_text_dynamic_source<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    source: &types::DucTextDynamicSource,
) -> WIPOffset<fb::DucTextDynamicSource<'bldr>> {
    let (source_type, source_offset) = match &source.source {
        types::DucTextDynamicSourceData::DucTextDynamicElementSource(s) => (
            fb::DucTextDynamicSourceData::DucTextDynamicElementSource,
            serialize_duc_text_dynamic_element_source(builder, s).as_union_value(),
        ),
        types::DucTextDynamicSourceData::DucTextDynamicDictionarySource(s) => (
            fb::DucTextDynamicSourceData::DucTextDynamicDictionarySource,
            serialize_duc_text_dynamic_dictionary_source(builder, s).as_union_value(),
        ),
    };

    fb::DucTextDynamicSource::create(
        builder,
        &fb::DucTextDynamicSourceArgs {
            text_source_type: source.text_source_type,
            source_type,
            source: Some(source_offset),
        },
    )
}

fn serialize_duc_text_dynamic_part<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    part: &types::DucTextDynamicPart,
) -> WIPOffset<fb::DucTextDynamicPart<'bldr>> {
    let tag_offset = builder.create_string(&part.tag);
    let source_offset = serialize_duc_text_dynamic_source(builder, &part.source);
    let formatting_offset = part
        .formatting
        .as_ref()
        .map(|f| serialize_primary_units(builder, f));
    let cached_value_offset = builder.create_string(&part.cached_value);

    fb::DucTextDynamicPart::create(
        builder,
        &fb::DucTextDynamicPartArgs {
            tag: Some(tag_offset),
            source: Some(source_offset),
            formatting: formatting_offset,
            cached_value: Some(cached_value_offset),
        },
    )
}

fn serialize_duc_text_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucTextElement,
) -> WIPOffset<fb::DucTextElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let style_offset = serialize_duc_text_style(builder, &element.style);
    let text_offset = builder.create_string(&element.text);
    // Help the compiler infer element type of the vector of offsets
    let dynamic_offsets: Vec<WIPOffset<fb::DucTextDynamicPart<'bldr>>> = element
        .dynamic
        .iter()
        .map(|p| serialize_duc_text_dynamic_part(builder, p))
        .collect();
    let dynamic_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucTextDynamicPart<'bldr>>>,
    > = builder.create_vector(&dynamic_offsets);
    let container_id_offset = element
        .container_id
        .as_ref()
        .map(|s| builder.create_string(s));
    // original_text is a required String in types, so always serialize
    let original_text_offset: Option<WIPOffset<&'bldr str>> = {
        let off: WIPOffset<&'bldr str> = builder.create_string(element.original_text.as_str());
        Some(off)
    };

    fb::DucTextElement::create(
        builder,
        &fb::DucTextElementArgs {
            base: Some(base_offset),
            style: Some(style_offset),
            text: Some(text_offset),
            dynamic: Some(dynamic_vec),
            auto_resize: element.auto_resize,
            container_id: container_id_offset,
            original_text: original_text_offset,
        },
    )
}

fn serialize_duc_linear_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucLinearElement,
) -> WIPOffset<fb::DucLinearElement<'bldr>> {
    let linear_base_offset = serialize_duc_linear_element_base(builder, &element.linear_base);
    fb::DucLinearElement::create(
        builder,
        &fb::DucLinearElementArgs {
            linear_base: Some(linear_base_offset),
            wipeout_below: element.wipeout_below,
        },
    )
}

fn serialize_duc_arrow_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucArrowElement,
) -> WIPOffset<fb::DucArrowElement<'bldr>> {
    let linear_base_offset = serialize_duc_linear_element_base(builder, &element.linear_base);
    fb::DucArrowElement::create(
        builder,
        &fb::DucArrowElementArgs {
            linear_base: Some(linear_base_offset),
            elbowed: element.elbowed,
        },
    )
}

fn serialize_duc_free_draw_ends<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    ends: &types::DucFreeDrawEnds,
) -> WIPOffset<fb::DucFreeDrawEnds<'bldr>> {
    let easing_offset = builder.create_string(&ends.easing);
    fb::DucFreeDrawEnds::create(
        builder,
        &fb::DucFreeDrawEndsArgs {
            cap: ends.cap,
            taper: ends.taper,
            easing: Some(easing_offset),
        },
    )
}

fn serialize_duc_free_draw_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucFreeDrawElement,
) -> WIPOffset<fb::DucFreeDrawElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let points_vec = serialize_vec_of_duc_points(builder, &element.points);
    let easing_offset = builder.create_string(&element.easing);
    let start_offset = element
        .start
        .as_ref()
        .map(|s| serialize_duc_free_draw_ends(builder, s));
    let end_offset = element
        .end
        .as_ref()
        .map(|e| serialize_duc_free_draw_ends(builder, e));
    let pressures_vec = builder.create_vector(&element.pressures);
    let last_committed_point_offset = element
        .last_committed_point
        .as_ref()
        .map(|p| serialize_duc_point(builder, p));
    let svg_path_offset = element
        .svg_path
        .as_deref()
        .map(|s| builder.create_string(s));

    fb::DucFreeDrawElement::create(
        builder,
        &fb::DucFreeDrawElementArgs {
            base: Some(base_offset),
            points: points_vec,
            size: element.size,
            thinning: element.thinning,
            smoothing: element.smoothing,
            streamline: element.streamline,
            easing: Some(easing_offset),
            start: start_offset,
            end: end_offset,
            pressures: Some(pressures_vec),
            simulate_pressure: element.simulate_pressure,
            last_committed_point: last_committed_point_offset,
            svg_path: svg_path_offset,
        },
    )
}

fn serialize_duc_block_duplication_array<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    array: &types::DucBlockDuplicationArray,
) -> WIPOffset<fb::DucBlockDuplicationArray<'bldr>> {
    fb::DucBlockDuplicationArray::create(
        builder,
        &fb::DucBlockDuplicationArrayArgs {
            rows: array.rows,
            cols: array.cols,
            row_spacing: array.row_spacing,
            col_spacing: array.col_spacing,
        },
    )
}


fn serialize_duc_block_instance<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    instance: &types::DucBlockInstance,
) -> WIPOffset<fb::DucBlockInstance<'bldr>> {
    let id_offset = builder.create_string(&instance.id);
    let block_id_offset = builder.create_string(&instance.block_id);
    let element_overrides_vec = instance.element_overrides.as_ref().map(|v| {
        let offsets: Vec<_> = v
            .iter()
            .map(|e| serialize_string_value_entry(builder, e))
            .collect();
        builder.create_vector(&offsets)
    });
    let attribute_values_vec = instance.attribute_values.as_ref().map(|v| {
        let offsets: Vec<_> = v
            .iter()
            .map(|a| serialize_string_value_entry(builder, a))
            .collect();
        builder.create_vector(&offsets)
    });
    let duplication_array_offset = instance
        .duplication_array
        .as_ref()
        .map(|d| serialize_duc_block_duplication_array(builder, d));
    fb::DucBlockInstance::create(
        builder,
        &fb::DucBlockInstanceArgs {
            id: Some(id_offset),
            block_id: Some(block_id_offset),
            version: instance.version,
            element_overrides: element_overrides_vec,
            attribute_values: attribute_values_vec,
            duplication_array: duplication_array_offset,
        },
    )
}

fn serialize_duc_block_collection<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    collection: &types::DucBlockCollection,
) -> WIPOffset<fb::DucBlockCollection<'bldr>> {
    let id_offset = builder.create_string(&collection.id);
    let label_offset = builder.create_string(&collection.label);

    let children_offsets: Vec<_> = collection
        .children
        .iter()
        .map(|child| {
            let child_id_offset = builder.create_string(&child.id);
            fb::DucBlockCollectionEntry::create(
                builder,
                &fb::DucBlockCollectionEntryArgs {
                    id: Some(child_id_offset),
                    is_collection: child.is_collection,
                },
            )
        })
        .collect();
    let children_vec = builder.create_vector(&children_offsets);

    let metadata_offset = collection.metadata.as_ref().map(|m| serialize_duc_block_metadata(builder, m));

    let thumbnail_vec = collection.thumbnail.as_ref().map(|v| builder.create_vector(v));

    fb::DucBlockCollection::create(
        builder,
        &fb::DucBlockCollectionArgs {
            id: Some(id_offset),
            label: Some(label_offset),
            children: Some(children_vec),
            metadata: metadata_offset,
            thumbnail: thumbnail_vec,
        },
    )
}

fn serialize_duc_frame_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucFrameElement,
) -> WIPOffset<fb::DucFrameElement<'bldr>> {
    let stack_element_base_offset =
        serialize_duc_stack_element_base(builder, &element.stack_element_base);
    fb::DucFrameElement::create(
        builder,
        &fb::DucFrameElementArgs {
            stack_element_base: Some(stack_element_base_offset),
        },
    )
}

fn serialize_plot_layout<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    layout: &types::PlotLayout,
) -> WIPOffset<fb::PlotLayout<'bldr>> {
    let margins_offset = serialize_margins(builder, &layout.margins);
    fb::PlotLayout::create(
        builder,
        &fb::PlotLayoutArgs {
            margins: Some(margins_offset),
        },
    )
}

fn serialize_duc_plot_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucPlotElement,
) -> WIPOffset<fb::DucPlotElement<'bldr>> {
    let stack_element_base_offset =
        serialize_duc_stack_element_base(builder, &element.stack_element_base);
    let style_offset = serialize_duc_plot_style(builder, &element.style);
    let layout_offset = serialize_plot_layout(builder, &element.layout);

    fb::DucPlotElement::create(
        builder,
        &fb::DucPlotElementArgs {
            stack_element_base: Some(stack_element_base_offset),
            style: Some(style_offset),
            layout: Some(layout_offset),
        },
    )
}

fn serialize_duc_viewport_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucViewportElement,
) -> WIPOffset<fb::DucViewportElement<'bldr>> {
    let linear_base_offset = serialize_duc_linear_element_base(builder, &element.linear_base);
    let stack_base_offset = serialize_duc_stack_base(builder, &element.stack_base);
    let style_offset = serialize_duc_viewport_style(builder, &element.style);
    let view_offset = serialize_duc_view(builder, &element.view);
    let frozen_group_ids_vec = serialize_vec_of_strings(builder, &element.frozen_group_ids);
    let standard_override_offset = element
        .standard_override
        .as_deref()
        .map(|s| builder.create_string(s));

    fb::DucViewportElement::create(
        builder,
        &fb::DucViewportElementArgs {
            linear_base: Some(linear_base_offset),
            stack_base: Some(stack_base_offset),
            style: Some(style_offset),
            view: Some(view_offset),
            scale: element.scale,
            shade_plot: Some(element.shade_plot),
            frozen_group_ids: frozen_group_ids_vec,
            standard_override: standard_override_offset,
        },
    )
}

fn serialize_duc_xray_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucXRayElement,
) -> WIPOffset<fb::DucXRayElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let style_offset = serialize_duc_xray_style(builder, &element.style);
    let origin_offset = serialize_duc_point(
        builder,
        &types::DucPoint {
            x: element.origin.x,
            y: element.origin.y,
            mirroring: None,
        },
    );
    let direction_offset = serialize_duc_point(
        builder,
        &types::DucPoint {
            x: element.direction.x,
            y: element.direction.y,
            mirroring: None,
        },
    );

    fb::DucXRayElement::create(
        builder,
        &fb::DucXRayElementArgs {
            base: Some(base_offset),
            style: Some(style_offset),
            origin: Some(origin_offset),
            direction: Some(direction_offset),
            start_from_origin: element.start_from_origin,
        },
    )
}

fn serialize_leader_text_block_content<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    content: &types::LeaderTextBlockContent,
) -> WIPOffset<fb::LeaderTextBlockContent<'bldr>> {
    let text_offset = builder.create_string(&content.text);
    fb::LeaderTextBlockContent::create(
        builder,
        &fb::LeaderTextBlockContentArgs {
            text: Some(text_offset),
        },
    )
}

fn serialize_leader_block_content<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    content: &types::LeaderBlockContent,
) -> WIPOffset<fb::LeaderBlockContent<'bldr>> {
    let block_id_offset = builder.create_string(&content.block_id);
    let attribute_values_vec: Option<
        WIPOffset<
            flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::StringValueEntry<'bldr>>>,
        >,
    > = content
        .attribute_values
        .as_ref()
        .map(|vec_entries: &Vec<types::StringValueEntry>| {
            let offsets: Vec<WIPOffset<fb::StringValueEntry<'bldr>>> = vec_entries
                .iter()
                .map(|a: &types::StringValueEntry| serialize_string_value_entry(builder, a))
                .collect();
            builder.create_vector(&offsets)
        });
    let element_overrides_vec: Option<
        WIPOffset<
            flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::StringValueEntry<'bldr>>>,
        >,
    > = content
        .element_overrides
        .as_ref()
        .map(|vec_entries: &Vec<types::StringValueEntry>| {
            let offsets: Vec<WIPOffset<fb::StringValueEntry<'bldr>>> = vec_entries
                .iter()
                .map(|e: &types::StringValueEntry| serialize_string_value_entry(builder, e))
                .collect();
            builder.create_vector(&offsets)
        });

    fb::LeaderBlockContent::create(
        builder,
        &fb::LeaderBlockContentArgs {
            block_id: Some(block_id_offset),
            attribute_values: attribute_values_vec,
            element_overrides: element_overrides_vec,
        },
    )
}

fn serialize_leader_content<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    content: &types::LeaderContent,
) -> WIPOffset<fb::LeaderContent<'bldr>> {
    let (content_type, content_offset) = match &content.content {
        types::LeaderContentData::LeaderTextBlockContent(c) => (
            fb::LeaderContentData::LeaderTextBlockContent,
            serialize_leader_text_block_content(builder, c).as_union_value(),
        ),
        types::LeaderContentData::LeaderBlockContent(c) => (
            fb::LeaderContentData::LeaderBlockContent,
            serialize_leader_block_content(builder, c).as_union_value(),
        ),
    };

    fb::LeaderContent::create(
        builder,
        &fb::LeaderContentArgs {
            leader_content_type: Some(content.leader_content_type),
            content_type,
            content: Some(content_offset),
        },
    )
}

fn serialize_duc_leader_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucLeaderElement,
) -> WIPOffset<fb::DucLeaderElement<'bldr>> {
    let linear_base_offset = serialize_duc_linear_element_base(builder, &element.linear_base);
    let style_offset = serialize_duc_leader_style(builder, &element.style);
    let content_offset = element
        .content
        .as_ref()
        .map(|c| serialize_leader_content(builder, c));
    let content_anchor = serialize_geometric_point(&element.content_anchor);

    fb::DucLeaderElement::create(
        builder,
        &fb::DucLeaderElementArgs {
            linear_base: Some(linear_base_offset),
            style: Some(style_offset),
            content: content_offset,
            content_anchor: Some(&content_anchor),
        },
    )
}

fn serialize_dimension_definition_points<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    points: &types::DimensionDefinitionPoints,
) -> WIPOffset<fb::DimensionDefinitionPoints<'bldr>> {
    let origin1: fb::GeometricPoint = serialize_geometric_point(&points.origin1);
    let origin2_built: Option<fb::GeometricPoint> =
        points.origin2.as_ref().map(serialize_geometric_point);
    let location: fb::GeometricPoint = serialize_geometric_point(&points.location);
    let center_built: Option<fb::GeometricPoint> =
        points.center.as_ref().map(serialize_geometric_point);
    let jog_built: Option<fb::GeometricPoint> = points.jog.as_ref().map(serialize_geometric_point);

    let origin2_ref: Option<&fb::GeometricPoint> = origin2_built.as_ref();
    let center_ref: Option<&fb::GeometricPoint> = center_built.as_ref();
    let jog_ref: Option<&fb::GeometricPoint> = jog_built.as_ref();

    fb::DimensionDefinitionPoints::create(
        builder,
        &fb::DimensionDefinitionPointsArgs {
            origin1: Some(&origin1),
            origin2: origin2_ref,
            location: Some(&location),
            center: center_ref,
            jog: jog_ref,
        },
    )
}

fn serialize_dimension_bindings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    bindings: &types::DimensionBindings,
) -> WIPOffset<fb::DimensionBindings<'bldr>> {
    let origin1_offset = bindings
        .origin1
        .as_ref()
        .map(|b| serialize_duc_point_binding(builder, b));
    let origin2_offset = bindings
        .origin2
        .as_ref()
        .map(|b| serialize_duc_point_binding(builder, b));
    let center_offset = bindings
        .center
        .as_ref()
        .map(|b| serialize_duc_point_binding(builder, b));

    fb::DimensionBindings::create(
        builder,
        &fb::DimensionBindingsArgs {
            origin1: origin1_offset,
            origin2: origin2_offset,
            center: center_offset,
        },
    )
}

fn serialize_dimension_baseline_data<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    data: &types::DimensionBaselineData,
) -> WIPOffset<fb::DimensionBaselineData<'bldr>> {
    let id_offset = data
        .base_dimension_id
        .as_deref()
        .map(|s| builder.create_string(s));
    fb::DimensionBaselineData::create(
        builder,
        &fb::DimensionBaselineDataArgs {
            base_dimension_id: id_offset,
        },
    )
}

fn serialize_dimension_continue_data<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    data: &types::DimensionContinueData,
) -> WIPOffset<fb::DimensionContinueData<'bldr>> {
    let id_offset = data
        .continue_from_dimension_id
        .as_deref()
        .map(|s| builder.create_string(s));
    fb::DimensionContinueData::create(
        builder,
        &fb::DimensionContinueDataArgs {
            continue_from_dimension_id: id_offset,
        },
    )
}

fn serialize_duc_dimension_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucDimensionElement,
) -> WIPOffset<fb::DucDimensionElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let style_offset = serialize_duc_dimension_style(builder, &element.style);
    let definition_points_offset =
        serialize_dimension_definition_points(builder, &element.definition_points);
    let bindings_offset = element
        .bindings
        .as_ref()
        .map(|b| serialize_dimension_bindings(builder, b));
    let text_override_offset = element
        .text_override
        .as_deref()
        .map(|s| builder.create_string(s));
    let text_position_offset = element
        .text_position
        .as_ref()
        .map(serialize_geometric_point);
    let tolerance_override_offset = element
        .tolerance_override
        .as_ref()
        .map(|t| serialize_dimension_tolerance_style(builder, t));
    let baseline_data_offset = element
        .baseline_data
        .as_ref()
        .map(|d| serialize_dimension_baseline_data(builder, d));
    let continue_data_offset = element
        .continue_data
        .as_ref()
        .map(|d| serialize_dimension_continue_data(builder, d));

    // text_override_offset is Option<WIPOffset<&str>>; keep as-is.
    let args = fb::DucDimensionElementArgs {
        base: Some(base_offset),
        style: Some(style_offset),
        dimension_type: Some(element.dimension_type),
        definition_points: Some(definition_points_offset),
        oblique_angle: element.oblique_angle,
        ordinate_axis: element.ordinate_axis,
        bindings: bindings_offset,
        text_override: text_override_offset,
        text_position: text_position_offset.as_ref(),
        tolerance_override: tolerance_override_offset,
        baseline_data: baseline_data_offset,
        continue_data: continue_data_offset,
    };

    fb::DucDimensionElement::create(builder, &args)
}

fn serialize_datum_reference<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    datum: &types::DatumReference,
) -> WIPOffset<fb::DatumReference<'bldr>> {
    let letters_offset = builder.create_string(&datum.letters);
    fb::DatumReference::create(
        builder,
        &fb::DatumReferenceArgs {
            letters: Some(letters_offset),
            modifier: datum.modifier,
        },
    )
}

fn serialize_tolerance_clause<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    clause: &types::ToleranceClause,
) -> WIPOffset<fb::ToleranceClause<'bldr>> {
    let value_offset = builder.create_string(&clause.value);
    let feature_modifiers_vec =
        builder.create_vector_from_iter(clause.feature_modifiers.iter().copied());
    fb::ToleranceClause::create(
        builder,
        &fb::ToleranceClauseArgs {
            value: Some(value_offset),
            zone_type: clause.zone_type,
            feature_modifiers: Some(feature_modifiers_vec),
            material_condition: clause.material_condition,
        },
    )
}

fn serialize_feature_control_frame_segment<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    segment: &types::FeatureControlFrameSegment,
) -> WIPOffset<fb::FeatureControlFrameSegment<'bldr>> {
    let tolerance_offset = serialize_tolerance_clause(builder, &segment.tolerance);
    let datums_offsets: Vec<Option<WIPOffset<fb::DatumReference<'bldr>>>> = segment
        .datums
        .iter()
        .map(|d| d.as_ref().map(|dr| serialize_datum_reference(builder, dr)))
        .collect();
    let datums_vec =
        builder.create_vector(&datums_offsets.into_iter().flatten().collect::<Vec<_>>());
    fb::FeatureControlFrameSegment::create(
        builder,
        &fb::FeatureControlFrameSegmentArgs {
            symbol: Some(segment.symbol),
            tolerance: Some(tolerance_offset),
            datums: Some(datums_vec),
        },
    )
}

fn serialize_fcf_between_modifier<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    modifier: &types::FCFBetweenModifier,
) -> WIPOffset<fb::FCFBetweenModifier<'bldr>> {
    let start_offset = builder.create_string(&modifier.start);
    let end_offset = builder.create_string(&modifier.end);
    fb::FCFBetweenModifier::create(
        builder,
        &fb::FCFBetweenModifierArgs {
            start: Some(start_offset),
            end: Some(end_offset),
        },
    )
}

fn serialize_fcf_projected_zone_modifier<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    modifier: &types::FCFProjectedZoneModifier,
) -> WIPOffset<fb::FCFProjectedZoneModifier<'bldr>> {
    fb::FCFProjectedZoneModifier::create(
        builder,
        &fb::FCFProjectedZoneModifierArgs {
            value: modifier.value,
        },
    )
}

fn serialize_fcf_frame_modifiers<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    modifiers: &types::FCFFrameModifiers,
) -> WIPOffset<fb::FCFFrameModifiers<'bldr>> {
    let between_offset = modifiers
        .between
        .as_ref()
        .map(|m| serialize_fcf_between_modifier(builder, m));
    let projected_zone_offset = modifiers
        .projected_tolerance_zone
        .as_ref()
        .map(|m| serialize_fcf_projected_zone_modifier(builder, m));
    fb::FCFFrameModifiers::create(
        builder,
        &fb::FCFFrameModifiersArgs {
            all_around: modifiers.all_around,
            all_over: modifiers.all_over,
            continuous_feature: modifiers.continuous_feature,
            between: between_offset,
            projected_tolerance_zone: projected_zone_offset,
        },
    )
}

fn serialize_fcf_datum_definition<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    def: &types::FCFDatumDefinition,
) -> WIPOffset<fb::FCFDatumDefinition<'bldr>> {
    let letter_offset = builder.create_string(&def.letter);
    let feature_binding_offset = def
        .feature_binding
        .as_ref()
        .map(|b| serialize_duc_point_binding(builder, b));
    fb::FCFDatumDefinition::create(
        builder,
        &fb::FCFDatumDefinitionArgs {
            letter: Some(letter_offset),
            feature_binding: feature_binding_offset,
        },
    )
}

fn serialize_fcf_segment_row<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    row: &types::FCFSegmentRow,
) -> WIPOffset<fb::FCFSegmentRow<'bldr>> {
    let segments_offsets: Vec<_> = row
        .segments
        .iter()
        .map(|s| serialize_feature_control_frame_segment(builder, s))
        .collect();
    let segments_vec = builder.create_vector(&segments_offsets);
    fb::FCFSegmentRow::create(
        builder,
        &fb::FCFSegmentRowArgs {
            segments: Some(segments_vec),
        },
    )
}

fn serialize_duc_feature_control_frame_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucFeatureControlFrameElement,
) -> WIPOffset<fb::DucFeatureControlFrameElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let style_offset = serialize_duc_feature_control_frame_style(builder, &element.style);
    let rows_offsets: Vec<_> = element
        .rows
        .iter()
        .map(|r| serialize_fcf_segment_row(builder, r))
        .collect();
    let rows_vec = builder.create_vector(&rows_offsets);
    let frame_modifiers_offset = element
        .frame_modifiers
        .as_ref()
        .map(|m| serialize_fcf_frame_modifiers(builder, m));
    let leader_element_id_offset = element
        .leader_element_id
        .as_ref()
        .map(|id| builder.create_string(id));
    let datum_definition_offset = element
        .datum_definition
        .as_ref()
        .map(|d| serialize_fcf_datum_definition(builder, d));

    fb::DucFeatureControlFrameElement::create(
        builder,
        &fb::DucFeatureControlFrameElementArgs {
            base: Some(base_offset),
            style: Some(style_offset),
            rows: Some(rows_vec),
            frame_modifiers: frame_modifiers_offset,
            leader_element_id: leader_element_id_offset,
            datum_definition: datum_definition_offset,
        },
    )
}

fn serialize_text_column<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    col: &types::TextColumn,
) -> WIPOffset<fb::TextColumn<'bldr>> {
    fb::TextColumn::create(
        builder,
        &fb::TextColumnArgs {
            width: col.width,
            gutter: col.gutter,
        },
    )
}

fn serialize_column_layout<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    layout: &types::ColumnLayout,
) -> WIPOffset<fb::ColumnLayout<'bldr>> {
    let definitions_offsets: Vec<_> = layout
        .definitions
        .iter()
        .map(|d| serialize_text_column(builder, d))
        .collect();
    let definitions_vec = builder.create_vector(&definitions_offsets);
    fb::ColumnLayout::create(
        builder,
        &fb::ColumnLayoutArgs {
            type_: Some(layout.column_type),
            definitions: Some(definitions_vec),
            auto_height: layout.auto_height,
        },
    )
}

fn serialize_document_grid_config<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    config: &types::DocumentGridConfig,
) -> WIPOffset<fb::DocumentGridConfig<'bldr>> {
    fb::DocumentGridConfig::create(
        builder,
        &fb::DocumentGridConfigArgs {
            columns: config.columns,
            gap_x: config.gap_x,
            gap_y: config.gap_y,
            align_items: Some(config.align_items.into()),
            first_page_alone: config.first_page_alone,
            scale: config.scale,
        },
    )
}

fn serialize_duc_doc_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucDocElement,
) -> WIPOffset<fb::DucDocElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let style_offset = serialize_duc_doc_style(builder, &element.style);
    let text_offset = builder.create_string(&element.text);
    let dynamic_offsets: Vec<WIPOffset<fb::DucTextDynamicPart<'bldr>>> = element
        .dynamic
        .iter()
        .map(|p| serialize_duc_text_dynamic_part(builder, p))
        .collect();
    let dynamic_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucTextDynamicPart<'bldr>>>,
    > = builder.create_vector(&dynamic_offsets);
    let columns_offset = serialize_column_layout(builder, &element.columns);
    let file_id_offset = element.file_id.as_deref().map(|s| builder.create_string(s));
    let grid_config_offset = serialize_document_grid_config(builder, &element.grid_config);

    fb::DucDocElement::create(
        builder,
        &fb::DucDocElementArgs {
            base: Some(base_offset),
            style: Some(style_offset),
            text: Some(text_offset),
            dynamic: Some(dynamic_vec),
            flow_direction: Some(element.flow_direction),
            columns: Some(columns_offset),
            auto_resize: element.auto_resize,
            file_id: file_id_offset,
            grid_config: Some(grid_config_offset),
        },
    )
}

fn serialize_parametric_source<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    source: &types::ParametricSource,
) -> WIPOffset<fb::ParametricSource<'bldr>> {
    let code_offset = builder.create_string(&source.code);
    let file_id_offset = source.file_id.as_deref().map(|s| builder.create_string(s));
    fb::ParametricSource::create(
        builder,
        &fb::ParametricSourceArgs {
            type_: Some(source.source_type),
            code: Some(code_offset),
            file_id: file_id_offset,
        },
    )
}

fn serialize_duc_parametric_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucParametricElement,
) -> WIPOffset<fb::DucParametricElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let source_offset = serialize_parametric_source(builder, &element.source);
    fb::DucParametricElement::create(
        builder,
        &fb::DucParametricElementArgs {
            base: Some(base_offset),
            source: Some(source_offset),
        },
    )
}

fn serialize_duc_model_element<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    element: &types::DucModelElement,
) -> WIPOffset<fb::DucModelElement<'bldr>> {
    let base_offset = serialize_duc_element_base(builder, &element.base);
    let source_offset = builder.create_string(&element.source);
    let svg_path_offset = element.svg_path.as_deref().map(|s| builder.create_string(s));
    let file_id_offsets: Vec<_> = element.file_ids.iter().map(|s| builder.create_string(s)).collect();
    let file_ids_vec = if !file_id_offsets.is_empty() {
        Some(builder.create_vector(&file_id_offsets))
    } else {
        None
    };
    fb::DucModelElement::create(
        builder,
        &fb::DucModelElementArgs {
            base: Some(base_offset),
            source: Some(source_offset),
            svg_path: svg_path_offset,
            file_ids: file_ids_vec,
        },
    )
}

// =============================================================================
// ELEMENT UNION & WRAPPER
// =============================================================================

fn serialize_element_wrapper<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    wrapper: &types::ElementWrapper,
) -> WIPOffset<fb::ElementWrapper<'bldr>> {
    let (element_type, element_offset) = match &wrapper.element {
        types::DucElementEnum::DucRectangleElement(e) => (
            fb::Element::DucRectangleElement,
            serialize_duc_rectangle_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucPolygonElement(e) => (
            fb::Element::DucPolygonElement,
            serialize_duc_polygon_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucEllipseElement(e) => (
            fb::Element::DucEllipseElement,
            serialize_duc_ellipse_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucEmbeddableElement(e) => (
            fb::Element::DucEmbeddableElement,
            serialize_duc_embeddable_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucPdfElement(e) => (
            fb::Element::DucPdfElement,
            serialize_duc_pdf_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucMermaidElement(e) => (
            fb::Element::DucMermaidElement,
            serialize_duc_mermaid_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucTableElement(e) => (
            fb::Element::DucTableElement,
            serialize_duc_table_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucImageElement(e) => (
            fb::Element::DucImageElement,
            serialize_duc_image_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucTextElement(e) => (
            fb::Element::DucTextElement,
            serialize_duc_text_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucLinearElement(e) => (
            fb::Element::DucLinearElement,
            serialize_duc_linear_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucArrowElement(e) => (
            fb::Element::DucArrowElement,
            serialize_duc_arrow_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucFreeDrawElement(e) => (
            fb::Element::DucFreeDrawElement,
            serialize_duc_free_draw_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucFrameElement(e) => (
            fb::Element::DucFrameElement,
            serialize_duc_frame_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucPlotElement(e) => (
            fb::Element::DucPlotElement,
            serialize_duc_plot_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucViewportElement(e) => (
            fb::Element::DucViewportElement,
            serialize_duc_viewport_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucXRayElement(e) => (
            fb::Element::DucXRayElement,
            serialize_duc_xray_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucLeaderElement(e) => (
            fb::Element::DucLeaderElement,
            serialize_duc_leader_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucDimensionElement(e) => (
            fb::Element::DucDimensionElement,
            serialize_duc_dimension_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucFeatureControlFrameElement(e) => (
            fb::Element::DucFeatureControlFrameElement,
            serialize_duc_feature_control_frame_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucDocElement(e) => (
            fb::Element::DucDocElement,
            serialize_duc_doc_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucParametricElement(e) => (
            fb::Element::DucParametricElement,
            serialize_duc_parametric_element(builder, e).as_union_value(),
        ),
        types::DucElementEnum::DucModelElement(e) => (
            fb::Element::DucModelElement,
            serialize_duc_model_element(builder, e).as_union_value(),
        ),
    };

    fb::ElementWrapper::create(
        builder,
        &fb::ElementWrapperArgs {
            element_type,
            element: Some(element_offset),
        },
    )
}

// =============================================================================
// BLOCK DEFINITIONS
// =============================================================================

fn serialize_duc_block_attribute_definition<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    def: &types::DucBlockAttributeDefinition,
) -> WIPOffset<fb::DucBlockAttributeDefinition<'bldr>> {
    let tag_offset = builder.create_string(&def.tag);
    let prompt_offset = def.prompt.as_ref().map(|s| builder.create_string(s));
    let default_value_offset = builder.create_string(&def.default_value);

    fb::DucBlockAttributeDefinition::create(
        builder,
        &fb::DucBlockAttributeDefinitionArgs {
            tag: Some(tag_offset),
            prompt: prompt_offset,
            default_value: Some(default_value_offset),
            is_constant: def.is_constant,
        },
    )
}

fn serialize_duc_block_attribute_definition_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::DucBlockAttributeDefinitionEntry,
) -> WIPOffset<fb::DucBlockAttributeDefinitionEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = serialize_duc_block_attribute_definition(builder, &entry.value);
    fb::DucBlockAttributeDefinitionEntry::create(
        builder,
        &fb::DucBlockAttributeDefinitionEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

pub fn serialize_duc_block_metadata<'bldr>(
    builder: &mut flatbuffers::FlatBufferBuilder<'bldr>,
    metadata: &types::DucBlockMetadata,
) -> WIPOffset<fb::DucBlockMetadata<'bldr>> {
    let source_offset = metadata.source.as_ref().map(|s| builder.create_string(s));

    // Compress localization JSON and create byte vector
    let localization_offset = metadata
        .localization
        .as_ref()
        .map(|s| {
            let compressed = compress_string(s);
            builder.create_vector::<u8>(&compressed)
        });

    fb::DucBlockMetadata::create(
        builder,
        &fb::DucBlockMetadataArgs {
            source: source_offset,
            usage_count: metadata.usage_count,
            created_at: metadata.created_at,
            updated_at: metadata.updated_at,
            localization: localization_offset,
        },
    )
}

fn serialize_duc_block<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    block: &types::DucBlock,
) -> WIPOffset<fb::DucBlock<'bldr>> {
    let id_offset = builder.create_string(&block.id);
    let label_offset = builder.create_string(&block.label);
    let description_offset: Option<WIPOffset<&'bldr str>> = block
        .description
        .as_ref()
        .map(|s| builder.create_string(s.as_str()));

    let attribute_definitions_offsets: Vec<_> = block
        .attribute_definitions
        .iter()
        .map(|ad| serialize_duc_block_attribute_definition_entry(builder, ad))
        .collect();
    let attribute_definitions_vec = builder.create_vector(&attribute_definitions_offsets);

    let metadata_offset: Option<WIPOffset<fb::DucBlockMetadata<'bldr>>> = block
        .metadata
        .as_ref()
        .map(|metadata| serialize_duc_block_metadata(builder, metadata));

    let thumbnail_offset = block
        .thumbnail
        .as_ref()
        .filter(|data| !data.is_empty())
        .map(|data| builder.create_vector(data));

    fb::DucBlock::create(
        builder,
        &fb::DucBlockArgs {
            id: Some(id_offset),
            label: Some(label_offset),
            description: description_offset,
            version: block.version,
            attribute_definitions: Some(attribute_definitions_vec),
            metadata: metadata_offset,
            thumbnail: thumbnail_offset,
        },
    )
}

// =============================================================================
// APP & DOCUMENT STATE
// =============================================================================

fn serialize_duc_global_state<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    state: &types::DucGlobalState,
) -> WIPOffset<fb::DucGlobalState<'bldr>> {
    let name_offset = state.name.as_ref().map(|s| builder.create_string(s));
    let view_background_color_offset = builder.create_string(&state.view_background_color);
    let main_scope_offset = builder.create_string(&state.main_scope);

    fb::DucGlobalState::create(
        builder,
        &fb::DucGlobalStateArgs {
            name: name_offset,
            view_background_color: Some(view_background_color_offset),
            main_scope: Some(main_scope_offset),
            dash_spacing_scale: state.dash_spacing_scale,
            is_dash_spacing_affected_by_viewport_scale: state
                .is_dash_spacing_affected_by_viewport_scale,
            scope_exponent_threshold: state.scope_exponent_threshold,
            dimensions_associative_by_default: state.dimensions_associative_by_default,
            use_annotative_scaling: state.use_annotative_scaling,
            display_precision_linear: state.display_precision_linear,
            display_precision_angular: state.display_precision_angular,
            pruning_level: Some(state.pruning_level),
        },
    )
}

fn serialize_duc_local_state<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    state: &types::DucLocalState,
) -> WIPOffset<fb::DucLocalState<'bldr>> {
    let scope_offset = builder.create_string(&state.scope);
    let active_standard_id_offset = builder.create_string(&state.active_standard_id);
    let active_grid_settings_vec = state
        .active_grid_settings
        .as_ref()
        .and_then(|v| serialize_vec_of_strings(builder, v));
    let active_snap_settings_offset = state
        .active_snap_settings
        .as_ref()
        .map(|s| builder.create_string(s));
    let current_item_stroke_offset =
        serialize_element_stroke(builder, state.current_item_stroke.as_ref().unwrap());
    let current_item_background_offset =
        serialize_element_background(builder, state.current_item_background.as_ref().unwrap());
    let current_item_font_family_offset = builder.create_string(&state.current_item_font_family);
    let current_item_start_line_head_offset = state
        .current_item_start_line_head
        .as_ref()
        .map(|h| serialize_duc_head(builder, h));
    let current_item_end_line_head_offset = state
        .current_item_end_line_head
        .as_ref()
        .map(|h| serialize_duc_head(builder, h));

    fb::DucLocalState::create(
        builder,
        &fb::DucLocalStateArgs {
            scope: Some(scope_offset),
            active_standard_id: Some(active_standard_id_offset),
            scroll_x: state.scroll_x,
            scroll_y: state.scroll_y,
            zoom: state.zoom,
            active_grid_settings: active_grid_settings_vec,
            active_snap_settings: active_snap_settings_offset,
            is_binding_enabled: state.is_binding_enabled,
            current_item_stroke: Some(current_item_stroke_offset),
            current_item_background: Some(current_item_background_offset),
            current_item_opacity: state.current_item_opacity,
            current_item_font_family: Some(current_item_font_family_offset),
            current_item_font_size: state.current_item_font_size,
            current_item_text_align: Some(state.current_item_text_align),
            current_item_start_line_head: current_item_start_line_head_offset,
            current_item_end_line_head: current_item_end_line_head_offset,
            current_item_roundness: state.current_item_roundness,
            pen_mode: state.pen_mode,
            view_mode_enabled: state.view_mode_enabled,
            objects_snap_mode_enabled: state.objects_snap_mode_enabled,
            grid_mode_enabled: state.grid_mode_enabled,
            outline_mode_enabled: state.outline_mode_enabled,
            manual_save_mode: state.manual_save_mode,
        },
    )
}

fn serialize_duc_group<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    group: &types::DucGroup,
) -> WIPOffset<fb::DucGroup<'bldr>> {
    let id_offset = builder.create_string(&group.id);
    let stack_base_offset = serialize_duc_stack_base(builder, &group.stack_base);
    fb::DucGroup::create(
        builder,
        &fb::DucGroupArgs {
            id: Some(id_offset),
            stack_base: Some(stack_base_offset),
        },
    )
}

fn serialize_duc_region<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    region: &types::DucRegion,
) -> WIPOffset<fb::DucRegion<'bldr>> {
    let id_offset = builder.create_string(&region.id);
    let stack_base_offset = serialize_duc_stack_base(builder, &region.stack_base);
    fb::DucRegion::create(
        builder,
        &fb::DucRegionArgs {
            id: Some(id_offset),
            stack_base: Some(stack_base_offset),
            boolean_operation: Some(region.boolean_operation),
        },
    )
}

fn serialize_duc_layer_overrides<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    overrides: &types::DucLayerOverrides,
) -> WIPOffset<fb::DucLayerOverrides<'bldr>> {
    let stroke_offset = serialize_element_stroke(builder, &overrides.stroke);
    let background_offset = serialize_element_background(builder, &overrides.background);
    fb::DucLayerOverrides::create(
        builder,
        &fb::DucLayerOverridesArgs {
            stroke: Some(stroke_offset),
            background: Some(background_offset),
        },
    )
}

fn serialize_duc_layer<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    layer: &types::DucLayer,
) -> WIPOffset<fb::DucLayer<'bldr>> {
    let id_offset = builder.create_string(&layer.id);
    let stack_base_offset = serialize_duc_stack_base(builder, &layer.stack_base);
    let overrides_offset = layer
        .overrides
        .as_ref()
        .map(|o| serialize_duc_layer_overrides(builder, o));
    fb::DucLayer::create(
        builder,
        &fb::DucLayerArgs {
            id: Some(id_offset),
            stack_base: Some(stack_base_offset),
            readonly: layer.readonly,
            overrides: overrides_offset,
        },
    )
}

// =============================================================================
// STANDARDS & SETTINGS
// =============================================================================

fn serialize_unit_system_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    base: &types::UnitSystemBase,
) -> WIPOffset<fb::_UnitSystemBase<'bldr>> {
    fb::_UnitSystemBase::create(
        builder,
        &fb::_UnitSystemBaseArgs {
            system: Some(base.system),
            precision: base.precision,
            suppress_leading_zeros: base.suppress_leading_zeros,
            suppress_trailing_zeros: base.suppress_trailing_zeros,
        },
    )
}

fn serialize_linear_unit_system<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    sys: &types::LinearUnitSystem,
) -> WIPOffset<fb::LinearUnitSystem<'bldr>> {
    let base_offset = serialize_unit_system_base(builder, &sys.base);
    fb::LinearUnitSystem::create(
        builder,
        &fb::LinearUnitSystemArgs {
            base: Some(base_offset),
            format: Some(sys.format),
            decimal_separator: Some(sys.decimal_separator),
            suppress_zero_feet: sys.suppress_zero_feet,
            suppress_zero_inches: sys.suppress_zero_inches,
        },
    )
}

fn serialize_angular_unit_system<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    sys: &types::AngularUnitSystem,
) -> WIPOffset<fb::AngularUnitSystem<'bldr>> {
    let base_offset = serialize_unit_system_base(builder, &sys.base);
    fb::AngularUnitSystem::create(
        builder,
        &fb::AngularUnitSystemArgs {
            base: Some(base_offset),
            format: Some(sys.format),
        },
    )
}

fn serialize_alternate_units<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    units: &types::AlternateUnits,
) -> WIPOffset<fb::AlternateUnits<'bldr>> {
    let base_offset = serialize_unit_system_base(builder, &units.base);
    fb::AlternateUnits::create(
        builder,
        &fb::AlternateUnitsArgs {
            base: Some(base_offset),
            format: Some(units.format),
            is_visible: units.is_visible,
            multiplier: units.multiplier,
        },
    )
}

fn serialize_primary_units<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    units: &types::PrimaryUnits,
) -> WIPOffset<fb::PrimaryUnits<'bldr>> {
    let linear_offset = serialize_linear_unit_system(builder, &units.linear);
    let angular_offset = serialize_angular_unit_system(builder, &units.angular);
    fb::PrimaryUnits::create(
        builder,
        &fb::PrimaryUnitsArgs {
            linear: Some(linear_offset),
            angular: Some(angular_offset),
        },
    )
}

fn serialize_standard_units<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    units: &types::StandardUnits,
) -> WIPOffset<fb::StandardUnits<'bldr>> {
    let primary_units_offset = serialize_primary_units(builder, &units.primary_units);
    let alternate_units_offset = serialize_alternate_units(builder, &units.alternate_units);
    fb::StandardUnits::create(
        builder,
        &fb::StandardUnitsArgs {
            primary_units: Some(primary_units_offset),
            alternate_units: Some(alternate_units_offset),
        },
    )
}

fn serialize_unit_precision<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    precision: &types::UnitPrecision,
) -> WIPOffset<fb::UnitPrecision<'bldr>> {
    fb::UnitPrecision::create(
        builder,
        &fb::UnitPrecisionArgs {
            linear: precision.linear.unwrap_or(0),
            angular: precision.angular.unwrap_or(0),
            area: precision.area.unwrap_or(0),
            volume: precision.volume.unwrap_or(0),
        },
    )
}

fn serialize_standard_overrides<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    overrides: &types::StandardOverrides,
) -> WIPOffset<fb::StandardOverrides<'bldr>> {
    let main_scope_offset = overrides
        .main_scope
        .as_ref()
        .map(|s| builder.create_string(s));
    let common_style_id_offset = overrides
        .common_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let stack_like_style_id_offset = overrides
        .stack_like_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let text_style_id_offset = overrides
        .text_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let dimension_style_id_offset = overrides
        .dimension_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let leader_style_id_offset = overrides
        .leader_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let fcf_style_id_offset = overrides
        .feature_control_frame_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let table_style_id_offset = overrides
        .table_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let doc_style_id_offset = overrides
        .doc_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let viewport_style_id_offset = overrides
        .viewport_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let plot_style_id_offset = overrides
        .plot_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let hatch_style_id_offset = overrides
        .hatch_style_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let active_grid_settings_id_vec = overrides
        .active_grid_settings_id
        .as_ref()
        .and_then(|v| serialize_vec_of_strings(builder, v));
    let active_snap_settings_id_offset = overrides
        .active_snap_settings_id
        .as_ref()
        .map(|s| builder.create_string(s));
    let dash_line_override_offset = overrides
        .dash_line_override
        .as_ref()
        .map(|s| builder.create_string(s));
    let unit_precision_offset = overrides
        .unit_precision
        .as_ref()
        .map(|u| serialize_unit_precision(builder, u));

    fb::StandardOverrides::create(
        builder,
        &fb::StandardOverridesArgs {
            main_scope: main_scope_offset,
            elements_stroke_width_override: overrides.elements_stroke_width_override.unwrap_or(0.0),
            common_style_id: common_style_id_offset,
            stack_like_style_id: stack_like_style_id_offset,
            text_style_id: text_style_id_offset,
            dimension_style_id: dimension_style_id_offset,
            leader_style_id: leader_style_id_offset,
            feature_control_frame_style_id: fcf_style_id_offset,
            table_style_id: table_style_id_offset,
            doc_style_id: doc_style_id_offset,
            viewport_style_id: viewport_style_id_offset,
            plot_style_id: plot_style_id_offset,
            hatch_style_id: hatch_style_id_offset,
            active_grid_settings_id: active_grid_settings_id_vec,
            active_snap_settings_id: active_snap_settings_id_offset,
            dash_line_override: dash_line_override_offset,
            unit_precision: unit_precision_offset,
        },
    )
}

fn serialize_duc_common_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::DucCommonStyle,
) -> WIPOffset<fb::DucCommonStyle<'bldr>> {
    let background_offset = serialize_element_background(builder, &style.background);
    let stroke_offset = serialize_element_stroke(builder, &style.stroke);
    fb::DucCommonStyle::create(
        builder,
        &fb::DucCommonStyleArgs {
            background: Some(background_offset),
            stroke: Some(stroke_offset),
        },
    )
}

fn serialize_identified_common_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedCommonStyle,
) -> WIPOffset<fb::IdentifiedCommonStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_common_style(builder, &style.style);
    fb::IdentifiedCommonStyle::create(
        builder,
        &fb::IdentifiedCommonStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_stack_like_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedStackLikeStyle,
) -> WIPOffset<fb::IdentifiedStackLikeStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_stack_like_styles(builder, &style.style);
    fb::IdentifiedStackLikeStyle::create(
        builder,
        &fb::IdentifiedStackLikeStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_text_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedTextStyle,
) -> WIPOffset<fb::IdentifiedTextStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_text_style(builder, &style.style);
    fb::IdentifiedTextStyle::create(
        builder,
        &fb::IdentifiedTextStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_dimension_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedDimensionStyle,
) -> WIPOffset<fb::IdentifiedDimensionStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_dimension_style(builder, &style.style);
    fb::IdentifiedDimensionStyle::create(
        builder,
        &fb::IdentifiedDimensionStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_leader_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedLeaderStyle,
) -> WIPOffset<fb::IdentifiedLeaderStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_leader_style(builder, &style.style);
    fb::IdentifiedLeaderStyle::create(
        builder,
        &fb::IdentifiedLeaderStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_fcf_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedFCFStyle,
) -> WIPOffset<fb::IdentifiedFCFStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_feature_control_frame_style(builder, &style.style);
    fb::IdentifiedFCFStyle::create(
        builder,
        &fb::IdentifiedFCFStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_table_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedTableStyle,
) -> WIPOffset<fb::IdentifiedTableStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_table_style(builder, &style.style);
    fb::IdentifiedTableStyle::create(
        builder,
        &fb::IdentifiedTableStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_doc_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedDocStyle,
) -> WIPOffset<fb::IdentifiedDocStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_doc_style(builder, &style.style);
    fb::IdentifiedDocStyle::create(
        builder,
        &fb::IdentifiedDocStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_viewport_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedViewportStyle,
) -> WIPOffset<fb::IdentifiedViewportStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_viewport_style(builder, &style.style);
    fb::IdentifiedViewportStyle::create(
        builder,
        &fb::IdentifiedViewportStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_hatch_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedHatchStyle,
) -> WIPOffset<fb::IdentifiedHatchStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_hatch_style(builder, &style.style);
    fb::IdentifiedHatchStyle::create(
        builder,
        &fb::IdentifiedHatchStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_identified_xray_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::IdentifiedXRayStyle,
) -> WIPOffset<fb::IdentifiedXRayStyle<'bldr>> {
    let id_offset = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_xray_style(builder, &style.style);
    fb::IdentifiedXRayStyle::create(
        builder,
        &fb::IdentifiedXRayStyleArgs {
            id: Some(id_offset),
            style: Some(style_offset),
        },
    )
}

fn serialize_standard_styles<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    styles: &types::StandardStyles,
) -> WIPOffset<fb::StandardStyles<'bldr>> {
    let common_styles_offsets: Vec<_> = styles
        .common_styles
        .iter()
        .map(|s| serialize_identified_common_style(builder, s))
        .collect();
    let common_styles_vec = builder.create_vector(&common_styles_offsets);

    let stack_like_styles_offsets: Vec<_> = styles
        .stack_like_styles
        .iter()
        .map(|s| serialize_identified_stack_like_style(builder, s))
        .collect();
    let stack_like_styles_vec = builder.create_vector(&stack_like_styles_offsets);

    let text_styles_offsets: Vec<_> = styles
        .text_styles
        .iter()
        .map(|s| serialize_identified_text_style(builder, s))
        .collect();
    let text_styles_vec = builder.create_vector(&text_styles_offsets);

    let dimension_styles_offsets: Vec<_> = styles
        .dimension_styles
        .iter()
        .map(|s| serialize_identified_dimension_style(builder, s))
        .collect();
    let dimension_styles_vec = builder.create_vector(&dimension_styles_offsets);

    let leader_styles_offsets: Vec<_> = styles
        .leader_styles
        .iter()
        .map(|s| serialize_identified_leader_style(builder, s))
        .collect();
    let leader_styles_vec = builder.create_vector(&leader_styles_offsets);

    let fcf_styles_offsets: Vec<_> = styles
        .feature_control_frame_styles
        .iter()
        .map(|s| serialize_identified_fcf_style(builder, s))
        .collect();
    let fcf_styles_vec = builder.create_vector(&fcf_styles_offsets);

    let table_styles_offsets: Vec<_> = styles
        .table_styles
        .iter()
        .map(|s| serialize_identified_table_style(builder, s))
        .collect();
    let table_styles_vec = builder.create_vector(&table_styles_offsets);

    let doc_styles_offsets: Vec<_> = styles
        .doc_styles
        .iter()
        .map(|s| serialize_identified_doc_style(builder, s))
        .collect();
    let doc_styles_vec = builder.create_vector(&doc_styles_offsets);

    let viewport_styles_offsets: Vec<_> = styles
        .viewport_styles
        .iter()
        .map(|s| serialize_identified_viewport_style(builder, s))
        .collect();
    let viewport_styles_vec = builder.create_vector(&viewport_styles_offsets);

    let hatch_styles_offsets: Vec<_> = styles
        .hatch_styles
        .iter()
        .map(|s| serialize_identified_hatch_style(builder, s))
        .collect();
    let hatch_styles_vec = builder.create_vector(&hatch_styles_offsets);

    let xray_styles_offsets: Vec<_> = styles
        .xray_styles
        .iter()
        .map(|s| serialize_identified_xray_style(builder, s))
        .collect();
    let xray_styles_vec = builder.create_vector(&xray_styles_offsets);

    fb::StandardStyles::create(
        builder,
        &fb::StandardStylesArgs {
            common_styles: Some(common_styles_vec),
            stack_like_styles: Some(stack_like_styles_vec),
            text_styles: Some(text_styles_vec),
            dimension_styles: Some(dimension_styles_vec),
            leader_styles: Some(leader_styles_vec),
            feature_control_frame_styles: Some(fcf_styles_vec),
            table_styles: Some(table_styles_vec),
            doc_styles: Some(doc_styles_vec),
            viewport_styles: Some(viewport_styles_vec),
            hatch_styles: Some(hatch_styles_vec),
            xray_styles: Some(xray_styles_vec),
        },
    )
}

fn serialize_grid_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::GridStyle,
) -> WIPOffset<fb::GridStyle<'bldr>> {
    let color_offset = builder.create_string(&style.color);
    let dash_pattern_vec = builder.create_vector(&style.dash_pattern);
    fb::GridStyle::create(
        builder,
        &fb::GridStyleArgs {
            color: Some(color_offset),
            opacity: style.opacity,
            dash_pattern: Some(dash_pattern_vec),
        },
    )
}

fn serialize_polar_grid_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::PolarGridSettings,
) -> WIPOffset<fb::PolarGridSettings<'bldr>> {
    fb::PolarGridSettings::create(
        builder,
        &fb::PolarGridSettingsArgs {
            radial_divisions: settings.radial_divisions,
            radial_spacing: settings.radial_spacing,
            show_labels: settings.show_labels,
        },
    )
}

fn serialize_isometric_grid_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::IsometricGridSettings,
) -> WIPOffset<fb::IsometricGridSettings<'bldr>> {
    fb::IsometricGridSettings::create(
        builder,
        &fb::IsometricGridSettingsArgs {
            left_angle: settings.left_angle,
            right_angle: settings.right_angle,
        },
    )
}

fn serialize_grid_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::GridSettings,
) -> WIPOffset<fb::GridSettings<'bldr>> {
    let origin = serialize_geometric_point(&settings.origin);
    let major_style_offset = serialize_grid_style(builder, &settings.major_style);
    let minor_style_offset = serialize_grid_style(builder, &settings.minor_style);
    let polar_settings_offset = settings
        .polar_settings
        .as_ref()
        .map(|s| serialize_polar_grid_settings(builder, s));
    let isometric_settings_offset = settings
        .isometric_settings
        .as_ref()
        .map(|s| serialize_isometric_grid_settings(builder, s));

    fb::GridSettings::create(
        builder,
        &fb::GridSettingsArgs {
            type_: Some(settings.grid_type),
            readonly: settings.readonly,
            display_type: Some(settings.display_type),
            is_adaptive: settings.is_adaptive,
            x_spacing: settings.x_spacing,
            y_spacing: settings.y_spacing,
            subdivisions: settings.subdivisions,
            origin: Some(&origin),
            rotation: settings.rotation,
            follow_ucs: settings.follow_ucs,
            major_style: Some(major_style_offset),
            minor_style: Some(minor_style_offset),
            show_minor: settings.show_minor,
            min_zoom: settings.min_zoom,
            max_zoom: settings.max_zoom,
            auto_hide: settings.auto_hide,
            polar_settings: polar_settings_offset,
            isometric_settings: isometric_settings_offset,
            enable_snapping: settings.enable_snapping,
        },
    )
}

fn serialize_snap_override<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    so: &types::SnapOverride,
) -> WIPOffset<fb::SnapOverride<'bldr>> {
    let key_offset = builder.create_string(&so.key);
    fb::SnapOverride::create(
        builder,
        &fb::SnapOverrideArgs {
            key: Some(key_offset),
            behavior: so.behavior,
        },
    )
}

fn serialize_dynamic_snap_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::DynamicSnapSettings,
) -> WIPOffset<fb::DynamicSnapSettings<'bldr>> {
    fb::DynamicSnapSettings::create(
        builder,
        &fb::DynamicSnapSettingsArgs {
            enabled_during_drag: settings.enabled_during_drag,
            enabled_during_rotation: settings.enabled_during_rotation,
            enabled_during_scale: settings.enabled_during_scale,
        },
    )
}

fn serialize_polar_tracking_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::PolarTrackingSettings,
) -> WIPOffset<fb::PolarTrackingSettings<'bldr>> {
    let angles_vec = builder.create_vector(&settings.angles);
    fb::PolarTrackingSettings::create(
        builder,
        &fb::PolarTrackingSettingsArgs {
            enabled: settings.enabled,
            angles: Some(angles_vec),
            increment_angle: settings.increment_angle.unwrap_or(0.0),
            track_from_last_point: settings.track_from_last_point,
            show_polar_coordinates: settings.show_polar_coordinates,
        },
    )
}

fn serialize_tracking_line_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::TrackingLineStyle,
) -> WIPOffset<fb::TrackingLineStyle<'bldr>> {
    let color_offset = builder.create_string(&style.color);
    let dash_pattern_vec = style
        .dash_pattern
        .as_ref()
        .map(|v| builder.create_vector(v));
    fb::TrackingLineStyle::create(
        builder,
        &fb::TrackingLineStyleArgs {
            color: Some(color_offset),
            opacity: style.opacity,
            dash_pattern: dash_pattern_vec,
        },
    )
}

fn serialize_layer_snap_filters<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    filters: &types::LayerSnapFilters,
) -> WIPOffset<fb::LayerSnapFilters<'bldr>> {
    let include_layers_vec = filters
        .include_layers
        .as_ref()
        .and_then(|v| serialize_vec_of_strings(builder, v));
    let exclude_layers_vec = filters
        .exclude_layers
        .as_ref()
        .and_then(|v| serialize_vec_of_strings(builder, v));
    fb::LayerSnapFilters::create(
        builder,
        &fb::LayerSnapFiltersArgs {
            include_layers: include_layers_vec,
            exclude_layers: exclude_layers_vec,
        },
    )
}

fn serialize_snap_marker_style<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    style: &types::SnapMarkerStyle,
) -> WIPOffset<fb::SnapMarkerStyle<'bldr>> {
    let color_offset = builder.create_string(&style.color);
    fb::SnapMarkerStyle::create(
        builder,
        &fb::SnapMarkerStyleArgs {
            shape: Some(style.shape),
            color: Some(color_offset),
        },
    )
}

fn serialize_snap_marker_style_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::SnapMarkerStyleEntry,
) -> WIPOffset<fb::SnapMarkerStyleEntry<'bldr>> {
    let value_offset = serialize_snap_marker_style(builder, &entry.value);
    fb::SnapMarkerStyleEntry::create(
        builder,
        &fb::SnapMarkerStyleEntryArgs {
            key: Some(entry.key),
            value: Some(value_offset),
        },
    )
}

fn serialize_snap_marker_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::SnapMarkerSettings,
) -> WIPOffset<fb::SnapMarkerSettings<'bldr>> {
    let styles_offsets: Vec<_> = settings
        .styles
        .iter()
        .map(|s| serialize_snap_marker_style_entry(builder, s))
        .collect();
    let styles_vec = builder.create_vector(&styles_offsets);
    fb::SnapMarkerSettings::create(
        builder,
        &fb::SnapMarkerSettingsArgs {
            enabled: settings.enabled,
            size: settings.size,
            duration: settings.duration.unwrap_or(0),
            styles: Some(styles_vec),
        },
    )
}

fn serialize_snap_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::SnapSettings,
) -> WIPOffset<fb::SnapSettings<'bldr>> {
    let polar_tracking_offset =
        serialize_polar_tracking_settings(builder, &settings.polar_tracking);
    let active_object_snap_modes_vec =
        builder.create_vector_from_iter(settings.active_object_snap_modes.iter().copied());
    let snap_priority_vec = builder.create_vector_from_iter(settings.snap_priority.iter().copied());
    let tracking_line_style_offset = settings
        .tracking_line_style
        .as_ref()
        .map(|s| serialize_tracking_line_style(builder, s));
    let dynamic_snap_offset = serialize_dynamic_snap_settings(builder, &settings.dynamic_snap);
    let temporary_overrides_offsets: Vec<_> = settings
        .temporary_overrides
        .as_ref()
        .map(|v| {
            v.iter()
                .map(|o| serialize_snap_override(builder, o))
                .collect()
        })
        .unwrap_or_else(|| Vec::new());
    let temporary_overrides_vec = if temporary_overrides_offsets.is_empty() {
        None
    } else {
        Some(builder.create_vector(&temporary_overrides_offsets))
    };
    let layer_snap_filters_offset = settings
        .layer_snap_filters
        .as_ref()
        .map(|s| serialize_layer_snap_filters(builder, s));
    let element_type_filters_vec = settings
        .element_type_filters
        .as_ref()
        .and_then(|v| serialize_vec_of_strings(builder, v));
    let snap_markers_offset = serialize_snap_marker_settings(builder, &settings.snap_markers);

    fb::SnapSettings::create(
        builder,
        &fb::SnapSettingsArgs {
            readonly: settings.readonly,
            twist_angle: settings.twist_angle,
            snap_tolerance: settings.snap_tolerance,
            object_snap_aperture: settings.object_snap_aperture,
            is_ortho_mode_on: settings.is_ortho_mode_on,
            polar_tracking: Some(polar_tracking_offset),
            is_object_snap_on: settings.is_object_snap_on,
            active_object_snap_modes: Some(active_object_snap_modes_vec),
            snap_priority: Some(snap_priority_vec),
            show_tracking_lines: settings.show_tracking_lines,
            tracking_line_style: tracking_line_style_offset,
            dynamic_snap: Some(dynamic_snap_offset),
            temporary_overrides: temporary_overrides_vec,
            incremental_distance: settings.incremental_distance.unwrap_or(0.0),
            magnetic_strength: settings.magnetic_strength.unwrap_or(0.0),
            layer_snap_filters: layer_snap_filters_offset,
            element_type_filters: element_type_filters_vec,
            snap_mode: Some(settings.snap_mode),
            snap_markers: Some(snap_markers_offset),
            construction_snap_enabled: settings.construction_snap_enabled,
            snap_to_grid_intersections: settings.snap_to_grid_intersections.unwrap_or(false),
        },
    )
}

fn serialize_identified_grid_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::IdentifiedGridSettings,
) -> WIPOffset<fb::IdentifiedGridSettings<'bldr>> {
    let id_offset = serialize_identifier(builder, &settings.id);
    let settings_offset = serialize_grid_settings(builder, &settings.settings);
    fb::IdentifiedGridSettings::create(
        builder,
        &fb::IdentifiedGridSettingsArgs {
            id: Some(id_offset),
            settings: Some(settings_offset),
        },
    )
}

fn serialize_identified_snap_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::IdentifiedSnapSettings,
) -> WIPOffset<fb::IdentifiedSnapSettings<'bldr>> {
    let id_offset = serialize_identifier(builder, &settings.id);
    let settings_offset = serialize_snap_settings(builder, &settings.settings);
    fb::IdentifiedSnapSettings::create(
        builder,
        &fb::IdentifiedSnapSettingsArgs {
            id: Some(id_offset),
            settings: Some(settings_offset),
        },
    )
}

fn serialize_identified_ucs<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    ucs: &types::IdentifiedUcs,
) -> WIPOffset<fb::IdentifiedUcs<'bldr>> {
    let id_offset = serialize_identifier(builder, &ucs.id);
    let ucs_offset = serialize_duc_ucs(builder, &ucs.ucs);
    fb::IdentifiedUcs::create(
        builder,
        &fb::IdentifiedUcsArgs {
            id: Some(id_offset),
            ucs: Some(ucs_offset),
        },
    )
}

fn serialize_identified_view<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    view: &types::IdentifiedView,
) -> WIPOffset<fb::IdentifiedView<'bldr>> {
    let id_offset = serialize_identifier(builder, &view.id);
    let view_offset = serialize_duc_view(builder, &view.view);
    fb::IdentifiedView::create(
        builder,
        &fb::IdentifiedViewArgs {
            id: Some(id_offset),
            view: Some(view_offset),
        },
    )
}

fn serialize_standard_view_settings<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    settings: &types::StandardViewSettings,
) -> WIPOffset<fb::StandardViewSettings<'bldr>> {
    let views_offsets: Vec<_> = settings
        .views
        .iter()
        .map(|v| serialize_identified_view(builder, v))
        .collect();
    let views_vec = builder.create_vector(&views_offsets);

    let ucs_offsets: Vec<_> = settings
        .ucs
        .iter()
        .map(|u| serialize_identified_ucs(builder, u))
        .collect();
    let ucs_vec = builder.create_vector(&ucs_offsets);

    let grid_settings_offsets: Vec<_> = settings
        .grid_settings
        .iter()
        .map(|g| serialize_identified_grid_settings(builder, g))
        .collect();
    let grid_settings_vec = builder.create_vector(&grid_settings_offsets);

    let snap_settings_offsets: Vec<_> = settings
        .snap_settings
        .iter()
        .map(|s| serialize_identified_snap_settings(builder, s))
        .collect();
    let snap_settings_vec = builder.create_vector(&snap_settings_offsets);

    fb::StandardViewSettings::create(
        builder,
        &fb::StandardViewSettingsArgs {
            views: Some(views_vec),
            ucs: Some(ucs_vec),
            grid_settings: Some(grid_settings_vec),
            snap_settings: Some(snap_settings_vec),
        },
    )
}

fn serialize_dimension_validation_rules<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    rules: &types::DimensionValidationRules,
) -> WIPOffset<fb::DimensionValidationRules<'bldr>> {
    let allowed_precisions_vec = builder.create_vector(&rules.allowed_precisions);
    fb::DimensionValidationRules::create(
        builder,
        &fb::DimensionValidationRulesArgs {
            min_text_height: rules.min_text_height.unwrap_or(0.0),
            max_text_height: rules.max_text_height.unwrap_or(0.0),
            allowed_precisions: Some(allowed_precisions_vec),
        },
    )
}

fn serialize_layer_validation_rules<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    rules: &types::LayerValidationRules,
) -> WIPOffset<fb::LayerValidationRules<'bldr>> {
    let prohibited_layer_names_vec = rules
        .prohibited_layer_names
        .as_ref()
        .and_then(|v| serialize_vec_of_strings(builder, v));
    fb::LayerValidationRules::create(
        builder,
        &fb::LayerValidationRulesArgs {
            prohibited_layer_names: prohibited_layer_names_vec,
        },
    )
}

fn serialize_standard_validation<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    validation: &types::StandardValidation,
) -> WIPOffset<fb::StandardValidation<'bldr>> {
    let dimension_rules_offset = validation
        .dimension_rules
        .as_ref()
        .map(|r| serialize_dimension_validation_rules(builder, r));
    let layer_rules_offset = validation
        .layer_rules
        .as_ref()
        .map(|r| serialize_layer_validation_rules(builder, r));
    fb::StandardValidation::create(
        builder,
        &fb::StandardValidationArgs {
            dimension_rules: dimension_rules_offset,
            layer_rules: layer_rules_offset,
        },
    )
}

fn serialize_standard<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    standard: &types::Standard,
) -> WIPOffset<fb::Standard<'bldr>> {
    let identifier_offset = serialize_identifier(builder, &standard.identifier);
    let version_offset = builder.create_string(&standard.version);
    let overrides_offset = standard
        .overrides
        .as_ref()
        .map(|o| serialize_standard_overrides(builder, o));
    let styles_offset = standard
        .styles
        .as_ref()
        .map(|s| serialize_standard_styles(builder, s));
    let view_settings_offset = standard
        .view_settings
        .as_ref()
        .map(|s| serialize_standard_view_settings(builder, s));
    let units_offset = standard
        .units
        .as_ref()
        .map(|u| serialize_standard_units(builder, u));
    let validation_offset = standard
        .validation
        .as_ref()
        .map(|v| serialize_standard_validation(builder, v));

    fb::Standard::create(
        builder,
        &fb::StandardArgs {
            identifier: Some(identifier_offset),
            version: Some(version_offset),
            readonly: standard.readonly,
            overrides: overrides_offset,
            styles: styles_offset,
            view_settings: view_settings_offset,
            units: units_offset,
            validation: validation_offset,
        },
    )
}

// =============================================================================
// VERSION CONTROL
// =============================================================================

fn serialize_version_base<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    base: &types::VersionBase,
) -> WIPOffset<fb::VersionBase<'bldr>> {
    let id_offset = builder.create_string(&base.id);
    let parent_id_offset = base.parent_id.as_ref().map(|s| builder.create_string(s));
    let description_offset = base.description.as_ref().map(|s| builder.create_string(s));
    let user_id_offset = base.user_id.as_ref().map(|s| builder.create_string(s));
    fb::VersionBase::create(
        builder,
        &fb::VersionBaseArgs {
            id: Some(id_offset),
            parent_id: parent_id_offset,
            timestamp: base.timestamp,
            description: description_offset,
            is_manual_save: base.is_manual_save,
            user_id: user_id_offset,
        },
    )
}

fn serialize_checkpoint<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    checkpoint: &types::Checkpoint,
) -> WIPOffset<fb::Checkpoint<'bldr>> {
    let base_offset = serialize_version_base(builder, &checkpoint.base);
    let data_vec = builder.create_vector(&checkpoint.data);
    fb::Checkpoint::create(
        builder,
        &fb::CheckpointArgs {
            base: Some(base_offset),
            data: Some(data_vec),
            size_bytes: checkpoint.size_bytes,
        },
    )
}


fn serialize_delta<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    delta: &types::Delta,
) -> WIPOffset<fb::Delta<'bldr>> {
    let base_offset = serialize_version_base(builder, &delta.base);

    // Serialize patch as compressed JSON data
    let patch_json = serde_json::to_string(&delta.patch).unwrap();
    let patch_compressed = compress_string(&patch_json);
    let patch_vec = builder.create_vector::<u8>(&patch_compressed);
    let size_bytes = patch_compressed.len() as i64;

    fb::Delta::create(
        builder,
        &fb::DeltaArgs {
            base: Some(base_offset),
            patch: Some(patch_vec),
            size_bytes,
        },
    )
}

fn serialize_version_graph_metadata<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    meta: &types::VersionGraphMetadata,
) -> WIPOffset<fb::VersionGraphMetadata<'bldr>> {
    fb::VersionGraphMetadata::create(
        builder,
        &fb::VersionGraphMetadataArgs {
            last_pruned: meta.last_pruned,
            total_size: meta.total_size,
        },
    )
}

fn serialize_version_graph<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    graph: &types::VersionGraph,
) -> WIPOffset<fb::VersionGraph<'bldr>> {
    let user_checkpoint_version_id_offset =
        builder.create_string(&graph.user_checkpoint_version_id);
    let latest_version_id_offset = builder.create_string(&graph.latest_version_id);
    let checkpoints_offsets: Vec<_> = graph
        .checkpoints
        .iter()
        .map(|c| serialize_checkpoint(builder, c))
        .collect();
    let checkpoints_vec = builder.create_vector(&checkpoints_offsets);
    let deltas_offsets: Vec<_> = graph
        .deltas
        .iter()
        .map(|d| serialize_delta(builder, d))
        .collect();
    let deltas_vec = builder.create_vector(&deltas_offsets);
    let metadata_offset = serialize_version_graph_metadata(builder, &graph.metadata);

    fb::VersionGraph::create(
        builder,
        &fb::VersionGraphArgs {
            user_checkpoint_version_id: Some(user_checkpoint_version_id_offset),
            latest_version_id: Some(latest_version_id_offset),
            checkpoints: Some(checkpoints_vec),
            deltas: Some(deltas_vec),
            metadata: Some(metadata_offset),
        },
    )
}

// =============================================================================
// EXTERNAL FILES
// =============================================================================

fn serialize_duc_external_file_data<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    file: &types::DucExternalFileData,
) -> WIPOffset<fb::DucExternalFileData<'bldr>> {
    let mime_type_offset = builder.create_string(&file.mime_type);
    let id_offset = builder.create_string(&file.id);
    let data_vec = builder.create_vector(&file.data);
    fb::DucExternalFileData::create(
        builder,
        &fb::DucExternalFileDataArgs {
            mime_type: Some(mime_type_offset),
            id: Some(id_offset),
            data: Some(data_vec),
            created: file.created,
            last_retrieved: file.last_retrieved,
        },
    )
}

fn serialize_duc_external_file_entry<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    entry: &types::DucExternalFileEntry,
) -> WIPOffset<fb::DucExternalFileEntry<'bldr>> {
    let key_offset = builder.create_string(&entry.key);
    let value_offset = serialize_duc_external_file_data(builder, &entry.value);
    fb::DucExternalFileEntry::create(
        builder,
        &fb::DucExternalFileEntryArgs {
            key: Some(key_offset),
            value: Some(value_offset),
        },
    )
}

// =============================================================================
// ROOT TYPE
// =============================================================================

fn serialize_exported_data_state<'bldr>(
    builder: &mut FlatBufferBuilder<'bldr>,
    state: &types::ExportedDataState,
) -> WIPOffset<fb::ExportedDataState<'bldr>> {
    let type_offset = builder.create_string(&state.data_type);
    let source_offset = builder.create_string(&state.source);

    // Use schema version injected by build.rs (env var DUC_SCHEMA_VERSION)
    // This ensures the serialized file carries the schema version declared in schema/duc.fbs
    const DUC_SCHEMA_VERSION: &str = env!("DUC_SCHEMA_VERSION");
    let version_offset = builder.create_string(DUC_SCHEMA_VERSION);

    let thumbnail_vec = state.thumbnail.as_ref().map(|v| builder.create_vector(v));

    let dictionary_vec = state.dictionary.as_ref().map(|v| {
        let offsets: Vec<_> = v
            .iter()
            .map(|e| serialize_dictionary_entry(builder, e))
            .collect();
        builder.create_vector(&offsets)
    });

    let elements_offsets: Vec<_> = state
        .elements
        .iter()
        .map(|e| serialize_element_wrapper(builder, e))
        .collect();
    let elements_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::ElementWrapper<'bldr>>>,
    > = builder.create_vector(&elements_offsets);

    let blocks_offsets: Vec<_> = state
        .blocks
        .iter()
        .map(|b| serialize_duc_block(builder, b))
        .collect();
    let blocks_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucBlock<'bldr>>>,
    > = builder.create_vector(&blocks_offsets);

    let block_instances_offsets: Vec<_> = state
        .block_instances
        .iter()
        .map(|bi| serialize_duc_block_instance(builder, bi))
        .collect();
    let block_instances_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucBlockInstance<'bldr>>>,
    > = builder.create_vector(&block_instances_offsets);

    let block_collections_offsets: Vec<_> = state
        .block_collections
        .iter()
        .map(|bc| serialize_duc_block_collection(builder, bc))
        .collect();
    let block_collections_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucBlockCollection<'bldr>>>,
    > = builder.create_vector(&block_collections_offsets);

    let groups_offsets: Vec<_> = state
        .groups
        .iter()
        .map(|g| serialize_duc_group(builder, g))
        .collect();
    let groups_vec = builder.create_vector(&groups_offsets);

    let regions_offsets: Vec<_> = state
        .regions
        .iter()
        .map(|r| serialize_duc_region(builder, r))
        .collect();
    let regions_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucRegion<'bldr>>>,
    > = builder.create_vector(&regions_offsets);

    let layers_offsets: Vec<_> = state
        .layers
        .iter()
        .map(|l| serialize_duc_layer(builder, l))
        .collect();
    let layers_vec: WIPOffset<
        flatbuffers::Vector<'bldr, flatbuffers::ForwardsUOffset<fb::DucLayer<'bldr>>>,
    > = builder.create_vector(&layers_offsets);

    let standards_offsets: Vec<_> = state
        .standards
        .iter()
        .map(|s| serialize_standard(builder, s))
        .collect();
    let standards_vec = builder.create_vector(&standards_offsets);

    let duc_local_state_offset = state
        .duc_local_state
        .as_ref()
        .map(|s| serialize_duc_local_state(builder, s));
    let duc_global_state_offset = state
        .duc_global_state
        .as_ref()
        .map(|s| serialize_duc_global_state(builder, s));

    let external_files_vec = state.external_files.as_ref().map(|v| {
        let offsets: Vec<_> = v
            .iter()
            .map(|f| serialize_duc_external_file_entry(builder, f))
            .collect();
        builder.create_vector(&offsets)
    });

    let version_graph_offset = state
        .version_graph
        .as_ref()
        .map(|vg| serialize_version_graph(builder, vg));

    let id_offset = state.id.as_ref().map(|s| builder.create_string(s));

    fb::ExportedDataState::create(
        builder,
        &fb::ExportedDataStateArgs {
            type_: Some(type_offset),
            version_legacy: 0, // Deprecated in schema, using 0
            source: Some(source_offset),
            version: Some(version_offset),
            thumbnail: thumbnail_vec,
            dictionary: dictionary_vec,
            elements: Some(elements_vec),
            blocks: Some(blocks_vec),
            blockInstances: Some(block_instances_vec),
            blockCollections: Some(block_collections_vec),
            groups: Some(groups_vec),
            regions: Some(regions_vec),
            layers: Some(layers_vec),
            standards: Some(standards_vec),
            duc_local_state: duc_local_state_offset,
            duc_global_state: duc_global_state_offset,
            external_files: external_files_vec,
            version_graph: version_graph_offset,
            id: id_offset,
        },
    )
}
