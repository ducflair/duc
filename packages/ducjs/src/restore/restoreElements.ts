import {
  ElementsConfig,
  isValidBezierMirroringValue,
  isValidBlendingValue,
  isValidBoolean,
  isValidColor,
  isValidDucHead,
  isValidImageScaleValue,
  isValidImageStatusValue,
  isValidLineHeadValue,
  isValidPercentageValue,
  isValidPolygonSides,
  isValidRadianValue,
  isValidTextAlignValue,
  isValidVerticalAlignValue,
  RestoredDataState,
  restoreDucStackProperties,
  restorePrecisionValue,
  validateBackground,
  validateStroke,
} from "ducjs/restore/restoreDataState";
import {
  getPrecisionValueFromRaw,
  getPrecisionValueFromScoped,
  getScopedBezierPointFromDucPoint,
  NEUTRAL_SCOPE,
  ScaleFactors,
} from "ducjs/technical";
import {
  BezierMirroring,
  DucDocElement,
  DucElement,
  DucFrameElement,
  DucFreeDrawEasing,
  DucFreeDrawEnds,
  DucGlobalState,
  DucHead,
  DucLine,
  DucLinearElement,
  DucLocalState,
  DucPath,
  DucPoint,
  DucPointBinding,
  DucSelectionElement,
  DucTableElement,
  DucTextElement,
  ElementContentBase,
  FontFamilyValues,
  ImportedDataState,
  isElbowArrow,
  isLinearElement,
  isTextElement,
  Mutable,
  NonDeleted,
  OrderedDucElement,
  Percentage,
  PrecisionValue,
  Radian,
  RawValue,
  Scope,
} from "ducjs/types";
import {
  arrayToMap,
  bumpVersion,
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_ELLIPSE_ELEMENT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FREEDRAW_ELEMENT,
  detectLineHeight,
  FONT_FAMILY,
  getContainerElement,
  getNormalizedDimensions,
  getNormalizedPoints,
  getSizeFromPoints,
  getUpdatedTimestamp,
  isInvisiblySmallElement,
  LINE_CONFIRM_THRESHOLD,
  mergeOverlappingPoints,
  migratePoints,
  normalizeFixedPoint,
  normalizeLink,
  randomId,
  refreshTextDimensions,
  validateClosedPath,
} from "ducjs/utils";
import tinycolor from "tinycolor2";

const restoreElementWithProperties = <
  T extends DucElement,
  K extends Partial<T>
>(
  element: T,
  extra: K & Partial<Pick<DucElement, "type" | "x" | "y" | "customData">>,
  localState?: Readonly<Partial<DucLocalState>> | null,
  globalState?: Readonly<Partial<DucGlobalState>> | null
): T => {
  const _element = { ...element, ...extra };
  const elementScope = isValidElementScopeValue(_element.scope, globalState?.mainScope);
  const currentScope = isValidElementScopeValue(localState?.scope, globalState?.mainScope);
  // Handle legacy stroke properties first
  let stroke = [DEFAULT_ELEMENT_PROPS.stroke];
  if (_element.strokeColor) {
    // Legacy strokeColor property
    stroke = [
      {
        ...DEFAULT_ELEMENT_PROPS.stroke,
        content: validateDeprecatedElementContent(
          _element.strokeColor,
          DEFAULT_ELEMENT_PROPS.stroke.content
        ),
        width: restorePrecisionValue(
          (_element as any).strokeWidth ||
            DEFAULT_ELEMENT_PROPS.stroke.width.value,
          elementScope,
          currentScope,
          DEFAULT_ELEMENT_PROPS.stroke.width.value
        ),
      },
    ];
  } else if (_element.stroke) {
    // New stroke array property
    stroke = _element.stroke.map((s) =>
      validateStroke(s, elementScope, currentScope)
    );
  }

  // Handle legacy background properties
  let background = [DEFAULT_ELEMENT_PROPS.background];
  if (_element.backgroundColor) {
    // Legacy backgroundColor property
    background = [
      {
        ...DEFAULT_ELEMENT_PROPS.background,
        content: validateDeprecatedElementContent(
          _element.backgroundColor,
          DEFAULT_ELEMENT_PROPS.background.content
        ),
      },
    ];
  } else if (_element.background) {
    // New background array property
    background = _element.background.map((bg) => validateBackground(bg));
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
    opacity: isValidPercentageValue(
      _element.opacity,
      DEFAULT_ELEMENT_PROPS.opacity
    ),
    angle: isValidRadianValue(_element.angle, DEFAULT_ELEMENT_PROPS.angle),
    x: restorePrecisionValue(_element.x, elementScope, currentScope, 0),
    y: restorePrecisionValue(_element.y, elementScope, currentScope, 0),
    scope: elementScope,
    label: _element.label ?? "Lost Element Label",
    isVisible: isValidBoolean(
      _element.isVisible,
      DEFAULT_ELEMENT_PROPS.isVisible
    ),
    width: restorePrecisionValue(_element.width, elementScope, currentScope, 0),
    height: restorePrecisionValue(
      _element.height,
      elementScope,
      currentScope,
      0
    ),
    seed: _element.seed ?? 1,
    groupIds: _element.groupIds ?? [],
    frameId: _element.frameId ?? null,
    roundness: restorePrecisionValue(
      _element.roundness,
      elementScope,
      currentScope,
      DEFAULT_ELEMENT_PROPS.roundness.value
    ),
    boundElements: _element.boundElements ?? [],
    updated: _element.updated ?? getUpdatedTimestamp(),
    link: _element.link ? normalizeLink(_element.link) : null,
    locked: isValidBoolean(_element.locked, false),
  };

  if ("customData" in element || "customData" in extra) {
    (base as any).customData = _element.customData;
  }

  const normalizedRaw = getNormalizedDimensions(
    base as Required<Pick<DucElement, "width" | "height" | "x" | "y">>
  );
  const normalized = {
    x: restorePrecisionValue(
      normalizedRaw.x,
      elementScope,
      currentScope,
      0,
      true
    ),
    y: restorePrecisionValue(
      normalizedRaw.y,
      elementScope,
      currentScope,
      0,
      true
    ),
    width: restorePrecisionValue(
      normalizedRaw.width,
      elementScope,
      currentScope,
      0,
      true
    ),
    height: restorePrecisionValue(
      normalizedRaw.height,
      elementScope,
      currentScope,
      0,
      true
    ),
  };

  return {
    ..._element,
    ...base,
    ...normalized,
  } as unknown as T;
};

const restoreElement = (
  element: Exclude<DucElement, DucSelectionElement>,
  currentScope: Scope,
  restoredBlocks: RestoredDataState["blocks"],
  localState?: Readonly<Partial<DucLocalState>> | null,
  globalState?: Readonly<Partial<DucGlobalState>> | null
): typeof element | null => {
  // Migration: convert deprecated 'diamond' to 'polygon' with 4 sides
  if ((element as any).type === "diamond") {
    const migrated = { ...element, type: "polygon", sides: 4 } as any;
    return restoreElement(migrated, currentScope, restoredBlocks, localState);
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
          : // : getLineHeight(element.fontFamily);
            (1 as number & { _brand: "unitlessLineHeight" }); // FIXME: We need better handling to get the font line height

      const textElementScope = isValidElementScopeValue(
        element.scope,
        globalState?.mainScope
      );
      const finalFontSize = restorePrecisionValue(
        fontSize,
        textElementScope,
        currentScope,
        DEFAULT_FONT_SIZE
      );

      const textElement = restoreElementWithProperties(
        element,
        {
          fontSize: finalFontSize,
          fontFamily,
          text,
          textAlign: isValidTextAlignValue(element.textAlign),
          verticalAlign: isValidVerticalAlignValue(element.verticalAlign),
          containerId: element.containerId ?? null,
          originalText: element.originalText || text,
          autoResize: isValidBoolean(element.autoResize, true),
          lineHeight,
        },
        localState
      );

      // if empty text, mark as deleted. We keep in array
      // for data integrity purposes (collab etc.)
      if (!text && !isValidBoolean(element.isDeleted, false)) {
        element = { ...element, originalText: text, isDeleted: true };
        element = bumpVersion(element);
      }

      return textElement;
    }
    case "freedraw": {
      const elementScope = isValidElementScopeValue(element.scope, globalState?.mainScope);
      const points = restoreElementPoints({
        points: element.points as DucPoint[],
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        elementScope,
        currentScope,
      });

      return restoreElementWithProperties(
        element,
        {
          points,
          size: restorePrecisionValue(
            element.size,
            elementScope,
            currentScope,
            DEFAULT_FREEDRAW_ELEMENT.size
          ),
          lastCommittedPoint: element.lastCommittedPoint
            ? restorePoint(
                element.lastCommittedPoint as DucPoint,
                elementScope,
                currentScope
              )
            : null,
          simulatePressure: isValidBoolean(element.simulatePressure, false),
          pressures: Array.isArray(element.pressures) ? element.pressures : [],
          thinning: isValidPercentageValue(
            element.thinning,
            DEFAULT_FREEDRAW_ELEMENT.thinning,
            true
          ),
          smoothing: isValidPercentageValue(
            element.smoothing,
            DEFAULT_FREEDRAW_ELEMENT.smoothing
          ),
          streamline: isValidPercentageValue(
            element.streamline,
            DEFAULT_FREEDRAW_ELEMENT.streamline
          ),
          easing: isValidFreeDrawEasingValue(
            element.easing as DucFreeDrawEasing
          ),
          start: restoreFreeDrawEnds(element.start),
          end: restoreFreeDrawEnds(element.end),
        },
        localState
      );
    }
    case "image":
      return restoreElementWithProperties(
        element,
        {
          status: isValidImageStatusValue(element.status),
          fileId: element.fileId,
          scale: isValidImageScaleValue(element.scale),
        },
        localState
      );

    case "line": {
      // Don't normalize points if there are bindings
      const hasBindings = !!(element.startBinding || element.endBinding);
      const elementScope = isValidElementScopeValue(element.scope, globalState?.mainScope);

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
        const elementWidth = restorePrecisionValue(
          element.width,
          elementScope,
          currentScope,
          0
        );
        const elementHeight = restorePrecisionValue(
          element.height,
          elementScope,
          currentScope,
          0
        );

        finalPoints = [
          {
            x: getPrecisionValueFromRaw(
              0 as RawValue,
              elementScope,
              currentScope
            ),
            y: getPrecisionValueFromRaw(
              0 as RawValue,
              elementScope,
              currentScope
            ),
            mirroring: undefined,
          },
          {
            x: elementWidth,
            y: elementHeight,
            mirroring: undefined,
          },
        ];
      }

      // Handle bindings, with special case for head-only bindings
      const startBinding = element.startBinding;
      const endBinding = element.endBinding;

      // Process bindings
      const processedStartBinding =
        startBinding &&
        startBinding.head !== undefined &&
        (!startBinding.elementId || startBinding.elementId === "")
          ? createHeadOnlyBinding(startBinding.head, restoredBlocks, currentScope)
          : repairBinding(
              element as DucLinearElement,
              startBinding,
              currentScope,
              restoredBlocks
            );

      const processedEndBinding =
        endBinding &&
        endBinding.head !== undefined &&
        (!endBinding.elementId || endBinding.elementId === "")
          ? createHeadOnlyBinding(endBinding.head, restoredBlocks, currentScope)
          : repairBinding(
              element as DucLinearElement,
              endBinding,
              currentScope,
              restoredBlocks
            );

      // Create the base restored element
      const sizeFromPoints =
        !hasBindings &&
        getSizeFromPoints(finalPoints.map(getScopedBezierPointFromDucPoint));
      let restoredElement = restoreElementWithProperties(
        element,
        {
          points: finalPoints,
          lines,
          lastCommittedPoint: element.lastCommittedPoint
            ? restorePoint(
                element.lastCommittedPoint,
                element.scope,
                currentScope
              )
            : null,
          startBinding: processedStartBinding,
          endBinding: processedEndBinding,
          x: element.x,
          y: element.y,
          // Only calculate size from points if we don't have bindings
          ...(!sizeFromPoints
            ? {}
            : {
                width: getPrecisionValueFromScoped(
                  sizeFromPoints.width,
                  element.scope,
                  currentScope
                ),
                height: getPrecisionValueFromScoped(
                  sizeFromPoints.height,
                  element.scope,
                  currentScope
                ),
              }),
        },
        localState
      );

      const { points: updatedPoints, lines: updatedLines } =
        mergeOverlappingPoints(
          finalPoints,
          lines,
          LINE_CONFIRM_THRESHOLD as RawValue
        );

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
      };
    }

    case "arrow": {
      // since arrow is deprecated, we convert it to line
      return restoreElement(
        {
          ...element,
          type: "line",
        },
        currentScope,
        restoredBlocks,
        localState
      );
    }

    case "ellipse": {
      const ratio = isValidPercentageValue(
        element.ratio,
        DEFAULT_ELLIPSE_ELEMENT.ratio
      );
      const startAngle = isValidCutAngleValue(
        element.startAngle,
        DEFAULT_ELLIPSE_ELEMENT.startAngle
      );
      const endAngle = isValidCutAngleValue(
        element.endAngle,
        DEFAULT_ELLIPSE_ELEMENT.endAngle
      );
      const showAuxCrosshair =
        element.showAuxCrosshair ?? DEFAULT_ELLIPSE_ELEMENT.showAuxCrosshair;

      return restoreElementWithProperties(
        element,
        {
          ratio,
          startAngle,
          endAngle,
          showAuxCrosshair,
        },
        localState
      );
    }
    case "rectangle":
    case "embeddable":
      return restoreElementWithProperties(element, {}, localState);

    case "polygon": {
      const sides = isValidPolygonSides(element.sides);
      return restoreElementWithProperties({ ...element, sides }, {}, localState);
    }

    case "frame": {
      const frameElement = element as DucFrameElement;
      return restoreElementWithProperties(
        frameElement,
        {
          ...restoreDucStackProperties(frameElement, currentScope),
        },
        localState
      );
    }
    case "table": {
      const tableElement = element as DucTableElement;
      //TODO: Implement table element restore
    }
    case "doc": {
      const docElement = element as DucDocElement;
      //TODO: Implement doc element restore
    }
  }
  return null;
};

/**
 * Restores a point that might have legacy format (x,y as numbers)
 * @param point - The point to restore
 * @param elementScope - The scope to use for the precision values
 * @returns A properly formatted DucPoint
 */
export const restorePoint = (
  point:
    | Partial<DucPoint>
    | {
        x: number | PrecisionValue;
        y: number | PrecisionValue;
        isCurve?: boolean;
        mirroring?: BezierMirroring;
        handleIn?: { x: number | PrecisionValue; y: number | PrecisionValue };
        handleOut?: { x: number | PrecisionValue; y: number | PrecisionValue };
        borderRadius?: number | PrecisionValue;
      }
    | undefined,
  elementScope: Scope,
  currentScope: Scope
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
  elementScope: Scope;
  currentScope: Scope;
}) => {
  // Convert input parameters to plain numbers if they're precision values
  const validatedWidth = restorePrecisionValue(
    width,
    elementScope,
    currentScope,
    0
  );
  const validatedHeight = restorePrecisionValue(
    height,
    elementScope,
    currentScope,
    0
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
  elementScope: Scope;
  currentScope: Scope;
  skipNormalization?: boolean;
}) => {
  const validatedX = restorePrecisionValue(x, elementScope, currentScope, 0);
  const validatedY = restorePrecisionValue(y, elementScope, currentScope, 0);
  const validatedWidth = restorePrecisionValue(
    width,
    elementScope,
    currentScope,
    0
  );
  const validatedHeight = restorePrecisionValue(
    height,
    elementScope,
    currentScope,
    0
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
      currentScope
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
  elementsMap: Map<string, Mutable<DucElement>>
) => {
  if (container.boundElements) {
    const boundElements = container.boundElements.slice();

    const boundIds = new Set<DucElement["id"]>();
    container.boundElements = boundElements.reduce(
      (acc: Mutable<NonNullable<DucElement["boundElements"]>>, binding) => {
        const boundElement = elementsMap.get(binding.id);
        if (boundElement && !boundIds.has(binding.id)) {
          boundIds.add(binding.id);

          if (boundElement.isDeleted) {
            return acc;
          }

          acc.push(binding);

          if (isTextElement(boundElement) && !boundElement.containerId) {
            (boundElement as Mutable<DucTextElement>).containerId =
              container.id;
          }
        }
        return acc;
      },
      []
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
  elementsMap: Map<string, Mutable<DucElement>>
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
  elementsMap: Map<string, Mutable<DucElement>>
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
export const migrateArrayOrderToZIndex = (
  elements: DucElement[]
): DucElement[] => {
  // Check if we need to do a migration (if any element lacks z-index)
  const needsMigration = elements.some(
    (el) => el.zIndex === undefined || el.zIndex === null
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

export const restoreElements = (
  elements: ImportedDataState["elements"],
  currentScope: Scope,
  restoredBlocks: RestoredDataState["blocks"],
  opts?: ElementsConfig & {
    localState?: Readonly<Partial<DucLocalState>> | null;
  }
): OrderedDucElement[] => {
  const existingIds = new Set<string>();

  // First restore all elements with their original properties
  const restored = (elements || []).reduce((elements, element) => {
    if (element.type !== "selection") {
      let migratedElement: DucElement | null = restoreElement(
        element,
        currentScope,
        restoredBlocks,
        opts?.localState
      );
      const isEditing = false; // TODO: Handle editingLinearElement properly
      if (
        migratedElement &&
        (!isInvisiblySmallElement(migratedElement) || isEditing)
      ) {
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
  restoredElements = migrateArrayOrderToZIndex(
    restoredElements
  ) as OrderedDucElement[];

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
          currentScope
        )
      );
    }

    if (isLinearElement(element)) {
      // Helper function to check if we should keep a binding
      const shouldKeepBinding = (binding: DucPointBinding | null): boolean => {
        if (!binding) return true; // No binding, nothing to remove

        // Keep head-only bindings
        if (
          binding.head !== undefined &&
          (!binding.elementId || binding.elementId === "")
        ) {
          return true;
        }

        // If binding has an elementId, check if it points to a valid element
        const elementExists = restoredElementsMap.has(binding.elementId);

        // For linear-to-linear bindings, ensure the point attribute is valid
        if (binding.point && elementExists) {
          const targetElement = restoredElementsMap.get(binding.elementId);
          if (isLinearElement(targetElement)) {
            // Check if the point index is within bounds of the target element's points
            if (
              binding.point.index >= 0 &&
              binding.point.index < targetElement.points.length &&
              Math.abs(binding.point.offset) <= 1
            ) {
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
          if (
            !targetElement.boundElements?.some(
              (be: { id: string }) => be.id === element.id
            )
          ) {
            const boundElements = targetElement.boundElements || [];
            (targetElement as Mutable<DucElement>).boundElements = [
              ...boundElements,
              {
                id: element.id,
                type: element.type,
              },
            ];
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

export const isValidElementScopeValue = (
  value: string | undefined,
  mainScope: Scope = NEUTRAL_SCOPE
): Scope => {
  // Only check if the provided value is valid
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as Scope;
  }
  return mainScope;
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
  restoredBlocks: RestoredDataState["blocks"]
): DucPointBinding | null => {
  if (!binding) {
    return null;
  }

  // If this is a head-only binding, normalize it
  if (
    binding.head !== undefined &&
    (!binding.elementId || binding.elementId === "")
  ) {
    return createHeadOnlyBinding(binding.head, restoredBlocks, currentScope);
  }

  // Get the element's scope for conversion
  const elementScope = element.scope;

  // Ensure we preserve the point attribute for linear-to-linear bindings
  const pointData = binding.point
    ? {
        point: {
          index:
            typeof binding.point.index === "number" ? binding.point.index : 0,
          offset:
            typeof binding.point.offset === "number"
              ? // Clamp offset between -1 and 1
                Math.max(-1, Math.min(1, binding.point.offset))
              : 0,
        },
      }
    : { point: null };

  return {
    elementId: binding.elementId || "",
    focus: typeof binding.focus === "number" ? binding.focus : 0,
    gap: restorePrecisionValue(
      typeof binding.gap === "number" ? Math.max(0, binding.gap) : 0,
      elementScope,
      currentScope
    ),
    head: isValidDucHead(
      binding.head,
      restoredBlocks,
      elementScope,
      currentScope
    ),
    fixedPoint: isElbowArrow(element)
      ? normalizeFixedPoint(binding.fixedPoint ?? { x: 0.5, y: 0.5 })
      : null,
    ...pointData,
  };
};

/**
 * Validates a DucPath object and ensures its line indices form a valid closed path
 */
const validateDucPath = (
  path: Partial<DucPath> | undefined,
  element: DucLinearElement,
  elementScope: Scope,
  currentScope: Scope
): DucPath | null => {
  if (!path || !path.lineIndices || !Array.isArray(path.lineIndices)) {
    return null;
  }

  // Validate line indices are numbers and within valid range
  const validLineIndices = path.lineIndices.filter(
    (index): index is number =>
      typeof index === "number" &&
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
    stroke: path.stroke
      ? validateStroke(path.stroke, elementScope, currentScope)
      : null,
  };
};

/**
 * Validates and filters path overrides for a linear element
 */
const validatePathOverrides = (
  pathOverrides: readonly DucPath[] | Partial<DucPath>[] | undefined,
  element: DucLinearElement,
  elementScope: Scope,
  currentScope: Scope
): DucPath[] => {
  if (!pathOverrides || !Array.isArray(pathOverrides)) {
    return [];
  }

  const validPaths: DucPath[] = [];
  const usedLineIndices = new Set<number>();

  for (const pathOverride of pathOverrides) {
    const validatedPath = validateDucPath(
      pathOverride,
      element,
      elementScope,
      currentScope
    );

    if (validatedPath) {
      // Check for overlapping line indices with previously validated paths
      const hasOverlap = validatedPath.lineIndices.some((index) =>
        usedLineIndices.has(index)
      );

      if (!hasOverlap) {
        // Mark these line indices as used
        validatedPath.lineIndices.forEach((index) =>
          usedLineIndices.add(index)
        );
        validPaths.push(validatedPath);
      }
    }
  }

  return validPaths;
};

/**
 * Ensures the supplied easing function is valid. Falls back to the default easing otherwise.
 */
export const isValidFreeDrawEasingValue = (
  value: DucFreeDrawEasing | undefined
): DucFreeDrawEasing => {
  return typeof value === "function" ? value : DEFAULT_FREEDRAW_ELEMENT.easing;
};

/**
 * Restores the FreeDrawEnds structure validating its members.
 */
const restoreFreeDrawEnds = (
  ends: DucFreeDrawEnds | null | undefined
): DucFreeDrawEnds | null => {
  if (!ends) return null;
  return {
    cap: isValidBoolean(ends.cap, false),
    taper: isValidPercentageValue(ends.taper, 0 as Percentage) as number,
    easing: isValidFreeDrawEasingValue(ends.easing),
  };
};

const isValidCutAngleValue = (
  value: number | undefined,
  defaultValue: Radian
): Radian => {
  const radian = isValidRadianValue(value, defaultValue);

  if (radian < 0) {
    return defaultValue;
  }
  return radian;
};

const createHeadOnlyBinding = (
  head: DucHead | null | undefined,
  restoredBlocks: RestoredDataState["blocks"],
  currentScope: Scope
): DucPointBinding => {
  return {
    elementId: "",
    focus: 0,
    gap: getPrecisionValueFromRaw(0 as RawValue, currentScope, currentScope),
    fixedPoint: null,
    point: null,
    head: isValidDucHead(head, restoredBlocks, currentScope, currentScope),
  };
};

const validateDeprecatedElementContent = (
  color: string,
  defaultContent: ElementContentBase
) => {
  const oldContent = tinycolor(color);
  return {
    ...defaultContent,
    src: isValidColor(oldContent.toHexString(), defaultContent.src),
    opacity: oldContent.getAlpha() as Percentage,
  };
};
