import {
  ChartType,
  DucBindableElement,
  DucElement,
  DucElementType,
  DucEmbeddableElement,
  DucFrameLikeElement,
  DucGroup,
  DucIframeLikeElement,
  DucImageElement,
  DucLinearElement,
  DucMagicFrameElement,
  DucNonSelectionElement,
  DucTableElement,
  DucTextElement,
  ElementBackground,
  ElementStroke,
  ElementSubset,
  FileId,
  FontFamilyValues,
  GroupId,
  LineHead,
  NonDeleted,
  NonDeletedDucElement,
  OrderedDucElement,
  PointerType,
  TextAlign,
  Theme
} from "ducjs/types/elements";
import type { FileSystemHandle } from "browser-fs-access";
import { TFunction } from 'i18next';
import React from "react";
import type App from "@duc/canvas/components/App";
import { Spreadsheet } from "@duc/canvas/controls/charts";
import { SnapLine } from "@duc/canvas/controls/snapping";
import Library from "@duc/canvas/data/library";
import { ImportedDataState } from "@duc/canvas/data/types";
import { SupportedMeasures } from "@duc/canvas/duc/utils/measurements";
import { DesignStandard } from "@duc/canvas/duc/utils/standards";
import { SuggestedBinding } from "@duc/canvas/element/binding";
import { MaybeTransformHandleType } from "@duc/canvas/element/transformHandles";
import { LinearElementEditor } from "@duc/canvas/linearElement/linearElementEditor";
import Scene from "@duc/canvas/scene/Scene";
import { isOverScrollBars } from "@duc/canvas/scene/scrollbars";
import { StoreActionType } from "@duc/canvas/state/store";
import type { ANTI_ALIASING, IMAGE_MIME_TYPES, MIME_TYPES } from "@duc/canvas/utils/constants";
import { ClipboardData } from "@duc/canvas/utils/events/clipboard";
import { MakeBrand, MaybePromise, Merge, ValueOf } from "ducjs/types/utility-types";
import type { throttleRAF } from "@duc/canvas/utils/utils";
import { Percentage } from "@duc/canvas/utils/geometry/shape";
import {
  LINE_HEAD,
  BLENDING,
  ELEMENT_CONTENT_PREFERENCE,
  FONT_FAMILY,
  IMAGE_STATUS,
  STROKE_CAP,
  STROKE_JOIN,
  STROKE_PLACEMENT,
  STROKE_PREFERENCE,
  STROKE_SIDE_PREFERENCE,
  TEXT_ALIGN,
  THEME,
  VERTICAL_ALIGN,
  ELEMENT_SUBSET,
  BEZIER_MIRRORING,
  FREEDRAW_EASINGS,
} from "@duc/canvas/utils/constants";
import { MakeBrand, MarkNonNullable, Merge, ValueOf } from "ducjs/types/utility-types";
import { MagicCacheData } from "@duc/canvas/data/magic";
import { SupportedMeasures } from "@duc/canvas/duc/utils/measurements";
import { PrecisionValue, Scope } from "@duc/canvas/types";
import { GeometricPoint, Percentage, Radian } from "@duc/canvas/utils/geometry/shape";

export type ChartType = "bar" | "line";
export type FontFamilyKeys = keyof typeof FONT_FAMILY;
export type FontFamilyValues = typeof FONT_FAMILY[FontFamilyKeys];
export type Theme = typeof THEME[keyof typeof THEME];
export type FontString = string & { _brand: "fontString" };
export type GroupId = string;
export type PointerType = "mouse" | "pen" | "touch";
export type FillStyle = ValueOf<typeof ELEMENT_CONTENT_PREFERENCE>;
export type StrokePlacement = ValueOf<typeof STROKE_PLACEMENT>;
export type TextAlign = typeof TEXT_ALIGN[keyof typeof TEXT_ALIGN];
export type ImageStatus = ValueOf<typeof IMAGE_STATUS>;
export type LineHead = ValueOf<typeof LINE_HEAD>;
export type Blending = ValueOf<typeof BLENDING>;
export type ElementSubset = ValueOf<typeof ELEMENT_SUBSET>;

type VerticalAlignKeys = keyof typeof VERTICAL_ALIGN;
export type VerticalAlign = typeof VERTICAL_ALIGN[VerticalAlignKeys];
export type FractionalIndex = string & { _brand: "franctionalIndex" };


export type OptionalDucElementBase = Partial<_DucElementBase>;
export type OptionalDucGroup = Partial<DucGroup>;

export type Ordered<TElement extends DucElement> = TElement & {
  index: FractionalIndex;
};
export type OrderedDucElement = Ordered<DucElement>;

export type DucNonSelectionElement = Exclude<
  DucElement,
  DucSelectionElement
>;

export type DucElbowArrowElement = Merge<
  DucArrowElement,
  {
    elbowed: true;
    startBinding: FixedPointBinding | null;
    endBinding: FixedPointBinding | null;
  }
>;

export type FixedPoint = GeometricPoint;

export type GeometricPoint = { x: number; y: number; };

export type FixedPointBinding = Merge<DucPointBinding, { fixedPoint: FixedPoint }>;
export type BoundElement = {
  id: DucLinearElement["id"];
  type: DucElementTypes;
}

export type TilingProperties = {
  sizeInPercent: Percentage;
  angle: Radian;
  spacing?: number; // Gap between tiles
  offsetX?: number;
  offsetY?: number;
};
export type ElementContentBase = {
  preference: FillStyle;
  src: string; // Can be a color, gradient, image, DucBlock, (fileId or url), frame element's content `@el/${elementId}`
  visible: boolean;
  opacity: Percentage;
  tiling?: TilingProperties;
  hatch?: DucHatchProperties;
  imageFilter?: ImageFilter;
}

export type StrokePreference = ValueOf<typeof STROKE_PREFERENCE>;
export type StrokeCap = ValueOf<typeof STROKE_CAP>;
export type StrokeJoin = ValueOf<typeof STROKE_JOIN>;
export type StrokeStyle = {
  preference: StrokePreference;
  /**
   * The cap of the stroke
   * @default butt
   */
  cap?: StrokeCap;
  /**
   * The join of the stroke
   * @default miter
   */
  join?: StrokeJoin;
  /**
   * The dash of the stroke
   * @default [ 2, 2 ]
   */
  dash?: number[];
  /**
   * The cap of the dash
   * @default butt
   */
  dashCap?: StrokeCap;
  /**
   * The miter limit of the stroke
   */
  miterLimit?: number;
  /**
   * The scale factor that is applied to the dash and gap of the stroke
   * ofter referred to ltscale
   * @default 1
   */
  scale: number;
}

export type StrokeSidePreference = ValueOf<typeof STROKE_SIDE_PREFERENCE>;
export type StrokeSides = {
  preference: StrokeSidePreference;
  values?: number[]; // [0, 1] for x and y || [0, 1, 2, 3] for top, bottom, left, right
}
export type ElementStroke = {
  content: ElementContentBase;
  width: PrecisionValue;
  style: StrokeStyle;
  placement: StrokePlacement;
  strokeSides?: StrokeSides; // if not provided, all sides are used
}

export type ElementBackground = {
  content: ElementContentBase;
}

// Shared style type to avoid repetition
export type DucTableStyleProps = {
  background?: string;
  border?: {
    width?: PrecisionValue;
    dashes?: number[];
    color?: string;
  };
  text?: {
    color?: string;
    size?: PrecisionValue;
    font?: string;
    align?: TextAlign;
  };
}

// Column definition
export type DucTableColumn = {
  id: string;
  width?: PrecisionValue;
  style?: DucTableStyleProps; // Overrides table styles
}

// Row definition
export type DucTableRow = {
  id: string;
  height?: PrecisionValue;
  style?: DucTableStyleProps; // Overrides table styles
}

// Cell definition
export type DucTableCell = {
  rowId: string;
  columnId: string;
  data: string; // Markdown string with text styling and potential wildcards (@)
  style?: DucTableStyleProps; // Overrides row/column styles
}






type _DucElementBase = Readonly<{
  id: string;
  x: PrecisionValue;
  y: PrecisionValue;

  /**
   * The scope where the element is currently
   * mm, cm, m, in, ft, yd, mi, etc...
   */
  scope: SupportedMeasures;

  label: string;
  isVisible: boolean;

  roundness: PrecisionValue;

  blending?: Blending;

  /** @deprecated
   * Use stroke.content.src instead
   */
  strokeColor?: string;
  /** @deprecated
   * Use background.content.src instead
   */
  backgroundColor?: string;

  background: ElementBackground[]; // Array to support layering of backgrounds by index
  stroke: ElementStroke[]; // Array to support layering of strokes by index

  opacity: Percentage;
  width: PrecisionValue;
  height: PrecisionValue;
  angle: Radian;
  /** Random integer used to seed shape generation so that the roughjs shape
      doesn't differ across renders. */
  seed: number;
  /** Integer that is sequentially incremented on each change. Used to reconcile
      elements during collaboration or when saving to server. */
  version: number;
  /** Random integer that is regenerated on each change.
   Used for deterministic reconciliation of updates during collaboration,
   in case the versions (see above) are identical. */
  versionNonce: number;
  /** Whether the element is a plot (i.e. visible on plotting) */
  isPlot: boolean;
  /** Whether the element is annotative (scales with DucViewport) */
  isAnnotative: boolean;
  /** Whether the element is deleted */
  isDeleted: boolean;
  /** List of groups the element belongs to.
      Ordered from deepest to shallowest. */
  groupIds: readonly GroupId[];
  frameId: string | null;
  /** other elements that are bound to this element 
   * if we mutate this element, the bound elements will be updated automatically
   * for transform properties like x, y, angle, etc.
  */
  boundElements: readonly Readonly<BoundElement>[] | null;
  /** z-index of the element in the scene 
   * Explicit stacking order, higher values are rendered on top
  */
  zIndex: number;
  /** epoch (ms) timestamp of last element update */
  updated: number;
  /** String in a fractional form defined by https://github.com/rocicorp/fractional-indexing.
      Used for ordering in multiplayer scenarios, such as during reconciliation or undo / redo.
      Always kept in sync with the array order by `syncMovedIndices` and `syncInvalidIndices`.
      Could be null, i.e. for new elements which were not yet assigned to the scene. */
  index: FractionalIndex | null;
  link: string | null;
  locked: boolean;
  description: string | null;
  customData?: Record<string, any>;
}>;

export type DucSelectionElement = _DucElementBase & {
  type: "selection";
};

export type DucRectangleElement = _DucElementBase & {
  type: "rectangle";
};

export type DucPolygonElement = _DucElementBase & {
  type: "polygon";
  /** 
   * number of sides of the polygon
  */
  sides: number;
};

export type DucEllipseElement = _DucElementBase & {
  type: "ellipse";
  ratio: Percentage;
  startAngle: Radian;
  endAngle: Radian;
  showAuxCrosshair: boolean;
};


export type ImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
};

export type DucImageFilter = {
  brightness: Percentage;
  contrast: Percentage;
}

export type DucImageElement = _DucElementBase &
  Readonly<{
    type: "image";
    fileId: FileId | null;
    /** whether respective file is persisted */
    status: ImageStatus;
    /** X and Y scale factors <-1, 1>, used for image axis flipping */
    scale: [number, number];
    /** whether an element is cropped */
    crop: ImageCrop | null;
    /** clipping boundary for the image */
    clippingBoundary: DucLinearElement | null;
    filter: DucImageFilter | null;
  }>;

export type InitializedDucImageElement = MarkNonNullable<
  DucImageElement,
  "fileId"
>;

export type _DucStackBase = {
  label: string
  description: string | null;

  isPlot: boolean;
  isCollapsed: boolean;
  locked: boolean;
  isVisible: boolean;

  opacity: Percentage;
  labelingColor: string;

  /** Override for all elements in the stack */
  strokeOverride: ElementStroke | null;
  backgroundOverride: ElementBackground | null;

  clip: boolean;
};

export type _DucStackElementBase = _DucElementBase & _DucStackBase;

export type DucGroup = _DucStackBase & {
  id: GroupId;
};

export type DucFrameElement = _DucStackElementBase & {
  type: "frame";
};


export type DucMagicFrameElement = _DucStackElementBase & {
  type: "magicframe";
};

export type DucFrameLikeElement =
  | DucFrameElement
  | DucMagicFrameElement;


export type DucEmbeddableElement = _DucElementBase &
  Readonly<{
    type: "embeddable";
  }>;

export type DucTableElement = _DucElementBase & {
  type: "table"
  columnOrder: string[]; // Array of column IDs in order
  rowOrder: string[]; // Array of row IDs in order
  columns: Record<string, DucTableColumn>; // Column lookup by ID
  rows: Record<string, DucTableRow>; // Row lookup by ID
  cells: Record<string, DucTableCell>; // Cell lookup by "rowId:colId" format

  // Table-wide default styles, if undefined, default to element.stroke and element.background
  style?: DucTableStyleProps;
}

export type DucDocElement = _DucElementBase & {
  type: "doc"
  content: string; // Markdown string with text styling and potential wildcards (@)
}



export type DucIframeElement = _DucElementBase &
  Readonly<{
    type: "iframe";

    // TODO move later to AI-specific frame
    customData?: { generationData?: MagicCacheData };
  }>;

export type DucIframeLikeElement =
  | DucIframeElement
  | DucEmbeddableElement
  | DucTableElement
  | DucDocElement;

export type IframeData =
  | {
    intrinsicSize: { w: number; h: number };
    error?: Error;
    sandbox?: { allowSameOrigin?: boolean };
  } & (
    | { type: "video" | "generic"; link: string }
    | { type: "document"; srcdoc: (theme: Theme) => string }
  );

/**
 * These are elements that don't have any additional properties.
 */
export type DucGenericElement =
  | DucSelectionElement
  | DucRectangleElement;

/**
 * DucElement should be JSON serializable and (eventually) contain
 * no computed data. The list of all DucElements should be shareable
 * between peers and contain no state local to the peer.
 */
export type DucElement =
  | DucGenericElement
  | DucTextElement
  | DucLinearElement
  | DucFreeDrawElement
  | DucImageElement
  | DucFrameElement
  | DucMagicFrameElement
  | DucIframeElement
  | DucEmbeddableElement
  | DucTableElement
  | DucDocElement
  | DucEllipseElement
  | DucBlockInstanceElement
  | DucPolygonElement;



export type DucElementTypes = DucElement["type"];

export type NonDeleted<TElement extends DucElement> = TElement & {
  isDeleted: boolean;
};

export type NonDeletedDucElement = NonDeleted<DucElement> & {
  idx?: number;
};

export type DucTextElement = _DucElementBase &
  Readonly<{
    type: "text";
    text: string;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    containerId: DucGenericElement["id"] | null;
    originalText: string;
    /**
     * Text sizing behavior:
     * - `true`: Width adjusts to fit text content (single line or natural wrapping)
     * - `false`: Text wraps to fit within the element's fixed width
     * 
     * @default true
     */
    autoResize: boolean;
    /**
     * The primary font family to use for the text
     */
    fontFamily: FontFamilyValues;
    /**
     * Fallback font family for broader compatibility across all systems and languages
     * Useful for emojis, non-latin characters, etc.
     */
    bigFontFamily: string;
    /**
     * Unitless line height multiplier (follows W3C standard).
     * Actual line height in drawing units = fontSize × lineHeight
     * Use `getLineHeightInPx` helper for pixel calculations.
     * 
     * @example 1.2 means 20% extra space between lines
     */
    lineHeight: number & { _brand: "unitlessLineHeight" };
    /**
     * Italic angle in radians for oblique text rendering
     * Positive values slant right, negative values slant left
     */
    obliqueAngle: Radian;
    /**
     * Text height in drawing units (primary size parameter)
     * This determines the height of capital letters
     */
    fontSize: PrecisionValue;
    /**
     * Character width as a ratio of text height
     * Controls horizontal spacing and character proportions
     * 
     * @example 0.7 means each character is 70% as wide as the text is tall
     */
    widthCharScale: number;
  }>;

export type DucBindableElement =
  | DucRectangleElement
  | DucPolygonElement
  | DucEllipseElement
  | DucTextElement
  | DucImageElement
  | DucIframeElement
  | DucEmbeddableElement
  | DucFrameElement
  | DucMagicFrameElement
  | DucTableElement
  | DucDocElement
  | DucLinearElement;

export type DucTextContainer =
  | DucRectangleElement
  | DucPolygonElement
  | DucEllipseElement
  | DucArrowElement;

export type DucFlowchartNodeElement =
  | DucRectangleElement
  | DucPolygonElement
  | DucEllipseElement;


export type DucTextElementWithContainer = {
  containerId: DucTextContainer["id"];
} & DucTextElement;



export type DucPointBinding = {
  elementId: DucBindableElement["id"];

  /** 
   * Determines where along the edge of the bound element the arrow endpoint should attach.
   * This value ranges from -1 to 1:
   * - -1 → Attaches to the far left (for horizontal edges) or top (for vertical edges).
   * -  0 → Attaches to the exact center of the edge.
   * -  1 → Attaches to the far right (for horizontal edges) or bottom (for vertical edges).
   * 
   * Focus ensures that the arrow dynamically adjusts as the bound element moves, resizes, or rotates.
  */
  focus: number;

  /** 
   * The gap distance between the bound element and the binding element.
   */
  gap: PrecisionValue;

  /** 
   * Represents a fixed point inside the bound element, defined as a normalized coordinate.
   * This value is an array [x, y], where:
   * - x (0.0 - 1.0) → The horizontal position inside the element (0 = left, 1 = right).
   * - y (0.0 - 1.0) → The vertical position inside the element (0 = top, 1 = bottom).
   * Unlike focus, fixedPoint ensures that the arrow stays pinned to a precise location
   * inside the element, regardless of resizing or movement.
   * 
   * - If fixedPoint is null, focus is used instead, meaning the arrow will attach dynamically to the edge.
   * - If fixedPoint is set, it overrides focus, keeping the arrow attached to the exact specified point inside the element.
   */
  fixedPoint: FixedPoint | null;

  /**
   * Represents a point within a DucLinearElement.
   *
   * The `offset` ranges from -1 to 1:
   * - `0` corresponds to the actual point.
   * - `-1` and `1` represent the percentage of the distance between the point at `index` and the previous or next point in the points array, respectively.
   *
   * @property {number} index - The index of the target point within the element.
   * @property {number} offset - The offset from the point.
   */
  point: {
    index: number;
    offset: number;
  } | null;

  /** 
   * The head of the line 
   * Reference: https://www.figma.com/design/5rYcUlscflBabQ9di2iFJ5/duc-Architecture?node-id=313-43&t=gNEFgevk9KZ3oAun-1
   */
  head: LineHead | null;
};


export interface DucPointPosition {
  x: PrecisionValue;
  y: PrecisionValue;
}
export type BezierMirroring = ValueOf<typeof BEZIER_MIRRORING>;

export type DucPoint = DucPointPosition & {
  mirroring?: BezierMirroring; // Only meaningful if the point is referenced in exactly two lines
}
export type DucLine = [DucLineReference, DucLineReference];
export type DucLineReference = {
  index: number; // index of the point in the points array
  handle: DucPointPosition | null; // Bezier handle of the point on the line segment
}

export type DucPath = {
  lineIndices: readonly number[];
  // Override the background and stroke from the base in case is different than null
  background: ElementBackground | null;
  stroke: ElementStroke | null;
};

export type DucLinearElement = _DucElementBase &
  Readonly<{
    type: "line" | "arrow";
    points: readonly DucPoint[];
    lines: readonly DucLine[];
    pathOverrides: readonly DucPath[];
    lastCommittedPoint: DucPoint | null;
    startBinding: DucPointBinding | null;
    endBinding: DucPointBinding | null;
    /**
     * If true, the element's shape will wipe out the content below the element
     * @default false
     */
    wipeoutBelow: boolean;
  }>;

export type DucArrowElement = DucLinearElement &
  Readonly<{
    type: "arrow";
    elbowed: boolean;
  }>;


export type DucFreeDrawEasing = typeof FREEDRAW_EASINGS[keyof typeof FREEDRAW_EASINGS];
export type DucFreeDrawEnds = {
  cap: boolean;
  taper: number;
  easing: DucFreeDrawEasing;
}
export type DucFreeDrawElement = _DucElementBase &
  Readonly<{
    type: "freedraw";
    points: readonly DucPoint[];
    size: PrecisionValue;
    thinning: Percentage;
    smoothing: Percentage;
    streamline: Percentage;
    easing: DucFreeDrawEasing;
    start: DucFreeDrawEnds | null;
    end: DucFreeDrawEnds | null;
    pressures: readonly number[];
    simulatePressure: boolean;
    lastCommittedPoint: DucPoint | null;
    svgPath: string | null;
  }>;


export type DucBlockAttributeDetailsType = {
  tag: string;
  defaultValue: string;
  prompt?: string;
};

export type DucBlock = {
  id: string;
  label: string;
  description?: string;
  version: number;

  elements: DucElement[];

  // Dynamic attributes
  // The attributes object defines the variable schema (what variables exist, their defaults, where they display), and the attributeValues in each instance provides the actual values for those variables.
  attributes?: { [attributeName: string]: DucBlockAttributeDetailsType };
};

export type DucBlockInstanceElement = _DucElementBase & { //Instance of a block definition
  type: "blockinstance";
  blockId: string;

  // Override properties of elements within this block instance
  blockElementOverrides?: {
    [elementId: string]: string; // JSON stringified object
  };
};


export type FileId = string & { _brand: "FileId" };

export type DucElementType = DucElement["type"];

/**
 * Map of duc elements.
 * Unspecified whether deleted or non-deleted.
 * Can be a subset of Scene elements.
 */
export type ElementsMap = Map<DucElement["id"], DucElement>;

/**
 * Map of non-deleted elements.
 * Can be a subset of Scene elements.
 */
export type NonDeletedElementsMap = Map<
  DucElement["id"],
  NonDeletedDucElement
> &
  MakeBrand<"NonDeletedElementsMap">;

/**
 * Map of all duc Scene elements, including deleted.
 * Not a subset. Use this type when you need access to current Scene elements.
 */
export type SceneElementsMap = Map<DucElement["id"], DucElement> &
  MakeBrand<"SceneElementsMap">;

/**
 * Map of all non-deleted Scene elements.
 * Not a subset. Use this type when you need access to current Scene elements.
 */
export type NonDeletedSceneElementsMap = Map<
  DucElement["id"],
  NonDeletedDucElement
> &
  MakeBrand<"NonDeletedSceneElementsMap">;

export type ElementsMapOrArray =
  | readonly DucElement[]
  | Readonly<ElementsMap>;


export type Scope = SupportedMeasures;

export type SocketId = string & { _brand: "SocketId" };


export type Collaborator = Readonly<{
  pointer?: CollaboratorPointer;
  button?: "up" | "down";
  selectedElementIds?: AppState["selectedElementIds"];
  username?: string | null;
  userState?: UserIdleState;
  color?: {
    background: string;
    stroke: string;
  };
  // The url of the collaborator's avatar, defaults to username initials
  // if not present
  avatarUrl?: string;
  // user id. If supplied, we'll filter out duplicates when rendering user avatars.
  id?: string;
  socketId?: SocketId;
  isCurrentUser?: boolean;
  isInCall?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
}>;

export type CollaboratorPointer = {
  x: number;
  y: number;
  tool: "pointer" | "laser";
  /**
   * Whether to render cursor + username. Useful when you only want to render
   * laser trail.
   *
   * @default true
   */
  renderCursor?: boolean;
  /**
   * Explicit laser color.
   *
   * @default string collaborator's cursor color
   */
  laserColor?: string;
};

export type DataURL = string & { _brand: "DataURL" };


export type ObservedAppState = ObservedStandaloneAppState &
  ObservedElementsAppState;

export type ObservedStandaloneAppState = {
  name: AppState["name"];
  viewBackgroundColor: AppState["viewBackgroundColor"];
};

export type ObservedElementsAppState = {
  editingGroupId: AppState["editingGroupId"];
  selectedElementIds: AppState["selectedElementIds"];
  selectedGroupIds: AppState["selectedGroupIds"];
  // Avoiding storing whole instance, as it could lead into state incosistencies, empty undos/redos and etc.
  editingLinearElementId: LinearElementEditor["elementId"] | null;
  // Right now it's coupled to `editingLinearElement`, ideally it should not be really needed as we already have selectedElementIds & editingLinearElementId
  selectedLinearElementId: LinearElementEditor["elementId"] | null;
};

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

export type ElementOrToolType = DucElementType | ToolType | "custom";

export type ActiveTool =
  | {
    type: ToolType;
    customType: null;
  }
  | {
    type: "custom";
    customType: string;
  };

export type SidebarName = string;
export type SidebarTabName = string;

export type UserToFollow = {
  socketId: SocketId;
  username: string;
};

/**
 * Represents a User Coordinate System (UCS).
 * A UCS defines a movable and reorientable coordinate system that allows users
 * to easily draw and manipulate objects along custom axes, rather than being
 * limited to the fixed World Coordinate System (WCS).
 */
export type DucUcs = {
  id: string;
  /**
   * A user-friendly name for the UCS (e.g., "Wall Angle 30", "Isometric-Top", "Detail Area 1").
   * Users can select and activate a UCS by its name.
   */
  name: string;
  /**
   * The origin point (0,0) of this UCS, specified in World Coordinate System (WCS) units.
   * When this UCS is active, all subsequent coordinate inputs and displayed coordinates
   * will be relative to this point.
   */
  origin: DucPoint;
  /**
   * A 2D vector defining the direction of the positive X-axis of this UCS, relative to the WCS.
   * This vector determines the new "horizontal" direction for drawing operations
   * when this UCS is active.
   * Example: For a UCS rotated 45 degrees counter-clockwise from WCS, xAxis might be { x: 0.707, y: 0.707 }.
   */
  xAxis: DucPoint;
  /**
   * A 2D vector defining the direction of the positive Y-axis of this UCS, relative to the WCS.
   * This vector determines the new "vertical" direction for drawing operations
   * when this UCS is active. It should always be perpendicular to the xAxis for a standard orthogonal UCS,
   * typically derived by rotating the xAxis 90 degrees counter-clockwise (e.g., if xAxis is {vx, vy}, yAxis is {-vy, vx}).
   */
  yAxis: DucPoint;
};

export type _CommonCanvasAppState = {
  zoom: AppState["zoom"];
  scrollX: AppState["scrollX"];
  scrollY: AppState["scrollY"];
  scope: AppState["scope"];
  width: AppState["width"];
  height: AppState["height"];
  viewModeEnabled: AppState["viewModeEnabled"];
  editingGroupId: AppState["editingGroupId"]; // TODO: move to interactive canvas if possible
  selectedElementIds: AppState["selectedElementIds"]; // TODO: move to interactive canvas if possible
  frameToHighlight: AppState["frameToHighlight"]; // TODO: move to interactive canvas if possible
  offsetLeft: AppState["offsetLeft"];
  offsetTop: AppState["offsetTop"];
  theme: AppState["theme"];
  pendingImageElementId: AppState["pendingImageElementId"];
};

export type StaticCanvasAppState = Readonly<
  _CommonCanvasAppState & {
    shouldCacheIgnoreZoom: AppState["shouldCacheIgnoreZoom"];
    /** null indicates transparent bg */
    viewBackgroundColor: AppState["viewBackgroundColor"] | null;
    scope: AppState["scope"];
    groups: AppState["groups"];
    exportScale: AppState["exportScale"];
    selectedElementsAreBeingDragged: AppState["selectedElementsAreBeingDragged"];
    gridSize: AppState["gridSize"];
    gridStep: AppState["gridStep"];
    gridModeEnabled: AppState["gridModeEnabled"];
    frameRendering: AppState["frameRendering"];
    currentHoveredFontFamily: AppState["currentHoveredFontFamily"];
    displayDistanceOnDrawing: AppState["displayDistanceOnDrawing"];
    displayAllPointDistances: AppState["displayAllPointDistances"];
    displayAllPointCoordinates: AppState["displayAllPointCoordinates"];
    displayAllPointInfoSelected: AppState["displayAllPointInfoSelected"];
    displayRootAxis: AppState["displayRootAxis"];
    coordDecimalPlaces: AppState["coordDecimalPlaces"];
    newElement: AppState["newElement"];
    debugRendering: AppState["debugRendering"];
    // renderInteractiveScene
    activeEmbeddable: AppState["activeEmbeddable"];
    editingLinearElement: AppState["editingLinearElement"];
    selectionElement: AppState["selectionElement"];
    selectedGroupIds: AppState["selectedGroupIds"];
    selectedLinearElement: AppState["selectedLinearElement"];
    multiElement: AppState["multiElement"];
    isBindingEnabled: AppState["isBindingEnabled"];
    suggestedBindings: AppState["suggestedBindings"];
    // isRotating: AppState["isRotating"];
    elementsToHighlight: AppState["elementsToHighlight"];
    // Collaborators
    // collaborators: AppState["collaborators"];
    // SnapLines
    // snapLines: AppState["snapLines"]; 
    editingTextElement: AppState["editingTextElement"];
    elementHovered: AppState["elementHovered"];
    // selectionDirection: AppState["selectionDirection"];
    activeTool: AppState["activeTool"];
    elementsPendingErasure: AppState["elementsPendingErasure"];
    isCanvasLoading: AppState["isCanvasLoading"];
    isLoading: AppState["isLoading"];
  }
>;

export type InteractiveCanvasAppState = Readonly<
  _CommonCanvasAppState & {
    // renderInteractiveScene
    activeEmbeddable: AppState["activeEmbeddable"];
    editingLinearElement: AppState["editingLinearElement"];
    selectionElement: AppState["selectionElement"];
    selectedGroupIds: AppState["selectedGroupIds"];
    selectedLinearElement: AppState["selectedLinearElement"];
    multiElement: AppState["multiElement"];
    isBindingEnabled: AppState["isBindingEnabled"];
    suggestedBindings: AppState["suggestedBindings"];
    isRotating: AppState["isRotating"];
    elementsToHighlight: AppState["elementsToHighlight"];
    // Collaborators
    collaborators: AppState["collaborators"];
    // SnapLines
    snapLines: AppState["snapLines"];
    zenModeEnabled: AppState["zenModeEnabled"];
    editingTextElement: AppState["editingTextElement"];
    elementHovered: AppState["elementHovered"];
    selectionDirection: AppState["selectionDirection"];
    activeTool: AppState["activeTool"];
    viewBackgroundColor: AppState["viewBackgroundColor"];
    showHyperlinkPopup: AppState["showHyperlinkPopup"];
    pendingLinearElementAction: AppState["pendingLinearElementAction"];
  }
>;

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
  penDetected: boolean;
  exportBackground: boolean;
  exportEmbedScene: boolean;
  exportWithDarkMode: boolean;
  exportScale: number;

  gridModeEnabled: boolean;
  viewModeEnabled: boolean; // Don't Save
  zenModeEnabled: boolean; // Don't Save
  showStats: boolean; // Don't Save

  showHyperlinkPopup: false | "info" | "editor";
  objectsSnapModeEnabled: boolean;

  antiAliasing: AntiAliasing;
  vSync: boolean;
  zoomStep: number;
}

export interface AppState extends Ducfig {
  pendingLinearElementAction: "create" | null;
  // un-removable state
  contextMenu: {
    items: {};
    top: number;
    left: number;
  } | null;
  showWelcomeScreen: boolean;
  isLoading: boolean;
  isCanvasLoading: boolean;
  errorMessage: React.ReactNode;
  activeEmbeddable: {
    element: NonDeletedDucElement;
    state: "hover" | "active";
  } | null;
  /**
 * for a newly created element
 * - set on pointer down, updated during pointer move, used on pointer up
 */
  newElement: NonDeleted<DucNonSelectionElement> | null;
  /**
   * for a single element that's being resized
   * - set on pointer down when it's selected and the active tool is selection
   */
  resizingElement: NonDeletedDucElement | null;
  /**
   * multiElement is for multi-point linear element that's created by clicking as opposed to dragging
   * - when set and present, the editor will handle linear element creation logic accordingly
   */
  multiElement: NonDeleted<DucLinearElement> | null;
  /**
   * decoupled from newElement, dragging selection only creates selectionElement
   * - set on pointer down, updated during pointer move
   */
  draggingElement: NonDeletedDucElement | null;
  selectionElement: NonDeletedDucElement | null;
  isBindingEnabled: boolean;
  startBoundElement: NonDeleted<DucBindableElement> | null;
  suggestedBindings: SuggestedBinding[];
  frameToHighlight: NonDeleted<DucFrameLikeElement> | null;
  frameRendering: {
    enabled: boolean;
    name: boolean;
    outline: boolean;
    clip: boolean;
  };
  editingFrame: string | null;
  elementsToHighlight: NonDeleted<DucElement>[] | null;
  elementsPendingErasure: ElementsPendingErasure;
  // element being edited, but not necessarily added to elements array yet
  // (e.g. text element when typing into the input)
  elementHovered: NonDeleted<DucElement> | null;
  editingElement: NonDeletedDucElement | null;
  editingTextElement: NonDeletedDucElement | null;
  editingLinearElement: LinearElementEditor | null;
  viewBackgroundColor: string;
  /**
   * The current scope of the design
   * mm, cm, m, in, ft, yd, mi, etc...
   */
  scope: Scope,
  /**
   * The scope that the design is preferred at
   */
  mainScope: Scope,
  /**
   * The scope that the design is cached at shouldCacheIgnoreZoom for better rendering
   */
  cachedScope: Scope,
  /**
   * The Standard for the given technical design
   * https://en.wikipedia.org/wiki/List_of_technical_standard_organizations
   */
  standard: DesignStandard;
  groups: DucGroup[];
  scrollX: PrecisionValue;
  scrollY: PrecisionValue;
  viewTwistAngle: Radian;
  zoom: Zoom;
  activeUcs: DucUcs["id"] | null;
  activeGridSettings: GridSettings["id"] | null;
  cursorButton: "up" | "down";
  scrolledOutside: boolean;
  name: string | null;
  isResizing: boolean;
  isRotating: boolean;
  openMenu: "canvas" | "shape" | null;
  openPopup: "canvasBackground" | "elementBackground" | "elementStroke" | null; // Out of the Binary
  openSidebar: { name: SidebarName; tab?: SidebarTabName } | null; // Out of the Binary
  openDialog:
  | null
  | { name: "imageExport" | "help" | "jsonExport" }
  | {
    name: "settings";
    source:
    | "tool" // when magicframe tool is selected
    | "generation" // when magicframe generate button is clicked
    | "settings"; // when AI settings dialog is explicitly invoked
    tab: "text-to-diagram" | "diagram-to-code";
  }
  | { name: "ttd"; tab: "text-to-diagram" | "mermaid" }; // Out of the Binary
  /**
   * Reflects user preference for whether the default sidebar should be docked.
   *
   * NOTE this is only a user preference and does not reflect the actual docked
   * state of the sidebar, because the host apps can override this through
   * a DefaultSidebar prop, which is not reflected back to the appState.
   */
  defaultSidebarDockedPreference: boolean;  // Out of the Binary
  currentItemStroke: ElementStroke;
  currentItemBackground: ElementBackground;
  currentItemOpacity: Percentage;
  currentItemFontFamily: FontFamilyValues;
  currentItemFontSize: DucTextElement["fontSize"];
  currentHoveredFontFamily: FontFamilyValues | null;
  currentItemTextAlign: TextAlign;
  currentItemStartLineHead: LineHead | null;
  currentItemEndLineHead: LineHead | null;
  currentItemArrowType: "sharp" | "round" | "elbow";
  currentItemRoundness: DucElement["roundness"];

  lastPointerDownWith: PointerType;
  selectedElementIds: Readonly<{ [id: string]: true }>;
  previousSelectedElementIds: { [id: string]: true };
  selectedElementsAreBeingDragged: boolean;
  shouldCacheIgnoreZoom: boolean;
  toast: { message: string; closable?: boolean; duration?: number } | null; // Out of the Binary
  theme: Theme; // Is Always overridden on load
  /** grid cell px size */
  gridSize: number;
  gridStep: number;

  /** top-most selected groups (i.e. does not include nested groups) */
  selectedGroupIds: { [groupId: string]: boolean };
  /** group being edited when you drill down to its constituent element
    (e.g. when you double-click on a group's element) */
  editingGroupId: GroupId | null;
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;

  fileHandle: FileSystemHandle | null;
  collaborators: Map<SocketId, Collaborator>;
  currentChartType: ChartType; // Out of the Binary
  pasteDialog:
  | {
    shown: false;
    data: null;
  }
  | {
    shown: true;
    data: Spreadsheet;
  };
  /** imageElement waiting to be placed on canvas */
  pendingImageElementId: DucImageElement["id"] | null;
  selectedLinearElement: LinearElementEditor | null; // Out of the Binary
  snapLines: readonly SnapLine[];
  originSnapOffset: {
    x: number;
    y: number;
  } | null;
  /** the user's clientId & username who is being followed on the canvas */
  userToFollow: UserToFollow | null;
  /** the clientIds of the users following the current user */
  followedBy: Set<SocketId>;

  scaleRatioLocked: boolean;
  displayAllPointDistances: boolean;
  displayDistanceOnDrawing: boolean;
  displayAllPointCoordinates: boolean;
  displayAllPointInfoSelected: boolean;

  displayRootAxis: boolean;
  coordDecimalPlaces: number;
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
   * This threshold is used to check if the viewport dimensions require a scope change:
   * 
   * For example, with mm the base value is around 1e-3:
   * 
   * Viewport A:
   * width: 5 * 1e-2 (✓)
   * height: 6.05 * 1e-3 (✓)
   * -> Both dimensions are within scopeExponentThreshold (±2 exponents)
   * -> DOES NOT need a scope change
   * 
   * Viewport B:
   * width: 4.95 * 1e-6 (✗)
   * height: 6.05 * 1e-4 (✓)
   * -> Width exceeds the allowed scopeExponentThreshold (by 1 exponent)
   * -> NEEDS scope change
   * 
   * Viewport C:
   * width: 4.95 * 1e-1 (✓)
   * height: 6.05 * 1e3 (✗)
   * -> Height exceeds the allowed scopeExponentThreshold (by 4 exponents)
   * -> NEEDS scope change
   * 
   * This system ensures measurements remain representable with appropriate precision
   * as users zoom in and out, automatically adjusting between units like mm, μm, nm, etc.
   */
  scopeExponentThreshold: number;

  selectionDirection: 'left' | 'right' | null;
  lineBendingMode: boolean;
  debugRendering: boolean;
  eyeDropper: EyeDropperState;
}

export type UIAppState = Omit<
  AppState,
  | "suggestedBindings"
  | "startBoundElement"
  | "cursorButton"
  | "scrollX"
  | "scrollY"
>;

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

export type ExcalidrawInitialDataState = Merge<
  ImportedDataState,
  {
    libraryItems?: MaybePromise<Required<ImportedDataState>["libraryItems"]>;
  }
>;

export type OnUserFollowedPayload = {
  userToFollow: UserToFollow;
  action: "FOLLOW" | "UNFOLLOW";
};

export type TableComponentProps = {
  element: DucTableElement;
  appState: AppState;
  onTableChange: (tableData: {
    width?: DucTableElement["width"];
    height?: DucTableElement["height"];
    columnOrder?: DucTableElement["columnOrder"];
    rowOrder?: DucTableElement["rowOrder"];
    columns?: DucTableElement["columns"];
    rows?: DucTableElement["rows"];
    cells?: DucTableElement["cells"];
    style?: DucTableElement["style"];
  }) => void;
}


export interface DucProps {
  id: string;
  onChange?: (
    elements: readonly OrderedDucElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => void;
  initialData?:
  | (() => MaybePromise<ExcalidrawInitialDataState | null>)
  | MaybePromise<ExcalidrawInitialDataState | null>;
  ducAPI?: (api: DucImperativeAPI) => void;
  onUseApp?: (useAppHook: () => AppClassProperties) => void;
  isCollaborating?: boolean;
  onPointerUpdate?: (payload: {
    pointer: { x: number; y: number; tool: "pointer" | "laser" };
    button: "down" | "up";
    pointersMap: Gesture["pointers"];
  }) => void;
  onPaste?: (
    data: ClipboardData,
    event: ClipboardEvent | null,
  ) => Promise<boolean> | boolean;
  renderTopRightUI?: (
    isMobile: boolean,
    appState: UIAppState,
  ) => React.ReactElement | null;
  viewModeEnabled?: boolean;
  zenModeEnabled?: boolean;
  gridModeEnabled?: boolean;
  objectsSnapModeEnabled?: boolean;
  libraryReturnUrl?: string;
  theme?: Theme;
  // @TODO come with better API before v0.18.0
  name?: string;
  renderCustomStats?: (
    elements: readonly NonDeletedDucElement[],
    appState: UIAppState,
  ) => React.ReactElement;
  UIOptions?: Partial<UIOptions>;
  detectScroll?: boolean;
  handleKeyboardGlobally?: boolean;
  onLibraryChange?: (libraryItems: LibraryItems) => void | Promise<any>;
  autoFocus?: boolean;
  generateIdForFile?: (file: File) => string | Promise<string>;
  onLinkOpen?: (
    element: NonDeletedDucElement,
    event: CustomEvent<{
      nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
    }>,
  ) => void;
  onPointerDown?: (
    activeTool: AppState["activeTool"],
    pointerDownState: PointerDownState,
  ) => void;
  onPointerUp?: (
    activeTool: AppState["activeTool"],
    pointerDownState: PointerDownState,
  ) => void;
  onScrollChange?: (scrollX: AppState["scrollX"], scrollY: AppState["scrollY"], zoom: AppState["zoom"]) => void;
  onUserFollow?: (payload: OnUserFollowedPayload) => void;
  children?: React.ReactNode;
  validateEmbeddable?:
  | boolean
  | string[]
  | RegExp
  | RegExp[]
  | ((link: string) => boolean | undefined);
  renderEmbeddable?: (
    element: NonDeleted<DucEmbeddableElement>,
    appState: AppState,
  ) => React.ReactElement | null;
  aiEnabled?: boolean;
  showDeprecatedFonts?: boolean;
  // This is the actual Table component that will be used to render the table, passed from the props
  tableComponent: (props: TableComponentProps) => React.ReactElement | null;
  language: Language;
  t: TFunction<"Core">;
}

export interface Language {
  code: string;
  label: string;
  rtl?: boolean;
}

export type SceneData = {
  elements?: ImportedDataState["elements"];
  appState?: ImportedDataState["appState"];
  collaborators?: Map<SocketId, Collaborator>;
  storeAction?: StoreActionType;
};

export enum UserIdleState {
  ACTIVE = "active",
  AWAY = "away",
  IDLE = "idle",
}

export type ExportOpts = {
  saveFileToDisk?: boolean;
  onExportToBackend?: (
    exportedElements: readonly NonDeletedDucElement[],
    appState: UIAppState,
    files: BinaryFiles,
  ) => void;
  renderCustomUI?: (
    exportedElements: readonly NonDeletedDucElement[],
    appState: UIAppState,
    files: BinaryFiles,
    canvas: HTMLCanvasElement,
  ) => React.ReactElement;
};

// NOTE at the moment, if action name corresponds to canvasAction prop, its
// truthiness value will determine whether the action is rendered or not
// (see manager renderAction). We also override canvasAction values in
// Excalidraw package index.tsx.
export type CanvasActions = Partial<{
  changeViewBackgroundColor: boolean;
  clearCanvas: boolean;
  export: false | ExportOpts;
  loadScene: boolean;
  saveToActiveFile: boolean;
  toggleTheme: boolean | null;
  saveAsImage: boolean;
}>;

export type UIOptions = Partial<{
  dockedSidebarBreakpoint: number;
  canvasActions: CanvasActions;
  tools: {
    image: boolean;
  };
  /** @deprecated does nothing. Will be removed in 0.15 */
  welcomeScreen?: boolean;
}>;

export type AppProps = Merge<
  DucProps,
  {
    UIOptions: Merge<
      UIOptions,
      {
        canvasActions: Required<CanvasActions> & { export: ExportOpts };
      }
    >;
    detectScroll: boolean;
    handleKeyboardGlobally: boolean;
    isCollaborating: boolean;
    children?: React.ReactNode;
    aiEnabled: boolean;
  }
>;

/** A subset of App class properties that we need to use elsewhere
 * in the app, eg Manager. Factored out into a separate type to keep DRY. */
export type AppClassProperties = {
  props: AppProps;
  state: AppState;
  interactiveCanvas: HTMLCanvasElement | null;
  /** static canvas */
  canvas: HTMLCanvasElement;
  focusContainer(): void;
  library: Library;
  imageCache: Map<
    FileId,
    {
      image: HTMLImageElement | Promise<HTMLImageElement>;
      mimeType: ValueOf<typeof IMAGE_MIME_TYPES>;
    }
  >;
  files: BinaryFiles;
  device: App["device"];
  scene: App["scene"];
  syncActionResult: App["syncActionResult"];
  fonts: App["fonts"];
  pasteFromClipboard: App["pasteFromClipboard"];
  id: App["id"];
  onInsertElements: App["onInsertElements"];
  onExportImage: App["onExportImage"];
  lastViewportPosition: App["lastViewportPosition"];
  scrollToContent: App["scrollToContent"];
  addFiles: App["addFiles"];
  addElementsFromPasteOrLibrary: App["addElementsFromPasteOrLibrary"];
  togglePenMode: App["togglePenMode"];
  updateGroups: App["updateGroups"];
  toggleLock: App["toggleLock"];
  setActiveTool: App["setActiveTool"];
  insertEmbeddableElement: App["insertEmbeddableElement"];
  getName: App["getName"];
  dismissLinearEditor: App["dismissLinearEditor"];
  flowChartCreator: App["flowChartCreator"];
  getEffectiveGridSize: App["getEffectiveGridSize"];
  closeEyeDropper: App["closeEyeDropper"];
  openEyeDropper: App["openEyeDropper"];
  getEyeDropper: App["getEyeDropper"];
  rerenderCanvas: App["rerenderCanvas"];
  setAppState: App["setAppState"];
  updateScope: App["updateScope"];
  executeAction: App["executeAction"];
  getT: App["getT"];
  getLanguage: App["getLanguage"];
  // setPlugins: App["setPlugins"];
  // plugins: App["plugins"];
};

export type PointerDownState = Readonly<{
  // The first position at which pointerDown happened
  origin: Readonly<{ x: number; y: number }>;
  // Same as "origin" but snapped to the grid, if grid is on
  originInGrid: Readonly<{ x: number; y: number }>;
  // Scrollbar checks
  scrollbars: ReturnType<typeof isOverScrollBars>;
  // The previous pointer position
  lastCoords: { x: number; y: number };
  // map of original elements data
  originalElements: Map<string, NonDeleted<DucElement>>;
  resize: {
    // Handle when resizing, might change during the pointer interaction
    handleType: MaybeTransformHandleType;
    // This is determined on the initial pointer down event
    isResizing: boolean;
    // This is determined on the initial pointer down event
    offset: { x: number; y: number };
    // This is determined on the initial pointer down event
    arrowDirection: "origin" | "end";
    // This is a center point of selected elements determined on the initial pointer down event (for rotation only)
    center: { x: number; y: number };
  };
  hit: {
    // The element the pointer is "hitting", is determined on the initial
    // pointer down event
    element: NonDeleted<DucElement> | null;
    // The elements the pointer is "hitting", is determined on the initial
    // pointer down event
    allHitElements: NonDeleted<DucElement>[];
    // This is determined on the initial pointer down event
    wasAddedToSelection: boolean;
    // Whether selected element(s) were duplicated, might change during the
    // pointer interaction
    hasBeenDuplicated: boolean;
    hasHitCommonBoundingBoxOfSelectedElements: boolean;
  };
  withCmdOrCtrl: boolean;
  drag: {
    // Might change during the pointer interaction
    hasOccurred: boolean;
    // Might change during the pointer interaction
    offset: { x: number; y: number } | null;
  };
  // We need to have these in the state so that we can unsubscribe them
  eventListeners: {
    // It's defined on the initial pointer down event
    onMove: null | ReturnType<typeof throttleRAF>;
    // It's defined on the initial pointer down event
    onUp: null | ((event: PointerEvent) => void);
    // It's defined on the initial pointer down event
    onKeyDown: null | ((event: KeyboardEvent) => void);
    // It's defined on the initial pointer down event
    onKeyUp: null | ((event: KeyboardEvent) => void);
  };
  boxSelection: {
    hasOccurred: boolean;
  };
}>;

export type UnsubscribeCallback = () => void;

export interface DucImperativeAPI {
  getT: App["getT"];
  history: {
    clear: InstanceType<typeof App>["resetHistory"];
    undo: () => any;
    redo: InstanceType<typeof App>["redo"];
  };
  files: {
    exportToDucJSON: InstanceType<typeof App>["exportToDucJSON"];
    exportToDucBin: InstanceType<typeof App>["exportToDucBin"];
    exportToPng: InstanceType<typeof App>["exportToPng"];
    exportToSvg: InstanceType<typeof App>["exportToSvg"];
    openFile: InstanceType<typeof App>["openFile"];
  };
  canvas: {
    resetScene: InstanceType<typeof App>["resetScene"];
    rerender: InstanceType<typeof App>["rerenderCanvas"];
    rerenderImages: InstanceType<typeof App>["rerenderImages"];
    updateScene: InstanceType<typeof App>["updateScene"];
    zoomToValues: InstanceType<typeof App>["zoomToValues"];
    zoomToFitBounds: InstanceType<typeof App>["zoomToFitBounds"];
    scrollToContent: InstanceType<typeof App>["scrollToContent"];
    scrollToRoot: InstanceType<typeof App>["scrollToRoot"];
    toggleSnapMode: InstanceType<typeof App>["toggleSnapMode"];
    setMainScope: InstanceType<typeof App>["setMainScope"];
    updateGroups: InstanceType<typeof App>["updateGroups"];
    mutateGroup: InstanceType<typeof App>["mutateGroup"];
    bindSelectedElements: InstanceType<typeof App>["bindSelectedElements"];
    setActiveTool: InstanceType<typeof App>["setActiveTool"];
    setBackgroundColor: InstanceType<typeof App>["setBackgroundColor"];
    openEyeDropper: InstanceType<typeof App>["openEyeDropper"];
    closeEyeDropper: InstanceType<typeof App>["closeEyeDropper"];
    getEyeDropper: InstanceType<typeof App>["getEyeDropper"];
    handleCanvasContextMenu: InstanceType<typeof App>["handleCanvasContextMenu"];
    maybeUnfollowRemoteUser: InstanceType<typeof App>["maybeUnfollowRemoteUser"];
  };
  useApp: () => AppClassProperties
  elements: {
    getSceneElements: InstanceType<typeof App>["getSceneElements"];
    getElementById: InstanceType<typeof App>["getElementById"];
    getVisibleElements: InstanceType<typeof App>["getVisibleElements"];
    getSelectedElements: InstanceType<typeof App>["getSelectedElements"];
    getMajoritySelectedElementsType: InstanceType<typeof App>["getMajoritySelectedElementsType"];
    getSelectedElementsType: InstanceType<typeof App>["getSelectedElementsType"];
    getNonDeletedElementsMap: InstanceType<typeof App>["getNonDeletedElementsMap"];
    getSceneElementsIncludingDeleted: InstanceType<typeof App>["getSceneElementsIncludingDeleted"];
    mutateElementWithValues: InstanceType<typeof App>["mutateElementWithValues"];
    getSelectedElementsSpecificValues: InstanceType<typeof App>["getSelectedElementsSpecificValues"];
    getElementsForLayers: InstanceType<typeof App>["getElementsForLayers"];
    replaceAllElements: InstanceType<typeof Scene>["replaceAllElements"];
    mutateSelectedElementsWithValues: InstanceType<typeof App>["mutateSelectedElementsWithValues"];
    mutateElementByIdWithValues: InstanceType<typeof App>["mutateElementByIdWithValues"];
    bringToFrontElement: InstanceType<typeof App>["bringToFrontElement"];
    sendBackwardElements: InstanceType<typeof App>["sendBackwardElements"];
    bringForwardElements: InstanceType<typeof App>["bringForwardElements"];
    sendToBackElements: InstanceType<typeof App>["sendToBackElements"];
    toggleCollapseFrame: InstanceType<typeof App>["toggleCollapseFrame"];
    toggleLockElement: InstanceType<typeof App>["toggleLockElement"];
    toggleElementVisibility: InstanceType<typeof App>["toggleElementVisibility"];
    setZLayerIndexAfterElement: InstanceType<typeof App>["setZLayerIndexAfterElement"];
    setElementFrameId: InstanceType<typeof App>["setElementFrameId"];
    flipHorizontal: InstanceType<typeof App>["flipHorizontal"];
    flipVertical: InstanceType<typeof App>["flipVertical"];
    selectElements: InstanceType<typeof App>["selectElements"];
  };

  coordToRealMeasure: InstanceType<typeof App>["coordToRealMeasure"];
  realMeasureToCoord: InstanceType<typeof App>["realMeasureToCoord"];

  getAppState: () => InstanceType<typeof App>["state"];
  getScene: () => InstanceType<typeof App>["scene"];
  getFiles: () => InstanceType<typeof App>["files"];
  getName: InstanceType<typeof App>["getName"];
  executeAction: InstanceType<typeof App>["executeAction"];
  refresh: InstanceType<typeof App>["refresh"];

  setToast: InstanceType<typeof App>["setToast"];
  setAppState: InstanceType<typeof App>["setAppState"];
  addFiles: (data: BinaryFileData[]) => void;
  id: string;

  setCursor: InstanceType<typeof App>["setCursor"];
  resetCursor: InstanceType<typeof App>["resetCursor"];
  updateLibrary: InstanceType<typeof Library>["updateLibrary"];
  /**
   * Disables rendering of frames (including element clipping), but currently
   * the frames are still interactive in edit mode. As such, this API should be
   * used in conjunction with view mode (props.viewModeEnabled).
   */
  updateFrameRendering: InstanceType<typeof App>["updateFrameRendering"];
  onChange: (
    callback: (
      elements: readonly DucElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => void,
  ) => UnsubscribeCallback;
  onPointerDown: (
    callback: (
      activeTool: AppState["activeTool"],
      pointerDownState: PointerDownState,
      event: React.PointerEvent<HTMLElement>,
    ) => void,
  ) => UnsubscribeCallback;
  onPointerUp: (
    callback: (
      activeTool: AppState["activeTool"],
      pointerDownState: PointerDownState,
      event: PointerEvent,
    ) => void,
  ) => UnsubscribeCallback;
  onScrollChange: (
    callback: (scrollX: AppState["scrollX"], scrollY: AppState["scrollY"], zoom: AppState["zoom"]) => void,
  ) => UnsubscribeCallback;
  onUserFollow: (
    callback: (payload: OnUserFollowedPayload) => void,
  ) => UnsubscribeCallback;
}

export type Device = Readonly<{
  viewport: {
    isMobile: boolean;
    isLandscape: boolean;
  };
  editor: {
    isMobile: boolean;
    canFitSidebar: boolean;
  };
  isTouchScreen: boolean;
}>;

export type FrameNameBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

export type FrameNameBoundsCache = {
  get: (
    frameElement: DucFrameLikeElement | DucMagicFrameElement,
  ) => FrameNameBounds | null;
  _cache: Map<
    string,
    FrameNameBounds & {
      zoom: AppState["zoom"]["scoped"];
      versionNonce: DucFrameLikeElement["versionNonce"];
    }
  >;
};

export type KeyboardModifiersObject = {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

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

/** Eye dropper state that can be active or null */
export type EyeDropperState = {
  keepOpenOnAlt: boolean;
  swapPreviewOnAlt?: boolean;
  /** called when user picks color (on pointerup) */
  onSelect: (color: string, event: PointerEvent) => void;
  /**
   * property of selected elements to update live when alt-dragging.
   * Supply `null` if not applicable (e.g. updating the canvas bg instead of
   * elements)
   **/
  colorPickerType: any;
} | null;

/** Runtime gridSize value. Null indicates disabled grid. */
export type NullableGridSize =
  | (AppState["gridSize"] & MakeBrand<"NullableGridSize">)
  | null;


export type PendingDucElements = DucElement[];

export type LayerData = {
  id: string;
  name: string;
  icon?: string;
  type: string;
  children?: LayerData[];
  isCollapsed?: boolean;
};