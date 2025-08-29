import { MAX_ZOOM, MIN_ZOOM } from "./constants";
import { clamp, round } from "./math";
import type { NormalizedZoomValue, ScopedValue } from "../types";
import { DucElement, FixedPoint } from "../types/elements";

export const getNormalizedZoom = (zoom: number): NormalizedZoomValue => {
  return clamp(zoom, MIN_ZOOM, MAX_ZOOM) as NormalizedZoomValue;
};

export const getNormalizedGridSize = (gridStep: number) => {
  return clamp(Math.round(gridStep), 1, 100);
};

export const getNormalizedGridStep = (gridStep: number) => {
  return clamp(Math.round(gridStep), 1, 100);
};

export const normalizeFixedPoint = <T extends FixedPoint | null>(
  fixedPoint: T,
): T extends null ? null : FixedPoint => {
  // Do not allow a precise 0.5 for fixed point ratio
  // to avoid jumping arrow heading due to floating point imprecision
  if (fixedPoint && (fixedPoint.x === 0.5 || fixedPoint.y === 0.5)) {
    return {
      x: fixedPoint.x === 0.5 ? 0.5001 : fixedPoint.x,
      y: fixedPoint.y === 0.5 ? 0.5001 : fixedPoint.y,
    } as T extends null ? null : FixedPoint;
  }
  return fixedPoint as any as T extends null ? null : FixedPoint;
};


export const getNormalizedDimensions = (
  element: Pick<DucElement, "width" | "height" | "x" | "y">,
): {
  width: ScopedValue;
  height: ScopedValue;
  x: ScopedValue;
  y: ScopedValue;
} => {
  const ret = {
    width: element.width.scoped,
    height: element.height.scoped,
    x: element.x.scoped,
    y: element.y.scoped,
  };

  if (element.width.scoped < 0) {
    const nextWidth = Math.abs(element.width.scoped);
    ret.width = nextWidth as ScopedValue;
    ret.x = element.x.scoped - nextWidth as ScopedValue;
  }

  if (element.height.scoped < 0) {
    const nextHeight = Math.abs(element.height.scoped);
    ret.height = nextHeight as ScopedValue;
    ret.y = element.y.scoped - nextHeight as ScopedValue;
  }

  return ret;
};

export const normalizeEOL = (str: string) => {
  return str.replace(/\r?\n|\r/g, "\n");
};

export const normalizeText = (text: string) => {
  return (
    normalizeEOL(text)
      // replace tabs with spaces so they render and measure correctly
      .replace(/\t/g, "        ")
  );
};
