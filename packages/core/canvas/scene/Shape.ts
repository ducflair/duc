import type { Drawable, Options } from "roughjs/bin/core";
import type { RoughGenerator } from "roughjs/bin/generator";
import { getDiamondPoints, getArrowheadPoints } from "../element";
import type { ElementShapes } from "./types";
import type {
  DucElement,
  NonDeletedDucElement,
  DucSelectionElement,
  DucLinearElement,
  Arrowhead,
  FillStyle,
} from "../element/types";
import { isPathALoop, getCornerRadius, distanceSq2d } from "../math";
import { generateFreeDrawShape } from "../renderer/renderElement";
import { isTransparent, assertNever, TuplePoint, getFillStyleToString } from "../utils";
import { simplify } from "points-on-curve";
import { FILL_STYLE, STROKE_STYLE, ROUGHNESS, toolNsBackgroundSet, toolsNsStrokeSet } from "../constants";
import {
  isElbowArrow,
  isEmbeddableElement,
  isIframeElement,
  isIframeLikeElement,
  isLinearElement,
} from "../element/typeChecks";
import { canChangeRoundness } from "./comparisons";
import type { EmbedsValidationStatus, Point } from "../types";
import { renderStaticLinearPath } from "../element/linearElementEditor";

const getDashArrayDashed = (strokeWidth: number) => [8, 8 + strokeWidth];

const getDashArrayDotted = (strokeWidth: number) => [1.5, 6 + strokeWidth];

function adjustRoughness(element: DucElement): number {
  const roughness = element.roughness;

  const maxSize = Math.max(element.width, element.height);
  const minSize = Math.min(element.width, element.height);

  // don't reduce roughness if
  if (
    // both sides relatively big
    (minSize >= 20 && maxSize >= 50) ||
    // is round & both sides above 15px
    (minSize >= 15 &&
      !!element.roundness &&
      canChangeRoundness(element.type)) ||
    // relatively long linear element
    (isLinearElement(element) && maxSize >= 50)
  ) {
    return roughness;
  }

  return Math.min(roughness / (maxSize < 10 ? 3 : 2), 2.5);
}


export const generateRoughOptions = (
  element: DucElement,
  continuousPath = false,
): Options => {

  const options: Options = {
    seed: element.seed,
    strokeLineDash:
      element.strokeStyle === STROKE_STYLE.dashed
        ? getDashArrayDashed(element.strokeWidth)
        : element.strokeStyle === STROKE_STYLE.dotted
        ? getDashArrayDotted(element.strokeWidth)
        : undefined,
    // for non-solid strokes, disable multiStroke because it tends to make
    // dashes/dots overlay each other
    disableMultiStroke: element.strokeStyle !== STROKE_STYLE.solid,
    // for non-solid strokes, increase the width a bit to make it visually
    // similar to solid strokes, because we're also disabling multiStroke
    strokeWidth: 
      element.strokeStyle !== STROKE_STYLE.solid
        ? element.strokeWidth + 0.5
        : element.strokeWidth,
    // when increasing strokeWidth, we must explicitly set fillWeight and
    // hachureGap because if not specified, roughjs uses strokeWidth to
    // calculate them (and we don't want the fills to be modified)
    fillWeight: element.strokeWidth / 2,
    hachureGap: element.strokeWidth * 4,
    roughness: adjustRoughness(element),
    stroke: element.isStrokeDisabled ? "transparent" : element.strokeColor,

    preserveVertices:
      continuousPath || element.roughness < ROUGHNESS.cartoonist,
  };

  switch (element.type) {
    case "rectangle":
    case "iframe":
    case "embeddable":
    case "diamond":
    case "ellipse": {
      options.fillStyle = getFillStyleToString(element.fillStyle);
      options.fill = element.isBackgroundDisabled ? "transparent" : 
        isTransparent(element.backgroundColor)
          ? undefined
          : element.backgroundColor;
      if (element.type === "ellipse") {
        options.curveFitting = 1;
      }
      return options;
    }
    case "line":
    case "freedraw": {
      if (isPathALoop(element.points)) {
        options.fillStyle = getFillStyleToString(element.fillStyle);
        options.fill = element.isBackgroundDisabled ? "transparent" : 
          element.backgroundColor === "transparent"
            ? undefined
            : element.backgroundColor;
      }
      return options;
    }
    case "arrow":
      return options;
    default: {
      throw new Error(`Unimplemented type ${element.type}`);
    }
  }
};

const modifyIframeLikeForRoughOptions = (
  element: NonDeletedDucElement,
  isExporting: boolean,
  embedsValidationStatus: EmbedsValidationStatus | null,
) => {
  if (
    isIframeLikeElement(element) &&
    (isExporting ||
      (isEmbeddableElement(element) &&
        embedsValidationStatus?.get(element.id) !== true)) &&
    isTransparent(element.backgroundColor) &&
    isTransparent(element.strokeColor)
  ) {
    return {
      ...element,
      roughness: 0,
      backgroundColor: "#d3d3d3",
      fillStyle: FILL_STYLE.solid,
    } as const;
  } else if (isIframeElement(element)) {
    return {
      ...element,
      strokeColor: isTransparent(element.strokeColor)
        ? "#000000"
        : element.strokeColor,
      backgroundColor: isTransparent(element.backgroundColor)
        ? "#f4f4f6"
        : element.backgroundColor,
    };
  }
  return element;
};

const getArrowheadShapes = (
  element: DucLinearElement,
  shape: Drawable[],
  position: "start" | "end",
  arrowhead: Arrowhead,
  generator: RoughGenerator,
  options: Options,
  canvasBackgroundColor: string,
) => {
  const arrowheadPoints = getArrowheadPoints(
    element,
    shape,
    position,
    arrowhead,
  );

  if (arrowheadPoints === null) {
    return [];
  }

  switch (arrowhead) {
    case "circle": {
      const [x, y, diameter] = arrowheadPoints;

      // always use solid stroke for arrowhead
      delete options.strokeLineDash;

      return [
        generator.circle(x, y, diameter, {
          ...options,
          fill: element.strokeColor,
          fillStyle: "solid",
          stroke: element.strokeColor,
          roughness: Math.min(0.5, options.roughness || 0),
        }),
      ];
    }
    case "triangle": {
      const [x, y, x2, y2, x3, y3] = arrowheadPoints;

      // always use solid stroke for arrowhead
      delete options.strokeLineDash;

      return [
        generator.polygon(
          [
            [x, y],
            [x2, y2],
            [x3, y3],
            [x, y],
          ],
          {
            ...options,
            fill: element.strokeColor,
            fillStyle: "solid",
            roughness: Math.min(1, options.roughness || 0),
          },
        ),
      ];
    }
    case "diamond": {
      const [x, y, x2, y2, x3, y3, x4, y4] = arrowheadPoints;

      // always use solid stroke for arrowhead
      delete options.strokeLineDash;

      return [
        generator.polygon(
          [
            [x, y],
            [x2, y2],
            [x3, y3],
            [x4, y4],
            [x, y],
          ],
          {
            ...options,
            fill: element.strokeColor,
            fillStyle: "solid",
            roughness: Math.min(1, options.roughness || 0),
          },
        ),
      ];
    }
    case "bar":
    case "arrow":
    default: {
      const [x2, y2, x3, y3, x4, y4] = arrowheadPoints;

      if (element.strokeStyle === STROKE_STYLE.dotted) {
        // for dotted arrows caps, reduce gap to make it more legible
        const dash = getDashArrayDotted(element.strokeWidth - 1);
        options.strokeLineDash = [dash[0], dash[1] - 1];
      } else {
        // for solid/dashed, keep solid arrow cap
        delete options.strokeLineDash;
      }
      options.roughness = Math.min(1, options.roughness || 0);
      return [
        generator.line(x3, y3, x2, y2, options),
        generator.line(x4, y4, x2, y2, options),
      ];
    }
  }
};

/**
 * Generates the roughjs shape for given element.
 *
 * Low-level. Use `ShapeCache.generateElementShape` instead.
 *
 * @private
 */
export const _generateElementShape = (
  element: Exclude<NonDeletedDucElement, DucSelectionElement>,
  generator: RoughGenerator,
  {
    isExporting,
    canvasBackgroundColor,
    embedsValidationStatus,
  }: {
    isExporting: boolean;
    canvasBackgroundColor: string;
    embedsValidationStatus: EmbedsValidationStatus | null;
  },
): Drawable | Drawable[] | null => {

  switch (element.type) {
    case "rectangle":
    case "iframe":
    case "embeddable": {
      let shape: ElementShapes[typeof element.type];
      // this is for rendering the stroke/bg of the embeddable, especially
      // when the src url is not set

      if (element.roundness) {
        const w = element.width;
        const h = element.height;
        const r = getCornerRadius(Math.min(w, h), element);
        shape = generator.path(
          `M ${r} 0 L ${w - r} 0 Q ${w} 0, ${w} ${r} L ${w} ${
            h - r
          } Q ${w} ${h}, ${w - r} ${h} L ${r} ${h} Q 0 ${h}, 0 ${
            h - r
          } L 0 ${r} Q 0 0, ${r} 0`,
          generateRoughOptions(
            modifyIframeLikeForRoughOptions(
              element,
              isExporting,
              embedsValidationStatus,
            ),
            true,
          ),
        );
      } else {
        shape = generator.rectangle(
          0,
          0,
          element.width,
          element.height,
          generateRoughOptions(
            modifyIframeLikeForRoughOptions(
              element,
              isExporting,
              embedsValidationStatus,
            ),
            false,
          ),
        );
      }
      return shape;
    }
    case "diamond": {
      let shape: ElementShapes[typeof element.type];

      const [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY] =
        getDiamondPoints(element);
      if (element.roundness) {
        const verticalRadius = getCornerRadius(Math.abs(topX - leftX), element);

        const horizontalRadius = getCornerRadius(
          Math.abs(rightY - topY),
          element,
        );

        shape = generator.path(
          `M ${topX + verticalRadius} ${topY + horizontalRadius} L ${
            rightX - verticalRadius
          } ${rightY - horizontalRadius}
            C ${rightX} ${rightY}, ${rightX} ${rightY}, ${
            rightX - verticalRadius
          } ${rightY + horizontalRadius}
            L ${bottomX + verticalRadius} ${bottomY - horizontalRadius}
            C ${bottomX} ${bottomY}, ${bottomX} ${bottomY}, ${
            bottomX - verticalRadius
          } ${bottomY - horizontalRadius}
            L ${leftX + verticalRadius} ${leftY + horizontalRadius}
            C ${leftX} ${leftY}, ${leftX} ${leftY}, ${leftX + verticalRadius} ${
            leftY - horizontalRadius
          }
            L ${topX - verticalRadius} ${topY + horizontalRadius}
            C ${topX} ${topY}, ${topX} ${topY}, ${topX + verticalRadius} ${
            topY + horizontalRadius
          }`,
          generateRoughOptions(element, true),
        );
      } else {
        shape = generator.polygon(
          [
            [topX, topY],
            [rightX, rightY],
            [bottomX, bottomY],
            [leftX, leftY],
          ],
          generateRoughOptions(element),
        );
      }
      return shape;
    }
    case "ellipse": {
      const shape: ElementShapes[typeof element.type] = generator.ellipse(
        element.width / 2,
        element.height / 2,
        element.width,
        element.height,
        generateRoughOptions(element),
      );
      return shape;
    }
    case "line": {
      return renderStaticLinearPath(element, generator);
    }
    case "arrow": {
      let shape: ElementShapes[typeof element.type];
      const options = generateRoughOptions(element);

      const points = element.points.length ? element.points : [{x: 0, y: 0}];

      // Convert Point objects to tuples for RoughJS
      const roughPoints = points.map((p) => [p.x, p.y] as [number, number]);

      if (isElbowArrow(element)) {
        shape = [
          generator.path(
            generateElbowArrowShape(points as Point[], 16),
            generateRoughOptions(element, true),
          ),
        ];
      } else if (!element.roundness) {
        if (options.fill) {
          shape = [generator.polygon(roughPoints, options)];
        } else {
          shape = [generator.linearPath(roughPoints, options)];
        }
      } else {
        shape = [generator.curve(roughPoints, options)];
      }
      
      // add lines only in arrow
      if (element.type === "arrow") {
        const { startArrowhead = null, endArrowhead = "arrow" } = element;

        if (startArrowhead !== null) {
          const shapes = getArrowheadShapes(
            element,
            shape,
            "start",
            startArrowhead,
            generator,
            options,
            canvasBackgroundColor,
          );
          shape.push(...shapes);
        }

        if (endArrowhead !== null) {
          if (endArrowhead === undefined) {
            // Hey, we have an old arrow here!
          }

          const shapes = getArrowheadShapes(
            element,
            shape,
            "end",
            endArrowhead,
            generator,
            options,
            canvasBackgroundColor,
          );
          shape.push(...shapes);
        }
      }
      return shape;
    }
    case "freedraw": {
      let shape: ElementShapes[typeof element.type];
      generateFreeDrawShape(element);

      if (isPathALoop(element.points)) {
        // generate rough polygon to fill freedraw shape
        const simplifiedPoints = simplify(element.points.map(({x, y}) => [x, y]) as TuplePoint[], 0.75);
        shape = generator.curve(simplifiedPoints.map(([x, y]) => [x, y]) as TuplePoint[], {
          ...generateRoughOptions(element),
          stroke: "none",
        });
      } else {
        shape = null;
      }
      return shape;
    }
    case "frame":
    case "magicframe":
    case "text":
    case "image": {
      const shape: ElementShapes[typeof element.type] = null;
      // we return (and cache) `null` to make sure we don't regenerate
      // `element.canvas` on rerenders
      return shape;
    }
    case "group": {
      return null;
    }
    default: {
      assertNever(
        element,
        `generateElementShape(): Unimplemented type ${(element as any)?.type}`,
      );
      return null;
    }
  }
};

const generateElbowArrowShape = (
  points: Point[],
  radius: number,
) => {
  const subpoints: Point[] = [];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const next = points[i + 1];
    const corner = Math.min(
      radius,
      Math.sqrt(distanceSq2d(points[i], next)) / 2,
      Math.sqrt(distanceSq2d(points[i], prev)) / 2,
    );

    if (prev.x < points[i].x && prev.y === points[i].y) {
      // LEFT
      subpoints.push({x: points[i].x - corner, y: points[i].y});
    } else if (prev.x === points[i].x && prev.y < points[i].y) {
      // UP
      subpoints.push({ x: points[i].x, y: points[i].y - corner });
    } else if (prev.x > points[i].x && prev.y === points[i].y) {
      // RIGHT
      subpoints.push({x: points[i].x + corner, y: points[i].y});
    } else {
      subpoints.push({ x: points[i].x, y: points[i].y + corner });
    }

    subpoints.push(points[i] as Point);

    if (next.x < points[i].x && next.y === points[i].y) {
      // LEFT
      subpoints.push({x: points[i].x - corner, y: points[i].y});
    } else if (next.x === points[i].x && next.y < points[i].y) {
      // UP
      subpoints.push({ x: points[i].x, y: points[i].y - corner });
    } else if (next.x > points[i].x && next.y === points[i].y) {
      // RIGHT
      subpoints.push({x: points[i].x + corner, y: points[i].y});
    } else {
      subpoints.push({ x: points[i].x, y: points[i].y + corner });
    }
  }

  const d = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < subpoints.length; i += 3) {
    d.push(`L ${subpoints[i].x} ${subpoints[i].y}`);
    d.push(
      `Q ${subpoints[i + 1].x} ${subpoints[i + 1].y}, ${
        subpoints[i + 2].x
      } ${subpoints[i + 2].y}`,
    );
  }
  d.push(`L ${points[points.length - 1].x} ${points[points.length - 1].y}`);

  return d.join(" ");
};