#![allow(clippy::too_many_arguments)]
#![allow(clippy::new_ret_no_self)]

use crate::generated::duc as fb;
use crate::types;

/// Alias for a parsing result.
type ParseResult<T> = Result<T, &'static str>;

/// Parses a byte slice into the main `ExportedDataState` struct.
pub fn parse(buf: &[u8]) -> ParseResult<types::ExportedDataState> {
    let root = flatbuffers::root::<fb::ExportedDataState>(buf)
        .map_err(|_| "Invalid FlatBuffer for ExportedDataState")?;
    parse_exported_data_state(root)
}

// =============================================================================
// Helper: Vector Parsing
// =============================================================================

fn parse_vec_of_strings(vec: Option<flatbuffers::Vector<'_, flatbuffers::ForwardsUOffset<&str>>>) -> Vec<String> {
    match vec {
        Some(v) => {
            let mut out = Vec::with_capacity(v.len());
            for i in 0..v.len() {
                // For FlatBuffers Vector<ForwardsUOffset<&str>>, get(i) returns &str
                let s = v.get(i);
                out.push(s.to_string());
            }
            out
        }
        None => Vec::new(),
    }
}

fn parse_vec_of_required_strings(vec: Option<flatbuffers::Vector<'_, flatbuffers::ForwardsUOffset<&str>>>) -> ParseResult<Vec<String>> {
    match vec {
        Some(v) => {
            let mut out = Vec::with_capacity(v.len());
            for i in 0..v.len() {
                let s = v.get(i);
                out.push(s.to_string());
            }
            Ok(out)
        }
        None => Err("Missing required vector of strings"),
    }
}

/// Helper function to parse binary JSON data to a JSON string
/// Expects zlib-compressed JSON
/// Returns None if the data is empty or parsing fails
fn parse_binary_json_to_string(vec: Option<flatbuffers::Vector<'_, u8>>) -> Option<String> {
    match vec {
        Some(v) if v.len() > 0 => {
            let data: Vec<u8> = (0..v.len()).map(|i| v.get(i)).collect();

            use flate2::read::ZlibDecoder;
            use std::io::Read;

            let mut d = ZlibDecoder::new(data.as_slice());
            let mut decompressed = Vec::new();

            if d.read_to_end(&mut decompressed).is_ok() {
                if let Ok(text) = String::from_utf8(decompressed) {
                    return Some(text);
                }
            }

            // Fallback to legacy format: plain JSON string (for old file compatibility)
            String::from_utf8(data).ok()
        }
        _ => None,
    }
}


// =============================================================================
// UTILITY & GEOMETRY TYPES
// =============================================================================

fn parse_geometric_point(point: &fb::GeometricPoint) -> types::GeometricPoint {
    types::GeometricPoint {
        x: point.x(),
        y: point.y(),
    }
}

fn parse_required_geometric_point(point: Option<fb::GeometricPoint>) -> ParseResult<types::GeometricPoint> {
    match point {
        Some(p) => Ok(parse_geometric_point(&p)),
        None => Err("Missing required GeometricPoint"),
    }
}

fn parse_duc_point(point: fb::DucPoint) -> types::DucPoint {
    types::DucPoint {
        x: point.x(),
        y: point.y(),
        mirroring: point.mirroring(),
    }
}

fn parse_required_duc_point(point: Option<fb::DucPoint>) -> ParseResult<types::DucPoint> {
    point.map(|p| parse_duc_point(p)).ok_or("Missing required DucPoint")
}

fn parse_vec_of_duc_points(vec: Option<flatbuffers::Vector<'_, flatbuffers::ForwardsUOffset<fb::DucPoint<'_>>>>) -> Vec<types::DucPoint> {
    match vec {
        Some(v) => {
            let mut out = Vec::with_capacity(v.len());
            for i in 0..v.len() {
                let p = v.get(i);
                out.push(parse_duc_point(p));
            }
            out
        }
        None => Vec::new(),
    }
}

fn parse_identifier(id: fb::Identifier) -> ParseResult<types::Identifier> {
    Ok(types::Identifier {
        id: id.id().to_string(),
        name: id.name().map(|s| s.to_string()).unwrap_or_default(),
        description: id.description().map(|s| s.to_string()),
    })
}

fn parse_dictionary_entry(entry: fb::DictionaryEntry) -> ParseResult<types::DictionaryEntry> {
    Ok(types::DictionaryEntry {
        key: entry.key().to_string(),
        value: entry.value().map(|s| s.to_string()).unwrap_or_default(),
    })
}

fn parse_string_value_entry(entry: fb::StringValueEntry) -> ParseResult<types::StringValueEntry> {
    Ok(types::StringValueEntry {
        key: entry.key().to_string(),
        value: entry.value().map(|s| s.to_string()).unwrap_or_default(),
    })
}

fn parse_duc_ucs(ucs: fb::DucUcs) -> ParseResult<types::DucUcs> {
    Ok(types::DucUcs {
        origin: parse_required_geometric_point(ucs.origin().copied())?,
        angle: ucs.angle(),
    })
}

fn parse_duc_view(view: fb::DucView) -> ParseResult<types::DucView> {
    Ok(types::DucView {
        scroll_x: view.scroll_x(),
        scroll_y: view.scroll_y(),
        zoom: view.zoom(),
        twist_angle: view.twist_angle(),
        center_point: parse_required_duc_point(view.center_point())?,
        scope: view.scope().map(|s| s.to_string()).unwrap_or_default(),
    })
}

fn parse_margins(margins: fb::Margins) -> ParseResult<types::Margins> {
    Ok(types::Margins {
        top: margins.top(),
        right: margins.right(),
        bottom: margins.bottom(),
        left: margins.left(),
    })
}

// =============================================================================
// STYLING & CONTENT
// =============================================================================

fn parse_tiling_properties(tiling: fb::TilingProperties) -> ParseResult<types::TilingProperties> {
    Ok(types::TilingProperties {
        size_in_percent: tiling.size_in_percent(),
        angle: tiling.angle(),
        spacing: tiling.spacing(),
        offset_x: tiling.offset_x(),
        offset_y: tiling.offset_y(),
    })
}

fn parse_hatch_pattern_line(line: fb::HatchPatternLine) -> ParseResult<types::HatchPatternLine> {
    Ok(types::HatchPatternLine {
        angle: line.angle(),
        origin: parse_required_duc_point(line.origin())?,
        offset: line.offset().ok_or("Missing HatchPatternLine.offset")?.iter().collect(),
        dash_pattern: line.dash_pattern().ok_or("Missing HatchPatternLine.dash_pattern")?.iter().collect(),
    })
}

fn parse_custom_hatch_pattern(pattern: fb::CustomHatchPattern) -> ParseResult<types::CustomHatchPattern> {
    let lines_vec = pattern.lines().ok_or("Missing CustomHatchPattern.lines")?;
    let lines = lines_vec.iter().map(parse_hatch_pattern_line).collect::<ParseResult<_>>()?;
    Ok(types::CustomHatchPattern {
        name: pattern.name().unwrap_or("").to_string(),
        description: pattern.description().map(|s| s.to_string()),
        lines,
    })
}

fn parse_duc_hatch_style(style: fb::DucHatchStyle) -> ParseResult<types::DucHatchStyle> {
    Ok(types::DucHatchStyle {
        hatch_style: style.hatch_style().expect("Missing DucHatchStyle.hatch_style"),
        pattern_name: style.pattern_name().map(|s| s.to_string()).ok_or("Missing DucHatchStyle.pattern_name")?,
        pattern_scale: style.pattern_scale(),
        pattern_angle: style.pattern_angle(),
        pattern_origin: parse_required_duc_point(style.pattern_origin())?,
        pattern_double: style.pattern_double(),
        custom_pattern: style.custom_pattern().map(parse_custom_hatch_pattern).transpose()?,
    })
}

fn parse_duc_image_filter(filter: fb::DucImageFilter) -> ParseResult<types::DucImageFilter> {
    Ok(types::DucImageFilter {
        brightness: filter.brightness(),
        contrast: filter.contrast(),
    })
}

fn parse_element_content_base(content: fb::ElementContentBase) -> ParseResult<types::ElementContentBase> {
    Ok(types::ElementContentBase {
        preference: content.preference(),
        src: content.src().map(|s| s.to_string()).unwrap_or_default(),
        visible: content.visible(),
        opacity: content.opacity(),
        tiling: content.tiling().map(parse_tiling_properties).transpose()?,
        hatch: content.hatch().map(parse_duc_hatch_style).transpose()?,
        image_filter: content.image_filter().map(parse_duc_image_filter).transpose()?,
    })
}

fn parse_stroke_style(style: fb::StrokeStyle) -> ParseResult<types::StrokeStyle> {
    Ok(types::StrokeStyle {
        preference: style.preference(),
        cap: style.cap(),
        join: style.join(),
        dash: style.dash().map(|v| Some(v.iter().collect())).unwrap_or(None),
        dash_line_override: style.dash_line_override().map(|s| s.to_string()),
        dash_cap: style.dash_cap(),
        miter_limit: style.miter_limit(),
    })
}

fn parse_stroke_sides(sides: fb::StrokeSides) -> ParseResult<types::StrokeSides> {
    Ok(types::StrokeSides {
        preference: sides.preference(),
        values: sides.values().map(|v| v.iter().collect()),
    })
}

fn parse_element_stroke(stroke: fb::ElementStroke) -> ParseResult<types::ElementStroke> {
    Ok(types::ElementStroke {
        content: parse_element_content_base(stroke.content().ok_or("Missing ElementStroke.content")?)?,
        width: stroke.width(),
        style: parse_stroke_style(stroke.style().ok_or("Missing ElementStroke.style")?)?,
        placement: stroke.placement(),
        stroke_sides: stroke
            .stroke_sides()
            .map(parse_stroke_sides)
            .transpose()?,
    })
}

fn parse_element_background(background: fb::ElementBackground) -> ParseResult<types::ElementBackground> {
    Ok(types::ElementBackground {
        content: parse_element_content_base(background.content().ok_or("Missing ElementBackground.content")?)?,
    })
}

fn parse_duc_element_styles_base(styles: fb::_DucElementStylesBase) -> ParseResult<types::DucElementStylesBase> {
    let background_vec = styles.background().ok_or("Missing _DucElementStylesBase.background")?;
    let background = background_vec.iter().map(parse_element_background).collect::<ParseResult<_>>()?;
    
    let stroke_vec = styles.stroke().ok_or("Missing _DucElementStylesBase.stroke")?;
    let stroke = stroke_vec.iter().map(parse_element_stroke).collect::<ParseResult<_>>()?;
    
    Ok(types::DucElementStylesBase {
        roundness: styles.roundness(),
        blending: styles.blending(),
        background,
        stroke,
        opacity: styles.opacity(),
    })
}

// =============================================================================
// BASE ELEMENT & COMMON ELEMENT COMPONENTS
// =============================================================================

fn parse_bound_element(be: fb::BoundElement) -> ParseResult<types::BoundElement> {
    Ok(types::BoundElement {
        id: be.id().map(|s| s.to_string()).ok_or("Missing BoundElement.id")?,
        element_type: be.type_().map(|s| s.to_string()).ok_or("Missing BoundElement.type")?,
    })
}

fn parse_duc_element_base(base: fb::_DucElementBase) -> ParseResult<types::DucElementBase> {
    let bound_elements = base
        .bound_elements()
        .map(|v| v.iter().map(parse_bound_element).collect::<ParseResult<Vec<_>>>())
        .transpose()?;
    
    Ok(types::DucElementBase {
        id: base.id().to_string(),
        styles: base.styles()
            .map(|s| parse_duc_element_styles_base(s))
            .transpose()?
            .unwrap_or_else(|| types::DucElementStylesBase {
                roundness: 0.0,
                blending: None,
                background: Vec::new(),
                stroke: Vec::new(),
                opacity: 1.0,
            }),
        x: base.x(),
        y: base.y(),
        width: base.width(),
        height: base.height(),
        angle: base.angle(),
        scope: base.scope().map(|s| s.to_string()).ok_or("Missing _DucElementBase.scope")?,
        label: base.label().map(|s| s.to_string()).unwrap_or_default(),
        description: base.description().map(|s| s.to_string()),
        is_visible: base.is_visible(),
        seed: base.seed(),
        version: base.version(),
        version_nonce: base.version_nonce(),
        updated: base.updated(),
        index: base.index().map(|s| s.to_string()),
        is_plot: base.is_plot(),
        is_annotative: base.is_annotative(),
        is_deleted: base.is_deleted(),
        group_ids: parse_vec_of_strings(base.group_ids()),
        block_ids: parse_vec_of_strings(base.block_ids()),
        region_ids: parse_vec_of_strings(base.region_ids()),
        instance_id: base.instance_id().map(|s| s.to_string()),
        layer_id: base.layer_id().map(|s| s.to_string()),
        frame_id: base.frame_id().map(|s| s.to_string()),
        bound_elements,
        z_index: base.z_index(),
        link: base.link().map(|s| s.to_string()),
        locked: base.locked(),
        custom_data: parse_binary_json_to_string(base.custom_data()),
    })
}

fn parse_duc_head(head: fb::DucHead) -> ParseResult<types::DucHead> {
    Ok(types::DucHead {
        head_type: head.type_(),
        block_id: head.block_id().map(|s| s.to_string()),
        size: head.size(),
    })
}

fn parse_point_binding_point(pbp: fb::PointBindingPoint) -> ParseResult<types::PointBindingPoint> {
    Ok(types::PointBindingPoint {
        index: pbp.index(),
        offset: pbp.offset(),
    })
}

fn parse_duc_point_binding(binding: fb::DucPointBinding) -> ParseResult<types::DucPointBinding> {
    Ok(types::DucPointBinding {
        element_id: binding.element_id().ok_or("Missing DucPointBinding.element_id")?.to_string(),
        focus: binding.focus(),
        gap: binding.gap(),
        fixed_point: binding.fixed_point().map(|p| parse_geometric_point(&p)),
        point: binding.point().map(parse_point_binding_point).transpose()?,
        head: binding.head().map(parse_duc_head).transpose()?,
    })
}

fn parse_duc_line_reference(line_ref: fb::DucLineReference) -> ParseResult<types::DucLineReference> {
    Ok(types::DucLineReference {
        index: line_ref.index(),
        handle: line_ref.handle().map(|gp| parse_geometric_point(&gp)),
    })
}

fn parse_duc_line(line: fb::DucLine) -> ParseResult<types::DucLine> {
    Ok(types::DucLine {
        start: parse_duc_line_reference(line.start().ok_or("Missing DucLine.start")?)?,
        end: parse_duc_line_reference(line.end().ok_or("Missing DucLine.end")?)?,
    })
}

fn parse_duc_path(path: fb::DucPath) -> ParseResult<types::DucPath> {
    Ok(types::DucPath {
        line_indices: path.line_indices().ok_or("Missing DucPath.line_indices")?.iter().collect(),
        background: path.background().map(parse_element_background).transpose()?,
        stroke: path.stroke().map(parse_element_stroke).transpose()?,
    })
}

fn parse_duc_linear_element_base(base: fb::_DucLinearElementBase) -> ParseResult<types::DucLinearElementBase> {
    let lines = base
        .lines()
        .map(|v| v.iter().map(parse_duc_line).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    let path_overrides = base
        .path_overrides()
        .map(|v| v.iter().map(parse_duc_path).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    Ok(types::DucLinearElementBase {
        base: parse_duc_element_base(base.base().ok_or("Missing _DucLinearElementBase.base")?)?,
        points: parse_vec_of_duc_points(base.points()),
        lines,
        path_overrides,
        last_committed_point: base.last_committed_point().map(|p| parse_duc_point(p)),
        start_binding: base.start_binding().map(parse_duc_point_binding).transpose()?,
        end_binding: base.end_binding().map(parse_duc_point_binding).transpose()?,
    })
}

fn parse_duc_stack_like_styles(styles: fb::DucStackLikeStyles) -> ParseResult<types::DucStackLikeStyles> {
    Ok(types::DucStackLikeStyles {
        opacity: styles.opacity(),
        labeling_color: styles.labeling_color().map(|s| s.to_string()).unwrap_or_default(),
    })
}

fn parse_duc_stack_base(base: fb::_DucStackBase) -> ParseResult<types::DucStackBase> {
    Ok(types::DucStackBase {
        label: base.label().ok_or("Missing _DucStackBase.label")?.to_string(),
        description: base.description().map(|s| s.to_string()),
        is_collapsed: base.is_collapsed(),
        is_plot: base.is_plot(),
        is_visible: base.is_visible(),
        locked: base.locked(),
        styles: parse_duc_stack_like_styles(base.styles().ok_or("Missing _DucStackBase.styles")?)?,
    })
}

fn parse_duc_stack_element_base(base: fb::_DucStackElementBase) -> ParseResult<types::DucStackElementBase> {
    Ok(types::DucStackElementBase {
        base: parse_duc_element_base(base.base().ok_or("Missing _DucStackElementBase.base")?)?,
        stack_base: parse_duc_stack_base(base.stack_base().ok_or("Missing _DucStackElementBase.stack_base")?)?,
        clip: base.clip(),
        label_visible: base.label_visible(),
        standard_override: base.standard_override().map(|s| s.to_string()),
    })
}

// =============================================================================
// ELEMENT-SPECIFIC STYLES
// =============================================================================

fn parse_line_spacing(spacing: fb::LineSpacing) -> ParseResult<types::LineSpacing> {
    Ok(types::LineSpacing {
        value: spacing.value(),
        line_type: spacing.type_(),
    })
}

fn parse_duc_text_style(style: fb::DucTextStyle) -> ParseResult<types::DucTextStyle> {
    Ok(types::DucTextStyle {
        is_ltr: style.is_ltr(),
        font_family: style.font_family().map(|s| s.to_string()).ok_or("Missing DucTextStyle.font_family")?,
        big_font_family: style.big_font_family().map(|s| s.to_string()).ok_or("Missing DucTextStyle.big_font_family")?,
        text_align: style.text_align().expect("Missing DucTextStyle.text_align"),
        vertical_align: style.vertical_align().expect("Missing DucTextStyle.vertical_align"),
        line_height: style.line_height(),
        line_spacing: parse_line_spacing(style.line_spacing().ok_or("Missing DucTextStyle.line_spacing")?)?,
        oblique_angle: style.oblique_angle(),
        font_size: style.font_size(),
        paper_text_height: Some(style.paper_text_height()),
        width_factor: style.width_factor(),
        is_upside_down: style.is_upside_down(),
        is_backwards: style.is_backwards(),
    })
}

fn parse_duc_table_cell_style(style: fb::DucTableCellStyle) -> ParseResult<types::DucTableCellStyle> {
    Ok(types::DucTableCellStyle {
        base_style: parse_duc_element_styles_base(style.base_style().ok_or("Missing DucTableCellStyle.base_style")?)?,
        text_style: parse_duc_text_style(style.text_style().ok_or("Missing DucTableCellStyle.text_style")?)?,
        margins: parse_margins(style.margins().ok_or("Missing DucTableCellStyle.margins")?)?,
        alignment: style.alignment(),
    })
}

fn parse_duc_table_style(style: fb::DucTableStyle) -> ParseResult<types::DucTableStyle> {
    Ok(types::DucTableStyle {
        flow_direction: style.flow_direction().expect("Missing DucTableStyle.flow_direction"),
        header_row_style: parse_duc_table_cell_style(style.header_row_style().ok_or("Missing DucTableStyle.header_row_style")?)?,
        data_row_style: parse_duc_table_cell_style(style.data_row_style().ok_or("Missing DucTableStyle.data_row_style")?)?,
        data_column_style: parse_duc_table_cell_style(style.data_column_style().ok_or("Missing DucTableStyle.data_column_style")?)?,
    })
}

fn parse_duc_leader_style(style: fb::DucLeaderStyle) -> ParseResult<types::DucLeaderStyle> {
    let heads_override = style
        .heads_override()
        .map(|v| v.iter().map(parse_duc_head).collect::<ParseResult<Vec<_>>>())
        .transpose()?;
    Ok(types::DucLeaderStyle {
        heads_override,
        dogleg: Some(style.dogleg()),
        text_style: parse_duc_text_style(style.text_style().ok_or("Missing DucLeaderStyle.text_style")?)?,
        text_attachment: style.text_attachment().expect("Missing DucLeaderStyle.text_attachment"),
        block_attachment: style.block_attachment().expect("Missing DucLeaderStyle.block_attachment"),
    })
}

fn parse_dimension_tolerance_style(style: fb::DimensionToleranceStyle) -> ParseResult<types::DimensionToleranceStyle> {
    Ok(types::DimensionToleranceStyle {
        enabled: style.enabled(),
        display_method: style.display_method().expect("Missing DimensionToleranceStyle.display_method"),
        upper_value: style.upper_value(),
        lower_value: style.lower_value(),
        precision: style.precision(),
        text_style: style.text_style().map(parse_duc_text_style).transpose()?,
    })
}

fn parse_dimension_fit_style(style: fb::DimensionFitStyle) -> ParseResult<types::DimensionFitStyle> {
    Ok(types::DimensionFitStyle {
        rule: style.rule().expect("Missing DimensionFitStyle.rule"),
        text_placement: style.text_placement().expect("Missing DimensionFitStyle.text_placement"),
        force_text_inside: style.force_text_inside(),
    })
}

fn parse_dimension_line_style(style: fb::DimensionLineStyle) -> ParseResult<types::DimensionLineStyle> {
    Ok(types::DimensionLineStyle {
        stroke: parse_element_stroke(style.stroke().ok_or("Missing DimensionLineStyle.stroke")?)?,
        text_gap: style.text_gap(),
    })
}

fn parse_dimension_ext_line_style(style: fb::DimensionExtLineStyle) -> ParseResult<types::DimensionExtLineStyle> {
    Ok(types::DimensionExtLineStyle {
        stroke: parse_element_stroke(style.stroke().ok_or("Missing DimensionExtLineStyle.stroke")?)?,
        overshoot: style.overshoot(),
        offset: style.offset(),
    })
}

fn parse_dimension_symbol_style(style: fb::DimensionSymbolStyle) -> ParseResult<types::DimensionSymbolStyle> {
    let heads_override = style
        .heads_override()
        .map(|v| v.iter().map(parse_duc_head).collect::<ParseResult<Vec<_>>>())
        .transpose()?;
    Ok(types::DimensionSymbolStyle {
        heads_override,
        center_mark_type: style.center_mark_type().expect("Missing DimensionSymbolStyle.center_mark_type"),
        center_mark_size: style.center_mark_size(),
    })
}

fn parse_duc_dimension_style(style: fb::DucDimensionStyle) -> ParseResult<types::DucDimensionStyle> {
    Ok(types::DucDimensionStyle {
        dim_line: parse_dimension_line_style(style.dim_line().ok_or("Missing DucDimensionStyle.dim_line")?)?,
        ext_line: parse_dimension_ext_line_style(style.ext_line().ok_or("Missing DucDimensionStyle.ext_line")?)?,
        text_style: parse_duc_text_style(style.text_style().ok_or("Missing DucDimensionStyle.text_style")?)?,
        symbols: parse_dimension_symbol_style(style.symbols().ok_or("Missing DucDimensionStyle.symbols")?)?,
        tolerance: parse_dimension_tolerance_style(style.tolerance().ok_or("Missing DucDimensionStyle.tolerance")?)?,
        fit: parse_dimension_fit_style(style.fit().ok_or("Missing DucDimensionStyle.fit")?)?,
    })
}

fn parse_fcf_layout_style(style: fb::FCFLayoutStyle) -> ParseResult<types::FCFLayoutStyle> {
    Ok(types::FCFLayoutStyle {
        padding: style.padding(),
        segment_spacing: style.segment_spacing(),
        row_spacing: style.row_spacing(),
    })
}

fn parse_fcf_symbol_style(style: fb::FCFSymbolStyle) -> ParseResult<types::FCFSymbolStyle> {
    Ok(types::FCFSymbolStyle {
        scale: style.scale(),
    })
}

fn parse_fcf_datum_style(style: fb::FCFDatumStyle) -> ParseResult<types::FCFDatumStyle> {
    Ok(types::FCFDatumStyle {
        bracket_style: style.bracket_style().expect("Missing FCFDatumStyle.bracket_style"),
    })
}

fn parse_duc_feature_control_frame_style(style: fb::DucFeatureControlFrameStyle) -> ParseResult<types::DucFeatureControlFrameStyle> {
    Ok(types::DucFeatureControlFrameStyle {
        text_style: parse_duc_text_style(style.text_style().ok_or("Missing DucFeatureControlFrameStyle.text_style")?)?,
        layout: parse_fcf_layout_style(style.layout().ok_or("Missing DucFeatureControlFrameStyle.layout")?)?,
        symbols: parse_fcf_symbol_style(style.symbols().ok_or("Missing DucFeatureControlFrameStyle.symbols")?)?,
        datum_style: parse_fcf_datum_style(style.datum_style().ok_or("Missing DucFeatureControlFrameStyle.datum_style")?)?,
    })
}

fn parse_paragraph_formatting(format: fb::ParagraphFormatting) -> ParseResult<types::ParagraphFormatting> {
    Ok(types::ParagraphFormatting {
        first_line_indent: format.first_line_indent(),
        hanging_indent: format.hanging_indent(),
        left_indent: format.left_indent(),
        right_indent: format.right_indent(),
        space_before: format.space_before(),
        space_after: format.space_after(),
        tab_stops: format.tab_stops().ok_or("Missing ParagraphFormatting.tab_stops")?.iter().collect(),
    })
}

fn parse_stack_format_properties(props: fb::StackFormatProperties) -> ParseResult<types::StackFormatProperties> {
    Ok(types::StackFormatProperties {
        upper_scale: props.upper_scale(),
        lower_scale: props.lower_scale(),
        alignment: props.alignment().expect("Missing StackFormatProperties.alignment"),
    })
}

fn parse_stack_format(format: fb::StackFormat) -> ParseResult<types::StackFormat> {
    Ok(types::StackFormat {
        auto_stack: format.auto_stack(),
        stack_chars: format.stack_chars().map(|v| parse_vec_of_strings(Some(v))).unwrap_or_default(),
        properties: parse_stack_format_properties(format.properties().ok_or("Missing StackFormat.properties")?)?,
    })
}

fn parse_duc_doc_style(style: fb::DucDocStyle) -> ParseResult<types::DucDocStyle> {
    Ok(types::DucDocStyle {
        text_style: parse_duc_text_style(style.text_style().ok_or("Missing DucDocStyle.text_style")?)?,
        paragraph: parse_paragraph_formatting(style.paragraph().ok_or("Missing DucDocStyle.paragraph")?)?,
        stack_format: parse_stack_format(style.stack_format().ok_or("Missing DucDocStyle.stack_format")?)?,
    })
}

fn parse_duc_viewport_style(style: fb::DucViewportStyle) -> ParseResult<types::DucViewportStyle> {
    Ok(types::DucViewportStyle {
        scale_indicator_visible: style.scale_indicator_visible(),
    })
}

fn parse_duc_plot_style(_style: fb::DucPlotStyle) -> ParseResult<types::DucPlotStyle> {
    Ok(types::DucPlotStyle {
    })
}

fn parse_duc_xray_style(style: fb::DucXRayStyle) -> ParseResult<types::DucXRayStyle> {
    Ok(types::DucXRayStyle {
        color: style.color().ok_or("Missing DucXRayStyle.color")?.to_string(),
    })
}

// =============================================================================
// ELEMENT DEFINITIONS
// =============================================================================

fn parse_duc_rectangle_element(el: fb::DucRectangleElement) -> ParseResult<types::DucRectangleElement> {
    Ok(types::DucRectangleElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucRectangleElement.base")?)?,
    })
}

fn parse_duc_polygon_element(el: fb::DucPolygonElement) -> ParseResult<types::DucPolygonElement> {
    Ok(types::DucPolygonElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucPolygonElement.base")?)?,
        sides: el.sides(),
    })
}

fn parse_duc_ellipse_element(el: fb::DucEllipseElement) -> ParseResult<types::DucEllipseElement> {
    Ok(types::DucEllipseElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucEllipseElement.base")?)?,
        ratio: el.ratio(),
        start_angle: el.start_angle(),
        end_angle: el.end_angle(),
        show_aux_crosshair: el.show_aux_crosshair(),
    })
}

fn parse_duc_embeddable_element(el: fb::DucEmbeddableElement) -> ParseResult<types::DucEmbeddableElement> {
    Ok(types::DucEmbeddableElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucEmbeddableElement.base")?)?,
    })
}

fn parse_duc_pdf_element(el: fb::DucPdfElement) -> ParseResult<types::DucPdfElement> {
    let grid_config = el.grid_config();
    Ok(types::DucPdfElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucPdfElement.base")?)?,
        file_id: el.file_id().map(|s| s.to_string()),
        grid_config: match grid_config {
            Some(gc) => types::DocumentGridConfig {
                columns: gc.columns(),
                gap_x: gc.gap_x(),
                gap_y: gc.gap_y(),
                align_items: gc.align_items().map(|a| a.into()).unwrap_or(types::DocumentGridAlignItems::Start),
                first_page_alone: gc.first_page_alone(),
            },
            None => types::DocumentGridConfig {
                columns: 1,
                gap_x: 0.0,
                gap_y: 0.0,
                align_items: types::DocumentGridAlignItems::Start,
                first_page_alone: false,
            },
        },
    })
}

fn parse_duc_mermaid_element(el: fb::DucMermaidElement) -> ParseResult<types::DucMermaidElement> {
    Ok(types::DucMermaidElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucMermaidElement.base")?)?,
        source: el.source().ok_or("Missing DucMermaidElement.source")?.to_string(),
        theme: el.theme().map(|s| s.to_string()),
        svg_path: el.svg_path().map(|s| s.to_string()),
    })
}

fn parse_duc_table_column(col: fb::DucTableColumn) -> ParseResult<types::DucTableColumn> {
    Ok(types::DucTableColumn {
        id: col.id().to_string(),
        width: col.width(),
        style_overrides: col.style_overrides().map(parse_duc_table_cell_style).transpose()?,
    })
}

fn parse_duc_table_row(row: fb::DucTableRow) -> ParseResult<types::DucTableRow> {
    Ok(types::DucTableRow {
        id: row.id().to_string(),
        height: row.height(),
        style_overrides: row.style_overrides().map(parse_duc_table_cell_style).transpose()?,
    })
}

fn parse_duc_table_cell_span(span: fb::DucTableCellSpan) -> ParseResult<types::DucTableCellSpan> {
    Ok(types::DucTableCellSpan {
        columns: span.columns(),
        rows: span.rows(),
    })
}

fn parse_duc_table_cell(cell: fb::DucTableCell) -> ParseResult<types::DucTableCell> {
    Ok(types::DucTableCell {
        row_id: cell.row_id().ok_or("Missing DucTableCell.row_id")?.to_string(),
        column_id: cell.column_id().ok_or("Missing DucTableCell.column_id")?.to_string(),
        data: cell.data().map(|s| s.to_string()).unwrap_or_default(),
        span: cell.span().map(parse_duc_table_cell_span).transpose()?,
        locked: cell.locked(),
        style_overrides: cell.style_overrides().map(parse_duc_table_cell_style).transpose()?,
    })
}

fn parse_duc_table_column_entry(entry: fb::DucTableColumnEntry) -> ParseResult<types::DucTableColumnEntry> {
    Ok(types::DucTableColumnEntry {
        key: entry.key().to_string(),
        value: parse_duc_table_column(entry.value().ok_or("Missing DucTableColumnEntry.value")?)?,
    })
}

fn parse_duc_table_row_entry(entry: fb::DucTableRowEntry) -> ParseResult<types::DucTableRowEntry> {
    Ok(types::DucTableRowEntry {
        key: entry.key().to_string(),
        value: parse_duc_table_row(entry.value().ok_or("Missing DucTableRowEntry.value")?)?,
    })
}

fn parse_duc_table_cell_entry(entry: fb::DucTableCellEntry) -> ParseResult<types::DucTableCellEntry> {
    Ok(types::DucTableCellEntry {
        key: entry.key().to_string(),
        value: parse_duc_table_cell(entry.value().ok_or("Missing DucTableCellEntry.value")?)?,
    })
}

fn parse_duc_table_auto_size(auto_size: fb::DucTableAutoSize) -> ParseResult<types::DucTableAutoSize> {
    Ok(types::DucTableAutoSize {
        columns: auto_size.columns(),
        rows: auto_size.rows(),
    })
}

fn parse_duc_table_element(el: fb::DucTableElement) -> ParseResult<types::DucTableElement> {
    let columns_vec = el.columns().ok_or("Missing DucTableElement.columns")?;
    let columns = columns_vec.iter().map(parse_duc_table_column_entry).collect::<ParseResult<_>>()?;
    
    let rows_vec = el.rows().ok_or("Missing DucTableElement.rows")?;
    let rows = rows_vec.iter().map(parse_duc_table_row_entry).collect::<ParseResult<_>>()?;

    let cells_vec = el.cells().ok_or("Missing DucTableElement.cells")?;
    let cells = cells_vec.iter().map(parse_duc_table_cell_entry).collect::<ParseResult<_>>()?;

    Ok(types::DucTableElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucTableElement.base")?)?,
        style: parse_duc_table_style(el.style().ok_or("Missing DucTableElement.style")?)?,
        column_order: parse_vec_of_required_strings(el.column_order())?,
        row_order: parse_vec_of_required_strings(el.row_order())?,
        columns,
        rows,
        cells,
        header_row_count: el.header_row_count(),
        auto_size: parse_duc_table_auto_size(el.auto_size().ok_or("Missing DucTableElement.auto_size")?)?,
    })
}

fn parse_image_crop(crop: fb::ImageCrop) -> ParseResult<types::ImageCrop> {
    Ok(types::ImageCrop {
        x: crop.x(),
        y: crop.y(),
        width: crop.width(),
        height: crop.height(),
        natural_width: crop.natural_width(),
        natural_height: crop.natural_height(),
    })
}

fn parse_duc_image_element(el: fb::DucImageElement) -> ParseResult<types::DucImageElement> {
    Ok(types::DucImageElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucImageElement.base")?)?,
        file_id: el.file_id().map(|s| s.to_string()),
        status: el.status().expect("Missing DucImageElement.status"),
        scale: el.scale().ok_or("Missing DucImageElement.scale")?.iter().collect(),
        crop: el.crop().map(parse_image_crop).transpose()?,
        filter: el.filter().map(parse_duc_image_filter).transpose()?,
    })
}

fn parse_duc_text_dynamic_element_source(source: fb::DucTextDynamicElementSource) -> ParseResult<types::DucTextDynamicElementSource> {
    Ok(types::DucTextDynamicElementSource {
        element_id: source.element_id().ok_or("Missing DucTextDynamicElementSource.element_id")?.to_string(),
        property: source.property(),
    })
}

fn parse_duc_text_dynamic_dictionary_source(source: fb::DucTextDynamicDictionarySource) -> ParseResult<types::DucTextDynamicDictionarySource> {
    Ok(types::DucTextDynamicDictionarySource {
        key: source.key().ok_or("Missing DucTextDynamicDictionarySource.key")?.to_string(),
    })
}

fn parse_duc_text_dynamic_source(source: fb::DucTextDynamicSource) -> ParseResult<types::DucTextDynamicSource> {
    let source_data = match source.source_type() {
        fb::DucTextDynamicSourceData::DucTextDynamicElementSource => {
            let el_source = source.source_as_duc_text_dynamic_element_source().ok_or("Mismatched dynamic source data")?;
            types::DucTextDynamicSourceData::DucTextDynamicElementSource(parse_duc_text_dynamic_element_source(el_source)?)
        },
        fb::DucTextDynamicSourceData::DucTextDynamicDictionarySource => {
            let dict_source = source.source_as_duc_text_dynamic_dictionary_source().ok_or("Mismatched dynamic source data")?;
            types::DucTextDynamicSourceData::DucTextDynamicDictionarySource(parse_duc_text_dynamic_dictionary_source(dict_source)?)
        },
        _ => return Err("Unknown DucTextDynamicSourceData type"),
    };
    Ok(types::DucTextDynamicSource {
        text_source_type: source.text_source_type(),
        source: source_data,
        formatting: None,
        cached_value: String::new(),
    })
}

fn parse_duc_text_dynamic_part(part: fb::DucTextDynamicPart) -> ParseResult<types::DucTextDynamicPart> {
    Ok(types::DucTextDynamicPart {
        tag: part.tag().ok_or("Missing DucTextDynamicPart.tag")?.to_string(),
        source: parse_duc_text_dynamic_source(part.source().ok_or("Missing DucTextDynamicPart.source")?)?,
        formatting: part.formatting().map(parse_primary_units).transpose()?,
        cached_value: part.cached_value().ok_or("Missing DucTextDynamicPart.cached_value")?.to_string(),
    })
}

fn parse_duc_text_element(el: fb::DucTextElement) -> ParseResult<types::DucTextElement> {
    let dynamic = if let Some(dynamic_vec) = el.dynamic() {
        dynamic_vec.iter().map(parse_duc_text_dynamic_part).collect::<ParseResult<_>>()?
    } else {
        Vec::new()
    };
    Ok(types::DucTextElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucTextElement.base")?)?,
        style: parse_duc_text_style(el.style().ok_or("Missing DucTextElement.style")?)?,
        text: el.text().map(|s| s.to_string()).ok_or("Missing DucTextElement.text")?,
        dynamic,
        auto_resize: el.auto_resize(),
        container_id: el.container_id().map(|s| s.to_string()),
        original_text: el.original_text().map(|s| s.to_string()).unwrap_or_default(),
    })
}

fn parse_duc_linear_element(el: fb::DucLinearElement) -> ParseResult<types::DucLinearElement> {
    Ok(types::DucLinearElement {
        linear_base: parse_duc_linear_element_base(el.linear_base().ok_or("Missing DucLinearElement.linear_base")?)?,
        wipeout_below: el.wipeout_below(),
    })
}

fn parse_duc_arrow_element(el: fb::DucArrowElement) -> ParseResult<types::DucArrowElement> {
    Ok(types::DucArrowElement {
        linear_base: parse_duc_linear_element_base(el.linear_base().ok_or("Missing DucArrowElement.linear_base")?)?,
        elbowed: el.elbowed(),
    })
}

fn parse_duc_free_draw_ends(ends: fb::DucFreeDrawEnds) -> ParseResult<types::DucFreeDrawEnds> {
    Ok(types::DucFreeDrawEnds {
        cap: ends.cap(),
        taper: ends.taper(),
        easing: ends.easing().unwrap_or_default().to_string(),
    })
}

fn parse_duc_free_draw_element(el: fb::DucFreeDrawElement) -> ParseResult<types::DucFreeDrawElement> {
    Ok(types::DucFreeDrawElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucFreeDrawElement.base")?)?,
        points: parse_vec_of_duc_points(el.points()),
        size: el.size(),
        thinning: el.thinning(),
        smoothing: el.smoothing(),
        streamline: el.streamline(),
        easing: el.easing().unwrap_or_default().to_string(),
        start: el.start().map(parse_duc_free_draw_ends).transpose()?,
        end: el.end().map(parse_duc_free_draw_ends).transpose()?,
        pressures: el.pressures().map(|v| v.iter().collect()).unwrap_or_default(),
        simulate_pressure: el.simulate_pressure(),
        last_committed_point: el.last_committed_point().map(|p| parse_duc_point(p)),
        svg_path: el.svg_path().map(|s| s.to_string()),
    })
}

fn parse_duc_block_duplication_array(array: fb::DucBlockDuplicationArray) -> ParseResult<types::DucBlockDuplicationArray> {
    Ok(types::DucBlockDuplicationArray {
        rows: array.rows(),
        cols: array.cols(),
        row_spacing: array.row_spacing(),
        col_spacing: array.col_spacing(),
    })
}

fn parse_duc_frame_element(el: fb::DucFrameElement) -> ParseResult<types::DucFrameElement> {
    Ok(types::DucFrameElement {
        stack_element_base: parse_duc_stack_element_base(el.stack_element_base().ok_or("Missing DucFrameElement.stack_element_base")?)?,
    })
}

fn parse_plot_layout(layout: fb::PlotLayout) -> ParseResult<types::PlotLayout> {
    Ok(types::PlotLayout {
        margins: parse_margins(layout.margins().ok_or("Missing PlotLayout.margins")?)?,
    })
}

fn parse_duc_plot_element(el: fb::DucPlotElement) -> ParseResult<types::DucPlotElement> {
    Ok(types::DucPlotElement {
        stack_element_base: parse_duc_stack_element_base(el.stack_element_base().ok_or("Missing DucPlotElement.stack_element_base")?)?,
        style: parse_duc_plot_style(el.style().ok_or("Missing DucPlotElement.style")?)?,
        layout: parse_plot_layout(el.layout().ok_or("Missing DucPlotElement.layout")?)?,
    })
}

fn parse_duc_viewport_element(el: fb::DucViewportElement) -> ParseResult<types::DucViewportElement> {
    Ok(types::DucViewportElement {
        linear_base: parse_duc_linear_element_base(el.linear_base().ok_or("Missing DucViewportElement.linear_base")?)?,
        stack_base: parse_duc_stack_base(el.stack_base().ok_or("Missing DucViewportElement.stack_base")?)?,
        style: parse_duc_viewport_style(el.style().ok_or("Missing DucViewportElement.style")?)?,
        view: parse_duc_view(el.view().ok_or("Missing DucViewportElement.view")?)?,
        scale: el.scale(),
        shade_plot: el.shade_plot().expect("Missing DucViewportElement.shade_plot"),
        frozen_group_ids: parse_vec_of_strings(el.frozen_group_ids()),
        standard_override: el.standard_override().map(|s| s.to_string()),
    })
}

fn parse_duc_xray_element(el: fb::DucXRayElement) -> ParseResult<types::DucXRayElement> {
    Ok(types::DucXRayElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucXRayElement.base")?)?,
        style: parse_duc_xray_style(el.style().ok_or("Missing DucXRayElement.style")?)?,
        origin: {
            let p = parse_required_duc_point(el.origin())?;
            types::GeometricPoint { x: p.x, y: p.y }
        },
        direction: {
            let p = parse_required_duc_point(el.direction())?;
            types::GeometricPoint { x: p.x, y: p.y }
        },
        start_from_origin: el.start_from_origin(),
    })
}

fn parse_leader_text_block_content(content: fb::LeaderTextBlockContent) -> ParseResult<types::LeaderTextBlockContent> {
    Ok(types::LeaderTextBlockContent {
        text: content.text().ok_or("Missing LeaderTextBlockContent.text")?.to_string(),
    })
}

fn parse_leader_block_content(content: fb::LeaderBlockContent) -> ParseResult<types::LeaderBlockContent> {
    let attribute_values = content
        .attribute_values()
        .map(|v| v.iter().map(parse_string_value_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    let element_overrides = content
        .element_overrides()
        .map(|v| v.iter().map(parse_string_value_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    Ok(types::LeaderBlockContent {
        block_id: content.block_id().ok_or("Missing LeaderBlockContent.block_id")?.to_string(),
        attribute_values: Some(attribute_values),
        element_overrides: Some(element_overrides),
    })
}

fn parse_leader_content(content: fb::LeaderContent) -> ParseResult<types::LeaderContent> {
    let content_data = match content.leader_content_type() {
        Some(fb::LEADER_CONTENT_TYPE::TEXT) => {
            let text_content = content.content_as_leader_text_block_content().ok_or("Mismatched leader content data")?;
            types::LeaderContentData::LeaderTextBlockContent(parse_leader_text_block_content(text_content)?)
        }
        Some(fb::LEADER_CONTENT_TYPE::BLOCK) => {
            let block_content = content.content_as_leader_block_content().ok_or("Mismatched leader content data")?;
            types::LeaderContentData::LeaderBlockContent(parse_leader_block_content(block_content)?)
        }
        _ => return Err("Unknown LeaderContentData type"),
    };
    Ok(types::LeaderContent {
        leader_content_type: content.leader_content_type().expect("Missing LeaderContent.leader_content_type"),
        content: content_data,
    })
}

fn parse_duc_leader_element(el: fb::DucLeaderElement) -> ParseResult<types::DucLeaderElement> {
    Ok(types::DucLeaderElement {
        linear_base: parse_duc_linear_element_base(el.linear_base().ok_or("Missing DucLeaderElement.linear_base")?)?,
        style: parse_duc_leader_style(el.style().ok_or("Missing DucLeaderElement.style")?)?,
        content: el.content().map(parse_leader_content).transpose()?,
        content_anchor: parse_required_geometric_point(el.content_anchor().copied())?,
    })
}

fn parse_dimension_definition_points(points: fb::DimensionDefinitionPoints) -> ParseResult<types::DimensionDefinitionPoints> {
    Ok(types::DimensionDefinitionPoints {
        origin1: parse_required_geometric_point(points.origin1().copied())?,
        origin2: points.origin2().map(|p| parse_geometric_point(&p)),
        location: parse_required_geometric_point(points.location().copied())?,
        center: points.center().map(|p| parse_geometric_point(&p)),
        jog: points.jog().map(|p| parse_geometric_point(&p)),
    })
}

fn parse_dimension_bindings(bindings: fb::DimensionBindings) -> ParseResult<types::DimensionBindings> {
    Ok(types::DimensionBindings {
        origin1: bindings.origin1().map(parse_duc_point_binding).transpose()?,
        origin2: bindings.origin2().map(parse_duc_point_binding).transpose()?,
        center: bindings.center().map(parse_duc_point_binding).transpose()?,
    })
}

fn parse_dimension_baseline_data(data: fb::DimensionBaselineData) -> ParseResult<types::DimensionBaselineData> {
    Ok(types::DimensionBaselineData {
        base_dimension_id: data.base_dimension_id().map(|s| s.to_string()),
    })
}

fn parse_dimension_continue_data(data: fb::DimensionContinueData) -> ParseResult<types::DimensionContinueData> {
    Ok(types::DimensionContinueData {
        continue_from_dimension_id: data.continue_from_dimension_id().map(|s| s.to_string()),
    })
}

fn parse_duc_dimension_element(el: fb::DucDimensionElement) -> ParseResult<types::DucDimensionElement> {
    Ok(types::DucDimensionElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucDimensionElement.base")?)?,
        style: parse_duc_dimension_style(el.style().ok_or("Missing DucDimensionElement.style")?)?,
        dimension_type: el.dimension_type().expect("Missing DucDimensionElement.dimension_type"),
        definition_points: parse_dimension_definition_points(el.definition_points().ok_or("Missing DucDimensionElement.definition_points")?)?,
        oblique_angle: el.oblique_angle(),
        ordinate_axis: el.ordinate_axis(),
        bindings: el.bindings().map(parse_dimension_bindings).transpose()?,
        text_override: el.text_override().map(|s| s.to_string()),
        text_position: el.text_position().map(|p| parse_geometric_point(&p)),
        tolerance_override: el.tolerance_override().map(parse_dimension_tolerance_style).transpose()?,
        baseline_data: el.baseline_data().map(parse_dimension_baseline_data).transpose()?,
        continue_data: el.continue_data().map(parse_dimension_continue_data).transpose()?,
    })
}

fn parse_datum_reference(datum: fb::DatumReference) -> ParseResult<types::DatumReference> {
    Ok(types::DatumReference {
        letters: datum.letters().map(|s| s.to_string()).ok_or("Missing DatumReference.letters")?,
        modifier: datum.modifier(),
    })
}

fn parse_tolerance_clause(clause: fb::ToleranceClause) -> ParseResult<types::ToleranceClause> {
    Ok(types::ToleranceClause {
        value: clause.value().map(|s| s.to_string()).ok_or("Missing ToleranceClause.value")?,
        zone_type: clause.zone_type(),
        feature_modifiers: clause.feature_modifiers().ok_or("Missing ToleranceClause.feature_modifiers")?.iter().collect(),
        material_condition: clause.material_condition(),
    })
}

fn parse_feature_control_frame_segment(segment: fb::FeatureControlFrameSegment) -> ParseResult<types::FeatureControlFrameSegment> {
    let datums_vec = segment.datums().ok_or("Missing FeatureControlFrameSegment.datums")?;
    let datums = datums_vec
        .iter()
        .map(|d| Ok(Some(parse_datum_reference(d)?)))
        .collect::<ParseResult<Vec<Option<types::DatumReference>>>>()?;
    Ok(types::FeatureControlFrameSegment {
        symbol: segment.symbol().expect("Missing FeatureControlFrameSegment.symbol"),
        tolerance: parse_tolerance_clause(segment.tolerance().ok_or("Missing FeatureControlFrameSegment.tolerance")?)?,
        datums,
    })
}

fn parse_fcf_between_modifier(modifier: fb::FCFBetweenModifier) -> ParseResult<types::FCFBetweenModifier> {
    Ok(types::FCFBetweenModifier {
        start: modifier.start().ok_or("Missing FCFBetweenModifier.start")?.to_string(),
        end: modifier.end().ok_or("Missing FCFBetweenModifier.end")?.to_string(),
    })
}

fn parse_fcf_projected_zone_modifier(modifier: fb::FCFProjectedZoneModifier) -> ParseResult<types::FCFProjectedZoneModifier> {
    Ok(types::FCFProjectedZoneModifier {
        value: modifier.value(),
    })
}

fn parse_fcf_frame_modifiers(modifiers: fb::FCFFrameModifiers) -> ParseResult<types::FCFFrameModifiers> {
    Ok(types::FCFFrameModifiers {
        all_around: modifiers.all_around(),
        all_over: modifiers.all_over(),
        continuous_feature: modifiers.continuous_feature(),
        between: modifiers.between().map(parse_fcf_between_modifier).transpose()?,
        projected_tolerance_zone: modifiers.projected_tolerance_zone().map(parse_fcf_projected_zone_modifier).transpose()?,
    })
}

fn parse_fcf_datum_definition(def: fb::FCFDatumDefinition) -> ParseResult<types::FCFDatumDefinition> {
    Ok(types::FCFDatumDefinition {
        letter: def.letter().map(|s| s.to_string()).ok_or("Missing FCFDatumDefinition.letter")?,
        feature_binding: def.feature_binding().map(parse_duc_point_binding).transpose()?,
    })
}

fn parse_fcf_segment_row(row: fb::FCFSegmentRow) -> ParseResult<types::FCFSegmentRow> {
    let segments_vec = row.segments().ok_or("Missing FCFSegmentRow.segments")?;
    let segments = segments_vec.iter().map(parse_feature_control_frame_segment).collect::<ParseResult<_>>()?;
    Ok(types::FCFSegmentRow {
        segments,
    })
}

fn parse_duc_feature_control_frame_element(el: fb::DucFeatureControlFrameElement) -> ParseResult<types::DucFeatureControlFrameElement> {
    let rows_vec = el.rows().ok_or("Missing DucFeatureControlFrameElement.rows")?;
    let rows = rows_vec.iter().map(parse_fcf_segment_row).collect::<ParseResult<_>>()?;
    Ok(types::DucFeatureControlFrameElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucFeatureControlFrameElement.base")?)?,
        style: parse_duc_feature_control_frame_style(el.style().ok_or("Missing DucFeatureControlFrameElement.style")?)?,
        rows,
        frame_modifiers: el.frame_modifiers().map(parse_fcf_frame_modifiers).transpose()?,
        leader_element_id: el.leader_element_id().map(|s| s.to_string()),
        datum_definition: el.datum_definition().map(parse_fcf_datum_definition).transpose()?,
    })
}

fn parse_text_column(col: fb::TextColumn) -> ParseResult<types::TextColumn> {
    Ok(types::TextColumn {
        width: col.width(),
        gutter: col.gutter(),
    })
}

fn parse_column_layout(layout: fb::ColumnLayout) -> ParseResult<types::ColumnLayout> {
    let defs_vec = layout.definitions().ok_or("Missing ColumnLayout.definitions")?;
    let definitions = defs_vec.iter().map(parse_text_column).collect::<ParseResult<_>>()?;
    Ok(types::ColumnLayout {
        column_type: layout.type_().expect("Missing ColumnLayout.type"),
        definitions,
        auto_height: layout.auto_height(),
    })
}

fn parse_duc_doc_element(el: fb::DucDocElement) -> ParseResult<types::DucDocElement> {
    let dynamic = el
        .dynamic()
        .map(|v| v.iter().map(parse_duc_text_dynamic_part).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();
    let grid_config = el.grid_config();
    Ok(types::DucDocElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucDocElement.base")?)?,
        style: parse_duc_doc_style(el.style().ok_or("Missing DucDocElement.style")?)?,
        text: el.text().map(|s| s.to_string()).ok_or("Missing DucDocElement.text")?,
        dynamic,
        flow_direction: el.flow_direction().expect("Missing DucDocElement.flow_direction"),
        columns: parse_column_layout(el.columns().ok_or("Missing DucDocElement.columns")?)?,
        auto_resize: el.auto_resize(),
        file_id: el.file_id().map(|s| s.to_string()),
        grid_config: match grid_config {
            Some(gc) => types::DocumentGridConfig {
                columns: gc.columns(),
                gap_x: gc.gap_x(),
                gap_y: gc.gap_y(),
                align_items: gc.align_items().map(|a| a.into()).unwrap_or(types::DocumentGridAlignItems::Start),
                first_page_alone: gc.first_page_alone(),
            },
            None => types::DocumentGridConfig {
                columns: 1,
                gap_x: 0.0,
                gap_y: 0.0,
                align_items: types::DocumentGridAlignItems::Start,
                first_page_alone: false,
            },
        },
    })
}

fn parse_parametric_source(source: fb::ParametricSource) -> ParseResult<types::ParametricSource> {
    Ok(types::ParametricSource {
        source_type: source.type_().expect("Missing ParametricSource.type"),
        code: source.code().unwrap_or_default().to_string(),
        file_id: source.file_id().map(|s| s.to_string()),
    })
}

fn parse_duc_parametric_element(el: fb::DucParametricElement) -> ParseResult<types::DucParametricElement> {
    Ok(types::DucParametricElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucParametricElement.base")?)?,
        source: parse_parametric_source(el.source().ok_or("Missing DucParametricElement.source")?)?,
    })
}

fn parse_duc_model_element(el: fb::DucModelElement) -> ParseResult<types::DucModelElement> {
    let file_ids = el.file_ids()
        .map(|v| v.iter().map(|s| s.to_string()).collect::<Vec<_>>())
        .unwrap_or_default();
    Ok(types::DucModelElement {
        base: parse_duc_element_base(el.base().ok_or("Missing DucModelElement.base")?)?,
        source: el.source().ok_or("Missing DucModelElement.source")?.to_string(),
        svg_path: el.svg_path().map(|s| s.to_string()),
        file_ids,
    })
}

// =============================================================================
// ELEMENT UNION & WRAPPER
// =============================================================================

fn parse_element_wrapper(wrapper: fb::ElementWrapper) -> ParseResult<types::ElementWrapper> {
    let element_enum = match wrapper.element_type() {
        fb::Element::DucRectangleElement => {
            let el = wrapper.element_as_duc_rectangle_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucRectangleElement(parse_duc_rectangle_element(el)?)
        },
        fb::Element::DucPolygonElement => {
            let el = wrapper.element_as_duc_polygon_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucPolygonElement(parse_duc_polygon_element(el)?)
        },
        fb::Element::DucEllipseElement => {
            let el = wrapper.element_as_duc_ellipse_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucEllipseElement(parse_duc_ellipse_element(el)?)
        },
        fb::Element::DucEmbeddableElement => {
            let el = wrapper.element_as_duc_embeddable_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucEmbeddableElement(parse_duc_embeddable_element(el)?)
        },
        fb::Element::DucPdfElement => {
            let el = wrapper.element_as_duc_pdf_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucPdfElement(parse_duc_pdf_element(el)?)
        },
        fb::Element::DucMermaidElement => {
            let el = wrapper.element_as_duc_mermaid_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucMermaidElement(parse_duc_mermaid_element(el)?)
        },
        fb::Element::DucTableElement => {
            let el = wrapper.element_as_duc_table_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucTableElement(parse_duc_table_element(el)?)
        },
        fb::Element::DucImageElement => {
            let el = wrapper.element_as_duc_image_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucImageElement(parse_duc_image_element(el)?)
        },
        fb::Element::DucTextElement => {
            let el = wrapper.element_as_duc_text_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucTextElement(parse_duc_text_element(el)?)
        },
        fb::Element::DucLinearElement => {
            let el = wrapper.element_as_duc_linear_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucLinearElement(parse_duc_linear_element(el)?)
        },
        fb::Element::DucArrowElement => {
            let el = wrapper.element_as_duc_arrow_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucArrowElement(parse_duc_arrow_element(el)?)
        },
        fb::Element::DucFreeDrawElement => {
            let el = wrapper.element_as_duc_free_draw_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucFreeDrawElement(parse_duc_free_draw_element(el)?)
        },
        fb::Element::DucFrameElement => {
            let el = wrapper.element_as_duc_frame_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucFrameElement(parse_duc_frame_element(el)?)
        },
        fb::Element::DucPlotElement => {
            let el = wrapper.element_as_duc_plot_element().ok_or("Missing element type")?;
            types::DucElementEnum::DucPlotElement(parse_duc_plot_element(el)?)
        },
        fb::Element::DucViewportElement => {
            let el = wrapper.element_as_duc_viewport_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucViewportElement(parse_duc_viewport_element(el)?)
        },
        fb::Element::DucXRayElement => {
            let el = wrapper.element_as_duc_xray_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucXRayElement(parse_duc_xray_element(el)?)
        },
        fb::Element::DucLeaderElement => {
            let el = wrapper.element_as_duc_leader_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucLeaderElement(parse_duc_leader_element(el)?)
        },
        fb::Element::DucDimensionElement => {
            let el = wrapper.element_as_duc_dimension_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucDimensionElement(parse_duc_dimension_element(el)?)
        },
        fb::Element::DucFeatureControlFrameElement => {
            let el = wrapper.element_as_duc_feature_control_frame_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucFeatureControlFrameElement(parse_duc_feature_control_frame_element(el)?)
        },
        fb::Element::DucDocElement => {
            let el = wrapper.element_as_duc_doc_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucDocElement(parse_duc_doc_element(el)?)
        },
        fb::Element::DucParametricElement => {
            let el = wrapper.element_as_duc_parametric_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucParametricElement(parse_duc_parametric_element(el)?)
        },
        fb::Element::DucModelElement => {
            let el = wrapper.element_as_duc_model_element().ok_or("Mismatched element type")?;
            types::DucElementEnum::DucModelElement(parse_duc_model_element(el)?)
        },
        _ => return Err("Unknown element type in wrapper"),
    };
    Ok(types::ElementWrapper { element: element_enum })
}


// =============================================================================
// BLOCK DEFINITIONS
// =============================================================================

fn parse_duc_block_attribute_definition(def: fb::DucBlockAttributeDefinition) -> ParseResult<types::DucBlockAttributeDefinition> {
    Ok(types::DucBlockAttributeDefinition {
        tag: def.tag().ok_or("Missing DucBlockAttributeDefinition.tag")?.to_string(),
        prompt: def.prompt().map(|s| s.to_string()),
        default_value: def.default_value().ok_or("Missing DucBlockAttributeDefinition.default_value")?.to_string(),
        is_constant: def.is_constant(),
    })
}

fn parse_duc_block_attribute_definition_entry(entry: fb::DucBlockAttributeDefinitionEntry) -> ParseResult<types::DucBlockAttributeDefinitionEntry> {
    Ok(types::DucBlockAttributeDefinitionEntry {
        key: entry.key().to_string(),
        value: parse_duc_block_attribute_definition(entry.value().ok_or("Missing DucBlockAttributeDefinitionEntry.value")?)?,
    })
}

fn parse_duc_block_metadata(metadata: fb::DucBlockMetadata) -> ParseResult<types::DucBlockMetadata> {
    let source = metadata.source()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    Ok(types::DucBlockMetadata {
        source,
        usage_count: metadata.usage_count(),
        created_at: metadata.created_at(),
        updated_at: metadata.updated_at(),
        localization: parse_binary_json_to_string(metadata.localization()),
    })
}

fn parse_duc_block(block: fb::DucBlock) -> ParseResult<types::DucBlock> {
    let attribute_definitions = if let Some(defs_vec) = block.attribute_definitions() {
        defs_vec.iter().map(parse_duc_block_attribute_definition_entry).collect::<ParseResult<_>>()?
    } else {
        Vec::new()
    };

    let metadata = if let Some(metadata_fb) = block.metadata() {
        Some(parse_duc_block_metadata(metadata_fb)?)
    } else {
        None
    };

    let thumbnail = block.thumbnail().map(|data| (0..data.len()).map(|i| data.get(i)).collect::<Vec<_>>());

    Ok(types::DucBlock {
        id: block.id().to_string(),
        label: block.label().map(|s| s.to_string()).unwrap_or_default(),
        description: block.description().map(|s| s.to_string()),
        version: block.version(),
        attribute_definitions,
        metadata,
        thumbnail,
    })
}

fn parse_duc_block_instance(el: fb::DucBlockInstance) -> ParseResult<types::DucBlockInstance> {
    let element_overrides = el
        .element_overrides()
        .map(|v| v.iter().map(parse_string_value_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();
    let attribute_values = el
        .attribute_values()
        .map(|v| v.iter().map(parse_string_value_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();
    Ok(types::DucBlockInstance {
        id: el.id().ok_or("Missing DucBlockInstance.id")?.to_string(),
        block_id: el.block_id().ok_or("Missing DucBlockInstance.block_id")?.to_string(),
        version: el.version(),
        element_overrides: Some(element_overrides),
        attribute_values: Some(attribute_values),
        duplication_array: el.duplication_array().map(parse_duc_block_duplication_array).transpose()?,
    })
}

fn parse_duc_block_collection(el: fb::DucBlockCollection) -> ParseResult<types::DucBlockCollection> {
    let children = el
        .children()
        .map(|v| v.iter().map(parse_duc_block_collection_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    let metadata = el.metadata().map(parse_duc_block_metadata).transpose()?;

    Ok(types::DucBlockCollection {
        id: el.id().ok_or("Missing DucBlockCollection.id")?.to_string(),
        label: el.label().ok_or("Missing DucBlockCollection.label")?.to_string(),
        children,
        metadata,
        thumbnail: el.thumbnail().map(|b| b.bytes().to_vec()),
    })
}

fn parse_duc_block_collection_entry(entry: fb::DucBlockCollectionEntry) -> ParseResult<types::DucBlockCollectionEntry> {
    Ok(types::DucBlockCollectionEntry {
        id: entry.id().ok_or("Missing DucBlockCollectionEntry.id")?.to_string(),
        is_collection: entry.is_collection(),
    })
}


// =============================================================================
// APP & DOCUMENT STATE
// =============================================================================

fn parse_duc_global_state(state: fb::DucGlobalState) -> ParseResult<types::DucGlobalState> {
    Ok(types::DucGlobalState {
        name: Some(state.name().map(|s| s.to_string()).unwrap_or_default()),
        view_background_color: state.view_background_color().map(|s| s.to_string()).unwrap_or_default(),
        main_scope: state.main_scope().map(|s| s.to_string()).unwrap_or_default(),
        dash_spacing_scale: state.dash_spacing_scale(),
        is_dash_spacing_affected_by_viewport_scale: state.is_dash_spacing_affected_by_viewport_scale(),
        scope_exponent_threshold: state.scope_exponent_threshold(),
        dimensions_associative_by_default: state.dimensions_associative_by_default(),
        use_annotative_scaling: state.use_annotative_scaling(),
        display_precision_linear: state.display_precision_linear(),
        display_precision_angular: state.display_precision_angular(),
        pruning_level: state.pruning_level().expect("Missing DucGlobalState.pruning_level"),
    })
}

fn parse_duc_local_state(state: fb::DucLocalState) -> ParseResult<types::DucLocalState> {
    Ok(types::DucLocalState {
        scope: state.scope().ok_or("Missing DucLocalState.scope")?.to_string(),
        active_standard_id: state.active_standard_id().ok_or("Missing DucLocalState.active_standard_id")?.to_string(),
        scroll_x: state.scroll_x(),
        scroll_y: state.scroll_y(),
        zoom: state.zoom(),
        active_grid_settings: state.active_grid_settings().map(|v| {
            let arr = parse_vec_of_strings(Some(v));
            if arr.is_empty() { None } else { Some(arr) }
        }).flatten(),
        active_snap_settings: state.active_snap_settings().map(|s| s.to_string()),
        is_binding_enabled: state.is_binding_enabled(),
        current_item_stroke: state.current_item_stroke().map(parse_element_stroke).transpose()?,
        current_item_background: state.current_item_background().map(parse_element_background).transpose()?,
        current_item_opacity: state.current_item_opacity(),
        current_item_font_family: state.current_item_font_family().map(|s| s.to_string()).unwrap_or_default(),
        current_item_font_size: state.current_item_font_size(),
        current_item_text_align: state.current_item_text_align().unwrap_or(fb::TEXT_ALIGN(0)),
        current_item_start_line_head: state.current_item_start_line_head().map(parse_duc_head).transpose()?,
        current_item_end_line_head: state.current_item_end_line_head().map(parse_duc_head).transpose()?,
        current_item_roundness: state.current_item_roundness(),
        pen_mode: state.pen_mode(),
        view_mode_enabled: state.view_mode_enabled(),
        objects_snap_mode_enabled: state.objects_snap_mode_enabled(),
        grid_mode_enabled: state.grid_mode_enabled(),
        outline_mode_enabled: state.outline_mode_enabled(),
        manual_save_mode: state.manual_save_mode(),
    })
}

fn parse_duc_group(group: fb::DucGroup) -> ParseResult<types::DucGroup> {
    Ok(types::DucGroup {
        id: group.id().to_string(),
        stack_base: parse_duc_stack_base(group.stack_base().ok_or("Missing DucGroup.stack_base")?)?,
    })
}

fn parse_duc_region(region: fb::DucRegion) -> ParseResult<types::DucRegion> {
    Ok(types::DucRegion {
        id: region.id().to_string(),
        stack_base: parse_duc_stack_base(region.stack_base().ok_or("Missing DucRegion.stack_base")?)?,
        boolean_operation: region.boolean_operation().expect("Missing DucRegion.boolean_operation"),
    })
}

fn parse_duc_layer_overrides(overrides: fb::DucLayerOverrides) -> ParseResult<types::DucLayerOverrides> {
    Ok(types::DucLayerOverrides {
        stroke: parse_element_stroke(overrides.stroke().ok_or("Missing DucLayerOverrides.stroke")?)?,
        background: parse_element_background(overrides.background().ok_or("Missing DucLayerOverrides.background")?)?,
    })
}

fn parse_duc_layer(layer: fb::DucLayer) -> ParseResult<types::DucLayer> {
    Ok(types::DucLayer {
        id: layer.id().to_string(),
        stack_base: parse_duc_stack_base(layer.stack_base().ok_or("Missing DucLayer.stack_base")?)?,
        readonly: layer.readonly(),
        overrides: layer.overrides().map(parse_duc_layer_overrides).transpose()?,
    })
}


// =============================================================================
// STANDARDS & SETTINGS
// =============================================================================

fn parse_unit_system_base(base: fb::_UnitSystemBase) -> ParseResult<types::UnitSystemBase> {
    Ok(types::UnitSystemBase {
        system: base.system().expect("Missing UnitSystemBase.system"),
        format: None,
        precision: base.precision(),
        suppress_leading_zeros: base.suppress_leading_zeros(),
        suppress_trailing_zeros: base.suppress_trailing_zeros(),
    })
}

fn parse_linear_unit_system(sys: fb::LinearUnitSystem) -> ParseResult<types::LinearUnitSystem> {
    Ok(types::LinearUnitSystem {
        base: parse_unit_system_base(sys.base().ok_or("Missing LinearUnitSystem.base")?)?,
        format: sys.format().expect("Missing LinearUnitSystem.format"),
        decimal_separator: sys.decimal_separator().expect("Missing LinearUnitSystem.decimal_separator"),
        suppress_zero_feet: sys.suppress_zero_feet(),
        suppress_zero_inches: sys.suppress_zero_inches(),
    })
}

fn parse_angular_unit_system(sys: fb::AngularUnitSystem) -> ParseResult<types::AngularUnitSystem> {
    Ok(types::AngularUnitSystem {
        base: parse_unit_system_base(sys.base().ok_or("Missing AngularUnitSystem.base")?)?,
        format: sys.format().expect("Missing AngularUnitSystem.format"),
    })
}

fn parse_alternate_units(units: fb::AlternateUnits) -> ParseResult<types::AlternateUnits> {
    Ok(types::AlternateUnits {
        base: parse_unit_system_base(units.base().ok_or("Missing AlternateUnits.base")?)?,
        format: units.format().expect("Missing AlternateUnits.format"),
        is_visible: units.is_visible(),
        multiplier: units.multiplier(),
    })
}

fn parse_primary_units(units: fb::PrimaryUnits) -> ParseResult<types::PrimaryUnits> {
    Ok(types::PrimaryUnits {
        linear: parse_linear_unit_system(units.linear().ok_or("Missing PrimaryUnits.linear")?)?,
        angular: parse_angular_unit_system(units.angular().ok_or("Missing PrimaryUnits.angular")?)?,
    })
}

fn parse_standard_units(units: fb::StandardUnits) -> ParseResult<types::StandardUnits> {
    Ok(types::StandardUnits {
        primary_units: parse_primary_units(units.primary_units().ok_or("Missing StandardUnits.primary_units")?)?,
        alternate_units: parse_alternate_units(units.alternate_units().ok_or("Missing StandardUnits.alternate_units")?)?,
    })
}

fn parse_unit_precision(precision: fb::UnitPrecision) -> ParseResult<types::UnitPrecision> {
    Ok(types::UnitPrecision {
        linear: Some(precision.linear()),
        angular: Some(precision.angular()),
        area: Some(precision.area()),
        volume: Some(precision.volume()),
    })
}

fn parse_standard_overrides(overrides: fb::StandardOverrides) -> ParseResult<types::StandardOverrides> {
    let _ = overrides.active_grid_settings_id().map(|v| parse_vec_of_strings(Some(v)));
    Ok(types::StandardOverrides {
        main_scope: overrides.main_scope().map(|s| s.to_string()),
        elements_stroke_width_override: Some(overrides.elements_stroke_width_override()),
        common_style_id: overrides.common_style_id().map(|s| s.to_string()),
        stack_like_style_id: overrides.stack_like_style_id().map(|s| s.to_string()),
        text_style_id: overrides.text_style_id().map(|s| s.to_string()),
        dimension_style_id: overrides.dimension_style_id().map(|s| s.to_string()),
        leader_style_id: overrides.leader_style_id().map(|s| s.to_string()),
        feature_control_frame_style_id: overrides.feature_control_frame_style_id().map(|s| s.to_string()),
        table_style_id: overrides.table_style_id().map(|s| s.to_string()),
        doc_style_id: overrides.doc_style_id().map(|s| s.to_string()),
        viewport_style_id: overrides.viewport_style_id().map(|s| s.to_string()),
        plot_style_id: overrides.plot_style_id().map(|s| s.to_string()),
        hatch_style_id: overrides.hatch_style_id().map(|s| s.to_string()),
        active_grid_settings_id: overrides.active_grid_settings_id().map(|v| v.iter().map(|s| s.to_string()).collect()),
        active_snap_settings_id: overrides.active_snap_settings_id().map(|s| s.to_string()),
        dash_line_override: overrides.dash_line_override().map(|s| s.to_string()),
        unit_precision: overrides.unit_precision().map(parse_unit_precision).transpose()?,
    })
}

fn parse_duc_common_style(style: fb::DucCommonStyle) -> ParseResult<types::DucCommonStyle> {
    Ok(types::DucCommonStyle {
        background: parse_element_background(style.background().ok_or("Missing DucCommonStyle.background")?)?,
        stroke: parse_element_stroke(style.stroke().ok_or("Missing DucCommonStyle.stroke")?)?,
    })
}

fn parse_identified_common_style(style: fb::IdentifiedCommonStyle) -> ParseResult<types::IdentifiedCommonStyle> {
    Ok(types::IdentifiedCommonStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedCommonStyle.id")?)?,
        style: parse_duc_common_style(style.style().ok_or("Missing IdentifiedCommonStyle.style")?)?,
    })
}

fn parse_identified_stack_like_style(style: fb::IdentifiedStackLikeStyle) -> ParseResult<types::IdentifiedStackLikeStyle> {
    Ok(types::IdentifiedStackLikeStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedStackLikeStyle.id")?)?,
        style: parse_duc_stack_like_styles(style.style().ok_or("Missing IdentifiedStackLikeStyle.style")?)?,
    })
}

fn parse_identified_text_style(style: fb::IdentifiedTextStyle) -> ParseResult<types::IdentifiedTextStyle> {
    Ok(types::IdentifiedTextStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedTextStyle.id")?)?,
        style: parse_duc_text_style(style.style().ok_or("Missing IdentifiedTextStyle.style")?)?,
    })
}

fn parse_identified_dimension_style(style: fb::IdentifiedDimensionStyle) -> ParseResult<types::IdentifiedDimensionStyle> {
    Ok(types::IdentifiedDimensionStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedDimensionStyle.id")?)?,
        style: parse_duc_dimension_style(style.style().ok_or("Missing IdentifiedDimensionStyle.style")?)?,
    })
}

fn parse_identified_leader_style(style: fb::IdentifiedLeaderStyle) -> ParseResult<types::IdentifiedLeaderStyle> {
    Ok(types::IdentifiedLeaderStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedLeaderStyle.id")?)?,
        style: parse_duc_leader_style(style.style().ok_or("Missing IdentifiedLeaderStyle.style")?)?,
    })
}

fn parse_identified_fcf_style(style: fb::IdentifiedFCFStyle) -> ParseResult<types::IdentifiedFCFStyle> {
    Ok(types::IdentifiedFCFStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedFCFStyle.id")?)?,
        style: parse_duc_feature_control_frame_style(style.style().ok_or("Missing IdentifiedFCFStyle.style")?)?,
    })
}

fn parse_identified_table_style(style: fb::IdentifiedTableStyle) -> ParseResult<types::IdentifiedTableStyle> {
    Ok(types::IdentifiedTableStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedTableStyle.id")?)?,
        style: parse_duc_table_style(style.style().ok_or("Missing IdentifiedTableStyle.style")?)?,
    })
}

fn parse_identified_doc_style(style: fb::IdentifiedDocStyle) -> ParseResult<types::IdentifiedDocStyle> {
    Ok(types::IdentifiedDocStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedDocStyle.id")?)?,
        style: parse_duc_doc_style(style.style().ok_or("Missing IdentifiedDocStyle.style")?)?,
    })
}

fn parse_identified_viewport_style(style: fb::IdentifiedViewportStyle) -> ParseResult<types::IdentifiedViewportStyle> {
    Ok(types::IdentifiedViewportStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedViewportStyle.id")?)?,
        style: parse_duc_viewport_style(style.style().ok_or("Missing IdentifiedViewportStyle.style")?)?,
    })
}

fn parse_identified_hatch_style(style: fb::IdentifiedHatchStyle) -> ParseResult<types::IdentifiedHatchStyle> {
    Ok(types::IdentifiedHatchStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedHatchStyle.id")?)?,
        style: parse_duc_hatch_style(style.style().ok_or("Missing IdentifiedHatchStyle.style")?)?,
    })
}

fn parse_identified_xray_style(style: fb::IdentifiedXRayStyle) -> ParseResult<types::IdentifiedXRayStyle> {
    Ok(types::IdentifiedXRayStyle {
        id: parse_identifier(style.id().ok_or("Missing IdentifiedXRayStyle.id")?)?,
        style: parse_duc_xray_style(style.style().ok_or("Missing IdentifiedXRayStyle.style")?)?,
    })
}

fn parse_standard_styles(styles: fb::StandardStyles) -> ParseResult<types::StandardStyles> {
    let common_styles = styles.common_styles().ok_or("Missing StandardStyles.common_styles")?.iter().map(parse_identified_common_style).collect::<ParseResult<_>>()?;
    let stack_like_styles = styles.stack_like_styles().ok_or("Missing StandardStyles.stack_like_styles")?.iter().map(parse_identified_stack_like_style).collect::<ParseResult<_>>()?;
    let text_styles = styles.text_styles().ok_or("Missing StandardStyles.text_styles")?.iter().map(parse_identified_text_style).collect::<ParseResult<_>>()?;
    let dimension_styles = styles.dimension_styles().ok_or("Missing StandardStyles.dimension_styles")?.iter().map(parse_identified_dimension_style).collect::<ParseResult<_>>()?;
    let leader_styles = styles.leader_styles().ok_or("Missing StandardStyles.leader_styles")?.iter().map(parse_identified_leader_style).collect::<ParseResult<_>>()?;
    let fcf_styles = styles.feature_control_frame_styles().ok_or("Missing StandardStyles.feature_control_frame_styles")?.iter().map(parse_identified_fcf_style).collect::<ParseResult<_>>()?;
    let table_styles = styles.table_styles().ok_or("Missing StandardStyles.table_styles")?.iter().map(parse_identified_table_style).collect::<ParseResult<_>>()?;
    let doc_styles = styles.doc_styles().ok_or("Missing StandardStyles.doc_styles")?.iter().map(parse_identified_doc_style).collect::<ParseResult<_>>()?;
    let viewport_styles = styles.viewport_styles().ok_or("Missing StandardStyles.viewport_styles")?.iter().map(parse_identified_viewport_style).collect::<ParseResult<_>>()?;
    let hatch_styles = styles.hatch_styles().ok_or("Missing StandardStyles.hatch_styles")?.iter().map(parse_identified_hatch_style).collect::<ParseResult<_>>()?;
    let xray_styles = styles.xray_styles().ok_or("Missing StandardStyles.xray_styles")?.iter().map(parse_identified_xray_style).collect::<ParseResult<_>>()?;
    Ok(types::StandardStyles {
        common_styles,
        stack_like_styles,
        text_styles,
        dimension_styles,
        leader_styles,
        feature_control_frame_styles: fcf_styles,
        table_styles,
        doc_styles,
        viewport_styles,
        hatch_styles,
        xray_styles,
    })
}

fn parse_grid_style(style: fb::GridStyle) -> ParseResult<types::GridStyle> {
    Ok(types::GridStyle {
        color: style.color().ok_or("Missing GridStyle.color")?.to_string(),
        opacity: style.opacity(),
        dash_pattern: style.dash_pattern().ok_or("Missing GridStyle.dash_pattern")?.iter().collect(),
    })
}

fn parse_polar_grid_settings(settings: fb::PolarGridSettings) -> ParseResult<types::PolarGridSettings> {
    Ok(types::PolarGridSettings {
        radial_divisions: settings.radial_divisions(),
        radial_spacing: settings.radial_spacing(),
        show_labels: settings.show_labels(),
    })
}

fn parse_isometric_grid_settings(settings: fb::IsometricGridSettings) -> ParseResult<types::IsometricGridSettings> {
    Ok(types::IsometricGridSettings {
        left_angle: settings.left_angle(),
        right_angle: settings.right_angle(),
    })
}

fn parse_grid_settings(settings: fb::GridSettings) -> ParseResult<types::GridSettings> {
    Ok(types::GridSettings {
        grid_type: settings.type_().expect("Missing GridSettings.type"),
        readonly: settings.readonly(),
        display_type: settings.display_type().expect("Missing GridSettings.display_type"),
        is_adaptive: settings.is_adaptive(),
        x_spacing: settings.x_spacing(),
        y_spacing: settings.y_spacing(),
        subdivisions: settings.subdivisions(),
        origin: parse_required_geometric_point(settings.origin().copied())?,
        rotation: settings.rotation(),
        follow_ucs: settings.follow_ucs(),
        major_style: parse_grid_style(settings.major_style().ok_or("Missing GridSettings.major_style")?)?,
        minor_style: parse_grid_style(settings.minor_style().ok_or("Missing GridSettings.minor_style")?)?,
        show_minor: settings.show_minor(),
        min_zoom: settings.min_zoom(),
        max_zoom: settings.max_zoom(),
        auto_hide: settings.auto_hide(),
        polar_settings: settings.polar_settings().map(parse_polar_grid_settings).transpose()?,
        isometric_settings: settings.isometric_settings().map(parse_isometric_grid_settings).transpose()?,
        enable_snapping: settings.enable_snapping(),
        // construction_snap_enabled and snap_to_grid_intersections are not present in the generated getters
        construction_snap_enabled: false,
        snap_to_grid_intersections: None,
    })
}

fn parse_snap_override(so: fb::SnapOverride) -> ParseResult<types::SnapOverride> {
    Ok(types::SnapOverride {
        key: so.key().ok_or("Missing SnapOverride.key")?.to_string(),
        behavior: so.behavior(),
    })
}

fn parse_dynamic_snap_settings(settings: fb::DynamicSnapSettings) -> ParseResult<types::DynamicSnapSettings> {
    Ok(types::DynamicSnapSettings {
        enabled_during_drag: settings.enabled_during_drag(),
        enabled_during_rotation: settings.enabled_during_rotation(),
        enabled_during_scale: settings.enabled_during_scale(),
    })
}

fn parse_polar_tracking_settings(settings: fb::PolarTrackingSettings) -> ParseResult<types::PolarTrackingSettings> {
    Ok(types::PolarTrackingSettings {
        enabled: settings.enabled(),
        angles: settings.angles().ok_or("Missing PolarTrackingSettings.angles")?.iter().collect(),
        increment_angle: Some(settings.increment_angle()),
        track_from_last_point: settings.track_from_last_point(),
        show_polar_coordinates: settings.show_polar_coordinates(),
    })
}

fn parse_tracking_line_style(style: fb::TrackingLineStyle) -> ParseResult<types::TrackingLineStyle> {
    Ok(types::TrackingLineStyle {
        color: style.color().ok_or("Missing TrackingLineStyle.color")?.to_string(),
        opacity: style.opacity(),
        dash_pattern: style.dash_pattern().map(|v| v.iter().collect()),
    })
}

fn parse_layer_snap_filters(filters: fb::LayerSnapFilters) -> ParseResult<types::LayerSnapFilters> {
    Ok(types::LayerSnapFilters {
        include_layers: filters.include_layers().map(|v| parse_vec_of_strings(Some(v))),
        exclude_layers: filters.exclude_layers().map(|v| parse_vec_of_strings(Some(v))),
    })
}

fn parse_snap_marker_style(style: fb::SnapMarkerStyle) -> ParseResult<types::SnapMarkerStyle> {
    Ok(types::SnapMarkerStyle {
        shape: style.shape().expect("Missing SnapMarkerStyle.shape"),
        color: style.color().ok_or("Missing SnapMarkerStyle.color")?.to_string(),
    })
}

fn parse_snap_marker_style_entry(entry: fb::SnapMarkerStyleEntry) -> ParseResult<types::SnapMarkerStyleEntry> {
    Ok(types::SnapMarkerStyleEntry {
        key: entry.key().expect("Missing SnapMarkerStyleEntry.key"),
        value: parse_snap_marker_style(entry.value().ok_or("Missing SnapMarkerStyleEntry.value")?)?,
    })
}

fn parse_snap_marker_settings(settings: fb::SnapMarkerSettings) -> ParseResult<types::SnapMarkerSettings> {
    let styles_vec = settings.styles().ok_or("Missing SnapMarkerSettings.styles")?;
    let styles = styles_vec.iter().map(parse_snap_marker_style_entry).collect::<ParseResult<_>>()?;
    Ok(types::SnapMarkerSettings {
        enabled: settings.enabled(),
        size: settings.size(),
        duration: Some(settings.duration()),
        styles,
    })
}

fn parse_snap_settings(settings: fb::SnapSettings) -> ParseResult<types::SnapSettings> {
    let temporary_overrides = settings
        .temporary_overrides()
        .map(|v| v.iter().map(parse_snap_override).collect::<ParseResult<Vec<_>>>())
        .transpose()?;
    Ok(types::SnapSettings {
        readonly: settings.readonly(),
        twist_angle: settings.twist_angle(),
        snap_tolerance: settings.snap_tolerance(),
        object_snap_aperture: settings.object_snap_aperture(),
        is_ortho_mode_on: settings.is_ortho_mode_on(),
        polar_tracking: parse_polar_tracking_settings(settings.polar_tracking().ok_or("Missing SnapSettings.polar_tracking")?)?,
        is_object_snap_on: settings.is_object_snap_on(),
        active_object_snap_modes: settings.active_object_snap_modes().ok_or("Missing SnapSettings.active_object_snap_modes")?.iter().collect(),
        snap_priority: settings.snap_priority().ok_or("Missing SnapSettings.snap_priority")?.iter().collect(),
        show_tracking_lines: settings.show_tracking_lines(),
        tracking_line_style: settings.tracking_line_style().map(parse_tracking_line_style).transpose()?,
        dynamic_snap: parse_dynamic_snap_settings(settings.dynamic_snap().ok_or("Missing SnapSettings.dynamic_snap")?)?,
        temporary_overrides,
        incremental_distance: Some(settings.incremental_distance()),
        magnetic_strength: Some(settings.magnetic_strength()),
        layer_snap_filters: settings.layer_snap_filters().map(parse_layer_snap_filters).transpose()?,
        element_type_filters: settings.element_type_filters().map(|v| parse_vec_of_strings(Some(v))),
        snap_mode: settings.snap_mode().expect("Missing SnapSettings.snap_mode"),
        snap_markers: parse_snap_marker_settings(settings.snap_markers().ok_or("Missing SnapSettings.snap_markers")?)?,
        construction_snap_enabled: settings.construction_snap_enabled(),
        snap_to_grid_intersections: Some(settings.snap_to_grid_intersections()),
    })
}

fn parse_identified_grid_settings(settings: fb::IdentifiedGridSettings) -> ParseResult<types::IdentifiedGridSettings> {
    Ok(types::IdentifiedGridSettings {
        id: parse_identifier(settings.id().ok_or("Missing IdentifiedGridSettings.id")?)?,
        settings: parse_grid_settings(settings.settings().ok_or("Missing IdentifiedGridSettings.settings")?)?,
    })
}

fn parse_identified_snap_settings(settings: fb::IdentifiedSnapSettings) -> ParseResult<types::IdentifiedSnapSettings> {
    Ok(types::IdentifiedSnapSettings {
        id: parse_identifier(settings.id().ok_or("Missing IdentifiedSnapSettings.id")?)?,
        settings: parse_snap_settings(settings.settings().ok_or("Missing IdentifiedSnapSettings.settings")?)?,
    })
}

fn parse_identified_ucs(ucs: fb::IdentifiedUcs) -> ParseResult<types::IdentifiedUcs> {
    Ok(types::IdentifiedUcs {
        id: parse_identifier(ucs.id().ok_or("Missing IdentifiedUcs.id")?)?,
        ucs: parse_duc_ucs(ucs.ucs().ok_or("Missing IdentifiedUcs.ucs")?)?,
    })
}

fn parse_identified_view(view: fb::IdentifiedView) -> ParseResult<types::IdentifiedView> {
    Ok(types::IdentifiedView {
        id: parse_identifier(view.id().ok_or("Missing IdentifiedView.id")?)?,
        view: parse_duc_view(view.view().ok_or("Missing IdentifiedView.view")?)?,
    })
}

fn parse_standard_view_settings(settings: fb::StandardViewSettings) -> ParseResult<types::StandardViewSettings> {
    let views_vec = settings.views().ok_or("Missing StandardViewSettings.views")?;
    let views = views_vec.iter().map(parse_identified_view).collect::<ParseResult<Vec<_>>>()?;

    let ucs_vec = settings.ucs().ok_or("Missing StandardViewSettings.ucs")?;
    let ucs = ucs_vec.iter().map(parse_identified_ucs).collect::<ParseResult<Vec<_>>>()?;

    let grid_settings = settings
        .grid_settings()
        .map(|v| v.iter().map(parse_identified_grid_settings).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    let snap_settings = settings
        .snap_settings()
        .map(|v| v.iter().map(parse_identified_snap_settings).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    Ok(types::StandardViewSettings {
        views,
        ucs,
        grid_settings,
        snap_settings,
    })
}

fn parse_dimension_validation_rules(rules: fb::DimensionValidationRules) -> ParseResult<types::DimensionValidationRules> {
    Ok(types::DimensionValidationRules {
        min_text_height: Some(rules.min_text_height()),
        max_text_height: Some(rules.max_text_height()),
        allowed_precisions: rules.allowed_precisions().ok_or("Missing DimensionValidationRules.allowed_precisions")?.iter().collect(),
    })
}

fn parse_layer_validation_rules(rules: fb::LayerValidationRules) -> ParseResult<types::LayerValidationRules> {
    Ok(types::LayerValidationRules {
        prohibited_layer_names: rules.prohibited_layer_names().map(|v| parse_vec_of_strings(Some(v))),
    })
}

fn parse_standard_validation(validation: fb::StandardValidation) -> ParseResult<types::StandardValidation> {
    Ok(types::StandardValidation {
        dimension_rules: validation.dimension_rules().map(parse_dimension_validation_rules).transpose()?,
        layer_rules: validation.layer_rules().map(parse_layer_validation_rules).transpose()?,
    })
}

fn parse_standard(standard: fb::Standard) -> ParseResult<types::Standard> {
    Ok(types::Standard {
        identifier: parse_identifier(standard.identifier().ok_or("Missing Standard.identifier")?)?,
        version: standard.version().map(|s| s.to_string()).ok_or("Missing Standard.version")?,
        readonly: standard.readonly(),
        overrides: standard.overrides().map(parse_standard_overrides).transpose()?,
        styles: standard.styles().map(parse_standard_styles).transpose()?,
        view_settings: standard.view_settings().map(parse_standard_view_settings).transpose()?,
        units: standard.units().map(parse_standard_units).transpose()?,
        validation: standard.validation().map(parse_standard_validation).transpose()?,
    })
}


// =============================================================================
// VERSION CONTROL
// =============================================================================

fn parse_version_base(base: fb::VersionBase) -> ParseResult<types::VersionBase> {
    Ok(types::VersionBase {
        id: base.id().ok_or("Missing VersionBase.id")?.to_string(),
        parent_id: base.parent_id().map(|s| s.to_string()),
        timestamp: base.timestamp(),
        description: base.description().map(|s| s.to_string()),
        is_manual_save: base.is_manual_save(),
        user_id: base.user_id().map(|s| s.to_string()),
    })
}

fn parse_checkpoint(checkpoint: fb::Checkpoint) -> ParseResult<types::Checkpoint> {
    Ok(types::Checkpoint {
        base: parse_version_base(checkpoint.base().ok_or("Missing Checkpoint.base")?)?,
        data: checkpoint.data().ok_or("Missing Checkpoint.data")?.bytes().to_vec(),
        size_bytes: checkpoint.size_bytes(),
    })
}


fn parse_delta(delta: fb::Delta) -> ParseResult<types::Delta> {
    // patch is now zlib-compressed JSON data
    let patch_json = parse_binary_json_to_string(delta.patch())
        .ok_or("Failed to parse delta patch")?;

    // Parse the JSON string into a vector of JSONPatchOperation
    let patch: Vec<types::JSONPatchOperation> = serde_json::from_str(&patch_json)
        .map_err(|_| "Failed to parse delta patch JSON")?;

    Ok(types::Delta {
        base: parse_version_base(delta.base().ok_or("Missing Delta.base")?)?,
        patch,
    })
}

fn parse_version_graph_metadata(meta: fb::VersionGraphMetadata) -> ParseResult<types::VersionGraphMetadata> {
    Ok(types::VersionGraphMetadata {
        last_pruned: meta.last_pruned(),
        total_size: meta.total_size(),
    })
}

fn parse_version_graph(graph: fb::VersionGraph) -> ParseResult<types::VersionGraph> {
    let checkpoints_vec = graph.checkpoints().ok_or("Missing VersionGraph.checkpoints")?;
    let checkpoints = checkpoints_vec.iter().map(parse_checkpoint).collect::<ParseResult<_>>()?;

    let deltas_vec = graph.deltas().ok_or("Missing VersionGraph.deltas")?;
    let deltas = deltas_vec.iter().map(parse_delta).collect::<ParseResult<_>>()?;
    
    Ok(types::VersionGraph {
        user_checkpoint_version_id: graph.user_checkpoint_version_id().ok_or("Missing VersionGraph.user_checkpoint_version_id")?.to_string(),
        latest_version_id: graph.latest_version_id().ok_or("Missing VersionGraph.latest_version_id")?.to_string(),
        checkpoints,
        deltas,
        metadata: parse_version_graph_metadata(graph.metadata().ok_or("Missing VersionGraph.metadata")?)?,
    })
}


// =============================================================================
// EXTERNAL FILES
// =============================================================================

fn parse_duc_external_file_data(file: fb::DucExternalFileData) -> ParseResult<types::DucExternalFileData> {
    Ok(types::DucExternalFileData {
        mime_type: file.mime_type().ok_or("Missing DucExternalFileData.mime_type")?.to_string(),
        id: file.id().to_string(),
        data: file.data().ok_or("Missing DucExternalFileData.data")?.bytes().to_vec(),
        created: file.created(),
        last_retrieved: file.last_retrieved(),
        version: None,
    })
}

fn parse_duc_external_file_entry(entry: fb::DucExternalFileEntry) -> ParseResult<types::DucExternalFileEntry> {
    Ok(types::DucExternalFileEntry {
        key: entry.key().to_string(),
        value: parse_duc_external_file_data(entry.value().ok_or("Missing DucExternalFileEntry.value")?)?,
    })
}

// =============================================================================
// ROOT TYPE
// =============================================================================

fn parse_exported_data_state(root: fb::ExportedDataState) -> ParseResult<types::ExportedDataState> {
    let dictionary = root
        .dictionary()
        .map(|v| v.iter().map(parse_dictionary_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?;
    
    let elements_vec = root.elements().ok_or("Missing ExportedDataState.elements")?;
    let elements = elements_vec.iter().map(parse_element_wrapper).collect::<ParseResult<_>>()?;

    // blocks is optional: treat missing as empty vec
    let blocks = root
        .blocks()
        .map(|v| v.iter().map(parse_duc_block).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    // block_instances is optional: treat missing as empty vec
    let block_instances = root
        .blockInstances()
        .map(|v| v.iter().map(parse_duc_block_instance).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    // block_collections is optional: treat missing as empty vec
    let block_collections = root
        .blockCollections()
        .map(|v| v.iter().map(parse_duc_block_collection).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    // groups optional
    let groups = root
        .groups()
        .map(|v| v.iter().map(parse_duc_group).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    // regions optional
    let regions = root
        .regions()
        .map(|v| v.iter().map(parse_duc_region).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    // layers optional
    let layers = root
        .layers()
        .map(|v| v.iter().map(parse_duc_layer).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    // standards optional
    let standards = root
        .standards()
        .map(|v| v.iter().map(parse_standard).collect::<ParseResult<Vec<_>>>())
        .transpose()?
        .unwrap_or_default();

    let external_files = root
        .external_files()
        .map(|v| v.iter().map(parse_duc_external_file_entry).collect::<ParseResult<Vec<_>>>())
        .transpose()?;

    Ok(types::ExportedDataState {
        data_type: root.type_().ok_or("Missing ExportedDataState.type")?.to_string(),
        source: root.source().ok_or("Missing ExportedDataState.source")?.to_string(),
        version: root.version().ok_or("Missing ExportedDataState.version")?.to_string(),
        thumbnail: root.thumbnail().map(|b| b.bytes().to_vec()),
        dictionary,
        elements,
        blocks,
        block_instances,
        block_collections,
        groups,
        regions,
        layers,
        standards,
        duc_local_state: root.duc_local_state().map(parse_duc_local_state).transpose()?.or_else(|| {
            // Provide default DucLocalState when missing
            Some(types::DucLocalState {
                scope: "mm".to_string(),
                active_standard_id: "".to_string(),
                scroll_x: 0.0,
                scroll_y: 0.0,
                zoom: 1.0,
                active_grid_settings: None,
                active_snap_settings: None,
                is_binding_enabled: false,
                current_item_stroke: None,
                current_item_background: None,
                current_item_opacity: 1.0,
                current_item_font_family: "Arial".to_string(),
                current_item_font_size: 12.0,
                current_item_text_align: fb::TEXT_ALIGN::LEFT,
                current_item_start_line_head: None,
                current_item_end_line_head: None,
                current_item_roundness: 0.0,
                pen_mode: false,
                view_mode_enabled: false,
                objects_snap_mode_enabled: false,
                grid_mode_enabled: false,
                outline_mode_enabled: false,
                manual_save_mode: false,
            })
        }),
        duc_global_state: root.duc_global_state().map(parse_duc_global_state).transpose()?.or_else(|| {
            // Provide default DucGlobalState when missing
            Some(types::DucGlobalState {
                name: None,
                view_background_color: "#ffffff".to_string(),
                main_scope: "mm".to_string(),
                dash_spacing_scale: 1.0,
                is_dash_spacing_affected_by_viewport_scale: false,
                scope_exponent_threshold: 0,
                dimensions_associative_by_default: false,
                use_annotative_scaling: false,
                display_precision_linear: 2,
                display_precision_angular: 2,
                pruning_level: fb::PRUNING_LEVEL::CONSERVATIVE,
            })
        }),
        external_files,
        version_graph: root.version_graph().map(parse_version_graph).transpose()?,
        id: root.id().map(|s| s.to_string()),
    })
}
