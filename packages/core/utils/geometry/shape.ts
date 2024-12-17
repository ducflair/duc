/**
 * this file defines pure geometric shapes
 *
 * for instance, a cubic bezier curve is specified by its four control points and
 * an ellipse is defined by its center, angle, semi major axis and semi minor axis
 * (but in semi-width and semi-height so it's more relevant to Duc)
 *
 * the idea with pure shapes is so that we can provide collision and other geometric methods not depending on
 * the specifics of roughjs or elements in Duc; instead, we can focus on the pure shapes themselves
 *
 * also included in this file are methods for converting a Duc element or a Drawable from roughjs
 * to pure shapes
 */

import { DucGroup } from "../../canvas/duc/duc-ts/duc";
import { getElementAbsoluteCoords } from "../../canvas/element";
import type {
  ElementsMap,
  DucDiamondElement,
  DucElement,
  DucEllipseElement,
  DucEmbeddableElement,
  DucFrameLikeElement,
  DucFreeDrawElement,
  DucIframeElement,
  DucImageElement,
  DucLinearElement,
  DucRectangleElement,
  DucSelectionElement,
  DucGroupElement,
  DucTextElement,
} from "../../canvas/element/types";
import { angleToDegrees, close, pointAdd, pointRotate } from "./geometry";
import { pointsOnBezierCurves } from "points-on-curve";
import type { Drawable, Op } from "roughjs/bin/core";

// a point is specified by its coordinate (x, y)
export type Point = { x: number; y: number };
export type Vector = Point;

// a line (segment) is defined by two endpoints
export type Line = [Point, Point];

// a polyline (made up term here) is a line consisting of other line segments
// this corresponds to a straight line element in the editor but it could also
// be used to model other elements
export type Polyline = Line[];

// cubic bezier curve with four control points
export type Curve = [Point, Point, Point, Point];

// a polycurve is a curve consisting of other curves, this corresponds to a complex
// curve on the canvas
export type Polycurve = Curve[];

// a polygon is a closed shape by connecting the given points
// rectangles and diamonds are modeled by polygons
export type Polygon = Point[];

// an ellipse is specified by its center, angle, and its major and minor axes
// but for the sake of simplicity, we've used halfWidth and halfHeight instead
// in place of semi-major and semi-minor axes
export type Ellipse = {
  center: Point;
  angle: number;
  halfWidth: number;
  halfHeight: number;
};

export type GeometricShape =
  | {
      type: "line";
      data: Line;
    }
  | {
      type: "polygon";
      data: Polygon;
    }
  | {
      type: "curve";
      data: Curve;
    }
  | {
      type: "ellipse";
      data: Ellipse;
    }
  | {
      type: "polyline";
      data: Polyline;
    }
  | {
      type: "polycurve";
      data: Polycurve;
  };


type RectangularElement =
  | DucRectangleElement
  | DucDiamondElement
  | DucFrameLikeElement
  | DucEmbeddableElement
  | DucImageElement
  | DucIframeElement
  | DucTextElement
  | DucSelectionElement
  | DucGroupElement;

// polygon
export const getPolygonShape = (
  element: RectangularElement,
): GeometricShape => {
  const { angle, width, height, x, y } = element;
  const angleInDegrees = angleToDegrees(angle);
  const cx = x + width / 2;
  const cy = y + height / 2;

  const center: Point = { x: cx, y: cy };

  let data: Polygon = [];

  if (element.type === "diamond") {
    data = [
      pointRotate({ x: cx, y }, angleInDegrees, center),
      pointRotate({ x: x + width, y: cy }, angleInDegrees, center),
      pointRotate({ x: cx, y: y + height }, angleInDegrees, center),
      pointRotate({ x, y: cy }, angleInDegrees, center),
    ];
  } else {
    data = [
      pointRotate({ x: x, y: y }, angleInDegrees, center),
      pointRotate({ x: x + width, y }, angleInDegrees, center),
      pointRotate({ x: x + width, y: y + height }, angleInDegrees, center),
      pointRotate({ x, y: y + height }, angleInDegrees, center),
    ];
  }

  return {
    type: "polygon",
    data,
  };
};

// return the selection box for an element, possibly rotated as well
export const getSelectionBoxShape = (
  element: DucElement,
  elementsMap: ElementsMap,
  padding = 10,
) => {

  let [x1, y1, x2, y2, cx, cy] = getElementAbsoluteCoords(
    element,
    elementsMap,
    true,
  );

  x1 -= padding;
  x2 += padding;
  y1 -= padding;
  y2 += padding;

  const angleInDegrees = angleToDegrees(element.angle);
  const center: Point = { x: cx, y: cy };
  const topLeft = pointRotate({ x: x1, y: y1 }, angleInDegrees, center);
  const topRight = pointRotate({ x: x2, y: y1 }, angleInDegrees, center);
  const bottomLeft = pointRotate({ x: x1, y: y2 }, angleInDegrees, center);
  const bottomRight = pointRotate({ x: x2, y: y2 }, angleInDegrees, center);

  return {
    type: "polygon",
    data: [topLeft, topRight, bottomRight, bottomLeft],
  } as GeometricShape;
};

// ellipse
export const getEllipseShape = (
  element: DucEllipseElement,
): GeometricShape => {
  const { width, height, angle, x, y } = element;

  return {
    type: "ellipse",
    data: {
      center: { x: x + width / 2, y: y + height / 2 },
      angle,
      halfWidth: width / 2,
      halfHeight: height / 2,
    },
  };
};

export const getCurvePathOps = (shape: Drawable): Op[] => {
  for (const set of shape.sets) {
    if (set.type === "path") {
      return set.ops;
    }
  }
  return shape.sets[0].ops;
};
export const getCurveShape = (
  roughShape: Drawable,
  startingPoint: Point = { x: 0, y: 0 },
  angleInRadian: number,
  center: Point,
): GeometricShape => {
  const transform = (p: Point) =>
    pointRotate(
      { x: p.x + startingPoint.x, y: p.y + startingPoint.y },
      angleToDegrees(angleInRadian),
      center,
    );

  const ops = getCurvePathOps(roughShape);
  const polycurve: Polycurve = [];
  let p0: Point = { x: 0, y: 0 };

  for (const op of ops) {
    if (op.op === "move") {
      const [x, y] = op.data as number[];
      p0 = transform({ x, y });
    }
    if (op.op === "bcurveTo") {
      const [x1, y1, x2, y2, x3, y3] = op.data as number[];
      const p1: Point = transform({ x: x1, y: y1 });
      const p2: Point = transform({ x: x2, y: y2 });
      const p3: Point = transform({ x: x3, y: y3 });
      polycurve.push([p0, p1, p2, p3]);
      p0 = p3;
    }
  }

  return {
    type: "polycurve",
    data: polycurve,
  };
};

const polylineFromPoints = (points: Point[]) => {
  let previousPoint = points[0];
  const polyline: Polyline = [];

  for (let i = 1; i < points.length; i++) {
    const nextPoint = points[i];
    polyline.push([previousPoint, nextPoint]);
    previousPoint = nextPoint;
  }

  return polyline;
};

export const getFreedrawShape = (
  element: DucFreeDrawElement,
  center: Point,
  isClosed: boolean = false,
): GeometricShape => {
  const angle = angleToDegrees(element.angle);
  const transform = (p: Point) =>
    pointRotate(pointAdd(p, { x: element.x, y: element.y } as Point), angle, center);

  const polyline = polylineFromPoints(
    element.points.map((p) => transform(p as Point)),
  );

  return isClosed
    ? {
        type: "polygon",
        data: close(polyline.flat()) as Polygon,
      }
    : {
        type: "polyline",
        data: polyline,
      };
};

export const getClosedCurveShape = (
  element: DucLinearElement,
  roughShape: Drawable,
  startingPoint: Point = { x: 0, y: 0 },
  angleInRadian: number,
  center: Point,
): GeometricShape => {
  const transform = (p: Point) =>
    pointRotate(
      { x: p.x + startingPoint.x, y: p.y + startingPoint.y },
      angleToDegrees(angleInRadian),
      center,
    );

  if (element.roundness === null) {
    return {
      type: "polygon",
      data: close(element.points.map((p) => transform(p as Point))),
    };
  }

  const ops = getCurvePathOps(roughShape);

  const points: Point[] = [];
  let odd = false;
  for (const operation of ops) {
    if (operation.op === "move") {
      odd = !odd;
      if (odd) {
        points.push({ x: operation.data[0], y: operation.data[1] });
      }
    } else if (operation.op === "bcurveTo") {
      if (odd) {
        points.push({ x: operation.data[0], y: operation.data[1] });
        points.push({ x: operation.data[2], y: operation.data[3] });
        points.push({ x: operation.data[4], y: operation.data[5] });
      }
    } else if (operation.op === "lineTo") {
      if (odd) {
        points.push({ x: operation.data[0], y: operation.data[1] });
      }
    }
  }

  const polygonPoints = pointsOnBezierCurves(points.map((p) => [p.x, p.y]), 10, 5).map((p) => {
    return transform({ x: p[0], y: p[1] });
  });

  return {
    type: "polygon",
    data: polygonPoints,
  };
};
