import type {
  ElementsMap,
  ElementsMapOrArray,
  DucElement,
  NonDeletedDucElement,
} from "../element/types";
import { getElementAbsoluteCoords, getElementBounds } from "../element";
import type { AppState, InteractiveCanvasAppState } from "../types";
import { isBoundToContainer, isFrameLikeElement } from "../element/typeChecks";
import {
  elementOverlapsWithFrame,
  getContainingFrame,
  getFrameChildren,
} from "../frame";
import { isShallowEqual } from "../utils";
import { isElementInViewport } from "../element/sizeHelpers";

/**
 * Frames and their containing elements are not to be selected at the same time.
 * Given an array of selected elements, if there are frames and their containing elements
 * we only keep the frames.
 * @param selectedElements
 */
export const excludeElementsInFramesFromSelection = <
  T extends DucElement,
>(
  selectedElements: readonly T[],
) => {
  const framesInSelection = new Set<T["id"]>();

  selectedElements.forEach((element) => {
    if (isFrameLikeElement(element)) {
      framesInSelection.add(element.id);
    }
  });

  return selectedElements.filter((element) => {
    if (element.frameId && framesInSelection.has(element.frameId)) {
      return false;
    }
    return true;
  });
};

export const getElementsWithinSelection = (
  elements: readonly NonDeletedDucElement[],
  selection: NonDeletedDucElement,
  elementsMap: ElementsMap,
  excludeElementsInFrames: boolean = true,
  selectionDirection: AppState["selectionDirection"] = "right", // default to 'right'
) => {
  const [selectionX1, selectionY1, selectionX2, selectionY2] =
    getElementAbsoluteCoords(selection, elementsMap);

  let elementsInSelection = elements.filter((element) => {
    let [elementX1, elementY1, elementX2, elementY2] = getElementBounds(
      element,
      elementsMap,
    );

    const containingFrame = getContainingFrame(element, elementsMap);
    if (containingFrame) {
      const [fx1, fy1, fx2, fy2] = getElementBounds(
        containingFrame,
        elementsMap,
      );

      elementX1 = Math.max(fx1, elementX1);
      elementY1 = Math.max(fy1, elementY1);
      elementX2 = Math.min(fx2, elementX2);
      elementY2 = Math.min(fy2, elementY2);
    }

    if (selectionDirection === "right") {
      // Select elements fully inside the selection area
      return (
        element.locked === false &&
        element.type !== "selection" &&
        !isBoundToContainer(element) &&
        selectionX1 <= elementX1 &&
        selectionY1 <= elementY1 &&
        selectionX2 >= elementX2 &&
        selectionY2 >= elementY2
      );
    } else {
      // Select elements that intersect with the selection area
      return (
        element.locked === false &&
        element.type !== "selection" &&
        !isBoundToContainer(element) &&
        !(elementX2 < selectionX1 ||
          elementX1 > selectionX2 ||
          elementY2 < selectionY1 ||
          elementY1 > selectionY2)
      );
    }
  });

  elementsInSelection = excludeElementsInFrames
  ? excludeElementsInFramesFromSelection(elementsInSelection)
  : elementsInSelection;

  elementsInSelection = elementsInSelection.filter((element) => {
    const containingFrame = getContainingFrame(element, elementsMap);

    if (containingFrame) {
      return elementOverlapsWithFrame(element, containingFrame, elementsMap);
    }

    return true;
  });

  return elementsInSelection;
};

export const getVisibleAndNonSelectedElements = (
  elements: readonly NonDeletedDucElement[],
  selectedElements: readonly NonDeletedDucElement[],
  appState: AppState,
  elementsMap: ElementsMap,
) => {
  const selectedElementsSet = new Set(
    selectedElements.map((element) => element.id),
  );
  return elements.filter((element) => {
    const isVisible = isElementInViewport(
      element,
      appState.width,
      appState.height,
      appState,
      elementsMap,
    );

    return !selectedElementsSet.has(element.id) && isVisible;
  });
};

// FIXME move this into the editor instance to keep utility methods stateless
export const isSomeElementSelected = (function () {
  let lastElements: readonly NonDeletedDucElement[] | null = null;
  let lastSelectedElementIds: AppState["selectedElementIds"] | null = null;
  let isSelected: boolean | null = null;

  const ret = (
    elements: readonly NonDeletedDucElement[],
    appState: Pick<AppState, "selectedElementIds">,
  ): boolean => {
    if (
      isSelected != null &&
      elements === lastElements &&
      appState.selectedElementIds === lastSelectedElementIds
    ) {
      return isSelected;
    }

    isSelected = elements.some(
      (element) => appState.selectedElementIds[element.id],
    );
    lastElements = elements;
    lastSelectedElementIds = appState.selectedElementIds;

    return isSelected;
  };

  ret.clearCache = () => {
    lastElements = null;
    lastSelectedElementIds = null;
    isSelected = null;
  };

  return ret;
})();

/**
 * Returns common attribute (picked by `getAttribute` callback) of selected
 *  elements. If elements don't share the same value, returns `null`.
 */
export const getCommonAttributeOfSelectedElements = <T>(
  elements: readonly NonDeletedDucElement[],
  appState: Pick<AppState, "selectedElementIds">,
  getAttribute: (element: DucElement) => T,
): T | null => {
  const attributes = Array.from(
    new Set(
      getSelectedElements(elements, appState).map((element) =>
        getAttribute(element),
      ),
    ),
  );
  return attributes.length === 1 ? attributes[0] : null;
};

export const getSelectedElements = (
  elements: ElementsMapOrArray,
  appState: Pick<InteractiveCanvasAppState, "selectedElementIds">,
  opts?: {
    includeBoundTextElement?: boolean;
    includeElementsInFrames?: boolean;
  },
) => {
  const selectedElements: DucElement[] = [];
  for (const element of elements.values()) {
    if (appState.selectedElementIds[element.id]) {
      selectedElements.push(element);
      continue;
    }
    if (
      opts?.includeBoundTextElement &&
      isBoundToContainer(element) &&
      appState.selectedElementIds[element?.containerId]
    ) {
      selectedElements.push(element);
      continue;
    }
  }

  if (opts?.includeElementsInFrames) {
    const elementsToInclude: DucElement[] = [];
    selectedElements.forEach((element) => {
      if (isFrameLikeElement(element)) {
        getFrameChildren(elements, element.id).forEach((e) =>
          elementsToInclude.push(e),
        );
      }
      elementsToInclude.push(element);
    });

    return elementsToInclude;
  }

  return selectedElements;
};

export const getTargetElements = (
  elements: ElementsMapOrArray,
  appState: Pick<
    AppState,
    "selectedElementIds" | "editingTextElement" | "newElement"
  >,
) =>
  appState.editingTextElement
    ? [appState.editingTextElement]
    : appState.newElement
    ? [appState.newElement]
    : getSelectedElements(elements, appState, {
        includeBoundTextElement: true,
      });

/**
 * returns prevState's selectedElementids if no change from previous, so as to
 * retain reference identity for memoization
 */
export const makeNextSelectedElementIds = (
  nextSelectedElementIds: AppState["selectedElementIds"],
  prevState: Pick<AppState, "selectedElementIds">,
) => {
  if (isShallowEqual(prevState.selectedElementIds, nextSelectedElementIds)) {
    return prevState.selectedElementIds;
  }

  return nextSelectedElementIds;
};
