import { DucElement, DucElementsIncludingDeleted, DucFrameLikeElement, ElementsMap } from "../../types/elements";
import { isFrameElement, isFrameLikeElement, isPlotElement } from "../../types/elements/typeChecks";

export const getContainingFrame = (
  element: DucElement,
  elementsMap: ElementsMap,
) => {
  if (!element.frameId) {
    return null;
  }
  return (elementsMap.get(element.frameId) ||
    null) as null | DucFrameLikeElement;
};


export const getFrameLikeElements = (
  allElements: DucElementsIncludingDeleted,
): DucFrameLikeElement[] => {
  return allElements.filter((element): element is DucFrameLikeElement =>
    isFrameLikeElement(element),
  );
};

export const canFrameLikeContainElement = (
  frame: DucFrameLikeElement,
  element: DucElement,
) => {
  if (frame.id === element.id) {
    return false;
  }

  if (isPlotElement(element)) {
    return false;
  }

  if (isFrameElement(element)) {
    return frame.type === "plot";
  }

  return true;
};


export const getFrameLikeTitle = (element: DucFrameLikeElement) => {
  return element.label === null
    ? "Frame"
    : element.label;
};
