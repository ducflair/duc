
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


export type ViewportShadePlot = ValueOf<typeof VIEWPORT_SHADE_PLOT>;

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
  grid: DucGrid[] | null;

  /** User Coordinate System */
  ucsId?: string;
  ucs: DucUcs | null;

  /** Snap settings for this viewport */
  snapId?: string;
  snap: DucSnap | null;

  /** Viewport annotation scale indicator */
  scaleIndicator: DucTextElement | null;
};

export type _DucViewportStyleProps = Exclude<DucViewportStyle, "id" | "name" | "description">;  
export type DucViewportElement = _DucStackElementBase & _DucViewportStyleProps & {
  type: "viewport";

  /** View configuration */
  view: DucView;

  /** Viewport scale settings */
  scale: ViewportScale;

  /** Shade plot setting */
  shadePlot: ViewportShadePlot;

  /** Frozen layers in this viewport */
  frozenGroupIds: string[];
};