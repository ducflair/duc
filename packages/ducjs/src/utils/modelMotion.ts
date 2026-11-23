type Track = {
  path: string;
  action: string;
  times: number[];
  values: (number | number[])[];
};
type Motion = { animation: Track[]; explode: Track[]; ifc: boolean };
type Viewer = {
  state?: { get(key: any): unknown };
  rendered?: { nestedGroup?: { groups?: Record<string, unknown> } };
  hasAnimation?(): boolean;
  backupAnimation?(): void;
  restoreAnimation?(): void;
  clearAnimation?(): void;
  explode?(duration: number, speed: number, multiplier: number): void;
  setExplode?(active: boolean): void;
  initAnimation?(
    duration: number,
    speed: number,
    label: string,
    repeat: boolean,
  ): void;
  addPositionTrack?(path: string, times: number[], values: number[][]): void;
  addQuaternionTrack?(path: string, times: number[], values: number[][]): void;
  addTranslationTrack?(
    path: string,
    axis: any,
    times: number[],
    values: number[],
  ): void;
  addRotationTrack?(
    path: string,
    axis: any,
    times: number[],
    values: number[],
  ): void;
  setRelativeTime?(fraction: number): void;
  update?(marker: boolean): void;
};
const motions = new WeakMap<object, Motion>();
const activeExplosions = new WeakSet<object>();

function tracks(input: unknown): Track[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const [path, action, times, values] = Array.isArray(raw)
      ? raw
      : [raw.path ?? raw.selector, raw.action, raw.times, raw.values];
    if (
      typeof path !== "string" ||
      !["t", "q", "tx", "ty", "tz", "rx", "ry", "rz"].includes(action) ||
      !Array.isArray(times) ||
      times.length < 2 ||
      !times.every(
        (n, i) => Number.isFinite(n) && n >= 0 && (!i || n > times[i - 1]),
      ) ||
      !Array.isArray(values) ||
      values.length !== times.length
    )
      return [];
    const width = action === "t" ? 3 : action === "q" ? 4 : 0;
    if (
      !values.every((v) =>
        width
          ? Array.isArray(v) && v.length === width && v.every(Number.isFinite)
          : Number.isFinite(v),
      )
    )
      return [];
    return [{ path, action, times, values }];
  });
}

function explodeDirections(input: unknown): Track[] {
  if (!input || typeof input !== "object") return [];
  const entries = Array.isArray(input)
    ? input
    : Object.entries(input).map(([path, direction]) => ({ path, direction }));
  return entries.flatMap((entry) => {
    const vector = entry?.direction;
    const distance = entry?.distance ?? 1;
    if (
      typeof entry?.path !== "string" ||
      !Array.isArray(vector) ||
      vector.length !== 3 ||
      !vector.every(Number.isFinite) ||
      !Number.isFinite(distance)
    )
      return [];
    return [
      {
        path: entry.path,
        action: "t",
        times: [0, 1],
        values: [[0, 0, 0], vector.map((n) => n * distance)],
      },
    ];
  });
}

export function readModelMotion(payload: any): Motion {
  const root = payload?.shapes ?? payload;
  const metadata = payload?.metadata ?? root?.metadata;
  const animation =
    payload?.animation ?? metadata?.animation ?? root?.animation;
  const explode = payload?.explode ?? metadata?.explode ?? root?.explode;
  const ifc = metadata?.source === "ifcopenshell" || root?.id === "ifc-model";
  const animationTracks = tracks(
    animation?.tracks ??
      animation?.data ??
      animation ??
      payload?.tracks ??
      root?.tracks,
  );
  const speed = animation?.speed ?? animation?.config?.speed;
  if (Number.isFinite(speed) && speed > 0 && speed !== 1) {
    for (const track of animationTracks)
      track.times = track.times.map((time) => time / speed);
  }
  const explodeTracks = [
    ...tracks(explode?.tracks ?? explode),
    ...explodeDirections(explode?.directions),
  ];
  if (!ifc || (!animationTracks.length && !explodeTracks.length)) {
    return { animation: animationTracks, explode: explodeTracks, ifc };
  }
  // A single IFC product can tessellate into separate groups for each material.
  const products = new Map<string, string[]>();
  const visit = (part: any) => {
    if (part?.ifc && typeof part.id === "string") {
      for (const key of new Set([
        part.ifc.globalId,
        String(part.ifc.expressID),
      ])) {
        if (!key) continue;
        const paths = products.get(key) ?? [];
        paths.push(part.id);
        products.set(key, paths);
      }
    }
    if (Array.isArray(part?.parts)) part.parts.forEach(visit);
  };
  visit(root);
  const resolve = (list: Track[]) =>
    list.flatMap((track) =>
      (products.get(track.path) ?? [track.path]).map((path) => ({
        ...track,
        path,
      })),
    );
  return {
    animation: resolve(animationTracks),
    explode: resolve(explodeTracks),
    ifc,
  };
}
function applyTracks(viewer: Viewer, list: Track[], explosion: boolean) {
  let duration = 0;
  const groups = viewer.rendered?.nestedGroup?.groups;
  for (const { path, action, times, values } of list) {
    if (groups && !Object.prototype.hasOwnProperty.call(groups, path)) continue;
    if (action === "q")
      viewer.addQuaternionTrack?.(path, times, values as number[][]);
    else if (action === "t")
      viewer.addPositionTrack?.(
        path,
        times,
        (values as number[][]).map((v) =>
          v.map((n) => n * (explosion ? 3 : 1)),
        ),
      );
    else if (action[0] === "t")
      viewer.addTranslationTrack?.(
        path,
        action[1],
        times,
        (values as number[]).map((n) => n * (explosion ? 3 : 1)),
      );
    else viewer.addRotationTrack?.(path, action[1], times, values as number[]);
    duration = Math.max(duration, times[times.length - 1]);
  }
  if (duration)
    viewer.initAnimation?.(duration, 1, explosion ? "E" : "A", false);
  return duration;
}
export function configureModelMotion(viewer: Viewer, payload: unknown) {
  activeExplosions.delete(viewer);
  const motion = readModelMotion(payload);
  if (motions.has(viewer) || motion.animation.length) viewer.clearAnimation?.();
  motions.set(viewer, motion);
  if (motion.animation.length) applyTracks(viewer, motion.animation, false);
}
export function applyModelExplode(
  viewer: Viewer,
  active: boolean,
  value: number,
) {
  const config = motions.get(viewer);
  if (!active || (config?.ifc && !config.explode.length)) {
    if (
      activeExplosions.delete(viewer) ||
      viewer.state?.get("animationMode") === "explode"
    )
      viewer.setExplode?.(false);
    return;
  }
  if (!activeExplosions.has(viewer)) {
    if (viewer.hasAnimation?.()) viewer.backupAnimation?.();
    if (config?.explode.length) {
      viewer.clearAnimation?.();
      applyTracks(viewer, config.explode, true);
    }
    // Upstream displaces by (multiplier - 1). Its default 2.5 gives 1.5 at 100%.
    else if (viewer.explode) viewer.explode(2, 1, 5.5);
    else viewer.setExplode?.(true);
    activeExplosions.add(viewer);
  }
  viewer.setRelativeTime?.(Math.min(3, Math.max(0, value)) / 3);
}
