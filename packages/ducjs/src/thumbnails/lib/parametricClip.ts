import type { Viewer3DClipping } from "../../types";
import * as THREE from "three";
import { Viewer } from "three-cad-viewer";
import {
  CLIPPING_AXES,
  shouldMirrorSingleAxisIntersection,
} from "./clippingUtils";

type ViewerInstance = InstanceType<typeof Viewer>;

type ParametricClipAxis = "x" | "y" | "z";

const CLIP_AXIS_INDEX: Record<ParametricClipAxis, 0 | 1 | 2> = {
  x: 0,
  y: 1,
  z: 2,
};

const CLIP_AXIS_VECTOR_INDEX: Record<ParametricClipAxis, 0 | 1 | 2> = {
  x: 0,
  y: 1,
  z: 2,
};

const MIN_HALF_EXTENT = 1e-3;
const DISABLE_MARGIN_FACTOR = 1.05;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const clampClipPercent = (value: number): number =>
  Math.max(-100, Math.min(100, value));

export const PARAMETRIC_CLIP_PERCENT_RANGE = {
  min: -100,
  max: 100,
  step: 1,
} as const;

export const PARAMETRIC_CLIP_AXIS_NORMALS: Record<
  ParametricClipAxis,
  [number, number, number]
> = {
  x: [-1, 0, 0],
  y: [0, -1, 0],
  z: [0, 0, -1],
};

const PLANE_MESH_GROUP_NAME = "PlaneMeshes";

const isIfcRenderedModel = (rendered: any): boolean => {
  const groups = rendered?.nestedGroup?.groups;
  if (!groups) return false;

  return Object.entries(groups).some(([path, group]) => (
    path.includes("ifc/")
    || (group instanceof THREE.Object3D && Boolean(group.userData?.ifc))
  ));
};

const getParametricViewerHalfExtent = (
  viewer: ViewerInstance | null,
  axis: ParametricClipAxis,
): number => {
  try {
    const bbox = (viewer as any)?.bbox;
    const vectorIndex = CLIP_AXIS_VECTOR_INDEX[axis];
    const min = bbox?.min?.toArray?.()?.[vectorIndex] ?? bbox?.min?.[axis];
    const max = bbox?.max?.toArray?.()?.[vectorIndex] ?? bbox?.max?.[axis];

    if (!isFiniteNumber(min) || !isFiniteNumber(max)) {
      return Math.max(((viewer as any)?.gridSize ?? 100) / 2, MIN_HALF_EXTENT);
    }

    return Math.max(Math.abs(max - min) / 2, MIN_HALF_EXTENT);
  } catch {
    return 50;
  }
};

const isPercentBasedClipPlane = (
  plane: Viewer3DClipping[ParametricClipAxis],
): boolean => Array.isArray(plane.normal) && plane.normal.length === 3;

export const getParametricClipPercentValue = (
  viewer: ViewerInstance | null,
  axis: ParametricClipAxis,
  plane: Viewer3DClipping[ParametricClipAxis],
): number => {
  if (isPercentBasedClipPlane(plane)) {
    return clampClipPercent(plane.value);
  }

  const halfExtent = getParametricViewerHalfExtent(viewer, axis);
  return clampClipPercent((plane.value / halfExtent) * 100);
};

export const getParametricClipActualValue = (
  viewer: ViewerInstance | null,
  axis: ParametricClipAxis,
  plane: Viewer3DClipping[ParametricClipAxis],
): number => {
  if (!plane.enabled) {
    return getParametricViewerHalfExtent(viewer, axis) * DISABLE_MARGIN_FACTOR;
  }

  if (!isPercentBasedClipPlane(plane)) {
    return plane.value;
  }

  const halfExtent = getParametricViewerHalfExtent(viewer, axis);
  return (clampClipPercent(plane.value) / 100) * halfExtent;
};

const getActiveParametricClipIndices = (
  clipping: Viewer3DClipping,
): Array<0 | 1 | 2> => {
  const activeIndices: Array<0 | 1 | 2> = [];

  for (const axis of CLIPPING_AXES) {
    if (clipping[axis].enabled) {
      activeIndices.push(CLIP_AXIS_INDEX[axis]);
    }
  }

  return activeIndices;
};

const applyParametricClipPlaneSubset = (
  rendered: any,
  clipping: Viewer3DClipping,
  hasAnyClip: boolean,
): void => {
  const activeIndices = getActiveParametricClipIndices(clipping);
  const activeIndexSet = new Set(activeIndices);
  const shouldMirrorSingleAxisClip = shouldMirrorSingleAxisIntersection(clipping);
  const suppressCapMeshes = isIfcRenderedModel(rendered) && !clipping.objectColorCaps;

  const activeClipPlanes = hasAnyClip
    ? activeIndices
        .map((index) => (
          shouldMirrorSingleAxisClip
            ? rendered?.clipping?.reverseClipPlanes?.[index]
            : rendered?.clipping?.clipPlanes?.[index]
        ))
        .filter(Boolean)
    : [];

  const capAndHelperPlaneByIndex = new Map(
    activeIndices
      .map((index) => [
        index,
        clipping.intersection
          ? rendered?.clipping?.reverseClipPlanes?.[index]
          : rendered?.clipping?.clipPlanes?.[index],
      ])
      .filter((entry): entry is [0 | 1 | 2, any] => Boolean(entry[1])),
  );

  const capAndHelperPlanes = Array.from(capAndHelperPlaneByIndex.values());

  rendered?.nestedGroup?.setClipPlanes?.(activeClipPlanes);
  rendered?.clipping?.setVisible?.(hasAnyClip);

  const planeHelpers = rendered?.clipping?.planeHelpers;
  if (planeHelpers) {
    planeHelpers.visible = hasAnyClip && clipping.showPlanes;

    for (const helper of planeHelpers.children ?? []) {
      const helperMesh = helper as THREE.Mesh & { index?: 0 | 1 | 2 };
      const helperIndex = helperMesh.index;
      const isActive = helperIndex != null && activeIndexSet.has(helperIndex);
      const ownPlane = helperIndex == null ? null : capAndHelperPlaneByIndex.get(helperIndex);

      helper.visible = planeHelpers.visible && isActive;

      if (helperMesh.material && "clippingPlanes" in helperMesh.material) {
        (helperMesh.material as THREE.Material & { clippingPlanes: unknown[] }).clippingPlanes = ownPlane
          ? capAndHelperPlanes.filter((plane) => plane !== ownPlane)
          : [];
      }
    }
  }

  for (const child of rendered?.nestedGroup?.rootGroup?.children ?? []) {
    if (child?.name !== PLANE_MESH_GROUP_NAME) continue;

    child.visible = !suppressCapMeshes;

    for (const capPlane of child.children ?? []) {
      const capPlaneMesh = capPlane as THREE.Mesh & { index?: 0 | 1 | 2 };
      const capPlaneIndex = capPlaneMesh.index;
      const isActive = hasAnyClip && capPlaneIndex != null && activeIndexSet.has(capPlaneIndex);
      const shouldShowCapPlane = isActive && !suppressCapMeshes;
      const ownPlane = capPlaneIndex == null ? null : capAndHelperPlaneByIndex.get(capPlaneIndex);

      capPlane.visible = shouldShowCapPlane;

      if (capPlaneMesh.material) {
        const mat = capPlaneMesh.material as THREE.Material & { clippingPlanes?: unknown[] };
        if ("visible" in mat) {
          mat.visible = shouldShowCapPlane;
        }

        if ("clippingPlanes" in mat) {
          mat.clippingPlanes = ownPlane
            ? capAndHelperPlanes.filter((plane) => plane !== ownPlane)
            : [];
        }
      }
    }
  }
};

export const applyParametricClipping = (
  viewer: ViewerInstance | null,
  clipping: Viewer3DClipping,
): void => {
  let rendered: any;
  try {
    rendered = (viewer as any)?.rendered;
  } catch {
    return;
  }

  if (!rendered?.clipping) return;

  const hasAnyClip = CLIPPING_AXES.some(
    (axis) => clipping[axis].enabled,
  );

  for (const axis of CLIPPING_AXES) {
    const index = CLIP_AXIS_INDEX[axis];
    const plane = clipping[axis];
    const actualValue = getParametricClipActualValue(viewer, axis, plane);
    (viewer as any)?.setClipSlider?.(index, actualValue, false);
  }

  (viewer as any)?.setClipIntersection?.(clipping.intersection, false);
  (viewer as any)?.setClipPlaneHelpers?.(clipping.showPlanes, false);
  (viewer as any)?.setLocalClipping?.(hasAnyClip);

  rendered.nestedGroup?.setBackVisible?.(hasAnyClip);
  applyParametricClipPlaneSubset(rendered, clipping, hasAnyClip);

  (viewer as any)?.update?.(true);
};
