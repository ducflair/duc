import * as GA from "../ga";
import * as GAPoint from "../gapoints";
import * as GADirection from "../gadirections";
import * as GALine from "../galines";
import * as GATransform from "../gatransforms";

import type {
  DucBindableElement,
  DucElement,
  DucRectangleElement,
  DucDiamondElement,
  DucEllipseElement,
  DucFreeDrawElement,
  DucImageElement,
  DucFrameLikeElement,
  DucIframeLikeElement,
  NonDeleted,
  DucLinearElement,
  PointBinding,
  NonDeletedDucElement,
  ElementsMap,
  NonDeletedSceneElementsMap,
  DucTextElement,
  DucArrowElement,
  OrderedDucElement,
  DucElbowArrowElement,
  FixedPoint,
  SceneElementsMap,
} from "./types";

import type { Bounds } from "./bounds";
import { getElementAbsoluteCoords } from "./bounds";
import type { AppState, Point } from "../types";
import { isPointOnShape } from "../../utils/collision";
import { getElementAtPosition } from "../scene";
import {
  isArrowElement,
  isBindableElement,
  isBindingElement,
  isBoundToContainer,
  isElbowArrow,
  isFrameLikeElement,
  isLinearElement,
  isRectangularElement,
  isTextElement,
} from "./typeChecks";
import type { ElementUpdate } from "./mutateElement";
import { mutateElement } from "./mutateElement";
import type Scene from "../scene/Scene";
import { LinearElementEditor } from "./linearElementEditor";
import { arrayToMap, convertPointToTuple, tupleToCoors } from "../utils";
import { KEYS } from "../keys";
import { getBoundTextElement, handleBindTextResize } from "./textElement";
import { getElementShape } from "../shapes";
import {
  aabbForElement,
  clamp,
  distanceSq2d,
  getCenterForBounds,
  getCenterForElement,
  pointInsideBounds,
  pointToVector,
  rotatePoint,
} from "../math";
import {
  compareHeading,
  HEADING_DOWN,
  HEADING_LEFT,
  HEADING_RIGHT,
  HEADING_UP,
  headingForPointFromElement,
  vectorToHeading,
  type Heading,
} from "./heading";
import { segmentIntersectRectangleElement } from "../../utils/geometry/geometry";

export type SuggestedBinding =
  | NonDeleted<DucBindableElement>
  | SuggestedPointBinding;

export type SuggestedPointBinding = [
  NonDeleted<DucLinearElement>,
  "start" | "end" | "both",
  NonDeleted<DucBindableElement>,
];

export const shouldEnableBindingForPointerEvent = (
  event: React.PointerEvent<HTMLElement>,
) => {
  return !event[KEYS.CTRL_OR_CMD];
};

export const isBindingEnabled = (appState: AppState): boolean => {
  return appState.isBindingEnabled;
};

export const FIXED_BINDING_DISTANCE = 5;

const getNonDeletedElements = (
  scene: Scene,
  ids: readonly DucElement["id"][],
): NonDeleted<DucElement>[] => {
  const result: NonDeleted<DucElement>[] = [];
  ids.forEach((id) => {
    const element = scene.getNonDeletedElement(id);
    if (element != null) {
      result.push(element);
    }
  });
  return result;
};

export const bindOrUnbindLinearElement = (
  linearElement: NonDeleted<DucLinearElement>,
  startBindingElement: DucBindableElement | null | "keep",
  endBindingElement: DucBindableElement | null | "keep",
  elementsMap: NonDeletedSceneElementsMap,
  scene: Scene,
): void => {
  const boundToElementIds: Set<DucBindableElement["id"]> = new Set();
  const unboundFromElementIds: Set<DucBindableElement["id"]> = new Set();
  bindOrUnbindLinearElementEdge(
    linearElement,
    startBindingElement,
    endBindingElement,
    "start",
    boundToElementIds,
    unboundFromElementIds,
    elementsMap,
  );
  bindOrUnbindLinearElementEdge(
    linearElement,
    endBindingElement,
    startBindingElement,
    "end",
    boundToElementIds,
    unboundFromElementIds,
    elementsMap,
  );

  const onlyUnbound = Array.from(unboundFromElementIds).filter(
    (id) => !boundToElementIds.has(id),
  );

  getNonDeletedElements(scene, onlyUnbound).forEach((element) => {
    mutateElement(element, {
      boundElements: element.boundElements?.filter(
        (element) =>
          element.type !== "arrow" || element.id !== linearElement.id,
      ),
    });
  });
};

const bindOrUnbindLinearElementEdge = (
  linearElement: NonDeleted<DucLinearElement>,
  bindableElement: DucBindableElement | null | "keep",
  otherEdgeBindableElement: DucBindableElement | null | "keep",
  startOrEnd: "start" | "end",
  // Is mutated
  boundToElementIds: Set<DucBindableElement["id"]>,
  // Is mutated
  unboundFromElementIds: Set<DucBindableElement["id"]>,
  elementsMap: NonDeletedSceneElementsMap,
): void => {
  // "keep" is for method chaining convenience, a "no-op", so just bail out
  if (bindableElement === "keep") {
    return;
  }

  // null means break the bind, so nothing to consider here
  if (bindableElement === null) {
    const unbound = unbindLinearElement(linearElement, startOrEnd);
    if (unbound != null) {
      unboundFromElementIds.add(unbound);
    }
    return;
  }

  // While complext arrows can do anything, simple arrow with both ends trying
  // to bind to the same bindable should not be allowed, start binding takes
  // precedence
  if (isLinearElementSimple(linearElement)) {
    if (
      otherEdgeBindableElement == null ||
      (otherEdgeBindableElement === "keep"
        ? // TODO: Refactor - Needlessly complex
          !isLinearElementSimpleAndAlreadyBoundOnOppositeEdge(
            linearElement,
            bindableElement,
            startOrEnd,
          )
        : startOrEnd === "start" ||
          otherEdgeBindableElement.id !== bindableElement.id)
    ) {
      bindLinearElement(
        linearElement,
        bindableElement,
        startOrEnd,
        elementsMap,
      );
      boundToElementIds.add(bindableElement.id);
    }
  } else {
    bindLinearElement(linearElement, bindableElement, startOrEnd, elementsMap);
    boundToElementIds.add(bindableElement.id);
  }
};

const getOriginalBindingIfStillCloseOfLinearElementEdge = (
  linearElement: NonDeleted<DucLinearElement>,
  edge: "start" | "end",
  elementsMap: NonDeletedSceneElementsMap,
): NonDeleted<DucElement> | null => {
  const coors = getLinearElementEdgeCoors(linearElement, edge, elementsMap);
  const elementId =
    edge === "start"
      ? linearElement.startBinding?.elementId
      : linearElement.endBinding?.elementId;
  if (elementId) {
    const element = elementsMap.get(elementId);
    if (
      isBindableElement(element) &&
      bindingBorderTest(element, coors, elementsMap)
    ) {
      return element;
    }
  }

  return null;
};

const getOriginalBindingsIfStillCloseToArrowEnds = (
  linearElement: NonDeleted<DucLinearElement>,
  elementsMap: NonDeletedSceneElementsMap,
): (NonDeleted<DucElement> | null)[] =>
  ["start", "end"].map((edge) =>
    getOriginalBindingIfStillCloseOfLinearElementEdge(
      linearElement,
      edge as "start" | "end",
      elementsMap,
    ),
  );

const getBindingStrategyForDraggingArrowEndpoints = (
  selectedElement: NonDeleted<DucLinearElement>,
  isBindingEnabled: boolean,
  draggingPoints: readonly number[],
  elementsMap: NonDeletedSceneElementsMap,
  elements: readonly NonDeletedDucElement[],
): (NonDeleted<DucBindableElement> | null | "keep")[] => {
  const startIdx = 0;
  const endIdx = selectedElement.points.length - 1;
  const startDragged = draggingPoints.findIndex((i) => i === startIdx) > -1;
  const endDragged = draggingPoints.findIndex((i) => i === endIdx) > -1;
  const start = startDragged
    ? isBindingEnabled
      ? getElligibleElementForBindingElement(
          selectedElement,
          "start",
          elementsMap,
          elements,
        )
      : null // If binding is disabled and start is dragged, break all binds
    : // We have to update the focus and gap of the binding, so let's rebind
      getElligibleElementForBindingElement(
        selectedElement,
        "start",
        elementsMap,
        elements,
      );
  const end = endDragged
    ? isBindingEnabled
      ? getElligibleElementForBindingElement(
          selectedElement,
          "end",
          elementsMap,
          elements,
        )
      : null // If binding is disabled and end is dragged, break all binds
    : // We have to update the focus and gap of the binding, so let's rebind
      getElligibleElementForBindingElement(
        selectedElement,
        "end",
        elementsMap,
        elements,
      );

  return [start, end];
};

const getBindingStrategyForDraggingArrowOrJoints = (
  selectedElement: NonDeleted<DucLinearElement>,
  elementsMap: NonDeletedSceneElementsMap,
  elements: readonly NonDeletedDucElement[],
  isBindingEnabled: boolean,
): (NonDeleted<DucBindableElement> | null | "keep")[] => {
  const [startIsClose, endIsClose] = getOriginalBindingsIfStillCloseToArrowEnds(
    selectedElement,
    elementsMap,
  );
  const start = startIsClose
    ? isBindingEnabled
      ? getElligibleElementForBindingElement(
          selectedElement,
          "start",
          elementsMap,
          elements,
        )
      : null
    : null;
  const end = endIsClose
    ? isBindingEnabled
      ? getElligibleElementForBindingElement(
          selectedElement,
          "end",
          elementsMap,
          elements,
        )
      : null
    : null;

  return [start, end];
};

export const bindOrUnbindLinearElements = (
  selectedElements: NonDeleted<DucLinearElement>[],
  elementsMap: NonDeletedSceneElementsMap,
  elements: readonly NonDeletedDucElement[],
  scene: Scene,
  isBindingEnabled: boolean,
  draggingPoints: readonly number[] | null,
): void => {
  selectedElements.forEach((selectedElement) => {
    const [start, end] = draggingPoints?.length
      ? // The arrow edge points are dragged (i.e. start, end)
        getBindingStrategyForDraggingArrowEndpoints(
          selectedElement,
          isBindingEnabled,
          draggingPoints ?? [],
          elementsMap,
          elements,
        )
      : // The arrow itself (the shaft) or the inner joins are dragged
        getBindingStrategyForDraggingArrowOrJoints(
          selectedElement,
          elementsMap,
          elements,
          isBindingEnabled,
        );

    bindOrUnbindLinearElement(selectedElement, start, end, elementsMap, scene);
  });
};

export const getSuggestedBindingsForArrows = (
  selectedElements: NonDeleted<DucElement>[],
  elementsMap: NonDeletedSceneElementsMap,
): SuggestedBinding[] => {
  // HOT PATH: Bail out if selected elements list is too large
  if (selectedElements.length > 50) {
    return [];
  }

  return (
    selectedElements
      .filter(isLinearElement)
      .flatMap((element) =>
        getOriginalBindingsIfStillCloseToArrowEnds(element, elementsMap),
      )
      .filter(
        (element): element is NonDeleted<DucBindableElement> =>
          element !== null,
      )
      // Filter out bind candidates which are in the
      // same selection / group with the arrow
      //
      // TODO: Is it worth turning the list into a set to avoid dupes?
      .filter(
        (element) =>
          selectedElements.filter((selected) => selected.id === element?.id)
            .length === 0,
      )
  );
};

export const maybeBindLinearElement = (
  linearElement: NonDeleted<DucLinearElement>,
  appState: AppState,
  pointerCoords: { x: number; y: number },
  elementsMap: NonDeletedSceneElementsMap,
  elements: readonly NonDeletedDucElement[],
): void => {
  if (appState.startBoundElement != null) {
    bindLinearElement(
      linearElement,
      appState.startBoundElement,
      "start",
      elementsMap,
    );
  }

  const hoveredElement = getHoveredElementForBinding(
    pointerCoords,
    elements,
    elementsMap,
    isElbowArrow(linearElement) && isElbowArrow(linearElement),
  );

  if (hoveredElement !== null) {
    if (
      !isLinearElementSimpleAndAlreadyBoundOnOppositeEdge(
        linearElement,
        hoveredElement,
        "end",
      )
    ) {
      bindLinearElement(linearElement, hoveredElement, "end", elementsMap);
    }
  }
};

export const bindLinearElement = (
  linearElement: NonDeleted<DucLinearElement>,
  hoveredElement: DucBindableElement,
  startOrEnd: "start" | "end",
  elementsMap: NonDeletedSceneElementsMap,
): void => {
  if (!isArrowElement(linearElement)) {
    return;
  }
  const binding: PointBinding = {
    elementId: hoveredElement.id,
    ...calculateFocusAndGap(
      linearElement,
      hoveredElement,
      startOrEnd,
      elementsMap,
    ),
    ...(isElbowArrow(linearElement)
      ? calculateFixedPointForElbowArrowBinding(
          linearElement,
          hoveredElement,
          startOrEnd,
          elementsMap,
        )
      : { fixedPoint: null }),
  };

  mutateElement(linearElement, {
    [startOrEnd === "start" ? "startBinding" : "endBinding"]: binding,
  });

  const boundElementsMap = arrayToMap(hoveredElement.boundElements || []);
  if (!boundElementsMap.has(linearElement.id)) {
    mutateElement(hoveredElement, {
      boundElements: (hoveredElement.boundElements || []).concat({
        id: linearElement.id,
        type: "arrow",
      }),
    });
  }
};

// Don't bind both ends of a simple segment
const isLinearElementSimpleAndAlreadyBoundOnOppositeEdge = (
  linearElement: NonDeleted<DucLinearElement>,
  bindableElement: DucBindableElement,
  startOrEnd: "start" | "end",
): boolean => {
  const otherBinding =
    linearElement[startOrEnd === "start" ? "endBinding" : "startBinding"];
  return isLinearElementSimpleAndAlreadyBound(
    linearElement,
    otherBinding?.elementId,
    bindableElement,
  );
};

export const isLinearElementSimpleAndAlreadyBound = (
  linearElement: NonDeleted<DucLinearElement>,
  alreadyBoundToId: DucBindableElement["id"] | undefined,
  bindableElement: DucBindableElement,
): boolean => {
  return (
    alreadyBoundToId === bindableElement.id &&
    isLinearElementSimple(linearElement)
  );
};

const isLinearElementSimple = (
  linearElement: NonDeleted<DucLinearElement>,
): boolean => linearElement.points.length < 3;

const unbindLinearElement = (
  linearElement: NonDeleted<DucLinearElement>,
  startOrEnd: "start" | "end",
): DucBindableElement["id"] | null => {
  const field = startOrEnd === "start" ? "startBinding" : "endBinding";
  const binding = linearElement[field];
  if (binding == null) {
    return null;
  }
  mutateElement(linearElement, { [field]: null });
  return binding.elementId;
};

export const getHoveredElementForBinding = (
  pointerCoords: {
    x: number;
    y: number;
  },
  elements: readonly NonDeletedDucElement[],
  elementsMap: NonDeletedSceneElementsMap,
  fullShape?: boolean,
): NonDeleted<DucBindableElement> | null => {
  const hoveredElement = getElementAtPosition(
    elements,
    (element) =>
      isBindableElement(element, false) &&
      bindingBorderTest(
        element,
        pointerCoords,
        elementsMap,
        // disable fullshape snapping for frame elements so we
        // can bind to frame children
        fullShape && !isFrameLikeElement(element),
      ),
  );
  return hoveredElement as NonDeleted<DucBindableElement> | null;
};

const calculateFocusAndGap = (
  linearElement: NonDeleted<DucLinearElement>,
  hoveredElement: DucBindableElement,
  startOrEnd: "start" | "end",
  elementsMap: NonDeletedSceneElementsMap,
): { focus: number; gap: number } => {
  const direction = startOrEnd === "start" ? -1 : 1;
  const edgePointIndex = direction === -1 ? 0 : linearElement.points.length - 1;
  const adjacentPointIndex = edgePointIndex - direction;

  const edgePoint = LinearElementEditor.getPointAtIndexGlobalCoordinates(
    linearElement,
    edgePointIndex,
    elementsMap,
  );
  const adjacentPoint = LinearElementEditor.getPointAtIndexGlobalCoordinates(
    linearElement,
    adjacentPointIndex,
    elementsMap,
  );
  return {
    focus: determineFocusDistance(
      hoveredElement,
      adjacentPoint,
      edgePoint,
      elementsMap,
    ),
    gap: Math.max(
      1,
      distanceToBindableElement(hoveredElement, edgePoint, elementsMap),
    ),
  };
};

// Supports translating, rotating and scaling `changedElement` with bound
// linear elements.
// Because scaling involves moving the focus points as well, it is
// done before the `changedElement` is updated, and the `newSize` is passed
// in explicitly.
export const updateBoundElements = (
  changedElement: NonDeletedDucElement,
  elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  options?: {
    simultaneouslyUpdated?: readonly DucElement[];
    oldSize?: { width: number; height: number };
    changedElements?: Map<string, OrderedDucElement>;
  },
) => {
  const { oldSize, simultaneouslyUpdated, changedElements } = options ?? {};
  const simultaneouslyUpdatedElementIds = getSimultaneouslyUpdatedElementIds(
    simultaneouslyUpdated,
  );

  if (!isBindableElement(changedElement)) {
    return;
  }

  boundElementsVisitor(elementsMap, changedElement, (element) => {
    if (!isLinearElement(element) || element.isDeleted) {
      return;
    }

    // In case the boundElements are stale
    if (!doesNeedUpdate(element, changedElement)) {
      return;
    }

    const bindings = {
      startBinding: maybeCalculateNewGapWhenScaling(
        changedElement,
        element.startBinding,
        oldSize,
      ),
      endBinding: maybeCalculateNewGapWhenScaling(
        changedElement,
        element.endBinding,
        oldSize,
      ),
    };

    // `linearElement` is being moved/scaled already, just update the binding
    if (simultaneouslyUpdatedElementIds.has(element.id)) {
      mutateElement(element, bindings);
      return;
    }

    const updates = bindableElementsVisitor(
      elementsMap,
      element,
      (bindableElement, bindingProp) => {
        if (
          bindableElement &&
          isBindableElement(bindableElement) &&
          (bindingProp === "startBinding" || bindingProp === "endBinding") &&
          changedElement.id === element[bindingProp]?.elementId
        ) {
          const point = updateBoundPoint(
            element,
            bindingProp,
            bindings[bindingProp],
            bindableElement,
            elementsMap,
          );
          if (point) {
            return {
              index:
                bindingProp === "startBinding" ? 0 : element.points.length - 1,
              point,
            };
          }
        }

        return null;
      },
    ).filter(
      (
        update,
      ): update is NonNullable<{
        index: number;
        point: Point;
        isDragging?: boolean;
      }> => update !== null,
    );

    LinearElementEditor.movePoints(
      element,
      updates,
      elementsMap,
      {
        ...(changedElement.id === element.startBinding?.elementId
          ? { startBinding: bindings.startBinding }
          : {}),
        ...(changedElement.id === element.endBinding?.elementId
          ? { endBinding: bindings.endBinding }
          : {}),
      },
      {
        changedElements,
      },
    );

    const boundText = getBoundTextElement(element, elementsMap);
    if (boundText && !boundText.isDeleted) {
      handleBindTextResize(element, elementsMap, false);
    }
  });
};

const doesNeedUpdate = (
  boundElement: NonDeleted<DucLinearElement>,
  changedElement: DucBindableElement,
) => {
  return (
    boundElement.startBinding?.elementId === changedElement.id ||
    boundElement.endBinding?.elementId === changedElement.id
  );
};

const getSimultaneouslyUpdatedElementIds = (
  simultaneouslyUpdated: readonly DucElement[] | undefined,
): Set<DucElement["id"]> => {
  return new Set((simultaneouslyUpdated || []).map((element) => element.id));
};

export const getHeadingForElbowArrowSnap = (
  point: Readonly<Point>,
  otherPoint: Readonly<Point>,
  bindableElement: DucBindableElement | undefined | null,
  aabb: Bounds | undefined | null,
  elementsMap: ElementsMap,
  origPoint: Point,
): Heading => {
  const otherPointHeading = vectorToHeading(pointToVector(otherPoint, point));

  if (!bindableElement || !aabb) {
    return otherPointHeading;
  }

  const distance = getDistanceForBinding(
    origPoint,
    bindableElement,
    elementsMap,
  );

  if (!distance) {
    return vectorToHeading(
      pointToVector(point, getCenterForElement(bindableElement)),
    );
  }

  const pointHeading = headingForPointFromElement(bindableElement, aabb, point);

  return pointHeading;
};

const getDistanceForBinding = (
  point: Readonly<Point>,
  bindableElement: DucBindableElement,
  elementsMap: ElementsMap,
) => {
  const distance = distanceToBindableElement(
    bindableElement,
    point,
    elementsMap,
  );
  const bindDistance = maxBindingGap(
    bindableElement,
    bindableElement.width,
    bindableElement.height,
  );

  return distance > bindDistance ? null : distance;
};

export const bindPointToSnapToElementOutline = (
  point: Readonly<Point>,
  otherPoint: Readonly<Point>,
  bindableElement: DucBindableElement | undefined,
  elementsMap: ElementsMap,
): Point => {
  const aabb = bindableElement && aabbForElement(bindableElement);

  if (bindableElement && aabb) {
    // TODO: Dirty hacks until tangents are properly calculated
    const heading = headingForPointFromElement(bindableElement, aabb, point);
    const intersections = [
      ...intersectElementWithLine(
        bindableElement,
        {x: point.x, y: point.y - 2 * bindableElement.height},
        {x: point.x, y: point.y + 2 * bindableElement.height},
        FIXED_BINDING_DISTANCE,
        elementsMap,
      ),
      ...intersectElementWithLine(
        bindableElement,
        {x: point.x - 2 * bindableElement.width, y: point.y},
        {x: point.x + 2 * bindableElement.width, y: point.y},
        FIXED_BINDING_DISTANCE,
        elementsMap,
      ),
    ];

    const isVertical =
      compareHeading(heading, HEADING_LEFT) ||
      compareHeading(heading, HEADING_RIGHT);
    const dist = Math.abs(
      distanceToBindableElement(bindableElement, point, elementsMap),
    );
    const isInner = isVertical
      ? dist < bindableElement.width * -0.1
      : dist < bindableElement.height * -0.1;

    intersections.sort(
      (a, b) => distanceSq2d(a, point) - distanceSq2d(b, point),
    );

    return isInner
      ? headingToMidBindPoint(otherPoint, bindableElement, aabb)
      : intersections.filter((i) =>
          isVertical
            ? Math.abs(point.y - i.y) < 0.1
            : Math.abs(point.x - i.x) < 0.1,
        )[0] ?? point;
  }

  return point;
};

const headingToMidBindPoint = (
  point: Point,
  bindableElement: DucBindableElement,
  aabb: Bounds,
): Point => {
  const center = getCenterForBounds(aabb);
  const heading = vectorToHeading(pointToVector(point, center));

  switch (true) {
    case compareHeading(heading, HEADING_UP):
      return rotatePoint(
        {x: (aabb[0] + aabb[2]) / 2 + 0.1, y: aabb[1]},
        center,
        bindableElement.angle,
      );
    case compareHeading(heading, HEADING_RIGHT):
      return rotatePoint(
        {x: aabb[2], y:(aabb[1] + aabb[3]) / 2 + 0.1},
        center,
        bindableElement.angle,
      );
    case compareHeading(heading, HEADING_DOWN):
      return rotatePoint(
        {x: (aabb[0] + aabb[2]) / 2 - 0.1, y: aabb[3]},
        center,
        bindableElement.angle,
      );
    default:
      return rotatePoint(
        {x: aabb[0], y:(aabb[1] + aabb[3]) / 2 - 0.1},
        center,
        bindableElement.angle,
      );
  }
};

export const avoidRectangularCorner = (
  element: DucBindableElement,
  p: Point,
): Point => {
  const center = getCenterForElement(element);
  const nonRotatedPoint = rotatePoint(p, center, -element.angle);

  if (nonRotatedPoint.x < element.x && nonRotatedPoint.y < element.y) {
    // Top left
    if (nonRotatedPoint.y - element.y > -FIXED_BINDING_DISTANCE) {
      return rotatePoint(
        {x: element.x - FIXED_BINDING_DISTANCE, y: element.y},
        center,
        element.angle,
      );
    }
    return rotatePoint(
      {x:element.x, y:element.y - FIXED_BINDING_DISTANCE},
      center,
      element.angle,
    );
  } else if (
    nonRotatedPoint.x < element.x &&
    nonRotatedPoint.y > element.y + element.height
  ) {
    // Bottom left
    if (nonRotatedPoint.x - element.x > -FIXED_BINDING_DISTANCE) {
      return rotatePoint(
        {x: element.x, y: element.y + element.height + FIXED_BINDING_DISTANCE},
        center,
        element.angle,
      );
    }
    return rotatePoint(
      {x: element.x - FIXED_BINDING_DISTANCE, y: element.y + element.height},
      center,
      element.angle,
    );
  } else if (
    nonRotatedPoint.x > element.x + element.width &&
    nonRotatedPoint.y > element.y + element.height
  ) {
    // Bottom right
    if (
      nonRotatedPoint.x - element.x <
      element.width + FIXED_BINDING_DISTANCE
    ) {
      return rotatePoint(
        {
          x:element.x + element.width,
          y:element.y + element.height + FIXED_BINDING_DISTANCE,
        },
        center,
        element.angle,
      );
    }
    return rotatePoint(
      {
        x:element.x + element.width + FIXED_BINDING_DISTANCE,
        y:element.y + element.height,
      },
      center,
      element.angle,
    );
  } else if (
    nonRotatedPoint.x > element.x + element.width &&
    nonRotatedPoint.y < element.y
  ) {
    // Top right
    if (
      nonRotatedPoint.x - element.x <
      element.width + FIXED_BINDING_DISTANCE
    ) {
      return rotatePoint(
        {x:element.x + element.width, y:element.y - FIXED_BINDING_DISTANCE},
        center,
        element.angle,
      );
    }
    return rotatePoint(
      {x:element.x + element.width + FIXED_BINDING_DISTANCE, y:element.y},
      center,
      element.angle,
    );
  }

  return p;
};

export const snapToMid = (
  element: DucBindableElement,
  p: Point,
  tolerance: number = 0.05,
): Point => {
  const { x, y, width, height, angle } = element;
  const center = {x: x + width / 2 - 0.1, y: y + height / 2 - 0.1} as Point;
  const nonRotated = rotatePoint(p, center, -angle);

  // snap-to-center point is adaptive to element size, but we don't want to go
  // above and below certain px distance
  const verticalThrehsold = clamp(tolerance * height, 5, 80);
  const horizontalThrehsold = clamp(tolerance * width, 5, 80);

  if (
    nonRotated.x <= x + width / 2 &&
    nonRotated.y > center.y - verticalThrehsold &&
    nonRotated.y < center.y + verticalThrehsold
  ) {
    // LEFT
    return rotatePoint({x:x - FIXED_BINDING_DISTANCE, y:center.y}, center, angle);
  } else if (
    nonRotated.y <= y + height / 2 &&
    nonRotated.x > center.x - horizontalThrehsold &&
    nonRotated.x < center.x + horizontalThrehsold
  ) {
    // TOP
    return rotatePoint({x:center.x, y:y - FIXED_BINDING_DISTANCE}, center, angle);
  } else if (
    nonRotated.x >= x + width / 2 &&
    nonRotated.y > center.y - verticalThrehsold &&
    nonRotated.y < center.y + verticalThrehsold
  ) {
    // RIGHT
    return rotatePoint(
      {x:x + width + FIXED_BINDING_DISTANCE, y:center.y},
      center,
      angle,
    );
  } else if (
    nonRotated.y >= y + height / 2 &&
    nonRotated.x > center.x - horizontalThrehsold &&
    nonRotated.x < center.x + horizontalThrehsold
  ) {
    // DOWN
    return rotatePoint(
      {x: center.x, y: y + height + FIXED_BINDING_DISTANCE},
      center,
      angle,
    );
  }

  return p;
};

const updateBoundPoint = (
  linearElement: NonDeleted<DucLinearElement>,
  startOrEnd: "startBinding" | "endBinding",
  binding: PointBinding | null | undefined,
  bindableElement: DucBindableElement,
  elementsMap: ElementsMap,
): Point | null => {
  if (
    binding == null ||
    // We only need to update the other end if this is a 2 point line element
    (binding.elementId !== bindableElement.id &&
      linearElement.points.length > 2)
  ) {
    return null;
  }

  const direction = startOrEnd === "startBinding" ? -1 : 1;
  const edgePointIndex = direction === -1 ? 0 : linearElement.points.length - 1;

  if (isElbowArrow(linearElement)) {
    const fixedPoint =
      normalizeFixedPoint(binding.fixedPoint) ??
      calculateFixedPointForElbowArrowBinding(
        linearElement,
        bindableElement,
        startOrEnd === "startBinding" ? "start" : "end",
        elementsMap,
      ).fixedPoint;
    const globalMidPoint = {
      x: bindableElement.x + bindableElement.width / 2,
      y: bindableElement.y + bindableElement.height / 2,
    } as Point;
    const global = {
      x: bindableElement.x + fixedPoint.x * bindableElement.width,
      y: bindableElement.y + fixedPoint.y * bindableElement.height,
     } as Point;
    const rotatedGlobal = rotatePoint(
      global,
      globalMidPoint,
      bindableElement.angle,
    );

    return LinearElementEditor.pointFromAbsoluteCoords(
      linearElement,
      rotatedGlobal,
      elementsMap,
    );
  }

  const adjacentPointIndex = edgePointIndex - direction;
  const adjacentPoint = LinearElementEditor.getPointAtIndexGlobalCoordinates(
    linearElement,
    adjacentPointIndex,
    elementsMap,
  );
  const focusPointAbsolute = determineFocusPoint(
    bindableElement,
    binding.focus,
    adjacentPoint,
    elementsMap,
  );

  let newEdgePoint: Point;

  // The linear element was not originally pointing inside the bound shape,
  // we can point directly at the focus point
  if (binding.gap === 0) {
    newEdgePoint = focusPointAbsolute;
  } else {
    const intersections = intersectElementWithLine(
      bindableElement,
      adjacentPoint,
      focusPointAbsolute,
      binding.gap,
      elementsMap,
    );
    if (intersections.length === 0) {
      // This should never happen, since focusPoint should always be
      // inside the element, but just in case, bail out
      newEdgePoint = focusPointAbsolute;
    } else {
      // Guaranteed to intersect because focusPoint is always inside the shape
      newEdgePoint = intersections[0];
    }
  }

  return LinearElementEditor.pointFromAbsoluteCoords(
    linearElement,
    newEdgePoint,
    elementsMap,
  );
};

export const calculateFixedPointForElbowArrowBinding = (
  linearElement: NonDeleted<DucElbowArrowElement>,
  hoveredElement: DucBindableElement,
  startOrEnd: "start" | "end",
  elementsMap: ElementsMap,
): { fixedPoint: FixedPoint } => {
  const bounds = [
    hoveredElement.x,
    hoveredElement.y,
    hoveredElement.x + hoveredElement.width,
    hoveredElement.y + hoveredElement.height,
  ] as Bounds;
  const edgePointIndex =
    startOrEnd === "start" ? 0 : linearElement.points.length - 1;
  const globalPoint = LinearElementEditor.getPointAtIndexGlobalCoordinates(
    linearElement,
    edgePointIndex,
    elementsMap,
  );
  const otherGlobalPoint = LinearElementEditor.getPointAtIndexGlobalCoordinates(
    linearElement,
    edgePointIndex,
    elementsMap,
  );
  const snappedPoint = bindPointToSnapToElementOutline(
    globalPoint,
    otherGlobalPoint,
    hoveredElement,
    elementsMap,
  );
  const globalMidPoint = {
    x: bounds[0] + (bounds[2] - bounds[0]) / 2,
    y: bounds[1] + (bounds[3] - bounds[1]) / 2,
   } as Point;
  const nonRotatedSnappedGlobalPoint = rotatePoint(
    snappedPoint,
    globalMidPoint,
    -hoveredElement.angle,
  ) as Point;

  return {
    fixedPoint: normalizeFixedPoint({
      x: (nonRotatedSnappedGlobalPoint.x - hoveredElement.x) /
        hoveredElement.width,
      y: (nonRotatedSnappedGlobalPoint.y - hoveredElement.y) /
        hoveredElement.height,
    }),
  }
};

const maybeCalculateNewGapWhenScaling = (
  changedElement: DucBindableElement,
  currentBinding: PointBinding | null | undefined,
  newSize: { width: number; height: number } | undefined,
): PointBinding | null | undefined => {
  if (currentBinding == null || newSize == null) {
    return currentBinding;
  }
  const { width: newWidth, height: newHeight } = newSize;
  const { width, height } = changedElement;
  const newGap = Math.max(
    1,
    Math.min(
      maxBindingGap(changedElement, newWidth, newHeight),
      currentBinding.gap *
        (newWidth < newHeight ? newWidth / width : newHeight / height),
    ),
  );

  return { ...currentBinding, gap: newGap };
};

const getElligibleElementForBindingElement = (
  linearElement: NonDeleted<DucLinearElement>,
  startOrEnd: "start" | "end",
  elementsMap: NonDeletedSceneElementsMap,
  elements: readonly NonDeletedDucElement[],
): NonDeleted<DucBindableElement> | null => {
  return getHoveredElementForBinding(
    getLinearElementEdgeCoors(linearElement, startOrEnd, elementsMap),
    elements,
    elementsMap,
  );
};

const getLinearElementEdgeCoors = (
  linearElement: NonDeleted<DucLinearElement>,
  startOrEnd: "start" | "end",
  elementsMap: NonDeletedSceneElementsMap,
): { x: number; y: number } => {
  const index = startOrEnd === "start" ? 0 : -1;
  return LinearElementEditor.getPointAtIndexGlobalCoordinates(
    linearElement,
    index,
    elementsMap,
  ) as { x: number; y: number };
};

// We need to:
// 1: Update elements not selected to point to duplicated elements
// 2: Update duplicated elements to point to other duplicated elements
export const fixBindingsAfterDuplication = (
  sceneElements: readonly DucElement[],
  oldElements: readonly DucElement[],
  oldIdToDuplicatedId: Map<DucElement["id"], DucElement["id"]>,
  // There are three copying mechanisms: Copy-paste, duplication and alt-drag.
  // Only when alt-dragging the new "duplicates" act as the "old", while
  // the "old" elements act as the "new copy" - essentially working reverse
  // to the other two.
  duplicatesServeAsOld?: "duplicatesServeAsOld" | undefined,
): void => {
  // First collect all the binding/bindable elements, so we only update
  // each once, regardless of whether they were duplicated or not.
  const allBoundElementIds: Set<DucElement["id"]> = new Set();
  const allBindableElementIds: Set<DucElement["id"]> = new Set();
  const shouldReverseRoles = duplicatesServeAsOld === "duplicatesServeAsOld";
  const duplicateIdToOldId = new Map(
    [...oldIdToDuplicatedId].map(([key, value]) => [value, key]),
  );
  oldElements.forEach((oldElement) => {
    const { boundElements } = oldElement;
    if (boundElements != null && boundElements.length > 0) {
      boundElements.forEach((boundElement) => {
        if (shouldReverseRoles && !oldIdToDuplicatedId.has(boundElement.id)) {
          allBoundElementIds.add(boundElement.id);
        }
      });
      allBindableElementIds.add(oldIdToDuplicatedId.get(oldElement.id)!);
    }
    if (isBindingElement(oldElement)) {
      if (oldElement.startBinding != null) {
        const { elementId } = oldElement.startBinding;
        if (shouldReverseRoles && !oldIdToDuplicatedId.has(elementId)) {
          allBindableElementIds.add(elementId);
        }
      }
      if (oldElement.endBinding != null) {
        const { elementId } = oldElement.endBinding;
        if (shouldReverseRoles && !oldIdToDuplicatedId.has(elementId)) {
          allBindableElementIds.add(elementId);
        }
      }
      if (oldElement.startBinding != null || oldElement.endBinding != null) {
        allBoundElementIds.add(oldIdToDuplicatedId.get(oldElement.id)!);
      }
    }
  });

  // Update the linear elements
  (
    sceneElements.filter(({ id }) =>
      allBoundElementIds.has(id),
    ) as DucLinearElement[]
  ).forEach((element) => {
    const { startBinding, endBinding } = element;
    mutateElement(element, {
      startBinding: newBindingAfterDuplication(
        startBinding,
        oldIdToDuplicatedId,
      ),
      endBinding: newBindingAfterDuplication(endBinding, oldIdToDuplicatedId),
    });
  });

  // Update the bindable shapes
  sceneElements
    .filter(({ id }) => allBindableElementIds.has(id))
    .forEach((bindableElement) => {
      const oldElementId = duplicateIdToOldId.get(bindableElement.id);
      const boundElements = sceneElements.find(
        ({ id }) => id === oldElementId,
      )?.boundElements;

      if (boundElements && boundElements.length > 0) {
        mutateElement(bindableElement, {
          boundElements: boundElements.map((boundElement) =>
            oldIdToDuplicatedId.has(boundElement.id)
              ? {
                  id: oldIdToDuplicatedId.get(boundElement.id)!,
                  type: boundElement.type,
                }
              : boundElement,
          ),
        });
      }
    });
};

const newBindingAfterDuplication = (
  binding: PointBinding | null,
  oldIdToDuplicatedId: Map<DucElement["id"], DucElement["id"]>,
): PointBinding | null => {
  if (binding == null) {
    return null;
  }
  return {
    ...binding,
    elementId: oldIdToDuplicatedId.get(binding.elementId) ?? binding.elementId,
  };
};

export const fixBindingsAfterDeletion = (
  sceneElements: readonly DucElement[],
  deletedElements: readonly DucElement[],
): void => {
  const elements = arrayToMap(sceneElements);

  for (const element of deletedElements) {
    BoundElement.unbindAffected(elements, element, mutateElement);
    BindableElement.unbindAffected(elements, element, mutateElement);
  }
};

const newBoundElements = (
  boundElements: DucElement["boundElements"],
  idsToRemove: Set<DucElement["id"]>,
  elementsToAdd: Array<DucElement> = [],
) => {
  if (!boundElements) {
    return null;
  }

  const nextBoundElements = boundElements.filter(
    (boundElement) => !idsToRemove.has(boundElement.id),
  );

  nextBoundElements.push(
    ...elementsToAdd.map(
      (x) =>
        ({ id: x.id, type: x.type } as
          | DucArrowElement
          | DucTextElement),
    ),
  );

  return nextBoundElements;
};

export const bindingBorderTest = (
  element: NonDeleted<DucBindableElement>,
  { x, y }: { x: number; y: number },
  elementsMap: NonDeletedSceneElementsMap,
  fullShape?: boolean,
): boolean => {
  const threshold = maxBindingGap(element, element.width, element.height);
  const shape = getElementShape(element, elementsMap);
  return (
    isPointOnShape({x, y}, shape, threshold) ||
    (fullShape === true && pointInsideBounds({x, y}, aabbForElement(element)))
  );
};

export const maxBindingGap = (
  element: DucElement,
  elementWidth: number,
  elementHeight: number,
): number => {
  // Aligns diamonds with rectangles
  const shapeRatio = element.type === "diamond" ? 1 / Math.sqrt(2) : 1;
  const smallerDimension = shapeRatio * Math.min(elementWidth, elementHeight);
  // We make the bindable boundary bigger for bigger elements
  return Math.max(16, Math.min(0.25 * smallerDimension, 32));
};

export const distanceToBindableElement = (
  element: DucBindableElement,
  point: Point,
  elementsMap: ElementsMap,
): number => {
  switch (element.type) {
    case "rectangle":
    case "image":
    case "text":
    case "iframe":
    case "embeddable":
    case "frame":
    case "magicframe":
      return distanceToRectangle(element, point, elementsMap);
    case "diamond":
      return distanceToDiamond(element, point, elementsMap);
    case "ellipse":
      return distanceToEllipse(element, point, elementsMap);
  }
};

const distanceToRectangle = (
  element:
    | DucRectangleElement
    | DucTextElement
    | DucFreeDrawElement
    | DucImageElement
    | DucIframeLikeElement
    | DucFrameLikeElement,
  point: Point,
  elementsMap: ElementsMap,
): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToElement(
    element,
    point,
    elementsMap,
  );
  return Math.max(
    GAPoint.distanceToLine(pointRel, GALine.equation(0, 1, -hheight)),
    GAPoint.distanceToLine(pointRel, GALine.equation(1, 0, -hwidth)),
  );
};

const distanceToDiamond = (
  element: DucDiamondElement,
  point: Point,
  elementsMap: ElementsMap,
): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToElement(
    element,
    point,
    elementsMap,
  );
  const side = GALine.equation(hheight, hwidth, -hheight * hwidth);
  return GAPoint.distanceToLine(pointRel, side);
};

const distanceToEllipse = (
  element: DucEllipseElement,
  point: Point,
  elementsMap: ElementsMap,
): number => {
  const [pointRel, tangent] = ellipseParamsForTest(element, point, elementsMap);
  return -GALine.sign(tangent) * GAPoint.distanceToLine(pointRel, tangent);
};

const ellipseParamsForTest = (
  element: DucEllipseElement,
  point: Point,
  elementsMap: ElementsMap,
): [GA.Point, GA.Line] => {
  const [, pointRel, hwidth, hheight] = pointRelativeToElement(
    element,
    point,
    elementsMap,
  );
  const [px, py] = GAPoint.toTuple(pointRel);

  // We're working in positive quadrant, so start with `t = 45deg`, `tx=cos(t)`
  let tx = 0.707;
  let ty = 0.707;

  const a = hwidth;
  const b = hheight;

  // This is a numerical method to find the params tx, ty at which
  // the ellipse has the closest point to the given point
  [0, 1, 2, 3].forEach((_) => {
    const xx = a * tx;
    const yy = b * ty;

    const ex = ((a * a - b * b) * tx ** 3) / a;
    const ey = ((b * b - a * a) * ty ** 3) / b;

    const rx = xx - ex;
    const ry = yy - ey;

    const qx = px - ex;
    const qy = py - ey;

    const r = Math.hypot(ry, rx);
    const q = Math.hypot(qy, qx);

    tx = Math.min(1, Math.max(0, ((qx * r) / q + ex) / a));
    ty = Math.min(1, Math.max(0, ((qy * r) / q + ey) / b));
    const t = Math.hypot(ty, tx);
    tx /= t;
    ty /= t;
  });

  const closestPoint = GA.point(a * tx, b * ty);

  const tangent = GALine.orthogonalThrough(pointRel, closestPoint);
  return [pointRel, tangent];
};

// Returns:
//   1. the point relative to the elements (x, y) position
//   2. the point relative to the element's center with positive (x, y)
//   3. half element width
//   4. half element height
//
// Note that for linear elements the (x, y) position is not at the
// top right corner of their boundary.
//
// Rectangles, diamonds and ellipses are symmetrical over axes,
// and other elements have a rectangular boundary,
// so we only need to perform hit tests for the positive quadrant.
const pointRelativeToElement = (
  element: DucElement,
  pointTuple: Point,
  elementsMap: ElementsMap,
): [GA.Point, GA.Point, number, number] => {
  const point = GAPoint.from([pointTuple.x, pointTuple.y]);
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const center = coordsCenter(x1, y1, x2, y2);
  // GA has angle orientation opposite to `rotate`
  const rotate = GATransform.rotation(center, element.angle);
  const pointRotated = GATransform.apply(rotate, point);
  const pointRelToCenter = GA.sub(pointRotated, GADirection.from(center));
  const pointRelToCenterAbs = GAPoint.abs(pointRelToCenter);
  const elementPos = GA.offset(element.x, element.y);
  const pointRelToPos = GA.sub(pointRotated, elementPos);
  const halfWidth = (x2 - x1) / 2;
  const halfHeight = (y2 - y1) / 2;
  return [pointRelToPos, pointRelToCenterAbs, halfWidth, halfHeight];
};

const relativizationToElementCenter = (
  element: DucElement,
  elementsMap: ElementsMap,
): GA.Transform => {
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const center = coordsCenter(x1, y1, x2, y2);
  // GA has angle orientation opposite to `rotate`
  const rotate = GATransform.rotation(center, element.angle);
  const translate = GA.reverse(
    GATransform.translation(GADirection.from(center)),
  );
  return GATransform.compose(rotate, translate);
};

const coordsCenter = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): GA.Point => {
  return GA.point((x1 + x2) / 2, (y1 + y2) / 2);
};

// The focus distance is the oriented ratio between the size of
// the `element` and the "focus image" of the element on which
// all focus points lie, so it's a number between -1 and 1.
// The line going through `a` and `b` is a tangent to the "focus image"
// of the element.
const determineFocusDistance = (
  element: DucBindableElement,
  // Point on the line, in absolute coordinates
  a: Point,
  // Another point on the line, in absolute coordinates (closer to element)
  b: Point,
  elementsMap: ElementsMap,
): number => {
  const relateToCenter = relativizationToElementCenter(element, elementsMap);
  const aRel = GATransform.apply(relateToCenter, GAPoint.from([a.x, a.y]));
  const bRel = GATransform.apply(relateToCenter, GAPoint.from([b.x, b.y]));
  const line = GALine.through(aRel, bRel);
  const q = element.height / element.width;
  const hwidth = element.width / 2;
  const hheight = element.height / 2;
  const n = line[2];
  const m = line[3];
  const c = line[1];
  const mabs = Math.abs(m);
  const nabs = Math.abs(n);
  let ret;
  switch (element.type) {
    case "rectangle":
    case "image":
    case "text":
    case "iframe":
    case "embeddable":
    case "frame":
    case "magicframe":
      ret = c / (hwidth * (nabs + q * mabs));
      break;
    case "diamond":
      ret = mabs < nabs ? c / (nabs * hwidth) : c / (mabs * hheight);
      break;
    case "ellipse":
      ret = c / (hwidth * Math.sqrt(n ** 2 + q ** 2 * m ** 2));
      break;
  }
  return ret || 0;
};

const determineFocusPoint = (
  element: DucBindableElement,
  // The oriented, relative distance from the center of `element` of the
  // returned focusPoint
  focus: number,
  adjecentPoint: Point,
  elementsMap: ElementsMap,
): Point => {
  if (focus === 0) {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const center = coordsCenter(x1, y1, x2, y2);
    const point = GAPoint.toTuple(center);
    return {x: point[0], y: point[1]};
  }
  const relateToCenter = relativizationToElementCenter(element, elementsMap);
  const adjecentPointRel = GATransform.apply(
    relateToCenter,
    GAPoint.from([adjecentPoint.x, adjecentPoint.y]),
  );
  const reverseRelateToCenter = GA.reverse(relateToCenter);
  let point;
  switch (element.type) {
    case "rectangle":
    case "image":
    case "text":
    case "diamond":
    case "iframe":
    case "embeddable":
    case "frame":
    case "magicframe":
      point = findFocusPointForRectangulars(element, focus, adjecentPointRel);
      break;
    case "ellipse":
      point = findFocusPointForEllipse(element, focus, adjecentPointRel);
      break;
  }
  const [x, y] = GAPoint.toTuple(GATransform.apply(reverseRelateToCenter, point));
  return {x, y};
};

// Returns 2 or 0 intersection points between line going through `a` and `b`
// and the `element`, in ascending order of distance from `a`.
const intersectElementWithLine = (
  element: DucBindableElement,
  // Point on the line, in absolute coordinates
  a: Point,
  // Another point on the line, in absolute coordinates
  b: Point,
  // If given, the element is inflated by this value
  gap: number = 0,
  elementsMap: ElementsMap,
): Point[] => {
  if (isRectangularElement(element)) {
    return segmentIntersectRectangleElement(element, [a, b], gap);
  }

  const relateToCenter = relativizationToElementCenter(element, elementsMap);
  const aRel = GATransform.apply(relateToCenter, GAPoint.from(convertPointToTuple(a)));
  const bRel = GATransform.apply(relateToCenter, GAPoint.from(convertPointToTuple(b)));
  const line = GALine.through(aRel, bRel);
  const reverseRelateToCenter = GA.reverse(relateToCenter);
  const intersections = getSortedElementLineIntersections(
    element,
    line,
    aRel,
    gap,
  );
  return intersections.map((point) => {
    const [x, y] = GAPoint.toTuple(GATransform.apply(reverseRelateToCenter, point))
    return {x, y};
  });
};

const getSortedElementLineIntersections = (
  element: DucBindableElement,
  // Relative to element center
  line: GA.Line,
  // Relative to element center
  nearPoint: GA.Point,
  gap: number = 0,
): GA.Point[] => {
  let intersections: GA.Point[];
  switch (element.type) {
    case "rectangle":
    case "image":
    case "text":
    case "diamond":
    case "iframe":
    case "embeddable":
    case "frame":
    case "magicframe":
      const corners = getCorners(element);
      intersections = corners
        .flatMap((point, i) => {
          const edge: [GA.Point, GA.Point] = [point, corners[(i + 1) % 4]];
          return intersectSegment(line, offsetSegment(edge, gap));
        })
        .concat(
          corners.flatMap((point) => getCircleIntersections(point, gap, line)),
        );
      break;
    case "ellipse":
      intersections = getEllipseIntersections(element, gap, line);
      break;
  }
  if (intersections.length < 2) {
    // Ignore the "edge" case of only intersecting with a single corner
    return [];
  }
  const sortedIntersections = intersections.sort(
    (i1, i2) =>
      GAPoint.distance(i1, nearPoint) - GAPoint.distance(i2, nearPoint),
  );
  return [
    sortedIntersections[0],
    sortedIntersections[sortedIntersections.length - 1],
  ];
};

const getCorners = (
  element:
    | DucRectangleElement
    | DucImageElement
    | DucDiamondElement
    | DucTextElement
    | DucIframeLikeElement
    | DucFrameLikeElement,
  scale: number = 1,
): GA.Point[] => {
  const hx = (scale * element.width) / 2;
  const hy = (scale * element.height) / 2;
  switch (element.type) {
    case "rectangle":
    case "image":
    case "text":
    case "iframe":
    case "embeddable":
    case "frame":
    case "magicframe":
      return [
        GA.point(hx, hy),
        GA.point(hx, -hy),
        GA.point(-hx, -hy),
        GA.point(-hx, hy),
      ];
    case "diamond":
      return [
        GA.point(0, hy),
        GA.point(hx, 0),
        GA.point(0, -hy),
        GA.point(-hx, 0),
      ];
  }
};

// Returns intersection of `line` with `segment`, with `segment` moved by
// `gap` in its polar direction.
// If intersection coincides with second segment point returns empty array.
const intersectSegment = (
  line: GA.Line,
  segment: [GA.Point, GA.Point],
): GA.Point[] => {
  const [a, b] = segment;
  const aDist = GAPoint.distanceToLine(a, line);
  const bDist = GAPoint.distanceToLine(b, line);
  if (aDist * bDist >= 0) {
    // The intersection is outside segment `(a, b)`
    return [];
  }
  return [GAPoint.intersect(line, GALine.through(a, b))];
};

const offsetSegment = (
  segment: [GA.Point, GA.Point],
  distance: number,
): [GA.Point, GA.Point] => {
  const [a, b] = segment;
  const offset = GATransform.translationOrthogonal(
    GADirection.fromTo(a, b),
    distance,
  );
  return [GATransform.apply(offset, a), GATransform.apply(offset, b)];
};

const getEllipseIntersections = (
  element: DucEllipseElement,
  gap: number,
  line: GA.Line,
): GA.Point[] => {
  const a = element.width / 2 + gap;
  const b = element.height / 2 + gap;
  const m = line[2];
  const n = line[3];
  const c = line[1];
  const squares = a * a * m * m + b * b * n * n;
  const discr = squares - c * c;
  if (squares === 0 || discr <= 0) {
    return [];
  }
  const discrRoot = Math.sqrt(discr);
  const xn = -a * a * m * c;
  const yn = -b * b * n * c;
  return [
    GA.point(
      (xn + a * b * n * discrRoot) / squares,
      (yn - a * b * m * discrRoot) / squares,
    ),
    GA.point(
      (xn - a * b * n * discrRoot) / squares,
      (yn + a * b * m * discrRoot) / squares,
    ),
  ];
};

const getCircleIntersections = (
  center: GA.Point,
  radius: number,
  line: GA.Line,
): GA.Point[] => {
  if (radius === 0) {
    return GAPoint.distanceToLine(line, center) === 0 ? [center] : [];
  }
  const m = line[2];
  const n = line[3];
  const c = line[1];
  const [a, b] = GAPoint.toTuple(center);
  const r = radius;
  const squares = m * m + n * n;
  const discr = r * r * squares - (m * a + n * b + c) ** 2;
  if (squares === 0 || discr <= 0) {
    return [];
  }
  const discrRoot = Math.sqrt(discr);
  const xn = a * n * n - b * m * n - m * c;
  const yn = b * m * m - a * m * n - n * c;

  return [
    GA.point((xn + n * discrRoot) / squares, (yn - m * discrRoot) / squares),
    GA.point((xn - n * discrRoot) / squares, (yn + m * discrRoot) / squares),
  ];
};

// The focus point is the tangent point of the "focus image" of the
// `element`, where the tangent goes through `point`.
const findFocusPointForEllipse = (
  ellipse: DucEllipseElement,
  // Between -1 and 1 (not 0) the relative size of the "focus image" of
  // the element on which the focus point lies
  relativeDistance: number,
  // The point for which we're trying to find the focus point, relative
  // to the ellipse center.
  point: GA.Point,
): GA.Point => {
  const relativeDistanceAbs = Math.abs(relativeDistance);
  const a = (ellipse.width * relativeDistanceAbs) / 2;
  const b = (ellipse.height * relativeDistanceAbs) / 2;

  const orientation = Math.sign(relativeDistance);
  const [px, pyo] = GAPoint.toTuple(point);

  // The calculation below can't handle py = 0
  const py = pyo === 0 ? 0.0001 : pyo;

  const squares = px ** 2 * b ** 2 + py ** 2 * a ** 2;
  // Tangent mx + ny + 1 = 0
  const m =
    (-px * b ** 2 +
      orientation * py * Math.sqrt(Math.max(0, squares - a ** 2 * b ** 2))) /
    squares;

  let n = (-m * px - 1) / py;

  if (n === 0) {
    // if zero {-0, 0}, fall back to a same-sign value in the similar range
    n = (Object.is(n, -0) ? -1 : 1) * 0.01;
  }

  const x = -(a ** 2 * m) / (n ** 2 * b ** 2 + m ** 2 * a ** 2);
  return GA.point(x, (-m * x - 1) / n);
};

const findFocusPointForRectangulars = (
  element:
    | DucRectangleElement
    | DucImageElement
    | DucDiamondElement
    | DucTextElement
    | DucIframeLikeElement
    | DucFrameLikeElement,
  // Between -1 and 1 for how far away should the focus point be relative
  // to the size of the element. Sign determines orientation.
  relativeDistance: number,
  // The point for which we're trying to find the focus point, relative
  // to the element center.
  point: GA.Point,
): GA.Point => {
  const relativeDistanceAbs = Math.abs(relativeDistance);
  const orientation = Math.sign(relativeDistance);
  const corners = getCorners(element, relativeDistanceAbs);

  let maxDistance = 0;
  let tangentPoint: null | GA.Point = null;
  corners.forEach((corner) => {
    const distance = orientation * GALine.through(point, corner)[1];
    if (distance > maxDistance) {
      maxDistance = distance;
      tangentPoint = corner;
    }
  });
  return tangentPoint!;
};
export const bindingProperties: Set<BindableProp | BindingProp> = new Set([
  "boundElements",
  "frameId",
  "containerId",
  "startBinding",
  "endBinding",
]);

export type BindableProp = "boundElements";

export type BindingProp =
  | "frameId"
  | "containerId"
  | "startBinding"
  | "endBinding";

type BoundElementsVisitingFunc = (
  boundElement: DucElement | undefined,
  bindingProp: BindableProp,
  bindingId: string,
) => void;

type BindableElementVisitingFunc<T> = (
  bindableElement: DucElement | undefined,
  bindingProp: BindingProp,
  bindingId: string,
) => T;

/**
 * Tries to visit each bound element (does not have to be found).
 */
const boundElementsVisitor = (
  elements: ElementsMap,
  element: DucElement,
  visit: BoundElementsVisitingFunc,
) => {
  if (isBindableElement(element)) {
    // create new instance so that possible mutations won't play a role in visiting order
    const boundElements = element.boundElements?.slice() ?? [];

    // last added text should be the one we keep (~previous are duplicates)
    boundElements.forEach(({ id }) => {
      visit(elements.get(id), "boundElements", id);
    });
  }
};

/**
 * Tries to visit each bindable element (does not have to be found).
 */
const bindableElementsVisitor = <T>(
  elements: ElementsMap,
  element: DucElement,
  visit: BindableElementVisitingFunc<T>,
): T[] => {
  const result: T[] = [];

  if (element.frameId) {
    const id = element.frameId;
    result.push(visit(elements.get(id), "frameId", id));
  }

  if (isBoundToContainer(element)) {
    const id = element.containerId;
    result.push(visit(elements.get(id), "containerId", id));
  }

  if (isArrowElement(element)) {
    if (element.startBinding) {
      const id = element.startBinding.elementId;
      result.push(visit(elements.get(id), "startBinding", id));
    }

    if (element.endBinding) {
      const id = element.endBinding.elementId;
      result.push(visit(elements.get(id), "endBinding", id));
    }
  }

  return result;
};

/**
 * Bound element containing bindings to `frameId`, `containerId`, `startBinding` or `endBinding`.
 */
export class BoundElement {
  /**
   * Unbind the affected non deleted bindable elements (removing element from `boundElements`).
   * - iterates non deleted bindable elements (`containerId` | `startBinding.elementId` | `endBinding.elementId`) of the current element
   * - prepares updates to unbind each bindable element's `boundElements` from the current element
   */
  public static unbindAffected(
    elements: ElementsMap,
    boundElement: DucElement | undefined,
    updateElementWith: (
      affected: DucElement,
      updates: ElementUpdate<DucElement>,
    ) => void,
  ) {
    if (!boundElement) {
      return;
    }

    bindableElementsVisitor(elements, boundElement, (bindableElement) => {
      // bindable element is deleted, this is fine
      if (!bindableElement || bindableElement.isDeleted) {
        return;
      }

      boundElementsVisitor(
        elements,
        bindableElement,
        (_, __, boundElementId) => {
          if (boundElementId === boundElement.id) {
            updateElementWith(bindableElement, {
              boundElements: newBoundElements(
                bindableElement.boundElements,
                new Set([boundElementId]),
              ),
            });
          }
        },
      );
    });
  }

  /**
   * Rebind the next affected non deleted bindable elements (adding element to `boundElements`).
   * - iterates non deleted bindable elements (`containerId` | `startBinding.elementId` | `endBinding.elementId`) of the current element
   * - prepares updates to rebind each bindable element's `boundElements` to the current element
   *
   * NOTE: rebind expects that affected elements were previously unbound with `BoundElement.unbindAffected`
   */
  public static rebindAffected = (
    elements: ElementsMap,
    boundElement: DucElement | undefined,
    updateElementWith: (
      affected: DucElement,
      updates: ElementUpdate<DucElement>,
    ) => void,
  ) => {
    // don't try to rebind element that is deleted
    if (!boundElement || boundElement.isDeleted) {
      return;
    }

    bindableElementsVisitor(
      elements,
      boundElement,
      (bindableElement, bindingProp) => {
        // unbind from bindable elements, as bindings from non deleted elements into deleted elements are incorrect
        if (!bindableElement || bindableElement.isDeleted) {
          updateElementWith(boundElement, { [bindingProp]: null });
          return;
        }

        // frame bindings are unidirectional, there is nothing to rebind
        if (bindingProp === "frameId") {
          return;
        }

        if (
          bindableElement.boundElements?.find((x) => x.id === boundElement.id)
        ) {
          return;
        }

        if (isArrowElement(boundElement)) {
          // rebind if not found!
          updateElementWith(bindableElement, {
            boundElements: newBoundElements(
              bindableElement.boundElements,
              new Set(),
              new Array(boundElement),
            ),
          });
        }

        if (isTextElement(boundElement)) {
          if (!bindableElement.boundElements?.find((x) => x.type === "text")) {
            // rebind only if there is no other text bound already
            updateElementWith(bindableElement, {
              boundElements: newBoundElements(
                bindableElement.boundElements,
                new Set(),
                new Array(boundElement),
              ),
            });
          } else {
            // unbind otherwise
            updateElementWith(boundElement, { [bindingProp]: null });
          }
        }
      },
    );
  };
}

/**
 * Bindable element containing bindings to `boundElements`.
 */
export class BindableElement {
  /**
   * Unbind the affected non deleted bound elements (resetting `containerId`, `startBinding`, `endBinding` to `null`).
   * - iterates through non deleted `boundElements` of the current element
   * - prepares updates to unbind each bound element from the current element
   */
  public static unbindAffected(
    elements: ElementsMap,
    bindableElement: DucElement | undefined,
    updateElementWith: (
      affected: DucElement,
      updates: ElementUpdate<DucElement>,
    ) => void,
  ) {
    if (!bindableElement) {
      return;
    }

    boundElementsVisitor(elements, bindableElement, (boundElement) => {
      // bound element is deleted, this is fine
      if (!boundElement || boundElement.isDeleted) {
        return;
      }

      bindableElementsVisitor(
        elements,
        boundElement,
        (_, bindingProp, bindableElementId) => {
          // making sure there is an element to be unbound
          if (bindableElementId === bindableElement.id) {
            updateElementWith(boundElement, { [bindingProp]: null });
          }
        },
      );
    });
  }

  /**
   * Rebind the affected non deleted bound elements (for now setting only `containerId`, as we cannot rebind arrows atm).
   * - iterates through non deleted `boundElements` of the current element
   * - prepares updates to rebind each bound element to the current element or unbind it from `boundElements` in case of conflicts
   *
   * NOTE: rebind expects that affected elements were previously unbound with `BindaleElement.unbindAffected`
   */
  public static rebindAffected = (
    elements: ElementsMap,
    bindableElement: DucElement | undefined,
    updateElementWith: (
      affected: DucElement,
      updates: ElementUpdate<DucElement>,
    ) => void,
  ) => {
    // don't try to rebind element that is deleted (i.e. updated as deleted)
    if (!bindableElement || bindableElement.isDeleted) {
      return;
    }

    boundElementsVisitor(
      elements,
      bindableElement,
      (boundElement, _, boundElementId) => {
        // unbind from bindable elements, as bindings from non deleted elements into deleted elements are incorrect
        if (!boundElement || boundElement.isDeleted) {
          updateElementWith(bindableElement, {
            boundElements: newBoundElements(
              bindableElement.boundElements,
              new Set([boundElementId]),
            ),
          });
          return;
        }

        if (isTextElement(boundElement)) {
          const boundElements = bindableElement.boundElements?.slice() ?? [];
          // check if this is the last element in the array, if not, there is an previously bound text which should be unbound
          if (
            boundElements.reverse().find((x) => x.type === "text")?.id ===
            boundElement.id
          ) {
            if (boundElement.containerId !== bindableElement.id) {
              // rebind if not bound already!
              updateElementWith(boundElement, {
                containerId: bindableElement.id,
              } as ElementUpdate<DucTextElement>);
            }
          } else {
            if (boundElement.containerId !== null) {
              // unbind if not unbound already
              updateElementWith(boundElement, {
                containerId: null,
              } as ElementUpdate<DucTextElement>);
            }

            // unbind from boundElements as the element got bound to some other element in the meantime
            updateElementWith(bindableElement, {
              boundElements: newBoundElements(
                bindableElement.boundElements,
                new Set([boundElement.id]),
              ),
            });
          }
        }
      },
    );
  };
}

export const getGlobalFixedPointForBindableElement = (
  fixedPointRatio: Point,
  element: DucBindableElement,
) => {
  const {x: fixedX, y: fixedY} = normalizeFixedPoint(fixedPointRatio);

  return rotatePoint(
    {x: element.x + element.width * fixedX, y: element.y + element.height * fixedY},
    getCenterForElement(element),
    element.angle,
  );
};

const getGlobalFixedPoints = (
  arrow: DucElbowArrowElement,
  elementsMap: ElementsMap,
) => {
  const startElement =
    arrow.startBinding &&
    (elementsMap.get(arrow.startBinding.elementId) as
      | DucBindableElement
      | undefined);
  const endElement =
    arrow.endBinding &&
    (elementsMap.get(arrow.endBinding.elementId) as
      | DucBindableElement
      | undefined);
  const startPoint: Point =
    startElement && arrow.startBinding
      ? getGlobalFixedPointForBindableElement(
          arrow.startBinding.fixedPoint,
          startElement as DucBindableElement,
        )
      : {x: arrow.x + arrow.points[0].x, y: arrow.y + arrow.points[0].y};
  const endPoint: Point =
    endElement && arrow.endBinding
      ? getGlobalFixedPointForBindableElement(
          arrow.endBinding.fixedPoint,
          endElement as DucBindableElement,
        )
      : {
          x: arrow.x + arrow.points[arrow.points.length - 1].x,
          y: arrow.y + arrow.points[arrow.points.length - 1].y,
        };

  return [startPoint, endPoint];
};

export const getArrowLocalFixedPoints = (
  arrow: DucElbowArrowElement,
  elementsMap: ElementsMap,
) => {
  const [startPoint, endPoint] = getGlobalFixedPoints(arrow, elementsMap);

  return [
    LinearElementEditor.pointFromAbsoluteCoords(arrow, startPoint, elementsMap),
    LinearElementEditor.pointFromAbsoluteCoords(arrow, endPoint, elementsMap),
  ];
};

export const normalizeFixedPoint = <T extends FixedPoint | null>(
  fixedPoint: T,
): T extends null ? null : FixedPoint => {
  // Do not allow a precise 0.5 for fixed point ratio
  // to avoid jumping arrow heading due to floating point imprecision
  if (fixedPoint && (fixedPoint.x === 0.5 || fixedPoint.y === 0.5)) {
    return {
      x: fixedPoint.x === 0.5 ? 0.5001 : fixedPoint.x,
      y: fixedPoint.y === 0.5 ? 0.5001 : fixedPoint.y,
    } as T extends null ? null : FixedPoint;
  }
  return fixedPoint as any as T extends null ? null : FixedPoint;
};

