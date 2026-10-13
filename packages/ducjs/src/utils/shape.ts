import { BEZIER_MIRRORING } from "../enums";
import { DucElement, DucFreeDrawElement, DucLine, DucLinearElement, DucNonSelectionElement, DucPath, DucPoint, NonDeletedDucElement } from "../types/elements";
import { isArrowElement, isEllipseElement, isFreeDrawElement, isLinearElement, isPolygonElement } from "../types/elements/typeChecks";
import { calculateShapeBounds } from "./bounds";
import { getBaseElementProps } from "./elements";
import { getNormalizedPoints, mergeOverlappingPoints } from "./elements/linearElement";
import { newLinearElement } from "./elements/newElement";
import { rotatePoint } from "./math";

/**
 * Converts a shape (rectangle, polygon, ellipse) to a linear element
 */
export const convertShapeToLinearElement = (
  element: DucNonSelectionElement,
): DucLinearElement | null => {
  if (!element) return null;

  const { points, lines, pathOverrides } = getElementRelativePoints(element);

  // Create a new linear element based on the shape's points
  const linearElement = newLinearElement({
    ...getBaseElementProps(element),
    type: "line",
    points,
    lines,
    pathOverrides,
  });

  const normalizedLinearElement = getNormalizedPoints(linearElement);

  return {
    ...linearElement,
    ...normalizedLinearElement,
  };
};


/** 
 * @returns vertices relative to element's top-left {x: 0, y: 0} position 
 * */
const getNonLinearElementRelativePoints = (
  element: Exclude<
    NonDeletedDucElement,
    DucLinearElement | DucFreeDrawElement
  >,
): { points: DucPoint[], lines: DucLine[], pathOverrides?: DucPath[] } => {
  if (isPolygonElement(element)) {
    const numSides = element.sides;
    const width = typeof element.width === "number" ? element.width : ((element.width as any)?.value ?? 0);
    const height = typeof element.height === "number" ? element.height : ((element.height as any)?.value ?? 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    
    const points: DucPoint[] = [];
    const lines: DucLine[] = [];
    let pathOverrides: DucPath[] | undefined = undefined;

    // Generate polygon vertices inscribed in the ellipse
    for (let i = 0; i < numSides; i++) {
      // Calculate the base angle for this vertex
      const baseAngle = (2 * Math.PI * i) / numSides - Math.PI / 2; // Start at top
      
      // Calculate point on ellipse using the rotated angle
      const x = centerX + radiusX * Math.cos(baseAngle);
      const y = centerY + radiusY * Math.sin(baseAngle);
      
      points.push({
        x,
        y,
      });
    }

    // Create lines connecting consecutive vertices (closed polygon)
    for (let i = 0; i < numSides; i++) {
      const currentIndex = i;
      const nextIndex = (i + 1) % numSides; // Wrap around to 0 for the last vertex

      lines.push([
        { index: currentIndex, handle: null },
        { index: nextIndex, handle: null }
      ]);
    }

    // Apply the correction for polygon points after generation
    const corrected = getCorrectedOrthodoxElementPoints(
      element,
      points,
      lines,
    );

    return { points: corrected.points, lines: corrected.lines, pathOverrides };
  }

  if (isEllipseElement(element)) {
    const { ratio, startAngle, endAngle } = element;
    const toNum = (v: any) => typeof v === "number" ? v : (v?.value ?? 0);
    const w = toNum(element.width);
    const h = element.height !== undefined ? toNum(element.height) : w;

    if (w <= 0 || h <= 0) {
      return { points: [], lines: [] };
    }

    const rx = w / 2;
    const ry = h / 2;
    const cx = w / 2;
    const cy = h / 2;
    const epsilon = 1e-6;

    const sweepAngle = endAngle - startAngle;
    const isFullShape = Math.abs(sweepAngle) >= 2 * Math.PI - epsilon;

    const allPoints: DucPoint[] = [];
    const allLines: DucLine[] = [];
    let pathOverrides: DucPath[] | undefined = undefined;

    const createArc = (
      radiusX: number,
      radiusY: number,
      sAngle: number,
      eAngle: number,
    ): { points: DucPoint[]; lines: DucLine[] } => {
      const arcPoints: DucPoint[] = [];
      const arcLines: DucLine[] = [];

      const sweep = eAngle - sAngle;
      if (Math.abs(sweep) < epsilon) {
        return { points: arcPoints, lines: arcLines };
      }

      const nSegments = Math.ceil(Math.abs(sweep) / (Math.PI / 2));
      const segmentSweep = sweep / nSegments;

      for (let i = 0; i < nSegments; i++) {
        const angle0 = sAngle + i * segmentSweep;
        const angle1 = sAngle + (i + 1) * segmentSweep;

        const p0 = { x: cx + radiusX * Math.cos(angle0), y: cy + radiusY * Math.sin(angle0) };
        if (i === 0) {
          arcPoints.push({
            x: p0.x,
            y: p0.y,
            mirroring: BEZIER_MIRRORING.ANGLE_LENGTH,
          });
        }

        const p3 = { x: cx + radiusX * Math.cos(angle1), y: cy + radiusY * Math.sin(angle1) };
        arcPoints.push({
          x: p3.x,
          y: p3.y,
          mirroring: BEZIER_MIRRORING.ANGLE_LENGTH,
        });

        const k = (4 / 3) * Math.tan(segmentSweep / 4);
        const t0 = { x: -radiusX * Math.sin(angle0), y: radiusY * Math.cos(angle0) };
        const t1 = { x: -radiusX * Math.sin(angle1), y: radiusY * Math.cos(angle1) };

        const cp1 = { x: p0.x + t0.x * k, y: p0.y + t0.y * k };
        const cp2 = { x: p3.x - t1.x * k, y: p3.y - t1.y * k };

        arcLines.push([
          {
            index: i,
            handle: {
              x: cp1.x,
              y: cp1.y,
            },
          },
          {
            index: i + 1,
            handle: {
              x: cp2.x,
              y: cp2.y,
            },
          },
        ]);
      }
      return { points: arcPoints, lines: arcLines };
    };

    const addPathToElement = (
      pointsToAdd: DucPoint[],
      linesToAdd: DucLine[],
    ): { pointIndices: number[]; lineIndices: number[] } => {
      const pointIndices = Array.from({ length: pointsToAdd.length }, (_, i) => allPoints.length + i);
      const lineStartIdx = allLines.length;
      allPoints.push(...pointsToAdd);
      for (const line of linesToAdd) {
        line[0].index = pointIndices[line[0].index];
        line[1].index = pointIndices[line[1].index];
        allLines.push(line);
      }
      const lineIndices = Array.from({ length: allLines.length - lineStartIdx }, (_, i) => lineStartIdx + i);
      return { pointIndices, lineIndices };
    };

    const outerArcResult = createArc(rx, ry, startAngle, endAngle);
    const { pointIndices: outerIndices } = addPathToElement(
      outerArcResult.points,
      outerArcResult.lines,
    );

    const hasHole = ratio > epsilon && ratio < 1 - epsilon;

    if (hasHole) {
      const rxInner = rx * (1 - ratio);
      const ryInner = ry * (1 - ratio);
      const innerArcResult = createArc(rxInner, ryInner, endAngle, startAngle);
      
      if (innerArcResult.points.length > 0) {
        const { pointIndices: innerIndices, lineIndices: innerLineIndices } = addPathToElement(
          innerArcResult.points,
          innerArcResult.lines,
        );

        if (isFullShape) {
          pathOverrides = [{
            lineIndices: innerLineIndices,
            background: element.background.length > 0 ? {
              ...element.background[0],
              content: {
                ...element.background[0].content,
                visible: false,
              },
            } : null,
            stroke: null,
          }];
        } else {
          const outerStartIdx = outerIndices[0];
          const outerEndIdx = outerIndices[outerIndices.length - 1];
          const innerStartIdx = innerIndices[0];
          const innerEndIdx = innerIndices[innerIndices.length - 1];

          allPoints[outerStartIdx].mirroring = BEZIER_MIRRORING.NONE;
          allPoints[outerEndIdx].mirroring = BEZIER_MIRRORING.NONE;
          allPoints[innerStartIdx].mirroring = BEZIER_MIRRORING.NONE;
          allPoints[innerEndIdx].mirroring = BEZIER_MIRRORING.NONE;

          allLines.push([{ index: outerEndIdx, handle: null }, { index: innerStartIdx, handle: null }]);
          allLines.push([{ index: innerEndIdx, handle: null }, { index: outerStartIdx, handle: null }]);
        }
      }
    } else if (!isFullShape) { // Pie slice (no hole)
      const centerPoint = {
        x: cx,
        y: cy,
        mirroring: BEZIER_MIRRORING.NONE,
      };
      const centerIndex = allPoints.length;
      allPoints.push(centerPoint);
      
      const outerStartIndex = outerIndices[0];
      const outerEndIndex = outerIndices[outerIndices.length - 1];
      
      allPoints[outerStartIndex].mirroring = BEZIER_MIRRORING.NONE;
      allPoints[outerEndIndex].mirroring = BEZIER_MIRRORING.NONE;

      allLines.push([{ index: outerEndIndex, handle: null }, { index: centerIndex, handle: null }]);
      allLines.push([{ index: centerIndex, handle: null }, { index: outerStartIndex, handle: null }]);
    }


    // Merge any overlapping points that may have been introduced
    const merged = mergeOverlappingPoints(
      allPoints,
      allLines,
    );

    const corrected = getCorrectedOrthodoxElementPoints(
      element, 
      merged.points, 
      merged.lines,
    );
    
    return { points: corrected.points, lines: corrected.lines, pathOverrides };
  }

  // Default case: rectangle/square
  const elWidth = typeof element.width === "number" ? element.width : ((element.width as any)?.value ?? 0);
  const elHeight = typeof element.height === "number" ? element.height : ((element.height as any)?.value ?? 0);

  const points: DucPoint[] = [
    {
      x: 0,
      y: 0,
    },
    {
      x: elWidth,
      y: 0,
    },
    {
      x: elWidth,
      y: elHeight,
    },
    {
      x: 0,
      y: elHeight,
    },
  ];

  // Create lines for rectangle: top, right, bottom, left
  const lines: DucLine[] = [
    [{ index: 0, handle: null }, { index: 1, handle: null }],
    [{ index: 1, handle: null }, { index: 2, handle: null }],
    [{ index: 2, handle: null }, { index: 3, handle: null }],
    [{ index: 3, handle: null }, { index: 0, handle: null }],
  ];

  return { points, lines };
};

export const getCorrectedOrthodoxElementPoints = (
  element: DucElement,
  points: readonly DucPoint[],
  lines: readonly DucLine[],
): { points: DucPoint[], lines: DucLine[] } => {
  const { minX, minY, maxX, maxY } = calculateShapeBounds(points, lines);

  const elWidth = typeof element.width === "number" ? element.width : ((element.width as any)?.value ?? 0);
  const elHeight = typeof element.height === "number" ? element.height : ((element.height as any)?.value ?? 0);

  const polygonCenter = {
    x: elWidth / 2,
    y: elHeight / 2,
  };

  const bboxCenter = {
    x: minX + (maxX - minX) / 2,
    y: minY + (maxY - minY) / 2,
  };

  const offset = {
    x: polygonCenter.x - bboxCenter.x,
    y: polygonCenter.y - bboxCenter.y,
  };

  const rotatedOffset = rotatePoint(offset, { x: 0, y: 0 }, element.angle);

  const correction = {
    x: offset.x - rotatedOffset.x,
    y: offset.y - rotatedOffset.y,
  };

  const correctedPoints = points.map((p) => {
    const px = typeof p.x === "number" ? p.x : ((p.x as any)?.value ?? 0);
    const py = typeof p.y === "number" ? p.y : ((p.y as any)?.value ?? 0);
    return {
      ...p,
      x: px + correction.x,
      y: py + correction.y,
    };
  });

  const correctedLines = lines.map((line) => ([
      {
        ...line[0],
        handle: line[0].handle
          ? {
            ...line[0].handle,
            x: (typeof line[0].handle.x === "number" ? line[0].handle.x : ((line[0].handle.x as any)?.value ?? 0)) + correction.x,
            y: (typeof line[0].handle.y === "number" ? line[0].handle.y : ((line[0].handle.y as any)?.value ?? 0)) + correction.y,
          }
          : null,
      },
      {
        ...line[1],
        handle: line[1].handle
          ? {
            ...line[1].handle,
            x: (typeof line[1].handle.x === "number" ? line[1].handle.x : ((line[1].handle.x as any)?.value ?? 0)) + correction.x,
            y: (typeof line[1].handle.y === "number" ? line[1].handle.y : ((line[1].handle.y as any)?.value ?? 0)) + correction.y,
          }
          : null,
      },
    ] as DucLine),
  );

  return { points: correctedPoints, lines: correctedLines };
};

export const getElementRelativePoints = (element: DucElement): { points: DucLinearElement["points"], lines: DucLinearElement["lines"], pathOverrides?: DucPath[] } => {
  if (isLinearElement(element)) {
    return { points: element.points, lines: element.lines };
  }
  if (isFreeDrawElement(element) || isArrowElement(element)) {
    return { points: element.points, lines: [] };
  }
  return getNonLinearElementRelativePoints(element);
};
