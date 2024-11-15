import { lineAngle } from "../../utils/geometry/geometry";
import type { Vector } from "../../utils/geometry/shape";
import {
  getCenterForBounds,
  PointInTriangle,
  rotatePoint,
  scalePointFromOrigin,
} from "../math";
import { Point } from "../types";
import type { Bounds } from "./bounds";
import type { DucBindableElement } from "./types";

/**
 * Defines the possible headings using the new Point interface.
 */
export type Heading =
  | { x: 1; y: 0 }
  | { x: 0; y: 1 }
  | { x: -1; y: 0 }
  | { x: 0; y: -1 };

export const HEADING_RIGHT: Heading = { x: 1, y: 0 };
export const HEADING_DOWN: Heading = { x: 0, y: 1 };
export const HEADING_LEFT: Heading = { x: -1, y: 0 };
export const HEADING_UP: Heading = { x: 0, y: -1 };

/**
 * Determines the heading direction for a diamond shape based on two points.
 */
export const headingForDiamond = (a: Point, b: Point): Heading => {
  const angle = lineAngle([a, b]);
  if (angle >= 315 || angle < 45) {
    return HEADING_UP;
  } else if (angle >= 45 && angle < 135) {
    return HEADING_RIGHT;
  } else if (angle >= 135 && angle < 225) {
    return HEADING_DOWN;
  }
  return HEADING_LEFT;
};

/**
 * Converts a vector to a heading direction.
 */
export const vectorToHeading = (vec: Vector): Heading => {
  const {x, y} = vec;
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  if (x > absY) {
    return HEADING_RIGHT;
  } else if (x <= -absY) {
    return HEADING_LEFT;
  } else if (y > absX) {
    return HEADING_DOWN;
  }
  return HEADING_UP;
};

/**
 * Compares two headings for equality.
 */
export const compareHeading = (a: Heading, b: Heading): boolean =>
  a.x === b.x && a.y === b.y;

// Gets the heading for the point by creating a bounding box around the rotated
// close fitting bounding box, then creating 4 search cones around the center of
// the external bbox.
export const headingForPointFromElement = (
  element: Readonly<DucBindableElement>,
  aabb: Readonly<Bounds>,
  point: Readonly<Point>,
): Heading => {
  const SEARCH_CONE_MULTIPLIER = 2;

  const midPoint = getCenterForBounds(aabb);

  if (element.type === "diamond") {
    if (point.x < element.x) {
      return HEADING_LEFT;
    } else if (point.y < element.y) {
      return HEADING_UP;
    } else if (point.x > element.x + element.width) {
      return HEADING_RIGHT;
    } else if (point.y > element.y + element.height) {
      return HEADING_DOWN;
    }

    const top = rotatePoint(
      scalePointFromOrigin(
        { x: element.x + element.width / 2, y: element.y },
        midPoint,
        SEARCH_CONE_MULTIPLIER,
      ),
      midPoint,
      element.angle,
    );
    const right = rotatePoint(
      scalePointFromOrigin(
        { x: element.x + element.width, y: element.y + element.height / 2 },
        midPoint,
        SEARCH_CONE_MULTIPLIER,
      ),
      midPoint,
      element.angle,
    );
    const bottom = rotatePoint(
      scalePointFromOrigin(
        { x: element.x + element.width / 2, y: element.y + element.height },
        midPoint,
        SEARCH_CONE_MULTIPLIER,
      ),
      midPoint,
      element.angle,
    );
    const left = rotatePoint(
      scalePointFromOrigin(
        { x: element.x, y: element.y + element.height / 2 },
        midPoint,
        SEARCH_CONE_MULTIPLIER,
      ),
      midPoint,
      element.angle,
    );

    if (PointInTriangle(point, top, right, midPoint)) {
      return headingForDiamond(top, right);
    } else if (PointInTriangle(point, right, bottom, midPoint)) {
      return headingForDiamond(right, bottom);
    } else if (PointInTriangle(point, bottom, left, midPoint)) {
      return headingForDiamond(bottom, left);
    }

    return headingForDiamond(left, top);
  }

  const topLeft = scalePointFromOrigin(
    { x: aabb[0], y: aabb[1] },
    midPoint,
    SEARCH_CONE_MULTIPLIER,
  );
  const topRight = scalePointFromOrigin(
    { x: aabb[2], y: aabb[1] },
    midPoint,
    SEARCH_CONE_MULTIPLIER,
  );
  const bottomLeft = scalePointFromOrigin(
    { x: aabb[0], y: aabb[3] },
    midPoint,
    SEARCH_CONE_MULTIPLIER,
  );
  const bottomRight = scalePointFromOrigin(
    { x: aabb[2], y: aabb[3] },
    midPoint,
    SEARCH_CONE_MULTIPLIER,
  );

  return PointInTriangle(point, topLeft, topRight, midPoint)
    ? HEADING_UP
    : PointInTriangle(point, topRight, bottomRight, midPoint)
    ? HEADING_RIGHT
    : PointInTriangle(point, bottomRight, bottomLeft, midPoint)
    ? HEADING_DOWN
    : HEADING_LEFT;
};
