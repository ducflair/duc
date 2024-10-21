from enum import Enum

class FillStyle(Enum):
    HACHURE = "hachure"
    CROSS_HATCH = "cross-hatch"
    SOLID = "solid"
    ZIGZAG = "zigzag"

class StrokeStyle(Enum):
    SOLID = "solid"
    DASHED = "dashed"
    DOTTED = "dotted"

class StrokePlacement(Enum):
    INSIDE = 0
    CENTER = 1
    OUTSIDE = 2

class TextAlign(Enum):
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"

class ArrowType(Enum):
    SHARP = "sharp"
    ROUND = "round"
    ELBOW = "elbow"

class Theme(Enum):
    LIGHT = "light"
    DARK = "dark"

class ElementType(Enum):
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
    GROUP = "group"
    EMBEDDABLE = "embeddable"
    LASER = "laser"
    CUSTOM = "custom"

class ToolType(Enum):
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
    LASER = "laser"
    CUSTOM = "custom"
