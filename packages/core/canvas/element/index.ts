import {
  DucElement,
  NonDeletedDucElement,
  NonDeleted,
} from "./types";
import { isInvisiblySmallElement } from "./sizeHelpers";
import { isLinearElementType } from "./typeChecks";

export {
  newElement,
  newTextElement,
  updateTextElement,
  refreshTextDimensions,
  newLinearElement,
  newImageElement,
  duplicateElement,
} from "./newElement";
export {
  getElementAbsoluteCoords,
  getElementBounds,
  getCommonBounds,
  getDiamondPoints,
  getArrowheadPoints,
  getClosestElementBounds,
} from "./bounds";

export {
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS,
  getTransformHandlesFromCoords,
  getTransformHandles,
} from "./transformHandles";

export {
  resizeTest,
  getCursorForResizingElement,
  getElementWithTransformHandleType,
  getTransformHandleTypeFromCoords,
} from "./resizeTest";
export {
  transformElements,
  getResizeOffsetXY,
  getResizeArrowDirection,
} from "./resizeElements";
export {
  dragSelectedElements,
  getDragOffsetXY,
  dragNewElement,
} from "./dragElements";
export { isTextElement, isDucElement } from "./typeChecks";
export { redrawTextBoundingBox, getTextFromElements } from "./textElement";
export {
  getPerfectElementSize,
  getLockedLinearCursorAlignSize,
  isInvisiblySmallElement,
  resizePerfectLineForNWHandler,
  getNormalizedDimensions,
} from "./sizeHelpers";
export { showSelectedShapeActions } from "./showSelectedShapeActions";

/**
 * @deprecated unsafe, use hashElementsVersion instead
 */
export const getSceneVersion = (elements: readonly DucElement[]) =>
  elements.reduce((acc, el) => acc + el.version, 0);

/**
 * Hashes elements' versionNonce (using djb2 algo). Order of elements matters.
 */
export const hashElementsVersion = (
  elements: readonly DucElement[],
): number => {
  let hash = 5381;
  for (let i = 0; i < elements.length; i++) {
    hash = (hash << 5) + hash + elements[i].versionNonce;
  }
  return hash >>> 0; // Ensure unsigned 32-bit integer
};

// string hash function (using djb2). Not cryptographically secure, use only
// for versioning and such.
export const hashString = (s: string): number => {
  let hash: number = 5381;
  for (let i = 0; i < s.length; i++) {
    const char: number = s.charCodeAt(i);
    hash = (hash << 5) + hash + char;
  }
  return hash >>> 0; // Ensure unsigned 32-bit integer
};

export const getVisibleElements = (elements: readonly DucElement[]) =>
  elements.filter(
    (el) => !el.isDeleted && !isInvisiblySmallElement(el),
  ) as readonly NonDeletedDucElement[];

export const getNonDeletedElements = <T extends DucElement>(
  elements: readonly T[],
) =>
  elements.filter((element) => !element.isDeleted) as readonly NonDeleted<T>[];

export const isNonDeletedElement = <T extends DucElement>(
  element: T,
): element is NonDeleted<T> => !element.isDeleted;

const _clearElements = (
  elements: readonly DucElement[],
): DucElement[] =>
  getNonDeletedElements(elements).map((element) =>
    isLinearElementType(element.type)
      ? { ...element, lastCommittedPoint: null }
      : element,
  );

export const clearElementsForDatabase = (
  elements: readonly DucElement[],
) => _clearElements(elements);

export const clearElementsForExport = (
  elements: readonly DucElement[],
) => _clearElements(elements);

export const clearElementsForLocalStorage = (
  elements: readonly DucElement[],
) => _clearElements(elements);
