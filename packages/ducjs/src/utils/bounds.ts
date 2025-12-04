import { Scope, ScopedValue } from "../types";
import { DucElement, DucFreeDrawElement, DucLine, DucLinearElement, DucPoint, DucTextContainer, DucTextElement, DucTextElementWithContainer, ElementsMap } from "../types/elements";
import { isArrowElement, isFreeDrawElement, isLinearElement, isTextElement } from "../types/elements/typeChecks";
import { Bounds, GeometricPoint } from "../types/geometryTypes";
import { getBoundTextElementPosition, getLinearElementAbsoluteCoords } from "./elements/linearElement";
import { getCubicBezierBoundingBox, getQuadraticBezierBoundingBox, rescaleLines, rescalePoints, rotate } from "./math";

type SV = ScopedValue;

/**
 * Common bounds calculation interface
 */
export interface BoundsResult {
  minX: ScopedValue;
  minY: ScopedValue;
  maxX: ScopedValue;
  maxY: ScopedValue;
}

/**
 * Extended bounds calculation interface with center coordinates
 */
export interface ExtendedBoundsResult extends BoundsResult {
  cx: ScopedValue;
  cy: ScopedValue;
}

// Scene -> Scene coords, but in x1,x2,y1,y2 format.
//
// If the element is created from right to left, the width is going to be negative
// This set of functions retrieves the absolute position of the 4 points.
export type ElementAbsoluteCoords = [SV, SV, SV, SV, SV, SV];
export const getElementAbsoluteCoords = (
  element: DucElement,
  elementsMap: ElementsMap,
  currentScope: Scope,
  includeBoundText: boolean = false,
  returnUnrotatedBoundsOnly: boolean = true,
): ElementAbsoluteCoords => {
  if (isFreeDrawElement(element)) {
    return getFreeDrawElementAbsoluteCoords(element);
  } else if (isLinearElement(element)) {
    return getLinearElementAbsoluteCoords(
      element,
      elementsMap,
      includeBoundText,
      currentScope,
      returnUnrotatedBoundsOnly,
    );
  } else if (isTextElement(element)) {
    const container = elementsMap
      ? getContainerElement(element, elementsMap)
      : null;
    if (isArrowElement(container)) {
      const coords = getBoundTextElementPosition(
        container,
        element as DucTextElementWithContainer,
        elementsMap,
        currentScope,
      );
      if (coords === null) {
        return [
          element.x.scoped as SV,
          element.y.scoped as SV,
          element.x.scoped + element.width.scoped as SV,
          element.y.scoped + element.height.scoped as SV,
          element.x.scoped + element.width.scoped / 2 as SV,
          element.y.scoped + element.height.scoped / 2 as SV,
        ];
      }
      return [
        coords.x as SV,
        coords.y as SV,
        coords.x + element.width.scoped as SV,
        coords.y + element.height.scoped as SV,
        coords.x + element.width.scoped / 2 as SV,
        coords.y + element.height.scoped / 2 as SV,
      ];
    }
  }
  return [
    element.x.scoped as SV,
    element.y.scoped as SV,
    element.x.scoped + element.width.scoped as SV,
    element.y.scoped + element.height.scoped as SV,
    element.x.scoped + element.width.scoped / 2 as SV,
    element.y.scoped + element.height.scoped / 2 as SV,
  ];
};

/**
 * Calculates bounds from a list of points (basic implementation)
 */
export const calculatePointsBounds = (points: readonly DucPoint[]): BoundsResult => {
  if (points.length === 0) {
    return {
      minX: 0 as ScopedValue,
      minY: 0 as ScopedValue,
      maxX: 0 as ScopedValue,
      maxY: 0 as ScopedValue,
    };
  }

  return points.reduce(
    (limits, { x, y }) => ({
      minX: Math.min(limits.minX, x.scoped) as ScopedValue,
      minY: Math.min(limits.minY, y.scoped) as ScopedValue,
      maxX: Math.max(limits.maxX, x.scoped) as ScopedValue,
      maxY: Math.max(limits.maxY, y.scoped) as ScopedValue,
    }),
    {
      minX: Infinity as ScopedValue,
      minY: Infinity as ScopedValue,
      maxX: -Infinity as ScopedValue,
      maxY: -Infinity as ScopedValue,
    },
  );
};

/**
 * Calculates bounds from a list of geometric points (for bounds.ts compatibility)
 */
export const calculateGeometricPointsBounds = (points: GeometricPoint[]): BoundsResult => {
  if (points.length === 0) {
    return {
      minX: 0 as ScopedValue,
      minY: 0 as ScopedValue,
      maxX: 0 as ScopedValue,
      maxY: 0 as ScopedValue,
    };
  }

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

  return {
    minX: minX as ScopedValue,
    minY: minY as ScopedValue,
    maxX: maxX as ScopedValue,
    maxY: maxY as ScopedValue,
  };
};

/**
 * Processes Bezier curves from lines and updates bounds
 */
export const processBezierCurveBounds = (
  points: readonly DucPoint[],
  lines: readonly DucLine[],
  initialBounds: BoundsResult,
): BoundsResult => {
  if (!lines || lines.length === 0) {
    return initialBounds;
  }

  let { minX, minY, maxX, maxY } = initialBounds;

  for (const line of lines) {
    const startIndex = line[0].index;
    const endIndex = line[1].index;
    const startHandle = line[0].handle;
    const endHandle = line[1].handle;

    // Get the start and end points
    const startPoint = points[startIndex];
    const endPoint = points[endIndex];

    if (!startPoint || !endPoint) continue;

    if (startHandle && endHandle) {
      // Cubic Bezier curve segment (both handles present)
      const p0 = { x: startPoint.x.scoped, y: startPoint.y.scoped };
      const p1 = { x: startHandle.x.scoped, y: startHandle.y.scoped };
      const p2 = { x: endHandle.x.scoped, y: endHandle.y.scoped };
      const p3 = { x: endPoint.x.scoped, y: endPoint.y.scoped };

      const bbox = getCubicBezierBoundingBox(p0, p1, p2, p3);
      minX = Math.min(minX, bbox.minX) as ScopedValue;
      minY = Math.min(minY, bbox.minY) as ScopedValue;
      maxX = Math.max(maxX, bbox.maxX) as ScopedValue;
      maxY = Math.max(maxY, bbox.maxY) as ScopedValue;
    } else if (startHandle || endHandle) {
      // Quadratic Bezier curve segment (one handle present)
      const controlHandle = startHandle || endHandle!;
      const p0 = { x: startPoint.x.scoped, y: startPoint.y.scoped };
      const p1 = { x: controlHandle.x.scoped, y: controlHandle.y.scoped };
      const p2 = { x: endPoint.x.scoped, y: endPoint.y.scoped };

      const bbox = getQuadraticBezierBoundingBox(p0, p1, p2);
      minX = Math.min(minX, bbox.minX) as ScopedValue;
      minY = Math.min(minY, bbox.minY) as ScopedValue;
      maxX = Math.max(maxX, bbox.maxX) as ScopedValue;
      maxY = Math.max(maxY, bbox.maxY) as ScopedValue;
    }
    // For straight line segments, the points already cover the bounds
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Processes Bezier curves with rotation and absolute positioning
 * Used for linear elements that need to account for rotation and absolute coordinates
 */
export const processRotatedAbsoluteBezierBounds = (
  points: readonly DucPoint[],
  lines: readonly DucLine[],
  elementX: ScopedValue,
  elementY: ScopedValue,
  centerX: ScopedValue,
  centerY: ScopedValue,
  angle: number,
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (!lines || lines.length === 0) {
    return { minX, minY, maxX, maxY };
  }

  for (const line of lines) {
    const startIndex = line[0].index;
    const endIndex = line[1].index;
    const startHandle = line[0].handle;
    const endHandle = line[1].handle;

    const startPoint = points[startIndex];
    const endPoint = points[endIndex];

    if (!startPoint || !endPoint) continue;

    // Convert to absolute coordinates
    const absoluteStartPoint = {
      x: elementX + startPoint.x.scoped,
      y: elementY + startPoint.y.scoped,
    };
    const absoluteEndPoint = {
      x: elementX + endPoint.x.scoped,
      y: elementY + endPoint.y.scoped,
    };

    if (startHandle && endHandle) {
      // Cubic Bezier curve segment
      const absoluteStartHandle = {
        x: elementX + startHandle.x.scoped,
        y: elementY + startHandle.y.scoped,
      };
      const absoluteEndHandle = {
        x: elementX + endHandle.x.scoped,
        y: elementY + endHandle.y.scoped,
      };

      const p0 = rotate(absoluteStartPoint.x, absoluteStartPoint.y, centerX, centerY, angle);
      const p1 = rotate(absoluteStartHandle.x, absoluteStartHandle.y, centerX, centerY, angle);
      const p2 = rotate(absoluteEndHandle.x, absoluteEndHandle.y, centerX, centerY, angle);
      const p3 = rotate(absoluteEndPoint.x, absoluteEndPoint.y, centerX, centerY, angle);

      const bbox = getCubicBezierBoundingBox(p0, p1, p2, p3);
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    } else if (startHandle || endHandle) {
      // Quadratic Bezier curve segment
      const controlHandle = startHandle || endHandle;
      const absoluteControlHandle = {
        x: elementX + controlHandle!.x.scoped,
        y: elementY + controlHandle!.y.scoped,
      };

      const p0 = rotate(absoluteStartPoint.x, absoluteStartPoint.y, centerX, centerY, angle);
      const p1 = rotate(absoluteControlHandle.x, absoluteControlHandle.y, centerX, centerY, angle);
      const p2 = rotate(absoluteEndPoint.x, absoluteEndPoint.y, centerX, centerY, angle);

      const bbox = getQuadraticBezierBoundingBox(p0, p1, p2);
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    } else {
      // Straight line segment - rotate the endpoints
      const p0 = rotate(absoluteStartPoint.x, absoluteStartPoint.y, centerX, centerY, angle);
      const p1 = rotate(absoluteEndPoint.x, absoluteEndPoint.y, centerX, centerY, angle);

      minX = Math.min(minX, p0.x, p1.x);
      minY = Math.min(minY, p0.y, p1.y);
      maxX = Math.max(maxX, p0.x, p1.x);
      maxY = Math.max(maxY, p0.y, p1.y);
    }
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Processes Bezier curves without rotation (for relative coordinate systems)
 * Used by getElementPointsCoords
 */
export const processRelativeBezierBounds = (
  points: readonly DucPoint[],
  lines: readonly DucLine[],
  initialBounds: { minX: number; minY: number; maxX: number; maxY: number },
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let { minX, minY, maxX, maxY } = initialBounds;

  if (!lines || lines.length === 0) {
    return { minX, minY, maxX, maxY };
  }

  for (const line of lines) {
    const p1_idx = line[0].index;
    const p2_idx = line[1].index;

    if (p1_idx < 0 || p1_idx >= points.length || p2_idx < 0 || p2_idx >= points.length) {
      continue;
    }

    const p1 = points[p1_idx];
    const p2 = points[p2_idx];

    if (line[0].handle || line[1].handle) {
      const p0 = { x: p1.x.scoped, y: p1.y.scoped };
      const p3 = { x: p2.x.scoped, y: p2.y.scoped };

      const h1 = line[0].handle;
      const h2 = line[1].handle;

      try {
        if (h1 && h2) {
          const cp1 = { x: h1.x.scoped, y: h1.y.scoped };
          const cp2 = { x: h2.x.scoped, y: h2.y.scoped };
          const bbox = getCubicBezierBoundingBox(p0, cp1, cp2, p3);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        } else if (h1) {
          const cp1 = { x: h1.x.scoped, y: h1.y.scoped };
          const bbox = getQuadraticBezierBoundingBox(p0, cp1, p3);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        } else if (h2) {
          const cp2 = { x: h2.x.scoped, y: h2.y.scoped };
          const bbox = getQuadraticBezierBoundingBox(p0, cp2, p3);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        }
      } catch (e) {
        // ignore failed curve bound calculations
      }
    }
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Calculates bounds considering both points and Bezier curves defined by lines
 */
export const calculateShapeBounds = (points: readonly DucPoint[], lines: readonly DucLine[]): BoundsResult => {
  // Start with the bounds from the actual points
  const pointBounds = calculatePointsBounds(points);

  // Consider Bezier curves defined by lines with handles
  return processBezierCurveBounds(points, lines, pointBounds);
};

/**
 * Extended bounds calculation that includes center coordinates
 */
export const calculatePointsBoundsWithCenter = (points: readonly DucPoint[]): ExtendedBoundsResult => {
  const bounds = calculatePointsBounds(points);
  
  return {
    ...bounds,
    cx: ((bounds.maxX + bounds.minX) / 2) as ScopedValue,
    cy: ((bounds.maxY + bounds.minY) / 2) as ScopedValue,
  };
}; 

export const getElementPointsCoords = (
  element: DucLinearElement,
  points: readonly DucPoint[],
): Bounds => {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return [
      element.x.scoped,
      element.y.scoped,
      element.x.scoped,
      element.y.scoped,
    ] as const;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // First, include all the actual points (these are always on the path)
  for (const point of points) {
    minX = Math.min(minX, point.x.scoped);
    minY = Math.min(minY, point.y.scoped);
    maxX = Math.max(maxX, point.x.scoped);
    maxY = Math.max(maxY, point.y.scoped);
  }

  const lines = element.lines || [];

  // Use the shared utility for relative Bezier bounds calculation
  const bezierBounds = processRelativeBezierBounds(
    points,
    lines,
    { minX, minY, maxX, maxY }
  );
  
  minX = bezierBounds.minX;
  minY = bezierBounds.minY;
  maxX = bezierBounds.maxX;
  maxY = bezierBounds.maxY;

  // Account for stroke width
  const strokeWidth = element.stroke?.[0]?.width?.scoped || 0;
  const strokeOffset = strokeWidth / 2;

  minX -= strokeOffset;
  minY -= strokeOffset;
  maxX += strokeOffset;
  maxY += strokeOffset;

  return [
    (minX + element.x.scoped) as SV,
    (minY + element.y.scoped) as SV,
    (maxX + element.x.scoped) as SV,
    (maxY + element.y.scoped) as SV,
  ];
};

export const getContainerElement = (
  element: DucTextElement | null,
  elementsMap: ElementsMap,
): DucTextContainer | null => {
  if (!element) {
    return null;
  }
  if (element.containerId) {
    return (elementsMap.get(element.containerId) ||
      null) as DucTextContainer | null;
  }
  return null;
};

export const getBoundsFromPoints = (
  points: GeometricPoint[],
): Bounds => {
  const bounds = calculateGeometricPointsBounds(points);
  return [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY];
};

export const getFreeDrawElementAbsoluteCoords = (
  element: DucFreeDrawElement,
): ElementAbsoluteCoords => {
  const [minX, minY, maxX, maxY] = getBoundsFromPoints(element.points.map((p) => ({x: p.x.scoped, y: p.y.scoped})));
  const x1 = minX + element.x.scoped;
  const y1 = minY + element.y.scoped;
  const x2 = maxX + element.x.scoped;
  const y2 = maxY + element.y.scoped;
  return [
    x1 as SV,
    y1 as SV,
    x2 as SV,
    y2 as SV,
    (x1 + x2) / 2 as SV,
    (y1 + y2) / 2 as SV,
  ];
};


export const getBoundTextElementId = (container: DucElement | null) => {
  return container?.boundElements?.length
    ? container?.boundElements?.find((ele) => ele.type === "text")?.id || null
    : null;
};

export const getBoundTextElement = (
  element: DucElement | null,
  elementsMap: ElementsMap,
) => {
  if (!element) {
    return null;
  }
  const boundTextElementId = getBoundTextElementId(element);

  if (boundTextElementId) {
    return (elementsMap.get(boundTextElementId) ||
      null) as DucTextElementWithContainer | null;
  }
  return null;
};



export const getResizedElementAbsoluteCoords = (
  element: DucElement,
  nextWidth: ScopedValue,
  nextHeight: ScopedValue,
  normalizePoints: boolean,
  currentScope: Scope,
): Bounds => {
  if (!(isLinearElement(element) || isFreeDrawElement(element))) {
    return [
      element.x.scoped,
      element.y.scoped,
      (element.x.scoped + nextWidth) as SV,
      (element.y.scoped + nextHeight) as SV,
    ];
  }

  const pointsAfterYRescale = rescalePoints(
    "y",
    nextHeight,
    element.points,
    normalizePoints,
    element.scope,
    currentScope,
  );
  const points = rescalePoints(
    "x",
    nextWidth,
    pointsAfterYRescale,
    normalizePoints,
    element.scope,
    currentScope,
  );

  if (isFreeDrawElement(element)) {
    const bounds = getBoundsFromPoints(
      points.map((p) => ({ x: p.x.scoped, y: p.y.scoped })),
    );
    const [minX, minY, maxX, maxY] = bounds;
    return [
      (minX + element.x.scoped) as SV,
      (minY + element.y.scoped) as SV,
      (maxX + element.x.scoped) as SV,
      (maxY + element.y.scoped) as SV,
    ];
  } else {
    // Linear element
    const linesAfterYRescale =
      element.lines
        ? rescaleLines(
            "y",
            nextHeight,
            element.lines,
            element.points,
            normalizePoints,
            element.scope,
            currentScope,
          )
        : [];
    const rescaledLines =
      element.lines
        ? rescaleLines(
            "x",
            nextWidth,
            linesAfterYRescale,
            element.points,
            normalizePoints,
            element.scope,
            currentScope,
          )
        : [];

    return getElementPointsCoords(
      { ...element, points, lines: rescaledLines } as DucLinearElement,
      points,
    );
  }
};