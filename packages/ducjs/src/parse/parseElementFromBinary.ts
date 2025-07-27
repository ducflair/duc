import {
  BindingPoint as BinBindingPoint,
  DucElement as BinDucElement,
  DucLine as BinDucLine,
  DucLineReference as BinDucLineReference,
  DucPath as BinDucPath,
  ElementBackground as BinElementBackground,
  ElementContentBase as BinElementContentBase,
  ElementStroke as BinElementStroke,
  ImageCrop as BinImageCrop,
  Point as BinPoint,
  PointBinding as BinPointBinding,
  StrokeSides as BinStrokeSides,
  TilingProperties as BinTilingProperties
} from 'ducjs/duc';
import { getPrecisionValueFromRaw, NEUTRAL_SCOPE, SupportedMeasures } from 'ducjs/technical/scopes';
import { RawValue, Scope } from 'ducjs/types';
import {
  BezierMirroring,
  Blending,
  BoundElement,
  DucArrowElement,
  DucBlockInstanceElement,
  DucDocElement,
  DucElement,
  DucEllipseElement,
  DucFrameElement,
  DucFreeDrawElement,
  DucImageElement,
  DucLine,
  DucLinearElement,
  DucLineReference,
  DucPath,
  DucPoint,
  DucPointBinding,
  DucPolygonElement,
  DucRectangleElement,
  DucSelectionElement,
  DucTextElement,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  ExternalFileId,
  FillStyle,
  FontFamilyValues,
  ImageCrop,
  LineHead,
  StrokeCap,
  StrokeJoin,
  StrokePlacement,
  StrokePreference,
  StrokeSidePreference,
  StrokeSides,
  TextAlign,
  TilingProperties,
  VerticalAlign
} from 'ducjs/types/elements';
import { Percentage, Radian } from 'ducjs/types/geometryTypes';
import { DEFAULT_ELEMENT_PROPS, FREEDRAW_EASINGS } from 'ducjs/utils/constants';




export const parseElementFromBinary = (e: BinDucElement, v: string): Partial<DucElement> | null => {
  if (!e) return null;

  const elType = e.type();
  if (!elType) return null;

  // Will be removed since we don't need to support legacy v1 migration on v2
  const forceNeutralScope = v <= '5';

  let readScope = e.scope() as Scope | null;
  const elementScope = forceNeutralScope ? NEUTRAL_SCOPE : (readScope || NEUTRAL_SCOPE);

  // Populate groupIds array
  let groupIds: string[] = [];
  for (let j = 0; j < e.groupIdsLength(); j++) {
    groupIds.push(e.groupIds(j) || '');
  }

  // Populate boundElements array
  const boundElements = Array.from({ length: e.boundElementsLength() })
    .map((_, j) => e.boundElements(j))
    .filter((element): element is NonNullable<typeof element> => !!element)
    .map(boundElement => ({
      id: boundElement.id(),
      type: boundElement.type()
    }))
    .filter((element): element is BoundElement =>
      !!element.id && !!element.type
    );

  let strokes: ElementStroke[] = [];
  let backgrounds: ElementBackground[] = [];

  if (e.strokeLength && e.strokeLength() > 0) {
    strokes = Array.from({ length: e.strokeLength() })
      .map((_, i) => {
        const stroke = e.stroke(i);
        return parseElementBinStroke(stroke, elementScope);
      })
      .filter((stroke): stroke is ElementStroke => stroke !== null);
  }

  if (e.backgroundLength && e.backgroundLength() > 0) {
    backgrounds = Array.from({ length: e.backgroundLength() })
      .map((_, i) => {
        const background = e.background(i);
        return parseElementBinBackground(background);
      })
      .filter((background): background is ElementBackground => background !== null);
  }

  const points: DucPoint[] = ['freedraw', 'line', 'arrow'].includes(elType)
    ? Array.from({ length: e.linearElementPointsLength() })
      .map((_, j) => e.linearElementPoints(j))
      .filter((point): point is NonNullable<typeof point> => !!point)
      .map(point => parsePoint(point, elementScope))
      .filter((point): point is DucPoint => point !== null)
    : [];

  const lines: DucLine[] | undefined = ['line', 'arrow'].includes(elType)
    ? e.linearElementLines(0) !== null || e.linearElementLinesLength() > 0 // Check if field exists
      ? Array.from({ length: e.linearElementLinesLength() })
          .map((_, j) => e.linearElementLines(j))
          .filter((line): line is NonNullable<typeof line> => !!line)
          .map(line => parseLine(line, elementScope))
          .filter((line): line is DucLine => line !== null)
      : undefined
    : undefined;

  const pathOverrides = ['line', 'arrow'].includes(elType)
    ? e.linearElementPathOverrides(0) !== null || e.linearElementPathOverridesLength() > 0
      ? Array.from({ length: e.linearElementPathOverridesLength() })
          .map((_, j) => e.linearElementPathOverrides(j))
          .filter((path): path is NonNullable<typeof path> => !!path)
          .map(path => parseDucPath(path, elementScope))
          .filter((path): path is DucPath => path !== null)
      : undefined
    : undefined;

  const pressures = elType === 'freedraw'
    ? Array.from({ length: e.freeDrawPressuresLength() })
      .map((_, j) => e.freeDrawPressures(j))
      .filter((pressure): pressure is number => pressure !== null && pressure !== undefined)
    : [];

  const baseElement: Partial<DucElement> = {
    id: e.id() || undefined,
    x: xValue ? getPrecisionValueFromRaw(xValue as RawValue, elementScope, elementScope) : undefined,
    y: yValue ? getPrecisionValueFromRaw(yValue as RawValue, elementScope, elementScope) : undefined,
    isVisible: e.isVisible(),
    opacity: e.opacity() as Percentage,
    width: widthValue ? getPrecisionValueFromRaw(widthValue as RawValue, elementScope, elementScope) : undefined,
    height: heightValue ? getPrecisionValueFromRaw(heightValue as RawValue, elementScope, elementScope) : undefined,
    angle: (v >= '2' ? e.angle() : e.angleV2()) as Radian || undefined,
    isDeleted: e.isDeleted(),
    frameId: e.frameId(),
    link: e.link() || undefined,
    locked: e.locked(),
    groupIds: groupIds,
    scope: elementScope,
    label: e.label() || undefined,
    boundElements: boundElements,
    stroke: strokes,
    background: backgrounds,
    blending: e.blending() as Blending | undefined,
    roundness: roundnessValue ? getPrecisionValueFromRaw(roundnessValue as RawValue, elementScope, elementScope) : undefined,
    zIndex: e.zIndex(),
    description: e.description() || undefined,
  };

  switch (elType) {
    case "text":
      const fontSizeValue = v >= '2' ? e.textFontSize() : e.textFontSizeV2() || undefined
      return {
        ...baseElement,
        type: elType,
        fontSize: fontSizeValue ? getPrecisionValueFromRaw(fontSizeValue as RawValue, elementScope, elementScope) : undefined,
        fontFamily: Number(e.textFontFamily()) as FontFamilyValues,
        text: e.textText(),
        textAlign: e.textTextAlign() as TextAlign,
        verticalAlign: e.textVerticalAlign() as VerticalAlign,
        containerId: e.textContainerId(),
        originalText: e.textText(),
        lineHeight: v >= '2' ? e.textLineHeight() : e.textLineHeightV2() || undefined,
        autoResize: e.textAutoResize(),
      } as DucTextElement;
    case "arrow":
      return {
        ...baseElement,
        type: elType,
        points,
        lines,
        pathOverrides,
        lastCommittedPoint: e.linearElementLastCommittedPoint() ? parsePoint(e.linearElementLastCommittedPoint(), elementScope) : null,
        startBinding: parsePointBinding(e.linearElementStartBinding(), elementScope),
        endBinding: parsePointBinding(e.linearElementEndBinding(), elementScope),
        elbowed: e.arrowElbowed()
      } as DucArrowElement;
    case "line":
      return {
        ...baseElement,
        type: elType,
        points: points,
        lines,
        pathOverrides,
        lastCommittedPoint: e.linearElementLastCommittedPoint() ? parsePoint(e.linearElementLastCommittedPoint(), elementScope) : null,
        startBinding: parsePointBinding(e.linearElementStartBinding(), elementScope),
        endBinding: parsePointBinding(e.linearElementEndBinding(), elementScope),
      } as DucLinearElement;
    case "freedraw":
      return {
        ...baseElement,
        type: elType,
        size: e.freeDrawSize() ? getPrecisionValueFromRaw(e.freeDrawSize() as RawValue, elementScope, elementScope) : undefined,
        points: points,
        pressures: pressures,
        simulatePressure: e.freeDrawSimulatePressure(),
        lastCommittedPoint: e.linearElementLastCommittedPoint() ? parsePoint(e.linearElementLastCommittedPoint(), elementScope) : null,
        thinning: (e.freeDrawThinning() ?? undefined) as Percentage,
        smoothing: (e.freeDrawSmoothing() ?? undefined) as Percentage,
        streamline: (e.freeDrawStreamline() ?? undefined) as Percentage,
        easing: e.freeDrawEasing() ? FREEDRAW_EASINGS[e.freeDrawEasing() as keyof typeof FREEDRAW_EASINGS] : undefined,
        start: e.freeDrawStartCap() !== null || e.freeDrawStartTaper() !== null || e.freeDrawStartEasing() !== null ? {
          cap: e.freeDrawStartCap() ?? false,
          taper: (e.freeDrawStartTaper() ?? 0) as Percentage,
          easing: e.freeDrawStartEasing() ? FREEDRAW_EASINGS[e.freeDrawStartEasing() as keyof typeof FREEDRAW_EASINGS] : undefined,
        } : null,
        end: e.freeDrawEndCap() !== null || e.freeDrawEndTaper() !== null || e.freeDrawEndEasing() !== null ? {
          cap: e.freeDrawEndCap() ?? false,
          taper: (e.freeDrawEndTaper() ?? 0) as Percentage,
          easing: e.freeDrawEndEasing() ? FREEDRAW_EASINGS[e.freeDrawEndEasing() as keyof typeof FREEDRAW_EASINGS] : undefined,
        } : null,
        svgPath: e.freeDrawSvgPath() ?? undefined,
      } as DucFreeDrawElement;
    case "image":
      return {
        ...baseElement,
        type: elType,
        fileId: e.fileId() as ExternalFileId | null,
        status: e.imageStatus(),
        scale: (() => { const s = e.imageScale(); return s ? [s.x(), s.y()] : undefined; })(),
        crop: parseImageCrop(e.imageCrop())
      } as DucImageElement;
    case "frame":
      return {
        ...baseElement,
        type: elType,
        isCollapsed: e.stackLikeIsCollapsed(),
        clip: e.stackLikeClip() || undefined,
        labelingColor: e.stackLikeLabelingColor() || undefined,
      } as DucFrameElement;
    case "selection":
      return {
        ...baseElement,
        type: elType,
      } as DucSelectionElement;
    case "rectangle":
      return {
        ...baseElement,
        type: elType,
      } as DucRectangleElement;
    case "polygon":
      return {
        ...baseElement,
        type: elType,
        sides: e.polygonSides()
      } as DucPolygonElement;
    case "ellipse":
      return {
        ...baseElement,
        type: elType,
        ratio: e.ellipseRatio() ?? undefined,
        startAngle: e.ellipseStartAngle() ?? undefined,
        endAngle: e.ellipseEndAngle() ?? undefined,
        showAuxCrosshair: e.ellipseShowAuxCrosshair() ?? undefined,
      } as DucEllipseElement;
    case "doc":
      return {
        ...baseElement,
        type: elType,
        content: e.docContent() || "",
      } as DucDocElement;
    case "blockinstance":
      const blockElementOverrides: Record<string, string> = {};
      for (let j = 0; j < e.blockInstanceElementOverridesLength(); j++) {
        const override = e.blockInstanceElementOverrides(j);
        if (override && override.elementId() && override.overrides()) {
          blockElementOverrides[override.elementId()!] = override.overrides()!;
        }
      }
      return {
        ...baseElement,
        type: elType,
        blockId: e.blockInstanceBlockId() || '',
      } as DucBlockInstanceElement;
    default:
      return null;
  }
};



export const parsePoint = (point: BinPoint | null, elementScope: SupportedMeasures): DucPoint | null => {
  if (!point) return null;

  return {
    x: getPrecisionValueFromRaw(point.xV3() as RawValue, elementScope, elementScope),
    y: getPrecisionValueFromRaw(point.yV3() as RawValue, elementScope, elementScope),
    ...(point.mirroring() && { mirroring: point.mirroring() as BezierMirroring }),
  };
};

const parseLineReference = (lineRef: BinDucLineReference | null, elementScope: SupportedMeasures): DucLineReference | null => {
  if (!lineRef) return null;

  const handle = lineRef.handle();
  return {
    index: lineRef.index(),
    handle: handle ? {
      x: getPrecisionValueFromRaw(handle.x() as RawValue, elementScope, elementScope),
      y: getPrecisionValueFromRaw(handle.y() as RawValue, elementScope, elementScope)
    } : null
  };
};

const parseLine = (line: BinDucLine | null, elementScope: SupportedMeasures): DucLine | null => {
  if (!line) return null;

  const start = parseLineReference(line.start(), elementScope);
  const end = parseLineReference(line.end(), elementScope);

  if (!start || !end) return null;

  return [start, end];
};

const parseDucPath = (path: BinDucPath | null, elementScope: SupportedMeasures): DucPath | null => {
  if (!path) return null;

  const lineIndices = Array.from({ length: path.lineIndicesLength() })
    .map((_, i) => path.lineIndices(i))
    .filter((index): index is number => index !== null && index !== undefined);

  const background = path.background() ? parseElementBinBackground(path.background()) : null;
  const stroke = path.stroke() ? parseElementBinStroke(path.stroke(), elementScope) : null;

  return {
    lineIndices,
    background,
    stroke
  };
};

const parseBindingPoint = (bindingPoint: BinBindingPoint | null): { index: number; offset: number } | null => {
  if (!bindingPoint) return null;

  return {
    index: bindingPoint.index(),
    offset: bindingPoint.offset()
  };
};

const parsePointBinding = (binding: BinPointBinding | null, elementScope: SupportedMeasures): DucPointBinding | null => {
  if (!binding) return null;

  const fixedPoint = binding.fixedPoint();
  return {
    elementId: binding.elementId() || '',
    focus: binding.focus(),
    gap: getPrecisionValueFromRaw(binding.gap() as RawValue, elementScope, elementScope),
    fixedPoint: fixedPoint ? {
      x: fixedPoint.x(),
      y: fixedPoint.y(),
    } : null,
    point: binding.point() ? parseBindingPoint(binding.point()) : null,
    head: binding.head() as LineHead | null
  };
};


export const parseElementContentBase = (content: BinElementContentBase | null, defaults: ElementContentBase): ElementContentBase => {
  if (!content) return defaults;
  return {
    preference: content.preference() as FillStyle,
    src: content.src() ?? defaults.src,
    visible: content.visible(),
    opacity: content.opacity() as Percentage,
    tiling: parseTiling(content.tiling() ?? null)
  };
}

const parseTiling = (tiling: BinTilingProperties | null): TilingProperties | undefined => {
  if (!tiling) return undefined;
  const sizeInPercent = tiling.sizeInPercent();
  const angle = tiling.angle();

  // Ensure both sizeInPercent and angle are defined
  if (sizeInPercent === undefined || angle === undefined) {
    return undefined;
  }
  return {
    sizeInPercent: sizeInPercent as Percentage,
    angle: angle as Radian,
    spacing: tiling.spacing() ?? undefined,
    offsetX: tiling.offsetX() ?? undefined,
    offsetY: tiling.offsetY() ?? undefined,
  };
}

const parseStrokeLines = (strokeSides: BinStrokeSides | null): StrokeSides | undefined => {
  if (!strokeSides) return undefined;

  return {
    preference: strokeSides.preference() as StrokeSidePreference,
    values: strokeSides.valuesLength() > 0
      ? Array.from(
        { length: strokeSides.valuesLength() },
        (_, i) => strokeSides.values(i)
      ).filter((item): item is NonNullable<typeof item> => item !== null)
      : undefined
  };
};

export const parseElementBinStroke = (stroke: BinElementStroke | null, elementScope: SupportedMeasures): ElementStroke => {
  if (!stroke) {
    return {
      ...DEFAULT_ELEMENT_PROPS.stroke,
      width: getPrecisionValueFromRaw(DEFAULT_ELEMENT_PROPS.stroke.width.value as RawValue, elementScope, elementScope)
    };
  }

  const widthValue = stroke.width?.() ?? DEFAULT_ELEMENT_PROPS.stroke.width.value
  return {
    content: parseElementContentBase(stroke.content() ?? null, DEFAULT_ELEMENT_PROPS.stroke.content),
    width: getPrecisionValueFromRaw(widthValue as RawValue, elementScope, elementScope),
    style: {
      preference: (stroke.style()?.preference?.() as StrokePreference) ?? DEFAULT_ELEMENT_PROPS.stroke.style.preference,
      cap: (stroke.style()?.cap?.() as StrokeCap) ?? undefined,
      join: (stroke.style()?.join?.() as StrokeJoin) ?? undefined,
      dash: Array.from({ length: stroke.style()?.dashLength() || 0 }, (_, i) => stroke.style()?.dash(i) as number),
      dashCap: (stroke.style()?.dashCap?.() as StrokeCap) ?? undefined,
      miterLimit: (stroke.style()?.miterLimit?.() as number) ?? undefined,
    },
    placement: (stroke.placement?.() as StrokePlacement) ?? DEFAULT_ELEMENT_PROPS.stroke.placement,
    strokeSides: parseStrokeLines(stroke.strokeSides() ?? null)
  };
};

export const parseElementBinBackground = (background: BinElementBackground | null): ElementBackground => {
  if (!background) {
    return DEFAULT_ELEMENT_PROPS.background;
  }

  return {
    content: parseElementContentBase(background.content() ?? null, DEFAULT_ELEMENT_PROPS.background.content),
  };
};

const parseImageCrop = (crop: BinImageCrop | null): ImageCrop | null => {
  if (!crop) return null;
  return {
    x: crop.x(),
    y: crop.y(),
    width: crop.width(),
    height: crop.height(),
    naturalWidth: crop.naturalWidth(),
    naturalHeight: crop.naturalHeight()
  };
};
