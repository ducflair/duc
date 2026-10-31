import { getUpdatedTimestamp } from "..";
import {
  IMAGE_STATUS,
  LINE_SPACING_TYPE,
} from "../../enums";

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
  ElementBackground,
  ElementStroke,
  ElementUpdate,
  NonDeleted
} from "../../types/elements";
import { Percentage, Radian, ScaleFactor } from "../../types/geometry.types";
import { Merge, Mutable } from "../../types/utility.types";
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
  opts: ElementConstructorOpts & Omit<Partial<DucGenericElement>, "type">,
) => {
  const {
    x,
    y,
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
  } = opts;

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

type NewGenericOpts = {
  type: DucGenericElement["type"];
} & ElementConstructorOpts;

export function newElement(opts: NewGenericOpts): NonDeleted<DucGenericElement> {
  return _newElementBase<DucGenericElement>(opts.type, opts);
}

type NewEmbeddableOpts = {
  type: "embeddable";
} & ElementConstructorOpts;

export function newEmbeddableElement(opts: NewEmbeddableOpts): NonDeleted<DucEmbeddableElement> {
  return {
    ...opts,
    ..._newElementBase<DucEmbeddableElement>(opts.type, opts),
  };
}

type NewFrameOpts = Partial<DucFrameElement> & ElementConstructorOpts;

export function newFrameElement(opts: NewFrameOpts): NonDeleted<DucFrameElement> {
  return {
    ...getDefaultStackProperties(),
    clip: false,
    labelVisible: true,
    ..._newElementBase<DucFrameElement>("frame", opts),
    type: "frame",
  };
}

type NewPlotOpts = Partial<DucPlotElement> & ElementConstructorOpts;

export function newPlotElement(opts: NewPlotOpts): NonDeleted<DucPlotElement> {
  return {
    ...getDefaultStackProperties(),
    clip: false,
    labelVisible: true,
    layout: {
      margins: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    ..._newElementBase<DucPlotElement>("plot", opts),
    type: "plot",
  };
}

type NewEllipseOpts = {
  type: "ellipse";
  ratio?: DucEllipseElement["ratio"];
  startAngle?: DucEllipseElement["startAngle"];
  endAngle?: DucEllipseElement["endAngle"];
  showAuxCrosshair?: DucEllipseElement["showAuxCrosshair"];
} & ElementConstructorOpts;

export function newEllipseElement(opts: NewEllipseOpts): NonDeleted<DucEllipseElement> {
  return {
    ..._newElementBase<DucEllipseElement>(opts.type, opts),
    ratio: opts.ratio || DEFAULT_ELLIPSE_ELEMENT.ratio,
    startAngle: opts.startAngle || DEFAULT_ELLIPSE_ELEMENT.startAngle,
    endAngle: opts.endAngle || DEFAULT_ELLIPSE_ELEMENT.endAngle,
    showAuxCrosshair: opts.showAuxCrosshair || DEFAULT_ELLIPSE_ELEMENT.showAuxCrosshair,
  };
}

type NewPolygonOpts = {
  type: "polygon";
  sides?: DucPolygonElement["sides"];
} & ElementConstructorOpts;

export function newPolygonElement(opts: NewPolygonOpts): NonDeleted<DucPolygonElement> {
  return {
    ..._newElementBase<DucPolygonElement>(opts.type, opts),
    sides: opts.sides || DEFAULT_POLYGON_SIDES,
  };
}

type NewTextOpts = {
  text: string;
  originalText?: string;
} & Partial<DucTextElement> & ElementConstructorOpts;

export function newTextElement(opts: NewTextOpts): NonDeleted<DucTextElement> {
  const fontFamily = opts.fontFamily || (DEFAULT_FONT_FAMILY as string);
  const fontSize = typeof opts.fontSize === "number" ? opts.fontSize : ((opts.fontSize as any)?.value ?? DEFAULT_FONT_SIZE);
  const lineHeight = opts.lineHeight || (1.2 as DucTextElement["lineHeight"]);
  const text = normalizeText(opts.text);
  const metrics = measureText(text, getFontString({ fontFamily, fontSize }), lineHeight);
  const textAlign = opts.textAlign || DEFAULT_TEXT_ALIGN;
  const verticalAlign = opts.verticalAlign || DEFAULT_VERTICAL_ALIGN;
  const offsets = getTextElementPositionOffsets({ textAlign, verticalAlign }, metrics);

  // Minimum dimensions: at least 1px wide, at least one line high (NaN-safe)
  const rawMinLineHeight = fontSize * lineHeight;
  const minLineHeight = (Number.isFinite(rawMinLineHeight) && rawMinLineHeight > 0)
    ? rawMinLineHeight
    : DEFAULT_FONT_SIZE * lineHeight;
  const finalWidth = (Number.isFinite(metrics.width) && metrics.width > 0) ? metrics.width : 1;
  const finalHeight = (Number.isFinite(metrics.height) && metrics.height > 0)
    ? Math.max(metrics.height, minLineHeight)
    : minLineHeight;

  const rawX = typeof opts.x === "number" ? opts.x : ((opts.x as any)?.value ?? 0);
  const rawY = typeof opts.y === "number" ? opts.y : ((opts.y as any)?.value ?? 0);
  const x = rawX - offsets.x;
  const y = rawY - offsets.y;

  return {
    ..._newElementBase<DucTextElement>("text", { ...opts, x, y }),
    type: "text",
    text,
    fontSize,
    fontFamily,
    textAlign,
    verticalAlign,
    width: finalWidth,
    height: finalHeight,
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
}

type NewFreeDrawOpts = {
  simulatePressure: boolean;
} & Partial<DucFreeDrawElement> & ElementConstructorOpts;

export function newFreeDrawElement(opts: NewFreeDrawOpts): NonDeleted<DucFreeDrawElement> {
  return {
    ..._newElementBase<DucFreeDrawElement>("freedraw", opts),
    type: "freedraw",
    points: opts.points || [],
    size: typeof opts.size === "number" ? opts.size : ((opts.size as any)?.value ?? DEFAULT_FREEDRAW_ELEMENT.size),
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
}

type NewLinearOpts = Partial<DucLinearElement> & ElementConstructorOpts;

export function newLinearElement(opts: NewLinearOpts): NonDeleted<DucLinearElement> {
  return {
    ..._newElementBase<DucLinearElement>("line", opts),
    type: "line",
    points: opts.points || [],
    lines: opts.lines || [],
    pathOverrides: opts.pathOverrides || [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    wipeoutBelow: opts.wipeoutBelow ?? false,
  };
}

type NewArrowOpts = Partial<DucArrowElement> & ElementConstructorOpts;

export function newArrowElement(opts: NewArrowOpts): NonDeleted<DucArrowElement> {
  return {
    ..._newElementBase<DucArrowElement>("arrow", opts),
    type: "arrow",
    points: opts.points || [],
    lines: opts.lines || [],
    pathOverrides: opts.pathOverrides || [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    elbowed: opts.elbowed ?? true,
  };
}

const withDisabledContentVisibility = <T extends ElementBackground | ElementStroke>(
  items: readonly T[] | undefined,
  fallback: T,
): T[] => {
  const source = items?.length ? items : [fallback];
  return source.map((item) => ({
    ...item,
    content: {
      ...item.content,
      visible: false,
    },
  }));
};

const getDxfDefaultBackground = (): ElementBackground => ({
  ...DEFAULT_ELEMENT_PROPS.background,
  content: {
    ...DEFAULT_ELEMENT_PROPS.background.content,
    src: "#ffffff",
    visible: false,
    opacity: 1 as Percentage,
  },
});

const getMediaElementStyle = (opts: ElementConstructorOpts) => ({
  stroke: withDisabledContentVisibility(opts.stroke as ElementStroke[] | undefined, DEFAULT_ELEMENT_PROPS.stroke),
  background: withDisabledContentVisibility(opts.background as ElementBackground[] | undefined, DEFAULT_ELEMENT_PROPS.background),
});

const getDocumentElementStyle = (opts: ElementConstructorOpts) => ({
  stroke: withDisabledContentVisibility(opts.stroke as ElementStroke[] | undefined, DEFAULT_ELEMENT_PROPS.stroke),
  background: withDisabledContentVisibility(opts.background as ElementBackground[] | undefined, DEFAULT_ELEMENT_PROPS.background),
});

type NewImageOpts = Partial<DucImageElement> & ElementConstructorOpts;

export function newImageElement(opts: NewImageOpts): NonDeleted<DucImageElement> {
  return {
    ..._newElementBase<DucImageElement>("image", {
      ...opts,
      ...getMediaElementStyle(opts),
    }),
    type: "image",
    status: opts.status ?? IMAGE_STATUS.PENDING,
    fileId: opts.fileId ?? null,
    scaleFlip: opts.scaleFlip ?? [1, 1],
    crop: null,
    filter: null,
  };
}

type NewTableOpts = Partial<DucTableElement> & ElementConstructorOpts;

export function newTableElement(opts: NewTableOpts): NonDeleted<DucTableElement> {
  return {
    ..._newElementBase<DucTableElement>("table", opts),
    fileId: opts.fileId ?? null,
    gridConfig: {
      columns: opts.gridConfig?.columns ?? 1,
      gapX: opts.gridConfig?.gapX ?? 0,
      gapY: opts.gridConfig?.gapY ?? 0,
      firstPageAlone: opts.gridConfig?.firstPageAlone ?? false,
      scale: opts.gridConfig?.scale ?? 1,
    },
    type: "table",
  };
}

type NewDocOpts = Partial<DucDocElement> & ElementConstructorOpts;

export function newDocElement(opts: NewDocOpts): NonDeleted<DucDocElement> {
  return {
    ..._newElementBase<DucDocElement>("doc", {
      ...opts,
      ...getDocumentElementStyle(opts),
    }),
    type: "doc",
    text: opts.text || "",
    fileId: opts.fileId ?? null,
    referencedFileIds: opts.referencedFileIds ?? [],
    gridConfig: {
      columns: opts.gridConfig?.columns ?? 1,
      gapX: opts.gridConfig?.gapX ?? 0,
      gapY: opts.gridConfig?.gapY ?? 0,
      firstPageAlone: opts.gridConfig?.firstPageAlone ?? false,
      scale: opts.gridConfig?.scale ?? 1,
    },
  };
}

type NewPdfOpts = Partial<DucPdfElement> & ElementConstructorOpts;

export function newPdfElement(opts: NewPdfOpts): NonDeleted<DucPdfElement> {
  return {
    fileId: null,
    gridConfig: { columns: 1, gapX: 0, gapY: 0, firstPageAlone: false, scale: 1 },
    ..._newElementBase<DucPdfElement>("pdf", {
      ...opts,
      ...getDocumentElementStyle(opts),
    }),
    type: "pdf",
  };
}

type NewModelOpts = Partial<DucModelElement> & ElementConstructorOpts;

export function newModelElement(opts: NewModelOpts): NonDeleted<DucModelElement> {
  const modelType = (opts as Partial<DucModelElement>).modelType?.toLowerCase();
  const backgroundFallback = modelType === "dxf" || modelType === "dwg"
    ? getDxfDefaultBackground()
    : DEFAULT_ELEMENT_PROPS.background;
  const modelStyle = {
    stroke: withDisabledContentVisibility(opts.stroke as ElementStroke[] | undefined, DEFAULT_ELEMENT_PROPS.stroke),
    background: withDisabledContentVisibility(opts.background as ElementBackground[] | undefined, backgroundFallback),
  };

  return {
    modelType: null,
    code: null,
    thumbnail: null,
    fileIds: [],
    viewerState: null,
    ..._newElementBase<DucModelElement>("model", {
      ...opts,
      ...modelStyle,
    }),
    type: 'model',
  };
}

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

  if (ArrayBuffer.isView(val)) {
    return (val as any).slice(0);
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
  const importMetaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  if (importMetaEnv?.DEV) {
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
