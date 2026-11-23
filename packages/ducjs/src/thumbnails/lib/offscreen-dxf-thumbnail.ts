import { captureCanvasThumbnail, type SceneThumbnailCaptureResult } from "./thumbnail-capture";

export interface OffscreenDxfThumbnailInput {
  data: Uint8Array;
  convertDxfToPdf: (dxf: Uint8Array) => Uint8Array | Promise<Uint8Array>;
  rasterizePdf: (pdf: Uint8Array, maxDimension: number) => Promise<Uint8Array>;
  background?: string;
  format?: "png" | "webp" | "jpeg";
  targetLongEdge?: number;
  signal?: AbortSignal;
}

export const renderOffscreenDxfThumbnail = async ({
  data,
  convertDxfToPdf,
  rasterizePdf,
  background,
  format,
  targetLongEdge,
  signal,
}: OffscreenDxfThumbnailInput): Promise<SceneThumbnailCaptureResult | null> => {
  if (typeof document === "undefined" || !data.byteLength || signal?.aborted) {
    return null;
  }

  const longEdge = targetLongEdge ?? 1200;
  const pdf = await convertDxfToPdf(data);
  const imageBytes = await rasterizePdf(pdf, longEdge);
  if (signal?.aborted) return null;

  const imageUrl = URL.createObjectURL(
    new Blob([imageBytes.slice().buffer as ArrayBuffer], { type: "image/png" }),
  );
  const image = new Image();
  const canvas = document.createElement("canvas");
  try {
    image.src = imageUrl;
    await image.decode();
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0);

    return await captureCanvasThumbnail(canvas, {
      trimTransparentBounds: false,
      targetLongEdge: longEdge,
      background,
      format: format ?? "png",
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
    canvas.width = 1;
    canvas.height = 1;
  }
};
