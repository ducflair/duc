import { FileSystemHandle } from 'browser-fs-access';
import { decompressSync, strFromU8 } from 'fflate';
import * as flatbuffers from "flatbuffers";
import { nanoid } from 'nanoid';
import {
  CustomHatchPattern as CustomHatchPatternFb,
  DimensionToleranceStyle as DimensionToleranceStyleFb,
  DOCUMENT_GRID_ALIGN_ITEMS,
  DucArrowElement as DucArrowElementFb,
  DucBlockCollection as DucBlockCollectionFb,
  DucBlock as DucBlockFb,
  DucBlockInstance as DucBlockInstanceFb,
  DucBlockMetadata as DucBlockMetadataFb,
  DucCommonStyle as DucCommonStyleFb,
  DucDimensionElement as DucDimensionElementFb,
  DucDimensionStyle as DucDimensionStyleFb,
  DucDocElement as DucDocElementFb,
  DucDocStyle as DucDocStyleFb,
  DucEllipseElement as DucEllipseElementFb,
  DucEmbeddableElement as DucEmbeddableElementFb,
  DucExternalFileEntry,
  DucFeatureControlFrameElement as DucFeatureControlFrameElementFb,
  DucFeatureControlFrameStyle as DucFeatureControlFrameStyleFb,
  DucFrameElement as DucFrameElementFb,
  DucFreeDrawElement as DucFreeDrawElementFb,
  DucGlobalState as DucGlobalStateFb,
  DucGroup as DucGroupFb,
  DucHatchStyle as DucHatchStyleFb,
  DucHead as DucHeadFb,
  DucImageElement as DucImageElementFb,
  DucImageFilter as DucImageFilterFb,
  DucLayer as DucLayerFb,
  DucLeaderElement as DucLeaderElementFb,
  DucLeaderStyle as DucLeaderStyleFb,
  DucLine as DucLineFb,
  DucLineReference as DucLineReferenceFb,
  DucLinearElement as DucLinearElementFb,
  DucLocalState as DucLocalStateFb,
  DucMermaidElement as DucMermaidElementFb,
  DucModelElement as DucModelElementFb,
  DucPath as DucPathFb,
  DucPdfElement as DucPdfElementFb,
  DucPlotElement as DucPlotElementFb,
  DucPlotStyle as DucPlotStyleFb,
  DucPointBinding as DucPointBindingFb,
  DucPoint as DucPointFb,
  DucPolygonElement as DucPolygonElementFb,
  DucRectangleElement as DucRectangleElementFb,
  DucRegion as DucRegionFb,
  DucStackLikeStyles as DucStackLikeStylesFb,
  DucTableCellStyle as DucTableCellStyleFb,
  DucTableElement as DucTableElementFb,
  DucTableStyle as DucTableStyleFb,
  DucTextDynamicDictionarySource as DucTextDynamicDictionarySourceFb,
  DucTextDynamicElementSource as DucTextDynamicElementSourceFb,
  DucTextElement as DucTextElementFb,
  DucTextStyle as DucTextStyleFb,
  DucUcs as DucUcsFb,
  DucView as DucViewFb,
  DucViewportElement as DucViewportElementFb,
  DucViewportStyle as DucViewportStyleFb,
  DucXRayElement as DucXRayElementFb,
  DucXRayStyle as DucXRayStyleFb,
  DocumentGridConfig as DocumentGridConfigFb,
  ElementBackground as ElementBackgroundFb,
  ElementContentBase as ElementContentBaseFb,
  ElementStroke as ElementStrokeFb,
  Element as ElementUnion,
  ElementWrapper,
  ExportedDataState,
  ExportedDataState as ExportedDataStateFb,
  GeometricPoint as GeometricPointFb,
  GridSettings as GridSettingsFb,
  HatchPatternLine as HatchPatternLineFb,
  LEADER_CONTENT_TYPE as LEADER_CONTENT_TYPE_ENUM,
  LeaderBlockContent as LeaderBlockContentFb,
  LeaderTextBlockContent as LeaderTextBlockContentFb,
  Margins as MarginsFb,
  PrimaryUnits as PrimaryUnitsFb,
  SnapSettings as SnapSettingsFb,
  Standard as StandardFb,
  StrokeSides as StrokeSidesFb,
  StrokeStyle as StrokeStyleFb,
  TEXT_FIELD_SOURCE_TYPE,
  TilingProperties as TilingPropertiesFb,
  VersionGraph as VersionGraphFb,
  _DucElementBase as _DucElementBaseFb,
  _DucElementStylesBase as _DucElementStylesBaseFb,
  _DucLinearElementBase as _DucLinearElementBaseFb,
  _DucStackBase as _DucStackBaseFb,
  _DucStackElementBase as _DucStackElementBaseFb
} from "./flatbuffers/duc";
import { RestoreConfig, RestoredDataState, restore } from "./restore";
import {
  AngularUnitsFormat,
  DimensionUnitsFormat,
  Standard,
  StandardUnits,
  _UnitSystemBase
} from "./technical";
import {
  BlockLocalizationMap,
  CustomHatchPattern,
  DatumReference,
  Dictionary,
  DocumentGridConfig,
  DucArrowElement,
  DucBlock,
  DucBlockAttributeDefinition,
  DucBlockCollection,
  DucBlockInstance,
  DucBlockMetadata,
  DucCommonStyle,
  DucDimensionElement,
  DucDimensionStyle,
  DucDocElement,
  DucDocStyle,
  DucElement,
  DucEllipseElement,
  DucEmbeddableElement,
  DucExternalFiles,
  DucFeatureControlFrameElement,
  DucFeatureControlFrameStyle,
  DucFrameElement,
  DucFreeDrawElement,
  DucGlobalState,
  DucGroup,
  DucHatchStyle,
  DucHead,
  DucImageElement,
  DucImageFilter,
  DucLayer,
  DucLeaderElement,
  DucLeaderStyle,
  DucLine,
  DucLineReference,
  DucLinearElement,
  DucLocalState,
  DucMermaidElement,
  DucModelElement,
  DucPath,
  DucPdfElement,
  DucPlotElement,
  DucPlotStyle,
  DucPoint,
  DucPointBinding,
  DucPolygonElement,
  DucRectangleElement,
  DucRegion,
  DucStackLikeStyles,
  DucTableCell,
  DucTableCellStyle,
  DucTableColumn,
  DucTableElement,
  DucTableRow,
  DucTableStyle,
  DucTextDynamicPart,
  DucTextDynamicSource,
  DucTextElement,
  DucTextStyle,
  DucUcs,
  DucView,
  DucViewportElement,
  DucViewportStyle,
  DucXRayElement,
  DucXRayStyle,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  ExternalFileId,
  FeatureControlFrameSegment,
  FractionalIndex,
  GeometricPoint,
  GridSettings,
  HatchPatternLine,
  JSONPatch,
  LeaderContent,
  LineHead,
  NormalizedZoomValue,
  ObjectSnapMode,
  OrderedDucElement,
  Percentage,
  PlotLayout,
  PrecisionValue,
  Radian,
  RawValue,
  ScaleFactor,
  Scope,
  ScopedValue,
  SnapMarkerStyle,
  SnapSettings,
  StrokeSides,
  StrokeStyle,
  TilingProperties,
  VersionGraph,
  ViewportScale,
  Zoom,
  _DucElementBase,
  _DucElementStylesBase,
  _DucLinearElementBase,
  _DucStackBase,
  _DucStackElementBase
} from "./types";


// #region HELPERS & LOW-LEVEL CASTS
// Helper functions for type casting
const toPrecisionValue = (value: number): PrecisionValue => ({
  value: value as RawValue,
  scoped: value as ScopedValue,
});

const toRadian = (value: number): Radian => value as Radian;
const toPercentage = (value: number): Percentage => value as Percentage;
const toScaleFactor = (value: number): ScaleFactor => value as ScaleFactor;
const toZoom = (value: number): Zoom => ({
  value: value as NormalizedZoomValue
} as Zoom);
// #endregion

// Helper function to parse binary JSON data (Uint8Array) to object
// The data is zlib-compressed JSON (new format) or plain JSON string (legacy format)
function parseBinaryToJson(binaryData: Uint8Array | null): Record<string, any> | undefined {
  if (!binaryData || binaryData.length === 0) return undefined;

  // Try new format: zlib-compressed binary JSON
  try {
    const decompressed = decompressSync(binaryData);
    const text = strFromU8(decompressed);
    return JSON.parse(text);
  } catch (e) {
    // Fall back to legacy format: plain JSON string (for old file compatibility)
    try {
      const text = new TextDecoder().decode(binaryData);
      return JSON.parse(text);
    } catch (e2) {
      console.warn('Failed to parse binary JSON (tried both compressed and legacy formats):', e2);
      return undefined;
    }
  }
}

// #region GEOMETRY & UTILITY PARSERS
export function parseGeometricPoint(point: GeometricPointFb): GeometricPoint {
  return {
    x: point.x(),
    y: point.y(),
  };
}

export function parsePoint(point: DucPointFb): DucPoint {
  return {
    x: toPrecisionValue(point.x()),
    y: toPrecisionValue(point.y()),
    mirroring: point.mirroring() || undefined,
  };
}

export function parseMargins(margins: MarginsFb): PlotLayout["margins"] {
  return {
    top: toPrecisionValue(margins.top()),
    right: toPrecisionValue(margins.right()),
    bottom: toPrecisionValue(margins.bottom()),
    left: toPrecisionValue(margins.left()),
  };
}

export function parseDocumentGridConfig(gridConfig: DocumentGridConfigFb): DocumentGridConfig {
  return {
    columns: gridConfig.columns(),
    gapX: gridConfig.gapX(),
    gapY: gridConfig.gapY(),
    alignItems: (() => {
      const align = gridConfig.alignItems();
      if (align === DOCUMENT_GRID_ALIGN_ITEMS.START) return 'start';
      if (align === DOCUMENT_GRID_ALIGN_ITEMS.CENTER) return 'center';
      if (align === DOCUMENT_GRID_ALIGN_ITEMS.END) return 'end';
      return 'start';
    })(),
    firstPageAlone: gridConfig.firstPageAlone(),
  };
}

export function parseHead(head: DucHeadFb): DucHead {
  return {
    type: head.type()!,
    blockId: head.blockId(),
    size: toPrecisionValue(head.size()),
  };
}
// #endregion


// #region STYLE PARSERS (LOW-LEVEL)
export function parseHatchPatternLine(line: HatchPatternLineFb): HatchPatternLine {
  return {
    angle: toRadian(line.angle()),
    origin: parsePoint(line.origin()!),
    offset: [toPrecisionValue(line.offset(0)!), toPrecisionValue(line.offset(1)!)],
    dashPattern: Array.from(line.dashPatternArray() || []).map(toPrecisionValue),
  };
}

export function parseCustomHatchPattern(pattern: CustomHatchPatternFb): CustomHatchPattern {
  return {
    name: pattern.name()!,
    description: pattern.description() || undefined,
    lines: Array.from({ length: pattern.linesLength() }, (_, i) => parseHatchPatternLine(pattern.lines(i)!)),
  };
}

export function parseHatchStyle(hatch: DucHatchStyleFb): DucHatchStyle {
  return {
    hatchStyle: hatch.hatchStyle()!,
    pattern: {
      name: hatch.patternName()!,
      scale: hatch.patternScale(),
      angle: toRadian(hatch.patternAngle()),
      origin: parsePoint(hatch.patternOrigin()!),
      double: hatch.patternDouble(),
    },
    customPattern: hatch.customPattern() ? parseCustomHatchPattern(hatch.customPattern()!) : undefined,
  };
}

export function parseTilingProperties(tiling: TilingPropertiesFb): TilingProperties {
  return {
    sizeInPercent: toPercentage(tiling.sizeInPercent()),
    angle: toRadian(tiling.angle()),
    spacing: tiling.spacing() ?? undefined,
    offsetX: tiling.offsetX() ?? undefined,
    offsetY: tiling.offsetY() ?? undefined,
  };
}

export function parseImageFilter(filter: DucImageFilterFb): DucImageFilter {
  return {
    brightness: toPercentage(filter.brightness()),
    contrast: toPercentage(filter.contrast()),
  };
}

export function parseElementContentBase(content: ElementContentBaseFb): ElementContentBase {
  return {
    preference: (content.preference() ?? undefined)!,
    src: content.src()!,
    visible: content.visible(),
    opacity: toPercentage(content.opacity()),
    tiling: content.tiling() ? parseTilingProperties(content.tiling()!) : undefined,
    hatch: content.hatch() ? parseHatchStyle(content.hatch()!) : undefined,
    imageFilter: content.imageFilter() ? parseImageFilter(content.imageFilter()!) : undefined,
  };
}

export function parseStrokeStyle(style: StrokeStyleFb): StrokeStyle {
  return {
    preference: (style.preference() ?? undefined)!,
    cap: style.cap() || undefined,
    join: style.join() || undefined,
    dash: Array.from(style.dashArray() || []),
    dashLineOverride: style.dashLineOverride() || undefined,
    dashCap: style.dashCap() || undefined,
    miterLimit: style.miterLimit() ?? undefined,
  };
}

export function parseStrokeSides(sides: StrokeSidesFb): StrokeSides {
  return {
    preference: (sides.preference() ?? undefined)!,
    values: Array.from(sides.valuesArray() || []),
  };
}

export function parseElementStroke(stroke: ElementStrokeFb): ElementStroke {
  return {
    content: parseElementContentBase(stroke.content()!),
    width: toPrecisionValue(stroke.width()),
    style: parseStrokeStyle(stroke.style()!),
    placement: (stroke.placement() ?? undefined)!,
    strokeSides: stroke.strokeSides() ? parseStrokeSides(stroke.strokeSides()!) : undefined,
  };
}

export function parseElementBackground(background: ElementBackgroundFb): ElementBackground {
  return {
    content: parseElementContentBase(background.content()!),
  };
}

export function parseElementStylesBase(styles: _DucElementStylesBaseFb): _DucElementStylesBase {
  return {
    roundness: toPrecisionValue(styles.roundness()),
    blending: styles.blending() || undefined,
    background: Array.from({ length: styles.backgroundLength() }, (_, i) => parseElementBackground(styles.background(i)!)),
    stroke: Array.from({ length: styles.strokeLength() }, (_, i) => parseElementStroke(styles.stroke(i)!)),
    opacity: toPercentage(styles.opacity()),
  };
}
// #endregion



// #region BASE ELEMENT PARSERS

export function parseElementBase(base: _DucElementBaseFb): _DucElementBase {
  const styles = base.styles();
  const parsedStyles = styles ? parseElementStylesBase(styles) : {
    roundness: toPrecisionValue(0),
    blending: undefined,
    background: [],
    stroke: [],
    opacity: toPercentage(1),
  };

  return {
    id: base.id()!,
    x: toPrecisionValue(base.x()),
    y: toPrecisionValue(base.y()),
    width: toPrecisionValue(base.width()),
    height: toPrecisionValue(base.height()),
    angle: toRadian(base.angle()),
    scope: base.scope()! as Scope,
    label: base.label()!,
    description: base.description(),
    isVisible: base.isVisible(),
    seed: base.seed(),
    version: base.version(),
    versionNonce: base.versionNonce(),
    updated: Number(base.updated()),
    index: base.index() as FractionalIndex | null,
    isPlot: base.isPlot(),
    isAnnotative: base.isAnnotative(),
    isDeleted: base.isDeleted(),
    groupIds: Array.from({ length: base.groupIdsLength() }, (_, i) => base.groupIds(i)!),
    regionIds: Array.from({ length: base.regionIdsLength() }, (_, i) => base.regionIds(i)!),
    blockIds: Array.from({ length: base.blockIdsLength() }, (_, i) => base.blockIds(i)!),
    instanceId: base.instanceId(),
    layerId: base.layerId(),
    frameId: base.frameId(),
    boundElements: base.boundElementsLength() > 0 ? Array.from({ length: base.boundElementsLength() }, (_, i) => ({
      id: base.boundElements(i)!.id()!,
      type: base.boundElements(i)!.type()! as DucElement["type"],
    })) : null,
    zIndex: base.zIndex(),
    link: base.link(),
    locked: base.locked(),
    customData: parseBinaryToJson(base.customDataArray()),
    ...parsedStyles,
  } as _DucElementBase;
}

export function parseLineReference(ref: DucLineReferenceFb): DucLineReference {
  return {
    index: ref.index(),
    handle: ref.handle() ? { x: toPrecisionValue(ref.handle()!.x()), y: toPrecisionValue(ref.handle()!.y()) } : null,
  };
}

export function parseLine(line: DucLineFb): DucLine {
  return [
    parseLineReference(line.start()!),
    parseLineReference(line.end()!),
  ];
}

export function parsePath(path: DucPathFb): DucPath {
  return {
    lineIndices: Array.from(path.lineIndicesArray() || []),
    background: path.background() ? parseElementBackground(path.background()!) : null,
    stroke: path.stroke() ? parseElementStroke(path.stroke()!) : null,
  };
}

export function parsePointBinding(binding: DucPointBindingFb): DucPointBinding {
  const pointBindingPoint = binding.point();
  return {
    elementId: binding.elementId()!,
    focus: binding.focus(),
    gap: toPrecisionValue(binding.gap()),
    fixedPoint: binding.fixedPoint() ? parseGeometricPoint(binding.fixedPoint()!) : null,
    point: pointBindingPoint ? {
      index: pointBindingPoint.index(),
      offset: pointBindingPoint.offset(),
    } : null,
    head: binding.head() ? parseHead(binding.head()!) : null,
  };
}

export function parseLinearElementBase(base: _DucLinearElementBaseFb): _DucLinearElementBase {
  return {
    ...parseElementBase(base.base()!),
    points: Array.from({ length: base.pointsLength() }, (_, i) => parsePoint(base.points(i)!)),
    lines: Array.from({ length: base.linesLength() }, (_, i) => parseLine(base.lines(i)!)),
    pathOverrides: Array.from({ length: base.pathOverridesLength() }, (_, i) => parsePath(base.pathOverrides(i)!)),
    lastCommittedPoint: base.lastCommittedPoint() ? parsePoint(base.lastCommittedPoint()!) : null,
    startBinding: base.startBinding() ? parsePointBinding(base.startBinding()!) : null,
    endBinding: base.endBinding() ? parsePointBinding(base.endBinding()!) : null,
  };
}

export function parseStackLikeStyles(styles: DucStackLikeStylesFb): DucStackLikeStyles {
  return {
    opacity: toPercentage(styles.opacity()),
    labelingColor: styles.labelingColor()!,
  };
}

export function parseStackBase(base: _DucStackBaseFb): _DucStackBase {
  return {
    label: base.label()!,
    description: base.description(),
    isCollapsed: base.isCollapsed(),
    isPlot: base.isPlot(),
    isVisible: base.isVisible(),
    locked: base.locked(),
    ...parseStackLikeStyles(base.styles()!),
  };
}

export function parseStackElementBase(base: _DucStackElementBaseFb): _DucStackElementBase {
  return {
    ...parseElementBase(base.base()!),
    ...parseStackBase(base.stackBase()!),
    clip: base.clip(),
    labelVisible: base.labelVisible(),
    standardOverride: base.standardOverride(),
  };
}
// #endregion

// #region ELEMENT-SPECIFIC PARSERS

function parseRectangleElement(element: DucRectangleElementFb): DucRectangleElement {
  return {
    type: "rectangle",
    ...parseElementBase(element.base()!),
  };
}

function parsePolygonElement(element: DucPolygonElementFb): DucPolygonElement {
  return {
    type: "polygon",
    ...parseElementBase(element.base()!),
    sides: element.sides(),
  };
}

function parseEllipseElement(element: DucEllipseElementFb): DucEllipseElement {
  return {
    type: "ellipse",
    ...parseElementBase(element.base()!),
    ratio: toPercentage(element.ratio()),
    startAngle: toRadian(element.startAngle()),
    endAngle: toRadian(element.endAngle()),
    showAuxCrosshair: element.showAuxCrosshair(),
  };
}

function parseEmbeddableElement(element: DucEmbeddableElementFb): DucEmbeddableElement {
  return {
    type: "embeddable",
    ...parseElementBase(element.base()!),
  };
}

function parsePdfElement(element: DucPdfElementFb): DucPdfElement {
  const gridConfig = element.gridConfig();
  return {
    type: "pdf",
    ...parseElementBase(element.base()!),
    fileId: element.fileId() as ExternalFileId | null,
    gridConfig: gridConfig ? parseDocumentGridConfig(gridConfig) : {
      columns: 1,
      gapX: 0,
      gapY: 0,
      alignItems: 'start',
      firstPageAlone: false,
    },
  };
}

function parseMermaidElement(element: DucMermaidElementFb): DucMermaidElement {
  return {
    type: "mermaid",
    ...parseElementBase(element.base()!),
    source: element.source()!,
    theme: element.theme() || undefined,
    svgPath: element.svgPath(),
  };
}

function parseTableElement(element: DucTableElementFb): DucTableElement {
  const style = element.style()!;
  const columns: Record<string, DucTableColumn> = {};
  for (let i = 0; i < element.columnsLength(); i++) {
    const entry = element.columns(i)!;
    const col = entry.value()!;
    columns[entry.key()!] = {
      id: col.id()!,
      width: toPrecisionValue(col.width()),
      styleOverrides: col.styleOverrides() ? parseTableCellStyle(col.styleOverrides()!) : undefined,
    };
  }
  const rows: Record<string, DucTableRow> = {};
  for (let i = 0; i < element.rowsLength(); i++) {
    const entry = element.rows(i)!;
    const row = entry.value()!;
    rows[entry.key()!] = {
      id: row.id()!,
      height: toPrecisionValue(row.height()),
      styleOverrides: row.styleOverrides() ? parseTableCellStyle(row.styleOverrides()!) : undefined,
    };
  }
  const cells: Record<string, DucTableCell> = {};
  for (let i = 0; i < element.cellsLength(); i++) {
    const entry = element.cells(i)!;
    const cell = entry.value()!;
    const span = cell.span();
    cells[entry.key()!] = {
      rowId: cell.rowId()!,
      columnId: cell.columnId()!,
      data: cell.data()!,
      span: span ? { columns: span.columns(), rows: span.rows() } : undefined,
      locked: cell.locked(),
      styleOverrides: cell.styleOverrides() ? parseTableCellStyle(cell.styleOverrides()!) : undefined,
    };
  }

  return {
    type: "table",
    ...parseElementBase(element.base()!),
    ...parseTableStyle(style),
    columnOrder: Array.from({ length: element.columnOrderLength() }, (_, i) => element.columnOrder(i)!),
    rowOrder: Array.from({ length: element.rowOrderLength() }, (_, i) => element.rowOrder(i)!),
    columns,
    rows,
    cells,
    headerRowCount: element.headerRowCount(),
    autoSize: {
      columns: element.autoSize()!.columns(),
      rows: element.autoSize()!.rows(),
    },
  };
}

function parseImageElement(element: DucImageElementFb): DucImageElement {
  const crop = element.crop();
  const filter = element.filter();
  return {
    type: "image",
    ...parseElementBase(element.base()!),
    fileId: element.fileId() as ExternalFileId | null,
    status: element.status()!,
    scaleFlip: [element.scale(0)!, element.scale(1)!],
    crop: crop ? {
      x: crop.x(),
      y: crop.y(),
      width: crop.width(),
      height: crop.height(),
      naturalWidth: crop.naturalWidth(),
      naturalHeight: crop.naturalHeight(),
    } : null,
    filter: filter ? parseImageFilter(filter) : null,
  };
}

function parseTextElement(element: DucTextElementFb): DucTextElement {
  const dynamicParts: DucTextDynamicPart[] = [];
  for (let i = 0; i < element.dynamicLength(); i++) {
    const partFb = element.dynamic(i)!;
    const sourceFb = partFb.source()!;
    let source: DucTextDynamicSource;
    if (sourceFb.textSourceType() === TEXT_FIELD_SOURCE_TYPE.ELEMENT) {
      const elementSource = sourceFb.source(new DucTextDynamicElementSourceFb())!;
      source = {
        sourceType: TEXT_FIELD_SOURCE_TYPE.ELEMENT,
        elementId: elementSource.elementId()!,
        property: elementSource.property(),
      };
    } else {
      const dictSource = sourceFb.source(new DucTextDynamicDictionarySourceFb())!;
      source = {
        sourceType: TEXT_FIELD_SOURCE_TYPE.DICTIONARY,
        key: dictSource.key()!,
      };
    }
    dynamicParts.push({
      tag: partFb.tag()!,
      source,
      formatting: partFb.formatting() ? parsePrimaryUnits(partFb.formatting()!) : undefined,
      cachedValue: partFb.cachedValue()!,
    });
  }

  return {
    type: "text",
    ...parseElementBase(element.base()!),
    ...parseTextStyle(element.style()!),
    text: element.text()!,
    dynamic: dynamicParts,
    autoResize: element.autoResize(),
    containerId: element.containerId(),
    originalText: element.originalText()!,
  };
}

function parseLinearElement(element: DucLinearElementFb): DucLinearElement {
  return {
    type: "line",
    ...parseLinearElementBase(element.linearBase()!),
    wipeoutBelow: element.wipeoutBelow(),
  };
}

function parseArrowElement(element: DucArrowElementFb): DucArrowElement {
  return {
    type: "arrow",
    ...parseLinearElementBase(element.linearBase()!),
    elbowed: element.elbowed(),
  };
}

function parseFreeDrawElement(element: DucFreeDrawElementFb): DucFreeDrawElement {
  const start = element.start();
  const end = element.end();
  return {
    type: "freedraw",
    ...parseElementBase(element.base()!),
    points: Array.from({ length: element.pointsLength() }, (_, i) => parsePoint(element.points(i)!)),
    size: toPrecisionValue(element.size()),
    thinning: toPercentage(element.thinning()),
    smoothing: toPercentage(element.smoothing()),
    streamline: toPercentage(element.streamline()),
    easing: element.easing()! as any,
    start: start ? { cap: start.cap() as any, taper: start.taper() as any, easing: start.easing()! as any } : null,
    end: end ? { cap: end.cap(), taper: end.taper(), easing: end.easing()! as any } : null,
    pressures: Array.from(element.pressuresArray() || []),
    simulatePressure: element.simulatePressure(),
    lastCommittedPoint: element.lastCommittedPoint() ? parsePoint(element.lastCommittedPoint()!) : null,
    svgPath: element.svgPath(),
  };
}

function parseBlockInstance(instance: DucBlockInstanceFb): DucBlockInstance {
  const duplicationArray = instance.duplicationArray();
  const attributeValues: Record<string, string> = {};
  for (let i = 0; i < instance.attributeValuesLength(); i++) {
    const entry = instance.attributeValues(i)!;
    attributeValues[entry.key()!] = entry.value()!;
  }
  const elementOverrides: Record<string, string> = {};
  for (let i = 0; i < instance.elementOverridesLength(); i++) {
    const entry = instance.elementOverrides(i)!;
    elementOverrides[entry.key()!] = entry.value()!;
  }

  return {
    id: instance.id()!,
    blockId: instance.blockId()!,
    version: instance.version(),
    attributeValues: attributeValues,
    elementOverrides: elementOverrides,
    duplicationArray: duplicationArray ? {
      rows: duplicationArray.rows(),
      cols: duplicationArray.cols(),
      rowSpacing: toPrecisionValue(duplicationArray.rowSpacing()),
      colSpacing: toPrecisionValue(duplicationArray.colSpacing()),
    } : null,
  };
}

// Helper function to parse block metadata from FlatBuffers
function parseBlockMetadata(metadataFb: DucBlockMetadataFb | null): DucBlockMetadata | undefined {
  if (!metadataFb) return undefined;

  // localization is now binary JSON data (Uint8Array)
  const localization = parseBinaryToJson(metadataFb.localizationArray()) as BlockLocalizationMap | undefined;

  const rawSource = metadataFb.source();
  const source = typeof rawSource === "string" && rawSource.trim().length
    ? rawSource.trim()
    : undefined;

  return {
    ...(source ? { source } : {}),
    usageCount: metadataFb.usageCount(),
    createdAt: Number(metadataFb.createdAt()),
    updatedAt: Number(metadataFb.updatedAt()),
    localization,
  };
}

function parseBlockCollection(collection: DucBlockCollectionFb): DucBlockCollection {
  const children = Array.from({ length: collection.childrenLength() }, (_, i) => {
    const child = collection.children(i)!;
    return {
      id: child.id()!,
      isCollection: child.isCollection(),
    };
  });

  const metadata = parseBlockMetadata(collection.metadata());

  return {
    id: collection.id()!,
    label: collection.label()!,
    children,
    metadata,
    thumbnail: collection.thumbnailArray() || undefined,
  };
}

function parseFrameElement(element: DucFrameElementFb): DucFrameElement {
  return {
    type: "frame",
    ...parseStackElementBase(element.stackElementBase()!),
  };
}

function parsePlotElement(element: DucPlotElementFb): DucPlotElement {
  const layout = element.layout()!;
  return {
    type: "plot",
    ...parseStackElementBase(element.stackElementBase()!),
    ...parsePlotStyle(element.style()!),
    layout: {
      margins: parseMargins(layout.margins()!),
    },
  };
}

function parseViewportElement(element: DucViewportElementFb): DucViewportElement {
  return {
    type: "viewport",
    ...parseLinearElementBase(element.linearBase()!),
    ...parseStackBase(element.stackBase()!),
    ...parseViewportStyle(element.style()!),
    view: parseView(element.view()!),
    scale: element.scale() as ViewportScale,
    shadePlot: element.shadePlot()!,
    frozenGroupIds: Array.from({ length: element.frozenGroupIdsLength() }, (_, i) => element.frozenGroupIds(i)!),
    standardOverride: element.standardOverride(),
  };
}

function parseXRayElement(element: DucXRayElementFb): DucXRayElement {
  return {
    type: "xray",
    ...parseElementBase(element.base()!),
    ...parseXRayStyle(element.style()!),
    origin: parsePoint(element.origin()!),
    direction: parsePoint(element.direction()!),
    startFromOrigin: element.startFromOrigin(),
  };
}

function parseLeaderElement(element: DucLeaderElementFb): DucLeaderElement {
  const contentFb = element.content();
  let leaderContent: LeaderContent | null = null;
  if (contentFb) {
    const contentType = contentFb.leaderContentType();
    if (contentType === LEADER_CONTENT_TYPE_ENUM.TEXT) {
      const textContent = contentFb.content(new LeaderTextBlockContentFb())!;
      leaderContent = {
        type: "text",
        text: textContent.text()!,
      };
    } else if (contentType === LEADER_CONTENT_TYPE_ENUM.BLOCK) {
      const blockContent = contentFb.content(new LeaderBlockContentFb())!;
      const attributeValues: Record<string, string> = {};
      for (let i = 0; i < blockContent.attributeValuesLength(); i++) {
        const entry = blockContent.attributeValues(i)!;
        attributeValues[entry.key()!] = entry.value()!;
      }
      const elementOverrides: Record<string, string> = {};
      for (let i = 0; i < blockContent.elementOverridesLength(); i++) {
        const entry = blockContent.elementOverrides(i)!;
        elementOverrides[entry.key()!] = entry.value()!;
      }
      leaderContent = {
        type: "block",
        blockId: blockContent.blockId()!,
        instanceData: {
          attributeValues,
          elementOverrides,
        },
      };
    }
  }

  return {
    type: "leader",
    ...parseLinearElementBase(element.linearBase()!),
    ...parseLeaderStyle(element.style()!),
    leaderContent,
    contentAnchor: parseGeometricPoint(element.contentAnchor()!),
  };
}

function parseDimensionElement(element: DucDimensionElementFb): DucDimensionElement {
  const defPoints = element.definitionPoints()!;
  const bindings = element.bindings();
  const toleranceOverride = element.toleranceOverride();
  return {
    type: "dimension",
    ...parseElementBase(element.base()!),
    ...parseDimensionStyle(element.style()!),
    dimensionType: element.dimensionType()!,
    definitionPoints: {
      origin1: parseGeometricPoint(defPoints.origin1()!),
      origin2: defPoints.origin2() ? parseGeometricPoint(defPoints.origin2()!) : undefined,
      location: parseGeometricPoint(defPoints.location()!),
      center: defPoints.center() ? parseGeometricPoint(defPoints.center()!) : undefined,
      jog: defPoints.jog() ? parseGeometricPoint(defPoints.jog()!) : undefined,
    },
    obliqueAngle: toRadian(element.obliqueAngle()),
    ordinateAxis: element.ordinateAxis() || null,
    bindings: bindings ? {
      origin1: bindings.origin1() ? parsePointBinding(bindings.origin1()!) : null,
      origin2: bindings.origin2() ? parsePointBinding(bindings.origin2()!) : null,
      center: bindings.center() ? parsePointBinding(bindings.center()!) : null,
    } : undefined,
    textOverride: element.textOverride(),
    textPosition: element.textPosition() ? parseGeometricPoint(element.textPosition()!) : null,
    toleranceOverride: toleranceOverride ? parseDimensionToleranceStyle(toleranceOverride) : undefined,
    baselineData: element.baselineData() ? { baseDimensionId: element.baselineData()!.baseDimensionId()! } : undefined,
    continueData: element.continueData() ? { continueFromDimensionId: element.continueData()!.continueFromDimensionId()! } : undefined,
    calculatedValue: toPrecisionValue(0), // This is a runtime value
  };
}

function parseFeatureControlFrameElement(element: DucFeatureControlFrameElementFb): DucFeatureControlFrameElement {
  const frameModifiers = element.frameModifiers();
  const datumDef = element.datumDefinition();
  return {
    type: "featurecontrolframe",
    ...parseElementBase(element.base()!),
    ...parseFeatureControlFrameStyle(element.style()!),
    rows: Array.from({ length: element.rowsLength() }, (_, i) => {
      const row = element.rows(i)!;
      return Array.from({ length: row.segmentsLength() }, (_, j) => {
        const seg = row.segments(j)!;
        const tol = seg.tolerance()!;
        return {
          symbol: seg.symbol()!,
          tolerance: {
            value: tol.value()!,
            zoneType: tol.zoneType() || undefined,
            featureModifiers: Array.from(tol.featureModifiersArray() || []),
            materialCondition: tol.materialCondition() || undefined,
          },
          datums: Array.from({ length: seg.datumsLength() }, (_, k) => {
            const datum = seg.datums(k)!;
            return {
              letters: datum.letters()!,
              modifier: datum.modifier() || undefined,
            };
          }) as [DatumReference?, DatumReference?, DatumReference?],
        };
      });
    }) as readonly (readonly FeatureControlFrameSegment[])[],
    frameModifiers: frameModifiers ? {
      allAround: frameModifiers.allAround(),
      allOver: frameModifiers.allOver(),
      continuousFeature: frameModifiers.continuousFeature(),
      between: frameModifiers.between() ? { start: frameModifiers.between()!.start()!, end: frameModifiers.between()!.end()! } : undefined,
      projectedToleranceZone: frameModifiers.projectedToleranceZone() ? toPrecisionValue(frameModifiers.projectedToleranceZone()!.value()) : undefined,
    } : undefined,
    leaderElementId: element.leaderElementId(),
    datumDefinition: datumDef ? {
      letter: datumDef.letter()!,
      featureBinding: datumDef.featureBinding() ? parsePointBinding(datumDef.featureBinding()!) : undefined,
    } : undefined,
  };
}

function parseDocElement(element: DucDocElementFb): DucDocElement {
  const dynamicParts: DucTextDynamicPart[] = [];
  for (let i = 0; i < element.dynamicLength(); i++) {
    const partFb = element.dynamic(i)!;
    const sourceFb = partFb.source()!;
    let source: DucTextDynamicSource;
    if (sourceFb.textSourceType() === TEXT_FIELD_SOURCE_TYPE.ELEMENT) {
      const elementSource = sourceFb.source(new DucTextDynamicElementSourceFb())!;
      source = {
        sourceType: TEXT_FIELD_SOURCE_TYPE.ELEMENT,
        elementId: elementSource.elementId()!,
        property: elementSource.property(),
      };
    } else {
      const dictSource = sourceFb.source(new DucTextDynamicDictionarySourceFb())!;
      source = {
        sourceType: TEXT_FIELD_SOURCE_TYPE.DICTIONARY,
        key: dictSource.key()!,
      };
    }
    dynamicParts.push({
      tag: partFb.tag()!,
      source,
      formatting: partFb.formatting() ? parsePrimaryUnits(partFb.formatting()!) : undefined,
      cachedValue: partFb.cachedValue()!,
    });
  }
  const columns = element.columns()!;
  const gridConfig = element.gridConfig();
  return {
    type: "doc",
    ...parseElementBase(element.base()!),
    ...parseDocStyle(element.style()!),
    text: element.text()!,
    dynamic: dynamicParts,
    flowDirection: element.flowDirection()!,
    columns: {
      type: columns.type()!,
      definitions: Array.from({ length: columns.definitionsLength() }, (_, i) => {
        const col = columns.definitions(i)!;
        return {
          width: toPrecisionValue(col.width()),
          gutter: toPrecisionValue(col.gutter()),
        };
      }),
      autoHeight: columns.autoHeight(),
    },
    autoResize: element.autoResize(),
    fileId: element.fileId() as ExternalFileId | null,
    gridConfig: gridConfig ? parseDocumentGridConfig(gridConfig) : {
      columns: 1,
      gapX: 0,
      gapY: 0,
      alignItems: 'start',
      firstPageAlone: false,
    },
  };
}

function parseModelElement(element: DucModelElementFb): DucModelElement {
  return {
    type: "model",
    ...parseElementBase(element.base()!),
    source: element.source()!,
    svgPath: element.svgPath(),
    fileIds: Array.from({ length: element.fileIdsLength() }, (_, i) => element.fileIds(i)!) as ExternalFileId[],
  };
}
// #endregion


// #region STYLE PARSERS (ELEMENT-LEVEL)

export function parseTextStyle(style: DucTextStyleFb): DucTextStyle {
  const lineSpacing = style.lineSpacing()!;
  return {
    isLtr: style.isLtr(),
    fontFamily: style.fontFamily()! as any, // For now will use as any because this will be a string in the future
    bigFontFamily: style.bigFontFamily()!,
    textAlign: style.textAlign()!,
    verticalAlign: style.verticalAlign()!,
    lineHeight: style.lineHeight() as DucTextStyle["lineHeight"],
    lineSpacing: {
      value: toPrecisionValue(lineSpacing.value()),
      type: lineSpacing.type()!,
    },
    obliqueAngle: toRadian(style.obliqueAngle()),
    fontSize: toPrecisionValue(style.fontSize()),
    paperTextHeight: toPrecisionValue(style.paperTextHeight()),
    widthFactor: toScaleFactor(style.widthFactor()),
    isUpsideDown: style.isUpsideDown(),
    isBackwards: style.isBackwards(),
  };
}

export function parseTableCellStyle(style: DucTableCellStyleFb): DucTableCellStyle {
  return {
    ...parseElementStylesBase(style.baseStyle()!),
    textStyle: parseTextStyle(style.textStyle()!),
    margins: parseMargins(style.margins()!),
    alignment: style.alignment()!,
  };
}

export function parseTableStyle(style: DucTableStyleFb): DucTableStyle {
  return {
    flowDirection: style.flowDirection()!,
    headerRowStyle: parseTableCellStyle(style.headerRowStyle()!),
    dataRowStyle: parseTableCellStyle(style.dataRowStyle()!),
    dataColumnStyle: parseTableCellStyle(style.dataColumnStyle()!),
  };
}

export function parsePlotStyle(style: DucPlotStyleFb): DucPlotStyle {
  return {};
}

export function parseViewportStyle(style: DucViewportStyleFb): DucViewportStyle {
  return {
    scaleIndicatorVisible: style.scaleIndicatorVisible(),
  };
}

export function parseXRayStyle(style: DucXRayStyleFb): DucXRayStyle {
  return {
    color: style.color()!,
  };
}

export function parseLeaderStyle(style: DucLeaderStyleFb): DucLeaderStyle {
  return {
    headsOverride: style.headsOverrideLength() > 0 ? [parseHead(style.headsOverride(0)!), parseHead(style.headsOverride(1)!)] : undefined,
    dogleg: style.dogleg() ? toPrecisionValue(style.dogleg()) : undefined,
    textStyle: parseTextStyle(style.textStyle()!),
    textAttachment: (style.textAttachment() ?? undefined)!,
    blockAttachment: (style.blockAttachment() ?? undefined)!,
  };
}

export function parseDimensionToleranceStyle(style: DimensionToleranceStyleFb): DucDimensionStyle["tolerance"] {
  return {
    enabled: style.enabled(),
    displayMethod: style.displayMethod()!,
    upperValue: style.upperValue(),
    lowerValue: style.lowerValue(),
    precision: style.precision(),
    textStyle: style.textStyle() ? parseTextStyle(style.textStyle()!) : {},
  };
}

export function parseDimensionStyle(style: DucDimensionStyleFb): DucDimensionStyle {
  const dimLine = style.dimLine()!;
  const extLine = style.extLine()!;
  const symbols = style.symbols()!;
  const centerMark = symbols.centerMarkType() ? { type: symbols.centerMarkType()!, size: toPrecisionValue(symbols.centerMarkSize()) } : undefined;
  const fit = style.fit()!;
  return {
    dimLine: {
      stroke: parseElementStroke(dimLine.stroke()!),
      textGap: toPrecisionValue(dimLine.textGap()),
    },
    extLine: {
      stroke: parseElementStroke(extLine.stroke()!),
      overshoot: toPrecisionValue(extLine.overshoot()),
      offset: toPrecisionValue(extLine.offset()),
    },
    textStyle: parseTextStyle(style.textStyle()!),
    symbols: {
      headsOverride: symbols.headsOverrideLength() > 0 ? [parseHead(symbols.headsOverride(0)!), parseHead(symbols.headsOverride(1)!)] : undefined,
      centerMark: centerMark!,
    },
    tolerance: parseDimensionToleranceStyle(style.tolerance()!),
    fit: {
      rule: fit.rule()!,
      textPlacement: fit.textPlacement()!,
      forceTextInside: fit.forceTextInside(),
    },
  };
}

export function parseFeatureControlFrameStyle(style: DucFeatureControlFrameStyleFb): DucFeatureControlFrameStyle {
  const layout = style.layout()!;
  return {
    textStyle: parseTextStyle(style.textStyle()!),
    layout: {
      padding: toPrecisionValue(layout.padding()),
      segmentSpacing: toPrecisionValue(layout.segmentSpacing()),
      rowSpacing: toPrecisionValue(layout.rowSpacing()),
    },
    symbols: {
      scale: style.symbols()!.scale(),
    },
    datumStyle: {
      bracketStyle: style.datumStyle()!.bracketStyle()!,
    },
  };
}

export function parseDocStyle(style: DucDocStyleFb): DucDocStyle {
  const paragraph = style.paragraph()!;
  const stackFormat = style.stackFormat()!;
  const stackProps = stackFormat.properties()!;
  return {
    ...parseTextStyle(style.textStyle()!),
    paragraph: {
      firstLineIndent: toPrecisionValue(paragraph.firstLineIndent()),
      hangingIndent: toPrecisionValue(paragraph.hangingIndent()),
      leftIndent: toPrecisionValue(paragraph.leftIndent()),
      rightIndent: toPrecisionValue(paragraph.rightIndent()),
      spaceBefore: toPrecisionValue(paragraph.spaceBefore()),
      spaceAfter: toPrecisionValue(paragraph.spaceAfter()),
      tabStops: Array.from({ length: paragraph.tabStopsLength() }, (_, i) => toPrecisionValue(paragraph.tabStops(i)!)),
    },
    stackFormat: {
      autoStack: stackFormat.autoStack(),
      stackChars: Array.from({ length: stackFormat.stackCharsLength() }, (_, i) => stackFormat.stackChars(i)!),
      properties: {
        upperScale: stackProps.upperScale(),
        lowerScale: stackProps.lowerScale(),
        alignment: stackProps.alignment()!,
      },
    },
  };
}
// #endregion


// #region MAIN ELEMENT PARSER

export function parseElementFromBinary(wrapper: ElementWrapper): DucElement | null {
  const elementType = wrapper.elementType();

  // Skip if no type is set
  if (elementType === ElementUnion.NONE || elementType == null) {
    return null;
  }

  // Request the union only after type is known. Some flatc runtimes return null when the field is absent,
  // which previously led to __union being called with invalid state in downstream code.
  let element: any = null;
  switch (elementType) {
    case ElementUnion.DucRectangleElement:
      element = wrapper.element(new DucRectangleElementFb());
      break;
    case ElementUnion.DucPolygonElement:
      element = wrapper.element(new DucPolygonElementFb());
      break;
    case ElementUnion.DucEllipseElement:
      element = wrapper.element(new DucEllipseElementFb());
      break;
    case ElementUnion.DucEmbeddableElement:
      element = wrapper.element(new DucEmbeddableElementFb());
      break;
    case ElementUnion.DucPdfElement:
      element = wrapper.element(new DucPdfElementFb());
      break;
    case ElementUnion.DucMermaidElement:
      element = wrapper.element(new DucMermaidElementFb());
      break;
    case ElementUnion.DucTableElement:
      element = wrapper.element(new DucTableElementFb());
      break;
    case ElementUnion.DucImageElement:
      element = wrapper.element(new DucImageElementFb());
      break;
    case ElementUnion.DucTextElement:
      element = wrapper.element(new DucTextElementFb());
      break;
    case ElementUnion.DucLinearElement:
      element = wrapper.element(new DucLinearElementFb());
      break;
    case ElementUnion.DucArrowElement:
      element = wrapper.element(new DucArrowElementFb());
      break;
    case ElementUnion.DucFreeDrawElement:
      element = wrapper.element(new DucFreeDrawElementFb());
      break;
    case ElementUnion.DucFrameElement:
      element = wrapper.element(new DucFrameElementFb());
      break;
    case ElementUnion.DucPlotElement:
      element = wrapper.element(new DucPlotElementFb());
      break;
    case ElementUnion.DucViewportElement:
      element = wrapper.element(new DucViewportElementFb());
      break;
    case ElementUnion.DucXRayElement:
      element = wrapper.element(new DucXRayElementFb());
      break;
    case ElementUnion.DucLeaderElement:
      element = wrapper.element(new DucLeaderElementFb());
      break;
    case ElementUnion.DucDimensionElement:
      element = wrapper.element(new DucDimensionElementFb());
      break;
    case ElementUnion.DucFeatureControlFrameElement:
      element = wrapper.element(new DucFeatureControlFrameElementFb());
      break;
    case ElementUnion.DucDocElement:
      element = wrapper.element(new DucDocElementFb());
      break;
    case ElementUnion.DucModelElement:
      element = wrapper.element(new DucModelElementFb());
      break;
    default:
      return null;
  }

  if (!element) {
    // Gracefully skip malformed/missing element entries
    return null;
  }

  switch (elementType) {
    case ElementUnion.DucRectangleElement:
      return parseRectangleElement(element as DucRectangleElementFb);
    case ElementUnion.DucPolygonElement:
      return parsePolygonElement(element as DucPolygonElementFb);
    case ElementUnion.DucEllipseElement:
      return parseEllipseElement(element as DucEllipseElementFb);
    case ElementUnion.DucEmbeddableElement:
      return parseEmbeddableElement(element as DucEmbeddableElementFb);
    case ElementUnion.DucPdfElement:
      return parsePdfElement(element as DucPdfElementFb);
    case ElementUnion.DucMermaidElement:
      return parseMermaidElement(element as DucMermaidElementFb);
    case ElementUnion.DucTableElement:
      return parseTableElement(element as DucTableElementFb);
    case ElementUnion.DucImageElement:
      return parseImageElement(element as DucImageElementFb);
    case ElementUnion.DucTextElement:
      return parseTextElement(element as DucTextElementFb);
    case ElementUnion.DucLinearElement:
      return parseLinearElement(element as DucLinearElementFb);
    case ElementUnion.DucArrowElement:
      return parseArrowElement(element as DucArrowElementFb);
    case ElementUnion.DucFreeDrawElement:
      return parseFreeDrawElement(element as DucFreeDrawElementFb);
    case ElementUnion.DucFrameElement:
      return parseFrameElement(element as DucFrameElementFb);
    case ElementUnion.DucPlotElement:
      return parsePlotElement(element as DucPlotElementFb);
    case ElementUnion.DucViewportElement:
      return parseViewportElement(element as DucViewportElementFb);
    case ElementUnion.DucXRayElement:
      return parseXRayElement(element as DucXRayElementFb);
    case ElementUnion.DucLeaderElement:
      return parseLeaderElement(element as DucLeaderElementFb);
    case ElementUnion.DucDimensionElement:
      return parseDimensionElement(element as DucDimensionElementFb);
    case ElementUnion.DucFeatureControlFrameElement:
      return parseFeatureControlFrameElement(element as DucFeatureControlFrameElementFb);
    case ElementUnion.DucDocElement:
      return parseDocElement(element as DucDocElementFb);
    case ElementUnion.DucModelElement:
      return parseModelElement(element as DucModelElementFb);
    default:
      return null;
  }
}
// #endregion


// #region TOP-LEVEL STRUCTURE PARSERS

export function parseBlockFromBinary(block: DucBlockFb): DucBlock {
  const attributeDefinitions: Record<string, DucBlockAttributeDefinition> = {};
  for (let i = 0; i < block.attributeDefinitionsLength(); i++) {
    const entry = block.attributeDefinitions(i)!;
    const def = entry.value()!;
    attributeDefinitions[entry.key()!] = {
      tag: def.tag()!,
      prompt: def.prompt() || undefined,
      defaultValue: def.defaultValue()!,
      isConstant: def.isConstant(),
    };
  }

  // Parse metadata if present
  const metadata = parseBlockMetadata(block.metadata());

  // Parse thumbnail if present
  const thumbnail = block.thumbnailArray();

  return {
    id: block.id()!,
    label: block.label()!,
    description: block.description() || undefined,
    version: block.version(),
    attributeDefinitions,
    metadata,
    thumbnail: thumbnail || undefined,
  };
}

export function parseDictionaryFromBinary(data: ExportedDataStateFb): Dictionary {
  const dictionary: Dictionary = {};
  for (let i = 0; i < data.dictionaryLength(); i++) {
    const entry = data.dictionary(i)!;
    dictionary[entry.key()!] = entry.value()!;
  }
  return dictionary;
}

export function parseExternalFilesFromBinary(entry: DucExternalFileEntry): DucExternalFiles {
  const fileData = entry.value()!;
  const data = fileData.dataArray();
  const key = entry.key()!;
  const id = fileData.id()! as ExternalFileId;

  return {
    [key]: {
      id,
      mimeType: fileData.mimeType()!,
      data,
      created: Number(fileData.created()),
      lastRetrieved: Number(fileData.lastRetrieved()) || undefined,
    }
  } as DucExternalFiles;
}

export function parseGlobalStateFromBinary(state: DucGlobalStateFb): DucGlobalState {
  return {
    name: state.name(),
    viewBackgroundColor: state.viewBackgroundColor()!,
    mainScope: state.mainScope()! as Scope,
    dashSpacingScale: toScaleFactor(state.dashSpacingScale()),
    isDashSpacingAffectedByViewportScale: state.isDashSpacingAffectedByViewportScale(),
    scopeExponentThreshold: state.scopeExponentThreshold(),
    dimensionsAssociativeByDefault: state.dimensionsAssociativeByDefault(),
    useAnnotativeScaling: state.useAnnotativeScaling(),
    displayPrecision: {
      linear: state.displayPrecisionLinear(),
      angular: state.displayPrecisionAngular(),
    },
    pruningLevel: state.pruningLevel()!,
  };
}

export function parseGroupFromBinary(group: DucGroupFb): DucGroup {
  return {
    id: group.id()!,
    ...parseStackBase(group.stackBase()!),
  };
}

export function parseLayerFromBinary(layer: DucLayerFb): DucLayer {
  const overrides = layer.overrides();
  return {
    id: layer.id()!,
    ...parseStackBase(layer.stackBase()!),
    readonly: layer.readonly(),
    overrides: overrides ? {
      stroke: parseElementStroke(overrides.stroke()!),
      background: parseElementBackground(overrides.background()!),
    } : null,
  };
}

export function parseLocalStateFromBinary(state: DucLocalStateFb): DucLocalState {
  return {
    scope: state.scope()! as Scope,
    activeStandardId: state.activeStandardId()!,
    scrollX: toPrecisionValue(state.scrollX()),
    scrollY: toPrecisionValue(state.scrollY()),
    zoom: toZoom(state.zoom()),
    activeGridSettings: Array.from({ length: state.activeGridSettingsLength() }, (_, i) => state.activeGridSettings(i)!),
    activeSnapSettings: state.activeSnapSettings(),
    isBindingEnabled: state.isBindingEnabled(),
    currentItemStroke: parseElementStroke(state.currentItemStroke()!),
    currentItemBackground: parseElementBackground(state.currentItemBackground()!),
    currentItemOpacity: toPercentage(state.currentItemOpacity()),
    currentItemFontFamily: state.currentItemFontFamily()! as any, // For now will use as any because this will be a string in the future
    currentItemFontSize: toPrecisionValue(state.currentItemFontSize()),
    currentItemTextAlign: state.currentItemTextAlign()!,
    currentItemStartLineHead: state.currentItemStartLineHead() ? parseHead(state.currentItemStartLineHead()!) as unknown as LineHead : null,
    currentItemEndLineHead: state.currentItemEndLineHead() ? parseHead(state.currentItemEndLineHead()!) as unknown as LineHead : null,
    currentItemRoundness: toPrecisionValue(state.currentItemRoundness()),
    gridSize: 0, // deprecated
    gridStep: 0, // deprecated
    penMode: state.penMode(),
    viewModeEnabled: state.viewModeEnabled(),
    objectsSnapModeEnabled: state.objectsSnapModeEnabled(),
    gridModeEnabled: state.gridModeEnabled(),
    outlineModeEnabled: state.outlineModeEnabled(),
    manualSaveMode: state.manualSaveMode(),
  };
}

export function parseRegionFromBinary(region: DucRegionFb): DucRegion {
  return {
    id: region.id()!,
    ...parseStackBase(region.stackBase()!),
    booleanOperation: region.booleanOperation()!,
  };
}

export function parsePrimaryUnits(units: PrimaryUnitsFb): StandardUnits["primaryUnits"] {
  const linear = units.linear()!;
  const angular = units.angular()!;
  return {
    linear: {
      format: linear.format()!,
      system: linear.base()!.system()!,
      precision: linear.base()!.precision(),
      suppressLeadingZeros: linear.base()!.suppressLeadingZeros(),
      suppressTrailingZeros: linear.base()!.suppressTrailingZeros(),
      decimalSeparator: linear.decimalSeparator()!,
      suppressZeroFeet: linear.suppressZeroFeet(),
      suppressZeroInches: linear.suppressZeroInches(),
    },
    angular: {
      format: angular.format()!,
      system: angular.base()!.system()!,
      precision: angular.base()!.precision(),
      suppressLeadingZeros: angular.base()!.suppressLeadingZeros(),
      suppressTrailingZeros: angular.base()!.suppressTrailingZeros(),
    },
  };
}

export function parseStandardFromBinary(standard: StandardFb): Standard {
  const overrides = standard.overrides();
  const styles = standard.styles();
  const viewSettings = standard.viewSettings();
  const units = standard.units();
  const validation = standard.validation();
  const primaryUnits = units?.primaryUnits();
  const alternateUnits = units?.alternateUnits();

  return {
    id: standard.identifier()!.id()!,
    name: standard.identifier()!.name()!,
    description: standard.identifier()!.description() || undefined,
    version: standard.version()!,
    readonly: standard.readonly(),
    overrides: overrides ? {
      mainScope: (overrides.mainScope() as Scope) || undefined,
      elementsStrokeWidthOverride: overrides.elementsStrokeWidthOverride() ? toPrecisionValue(overrides.elementsStrokeWidthOverride()) : undefined,
      commonStyleId: overrides.commonStyleId() || undefined,
      stackLikeStyleId: overrides.stackLikeStyleId() || undefined,
      textStyleId: overrides.textStyleId() || undefined,
      dimensionStyleId: overrides.dimensionStyleId() || undefined,
      leaderStyleId: overrides.leaderStyleId() || undefined,
      featureControlFrameStyleId: overrides.featureControlFrameStyleId() || undefined,
      tableStyleId: overrides.tableStyleId() || undefined,
      docStyleId: overrides.docStyleId() || undefined,
      viewportStyleId: overrides.viewportStyleId() || undefined,
      plotStyleId: overrides.plotStyleId() || undefined,
      hatchStyleId: overrides.hatchStyleId() || undefined,
      activeGridSettingsId: Array.from({ length: overrides.activeGridSettingsIdLength() }, (_, i) => overrides.activeGridSettingsId(i)!),
      activeSnapSettingsId: overrides.activeSnapSettingsId() || undefined,
      dashLineOverride: overrides.dashLineOverride() || undefined,
      unitPrecision: overrides.unitPrecision() ? {
        linear: overrides.unitPrecision()!.linear(),
        angular: overrides.unitPrecision()!.angular(),
        area: overrides.unitPrecision()!.area(),
        volume: overrides.unitPrecision()!.volume(),
      } : undefined,
    } : null,
    styles: styles ? {
      commonStyles: Array.from({ length: styles.commonStylesLength() }, (_, i) => {
        const s = styles.commonStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseCommonStyle(s.style()!) };
      }),
      stackLikeStyles: Array.from({ length: styles.stackLikeStylesLength() }, (_, i) => {
        const s = styles.stackLikeStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseStackLikeStyles(s.style()!) };
      }),
      textStyles: Array.from({ length: styles.textStylesLength() }, (_, i) => {
        const s = styles.textStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseTextStyle(s.style()!) };
      }),
      dimensionStyles: Array.from({ length: styles.dimensionStylesLength() }, (_, i) => {
        const s = styles.dimensionStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseDimensionStyle(s.style()!) };
      }),
      leaderStyles: Array.from({ length: styles.leaderStylesLength() }, (_, i) => {
        const s = styles.leaderStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseLeaderStyle(s.style()!) };
      }),
      featureControlFrameStyles: Array.from({ length: styles.featureControlFrameStylesLength() }, (_, i) => {
        const s = styles.featureControlFrameStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseFeatureControlFrameStyle(s.style()!) };
      }),
      tableStyles: Array.from({ length: styles.tableStylesLength() }, (_, i) => {
        const s = styles.tableStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseTableStyle(s.style()!) };
      }),
      docStyles: Array.from({ length: styles.docStylesLength() }, (_, i) => {
        const s = styles.docStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseDocStyle(s.style()!) };
      }),
      viewportStyles: Array.from({ length: styles.viewportStylesLength() }, (_, i) => {
        const s = styles.viewportStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseViewportStyle(s.style()!) };
      }),
      hatchStyles: Array.from({ length: styles.hatchStylesLength() }, (_, i) => {
        const s = styles.hatchStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseHatchStyle(s.style()!) };
      }),
      xrayStyles: Array.from({ length: styles.xrayStylesLength() }, (_, i) => {
        const s = styles.xrayStyles(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseXRayStyle(s.style()!) };
      }),
    } : null,
    viewSettings: viewSettings ? {
      views: Array.from({ length: viewSettings.viewsLength() }, (_, i) => {
        const v = viewSettings.views(i)!;
        return { id: v.id()!.id()!, name: v.id()!.name()!, description: v.id()!.description() || undefined, ...parseView(v.view()!) };
      }),
      ucs: Array.from({ length: viewSettings.ucsLength() }, (_, i) => {
        const u = viewSettings.ucs(i)!;
        return { id: u.id()!.id()!, name: u.id()!.name()!, description: u.id()!.description() || undefined, ...parseUcs(u.ucs()!) };
      }),
      gridSettings: Array.from({ length: viewSettings.gridSettingsLength() }, (_, i) => {
        const g = viewSettings.gridSettings(i)!;
        return { id: g.id()!.id()!, name: g.id()!.name()!, description: g.id()!.description() || undefined, ...parseGridSettings(g.settings()!) };
      }),
      snapSettings: Array.from({ length: viewSettings.snapSettingsLength() }, (_, i) => {
        const s = viewSettings.snapSettings(i)!;
        return { id: s.id()!.id()!, name: s.id()!.name()!, description: s.id()!.description() || undefined, ...parseSnapSettings(s.settings()!) };
      }),
    } : null,
    units: units && primaryUnits && alternateUnits ? {
      primaryUnits: parsePrimaryUnits(primaryUnits),
      alternateUnits: {
        ...parseUnitSystemBase(alternateUnits.base()!, alternateUnits.format()!),
        isVisible: alternateUnits.isVisible(),
        multiplier: alternateUnits.multiplier(),
      },
    } as StandardUnits : null,
    validation: validation ? {
      dimensionRules: validation.dimensionRules() ? {
        minTextHeight: toPrecisionValue(validation.dimensionRules()!.minTextHeight()),
        maxTextHeight: toPrecisionValue(validation.dimensionRules()!.maxTextHeight()),
        allowedPrecisions: Array.from({ length: validation.dimensionRules()!.allowedPrecisionsLength() }, (_, i) => validation.dimensionRules()!.allowedPrecisions(i)!),
      } : undefined,
      layerRules: validation.layerRules() ? {
        prohibitedLayerNames: Array.from({ length: validation.layerRules()!.prohibitedLayerNamesLength() }, (_, i) => validation.layerRules()!.prohibitedLayerNames(i)!),
      } : undefined,
    } : null,
  };
}

// #region STANDARDS & SETTINGS PARSERS
function parseCommonStyle(style: DucCommonStyleFb): DucCommonStyle {
  return {
    background: parseElementBackground(style.background()!),
    stroke: parseElementStroke(style.stroke()!),
  };
}
// #endregion

function parseUnitSystemBase<T extends AngularUnitsFormat | DimensionUnitsFormat>(base: any, format: T): _UnitSystemBase<T> {
  return {
    format,
    system: base.system(),
    precision: base.precision(),
    suppressLeadingZeros: base.suppressLeadingZeros(),
    suppressTrailingZeros: base.suppressTrailingZeros(),
  };
}

function parseView(view: DucViewFb): DucView {
  return {
    scrollX: toPrecisionValue(view.scrollX()),
    scrollY: toPrecisionValue(view.scrollY()),
    zoom: toZoom(view.zoom()),
    twistAngle: toRadian(view.twistAngle()),
    centerPoint: parsePoint(view.centerPoint()!),
    scope: view.scope()! as Scope,
  };
}

function parseUcs(ucs: DucUcsFb): DucUcs {
  return {
    origin: parseGeometricPoint(ucs.origin()!),
    angle: toRadian(ucs.angle()),
  };
}

function parseGridSettings(settings: GridSettingsFb): GridSettings {
  const polar = settings.polarSettings();
  const isometric = settings.isometricSettings();
  return {
    type: settings.type()!,
    readonly: settings.readonly(),
    displayType: settings.displayType()!,
    isAdaptive: settings.isAdaptive(),
    xSpacing: toPrecisionValue(settings.xSpacing()),
    ySpacing: toPrecisionValue(settings.ySpacing()),
    subdivisions: settings.subdivisions(),
    origin: parseGeometricPoint(settings.origin()!),
    rotation: toRadian(settings.rotation()),
    followUCS: settings.followUcs(),
    majorStyle: {
      color: settings.majorStyle()!.color()!,
      opacity: toPercentage(settings.majorStyle()!.opacity()),
      dashPattern: Array.from(settings.majorStyle()!.dashPatternArray() || []),
    },
    minorStyle: {
      color: settings.minorStyle()!.color()!,
      opacity: toPercentage(settings.minorStyle()!.opacity()),
      dashPattern: Array.from(settings.minorStyle()!.dashPatternArray() || []),
    },
    showMinor: settings.showMinor(),
    minZoom: settings.minZoom(),
    maxZoom: settings.maxZoom(),
    autoHide: settings.autoHide(),
    polarSettings: polar ? {
      radialDivisions: polar.radialDivisions(),
      radialSpacing: toPrecisionValue(polar.radialSpacing()),
      showLabels: polar.showLabels(),
    } : undefined,
    isometricSettings: isometric ? {
      leftAngle: toRadian(isometric.leftAngle()),
      rightAngle: toRadian(isometric.rightAngle()),
    } : undefined,
    enableSnapping: settings.enableSnapping(),
  };
}

function parseSnapSettings(settings: SnapSettingsFb): SnapSettings {
  const polar = settings.polarTracking()!;
  const dynamic = settings.dynamicSnap()!;
  const markers = settings.snapMarkers()!;
  const markerStyles: Record<ObjectSnapMode, SnapMarkerStyle> = {} as any;
  for (let i = 0; i < markers.stylesLength(); i++) {
    const entry = markers.styles(i)!;
    markerStyles[entry.key() as ObjectSnapMode] = {
      shape: entry.value()!.shape()!,
      color: entry.value()!.color()!,
    };
  }
  return {
    readonly: settings.readonly(),
    twistAngle: toRadian(settings.twistAngle()),
    snapTolerance: settings.snapTolerance(),
    objectSnapAperture: settings.objectSnapAperture(),
    isOrthoModeOn: settings.isOrthoModeOn(),
    polarTracking: {
      enabled: polar.enabled(),
      angles: Array.from(polar.anglesArray() || []).map(toRadian),
      incrementAngle: polar.incrementAngle() ? toRadian(polar.incrementAngle()) : undefined,
      trackFromLastPoint: polar.trackFromLastPoint(),
      showPolarCoordinates: polar.showPolarCoordinates(),
    },
    isObjectSnapOn: settings.isObjectSnapOn(),
    activeObjectSnapModes: Array.from(settings.activeObjectSnapModesArray() || []),
    snapPriority: Array.from(settings.snapPriorityArray() || []),
    showTrackingLines: settings.showTrackingLines(),
    trackingLineStyle: settings.trackingLineStyle() ? {
      color: settings.trackingLineStyle()!.color()!,
      opacity: toPercentage(settings.trackingLineStyle()!.opacity()),
      dashPattern: Array.from(settings.trackingLineStyle()!.dashPatternArray() || []),
    } : undefined,
    dynamicSnap: {
      enabledDuringDrag: dynamic.enabledDuringDrag(),
      enabledDuringRotation: dynamic.enabledDuringRotation(),
      enabledDuringScale: dynamic.enabledDuringScale(),
    },
    temporaryOverrides: Array.from({ length: settings.temporaryOverridesLength() }, (_, i) => {
      const o = settings.temporaryOverrides(i)!;
      return { key: o.key()!, behavior: o.behavior()! };
    }),
    incrementalDistance: settings.incrementalDistance(),
    magneticStrength: settings.magneticStrength(),
    layerSnapFilters: settings.layerSnapFilters() ? {
      includeLayers: Array.from({ length: settings.layerSnapFilters()!.includeLayersLength() }, (_, i) => settings.layerSnapFilters()!.includeLayers(i)!),
      excludeLayers: Array.from({ length: settings.layerSnapFilters()!.excludeLayersLength() }, (_, i) => settings.layerSnapFilters()!.excludeLayers(i)!),
    } : undefined,
    elementTypeFilters: Array.from({ length: settings.elementTypeFiltersLength() }, (_, i) => settings.elementTypeFilters(i)!) as DucElement["type"][],
    snapMode: settings.snapMode()!,
    snapMarkers: {
      enabled: markers.enabled(),
      size: markers.size(),
      duration: markers.duration(),
      styles: markerStyles,
    },
    constructionSnapEnabled: settings.constructionSnapEnabled(),
    snapToGridIntersections: settings.snapToGridIntersections(),
  };
}

// #region VERSIONING & MISC
export function parseThumbnailFromBinary(data: ExportedDataStateFb): Uint8Array | undefined {
  return data.thumbnailArray() || undefined;
}

export function parseVersionGraphFromBinary(graph: VersionGraphFb | null): VersionGraph | null {
  if (!graph) return null;
  const metadata = graph.metadata()!;
  return {
    userCheckpointVersionId: graph.userCheckpointVersionId()!,
    latestVersionId: graph.latestVersionId()!,
    checkpoints: Array.from({ length: graph.checkpointsLength() }, (_, i) => {
      const c = graph.checkpoints(i)!;
      const base = c.base()!;
      return {
        type: "checkpoint",
        id: base.id()!,
        parentId: base.parentId(),
        timestamp: Number(base.timestamp()),
        description: base.description() || undefined,
        isManualSave: base.isManualSave(),
        userId: base.userId() || undefined,
        data: c.dataArray()!,
        sizeBytes: Number(c.sizeBytes()),
      };
    }),
    deltas: Array.from({ length: graph.deltasLength() }, (_, i) => {
      const d = graph.deltas(i)!;
      const base = d.base()!;
      return {
        type: "delta",
        id: base.id()!,
        parentId: base.parentId(),
        timestamp: Number(base.timestamp()),
        description: base.description() || undefined,
        isManualSave: base.isManualSave(),
        userId: base.userId() || undefined,
        patch: parseBinaryToJson(d.patchArray()) as JSONPatch,
      };
    }),
    metadata: {
      lastPruned: Number(metadata.lastPruned()),
      totalSize: Number(metadata.totalSize()),
    },
  };
}

// #endregion



// #region ROOT PARSER
export const parseDuc = async (
  blob: Blob | File,
  fileHandle: FileSystemHandle | null = null,
  restoreConfig: RestoreConfig = {},
): Promise<RestoredDataState> => {
  const arrayBuffer = await blob.arrayBuffer();
  if (!arrayBuffer || (arrayBuffer as ArrayBuffer).byteLength === 0) {
    throw new Error('Invalid DUC buffer: empty file');
  }

  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  // Validate that the root can be read; flatbuffers will throw if buffer is not well-formed.
  let data: ExportedDataStateFb;
  try {
    data = ExportedDataState.getRootAsExportedDataState(byteBuffer);
  } catch (e) {
    throw new Error('Invalid DUC buffer: cannot read root table');
  }

  const legacyVersion = data.versionLegacy();
  if (legacyVersion) {
    throw new Error(`Unsupported DUC version: ${legacyVersion}. Please use version ducjs@2.0.1 or lower to support this file.`);
  }

  const version = data.version();

  const localState = data.ducLocalState();
  const parsedLocalState = localState && parseLocalStateFromBinary(localState);

  // Parse global state
  const globalState = data.ducGlobalState();
  const parsedGlobalState = globalState && parseGlobalStateFromBinary(globalState);

  // Parse elements
  const elements: Partial<DucElement>[] = [];
  for (let i = 0; i < data.elementsLength(); i++) {
    const e = data.elements(i);
    if (e) {
      const element = parseElementFromBinary(e);
      if (element) {
        elements.push(element);
      }
    }
  }

  // Parse files
  let parsedFiles: DucExternalFiles = {};
  for (let i = 0; i < data.externalFilesLength(); i++) {
    const externalFile = data.externalFiles(i);
    if (externalFile) {
      const parsedFile: DucExternalFiles = parseExternalFilesFromBinary(externalFile);
      parsedFiles = { ...parsedFiles, ...parsedFile };
    }
  }

  // Parse blocks
  const blocks: DucBlock[] = [];
  for (let i = 0; i < data.blocksLength(); i++) {
    const block = data.blocks(i);
    if (block) {
      const parsedBlock = parseBlockFromBinary(block);
      if (parsedBlock) {
        blocks.push(parsedBlock as DucBlock);
      }
    }
  }

  // Parse block instances
  const blockInstances: DucBlockInstance[] = [];
  for (let i = 0; i < data.blockInstancesLength(); i++) {
    const blockInstance = data.blockInstances(i);
    if (blockInstance) {
      const parsedBlockInstance = parseBlockInstance(blockInstance);
      if (parsedBlockInstance) {
        blockInstances.push(parsedBlockInstance);
      }
    }
  }

  // Parse block collections
  const blockCollections: DucBlockCollection[] = [];
  for (let i = 0; i < data.blockCollectionsLength(); i++) {
    const blockCollection = data.blockCollections(i);
    if (blockCollection) {
      const parsedBlockCollection = parseBlockCollection(blockCollection);
      if (parsedBlockCollection) {
        blockCollections.push(parsedBlockCollection);
      }
    }
  }

  // Parse groups
  const groups: DucGroup[] = [];
  for (let i = 0; i < data.groupsLength(); i++) {
    const group = data.groups(i);
    if (group) {
      const parsedGroup = parseGroupFromBinary(group);
      if (parsedGroup) {
        groups.push(parsedGroup as DucGroup);
      }
    }
  }

  // Parse dictionary
  const dictionary = parseDictionaryFromBinary(data);

  // Parse thumbnail
  const thumbnail = parseThumbnailFromBinary(data);

  // Parse version graph
  const versionGraphData = data.versionGraph();
  const versionGraph = parseVersionGraphFromBinary(versionGraphData);

  // Parse regions
  const regions: DucRegion[] = [];
  for (let i = 0; i < data.regionsLength(); i++) {
    const region = data.regions(i);
    if (region) {
      const parsedRegion = parseRegionFromBinary(region);
      if (parsedRegion) {
        regions.push(parsedRegion);
      }
    }
  }

  // Parse layers
  const layers: DucLayer[] = [];
  for (let i = 0; i < data.layersLength(); i++) {
    const layer = data.layers(i);
    if (layer) {
      const parsedLayer = parseLayerFromBinary(layer);
      if (parsedLayer) {
        layers.push(parsedLayer);
      }
    }
  }

  // Parse standards
  const standards: Standard[] = [];
  for (let i = 0; i < data.standardsLength(); i++) {
    const standard = data.standards(i);
    if (standard) {
      const parsedStandard = parseStandardFromBinary(standard);
      if (parsedStandard) {
        standards.push(parsedStandard);
      }
    }
  }

  const exportData: RestoredDataState = {
    thumbnail,
    dictionary,
    elements: elements as OrderedDucElement[],
    localState: parsedLocalState!,
    globalState: parsedGlobalState!,
    blocks,
    blockInstances,
    blockCollections,
    groups,
    regions,
    layers,

    standards,
    files: parsedFiles,

    versionGraph: versionGraph ?? undefined,
    id: data.id() ?? nanoid(),
  };

  const sanitized = restore(
    exportData,
    {
      syncInvalidIndices: (elements) => elements as OrderedDucElement[],
      repairBindings: true,
      refreshDimensions: false,
    },
    restoreConfig,
  );

  return {
    thumbnail: sanitized.thumbnail,
    dictionary: sanitized.dictionary,
    elements: sanitized.elements,
    localState: sanitized.localState,
    globalState: sanitized.globalState,
    files: sanitized.files,
    blocks: sanitized.blocks,
    blockInstances: sanitized.blockInstances,
    groups: sanitized.groups,
    regions: sanitized.regions,
    layers: sanitized.layers,
    blockCollections: sanitized.blockCollections,
    standards: sanitized.standards,
    versionGraph: sanitized.versionGraph,
    id: sanitized.id,
  };
};
// #endregion
