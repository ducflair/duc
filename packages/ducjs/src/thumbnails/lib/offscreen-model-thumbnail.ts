import { mapViewerStateToOptions } from "./mapViewerStateToOptions";
import { applyParametricViewerState } from "./parametricViewerState";
import { sanitizeParametricShapes } from "./parametricShapes";
import { captureCanvasThumbnail, type SceneThumbnailCaptureResult } from "./thumbnail-capture";
import { prepareSceneForThumbnailCapture } from "./thumbnail-visibility";
import {
  fitThreeCadViewerCameraToBounds,
  fitThreeCadViewerCameraToVisibleScene,
} from "./thumbnail-camera-fit";
import type { Viewer3DState } from "../../types";
import { Display, type RenderOptions, type Shapes, type ViewerOptions } from "three-cad-viewer";

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;

const waitForPaint = (frames: number, signal?: AbortSignal) => new Promise<void>((resolve) => {
  if (signal?.aborted || typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    resolve();
    return;
  }

  let frameId = 0;
  const finish = () => {
    window.cancelAnimationFrame(frameId);
    signal?.removeEventListener("abort", finish);
    resolve();
  };
  signal?.addEventListener("abort", finish, { once: true });
  const step = (remaining: number) => {
    frameId = window.requestAnimationFrame(() => {
      if (remaining <= 1) {
        finish();
        return;
      }
      step(remaining - 1);
    });
  };

  step(frames);
});

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

const toPositiveDimension = (value: number | undefined, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.max(1, Math.round(value));
  }
  return fallback;
};

const getRenderedScene = (
  viewer: InstanceType<typeof import("three-cad-viewer").Viewer>,
) => {
  try {
    return (viewer as any).rendered?.scene ?? null;
  } catch {
    return null;
  }
};

export interface OffscreenModelThumbnailInput {
  shapes: unknown;
  viewerState?: Viewer3DState | null;
  hasExplicitCamera?: boolean;
  width?: number;
  height?: number;
  targetLongEdge?: number;
  trimTransparentBounds?: boolean;
  trimPaddingPx?: number;
  background?: string;
  format?: "png" | "webp" | "jpeg";
  signal?: AbortSignal;
}

export const renderOffscreenModelThumbnail = async ({
  shapes,
  viewerState = null,
  hasExplicitCamera = false,
  width,
  height,
  targetLongEdge,
  trimTransparentBounds,
  trimPaddingPx,
  background,
  format,
  signal,
}: OffscreenModelThumbnailInput): Promise<SceneThumbnailCaptureResult | null> => {
  if (typeof document === "undefined" || signal?.aborted) {
    return null;
  }

  const renderWidth = toPositiveDimension(width, DEFAULT_WIDTH);
  const renderHeight = toPositiveDimension(height, DEFAULT_HEIGHT);
  const container = createHiddenContainer(renderWidth, renderHeight);

  let viewer: InstanceType<typeof import("three-cad-viewer").Viewer> | null = null;
  let display: InstanceType<typeof Display> | null = null;

  try {
    const { Display, Viewer } = await import("three-cad-viewer");
    if (signal?.aborted) return null;
    const mappedOptions = mapViewerStateToOptions(viewerState);
    display = new Display(container, {
      cadWidth: renderWidth,
      height: renderHeight,
      treeWidth: 0,
      tools: false,
      glass: true,
      theme: "light",
      measureTools: false,
      externalMeasurementBackend: false,
      selectTool: false,
      explodeTool: true,
      zscaleTool: false,
      zebraTool: true,
      studioTool: false,
      pinning: false,
    });

    const viewerOptions: Record<string, unknown> = {
      ...mappedOptions.viewerOptions,
      cadWidth: renderWidth,
      height: renderHeight,
      tools: false,
      measureTools: false,
      selectTool: false,
      explodeTool: true,
      zscaleTool: false,
      zebraTool: true,
    };

    viewer = new Viewer(display, viewerOptions, () => undefined, null, false);
    // Thumbnail dimensions are output pixels, independent of the screen's DPI.
    viewer.renderer.setPixelRatio(1);
    viewer.render(
      sanitizeParametricShapes(shapes) as Shapes,
      mappedOptions.renderOptions as RenderOptions,
      viewerOptions as ViewerOptions,
    );

    viewer.update(true);
    if (signal?.aborted) return null;

    const restoredViewerState = viewerState
      ? applyParametricViewerState(viewer, viewerState, { applyCamera: true })
      : false;

    viewer.update(true);
    await waitForPaint(3, signal);
    if (signal?.aborted) return null;

    const scene = getRenderedScene(viewer);
    if (!scene) {
      return null;
    }

    const restoreScene = prepareSceneForThumbnailCapture({
      scene,
      rendererMode: "parametric",
      parametricViewer: viewer,
    });

    try {
      if (!hasExplicitCamera) {
        fitThreeCadViewerCameraToVisibleScene(
          viewer,
          renderWidth > 0 && renderHeight > 0 ? renderWidth / renderHeight : undefined,
        ) || fitThreeCadViewerCameraToBounds(viewer);
      }

      viewer.update(true);
      await waitForPaint(3, signal);
      if (signal?.aborted) return null;

      let glRenderer: string | undefined;
      let isGpu: boolean | undefined;
      try {
        const gl = viewer.renderer.getContext();
        if (gl) {
          const dbg = gl.getExtension("WEBGL_debug_renderer_info");
          glRenderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
          if (typeof glRenderer === "string") {
            const lower = glRenderer.toLowerCase();
            isGpu = !lower.includes("swiftshader") && !lower.includes("llvmpipe");
          }
        }
      } catch {
        // Best effort renderer extraction
      }

      const captureRes = await captureCanvasThumbnail(viewer.renderer.domElement, {
        trimTransparentBounds: trimTransparentBounds ?? true,
        trimScanLongEdge: 900,
        trimPaddingPx: trimPaddingPx ?? 2,
        targetLongEdge: targetLongEdge ?? Math.max(renderWidth, renderHeight, 1200),
        background,
        format: format ?? "png",
        maxSizeMB: 0.2,
      });

      if (!captureRes) return null;
      return {
        ...captureRes,
        glRenderer,
        isGpu,
      };
    } finally {
      restoreScene();
    }
  } finally {
    try {
      viewer?.dispose?.();
    } catch {
      // Best-effort cleanup for offscreen renderer resources.
    }
    // Force-release the Viewer's WebGL context to avoid "too many active
    // WebGL contexts" when thumbnails are rendered in rapid succession.
    try {
      const gl = viewer?.renderer?.getContext();
      const extension = gl?.getExtension("WEBGL_lose_context");
      if (gl && extension && !gl.isContextLost()) {
        extension.loseContext();
      }
      if (viewer?.renderer?.domElement) {
        viewer.renderer.domElement.width = 1;
        viewer.renderer.domElement.height = 1;
      }
      viewer?.renderer?.domElement?.remove();
    } catch {
      // Context may already be lost or unavailable.
    }
    try {
      display?.dispose?.();
    } catch {
      // Best-effort cleanup for display subscriptions and detached DOM.
    }
    container.remove();
  }
};
