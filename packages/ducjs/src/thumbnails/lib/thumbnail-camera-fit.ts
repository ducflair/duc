import * as THREE from "three";
import { Viewer } from "three-cad-viewer";

type ThreeViewer = InstanceType<typeof Viewer>;

type MutableViewerBoundsCache = ThreeViewer & {
  bbox: {
    center?: () => [number, number, number];
    boundingSphere?: () => {
      center?: { x: number; y: number; z: number };
      radius?: number;
    };
  } | null;
  lastBbox: unknown | null;
  bboxNeedsUpdate: boolean;
  bb_radius: number;
};

const BOUNDS_EXCLUDED_OBJECT_NAMES = new Set([
  "PlaneHelpers",
  "PlaneMeshes",
  "__parametricInspectOverlay",
  "__parametricCopyOverlay",
]);

const BOUNDS_EXCLUDED_OBJECT_TYPES = new Set([
  "AxesHelper",
  "GridHelper",
  "PlaneHelper",
]);

const isExcludedFromBounds = (object: THREE.Object3D): boolean => {
  const name = object.name ?? "";
  return (
    BOUNDS_EXCLUDED_OBJECT_NAMES.has(name)
    || name.startsWith("__clipHelper_")
    || name.startsWith("__thumbnailIgnore")
    || BOUNDS_EXCLUDED_OBJECT_TYPES.has(object.type)
  );
};

const collectVisibleShapeBounds = (viewer: ThreeViewer): THREE.Box3 | null => {
  const rootGroup = (viewer as any).rendered?.nestedGroup?.rootGroup;
  if (!rootGroup) return null;

  try {
    (viewer as any).animation?.update?.();
  } catch {
    // Animation may not exist or may throw; best-effort update.
  }

  try {
    viewer.update?.(true);
  } catch {
    // Viewer may not be fully initialised; best-effort update.
  }

  rootGroup.updateMatrixWorld(true);

  const bounds = new THREE.Box3();
  const tempBox = new THREE.Box3();
  let hasBounds = false;

  rootGroup.traverse((object: THREE.Object3D) => {
    if (!object.visible || isExcludedFromBounds(object)) return;
    if (!(object as { geometry?: unknown }).geometry) return;

    tempBox.setFromObject(object);
    if (tempBox.isEmpty()) return;

    bounds.union(tempBox);
    hasBounds = true;
  });

  return hasBounds && !bounds.isEmpty() ? bounds : null;
};

const getFallbackFitDirection = (viewer: ThreeViewer): THREE.Vector3 => {
  const up = (() => {
    try {
      const value = (viewer as any).state?.get?.("up" as never);
      return typeof value === "string" ? value : "Z";
    } catch {
      return "Z";
    }
  })();

  return up === "Y"
    ? new THREE.Vector3(1, 1, 1).normalize()
    : new THREE.Vector3(1, -1, 1).normalize();
};

/**
 * Fit an orthographic camera so that the given world-space bounds fill the
 * render canvas at the given pixel dimensions, preserving the content aspect
 * ratio. The frustum is computed in two passes:
 *
 *  1. Position the camera and project the 8 bounding-box corners into
 *     camera space to find the screen-space extents of the content.
 *  2. Expand the frustum so the content fills the canvas without distortion,
 *     adding a small padding factor around the content.
 *
 * The resulting frustum aspect is guaranteed to equal `canvasAspect`, so no
 * stretching occurs during rendering.
 */
const fitOrthographicCameraToBounds = (
  camera: THREE.OrthographicCamera,
  bounds: THREE.Box3,
  target: THREE.Vector3,
  direction: THREE.Vector3,
  radius: number,
  paddingFactor: number,
  canvasAspect: number,
): void => {
  const corners: THREE.Vector3[] = [];
  const { min, max } = bounds;
  for (let i = 0; i < 8; i++) {
    corners.push(new THREE.Vector3(
      (i & 1) ? max.x : min.x,
      (i & 2) ? max.y : min.y,
      (i & 4) ? max.z : min.z,
    ));
  }

  const distance = Math.max(radius * 4, 1);
  camera.position.copy(target).add(direction.clone().multiplyScalar(distance));
  camera.lookAt(target);
  camera.zoom = 1;
  camera.updateMatrixWorld(true);

  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  const projected = new THREE.Box3();
  for (const corner of corners) {
    projected.expandByPoint(corner.clone().applyMatrix4(camera.matrixWorldInverse));
  }

  const center = projected.getCenter(new THREE.Vector3());
  const size = projected.getSize(new THREE.Vector3());
  const contentWidth = Math.max(size.x, Number.EPSILON) * paddingFactor;
  const contentHeight = Math.max(size.y, Number.EPSILON) * paddingFactor;
  const contentAspect = contentWidth / contentHeight;

  let frustumWidth: number;
  let frustumHeight: number;

  if (contentAspect > canvasAspect) {
    frustumWidth = contentWidth;
    frustumHeight = contentWidth / canvasAspect;
  } else {
    frustumHeight = contentHeight;
    frustumWidth = contentHeight * canvasAspect;
  }

  camera.left = center.x - frustumWidth / 2;
  camera.right = center.x + frustumWidth / 2;
  camera.bottom = center.y - frustumHeight / 2;
  camera.top = center.y + frustumHeight / 2;

  const depth = Math.max(size.z, radius, 1);
  camera.near = Math.max(0.001, -projected.max.z - depth);
  camera.far = Math.max(camera.near + 1, -projected.min.z + depth);
  camera.updateProjectionMatrix();
};

/**
 * Fit a perspective camera so that the given world-space bounds fill the
 * render canvas at the given pixel dimensions. The camera distance is chosen
 * so that the projected content fits within the field of view, with padding.
 */
const fitPerspectiveCameraToBounds = (
  camera: THREE.PerspectiveCamera,
  bounds: THREE.Box3,
  target: THREE.Vector3,
  direction: THREE.Vector3,
  radius: number,
  paddingFactor: number,
): void => {
  const corners: THREE.Vector3[] = [];
  const { min, max } = bounds;
  for (let i = 0; i < 8; i++) {
    corners.push(new THREE.Vector3(
      (i & 1) ? max.x : min.x,
      (i & 2) ? max.y : min.y,
      (i & 4) ? max.z : min.z,
    ));
  }

  camera.position.copy(target).add(direction.clone().multiplyScalar(Math.max(radius * 4, 1)));
  camera.lookAt(target);
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  const projected = new THREE.Box3();
  for (const corner of corners) {
    projected.expandByPoint(corner.clone().applyMatrix4(camera.matrixWorldInverse));
  }

  const center = projected.getCenter(new THREE.Vector3());
  const halfWidth = Math.max(Math.abs(projected.max.x - center.x), Math.abs(center.x - projected.min.x));
  const halfHeight = Math.max(Math.abs(projected.max.y - center.y), Math.abs(center.y - projected.min.y));

  const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanX = tanY * camera.aspect;

  const distanceByWidth = (halfWidth * paddingFactor) / tanX;
  const distanceByHeight = (halfHeight * paddingFactor) / tanY;
  const distance = Math.max(distanceByWidth, distanceByHeight, radius, 1);

  camera.position.copy(target).add(direction.clone().multiplyScalar(distance));
  camera.lookAt(target);
  camera.updateMatrixWorld(true);

  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  const reprojected = new THREE.Box3();
  for (const corner of corners) {
    reprojected.expandByPoint(corner.clone().applyMatrix4(camera.matrixWorldInverse));
  }

  const depth = Math.max(reprojected.getSize(new THREE.Vector3()).z, radius, 1);
  camera.near = Math.max(0.001, -reprojected.max.z - depth);
  camera.far = Math.max(camera.near + 1, -reprojected.min.z + depth);
  camera.updateProjectionMatrix();
};

const fitCameraToBounds = (
  viewer: ThreeViewer,
  bounds: THREE.Box3,
  paddingFactor: number,
  canvasAspect?: number,
): boolean => {
  try {
    const cameraManager = (viewer as any).rendered.camera;
    const controls = (viewer as any).rendered.controls;
    const currentCamera = cameraManager.getCamera?.();
    if (!currentCamera) return false;

    const target = bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, Number.EPSILON);
    const currentTarget = controls.getTarget?.()?.clone?.() ?? controls.target?.clone?.() ?? target.clone();
    let direction = currentCamera.position.clone().sub(currentTarget);

    if (direction.lengthSq() <= 1e-6) {
      direction = currentCamera.position.clone().sub(target);
    }

    if (direction.lengthSq() <= 1e-6) {
      direction = getFallbackFitDirection(viewer);
    } else {
      direction.normalize();
    }

    cameraManager.target.copy(target);

    if ((currentCamera as THREE.OrthographicCamera).isOrthographicCamera) {
      const aspect = canvasAspect ?? (currentCamera as THREE.OrthographicCamera).right - (currentCamera as THREE.OrthographicCamera).left > 0
        ? ((currentCamera as THREE.OrthographicCamera).right - (currentCamera as THREE.OrthographicCamera).left) /
          ((currentCamera as THREE.OrthographicCamera).top - (currentCamera as THREE.OrthographicCamera).bottom)
        : 16 / 9;
      fitOrthographicCameraToBounds(
        currentCamera as THREE.OrthographicCamera,
        bounds,
        target,
        direction,
        radius,
        paddingFactor,
        aspect,
      );
    } else if ((currentCamera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      fitPerspectiveCameraToBounds(
        currentCamera as THREE.PerspectiveCamera,
        bounds,
        target,
        direction,
        radius,
        paddingFactor,
      );
    } else {
      cameraManager.updateFarPlane(radius);
      cameraManager.updateCameraDistance(radius);
      cameraManager.setupCamera(true, direction, null, null);
      cameraManager.lookAtTarget();
    }

    controls.setTarget?.(target.clone());
    controls.update?.();
    viewer.update(true);
    return true;
  } catch {
    return false;
  }
};

export const fitThreeCadViewerCameraToBounds = (viewer: ThreeViewer): boolean => {
  try {
    const mutableViewer = viewer as MutableViewerBoundsCache;

    try {
      (viewer as any).updateBounds?.();
    } catch {
      // three-cad-viewer can throw while bounds are settling; use its current cache.
    }

    const sphere = mutableViewer.bbox?.boundingSphere?.();
    const bboxCenter = mutableViewer.bbox?.center?.();
    const currentCamera = (viewer as any).rendered.camera.getCamera?.();

    if (!currentCamera || !sphere?.center) {
      return false;
    }

    const target = Array.isArray(bboxCenter)
      ? new THREE.Vector3(...bboxCenter)
      : new THREE.Vector3(sphere.center.x, sphere.center.y, sphere.center.z);

    const radius = Math.max(sphere.radius ?? mutableViewer.bb_radius, Number.EPSILON);
    const bounds = new THREE.Box3(
      target.clone().subScalar(radius),
      target.clone().addScalar(radius),
    );
    return fitCameraToBounds(viewer, bounds, 1.0);
  } catch {
    return false;
  }
};

export const fitThreeCadViewerCameraToVisibleScene = (
  viewer: ThreeViewer,
  canvasAspect?: number,
): boolean => {
  try {
    const bounds = collectVisibleShapeBounds(viewer);
    if (!bounds) return false;
    return fitCameraToBounds(viewer, bounds, 1.08, canvasAspect);
  } catch {
    return false;
  }
};

export const snapshotThreeCadViewerCamera = (viewer: ThreeViewer): (() => void) | null => {
  try {
    const cameraManager = (viewer as any).rendered.camera;
    const controls = (viewer as any).rendered.controls;
    const camera = cameraManager.getCamera?.();
    if (!camera) return null;

    const position = camera.position.clone();
    const quaternion = camera.quaternion.clone();
    const cameraWithZoom = camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    const zoom = cameraManager.getZoom?.() ?? cameraWithZoom.zoom ?? 1;
    const target = controls.getTarget?.()?.clone?.() ?? controls.target?.clone?.() ?? cameraManager.target?.clone?.() ?? null;

    return () => {
      try {
        cameraManager.setPosition?.(position.clone(), false);
        camera.position.copy(position);
        cameraManager.setQuaternion?.(quaternion.clone());
        camera.quaternion.copy(quaternion);

        if (typeof zoom === "number" && Number.isFinite(zoom)) {
          cameraManager.setZoom?.(zoom);
          cameraWithZoom.zoom = zoom;
          cameraWithZoom.updateProjectionMatrix?.();
        }

        if (target) {
          cameraManager.target?.copy?.(target);
          controls.setTarget?.(target.clone());
          controls.target?.copy?.(target);
        }

        controls.update?.();
        viewer.update(true);
      } catch {
        // Restore is best-effort; the overlay may be unmounting immediately after capture.
      }
    };
  } catch {
    return null;
  }
};
