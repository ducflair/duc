import { DxfViewer, type DxfViewerOptions, type DxfViewerLoadParams } from "dxf-renderer";
import { Color } from "three";
import { captureCanvasThumbnail, type SceneThumbnailCaptureResult } from "./thumbnail-capture";

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;
const DXF_CONTENT_FIT_PADDING = 0.04;

const toArrayBuffer = (data: Uint8Array): ArrayBuffer => {
  if (data.buffer instanceof ArrayBuffer) {
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
      return data.buffer;
    }

    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }

  const copy = new Uint8Array(data);
  return copy.buffer as ArrayBuffer;
};

const toPositiveDimension = (value: number | undefined, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.max(1, Math.round(value));
  }
  return fallback;
};

const createHiddenContainer = (width: number, height: number): HTMLDivElement => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "-10000px";
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);
  return container;
};

const createViewerOptions = (background?: string): DxfViewerOptions => ({
  autoResize: false,
  antialias: true,
  canvasAlpha: true,
  canvasPremultipliedAlpha: false,
  clearAlpha: background ? 1 : 0,
  clearColor: new Color(background || "#ffffff"),
  colorCorrection: true,
  blackWhiteInversion: true,
  preserveDrawingBuffer: true,
  retainParsedDxf: false,
  sceneOptions: {
    layout: "Model",
    suppressPaperSpace: true,
    wireframeMesh: true,
  },
});

const fitViewerToContent = (viewer: InstanceType<typeof DxfViewer>) => {
  const bounds = viewer.GetBounds();
  if (!bounds) return;

  const origin = viewer.GetOrigin() ?? { x: 0, y: 0 };
  viewer.FitView(
    bounds.minX - origin.x,
    bounds.maxX - origin.x,
    bounds.minY - origin.y,
    bounds.maxY - origin.y,
    DXF_CONTENT_FIT_PADDING,
  );
};

export interface OffscreenDxfThumbnailInput {
  data: Uint8Array;
  pythonCode?: string | null;
  width?: number;
  height?: number;
  fonts?: DxfViewerLoadParams["fonts"];
  workerUrl?: URL | string | null;
  workerFactory?: () => Worker;
  background?: string;
  format?: "png" | "webp" | "jpeg";
  targetLongEdge?: number;
  signal?: AbortSignal;
}

export const renderOffscreenDxfThumbnail = async ({
  data,
  pythonCode,
  width,
  height,
  fonts,
  workerUrl,
  workerFactory,
  background,
  format,
  targetLongEdge,
  signal,
}: OffscreenDxfThumbnailInput): Promise<SceneThumbnailCaptureResult | null> => {
  if (typeof document === "undefined" || !data.byteLength || signal?.aborted) {
    return null;
  }

  const renderWidth = toPositiveDimension(width, DEFAULT_WIDTH);
  const renderHeight = toPositiveDimension(height, DEFAULT_HEIGHT);
  const container = createHiddenContainer(renderWidth, renderHeight);
  let viewer: InstanceType<typeof DxfViewer> | null = null;
  let dxfUrl: string | null = null;

  const createdWorkers: Worker[] = [];
  try {
    viewer = new DxfViewer(container, createViewerOptions(background));
    viewer.GetRenderer()?.setPixelRatio(1);
    viewer.SetSize(renderWidth, renderHeight);
    if (signal?.aborted) return null;
    dxfUrl = URL.createObjectURL(new Blob([toArrayBuffer(data)], { type: "application/dxf" }));

    let effectiveWorkerFactory = workerFactory;
    if (workerFactory) {
      effectiveWorkerFactory = () => {
        const worker = workerFactory();
        createdWorkers.push(worker);
        return worker;
      };
    } else if (workerUrl) {
      effectiveWorkerFactory = () => {
        const worker = new Worker(workerUrl, { type: "module" });
        createdWorkers.push(worker);
        return worker;
      };
    }

    await viewer.Load({
      url: dxfUrl,
      fonts: fonts ?? [],
      ...(effectiveWorkerFactory ? { workerFactory: effectiveWorkerFactory } : {}),
    });
    if (signal?.aborted) return null;

    const renderer = viewer.GetRenderer();
    if (renderer) {
      if (background) {
        renderer.setClearColor(new Color(background), 1);
        renderer.domElement.style.background = background;
      } else {
        renderer.setClearColor(new Color("#ffffff"), 0);
        renderer.domElement.style.background = "transparent";
      }
    }

    fitViewerToContent(viewer);
    viewer.Render();
    if (signal?.aborted) return null;

    const canvas = viewer.GetCanvas();
    if (!canvas) return null;

    return await captureCanvasThumbnail(canvas, {
      trimTransparentBounds: false,
      targetLongEdge: targetLongEdge ?? 1200,
      background,
      format: format ?? "png",
      maxSizeMB: 0.12,
    });
  } finally {
    for (const worker of createdWorkers) {
      try {
        worker.terminate();
      } catch {
        // Worker may already be terminated
      }
    }
    const renderer = viewer?.GetRenderer();
    try {
      viewer?.Destroy();
    } catch {
      // Best-effort cleanup
    }
    if (renderer) {
      try {
        if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      } catch {
        // Context may already be lost
      }
      renderer.domElement.width = 1;
      renderer.domElement.height = 1;
      renderer.domElement.remove();
    }
    if (dxfUrl) URL.revokeObjectURL(dxfUrl);
    if (typeof workerUrl === "string" && workerUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(workerUrl);
      } catch {
        // Blob URL may already be revoked
      }
    }
    container.remove();
  }
};
