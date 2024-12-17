import {
  DucElement,
  DucLinearElement,
  Arrowhead,
  DucFreeDrawElement,
  NonDeleted,
  DucTextElementWithContainer,
  ElementsMap,
} from "./types";
import { distance2d, rotate, rotatePoint } from "../math";
import rough from "roughjs/bin/rough";
import { Drawable, Op } from "roughjs/bin/core";
import { AppState, Point } from "../types";
import { generateRoughOptions } from "../scene/Shape";
import {
  isArrowElement,
  isBoundToContainer,
  isFreeDrawElement,
  isLinearElement,
  isTextElement,
} from "./typeChecks";
import { rescalePoints } from "../points";
import { getBoundTextElement, getContainerElement } from "./textElement";
import { LinearElementEditor } from "./linearElementEditor";
import { Mutable } from "../utility-types";
import { ShapeCache } from "../scene/ShapeCache";
import { arrayToMap, OldPoint, TuplePoint } from "../utils";

export type RectangleBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

type MaybeQuadraticSolution = [number | null, number | null] | false;

/**
 * x and y position of top left corner, x and y position of bottom right corner
 */
export type Bounds = readonly [
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
];

export type SceneBounds = readonly [
  sceneX: number,
  sceneY: number,
  sceneX2: number,
  sceneY2: number,
];

export class ElementBounds {
  private static boundsCache = new WeakMap<
    DucElement,
    {
      bounds: Bounds;
      version: DucElement["version"];
    }
  >();

  static getBounds(element: DucElement, elementsMap: ElementsMap) {
    const cachedBounds = ElementBounds.boundsCache.get(element);

    if (
      cachedBounds?.version &&
      cachedBounds.version === element.version &&
      // we don't invalidate cache when we update containers and not labels,
      // which is causing problems down the line. Fix TBA.
      !isBoundToContainer(element)
    ) {
      return cachedBounds.bounds;
    }
    const bounds = ElementBounds.calculateBounds(element, elementsMap);

    ElementBounds.boundsCache.set(element, {
      version: element.version,
      bounds,
    });

    return bounds;
  }

  private static calculateBounds(
    element: DucElement,
    elementsMap: ElementsMap,
  ): Bounds {
    let bounds: Bounds;

    const [x1, y1, x2, y2, cx, cy] = getElementAbsoluteCoords(
      element,
      elementsMap,
    );
    if (isFreeDrawElement(element)) {
      const [minX, minY, maxX, maxY] = getBoundsFromPoints(
        element.points.map(({x, y}) =>
          rotate(x, y, cx - element.x, cy - element.y, element.angle),
        ),
      );

      return [
        minX + element.x,
        minY + element.y,
        maxX + element.x,
        maxY + element.y,
      ];
    } else if (isLinearElement(element)) {
      bounds = getLinearElementRotatedBounds(element, cx, cy, elementsMap);
    } else if (element.type === "diamond") {
      const {x: x11, y: y11} = rotate(cx, y1, cx, cy, element.angle);
      const {x: x12, y: y12} = rotate(cx, y2, cx, cy, element.angle);
      const {x: x22, y: y22} = rotate(x1, cy, cx, cy, element.angle);
      const {x: x21, y: y21} = rotate(x2, cy, cx, cy, element.angle);
      const minX = Math.min(x11, x12, x22, x21);
      const minY = Math.min(y11, y12, y22, y21);
      const maxX = Math.max(x11, x12, x22, x21);
      const maxY = Math.max(y11, y12, y22, y21);
      bounds = [minX, minY, maxX, maxY];
    } else if (element.type === "ellipse") {
      const w = (x2 - x1) / 2;
      const h = (y2 - y1) / 2;
      const cos = Math.cos(element.angle);
      const sin = Math.sin(element.angle);
      const ww = Math.hypot(w * cos, h * sin);
      const hh = Math.hypot(h * cos, w * sin);
      bounds = [cx - ww, cy - hh, cx + ww, cy + hh];
    } else {
      const {x: x11, y: y11} = rotate(x1, y1, cx, cy, element.angle);
      const {x: x12, y: y12} = rotate(x1, y2, cx, cy, element.angle);
      const {x: x22, y: y22} = rotate(x2, y2, cx, cy, element.angle);
      const {x: x21, y: y21} = rotate(x2, y1, cx, cy, element.angle);
      const minX = Math.min(x11, x12, x22, x21);
      const minY = Math.min(y11, y12, y22, y21);
      const maxX = Math.max(x11, x12, x22, x21);
      const maxY = Math.max(y11, y12, y22, y21);
      bounds = [minX, minY, maxX, maxY];
    }

    return bounds;
  }
}

// Scene -> Scene coords, but in x1,x2,y1,y2 format.
//
// If the element is created from right to left, the width is going to be negative
// This set of functions retrieves the absolute position of the 4 points.
export const getElementAbsoluteCoords = (
  element: DucElement,
  elementsMap: ElementsMap,
  includeBoundText: boolean = false,
): [number, number, number, number, number, number] => {
  if (isFreeDrawElement(element)) {
    return getFreeDrawElementAbsoluteCoords(element);
  } else if (isLinearElement(element)) {
    return LinearElementEditor.getElementAbsoluteCoords(
      element,
      elementsMap,
      includeBoundText,
    );
  } else if (isTextElement(element)) {
    const container = elementsMap
      ? getContainerElement(element, elementsMap)
      : null;
    if (isArrowElement(container)) {
      const coords = LinearElementEditor.getBoundTextElementPosition(
        container,
        element as DucTextElementWithContainer,
        elementsMap,
      );
      return [
        coords.x,
        coords.y,
        coords.x + element.width,
        coords.y + element.height,
        coords.x + element.width / 2,
        coords.y + element.height / 2,
      ];
    }
  }
  return [
    element.x,
    element.y,
    element.x + element.width,
    element.y + element.height,
    element.x + element.width / 2,
    element.y + element.height / 2,
  ];
};

/*
 * for a given element, `getElementLineSegments` returns line segments
 * that can be used for visual collision detection (useful for frames)
 * as opposed to bounding box collision detection
 */
export const getElementLineSegments = (
  element: DucElement,
  elementsMap: ElementsMap,
): [Point, Point][] => {
  const [x1, y1, x2, y2, cx, cy] = getElementAbsoluteCoords(
    element,
    elementsMap,
  );

  const center: Point = {x: cx, y: cy};

  if (isLinearElement(element)) {
    const segments: [Point, Point][] = [];
    const points = element.points;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      if (current.handleOut || next.handleIn) {
        // For curved segments, sample points along the curve
        const samples = sampleBezierCurve(
          current,
          current.handleOut || current,
          next.handleIn || next,
          next,
          10 // number of samples
        );
        
        for (let j = 0; j < samples.length - 1; j++) {
          segments.push([
            rotatePoint(
              {
                x: samples[j].x + element.x,
                y: samples[j].y + element.y,
              },
              center,
              element.angle
            ),
            rotatePoint(
              {
                x: samples[j + 1].x + element.x,
                y: samples[j + 1].y + element.y,
              },
              center,
              element.angle
            ),
          ]);
        }
      } else {
        // For straight segments, use the original logic
        segments.push([
          rotatePoint(
            {
              x: current.x + element.x,
              y: current.y + element.y,
            },
            center,
            element.angle
          ),
          rotatePoint(
            {
              x: next.x + element.x,
              y: next.y + element.y,
            },
            center,
            element.angle
          ),
        ]);
      }
    }
    return segments;
  }

  const [nw, ne, sw, se, n, s, w, e] = (
    [
      {x: x1, y: y1},
      {x: x2, y: y1},
      {x: x1, y: y2},
      {x: x2, y: y2},
      {x: cx, y: y1},
      {x: cx, y: y2},
      {x: x1, y: cy},
      {x: x2, y: cy},
    ] as Point[]
  ).map((point) => rotatePoint(point, center, element.angle));

  if (element.type === "diamond") {
    return [
      [n, w],
      [n, e],
      [s, w],
      [s, e],
    ];
  }

  if (element.type === "ellipse") {
    return [
      [n, w],
      [n, e],
      [s, w],
      [s, e],
      [n, w],
      [n, e],
      [s, w],
      [s, e],
    ];
  }

  return [
    [nw, ne],
    [sw, se],
    [nw, sw],
    [ne, se],
    [nw, e],
    [sw, e],
    [ne, w],
    [se, w],
  ];
};

/**
 * Scene -> Scene coords, but in x1,x2,y1,y2 format.
 *
 * Rectangle here means any rectangular frame, not an excalidraw element.
 */
export const getRectangleBoxAbsoluteCoords = (boxSceneCoords: RectangleBox) => {
  return [
    boxSceneCoords.x,
    boxSceneCoords.y,
    boxSceneCoords.x + boxSceneCoords.width,
    boxSceneCoords.y + boxSceneCoords.height,
    boxSceneCoords.x + boxSceneCoords.width / 2,
    boxSceneCoords.y + boxSceneCoords.height / 2,
  ];
};

export const pointRelativeTo = (
  element: DucElement,
  absoluteCoords: Point,
): Point => {
  return {x: absoluteCoords.x - element.x, y: absoluteCoords.y - element.y};
};

export const getDiamondPoints = (element: DucElement) => {
  // Here we add +1 to avoid these numbers to be 0
  // otherwise rough.js will throw an error complaining about it
  const topX = Math.floor(element.width / 2) + 1;
  const topY = 0;
  const rightX = element.width;
  const rightY = Math.floor(element.height / 2) + 1;
  const bottomX = topX;
  const bottomY = element.height;
  const leftX = 0;
  const leftY = rightY;

  return [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY];
};

export const getCurvePathOps = (shape: Drawable): Op[] => {
  for (const set of shape.sets) {
    if (set.type === "path") {
      return set.ops;
    }
  }
  return shape.sets[0].ops;
};

// reference: https://eliot-jones.com/2019/12/cubic-bezier-curve-bounding-boxes
const getBezierValueForT = (
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
) => {
  const oneMinusT = 1 - t;
  return (
    Math.pow(oneMinusT, 3) * p0 +
    3 * Math.pow(oneMinusT, 2) * t * p1 +
    3 * oneMinusT * Math.pow(t, 2) * p2 +
    Math.pow(t, 3) * p3
  );
};

const solveQuadratic = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): MaybeQuadraticSolution => {
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
};

const getCubicBezierCurveBound = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Bounds => {
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
};

export const getMinMaxXYFromCurvePathOps = (
  ops: Op[],
  transformXY?: (x: number, y: number) => Point,
): Bounds => {
  let currentP: Point = { x: 0, y: 0 };

  const { minX, minY, maxX, maxY } = ops.reduce(
    (limits, { op, data }) => {
      if (op === "move" && data) {
        // Ensure data has the correct structure
        currentP = { x: data[0], y: data[1] };
      } else if (op === "bcurveTo" && data.length === 6) {
        const _p1 = { x: data[0], y: data[1] };
        const _p2 = { x: data[2], y: data[3] };
        const _p3 = { x: data[4], y: data[5] };

        const p1 = transformXY ? transformXY(_p1.x, _p1.y) : _p1;
        const p2 = transformXY ? transformXY(_p2.x, _p2.y) : _p2;
        const p3 = transformXY ? transformXY(_p3.x, _p3.y) : _p3;
        const p0 = transformXY ? transformXY(currentP.x, currentP.y) : currentP;

        currentP = _p3;

        const [cMinX, cMinY, cMaxX, cMaxY] = getCubicBezierCurveBound(
          p0,
          p1,
          p2,
          p3,
        );

        limits.minX = Math.min(limits.minX, cMinX);
        limits.minY = Math.min(limits.minY, cMinY);
        limits.maxX = Math.max(limits.maxX, cMaxX);
        limits.maxY = Math.max(limits.maxY, cMaxY);
      } else if (op === "lineTo" && data.length === 2) {
        const lineEnd = transformXY
          ? transformXY(data[0], data[1])
          : { x: data[0], y: data[1] };
        
        limits.minX = Math.min(limits.minX, currentP.x, lineEnd.x);
        limits.minY = Math.min(limits.minY, currentP.y, lineEnd.y);
        limits.maxX = Math.max(limits.maxX, currentP.x, lineEnd.x);
        limits.maxY = Math.max(limits.maxY, currentP.y, lineEnd.y);
        
        currentP = lineEnd;
      } 
      // else if (op === "qcurveTo" && data.length === 4) {
      //   // For quadratic Bezier curves, implement appropriate bounding box logic
      //   const controlP = transformXY
      //     ? transformXY(data[0], data[1])
      //     : { x: data[0], y: data[1] };
      //   const endP = transformXY
      //     ? transformXY(data[2], data[3])
      //     : { x: data[2], y: data[3] };

      //   // Implement bounds logic specific to quadratic curve if needed here
      //   limits.minX = Math.min(limits.minX, currentP.x, controlP.x, endP.x);
      //   limits.minY = Math.min(limits.minY, currentP.y, controlP.y, endP.y);
      //   limits.maxX = Math.max(limits.maxX, currentP.x, controlP.x, endP.x);
      //   limits.maxY = Math.max(limits.maxY, currentP.y, controlP.y, endP.y);

      //   currentP = endP;
      // }
      return limits;
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  return [minX, minY, maxX, maxY];
};


export const getBoundsFromPoints = (
  points: DucFreeDrawElement["points"],
): Bounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const {x, y} of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return [minX, minY, maxX, maxY];
};

const getFreeDrawElementAbsoluteCoords = (
  element: DucFreeDrawElement,
): [number, number, number, number, number, number] => {
  const [minX, minY, maxX, maxY] = getBoundsFromPoints(element.points);
  const x1 = minX + element.x;
  const y1 = minY + element.y;
  const x2 = maxX + element.x;
  const y2 = maxY + element.y;
  return [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2];
};

/** @returns number in pixels */
export const getArrowheadSize = (arrowhead: Arrowhead): number => {
  switch (arrowhead) {
    case "arrow":
      return 25;
    case "diamond":
      return 12;
    default:
      return 15;
  }
};

/** @returns number in degrees */
export const getArrowheadAngle = (arrowhead: Arrowhead): number => {
  switch (arrowhead) {
    case "bar":
      return 90;
    case "arrow":
      return 20;
    default:
      return 25;
  }
};

export const getArrowheadPoints = (
  element: DucLinearElement,
  shape: Drawable[],
  position: "start" | "end",
  arrowhead: Arrowhead,
): number[] | null => {
  const ops = getCurvePathOps(shape[0]);
  
  // If no operations found, cannot determine arrowhead points
  if (ops.length < 1) {
    console.warn("No operations found in shape for arrowhead calculation.");
    return null;
  }

  // Ensure there are enough points for 'start' and 'end' arrowheads
  if (position === "start" && element.points.length < 2) {
    console.warn("Not enough points for start arrowhead.");
    return null;
  }
  if (position === "end" && element.points.length < 2) {
    console.warn("Not enough points for end arrowhead.");
    return null;
  }

  // Get the target point where the arrowhead will be attached
  const targetPoint = position === "start"
    ? element.points[0]
    : element.points[element.points.length - 1];

  // Get the previous point to determine direction
  const prevPoint = position === "start"
    ? (element.points.length > 1 ? element.points[1] : { x: targetPoint.x - 1, y: targetPoint.y })
    : (element.points.length > 1 ? element.points[element.points.length - 2] : { x: targetPoint.x + 1, y: targetPoint.y });

  // Calculate the direction vector from prevPoint to targetPoint
  const dx = targetPoint.x - prevPoint.x;
  const dy = targetPoint.y - prevPoint.y;
  const distance = Math.hypot(dx, dy);

  // Normalize the direction vector, defaulting to (1, 0) if distance is too small
  const nx = distance < 0.001 ? 1 : dx / distance;
  const ny = distance < 0.001 ? 0 : dy / distance;

  // Determine the size of the arrowhead based on the element and arrowhead type
  const size = getArrowheadSize(arrowhead);
  const minSize = Math.min(size, distance * (arrowhead.includes("diamond") ? 0.25 : 0.5));

  // Calculate the base point of the arrowhead (where it starts from the line)
  const baseX = targetPoint.x - nx * minSize;
  const baseY = targetPoint.y - ny * minSize;

  // Handle different arrowhead types
  if (
    arrowhead === "circle"
  ) {
    const diameter = Math.hypot(baseX - targetPoint.x, baseY - targetPoint.y) + element.strokeWidth - 2;
    return [targetPoint.x, targetPoint.y, diameter];
  }

  // Calculate the angle for the wings of the arrowhead
  const angle = getArrowheadAngle(arrowhead);

  // Rotate the base point to get the wing points
  const { x: wingX1, y: wingY1 } = rotate(baseX, baseY, targetPoint.x, targetPoint.y, (-angle * Math.PI) / 180);
  const { x: wingX2, y: wingY2 } = rotate(baseX, baseY, targetPoint.x, targetPoint.y, (angle * Math.PI) / 180);

  if (arrowhead === "diamond") {
    let oppositeX: number, oppositeY: number;

    if (position === "start") {
      // For start arrowheads, use the second point to determine the opposite point
      const referencePoint = element.points.length > 1 ? element.points[1] : { x: targetPoint.x - 1, y: targetPoint.y };
      const angleToRef = Math.atan2(referencePoint.y - targetPoint.y, referencePoint.x - targetPoint.x);
      
      // Rotate to find the opposite point
      const rotated = rotate(
        targetPoint.x + minSize * 2 * nx, // Extend in the direction of the arrow
        targetPoint.y + minSize * 2 * ny,
        targetPoint.x,
        targetPoint.y,
        angleToRef,
      );
      oppositeX = rotated.x;
      oppositeY = rotated.y;
    } else {
      // For end arrowheads, use the second last point to determine the opposite point
      const referencePoint = element.points.length > 1 ? element.points[element.points.length - 2] : { x: targetPoint.x + 1, y: targetPoint.y };
      const angleToRef = Math.atan2(referencePoint.y - targetPoint.y, referencePoint.x - targetPoint.x);
      
      // Rotate to find the opposite point
      const rotated = rotate(
        targetPoint.x - minSize * 2 * nx, // Extend in the opposite direction of the arrow
        targetPoint.y - minSize * 2 * ny,
        targetPoint.x,
        targetPoint.y,
        angleToRef,
      );
      oppositeX = rotated.x;
      oppositeY = rotated.y;
    }

    return [targetPoint.x, targetPoint.y, wingX1, wingY1, oppositeX, oppositeY, wingX2, wingY2];
  }

  // For other arrowhead types (e.g., "triangle"), return the wing points
  return [targetPoint.x, targetPoint.y, wingX1, wingY1, wingX2, wingY2];
};


const generateLinearElementShape = (
  element: DucLinearElement,
): Drawable => {
  const generator = rough.generator();
  const options = generateRoughOptions(element);

  const method = (() => {
    if (element.roundness) {
      return "curve";
    }
    if (options.fill) {
      return "polygon";
    }
    return "linearPath";
  })();

  return generator[method](element.points.map(({x, y}) => [x, y]) as Mutable<OldPoint>[], options);
};

export function getQuadraticBezierBoundingBox(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): { minX: number; minY: number; maxX: number; maxY: number } {
  const tValues = [];
  for (const coord of ['x', 'y'] as const) {
    const a = p0[coord] - 2 * p1[coord] + p2[coord];
    const b = 2 * (p1[coord] - p0[coord]);
    if (a === 0) continue;
    const t = -b / (2 * a);
    if (t > 0 && t < 1) tValues.push(t);
  }

  const xValues = [p0.x, p2.x];
  const yValues = [p0.y, p2.y];

  for (const t of tValues) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    xValues.push(x);
    yValues.push(y);
  }

  return {
    minX: Math.min(...xValues),
    minY: Math.min(...yValues),
    maxX: Math.max(...xValues),
    maxY: Math.max(...yValues),
  };
}

function getCubicBezierBoundingBox(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): { minX: number; minY: number; maxX: number; maxY: number } {
  const tValues = [];
  for (const coord of ['x', 'y'] as const) {
    const b = 6 * p0[coord] - 12 * p1[coord] + 6 * p2[coord];
    const a = -3 * p0[coord] + 9 * p1[coord] - 9 * p2[coord] + 3 * p3[coord];
    const c = 3 * p1[coord] - 3 * p0[coord];
    if (a === 0) {
      if (b === 0) continue;
      const t = -c / b;
      if (t > 0 && t < 1) tValues.push(t);
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

  const xValues = [p0.x, p3.x];
  const yValues = [p0.y, p3.y];

  for (const t of tValues) {
    const x =
      Math.pow(1 - t, 3) * p0.x +
      3 * Math.pow(1 - t, 2) * t * p1.x +
      3 * (1 - t) * t * t * p2.x +
      t * t * t * p3.x;
    const y =
      Math.pow(1 - t, 3) * p0.y +
      3 * Math.pow(1 - t, 2) * t * p1.y +
      3 * (1 - t) * t * t * p2.y +
      t * t * t * p3.y;
    xValues.push(x);
    yValues.push(y);
  }

  return {
    minX: Math.min(...xValues),
    minY: Math.min(...yValues),
    maxX: Math.max(...xValues),
    maxY: Math.max(...yValues),
  };
}


const getLinearElementRotatedBounds = (
  element: DucLinearElement,
  cx: number,
  cy: number,
  elementsMap: ElementsMap,
): Bounds => {
  const boundTextElement = getBoundTextElement(element, elementsMap);

  if (element.points.length < 2) {
    const {x: pointX, y: pointY} = element.points[0];
    const {x, y} = rotate(
      element.x + pointX,
      element.y + pointY,
      cx,
      cy,
      element.angle,
    );

    let coords: Bounds = [x, y, x, y];
    if (boundTextElement) {
      const coordsWithBoundText = LinearElementEditor.getMinMaxXYWithBoundText(
        element,
        elementsMap,
        [x, y, x, y],
        boundTextElement,
      );
      coords = [
        coordsWithBoundText[0],
        coordsWithBoundText[1],
        coordsWithBoundText[2],
        coordsWithBoundText[3],
      ];
    }
    return coords;
  }

  const points = element.points.map((pt) => ({
    x: element.x + pt.x,
    y: element.y + pt.y,
    handleIn: pt.handleIn
      ? { x: element.x + pt.handleIn.x, y: element.y + pt.handleIn.y }
      : undefined,
    handleOut: pt.handleOut
      ? { x: element.x + pt.handleOut.x, y: element.y + pt.handleOut.y }
      : undefined,
  }));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    if (current.handleOut && next.handleIn) {
      // Cubic Bezier curve segment
      const bbox = getCubicBezierBoundingBox(
        current,
        current.handleOut,
        next.handleIn,
        next,
      );

      // Rotate bbox corners
      const corners = [
        rotate(bbox.minX, bbox.minY, cx, cy, element.angle),
        rotate(bbox.maxX, bbox.minY, cx, cy, element.angle),
        rotate(bbox.minX, bbox.maxY, cx, cy, element.angle),
        rotate(bbox.maxX, bbox.maxY, cx, cy, element.angle),
      ];

      for (const corner of corners) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
      }
    } else if (current.handleOut || next.handleIn) {
      // Quadratic Bezier curve segment
      const controlPoint = current.handleOut || next.handleIn;
      const bbox = getQuadraticBezierBoundingBox(current, controlPoint!, next);

      // Rotate bbox corners
      const corners = [
        rotate(bbox.minX, bbox.minY, cx, cy, element.angle),
        rotate(bbox.maxX, bbox.minY, cx, cy, element.angle),
        rotate(bbox.minX, bbox.maxY, cx, cy, element.angle),
        rotate(bbox.maxX, bbox.maxY, cx, cy, element.angle),
      ];

      for (const corner of corners) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
      }
    } else {
      // Line segment
      const p0 = rotate(current.x, current.y, cx, cy, element.angle);
      const p1 = rotate(next.x, next.y, cx, cy, element.angle);

      minX = Math.min(minX, p0.x, p1.x);
      minY = Math.min(minY, p0.y, p1.y);
      maxX = Math.max(maxX, p0.x, p1.x);
      maxY = Math.max(maxY, p0.y, p1.y);
    }
  }

  let coords: Bounds = [minX, minY, maxX, maxY];

  if (boundTextElement) {
    const coordsWithBoundText = LinearElementEditor.getMinMaxXYWithBoundText(
      element,
      elementsMap,
      coords,
      boundTextElement,
    );
    coords = [
      coordsWithBoundText[0],
      coordsWithBoundText[1],
      coordsWithBoundText[2],
      coordsWithBoundText[3],
    ];
  }

  return coords;
};


export const getElementBounds = (
  element: DucElement,
  elementsMap: ElementsMap,
): Bounds => {
  return ElementBounds.getBounds(element, elementsMap);
};

export const getCommonBounds = (
  elements: readonly DucElement[],
  elementsMap?: ElementsMap,
): Bounds => {
  if (!elements.length) {
    return [0, 0, 0, 0];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const _elementsMap = elementsMap || arrayToMap(elements);

  elements.forEach((element) => {
    const [x1, y1, x2, y2] = getElementBounds(element, _elementsMap);
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return [minX, minY, maxX, maxY];
};

export const getDraggedElementsBounds = (
  elements: DucElement[],
  dragOffset: { x: number; y: number },
) => {
  const [minX, minY, maxX, maxY] = getCommonBounds(elements);
  return [
    minX + dragOffset.x,
    minY + dragOffset.y,
    maxX + dragOffset.x,
    maxY + dragOffset.y,
  ];
};

export const getResizedElementAbsoluteCoords = (
  element: DucElement,
  nextWidth: number,
  nextHeight: number,
  normalizePoints: boolean,
): Bounds => {
  if (!(isLinearElement(element) || isFreeDrawElement(element))) {
    return [
      element.x,
      element.y,
      element.x + nextWidth,
      element.y + nextHeight,
    ];
  }

  const points = rescalePoints(
    'x',
    nextWidth,
    rescalePoints('y', nextHeight, element.points, normalizePoints),
    normalizePoints,
  );

  let bounds: Bounds;

  if (isFreeDrawElement(element)) {
    // Free Draw
    bounds = getBoundsFromPoints(points);
  } else {
    // Line
    const gen = rough.generator();
    const curve = !element.roundness
      ? gen.linearPath(
          points.map(({x,y}) => [x, y]) as TuplePoint[],
          generateRoughOptions(element),
        )
      : gen.curve(points.map(({x,y}) => [x, y]) as TuplePoint[], generateRoughOptions(element));

    const ops = getCurvePathOps(curve);
    bounds = getMinMaxXYFromCurvePathOps(ops);
  }

  const [minX, minY, maxX, maxY] = bounds;
  return [
    minX + element.x,
    minY + element.y,
    maxX + element.x,
    maxY + element.y,
  ];
};

export const getElementPointsCoords = (
  element: DucLinearElement,
  points: readonly Point[],
): Bounds => {
  // This might be computationally heavey
  const gen = rough.generator();
  const curve =
    element.roundness == null
      ? gen.linearPath(
          points.map((p) => [p.x, p.y]) as TuplePoint[],
          generateRoughOptions(element),
        )
      : gen.curve(points.map((p) => [p.x, p.y]) as TuplePoint[], generateRoughOptions(element));
  const ops = getCurvePathOps(curve);
  const [minX, minY, maxX, maxY] = getMinMaxXYFromCurvePathOps(ops);
  return [
    minX + element.x,
    minY + element.y,
    maxX + element.x,
    maxY + element.y,
  ];
};

export const getClosestElementBounds = (
  elements: readonly DucElement[],
  from: { x: number; y: number },
): Bounds => {
  if (!elements.length) {
    return [0, 0, 0, 0];
  }

  let minDistance = Infinity;
  let closestElement = elements[0];
  const elementsMap = arrayToMap(elements);
  elements.forEach((element) => {
    const [x1, y1, x2, y2] = getElementBounds(element, elementsMap);
    const distance = distance2d((x1 + x2) / 2, (y1 + y2) / 2, from.x, from.y);

    if (distance < minDistance) {
      minDistance = distance;
      closestElement = element;
    }
  });

  return getElementBounds(closestElement, elementsMap);
};

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  midX: number;
  midY: number;
  width: number;
  height: number;
}

export const getCommonBoundingBox = (
  elements: DucElement[] | readonly NonDeleted<DucElement>[],
): BoundingBox => {
  const [minX, minY, maxX, maxY] = getCommonBounds(elements);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    midX: (minX + maxX) / 2,
    midY: (minY + maxY) / 2,
  };
};

/**
 * returns scene coords of user's editor viewport (visible canvas area) bounds
 */
export const getVisibleSceneBounds = ({
  scrollX,
  scrollY,
  width,
  height,
  zoom,
}: AppState): SceneBounds => {
  return [
    -scrollX,
    -scrollY,
    -scrollX + width / zoom.value,
    -scrollY + height / zoom.value,
  ];
};

function sampleBezierCurve(
  start: Point,
  cp1: Point,
  cp2: Point,
  end: Point,
  numSamples: number
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    points.push(getBezierPoint(start, cp1, cp2, end, t));
  }
  return points;
}

function getBezierPoint(
  start: Point,
  cp1: Point,
  cp2: Point,
  end: Point,
  t: number
): Point {
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
