import * as GA from "ducjs/utils/math/algebra/ga";
import * as GALines from "ducjs/utils/math/algebra/galines";
import type { GAPoint, GALine } from "ducjs/utils/math/algebra/ga";
import { join } from "ducjs/utils/math/algebra/ga";

export const fromPoint = ([x, y]: readonly [number, number]): GAPoint => [
  0,
  0,
  0,
  0,
  y,
  x,
  1,
  0,
];

export const toTuple = (point: GAPoint): [number, number] => [point[5], point[4]];

export const abs = (point: GAPoint): GAPoint => [
  0,
  0,
  0,
  0,
  Math.abs(point[4]),
  Math.abs(point[5]),
  1,
  0,
];

export const intersect = (line1: GALine, line2: GALine): GAPoint =>
  GA.normalized(GA.meet(line1, line2));

// Projects `point` onto the `line`.
// The returned point is the closest point on the `line` to the `point`.
export const project = (point: GAPoint, line: GALine): GAPoint =>
  intersect(GALines.orthogonal(line, point), line);

export const fromDistance = (point1: GAPoint, point2: GAPoint): number =>
  GA.norm(join(point1, point2));

export const distanceToLine = (point: GAPoint, line: GALine): number =>
  GA.joinScalar(point, line);
