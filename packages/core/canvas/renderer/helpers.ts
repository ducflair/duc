import type { StaticCanvasAppState, AppState } from "../types";

import type { RenderableElementsMap, StaticCanvasRenderConfig } from "../scene/types";

import { FONT_FAMILY, THEME, THEME_FILTER } from "../constants";
import { coordinateToRealMeasure } from "../duc/utils/measurements";
import { distance2d } from "../math";
import { LinearElementEditor } from "../element/linearElementEditor";
import { DucLinearElement, DucTextElement, NonDeletedSceneElementsMap } from "../element/types";
import { cappedElementCanvasSize, drawElementFromCanvas, generateElementWithCanvas, getCanvasPadding } from "./renderElement";
import { getElementAbsoluteCoords } from "../element";

export const fillCircle = (
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  stroke = true,
) => {
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();
  if (stroke) {
    context.stroke();
  }
};

export const getNormalizedCanvasDimensions = (
  canvas: HTMLCanvasElement,
  scale: number,
): [number, number] => {
  // When doing calculations based on canvas width we should used normalized one
  return [canvas.width / scale, canvas.height / scale];
};

export const bootstrapCanvas = ({
  canvas,
  scale,
  normalizedWidth,
  normalizedHeight,
  theme,
  isExporting,
  viewBackgroundColor,
}: {
  canvas: HTMLCanvasElement;
  scale: number;
  normalizedWidth: number;
  normalizedHeight: number;
  theme?: AppState["theme"];
  isExporting?: StaticCanvasRenderConfig["isExporting"];
  viewBackgroundColor?: StaticCanvasAppState["viewBackgroundColor"];
}): CanvasRenderingContext2D => {
  const context = canvas.getContext("2d")!;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(scale, scale);

  if (isExporting && theme === THEME.DARK) {
    context.filter = THEME_FILTER;
  }

  // Paint background
  if (typeof viewBackgroundColor === "string") {
    const hasTransparence =
      viewBackgroundColor === "transparent" ||
      viewBackgroundColor.length === 5 || // #RGBA
      viewBackgroundColor.length === 9 || // #RRGGBBA
      /(hsla|rgba)\(/.test(viewBackgroundColor);
    if (hasTransparence) {
      context.clearRect(0, 0, normalizedWidth, normalizedHeight);
    }
    context.save();
    context.fillStyle = viewBackgroundColor;
    context.fillRect(0, 0, normalizedWidth, normalizedHeight);
    context.restore();
  } else {
    context.clearRect(0, 0, normalizedWidth, normalizedHeight);
  }

  return context;
};



// Function to render the text with a background box
export function renderTextWithBox(
  context: CanvasRenderingContext2D,
  text: string,
  textX: number,
  textY: number,
  color: string,
  appState: StaticCanvasAppState,
) {
  // Set font size (constant in screen pixels)
  const fontSize = 12; // Constant size regardless of zoom
  const fontWeight = 500;
  context.font = `${fontWeight} ${fontSize}px 'Roboto Mono', monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Measure text size
  const textMetrics = context.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize; // Approximate text height
  const padding = 6; // Constant padding in pixels

  // Calculate box dimensions
  const boxWidth = textWidth + 2 * padding;
  const boxHeight = textHeight + 2 * padding-3;

  // Calculate top-left corner of the box
  const boxX = textX - boxWidth / 2;
  const boxY = textY - boxHeight / 2;

  // Draw the background box
  context.fillStyle = color;
  drawRoundedRect(context, boxX, boxY, boxWidth, boxHeight, 10);
  context.fill();

  // Set text color based on the theme
  context.fillStyle = appState.theme === THEME.DARK ? "#FFFFFF" : "#000000";

  // Draw the text inside the box
  context.fillText(text, textX, textY);
}

export function renderQuickText(
  context: CanvasRenderingContext2D,
  text: string,
  textX: number,
  textY: number,
  color: string,
) {
  // Set font size (constant in screen pixels)
  const fontSize = 12; // Constant size regardless of zoom
  const fontWeight = 500;
  context.font = `${fontWeight} ${fontSize}px 'Roboto Mono', monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Set text color based on the theme
  context.fillStyle = color;

  // Draw the text inside the box
  context.fillText(text, textX, textY);
}


// Utility function to draw a rounded rectangle
function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}


export function renderDistanceOnDrawingLine(
  element: DucLinearElement,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
  context: CanvasRenderingContext2D
) {

  const zoom = appState.zoom.value;
  const pixelRatio = window.devicePixelRatio || 1;

  // Save the current context state
  context.save();

  // Scale the context for device pixel ratio and reset any previous transformations
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(zoom * pixelRatio, zoom * pixelRatio);

  const lastCommittedPoint = element.points[element.points.length - 2];
  const currentPoint = element.points[element.points.length - 1];

  // Use global coordinates for the points
  const lastCommittedPointSceneCoords = LinearElementEditor.getPointGlobalCoordinates(
    element,
    lastCommittedPoint,
    allElementsMap,
  );
  const currentPointSceneCoords = LinearElementEditor.getPointGlobalCoordinates(
    element,
    currentPoint,
    allElementsMap,
  );

  // Calculate distance between the points
  const distance = distance2d(
    lastCommittedPointSceneCoords[0],
    lastCommittedPointSceneCoords[1],
    currentPointSceneCoords[0],
    currentPointSceneCoords[1],
  );

  // Format the distance
  const formattedDistance = coordinateToRealMeasure(
    distance,
    appState.scope,
    element.scope,
  ).toFixed(appState.coordDecimalPlaces);

  
  // Apply zoom and scroll to calculate the accurate position
  const screenX = (currentPointSceneCoords[0] + appState.scrollX);
  const screenY = (currentPointSceneCoords[1] + appState.scrollY);

  // Offset the label slightly to ensure it's not right on top of the point
  const offset = 0 * pixelRatio;

  const textX = screenX + offset / zoom;
  const textY = screenY - offset / zoom;

  // Render the text with background box at the calculated position
  renderTextWithBoxAtPosition(
    context,
    formattedDistance,
    textX,
    textY + (40 / zoom),
    "#5E310190",
    appState,
    pixelRatio,
    8 / zoom,
    "#FFDD84"
  );

  // Restore the context to its previous state
  context.restore();
}



export function renderAllPointDistances(
  element: DucLinearElement,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
  context: CanvasRenderingContext2D,
) {
  const zoom = appState.zoom.value;
  const pixelRatio = window.devicePixelRatio || 1;

  // Save the current context state
  context.save();

  // Scale the context for device pixel ratio and reset any previous transformations
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(zoom * pixelRatio, zoom * pixelRatio);

  // Iterate through each pair of consecutive points
  for (let i = 1; i < element.points.length; i++) {
    const previousPoint = element.points[i - 1];
    const currentPoint = element.points[i];

    // Skip rendering if it's the current drawing element in progress
    if (
      appState.displayDistanceOnDrawing &&
      i === element.points.length - 1 &&
      appState.newElement && appState.newElement.id === element.id
    ) continue;

    // Use global coordinates for the points
    const previousPointSceneCoords = LinearElementEditor.getPointGlobalCoordinates(
      element,
      previousPoint,
      allElementsMap,
    );
    const currentPointSceneCoords = LinearElementEditor.getPointGlobalCoordinates(
      element,
      currentPoint,
      allElementsMap,
    );

    // Calculate distance between the points
    const distance = distance2d(
      previousPointSceneCoords[0],
      previousPointSceneCoords[1],
      currentPointSceneCoords[0],
      currentPointSceneCoords[1],
    );

    // Format the distance for display
    const formattedDistance = coordinateToRealMeasure(
      distance,
      appState.scope,
      element.scope,
    ).toFixed(appState.coordDecimalPlaces);

    // Calculate the midpoint between the two points
    const midX = (previousPointSceneCoords[0] + currentPointSceneCoords[0]) / 2 + appState.scrollX;
    const midY = (previousPointSceneCoords[1] + currentPointSceneCoords[1]) / 2 + appState.scrollY;

    // Offset the label slightly to ensure it doesn't overlap the line
    const offset = 1 / zoom; // Offset adjusted based on zoom
    const angle = Math.atan2(
      currentPointSceneCoords[1] - previousPointSceneCoords[1],
      currentPointSceneCoords[0] - previousPointSceneCoords[0],
    );
    const textX = midX + Math.cos(angle - Math.PI / 2) * offset;
    const textY = midY + Math.sin(angle - Math.PI / 2) * offset;

    // Render the text with background box at the calculated position
    renderTextWithBoxAtPosition(
      context,
      formattedDistance,
      textX,
      textY,
      "#5E310190",
      appState,
      pixelRatio,
      2,
      "#FFDD84"
    );
  }

  // Restore the context to its previous state
  context.restore();
}

// Function to render the coordinates of each point in a linear element
export function renderAllPointCoordinates(
  element: DucLinearElement,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
  context: CanvasRenderingContext2D,
) {
  if (element.points.length === 0) {
    return; // No points to render
  }

  const zoom = appState.zoom.value;
  const pixelRatio = window.devicePixelRatio || 1;

  // Save the current context state
  context.save();

  // Scale the context for device pixel ratio and reset any previous transformations
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(zoom * pixelRatio, zoom * pixelRatio);

  // Iterate through each point in the element
  for (let i = 0; i < element.points.length; i++) {
    const point = element.points[i];
    const pointSceneCoords = LinearElementEditor.getPointGlobalCoordinates(
      element,
      point,
      allElementsMap,
    );

    const formattedX = coordinateToRealMeasure(
      pointSceneCoords[0],
      appState.scope,
      element.scope,
    ).toFixed(appState.coordDecimalPlaces);

    const formattedY = coordinateToRealMeasure(
      pointSceneCoords[1],
      appState.scope,
      element.scope,
    ).toFixed(appState.coordDecimalPlaces);

    // Combine the coordinates into a display string
    const formattedCoordinates = `(${formattedX}, ${formattedY})`;

    // Apply zoom and scroll to calculate the accurate position
    const screenX = (pointSceneCoords[0] + appState.scrollX);
    const screenY = (pointSceneCoords[1] + appState.scrollY);

    // Offset the label slightly to ensure it's not right on top of the point
    const offset = 0; // This offset is scaled by zoom, so it becomes less as you zoom out

    const textX = screenX + offset / zoom;
    const textY = screenY - offset / zoom;

    // Render the text with background box at the calculated position
    renderTextWithBoxAtPosition(
      context,
      formattedCoordinates,
      textX,
      textY+6,
      "#FFDD84",
      appState,
      pixelRatio,
      1.2,
      "#6E461A"
    );
  }

  // Restore the context to its previous state
  context.restore();
}




export function renderTextWithBoxAtPosition(
  context: CanvasRenderingContext2D,
  text: string,
  textX: number,
  textY: number,
  color: string,
  appState: StaticCanvasAppState,
  pixelRatio: number,
  size?: number,
  textColor?: string,
) {
  const baseSize = size ? size : 4;
  // Set font size (constant in screen pixels)
  const fontSize = baseSize * pixelRatio; // Adjust as needed
  const fontWeight = 500;
  context.font = `${fontWeight} ${fontSize}px 'Roboto Mono', monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Measure text size
  const textMetrics = context.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize; // Approximate text height
  const padding = baseSize / 2 * pixelRatio; // Adjust padding as needed

  // Calculate box dimensions
  const boxWidth = textWidth + 2 * padding;
  const boxHeight = textHeight + 2 * padding;

  // Calculate top-left corner of the box
  const boxX = textX - boxWidth / 2;
  const boxY = textY - boxHeight / 2;

  // Draw the background box
  context.fillStyle = color;
  drawRoundedRect(context, boxX, boxY, boxWidth, boxHeight, baseSize * pixelRatio);
  context.fill();

  // Set text color based on the theme
  context.fillStyle = textColor ? textColor : appState.theme === THEME.DARK ? "#FFFFFF" : "#000000";

  // Draw the text inside the box
  context.fillText(text, textX, textY);
}

