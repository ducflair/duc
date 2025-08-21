import { Bounds, LineSegment } from "ducjs/legacy/v1/types/geometryTypes";
import { ScopedValue } from "ducjs/legacy/v1/types";
import { GeometricPoint } from "ducjs/legacy/v1/types/geometryTypes";


export function getBBox(line: LineSegment): Bounds {
  return [
    Math.min(line[0].x, line[1].x) as ScopedValue,
    Math.min(line[0].y, line[1].y) as ScopedValue,
    Math.max(line[0].x, line[1].x) as ScopedValue,
    Math.max(line[0].y, line[1].y) as ScopedValue,
  ];
}

export function crossProduct(a: GeometricPoint, b: GeometricPoint) {
  return a.x * b.y - b.x * a.y;
}

export function doBBoxesIntersect(a: Bounds, b: Bounds) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

export function translate(a: GeometricPoint, b: GeometricPoint): GeometricPoint {
  return {x: a.x - b.x, y: a.y - b.y};
}

const EPSILON = 0.000001;

export function isPointOnLine(l: LineSegment, p: GeometricPoint) {
  const p1 = translate(l[1], l[0]);
  const p2 = translate(p, l[0]);

  const r = crossProduct(p1, p2);

  return Math.abs(r) < EPSILON;
}

export function isPointRightOfLine(l: LineSegment, p: GeometricPoint) {
  const p1 = translate(l[1], l[0]);
  const p2 = translate(p, l[0]);

  return crossProduct(p1, p2) < 0;
}

export function isLineSegmentTouchingOrCrossingLine(
  a: LineSegment,
  b: LineSegment,
) {
  return (
    isPointOnLine(a, b[0]) ||
    isPointOnLine(a, b[1]) ||
    (isPointRightOfLine(a, b[0])
      ? !isPointRightOfLine(a, b[1])
      : isPointRightOfLine(a, b[1]))
  );
}

// https://martin-thoma.com/how-to-check-if-two-line-segments-intersect/
export function doLineSegmentsIntersect(a: LineSegment, b: LineSegment) {
  return (
    doBBoxesIntersect(getBBox(a), getBBox(b)) &&
    isLineSegmentTouchingOrCrossingLine(a, b) &&
    isLineSegmentTouchingOrCrossingLine(b, a)
  );
}
