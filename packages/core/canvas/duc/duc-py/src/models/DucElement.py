from nanoid import generate
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union
from ..enums import FillStyle, StrokePlacement, StrokeStyle, ArrowType, TextAlign, ElementType
from ..constants import DEFAULT_DUC_ELEMENT, DEFAULT_VERTICAL_ALIGN, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE

@dataclass
class Point:
    x: float
    y: float

@dataclass
class PointBinding:
    element_id: str
    focus: float
    gap: float
    fixed_point: Optional[Point] = None

@dataclass
class BoundElement:
    id: str
    type: str

@dataclass
class DucElementBase:
    id: str = field(default_factory=lambda: generate(size=10))
    type: str = field(init=False)
    x: float = 0.0
    y: float = 0.0
    index: str = DEFAULT_DUC_ELEMENT["index"]
    scope: str = DEFAULT_DUC_ELEMENT["scope"]
    writing_layer: str = DEFAULT_DUC_ELEMENT["writingLayer"]
    label: Optional[str] = None
    is_visible: bool = True
    roundness_type: Optional[str] = None
    roundness_value: Optional[int] = None
    background_color: str = DEFAULT_DUC_ELEMENT["backgroundColor"]
    fill_style: FillStyle = DEFAULT_DUC_ELEMENT["fillStyle"]
    stroke_color: str = DEFAULT_DUC_ELEMENT["strokeColor"]
    stroke_width: int = DEFAULT_DUC_ELEMENT["strokeWidth"]
    stroke_style: StrokeStyle = DEFAULT_DUC_ELEMENT["strokeStyle"]
    stroke_placement: StrokePlacement = DEFAULT_DUC_ELEMENT["strokePlacement"]
    opacity: float = DEFAULT_DUC_ELEMENT["opacity"]
    width: float = 0.0
    height: float = 0.0
    angle: float = DEFAULT_DUC_ELEMENT["angle"]
    is_deleted: bool = False
    group_ids: List[str] = field(default_factory=list)
    frame_id: Optional[str] = None
    bound_elements: List[BoundElement] = field(default_factory=list)
    link: Optional[str] = None
    locked: bool = DEFAULT_DUC_ELEMENT["locked"]
    custom_data: Optional[str] = None
    is_stroke_disabled: bool = False
    is_background_disabled: bool = False

    def __post_init__(self):
        if isinstance(self.stroke_style, str):
            self.stroke_style = StrokeStyle(self.stroke_style)
        if isinstance(self.stroke_placement, int):
            self.stroke_placement = StrokePlacement(self.stroke_placement)

@dataclass
class DucTextElement(DucElementBase):
    type: str = field(init=False, default=ElementType.TEXT.value)
    font_size: int = DEFAULT_FONT_SIZE
    font_family: str = DEFAULT_FONT_FAMILY
    text: str = ""
    text_align: TextAlign = TextAlign.LEFT
    vertical_align: str = DEFAULT_VERTICAL_ALIGN
    container_id: Optional[str] = None
    original_text: str = ""
    line_height: float = 1.25
    auto_resize: bool = True

    def __post_init__(self):
        super().__post_init__()
        if isinstance(self.text_align, str):
            self.text_align = TextAlign(self.text_align)

@dataclass
class DucLinearElement(DucElementBase):
    points: List[Point] = field(default_factory=list)
    last_committed_point: Optional[Point] = None
    start_binding: Optional[PointBinding] = None
    end_binding: Optional[PointBinding] = None
    start_arrowhead: Optional[str] = None
    end_arrowhead: Optional[str] = None

@dataclass
class DucArrowElement(DucLinearElement):
    type: str = field(init=False, default=ElementType.ARROW.value)
    elbowed: bool = False

@dataclass
class DucLineElement(DucLinearElement):
    type: str = field(init=False, default=ElementType.LINE.value)

@dataclass
class DucFreeDrawElement(DucElementBase):
    type: str = field(init=False, default=ElementType.FREEDRAW.value)
    points: List[Point] = field(default_factory=list)
    pressures: List[float] = field(default_factory=list)
    simulate_pressure: bool = False

@dataclass
class DucImageElement(DucElementBase):
    type: str = field(init=False, default=ElementType.IMAGE.value)
    file_id: str = ""
    status: str = "pending"
    scale: Point = field(default_factory=lambda: Point(1.0, 1.0))

@dataclass
class DucFrameElement(DucElementBase):
    type: str = field(init=False, default=ElementType.FRAME.value)
    is_collapsed: bool = False
    name: str = ""

@dataclass
class DucGroupElement(DucElementBase):
    type: str = field(init=False, default=ElementType.GROUP.value)
    group_id_ref: str = ""

@dataclass
class DucRectangleElement(DucElementBase):
    type: str = field(init=False, default=ElementType.RECTANGLE.value)

@dataclass
class DucEllipseElement(DucElementBase):
    type: str = field(init=False, default=ElementType.ELLIPSE.value)

@dataclass
class DucDiamondElement(DucElementBase):
    type: str = field(init=False, default=ElementType.DIAMOND.value)

DucElementUnion = Union[
    DucElementBase,
    DucTextElement,
    DucArrowElement,
    DucLineElement,
    DucFreeDrawElement,
    DucImageElement,
    DucFrameElement,
    DucGroupElement,
    DucRectangleElement,
    DucEllipseElement,
    DucDiamondElement
]
