from dataclasses import dataclass
from typing import Optional, List, Tuple
from ..utils.enums import (
    ElementContentPreference, StrokePreference, StrokeSidePreference,
    StrokePlacement, StrokeCap, StrokeJoin, BezierMirroring, LineHead
)


@dataclass
class SimplePoint:
    x: float
    y: float

@dataclass
class BezierHandle:
    x: float
    y: float

@dataclass
class Point:
    x: float
    y: float
    is_curve: Optional[bool] = None
    mirroring: Optional[BezierMirroring] = None
    border_radius: Optional[float] = None
    handle_in: Optional[BezierHandle] = None
    handle_out: Optional[BezierHandle] = None
    peer: Optional[int] = None
    
@dataclass
class TilingProperties:
    size_in_percent: float
    angle: float  # in radians
    spacing: Optional[float] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None

@dataclass
class ElementContentBase:
    preference: ElementContentPreference
    src: str  # Can be a color, gradient, image (fileId or url), frame element's content `@el/${elementId}`
    visible: bool
    opacity: float
    tiling: Optional[TilingProperties] = None

@dataclass
class StrokeStyle:
    preference: StrokePreference
    cap: Optional[StrokeCap] = None
    join: Optional[StrokeJoin] = None
    dash: Optional[List[float]] = None
    dash_cap: Optional[StrokeCap] = None
    miter_limit: Optional[float] = None

@dataclass
class StrokeSides:
    preference: StrokeSidePreference
    values: Optional[List[float]] = None

@dataclass
class ElementStroke:
    content: ElementContentBase
    width: float
    style: StrokeStyle
    placement: StrokePlacement
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
    offset: float  # -1 to 1 range

@dataclass
class PointBinding:
    element_id: str
    focus: float
    gap: float
    fixed_point: Optional[Point] = None
    point: Optional[BindingPoint] = None
    head: Optional[LineHead] = None

@dataclass
class BoundElement:
    id: str
    type: str  # DucElementTypes