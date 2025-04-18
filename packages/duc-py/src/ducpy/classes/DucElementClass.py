from nanoid import generate
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union, Tuple, Literal
from ..utils.enums import FillStyle, StrokePlacement, StrokeStyle, TextAlign, ElementType, LineHead, ElementContentPreference, StrokePreference, StrokeSidePreference, ElementSubset, Blending, StrokeCap, StrokeJoin, BezierMirroring, VerticalAlign, FontFamily, ImageStatus
from ..utils.constants import DEFAULT_FONT_SIZE, DEFAULT_ELEMENT_PROPS, DEFAULT_LINE_HEIGHT
from ..utils.ElementTypes import *



@dataclass
class DucElement:
    id: str
    type: str
    x: float
    y: float
    scope: str  # SupportedMeasures
    # Optional fields after required ones
    subset: Optional[ElementSubset] = None
    label: str = field(default=DEFAULT_ELEMENT_PROPS["label"])
    is_visible: bool = field(default=DEFAULT_ELEMENT_PROPS["isVisible"])
    roundness: float = field(default=DEFAULT_ELEMENT_PROPS["roundness"])
    blending: Optional[Blending] = None
    stroke: List[ElementStroke] = field(default_factory=lambda: [DEFAULT_ELEMENT_PROPS["stroke"]])
    background: List[ElementBackground] = field(default_factory=lambda: [DEFAULT_ELEMENT_PROPS["background"]])
    opacity: float = field(default=DEFAULT_ELEMENT_PROPS["opacity"])
    width: float = field(default=DEFAULT_ELEMENT_PROPS["width"])
    height: float = field(default=DEFAULT_ELEMENT_PROPS["height"])
    angle: float = field(default=DEFAULT_ELEMENT_PROPS["angle"])
    seed: int = 0
    version: int = 0
    version_nonce: int = 0
    is_deleted: bool = False
    group_ids: List[str] = field(default_factory=list)
    frame_id: Optional[str] = field(default=DEFAULT_ELEMENT_PROPS["frameId"])
    bound_elements: Optional[List[BoundElement]] = field(default=DEFAULT_ELEMENT_PROPS["boundElements"])
    updated: int = 0  # epoch ms
    index: Optional[str] = field(default=DEFAULT_ELEMENT_PROPS["index"])
    link: Optional[str] = field(default=DEFAULT_ELEMENT_PROPS["link"])
    locked: bool = field(default=DEFAULT_ELEMENT_PROPS["locked"])
    custom_data: Optional[Dict] = None

@dataclass
class DucLinearElement(DucElement):
    points: List[Point] = field(default_factory=list)  # Make points a default field
    last_committed_point: Optional[Point] = None
    start_binding: Optional[PointBinding] = None
    end_binding: Optional[PointBinding] = None

@dataclass
class DucArrowElement(DucLinearElement):
    elbowed: bool = False

@dataclass
class DucFreeDrawElement(DucElement):
    points: List[Point] = field(default_factory=list)  # Make points a default field
    pressures: List[float] = field(default_factory=list)  # Make pressures a default field
    simulate_pressure: bool = False
    last_committed_point: Optional[Point] = None
    
@dataclass
class DucTextElement(DucElement):
    font_size: float = field(default=DEFAULT_FONT_SIZE)
    font_family: FontFamily = field(default=FontFamily.ROBOTO_MONO)
    text: str = ""
    text_align: TextAlign = TextAlign.LEFT
    vertical_align: VerticalAlign = VerticalAlign.TOP
    container_id: Optional[str] = None
    original_text: Optional[str] = None
    line_height: float = field(default=DEFAULT_LINE_HEIGHT)
    auto_resize: bool = True


@dataclass
class DucImageElement(DucElement):
    file_id: Optional[str] = None  # FileId
    status: ImageStatus = ImageStatus.PENDING
    scale: Tuple[float, float] = field(default_factory=lambda: (1.0, 1.0))
    crop: Optional[ImageCrop] = None

@dataclass
class DucFrameElement(DucElement):
    is_collapsed: bool = False
    clip: bool = False

@dataclass
class DucGroupElement(DucElement):
    is_collapsed: bool = False
    clip: bool = False
    group_id_ref: str = field(default="")  # Make this a default field

@dataclass
class DucMagicFrameElement(DucElement):
    is_collapsed: bool = False
    clip: bool = False

@dataclass
class DucSelectionElement(DucElement):
    pass

@dataclass
class DucRectangleElement(DucElement):
    pass

@dataclass
class DucDiamondElement(DucElement):
    pass

@dataclass
class DucEllipseElement(DucElement):
    pass

DucElementUnion = Union[
    DucElement,
    DucTextElement,
    DucLinearElement,
    DucFreeDrawElement,
    DucImageElement,
    DucFrameElement,
    DucGroupElement,
    DucRectangleElement,
    DucEllipseElement,
    DucDiamondElement
]
