export * from "./elements";
export * from "./geometryTypes";
export * from "./utility-types";
export * from "./typeChecks";

import { OBJECT_SNAP_MODE, PRUNING_LEVEL } from "../flatbuffers/duc";
import { SupportedMeasures } from "../technical/scopes";
import { Standard } from "../technical/standards";
import {
  DucBindableElement,
  DucBlock,
  DucBlockCollection,
  DucBlockInstance,
  DucElement,
  DucElementType,
  DucGroup,
  DucIframeLikeElement,
  DucLayer,
  DucLinearElement,
  DucPoint,
  DucRegion,
  DucTextElement,
  ElementBackground,
  ElementStroke,
  ExternalFileId,
  FontFamilyValues,
  LineHead,
  NonDeleted,
  TextAlign,
} from "./elements";
import {
  GeometricPoint,
  Percentage,
  Radian,
  ScaleFactor,
} from "./geometryTypes";
import { MakeBrand, MaybePromise, ValueOf } from "./utility-types";
import type {
  GRID_DISPLAY_TYPE,
  GRID_TYPE,
  IMAGE_MIME_TYPES,
  MIME_TYPES,
  SUPPORTED_DATA_TYPES,
  SNAP_MARKER_SHAPE,
  SNAP_MODE,
  SNAP_OVERRIDE_BEHAVIOR,
} from "../utils/constants";

/**
 * Root data structure for the stored data state
 */
export interface ExportedDataState {
  type: string;
  version: string;

  source: string;
  thumbnail: Uint8Array | undefined;
  dictionary: Dictionary | undefined;

  elements: readonly DucElement[];

  /** The user's current session state for a specific project */
  localState: DucLocalState;
  /** Project-wide settings that are saved with the document and shared by all users */
  globalState: DucGlobalState;

  blocks: readonly DucBlock[];
  blockInstances: readonly DucBlockInstance[];
  blockCollections: readonly DucBlockCollection[];
  groups: readonly DucGroup[];
  regions: readonly DucRegion[];
  layers: readonly DucLayer[];
  standards: readonly Standard[];

  files: DucExternalFiles | undefined;

  /** In case it is needed to embed the version control into the file format */
  versionGraph: VersionGraph | undefined;

  /** Actual file id */
  id: string | undefined;
}

export type ExportedDataStateContent = Omit<ExportedDataState, "type" | "version" | "source">;

/**
 * A version of the data state where all fields are optional.
 * This is useful for importing data where some fields might be missing.
 */
export type ImportedDataState = Partial<ExportedDataState>;

export type Identifier = {
  /** Unique identifier for this standard */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the standard */
  description?: string;
};

export type Dictionary = {
  [key: string]: string;
};

export type DucView = {
  scrollX: PrecisionValue;
  scrollY: PrecisionValue;
  zoom: Zoom;
  twistAngle: Radian;

  /** The specific spot on that plane that you want to be in the middle of your screen when this view is active */
  centerPoint: DucPoint;

  scope: Scope;
};

/**
 * Defines a 2D User Coordinate System (UCS), a movable coordinate system
 * that establishes a local origin and rotation for drawing. All coordinates
 * within this UCS are relative to its origin and angle.
 */
export type DucUcs = {
  /**
   * The origin point of the UCS in World Coordinate System (WCS) coordinates.
   * This defines the (0,0) point of the new local system.
   */
  origin: GeometricPoint;

  /**
   * The rotation angle of the UCS's X-axis, measured in radians,
   * relative to the World Coordinate System's X-axis.
   * An angle of 0 means the UCS is aligned with the WCS.
   */
  angle: Radian;
};

export type Scope = SupportedMeasures;


export type DucExternalFileData = {
  mimeType: string;
  id: ExternalFileId;
  data: Uint8Array;
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
   * the file data has changed e.g. as part of restore due to schema update.
   */
  version?: number;
};

export type DucExternalFileMetadata = Omit<DucExternalFileData, "data">;

export type DucExternalFiles = Record<DucElement["id"], DucExternalFileData>;

export type SuggestedBinding =
  | NonDeleted<DucBindableElement>
  | SuggestedPointBinding;

export type SuggestedPointBinding = [
  NonDeleted<DucLinearElement>,
  "start" | "end" | "both",
  NonDeleted<DucBindableElement>
];

export type ToolType =
  | "selection"
  | "rectangle"
  | "polygon"
  | "ellipse"
  | "line"
  | "freedraw"
  | "text"
  | "image"
  | "eraser"
  | "hand"
  | "frame"
  | "plot"
  | "embeddable"
  | "ruler"
  | "lasso"
  | "laser"
  | "table";

export type ElementOrToolType = DucElementType | ToolType | "custom";

/**
 * Defines the global, persistent settings for the drawing. These are fundamental
 * properties of the document itself and are independent of any active Standard.
 * They travel with the file and are consistent for all users.
 */
export type DucGlobalState = {
  /**
   * The name of the drawing
   */
  name: string | null;
  /**
   * The background color of the drawing
   */
  viewBackgroundColor: string;
  /**
   * The master unit system for the entire drawing, used for block/file insertion scaling.
   */
  mainScope: Scope;

  /**
   * The global linetype scale for the entire drawing.
   */
  dashSpacingScale: ScaleFactor;

  /**
   * Governs if linetype scale is affected by paper space viewport scale.
   */
  isDashSpacingAffectedByViewportScale: boolean;

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

  /**
   * A rule for whether newly created dimensions should be associative by default.
   */
  dimensionsAssociativeByDefault: boolean;

  /**
   * A fundamental choice for the drawing's scaling architecture.
   */
  useAnnotativeScaling: boolean;
  /**
   * Default display precision for various unit types. The user can override
   * this temporarily in their session state (DucState).
   */
  displayPrecision: {
    linear: number;
    angular: number;
  };

  /** The level of pruning to the versions from the version graph. */
  pruningLevel: PruningLevel;
};

export type DucLocalState = {
  /**
   * The current scope of the design
   * mm, cm, m, in, ft, yd, mi, etc...
   */
  scope: Scope;
  /** The active standard for the design */
  activeStandardId: Standard["id"];

  scrollX: PrecisionValue;
  scrollY: PrecisionValue;
  zoom: Zoom;

  /**
   * list of active grids ordered by z index, most on top is first
   * */
  activeGridSettings: Identifier["id"][] | null;
  activeSnapSettings: Identifier["id"] | null;

  isBindingEnabled: boolean;

  // Current item is usually a quick access state to apply as default to certain things when drawing
  currentItemStroke: ElementStroke;
  currentItemBackground: ElementBackground;
  currentItemOpacity: Percentage;
  currentItemFontFamily: FontFamilyValues;
  currentItemFontSize: DucTextElement["fontSize"];
  currentItemTextAlign: TextAlign;
  currentItemStartLineHead: LineHead | null;
  currentItemEndLineHead: LineHead | null;
  currentItemRoundness: DucElement["roundness"];

  /**
   * grid cell px size
   * @deprecated use activeGridSettings instead
   * */
  gridSize: number;
  /**
   * @deprecated use activeGridSettings instead
   * */
  gridStep: number;

  /**
   * Pen mode is enabled, creates a better experience for drawing with a pen
   */
  penMode: boolean;
  /**
   * In view mode the user is not allowed to edit the canvas.
   */
  viewModeEnabled: boolean;
  /**
   * Object snapping on the environment is enabled
   */
  objectsSnapModeEnabled: boolean;
  /**
   * Available grids are visible
   */
  gridModeEnabled: boolean;
  /**
   * Wether to disable the fill on all shapes
   */
  outlineModeEnabled: boolean;
  /** When enabled, the version graph is not updated automatically. The user needs to manually update the graph for new versions to be saved in version control. */
  manualSaveMode: boolean;
};

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
    currentLibraryItems: LibraryItems
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

export type EmbedsValidationStatus = Map<DucIframeLikeElement["id"], boolean>;

export type ElementsPendingErasure = Set<DucElement["id"]>;

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
};

/**
 * Grid settings configuration
 */
export type GridSettings = {
  /** Grid coordinate system type */
  type: GridType;

  /** Whether this grid is read-only */
  readonly: boolean;

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

  /** Grid origin point */
  origin: GeometricPoint;

  /** Grid rotation angle */
  rotation: Radian;

  /** Whether grid follows the active UCS */
  followUCS: boolean;

  /** Major grid line/dot styling */
  majorStyle: GridStyle;

  /** Minor grid line/dot styling */
  minorStyle: GridStyle;

  /** Show minor subdivisions */
  showMinor: boolean;

  /** Minimum zoom level where grid becomes visible */
  minZoom: number;

  /** Maximum zoom level where grid remains visible */
  maxZoom: number;

  /** Whether to auto-hide when too dense */
  autoHide: boolean;

  /** Polar grid settings (when type is POLAR) */
  polarSettings?: PolarGridSettings;

  /** Isometric grid settings (when type is ISOMETRIC) */
  isometricSettings?: IsometricGridSettings;

  /** Whether this grid affects snapping */
  enableSnapping: boolean;
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

/** Runtime gridSize value. Null indicates disabled grid. */
export type NullableGridSize =
  | (DucLocalState["gridSize"] & MakeBrand<"NullableGridSize">)
  | null;

//// VERSION CONTROL
export type VersionId = string;
/** JSON Patch RFC6902 */
export type JSONPatch = Array<{ op: string; path: string; from?: string; value?: any }>;
export type PruningLevel = ValueOf<typeof PRUNING_LEVEL>;

export interface VersionBase {
  id: VersionId;
  parentId: VersionId | null;
  timestamp: number;
  description?: string;
  isManualSave: boolean;
  userId?: string;
}

export interface Checkpoint extends VersionBase {
  type: "checkpoint";
  data: Uint8Array;
  sizeBytes: number;
}

export interface Delta extends VersionBase {
  type: "delta";
  patch: JSONPatch;
}

export interface VersionGraph {
  userCheckpointVersionId: VersionId;
  latestVersionId: VersionId;
  checkpoints: Checkpoint[];
  deltas: Delta[];
  metadata: {
    lastPruned: number;
    totalSize: number;
  };
}
