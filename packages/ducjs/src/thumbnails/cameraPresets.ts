import type {
  Viewer3DCamera,
  Viewer3DClipping,
  Viewer3DDisplay,
  Viewer3DExplode,
  Viewer3DMaterial,
  Viewer3DState,
  Viewer3DZebra,
} from "../types/elements";
import { resolveThumbnailBackground } from "./bounds";
import type { CameraPreset, ModelViewConfig } from "./types";


export interface ResolvedCameraTransform {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  quaternion: [number, number, number, number];
  ortho: boolean;
  zoom: number;
}

export interface ResolvedModelViewConfig {
  camera: ResolvedCameraTransform;
  hasExplicitCamera?: boolean;
  display: Viewer3DDisplay;
  material: Viewer3DMaterial;
  clipping: Viewer3DClipping;
  explode: Viewer3DExplode;
  zebra: Viewer3DZebra;
  background: string;
  width: number;
  height: number;
  pixelRatio: number;
  trimTransparentBounds: boolean;
  trimPaddingPx: number;
  targetLongEdge: number;
  dxfViewArea?: { minX: number; maxX: number; minY: number; maxY: number; margin?: number };
  hiddenLayers?: string[];
  visibleLayers?: string[];
}

const DEFAULT_VIEW_DISTANCE = 100;

/**
 * Calculates a quaternion [x, y, z, w] representing camera rotation looking from eye to target.
 */
export function computeLookAtQuaternion(
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number],
): [number, number, number, number] {
  // Forward vector (z-axis in view space points from target to eye in Three.js camera conventions)
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let zLen = Math.hypot(zx, zy, zz);
  if (zLen < 1e-6) {
    return [0, 0, 0, 1];
  }
  zx /= zLen;
  zy /= zLen;
  zz /= zLen;

  // Right vector = up cross z
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  let xLen = Math.hypot(xx, xy, xz);
  if (xLen < 1e-6) {
    // Up and forward are collinear; choose an alternate orthogonal vector
    const altUp: [number, number, number] = Math.abs(zy) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    xx = altUp[1] * zz - altUp[2] * zy;
    xy = altUp[2] * zx - altUp[0] * zz;
    xz = altUp[0] * zy - altUp[1] * zx;
    xLen = Math.hypot(xx, xy, xz);
  }
  xx /= xLen;
  xy /= xLen;
  xz /= xLen;

  // Real up vector = z cross x
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  // Construct rotation matrix to quaternion (Three.js camera basis: m00=xx, m01=yx, m02=zx...)
  const trace = xx + yy + zz;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0);
    return [
      (yz - zy) * s,
      (zx - xz) * s,
      (xy - yx) * s,
      0.25 / s,
    ];
  }

  if (xx > yy && xx > zz) {
    const s = 2.0 * Math.sqrt(1.0 + xx - yy - zz);
    return [
      0.25 * s,
      (xy + yx) / s,
      (xz + zx) / s,
      (yz - zy) / s,
    ];
  }

  if (yy > zz) {
    const s = 2.0 * Math.sqrt(1.0 + yy - xx - zz);
    return [
      (xy + yx) / s,
      0.25 * s,
      (yz + zy) / s,
      (zx - xz) / s,
    ];
  }

  const s = 2.0 * Math.sqrt(1.0 + zz - xx - yy);
  return [
    (xz + zx) / s,
    (yz + zy) / s,
    0.25 * s,
    (xy - yx) / s,
  ];

}

/**
 * Resolves camera vectors and quaternion for a standard viewpoint preset.
 */
export function resolveCameraPreset(
  preset: CameraPreset,
  distance = DEFAULT_VIEW_DISTANCE,
): ResolvedCameraTransform {
  const target: [number, number, number] = [0, 0, 0];
  let position: [number, number, number];
  let up: [number, number, number] = [0, 0, 1]; // Z-up is standard in CAD

  switch (preset) {
    case "iso": {
      const invSqrt3 = 1 / Math.sqrt(3);
      position = [
        distance * invSqrt3,
        -distance * invSqrt3,
        distance * invSqrt3,
      ];
      up = [0, 0, 1];
      break;
    }
    case "top":
      position = [0, 0, distance];
      up = [0, 1, 0];
      break;
    case "bottom":
      position = [0, 0, -distance];
      up = [0, -1, 0];
      break;
    case "front":
      position = [0, -distance, 0];
      up = [0, 0, 1];
      break;
    case "rear":
      position = [0, distance, 0];
      up = [0, 0, 1];
      break;
    case "left":
      position = [-distance, 0, 0];
      up = [0, 0, 1];
      break;
    case "right":
      position = [distance, 0, 0];
      up = [0, 0, 1];
      break;
  }

  const quaternion = computeLookAtQuaternion(position, target, up);

  return {
    position,
    target,
    up,
    quaternion,
    ortho: true,
    zoom: 1.0,
  };
}

const DEFAULT_MATERIAL: Viewer3DMaterial = {
  ambientIntensity: 1.0,
  directIntensity: 1.2,
  metalness: 0.25,
  roughness: 0.65,
  edgeColor: 0x505050,
  defaultOpacity: 1.0,
};

const DEFAULT_DISPLAY: Viewer3DDisplay = {
  wireframe: false,
  transparent: false,
  blackEdges: true,
  grid: { type: "uniform", value: false },
  axesVisible: false,
  axesAtOrigin: false,
};

const DEFAULT_CLIPPING: Viewer3DClipping = {
  x: { enabled: false, value: 0, normal: null },
  y: { enabled: false, value: 0, normal: null },
  z: { enabled: false, value: 0, normal: null },
  intersection: false,
  showPlanes: false,
  objectColorCaps: false,
};

const DEFAULT_EXPLODE: Viewer3DExplode = {
  active: false,
  value: 0,
};

const DEFAULT_ZEBRA: Viewer3DZebra = {
  active: false,
  stripeCount: 10,
  stripeDirection: 0,
  colorScheme: "blackwhite",
  opacity: 0.8,
  mappingMode: "reflection",
};

/**
 * Resolves a full configuration by combining viewConfig, viewerState, and CAD defaults.
 */
export function resolveModelViewConfig(
  viewConfig?: ModelViewConfig,
  viewerState?: Viewer3DState | null,
): ResolvedModelViewConfig {
  const preset = viewConfig?.cameraPreset ?? (viewerState ? undefined : "iso");

  let baseCamera: ResolvedCameraTransform;
  if (preset) {
    baseCamera = resolveCameraPreset(preset);
  } else if (viewerState?.camera) {
    baseCamera = {
      position: [...viewerState.camera.position],
      target: [...viewerState.camera.target],
      up: viewerState.camera.up === "Y" ? [0, 1, 0] : [0, 0, 1],
      quaternion: [...viewerState.camera.quaternion],
      ortho: viewerState.camera.ortho,
      zoom: viewerState.camera.zoom,
    };
  } else {
    baseCamera = resolveCameraPreset("iso");
  }

  const hasExplicitCamera = Boolean(
    viewConfig?.camera?.position ||
    viewConfig?.camera?.target ||
    (typeof viewConfig?.camera?.zoom === "number" && viewConfig.camera.zoom !== 1)
  );

  // Apply explicit camera overrides if provided
  if (viewConfig?.camera) {
    if (viewConfig.camera.position) baseCamera.position = [...viewConfig.camera.position];
    if (viewConfig.camera.target) baseCamera.target = [...viewConfig.camera.target];
    if (viewConfig.camera.quaternion) baseCamera.quaternion = [...viewConfig.camera.quaternion];
    if (viewConfig.camera.ortho !== undefined) baseCamera.ortho = viewConfig.camera.ortho;
    if (viewConfig.camera.zoom !== undefined) baseCamera.zoom = viewConfig.camera.zoom;
  }

  return {
    camera: baseCamera,
    hasExplicitCamera,
    display: {
      ...DEFAULT_DISPLAY,
      ...(viewerState?.display ?? {}),
      ...(viewConfig?.display ?? {}),
    },
    material: {
      ...DEFAULT_MATERIAL,
      ...(viewerState?.material ?? {}),
      ...(viewConfig?.material ?? {}),
    },
    clipping: {
      ...DEFAULT_CLIPPING,
      ...(viewerState?.clipping ?? {}),
      ...(viewConfig?.clipping ?? {}),
    },
    explode: {
      ...DEFAULT_EXPLODE,
      ...(viewerState?.explode ?? {}),
      ...(viewConfig?.explode ?? {}),
    },
    zebra: {
      ...DEFAULT_ZEBRA,
      ...(viewerState?.zebra ?? {}),
      ...(viewConfig?.zebra ?? {}),
    },
    background: resolveThumbnailBackground(viewConfig?.background),
    width: Math.max(1, Math.round(viewConfig?.width ?? 1024)),
    height: Math.max(1, Math.round(viewConfig?.height ?? 768)),
    pixelRatio: Math.max(0.1, viewConfig?.pixelRatio ?? 1),
    trimTransparentBounds: viewConfig?.trimTransparentBounds ?? true,
    trimPaddingPx: Math.max(0, viewConfig?.trimPaddingPx ?? 2),
    targetLongEdge: Math.max(10, viewConfig?.targetLongEdge ?? 1200),
    dxfViewArea: viewConfig?.dxfViewArea,
    hiddenLayers: viewConfig?.hiddenLayers,
    visibleLayers: viewConfig?.visibleLayers,
  };
}

