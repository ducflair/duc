import type {
  DucElement,
  DucTextElement,
  NonDeletedDucElement,
  DucFreeDrawElement,
  DucImageElement,
  DucTextElementWithContainer,
  DucFrameLikeElement,
  NonDeletedSceneElementsMap,
  ElementsMap,
  DucLinearElement,
  NonDeleted,
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

import type {
  StaticCanvasRenderConfig,
  RenderableElementsMap,
  InteractiveCanvasRenderConfig,
} from "../scene/types";
import { distance, getFontString, isRTL } from "../utils";
import { distance2d, getCornerRadius, isRightAngle } from "../math";
import rough from "roughjs/bin/rough";
import type {
  AppState,
  StaticCanvasAppState,
  Zoom,
  InteractiveCanvasAppState,
  ElementsPendingErasure,
  PendingDucElements,
} from "../types";
import { getDefaultAppState } from "../appState";
import {
  BOUND_TEXT_PADDING,
  ELEMENT_READY_TO_ERASE_OPACITY,
  FONT_FAMILY,
  FRAME_STYLE,
  MIME_TYPES,
  THEME,
} from "../constants";
import type { StrokeOptions } from "perfect-freehand";
import { getStroke } from "perfect-freehand";
import {
  getBoundTextElement,
  getContainerCoords,
  getContainerElement,
  getLineHeightInPx,
  getBoundTextMaxHeight,
  getBoundTextMaxWidth,
} from "../element/textElement";
import { LinearElementEditor } from "../element/linearElementEditor";

import { getContainingFrame } from "../frame";
import { ShapeCache } from "../scene/ShapeCache";
import { getVerticalOffset } from "../fonts";
import { COLOR_PALETTE } from "../colors";
import { coordinateToRealMeasure } from "../duc/utils/measurements";
import { offset } from "../ga";
import { getNormalizedZoom } from "../scene";
import { renderAllPointCoordinates, renderAllPointDistances, renderDistanceOnDrawingLine, renderTextWithBox } from "./helpers";

// using a stronger invert (100% vs our regular 93%) and saturate
// as a temp hack to make images in dark theme look closer to original
// color scheme (it's still not quite there and the colors look slightly
// desatured, alas...)
export const IMAGE_INVERT_FILTER =
  "invert(100%) hue-rotate(180deg) saturate(1.25)";

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
    appState.theme === THEME.DARK &&
    isInitializedImageElement(element) &&
    !isPendingImageElement(element, renderConfig) &&
    renderConfig.imageCache.get(element.fileId)?.mimeType !== MIME_TYPES.svg
  );
};

export const getCanvasPadding = (element: DucElement) => {
  switch (element.type) {
    case "freedraw":
      return element.strokeWidth * 12;
    case "text":
      return element.fontSize / 2;
    default:
      return 20;
  }
};

export const getRenderOpacity = (
  element: DucElement,
  containingFrame: DucFrameLikeElement | null,
  elementsPendingErasure: ElementsPendingErasure,
  pendingNodes: Readonly<PendingDucElements> | null,
) => {
  // multiplying frame opacity with element opacity to combine them
  // (e.g. frame 50% and element 50% opacity should result in 25% opacity)
  let opacity = ((containingFrame?.opacity ?? 100) * element.opacity) / 10000;

  // if pending erasure, multiply again to combine further
  // (so that erasing always results in lower opacity than original)
  if (
    elementsPendingErasure.has(element.id) ||
    (pendingNodes && pendingNodes.some((node) => node.id === element.id)) ||
    (containingFrame && elementsPendingErasure.has(containingFrame.id))
  ) {
    opacity *= ELEMENT_READY_TO_ERASE_OPACITY / 100;
  }

  return opacity;
};

export interface DucElementWithCanvas {
  element: DucElement | DucTextElement;
  canvas: HTMLCanvasElement;
  theme: AppState["theme"];
  scale: number;
  angle: number;
  zoomValue: AppState["zoom"]["value"];
  canvasOffsetX: number;
  canvasOffsetY: number;
  boundTextElementVersion: number | null;
  containingFrameOpacity: number;
  boundTextCanvas: HTMLCanvasElement;
}

export const cappedElementCanvasSize = (
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
  elementsMap: NonDeletedSceneElementsMap,
  zoom: Zoom,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
): DucElementWithCanvas | null => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  const padding = getCanvasPadding(element);

  const { width, height, scale } = cappedElementCanvasSize(
    element,
    elementsMap,
    zoom,
  );

  if (!width || !height) {
    return null;
  }

  canvas.width = width;
  canvas.height = height;

  let canvasOffsetX = -100;
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

  const boundTextElement = getBoundTextElement(element, elementsMap);
  const boundTextCanvas = document.createElement("canvas");
  const boundTextCanvasContext = boundTextCanvas.getContext("2d")!;

  if (isArrowElement(element) && boundTextElement) {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    // Take max dimensions of arrow canvas so that when canvas is rotated
    // the arrow doesn't get clipped
    const maxDim = Math.max(distance(x1, x2), distance(y1, y2));
    boundTextCanvas.width =
      maxDim * window.devicePixelRatio * scale + padding * scale * 10;
    boundTextCanvas.height =
      maxDim * window.devicePixelRatio * scale + padding * scale * 10;
    boundTextCanvasContext.translate(
      boundTextCanvas.width / 2,
      boundTextCanvas.height / 2,
    );
    boundTextCanvasContext.rotate(element.angle);
    boundTextCanvasContext.drawImage(
      canvas!,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height,
    );

    const [, , , , boundTextCx, boundTextCy] = getElementAbsoluteCoords(
      boundTextElement,
      elementsMap,
    );

    boundTextCanvasContext.rotate(-element.angle);
    const offsetX = (boundTextCanvas.width - canvas!.width) / 2;
    const offsetY = (boundTextCanvas.height - canvas!.height) / 2;
    const shiftX =
      boundTextCanvas.width / 2 -
      (boundTextCx - x1) * window.devicePixelRatio * scale -
      offsetX -
      padding * scale;

    const shiftY =
      boundTextCanvas.height / 2 -
      (boundTextCy - y1) * window.devicePixelRatio * scale -
      offsetY -
      padding * scale;
    boundTextCanvasContext.translate(-shiftX, -shiftY);
    // Clear the bound text area
    boundTextCanvasContext.clearRect(
      -(boundTextElement.width / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        scale,
      -(boundTextElement.height / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        scale,
      (boundTextElement.width + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        scale,
      (boundTextElement.height + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        scale,
    );
  }

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
    boundTextCanvas,
    angle: element.angle,
  };
};

export const DEFAULT_LINK_SIZE = 14;

const IMAGE_PLACEHOLDER_IMG = document.createElement("img");
IMAGE_PLACEHOLDER_IMG.src = `data:${MIME_TYPES.svg},${encodeURIComponent(
  `<svg width="1400" height="1400" viewBox="0 0 1400 1400" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><g opacity="0.5"><path d="M450 700.003C450 838.074 561.929 950.002 700.001 950.002C838.071 950.002 950 838.074 950 700.003C950 561.931 838.071 450.002 700.001 450.002C561.929 450.002 450 561.931 450 700.003Z" fill="#DEDEDE" fill-opacity="0.8" stroke="#C9C9C9" stroke-width="4.7619"/></g><path d="M1176.19 700L223.81 700.001" stroke="url(#paint0_linear_4954_71968)" stroke-width="4.15993"/><path d="M1165.33 232.284L233.333 1164.29" stroke="url(#paint1_linear_4954_71968)" stroke-width="5.75714"/><path d="M1165.34 1165.33L233.333 233.334" stroke="url(#paint2_linear_4954_71968)" stroke-width="5.75714"/><path d="M700.001 1176.19L700 223.812" stroke="url(#paint3_linear_4954_71968)" stroke-width="4.15993"/><path d="M699.583 834.881C624.859 834.881 564.286 774.307 564.286 699.586C564.286 624.862 624.859 564.288 699.583 564.288C774.305 564.288 834.879 624.862 834.879 699.586C834.879 774.307 774.305 834.881 699.583 834.881Z" fill="white"/><path d="M699.583 834.881C624.859 834.881 564.286 774.307 564.286 699.586C564.286 624.862 624.859 564.288 699.583 564.288C774.305 564.288 834.879 624.862 834.879 699.586C834.879 774.307 774.305 834.881 699.583 834.881Z" stroke="#C9C9C9" stroke-width="5.75714"/><path d="M734.722 655.359H665.278C659.799 655.359 655.357 659.801 655.357 665.28V734.724C655.357 740.203 659.799 744.645 665.278 744.645H734.722C740.201 744.645 744.643 740.203 744.643 734.724V665.28C744.643 659.801 740.201 655.359 734.722 655.359Z" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M685.119 695.042C690.598 695.042 695.04 690.6 695.04 685.121C695.04 679.642 690.598 675.201 685.119 675.201C679.64 675.201 675.198 679.642 675.198 685.121C675.198 690.6 679.64 695.042 685.119 695.042Z" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M744.643 714.884L729.335 699.576C727.475 697.716 724.952 696.671 722.321 696.671C719.691 696.671 717.168 697.716 715.307 699.576L670.238 744.645" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/></g><defs><linearGradient id="paint0_linear_4954_71968" x1="222.982" y1="697.777" x2="1177.02" y2="697.771" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint1_linear_4954_71968" x1="230.347" y1="1162.92" x2="1163.96" y2="229.296" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint2_linear_4954_71968" x1="234.7" y1="230.349" x2="1168.32" y2="1163.96" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint3_linear_4954_71968" x1="702.224" y1="222.985" x2="702.23" y2="1177.02" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient></defs></svg>`,
)}`;

const IMAGE_ERROR_PLACEHOLDER_IMG = document.createElement("img");
IMAGE_ERROR_PLACEHOLDER_IMG.src = `data:${MIME_TYPES.svg},${encodeURIComponent(
  `<svg width="1400" height="1400" viewBox="0 0 1400 1400" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><g opacity="0.5"><path d="M449.999 700.003C449.999 838.073 561.928 950.002 700 950.002C838.071 950.002 949.999 838.073 949.999 700.003C949.999 561.931 838.071 450.002 700 450.002C561.928 450.002 449.999 561.931 449.999 700.003Z" fill="#DEDEDE" fill-opacity="0.8" stroke="#C9C9C9" stroke-width="4.76191"/></g><path d="M1176.19 700L223.81 700.001" stroke="url(#paint0_linear_4954_79613)" stroke-width="4.15993"/><path d="M1165.33 232.284L233.333 1164.29" stroke="url(#paint1_linear_4954_79613)" stroke-width="5.75714"/><path d="M1165.34 1165.33L233.334 233.334" stroke="url(#paint2_linear_4954_79613)" stroke-width="5.75714"/><path d="M700.001 1176.19L700 223.812" stroke="url(#paint3_linear_4954_79613)" stroke-width="4.15993"/><path d="M699.583 834.881C624.859 834.881 564.286 774.307 564.286 699.586C564.286 624.862 624.859 564.288 699.583 564.288C774.305 564.288 834.879 624.862 834.879 699.586C834.879 774.307 774.305 834.881 699.583 834.881Z" fill="white"/><path d="M699.583 834.881C624.859 834.881 564.285 774.307 564.285 699.586C564.285 624.862 624.859 564.288 699.583 564.288C774.304 564.288 834.878 624.862 834.878 699.586C834.878 774.307 774.304 834.881 699.583 834.881Z" stroke="#C9C9C9" stroke-width="5.75714"/><path d="M650.396 650.396L749.603 749.603" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M692.113 692.113C691.191 693.035 690.097 693.766 688.893 694.265C687.688 694.763 686.398 695.02 685.094 695.02C683.791 695.02 682.5 694.763 681.296 694.265C680.091 693.766 678.997 693.035 678.075 692.113C677.154 691.191 676.422 690.097 675.924 688.893C675.425 687.688 675.168 686.398 675.168 685.094C675.168 683.791 675.425 682.5 675.924 681.295C676.422 680.091 677.154 678.997 678.075 678.075" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M707.44 707.44L670.238 744.643" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M729.762 700L744.643 714.881" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M658.284 658.284C657.359 659.199 656.624 660.288 656.122 661.489C655.62 662.689 655.36 663.977 655.357 665.278V734.722C655.357 737.353 656.402 739.877 658.263 741.737C660.123 743.598 662.646 744.643 665.278 744.643H734.722C737.45 744.643 739.94 743.552 741.716 741.716" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/><path d="M744.643 714.881V665.278C744.643 662.646 743.598 660.123 741.737 658.263C739.877 656.402 737.353 655.357 734.722 655.357H685.119" stroke="#8C8C8C" stroke-width="9.92064" stroke-linecap="round" stroke-linejoin="round"/></g><defs><linearGradient id="paint0_linear_4954_79613" x1="222.982" y1="697.777" x2="1177.02" y2="697.771" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint1_linear_4954_79613" x1="230.347" y1="1162.92" x2="1163.96" y2="229.296" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint2_linear_4954_79613" x1="234.701" y1="230.349" x2="1168.32" y2="1163.96" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="paint3_linear_4954_79613" x1="702.224" y1="222.985" x2="702.23" y2="1177.02" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset="0.208" stop-color="#C9C9C9"/><stop offset="0.792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient></defs></svg>`,
)}`;

const drawImagePlaceholder = (
  element: DucImageElement,
  context: CanvasRenderingContext2D,
) => {
  context.fillStyle = "#E9E9E9";
  context.fillRect(0, 0, element.width, element.height);

  const imageMinWidthOrHeight = Math.min(element.width, element.height);

  const size = Math.min(
    imageMinWidthOrHeight,
    imageMinWidthOrHeight * 0.8,
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
        drawImagePlaceholder(element, context);
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
        context.fillStyle = element.isStrokeDisabled ? "transparent" : element.strokeColor;
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
  DucElementWithCanvas
>();

export const generateElementWithCanvas = (
  element: NonDeletedDucElement,
  elementsMap: NonDeletedSceneElementsMap,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
) => {
  const zoom: Zoom = renderConfig ? appState.zoom : defaultAppState.zoom;
  const prevElementWithCanvas = elementWithCanvasCache.get(element);
  const shouldRegenerateBecauseZoom =
    prevElementWithCanvas &&
    prevElementWithCanvas.zoomValue !== zoom.value &&
    !appState?.shouldCacheIgnoreZoom;
  const boundTextElement = getBoundTextElement(element, elementsMap);
  const boundTextElementVersion = boundTextElement?.version || null;

  const containingFrameOpacity =
    getContainingFrame(element, elementsMap)?.opacity || 100;

  if (
    !prevElementWithCanvas ||
    shouldRegenerateBecauseZoom ||
    prevElementWithCanvas.theme !== appState.theme ||
    prevElementWithCanvas.boundTextElementVersion !== boundTextElementVersion ||
    prevElementWithCanvas.containingFrameOpacity !== containingFrameOpacity ||
    // since we rotate the canvas when copying from cached canvas, we don't
    // regenerate the cached canvas. But we need to in case of labels which are
    // cached alongside the arrow, and we want the labels to remain unrotated
    // with respect to the arrow.
    (isArrowElement(element) &&
      boundTextElement &&
      element.angle !== prevElementWithCanvas.angle)
  ) {
    const elementWithCanvas = generateElementCanvas(
      element,
      elementsMap,
      zoom,
      renderConfig,
      appState,
    );

    if (!elementWithCanvas) {
      return null;
    }

    elementWithCanvasCache.set(element, elementWithCanvas);

    return elementWithCanvas;
  }
  return prevElementWithCanvas;
};

export const drawElementFromCanvas = (
  elementWithCanvas: DucElementWithCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
) => {
  const element = elementWithCanvas.element;
  const padding = getCanvasPadding(element);
  const zoom = elementWithCanvas.scale;
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, allElementsMap);
  const cx = ((x1 + x2) / 2 + appState.scrollX) * window.devicePixelRatio;
  const cy = ((y1 + y2) / 2 + appState.scrollY) * window.devicePixelRatio;

  context.save();
  context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

  const boundTextElement = getBoundTextElement(element, allElementsMap);

  if (isArrowElement(element) && boundTextElement) {
    const offsetX =
      (elementWithCanvas.boundTextCanvas.width -
        elementWithCanvas.canvas!.width) /
      2;
    const offsetY =
      (elementWithCanvas.boundTextCanvas.height -
        elementWithCanvas.canvas!.height) /
      2;
    context.translate(cx, cy);
    context.drawImage(
      elementWithCanvas.boundTextCanvas,
      (-(x2 - x1) / 2) * window.devicePixelRatio - offsetX / zoom - padding,
      (-(y2 - y1) / 2) * window.devicePixelRatio - offsetY / zoom - padding,
      elementWithCanvas.boundTextCanvas.width / zoom,
      elementWithCanvas.boundTextCanvas.height / zoom,
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
  selectionColor: InteractiveCanvasRenderConfig["selectionColor"],
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
  context.strokeStyle = selectionColor ? selectionColor : COLOR_PALETTE.midGray;
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
    renderConfig.pendingFlowchartNodes,
  );

  // if element.isVisible is false, we should render with opacity 0
  if (!element.isVisible) {
    context.globalAlpha = 0;
    return; // no need to render
  }

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
        context.strokeStyle = element.strokeColor;

        // TODO change later to only affect AI frames
        if (isMagicFrameElement(element)) {
          context.strokeStyle =
            appState.theme === THEME.LIGHT ? "#7affd7" : "#1d8264";
        }

        // context.fillStyle = element.backgroundColor;
        // context.fillRect(0, 0, element.width, element.height);

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
          allElementsMap,
          renderConfig,
          appState,
        );
        if (!elementWithCanvas) {
          return;
        }

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
          allElementsMap,
          renderConfig,
          appState,
        );

        if (!elementWithCanvas) {
          return;
        }

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


        // Additional logic for rendering distance on "line" elements
        if (
          element.type === "line" &&
          appState.displayDistanceOnDrawing &&
          appState.newElement && appState.newElement.id === element.id && // Only render if it is the newElement
          element.points.length >= 2
        ) {
          renderDistanceOnDrawingLine(element, appState, allElementsMap, context);
        }

        if (
          element.type === "line" &&
          appState.displayAllPointInfoSelected &&
          !(appState.newElement && appState.newElement.id === element.id) && // Only render if not the newElement
          appState.selectedElementIds && appState.selectedElementIds[element.id]
        ) {
          if(element.points.length >= 2 && !appState.displayAllPointDistances)
            renderAllPointDistances(element, appState, allElementsMap, context);

          if(!appState.displayAllPointCoordinates)
            renderAllPointCoordinates(element, appState, allElementsMap, context);
        }

        if (
          element.type === "line" &&
          appState.displayAllPointDistances &&
          element.points.length >= 2
        ) {
          renderAllPointDistances(element, appState, allElementsMap, context);
        }

        if (
          element.type === "line" &&
          appState.displayAllPointCoordinates
        ) {
          renderAllPointCoordinates(element, appState, allElementsMap, context);
        }
        

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

  // element.isVisible ? context.globalAlpha = 1 : context.globalAlpha = 0;
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
    size: element.isStrokeDisabled ? 0 : element.strokeWidth * 4.25,
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
