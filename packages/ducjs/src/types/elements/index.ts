export * from "./typeChecks";

import { PrecisionValue, Scope } from "..";
import { BEZIER_MIRRORING, BLENDING, BOOLEAN_OPERATION, ELEMENT_CONTENT_PREFERENCE, HATCH_STYLE, IMAGE_STATUS, LINE_HEAD, LINE_SPACING_TYPE, STROKE_CAP, STROKE_JOIN, STROKE_PLACEMENT, STROKE_PREFERENCE, STROKE_SIDE_PREFERENCE, TEXT_ALIGN, VERTICAL_ALIGN } from "../../enums";

import {
  FONT_FAMILY,
  FREEDRAW_EASINGS,
} from "../../utils/constants";
import { GeometricPoint, Percentage, Radian, ScaleFactor } from "../geometryTypes";
import { MakeBrand, MarkNonNullable, MarkOptional, Merge, ValueOf } from "../utility-types";



/**
 * Base styles that all elements share
 */
export type _DucElementStylesBase = {
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
}

/**
 * Base element properties that all elements share
 */
export type _DucElementBase = Readonly<_DucElementStylesBase & {
  id: string;
  x: PrecisionValue;
  y: PrecisionValue;

  /**
   * The scope where the element is currently
   * mm, cm, m, in, ft, yd, mi, etc...
   */
  scope: Scope;

  label: string;
  isVisible: boolean;

  width: PrecisionValue;
  height: PrecisionValue;
  angle: Radian;
  /** Random integer used to seed shape generation
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
  /** Whether the element is deleted */
  isDeleted: boolean;
  /** 
   * List of regions the element belongs. 
   * Used to define boolean operations between elements.
   * Ordered from deepest to shallowest. 
  */
  regionIds: readonly RegionId[];
  /** 
   * List of groups the element belongs to.
   * Ordered from deepest to shallowest. 
   */
  groupIds: readonly GroupId[];

  /** 
   * List of blocks this element helps *define*. 
   * If this is populated, `instanceId` should be null.
   */
  blockIds: readonly BlockId[];

  /** 
   * The ID of the `DucBlockInstance` this element belongs to.
   * If not null, `blockIds` is empty (the relationship to the Block is via the Instance).
   */
  instanceId: InstanceId | null;

  /** The layer the element belongs to */
  layerId: string | null;
  /** The frame the element belongs to */
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

export type FillStyle = ValueOf<typeof ELEMENT_CONTENT_PREFERENCE>;
export type StrokePlacement = ValueOf<typeof STROKE_PLACEMENT>;
export type Blending = ValueOf<typeof BLENDING>;


//// //// === GENERIC TYPES ===

export type GroupId = string;
export type BlockId = string;
export type InstanceId = string;
export type LayerId = string;
export type RegionId = string;
export type PointerType = "mouse" | "pen" | "touch";
export type FractionalIndex = string & { _brand: "franctionalIndex" };
export type ImageStatus = ValueOf<typeof IMAGE_STATUS>;
export type ExternalFileId = string & { _brand: "ExternalFileId" };
export type BooleanOperation = ValueOf<typeof BOOLEAN_OPERATION>;

/**
 * Map of duc elements.
 * Unspecified whether deleted or non-deleted.
 * Can be a subset of Scene elements.
 */
export type ElementsMap = Map<DucElement["id"], DucElement>;


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
  | DucArrowElement
  | DucImageElement
  | DucFrameElement
  | DucEmbeddableElement
  | DucTableElement
  | DucDocElement
  | DucEllipseElement
  | DucPolygonElement
  | DucModelElement
  | DucPlotElement
  | DucPdfElement

export type DucElementTypes = DucElement["type"];

export type NonDeleted<TElement extends DucElement> = TElement & {
  isDeleted: boolean;
};

export type NonDeletedDucElement = NonDeleted<DucElement> & {
  idx?: number;
};

export type DucBinderElement =
  | DucLinearElement
  | DucArrowElement;

export type DucBindableElement =
  | DucRectangleElement
  | DucPolygonElement
  | DucEllipseElement
  | DucTextElement
  | DucImageElement
  | DucEmbeddableElement
  | DucFrameElement
  | DucTableElement
  | DucDocElement
  | DucLinearElement
  | DucPdfElement;

export type DucTextContainer =
  | DucRectangleElement
  | DucPolygonElement
  | DucEllipseElement
  | DucArrowElement;

export type DucFlowchartNodeElement =
  | DucRectangleElement
  | DucPolygonElement
  | DucEllipseElement;


export type RectangularElement =
  | DucRectangleElement
  | DucPolygonElement
  | DucFrameLikeElement
  | DucEmbeddableElement
  | DucImageElement
  | DucTextElement
  | DucSelectionElement
  | DucDocElement
  | DucTableElement
  | DucPlotElement
  | DucPdfElement;


export type DucStackLikeElement =
  | DucPlotElement
  | DucFrameElement;

export type DucLinearLikeElement =
  | DucLinearElement
  | DucArrowElement;

export type DucFrameLikeElement =
  | DucPlotElement
  | DucFrameElement;


export type DucIframeLikeElement =
  | DucEmbeddableElement
  | DucTableElement
  | DucDocElement;

export type ElementConstructorOpts = MarkOptional<
  Omit<DucGenericElement, "id" | "type" | "isDeleted" | "updated">,
  | "width"
  | "height"
  | "angle"
  | "groupIds"
  | "blockIds"
  | "instanceId"
  | "frameId"
  | "index"
  | "boundElements"
  | "seed"
  | "version"
  | "versionNonce"
  | "link"
  | "background"
  | "stroke"
  | "roundness"
  | "locked"
  | "opacity"
  | "customData"
  | "isVisible"
  | "description"
  | "scope"
  | "blending"
  | "isPlot"
  | "regionIds"
  | "layerId"
>;

export type ElementUpdate<TElement extends DucElement> = Omit<
  Partial<TElement>,
  "id" | "version" | "versionNonce" | "updated"
>;


export type DucElementType = DucElement["type"];

export type DucCommonStyle = {
  background: ElementBackground;
  stroke: ElementStroke;
}


// ideally this would be a branded type but it'd be insanely hard to work with
// in our codebase
export type DucElementsIncludingDeleted = readonly DucElement[];

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





//// // === HATCHING ===

export type HatchStyle = ValueOf<typeof HATCH_STYLE>;

/**
 * Pattern line definition for custom hatch patterns
 */
export type HatchPatternLine = {
  /** Line angle in radians */
  angle: Radian;
  /** Line origin point */
  origin: DucPoint;
  /** Offset between parallel lines [x, y] */
  offset: [PrecisionValue, PrecisionValue];
  /** Dash pattern (empty array = solid line) */
  dashPattern: PrecisionValue[];
};

/**
 * Custom hatch pattern definition
 */
export type CustomHatchPattern = {
  /** Pattern name */
  name: string;
  /** Pattern description */
  description?: string;
  /** Pattern line definitions */
  lines: HatchPatternLine[];
};

/**
 * Hatch style configuration
 */
export type DucHatchStyle = {
  /** Default hatch style */
  hatchStyle: HatchStyle;

  /** Default pattern properties */
  pattern: {
    /** Pattern name (for predefined) or reference to custom pattern */
    name: string;
    /** Pattern scale factor */
    scale: number;
    /** Pattern rotation angle */
    angle: Radian;
    /** Pattern origin point */
    origin: DucPoint;
    /** Double pattern (second pattern at 90 degrees) */
    double: boolean;
  };

  customPattern?: CustomHatchPattern;
};


//// // === TILING ===
export type TilingProperties = {
  sizeInPercent: Percentage;
  angle: Radian;
  spacing?: number; // Gap between tiles
  offsetX?: number;
  offsetY?: number;
};


//// // === STROKE ===
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
   * Override the dash line into a custom shape
   */
  dashLineOverride?: InstanceId;
  /**
   * The cap of the dash
   * @default butt
   */
  dashCap?: StrokeCap;
  /**
   * The miter limit of the stroke
   */
  miterLimit?: number;
}

export type StrokeSidePreference = ValueOf<typeof STROKE_SIDE_PREFERENCE>;
export type StrokeSides = {
  preference: StrokeSidePreference;
  values?: number[]; // [0, 1] for x and y || [0, 1, 2, 3] for top, bottom, left, right
}


//// // === STYLING CONTENT ===
export type ElementContentBase = {
  preference: FillStyle;
  src: string; // Can be a color, gradient, image, DucBlock, (fileId or url), frame element's content `@el/${elementId}`
  visible: boolean;
  opacity: Percentage;
  tiling?: TilingProperties;
  hatch?: DucHatchStyle;
  imageFilter?: DucImageFilter;
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



//// //// === SIMPLE ELEMENTS ===

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

export type DucEmbeddableElement = _DucElementBase & {
  type: "embeddable";
};

/**
 * Configuration for PDF grid layout
 */
export type DocumentGridConfig = {
  /** 1 = single, 2 = two-up, n = grid */
  columns: number;
  /** Horizontal spacing (px) */
  gapX: number;
  /** Vertical spacing (px) */
  gapY: number;
  /** Cover page behavior for 2+ columns */
  firstPageAlone: boolean;
  /**
   * The scale factor of the element (Drawing Units / Real World Units).
   * The scale factor is strictly a ratio and is unitless.
   * Example: 1:300 => 0.00333, 1:1 => 1, 5:1 => 5
   */
  scale: number;
}

export type DucPdfElement = _DucElementBase & {
  type: "pdf";
  fileId: ExternalFileId | null;

  /** Configuration for rendering the document in a grid layout */
  gridConfig: DocumentGridConfig;
};


//// === TABLE ELEMENTS ===

/** Source of truth is the linked xlsx file */
export type DucTableElement = _DucElementBase & {
  type: "table";
  fileId: ExternalFileId | null;
};

//// === IMAGE ELEMENTS ===

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

export type DucImageElement = _DucElementBase & {
  type: "image";
  fileId: ExternalFileId | null;
  /** whether respective file is persisted */
  status: ImageStatus;
  /** X and Y scale factors <-1, 1>, used for image axis flipping */
  scaleFlip: [number, number];
  /** whether an element is cropped */
  crop: ImageCrop | null;
  filter: DucImageFilter | null;
};

export type InitializedDucImageElement = MarkNonNullable<
  DucImageElement,
  "fileId"
>;



//// === TEXT ELEMENTS ===
export type FontFamilyKeys = keyof typeof FONT_FAMILY;
export type FontFamilyValues = typeof FONT_FAMILY[FontFamilyKeys];
/** Font family identifier — any valid CSS font-family string (Google Font name, system font, etc.) */
export type FontString = string;
export type TextAlign = ValueOf<typeof TEXT_ALIGN>;
export type VerticalAlign = ValueOf<typeof VERTICAL_ALIGN>;
export type LineSpacingType = ValueOf<typeof LINE_SPACING_TYPE>;

export type DucTextStyle = {
  /** 
   * Whether the text is left-to-right or right-to-left
   * @default true
   */
  isLtr: boolean;

  /**
  * The primary font family to use for the text
  */
  fontFamily: FontString;
  /**
   * Fallback font family for broader compatibility across all systems and languages
   * Useful for emojis, non-latin characters, etc.
   */
  bigFontFamily: string;

  /** Horizontal alignment of the text within its bounding box */
  textAlign: TextAlign;

  /** Vertical alignment of the text within its bounding box */
  verticalAlign: VerticalAlign;

  /**
   * Unitless line height multiplier (follows W3C standard).
   * Actual line height in drawing units = fontSize × lineHeight
   * Use `getLineHeightInPx` helper for pixel calculations.
   * 
   * @example 1.2 means 20% extra space between lines
   */
  lineHeight: number & { _brand: "unitlessLineHeight" };
  /**
   * Defines the line spacing properties for text.
   */
  lineSpacing: {
    /**
     * The numerical value for the line spacing.
     * Its interpretation depends on the `type` property.
     */
    value: PrecisionValue | ScaleFactor;

    /**
     * Determines how the line spacing factor is applied.
     * - `at_least`: The line spacing is the larger of the `value` or the tallest character's natural height.
     * This ensures text doesn't overlap but respects a minimum spacing.
     * - `exactly`: Forces the line spacing to the specified `value`, even if characters
     * (especially tall ones like ascenders/descenders or special symbols) overlap.
     * Useful for precise layout control where overlapping might be acceptable or handled externally.
     * - `multiple`: The base line height (often derived from the font's intrinsic metrics and font size)
     * is multiplied by the `value` (e.g., a `value` of 1.5 would mean 150% of the base line height).
     * This is very common for relative spacing.
     */
    type: LineSpacingType;
  }
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
  widthFactor: ScaleFactor;

  /** Render upside down */
  isUpsideDown: boolean;

  /** Render backwards/mirrored */
  isBackwards: boolean;
}


export type DucTextElement = _DucElementBase & DucTextStyle & {
  type: "text";

  /**
   * The display text, which can contain zero or more placeholders in the
   * format `{{tag}}`. Each tag corresponds to an object in the `dynamic` array.
   * Example: "Part: {{PN}} on Layer: {{LAYER}}"
   */
  text: string;

  /**
   * Text sizing behavior:
   * - `true`: Width adjusts to fit text content (single line or natural wrapping)
   * - `false`: Text wraps to fit within the element's fixed width
   * @default true
   */
  autoResize: boolean;

  /** The ID of an element that this text is contained within (e.g., for labels on shapes) */
  containerId: DucGenericElement["id"] | null;

  /** A non-rendered, original version of the text, e.g., before finishing writing the text */
  originalText: string;
};


export type DucTextElementWithContainer = {
  containerId: DucTextContainer["id"];
} & DucTextElement;





//// === LINEAR ELEMENTS ===

export type LineHead = ValueOf<typeof LINE_HEAD>;

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
  head: DucHead | null;
};

export type DucHead = {
  type: LineHead;
  blockId: string | null; // If the head is a block, this is the id of the block
  size: PrecisionValue;
}

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

export type _DucLinearElementBase = _DucElementBase & {
  points: readonly DucPoint[];
  lines: readonly DucLine[];
  pathOverrides: readonly DucPath[];
  lastCommittedPoint: DucPoint | null;
  startBinding: DucPointBinding | null;
  endBinding: DucPointBinding | null;
}

export type DucLinearElement = _DucLinearElementBase & {
  type: "line";
  /**
   * If true, the element's shape will wipe out the content below the element
   * @default false
   */
  wipeoutBelow: boolean;
};

export type DucArrowElement = _DucLinearElementBase & {
  type: "arrow";
  elbowed: boolean;
};


export type DucElbowArrowElement = Merge<
  DucArrowElement,
  {
    elbowed: true;
    startBinding: FixedPointBinding | null;
    endBinding: FixedPointBinding | null;
  }
>;

export type FixedPoint = GeometricPoint;


export type FixedPointBinding = Merge<DucPointBinding, { fixedPoint: FixedPoint }>;
export type BoundElement = {
  id: DucLinearElement["id"];
  type: DucElementTypes;
}






//// === FREE DRAW ELEMENTS ===

export type DucFreeDrawEasing = typeof FREEDRAW_EASINGS[keyof typeof FREEDRAW_EASINGS];
export type DucFreeDrawEnds = {
  cap: boolean;
  taper: number;
  easing: DucFreeDrawEasing;
}
export type DucFreeDrawElement = _DucElementBase & {
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
  svgPath: string | null; // optional cached SVG string
};





//// === BLOCK ELEMENTS ===

export type DucBlockDuplicationArray = {
  rows: number;
  cols: number;
  rowSpacing: PrecisionValue;
  colSpacing: PrecisionValue;
}

/**
 * Indicates the source drawing of a block.
 */
export type BlockSource = string;

export interface BlockLocalizationEntry {
  title: string;
  description?: string;
}

/**
 * A mapping of locale codes to their corresponding localized block metadata.
 * The keys represent locales in a BCP-47 standard language tag format (e.g., "en-US", "fr-FR").
 */
export type BlockLocalizationMap = Record<string, BlockLocalizationEntry>;

export interface DucBlockMetadata {
  /** Drawing id this block originates from */
  source?: BlockSource;
  /** Total number of times the block was instantiated */
  usageCount: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Localization metadata */
  localization?: BlockLocalizationMap;
}

/**
 * Defines the "Blueprint" for a reusable component.
 * 
 * **Element Relationship Logic:**
 * The connection between this Block Definition and `_DucElementBase` depends on the state:
 * 
 * 1. **Definition State (Source):** 
 *    - Elements that define the geometry of this block have this `id` inside their `element.blockIds`.
 *    - Their `element.instanceId` is `null`.
 * 
 * 2. **Instance State (Usage):** 
 *    - When instantiated via `DucBlockInstance`, the rendered elements have `element.instanceId` set (not null).
 *    - Crucially, these instance elements have **empty** `element.blockIds`.
 *    - The relationship is resolved indirectly: `Element.instanceId` -> `DucBlockInstance.blockId` -> `DucBlock.id`.
 */
export type DucBlock = {
  id: BlockId;
  label: string;
  description?: string;
  version: number;

  /** Block metadata including source, usage count, timestamps, and localization */
  metadata?: DucBlockMetadata;

  /** Cached thumbnail image for the block (webp format) */
  thumbnail?: Uint8Array;
};

export type DucBlockInstance = { //Instance of a block definition
  id: InstanceId;
  /** The reference to the DucBlock definition this instance is based on */
  blockId: string;

  /** The version that should match the blockId's version, incremented on each change */
  version: number;

  /**
   * Keys are the element ids of the block instance
   * Values are the element overrides
   * <string, string> <=> <elementId, path to field on the element (via JSON RFC6902 style path)>
   */
  elementOverrides?: Record<string, string>;

  duplicationArray: DucBlockDuplicationArray | null;
};


export type DucBlockCollection = {
  id: string;
  label: string;

  /** 
   * True if pointing to another collection, False if pointing to a block.
   */
  children: Array<{
    isCollection: boolean;
    id: string;
  }>;

  metadata?: DucBlockMetadata;
  thumbnail?: Uint8Array;
};






//// // === STACK-LIKE ELEMENTS ===

export type _DucStackBase = DucStackLikeStyles & {
  label: string
  description: string | null;

  isCollapsed: boolean;

  isPlot: _DucElementBase["isPlot"];
  isVisible: _DucElementBase["isVisible"];
  locked: _DucElementBase["locked"];
};

export type DucStackLikeStyles = {
  opacity: _DucElementBase["opacity"];
}

export type _DucStackElementBase = _DucElementBase & _DucStackBase & {
  clip: boolean;
  labelVisible: boolean;
};

export type DucFrameElement = _DucStackElementBase & {
  type: "frame";
};

export type DucGroup = _DucStackBase & {
  id: GroupId;
};

export type DucRegion = _DucStackBase & {
  id: RegionId;

  /** The boolean operation to apply to all child elements. */
  booleanOperation: BooleanOperation;
};


/**
 * Defines a Layer, a named collection of properties that can be inherited by elements.
 * A Layer is a logical concept, not a spatial one. It provides a central point of
 * control for the visual appearance (stroke, background, opacity) and behavior
 * (visibility, locking, plotting) of elements assigned to it.
 * 
 */
export type DucLayer = _DucStackBase & {
  id: LayerId;

  readonly: boolean;

  /** A container for the default styling properties that elements on this layer will inherit */
  overrides: {
    stroke: ElementStroke;
    background: ElementBackground;
  } | null;
};




//// === PLOT ELEMENTS ===

/**
 * Defines the properties of a printable area, including size and margins.
 */
export type PlotLayout = {
  /** Margins inset from the edge of the paper. */
  margins: {
    top: PrecisionValue;
    right: PrecisionValue;
    bottom: PrecisionValue;
    left: PrecisionValue;
  };
};
export type DucPlotStyle = {};
/**
 * A DucPlotElement represents a finite layout or "paper space" within the infinite canvas.
 * It serves as a container for viewports and other annotations, defining the final
 * composition for printing or exporting. The element's own width/height should match
 * the paperWidth/paperHeight defined in its layout.
 */
export type DucPlotElement = _DucStackElementBase & DucPlotStyle & {
  type: "plot";

  /** The layout definition for this plot, including paper size and margins. */
  layout: PlotLayout;
};



//// === Doc Element ===

export type DucDocStyle = {};

export type DucDocElement = _DucElementBase & {
  type: "doc";
  text: string;
  fileId: ExternalFileId | null;
  /** Configuration for rendering the document in a grid layout */
  gridConfig: DocumentGridConfig;
};








//// === 3D Model Element ===

export type Viewer3DClipPlane = {
  enabled: boolean;
  value: number;
  normal: [number, number, number] | null;
};

export type Viewer3DMaterial = {
  metalness: number;
  roughness: number;
  defaultOpacity: number;
  /** Packed RGB color (e.g. 0xFFFFFF) */
  edgeColor: number;
  ambientIntensity: number;
  directIntensity: number;
};

export type Viewer3DZebra = {
  active: boolean;
  stripeCount: number;
  stripeDirection: number;
  /** Available: "blackwhite" | "colorful" | "grayscale" */
  colorScheme: string;
  opacity: number;
  /** Available: "reflection" | "normal" */
  mappingMode: string;
};

export type Viewer3DCamera = {
  /** Available: "orbit" | "trackball" */
  control: string;
  ortho: boolean;
  /** Available: "Z" | "Y" */
  up: string;
  position: [number, number, number];
  /** Camera rotation as quaternion [x, y, z, w] */
  quaternion: [number, number, number, number];
  /** The point the camera orbits around / looks at */
  target: [number, number, number];
  zoom: number;
  panSpeed: number;
  rotateSpeed: number;
  zoomSpeed: number;
  holroyd: boolean;
};

export type Viewer3DGridPlanes = {
  xy: boolean;
  xz: boolean;
  yz: boolean;
};

export type Viewer3DGrid =
  | { type: "uniform"; value: boolean }
  | { type: "perPlane"; planes: Viewer3DGridPlanes };

export type Viewer3DDisplay = {
  wireframe: boolean;
  transparent: boolean;
  blackEdges: boolean;
  grid: Viewer3DGrid;
  /** Whether to show the XYZ axes indicator */
  axesVisible: boolean;
  /** If true, axes are positioned at world origin (0,0,0); if false, at object center */
  axesAtOrigin: boolean;
};

export type Viewer3DClipping = {
  x: Viewer3DClipPlane;
  y: Viewer3DClipPlane;
  z: Viewer3DClipPlane;
  intersection: boolean;
  showPlanes: boolean;
  objectColorCaps: boolean;
};

export type Viewer3DExplode = {
  active: boolean;
  value: number;
};

export type Viewer3DState = {
  camera: Viewer3DCamera;
  display: Viewer3DDisplay;
  material: Viewer3DMaterial;
  clipping: Viewer3DClipping;
  explode: Viewer3DExplode;
  zebra: Viewer3DZebra;
};

/**
 * An element that embeds a 3D model on the 2D canvas.
 * It includes its own 3D view and display controls.
 */
export type DucModelElement = _DucElementBase & {
  type: "model";

  /** The specific type of 3D model, e.g., "PYTHON", "DXF", "IFC", "STL", "OBJ", "STEP", etc. */
  modelType: string | null;

  /** Defines the source code of the model using build123d python code */
  code: string | null;

  /** The last known SVG path representation of the 3D model for quick rendering on the canvas */
  svgPath: string | null;

  /** Possibly connected external files, such as STEP, STL, DXF, etc. */
  fileIds: ExternalFileId[];

  /** The last known 3D viewer state for the model */
  viewerState: Viewer3DState | null;
};