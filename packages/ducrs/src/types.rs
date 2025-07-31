use crate::generated::duc::{
    ANGULAR_UNITS_FORMAT, AXIS, BEZIER_MIRRORING, BLENDING, BLOCK_ATTACHMENT, BOOLEAN_OPERATION, COLUMN_TYPE, DATUM_BRACKET_STYLE, DECIMAL_SEPARATOR, DIMENSION_FIT_RULE, DIMENSION_TEXT_PLACEMENT, DIMENSION_TYPE, DIMENSION_UNITS_FORMAT, ELEMENT_CONTENT_PREFERENCE, FEATURE_MODIFIER, GDT_SYMBOL, GRID_DISPLAY_TYPE, GRID_TYPE, HATCH_STYLE, IMAGE_STATUS, LEADER_CONTENT_TYPE, LINE_HEAD, LINE_SPACING_TYPE, MARK_ELLIPSE_CENTER, MATERIAL_CONDITION, OBJECT_SNAP_MODE, PARAMETRIC_SOURCE_TYPE, PRUNING_LEVEL, SNAP_MARKER_SHAPE, SNAP_MODE, SNAP_OVERRIDE_BEHAVIOR, STACKED_TEXT_ALIGN, STROKE_CAP, STROKE_JOIN, STROKE_PLACEMENT, STROKE_PREFERENCE, STROKE_SIDE_PREFERENCE, TABLE_CELL_ALIGNMENT, TABLE_FLOW_DIRECTION, TEXT_ALIGN, TEXT_FIELD_SOURCE_PROPERTY, TEXT_FIELD_SOURCE_TYPE, TEXT_FLOW_DIRECTION, TOLERANCE_DISPLAY, TOLERANCE_ZONE_TYPE, UNIT_SYSTEM, VERTICAL_ALIGN, VIEWPORT_SHADE_PLOT
};

// =============== ENUMS (Custom for Rust convenience) ===============

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ElementType {
    Rectangle,
    Ellipse,
    Polygon,
    Text,
    Line,
    Arrow,
    FreeDraw,
    Image,
    Frame,
    Plot,
    Viewport,
    XRay,
    Leader,
    Dimension,
    FeatureControlFrame,
    Doc,
    Parametric,
    Embeddable,
    BlockInstance,
    Block,
    Group,
    Region,
    Layer,
}

impl ElementType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ElementType::Rectangle => "rectangle",
            ElementType::Ellipse => "ellipse",
            ElementType::Polygon => "polygon",
            ElementType::Text => "text",
            ElementType::Line => "line",
            ElementType::Arrow => "arrow",
            ElementType::FreeDraw => "freedraw",
            ElementType::Image => "image",
            ElementType::Frame => "frame",
            ElementType::Plot => "plot",
            ElementType::Viewport => "viewport",
            ElementType::XRay => "xray",
            ElementType::Leader => "leader",
            ElementType::Dimension => "dimension",
            ElementType::FeatureControlFrame => "feature_control_frame",
            ElementType::Doc => "doc",
            ElementType::Parametric => "parametric",
            ElementType::Embeddable => "embeddable",
            ElementType::BlockInstance => "block_instance",
            ElementType::Block => "block",
            ElementType::Group => "group",
            ElementType::Region => "region",
            ElementType::Layer => "layer",
        }
    }
}


// =============== UTILITY & GEOMETRY TYPES ===============

#[derive(Debug, Clone, PartialEq)]
pub struct DictionaryEntry {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StringValueEntry {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Identifier {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct GeometricPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucUcs {
    pub origin: GeometricPoint,
    pub angle: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPoint {
    pub x: f64,
    pub y: f64,
    pub mirroring: Option<BEZIER_MIRRORING>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucView {
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub zoom: f64,
    pub twist_angle: f64,
    pub center_point: DucPoint,
    pub scope: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Margins {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}


// =============== STYLING & CONTENT ===============

#[derive(Debug, Clone, PartialEq)]
pub struct TilingProperties {
    pub size_in_percent: f32,
    pub angle: f64,
    pub spacing: Option<f64>,
    pub offset_x: Option<f64>,
    pub offset_y: Option<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct HatchPatternLine {
    pub angle: f64,
    pub origin: DucPoint,
    pub offset: Vec<f64>,
    pub dash_pattern: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CustomHatchPattern {
    pub name: String,
    pub description: String,
    pub lines: Vec<HatchPatternLine>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucHatchStyle {
    pub hatch_style: Option<HATCH_STYLE>,
    pub pattern_name: String,
    pub pattern_scale: f32,
    pub pattern_angle: f64,
    pub pattern_origin: DucPoint,
    pub pattern_double: bool,
    pub custom_pattern: CustomHatchPattern,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucImageFilter {
    pub brightness: f32,
    pub contrast: f32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementContentBase {
    pub preference: Option<ELEMENT_CONTENT_PREFERENCE>,
    pub src: String,
    pub visible: bool,
    pub opacity: f64,
    pub tiling: TilingProperties,
    pub hatch: DucHatchStyle,
    pub image_filter: DucImageFilter,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StrokeStyle {
    pub preference: Option<STROKE_PREFERENCE>,
    pub cap: Option<STROKE_CAP>,
    pub join: Option<STROKE_JOIN>,
    pub dash: Vec<f64>,
    pub dash_line_override: String,
    pub dash_cap: Option<STROKE_CAP>,
    pub miter_limit: Option<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StrokeSides {
    pub preference: Option<STROKE_SIDE_PREFERENCE>,
    pub values: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementStroke {
    pub content: ElementContentBase,
    pub width: f64,
    pub style: StrokeStyle,
    pub placement: Option<STROKE_PLACEMENT>,
    pub stroke_sides: StrokeSides,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementBackground {
    pub content: ElementContentBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucElementStylesBase {
    pub roundness: f64,
    pub blending: Option<BLENDING>,
    pub background: Vec<ElementBackground>,
    pub stroke: Vec<ElementStroke>,
    pub opacity: f64,
}


// =============== BASE ELEMENT & COMMON ELEMENT COMPONENTS ===============

#[derive(Debug, Clone, PartialEq)]
pub struct BoundElement {
    pub id: String,
    pub element_type: String, // Renamed 'type' to 'element_type' to avoid keyword conflict
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucElementBase {
    pub id: String,
    pub styles: DucElementStylesBase,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub angle: f64,
    pub scope: String,
    pub label: String,
    pub description: String,
    pub is_visible: bool,
    pub seed: i32,
    pub version: i32,
    pub version_nonce: i32,
    pub updated: i64,
    pub index: String,
    pub is_plot: bool,
    pub is_annotative: bool,
    pub is_deleted: bool,
    pub group_ids: Vec<String>,
    pub region_ids: Vec<String>,
    pub layer_id: String,
    pub frame_id: String,
    pub bound_elements: Vec<BoundElement>,
    pub z_index: f32,
    pub link: String,
    pub locked: bool,
    pub custom_data: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucHead {
    pub head_type: Option<LINE_HEAD>, // Renamed 'type' to 'head_type' to avoid keyword conflict
    pub block_id: String,
    pub size: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PointBindingPoint {
    pub index: i32,
    pub offset: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPointBinding {
    pub element_id: String,
    pub focus: f32,
    pub gap: f64,
    pub fixed_point: GeometricPoint,
    pub point: PointBindingPoint,
    pub head: DucHead,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLineReference {
    pub index: i32,
    pub handle: GeometricPoint,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLine {
    pub start: DucLineReference,
    pub end: DucLineReference,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPath {
    pub line_indices: Vec<i32>,
    pub background: ElementBackground,
    pub stroke: ElementStroke,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLinearElementBase {
    pub base: DucElementBase,
    pub points: Vec<DucPoint>,
    pub lines: Vec<DucLine>,
    pub path_overrides: Vec<DucPath>,
    pub last_committed_point: DucPoint,
    pub start_binding: DucPointBinding,
    pub end_binding: DucPointBinding,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucStackLikeStyles {
    pub opacity: f64,
    pub labeling_color: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucStackBase {
    pub label: String,
    pub description: String,
    pub is_collapsed: bool,
    pub is_plot: bool,
    pub is_visible: bool,
    pub locked: bool,
    pub styles: DucStackLikeStyles,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucStackElementBase {
    pub base: DucElementBase,
    pub stack_base: DucStackBase,
    pub clip: bool,
    pub label_visible: bool,
    // Note: Standard type will be defined later in Standards & Settings section
    pub standard_override: String,
}


// =============== ELEMENT-SPECIFIC STYLES ===============

#[derive(Debug, Clone, PartialEq)]
pub struct LineSpacing {
    pub value: f64,
    pub line_type: Option<LINE_SPACING_TYPE>, // Renamed 'type' to 'line_type'
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextStyle {
    pub base_style: DucElementStylesBase,
    pub is_ltr: bool,
    pub font_family: String,
    pub big_font_family: String,
    pub text_align: Option<TEXT_ALIGN>,
    pub vertical_align: Option<VERTICAL_ALIGN>,
    pub line_height: f32,
    pub line_spacing: LineSpacing,
    pub oblique_angle: f64,
    pub font_size: f64,
    pub paper_text_height: f64,
    pub width_factor: f32,
    pub is_upside_down: bool,
    pub is_backwards: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableCellStyle {
    pub base_style: DucElementStylesBase,
    pub text_style: DucTextStyle,
    pub margins: Margins,
    pub alignment: Option<TABLE_CELL_ALIGNMENT>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableStyle {
    pub base_style: DucElementStylesBase,
    pub flow_direction: Option<TABLE_FLOW_DIRECTION>,
    pub header_row_style: DucTableCellStyle,
    pub data_row_style: DucTableCellStyle,
    pub data_column_style: DucTableCellStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLeaderStyle {
    pub base_style: DucElementStylesBase,
    pub heads_override: Vec<DucHead>,
    pub dogleg: f64,
    pub text_style: DucTextStyle,
    pub text_attachment: Option<VERTICAL_ALIGN>,
    pub block_attachment: Option<BLOCK_ATTACHMENT>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionToleranceStyle {
    pub enabled: bool,
    pub display_method: Option<TOLERANCE_DISPLAY>,
    pub upper_value: f64,
    pub lower_value: f64,
    pub precision: i32,
    pub text_style: DucTextStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionFitStyle {
    pub rule: Option<DIMENSION_FIT_RULE>,
    pub text_placement: Option<DIMENSION_TEXT_PLACEMENT>,
    pub force_text_inside: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionLineStyle {
    pub stroke: ElementStroke,
    pub text_gap: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionExtLineStyle {
    pub stroke: ElementStroke,
    pub overshoot: f64,
    pub offset: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionSymbolStyle {
    pub heads_override: Vec<DucHead>,
    pub center_mark_type: Option<MARK_ELLIPSE_CENTER>,
    pub center_mark_size: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucDimensionStyle {
    pub dim_line: DimensionLineStyle,
    pub ext_line: DimensionExtLineStyle,
    pub text_style: DucTextStyle,
    pub symbols: DimensionSymbolStyle,
    pub tolerance: DimensionToleranceStyle,
    pub fit: DimensionFitStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFLayoutStyle {
    pub padding: f64,
    pub segment_spacing: f64,
    pub row_spacing: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFSymbolStyle {
    pub scale: f32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFDatumStyle {
    pub bracket_style: Option<DATUM_BRACKET_STYLE>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFeatureControlFrameStyle {
    pub base_style: DucElementStylesBase,
    pub text_style: DucTextStyle,
    pub layout: FCFLayoutStyle,
    pub symbols: FCFSymbolStyle,
    pub datum_style: FCFDatumStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParagraphFormatting {
    pub first_line_indent: f64,
    pub hanging_indent: f64,
    pub left_indent: f64,
    pub right_indent: f64,
    pub space_before: f64,
    pub space_after: f64,
    pub tab_stops: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StackFormatProperties {
    pub upper_scale: f64,
    pub lower_scale: f64,
    pub alignment: Option<STACKED_TEXT_ALIGN>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StackFormat {
    pub auto_stack: bool,
    pub stack_chars: Vec<String>,
    pub properties: StackFormatProperties,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucDocStyle {
    pub text_style: DucTextStyle,
    pub paragraph: ParagraphFormatting,
    pub stack_format: StackFormat,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucViewportStyle {
    pub base_style: DucElementStylesBase,
    pub scale_indicator_visible: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPlotStyle {
    pub base_style: DucElementStylesBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucXRayStyle {
    pub base_style: DucElementStylesBase,
    pub color: String,
}


// =============== ELEMENT DEFINITIONS ===============

#[derive(Debug, Clone, PartialEq)]
pub struct DucRectangleElement {
    pub base: DucElementBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPolygonElement {
    pub base: DucElementBase,
    pub sides: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucEllipseElement {
    pub base: DucElementBase,
    pub ratio: f32,
    pub start_angle: f64,
    pub end_angle: f64,
    pub show_aux_crosshair: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucEmbeddableElement {
    pub base: DucElementBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPdfElement {
    pub base: DucElementBase,
    pub file_id: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucMermaidElement {
    pub base: DucElementBase,
    pub source: String,
    pub theme: String,
    pub svg_path: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableColumn {
    pub id: String,
    pub width: f64,
    pub style_overrides: DucTableCellStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableRow {
    pub id: String,
    pub height: f64,
    pub style_overrides: DucTableCellStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableCellSpan {
    pub columns: i32,
    pub rows: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableCell {
    pub row_id: String,
    pub column_id: String,
    pub data: String,
    pub span: DucTableCellSpan,
    pub locked: bool,
    pub style_overrides: DucTableCellStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableAutoSize {
    pub columns: bool,
    pub rows: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableColumnEntry {
    pub key: String,
    pub value: DucTableColumn,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableRowEntry {
    pub key: String,
    pub value: DucTableRow,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableCellEntry {
    pub key: String,
    pub value: DucTableCell,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTableElement {
    pub base: DucElementBase,
    pub style: DucTableStyle,
    pub column_order: Vec<String>,
    pub row_order: Vec<String>,
    pub columns: Vec<DucTableColumnEntry>,
    pub rows: Vec<DucTableRowEntry>,
    pub cells: Vec<DucTableCellEntry>,
    pub header_row_count: i32,
    pub auto_size: DucTableAutoSize,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ImageCrop {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub natural_width: f64,
    pub natural_height: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucImageElement {
    pub base: DucElementBase,
    pub file_id: String,
    pub status: Option<IMAGE_STATUS>,
    pub scale: Vec<f64>,
    pub crop: ImageCrop,
    pub filter: DucImageFilter,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextDynamicElementSource {
    pub element_id: String,
    pub property: Option<TEXT_FIELD_SOURCE_PROPERTY>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextDynamicDictionarySource {
    pub key: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DucTextDynamicSourceData {
    DucTextDynamicElementSource(DucTextDynamicElementSource),
    DucTextDynamicDictionarySource(DucTextDynamicDictionarySource),
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextDynamicSource {
    pub text_source_type: Option<TEXT_FIELD_SOURCE_TYPE>,
    pub source: DucTextDynamicSourceData,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextDynamicPart {
    pub tag: String,
    pub source: DucTextDynamicSource,
    pub formatting: PrimaryUnits,
    pub cached_value: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextElement {
    pub base: DucElementBase,
    pub style: DucTextStyle,
    pub text: String,
    pub dynamic: Vec<DucTextDynamicPart>,
    pub auto_resize: bool,
    pub container_id: String,
    pub original_text: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLinearElement {
    pub linear_base: DucLinearElementBase,
    pub wipeout_below: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucArrowElement {
    pub linear_base: DucLinearElementBase,
    pub elbowed: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFreeDrawEnds {
    pub cap: bool,
    pub taper: f32,
    pub easing: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFreeDrawElement {
    pub base: DucElementBase,
    pub points: Vec<DucPoint>,
    pub size: f64,
    pub thinning: f32,
    pub smoothing: f32,
    pub streamline: f32,
    pub easing: String,
    pub start: DucFreeDrawEnds,
    pub end: DucFreeDrawEnds,
    pub pressures: Vec<f32>,
    pub simulate_pressure: bool,
    pub last_committed_point: DucPoint,
    pub svg_path: String,
}


#[derive(Debug, Clone, PartialEq)]
pub struct DucBlockInstanceElement {
    pub base: DucElementBase,
    pub block_id: String,
    pub element_overrides: Vec<StringValueEntry>,
    pub attribute_values: Vec<StringValueEntry>,
    pub duplication_array: DucBlockDuplicationArray,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFrameElement {
    pub stack_element_base: DucStackElementBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PlotLayout {
    pub margins: Margins,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucPlotElement {
    pub stack_element_base: DucStackElementBase,
    pub style: DucPlotStyle,
    pub layout: PlotLayout,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucViewportElement {
    pub linear_base: DucLinearElementBase,
    pub stack_base: DucStackBase,
    pub style: DucViewportStyle,
    pub view: DucView,
    pub scale: f32,
    pub shade_plot: Option<VIEWPORT_SHADE_PLOT>,
    pub frozen_group_ids: Vec<String>,
    pub standard_override: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucXRayElement {
    pub base: DucElementBase,
    pub style: DucXRayStyle,
    pub origin: GeometricPoint,
    pub direction: GeometricPoint,
    pub start_from_origin: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LeaderTextBlockContent {
    pub text: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LeaderBlockContent {
    pub block_id: String,
    pub attribute_values: Vec<StringValueEntry>,
    pub element_overrides: Vec<StringValueEntry>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LeaderContentData {
    LeaderTextBlockContent(LeaderTextBlockContent),
    LeaderBlockContent(LeaderBlockContent),
}

#[derive(Debug, Clone, PartialEq)]
pub struct LeaderContent {
    pub leader_content_type: Option<LEADER_CONTENT_TYPE>,
    pub content: LeaderContentData,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLeaderElement {
    pub linear_base: DucLinearElementBase,
    pub style: DucLeaderStyle,
    pub content: LeaderContent,
    pub content_anchor: GeometricPoint,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionDefinitionPoints {
    pub origin1: GeometricPoint,
    pub origin2: GeometricPoint,
    pub location: GeometricPoint,
    pub center: GeometricPoint,
    pub jog: GeometricPoint,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionBindings {
    pub origin1: DucPointBinding,
    pub origin2: DucPointBinding,
    pub center: DucPointBinding,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionBaselineData {
    pub base_dimension_id: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionContinueData {
    pub continue_from_dimension_id: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucDimensionElement {
    pub base: DucElementBase,
    pub style: DucDimensionStyle,
    pub dimension_type: Option<DIMENSION_TYPE>,
    pub definition_points: DimensionDefinitionPoints,
    pub oblique_angle: f32,
    pub ordinate_axis: Option<AXIS>,
    pub bindings: DimensionBindings,
    pub text_override: Option<String>,
    pub text_position: Option<GeometricPoint>,
    pub tolerance_override: DimensionToleranceStyle,
    pub baseline_data: Option<DimensionBaselineData>,
    pub continue_data: Option<DimensionContinueData>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DatumReference {
    pub letters: String,
    pub modifier: Option<MATERIAL_CONDITION>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ToleranceClause {
    pub value: String,
    pub zone_type: Option<TOLERANCE_ZONE_TYPE>,
    pub feature_modifiers: Vec<FEATURE_MODIFIER>,
    pub material_condition: Option<MATERIAL_CONDITION>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FeatureControlFrameSegment {
    pub symbol: Option<GDT_SYMBOL>,
    pub tolerance: ToleranceClause,
    pub datums: Vec<DatumReference>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFBetweenModifier {
    pub start: String,
    pub end: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFProjectedZoneModifier {
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFFrameModifiers {
    pub all_around: bool,
    pub all_over: bool,
    pub continuous_feature: bool,
    pub between: FCFBetweenModifier,
    pub projected_tolerance_zone: FCFProjectedZoneModifier,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFDatumDefinition {
    pub letter: String,
    pub feature_binding: DucPointBinding,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FCFSegmentRow {
    pub segments: Vec<FeatureControlFrameSegment>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFeatureControlFrameElement {
    pub base: DucElementBase,
    pub style: DucFeatureControlFrameStyle,
    pub rows: Vec<FCFSegmentRow>,
    pub frame_modifiers: FCFFrameModifiers,
    pub leader_element_id: Option<String>,
    pub datum_definition: Option<FCFDatumDefinition>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct TextColumn {
    pub width: f64,
    pub gutter: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ColumnLayout {
    pub column_type: Option<COLUMN_TYPE>, // Renamed 'type' to 'column_type'
    pub definitions: Vec<TextColumn>,
    pub auto_height: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucDocElement {
    pub base: DucElementBase,
    pub style: DucDocStyle,
    pub text: String,
    pub dynamic: Vec<DucTextDynamicPart>,
    pub flow_direction: Option<TEXT_FLOW_DIRECTION>,
    pub columns: ColumnLayout,
    pub auto_resize: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParametricSource {
    pub source_type: Option<PARAMETRIC_SOURCE_TYPE>, // Renamed 'type' to 'source_type'
    pub code: String,
    pub file_id: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucParametricElement {
    pub base: DucElementBase,
    pub source: ParametricSource,
}


// =============== ELEMENT UNION & WRAPPER ===============

#[derive(Debug, Clone, PartialEq)]
pub enum DucElementEnum {
    DucRectangleElement(DucRectangleElement),
    DucPolygonElement(DucPolygonElement),
    DucEllipseElement(DucEllipseElement),
    DucEmbeddableElement(DucEmbeddableElement),
    DucPdfElement(DucPdfElement),
    DucMermaidElement(DucMermaidElement),
    DucTableElement(DucTableElement),
    DucImageElement(DucImageElement),
    DucTextElement(DucTextElement),
    DucLinearElement(DucLinearElement),
    DucArrowElement(DucArrowElement),
    DucFreeDrawElement(DucFreeDrawElement),
    DucBlockInstanceElement(DucBlockInstanceElement),
    DucFrameElement(DucFrameElement),
    DucPlotElement(DucPlotElement),
    DucViewportElement(DucViewportElement),
    DucXRayElement(DucXRayElement),
    DucLeaderElement(DucLeaderElement),
    DucDimensionElement(DucDimensionElement),
    DucFeatureControlFrameElement(DucFeatureControlFrameElement),
    DucDocElement(DucDocElement),
    DucParametricElement(DucParametricElement),
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementWrapper {
    pub element: DucElementEnum,
}


// =============== BLOCK DEFINITIONS ===============
#[derive(Debug, Clone, PartialEq)]
pub struct DucBlockAttributeDefinition {
    pub tag: String,
    pub prompt: String,
    pub default_value: String,
    pub is_constant: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucBlockDuplicationArray {
    pub rows: i32,
    pub cols: i32,
    pub row_spacing: f64,
    pub col_spacing: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucBlockAttributeDefinitionEntry {
    pub key: String,
    pub value: DucBlockAttributeDefinition,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucBlock {
    pub id: String,
    pub label: String,
    pub description: String,
    pub version: i32,
    pub elements: Vec<ElementWrapper>,
    pub attribute_definitions: Vec<DucBlockAttributeDefinitionEntry>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucBlockAttribute {
    pub name: String,
    pub details: DucBlockAttributeDetails,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucBlockAttributeDetails {
    pub tag: String,
    pub default_value: String,
    pub prompt: String,
    pub position: GeometricPoint,
}


// =============== APP & DOCUMENT STATE ===============

#[derive(Debug, Clone, PartialEq)]
pub struct DucGlobalState {
    pub name: String,
    pub view_background_color: String,
    pub main_scope: String,
    pub dash_spacing_scale: f32,
    pub is_dash_spacing_affected_by_viewport_scale: bool,
    pub scope_exponent_threshold: i8,
    pub dimensions_associative_by_default: bool,
    pub use_annotative_scaling: bool,
    pub display_precision_linear: i32,
    pub display_precision_angular: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLocalState {
    pub scope: String,
    pub active_standard_id: String,
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub zoom: f64,
    pub active_grid_settings: Vec<String>,
    pub active_snap_settings: String,
    pub is_binding_enabled: bool,
    pub current_item_stroke: ElementStroke,
    pub current_item_background: ElementBackground,
    pub current_item_opacity: f32,
    pub current_item_font_family: String,
    pub current_item_font_size: f64,
    pub current_item_text_align: Option<TEXT_ALIGN>,
    pub current_item_start_line_head: DucHead,
    pub current_item_end_line_head: DucHead,
    pub current_item_roundness: f64,
    pub pen_mode: bool,
    pub view_mode_enabled: bool,
    pub objects_snap_mode_enabled: bool,
    pub grid_mode_enabled: bool,
    pub outline_mode_enabled: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucGroup {
    pub id: String,
    pub stack_base: DucStackBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucRegion {
    pub id: String,
    pub stack_base: DucStackBase,
    pub boolean_operation: Option<BOOLEAN_OPERATION>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLayerOverrides {
    pub stroke: ElementStroke,
    pub background: ElementBackground,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLayer {
    pub id: String,
    pub stack_base: DucStackBase,
    pub readonly: bool,
    pub overrides: DucLayerOverrides,
}


// =============== STANDARDS & SETTINGS ===============

#[derive(Debug, Clone, PartialEq)]
pub struct UnitSystemBase {
    pub system: Option<UNIT_SYSTEM>,
    pub precision: i32,
    pub suppress_leading_zeros: bool,
    pub suppress_trailing_zeros: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LinearUnitSystem {
    pub base: UnitSystemBase,
    pub format: Option<DIMENSION_UNITS_FORMAT>,
    pub decimal_separator: Option<DECIMAL_SEPARATOR>,
    pub suppress_zero_feet: bool,
    pub suppress_zero_inches: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AngularUnitSystem {
    pub base: UnitSystemBase,
    pub format: Option<ANGULAR_UNITS_FORMAT>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AlternateUnits {
    pub base: UnitSystemBase,
    pub format: Option<DIMENSION_UNITS_FORMAT>,
    pub is_visible: bool,
    pub multiplier: f32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PrimaryUnits {
    pub linear: LinearUnitSystem,
    pub angular: AngularUnitSystem,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StandardUnits {
    pub primary_units: PrimaryUnits,
    pub alternate_units: AlternateUnits,
}

#[derive(Debug, Clone, PartialEq)]
pub struct UnitPrecision {
    pub linear: i32,
    pub angular: i32,
    pub area: i32,
    pub volume: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StandardOverrides {
    pub main_scope: String,
    pub elements_stroke_width_override: f64,
    pub common_style_id: String,
    pub stack_like_style_id: String,
    pub text_style_id: String,
    pub dimension_style_id: String,
    pub leader_style_id: String,
    pub feature_control_frame_style_id: String,
    pub table_style_id: String,
    pub doc_style_id: String,
    pub viewport_style_id: String,
    pub plot_style_id: String,
    pub hatch_style_id: String,
    pub active_grid_settings_id: Vec<String>,
    pub active_snap_settings_id: String,
    pub dash_line_override: String,
    pub unit_precision: UnitPrecision,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucCommonStyle {
    pub background: ElementBackground,
    pub stroke: ElementStroke,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedCommonStyle {
    pub id: Identifier,
    pub style: DucCommonStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedStackLikeStyle {
    pub id: Identifier,
    pub style: DucStackLikeStyles,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedTextStyle {
    pub id: Identifier,
    pub style: DucTextStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedDimensionStyle {
    pub id: Identifier,
    pub style: DucDimensionStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedLeaderStyle {
    pub id: Identifier,
    pub style: DucLeaderStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedFCFStyle {
    pub id: Identifier,
    pub style: DucFeatureControlFrameStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedTableStyle {
    pub id: Identifier,
    pub style: DucTableStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedDocStyle {
    pub id: Identifier,
    pub style: DucDocStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedViewportStyle {
    pub id: Identifier,
    pub style: DucViewportStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedHatchStyle {
    pub id: Identifier,
    pub style: DucHatchStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedXRayStyle {
    pub id: Identifier,
    pub style: DucXRayStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StandardStyles {
    pub common_styles: Vec<IdentifiedCommonStyle>,
    pub stack_like_styles: Vec<IdentifiedStackLikeStyle>,
    pub text_styles: Vec<IdentifiedTextStyle>,
    pub dimension_styles: Vec<IdentifiedDimensionStyle>,
    pub leader_styles: Vec<IdentifiedLeaderStyle>,
    pub feature_control_frame_styles: Vec<IdentifiedFCFStyle>,
    pub table_styles: Vec<IdentifiedTableStyle>,
    pub doc_styles: Vec<IdentifiedDocStyle>,
    pub viewport_styles: Vec<IdentifiedViewportStyle>,
    pub hatch_styles: Vec<IdentifiedHatchStyle>,
    pub xray_styles: Vec<IdentifiedXRayStyle>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct GridStyle {
    pub color: String,
    pub opacity: f64,
    pub dash_pattern: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PolarGridSettings {
    pub radial_divisions: i32,
    pub radial_spacing: f64,
    pub show_labels: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IsometricGridSettings {
    pub left_angle: f64,
    pub right_angle: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct GridSettings {
    pub grid_type: Option<GRID_TYPE>, // Renamed 'type' to 'grid_type'
    pub readonly: bool,
    pub display_type: Option<GRID_DISPLAY_TYPE>,
    pub is_adaptive: bool,
    pub x_spacing: f64,
    pub y_spacing: f64,
    pub subdivisions: i32,
    pub origin: GeometricPoint,
    pub rotation: f64,
    pub follow_ucs: bool,
    pub major_style: GridStyle,
    pub minor_style: GridStyle,
    pub show_minor: bool,
    pub min_zoom: f64,
    pub max_zoom: f64,
    pub auto_hide: bool,
    pub polar_settings: PolarGridSettings,
    pub isometric_settings: IsometricGridSettings,
    pub enable_snapping: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SnapOverride {
    pub key: String,
    pub behavior: Option<SNAP_OVERRIDE_BEHAVIOR>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DynamicSnapSettings {
    pub enabled_during_drag: bool,
    pub enabled_during_rotation: bool,
    pub enabled_during_scale: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PolarTrackingSettings {
    pub enabled: bool,
    pub angles: Vec<f64>,
    pub increment_angle: f64,
    pub track_from_last_point: bool,
    pub show_polar_coordinates: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct TrackingLineStyle {
    pub color: String,
    pub opacity: f64,
    pub dash_pattern: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LayerSnapFilters {
    pub include_layers: Vec<String>,
    pub exclude_layers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SnapMarkerStyle {
    pub shape: Option<SNAP_MARKER_SHAPE>,
    pub color: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SnapMarkerStyleEntry {
    pub key: Option<OBJECT_SNAP_MODE>,
    pub value: SnapMarkerStyle,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SnapMarkerSettings {
    pub enabled: bool,
    pub size: i32,
    pub duration: i32,
    pub styles: Vec<SnapMarkerStyleEntry>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SnapSettings {
    pub readonly: bool,
    pub twist_angle: f64,
    pub snap_tolerance: i32,
    pub object_snap_aperture: i32,
    pub is_ortho_mode_on: bool,
    pub polar_tracking: PolarTrackingSettings,
    pub is_object_snap_on: bool,
    pub active_object_snap_modes: Vec<OBJECT_SNAP_MODE>,
    pub snap_priority: Vec<OBJECT_SNAP_MODE>,
    pub show_tracking_lines: bool,
    pub tracking_line_style: TrackingLineStyle,
    pub dynamic_snap: DynamicSnapSettings,
    pub temporary_overrides: Vec<SnapOverride>,
    pub incremental_distance: f64,
    pub magnetic_strength: f64,
    pub layer_snap_filters: LayerSnapFilters,
    pub element_type_filters: Vec<String>,
    pub snap_mode: Option<SNAP_MODE>,
    pub snap_markers: SnapMarkerSettings,
    pub construction_snap_enabled: bool,
    pub snap_to_grid_intersections: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedGridSettings {
    pub id: Identifier,
    pub settings: GridSettings,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedSnapSettings {
    pub id: Identifier,
    pub settings: SnapSettings,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedUcs {
    pub id: Identifier,
    pub ucs: DucUcs,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifiedView {
    pub id: Identifier,
    pub view: DucView,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StandardViewSettings {
    pub views: Vec<IdentifiedView>,
    pub ucs: Vec<IdentifiedUcs>,
    pub grid_settings: Vec<IdentifiedGridSettings>,
    pub snap_settings: Vec<IdentifiedSnapSettings>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DimensionValidationRules {
    pub min_text_height: f64,
    pub max_text_height: f64,
    pub allowed_precisions: Vec<i32>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LayerValidationRules {
    pub prohibited_layer_names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StandardValidation {
    pub dimension_rules: DimensionValidationRules,
    pub layer_rules: LayerValidationRules,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Standard {
    pub identifier: Identifier,
    pub version: String,
    pub readonly: bool,
    pub overrides: StandardOverrides,
    pub styles: StandardStyles,
    pub view_settings: StandardViewSettings,
    pub units: StandardUnits,
    pub validation: StandardValidation,
}


// =============== VERSION CONTROL ===============

#[derive(Debug, Clone, PartialEq)]
pub struct VersionBase {
    pub id: String,
    pub parent_id: String,
    pub timestamp: i64,
    pub description: String,
    pub is_manual_save: bool,
    pub user_id: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Checkpoint {
    pub base: VersionBase,
    pub data: Vec<u8>,
    pub size_bytes: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct JSONPatchOperation {
    pub op: String,
    pub path: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Delta {
    pub base: VersionBase,
    pub patch: Vec<JSONPatchOperation>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct VersionGraphMetadata {
    pub pruning_level: Option<PRUNING_LEVEL>,
    pub last_pruned: i64,
    pub total_size: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct VersionGraph {
    pub user_checkpoint_version_id: String,
    pub latest_version_id: String,
    pub checkpoints: Vec<Checkpoint>,
    pub deltas: Vec<Delta>,
    pub metadata: VersionGraphMetadata,
}


// =============== EXTERNAL FILES ===============

#[derive(Debug, Clone, PartialEq)]
pub struct DucExternalFileData {
    pub mime_type: String,
    pub id: String,
    pub data: Vec<u8>,
    pub created: i64,
    pub last_retrieved: Option<i64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucExternalFileEntry {
    pub key: String,
    pub value: DucExternalFileData,
}

// =============== ROOT TYPE ===============

#[derive(Debug, Clone, PartialEq)]
pub struct ExportedDataState {
    pub data_type: String,
    pub source: String,
    pub version: String,
    pub thumbnail: Vec<u8>,
    pub dictionary: Vec<DictionaryEntry>,
    pub elements: Vec<ElementWrapper>,
    pub blocks: Vec<DucBlock>,
    pub groups: Vec<DucGroup>,
    pub regions: Vec<DucRegion>,
    pub layers: Vec<DucLayer>,
    pub standards: Vec<Standard>,
    pub duc_local_state: DucLocalState,
    pub duc_global_state: DucGlobalState,
    pub external_files: Vec<DucExternalFileEntry>,
    pub version_graph: Option<VersionGraph>,
}
