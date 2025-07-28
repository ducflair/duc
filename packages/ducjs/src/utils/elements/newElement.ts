import {
  BLOCK_ATTACHMENT,
  COLUMN_TYPE,
  DATUM_BRACKET_STYLE,
  IMAGE_STATUS,
  LINE_SPACING_TYPE,
  PARAMETRIC_SOURCE_TYPE,
  STACKED_TEXT_ALIGN,
  TEXT_ALIGN,
  TEXT_FLOW_DIRECTION,
  VERTICAL_ALIGN,
  VIEWPORT_SHADE_PLOT,
} from "ducjs/duc";
import { RawValue, Scope } from "ducjs/types";
import {
  _DucElementBase,
  DucArrowElement,
  DucDimensionElement,
  DucDocElement,
  DucElement,
  DucEllipseElement,
  DucEmbeddableElement,
  DucFeatureControlFrameElement,
  DucFrameElement,
  DucFreeDrawElement,
  DucGenericElement,
  DucImageElement,
  DucLeaderElement,
  DucLinearElement,
  DucMermaidElement,
  DucParametricElement,
  DucPdfElement,
  DucPlotElement,
  DucPolygonElement,
  DucTableElement,
  DucTextContainer,
  DucTextElement,
  DucViewportElement,
  DucXRayElement,
  DucBlockInstanceElement,
  ElementConstructorOpts,
  ElementUpdate,
  LineHead,
  NonDeleted,
  ViewportScale,
} from "ducjs/types/elements";
import { Merge, Mutable } from "ducjs/types/utility-types";
import { getUpdatedTimestamp, getZoom } from "ducjs/utils";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_ELLIPSE_ELEMENT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FREEDRAW_ELEMENT,
  DEFAULT_LINEAR_ELEMENT_STROKE,
  DEFAULT_POLYGON_SIDES,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
} from "ducjs/utils/constants";
import { getDefaultStackProperties, getDefaultTableData, getDefaultTextStyle } from "ducjs/utils/elements";
import {
  getFontString,
  getTextElementPositionOffsets,
  measureText,
} from "ducjs/utils/elements/textElement";
import { randomId, randomInteger } from "ducjs/utils/math/random";
import { normalizeText } from "ducjs/utils/normalize";
import { getPrecisionValueFromRaw } from "ducjs/technical/scopes";
import { Radian, ScaleFactor } from "ducjs/types/geometryTypes";

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
    isAnnotative = DEFAULT_ELEMENT_PROPS.isAnnotative,
    stroke = [DEFAULT_ELEMENT_PROPS.stroke],
    background = [DEFAULT_ELEMENT_PROPS.background],
    opacity = DEFAULT_ELEMENT_PROPS.opacity,
    width = DEFAULT_ELEMENT_PROPS.width,
    height = DEFAULT_ELEMENT_PROPS.height,
    angle = DEFAULT_ELEMENT_PROPS.angle,
    groupIds = DEFAULT_ELEMENT_PROPS.groupIds,
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
    isAnnotative,
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
  ..._newElementBase<DucFrameElement>("frame", currentScope, opts),
  ...getDefaultStackProperties(),
  type: "frame",
  clip: false,
  labelVisible: true,
  standardOverride: null,
});

export const newPlotElement = (
  currentScope: Scope,
  opts: ElementConstructorOpts,
): NonDeleted<DucPlotElement> => ({
    ..._newElementBase<DucPlotElement>("plot", currentScope, opts),
    ...getDefaultStackProperties(),
    type: "plot",
    clip: false,
    labelVisible: true,
    standardOverride: null,
    layout: {
        margins: {
            top: getPrecisionValueFromRaw(25 as RawValue, currentScope, currentScope),
            right: getPrecisionValueFromRaw(25 as RawValue, currentScope, currentScope),
            bottom: getPrecisionValueFromRaw(25 as RawValue, currentScope, currentScope),
            left: getPrecisionValueFromRaw(25 as RawValue, currentScope, currentScope),
        }
    },
});

export const newViewportElement = (
    currentScope: Scope,
    opts: {
      zoom?: number;
      scopeExponentThreshold?: number;
      mainScope?: Scope;
    } & ElementConstructorOpts,
): NonDeleted<DucViewportElement> => ({
    ..._newElementBase<DucViewportElement>("viewport", currentScope, opts),
    ...getDefaultStackProperties(),
    type: "viewport",
    points: [],
    lines: [],
    pathOverrides: [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    standardOverride: null,
    view: {
      scrollX: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
      scrollY: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
      zoom: getZoom(opts.zoom ?? 1, opts.mainScope ?? currentScope, opts.scopeExponentThreshold ?? 2),
      twistAngle: 0 as Radian,
      centerPoint: {
        x: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
        y: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
      },
      scope: currentScope,
    },
    scale: 1 as ViewportScale,
    shadePlot: VIEWPORT_SHADE_PLOT.AS_DISPLAYED,
    frozenGroupIds: [],
    scaleIndicatorVisible: true,
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
  const fontFamily = opts.fontFamily || DEFAULT_FONT_FAMILY;
  const fontSize = opts.fontSize || getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, scope, currentScope);
  const lineHeight = opts.lineHeight || (1.2 as DucTextElement["lineHeight"]);
  const text = normalizeText(opts.text);
  const metrics = measureText(text, getFontString({ fontFamily, fontSize }), lineHeight, currentScope);
  const textAlign = opts.textAlign || DEFAULT_TEXT_ALIGN;
  const verticalAlign = opts.verticalAlign || DEFAULT_VERTICAL_ALIGN;
  const offsets = getTextElementPositionOffsets({ textAlign, verticalAlign }, metrics);
  
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
    width: getPrecisionValueFromRaw(metrics.width, scope, currentScope),
    height: getPrecisionValueFromRaw(metrics.height, scope, currentScope),
    containerId: opts.containerId || null,
    originalText: opts.originalText ?? text,
    autoResize: opts.autoResize ?? true,
    lineHeight,
    // DucTextStyle properties
    isLtr: opts.isLtr ?? true,
    bigFontFamily: opts.bigFontFamily || "sans-serif",
    lineSpacing: opts.lineSpacing || { type: LINE_SPACING_TYPE.MULTIPLE, value: lineHeight as unknown as ScaleFactor },
    obliqueAngle: opts.obliqueAngle || (0 as Radian),
    paperTextHeight: opts.paperTextHeight,
    widthFactor: opts.widthFactor || (1 as ScaleFactor),
    isUpsideDown: opts.isUpsideDown ?? false,
    isBackwards: opts.isBackwards ?? false,
    dynamic: opts.dynamic || [],
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
  scale: opts.scale ?? [1, 1],
  crop: null,
  filter: null,
});

export const newTableElement = (
  currentScope: Scope,
  opts: Partial<DucTableElement> & ElementConstructorOpts,
): NonDeleted<DucTableElement> => ({
  ..._newElementBase<DucTableElement>("table", currentScope, opts),
  ...getDefaultTableData(currentScope),
  type: "table",
});

export const newDocElement = (
  currentScope: Scope,
  opts: Partial<DucDocElement> & ElementConstructorOpts,
): NonDeleted<DucDocElement> => ({
  ..._newElementBase<DucDocElement>("doc", currentScope, opts),
  type: "doc",
  text: opts.text || "",
  dynamic: opts.dynamic || [],
  flowDirection: opts.flowDirection || TEXT_FLOW_DIRECTION.TOP_TO_BOTTOM,
  columns: opts.columns || { type: COLUMN_TYPE.NO_COLUMNS, definitions: [], autoHeight: true },
  autoResize: opts.autoResize ?? true,
  // DucDocStyle properties
  isLtr: opts.isLtr ?? true,
  fontFamily: opts.fontFamily || DEFAULT_FONT_FAMILY,
  bigFontFamily: opts.bigFontFamily || "sans-serif",
  textAlign: opts.textAlign || DEFAULT_TEXT_ALIGN,
  verticalAlign: opts.verticalAlign || DEFAULT_VERTICAL_ALIGN,
  lineHeight: opts.lineHeight || (1.2 as DucTextElement["lineHeight"]),
  lineSpacing: opts.lineSpacing || { type: LINE_SPACING_TYPE.MULTIPLE, value: 1.2 as ScaleFactor },
  obliqueAngle: opts.obliqueAngle || (0 as Radian),
  fontSize: opts.fontSize || getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, currentScope, currentScope),
  paperTextHeight: opts.paperTextHeight,
  widthFactor: opts.widthFactor || (1 as ScaleFactor),
  isUpsideDown: opts.isUpsideDown ?? false,
  isBackwards: opts.isBackwards ?? false,
  paragraph: opts.paragraph || { firstLineIndent: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), hangingIndent: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), leftIndent: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), rightIndent: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), spaceBefore: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), spaceAfter: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), tabStops: [] },
  stackFormat: opts.stackFormat || { autoStack: false, stackChars: [], properties: { upperScale: 0.7, lowerScale: 0.7, alignment: STACKED_TEXT_ALIGN.CENTER } },
});

export const newPdfElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucPdfElement> => ({
    ..._newElementBase<DucPdfElement>("pdf", currentScope, opts),
    type: "pdf",
    fileId: null,
});

export const newMermaidElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucMermaidElement> => ({
    ..._newElementBase<DucMermaidElement>("mermaid", currentScope, opts),
    type: "mermaid",
    source: "",
    theme: undefined,
    svgPath: null,
});

export const newXRayElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucXRayElement> => ({
    ..._newElementBase<DucXRayElement>("xray", currentScope, opts),
    type: "xray",
    origin: { x: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope), y: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope) },
    direction: { x: getPrecisionValueFromRaw(1 as RawValue, currentScope, currentScope), y: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope) },
    startFromOrigin: false,
    color: '#FF00FF'
});

export const newLeaderElement = (
  currentScope: Scope,
  opts: Partial<DucLeaderElement> & ElementConstructorOpts
): NonDeleted<DucLeaderElement> => {
  return {
    ..._newElementBase<DucLeaderElement>("leader", currentScope, opts),
    type: "leader",
    points: [],
    lines: [],
    pathOverrides: [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    headsOverride: undefined,
    dogleg: getPrecisionValueFromRaw(10 as RawValue, currentScope, currentScope),
    textStyle: opts.textStyle || getDefaultTextStyle(currentScope),
    textAttachment: opts.textAttachment || VERTICAL_ALIGN.TOP,
    blockAttachment: opts.blockAttachment || BLOCK_ATTACHMENT.CENTER_EXTENTS,
    leaderContent: opts.leaderContent ?? null,
    contentAnchor: opts.contentAnchor ??
      {
        x: 0,
        y: 0,
      },
  };
};

export const newDimensionElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucDimensionElement> => ({
    ..._newElementBase<DucDimensionElement>("dimension", currentScope, opts),
    type: 'dimension',
    // Default properties for a new dimension element
} as NonDeleted<DucDimensionElement>);

export const newFeatureControlFrameElement = (
  currentScope: Scope,
  opts: ElementConstructorOpts
): NonDeleted<DucFeatureControlFrameElement> => {
  return {
    ..._newElementBase<DucFeatureControlFrameElement>("featurecontrolframe", currentScope, opts),
    type: "featurecontrolframe",
    rows: [],
    leaderElementId: null,
    textStyle: getDefaultTextStyle(currentScope),
    layout: {
      padding: getPrecisionValueFromRaw(4 as RawValue, currentScope, currentScope),
      segmentSpacing: getPrecisionValueFromRaw(4 as RawValue, currentScope, currentScope),
      rowSpacing: getPrecisionValueFromRaw(2 as RawValue, currentScope, currentScope),
    },
    symbols: {
      scale: 1,
    },
    datumStyle: {
      bracketStyle: DATUM_BRACKET_STYLE.SQUARE
    },
  };
};

export const newBlockInstanceElement = (
  currentScope: Scope,
  opts: {
    blockId: DucBlockInstanceElement["blockId"];
    elementOverrides?: DucBlockInstanceElement["elementOverrides"];
    attributeValues?: DucBlockInstanceElement["attributeValues"];
    duplicationArray?: DucBlockInstanceElement["duplicationArray"];
  } & ElementConstructorOpts
): NonDeleted<DucBlockInstanceElement> => ({
  ..._newElementBase<DucBlockInstanceElement>("blockinstance", currentScope, opts),
  type: "blockinstance",
  blockId: opts.blockId,
  elementOverrides: opts.elementOverrides ?? {},
  attributeValues: opts.attributeValues ?? {},
  duplicationArray: opts.duplicationArray ?? null,
});

export const newParametricElement = (currentScope: Scope, opts: ElementConstructorOpts): NonDeleted<DucParametricElement> => ({
    ..._newElementBase<DucParametricElement>("parametric", currentScope, opts),
    type: 'parametric',
    source: { type: PARAMETRIC_SOURCE_TYPE.CODE, code: "" },
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
      if (val.hasOwnProperty(key)) {
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
