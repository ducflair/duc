from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Union, Tuple

from ..utils.enums import (
    Blending, 
    FontFamily,
    TextAlign,
    VerticalAlign,
    LineHead,
    StrokeStyle,
    FillStyle,
    Theme,
    ImageStatus,
    BezierMirroring,
    StrokeCap,
    ElementType as ElementTypeEnum
)

class ElementType(Enum):
    RECTANGLE = "rectangle"
    ELLIPSE = "ellipse"
    FREEDRAW = "freedraw"
    LINE = "line"
    ARROW = "arrow"
    IMAGE = "image"
    TEXT = "text"
    TABLE = "table"
    FRAME = "frame"
    GROUP = "group"
    MAGIC_FRAME = "magicframe"
    DOC = "doc"
    POLYGON = "polygon"

@dataclass
class Point:
    x: float
    y: float
    mirroring: Optional[BezierMirroring] = None

@dataclass
class TilingProperties:
    scale: float
    offset_x: float
    offset_y: float
    rotation: float

@dataclass
class ElementContentBase:
    preference: int  # ElementContentPreference values
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
class ElementStroke:
    content: ElementContentBase
    width: float
    style: StrokeStyleProps
    placement: int  # StrokePlacement values
    stroke_sides: Optional['StrokeSides'] = None

@dataclass
class ElementBackground:
    content: ElementContentBase

@dataclass
class BezierHandle:
    x: float
    y: float

@dataclass
class SimplePoint:
    x: float
    y: float

@dataclass
class ImageCrop:
    top: float
    right: float
    bottom: float
    left: float

@dataclass
class StrokeSides:
    preference: int  # StrokeSidePreference values
    values: Optional[List[float]] = None

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
    background: ElementBackground
    stroke: ElementStroke

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
    width: float
    style: Optional[DucTableStyleProps] = None

@dataclass
class DucTableRow:
    id: str
    height: float
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

# Alias for backward compatibility
StrokeStyle = StrokeStyleProps

# Re-export all element classes for convenience
__all__ = [
    'ElementType',
    'Point',
    'TilingProperties', 
    'ElementContentBase',
    'StrokeStyleProps',
    'ElementStroke',
    'ElementBackground',
    'BezierHandle',
    'SimplePoint',
    'ImageCrop',
    'StrokeSides',
    'BindingPoint',
    'PointBinding',
    'BoundElement',
    'DucLineReference',
    'DucLine',
    'DucPath',
    'DucTableStyleProps',
    'DucTableColumn',
    'DucTableRow',
    'DucTableCell',
    'DucTableStyle',
    'StrokeStyle',
]