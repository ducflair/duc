import * as THREE from 'three';
import { Viewer } from 'three-cad-viewer';

type ViewerInstance = InstanceType<typeof Viewer>;

const THUMBNAIL_HIDDEN_OBJECT_NAMES = new Set([
  'PlaneHelpers',
  'PlaneMeshes',
  '__parametricInspectOverlay',
  '__parametricCopyOverlay',
]);

const THUMBNAIL_HIDDEN_OBJECT_TYPES = new Set([
  'AxesHelper',
  'GridHelper',
  'PlaneHelper',
]);

export const THUMBNAIL_HIDDEN_OBJECT_PREFIX = '__thumbnailIgnore';

type ThumbnailRendererMode = 'parametric' | 'dxf';

interface PrepareSceneForThumbnailCaptureOptions {
  scene: THREE.Scene;
  rendererMode: ThumbnailRendererMode;
  parametricViewer?: ViewerInstance | null;
}

const getBooleanValue = (value: unknown): boolean | null => (
  typeof value === 'boolean' ? value : null
);

const getBooleanTriple = (value: unknown): [boolean, boolean, boolean] | null => {
  if (!Array.isArray(value) || value.length !== 3) return null;
  return [Boolean(value[0]), Boolean(value[1]), Boolean(value[2])];
};

const shouldHideObjectForThumbnail = (object: THREE.Object3D): boolean => {
  const name = object.name ?? '';

  return (
    THUMBNAIL_HIDDEN_OBJECT_NAMES.has(name)
    || name.startsWith('__clipHelper_')
    || name.startsWith(THUMBNAIL_HIDDEN_OBJECT_PREFIX)
    || THUMBNAIL_HIDDEN_OBJECT_TYPES.has(object.type)
  );
};

export const prepareSceneForThumbnailCapture = ({
  scene,
  rendererMode,
  parametricViewer,
}: PrepareSceneForThumbnailCaptureOptions): (() => void) => {
  const restoreFns: Array<() => void> = [];

  const previousBackground = scene.background;
  if (previousBackground !== null) {
    scene.background = null;
    restoreFns.push(() => {
      scene.background = previousBackground;
    });
  }

  scene.traverse((object) => {
    if (!shouldHideObjectForThumbnail(object) || object.visible === false) return;

    const previousVisibility = object.visible;
    object.visible = false;
    restoreFns.push(() => {
      object.visible = previousVisibility;
    });
  });

  if (rendererMode === 'parametric' && parametricViewer) {
    const renderer = (parametricViewer as any).renderer;
    if (renderer?.setClearColor && renderer?.getClearColor) {
      const prevColor = new THREE.Color();
      renderer.getClearColor(prevColor);
      const prevAlpha = renderer.getClearAlpha?.() ?? 0;
      renderer.setClearColor(0x000000, 0);
      restoreFns.push(() => {
        renderer.setClearColor(prevColor, prevAlpha);
      });
    }
    const stateGet = (key: string): unknown => {
      try {
        return (parametricViewer as any)?.state?.get?.(key as never);
      } catch {
        return undefined;
      }
    };

    const currentAxes = getBooleanValue(stateGet('axes'));
    if (currentAxes) {
      (parametricViewer as any)?.setAxes?.(false, false);
      restoreFns.push(() => (parametricViewer as any)?.setAxes?.(currentAxes, false));
    }

    const currentGrids = getBooleanTriple(stateGet('grid'));
    if (currentGrids && currentGrids.some(Boolean)) {
      (parametricViewer as any)?.setGrids?.(currentGrids.map(() => false) as [boolean, boolean, boolean], false);
      restoreFns.push(() => (parametricViewer as any)?.setGrids?.(currentGrids, false));
    }

    const currentClipHelpers = getBooleanValue(
      (parametricViewer as any)?.getClipPlaneHelpers?.() ?? stateGet('clipPlaneHelpers'),
    );
    if (currentClipHelpers) {
      (parametricViewer as any)?.setClipPlaneHelpers?.(false, false);
      restoreFns.push(() => (parametricViewer as any)?.setClipPlaneHelpers?.(currentClipHelpers, false));
    }

    const lastBbox = (parametricViewer as any)?.lastBbox?.bbox as THREE.Object3D | undefined;
    if (lastBbox && lastBbox.visible !== false) {
      const previousVisibility = lastBbox.visible;
      lastBbox.visible = false;
      restoreFns.push(() => {
        lastBbox.visible = previousVisibility;
      });
    }
  }

  return () => {
    for (let index = restoreFns.length - 1; index >= 0; index -= 1) {
      restoreFns[index]?.();
    }
  };
};
