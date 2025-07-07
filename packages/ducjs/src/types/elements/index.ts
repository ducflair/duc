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
} from "ducjs/utils/constants";
import { MakeBrand, MarkNonNullable, MarkOptional, Merge, ValueOf } from "ducjs/types/utility-types";
import { SupportedMeasures } from "ducjs/utils/measurements";
import { PrecisionValue } from "ducjs/types";
import { Percentage, Radian, GeometricPoint } from "ducjs/types/geometryTypes";

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

/**
 * Map of duc elements.
 * Unspecified whether deleted or non-deleted.
 * Can be a subset of Scene elements.
 */
export type ElementsMap = Map<DucElement["id"], DucElement>;

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
  | "noPlot"
  | "description"
  | "scope"
  | "subset"
  | "blending"
>;


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

export type TilingProperties = {
  sizeInPercent: Percentage;
  angle: Radian;
  spacing?: number; // Gap between tiles
  offsetX?: number;
  offsetY?: number;
};
export type ElementContentBase = {
  preference: FillStyle;
  src: string; // Can be a color, gradient, image (fileId or url), frame element's content `@el/${elementId}`
  visible: boolean;
  opacity: Percentage;
  tiling?: TilingProperties;
  // imageProperties?: ImageProperties;
}

export type StrokePreference = ValueOf<typeof STROKE_PREFERENCE>;
export type StrokeCap = ValueOf<typeof STROKE_CAP>;
export type StrokeJoin = ValueOf<typeof STROKE_JOIN>;
export type StrokeStyle = {
  preference: StrokePreference;
  cap?: StrokeCap; // default: butt
  join?: StrokeJoin; // default: miter
  dash?: number[]; // [2, 4, 6, 8] for custom or [2, 2] for dashed or dotted
  dashCap?: StrokeCap; // default: butt
  miterLimit?: number;
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

  /**
   * Represents a certain category in which the element belongs to
   * e.g. AUX, COTA, etc.
   */
  subset: ElementSubset | null;

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
  noPlot: boolean;
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
  }>;

export type InitializedDucImageElement = MarkNonNullable<
  DucImageElement,
  "fileId"
>;

export type _DucStackBase = {
  label: string
  description: string | null;

  noPlot: boolean;
  isCollapsed: boolean;
  locked: boolean;
  isVisible: boolean;

  opacity: Percentage;
  labelingColor: string;

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

export type DucFrameLikeElement =
  | DucFrameElement;


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
  | DucBlockInstanceElement;


export type DucIframeLikeElement =
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
    fontSize: PrecisionValue;
    fontFamily: FontFamilyValues;
    text: string;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    containerId: DucGenericElement["id"] | null;
    originalText: string;
    /**
     * If `true` the width will fit the text. If `false`, the text will
     * wrap to fit the width.
     *
     * @default true
     */
    autoResize: boolean;
    /**
     * Unitless line height (aligned to W3C). To get line height in px, multiply
     *  with font size (using `getLineHeightInPx` helper).
     */
    lineHeight: number & { _brand: "unitlessLineHeight" };
  }>;

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
  position?: { x: PrecisionValue; y: PrecisionValue };
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
