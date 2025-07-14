export * from "./geometry";
export * from "./bbox";
export * from "./algebra";
export * from "./random";

import type {
  NullableGridSize,
  RawValue,
  ScopedZoomValue,
  Zoom
} from "ducjs/types";
import { Scope, ScopedValue } from "ducjs/types";
import type { DucElement, DucLine, DucLinearElement, DucLineReference, DucPoint, NonDeleted } from "ducjs/types/elements";
import type { Bounds, GeometricPoint, GeometricVector, Percentage, Radian } from "ducjs/types/geometryTypes";
import { Heading } from "ducjs/types/geometryTypes";
import { Mutable } from "ducjs/types/utility-types";
import {
  LINE_CONFIRM_THRESHOLD
} from "ducjs/utils/constants";
import { pointFrom } from "ducjs/utils/math/geometry";
import { getPrecisionValueFromRaw, getPrecisionValueFromScoped, getScopedBezierPointFromDucPoint, SupportedMeasures } from "ducjs/technical/scopes";

type SV = ScopedValue;



export const getRadianFromDegrees = (degrees: number): Radian => {
  return degrees * (Math.PI / 180) as Radian;
};

export const getDegreesFromRadian = (radian: Radian): number => {
  return radian * (180 / Math.PI);
};

export const getPercentageValueFromPercentage = (value: number): Percentage => {
  return value/100 as Percentage;
};

export const getPercentageFromPercentage = (percentage: Percentage): number => {
  return percentage * 100;
};

export const med = (A: number[], B: number[]): number[] => {
  return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

/**
 * Rotates a point (x, y) around another point (cx, cy) by a given angle.
 * Returns the rotated point as a Point object.
 */
// 𝑎′𝑥=(𝑎𝑥−𝑐𝑥)cos𝜃−(𝑎𝑦−𝑐𝑦)sin𝜃+𝑐𝑥
// 𝑎′𝑦=(𝑎𝑥−𝑐𝑥)sin𝜃+(𝑎𝑦−𝑐𝑦)cos𝜃+𝑐𝑦.


// https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
export const rotate = (
  // Target point to rotate
  x: number,
  y: number,
  // Point to rotate against
  cx: number,
  cy: number,
  angle: number,
): GeometricPoint => ({
  x: (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
  y: (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
});

/**
 * Rotates a Point around another Point by a given angle.
 * Returns the rotated point as a Point object.
 */
export const rotatePoint = (
  point: GeometricPoint,
  center: GeometricPoint,
  angle: number,
): GeometricPoint => rotate(point.x, point.y, center.x, center.y, angle);


export const getSizeFromPoints = (points: readonly GeometricPoint[]): { width: ScopedValue; height: ScopedValue } => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs) as ScopedValue,
    height: Math.max(...ys) - Math.min(...ys) as ScopedValue,
  };
};

/** @arg dimension, 0 for rescaling only x, 1 for y */
export const rescalePoints = (
  dimension: 'x' | 'y',
  newSize: ScopedValue,
  points: readonly DucPoint[],
  normalize: boolean,
  elementScope: SupportedMeasures,
  currentScope: Scope,
): DucPoint[] => {
  const coordinates = points.map((point) => point[dimension].scoped);
  const maxCoordinate = Math.max(...coordinates);
  const minCoordinate = Math.min(...coordinates);
  const size = maxCoordinate - minCoordinate;
  const scale = size === 0 ? 1 : newSize / size;

  const scaledPoints = points.map((point): DucPoint => {
    const newPoint = { ...point };
    newPoint[dimension] = getPrecisionValueFromScoped(
      (point[dimension].scoped * scale) as ScopedValue,
      elementScope,
      currentScope,
    );
    return newPoint;
  });

  if (!normalize || points.length === 0) {
    return scaledPoints;
  }

  // With normalization, we move the points so that the first point
  // is at the same position as original.
  const translation = (points[0][dimension].scoped -
    scaledPoints[0][dimension].scoped) as ScopedValue;

  const nextPoints = scaledPoints.map((scaledPoint) => {
    const translatedPoint = {
      ...scaledPoint,
      [dimension]: getPrecisionValueFromScoped(
        (scaledPoint[dimension].scoped + translation) as ScopedValue,
        elementScope,
        currentScope,
      ),
    };
    return translatedPoint;
  });

  return nextPoints;
};

// Helper function to rescale DucLine handles
export const rescaleLines = (
  dimension: 'x' | 'y',
  newSize: ScopedValue,
  lines: readonly DucLine[],
  points: readonly DucPoint[],
  normalize: boolean,
  elementScope: SupportedMeasures,
  currentScope: Scope,
): DucLine[] => {
  const coordinates = points.map((point) => point[dimension].scoped);
  const maxCoordinate = Math.max(...coordinates);
  const minCoordinate = Math.min(...coordinates);
  const size = maxCoordinate - minCoordinate;
  const scale = size === 0 ? 1 : newSize / size;

  let translation: ScopedValue = 0 as ScopedValue;

  if (normalize && points.length > 0) {
    const scaledFirstPointCoordinate = points[0][dimension].scoped * scale;
    translation = (points[0][dimension].scoped -
      scaledFirstPointCoordinate) as ScopedValue;
  }

  const scaledLines = lines.map((line): DucLine => {
    const [start, end] = line;

    const scaledStart: DucLineReference = {
      ...start,
      handle: start.handle ? {
        ...start.handle,
        [dimension]: getPrecisionValueFromScoped(
          (start.handle[dimension].scoped * scale + translation) as ScopedValue,
          elementScope,
          currentScope,
        ),
      } : null
    };

    const scaledEnd: DucLineReference = {
      ...end,
      handle: end.handle ? {
        ...end.handle,
        [dimension]: getPrecisionValueFromScoped(
          (end.handle[dimension].scoped * scale + translation) as ScopedValue,
          elementScope,
          currentScope,
        ),
      } : null
    };

    return [scaledStart, scaledEnd];
  });

  return scaledLines;
};

/**
 * Calculates the distance from a point to a line segment
 * @param point The point to check distance from
 * @param start Start point of line segment
 * @param end End point of line segment
 * @returns Distance from point to line segment
 */
export function distanceToLineSegment(point: GeometricPoint, start: GeometricPoint, end: GeometricPoint): number {
  const A = point.x - start.x;
  const B = point.y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the distance from a point to a cubic Bezier curve segment
 * @param point The point to check distance from
 * @param start Start point of Bezier curve
 * @param end End point of Bezier curve
 * @param cp1 First control point
 * @param cp2 Second control point
 * @param numSamples Number of samples to use for approximation
 * @returns Approximate distance from point to Bezier curve
 */
export function distanceToCurveSegment(
  point: GeometricPoint,
  start: GeometricPoint,
  end: GeometricPoint,
  cp1: GeometricPoint,
  cp2: GeometricPoint,
  numSamples: number = 30,
): number {
  // Sample points along the curve
  const samples = sampleBezierCurve(start, cp1, cp2, end, numSamples);

  // Find the minimum distance to any line segment in the sampled curve
  let minDistance = Infinity;
  for (let i = 0; i < samples.length - 1; i++) {
    const distance = distanceToLineSegment(point, samples[i], samples[i + 1]);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

/**
 * Samples points along a cubic Bezier curve using De Casteljau's algorithm
 * More precise than the sampleBezierCurve in bounds.ts, but used only for distance calculations
 */
export function sampleBezierCurve(
  start: GeometricPoint,
  cp1: GeometricPoint,
  cp2: GeometricPoint,
  end: GeometricPoint,
  numSamples: number
): GeometricPoint[] {
  const result: GeometricPoint[] = [];

  // Calculate curve complexity for adaptive sampling
  const curvature = calculateCurveComplexity(start, cp1, cp2, end);
  // Increase the maximum number of samples from 50 to 100 for high-curvature paths
  const adaptiveNumSamples = Math.min(100, Math.max(numSamples, Math.ceil(numSamples * curvature)));

  for (let i = 0; i <= adaptiveNumSamples; i++) {
    const t = i / adaptiveNumSamples;
    result.push(evaluateBezier(start, cp1, cp2, end, t));
  }

  return result;
}

/**
 * Evaluates a point at parameter t on the cubic Bezier curve
 */
export function evaluateBezier(
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
  t: number
): GeometricPoint {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
}

/**
 * Calculates the approximate complexity of a Bezier curve to determine sampling rate
 */
export function calculateCurveComplexity(
  start: GeometricPoint,
  cp1: GeometricPoint,
  cp2: GeometricPoint,
  end: GeometricPoint
): number {
  // A simple heuristic for complexity: the sum of the distances
  // from the control points to the line connecting the start and end points
  const baseline = distanceToLineSegment(cp1, start, end) + distanceToLineSegment(cp2, start, end);
  const chordLength = Math.hypot(end.x - start.x, end.y - start.y);

  // Normalize by chord length to make it scale-invariant
  return chordLength > 0 ? baseline / chordLength : 1;
}

/**
 * Helper function to calculate the distance from a point to a line
 */
export function distanceFromPointToLine(point: GeometricPoint, lineStart: GeometricPoint, lineEnd: GeometricPoint): number {
  const { x: x0, y: y0 } = point;
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;

  const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Adaptive sampling for bounds (from bounds.ts)
 * This is different from the distance version above.
 */
export function sampleBezierCurveForBounds(
  start: GeometricPoint,
  cp1: GeometricPoint,
  cp2: GeometricPoint,
  end: GeometricPoint,
  numSamples: number = 10 // Base number of samples
): GeometricPoint[] {
  // Calculate curve complexity to determine adaptive sampling
  const curvature = calculateCurvature(start, cp1, cp2, end);
  // Adjust sampling based on curve complexity
  // More complex curves get more samples for better accuracy
  // Kept cap at 40 to avoid excessive segments during selection/collision checks
  const adaptiveNumSamples = Math.max(
    numSamples,
    Math.min(40, Math.ceil(numSamples * curvature))
  );
  const points: GeometricPoint[] = [];
  for (let i = 0; i <= adaptiveNumSamples; i++) {
    const t = i / adaptiveNumSamples;
    points.push(getBezierPoint(start, cp1, cp2, end, t));
  }
  return points;
}

/**
 * Calculate approximate curve complexity based on control point positions (from bounds.ts)
 */
export function calculateCurvature(
  start: GeometricPoint,
  cp1: GeometricPoint,
  cp2: GeometricPoint,
  end: GeometricPoint
): number {
  // Calculate distances from control points to the line segment
  const lineLength = Math.hypot(end.x - start.x, end.y - start.y);
  if (lineLength === 0) return 1; // Prevent division by zero
  // Project control points onto the line segment
  const projectPoint = (p: GeometricPoint): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const t = ((p.x - start.x) * dx + (p.y - start.y) * dy) / (dx * dx + dy * dy);
    return Math.max(0, Math.min(1, t));
  };
  const proj1 = projectPoint(cp1);
  const proj2 = projectPoint(cp2);
  // Calculate distance from control points to line
  const distanceToLine = (p: GeometricPoint, t: number): number => {
    const projX = start.x + t * (end.x - start.x);
    const projY = start.y + t * (end.y - start.y);
    return Math.hypot(p.x - projX, p.y - projY);
  };
  const dist1 = distanceToLine(cp1, proj1);
  const dist2 = distanceToLine(cp2, proj2);
  // Normalize by line length to get relative curvature
  const normalizedCurvature = Math.max(dist1, dist2) / lineLength;
  // Return a scaling factor between 1 and 4 for sampling
  return 1 + Math.min(3, normalizedCurvature * 10);
}

/**
 * Get a point on a cubic bezier at t (from bounds.ts)
 */
export function getBezierPoint(
  start: GeometricPoint,
  cp1: GeometricPoint,
  cp2: GeometricPoint,
  end: GeometricPoint,
  t: number
): GeometricPoint {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * start.x +
      3 * mt * mt * t * cp1.x +
      3 * mt * t * t * cp2.x +
      t * t * t * end.x,
    y:
      mt * mt * mt * start.y +
      3 * mt * mt * t * cp1.y +
      3 * mt * t * t * cp2.y +
      t * t * t * end.y,
  };
}

/**
 * Quadratic bezier bounding box (from bounds.ts)
 * Enhanced version that handles edge cases better
 */
export function getQuadraticBezierBoundingBox(
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
): { minX: ScopedValue; minY: ScopedValue; maxX: ScopedValue; maxY: ScopedValue } {
  const tValues = [];

  // Find critical points where the derivative is zero
  for (const coord of ['x', 'y'] as const) {
    // Derivative of quadratic Bézier: 2(1-t)(P1-P0) + 2t(P2-P1)
    // Setting to zero: 2(P1-P0) - 2t(P1-P0) + 2t(P2-P1) = 0
    // Simplifying: (P1-P0) + t(P2-2P1+P0) = 0
    const a = p0[coord] - 2 * p1[coord] + p2[coord];
    const b = 2 * (p1[coord] - p0[coord]);

    if (Math.abs(a) < 1e-10) continue; // No critical point if a ≈ 0

    const t = -b / (2 * a);
    if (t > 0 && t < 1) tValues.push(t);
  }

  // Start with endpoints
  const xValues = [p0.x, p2.x];
  const yValues = [p0.y, p2.y];

  // Add values at critical points
  for (const t of tValues) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    xValues.push(x);
    yValues.push(y);
  }

  // For extra safety, sample a few additional points
  const samplePoints = [0.25, 0.5, 0.75];
  for (const t of samplePoints) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    xValues.push(x);
    yValues.push(y);
  }

  return {
    minX: Math.min(...xValues) as ScopedValue,
    minY: Math.min(...yValues) as ScopedValue,
    maxX: Math.max(...xValues) as ScopedValue,
    maxY: Math.max(...yValues) as ScopedValue,
  };
}

/**
 * Cubic bezier bounding box (from bounds.ts)
 * Enhanced version that handles edge cases better
 */
export function getCubicBezierBoundingBox(
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
): { minX: ScopedValue; minY: ScopedValue; maxX: ScopedValue; maxY: ScopedValue } {
  const tValues = [];

  // Find critical points where the derivative is zero
  for (const coord of ['x', 'y'] as const) {
    // Derivative of cubic Bézier: 3(1-t)²(P1-P0) + 6(1-t)t(P2-P1) + 3t²(P3-P2)
    // Setting to zero and solving for t gives us: at² + bt + c = 0
    const a = -3 * p0[coord] + 9 * p1[coord] - 9 * p2[coord] + 3 * p3[coord];
    const b = 6 * p0[coord] - 12 * p1[coord] + 6 * p2[coord];
    const c = 3 * p1[coord] - 3 * p0[coord];

    if (Math.abs(a) < 1e-10) {
      // Linear case: bt + c = 0
      if (Math.abs(b) > 1e-10) {
        const t = -c / b;
        if (t > 0 && t < 1) tValues.push(t);
      }
      continue;
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) continue;

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b + sqrtDiscriminant) / (2 * a);
    const t2 = (-b - sqrtDiscriminant) / (2 * a);

    if (t1 > 0 && t1 < 1) tValues.push(t1);
    if (t2 > 0 && t2 < 1) tValues.push(t2);
  }

  // Start with endpoints
  const xValues = [p0.x, p3.x];
  const yValues = [p0.y, p3.y];

  // Add values at critical points
  for (const t of tValues) {
    const point = getBezierPoint(p0, p1, p2, p3, t);
    xValues.push(point.x);
    yValues.push(point.y);
  }

  // For extra safety with complex curves, sample a few additional points
  // This helps catch cases where the mathematical solution might miss extrema
  const samplePoints = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  for (const t of samplePoints) {
    const point = getBezierPoint(p0, p1, p2, p3, t);
    xValues.push(point.x);
    yValues.push(point.y);
  }

  return {
    minX: Math.min(...xValues) as ScopedValue,
    minY: Math.min(...yValues) as ScopedValue,
    maxX: Math.max(...xValues) as ScopedValue,
    maxY: Math.max(...yValues) as ScopedValue,
  };
}

/**
 * Cubic bezier curve bound (returns Bounds tuple, from bounds.ts)
 */
export function getCubicBezierCurveBound(
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
): [number, number, number, number] {
  const solX = solveQuadratic(p0.x, p1.x, p2.x, p3.x);
  const solY = solveQuadratic(p0.y, p1.y, p2.y, p3.y);
  let minX = Math.min(p0.x, p3.x);
  let maxX = Math.max(p0.x, p3.x);
  if (solX) {
    const xs = solX.filter((x) => x !== null) as number[];
    minX = Math.min(minX, ...xs);
    maxX = Math.max(maxX, ...xs);
  }
  let minY = Math.min(p0.y, p3.y);
  let maxY = Math.max(p0.y, p3.y);
  if (solY) {
    const ys = solY.filter((y) => y !== null) as number[];
    minY = Math.min(minY, ...ys);
    maxY = Math.max(maxY, ...ys);
  }
  return [minX, minY, maxX, maxY];
}

// Helper for getCubicBezierCurveBound
function solveQuadratic(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): [number | null, number | null] | false {
  const i = p1 - p0;
  const j = p2 - p1;
  const k = p3 - p2;
  const a = 3 * i - 6 * j + 3 * k;
  const b = 6 * j - 6 * i;
  const c = 3 * i;
  const sqrtPart = b * b - 4 * a * c;
  const hasSolution = sqrtPart >= 0;
  if (!hasSolution) {
    return false;
  }
  let s1 = null;
  let s2 = null;
  let t1 = Infinity;
  let t2 = Infinity;
  if (a === 0) {
    t1 = t2 = -c / b;
  } else {
    t1 = (-b + Math.sqrt(sqrtPart)) / (2 * a);
    t2 = (-b - Math.sqrt(sqrtPart)) / (2 * a);
  }
  if (t1 >= 0 && t1 <= 1) {
    s1 = getBezierValueForT(t1, p0, p1, p2, p3);
  }
  if (t2 >= 0 && t2 <= 1) {
    s2 = getBezierValueForT(t2, p0, p1, p2, p3);
  }
  return [s1, s2];
}

// Helper for solveQuadratic
function getBezierValueForT(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
) {
  const oneMinusT = 1 - t;
  return (
    Math.pow(oneMinusT, 3) * p0 +
    3 * Math.pow(oneMinusT, 2) * t * p1 +
    3 * oneMinusT * Math.pow(t, 2) * p2 +
    Math.pow(t, 3) * p3
  );
}

export const isPointCurved = (element: DucLinearElement, pointIndex: number): boolean => {
  return element.lines.some(line =>
    (line[0].index === pointIndex && line[0].handle) ||
    (line[1].index === pointIndex && line[1].handle)
  );
};

/**
 * Gets the bezier handles for a point from the lines array
 */
export const getPointHandles = (element: DucLinearElement, pointIndex: number): {
  handleIn?: GeometricPoint;
  handleOut?: GeometricPoint;
} => {
  const handles: { handleIn?: GeometricPoint; handleOut?: GeometricPoint } = {};

  // Find lines that connect to this point
  for (const line of element.lines) {
    const [start, end] = line;

    // Check if this point is the start of the line
    if (start.index === pointIndex && start.handle) {
      handles.handleOut = {
        x: start.handle.x.scoped,
        y: start.handle.y.scoped,
      };
    }

    // Check if this point is the end of the line
    if (end.index === pointIndex && end.handle) {
      handles.handleIn = {
        x: end.handle.x.scoped,
        y: end.handle.y.scoped,
      };
    }
  }

  return handles;
};

/**
 * Gets connected point indices from the lines array
 */
export const getConnectedPoints = (element: DucLinearElement, pointIndex: number): number[] => {
  const connections: number[] = [];

  for (const line of element.lines) {
    const [start, end] = line;

    if (start.index === pointIndex) {
      connections.push(end.index);
    } else if (end.index === pointIndex) {
      connections.push(start.index);
    }
  }

  return connections;
};

/* Rotate a point by [angle] radians.
*
* @param point The point to rotate
* @param center The point to rotate around, the center point
* @param angle The radians to rotate the point by
* @returns The rotated point
*/
export function pointRotateRads<Point extends GeometricPoint>(
  point: GeometricPoint,
  center: GeometricPoint,
  angle: number,
): Point {
  return pointFrom(
    (point.x - center.x) * Math.cos(angle) - (point.y - center.y) * Math.sin(angle) + center.x,
    (point.x - center.x) * Math.sin(angle) + (point.y - center.y) * Math.cos(angle) + center.y,
  );
}

export const distanceSq = (p1: GeometricPoint, p2: GeometricPoint): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
};

export const distanceToLineSegmentSq = (
  p: GeometricPoint,
  a: GeometricPoint,
  b: GeometricPoint,
): number => {
  const l2 = distanceSq(a, b);
  if (l2 === 0) {
    return distanceSq(p, a);
  }
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  };
  return distanceSq(p, projection);
};

export const sampleQuadratic = (
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  samples: GeometricPoint[],
  depth: number,
  maxDepth: number,
  toleranceSq: number,
) => {
  if (depth >= maxDepth) {
    samples.push(p2);
    return;
  }
  const dSq = distanceToLineSegmentSq(p1, p0, p2);
  if (dSq < toleranceSq) {
    samples.push(p2);
    return;
  }
  const p01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const p12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const mid = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
  sampleQuadratic(p0, p01, mid, samples, depth + 1, maxDepth, toleranceSq);
  sampleQuadratic(mid, p12, p2, samples, depth + 1, maxDepth, toleranceSq);
};

export const sampleCubic = (
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
  samples: GeometricPoint[],
  depth: number,
  maxDepth: number,
  toleranceSq: number,
) => {
  if (depth >= maxDepth) {
    samples.push(p3);
    return;
  }
  const d1Sq = distanceToLineSegmentSq(p1, p0, p3);
  const d2Sq = distanceToLineSegmentSq(p2, p0, p3);
  if (d1Sq < toleranceSq && d2Sq < toleranceSq) {
    samples.push(p3);
    return;
  }
  const p01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const p12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const p23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
  const p012 = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
  const p123 = { x: (p12.x + p23.x) / 2, y: (p12.y + p23.y) / 2 };
  const mid = { x: (p012.x + p123.x) / 2, y: (p012.y + p123.y) / 2 };
  sampleCubic(p0, p01, p012, mid, samples, depth + 1, maxDepth, toleranceSq);
  sampleCubic(mid, p123, p23, p3, samples, depth + 1, maxDepth, toleranceSq);
};


/**
 * Adjusts x and y coordinates based on rotation and deltas.
 * Returns the adjusted coordinates as a Point object.
 */
export const adjustXYWithRotation = (
  sides: {
    n?: boolean;
    e?: boolean;
    s?: boolean;
    w?: boolean;
  },
  x: number,
  y: number,
  angle: number,
  deltaX1: number,
  deltaY1: number,
  deltaX2: number,
  deltaY2: number,
): GeometricPoint => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  if (sides.e && sides.w) {
    x += deltaX1 + deltaX2;
  } else if (sides.e) {
    x += deltaX1 * (1 + cos);
    y += deltaX1 * sin;
    x += deltaX2 * (1 - cos);
    y += deltaX2 * -sin;
  } else if (sides.w) {
    x += deltaX1 * (1 - cos);
    y += deltaX1 * -sin;
    x += deltaX2 * (1 + cos);
    y += deltaX2 * sin;
  }

  if (sides.n && sides.s) {
    y += deltaY1 + deltaY2;
  } else if (sides.n) {
    x += deltaY1 * sin;
    y += deltaY1 * (1 - cos);
    x += deltaY2 * -sin;
    y += deltaY2 * (1 + cos);
  } else if (sides.s) {
    x += deltaY1 * -sin;
    y += deltaY1 * (1 + cos);
    x += deltaY2 * sin;
    y += deltaY2 * (1 - cos);
  }
  return { x, y };
};

/**
 * Finds a point on a path.
 * Returns an object with x, y, and the segment index if found, else null.
 */
export const getPointOnAPath = (point: GeometricPoint, path: GeometricPoint[]) => {
  const { x: px, y: py } = point;
  const [start, ...other] = path;
  let { x: lastX, y: lastY } = start;
  let kLine: number = 0;
  let idx: number = 0;

  // If any item in the array is true, it means that a point is
  // on some segment of a line-based path
  const retVal = other.some(({ x: x2, y: y2 }, i) => {
    // We always take a line when dealing with line segments
    const x1 = lastX;
    const y1 = lastY;

    lastX = x2;
    lastY = y2;

    // If a point is not within the domain of the line segment
    // it is not on the line segment
    if (px < x1 || px > x2) {
      return false;
    }

    // check if all points lie on the same line
    // y1 = kx1 + b, y2 = kx2 + b
    // y2 - y1 = k(x2 - x2) -> k = (y2 - y1) / (x2 - x1)

    // Coefficient for the line (p0, p1)
    const kL = (y2 - y1) / (x2 - x1);

    // Coefficient for the line segment (p0, point)
    const kP1 = (py - y1) / (px - x1);

    // Coefficient for the line segment (point, p1)
    const kP2 = (py - y2) / (px - x2);

    // Because we are basing both lines from the same starting point
    // the only option for collinearity is having same coefficients

    // Using it for floating point comparisons
    const epsilon = 0.3;

    // If coefficient is more than an arbitrary epsilon,
    // these lines are not collinear
    if (Math.abs(kP1 - kL) > epsilon && Math.abs(kP2 - kL) > epsilon) {
      return false;
    }

    // Store the coefficient because we are going to need it
    kLine = kL;
    idx = i;

    return true;
  });

  // Return a coordinate that is always on the line segment
  if (retVal === true) {
    return { x: point.x, y: kLine * point.x, segment: idx };
  }

  return null;
};

/**
 * Calculates the Euclidean distance between two points.
 */
export const distance2d = (x1: number, y1: number, x2: number, y2: number): number => {
  const xd = x2 - x1;
  const yd = y2 - y1;
  return Math.hypot(xd, yd);
};

/**
 * Calculates the squared Euclidean distance between two Points.
 */
export const distanceSq2d = (p1: GeometricPoint, p2: GeometricPoint): number => {
  const xd = p2.x - p1.x;
  const yd = p2.y - p1.y;
  return xd * xd + yd * yd;
};

/**
 * Calculates the center point between two Points.
 */
export const centerPoint = (a: GeometricPoint, b: GeometricPoint): GeometricPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

/**
 * Checks if the first and last point are close enough to be considered a loop.
 */
export const isPathALoop = (
  points: DucLinearElement["points"],
  /** Supply if you want the loop detection to account for current zoom */
  zoomValue: Zoom["scoped"] = 1 as ScopedZoomValue,
  elementScope: Scope,
  currentScope: Scope
): boolean => {
  if (points.length >= 3) {
    const [first, last] = [points[0], points[points.length - 1]];
    const lineConfirmThreshold = getPrecisionValueFromRaw(LINE_CONFIRM_THRESHOLD as RawValue, elementScope, currentScope)
    const distance = distance2d(first.x.scoped, first.y.scoped, last.x.scoped, last.y.scoped);

    // Adjusting LINE_CONFIRM_THRESHOLD to current zoom so that when zoomed in
    // really close we make the threshold smaller, and vice versa.
    return distance <= lineConfirmThreshold.scoped / zoomValue;
  }
  return false;
};


/**
 * Determines if a Point is inside a Polygon defined by an array of Points.
 */
export const isPointInPolygon = (
  points: GeometricPoint[],
  x: number,
  y: number,
): boolean => {
  const vertices = points.length;

  // There must be at least 3 vertices in polygon
  if (vertices < 3) {
    return false;
  }
  const extreme: GeometricPoint = { x: Number.MAX_SAFE_INTEGER, y };
  const p: GeometricPoint = { x, y };
  let count = 0;
  for (let i = 0; i < vertices; i++) {
    const current = points[i];
    const next = points[(i + 1) % vertices];
    if (doSegmentsIntersect(current, next, p, extreme)) {
      if (orderedColinearOrientation(current, p, next) === 0) {
        return isPointWithinBounds(current, p, next);
      }
      count++;
    }
  }
  // True if count is odd
  return count % 2 === 1;
};

/**
 * Returns whether `q` lies inside the segment/rectangle defined by `p` and `r`.
 * This is an approximation to "does `q` lie on a segment `pr`" check.
 */
export const isPointWithinBounds = (p: GeometricPoint, q: GeometricPoint, r: GeometricPoint): boolean => {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
};

/**
 * For the ordered points p, q, r, returns
 * 0 if p, q, r are colinear
 * 1 if Clockwise
 * 2 if counterclockwise
 */
const orderedColinearOrientation = (p: GeometricPoint, q: GeometricPoint, r: GeometricPoint): number => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) {
    return 0;
  }
  return val > 0 ? 1 : 2;
};

/**
 * Checks if two segments p1q1 and p2q2 intersect.
 */
const doSegmentsIntersect = (p1: GeometricPoint, q1: GeometricPoint, p2: GeometricPoint, q2: GeometricPoint): boolean => {
  const o1 = orderedColinearOrientation(p1, q1, p2);
  const o2 = orderedColinearOrientation(p1, q1, q2);
  const o3 = orderedColinearOrientation(p2, q2, p1);
  const o4 = orderedColinearOrientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 === 0 && isPointWithinBounds(p1, p2, q1)) {
    return true;
  }

  // p1, q1 and p2 are colinear and q2 lies on segment p1q1
  if (o2 === 0 && isPointWithinBounds(p1, q2, q1)) {
    return true;
  }

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 === 0 && isPointWithinBounds(p2, p1, q2)) {
    return true;
  }

  // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 === 0 && isPointWithinBounds(p2, q1, q2)) {
    return true;
  }

  return false;
};

/**
 * Rounds a point to the nearest grid point based on gridSize.
 */
export const getGridPoint = (
  x: number,
  y: number,
  gridSize: NullableGridSize,
): GeometricPoint => {
  if (gridSize) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }
  return { x, y };
};

/**
 * Calculates a point on a Bezier curve at parameter t.
 * Returns the point as a Point object.
 */
export const getBezierXY = (
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
  t: number,
): GeometricPoint => {
  const equation = (t: number, coord: "x" | "y") =>
    Math.pow(1 - t, 3) * p3[coord] +
    3 * t * Math.pow(1 - t, 2) * p2[coord] +
    3 * Math.pow(t, 2) * (1 - t) * p1[coord] +
    p0[coord] * Math.pow(t, 3);
  const tx = equation(t, "x");
  const ty = equation(t, "y");
  return { x: tx, y: ty };
};


/**
 * Checks if two Points are equal based on their x and y coordinates.
 */
export const arePointsEqual = (p1: GeometricPoint, p2: GeometricPoint, threshold = 0): boolean => {
  if(!p1 || !p2) return false;
  if (threshold === 0) {
    return p1.x === p2.x && p1.y === p2.y;
  }
  return Math.abs(p1.x - p2.x) <= threshold && Math.abs(p1.y - p2.y) <= threshold;
};

/**
 * Checks if an angle is a right angle (with floating point tolerance).
 */
export const isRightAngle = (angle: number): boolean => {
  // If our angles were mathematically accurate, we could just check
  //
  //    angle % (Math.PI / 2) === 0
  //
  // But since we're in floating point land, we need to round.
  //
  // Below, after dividing by Math.PI, a multiple of 0.5 indicates a right
  // angle, which we can check with modulo after rounding.
  return Math.round((angle / Math.PI) * 10000) % 5000 === 0;
};

/**
 * Converts radians to degrees.
 */
export const radianToDegree = (r: number): number => {
  return (r * 180) / Math.PI;
};

/**
 * Converts degrees to radians.
 */
export const degreeToRadian = (d: number): number => {
  return (d / 180) * Math.PI;
};

/**
 * Given two ranges, returns if the two ranges overlap with each other.
 * e.g. [1, 3] overlaps with [2, 4] while [1, 3] does not overlap with [4, 5]
 */
export const rangesOverlap = (
  [a0, a1]: [number, number],
  [b0, b1]: [number, number],
): boolean => {
  if (a0 <= b0) {
    return a1 >= b0;
  }

  if (a0 >= b0) {
    return b1 >= a0;
  }

  return false;
};

/**
 * Given two ranges, returns the intersection of the two ranges if any.
 * e.g. the intersection of [1, 3] and [2, 4] is [2, 3]
 */
export const rangeIntersection = (
  rangeA: [number, number],
  rangeB: [number, number],
): [number, number] | null => {
  const rangeStart = Math.max(rangeA[0], rangeB[0]);
  const rangeEnd = Math.min(rangeA[1], rangeB[1]);

  if (rangeStart <= rangeEnd) {
    return [rangeStart, rangeEnd];
  }

  return null;
};

/**
 * Checks if a value is within a range [min, max].
 */
export const isValueInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Translates a Point by a given Vector.
 */
export const translatePoint = (p: GeometricPoint, v: GeometricVector): GeometricPoint => ({
  x: p.x + v.x,
  y: p.y + v.y,
});

/**
 * Scales a Vector by a scalar.
 */
export const scaleVector = (v: GeometricVector, scalar: number): GeometricVector => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

/**
 * Converts a Point to a Vector relative to an origin.
 */
export const pointToVector = (p: GeometricPoint, origin: GeometricPoint = { x: 0, y: 0 }): GeometricVector => ({
  x: p.x - origin.x,
  y: p.y - origin.y,
})

export const vectorToPoint = (v: GeometricVector, origin: GeometricPoint = { x: 0, y: 0 }): GeometricPoint => ({
  x: v.x + origin.x,
  y: v.y + origin.y,
})

export const headingToPoint = (heading: Heading): GeometricPoint => ({
  x: heading.x,
  y: heading.y
})
/**
 * Scales a Point from a midpoint by a multiplier.
 */
export const scalePointFromOrigin = (
  p: GeometricPoint,
  mid: GeometricPoint,
  multiplier: number,
): GeometricPoint => translatePoint(mid, scaleVector(pointToVector(p, mid), multiplier));

/**
 * Calculates the sign of the triangle formed by three Points.
 */
const triangleSign = (p1: GeometricPoint, p2: GeometricPoint, p3: GeometricPoint): number => {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

/**
 * Determines if a Point is inside a Triangle defined by three Points.
 */
export const PointInTriangle = (pt: GeometricPoint, v1: GeometricPoint, v2: GeometricPoint, v3: GeometricPoint): boolean => {
  const d1 = triangleSign(pt, v1, v2);
  const d2 = triangleSign(pt, v2, v3);
  const d3 = triangleSign(pt, v3, v1);

  const has_neg = d1 < 0 || d2 < 0 || d3 < 0;
  const has_pos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(has_neg && has_pos);
};

/**
 * Calculates the squared magnitude of a Vector.
 */
export const magnitudeSq = (vector: GeometricVector): number =>
  vector.x * vector.x + vector.y * vector.y;

/**
 * Calculates the magnitude of a Vector.
 */
export const magnitude = (vector: GeometricVector): number => Math.sqrt(magnitudeSq(vector));

/**
 * Normalizes a Vector to unit length.
 */
export const normalize = (vector: GeometricVector): GeometricVector => {
  const m = magnitude(vector);
  return { x: vector.x / m, y: vector.y / m };
};

/**
 * Adds two Vectors.
 */
export const addVectors = (
  vec1: Readonly<GeometricVector>,
  vec2: Readonly<GeometricVector>,
): GeometricVector => ({ x: vec1.x + vec2.x, y: vec1.y + vec2.y });

/**
 * Subtracts vec2 from vec1.
 */
export const subtractVectors = (
  vec1: Readonly<GeometricVector>,
  vec2: Readonly<GeometricVector>,
): GeometricVector => ({ x: vec1.x - vec2.x, y: vec1.y - vec2.y });

/**
 * Checks if a Point is inside given Bounds.
 */
export const pointInsideBounds = (p: GeometricPoint, bounds: Bounds): boolean =>
  p.x > bounds[0] && p.x < bounds[2] && p.y > bounds[1] && p.y < bounds[3];

/**
 * Get the axis-aligned bounding box for a given element.
 */
export const aabbForElement = (
  element: Readonly<DucElement>,
  offset?: [number, number, number, number],
): Bounds => {
  const bbox = {
    minX: element.x.scoped,
    minY: element.y.scoped,
    maxX: element.x.scoped + element.width.scoped,
    maxY: element.y.scoped + element.height.scoped,
    midX: element.x.scoped + element.width.scoped / 2,
    midY: element.y.scoped + element.height.scoped / 2,
  };

  const center: GeometricPoint = { x: bbox.midX, y: bbox.midY };
  const topLeft = rotatePoint({ x: bbox.minX, y: bbox.minY }, center, element.angle);
  const topRight = rotatePoint({ x: bbox.maxX, y: bbox.minY }, center, element.angle);
  const bottomRight = rotatePoint({ x: bbox.maxX, y: bbox.maxY }, center, element.angle);
  const bottomLeft = rotatePoint({ x: bbox.minX, y: bbox.maxY }, center, element.angle);

  const bounds: Bounds = [
    Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) as SV,
    Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) as SV,
    Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) as SV,
    Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) as SV,
  ];

  if (offset) {
    const [topOffset, rightOffset, downOffset, leftOffset] = offset;
    return [
      bounds[0] - leftOffset as SV,
      bounds[1] - topOffset as SV,
      bounds[2] + rightOffset as SV,
      bounds[3] + downOffset as SV,
    ];
  }

  return bounds;
};

type PolarCoords = [number, number];

/**
 * Returns the polar coordinates for the given cartesian point represented by
 * (x, y) for the center point 0,0 where the first number returned is the radius,
 * the second is the angle in radians.
 */
export const carthesian2Polar = ({ x, y }: GeometricPoint): PolarCoords => [
  Math.hypot(x, y),
  Math.atan2(y, x),
];

/**
 * Angles are in radians and centered on 0, 0. Zero radians on a 1 radius circle
 * corresponds to (1, 0) carthesian coordinates (point), i.e. to the "right".
 */
type SymmetricArc = { radius: number; startAngle: number; endAngle: number };

/**
 * Determines if a carthesian point lies on a symmetric arc, i.e. an arc which
 * is part of a circle contour centered on 0, 0.
 */
export const isPointOnSymmetricArc = (
  { radius: arcRadius, startAngle, endAngle }: SymmetricArc,
  point: GeometricPoint,
): boolean => {
  const [radius, angle] = carthesian2Polar(point);

  return startAngle < endAngle
    ? Math.abs(radius - arcRadius) < 0.0000001 &&
    startAngle <= angle &&
    endAngle >= angle
    : startAngle <= angle || endAngle >= angle;
};

/**
 * Gets the center point for given Bounds.
 */
export const getCenterForBounds = (bounds: Bounds): GeometricPoint => ({
  x: bounds[0] + (bounds[2] - bounds[0]) / 2,
  y: bounds[1] + (bounds[3] - bounds[1]) / 2,
});

/**
 * Gets the center point for a DucElement.
 */
export const getCenterForElement = (element: DucElement): GeometricPoint => ({
  x: element.x.scoped + element.width.scoped / 2,
  y: element.y.scoped + element.height.scoped / 2,
});

/**
 * Determines if two axis-aligned bounding boxes overlap.
 */
export const aabbsOverlapping = (a: Bounds, b: Bounds): boolean =>
  pointInsideBounds({ x: a[0], y: a[1] }, b) ||
  pointInsideBounds({ x: a[2], y: a[1] }, b) ||
  pointInsideBounds({ x: a[2], y: a[3] }, b) ||
  pointInsideBounds({ x: a[0], y: a[3] }, b) ||
  pointInsideBounds({ x: b[0], y: b[1] }, a) ||
  pointInsideBounds({ x: b[2], y: b[1] }, a) ||
  pointInsideBounds({ x: b[2], y: b[3] }, a) ||
  pointInsideBounds({ x: b[0], y: b[3] }, a);

/**
 * Clamps a value between min and max.
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Rounds a value to a specified precision.
 */
export const round = (value: number, precision: number): number => {
  const multiplier = Math.pow(10, precision);
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

export const fastRound = (num: number) => {
  return (num + 0.5) << 0;
};


export const polygonIncludesPointNonZero = <Point extends [number, number]>(
  point: Point,
  polygon: Point[],
): boolean => {
  const [x, y] = point;
  let windingNumber = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi <= y) {
      if (yj > y) {
        if ((xj - xi) * (y - yi) - (x - xi) * (yj - yi) > 0) {
          windingNumber++;
        }
      }
    } else if (yj <= y) {
      if ((xj - xi) * (y - yi) - (x - xi) * (yj - yi) < 0) {
        windingNumber--;
      }
    }
  }

  return windingNumber !== 0;
};

export const reverseExponent = (num: number): number => {
  if (num === 0) return 0; // Handle zero case

  // Find the order of magnitude
  const magnitude = Math.abs(num);
  const log10 = Math.log10(magnitude);
  const exponent = Math.floor(log10);

  // Calculate opposite exponent
  return num * Math.pow(10, -2 * exponent);
}

/**
 * Retrieves control points for a Bezier curve.
 */
export const getControlPointsForBezierCurve = (
  element: NonDeleted<DucLinearElement>,
  endPoint: GeometricPoint,
): (GeometricPoint)[] | null => {
  const endPointIndex = element.points.findIndex((p) =>
    arePointsEqual(getScopedBezierPointFromDucPoint(p), endPoint),
  );

  if (endPointIndex < 1) {
    return null;
  }

  const startPointIndex = endPointIndex - 1;

  const line = element.lines.find(
    (l) =>
      (l[0].index === startPointIndex && l[1].index === endPointIndex) ||
      (l[0].index === endPointIndex && l[1].index === startPointIndex),
  );

  if (!line || (!line[0].handle && !line[1].handle)) {
    return null;
  }
  
  const startRef = line[0].index === startPointIndex ? line[0] : line[1];
  const endRef = line[1].index === startPointIndex ? line[1] : line[0];
  
  const p0 = getScopedBezierPointFromDucPoint(element.points[startRef.index]);
  const p3 = getScopedBezierPointFromDucPoint(element.points[endRef.index]);

  if (startRef.handle && endRef.handle) {
    const p1 = getScopedBezierPointFromDucPoint(startRef.handle);
    const p2 = getScopedBezierPointFromDucPoint(endRef.handle);
    return [p0, p1, p2, p3];
  }

  // Quadratic bezier, we need to convert to cubic
  const p1 = getScopedBezierPointFromDucPoint(startRef.handle! || endRef.handle!);
  return [
    p0,
    { x: p0.x + 2/3 * (p1.x - p0.x) as ScopedValue, y: p0.y + 2/3 * (p1.y - p0.y) as ScopedValue},
    { x: p3.x + 2/3 * (p1.x - p3.x) as ScopedValue, y: p3.y + 2/3 * (p1.y - p3.y) as ScopedValue},
    p3
  ]
};

/**
 * Gets points along a Bezier curve for better accuracy.
 */
export const getPointsInBezierCurve = (
  element: NonDeleted<DucLinearElement>,
  endPoint: GeometricPoint,
): GeometricPoint[] => {
  const controlPoints: Mutable<GeometricPoint>[] = getControlPointsForBezierCurve(
    element,
    endPoint,
  )!;
  if (!controlPoints) {
    return [];
  }
  const pointsOnCurve: Mutable<GeometricPoint>[] = [];
  let t = 1;
  // Take 20 points on curve for better accuracy
  while (t > 0) {
    const point = getBezierXY(
      controlPoints[0],
      controlPoints[1],
      controlPoints[2],
      controlPoints[3],
      t,
    );
    pointsOnCurve.push({ x: point.x, y: point.y });
    t -= 0.05;
  }
  if (pointsOnCurve.length) {
    if (arePointsEqual(pointsOnCurve.at(-1)!, endPoint)) {
      pointsOnCurve.push({ x: endPoint.x, y: endPoint.y });
    }
  }
  return pointsOnCurve;
};

/**
 * Calculates the arc lengths of a Bezier curve.
 */
export const getBezierCurveArcLengths = (
  element: NonDeleted<DucLinearElement>,
  endPoint: GeometricPoint,
): number[] => {
  const arcLengths: number[] = [];
  arcLengths[0] = 0;
  const points = getPointsInBezierCurve(element, endPoint);
  let index = 0;
  let distance = 0;
  while (index < points.length - 1) {
    const segmentDistance = distance2d(
      points[index].x,
      points[index].y,
      points[index + 1].x,
      points[index + 1].y,
    );
    distance += segmentDistance;
    arcLengths.push(distance);
    index++;
  }

  return arcLengths;
};

/**
 * Calculates the total length of a Bezier curve.
 */
export const getBezierCurveLength = (
  element: NonDeleted<DucLinearElement>,
  endPoint: GeometricPoint,
): number => {
  const arcLengths = getBezierCurveArcLengths(element, endPoint);
  return arcLengths.at(-1) as number;
};


/**
 * Maps an interval to the corresponding t parameter on the Bezier curve based on length.
 */
export const mapIntervalToBezierT = (
  element: NonDeleted<DucLinearElement>,
  endPoint: GeometricPoint,
  interval: number, // The interval between 0 to 1 for which you want to find the point on the curve,
): number => {
  const arcLengths = getBezierCurveArcLengths(element, endPoint);
  if(arcLengths.length === 0) {
    return interval;
  }
  const pointsCount = arcLengths.length - 1;
  const curveLength = arcLengths.at(-1) as number;
  const targetLength = interval * curveLength;
  let low = 0;
  let high = pointsCount;
  let index = 0;
  // Doing a binary search to find the largest length that is less than the target length
  while (low < high) {
    index = Math.floor(low + (high - low) / 2);
    if (arcLengths[index] < targetLength) {
      low = index + 1;
    } else {
      high = index;
    }
  }
  if (arcLengths[index] > targetLength) {
    index--;
  }
  if (index < 0) {
    index = 0;
  }
  if (arcLengths[index] === targetLength) {
    return index / pointsCount;
  }
  
  if(arcLengths[index + 1] - arcLengths[index] === 0) return 1 - index / pointsCount

  return (
    1 -
    (index +
      (targetLength - arcLengths[index]) /
        (arcLengths[index + 1] - arcLengths[index])) /
      pointsCount
  );
};

// Helper function to sample a point on a cubic Bézier curve
export const sampleCubicBezier = (
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
  t: number
): GeometricPoint => {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
};

// Helper function to sample a point on a quadratic Bézier curve
export const sampleQuadraticBezier = (
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  t: number
): GeometricPoint => {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;

  return {
    x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
    y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y,
  };
};