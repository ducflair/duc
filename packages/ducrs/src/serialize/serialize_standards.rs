use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::generated::duc::{
    self as fb, AlternateUnitsBuilder, AngularUnitSystemBuilder, DimensionExtLineStyleBuilder,
    DimensionFitStyleBuilder, DimensionLineStyleBuilder, DimensionSymbolStyleBuilder,
    DimensionToleranceStyleBuilder, DimensionValidationRulesBuilder, DucCommonStyleBuilder,
    DucDimensionStyleBuilder, DucDocStyleBuilder, DucFeatureControlFrameStyleBuilder,
    DucHatchStyleBuilder, DucLeaderStyleBuilder, DucStackLikeStylesBuilder, DucTableStyleBuilder,
    DucTextStyleBuilder, DucViewportStyleBuilder, DucXRayStyleBuilder, DynamicSnapSettingsBuilder,
    FCFDatumStyleBuilder, FCFLayoutStyleBuilder, FCFSymbolStyleBuilder, GridSettingsBuilder,
    GridStyleBuilder, IdentifiedCommonStyleBuilder, IdentifiedDimensionStyleBuilder,
    IdentifiedDocStyleBuilder, IdentifiedFCFStyleBuilder, IdentifiedGridSettingsBuilder,
    IdentifiedHatchStyleBuilder, IdentifiedLeaderStyleBuilder, IdentifiedSnapSettingsBuilder,
    IdentifiedStackLikeStyleBuilder, IdentifiedTableStyleBuilder, IdentifiedTextStyleBuilder,
    IdentifiedUcsBuilder, IdentifiedViewBuilder, IdentifiedViewportStyleBuilder,
    IdentifiedXRayStyleBuilder, IdentifierBuilder, IsometricGridSettingsBuilder,
    LayerSnapFiltersBuilder, LayerValidationRulesBuilder, LinearUnitSystemBuilder, MarginsBuilder,
    ParagraphFormattingBuilder, PolarGridSettingsBuilder, PolarTrackingSettingsBuilder,
    PrimaryUnitsBuilder, SnapMarkerSettingsBuilder, SnapMarkerStyleBuilder,
    SnapMarkerStyleEntryBuilder, SnapOverrideBuilder, SnapSettingsBuilder, StackFormatBuilder,
    StackFormatPropertiesBuilder, StandardBuilder, StandardOverridesBuilder, StandardStylesBuilder,
    StandardUnitsBuilder, StandardValidationBuilder, StandardViewSettingsBuilder,
    TrackingLineStyleBuilder, UnitPrecisionBuilder, _UnitSystemBaseBuilder,
};
use crate::types;

use super::serialize_duc_element_utils::{
    serialize_duc_element_styles_base, serialize_duc_head, serialize_duc_point,
    serialize_element_background, serialize_element_stroke, serialize_line_spacing,
};

pub fn serialize_identifier<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    identifier: &types::Identifier,
) -> WIPOffset<fb::Identifier<'a>> {
    let id = builder.create_string(&identifier.id);
    let name = builder.create_string(&identifier.name);
    let description = builder.create_string(&identifier.description);

    let mut identifier_builder = IdentifierBuilder::new(builder);
    identifier_builder.add_id(id);
    identifier_builder.add_name(name);
    identifier_builder.add_description(description);
    identifier_builder.finish()
}

pub fn serialize_standard<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    standard: &types::Standard,
) -> WIPOffset<fb::Standard<'a>> {
    let identifier = serialize_identifier(builder, &standard.identifier);
    let version = builder.create_string(&standard.version);
    let overrides = serialize_standard_overrides(builder, &standard.overrides);
    let styles = serialize_standard_styles(builder, &standard.styles);
    let view_settings = serialize_standard_view_settings(builder, &standard.view_settings);
    let units = serialize_standard_units(builder, &standard.units);
    let validation = serialize_standard_validation(builder, &standard.validation);

    let mut standard_builder = StandardBuilder::new(builder);
    standard_builder.add_identifier(identifier);
    standard_builder.add_version(version);
    standard_builder.add_readonly(standard.readonly);
    standard_builder.add_overrides(overrides);
    standard_builder.add_styles(styles);
    standard_builder.add_view_settings(view_settings);
    standard_builder.add_units(units);
    standard_builder.add_validation(validation);
    standard_builder.finish()
}

fn serialize_standard_overrides<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    overrides: &types::StandardOverrides,
) -> WIPOffset<fb::StandardOverrides<'a>> {
    let main_scope = builder.create_string(&overrides.main_scope);
    let common_style_id = builder.create_string(&overrides.common_style_id);
    let stack_like_style_id = builder.create_string(&overrides.stack_like_style_id);
    let text_style_id = builder.create_string(&overrides.text_style_id);
    let dimension_style_id = builder.create_string(&overrides.dimension_style_id);
    let leader_style_id = builder.create_string(&overrides.leader_style_id);
    let feature_control_frame_style_id =
        builder.create_string(&overrides.feature_control_frame_style_id);
    let table_style_id = builder.create_string(&overrides.table_style_id);
    let doc_style_id = builder.create_string(&overrides.doc_style_id);
    let viewport_style_id = builder.create_string(&overrides.viewport_style_id);
    let plot_style_id = builder.create_string(&overrides.plot_style_id);
    let hatch_style_id = builder.create_string(&overrides.hatch_style_id);
    let active_grid_settings_id = {
        let string_offsets: Vec<_> = overrides.active_grid_settings_id
            .iter()
            .map(|s| builder.create_string(s))
            .collect();
        builder.create_vector(&string_offsets)
    };
    let active_snap_settings_id = builder.create_string(&overrides.active_snap_settings_id);
    let dash_line_override = builder.create_string(&overrides.dash_line_override);
    let unit_precision = serialize_unit_precision(builder, &overrides.unit_precision);

    let mut overrides_builder = StandardOverridesBuilder::new(builder);
    overrides_builder.add_main_scope(main_scope);
    overrides_builder
        .add_elements_stroke_width_override(overrides.elements_stroke_width_override);
    overrides_builder.add_common_style_id(common_style_id);
    overrides_builder.add_stack_like_style_id(stack_like_style_id);
    overrides_builder.add_text_style_id(text_style_id);
    overrides_builder.add_dimension_style_id(dimension_style_id);
    overrides_builder.add_leader_style_id(leader_style_id);
    overrides_builder.add_feature_control_frame_style_id(feature_control_frame_style_id);
    overrides_builder.add_table_style_id(table_style_id);
    overrides_builder.add_doc_style_id(doc_style_id);
    overrides_builder.add_viewport_style_id(viewport_style_id);
    overrides_builder.add_plot_style_id(plot_style_id);
    overrides_builder.add_hatch_style_id(hatch_style_id);
    overrides_builder.add_active_grid_settings_id(active_grid_settings_id);
    overrides_builder.add_active_snap_settings_id(active_snap_settings_id);
    overrides_builder.add_dash_line_override(dash_line_override);
    overrides_builder.add_unit_precision(unit_precision);
    overrides_builder.finish()
}

fn serialize_unit_precision<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    precision: &types::UnitPrecision,
) -> WIPOffset<fb::UnitPrecision<'a>> {
    let mut precision_builder = UnitPrecisionBuilder::new(builder);
    precision_builder.add_linear(precision.linear);
    precision_builder.add_angular(precision.angular);
    precision_builder.add_area(precision.area);
    precision_builder.add_volume(precision.volume);
    precision_builder.finish()
}

fn serialize_standard_styles<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    styles: &types::StandardStyles,
) -> WIPOffset<fb::StandardStyles<'a>> {
    let common_styles = builder.create_vector(
        &styles
            .common_styles
            .iter()
            .map(|s| serialize_identified_common_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let stack_like_styles = builder.create_vector(
        &styles
            .stack_like_styles
            .iter()
            .map(|s| serialize_identified_stack_like_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let text_styles = builder.create_vector(
        &styles
            .text_styles
            .iter()
            .map(|s| serialize_identified_text_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let dimension_styles = builder.create_vector(
        &styles
            .dimension_styles
            .iter()
            .map(|s| serialize_identified_dimension_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let leader_styles = builder.create_vector(
        &styles
            .leader_styles
            .iter()
            .map(|s| serialize_identified_leader_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let feature_control_frame_styles = builder.create_vector(
        &styles
            .feature_control_frame_styles
            .iter()
            .map(|s| serialize_identified_fcf_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let table_styles = builder.create_vector(
        &styles
            .table_styles
            .iter()
            .map(|s| serialize_identified_table_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let doc_styles = builder.create_vector(
        &styles
            .doc_styles
            .iter()
            .map(|s| serialize_identified_doc_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let viewport_styles = builder.create_vector(
        &styles
            .viewport_styles
            .iter()
            .map(|s| serialize_identified_viewport_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let hatch_styles = builder.create_vector(
        &styles
            .hatch_styles
            .iter()
            .map(|s| serialize_identified_hatch_style(builder, s))
            .collect::<Vec<_>>(),
    );
    let xray_styles = builder.create_vector(
        &styles
            .xray_styles
            .iter()
            .map(|s| serialize_identified_xray_style(builder, s))
            .collect::<Vec<_>>(),
    );

    let mut styles_builder = StandardStylesBuilder::new(builder);
    styles_builder.add_common_styles(common_styles);
    styles_builder.add_stack_like_styles(stack_like_styles);
    styles_builder.add_text_styles(text_styles);
    styles_builder.add_dimension_styles(dimension_styles);
    styles_builder.add_leader_styles(leader_styles);
    styles_builder.add_feature_control_frame_styles(feature_control_frame_styles);
    styles_builder.add_table_styles(table_styles);
    styles_builder.add_doc_styles(doc_styles);
    styles_builder.add_viewport_styles(viewport_styles);
    styles_builder.add_hatch_styles(hatch_styles);
    styles_builder.add_xray_styles(xray_styles);
    styles_builder.finish()
}

fn serialize_identified_common_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedCommonStyle,
) -> WIPOffset<fb::IdentifiedCommonStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_common_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedCommonStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_common_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucCommonStyle,
) -> WIPOffset<fb::DucCommonStyle<'a>> {
    let background = serialize_element_background(builder, &style.background);
    let stroke = serialize_element_stroke(builder, &style.stroke);
    let mut style_builder = DucCommonStyleBuilder::new(builder);
    style_builder.add_background(background);
    style_builder.add_stroke(stroke);
    style_builder.finish()
}

fn serialize_identified_stack_like_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedStackLikeStyle,
) -> WIPOffset<fb::IdentifiedStackLikeStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_stack_like_styles(builder, &style.style);
    let mut identified_style_builder = IdentifiedStackLikeStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_stack_like_styles<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucStackLikeStyles,
) -> WIPOffset<fb::DucStackLikeStyles<'a>> {
    let labeling_color = builder.create_string(&style.labeling_color);
    let mut style_builder = DucStackLikeStylesBuilder::new(builder);
    style_builder.add_opacity(style.opacity);
    style_builder.add_labeling_color(labeling_color);
    style_builder.finish()
}

fn serialize_identified_text_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedTextStyle,
) -> WIPOffset<fb::IdentifiedTextStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_text_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedTextStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_text_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucTextStyle,
) -> WIPOffset<fb::DucTextStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let font_family = builder.create_string(&style.font_family);
    let big_font_family = builder.create_string(&style.big_font_family);
    let line_spacing = serialize_line_spacing(builder, &style.line_spacing);

    let mut style_builder = DucTextStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    style_builder.add_is_ltr(style.is_ltr);
    style_builder.add_font_family(font_family);
    style_builder.add_big_font_family(big_font_family);
    if let Some(text_align) = style.text_align {
        style_builder.add_text_align(text_align);
    }
    if let Some(vertical_align) = style.vertical_align {
        style_builder.add_vertical_align(vertical_align);
    }
    style_builder.add_line_height(style.line_height);
    style_builder.add_line_spacing(line_spacing);
    style_builder.add_oblique_angle(style.oblique_angle);
    style_builder.add_font_size(style.font_size);
    style_builder.add_paper_text_height(style.paper_text_height);
    style_builder.add_width_factor(style.width_factor);
    style_builder.add_is_upside_down(style.is_upside_down);
    style_builder.add_is_backwards(style.is_backwards);
    style_builder.finish()
}

fn serialize_identified_dimension_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedDimensionStyle,
) -> WIPOffset<fb::IdentifiedDimensionStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_dimension_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedDimensionStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_dimension_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucDimensionStyle,
) -> WIPOffset<fb::DucDimensionStyle<'a>> {
    let dim_line = serialize_dimension_line_style(builder, &style.dim_line);
    let ext_line = serialize_dimension_ext_line_style(builder, &style.ext_line);
    let text_style = serialize_duc_text_style(builder, &style.text_style);
    let symbols = serialize_dimension_symbol_style(builder, &style.symbols);
    let tolerance = serialize_dimension_tolerance_style(builder, &style.tolerance);
    let fit = serialize_dimension_fit_style(builder, &style.fit);

    let mut style_builder = DucDimensionStyleBuilder::new(builder);
    style_builder.add_dim_line(dim_line);
    style_builder.add_ext_line(ext_line);
    style_builder.add_text_style(text_style);
    style_builder.add_symbols(symbols);
    style_builder.add_tolerance(tolerance);
    style_builder.add_fit(fit);
    style_builder.finish()
}

fn serialize_dimension_line_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DimensionLineStyle,
) -> WIPOffset<fb::DimensionLineStyle<'a>> {
    let stroke = serialize_element_stroke(builder, &style.stroke);
    let mut style_builder = DimensionLineStyleBuilder::new(builder);
    style_builder.add_stroke(stroke);
    style_builder.add_text_gap(style.text_gap);
    style_builder.finish()
}

fn serialize_dimension_ext_line_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DimensionExtLineStyle,
) -> WIPOffset<fb::DimensionExtLineStyle<'a>> {
    let stroke = serialize_element_stroke(builder, &style.stroke);
    let mut style_builder = DimensionExtLineStyleBuilder::new(builder);
    style_builder.add_stroke(stroke);
    style_builder.add_overshoot(style.overshoot);
    style_builder.add_offset(style.offset);
    style_builder.finish()
}

fn serialize_dimension_symbol_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DimensionSymbolStyle,
) -> WIPOffset<fb::DimensionSymbolStyle<'a>> {
    let heads_override = builder.create_vector(
        &style
            .heads_override
            .iter()
            .map(|h| serialize_duc_head(builder, h))
            .collect::<Vec<_>>(),
    );
    let mut style_builder = DimensionSymbolStyleBuilder::new(builder);
    style_builder.add_heads_override(heads_override);
    if let Some(center_mark_type) = style.center_mark_type {
        style_builder.add_center_mark_type(center_mark_type);
    }
    style_builder.add_center_mark_size(style.center_mark_size);
    style_builder.finish()
}

fn serialize_dimension_tolerance_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DimensionToleranceStyle,
) -> WIPOffset<fb::DimensionToleranceStyle<'a>> {
    let text_style = serialize_duc_text_style(builder, &style.text_style);
    let mut style_builder = DimensionToleranceStyleBuilder::new(builder);
    style_builder.add_enabled(style.enabled);
    if let Some(display_method) = style.display_method {
        style_builder.add_display_method(display_method);
    }
    style_builder.add_upper_value(style.upper_value);
    style_builder.add_lower_value(style.lower_value);
    style_builder.add_precision(style.precision);
    style_builder.add_text_style(text_style);
    style_builder.finish()
}

fn serialize_dimension_fit_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DimensionFitStyle,
) -> WIPOffset<fb::DimensionFitStyle<'a>> {
    let mut style_builder = DimensionFitStyleBuilder::new(builder);
    if let Some(rule) = style.rule {
        style_builder.add_rule(rule);
    }
    if let Some(text_placement) = style.text_placement {
        style_builder.add_text_placement(text_placement);
    }
    style_builder.add_force_text_inside(style.force_text_inside);
    style_builder.finish()
}

fn serialize_identified_leader_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedLeaderStyle,
) -> WIPOffset<fb::IdentifiedLeaderStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_leader_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedLeaderStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_leader_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucLeaderStyle,
) -> WIPOffset<fb::DucLeaderStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let heads_override = builder.create_vector(
        &style
            .heads_override
            .iter()
            .map(|h| serialize_duc_head(builder, h))
            .collect::<Vec<_>>(),
    );
    let text_style = serialize_duc_text_style(builder, &style.text_style);

    let mut style_builder = DucLeaderStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    style_builder.add_heads_override(heads_override);
    style_builder.add_dogleg(style.dogleg);
    style_builder.add_text_style(text_style);
    if let Some(text_attachment) = style.text_attachment {
        style_builder.add_text_attachment(text_attachment);
    }
    if let Some(block_attachment) = style.block_attachment {
        style_builder.add_block_attachment(block_attachment);
    }
    style_builder.finish()
}

fn serialize_identified_fcf_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedFCFStyle,
) -> WIPOffset<fb::IdentifiedFCFStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_fcf_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedFCFStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_fcf_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucFeatureControlFrameStyle,
) -> WIPOffset<fb::DucFeatureControlFrameStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let text_style = serialize_duc_text_style(builder, &style.text_style);
    let layout = serialize_fcf_layout_style(builder, &style.layout);
    let symbols = serialize_fcf_symbol_style(builder, &style.symbols);
    let datum_style = serialize_fcf_datum_style(builder, &style.datum_style);

    let mut style_builder = DucFeatureControlFrameStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    style_builder.add_text_style(text_style);
    style_builder.add_layout(layout);
    style_builder.add_symbols(symbols);
    style_builder.add_datum_style(datum_style);
    style_builder.finish()
}

fn serialize_fcf_layout_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::FCFLayoutStyle,
) -> WIPOffset<fb::FCFLayoutStyle<'a>> {
    let mut style_builder = FCFLayoutStyleBuilder::new(builder);
    style_builder.add_padding(style.padding);
    style_builder.add_segment_spacing(style.segment_spacing);
    style_builder.add_row_spacing(style.row_spacing);
    style_builder.finish()
}

fn serialize_fcf_symbol_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::FCFSymbolStyle,
) -> WIPOffset<fb::FCFSymbolStyle<'a>> {
    let mut style_builder = FCFSymbolStyleBuilder::new(builder);
    style_builder.add_scale(style.scale);
    style_builder.finish()
}

fn serialize_fcf_datum_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::FCFDatumStyle,
) -> WIPOffset<fb::FCFDatumStyle<'a>> {
    let mut style_builder = FCFDatumStyleBuilder::new(builder);
    if let Some(bracket_style) = style.bracket_style {
        style_builder.add_bracket_style(bracket_style);
    }
    style_builder.finish()
}

fn serialize_identified_table_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedTableStyle,
) -> WIPOffset<fb::IdentifiedTableStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_table_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedTableStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_table_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucTableStyle,
) -> WIPOffset<fb::DucTableStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let header_row_style = serialize_duc_table_cell_style(builder, &style.header_row_style);
    let data_row_style = serialize_duc_table_cell_style(builder, &style.data_row_style);
    let data_column_style = serialize_duc_table_cell_style(builder, &style.data_column_style);

    let mut style_builder = DucTableStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    if let Some(flow_direction) = style.flow_direction {
        style_builder.add_flow_direction(flow_direction);
    }
    style_builder.add_header_row_style(header_row_style);
    style_builder.add_data_row_style(data_row_style);
    style_builder.add_data_column_style(data_column_style);
    style_builder.finish()
}

fn serialize_duc_table_cell_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucTableCellStyle,
) -> WIPOffset<fb::DucTableCellStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let text_style = serialize_duc_text_style(builder, &style.text_style);
    let margins = serialize_margins(builder, &style.margins);

    let mut style_builder = fb::DucTableCellStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    style_builder.add_text_style(text_style);
    style_builder.add_margins(margins);
    if let Some(alignment) = style.alignment {
        style_builder.add_alignment(alignment);
    }
    style_builder.finish()
}

fn serialize_margins<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    margins: &types::Margins,
) -> WIPOffset<fb::Margins<'a>> {
    let mut margins_builder = MarginsBuilder::new(builder);
    margins_builder.add_top(margins.top);
    margins_builder.add_right(margins.right);
    margins_builder.add_bottom(margins.bottom);
    margins_builder.add_left(margins.left);
    margins_builder.finish()
}

fn serialize_identified_doc_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedDocStyle,
) -> WIPOffset<fb::IdentifiedDocStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_doc_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedDocStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_doc_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucDocStyle,
) -> WIPOffset<fb::DucDocStyle<'a>> {
    let text_style = serialize_duc_text_style(builder, &style.text_style);
    let paragraph = serialize_paragraph_formatting(builder, &style.paragraph);
    let stack_format = serialize_stack_format(builder, &style.stack_format);

    let mut style_builder = DucDocStyleBuilder::new(builder);
    style_builder.add_text_style(text_style);
    style_builder.add_paragraph(paragraph);
    style_builder.add_stack_format(stack_format);
    style_builder.finish()
}

fn serialize_paragraph_formatting<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    formatting: &types::ParagraphFormatting,
) -> WIPOffset<fb::ParagraphFormatting<'a>> {
    let tab_stops = builder.create_vector(&formatting.tab_stops);
    let mut formatting_builder = ParagraphFormattingBuilder::new(builder);
    formatting_builder.add_first_line_indent(formatting.first_line_indent);
    formatting_builder.add_hanging_indent(formatting.hanging_indent);
    formatting_builder.add_left_indent(formatting.left_indent);
    formatting_builder.add_right_indent(formatting.right_indent);
    formatting_builder.add_space_before(formatting.space_before);
    formatting_builder.add_space_after(formatting.space_after);
    formatting_builder.add_tab_stops(tab_stops);
    formatting_builder.finish()
}

fn serialize_stack_format<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    format: &types::StackFormat,
) -> WIPOffset<fb::StackFormat<'a>> {
    let stack_chars = {
        let string_offsets: Vec<_> = format.stack_chars
            .iter()
            .map(|s| builder.create_string(s))
            .collect();
        builder.create_vector(&string_offsets)
    };
    let properties = serialize_stack_format_properties(builder, &format.properties);

    let mut format_builder = StackFormatBuilder::new(builder);
    format_builder.add_auto_stack(format.auto_stack);
    format_builder.add_stack_chars(stack_chars);
    format_builder.add_properties(properties);
    format_builder.finish()
}

fn serialize_stack_format_properties<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    properties: &types::StackFormatProperties,
) -> WIPOffset<fb::StackFormatProperties<'a>> {
    let mut properties_builder = StackFormatPropertiesBuilder::new(builder);
    properties_builder.add_upper_scale(properties.upper_scale);
    properties_builder.add_lower_scale(properties.lower_scale);
    if let Some(alignment) = properties.alignment {
        properties_builder.add_alignment(alignment);
    }
    properties_builder.finish()
}

fn serialize_identified_viewport_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedViewportStyle,
) -> WIPOffset<fb::IdentifiedViewportStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_viewport_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedViewportStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_viewport_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucViewportStyle,
) -> WIPOffset<fb::DucViewportStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let mut style_builder = DucViewportStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    style_builder.add_scale_indicator_visible(style.scale_indicator_visible);
    style_builder.finish()
}

fn serialize_identified_hatch_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedHatchStyle,
) -> WIPOffset<fb::IdentifiedHatchStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_hatch_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedHatchStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_hatch_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucHatchStyle,
) -> WIPOffset<fb::DucHatchStyle<'a>> {
    let pattern_name = builder.create_string(&style.pattern_name);
    let pattern_origin = builder.create_struct(&style.pattern_origin);
    let custom_pattern =
        super::serialize_duc_element_utils::serialize_custom_hatch_pattern(builder, &style.custom_pattern);

    let mut style_builder = DucHatchStyleBuilder::new(builder);
    if let Some(hatch_style) = style.hatch_style {
        style_builder.add_hatch_style(hatch_style);
    }
    style_builder.add_pattern_name(pattern_name);
    style_builder.add_pattern_scale(style.pattern_scale);
    style_builder.add_pattern_angle(style.pattern_angle);
    style_builder.add_pattern_origin(pattern_origin);
    style_builder.add_pattern_double(style.pattern_double);
    style_builder.add_custom_pattern(custom_pattern);
    style_builder.finish()
}

fn serialize_identified_xray_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::IdentifiedXRayStyle,
) -> WIPOffset<fb::IdentifiedXRayStyle<'a>> {
    let id = serialize_identifier(builder, &style.id);
    let style_offset = serialize_duc_xray_style(builder, &style.style);
    let mut identified_style_builder = IdentifiedXRayStyleBuilder::new(builder);
    identified_style_builder.add_id(id);
    identified_style_builder.add_style(style_offset);
    identified_style_builder.finish()
}

fn serialize_duc_xray_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::DucXRayStyle,
) -> WIPOffset<fb::DucXRayStyle<'a>> {
    let base_style = serialize_duc_element_styles_base(builder, &style.base_style);
    let color = builder.create_string(&style.color);
    let mut style_builder = DucXRayStyleBuilder::new(builder);
    style_builder.add_base_style(base_style);
    style_builder.add_color(color);
    style_builder.finish()
}

fn serialize_standard_view_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::StandardViewSettings,
) -> WIPOffset<fb::StandardViewSettings<'a>> {
    let views = builder.create_vector(
        &settings
            .views
            .iter()
            .map(|v| serialize_identified_view(builder, v))
            .collect::<Vec<_>>(),
    );
    let ucs = builder.create_vector(
        &settings
            .ucs
            .iter()
            .map(|u| serialize_identified_ucs(builder, u))
            .collect::<Vec<_>>(),
    );
    let grid_settings = builder.create_vector(
        &settings
            .grid_settings
            .iter()
            .map(|g| serialize_identified_grid_settings(builder, g))
            .collect::<Vec<_>>(),
    );
    let snap_settings = builder.create_vector(
        &settings
            .snap_settings
            .iter()
            .map(|s| serialize_identified_snap_settings(builder, s))
            .collect::<Vec<_>>(),
    );

    let mut settings_builder = StandardViewSettingsBuilder::new(builder);
    settings_builder.add_views(views);
    settings_builder.add_ucs(ucs);
    settings_builder.add_grid_settings(grid_settings);
    settings_builder.add_snap_settings(snap_settings);
    settings_builder.finish()
}

fn serialize_identified_view<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    view: &types::IdentifiedView,
) -> WIPOffset<fb::IdentifiedView<'a>> {
    let id = serialize_identifier(builder, &view.id);
    let view_offset = serialize_duc_view(builder, &view.view);
    let mut identified_view_builder = IdentifiedViewBuilder::new(builder);
    identified_view_builder.add_id(id);
    identified_view_builder.add_view(view_offset);
    identified_view_builder.finish()
}

fn serialize_duc_view<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    view: &types::DucView,
) -> WIPOffset<fb::DucView<'a>> {
    let center_point = serialize_duc_point(builder, &view.center_point).unwrap();
    let scope = builder.create_string(&view.scope);
    let mut view_builder = fb::DucViewBuilder::new(builder);
    view_builder.add_scroll_x(view.scroll_x);
    view_builder.add_scroll_y(view.scroll_y);
    view_builder.add_zoom(view.zoom);
    view_builder.add_twist_angle(view.twist_angle);
    view_builder.add_center_point(center_point);
    view_builder.add_scope(scope);
    view_builder.finish()
}

fn serialize_identified_ucs<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    ucs: &types::IdentifiedUcs,
) -> WIPOffset<fb::IdentifiedUcs<'a>> {
    let id = serialize_identifier(builder, &ucs.id);
    let ucs_offset = serialize_duc_ucs(builder, &ucs.ucs);
    let mut identified_ucs_builder = IdentifiedUcsBuilder::new(builder);
    identified_ucs_builder.add_id(id);
    identified_ucs_builder.add_ucs(ucs_offset);
    identified_ucs_builder.finish()
}

fn serialize_duc_ucs<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    ucs: &types::DucUcs,
) -> WIPOffset<fb::DucUcs<'a>> {
    let origin =
        crate::generated::duc::GeometricPoint::new(ucs.origin.x, ucs.origin.y);
    let mut ucs_builder = fb::DucUcsBuilder::new(builder);
    ucs_builder.add_origin(&origin);
    ucs_builder.add_angle(ucs.angle);
    ucs_builder.finish()
}

fn serialize_identified_grid_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::IdentifiedGridSettings,
) -> WIPOffset<fb::IdentifiedGridSettings<'a>> {
    let id = serialize_identifier(builder, &settings.id);
    let settings_offset = serialize_grid_settings(builder, &settings.settings);
    let mut identified_settings_builder = IdentifiedGridSettingsBuilder::new(builder);
    identified_settings_builder.add_id(id);
    identified_settings_builder.add_settings(settings_offset);
    identified_settings_builder.finish()
}

fn serialize_grid_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::GridSettings,
) -> WIPOffset<fb::GridSettings<'a>> {
    let origin =
        crate::generated::duc::GeometricPoint::new(settings.origin.x, settings.origin.y);
    let major_style = serialize_grid_style(builder, &settings.major_style);
    let minor_style = serialize_grid_style(builder, &settings.minor_style);
    let polar_settings = serialize_polar_grid_settings(builder, &settings.polar_settings);
    let isometric_settings =
        serialize_isometric_grid_settings(builder, &settings.isometric_settings);

    let mut settings_builder = GridSettingsBuilder::new(builder);
    if let Some(grid_type) = settings.grid_type {
        settings_builder.add_type_(grid_type);
    }
    settings_builder.add_readonly(settings.readonly);
    if let Some(display_type) = settings.display_type {
        settings_builder.add_display_type(display_type);
    }
    settings_builder.add_is_adaptive(settings.is_adaptive);
    settings_builder.add_x_spacing(settings.x_spacing);
    settings_builder.add_y_spacing(settings.y_spacing);
    settings_builder.add_subdivisions(settings.subdivisions);
    settings_builder.add_origin(&origin);
    settings_builder.add_rotation(settings.rotation);
    settings_builder.add_follow_ucs(settings.follow_ucs);
    settings_builder.add_major_style(major_style);
    settings_builder.add_minor_style(minor_style);
    settings_builder.add_show_minor(settings.show_minor);
    settings_builder.add_min_zoom(settings.min_zoom);
    settings_builder.add_max_zoom(settings.max_zoom);
    settings_builder.add_auto_hide(settings.auto_hide);
    settings_builder.add_polar_settings(polar_settings);
    settings_builder.add_isometric_settings(isometric_settings);
    settings_builder.add_enable_snapping(settings.enable_snapping);
    settings_builder.finish()
}

fn serialize_grid_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::GridStyle,
) -> WIPOffset<fb::GridStyle<'a>> {
    let color = builder.create_string(&style.color);
    let dash_pattern = builder.create_vector(&style.dash_pattern);
    let mut style_builder = GridStyleBuilder::new(builder);
    style_builder.add_color(color);
    style_builder.add_opacity(style.opacity);
    style_builder.add_dash_pattern(dash_pattern);
    style_builder.finish()
}

fn serialize_polar_grid_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::PolarGridSettings,
) -> WIPOffset<fb::PolarGridSettings<'a>> {
    let mut settings_builder = PolarGridSettingsBuilder::new(builder);
    settings_builder.add_radial_divisions(settings.radial_divisions);
    settings_builder.add_radial_spacing(settings.radial_spacing);
    settings_builder.add_show_labels(settings.show_labels);
    settings_builder.finish()
}

fn serialize_isometric_grid_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::IsometricGridSettings,
) -> WIPOffset<fb::IsometricGridSettings<'a>> {
    let mut settings_builder = IsometricGridSettingsBuilder::new(builder);
    settings_builder.add_left_angle(settings.left_angle);
    settings_builder.add_right_angle(settings.right_angle);
    settings_builder.finish()
}

fn serialize_identified_snap_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::IdentifiedSnapSettings,
) -> WIPOffset<fb::IdentifiedSnapSettings<'a>> {
    let id = serialize_identifier(builder, &settings.id);
    let settings_offset = serialize_snap_settings(builder, &settings.settings);
    let mut identified_settings_builder = IdentifiedSnapSettingsBuilder::new(builder);
    identified_settings_builder.add_id(id);
    identified_settings_builder.add_settings(settings_offset);
    identified_settings_builder.finish()
}

fn serialize_snap_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::SnapSettings,
) -> WIPOffset<fb::SnapSettings<'a>> {
    let polar_tracking = serialize_polar_tracking_settings(builder, &settings.polar_tracking);
    let active_object_snap_modes = builder.create_vector(&settings.active_object_snap_modes);
    let snap_priority = builder.create_vector(&settings.snap_priority);
    let tracking_line_style =
        serialize_tracking_line_style(builder, &settings.tracking_line_style);
    let dynamic_snap = serialize_dynamic_snap_settings(builder, &settings.dynamic_snap);
    let temporary_overrides = builder.create_vector(
        &settings
            .temporary_overrides
            .iter()
            .map(|o| serialize_snap_override(builder, o))
            .collect::<Vec<_>>(),
    );
    let layer_snap_filters = serialize_layer_snap_filters(builder, &settings.layer_snap_filters);
    let element_type_filters = {
        let string_offsets: Vec<_> = settings.element_type_filters
            .iter()
            .map(|s| builder.create_string(s))
            .collect();
        builder.create_vector(&string_offsets)
    };
    let snap_markers = serialize_snap_marker_settings(builder, &settings.snap_markers);

    let mut settings_builder = SnapSettingsBuilder::new(builder);
    settings_builder.add_readonly(settings.readonly);
    settings_builder.add_twist_angle(settings.twist_angle);
    settings_builder.add_snap_tolerance(settings.snap_tolerance);
    settings_builder.add_object_snap_aperture(settings.object_snap_aperture);
    settings_builder.add_is_ortho_mode_on(settings.is_ortho_mode_on);
    settings_builder.add_polar_tracking(polar_tracking);
    settings_builder.add_is_object_snap_on(settings.is_object_snap_on);
    settings_builder.add_active_object_snap_modes(active_object_snap_modes);
    settings_builder.add_snap_priority(snap_priority);
    settings_builder.add_show_tracking_lines(settings.show_tracking_lines);
    settings_builder.add_tracking_line_style(tracking_line_style);
    settings_builder.add_dynamic_snap(dynamic_snap);
    settings_builder.add_temporary_overrides(temporary_overrides);
    settings_builder.add_incremental_distance(settings.incremental_distance);
    settings_builder.add_magnetic_strength(settings.magnetic_strength);
    settings_builder.add_layer_snap_filters(layer_snap_filters);
    settings_builder.add_element_type_filters(element_type_filters);
    if let Some(snap_mode) = settings.snap_mode {
        settings_builder.add_snap_mode(snap_mode);
    }
    settings_builder.add_snap_markers(snap_markers);
    settings_builder.add_construction_snap_enabled(settings.construction_snap_enabled);
    settings_builder.add_snap_to_grid_intersections(settings.snap_to_grid_intersections);
    settings_builder.finish()
}

fn serialize_polar_tracking_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::PolarTrackingSettings,
) -> WIPOffset<fb::PolarTrackingSettings<'a>> {
    let angles = builder.create_vector(&settings.angles);
    let mut settings_builder = PolarTrackingSettingsBuilder::new(builder);
    settings_builder.add_enabled(settings.enabled);
    settings_builder.add_angles(angles);
    settings_builder.add_increment_angle(settings.increment_angle);
    settings_builder.add_track_from_last_point(settings.track_from_last_point);
    settings_builder.add_show_polar_coordinates(settings.show_polar_coordinates);
    settings_builder.finish()
}

fn serialize_tracking_line_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::TrackingLineStyle,
) -> WIPOffset<fb::TrackingLineStyle<'a>> {
    let color = builder.create_string(&style.color);
    let dash_pattern = builder.create_vector(&style.dash_pattern);
    let mut style_builder = TrackingLineStyleBuilder::new(builder);
    style_builder.add_color(color);
    style_builder.add_opacity(style.opacity);
    style_builder.add_dash_pattern(dash_pattern);
    style_builder.finish()
}

fn serialize_dynamic_snap_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::DynamicSnapSettings,
) -> WIPOffset<fb::DynamicSnapSettings<'a>> {
    let mut settings_builder = DynamicSnapSettingsBuilder::new(builder);
    settings_builder.add_enabled_during_drag(settings.enabled_during_drag);
    settings_builder.add_enabled_during_rotation(settings.enabled_during_rotation);
    settings_builder.add_enabled_during_scale(settings.enabled_during_scale);
    settings_builder.finish()
}

fn serialize_snap_override<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    override_val: &types::SnapOverride,
) -> WIPOffset<fb::SnapOverride<'a>> {
    let key = builder.create_string(&override_val.key);
    let mut override_builder = SnapOverrideBuilder::new(builder);
    override_builder.add_key(key);
    if let Some(behavior) = override_val.behavior {
        override_builder.add_behavior(behavior);
    }
    override_builder.finish()
}

fn serialize_layer_snap_filters<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    filters: &types::LayerSnapFilters,
) -> WIPOffset<fb::LayerSnapFilters<'a>> {
    let include_layers = {
        let string_offsets: Vec<_> = filters.include_layers
            .iter()
            .map(|s| builder.create_string(s))
            .collect();
        builder.create_vector(&string_offsets)
    };
    let exclude_layers = {
        let string_offsets: Vec<_> = filters.exclude_layers
            .iter()
            .map(|s| builder.create_string(s))
            .collect();
        builder.create_vector(&string_offsets)
    };

    let mut filters_builder = LayerSnapFiltersBuilder::new(builder);
    filters_builder.add_include_layers(include_layers);
    filters_builder.add_exclude_layers(exclude_layers);
    filters_builder.finish()
}

fn serialize_snap_marker_settings<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    settings: &types::SnapMarkerSettings,
) -> WIPOffset<fb::SnapMarkerSettings<'a>> {
    let styles = builder.create_vector(
        &settings
            .styles
            .iter()
            .map(|s| serialize_snap_marker_style_entry(builder, s))
            .collect::<Vec<_>>(),
    );
    let mut settings_builder = SnapMarkerSettingsBuilder::new(builder);
    settings_builder.add_enabled(settings.enabled);
    settings_builder.add_size(settings.size);
    settings_builder.add_duration(settings.duration);
    settings_builder.add_styles(styles);
    settings_builder.finish()
}

fn serialize_snap_marker_style_entry<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    entry: &types::SnapMarkerStyleEntry,
) -> WIPOffset<fb::SnapMarkerStyleEntry<'a>> {
    let value = serialize_snap_marker_style(builder, &entry.value);
    let mut entry_builder = SnapMarkerStyleEntryBuilder::new(builder);
    if let Some(key) = entry.key {
        entry_builder.add_key(key);
    }
    entry_builder.add_value(value);
    entry_builder.finish()
}

fn serialize_snap_marker_style<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    style: &types::SnapMarkerStyle,
) -> WIPOffset<fb::SnapMarkerStyle<'a>> {
    let color = builder.create_string(&style.color);
    let mut style_builder = SnapMarkerStyleBuilder::new(builder);
    if let Some(shape) = style.shape {
        style_builder.add_shape(shape);
    }
    style_builder.add_color(color);
    style_builder.finish()
}

fn serialize_standard_units<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    units: &types::StandardUnits,
) -> WIPOffset<fb::StandardUnits<'a>> {
    let primary_units = serialize_primary_units(builder, &units.primary_units);
    let alternate_units = serialize_alternate_units(builder, &units.alternate_units);
    let mut units_builder = StandardUnitsBuilder::new(builder);
    units_builder.add_primary_units(primary_units);
    units_builder.add_alternate_units(alternate_units);
    units_builder.finish()
}

fn serialize_primary_units<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    units: &types::PrimaryUnits,
) -> WIPOffset<fb::PrimaryUnits<'a>> {
    let linear = serialize_linear_unit_system(builder, &units.linear);
    let angular = serialize_angular_unit_system(builder, &units.angular);
    let mut units_builder = PrimaryUnitsBuilder::new(builder);
    units_builder.add_linear(linear);
    units_builder.add_angular(angular);
    units_builder.finish()
}

fn serialize_linear_unit_system<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    system: &types::LinearUnitSystem,
) -> WIPOffset<fb::LinearUnitSystem<'a>> {
    let base = serialize_unit_system_base(builder, &system.base);
    let mut system_builder = LinearUnitSystemBuilder::new(builder);
    system_builder.add_base(base);
    if let Some(format) = system.format {
        system_builder.add_format(format);
    }
    if let Some(decimal_separator) = system.decimal_separator {
        system_builder.add_decimal_separator(decimal_separator);
    }
    system_builder.add_suppress_zero_feet(system.suppress_zero_feet);
    system_builder.add_suppress_zero_inches(system.suppress_zero_inches);
    system_builder.finish()
}

fn serialize_angular_unit_system<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    system: &types::AngularUnitSystem,
) -> WIPOffset<fb::AngularUnitSystem<'a>> {
    let base = serialize_unit_system_base(builder, &system.base);
    let mut system_builder = AngularUnitSystemBuilder::new(builder);
    system_builder.add_base(base);
    if let Some(format) = system.format {
        system_builder.add_format(format);
    }
    system_builder.finish()
}

fn serialize_unit_system_base<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    base: &types::UnitSystemBase,
) -> WIPOffset<fb::_UnitSystemBase<'a>> {
    let mut base_builder = _UnitSystemBaseBuilder::new(builder);
    if let Some(system) = base.system {
        base_builder.add_system(system);
    }
    base_builder.add_precision(base.precision);
    base_builder.add_suppress_leading_zeros(base.suppress_leading_zeros);
    base_builder.add_suppress_trailing_zeros(base.suppress_trailing_zeros);
    base_builder.finish()
}

fn serialize_alternate_units<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    units: &types::AlternateUnits,
) -> WIPOffset<fb::AlternateUnits<'a>> {
    let base = serialize_unit_system_base(builder, &units.base);
    let mut units_builder = AlternateUnitsBuilder::new(builder);
    units_builder.add_base(base);
    if let Some(format) = units.format {
        units_builder.add_format(format);
    }
    units_builder.add_is_visible(units.is_visible);
    units_builder.add_multiplier(units.multiplier);
    units_builder.finish()
}

fn serialize_standard_validation<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    validation: &types::StandardValidation,
) -> WIPOffset<fb::StandardValidation<'a>> {
    let dimension_rules =
        serialize_dimension_validation_rules(builder, &validation.dimension_rules);
    let layer_rules = serialize_layer_validation_rules(builder, &validation.layer_rules);
    let mut validation_builder = StandardValidationBuilder::new(builder);
    validation_builder.add_dimension_rules(dimension_rules);
    validation_builder.add_layer_rules(layer_rules);
    validation_builder.finish()
}

fn serialize_dimension_validation_rules<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    rules: &types::DimensionValidationRules,
) -> WIPOffset<fb::DimensionValidationRules<'a>> {
    let allowed_precisions = builder.create_vector(&rules.allowed_precisions);
    let mut rules_builder = DimensionValidationRulesBuilder::new(builder);
    rules_builder.add_min_text_height(rules.min_text_height);
    rules_builder.add_max_text_height(rules.max_text_height);
    rules_builder.add_allowed_precisions(allowed_precisions);
    rules_builder.finish()
}

fn serialize_layer_validation_rules<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    rules: &types::LayerValidationRules,
) -> WIPOffset<fb::LayerValidationRules<'a>> {
    let prohibited_layer_names = {
        let string_offsets: Vec<_> = rules.prohibited_layer_names
            .iter()
            .map(|s| builder.create_string(s))
            .collect();
        builder.create_vector(&string_offsets)
    };
    let mut rules_builder = LayerValidationRulesBuilder::new(builder);
    rules_builder.add_prohibited_layer_names(prohibited_layer_names);
    rules_builder.finish()
}
