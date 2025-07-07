/**
 * This file defines pure geometric shapes
 *
 * For instance, a cubic bezier curve is specified by its four control points and
 * an ellipse is defined by its center, angle, semi-major axis, and semi-minor axis
 * (but in halfWidth and halfHeight instead, so it's more relevant to Duc).
 *
 * The idea with pure shapes is so that we can provide collision and other geometric methods not depending on
 * the specifics of roughjs or elements in Duc; instead, we can focus on the pure shapes themselves.
 *
 * Also included in this file are methods for converting a Duc element or a Drawable from roughjs
 * to pure shapes.
 */

import type { DucBindableElement } from "ducjs/legacy/v1/types/elements";
import {
  addVectors,
  distance2d,
  rotatePoint,
  scaleVector,
  subtractVectors,
} from "ducjs/legacy/v1/utils/math";
import type { LineSegment } from "ducjs/legacy/v1/types/geometryTypes";
import { crossProduct } from "ducjs/legacy/v1/utils/math/bbox";
import type {
  GeometricPoint,
  Line,
  Polygon,
  Curve,
  Ellipse,
  Polycurve,
  Polyline,
} from "ducjs/legacy/v1/types/geometryTypes";

const DEFAULT_THRESHOLD = 10e-5;

/**
 * Utils
 */

// The two vectors are AO and BO
export const cross = (
  a: Readonly<GeometricPoint>,
  b: Readonly<GeometricPoint>,
  o: Readonly<GeometricPoint>,
): number => {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
};

export const dot = (
  a: Readonly<GeometricPoint>,
  b: Readonly<GeometricPoint>,
  o: Readonly<GeometricPoint>,
): number => {
  return (a.x - o.x) * (b.x - o.x) + (a.y - o.y) * (b.y - o.y);
};

export const isClosed = (polygon: Polygon): boolean => {
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  return first.x === last.x && first.y === last.y;
};

export const close = (polygon: Polygon) => {
  return isClosed(polygon) ? polygon : [...polygon, polygon[0]];
};

/**
 * Angles
 */

// Convert radians to degrees
export const angleToDegrees = (angle: number): number => {
  const theta = (angle * 180) / Math.PI;
  return theta < 0 ? 360 + theta : theta;
};

// Convert degrees to radians
export const angleToRadians = (angle: number): number => {
  return (angle / 180) * Math.PI;
};

// Return the angle of reflection given an angle of incidence and a surface angle in degrees
export const angleReflect = (incidenceAngle: number, surfaceAngle: number): number => {
  const a = surfaceAngle * 2 - incidenceAngle;
  return a >= 360 ? a - 360 : a < 0 ? a + 360 : a;
};

/**
 * Points
 */

// Rotate a given point about a given origin by the given angle in radians
const rotate = (point: GeometricPoint, angle: number): GeometricPoint => {
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
};

const isOrigin = (point: GeometricPoint): boolean => {
  return point.x === 0 && point.y === 0;
};

// Rotate a given point about a given origin by the given angle in degrees
// Rotate a given point about a given origin by the given angle in degrees
export const pointRotate = (
  point: GeometricPoint,
  angle: number,
  origin?: GeometricPoint,
): GeometricPoint => {
  const r = angleToRadians(angle);

  if (!origin || isOrigin(origin)) {
    return rotate(point, r); // Rotate around (0, 0) if origin is undefined or at (0, 0)
  }

  // Translate, rotate, and translate back
  const translatedPoint: GeometricPoint = {
    x: point.x - origin.x,
    y: point.y - origin.y,
  };

  const rotatedPoint = rotate(translatedPoint, r);

  return {
    x: rotatedPoint.x + origin.x,
    y: rotatedPoint.y + origin.y,
  };
};

// Translate a point by an angle (in degrees) and distance
export const pointTranslate = (point: GeometricPoint, angle = 0, distance = 0): GeometricPoint => {
  const radians = angleToRadians(angle);
  return {
    x: point.x + distance * Math.cos(radians),
    y: point.y + distance * Math.sin(radians),
  };
};

// Inverse of a point
export const pointInverse = (point: GeometricPoint): GeometricPoint => {
  return { x: -point.x, y: -point.y };
};

// Add two points (vectors)
export const pointAdd = (pointA: GeometricPoint, pointB: GeometricPoint): GeometricPoint => {
  return { x: pointA.x + pointB.x, y: pointA.y + pointB.y };
};

// Calculate distance between two points
export const distanceToPoint = (p1: GeometricPoint, p2: GeometricPoint): number => {
  return distance2d(p1.x, p1.y, p2.x, p2.y);
};

/**
 * Lines
 */

// Return the angle of a line, in degrees
export const lineAngle = (line: Line): number => {
  return angleToDegrees(
    Math.atan2(line[1].y - line[0].y, line[1].x - line[0].x),
  );
};

// Get the distance between the endpoints of a line segment
export const lineLength = (line: Line): number => {
  return Math.sqrt(
    Math.pow(line[1].x - line[0].x, 2) + Math.pow(line[1].y - line[0].y, 2),
  );
};

// Get the midpoint of a line segment
export const lineMidpoint = (line: Line): GeometricPoint => {
  return {
    x: (line[0].x + line[1].x) / 2,
    y: (line[0].y + line[1].y) / 2,
  };
};

// return the coordinates resulting from rotating the given line about an origin by an angle in degrees
// note that when the origin is not given, the midpoint of the given line is used as the origin
export const lineRotate = (line: Line, angle: number, origin?: GeometricPoint): Line => {
  return line.map((point) =>
    pointRotate(point, angle, origin || lineMidpoint(line)),
  ) as Line;
};

// returns the coordinates resulting from translating a line by an angle in degrees and a distance.
export const lineTranslate = (line: Line, angle: number, distance: number) => {
  return line.map((point) => pointTranslate(point, angle, distance));
};

export const lineInterpolate = (line: Line, clamp = false) => {
  const [{x: x1, y:y1}, {x:x2, y:y2}] = line;
  return (t: number) => {
    const t0 = clamp ? (t < 0 ? 0 : t > 1 ? 1 : t) : t;
    return {x:(x2 - x1) * t0 + x1, y:(y2 - y1) * t0 + y1} as GeometricPoint;
  };
};

/**
 * Curves
 */

// Clone a point
function clone(p: GeometricPoint): GeometricPoint {
  return { x: p.x, y: p.y } as GeometricPoint;
}

export const curveToBezier = (
  pointsIn: readonly GeometricPoint[],
  curveTightness = 0,
): GeometricPoint[] => {
  const len = pointsIn.length;
  if (len < 3) {
    throw new Error("A curve must have at least three points.");
  }
  const out: GeometricPoint[] = [];
  if (len === 3) {
    out.push(
      clone(pointsIn[0]),
      clone(pointsIn[1]),
      clone(pointsIn[2]),
      clone(pointsIn[2]),
    );
  } else {
    const points: GeometricPoint[] = [];
    points.push(pointsIn[0], pointsIn[0]);
    for (let i = 1; i < pointsIn.length; i++) {
      points.push(pointsIn[i]);
      if (i === pointsIn.length - 1) {
        points.push(pointsIn[i]);
      }
    }
    const b: GeometricPoint[] = [];
    const s = 1 - curveTightness;
    out.push(clone(points[0]));
    for (let i = 1; i + 2 < points.length; i++) {
      const cachedVertArray = points[i];
      b[0] = {x: cachedVertArray.x, y: cachedVertArray.y};
      b[1] = {
        x: cachedVertArray.x + (s * points[i + 1].x - s * points[i - 1].x) / 6,
        y: cachedVertArray.y + (s * points[i + 1].y - s * points[i - 1].y) / 6,
      };
      b[2] = {
        x: points[i + 1].x + (s * points[i].x - s * points[i + 2].x) / 6,
        y: points[i + 1].y + (s * points[i].y - s * points[i + 2].y) / 6,
      };
      b[3] = {x: points[i + 1].x, y: points[i + 1].y};
      out.push(b[1], b[2], b[3]);
    }
  }
  return out;
};

export const curveRotate = (curve: Curve, angle: number, origin: GeometricPoint) => {
  return curve.map((p) => pointRotate(p, angle, origin));
};

// Calculate a point on a cubic Bezier curve at parameter t
export const cubicBezierPoint = (t: number, controlPoints: Curve): GeometricPoint => {
  const [p0, p1, p2, p3] = controlPoints;

  const x =
    Math.pow(1 - t, 3) * p0.x +
    3 * Math.pow(1 - t, 2) * t * p1.x +
    3 * (1 - t) * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x;

  const y =
    Math.pow(1 - t, 3) * p0.y +
    3 * Math.pow(1 - t, 2) * t * p1.y +
    3 * (1 - t) * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y;

  return { x, y };
};

const solveCubicEquation = (a: number, b: number, c: number, d: number) => {
  // This function solves the cubic equation ax^3 + bx^2 + cx + d = 0
  const roots: number[] = [];

  const discriminant =
    18 * a * b * c * d -
    4 * Math.pow(b, 3) * d +
    Math.pow(b, 2) * Math.pow(c, 2) -
    4 * a * Math.pow(c, 3) -
    27 * Math.pow(a, 2) * Math.pow(d, 2);

  if (discriminant >= 0) {
    const C = Math.cbrt((discriminant + Math.sqrt(discriminant)) / 2);
    const D = Math.cbrt((discriminant - Math.sqrt(discriminant)) / 2);

    const root1 = (-b - C - D) / (3 * a);
    const root2 = (-b + (C + D) / 2) / (3 * a);
    const root3 = (-b + (C + D) / 2) / (3 * a);

    roots.push(root1, root2, root3);
  } else {
    const realPart = -b / (3 * a);

    const root1 =
      2 * Math.sqrt(-b / (3 * a)) * Math.cos(Math.acos(realPart) / 3);
    const root2 =
      2 *
      Math.sqrt(-b / (3 * a)) *
      Math.cos((Math.acos(realPart) + 2 * Math.PI) / 3);
    const root3 =
      2 *
      Math.sqrt(-b / (3 * a)) *
      Math.cos((Math.acos(realPart) + 4 * Math.PI) / 3);

    roots.push(root1, root2, root3);
  }

  return roots;
};

const findClosestParameter = (point: GeometricPoint, controlPoints: Curve) => {
  // This function finds the parameter t that minimizes the distance between the point
  // and any point on the cubic Bezier curve.

  const [p0, p1, p2, p3] = controlPoints;

  // Use the direct formula to find the parameter t
  const a = p3.x - 3 * p2.x + 3 * p1.x - p0.x;
  const b = 3 * p2.x - 6 * p1.x + 3 * p0.x;
  const c = 3 * p1.x - 3 * p0.x;
  const d = p0.x - point.x;

  const rootsX = solveCubicEquation(a, b, c, d);

  // Do the same for the y-coordinate
  const e = p3.y - 3 * p2.y + 3 * p1.y - p0.y;
  const f = 3 * p2.y - 6 * p1.y + 3 * p0.y;
  const g = 3 * p1.y - 3 * p0.y;
  const h = p0.y - point.y;

  const rootsY = solveCubicEquation(e, f, g, h);

  // Select the real root that is between 0 and 1 (inclusive)
  const validRootsX = rootsX.filter((root) => root >= 0 && root <= 1);
  const validRootsY = rootsY.filter((root) => root >= 0 && root <= 1);

  if (validRootsX.length === 0 || validRootsY.length === 0) {
    // No valid roots found, use the midpoint as a fallback
    return 0.5;
  }

  // Choose the parameter t that minimizes the distance
  let minDistance = Infinity;
  let closestT = 0;

  for (const rootX of validRootsX) {
    for (const rootY of validRootsY) {
      const distance = Math.sqrt(
        (rootX - point.x) ** 2 + (rootY - point.y) ** 2,
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestT = (rootX + rootY) / 2; // Use the average for a smoother result
      }
    }
  }

  return closestT;
};

export const cubicBezierDistance = (point: GeometricPoint, controlPoints: Curve) => {
  // Calculate the closest point on the Bezier curve to the given point
  const t = findClosestParameter(point, controlPoints);

  // Calculate the coordinates of the closest point on the curve
  const {x: closestX, y: closestY} = cubicBezierPoint(t, controlPoints);

  // Calculate the distance between the given point and the closest point on the curve
  const distance = Math.sqrt(
    (point.x - closestX) ** 2 + (point.y - closestY) ** 2,
  );

  return distance;
};

/**
 * Polygons
 */

// Rotate a polygon by an angle in degrees around an origin
export const polygonRotate = (
  polygon: Polygon,
  angle: number,
  origin: GeometricPoint,
) => {
  return polygon.map((p) => pointRotate(p, angle, origin));
};

// Get the bounding box of a polygon
export const polygonBounds = (polygon: Polygon): [GeometricPoint, GeometricPoint] => {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (let i = 0, l = polygon.length; i < l; i++) {
    const p = polygon[i];
    const x = p.x;
    const y = p.y;

    if (x != null && isFinite(x) && y != null && isFinite(y)) {
      if (x < xMin) {
        xMin = x;
      }
      if (x > xMax) {
        xMax = x;
      }
      if (y < yMin) {
        yMin = y;
      }
      if (y > yMax) {
        yMax = y;
      }
    }
  }

  return [
    { x: xMin, y: yMin },
    { x: xMax, y: yMax },
  ] as [GeometricPoint, GeometricPoint];
};

export const polygonCentroid = (vertices: GeometricPoint[]) => {
  let a = 0;
  let x = 0;
  let y = 0;
  const l = vertices.length;

  for (let i = 0; i < l; i++) {
    const s = i === l - 1 ? 0 : i + 1;
    const v0 = vertices[i];
    const v1 = vertices[s];
    const f = v0.x * v1.y - v1.x * v0.y;

    a += f;
    x += (v0.x + v1.x) * f;
    y += (v0.y + v1.y) * f;
  }

  const d = a * 3;

  return { x: x / d, y: y / d } as GeometricPoint;
};

// Scale a polygon uniformly
export const polygonScale = (
  polygon: Polygon,
  scale: number,
  origin?: GeometricPoint,
) => {
  if (!origin) {
    origin = polygonCentroid(polygon);
  }

  const p: Polygon = [];

  for (let i = 0, l = polygon.length; i < l; i++) {
    const v = polygon[i];
    const d = lineLength([origin, v]);
    const a = lineAngle([origin, v]);

    p[i] = pointTranslate(origin, a, d * scale);
  }

  return p;
};


// Scale a polygon along the X-axis
export const polygonScaleX = (
  polygon: Polygon,
  scale: number,
  origin?: GeometricPoint,
) => {
  if (!origin) {
    origin = polygonCentroid(polygon);
  }

  const p: Polygon = [];

  for (let i = 0, l = polygon.length; i < l; i++) {
    const v = polygon[i];
    const d = lineLength([origin, v]);
    const a = lineAngle([origin, v]);
    const t = pointTranslate(origin, a, d * scale);

    p[i] = {x: t.x, y: v.y};
  }

  return p;
};


// Scale a polygon along the Y-axis
export const polygonScaleY = (
  polygon: Polygon,
  scale: number,
  origin?: GeometricPoint,
) => {
  if (!origin) {
    origin = polygonCentroid(polygon);
  }

  const p: Polygon = [];

  for (let i = 0, l = polygon.length; i < l; i++) {
    const v = polygon[i];
    const d = lineLength([origin, v]);
    const a = lineAngle([origin, v]);
    const t = pointTranslate(origin, a, d * scale);

    p[i] = { x: v.x, y: t.y };
  }

  return p;
};

export const polygonReflectX = (polygon: Polygon, reflectFactor = 1) => {
  const [{ x: minX }, { x: maxX }] = polygonBounds(polygon);
  const p: GeometricPoint[] = [];

  for (let i = 0, l = polygon.length; i < l; i++) {
    const { x, y } = polygon[i];
    const r: GeometricPoint = { x: minX + maxX - x, y };

    if (reflectFactor === 0) {
      p[i] = { x, y };
    } else if (reflectFactor === 1) {
      p[i] = r;
    } else {
      const t = lineInterpolate([{ x, y }, r]);
      p[i] = t(Math.max(Math.min(reflectFactor, 1), 0));
    }
  }

  return p;
};

export const polygonReflectY = (polygon: Polygon, reflectFactor = 1) => {
  const [{ y: minY }, { y: maxY }] = polygonBounds(polygon);
  const p: GeometricPoint[] = [];

  for (let i = 0, l = polygon.length; i < l; i++) {
    const { x, y } = polygon[i];
    const r: GeometricPoint = { x, y: minY + maxY - y };

    if (reflectFactor === 0) {
      p[i] = { x, y };
    } else if (reflectFactor === 1) {
      p[i] = r;
    } else {
      const t = lineInterpolate([{ x, y }, r]);
      p[i] = t(Math.max(Math.min(reflectFactor, 1), 0));
    }
  }

  return p;
};

export const polygonTranslate = (
  polygon: Polygon,
  angle: number,
  distance: number,
) => {
  return polygon.map((p) => pointTranslate(p, angle, distance));
};

/**
 * Ellipses
 */

export const ellipseAxes = (ellipse: Ellipse) => {
  const widthGreaterThanHeight = ellipse.halfWidth > ellipse.halfHeight;

  const majorAxis = widthGreaterThanHeight
    ? ellipse.halfWidth * 2
    : ellipse.halfHeight * 2;
  const minorAxis = widthGreaterThanHeight
    ? ellipse.halfHeight * 2
    : ellipse.halfWidth * 2;

  return {
    majorAxis,
    minorAxis,
  };
};

export const ellipseFocusToCenter = (ellipse: Ellipse) => {
  const { majorAxis, minorAxis } = ellipseAxes(ellipse);

  return Math.sqrt(majorAxis ** 2 - minorAxis ** 2);
};

export const ellipseExtremes = (ellipse: Ellipse) => {
  const { center, angle } = ellipse;
  const { majorAxis, minorAxis } = ellipseAxes(ellipse);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const sqSum = majorAxis ** 2 + minorAxis ** 2;
  const sqDiff = (majorAxis ** 2 - minorAxis ** 2) * Math.cos(2 * angle);

  const yMax = Math.sqrt((sqSum - sqDiff) / 2);
  const xAtYMax =
    (yMax * sqSum * sin * cos) /
    (majorAxis ** 2 * sin ** 2 + minorAxis ** 2 * cos ** 2);

  const xMax = Math.sqrt((sqSum + sqDiff) / 2);
  const yAtXMax =
    (xMax * sqSum * sin * cos) /
    (majorAxis ** 2 * cos ** 2 + minorAxis ** 2 * sin ** 2);

  return [
    pointAdd({ x: xAtYMax, y: yMax }, center),
    pointAdd(pointInverse({ x: xAtYMax, y: yMax }), center),
    pointAdd({ x: xMax, y: yAtXMax }, center),
    pointAdd({ x: xMax, y: yAtXMax }, center),
  ];
};

export const pointRelativeToCenter = (
  point: GeometricPoint,
  center: GeometricPoint,
  angle: number,
): GeometricPoint => {
  const translated = pointAdd(point, pointInverse(center));
  const rotated = pointRotate(translated, -angleToDegrees(angle));

  return rotated;
};

/**
 * Relationships
 */

// Ensure the top point of the line is first based on Y-coordinate
const topPointFirst = (line: Line): Line => {
  return line[1].y > line[0].y ? line : [line[1], line[0]];
};

// Determine if a point is to the left of a line
export const pointLeftofLine = (point: GeometricPoint, line: Line): boolean => {
  const t = topPointFirst(line);
  return cross(point, t[1], t[0]) < 0;
};

// Determine if a point is to the right of a line
export const pointRightofLine = (point: GeometricPoint, line: Line): boolean => {
  const t = topPointFirst(line);
  return cross(point, t[1], t[0]) > 0;
};

// Calculate the distance from a point to a line segment
export const distanceToSegment = (point: GeometricPoint, line: Line): number => {
  const { x, y } = point;
  const [start, end] = line;

  const A = x - start.x;
  const B = y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dotProd = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dotProd / len_sq;
  }

  let xx: number, yy: number;

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

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Determine if a point lies on a line segment within a threshold
export const pointOnLine = (
  point: GeometricPoint,
  line: Line,
  threshold = DEFAULT_THRESHOLD,
): boolean => {
  const distance = distanceToSegment(point, line);

  if (distance === 0) {
    return true;
  }

  return distance < threshold;
};

// Determine if a point lies on any segment of a polyline within a threshold
export const pointOnPolyline = (
  point: GeometricPoint,
  polyline: Polyline,
  threshold = DEFAULT_THRESHOLD,
): boolean => {
  return polyline.some((line) => pointOnLine(point, line, threshold));
};

export const lineIntersectsLine = (lineA: Line, lineB: Line) => {
  const [{ x: a0x, y: a0y }, { x: a1x, y: a1y }] = lineA;
  const [{ x: b0x, y: b0y }, { x: b1x, y: b1y }] = lineB;

  // shared points
  if ((a0x === b0x && a0y === b0y) || (a1x === b1x && a1y === b1y)) {
    return true;
  }

  // point on line
  if (pointOnLine(lineA[0], lineB) || pointOnLine(lineA[1], lineB)) {
    return true;
  }
  if (pointOnLine(lineB[0], lineA) || pointOnLine(lineB[1], lineA)) {
    return true;
  }

  const denom = (b1y - b0y) * (a1x - a0x) - (b1x - b0x) * (a1y - a0y);

  if (denom === 0) {
    return false;
  }

  const deltaY = a0y - b0y;
  const deltaX = a0x - b0x;
  const numer0 = (b1x - b0x) * deltaY - (b1y - b0y) * deltaX;
  const numer1 = (a1x - a0x) * deltaY - (a1y - a0y) * deltaX;
  const quotA = numer0 / denom;
  const quotB = numer1 / denom;

  return quotA > 0 && quotA < 1 && quotB > 0 && quotB < 1;
};

export const lineIntersectsPolygon = (line: Line, polygon: Polygon) => {
  let intersects = false;
  const closed = close(polygon);

  for (let i = 0, l = closed.length - 1; i < l; i++) {
    const v0 = closed[i];
    const v1 = closed[i + 1];

    if (
      lineIntersectsLine(line, [v0, v1]) ||
      (pointOnLine(v0, line) && pointOnLine(v1, line))
    ) {
      intersects = true;
      break;
    }
  }

  return intersects;
};

// Check if a point lies on a Bezier curve within a threshold
export const pointInBezierEquation = (
  p0: GeometricPoint,
  p1: GeometricPoint,
  p2: GeometricPoint,
  p3: GeometricPoint,
  { x: mx, y: my }: GeometricPoint,
  lineThreshold: number,
) => {
  // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
  const equation = (t: number, coord: 'x' | 'y') =>
    Math.pow(1 - t, 3) * p3[coord] +
    3 * t * Math.pow(1 - t, 2) * p2[coord] +
    3 * Math.pow(t, 2) * (1 - t) * p1[coord] +
    p0[coord] * Math.pow(t, 3);

  const lineSegmentPoints: GeometricPoint[] = [];
  let t = 0;
  while (t <= 1.0) {
    const tx = equation(t, 'x');
    const ty = equation(t, 'y');

    const diff = Math.sqrt(Math.pow(tx - mx, 2) + Math.pow(ty - my, 2));

    if (diff < lineThreshold) {
      return true;
    }

    lineSegmentPoints.push({ x: tx, y: ty });

    t += 0.1;
  }

  // check the distance from line segments to the given point

  return false;
};


export const cubicBezierEquation = (curve: Curve) => {
  const [p0, p1, p2, p3] = curve;
  // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
  return (t: number, coord: 'x' | 'y') =>
    Math.pow(1 - t, 3) * p3[coord] +
    3 * t * Math.pow(1 - t, 2) * p2[coord] +
    3 * Math.pow(t, 2) * (1 - t) * p1[coord] +
    p0[coord] * Math.pow(t, 3);
};


// Convert a curve to a polyline with a specified number of segments
export const polyLineFromCurve = (curve: Curve, segments = 10): Polyline => {
  const equation = cubicBezierEquation(curve);
  let startingPoint: GeometricPoint = { x: equation(0, "x"), y: equation(0, "y") };
  const lineSegments: Polyline = [];
  let t = 0;
  const increment = 1 / segments;

  for (let i = 0; i < segments; i++) {
    t += increment;
    if (t <= 1) {
      const nextPoint: GeometricPoint = { x: equation(t, "x"), y: equation(t, "y") };
      lineSegments.push([startingPoint, nextPoint]);
      startingPoint = nextPoint;
    }
  }

  return lineSegments;
};

// Determine if a point lies on a cubic Bezier curve within a threshold
export const pointOnCurve = (
  point: GeometricPoint,
  curve: Curve,
  threshold = DEFAULT_THRESHOLD,
): boolean => {
  return pointOnPolyline(point, polyLineFromCurve(curve), threshold);
};

// Determine if a point lies on any curve in a polycurve within a threshold
export const pointOnPolycurve = (
  point: GeometricPoint,
  polycurve: Polycurve,
  threshold = DEFAULT_THRESHOLD,
): boolean => {
  return polycurve.some((curve) => pointOnCurve(point, curve, threshold));
};

// Determine if a point lies inside a polygon using the ray-casting algorithm
export const pointInPolygon = (point: GeometricPoint, polygon: Polygon): boolean => {
  const { x, y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (
      ((yi > y && yj <= y) || (yi <= y && yj > y)) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
};

export const pointOnPolygon = (
  point: GeometricPoint,
  polygon: Polygon,
  threshold = DEFAULT_THRESHOLD,
): boolean => {
  let on = false;
  const closed = close(polygon);

  for (let i = 0, l = closed.length - 1; i < l; i++) {
    if (pointOnLine(point, [closed[i], closed[i + 1]], threshold)) {
      on = true;
      break;
    }
  }

  return on;
};

// Determine if one polygon is entirely within another polygon
export const polygonInPolygon = (polygonA: Polygon, polygonB: Polygon): boolean => {
  let inside = true;
  const closed = close(polygonA);

  for (let i = 0, l = closed.length - 1; i < l; i++) {
    const v0 = closed[i];

    // Points test
    if (!pointInPolygon(v0, polygonB)) {
      inside = false;
      break;
    }

    // Lines test
    if (lineIntersectsPolygon([v0, closed[i + 1]], polygonB)) {
      inside = false;
      break;
    }
  }

  return inside;
};

// Determine if two polygons intersect
export const polygonIntersectPolygon = (
  polygonA: Polygon,
  polygonB: Polygon,
): boolean => {
  let intersects = false;
  let onCount = 0;
  const closed = close(polygonA);

  for (let i = 0, l = closed.length - 1; i < l; i++) {
    const v0 = closed[i];
    const v1 = closed[i + 1];

    if (lineIntersectsPolygon([v0, v1], polygonB)) {
      intersects = true;
      break;
    }

    if (pointOnPolygon(v0, polygonB)) {
      ++onCount;
    }

    if (onCount === 2) {
      intersects = true;
      break;
    }
  }

  return intersects;
};

const distanceToEllipse = (point: GeometricPoint, ellipse: Ellipse) => {
  const { angle, halfWidth: a, halfHeight: b, center } = ellipse;
  const rotatedPoint = pointRelativeToCenter(point, center, angle);

  const px = Math.abs(rotatedPoint.x);
  const py = Math.abs(rotatedPoint.y);

  let tx = 0.707;
  let ty = 0.707;

  for (let i = 0; i < 3; i++) {
    const x = a * tx;
    const y = b * ty;

    const ex = ((a * a - b * b) * tx ** 3) / a;
    const ey = ((b * b - a * a) * ty ** 3) / b;

    const rx = x - ex;
    const ry = y - ey;

    const qx = px - ex;
    const qy = py - ey;

    const r = Math.hypot(ry, rx);
    const q = Math.hypot(qy, qx);

    tx = Math.min(1, Math.max(0, ((qx * r) / q + ex) / a));
    ty = Math.min(1, Math.max(0, ((qy * r) / q + ey) / b));
    const t = Math.hypot(ty, tx);
    tx /= t;
    ty /= t;
  }

  const minPoint = {
    x: a * tx * Math.sign(rotatedPoint.x),
    y: b * ty * Math.sign(rotatedPoint.y),
  };

  return distanceToPoint(rotatedPoint, minPoint);
};


// Determine if a point lies on the boundary of an ellipse within a threshold
export const pointOnEllipse = (
  point: GeometricPoint,
  ellipse: Ellipse,
  threshold = DEFAULT_THRESHOLD,
): boolean => {
  return distanceToEllipse(point, ellipse) <= threshold;
};

// Determine if a point lies inside an ellipse
export const pointInEllipse = (point: GeometricPoint, ellipse: Ellipse): boolean => {
  const { center, angle, halfWidth, halfHeight } = ellipse;
  const { x: rotatedX, y: rotatedY } = pointRelativeToCenter(point, center, angle);

  return (
    (rotatedX / halfWidth) ** 2 +
      (rotatedY / halfHeight) ** 2 <=
    1
  );
};

/**
 * Segment Intersections
 */

// Calculate the intersection point of two line segments, if any
export const segmentsIntersectAt = (
  a: Readonly<LineSegment>,
  b: Readonly<LineSegment>,
): GeometricPoint | null => {
  const r = subtractVectors(a[1], a[0]);
  const s = subtractVectors(b[1], b[0]);
  const denominator = crossProduct(r, s);

  if (denominator === 0) {
    return null;
  }

  const i = subtractVectors(b[0], a[0]);
  const u = crossProduct(i, r) / denominator;
  const t = crossProduct(i, s) / denominator;

  if (u === 0) {
    return null;
  }

  const p = addVectors(a[0], scaleVector(r, t));

  if (t >= 0 && t < 1 && u >= 0 && u < 1) {
    return p;
  }

  return null;
};

/**
 * Determine intersection of a rectangular shaped element and a
 * line segment.
 *
 * @param element The rectangular element to test against
 * @param segment The segment intersecting the element
 * @param gap Optional value to inflate the shape before testing
 * @returns An array of intersections
 */
// TODO: Replace with final rounded rectangle code
export const segmentIntersectRectangleElement = (
  element: DucBindableElement,
  segment: LineSegment,
  gap: number = 0,
): GeometricPoint[] => {
  const bounds = [
    element.x.scoped - gap,
    element.y.scoped - gap,
    element.x.scoped + element.width.scoped + gap,
    element.y.scoped + element.height.scoped + gap,
  ] as [number, number, number, number];
  const center = {
    x: (bounds[0] + bounds[2]) / 2,
    y: (bounds[1] + bounds[3]) / 2,
  } as GeometricPoint;

  return [
    [
      rotatePoint({ x: bounds[0], y: bounds[1] }, center, element.angle),
      rotatePoint({ x: bounds[2], y: bounds[1] }, center, element.angle),
    ] as LineSegment,
    [
      rotatePoint({ x: bounds[2], y: bounds[1] }, center, element.angle),
      rotatePoint({ x: bounds[2], y: bounds[3] }, center, element.angle),
    ] as LineSegment,
    [
      rotatePoint({ x: bounds[2], y: bounds[3] }, center, element.angle),
      rotatePoint({ x: bounds[0], y: bounds[3] }, center, element.angle),
    ] as LineSegment,
    [
      rotatePoint({ x: bounds[0], y: bounds[3] }, center, element.angle),
      rotatePoint({ x: bounds[0], y: bounds[1] }, center, element.angle),
    ] as LineSegment,
  ]
    .map((s) => segmentsIntersectAt(segment, s))
    .filter((i): i is GeometricPoint => !!i);
};

// Utility to create a GeometricPoint
export function pointFrom<T extends GeometricPoint>(x: number, y: number): T {
  return { x, y } as T;
}