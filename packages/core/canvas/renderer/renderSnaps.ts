import { THEME } from "../constants";
import type { PointSnapLine, PointerSnapLine } from "../snapping";
import type { InteractiveCanvasAppState, Point } from "../types";

const SNAP_COLOR_LIGHT = "#ff6b6b";
const SNAP_COLOR_DARK = "#ff6b6b";
const SNAP_WIDTH = 1;
const SNAP_CROSS_SIZE = 2;

export const renderSnaps = (
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
) => {
  if (!appState.snapLines.length) {
    return;
  }

  // in dark mode, we need to adjust the color to account for color inversion.
  // Don't change if zen mode, because we draw only crosses, we want the
  // colors to be more visible
  const snapColor =
    appState.theme === THEME.LIGHT || appState.zenModeEnabled
      ? SNAP_COLOR_LIGHT
      : SNAP_COLOR_DARK;
  // in zen mode make the cross more visible since we don't draw the lines
  const snapWidth =
    (appState.zenModeEnabled ? SNAP_WIDTH * 1.5 : SNAP_WIDTH) /
    appState.zoom.value;

  context.save();
  context.translate(appState.scrollX, appState.scrollY);

  for (const snapLine of appState.snapLines) {
    if (snapLine.type === "pointer") {
      context.lineWidth = snapWidth;
      context.strokeStyle = snapColor;

      drawPointerSnapLine(snapLine, context, appState);
    } else if (snapLine.type === "gap") {
      context.lineWidth = snapWidth;
      context.strokeStyle = snapColor;

      drawGapLine(
        snapLine.points[0],
        snapLine.points[1],
        snapLine.direction,
        appState,
        context,
      );
    } else if (snapLine.type === "points") {
      context.lineWidth = snapWidth;
      context.strokeStyle = snapColor;
      drawPointsSnapLine(snapLine, context, appState);
    }
  }

  context.restore();
};

const drawPointsSnapLine = (
  pointSnapLine: PointSnapLine,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
) => {
  if (!appState.zenModeEnabled) {
    const firstPoint = pointSnapLine.points[0];
    const lastPoint = pointSnapLine.points[pointSnapLine.points.length - 1];

    drawLine(firstPoint, lastPoint, context);
  }

  for (const point of pointSnapLine.points) {
    drawCross(point, appState, context);
  }
};

const drawPointerSnapLine = (
  pointerSnapLine: PointerSnapLine,
  context: CanvasRenderingContext2D,
  appState: InteractiveCanvasAppState,
) => {
  drawCross(pointerSnapLine.points[0], appState, context);
  if (!appState.zenModeEnabled) {
    drawLine(pointerSnapLine.points[0], pointerSnapLine.points[1], context);
  }
};

const drawCross = (
  {x, y}: Point,
  appState: InteractiveCanvasAppState,
  context: CanvasRenderingContext2D,
) => {
  context.save();
  const size =
    (appState.zenModeEnabled ? SNAP_CROSS_SIZE * 1.5 : SNAP_CROSS_SIZE) /
    appState.zoom.value;
  context.beginPath();

  context.moveTo(x - size, y - size);
  context.lineTo(x + size, y + size);

  context.moveTo(x + size, y - size);
  context.lineTo(x - size, y + size);

  context.stroke();
  context.restore();
};

const drawLine = (
  from: Point,
  to: Point,
  context: CanvasRenderingContext2D,
) => {
  context.beginPath();
  context.lineTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
};

const drawGapLine = (
  from: Point,
  to: Point,
  direction: "horizontal" | "vertical",
  appState: InteractiveCanvasAppState,
  context: CanvasRenderingContext2D,
) => {
  // a horizontal gap snap line
  // |–––––––||–––––––|
  // ^    ^   ^       ^
  // \    \   \       \
  // (1)  (2) (3)     (4)

  const FULL = 8 / appState.zoom.value;
  const HALF = FULL / 2;
  const QUARTER = FULL / 4;

  if (direction === "horizontal") {
    const halfPoint = {x: (from.x + to.x) / 2, y: from.y};
    // (1)
    if (!appState.zenModeEnabled) {
      drawLine({x: from.x, y: from.y - FULL}, {x: from.x, y: from.y + FULL}, context);
    }

    // (3)
    drawLine(
      {x: halfPoint.x - QUARTER, y: halfPoint.y - HALF},
      {x: halfPoint.x - QUARTER, y: halfPoint.y + HALF},
      context,
    );
    drawLine(
      {x: halfPoint.x + QUARTER, y: halfPoint.y - HALF},
      {x: halfPoint.x + QUARTER, y: halfPoint.y + HALF},
      context,
    );

    if (!appState.zenModeEnabled) {
      // (4)
      drawLine({x: to.x, y: to.y - FULL}, {x: to.x, y: to.y + FULL}, context);

      // (2)
      drawLine(from, to, context);
    }
  } else {
    const halfPoint = {x: from.x, y:(from.y + to.y) / 2};
    // (1)
    if (!appState.zenModeEnabled) {
      drawLine({x: from.x - FULL, y: from.y}, {x: from.x + FULL, y: from.y}, context);
    }

    // (3)
    drawLine(
      {x: halfPoint.x - HALF, y: halfPoint.y - QUARTER},
      {x: halfPoint.x + HALF, y: halfPoint.y - QUARTER},
      context,
    );
    drawLine(
      {x: halfPoint.x - HALF, y: halfPoint.y + QUARTER},
      {x: halfPoint.x + HALF, y: halfPoint.y + QUARTER},
      context,
    );

    if (!appState.zenModeEnabled) {
      // (4)
      drawLine({x: to.x - FULL, y: to.y}, {x: to.x + FULL, y: to.y}, context);

      // (2)
      drawLine(from, to, context);
    }
  }
};
