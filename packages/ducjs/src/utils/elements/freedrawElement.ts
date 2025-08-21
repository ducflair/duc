import { DucFreeDrawElement } from "ducjs/types/elements";
import { med } from "ducjs/utils/math";
import type { StrokeOptions } from "perfect-freehand";
import { getStroke } from "perfect-freehand";


// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"],
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1");
}

export function getFreeDrawSvgPath(element: DucFreeDrawElement) {
  // If input points are empty (should they ever be?) return a dot

  if(element.points.length === 0) {
    return "";
  }

  const inputPoints = element.simulatePressure
    ? element.points.map(({x, y}, i) => [x.scoped, y.scoped, element.pressures[i]])
    : element.points.map(({x, y}) => [x.scoped, y.scoped]);

  // Consider changing the options for simulated pressure vs real pressure
  const options: StrokeOptions = {
    size: element.size.scoped,
    simulatePressure: element.simulatePressure,
    thinning: element.thinning,
    smoothing: element.smoothing,
    streamline: element.streamline,
    easing: element.easing,
    start: element.start || undefined,
    end: element.end || undefined,
    last: !!element.lastCommittedPoint, // LastCommittedPoint is added on pointerup
  };
  return getSvgPathFromStroke(getStroke(inputPoints, options));
}
