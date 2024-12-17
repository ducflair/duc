import type {
  NonDeleted,
  DucLinearElement,
  DucElement,
  PointBinding,
  DucBindableElement,
  DucTextElementWithContainer,
  ElementsMap,
  NonDeletedSceneElementsMap,
  OrderedDucElement,
  FixedPointBinding,
  SceneElementsMap,
} from "./types";
import {
  distance2d,
  rotate,
  isPathALoop,
  getGridPoint,
  rotatePoint,
  centerPoint,
  getControlPointsForBezierCurve,
  getBezierXY,
  getBezierCurveLength,
  mapIntervalToBezierT,
  arePointsEqual,
} from "../math";
import { getElementAbsoluteCoords, getLockedLinearCursorAlignSize } from ".";
import type { Bounds } from "./bounds";
import {
  getCurvePathOps,
  getElementPointsCoords,
  getMinMaxXYFromCurvePathOps,
} from "./bounds";
import type {
  Point,
  AppState,
  PointerCoords,
  InteractiveCanvasAppState,
  AppClassProperties,
  NullableGridSize,
  BezierHandle,
  BezierMirroring,
} from "../types";
import { mutateElement } from "./mutateElement";

import {
  bindOrUnbindLinearElement,
  getHoveredElementForBinding,
  isBindingEnabled,
} from "./binding";
import { toBrandedType, tupleToCoors } from "../utils";
import {
  isBindingElement,
  isElbowArrow,
  isFixedPointBinding,
} from "./typeChecks";
import { KEYS, shouldRotateWithDiscreteAngle } from "../keys";
import { getBoundTextElement, handleBindTextResize } from "./textElement";
import { BEZIER_MIRRORING, DRAGGING_THRESHOLD } from "../constants";
import type { Mutable } from "../utility-types";
import { ShapeCache } from "../scene/ShapeCache";
import type { Store } from "../store";
import { mutateElbowArrow } from "./routing";
import type Scene from "../scene/Scene";
import { adjustElementsMapToCurrentScope, adjustElementToCurrentScope } from "../duc/utils/measurements";
import { RoughGenerator } from "roughjs/bin/generator";
import { generateRoughOptions } from "../scene/Shape";
import { ElementShapes } from "../scene/types";

const editorMidPointsCache: {
  version: number | null;
  points: (Point | null)[];
  zoom: number | null;
} = { version: null, points: [], zoom: null };

export type PointIndex = [number, 'point' | 'handleIn' | 'handleOut'];

export class LinearElementEditor {
  public readonly elementId: DucElement["id"] & {
    _brand: "excalidrawLinearElementId";
  };
  /** indices */
  public readonly selectedPointsIndices: readonly number[] | null;

  public readonly pointerDownState: Readonly<{
    prevSelectedPointsIndices: readonly number[] | null;
    /** index */
    lastClickedPoint: number;
    lastClickedIsEndPoint: boolean;
    origin: Readonly<{ x: number; y: number }> | null;
    segmentMidpoint: {
      value: Point | null;
      index: number | null;
      added: boolean;
    };
    handleType: "handleIn" | "handleOut" | null;
  }>;

  /** whether you're dragging a point */
  public readonly isDragging: boolean;
  public readonly lastUncommittedPoint: Point | null;
  public readonly pointerOffset: Readonly<{ x: number; y: number }>;
  public readonly startBindingElement:
    | DucBindableElement
    | null
    | "keep";
  public readonly endBindingElement: DucBindableElement | null | "keep";
  public readonly hoverPointIndex: number;
  public readonly segmentMidPointHoveredCoords: Point | null;
  public _dragCache: {
    elementsMap: ElementsMap;
    elements?: NonDeleted<DucElement>[];
  } | null;

  constructor(element: NonDeleted<DucLinearElement>) {
    this.elementId = element.id as string & {
      _brand: "excalidrawLinearElementId";
    };
    if (!arePointsEqual(element.points[0], { x: 0, y: 0 })) {
      console.error("Linear element is not normalized", Error().stack);
    }

    this._dragCache = null;
    this.selectedPointsIndices = null;
    this.lastUncommittedPoint = null;
    this.isDragging = false;
    this.pointerOffset = { x: 0, y: 0 };
    this.startBindingElement = "keep";
    this.endBindingElement = "keep";
    this.pointerDownState = {
      prevSelectedPointsIndices: null,
      lastClickedPoint: -1,
      lastClickedIsEndPoint: false,
      origin: null,

      segmentMidpoint: {
        value: null,
        index: null,
        added: false,
      },
      handleType: null,
    };
    this.hoverPointIndex = -1;
    this.segmentMidPointHoveredCoords = null;
  }

  // ---------------------------------------------------------------------------
  // static methods
  // ---------------------------------------------------------------------------

  static POINT_HANDLE_SIZE = 10;
  /**
   * @param id the `elementId` from the instance of this class (so that we can
   *  statically guarantee this method returns an DucLinearElement)
   */
  static getElement(
    id: InstanceType<typeof LinearElementEditor>["elementId"],
    elementsMap: ElementsMap,
  ) {
    const element = elementsMap.get(id);
    if (element) {
      return element as NonDeleted<DucLinearElement>;
    }
    return null;
  }

  static handleBoxSelection(
    event: PointerEvent,
    appState: AppState,
    setState: React.Component<any, AppState>["setState"],
    elementsMap: NonDeletedSceneElementsMap,
  ) {
    if (!appState.editingLinearElement || !appState.selectionElement) {
      return false;
    }
    const { editingLinearElement } = appState;
    const { selectedPointsIndices, elementId } = editingLinearElement;

    const element = LinearElementEditor.getElement(elementId, elementsMap);
    if (!element) {
      return false;
    }

    const [selectionX1, selectionY1, selectionX2, selectionY2] =
      getElementAbsoluteCoords(appState.selectionElement, elementsMap);

    const pointsSceneCoords = LinearElementEditor.getPointsGlobalCoordinates(
      element,
      elementsMap,
    );

    const nextSelectedPoints = pointsSceneCoords
      .reduce((acc: number[], point, index) => {
        if (
          (point.x >= selectionX1 &&
            point.x <= selectionX2 &&
            point.y >= selectionY1 &&
            point.y <= selectionY2) ||
          (event.shiftKey && selectedPointsIndices?.includes(index))
        ) {
          acc.push(index);
        }

        return acc;
      }, [])
      .filter((index) => {
        if (
          isElbowArrow(element) &&
          index !== 0 &&
          index !== element.points.length - 1
        ) {
          return false;
        }
        return true;
      });

    setState({
      editingLinearElement: {
        ...editingLinearElement,
        selectedPointsIndices: nextSelectedPoints.length
          ? nextSelectedPoints
          : null,
      },
    });
  }

  /** @returns whether point was dragged */
  static handlePointDragging(
    event: PointerEvent,
    app: AppClassProperties,
    scenePointerX: number,
    scenePointerY: number,
    maybeSuggestBinding: (
      element: NonDeleted<DucLinearElement>,
      pointSceneCoords: { x: number; y: number }[],
    ) => void,
    linearElementEditor: LinearElementEditor,
    scene: Scene,
  ): boolean {
    if (!linearElementEditor) {
      return false;
    }
    const { elementId } = linearElementEditor;

    if (!linearElementEditor._dragCache) {
      linearElementEditor._dragCache = {
        elementsMap: adjustElementsMapToCurrentScope(
          scene.getNonDeletedElementsMap(),
          app.state.scope,
        ),
      };
    }
    const { elementsMap } = linearElementEditor._dragCache
  
    const linearElement = LinearElementEditor.getElement(elementId, elementsMap);
    if (!linearElement) {
      return false;
    }
    const element = adjustElementToCurrentScope(linearElement, app.state.scope);
  
    const { pointerDownState } = linearElementEditor;
  
    if (pointerDownState.handleType) {
      // We are dragging a handle
      const handleType = pointerDownState.handleType;
      const pointIndex = pointerDownState.lastClickedPoint;
      const point = element.points[pointIndex];
  
      // Update the handle position
      const newHandlePos = LinearElementEditor.createPointAt(
        element,
        elementsMap,
        scenePointerX - linearElementEditor.pointerOffset.x,
        scenePointerY - linearElementEditor.pointerOffset.y,
        null, // Do not snap handles to grid
      );
  
      // Apply mirroring if needed
      const mirroring = point.mirroring;
      if (mirroring !== undefined && !event.altKey) {
        const oppositeHandleType =
          handleType === 'handleIn' ? 'handleOut' : 'handleIn';
  
        const dx = newHandlePos.x - point.x;
        const dy = newHandlePos.y - point.y;
  
        if (!point[oppositeHandleType]) {
          point[oppositeHandleType] = { x: point.x, y: point.y };
        }
  
        if (mirroring === BEZIER_MIRRORING.ANGLE_LENGTH) {
          // Mirror angle and length
          point[oppositeHandleType]!.x = point.x - dx;
          point[oppositeHandleType]!.y = point.y - dy;
        } else if (mirroring === BEZIER_MIRRORING.ANGLE) {
          // Mirror angle only
          const oppositeLength = Math.hypot(
            point[oppositeHandleType]!.x - point.x,
            point[oppositeHandleType]!.y - point.y,
          );
          const angle = Math.atan2(dy, dx);
          point[oppositeHandleType]!.x =
            point.x - Math.cos(angle) * oppositeLength;
          point[oppositeHandleType]!.y =
            point.y - Math.sin(angle) * oppositeLength;
        }
      }
  
      // Update the handle being dragged
      point[handleType] = newHandlePos;
  
      // Update the element to reflect changes
      mutateElement(element, { points: element.points });
  
      return true; // Indicate that a handle was dragged
    }  

    if (
      isElbowArrow(element) &&
      !linearElementEditor.pointerDownState.lastClickedIsEndPoint &&
      linearElementEditor.pointerDownState.lastClickedPoint !== 0
    ) {
      return false;
    }

    // Check if a handle is being dragged
    const handleUnderCursor = LinearElementEditor.getHandleUnderCursor(
      element,
      elementsMap,
      app.state.zoom,
      scenePointerX,
      scenePointerY,
    );
    if (handleUnderCursor) {
      const { pointIndex, handleType } = handleUnderCursor;
      const point = element.points[pointIndex];

      // Update the handle position
      const newHandlePos = LinearElementEditor.createPointAt(
        element,
        elementsMap,
        scenePointerX - linearElementEditor.pointerOffset.x,
        scenePointerY - linearElementEditor.pointerOffset.y,
        null, // Do not snap handles to grid
      );

      // Apply mirroring if needed
      const mirroring = point.mirroring;
      if (mirroring !== undefined && !event.altKey) {
        const oppositeHandleType =
          handleType === 'handleIn' ? 'handleOut' : 'handleIn';

        const dx = newHandlePos.x - point.x;
        const dy = newHandlePos.y - point.y;
        const length = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        if (!point[oppositeHandleType]) {
          point[oppositeHandleType] = { x: point.x, y: point.y };
        }

        if (mirroring === BEZIER_MIRRORING.ANGLE_LENGTH) {
          // Mirror angle and length
          point[oppositeHandleType]!.x = point.x - dx;
          point[oppositeHandleType]!.y = point.y - dy;
        } else if (mirroring === BEZIER_MIRRORING.ANGLE) {
          // Mirror angle only
          const oppositeLength = Math.hypot(
            point[oppositeHandleType]!.x - point.x,
            point[oppositeHandleType]!.y - point.y,
          );
          point[oppositeHandleType]!.x =
            point.x - Math.cos(angle) * oppositeLength;
          point[oppositeHandleType]!.y =
            point.y - Math.sin(angle) * oppositeLength;
        }
      }
      // Update the handle being dragged
      point[handleType] = newHandlePos;

      // Update the element to reflect changes
      mutateElement(element, { points: element.points });

      return true; // Indicate that a handle was dragged
    }


    const selectedPointsIndices = isElbowArrow(element)
      ? linearElementEditor.selectedPointsIndices
          ?.reduce(
            (startEnd, index) =>
              (index === 0
                ? [0, startEnd[1]]
                : [startEnd[0], element.points.length - 1]) as [
                boolean | number,
                boolean | number,
              ],
            [false, false] as [number | boolean, number | boolean],
          )
          .filter(
            (idx: number | boolean): idx is number => typeof idx === "number",
          )
      : linearElementEditor.selectedPointsIndices;
    const lastClickedPoint = isElbowArrow(element)
      ? linearElementEditor.pointerDownState.lastClickedPoint > 0
        ? element.points.length - 1
        : 0
      : linearElementEditor.pointerDownState.lastClickedPoint;

    // point that's being dragged (out of all selected points)
    const draggingPoint = element.points[lastClickedPoint] as
      | Point
      | undefined;

    if (selectedPointsIndices && draggingPoint) {
      if (
        shouldRotateWithDiscreteAngle(event) &&
        selectedPointsIndices.length === 1 &&
        element.points.length > 1
      ) {
        const selectedIndex = selectedPointsIndices[0];
        const referencePoint =
          element.points[selectedIndex === 0 ? 1 : selectedIndex - 1];

        const {x: width, y: height} = LinearElementEditor._getShiftLockedDelta(
          element,
          elementsMap,
          referencePoint,
          {x: scenePointerX, y: scenePointerY},
          event[KEYS.CTRL_OR_CMD] ? null : app.getEffectiveGridSize(),
        );

        LinearElementEditor.movePoints(
          element,
          [
            {
              index: selectedIndex,
              point: {
                x: width + referencePoint.x, 
                y: height + referencePoint.y,
                isCurve: referencePoint.isCurve,
                borderRadius: referencePoint.borderRadius,
                handleIn: referencePoint.handleIn && {x: width + referencePoint.handleIn.x, y: height + referencePoint.handleIn.y},
                handleOut: referencePoint.handleOut && {x: width + referencePoint.handleOut.x, y: height + referencePoint.handleOut.y},
              } as Point,
              isDragging: selectedIndex === lastClickedPoint,
            },
          ],
          elementsMap as NonDeletedSceneElementsMap,
        );
      } else {
        const newDraggingPointPosition = LinearElementEditor.createPointAt(
          element,
          elementsMap,
          scenePointerX - linearElementEditor.pointerOffset.x,
          scenePointerY - linearElementEditor.pointerOffset.y,
          event[KEYS.CTRL_OR_CMD] ? null : app.getEffectiveGridSize(),
        );

        const deltaX = newDraggingPointPosition.x - draggingPoint.x;
        const deltaY = newDraggingPointPosition.y - draggingPoint.y;

        LinearElementEditor.movePoints(
          element,
          selectedPointsIndices.map((pointIndex) => {
            const handleIn = element.points[pointIndex]?.handleIn;
            const handleOut = element.points[pointIndex]?.handleOut;
            const newPointPosition =
              pointIndex === lastClickedPoint
                ? LinearElementEditor.createPointAt(
                    element,
                    elementsMap,
                    scenePointerX - linearElementEditor.pointerOffset.x,
                    scenePointerY - linearElementEditor.pointerOffset.y,
                    event[KEYS.CTRL_OR_CMD] ? null : app.getEffectiveGridSize(),
                  )
                : ({
                    x: element.points[pointIndex].x + deltaX,
                    y: element.points[pointIndex].y + deltaY,
                    isCurve: element.points[pointIndex].isCurve,
                    mirroring: element.points[pointIndex].mirroring,
                    borderRadius: element.points[pointIndex].borderRadius,
                    handleIn: handleIn && handleIn.x !== undefined && handleIn.y !== undefined 
                      ? {
                          x: handleIn.x + deltaX,
                          y: handleIn.y + deltaY,
                        }
                      : undefined,

                    handleOut: handleOut && handleOut.x !== undefined && handleOut.y !== undefined 
                      ? {
                          x: handleOut.x + deltaX,
                          y: handleOut.y + deltaY,
                        }
                      : undefined,
                  } as const);
            return {
              index: pointIndex,
              point: newPointPosition,
              isDragging: pointIndex === lastClickedPoint,
            };
          }),
          elementsMap as NonDeletedSceneElementsMap,
        );
      }

      const boundTextElement = getBoundTextElement(element, elementsMap);
      if (boundTextElement) {
        handleBindTextResize(element, elementsMap, false);
      }

      // suggest bindings for first and last point if selected
      if (isBindingElement(element, false)) {
        const coords: { x: number; y: number }[] = [];

        const firstSelectedIndex = selectedPointsIndices[0];
        if (firstSelectedIndex === 0) {
          coords.push(
            LinearElementEditor.getPointGlobalCoordinates(
              element,
              element.points[0],
              elementsMap,
            ) as { x: number; y: number },
          );
        }

        const lastSelectedIndex =
          selectedPointsIndices[selectedPointsIndices.length - 1];
        if (lastSelectedIndex === element.points.length - 1) {
          coords.push(
            LinearElementEditor.getPointGlobalCoordinates(
              element,
              element.points[lastSelectedIndex],
              elementsMap,
            ) as { x: number; y: number },
          );
        }

        if (coords.length) {
          maybeSuggestBinding(element, coords);
        }
      }

      
      
      return true;
    }

    return false;
  }

  static handlePointerUp(
    event: PointerEvent,
    editingLinearElement: LinearElementEditor,
    appState: AppState,
    scene: Scene,
  ): LinearElementEditor {
    if (!editingLinearElement._dragCache || !editingLinearElement._dragCache.elements) {
      editingLinearElement._dragCache = {
        elementsMap: adjustElementsMapToCurrentScope(
          scene.getNonDeletedElementsMap(),
          appState.scope,
        ),
        elements: scene.getNonDeletedElements().map(element => adjustElementToCurrentScope(element, appState.scope))
      };
    }
    
    const { elementsMap } = editingLinearElement._dragCache
    const elements = editingLinearElement._dragCache.elements 
      ?? scene.getNonDeletedElements().map(element => adjustElementToCurrentScope(element, appState.scope))

    const { elementId, selectedPointsIndices, isDragging, pointerDownState } =
      editingLinearElement;

    const linearElement = LinearElementEditor.getElement(elementId, elementsMap);
    if (!linearElement) {
      return editingLinearElement;
    }
    const element = adjustElementToCurrentScope(linearElement, appState.scope)
    // Add this check to prevent point movement when clicking outside
    const hitPoint = LinearElementEditor.getPointIndexUnderCursor(
      linearElement,
      elementsMap,
      appState.zoom,
      event.clientX,
      event.clientY,
      appState,
    );

    // If we're not dragging and clicked outside (no hit point), just clean up and return
    if (!isDragging && !hitPoint) {
      editingLinearElement._dragCache = null;
      return {
        ...editingLinearElement,
        isDragging: false,
        pointerOffset: { x: 0, y: 0 },
      };
    }

    const bindings: Mutable<
      Partial<
        Pick<
          InstanceType<typeof LinearElementEditor>,
          "startBindingElement" | "endBindingElement"
        >
      >
    > = {};

    if (isDragging && selectedPointsIndices) {
      for (const selectedPoint of selectedPointsIndices) {
        if (
          selectedPoint === 0 ||
          selectedPoint === element.points.length - 1
        ) {
          if (isPathALoop(element.points, appState.zoom.value)) {
            LinearElementEditor.movePoints(
              element,
              [
                {
                  index: selectedPoint,
                  point:
                    selectedPoint === 0
                      ? element.points[element.points.length - 1]
                      : element.points[0],
                },
              ],
              elementsMap as NonDeletedSceneElementsMap,
            );
          }

          const bindingElement = isBindingEnabled(appState)
            ? getHoveredElementForBinding(
                LinearElementEditor.getPointAtIndexGlobalCoordinates(
                  element,
                  selectedPoint!,
                  elementsMap,
                ) as { x: number; y: number },
                elements,
                elementsMap as NonDeletedSceneElementsMap,
              )
            : null;

          bindings[
            selectedPoint === 0 ? "startBindingElement" : "endBindingElement"
          ] = bindingElement;
        }
      }
    }

    editingLinearElement._dragCache = null;
    return {
      ...editingLinearElement,
      ...bindings,
      // if clicking without previously dragging a point(s), and not holding
      // shift, deselect all points except the one clicked. If holding shift,
      // toggle the point.
      selectedPointsIndices:
        isDragging || event.shiftKey
          ? !isDragging &&
            event.shiftKey &&
            pointerDownState.prevSelectedPointsIndices?.includes(
              pointerDownState.lastClickedPoint,
            )
            ? selectedPointsIndices &&
              selectedPointsIndices.filter(
                (pointIndex) =>
                  pointIndex !== pointerDownState.lastClickedPoint,
              )
            : selectedPointsIndices
          : selectedPointsIndices?.includes(pointerDownState.lastClickedPoint)
          ? [pointerDownState.lastClickedPoint]
          : selectedPointsIndices,
      isDragging: false,
      pointerOffset: { x: 0, y: 0 },
    };
  }

  static getHandleUnderCursor(
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
    zoom: AppState["zoom"],
    x: number,
    y: number,
  ): { pointIndex: number; handleType: 'handleIn' | 'handleOut' } | null {
    const pointHandles = LinearElementEditor.getPointsGlobalCoordinates(
      element,
      elementsMap,
    );
  
    for (let idx = 0; idx < pointHandles.length; idx++) {
      const point = pointHandles[idx];
      if (point.isCurve) {
        const handleSize = LinearElementEditor.POINT_HANDLE_SIZE / zoom.value;
  
        // Check handleIn
        if (point.handleIn) {
          const handleInGlobal = {
            x: point.handleIn.x + element.x,
            y: point.handleIn.y + element.y,
          };
          const distance = distance2d(x, y, handleInGlobal.x, handleInGlobal.y);
          if (distance <= handleSize) {
            return { pointIndex: idx, handleType: 'handleIn' };
          }
        }
  
        // Check handleOut
        if (point.handleOut) {
          const handleOutGlobal = {
            x: point.handleOut.x + element.x,
            y: point.handleOut.y + element.y,
          };
          const distance = distance2d(x, y, handleOutGlobal.x, handleOutGlobal.y);
          if (distance <= handleSize) {
            return { pointIndex: idx, handleType: 'handleOut' };
          }
        }
      }
    }
  
    return null;
  }
  
  

  static getEditorMidPoints = (
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
    appState: InteractiveCanvasAppState,
  ): typeof editorMidPointsCache["points"] => {
    const boundText = getBoundTextElement(element, elementsMap);

    // Since its not needed outside editor unless 2 pointer lines or bound text
    if (
      !appState.editingLinearElement &&
      element.points.length > 2 &&
      !boundText
    ) {
      return [];
    }
    if (
      editorMidPointsCache.version === element.version &&
      editorMidPointsCache.zoom === appState.zoom.value
    ) {
      return editorMidPointsCache.points;
    }
    LinearElementEditor.updateEditorMidPointsCache(
      element,
      elementsMap,
      appState,
    );
    return editorMidPointsCache.points!;
  };

  static updateEditorMidPointsCache = (
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
    appState: InteractiveCanvasAppState,
  ) => {
    const points = LinearElementEditor.getPointsGlobalCoordinates(
      element,
      elementsMap,
    );
  
    let index = 0;
    const midpoints: (Point | null)[] = [];
    while (index < points.length - 1) {
      // Skip midpoint creation if either current point or next point is a curve point
      if (
        element.points[index].isCurve || 
        element.points[index + 1].isCurve ||
        LinearElementEditor.isSegmentTooShort(
          element,
          element.points[index],
          element.points[index + 1],
          appState.zoom,
        )
      ) {
        midpoints.push(null);
        index++;
        continue;
      }
  
      const segmentMidPoint = LinearElementEditor.getSegmentMidPoint(
        element,
        points[index],
        points[index + 1],
        index + 1,
        elementsMap,
      );
      midpoints.push(segmentMidPoint);
      index++;
    }
    editorMidPointsCache.points = midpoints;
    editorMidPointsCache.version = element.version;
    editorMidPointsCache.zoom = appState.zoom.value;
  };

  static getSegmentMidpointHitCoords = (
    linearElementEditor: LinearElementEditor,
    scenePointer: { x: number; y: number },
    appState: AppState,
    elementsMap: ElementsMap,
  ) => {
    const { elementId } = linearElementEditor;
    const linearElement = LinearElementEditor.getElement(elementId, elementsMap);
    if (!linearElement) {
      return false;
    }
    const element = adjustElementToCurrentScope(linearElement, appState.scope)

    const hitPoint = LinearElementEditor.getPointIndexUnderCursor(
      element,
      elementsMap,
      appState.zoom,
      scenePointer.x,
      scenePointer.y,
      appState
    );
    if (hitPoint === null) {
      return null;
    }
    const points = LinearElementEditor.getPointsGlobalCoordinates(
      element,
      elementsMap,
    );
    if (points.length >= 3 && !appState.editingLinearElement) {
      return null;
    }

    const threshold =
      LinearElementEditor.POINT_HANDLE_SIZE / appState.zoom.value;

    const existingSegmentMidpointHitCoords =
      linearElementEditor.segmentMidPointHoveredCoords;
    if (existingSegmentMidpointHitCoords) {
      const distance = distance2d(
        existingSegmentMidpointHitCoords.x,
        existingSegmentMidpointHitCoords.y,
        scenePointer.x,
        scenePointer.y,
      );
      if (distance <= threshold) {
        return existingSegmentMidpointHitCoords;
      }
    }
    let index = 0;
    const midPoints: typeof editorMidPointsCache["points"] =
      LinearElementEditor.getEditorMidPoints(element, elementsMap, appState);
    while (index < midPoints.length) {
      if (midPoints[index] !== null) {
        const distance = distance2d(
          midPoints[index]!.x,
          midPoints[index]!.y,
          scenePointer.x,
          scenePointer.y,
        );
        if (distance <= threshold) {
          return midPoints[index];
        }
      }

      index++;
    }
    return null;
  };

  static isSegmentTooShort(
    element: NonDeleted<DucLinearElement>,
    startPoint: Point,
    endPoint: Point,
    zoom: AppState["zoom"],
  ) {
    let distance = distance2d(
      startPoint.x,
      startPoint.y,
      endPoint.x,
      endPoint.y,
    );
    if (element.points.length > 2 && element.roundness) {
      distance = getBezierCurveLength(element, endPoint);
    }

    return distance * zoom.value < LinearElementEditor.POINT_HANDLE_SIZE * 4;
  }

  static getSegmentMidPoint(
    element: NonDeleted<DucLinearElement>,
    startPoint: Point,
    endPoint: Point,
    endPointIndex: number,
    elementsMap: ElementsMap,
  ) {
    let segmentMidPoint = centerPoint(startPoint, endPoint);
    if (element.points.length > 2 && element.roundness) {
      const controlPoints = getControlPointsForBezierCurve(
        element,
        element.points[endPointIndex],
      );
      if (controlPoints) {
        const t = mapIntervalToBezierT(
          element,
          element.points[endPointIndex],
          0.5,
        );

        const { x: tx, y: ty } = getBezierXY(
          controlPoints[0],
          controlPoints[1],
          controlPoints[2],
          controlPoints[3],
          t,
        );
        segmentMidPoint = LinearElementEditor.getPointGlobalCoordinates(
          element,
          { x: tx, y: ty },
          elementsMap,
        );
      }
    }

    return segmentMidPoint;
  }

  static getSegmentMidPointIndex(
    linearElementEditor: LinearElementEditor,
    appState: AppState,
    midPoint: Point,
    elementsMap: ElementsMap,
  ) {
    const element = LinearElementEditor.getElement(
      linearElementEditor.elementId,
      elementsMap,
    );
    if (!element) {
      return -1;
    }
    const midPoints = LinearElementEditor.getEditorMidPoints(
      element,
      elementsMap,
      appState,
    );
    let index = 0;
    while (index < midPoints.length) {
      if (LinearElementEditor.arePointsEqual(midPoint, midPoints[index])) {
        return index + 1;
      }
      index++;
    }
    return -1;
  }

  static handlePointerDown(
    event: React.PointerEvent<HTMLElement>,
    app: AppClassProperties,
    store: Store,
    scenePointer: { x: number; y: number },
    linearElementEditor: LinearElementEditor,
    scene: Scene,
  ): {
    didAddPoint: boolean;
    hitElement: NonDeleted<DucElement> | null;
    linearElementEditor: LinearElementEditor | null;
  } {
    const appState = app.state;
    const elementsMap = adjustElementsMapToCurrentScope(
      scene.getNonDeletedElementsMap(),
      appState.scope,
    )
    const elements = scene.getNonDeletedElements().map(element => 
      adjustElementToCurrentScope(element, appState.scope)
    )

    const ret: ReturnType<typeof LinearElementEditor["handlePointerDown"]> = {
      didAddPoint: false,
      hitElement: null,
      linearElementEditor: null,
    };

    if (!linearElementEditor) {
      return ret;
    }

    const { elementId } = linearElementEditor;
    const element = LinearElementEditor.getElement(elementId, elementsMap);

    if (!element) {
      return ret;
    }

    // Get hit point information using the new tuple return type
    const hitPoint = LinearElementEditor.getPointIndexUnderCursor(
      element,
      elementsMap,
      appState.zoom,
      scenePointer.x,
      scenePointer.y,
      appState,
    );

    if (hitPoint) {
      const [pointIndex, handleType] = hitPoint;
      ret.hitElement = element;

      // Handle bezier control points
      if (handleType !== 'point') {
        ret.linearElementEditor = {
          ...linearElementEditor,
          pointerDownState: {
            prevSelectedPointsIndices: linearElementEditor.selectedPointsIndices,
            lastClickedPoint: pointIndex,
            lastClickedIsEndPoint: false,
            origin: { x: scenePointer.x, y: scenePointer.y },
            segmentMidpoint: {
              value: null,
              index: null,
              added: false,
            },
            handleType, // Store which handle is being dragged
          },
          selectedPointsIndices: [pointIndex],
          pointerOffset: { x: 0, y: 0 },
        };

        return ret;
      }

      // Handle main point click in bend mode
      if (appState.editingLinearElement && appState.lineBendingMode) {
        const updatedPoint = initializeCurvePoint(element, pointIndex);
        const updatedPoints = [...element.points];
        updatedPoints[pointIndex] = updatedPoint;
    
        mutateElement(element, { points: updatedPoints });
        
        ret.linearElementEditor = {
            ...linearElementEditor,
            selectedPointsIndices: [pointIndex],
        };
        
        app.rerenderCanvas();
        return ret;
      }
    }

    // Handle segment midpoint
    const segmentMidpoint = LinearElementEditor.getSegmentMidpointHitCoords(
      linearElementEditor,
      scenePointer,
      appState,
      elementsMap,
    );
    
    let segmentMidpointIndex = null;
    if (segmentMidpoint) {
      segmentMidpointIndex = LinearElementEditor.getSegmentMidPointIndex(
        linearElementEditor,
        appState,
        segmentMidpoint,
        elementsMap,
      );
    }

    // Handle alt key for adding new points
    if (event.altKey && appState.editingLinearElement) {
      if (
        linearElementEditor.lastUncommittedPoint == null &&
        !isElbowArrow(element)
      ) {
        const newPoint = LinearElementEditor.createPointAt(
          element,
          elementsMap,
          scenePointer.x,
          scenePointer.y,
          event[KEYS.CTRL_OR_CMD] ? null : app.getEffectiveGridSize(),
          appState.lineBendingMode, // Pass bend mode to create curved point if needed
        );
        
        mutateElement(element, {
          points: [...element.points, newPoint],
        });
        ret.didAddPoint = true;
      }

      store.shouldCaptureIncrement();
      ret.linearElementEditor = {
        ...linearElementEditor,
        pointerDownState: {
          prevSelectedPointsIndices: linearElementEditor.selectedPointsIndices,
          lastClickedPoint: -1,
          lastClickedIsEndPoint: false,
          origin: { x: scenePointer.x, y: scenePointer.y },
          segmentMidpoint: {
            value: segmentMidpoint === false ? null : segmentMidpoint,
            index: segmentMidpointIndex,
            added: false,
          },
          handleType: null,
        },
        selectedPointsIndices: [element.points.length - 1],
        lastUncommittedPoint: null,
        endBindingElement: getHoveredElementForBinding(
          scenePointer,
          elements,
          elementsMap as NonDeletedSceneElementsMap,
        ),
      };

      return ret;
    }

    // Handle regular point selection
    if (hitPoint) {
      const [pointIndex] = hitPoint;
      ret.hitElement = element;

      const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const targetPoint = rotate(
        element.x + element.points[pointIndex].x,
        element.y + element.points[pointIndex].y,
        cx,
        cy,
        element.angle,
      );

      const nextSelectedPointsIndices = event.shiftKey
        ? normalizeSelectedPoints([
            ...(linearElementEditor.selectedPointsIndices || []),
            pointIndex,
          ])
        : [pointIndex];

      ret.linearElementEditor = {
        ...linearElementEditor,
        pointerDownState: {
          prevSelectedPointsIndices: linearElementEditor.selectedPointsIndices,
          lastClickedPoint: pointIndex,
          lastClickedIsEndPoint: pointIndex === element.points.length - 1,
          origin: { x: scenePointer.x, y: scenePointer.y },
          segmentMidpoint: {
            value: null,
            index: null,
            added: false,
          },
          handleType: null,
        },
        selectedPointsIndices: nextSelectedPointsIndices,
        pointerOffset: targetPoint
          ? {
              x: scenePointer.x - targetPoint.x,
              y: scenePointer.y - targetPoint.y,
            }
          : { x: 0, y: 0 },
      };
    } else if (segmentMidpoint) {
      ret.hitElement = element;
    } else if (isBindingEnabled(appState) && isBindingElement(element)) {
      const { startBindingElement, endBindingElement } = linearElementEditor;
      bindOrUnbindLinearElement(
        element,
        startBindingElement,
        endBindingElement,
        elementsMap as NonDeletedSceneElementsMap,
        scene,
      );
    }

    return ret;
  }

  static arePointsEqual(point1: Point | null, point2: Point | null) {
    if (!point1 && !point2) {
      return true;
    }
    if (!point1 || !point2) {
      return false;
    }
    return arePointsEqual(point1, point2);
  }

  static handlePointerMove(
    event: React.PointerEvent<HTMLCanvasElement>,
    scenePointerX: number,
    scenePointerY: number,
    app: AppClassProperties,
    elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  ): LinearElementEditor | null {
    const appState = app.state;
    if (!appState.editingLinearElement) {
      return null;
    }
    const { elementId, lastUncommittedPoint } = appState.editingLinearElement;
    const element = LinearElementEditor.getElement(elementId, elementsMap);
    if (!element) {
      return appState.editingLinearElement;
    }

    const { points } = element;
    const lastPoint = points[points.length - 1];

    if (!event.altKey) {
      if (lastPoint === lastUncommittedPoint) {
        LinearElementEditor.deletePoints(
          element,
          [points.length - 1],
          elementsMap,
        );
      }
      return {
        ...appState.editingLinearElement,
        lastUncommittedPoint: null,
      };
    }

    let newPoint: Point;

    if (shouldRotateWithDiscreteAngle(event) && points.length >= 2) {
      const lastCommittedPoint = points[points.length - 2];

      const {x: width, y: height} = LinearElementEditor._getShiftLockedDelta(
        element,
        elementsMap,
        lastCommittedPoint,
        { x: scenePointerX, y: scenePointerY },
        event[KEYS.CTRL_OR_CMD] ? null : app.getEffectiveGridSize(),
      );

      newPoint = {
        x: width + lastCommittedPoint.x,
        y: height + lastCommittedPoint.y,
        isCurve: lastCommittedPoint.isCurve,
        mirroring: lastCommittedPoint.mirroring,
        borderRadius: lastCommittedPoint.borderRadius,
        handleIn: lastCommittedPoint.handleIn && {x: lastCommittedPoint.handleIn.x + width, y: lastCommittedPoint.handleIn.y + height},
        handleOut: lastCommittedPoint.handleOut && {x: lastCommittedPoint.handleOut.x + width, y: lastCommittedPoint.handleOut.y + height},
      };
    } else {
      newPoint = LinearElementEditor.createPointAt(
        element,
        elementsMap,
        scenePointerX - appState.editingLinearElement.pointerOffset.x,
        scenePointerY - appState.editingLinearElement.pointerOffset.y,
        event[KEYS.CTRL_OR_CMD] || isElbowArrow(element)
          ? null
          : app.getEffectiveGridSize(),
      );
    }

    if (lastPoint === lastUncommittedPoint) {
      LinearElementEditor.movePoints(
        element,
        [
          {
            index: element.points.length - 1,
            point: newPoint,
          },
        ],
        elementsMap,
      );
    } else {
      LinearElementEditor.addPoints(
        element,
        [{ point: newPoint }],
        elementsMap,
      );
    }
    return {
      ...appState.editingLinearElement,
      lastUncommittedPoint: element.points[element.points.length - 1],
    };
  }

  /** scene coords */
  static getPointGlobalCoordinates(
    element: NonDeleted<DucLinearElement>,
    point: Point,
    elementsMap: ElementsMap,
  ) {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    let { x, y } = element;
    const rotatePoint = rotate(x + point.x, y + point.y, cx, cy, element.angle);
    x = rotatePoint.x;
    y = rotatePoint.y;
    return {x, y} as const;
  }

  /** scene coords */
  static getPointsGlobalCoordinates(
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
  ): Point[] {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    return element.points.map((point) => {
      let { x, y } = element;
      let handleIn = point.handleIn
      let handleOut = point.handleOut
      const rotatePoint = rotate(x + point.x, y + point.y, cx, cy, element.angle);
      if (point.isCurve) {
        if(handleIn)
          handleIn = rotate(x + handleIn.x, y + handleIn.y, cx, cy, element.angle);
        if(handleOut)
          handleOut = rotate(x + handleOut.x, y + handleOut.y, cx, cy, element.angle);
      }
      x = rotatePoint.x;
      y = rotatePoint.y;
      return {...point, x, y, handleIn, handleOut} as const;
    });
  }

  static getPointAtIndexGlobalCoordinates(
    element: NonDeleted<DucLinearElement>,

    indexMaybeFromEnd: number, // -1 for last element
    elementsMap: ElementsMap,
  ): Point {
    const index =
      indexMaybeFromEnd < 0
        ? element.points.length + indexMaybeFromEnd
        : indexMaybeFromEnd;
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    const point = element.points[index];
    const { x, y } = element;
    return point
      ? rotate(x + point.x, y + point.y, cx, cy, element.angle)
      : rotate(x, y, cx, cy, element.angle);
  }

  static pointFromAbsoluteCoords(
    element: NonDeleted<DucLinearElement>,
    absoluteCoords: Point,
    elementsMap: ElementsMap,
  ): Point {
    if (isElbowArrow(element)) {
      // No rotation for elbow arrows
      return {x: absoluteCoords.x - element.x, y: absoluteCoords.y - element.y};
    }

    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const {x, y} = rotate(
      absoluteCoords.x,
      absoluteCoords.y,
      cx,
      cy,
      -element.angle,
    );
    return {x: x - element.x, y: y - element.y};
  }

  static getPointIndexUnderCursor(
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
    zoom: AppState["zoom"],
    x: number,
    y: number,
    appState: AppState,
  ): PointIndex | null {
    const pointHandles = LinearElementEditor.getPointsGlobalCoordinates(
      element,
      elementsMap,
    );
    let idx = pointHandles.length;
    
    // loop from right to left because points on the right are rendered over
    // points on the left, thus should take precedence when clicking
    while (--idx > -1) {
      const point = pointHandles[idx];
      const isSelected = appState?.editingLinearElement?.selectedPointsIndices?.includes(idx);
      
      if (isSelected && point.isCurve) {
        // Check handleIn if it exists
        if (point.handleIn) {
          if (
            distance2d(x, y, point.handleIn.x, point.handleIn.y) * zoom.value <
            LinearElementEditor.POINT_HANDLE_SIZE + 1
          ) {
            return [idx, 'handleIn'];
          }
        }
        
        // Check handleOut if it exists
        if (point.handleOut) {
          if (
            distance2d(x, y, point.handleOut.x, point.handleOut.y) * zoom.value <
            LinearElementEditor.POINT_HANDLE_SIZE + 1
          ) {
            return [idx, 'handleOut'];
          }
        }
      }

      // Check the main point
      if (
        distance2d(x, y, point.x, point.y) * zoom.value <
        LinearElementEditor.POINT_HANDLE_SIZE + 1
      ) {
        return [idx, 'point'];
      }
    }
    
    return null;
  }

  static createPointAt(
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
    scenePointerX: number,
    scenePointerY: number,
    gridSize: NullableGridSize,
    isCurve: boolean = false,
    mirroring: BezierMirroring | undefined = undefined,
  ): Point {
    const pointerOnGrid = getGridPoint(scenePointerX, scenePointerY, gridSize);
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const { x: rotatedX, y: rotatedY } = rotate(
      pointerOnGrid.x,
      pointerOnGrid.y,
      cx,
      cy,
      -element.angle,
    );
  
    const point: Point = {
      x: rotatedX - element.x,
      y: rotatedY - element.y,
      isCurve,
      mirroring: mirroring,
    };
  
    if (isCurve) {
      // Initialize handles for the curve point
      const defaultHandleLength = 50;
      point.handleIn = {
        x: point.x - defaultHandleLength,
        y: point.y,
      };
      point.handleOut = {
        x: point.x + defaultHandleLength,
        y: point.y,
      };
    }
  
    return point;
  }
  

  /**
   * Normalizes line points so that the start point is at [0,0]. This is
   * expected in various parts of the codebase. Also returns new x/y to account
   * for the potential normalization.
   */
  static getNormalizedPoints(element: DucLinearElement | { points: Point[], x: number, y: number }) {
    const { points, x, y } = element;

    const offsetX = points[0].x;
    const offsetY = points[0].y;

    return {
      points: points.map((point) => {
        return {
          ...point,
          x: point.x - offsetX, 
          y: point.y - offsetY,
          handleIn: point.handleIn && {x: point.handleIn.x - offsetX, y: point.handleIn.y - offsetY},
          handleOut: point.handleOut && {x: point.handleOut.x - offsetX, y: point.handleOut.y - offsetY},
        } as const;
      }),
      x: x + offsetX,
      y: y + offsetY,
    };
  }

  // element-mutating methods
  // ---------------------------------------------------------------------------

  static normalizePoints(element: NonDeleted<DucLinearElement>) {
    mutateElement(element, LinearElementEditor.getNormalizedPoints(element));
  }

  static duplicateSelectedPoints(
    appState: AppState,
    elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  ) {
    if (!appState.editingLinearElement) {
      return false;
    }

    const { selectedPointsIndices, elementId } = appState.editingLinearElement;
    const element = LinearElementEditor.getElement(elementId, elementsMap);

    if (!element || selectedPointsIndices === null) {
      return false;
    }

    const { points } = element;

    const nextSelectedIndices: number[] = [];

    let pointAddedToEnd = false;
    let indexCursor = -1;
    const nextPoints = points.reduce((acc: Point[], point, index) => {
      ++indexCursor;
      acc.push(point);

      const isSelected = selectedPointsIndices.includes(index);
      if (isSelected) {
        const nextPoint = points[index + 1];

        if (!nextPoint) {
          pointAddedToEnd = true;
        }
        acc.push(
          nextPoint
            ? {x:(point.x + nextPoint.x) / 2, y:(point.y + nextPoint.y) / 2}
            : {x:point.x, y:point.y},
        );

        nextSelectedIndices.push(indexCursor + 1);
        ++indexCursor;
      }

      return acc;
    }, []);

    mutateElement(element, { points: nextPoints });

    // temp hack to ensure the line doesn't move when adding point to the end,
    // potentially expanding the bounding box
    if (pointAddedToEnd) {
      const lastPoint = element.points[element.points.length - 1];
      LinearElementEditor.movePoints(
        element,
        [
          {
            index: element.points.length - 1,
            point: {
              x: lastPoint.x + 30, 
              y: lastPoint.y + 30,
              isCurve: lastPoint.isCurve,
              mirroring: lastPoint.mirroring,
              borderRadius: lastPoint.borderRadius,
              handleIn: lastPoint.handleIn && {x: lastPoint.handleIn.x + 30, y: lastPoint.handleIn.y + 30},
              handleOut: lastPoint.handleOut && {x: lastPoint.handleOut.x + 30, y: lastPoint.handleOut.y + 30},
            } as Point,
          },
        ],
        elementsMap,
      );
    }

    return {
      appState: {
        ...appState,
        editingLinearElement: {
          ...appState.editingLinearElement,
          selectedPointsIndices: nextSelectedIndices,
        },
      },
    };
  }

  static deletePoints(
    element: NonDeleted<DucLinearElement>,
    pointIndices: readonly number[],
    elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  ) {
    let offsetX = 0;
    let offsetY = 0;

    const isDeletingOriginPoint = pointIndices.includes(0);

    // if deleting first point, make the next to be [0,0] and recalculate
    // positions of the rest with respect to it
    if (isDeletingOriginPoint) {
      const firstNonDeletedPoint = element.points.find((point, idx) => {
        return !pointIndices.includes(idx);
      });
      if (firstNonDeletedPoint) {
        offsetX = firstNonDeletedPoint.x;
        offsetY = firstNonDeletedPoint.y;
      }
    }

    const nextPoints = element.points.reduce((acc: Point[], point, idx) => {
      if (!pointIndices.includes(idx)) {
        acc.push(
          !acc.length ? {x:0, y:0} : {x: point.x - offsetX, y: point.y - offsetY},
        );
      }
      return acc;
    }, []);

    LinearElementEditor._updatePoints(
      element,
      nextPoints,
      offsetX,
      offsetY,
      elementsMap,
    );
  }

  static addPoints(
    element: NonDeleted<DucLinearElement>,
    targetPoints: { point: Point }[],
    elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  ) {
    const offsetX = 0;
    const offsetY = 0;

    const nextPoints = [...element.points, ...targetPoints.map((x) => x.point)];
    LinearElementEditor._updatePoints(
      element,
      nextPoints,
      offsetX,
      offsetY,
      elementsMap,
    );
  }

  static movePoints(
    element: NonDeleted<DucLinearElement>,
    targetPoints: { index: number; point: Point; isDragging?: boolean }[],
    elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
    otherUpdates?: {
      startBinding?: PointBinding | null;
      endBinding?: PointBinding | null;
    },
    options?: {
      changedElements?: Map<string, OrderedDucElement>;
      isDragging?: boolean;
    },
  ) {
    const { points } = element;

    // in case we're moving start point, instead of modifying its position
    // which would break the invariant of it being at [0,0], we move
    // all the other points in the opposite direction by delta to
    // offset it. We do the same with actual element.x/y position, so
    // this hacks are completely transparent to the user.
    let offsetX = 0;
    let offsetY = 0;

    const selectedOriginPoint = targetPoints.find(({ index }) => index === 0);

    if (selectedOriginPoint) {
      offsetX =
        selectedOriginPoint.point.x + points[selectedOriginPoint.index].x;
      offsetY =
        selectedOriginPoint.point.y + points[selectedOriginPoint.index].y;
    }

    const nextPoints = points.map((point, idx) => {
      const selectedPointData = targetPoints.find((p) => p.index === idx);
      if (selectedPointData) {
        if (selectedPointData.index === 0) {
          return point;
        }

        const deltaX =
          selectedPointData.point.x - points[selectedPointData.index].x;
        const deltaY =
          selectedPointData.point.y - points[selectedPointData.index].y;

        return {
          x: point.x + deltaX - offsetX,
          y: point.y + deltaY - offsetY,
          isCurve: point.isCurve,
          borderRadius: point.borderRadius,
          mirroring: point.mirroring,
          handleIn: point.handleIn && {x: point.handleIn.x + deltaX - offsetX, y: point.handleIn.y + deltaY - offsetY},
          handleOut: point.handleOut && {x: point.handleOut.x + deltaX - offsetX, y: point.handleOut.y + deltaY - offsetY},
        } as const;
      }
      return offsetX || offsetY
        ? ({x: point.x - offsetX, y: point.y - offsetY} as const)
        : point;
    });

    LinearElementEditor._updatePoints(
      element,
      nextPoints,
      offsetX,
      offsetY,
      elementsMap,
      otherUpdates,
      {
        isDragging: targetPoints.reduce(
          (dragging, targetPoint): boolean =>
            dragging || targetPoint.isDragging === true,
          false,
        ),
        changedElements: options?.changedElements,
      },
    );
  }

  static shouldAddMidpoint(
    linearElementEditor: LinearElementEditor,
    pointerCoords: PointerCoords,
    appState: AppState,
    elementsMap: ElementsMap,
  ) {
    const element = LinearElementEditor.getElement(
      linearElementEditor.elementId,
      elementsMap,
    );

    // Elbow arrows don't allow midpoints
    if (element && isElbowArrow(element)) {
      return false;
    }

    if (!element) {
      return false;
    }

    const { segmentMidpoint } = linearElementEditor.pointerDownState;

    if (
      segmentMidpoint.added ||
      segmentMidpoint.value === null ||
      segmentMidpoint.index === null ||
      linearElementEditor.pointerDownState.origin === null
    ) {
      return false;
    }

    const origin = linearElementEditor.pointerDownState.origin!;
    const dist = distance2d(
      origin.x,
      origin.y,
      pointerCoords.x,
      pointerCoords.y,
    );
    if (
      !appState.editingLinearElement &&
      dist < DRAGGING_THRESHOLD / appState.zoom.value
    ) {
      return false;
    }
    return true;
  }

  static addMidpoint(
    linearElementEditor: LinearElementEditor,
    pointerCoords: PointerCoords,
    app: AppClassProperties,
    snapToGrid: boolean,
    elementsMap: ElementsMap,
  ) {
    const element = LinearElementEditor.getElement(
      linearElementEditor.elementId,
      elementsMap,
    );
    if (!element) {
      return;
    }
    const { segmentMidpoint } = linearElementEditor.pointerDownState;
    const ret: {
      pointerDownState: LinearElementEditor["pointerDownState"];
      selectedPointsIndices: LinearElementEditor["selectedPointsIndices"];
    } = {
      pointerDownState: linearElementEditor.pointerDownState,
      selectedPointsIndices: linearElementEditor.selectedPointsIndices,
    };

    const midpoint = LinearElementEditor.createPointAt(
      element,
      elementsMap,
      pointerCoords.x,
      pointerCoords.y,
      snapToGrid && !isElbowArrow(element) ? app.getEffectiveGridSize() : null,
    );
    const points = [
      ...element.points.slice(0, segmentMidpoint.index!),
      midpoint,
      ...element.points.slice(segmentMidpoint.index!),
    ];

    mutateElement(element, {
      points,
    });

    ret.pointerDownState = {
      ...linearElementEditor.pointerDownState,
      segmentMidpoint: {
        ...linearElementEditor.pointerDownState.segmentMidpoint,
        added: true,
      },
      lastClickedPoint: segmentMidpoint.index!,
    };
    ret.selectedPointsIndices = [segmentMidpoint.index!];
    return ret;
  }

  private static _updatePoints(
    element: NonDeleted<DucLinearElement>,
    nextPoints: readonly Point[],
    offsetX: number,
    offsetY: number,
    elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
    otherUpdates?: {
      startBinding?: PointBinding | null;
      endBinding?: PointBinding | null;
    },
    options?: {
      changedElements?: Map<string, OrderedDucElement>;
      isDragging?: boolean;
    },
  ) {
    if (isElbowArrow(element)) {
      const bindings: {
        startBinding?: FixedPointBinding | null;
        endBinding?: FixedPointBinding | null;
      } = {};
      if (otherUpdates?.startBinding !== undefined) {
        bindings.startBinding =
          otherUpdates.startBinding !== null &&
          isFixedPointBinding(otherUpdates.startBinding)
            ? otherUpdates.startBinding
            : null;
      }
      if (otherUpdates?.endBinding !== undefined) {
        bindings.endBinding =
          otherUpdates.endBinding !== null &&
          isFixedPointBinding(otherUpdates.endBinding)
            ? otherUpdates.endBinding
            : null;
      }

      const mergedElementsMap = options?.changedElements
        ? toBrandedType<SceneElementsMap>(
            new Map([...elementsMap, ...options.changedElements]),
          )
        : elementsMap;

      mutateElbowArrow(
        element,
        mergedElementsMap,
        nextPoints,
        {x: offsetX, y: offsetY},
        bindings,
        options,
      );
    } else {
      const nextCoords = getElementPointsCoords(element, nextPoints);
      const prevCoords = getElementPointsCoords(element, element.points);
      const nextCenterX = (nextCoords[0] + nextCoords[2]) / 2;
      const nextCenterY = (nextCoords[1] + nextCoords[3]) / 2;
      const prevCenterX = (prevCoords[0] + prevCoords[2]) / 2;
      const prevCenterY = (prevCoords[1] + prevCoords[3]) / 2;
      const dX = prevCenterX - nextCenterX;
      const dY = prevCenterY - nextCenterY;
      const rotated = rotate(offsetX, offsetY, dX, dY, element.angle);
      mutateElement(element, {
        ...otherUpdates,
        points: nextPoints,
        x: element.x + rotated.x,
        y: element.y + rotated.y,
      });
    }
  }

  private static _getShiftLockedDelta(
    element: NonDeleted<DucLinearElement>,
    elementsMap: ElementsMap,
    referencePoint: Point,
    scenePointer: Point,
    gridSize: NullableGridSize,
  ) {
    const referencePointCoords = LinearElementEditor.getPointGlobalCoordinates(
      element,
      referencePoint,
      elementsMap,
    );

    if (isElbowArrow(element)) {
      return {
        x: scenePointer.x - referencePointCoords.x,
        y: scenePointer.y - referencePointCoords.y,
      }
    }

    const {x: gridX, y: gridY} = getGridPoint(
      scenePointer.x,
      scenePointer.y,
      gridSize,
    );

    const { width, height } = getLockedLinearCursorAlignSize(
      referencePointCoords.x,
      referencePointCoords.y,
      gridX,
      gridY,
    );

    return rotatePoint({x:width, y:height}, {x:0, y:0}, -element.angle);
  }

  static getBoundTextElementPosition = (
    element: DucLinearElement,
    boundTextElement: DucTextElementWithContainer,
    elementsMap: ElementsMap,
  ): { x: number; y: number } => {
    const points = LinearElementEditor.getPointsGlobalCoordinates(
      element,
      elementsMap,
    );
    if (points.length < 2) {
      mutateElement(boundTextElement, { isDeleted: true });
    }
    let x = 0;
    let y = 0;
    if (element.points.length % 2 === 1) {
      const index = Math.floor(element.points.length / 2);
      const midPoint = LinearElementEditor.getPointGlobalCoordinates(
        element,
        element.points[index],
        elementsMap,
      );
      x = midPoint.x - boundTextElement.width / 2;
      y = midPoint.y - boundTextElement.height / 2;
    } else {
      const index = element.points.length / 2 - 1;

      let midSegmentMidpoint = editorMidPointsCache.points[index];
      if (element.points.length === 2) {
        midSegmentMidpoint = centerPoint(points[0], points[1]);
      }
      if (
        !midSegmentMidpoint ||
        editorMidPointsCache.version !== element.version
      ) {
        midSegmentMidpoint = LinearElementEditor.getSegmentMidPoint(
          element,
          points[index],
          points[index + 1],
          index + 1,
          elementsMap,
        );
      }
      x = midSegmentMidpoint.x - boundTextElement.width / 2;
      y = midSegmentMidpoint.y - boundTextElement.height / 2;
    }
    return { x, y };
  };

  static getMinMaxXYWithBoundText = (
    element: DucLinearElement,
    elementsMap: ElementsMap,
    elementBounds: Bounds,
    boundTextElement: DucTextElementWithContainer,
  ): [number, number, number, number, number, number] => {
    let [x1, y1, x2, y2] = elementBounds;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const { x: boundTextX1, y: boundTextY1 } =
      LinearElementEditor.getBoundTextElementPosition(
        element,
        boundTextElement,
        elementsMap,
      );
    const boundTextX2 = boundTextX1 + boundTextElement.width;
    const boundTextY2 = boundTextY1 + boundTextElement.height;

    const topLeftRotatedPoint = rotatePoint({x:x1, y:y1}, {x:cx, y:cy}, element.angle);
    const topRightRotatedPoint = rotatePoint({x:x2, y:y1}, {x:cx, y:cy}, element.angle);

    const counterRotateBoundTextTopLeft = rotatePoint(
      {x:boundTextX1, y:boundTextY1},
      {x:cx, y:cy},
      -element.angle,
    );
    const counterRotateBoundTextTopRight = rotatePoint(
      {x:boundTextX2, y:boundTextY1},
      {x:cx, y:cy},
      -element.angle,
    );
    const counterRotateBoundTextBottomLeft = rotatePoint(
      {x:boundTextX1, y:boundTextY2},
      {x:cx, y:cy},
      -element.angle,
    );
    const counterRotateBoundTextBottomRight = rotatePoint(
      {x:boundTextX2, y:boundTextY2},
      {x:cx, y:cy},
      -element.angle,
    );

    if (
      topLeftRotatedPoint.x < topRightRotatedPoint.x &&
      topLeftRotatedPoint.y >= topRightRotatedPoint.y
    ) {
      x1 = Math.min(x1, counterRotateBoundTextBottomLeft.x);
      x2 = Math.max(
        x2,
        Math.max(
          counterRotateBoundTextTopRight.x,
          counterRotateBoundTextBottomRight.x,
        ),
      );
      y1 = Math.min(y1, counterRotateBoundTextTopLeft.y);

      y2 = Math.max(y2, counterRotateBoundTextBottomRight.y);
    } else if (
      topLeftRotatedPoint.x >= topRightRotatedPoint.x &&
      topLeftRotatedPoint.y > topRightRotatedPoint.y
    ) {
      x1 = Math.min(x1, counterRotateBoundTextBottomRight.x);
      x2 = Math.max(
        x2,
        Math.max(
          counterRotateBoundTextTopLeft.x,
          counterRotateBoundTextTopRight.x,
        ),
      );
      y1 = Math.min(y1, counterRotateBoundTextBottomLeft.y);

      y2 = Math.max(y2, counterRotateBoundTextTopRight.y);
    } else if (topLeftRotatedPoint.x >= topRightRotatedPoint.x) {
      x1 = Math.min(x1, counterRotateBoundTextTopRight.x);
      x2 = Math.max(x2, counterRotateBoundTextBottomLeft.x);
      y1 = Math.min(y1, counterRotateBoundTextBottomRight.y);

      y2 = Math.max(y2, counterRotateBoundTextTopLeft.y);
    } else if (topLeftRotatedPoint.y <= topRightRotatedPoint.y) {
      x1 = Math.min(
        x1,
        Math.min(
          counterRotateBoundTextTopRight.x,
          counterRotateBoundTextTopLeft.x,
        ),
      );

      x2 = Math.max(x2, counterRotateBoundTextBottomRight.x);
      y1 = Math.min(y1, counterRotateBoundTextTopRight.y);
      y2 = Math.max(y2, counterRotateBoundTextBottomLeft.y);
    }

    return [x1, y1, x2, y2, cx, cy];
  };

  static handleBezierControlPointDrag(
    element: NonDeleted<DucLinearElement>,
    pointIndex: number,
    handleType: 'handleIn' | 'handleOut',
    newPosition: { x: number; y: number },
    event: PointerEvent,
  ) {
    const point = element.points[pointIndex];
    if (!point.isCurve) return;
  
    // Update the handle being dragged
    point[handleType] = newPosition;
  
    // Apply mirroring if needed
    const mirroring = point.mirroring;
    if (mirroring !== undefined && !event.altKey) {
      const oppositeHandleType = handleType === 'handleIn' ? 'handleOut' : 'handleIn';
  
      const dx = newPosition.x - point.x;
      const dy = newPosition.y - point.y;
  
      if (!point[oppositeHandleType]) {
        point[oppositeHandleType] = { x: point.x, y: point.y };
      }
  
      if (mirroring === BEZIER_MIRRORING.ANGLE_LENGTH) {
        // Mirror angle and length
        point[oppositeHandleType]!.x = point.x - dx;
        point[oppositeHandleType]!.y = point.y - dy;
      } else if (mirroring === BEZIER_MIRRORING.ANGLE) {
        // Mirror angle only
        const oppositeLength = Math.hypot(
          point[oppositeHandleType]!.x - point.x,
          point[oppositeHandleType]!.y - point.y,
        );
        const angle = Math.atan2(dy, dx);
        point[oppositeHandleType]!.x = point.x - Math.cos(angle) * oppositeLength;
        point[oppositeHandleType]!.y = point.y - Math.sin(angle) * oppositeLength;
      }
    }
  
    return point;
  }

  static getElementAbsoluteCoords = (
    element: DucLinearElement,
    elementsMap: ElementsMap,
    includeBoundText: boolean = false,
  ): [number, number, number, number, number, number] => {
    let coords: [number, number, number, number, number, number];
    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;
  
    if (element.points.length < 2 || !ShapeCache.get(element)) {
      // When points are insufficient, calculate rough bounds
      const { minX, minY, maxX, maxY } = element.points.reduce(
        (limits, { x, y }) => {
          limits.minY = Math.min(limits.minY, y);
          limits.minX = Math.min(limits.minX, x);
          limits.maxX = Math.max(limits.maxX, x);
          limits.maxY = Math.max(limits.maxY, y);
  
          return limits;
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      );
      x1 = minX + element.x;
      y1 = minY + element.y;
      x2 = maxX + element.x;
      y2 = maxY + element.y;

    } else {
      const shape = ShapeCache.generateElementShape(element, null);
      const ops = getCurvePathOps(shape[0]); // first element is always the curve
      const [minX, minY, maxX, maxY] = getMinMaxXYFromCurvePathOps(ops);
      x1 = minX + element.x;
      y1 = minY + element.y;
      x2 = maxX + element.x;
      y2 = maxY + element.y;
    }
  
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    coords = [x1, y1, x2, y2, cx, cy];
  
    if (!includeBoundText) {
      return coords;
    }
  
    const boundTextElement = getBoundTextElement(element, elementsMap);
    if (boundTextElement) {
      coords = LinearElementEditor.getMinMaxXYWithBoundText(
        element,
        elementsMap,
        [x1, y1, x2, y2],
        boundTextElement,
      );
    }
  
    return coords;
  };  
}

const normalizeSelectedPoints = (
  points: (number | null)[],
): number[] | null => {
  let nextPoints = [
    ...new Set(points.filter((p) => p !== null && p !== -1)),
  ] as number[];
  nextPoints = nextPoints.sort((a, b) => a - b);
  return nextPoints.length ? nextPoints : null;
};


// Logic to render the linear path for the Line Element on Vanilla Canvas
export const renderLinearPath = (
  points: Point[],
  context: CanvasRenderingContext2D,
) => {
  context.moveTo(points[0].x, points[0].y);
          
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    if (current.isCurve && current.handleOut && next.handleIn) {
      context.bezierCurveTo(
        current.handleOut.x,
        current.handleOut.y,
        next.handleIn.x,
        next.handleIn.y,
        next.x,
        next.y,
      );
    } else if (current.isCurve && current.handleOut) {
      context.quadraticCurveTo(
        current.handleOut.x,
        current.handleOut.y,
        next.x,
        next.y,
      );
    } else if (next.isCurve && next.handleIn) {
      context.quadraticCurveTo(
        next.handleIn.x,
        next.handleIn.y,
        next.x,
        next.y,
      );
    } else {
      // Handle border radius for non-curve points
      const currentRadius = (!current.isCurve && current.borderRadius) || 0;
      const nextRadius = (!next.isCurve && next.borderRadius) || 0;

      if (currentRadius === 0 && nextRadius === 0) {
        context.lineTo(next.x, next.y);
      } else {
        // Calculate direction vector
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate start and end points considering radius
        const startRadius = Math.min(currentRadius, distance / 2);
        const endRadius = Math.min(nextRadius, distance / 2);

        // Calculate control points
        const startX = current.x + nx * startRadius;
        const startY = current.y + ny * startRadius;
        const endX = next.x - nx * endRadius;
        const endY = next.y - ny * endRadius;

        if (currentRadius === 0) {
          context.lineTo(startX, startY);
        }

        // Draw the rounded segment
        context.lineTo(startX, startY);
        if (endRadius > 0) {
          context.quadraticCurveTo(
            next.x,
            next.y,
            endX,
            endY
          );
        }
        if (nextRadius === 0) {
          context.lineTo(next.x, next.y);
        }
      }
    }
  }
};


// Logic to render the static linear path for Line Element on Static Canvas
export const renderStaticLinearPath = (
  element: DucLinearElement,
  generator: RoughGenerator,
) => {
  let shape: ElementShapes[typeof element.type];
  const options = generateRoughOptions(element);

  const points = element.points.length ? element.points : [{x: 0, y: 0}];
  
  if (points.some(p => p.handleIn || p.handleOut)) {
    // Generate SVG path for bezier curves
    const d = [`M ${points[0].x} ${points[0].y}`];
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      if (current.handleOut && next.handleIn) {
        // Cubic bezier curve
        d.push(`C ${current.handleOut.x} ${current.handleOut.y}, ${next.handleIn.x} ${next.handleIn.y}, ${next.x} ${next.y}`);
      } else if (current.handleOut) {
        // Quadratic bezier curve with only handleOut
        d.push(`Q ${current.handleOut.x} ${current.handleOut.y}, ${next.x} ${next.y}`);
      } else if (next.handleIn) {
        // Quadratic bezier curve with only handleIn
        d.push(`Q ${next.handleIn.x} ${next.handleIn.y}, ${next.x} ${next.y}`);
      } else {
        // Linear line segment
        d.push(`L ${next.x} ${next.y}`);
      }
    }

    const pathString = d.join(" ");
    shape = [generator.path(pathString, { ...options, preserveVertices: true })];
  } else {
    // Generate path for lines with border radius
    const d: string[] = [`M ${points[0].x} ${points[0].y}`];
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (!current.isCurve && !next.isCurve && 
          (current.borderRadius || next.borderRadius)) {
        // Calculate direction vector
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate radii
        const startRadius = Math.min(current.borderRadius || 0, distance / 2);
        const endRadius = Math.min(next.borderRadius || 0, distance / 2);

        // Calculate control points
        const startX = current.x + nx * startRadius;
        const startY = current.y + ny * startRadius;
        const endX = next.x - nx * endRadius;
        const endY = next.y - ny * endRadius;

        if (startRadius === 0) {
          d.push(`L ${startX} ${startY}`);
        }
        d.push(`L ${startX} ${startY}`);
        
        if (endRadius > 0) {
          d.push(`Q ${next.x} ${next.y} ${endX} ${endY}`);
        }
        
        if (endRadius === 0) {
          d.push(`L ${next.x} ${next.y}`);
        }
      } else {
        d.push(`L ${next.x} ${next.y}`);
      }
    }

    shape = [generator.path(d.join(" "), { ...options, preserveVertices: true })];
  }

  return shape;
}


// Utility functions for vector operations
const vectorLength = (x: number, y: number): number => {
  return Math.sqrt(x * x + y * y);
};

const normalizeVector = (x: number, y: number): [number, number] => {
  const length = vectorLength(x, y);
  return length === 0 ? [0, 0] : [x / length, y / length];
};

// Calculate handle positions based on surrounding points
const calculateHandlePositions = (
  points: Point[],
  pointIndex: number,
  isClosed: boolean = false
): { handleIn?: BezierHandle; handleOut?: BezierHandle; mirroring?: BezierMirroring } => {
  const point = points[pointIndex];
  let prevPoint = points[pointIndex - 1];
  let nextPoint = points[pointIndex + 1];

  // Handle closed paths
  if (isClosed) {
    if (!prevPoint) {
      prevPoint = points[points.length - 2];
    }
    if (!nextPoint) {
      nextPoint = points[1];
    }
  }

  // Initialize result object
  const result: { 
    handleIn?: BezierHandle; 
    handleOut?: BezierHandle;
    mirroring?: BezierMirroring 
  } = {};

  // Calculate vectors to previous and next points
  let prevVector: [number, number] | null = null;
  let nextVector: [number, number] | null = null;

  // If we have a previous point, calculate the vector from it
  if (prevPoint) {
    prevVector = normalizeVector(
      point.x - prevPoint.x,
      point.y - prevPoint.y
    );
  }

  // If we have a next point, calculate the vector to it
  if (nextPoint) {
    nextVector = normalizeVector(
      nextPoint.x - point.x,
      nextPoint.y - point.y
    );
  }

  // If both vectors are available, calculate the average direction
  if (prevVector && nextVector) {
    const avgVector = normalizeVector(
      (prevVector[0] + nextVector[0]) / 2,
      (prevVector[1] + nextVector[1]) / 2
    );

    // Calculate handle length based on distances to neighbors
    const prevDistance = vectorLength(
      prevPoint.x - point.x,
      prevPoint.y - point.y
    );
    const nextDistance = vectorLength(
      nextPoint.x - point.x,
      nextPoint.y - point.y
    );
    const handleLength = Math.min(prevDistance, nextDistance) / 3;

    // Assign both handles
    result.handleIn = {
      x: point.x - avgVector[0] * handleLength,
      y: point.y - avgVector[1] * handleLength
    };
    result.handleOut = {
      x: point.x + avgVector[0] * handleLength,
      y: point.y + avgVector[1] * handleLength
    };
    result.mirroring = BEZIER_MIRRORING.ANGLE_LENGTH;
  } else if (prevVector) {
    // Only previous point exists
    const handleLength = vectorLength(
      prevPoint.x - point.x,
      prevPoint.y - point.y
    ) / 3;

    // Create a tilted vector by rotating the prevVector by ~15 degrees
    const angle = -Math.PI / 12; // -15 degrees
    const tiltedVector: [number, number] = [
      prevVector[0] * Math.cos(angle) - prevVector[1] * Math.sin(angle),
      prevVector[0] * Math.sin(angle) + prevVector[1] * Math.cos(angle)
    ];

    result.handleIn = {
      x: point.x - tiltedVector[0] * handleLength,
      y: point.y - tiltedVector[1] * handleLength
    };
    result.mirroring = BEZIER_MIRRORING.NONE;
  } else if (nextVector) {
    // Only next point exists
    const handleLength = vectorLength(
      nextPoint.x - point.x,
      nextPoint.y - point.y
    ) / 3;

    // Create a tilted vector by rotating the nextVector by ~15 degrees
    const angle = Math.PI / 12; // 15 degrees
    const tiltedVector: [number, number] = [
      nextVector[0] * Math.cos(angle) - nextVector[1] * Math.sin(angle),
      nextVector[0] * Math.sin(angle) + nextVector[1] * Math.cos(angle)
    ];

    result.handleOut = {
      x: point.x + tiltedVector[0] * handleLength,
      y: point.y + tiltedVector[1] * handleLength
    };
    result.mirroring = BEZIER_MIRRORING.NONE;
  }

  return result;
};

// Updated point initialization logic
const initializeCurvePoint = (
  element: DucLinearElement,
  pointIndex: number,
): Point => {
  const point = element.points[pointIndex];
  const isClosed = element.points.length > 2 && arePointsEqual(
    element.points[0],
    element.points[element.points.length - 1]
  );

  if (!point.isCurve) {
    // Calculate intelligent handle positions
    const { handleIn, handleOut, mirroring } = calculateHandlePositions(
      element.points as Point[],
      pointIndex,
      isClosed
    );

    return {
      ...point,
      isCurve: true,
      mirroring,
      handleIn,
      handleOut
    };
  } else {
    // Reset point to linear
    return {
      ...point,
      isCurve: false,
      mirroring: undefined,
      handleIn: undefined,
      handleOut: undefined
    };
  }
};