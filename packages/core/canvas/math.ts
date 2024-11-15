import type {
  NormalizedZoomValue,
  NullableGridSize,
  Point,
  Zoom,
} from "./types";
import {
  DEFAULT_ADAPTIVE_RADIUS,
  LINE_CONFIRM_THRESHOLD,
  DEFAULT_PROPORTIONAL_RADIUS,
  ROUNDNESS,
} from "./constants";
import type {
  DucElement,
  DucLinearElement,
  NonDeleted,
} from "./element/types";
import type { Bounds } from "./element/bounds";
import { getCurvePathOps } from "./element/bounds";
import type { Mutable } from "./utility-types";
import { ShapeCache } from "./scene/ShapeCache";
import type { Vector } from "../utils/geometry/shape";
import { Heading } from "./element/heading";

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
): Point => ({
  x: (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
  y: (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
});

/**
 * Rotates a Point around another Point by a given angle.
 * Returns the rotated point as a Point object.
 */
export const rotatePoint = (
  point: Point,
  center: Point,
  angle: number,
): Point => rotate(point.x, point.y, center.x, center.y, angle);

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
): Point => {
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
export const getPointOnAPath = (point: Point, path: Point[]) => {
  const { x: px, y: py } = point;
  const [start, ...other] = path;
  let { x: lastX, y: lastY } = start;
  let kLine: number = 0;
  let idx: number = 0;

  // If any item in the array is true, it means that a point is
  // on some segment of a line-based path
  const retVal = other.some(({x: x2, y: y2}, i) => {
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
export const distanceSq2d = (p1: Point, p2: Point): number => {
  const xd = p2.x - p1.x;
  const yd = p2.y - p1.y;
  return xd * xd + yd * yd;
};

/**
 * Calculates the center point between two Points.
 */
export const centerPoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

/**
 * Checks if the first and last point are close enough to be considered a loop.
 */
export const isPathALoop = (
  points: DucLinearElement["points"],
  /** Supply if you want the loop detection to account for current zoom */
  zoomValue: Zoom["value"] = 1 as NormalizedZoomValue,
): boolean => {
  if (points.length >= 3) {
    const [first, last] = [points[0], points[points.length - 1]];
    const distance = distance2d(first.x, first.y, last.x, last.y);

    // Adjusting LINE_CONFIRM_THRESHOLD to current zoom so that when zoomed in
    // really close we make the threshold smaller, and vice versa.
    return distance <= LINE_CONFIRM_THRESHOLD / zoomValue;
  }
  return false;
};

/**
 * Determines if a Point is inside a Polygon defined by an array of Points.
 */
export const isPointInPolygon = (
  points: Point[],
  x: number,
  y: number,
): boolean => {
  const vertices = points.length;

  // There must be at least 3 vertices in polygon
  if (vertices < 3) {
    return false;
  }
  const extreme: Point = { x: Number.MAX_SAFE_INTEGER, y };
  const p: Point = { x, y };
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
export const isPointWithinBounds = (p: Point, q: Point, r: Point): boolean => {
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
const orderedColinearOrientation = (p: Point, q: Point, r: Point): number => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) {
    return 0;
  }
  return val > 0 ? 1 : 2;
};

/**
 * Checks if two segments p1q1 and p2q2 intersect.
 */
const doSegmentsIntersect = (p1: Point, q1: Point, p2: Point, q2: Point): boolean => {
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
): Point => {
  if (gridSize) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }
  return { x, y };
};

/**
 * Calculates the corner radius based on element's roundness type.
 */
export const getCornerRadius = (x: number, element: DucElement): number => {
  if (
    element.roundness?.type === ROUNDNESS.PROPORTIONAL_RADIUS ||
    element.roundness?.type === ROUNDNESS.LEGACY
  ) {
    return x * DEFAULT_PROPORTIONAL_RADIUS;
  }

  if (element.roundness?.type === ROUNDNESS.ADAPTIVE_RADIUS) {
    const fixedRadiusSize = element.roundness?.value ?? DEFAULT_ADAPTIVE_RADIUS;

    const CUTOFF_SIZE = fixedRadiusSize / DEFAULT_PROPORTIONAL_RADIUS;

    if (x <= CUTOFF_SIZE) {
      return x * DEFAULT_PROPORTIONAL_RADIUS;
    }

    return fixedRadiusSize;
  }

  return 0;
};

/**
 * Retrieves control points for a Bezier curve.
 */
export const getControlPointsForBezierCurve = (
  element: NonDeleted<DucLinearElement>,
  endPoint: Point,
): Mutable<Point>[] | null => {
  const shape = ShapeCache.generateElementShape(element, null);
  if (!shape) {
    return null;
  }

  const ops = getCurvePathOps(shape[0]);
  let currentP: Mutable<Point> = { x: 0, y: 0 };
  let index = 0;
  let minDistance = Infinity;
  let controlPoints: Mutable<Point>[] | null = null;

  while (index < ops.length) {
    const { op, data } = ops[index];
    if (op === "move") {
      currentP = data as unknown as Mutable<Point>;
    }
    if (op === "bcurveTo") {
      const p0 = currentP;
      const p1: Mutable<Point> = { x: data[0], y: data[1] };
      const p2: Mutable<Point> = { x: data[2], y: data[3] };
      const p3: Mutable<Point> = { x: data[4], y: data[5] };
      const distance = distance2d(p3.x, p3.y, endPoint.x, endPoint.y);
      if (distance < minDistance) {
        minDistance = distance;
        controlPoints = [p0, p1, p2, p3];
      }
      currentP = p3;
    }
    index++;
  }

  return controlPoints;
};

/**
 * Calculates a point on a Bezier curve at parameter t.
 * Returns the point as a Point object.
 */
export const getBezierXY = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point => {
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
 * Gets points along a Bezier curve for better accuracy.
 */
export const getPointsInBezierCurve = (
  element: NonDeleted<DucLinearElement>,
  endPoint: Point,
): Point[] => {
  const controlPoints: Mutable<Point>[] = getControlPointsForBezierCurve(
    element,
    endPoint,
  )!;
  if (!controlPoints) {
    return [];
  }
  const pointsOnCurve: Mutable<Point>[] = [];
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
  endPoint: Point,
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
  endPoint: Point,
): number => {
  const arcLengths = getBezierCurveArcLengths(element, endPoint);
  return arcLengths.at(-1) as number;
};

/**
 * Maps an interval to the corresponding t parameter on the Bezier curve based on length.
 */
export const mapIntervalToBezierT = (
  element: NonDeleted<DucLinearElement>,
  endPoint: Point,
  interval: number, // The interval between 0 to 1 for which you want to find the point on the curve,
): number => {
  const arcLengths = getBezierCurveArcLengths(element, endPoint);
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
  if (arcLengths[index] === targetLength) {
    return index / pointsCount;
  }

  return (
    1 -
    (index +
      (targetLength - arcLengths[index]) /
        (arcLengths[index + 1] - arcLengths[index])) /
      pointsCount
  );
};

/**
 * Checks if two Points are equal based on their x and y coordinates.
 */
export const arePointsEqual = (p1: Point, p2: Point): boolean => {
  return p1.x === p2.x && p1.y === p2.y;
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
export const translatePoint = (p: Point, v: Vector): Point => ({
  x: p.x + v.x,
  y: p.y + v.y,
});

/**
 * Scales a Vector by a scalar.
 */
export const scaleVector = (v: Vector, scalar: number): Vector => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

/**
 * Converts a Point to a Vector relative to an origin.
 */
export const pointToVector = (p: Point, origin: Point = { x: 0, y: 0 }): Vector => ({
  x: p.x - origin.x,
  y: p.y - origin.y,
})

export const vectorToPoint = (v: Vector, origin: Point = { x: 0, y: 0 }): Point => ({
  x: v.x + origin.x,
  y: v.y + origin.y,
})

export const headingToPoint = (heading: Heading): Point => ({
  x: heading.x,
  y: heading.y
})
/**
 * Scales a Point from a midpoint by a multiplier.
 */
export const scalePointFromOrigin = (
  p: Point,
  mid: Point,
  multiplier: number,
): Point => translatePoint(mid, scaleVector(pointToVector(p, mid), multiplier));

/**
 * Calculates the sign of the triangle formed by three Points.
 */
const triangleSign = (p1: Point, p2: Point, p3: Point): number => {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

/**
 * Determines if a Point is inside a Triangle defined by three Points.
 */
export const PointInTriangle = (pt: Point, v1: Point, v2: Point, v3: Point): boolean => {
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
export const magnitudeSq = (vector: Vector): number =>
  vector.x * vector.x + vector.y * vector.y;

/**
 * Calculates the magnitude of a Vector.
 */
export const magnitude = (vector: Vector): number => Math.sqrt(magnitudeSq(vector));

/**
 * Normalizes a Vector to unit length.
 */
export const normalize = (vector: Vector): Vector => {
  const m = magnitude(vector);
  return {x: vector.x / m, y: vector.y / m};
};

/**
 * Adds two Vectors.
 */
export const addVectors = (
  vec1: Readonly<Vector>,
  vec2: Readonly<Vector>,
): Vector => ({x: vec1.x + vec2.x, y: vec1.y + vec2.y});

/**
 * Subtracts vec2 from vec1.
 */
export const subtractVectors = (
  vec1: Readonly<Vector>,
  vec2: Readonly<Vector>,
): Vector => ({x: vec1.x - vec2.x, y: vec1.y - vec2.y});

/**
 * Checks if a Point is inside given Bounds.
 */
export const pointInsideBounds = (p: Point, bounds: Bounds): boolean =>
  p.x > bounds[0] && p.x < bounds[2] && p.y > bounds[1] && p.y < bounds[3];

/**
 * Get the axis-aligned bounding box for a given element.
 */
export const aabbForElement = (
  element: Readonly<DucElement>,
  offset?: [number, number, number, number],
): Bounds => {
  const bbox = {
    minX: element.x,
    minY: element.y,
    maxX: element.x + element.width,
    maxY: element.y + element.height,
    midX: element.x + element.width / 2,
    midY: element.y + element.height / 2,
  };

  const center: Point = { x: bbox.midX, y: bbox.midY };
  const topLeft = rotatePoint({ x: bbox.minX, y: bbox.minY }, center, element.angle);
  const topRight = rotatePoint({ x: bbox.maxX, y: bbox.minY }, center, element.angle);
  const bottomRight = rotatePoint({ x: bbox.maxX, y: bbox.maxY }, center, element.angle);
  const bottomLeft = rotatePoint({ x: bbox.minX, y: bbox.maxY }, center, element.angle);

  const bounds: Bounds = [
    Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x),
    Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y),
    Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x),
    Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y),
  ];

  if (offset) {
    const [topOffset, rightOffset, downOffset, leftOffset] = offset;
    return [
      bounds[0] - leftOffset,
      bounds[1] - topOffset,
      bounds[2] + rightOffset,
      bounds[3] + downOffset,
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
export const carthesian2Polar = ({ x, y }: Point): PolarCoords => [
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
  point: Point,
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
export const getCenterForBounds = (bounds: Bounds): Point => ({
  x: bounds[0] + (bounds[2] - bounds[0]) / 2,
  y: bounds[1] + (bounds[3] - bounds[1]) / 2,
});

/**
 * Gets the center point for a DucElement.
 */
export const getCenterForElement = (element: DucElement): Point => ({
  x: element.x + element.width / 2,
  y: element.y + element.height / 2,
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
