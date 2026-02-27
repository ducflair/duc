import { getUpdatedTimestamp } from "..";
import {
  IMAGE_STATUS,
  LINE_SPACING_TYPE,
} from "../../enums";

import { getPrecisionValueFromRaw } from "../../technical/scopes";
import { RawValue, Scope } from "../../types";
import {
  DucArrowElement,
  DucDocElement,
  DucElement,
  DucEllipseElement,
  DucEmbeddableElement,
  DucFrameElement,
  DucFreeDrawElement,
  DucGenericElement,
  DucImageElement,
  DucLinearElement,
  DucModelElement,
  DucPdfElement,
  DucPlotElement,
  DucPolygonElement,
  DucTableElement,
  DucTextElement,
  ElementConstructorOpts,
  ElementUpdate,
  NonDeleted
} from "../../types/elements";
import { Radian, ScaleFactor } from "../../types/geometryTypes";
import { Merge, Mutable } from "../../types/utility-types";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_ELLIPSE_ELEMENT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FREEDRAW_ELEMENT,
  DEFAULT_POLYGON_SIDES,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN
} from "../constants";
import { randomId, randomInteger } from "../math/random";
import { normalizeText } from "../normalize";
import { getDefaultStackProperties } from "./";
import {
  getFontString,
  getTextElementPositionOffsets,
  measureText,
} from "./textElement";

export const newElementWith = <TElement extends DucElement>(
  element: TElement,
  updates: ElementUpdate<TElement>,
  /** pass `true` to always regenerate */
  force = false,
): TElement => {
  let didChange = false;
  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (element as any)[key] === value &&
        // if object, always update because its attrs could have changed
        (typeof value !== "object" || value === null)
      ) {
        continue;
      }
      didChange = true;
    }
  }

  if (!didChange && !force) {
    return element;
  }

  return {
    ...element,
    ...updates,
    updated: getUpdatedTimestamp(),
    version: element.version + 1,
    versionNonce: randomInteger(),
  };
};

const _newElementBase = <T extends DucElement>(
  type: T["type"],
  currentScope: Scope,
  {
    x,
    y,
    scope = currentScope,
    zIndex,
    index = DEFAULT_ELEMENT_PROPS.index,
    label,
    isVisible = DEFAULT_ELEMENT_PROPS.isVisible,
    isPlot = DEFAULT_ELEMENT_PROPS.isPlot,
    stroke = [DEFAULT_ELEMENT_PROPS.stroke],
    background = [DEFAULT_ELEMENT_PROPS.background],
    opacity = DEFAULT_ELEMENT_PROPS.opacity,
    width = DEFAULT_ELEMENT_PROPS.width,
    height = DEFAULT_ELEMENT_PROPS.height,
    angle = DEFAULT_ELEMENT_PROPS.angle,
    groupIds = DEFAULT_ELEMENT_PROPS.groupIds,
    blockIds = [],
    instanceId = null,
    regionIds = [],
    frameId = DEFAULT_ELEMENT_PROPS.frameId,
    layerId = null,
    roundness = DEFAULT_ELEMENT_PROPS.roundness,
    boundElements = DEFAULT_ELEMENT_PROPS.boundElements,
    link = DEFAULT_ELEMENT_PROPS.link,
    locked = DEFAULT_ELEMENT_PROPS.locked,
    description = null,
    ...rest
  }: ElementConstructorOpts & Omit<Partial<DucGenericElement>, "type">,
) => {
  // assign type to guard against excess properties
  const element: Merge<DucGenericElement, { type: T["type"] }> = {
    id: rest.id || randomId(),
    type,
    x,
    y,
    width,
    height,
    index,
    isVisible,
    angle,
    stroke,
    background,
    opacity,
    groupIds,
    blockIds,
    instanceId,
    frameId,
    roundness,
    label,
    scope,
    seed: rest.seed ?? randomInteger(),
    version: rest.version || 1,
    versionNonce: rest.versionNonce ?? 0,
    isDeleted: false,
    boundElements,
    updated: getUpdatedTimestamp(),
    link,
    locked,
    zIndex,
    description,
    customData: rest.customData,
    isPlot,
    regionIds,
    layerId,
  };
  return element;
};

export const newElement = (
  currentScope: Scope,
  opts: {
    type: DucGenericElement["type"];
  } & ElementConstructorOpts,
): NonDeleted<DucGenericElement> =>
  _newElementBase<DucGenericElement>(opts.type, currentScope, opts);

export const newEmbeddableElement = (
  currentScope: Scope,
  opts: {
    type: "embeddable";
  } & ElementConstructorOpts,
): NonDeleted<DucEmbeddableElement> => {
  return {
    ...opts,
    ..._newElementBase<DucEmbeddableElement>(
      opts.type,
      currentScope,
      opts,
    ),
  };
};

export const newFrameElement = (
  currentScope: Scope,
  opts: ElementConstructorOpts,
): NonDeleted<DucFrameElement> => ({
  ...getDefaultStackProperties(),
  clip: false,
  labelVisible: true,
  ..._newElementBase<DucFrameElement>("frame", currentScope, opts),
  type: "frame",
});

export const newPlotElement = (
  currentScope: Scope,
  opts: ElementConstructorOpts,
): NonDeleted<DucPlotElement> => ({
  ...getDefaultStackProperties(),
  clip: false,
  labelVisible: true,
  layout: {
    margins: {
      top: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
      right: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
      bottom: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
      left: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
    }
  },
  ..._newElementBase<DucPlotElement>("plot", currentScope, opts),
  type: "plot",
});

export const newEllipseElement = (
  currentScope: Scope,
  opts: {
    type: "ellipse";
    ratio?: DucEllipseElement["ratio"];
    startAngle?: DucEllipseElement["startAngle"];
    endAngle?: DucEllipseElement["endAngle"];
    showAuxCrosshair?: DucEllipseElement["showAuxCrosshair"];
  } & ElementConstructorOpts,
): NonDeleted<DucEllipseElement> => {
  return {
    ..._newElementBase<DucEllipseElement>(opts.type, currentScope, opts),
    ratio: opts.ratio || DEFAULT_ELLIPSE_ELEMENT.ratio,
    startAngle: opts.startAngle || DEFAULT_ELLIPSE_ELEMENT.startAngle,
    endAngle: opts.endAngle || DEFAULT_ELLIPSE_ELEMENT.endAngle,
    showAuxCrosshair: opts.showAuxCrosshair || DEFAULT_ELLIPSE_ELEMENT.showAuxCrosshair,
  };
};

export const newPolygonElement = (
  currentScope: Scope,
  opts: {
    type: "polygon";
    sides?: DucPolygonElement["sides"];
  } & ElementConstructorOpts,
): NonDeleted<DucPolygonElement> => {
  return {
    ..._newElementBase<DucPolygonElement>(opts.type, currentScope, opts),
    sides: opts.sides || DEFAULT_POLYGON_SIDES,
  };
};

export const newTextElement = (
  currentScope: Scope,
  opts: {
    text: string;
    originalText?: string;
  } & Partial<DucTextElement> & ElementConstructorOpts,
): NonDeleted<DucTextElement> => {
  const scope = opts.scope ?? currentScope;
  const fontFamily = opts.fontFamily || (DEFAULT_FONT_FAMILY as string);
  const fontSize = opts.fontSize || getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, scope, currentScope);
  const lineHeight = opts.lineHeight || (1.2 as DucTextElement["lineHeight"]);
  const text = normalizeText(opts.text);
  const metrics = measureText(text, getFontString({ fontFamily, fontSize }), lineHeight, currentScope);
  const textAlign = opts.textAlign || DEFAULT_TEXT_ALIGN;
  const verticalAlign = opts.verticalAlign || DEFAULT_VERTICAL_ALIGN;
  const offsets = getTextElementPositionOffsets({ textAlign, verticalAlign }, metrics);

  // Minimum dimensions: at least 1px wide, at least one line high (NaN-safe)
  const rawMinLineHeight = fontSize.value * lineHeight;
  const minLineHeight = (Number.isFinite(rawMinLineHeight) && rawMinLineHeight > 0)
    ? rawMinLineHeight
    : DEFAULT_FONT_SIZE * lineHeight;
  const finalWidth = (Number.isFinite(metrics.width) && metrics.width > 0) ? metrics.width : 1 as RawValue;
  const finalHeight = (Number.isFinite(metrics.height) && metrics.height > 0)
    ? Math.max(metrics.height, minLineHeight) as RawValue
    : minLineHeight as RawValue;

  const x = getPrecisionValueFromRaw(opts.x.value - offsets.x as RawValue, scope, currentScope);
  const y = getPrecisionValueFromRaw(opts.y.value - offsets.y as RawValue, scope, currentScope);

  return {
    ..._newElementBase<DucTextElement>("text", currentScope, { ...opts, x, y }),
    type: "text",
    text,
    fontSize,
    fontFamily,
    textAlign,
    verticalAlign,
    width: getPrecisionValueFromRaw(finalWidth, scope, currentScope),
    height: getPrecisionValueFromRaw(finalHeight, scope, currentScope),
    containerId: opts.containerId || null,
    originalText: opts.originalText ?? text,
    autoResize: opts.autoResize ?? true,
    lineHeight,
    // DucTextStyle properties
    isLtr: opts.isLtr ?? true,
    bigFontFamily: opts.bigFontFamily || "sans-serif",
    lineSpacing: opts.lineSpacing || { type: LINE_SPACING_TYPE.MULTIPLE, value: lineHeight as unknown as ScaleFactor },
    obliqueAngle: opts.obliqueAngle || (0 as Radian),
    widthFactor: opts.widthFactor || (1 as ScaleFactor),
    isUpsideDown: opts.isUpsideDown ?? false,
    isBackwards: opts.isBackwards ?? false,
  };
};

export const newFreeDrawElement = (
  currentScope: Scope,
  opts: {
    simulatePressure: boolean;
  } & Partial<DucFreeDrawElement> & ElementConstructorOpts,
): NonDeleted<DucFreeDrawElement> => {
  const scope = opts.scope ?? currentScope;
  return {
    ..._newElementBase<DucFreeDrawElement>("freedraw", currentScope, opts),
    type: "freedraw",
    points: opts.points || [],
    size: opts.size || getPrecisionValueFromRaw(DEFAULT_FREEDRAW_ELEMENT.size, scope, currentScope),
    pressures: opts.pressures || [],
    simulatePressure: opts.simulatePressure,
    thinning: opts.thinning ?? DEFAULT_FREEDRAW_ELEMENT.thinning,
    smoothing: opts.smoothing ?? DEFAULT_FREEDRAW_ELEMENT.smoothing,
    streamline: opts.streamline ?? DEFAULT_FREEDRAW_ELEMENT.streamline,
    easing: opts.easing || DEFAULT_FREEDRAW_ELEMENT.easing,
    lastCommittedPoint: null,
    start: opts.start || null,
    end: opts.end || null,
    svgPath: null,
  };
};

export const newLinearElement = (
  currentScope: Scope,
  opts: Partial<DucLinearElement> & ElementConstructorOpts,
): NonDeleted<DucLinearElement> => ({
  ..._newElementBase<DucLinearElement>("line", currentScope, opts),
  type: "line",
  points: opts.points || [],
  lines: opts.lines || [],
  pathOverrides: opts.pathOverrides || [],
  lastCommittedPoint: null,
  startBinding: null,
  endBinding: null,
  wipeoutBelow: opts.wipeoutBelow ?? false,
});

export const newArrowElement = (
  currentScope: Scope,
  opts: Partial<DucArrowElement> & ElementConstructorOpts,
): NonDeleted<DucArrowElement> => ({
  ..._newElementBase<DucArrowElement>("arrow", currentScope, opts),
  type: "arrow",
  points: opts.points || [],
  lines: opts.lines || [],
  pathOverrides: opts.pathOverrides || [],
  lastCommittedPoint: null,
  startBinding: null,
  endBinding: null,
  elbowed: opts.elbowed ?? true,
});

export const newImageElement = (
  currentScope: Scope,
  opts: Partial<DucImageElement> & ElementConstructorOpts,
): NonDeleted<DucImageElement> => ({
  ..._newElementBase<DucImageElement>("image", currentScope, opts),
  type: "image",
  status: opts.status ?? IMAGE_STATUS.PENDING,
  fileId: opts.fileId ?? null,
  scaleFlip: opts.scaleFlip ?? [1, 1],
  crop: null,
  filter: null,
});

export const newTableElement = (
  currentScope: Scope,
  opts: Partial<DucTableElement> & ElementConstructorOpts,
): NonDeleted<DucTableElement> => ({
  ..._newElementBase<DucTableElement>("table", currentScope, opts),
  fileId: opts.fileId ?? null,
  type: "table",
});

export const newDocElement = (
  currentScope: Scope,
  opts: Partial<DucDocElement> & ElementConstructorOpts,
): NonDeleted<DucDocElement> => ({
  ..._newElementBase<DucDocElement>("doc", currentScope, opts),
  type: "doc",
  text: opts.text || "",
  fileId: opts.fileId ?? null,
  gridConfig: {
    columns: opts.gridConfig?.columns ?? 1,
    gapX: opts.gridConfig?.gapX ?? 0,
    gapY: opts.gridConfig?.gapY ?? 0,
    firstPageAlone: opts.gridConfig?.firstPageAlone ?? false,
    scale: opts.gridConfig?.scale ?? 1,
  },
});

export const newPdfElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucPdfElement> => ({
  fileId: null,
  gridConfig: { columns: 1, gapX: 0, gapY: 0, firstPageAlone: false, scale: 1 },
  ..._newElementBase<DucPdfElement>("pdf", currentScope, opts),
  type: "pdf",
});

export const newModelElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucModelElement> => ({
  modelType: null,
  code: null,
  svgPath: null,
  fileIds: [],
  viewerState: null,
  ..._newElementBase<DucModelElement>("model", currentScope, opts),
  type: 'model',
});

// Simplified deep clone for the purpose of cloning DucElement.
//
// Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
// Typed arrays and other non-null objects.
//
// Adapted from https://github.com/lukeed/klona
//
// The reason for `deepCopyElement()` wrapper is type safety (only allow
// passing DucElement as the top-level argument).
const _deepCopyElement = (val: any, depth: number = 0) => {
  // only clone non-primitives
  if (val == null || typeof val !== "object") {
    return val;
  }

  const objectType = Object.prototype.toString.call(val);

  if (objectType === "[object Object]") {
    const tmp =
      typeof val.constructor === "function"
        ? Object.create(Object.getPrototypeOf(val))
        : {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // don't copy non-serializable objects like these caches. They'll be
        // populated when the element is rendered.
        if (depth === 0 && (key === "shape" || key === "canvas")) {
          continue;
        }
        tmp[key] = _deepCopyElement(val[key], depth + 1);
      }
    }
    return tmp;
  }

  if (Array.isArray(val)) {
    let k = val.length;
    const arr = new Array(k);
    while (k--) {
      arr[k] = _deepCopyElement(val[k], depth + 1);
    }
    return arr;
  }

  // we're not cloning non-array & non-plain-object objects because we
  // don't support them on excalidraw elements yet. If we do, we need to make
  // sure we start cloning them, so let's warn about it.
  if (import.meta.env.DEV) {
    if (
      objectType !== "[object Object]" &&
      objectType !== "[object Array]" &&
      objectType.startsWith("[object ")
    ) {
      console.warn(
        `_deepCloneElement: unexpected object type ${objectType}. This value will not be cloned!`,
      );
    }
  }

  return val;
};

/**
 * Clones DucElement data structure. Does not regenerate id, nonce, or
 * any value. The purpose is to to break object references for immutability
 * reasons, whenever we want to keep the original element, but ensure it's not
 * mutated.
 *
 * Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
 * Typed arrays and other non-null objects.
 */
export const deepCopyElement = <T extends DucElement>(
  val: T,
): Mutable<T> => {
  return _deepCopyElement(val);
};

/**
 * utility wrapper to generate new id. In test env it reuses the old + postfix
 * for test assertions.
 */
export const regenerateId = (
  /** supply null if no previous id exists */
  previousId: string | null,
) => {
  // if (isTestEnv() && previousId) {
  //   let nextId = `${previousId}_copy`;
  //   // `window.h` may not be defined in some unit tests
  //   if (
  //     window.h?.app
  //       ?.getSceneElementsIncludingDeleted()
  //       .find((el: DucElement) => el.id === nextId)
  //   ) {
  //     nextId += "_copy";
  //   }
  //   return nextId;
  // }
  return randomId();
};
