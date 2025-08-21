import type { BinaryFiles, LibraryItem, LibraryItems, LibraryItems_anyVersion, PrecisionValue, RawValue, RendererState, Scope, ScopedValue } from "ducjs/legacy/v1/types";
import { DucState } from "ducjs/legacy/v1/types";
import type {
  BezierMirroring,
  DucBlock,
  DucDocElement,
  DucElement,
  DucFrameElement,
  DucFreeDrawEasing,
  DucFreeDrawEnds,
  DucGroup,
  DucLine,
  DucLinearElement,
  DucPath,
  DucPoint,
  DucPointBinding,
  DucSelectionElement,
  DucTableCell,
  DucTableColumn,
  DucTableElement,
  DucTableRow,
  DucTableStyleProps,
  DucTextElement,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  ElementSubset,
  FillStyle,
  FontFamilyValues,
  ImageStatus,
  LineHead,
  NonDeleted,
  OrderedDucElement,
  StrokeCap,
  StrokeJoin,
  StrokePreference,
  StrokeSidePreference,
  StrokeSides,
  StrokeStyle,
  TextAlign,
  VerticalAlign
} from "ducjs/legacy/v1/types/elements";
import {
  isElbowArrow,
  isLinearElement,
  isTextElement
} from "ducjs/legacy/v1/types/elements/typeChecks";
import { Percentage, Radian } from "ducjs/legacy/v1/types/geometryTypes";
import type { MarkOptional, Mutable, ValueOf } from "ducjs/legacy/v1/types/utility-types";
import {
  arrayToMap,
  getUpdatedTimestamp,
  isFiniteNumber,
  updateActiveTool,
} from "ducjs/legacy/v1/utils";
import { getContainerElement } from "ducjs/legacy/v1/utils/bounds";
import {
  BEZIER_MIRRORING,
  BLENDING,
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_ELLIPSE_ELEMENT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FREEDRAW_ELEMENT,
  DEFAULT_POLYGON_SIDES,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  DEFAULT_ZOOM_STEP,
  ELEMENT_CONTENT_PREFERENCE,
  ELEMENT_SUBSET,
  FONT_FAMILY,
  IMAGE_STATUS,
  LINE_CONFIRM_THRESHOLD,
  LINE_HEAD,
  MAX_ZOOM_STEP,
  MIN_ZOOM_STEP,
  STROKE_CAP,
  STROKE_JOIN,
  STROKE_PLACEMENT,
  STROKE_PREFERENCE,
  STROKE_SIDE_PREFERENCE,
  TEXT_ALIGN,
  VERSIONS,
  VERTICAL_ALIGN
} from "ducjs/legacy/v1/utils/constants";
import {
  bumpVersion, getDefaultStackProperties, getNonDeletedElements,
  isInvisiblySmallElement, migratePoints
} from "ducjs/legacy/v1/utils/elements";
import { getNormalizedPoints, mergeOverlappingPoints, validateClosedPath } from "ducjs/legacy/v1/utils/elements/linearElement";
import { detectLineHeight, refreshTextDimensions } from "ducjs/legacy/v1/utils/elements/textElement";
import { getSizeFromPoints } from "ducjs/legacy/v1/utils/math";
import { randomId } from "ducjs/legacy/v1/utils/math/random";
import { getPrecisionScope, ScaleFactors, SupportedMeasures } from "ducjs/legacy/v1/utils/measurements";
import {
  getNormalizedDimensions,
  getNormalizedGridSize,
  getNormalizedGridStep,
  getNormalizedZoom,
  normalizeFixedPoint,
} from "ducjs/legacy/v1/utils/normalize";
import { getPrecisionValueFromRaw, getPrecisionValueFromScoped, getScaledZoomValueForScope, getScopedBezierPointFromDucPoint, getScopedZoomValue, NEUTRAL_SCOPE } from "ducjs/legacy/v1/utils/scopes";
import { DESIGN_STANDARD, DesignStandard } from "ducjs/legacy/v1/utils/standards";
import { getDefaultDucState } from "ducjs/legacy/v1/utils/state";
import { normalizeLink } from "ducjs/legacy/v1/utils/url";
import tinycolor from "tinycolor2";

type RestoredDucState = Omit<
  DucState,
  "offsetTop" | "offsetLeft" | "width" | "height"
>;


export interface ExportedDataState {
  type: string;
  version: number;
  source: string;
  elements: readonly DucElement[];
  appState: DucState;
  files: BinaryFiles | undefined;
}

export interface ImportedDataState {
  type?: string;
  version?: number;
  source?: string;
  elements?: readonly DucElement[] | null;
  appState?: Readonly<Partial<DucState>> | null;
  scrollToContent?: boolean;
  libraryItems?: LibraryItems_anyVersion;
  files?: BinaryFiles;
  rendererState?: RendererState;
  blocks?: readonly DucBlock[];
  groups?: readonly DucGroup[];
}

export interface ImportedExtendedDataState<TExtendedAppState = any> {
  type?: string;
  version?: number;
  source?: string;
  elements?: readonly DucElement[] | null;
  appState?: Readonly<Partial<TExtendedAppState>> | null;
  scrollToContent?: boolean;
  libraryItems?: LibraryItems_anyVersion;
  files?: BinaryFiles;
  rendererState?: RendererState;
  blocks?: readonly DucBlock[];
  groups?: readonly DucGroup[];
}

export interface ExportedLibraryData {
  type: string;
  version: typeof VERSIONS.excalidrawLibrary;
  source: string;
  libraryItems: LibraryItems;
}

export interface ImportedLibraryData extends Partial<ExportedLibraryData> {
  /** @deprecated v1 */
  library?: LibraryItems;
}

export type RestoredDataState = {
  elements: OrderedDucElement[];
  appState: RestoredDucState;
  files: BinaryFiles;
  rendererState: RendererState | null;
  blocks: DucBlock[];
  groups: DucGroup[];
};

export type RestoredExtendedDataState<TExtendedAppState = any> = {
  elements: OrderedDucElement[];
  appState: TExtendedAppState;
  files: BinaryFiles;
  rendererState: RendererState | null;
  blocks: DucBlock[];
  groups: DucGroup[];
};

// Extended AppState restorer function type
export type ExtendedAppStateRestorer<TExtendedAppState> = (
  extendedAppState: Partial<TExtendedAppState> | null | undefined,
  localExtendedAppState: Partial<TExtendedAppState> | null | undefined,
  restoredDucState: RestoredDucState,
) => TExtendedAppState;

export type ElementsConfig = {
  syncInvalidIndices: (
    elements: readonly DucElement[],
    currentScope: Scope,
  ) => OrderedDucElement[];
  refreshDimensions?: boolean;
  repairBindings?: boolean;
  appState?: Readonly<Partial<DucState>> | null;
}


export const AllowedDucActiveTools: Record<
  DucState["activeTool"]["type"],
  boolean
> = {
  selection: true,
  text: true,
  rectangle: true,
  polygon: true,
  ellipse: true,
  line: true,
  image: true,
  arrow: true,
  freedraw: true,
  eraser: false,
  custom: true,
  frame: true,
  embeddable: true,
  hand: true,
  laser: false,
  ruler: false,
  magicframe: false,
  lasso: true,
  table: true,
};

export const isValidElementScopeValue = (value: string | undefined, appState?: Readonly<Partial<DucState>> | null): SupportedMeasures => {
  // Only check if the provided value is valid
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as SupportedMeasures;
  }
  return appState?.mainScope ?? NEUTRAL_SCOPE;
};

export const isValidAppStateScopeValue = (value: string | undefined): SupportedMeasures => {
  // Only check if the provided value is valid
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as SupportedMeasures;
  }
  return NEUTRAL_SCOPE;
};

export const isValidAppStateScopeExponentThresholdValue = (value: number | undefined, defaultValue: number): number => {
  const finite = isValidFinitePositiveByteValue(value, defaultValue);
  if (finite >= 1 && finite <= 36) {
    return finite;
  }
  return defaultValue;
};

export const isValidPrecisionScopeValue = (zoom: number, mainScope: SupportedMeasures, scopeExponentThreshold: number): SupportedMeasures => {
  return getPrecisionScope(zoom, mainScope, scopeExponentThreshold) as SupportedMeasures;
};

const createHeadOnlyBinding = (head: LineHead | null | undefined, currentScope: SupportedMeasures): DucPointBinding => {
  return {
    elementId: "",
    focus: 0,
    gap: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
    fixedPoint: null,
    point: null,
    head: isValidLineHeadValue(head),
  };
};

const restoreElementWithProperties = <
  T extends DucElement,
  K extends Partial<T>
>(
  element: T,
  extra: K & Partial<Pick<DucElement, "type" | "x" | "y" | "customData">>,
  appState?: Readonly<Partial<DucState>> | null,
): T => {

  const _element = { ...element, ...extra };
  const elementScope = isValidElementScopeValue(_element.scope, appState);
  const currentScope = isValidElementScopeValue(appState?.scope, appState);
  // Handle legacy stroke properties first
  let stroke = [DEFAULT_ELEMENT_PROPS.stroke];
  if (_element.strokeColor) {
    // Legacy strokeColor property
    stroke = [{
      ...DEFAULT_ELEMENT_PROPS.stroke,
      content: validateDeprecatedElementContent(_element.strokeColor, DEFAULT_ELEMENT_PROPS.stroke.content),
      width: restorePrecisionValue(((_element as any).strokeWidth) || DEFAULT_ELEMENT_PROPS.stroke.width.value, elementScope, currentScope, DEFAULT_ELEMENT_PROPS.stroke.width.value),
    }];
  } else if (_element.stroke) {
    // New stroke array property
    stroke = _element.stroke.map(s => validateStroke(s, elementScope, currentScope));
  }

  // Handle legacy background properties
  let background = [DEFAULT_ELEMENT_PROPS.background];
  if (_element.backgroundColor) {
    // Legacy backgroundColor property
    background = [{
      ...DEFAULT_ELEMENT_PROPS.background,
      content: validateDeprecatedElementContent(_element.backgroundColor, DEFAULT_ELEMENT_PROPS.background.content)
    }];
  } else if (_element.background) {
    // New background array property
    background = _element.background.map(bg => validateBackground(bg));
  }

  const base: Partial<DucElement> = {
    type: _element.type,
    id: _element.id || randomId(),
    version: _element.version || 1,
    versionNonce: _element.versionNonce ?? 0,
    index: _element.index ?? null,
    isDeleted: isValidBoolean(_element.isDeleted, false),
    blending: isValidBlendingValue(_element.blending),
    stroke,
    background,
    opacity: isValidPercentageValue(_element.opacity, DEFAULT_ELEMENT_PROPS.opacity),
    angle: isValidRadianValue(_element.angle, DEFAULT_ELEMENT_PROPS.angle),
    x: restorePrecisionValue(_element.x, elementScope, currentScope, 0),
    y: restorePrecisionValue(_element.y, elementScope, currentScope, 0),
    scope: elementScope,
    subset: isValidSubsetValue(_element.subset),
    label: _element.label ?? "Lost Element Label",
    isVisible: isValidBoolean(_element.isVisible, DEFAULT_ELEMENT_PROPS.isVisible),
    width: restorePrecisionValue(_element.width, elementScope, currentScope, 0),
    height: restorePrecisionValue(_element.height, elementScope, currentScope, 0),
    seed: _element.seed ?? 1,
    groupIds: _element.groupIds ?? [],
    frameId: _element.frameId ?? null,
    roundness: restorePrecisionValue(_element.roundness, elementScope, currentScope, DEFAULT_ELEMENT_PROPS.roundness.value),
    boundElements: _element.boundElements ?? [],
    updated: _element.updated ?? getUpdatedTimestamp(),
    link: _element.link ? normalizeLink(_element.link) : null,
    locked: isValidBoolean(_element.locked, false),
  };

  if ("customData" in element || "customData" in extra) {
    (base as any).customData = _element.customData;
  }

  const normalizedRaw = getNormalizedDimensions(base as Required<Pick<DucElement, "width" | "height" | "x" | "y">>);
  const normalized = {
    x: restorePrecisionValue(normalizedRaw.x, elementScope, currentScope, 0, true),
    y: restorePrecisionValue(normalizedRaw.y, elementScope, currentScope, 0, true),
    width: restorePrecisionValue(normalizedRaw.width, elementScope, currentScope, 0, true),
    height: restorePrecisionValue(normalizedRaw.height, elementScope, currentScope, 0, true),
  };

  return {
    ..._element,
    ...base,
    ...normalized,
  } as unknown as T;
};

const restoreElement = (
  element: Exclude<DucElement, DucSelectionElement>,
  currentScope: SupportedMeasures,
  appState?: Readonly<Partial<DucState>> | null,
): typeof element | null => {

  // Migration: convert deprecated 'diamond' to 'polygon' with 4 sides
  if ((element as any).type === "diamond") {
    const migrated = { ...element, type: "polygon", sides: 4 } as any;
    return restoreElement(migrated, currentScope, appState);
  }
  switch (element.type) {
    case "text": {
      let fontSize: PrecisionValue | number = element.fontSize;
      let fontFamily = element.fontFamily;
      if ("font" in element) {
        try {
          const fontParts = String((element as any).font).split(" ");
          if (fontParts.length === 2) {
            const [fontSizeStr, fontFamilyName] = fontParts;
            const parsedSize = parseFloat(fontSizeStr);
            if (!isNaN(parsedSize) && Number.isFinite(parsedSize)) {
              fontSize = parsedSize;
              fontFamily = getFontFamilyByName(fontFamilyName);
            }
          }
        } catch (error) {
          console.error("Failed to parse legacy font value:", error);
          fontSize = DEFAULT_FONT_SIZE;
          fontFamily = DEFAULT_FONT_FAMILY;
        }
      }
      const text = (typeof element.text === "string" && element.text) || "";

      const lineHeight =
        element.lineHeight && Number.isFinite(element.lineHeight)
          ? element.lineHeight
          : element.height && Number.isFinite(element.height)
            ? detectLineHeight(element)
            // : getLineHeight(element.fontFamily);
            : 1 as (number & { _brand: "unitlessLineHeight" }); // FIXME: We need better handling to get the font line height

      const textElementScope = isValidElementScopeValue(element.scope, appState);
      const finalFontSize = restorePrecisionValue(fontSize, textElementScope, currentScope, DEFAULT_FONT_SIZE);

      const textElement = restoreElementWithProperties(element, {
        fontSize: finalFontSize,
        fontFamily,
        text,
        textAlign: isValidTextAlignValue(element.textAlign),
        verticalAlign: isValidVerticalAlignValue(element.verticalAlign),
        containerId: element.containerId ?? null,
        originalText: element.originalText || text,
        autoResize: isValidBoolean(element.autoResize, true),
        lineHeight,
      }, appState);

      // if empty text, mark as deleted. We keep in array
      // for data integrity purposes (collab etc.)
      if (!text && !isValidBoolean(element.isDeleted, false)) {
        element = { ...element, originalText: text, isDeleted: true };
        element = bumpVersion(element);
      }

      return textElement;
    }
    case "freedraw": {
      const elementScope = isValidElementScopeValue(element.scope, appState);
      const points = restoreElementPoints({
        points: element.points as DucPoint[],
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        elementScope,
        currentScope,
      });

      return restoreElementWithProperties(element, {
        points,
        size: restorePrecisionValue(element.size, elementScope, currentScope, DEFAULT_FREEDRAW_ELEMENT.size),
        lastCommittedPoint: element.lastCommittedPoint
          ? restorePoint(element.lastCommittedPoint as DucPoint, elementScope, currentScope)
          : null,
        simulatePressure: isValidBoolean(element.simulatePressure, false),
        pressures: Array.isArray(element.pressures) ? element.pressures : [],
        thinning: isValidPercentageValue(
          element.thinning,
          DEFAULT_FREEDRAW_ELEMENT.thinning,
          true,
        ),
        smoothing: isValidPercentageValue(
          element.smoothing,
          DEFAULT_FREEDRAW_ELEMENT.smoothing,
        ),
        streamline: isValidPercentageValue(
          element.streamline,
          DEFAULT_FREEDRAW_ELEMENT.streamline,
        ),
        easing: isValidFreeDrawEasingValue(element.easing as DucFreeDrawEasing),
        start: restoreFreeDrawEnds(element.start),
        end: restoreFreeDrawEnds(element.end),
      }, appState);
    }
    case "image":
      return restoreElementWithProperties(element, {
        status: isValidImageStatusValue(element.status),
        fileId: element.fileId,
        scale: isValidImageScaleValue(element.scale),
      }, appState);

    case "line": {
      // Don't normalize points if there are bindings
      const hasBindings = !!(element.startBinding || element.endBinding);
      const elementScope = isValidElementScopeValue(element.scope, appState);

      const { points, lines } = restoreLinearElementPointsAndLines({
        points: element.points as DucPoint[],
        lines: element.lines as DucLine[],
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        elementScope,
        currentScope,
        skipNormalization: hasBindings,
      });

      const isEditing = false; // TODO: Handle editingLinearElement properly

      let finalPoints = points;
      // Ensure we have at least 2 points for visibility check
      if (finalPoints.length < 2 && !isEditing) {
        const elementWidth = restorePrecisionValue(element.width, elementScope, currentScope, 0);
        const elementHeight = restorePrecisionValue(element.height, elementScope, currentScope, 0);

        finalPoints = [
          {
            x: getPrecisionValueFromRaw(0 as RawValue, elementScope, currentScope),
            y: getPrecisionValueFromRaw(0 as RawValue, elementScope, currentScope),
            mirroring: undefined,
          },
          {
            x: elementWidth,
            y: elementHeight,
            mirroring: undefined,
          }
        ];
      }

      // Handle bindings, with special case for head-only bindings
      const startBinding = element.startBinding;
      const endBinding = element.endBinding;

      // Process bindings
      const processedStartBinding = startBinding && startBinding.head !== undefined &&
        (!startBinding.elementId || startBinding.elementId === "")
        ? createHeadOnlyBinding(startBinding.head, currentScope)
        : repairBinding(element as DucLinearElement, startBinding, currentScope);

      const processedEndBinding = endBinding && endBinding.head !== undefined &&
        (!endBinding.elementId || endBinding.elementId === "")
        ? createHeadOnlyBinding(endBinding.head, currentScope)
        : repairBinding(element as DucLinearElement, endBinding, currentScope);

      // Create the base restored element
      const sizeFromPoints = !hasBindings && getSizeFromPoints(finalPoints.map(getScopedBezierPointFromDucPoint));
      let restoredElement = restoreElementWithProperties(element, {
        points: finalPoints,
        lines,
        lastCommittedPoint: element.lastCommittedPoint ? restorePoint(element.lastCommittedPoint, element.scope, currentScope) : null,
        startBinding: processedStartBinding,
        endBinding: processedEndBinding,
        x: element.x,
        y: element.y,
        // Only calculate size from points if we don't have bindings
        ...(!sizeFromPoints ? {} : {
          width: getPrecisionValueFromScoped(sizeFromPoints.width, element.scope, currentScope),
          height: getPrecisionValueFromScoped(sizeFromPoints.height, element.scope, currentScope),
        }),
      }, appState);

      const { points: updatedPoints, lines: updatedLines } = mergeOverlappingPoints(finalPoints, lines, LINE_CONFIRM_THRESHOLD as RawValue);

      restoredElement = {
        ...restoredElement,
        points: updatedPoints,
        lines: updatedLines,
      };

      // Validate path overrides after we have the final points and lines
      const validatedPathOverrides = validatePathOverrides(
        element.pathOverrides,
        restoredElement,
        elementScope,
        currentScope
      );

      return {
        ...restoredElement,
        pathOverrides: validatedPathOverrides,
      }

    }

    case "arrow": {
      // since arrow is deprecated, we convert it to line
      return restoreElement({
        ...element,
        type: "line",
      }, currentScope, appState);
    }

    case "ellipse": {
      const ratio = isValidPercentageValue(
        element.ratio,
        DEFAULT_ELLIPSE_ELEMENT.ratio,
      );
      const startAngle = isValidCutAngleValue(
        element.startAngle,
        DEFAULT_ELLIPSE_ELEMENT.startAngle,
      );
      const endAngle = isValidCutAngleValue(
        element.endAngle,
        DEFAULT_ELLIPSE_ELEMENT.endAngle,
      );
      const showAuxCrosshair =
        element.showAuxCrosshair ?? DEFAULT_ELLIPSE_ELEMENT.showAuxCrosshair;

      return restoreElementWithProperties(element, {
        ratio,
        startAngle,
        endAngle,
        showAuxCrosshair,
      }, appState);
    }
    case "rectangle":
    case "embeddable":
      return restoreElementWithProperties(element, {}, appState);

    case "polygon": {
      const sides = isValidPolygonSides(element.sides);
      return restoreElementWithProperties(
        { ...element, sides },
        {},
        appState
      );
    }

    case "frame": {
      const frameElement = element as DucFrameElement;
      return restoreElementWithProperties(frameElement, {
        ...restoreDucStackProperties(frameElement, currentScope),
      }, appState);
    }
    case "table": {
      const tableElement = element as DucTableElement;
      return restoreElementWithProperties(tableElement, {
        columnOrder: tableElement.columnOrder || [],
        rowOrder: tableElement.rowOrder || [],
        columns: restoreTableColumns(tableElement.columns, element.scope, currentScope),
        rows: restoreTableRows(tableElement.rows, element.scope, currentScope),
        cells: restoreTableCells(tableElement.cells, element.scope, currentScope),
        style: tableElement.style ? restoreTableStyleProps(tableElement.style, element.scope, currentScope) : undefined,
      }, appState);
    }
    case "doc": {
      const docElement = element as DucDocElement;
      return restoreElementWithProperties(docElement, {
        content: docElement.content || "",
      }, appState);
    }
  }
  return null;
};

/**
 * Converts a plain number or legacy value to a PrecisionValue object
 * @param value - The value to convert (can be a raw number or legacy value)
 * @param elementScope - The scope to use for the precision value
 * @returns A properly formatted PrecisionValue object
 */
export const restorePrecisionValue = (
  value: number | PrecisionValue | undefined,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures,
  defaultValue?: number,
  fromScoped: boolean = false,
): PrecisionValue => {
  const fallbackValue = getPrecisionValueFromRaw((defaultValue ?? 0) as RawValue, currentScope, currentScope);

  if (value === undefined || value === null) {
    // Return default value with given scope
    return fallbackValue;
  }

  if (typeof value === 'number') {
    // If value is a number, check if it's finite. Otherwise, use fallback.
    if (!Number.isFinite(value)) {
      return fallbackValue;
    }
    // Legacy value (finite number), convert to PrecisionValue
    return fromScoped
      ? getPrecisionValueFromScoped(value as ScopedValue, elementScope, currentScope)
      : getPrecisionValueFromRaw(value as RawValue, elementScope, currentScope);
  }

  return getPrecisionValueFromRaw(value.value, elementScope, currentScope);
};

/**
 * Restores a point that might have legacy format (x,y as numbers)
 * @param point - The point to restore
 * @param elementScope - The scope to use for the precision values
 * @returns A properly formatted DucPoint
 */
export const restorePoint = (
  point: Partial<DucPoint> | {
    x: number | PrecisionValue,
    y: number | PrecisionValue,
    isCurve?: boolean,
    mirroring?: BezierMirroring,
    handleIn?: { x: number | PrecisionValue, y: number | PrecisionValue },
    handleOut?: { x: number | PrecisionValue, y: number | PrecisionValue },
    borderRadius?: number | PrecisionValue,
  } | undefined,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures,
): DucPoint | null => {
  if (!point) {
    return null;
  }

  // Handle x and y conversion
  const xValue = restorePrecisionValue(point.x, elementScope, currentScope);
  const yValue = restorePrecisionValue(point.y, elementScope, currentScope);

  if (!xValue || !yValue) {
    return null;
  }

  // Only keep the new DucPoint structure, ignore legacy properties
  return {
    x: xValue,
    y: yValue,
    mirroring: isValidBezierMirroringValue(point.mirroring),
  };
};

const restoreElementPoints = ({
  points: oldPoints,
  x,
  y,
  width,
  height,
  elementScope,
  currentScope,
}: {
  points: any[];
  x: number | PrecisionValue;
  y: number | PrecisionValue;
  width: number | PrecisionValue;
  height: number | PrecisionValue;
  elementScope: SupportedMeasures;
  currentScope: SupportedMeasures;
}) => {
  // Convert input parameters to plain numbers if they're precision values
  const validatedWidth = restorePrecisionValue(
    width,
    elementScope,
    currentScope,
    0,
  );
  const validatedHeight = restorePrecisionValue(
    height,
    elementScope,
    currentScope,
    0,
  );

  // Process the points array with proper conversion
  let points: DucPoint[] = [];

  if (typeof oldPoints === "object" && Array.isArray(oldPoints)) {
    const migratedPoints = migratePoints(oldPoints);
    points = migratedPoints
      .map((point) => {
        const restoredPoint = restorePoint(point, elementScope, currentScope);
        if (!restoredPoint) {
          return null;
        }
        return restoredPoint;
      })
      .filter(Boolean) as DucPoint[];

    // Ensure we have at least 2 points for linear elements
    if (points.length === 1) {
      points.push({
        x: validatedWidth,
        y: validatedHeight,
        mirroring: undefined,
      });
    }
  } else {
    // Default two points
    points = [
      {
        x: getPrecisionValueFromRaw(0 as RawValue, elementScope, currentScope),
        y: getPrecisionValueFromRaw(0 as RawValue, elementScope, currentScope),
        mirroring: undefined,
      },
      {
        x: validatedWidth,
        y: validatedHeight,
        mirroring: undefined,
      },
    ];
  }

  if (
    points.length === 2 &&
    points[1] && // Should always be true if points.length === 2
    points[1].x.value === 0 &&
    points[1].y.value === 0 &&
    (validatedWidth.value !== 0 || validatedHeight.value !== 0)
  ) {
    points[1] = {
      ...points[1], // Preserve other properties like isCurve, etc.
      x: validatedWidth,
      y: validatedHeight,
    };
  }

  return points;
};

const restoreLinearElementPointsAndLines = ({
  points: oldPoints,
  lines: oldLines,
  x,
  y,
  width,
  height,
  elementScope,
  currentScope,
  skipNormalization,
}: {
  points: any[];
  lines: DucLine[] | undefined;
  x: number | PrecisionValue;
  y: number | PrecisionValue;
  width: number | PrecisionValue;
  height: number | PrecisionValue;
  elementScope: SupportedMeasures;
  currentScope: SupportedMeasures;
  skipNormalization?: boolean;
}) => {
  const validatedX = restorePrecisionValue(x, elementScope, currentScope, 0);
  const validatedY = restorePrecisionValue(y, elementScope, currentScope, 0);
  const validatedWidth = restorePrecisionValue(
    width,
    elementScope,
    currentScope,
    0,
  );
  const validatedHeight = restorePrecisionValue(
    height,
    elementScope,
    currentScope,
    0,
  );

  let points: DucPoint[] = restoreElementPoints({
    points: oldPoints,
    x,
    y,
    width,
    height,
    elementScope,
    currentScope,
  });
  let lines = oldLines;

  if (lines === undefined || lines === null) {
    lines = [];
    for (let i = 0; i < points.length - 1; i++) {
      lines.push([
        { index: i, handle: null },
        { index: i + 1, handle: null },
      ]);
    }
  } else {
    lines = lines.map((line) => {
      return [
        {
          index: line[0].index,
          handle: line[0].handle
            ? restorePoint(line[0].handle, elementScope, currentScope)
            : null,
        },
        {
          index: line[1].index,
          handle: line[1].handle
            ? restorePoint(line[1].handle, elementScope, currentScope)
            : null,
        },
      ];
    });
  }

  if (
    !skipNormalization &&
    points.length >= 2 &&
    (points[0].x.value !== 0 || points[0].y.value !== 0)
  ) {
    const normalizedResult = getNormalizedPoints(
      {
        points,
        lines,
        x: validatedX,
        y: validatedY,
        scope: elementScope,
      },
      currentScope,
    );

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    points = normalizedResult.points;
    lines = normalizedResult.lines;

    if (oldPoints && oldPoints.length === points.length) {
      if (firstPoint.x.value !== 0 || firstPoint.y.value !== 0) {
        points[0] = { ...points[0] };
      }
      if (
        lastPoint.x.value !== validatedWidth.value ||
        lastPoint.y.value !== validatedHeight.value
      ) {
        points[points.length - 1] = { ...points[points.length - 1] };
      }
    }
  }

  return { points, lines };
};

/**
 * Repairs container element's boundElements array by removing duplicates and
 * fixing containerId of bound elements if not present. Also removes any
 * bound elements that do not exist in the elements array.
 *
 * NOTE mutates elements.
 */
const repairContainerElement = (
  container: Mutable<DucElement>,
  elementsMap: Map<string, Mutable<DucElement>>,
) => {
  if (container.boundElements) {
    const boundElements = container.boundElements.slice();

    const boundIds = new Set<DucElement["id"]>();
    container.boundElements = boundElements.reduce(
      (
        acc: Mutable<NonNullable<DucElement["boundElements"]>>,
        binding,
      ) => {
        const boundElement = elementsMap.get(binding.id);
        if (boundElement && !boundIds.has(binding.id)) {
          boundIds.add(binding.id);

          if (boundElement.isDeleted) {
            return acc;
          }

          acc.push(binding);

          if (
            isTextElement(boundElement) &&
            !boundElement.containerId
          ) {
            (boundElement as Mutable<DucTextElement>).containerId =
              container.id;
          }
        }
        return acc;
      },
      [],
    );
  }
};

/**
 * Repairs target bound element's container's boundElements array,
 * or removes contaienrId if container does not exist.
 *
 * NOTE mutates elements.
 */
const repairBoundElement = (
  boundElement: Mutable<DucTextElement>,
  elementsMap: Map<string, Mutable<DucElement>>,
) => {
  const container = boundElement.containerId
    ? elementsMap.get(boundElement.containerId)
    : null;

  if (!container) {
    boundElement.containerId = null;
    return;
  }

  if (boundElement.isDeleted) {
    return;
  }

  if (
    container.boundElements &&
    !container.boundElements.find((binding) => binding.id === boundElement.id)
  ) {
    const boundElements = (
      container.boundElements || (container.boundElements = [])
    ).slice();
    boundElements.push({ type: "text", id: boundElement.id });
    container.boundElements = boundElements;
  }
};

/**
 * Remove an element's frameId if its containing frame is non-existent
 *
 * NOTE mutates elements.
 */
const repairFrameMembership = (
  element: Mutable<DucElement>,
  elementsMap: Map<string, Mutable<DucElement>>,
) => {
  if (element.frameId) {
    const containingFrame = elementsMap.get(element.frameId);

    if (!containingFrame) {
      element.frameId = null;
    }
  }
};

// Add this function to handle migrating from array-based ordering to explicit z-index
/**
 * Assigns z-index values to elements based on their position in the array.
 * This recreates the original visual stacking that was implied by array order
 * before explicit z-index support was added.
 */
export const migrateArrayOrderToZIndex = (elements: DucElement[]): DucElement[] => {
  // Check if we need to do a migration (if any element lacks z-index)
  const needsMigration = elements.some(el =>
    el.zIndex === undefined || el.zIndex === null
  );

  if (!needsMigration) {
    return elements;
  }

  // Create a new array with explicit z-index values
  return elements.map((element, index) => {
    // Only update elements that don't already have a valid z-index
    if (element.zIndex === undefined || element.zIndex === null) {
      return { ...element, zIndex: index };
    }
    return element;
  });
};

// Now update the restoreElements function to use our migration function
export const restoreElements = (
  elements: ImportedDataState["elements"],
  currentScope: Scope,
  /** NOTE doesn't serve for reconciliation */
  localElements: readonly DucElement[] | null | undefined,
  opts?: {
    refreshDimensions?: boolean;
    repairBindings?: boolean;
    appState?: Readonly<Partial<DucState>> | null;
    syncInvalidIndices?: (
      elements: readonly DucElement[],
      currentScope: Scope,
    ) => OrderedDucElement[];
  },
): OrderedDucElement[] => {
  const existingIds = new Set<string>();
  const localElementsMap = localElements ? arrayToMap(localElements) : null;

  // First restore all elements with their original properties
  const restored = (elements || []).reduce((elements, element) => {
    if (element.type !== "selection") {
      let migratedElement: DucElement | null = restoreElement(
        element,
        currentScope,
        opts?.appState,
      );
      const isEditing = false; // TODO: Handle editingLinearElement properly
      if (
        migratedElement &&
        (!isInvisiblySmallElement(migratedElement) || isEditing)
      ) {
        const localElement = localElementsMap?.get(element.id);
        if (localElement && localElement.version > migratedElement.version) {
          migratedElement = bumpVersion(migratedElement, localElement.version);
        }
        if (existingIds.has(migratedElement.id)) {
          migratedElement = { ...migratedElement, id: randomId() };
        }
        existingIds.add(migratedElement.id);

        elements.push(migratedElement);
      }
    }
    return elements;
  }, [] as DucElement[]);

  let restoredElements: OrderedDucElement[] = opts?.syncInvalidIndices
    ? opts.syncInvalidIndices(restored, currentScope)
    : (restored as OrderedDucElement[]);

  // Migrate array ordering to explicit z-index values if needed
  restoredElements = migrateArrayOrderToZIndex(restoredElements) as OrderedDucElement[];

  if (!opts?.repairBindings) {
    return restoredElements;
  }

  const restoredElementsMap = arrayToMap(restoredElements);
  for (const element of restoredElements) {
    if (element.frameId) {
      repairFrameMembership(element, restoredElementsMap);
    }

    if (isTextElement(element) && element.containerId) {
      repairBoundElement(element, restoredElementsMap);
    } else if (element.boundElements) {
      repairContainerElement(element, restoredElementsMap);
    }

    if (opts.refreshDimensions && isTextElement(element)) {
      Object.assign(
        element,
        refreshTextDimensions(
          element,
          getContainerElement(element, restoredElementsMap),
          restoredElementsMap,
          currentScope,
        ),
      );
    }

    if (isLinearElement(element)) {
      // Helper function to check if we should keep a binding
      const shouldKeepBinding = (binding: DucPointBinding | null): boolean => {
        if (!binding) return true; // No binding, nothing to remove

        // Keep head-only bindings
        if (binding.head !== undefined && (!binding.elementId || binding.elementId === "")) {
          return true;
        }

        // If binding has an elementId, check if it points to a valid element
        const elementExists = restoredElementsMap.has(binding.elementId);

        // For linear-to-linear bindings, ensure the point attribute is valid
        if (binding.point && elementExists) {
          const targetElement = restoredElementsMap.get(binding.elementId);
          if (isLinearElement(targetElement)) {
            // Check if the point index is within bounds of the target element's points
            if (binding.point.index >= 0 &&
              binding.point.index < targetElement.points.length &&
              Math.abs(binding.point.offset) <= 1) {
              return true;
            }
          }
        }

        return elementExists;
      };

      // Process start binding
      if (element.startBinding && !shouldKeepBinding(element.startBinding)) {
        (element as Mutable<DucLinearElement>).startBinding = null;
      }

      // Process end binding
      if (element.endBinding && !shouldKeepBinding(element.endBinding)) {
        (element as Mutable<DucLinearElement>).endBinding = null;
      }

      // Update the bound elements reference for each valid binding
      // This ensures both sides of the binding relationship are updated
      const updateBoundElementsRef = (binding: DucPointBinding | null) => {
        if (!binding || !binding.elementId) return;

        const targetElement = restoredElementsMap.get(binding.elementId);
        if (targetElement && !targetElement.isDeleted) {
          // Add the linear element to the target's boundElements if not already there
          if (!targetElement.boundElements?.some((be: { id: string }) => be.id === element.id)) {
            const boundElements = targetElement.boundElements || [];
            (targetElement as Mutable<DucElement>).boundElements = [...boundElements, {
              id: element.id,
              type: element.type
            }];
          }
        }
      };

      // Update bound elements references
      updateBoundElementsRef(element.startBinding);
      updateBoundElementsRef(element.endBinding);
    }
  }

  return restoredElements;
};

export const restoreDucState = (
  ducState: ImportedDataState["appState"],
  localDucState: Partial<DucState> | null | undefined,
): RestoredDucState => {
  ducState = ducState || {};
  const defaultDucState = getDefaultDucState();

  const scopeExponentThreshold = isValidAppStateScopeExponentThresholdValue(
    ducState.scopeExponentThreshold,
    defaultDucState.scopeExponentThreshold
  );
  const mainScope = isValidAppStateScopeValue(ducState.mainScope);
  const zoomValue = getNormalizedZoom(
    isFiniteNumber(ducState.zoom)
      ? ducState.zoom
      : ducState.zoom?.value ?? defaultDucState.zoom.value,
  );
  const scope = isValidPrecisionScopeValue(zoomValue, mainScope, scopeExponentThreshold);
  const scopedZoom = getScopedZoomValue(zoomValue, scope);

  return {
    ...defaultDucState,
    viewBackgroundColor: ducState.viewBackgroundColor ?? defaultDucState.viewBackgroundColor,
    scope,
    mainScope,
    standard: isValidStandard(ducState.standard) ?? defaultDucState.standard,
    scrollX: ducState.scrollX ?
      restorePrecisionValue(ducState.scrollX, NEUTRAL_SCOPE, scope) :
      getPrecisionValueFromRaw(defaultDucState.scrollX.value, NEUTRAL_SCOPE, scope),
    scrollY: ducState.scrollY ?
      restorePrecisionValue(ducState.scrollY, NEUTRAL_SCOPE, scope) :
      getPrecisionValueFromRaw(defaultDucState.scrollY.value, NEUTRAL_SCOPE, scope),
    zoom: {
      value: zoomValue,
      scoped: scopedZoom,
      scaled: getScaledZoomValueForScope(scopedZoom, scope),
    },
    name: ducState.name ?? defaultDucState.name,
    scrolledOutside: isValidBoolean(ducState.scrolledOutside, defaultDucState.scrolledOutside),
    selectedElementIds: ducState.selectedElementIds ?? defaultDucState.selectedElementIds,
    selectedGroupIds: ducState.selectedGroupIds ?? defaultDucState.selectedGroupIds,
    displayAllPointDistances: isValidBoolean(ducState.displayAllPointDistances, defaultDucState.displayAllPointDistances),
    displayDistanceOnDrawing: isValidBoolean(ducState.displayDistanceOnDrawing, defaultDucState.displayDistanceOnDrawing),
    displayAllPointCoordinates: isValidBoolean(ducState.displayAllPointCoordinates, defaultDucState.displayAllPointCoordinates),
    displayAllPointInfoSelected: isValidBoolean(ducState.displayAllPointInfoSelected, defaultDucState.displayAllPointInfoSelected),
    displayRootAxis: isValidBoolean(ducState.displayRootAxis, defaultDucState.displayRootAxis),
    lineBendingMode: isValidBoolean(ducState.lineBendingMode, defaultDucState.lineBendingMode),
    coordDecimalPlaces: isValidFinitePositiveByteValue(ducState.coordDecimalPlaces, defaultDucState.coordDecimalPlaces),
    activeGridSettings: ducState.activeGridSettings ?? defaultDucState.activeGridSettings,
    activeSnapSettings: ducState.activeSnapSettings ?? defaultDucState.activeSnapSettings,
    gridSize: getNormalizedGridSize(
      isFiniteNumber(ducState.gridSize) ? ducState.gridSize : defaultDucState.gridSize
    ),
    gridStep: getNormalizedGridStep(
      isFiniteNumber(ducState.gridStep) ? ducState.gridStep : defaultDucState.gridStep
    ),
    debugRendering: isValidBoolean(ducState.debugRendering, defaultDucState.debugRendering),
    editingLinearElement: ducState.editingLinearElement ?? defaultDucState.editingLinearElement,
    scopeExponentThreshold,
    elementHovered: ducState.elementHovered ?? defaultDucState.elementHovered,
    elementsPendingErasure: ducState.elementsPendingErasure ?? defaultDucState.elementsPendingErasure,
    suggestedBindings: ducState.suggestedBindings ?? defaultDucState.suggestedBindings,
    isBindingEnabled: isValidBoolean(ducState.isBindingEnabled, defaultDucState.isBindingEnabled),


    penMode: isValidBoolean(ducState.penMode, defaultDucState.penMode),
    activeTool: {
      ...updateActiveTool(
        defaultDucState,
        ducState.activeTool?.type && AllowedDucActiveTools[ducState.activeTool.type]
          ? ducState.activeTool
          : { type: "selection" }
      ),
      lastActiveTool: null,
      locked: isValidBoolean(ducState.activeTool?.locked, false),
    },

    currentItemBackground: validateBackground(ducState.currentItemBackground),
    currentItemStroke: validateStroke(ducState.currentItemStroke, scope, scope),
    currentItemStartLineHead: isValidLineHeadValue(ducState.currentItemStartLineHead),
    currentItemEndLineHead: isValidLineHeadValue(ducState.currentItemEndLineHead),
    currentItemOpacity: isValidPercentageValue(ducState.currentItemOpacity, DEFAULT_ELEMENT_PROPS.opacity),
  };
};

/**
 * Creates an extended AppState restorer function that can be provided as a prop.
 * This handles restoration of extended AppState that wraps around DucState.
 * 
 * @param restoreExtendedProps - Function to restore extended properties beyond DucState
 * @returns A function that can restore the full extended AppState
 */
export const createExtendedAppStateRestorer = <TExtendedAppState extends Record<string, any>>(
  restoreExtendedProps: (
    extendedAppState: Partial<TExtendedAppState> | null | undefined,
    localExtendedAppState: Partial<TExtendedAppState> | null | undefined,
    restoredDucState: RestoredDucState,
  ) => Omit<TExtendedAppState, keyof DucState>
): ExtendedAppStateRestorer<TExtendedAppState> => {
  return (
    extendedAppState: Partial<TExtendedAppState> | null | undefined,
    localExtendedAppState: Partial<TExtendedAppState> | null | undefined,
    restoredDucState: RestoredDucState,
  ): TExtendedAppState => {
    // Restore the extended properties
    const extendedProps = restoreExtendedProps(extendedAppState, localExtendedAppState, restoredDucState);

    // Combine DucState with extended properties
    return {
      ...restoredDucState,
      ...extendedProps,
    } as unknown as TExtendedAppState;
  };
};

// Old restore function
// export const restore = (
//   data: Pick<ImportedDataState, "appState" | "elements" | "files" | "rendererState" | "blocks" | "groups"> | null,
//   /**
//    * Local DucState (`this.state` or initial state from localStorage) so that we
//    * don't overwrite local state with default values (when values not
//    * explicitly specified).
//    * Supply `null` if you can't get access to it.
//    */
//   localDucState: Partial<DucState> | null | undefined,
//   localElements: readonly DucElement[] | null | undefined,
//   elementsConfig?: ElementsConfig,
// ): RestoredDataState => {
//   const restoredDucState = restoreDucState(data?.appState, localDucState || null);
//   const restoredBlocks = restoreBlocks(data?.blocks, restoredDucState.scope);
//   const restoredGroups = restoreGroups(data?.groups, restoredDucState.scope);

//   return {
//     elements: restoreElements(data?.elements, restoredDucState.scope, localElements, {
//       ...elementsConfig,
//       appState: restoredDucState
//     }),
//     appState: restoredDucState,
//     files: data?.files || {},
//     rendererState: data?.rendererState || null,
//     blocks: restoredBlocks,
//     groups: restoredGroups,
//   };
// };

export const noopExtendedAppStateRestorer: ExtendedAppStateRestorer<DucState> = (
  extendedAppState,
  localExtendedAppState,
  restoredDucState,
) => {
  return restoredDucState;
};

/**
 * Extended restore function that supports restoring extended AppState.
 * This allows users of the library to provide their own AppState restoration logic.
 */
export function restore<TExtendedAppState>(
  data: Pick<ImportedExtendedDataState<TExtendedAppState>, "appState" | "elements" | "files" | "rendererState" | "blocks" | "groups"> | null,
  /**
   * Local extended AppState for fallback values.
   * Supply `null` if you can't get access to it.
   */
  localExtendedAppState: Partial<TExtendedAppState> | null | undefined,
  localElements: readonly DucElement[] | null | undefined,
  /**
   * Extended AppState restorer function that handles the extended properties.
   * This should be created using `createExtendedAppStateRestorer`.
   */
  extendedAppStateRestorer: ExtendedAppStateRestorer<TExtendedAppState>,
  elementsConfig?: ElementsConfig,
): RestoredExtendedDataState<TExtendedAppState> {
  // First restore the DucState portion
  const restoredDucState = restoreDucState(data?.appState, localExtendedAppState);

  // Use the provided restorer to handle the full extended AppState
  const restoredExtendedAppState = extendedAppStateRestorer(
    data?.appState,
    localExtendedAppState,
    restoredDucState
  );

  const restoredBlocks = restoreBlocks(data?.blocks, restoredDucState.scope);
  const restoredGroups = restoreGroups(data?.groups, restoredDucState.scope);

  return {
    elements: restoreElements(data?.elements, restoredDucState.scope, localElements, {
      ...elementsConfig,
      appState: restoredDucState
    }),
    appState: restoredExtendedAppState,
    files: data?.files || {},
    rendererState: data?.rendererState || null,
    blocks: restoredBlocks,
    groups: restoredGroups,
  };
}

const restoreLibraryItem = (libraryItem: LibraryItem, currentScope: Scope) => {
  const elements = restoreElements(
    getNonDeletedElements(libraryItem.elements),
    currentScope,
    null
  );
  return elements.length ? { ...libraryItem, elements } : null;
};

export const restoreLibraryItems = (
  libraryItems: ImportedDataState["libraryItems"] = [],
  defaultStatus: LibraryItem["status"],
  currentScope: Scope,
) => {
  const restoredItems: LibraryItem[] = [];
  for (const item of libraryItems) {
    if (Array.isArray(item)) {
      const restoredItem = restoreLibraryItem({
        status: defaultStatus,
        elements: item,
        id: randomId(),
        created: Date.now(),
      }, currentScope);
      if (restoredItem) {
        restoredItems.push(restoredItem);
      }
    } else {
      const _item = item as MarkOptional<
        LibraryItem,
        "id" | "status" | "created"
      >;
      const restoredItem = restoreLibraryItem({
        ..._item,
        id: _item.id || randomId(),
        status: _item.status || defaultStatus,
        created: _item.created || Date.now(),
      }, currentScope);
      if (restoredItem) {
        restoredItems.push(restoredItem);
      }
    }
  }
  return restoredItems;
};

export const isValidFillStyleValue = (value: FillStyle | undefined): FillStyle => {
  if (value === undefined || !Object.values(ELEMENT_CONTENT_PREFERENCE).includes(value))
    return ELEMENT_CONTENT_PREFERENCE.solid;
  return value;
};

export const isValidStrokePreferenceValue = (value: StrokePreference | undefined): StrokePreference => {
  if (value === undefined || !Object.values(STROKE_PREFERENCE).includes(value))
    return STROKE_PREFERENCE.solid;
  return value;
};

export const isValidVerticalAlignValue = (value: VerticalAlign | undefined): VerticalAlign => {
  if (value === undefined || !Object.values(VERTICAL_ALIGN).includes(value))
    return DEFAULT_VERTICAL_ALIGN;
  return value;
};

export const isValidTextAlignValue = (value: TextAlign | undefined): TextAlign => {
  if (value === undefined || !Object.values(TEXT_ALIGN).includes(value))
    return DEFAULT_TEXT_ALIGN;
  return value;
};

export const isValidScopeValue = (value: string | undefined, appState?: Readonly<Partial<DucState>> | null): SupportedMeasures => {
  // First check if the provided value is valid
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as SupportedMeasures;
  }

  // Then check appState.mainScope if available
  if (appState?.mainScope && Object.keys(ScaleFactors).includes(appState.mainScope)) {
    return appState.mainScope as SupportedMeasures;
  }

  // Then check appState.scope if available
  if (appState?.scope && Object.keys(ScaleFactors).includes(appState.scope)) {
    return appState.scope as SupportedMeasures;
  }

  // Finally, use the default scope as last resort
  return NEUTRAL_SCOPE;
};

export const isValidImageStatusValue = (value: ImageStatus | undefined): ImageStatus => {
  if (value === undefined || !Object.values(IMAGE_STATUS).includes(value))
    return IMAGE_STATUS.pending;
  return value;
};

export const isValidLineHeadValue = (value: LineHead | null | undefined): LineHead | null => {
  if (value === undefined || value === null || !Object.values(LINE_HEAD).includes(value))
    return null;
  return value;
};

export const isValidZoomStepValue = (value: number | undefined): number => {
  if (value === undefined || value < MIN_ZOOM_STEP || value > MAX_ZOOM_STEP)
    return DEFAULT_ZOOM_STEP;
  return value;
};

export const isValidImageScaleValue = (value: [number, number] | undefined): [number, number] => {
  if (value === undefined || value[0] === 0 || value[1] === 0) return [1, 1];
  return value;
};

export const isValidBezierMirroringValue = (value: BezierMirroring | undefined): BezierMirroring | undefined => {
  if (value === undefined || !Object.values(BEZIER_MIRRORING).includes(value))
    return undefined;
  return value;
};

export const isValidSubsetValue = (value: ElementSubset | null | undefined): ElementSubset | null => {
  if (value === undefined || value === null || !Object.values(ELEMENT_SUBSET).includes(value))
    return null;
  return value;
};

export const isValidStrokeSidePreferenceValue = (value: StrokeSidePreference | undefined): StrokeSidePreference => {
  if (value === undefined || !Object.values(STROKE_SIDE_PREFERENCE).includes(value))
    return STROKE_SIDE_PREFERENCE.top;
  return value;
};

export const isValidStrokeCapValue = (value: StrokeCap | undefined): StrokeCap => {
  if (value === undefined || !Object.values(STROKE_CAP).includes(value))
    return STROKE_CAP.butt;
  return value;
};

export const isValidStrokeJoinValue = (value: StrokeJoin | undefined): StrokeJoin => {
  if (value === undefined || !Object.values(STROKE_JOIN).includes(value))
    return STROKE_JOIN.miter;
  return value;
};

export const isValidStrokeDashValue = (value: number[] | undefined): number[] => {
  if (!value || !Array.isArray(value))
    return [];
  return value;
};

export const isValidStrokeMiterLimitValue = (value: number | undefined): number => {
  if (value === undefined || value < 0 || value > 100)
    return 4;
  return value;
};

export const isValidBlendingValue = (value: ValueOf<typeof BLENDING> | undefined): ValueOf<typeof BLENDING> | undefined => {
  if (value === undefined || !Object.values(BLENDING).includes(value))
    return undefined;
  return value;
};

const getFontFamilyByName = (fontFamilyName: string): FontFamilyValues => {
  if (Object.keys(FONT_FAMILY).includes(fontFamilyName)) {
    return FONT_FAMILY[
      fontFamilyName as keyof typeof FONT_FAMILY
    ] as FontFamilyValues;
  }
  return DEFAULT_FONT_FAMILY;
};

const repairBinding = (
  element: DucLinearElement,
  binding: DucPointBinding | null,
  currentScope: Scope,
): DucPointBinding | null => {
  if (!binding) {
    return null;
  }

  // If this is a head-only binding, normalize it
  if (binding.head !== undefined && (!binding.elementId || binding.elementId === "")) {
    return createHeadOnlyBinding(binding.head, currentScope);
  }

  // Get the element's scope for conversion
  const elementScope = element.scope;

  // Ensure we preserve the point attribute for linear-to-linear bindings
  const pointData = binding.point ? {
    point: {
      index: typeof binding.point.index === 'number' ? binding.point.index : 0,
      offset: typeof binding.point.offset === 'number' ?
        // Clamp offset between -1 and 1
        Math.max(-1, Math.min(1, binding.point.offset)) :
        0
    }
  } : { point: null };

  return {
    elementId: binding.elementId || "",
    focus: typeof binding.focus === 'number' ? binding.focus : 0,
    gap: restorePrecisionValue(typeof binding.gap === 'number' ? Math.max(0, binding.gap) : 0, elementScope, currentScope),
    head: isValidLineHeadValue(binding.head),
    fixedPoint: isElbowArrow(element)
      ? normalizeFixedPoint(binding.fixedPoint ?? { x: 0.5, y: 0.5 })
      : null,
    ...pointData
  };
};

const validateElementContent = ({
  content,
  defaultContent,
}: {
  content: Partial<ElementContentBase> | undefined,
  defaultContent: ElementContentBase,
}): ElementContentBase => {
  return {
    preference: isValidFillStyleValue(content?.preference),
    src: content?.src ?? defaultContent.src,
    visible: isValidBoolean(content?.visible, defaultContent.visible),
    opacity: isValidPercentageValue(content?.opacity, defaultContent.opacity),
    tiling: content?.tiling || defaultContent.tiling,
  };
};

const validateDeprecatedElementContent = (color: string, defaultContent: ElementContentBase) => {
  const oldContent = tinycolor(color);
  return {
    ...defaultContent,
    src: isValidColor(oldContent.toHexString(), defaultContent.src),
    opacity: oldContent.getAlpha() as Percentage
  };
};

const validateStrokeStyle = (style: Partial<StrokeStyle> | undefined): StrokeStyle => {
  if (!style) {
    return {
      preference: STROKE_PREFERENCE.solid,
      cap: STROKE_CAP.butt,
      join: STROKE_JOIN.miter,
      dash: [],
      miterLimit: 4,
    };
  }
  return {
    preference: isValidStrokePreferenceValue(style.preference as StrokePreference),
    cap: isValidStrokeCapValue(style.cap as StrokeCap),
    join: isValidStrokeJoinValue(style.join as StrokeJoin),
    dash: isValidStrokeDashValue(style.dash),
    miterLimit: isValidStrokeMiterLimitValue(style.miterLimit),
  };
};

const validateStrokeSides = (sides: StrokeSides | undefined): StrokeSides | undefined => {
  if (!sides) return undefined;

  return {
    preference: isValidStrokeSidePreferenceValue(sides.preference),
    values: sides.values || undefined,
  };
};

const validateStroke = (stroke: ElementStroke | undefined, elementScope: SupportedMeasures, currentScope: Scope): ElementStroke => {
  return {
    content: validateElementContent({
      content: stroke?.content,
      defaultContent: DEFAULT_ELEMENT_PROPS.stroke.content,
    }),
    placement: stroke?.placement ?? STROKE_PLACEMENT.center,
    width: restorePrecisionValue(stroke?.width, elementScope, currentScope, DEFAULT_ELEMENT_PROPS.stroke.width.value),
    style: validateStrokeStyle(stroke?.style),
    strokeSides: validateStrokeSides(stroke?.strokeSides),
  };
};

const validateBackground = (bg: ElementBackground | undefined): ElementBackground => {
  return {
    content: validateElementContent({
      content: bg?.content,
      defaultContent: DEFAULT_ELEMENT_PROPS.background.content,
    }),
  };
};

/**
 * Validates a DucPath object and ensures its line indices form a valid closed path
 */
const validateDucPath = (
  path: Partial<DucPath> | undefined,
  element: DucLinearElement,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures,
): DucPath | null => {
  if (!path || !path.lineIndices || !Array.isArray(path.lineIndices)) {
    return null;
  }

  // Validate line indices are numbers and within valid range
  const validLineIndices = path.lineIndices.filter((index): index is number =>
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < element.lines.length
  );

  if (validLineIndices.length === 0) {
    return null;
  }

  // Check if the line indices form a valid closed path
  const isValidClosedPath = validateClosedPath(
    element as NonDeleted<DucLinearElement>,
    validLineIndices
  );

  if (!isValidClosedPath) {
    return null;
  }

  return {
    lineIndices: validLineIndices,
    background: path.background ? validateBackground(path.background) : null,
    stroke: path.stroke ? validateStroke(path.stroke, elementScope, currentScope) : null,
  };
};

/**
 * Validates and filters path overrides for a linear element
 */
const validatePathOverrides = (
  pathOverrides: readonly DucPath[] | Partial<DucPath>[] | undefined,
  element: DucLinearElement,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures,
): DucPath[] => {
  if (!pathOverrides || !Array.isArray(pathOverrides)) {
    return [];
  }

  const validPaths: DucPath[] = [];
  const usedLineIndices = new Set<number>();

  for (const pathOverride of pathOverrides) {
    const validatedPath = validateDucPath(pathOverride, element, elementScope, currentScope);

    if (validatedPath) {
      // Check for overlapping line indices with previously validated paths
      const hasOverlap = validatedPath.lineIndices.some(index => usedLineIndices.has(index));

      if (!hasOverlap) {
        // Mark these line indices as used
        validatedPath.lineIndices.forEach(index => usedLineIndices.add(index));
        validPaths.push(validatedPath);
      }
    }
  }

  return validPaths;
};

export const isValidFinitePositiveByteValue = (value: number | undefined, defaultValue: number): number => {
  // Return default if value is undefined or not a finite number
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }

  // Round the value to the nearest integer
  const roundedValue = Math.round(value);

  // Clamp the rounded value to the byte range [0, 255]
  return Math.max(0, Math.min(255, roundedValue));
};

/**
 * Validates and returns a DesignStandard value, or the default if invalid.
 */
export const isValidStandard = (value: any): DesignStandard => {
  const validValues = Object.values(DESIGN_STANDARD);
  if (validValues.includes(value)) return value as DesignStandard;
  return DESIGN_STANDARD.DUC;
};

// Utility to validate polygon sides
export const isValidPolygonSides = (sides: any): number => {
  // Validate sides: integer >= 3
  if (sides >= 3) {
    if (Number.isInteger(sides)) {
      return sides;
    } else {
      return Math.round(sides);
    }
  }
  return DEFAULT_POLYGON_SIDES;
};

/**
 * Restores the groups array for AppState, ensuring correct structure and types.
 */
export const restoreGroups = (groups: any, currentScope: Scope): DucGroup[] => {
  if (!Array.isArray(groups)) return [];
  return groups
    .filter((g) => g && typeof g === "object" && typeof g.id === "string" && typeof g.type === "string" && g.type === "group")
    .map((g) => ({
      id: g.id,
      type: "group",
      ...restoreDucStackProperties(g, currentScope),
      clip: isValidBoolean(g.clip, false),
    }));
};

/**
 * Restores common properties for elements leveraging _DucStackBase.
 */
export const restoreDucStackProperties = (
  stack: any,
  currentScope: SupportedMeasures,
): Omit<DucGroup, "id" | "type"> => {
  const defaultStackProperties = getDefaultStackProperties();
  return {
    label: typeof stack.label === "string" ? stack.label : "",
    description: typeof stack.description === "string" ? stack.description : null,
    isCollapsed: isValidBoolean(stack.isCollapsed, defaultStackProperties.isCollapsed),
    noPlot: isValidBoolean(stack.noPlot, defaultStackProperties.noPlot),
    locked: isValidBoolean(stack.locked, defaultStackProperties.locked),
    isVisible: isValidBoolean(stack.isVisible, defaultStackProperties.isVisible),
    opacity: isValidPercentageValue(stack.opacity, defaultStackProperties.opacity),
    labelingColor: isValidColor(stack.labelingColor, defaultStackProperties.labelingColor),
    strokeOverride: stack.strokeOverride ? validateStroke(stack.strokeOverride, currentScope, currentScope) : defaultStackProperties.strokeOverride,
    backgroundOverride: stack.backgroundOverride ? validateBackground(stack.backgroundOverride) : defaultStackProperties.backgroundOverride,
    clip: isValidBoolean(stack.clip, defaultStackProperties.clip),
  }
}

/**
 * Restores the blocks array, ensuring correct structure and types.
 */
export const restoreBlocks = (
  blocks: any,
  currentScope: SupportedMeasures,
): DucBlock[] => {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b && typeof b === "object" && typeof b.id === "string")
    .map((b) => ({
      id: b.id,
      label: typeof b.label === "string" ? b.label : "",
      description: typeof b.description === "string" ? b.description : undefined,
      version: typeof b.version === "number" ? b.version : 1,
      elements: restoreElements(b.elements, currentScope, null),
      attributes: b.attributes || undefined,
    }));
};

const restoreTableStyleProps = (
  style: DucTableStyleProps | undefined,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures
): DucTableStyleProps | undefined => {
  if (!style) return undefined;

  const border = style.border ? {
    width: style.border.width ? restorePrecisionValue(style.border.width, elementScope, currentScope, 1) : undefined,
    dashes: style.border.dashes || undefined,
    color: style.border.color ? isValidColor(style.border.color) : undefined,
  } : undefined;

  const text = style.text ? {
    color: style.text.color ? isValidColor(style.text.color) : undefined,
    size: style.text.size ? restorePrecisionValue(style.text.size, elementScope, currentScope, DEFAULT_FONT_SIZE) : undefined,
    font: style.text.font || undefined,
    align: isValidTextAlignValue(style.text.align) || DEFAULT_TEXT_ALIGN,
  } : undefined;

  const restoredStyle: DucTableStyleProps = {};
  if (style.background) restoredStyle.background = style.background;
  if (border && Object.values(border).some(v => v !== undefined)) restoredStyle.border = border;
  if (text && Object.values(text).some(v => v !== undefined)) restoredStyle.text = text;

  return Object.keys(restoredStyle).length > 0 ? restoredStyle : undefined;
};

const restoreTableColumns = (
  columns: Record<string, DucTableColumn> | undefined,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures
): Record<string, DucTableColumn> => {
  if (!columns) return {};
  const restoredColumns: Record<string, DucTableColumn> = {};
  for (const colId in columns) {
    const col = columns[colId];
    restoredColumns[colId] = {
      id: col.id,
      width: col.width ? restorePrecisionValue(col.width, elementScope, currentScope) : undefined,
      style: col.style ? restoreTableStyleProps(col.style, elementScope, currentScope) : undefined,
    };
  }
  return restoredColumns;
};

const restoreTableRows = (
  rows: Record<string, DucTableRow> | undefined,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures
): Record<string, DucTableRow> => {
  if (!rows) return {};
  const restoredRows: Record<string, DucTableRow> = {};
  for (const rowId in rows) {
    const row = rows[rowId];
    restoredRows[rowId] = {
      id: row.id,
      height: row.height ? restorePrecisionValue(row.height, elementScope, currentScope) : undefined,
      style: row.style ? restoreTableStyleProps(row.style, elementScope, currentScope) : undefined,
    };
  }
  return restoredRows;
};

const restoreTableCells = (
  cells: Record<string, DucTableCell> | undefined,
  elementScope: SupportedMeasures,
  currentScope: SupportedMeasures
): Record<string, DucTableCell> => {
  if (!cells) return {};
  const restoredCells: Record<string, DucTableCell> = {};
  for (const cellKey in cells) {
    const cell = cells[cellKey];
    restoredCells[cellKey] = {
      rowId: cell.rowId,
      columnId: cell.columnId,
      data: cell.data || "",
      style: cell.style ? restoreTableStyleProps(cell.style, elementScope, currentScope) : undefined,
    };
  }
  return restoredCells;
};


export const isValidRadianValue = (
  value: number | Radian | undefined,
  defaultValue: Radian,
): Radian => {
  if (value === undefined || !Number.isFinite(value as number)) {
    return defaultValue;
  }
  if (value > Math.PI * 2 || value < -Math.PI * 2) {
    return defaultValue;
  }
  return value as Radian;
};

/**
 * Validates a Percentage value.
 * Returns a clamped value within the <0,1> range or a provided default.
 */
export const isValidPercentageValue = (
  value: number | Percentage | undefined,
  defaultValue: Percentage,
  allowNegative: boolean = false,
): Percentage => {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue as Percentage;
  }
  // If the value is between 1 and 100, assume it's a percentage that needs to be divided by 100
  if (value > 1 && value <= 100) {
    value /= 100;
  }
  return Math.max(allowNegative ? -1 : 0, Math.min(1, value as number)) as Percentage;
};



/**
 * Ensures the supplied easing function is valid. Falls back to the default easing otherwise.
 */
export const isValidFreeDrawEasingValue = (
  value: DucFreeDrawEasing | undefined,
): DucFreeDrawEasing => {
  return typeof value === "function" ? value : DEFAULT_FREEDRAW_ELEMENT.easing;
};

/**
 * Restores the FreeDrawEnds structure validating its members.
 */
const restoreFreeDrawEnds = (
  ends: DucFreeDrawEnds | null | undefined,
): DucFreeDrawEnds | null => {
  if (!ends) return null;
  return {
    cap: isValidBoolean(ends.cap, false),
    taper: isValidPercentageValue(ends.taper, 0 as Percentage) as number,
    easing: isValidFreeDrawEasingValue(ends.easing),
  };

};

const isValidCutAngleValue = (value: number | undefined, defaultValue: Radian): Radian => {
  const radian = isValidRadianValue(
    value,
    defaultValue,
  )

  if (radian < 0) {
    return defaultValue;
  }
  return radian;
};

export const isValidBoolean = (value: any, defaultValue: boolean = false): boolean => {
  return typeof value === "boolean" ? value : defaultValue;
};

export const isValidColor = (value: any, defaultValue: string = "#000000"): string => {
  const color = tinycolor(value);
  return color.isValid() ? color.toHexString() : defaultValue;
};