import {
  _DucStackElementBase,
  DucPoint,
  FontFamilyValues,
  Percentage,
  PrecisionValue,
  Radian,
  ValueOf,
  ElementBackground,
  ElementStroke,
  GeometricPoint,
  DucUcs,
} from "./types";
import { DucLinearElement } from "./DucLinearElement";
import { _DucBaseTextStyle } from "./DucTextElement";
import { DucView } from "./View";

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

/**
 * Utility functions to convert between the two scales
 */
export const viewportToAnnotationScale = (viewportScale: ViewportScale): AnnotationScale => {
  return (1 / viewportScale) as AnnotationScale;
};

export const annotationToViewportScale = (annotationScale: AnnotationScale): ViewportScale => {
  return (1 / annotationScale) as ViewportScale;
};

export const VIEWPORT_TYPE = {
  PAPER_SPACE: 10,  // Viewport in paper space showing model space
  MODEL_SPACE: 11,  // Model space viewport division
} as const;

export const VIEW_DIRECTION = {
  TOP: 10,
  BOTTOM: 11,
  FRONT: 12,
  BACK: 13,
  LEFT: 14,
  RIGHT: 15,
  ISOMETRIC_SW: 16, // Southwest isometric
  ISOMETRIC_SE: 17, // Southeast isometric
  ISOMETRIC_NE: 18, // Northeast isometric
  ISOMETRIC_NW: 19, // Northwest isometric
  CUSTOM: 20,
} as const;

export const VIEWPORT_SCALE_INDICATOR_POSITION = {
  TOP_LEFT: 10,
  TOP_RIGHT: 11,
  BOTTOM_LEFT: 12,
  BOTTOM_RIGHT: 13,
} as const;

export const VIEWPORT_SHADE_PLOT = {
  AS_DISPLAYED: 10,
  WIREFRAME: 11,
  HIDDEN: 12,
  RENDERED: 13,
} as const;

export type ViewportShadePlot = ValueOf<typeof VIEWPORT_SHADE_PLOT>;
export type ViewportScaleIndicatorPosition = ValueOf<typeof VIEWPORT_SCALE_INDICATOR_POSITION>;
export type ViewportType = ValueOf<typeof VIEWPORT_TYPE>;
export type ViewDirection = ValueOf<typeof VIEW_DIRECTION>;



export type DucViewportStyle = {
  id: string;
  name: string;
  description?: string;

  background: ElementBackground;
  stroke: ElementStroke;

  /** Clipping configuration */
  clippingPath: DucLinearElement;

  /** Grid settings for this viewport */
  gridId?: string;
  grid: DucGrid | null;

  /** User Coordinate System */
  ucsId?: string;
  ucs: DucUcs | null;

  /** Snap settings for this viewport */
  snapId?: string;
  snap: DucSnap | null;

  /** Viewport annotation scale indicator */
  scaleIndicator: {
    /** Default position */
    position: GeometricPoint;
    /** Text styling */
    textStyle: _DucBaseTextStyle;
    /** Custom format string (e.g., "Scale: 1:{scale}") */
    format?: string;
  };
};

export type _DucViewportStyleProps = Exclude<DucViewportStyle, "id" | "name" | "description">;  
export type DucViewportElement = _DucStackElementBase & _DucViewportStyleProps & {
  type: "viewport";

  /** Type of viewport */
  viewportType: ViewportType;

  /** Camera/view configuration */
  camera: DucView;

  /** Predefined view direction */
  viewDirection: ViewDirection;

  /** Viewport scale settings */
  scale: ViewportScale;

  /** Shade plot setting */
  shadePlot: ViewportShadePlot;

  /** Frozen layers in this viewport */
  frozenGroupIds: string[];
};