import * as GA from "./ga";
import type { GALine, GADirection, GAPoint } from "./ga";

/**
 * A direction is stored as an array `[0, 0, 0, 0, y, x, 0, 0]` representing
 * vector `(x, y)`.
 */

export const fromDirection = (point: GAPoint): GAPoint => [
  0,
  0,
  0,
  0,
  point[4],
  point[5],
  0,
  0,
];

export const fromTo = (from: GAPoint, to: GAPoint): GADirection =>
  GA.inormalized([0, 0, 0, 0, to[4] - from[4], to[5] - from[5], 0, 0]);

export const directionOrthogonal = (direction: GADirection): GADirection =>
  GA.inormalized([0, 0, 0, 0, -direction[5], direction[4], 0, 0]);

export const orthogonalToLine = (line: GALine): GADirection => GA.mul(line, GA.I);
