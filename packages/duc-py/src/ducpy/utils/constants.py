from dataclasses import dataclass, field
from typing import Dict, Any

from .enums import (
    DesignStandard, FontFamily, TextAlign, 
    ElementContentPreference, StrokePreference, 
    StrokePlacement, StrokeJoin, StrokeCap
)
from .ElementTypes import (
    ElementStroke, ElementBackground, 
    ElementContentBase, StrokeStyle
)

# Export-related constants
EXPORT_DATA_TYPES = {
    "duc": "application/vnd.duc-cad",
    "ducfig": "application/vnd.duc-config",
    "json": "application/json",
    "excalidrawClipboard": "excalidraw/clipboard",
    "excalidrawLibrary": "excalidrawlib",
    "excalidrawClipboardWithAPI": "excalidraw-api/clipboard",
}

EXPORT_SOURCE = "pdf-to-duc"

VERSIONS = {
    "duc": 5,
    "excalidraw": 2,
    "excalidrawLibrary": 2,
}

# Constants
COLOR_PALETTE = {
    "midGray": "#808080",
    "white": "#ffffff",
    "charcoalBlack": "#1e1e1e",
    "voiceCall": "#a2f1a6",
}

# Default values
MIN_WIDTH_OR_HEIGHT = 1
MIN_FONT_SIZE = 1
DEFAULT_FONT_SIZE = 20
DEFAULT_GRID_SIZE = 10
DEFAULT_GRID_STEP = 5
DEFAULT_TRANSFORM_HANDLE_SPACING = 2
DEFAULT_LINE_HEIGHT = 1
DEFAULT_COLLISION_THRESHOLD = 4 - 0.00001  # 2 * SIDE_RESIZING_THRESHOLD - EPSILON
SIDE_RESIZING_THRESHOLD = 2 * DEFAULT_TRANSFORM_HANDLE_SPACING
TEXT_AUTOWRAP_THRESHOLD = 36
DRAGGING_THRESHOLD = 10
LINE_CONFIRM_THRESHOLD = 8
ELEMENT_SHIFT_TRANSLATE_AMOUNT = 5
ELEMENT_TRANSLATE_AMOUNT = 1
TEXT_TO_CENTER_SNAP_THRESHOLD = 30
SHIFT_LOCKING_ANGLE = 3.141592653589793 / 12  # Math.PI / 12
DEFAULT_LASER_COLOR = "red"

# Default Element Properties
DEFAULT_ELEMENT_PROPS = {

    "stroke": [ElementStroke(
        content=ElementContentBase(
            preference=ElementContentPreference.SOLID,
            src=COLOR_PALETTE["midGray"],
            visible=True,
            opacity=100,
        ),
        width=2,
        style=StrokeStyle(
            preference=StrokePreference.SOLID,
            join=StrokeJoin.MITER,
        ),
          placement=StrokePlacement.INSIDE,
    )],
    "background": [ElementBackground(
        content=ElementContentBase(
            preference=ElementContentPreference.SOLID,
            src=COLOR_PALETTE["midGray"],
            visible=True,
            opacity=10,
        ),
    )],
    "roundness": 0,
    "opacity": 100,
    "locked": False,
    "scope": "mm",
    "index": None,
    "label": "Lost Element",
    "width": 10,
    "height": 10,
    "angle": 0,
    "groupIds": [],
    "frameId": None,
    "boundElements": None,
    "link": None,
    "isVisible": True,
}

# Frame Style
FRAME_STYLE = {
    "stroke": [{
        "content": {
            "preference": ElementContentPreference.SOLID,
            "src": COLOR_PALETTE["midGray"],
            "visible": True,
            "opacity": 100,
        },
        "width": 2,
        "style": {
            "preference": StrokePreference.SOLID,
            "join": StrokeJoin.MITER,
        },
        "placement": StrokePlacement.INSIDE,
    }],
    "background": [{
        "content": {
            "preference": ElementContentPreference.SOLID,
            "src": COLOR_PALETTE["midGray"],
            "visible": True,
            "opacity": 10,
        },
    }],
    "roundness": 0,
    "radius": 8,
    "nameOffsetY": 3,
    "nameColorLightTheme": "#80808080",
    "nameColorDarkTheme": "#80808080",
    "nameFontSize": 14,
    "nameLineHeight": 1.25,
}

# Default App State
DEFAULT_APP_STATE = {
    "scope": "mm",
    "mainScope": "mm",
    "standard": DesignStandard.DUC,
    "writingLayer": "notes",
    "groups": [],
    "showWelcomeScreen": False,
    "theme": "light",
    "currentChartType": "bar",
    "currentItemStroke": DEFAULT_ELEMENT_PROPS["stroke"],
    "currentItemBackground": DEFAULT_ELEMENT_PROPS["background"],
    "currentItemOpacity": DEFAULT_ELEMENT_PROPS["opacity"],
    "currentItemFontFamily": FontFamily.ROBOTO_MONO,
    "currentItemFontSize": DEFAULT_FONT_SIZE,
    "currentItemTextAlign": TextAlign.LEFT,
    "currentItemStartLineHead": None,
    "currentItemEndLineHead": None,
    "currentItemRoundness": 0,
    "viewBackgroundColor": "#ffffff",
    "cursorButton": None,
    "editingGroupId": None,
    "gridSize": DEFAULT_GRID_SIZE,
    "gridStep": DEFAULT_GRID_STEP,
    "lastPointerDownWith": None,
    "name": None,
    "scrollX": 0,
    "scrollY": 0,
    "scrolledOutside": False,
    "selectedElementIds": {},
    "shouldCacheIgnoreZoom": False,
    "zoom": {
        "value": 1
    },
    "frameRendering": {
        "enabled": True,
        "clip": True,
        "name": True,
        "outline": True
    },
    "scaleRatioLocked": False,
    "displayAllPointDistances": False,
    "displayDistanceOnDrawing": True,
    "displayAllPointCoordinates": False,
    "displayAllPointInfoSelected": True,
    "coordDecimalPlaces": 2,
    "displayRootAxis": False,
    "lineBendingMode": False,
}

# Tool sets that don't support certain features
TOOLS_NO_BACKGROUND = {
    "eraser", 
    "laser", 
    "image", 
    "arrow",
    "hand", 
    "magicframe",
    "frame",
    "text", 
    "custom"
}

TOOLS_NO_STROKE = {
    "eraser", 
    "laser", 
    "image",
    "magicframe",
    "frame",
    "hand", 
    "custom"
}
