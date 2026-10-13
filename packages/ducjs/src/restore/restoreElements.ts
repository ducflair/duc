import {
  _DucElementBase,
  _DucStackElementBase,
  BezierMirroring,
  DocumentGridConfig,
  DucBinderElement,
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
  DucModelElement,
  DucPath,
  DucPlotElement,
  DucPoint,
  DucPointBinding,
  DucSelectionElement,
  DucTableElement,
  DucTextElement,
  DucTextStyle,
  ExternalFileId,
  FontFamilyValues,
  ImportedDataState,
  isElbowArrow,
  isLinearElement,
  isTextElement,
  Mutable,
  NonDeleted,
  OrderedDucElement,
  Percentage,
  PlotLayout,
  Radian,
  ScaleFactor,
  Viewer3DState,
} from "../types";
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
  getDefaultTableData,
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
  validateClosedPath
} from "../utils";
import {
  ElementsConfig,
  isValidBezierMirroringValue,
  isValidBlendingValue,
  isValidBoolean,
  isValidBoolean as isValidBooleanValue, // Renaming to avoid conflict
  isValidColor,
  isValidDucHead,
  isValidFunction,
  isValidImageScaleValue,
  isValidImageStatusValue,
  isValidPercentageValue,
  isValidPolygonSides,
  isValidRadianValue,
  isValidString,
  isValidTextAlignValue,
  isValidVerticalAlignValue,
  RestoredDataState,
  restoreDucStackProperties,
  restoreNumber,
  validateBackground,
  validateStroke
} from "./restoreDataState";
import { updateModelCodeElementIds } from "./updateModelCode";

import {
  LINE_SPACING_TYPE,
} from "../enums";

const PARAMETRIC_SOURCE_TYPE = { CODE: 10, FILE: 11 } as const;

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
        width: restoreNumber(
          (_element as any).strokeWidth ??
          DEFAULT_ELEMENT_PROPS.stroke.width,
          DEFAULT_ELEMENT_PROPS.stroke.width
        ),
      },
    ];
  } else if (_element.stroke) {
    // New stroke array property
    stroke = _element.stroke.map((s) =>
      validateStroke(s)
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

  const base: Partial<_DucElementBase> = {
    id: _element.id || randomId(),
    version: _element.version || 1,
    versionNonce: _element.versionNonce ?? 0,
    index: _element.index ?? null,
    isDeleted: isValidBooleanValue(_element.isDeleted, false),
    blending: isValidBlendingValue(_element.blending),
    stroke,
    background,
    opacity: isValidPercentageValue(
      _element.opacity,
      DEFAULT_ELEMENT_PROPS.opacity
    ),
    angle: isValidRadianValue(_element.angle, DEFAULT_ELEMENT_PROPS.angle),
    x: restoreNumber(_element.x, 0),
    y: restoreNumber(_element.y, 0),
    label: _element.label ?? "Lost Element Label",
    isVisible: isValidBoolean(
      _element.isVisible,
      DEFAULT_ELEMENT_PROPS.isVisible
    ),
    isPlot: isValidBoolean(_element.isPlot, DEFAULT_ELEMENT_PROPS.isPlot),
    layerId: _element.layerId ?? null,
    regionIds: Array.isArray(_element.regionIds) ? _element.regionIds : [],
    width: restoreNumber(_element.width, 0),
    height: restoreNumber(_element.height, 0),
    seed: _element.seed ?? 1,
    groupIds: _element.groupIds ?? [],
    blockIds: Array.isArray(_element.blockIds) ? _element.blockIds : [],
    instanceId: _element.instanceId ?? null,
    frameId: _element.frameId ?? null,
    roundness: restoreNumber(
      _element.roundness,
      DEFAULT_ELEMENT_PROPS.roundness
    ),
    boundElements: _element.boundElements ?? undefined,
    updated: _element.updated ?? getUpdatedTimestamp(),
    link: _element.link ? normalizeLink(_element.link) : undefined,
    locked: isValidBooleanValue(_element.locked, false),
    description: _element.description ?? undefined,
  };

  if ("customData" in element || "customData" in extra) {
    (base as any).customData = _element.customData;
  }

  const normalizedRaw = getNormalizedDimensions(
    base as Required<Pick<DucElement, "width" | "height" | "x" | "y">>
  );
  const normalized = {
    x: normalizedRaw.x,
    y: normalizedRaw.y,
    width: normalizedRaw.width,
    height: normalizedRaw.height,
  };

  return {
    ..._element,
    ...base,
    ...normalized,
    type: _element.type,
  } as unknown as T;
};

const restoreElement = (
  element: Exclude<DucElement, DucSelectionElement>,
  restoredBlocks?: RestoredDataState["blocks"],
  localState?: Readonly<Partial<DucLocalState>> | null,
  globalState?: Readonly<Partial<DucGlobalState>> | null
): typeof element | null => {
  // Migration: convert deprecated 'diamond' to 'polygon' with 4 sides
  if ((element as any).type === "diamond") {
    const migrated = { ...element, type: "polygon", sides: 4 } as any;
    return restoreElement(migrated, restoredBlocks, localState);
  }
  switch (element.type) {
    case "text": {
      let fontSize: number | any = element.fontSize;
      let fontFamily = element.fontFamily;
      // Restore condition: if font family is "10", change to DEFAULT_FONT_FAMILY
      if (fontFamily === "10") {
        fontFamily = DEFAULT_FONT_FAMILY;
      }
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

      const lineHeight = (
        element.lineHeight && Number.isFinite(element.lineHeight)
          ? element.lineHeight
          : detectLineHeight(element)
      ) as number & {
        _brand: "unitlessLineHeight";
      };

      const restoredLineSpacing = restoreLineSpacing(
        element.lineSpacing,
        lineHeight
      );

      const finalFontSize = restoreNumber(
        fontSize,
        DEFAULT_FONT_SIZE
      );

      const restoredTextElement = restoreElementWithProperties(
        element,
        {
          // DucTextElement specific
          text,
          autoResize: isValidBooleanValue(element.autoResize, true),
          containerId: element.containerId ?? null,
          originalText: element.originalText || text,
          // DucTextStyle specific
          isLtr: isValidBooleanValue(element.isLtr, true),
          fontFamily,
          bigFontFamily: isValidString(element.bigFontFamily, "sans-serif"),
          textAlign: isValidTextAlignValue(element.textAlign),
          verticalAlign: isValidVerticalAlignValue(element.verticalAlign),
          lineHeight: lineHeight,
          lineSpacing: restoredLineSpacing,
          obliqueAngle: isValidRadianValue(element.obliqueAngle, 0 as Radian),
          fontSize: finalFontSize,
          widthFactor:
            typeof element.widthFactor === "number"
              ? element.widthFactor
              : (1 as ScaleFactor),
          isUpsideDown: isValidBooleanValue(element.isUpsideDown, false),
          isBackwards: isValidBooleanValue(element.isBackwards, false),
        },
        localState
      );

      // if empty text, mark as deleted. We keep in array
      // for data integrity purposes (collab etc.)
      if (!text && !isValidBooleanValue(element.isDeleted, false)) {
        element = { ...element, originalText: text, isDeleted: true };
        element = bumpVersion(element);
      }

      return restoredTextElement;
    }
    case "freedraw": {
      const points = restoreElementPoints({
        points: element.points as DucPoint[],
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      });

      return restoreElementWithProperties(
        element,
        {
          points,
          size: restoreNumber(
            element.size,
            DEFAULT_FREEDRAW_ELEMENT.size
          ),
          lastCommittedPoint: element.lastCommittedPoint
            ? restorePoint(element.lastCommittedPoint as DucPoint)
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
          svgPath: isValidString(element.svgPath) || null,
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
          scaleFlip: isValidImageScaleValue(element.scaleFlip),
          crop: element.crop || null,
          filter: element.filter || null,
        },
        localState
      );

    case "line": {
      // Don't normalize points if there are bindings
      const hasBindings = !!(element.startBinding || element.endBinding);

      const { points, lines } = restoreLinearElementPointsAndLines({
        points: element.points as DucPoint[],
        lines: element.lines as DucLine[],
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        skipNormalization: hasBindings,
      });

      const isEditing = false; // TODO: Handle editingLinearElement properly

      let finalPoints = points;
      // Ensure we have at least 2 points for visibility check
      if (finalPoints.length < 2 && !isEditing) {
        const elementWidth = restoreNumber(element.width, 0);
        const elementHeight = restoreNumber(element.height, 0);

        finalPoints = [
          {
            x: 0,
            y: 0,
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
          ? createHeadOnlyBinding(
            startBinding.head,
            restoredBlocks
          )
          : startBinding
            ? repairBinding(
              element,
              startBinding,
              restoredBlocks
            )
            : null;

      const processedEndBinding =
        endBinding &&
          endBinding.head !== undefined &&
          (!endBinding.elementId || endBinding.elementId === "")
          ? createHeadOnlyBinding(endBinding.head, restoredBlocks)
          : endBinding
            ? repairBinding(
              element,
              endBinding,
              restoredBlocks
            )
            : null;

      // Create the base restored element
      // Skip sizeFromPoints override for block instance elements: their stored
      // width/height represents the total duplication grid, not single-cell dims.
      const isBlockInstanceElement = !!element.instanceId;
      const sizeFromPoints =
        !hasBindings &&
        !isBlockInstanceElement &&
        getSizeFromPoints(finalPoints.map((p) => ({ x: p.x, y: p.y })));
      let restoredElement = restoreElementWithProperties(
        element,
        {
          points: finalPoints,
          lines,
          lastCommittedPoint: element.lastCommittedPoint
            ? restorePoint(element.lastCommittedPoint)
            : null,
          startBinding: processedStartBinding,
          wipeoutBelow: isValidBooleanValue(element.wipeoutBelow, false),
          endBinding: processedEndBinding,
          x: element.x,
          y: element.y,
          // Only calculate size from points if we don't have bindings
          // and the element is not a block instance member (dup array uses stored total dims)
          ...(!sizeFromPoints
            ? {}
            : {
              width: sizeFromPoints.width,
              height: sizeFromPoints.height,
            }),
        },
        localState
      );

      const { points: updatedPoints, lines: updatedLines } =
        mergeOverlappingPoints(
          finalPoints,
          lines,
          LINE_CONFIRM_THRESHOLD
        );

      restoredElement = {
        ...restoredElement,
        points: updatedPoints,
        lines: updatedLines,
      };

      // Validate path overrides after we have the final points and lines
      const validatedPathOverrides = validatePathOverrides(
        element.pathOverrides,
        restoredElement
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
          wipeoutBelow: false,
        },
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
      return restoreElementWithProperties(
        { ...element, sides },
        {},
        localState
      );
    }
    // Stack-like elements
    case "frame": {
      const frameElement = element as DucFrameElement;
      return restoreElementWithProperties(
        frameElement,
        {
          ...restoreStackElementProperties(frameElement),
        },
        localState
      );
    }
    case "plot": {
      const plotElement = element as DucPlotElement;

      // Restore base stack element properties (label, visibility, etc.)
      const stackProperties = restoreStackElementProperties(
        plotElement
      );

      // Restore layout-specific properties
      const layout: PlotLayout = {
        margins: {
          top: restoreNumber(plotElement.layout?.margins?.top, 0),
          right: restoreNumber(plotElement.layout?.margins?.right, 0),
          bottom: restoreNumber(plotElement.layout?.margins?.bottom, 0),
          left: restoreNumber(plotElement.layout?.margins?.left, 0),
        },
      };

      return restoreElementWithProperties(
        plotElement,
        {
          ...stackProperties,
          layout,
        },
        localState,
        globalState
      );
    }

    // Other elements
    case "pdf":
      return restoreElementWithProperties(
        element,
        {
          fileId: (isValidString(element.fileId) as ExternalFileId) || null,
          gridConfig: restoreDocumentGridConfig((element as any).gridConfig),
        },
        localState
      );

    // Complex elements requiring specific restore logic
    case "table": {
      const tableElement = element as DucTableElement;
      const defaultData = getDefaultTableData();
      return restoreElementWithProperties(
        tableElement,
        {
          fileId: (isValidString(tableElement.fileId) as ExternalFileId) ||
            defaultData.fileId,
          gridConfig: restoreDocumentGridConfig((tableElement as any).gridConfig),
        },
        localState
      );
    }
    case "doc": {
      const docElement = element as DucDocElement;

      // Migration: old format stored the compiled PDF on fileId and the Typst
      // source in referencedFileIds. New format stores the Typst source on
      // fileId and the PDF cache in referencedFileIds with a doc_pdf_cache_ prefix.
      let migratedFileId = (isValidString(docElement.fileId) as ExternalFileId) || null;
      let migratedReferencedFileIds = docElement.referencedFileIds ?? [];

      if (migratedFileId && typeof migratedFileId === "string" && migratedFileId.startsWith("doc_pdf_")) {
        const typstSourceId = migratedReferencedFileIds.find(
          (rid) => typeof rid === "string" && rid.startsWith("doc_typst_source_"),
        );
        if (typstSourceId) {
          // Move old PDF cache to referencedFileIds with new prefix
          const elementId = docElement.id ?? "";
          const newCacheId = `doc_pdf_cache_${elementId}` as ExternalFileId;
          migratedReferencedFileIds = migratedReferencedFileIds.filter(
            (rid) => rid !== typstSourceId,
          );
          if (!migratedReferencedFileIds.includes(newCacheId)) {
            migratedReferencedFileIds = [...migratedReferencedFileIds, newCacheId];
          }
          migratedFileId = typstSourceId as ExternalFileId;
        }
      }

      return restoreElementWithProperties(
        element,
        {
          text: isValidString(docElement.text),
          fileId: migratedFileId,
          referencedFileIds: migratedReferencedFileIds,
          gridConfig: restoreDocumentGridConfig(docElement.gridConfig),
        },
        localState
      );
    }

    case "model": {
      const modelElement = element as DucModelElement;
      return restoreElementWithProperties(
        modelElement,
        {
          modelType: isValidString(modelElement.modelType) || null,
          code: isValidString(modelElement.code) || null,
          fileIds: modelElement.fileIds ? [...new Set(modelElement.fileIds)] : [],
          thumbnail: modelElement.thumbnail instanceof Uint8Array ? modelElement.thumbnail : null,
          viewerState: (modelElement.viewerState || null) as Viewer3DState | null,
        },
        localState,
        globalState
      );
    }
  }
  return null;
};

/**
 * Restores a point that might have legacy format (x,y as numbers)
 * @param point - The point to restore
 * @returns A properly formatted DucPoint
 */
export const restorePoint = (
  point:
    | Partial<DucPoint>
    | {
      x: number;
      y: number;
      isCurve?: boolean;
      mirroring?: BezierMirroring;
      handleIn?: { x: number; y: number };
      handleOut?: { x: number; y: number };
      borderRadius?: number;
    }
    | undefined,
): DucPoint | null => {
  if (!point) {
    return null;
  }

  // Handle x and y conversion
  const xValue = restoreNumber(point.x, 0);
  const yValue = restoreNumber(point.y, 0);

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
}: {
  points: any[];
  x: number | any;
  y: number | any;
  width: number | any;
  height: number | any;
}) => {
  // Convert input parameters to plain numbers
  const validatedWidth = restoreNumber(width, 0);
  const validatedHeight = restoreNumber(height, 0);

  // Process the points array with proper conversion
  let points: DucPoint[] = [];

  if (typeof oldPoints === "object" && Array.isArray(oldPoints)) {
    const migratedPoints = migratePoints(oldPoints);
    points = migratedPoints
      .map((point) => {
        const restoredPoint = restorePoint(point);
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
        x: 0,
        y: 0,
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
    points[1] &&
    points[1].x === 0 &&
    points[1].y === 0 &&
    (validatedWidth !== 0 || validatedHeight !== 0)
  ) {
    points[1] = {
      ...points[1],
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
  skipNormalization,
}: {
  points: any[];
  lines: DucLine[] | undefined;
  x: number | any;
  y: number | any;
  width: number | any;
  height: number | any;
  skipNormalization?: boolean;
}) => {
  const validatedX = restoreNumber(x, 0);
  const validatedY = restoreNumber(y, 0);
  const validatedWidth = restoreNumber(width, 0);
  const validatedHeight = restoreNumber(height, 0);

  let points: DucPoint[] = restoreElementPoints({
    points: oldPoints,
    x,
    y,
    width,
    height,
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
            ? restorePoint(line[0].handle)
            : null,
        },
        {
          index: line[1].index,
          handle: line[1].handle
            ? restorePoint(line[1].handle)
            : null,
        },
      ];
    });
  }

  if (
    !skipNormalization &&
    points.length >= 2 &&
    (points[0].x !== 0 || points[0].y !== 0)
  ) {
    const normalizedResult = getNormalizedPoints(
      {
        points,
        lines,
        x: validatedX,
        y: validatedY,
      },
    );

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    points = normalizedResult.points;
    lines = normalizedResult.lines;

    if (oldPoints && oldPoints.length === points.length) {
      if (firstPoint.x !== 0 || firstPoint.y !== 0) {
        points[0] = { ...points[0] };
      }
      if (
        lastPoint.x !== validatedWidth ||
        lastPoint.y !== validatedHeight
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

/**
 * Assigns z-index values to elements based on their position in the array.
 * This recreates the original visual stacking that was implied by array order
 * before explicit z-index support was added.
 */
export const migrateArrayOrderToZIndex = (
  elements: readonly DucElement[]
): DucElement[] => {
  // Check if we need to do a migration (if any element lacks z-index)
  const needsMigration = elements.some(
    (el) => el.zIndex === undefined || el.zIndex === null
  );

  if (!needsMigration) {
    return elements as DucElement[];
  }

  // Create a new array with explicit z-index values
  return [...elements].map((element, index) => {
    // Only update elements that don't already have a valid z-index
    if (element.zIndex === undefined || element.zIndex === null) {
      return { ...element, zIndex: index };
    }
    return element;
  });
};

export const restoreElements = (
  elements: ImportedDataState["elements"],
  second?: any,
  third?: any,
  fourth?: any
): OrderedDucElement[] => {
  let restoredBlocks: RestoredDataState["blocks"] = [];
  let opts: (ElementsConfig & {
    localState?: Readonly<Partial<DucLocalState>> | null;
  }) | undefined;

  if (Array.isArray(second)) {
    restoredBlocks = second;
    opts = third;
  } else if (second && typeof second === "object" && ("syncInvalidIndices" in second || "localState" in second || "passThroughElementIds" in second)) {
    opts = second;
  } else if (Array.isArray(third)) {
    restoredBlocks = third;
    opts = fourth;
  } else if (third && typeof third === "object") {
    opts = third;
  }

  const existingIds = new Set<string>();
  const idMap = new Map<string, string>();

  // First restore all elements with their original properties
  const restored = (elements || []).reduce((elements, element) => {
    if (element.type !== "selection") {
      let migratedElement: DucElement | null = restoreElement(
        element,
        restoredBlocks,
        opts?.localState
      );

      if (!migratedElement) {
        // element failed to restore — skip
      } else if (isInvisiblySmallElement(migratedElement)) {
        // element too small to be visible — will be filtered below
      }

      // Allow forced pass-through for specific element ids
      const isPassThrough =
        Array.isArray(opts?.passThroughElementIds) &&
        migratedElement &&
        migratedElement.id &&
        opts!.passThroughElementIds!.includes(migratedElement.id);

      if (
        migratedElement &&
        (isPassThrough || !isInvisiblySmallElement(migratedElement))
      ) {
        if (existingIds.has(migratedElement.id)) {
          const oldId = migratedElement.id;
          const newId = randomId();
          migratedElement = { ...migratedElement, id: newId };
          idMap.set(oldId, newId);
        }
        existingIds.add(migratedElement.id);

        elements.push(migratedElement);
      }
    }
    return elements;
  }, [] as DucElement[]);

  if (idMap.size > 0) {
    for (const el of restored) {
      if (el.type === "model" && typeof (el as DucModelElement).code === "string" && (el as DucModelElement).code) {
        (el as Mutable<DucModelElement>).code = updateModelCodeElementIds((el as DucModelElement).code!, idMap);
      }
    }
  }

  let restoredElements: OrderedDucElement[] = opts?.syncInvalidIndices
    ? opts.syncInvalidIndices(restored)
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

const restoreLineSpacing = (
  lineSpacing: any,
  legacyLineHeight: number,
): DucTextStyle["lineSpacing"] => {
  if (lineSpacing && lineSpacing.type && lineSpacing.value) {
    return {
      type: isValidLineSpacingTypeValue(lineSpacing.type),
      value: restoreNumber(
        lineSpacing.value,
        1.15
      ),
    };
  }
  // Fallback to legacy lineHeight
  return {
    type: LINE_SPACING_TYPE.MULTIPLE,
    value: legacyLineHeight as ScaleFactor,
  };
};

const restoreDocumentGridConfig = (
  gridConfig: any
): DocumentGridConfig => {
  if (!gridConfig || typeof gridConfig !== "object") {
    return {
      columns: 1,
      gapX: 0,
      gapY: 0,
      firstPageAlone: false,
      scale: 1,
    };
  }

  return {
    columns: typeof gridConfig.columns === "number" ? gridConfig.columns : 1,
    gapX: typeof gridConfig.gapX === "number" ? gridConfig.gapX : 0,
    gapY: typeof gridConfig.gapY === "number" ? gridConfig.gapY : 0,
    firstPageAlone: typeof gridConfig.firstPageAlone === "boolean" ? gridConfig.firstPageAlone : false,
    scale: typeof gridConfig.scale === "number" ? gridConfig.scale : 1,
  };
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
  element: DucBinderElement | undefined,
  binding: DucPointBinding | null,
  restoredBlocks?: RestoredDataState["blocks"]
): DucPointBinding | null => {
  if (!binding) {
    return null;
  }

  // If this is a head-only binding, normalize it
  if (
    binding.head !== undefined &&
    (!binding.elementId || binding.elementId === "")
  ) {
    return createHeadOnlyBinding(binding.head, restoredBlocks);
  }

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
    gap: restoreNumber(binding.gap, 0),
    head: isValidDucHead(
      binding.head,
      restoredBlocks || []
    ),
    fixedPoint: element && isElbowArrow(element)
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
      ? validateStroke(path.stroke)
      : null,
  };
};

/**
 * Validates and filters path overrides for a linear element
 */
const validatePathOverrides = (
  pathOverrides: readonly DucPath[] | Partial<DucPath>[] | undefined,
  element: DucLinearElement
): DucPath[] => {
  if (!pathOverrides || !Array.isArray(pathOverrides)) {
    return [];
  }

  const validPaths: DucPath[] = [];
  const usedLineIndices = new Set<number>();

  for (const pathOverride of pathOverrides) {
    const validatedPath = validateDucPath(
      pathOverride,
      element
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


export const isValidFreeDrawEasingValue = (
  value: DucFreeDrawEasing | string | undefined
): DucFreeDrawEasing => {
  return isValidFunction<DucFreeDrawEasing>(
    value as unknown as DucFreeDrawEasing | string,
    DEFAULT_FREEDRAW_ELEMENT.easing
  );
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
  restoredBlocks?: RestoredDataState["blocks"]
): DucPointBinding => {
  return {
    elementId: "",
    focus: 0,
    gap: 0,
    fixedPoint: null,
    point: null,
    head: isValidDucHead(head, restoredBlocks || []),
  };
};

const validateDeprecatedElementContent = (
  color: string,
  defaultContent: any
) => {
  const oldContent = tinycolor(color);
  return {
    ...defaultContent,
    src: isValidColor(oldContent.toHexString(), defaultContent.src),
    opacity: oldContent.getAlpha() as Percentage,
  };
};

const isValidLineSpacingTypeValue = (value: any) => {
  // Add implementation based on LINE_SPACING_TYPE enum
  return value || "multiple";
};

/**
 * Restore properties specific to Stack-like elements (_DucStackElementBase)
 */
const restoreStackElementProperties = (
  element: Partial<_DucStackElementBase>
) => {
  return {
    ...restoreDucStackProperties(element),
    clip: isValidBooleanValue(element.clip, false),
    labelVisible: isValidBooleanValue(element.labelVisible, true),
  };
};
