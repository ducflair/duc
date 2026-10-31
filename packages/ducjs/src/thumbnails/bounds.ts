import type { DucModelElement } from "../types/elements";

const THUMBNAIL_RATIO_EPSILON = 1e-3;

/**
 * Check if a color is grayscale (neutral color from white to grey to black or transparent).
 * Returns true if the color has no actual chromatic hue.
 * Directly mirrors packages/core/canvas/utils/thumbnailGenerator.ts.
 */
export const isGrayscaleColor = (color: string): boolean => {
  if (!color || color === "transparent" || color === "rgba(0,0,0,0)") return true;

  let r: number, g: number, b: number;

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return true;
    }
  } else if (color.startsWith("rgb")) {
    const match = color.match(/\d+/g);
    if (!match || match.length < 3) return true;
    r = parseInt(match[0], 10);
    g = parseInt(match[1], 10);
    b = parseInt(match[2], 10);
  } else {
    return true;
  }

  const tolerance = 10;
  return (
    Math.abs(r - g) <= tolerance &&
    Math.abs(g - b) <= tolerance &&
    Math.abs(r - b) <= tolerance
  );
};

/**
 * Determines the effective background color for thumbnail generation.
 * If none provided (or "transparent"), defaults to "transparent".
 * If an explicit background color is provided, preserves that color.
 */
export const resolveThumbnailBackground = (backgroundColor?: string): string => {
  if (!backgroundColor || backgroundColor.trim() === "" || backgroundColor === "transparent") {
    return "transparent";
  }
  return backgroundColor.trim();
};

/**
 * Calculates updated element dimensions preserving the aspect ratio of the generated thumbnail.
 * Directly mirrors packages/client/ui/blocks/core/three/lib/model-thumbnail-bounds.ts.
 */
export const getModelThumbnailBoundsUpdate = (
  element: DucModelElement,
  thumbnailWidth: number,
  thumbnailHeight: number,
): { width: number; height: number } | null => {
  if (!(thumbnailWidth > 0) || !(thumbnailHeight > 0)) return null;

  const currentWidth = element.width;
  const currentHeight = element.height;
  const absoluteWidth = Math.abs(currentWidth);
  const absoluteHeight = Math.abs(currentHeight);

  if (!(absoluteWidth > 0) || !(absoluteHeight > 0)) return null;

  const currentRatio = absoluteWidth / absoluteHeight;
  const thumbnailRatio = thumbnailWidth / thumbnailHeight;

  if (!Number.isFinite(currentRatio) || !Number.isFinite(thumbnailRatio)) return null;
  if (Math.abs(currentRatio - thumbnailRatio) <= THUMBNAIL_RATIO_EPSILON) return null;

  const longEdge = Math.max(absoluteWidth, absoluteHeight);
  const nextWidth = thumbnailRatio >= 1 ? longEdge : longEdge * thumbnailRatio;
  const nextHeight = thumbnailRatio >= 1 ? longEdge / thumbnailRatio : longEdge;

  if (!(nextWidth > 0) || !(nextHeight > 0)) return null;

  const signedWidth = currentWidth < 0 ? -nextWidth : nextWidth;
  const signedHeight = currentHeight < 0 ? -nextHeight : nextHeight;

  return {
    width: signedWidth,
    height: signedHeight,
  };
};
