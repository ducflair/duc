import { MIN_FONT_SIZE, SHIFT_LOCKING_ANGLE } from "../constants";
import { rescalePoints } from "../points";

import { rotate, centerPoint, rotatePoint } from "../math";
import type {
  DucLinearElement,
  DucTextElement,
  NonDeletedDucElement,
  NonDeleted,
  DucElement,
  DucTextElementWithContainer,
  DucImageElement,
  ElementsMap,
  NonDeletedSceneElementsMap,
  SceneElementsMap,
} from "./types";
import type { Mutable } from "../utility-types";
import {
  getElementAbsoluteCoords,
  getCommonBounds,
  getResizedElementAbsoluteCoords,
  getCommonBoundingBox,
} from "./bounds";
import {
  isArrowElement,
  isBoundToContainer,
  isElbowArrow,
  isFrameLikeElement,
  isFreeDrawElement,
  isImageElement,
  isLinearElement,
  isTextElement,
} from "./typeChecks";
import { mutateElement } from "./mutateElement";
import { getFontString } from "../utils";
import { getArrowLocalFixedPoints, updateBoundElements } from "./binding";
import type {
  MaybeTransformHandleType,
  TransformHandleDirection,
} from "./transformHandles";
import type { Point, PointerDownState } from "../types";
import Scene from "../scene/Scene";
import {
  getApproxMinLineWidth,
  getBoundTextElement,
  getBoundTextElementId,
  getContainerElement,
  handleBindTextResize,
  getBoundTextMaxWidth,
  getApproxMinLineHeight,
  wrapText,
  measureText,
  getMinTextElementWidth,
} from "./textElement";
import { LinearElementEditor } from "./linearElementEditor";
import { isInGroup } from "../groups";
import { mutateElbowArrow } from "./routing";

export const normalizeAngle = (angle: number): number => {
  if (angle < 0) {
    return angle + 2 * Math.PI;
  }
  if (angle >= 2 * Math.PI) {
    return angle - 2 * Math.PI;
  }
  return angle;
};

// Returns true when transform (resizing/rotation) happened
export const transformElements = (
  originalElements: PointerDownState["originalElements"],
  transformHandleType: MaybeTransformHandleType,
  selectedElements: readonly NonDeletedDucElement[],
  elementsMap: SceneElementsMap,
  shouldRotateWithDiscreteAngle: boolean,
  shouldResizeFromCenter: boolean,
  shouldMaintainAspectRatio: boolean,
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number,
) => {
  if (selectedElements.length === 1) {
    const [element] = selectedElements;
    if (transformHandleType === "rotation") {
      if (!isElbowArrow(element)) {
        rotateSingleElement(
          element,
          elementsMap,
          pointerX,
          pointerY,
          shouldRotateWithDiscreteAngle,
        );
        updateBoundElements(element, elementsMap);
      }
    } else if (isTextElement(element) && transformHandleType) {
      resizeSingleTextElement(
        originalElements,
        element,
        elementsMap,
        transformHandleType,
        shouldResizeFromCenter,
        pointerX,
        pointerY,
      );
      updateBoundElements(element, elementsMap);
    } else if (transformHandleType) {
      resizeSingleElement(
        originalElements,
        shouldMaintainAspectRatio,
        element,
        elementsMap,
        transformHandleType,
        shouldResizeFromCenter,
        pointerX,
        pointerY,
      );
    }

    return true;
  } else if (selectedElements.length > 1) {
    if (transformHandleType === "rotation") {
      rotateMultipleElements(
        originalElements,
        selectedElements,
        elementsMap,
        pointerX,
        pointerY,
        shouldRotateWithDiscreteAngle,
        centerX,
        centerY,
      );
      return true;
    } else if (transformHandleType) {
      resizeMultipleElements(
        originalElements,
        selectedElements,
        elementsMap,
        transformHandleType,
        shouldResizeFromCenter,
        shouldMaintainAspectRatio,
        pointerX,
        pointerY,
      );
      return true;
    }
  }
  return false;
};

const rotateSingleElement = (
  element: NonDeletedDucElement,
  elementsMap: ElementsMap,
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean,
) => {
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  let angle: number;
  if (isFrameLikeElement(element)) {
    angle = 0;
  } else {
    angle = (5 * Math.PI) / 2 + Math.atan2(pointerY - cy, pointerX - cx);
    if (shouldRotateWithDiscreteAngle) {
      angle += SHIFT_LOCKING_ANGLE / 2;
      angle -= angle % SHIFT_LOCKING_ANGLE;
    }
    angle = normalizeAngle(angle);
  }
  const boundTextElementId = getBoundTextElementId(element);

  mutateElement(element, { angle });
  if (boundTextElementId) {
    const textElement =
      Scene.getScene(element)?.getElement<DucTextElementWithContainer>(
        boundTextElementId,
      );

    if (textElement && !isArrowElement(element)) {
      mutateElement(textElement, { angle });
    }
  }
};

export const rescalePointsInElement = (
  element: NonDeletedDucElement,
  width: number,
  height: number,
  normalizePoints: boolean,
) =>
  isLinearElement(element) || isFreeDrawElement(element)
    ? {
        points: rescalePoints(
          'x',
          width,
          rescalePoints('y', height, element.points, normalizePoints),
          normalizePoints,
        ),
      }
    : {};

export const measureFontSizeFromWidth = (
  element: NonDeleted<DucTextElement>,
  elementsMap: ElementsMap,
  nextWidth: number,
): { size: number } | null => {
  // We only use width to scale font on resize
  let width = element.width;

  const hasContainer = isBoundToContainer(element);
  if (hasContainer) {
    const container = getContainerElement(element, elementsMap);
    if (container) {
      width = getBoundTextMaxWidth(container, element);
    }
  }
  const nextFontSize = element.fontSize * (nextWidth / width);
  if (nextFontSize < MIN_FONT_SIZE) {
    return null;
  }

  return {
    size: nextFontSize,
  };
};

const resizeSingleTextElement = (
  originalElements: PointerDownState["originalElements"],
  element: NonDeleted<DucTextElement>,
  elementsMap: ElementsMap,
  transformHandleType: TransformHandleDirection,
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number,
) => {
  const [x1, y1, x2, y2, cx, cy] = getElementAbsoluteCoords(
    element,
    elementsMap,
  );
  // rotation pointer with reverse angle
  const {x: rotatedX, y: rotatedY} = rotate(
    pointerX,
    pointerY,
    cx,
    cy,
    -element.angle,
  );
  let scaleX = 0;
  let scaleY = 0;

  if (transformHandleType !== "e" && transformHandleType !== "w") {
    if (transformHandleType.includes("e")) {
      scaleX = (rotatedX - x1) / (x2 - x1);
    }
    if (transformHandleType.includes("w")) {
      scaleX = (x2 - rotatedX) / (x2 - x1);
    }
    if (transformHandleType.includes("n")) {
      scaleY = (y2 - rotatedY) / (y2 - y1);
    }
    if (transformHandleType.includes("s")) {
      scaleY = (rotatedY - y1) / (y2 - y1);
    }
  }

  const scale = Math.max(scaleX, scaleY);

  if (scale > 0) {
    const nextWidth = element.width * scale;
    const nextHeight = element.height * scale;
    const metrics = measureFontSizeFromWidth(element, elementsMap, nextWidth);
    if (metrics === null) {
      return;
    }

    const startTopLeft = {x: x1, y: y1};
    const startBottomRight = {x: x2, y: y2};
    const startCenter = {x: cx, y: cy};

    let newTopLeft = {x: x1, y: y1};
    if (["n", "w", "nw"].includes(transformHandleType)) {
      newTopLeft = {
        x: startBottomRight.x - Math.abs(nextWidth),
        y: startBottomRight.y - Math.abs(nextHeight),
      };
    }
    if (transformHandleType === "ne") {
      const bottomLeft = [startTopLeft.x, startBottomRight.y];
      newTopLeft = {x: bottomLeft[0], y: bottomLeft[1] - Math.abs(nextHeight)};
    }
    if (transformHandleType === "sw") {
      const topRight = [startBottomRight.x, startTopLeft.y];
      newTopLeft = {x: topRight[0] - Math.abs(nextWidth), y: topRight[1]};
    }

    if (["s", "n"].includes(transformHandleType)) {
      newTopLeft.x = startCenter.x - nextWidth / 2;
    }
    if (["e", "w"].includes(transformHandleType)) {
      newTopLeft.y = startCenter.y - nextHeight / 2;
    }

    if (shouldResizeFromCenter) {
      newTopLeft.x = startCenter.x - Math.abs(nextWidth) / 2;
      newTopLeft.y = startCenter.y - Math.abs(nextHeight) / 2;
    }

    const angle = element.angle;
    const rotatedTopLeft = rotatePoint(newTopLeft, {x: cx, y: cy}, angle);
    const newCenter: Point = {
      x: newTopLeft.x + Math.abs(nextWidth) / 2,
      y: newTopLeft.y + Math.abs(nextHeight) / 2,
    };
    const rotatedNewCenter = rotatePoint(newCenter, {x: cx, y: cy}, angle);
    newTopLeft = rotatePoint(rotatedTopLeft, rotatedNewCenter, -angle);
    const {x: nextX, y: nextY} = newTopLeft;

    mutateElement(element, {
      fontSize: metrics.size,
      width: nextWidth,
      height: nextHeight,
      x: nextX,
      y: nextY,
    });
  }

  if (transformHandleType === "e" || transformHandleType === "w") {
    const stateAtResizeStart = originalElements.get(element.id)!;
    const [x1, y1, x2, y2] = getResizedElementAbsoluteCoords(
      stateAtResizeStart,
      stateAtResizeStart.width,
      stateAtResizeStart.height,
      true,
    );
    const startTopLeft: Point = {x: x1, y: y1};
    const startBottomRight: Point = {x: x2, y: y2};
    const startCenter: Point = centerPoint(startTopLeft, startBottomRight);

    const rotatedPointer = rotatePoint(
      {x: pointerX, y: pointerY},
      startCenter,
      -stateAtResizeStart.angle,
    );

    const [esx1, , esx2] = getResizedElementAbsoluteCoords(
      element,
      element.width,
      element.height,
      true,
    );

    const boundsCurrentWidth = esx2 - esx1;

    const atStartBoundsWidth = startBottomRight.x - startTopLeft.x;
    const minWidth = getMinTextElementWidth(
      getFontString({
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
      }),
      element.lineHeight,
    );

    let scaleX = atStartBoundsWidth / boundsCurrentWidth;

    if (transformHandleType.includes("e")) {
      scaleX = (rotatedPointer.x - startTopLeft.x) / boundsCurrentWidth;
    }
    if (transformHandleType.includes("w")) {
      scaleX = (startBottomRight.x - rotatedPointer.x) / boundsCurrentWidth;
    }

    const newWidth =
      element.width * scaleX < minWidth ? minWidth : element.width * scaleX;

    const text = wrapText(
      element.originalText,
      getFontString(element),
      Math.abs(newWidth),
    );
    const metrics = measureText(
      text,
      getFontString(element),
      element.lineHeight,
    );

    const eleNewHeight = metrics.height;

    const [newBoundsX1, newBoundsY1, newBoundsX2, newBoundsY2] =
      getResizedElementAbsoluteCoords(
        stateAtResizeStart,
        newWidth,
        eleNewHeight,
        true,
      );
    const newBoundsWidth = newBoundsX2 - newBoundsX1;
    const newBoundsHeight = newBoundsY2 - newBoundsY1;

    let newTopLeft = startTopLeft;
    if (["n", "w", "nw"].includes(transformHandleType)) {
      newTopLeft = {
        x: startBottomRight.x - Math.abs(newBoundsWidth),
        y: startTopLeft.y,
      };
    }

    // adjust topLeft to new rotation point
    const angle = stateAtResizeStart.angle;
    const rotatedTopLeft = rotatePoint(newTopLeft, startCenter, angle);
    const newCenter: Point = {
      x: newTopLeft.x + Math.abs(newBoundsWidth) / 2,
      y: newTopLeft.y + Math.abs(newBoundsHeight) / 2,
    };
    const rotatedNewCenter = rotatePoint(newCenter, startCenter, angle);
    newTopLeft = rotatePoint(rotatedTopLeft, rotatedNewCenter, -angle);

    const resizedElement: Partial<DucTextElement> = {
      width: Math.abs(newWidth),
      height: Math.abs(metrics.height),
      x: newTopLeft.x,
      y: newTopLeft.y,
      text,
      autoResize: false,
    };

    mutateElement(element, resizedElement);
  }
};

export const resizeSingleElement = (
  originalElements: PointerDownState["originalElements"],
  shouldMaintainAspectRatio: boolean,
  element: NonDeletedDucElement,
  elementsMap: SceneElementsMap,
  transformHandleDirection: TransformHandleDirection,
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number,
) => {
  const stateAtResizeStart = originalElements.get(element.id)!;
  // Gets bounds corners
  const [x1, y1, x2, y2] = getResizedElementAbsoluteCoords(
    stateAtResizeStart,
    stateAtResizeStart.width,
    stateAtResizeStart.height,
    true,
  );
  const startTopLeft: Point = {x: x1, y: y1};
  const startBottomRight: Point = {x: x2, y: y2};
  const startCenter: Point = centerPoint(startTopLeft, startBottomRight);

  // Calculate new dimensions based on cursor position
  const rotatedPointer = rotatePoint(
    {x: pointerX, y: pointerY},
    startCenter,
    -stateAtResizeStart.angle,
  );

  // Get bounds corners rendered on screen
  const [esx1, esy1, esx2, esy2] = getResizedElementAbsoluteCoords(
    element,
    element.width,
    element.height,
    true,
  );

  const boundsCurrentWidth = esx2 - esx1;
  const boundsCurrentHeight = esy2 - esy1;

  // It's important we set the initial scale value based on the width and height at resize start,
  // otherwise previous dimensions affected by modifiers will be taken into account.
  const atStartBoundsWidth = startBottomRight.x - startTopLeft.x;
  const atStartBoundsHeight = startBottomRight.y - startTopLeft.y;
  let scaleX = atStartBoundsWidth / boundsCurrentWidth;
  let scaleY = atStartBoundsHeight / boundsCurrentHeight;

  let boundTextFont: { fontSize?: number } = {};
  const boundTextElement = getBoundTextElement(element, elementsMap);

  if (transformHandleDirection.includes("e")) {
    scaleX = (rotatedPointer.x - startTopLeft.x) / boundsCurrentWidth;
  }
  if (transformHandleDirection.includes("s")) {
    scaleY = (rotatedPointer.y - startTopLeft.y) / boundsCurrentHeight;
  }
  if (transformHandleDirection.includes("w")) {
    scaleX = (startBottomRight.x - rotatedPointer.x) / boundsCurrentWidth;
  }
  if (transformHandleDirection.includes("n")) {
    scaleY = (startBottomRight.y - rotatedPointer.y) / boundsCurrentHeight;
  }

  // Linear elements dimensions differ from bounds dimensions
  const eleInitialWidth = stateAtResizeStart.width;
  const eleInitialHeight = stateAtResizeStart.height;
  // We have to use dimensions of element on screen, otherwise the scaling of the
  // dimensions won't match the cursor for linear elements.
  let eleNewWidth = element.width * scaleX;
  let eleNewHeight = element.height * scaleY;

  // adjust dimensions for resizing from center
  if (shouldResizeFromCenter) {
    eleNewWidth = 2 * eleNewWidth - eleInitialWidth;
    eleNewHeight = 2 * eleNewHeight - eleInitialHeight;
  }

  // adjust dimensions to keep sides ratio
  if (shouldMaintainAspectRatio) {
    const widthRatio = Math.abs(eleNewWidth) / eleInitialWidth;
    const heightRatio = Math.abs(eleNewHeight) / eleInitialHeight;
    if (transformHandleDirection.length === 1) {
      eleNewHeight *= widthRatio;
      eleNewWidth *= heightRatio;
    }
    if (transformHandleDirection.length === 2) {
      const ratio = Math.max(widthRatio, heightRatio);
      eleNewWidth = eleInitialWidth * ratio * Math.sign(eleNewWidth);
      eleNewHeight = eleInitialHeight * ratio * Math.sign(eleNewHeight);
    }
  }

  if (boundTextElement) {
    const stateOfBoundTextElementAtResize = originalElements.get(
      boundTextElement.id,
    ) as typeof boundTextElement | undefined;
    if (stateOfBoundTextElementAtResize) {
      boundTextFont = {
        fontSize: stateOfBoundTextElementAtResize.fontSize,
      };
    }
    if (shouldMaintainAspectRatio) {
      const updatedElement = {
        ...element,
        width: eleNewWidth,
        height: eleNewHeight,
      };

      const nextFont = measureFontSizeFromWidth(
        boundTextElement,
        elementsMap,
        getBoundTextMaxWidth(updatedElement, boundTextElement),
      );
      if (nextFont === null) {
        return;
      }
      boundTextFont = {
        fontSize: nextFont.size,
      };
    } else {
      const minWidth = getApproxMinLineWidth(
        getFontString(boundTextElement),
        boundTextElement.lineHeight,
      );
      const minHeight = getApproxMinLineHeight(
        boundTextElement.fontSize,
        boundTextElement.lineHeight,
      );
      eleNewWidth = Math.max(eleNewWidth, minWidth);
      eleNewHeight = Math.max(eleNewHeight, minHeight);
    }
  }

  const [newBoundsX1, newBoundsY1, newBoundsX2, newBoundsY2] =
    getResizedElementAbsoluteCoords(
      stateAtResizeStart,
      eleNewWidth,
      eleNewHeight,
      true,
    );
  const newBoundsWidth = newBoundsX2 - newBoundsX1;
  const newBoundsHeight = newBoundsY2 - newBoundsY1;

  // Calculate new topLeft based on fixed corner during resize
  let newTopLeft = startTopLeft;
  if (["n", "w", "nw"].includes(transformHandleDirection)) {
    newTopLeft = {
      x: startBottomRight.x - Math.abs(newBoundsWidth),
      y: startBottomRight.y - Math.abs(newBoundsHeight),
    };
  }
  if (transformHandleDirection === "ne") {
    const bottomLeft = [startTopLeft.x, startBottomRight.y];
    newTopLeft = {x: bottomLeft[0], y: bottomLeft[1] - Math.abs(newBoundsHeight)};
  }
  if (transformHandleDirection === "sw") {
    const topRight = [startBottomRight.x, startTopLeft.y];
    newTopLeft = {x: topRight[0] - Math.abs(newBoundsWidth), y: topRight[1]};
  }

  // Keeps opposite handle fixed during resize
  if (shouldMaintainAspectRatio) {
    if (["s", "n"].includes(transformHandleDirection)) {
      newTopLeft.x = startCenter.x - newBoundsWidth / 2;
    }
    if (["e", "w"].includes(transformHandleDirection)) {
      newTopLeft.y = startCenter.y - newBoundsHeight / 2;
    }
  }

  const flipX = eleNewWidth < 0;
  const flipY = eleNewHeight < 0;

  // Flip horizontally
  if (flipX) {
    if (transformHandleDirection.includes("e")) {
      newTopLeft.x -= Math.abs(newBoundsWidth);
    }
    if (transformHandleDirection.includes("w")) {
      newTopLeft.x += Math.abs(newBoundsWidth);
    }
  }

  // Flip vertically
  if (flipY) {
    if (transformHandleDirection.includes("s")) {
      newTopLeft.y -= Math.abs(newBoundsHeight);
    }
    if (transformHandleDirection.includes("n")) {
      newTopLeft.y += Math.abs(newBoundsHeight);
    }
  }

  if (shouldResizeFromCenter) {
    newTopLeft.x = startCenter.x - Math.abs(newBoundsWidth) / 2;
    newTopLeft.y = startCenter.y - Math.abs(newBoundsHeight) / 2;
  }

  // adjust topLeft to new rotation point
  const angle = stateAtResizeStart.angle;
  const rotatedTopLeft = rotatePoint(newTopLeft, startCenter, angle);
  const newCenter: Point = {
    x: newTopLeft.x + Math.abs(newBoundsWidth) / 2,
    y: newTopLeft.y + Math.abs(newBoundsHeight) / 2,
  };
  const rotatedNewCenter = rotatePoint(newCenter, startCenter, angle);
  newTopLeft = rotatePoint(rotatedTopLeft, rotatedNewCenter, -angle);

  // For linear elements (x,y) are the coordinates of the first drawn point not the top-left corner
  // So we need to readjust (x,y) to be where the first point should be
  const newOrigin = newTopLeft;
  const linearElementXOffset = stateAtResizeStart.x - newBoundsX1;
  const linearElementYOffset = stateAtResizeStart.y - newBoundsY1;
  newOrigin.x += linearElementXOffset;
  newOrigin.y += linearElementYOffset;

  const nextX = newOrigin.x;
  const nextY = newOrigin.y;

  // Readjust points for linear elements
  let rescaledElementPointsY;
  let rescaledPoints;
  if (isLinearElement(element) || isFreeDrawElement(element)) {
    rescaledElementPointsY = rescalePoints(
      'y',
      eleNewHeight,
      (stateAtResizeStart as DucLinearElement).points,
      true,
    );

    rescaledPoints = rescalePoints(
      'x',
      eleNewWidth,
      rescaledElementPointsY,
      true,
    );
  }

  const resizedElement = {
    width: Math.abs(eleNewWidth),
    height: Math.abs(eleNewHeight),
    x: nextX,
    y: nextY,
    points: rescaledPoints,
  };

  if ("scale" in element && "scale" in stateAtResizeStart) {
    mutateElement(element, {
      scale: [
        // defaulting because scaleX/Y can be 0/-0
        (Math.sign(newBoundsX2 - stateAtResizeStart.x) ||
          stateAtResizeStart.scale[0]) * stateAtResizeStart.scale[0],
        (Math.sign(newBoundsY2 - stateAtResizeStart.y) ||
          stateAtResizeStart.scale[1]) * stateAtResizeStart.scale[1],
      ],
    });
  }

  if (
    isArrowElement(element) &&
    boundTextElement &&
    shouldMaintainAspectRatio
  ) {
    const fontSize =
      (resizedElement.width / element.width) * boundTextElement.fontSize;
    if (fontSize < MIN_FONT_SIZE) {
      return;
    }
    boundTextFont.fontSize = fontSize;
  }

  if (
    resizedElement.width !== 0 &&
    resizedElement.height !== 0 &&
    Number.isFinite(resizedElement.x) &&
    Number.isFinite(resizedElement.y)
  ) {
    mutateElement(element, resizedElement);

    updateBoundElements(element, elementsMap, {
      oldSize: {
        width: stateAtResizeStart.width,
        height: stateAtResizeStart.height,
      },
    });

    if (boundTextElement && boundTextFont != null) {
      mutateElement(boundTextElement, {
        fontSize: boundTextFont.fontSize,
      });
    }
    handleBindTextResize(
      element,
      elementsMap,
      transformHandleDirection,
      shouldMaintainAspectRatio,
    );
  }
};

export const resizeMultipleElements = (
  originalElements: PointerDownState["originalElements"],
  selectedElements: readonly NonDeletedDucElement[],
  elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  transformHandleType: TransformHandleDirection,
  shouldResizeFromCenter: boolean,
  shouldMaintainAspectRatio: boolean,
  pointerX: number,
  pointerY: number,
) => {
  // map selected elements to the original elements. While it never should
  // happen that pointerDownState.originalElements won't contain the selected
  // elements during resize, this coupling isn't guaranteed, so to ensure
  // type safety we need to transform only those elements we filter.
  const targetElements = selectedElements.reduce(
    (
      acc: {
        /** element at resize start */
        orig: NonDeletedDucElement;
        /** latest element */
        latest: NonDeletedDucElement;
      }[],
      element,
    ) => {
      const origElement = originalElements.get(element.id);
      if (origElement) {
        acc.push({ orig: origElement, latest: element });
      }
      return acc;
    },
    [],
  );

  // getCommonBoundingBox() uses getBoundTextElement() which returns null for
  // original elements from pointerDownState, so we have to find and add these
  // bound text elements manually. Additionally, the coordinates of bound text
  // elements aren't always up to date.
  const boundTextElements = targetElements.reduce((acc, { orig }) => {
    if (!isLinearElement(orig)) {
      return acc;
    }
    const textId = getBoundTextElementId(orig);
    if (!textId) {
      return acc;
    }
    const text = originalElements.get(textId) ?? null;
    if (!isBoundToContainer(text)) {
      return acc;
    }
    const xy = LinearElementEditor.getBoundTextElementPosition(
      orig,
      text,
      elementsMap,
    );
    return [...acc, { ...text, ...xy }];
  }, [] as DucTextElementWithContainer[]);

  const { minX, minY, maxX, maxY, midX, midY } = getCommonBoundingBox(
    targetElements.map(({ orig }) => orig).concat(boundTextElements),
  );
  const width = maxX - minX;
  const height = maxY - minY;

  const direction = transformHandleType;

  const anchorsMap: Record<TransformHandleDirection, Point> = {
    ne: {x: minX, y: maxY},
    se: {x: minX, y: minY},
    sw: {x: maxX, y: minY},
    nw: {x: maxX, y: maxY},
    e: {x: minX, y: minY + height / 2},
    w: {x: maxX, y: minY + height / 2},
    n: {x: minX + width / 2, y: maxY},
    s: {x: minX + width / 2, y: minY},
  };

  // anchor point must be on the opposite side of the dragged selection handle
  // or be the center of the selection if shouldResizeFromCenter
  const {x: anchorX, y: anchorY}: Point = shouldResizeFromCenter
    ? {x: midX, y: midY}
    : anchorsMap[direction];

  const resizeFromCenterScale = shouldResizeFromCenter ? 2 : 1;

  const scale =
    Math.max(
      Math.abs(pointerX - anchorX) / width || 0,
      Math.abs(pointerY - anchorY) / height || 0,
    ) * resizeFromCenterScale;

  if (scale === 0) {
    return;
  }

  let scaleX =
    direction.includes("e") || direction.includes("w")
      ? (Math.abs(pointerX - anchorX) / width) * resizeFromCenterScale
      : 1;
  let scaleY =
    direction.includes("n") || direction.includes("s")
      ? (Math.abs(pointerY - anchorY) / height) * resizeFromCenterScale
      : 1;

  const keepAspectRatio =
    shouldMaintainAspectRatio ||
    targetElements.some(
      (item) =>
        item.latest.angle !== 0 ||
        isTextElement(item.latest) ||
        isInGroup(item.latest),
    );

  if (keepAspectRatio) {
    scaleX = scale;
    scaleY = scale;
  }

  const flipConditionsMap: Record<
    TransformHandleDirection,
    // Condition for which we should flip or not flip the selected elements
    // - when evaluated to `true`, we flip
    // - therefore, setting it to always `false` means we do not flip (in that direction) at all
    [x: boolean, y: boolean]
  > = {
    ne: [pointerX < anchorX, pointerY > anchorY],
    se: [pointerX < anchorX, pointerY < anchorY],
    sw: [pointerX > anchorX, pointerY < anchorY],
    nw: [pointerX > anchorX, pointerY > anchorY],
    // e.g. when resizing from the "e" side, we do not need to consider changes in the `y` direction
    //      and therefore, we do not need to flip in the `y` direction at all
    e: [pointerX < anchorX, false],
    w: [pointerX > anchorX, false],
    n: [false, pointerY > anchorY],
    s: [false, pointerY < anchorY],
  };

  /**
   * to flip an element:
   * 1. determine over which axis is the element being flipped
   *    (could be x, y, or both) indicated by `flipFactorX` & `flipFactorY`
   * 2. shift element's position by the amount of width or height (or both) or
   *    mirror points in the case of linear & freedraw elemenets
   * 3. adjust element angle
   */
  const [flipFactorX, flipFactorY] = flipConditionsMap[direction].map(
    (condition) => (condition ? -1 : 1),
  );
  const isFlippedByX = flipFactorX < 0;
  const isFlippedByY = flipFactorY < 0;

  const elementsAndUpdates: {
    element: NonDeletedDucElement;
    update: Mutable<
      Pick<DucElement, "x" | "y" | "width" | "height" | "angle">
    > & {
      points?: DucLinearElement["points"];
      fontSize?: DucTextElement["fontSize"];
      scale?: DucImageElement["scale"];
      boundTextFontSize?: DucTextElement["fontSize"];
    };
  }[] = [];

  for (const { orig, latest } of targetElements) {
    // bounded text elements are updated along with their container elements
    if (isTextElement(orig) && isBoundToContainer(orig)) {
      continue;
    }

    const width = orig.width * scaleX;
    const height = orig.height * scaleY;
    const angle = normalizeAngle(orig.angle * flipFactorX * flipFactorY);

    const isLinearOrFreeDraw = isLinearElement(orig) || isFreeDrawElement(orig);
    const offsetX = orig.x - anchorX;
    const offsetY = orig.y - anchorY;
    const shiftX = isFlippedByX && !isLinearOrFreeDraw ? width : 0;
    const shiftY = isFlippedByY && !isLinearOrFreeDraw ? height : 0;
    const x = anchorX + flipFactorX * (offsetX * scaleX + shiftX);
    const y = anchorY + flipFactorY * (offsetY * scaleY + shiftY);

    const rescaledPoints = rescalePointsInElement(
      orig,
      width * flipFactorX,
      height * flipFactorY,
      false,
    );

    const update: typeof elementsAndUpdates[0]["update"] = {
      x,
      y,
      width,
      height,
      angle,
      ...rescaledPoints,
    };

    if (isImageElement(orig)) {
      update.scale = [orig.scale[0] * flipFactorX, orig.scale[1] * flipFactorY];
    }

    if (isTextElement(orig)) {
      const metrics = measureFontSizeFromWidth(orig, elementsMap, width);
      if (!metrics) {
        return;
      }
      update.fontSize = metrics.size;
    }

    const boundTextElement = originalElements.get(
      getBoundTextElementId(orig) ?? "",
    ) as DucTextElementWithContainer | undefined;

    if (boundTextElement) {
      if (keepAspectRatio) {
        const newFontSize = boundTextElement.fontSize * scale;
        if (newFontSize < MIN_FONT_SIZE) {
          return;
        }
        update.boundTextFontSize = newFontSize;
      } else {
        update.boundTextFontSize = boundTextElement.fontSize;
      }
    }

    elementsAndUpdates.push({
      element: latest,
      update,
    });
  }

  const elementsToUpdate = elementsAndUpdates.map(({ element }) => element);

  for (const {
    element,
    update: { boundTextFontSize, ...update },
  } of elementsAndUpdates) {
    const { angle } = update;
    const { width: oldWidth, height: oldHeight } = element;

    mutateElement(element, update, false);

    if (isArrowElement(element) && isElbowArrow(element)) {
      mutateElbowArrow(
        element,
        elementsMap,
        element.points,
        undefined,
        undefined,
        {
          informMutation: false,
        },
      );
    }

    updateBoundElements(element, elementsMap, {
      simultaneouslyUpdated: elementsToUpdate,
      oldSize: { width: oldWidth, height: oldHeight },
    });

    const boundTextElement = getBoundTextElement(element, elementsMap);
    if (boundTextElement && boundTextFontSize) {
      mutateElement(
        boundTextElement,
        {
          fontSize: boundTextFontSize,
          angle: isLinearElement(element) ? undefined : angle,
        },
        false,
      );
      handleBindTextResize(element, elementsMap, transformHandleType, true);
    }
  }

  Scene.getScene(elementsAndUpdates[0].element)?.triggerUpdate();
};

const rotateMultipleElements = (
  originalElements: PointerDownState["originalElements"],
  elements: readonly NonDeletedDucElement[],
  elementsMap: SceneElementsMap,
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean,
  centerX: number,
  centerY: number,
) => {
  let centerAngle =
    (5 * Math.PI) / 2 + Math.atan2(pointerY - centerY, pointerX - centerX);
  if (shouldRotateWithDiscreteAngle) {
    centerAngle += SHIFT_LOCKING_ANGLE / 2;
    centerAngle -= centerAngle % SHIFT_LOCKING_ANGLE;
  }

  elements
    .filter((element) => !isFrameLikeElement(element))
    .forEach((element) => {
      const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const origAngle =
        originalElements.get(element.id)?.angle ?? element.angle;
      const {x: rotatedCX, y: rotatedCY} = rotate(
        cx,
        cy,
        centerX,
        centerY,
        centerAngle + origAngle - element.angle,
      );

      if (isArrowElement(element) && isElbowArrow(element)) {
        const points = getArrowLocalFixedPoints(element, elementsMap);
        mutateElbowArrow(element, elementsMap, points);
      } else {
        mutateElement(
          element,
          {
            x: element.x + (rotatedCX - cx),
            y: element.y + (rotatedCY - cy),
            angle: normalizeAngle(centerAngle + origAngle),
          },
          false,
        );
      }

      updateBoundElements(element, elementsMap, {
        simultaneouslyUpdated: elements,
      });

      const boundText = getBoundTextElement(element, elementsMap);
      if (boundText && !isArrowElement(element)) {
        mutateElement(
          boundText,
          {
            x: boundText.x + (rotatedCX - cx),
            y: boundText.y + (rotatedCY - cy),
            angle: normalizeAngle(centerAngle + origAngle),
          },
          false,
        );
      }
    });

  Scene.getScene(elements[0])?.triggerUpdate();
};

export const getResizeOffsetXY = (
  transformHandleType: MaybeTransformHandleType,
  selectedElements: NonDeletedDucElement[],
  elementsMap: ElementsMap,
  x: number,
  y: number,
): Point => {
  const [x1, y1, x2, y2] =
    selectedElements.length === 1
      ? getElementAbsoluteCoords(selectedElements[0], elementsMap)
      : getCommonBounds(selectedElements);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const angle = selectedElements.length === 1 ? selectedElements[0].angle : 0;
  
  const rotatePoint = rotate(x, y, cx, cy, -angle);
  x = rotatePoint.x;
  y = rotatePoint.y;

  switch (transformHandleType) {
    case "n":
      return rotate(x - (x1 + x2) / 2, y - y1, 0, 0, angle);
    case "s":
      return rotate(x - (x1 + x2) / 2, y - y2, 0, 0, angle);
    case "w":
      return rotate(x - x1, y - (y1 + y2) / 2, 0, 0, angle);
    case "e":
      return rotate(x - x2, y - (y1 + y2) / 2, 0, 0, angle);
    case "nw":
      return rotate(x - x1, y - y1, 0, 0, angle);
    case "ne":
      return rotate(x - x2, y - y1, 0, 0, angle);
    case "sw":
      return rotate(x - x1, y - y2, 0, 0, angle);
    case "se":
      return rotate(x - x2, y - y2, 0, 0, angle);
    default:
      return {x: 0, y: 0};
  }
};

export const getResizeArrowDirection = (
  transformHandleType: MaybeTransformHandleType,
  element: NonDeleted<DucLinearElement>,
): "origin" | "end" => {
  const [, {x: px, y: py}] = element.points;
  const isResizeEnd =
    (transformHandleType === "nw" && (px < 0 || py < 0)) ||
    (transformHandleType === "ne" && px >= 0) ||
    (transformHandleType === "sw" && px <= 0) ||
    (transformHandleType === "se" && (px > 0 || py > 0));
  return isResizeEnd ? "end" : "origin";
};
