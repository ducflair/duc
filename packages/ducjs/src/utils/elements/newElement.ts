import { IMAGE_STATUS } from "ducjs/duc";
import { RawValue, Scope } from "ducjs/types";
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
  DucPolygonElement,
  DucTableElement,
  DucTextContainer,
  DucTextElement,
  ElementConstructorOpts,
  ElementUpdate,
  LineHead,
  NonDeleted
} from "ducjs/types/elements";
import { Merge, Mutable } from "ducjs/types/utility-types";
import {
  getUpdatedTimestamp
} from "ducjs/utils";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_ELLIPSE_ELEMENT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FREEDRAW_ELEMENT,
  DEFAULT_LINEAR_ELEMENT_STROKE,
  DEFAULT_POLYGON_SIDES,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN
} from "ducjs/utils/constants";
import { getDefaultStackProperties, getDefaultTable } from "ducjs/utils/elements";
import {
  getFontString,
  getTextElementPositionOffsets,
  measureText,
} from "ducjs/utils/elements/textElement";
import { randomId, randomInteger } from "ducjs/utils/math/random";
import { normalizeText } from "ducjs/utils/normalize";
import { getPrecisionValueFromRaw } from "ducjs/utils/scopes";


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
    stroke = [DEFAULT_ELEMENT_PROPS.stroke],
    background = [DEFAULT_ELEMENT_PROPS.background],
    opacity = DEFAULT_ELEMENT_PROPS.opacity,
    width = DEFAULT_ELEMENT_PROPS.width,
    height = DEFAULT_ELEMENT_PROPS.height,
    angle = DEFAULT_ELEMENT_PROPS.angle,
    groupIds = DEFAULT_ELEMENT_PROPS.groupIds,
    frameId = DEFAULT_ELEMENT_PROPS.frameId,
    roundness = DEFAULT_ELEMENT_PROPS.roundness,
    boundElements = DEFAULT_ELEMENT_PROPS.boundElements,
    link = DEFAULT_ELEMENT_PROPS.link,
    locked = DEFAULT_ELEMENT_PROPS.locked,
    noPlot = DEFAULT_ELEMENT_PROPS.noPlot,
    description = DEFAULT_ELEMENT_PROPS.description,
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
    isDeleted: false as false,
    boundElements,
    updated: getUpdatedTimestamp(),
    link,
    locked,
    zIndex,
    noPlot,
    description,
    customData: rest.customData,
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
  opts: {
  } & ElementConstructorOpts,
): NonDeleted<DucFrameElement> => {
  return newElementWith(
    {
      ...getDefaultStackProperties(),
      ..._newElementBase<DucFrameElement>("frame", currentScope, opts),
    },
    {},
  );
};


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
    text: DucTextElement["text"];
    originalText?: DucTextElement["originalText"];
    fontSize?: DucTextElement["fontSize"];
    fontFamily?: DucTextElement["fontFamily"];
    textAlign?: DucTextElement["textAlign"];
    verticalAlign?: DucTextElement["verticalAlign"];
    containerId?: DucTextContainer["id"] | null;
    lineHeight?: DucTextElement["lineHeight"];
    autoResize?: DucTextElement["autoResize"];
  } & ElementConstructorOpts,
): NonDeleted<DucTextElement> => {
  const scope = opts.scope ?? currentScope;
  const fontFamily = opts.fontFamily || DEFAULT_FONT_FAMILY;
  const fontSize = opts.fontSize || getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, scope, currentScope);
  // const lineHeight = opts.lineHeight || getLineHeight(fontFamily); // TODO: find a more flexible way of getting the line height for custom fonts in the future
  const lineHeight = opts.lineHeight || 1.2 as DucTextElement["lineHeight"];
  const text = normalizeText(opts.text);
  const metrics = measureText(
    text,
    getFontString({ fontFamily, fontSize }),
    lineHeight,
    currentScope,
  );
  const textAlign = opts.textAlign || DEFAULT_TEXT_ALIGN;
  const verticalAlign = opts.verticalAlign || DEFAULT_VERTICAL_ALIGN;
  const offsets = getTextElementPositionOffsets(
    { textAlign, verticalAlign },
    metrics,
  );

  const textElementProps: DucTextElement = {
    ..._newElementBase<DucTextElement>("text", currentScope, opts),
    text,
    fontSize,
    fontFamily,
    textAlign,
    verticalAlign,
    x: getPrecisionValueFromRaw(opts.x.value - offsets.x as RawValue, scope, currentScope),
    y: getPrecisionValueFromRaw(opts.y.value - offsets.y as RawValue, scope, currentScope),
    width: getPrecisionValueFromRaw(metrics.width, scope, currentScope),
    height: getPrecisionValueFromRaw(metrics.height, scope, currentScope),
    containerId: opts.containerId || null,
    originalText: opts.originalText ?? text,
    autoResize: opts.autoResize ?? true,
    lineHeight,
  };

  const textElement: DucTextElement = newElementWith(
    textElementProps,
    {},
  );

  return textElement;
};

export const newFreeDrawElement = (
  currentScope: Scope,
  opts: {
    type: "freedraw";
    points?: DucFreeDrawElement["points"];
    size?: DucFreeDrawElement["size"];
    simulatePressure: boolean;
    pressures?: DucFreeDrawElement["pressures"];
    thinning?: DucFreeDrawElement["thinning"];
    smoothing?: DucFreeDrawElement["smoothing"];
    streamline?: DucFreeDrawElement["streamline"];
    easing?: DucFreeDrawElement["easing"];
    start?: DucFreeDrawElement["start"];
    end?: DucFreeDrawElement["end"];
  } & ElementConstructorOpts,
): NonDeleted<DucFreeDrawElement> => {
  const scope = opts.scope ?? currentScope;
  return {
    ..._newElementBase<DucFreeDrawElement>(opts.type, currentScope, opts),
    points: opts.points || [],
    size: opts.size || getPrecisionValueFromRaw(DEFAULT_FREEDRAW_ELEMENT.size, scope, currentScope),
    pressures: opts.pressures || [],
    simulatePressure: opts.simulatePressure,
    thinning: opts.thinning || DEFAULT_FREEDRAW_ELEMENT.thinning,
    smoothing: opts.smoothing || DEFAULT_FREEDRAW_ELEMENT.smoothing,
    streamline: opts.streamline || DEFAULT_FREEDRAW_ELEMENT.streamline,
    easing: opts.easing || DEFAULT_FREEDRAW_ELEMENT.easing,
    lastCommittedPoint: null,
    start: opts.start || null,
    end: opts.end || null,
    svgPath: null,
  };
};

export const newLinearElement = (
  currentScope: Scope,
  opts: {
    type: DucLinearElement["type"];
    points?: DucLinearElement["points"];
    lines?: DucLinearElement["lines"];
    pathOverrides?: DucLinearElement["pathOverrides"];
  } & ElementConstructorOpts,
): NonDeleted<DucLinearElement> => {
  return {
    ..._newElementBase<DucLinearElement>(opts.type, currentScope, opts),
    stroke: opts.stroke || [DEFAULT_LINEAR_ELEMENT_STROKE],
    points: opts.points || [],
    lines: opts.lines || [],
    pathOverrides: opts.pathOverrides || [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
  };
};

export const newArrowElement = (
  currentScope: Scope,
  opts: {
    type: DucArrowElement["type"];
    startArrowhead?: LineHead | null;
    endArrowhead?: LineHead | null;
    points?: DucArrowElement["points"];
    lines?: DucArrowElement["lines"];
    pathOverrides?: DucArrowElement["pathOverrides"];
    elbowed?: boolean;
  } & ElementConstructorOpts,
): NonDeleted<DucArrowElement> => {
  return {
    ..._newElementBase<DucArrowElement>(opts.type, currentScope, opts),
    points: opts.points || [],
    lines: opts.lines || [],
    pathOverrides: opts.pathOverrides || [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    elbowed: opts.elbowed || true,
  };
};

export const newImageElement = (
  currentScope: Scope,
  opts: {
    type: DucImageElement["type"];
    status?: DucImageElement["status"];
    fileId?: DucImageElement["fileId"];
    scale?: DucImageElement["scale"];
  } & ElementConstructorOpts,
): NonDeleted<DucImageElement> => {
  return {
    ..._newElementBase<DucImageElement>("image", currentScope, opts),
    status: opts.status ?? IMAGE_STATUS.PENDING,
    fileId: opts.fileId ?? null,
    scale: opts.scale ?? [1, 1],
    crop: null,
  };
};

export const newTableElement = (
  currentScope: Scope,
  opts: {
    type: "table";
    columnOrder?: DucTableElement["columnOrder"];
    rowOrder?: DucTableElement["rowOrder"];
    columns?: DucTableElement["columns"];
    rows?: DucTableElement["rows"];
    cells?: DucTableElement["cells"];
    style?: DucTableElement["style"];
  } & ElementConstructorOpts,
): NonDeleted<DucTableElement> => {
  return {
    ...getDefaultTable(currentScope),
    ...opts,
    ..._newElementBase<DucTableElement>(
      opts.type,
      currentScope,
      opts,
    ),
  };
};

export const newDocElement = (
  currentScope: Scope,
  opts: {
    type: "doc";
    content?: string;
  } & ElementConstructorOpts,
): NonDeleted<DucDocElement> => {
  return {
    ...opts,
    ..._newElementBase<DucDocElement>(
      opts.type,
      currentScope,
      opts,
    ),
    content: opts.content || "",
  };
};

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