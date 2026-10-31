import type { Viewer3DState } from "../../types";
import {
  getViewerGridPlanes,
  viewerGridPlanesToTuple,
} from "./viewerGrid";

export interface ThreeCadViewerRenderOptions {
  ambientIntensity: number;
  directIntensity: number;
  metalness: number;
  roughness: number;
  edgeColor: number;
  defaultOpacity: number;
  normalLen: number;
}

export interface ThreeCadViewerViewerOptions {
  control: string;
  ortho: boolean;
  up: string;
  axes: boolean;
  axes0: boolean;
  grid: [boolean, boolean, boolean];
  transparent: boolean;
  blackEdges: boolean;
  zoom: number;
  panSpeed: number;
  rotateSpeed: number;
  zoomSpeed: number;
  holroyd: boolean;
  position: [number, number, number] | null;
  quaternion: [number, number, number, number] | null;
  target: [number, number, number] | null;
}

interface MappedOptions {
  renderOptions: ThreeCadViewerRenderOptions;
  viewerOptions: ThreeCadViewerViewerOptions;
}

const DEFAULT_RENDER_OPTIONS: ThreeCadViewerRenderOptions = {
  ambientIntensity: 1.0,
  directIntensity: 1.1,
  metalness: 0.3,
  roughness: 0.65,
  edgeColor: 0x707070,
  defaultOpacity: 0.5,
  normalLen: 0,
};

const DEFAULT_VIEWER_OPTIONS: ThreeCadViewerViewerOptions = {
  control: "orbit",
  ortho: true,
  up: "Z",
  axes: false,
  axes0: true,
  grid: [false, false, false],
  transparent: false,
  blackEdges: true,
  zoom: 1,
  panSpeed: 1,
  rotateSpeed: 1,
  zoomSpeed: 1,
  holroyd: false,
  position: null,
  quaternion: null,
  target: null,
};

const resolveGrid = (
  grid: Viewer3DState["display"]["grid"],
): [boolean, boolean, boolean] => {
  return viewerGridPlanesToTuple(getViewerGridPlanes(grid));
};

export const mapViewerStateToOptions = (
  state: Viewer3DState | null,
): MappedOptions => {
  if (!state) {
    return {
      renderOptions: { ...DEFAULT_RENDER_OPTIONS },
      viewerOptions: { ...DEFAULT_VIEWER_OPTIONS },
    };
  }

  const { camera, display, material } = state;

  return {
    renderOptions: {
      ambientIntensity: material.ambientIntensity,
      directIntensity: material.directIntensity,
      metalness: material.metalness,
      roughness: material.roughness,
      edgeColor: material.edgeColor,
      defaultOpacity: material.defaultOpacity,
      normalLen: 0,
    },
    viewerOptions: {
      control: camera.control,
      ortho: camera.ortho,
      up: camera.up,
      axes: display.axesVisible,
      axes0: display.axesAtOrigin,
      grid: resolveGrid(display.grid),
      transparent: display.transparent,
      blackEdges: display.blackEdges,
      zoom: camera.zoom,
      panSpeed: camera.panSpeed,
      rotateSpeed: camera.rotateSpeed,
      zoomSpeed: camera.zoomSpeed,
      holroyd: camera.holroyd,
      position: camera.position,
      quaternion: camera.quaternion,
      target: camera.target,
    },
  };
};
