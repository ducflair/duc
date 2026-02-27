import { AXIS } from "../enums";
import { ScopedValue, ValueOf } from "./";

/**
 * Axis such as X, Y, Z
 */
export type Axis = ValueOf<typeof AXIS>;

/**
 * x and y position of top left corner, x and y position of bottom right corner
 */
export type Bounds = readonly [
  minX: ScopedValue,
  minY: ScopedValue,
  maxX: ScopedValue,
  maxY: ScopedValue,
];

/**
 * Scale factor is a multiplier to a given value
 * @default 1
 */
export type ScaleFactor = number & { __brand: "ScaleFactor" };

/**
 * Angle in Radian
 * Ranges from 0 to 2π: 0 - 360°
 */
export type Radian = number & { __brand: "Radian" };

/**
 * Percentage
 * Ranges from 0 to 1: 0% - 100%
 */
export type Percentage = number & { __brand: "Percentage" };

// a point is specified by its coordinate (x, y)
// These Points are always scoped ScopedValue
export type GeometricPoint = { x: number; y: number };
export type GeometricVector = GeometricPoint;

export type TuplePoint = [number, number];

export type ElementsSegmentsMap = Map<string, GeometricPoint[]>;


// a line (segment) is defined by two endpoints
export type Line = [GeometricPoint, GeometricPoint];
export type LineSegment = Line;

// a polyline (made up term here) is a line consisting of other line segments
// this corresponds to a straight line element in the editor but it could also
// be used to model other elements
export type Polyline = Line[];



// cubic bezier curve with four control points
export type Curve = [GeometricPoint, GeometricPoint, GeometricPoint, GeometricPoint];

// a polycurve is a curve consisting of other curves, this corresponds to a complex
// curve on the canvas
export type Polycurve = Curve[];

// a polygon is a closed shape by connecting the given points
// rectangles and diamonds are modeled by polygons
export type Polygon = GeometricPoint[];

// an ellipse is specified by its center, angle, and its major and minor axes
// but for the sake of simplicity, we've used halfWidth and halfHeight instead
// in place of semi-major and semi-minor axes
export type Ellipse = {
  center: GeometricPoint;
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

/**
 * Defines the possible headings using the new Point interface.
 */
export type Heading =
  | { x: 1; y: 0 }
  | { x: 0; y: 1 }
  | { x: -1; y: 0 }
  | { x: 0; y: -1 };