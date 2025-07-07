import { GridSettings, RawValue, ScopedValue, SnapSettings } from "ducjs/legacy/v1/types";
import { DucElement, DucEllipseElement, DucFreeDrawElement, DucTextElement, ElementBackground, ElementStroke, FontFamilyValues } from "ducjs/legacy/v1/types/elements";
import { Percentage, Radian } from "ducjs/legacy/v1/types/geometryTypes";
import { MAX_ZOOM, MIN_ZOOM, NEUTRAL_SCOPE } from "ducjs/legacy/v1/utils/scopes";


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
  // binary
  binary: "application/octet-stream",
  // image
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
  excalidrawClipboard: "excalidraw/clipboard",
  excalidrawLibrary: "excalidrawlib",
  excalidrawClipboardWithAPI: "excalidraw-api/clipboard",
} as const;


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

export const VERTICAL_ALIGN = {
  TOP: 10,
  MIDDLE: 11,
  BOTTOM: 12,
} as const;

export const TEXT_ALIGN = {
  LEFT: 10,
  CENTER: 11,
  RIGHT: 12,
} as const;

// FIXME: Eventually deprecate this
export const ROUGHNESS = {
  architect: 0,
  artist: 1,
  cartoonist: 2,
} as const;

export const STROKE_PLACEMENT = {
  outside: 12,
  center: 11,
  inside: 10,
} as const;

// FIXME: Eventually deprecate this
export const STROKE_WIDTH = {
  thin: 1,
  bold: 2,
  extraBold: 4,
} as const;

export const ELEMENT_CONTENT_PREFERENCE = {
  hachure: 10,
  "cross-hatch": 11,
  solid: 12,
  zigzag: 13,
  fill: 14,
  fit: 15,
  tile: 16,
  stretch: 17,
  hatch: 18,
} as const;

export const STROKE_PREFERENCE = {
  solid: 10,
  dashed: 11,
  dotted: 12,
  custom: 13,
} as const;

export const STROKE_SIDE_PREFERENCE = {
  top: 10,
  bottom: 11,
  left: 12,
  right: 13,
  custom: 14,
  all: 15
} as const;


export const STROKE_CAP = {
  butt: 10,
  round: 11,
  square: 12,
} as const;

export const STROKE_JOIN = {
  miter: 10,
  round: 11,
  bevel: 12,
} as const;


export const LINE_HEAD = {
  arrow: 10,
  bar: 11,
  circle: 12,
  circle_outlined: 13,
  triangle: 14,
  triangle_outlined: 15,
  diamond: 16,
  diamond_outlined: 17,
  cross: 18,
  open_arrow: 19,
  reversed_arrow: 20,
  reversed_triangle: 21,
  reversed_triangle_outlined: 22,
  cone: 23,
  half_cone: 24
} as const;

export const BEZIER_MIRRORING = {
  NONE: 10,
  ANGLE: 11,
  ANGLE_LENGTH: 12,
} as const;

export const HANDLE_TYPE = {
  HANDLE_IN: 10,
  HANDLE_OUT: 11,
} as const;

export const ANTI_ALIASING = {
  NONE: 10,
  ANALYTIC: 11,
  MSAA_8: 8,
  MSAA_16: 16,
} as const;

export const YOUTUBE_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export const BLENDING = {
  MULTIPLY: 11,  // For shadows/print-safe darkening (e.g., material overlaps)
  SCREEN: 12,  // Lighting effects, translucent materials
  OVERLAY: 13,  // Enhancing contrast in hatches/textures
  DARKEN: 14,  // Highlight deprecated components or markups
  LIGHTEN: 15,  // Annotations without obscuring geometry
  DIFFERENCE: 16,  // Detect misalignments between layers
  EXCLUSION: 17   // Subtler version of Difference for CAD comparisons
} as const;


export const ELEMENT_SUBSET = {
  AUX: 14,
  COTA: 15,
} as const;

export const IMAGE_STATUS = {
  pending: "pending",
  saved: "saved",
  error: "error",
} as const;

export const ENV = {
  TEST: "test",
  DEVELOPMENT: "development",
};

export const CLASSES = {
  SHAPE_ACTIONS_MENU: "App-menu__left",
  ZOOM_ACTIONS: "zoom-actions",
};

/**
 * // TODO: shouldn't be really `const`, likely neither have integers as values, due to value for the custom fonts, which should likely be some hash.
 *
 * Let's think this through and consider:
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/generic-family
 * - https://drafts.csswg.org/css-fonts-4/#font-family-prop
 * - https://learn.microsoft.com/en-us/typography/opentype/spec/ibmfc
 */
export const FONT_FAMILY = {
  Virgil: 1,
  Helvetica: 2,
  Cascadia: 3,
  // leave 4 unused as it was historically used for Assistant (which we don't use anymore) or custom font (Obsidian)
  Excalifont: 5,
  Nunito: 6,
  "Lilita One": 7,
  "Comic Shanns": 8,
  "Liberation Sans": 9,
  "Roboto Mono": 10,
};

export const THEME = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export const WINDOWS_EMOJI_FALLBACK_FONT = "Segoe UI Emoji";

export const DEFAULT_VERSION = "{version}";
export const MIN_FONT_SIZE = 1;
export const DEFAULT_FONT_SIZE = 20;
export const DEFAULT_FONT_FAMILY: FontFamilyValues = FONT_FAMILY["Roboto Mono"];
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
      preference: ELEMENT_CONTENT_PREFERENCE.solid,
      src: COLOR_PALETTE.midGray,
      visible: true,
      opacity: 1 as Percentage,
    },
    width: { value: 2 as RawValue, scoped: 2 as ScopedValue },
    style: {
      preference: STROKE_PREFERENCE.solid,
      join: STROKE_JOIN.miter,
    },
    placement: STROKE_PLACEMENT.inside,
  }],
  background: [{
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.solid,
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
  subset: DucElement["subset"];
  noPlot: DucElement["noPlot"];
  description: DucElement["description"];
} = {
  stroke: {
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.solid,
      src: COLOR_PALETTE.midGray,
      visible: true,
      opacity: 1 as Percentage,
    },
    width: { value: 2 as RawValue, scoped: 2 as ScopedValue },
    style: {
      preference: STROKE_PREFERENCE.solid,
      join: STROKE_JOIN.miter,
    },
    placement: STROKE_PLACEMENT.inside,
  },
  background: {
    content: {
      preference: ELEMENT_CONTENT_PREFERENCE.solid,
      src: COLOR_PALETTE.midGray,
      visible: true,
      opacity: 0.1 as Percentage,
    },
  },
  isVisible: true,
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
  subset: null,
  noPlot: false,
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
  placement: STROKE_PLACEMENT.center,
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




/**
 * Grid display types
 */
export const GRID_DISPLAY_TYPE = {
  LINES: 10,
  DOTS: 11,
  CROSSES: 12,
  ADAPTIVE: 13, // Changes based on zoom level
} as const;

/**
 * Grid coordinate system types
 */
export const GRID_TYPE = {
  RECTANGULAR: 10,
  ISOMETRIC: 11,
  POLAR: 12,
  TRIANGULAR: 13,
  CUSTOM: 14,
} as const;


/**
 * Default grid configurations
 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  id: "default-grid",
  name: "Default Grid",
  readonly: true,
  isAdaptive: true,
  type: GRID_TYPE.RECTANGULAR,
  displayType: GRID_DISPLAY_TYPE.LINES,

  xSpacing: { value: 10 as RawValue, scoped: 10 as ScopedValue },
  ySpacing: { value: 10 as RawValue, scoped: 10 as ScopedValue },
  subdivisions: 5,

  origin: { x: 0, y: 0 },
  rotation: 0 as Radian,
  followUCS: true,

  majorStyle: {
    color: "#CCCCCC",
    opacity: 0.5 as Percentage,
    dashPattern: [1, 1],
  },
  minorStyle: {
    color: "#EEEEEE",
    opacity: 0.3 as Percentage,
    dashPattern: [0.5, 0.5],
  },

  showMinor: true,
  minZoom: 0.1,
  maxZoom: 100,
  autoHide: true,

  enableSnapping: true,
  zIndex: 0,
};

/**
 * Predefined grid configurations
 */
export const PREDEFINED_GRIDS = {
  ARCHITECTURAL_IMPERIAL: "arch-imperial",
  ARCHITECTURAL_METRIC: "arch-metric",
  ENGINEERING_IMPERIAL: "eng-imperial",
  ENGINEERING_METRIC: "eng-metric",
  ISOMETRIC_30: "iso-30",
  POLAR_DEGREES: "polar-deg",
  FINE_DETAIL: "fine-detail",
} as const;



export const OBJECT_SNAP_MODE = {
  ENDPOINT: 10,
  MIDPOINT: 11,
  CENTER: 12,
  QUADRANT: 13,
  INTERSECTION: 14,
  EXTENSION: 15,
  PERPENDICULAR: 16,
  TANGENT: 17,
  NEAREST: 18,
  NODE: 19, // For points
  INSERT: 20, // For block insertion points
  PARALLEL: 21,
  APPARENT: 22,
  FROM: 23, // Reference point snap
  POINT_FILTER: 24, // X,Y,Z filtering
  TEMPORARY: 25, // Temporary tracking points
  BETWEEN_TWO_POINTS: 26,
  POINT_ON_CURVE: 27,
  GEOMETRIC: 28, // vs bounding box center
} as const;

/**
 * Snap behavior modes
 */
export const SNAP_MODE = {
  RUNNING: 10,
  SINGLE: 11,
} as const;
/**
 * Snap override behaviors
 */
export const SNAP_OVERRIDE_BEHAVIOR = {
  DISABLE: 10,
  FORCE_GRID: 11,
  FORCE_OBJECT: 12,
} as const;

/**
 * Snap marker shapes
 */
export const SNAP_MARKER_SHAPE = {
  SQUARE: 10,
  CIRCLE: 11,
  TRIANGLE: 12,
  X: 13,
} as const;




/**
 * Default snap settings configuration
 */
export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  id: "default-snap-settings",
  name: "Default Snap Settings",
  readonly: true,
  twistAngle: 0 as Radian,
  snapTolerance: 10,
  objectSnapAperture: 8,
  isOrthoModeOn: false,
  polarTracking: {
    enabled: false,
    angles: [
      0 as Radian,
      Math.PI / 4 as Radian,
      Math.PI / 2 as Radian,
      3 * Math.PI / 4 as Radian,
      Math.PI as Radian,
      5 * Math.PI / 4 as Radian,
      3 * Math.PI / 2 as Radian,
      7 * Math.PI / 4 as Radian
    ],
    trackFromLastPoint: true,
    showPolarCoordinates: true,
  },
  isObjectSnapOn: true,
  activeObjectSnapModes: [
    OBJECT_SNAP_MODE.ENDPOINT,
    OBJECT_SNAP_MODE.MIDPOINT,
    OBJECT_SNAP_MODE.CENTER,
    OBJECT_SNAP_MODE.INTERSECTION,
  ],
  snapPriority: [
    OBJECT_SNAP_MODE.ENDPOINT,
    OBJECT_SNAP_MODE.INTERSECTION,
    OBJECT_SNAP_MODE.MIDPOINT,
    OBJECT_SNAP_MODE.CENTER,
    OBJECT_SNAP_MODE.QUADRANT,
    OBJECT_SNAP_MODE.TANGENT,
    OBJECT_SNAP_MODE.PERPENDICULAR,
    OBJECT_SNAP_MODE.NEAREST,
  ],
  showTrackingLines: true,
  trackingLineStyle: {
    color: "#00FF00",
    opacity: 0.7 as Percentage,
    dashPattern: [2, 2],
  },
  dynamicSnap: {
    enabledDuringDrag: true,
    enabledDuringRotation: true,
    enabledDuringScale: true,
  },
  temporaryOverrides: [
    { key: "Shift", behavior: SNAP_OVERRIDE_BEHAVIOR.DISABLE },
    { key: "F9", behavior: SNAP_OVERRIDE_BEHAVIOR.FORCE_GRID },
  ],
  magneticStrength: 50,
  snapMode: SNAP_MODE.RUNNING,
  snapMarkers: {
    enabled: true,
    size: 8,
    duration: 2000,
    styles: {
      [OBJECT_SNAP_MODE.ENDPOINT]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#FF0000" },
      [OBJECT_SNAP_MODE.MIDPOINT]: { shape: SNAP_MARKER_SHAPE.TRIANGLE, color: "#00FF00" },
      [OBJECT_SNAP_MODE.INTERSECTION]: { shape: SNAP_MARKER_SHAPE.X, color: "#FF00FF" },
      [OBJECT_SNAP_MODE.EXTENSION]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#FFA500" },
      [OBJECT_SNAP_MODE.PERPENDICULAR]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#800080" },
      [OBJECT_SNAP_MODE.TANGENT]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#008080" },
      [OBJECT_SNAP_MODE.NEAREST]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#808080" },
      [OBJECT_SNAP_MODE.NODE]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#FFB6C1" },
      [OBJECT_SNAP_MODE.INSERT]: { shape: SNAP_MARKER_SHAPE.TRIANGLE, color: "#90EE90" },
      [OBJECT_SNAP_MODE.PARALLEL]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#F0E68C" },
      [OBJECT_SNAP_MODE.APPARENT]: { shape: SNAP_MARKER_SHAPE.X, color: "#DDA0DD" },
      [OBJECT_SNAP_MODE.FROM]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#20B2AA" },
      [OBJECT_SNAP_MODE.POINT_FILTER]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#F4A460" },
      [OBJECT_SNAP_MODE.TEMPORARY]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#32CD32" },
      [OBJECT_SNAP_MODE.BETWEEN_TWO_POINTS]: { shape: SNAP_MARKER_SHAPE.TRIANGLE, color: "#FF6347" },
      [OBJECT_SNAP_MODE.POINT_ON_CURVE]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#4169E1" },
      [OBJECT_SNAP_MODE.GEOMETRIC]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#DC143C" },
      [OBJECT_SNAP_MODE.CENTER]: { shape: SNAP_MARKER_SHAPE.CIRCLE, color: "#0000FF" },
      [OBJECT_SNAP_MODE.QUADRANT]: { shape: SNAP_MARKER_SHAPE.SQUARE, color: "#FFFF00" },
    },
  },
  constructionSnapEnabled: true,
  snapToGridIntersections: false,
};