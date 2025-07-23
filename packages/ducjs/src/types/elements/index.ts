export * from "./typeChecks";

import { BEZIER_MIRRORING, BLENDING, BLOCK_ATTACHMENT, BOOLEAN_OPERATION, COLUMN_TYPE, DATUM_BRACKET_STYLE, DATUM_TARGET_TYPE, DIMENSION_FIT_RULE, DIMENSION_TEXT_PLACEMENT, DIMENSION_TYPE, ELEMENT_CONTENT_PREFERENCE, FEATURE_MODIFIER, GDT_SYMBOL, HATCH_STYLE, IMAGE_STATUS, LINE_HEAD, LINE_SPACING_TYPE, MARK_ELLIPSE_CENTER, MATERIAL_CONDITION, STACKED_TEXT_ALIGN, STROKE_CAP, STROKE_JOIN, STROKE_PLACEMENT, STROKE_PREFERENCE, STROKE_SIDE_PREFERENCE, TABLE_CELL_ALIGNMENT, TABLE_FLOW_DIRECTION, TEXT_ALIGN, TEXT_FIELD_SOURCE_PROPERTY, TEXT_FIELD_SOURCE_TYPE, TEXT_FLOW_DIRECTION, TOLERANCE_DISPLAY, TOLERANCE_TYPE, TOLERANCE_ZONE_TYPE, VERTICAL_ALIGN, VIEWPORT_SHADE_PLOT } from "ducjs/duc";
import { Standard, StandardUnits } from "ducjs/technical/standards";
import { DucView, PrecisionValue, Scope } from "ducjs/types";
import { Axis, GeometricPoint, Percentage, Radian, ScaleFactor } from "ducjs/types/geometryTypes";
import { MakeBrand, MarkNonNullable, MarkOptional, Merge, ValueOf } from "ducjs/types/utility-types";
import {
  FONT_FAMILY,
  FREEDRAW_EASINGS,
} from "ducjs/utils/constants";




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
type _DucElementBase = Readonly<_DucElementStylesBase & {
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
  /** Whether the element is annotative (scales with DucViewport) */
  isAnnotative: boolean;
  /** Whether the element is deleted */
  isDeleted: boolean;
  /** 
   * List of groups the element belongs to.
   * Ordered from deepest to shallowest. 
   */
  groupIds: readonly GroupId[];
  /** 
   * List of regions the element belongs. 
   * Used to define boolean operations between elements.
   * Ordered from deepest to shallowest. 
   */
  regionIds: readonly RegionId[];
  /** The layer the element belongs to */
  layerId: string;
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
  | DucImageElement
  | DucFrameElement
  | DucEmbeddableElement
  | DucTableElement
  | DucDocElement
  | DucEllipseElement
  | DucBlockInstanceElement
  | DucPolygonElement
  | DucParametricElement
  | DucFeatureControlFrameElement
  | DucLeaderElement
  | DucDimensionElement
  | DucViewportElement
  | DucPlotElement
  | DucXRayElement
  | DucPdfElement
  | DucMermaidElement;


export type DucElementTypes = DucElement["type"];

export type NonDeleted<TElement extends DucElement> = TElement & {
  isDeleted: boolean;
};

export type NonDeletedDucElement = NonDeleted<DucElement> & {
  idx?: number;
};

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
  | DucFeatureControlFrameElement
  | DucLinearElement
  | DucPdfElement
  | DucMermaidElement;

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
  | DucFeatureControlFrameElement
  | DucViewportElement
  | DucPlotElement
  | DucPdfElement
  | DucBlockInstanceElement;


export type DucStackLikeElement =
  | DucPlotElement
  | DucViewportElement
  | DucFrameElement;


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
  dashLineOverride?: DucBlockInstanceElement["id"];
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

export type DucPdfElement = _DucElementBase & {
  type: "pdf";
  fileId: ExternalFileId | null;
};

export type DucMermaidElement = _DucElementBase & {
  type: "mermaid";
  source: string; // Mermaid syntax
  /** if not provided, the theme will be the same as the document's theme, or default to 'default'
   * we decided to go with a string type because of the unpredictably of having different themes 
   */
  theme?: string;
  svgPath: string | null;// optional cached SVG string
};


//// === TABLE ELEMENTS ===

export type TableCellAlignment = ValueOf<typeof TABLE_CELL_ALIGNMENT>;
export type TableFlowDirection = ValueOf<typeof TABLE_FLOW_DIRECTION>;


/**
 * Defines the styling for an individual cell or a default for all cells.
 * These properties can be overridden at the row, column, and individual cell levels.
 */
export type DucTableCellStyle = _DucElementStylesBase & {
  /** The text style for content within the cell */
  textStyle: DucTextStyle;
  /** Margin space inside the cell, between the content and the border */
  margins: {
    top: PrecisionValue;
    right: PrecisionValue;
    bottom: PrecisionValue;
    left: PrecisionValue;
  };
  /** The alignment of content within the cell */
  alignment: TableCellAlignment;
};

/**
 * Defines the overall style for a DucTableElement.
 * It sets the defaults for rows, columns, and cells, which can be
 * individually overridden.
 */
export type DucTableStyle = _DucElementStylesBase & {
  /** The direction in which new rows are added */
  flowDirection: TableFlowDirection;
  /** Default style for the header row(s) */
  headerRowStyle: DucTableCellStyle;
  /** Default style for the data row(s) */
  dataRowStyle: DucTableCellStyle;
  /** Default style for the data column(s) */
  dataColumnStyle: DucTableCellStyle;
};

export type DucTableColumn = {
  id: string;
  width: PrecisionValue;
  /** Style overrides for this column */
  styleOverrides?: Partial<DucTableCellStyle>;
};

export type DucTableRow = {
  id: string;
  height: PrecisionValue;
  /** Style overrides for this row */
  styleOverrides?: Partial<DucTableCellStyle>;
};

export type DucTableCell = {
  rowId: string;
  columnId: string;

  /** 
   * The content of the cell, stored as a Markdown string. This allows for rich text
   * within cells without complicating the table's main data structure.
   */
  data: string;

  /** 
   * Defines if and how this cell merges with adjacent cells.
   * A span of 1 means no merging.
   * The root cell of a merge (top-left) holds the content and span data.
   * Other cells covered by the span are effectively hidden.
   */
  span?: {
    /** Number of columns this cell spans to the right */
    columns: number; // Default: 1
    /** Number of rows this cell spans downwards */
    rows: number; // Default: 1
  };

  /** Whether the content of this cell can be edited */
  locked: boolean;

  /** 
   * Style overrides for this specific cell.
   * Any property set here will take precedence over row, column, and table styles.
   */
  styleOverrides?: Partial<DucTableCellStyle>;
};

/**
 * A structured table element composed of rows, columns, and cells.
 * Its data is normalized for efficient updates, and styling is applied
 * hierarchically. The element's base `stroke` and `background` style the
 * outer border and fill.
 */
export type DucTableElement = _DucElementBase & DucTableStyle & {
  type: "table";

  /** An ordered list of column IDs, defining the horizontal layout */
  columnOrder: readonly string[];
  /** An ordered list of row IDs, defining the vertical layout */
  rowOrder: readonly string[];

  /** A record of all column definitions, keyed by their ID */
  columns: Readonly<Record<string, DucTableColumn>>;
  /** A record of all row definitions, keyed by their ID */
  rows: Readonly<Record<string, DucTableRow>>;
  /** 
   * A record of all cell data, keyed by a composite "rowId:columnId" string.
   * This flat structure is efficient for lookups and updates.
   */
  cells: Readonly<Record<string, DucTableCell>>;

  /** Number of top rows to be treated as headers, using the headerRowStyle */
  headerRowCount: number;

  /** Whether table auto-sizes to content */
  autoSize: {
    columns: boolean;
    rows: boolean;
  };
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
  scale: [number, number];
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
export type FontString = string & { _brand: "fontString" };
export type TextAlign = ValueOf<typeof TEXT_ALIGN>;
export type VerticalAlign = ValueOf<typeof VERTICAL_ALIGN>;
export type LineSpacingType = ValueOf<typeof LINE_SPACING_TYPE>;
export type TextFieldSourceProperty = ValueOf<typeof TEXT_FIELD_SOURCE_PROPERTY>;

export type DucTextStyle = _DucElementStylesBase & {
  /** 
   * Whether the text is left-to-right or right-to-left
   * @default true
   */
  isLtr: boolean;

  /**
  * The primary font family to use for the text
  */
  fontFamily: FontFamilyValues;
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
  /** Desired height on printed page (for annotative text) */
  paperTextHeight?: PrecisionValue;
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
   * An array of metadata objects that define the behavior of the placeholders
   * found in the `text` property. If this is empty, the text is treated
   * as purely static.
   */
  dynamic: readonly DucTextDynamicPart[];

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


/**
 * A discriminated union that precisely defines the source of a dynamic part's data.
 * This structure is highly extensible.
 */
export type DucTextDynamicSource =
  | {
    sourceType: TEXT_FIELD_SOURCE_TYPE.ELEMENT;
    /** The unique ID of the source element. */
    elementId: DucElement["id"];
    /** The specific property to retrieve from the source element. */
    property: TextFieldSourceProperty;
  }
  | {
    sourceType: TEXT_FIELD_SOURCE_TYPE.DICTIONARY;
    /** The key to look up in the global drawing dictionary. */
    key: string;
  };

/**
 * Defines a single dynamic component within a text string.
 * This object contains all the metadata needed to resolve and format a placeholder.
 */
export type DucTextDynamicPart = {
  /**
   * A unique key for this part, which matches the placeholder in the text string.
   * E.g., for a placeholder `{{PartNumber}}`, the tag would be "PartNumber".
   */
  tag: string;

  /** The source of the data for this dynamic part. */
  source: DucTextDynamicSource;

  /** Formatting rules for displaying the final value. */
  formatting?: StandardUnits["primaryUnits"];

  /** The last known value, used as a fallback or for initial display. */
  cachedValue: string;
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
 * Defines the schema for a single attribute within a block definition.
 */
export type DucBlockAttributeDefinition = {
  /** The unique identifier for this attribute within the block (e.g., "PART_NUMBER"). */
  tag: string;
  /** The prompt displayed to the user when inserting the block (e.g., "Enter the part number:"). */
  prompt?: string;
  /** The default value for this attribute. */
  defaultValue: string;
  /** If true, the attribute's value is fixed and cannot be changed after insertion. */
  isConstant: boolean;
};

export type DucBlock = {
  id: string;
  label: string;
  description?: string;
  version: number;

  /** An array of all elements that constitute the block's geometry and annotations. */
  elements: readonly DucElement[];

  /**
   * A record of attribute definitions for this block, keyed by their tag.
   * This defines the "slots" for data that each instance can fill.
   */
  attributeDefinitions: Readonly<Record<string, DucBlockAttributeDefinition>>;
};

export type DucBlockInstanceElement = _DucElementBase & { //Instance of a block definition
  type: "blockinstance";
  blockId: string;

  /**
   * Keys are the element ids of the block instance
   * Values are the element overrides
   */
  elementOverrides?: Record<string, string>;

  /**
   * A record of the actual values for the attributes of this specific instance,
   * keyed by the attribute tag defined in the DucBlock.
   */
  attributeValues?: Readonly<Record<string, string>>;

  duplicationArray: DucBlockDuplicationArray | null;
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
  labelingColor: string;
}

export type _DucStackElementBase = _DucElementBase & _DucStackBase & {
  clip: boolean;
  labelVisible: boolean;

  /** Everything inside the stack will use this standard */
  standardOverride: Standard["id"] | null;
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
  };
};




//// === VIEWPORT ELEMENTS ===

/**
 * Viewport scale represents how model space is displayed in a viewport.
 * For a scale notation A:B, this represents the ratio A/B.
 * 
 * Examples:
 * - 1:200 viewport → ViewportScale = 1/200 = 0.005
 * - 1:50 viewport → ViewportScale = 1/50 = 0.02
 * - 1:1 viewport → ViewportScale = 1/1 = 1
 * - 2:1 viewport → ViewportScale = 2/1 = 2
 * - 10:1 viewport → ViewportScale = 10/1 = 10
 * 
 * This represents how much model space is "zoomed" in the viewport.
 */
export type ViewportScale = number & { _brand: "viewportScale" };

/**
 * Annotation scale represents the factor by which annotative objects
 * are scaled to maintain consistent appearance across different viewport scales.
 * For a scale notation A:B, this represents B/A.
 * 
 * Examples:
 * - 1:200 drawing → AnnotationScale = 200/1 = 200
 * - 1:50 drawing → AnnotationScale = 50/1 = 50
 * - 1:1 drawing → AnnotationScale = 1/1 = 1
 * - 2:1 drawing → AnnotationScale = 1/2 = 0.5
 * - 10:1 drawing → AnnotationScale = 1/10 = 0.1
 * 
 * This is typically the inverse of the viewport scale.
 */
export type AnnotationScale = number & { _brand: "annotationScale" };


export type ViewportShadePlot = ValueOf<typeof VIEWPORT_SHADE_PLOT>;


/** 
 * This is the style for the viewport element
 * Grid settings, UCS, Snapping and more can be overridden through the overrideStandard property from the _DucStackElementBase
 */
export type DucViewportStyle = _DucElementStylesBase & {
  scaleIndicatorVisible: boolean;
};
export type DucViewportElement = _DucLinearElementBase & _DucStackBase & DucViewportStyle & {
  type: "viewport";

  /** View configuration */
  view: DucView;

  /** Viewport scale settings */
  scale: ViewportScale;

  /** Shade plot setting */
  shadePlot: ViewportShadePlot;

  /** Frozen layers in this viewport */
  frozenGroupIds: GroupId[];

  /** Everything inside the viewport will use this standard */
  standardOverride: Standard["id"] | null;
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
export type DucPlotStyle = _DucElementStylesBase & {};
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


//// === XRAY ELEMENTS ===

export type DucXRayStyle = _DucElementStylesBase & {
  /**
   * The color of the x-ray
   */
  color: string;
};
export type DucXRayElement = _DucElementBase & DucXRayStyle & {
  type: "xray"
  origin: DucPoint;
  direction: DucPoint;
  /**
   * If true, the x-ray will start from the origin.
   * If false, the x-ray will be a full infinite line.
   * @default false
   */
  startFromOrigin: boolean;
}


//// === LEADER ELEMENTS ===

export type BlockAttachment = ValueOf<typeof BLOCK_ATTACHMENT>;

/**
 * Defines the visual appearance and behavior of a leader.
 */
export type DucLeaderStyle = _DucElementStylesBase & {
  /**
   * Override the heads of the leader
   * The tuple represents [startHead, endHead]
   */
  headsOverride?: [DucHead, DucHead];

  /** The "dogleg" or "landing" segment that connects the leader line to the content. */
  dogleg?: PrecisionValue;

  /** Default styling for text content. */
  textStyle: DucTextStyle;

  /** 
   * How the text content attaches to the leader's landing line.
   * 'top': Text is below the line. 'middle': Text is centered on the line.
   */
  textAttachment: VerticalAlign;

  /** How the block content attaches to the leader's landing line. */
  blockAttachment: BlockAttachment;
};
/**
 * Defines the content attached to a leader. The leader is atomic, so its
 * content is defined within it, not as a separate scene element.
 */
export type LeaderContent =
  | {
    type: "text";
    /** The rich text or markdown string for the content. */
    text: DucTextElement["text"];
  }
  | {
    type: "block";
    /** The ID of the DucBlock definition to use as content. */
    blockId: DucBlockInstanceElement["blockId"];
    /**
     * The attribute values and element overrides for this specific block instance.
     * This is a subset of the properties from DucBlockInstanceElement.
     */
    instanceData: {
      attributeValues?: DucBlockInstanceElement["attributeValues"];
      elementOverrides?: DucBlockInstanceElement["elementOverrides"];
    };
  };
/**
 * A leader element that connects an annotation (text or a block) to a point
 * or feature in the drawing. It is a single, atomic entity that manages its
 * own geometry and content. It is designed to be compatible with the modern
 */
export type DucLeaderElement = _DucLinearElementBase & DucLeaderStyle & {
  type: "leader";

  /** 
   * The content attached to the leader. Stored internally to keep the element atomic.
   */
  content: LeaderContent | null;

  /**
   * The anchor point for the content block, in world coordinates.
   * The leader's dogleg/landing connects to this point.
   */
  contentAnchor: GeometricPoint;
};




//// === DIMENSION ELEMENTS ===


export type DimensionType = ValueOf<typeof DIMENSION_TYPE>;
export type MarkEllipseCenter = ValueOf<typeof MARK_ELLIPSE_CENTER>;
export type ToleranceDisplay = ValueOf<typeof TOLERANCE_DISPLAY>;
export type DimensionFitRule = ValueOf<typeof DIMENSION_FIT_RULE>;
export type DimensionTextPlacement = ValueOf<typeof DIMENSION_TEXT_PLACEMENT>;

/**
 * The key geometric points that define a dimension's measurement.
 * The meaning of each point depends on the dimensionType.
 */
export type DimensionDefinitionPoints = {
  /** 
   * Primary origin point (e.g., start of a linear dimension, point on a circle for radius).
   * DXF DefPoint1
   */
  origin1: GeometricPoint;

  /** 
   * Secondary origin point (e.g., end of a linear dimension, end of an arc).
   * DXF DefPoint2
   */
  origin2?: GeometricPoint;

  /** 
   * A point that defines the position of the dimension line or arc.
   * DXF DefPoint3
   */
  location: GeometricPoint;

  /** 
   * Center point (for radial/angular/diameter) or vertex (for angular).
   * DXF DefPoint4
   */
  center?: GeometricPoint;

  /** 
   * A point defining a jog in the dimension line.
   * DXF DefPoint5
   */
  jog?: GeometricPoint;
};
/**
 * Defines the complete visual appearance of a dimension.
 * This style can be stored in a library and applied to many dimension instances.
 */
export type DucDimensionStyle = {
  /** Style for the main dimension line and its arrowheads */
  dimLine: {
    stroke: ElementStroke;
    /** Gap between the dimension line and the text when text is placed inside */
    textGap: PrecisionValue;
  };

  /** Style for the extension lines that connect the dimension to the feature */
  extLine: {
    stroke: ElementStroke;
    /** Distance to extend the line beyond the dimension line */
    overshoot: PrecisionValue;
    /** Gap between the feature origin and the start of the extension line */
    offset: PrecisionValue;
  };

  /** The text style used for the dimension's measurement and annotations */
  textStyle: DucTextStyle;

  /** Configuration for arrowheads and other symbols */
  symbols: {
    /**
     * Override the arrow heads for each dimension line
     * The tuple represents [startHead, endHead]
     */
    headsOverride?: [DucHead, DucHead];
    /** Center mark configuration for radial/diameter dimensions */
    centerMark: {
      type: MarkEllipseCenter;
      size: PrecisionValue;
    };
  };

  /** Default settings for dimensional tolerances */
  tolerance: {
    /** Whether to display tolerances by default */
    enabled: boolean;
    /** Default display method (e.g., Symmetrical, Limits) */
    displayMethod: ToleranceDisplay;
    /** Default upper tolerance value */
    upperValue: number;
    /** Default lower tolerance value */
    lowerValue: number;
    /** Decimal places for tolerance values */
    precision: number;
    /** The text style for the tolerance values, inheriting from the main textStyle */
    textStyle: Partial<DucTextStyle>;
  };

  /** Rules for how to arrange text and arrows when space is limited */
  fit: {
    /** Determines what to move when text and arrows don't fit between extension lines */
    rule: DimensionFitRule;
    /** If text is moved, determines its placement relative to the dimension line */
    textPlacement: DimensionTextPlacement;
    /** Forces text to always be placed between extension lines */
    forceTextInside: boolean;
  };
};
/**
 * A dimension element is an atomic annotation that measures and displays the
 * distance or angle between points. It renders its own lines, arrows, and text
 * based on its definition points and style, ensuring a clean and robust data model.
 */
export type DucDimensionElement = _DucElementBase & DucDimensionStyle & {
  type: "dimension";

  /** The type of dimension, which determines how definition points are interpreted */
  dimensionType: DimensionType;

  /** The core geometric points that define what is being measured */
  definitionPoints: DimensionDefinitionPoints;

  /**
   * The oblique angle for the extension lines, used for isometric-style dimensions.
   * An angle of 0 means they are perpendicular to the dimension line.
   */
  obliqueAngle: Radian;

  /**
   * For 'ordinate' dimensions, specifies whether it measures the X or Y coordinate.
   */
  ordinateAxis: Axis | null;

  /**
   * Defines how the definition points are associated with other elements when `isAssociative` is true.
   * The keys correspond to the keys in `definitionPoints`.
   */
  bindings?: {
    origin1?: DucPointBinding;
    origin2?: DucPointBinding;
    center?: DucPointBinding;
  };

  /**
   * User-override for the dimension text content.
   * - If `null`, the measured value is automatically calculated and displayed.
   * - If a string, this value is displayed instead.
   * Use `<>` within the string (e.g., "R<>") to include the calculated measurement.
   */
  textOverride: string | null;

  /**
   * User-override for the text position.
   * - If `null`, the position is automatically determined by the 'fit' rules in the style.
   * - If a point, the text is moved to this exact location.
   */
  textPosition: GeometricPoint | null;

  /** Instance-specific overrides for tolerance, taking precedence over the style's defaults */
  toleranceOverride?: Partial<DucDimensionStyle["tolerance"]>;

  /** If this is a baseline dimension, contains data linking it to the base */
  baselineData?: {
    baseDimensionId: string;
  };

  /** If this is a continued dimension, contains data linking it to the previous one */
  continueData?: {
    continueFromDimensionId: string;
  };

  /** Calculated measurement value (read-only, for inspection/API use) */
  readonly calculatedValue: PrecisionValue;
};




//// === Feature Control Frame ===

export type GDTSymbol = ValueOf<typeof GDT_SYMBOL>;
export type MaterialCondition = ValueOf<typeof MATERIAL_CONDITION>;
export type FeatureModifier = ValueOf<typeof FEATURE_MODIFIER>;
export type ToleranceZoneType = ValueOf<typeof TOLERANCE_ZONE_TYPE>;
export type DatumTargetType = ValueOf<typeof DATUM_TARGET_TYPE>;
export type ToleranceType = ValueOf<typeof TOLERANCE_TYPE>;
export type DatumBracketStyle = ValueOf<typeof DATUM_BRACKET_STYLE>;


// --- Component Data Structures ---

/**
 * Represents a single datum reference in a datum reference frame (e.g., "| A(M) |").
 */
export type DatumReference = {
  /** The datum letter or letters (e.g., "A", "B", "A-B") */
  letters: string;
  /** Material condition modifier, if any (e.g., Maximum, Least) */
  modifier?: MaterialCondition;
};

/**
 * Defines the tolerance value and its related specifications within a segment.
 */
export type ToleranceClause = {
  /** The primary tolerance value, represented as a string to support various formats */
  value: string;
  /** The type of tolerance zone (e.g., Cylindrical, Spherical) */
  zoneType?: ToleranceZoneType;
  /** A list of modifiers that apply directly to the feature, like Diameter or Projected Zone */
  featureModifiers: readonly FeatureModifier[];
  /** Material condition modifier for the tolerance itself */
  materialCondition?: MaterialCondition;
};

/**
 * A single segment within a Feature Control Frame row.
 * Typically contains a geometric symbol, a tolerance clause, and datum references.
 */
export type FeatureControlFrameSegment = {
  /** The geometric characteristic symbol (e.g., Position, Flatness, Profile) */
  symbol: GDTSymbol;
  /** The tolerance specification for this segment */
  tolerance: ToleranceClause;
  /** The datum reference frame, ordered by priority */
  datums: readonly [
    primary?: DatumReference,
    secondary?: DatumReference,
    tertiary?: DatumReference,
  ];
};


// --- Style and Element Definitions ---

/**
 * Defines the visual appearance of a Feature Control Frame.
 * This can be stored in a style library and reused.
 */
export type DucFeatureControlFrameStyle = _DucElementStylesBase & {
  /** The base text style for numbers and letters within the frame */
  textStyle: DucTextStyle;

  /** Layout and spacing properties */
  layout: {
    /** Padding between the content and the outer frame border */
    padding: PrecisionValue;
    /** Spacing between segments (vertical lines) in a row */
    segmentSpacing: PrecisionValue;
    /** Spacing between rows in a composite frame */
    rowSpacing: PrecisionValue;
  };

  /** Configuration for GD&T symbols */
  symbols: {
    /** Scale factor for symbols relative to the text height */
    scale: number;
  };

  /** Styling for datum references */
  datumStyle: {
    /** The style of bracket to draw around datum letters */
    bracketStyle: DatumBracketStyle;
  };
};

/**
 * A Geometric Dimensioning and Tolerancing (GD&T) Feature Control Frame element.
 * This element can represent a tolerance specification or define a datum feature.
 */
export type DucFeatureControlFrameElement = _DucElementBase & DucFeatureControlFrameStyle & {
  type: "featurecontrolframe";

  /**
   * An array of rows. Most FCFs have one row. Composite frames have multiple rows.
   * Each row is an array of segments that are drawn horizontally.
   */
  rows: readonly (readonly FeatureControlFrameSegment[])[];

  /** 
   * Modifiers that apply to the entire feature control frame.
   */
  frameModifiers?: {
    allAround?: boolean;
    allOver?: boolean;
    continuousFeature?: boolean;
    between?: {
      start: string; // Identifier for start point, e.g., "A"
      end: string;   // Identifier for end point, e.g., "B"
    };
    projectedToleranceZone?: {
      value: PrecisionValue;
    };
  };

  /** 
   * A reference to a leader element that points to this FCF.
   * The leader element itself holds the geometry and start/end bindings.
   * This provides a simple, one-way link.
   */
  leaderElementId: DucLeaderElement["id"] | null;

  /**
   * If present, this element acts as a **Datum Feature Symbol**, defining the specified
   * datum letter and attached to a feature. The `rows` property would be empty.
   */
  datumDefinition?: {
    /** The datum letter this symbol defines (e.g., "A", "B") */
    letter: string;
    /**
     * An optional binding directly to a point on the feature being identified as the datum.
     * Used when a leader is not present.
     */
    featureBinding?: DucPointBinding;
  };
};






//// === Doc Element ===


export type TextFlowDirection = ValueOf<typeof TEXT_FLOW_DIRECTION>;
export type ColumnType = ValueOf<typeof COLUMN_TYPE>;
export type StackedTextAlign = ValueOf<typeof STACKED_TEXT_ALIGN>;

/**
 * Defines advanced styling for a DucDocElement, extending the base text styles.
 * These properties control the overall layout and appearance of the document block.
 */
export type DucDocStyle = DucTextStyle & {


  // === PARAGRAPH FORMATTING ===
  paragraph: {
    /** Indentation for the first line of each paragraph */
    firstLineIndent: PrecisionValue;
    /** Indentation for all lines except the first (hanging indent) */
    hangingIndent: PrecisionValue;
    /** Indentation from the left edge of the element's bounding box */
    leftIndent: PrecisionValue;
    /** Indentation from the right edge of the element's bounding box */
    rightIndent: PrecisionValue;
    /** Extra spacing added before each paragraph */
    spaceBefore: PrecisionValue;
    /** Extra spacing added after each paragraph */
    spaceAfter: PrecisionValue;
    /** A list of tab stop positions from the left indent */
    tabStops: PrecisionValue[];
  };

  // === AUTOMATIC STACK/FRACTION FORMATTING ===
  stackFormat: {
    /** Enable automatic stacking of text around specified characters */
    autoStack: boolean;
    /** Characters that trigger stacking (e.g., "/", "#", "^") */
    stackChars: string[];
    /** Properties for how stacked text is rendered */
    properties: {
      /** Scale of the upper text relative to the main font size */
      upperScale: number; // e.g., 0.7
      /** Scale of the lower text relative to the main font size */
      lowerScale: number; // e.g., 0.7
      /** Alignment of stacked text (e.g., center, decimal) */
      alignment: StackedTextAlign;
    };
  };
};
/**
 * Defines the properties of a single column within a multi-column DucDocElement.
 * The collection of these definitions dictates the overall column layout.
 */
export type TextColumn = {
  /** The width of the column in drawing units. */
  width: PrecisionValue;
  /** The space between this column and the next, also known as the gutter. */
  gutter: PrecisionValue;
};
/**
 * A rich text document element
 * It supports complex formatting through its style properties and uses a Markdown
 * string for inline text styling, which can be edited with a rich text editor.
 */
export type DucDocElement = _DucElementBase & DucDocStyle & {
  type: "doc";

  /** 
   * The content of the document, stored as a Markdown string.
   * This approach allows a rich text editor (like Tiptap) to manage the complex
   * inline formatting (bold, italic, colors, hyperlinks, etc.) while keeping the
   * core data structure simple and clean.
   * 
   * It can also contain wildcards like `{@fieldname}` for dynamic data insertion.
   * Example: "This is **bold text** and this is a {color:red}red word{/color}."
   * 
   * It can also contain zero or more placeholders in the format `{{tag}}`.
   * Example: "This document was last saved on {{SaveDate}} by {{Author}}."
   */
  text: string;

  /**
   * An array of metadata objects that define the behavior of the placeholders
   * found in the `text` property. If this is empty, the text is treated
   * as purely static.
   */
  dynamic: readonly DucTextDynamicPart[];

  /** Direction of text flow for multi-column layouts */
  flowDirection: TextFlowDirection;

  /**
   * Defines the structural properties of the columns.
   */
  columns: {
    /** 
     * - `none`: A single column.
     * - `static`: A fixed number of columns with defined widths/heights.
     * - `dynamic`: Text flows automatically between columns based on height.
     */
    type: ColumnType;
    /** An array defining each column's properties */
    definitions: TextColumn[];
    /** Whether column height adjusts automatically in dynamic mode */
    autoHeight: boolean;
  };

  /**
   * Text sizing behavior:
   * - `true`: Width and/or height adjust to fit text content.
   * - `false`: Text wraps or is clipped to fit the element's fixed bounds.
   * @default true
   */
  autoResize: boolean;
};








//// === 3D Parametric Element ===

/**
 * Defines the source of the 3D geometry for a Parametric Element.
 * The geometry is either generated from live code or loaded from an external file.
 */
export type ParametricElementSource =
  | {
    /** The geometry is defined by executable Replicad code. */
    type: "code";
    /** The JavaScript code that generates the Replicad model. */
    code: string;
  }
  | {
    /** The geometry is loaded from a static 3D file. */
    type: "file";
    /** A reference to the imported file in the DucExternalFiles collection. */
    fileId: ExternalFileId;
  };
/**
 * An element that embeds a 3D model on the 2D canvas, defined either by
 * parametric Replicad code or by an imported 3D file (e.g., STEP, STL).
 * It includes its own 3D view and display controls.
 */
export type DucParametricElement = _DucElementBase & {
  type: "parametric";

  /** Defines the source of the 3D geometry (either from code or a file). */
  source: ParametricElementSource;
};