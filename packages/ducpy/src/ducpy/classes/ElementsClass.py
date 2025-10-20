from dataclasses import dataclass
from typing import List, Optional, Dict, Union, Any, TYPE_CHECKING

from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.BEZIER_MIRRORING import BEZIER_MIRRORING
from ducpy.Duc.BLENDING import BLENDING
from ducpy.Duc.BLOCK_ATTACHMENT import BLOCK_ATTACHMENT
from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ducpy.Duc.COLUMN_TYPE import COLUMN_TYPE
from ducpy.Duc.DATUM_BRACKET_STYLE import DATUM_BRACKET_STYLE
from ducpy.Duc.DIMENSION_FIT_RULE import DIMENSION_FIT_RULE
from ducpy.Duc.DIMENSION_TEXT_PLACEMENT import DIMENSION_TEXT_PLACEMENT
from ducpy.Duc.DIMENSION_TYPE import DIMENSION_TYPE
from ducpy.Duc.ELEMENT_CONTENT_PREFERENCE import ELEMENT_CONTENT_PREFERENCE
from ducpy.Duc.FEATURE_MODIFIER import FEATURE_MODIFIER
from ducpy.Duc.GDT_SYMBOL import GDT_SYMBOL
from ducpy.Duc.HATCH_STYLE import HATCH_STYLE
from ducpy.Duc.IMAGE_STATUS import IMAGE_STATUS
from ducpy.Duc.LINE_HEAD import LINE_HEAD
from ducpy.Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ducpy.Duc.MARK_ELLIPSE_CENTER import MARK_ELLIPSE_CENTER
from ducpy.Duc.MATERIAL_CONDITION import MATERIAL_CONDITION
from ducpy.Duc.STACKED_TEXT_ALIGN import STACKED_TEXT_ALIGN
from ducpy.Duc.STROKE_CAP import STROKE_CAP
from ducpy.Duc.STROKE_JOIN import STROKE_JOIN
from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ducpy.Duc.STROKE_SIDE_PREFERENCE import STROKE_SIDE_PREFERENCE
from ducpy.Duc.TABLE_CELL_ALIGNMENT import TABLE_CELL_ALIGNMENT
from ducpy.Duc.TABLE_FLOW_DIRECTION import TABLE_FLOW_DIRECTION
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.TEXT_FIELD_SOURCE_PROPERTY import TEXT_FIELD_SOURCE_PROPERTY
from ducpy.Duc.TEXT_FIELD_SOURCE_TYPE import TEXT_FIELD_SOURCE_TYPE
from ducpy.Duc.TEXT_FLOW_DIRECTION import TEXT_FLOW_DIRECTION
from ducpy.Duc.TOLERANCE_DISPLAY import TOLERANCE_DISPLAY
from ducpy.Duc.TOLERANCE_TYPE import TOLERANCE_TYPE
from ducpy.Duc.TOLERANCE_ZONE_TYPE import TOLERANCE_ZONE_TYPE
from ducpy.Duc.VIEWPORT_SHADE_PLOT import VIEWPORT_SHADE_PLOT
from ducpy.Duc.AXIS import AXIS
from ducpy.Duc.PARAMETRIC_SOURCE_TYPE import PARAMETRIC_SOURCE_TYPE
from ducpy.Duc.LEADER_CONTENT_TYPE import LEADER_CONTENT_TYPE
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN

if TYPE_CHECKING:
    from ducpy.classes.StandardsClass import Standard, PrimaryUnits


@dataclass
class Identifier:
    id: str
    name: str
    description: str

@dataclass
class GeometricPoint:
    x: float
    y: float

@dataclass
class DucUcs:
    origin: GeometricPoint
    angle: float

@dataclass
class DucPoint:
    x: float
    y: float
    mirroring: Optional[BEZIER_MIRRORING]

@dataclass
class DucView:
    scroll_x: float
    scroll_y: float
    zoom: float
    twist_angle: float
    center_point: DucPoint
    scope: str

@dataclass
class Margins:
    top: float
    right: float
    bottom: float
    left: float

@dataclass
class TilingProperties:
    size_in_percent: float
    angle: float
    spacing: Optional[float]
    offset_x: Optional[float]
    offset_y: Optional[float]

@dataclass
class HatchPatternLine:
    angle: float
    origin: DucPoint
    offset: List[float]
    dash_pattern: List[float]

@dataclass
class CustomHatchPattern:
    name: str
    description: str
    lines: List[HatchPatternLine]

@dataclass
class DucHatchStyle:
    pattern_name: str
    pattern_scale: float
    pattern_angle: float
    pattern_origin: DucPoint
    pattern_double: bool
    hatch_style: HATCH_STYLE
    custom_pattern: Optional[CustomHatchPattern]

@dataclass
class DucImageFilter:
    brightness: float
    contrast: float

@dataclass
class ElementContentBase:
    src: str
    visible: bool
    opacity: float
    tiling: Optional[TilingProperties]
    hatch: Optional[DucHatchStyle]
    image_filter: Optional[DucImageFilter]
    preference: Optional[ELEMENT_CONTENT_PREFERENCE]

@dataclass
class StrokeStyle:
    preference: STROKE_PREFERENCE
    dash: Optional[List[float]]
    dash_line_override: Optional[str]
    cap: Optional[STROKE_CAP]
    join: Optional[STROKE_JOIN]
    dash_cap: Optional[STROKE_CAP]
    miter_limit: Optional[float]

@dataclass
class StrokeSides:
    preference: STROKE_SIDE_PREFERENCE
    values: Optional[List[float]]

@dataclass
class ElementStroke:
    content: ElementContentBase
    width: float
    style: StrokeStyle
    placement: STROKE_PLACEMENT
    stroke_sides: Optional[StrokeSides]

@dataclass
class ElementBackground:
    content: ElementContentBase

@dataclass
class DucElementStylesBase:
    roundness: float
    background: List[ElementBackground]
    stroke: List[ElementStroke]
    opacity: float
    blending: Optional[BLENDING] = None

@dataclass
class BoundElement:
    id: str
    type: str

@dataclass
class DucElementBase:
    id: str
    styles: DucElementStylesBase
    x: float
    y: float
    width: float
    height: float
    angle: float
    scope: str
    label: str
    is_visible: bool
    seed: int
    version: int
    version_nonce: int
    updated: int
    is_plot: bool
    is_annotative: bool
    is_deleted: bool
    group_ids: List[str]
    region_ids: List[str]
    z_index: float
    locked: bool
    description: Optional[str]
    index: Optional[str]
    link: Optional[str]
    layer_id: Optional[str]
    frame_id: Optional[str]
    bound_elements: Optional[List[BoundElement]]
    custom_data: Optional[Dict[str, Any]]

@dataclass
class DucHead:
    size: float
    type: LINE_HEAD
    block_id: Optional[str]

@dataclass
class PointBindingPoint:
    index: int
    offset: float

@dataclass
class DucPointBinding:
    element_id: str
    focus: Optional[float]
    gap: float
    fixed_point: Optional[GeometricPoint]
    point: Optional[PointBindingPoint]
    head: Optional[DucHead]

@dataclass
class DucLineReference:
    index: int
    handle: Optional[GeometricPoint]

@dataclass
class DucLine:
    start: DucLineReference
    end: DucLineReference

@dataclass
class DucPath:
    line_indices: List[int]
    background: Optional[ElementBackground]
    stroke: Optional[ElementStroke]

@dataclass
class DucLinearElementBase:
    base: DucElementBase
    points: List[DucPoint]
    lines: List[DucLine]
    path_overrides: List[DucPath]
    last_committed_point: Optional[DucPoint]
    start_binding: Optional[DucPointBinding]
    end_binding: Optional[DucPointBinding]

@dataclass
class DucStackLikeStyles:
    opacity: float
    labeling_color: str
    blending: Optional[BLENDING] = None

@dataclass
class DucStackBase:
    label: str
    is_collapsed: bool
    is_plot: bool
    is_visible: bool
    locked: bool
    styles: DucStackLikeStyles
    description: str

@dataclass
class DucStackElementBase:
    base: DucElementBase
    stack_base: "DucStackBase"
    clip: bool
    label_visible: bool
    standard_override: Optional[str]

@dataclass
class LineSpacing:
    value: float
    type: LINE_SPACING_TYPE

@dataclass
class DucTextStyle:
    is_ltr: bool
    font_family: str
    big_font_family: str
    line_height: float
    line_spacing: LineSpacing
    oblique_angle: float
    font_size: float
    width_factor: float
    is_upside_down: bool
    is_backwards: bool
    text_align: TEXT_ALIGN
    vertical_align: VERTICAL_ALIGN
    paper_text_height: Optional[float]

@dataclass
class DucTableCellStyle:
    base_style: DucElementStylesBase
    text_style: DucTextStyle
    margins: Margins
    alignment: TABLE_CELL_ALIGNMENT

@dataclass
class DucTableStyle:
    header_row_style: DucTableCellStyle
    data_row_style: DucTableCellStyle
    data_column_style: DucTableCellStyle
    flow_direction: TABLE_FLOW_DIRECTION

@dataclass
class DucLeaderStyle:
    text_style: DucTextStyle
    text_attachment: VERTICAL_ALIGN
    block_attachment: BLOCK_ATTACHMENT
    dogleg: Optional[float]
    heads_override: Optional[List[DucHead]]

@dataclass
class DimensionToleranceStyle:
    enabled: bool
    upper_value: float
    lower_value: float
    precision: int
    display_method: TOLERANCE_DISPLAY
    text_style: Optional[DucTextStyle]

@dataclass
class DimensionFitStyle:
    force_text_inside: bool
    rule: DIMENSION_FIT_RULE
    text_placement: DIMENSION_TEXT_PLACEMENT

@dataclass
class DimensionLineStyle:
    stroke: ElementStroke
    text_gap: float

@dataclass
class DimensionExtLineStyle:
    stroke: ElementStroke
    overshoot: float
    offset: float

@dataclass
class DimensionSymbolStyle:
    center_mark_size: float
    center_mark_type: MARK_ELLIPSE_CENTER
    heads_override: Optional[List[DucHead]]

@dataclass
class DucDimensionStyle:
    dim_line: DimensionLineStyle
    ext_line: DimensionExtLineStyle
    text_style: DucTextStyle
    symbols: DimensionSymbolStyle
    tolerance: DimensionToleranceStyle
    fit: DimensionFitStyle

@dataclass
class FCFLayoutStyle:
    padding: float
    segment_spacing: float
    row_spacing: float

@dataclass
class FCFSymbolStyle:
    scale: float

@dataclass
class FCFDatumStyle:
    bracket_style: Optional[DATUM_BRACKET_STYLE]

@dataclass
class DucFeatureControlFrameStyle:
    text_style: DucTextStyle
    layout: FCFLayoutStyle
    symbols: FCFSymbolStyle
    datum_style: FCFDatumStyle

@dataclass
class ParagraphFormatting:
    first_line_indent: float
    hanging_indent: float
    left_indent: float
    right_indent: float
    space_before: float
    space_after: float
    tab_stops: List[float]

@dataclass
class StackFormatProperties:
    upper_scale: float
    lower_scale: float
    alignment: Optional[STACKED_TEXT_ALIGN]

@dataclass
class StackFormat:
    auto_stack: bool
    stack_chars: List[str]
    properties: StackFormatProperties

@dataclass
class DucDocStyle:
    text_style: DucTextStyle
    paragraph: ParagraphFormatting
    stack_format: StackFormat

@dataclass
class DucViewportStyle:
    scale_indicator_visible: bool

@dataclass
class DucPlotStyle:
    pass

@dataclass
class DucXRayStyle:
    color: str

@dataclass
class DucRectangleElement:
    base: DucElementBase

@dataclass
class DucPolygonElement:
    base: DucElementBase
    sides: int

@dataclass
class DucEllipseElement:
    base: DucElementBase
    ratio: float
    start_angle: float
    end_angle: float
    show_aux_crosshair: bool

@dataclass
class DucEmbeddableElement:
    base: DucElementBase

@dataclass
class DucPdfElement:
    base: DucElementBase
    file_id: Optional[str]

@dataclass
class DucMermaidElement:
    base: DucElementBase
    source: str
    theme: Optional[str]
    svg_path: Optional[str]

@dataclass
class DucTableColumn:
    id: str
    width: float
    style_overrides: Optional[DucTableCellStyle]

@dataclass
class DucTableRow:
    id: str
    height: float
    style_overrides: Optional[DucTableCellStyle]

@dataclass
class DucTableCellSpan:
    columns: int
    rows: int

@dataclass
class DucTableCell:
    row_id: str
    column_id: str
    data: str
    locked: bool
    span: Optional[DucTableCellSpan]
    style_overrides: Optional[DucTableCellStyle]

@dataclass
class DucTableColumnEntry:
    key: str
    value: DucTableColumn

@dataclass
class DucTableRowEntry:
    key: str
    value: DucTableRow

@dataclass
class DucTableCellEntry:
    key: str
    value: DucTableCell

@dataclass
class DucTableAutoSize:
    columns: bool
    rows: bool

@dataclass
class DucTableElement:
    base: DucElementBase
    style: DucTableStyle
    column_order: List[str]
    row_order: List[str]
    columns: List[DucTableColumnEntry]
    rows: List[DucTableRowEntry]
    cells: List[DucTableCellEntry]
    header_row_count: int
    auto_size: DucTableAutoSize

@dataclass
class ImageCrop:
    x: float
    y: float
    width: float
    height: float
    natural_width: float
    natural_height: float

@dataclass
class DucImageElement:
    base: DucElementBase
    scale: List[float]
    status: IMAGE_STATUS
    file_id: Optional[str]
    crop: Optional[ImageCrop]
    filter: Optional[DucImageFilter]

@dataclass
class DucTextDynamicElementSource:
    element_id: str
    property: TEXT_FIELD_SOURCE_PROPERTY

@dataclass
class DucTextDynamicDictionarySource:
    key: str

@dataclass
class DucTextDynamicSource:
    source: Union[DucTextDynamicElementSource, DucTextDynamicDictionarySource]

@dataclass
class DucTextDynamicPart:
    tag: str
    source: DucTextDynamicSource
    cached_value: str
    formatting: Optional["PrimaryUnits"]

@dataclass
class DucTextElement:
    base: DucElementBase
    style: DucTextStyle
    text: str
    dynamic: List[DucTextDynamicPart]
    auto_resize: bool
    original_text: str
    container_id: Optional[str]

@dataclass
class DucLinearElement:
    linear_base: DucLinearElementBase
    wipeout_below: bool

@dataclass
class DucArrowElement:
    linear_base: DucLinearElementBase
    elbowed: bool

@dataclass
class DucFreeDrawEnds:
    cap: bool
    taper: float
    easing: str

@dataclass
class DucFreeDrawElement:
    base: DucElementBase
    points: List[DucPoint]
    size: float
    thinning: float
    smoothing: float
    streamline: float
    easing: str
    pressures: List[float]
    simulate_pressure: bool
    last_committed_point: Optional[DucPoint]
    start: Optional[DucFreeDrawEnds]
    end: Optional[DucFreeDrawEnds]
    svg_path: Optional[str]

@dataclass
class DucBlockAttributeDefinition:
    tag: str
    default_value: str
    is_constant: bool
    prompt: Optional[str]

@dataclass
class DucBlockAttributeDefinitionEntry:
    key: str
    value: DucBlockAttributeDefinition

@dataclass
class DucBlock:
    id: str
    label: str
    version: int
    elements: List["ElementWrapper"]
    attribute_definitions: List[DucBlockAttributeDefinitionEntry]
    description: Optional[str]

@dataclass
class StringValueEntry:
    key: str
    value: str

@dataclass
class DucBlockDuplicationArray:
    rows: int
    cols: int
    row_spacing: float
    col_spacing: float

@dataclass
class DucBlockInstanceElement:
    base: DucElementBase
    block_id: str
    element_overrides: Optional[List[StringValueEntry]]
    attribute_values: Optional[List[StringValueEntry]]
    duplication_array: Optional[DucBlockDuplicationArray]

@dataclass
class DucFrameElement:
    stack_element_base: DucStackElementBase

@dataclass
class PlotLayout:
    margins: Margins

@dataclass
class DucPlotElement:
    stack_element_base: DucStackElementBase
    style: DucPlotStyle
    layout: PlotLayout

@dataclass
class DucViewportElement:
    linear_base: DucLinearElementBase
    stack_base: DucStackBase
    style: DucViewportStyle
    view: DucView
    scale: float
    shade_plot: VIEWPORT_SHADE_PLOT
    frozen_group_ids: List[str]
    standard_override: Optional[str]

@dataclass
class DucXRayElement:
    base: DucElementBase
    style: DucXRayStyle
    origin: DucPoint
    direction: DucPoint
    start_from_origin: bool

@dataclass
class LeaderTextBlockContent:
    text: str

@dataclass
class LeaderBlockContent:
    block_id: str
    attribute_values: Optional[List[StringValueEntry]]
    element_overrides: Optional[List[StringValueEntry]]

@dataclass
class LeaderContent:
    content: Union[LeaderTextBlockContent, LeaderBlockContent]

@dataclass
class DucLeaderElement:
    linear_base: DucLinearElementBase
    style: DucLeaderStyle
    content_anchor: GeometricPoint
    content: Optional[LeaderContent]

@dataclass
class DimensionDefinitionPoints:
    origin1: GeometricPoint
    location: GeometricPoint
    origin2: Optional[GeometricPoint]
    center: Optional[GeometricPoint]
    jog: Optional[GeometricPoint]

@dataclass
class DimensionBindings:
    origin1: Optional[DucPointBinding]
    origin2: Optional[DucPointBinding]
    center: Optional[DucPointBinding]

@dataclass
class DimensionBaselineData:
    base_dimension_id: Optional[str]

@dataclass
class DimensionContinueData:
    continue_from_dimension_id: Optional[str]

@dataclass
class DucDimensionElement:
    base: DucElementBase
    style: DucDimensionStyle
    definition_points: DimensionDefinitionPoints
    oblique_angle: float
    dimension_type: DIMENSION_TYPE
    ordinate_axis: Optional[AXIS]
    bindings: Optional[DimensionBindings]
    text_override: Optional[str]
    text_position: Optional[GeometricPoint]
    tolerance_override: Optional[DimensionToleranceStyle]
    baseline_data: Optional[DimensionBaselineData]
    continue_data: Optional[DimensionContinueData]

@dataclass
class DatumReference:
    letters: str
    modifier: Optional[MATERIAL_CONDITION]

@dataclass
class ToleranceClause:
    value: str
    feature_modifiers: List[FEATURE_MODIFIER]
    zone_type: Optional[TOLERANCE_ZONE_TYPE]
    material_condition: Optional[MATERIAL_CONDITION]

@dataclass
class FeatureControlFrameSegment:
    tolerance: ToleranceClause
    datums: List[DatumReference]
    symbol: GDT_SYMBOL

@dataclass
class FCFSegmentRow:
    segments: List[FeatureControlFrameSegment]

@dataclass
class FCFBetweenModifier:
    start: str
    end: str

@dataclass
class FCFProjectedZoneModifier:
    value: float

@dataclass
class FCFFrameModifiers:
    between: Optional[FCFBetweenModifier]
    projected_tolerance_zone: Optional[FCFProjectedZoneModifier]
    all_around: Optional[bool]
    all_over: Optional[bool]
    continuous_feature: Optional[bool]

@dataclass
class FCFDatumDefinition:
    letter: str
    feature_binding: Optional[DucPointBinding]

@dataclass
class DucFeatureControlFrameElement:
    base: DucElementBase
    style: DucFeatureControlFrameStyle
    rows: List[FCFSegmentRow]
    frame_modifiers: Optional[FCFFrameModifiers]
    leader_element_id: Optional[str]
    datum_definition: Optional[FCFDatumDefinition]

@dataclass
class TextColumn:
    width: float
    gutter: float

@dataclass
class ColumnLayout:
    definitions: List[TextColumn]
    auto_height: bool
    type: COLUMN_TYPE

@dataclass
class DucDocElement:
    base: DucElementBase
    style: DucDocStyle
    text: str
    dynamic: List[DucTextDynamicPart]
    columns: ColumnLayout
    auto_resize: bool
    flow_direction: TEXT_FLOW_DIRECTION
    

@dataclass
class DucCommonStyle:
    background: ElementBackground
    stroke: ElementStroke

@dataclass
class ParametricSource:
    type: PARAMETRIC_SOURCE_TYPE
    code: str
    file_id: str

@dataclass
class DucParametricElement:
    base: DucElementBase
    source: ParametricSource

@dataclass
class DucGroup:
    id: str
    stack_base: DucStackBase

@dataclass
class DucRegion:
    id: str
    stack_base: DucStackBase
    boolean_operation: BOOLEAN_OPERATION

@dataclass
class DucLayerOverrides:
    stroke: ElementStroke
    background: ElementBackground

@dataclass
class DucLayer:
    id: str
    stack_base: DucStackBase
    readonly: bool
    overrides: DucLayerOverrides

# Element Union
DucElement = Union[
    DucRectangleElement,
    DucPolygonElement,
    DucEllipseElement,
    DucEmbeddableElement,
    DucPdfElement,
    DucMermaidElement,
    DucTableElement,
    DucImageElement,
    DucTextElement,
    DucLinearElement,
    DucArrowElement,
    DucFreeDrawElement,
    DucBlockInstanceElement,
    DucFrameElement,
    DucPlotElement,
    DucViewportElement,
    DucXRayElement,
    DucLeaderElement,
    DucDimensionElement,
    DucFeatureControlFrameElement,
    DucDocElement,
    DucParametricElement
]

@dataclass
class ElementWrapper:
    element: DucElement
