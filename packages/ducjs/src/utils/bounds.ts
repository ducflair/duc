import { DucElement, DucFreeDrawElement, DucLine, DucLinearElement, DucPoint, DucTextContainer, DucTextElement, DucTextElementWithContainer, ElementsMap } from "../types/elements";
import { isArrowElement, isFreeDrawElement, isLinearElement, isTextElement } from "../types/elements/typeChecks";
import { Bounds, GeometricPoint } from "../types/geometry.types";
import { getBoundTextElementPosition, getLinearElementAbsoluteCoords } from "./elements/linearElement";
import { getCubicBezierBoundingBox, getQuadraticBezierBoundingBox, rescaleLines, rescalePoints, rotate } from "./math";

export type SV = number;

const toNum = (v: any): number => typeof v === "number" ? v : (v?.value ?? 0);

/**
 * Common bounds calculation interface
 */
export interface BoundsResult {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Extended bounds calculation interface with center coordinates
 */
export interface ExtendedBoundsResult extends BoundsResult {
  cx: number;
  cy: number;
}

// Scene -> Scene coords, but in x1,x2,y1,y2 format.
//
// If the element is created from right to left, the width is going to be negative
// This set of functions retrieves the absolute position of the 4 points.
export type ElementAbsoluteCoords = [SV, SV, SV, SV, SV, SV];
export const getElementAbsoluteCoords = (
  element: DucElement,
  elementsMap: ElementsMap,
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
      );
      if (coords === null) {
        const ex = toNum(element.x);
        const ey = toNum(element.y);
        const ew = toNum(element.width);
        const eh = toNum(element.height);
        return [
          ex as SV,
          ey as SV,
          (ex + ew) as SV,
          (ey + eh) as SV,
          (ex + ew / 2) as SV,
          (ey + eh / 2) as SV,
        ];
      }
      const ew = toNum(element.width);
      const eh = toNum(element.height);
      return [
        coords.x as SV,
        coords.y as SV,
        (coords.x + ew) as SV,
        (coords.y + eh) as SV,
        (coords.x + ew / 2) as SV,
        (coords.y + eh / 2) as SV,
      ];
    }
  }
  const ex = toNum(element.x);
  const ey = toNum(element.y);
  const ew = toNum(element.width);
  const eh = toNum(element.height);
  return [
    ex as SV,
    ey as SV,
    (ex + ew) as SV,
    (ey + eh) as SV,
    (ex + ew / 2) as SV,
    (ey + eh / 2) as SV,
  ];
};

/**
 * Calculates bounds from a list of points (basic implementation)
 */
export const calculatePointsBounds = (points: readonly DucPoint[]): BoundsResult => {
  if (points.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };
  }

  return points.reduce(
    (limits, { x, y }) => ({
      minX: Math.min(limits.minX, toNum(x)),
      minY: Math.min(limits.minY, toNum(y)),
      maxX: Math.max(limits.maxX, toNum(x)),
      maxY: Math.max(limits.maxY, toNum(y)),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  );
};

/**
 * Calculates bounds from a list of geometric points (for bounds.ts compatibility)
 */
export const calculateGeometricPointsBounds = (points: GeometricPoint[]): BoundsResult => {
  if (points.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
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
    minX,
    minY,
    maxX,
    maxY,
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
      const p0 = { x: toNum(startPoint.x), y: toNum(startPoint.y) };
      const p1 = { x: toNum(startHandle.x), y: toNum(startHandle.y) };
      const p2 = { x: toNum(endHandle.x), y: toNum(endHandle.y) };
      const p3 = { x: toNum(endPoint.x), y: toNum(endPoint.y) };

      const bbox = getCubicBezierBoundingBox(p0, p1, p2, p3);
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    } else if (startHandle || endHandle) {
      // Quadratic Bezier curve segment (one handle present)
      const controlHandle = startHandle || endHandle!;
      const p0 = { x: toNum(startPoint.x), y: toNum(startPoint.y) };
      const p1 = { x: toNum(controlHandle.x), y: toNum(controlHandle.y) };
      const p2 = { x: toNum(endPoint.x), y: toNum(endPoint.y) };

      const bbox = getQuadraticBezierBoundingBox(p0, p1, p2);
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
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
  elementX: number,
  elementY: number,
  centerX: number,
  centerY: number,
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

    const elX = toNum(elementX);
    const elY = toNum(elementY);
    // Convert to absolute coordinates
    const absoluteStartPoint = {
      x: elX + toNum(startPoint.x),
      y: elY + toNum(startPoint.y),
    };
    const absoluteEndPoint = {
      x: elX + toNum(endPoint.x),
      y: elY + toNum(endPoint.y),
    };

    if (startHandle && endHandle) {
      // Cubic Bezier curve segment
      const absoluteStartHandle = {
        x: elX + toNum(startHandle.x),
        y: elY + toNum(startHandle.y),
      };
      const absoluteEndHandle = {
        x: elX + toNum(endHandle.x),
        y: elY + toNum(endHandle.y),
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
        x: elX + toNum(controlHandle!.x),
        y: elY + toNum(controlHandle!.y),
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
      const p0 = { x: toNum(p1.x), y: toNum(p1.y) };
      const p3 = { x: toNum(p2.x), y: toNum(p2.y) };

      const h1 = line[0].handle;
      const h2 = line[1].handle;

      try {
        if (h1 && h2) {
          const cp1 = { x: toNum(h1.x), y: toNum(h1.y) };
          const cp2 = { x: toNum(h2.x), y: toNum(h2.y) };
          const bbox = getCubicBezierBoundingBox(p0, cp1, cp2, p3);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        } else if (h1) {
          const cp1 = { x: toNum(h1.x), y: toNum(h1.y) };
          const bbox = getQuadraticBezierBoundingBox(p0, cp1, p3);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        } else if (h2) {
          const cp2 = { x: toNum(h2.x), y: toNum(h2.y) };
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
    cx: (bounds.maxX + bounds.minX) / 2,
    cy: (bounds.maxY + bounds.minY) / 2,
  };
}; 

export const getElementPointsCoords = (
  element: DucLinearElement,
  points: readonly DucPoint[],
): Bounds => {
  const ex = toNum(element.x);
  const ey = toNum(element.y);
  if (!points || !Array.isArray(points) || points.length === 0) {
    return [
      ex,
      ey,
      ex,
      ey,
    ] as const;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // First, include all the actual points (these are always on the path)
  for (const point of points) {
    minX = Math.min(minX, toNum(point.x));
    minY = Math.min(minY, toNum(point.y));
    maxX = Math.max(maxX, toNum(point.x));
    maxY = Math.max(maxY, toNum(point.y));
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
  const strokeWidth = toNum(element.stroke?.[0]?.width) || 0;
  const strokeOffset = strokeWidth / 2;

  minX -= strokeOffset;
  minY -= strokeOffset;
  maxX += strokeOffset;
  maxY += strokeOffset;

  return [
    (minX + ex) as SV,
    (minY + ey) as SV,
    (maxX + ex) as SV,
    (maxY + ey) as SV,
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
  const [minX, minY, maxX, maxY] = getBoundsFromPoints(element.points.map((p) => ({ x: toNum(p.x), y: toNum(p.y) })));
  const ex = toNum(element.x);
  const ey = toNum(element.y);
  const x1 = minX + ex;
  const y1 = minY + ey;
  const x2 = maxX + ex;
  const y2 = maxY + ey;
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
  nextWidth: number,
  nextHeight: number,
  normalizePoints: boolean,
): Bounds => {
  const ex = toNum(element.x);
  const ey = toNum(element.y);
  const nw = toNum(nextWidth);
  const nh = toNum(nextHeight);
  if (!(isLinearElement(element) || isFreeDrawElement(element))) {
    return [
      ex,
      ey,
      (ex + nw) as SV,
      (ey + nh) as SV,
    ];
  }

  const pointsAfterYRescale = rescalePoints(
    "y",
    nextHeight,
    element.points,
    normalizePoints,
  );
  const points = rescalePoints(
    "x",
    nextWidth,
    pointsAfterYRescale,
    normalizePoints,
  );

  if (isFreeDrawElement(element)) {
    const bounds = getBoundsFromPoints(
      points.map((p) => ({ x: toNum(p.x), y: toNum(p.y) })),
    );
    const [minX, minY, maxX, maxY] = bounds;
    return [
      (minX + ex) as SV,
      (minY + ey) as SV,
      (maxX + ex) as SV,
      (maxY + ey) as SV,
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
          )
        : [];

    return getElementPointsCoords(
      { ...element, points, lines: rescaledLines } as DucLinearElement,
      points,
    );
  }
};