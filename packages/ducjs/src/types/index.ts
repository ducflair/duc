import { ANTI_ALIASING, OBJECT_SNAP_MODE } from "ducjs/duc";
import {
  DucBindableElement,
  DucElement,
  DucElementType,
  DucIframeLikeElement,
  DucLinearElement,
  DucTextElement,
  ElementBackground,
  ElementStroke,
  FileId,
  FontFamilyValues,
  LineHead,
  NonDeleted,
  TextAlign
} from "ducjs/types/elements";
import { GeometricPoint, Percentage, Radian } from "ducjs/types/geometryTypes";
import { MakeBrand, MaybePromise, ValueOf } from "ducjs/types/utility-types";
import type { GRID_DISPLAY_TYPE, GRID_TYPE, IMAGE_MIME_TYPES, MIME_TYPES, SNAP_MARKER_SHAPE, SNAP_MODE, SNAP_OVERRIDE_BEHAVIOR } from "ducjs/utils/constants";
import { LinearElementEditor } from "ducjs/utils/elements/linearElement";
import { SupportedMeasures } from "ducjs/utils/measurements";
import { DesignStandard } from "ducjs/utils/standards";


export type Scope = SupportedMeasures;

export type DataURL = string & { _brand: "DataURL" };

export type ToolType =
  | "selection"
  | "rectangle"
  | "polygon"
  | "ellipse"
  | "arrow"
  | "line"
  | "freedraw"
  | "text"
  | "image"
  | "eraser"
  | "hand"
  | "frame"
  | "magicframe"
  | "embeddable"
  | "ruler"
  | "lasso"
  | "laser"
  | "table";


export type ActiveTool =
  | {
    type: ToolType;
    customType: null;
  }
  | {
    type: "custom";
    customType: string;
  };

export type ElementOrToolType = DucElementType | ToolType | "custom";

export type BinaryFileData = {
  mimeType:
  | ValueOf<typeof IMAGE_MIME_TYPES>
  // future user or unknown file type
  | typeof MIME_TYPES.binary;
  id: FileId;
  dataURL: DataURL;
  /**
   * Epoch timestamp in milliseconds
   */
  created: number;
  /**
   * Indicates when the file was last retrieved from storage to be loaded
   * onto the scene. We use this flag to determine whether to delete unused
   * files from storage.
   *
   * Epoch timestamp in milliseconds.
   */
  lastRetrieved?: number;
  /**
   * indicates the version of the file. This can be used to determine whether
   * the file dataURL has changed e.g. as part of restore due to schema update.
   */
  version?: number;
};

export type BinaryFileMetadata = Omit<BinaryFileData, "dataURL">;

export type BinaryFiles = Record<DucElement["id"], BinaryFileData>;

export type SuggestedBinding =
  | NonDeleted<DucBindableElement>
  | SuggestedPointBinding;

export type SuggestedPointBinding = [
  NonDeleted<DucLinearElement>,
  "start" | "end" | "both",
  NonDeleted<DucBindableElement>
];


export type DucState = Ducfig & {
  viewBackgroundColor: string;
  /**
   * The current scope of the design
   * mm, cm, m, in, ft, yd, mi, etc...
   */
  scope: Scope;
  /** The preferred scope for the design */
  mainScope: Scope;
  /**
   * The Standard for the given technical design
   * https://en.wikipedia.org/wiki/List_of_technical_standard_organizations
   */
  standard: DesignStandard;

  scrollX: PrecisionValue;
  scrollY: PrecisionValue;
  zoom: Zoom;

  name: string | null;
  scrolledOutside: boolean;
  selectedElementIds: Readonly<{ [id: string]: true }>;
  /** top-most selected groups (i.e. does not include nested groups) */
  selectedGroupIds: { [groupId: string]: boolean };
  displayAllPointDistances: boolean;
  displayDistanceOnDrawing: boolean;
  displayAllPointCoordinates: boolean;
  displayAllPointInfoSelected: boolean;
  displayRootAxis: boolean;

  lineBendingMode: boolean;
  coordDecimalPlaces: number;

  /**
   * list of active grids ordered by z index, most on top is first
   * */
  activeGridSettings: GridSettings["id"][] | null;
  activeSnapSettings: SnapSettings["id"] | null;

  /** 
   * grid cell px size 
   * @deprecated use activeGridSettings instead
   * */
  gridSize: number;
  /**
   * @deprecated use activeGridSettings instead
   * */
  gridStep: number;

  debugRendering: boolean;

  editingLinearElement: LinearElementEditor | null;
  /**
   * Exponent threshold for determining when to change measurement scope (up or down).
   * This value defines a +/- tolerance range around the exponent of the current scope.
   * A scope change is triggered if the exponent of *either* the calculated real viewport width
   * or the calculated real viewport height falls outside this tolerance range relative to the current scope's exponent.
   *
   * Example scenario:
   *   appState.scopeExponentThreshold = 2
   *   appState.scope = "mm" // (approximately 1e-3 relative to reference unit (meter))
   *   appState.zoom = dynamic value representing the current zoom level
   *
   * The real viewport size is calculated as: viewportSize * zoom
   *
   * This system ensures measurements remain representable with appropriate precision
   * as users zoom in and out, automatically adjusting between units like mm, μm, nm, etc.
   */
  scopeExponentThreshold: number;
  // element being edited, but not necessarily added to elements array yet
  // (e.g. text element when typing into the input)
  elementHovered: NonDeleted<DucElement> | null;
  elementsPendingErasure: ElementsPendingErasure;
  suggestedBindings: SuggestedBinding[];
  isBindingEnabled: boolean;
};


export interface Ducfig { // User's Config of AppState
  activeTool: {
    /**
     * indicates a previous tool we should revert back to if we deselect the
     * currently active tool. At the moment applies to `eraser` and `hand` tool.
     */
    lastActiveTool: ActiveTool | null;
    locked: boolean;
    fromSelection: boolean;
  } & ActiveTool;

  penMode: boolean;

  // exportBackground: boolean;
  // exportEmbedScene: boolean;
  // exportWithDarkMode: boolean;
  // exportScale: number;

  // gridModeEnabled: boolean;
  // viewModeEnabled: boolean; // Don't Save
  // zenModeEnabled: boolean; // Don't Save
  // showStats: boolean; // Don't Save
  // objectsSnapModeEnabled: boolean;

  showHyperlinkPopup: false | "info" | "editor";

  antiAliasing: AntiAliasing;
  vSync: boolean;
  zoomStep: number;

  
  scaleRatioLocked: boolean;
  displayAllPointDistances: boolean;
  displayDistanceOnDrawing: boolean;
  displayAllPointCoordinates: boolean;
  displayAllPointInfoSelected: boolean;
  displayRootAxis: boolean;
  
  coordDecimalPlaces: number;
  lineBendingMode: boolean;

  currentItemStroke: ElementStroke;
  currentItemBackground: ElementBackground;
  currentItemOpacity: Percentage;
  currentItemFontFamily: FontFamilyValues;
  currentItemFontSize: DucTextElement["fontSize"];
  currentItemTextAlign: TextAlign;
  currentItemStartLineHead: LineHead | null;
  currentItemEndLineHead: LineHead | null;
  currentItemRoundness: DucElement["roundness"];
}


export type AntiAliasing = ValueOf<typeof ANTI_ALIASING>;

export type NormalizedZoomValue = number & { _brand: "normalizedZoom" };

/**
 * A value that accurate/relative to the current scope
 */
export type ScopedValue = number & { _brand: "scopedValue" };

/**
 * A value that represent the raw value of the element on its scope
 */
export type RawValue = number & { _brand: "rawValue" };

/**
 * A value that accurate to the current scope particularly for zoom, it works in reverse for zoom
 */
export type ScopedZoomValue = number & { _brand: "scopedZoomValue" };

/**
 * A value that represent the scaled zoom value relative to a scale bar
 */
export type ScaledZoom = number & { _brand: "scaledZoom" };

export type Zoom = Readonly<{
  /**
   * The raw and normalized value of the zoom
   */
  value: NormalizedZoomValue;
  /**
   * The value of the zoom relative to the current scope
   */
  scoped: ScopedZoomValue;
  /**
   * The value of the zoom adapted to the UI scale bar, for real life measurements
   */
  scaled: ScaledZoom;
}>;

export type PrecisionValue = {
  /**
   * The raw value of the scroll
   */
  value: RawValue;
  /**
   * The value of the scroll relative to the current scope
   */
  scoped: ScopedValue;
};

export type PointerCoords = Readonly<{
  x: number;
  y: number;
}>;

export type Gesture = {
  pointers: Map<number, PointerCoords>;
  lastCenter: { x: number; y: number } | null;
  initialDistance: number | null;
  initialScale: number | null;
};

export declare class GestureEvent extends UIEvent {
  readonly rotation: number;
  readonly scale: number;
}

// libraries
// -----------------------------------------------------------------------------
/** @deprecated legacy: do not use outside of migration paths */
export type LibraryItem_v1 = readonly NonDeleted<DucElement>[];
/** @deprecated legacy: do not use outside of migration paths */
type LibraryItems_v1 = readonly LibraryItem_v1[];

/** v2 library item */
export type LibraryItem = {
  id: string;
  status: "published" | "unpublished";
  elements: readonly NonDeleted<DucElement>[];
  /** timestamp in epoch (ms) */
  created: number;
  name?: string;
  error?: string;
};
export type LibraryItems = readonly LibraryItem[];
export type LibraryItems_anyVersion = LibraryItems | LibraryItems_v1;

export type LibraryItemsSource =
  | ((
    currentLibraryItems: LibraryItems,
  ) => MaybePromise<LibraryItems_anyVersion | Blob>)
  | MaybePromise<LibraryItems_anyVersion | Blob>;
// -----------------------------------------------------------------------------

export type Primitive =
  | number
  | string
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

export type JSONValue = string | number | boolean | null | object;

export type EmbedsValidationStatus = Map<
  DucIframeLikeElement["id"],
  boolean
>;

export type ElementsPendingErasure = Set<DucElement["id"]>;

export type RendererState = {
  deletedElementIds: string[];
};

/** Runtime gridSize value. Null indicates disabled grid. */
export type NullableGridSize =
  | (DucState["gridSize"] & MakeBrand<"NullableGridSize">)
  | null;


export type PendingDucElements = DucElement[];


export type GridDisplayType = ValueOf<typeof GRID_DISPLAY_TYPE>;
export type GridType = ValueOf<typeof GRID_TYPE>;

/**
 * Unified grid styling (works for lines, dots, crosses)
 */
export type GridStyle = {
  color: string;
  opacity: Percentage;
  dashPattern: number[]; // for dashed lines
};

/**
 * Polar grid specific settings
 */
export type PolarGridSettings = {
  /** Number of radial divisions (spokes) */
  radialDivisions: number;
  /** Radial spacing between concentric circles */
  radialSpacing: PrecisionValue;
  /** Whether to show angle labels */
  showLabels: boolean;
};

/**
 * Isometric grid specific settings
 */
export type IsometricGridSettings = {
  /** Left plane angle (typically 30 degrees) */
  leftAngle: Radian;
  /** Right plane angle (typically 30 degrees) */
  rightAngle: Radian;
  /** Active isometric plane */
  activePlane: "top" | "left" | "right";
};

/**
 * Grid settings configuration
 */
export type GridSettings = {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Whether this grid is read-only */
  readonly: boolean;

  /** Grid coordinate system type */
  type: GridType;

  /** How the grid is displayed */
  displayType: GridDisplayType;

  /**
   * Whether the grid spacing is adaptive (changes with zoom level) or fixed.
   */
  isAdaptive: boolean;

  /** Spacing between major grid lines along X-axis */
  xSpacing: PrecisionValue;

  /** Spacing between major grid lines along Y-axis */
  ySpacing: PrecisionValue;

  /** Number of minor divisions between major lines */
  subdivisions: number;

  // === POSITIONING ===

  /** Grid origin point */
  origin: GeometricPoint;

  /** Grid rotation angle */
  rotation: Radian;

  /** Whether grid follows the active UCS */
  followUCS: boolean;

  // === STYLING ===

  /** Major grid line/dot styling */
  majorStyle: GridStyle;

  /** Minor grid line/dot styling */
  minorStyle: GridStyle;

  // === VISIBILITY ===

  /** Show minor subdivisions */
  showMinor: boolean;

  /** Minimum zoom level where grid becomes visible */
  minZoom: number;

  /** Maximum zoom level where grid remains visible */
  maxZoom: number;

  /** Whether to auto-hide when too dense */
  autoHide: boolean;

  // === SPECIALIZED SETTINGS ===

  /** Polar grid settings (when type is POLAR) */
  polarSettings?: PolarGridSettings;

  /** Isometric grid settings (when type is ISOMETRIC) */
  isometricSettings?: IsometricGridSettings;

  // === BEHAVIOR ===

  /** Whether this grid affects snapping */
  enableSnapping: boolean;

  /** Grid render priority */
  zIndex: number;
};



export type ObjectSnapMode = ValueOf<typeof OBJECT_SNAP_MODE>;
export type SnapOverrideBehavior = ValueOf<typeof SNAP_OVERRIDE_BEHAVIOR>;
export type SnapMarkerShape = ValueOf<typeof SNAP_MARKER_SHAPE>;
export type SnapMode = ValueOf<typeof SNAP_MODE>;


/**
 * Temporary snap override settings
 */
export type SnapOverride = {
  key: string; // keyboard key
  behavior: SnapOverrideBehavior;
};

/**
 * Dynamic snap behavior configuration
 */
export type DynamicSnapSettings = {
  enabledDuringDrag: boolean;
  enabledDuringRotation: boolean;
  enabledDuringScale: boolean;
};

/**
 * Polar tracking configuration
 */
export type PolarTrackingSettings = {
  enabled: boolean;
  angles: Radian[];
  /**
   * Additional increment angle for polar tracking
   */
  incrementAngle?: Radian;
  /**
   * Whether to track from last point or from base
   */
  trackFromLastPoint: boolean;
  /**
   * Display polar distance and angle
   */
  showPolarCoordinates: boolean;
};

/**
 * Tracking line display settings
 */
export type TrackingLineStyle = {
  color: string;
  opacity: Percentage;
  dashPattern?: number[];
};

/**
 * Layer-specific snap filters
 */
export type LayerSnapFilters = {
  includeLayers?: string[];
  excludeLayers?: string[];
};

/**
 * Snap marker configuration for each snap mode
 */
export type SnapMarkerStyle = {
  shape: SnapMarkerShape;
  color: string;
};

/**
 * Visual feedback settings for snap markers
 */
export type SnapMarkerSettings = {
  enabled: boolean;
  size: number;
  duration?: number; // for temporary markers (ms)
  styles: Record<ObjectSnapMode, SnapMarkerStyle>;
};

/**
 * Defines the properties of the drawing snap mode.
 */
export type SnapSettings = {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Whether this snap settings is read-only */
  readonly: boolean;

  /**
   * The snap angle for rotated snap grids (e.g., for isometric snapping).
   * In radians. Default is 0.
   */
  twistAngle: Radian;

  /**
   * Snap tolerance in pixels - how close cursor must be to trigger snap
   */
  snapTolerance: number;

  /**
   * Aperture size for object snap detection (in pixels)
   */
  objectSnapAperture: number;

  /**
   * Whether orthogonal mode is enabled (constrains to 0/90 degrees)
   */
  isOrthoModeOn: boolean;

  /**
   * Polar tracking configuration
   */
  polarTracking: PolarTrackingSettings;

  /**
   * Whether object snap (Osnap) is enabled.
   * Osnap allows snapping to geometric points on existing objects.
   */
  isObjectSnapOn: boolean;

  /**
   * Set of active object snap modes
   */
  activeObjectSnapModes: ObjectSnapMode[];

  /**
   * Priority order when multiple snaps are available at cursor position
   */
  snapPriority: ObjectSnapMode[];

  /**
   * Whether to show tracking lines/vectors
   */
  showTrackingLines: boolean;

  /**
   * Tracking line display settings
   */
  trackingLineStyle?: TrackingLineStyle;

  /**
   * Snap behavior during element creation/modification
   */
  dynamicSnap: DynamicSnapSettings;

  /**
   * Temporary snap override settings (e.g., holding shift)
   */
  temporaryOverrides?: SnapOverride[];

  /**
   * Incremental snap distance (for relative movements)
   */
  incrementalDistance?: number;

  /**
   * Magnetic snap strength (0-100)
   */
  magneticStrength?: number;

  /**
   * Layer-specific snap settings
   */
  layerSnapFilters?: LayerSnapFilters;

  /**
   * Element type filters for object snap
   */
  elementTypeFilters?: DucElementType[];

  /**
   * Running object snap vs single pick mode
   */
  snapMode: SnapMode;

  /**
   * Visual feedback settings
   */
  snapMarkers: SnapMarkerSettings;

  /**
   * Construction/guide line snapping
   */
  constructionSnapEnabled: boolean;

  /**
   * Snap to grid intersections only
   */
  snapToGridIntersections?: boolean;
};