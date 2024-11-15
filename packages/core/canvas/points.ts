import type { Point } from "./types";

export const getSizeFromPoints = (points: readonly Point[]) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
};

/** @arg dimension, 0 for rescaling only x, 1 for y */
export const rescalePoints = (
  dimension: 'x' | 'y',
  newSize: number,
  points: readonly Point[],
  normalize: boolean,
): Point[] => {
  const coordinates = points.map((point) => point[dimension]);
  const maxCoordinate = Math.max(...coordinates);
  const minCoordinate = Math.min(...coordinates);
  const size = maxCoordinate - minCoordinate;
  const scale = size === 0 ? 1 : newSize / size;

  let nextMinCoordinate = Infinity;

  const scaledPoints = points.map((point): Point => {
    const newPoint = { ...point };
    newPoint[dimension] = point[dimension] * scale;
    if (point.handleIn) {
      newPoint.handleIn = {
        ...point.handleIn,
        [dimension]: point.handleIn[dimension] * scale,
      };
    }
    if (point.handleOut) {
      newPoint.handleOut = {
        ...point.handleOut,
        [dimension]: point.handleOut[dimension] * scale,
      };
    }
    if (newPoint[dimension] < nextMinCoordinate) {
      nextMinCoordinate = newPoint[dimension];
    }
    return newPoint;
  });

  if (!normalize) {
    return scaledPoints;
  }

  if (scaledPoints.length === 2) {
    // We don't translate two-point lines
    return scaledPoints;
  }

  const translation = minCoordinate - nextMinCoordinate;

  const nextPoints = scaledPoints.map((scaledPoint) => {
    const translatedPoint = {
      ...scaledPoint,
      [dimension]: scaledPoint[dimension] + translation,
    };
    if (scaledPoint.handleIn) {
      translatedPoint.handleIn = {
        ...scaledPoint.handleIn,
        [dimension]: scaledPoint.handleIn[dimension] + translation,
      };
    }
    if (scaledPoint.handleOut) {
      translatedPoint.handleOut = {
        ...scaledPoint.handleOut,
        [dimension]: scaledPoint.handleOut[dimension] + translation,
      };
    }
    return translatedPoint;
  });
  
  return nextPoints;
};
