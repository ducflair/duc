export * from "./elements";
export * from "./geometryTypes";
export * from "./typeChecks";
export * from "./utility-types";

import { PRUNING_LEVEL } from "../enums";
import { SupportedMeasures } from "../technical/scopes";
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
} from "./geometryTypes";
import { MarkOptional, MaybePromise, ValueOf } from "./utility-types";

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
  files: DucExternalFiles | undefined;

  /** In case it is needed to embed the version control into the file format */
  versionGraph: VersionGraph | undefined;

  /** Actual file id */
  id: string | undefined;
}

export type ExportedDataStateContent = Omit<ExportedDataState, "type" | "version" | "source">;
export type BaseExportedDataState = MarkOptional<ExportedDataStateContent, "elements" | "localState" | "versionGraph">;

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
  | "table"
  | "doc"
  | "pdf";

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
   * Exponent threshold for determining when to change measurement scope (up or down).
   * This value defines a +/- tolerance range around the exponent of the current scope.
   */
  scopeExponentThreshold: number;

  /** The level of pruning to the versions from the version graph. */
  pruningLevel: PruningLevel;
};

export type DucLocalState = {
  /**
   * The current scope of the design
   * mm, cm, m, in, ft, yd, mi, etc...
   */
  scope: Scope;

  scrollX: PrecisionValue;
  scrollY: PrecisionValue;
  zoom: Zoom;

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
  decimalPlaces: number;
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

//// VERSION CONTROL
export type VersionId = string;
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
  versionNumber: number;
  schemaVersion: number;
  isSchemaBoundary: boolean;
  data: Uint8Array;
  sizeBytes: number;
}

export interface Delta extends VersionBase {
  type: "delta";
  versionNumber: number;
  schemaVersion: number;
  baseCheckpointId: VersionId;
  /** Compressed binary data for the delta (zlib). */
  payload: Uint8Array;
  sizeBytes: number;
}

export interface SchemaMigration {
  fromSchemaVersion: number;
  toSchemaVersion: number;
  migrationName: string;
  migrationChecksum?: string;
  appliedAt: number;
  boundaryCheckpointId?: string;
}

export interface VersionChain {
  id: string;
  schemaVersion: number;
  startVersion: number;
  endVersion?: number;
  migration?: SchemaMigration;
  rootCheckpointId?: string;
}

export interface VersionGraphMetadata {
  currentVersion: number;
  currentSchemaVersion: number;
  chainCount: number;
  lastPruned: number;
  totalSize: number;
}

export interface VersionGraph {
  userCheckpointVersionId: VersionId;
  latestVersionId: VersionId;
  chains: VersionChain[];
  checkpoints: Checkpoint[];
  deltas: Delta[];
  metadata: VersionGraphMetadata;
}
