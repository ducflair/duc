import { CURSOR_TYPE, MIME_TYPES, THEME } from "./constants";
import OpenColor from "open-color";
import type { AppState, DataURL } from "./types";
import { isHandToolActive, isEraserActive } from "./appState";


const defaultCursorSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.242 2.785a.412.412 0 0 1 .543-.543l13.333 5.417a.417.417 0 0 1-.053.789l-5.103 1.317a1.67 1.67 0 0 0-1.198 1.195l-1.316 5.105a.417.417 0 0 1-.79.053z" fill="#000" stroke="#000" stroke-width="2.725" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.242 2.785a.412.412 0 0 1 .543-.543l13.333 5.417a.417.417 0 0 1-.053.789l-5.103 1.317a1.67 1.67 0 0 0-1.198 1.195l-1.316 5.105a.417.417 0 0 1-.79.053z" fill="#000" stroke="#fff" stroke-width="1.429" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const defaultCursorURL = `data:${MIME_TYPES.svg},${encodeURIComponent(defaultCursorSVG)}`;

const laserCursorSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.517 3.85V1.515M3.85 8.516H1.516M5.25 5.25l-1.4-1.4m7.932 1.4 1.4-1.4M3.85 13.183l1.4-1.4" stroke="#000" stroke-width="2.917" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.517 8.517h-.012" stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.772 13.228a1 1 0 0 0-.01 1.424l8.351 8.353a2.75 2.75 0 0 0 1.945.806 2.763 2.763 0 0 0 2.75-2.751c0-.73-.29-1.43-.805-1.945l-8.353-8.352a1 1 0 0 0-1.424.01l-1.21 1.244zm11.258 4.914-3.888 3.889Zm-7.68-3.792 2.333 2.334ZM8.517 8.517l3.5 3.5Z" fill="#000"/><path d="m12.017 12.017 1.21-1.244a1 1 0 0 1 1.423-.01l8.353 8.352a2.75 2.75 0 0 1 .805 1.945 2.763 2.763 0 0 1-2.75 2.75c-.73 0-1.429-.29-1.945-.805l-8.351-8.353a1 1 0 0 1 .01-1.424zm0 0-3.5-3.5m13.513 9.625-3.888 3.889m-3.792-7.68 2.333 2.333" stroke="#000" stroke-width="2.333" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.517 3.85V1.515M3.85 8.516H1.516M5.25 5.25l-1.4-1.4m7.932 1.4 1.4-1.4M3.85 13.183l1.4-1.4" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.517 8.517h-.012" stroke="#fff" stroke-width="2.333" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.772 13.228a1 1 0 0 0-.01 1.424l8.351 8.353a2.75 2.75 0 0 0 1.945.806 2.763 2.763 0 0 0 2.75-2.751c0-.73-.29-1.43-.805-1.945l-8.353-8.352a1 1 0 0 0-1.424.01l-1.21 1.244zm11.258 4.914-3.888 3.889Zm-7.68-3.792 2.333 2.334ZM8.517 8.517l3.5 3.5Z" fill="#000"/><path d="m12.017 12.017 1.21-1.244a1 1 0 0 1 1.423-.01l8.353 8.352a2.75 2.75 0 0 1 .805 1.945 2.763 2.763 0 0 1-2.75 2.75c-.73 0-1.429-.29-1.945-.805l-8.351-8.353a1 1 0 0 1 .01-1.424zm0 0-3.5-3.5m13.513 9.625-3.888 3.889m-3.792-7.68 2.333 2.333" stroke="#fff" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const laserCursorURL = `data:${MIME_TYPES.svg},${encodeURIComponent(laserCursorSVG)}`;

const penCursorSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.897 16.856a.71.71 0 0 1-1.002 0L10.77 15.73a.71.71 0 0 1 0-1.002l3.959-3.958a.71.71 0 0 1 1.002 0l1.124 1.124a.71.71 0 0 1 0 1.002z" fill="#000" stroke="#000" stroke-width="2.657" stroke-linecap="round" stroke-linejoin="round"/><path d="m14.498 10.641-1.06-5.304a.77.77 0 0 0-.576-.598L3.106 2.175a.77.77 0 0 0-.931.932l2.563 9.756a.77.77 0 0 0 .599.575L10.64 14.5" fill="#000"/><path d="m14.498 10.641-1.06-5.304a.77.77 0 0 0-.576-.598L3.106 2.175a.77.77 0 0 0-.931.932l2.563 9.756a.77.77 0 0 0 .599.575L10.64 14.5" stroke="#000" stroke-width="2.657" stroke-linecap="round" stroke-linejoin="round"/><path d="m14.498 10.64-1.06-5.304a.77.77 0 0 0-.576-.598L3.106 2.174a.772.772 0 0 0-.931.932l2.563 9.756a.77.77 0 0 0 .599.575l5.303 1.061" fill="#000"/><path d="m14.498 10.64-1.06-5.304a.77.77 0 0 0-.576-.598L3.106 2.174a.772.772 0 0 0-.931.932l2.563 9.756a.77.77 0 0 0 .599.575l5.303 1.061" stroke="#fff" stroke-width="1.543" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.896 16.855a.71.71 0 0 1-1.002 0l-1.124-1.124a.71.71 0 0 1 0-1.002l3.959-3.959a.71.71 0 0 1 1.002 0l1.124 1.124a.71.71 0 0 1 0 1.002z" fill="#000" stroke="#fff" stroke-width="1.417" stroke-linecap="round" stroke-linejoin="round"/><path d="m2.385 2.384 5.621 5.622" stroke="#fff" stroke-width="1.543" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.097 10.641a1.543 1.543 0 1 0 0-3.086 1.543 1.543 0 0 0 0 3.086" fill="#000" stroke="#fff" stroke-width="1.543" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const penCursorURL = `data:${MIME_TYPES.svg},${encodeURIComponent(penCursorSVG)}`;

const duplicateCursorSVG = `<svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.409 2.618a.412.412 0 0 1 .543-.542l13.333 5.416a.417.417 0 0 1-.053.79L15.13 9.597a1.67 1.67 0 0 0-1.198 1.196l-1.316 5.105a.417.417 0 0 1-.79.052z" fill="#fff" stroke="#fff" stroke-width="2.725" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.409 2.618a.412.412 0 0 1 .543-.542l13.333 5.416a.417.417 0 0 1-.053.79L15.13 9.597a1.67 1.67 0 0 0-1.198 1.196l-1.316 5.105a.417.417 0 0 1-.79.052z" fill="#fff" stroke="#000" stroke-width="1.429" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.242 6.785a.412.412 0 0 1 .543-.543l13.333 5.417a.416.416 0 0 1-.053.789l-5.103 1.316a1.67 1.67 0 0 0-1.198 1.196l-1.316 5.105a.417.417 0 0 1-.79.053z" fill="#000" stroke="#000" stroke-width="2.725" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.242 6.785a.412.412 0 0 1 .543-.543l13.333 5.417a.416.416 0 0 1-.053.789l-5.103 1.316a1.67 1.67 0 0 0-1.198 1.196l-1.316 5.105a.417.417 0 0 1-.79.053z" fill="#000" stroke="#fff" stroke-width="1.429" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const duplicateCursorURL = `data:${MIME_TYPES.svg},${encodeURIComponent(duplicateCursorSVG)}`;

export const resetCursor = (interactiveCanvas: HTMLCanvasElement | null) => {
  if (interactiveCanvas) {
    // interactiveCanvas.style.cursor = "";
    interactiveCanvas.style.cursor = `url(${defaultCursorURL}), auto`;
  }
};

export const setDuplicateCursor = (interactiveCanvas: HTMLCanvasElement | null) => {
  if (interactiveCanvas) {
    interactiveCanvas.style.cursor = `url(${duplicateCursorURL}) 0 -2, auto`;
  }
}

export const setCursor = (
  interactiveCanvas: HTMLCanvasElement | null,
  cursor: string,
) => {
  if (interactiveCanvas) {
    interactiveCanvas.style.cursor = cursor;
  }
};

let eraserCanvasCache: any;
let previewDataURL: string;
export const setEraserCursor = (
  interactiveCanvas: HTMLCanvasElement | null,
  theme: AppState["theme"],
) => {
  const cursorImageSizePx = 20;

  const drawCanvas = () => {
    const isDarkTheme = theme === THEME.DARK;
    eraserCanvasCache = document.createElement("canvas");
    eraserCanvasCache.theme = theme;
    eraserCanvasCache.height = cursorImageSizePx;
    eraserCanvasCache.width = cursorImageSizePx;
    const context = eraserCanvasCache.getContext("2d")!;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(
      eraserCanvasCache.width / 2,
      eraserCanvasCache.height / 2,
      5,
      0,
      2 * Math.PI,
    );
    context.fillStyle = isDarkTheme ? OpenColor.black : OpenColor.white;
    context.fill();
    context.strokeStyle = isDarkTheme ? OpenColor.white : OpenColor.black;
    context.stroke();
    previewDataURL = eraserCanvasCache.toDataURL(MIME_TYPES.svg) as DataURL;
  };
  if (!eraserCanvasCache || eraserCanvasCache.theme !== theme) {
    drawCanvas();
  }

  setCursor(
    interactiveCanvas,
    `url(${previewDataURL}) ${cursorImageSizePx / 2} ${
      cursorImageSizePx / 2
    }, auto`,
  );
};

export const setCursorForShape = (
  interactiveCanvas: HTMLCanvasElement | null,
  appState: Pick<AppState, "activeTool" | "theme">,
) => {
  if (!interactiveCanvas) {
    return;
  }
  if (appState.activeTool.type === "selection") {
    resetCursor(interactiveCanvas);
  } else if (isHandToolActive(appState)) {
    interactiveCanvas.style.cursor = CURSOR_TYPE.GRAB;
  } else if (isEraserActive(appState)) {
    setEraserCursor(interactiveCanvas, appState.theme);
    // do nothing if image tool is selected which suggests there's
    // a image-preview set as the cursor
    // Ignore custom type as well and let host decide
  } else if (appState.activeTool.type === "line") {
    interactiveCanvas.style.cursor = `url(${penCursorURL}), auto`;
  } else if (appState.activeTool.type === "laser") {
    interactiveCanvas.style.cursor = `url(${laserCursorURL}), auto`;
  } else if (!["image", "custom"].includes(appState.activeTool.type)) {
    interactiveCanvas.style.cursor = CURSOR_TYPE.CROSSHAIR;
  } else if (appState.activeTool.type !== "image") {
    interactiveCanvas.style.cursor = CURSOR_TYPE.AUTO;
  }
};
