import {
  DucElement,
  DucTextElement,
  NonDeletedDucElement,
  DucFreeDrawElement,
  DucImageElement,
  DucTextElementWithContainer,
  DucFrameLikeElement,
  NonDeletedSceneElementsMap,
  ElementsMap,
} from "../element/types";
import {
  isTextElement,
  isLinearElement,
  isFreeDrawElement,
  isInitializedImageElement,
  isArrowElement,
  hasBoundTextElement,
  isMagicFrameElement,
} from "../element/typeChecks";
import { getElementAbsoluteCoords } from "../element/bounds";
import type { RoughCanvas } from "roughjs/bin/canvas";

import {
  StaticCanvasRenderConfig,
  RenderableElementsMap,
} from "../scene/types";
import { distance, getFontString, isRTL } from "../utils";
import { getCornerRadius, isRightAngle } from "../math";
import rough from "roughjs/bin/rough";
import {
  AppState,
  StaticCanvasAppState,
  Zoom,
  InteractiveCanvasAppState,
  ElementsPendingErasure,
} from "../types";
import { getDefaultAppState } from "../appState";
import {
  BOUND_TEXT_PADDING,
  ELEMENT_READY_TO_ERASE_OPACITY,
  FRAME_STYLE,
  MIME_TYPES,
} from "../constants";
import { getStroke, StrokeOptions } from "perfect-freehand";
import {
  getBoundTextElement,
  getContainerCoords,
  getContainerElement,
  getLineHeightInPx,
  getBoundTextMaxHeight,
  getBoundTextMaxWidth,
  getVerticalOffset,
} from "../element/textElement";
import { LinearElementEditor } from "../element/linearElementEditor";

import { getContainingFrame } from "../frame";
import { ShapeCache } from "../scene/ShapeCache";

// using a stronger invert (100% vs our regular 93%) and saturate
// as a temp hack to make images in dark theme look closer to original
// color scheme (it's still not quite there and the colors look slightly
// desatured, alas...)
export const IMAGE_INVERT_FILTER = ""
  // "invert(100%) hue-rotate(180deg) saturate(1.25)";

const defaultAppState = getDefaultAppState();

const isPendingImageElement = (
  element: DucElement,
  renderConfig: StaticCanvasRenderConfig,
) =>
  isInitializedImageElement(element) &&
  !renderConfig.imageCache.has(element.fileId);

const shouldResetImageFilter = (
  element: DucElement,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
) => {
  return (
    appState.theme === "dark" &&
    isInitializedImageElement(element) &&
    !isPendingImageElement(element, renderConfig) &&
    renderConfig.imageCache.get(element.fileId)?.mimeType !== MIME_TYPES.svg
  );
};

const getCanvasPadding = (element: DucElement) =>
  element.type === "freedraw" ? element.strokeWidth * 12 : 20;

export const getRenderOpacity = (
  element: DucElement,
  containingFrame: DucFrameLikeElement | null,
  elementsPendingErasure: ElementsPendingErasure,
) => {
  // multiplying frame opacity with element opacity to combine them
  // (e.g. frame 50% and element 50% opacity should result in 25% opacity)
  let opacity = ((containingFrame?.opacity ?? 100) * element.opacity) / 10000;

  // if pending erasure, multiply again to combine further
  // (so that erasing always results in lower opacity than original)
  if (
    elementsPendingErasure.has(element.id) ||
    (containingFrame && elementsPendingErasure.has(containingFrame.id))
  ) {
    opacity *= ELEMENT_READY_TO_ERASE_OPACITY / 100;
  }

  return opacity;
};

export interface ExcalidrawElementWithCanvas {
  element: DucElement | DucTextElement;
  canvas: HTMLCanvasElement;
  theme: AppState["theme"];
  scale: number;
  zoomValue: AppState["zoom"]["value"];
  canvasOffsetX: number;
  canvasOffsetY: number;
  boundTextElementVersion: number | null;
  containingFrameOpacity: number;
}

const cappedElementCanvasSize = (
  element: NonDeletedDucElement,
  elementsMap: ElementsMap,
  zoom: Zoom,
): {
  width: number;
  height: number;
  scale: number;
} => {
  // these limits are ballpark, they depend on specific browsers and device.
  // We've chosen lower limits to be safe. We might want to change these limits
  // based on browser/device type, if we get reports of low quality rendering
  // on zoom.
  //
  // ~ safari mobile canvas area limit
  const AREA_LIMIT = 16777216;
  // ~ safari width/height limit based on developer.mozilla.org.
  const WIDTH_HEIGHT_LIMIT = 32767;

  const padding = getCanvasPadding(element);

  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const elementWidth =
    isLinearElement(element) || isFreeDrawElement(element)
      ? distance(x1, x2)
      : element.width;
  const elementHeight =
    isLinearElement(element) || isFreeDrawElement(element)
      ? distance(y1, y2)
      : element.height;

  let width = elementWidth * window.devicePixelRatio + padding * 2;
  let height = elementHeight * window.devicePixelRatio + padding * 2;

  let scale: number = zoom.value;

  // rescale to ensure width and height is within limits
  if (
    width * scale > WIDTH_HEIGHT_LIMIT ||
    height * scale > WIDTH_HEIGHT_LIMIT
  ) {
    scale = Math.min(WIDTH_HEIGHT_LIMIT / width, WIDTH_HEIGHT_LIMIT / height);
  }

  // rescale to ensure canvas area is within limits
  if (width * height * scale * scale > AREA_LIMIT) {
    scale = Math.sqrt(AREA_LIMIT / (width * height));
  }

  width = Math.floor(width * scale);
  height = Math.floor(height * scale);

  return { width, height, scale };
};

const generateElementCanvas = (
  element: NonDeletedDucElement,
  elementsMap: RenderableElementsMap,
  zoom: Zoom,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
): ExcalidrawElementWithCanvas => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  const padding = getCanvasPadding(element);

  const { width, height, scale } = cappedElementCanvasSize(
    element,
    elementsMap,
    zoom,
  );

  canvas.width = width;
  canvas.height = height;

  let canvasOffsetX = 0;
  let canvasOffsetY = 0;

  if (isLinearElement(element) || isFreeDrawElement(element)) {
    const [x1, y1] = getElementAbsoluteCoords(element, elementsMap);

    canvasOffsetX =
      element.x > x1
        ? distance(element.x, x1) * window.devicePixelRatio * scale
        : 0;

    canvasOffsetY =
      element.y > y1
        ? distance(element.y, y1) * window.devicePixelRatio * scale
        : 0;

    context.translate(canvasOffsetX, canvasOffsetY);
  }

  context.save();
  context.translate(padding * scale, padding * scale);
  context.scale(
    window.devicePixelRatio * scale,
    window.devicePixelRatio * scale,
  );

  const rc = rough.canvas(canvas);

  // in dark theme, revert the image color filter
  if (shouldResetImageFilter(element, renderConfig, appState)) {
    context.filter = IMAGE_INVERT_FILTER;
  }

  drawElementOnCanvas(element, rc, context, renderConfig, appState);
  context.restore();

  return {
    element,
    canvas,
    theme: appState.theme,
    scale,
    zoomValue: zoom.value,
    canvasOffsetX,
    canvasOffsetY,
    boundTextElementVersion:
      getBoundTextElement(element, elementsMap)?.version || null,
    containingFrameOpacity:
      getContainingFrame(element, elementsMap)?.opacity || 100,
  };
};

export const DEFAULT_LINK_SIZE = 14;

const IMAGE_PLACEHOLDER_IMG = document.createElement("img");
IMAGE_PLACEHOLDER_IMG.src = `data:${MIME_TYPES.svg},${encodeURIComponent(
  `<svg width="588" height="588" viewBox="0 0 588 588" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><g opacity="0.5"><path d="M189 294.001C189 351.991 236.01 399.001 294 399.001C351.99 399.001 399 351.991 399 294.001C399 236.011 351.99 189.001 294 189.001C236.01 189.001 189 236.011 189 294.001Z" fill="#DEDEDE" fill-opacity="0.8" stroke="#C9C9C9" stroke-width="2"/></g><path d="M494 294L94 294" stroke="url(#paint0_linear_4954_71968)" stroke-width="1.74717"/><path d="M489.44 97.5595L97.9999 489" stroke="url(#paint1_linear_4954_71968)" stroke-width="2.418"/><path d="M489.441 489.44L98 98.0005" stroke="url(#paint2_linear_4954_71968)" stroke-width="2.418"/><path d="M294.001 494.001L294 94.001" stroke="url(#paint3_linear_4954_71968)" stroke-width="1.74717"/><path d="M293.825 350.65C262.441 350.65 237 325.209 237 293.826C237 262.442 262.441 237.001 293.825 237.001C325.208 237.001 350.649 262.442 350.649 293.826C350.649 325.209 325.208 350.65 293.825 350.65Z" fill="white"/><path d="M293.825 350.65C262.441 350.65 237 325.209 237 293.826C237 262.442 262.441 237.001 293.825 237.001C325.208 237.001 350.649 262.442 350.649 293.826C350.649 325.209 325.208 350.65 293.825 350.65Z" stroke="#C9C9C9" stroke-width="2.418"/><path d="M308.583 275.251H279.417C277.115 275.251 275.25 277.116 275.25 279.418V308.584C275.25 310.885 277.115 312.751 279.417 312.751H308.583C310.885 312.751 312.75 310.885 312.75 308.584V279.418C312.75 277.116 310.885 275.251 308.583 275.251Z" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M287.75 291.918C290.051 291.918 291.917 290.052 291.917 287.751C291.917 285.45 290.051 283.584 287.75 283.584C285.449 283.584 283.583 285.45 283.583 287.751C283.583 290.052 285.449 291.918 287.75 291.918Z" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M312.75 300.251L306.321 293.822C305.539 293.041 304.48 292.602 303.375 292.602C302.27 292.602 301.211 293.041 300.429 293.822L281.5 312.751" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/></g><defs><linearGradient id="paint0_linear_4954_71968" x1="93.6526" y1="293.067" x2="494.346" y2="293.064" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint1_linear_4954_71968" x1="96.746" y1="488.426" x2="488.863" y2="96.3045" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint2_linear_4954_71968" x1="98.574" y1="96.7465" x2="490.696" y2="488.863" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint3_linear_4954_71968" x1="294.934" y1="93.6535" x2="294.937" y2="494.347" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient></defs></svg>`,
)}`;

const IMAGE_ERROR_PLACEHOLDER_IMG = document.createElement("img");
IMAGE_ERROR_PLACEHOLDER_IMG.src = `data:${MIME_TYPES.svg},${encodeURIComponent(
  `<svg width="588" height="588" viewBox="0 0 588 588" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><g opacity="0.5"><path d="M189 294.001C189 351.991 236.01 399.001 294 399.001C351.99 399.001 399 351.991 399 294.001C399 236.011 351.99 189.001 294 189.001C236.01 189.001 189 236.011 189 294.001Z" fill="#DEDEDE" fill-opacity="0.8" stroke="#C9C9C9" stroke-width="2"/></g><path d="M494 294L94 294" stroke="url(#paint0_linear_4954_79613)" stroke-width="1.74717"/><path d="M489.44 97.5595L98 489" stroke="url(#paint1_linear_4954_79613)" stroke-width="2.418"/><path d="M489.441 489.44L98 98.0005" stroke="url(#paint2_linear_4954_79613)" stroke-width="2.418"/><path d="M294 494.001L294 94.001" stroke="url(#paint3_linear_4954_79613)" stroke-width="1.74717"/><path d="M293.825 350.65C262.441 350.65 237 325.209 237 293.826C237 262.442 262.441 237.001 293.825 237.001C325.208 237.001 350.649 262.442 350.649 293.826C350.649 325.209 325.208 350.65 293.825 350.65Z" fill="white"/><path d="M293.825 350.65C262.441 350.65 237 325.209 237 293.826C237 262.442 262.441 237.001 293.825 237.001C325.208 237.001 350.649 262.442 350.649 293.826C350.649 325.209 325.208 350.65 293.825 350.65Z" stroke="#C9C9C9" stroke-width="2.418"/><path d="M273.167 273.167L314.833 314.833" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M290.688 290.687C290.301 291.074 289.841 291.382 289.335 291.591C288.829 291.801 288.287 291.908 287.74 291.908C287.192 291.908 286.65 291.801 286.144 291.591C285.639 291.382 285.179 291.074 284.792 290.687C284.405 290.3 284.098 289.841 283.888 289.335C283.679 288.829 283.571 288.287 283.571 287.739C283.571 287.192 283.679 286.65 283.888 286.144C284.098 285.638 284.405 285.179 284.792 284.792" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M297.125 297.125L281.5 312.75" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M306.5 294L312.75 300.25" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M276.479 276.479C276.091 276.863 275.782 277.321 275.571 277.825C275.36 278.329 275.251 278.87 275.25 279.417V308.583C275.25 309.688 275.689 310.748 276.47 311.529C277.252 312.311 278.312 312.75 279.417 312.75H308.583C309.729 312.75 310.775 312.292 311.521 311.521" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/><path d="M312.75 300.25V279.417C312.75 278.312 312.311 277.252 311.53 276.47C310.748 275.689 309.688 275.25 308.583 275.25H287.75" stroke="#8C8C8C" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/></g><defs><linearGradient id="paint0_linear_4954_79613" x1="93.6526" y1="293.067" x2="494.346" y2="293.064" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint1_linear_4954_79613" x1="96.746" y1="488.426" x2="488.863" y2="96.3045" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint2_linear_4954_79613" x1="98.574" y1="96.7465" x2="490.696" y2="488.863" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint3_linear_4954_79613" x1="294.934" y1="93.6535" x2="294.937" y2="494.347" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient></defs></svg>`,
)}`;

const drawImagePlaceholder = (
  element: DucImageElement,
  context: CanvasRenderingContext2D,
  zoomValue: AppState["zoom"]["value"],
) => {
  context.fillStyle = "#E7E7E7";
  context.fillRect(0, 0, element.width, element.height);

  const imageMinWidthOrHeight = Math.min(element.width, element.height);

  const size = Math.min(
    imageMinWidthOrHeight,
    Math.min(imageMinWidthOrHeight * 0.4, 100),
  );

  context.drawImage(
    element.status === "error"
      ? IMAGE_ERROR_PLACEHOLDER_IMG
      : IMAGE_PLACEHOLDER_IMG,
    element.width / 2 - size / 2,
    element.height / 2 - size / 2,
    size,
    size,
  );
};

const drawElementOnCanvas = (
  element: NonDeletedDucElement,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
) => {
  switch (element.type) {
    case "rectangle":
    case "iframe":
    case "embeddable":
    case "diamond":
    case "ellipse": {
      context.lineJoin = "round";
      context.lineCap = "round";
      rc.draw(ShapeCache.get(element)!);
      break;
    }
    case "arrow":
    case "line": {
      context.lineJoin = "round";
      context.lineCap = "round";

      ShapeCache.get(element)!.forEach((shape) => {
        rc.draw(shape);
      });
      break;
    }
    case "freedraw": {
      // Draw directly to canvas
      context.save();
      context.fillStyle = element.strokeColor;

      const path = getFreeDrawPath2D(element) as Path2D;
      const fillShape = ShapeCache.get(element);

      if (fillShape) {
        rc.draw(fillShape);
      }

      context.fillStyle = element.strokeColor;
      context.fill(path);

      context.restore();
      break;
    }
    case "image": {
      const img = isInitializedImageElement(element)
        ? renderConfig.imageCache.get(element.fileId)?.image
        : undefined;
      if (img != null && !(img instanceof Promise)) {
        if (element.roundness && context.roundRect) {
          context.beginPath();
          context.roundRect(
            0,
            0,
            element.width,
            element.height,
            getCornerRadius(Math.min(element.width, element.height), element),
          );
          context.clip();
        }
        context.drawImage(
          img,
          0 /* hardcoded for the selection box*/,
          0,
          element.width,
          element.height,
        );
      } else {
        drawImagePlaceholder(element, context, appState.zoom.value);
      }
      break;
    }
    default: {
      if (isTextElement(element)) {
        const rtl = isRTL(element.text);
        const shouldTemporarilyAttach = rtl && !context.canvas.isConnected;
        if (shouldTemporarilyAttach) {
          // to correctly render RTL text mixed with LTR, we have to append it
          // to the DOM
          document.body.appendChild(context.canvas);
        }
        context.canvas.setAttribute("dir", rtl ? "rtl" : "ltr");
        context.save();
        context.font = getFontString(element);
        context.fillStyle = element.strokeColor;
        context.textAlign = element.textAlign as CanvasTextAlign;

        // Canvas does not support multiline text by default
        const lines = element.text.replace(/\r\n?/g, "\n").split("\n");

        const horizontalOffset =
          element.textAlign === "center"
            ? element.width / 2
            : element.textAlign === "right"
            ? element.width
            : 0;

        const lineHeightPx = getLineHeightInPx(
          element.fontSize,
          element.lineHeight,
        );

        const verticalOffset = getVerticalOffset(
          element.fontFamily,
          element.fontSize,
          lineHeightPx,
        );

        for (let index = 0; index < lines.length; index++) {
          context.fillText(
            lines[index],
            horizontalOffset,
            index * lineHeightPx + verticalOffset,
          );
        }
        context.restore();
        if (shouldTemporarilyAttach) {
          context.canvas.remove();
        }
      } else {
        throw new Error(`Unimplemented type ${element.type}`);
      }
    }
  }
};

export const elementWithCanvasCache = new WeakMap<
  DucElement,
  ExcalidrawElementWithCanvas
>();

const generateElementWithCanvas = (
  element: NonDeletedDucElement,
  elementsMap: RenderableElementsMap,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
) => {
  const zoom: Zoom = renderConfig ? appState.zoom : defaultAppState.zoom;
  const prevElementWithCanvas = elementWithCanvasCache.get(element);
  const shouldRegenerateBecauseZoom =
    prevElementWithCanvas &&
    prevElementWithCanvas.zoomValue !== zoom.value &&
    !appState?.shouldCacheIgnoreZoom;
  const boundTextElementVersion =
    getBoundTextElement(element, elementsMap)?.version || null;

  const containingFrameOpacity =
    getContainingFrame(element, elementsMap)?.opacity || 100;

  if (
    !prevElementWithCanvas ||
    shouldRegenerateBecauseZoom ||
    prevElementWithCanvas.theme !== appState.theme ||
    prevElementWithCanvas.boundTextElementVersion !== boundTextElementVersion ||
    prevElementWithCanvas.containingFrameOpacity !== containingFrameOpacity
  ) {
    const elementWithCanvas = generateElementCanvas(
      element,
      elementsMap,
      zoom,
      renderConfig,
      appState,
    );

    elementWithCanvasCache.set(element, elementWithCanvas);

    return elementWithCanvas;
  }
  return prevElementWithCanvas;
};

const drawElementFromCanvas = (
  elementWithCanvas: ExcalidrawElementWithCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
) => {
  const element = elementWithCanvas.element;
  const padding = getCanvasPadding(element);
  const zoom = elementWithCanvas.scale;
  let [x1, y1, x2, y2] = getElementAbsoluteCoords(element, allElementsMap);

  // Free draw elements will otherwise "shuffle" as the min x and y change
  if (isFreeDrawElement(element)) {
    x1 = Math.floor(x1);
    x2 = Math.ceil(x2);
    y1 = Math.floor(y1);
    y2 = Math.ceil(y2);
  }

  const cx = ((x1 + x2) / 2 + appState.scrollX) * window.devicePixelRatio;
  const cy = ((y1 + y2) / 2 + appState.scrollY) * window.devicePixelRatio;

  context.save();
  context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

  const boundTextElement = getBoundTextElement(element, allElementsMap);

  if (isArrowElement(element) && boundTextElement) {
    const tempCanvas = document.createElement("canvas");
    const tempCanvasContext = tempCanvas.getContext("2d")!;

    // Take max dimensions of arrow canvas so that when canvas is rotated
    // the arrow doesn't get clipped
    const maxDim = Math.max(distance(x1, x2), distance(y1, y2));
    tempCanvas.width =
      maxDim * window.devicePixelRatio * zoom +
      padding * elementWithCanvas.scale * 10;
    tempCanvas.height =
      maxDim * window.devicePixelRatio * zoom +
      padding * elementWithCanvas.scale * 10;
    const offsetX = (tempCanvas.width - elementWithCanvas.canvas!.width) / 2;
    const offsetY = (tempCanvas.height - elementWithCanvas.canvas!.height) / 2;

    tempCanvasContext.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCanvasContext.rotate(element.angle);

    tempCanvasContext.drawImage(
      elementWithCanvas.canvas!,
      -elementWithCanvas.canvas.width / 2,
      -elementWithCanvas.canvas.height / 2,
      elementWithCanvas.canvas.width,
      elementWithCanvas.canvas.height,
    );

    const [, , , , boundTextCx, boundTextCy] = getElementAbsoluteCoords(
      boundTextElement,
      allElementsMap,
    );

    tempCanvasContext.rotate(-element.angle);

    // Shift the canvas to the center of the bound text element
    const shiftX =
      tempCanvas.width / 2 -
      (boundTextCx - x1) * window.devicePixelRatio * zoom -
      offsetX -
      padding * zoom;

    const shiftY =
      tempCanvas.height / 2 -
      (boundTextCy - y1) * window.devicePixelRatio * zoom -
      offsetY -
      padding * zoom;
    tempCanvasContext.translate(-shiftX, -shiftY);
    // Clear the bound text area
    tempCanvasContext.clearRect(
      -(boundTextElement.width / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        zoom,
      -(boundTextElement.height / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        zoom,
      (boundTextElement.width + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        zoom,
      (boundTextElement.height + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        zoom,
    );

    context.translate(cx, cy);
    context.drawImage(
      tempCanvas,
      (-(x2 - x1) / 2) * window.devicePixelRatio - offsetX / zoom - padding,
      (-(y2 - y1) / 2) * window.devicePixelRatio - offsetY / zoom - padding,
      tempCanvas.width / zoom,
      tempCanvas.height / zoom,
    );
  } else {
    // we translate context to element center so that rotation and scale
    // originates from the element center
    context.translate(cx, cy);

    context.rotate(element.angle);

    if (
      "scale" in elementWithCanvas.element &&
      !isPendingImageElement(element, renderConfig)
    ) {
      context.scale(
        elementWithCanvas.element.scale[0],
        elementWithCanvas.element.scale[1],
      );
    }

    // revert afterwards we don't have account for it during drawing
    context.translate(-cx, -cy);

    context.drawImage(
      elementWithCanvas.canvas!,
      (x1 + appState.scrollX) * window.devicePixelRatio -
        (padding * elementWithCanvas.scale) / elementWithCanvas.scale,
      (y1 + appState.scrollY) * window.devicePixelRatio -
        (padding * elementWithCanvas.scale) / elementWithCanvas.scale,
      elementWithCanvas.canvas!.width / elementWithCanvas.scale,
      elementWithCanvas.canvas!.height / elementWithCanvas.scale,
    );

    if (
      import.meta.env.VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX ===
        "true" &&
      hasBoundTextElement(element)
    ) {
      const textElement = getBoundTextElement(
        element,
        allElementsMap,
      ) as DucTextElementWithContainer;
      const coords = getContainerCoords(element);
      context.strokeStyle = "#c92a2a";
      context.lineWidth = 3;
      context.strokeRect(
        (coords.x + appState.scrollX) * window.devicePixelRatio,
        (coords.y + appState.scrollY) * window.devicePixelRatio,
        getBoundTextMaxWidth(element, textElement) * window.devicePixelRatio,
        getBoundTextMaxHeight(element, textElement) * window.devicePixelRatio,
      );
    }
  }
  context.restore();

  // Clear the nested element we appended to the DOM
};

export const renderSelectionElement = (
  element: NonDeletedDucElement,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
) => {
  context.save();
  context.translate(element.x + appState.scrollX, element.y + appState.scrollY);
  context.fillStyle = "rgba(0, 0, 200, 0.04)";

  // render from 0.5px offset  to get 1px wide line
  // https://stackoverflow.com/questions/7530593/html5-canvas-and-line-width/7531540#7531540
  // TODO can be be improved by offseting to the negative when user selects
  // from right to left
  const offset = 0.5 / appState.zoom.value;

  context.fillRect(offset, offset, element.width, element.height);
  context.lineWidth = 1 / appState.zoom.value;
  context.strokeStyle = " rgb(105, 101, 219)";
  context.strokeRect(offset, offset, element.width, element.height);

  context.restore();
};

export const renderElement = (
  element: NonDeletedDucElement,
  elementsMap: RenderableElementsMap,
  allElementsMap: NonDeletedSceneElementsMap,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
) => {
  context.globalAlpha = getRenderOpacity(
    element,
    getContainingFrame(element, elementsMap),
    renderConfig.elementsPendingErasure,
  );

  switch (element.type) {
    case "magicframe":
    case "frame": {
      if (appState.frameRendering.enabled && appState.frameRendering.outline) {
        context.save();
        context.translate(
          element.x + appState.scrollX,
          element.y + appState.scrollY,
        );
        
        context.fillStyle = "rgba(0, 0, 200, 0.04)";
        context.lineWidth = FRAME_STYLE.strokeWidth / appState.zoom.value;
        context.strokeStyle = FRAME_STYLE.strokeColor;

        // TODO change later to only affect AI frames
        if (isMagicFrameElement(element)) {
          context.strokeStyle =
            appState.theme === "light" ? "#7affd7" : "#1d8264";
        }

        context.fillStyle = FRAME_STYLE.backgroundColor;
        context.fillRect(0, 0, element.width, element.height);

        if (FRAME_STYLE.radius && context.roundRect) {
          context.beginPath();
          context.roundRect(
            0,
            0,
            element.width,
            element.height,
            FRAME_STYLE.radius / appState.zoom.value,
          );
          context.stroke();
          context.closePath();
        } else {
          context.strokeRect(0, 0, element.width, element.height);
        }

        context.restore();
      }
      break;
    }
    case "freedraw": {
      // TODO investigate if we can do this in situ. Right now we need to call
      // beforehand because math helpers (such as getElementAbsoluteCoords)
      // rely on existing shapes
      ShapeCache.generateElementShape(element, null);

      if (renderConfig.isExporting) {
        const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
        const cx = (x1 + x2) / 2 + appState.scrollX;
        const cy = (y1 + y2) / 2 + appState.scrollY;
        const shiftX = (x2 - x1) / 2 - (element.x - x1);
        const shiftY = (y2 - y1) / 2 - (element.y - y1);
        context.save();
        context.translate(cx, cy);
        context.rotate(element.angle);
        context.translate(-shiftX, -shiftY);
        drawElementOnCanvas(element, rc, context, renderConfig, appState);
        context.restore();
      } else {
        const elementWithCanvas = generateElementWithCanvas(
          element,
          elementsMap,
          renderConfig,
          appState,
        );
        drawElementFromCanvas(
          elementWithCanvas,
          context,
          renderConfig,
          appState,
          allElementsMap,
        );
      }

      break;
    }
    case "rectangle":
    case "diamond":
    case "ellipse":
    case "line":
    case "arrow":
    case "image":
    case "text":
    case "iframe":
    case "embeddable": {
      // TODO investigate if we can do this in situ. Right now we need to call
      // beforehand because math helpers (such as getElementAbsoluteCoords)
      // rely on existing shapes
      ShapeCache.generateElementShape(element, renderConfig);
      if (renderConfig.isExporting) {
        const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
        const cx = (x1 + x2) / 2 + appState.scrollX;
        const cy = (y1 + y2) / 2 + appState.scrollY;
        let shiftX = (x2 - x1) / 2 - (element.x - x1);
        let shiftY = (y2 - y1) / 2 - (element.y - y1);
        if (isTextElement(element)) {
          const container = getContainerElement(element, elementsMap);
          if (isArrowElement(container)) {
            const boundTextCoords =
              LinearElementEditor.getBoundTextElementPosition(
                container,
                element as DucTextElementWithContainer,
                elementsMap,
              );
            shiftX = (x2 - x1) / 2 - (boundTextCoords.x - x1);
            shiftY = (y2 - y1) / 2 - (boundTextCoords.y - y1);
          }
        }
        context.save();
        context.translate(cx, cy);

        if (shouldResetImageFilter(element, renderConfig, appState)) {
          context.filter = "none";
        }
        const boundTextElement = getBoundTextElement(element, elementsMap);

        if (isArrowElement(element) && boundTextElement) {
          const tempCanvas = document.createElement("canvas");

          const tempCanvasContext = tempCanvas.getContext("2d")!;

          // Take max dimensions of arrow canvas so that when canvas is rotated
          // the arrow doesn't get clipped
          const maxDim = Math.max(distance(x1, x2), distance(y1, y2));
          const padding = getCanvasPadding(element);
          tempCanvas.width =
            maxDim * appState.exportScale + padding * 10 * appState.exportScale;
          tempCanvas.height =
            maxDim * appState.exportScale + padding * 10 * appState.exportScale;

          tempCanvasContext.translate(
            tempCanvas.width / 2,
            tempCanvas.height / 2,
          );
          tempCanvasContext.scale(appState.exportScale, appState.exportScale);

          // Shift the canvas to left most point of the arrow
          shiftX = element.width / 2 - (element.x - x1);
          shiftY = element.height / 2 - (element.y - y1);

          tempCanvasContext.rotate(element.angle);
          const tempRc = rough.canvas(tempCanvas);

          tempCanvasContext.translate(-shiftX, -shiftY);

          drawElementOnCanvas(
            element,
            tempRc,
            tempCanvasContext,
            renderConfig,
            appState,
          );

          tempCanvasContext.translate(shiftX, shiftY);

          tempCanvasContext.rotate(-element.angle);

          // Shift the canvas to center of bound text
          const [, , , , boundTextCx, boundTextCy] = getElementAbsoluteCoords(
            boundTextElement,
            elementsMap,
          );
          const boundTextShiftX = (x1 + x2) / 2 - boundTextCx;
          const boundTextShiftY = (y1 + y2) / 2 - boundTextCy;
          tempCanvasContext.translate(-boundTextShiftX, -boundTextShiftY);

          // Clear the bound text area
          tempCanvasContext.clearRect(
            -boundTextElement.width / 2,
            -boundTextElement.height / 2,
            boundTextElement.width,
            boundTextElement.height,
          );
          context.scale(1 / appState.exportScale, 1 / appState.exportScale);
          context.drawImage(
            tempCanvas,
            -tempCanvas.width / 2,
            -tempCanvas.height / 2,
            tempCanvas.width,
            tempCanvas.height,
          );
        } else {
          context.rotate(element.angle);

          if (element.type === "image") {
            // note: scale must be applied *after* rotating
            context.scale(element.scale[0], element.scale[1]);
          }

          context.translate(-shiftX, -shiftY);
          drawElementOnCanvas(element, rc, context, renderConfig, appState);
        }

        context.restore();
        // not exporting → optimized rendering (cache & render from element
        // canvases)
      } else {
        const elementWithCanvas = generateElementWithCanvas(
          element,
          elementsMap,
          renderConfig,
          appState,
        );

        const currentImageSmoothingStatus = context.imageSmoothingEnabled;

        if (
          // do not disable smoothing during zoom as blurry shapes look better
          // on low resolution (while still zooming in) than sharp ones
          !appState?.shouldCacheIgnoreZoom &&
          // angle is 0 -> always disable smoothing
          (!element.angle ||
            // or check if angle is a right angle in which case we can still
            // disable smoothing without adversely affecting the result
            isRightAngle(element.angle))
        ) {
          // Disabling smoothing makes output much sharper, especially for
          // text. Unless for non-right angles, where the aliasing is really
          // terrible on Chromium.
          //
          // Note that `context.imageSmoothingQuality="high"` has almost
          // zero effect.
          //
          context.imageSmoothingEnabled = false;
        }

        drawElementFromCanvas(
          elementWithCanvas,
          context,
          renderConfig,
          appState,
          allElementsMap,
        );

        // reset
        context.imageSmoothingEnabled = currentImageSmoothingStatus;
      }
      break;
    }
    default: {
      // @ts-ignore
      throw new Error(`Unimplemented type ${element.type}`);
    }
  }

  context.globalAlpha = 1;
};

export const pathsCache = new WeakMap<DucFreeDrawElement, Path2D>([]);

export function generateFreeDrawShape(element: DucFreeDrawElement) {
  const svgPathData = getFreeDrawSvgPath(element);
  const path = new Path2D(svgPathData);
  pathsCache.set(element, path);
  return path;
}

export function getFreeDrawPath2D(element: DucFreeDrawElement) {
  return pathsCache.get(element);
}

export function getFreeDrawSvgPath(element: DucFreeDrawElement) {
  // If input points are empty (should they ever be?) return a dot
  const inputPoints = element.simulatePressure
    ? element.points
    : element.points.length
    ? element.points.map(([x, y], i) => [x, y, element.pressures[i]])
    : [[0, 0, 0.5]];

  // Consider changing the options for simulated pressure vs real pressure
  const options: StrokeOptions = {
    simulatePressure: element.simulatePressure,
    size: element.strokeWidth * 4.25,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
    last: !!element.lastCommittedPoint, // LastCommittedPoint is added on pointerup
  };

  return getSvgPathFromStroke(getStroke(inputPoints as number[][], options));
}

function med(A: number[], B: number[]) {
  return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"],
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1");
}
