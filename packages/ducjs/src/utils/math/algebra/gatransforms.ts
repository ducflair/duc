import * as GA from "ducjs/utils/math/algebra/ga";
import type { GALine, GADirection, GAPoint, GATransform } from "ducjs/utils/math/algebra/ga";
import * as GADirections from "ducjs/utils/math/algebra/gadirections";

/**
 * TODO: docs
 */

export const rotation = (pivot: GAPoint, angle: number): GATransform =>
  GA.add(GA.mul(pivot, Math.sin(angle / 2)), Math.cos(angle / 2));

export const translation = (direction: GADirection): GATransform => [
  1,
  0,
  0,
  0,
  -(0.5 * direction[5]),
  0.5 * direction[4],
  0,
  0,
];

export const translationOrthogonal = (
  direction: GADirection,
  distance: number,
): GATransform => {
  const scale = 0.5 * distance;
  return [1, 0, 0, 0, scale * direction[4], scale * direction[5], 0, 0];
};

export const translationAlong = (line: GALine, distance: number): GATransform =>
  GA.add(GA.mul(GADirections.orthogonalToLine(line), 0.5 * distance), 1);

export const compose = (motor1: GATransform, motor2: GATransform): GATransform =>
  GA.mul(motor2, motor1);

export const apply = (
  motor: GATransform,
  nvector: GAPoint | GADirection | GALine,
): GAPoint | GADirection | GALine =>
  GA.normalized(GA.mul(GA.mul(motor, nvector), GA.reverse(motor)));
