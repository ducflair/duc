import { Point } from "../types";
import {
  FONT_FAMILY,
  ROUNDNESS,
  TEXT_ALIGN,
  THEME,
  VERTICAL_ALIGN,
} from "../constants";
import { MakeBrand, MarkNonNullable, ValueOf } from "../utility-types";
import { MagicCacheData } from "../data/magic";
import { SupportedMeasures, WritingLayers } from "./measurements";

export type ChartType = "bar" | "line";
export type FillStyle = "hachure" | "cross-hatch" | "solid" | "zigzag";
export type FontFamilyKeys = keyof typeof FONT_FAMILY;
export type FontFamilyValues = typeof FONT_FAMILY[FontFamilyKeys];
export type Theme = typeof THEME[keyof typeof THEME];
export type FontString = string & { _brand: "fontString" };
export type GroupId = string;
export type PointerType = "mouse" | "pen" | "touch";
export type StrokeRoundness = "round" | "sharp";
export type RoundnessType = ValueOf<typeof ROUNDNESS>;
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type StrokePlacement = "inside" | "center" | "outside";
export type TextAlign = typeof TEXT_ALIGN[keyof typeof TEXT_ALIGN];

type VerticalAlignKeys = keyof typeof VERTICAL_ALIGN;
export type VerticalAlign = typeof VERTICAL_ALIGN[VerticalAlignKeys];

export type OptionalDucElementBase = Partial<_DucElementBase>;
export type OptionalDucGroup = Partial<DucGroup>;

type _DucElementBase = Readonly<{
  id: string;
  x: number;
  y: number;

  scope: SupportedMeasures;
  writingLayer: WritingLayers;
  
  label: string;
  ratioLocked: boolean; // Resize ratio locked
  isVisible: boolean;

  // Don't know for what to use
  fillStyle: FillStyle;
  roughness: number;
  //
  
  roundness: null | { type: RoundnessType; value?: number };
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  strokePlacement: StrokePlacement;

  opacity: number;
  width: number;
  height: number;
  angle: number;
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
  /** other elements that are bound to this element */
  boundElements:
    | readonly Readonly<{
        id: DucLinearElement["id"];
        type: "arrow" | "text";
      }>[]
    | null;
  /** epoch (ms) timestamp of last element update */
  updated: number;
  link: string | null;
  locked: boolean;
  customData?: Record<string, any>;
}>;

export type DucSelectionElement = _DucElementBase & {
  type: "selection";
};

export type DucRectangleElement = _DucElementBase & {
  type: "rectangle";
};

export type DucDiamondElement = _DucElementBase & {
  type: "diamond";
};

export type DucEllipseElement = _DucElementBase & {
  type: "ellipse";
};

export type DucEmbeddableElement = _DucElementBase &
  Readonly<{
    type: "embeddable";
  }>;

export type DucIframeElement = _DucElementBase &
  Readonly<{
    type: "iframe";

    // TODO move later to AI-specific frame
    customData?: { generationData?: MagicCacheData };
  }>;

export type DucIframeLikeElement =
  | DucIframeElement
  | DucEmbeddableElement;

  export type IframeData =
  | {
      intrinsicSize: { w: number; h: number };
      error?: Error;
      sandbox?: { allowSameOrigin?: boolean };
    } & (
      | { type: "video" | "generic"; link: string }
      | { type: "document"; srcdoc: (theme: Theme) => string }
    );

export type DucImageElement = _DucElementBase &
  Readonly<{
    type: "image";
    fileId: FileId | null;
    /** whether respective file is persisted */
    status: "pending" | "saved" | "error";
    /** X and Y scale factors <-1, 1>, used for image axis flipping */
    scale: [number, number];
  }>;

export type InitializedDucImageElement = MarkNonNullable<
  DucImageElement,
  "fileId"
>;

export type DucFrameElement = _DucElementBase & {
  type: "frame";
  isCollapsed: boolean;
  name: string | null; //FIXME: Will end up being a deprecated field
};

export type DucGroupElement = _DucElementBase & {
  groupIdRef: string;
  type: "group";
  isCollapsed: boolean;
};

export type DucGroup = {
  id: string;
  type: "group";
  isCollapsed: boolean;
  label: string; // FIXME: In the future we have to support version control for group Label
  scope: SupportedMeasures;
  writingLayer: WritingLayers;
};

export type DucMagicFrameElement = _DucElementBase & {
  type: "magicframe";
  isCollapsed: boolean;
  name: string | null;
};

export type DucFrameLikeElement =
  | DucFrameElement
  | DucMagicFrameElement;

/**
 * These are elements that don't have any additional properties.
 */
export type DucGenericElement =
  | DucSelectionElement
  | DucRectangleElement
  | DucDiamondElement
  | DucEllipseElement;

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
  | DucGroupElement
  | DucMagicFrameElement
  | DucIframeElement
  | DucEmbeddableElement;

export type NonDeleted<TElement extends DucElement> = TElement & {
  isDeleted: boolean;
};

export type NonDeletedDucElement = NonDeleted<DucElement>;

export type DucTextElement = _DucElementBase &
  Readonly<{
    type: "text";
    fontSize: number;
    fontFamily: FontFamilyValues;
    text: string;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    containerId: DucGenericElement["id"] | null;
    originalText: string;
    /**
     * Unitless line height (aligned to W3C). To get line height in px, multiply
     *  with font size (using `getLineHeightInPx` helper).
     */
    lineHeight: number & { _brand: "unitlessLineHeight" };
  }>;

export type DucBindableElement =
  | DucRectangleElement
  | DucDiamondElement
  | DucEllipseElement
  | DucTextElement
  | DucImageElement
  | DucIframeElement
  | DucEmbeddableElement
  | DucFrameElement
  | DucMagicFrameElement;

export type DucTextContainer =
  | DucRectangleElement
  | DucDiamondElement
  | DucEllipseElement
  | DucArrowElement;

export type DucTextElementWithContainer = {
  containerId: DucTextContainer["id"];
} & DucTextElement;

export type PointBinding = {
  elementId: DucBindableElement["id"];
  focus: number;
  gap: number;
};

export type Arrowhead =
  | "arrow"
  | "bar"
  | "dot" // legacy. Do not use for new elements.
  | "circle"
  | "circle_outline"
  | "triangle"
  | "triangle_outline"
  | "diamond"
  | "diamond_outline";

export type DucLinearElement = _DucElementBase &
  Readonly<{
    type: "line" | "arrow";
    points: readonly Point[];
    lastCommittedPoint: Point | null;
    startBinding: PointBinding | null;
    endBinding: PointBinding | null;
    startArrowhead: Arrowhead | null;
    endArrowhead: Arrowhead | null;
  }>;

export type DucArrowElement = DucLinearElement &
  Readonly<{
    type: "arrow";
  }>;

export type DucFreeDrawElement = _DucElementBase &
  Readonly<{
    type: "freedraw";
    points: readonly Point[];
    pressures: readonly number[];
    simulatePressure: boolean;
    lastCommittedPoint: Point | null;
  }>;

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