from dataclasses import dataclass
from typing import Any, List, Optional, Union

from ducpy.enums import (BEZIER_MIRRORING, BLENDING, BOOLEAN_OPERATION,
                         ELEMENT_CONTENT_PREFERENCE, HATCH_STYLE, IMAGE_STATUS,
                         LINE_HEAD, LINE_SPACING_TYPE, STROKE_CAP, STROKE_JOIN,
                         STROKE_PLACEMENT, STROKE_PREFERENCE,
                         STROKE_SIDE_PREFERENCE, TEXT_ALIGN, VERTICAL_ALIGN)

# =============== UTILITY & GEOMETRY TYPES ===============

@dataclass
class DictionaryEntry:
    key: str
    value: str

@dataclass
class StringValueEntry:
    key: str
    value: str

@dataclass
class GeometricPoint:
    x: float
    y: float

@dataclass
class DucPoint:
    x: float
    y: float
    mirroring: Optional[BEZIER_MIRRORING] = None

@dataclass
class Margins:
    top: float
    right: float
    bottom: float
    left: float


# =============== 3D VIEWER STATE ===============

@dataclass
class Viewer3DClipPlane:
    enabled: bool
    value: float
    normal: Optional[List[float]] = None

@dataclass
class Viewer3DMaterial:
    metalness: float
    roughness: float
    default_opacity: float
    edge_color: int
    ambient_intensity: float
    direct_intensity: float

@dataclass
class Viewer3DZebra:
    active: bool
    stripe_count: int
    stripe_direction: float
    color_scheme: str
    opacity: float
    mapping_mode: str

@dataclass
class Viewer3DCamera:
    control: str
    ortho: bool
    up: str
    position: List[float]
    quaternion: List[float]
    target: List[float]
    zoom: float
    pan_speed: float
    rotate_speed: float
    zoom_speed: float
    holroyd: bool

@dataclass
class Viewer3DGridPlanes:
    xy: bool
    xz: bool
    yz: bool

@dataclass
class Viewer3DGrid:
    """Tagged union: {"type": "uniform", "value": bool} or {"type": "perPlane", "value": Viewer3DGridPlanes}"""
    type: str
    value: Any

@dataclass
class Viewer3DDisplay:
    wireframe: bool
    transparent: bool
    black_edges: bool
    grid: Viewer3DGrid
    axes_visible: bool
    axes_at_origin: bool

@dataclass
class Viewer3DClipping:
    x: Viewer3DClipPlane
    y: Viewer3DClipPlane
    z: Viewer3DClipPlane
    intersection: bool
    show_planes: bool
    object_color_caps: bool

@dataclass
class Viewer3DExplode:
    active: bool
    value: float

@dataclass
class Viewer3DState:
    camera: Viewer3DCamera
    display: Viewer3DDisplay
    material: Viewer3DMaterial
    clipping: Viewer3DClipping
    explode: Viewer3DExplode
    zebra: Viewer3DZebra


# =============== STYLING & CONTENT ===============

@dataclass
class TilingProperties:
    size_in_percent: float
    angle: float
    spacing: Optional[float] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None

@dataclass
class HatchPatternLine:
    angle: float
    origin: DucPoint
    offset: List[float]
    dash_pattern: List[float]

@dataclass
class CustomHatchPattern:
    name: str
    lines: List[HatchPatternLine]
    description: Optional[str] = None

@dataclass
class DucHatchStyle:
    hatch_style: HATCH_STYLE
    pattern_name: str
    pattern_scale: float
    pattern_angle: float
    pattern_origin: DucPoint
    pattern_double: bool
    custom_pattern: Optional[CustomHatchPattern] = None

@dataclass
class DucImageFilter:
    brightness: float
    contrast: float

@dataclass
class ElementContentBase:
    src: str
    visible: bool
    opacity: float
    preference: Optional[ELEMENT_CONTENT_PREFERENCE] = None
    tiling: Optional[TilingProperties] = None
    hatch: Optional[DucHatchStyle] = None
    image_filter: Optional[DucImageFilter] = None

@dataclass
class StrokeStyle:
    preference: Optional[STROKE_PREFERENCE] = None
    cap: Optional[STROKE_CAP] = None
    join: Optional[STROKE_JOIN] = None
    dash: Optional[List[float]] = None
    dash_line_override: Optional[str] = None
    dash_cap: Optional[STROKE_CAP] = None
    miter_limit: Optional[float] = None

@dataclass
class StrokeSides:
    preference: Optional[STROKE_SIDE_PREFERENCE] = None
    values: Optional[List[float]] = None

@dataclass
class ElementStroke:
    content: ElementContentBase
    width: float
    style: StrokeStyle
    placement: Optional[STROKE_PLACEMENT] = None
    stroke_sides: Optional[StrokeSides] = None

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


# =============== BASE ELEMENT & COMMON ELEMENT COMPONENTS ===============

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
    is_deleted: bool
    group_ids: List[str]
    block_ids: List[str]
    region_ids: List[str]
    z_index: float
    locked: bool
    description: Optional[str] = None
    index: Optional[str] = None
    instance_id: Optional[str] = None
    layer_id: Optional[str] = None
    frame_id: Optional[str] = None
    bound_elements: Optional[List[BoundElement]] = None
    link: Optional[str] = None
    custom_data: Optional[str] = None

@dataclass
class DucHead:
    size: float
    type: Optional[LINE_HEAD] = None
    block_id: Optional[str] = None

@dataclass
class PointBindingPoint:
    index: int
    offset: float

@dataclass
class DucPointBinding:
    element_id: str
    focus: float
    gap: float
    fixed_point: Optional[GeometricPoint] = None
    point: Optional[PointBindingPoint] = None
    head: Optional[DucHead] = None

@dataclass
class DucLineReference:
    index: int
    handle: Optional[GeometricPoint] = None

@dataclass
class DucLine:
    start: DucLineReference
    end: DucLineReference

@dataclass
class DucPath:
    line_indices: List[int]
    background: Optional[ElementBackground] = None
    stroke: Optional[ElementStroke] = None

@dataclass
class DucLinearElementBase:
    base: DucElementBase
    points: List[DucPoint]
    lines: List[DucLine]
    path_overrides: List[DucPath]
    last_committed_point: Optional[DucPoint] = None
    start_binding: Optional[DucPointBinding] = None
    end_binding: Optional[DucPointBinding] = None

@dataclass
class DucStackLikeStyles:
    opacity: float

@dataclass
class DucStackBase:
    label: str
    is_collapsed: bool
    is_plot: bool
    is_visible: bool
    locked: bool
    styles: DucStackLikeStyles
    description: Optional[str] = None

@dataclass
class DucStackElementBase:
    base: DucElementBase
    stack_base: DucStackBase
    clip: bool
    label_visible: bool


# =============== ELEMENT-SPECIFIC STYLES ===============

@dataclass
class LineSpacing:
    value: float
    type: Optional[LINE_SPACING_TYPE] = None

@dataclass
class DucTextStyle:
    is_ltr: bool
    font_family: str
    big_font_family: str
    text_align: TEXT_ALIGN
    vertical_align: VERTICAL_ALIGN
    line_height: float
    line_spacing: LineSpacing
    oblique_angle: float
    font_size: float
    width_factor: float
    is_upside_down: bool
    is_backwards: bool

@dataclass
class DucTableStyle:
    pass

@dataclass
class DucDocStyle:
    pass

@dataclass
class DucPlotStyle:
    pass


# =============== ELEMENT DEFINITIONS ===============

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
class DocumentGridConfig:
    columns: int
    gap_x: float
    gap_y: float
    first_page_alone: bool
    scale: float

@dataclass
class DucPdfElement:
    base: DucElementBase
    grid_config: DocumentGridConfig
    file_id: Optional[str] = None

@dataclass
class DucDocElement:
    base: DucElementBase
    style: DucDocStyle
    text: str
    grid_config: DocumentGridConfig
    file_id: Optional[str] = None

@dataclass
class DucTableElement:
    base: DucElementBase
    style: DucTableStyle
    file_id: Optional[str] = None

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
    status: IMAGE_STATUS
    scale: List[float]
    file_id: Optional[str] = None
    crop: Optional[ImageCrop] = None
    filter: Optional[DucImageFilter] = None

@dataclass
class DucTextElement:
    base: DucElementBase
    style: DucTextStyle
    text: str
    auto_resize: bool
    original_text: str
    container_id: Optional[str] = None

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
    start: Optional[DucFreeDrawEnds] = None
    end: Optional[DucFreeDrawEnds] = None
    last_committed_point: Optional[DucPoint] = None
    svg_path: Optional[str] = None

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
class DucModelElement:
    base: DucElementBase
    file_ids: List[str]
    model_type: Optional[str] = None
    code: Optional[str] = None
    svg_path: Optional[str] = None
    viewer_state: Optional[Viewer3DState] = None


# =============== BLOCK DEFINITIONS ===============

@dataclass
class DucBlockDuplicationArray:
    rows: int
    cols: int
    row_spacing: float
    col_spacing: float

@dataclass
class DucBlockMetadata:
    usage_count: int
    created_at: int
    updated_at: int
    source: Optional[str] = None
    localization: Optional[str] = None

@dataclass
class DucBlock:
    id: str
    label: str
    version: int
    description: Optional[str] = None
    metadata: Optional[DucBlockMetadata] = None
    thumbnail: Optional[bytes] = None

@dataclass
class DucBlockInstance:
    id: str
    block_id: str
    version: int
    element_overrides: Optional[List[StringValueEntry]] = None
    duplication_array: Optional[DucBlockDuplicationArray] = None

@dataclass
class DucBlockCollectionEntry:
    id: str
    is_collection: bool

@dataclass
class DucBlockCollection:
    id: str
    label: str
    children: List[DucBlockCollectionEntry]
    metadata: Optional[DucBlockMetadata] = None
    thumbnail: Optional[bytes] = None


# =============== GROUPS, REGIONS & LAYERS ===============

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
    overrides: Optional[DucLayerOverrides] = None


# =============== ELEMENT UNION ===============

DucElement = Union[
    DucRectangleElement,
    DucPolygonElement,
    DucEllipseElement,
    DucEmbeddableElement,
    DucPdfElement,
    DucDocElement,
    DucTableElement,
    DucImageElement,
    DucTextElement,
    DucLinearElement,
    DucArrowElement,
    DucFreeDrawElement,
    DucFrameElement,
    DucPlotElement,
    DucModelElement,
]

@dataclass
class ElementWrapper:
    element: DucElement
