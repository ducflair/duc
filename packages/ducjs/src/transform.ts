/**
 * Post-parse transformation: fix stack element nesting
 * (move stackBase fields to top level for frame/plot elements).
 *
 * Also adds `type` discriminator to version graph entries.
 */
export function transformFromRust(data: any): any {
  if (!data) return data;

  if (data.elements) {
    data.elements = data.elements.map(fixElementFromRust);
  }

  if (data.versionGraph) {
    const vg = data.versionGraph;
    if (vg.checkpoints) {
      vg.checkpoints = vg.checkpoints.map((c: any) => ({ ...c, type: "checkpoint" }));
    }
    if (vg.deltas) {
      vg.deltas = vg.deltas.map((d: any) => ({ ...d, type: "delta" }));
    }
  }

  if (data.layers) {
    data.layers = data.layers.map((layer: any) => {
      if (layer?.overrides) {
        layer = { ...layer, overrides: fixLayerOverridesHatch(layer.overrides, true) };
      }
      return layer;
    });
  }

  if (data.blockInstances) {
    data.blockInstances = data.blockInstances.map((bi: any) => {
      if (Array.isArray(bi?.elementOverrides)) {
        const record: Record<string, string> = {};
        for (const entry of bi.elementOverrides) {
          if (entry?.key !== undefined) record[entry.key] = entry.value;
        }
        return { ...bi, elementOverrides: record };
      }
      return bi;
    });
  }

  if (data.blocks) {
    data.blocks = data.blocks.map((block: any) => {
      if (block?.metadata) fixLocalizationFromRust(block.metadata);
      return block;
    });
  }

  if (data.blockCollections) {
    data.blockCollections = data.blockCollections.map((collection: any) => {
      if (collection?.metadata) fixLocalizationFromRust(collection.metadata);
      return collection;
    });
  }

  return data;
}

/**
 * Pre-serialize transformation: re-wrap stack element fields
 * and flatten PrecisionValue objects to plain numbers for Rust.
 */
export function transformToRust(data: any): any {
  if (!data) return data;

  const result = { ...data };

  if (result.elements) {
    result.elements = result.elements.map((el: any) =>
      coerceElementIntegerFields(flattenPrecisionValues(fixElementToRust(el))),
    );
  }

  if (result.localState) {
    result.localState = normalizeLocalStateForRust(result.localState);
  }

  if (result.globalState) {
    result.globalState = normalizeGlobalStateForRust(result.globalState);
  }

  if (result.versionGraph) {
    const vg = { ...result.versionGraph };
    if (vg.checkpoints) {
      vg.checkpoints = vg.checkpoints.map(({ type: _, ...rest }: any) => rest);
    }
    if (vg.deltas) {
      vg.deltas = vg.deltas.map(({ type: _, ...rest }: any) => rest);
    }
    result.versionGraph = vg;
  }

  if (result.layers) {
    result.layers = result.layers.map((layer: any) => {
      let l = { ...layer };
      if (l.overrides) {
        l.overrides = fixLayerOverridesHatch(l.overrides, false);
      }
      return flattenPrecisionValues(l);
    });
  }

  if (result.blockInstances) {
    result.blockInstances = result.blockInstances.map((bi: any) => {
      let b = { ...bi };
      if (b.elementOverrides && !Array.isArray(b.elementOverrides) && typeof b.elementOverrides === "object") {
        b.elementOverrides = Object.entries(b.elementOverrides).map(([key, value]) => ({ key, value: String(value) }));
      }
      return flattenPrecisionValues(b);
    });
  }

  if (result.blocks) {
    result.blocks = result.blocks.map((block: any) => {
      let b = { ...block };
      if (b.metadata) {
        b.metadata = { ...b.metadata };
        fixLocalizationToRust(b.metadata);
      }
      return b;
    });
  }

  if (result.blockCollections) {
    result.blockCollections = result.blockCollections.map((collection: any) => {
      let c = { ...collection };
      if (c.metadata) {
        c.metadata = { ...c.metadata };
        fixLocalizationToRust(c.metadata);
      }
      return c;
    });
  }

  return result;
}

import { FREEDRAW_EASINGS } from "./utils/constants";

const STACK_ELEMENT_TYPES = new Set(["frame", "plot"]);
const LINEAR_ELEMENT_TYPES = new Set(["line", "arrow", "freedraw"]);

const EASING_FN_TO_NAME = new Map<Function, string>(
  Object.entries(FREEDRAW_EASINGS).map(([name, fn]) => [fn, name]),
);

const TEXT_STYLE_FIELDS = new Set([
  "isLtr", "fontFamily", "bigFontFamily", "textAlign", "verticalAlign",
  "lineHeight", "lineSpacing", "obliqueAngle", "fontSize", "widthFactor",
  "isUpsideDown", "isBackwards",
]);

// --- Hatch pattern: Rust flat fields ↔ TS nested `pattern` object ---

function fixHatchFromRust(hatch: any): any {
  if (!hatch || typeof hatch !== "object" || hatch.pattern) return hatch;
  const { patternName, patternScale, patternAngle, patternOrigin, patternDouble, ...rest } = hatch;
  if (patternName === undefined) return hatch;
  return { ...rest, pattern: { name: patternName, scale: patternScale, angle: patternAngle, origin: patternOrigin, double: patternDouble } };
}

function fixHatchToRust(hatch: any): any {
  if (!hatch?.pattern) return hatch;
  const { pattern, ...rest } = hatch;
  return { ...rest, patternName: pattern.name, patternScale: pattern.scale, patternAngle: pattern.angle, patternOrigin: pattern.origin, patternDouble: pattern.double };
}

function fixContentHatch(content: any, fromRust: boolean): any {
  if (!content?.hatch) return content;
  return { ...content, hatch: fromRust ? fixHatchFromRust(content.hatch) : fixHatchToRust(content.hatch) };
}

function fixStylesHatch(el: any, fromRust: boolean): void {
  if (Array.isArray(el?.background)) {
    for (let i = 0; i < el.background.length; i++) {
      if (el.background[i]?.content?.hatch) {
        el.background[i] = { ...el.background[i], content: fixContentHatch(el.background[i].content, fromRust) };
      }
    }
  }
  if (Array.isArray(el?.stroke)) {
    for (let i = 0; i < el.stroke.length; i++) {
      if (el.stroke[i]?.content?.hatch) {
        el.stroke[i] = { ...el.stroke[i], content: fixContentHatch(el.stroke[i].content, fromRust) };
      }
    }
  }
}

function fixLayerOverridesHatch(overrides: any, fromRust: boolean): any {
  if (!overrides) return overrides;
  let result = overrides;
  if (result.stroke?.content?.hatch) {
    result = { ...result, stroke: { ...result.stroke, content: fixContentHatch(result.stroke.content, fromRust) } };
  }
  if (result.background?.content?.hatch) {
    result = { ...result, background: { ...result.background, content: fixContentHatch(result.background.content, fromRust) } };
  }
  return result;
}

// --- Viewer3DGrid: Rust `value` key ↔ TS `planes` key for perPlane variant ---

function fixViewer3DGridFromRust(grid: any): any {
  if (grid?.type === "perPlane" && "value" in grid && !("planes" in grid)) {
    const { value, ...rest } = grid;
    return { ...rest, planes: value };
  }
  return grid;
}

function fixViewer3DGridToRust(grid: any): any {
  if (grid?.type === "perPlane" && "planes" in grid) {
    const { planes, ...rest } = grid;
    return { ...rest, value: planes };
  }
  return grid;
}

// --- customData: Rust `Option<String>` (JSON) ↔ TS `Record<string, any>` ---

function fixCustomDataFromRust(el: any): void {
  if (typeof el?.customData === "string") {
    try { el.customData = JSON.parse(el.customData); } catch { /* keep as string */ }
  }
}

function fixCustomDataToRust(el: any): void {
  if (el?.customData != null && typeof el.customData !== "string") {
    el.customData = JSON.stringify(el.customData);
  }
}

// --- Block metadata localization: Rust `Option<String>` (JSON) ↔ TS Record ---

function fixLocalizationFromRust(metadata: any): void {
  if (typeof metadata?.localization === "string") {
    try { metadata.localization = JSON.parse(metadata.localization); } catch { /* keep as string */ }
  }
}

function fixLocalizationToRust(metadata: any): void {
  if (metadata?.localization != null && typeof metadata.localization !== "string") {
    metadata.localization = JSON.stringify(metadata.localization);
  }
}

function fixElementFromRust(el: any): any {
  if (!el) return el;

  fixStylesHatch(el, true);
  fixCustomDataFromRust(el);
  if (el.type === "model" && el.viewerState?.display?.grid) {
    el.viewerState = {
      ...el.viewerState,
      display: { ...el.viewerState.display, grid: fixViewer3DGridFromRust(el.viewerState.display.grid) },
    };
  }

  // Convert Rust DucLine structs { start, end } → TypeScript tuples [start, end]
  if (LINEAR_ELEMENT_TYPES.has(el.type) && Array.isArray(el.lines)) {
    el.lines = el.lines.map((line: any) => {
      if (Array.isArray(line)) return line;
      if (line && line.start !== undefined && line.end !== undefined) {
        return [line.start, line.end];
      }
      return line;
    });
  }

  // Convert easing string key → function for freedraw elements
  if (el.type === "freedraw") {
    el = convertEasingFromRust(el);
  }

  // Unwrap nested text style → flat fields for TS
  if (el.type === "text" && el.style && typeof el.style === "object") {
    const { style, ...rest } = el;
    return { ...rest, ...style };
  }

  // Remove empty style from table/doc elements
  if ((el.type === "table" || el.type === "doc") && "style" in el) {
    const { style: _, ...rest } = el;
    return rest;
  }

  if (!STACK_ELEMENT_TYPES.has(el.type)) return el;

  // Stack elements (frame, plot) — unwrap stackBase, remove empty plot style
  const { stackBase, style: _plotStyle, ...rest } = el;
  if (!stackBase) return el;

  return {
    ...rest,
    isCollapsed: stackBase.isCollapsed ?? false,
  };
}

function fixElementToRust(el: any): any {
  if (!el) return el;

  fixStylesHatch(el, false);
  fixCustomDataToRust(el);
  if (el.type === "model" && el.viewerState?.display?.grid) {
    el.viewerState = {
      ...el.viewerState,
      display: { ...el.viewerState.display, grid: fixViewer3DGridToRust(el.viewerState.display.grid) },
    };
  }

  // Convert TypeScript DucLine tuples [start, end] → Rust structs { start, end }
  if (LINEAR_ELEMENT_TYPES.has(el.type) && Array.isArray(el.lines)) {
    el.lines = el.lines.map((line: any) => {
      if (Array.isArray(line)) {
        return { start: line[0], end: line[1] };
      }
      return line;
    });
  }

  // Convert easing function → string key for freedraw elements
  if (el.type === "freedraw") {
    el = convertEasingToRust(el);
  }

  // Wrap flat text style fields into nested `style` object for Rust serde
  if (el.type === "text") {
    const style: Record<string, any> = {};
    const rest: Record<string, any> = {};
    for (const key of Object.keys(el)) {
      if (TEXT_STYLE_FIELDS.has(key)) {
        style[key] = el[key];
      } else {
        rest[key] = el[key];
      }
    }
    return { ...rest, style };
  }

  // Add empty style for table/doc elements
  if (el.type === "table" || el.type === "doc") {
    return { ...el, style: {} };
  }

  if (!STACK_ELEMENT_TYPES.has(el.type)) return el;

  const {
    isCollapsed,
    ...rest
  } = el;

  return {
    ...rest,
    ...(el.type === "plot" ? { style: {} } : {}),
    stackBase: {
      label: el.label ?? "",
      description: el.description ?? null,
      isCollapsed: isCollapsed ?? false,
      isPlot: el.isPlot ?? false,
      isVisible: el.isVisible ?? true,
      locked: el.locked ?? false,
      opacity: el.opacity ?? 1.0,
    },
  };
}

/**
 * Recursively convert PrecisionValue objects ({value, scoped}) to plain
 * numbers (extracting `.value` — the raw/unscoped value) so Rust's serde
 * can deserialize them as f64.
 */
function flattenPrecisionValues(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (isPrecisionValueLike(obj)) return obj.value;

  if (Array.isArray(obj)) return obj.map(flattenPrecisionValues);

  if (typeof obj === "object") {
    const out: Record<string, any> = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      out[key] = flattenPrecisionValues(obj[key]);
    }
    return out;
  }

  return obj;
}

function isPrecisionValueLike(v: any): v is { value: number; scoped: number } {
  return (
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    typeof v.value === "number" &&
    typeof v.scoped === "number" &&
    Object.keys(v).length === 2
  );
}

function toNumberFromPrecisionLike(value: any, fallback: number): number {
  const flattened = flattenPrecisionValues(value);
  if (typeof flattened === "number" && Number.isFinite(flattened)) {
    return flattened;
  }
  return fallback;
}

function toInteger(value: any, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.trunc(value);
}

function coerceElementIntegerFields(el: any): any {
  if (!el || typeof el !== "object") return el;

  return {
    ...el,
    seed: toInteger(el.seed, 1),
    version: toInteger(el.version, 1),
    versionNonce: toInteger(el.versionNonce, 0),
  };
}

function normalizeLocalStateForRust(localState: any): any {
  if (!localState || typeof localState !== "object") return localState;

  return {
    ...localState,
    scrollX: toNumberFromPrecisionLike(localState.scrollX, 0),
    scrollY: toNumberFromPrecisionLike(localState.scrollY, 0),
    zoom:
      localState.zoom && typeof localState.zoom === "object"
        ? toNumberFromPrecisionLike(localState.zoom.value, 1)
        : toNumberFromPrecisionLike(localState.zoom, 1),
    currentItemStroke: flattenPrecisionValues(localState.currentItemStroke),
    currentItemBackground: flattenPrecisionValues(localState.currentItemBackground),
    currentItemFontSize: toNumberFromPrecisionLike(localState.currentItemFontSize, 16),
    currentItemRoundness: toNumberFromPrecisionLike(localState.currentItemRoundness, 0),
    currentItemTextAlign: toInteger(localState.currentItemTextAlign, 10),
    decimalPlaces: toInteger(localState.decimalPlaces, 2),
  };
}

function normalizeGlobalStateForRust(globalState: any): any {
  if (!globalState || typeof globalState !== "object") return globalState;

  return {
    ...globalState,
    scopeExponentThreshold: toInteger(globalState.scopeExponentThreshold, 4),
    pruningLevel: toInteger(globalState.pruningLevel, 20),
  };
}

function easingFnToName(fn: any): string {
  if (typeof fn === "string") return fn;
  if (typeof fn === "function") {
    return EASING_FN_TO_NAME.get(fn) ?? "easeOutSine";
  }
  return "easeOutSine";
}

function easingNameToFn(name: any): (t: number) => number {
  if (typeof name === "function") return name;
  if (typeof name === "string" && name in FREEDRAW_EASINGS) {
    return (FREEDRAW_EASINGS as any)[name];
  }
  return FREEDRAW_EASINGS.easeOutSine;
}

function convertEasingToRust(el: any): any {
  const result = { ...el };
  if (result.easing != null) {
    result.easing = easingFnToName(result.easing);
  }
  if (result.start?.easing != null) {
    result.start = { ...result.start, easing: easingFnToName(result.start.easing) };
  }
  if (result.end?.easing != null) {
    result.end = { ...result.end, easing: easingFnToName(result.end.easing) };
  }
  return result;
}

function convertEasingFromRust(el: any): any {
  if (typeof el.easing === "string") {
    el.easing = easingNameToFn(el.easing);
  }
  if (el.start && typeof el.start.easing === "string") {
    el.start = { ...el.start, easing: easingNameToFn(el.start.easing) };
  }
  if (el.end && typeof el.end.easing === "string") {
    el.end = { ...el.end, easing: easingNameToFn(el.end.easing) };
  }
  return el;
}
