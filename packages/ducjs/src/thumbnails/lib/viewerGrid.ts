import type { Viewer3DGrid, Viewer3DGridPlanes } from "../../types";

export type ViewerGridPlaneKey = keyof Viewer3DGridPlanes;

export const VIEWER_GRID_PLANE_KEYS = ["xy", "xz", "yz"] as const;

export const EMPTY_VIEWER_GRID_PLANES: Viewer3DGridPlanes = {
  xy: false,
  xz: false,
  yz: false,
};

export const ALL_VIEWER_GRID_PLANES: Viewer3DGridPlanes = {
  xy: true,
  xz: true,
  yz: true,
};

export const IFC_VIEWER_GRID_PLANES: Viewer3DGridPlanes = {
  xy: false,
  xz: true,
  yz: false,
};

const cloneViewerGridPlanes = (
  planes: Partial<Viewer3DGridPlanes>,
): Viewer3DGridPlanes => ({
  xy: Boolean(planes.xy),
  xz: Boolean(planes.xz),
  yz: Boolean(planes.yz),
});

const getRawViewerGridPlanes = (
  grid: Viewer3DGrid | null | undefined,
): Partial<Viewer3DGridPlanes> | null => {
  if (!grid || typeof grid !== "object") return null;

  if ("value" in grid && grid.value && typeof grid.value === "object") {
    return grid.value as Partial<Viewer3DGridPlanes>;
  }

  return null;
};

export const getViewerGridPlanes = (
  grid: Viewer3DGrid | null | undefined,
): Viewer3DGridPlanes => {
  const rawPlanes = getRawViewerGridPlanes(grid);
  if (rawPlanes) {
    return cloneViewerGridPlanes(rawPlanes);
  }

  const enabled = Boolean(
    grid && "value" in grid && typeof grid.value === "boolean" ? grid.value : false,
  );

  return enabled ? { ...ALL_VIEWER_GRID_PLANES } : { ...EMPTY_VIEWER_GRID_PLANES };
};

export const hasAnyViewerGridPlaneEnabled = (
  planes: Viewer3DGridPlanes,
): boolean => VIEWER_GRID_PLANE_KEYS.some((planeKey) => planes[planeKey]);

export const isViewerGridEnabled = (
  grid: Viewer3DGrid | null | undefined,
): boolean => hasAnyViewerGridPlaneEnabled(getViewerGridPlanes(grid));

export const createViewerGridState = (
  planes: Partial<Viewer3DGridPlanes>,
): Viewer3DGrid => ({
  type: "perPlane",
  value: cloneViewerGridPlanes(planes),
});

export const setViewerGridEnabled = (
  grid: Viewer3DGrid | null | undefined,
  enabled: boolean,
  fallbackWhenEnabled: Viewer3DGridPlanes = ALL_VIEWER_GRID_PLANES,
): Viewer3DGrid => {
  if (!enabled) {
    return createViewerGridState(EMPTY_VIEWER_GRID_PLANES);
  }

  const currentPlanes = getViewerGridPlanes(grid);
  return createViewerGridState(
    hasAnyViewerGridPlaneEnabled(currentPlanes)
      ? currentPlanes
      : fallbackWhenEnabled,
  );
};

export const setViewerGridPlane = (
  grid: Viewer3DGrid | null | undefined,
  planeKey: ViewerGridPlaneKey,
  enabled: boolean,
): Viewer3DGrid => {
  const currentPlanes = getViewerGridPlanes(grid);
  return createViewerGridState({
    ...currentPlanes,
    [planeKey]: enabled,
  });
};

export const viewerGridPlanesToTuple = (
  planes: Viewer3DGridPlanes,
): [boolean, boolean, boolean] => [planes.xy, planes.xz, planes.yz];
