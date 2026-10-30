import type {
  DucModelElement,
  Viewer3DCamera,
  Viewer3DClipping,
  Viewer3DDisplay,
  Viewer3DExplode,
  Viewer3DMaterial,
  Viewer3DState,
  Viewer3DZebra,
} from "../types/elements";

/**
 * Standard engineering camera viewpoint presets.
 */
export type CameraPreset =
  | "iso"
  | "top"
  | "bottom"
  | "front"
  | "rear"
  | "left"
  | "right";

/**
 * Specification for rendering a model view thumbnail/frame.
 */
export interface ModelViewConfig {
  /**
   * Predefined camera perspective. If set, provides standard coordinate transforms.
   */
  cameraPreset?: CameraPreset;

  /**
   * Explicit camera options overriding presets or existing viewerState.
   */
  camera?: Partial<Viewer3DCamera>;

  /**
   * Display options such as wireframe, axes, and grid.
   */
  display?: Partial<Viewer3DDisplay>;

  /**
   * Material and lighting properties for 3D surfaces and edges.
   */
  material?: Partial<Viewer3DMaterial>;

  /**
   * Clipping plane states along X, Y, and Z axes.
   */
  clipping?: Partial<Viewer3DClipping>;

  /**
   * CAD explosion animation state.
   */
  explode?: Partial<Viewer3DExplode>;

  /**
   * Surface curvature zebra stripe inspection configuration.
   */
  zebra?: Partial<Viewer3DZebra>;

  /**
   * Background color or "transparent".
   * @default "transparent"
   */
  background?: "transparent" | "white" | "dark" | string;

  /**
   * Target rendered pixel width.
   * @default 1024
   */
  width?: number;

  /**
   * Target rendered pixel height.
   * @default 768
   */
  height?: number;

  /**
   * Device pixel ratio (1 for standard offscreen rendering).
   * @default 1
   */
  pixelRatio?: number;

  /**
   * Whether to trim excess transparent border pixels from the output thumbnail.
   * Directly mirrors packages/client/ui/blocks/core/three/lib/thumbnail-capture.ts.
   * @default true
   */
  trimTransparentBounds?: boolean;

  /**
   * Padding in pixels around the trimmed content.
   * @default 2
   */
  trimPaddingPx?: number;

  /**
   * Target long edge size in pixels when trimming/scaling.
   * @default 1200
   */
  targetLongEdge?: number;

  /**
   * Output image encoding format.
   * @default "png"
   */
  format?: "png" | "webp" | "jpeg";

  /**
   * DXF specific view bounding box to frame or zoom into a specific sub-region / section.
   */
  dxfViewArea?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    margin?: number;
  };

  /**
   * DXF layer names to hide.
   */
  hiddenLayers?: string[];

  /**
   * DXF layer names to display exclusively.
   */
  visibleLayers?: string[];
}

/**
 * Input descriptor for grabbing a model thumbnail.
 */
export interface ModelThumbnailInput {
  /**
   * Model type (e.g. "PYTHON", "CAD", "DXF", "STEP", "STL").
   */
  modelType?: string | null;

  /**
   * 3D CAD parametric shapes tree, geometry payload, or Three.js scene descriptor.
   */
  shapes?: unknown;

  /**
   * Raw DXF content (either binary buffer or string).
   */
  dxf?: Uint8Array | string;

  /**
   * Associated Python code source (e.g. build123d script) if available.
   */
  pythonCode?: string | null;

  /**
   * Desired view configuration overrides (camera, lighting, dimensions).
   */
  viewConfig?: ModelViewConfig;

  /**
   * Existing 3D viewer state from a DucModelElement.
   */
  viewerState?: Viewer3DState | null;

  /**
   * Output image format.
   * @default "png"
   */
  format?: "png" | "jpeg" | "webp";

  /**
   * Compression quality (0.0 to 1.0) for formats like jpeg and webp.
   * @default 0.9
   */
  quality?: number;
}

/**
 * Result returned after capturing a model thumbnail/frame.
 */
export interface ModelThumbnailResult {
  /**
   * Raw image binary bytes (e.g. PNG buffer).
   */
  data: Uint8Array;

  /**
   * Base64-encoded representation of the image data.
   */
  base64: string;

  /**
   * Image format produced.
   */
  format: "png" | "jpeg" | "webp";

  /**
   * Output width in pixels.
   */
  width: number;

  /**
   * Output height in pixels.
   */
  height: number;

  /**
   * Execution time in milliseconds.
   */
  renderTimeMs: number;

  /**
   * Active WebGL graphics renderer string reported by the browser/driver.
   */
  glRenderer?: string;

  /**
   * Graphics acceleration backend used: "gpu" (Metal/Vulkan/D3D) or "cpu" (SwiftShader).
   */
  backend?: "gpu" | "cpu";

  /**
   * Proportional element bounds update maintaining thumbnail aspect ratio.
   * Mirrors packages/client/ui/blocks/core/three/lib/model-thumbnail-bounds.ts.
   */
  boundsUpdate?: { width: number; height: number } | null;
}

/**
 * Persistent worker IPC request packet.
 */
export interface ThumbnailWorkerRequest {
  /**
   * Correlating request identifier.
   */
  id: string | number;

  /**
   * Action to perform.
   */
  action: "render" | "ping" | "shutdown";

  /**
   * Input payload for render action.
   */
  input?: ModelThumbnailInput;

  /**
   * Or direct DucModelElement payload.
   */
  element?: DucModelElement;

  /**
   * Optional view config override when passing element.
   */
  viewConfig?: ModelViewConfig;
}

/**
 * Persistent worker IPC response packet.
 */
export interface ThumbnailWorkerResponse {
  /**
   * Correlating request identifier.
   */
  id: string | number;

  /**
   * Whether the operation succeeded.
   */
  ok: boolean;

  /**
   * Error message if the operation failed.
   */
  error?: string;

  /**
   * Render result on success.
   */
  result?: {
    base64: string;
    format: "png" | "jpeg" | "webp";
    width: number;
    height: number;
    renderTimeMs: number;
  };
}
