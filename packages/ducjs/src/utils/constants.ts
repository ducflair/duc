import { ELEMENT_CONTENT_PREFERENCE, STROKE_JOIN, STROKE_PLACEMENT, STROKE_PREFERENCE, TEXT_ALIGN, VERTICAL_ALIGN } from "../enums";
import { MAX_ZOOM, MIN_ZOOM, NEUTRAL_SCOPE } from "../technical/scopes";
import { RawValue, ScopedValue } from "../types";
import { DucElement, DucEllipseElement, DucFreeDrawElement, DucTextElement, ElementBackground, ElementStroke, FontFamilyValues } from "../types/elements";
import { Percentage, Radian } from "../types/geometryTypes";


export const COLOR_PALETTE = {
  transparent: "transparent",
  black: "#1e1e1e",
  white: "#ffffff",
  midGray: "#808080",
  night: "#0F0F0F"
} as const;

// distance when creating text before it's considered `autoResize: false`
// we're using higher threshold so that clicks that end up being drags
// don't unintentionally create text elements that are wrapped to a few chars
// (happens a lot with fast clicks with the text tool)
export const TEXT_AUTOWRAP_THRESHOLD = 36; // px
export const DRAGGING_THRESHOLD = 10; // px
export const LINE_CONFIRM_THRESHOLD = 8; // px
export const FIXED_BINDING_DISTANCE = 5; // px
export const ELEMENT_SHIFT_TRANSLATE_AMOUNT = 5;
export const ELEMENT_TRANSLATE_AMOUNT = 1;
export const TEXT_TO_CENTER_SNAP_THRESHOLD = 30;
export const SHIFT_LOCKING_ANGLE = Math.PI / 12;

export const DEFAULT_GRID_SIZE = 1;
export const DEFAULT_GRID_STEP = 20;

export const SVG_NS = "http://www.w3.org/2000/svg";

export const IMAGE_MIME_TYPES = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
  jfif: "image/jfif",
} as const;

export const MIME_TYPES = {
  json: "application/json",
  // excalidraw data
  duc: "application/vnd.duc-cad",
  ducfig: "application/vnd.duc-config",
  excalidrawlib: "application/vnd.excalidrawlib+json",
  // image-encoded excalidraw data
  "excalidraw.svg": "image/svg+xml",
  "excalidraw.png": "image/png",
  binary: "application/octet-stream",
  pdf: "application/pdf",
  zip: "application/zip",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  csv: "text/csv",
  markdown: "text/markdown",
  step: "model/step",
  stp: "application/step",
  stl: "model/stl",
  ...IMAGE_MIME_TYPES,
} as const;

export const EXPORT_IMAGE_TYPES = {
  png: "png",
  svg: "svg",
  clipboard: "clipboard",
} as const;

export const EXPORT_DATA_TYPES = {
  duc: "duc",
  json: "json",
  ducClipboard: "duc/clipboard",
  excalidrawLibrary: "excalidrawlib",
  ducClipboardWithAPI: "duc-api/clipboard",
} as const;

export const SUPPORTED_DATA_TYPES = [
  MIME_TYPES.duc,
  MIME_TYPES.ducfig,
  MIME_TYPES.pdf,
  MIME_TYPES.xls,
  MIME_TYPES.xlsx,
  MIME_TYPES.doc,
  MIME_TYPES.docx,
  MIME_TYPES.json,
  MIME_TYPES.csv,
  MIME_TYPES.markdown,
  MIME_TYPES.step,
  MIME_TYPES.stp,
  MIME_TYPES.stl,
  ...Object.values(IMAGE_MIME_TYPES),
]


export const VERSIONS = {
  excalidraw: 2,
  excalidrawLibrary: 2,
} as const;

export const DEFAULT_ZOOM_STEP = 0.1;
export const MIN_ZOOM_STEP = 0.0000001;
export const MAX_ZOOM_STEP = 5;
export { MAX_ZOOM, MIN_ZOOM };


export const BOUND_TEXT_PADDING = 5;
export const ARROW_LABEL_WIDTH_FRACTION = 0.7;
export const ARROW_LABEL_FONT_SIZE_TO_MIN_WIDTH_RATIO = 11;

export const NO_PEER_POINTS: number[] = []; // Empty array for points with no connections

export const ELEMENT_READY_TO_ERASE_OPACITY = 0.2;
export const HIDE_FRAME_NAME_ZOOM_THRESHOLD = 0.18;

// Radius represented as 25% of element's largest side (width/height).
// Used for LEGACY and PROPORTIONAL_RADIUS algorithms, or when the element is
// below the cutoff size.
export const DEFAULT_PROPORTIONAL_RADIUS = 0.25;
// Fixed radius for the ADAPTIVE_RADIUS algorithm. In pixels.
export const DEFAULT_ADAPTIVE_RADIUS = 32;

/**
 * Font family identifiers. Values are the actual CSS font-family names
 * so they can be passed directly to Google Fonts / Canvas2D.
 *
 * For backward compatibility with old files that stored numeric IDs,
 * use `LEGACY_FONT_ID_TO_NAME` to resolve them.
 */
export const FONT_FAMILY = {
  Virgil: "Virgil",
  Helvetica: "Helvetica",
  Cascadia: "Cascadia",
  Excalifont: "Excalifont",
  Nunito: "Nunito",
  "Lilita One": "Lilita One",
  "Comic Shanns": "Comic Shanns",
  "Liberation Sans": "Liberation Sans",
  "Roboto Mono": "Roboto Mono",
} as const;

/**
 * Reverse mapping from legacy numeric font IDs to font family names.
 * Used when loading old .duc files that encoded fontFamily as a number.
 */
export const LEGACY_FONT_ID_TO_NAME: Record<number, string> = {
  1: "Virgil",
  2: "Helvetica",
  3: "Cascadia",
  5: "Excalifont",
  6: "Nunito",
  7: "Lilita One",
  8: "Comic Shanns",
  9: "Liberation Sans",
  10: "Roboto Mono",
};

export const WINDOWS_EMOJI_FALLBACK_FONT = "Segoe UI Emoji";

export const DEFAULT_VERSION = "{version}";
export const MIN_FONT_SIZE = 1;
export const DEFAULT_FONT_SIZE = 20;
export const DEFAULT_FONT_FAMILY: FontFamilyValues = FONT_FAMILY["Roboto Mono"] as FontFamilyValues;
export const DEFAULT_TEXT_ALIGN: DucTextElement["textAlign"] = TEXT_ALIGN.LEFT;
export const DEFAULT_VERTICAL_ALIGN: DucTextElement["verticalAlign"] = VERTICAL_ALIGN.TOP;
export const DEFAULT_LINE_HEIGHT = 1;

export const DEFAULT_POLYGON_SIDES = 5;


export const LIBRARY_DISABLED_TYPES = new Set([
  "iframe",
  "embeddable",
  "image",
] as const);

/**
 * not translated as this is used only in public, stateless API as default value
 * where filename is optional and we can't retrieve name from app state
 */
export const DEFAULT_FILENAME = "Untitled";

export const MIN_WIDTH_OR_HEIGHT = 1;

export const EASINGS = [
  'linear',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'easeInQuart',
  'easeOutQuart',
  'easeInOutQuart',
  'easeInQuint',
  'easeOutQuint',
  'easeInOutQuint',
  'easeInSine',
  'easeOutSine',
  'easeInOutSine',
  'easeInExpo',
  'easeOutExpo',
  'easeInOutExpo',
] as const;
export type FreeDrawEasingNames = typeof EASINGS[number];

export const FREEDRAW_EASINGS: Record<FreeDrawEasingNames, (t: number) => number> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) =>
    t <= 0
      ? 0
      : t >= 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,
};



export const DEFAULT_FRAME_STYLE: {
  stroke: ElementStroke[];
  background: ElementBackground[];
  roundness: DucElement["roundness"];
  radius: number;
  nameOffsetY: number;
  nameColorLightTheme: string;
  nameColorDarkTheme: string;
  nameFontSize: number;
  nameLineHeight: number;
} = ({
  stroke: [{
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.SOLID,
      src: COLOR_PALETTE.midGray,
      visible: true,
      opacity: 1 as Percentage,
    },
    width: { value: 2 as RawValue, scoped: 2 as ScopedValue },
    style: {
      preference: STROKE_PREFERENCE.SOLID,
      join: STROKE_JOIN.MITER,
    },
    placement: STROKE_PLACEMENT.INSIDE,
  }],
  background: [{
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.SOLID,
      src: COLOR_PALETTE.midGray,
      visible: false,
      opacity: 0.1 as Percentage,
    },
  }],
  roundness: { value: 0 as RawValue, scoped: 0 as ScopedValue },
  radius: 8,
  nameOffsetY: 3,
  nameColorLightTheme: "#80808080",
  nameColorDarkTheme: "#80808080",
  nameFontSize: 14,
  nameLineHeight: 1.25,
});

export const DEFAULT_ELEMENT_PROPS: {
  isVisible: DucElement["isVisible"];
  isPlot: DucElement["isPlot"];
  stroke: ElementStroke;
  background: ElementBackground;
  roundness: DucElement["roundness"];
  opacity: DucElement["opacity"];
  locked: DucElement["locked"];
  scope: DucElement["scope"];
  index: DucElement["index"];
  width: DucElement["width"];
  height: DucElement["height"];
  angle: DucElement["angle"];
  groupIds: DucElement["groupIds"];
  boundElements: DucElement["boundElements"];
  link: DucElement["link"];
  frameId: DucElement["frameId"];
  description: DucElement["description"];
} = {
  stroke: {
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.SOLID,
      src: COLOR_PALETTE.midGray,
      visible: true,
      opacity: 1 as Percentage,
    },
    width: { value: 2 as RawValue, scoped: 2 as ScopedValue },
    style: {
      preference: STROKE_PREFERENCE.SOLID,
      join: STROKE_JOIN.MITER,
    },
    placement: STROKE_PLACEMENT.INSIDE,
  },
  background: {
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.SOLID,
      src: COLOR_PALETTE.midGray,
      visible: true,
      opacity: 0.1 as Percentage,
    },
  },
  isVisible: true,
  isPlot: true,
  roundness: { value: 0 as RawValue, scoped: 0 as ScopedValue },
  opacity: 1 as Percentage,
  locked: false,
  scope: NEUTRAL_SCOPE,
  index: null,
  width: { value: 0 as RawValue, scoped: 0 as ScopedValue },
  height: { value: 0 as RawValue, scoped: 0 as ScopedValue },
  angle: 0 as Radian,
  groupIds: [],
  frameId: null,
  boundElements: null,
  link: null,
  description: null,
};

export const DEFAULT_IFRAME_LIKE_NO_STYLE: {
  stroke: ElementStroke[];
  background: ElementBackground[];
} = ({
  stroke: [{
    ...DEFAULT_ELEMENT_PROPS.stroke,
    content: {
      ...DEFAULT_ELEMENT_PROPS.stroke.content,
      visible: false,
    },
  }],
  background: [{
    ...DEFAULT_ELEMENT_PROPS.background,
    content: {
      ...DEFAULT_ELEMENT_PROPS.background.content,
      visible: false,
    },
  }],
})

export const DEFAULT_LINEAR_ELEMENT_STROKE: ElementStroke = {
  ...DEFAULT_ELEMENT_PROPS.stroke,
  placement: STROKE_PLACEMENT.CENTER,
};

export const DEFAULT_FREEDRAW_ELEMENT: {
  size: RawValue;
  thinning: DucFreeDrawElement["thinning"];
  smoothing: DucFreeDrawElement["smoothing"];
  streamline: DucFreeDrawElement["streamline"];
  easing: DucFreeDrawElement["easing"];
} = {
  size: 2 as RawValue,
  thinning: 0.6 as Percentage,
  streamline: 0.5 as Percentage,
  smoothing: 0.5 as Percentage,
  easing: FREEDRAW_EASINGS.easeOutSine,
}

export const DEFAULT_ELLIPSE_ELEMENT: {
  ratio: DucEllipseElement["ratio"];
  startAngle: DucEllipseElement["startAngle"];
  endAngle: DucEllipseElement["endAngle"];
  showAuxCrosshair: DucEllipseElement["showAuxCrosshair"];
} = {
  ratio: 1 as Percentage,
  startAngle: 0 as Radian,
  endAngle: Math.PI * 2 as Radian,
  showAuxCrosshair: false,
}


export const PREDEFINED_HATCH_PATTERNS = {
  // Solid Fill
  SOLID: "SOLID",

  // ANSI Patterns
  ANSI31: "ANSI31", // General crosshatch
  ANSI32: "ANSI32", // Steel
  ANSI33: "ANSI33", // Bronze, brass, copper
  ANSI34: "ANSI34", // Plastic, rubber
  ANSI35: "ANSI35", // Thermal insulation
  ANSI36: "ANSI36", // Steel, cast iron
  ANSI37: "ANSI37", // Aluminum
  ANSI38: "ANSI38", // Lead, zinc, magnesium

  // Architectural Patterns
  AR_B816: "AR-B816",   // Brick
  AR_B816C: "AR-B816C", // Brick common
  AR_CONC: "AR-CONC",   // Concrete
  AR_HBONE: "AR-HBONE", // Herringbone
  AR_SAND: "AR-SAND",   // Sand
  AR_RSHKE: "AR-RSHKE", // Roof shingles

  // ISO Patterns
  ACAD_ISO02W100: "ACAD_ISO02W100", // Insulation
  ACAD_ISO03W100: "ACAD_ISO03W100", // General crosshatch
  ACAD_ISO04W100: "ACAD_ISO04W100", // Concrete
  ACAD_ISO06W100: "ACAD_ISO06W100", // Cast iron
  ACAD_ISO08W100: "ACAD_ISO08W100", // Copper/brass
  ACAD_ISO11W100: "ACAD_ISO11W100", // Steel
  ACAD_ISO13W100: "ACAD_ISO13W100", // Plastic

  // Common Patterns
  BOX: "BOX",
  BRICK: "BRICK",
  CROSS: "CROSS",
  DASH: "DASH",
  DOTS: "DOTS",
  EARTH: "EARTH",
  GRASS: "GRASS",
  GRAVEL: "GRAVEL",
  HEX: "HEX",
  HONEY: "HONEY",
  INSUL: "INSUL",
  LINE: "LINE",
  NET: "NET",
  SQUARE: "SQUARE",
  STEEL: "STEEL",
  TRIANG: "TRIANG",
  ZIGZAG: "ZIGZAG",
} as const;


// /**
//  * Default hatch styles
//  */
// export const DEFAULT_HATCH_STYLE: DucHatchStyle = {
//   id: "default-hatch",
//   name: "Default Hatch",
//   background: {
//     content: {
//       preference: "color",
//       src: "#000000",
//       visible: true,
//       opacity: 1,
//     }
//   },
//   stroke: {
//     content: {
//       preference: "color", 
//       src: "#000000",
//       visible: true,
//       opacity: 1,
//     },
//     width: { value: 1, scoped: 1 },
//     style: {
//       preference: "solid",
//       scale: 1,
//     },
//     placement: "center",
//   },
//   hatchStyle: HATCH_STYLE.NORMAL,
//   pattern: {
//     name: "ANSI31",
//     scale: 1,
//     angle: 0,
//     origin: { x: 0, y: 0 },
//     double: false,
//   },
// };