import { describe, expect, it } from "bun:test";
import {
  computeLookAtQuaternion,
  resolveCameraPreset,
  resolveModelViewConfig,
} from "../src/thumbnails/cameraPresets";
import type { Viewer3DState } from "../src/types/elements";

describe("thumbnails camera presets and config resolver", () => {
  it("computes lookAt quaternion for isometric viewpoint", () => {
    const q = computeLookAtQuaternion([100, -100, 100], [0, 0, 0], [0, 0, 1]);
    expect(q).toBeArray();
    expect(q.length).toBe(4);
    // Norm of quaternion should be approximately 1
    const norm = Math.hypot(q[0], q[1], q[2], q[3]);
    expect(Math.abs(norm - 1.0)).toBeLessThan(1e-4);
  });

  it("resolves standard CAD camera presets", () => {
    const presets = ["iso", "top", "bottom", "front", "rear", "left", "right"] as const;
    for (const preset of presets) {
      const transform = resolveCameraPreset(preset, 100);
      expect(transform.position).toBeArray();
      expect(transform.target).toEqual([0, 0, 0]);
      expect(transform.up).toBeArray();
      expect(transform.quaternion.length).toBe(4);
      expect(transform.ortho).toBe(true);
    }
  });

  it("merges viewerState with viewConfig overrides", () => {
    const mockViewerState: Viewer3DState = {
      camera: {
        control: "orbit",
        ortho: true,
        up: "Z",
        position: [10, 20, 30],
        quaternion: [0, 0, 0, 1],
        target: [0, 0, 0],
        zoom: 2.5,
        panSpeed: 1,
        rotateSpeed: 1,
        zoomSpeed: 1,
        holroyd: false,
      },
      display: {
        wireframe: true,
        transparent: false,
        blackEdges: true,
        grid: { type: "uniform", value: false },
        axesVisible: true,
        axesAtOrigin: true,
      },
      material: {
        metalness: 0.8,
        roughness: 0.2,
        defaultOpacity: 0.9,
        edgeColor: 0x111111,
        ambientIntensity: 0.5,
        directIntensity: 1.5,
      },
      clipping: {
        x: { enabled: true, value: 5, normal: [1, 0, 0] },
        y: { enabled: false, value: 0, normal: null },
        z: { enabled: false, value: 0, normal: null },
        intersection: false,
        showPlanes: true,
        objectColorCaps: true,
      },
      explode: { active: true, value: 15 },
      zebra: {
        active: false,
        stripeCount: 10,
        stripeDirection: 0,
        colorScheme: "blackwhite",
        opacity: 0.8,
        mappingMode: "reflection",
      },
    };

    const resolved = resolveModelViewConfig(
      {
        width: 1920,
        height: 1080,
        background: "#222222",
        material: { roughness: 0.4 },
      },
      mockViewerState,
    );

    expect(resolved.width).toBe(1920);
    expect(resolved.height).toBe(1080);
    // User-specified background is preserved
    expect(resolved.background).toBe("#222222");
    expect(resolved.material.metalness).toBe(0.8);
    expect(resolved.material.roughness).toBe(0.4); // Overridden
    expect(resolved.explode.active).toBe(true);
    expect(resolved.explode.value).toBe(15);
    expect(resolved.clipping.x.enabled).toBe(true);

    // Default when none provided is transparent
    const defaultResolved = resolveModelViewConfig({});
    expect(defaultResolved.background).toBe("transparent");

    // Explicit background is preserved
    const chromaticResolved = resolveModelViewConfig({ background: "#3b82f6" });
    expect(chromaticResolved.background).toBe("#3b82f6");
  });
});

