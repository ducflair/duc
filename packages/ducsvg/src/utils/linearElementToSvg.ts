import {
  DucArrowElement,
  DucElement,
  DucLine,
  DucLinearElement,
  DucLinearLikeElement,
  DucPoint,
  ElementBackground,
  isArrowElement,
  RestoredDataState,
  Scope,
  SVG_NS,
} from "ducjs";
import { LINE_HEAD, STROKE_PLACEMENT } from "ducjs/flatbuffers/duc";
import { applyStyles, FrameRendering, PartialDucState } from "ducsvg/ducToSvg";

// This file will contain the new, robust SVG rendering logic for linear elements,
// ported from the Rust implementation.

interface Point {
  x: number;
  y: number;
}

/** Represents a segment of a parsed SVG path. */
interface PathSegment {
  type: string; // "M", "L", "C", "Q", "Z"
  values: number[];
}

/**
 * Normalizes a 2D vector.
 * @param v The vector to normalize.
 * @returns A normalized vector, or a zero vector if the input is zero.
 */
const getNormalized = (v: Point): Point => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-9) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
};

const lineIntersect = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const determinant = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(determinant) < 1e-9) {
    return null; // Parallel
  }

  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / determinant;
  return { x: p1.x + t * dx1, y: p1.y + t * dy1 };
}

/** Offsets a single line segment. */
const offsetLineSegment = (p1: Point, p2: Point, offset: number): [Point, Point] | null => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-9) {
    return null;
  }
  const perpX = (-dy / len) * offset;
  const perpY = (dx / len) * offset;
  return [
    { x: p1.x + perpX, y: p1.y + perpY },
    { x: p2.x + perpX, y: p2.y + perpY },
  ];
};

/**
 * A robust approximation for offsetting a cubic Bezier segment.
 * This function is simplified and may not be perfect for all cases, but is more stable.
 */
const calculateSingleOffsetCubic = (p0: Point, p1: Point, p2: Point, p3: Point, offset: number): [Point, Point, Point, Point] | null => {
  // Determine tangents at endpoints
  const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
  const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v3 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const startTangent = getNormalized(v1.x || v1.y ? v1 : (v2.x || v2.y ? v2 : v3));
  const endTangent = getNormalized(v3.x || v3.y ? v3 : (v2.x || v2.y ? v2 : v1));

  if ((!startTangent.x && !startTangent.y)) {
    return null;
  }

  const startNormal = { x: -startTangent.y * offset, y: startTangent.x * offset };
  const endNormal = { x: -endTangent.y * offset, y: endTangent.x * offset };

  const offsetP0 = { x: p0.x + startNormal.x, y: p0.y + startNormal.y };
  const offsetP3 = { x: p3.x + endNormal.x, y: p3.y + endNormal.y };

  const l1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const l2 = Math.sqrt(v3.x * v3.x + v3.y * v3.y);

  const offsetP1 = { x: offsetP0.x + startTangent.x * l1, y: offsetP0.y + startTangent.y * l1 };
  const offsetP2 = { x: offsetP3.x - endTangent.x * l2, y: offsetP3.y - endTangent.y * l2 };

  if (!isFinite(offsetP1.x) || !isFinite(offsetP1.y) || !isFinite(offsetP2.x) || !isFinite(offsetP2.y)) {
    return null;
  }

  return [offsetP0, offsetP1, offsetP2, offsetP3];
}

/** Recursively offsets a cubic Bezier by splitting it. */
const offsetCubicBezierRecursively = (p0: Point, p1: Point, p2: Point, p3: Point, offset: number, depth: number): PathSegment[] => {
  const curve = [p0, p1, p2, p3];

  const v_start = { x: p1.x - p0.x, y: p1.y - p0.y };
  const v_end = { x: p3.x - p2.x, y: p3.y - p2.y };
  const n_start = getNormalized(v_start);
  const n_end = getNormalized(v_end);
  const dot = n_start.x * n_end.x + n_start.y * n_end.y;

  if (dot > 0.99 || depth <= 0) {
    const offsetPoints = calculateSingleOffsetCubic(p0, p1, p2, p3, offset);
    if (offsetPoints) {
      return [{ type: "C", values: [offsetPoints[1].x, offsetPoints[1].y, offsetPoints[2].x, offsetPoints[2].y, offsetPoints[3].x, offsetPoints[3].y] }];
    }
    return [];
  }

  // Subdivide the curve
  const t = 0.5;
  const mt = 1 - t;
  const p01 = { x: mt * p0.x + t * p1.x, y: mt * p0.y + t * p1.y };
  const p12 = { x: mt * p1.x + t * p2.x, y: mt * p1.y + t * p2.y };
  const p23 = { x: mt * p2.x + t * p3.x, y: mt * p2.y + t * p3.y };
  const p012 = { x: mt * p01.x + t * p12.x, y: mt * p01.y + t * p12.y };
  const p123 = { x: mt * p12.x + t * p23.x, y: mt * p12.y + t * p23.y };
  const p_split = { x: mt * p012.x + t * p123.x, y: mt * p012.y + t * p123.y };

  const path1 = offsetCubicBezierRecursively(p0, p01, p012, p_split, offset, depth - 1);
  const path2 = offsetCubicBezierRecursively(p_split, p123, p23, p3, offset, depth - 1);

  return [...path1, ...path2];
}

const getTangent = (
  element: DucLinearElement | DucArrowElement,
  whichEnd: "start" | "end",
): {
  point: DucPoint;
  tangent: {
    angle: number;
    vector: { x: number; y: number };
  };
} => {
  const { points, lines } = element;

  let p0: DucPoint, p1: DucPoint;
  let angle: number;

  if (whichEnd === "start") {
    const startPointIndex = 0;
    const endPoint = points[startPointIndex];
    const line = lines.find(l => l[0].index === startPointIndex || l[1].index === startPointIndex);

    if (!line) {
      // Fallback for malformed data
      p0 = points[0];
      p1 = points[1];
      angle = Math.atan2(p1.y.scoped - p0.y.scoped, p1.x.scoped - p0.x.scoped);
    } else {
      const isReversed = line[1].index === startPointIndex;
      const startPoint = points[line[0].index];
      const endPoint = points[line[1].index];
      const handle = isReversed ? line[1].handle : line[0].handle;

      p0 = startPoint;
      p1 = handle || endPoint;
      angle = Math.atan2(p1.y.scoped - p0.y.scoped, p1.x.scoped - p0.x.scoped);
      if (isReversed) angle += Math.PI;
    }

    const reverseAngle = angle + Math.PI;

    return {
      point: endPoint,
      tangent: {
        angle: reverseAngle,
        vector: { x: Math.cos(reverseAngle), y: Math.sin(reverseAngle) },
      },
    };

  } else { // end
    const endPointIndex = points.length - 1;
    const endPoint = points[endPointIndex];
    const line = lines.find(l => l[1].index === endPointIndex || l[0].index === endPointIndex);

    if (!line) {
      // Fallback for malformed data
      p0 = points[points.length - 2];
      p1 = points[points.length - 1];
    } else {
      const isReversed = line[0].index === endPointIndex;
      const startPoint = points[line[0].index];
      const endPoint = points[line[1].index];
      const handle = isReversed ? line[0].handle : line[1].handle;

      p0 = handle || startPoint;
      p1 = endPoint;
    }

    angle = Math.atan2(p1.y.scoped - p0.y.scoped, p1.x.scoped - p0.x.scoped);

    return {
      point: endPoint,
      tangent: {
        angle: angle,
        vector: { x: Math.cos(angle), y: Math.sin(angle) },
      },
    };
  }
};

const renderLineHead = (
  element: DucLinearElement | DucArrowElement,
  whichEnd: "start" | "end",
  offsetValue: number,
): SVGElement | null => {
  const binding = whichEnd === "start" ? element.startBinding : element.endBinding;
  if (!binding || !binding.head) {
    return null;
  }

  const { points } = element;
  if (points.length < 2) {
    return null;
  }

  const { tangent, point } = getTangent(element, whichEnd);

  const angle = (tangent.angle * 180) / Math.PI;

  const normal_x = -Math.sin(tangent.angle);
  const normal_y = Math.cos(tangent.angle);

  let offsetX = normal_x * offsetValue;
  let offsetY = normal_y * offsetValue;

  if (whichEnd === "start") {
    offsetX = -offsetX;
    offsetY = -offsetY;
  }

  const headGroup = document.createElementNS(SVG_NS, "g");
  headGroup.setAttribute("transform", `translate(${point.x.scoped + offsetX}, ${point.y.scoped + offsetY}) rotate(${angle})`);

  const stroke = element.stroke[0];
  const scale = stroke.width.scoped;

  let headShape: SVGElement;
  let isOutlined = false;

  const createPath = (d: string, strokeLinejoin?: "round") => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    if (strokeLinejoin) {
      path.setAttribute("stroke-linejoin", strokeLinejoin);
    }
    return path;
  };

  switch (binding.head.type) {
    case LINE_HEAD.ARROW:
    case LINE_HEAD.OPEN_ARROW:
      headShape = createPath(`M 0 0 L ${-3.5 * scale} ${1.5 * scale} M 0 0 L ${-3.5 * scale} ${-1.5 * scale}`);
      headShape.setAttribute("fill", "none");
      headShape.setAttribute("stroke-linecap", "round");
      break;

    case LINE_HEAD.BAR:
      headShape = createPath(`M 0 ${2 * scale} L 0 ${-2 * scale}`);
      break;

    case LINE_HEAD.CIRCLE_OUTLINED:
      isOutlined = true;
    // fall-through
    case LINE_HEAD.CIRCLE: {
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", `${-1.7 * scale}`);
      circle.setAttribute("cy", `0`);
      circle.setAttribute("r", `${1.5 * scale}`);
      headShape = circle;
      break;
    }

    case LINE_HEAD.TRIANGLE_OUTLINED:
      isOutlined = true;
    // fall-through
    case LINE_HEAD.TRIANGLE:
      headShape = createPath(`M 0 0 L ${-2.4 * scale} ${0.9 * scale} L ${-2.4 * scale} ${-0.9 * scale} Z`, "round");
      break;

    case LINE_HEAD.DIAMOND_OUTLINED:
      isOutlined = true;
    // fall-through
    case LINE_HEAD.DIAMOND:
      headShape = createPath(
        `M 0 0 L ${-1.5 * scale} ${1.5 * scale} L ${-3 * scale} 0 L ${-1.5 * scale} ${-1.5 * scale} Z`,
        "round",
      );
      break;

    case LINE_HEAD.CROSS:
      headShape = createPath(
        `M ${-2.5 * scale} ${-2.5 * scale} L ${2.5 * scale} ${2.5 * scale} M ${-2.5 * scale} ${2.5 * scale
        } L ${2.5 * scale} ${-2.5 * scale}`,
      );
      headShape.setAttribute("fill", "none");
      headShape.setAttribute("stroke-linecap", "round");
      break;

    case LINE_HEAD.REVERSED_ARROW:
      headShape = createPath(`M 0 0 L ${3.5 * scale} ${1.5 * scale} M 0 0 L ${3.5 * scale} ${-1.5 * scale}`);
      headShape.setAttribute("fill", "none");
      headShape.setAttribute("stroke-linecap", "round");
      break;

    case LINE_HEAD.REVERSED_TRIANGLE_OUTLINED:
      isOutlined = true;
    // fall-through
    case LINE_HEAD.REVERSED_TRIANGLE:
      headShape = createPath(`M 0 0 L ${2.4 * scale} ${0.9 * scale} L ${2.4 * scale} ${-0.9 * scale} Z`, "round");
      break;

    case LINE_HEAD.CONE:
      headShape = createPath(`M 0 ${3 * scale} L ${-6 * scale} 0 L 0 ${-3 * scale} L 0 ${3 * scale}`);
      headShape.setAttribute("fill", "none");
      break;

    case LINE_HEAD.HALF_CONE:
      headShape = createPath(`M 0 0 L 0 ${-3 * scale} L ${-6 * scale} 0 Z`);
      headShape.setAttribute("fill", "none");
      break;

    default:
      return null;
  }

  const background = isOutlined ? [] : element.background;
  applyStyles(headShape, element.stroke, background);

  if (isOutlined) {
    headShape.setAttribute("fill", "var(--canvas-background)");
  }

  headGroup.appendChild(headShape);
  return headGroup;
};

/**
 * Adds a segment to a Bezier path string.
 * This version promotes quadratic curves to cubic to match the Rust renderer's logic.
 */
const addSegmentToPathString = (
  startPoint: DucPoint,
  endPoint: DucPoint,
  startHandle: DucPoint | null,
  endHandle: DucPoint | null,
): string => {
  if (startHandle && endHandle) {
    // Cubic Bezier
    return `C ${startHandle.x.scoped} ${startHandle.y.scoped} ${endHandle.x.scoped} ${endHandle.y.scoped} ${endPoint.x.scoped} ${endPoint.y.scoped}`;
  } else if (startHandle || endHandle) {
    // Quadratic Bezier, promoted to Cubic for consistency with Vello renderer
    const h = startHandle || endHandle;
    if (!h) {
      // Should not happen, but as a fallback
      return `L ${endPoint.x.scoped} ${endPoint.y.scoped}`;
    }

    const p0 = { x: startPoint.x.scoped, y: startPoint.y.scoped };
    const p3 = { x: endPoint.x.scoped, y: endPoint.y.scoped };
    const c = { x: h.x.scoped, y: h.y.scoped };

    // A quadratic with control point `c` can be represented as a cubic
    // with control points `p0 + 2/3 * (c - p0)` and `p3 + 2/3 * (c - p3)`.
    const cp1 = {
      x: p0.x + (2 / 3) * (c.x - p0.x),
      y: p0.y + (2 / 3) * (c.y - p0.y),
    };
    const cp2 = {
      x: p3.x + (2 / 3) * (c.x - p3.x),
      y: p3.y + (2 / 3) * (c.y - p3.y),
    };

    if (!isFinite(cp1.x) || !isFinite(cp1.y) || !isFinite(cp2.x) || !isFinite(cp2.y)) {
      return `L ${p3.x} ${p3.y}`;
    }

    return `C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p3.x} ${p3.y}`;
  } else {
    // Straight line
    return `L ${endPoint.x.scoped} ${endPoint.y.scoped}`;
  }
};

/**
 * Creates the SVG path data string for all strokes of a linear element.
 * It chains continuous segments together into subpaths.
 */
const createStrokePathData = (element: DucLinearLikeElement): { path: string, subPathPointIndices: number[][] } => {
  const { points, lines } = element;
  if (points.length === 0 || lines.length === 0) {
    return { path: "", subPathPointIndices: [] };
  }

  let path = "";
  const subPathPointIndices: number[][] = [];
  const visited = new Array(lines.length).fill(false);

  for (let i = 0; i < lines.length; i++) {
    if (visited[i]) {
      continue;
    }

    const currentSubPathIndices: number[] = [];
    let currentLineIndex = i;
    const firstLineInSubPathIndex = i;
    let subpathStarted = false;

    while (currentLineIndex !== -1) {
      const line = lines[currentLineIndex];
      visited[currentLineIndex] = true;

      const p1Index = line[0].index;
      const p2Index = line[1].index;

      if (
        p1Index < 0 || p2Index < 0 ||
        p1Index >= points.length || p2Index >= points.length
      ) {
        break; // Invalid index
      }
      const startPoint = points[p1Index];
      const endPoint = points[p2Index];

      if (!subpathStarted) {
        path += `M ${startPoint.x.scoped} ${startPoint.y.scoped} `;
        currentSubPathIndices.push(p1Index);
        subpathStarted = true;
      }

      const startHandle = line[0].handle || null;
      const endHandle = line[1].handle || null;
      path += addSegmentToPathString(startPoint, endPoint, startHandle, endHandle) + " ";
      currentSubPathIndices.push(p2Index);

      // Find next continuous line
      let nextLineIndex = -1;
      for (let j = 0; j < lines.length; j++) {
        if (!visited[j] && lines[j][0].index === p2Index) {
          nextLineIndex = j;
          break;
        }
      }
      currentLineIndex = nextLineIndex;
    }

    // Check for closure
    const firstLine = lines[firstLineInSubPathIndex];
    const lastPointIndex = currentSubPathIndices[currentSubPathIndices.length - 1];
    if (lastPointIndex === firstLine[0].index) {
      path += "Z ";
    }
    subPathPointIndices.push(currentSubPathIndices);
  }

  return { path, subPathPointIndices };
};

/**
 * Finds all minimal closed loops (faces) in the linear element's graph for filling.
 * This is a TypeScript port of the logic from the Rust renderer.
 */
const getFillPaths = (
  element: DucLinearLikeElement,
): { path: string, lineIndices: number[] }[] => {
  const { points, lines } = element;
  if (points.length === 0 || lines.length === 0) {
    return [];
  }

  const adj = new Map<number, { neighbor: number, line: DucLine, lineIndex: number }[]>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const start = line[0].index;
    const end = line[1].index;
    if (start >= 0 && end >= 0 && start < points.length && end < points.length) {
      if (!adj.has(start)) adj.set(start, []);
      if (!adj.has(end)) adj.set(end, []);
      adj.get(start)!.push({ neighbor: end, line, lineIndex: i });
      adj.get(end)!.push({ neighbor: start, line, lineIndex: i });
    }
  }

  const foundCycles = new Set<string>();
  const resultPaths: { path: string; lineIndices: number[] }[] = [];

  for (const startNode of adj.keys()) {
    const stack: { node: number, path: number[], lines: number[] }[] = [
      { node: startNode, path: [startNode], lines: [] },
    ];

    while (stack.length > 0) {
      const { node, path, lines: usedLineIndices } = stack.pop()!;

      if (path.length > points.length) continue;

      const neighbors = adj.get(node) || [];
      for (const { neighbor, line, lineIndex } of neighbors) {
        if (path.length >= 2 && neighbor === path[path.length - 2]) {
          continue;
        }

        if (neighbor === startNode && path.length >= 2) {
          const cycleNodes = [...path];
          const cycleLineIndices = [...usedLineIndices, lineIndex];

          let isMinimal = true;
          if (cycleNodes.length > 2) {
            for (let i = 0; i < cycleNodes.length; i++) {
              for (let j = i + 1; j < cycleNodes.length; j++) {
                const u = cycleNodes[i];
                const v = cycleNodes[j];
                const isAdjacentInCycle = (j === i + 1) || (i === 0 && j === cycleNodes.length - 1);
                if (!isAdjacentInCycle && (adj.get(u)?.some(n => n.neighbor === v))) {
                  isMinimal = false;
                  break;
                }
              }
              if (!isMinimal) break;
            }
          }

          if (isMinimal) {
            const canonicalCycle = [...cycleNodes].sort((a, b) => a - b).join(',');
            if (!foundCycles.has(canonicalCycle)) {
              foundCycles.add(canonicalCycle);

              let svgPath = `M ${points[cycleNodes[0]].x.scoped} ${points[cycleNodes[0]].y.scoped} `;
              for (let i = 0; i < cycleNodes.length; i++) {
                const p1Index = cycleNodes[i];
                const p2Index = cycleNodes[(i + 1) % cycleNodes.length];
                const connectingEdge = adj.get(p1Index)?.find(e => e.neighbor === p2Index);
                if (connectingEdge) {
                  const p1 = points[p1Index];
                  const p2 = points[p2Index];
                  const isReversed = connectingEdge.line[0].index !== p1Index;
                  const startHandle = isReversed ? connectingEdge.line[1].handle : connectingEdge.line[0].handle;
                  const endHandle = isReversed ? connectingEdge.line[0].handle : connectingEdge.line[1].handle;
                  svgPath += addSegmentToPathString(p1, p2, startHandle, endHandle) + " ";
                }
              }
              svgPath += "Z";
              resultPaths.push({ path: svgPath, lineIndices: cycleLineIndices });
            }
          }
        } else if (!path.includes(neighbor)) {
          stack.push({
            node: neighbor,
            path: [...path, neighbor],
            lines: [...usedLineIndices, lineIndex],
          });
        }
      }
    }
  }

  return resultPaths;
};

/** Calculates the signed area of a path. */
const getPathArea = (segments: PathSegment[], startPoint: Point) => {
  let area = 0;
  let currentPoint = startPoint;

  for (const seg of segments) {
    let p1: Point, p2: Point, p3: Point, p4: Point;
    switch (seg.type) {
      case 'L':
        p1 = currentPoint;
        p2 = { x: seg.values[0], y: seg.values[1] };
        area += (p1.x * p2.y - p2.x * p1.y);
        currentPoint = p2;
        break;
      case 'C':
        p1 = currentPoint;
        p2 = { x: seg.values[0], y: seg.values[1] };
        p3 = { x: seg.values[2], y: seg.values[3] };
        p4 = { x: seg.values[4], y: seg.values[5] };
        area += (p1.x * p2.y - p2.x * p1.y) + (p2.x * p3.y - p3.x * p2.y) + (p3.x * p4.y - p4.x * p3.y);
        currentPoint = p4;
        break;
      case 'Z':
        p1 = currentPoint;
        p2 = startPoint;
        area += (p1.x * p2.y - p2.x * p1.y);
        currentPoint = startPoint;
        break;
    }
  }
  return area / 2;
}

/** Offsets an entire path made of multiple segments. */
const offsetPath = (path: PathSegment[], offset: number): PathSegment[] => {
  if (Math.abs(offset) < 1e-9) {
    return path;
  }

  const result: PathSegment[] = [];
  if (path.length === 0) {
    return result;
  }

  const move_to = path.find(p => p.type === 'M');

  let currentPoint: Point = { x: move_to?.values[0] || 0, y: move_to?.values[1] || 0 };

  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    switch (seg.type) {
      case "M":
        currentPoint = { x: seg.values[0], y: seg.values[1] };
        break;
      case "L": {
        const p2 = { x: seg.values[0], y: seg.values[1] };
        const offsetLine = offsetLineSegment(currentPoint, p2, offset);
        if (offsetLine) {
          if (result.length === 0 || result[result.length - 1].type === 'Z') {
            result.push({ type: "M", values: [offsetLine[0].x, offsetLine[0].y] });
          }
          result.push({ type: "L", values: [offsetLine[1].x, offsetLine[1].y] });
        }
        currentPoint = p2;
        break;
      }
      case "C": {
        const p2 = { x: seg.values[0], y: seg.values[1] };
        const p3 = { x: seg.values[2], y: seg.values[3] };
        const p4 = { x: seg.values[4], y: seg.values[5] };
        const offsetCurve = offsetCubicBezierRecursively(currentPoint, p2, p3, p4, offset, 4);
        if (offsetCurve.length > 0) {
          if (result.length === 0 || result[result.length - 1].type === 'Z') {
            const firstSeg = offsetCurve[0];
            const p1 = calculateSingleOffsetCubic(currentPoint, p2, p3, p4, offset)?.[0];
            if (p1) {
              result.push({ type: "M", values: [p1.x, p1.y] });
            }
          }
          result.push(...offsetCurve);
        }
        currentPoint = p4;
        break;
      }
      case "Z":
        result.push({ type: "Z", values: [] });
        break;
    }
  }

  // TODO: Handle joins between segments properly
  return result;
};

const pathDataToString = (path: PathSegment[]) => {
  return path.map(seg => `${seg.type} ${seg.values.join(" ")}`).join(" ");
}

/** Parses an SVG path data string into a structured array of segments. */
const stringToPathData = (d: string): PathSegment[] => {
  const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  const path: PathSegment[] = [];

  for (const command of commands) {
    const type = command[0];
    const values = command.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(v => !isNaN(v));
    path.push({ type, values });
  }

  return path;
};

export const renderLinearElementToSvg = (
  element: DucLinearLikeElement,
  elementsMap: Map<string, DucElement>,
  ducState: PartialDucState,
  files: RestoredDataState["files"],
  defs: SVGDefsElement,
  currentScope: Scope,
  offsetX: number,
  offsetY: number,
): { element: SVGElement; mask?: SVGElement } => {
  const group = document.createElementNS(SVG_NS, "g");

  // --- 1. Render Fills ---
  const fillPaths = getFillPaths(element);
  const pathOverrides = element.pathOverrides || [];
  const primaryBackground = element.background[0];

  if (primaryBackground && primaryBackground.content.visible) {
    const overrideMap = new Map(pathOverrides.map(o => [JSON.stringify([...o.lineIndices].sort()), o.background]));
    const fillsToRender = new Map<string, string[]>(); // color -> path data strings
    let holePaths: string[] = [];

    for (const fill of fillPaths) {
      const key = JSON.stringify([...fill.lineIndices].sort());
      const background = overrideMap.get(key) || primaryBackground;

      if (!background || !background.content.visible) {
        holePaths.push(fill.path);
      } else {
        const color = background.content.src;
        if (!fillsToRender.has(color)) {
          fillsToRender.set(color, []);
        }
        fillsToRender.get(color)!.push(fill.path);
      }
    }

    fillsToRender.forEach((paths, color) => {
      const fillPathEl = document.createElementNS(SVG_NS, "path");
      const d = paths.join(" ") + " " + holePaths.join(" ");
      fillPathEl.setAttribute("d", d);

      const tempBackground: ElementBackground = {
        ...primaryBackground,
        content: { ...primaryBackground.content, src: color },
      };
      applyStyles(fillPathEl, [], [tempBackground]);
      fillPathEl.setAttribute("fill-rule", "evenodd");
      group.appendChild(fillPathEl);
    });
  }

  // --- 2. Render Strokes ---
  const { path: strokePathDataString } = createStrokePathData(element);
  const subPaths = stringToPathData(strokePathDataString);

  element.stroke.forEach(stroke => {
    if (!stroke.content.visible) return;

    let finalPathData = strokePathDataString;

    if (stroke.placement !== STROKE_PLACEMENT.CENTER) {
      const subPathSegments = stringToPathData(strokePathDataString);
      const moveTos = subPathSegments.filter(s => s.type.toUpperCase() === 'M');

      const pathArea = getPathArea(subPathSegments, moveTos.length > 0 ? { x: moveTos[0].values[0], y: moveTos[0].values[1] } : { x: 0, y: 0 });
      let offset = stroke.width.scoped / 2;

      if (
        (stroke.placement === STROKE_PLACEMENT.INSIDE && pathArea < 0) ||
        (stroke.placement === STROKE_PLACEMENT.OUTSIDE && pathArea > 0)
      ) {
        offset = -offset;
      }
      const offsetSegments = offsetPath(subPathSegments, offset);
      finalPathData = pathDataToString(offsetSegments);
    }

    const strokePathEl = document.createElementNS(SVG_NS, "path");
    strokePathEl.setAttribute("d", finalPathData);
    strokePathEl.setAttribute("fill", "none");
    applyStyles(strokePathEl, [stroke], []);
    group.appendChild(strokePathEl);
  });


  // --- 3. Render Line Heads ---
  if (isArrowElement(element)) {
    const firstStroke = element.stroke[0];
    if (firstStroke && firstStroke.content.visible) {

      const pathArea = getPathArea(subPaths, { x: element.points[0].x.scoped, y: element.points[0].y.scoped });
      let offsetValue = 0;
      if (firstStroke.placement === STROKE_PLACEMENT.OUTSIDE) {
        offsetValue = pathArea > 0 ? -firstStroke.width.scoped / 2 : firstStroke.width.scoped / 2;
      } else if (firstStroke.placement === STROKE_PLACEMENT.INSIDE) {
        offsetValue = pathArea > 0 ? firstStroke.width.scoped / 2 : -firstStroke.width.scoped / 2;
      }

      const startHead = renderLineHead(element, "start", offsetValue);
      const endHead = renderLineHead(element, "end", offsetValue);

      if (startHead) {
        group.appendChild(startHead);
      }
      if (endHead) {
        group.appendChild(endHead);
      }
    }
  }

  return { element: group };
}; 