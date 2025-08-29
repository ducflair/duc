import { DucElement, DucElementsIncludingDeleted, DucFrameLikeElement, ElementsMap } from "../../types/elements";
import { isFrameLikeElement } from "../../types/elements/typeChecks";

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


export const getFrameLikeTitle = (element: DucFrameLikeElement) => {
  return element.label === null
    ? "Frame"
    : element.label;
};
