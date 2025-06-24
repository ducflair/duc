from typing import Any, Dict, List, Optional, Union, Set
from dataclasses import dataclass, field

from ..utils.enums import (
    ElementType, FontFamily, TextAlign, VerticalAlign, LineHead,
    StrokeStyle, FillStyle, Theme, ImageStatus, BezierMirroring, 
    StrokeCap, ElementSubset
)



@dataclass
class SimplePoint:
    x: float
    y: float

@dataclass
class Point:
    x: float
    y: float
    mirroring: Optional[BezierMirroring] = None

@dataclass
class BezierHandle:
    x: float
    y: float

@dataclass
class TilingProperties:
    size_in_percent: float
    angle: float
    spacing: Optional[float] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None

@dataclass
class ElementContentBase:
    preference: int  # FillStyle values
    src: str
    visible: bool
    opacity: float
    tiling: Optional[TilingProperties] = None

@dataclass
class StrokeStyleProps:
    preference: int  # StrokePreference values
    cap: Optional[StrokeCap] = None
    join: Optional[int] = None  # StrokeJoin values
    dash: Optional[List[float]] = None
    dash_cap: Optional[StrokeCap] = None
    miter_limit: Optional[float] = None

@dataclass
class StrokeSides:
    preference: int  # StrokeSidePreference values
    values: Optional[List[float]] = None

@dataclass
class ElementStroke:
    content: ElementContentBase
    width: float
    style: StrokeStyleProps
    placement: int  # StrokePlacement values
    stroke_sides: Optional[StrokeSides] = None

@dataclass
class ElementBackground:
    content: ElementContentBase

@dataclass
class ImageCrop:
    x: float
    y: float
    width: float
    height: float
    natural_width: float
    natural_height: float

@dataclass
class BindingPoint:
    index: int
    offset: float

@dataclass
class PointBinding:
    element_id: str
    focus: float
    gap: float
    point: Optional[BindingPoint] = None
    head: Optional[int] = None
    fixed_point: Optional[SimplePoint] = None

@dataclass
class BoundElement:
    id: str
    type: str  # DucElementTypes

@dataclass
class DucLineReference:
    index: int
    handle: Optional[SimplePoint] = None

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
class DucTableStyleProps:
    background_color: Optional[str] = None
    border_width: Optional[float] = None
    border_dashes: List[float] = field(default_factory=list)
    border_color: Optional[str] = None
    text_color: Optional[str] = None
    text_size: Optional[float] = None
    text_font: Optional[str] = None
    text_align: Optional[int] = None

@dataclass
class DucTableColumn:
    id: str
    width: Optional[float] = None
    style: Optional[DucTableStyleProps] = None

@dataclass
class DucTableRow:
    id: str
    height: Optional[float] = None
    style: Optional[DucTableStyleProps] = None

@dataclass
class DucTableCell:
    row_id: str
    column_id: str
    data: Optional[str] = None
    style: Optional[DucTableStyleProps] = None

@dataclass
class DucTableStyle:
    default_props: Optional[DucTableStyleProps] = None

# Base class for all Duc elements
@dataclass
class DucElementBase:
    id: str
    type: str
    x: float
    y: float
    scope: str
    subset: Optional[ElementSubset] = None
    label: str = ""
    is_visible: bool = True
    roundness: float = 0.0
    blending: Optional[int] = None
    stroke_color: Optional[str] = None  # deprecated
    background_color: Optional[str] = None  # deprecated
    background: List[ElementBackground] = field(default_factory=list)
    stroke: List[ElementStroke] = field(default_factory=list)
    opacity: float = 1.0
    width: float = 0.0
    height: float = 0.0
    angle: float = 0.0
    seed: int = 0
    version: int = 1
    version_nonce: int = 0
    is_deleted: bool = False
    group_ids: List[str] = field(default_factory=list)
    frame_id: Optional[str] = None
    bound_elements: List[BoundElement] = field(default_factory=list)
    z_index: int = 0
    updated: int = 0
    index: Optional[str] = None
    link: Optional[str] = None
    locked: bool = False
    custom_data: Optional[Dict[str, Any]] = None

@dataclass
class DucSelectionElement(DucElementBase):
    type: str = field(default="selection", init=False)

@dataclass
class DucRectangleElement(DucElementBase):
    type: str = field(default="rectangle", init=False)

@dataclass
class DucPolygonElement(DucElementBase):
    type: str = field(default="polygon", init=False)
    sides: int = 6

@dataclass
class DucEllipseElement(DucElementBase):
    type: str = field(default="ellipse", init=False)
    ratio: float = 1.0
    start_angle: float = 0.0
    end_angle: float = 360.0
    show_aux_crosshair: bool = False

@dataclass
class DucImageElement(DucElementBase):
    type: str = field(default="image", init=False)
    file_id: Optional[str] = None
    status: Optional[str] = None
    scale: List[float] = field(default_factory=lambda: [1.0, 1.0])
    crop: Optional[ImageCrop] = None

@dataclass
class DucGroupingElementBase(DucElementBase):
    is_collapsed: bool = False
    clip: bool = False

@dataclass
class DucFrameElement(DucGroupingElementBase):
    type: str = field(default="frame", init=False)

@dataclass
class DucGroupElement(DucGroupingElementBase):
    type: str = field(default="group", init=False)
    group_id_ref: str = ""

@dataclass
class DucMagicFrameElement(DucGroupingElementBase):
    type: str = field(default="magicframe", init=False)

@dataclass
class DucEmbeddableElement(DucElementBase):
    type: str = field(default="embeddable", init=False)

@dataclass
class DucIframeElement(DucElementBase):
    type: str = field(default="iframe", init=False)

@dataclass
class DucTableElement(DucElementBase):
    type: str = field(default="table", init=False)
    column_order: List[str] = field(default_factory=list)
    row_order: List[str] = field(default_factory=list)
    columns: List[DucTableColumn] = field(default_factory=list)
    rows: List[DucTableRow] = field(default_factory=list)
    cells: List[DucTableCell] = field(default_factory=list)
    style: Optional[DucTableStyleProps] = None

@dataclass
class DucDocElement(DucElementBase):
    type: str = field(default="doc", init=False)
    content: str = ""

@dataclass
class DucTextElement(DucElementBase):
    type: str = field(default="text", init=False)
    font_size: float = 14.0
    font_family: Optional[str] = None
    text: str = ""
    text_align: Optional[str] = None
    vertical_align: Optional[str] = None
    container_id: Optional[str] = None
    original_text: Optional[str] = None
    auto_resize: bool = True
    line_height: float = 1.2

@dataclass
class DucLinearElement(DucElementBase):
    type: str = field(default="line", init=False)
    points: List[Point] = field(default_factory=list)
    lines: List[DucLine] = field(default_factory=list)
    path_overrides: List[DucPath] = field(default_factory=list)
    last_committed_point: Optional[Point] = None
    start_binding: Optional[PointBinding] = None
    end_binding: Optional[PointBinding] = None

@dataclass
class DucArrowElement(DucLinearElement):
    type: str = field(default="arrow", init=False)
    elbowed: bool = False

@dataclass
class DucFreeDrawEnds:
    cap: bool
    taper: float
    easing: str

@dataclass
class DucFreeDrawElement(DucElementBase):
    type: str = field(default="freedraw", init=False)
    points: List[Point] = field(default_factory=list)
    size: float = 1.0
    thinning: float = 0.0
    smoothing: float = 0.0
    streamline: float = 0.0
    easing: str = "linear"
    start: Optional[DucFreeDrawEnds] = None
    end: Optional[DucFreeDrawEnds] = None
    pressures: List[float] = field(default_factory=list)
    simulate_pressure: bool = False
    last_committed_point: Optional[Point] = None
    svg_path: Optional[str] = None

# Union type for all possible DucElement types
DucElementUnion = Union[
    DucSelectionElement,
    DucRectangleElement,
    DucPolygonElement,
    DucEllipseElement,
    DucImageElement,
    DucFrameElement,
    DucGroupElement,
    DucMagicFrameElement,
    DucEmbeddableElement,
    DucIframeElement,
    DucTableElement,
    DucDocElement,
    DucTextElement,
    DucLinearElement,
    DucArrowElement,
    DucFreeDrawElement
]

# Backwards compatibility - keep the old DucElement class as an alias
DucElement = DucElementBase
