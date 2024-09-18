import type { StaticCanvasAppState, AppState } from "../types";

import type { RenderableElementsMap, StaticCanvasRenderConfig } from "../scene/types";

import { THEME, THEME_FILTER } from "../constants";
import { coordinateToRealMeasure } from "../duc/utils/measurements";
import { distance2d } from "../math";
import { LinearElementEditor } from "../element/linearElementEditor";
import { DucLinearElement, NonDeletedSceneElementsMap } from "../element/types";

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


// Function to render distances between each consecutive point in a linear element
export function renderAllPointDistances(
  element: DucLinearElement,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
  context: CanvasRenderingContext2D,
  color: string,
) {
  
  const zoom = appState.zoom.value;

  // Iterate through each pair of consecutive points
  for (let i = 1; i < element.points.length; i++) {
    const previousPoint = element.points[i - 1];
    const currentPoint = element.points[i];

    if(
      appState.displayDistanceOnDrawing 
      && i === element.points.length - 1
      && appState.newElement && appState.newElement.id === element.id // Only render if it is the newElement
    ) continue

    // Use global coordinates for the points
    const previousPointSceneCoords =
      LinearElementEditor.getPointGlobalCoordinates(
        element,
        previousPoint,
        allElementsMap,
      );
    const currentPointSceneCoords =
      LinearElementEditor.getPointGlobalCoordinates(
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

    // Calculate screen coordinates for both points
    const previousPointX =
      (previousPointSceneCoords[0] + appState.scrollX) * zoom;
    const previousPointY =
      (previousPointSceneCoords[1] + appState.scrollY) * zoom;
    const currentPointX = (currentPointSceneCoords[0] + appState.scrollX) * zoom;
    const currentPointY = (currentPointSceneCoords[1] + appState.scrollY) * zoom;

    // Calculate the midpoint between the two points
    const midX = (previousPointX + currentPointX) / 2;
    const midY = (previousPointY + currentPointY) / 2;

    // Offset the label slightly to ensure it doesn't overlap the line
    const offset = 10;
    const angle = Math.atan2(
      currentPointY - previousPointY,
      currentPointX - previousPointX,
    );
    const textX = midX + Math.cos(angle - Math.PI / 2) * offset;
    const textY = midY + Math.sin(angle - Math.PI / 2) * offset;

    // Save the current context state
    context.save();

    // Reset transformations to draw in screen coordinates
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Adjust for devicePixelRatio
    const pixelRatio = window.devicePixelRatio || 1;
    context.scale(pixelRatio, pixelRatio);

    // Render the distance label at the midpoint of the line
    renderTextWithBox(context, formattedDistance, textX / pixelRatio, textY / pixelRatio, color, appState);

    // Restore the context to its previous state
    context.restore();
  }
}


export function renderDistanceOnDrawingLine( 
  element: DucLinearElement, 
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
  context: CanvasRenderingContext2D,
  color: string
) {
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

  // Get current zoom value
  const zoom = appState.zoom.value;

  // Calculate screen coordinates for the points
  const currentPointX = (currentPointSceneCoords[0] + appState.scrollX) * zoom;
  const currentPointY = (currentPointSceneCoords[1] + appState.scrollY) * zoom;
  const lastCommittedPointX = (lastCommittedPointSceneCoords[0] + appState.scrollX) * zoom;
  const lastCommittedPointY = (lastCommittedPointSceneCoords[1] + appState.scrollY) * zoom;

  // The offset in screen pixels (constant)
  const offset = 75; // Adjust as needed

  // Calculate the angle between the points
  const angle = Math.atan2(
    currentPointY - lastCommittedPointY,
    currentPointX - lastCommittedPointX,
  );

  // Calculate the position for the text box
  const textX = currentPointX + Math.cos(angle - Math.PI / 2) * offset;
  const textY = currentPointY + Math.sin(angle - Math.PI / 2) * offset;

  // Save the current context state
  context.save();

  // Reset transformations to draw in screen coordinates
  context.setTransform(1, 0, 0, 1, 0, 0);

  // Adjust for devicePixelRatio
  const pixelRatio = window.devicePixelRatio || 1;

  // Scale context for high-DPI displays
  context.scale(pixelRatio, pixelRatio);

  // Render the text box (pass adjusted coordinates)
  renderTextWithBox(
    context,
    formattedDistance,
    textX / pixelRatio,
    textY / pixelRatio,
    color,
    appState,
  );

  // Restore the context to its previous state
  context.restore();
}




// Function to render the coordinates of each point in a linear element
export function renderAllPointCoordinates(
  element: DucLinearElement,
  appState: StaticCanvasAppState,
  allElementsMap: NonDeletedSceneElementsMap,
  context: CanvasRenderingContext2D,
  color: string,
) {
  if (element.points.length === 0) {
    return; // No points to render
  }

  const zoom = appState.zoom.value;

  // Iterate through each point in the element
  for (let i = 0; i < element.points.length; i++) {
    const point = element.points[i];

    // Use global coordinates for the point
    const pointSceneCoords = LinearElementEditor.getPointGlobalCoordinates(
      element,
      point,
      allElementsMap,
    );

    // Convert the coordinates to the desired number of decimal places
    const formattedX = pointSceneCoords[0].toFixed(appState.coordDecimalPlaces);
    const formattedY = pointSceneCoords[1].toFixed(appState.coordDecimalPlaces);

    // Combine the coordinates into a display string
    const formattedCoordinates = `(${formattedX}, ${formattedY})`;

    // Convert scene coordinates to screen coordinates, taking zoom and scroll into account
    const pointX = (pointSceneCoords[0] + appState.scrollX) * zoom;
    const pointY = (pointSceneCoords[1] + appState.scrollY) * zoom;

    // Offset the label slightly to ensure it's not right on top of the point
    const offset = 15; // Adjust offset to avoid overlap with the point
    const textX = pointX + offset;
    const textY = pointY - offset;

    // Save the current context state
    context.save();

    // Reset transformations to draw in screen coordinates
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Adjust for devicePixelRatio
    const pixelRatio = window.devicePixelRatio || 1;
    context.scale(pixelRatio, pixelRatio);

    // Render the coordinates next to each point
    renderTextWithBox(context, formattedCoordinates, textX / pixelRatio, textY / pixelRatio, color, appState);

    // Restore the context to its previous state
    context.restore();
  }
}
