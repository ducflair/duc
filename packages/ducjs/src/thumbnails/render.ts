import type {
  DucExternalFiles,
  ExternalFilesData,
} from "../types";
import type { DucModelElement } from "../types/elements";
import {
  resolveModelViewConfig,
  type ResolvedModelViewConfig,
} from "./cameraPresets";
import {
  getSharedBrowserRunner,
  HeadlessBrowserRunner,
} from "./browserRunner";
import { getModelThumbnailBoundsUpdate } from "./bounds";
import { buildCadViewerHtml, buildDxfViewerHtml } from "./templates";
import { tessellateModelElement } from "./tessellator";
import type {
  ModelThumbnailInput,
  ModelThumbnailResult,
  ModelViewConfig,
} from "./types";

export interface RenderThumbnailOptions {
  runner?: HeadlessBrowserRunner;
  browserExecutablePath?: string;
  useSoftwareRenderer?: boolean;
  mode?: "auto" | "gpu" | "cpu";
  timeoutMs?: number;
  files?: DucExternalFiles;
  filesData?: ExternalFilesData;
  ducPath?: string;
  ducpyDir?: string;
  shapes?: unknown;
  dxf?: Uint8Array | string;
  format?: "png" | "webp" | "jpeg";
}

/**
 * Converts a string or Uint8Array to base64.
 */
function toBase64String(data: Uint8Array | string): string {
  if (typeof data === "string") {
    return Buffer.from(data, "utf8").toString("base64");
  }
  return Buffer.from(data).toString("base64");
}

/**
 * Resolves file bytes for a model element from files & filesData maps.
 */
function resolveElementFileData(
  element: DucModelElement,
  files?: DucExternalFiles,
  filesData?: ExternalFilesData,
): Uint8Array | null {
  if (!files || !filesData || !element.fileIds?.length) {
    return null;
  }

  for (const fileId of element.fileIds) {
    const file = files[fileId];
    const revId = file?.activeRevisionId;
    if (revId && filesData[revId]) {
      return filesData[revId];
    }
  }

  return null;
}

/**
 * Renders a thumbnail or frame from a specified model and view configuration.
 * Uses three-cad-viewer for 3D CAD/Python models and dxf-renderer for DXF drawings,
 * trimming transparent borders and scaling to 1200px long edge.
 */
export async function renderModelViewThumbnail(
  input: ModelThumbnailInput,
  options: RenderThumbnailOptions = {},
): Promise<ModelThumbnailResult> {
  const startTime = Date.now();

  const config: ResolvedModelViewConfig = resolveModelViewConfig(
    input.viewConfig,
    input.viewerState,
  );

  const isDxf =
    (input.modelType && input.modelType.toUpperCase() === "DXF") ||
    input.dxf !== undefined;

  let html: string;
  if (isDxf && input.dxf) {
    const base64Dxf = toBase64String(input.dxf);
    html = buildDxfViewerHtml(base64Dxf, config);
  } else {
    html = buildCadViewerHtml(input.shapes, config);
  }

  const runner =
    options.runner ??
    getSharedBrowserRunner({
      executablePath: options.browserExecutablePath,
      useSoftwareRenderer: options.useSoftwareRenderer,
      mode: options.mode,
    });

  const requestedLongEdge = Math.max(
    config.targetLongEdge || 0,
    config.width || 0,
    config.height || 0,
    1200,
  );
  const aspect = config.width && config.height ? config.width / config.height : 4 / 3;
  let captureWidth = requestedLongEdge;
  let captureHeight = Math.round(requestedLongEdge / aspect);
  if (aspect < 1) {
    captureHeight = requestedLongEdge;
    captureWidth = Math.round(requestedLongEdge * aspect);
  }

  const format = input.format ?? "png";
  const { data, base64, width: renderedWidth, height: renderedHeight, renderer, isGpu } = await runner.captureHtml(
    html,
    captureWidth,
    captureHeight,
    format,
    options.timeoutMs ?? 45000,
  );

  const renderTimeMs = Date.now() - startTime;

  return {
    data,
    base64,
    format,
    width: renderedWidth,
    height: renderedHeight,
    renderTimeMs,
    glRenderer: renderer,
    backend: isGpu ? "gpu" : "cpu",
  };
}

/**
 * Generates and returns thumbnail image bytes for a DucModelElement.
 */
export async function renderModelElementThumbnail(
  element: DucModelElement,
  options: RenderThumbnailOptions & { viewConfig?: ModelViewConfig } = {},
): Promise<Uint8Array> {
  const result = await renderModelElementThumbnailWithResult(element, options);
  return result.data;
}

/**
 * Generates and returns a detailed thumbnail result including proportional bounds update.
 * Thumbnails are ALWAYS rendered fresh from the model data via the headless renderer.
 */
export async function renderModelElementThumbnailWithResult(
  element: DucModelElement,
  options: RenderThumbnailOptions & { viewConfig?: ModelViewConfig } = {},
): Promise<ModelThumbnailResult> {
  const startTime = Date.now();
  const fileData = resolveElementFileData(element, options.files, options.filesData);
  const isDxf = element.modelType?.toUpperCase() === "DXF";

  let shapes =
    options.shapes ??
    (element as unknown as { shapes?: unknown }).shapes;

  const dxf =
    options.dxf ??
    (isDxf ? fileData ?? (element as unknown as { dxf?: Uint8Array }).dxf : undefined);

  if (!isDxf && !shapes) {
    try {
      const tessRes = await tessellateModelElement(element, {
        ducPath: options.ducPath,
        files: options.files,
        filesData: options.filesData,
        ducpyDir: options.ducpyDir,
        timeoutMs: options.timeoutMs,
      });
      if (tessRes?.shapes) {
        shapes = tessRes.shapes;
      }
    } catch {
      // Fallback to geometric models if Python tessellator is not run
    }
  }

  if (!isDxf && !shapes) {
    throw new Error(
      `Unable to render thumbnail for model element '${element.id}': no 3D geometry shapes or DXF drawing available.`,
    );
  }

  const result = await renderModelViewThumbnail(
    {
      modelType: element.modelType,
      viewerState: element.viewerState,
      viewConfig: options.viewConfig,
      shapes,
      dxf,
      pythonCode: element.code,
      format: options.format ?? options.viewConfig?.format,
    },
    options,
  );

  const boundsUpdate = getModelThumbnailBoundsUpdate(
    element,
    result.width,
    result.height,
  );

  return {
    ...result,
    boundsUpdate,
  };
}

/**
 * Updates a DucModelElement with a newly generated thumbnail buffer and optional bounds update.
 */
export async function updateModelElementThumbnail(
  element: DucModelElement,
  options: RenderThumbnailOptions & { viewConfig?: ModelViewConfig } = {},
): Promise<DucModelElement> {
  const result = await renderModelElementThumbnailWithResult(element, options);
  return {
    ...element,
    thumbnail: result.data,
    ...(result.boundsUpdate ?? {}),
  };
}
