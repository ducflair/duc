import { isPathALoop, isPointWithinBounds } from "../math";

import type {
  ElementsMap,
  DucElement,
  DucRectangleElement,
} from "./types";

import { getElementBounds } from "./bounds";
import type { FrameNameBounds } from "../types";
import type { Polygon, GeometricShape } from "../../utils/geometry/shape";
import { getPolygonShape } from "../../utils/geometry/shape";
import { isPointInShape, isPointOnShape } from "../../utils/collision";
import { isTransparent } from "../utils";
import {
  hasBoundTextElement,
  isIframeLikeElement,
  isImageElement,
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
  threshold?: number;
  frameNameBound?: FrameNameBounds | null;
};

export const hitElementItself = ({
  x,
  y,
  element,
  shape,
  threshold = 10,
  frameNameBound = null,
}: HitTestArgs) => {
  let hit = shouldTestInside(element)
    ? // Since `inShape` tests STRICTLY againt the insides of a shape
      // we would need `onShape` as well to include the "borders"
      isPointInShape([x, y], shape) || isPointOnShape([x, y], shape, threshold)
    : isPointOnShape([x, y], shape, threshold);

  // hit test against a frame's name
  if (!hit && frameNameBound) {
    hit = isPointInShape([x, y], {
      type: "polygon",
      data: getPolygonShape(frameNameBound as DucRectangleElement)
        .data as Polygon,
    });
  }

  return hit;
};

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
  return isPointWithinBounds([x1, y1], [x, y], [x2, y2]);
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
  return !!textShape && isPointInShape([x, y], textShape);
};
