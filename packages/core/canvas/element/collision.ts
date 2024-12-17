import { isPathALoop, isPointWithinBounds } from "../math";

import type {
  ElementsMap,
  DucElement,
  DucRectangleElement,
} from "./types";

import { getElementBounds, getElementLineSegments } from "./bounds";
import type { FrameNameBounds, Point } from "../types";
import type { Polygon, GeometricShape } from "../../utils/geometry/shape";
import { getPolygonShape } from "../../utils/geometry/shape";
import { isPointInShape, isPointOnShape } from "../../utils/collision";
import { isTransparent } from "../utils";
import {
  hasBoundTextElement,
  isIframeLikeElement,
  isImageElement,
  isLinearElement,
  isTextElement,
} from "./typeChecks";
import { getBoundTextShape } from "../shapes";

export const shouldTestInside = (element: DucElement) => {
  if (element.type === "arrow") {
    return false;
  }

  const isDraggableFromInside =
    !isTransparent(element.backgroundColor) ||
    hasBoundTextElement(element) ||
    isIframeLikeElement(element) ||
    isTextElement(element);

  if (element.type === "line") {
    return isDraggableFromInside && isPathALoop(element.points);
  }

  if (element.type === "freedraw") {
    return isDraggableFromInside && isPathALoop(element.points);
  }

  return isDraggableFromInside || isImageElement(element);
};

export type HitTestArgs = {
  x: number;
  y: number;
  element: DucElement;
  shape: GeometricShape;
  elementsMap: ElementsMap;
  threshold?: number;
  frameNameBound?: FrameNameBounds | null;
};

export const hitElementItself = ({
  x,
  y,
  element,
  shape,
  elementsMap,
  threshold = 10,
  frameNameBound = null,
}: HitTestArgs) => {
  let hit = false;
  
  if (isLinearElement(element) && element.points.some(p => p.handleIn || p.handleOut)) {
    // For curved elements, we need to handle both the stroke and potential fill
    const segments = getElementLineSegments(element, elementsMap);
    
    // First check if we hit the stroke
    hit = segments.some(([p1, p2]) => 
      distanceToLineSegment({x, y}, p1, p2) <= threshold
    );

    // If we didn't hit the stroke and the path is a loop, check if we're inside
    if (!hit && shouldTestInside(element)) {
      // Convert segments to a polygon shape for inside testing
      const polygonPoints = segments.map(([p]) => p);
      // Add the last point to close the polygon
      polygonPoints.push(segments[segments.length - 1][1]);
      
      hit = isPointInShape({x, y}, {
        type: "polygon",
        data: polygonPoints,
      });
    }
  } else {
    hit = shouldTestInside(element)
      ? isPointInShape({x, y}, shape) || isPointOnShape({x, y}, shape, threshold)
      : isPointOnShape({x, y}, shape, threshold);
  }

  if (!hit && frameNameBound) {
    hit = isPointInShape({x, y}, {
      type: "polygon",
      data: getPolygonShape(frameNameBound as DucRectangleElement)
        .data as Polygon,
    });
  }

  return hit;
};

function distanceToLineSegment(point: Point, start: Point, end: Point): number {
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

export const hitElementBoundingBox = (
  x: number,
  y: number,
  element: DucElement,
  elementsMap: ElementsMap,
  tolerance = 0,
) => {
  let [x1, y1, x2, y2] = getElementBounds(element, elementsMap);
  x1 -= tolerance;
  y1 -= tolerance;
  x2 += tolerance;
  y2 += tolerance;
  return isPointWithinBounds({x:x1, y:y1}, {x, y}, {x:x2, y:y2});
};

export const hitElementBoundingBoxOnly = (
  hitArgs: HitTestArgs,
  elementsMap: ElementsMap,
) => {
  return (
    !hitElementItself(hitArgs) &&
    // bound text is considered part of the element (even if it's outside the bounding box)
    !hitElementBoundText(
      hitArgs.x,
      hitArgs.y,
      getBoundTextShape(hitArgs.element, elementsMap),
    ) &&
    hitElementBoundingBox(hitArgs.x, hitArgs.y, hitArgs.element, elementsMap)
  );
};

export const hitElementBoundText = (
  x: number,
  y: number,
  textShape: GeometricShape | null,
): boolean => {
  return !!textShape && isPointInShape({x, y}, textShape);
};
