import {
  getCommonBounds,
  getElementAbsoluteCoords,
  isTextElement,
} from "./element";
import {
  ElementsMap,
  ElementsMapOrArray,
  DucElement,
  DucFrameLikeElement,
  NonDeleted,
  NonDeletedDucElement,
} from "./element/types";
import { isPointWithinBounds } from "./math";
import {
  getBoundTextElement,
  getContainerElement,
} from "./element/textElement";
import { arrayToMap } from "./utils";
import { mutateElement } from "./element/mutateElement";
import { AppClassProperties, AppState, StaticCanvasAppState } from "./types";
import { getElementsWithinSelection, getSelectedElements } from "./scene";
import { getElementsInGroup, selectGroupsFromGivenElements } from "./groups";
import type { DucElementsIncludingDeleted } from "./scene/Scene";
import { getElementLineSegments } from "./element/bounds";
import { doLineSegmentsIntersect, elementsOverlappingBBox } from "../utils";
import { isFrameElement, isFrameLikeElement } from "./element/typeChecks";
import { ReadonlySetLike } from "./utility-types";
import { moveAboveElement } from "./zindex";

// --------------------------- Frame State ------------------------------------
export const bindElementsToFramesAfterDuplication = (
  nextElements: DucElement[],
  oldElements: readonly DucElement[],
  oldIdToDuplicatedId: Map<DucElement["id"], DucElement["id"]>,
) => {
  const nextElementMap = arrayToMap(nextElements) as Map<
    DucElement["id"],
    DucElement
  >;

  for (const element of oldElements) {
    if (element.frameId) {
      // use its frameId to get the new frameId
      const nextElementId = oldIdToDuplicatedId.get(element.id);
      const nextFrameId = oldIdToDuplicatedId.get(element.frameId);
      if (nextElementId) {
        const nextElement = nextElementMap.get(nextElementId);
        if (nextElement) {
          mutateElement(
            nextElement,
            {
              frameId: nextFrameId ?? element.frameId,
            },
            false,
          );
        }
      }
    }
  }
};

export function isElementIntersectingFrame(
  element: DucElement,
  frame: DucFrameLikeElement,
  elementsMap: ElementsMap,
) {
  const frameLineSegments = getElementLineSegments(frame, elementsMap);

  const elementLineSegments = getElementLineSegments(element, elementsMap);

  const intersecting = frameLineSegments.some((frameLineSegment) =>
    elementLineSegments.some((elementLineSegment) =>
      doLineSegmentsIntersect(frameLineSegment, elementLineSegment),
    ),
  );

  return intersecting;
}

export const getElementsCompletelyInFrame = (
  elements: readonly DucElement[],
  frame: DucFrameLikeElement,
  elementsMap: ElementsMap,
) =>
  omitGroupsContainingFrameLikes(
    getElementsWithinSelection(elements, frame, elementsMap, false),
  ).filter(
    (element) =>
      (!isFrameLikeElement(element) && !element.frameId) ||
      element.frameId === frame.id,
  );

export const isElementContainingFrame = (
  elements: readonly DucElement[],
  element: DucElement,
  frame: DucFrameLikeElement,
  elementsMap: ElementsMap,
) => {
  return getElementsWithinSelection(elements, element, elementsMap).some(
    (e) => e.id === frame.id,
  );
};

export const getElementsIntersectingFrame = (
  elements: readonly DucElement[],
  frame: DucFrameLikeElement,
) => {
  const elementsMap = arrayToMap(elements);
  return elements.filter((element) =>
    isElementIntersectingFrame(element, frame, elementsMap),
  );
};

export const elementsAreInFrameBounds = (
  elements: readonly DucElement[],
  frame: DucFrameLikeElement,
  elementsMap: ElementsMap,
) => {
  const [frameX1, frameY1, frameX2, frameY2] = getElementAbsoluteCoords(
    frame,
    elementsMap,
  );

  const [elementX1, elementY1, elementX2, elementY2] =
    getCommonBounds(elements);

  return (
    frameX1 <= elementX1 &&
    frameY1 <= elementY1 &&
    frameX2 >= elementX2 &&
    frameY2 >= elementY2
  );
};

export const elementOverlapsWithFrame = (
  element: DucElement,
  frame: DucFrameLikeElement,
  elementsMap: ElementsMap,
) => {
  return (
    elementsAreInFrameBounds([element], frame, elementsMap) ||
    isElementIntersectingFrame(element, frame, elementsMap) ||
    isElementContainingFrame([frame], element, frame, elementsMap)
  );
};

export const isCursorInFrame = (
  cursorCoords: {
    x: number;
    y: number;
  },
  frame: NonDeleted<DucFrameLikeElement>,
  elementsMap: ElementsMap,
) => {
  const [fx1, fy1, fx2, fy2] = getElementAbsoluteCoords(frame, elementsMap);

  return isPointWithinBounds(
    {x: fx1, y: fy1},
    {x: cursorCoords.x, y: cursorCoords.y},
    {x: fx2, y: fy2},
  );
};

export const groupsAreAtLeastIntersectingTheFrame = (
  elements: readonly NonDeletedDucElement[],
  groupIds: readonly string[],
  frame: DucFrameLikeElement,
) => {
  const elementsMap = arrayToMap(elements);
  const elementsInGroup = groupIds.flatMap((groupId) =>
    getElementsInGroup(elements, groupId),
  );

  if (elementsInGroup.length === 0) {
    return true;
  }

  return !!elementsInGroup.find(
    (element) =>
      elementsAreInFrameBounds([element], frame, elementsMap) ||
      isElementIntersectingFrame(element, frame, elementsMap),
  );
};

export const groupsAreCompletelyOutOfFrame = (
  elements: readonly NonDeletedDucElement[],
  groupIds: readonly string[],
  frame: DucFrameLikeElement,
) => {
  const elementsMap = arrayToMap(elements);
  const elementsInGroup = groupIds.flatMap((groupId) =>
    getElementsInGroup(elements, groupId),
  );

  if (elementsInGroup.length === 0) {
    return true;
  }

  return (
    elementsInGroup.find(
      (element) =>
        elementsAreInFrameBounds([element], frame, elementsMap) ||
        isElementIntersectingFrame(element, frame, elementsMap),
    ) === undefined
  );
};

// --------------------------- Frame Utils ------------------------------------

/**
 * Returns a map of frameId to frame elements. Includes empty frames.
 */
export const groupByFrameLikes = (elements: readonly DucElement[]) => {
  const frameElementsMap = new Map<
    DucElement["id"],
    DucElement[]
  >();

  for (const element of elements) {
    const frameId = isFrameLikeElement(element) ? element.id : element.frameId;
    if (frameId && !frameElementsMap.has(frameId)) {
      frameElementsMap.set(frameId, getFrameChildren(elements, frameId));
    }
  }

  return frameElementsMap;
};

export const getFrameChildren = (
  allElements: ElementsMapOrArray,
  frameId: string,
) => {
  const frameChildren: DucElement[] = [];
  for (const element of allElements.values()) {
    if (element.frameId === frameId) {
      frameChildren.push(element);
    }
  }
  return frameChildren;
};

export const getFrameLikeElements = (
  allElements: DucElementsIncludingDeleted,
): DucFrameLikeElement[] => {
  return allElements.filter((element): element is DucFrameLikeElement =>
    isFrameLikeElement(element),
  );
};

/**
 * Returns ExcalidrawFrameElements and non-frame-children elements.
 *
 * Considers children as root elements if they point to a frame parent
 * non-existing in the elements set.
 *
 * Considers non-frame bound elements (container or arrow labels) as root.
 */
export const getRootElements = (
  allElements: DucElementsIncludingDeleted,
) => {
  const frameElements = arrayToMap(getFrameLikeElements(allElements));
  return allElements.filter(
    (element) =>
      frameElements.has(element.id) ||
      !element.frameId ||
      !frameElements.has(element.frameId),
  );
};

export const getElementsInResizingFrame = (
  allElements: DucElementsIncludingDeleted,
  frame: DucFrameLikeElement,
  appState: AppState,
  elementsMap: ElementsMap,
): DucElement[] => {
  const prevElementsInFrame = getFrameChildren(allElements, frame.id);
  const nextElementsInFrame = new Set<DucElement>(prevElementsInFrame);

  const elementsCompletelyInFrame = new Set([
    ...getElementsCompletelyInFrame(allElements, frame, elementsMap),
    ...prevElementsInFrame.filter((element) =>
      isElementContainingFrame(allElements, element, frame, elementsMap),
    ),
  ]);

  const elementsNotCompletelyInFrame = prevElementsInFrame.filter(
    (element) => !elementsCompletelyInFrame.has(element),
  );

  // for elements that are completely in the frame
  // if they are part of some groups, then those groups are still
  // considered to belong to the frame
  const groupsToKeep = new Set<string>(
    Array.from(elementsCompletelyInFrame).flatMap(
      (element) => element.groupIds,
    ),
  );

  for (const element of elementsNotCompletelyInFrame) {
    if (!isElementIntersectingFrame(element, frame, elementsMap)) {
      if (element.groupIds.length === 0) {
        nextElementsInFrame.delete(element);
      }
    } else if (element.groupIds.length > 0) {
      // group element intersects with the frame, we should keep the groups
      // that this element is part of
      for (const id of element.groupIds) {
        groupsToKeep.add(id);
      }
    }
  }

  for (const element of elementsNotCompletelyInFrame) {
    if (element.groupIds.length > 0) {
      let shouldRemoveElement = true;

      for (const id of element.groupIds) {
        if (groupsToKeep.has(id)) {
          shouldRemoveElement = false;
        }
      }

      if (shouldRemoveElement) {
        nextElementsInFrame.delete(element);
      }
    }
  }

  const individualElementsCompletelyInFrame = Array.from(
    elementsCompletelyInFrame,
  ).filter((element) => element.groupIds.length === 0);

  for (const element of individualElementsCompletelyInFrame) {
    nextElementsInFrame.add(element);
  }

  const newGroupElementsCompletelyInFrame = Array.from(
    elementsCompletelyInFrame,
  ).filter((element) => element.groupIds.length > 0);

  const groupIds = selectGroupsFromGivenElements(
    newGroupElementsCompletelyInFrame,
    appState,
  );

  // new group elements
  for (const [id, isSelected] of Object.entries(groupIds)) {
    if (isSelected) {
      const elementsInGroup = getElementsInGroup(allElements, id);

      if (elementsAreInFrameBounds(elementsInGroup, frame, elementsMap)) {
        for (const element of elementsInGroup) {
          nextElementsInFrame.add(element);
        }
      }
    }
  }

  return [...nextElementsInFrame].filter((element) => {
    return !(isTextElement(element) && element.containerId);
  });
};

export const getElementsInNewFrame = (
  elements: DucElementsIncludingDeleted,
  frame: DucFrameLikeElement,
  elementsMap: ElementsMap,
) => {
  return omitGroupsContainingFrameLikes(
    elements,
    getElementsCompletelyInFrame(elements, frame, elementsMap),
  );
};

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

// --------------------------- Frame Operations -------------------------------

/** */
export const filterElementsEligibleAsFrameChildren = (
  elements: readonly DucElement[],
  frame: DucFrameLikeElement,
) => {
  const otherFrames = new Set<DucFrameLikeElement["id"]>();
  const elementsMap = arrayToMap(elements);
  elements = omitGroupsContainingFrameLikes(elements);

  for (const element of elements) {
    if (isFrameLikeElement(element) && element.id !== frame.id) {
      otherFrames.add(element.id);
    }
  }

  const processedGroups = new Set<DucElement["id"]>();

  const eligibleElements: DucElement[] = [];

  for (const element of elements) {
    // don't add frames or their children
    if (
      isFrameLikeElement(element) ||
      (element.frameId && otherFrames.has(element.frameId))
    ) {
      continue;
    }

    if (element.groupIds.length) {
      const shallowestGroupId = element.groupIds.at(-1)!;
      if (!processedGroups.has(shallowestGroupId)) {
        processedGroups.add(shallowestGroupId);
        const groupElements = getElementsInGroup(elements, shallowestGroupId);
        if (
          groupElements.some((el) =>
            elementOverlapsWithFrame(el, frame, elementsMap),
          )
        ) {
          for (const child of groupElements) {
            eligibleElements.push(child);
          }
        }
      }
    } else {
      const overlaps = elementOverlapsWithFrame(element, frame, elementsMap);
      if (overlaps) {
        eligibleElements.push(element);
      }
    }
  }

  return eligibleElements;
};

/**
 * Retains (or repairs for target frame) the ordering invriant where children
 * elements come right before the parent frame:
 * [el, el, child, child, frame, el]
 *
 * @returns mutated allElements (same data structure)
 */
export const addElementsToFrame = <T extends ElementsMapOrArray>(
  allElements: T,
  elementsToAdd: NonDeletedDucElement[],
  frame: DucFrameLikeElement,
): T => {
  const elementsMap = arrayToMap(allElements);
  const currTargetFrameChildrenMap = new Map<DucElement["id"], true>();
  for (const element of allElements.values()) {
    if (element.frameId === frame.id) {
      currTargetFrameChildrenMap.set(element.id, true);
    }
  }

  const suppliedElementsToAddSet = new Set(elementsToAdd.map((el) => el.id));

  const finalElementsToAdd: DucElement[] = [];

  const otherFrames = new Set<DucFrameLikeElement["id"]>();

  for (const element of elementsToAdd) {
    if (isFrameLikeElement(element) && element.id !== frame.id) {
      otherFrames.add(element.id);
    }
  }

  // - add bound text elements if not already in the array
  // - filter out elements that are already in the frame
  for (const element of omitGroupsContainingFrameLikes(
    allElements,
    elementsToAdd,
  )) {
    // don't add frames or their children
    if (
      isFrameLikeElement(element) ||
      (element.frameId && otherFrames.has(element.frameId))
    ) {
      continue;
    }

    if (!currTargetFrameChildrenMap.has(element.id)) {
      finalElementsToAdd.push(element);
    }

    const boundTextElement = getBoundTextElement(element, elementsMap);
    if (
      boundTextElement &&
      !suppliedElementsToAddSet.has(boundTextElement.id) &&
      !currTargetFrameChildrenMap.has(boundTextElement.id)
    ) {
      finalElementsToAdd.push(boundTextElement);
    }
  }

  for (const element of finalElementsToAdd) {
    mutateElement(
      element,
      {
        frameId: frame.id,
      },
      false,
    );
  }

  return allElements;
};

export const removeElementsFromFrame = (
  elementsToRemove: ReadonlySetLike<NonDeletedDucElement>,
  elementsMap: ElementsMap,
) => {
  const _elementsToRemove = new Map<
    DucElement["id"],
    DucElement
  >();

  const toRemoveElementsByFrame = new Map<
    DucFrameLikeElement["id"],
    DucElement[]
  >();

  for (const element of elementsToRemove) {
    if (element.frameId) {
      _elementsToRemove.set(element.id, element);

      const arr = toRemoveElementsByFrame.get(element.frameId) || [];
      arr.push(element);

      const boundTextElement = getBoundTextElement(element, elementsMap);
      if (boundTextElement) {
        _elementsToRemove.set(boundTextElement.id, boundTextElement);
        arr.push(boundTextElement);
      }

      toRemoveElementsByFrame.set(element.frameId, arr);
    }
  }

  for (const [, element] of _elementsToRemove) {
    mutateElement(
      element,
      {
        frameId: null,
      },
      false,
    );
  }
};

export const removeAllElementsFromFrame = <T extends DucElement>(
  allElements: readonly T[],
  frame: DucFrameLikeElement,
) => {
  const elementsInFrame = getFrameChildren(allElements, frame.id);
  removeElementsFromFrame(elementsInFrame, arrayToMap(allElements));
  return allElements;
};

export const replaceAllElementsInFrame = <T extends DucElement>(
  allElements: readonly T[],
  nextElementsInFrame: DucElement[],
  frame: DucFrameLikeElement,
  app: AppClassProperties,
): T[] => {
  return addElementsToFrame(
    removeAllElementsFromFrame(allElements, frame),
    nextElementsInFrame,
    frame,
  ).slice();
};

/** does not mutate elements, but returns new ones */
export const updateFrameMembershipOfSelectedElements = <
  T extends ElementsMapOrArray,
>(
  allElements: T,
  appState: AppState,
  app: AppClassProperties,
) => {
  const selectedElements = app.scene.getSelectedElements({
    selectedElementIds: appState.selectedElementIds,
    // supplying elements explicitly in case we're passed non-state elements
    elements: allElements,
  });
  const elementsToFilter = new Set<DucElement>(selectedElements);

  if (appState.editingGroupId) {
    for (const element of selectedElements) {
      if (element.groupIds.length === 0) {
        elementsToFilter.add(element);
      } else {
        element.groupIds
          .flatMap((gid) => getElementsInGroup(allElements, gid))
          .forEach((element) => elementsToFilter.add(element));
      }
    }
  }

  const elementsToRemove = new Set<DucElement>();

  const elementsMap = arrayToMap(allElements);

  elementsToFilter.forEach((element) => {
    if (
      element.frameId &&
      !isFrameLikeElement(element) &&
      !isElementInFrame(element, elementsMap, appState)
    ) {
      elementsToRemove.add(element);
    }
  });

  if (elementsToRemove.size > 0) {
    removeElementsFromFrame(elementsToRemove, elementsMap);
  }

  return allElements;
};

/**
 * filters out elements that are inside groups that contain a frame element
 * anywhere in the group tree
 */
export const omitGroupsContainingFrameLikes = (
  allElements: ElementsMapOrArray,
  /** subset of elements you want to filter. Optional perf optimization so we
   * don't have to filter all elements unnecessarily
   */
  selectedElements?: readonly DucElement[],
) => {
  const uniqueGroupIds = new Set<string>();
  const elements = selectedElements || allElements;

  for (const el of elements.values()) {
    const topMostGroupId = el.groupIds[el.groupIds.length - 1];
    if (topMostGroupId) {
      uniqueGroupIds.add(topMostGroupId);
    }
  }

  const rejectedGroupIds = new Set<string>();
  for (const groupId of uniqueGroupIds) {
    if (
      getElementsInGroup(allElements, groupId).some((el) =>
        isFrameLikeElement(el),
      )
    ) {
      rejectedGroupIds.add(groupId);
    }
  }

  const ret: DucElement[] = [];

  for (const element of elements.values()) {
    if (!rejectedGroupIds.has(element.groupIds[element.groupIds.length - 1])) {
      ret.push(element);
    }
  }

  return ret;
};

/**
 * depending on the appState, return target frame, which is the frame the given element
 * is going to be added to or remove from
 */
export const getTargetFrame = (
  element: DucElement,
  elementsMap: ElementsMap,
  appState: StaticCanvasAppState,
) => {
  const _element = isTextElement(element)
    ? getContainerElement(element, elementsMap) || element
    : element;

  return appState.selectedElementIds[_element.id] &&
    appState.selectedElementsAreBeingDragged
    ? appState.frameToHighlight
    : getContainingFrame(_element, elementsMap);
};

// TODO: this a huge bottleneck for large scenes, optimise
// given an element, return if the element is in some frame
export const isElementInFrame = (
  element: DucElement,
  allElementsMap: ElementsMap,
  appState: StaticCanvasAppState,
) => {
  const frame = getTargetFrame(element, allElementsMap, appState);
  const _element = isTextElement(element)
    ? getContainerElement(element, allElementsMap) || element
    : element;

  if (frame) {
    // Perf improvement:
    // For an element that's already in a frame, if it's not being dragged
    // then there is no need to refer to geometry (which, yes, is slow) to check if it's in a frame.
    // It has to be in its containing frame.
    if (
      !appState.selectedElementIds[element.id] ||
      !appState.selectedElementsAreBeingDragged
    ) {
      return true;
    }

    if (_element.groupIds.length === 0) {
      return elementOverlapsWithFrame(_element, frame, allElementsMap);
    }

    const allElementsInGroup = new Set(
      _element.groupIds.flatMap((gid) =>
        getElementsInGroup(allElementsMap, gid),
      ),
    );

    if (appState.editingGroupId && appState.selectedElementsAreBeingDragged) {
      const selectedElements = new Set(
        getSelectedElements(allElementsMap, appState),
      );

      const editingGroupOverlapsFrame = appState.frameToHighlight !== null;

      if (editingGroupOverlapsFrame) {
        return true;
      }

      selectedElements.forEach((selectedElement) => {
        allElementsInGroup.delete(selectedElement);
      });
    }

    for (const elementInGroup of allElementsInGroup) {
      if (isFrameLikeElement(elementInGroup)) {
        return false;
      }
    }

    for (const elementInGroup of allElementsInGroup) {
      if (elementOverlapsWithFrame(elementInGroup, frame, allElementsMap)) {
        return true;
      }
    }
  }

  return false;
};

export const getFrameLikeTitle = (element: DucFrameLikeElement) => {
  // TODO name frames "AI" only if specific to AI frames
  return element.name === null
    ? isFrameElement(element)
      ? "Frame"
      : "AI Frame"
    : element.name;
};

export const getElementsOverlappingFrame = (
  elements: readonly DucElement[],
  frame: DucFrameLikeElement,
) => {
  return (
    elementsOverlappingBBox({
      elements,
      bounds: frame,
      type: "overlap",
    })
      // removes elements who are overlapping, but are in a different frame,
      // and thus invisible in target frame
      .filter((el) => !el.frameId || el.frameId === frame.id)
  );
};
