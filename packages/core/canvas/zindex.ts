import { isFrameLikeElement } from "./element/typeChecks";
import type {
  DucElement,
  DucFrameLikeElement,
  ElementsMapOrArray,
} from "./element/types";
import { syncMovedIndices } from "./fractionalIndex";
import { getElementsInGroup } from "./groups";
import { getSelectedElements } from "./scene";
import Scene from "./scene/Scene";
import type { AppState } from "./types";
import { arrayToMap, findIndex, findLastIndex } from "./utils";

const isOfTargetFrame = (element: DucElement, frameId: string) => {
  return element.frameId === frameId || element.id === frameId;
};

/**
 * Returns indices of elements to move based on selected elements.
 * Includes contiguous deleted elements that are between two selected elements,
 *  e.g.: [0 (selected), 1 (deleted), 2 (deleted), 3 (selected)]
 *
 * Specified elements (elementsToBeMoved) take precedence over
 * appState.selectedElementsIds
 */
const getIndicesToMove = (
  elements: readonly DucElement[],
  appState: AppState,
  elementsToBeMoved?: readonly DucElement[],
) => {
  let selectedIndices: number[] = [];
  let deletedIndices: number[] = [];
  let includeDeletedIndex = null;
  let index = -1;
  const selectedElementIds = arrayToMap(
    elementsToBeMoved
      ? elementsToBeMoved
      : getSelectedElements(elements, appState, {
          includeBoundTextElement: true,
          includeElementsInFrames: true,
        }),
  );
  while (++index < elements.length) {
    const element = elements[index];
    if (selectedElementIds.get(element.id)) {
      if (deletedIndices.length) {
        selectedIndices = selectedIndices.concat(deletedIndices);
        deletedIndices = [];
      }
      selectedIndices.push(index);
      includeDeletedIndex = index + 1;
    } else if (element.isDeleted && includeDeletedIndex === index) {
      includeDeletedIndex = index + 1;
      deletedIndices.push(index);
    } else {
      deletedIndices = [];
    }
  }
  return selectedIndices;
};

const toContiguousGroups = (array: number[]) => {
  let cursor = 0;
  return array.reduce((acc, value, index) => {
    if (index > 0 && array[index - 1] !== value - 1) {
      cursor = ++cursor;
    }
    (acc[cursor] || (acc[cursor] = [])).push(value);
    return acc;
  }, [] as number[][]);
};

/**
 * @returns index of target element, consindering tightly-bound elements
 * (currently non-linear elements bound to a container) as a one unit.
 * If no binding present, returns `undefined`.
 */
const getTargetIndexAccountingForBinding = (
  nextElement: DucElement,
  elements: readonly DucElement[],
  direction: "left" | "right",
) => {
  if ("containerId" in nextElement && nextElement.containerId) {
    const containerElement = Scene.getScene(nextElement)!.getElement(
      nextElement.containerId,
    );
    if (containerElement) {
      return direction === "left"
        ? Math.min(
            elements.indexOf(containerElement),
            elements.indexOf(nextElement),
          )
        : Math.max(
            elements.indexOf(containerElement),
            elements.indexOf(nextElement),
          );
    }
  } else {
    const boundElementId = nextElement.boundElements?.find(
      (binding) => binding.type !== "arrow",
    )?.id;
    if (boundElementId) {
      const boundTextElement =
        Scene.getScene(nextElement)!.getElement(boundElementId);
      if (boundTextElement) {
        return direction === "left"
          ? Math.min(
              elements.indexOf(boundTextElement),
              elements.indexOf(nextElement),
            )
          : Math.max(
              elements.indexOf(boundTextElement),
              elements.indexOf(nextElement),
            );
      }
    }
  }
};

const getContiguousFrameRangeElements = (
  allElements: readonly DucElement[],
  frameId: DucFrameLikeElement["id"],
) => {
  let rangeStart = -1;
  let rangeEnd = -1;
  allElements.forEach((element, index) => {
    if (isOfTargetFrame(element, frameId)) {
      if (rangeStart === -1) {
        rangeStart = index;
      }
      rangeEnd = index;
    }
  });
  if (rangeStart === -1) {
    return [];
  }
  return allElements.slice(rangeStart, rangeEnd + 1);
};

/**
 * Returns next candidate index that's available to be moved to. Currently that
 *  is a non-deleted element, and not inside a group (unless we're editing it).
 */
const getTargetIndex = (
  appState: AppState,
  elements: readonly DucElement[],
  boundaryIndex: number,
  direction: "left" | "right",
  /**
   * Frame id if moving frame children.
   * If whole frame (including all children) is being moved, supply `null`.
   */
  containingFrame: DucFrameLikeElement["id"] | null,
) => {
  const sourceElement = elements[boundaryIndex];

  const indexFilter = (element: DucElement) => {
    if (element.isDeleted) {
      return false;
    }
    if (containingFrame) {
      return element.frameId === containingFrame;
    }
    // if we're editing group, find closest sibling irrespective of whether
    // there's a different-group element between them (for legacy reasons)
    if (appState.editingGroupId) {
      return element.groupIds.includes(appState.editingGroupId);
    }
    return true;
  };

  const candidateIndex =
    direction === "left"
      ? findLastIndex(
          elements,
          (el) => indexFilter(el),
          Math.max(0, boundaryIndex - 1),
        )
      : findIndex(elements, (el) => indexFilter(el), boundaryIndex + 1);

  const nextElement = elements[candidateIndex];

  if (!nextElement) {
    return -1;
  }

  if (appState.editingGroupId) {
    if (
      // candidate element is a sibling in current editing group → return
      sourceElement?.groupIds.join("") === nextElement?.groupIds.join("")
    ) {
      return (
        getTargetIndexAccountingForBinding(nextElement, elements, direction) ??
        candidateIndex
      );
    } else if (!nextElement?.groupIds.includes(appState.editingGroupId)) {
      // candidate element is outside current editing group → prevent
      return -1;
    }
  }

  if (
    !containingFrame &&
    (nextElement.frameId || isFrameLikeElement(nextElement))
  ) {
    const frameElements = getContiguousFrameRangeElements(
      elements,
      nextElement.frameId || nextElement.id,
    );
    return direction === "left"
      ? elements.indexOf(frameElements[0])
      : elements.indexOf(frameElements[frameElements.length - 1]);
  }

  if (!nextElement.groupIds.length) {
    return (
      getTargetIndexAccountingForBinding(nextElement, elements, direction) ??
      candidateIndex
    );
  }

  const siblingGroupId = appState.editingGroupId
    ? nextElement.groupIds[
        nextElement.groupIds.indexOf(appState.editingGroupId) - 1
      ]
    : nextElement.groupIds[nextElement.groupIds.length - 1];

  const elementsInSiblingGroup = getElementsInGroup(elements, siblingGroupId);

  if (elementsInSiblingGroup.length) {
    // assumes getElementsInGroup() returned elements are sorted
    // by zIndex (ascending)
    return direction === "left"
      ? elements.indexOf(elementsInSiblingGroup[0])
      : elements.indexOf(
          elementsInSiblingGroup[elementsInSiblingGroup.length - 1],
        );
  }

  return candidateIndex;
};

const getTargetElementsMap = <T extends DucElement>(
  elements: readonly T[],
  indices: number[],
) => {
  return indices.reduce((acc, index) => {
    const element = elements[index];
    acc.set(element.id, element);
    return acc;
  }, new Map<string, DucElement>());
};

const shiftElementsByOne = (
  elements: readonly DucElement[],
  appState: AppState,
  direction: "left" | "right",
) => {
  const indicesToMove = getIndicesToMove(elements, appState);
  const targetElementsMap = getTargetElementsMap(elements, indicesToMove);

  let groupedIndices = toContiguousGroups(indicesToMove);

  if (direction === "right") {
    groupedIndices = groupedIndices.reverse();
  }

  const selectedFrames = new Set<DucFrameLikeElement["id"]>(
    indicesToMove
      .filter((idx) => isFrameLikeElement(elements[idx]))
      .map((idx) => elements[idx].id),
  );

  groupedIndices.forEach((indices, i) => {
    const leadingIndex = indices[0];
    const trailingIndex = indices[indices.length - 1];
    const boundaryIndex = direction === "left" ? leadingIndex : trailingIndex;

    const containingFrame = indices.some((idx) => {
      const el = elements[idx];
      return el.frameId && selectedFrames.has(el.frameId);
    })
      ? null
      : elements[boundaryIndex]?.frameId;

    const targetIndex = getTargetIndex(
      appState,
      elements,
      boundaryIndex,
      direction,
      containingFrame,
    );

    if (targetIndex === -1 || boundaryIndex === targetIndex) {
      return;
    }

    const leadingElements =
      direction === "left"
        ? elements.slice(0, targetIndex)
        : elements.slice(0, leadingIndex);
    const targetElements = elements.slice(leadingIndex, trailingIndex + 1);
    const displacedElements =
      direction === "left"
        ? elements.slice(targetIndex, leadingIndex)
        : elements.slice(trailingIndex + 1, targetIndex + 1);
    const trailingElements =
      direction === "left"
        ? elements.slice(trailingIndex + 1)
        : elements.slice(targetIndex + 1);

    elements =
      direction === "left"
        ? [
            ...leadingElements,
            ...targetElements,
            ...displacedElements,
            ...trailingElements,
          ]
        : [
            ...leadingElements,
            ...displacedElements,
            ...targetElements,
            ...trailingElements,
          ];
  });

  syncMovedIndices(elements, targetElementsMap);

  return elements;
};

const shiftElementsToEnd = (
  elements: readonly DucElement[],
  appState: AppState,
  direction: "left" | "right",
  containingFrame: DucFrameLikeElement["id"] | null,
  elementsToBeMoved?: readonly DucElement[],
) => {
  const indicesToMove = getIndicesToMove(elements, appState, elementsToBeMoved);
  const targetElementsMap = getTargetElementsMap(elements, indicesToMove);
  const displacedElements: DucElement[] = [];

  let leadingIndex: number;
  let trailingIndex: number;
  if (direction === "left") {
    if (containingFrame) {
      leadingIndex = findIndex(elements, (el) =>
        isOfTargetFrame(el, containingFrame),
      );
    } else if (appState.editingGroupId) {
      const groupElements = getElementsInGroup(
        elements,
        appState.editingGroupId,
      );
      if (!groupElements.length) {
        return elements;
      }
      leadingIndex = elements.indexOf(groupElements[0]);
    } else {
      leadingIndex = 0;
    }

    trailingIndex = indicesToMove[indicesToMove.length - 1];
  } else {
    if (containingFrame) {
      trailingIndex = findLastIndex(elements, (el) =>
        isOfTargetFrame(el, containingFrame),
      );
    } else if (appState.editingGroupId) {
      const groupElements = getElementsInGroup(
        elements,
        appState.editingGroupId,
      );
      if (!groupElements.length) {
        return elements;
      }
      trailingIndex = elements.indexOf(groupElements[groupElements.length - 1]);
    } else {
      trailingIndex = elements.length - 1;
    }

    leadingIndex = indicesToMove[0];
  }

  if (leadingIndex === -1) {
    leadingIndex = 0;
  }

  for (let index = leadingIndex; index < trailingIndex + 1; index++) {
    if (!indicesToMove.includes(index)) {
      displacedElements.push(elements[index]);
    }
  }

  const targetElements = Array.from(targetElementsMap.values());
  const leadingElements = elements.slice(0, leadingIndex);
  const trailingElements = elements.slice(trailingIndex + 1);
  const nextElements =
    direction === "left"
      ? [
          ...leadingElements,
          ...targetElements,
          ...displacedElements,
          ...trailingElements,
        ]
      : [
          ...leadingElements,
          ...displacedElements,
          ...targetElements,
          ...trailingElements,
        ];

  syncMovedIndices(nextElements, targetElementsMap);

  return nextElements;
};

function shiftElementsAccountingForFrames(
  allElements: readonly DucElement[],
  appState: AppState,
  direction: "left" | "right",
  shiftFunction: (
    elements: readonly DucElement[],
    appState: AppState,
    direction: "left" | "right",
    containingFrame: DucFrameLikeElement["id"] | null,
    elementsToBeMoved?: readonly DucElement[],
  ) => DucElement[] | readonly DucElement[],
) {
  const elementsToMove = arrayToMap(
    getSelectedElements(allElements, appState, {
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    }),
  );

  const frameAwareContiguousElementsToMove: {
    regularElements: DucElement[];
    frameChildren: Map<DucFrameLikeElement["id"], DucElement[]>;
  } = { regularElements: [], frameChildren: new Map() };

  const fullySelectedFrames = new Set<DucFrameLikeElement["id"]>();

  for (const element of allElements) {
    if (elementsToMove.has(element.id) && isFrameLikeElement(element)) {
      fullySelectedFrames.add(element.id);
    }
  }

  for (const element of allElements) {
    if (elementsToMove.has(element.id)) {
      if (
        isFrameLikeElement(element) ||
        (element.frameId && fullySelectedFrames.has(element.frameId))
      ) {
        frameAwareContiguousElementsToMove.regularElements.push(element);
      } else if (!element.frameId) {
        frameAwareContiguousElementsToMove.regularElements.push(element);
      } else {
        const frameChildren =
          frameAwareContiguousElementsToMove.frameChildren.get(
            element.frameId,
          ) || [];
        frameChildren.push(element);
        frameAwareContiguousElementsToMove.frameChildren.set(
          element.frameId,
          frameChildren,
        );
      }
    }
  }

  let nextElements = allElements;

  const frameChildrenSets = Array.from(
    frameAwareContiguousElementsToMove.frameChildren.entries(),
  );

  for (const [frameId, children] of frameChildrenSets) {
    nextElements = shiftFunction(
      allElements,
      appState,
      direction,
      frameId,
      children,
    );
  }

  return shiftFunction(
    nextElements,
    appState,
    direction,
    null,
    frameAwareContiguousElementsToMove.regularElements,
  );
}

// public API
// -----------------------------------------------------------------------------

export const moveOneLeft = (
  allElements: readonly DucElement[],
  appState: AppState,
) => {
  return shiftElementsByOne(allElements, appState, "left");
};

export const moveOneRight = (
  allElements: readonly DucElement[],
  appState: AppState,
) => {
  return shiftElementsByOne(allElements, appState, "right");
};

export const moveAllLeft = (
  allElements: readonly DucElement[],
  appState: AppState,
) => {
  return shiftElementsAccountingForFrames(
    allElements,
    appState,
    "left",
    shiftElementsToEnd,
  );
};

export const moveAllRight = (
  allElements: readonly DucElement[],
  appState: AppState,
) => {
  return shiftElementsAccountingForFrames(
    allElements,
    appState,
    "right",
    shiftElementsToEnd,
  );
};

export const moveAboveElement = <T extends ElementsMapOrArray>(
  allElements: T,
  elementsToMove: readonly DucElement[],
  targetElement: DucElement
): T => {
  if (Array.isArray(allElements)) {
    const targetIndex = allElements.findIndex(el => el.id === targetElement.id);
    if (targetIndex === -1) {
      return allElements;
    }

    const elementsToMoveSet = new Set(elementsToMove.map(el => el.id));
    const filteredElements = allElements.filter(el => !elementsToMoveSet.has(el.id));
    
    filteredElements.splice(targetIndex, 0, ...elementsToMove);
    return filteredElements as unknown as T;
  } else {
    const elementsArray = Array.from(allElements.values());
    const targetIndex = elementsArray.findIndex(el => el.id === targetElement.id);
    if (targetIndex === -1) {
      return allElements;
    }

    const elementsToMoveSet = new Set(elementsToMove.map(el => el.id));
    const filteredElements = elementsArray.filter(el => !elementsToMoveSet.has(el.id));
    
    filteredElements.splice(targetIndex, 0, ...elementsToMove);
    return new Map(filteredElements.map(el => [el.id, el])) as T;
  }
};