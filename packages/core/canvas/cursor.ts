import { CURSOR_TYPE, MIME_TYPES, THEME } from "./constants";
import OpenColor from "open-color";
import type { AppState, DataURL } from "./types";
import { isHandToolActive, isEraserActive } from "./appState";



const laserCursorSVG_Light = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.90573 12.2587C9.50601 12.6476 9.50157 13.2883 9.89587 13.6826L18.2475 22.0353C18.7633 22.5512 19.4629 22.8412 20.1924 22.8415C20.9208 22.8381 21.6185 22.5472 22.1335 22.032C22.6485 21.5167 22.9391 20.819 22.9422 20.0905C22.9422 19.3613 22.6529 18.6613 22.1372 18.1457L13.7845 9.79402C13.3901 9.39972 12.7494 9.40416 12.3606 9.80389L11.1507 11.0477L9.90573 12.2587ZM21.1642 17.1727L17.2757 21.0612ZM13.484 13.381L15.8174 15.7143ZM7.6507 7.54767L11.1507 11.0477ZM4.27436 4.22967L5.44103 5.39634ZM2.9502 8.07617L4.5917 7.90817ZM11.2825 4.48751L9.9782 5.49784ZM4.99886 11.4607L5.8832 10.0677ZM8.0567 2.82617L7.90503 4.46884Z" fill="white"/><path d="M11.1507 11.0477L12.3606 9.80389C12.7494 9.40416 13.3901 9.39972 13.7845 9.79402L22.1372 18.1457C22.6529 18.6613 22.9422 19.3613 22.9422 20.0905C22.9391 20.819 22.6485 21.5167 22.1335 22.032C21.6185 22.5472 20.9208 22.8381 20.1924 22.8415C19.4629 22.8412 18.7633 22.5512 18.2475 22.0353L9.89587 13.6826C9.50157 13.2883 9.50601 12.6476 9.90573 12.2587L11.1507 11.0477ZM11.1507 11.0477L7.6507 7.54767M21.1642 17.1727L17.2757 21.0612M13.484 13.381L15.8174 15.7143M4.27436 4.22967L5.44103 5.39634M2.9502 8.07617L4.5917 7.90817M11.2825 4.48751L9.9782 5.49784M4.99886 11.4607L5.8832 10.0677M8.0567 2.82617L7.90503 4.46884" stroke="black" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const laserCursorSVG_Dark = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.90476 12.2587C9.50503 12.6476 9.50059 13.2883 9.89489 13.6826L18.2466 22.0353C18.7624 22.5512 19.4619 22.8412 20.1914 22.8415C20.9198 22.8381 21.6175 22.5472 22.1325 22.032C22.6475 21.5167 22.9382 20.819 22.9412 20.0905C22.9412 19.3613 22.6519 18.6613 22.1362 18.1457L13.7835 9.79402C13.3891 9.39972 12.7485 9.40416 12.3596 9.80389L11.1497 11.0477L9.90476 12.2587ZM21.1632 17.1727L17.2747 21.0612ZM13.4831 13.381L15.8164 15.7143ZM7.64972 7.54767L11.1497 11.0477ZM4.27339 4.22967L5.44005 5.39634ZM2.94922 8.07617L4.59072 7.90817ZM11.2816 4.48751L9.97722 5.49784ZM4.99789 11.4607L5.88222 10.0677ZM8.05572 2.82617L7.90405 4.46884Z" fill="black"/><path d="M11.1497 11.0477L12.3596 9.80389C12.7485 9.40416 13.3891 9.39972 13.7835 9.79402L22.1362 18.1457C22.6519 18.6613 22.9412 19.3613 22.9412 20.0905C22.9382 20.819 22.6475 21.5167 22.1325 22.032C21.6175 22.5472 20.9198 22.8381 20.1914 22.8415C19.4619 22.8412 18.7624 22.5512 18.2466 22.0353L9.89489 13.6826C9.50059 13.2883 9.50503 12.6476 9.90476 12.2587L11.1497 11.0477ZM11.1497 11.0477L7.64972 7.54767M21.1632 17.1727L17.2747 21.0612M13.4831 13.381L15.8164 15.7143M4.27339 4.22967L5.44005 5.39634M2.94922 8.07617L4.59072 7.90817M11.2816 4.48751L9.97722 5.49784M4.99789 11.4607L5.88222 10.0677M8.05572 2.82617L7.90405 4.46884" stroke="white" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const laserPointerCursorDataURL_lightMode = `data:${
  MIME_TYPES.svg
  },${encodeURIComponent(laserCursorSVG_Light)}`;
const laserPointerCursorDataURL_darkMode = `data:${
  MIME_TYPES.svg
},${encodeURIComponent(laserCursorSVG_Dark)}`;
  

const defaultCursorSVG_Dark = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.36604 3.90658C3.33315 3.83068 3.32384 3.74664 3.33932 3.66538C3.3548 3.58412 3.39436 3.50939 3.45285 3.4509C3.51134 3.3924 3.58607 3.35285 3.66733 3.33737C3.74859 3.32189 3.83263 3.33119 3.90854 3.36408L17.2419 8.78075C17.3229 8.81378 17.3916 8.87151 17.438 8.94574C17.4844 9.01997 17.5062 9.10693 17.5004 9.19428C17.4946 9.28163 17.4614 9.36493 17.4056 9.43236C17.3498 9.49979 17.2741 9.54792 17.1894 9.56992L12.086 10.8866C11.7977 10.9607 11.5345 11.1107 11.3237 11.321C11.113 11.5313 10.9624 11.7942 10.8877 12.0824L9.57187 17.1874C9.54987 17.2722 9.50174 17.3478 9.43431 17.4036C9.36688 17.4595 9.28358 17.4926 9.19623 17.4985C9.10888 17.5043 9.02192 17.4824 8.94769 17.436C8.87346 17.3896 8.81573 17.321 8.7827 17.2399L3.36604 3.90658Z" fill="black" stroke="white" stroke-width="1.42857" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const defaultCursorSVG_Light = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.36408 3.90609C3.33119 3.83019 3.32189 3.74615 3.33737 3.66489C3.35285 3.58363 3.3924 3.5089 3.4509 3.45041C3.50939 3.39192 3.58412 3.35236 3.66538 3.33688C3.74664 3.3214 3.83068 3.33071 3.90658 3.36359L17.2399 8.78026C17.321 8.81329 17.3896 8.87102 17.436 8.94525C17.4824 9.01948 17.5043 9.10644 17.4985 9.19379C17.4926 9.28114 17.4595 9.36444 17.4036 9.43187C17.3478 9.4993 17.2722 9.54743 17.1874 9.56943L12.0841 10.8861C11.7957 10.9602 11.5325 11.1102 11.3218 11.3205C11.111 11.5308 10.9605 11.7937 10.8858 12.0819L9.56992 17.1869C9.54792 17.2717 9.49979 17.3473 9.43236 17.4031C9.36493 17.459 9.28163 17.4922 9.19428 17.498C9.10693 17.5038 9.01997 17.4819 8.94574 17.4355C8.87151 17.3891 8.81378 17.3205 8.78075 17.2394L3.36408 3.90609Z" fill="white" stroke="black" stroke-width="1.42857" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const defaultCursorDataURL_Dark = `data:${MIME_TYPES.svg},${encodeURIComponent(defaultCursorSVG_Dark)}`;
const defaultCursorDataURL_Light = `data:${MIME_TYPES.svg},${encodeURIComponent(defaultCursorSVG_Light)}`;

const penCursorSVG_Dark = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.0003 10.8332L13.8545 5.10484C13.8233 4.94899 13.7482 4.8053 13.6381 4.69073C13.5279 4.57615 13.3873 4.49546 13.2328 4.45818L2.69616 1.68984C2.55735 1.65628 2.41225 1.65896 2.27477 1.69761C2.13729 1.73626 2.01205 1.8096 1.91107 1.91058C1.81009 2.01156 1.73675 2.1368 1.6981 2.27428C1.65944 2.41176 1.65677 2.55687 1.69033 2.69568L4.45866 13.2323C4.49595 13.3868 4.57664 13.5275 4.69121 13.6376C4.80579 13.7478 4.94948 13.8228 5.10533 13.854L10.8337 14.9998" fill="black"/><path d="M15.0003 10.8332L13.8545 5.10484C13.8233 4.94899 13.7482 4.8053 13.6381 4.69073C13.5279 4.57615 13.3873 4.49546 13.2328 4.45818L2.69616 1.68984C2.55735 1.65628 2.41225 1.65896 2.27477 1.69761C2.13729 1.73626 2.01205 1.8096 1.91107 1.91058C1.81009 2.01156 1.73675 2.1368 1.6981 2.27428C1.65944 2.41176 1.65677 2.55687 1.69033 2.69568L4.45866 13.2323C4.49595 13.3868 4.57664 13.5275 4.69121 13.6376C4.80579 13.7478 4.94948 13.8228 5.10533 13.854L10.8337 14.9998" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.0887 17.7442C12.9324 17.9004 12.7205 17.9882 12.4995 17.9882C12.2786 17.9882 12.0667 17.9004 11.9104 17.7442L10.5887 16.4225C10.4325 16.2663 10.3447 16.0543 10.3447 15.8334C10.3447 15.6124 10.4325 15.4005 10.5887 15.2442L15.2437 10.5892C15.4 10.433 15.6119 10.3452 15.8329 10.3452C16.0539 10.3452 16.2658 10.433 16.422 10.5892L17.7437 11.9109C17.8999 12.0671 17.9877 12.2791 17.9877 12.5C17.9877 12.721 17.8999 12.9329 17.7437 13.0892L13.0887 17.7442Z" fill="black" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.91699 1.9165L7.98866 7.98817" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.16667 10.8333C10.0871 10.8333 10.8333 10.0871 10.8333 9.16667C10.8333 8.24619 10.0871 7.5 9.16667 7.5C8.24619 7.5 7.5 8.24619 7.5 9.16667C7.5 10.0871 8.24619 10.8333 9.16667 10.8333Z" fill="black" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const penCursorSVG_Light = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.0003 10.8332L13.8545 5.10484C13.8233 4.94899 13.7482 4.8053 13.6381 4.69073C13.5279 4.57615 13.3873 4.49546 13.2328 4.45818L2.69616 1.68984C2.55735 1.65628 2.41225 1.65896 2.27477 1.69761C2.13729 1.73626 2.01205 1.8096 1.91107 1.91058C1.81009 2.01156 1.73675 2.1368 1.6981 2.27428C1.65944 2.41176 1.65677 2.55687 1.69033 2.69568L4.45866 13.2323C4.49595 13.3868 4.57664 13.5275 4.69121 13.6376C4.80579 13.7478 4.94948 13.8228 5.10533 13.854L10.8337 14.9998" fill="white"/><path d="M15.0003 10.8332L13.8545 5.10484C13.8233 4.94899 13.7482 4.8053 13.6381 4.69073C13.5279 4.57615 13.3873 4.49546 13.2328 4.45818L2.69616 1.68984C2.55735 1.65628 2.41225 1.65896 2.27477 1.69761C2.13729 1.73626 2.01205 1.8096 1.91107 1.91058C1.81009 2.01156 1.73675 2.1368 1.6981 2.27428C1.65944 2.41176 1.65677 2.55687 1.69033 2.69568L4.45866 13.2323C4.49595 13.3868 4.57664 13.5275 4.69121 13.6376C4.80579 13.7478 4.94948 13.8228 5.10533 13.854L10.8337 14.9998" stroke="black" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.0887 17.7442C12.9324 17.9004 12.7205 17.9882 12.4995 17.9882C12.2786 17.9882 12.0667 17.9004 11.9104 17.7442L10.5887 16.4225C10.4325 16.2663 10.3447 16.0543 10.3447 15.8334C10.3447 15.6124 10.4325 15.4005 10.5887 15.2442L15.2437 10.5892C15.4 10.433 15.6119 10.3452 15.8329 10.3452C16.0539 10.3452 16.2658 10.433 16.422 10.5892L17.7437 11.9109C17.8999 12.0671 17.9877 12.2791 17.9877 12.5C17.9877 12.721 17.8999 12.9329 17.7437 13.0892L13.0887 17.7442Z" fill="white" stroke="black" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.91699 1.9165L7.98866 7.98817" stroke="black" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.16667 10.8333C10.0871 10.8333 10.8333 10.0871 10.8333 9.16667C10.8333 8.24619 10.0871 7.5 9.16667 7.5C8.24619 7.5 7.5 8.24619 7.5 9.16667C7.5 10.0871 8.24619 10.8333 9.16667 10.8333Z" fill="white" stroke="black" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const penCursorDataURL_Dark = `data:${MIME_TYPES.svg},${encodeURIComponent(penCursorSVG_Dark)}`;
const penCursorDataURL_Light = `data:${MIME_TYPES.svg},${encodeURIComponent(penCursorSVG_Light)}`;

export const resetCursor = (interactiveCanvas: HTMLCanvasElement | null, appState: Pick<AppState, "theme">) => {
  if (interactiveCanvas) {
    // interactiveCanvas.style.cursor = "";
    const url = 
      appState.theme === THEME.LIGHT
        ? defaultCursorDataURL_Light
        : defaultCursorDataURL_Dark;
    interactiveCanvas.style.cursor = `url(${url}), auto`;
  }
};

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
    resetCursor(interactiveCanvas, appState);
  } else if (isHandToolActive(appState)) {
    interactiveCanvas.style.cursor = CURSOR_TYPE.GRAB;
  } else if (isEraserActive(appState)) {
    setEraserCursor(interactiveCanvas, appState.theme);
    // do nothing if image tool is selected which suggests there's
    // a image-preview set as the cursor
    // Ignore custom type as well and let host decide
  } else if (appState.activeTool.type === "line") {
    const url = 
      appState.theme === THEME.LIGHT
        ? penCursorDataURL_Light
        : penCursorDataURL_Dark;
    interactiveCanvas.style.cursor = `url(${url}), auto`;
  } else if (appState.activeTool.type === "laser") {
    const url =
      appState.theme === THEME.LIGHT
        ? laserPointerCursorDataURL_lightMode
        : laserPointerCursorDataURL_darkMode;
    interactiveCanvas.style.cursor = `url(${url}), auto`;
  } else if (!["image", "custom"].includes(appState.activeTool.type)) {
    interactiveCanvas.style.cursor = CURSOR_TYPE.CROSSHAIR;
  } else if (appState.activeTool.type !== "image") {
    interactiveCanvas.style.cursor = CURSOR_TYPE.AUTO;
  }
};
