from dataclasses import dataclass, field
from typing import Dict, Any
from .enums import TextAlign
# Export-related constants
EXPORT_DATA_TYPES = {
  "duc": "application/vnd.duc-cad",
  "ducfig": "application/vnd.duc-config", # Config file for duc
}

EXPORT_SOURCE = "pdf-to-duc"

VERSIONS = {
  "excalidraw": 2
}

# Constants
COLOR_PALETTE = {
  "midGray": "#808080",
  "white": "#ffffff",
}

DEFAULT_DUC_ELEMENT = {
    "strokeColor": "#808080",
    "backgroundColor": "#80808015",
    "isVisible": True,
    "fillStyle": "solid",
    "strokePlacement": 1,
    "strokeWidth": 2,
    "strokeStyle": "solid",
    "roundness": None,
    "roughness": None,
    "opacity": 100,
    "locked": False,
    "writingLayer": "notes",
    "scope": "mm",
    "index": 0,
    "label": None,
    "width": 0,
    "height": 0,
    "angle": 0,
    "groupIds": [],
    "frameId": None,
    "boundElements": None,
    "link": None,
    "isStrokeDisabled": False,
    "isBackgroundDisabled": False,
}


# Additional Constants
DEFAULT_FONT_SIZE = 20
DEFAULT_FONT_FAMILY = "Roboto Mono"
DEFAULT_TEXT_ALIGN = TextAlign.LEFT.value
DEFAULT_VERTICAL_ALIGN = "top"
DEFAULT_ROUGHNESS = None


# Default values for BinaryFiles
DEFAULT_BINARY_FILES: Dict[str, Any] = {}


DEFAULT_APP_STATE: Dict[str, Any] = {
    "scope": "mm",
    "writingLayer": "notes",
    "groups": [],
    "showWelcomeScreen": False,
    "theme": "light",
    "currentChartType": "bar",
    "currentItemBackgroundColor": DEFAULT_DUC_ELEMENT["backgroundColor"],
    "currentItemEndArrowhead": "arrow",
    "currentItemFillStyle": DEFAULT_DUC_ELEMENT["fillStyle"],
    "currentItemFontFamily": DEFAULT_FONT_FAMILY,
    "currentItemFontSize": DEFAULT_FONT_SIZE,
    "currentHoveredFontFamily": None,
    "currentItemOpacity": DEFAULT_DUC_ELEMENT["opacity"],
    "currentItemRoughness": DEFAULT_DUC_ELEMENT["roughness"],
    "currentItemStartArrowhead": None,
    "currentItemStrokeColor": DEFAULT_DUC_ELEMENT["strokeColor"],
    "currentItemStrokePlacement": DEFAULT_DUC_ELEMENT["strokePlacement"],
    "currentItemRoundness": "sharp",
    "currentItemStrokeStyle": DEFAULT_DUC_ELEMENT["strokeStyle"],
    "currentItemStrokeWidth": DEFAULT_DUC_ELEMENT["strokeWidth"],
    "currentItemTextAlign": DEFAULT_TEXT_ALIGN,
    "currentItemArrowType": "round",
    "cursorButton": "up",
    "activeEmbeddable": None,
    "editingGroupId": None,
    "gridSize": 10,
    "gridStep": 5,
    "gridModeEnabled": True,
    "isBindingEnabled": True,
    "defaultSidebarDockedPreference": False,
    "lastPointerDownWith": "mouse",
    "name": None,
    "openMenu": None,
    "openSidebar": None,
    "previousSelectedElementIds": {},
    "scrolledOutside": False,
    "scrollX": 1000,
    "scrollY": 1000,
    "selectedElementIds": {},
    "selectedGroupIds": {},
    "selectedElementsAreBeingDragged": False,
    "shouldCacheIgnoreZoom": False,
    "showStats": False,
    "viewBackgroundColor": "#ffffff",
    "zenModeEnabled": False,
    "zoom": {
        "value": 1
    },
    "frameRendering": {
        "enabled": True,
        "clip": True,
        "name": True,
        "outline": True
    },
    "editingFrame": None,
    "objectsSnapModeEnabled": True,
    "scaleRatioLocked": False,
    "displayAllPointDistances": False,
    "displayDistanceOnDrawing": True,
    "displayAllPointCoordinates": False,
    "displayAllPointInfoSelected": True,
    "enableLineBendingOnEdit": False,
    "allowIndependentCurveHandles": False,
    "coordDecimalPlaces": 2,
    "displayRootAxis": False,
}
