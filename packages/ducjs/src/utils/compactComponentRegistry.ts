/**
 * Memory-compact replacement for three-cad-viewer's id-picking ComponentRegistry.
 *
 * The stock registry stores a record per face, edge and vertex whose `path` is a
 * freshly concatenated `${nodePath}/faces/faces_${i}` string, and indexes every
 * record by that string. Node paths are the full assembly path, so a dense model
 * retains hundreds of thousands of ~200-byte strings (80+ MB for a 360k-component
 * tokamak assembly). This registry keeps the shared node path plus the component
 * index and derives `path` / `name` on demand, exposing the same interface.
 */

type ComponentTopo = "face" | "edge" | "vertex";

interface ComponentInfo {
  path: string;
  name: string;
  topo: string;
  subtype?: string | null;
  solidPath?: string | null;
}

type ComponentRecord = ComponentInfo & { id: number };

const TOPO_SEGMENTS: Record<ComponentTopo, string> = {
  face: "faces",
  edge: "edges",
  vertex: "vertices",
};

const SEGMENT_TOPOS: Record<string, ComponentTopo> = {
  faces: "face",
  edges: "edge",
  vertices: "vertex",
};

const COMPONENT_PATH = /^(.*)\/(faces|edges|vertices)\/\2_(\d+)$/;

class CompactComponent {
  constructor(
    readonly id: number,
    readonly topo: ComponentTopo,
    readonly index: number,
    readonly nodePath: string,
    readonly subtype: string | null,
    readonly solidPath: string | null,
  ) {}

  get path(): string {
    const segment = TOPO_SEGMENTS[this.topo];
    return `${this.nodePath}/${segment}/${segment}_${this.index}`;
  }

  get name(): string {
    return `${TOPO_SEGMENTS[this.topo]}_${this.index}`;
  }
}

type NodeComponents = Partial<Record<ComponentTopo, number[]>>;

export class CompactComponentRegistry {
  private records: (ComponentRecord | CompactComponent | undefined)[] = [];
  // Dense id-ordered list: hover and selection walk every component per pointer move.
  private ordered: (ComponentRecord | CompactComponent)[] = [];
  private byNode = new Map<string, NodeComponents>();
  private byPath = new Map<string, ComponentRecord>();
  private nextId = 1;

  register(info: ComponentInfo): number {
    const id = this.nextId;
    this.nextId += 1;
    const compact = this.toCompact(id, info);
    if (compact) {
      this.records[id] = compact;
      this.ordered.push(compact);
      const node = this.byNode.get(compact.nodePath) ?? {};
      (node[compact.topo] ??= [])[compact.index] = id;
      this.byNode.set(compact.nodePath, node);
    } else {
      const record = { ...info, id };
      this.records[id] = record;
      this.ordered.push(record);
      this.byPath.set(record.path, record);
    }
    return id;
  }

  get(id: number): ComponentRecord | CompactComponent | undefined {
    return this.records[id];
  }

  getByPath(path: string): ComponentRecord | CompactComponent | undefined {
    const match = COMPONENT_PATH.exec(path);
    if (match) {
      const id = this.byNode.get(match[1])?.[SEGMENT_TOPOS[match[2]]]?.[Number(match[3])];
      const record = id === undefined ? undefined : this.records[id];
      if (record) return record;
    }
    return this.byPath.get(path);
  }

  entries(): IterableIterator<ComponentRecord | CompactComponent> {
    return this.ordered.values();
  }

  get maxId(): number {
    return this.nextId - 1;
  }

  get size(): number {
    return this.ordered.length;
  }

  removeByPathPrefix(prefix: string): void {
    const sub = `${prefix}/`;
    this.ordered = this.ordered.filter((record) => {
      const path = record.path;
      if (path !== prefix && !path.startsWith(sub)) return true;
      this.records[record.id] = undefined;
      if (record instanceof CompactComponent) {
        const ids = this.byNode.get(record.nodePath)?.[record.topo];
        if (ids?.[record.index] === record.id) delete ids[record.index];
      } else if (this.byPath.get(path) === record) {
        this.byPath.delete(path);
      }
      return false;
    });
  }

  clear(): void {
    this.records = [];
    this.ordered = [];
    this.byNode.clear();
    this.byPath.clear();
    this.nextId = 1;
  }

  /**
   * Solid components are registered with `solidPath` set to their node path, so the
   * shared node string can be reused without flattening the concatenated `path`.
   * The length check confirms `path === ${solidPath}/${segment}/${name}` in O(1).
   */
  private toCompact(id: number, info: ComponentInfo): CompactComponent | null {
    const topo = info.topo as ComponentTopo;
    const segment = TOPO_SEGMENTS[topo];
    const nodePath = info.solidPath;
    if (!segment || !nodePath || !info.name.startsWith(`${segment}_`)) return null;
    const index = Number(info.name.slice(segment.length + 1));
    if (!Number.isSafeInteger(index) || index < 0) return null;
    if (info.path.length !== nodePath.length + segment.length + info.name.length + 2) return null;
    return new CompactComponent(id, topo, index, nodePath, info.subtype ?? null, nodePath);
  }
}

type NestedGroupLike = {
  assignIds?: boolean;
  registry?: { size?: number; register?: unknown };
  render?: (...args: unknown[]) => unknown;
  dispose?: () => void;
};

type ShapeRendererLike = {
  _renderTessellatedShapes?: (shapes: unknown, assignIds?: boolean) => NestedGroupLike;
};

const installedPrototypes = new WeakSet<object>();

const REGISTRY_PROBE_SHAPES = {
  version: 3,
  id: "/__registry_probe",
  name: "__registry_probe",
  loc: [[0, 0, 0], [0, 0, 0, 1]],
  parts: [],
};

/**
 * Makes every id-picking scene built by this three-cad-viewer module use
 * {@link CompactComponentRegistry}. The registry class is internal, so the
 * nested group class is discovered through an empty, GPU-free tessellation and
 * its `render` swaps in the compact registry before any component registers.
 * Call after constructing a Viewer and before `viewer.render`. Returns false and
 * leaves the viewer untouched when the internals do not match.
 */
export function installCompactComponentRegistry(viewer: unknown): boolean {
  try {
    const renderer = (viewer as { getShapeRenderer?: () => ShapeRendererLike }).getShapeRenderer?.();
    const probe = renderer?._renderTessellatedShapes?.(structuredClone(REGISTRY_PROBE_SHAPES), false);
    const proto = probe ? Object.getPrototypeOf(probe) as NestedGroupLike : null;
    probe?.dispose?.();
    if (!proto || typeof proto.render !== "function" || typeof probe?.registry?.register !== "function") {
      return false;
    }
    if (installedPrototypes.has(proto)) return true;

    const render = proto.render;
    proto.render = function renderWithCompactRegistry(this: NestedGroupLike, ...args: unknown[]) {
      if (this.assignIds && !(this.registry instanceof CompactComponentRegistry) && this.registry?.size === 0) {
        this.registry = new CompactComponentRegistry() as unknown as NestedGroupLike["registry"];
      }
      return render.apply(this, args);
    };
    installedPrototypes.add(proto);
    return true;
  } catch {
    return false;
  }
}
