import { describe, expect, test } from "bun:test";
import { CompactComponentRegistry, installCompactComponentRegistry } from "../src/utils/compactComponentRegistry";
import { withBatchedViewerUpdates } from "../src/utils/viewerUpdateBatch";

const SOLID = "/Assembly (Rev C)/Bioshield segment @ 340 deg (2 m concrete)";

// Mirrors three-cad-viewer's buildFaceComponentIds / buildEdgeComponentIds calls.
const registerSolid = (registry: CompactComponentRegistry, path: string, faces: number, edges: number) => {
  const ids: number[] = [];
  for (let i = 0; i < faces; i++) {
    ids.push(registry.register({ path: `${path}/faces/faces_${i}`, name: `faces_${i}`, topo: "face", subtype: "solid", solidPath: path }));
  }
  for (let i = 0; i < edges; i++) {
    ids.push(registry.register({ path: `${path}/edges/edges_${i}`, name: `edges_${i}`, topo: "edge", subtype: "solid", solidPath: path }));
  }
  return ids;
};

describe("CompactComponentRegistry", () => {
  test("matches the stock registry interface for solid components", () => {
    const registry = new CompactComponentRegistry();
    const ids = registerSolid(registry, SOLID, 3, 2);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
    expect(registry.size).toBe(5);
    expect(registry.maxId).toBe(5);

    const face = registry.get(2)!;
    expect(face.path).toBe(`${SOLID}/faces/faces_1`);
    expect(face.name).toBe("faces_1");
    expect(face.topo).toBe("face");
    expect(face.subtype).toBe("solid");
    expect(face.solidPath).toBe(SOLID);
    expect(registry.getByPath(`${SOLID}/edges/edges_1`)?.id).toBe(5);
    expect(registry.getByPath(`${SOLID}/faces/faces_9`)).toBeUndefined();
    expect([...registry.entries()].map((entry) => entry.id)).toEqual(ids);
  });

  test("keeps full records for components without a solid path", () => {
    const registry = new CompactComponentRegistry();
    const id = registry.register({ path: "/Sketch/edges/edges_0", name: "edges_0", topo: "edge", subtype: null, solidPath: null });
    expect(registry.get(id)?.path).toBe("/Sketch/edges/edges_0");
    expect(registry.getByPath("/Sketch/edges/edges_0")?.id).toBe(id);
  });

  test("removes a subtree without recycling ids", () => {
    const registry = new CompactComponentRegistry();
    registerSolid(registry, `${SOLID}/a`, 2, 0);
    registerSolid(registry, `${SOLID}/b`, 1, 0);
    registry.removeByPathPrefix(`${SOLID}/a`);
    expect(registry.size).toBe(1);
    expect(registry.maxId).toBe(3);
    expect(registry.getByPath(`${SOLID}/a/faces/faces_0`)).toBeUndefined();
    expect([...registry.entries()].map((entry) => entry.path)).toEqual([`${SOLID}/b/faces/faces_0`]);
    expect(registry.register({ path: `${SOLID}/c/faces/faces_0`, name: "faces_0", topo: "face", subtype: "solid", solidPath: `${SOLID}/c` })).toBe(4);
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.maxId).toBe(0);
  });

  test("installs onto the nested group class discovered from the viewer", () => {
    class StockRegistry {
      size = 0;
      register() { return ++this.size; }
    }
    class NestedGroup {
      assignIds = false;
      registry: unknown = new StockRegistry();
      render() { return this.registry; }
      dispose() {}
    }
    const viewer = { getShapeRenderer: () => ({ _renderTessellatedShapes: () => new NestedGroup() }) };
    expect(installCompactComponentRegistry(viewer)).toBe(true);
    expect(installCompactComponentRegistry(viewer)).toBe(true);

    const picking = new NestedGroup();
    picking.assignIds = true;
    expect(picking.render()).toBeInstanceOf(CompactComponentRegistry);
    const plain = new NestedGroup();
    expect(plain.render()).toBeInstanceOf(StockRegistry);
    expect(installCompactComponentRegistry({})).toBe(false);
  });
});

describe("withBatchedViewerUpdates", () => {
  const createViewer = () => ({
    _suppressUpdate: false,
    paints: 0,
    update(_marker?: boolean, _notify = true) {
      if (this._suppressUpdate) return;
      this.paints++;
    },
    setter() {
      this.update(true, false);
    },
  });

  test("collapses setter repaints into one final paint", () => {
    const viewer = createViewer();
    expect(withBatchedViewerUpdates(viewer, () => { viewer.setter(); viewer.setter(); return "ok"; })).toBe("ok");
    expect(viewer.paints).toBe(1);
    expect(viewer._suppressUpdate).toBe(false);
  });

  test("skips the paint when nothing requested one and defers nested batches", () => {
    const viewer = createViewer();
    withBatchedViewerUpdates(viewer, () => undefined);
    expect(viewer.paints).toBe(0);
    withBatchedViewerUpdates(viewer, () => {
      withBatchedViewerUpdates(viewer, () => viewer.setter());
      expect(viewer.paints).toBe(0);
    });
    expect(viewer.paints).toBe(1);
  });

  test("restores the viewer and still paints when a setter throws", () => {
    const viewer = createViewer();
    const update = viewer.update;
    expect(() => withBatchedViewerUpdates(viewer, () => { viewer.setter(); throw new Error("boom"); })).toThrow("boom");
    expect(viewer.update).toBe(update);
    expect(viewer.paints).toBe(1);
  });
});
