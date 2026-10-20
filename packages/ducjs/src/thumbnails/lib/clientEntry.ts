import { renderOffscreenModelThumbnail } from "./offscreen-model-thumbnail";
import { cropAndScaleCanvasToOpaqueContent, scaleCanvasToLongEdge } from "./thumbnail-capture";

if (typeof window !== "undefined") {
  (window as any).renderOffscreenModelThumbnail = renderOffscreenModelThumbnail;
  (window as any).cropAndScaleCanvasToOpaqueContent = cropAndScaleCanvasToOpaqueContent;
  (window as any).scaleCanvasToLongEdge = scaleCanvasToLongEdge;
}

export { renderOffscreenModelThumbnail, cropAndScaleCanvasToOpaqueContent, scaleCanvasToLongEdge };
