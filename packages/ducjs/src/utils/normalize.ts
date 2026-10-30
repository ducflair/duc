import { MAX_ZOOM, MIN_ZOOM } from "./constants";
import { clamp, round } from "./math";
import type { NormalizedZoomValue } from "../types";
import { DucElement, FixedPoint } from "../types/elements";

export const getNormalizedZoom = (zoom: number): NormalizedZoomValue => {
  return clamp(zoom, MIN_ZOOM, MAX_ZOOM) as NormalizedZoomValue;
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
  width: number;
  height: number;
  x: number;
  y: number;
} => {
  const toNum = (v: any): number => (typeof v === "number" ? v : (v?.value ?? 0));
  const elWidth = toNum(element.width);
  const elHeight = toNum(element.height);
  const elX = toNum(element.x);
  const elY = toNum(element.y);

  const ret = {
    width: elWidth,
    height: elHeight,
    x: elX,
    y: elY,
  };

  if (elWidth < 0) {
    const nextWidth = Math.abs(elWidth);
    ret.width = nextWidth;
    ret.x = elX - nextWidth;
  }

  if (elHeight < 0) {
    const nextHeight = Math.abs(elHeight);
    ret.height = nextHeight;
    ret.y = elY - nextHeight;
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
