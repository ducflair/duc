import { AnnotationScale, ViewportScale } from "ducjs/types";

/**
 * Utility functions to convert between the two scales
 */
export const viewportToAnnotationScale = (viewportScale: ViewportScale): AnnotationScale => {
  return (1 / viewportScale) as AnnotationScale;
};

export const annotationToViewportScale = (annotationScale: AnnotationScale): ViewportScale => {
  return (1 / annotationScale) as ViewportScale;
};
