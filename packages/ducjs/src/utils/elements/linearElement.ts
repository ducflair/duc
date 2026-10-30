import type { DucLine, DucLinearElement, DucLinearLikeElement, DucPoint, DucTextElementWithContainer, ElementsMap, NonDeleted } from "../../types/elements";
import { Bounds, GeometricPoint } from "../../types/geometry.types";
import type { ValueOf } from "../../types/utility.types";
import { ElementAbsoluteCoords, getBoundTextElement, getElementAbsoluteCoords, getElementPointsCoords } from "../bounds";
import { LINE_CONFIRM_THRESHOLD } from "../constants";
import { centerPoint, getBezierXY, getControlPointsForBezierCurve, getCubicBezierBoundingBox, getQuadraticBezierBoundingBox, mapIntervalToBezierT, rotate, rotatePoint } from "../math";
import { HANDLE_TYPE } from "../../enums";

type SV = number;

export type HandleType = ValueOf<typeof HANDLE_TYPE> | null;
export type HandleInfo = {
  pointIndex: number;
  handleType: HandleType;
  lineIndex: number;
  handle: DucPoint;
};

/**
 * Merges overlapping points using the line-based system
 * Returns updated points and lines arrays
 */
export const mergeOverlappingPoints = (
  points: DucPoint[],
  lines: DucLine[],
  threshold: number = LINE_CONFIRM_THRESHOLD
): { points: DucPoint[]; lines: DucLine[] } => {
  // Create copies to avoid mutating originals
  const pointsCopy = structuredClone(points);
  const linesCopy = structuredClone(lines);

  // Step 1: Find overlapping points
  const overlaps = findOverlappingPointGroups(pointsCopy, threshold);

  // Process each group of overlapping points
  const allPointsToRemove: number[] = [];
  const newLinesToAdd: DucLine[] = [];

  for (const overlapGroup of overlaps) {
    if (overlapGroup.length > 1) {
      // Step 2: Choose target point (lowest index)
      const targetIndex = Math.min(...overlapGroup);
      const pointsToRemove = overlapGroup.filter(idx => idx !== targetIndex);

      // Step 3: Create new lines to preserve connectivity before updating references
      const newLines = createNewLinesForMergedPoints(
        linesCopy,
        pointsToRemove,
        targetIndex
      );
      newLinesToAdd.push(...newLines);

      // Step 4: Update all line references to point to target
      updateLineReferences(linesCopy, pointsToRemove, targetIndex);

      // Step 5: Merge any bezier properties if needed
      mergeBezierProperties(pointsCopy, targetIndex, pointsToRemove);

      // Collect points to remove
      allPointsToRemove.push(...pointsToRemove);
    }
  }

  // Add new lines to preserve connectivity
  linesCopy.push(...newLinesToAdd);

  // Step 6: Remove duplicate points and update all indices
  if (allPointsToRemove.length > 0) {
    const { updatedPoints, updatedLines } = removePointsAndUpdateIndices(
      pointsCopy,
      linesCopy,
      allPointsToRemove
    );

    // Step 7: Remove duplicate lines (keep only the one with the lowest index)
    const finalLines = removeDuplicateLines(updatedLines);

    return { points: updatedPoints, lines: finalLines };
  }

  return { points: pointsCopy, lines: linesCopy };
}

const findOverlappingPointGroups = (points: DucPoint[], threshold: number): number[][] => {
  const groups: { [key: string]: number[] } = {};

  points.forEach((point, index) => {
    // Create a key based on rounded coordinates for threshold-based grouping
    const px = typeof point.x === "number" ? point.x : ((point.x as any)?.value ?? 0);
    const py = typeof point.y === "number" ? point.y : ((point.y as any)?.value ?? 0);
    const roundedX = Math.round(px / threshold) * threshold;
    const roundedY = Math.round(py / threshold) * threshold;
    const key = `${roundedX},${roundedY}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(index);
  });

  return Object.values(groups).filter(group => group.length > 1);
}

const updateLineReferences = (
  lines: DucLine[],
  pointsToRemove: number[],
  targetIndex: number
): void => {
  lines.forEach(line => {
    // Update first point reference
    if (pointsToRemove.includes(line[0].index)) {
      line[0].index = targetIndex;
    }

    // Update second point reference
    if (pointsToRemove.includes(line[1].index)) {
      line[1].index = targetIndex;
    }
  });

  // Remove lines that now connect a point to itself (self-loops)
  const linesToRemove: number[] = [];
  lines.forEach((line, index) => {
    if (line[0].index === line[1].index) {
      linesToRemove.push(index);
    }
  });

  // Remove self-loop lines in reverse order
  linesToRemove.reverse().forEach(index => {
    lines.splice(index, 1);
  });
}

const mergeBezierProperties = (
  points: DucPoint[],
  targetIndex: number,
  pointsToRemove: number[]
): void => {
  // If target doesn't have mirroring but a removed point does, inherit it
  if (!points[targetIndex].mirroring) {
    for (const removeIndex of pointsToRemove) {
      if (points[removeIndex].mirroring) {
        points[targetIndex].mirroring = points[removeIndex].mirroring;
        break; // Take the first one found
      }
    }
  }
}

const removePointsAndUpdateIndices = (
  points: DucPoint[],
  lines: DucLine[],
  indicesToRemove: number[]
): { updatedPoints: DucPoint[]; updatedLines: DucLine[] } => {
  const uniqueIndicesToRemove = Array.from(new Set(indicesToRemove));

  const indexMap = createIndexMapping(
    points.length,
    uniqueIndicesToRemove
  );

  const updatedPoints = points.filter((_, index) => !uniqueIndicesToRemove.includes(index));

  const updatedLines: DucLine[] = [];
  for (const line of lines) {
    const p1Index = indexMap[line[0].index];
    const p2Index = indexMap[line[1].index];

    if (p1Index !== -1 && p2Index !== -1) {
      updatedLines.push([
        { ...line[0], index: p1Index },
        { ...line[1], index: p2Index }
      ]);
    }
  }
  return { updatedPoints, updatedLines };
}

const createIndexMapping = (originalLength: number, removedIndices: number[]): number[] => {
  const indexMap: number[] = [];
  let offset = 0;

  for (let i = 0; i < originalLength; i++) {
    if (removedIndices.includes(i)) {
      offset++;
      indexMap[i] = -1; // Mark as removed
    } else {
      indexMap[i] = i - offset;
    }
  }

  return indexMap;
}


/**
 * Creates new lines to preserve connectivity when points are merged
 * This ensures that connections involving the removed points are maintained
 */
/**
 * Creates new lines to preserve connectivity when points are merged
 * This ensures that connections involving the removed points are maintained
 */
const createNewLinesForMergedPoints = (
  lines: DucLine[],
  pointsToRemove: number[],
  targetIndex: number
): DucLine[] => {
  const newLines: DucLine[] = [];
  const connectionsToPreserve = new Set<string>();

  // Find all unique connections that involve points being removed
  lines.forEach(line => {
    const point1 = line[0].index;
    const point2 = line[1].index;

    // If either point is being removed, we need to check if we need new connections
    if (pointsToRemove.includes(point1) || pointsToRemove.includes(point2)) {
      // Determine what the connection will become after merge
      const newPoint1 = pointsToRemove.includes(point1) ? targetIndex : point1;
      const newPoint2 = pointsToRemove.includes(point2) ? targetIndex : point2;

      // Skip self-loops
      if (newPoint1 !== newPoint2) {
        // Create normalized connection key to avoid duplicates
        const connectionKey = [Math.min(newPoint1, newPoint2), Math.max(newPoint1, newPoint2)].join('-');

        // If this is a new connection we haven't seen before
        if (!connectionsToPreserve.has(connectionKey)) {
          connectionsToPreserve.add(connectionKey);

          // Check if this connection already exists in the original lines
          const connectionExists = lines.some(existingLine => {
            const ep1 = existingLine[0].index;
            const ep2 = existingLine[1].index;
            return (ep1 === newPoint1 && ep2 === newPoint2) ||
              (ep1 === newPoint2 && ep2 === newPoint1);
          });

          // Only create new line if the connection doesn't already exist
          if (!connectionExists) {
            newLines.push([
              { index: newPoint1, handle: line[0].index === point1 ? line[0].handle : null },
              { index: newPoint2, handle: line[1].index === point2 ? line[1].handle : null }
            ]);
          }
        }
      }
    }
  });

  return newLines;
}

/**
 * Removes duplicate lines, keeping only the one with the lowest index
 * Two lines are considered duplicates if they connect the same points (regardless of direction)
 */
const removeDuplicateLines = (lines: DucLine[]): DucLine[] => {
  const seenConnections = new Map<string, number>();
  const linesToKeep: DucLine[] = [];

  lines.forEach((line, index) => {
    // Create a normalized key for the connection (sorted indices to handle bidirectional duplicates)
    const point1 = line[0].index;
    const point2 = line[1].index;
    const connectionKey = [Math.min(point1, point2), Math.max(point1, point2)].join('-');

    if (!seenConnections.has(connectionKey)) {
      // First time seeing this connection, keep it
      seenConnections.set(connectionKey, index);
      linesToKeep.push(line);
    }
    // If we've seen this connection before, we skip it (removing the duplicate with higher index)
  });

  return linesToKeep;
}


/**
 * Normalizes line points so that the start point is at [0,0]. This is
 * expected in various parts of the codebase. Also returns new x/y to account
 * for the potential normalization.
 */
export const getNormalizedPoints = (
  element: DucLinearElement | {
    points: DucPoint[];
    lines: DucLine[];
    x: number;
    y: number;
  },
): {
  points: DucPoint[];
  lines: DucLine[];
  x: number;
  y: number;
} => {
  const { points, x, y, lines } = element;
  const numX = typeof x === "number" ? x : ((x as any)?.value ?? 0);
  const numY = typeof y === "number" ? y : ((y as any)?.value ?? 0);

  if (points.length === 0) {
    // Handle empty points array: return element's current x/y and empty normalized points
    return {
      points: [],
      x: numX,
      y: numY,
      lines: (lines as DucLine[]) || [],
    };
  }

  const offsetX = typeof points[0].x === "number" ? points[0].x : ((points[0].x as any)?.value ?? 0);
  const offsetY = typeof points[0].y === "number" ? points[0].y : ((points[0].y as any)?.value ?? 0);

  const normalizedPoints: DucPoint[] = points.map((point) => {
    const px = typeof point.x === "number" ? point.x : ((point.x as any)?.value ?? 0);
    const py = typeof point.y === "number" ? point.y : ((point.y as any)?.value ?? 0);
    return {
      ...point,
      x: px - offsetX,
      y: py - offsetY,
    };
  });

  const normalizedLines: DucLine[] = (lines || []).map((line): DucLine => {
    const [start, end] = line;
    return [
      {
        ...start,
        handle: start.handle
          ? {
            x: (typeof start.handle.x === "number" ? start.handle.x : ((start.handle.x as any)?.value ?? 0)) - offsetX,
            y: (typeof start.handle.y === "number" ? start.handle.y : ((start.handle.y as any)?.value ?? 0)) - offsetY,
          }
          : null,
      },
      {
        ...end,
        handle: end.handle
          ? {
            x: (typeof end.handle.x === "number" ? end.handle.x : ((end.handle.x as any)?.value ?? 0)) - offsetX,
            y: (typeof end.handle.y === "number" ? end.handle.y : ((end.handle.y as any)?.value ?? 0)) - offsetY,
          }
          : null,
      },
    ];
  });

  return {
    points: normalizedPoints,
    lines: normalizedLines,
    x: numX + offsetX,
    y: numY + offsetY,
  };
}


/** scene coords */
export const getPointsGlobalCoordinates = (
  element: DucLinearLikeElement,
  elementsMap: ElementsMap,
): DucPoint[] => {
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const elX = typeof element.x === "number" ? element.x : 0;
  const elY = typeof element.y === "number" ? element.y : 0;
  return element.points.map((point) => {
    const ptX = typeof point.x === "number" ? point.x : 0;
    const ptY = typeof point.y === "number" ? point.y : 0;
    const rotatePoint = rotate(elX + ptX, elY + ptY, cx, cy, element.angle);
    return { ...point, x: rotatePoint.x, y: rotatePoint.y } as const;
  });
}

/** scene coords */
export const getPointGlobalCoordinates = (
  element: DucLinearLikeElement,
  point: GeometricPoint,
  elementsMap: ElementsMap,
): GeometricPoint => {
  const [x1_sv, y1_sv, x2_sv, y2_sv] = getElementAbsoluteCoords(element, elementsMap);
  const cx = (x1_sv + x2_sv) / 2;
  const cy = (y1_sv + y2_sv) / 2;

  const elementX = typeof element.x === "number" ? element.x : 0;
  const elementY = typeof element.y === "number" ? element.y : 0;
  const rotatedPoint = rotate(elementX + point.x, elementY + point.y, cx, cy, element.angle);

  return { x: rotatedPoint.x, y: rotatedPoint.y };
};

export const getBoundTextElementPosition = (
  element: DucLinearLikeElement,
  boundTextElement: DucTextElementWithContainer,
  elementsMap: ElementsMap,
): GeometricPoint | null => {
  const points = getPointsGlobalCoordinates(
    element,
    elementsMap,
  );
  if (points.length < 2) {
    return null;
  }
  let x = 0;
  let y = 0;
  if (element.points.length % 2 === 1) {
    const index = Math.floor(element.points.length / 2);
    const midPoint = getPointGlobalCoordinates(
      element,
      { x: element.points[index].x, y: element.points[index].y },
      elementsMap,
    );
    const btw = typeof boundTextElement.width === "number" ? boundTextElement.width : 0;
    const bth = typeof boundTextElement.height === "number" ? boundTextElement.height : 0;
    x = midPoint.x - btw / 2;
    y = midPoint.y - bth / 2;
    } else {
    const index = element.points.length / 2 - 1;
    let midSegmentMidpoint: GeometricPoint | null = null;

    if (element.points.length === 2) {
      const p0x = typeof points[0].x === "number" ? points[0].x : 0;
      const p0y = typeof points[0].y === "number" ? points[0].y : 0;
      const p1x = typeof points[1].x === "number" ? points[1].x : 0;
      const p1y = typeof points[1].y === "number" ? points[1].y : 0;
      midSegmentMidpoint = centerPoint(
        { x: p0x, y: p0y },
        { x: p1x, y: p1y },
      );
    } else {
      midSegmentMidpoint = getSegmentMidPoint(
        element,
        { x: points[index].x, y: points[index].y },
        { x: points[index + 1].x, y: points[index + 1].y },
        index + 1,
        elementsMap,
      );
    }
    if (midSegmentMidpoint) {
      const btw = typeof boundTextElement.width === "number" ? boundTextElement.width : 0;
      const bth = typeof boundTextElement.height === "number" ? boundTextElement.height : 0;
      x = midSegmentMidpoint.x - btw / 2;
      y = midSegmentMidpoint.y - bth / 2;
    }
  }
  return { x, y };
};

export const getLinearElementAbsoluteCoords = (
  element: DucLinearElement,
  elementsMap: ElementsMap,
  includeBoundText: boolean = false,
  returnUnrotatedBoundsOnly: boolean = true,
): ElementAbsoluteCoords => {
  const { points, lines, angle, x: elX, y: elY } = element;

  // Get unrotated bounding box to determine the center of rotation
  const [unrotatedX1, unrotatedY1, unrotatedX2, unrotatedY2] =
    getElementPointsCoords(element, points);
  const cx = ((unrotatedX1 + unrotatedX2) / 2) as SV;
  const cy = ((unrotatedY1 + unrotatedY2) / 2) as SV;

  let coords: ElementAbsoluteCoords;

  if (!returnUnrotatedBoundsOnly && angle !== 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const ex = typeof elX === "number" ? elX : 0;
    const ey = typeof elY === "number" ? elY : 0;
    const getPtX = (p: DucPoint) => typeof p.x === "number" ? p.x : 0;
    const getPtY = (p: DucPoint) => typeof p.y === "number" ? p.y : 0;

    if (lines && lines.length > 0) {
      for (const line of lines) {
        const startPoint = points[line[0].index];
        const endPoint = points[line[1].index];
        if (!startPoint || !endPoint) {
          continue;
        }

        const absoluteStartPoint = {
          x: ex + getPtX(startPoint),
          y: ey + getPtY(startPoint),
        };
        const absoluteEndPoint = {
          x: ex + getPtX(endPoint),
          y: ey + getPtY(endPoint),
        };
        const startHandle = line[0].handle;
        const endHandle = line[1].handle;

        if (startHandle && endHandle) {
          const absoluteStartHandle = {
            x: ex + getPtX(startHandle),
            y: ey + getPtY(startHandle),
          };
          const absoluteEndHandle = {
            x: ex + getPtX(endHandle),
            y: ey + getPtY(endHandle),
          };

          const p0 = rotate(
            absoluteStartPoint.x,
            absoluteStartPoint.y,
            cx,
            cy,
            angle,
          );
          const p1 = rotate(
            absoluteStartHandle.x,
            absoluteStartHandle.y,
            cx,
            cy,
            angle,
          );
          const p2 = rotate(
            absoluteEndHandle.x,
            absoluteEndHandle.y,
            cx,
            cy,
            angle,
          );
          const p3 = rotate(
            absoluteEndPoint.x,
            absoluteEndPoint.y,
            cx,
            cy,
            angle,
          );

          const bbox = getCubicBezierBoundingBox(p0, p1, p2, p3);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        } else if (startHandle || endHandle) {
          const controlHandle = startHandle || endHandle;
          const absoluteControlHandle = {
            x: ex + getPtX(controlHandle!),
            y: ey + getPtY(controlHandle!),
          };

          const p0 = rotate(
            absoluteStartPoint.x,
            absoluteStartPoint.y,
            cx,
            cy,
            angle,
          );
          const p1 = rotate(
            absoluteControlHandle.x,
            absoluteControlHandle.y,
            cx,
            cy,
            angle,
          );
          const p2 = rotate(
            absoluteEndPoint.x,
            absoluteEndPoint.y,
            cx,
            cy,
            angle,
          );

          const bbox = getQuadraticBezierBoundingBox(p0, p1, p2);
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        } else {
          const p0 = rotate(
            absoluteStartPoint.x,
            absoluteStartPoint.y,
            cx,
            cy,
            angle,
          );
          const p1 = rotate(
            absoluteEndPoint.x,
            absoluteEndPoint.y,
            cx,
            cy,
            angle,
          );
          minX = Math.min(minX, p0.x, p1.x);
          minY = Math.min(minY, p0.y, p1.y);
          maxX = Math.max(maxX, p0.x, p1.x);
          maxY = Math.max(maxY, p0.y, p1.y);
        }
      }
    } else {
      // Fallback for elements without lines
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = rotate(
          ex + getPtX(points[i]),
          ey + getPtY(points[i]),
          cx,
          cy,
          angle,
        );
        const p1 = rotate(
          ex + getPtX(points[i + 1]),
          ey + getPtY(points[i + 1]),
          cx,
          cy,
          angle,
        );
        minX = Math.min(minX, p0.x, p1.x);
        minY = Math.min(minY, p0.y, p1.y);
        maxX = Math.max(maxX, p0.x, p1.x);
        maxY = Math.max(maxY, p0.y, p1.y);
      }
    }
    coords = [
      minX as SV,
      minY as SV,
      maxX as SV,
      maxY as SV,
      ((minX + maxX) / 2) as SV,
      ((minY + maxY) / 2) as SV,
    ];
  } else {
    coords = [unrotatedX1, unrotatedY1, unrotatedX2, unrotatedY2, cx, cy];
  }

  if (includeBoundText) {
    const boundTextElement = getBoundTextElement(element, elementsMap);
    if (boundTextElement) {
      coords = getMinMaxXYWithBoundText(
        element,
        elementsMap,
        [coords[0], coords[1], coords[2], coords[3]],
        boundTextElement,
      );
    }
  }

  return coords;
};



export const getMinMaxXYWithBoundText = (
  element: DucLinearElement,
  elementsMap: ElementsMap,
  elementBounds: Bounds,
  boundTextElement: DucTextElementWithContainer,
): ElementAbsoluteCoords => {
  let [x1, y1, x2, y2] = elementBounds;
  const cx = (x1 + x2) / 2 as SV;
  const cy = (y1 + y2) / 2 as SV;
  const boundTextCoords = getBoundTextElementPosition(
    element,
    boundTextElement,
    elementsMap,
  );

  if (boundTextCoords === null) {
    return [x1, y1, x2, y2, cx, cy];
  }

  const { x: boundTextX1, y: boundTextY1 } = boundTextCoords;
  const btw = typeof boundTextElement.width === "number" ? boundTextElement.width : 0;
  const bth = typeof boundTextElement.height === "number" ? boundTextElement.height : 0;
  const boundTextX2 = boundTextX1 + btw;
  const boundTextY2 = boundTextY1 + bth;

  const topLeftRotatedPoint = rotatePoint({ x: x1, y: y1 }, { x: cx, y: cy }, element.angle);
  const topRightRotatedPoint = rotatePoint({ x: x2, y: y1 }, { x: cx, y: cy }, element.angle);

  const counterRotateBoundTextTopLeft = rotatePoint(
    { x: boundTextX1, y: boundTextY1 },
    { x: cx, y: cy },
    -element.angle,
  );
  const counterRotateBoundTextTopRight = rotatePoint(
    { x: boundTextX2, y: boundTextY1 },
    { x: cx, y: cy },
    -element.angle,
  );
  const counterRotateBoundTextBottomLeft = rotatePoint(
    { x: boundTextX1, y: boundTextY2 },
    { x: cx, y: cy },
    -element.angle,
  );
  const counterRotateBoundTextBottomRight = rotatePoint(
    { x: boundTextX2, y: boundTextY2 },
    { x: cx, y: cy },
    -element.angle,
  );

  if (
    topLeftRotatedPoint.x < topRightRotatedPoint.x &&
    topLeftRotatedPoint.y >= topRightRotatedPoint.y
  ) {
    x1 = Math.min(x1, counterRotateBoundTextBottomLeft.x) as SV;
    x2 = Math.max(
      x2,
      Math.max(
        counterRotateBoundTextTopRight.x,
        counterRotateBoundTextBottomRight.x,
      ),
    ) as SV;
    y1 = Math.min(y1, counterRotateBoundTextTopLeft.y) as SV;

    y2 = Math.max(y2, counterRotateBoundTextBottomRight.y) as SV;
  } else if (
    topLeftRotatedPoint.x >= topRightRotatedPoint.x &&
    topLeftRotatedPoint.y > topRightRotatedPoint.y
  ) {
    x1 = Math.min(x1, counterRotateBoundTextBottomRight.x) as SV;
    x2 = Math.max(
      x2,
      Math.max(
        counterRotateBoundTextTopLeft.x,
        counterRotateBoundTextTopRight.x,
      ),
    ) as SV;
    y1 = Math.min(y1, counterRotateBoundTextBottomLeft.y) as SV;

    y2 = Math.max(y2, counterRotateBoundTextTopRight.y) as SV;
  } else if (topLeftRotatedPoint.x >= topRightRotatedPoint.x) {
    x1 = Math.min(x1, counterRotateBoundTextTopRight.x) as SV;
    x2 = Math.max(x2, counterRotateBoundTextBottomLeft.x) as SV;
    y1 = Math.min(y1, counterRotateBoundTextBottomRight.y) as SV;

    y2 = Math.max(y2, counterRotateBoundTextTopLeft.y) as SV;
  } else if (topLeftRotatedPoint.y <= topRightRotatedPoint.y) {
    x1 = Math.min(
      x1,
      Math.min(
        counterRotateBoundTextTopRight.x,
        counterRotateBoundTextTopLeft.x,
      ),
    ) as SV;

    x2 = Math.max(x2, counterRotateBoundTextBottomRight.x) as SV;
    y1 = Math.min(y1, counterRotateBoundTextTopRight.y) as SV;
    y2 = Math.max(y2, counterRotateBoundTextBottomLeft.y) as SV;
  }

  return [x1, y1, x2, y2, cx, cy];
};

export const getSegmentMidPoint = (
  element: NonDeleted<DucLinearLikeElement>,
  startPoint: GeometricPoint,
  endPoint: GeometricPoint,
  endPointIndex: number,
  elementsMap: ElementsMap,
): GeometricPoint => {
  let segmentMidPoint = centerPoint(startPoint, endPoint);
  if (element.points.length > 2 && element.roundness) {
    const controlPoints = getControlPointsForBezierCurve(
      element,
      { x: element.points[endPointIndex].x, y: element.points[endPointIndex].y },
    );
    if (controlPoints) {
      const t = mapIntervalToBezierT(
        element,
        { x: element.points[endPointIndex].x, y: element.points[endPointIndex].y },
        0.5,
      );

      const { x: tx, y: ty } = getBezierXY(
        controlPoints[0],
        controlPoints[1],
        controlPoints[2],
        controlPoints[3],
        t,
      );
      segmentMidPoint = getPointGlobalCoordinates(
        element,
        { x: tx, y: ty },
        elementsMap,
      );
    }
  }

  return segmentMidPoint;
}; 


/**
 * Validates if the given line indices form a closed path in the element
 * @param element The linear element containing the points and lines
 * @param lineIndices Array of line indices to check
 * @returns true if the line indices form a valid closed path, false otherwise
 */
export const validateClosedPath = (
  element: NonDeleted<DucLinearElement>,
  lineIndices: number[]
): boolean => {
  if (!lineIndices || lineIndices.length < 3) {
    // Need at least 3 lines to form a closed path
    return false;
  }

  // Check if all line indices are valid
  const invalidIndices = lineIndices.filter(
    index => index < 0 || index >= element.lines.length
  );
  if (invalidIndices.length > 0) {
    return false;
  }

  // Get the actual lines
  const pathLines = lineIndices.map(index => element.lines[index]);

  // Build adjacency map for the path lines only
  const adjacency = new Map<number, number[]>();

  for (const line of pathLines) {
    const startIdx = line[0].index;
    const endIdx = line[1].index;

    // Check if point indices are valid
    if (startIdx < 0 || startIdx >= element.points.length ||
      endIdx < 0 || endIdx >= element.points.length) {
      return false;
    }

    // Add bidirectional connections
    if (!adjacency.has(startIdx)) {
      adjacency.set(startIdx, []);
    }
    if (!adjacency.has(endIdx)) {
      adjacency.set(endIdx, []);
    }

    adjacency.get(startIdx)!.push(endIdx);
    adjacency.get(endIdx)!.push(startIdx);
  }
  // For a closed path, every point should have exactly 2 connections
  adjacency.forEach((connections) => {
    if (connections.length !== 2) {
      return false;
    }
  });

  // Check if we can traverse all lines and return to start
  const visitedLines = new Set<number>();
  const startLine = pathLines[0];
  let currentPoint = startLine[0].index;
  const targetPoint = startLine[1].index;

  // Mark first line as visited
  visitedLines.add(lineIndices[0]);
  currentPoint = targetPoint;

  while (visitedLines.size < lineIndices.length) {
    let foundNextLine = false;

    for (let i = 0; i < lineIndices.length; i++) {
      const lineIndex = lineIndices[i];
      if (visitedLines.has(lineIndex)) {
        continue;
      }

      const line = pathLines[i];
      let nextPoint: number | null = null;

      if (line[0].index === currentPoint) {
        nextPoint = line[1].index;
      } else if (line[1].index === currentPoint) {
        nextPoint = line[0].index;
      }

      if (nextPoint !== null) {
        visitedLines.add(lineIndex);
        currentPoint = nextPoint;
        foundNextLine = true;
        break;
      }
    }

    if (!foundNextLine) {
      return false;
    }
  }

  // Check if we've returned to the starting point
  return currentPoint === startLine[0].index;
}
