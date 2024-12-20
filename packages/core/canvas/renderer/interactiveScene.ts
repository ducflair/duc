import {
  getElementAbsoluteCoords,
  getTransformHandlesFromCoords,
  getTransformHandles,
  getCommonBounds,
} from "../element";

import { roundRect } from "../renderer/roundRect";

import {
  getScrollBars,
  SCROLLBAR_COLOR,
  SCROLLBAR_WIDTH,
} from "../scene/scrollbars";

import { getFreeDrawPath2D } from "../renderer/renderElement";
import { renderLinearPath } from "../element/linearElementEditor";;
import { getClientColor, renderRemoteCursors } from "../clients";
import {
  isSelectedViaGroup,
  getSelectedGroupIds,
  getElementsInGroup,
  selectGroupsFromGivenElements,
} from "../groups";
import type {
  TransformHandles,
  TransformHandleType,
} from "../element/transformHandles";
import {
  getOmitSidesForDevice,
  shouldShowBoundingBox,
} from "../element/transformHandles";
import { arrayToMap, throttleRAF } from "../utils";
import type { AppState, InteractiveCanvasAppState, Point } from "../types";
import { DEFAULT_TRANSFORM_HANDLE_SPACING, FILL_SELECTION_COLOR, FILL_INTERSECT_SELECTION_COLOR, FRAME_STYLE, POINT_SELECTION_COLOR, STROKE_INTERSECT_SELECTION_COLOR, STROKE_LINEAR_EDITOR_COLOR, THEME } from "../constants";

import { renderSnaps } from "../renderer/renderSnaps";

import type {
  SuggestedBinding,
  SuggestedPointBinding,
} from "../element/binding";
import { maxBindingGap } from "../element/binding";
import { LinearElementEditor } from "../element/linearElementEditor";
import {
  bootstrapCanvas,
  fillCircle,
  getNormalizedCanvasDimensions,
} from "./helpers";
import oc from "open-color";
import {
  isArrowElement,
  isElbowArrow,
  isFrameLikeElement,
  isLinearElement,
  isTextElement,
} from "../element/typeChecks";
import type {
  ElementsMap,
  DucBindableElement,
  DucElement,
  DucFrameLikeElement,
  DucLinearElement,
  DucTextElement,
  GroupId,
  NonDeleted,
  NonDeletedDucElement,
  DucFreeDrawElement,
} from "../element/types";
import type {
  InteractiveCanvasRenderConfig,
  InteractiveSceneRenderConfig,
  RenderableElementsMap,
} from "../scene/types";
import { getCornerRadius } from "../math";
import { COLOR_PALETTE } from "../colors";

const renderLinearElementPointHighlight = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  elementsMap: ElementsMap,
) => {
  const { elementId, hoverPointIndex } = appState.selectedLinearElement!;
  if (
    appState.editingLinearElement?.selectedPointsIndices?.includes(
      hoverPointIndex,
    )
  ) {
    return;
  }
  const element = LinearElementEditor.getElement(elementId, elementsMap);

  if (!element) {
    return;
  }
  const point = LinearElementEditor.getPointAtIndexGlobalCoordinates(
    element,
    hoverPointIndex,
    elementsMap,
  );
  context.save();
  context.translate(appState.scrollX, appState.scrollY);

  highlightPoint(point, context, appState);
  context.restore();
};

const highlightPoint = (
  point: Point,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
) => {
  context.fillStyle = "rgba(105, 101, 219, 0.4)";

  fillCircle(
    context,
    point.x,
    point.y,
    LinearElementEditor.POINT_HANDLE_SIZE / appState.zoom.value,
    false,
  );
};

const strokeRectWithRotation = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number,
  fill: boolean = false,
  /** should account for zoom */
  radius: number = 0,
) => {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  if (fill) {
    context.fillRect(x - cx, y - cy, width, height);
  }
  if (radius && context.roundRect) {
    context.beginPath();
    context.roundRect(x - cx, y - cy, width, height, radius);
    context.stroke();
    context.closePath();
  } else {
    context.strokeRect(x - cx, y - cy, width, height);
  }
  context.restore();
};

const strokeDiamondWithRotation = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number,
) => {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width / 2, 0);
  context.lineTo(0, -height / 2);
  context.lineTo(-width / 2, 0);
  context.closePath();
  context.stroke();
  context.restore();
};

const renderSingleLinearPoint = (
  renderConfig: InteractiveCanvasRenderConfig,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  point: Point,
  radius: number,
  isSelected: boolean,
  isPhantomPoint = false,
) => {
  const isEditMode = !!appState.editingLinearElement;
  const themeFillColor = appState.theme === THEME.LIGHT ? "white" : "#1E1E1E";
  const fillColor = isEditMode ? POINT_SELECTION_COLOR : themeFillColor;
  const strokeColor = isPhantomPoint ? (isEditMode ? STROKE_LINEAR_EDITOR_COLOR : renderConfig.selectionColor) : "#DFDFDF";
  
  context.strokeStyle = strokeColor;
  context.setLineDash([]);
  context.fillStyle = isSelected ? "#fff" : fillColor;

  const baseRadius = isEditMode ? (radius * 0.55) : radius;
  const circleRadius = (isSelected ? baseRadius * 1.5 : baseRadius) / appState.zoom.value;
  
  const lineWidth = isEditMode ? 4 / appState.zoom.value : 3.5 / appState.zoom.value;
  
  if (isSelected && point.isCurve) {
    context.save();
    context.strokeStyle = strokeColor;
    context.fillStyle = fillColor;

    const controlPointRadius = circleRadius * 0.6;  // Keep control point radius same as non-curve points
    const handlesLineWidth = lineWidth * 0.8;
    
    // Draw handleIn
    if (point.handleIn) {
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(point.handleIn.x, point.handleIn.y);
      context.lineWidth = handlesLineWidth;
      context.stroke();

      context.beginPath();
      context.arc(
        point.handleIn.x,
        point.handleIn.y,
        controlPointRadius,
        0,
        Math.PI * 2,
      );
      context.lineWidth = handlesLineWidth;
      context.stroke();
      context.fill();
    }

    // Draw handleOut
    if (point.handleOut) {
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(point.handleOut.x, point.handleOut.y);
      context.lineWidth = handlesLineWidth;
      context.stroke();

      context.beginPath();
      context.arc(
        point.handleOut.x,
        point.handleOut.y,
        controlPointRadius,
        0,
        Math.PI * 2,
      );
      context.lineWidth = handlesLineWidth;
      context.stroke();
      context.fill();
    }

    context.restore();
  }

  if (point.isCurve) {
    // Draw diamond for curve points
    context.save();
    context.beginPath();
    const size = circleRadius;
    
    // Align to pixel grid to avoid sub-pixel rendering issues
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    
    // Use translate to ensure the shape is centered on the point
    context.translate(x, y);
    context.moveTo(0, -size);
    context.lineTo(size, 0);
    context.lineTo(0, size);
    context.lineTo(-size, 0);
    context.closePath();
    context.translate(-x, -y);
    
    context.lineWidth = lineWidth;
    context.stroke();
    context.fill();
    context.restore();
  } else {
    // Draw circle for regular points
    context.beginPath();
    // Align to pixel grid
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    context.arc(x, y, circleRadius, 0, Math.PI * 2);
    context.lineWidth = lineWidth;
    context.stroke();
    context.fill();
  }
};


const strokeEllipseWithRotation = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number,
) => {
  context.beginPath();
  context.ellipse(cx, cy, width / 2, height / 2, angle, 0, Math.PI * 2);
  context.stroke();
};

const renderBindingHighlightForBindableElement = (
  context: CanvasRenderingContext2D,
  element: DucBindableElement,
  elementsMap: ElementsMap,
) => {
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const width = x2 - x1;
  const height = y2 - y1;
  const thickness = 10;

  // So that we don't overlap the element itself
  const strokeOffset = 4;
  context.strokeStyle = "rgba(0,0,0,.05)";
  context.lineWidth = thickness - strokeOffset;
  const padding = strokeOffset / 2 + thickness / 2;

  const radius = getCornerRadius(
    Math.min(element.width, element.height),
    element,
  );

  switch (element.type) {
    case "rectangle":
    case "text":
    case "image":
    case "iframe":
    case "embeddable":
    case "frame":
    case "magicframe":
      strokeRectWithRotation(
        context,
        x1 - padding,
        y1 - padding,
        width + padding * 2,
        height + padding * 2,
        x1 + width / 2,
        y1 + height / 2,
        element.angle,
        undefined,
        radius,
      );
      break;
    case "diamond":
      const side = Math.hypot(width, height);
      const wPadding = (padding * side) / height;
      const hPadding = (padding * side) / width;
      strokeDiamondWithRotation(
        context,
        width + wPadding * 2,
        height + hPadding * 2,
        x1 + width / 2,
        y1 + height / 2,
        element.angle,
      );
      break;
    case "ellipse":
      strokeEllipseWithRotation(
        context,
        width + padding * 2,
        height + padding * 2,
        x1 + width / 2,
        y1 + height / 2,
        element.angle,
      );
      break;
  }
};

const renderBindingHighlightForSuggestedPointBinding = (
  context: CanvasRenderingContext2D,
  suggestedBinding: SuggestedPointBinding,
  elementsMap: ElementsMap,
) => {
  const [element, startOrEnd, bindableElement] = suggestedBinding;

  const threshold = maxBindingGap(
    bindableElement,
    bindableElement.width,
    bindableElement.height,
  );

  context.strokeStyle = "rgba(0,0,0,0)";
  context.fillStyle = "rgba(0,0,0,.05)";

  const pointIndices =
    startOrEnd === "both" ? [0, -1] : startOrEnd === "start" ? [0] : [-1];
  pointIndices.forEach((index) => {
    const {x, y} = LinearElementEditor.getPointAtIndexGlobalCoordinates(
      element,
      index,
      elementsMap,
    );
    fillCircle(context, x, y, threshold);
  });
};

const handleBorderOnHover = (
  renderConfig: InteractiveCanvasRenderConfig,
  context: CanvasRenderingContext2D, 
  appState: InteractiveCanvasAppState,
  elementsMap: ElementsMap,
) => {
  const element = appState.elementHovered;
  if (
    !element || 
    appState.selectedElementIds[element.id] || 
    element.groupIds.some(groupId => appState.selectedGroupIds[groupId])
  ) {
    return;
  }
  const [elementX1, elementY1, elementX2, elementY2] = getElementAbsoluteCoords(element, elementsMap);
  const width = elementX2 - elementX1;
  const height = elementY2 - elementY1;

  renderSelectionBorder(
    context,
    appState,
    {
      angle: element.angle,
      elementX1,
      elementY1,
      elementX2,
      elementY2,
      selectionColors: [renderConfig.selectionColor],
      dashed: false,
      cx: elementX1 + width / 2,
      cy: elementY1 + height / 2,
      activeEmbeddable: false,
      element: element,
    },
    elementsMap,
  );

  // context.restore();
}

export const renderSelectionElement = (
  renderConfig: InteractiveCanvasRenderConfig,
  element: NonDeleted<DucElement>,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  selectionDirection: AppState["selectionDirection"] = "right",
) => {
  context.save();
  context.translate(element.x + appState.scrollX, element.y + appState.scrollY);

  // render from 0.5px offset  to get 1px wide line
  // https://stackoverflow.com/questions/7530593/html5-canvas-and-line-width/7531540#7531540
  // TODO can be be improved by offseting to the negative when user selects
  // from right to left
  const offset = 0.5 / appState.zoom.value;
  context.lineWidth = 1 / appState.zoom.value;

  if (selectionDirection === "right") {
    // Normal selection to the right (solid blue)
    context.fillStyle = FILL_SELECTION_COLOR;
    context.strokeStyle = renderConfig.selectionColor;
    context.setLineDash([]); // Solid stroke

  } else if (selectionDirection === "left") {
    // Selection to the left (dashed green)
    context.fillStyle = FILL_INTERSECT_SELECTION_COLOR;
    context.strokeStyle = STROKE_INTERSECT_SELECTION_COLOR;
    context.setLineDash([5 / appState.zoom.value, 5 / appState.zoom.value]); // Dashed line
  }

  // Draw the filled rectangle
  context.fillRect(offset, offset, element.width, element.height);

  // Draw the border (either solid or dashed based on the direction)
  context.strokeRect(offset, offset, element.width, element.height);

  context.restore();
};

export const renderSelectionBorder = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  elementProperties: {
    angle: number;
    elementX1: number;
    elementY1: number;
    elementX2: number;
    elementY2: number;
    selectionColors: string[];
    dashed?: boolean;
    cx: number;
    cy: number;
    activeEmbeddable: boolean;
    element?: NonDeletedDucElement;
  },
  elementsMap: ElementsMap,
) => {
  const {
    angle,
    elementX1,
    elementY1,
    elementX2,
    elementY2,
    selectionColors,
    cx,
    cy,
    dashed,
    activeEmbeddable,
    element,
  } = elementProperties;
  const elementWidth = elementX2 - elementX1;
  const elementHeight = elementY2 - elementY1;

  const padding = DEFAULT_TRANSFORM_HANDLE_SPACING * 2;
  const lineWidth = 8 / appState.zoom.value;
  const spaceWidth = 4 / appState.zoom.value;

  context.save();
  context.translate(appState.scrollX, appState.scrollY);
  context.lineWidth = (activeEmbeddable ? 8 : 2) / appState.zoom.value;

  const count = selectionColors.length;
  for (let index = 0; index < count; ++index) {
    context.strokeStyle = selectionColors[index];
    if (dashed) {
      context.setLineDash([
        lineWidth,
        spaceWidth + (lineWidth + spaceWidth) * (count - 1),
      ]);
    }
    context.lineDashOffset = (lineWidth + spaceWidth) * index;

    // Draw custom border for the element
    if (element) {
      switch (element.type) {
        case "freedraw":
          strokeFreeDrawPath(context, element, elementsMap, appState);
          break;
        case "diamond":
          strokeDiamondWithRotation(
            context,
            elementWidth,
            elementHeight,
            cx,
            cy,
            angle,
          );
          break;
        case "ellipse":
          strokeEllipseWithRotation(
            context,
            elementWidth,
            elementHeight,
            cx,
            cy,
            angle,
          );
          break;
        case "line":
        case "arrow":
          if (isLinearElement(element)) {
            const points = LinearElementEditor.getPointsGlobalCoordinates(element, elementsMap);
            context.beginPath();
            renderLinearPath(points, context);
            context.stroke();
          }
          break;
        default:
          strokeRectWithRotation(
            context,
            elementX1,
            elementY1,
            elementWidth,
            elementHeight,
            cx,
            cy,
            angle,
          );
      }
    }

    // Draw outline connecting resize handles only if the element is selected
    const isSelected = element && appState.selectedElementIds[element.id];
    if (isSelected) {
      context.strokeStyle = selectionColors[index];
      context.lineWidth = 1 / appState.zoom.value;
      strokeRectWithRotation(
        context,
        elementX1 - padding / appState.zoom.value,
        elementY1 - padding / appState.zoom.value,
        elementWidth + (padding * 2) / appState.zoom.value,
        elementHeight + (padding * 2) / appState.zoom.value,
        cx,
        cy,
        angle,
      );
    }
  }
  context.restore();
};


const strokeFreeDrawPath = (
  context: CanvasRenderingContext2D,
  element: DucFreeDrawElement,
  elementsMap: ElementsMap,
  appState: InteractiveCanvasAppState,
) => {
  
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const shiftX = (x2 - x1) / 2 - (element.x - x1);
  const shiftY = (y2 - y1) / 2 - (element.y - y1);
  context.save();
  context.translate(cx, cy);
  context.rotate(element.angle);
  context.translate(-shiftX, -shiftY);

  // // Rotate if necessary
  // if (element.angle !== 0) {
  //   const centerX = element.width / 2;
  //   const centerY = element.height / 2;
  //   context.translate(centerX, centerY);
  //   context.rotate(element.angle);
  //   context.translate(-centerX, -centerY);
  // }

  // Get the path and stroke it
  const path = getFreeDrawPath2D(element);
  if (path) {
    context.stroke(path);
  }

  context.restore();
};


const renderBindingHighlight = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  suggestedBinding: SuggestedBinding,
  elementsMap: ElementsMap,
) => {
  const renderHighlight = Array.isArray(suggestedBinding)
    ? renderBindingHighlightForSuggestedPointBinding
    : renderBindingHighlightForBindableElement;

  context.save();
  context.translate(appState.scrollX, appState.scrollY);
  renderHighlight(context, suggestedBinding as any, elementsMap);

  context.restore();
};

const renderFrameHighlight = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  frame: NonDeleted<DucFrameLikeElement>,
  elementsMap: ElementsMap,
) => {
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(frame, elementsMap);
  const width = x2 - x1;
  const height = y2 - y1;

  context.strokeStyle = "rgb(0,118,255)";
  context.lineWidth = FRAME_STYLE.strokeWidth / appState.zoom.value;

  context.save();
  context.translate(appState.scrollX, appState.scrollY);
  strokeRectWithRotation(
    context,
    x1,
    y1,
    width,
    height,
    x1 + width / 2,
    y1 + height / 2,
    frame.angle,
    false,
    FRAME_STYLE.radius / appState.zoom.value,
  );
  context.restore();
};

const renderElementsBoxHighlight = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  elements: NonDeleted<DucElement>[],
  elementsMap: ElementsMap,
) => {
  const individualElements = elements.filter(
    (element) => element.groupIds.length === 0,
  );

  const elementsInGroups = elements.filter(
    (element) => element.groupIds.length > 0,
  );

  const getSelectionFromElements = (elements: DucElement[]) => {
    const [elementX1, elementY1, elementX2, elementY2] =
      getCommonBounds(elements);
    return {
      angle: 0,
      elementX1,
      elementX2,
      elementY1,
      elementY2,
      selectionColors: ["rgb(0,118,255)"],
      dashed: false,
      cx: elementX1 + (elementX2 - elementX1) / 2,
      cy: elementY1 + (elementY2 - elementY1) / 2,
      activeEmbeddable: false,
    };
  };

  const getSelectionForGroupId = (groupId: GroupId) => {
    const groupElements = getElementsInGroup(elements, groupId);
    return getSelectionFromElements(groupElements);
  };

  Object.entries(selectGroupsFromGivenElements(elementsInGroups, appState))
    .filter(([id, isSelected]) => isSelected)
    .map(([id, isSelected]) => id)
    .map((groupId) => getSelectionForGroupId(groupId))
    .concat(
      individualElements.map((element) => getSelectionFromElements([element])),
    )
    .forEach((selection) =>
      renderSelectionBorder(context, appState, selection, elementsMap),
    );
};

const renderLinearElementSkeleton = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  element: NonDeleted<DucLinearElement>,
  elementsMap: RenderableElementsMap,
) => {
  const points = LinearElementEditor.getPointsGlobalCoordinates(element, elementsMap);
  context.save();
  context.strokeStyle = STROKE_LINEAR_EDITOR_COLOR;
  context.lineWidth = 3 / appState.zoom.value;
  context.setLineDash([]);
  
  context.beginPath();
  renderLinearPath(points, context);
  context.stroke();

  context.restore();
};

const renderLinearPointHandles = (
  renderConfig: InteractiveCanvasRenderConfig,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  element: NonDeleted<DucLinearElement>,
  elementsMap: RenderableElementsMap,
) => {
  if (!appState.selectedLinearElement) {
    return;
  }
  context.save();
  context.translate(appState.scrollX, appState.scrollY);
  context.lineWidth = 1 / appState.zoom.value;
  const points = LinearElementEditor.getPointsGlobalCoordinates(
    element,
    elementsMap,
  );

  const { POINT_HANDLE_SIZE } = LinearElementEditor;
  const radius = appState.editingLinearElement
    ? POINT_HANDLE_SIZE * 0.75
    : POINT_HANDLE_SIZE / 2;

  // Render skeleton in linear edit mode
  if (appState.editingLinearElement) {
    renderLinearElementSkeleton(context, appState, element, elementsMap);
  }

  // Render regular points
  points.forEach((point, idx) => {
    if (isElbowArrow(element) && idx !== 0 && idx !== points.length - 1) {
      return;
    }

    // Skip first point if it's at the same position as the last point
    if (idx === 0 && points.length > 1) {
      const lastPoint = points[points.length - 1];
      if (LinearElementEditor.arePointsEqual(point, lastPoint)) {
        return;
      }
    }

    const isSelected =
      !!appState.editingLinearElement?.selectedPointsIndices?.includes(idx);
    const isHovered =
      appState.selectedLinearElement?.hoverPointIndex === idx;

    renderSingleLinearPoint(
      renderConfig,
      context,
      appState,
      point,
      radius,
      isSelected,
      !isHovered
    );
  });

  // Rendering segment mid points
  if (appState.editingLinearElement) {
      
    //Rendering segment mid points
    const midPoints = LinearElementEditor.getEditorMidPoints(
      element,
      elementsMap,
      appState,
    ).filter((midPoint) => midPoint !== null) as Point[];

    
    // TODO: for the hover midpoint implementation
    // const MIDPOINT_HOVER_THRESHOLD = 10 / appState.zoom.value;
    // const midPoints = [];

    // for (let i = 0; i < points.length - 1; i++) {
    //   const point1 = points[i];
    //   const point2 = points[i + 1];
    //   const midPoint = {
    //     x: (point1.x + point2.x) / 2,
    //     y: (point1.y + point2.y) / 2,
    //   };
  
    //   const distance = distanceFromPointToLineSegment(
    //     { x: appState.cursorX, y: appState.cursorY },
    //     point1,
    //     point2,
    //   );
  
    //   if (distance < MIDPOINT_HOVER_THRESHOLD) {
    //     midPoints.push({ midPoint, index: i });
    //   }
    // }

    midPoints.forEach((segmentMidPoint) => {
      if (
        appState?.selectedLinearElement?.segmentMidPointHoveredCoords &&
        LinearElementEditor.arePointsEqual(
          segmentMidPoint,
          appState.selectedLinearElement.segmentMidPointHoveredCoords,
        )
      ) {
        // The order of renderingSingleLinearPoint and highLight points is different
        // inside vs outside editor as hover states are different,
        // in editor when hovered the original point is not visible as hover state fully covers it whereas outside the
        // editor original point is visible and hover state is just an outer circle.
        if (appState.editingLinearElement) {
          renderSingleLinearPoint(
            renderConfig,
            context,
            appState,
            segmentMidPoint,
            radius,
            false,
          );
          highlightPoint(segmentMidPoint, context, appState);
        } else {
          highlightPoint(segmentMidPoint, context, appState);
          renderSingleLinearPoint(
            renderConfig,
            context,
            appState,
            segmentMidPoint,
            radius,
            false,
          );
        }
      } else if (appState.editingLinearElement || points.length === 2) {
        renderSingleLinearPoint(
          renderConfig,
          context,
          appState,
          segmentMidPoint,
          POINT_HANDLE_SIZE / 2,
          false,
          true,
        );
      }
    });
  }

  context.restore();
};



const renderTransformHandles = (
  context: CanvasRenderingContext2D,
  renderConfig: InteractiveCanvasRenderConfig,
  appState: InteractiveCanvasAppState,
  transformHandles: TransformHandles,
  angle: number,
): void => {
  Object.keys(transformHandles).forEach((key) => {
    const transformHandle = transformHandles[key as TransformHandleType];
    if (transformHandle !== undefined) {
      const [x, y, width, height] = transformHandle;

      context.save();
      context.lineWidth = 1 / appState.zoom.value;
      if (renderConfig.selectionColor) {
        context.strokeStyle = renderConfig.selectionColor;
      }
      if (key === "rotation") {
        fillCircle(
          context, x + width / 2, y + height / 2, width / 2, true,
          appState.theme === THEME.LIGHT ? "white" : "black",
        );
        // prefer round corners if roundRect API is available
      } else if (context.roundRect) {
        context.beginPath();
        context.fillStyle = appState.theme === THEME.LIGHT ? "white" : "black";
        context.roundRect(x, y, width, height, 2 / appState.zoom.value);
        context.fill();
        context.stroke();
      } else {
        strokeRectWithRotation(
          context,
          x,
          y,
          width,
          height,
          x + width / 2,
          y + height / 2,
          angle,
          true, // fill before stroke
        );
      }
      context.restore();
    }
  });
};

const renderTextBox = (
  text: NonDeleted<DucTextElement>,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
  selectionColor: InteractiveCanvasRenderConfig["selectionColor"],
) => {
  context.save();
  const padding = (DEFAULT_TRANSFORM_HANDLE_SPACING * 2) / appState.zoom.value;
  const width = text.width + padding * 2;
  const height = text.height + padding * 2;
  const cx = text.x + width / 2;
  const cy = text.y + height / 2;
  const shiftX = -(width / 2 + padding);
  const shiftY = -(height / 2 + padding);
  context.translate(cx + appState.scrollX, cy + appState.scrollY);
  context.rotate(text.angle);
  context.lineWidth = 1 / appState.zoom.value;
  context.strokeStyle = selectionColor;
  context.strokeRect(shiftX, shiftY, width, height);
  context.restore();
};

const _renderInteractiveScene = ({
  canvas,
  elementsMap,
  visibleElements,
  selectedElements,
  allElementsMap,
  scale,
  appState,
  renderConfig,
  device,
}: InteractiveSceneRenderConfig) => {
  if (canvas === null) {
    return { atLeastOneVisibleElement: false, elementsMap };
  }

  const [normalizedWidth, normalizedHeight] = getNormalizedCanvasDimensions(
    canvas,
    scale,
  );
  
  const context = bootstrapCanvas({
    canvas,
    scale,
    normalizedWidth,
    normalizedHeight,
  });

  // Apply zoom
  context.save();
  context.scale(appState.zoom.value, appState.zoom.value);

  // Paint selection border if any element is hovered
  handleBorderOnHover(renderConfig, context, appState, elementsMap);

  let editingLinearElement: NonDeleted<DucLinearElement> | undefined =
    undefined;
  
  visibleElements.forEach((element) => {
    // Getting the element using LinearElementEditor during collab mismatches version - being one head of visible elements due to
    // ShapeCache returns empty hence making sure that we get the
    // correct element from visible elements
    if (appState.editingLinearElement?.elementId === element.id) {
      if (element) {
        editingLinearElement = element as NonDeleted<DucLinearElement>;
      }
    }
  });

  if (editingLinearElement) {
    renderLinearPointHandles(
      renderConfig,
      context,
      appState,
      editingLinearElement,
      elementsMap,
    );
  }

  // Paint selection element
  if (appState.selectionElement) {
    try {
      renderSelectionElement(
        renderConfig,
        appState.selectionElement,
        context,
        appState,
        appState.selectionDirection,
      );
    } catch (error: any) {
      console.error(error);
    }
  }


  if (
    appState.editingTextElement &&
    isTextElement(appState.editingTextElement)
  ) {
    const textElement = allElementsMap.get(appState.editingTextElement.id) as
      | DucTextElement
      | undefined;
    if (textElement && !textElement.autoResize) {
      renderTextBox(
        textElement,
        context,
        appState,
        renderConfig.selectionColor,
      );
    }
  }

  if (appState.isBindingEnabled) {
    appState.suggestedBindings
      .filter((binding) => binding != null)
      .forEach((suggestedBinding) => {
        renderBindingHighlight(
          context,
          appState,
          suggestedBinding!,
          elementsMap,
        );
      });
  }

  if (appState.frameToHighlight) {
    renderFrameHighlight(
      context,
      appState,
      appState.frameToHighlight,
      elementsMap,
    );
  }

  if (appState.elementsToHighlight) {
    renderElementsBoxHighlight(context, appState, appState.elementsToHighlight, elementsMap);
  }

  const isFrameSelected = selectedElements.some((element) =>
    isFrameLikeElement(element),
  );

  // Getting the element using LinearElementEditor during collab mismatches version - being one head of visible elements due to
  // ShapeCache returns empty hence making sure that we get the
  // correct element from visible elements
  if (
    selectedElements.length === 1 &&
    appState.editingLinearElement?.elementId === selectedElements[0].id
  ) {
    renderLinearPointHandles(
      renderConfig,
      context,
      appState,
      selectedElements[0] as NonDeleted<DucLinearElement>,
      elementsMap,
    );
  }

  if (
    appState.selectedLinearElement &&
    appState.selectedLinearElement.hoverPointIndex >= 0 &&
    !(
      isElbowArrow(selectedElements[0]) &&
      appState.selectedLinearElement.hoverPointIndex > 0 &&
      appState.selectedLinearElement.hoverPointIndex <
        selectedElements[0].points.length - 1
    )
  ) {
    renderLinearElementPointHighlight(context, appState, elementsMap);
  }
  // Paint selected elements
  if (!appState.multiElement && !appState.editingLinearElement) {
    const showBoundingBox = shouldShowBoundingBox(selectedElements, appState);

    const isSingleLinearElementSelected =
      selectedElements.length === 1 && isLinearElement(selectedElements[0]);

    const selectionColor = renderConfig.selectionColor;

    if (showBoundingBox) {
      // Optimisation for finding quickly relevant element ids
      const locallySelectedIds = arrayToMap(selectedElements);

      const selections: {
        angle: number;
        elementX1: number;
        elementY1: number;
        elementX2: number;
        elementY2: number;
        selectionColors: string[];
        dashed?: boolean;
        cx: number;
        cy: number;
        activeEmbeddable: boolean;
        element?: NonDeletedDucElement;
      }[] = [];

      for (const element of elementsMap.values()) {
        const selectionColors = [];
        const remoteClients = renderConfig.remoteSelectedElementIds.get(
          element.id,
        );
        if (
          !(
            // Elbow arrow elements cannot be selected when bound on either end
            (
              isSingleLinearElementSelected &&
              isArrowElement(element) &&
              isElbowArrow(element) &&
              (element.startBinding || element.endBinding)
            )
          )
        ) {
          // local user
          if (
            locallySelectedIds.has(element.id) &&
            !isSelectedViaGroup(appState, element)
          ) {
            selectionColors.push(selectionColor);
          }
          // remote users
          if (remoteClients) {
            selectionColors.push(
              ...remoteClients.map((socketId) => {
                const background = getClientColor(
                  socketId,
                  appState.collaborators.get(socketId),
                );
                return background;
              }),
            );
          }
        }

        if (selectionColors.length) {
          const [elementX1, elementY1, elementX2, elementY2, cx, cy] =
            getElementAbsoluteCoords(element, elementsMap, true);
          selections.push({
            angle: element.angle,
            elementX1,
            elementY1,
            elementX2,
            elementY2,
            selectionColors,
            dashed: !!remoteClients,
            cx,
            cy,
            activeEmbeddable:
              appState.activeEmbeddable?.element === element &&
              appState.activeEmbeddable.state === "active",
            element: element,
          });
        }
      }

      const addSelectionForGroupId = (groupId: GroupId) => {
        const groupElements = getElementsInGroup(elementsMap, groupId);
        const [elementX1, elementY1, elementX2, elementY2] =
          getCommonBounds(groupElements);
        selections.push({
          angle: 0,
          elementX1,
          elementX2,
          elementY1,
          elementY2,
          selectionColors: ['#6965db'],
          dashed: true,
          cx: elementX1 + (elementX2 - elementX1) / 2,
          cy: elementY1 + (elementY2 - elementY1) / 2,
          activeEmbeddable: false,
          element: undefined,
        });
      };

      for (const groupId of getSelectedGroupIds(appState)) {
        // TODO: support multiplayer selected group IDs
        addSelectionForGroupId(groupId);
      }

      if (appState.editingGroupId) {
        addSelectionForGroupId(appState.editingGroupId);
      }

      selections.forEach((selection) =>
        renderSelectionBorder(context, appState, selection, elementsMap),
      );
    }

    // Paint resize transformHandles
    context.save();
    context.translate(appState.scrollX, appState.scrollY);

    if (selectedElements.length === 1) {
      context.fillStyle = oc.white;
      const transformHandles = getTransformHandles(
        selectedElements[0],
        appState.zoom,
        elementsMap,
        "mouse", // when we render we don't know which pointer type so use mouse,
        getOmitSidesForDevice(device),
      );
      if (
        !appState.viewModeEnabled &&
        showBoundingBox &&
        // do not show transform handles when text is being edited
        !isTextElement(appState.editingTextElement)
      ) {
        renderTransformHandles(
          context,
          renderConfig,
          appState,
          transformHandles,
          selectedElements[0].angle,
        );
      }
    } else if (selectedElements.length > 1 && !appState.isRotating) {
      const dashedLinePadding =
        (DEFAULT_TRANSFORM_HANDLE_SPACING * 2) / appState.zoom.value;
      context.fillStyle = oc.white;
      const [x1, y1, x2, y2] = getCommonBounds(selectedElements);
      const initialLineDash = context.getLineDash();
      context.setLineDash([2 / appState.zoom.value]);
      const lineWidth = context.lineWidth;
      context.lineWidth = 1 / appState.zoom.value;
      context.strokeStyle = selectionColor;
      strokeRectWithRotation(
        context,
        x1 - dashedLinePadding,
        y1 - dashedLinePadding,
        x2 - x1 + dashedLinePadding * 2,
        y2 - y1 + dashedLinePadding * 2,
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        0,
      );
      context.lineWidth = lineWidth;
      context.setLineDash(initialLineDash);
      const transformHandles = getTransformHandlesFromCoords(
        [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2],
        0,
        appState.zoom,
        "mouse",
        isFrameSelected
          ? { ...getOmitSidesForDevice(device), rotation: true }
          : getOmitSidesForDevice(device),
      );
      if (selectedElements.some((element) => !element.locked)) {
        renderTransformHandles(
          context,
          renderConfig,
          appState,
          transformHandles,
          0,
        );
      }
    }
    context.restore();

    // We are not rendering the points on selection now...
    // // render selected linear element points
    // if (
    //   isSingleLinearElementSelected &&
    //   appState.selectedLinearElement?.elementId === selectedElements[0].id &&
    //   !selectedElements[0].locked
    // ) {
    //   renderLinearPointHandles(
    //     renderConfig,
    //     context,
    //     appState,
    //     selectedElements[0] as DucLinearElement,
    //     elementsMap,
    //   );
    // }
  }

  renderSnaps(context, appState);
  
  // Reset zoom
  context.restore();

  renderRemoteCursors({
    context,
    renderConfig,
    appState,
    normalizedWidth,
    normalizedHeight,
  });

  // Paint scrollbars
  let scrollBars;
  if (renderConfig.renderScrollbars) {
    scrollBars = getScrollBars(
      visibleElements,
      normalizedWidth,
      normalizedHeight,
      appState,
    );

    context.save();
    context.fillStyle = SCROLLBAR_COLOR;
    context.strokeStyle = "rgba(255,255,255,0.8)";
    [scrollBars.horizontal, scrollBars.vertical].forEach((scrollBar) => {
      if (scrollBar) {
        roundRect(
          context,
          scrollBar.x,
          scrollBar.y,
          scrollBar.width,
          scrollBar.height,
          SCROLLBAR_WIDTH / 2,
        );
      }
    });

    context.restore();
  }

  return {
    scrollBars,
    atLeastOneVisibleElement: visibleElements.length > 0,
    elementsMap,
  };
};

/** throttled to animation framerate */
export const renderInteractiveSceneThrottled = throttleRAF(
  (config: InteractiveSceneRenderConfig) => {
    const ret = _renderInteractiveScene(config);
    config.callback?.(ret);
  },
  { trailing: true },
);

/**
 * Interactive scene is the ui-canvas where we render bounding boxes, selections
 * and other ui stuff.
 */
export const renderInteractiveScene = <
  U extends typeof _renderInteractiveScene,
  T extends boolean = false,
>(
  renderConfig: InteractiveSceneRenderConfig,
  throttle?: T,
): T extends true ? void : ReturnType<U> => {
  if (throttle) {
    renderInteractiveSceneThrottled(renderConfig);
    return undefined as T extends true ? void : ReturnType<U>;
  }
  const ret = _renderInteractiveScene(renderConfig);
  renderConfig.callback(ret);
  return ret as T extends true ? void : ReturnType<U>;
};

const getContrastColor = (color: string, desaturate: boolean = false): string => {
  const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  
  if (desaturate) {
    return luminance > 0.5 ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)";
  }
  
  return luminance > 0.5 ? "#000000" : "#ffffff";
};


const getContrastNeutralColor = (color: string): string => {
  // Function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };

  // Function to calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const normalize = (v: number) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const rL = normalize(r);
    const gL = normalize(g);
    const bL = normalize(b);
    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  };

  // Convert the input color to RGB
  const [r, g, b] = hexToRgb(color);

  // Calculate luminance
  const luminance = getLuminance(r, g, b);

  // Return a neutral gray depending on the luminance
  return luminance > 0.5 ? "#333333" : "#CCCCCC"; // Light gray for dark colors, dark gray for light colors
};

const distanceFromPointToLineSegment = (point: Point, lineStart: Point, lineEnd: Point) => {
  const { x: x0, y: y0 } = point;
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;

  const A = x0 - x1;
  const B = y0 - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x0 - xx;
  const dy = y0 - yy;
  return Math.sqrt(dx * dx + dy * dy);
};
