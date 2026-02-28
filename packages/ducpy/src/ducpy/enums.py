"""
Native enum definitions for DUC types.
Source of truth: types.rs / duc.sql
"""
from enum import IntEnum


class VERTICAL_ALIGN(IntEnum):
    TOP = 10
    MIDDLE = 11
    BOTTOM = 12


class TEXT_ALIGN(IntEnum):
    LEFT = 10
    CENTER = 11
    RIGHT = 12


class LINE_SPACING_TYPE(IntEnum):
    AT_LEAST = 10
    EXACTLY = 11
    MULTIPLE = 12


class STROKE_PLACEMENT(IntEnum):
    INSIDE = 10
    CENTER = 11
    OUTSIDE = 12


class STROKE_PREFERENCE(IntEnum):
    SOLID = 10
    DASHED = 11
    DOTTED = 12
    CUSTOM = 13


class STROKE_SIDE_PREFERENCE(IntEnum):
    TOP = 10
    BOTTOM = 11
    LEFT = 12
    RIGHT = 13
    CUSTOM = 14
    ALL = 15


class STROKE_CAP(IntEnum):
    BUTT = 10
    ROUND = 11
    SQUARE = 12


class STROKE_JOIN(IntEnum):
    MITER = 10
    ROUND = 11
    BEVEL = 12


class LINE_HEAD(IntEnum):
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


class BEZIER_MIRRORING(IntEnum):
    NONE = 10
    ANGLE = 11
    ANGLE_LENGTH = 12


class BLENDING(IntEnum):
    MULTIPLY = 11
    SCREEN = 12
    OVERLAY = 13
    DARKEN = 14
    LIGHTEN = 15
    DIFFERENCE = 16
    EXCLUSION = 17


class ELEMENT_CONTENT_PREFERENCE(IntEnum):
    SOLID = 12
    FILL = 14
    FIT = 15
    TILE = 16
    STRETCH = 17
    HATCH = 18


class HATCH_STYLE(IntEnum):
    NORMAL = 10
    OUTER = 11
    IGNORE = 12


class IMAGE_STATUS(IntEnum):
    PENDING = 10
    SAVED = 11
    ERROR = 12


class PRUNING_LEVEL(IntEnum):
    CONSERVATIVE = 10
    BALANCED = 20
    AGGRESSIVE = 30


class BOOLEAN_OPERATION(IntEnum):
    UNION = 10
    SUBTRACT = 11
    INTERSECT = 12
    EXCLUDE = 13
