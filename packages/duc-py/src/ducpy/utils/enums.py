from enum import Enum, IntEnum, StrEnum


class DesignStandard(IntEnum):
    DUC = 10   # DUC (default)
    ABNT = 11  # Brazilian Association of Technical Standards
    ANSI = 12  # American National Standards Institute
    ISO = 13   # International Organization for Standardization
    DIN = 14   # German Institute for Standardization
    JIS = 15   # Japanese Industrial Standards
    GB = 16    # Chinese National Standards
    BSI = 17   # British Standards Institution

class Theme(StrEnum):
    LIGHT = "light"
    DARK = "dark"

class ChartType(StrEnum):
    BAR = "bar"
    LINE = "line"

class PointerType(StrEnum):
    MOUSE = "mouse"
    PEN = "pen"
    TOUCH = "touch"

class UserIdleState(StrEnum):
    ACTIVE = "active"
    AWAY = "away"
    IDLE = "idle"

# Enums
# Reference: https://www.figma.com/design/5rYcUlscflBabQ9di2iFJ5/duc-Architecture?node-id=313-43&t=gNEFgevk9KZ3oAun-1
class LineHead(IntEnum):
    ARROW = 10
    BAR = 11
    CIRCLE = 12
    CIRCLE_OUTLINED = 13
    TRIANGLE = 14
    TRIANGLE_OUTLINED = 15
    DIAMOND = 16
    DIAMOND_OUTLINED = 17
    CROSS = 18
    OPEN_ARROW = 19
    REVERSED_ARROW = 20
    REVERSED_TRIANGLE = 21
    REVERSED_TRIANGLE_OUTLINED = 22
    CONE = 23
    HALF_CONE = 24

class Blending(IntEnum):
    MULTIPLY = 11
    SCREEN = 12
    OVERLAY = 13
    DARKEN = 14
    LIGHTEN = 15
    DIFFERENCE = 16
    EXCLUSION = 17

class ElementSubset(IntEnum):
    AUX = 14
    COTA = 15

class ElementContentPreference(IntEnum):
    HACHURE = 10
    CROSS_HATCH = 11
    SOLID = 12
    ZIGZAG = 13
    FILL = 14
    FIT = 15
    TILE = 16
    STRETCH = 17
    HATCH = 18

class StrokePreference(IntEnum):
    SOLID = 10
    DASHED = 11
    DOTTED = 12
    CUSTOM = 13

class StrokeSidePreference(IntEnum):
    TOP = 10
    BOTTOM = 11
    LEFT = 12
    RIGHT = 13
    CUSTOM = 14
    ALL = 15

class StrokeCap(IntEnum):
    BUTT = 10
    ROUND = 11
    SQUARE = 12

class StrokeJoin(IntEnum):
    MITER = 10
    ROUND = 11
    BEVEL = 12

class StrokePlacement(IntEnum):
    INSIDE = 10
    CENTER = 11
    OUTSIDE = 12

class TextAlign(IntEnum):
    LEFT = 10
    CENTER = 11
    RIGHT = 12

class VerticalAlign(IntEnum):
    TOP = 10
    MIDDLE = 11
    BOTTOM = 12

class BezierMirroring(IntEnum):
    NONE = 10
    ANGLE = 11
    ANGLE_LENGTH = 12

class FontFamily(IntEnum):
    VIRGIL = 1
    HELVETICA = 2
    CASCADIA = 3
    EXCALIFONT = 5
    NUNITO = 6
    LILITA_ONE = 7
    COMIC_SHANNS = 8
    LIBERATION_SANS = 9
    ROBOTO_MONO = 10

class FillStyle(Enum):
    HACHURE = "hachure"
    CROSS_HATCH = "cross-hatch"
    SOLID = "solid"
    ZIGZAG = "zigzag"

class StrokeStyle(Enum):
    SOLID = "solid"
    DASHED = "dashed"
    DOTTED = "dotted"

class ArrowType(Enum):
    SHARP = "sharp"
    ROUND = "round"
    ELBOW = "elbow"

class Theme(StrEnum):
    LIGHT = "light"
    DARK = "dark"

class ImageStatus(StrEnum):
    PENDING = "pending"
    SAVED = "saved"
    ERROR = "error"

class ElementType(StrEnum):
    SELECTION = "selection"
    RECTANGLE = "rectangle"
    DIAMOND = "diamond"
    ELLIPSE = "ellipse"
    ARROW = "arrow"
    LINE = "line"
    FREEDRAW = "freedraw"
    TEXT = "text"
    IMAGE = "image"
    FRAME = "frame"
    MAGIC_FRAME = "magic_frame"
    GROUP = "group"
    EMBEDDABLE = "embeddable"
    LASER = "laser"
    CUSTOM = "custom"

class ToolType(StrEnum):
    SELECTION = "selection"
    RECTANGLE = "rectangle"
    DIAMOND = "diamond"
    ELLIPSE = "ellipse"
    ARROW = "arrow"
    LINE = "line"
    FREEDRAW = "freedraw"
    TEXT = "text"
    IMAGE = "image"
    ERASER = "eraser"
    HAND = "hand"
    FRAME = "frame"
    MAGICFRAME = "magicframe"
    EMBEDDABLE = "embeddable"
    RULER = "ruler"
    LASER = "laser"
    CUSTOM = "custom"

class HandleType(IntEnum):
    HANDLE_IN = 10
    HANDLE_OUT = 11
