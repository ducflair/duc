const PNG_ALPHA_THRESHOLD = 4;
const THUMB_LONG_EDGE = 1200;

export interface SceneThumbnailCaptureResult {
  data: Uint8Array;
  width: number;
  height: number;
  glRenderer?: string;
  isGpu?: boolean;
}

export interface CanvasThumbnailCaptureOptions {
  trimTransparentBounds?: boolean;
  targetLongEdge?: number;
  maxSizeMB?: number;
  trimScanLongEdge?: number;
  trimPaddingPx?: number;
  background?: string;
  format?: "png" | "webp" | "jpeg";
}

interface OpaqueBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const getOpaqueBounds = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold: number,
): OpaqueBounds | null => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha <= alphaThreshold) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
};

export const cropAndScaleCanvasToOpaqueContent = (
  sourceCanvas: HTMLCanvasElement,
  targetLongEdge: number,
  options: { scanLongEdge?: number; paddingPx?: number; background?: string } = {},
): HTMLCanvasElement | null => {
  const sourceWidth = Math.max(1, sourceCanvas.width);
  const sourceHeight = Math.max(1, sourceCanvas.height);
  const sourceLongEdge = Math.max(sourceWidth, sourceHeight);
  const scanLongEdge = Math.max(1, Math.floor(options.scanLongEdge ?? sourceLongEdge));
  const scanScale = Math.min(1, scanLongEdge / sourceLongEdge);
  const scanWidth = Math.max(1, Math.round(sourceWidth * scanScale));
  const scanHeight = Math.max(1, Math.round(sourceHeight * scanScale));

  const scanCanvas = document.createElement("canvas");
  scanCanvas.width = scanWidth;
  scanCanvas.height = scanHeight;
  const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
  if (!scanCtx) {
    scanCanvas.width = scanCanvas.height = 1;
    return scaleCanvasToLongEdge(sourceCanvas, targetLongEdge, options.background);
  }

  scanCtx.clearRect(0, 0, scanWidth, scanHeight);
  scanCtx.imageSmoothingEnabled = false;
  scanCtx.drawImage(sourceCanvas, 0, 0, scanWidth, scanHeight);

  const scanBounds = getOpaqueBounds(
    scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height).data,
    scanCanvas.width,
    scanCanvas.height,
    PNG_ALPHA_THRESHOLD,
  );
  scanCanvas.width = scanCanvas.height = 1;
  if (!scanBounds) return null;

  const paddingPx = Math.max(0, Math.floor(options.paddingPx ?? 0));
  const inverseScale = 1 / scanScale;
  const bounds = {
    minX: Math.max(0, Math.floor(scanBounds.minX * inverseScale) - paddingPx),
    minY: Math.max(0, Math.floor(scanBounds.minY * inverseScale) - paddingPx),
    maxX: Math.min(sourceWidth - 1, Math.ceil((scanBounds.maxX + 1) * inverseScale) + paddingPx - 1),
    maxY: Math.min(sourceHeight - 1, Math.ceil((scanBounds.maxY + 1) * inverseScale) + paddingPx - 1),
  };
  const trimmedWidth = bounds.maxX - bounds.minX + 1;
  const trimmedHeight = bounds.maxY - bounds.minY + 1;
  const scale = targetLongEdge / Math.max(trimmedWidth, trimmedHeight);
  const outputWidth = Math.max(1, Math.round(trimmedWidth * scale));
  const outputHeight = Math.max(1, Math.round(trimmedHeight * scale));

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;

  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) {
    outputCanvas.width = outputCanvas.height = 1;
    return scaleCanvasToLongEdge(sourceCanvas, targetLongEdge, options.background);
  }

  if (options.background && options.background !== "transparent") {
    outputCtx.fillStyle = options.background;
    outputCtx.fillRect(0, 0, outputWidth, outputHeight);
  }

  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  outputCtx.drawImage(
    sourceCanvas,
    bounds.minX, bounds.minY, trimmedWidth, trimmedHeight,
    0, 0, outputWidth, outputHeight,
  );

  return outputCanvas;
};

export const scaleCanvasToLongEdge = (
  sourceCanvas: HTMLCanvasElement,
  targetLongEdge: number,
  background?: string,
): HTMLCanvasElement => {
  const sw = Math.max(1, sourceCanvas.width);
  const sh = Math.max(1, sourceCanvas.height);
  const currentLong = Math.max(sw, sh);
  const scale = targetLongEdge / currentLong;
  const scaledW = Math.max(1, Math.round(sw * scale));
  const scaledH = Math.max(1, Math.round(sh * scale));

  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = scaledW;
  scaledCanvas.height = scaledH;

  const ctx = scaledCanvas.getContext("2d");
  if (!ctx) {
    scaledCanvas.width = scaledCanvas.height = 1;
    return sourceCanvas;
  }

  if (background && background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, scaledW, scaledH);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, scaledW, scaledH);

  return scaledCanvas;
};

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function captureCanvasThumbnail(
  sourceCanvas: HTMLCanvasElement,
  options: CanvasThumbnailCaptureOptions = {},
): Promise<SceneThumbnailCaptureResult | null> {
  let scaled: HTMLCanvasElement | null = null;
  try {
    const shouldTrim = options.trimTransparentBounds ?? true;
    const targetLongEdge = options.targetLongEdge ?? THUMB_LONG_EDGE;
    scaled = shouldTrim
      ? cropAndScaleCanvasToOpaqueContent(sourceCanvas, targetLongEdge, {
        scanLongEdge: options.trimScanLongEdge,
        paddingPx: options.trimPaddingPx,
        background: options.background,
      })
      : scaleCanvasToLongEdge(sourceCanvas, targetLongEdge, options.background);
    if (!scaled) return null;

    const mimeType = options.format === "webp"
      ? "image/webp"
      : options.format === "jpeg"
        ? "image/jpeg"
        : "image/png";

    const blob = await canvasToBlob(scaled, mimeType, 0.92);
    if (!blob) return null;

    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    return {
      data,
      width: scaled.width,
      height: scaled.height,
    };
  } catch {
    return null;
  } finally {
    if (scaled && scaled !== sourceCanvas) scaled.width = scaled.height = 1;
  }
}
