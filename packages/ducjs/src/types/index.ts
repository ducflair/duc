export * from "./elements";
export * from "./geometryTypes";
export * from "./typeChecks";
export * from "./utility-types";

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
  /** Revision data blobs keyed by revision id. Separated from metadata for lazy loading. */
  filesData: ExternalFilesData | undefined;

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

export type Scope = SupportedMeasures;


export type ExternalFileRevisionMeta = {
  id: string;
  sizeBytes: number;
  /** Content hash for integrity checks and optional deduplication. */
  checksum?: string;
  /** Original upload filename shown to the user. */
  sourceName?: string;
  mimeType: string;
  /** Optional note describing what changed in this revision. */
  message?: string;
  /** Epoch timestamp in milliseconds when this revision was created. */
  created: number;
  /**
   * Epoch timestamp in milliseconds when this revision was last loaded onto
   * the scene. Used to determine whether to delete unused files from storage.
   */
  lastRetrieved?: number;
};

/**
 * Minimal resolved file data for rendering — just the bytes and their MIME type.
 * Used by renderers and export pipelines that need active revision data.
 */
export type ResolvedFileData = {
  data: Uint8Array;
  mimeType: string;
};

export type DucExternalFile = {
  id: ExternalFileId;
  activeRevisionId: string;
  /** Epoch ms when the logical file was last mutated (revision added or active changed). */
  updated: number;
  /** All revisions of this file, keyed by their id (metadata only, no data blobs). */
  revisions: Record<string, ExternalFileRevisionMeta>;
  version?: number;
};

export type DucExternalFiles = Record<ExternalFileId, DucExternalFile>;

/** Revision data blobs keyed by revision id. */
export type ExternalFilesData = Record<string, Uint8Array>;

/** A fully-loaded external file including its revision data blobs. */
export type ExternalFileLoaded = DucExternalFile & {
  data: Record<string, Uint8Array>;
};

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
