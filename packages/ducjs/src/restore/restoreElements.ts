import {
  ElementsConfig,
  isValidBezierMirroringValue,
  isValidBlendingValue,
  isValidBoolean,
  isValidBoolean as isValidBooleanValue, // Renaming to avoid conflict
  isValidColor,
  isValidDucHead,
  isValidEnumValue,
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
  restorePrecisionValue,
  validateBackground,
  validateStroke
} from "ducjs/restore/restoreDataState";
import {
  getPrecisionValueFromRaw,
  getPrecisionValueFromScoped,
  getScaledZoomValueForScope,
  getScopedBezierPointFromDucPoint,
  getScopedZoomValue,
  NEUTRAL_SCOPE,
  ScaleFactors,
} from "ducjs/technical/scopes";
import {
  _DucElementBase,
  _DucStackElementBase,
  BezierMirroring,
  DatumReference,
  DimensionDefinitionPoints,
  DucBinderElement,
  DucDimensionElement,
  DucDimensionStyle,
  DucDocElement,
  DucDocStyle,
  DucElement,
  DucFeatureControlFrameElement,
  DucFrameElement,
  DucFreeDrawEasing,
  DucFreeDrawEnds,
  DucGlobalState,
  DucHead,
  DucLeaderElement,
  DucLine,
  DucLinearElement,
  DucLocalState,
  DucParametricElement,
  DucPath,
  DucPlotElement,
  DucPoint,
  DucPointBinding,
  DucSelectionElement,
  DucTableCell,
  DucTableColumn,
  DucTableElement,
  DucTableRow,
  DucTextDynamicPart,
  DucTextElement,
  DucTextStyle,
  DucView,
  DucViewportElement,
  DucXRayElement,
  ElementContentBase,
  ExternalFileId,
  FeatureControlFrameSegment,
  FontFamilyValues,
  ImportedDataState,
  isElbowArrow,
  isLinearElement,
  isTextElement,
  LeaderContent,
  Mutable,
  NonDeleted,
  OrderedDucElement,
  ParametricElementSource,
  Percentage,
  PlotLayout,
  PrecisionValue,
  Radian,
  RawValue,
  ScaleFactor,
  Scope,
  TextColumn,
  ViewportScale,
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
  getDefaultLocalState,
  getDefaultTableData,
  getNormalizedDimensions,
  getNormalizedPoints,
  getNormalizedZoom,
  getSizeFromPoints,
  getUpdatedTimestamp,
  isFiniteNumber,
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

import {
  AXIS,
  BLOCK_ATTACHMENT,
  COLUMN_TYPE,
  DATUM_BRACKET_STYLE,
  DIMENSION_FIT_RULE,
  DIMENSION_TEXT_PLACEMENT,
  DIMENSION_TYPE,
  GDT_SYMBOL,
  LEADER_CONTENT_TYPE,
  LINE_SPACING_TYPE,
  MARK_ELLIPSE_CENTER,
  MATERIAL_CONDITION,
  PARAMETRIC_SOURCE_TYPE,
  STACKED_TEXT_ALIGN,
  TABLE_CELL_ALIGNMENT,
  TABLE_FLOW_DIRECTION,
  TEXT_FLOW_DIRECTION,
  TOLERANCE_DISPLAY,
  TOLERANCE_ZONE_TYPE,
  VERTICAL_ALIGN,
  VIEWPORT_SHADE_PLOT,
} from "ducjs/flatbuffers/duc";
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
  const elementScope = isValidElementScopeValue(
    _element.scope,
    globalState?.mainScope
  );
  const currentScope = isValidElementScopeValue(
    localState?.scope,
    globalState?.mainScope
  );
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
    x: restorePrecisionValue(_element.x, elementScope, currentScope, 0),
    y: restorePrecisionValue(_element.y, elementScope, currentScope, 0),
    scope: elementScope,
    label: _element.label ?? "Lost Element Label",
    isVisible: isValidBoolean(
      _element.isVisible,
      DEFAULT_ELEMENT_PROPS.isVisible
    ),
    isPlot: isValidBoolean(_element.isPlot, DEFAULT_ELEMENT_PROPS.isPlot),
    isAnnotative: isValidBoolean(
      _element.isAnnotative,
      DEFAULT_ELEMENT_PROPS.isAnnotative
    ),
    layerId: _element.layerId ?? null,
    regionIds: Array.isArray(_element.regionIds) ? _element.regionIds : [],
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
    type: _element.type,
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

      const lineHeight = (
        element.lineHeight && Number.isFinite(element.lineHeight)
          ? element.lineHeight
          : detectLineHeight(element)
      ) as number & {
        _brand: "unitlessLineHeight";
      };

      const restoredLineSpacing = restoreLineSpacing(
        element.lineSpacing,
        lineHeight,
        currentScope
      );

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

      const restoredTextElement = restoreElementWithProperties(
        element,
        {
          // DucTextElement specific
          text,
          dynamic: restoreTextDynamicParts(element.dynamic),
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
          paperTextHeight: element.paperTextHeight
            ? restorePrecisionValue(
              element.paperTextHeight,
              textElementScope,
              currentScope
            )
            : undefined,
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
      const elementScope = isValidElementScopeValue(
        element.scope,
        globalState?.mainScope
      );
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
      const elementScope = isValidElementScopeValue(
        element.scope,
        globalState?.mainScope
      );

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
          ? createHeadOnlyBinding(
            startBinding.head,
            restoredBlocks,
            currentScope
          )
          : startBinding
            ? repairBinding(
              element,
              startBinding,
              currentScope,
              restoredBlocks
            )
            : null;

      const processedEndBinding =
        endBinding &&
          endBinding.head !== undefined &&
          (!endBinding.elementId || endBinding.elementId === "")
          ? createHeadOnlyBinding(endBinding.head, restoredBlocks, currentScope)
          : endBinding
            ? repairBinding(
              element,
              endBinding,
              currentScope,
              restoredBlocks
            )
            : null;

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
          wipeoutBelow: isValidBooleanValue(element.wipeoutBelow, false),
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
          wipeoutBelow: false,
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
          ...restoreStackElementProperties(frameElement, currentScope),
        },
        localState
      );
    }
    case "plot": {
      const plotElement = element as DucPlotElement;
      const elementScope = isValidElementScopeValue(
        plotElement.scope,
        globalState?.mainScope
      );

      // Restore base stack element properties (label, visibility, etc.)
      const stackProperties = restoreStackElementProperties(
        plotElement,
        currentScope
      );

      // Restore layout-specific properties
      const layout: PlotLayout = {
        margins: {
          top: restorePrecisionValue(
            plotElement.layout?.margins?.top,
            elementScope,
            currentScope,
            0
          ),
          right: restorePrecisionValue(
            plotElement.layout?.margins?.right,
            elementScope,
            currentScope,
            0
          ),
          bottom: restorePrecisionValue(
            plotElement.layout?.margins?.bottom,
            elementScope,
            currentScope,
            0
          ),
          left: restorePrecisionValue(
            plotElement.layout?.margins?.left,
            elementScope,
            currentScope,
            0
          ),
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

    case "viewport": {
      const viewportElement = element as DucViewportElement;
      const elementScope = isValidElementScopeValue(
        viewportElement.scope,
        globalState?.mainScope
      );

      // A viewport has both linear and stack properties
      const { points, lines } = restoreLinearElementPointsAndLines({
        points: viewportElement.points as DucPoint[],
        lines: viewportElement.lines as DucLine[],
        x: viewportElement.x,
        y: viewportElement.y,
        width: viewportElement.width,
        height: viewportElement.height,
        elementScope,
        currentScope,
        skipNormalization: false, // Viewports are typically non-binding polygons
      });

      const stackProperties = restoreStackElementProperties(
        viewportElement,
        currentScope
      );
      const defaults = getDefaultLocalState();

      const zoomValue = getNormalizedZoom(
        isFiniteNumber(localState?.zoom?.value)
          ? localState.zoom!.value
          : defaults.zoom.value
      );
      const scopedZoom = getScopedZoomValue(zoomValue, currentScope);

      const view: DucView = {
        scrollX: restorePrecisionValue(
          viewportElement.view?.scrollX,
          NEUTRAL_SCOPE,
          currentScope,
          0
        ),
        scrollY: restorePrecisionValue(
          viewportElement.view?.scrollY,
          NEUTRAL_SCOPE,
          currentScope,
          0
        ),
        zoom: {
          value: zoomValue,
          scoped: scopedZoom,
          scaled: getScaledZoomValueForScope(scopedZoom, currentScope),
        },
        twistAngle: isValidRadianValue(
          viewportElement.view?.twistAngle,
          0 as Radian
        ),
        centerPoint: restorePoint(
          viewportElement.view?.centerPoint,
          NEUTRAL_SCOPE,
          currentScope
        )!, // Assuming centerPoint is always present
        scope: isValidElementScopeValue(
          viewportElement.view?.scope,
          globalState?.mainScope
        ),
      };

      return restoreElementWithProperties(
        viewportElement,
        {
          ...stackProperties,
          points,
          lines,
          view,
          scale: (typeof viewportElement.scale === "number"
            ? viewportElement.scale
            : 1) as ViewportScale,
          shadePlot: isValidEnumValue(
            viewportElement.shadePlot,
            VIEWPORT_SHADE_PLOT,
            VIEWPORT_SHADE_PLOT.AS_DISPLAYED
          ),
          frozenGroupIds: Array.isArray(viewportElement.frozenGroupIds)
            ? viewportElement.frozenGroupIds
            : [],
          // viewport-specific style
          scaleIndicatorVisible: isValidBoolean(
            viewportElement.scaleIndicatorVisible,
            true
          ),
        },
        localState,
        globalState
      );
    }

    // Other elements
    case "pdf":
      return restoreElementWithProperties(
        element,
        { fileId: (isValidString(element.fileId) as ExternalFileId) || null },
        localState
      );
    case "mermaid":
      return restoreElementWithProperties(
        element,
        {
          source: isValidString(element.source),
          theme: isValidString(element.theme) || undefined,
          svgPath: isValidString(element.svgPath) || null,
        },
        localState
      );

    // Complex elements requiring specific restore logic
    case "table": {
      const tableElement = element as DucTableElement;
      const defaultData = getDefaultTableData(currentScope);
      return restoreElementWithProperties(
        tableElement,
        {
          columnOrder: Array.isArray(tableElement.columnOrder)
            ? tableElement.columnOrder
            : defaultData.columnOrder,
          rowOrder: Array.isArray(tableElement.rowOrder)
            ? tableElement.rowOrder
            : defaultData.rowOrder,
          columns: restoreTableColumns(
            tableElement.columns,
            currentScope,
            defaultData.columns
          ),
          rows: restoreTableRows(
            tableElement.rows,
            currentScope,
            defaultData.rows
          ),
          cells: restoreTableCells(tableElement.cells, defaultData.cells),
          headerRowCount:
            typeof tableElement.headerRowCount === "number"
              ? tableElement.headerRowCount
              : defaultData.headerRowCount,
          autoSize: tableElement.autoSize || defaultData.autoSize,
          // DucTableStyle properties
          flowDirection: (
            Object.values(TABLE_FLOW_DIRECTION)
          ).includes(tableElement.flowDirection)
            ? tableElement.flowDirection
            : defaultData.flowDirection,
          headerRowStyle: restoreTableCellStyle(
            tableElement.headerRowStyle,
            currentScope,
            defaultData.headerRowStyle
          ),
          dataRowStyle: restoreTableCellStyle(
            tableElement.dataRowStyle,
            currentScope,
            defaultData.dataRowStyle
          ),
          dataColumnStyle: restoreTableCellStyle(
            tableElement.dataColumnStyle,
            currentScope,
            defaultData.dataColumnStyle
          ),
        },
        localState
      );
    }
    case "doc": {
      const docElement = element as DucDocElement;

      return restoreElementWithProperties(
        element,
        {
          ...restoreDocStyleProperties(docElement, currentScope),
          text: isValidString(docElement.text),
          dynamic: restoreTextDynamicParts(docElement.dynamic),
          flowDirection: (
            Object.values(TEXT_FLOW_DIRECTION)
          ).includes(docElement.flowDirection)
            ? docElement.flowDirection
            : TEXT_FLOW_DIRECTION.TOP_TO_BOTTOM,
          columns: restoreTextColumns(docElement.columns, currentScope),
          autoResize: isValidBooleanValue(docElement.autoResize, true),
        },
        localState
      );
    }

    case "xray": {
      const xrayElement = element as DucXRayElement;
      const elementScope = isValidElementScopeValue(
        xrayElement.scope,
        globalState?.mainScope
      );

      return restoreElementWithProperties(
        xrayElement,
        {
          origin: restorePoint(xrayElement.origin, elementScope, currentScope)!,
          direction: restorePoint(
            xrayElement.direction,
            elementScope,
            currentScope
          )!,
          startFromOrigin: isValidBoolean(xrayElement.startFromOrigin, false),
          color: isValidColor(xrayElement.color, "#FF00FF"),
        },
        localState,
        globalState
      );
    }

    case "parametric": {
      const parametricElement = element as DucParametricElement;
      let source: ParametricElementSource;

      if (parametricElement.source?.type === PARAMETRIC_SOURCE_TYPE.FILE) {
        source = {
          type: PARAMETRIC_SOURCE_TYPE.FILE,
          fileId: isValidString(parametricElement.source?.fileId) as ExternalFileId,
        };
      } else {
        source = {
          type: PARAMETRIC_SOURCE_TYPE.CODE,
          code: isValidString(parametricElement.source?.code),
        };
      }

      return restoreElementWithProperties(
        parametricElement,
        { source },
        localState,
        globalState
      );
    }

    case "featurecontrolframe": {
      const fcfElement = element as DucFeatureControlFrameElement;
      const elementScope = isValidElementScopeValue(
        fcfElement.scope,
        globalState?.mainScope
      );

      return restoreElementWithProperties(
        fcfElement,
        {
          // Restore style properties
          textStyle: restoreTextStyle(fcfElement.textStyle, currentScope),
          layout: {
            padding: restorePrecisionValue(
              fcfElement.layout?.padding,
              elementScope,
              currentScope,
              2
            ),
            segmentSpacing: restorePrecisionValue(
              fcfElement.layout?.segmentSpacing,
              elementScope,
              currentScope,
              2
            ),
            rowSpacing: restorePrecisionValue(
              fcfElement.layout?.rowSpacing,
              elementScope,
              currentScope,
              2
            ),
          },
          symbols: {
            scale: fcfElement.symbols?.scale ?? 1,
          },
          datumStyle: {
            bracketStyle: isValidEnumValue(
              fcfElement.datumStyle?.bracketStyle,
              DATUM_BRACKET_STYLE,
              DATUM_BRACKET_STYLE.SQUARE
            ),
          },
          // Restore data properties
          rows: restoreFcfRows(fcfElement.rows),
          frameModifiers: restoreFcfFrameModifiers(
            fcfElement.frameModifiers,
            elementScope,
            currentScope
          ),
          leaderElementId: isValidString(fcfElement.leaderElementId) || null,
          datumDefinition: restoreFcfDatumDefinition(
            fcfElement.datumDefinition,
            elementScope,
            currentScope,
            restoredBlocks
          ),
        },
        localState,
        globalState
      );
    }

    case "leader": {
      const leaderElement = element as DucLeaderElement;
      const elementScope = isValidElementScopeValue(
        leaderElement.scope,
        globalState?.mainScope
      );

      // A leader is a linear element
      const { points, lines } = restoreLinearElementPointsAndLines({
        points: leaderElement.points as DucPoint[],
        lines: leaderElement.lines as DucLine[],
        x: leaderElement.x,
        y: leaderElement.y,
        width: leaderElement.width,
        height: leaderElement.height,
        elementScope,
        currentScope,
        skipNormalization: !!(
          leaderElement.startBinding || leaderElement.endBinding
        ),
      });

      return restoreElementWithProperties(
        leaderElement,
        {
          points,
          lines,
          // DucLeaderStyle properties
          headsOverride: restoreHeadsOverride(
            leaderElement.headsOverride,
            restoredBlocks,
            elementScope,
            currentScope
          ),
          dogleg: restorePrecisionValue(
            leaderElement.dogleg,
            elementScope,
            currentScope,
            10
          ),
          textStyle: restoreTextStyle(leaderElement.textStyle, currentScope),
          textAttachment: isValidEnumValue(
            leaderElement.textAttachment,
            VERTICAL_ALIGN,
            VERTICAL_ALIGN.TOP
          ),
          blockAttachment: isValidEnumValue(
            leaderElement.blockAttachment,
            BLOCK_ATTACHMENT,
            BLOCK_ATTACHMENT.CENTER_EXTENTS
          ),
          // Leader data
          leaderContent: restoreLeaderContent(leaderElement.leaderContent),
          contentAnchor: leaderElement.contentAnchor || { x: 0, y: 0 },
        },
        localState,
        globalState
      );
    }

    case "dimension": {
      const dimElement = element as DucDimensionElement;
      const elementScope = isValidElementScopeValue(
        dimElement.scope,
        globalState?.mainScope
      );

      return restoreElementWithProperties(
        dimElement,
        {
          // DucDimensionStyle properties
          ...restoreDimensionStyle(dimElement, currentScope),
          // Dimension data
          dimensionType: isValidEnumValue(
            dimElement.dimensionType,
            DIMENSION_TYPE,
            DIMENSION_TYPE.LINEAR
          ),
          definitionPoints: restoreDimensionDefinitionPoints(
            dimElement.definitionPoints
          ),
          obliqueAngle: isValidRadianValue(
            dimElement.obliqueAngle,
            0 as Radian
          ),
          ordinateAxis: isValidEnumValue(dimElement.ordinateAxis, AXIS, null),
          bindings: restoreDimensionBindings(
            dimElement.bindings,
            elementScope,
            currentScope,
            restoredBlocks
          ),
          textOverride: isValidString(dimElement.textOverride) || null,
          textPosition: dimElement.textPosition || null,
          toleranceOverride: restoreDimensionToleranceStyle(
            dimElement.toleranceOverride,
            currentScope
          ),
          baselineData: dimElement.baselineData
            ? {
              baseDimensionId: isValidString(
                dimElement.baselineData.baseDimensionId
              ),
            }
            : undefined,
          continueData: dimElement.continueData
            ? {
              continueFromDimensionId: isValidString(
                dimElement.continueData.continueFromDimensionId
              ),
            }
            : undefined,
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

const restoreTextDynamicParts = (
  dynamic: readonly any[] | undefined
): DucTextDynamicPart[] => {
  if (!Array.isArray(dynamic)) {
    return [];
  }
  return dynamic
    .map((part) => ({
      tag: isValidString(part.tag),
      source: part.source, // Assuming source is valid, could be further validated
      formatting: part.formatting, // Assuming valid
      cachedValue: isValidString(part.cachedValue),
    }))
    .filter((part) => part.tag);
};

const restoreLineSpacing = (
  lineSpacing: any,
  legacyLineHeight: number,
  currentScope: Scope
): DucTextStyle["lineSpacing"] => {
  if (lineSpacing && lineSpacing.type && lineSpacing.value) {
    return {
      type: isValidLineSpacingTypeValue(lineSpacing.type),
      value: restorePrecisionValue(
        lineSpacing.value,
        currentScope,
        currentScope,
        1.15,
        true
      ),
    };
  }
  // Fallback to legacy lineHeight
  return {
    type: LINE_SPACING_TYPE.MULTIPLE,
    value: legacyLineHeight as ScaleFactor,
  };
};

const restoreTableCellStyle = (
  style: any,
  currentScope: Scope,
  defaultStyle: any
) => {
  if (!style || typeof style !== "object") {
    return defaultStyle;
  }
  return {
    ...defaultStyle,
    ...style, // Basic override for now, can be deepened
    alignment: (Object.values(TABLE_CELL_ALIGNMENT) as string[]).includes(
      style.alignment
    )
      ? style.alignment
      : defaultStyle.alignment,
  };
};

const restoreTableColumns = (
  columns: any,
  currentScope: Scope,
  defaultColumns: any
): Record<string, DucTableColumn> => {
  if (!columns || typeof columns !== "object") {
    return defaultColumns;
  }
  const restored: Record<string, DucTableColumn> = {};
  for (const id in columns) {
    const col = columns[id];
    if (col && typeof col === "object" && isValidString(col.id)) {
      restored[id] = {
        id: col.id,
        width: restorePrecisionValue(
          col.width,
          currentScope,
          currentScope,
          100
        ),
        styleOverrides: col.styleOverrides
          ? restoreTableCellStyle(col.styleOverrides, currentScope, {})
          : undefined,
      };
    }
  }
  return restored;
};

const restoreTableRows = (
  rows: any,
  currentScope: Scope,
  defaultRows: any
): Record<string, DucTableRow> => {
  if (!rows || typeof rows !== "object") {
    return defaultRows;
  }
  const restored: Record<string, DucTableRow> = {};
  for (const id in rows) {
    const row = rows[id];
    if (row && typeof row === "object" && isValidString(row.id)) {
      restored[id] = {
        id: row.id,
        height: restorePrecisionValue(
          row.height,
          currentScope,
          currentScope,
          40
        ),
        styleOverrides: row.styleOverrides
          ? restoreTableCellStyle(row.styleOverrides, currentScope, {})
          : undefined,
      };
    }
  }
  return restored;
};

const restoreTableCells = (
  cells: any,
  defaultCells: any
): Record<string, DucTableCell> => {
  if (!cells || typeof cells !== "object") {
    return defaultCells;
  }
  const restored: Record<string, DucTableCell> = {};
  for (const id in cells) {
    const cell = cells[id];
    if (
      cell &&
      typeof cell === "object" &&
      isValidString(cell.rowId) &&
      isValidString(cell.columnId)
    ) {
      restored[id] = {
        rowId: cell.rowId,
        columnId: cell.columnId,
        data: isValidString(cell.data),
        locked: isValidBooleanValue(cell.locked, false),
        span: cell.span
          ? {
            columns:
              typeof cell.span.columns === "number" ? cell.span.columns : 1,
            rows: typeof cell.span.rows === "number" ? cell.span.rows : 1,
          }
          : undefined,
        styleOverrides: cell.styleOverrides, // Not deeply restored for now
      };
    }
  }
  return restored;
};

const restoreDocStyleProperties = (
  doc: Partial<DucDocElement>,
  currentScope: Scope
): DucDocStyle => {
  const elementScope = isValidElementScopeValue(doc.scope, currentScope);

  // Use the new helper to restore all properties from DucTextStyle
  const restoredTextStyle = restoreTextStyle(doc, currentScope);

  // Restore properties specific to DucDocStyle
  const paragraph: DucDocStyle['paragraph'] = {
    firstLineIndent: restorePrecisionValue(doc.paragraph?.firstLineIndent, elementScope, currentScope, 0),
    hangingIndent: restorePrecisionValue(doc.paragraph?.hangingIndent, elementScope, currentScope, 0),
    leftIndent: restorePrecisionValue(doc.paragraph?.leftIndent, elementScope, currentScope, 0),
    rightIndent: restorePrecisionValue(doc.paragraph?.rightIndent, elementScope, currentScope, 0),
    spaceBefore: restorePrecisionValue(doc.paragraph?.spaceBefore, elementScope, currentScope, 0),
    spaceAfter: restorePrecisionValue(doc.paragraph?.spaceAfter, elementScope, currentScope, 0),
    tabStops: Array.isArray(doc.paragraph?.tabStops)
      ? doc.paragraph.tabStops.map(ts => restorePrecisionValue(ts, elementScope, currentScope, 0))
      : [],
  };

  const stackFormat: DucDocStyle['stackFormat'] = {
    autoStack: isValidBoolean(doc.stackFormat?.autoStack, false),
    stackChars: Array.isArray(doc.stackFormat?.stackChars) ? doc.stackFormat.stackChars.map(String) : [],
    properties: {
      upperScale: typeof doc.stackFormat?.properties?.upperScale === 'number' ? doc.stackFormat.properties.upperScale : 0.7,
      lowerScale: typeof doc.stackFormat?.properties?.lowerScale === 'number' ? doc.stackFormat.properties.lowerScale : 0.7,
      alignment: isValidEnumValue(doc.stackFormat?.properties?.alignment, STACKED_TEXT_ALIGN, STACKED_TEXT_ALIGN.CENTER),
    },
  };

  return {
    ...restoredTextStyle,
    paragraph,
    stackFormat,
  };
};

const restoreTextColumns = (columns: any, currentScope: Scope) => {
  const defaultGutter = getPrecisionValueFromRaw(
    5 as RawValue,
    currentScope,
    currentScope
  );
  const defaultWidth = getPrecisionValueFromRaw(
    100 as RawValue,
    currentScope,
    currentScope
  );

  if (!columns || typeof columns !== "object") {
    return {
      type: COLUMN_TYPE.NO_COLUMNS,
      definitions: [],
      autoHeight: true,
    };
  }

  const definitions: TextColumn[] = Array.isArray(columns.definitions)
    ? columns.definitions.map((def: any) => ({
      width: restorePrecisionValue(
        def?.width,
        currentScope,
        currentScope,
        defaultWidth.value
      ),
      gutter: restorePrecisionValue(
        def?.gutter,
        currentScope,
        currentScope,
        defaultGutter.value
      ),
    }))
    : [];

  return {
    type: (Object.values(COLUMN_TYPE) as string[]).includes(columns.type)
      ? columns.type
      : COLUMN_TYPE.NO_COLUMNS,
    definitions,
    autoHeight: isValidBooleanValue(columns.autoHeight, true),
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
  const elementScope = element ? element.scope : NEUTRAL_SCOPE;

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

const isValidLineSpacingTypeValue = (value: any) => {
  // Add implementation based on LINE_SPACING_TYPE enum
  return value || "multiple";
};

/**
 * Restore properties specific to Stack-like elements (_DucStackElementBase)
 */
const restoreStackElementProperties = (
  element: Partial<_DucStackElementBase>,
  currentScope: Scope
) => {
  return {
    ...restoreDucStackProperties(element),
    clip: isValidBooleanValue(element.clip, false),
    labelVisible: isValidBooleanValue(element.labelVisible, true),
    standardOverride: isValidString(element.standardOverride) || null,
  };
};

// --- Dimension Restoration Helpers ---

const restoreDimensionStyle = (
  dim: Partial<DucDimensionElement>,
  currentScope: Scope
): DucDimensionStyle => {
  const defaultTextStyle = restoreTextStyle(undefined, currentScope);
  return {
    dimLine: {
      stroke: dim.dimLine?.stroke
        ? validateStroke(dim.dimLine.stroke, dim.scope!, currentScope)
        : DEFAULT_ELEMENT_PROPS.stroke,
      textGap: restorePrecisionValue(
        dim.dimLine?.textGap,
        dim.scope!,
        currentScope,
        2
      ),
    },
    extLine: {
      stroke: dim.extLine?.stroke
        ? validateStroke(dim.extLine.stroke, dim.scope!, currentScope)
        : DEFAULT_ELEMENT_PROPS.stroke,
      overshoot: restorePrecisionValue(
        dim.extLine?.overshoot,
        dim.scope!,
        currentScope,
        2
      ),
      offset: restorePrecisionValue(
        dim.extLine?.offset,
        dim.scope!,
        currentScope,
        2
      ),
    },
    textStyle: restoreTextStyle(dim.textStyle, currentScope),
    symbols: {
      headsOverride: restoreHeadsOverride(
        dim.symbols?.headsOverride,
        [],
        dim.scope!,
        currentScope
      ), // Assuming no blocks initially
      centerMark: {
        type: isValidEnumValue(
          dim.symbols?.centerMark?.type,
          MARK_ELLIPSE_CENTER,
          MARK_ELLIPSE_CENTER.MARK
        ),
        size: restorePrecisionValue(
          dim.symbols?.centerMark?.size,
          dim.scope!,
          currentScope,
          5
        ),
      },
    },
    tolerance: restoreDimensionToleranceStyle(
      dim.tolerance,
      currentScope,
      defaultTextStyle
    ),
    fit: {
      rule: isValidEnumValue(
        dim.fit?.rule,
        DIMENSION_FIT_RULE,
        DIMENSION_FIT_RULE.BEST_FIT
      ),
      textPlacement: isValidEnumValue(
        dim.fit?.textPlacement,
        DIMENSION_TEXT_PLACEMENT,
        DIMENSION_TEXT_PLACEMENT.BESIDE_LINE
      ),
      forceTextInside: isValidBoolean(dim.fit?.forceTextInside, false),
    },
  };
};

const restoreDimensionToleranceStyle = (
  tol: Partial<DucDimensionStyle["tolerance"]> | undefined,
  currentScope: Scope,
  defaultTextStyle?: DucTextStyle
): DucDimensionStyle["tolerance"] => {
  return {
    enabled: isValidBoolean(tol?.enabled, false),
    displayMethod: isValidEnumValue(
      tol?.displayMethod,
      TOLERANCE_DISPLAY,
      TOLERANCE_DISPLAY.NONE
    ),
    upperValue: tol?.upperValue ?? 0,
    lowerValue: tol?.lowerValue ?? 0,
    precision: tol?.precision ?? 2,
    textStyle: tol?.textStyle
      ? restoreTextStyle(tol.textStyle, currentScope)
      : defaultTextStyle || restoreTextStyle(undefined, currentScope),
  };
};

const restoreDimensionDefinitionPoints = (
  points: Partial<DimensionDefinitionPoints> | undefined
): DimensionDefinitionPoints => {
  return {
    origin1: points?.origin1 || { x: 0, y: 0 },
    origin2: points?.origin2,
    location: points?.location || { x: 0, y: 0 },
    center: points?.center,
    jog: points?.jog,
  };
};

const restoreDimensionBindings = (
  bindings: Partial<DucDimensionElement["bindings"]> | undefined,
  elementScope: Scope,
  currentScope: Scope,
  restoredBlocks: RestoredDataState["blocks"]
): DucDimensionElement["bindings"] | undefined => {
  if (!bindings) return undefined;
  return {
    origin1: bindings.origin1
      ? repairBinding(
        undefined,
        bindings.origin1 ?? null,
        currentScope,
        restoredBlocks
      )
      : null,
    origin2: bindings.origin2
      ? repairBinding(
        undefined,
        bindings.origin2 ?? null,
        currentScope,
        restoredBlocks
      )
      : null,
    center: bindings.center
      ? repairBinding(
        undefined,
        bindings.center ?? null,
        currentScope,
        restoredBlocks
      )
      : null,
  };
};

// --- Leader Restoration Helpers ---

const restoreLeaderContent = (
  content: LeaderContent | undefined | null
): LeaderContent | null => {
  if (!content) return null;
  const type = isValidEnumValue(content.type, LEADER_CONTENT_TYPE, null);
  if (type === LEADER_CONTENT_TYPE.TEXT) {
    // Only access text if type is "text"
    if ('text' in content) {
      return { type: "text", text: isValidString(content.text) };
    }
  }
  if (type === LEADER_CONTENT_TYPE.BLOCK) {
    // Only access blockId and instanceData if type is "block"
    if ('blockId' in content && 'instanceData' in content) {
      return {
        type: "block",
        blockId: isValidString(content.blockId),
        instanceData: {
          attributeValues: content.instanceData?.attributeValues,
          elementOverrides: content.instanceData?.elementOverrides,
        },
      };
    }
  }
  return null;
};

// --- FCF Restoration Helpers ---

const restoreFcfRows = (
  rows: readonly (readonly FeatureControlFrameSegment[])[] | undefined
): readonly (readonly FeatureControlFrameSegment[])[] => {
  return rows ? rows.map((row) =>
    row ? row.map((segment) => ({
      symbol: isValidEnumValue(
        segment.symbol,
        GDT_SYMBOL,
        GDT_SYMBOL.POSITION
      ),
      tolerance: {
        value: isValidString(segment.tolerance?.value),
        zoneType: isValidEnumValue(
          segment.tolerance?.zoneType,
          TOLERANCE_ZONE_TYPE,
          undefined
        ),
        featureModifiers: Array.isArray(segment.tolerance?.featureModifiers)
          ? segment.tolerance.featureModifiers
          : [],
        materialCondition: isValidEnumValue(
          segment.tolerance?.materialCondition,
          MATERIAL_CONDITION,
          undefined
        ),
      },
      datums: (Array.isArray(segment.datums)
        ? segment.datums.map((datum) => ({
          letters: isValidString(datum?.letters),
          modifier: isValidEnumValue(
            datum?.modifier,
            MATERIAL_CONDITION,
            undefined
          ),
        }))
        : []) as [DatumReference?, DatumReference?, DatumReference?],
    }))
      : []
  ) : [];
};

const restoreFcfFrameModifiers = (
  mods: Partial<DucFeatureControlFrameElement["frameModifiers"]> | undefined,
  elementScope: Scope,
  currentScope: Scope
): DucFeatureControlFrameElement["frameModifiers"] | undefined => {
  if (!mods) return undefined;
  return {
    allAround: isValidBoolean(mods.allAround),
    allOver: isValidBoolean(mods.allOver),
    continuousFeature: isValidBoolean(mods.continuousFeature),
    between: mods.between
      ? {
        start: isValidString(mods.between.start),
        end: isValidString(mods.between.end),
      }
      : undefined,
    projectedToleranceZone: mods.projectedToleranceZone
      ? restorePrecisionValue(
        mods.projectedToleranceZone.value,
        elementScope,
        currentScope
      )
      : undefined,
  };
};

const restoreFcfDatumDefinition = (
  def: Partial<DucFeatureControlFrameElement["datumDefinition"]> | undefined,
  elementScope: Scope,
  currentScope: Scope,
  restoredBlocks: RestoredDataState["blocks"]
): DucFeatureControlFrameElement["datumDefinition"] | undefined => {
  if (!def || !isValidString(def.letter)) return undefined;
  return {
    letter: isValidString(def.letter, ""),
    featureBinding: repairBinding(
      undefined,
      def.featureBinding ?? null,
      currentScope,
      restoredBlocks
    ) ?? undefined,
  };
};

// --- Shared & Generic Style Helpers ---

const restoreTextStyle = (
  style: Partial<DucTextStyle> | undefined,
  currentScope: Scope
): DucTextStyle => {
  const defaultLineHeight = 1.15 as number & { _brand: "unitlessLineHeight" };
  return {
    // Base styles
    ...(style?.background
      ? { background: style.background.map(validateBackground) }
      : { background: [DEFAULT_ELEMENT_PROPS.background] }),
    ...(style?.stroke
      ? {
        stroke: style.stroke.map((s) =>
          validateStroke(s, NEUTRAL_SCOPE, currentScope)
        ),
      }
      : { stroke: [DEFAULT_ELEMENT_PROPS.stroke] }),
    roundness: restorePrecisionValue(
      style?.roundness,
      NEUTRAL_SCOPE,
      currentScope,
      DEFAULT_ELEMENT_PROPS.roundness.value
    ),
    opacity: isValidPercentageValue(
      style?.opacity,
      DEFAULT_ELEMENT_PROPS.opacity
    ),
    blending: isValidBlendingValue(style?.blending),
    // Text-specific styles
    isLtr: isValidBoolean(style?.isLtr, true),
    fontFamily: getFontFamilyByName(style?.fontFamily as unknown as string),
    bigFontFamily: isValidString(style?.bigFontFamily, "sans-serif"),
    textAlign: isValidTextAlignValue(style?.textAlign),
    verticalAlign: isValidVerticalAlignValue(style?.verticalAlign),
    lineHeight: style?.lineHeight ?? defaultLineHeight,
    lineSpacing: restoreLineSpacing(
      style?.lineSpacing,
      style?.lineHeight ?? defaultLineHeight.valueOf(),
      currentScope
    ),
    obliqueAngle: isValidRadianValue(style?.obliqueAngle, 0 as Radian),
    fontSize: restorePrecisionValue(
      style?.fontSize,
      NEUTRAL_SCOPE,
      currentScope,
      DEFAULT_FONT_SIZE
    ),
    paperTextHeight: style?.paperTextHeight
      ? restorePrecisionValue(
        style.paperTextHeight,
        NEUTRAL_SCOPE,
        currentScope
      )
      : undefined,
    widthFactor: style?.widthFactor ?? 1 as ScaleFactor,
    isUpsideDown: isValidBoolean(style?.isUpsideDown, false),
    isBackwards: isValidBoolean(style?.isBackwards, false),
  };
};

const restoreHeadsOverride = (
  heads: [DucHead, DucHead] | undefined,
  restoredBlocks: RestoredDataState["blocks"],
  elementScope: Scope,
  currentScope: Scope
): [DucHead, DucHead] | undefined => {
  if (!Array.isArray(heads) || heads.length !== 2) return undefined;
  const startHead = isValidDucHead(
    heads[0],
    restoredBlocks,
    elementScope,
    currentScope
  );
  const endHead = isValidDucHead(
    heads[1],
    restoredBlocks,
    elementScope,
    currentScope
  );
  if (!startHead || !endHead) return undefined;
  return [startHead, endHead];
};
