import type { Viewer3DClipping, Viewer3DState } from "../../types";
import type { OrthographicCamera } from "three";
import { Viewer } from "three-cad-viewer";
import { CLIPPING_AXES } from "./clippingUtils";
import {
  applyParametricClipping,
  getParametricClipPercentValue,
  PARAMETRIC_CLIP_AXIS_NORMALS,
} from "./parametricClip";
import { getViewerGridPlanes, viewerGridPlanesToTuple } from "./viewerGrid";

type ViewerInstance = InstanceType<typeof Viewer>;

const PARAMETRIC_CLIP_AXES = ["x", "y", "z"] as const;
const PARAMETRIC_CLIP_SLIDER_KEYS = ["clipSlider0", "clipSlider1", "clipSlider2"] as const;

const zebraActiveByViewer = new WeakMap<ViewerInstance, boolean>();
const explodeStateByViewer = new WeakMap<ViewerInstance, { active: boolean; value: number }>();

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

const getRenderedViewer = (viewer: ViewerInstance | null): any => {
  try {
    return (viewer as any)?.rendered ?? null;
  } catch {
    return null;
  }
};

const safeViewerStateGet = (viewer: ViewerInstance | null, key: string): unknown => {
  try {
    return (viewer as any)?.state?.get?.(key as never);
  } catch {
    return undefined;
  }
};

export const setParametricZebraActive = (
  viewer: ViewerInstance | null,
  active: boolean,
): void => {
  if (!viewer) return;
  zebraActiveByViewer.set(viewer, active);
};

export const getParametricZebraActive = (
  viewer: ViewerInstance | null,
): boolean => {
  if (!viewer) return false;
  return zebraActiveByViewer.get(viewer) ?? false;
};

export const setParametricExplodeState = (
  viewer: ViewerInstance | null,
  active: boolean,
  value: number,
): void => {
  if (!viewer) return;

  explodeStateByViewer.set(viewer, {
    active,
    value: active ? value : 0,
  });
};

export const getParametricExplodeState = (
  viewer: ViewerInstance | null,
): { active: boolean; value: number } => {
  if (!viewer) {
    return { active: false, value: 0 };
  }

  const cachedState = explodeStateByViewer.get(viewer);
  if (cachedState) {
    return cachedState;
  }

  const active = (safeViewerStateGet(viewer, "explode") as boolean) ?? false;
  const relativeTime = (safeViewerStateGet(viewer, "relativeTime") as number) ?? 0;
  const resolvedState = {
    active,
    value: active && Number.isFinite(relativeTime) ? relativeTime : 0,
  };

  explodeStateByViewer.set(viewer, resolvedState);
  return resolvedState;
};

export const extractParametricClippingState = (
  viewer: ViewerInstance | null,
): Viewer3DClipping => {
  const rendered = getRenderedViewer(viewer);
  if (!viewer || !rendered?.clipping) {
    return {
      x: { enabled: false, value: 0, normal: null },
      y: { enabled: false, value: 0, normal: null },
      z: { enabled: false, value: 0, normal: null },
      intersection: false,
      showPlanes: false,
      objectColorCaps: false,
    };
  }

  const hasLocalClipping = Boolean((viewer as any).renderer?.localClippingEnabled);
  const activeClipPlaneSet = new Set(rendered.nestedGroup?.clipPlanes ?? []);
  const allClipPlanes = rendered.clipping.clipPlanes ?? [];
  const reverseClipPlanes = rendered.clipping.reverseClipPlanes ?? [];

  const planes = {} as Record<"x" | "y" | "z", Viewer3DClipping["x"]>;

  for (let index = 0; index < PARAMETRIC_CLIP_AXES.length; index++) {
    const axis = PARAMETRIC_CLIP_AXES[index];
    const sliderValue = safeViewerStateGet(viewer, PARAMETRIC_CLIP_SLIDER_KEYS[index]);
    const actualValue = typeof sliderValue === "number" && Number.isFinite(sliderValue)
      ? sliderValue
      : 0;
    const enabled = hasLocalClipping && (
      activeClipPlaneSet.has(allClipPlanes[index]) ||
      activeClipPlaneSet.has(reverseClipPlanes[index])
    );

    planes[axis] = enabled
      ? {
          enabled: true,
          value: getParametricClipPercentValue(viewer, axis, {
            enabled: true,
            value: actualValue,
            normal: null,
          }),
          normal: PARAMETRIC_CLIP_AXIS_NORMALS[axis],
        }
      : {
          enabled: false,
          value: 0,
          normal: null,
        };
  }

  return {
    ...planes,
    intersection: (safeViewerStateGet(viewer, "clipIntersection") as boolean) ?? false,
    showPlanes: (safeViewerStateGet(viewer, "clipPlaneHelpers") as boolean) ?? false,
    objectColorCaps: (safeViewerStateGet(viewer, "clipObjectColors") as boolean) ?? false,
  };
};

interface ApplyParametricViewerStateOptions {
  applyCamera?: boolean;
  previousState?: Viewer3DState | null;
}

export interface ParametricViewerStateApplyPlan {
  camera: boolean;
  display: boolean;
  material: boolean;
  clipping: boolean;
  explode: boolean;
  zebra: boolean;
}

export const getParametricViewerStateApplyPlan = (
  state: Viewer3DState,
  previousState: Viewer3DState | null | undefined,
): ParametricViewerStateApplyPlan => ({
  camera: !previousState || !deepEqual(previousState.camera, state.camera),
  display: !previousState || !deepEqual(previousState.display, state.display),
  material: !previousState || !deepEqual(previousState.material, state.material),
  clipping: !previousState || !deepEqual(previousState.clipping, state.clipping),
  explode: !previousState || !deepEqual(previousState.explode, state.explode),
  zebra: !previousState || !deepEqual(previousState.zebra, state.zebra),
});

export const applyParametricViewerState = (
  viewer: ViewerInstance | null,
  state: Viewer3DState,
  options: ApplyParametricViewerStateOptions = {},
): boolean => {
  const rendered = getRenderedViewer(viewer);
  if (!viewer || !rendered) return false;

  try {
    const applyCamera = options.applyCamera ?? true;
    const { display, material, clipping, explode, zebra } = state;
    const applyPlan = getParametricViewerStateApplyPlan(state, options.previousState);

    if (applyCamera && applyPlan.camera) {
      const currentOrtho = (viewer as any).state?.get?.("ortho" as never);
      if (typeof currentOrtho === "boolean" && currentOrtho !== state.camera.ortho) {
        (viewer as any).switchCamera?.(state.camera.ortho);
      }

      const camera = rendered.camera.getCamera();
      const controls = rendered.controls;
      const { position, quaternion, target, zoom } = state.camera;

      if (position?.length === 3) {
        camera.position.set(position[0], position[1], position[2]);
      }
      if (quaternion?.length === 4) {
        camera.quaternion.set(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
      }
      if (typeof zoom === "number" && "zoom" in camera) {
        (camera as OrthographicCamera).zoom = zoom;
        (camera as OrthographicCamera).updateProjectionMatrix?.();
      }
      if (target?.length === 3 && controls?.target) {
        controls.target.set(target[0], target[1], target[2]);
        controls.update?.();
      }
    }

    if (applyPlan.material) {
      (viewer as any).setAmbientLight?.(material.ambientIntensity);
      (viewer as any).setDirectLight?.(material.directIntensity);
      (viewer as any).setMetalness?.(material.metalness);
      (viewer as any).setRoughness?.(material.roughness);
    }

    if (applyPlan.display) {
      const [gridXY, gridXZ, gridYZ] = viewerGridPlanesToTuple(getViewerGridPlanes(display.grid));
      (viewer as any).setTransparent?.(display.transparent);
      (viewer as any).setBlackEdges?.(display.blackEdges);
      (viewer as any).setAxes?.(display.axesVisible);
      (viewer as any).setAxes0?.(display.axesAtOrigin);
      (viewer as any).setGrids?.([gridXY, gridXZ, gridYZ]);
    }

    if (applyPlan.clipping) {
      applyParametricClipping(viewer, clipping);
    }

    if (applyPlan.explode) {
      setParametricExplodeState(viewer, explode.active, explode.value);
      (viewer as any).setExplode?.(explode.active);
      (viewer as any).setRelativeTime?.(explode.active ? explode.value : 0);
    }

    if (applyPlan.zebra) {
      setParametricZebraActive(viewer, zebra.active);
      (viewer as any).enableZebraTool?.(zebra.active);
      (viewer as any).setZebraCount?.(zebra.stripeCount);
      (viewer as any).setZebraOpacity?.(zebra.opacity);
      (viewer as any).setZebraDirection?.(zebra.stripeDirection);
      (viewer as any).setZebraColorScheme?.(zebra.colorScheme);
      (viewer as any).setZebraMappingMode?.(zebra.mappingMode);
    }

    const didApplyState = (
      (applyCamera && applyPlan.camera)
      || applyPlan.display
      || applyPlan.material
      || applyPlan.clipping
      || applyPlan.explode
      || applyPlan.zebra
    );
    if (didApplyState) {
      (viewer as any).update?.(true);
    }
    return true;
  } catch {
    return false;
  }
};
