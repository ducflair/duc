/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* IMPORTANT:
   - Single-file serializer for DUC FlatBuffers schema.
   - No enum remapping tables: use enums directly from ducjs/flatbuffers/duc.
   - No defaults added: only write what's present in TS objects.
   - PrecisionValue, Radian, Percentage, ScaleFactor, etc. are branded numbers:
     cast to number at the final write site (e.g. pv.value).
   - Keep args strongly typed. Never use any for function args.
*/
import * as Duc from "./flatbuffers/duc";
import * as flatbuffers from "flatbuffers";

import {
  _DucElementStylesBase,
  _DucLinearElementBase,
  _DucStackBase,
  _DucStackElementBase,
  BoundElement,
  Checkpoint,
  CustomHatchPattern,
  DatumReference,
  Delta,
  Dictionary,
  DimensionDefinitionPoints,
  DucArrowElement,
  DucBlock,
  DucBlockAttributeDefinition,
  DucBlockInstanceElement,
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
  DucFreeDrawEnds,
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
  DucLinearElement,
  DucLineReference,
  DucLocalState,
  DucMermaidElement,
  DucParametricElement,
  DucPath,
  DucPdfElement,
  DucPlotElement,
  DucPoint,
  DucPointBinding,
  DucPolygonElement,
  DucRectangleElement,
  DucRegion,
  DucStackLikeStyles,
  DucTableCellStyle,
  DucTableElement,
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
  DynamicSnapSettings,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  FeatureControlFrameSegment,
  GeometricPoint,
  GridSettings,
  GridStyle,
  HatchPatternLine,
  Identifier,
  ImageCrop,
  ImportedDataState,
  IsometricGridSettings,
  JSONPatch,
  LayerSnapFilters,
  LeaderContent,
  OrderedDucElement,
  ParametricElementSource,
  PlotLayout,
  PolarGridSettings,
  PolarTrackingSettings,
  PrecisionValue,
  SnapMarkerSettings,
  SnapOverride,
  SnapSettings,
  StrokeSides,
  StrokeStyle,
  TextColumn,
  ToleranceClause,
  TrackingLineStyle,
  VersionBase,
  VersionGraph
} from "./types";

import { restore } from "./restore";
import { encodeFunctionString, EXPORT_DATA_TYPES } from "./utils";

/**
 * Basic helpers
 */
const str = (b: flatbuffers.Builder, v: string | null | undefined): number | undefined =>
  v == null ? undefined : b.createString(v);

function writeString(builder: flatbuffers.Builder, str: string | null | undefined): number | undefined {
  if (str === null || str === undefined) return undefined;
  return builder.createString(str);
}

function getPrecisionValue(value: PrecisionValue, useScopedValues: boolean): number {
  return useScopedValues ? value.scoped : value.value;
}

function writeStringVector(builder: flatbuffers.Builder, items: (string | null | undefined)[] | ReadonlyArray<string | null | undefined> | null | undefined): number | undefined {
  if (!items || items.length === 0) return undefined;
  const arr = Array.isArray(items) ? items.slice() : Array.from(items);
  const offsets = arr.map(item => (item ? builder.createString(item) : 0)).filter((offset): offset is number => offset !== 0);
  if (offsets.length === 0) return undefined;
  // This helper is used for multiple vector fields; return a builder vector; caller decides which create*Vector to use.
  // For current callers that expect createGroupIdsVector specifically, fallback to generic createVector via builder.start/endVector
  builder.startVector(4, offsets.length, 4);
  for (let i = offsets.length - 1; i >= 0; i--) {
    builder.addOffset(offsets[i]);
  }
  return builder.endVector();
}

/**
 * Element style/content serializers
 */
function writeTiling(b: flatbuffers.Builder, t: ElementContentBase["tiling"], usv: boolean): number | undefined {
  if (!t) return undefined;
  Duc.TilingProperties.startTilingProperties(b);
  Duc.TilingProperties.addSizeInPercent(b, t.sizeInPercent);
  Duc.TilingProperties.addAngle(b, t.angle);
  if (t.spacing !== undefined) Duc.TilingProperties.addSpacing(b, t.spacing);
  if (t.offsetX !== undefined) Duc.TilingProperties.addOffsetX(b, t.offsetX);
  if (t.offsetY !== undefined) Duc.TilingProperties.addOffsetY(b, t.offsetY);
  return Duc.TilingProperties.endTilingProperties(b);
}

function writeHatchPatternLine(b: flatbuffers.Builder, l: HatchPatternLine, usv: boolean): number {
  const origin = writeDucPoint(b, l.origin, usv);
  const offsetVec = Duc.HatchPatternLine.createOffsetVector(b, [getPrecisionValue(l.offset[0], usv), getPrecisionValue(l.offset[1], usv)]);
  const dashVec = Duc.HatchPatternLine.createDashPatternVector(b, l.dashPattern.map(Number));
  Duc.HatchPatternLine.startHatchPatternLine(b);
  Duc.HatchPatternLine.addAngle(b, l.angle);
  if (origin) Duc.HatchPatternLine.addOrigin(b, origin);
  Duc.HatchPatternLine.addOffset(b, offsetVec);
  if (dashVec) Duc.HatchPatternLine.addDashPattern(b, dashVec);
  return Duc.HatchPatternLine.endHatchPatternLine(b);
}

function writeCustomHatch(b: flatbuffers.Builder, p: CustomHatchPattern | null | undefined, usv: boolean): number | undefined {
  if (!p) return undefined;
  const name = str(b, p.name);
  const desc = str(b, p.description);
  const lines = Duc.CustomHatchPattern.createLinesVector(b, p.lines.map((ln) => writeHatchPatternLine(b, ln, usv)));
  Duc.CustomHatchPattern.startCustomHatchPattern(b);
  if (name) Duc.CustomHatchPattern.addName(b, name);
  if (desc) Duc.CustomHatchPattern.addDescription(b, desc);
  Duc.CustomHatchPattern.addLines(b, lines);
  return Duc.CustomHatchPattern.endCustomHatchPattern(b);
}

function writeHatchStyle(b: flatbuffers.Builder, h: DucHatchStyle | null | undefined, usv: boolean): number | undefined {
  if (!h) return undefined;
  const pattName = str(b, h.pattern.name);
  const pattOrigin = writeDucPoint(b, h.pattern.origin, usv);
  const custom = writeCustomHatch(b, h.customPattern, usv);
  Duc.DucHatchStyle.startDucHatchStyle(b);
  if (h.hatchStyle !== undefined) Duc.DucHatchStyle.addHatchStyle(b, h.hatchStyle);
  if (pattName) Duc.DucHatchStyle.addPatternName(b, pattName);
  Duc.DucHatchStyle.addPatternScale(b, h.pattern.scale);
  Duc.DucHatchStyle.addPatternAngle(b, h.pattern.angle);
  if (pattOrigin) Duc.DucHatchStyle.addPatternOrigin(b, pattOrigin);
  Duc.DucHatchStyle.addPatternDouble(b, h.pattern.double);
  if (custom) Duc.DucHatchStyle.addCustomPattern(b, custom);
  return Duc.DucHatchStyle.endDucHatchStyle(b);
}

function writeImageFilter(b: flatbuffers.Builder, f: DucImageFilter | null | undefined, usv: boolean): number | undefined {
  if (!f) return undefined;
  Duc.DucImageFilter.startDucImageFilter(b);
  Duc.DucImageFilter.addBrightness(b, f.brightness);
  Duc.DucImageFilter.addContrast(b, f.contrast);
  return Duc.DucImageFilter.endDucImageFilter(b);
}

function writeContentBase(b: flatbuffers.Builder, c: ElementContentBase | null | undefined, usv: boolean): number | undefined {
  if (!c) return undefined;
  const s = str(b, c.src);
  const til = writeTiling(b, c.tiling, usv);
  const hatch = writeHatchStyle(b, c.hatch, usv);
  const filt = writeImageFilter(b, c.imageFilter, usv);

  Duc.ElementContentBase.startElementContentBase(b);
  if (c.preference !== undefined) Duc.ElementContentBase.addPreference(b, c.preference);
  if (s) Duc.ElementContentBase.addSrc(b, s);
  Duc.ElementContentBase.addVisible(b, c.visible);
  Duc.ElementContentBase.addOpacity(b, c.opacity);
  if (til) Duc.ElementContentBase.addTiling(b, til);
  if (hatch) Duc.ElementContentBase.addHatch(b, hatch);
  if (filt) Duc.ElementContentBase.addImageFilter(b, filt);
  return Duc.ElementContentBase.endElementContentBase(b);
}

function writeStrokeStyle(b: flatbuffers.Builder, s: StrokeStyle | null | undefined, usv: boolean): number | undefined {
  if (!s) return undefined;
  const dashVec = s.dash?.length ? Duc.StrokeStyle.createDashVector(b, s.dash) : undefined;
  const dashLineOverride = str(b, s.dashLineOverride);
  Duc.StrokeStyle.startStrokeStyle(b);
  if (s.preference !== undefined) Duc.StrokeStyle.addPreference(b, s.preference);
  if (s.cap != null) Duc.StrokeStyle.addCap(b, s.cap);
  if (s.join != null) Duc.StrokeStyle.addJoin(b, s.join);
  if (dashVec) Duc.StrokeStyle.addDash(b, dashVec);
  if (dashLineOverride) Duc.StrokeStyle.addDashLineOverride(b, dashLineOverride);
  if (s.dashCap != null) Duc.StrokeStyle.addDashCap(b, s.dashCap);
  if (s.miterLimit !== undefined) Duc.StrokeStyle.addMiterLimit(b, s.miterLimit);
  return Duc.StrokeStyle.endStrokeStyle(b);
}

function writeStrokeSides(b: flatbuffers.Builder, ss: StrokeSides | null | undefined, usv: boolean): number | undefined {
  if (!ss) return undefined;
  const valuesVec = ss.values?.length ? Duc.StrokeSides.createValuesVector(b, ss.values) : undefined;
  Duc.StrokeSides.startStrokeSides(b);
  if (ss.preference !== undefined) Duc.StrokeSides.addPreference(b, ss.preference);
  if (valuesVec) Duc.StrokeSides.addValues(b, valuesVec);
  return Duc.StrokeSides.endStrokeSides(b);
}

function writeElementStroke(b: flatbuffers.Builder, s: ElementStroke | null | undefined, usv: boolean): number | undefined {
  if (!s) return undefined;
  const c = writeContentBase(b, s.content, usv);
  const st = writeStrokeStyle(b, s.style, usv);
  const sides = writeStrokeSides(b, s.strokeSides, usv);
  Duc.ElementStroke.startElementStroke(b);
  if (c) Duc.ElementStroke.addContent(b, c);
  if (s.width) {
    Duc.ElementStroke.addWidth(b, getPrecisionValue(s.width, usv));
  }
  if (st) Duc.ElementStroke.addStyle(b, st);
  if (s.placement) Duc.ElementStroke.addPlacement(b, s.placement);
  if (sides) Duc.ElementStroke.addStrokeSides(b, sides);
  return Duc.ElementStroke.endElementStroke(b);
}

function writeElementBackground(b: flatbuffers.Builder, bg: ElementBackground | null | undefined, usv: boolean): number | undefined {
  if (!bg) return undefined;
  const c = writeContentBase(b, bg.content, usv);
  Duc.ElementBackground.startElementBackground(b);
  if (c) Duc.ElementBackground.addContent(b, c);
  return Duc.ElementBackground.endElementBackground(b);
}

function writeStylesBase(b: flatbuffers.Builder, s: _DucElementStylesBase | undefined, usv: boolean): number | null {
  if (!s) return null;

  const bgArrRaw = s.background;
  const stArrRaw = s.stroke;

  if(bgArrRaw === undefined || stArrRaw === undefined) {
    return null;
  }

  const bgArr: ReadonlyArray<ElementBackground | undefined | null> =
    Array.isArray(bgArrRaw)
      ? bgArrRaw
      : (bgArrRaw ? [bgArrRaw as ElementBackground] : []);
  const stArr: ReadonlyArray<ElementStroke | undefined | null> =
    Array.isArray(stArrRaw)
      ? stArrRaw
      : (stArrRaw ? [stArrRaw as ElementStroke] : []);

  const bgOffsets = bgArr
    .map((x) => (x ? writeElementBackground(b, x, usv) : undefined))
    .filter((o): o is number => o !== undefined);
  const stOffsets = stArr
    .map((x) => (x ? writeElementStroke(b, x, usv) : undefined))
    .filter((o): o is number => o !== undefined);

  const bgs = Duc._DucElementStylesBase.createBackgroundVector(b, bgOffsets);
  const strokes = Duc._DucElementStylesBase.createStrokeVector(b, stOffsets);

  Duc._DucElementStylesBase.start_DucElementStylesBase(b);
  if (s.roundness) {
    Duc._DucElementStylesBase.addRoundness(b, getPrecisionValue(s.roundness, usv));
  }
  if (s.blending) Duc._DucElementStylesBase.addBlending(b, s.blending);
  Duc._DucElementStylesBase.addBackground(b, bgs);
  Duc._DucElementStylesBase.addStroke(b, strokes);
  if (s.opacity) {
    Duc._DucElementStylesBase.addOpacity(b, s.opacity);
  }
  return Duc._DucElementStylesBase.end_DucElementStylesBase(b);
}

/**
 * Generic helpers
 */
function writeStringEntry(b: flatbuffers.Builder, k: string, v: string): number {
  const ko = b.createString(k);
  const vo = b.createString(v);
  Duc.StringValueEntry.startStringValueEntry(b);
  Duc.StringValueEntry.addKey(b, ko);
  Duc.StringValueEntry.addValue(b, vo);
  return Duc.StringValueEntry.endStringValueEntry(b);
}

function writeIdentifier(b: flatbuffers.Builder, id: Identifier): number {
  const io = b.createString(id.id);
  const no = b.createString(id.name);
  const doff = b.createString(id.description ?? "");
  Duc.Identifier.startIdentifier(b);
  Duc.Identifier.addId(b, io);
  Duc.Identifier.addName(b, no);
  Duc.Identifier.addDescription(b, doff);
  return Duc.Identifier.endIdentifier(b);
}

/**
 * Geometry and bindings
 */
function writeDucPoint(b: flatbuffers.Builder, p: DucPoint | null | undefined, usv: boolean): number | undefined {
  if (!p) return undefined;
  Duc.DucPoint.startDucPoint(b);
  Duc.DucPoint.addX(b, getPrecisionValue(p.x, usv));
  Duc.DucPoint.addY(b, getPrecisionValue(p.y, usv));
  if (p.mirroring != null) Duc.DucPoint.addMirroring(b, p.mirroring);
  return Duc.DucPoint.endDucPoint(b);
}

function writeGeomPoint(b: flatbuffers.Builder, p: GeometricPoint | null | undefined, usv: boolean): number | undefined {
  if (!p) return undefined;
  return Duc.GeometricPoint.createGeometricPoint(b, p.x, p.y);
}

function writeHead(b: flatbuffers.Builder, h: DucHead | null | undefined, usv: boolean): number | undefined {
  if (!h) return undefined;
  const blockId = str(b, h.blockId);
  Duc.DucHead.startDucHead(b);
  Duc.DucHead.addType(b, h.type);
  if (blockId) Duc.DucHead.addBlockId(b, blockId);
  Duc.DucHead.addSize(b, getPrecisionValue(h.size, usv));
  return Duc.DucHead.endDucHead(b);
}

function writeBindingPoint(b: flatbuffers.Builder, p: { index: number; offset: number } | null | undefined, usv: boolean): number | undefined {
  if (!p) return undefined;
  Duc.PointBindingPoint.startPointBindingPoint(b);
  Duc.PointBindingPoint.addIndex(b, p.index);
  Duc.PointBindingPoint.addOffset(b, p.offset);
  return Duc.PointBindingPoint.endPointBindingPoint(b);
}

function writePointBinding(b: flatbuffers.Builder, pb: DucPointBinding | null | undefined, usv: boolean): number | undefined {
  if (!pb) return undefined;
  const el = str(b, pb.elementId);
  const fixed = pb.fixedPoint ? writeGeomPoint(b, pb.fixedPoint, usv) : undefined;
  const point = writeBindingPoint(b, pb.point, usv);
  const head = writeHead(b, pb.head, usv);
  Duc.DucPointBinding.startDucPointBinding(b);
  if (el) Duc.DucPointBinding.addElementId(b, el);
  Duc.DucPointBinding.addFocus(b, pb.focus);
  Duc.DucPointBinding.addGap(b, getPrecisionValue(pb.gap, usv));
  if (fixed) Duc.DucPointBinding.addFixedPoint(b, fixed);
  if (point) Duc.DucPointBinding.addPoint(b, point);
  if (head) Duc.DucPointBinding.addHead(b, head);
  return Duc.DucPointBinding.endDucPointBinding(b);
}

function writeLineRef(b: flatbuffers.Builder, r: DucLineReference, usv: boolean): number {
  Duc.DucLineReference.startDucLineReference(b);
  Duc.DucLineReference.addIndex(b, r.index);
  if (r.handle) {
    const hx = getPrecisionValue(r.handle.x, usv);
    const hy = getPrecisionValue(r.handle.y, usv);
    const gp = Duc.GeometricPoint.createGeometricPoint(b, hx, hy);
    Duc.DucLineReference.addHandle(b, gp);
  }
  return Duc.DucLineReference.endDucLineReference(b);
}

function writeLine(b: flatbuffers.Builder, l: DucLine, usv: boolean): number {
  const s = writeLineRef(b, l[0], usv);
  const e = writeLineRef(b, l[1], usv);
  Duc.DucLine.startDucLine(b);
  Duc.DucLine.addStart(b, s);
  Duc.DucLine.addEnd(b, e);
  return Duc.DucLine.endDucLine(b);
}

function writePath(b: flatbuffers.Builder, p: DucPath, usv: boolean): number {
  const lineIndices = Duc.DucPath.createLineIndicesVector(b, p.lineIndices.map((x) => x));
  const bg = p.background ? writeElementBackground(b, p.background, usv) : undefined;
  const st = p.stroke ? writeElementStroke(b, p.stroke, usv) : undefined;
  Duc.DucPath.startDucPath(b);
  Duc.DucPath.addLineIndices(b, lineIndices);
  if (bg) Duc.DucPath.addBackground(b, bg);
  if (st) Duc.DucPath.addStroke(b, st);
  return Duc.DucPath.endDucPath(b);
}

/**
 * DucElement bases
 */
function writeBoundElement(b: flatbuffers.Builder, be: BoundElement, usv: boolean): number {
  const id = str(b, be.id)!;
  const type = str(b, be.type)!;
  Duc.BoundElement.startBoundElement(b);
  Duc.BoundElement.addId(b, id);
  Duc.BoundElement.addType(b, type);
  return Duc.BoundElement.endBoundElement(b);
}

function writeElementBase(b: flatbuffers.Builder, e: _DucElementStylesBase & _DucStackElementBase & _DucStackBase, usv: boolean): number {
  const id = str(b, e.id);
  const styles = writeStylesBase(b, e, usv);
  const scope = str(b, e.scope);
  const label = str(b, e.label ?? undefined);
  const desc = str(b, e.description ?? undefined);
  const index = str(b, e.index ?? undefined);
  const groupIds = e.groupIds?.length ? Duc._DucElementBase.createGroupIdsVector(b, e.groupIds.map((g) => b.createString(g))) : undefined;
  const regionIds = e.regionIds?.length ? Duc._DucElementBase.createRegionIdsVector(b, e.regionIds.map((r) => b.createString(r))) : undefined;
  const layerId = str(b, e.layerId ?? undefined);
  const frameId = str(b, e.frameId ?? undefined);
  const bound = e.boundElements?.length ? Duc._DucElementBase.createBoundElementsVector(b, e.boundElements.map((x) => writeBoundElement(b, x, usv))) : undefined;
  const link = str(b, e.link ?? undefined);
  const custom = e.customData != null ? str(b, JSON.stringify(e.customData)) : undefined;

  Duc._DucElementBase.start_DucElementBase(b);
  if (id) Duc._DucElementBase.addId(b, id);
  if (styles) Duc._DucElementBase.addStyles(b, styles);
  Duc._DucElementBase.addX(b, getPrecisionValue(e.x, usv));
  Duc._DucElementBase.addY(b, getPrecisionValue(e.y, usv));
  Duc._DucElementBase.addWidth(b, getPrecisionValue(e.width, usv));
  Duc._DucElementBase.addHeight(b, getPrecisionValue(e.height, usv));
  Duc._DucElementBase.addAngle(b, e.angle);
  if (scope) Duc._DucElementBase.addScope(b, scope);
  if (label) Duc._DucElementBase.addLabel(b, label);
  if (desc) Duc._DucElementBase.addDescription(b, desc);
  Duc._DucElementBase.addIsVisible(b, e.isVisible);
  Duc._DucElementBase.addSeed(b, e.seed);
  Duc._DucElementBase.addVersion(b, e.version);
  Duc._DucElementBase.addVersionNonce(b, e.versionNonce);
  Duc._DucElementBase.addUpdated(b, BigInt(e.updated));
  if (index) Duc._DucElementBase.addIndex(b, index);
  Duc._DucElementBase.addIsPlot(b, e.isPlot);
  Duc._DucElementBase.addIsAnnotative(b, e.isAnnotative);
  Duc._DucElementBase.addIsDeleted(b, e.isDeleted);
  if (groupIds) Duc._DucElementBase.addGroupIds(b, groupIds);
  if (regionIds) Duc._DucElementBase.addRegionIds(b, regionIds);
  if (layerId) Duc._DucElementBase.addLayerId(b, layerId);
  if (frameId) Duc._DucElementBase.addFrameId(b, frameId);
  if (bound) Duc._DucElementBase.addBoundElements(b, bound);
  Duc._DucElementBase.addZIndex(b, e.zIndex);
  if (link) Duc._DucElementBase.addLink(b, link);
  Duc._DucElementBase.addLocked(b, e.locked);
  if (custom) Duc._DucElementBase.addCustomData(b, custom);
  return Duc._DucElementBase.end_DucElementBase(b);
}

function writeLinearBase(b: flatbuffers.Builder, e: _DucLinearElementBase, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);

  // Type-safe guards without using any: default to empty arrays if undefined
  const pointsArr: ReadonlyArray<DucPoint> = e.points ?? [];
  const linesArr: ReadonlyArray<DucLine> = e.lines ?? [];
  const pathOverridesArr: ReadonlyArray<DucPath> = e.pathOverrides ?? [];

  const points = Duc._DucLinearElementBase.createPointsVector(
    b,
    pointsArr.map((p) => writeDucPoint(b, p, usv)!).filter((v): v is number => v !== undefined)
  );
  const lines = Duc._DucLinearElementBase.createLinesVector(
    b,
    linesArr.map((ln) => writeLine(b, ln, usv))
  );
  const pathOverrides = pathOverridesArr.length
    ? Duc._DucLinearElementBase.createPathOverridesVector(b, pathOverridesArr.map((p) => writePath(b, p, usv)))
    : undefined;

  const lastCommitted = writeDucPoint(b, e.lastCommittedPoint, usv);
  const startBinding = writePointBinding(b, e.startBinding, usv);
  const endBinding = writePointBinding(b, e.endBinding, usv);

  Duc._DucLinearElementBase.start_DucLinearElementBase(b);
  Duc._DucLinearElementBase.addBase(b, base);
  Duc._DucLinearElementBase.addPoints(b, points);
  Duc._DucLinearElementBase.addLines(b, lines);
  if (pathOverrides) Duc._DucLinearElementBase.addPathOverrides(b, pathOverrides);
  if (lastCommitted) Duc._DucLinearElementBase.addLastCommittedPoint(b, lastCommitted);
  if (startBinding) Duc._DucLinearElementBase.addStartBinding(b, startBinding);
  if (endBinding) Duc._DucLinearElementBase.addEndBinding(b, endBinding);
  return Duc._DucLinearElementBase.end_DucLinearElementBase(b);
}

/**
 * Elements
 */
function writeRect(b: flatbuffers.Builder, e: DucRectangleElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  Duc.DucRectangleElement.startDucRectangleElement(b);
  Duc.DucRectangleElement.addBase(b, base);
  return Duc.DucRectangleElement.endDucRectangleElement(b);
}

function writePolygon(b: flatbuffers.Builder, e: DucPolygonElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  Duc.DucPolygonElement.startDucPolygonElement(b);
  Duc.DucPolygonElement.addBase(b, base);
  Duc.DucPolygonElement.addSides(b, e.sides);
  return Duc.DucPolygonElement.endDucPolygonElement(b);
}

function writeEllipse(b: flatbuffers.Builder, e: DucEllipseElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  Duc.DucEllipseElement.startDucEllipseElement(b);
  Duc.DucEllipseElement.addBase(b, base);
  Duc.DucEllipseElement.addRatio(b, e.ratio);
  Duc.DucEllipseElement.addStartAngle(b, e.startAngle);
  Duc.DucEllipseElement.addEndAngle(b, e.endAngle);
  Duc.DucEllipseElement.addShowAuxCrosshair(b, e.showAuxCrosshair);
  return Duc.DucEllipseElement.endDucEllipseElement(b);
}

function writeLinear(b: flatbuffers.Builder, e: DucLinearElement, usv: boolean): number {
  const base = writeLinearBase(b, e as unknown as any, usv);
  Duc.DucLinearElement.startDucLinearElement(b);
  Duc.DucLinearElement.addLinearBase(b, base);
  Duc.DucLinearElement.addWipeoutBelow(b, e.wipeoutBelow);
  return Duc.DucLinearElement.endDucLinearElement(b);
}

function writeArrow(b: flatbuffers.Builder, e: DucArrowElement, usv: boolean): number {
  const base = writeLinearBase(b, e as unknown as any, usv);
  Duc.DucArrowElement.startDucArrowElement(b);
  Duc.DucArrowElement.addLinearBase(b, base);
  Duc.DucArrowElement.addElbowed(b, e.elbowed);
  return Duc.DucArrowElement.endDucArrowElement(b);
}

function writeFreeDrawEnds(b: flatbuffers.Builder, ends: DucFreeDrawEnds | null | undefined, usv: boolean): number | undefined {
  if (!ends) return undefined;
  const easing = str(b, encodeFunctionString(ends.easing));
  Duc.DucFreeDrawEnds.startDucFreeDrawEnds(b);
  Duc.DucFreeDrawEnds.addCap(b, ends.cap);
  Duc.DucFreeDrawEnds.addTaper(b, ends.taper);
  if (easing) Duc.DucFreeDrawEnds.addEasing(b, easing);
  return Duc.DucFreeDrawEnds.endDucFreeDrawEnds(b);
}

function writeImageCrop(b: flatbuffers.Builder, c: ImageCrop | null | undefined): number | undefined {
  if (!c) return undefined;
  Duc.ImageCrop.startImageCrop(b);
  Duc.ImageCrop.addX(b, c.x);
  Duc.ImageCrop.addY(b, c.y);
  Duc.ImageCrop.addWidth(b, c.width);
  Duc.ImageCrop.addHeight(b, c.height);
  Duc.ImageCrop.addNaturalWidth(b, c.naturalWidth);
  Duc.ImageCrop.addNaturalHeight(b, c.naturalHeight);
  return Duc.ImageCrop.endImageCrop(b);
}

function writeImage(b: flatbuffers.Builder, e: DucImageElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const fileId = str(b, e.fileId);
  const scaleVec = e.scaleFlip ? Duc.DucImageElement.createScaleVector(b, [e.scaleFlip[0], e.scaleFlip[1]]) : undefined;
  const crop = writeImageCrop(b, e.crop);
  const filter = writeImageFilter(b, e.filter, usv);

  Duc.DucImageElement.startDucImageElement(b);
  Duc.DucImageElement.addBase(b, base);
  if (fileId) Duc.DucImageElement.addFileId(b, fileId);
  if (e.status) Duc.DucImageElement.addStatus(b, e.status);
  if (scaleVec) Duc.DucImageElement.addScale(b, scaleVec);
  if (crop) Duc.DucImageElement.addCrop(b, crop);
  if (filter) Duc.DucImageElement.addFilter(b, filter);
  return Duc.DucImageElement.endDucImageElement(b);
}

function writeFreeDraw(b: flatbuffers.Builder, e: DucFreeDrawElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);

  const pointsVec = e.points && e.points.length
    ? Duc.DucFreeDrawElement.createPointsVector(
        b,
        e.points.map((p) => writeDucPoint(b, p, usv)!).filter((v): v is number => v !== undefined)
      )
    : Duc.DucFreeDrawElement.createPointsVector(b, []);

  const pressuresVec = e.pressures && e.pressures.length
    ? Duc.DucFreeDrawElement.createPressuresVector(b, e.pressures as number[])
    : undefined;

  const easing = b.createString(encodeFunctionString(e.easing));
  const startEnds = writeFreeDrawEnds(b, e.start, usv);
  const endEnds = writeFreeDrawEnds(b, e.end, usv);
  const lcp = e.lastCommittedPoint ? writeDucPoint(b, e.lastCommittedPoint, usv) : undefined;
  const svgPath = e.svgPath ? b.createString(e.svgPath) : undefined;

  Duc.DucFreeDrawElement.startDucFreeDrawElement(b);
  Duc.DucFreeDrawElement.addBase(b, base);
  Duc.DucFreeDrawElement.addPoints(b, pointsVec);

  Duc.DucFreeDrawElement.addSize(b, getPrecisionValue(e.size, usv));
  Duc.DucFreeDrawElement.addThinning(b, e.thinning);
  Duc.DucFreeDrawElement.addSmoothing(b, e.smoothing);
  Duc.DucFreeDrawElement.addStreamline(b, e.streamline);

  if (easing) Duc.DucFreeDrawElement.addEasing(b, easing);
  if (startEnds) Duc.DucFreeDrawElement.addStart(b, startEnds);
  if (endEnds) Duc.DucFreeDrawElement.addEnd(b, endEnds);
  if (pressuresVec) Duc.DucFreeDrawElement.addPressures(b, pressuresVec);
  Duc.DucFreeDrawElement.addSimulatePressure(b, !!e.simulatePressure);
  if (lcp) Duc.DucFreeDrawElement.addLastCommittedPoint(b, lcp);
  if (svgPath) Duc.DucFreeDrawElement.addSvgPath(b, svgPath);

  return Duc.DucFreeDrawElement.endDucFreeDrawElement(b);
}

/**
 * Text
 */
function writeLineSpacing(b: flatbuffers.Builder, ls: DucTextStyle["lineSpacing"] | undefined, usv: boolean): number | undefined {
  if (!ls) return undefined;
  Duc.LineSpacing.startLineSpacing(b);
  if (typeof ls.value === "number") {
    Duc.LineSpacing.addValue(b, ls.value);
  } else {
    Duc.LineSpacing.addValue(b, getPrecisionValue(ls.value, usv));
  }

  Duc.LineSpacing.addType(b, ls.type);
  return Duc.LineSpacing.endLineSpacing(b);
}

function writeTextStyle(b: flatbuffers.Builder, s: DucTextStyle, usv: boolean): number {
  const lineSpacing = writeLineSpacing(b, s.lineSpacing, usv);
  const fontFamily = str(b, s.fontFamily.toString());
  const bigFont = str(b, s.bigFontFamily);
  Duc.DucTextStyle.startDucTextStyle(b);
  Duc.DucTextStyle.addIsLtr(b, s.isLtr);
  if (fontFamily) Duc.DucTextStyle.addFontFamily(b, fontFamily);
  if (bigFont) Duc.DucTextStyle.addBigFontFamily(b, bigFont);
  if (s.textAlign !== undefined) Duc.DucTextStyle.addTextAlign(b, s.textAlign);
  if (s.verticalAlign !== undefined) Duc.DucTextStyle.addVerticalAlign(b, s.verticalAlign);
  Duc.DucTextStyle.addLineHeight(b, s.lineHeight);
  if (lineSpacing) Duc.DucTextStyle.addLineSpacing(b, lineSpacing);
  Duc.DucTextStyle.addObliqueAngle(b, s.obliqueAngle);
  Duc.DucTextStyle.addFontSize(b, getPrecisionValue(s.fontSize, usv));
  if (s.paperTextHeight !== undefined) Duc.DucTextStyle.addPaperTextHeight(b, getPrecisionValue(s.paperTextHeight, usv));
  Duc.DucTextStyle.addWidthFactor(b, s.widthFactor);
  Duc.DucTextStyle.addIsUpsideDown(b, s.isUpsideDown);
  Duc.DucTextStyle.addIsBackwards(b, s.isBackwards);
  return Duc.DucTextStyle.endDucTextStyle(b);
}

function writePrimaryUnits(b: flatbuffers.Builder, units: StandardUnits["primaryUnits"] | undefined, usv: boolean): number | undefined {
  if (!units) return undefined;

  // Linear
  Duc._UnitSystemBase.start_UnitSystemBase(b);
  Duc._UnitSystemBase.addSystem(b, units.linear.system);
  Duc._UnitSystemBase.addPrecision(b, units.linear.precision);
  Duc._UnitSystemBase.addSuppressLeadingZeros(b, units.linear.suppressLeadingZeros);
  Duc._UnitSystemBase.addSuppressTrailingZeros(b, units.linear.suppressTrailingZeros);
  const baseLinear = Duc._UnitSystemBase.end_UnitSystemBase(b);

  Duc.LinearUnitSystem.startLinearUnitSystem(b);
  Duc.LinearUnitSystem.addBase(b, baseLinear);
  Duc.LinearUnitSystem.addFormat(b, units.linear.format);
  Duc.LinearUnitSystem.addDecimalSeparator(b, units.linear.decimalSeparator);
  Duc.LinearUnitSystem.addSuppressZeroFeet(b, units.linear.suppressZeroFeet);
  Duc.LinearUnitSystem.addSuppressZeroInches(b, units.linear.suppressZeroInches);
  const linear = Duc.LinearUnitSystem.endLinearUnitSystem(b);

  // Angular
  Duc._UnitSystemBase.start_UnitSystemBase(b);
  Duc._UnitSystemBase.addSystem(b, units.angular.system);
  Duc._UnitSystemBase.addPrecision(b, units.angular.precision);
  Duc._UnitSystemBase.addSuppressLeadingZeros(b, units.angular.suppressLeadingZeros);
  Duc._UnitSystemBase.addSuppressTrailingZeros(b, units.angular.suppressTrailingZeros);
  const baseAngular = Duc._UnitSystemBase.end_UnitSystemBase(b);

  Duc.AngularUnitSystem.startAngularUnitSystem(b);
  Duc.AngularUnitSystem.addBase(b, baseAngular);
  Duc.AngularUnitSystem.addFormat(b, units.angular.format);
  const angular = Duc.AngularUnitSystem.endAngularUnitSystem(b);

  Duc.PrimaryUnits.startPrimaryUnits(b);
  Duc.PrimaryUnits.addLinear(b, linear);
  Duc.PrimaryUnits.addAngular(b, angular);
  return Duc.PrimaryUnits.endPrimaryUnits(b);
}

function writeTextDynamicSource(b: flatbuffers.Builder, s: DucTextDynamicSource, usv: boolean): number {
  // discriminate by sourceType union ("element" | "dictionary")
  if (s.sourceType === Duc.TEXT_FIELD_SOURCE_TYPE.ELEMENT) {
    const el = str(b, s.elementId);
    const prop = s.property;
    Duc.DucTextDynamicElementSource.startDucTextDynamicElementSource(b);
    if (el) Duc.DucTextDynamicElementSource.addElementId(b, el);
    Duc.DucTextDynamicElementSource.addProperty(b, prop);
    const elem = Duc.DucTextDynamicElementSource.endDucTextDynamicElementSource(b);

    Duc.DucTextDynamicSource.startDucTextDynamicSource(b);
    Duc.DucTextDynamicSource.addTextSourceType(b, Duc.TEXT_FIELD_SOURCE_TYPE.ELEMENT);
    Duc.DucTextDynamicSource.addSourceType(b, Duc.DucTextDynamicSourceData.DucTextDynamicElementSource);
    Duc.DucTextDynamicSource.addSource(b, elem);
    return Duc.DucTextDynamicSource.endDucTextDynamicSource(b);
  }
  const key = str(b, s.key);
  Duc.DucTextDynamicDictionarySource.startDucTextDynamicDictionarySource(b);
  if (key) Duc.DucTextDynamicDictionarySource.addKey(b, key);
  const dict = Duc.DucTextDynamicDictionarySource.endDucTextDynamicDictionarySource(b);

  Duc.DucTextDynamicSource.startDucTextDynamicSource(b);
  Duc.DucTextDynamicSource.addTextSourceType(b, Duc.TEXT_FIELD_SOURCE_TYPE.DICTIONARY);
  Duc.DucTextDynamicSource.addSourceType(b, Duc.DucTextDynamicSourceData.DucTextDynamicDictionarySource);
  Duc.DucTextDynamicSource.addSource(b, dict);
  return Duc.DucTextDynamicSource.endDucTextDynamicSource(b);
}

function writeTextDynamicPart(b: flatbuffers.Builder, p: DucTextDynamicPart, usv: boolean): number {
  const tag = str(b, p.tag);
  const src = writeTextDynamicSource(b, p.source, usv);
  const fmt = writePrimaryUnits(b, p.formatting as any, usv);
  const cached = str(b, p.cachedValue);
  Duc.DucTextDynamicPart.startDucTextDynamicPart(b);
  if (tag) Duc.DucTextDynamicPart.addTag(b, tag);
  Duc.DucTextDynamicPart.addSource(b, src);
  if (fmt) Duc.DucTextDynamicPart.addFormatting(b, fmt);
  if (cached) Duc.DucTextDynamicPart.addCachedValue(b, cached);
  return Duc.DucTextDynamicPart.endDucTextDynamicPart(b);
}

function writeTextColumn(b: flatbuffers.Builder, c: TextColumn, usv: boolean): number {
  Duc.TextColumn.startTextColumn(b);
  Duc.TextColumn.addWidth(b, getPrecisionValue(c.width, usv));
  Duc.TextColumn.addGutter(b, getPrecisionValue(c.gutter, usv));
  return Duc.TextColumn.endTextColumn(b);
}

function writeParagraphFormatting(b: flatbuffers.Builder, p: DucDocStyle["paragraph"], usv: boolean): number {
  const tabs = Duc.ParagraphFormatting.createTabStopsVector(b, p.tabStops.map((t) => getPrecisionValue(t, usv)));
  Duc.ParagraphFormatting.startParagraphFormatting(b);
  Duc.ParagraphFormatting.addFirstLineIndent(b, getPrecisionValue(p.firstLineIndent, usv));
  Duc.ParagraphFormatting.addHangingIndent(b, getPrecisionValue(p.hangingIndent, usv));
  Duc.ParagraphFormatting.addLeftIndent(b, getPrecisionValue(p.leftIndent, usv));
  Duc.ParagraphFormatting.addRightIndent(b, getPrecisionValue(p.rightIndent, usv));
  Duc.ParagraphFormatting.addSpaceBefore(b, getPrecisionValue(p.spaceBefore, usv));
  Duc.ParagraphFormatting.addSpaceAfter(b, getPrecisionValue(p.spaceAfter, usv));
  Duc.ParagraphFormatting.addTabStops(b, tabs);
  return Duc.ParagraphFormatting.endParagraphFormatting(b);
}

function writeStackFormat(b: flatbuffers.Builder, s: DucDocStyle["stackFormat"], usv: boolean): number {
  const chars = Duc.StackFormat.createStackCharsVector(b, [...s.stackChars].map((c) => b.createString(c)));
  Duc.StackFormatProperties.startStackFormatProperties(b);
  Duc.StackFormatProperties.addUpperScale(b, s.properties.upperScale);
  Duc.StackFormatProperties.addLowerScale(b, s.properties.lowerScale);
  Duc.StackFormatProperties.addAlignment(b, s.properties.alignment);
  const props = Duc.StackFormatProperties.endStackFormatProperties(b);
  Duc.StackFormat.startStackFormat(b);
  Duc.StackFormat.addAutoStack(b, s.autoStack);
  Duc.StackFormat.addStackChars(b, chars);
  Duc.StackFormat.addProperties(b, props);
  return Duc.StackFormat.endStackFormat(b);
}

function writeDocStyle(b: flatbuffers.Builder, s: DucDocStyle, usv: boolean): number {
  const text = writeTextStyle(b, s, usv);
  const para = writeParagraphFormatting(b, s.paragraph, usv);
  const stack = writeStackFormat(b, s.stackFormat, usv);
  Duc.DucDocStyle.startDucDocStyle(b);
  Duc.DucDocStyle.addTextStyle(b, text);
  Duc.DucDocStyle.addParagraph(b, para);
  Duc.DucDocStyle.addStackFormat(b, stack);
  return Duc.DucDocStyle.endDucDocStyle(b);
}

function writeColumnLayout(b: flatbuffers.Builder, c: DucDocElement["columns"], usv: boolean): number {
  const defs = Duc.ColumnLayout.createDefinitionsVector(b, c.definitions.map((d) => writeTextColumn(b, d, usv)));
  Duc.ColumnLayout.startColumnLayout(b);
  Duc.ColumnLayout.addType(b, c.type);
  Duc.ColumnLayout.addDefinitions(b, defs);
  Duc.ColumnLayout.addAutoHeight(b, c.autoHeight);
  return Duc.ColumnLayout.endColumnLayout(b);
}

function writeText(b: flatbuffers.Builder, e: DucTextElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const style = writeTextStyle(b, e, usv);
  const text = str(b, e.text);
  const dynamic = Duc.DucTextElement.createDynamicVector(b, e.dynamic.map((d) => writeTextDynamicPart(b, d, usv)));
  const containerId = str(b, e.containerId ?? undefined);
  const original = str(b, e.originalText);
  Duc.DucTextElement.startDucTextElement(b);
  Duc.DucTextElement.addBase(b, base);
  Duc.DucTextElement.addStyle(b, style);
  if (text) Duc.DucTextElement.addText(b, text);
  Duc.DucTextElement.addDynamic(b, dynamic);
  Duc.DucTextElement.addAutoResize(b, e.autoResize);
  if (containerId) Duc.DucTextElement.addContainerId(b, containerId);
  if (original) Duc.DucTextElement.addOriginalText(b, original);
  return Duc.DucTextElement.endDucTextElement(b);
}

/**
 * Blocks
 */
function writeBlockAttrDef(b: flatbuffers.Builder, d: DucBlockAttributeDefinition, usv: boolean): number {
  const tag = b.createString(d.tag);
  const prompt = b.createString(d.prompt);
  const defVal = b.createString(d.defaultValue);
  Duc.DucBlockAttributeDefinition.startDucBlockAttributeDefinition(b);
  Duc.DucBlockAttributeDefinition.addTag(b, tag);
  Duc.DucBlockAttributeDefinition.addPrompt(b, prompt);
  Duc.DucBlockAttributeDefinition.addDefaultValue(b, defVal);
  Duc.DucBlockAttributeDefinition.addIsConstant(b, d.isConstant);
  return Duc.DucBlockAttributeDefinition.endDucBlockAttributeDefinition(b);
}

function writeBlock(b: flatbuffers.Builder, bl: DucBlock, usv: boolean): number {
  const id = b.createString(bl.id);
  const label = b.createString(bl.label);
  const desc = b.createString(bl.description ?? "");
  const elems = Duc.DucBlock.createElementsVector(b, bl.elements.map((el) => writeElementWrapper(b, el, usv)));
  const defs = Duc.DucBlock.createAttributeDefinitionsVector(
    b,
    Object.entries(bl.attributeDefinitions ?? {}).map(([k, v]) => {
      const key = b.createString(k);
      const val = writeBlockAttrDef(b, v, usv);
      Duc.DucBlockAttributeDefinitionEntry.startDucBlockAttributeDefinitionEntry(b);
      Duc.DucBlockAttributeDefinitionEntry.addKey(b, key);
      Duc.DucBlockAttributeDefinitionEntry.addValue(b, val);
      return Duc.DucBlockAttributeDefinitionEntry.endDucBlockAttributeDefinitionEntry(b);
    }),
  );
  Duc.DucBlock.startDucBlock(b);
  Duc.DucBlock.addId(b, id);
  Duc.DucBlock.addLabel(b, label);
  Duc.DucBlock.addDescription(b, desc);
  Duc.DucBlock.addVersion(b, bl.version);
  Duc.DucBlock.addElements(b, elems);
  Duc.DucBlock.addAttributeDefinitions(b, defs);
  return Duc.DucBlock.endDucBlock(b);
}

function writeBlockInstance(b: flatbuffers.Builder, e: DucBlockInstanceElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const blockId = b.createString(e.blockId);
  const overrides = Duc.DucBlockInstanceElement.createElementOverridesVector(
    b,
    Object.entries(e.elementOverrides ?? {}).map(([k, v]) => writeStringEntry(b, k, v)),
  );
  const attrs = Duc.DucBlockInstanceElement.createAttributeValuesVector(
    b,
    Object.entries(e.attributeValues ?? {}).map(([k, v]) => writeStringEntry(b, k, v)),
  );
  const dup = e.duplicationArray
    ? (() => {
      Duc.DucBlockDuplicationArray.startDucBlockDuplicationArray(b);
      Duc.DucBlockDuplicationArray.addRows(b, e.duplicationArray.rows);
      Duc.DucBlockDuplicationArray.addCols(b, e.duplicationArray.cols);
      Duc.DucBlockDuplicationArray.addRowSpacing(b, getPrecisionValue(e.duplicationArray.rowSpacing, usv));
      Duc.DucBlockDuplicationArray.addColSpacing(b, getPrecisionValue(e.duplicationArray.colSpacing, usv));
      return Duc.DucBlockDuplicationArray.endDucBlockDuplicationArray(b);
    })()
    : undefined;

  Duc.DucBlockInstanceElement.startDucBlockInstanceElement(b);
  Duc.DucBlockInstanceElement.addBase(b, base);
  Duc.DucBlockInstanceElement.addBlockId(b, blockId);
  if (overrides) Duc.DucBlockInstanceElement.addElementOverrides(b, overrides);
  if (attrs) Duc.DucBlockInstanceElement.addAttributeValues(b, attrs);
  if (dup) Duc.DucBlockInstanceElement.addDuplicationArray(b, dup);
  return Duc.DucBlockInstanceElement.endDucBlockInstanceElement(b);
}

/**
 * Stack containers
 */
function writeStackLikeStyles(b: flatbuffers.Builder, s: DucStackLikeStyles, usv: boolean): number {
  const color = b.createString(s.labelingColor);
  Duc.DucStackLikeStyles.startDucStackLikeStyles(b);
  Duc.DucStackLikeStyles.addOpacity(b, s.opacity);
  Duc.DucStackLikeStyles.addLabelingColor(b, color);
  return Duc.DucStackLikeStyles.endDucStackLikeStyles(b);
}

function writeStackBase(b: flatbuffers.Builder, s: _DucStackBase, usv: boolean): number {
  const label = b.createString(s.label);
  const desc = str(b, s.description ?? undefined);
  const styles = writeStackLikeStyles(b, s, usv);
  Duc._DucStackBase.start_DucStackBase(b);
  Duc._DucStackBase.addLabel(b, label);
  if (desc) Duc._DucStackBase.addDescription(b, desc);
  Duc._DucStackBase.addIsCollapsed(b, s.isCollapsed);
  Duc._DucStackBase.addIsPlot(b, s.isPlot);
  Duc._DucStackBase.addIsVisible(b, s.isVisible);
  Duc._DucStackBase.addLocked(b, s.locked);
  Duc._DucStackBase.addStyles(b, styles);
  return Duc._DucStackBase.end_DucStackBase(b);
}

function writeStackElementBase(b: flatbuffers.Builder, s: _DucStackElementBase & _DucStackBase, usv: boolean): number {
  const base = writeElementBase(b, s as unknown as any, usv);
  const stackBase = writeStackBase(b, s, usv);
  const std = str(b, s.standardOverride);
  Duc._DucStackElementBase.start_DucStackElementBase(b);
  Duc._DucStackElementBase.addBase(b, base);
  Duc._DucStackElementBase.addStackBase(b, stackBase);
  Duc._DucStackElementBase.addClip(b, s.clip);
  Duc._DucStackElementBase.addLabelVisible(b, s.labelVisible);
  if (std) Duc._DucStackElementBase.addStandardOverride(b, std);
  return Duc._DucStackElementBase.end_DucStackElementBase(b);
}

function writeFrame(b: flatbuffers.Builder, e: DucFrameElement, usv: boolean): number {
  const base = writeStackElementBase(b, e as unknown as any, usv);
  Duc.DucFrameElement.startDucFrameElement(b);
  Duc.DucFrameElement.addStackElementBase(b, base);
  return Duc.DucFrameElement.endDucFrameElement(b);
}

function writePlotLayout(b: flatbuffers.Builder, l: PlotLayout, usv: boolean): number {
  Duc.Margins.startMargins(b);
  Duc.Margins.addTop(b, getPrecisionValue(l.margins.top, usv));
  Duc.Margins.addRight(b, getPrecisionValue(l.margins.right, usv));
  Duc.Margins.addBottom(b, getPrecisionValue(l.margins.bottom, usv));
  Duc.Margins.addLeft(b, getPrecisionValue(l.margins.left, usv));
  const margins = Duc.Margins.endMargins(b);
  Duc.PlotLayout.startPlotLayout(b);
  Duc.PlotLayout.addMargins(b, margins);
  return Duc.PlotLayout.endPlotLayout(b);
}

function writePlot(b: flatbuffers.Builder, e: DucPlotElement, usv: boolean): number {
  const stackBase = writeStackElementBase(b, e as unknown as any, usv);
  const plotStyle = (() => {
    Duc.DucPlotStyle.startDucPlotStyle(b);
    return Duc.DucPlotStyle.endDucPlotStyle(b);
  })();
  const layout = writePlotLayout(b, e.layout, usv);
  Duc.DucPlotElement.startDucPlotElement(b);
  Duc.DucPlotElement.addStackElementBase(b, stackBase);
  Duc.DucPlotElement.addStyle(b, plotStyle);
  Duc.DucPlotElement.addLayout(b, layout);
  return Duc.DucPlotElement.endDucPlotElement(b);
}

/**
 * Views / Viewports / XRay
 */
function writeView(b: flatbuffers.Builder, v: DucView, usv: boolean): number {
  const center = writeDucPoint(b, v.centerPoint, usv);
  const scope = b.createString(v.scope);
  Duc.DucView.startDucView(b);
  Duc.DucView.addScrollX(b, getPrecisionValue(v.scrollX, usv));
  Duc.DucView.addScrollY(b, getPrecisionValue(v.scrollY, usv));
  Duc.DucView.addZoom(b, v.zoom.value);
  Duc.DucView.addTwistAngle(b, v.twistAngle);
  if (center) Duc.DucView.addCenterPoint(b, center);
  Duc.DucView.addScope(b, scope);
  return Duc.DucView.endDucView(b);
}

function writeViewportStyle(b: flatbuffers.Builder, s: DucViewportStyle, usv: boolean): number {
  Duc.DucViewportStyle.startDucViewportStyle(b);
  Duc.DucViewportStyle.addScaleIndicatorVisible(b, s.scaleIndicatorVisible);
  return Duc.DucViewportStyle.endDucViewportStyle(b);
}

function writeViewport(b: flatbuffers.Builder, e: DucViewportElement, usv: boolean): number {
  const linear = writeLinearBase(b, e as unknown as any, usv);
  const stackBase = writeStackBase(b, e as unknown as any, usv);
  const style = writeViewportStyle(b, e, usv);
  const view = writeView(b, e.view, usv);
  const frozen = e.frozenGroupIds?.length ? Duc.DucViewportElement.createFrozenGroupIdsVector(b, e.frozenGroupIds.map((id) => b.createString(id))) : undefined;
  const std = str(b, e.standardOverride);
  Duc.DucViewportElement.startDucViewportElement(b);
  Duc.DucViewportElement.addLinearBase(b, linear);
  Duc.DucViewportElement.addStackBase(b, stackBase);
  Duc.DucViewportElement.addStyle(b, style);
  Duc.DucViewportElement.addView(b, view);
  Duc.DucViewportElement.addScale(b, e.scale);
  if (e.shadePlot !== undefined) Duc.DucViewportElement.addShadePlot(b, e.shadePlot);
  if (frozen) Duc.DucViewportElement.addFrozenGroupIds(b, frozen);
  if (std) Duc.DucViewportElement.addStandardOverride(b, std);
  return Duc.DucViewportElement.endDucViewportElement(b);
}

function writeXRayStyle(b: flatbuffers.Builder, s: DucXRayStyle, usv: boolean): number {
  const color = b.createString(s.color);
  Duc.DucXRayStyle.startDucXRayStyle(b);
  Duc.DucXRayStyle.addColor(b, color);
  return Duc.DucXRayStyle.endDucXRayStyle(b);
}

function writeXRay(b: flatbuffers.Builder, e: DucXRayElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const style = writeXRayStyle(b, e, usv);
  const origin = writeDucPoint(b, e.origin, usv);
  const direction = writeDucPoint(b, e.direction, usv);
  Duc.DucXRayElement.startDucXRayElement(b);
  Duc.DucXRayElement.addBase(b, base);
  Duc.DucXRayElement.addStyle(b, style);
  if (origin) Duc.DucXRayElement.addOrigin(b, origin);
  if (direction) Duc.DucXRayElement.addDirection(b, direction);
  Duc.DucXRayElement.addStartFromOrigin(b, e.startFromOrigin);
  return Duc.DucXRayElement.endDucXRayElement(b);
}

/**
 * Leader & Dimension & FCF
 */
function writeLeaderContent(b: flatbuffers.Builder, c: LeaderContent | null, usv: boolean): number | undefined {
  if (!c) return undefined;
  let contentOffset: number;
  let contentType: Duc.LeaderContentData;

  if (c.type === "text") {
    const text = b.createString(c.text);
    Duc.LeaderTextBlockContent.startLeaderTextBlockContent(b);
    Duc.LeaderTextBlockContent.addText(b, text);
    contentOffset = Duc.LeaderTextBlockContent.endLeaderTextBlockContent(b);
    contentType = Duc.LeaderContentData.LeaderTextBlockContent;
  } else {
    const attrs = Duc.LeaderBlockContent.createAttributeValuesVector(b, Object.entries(c.instanceData.attributeValues ?? {}).map(([k, v]) => writeStringEntry(b, k, v)));
    const overrides = Duc.LeaderBlockContent.createElementOverridesVector(b, Object.entries(c.instanceData.elementOverrides ?? {}).map(([k, v]) => writeStringEntry(b, k, v)));
    const blockId = b.createString(c.blockId);
    Duc.LeaderBlockContent.startLeaderBlockContent(b);
    Duc.LeaderBlockContent.addBlockId(b, blockId);
    if (attrs) Duc.LeaderBlockContent.addAttributeValues(b, attrs);
    if (overrides) Duc.LeaderBlockContent.addElementOverrides(b, overrides);
    contentOffset = Duc.LeaderBlockContent.endLeaderBlockContent(b);
    contentType = Duc.LeaderContentData.LeaderBlockContent;
  }

  Duc.LeaderContent.startLeaderContent(b);
  Duc.LeaderContent.addLeaderContentType(b, Duc.LEADER_CONTENT_TYPE[c.type.toUpperCase() as keyof typeof Duc.LEADER_CONTENT_TYPE] as Duc.LEADER_CONTENT_TYPE);
  Duc.LeaderContent.addContentType(b, contentType);
  Duc.LeaderContent.addContent(b, contentOffset);
  return Duc.LeaderContent.endLeaderContent(b);
}

function writeLeaderStyle(b: flatbuffers.Builder, s: DucLeaderStyle, usv: boolean): number {
  const text = writeTextStyle(b, s.textStyle, usv);
  const heads = s.headsOverride ? Duc.DucLeaderStyle.createHeadsOverrideVector(b, s.headsOverride.map((h) => writeHead(b, h, usv)!)) : undefined;
  Duc.DucLeaderStyle.startDucLeaderStyle(b);
  if (heads) Duc.DucLeaderStyle.addHeadsOverride(b, heads);
  if (s.dogleg !== undefined) Duc.DucLeaderStyle.addDogleg(b, getPrecisionValue(s.dogleg, usv));
  Duc.DucLeaderStyle.addTextStyle(b, text);
  if (s.textAttachment !== undefined) Duc.DucLeaderStyle.addTextAttachment(b, s.textAttachment);
  if (s.blockAttachment !== undefined) Duc.DucLeaderStyle.addBlockAttachment(b, s.blockAttachment);
  return Duc.DucLeaderStyle.endDucLeaderStyle(b);
}

function writeLeader(b: flatbuffers.Builder, e: DucLeaderElement, usv: boolean): number {
  const linear = writeLinearBase(b, e as unknown as any, usv);
  const style = writeLeaderStyle(b, e, usv);
  const content = writeLeaderContent(b, e.leaderContent, usv);
  const anchor = writeGeomPoint(b, e.contentAnchor, usv);
  Duc.DucLeaderElement.startDucLeaderElement(b);
  Duc.DucLeaderElement.addLinearBase(b, linear);
  Duc.DucLeaderElement.addStyle(b, style);
  if (content) Duc.DucLeaderElement.addContent(b, content);
  if (anchor) Duc.DucLeaderElement.addContentAnchor(b, anchor);
  return Duc.DucLeaderElement.endDucLeaderElement(b);
}

function writeDimDefPoints(b: flatbuffers.Builder, d: DimensionDefinitionPoints, usv: boolean): number {
  const o1 = writeGeomPoint(b, d.origin1, usv);
  const o2 = d.origin2 ? writeGeomPoint(b, d.origin2, usv) : undefined;
  const loc = writeGeomPoint(b, d.location, usv);
  const center = d.center ? writeGeomPoint(b, d.center, usv) : undefined;
  const jog = d.jog ? writeGeomPoint(b, d.jog, usv) : undefined;
  Duc.DimensionDefinitionPoints.startDimensionDefinitionPoints(b);
  if (o1) Duc.DimensionDefinitionPoints.addOrigin1(b, o1);
  if (o2) Duc.DimensionDefinitionPoints.addOrigin2(b, o2);
  if (loc) Duc.DimensionDefinitionPoints.addLocation(b, loc);
  if (center) Duc.DimensionDefinitionPoints.addCenter(b, center);
  if (jog) Duc.DimensionDefinitionPoints.addJog(b, jog);
  return Duc.DimensionDefinitionPoints.endDimensionDefinitionPoints(b);
}

function writeDimBindings(b: flatbuffers.Builder, d: DucDimensionElement["bindings"] | undefined, usv: boolean): number | undefined {
  if (!d) return undefined;
  const o1 = d.origin1 ? writePointBinding(b, d.origin1, usv) : undefined;
  const o2 = d.origin2 ? writePointBinding(b, d.origin2, usv) : undefined;
  const c = d.center ? writePointBinding(b, d.center, usv) : undefined;
  Duc.DimensionBindings.startDimensionBindings(b);
  if (o1) Duc.DimensionBindings.addOrigin1(b, o1);
  if (o2) Duc.DimensionBindings.addOrigin2(b, o2);
  if (c) Duc.DimensionBindings.addCenter(b, c);
  return Duc.DimensionBindings.endDimensionBindings(b);
}

function writeDimTolStyle(b: flatbuffers.Builder, t: DucDimensionStyle["tolerance"], usv: boolean): number {
  const textStyle = writeTextStyle(b, t.textStyle as DucTextStyle, usv);
  Duc.DimensionToleranceStyle.startDimensionToleranceStyle(b);
  Duc.DimensionToleranceStyle.addEnabled(b, t.enabled);
  Duc.DimensionToleranceStyle.addDisplayMethod(b, t.displayMethod);
  Duc.DimensionToleranceStyle.addUpperValue(b, t.upperValue);
  Duc.DimensionToleranceStyle.addLowerValue(b, t.lowerValue);
  Duc.DimensionToleranceStyle.addPrecision(b, t.precision);
  Duc.DimensionToleranceStyle.addTextStyle(b, textStyle);
  return Duc.DimensionToleranceStyle.endDimensionToleranceStyle(b);
}

function writeDimLineStyle(b: flatbuffers.Builder, s: DucDimensionStyle["dimLine"], usv: boolean): number {
  const st = writeElementStroke(b, s.stroke, usv);
  Duc.DimensionLineStyle.startDimensionLineStyle(b);
  if (st) Duc.DimensionLineStyle.addStroke(b, st);
  Duc.DimensionLineStyle.addTextGap(b, getPrecisionValue(s.textGap, usv));
  return Duc.DimensionLineStyle.endDimensionLineStyle(b);
}

function writeExtLineStyle(b: flatbuffers.Builder, s: DucDimensionStyle["extLine"], usv: boolean): number {
  const st = writeElementStroke(b, s.stroke, usv);
  Duc.DimensionExtLineStyle.startDimensionExtLineStyle(b);
  if (st) Duc.DimensionExtLineStyle.addStroke(b, st);
  Duc.DimensionExtLineStyle.addOvershoot(b, getPrecisionValue(s.overshoot, usv));
  Duc.DimensionExtLineStyle.addOffset(b, getPrecisionValue(s.offset, usv));
  return Duc.DimensionExtLineStyle.endDimensionExtLineStyle(b);
}

function writeDimSymbolStyle(b: flatbuffers.Builder, s: DucDimensionStyle["symbols"], usv: boolean): number {
  const heads = s.headsOverride ? Duc.DimensionSymbolStyle.createHeadsOverrideVector(b, s.headsOverride.map((h) => writeHead(b, h, usv)!)) : undefined;
  Duc.DimensionSymbolStyle.startDimensionSymbolStyle(b);
  if (heads) Duc.DimensionSymbolStyle.addHeadsOverride(b, heads);
  Duc.DimensionSymbolStyle.addCenterMarkType(b, s.centerMark.type);
  Duc.DimensionSymbolStyle.addCenterMarkSize(b, getPrecisionValue(s.centerMark.size, usv));
  return Duc.DimensionSymbolStyle.endDimensionSymbolStyle(b);
}

function writeDimStyle(b: flatbuffers.Builder, s: DucDimensionStyle, usv: boolean): number {
  const dim = writeDimLineStyle(b, s.dimLine, usv);
  const ext = writeExtLineStyle(b, s.extLine, usv);
  const text = writeTextStyle(b, s.textStyle, usv);
  const sym = writeDimSymbolStyle(b, s.symbols, usv);
  const tol = writeDimTolStyle(b, s.tolerance, usv);
  const fit = (() => {
    Duc.DimensionFitStyle.startDimensionFitStyle(b);
    Duc.DimensionFitStyle.addRule(b, s.fit.rule);
    Duc.DimensionFitStyle.addTextPlacement(b, s.fit.textPlacement);
    Duc.DimensionFitStyle.addForceTextInside(b, s.fit.forceTextInside);
    return Duc.DimensionFitStyle.endDimensionFitStyle(b);
  })();
  Duc.DucDimensionStyle.startDucDimensionStyle(b);
  Duc.DucDimensionStyle.addDimLine(b, dim);
  Duc.DucDimensionStyle.addExtLine(b, ext);
  Duc.DucDimensionStyle.addTextStyle(b, text);
  Duc.DucDimensionStyle.addSymbols(b, sym);
  Duc.DucDimensionStyle.addTolerance(b, tol);
  Duc.DucDimensionStyle.addFit(b, fit);
  return Duc.DucDimensionStyle.endDucDimensionStyle(b);
}

function writeDimension(b: flatbuffers.Builder, e: DucDimensionElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const style = writeDimStyle(b, e, usv);
  const def = writeDimDefPoints(b, e.definitionPoints, usv);
  const bindings = writeDimBindings(b, e.bindings, usv);
  const textOverride = e.textOverride != null ? b.createString(e.textOverride) : undefined;
  const textPos = e.textPosition ? writeGeomPoint(b, e.textPosition, usv) : undefined;
  const tolOverride = e.toleranceOverride ? writeDimTolStyle(b, e.toleranceOverride as any, usv) : undefined;
  const baseline = e.baselineData
    ? (() => {
      Duc.DimensionBaselineData.startDimensionBaselineData(b);
      Duc.DimensionBaselineData.addBaseDimensionId(b, b.createString(e.baselineData.baseDimensionId));
      return Duc.DimensionBaselineData.endDimensionBaselineData(b);
    })()
    : undefined;
  const cont = e.continueData
    ? (() => {
      Duc.DimensionContinueData.startDimensionContinueData(b);
      Duc.DimensionContinueData.addContinueFromDimensionId(b, b.createString(e.continueData.continueFromDimensionId));
      return Duc.DimensionContinueData.endDimensionContinueData(b);
    })()
    : undefined;

  Duc.DucDimensionElement.startDucDimensionElement(b);
  Duc.DucDimensionElement.addBase(b, base);
  Duc.DucDimensionElement.addStyle(b, style);
  Duc.DucDimensionElement.addDimensionType(b, e.dimensionType);
  Duc.DucDimensionElement.addDefinitionPoints(b, def);
  Duc.DucDimensionElement.addObliqueAngle(b, e.obliqueAngle);
  if (e.ordinateAxis) Duc.DucDimensionElement.addOrdinateAxis(b, e.ordinateAxis);
  if (bindings) Duc.DucDimensionElement.addBindings(b, bindings);
  if (textOverride) Duc.DucDimensionElement.addTextOverride(b, textOverride);
  if (textPos) Duc.DucDimensionElement.addTextPosition(b, textPos);
  if (tolOverride) Duc.DucDimensionElement.addToleranceOverride(b, tolOverride);
  if (baseline) Duc.DucDimensionElement.addBaselineData(b, baseline);
  if (cont) Duc.DucDimensionElement.addContinueData(b, cont);
  return Duc.DucDimensionElement.endDucDimensionElement(b);
}

function writeDatumRef(b: flatbuffers.Builder, d: DatumReference, usv: boolean): number {
  const letters = b.createString(d.letters);
  Duc.DatumReference.startDatumReference(b);
  Duc.DatumReference.addLetters(b, letters);
  if (d.modifier) Duc.DatumReference.addModifier(b, d.modifier);
  return Duc.DatumReference.endDatumReference(b);
}

function writeToleranceClause(b: flatbuffers.Builder, t: ToleranceClause, usv: boolean): number {
  const value = b.createString(t.value);
  const featureMods = t.featureModifiers?.length
    ? Duc.ToleranceClause.createFeatureModifiersVector(b, t.featureModifiers.map((f) => f))
    : undefined;
  Duc.ToleranceClause.startToleranceClause(b);
  Duc.ToleranceClause.addValue(b, value);
  if (t.zoneType) Duc.ToleranceClause.addZoneType(b, t.zoneType);
  if (featureMods) Duc.ToleranceClause.addFeatureModifiers(b, featureMods);
  if (t.materialCondition) Duc.ToleranceClause.addMaterialCondition(b, t.materialCondition);
  return Duc.ToleranceClause.endToleranceClause(b);
}

function writeFcfSegment(b: flatbuffers.Builder, s: FeatureControlFrameSegment, usv: boolean): number {
  const tol = writeToleranceClause(b, s.tolerance, usv);
  const datums = s.datums?.length ? Duc.FeatureControlFrameSegment.createDatumsVector(b, s.datums.filter(Boolean).map((d) => writeDatumRef(b, d!, usv))) : undefined;
  Duc.FeatureControlFrameSegment.startFeatureControlFrameSegment(b);
  Duc.FeatureControlFrameSegment.addSymbol(b, s.symbol);
  Duc.FeatureControlFrameSegment.addTolerance(b, tol);
  if (datums) Duc.FeatureControlFrameSegment.addDatums(b, datums);
  return Duc.FeatureControlFrameSegment.endFeatureControlFrameSegment(b);
}

function writeFcfSegmentRow(b: flatbuffers.Builder, row: readonly FeatureControlFrameSegment[], usv: boolean): number {
  const segs = Duc.FCFSegmentRow.createSegmentsVector(b, row.map((s) => writeFcfSegment(b, s, usv)));
  Duc.FCFSegmentRow.startFCFSegmentRow(b);
  Duc.FCFSegmentRow.addSegments(b, segs);
  return Duc.FCFSegmentRow.endFCFSegmentRow(b);
}

function writeFcfBetween(b: flatbuffers.Builder, v: { start: string; end: string }, usv: boolean): number {
  const s = b.createString(v.start);
  const e = b.createString(v.end);
  Duc.FCFBetweenModifier.startFCFBetweenModifier(b);
  Duc.FCFBetweenModifier.addStart(b, s);
  Duc.FCFBetweenModifier.addEnd(b, e);
  return Duc.FCFBetweenModifier.endFCFBetweenModifier(b);
}

function writeProjectedZone(b: flatbuffers.Builder, v: PrecisionValue, usv: boolean): number {
  Duc.FCFProjectedZoneModifier.startFCFProjectedZoneModifier(b);
  Duc.FCFProjectedZoneModifier.addValue(b, getPrecisionValue(v, usv));
  return Duc.FCFProjectedZoneModifier.endFCFProjectedZoneModifier(b);
}

function writeFcfFrameModifiers(b: flatbuffers.Builder, m: DucFeatureControlFrameElement["frameModifiers"] | undefined, usv: boolean): number | undefined {
  if (!m) return undefined;
  Duc.FCFFrameModifiers.startFCFFrameModifiers(b);
  if (m.allAround !== undefined) Duc.FCFFrameModifiers.addAllAround(b, m.allAround);
  if (m.allOver !== undefined) Duc.FCFFrameModifiers.addAllOver(b, m.allOver);
  if (m.continuousFeature !== undefined) Duc.FCFFrameModifiers.addContinuousFeature(b, m.continuousFeature);
  if (m.between) Duc.FCFFrameModifiers.addBetween(b, writeFcfBetween(b, m.between, usv));
  if (m.projectedToleranceZone) Duc.FCFFrameModifiers.addProjectedToleranceZone(b, writeProjectedZone(b, m.projectedToleranceZone, usv));
  return Duc.FCFFrameModifiers.endFCFFrameModifiers(b);
}

function writeFcfDatumDefinition(b: flatbuffers.Builder, d: DucFeatureControlFrameElement["datumDefinition"] | undefined, usv: boolean): number | undefined {
  if (!d) return undefined;
  const letter = b.createString(d.letter);
  const binding = d.featureBinding ? writePointBinding(b, d.featureBinding, usv) : undefined;
  Duc.FCFDatumDefinition.startFCFDatumDefinition(b);
  Duc.FCFDatumDefinition.addLetter(b, letter);
  if (binding) Duc.FCFDatumDefinition.addFeatureBinding(b, binding);
  return Duc.FCFDatumDefinition.endFCFDatumDefinition(b);
}

function writeFcfStyle(b: flatbuffers.Builder, s: DucFeatureControlFrameStyle, usv: boolean): number {
  const text = writeTextStyle(b, s.textStyle, usv);
  const layout = (() => {
    Duc.FCFLayoutStyle.startFCFLayoutStyle(b);
    Duc.FCFLayoutStyle.addPadding(b, getPrecisionValue(s.layout.padding, usv));
    Duc.FCFLayoutStyle.addSegmentSpacing(b, getPrecisionValue(s.layout.segmentSpacing, usv));
    Duc.FCFLayoutStyle.addRowSpacing(b, getPrecisionValue(s.layout.rowSpacing, usv));
    return Duc.FCFLayoutStyle.endFCFLayoutStyle(b);
  })();
  const sym = (() => {
    Duc.FCFSymbolStyle.startFCFSymbolStyle(b);
    Duc.FCFSymbolStyle.addScale(b, s.symbols.scale);
    return Duc.FCFSymbolStyle.endFCFSymbolStyle(b);
  })();
  const datum = (() => {
    Duc.FCFDatumStyle.startFCFDatumStyle(b);
    Duc.FCFDatumStyle.addBracketStyle(b, s.datumStyle.bracketStyle);
    return Duc.FCFDatumStyle.endFCFDatumStyle(b);
  })();
  Duc.DucFeatureControlFrameStyle.startDucFeatureControlFrameStyle(b);
  Duc.DucFeatureControlFrameStyle.addTextStyle(b, text);
  Duc.DucFeatureControlFrameStyle.addLayout(b, layout);
  Duc.DucFeatureControlFrameStyle.addSymbols(b, sym);
  Duc.DucFeatureControlFrameStyle.addDatumStyle(b, datum);
  return Duc.DucFeatureControlFrameStyle.endDucFeatureControlFrameStyle(b);
}

function writeFcf(b: flatbuffers.Builder, e: DucFeatureControlFrameElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const style = writeFcfStyle(b, e, usv);
  const rows = Duc.DucFeatureControlFrameElement.createRowsVector(b, e.rows.map((r) => writeFcfSegmentRow(b, r, usv)));
  const mods = writeFcfFrameModifiers(b, e.frameModifiers, usv);
  const leaderId = e.leaderElementId ? b.createString(e.leaderElementId) : undefined;
  const datumDef = writeFcfDatumDefinition(b, e.datumDefinition, usv);
  Duc.DucFeatureControlFrameElement.startDucFeatureControlFrameElement(b);
  Duc.DucFeatureControlFrameElement.addBase(b, base);
  Duc.DucFeatureControlFrameElement.addStyle(b, style);
  Duc.DucFeatureControlFrameElement.addRows(b, rows);
  if (mods) Duc.DucFeatureControlFrameElement.addFrameModifiers(b, mods);
  if (leaderId) Duc.DucFeatureControlFrameElement.addLeaderElementId(b, leaderId);
  if (datumDef) Duc.DucFeatureControlFrameElement.addDatumDefinition(b, datumDef);
  return Duc.DucFeatureControlFrameElement.endDucFeatureControlFrameElement(b);
}

/**
 * Doc element
 */
function writeDoc(b: flatbuffers.Builder, e: DucDocElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const style = writeDocStyle(b, e, usv);
  const text = b.createString(e.text);
  const dynamic = Duc.DucDocElement.createDynamicVector(b, e.dynamic.map((d) => writeTextDynamicPart(b, d, usv)));
  const columns = (() => {
    const col = e.columns;
    const defs = Duc.ColumnLayout.createDefinitionsVector(b, col.definitions.map((d) => writeTextColumn(b, d, usv)));
    Duc.ColumnLayout.startColumnLayout(b);
    Duc.ColumnLayout.addType(b, col.type);
    Duc.ColumnLayout.addDefinitions(b, defs);
    Duc.ColumnLayout.addAutoHeight(b, col.autoHeight);
    return Duc.ColumnLayout.endColumnLayout(b);
  })();
  Duc.DucDocElement.startDucDocElement(b);
  Duc.DucDocElement.addBase(b, base);
  Duc.DucDocElement.addStyle(b, style);
  Duc.DucDocElement.addText(b, text);
  Duc.DucDocElement.addDynamic(b, dynamic);
  Duc.DucDocElement.addFlowDirection(b, e.flowDirection);
  Duc.DucDocElement.addColumns(b, columns);
  Duc.DucDocElement.addAutoResize(b, e.autoResize);
  return Duc.DucDocElement.endDucDocElement(b);
}

/**
 * Parametric, PDF, Mermaid, Embeddable
 */
function writeParametricSource(b: flatbuffers.Builder, s: ParametricElementSource, usv: boolean): number {
  Duc.ParametricSource.startParametricSource(b);
  Duc.ParametricSource.addType(b, s.type);
  if (s.type === Duc.PARAMETRIC_SOURCE_TYPE.CODE) {
    Duc.ParametricSource.addCode(b, b.createString(s.code));
  } else {
    Duc.ParametricSource.addFileId(b, b.createString(s.fileId));
  }
  return Duc.ParametricSource.endParametricSource(b);
}

function writeParametric(b: flatbuffers.Builder, e: DucParametricElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const src = writeParametricSource(b, e.source, usv);
  Duc.DucParametricElement.startDucParametricElement(b);
  Duc.DucParametricElement.addBase(b, base);
  Duc.DucParametricElement.addSource(b, src);
  return Duc.DucParametricElement.endDucParametricElement(b);
}

function writePdf(b: flatbuffers.Builder, e: DucPdfElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const fileId = b.createString(e.fileId);
  Duc.DucPdfElement.startDucPdfElement(b);
  Duc.DucPdfElement.addBase(b, base);
  Duc.DucPdfElement.addFileId(b, fileId);
  return Duc.DucPdfElement.endDucPdfElement(b);
}

function writeMermaid(b: flatbuffers.Builder, e: DucMermaidElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const src = b.createString(e.source);
  const theme = e.theme ? b.createString(e.theme) : undefined;
  const svg = e.svgPath ? b.createString(e.svgPath) : undefined;
  Duc.DucMermaidElement.startDucMermaidElement(b);
  Duc.DucMermaidElement.addBase(b, base);
  Duc.DucMermaidElement.addSource(b, src);
  if (theme) Duc.DucMermaidElement.addTheme(b, theme);
  if (svg) Duc.DucMermaidElement.addSvgPath(b, svg);
  return Duc.DucMermaidElement.endDucMermaidElement(b);
}

function writeEmbeddable(b: flatbuffers.Builder, e: DucEmbeddableElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  Duc.DucEmbeddableElement.startDucEmbeddableElement(b);
  Duc.DucEmbeddableElement.addBase(b, base);
  return Duc.DucEmbeddableElement.endDucEmbeddableElement(b);
}

/**
 * Table
 */
function writeTableCellStyle(b: flatbuffers.Builder, s: DucTableCellStyle, usv: boolean): number {
  const base = writeStylesBase(b, s, usv);
  const text = writeTextStyle(b, s.textStyle, usv);
  Duc.Margins.startMargins(b);
  Duc.Margins.addTop(b, getPrecisionValue(s.margins.top, usv));
  Duc.Margins.addRight(b, getPrecisionValue(s.margins.right, usv));
  Duc.Margins.addBottom(b, getPrecisionValue(s.margins.bottom, usv));
  Duc.Margins.addLeft(b, getPrecisionValue(s.margins.left, usv));
  const margins = Duc.Margins.endMargins(b);
  Duc.DucTableCellStyle.startDucTableCellStyle(b);
  if (base) {
    Duc.DucTableCellStyle.addBaseStyle(b, base);
  }
  Duc.DucTableCellStyle.addTextStyle(b, text);
  Duc.DucTableCellStyle.addMargins(b, margins);
  Duc.DucTableCellStyle.addAlignment(b, s.alignment);
  return Duc.DucTableCellStyle.endDucTableCellStyle(b);
}

function writeTableStyle(b: flatbuffers.Builder, s: DucTableStyle, usv: boolean): number {
  const header = writeTableCellStyle(b, s.headerRowStyle, usv);
  const dataRow = writeTableCellStyle(b, s.dataRowStyle, usv);
  const dataCol = writeTableCellStyle(b, s.dataColumnStyle, usv);
  Duc.DucTableStyle.startDucTableStyle(b);
  Duc.DucTableStyle.addFlowDirection(b, s.flowDirection);
  Duc.DucTableStyle.addHeaderRowStyle(b, header);
  Duc.DucTableStyle.addDataRowStyle(b, dataRow);
  Duc.DucTableStyle.addDataColumnStyle(b, dataCol);
  return Duc.DucTableStyle.endDucTableStyle(b);
}

function writeTable(b: flatbuffers.Builder, e: DucTableElement, usv: boolean): number {
  const base = writeElementBase(b, e as unknown as any, usv);
  const style = writeTableStyle(b, e, usv);
  const colOrder = Duc.DucTableElement.createColumnOrderVector(b, e.columnOrder.map((id) => b.createString(id)));
  const rowOrder = Duc.DucTableElement.createRowOrderVector(b, e.rowOrder.map((id) => b.createString(id)));
  const columns = Duc.DucTableElement.createColumnsVector(
    b,
    Object.entries(e.columns).map(([k, v]) => {
      const key = b.createString(k);
      const val = (() => {
        const id = b.createString(v.id);
        Duc.DucTableColumn.startDucTableColumn(b);
        Duc.DucTableColumn.addId(b, id);
        Duc.DucTableColumn.addWidth(b, getPrecisionValue(v.width, usv));
        const styleOverrides = v.styleOverrides ? writeTableCellStyle(b, v.styleOverrides as DucTableCellStyle, usv) : undefined;
        if (styleOverrides) Duc.DucTableColumn.addStyleOverrides(b, styleOverrides);
        return Duc.DucTableColumn.endDucTableColumn(b);
      })();
      Duc.DucTableColumnEntry.startDucTableColumnEntry(b);
      Duc.DucTableColumnEntry.addKey(b, key);
      Duc.DucTableColumnEntry.addValue(b, val);
      return Duc.DucTableColumnEntry.endDucTableColumnEntry(b);
    }),
  );
  const rows = Duc.DucTableElement.createRowsVector(
    b,
    Object.entries(e.rows).map(([k, v]) => {
      const key = b.createString(k);
      const val = (() => {
        const id = b.createString(v.id);
        Duc.DucTableRow.startDucTableRow(b);
        Duc.DucTableRow.addId(b, id);
        Duc.DucTableRow.addHeight(b, getPrecisionValue(v.height, usv));
        const styleOverrides = v.styleOverrides ? writeTableCellStyle(b, v.styleOverrides as DucTableCellStyle, usv) : undefined;
        if (styleOverrides) Duc.DucTableRow.addStyleOverrides(b, styleOverrides);
        return Duc.DucTableRow.endDucTableRow(b);
      })();
      Duc.DucTableRowEntry.startDucTableRowEntry(b);
      Duc.DucTableRowEntry.addKey(b, key);
      Duc.DucTableRowEntry.addValue(b, val);
      return Duc.DucTableRowEntry.endDucTableRowEntry(b);
    }),
  );
  const cells = Duc.DucTableElement.createCellsVector(
    b,
    Object.entries(e.cells).map(([k, v]) => {
      const key = b.createString(k);
      const val = (() => {
        const row = b.createString(v.rowId);
        const col = b.createString(v.columnId);
        const data = b.createString(v.data);
        const span = v.span
          ? (() => {
            Duc.DucTableCellSpan.startDucTableCellSpan(b);
            Duc.DucTableCellSpan.addColumns(b, v.span!.columns);
            Duc.DucTableCellSpan.addRows(b, v.span!.rows);
            return Duc.DucTableCellSpan.endDucTableCellSpan(b);
          })()
          : undefined;
        const styleOverrides = v.styleOverrides ? writeTableCellStyle(b, v.styleOverrides as DucTableCellStyle, usv) : undefined;
        Duc.DucTableCell.startDucTableCell(b);
        Duc.DucTableCell.addRowId(b, row);
        Duc.DucTableCell.addColumnId(b, col);
        Duc.DucTableCell.addData(b, data);
        if (span !== undefined) Duc.DucTableCell.addSpan(b, span);
        Duc.DucTableCell.addLocked(b, v.locked);
        if (styleOverrides) Duc.DucTableCell.addStyleOverrides(b, styleOverrides);
        return Duc.DucTableCell.endDucTableCell(b);
      })();
      Duc.DucTableCellEntry.startDucTableCellEntry(b);
      Duc.DucTableCellEntry.addKey(b, key);
      Duc.DucTableCellEntry.addValue(b, val);
      return Duc.DucTableCellEntry.endDucTableCellEntry(b);
    }),
  );
  const autoSize = (() => {
    Duc.DucTableAutoSize.startDucTableAutoSize(b);
    Duc.DucTableAutoSize.addColumns(b, e.autoSize.columns);
    Duc.DucTableAutoSize.addRows(b, e.autoSize.rows);
    return Duc.DucTableAutoSize.endDucTableAutoSize(b);
  })();

  Duc.DucTableElement.startDucTableElement(b);
  Duc.DucTableElement.addBase(b, base);
  Duc.DucTableElement.addStyle(b, style);
  Duc.DucTableElement.addColumnOrder(b, colOrder);
  Duc.DucTableElement.addRowOrder(b, rowOrder);
  Duc.DucTableElement.addColumns(b, columns);
  Duc.DucTableElement.addRows(b, rows);
  Duc.DucTableElement.addCells(b, cells);
  Duc.DucTableElement.addHeaderRowCount(b, e.headerRowCount);
  Duc.DucTableElement.addAutoSize(b, autoSize);
  return Duc.DucTableElement.endDucTableElement(b);
}

/**
 * Element wrapper
 */
function writeElementWrapper(b: flatbuffers.Builder, e: DucElement, usv: boolean): number {
  let elem: number;
  let type: Duc.Element;

  switch (e.type) {
    case "rectangle":
      type = Duc.Element.DucRectangleElement;
      elem = writeRect(b, e, usv);
      break;
    case "polygon":
      type = Duc.Element.DucPolygonElement;
      elem = writePolygon(b, e, usv);
      break;
    case "ellipse":
      type = Duc.Element.DucEllipseElement;
      elem = writeEllipse(b, e, usv);
      break;
    case "line":
      type = Duc.Element.DucLinearElement;
      elem = writeLinear(b, e, usv);
      break;
    case "text":
      type = Duc.Element.DucTextElement;
      elem = writeText(b, e, usv);
      break;
    case "arrow":
      type = Duc.Element.DucArrowElement;
      elem = writeArrow(b, e, usv);
      break;
    case "freedraw":
      type = Duc.Element.DucFreeDrawElement;
      elem = writeFreeDraw(b, e, usv);
      break;
    case "image":
      type = Duc.Element.DucImageElement;
      elem = writeImage(b, e, usv);
      break;
    case "table":
      type = Duc.Element.DucTableElement;
      elem = writeTable(b, e, usv);
      break;
    case "blockinstance":
      type = Duc.Element.DucBlockInstanceElement;
      elem = writeBlockInstance(b, e, usv);
      break;
    case "frame":
      type = Duc.Element.DucFrameElement;
      elem = writeFrame(b, e, usv);
      break;
    case "plot":
      type = Duc.Element.DucPlotElement;
      elem = writePlot(b, e, usv);
      break;
    case "viewport":
      type = Duc.Element.DucViewportElement;
      elem = writeViewport(b, e, usv);
      break;
    case "xray":
      type = Duc.Element.DucXRayElement;
      elem = writeXRay(b, e, usv);
      break;
    case "leader":
      type = Duc.Element.DucLeaderElement;
      elem = writeLeader(b, e, usv);
      break;
    case "dimension":
      type = Duc.Element.DucDimensionElement;
      elem = writeDimension(b, e, usv);
      break;
    case "featurecontrolframe":
      type = Duc.Element.DucFeatureControlFrameElement;
      elem = writeFcf(b, e, usv);
      break;
    case "doc":
      type = Duc.Element.DucDocElement;
      elem = writeDoc(b, e, usv);
      break;
    case "parametric":
      type = Duc.Element.DucParametricElement;
      elem = writeParametric(b, e, usv);
      break;
    case "embeddable":
      type = Duc.Element.DucEmbeddableElement;
      elem = writeEmbeddable(b, e, usv);
      break;
    case "pdf":
      type = Duc.Element.DucPdfElement;
      elem = writePdf(b, e, usv);
      break;
    case "mermaid":
      type = Duc.Element.DucMermaidElement;
      elem = writeMermaid(b, e, usv);
      break;
    default:
      throw new Error(`Unknown element type: ${(e as any).type}`);
  }

  // Safety check to ensure elem is defined
  if (elem === undefined) {
    throw new Error(`Failed to serialize element of type ${e.type}`);
  }

  Duc.ElementWrapper.startElementWrapper(b);
  Duc.ElementWrapper.addElementType(b, type);
  Duc.ElementWrapper.addElement(b, elem);
  return Duc.ElementWrapper.endElementWrapper(b);
}
function writeGridStyle(b: flatbuffers.Builder, s: GridStyle, usv: boolean): number {
  const color = b.createString(s.color);
  const dash = Duc.GridStyle.createDashPatternVector(b, s.dashPattern);
  Duc.GridStyle.startGridStyle(b);
  Duc.GridStyle.addColor(b, color);
  Duc.GridStyle.addOpacity(b, s.opacity);
  Duc.GridStyle.addDashPattern(b, dash);
  return Duc.GridStyle.endGridStyle(b);
}

function writePolarGridSettings(b: flatbuffers.Builder, p: PolarGridSettings, usv: boolean): number {
  Duc.PolarGridSettings.startPolarGridSettings(b);
  Duc.PolarGridSettings.addRadialDivisions(b, p.radialDivisions);
  Duc.PolarGridSettings.addRadialSpacing(b, getPrecisionValue(p.radialSpacing, usv));
  Duc.PolarGridSettings.addShowLabels(b, p.showLabels);
  return Duc.PolarGridSettings.endPolarGridSettings(b);
}

function writeIsometricGridSettings(b: flatbuffers.Builder, i: IsometricGridSettings, usv: boolean): number {
  Duc.IsometricGridSettings.startIsometricGridSettings(b);
  Duc.IsometricGridSettings.addLeftAngle(b, i.leftAngle);
  Duc.IsometricGridSettings.addRightAngle(b, i.rightAngle);
  return Duc.IsometricGridSettings.endIsometricGridSettings(b);
}

function writeGridSettings(b: flatbuffers.Builder, g: GridSettings, usv: boolean): number {
  const origin = Duc.GeometricPoint.createGeometricPoint(b, g.origin.x, g.origin.y);
  const major = writeGridStyle(b, g.majorStyle, usv);
  const minor = writeGridStyle(b, g.minorStyle, usv);
  const polar = g.polarSettings ? writePolarGridSettings(b, g.polarSettings, usv) : undefined;
  const iso = g.isometricSettings ? writeIsometricGridSettings(b, g.isometricSettings, usv) : undefined;

  Duc.GridSettings.startGridSettings(b);
  Duc.GridSettings.addType(b, g.type);
  Duc.GridSettings.addReadonly(b, g.readonly);
  Duc.GridSettings.addDisplayType(b, g.displayType);
  Duc.GridSettings.addIsAdaptive(b, g.isAdaptive);
  Duc.GridSettings.addXSpacing(b, getPrecisionValue(g.xSpacing, usv));
  Duc.GridSettings.addYSpacing(b, getPrecisionValue(g.ySpacing, usv));
  Duc.GridSettings.addSubdivisions(b, g.subdivisions);
  Duc.GridSettings.addOrigin(b, origin);
  Duc.GridSettings.addRotation(b, g.rotation);
  Duc.GridSettings.addFollowUcs(b, g.followUCS);
  Duc.GridSettings.addMajorStyle(b, major);
  Duc.GridSettings.addMinorStyle(b, minor);
  Duc.GridSettings.addShowMinor(b, g.showMinor);
  Duc.GridSettings.addMinZoom(b, g.minZoom);
  Duc.GridSettings.addMaxZoom(b, g.maxZoom);
  Duc.GridSettings.addAutoHide(b, g.autoHide);
  if (polar) Duc.GridSettings.addPolarSettings(b, polar);
  if (iso) Duc.GridSettings.addIsometricSettings(b, iso);
  Duc.GridSettings.addEnableSnapping(b, g.enableSnapping);
  return Duc.GridSettings.endGridSettings(b);
}

function writeSnapMarkerSettings(b: flatbuffers.Builder, s: SnapMarkerSettings, usv: boolean): number {
  const styles = Duc.SnapMarkerSettings.createStylesVector(
    b,
    Object.entries(s.styles).map(([k, v]) => {
      Duc.SnapMarkerStyleEntry.startSnapMarkerStyleEntry(b);
      Duc.SnapMarkerStyleEntry.addKey(b, Number(k));
      const color = b.createString(v.color);
      Duc.SnapMarkerStyle.startSnapMarkerStyle(b);
      Duc.SnapMarkerStyle.addShape(b, v.shape);
      Duc.SnapMarkerStyle.addColor(b, color);
      const val = Duc.SnapMarkerStyle.endSnapMarkerStyle(b);
      Duc.SnapMarkerStyleEntry.addValue(b, val);
      return Duc.SnapMarkerStyleEntry.endSnapMarkerStyleEntry(b);
    })
  );

  Duc.SnapMarkerSettings.startSnapMarkerSettings(b);
  Duc.SnapMarkerSettings.addEnabled(b, s.enabled);
  Duc.SnapMarkerSettings.addSize(b, s.size);
  if (s.duration !== undefined) Duc.SnapMarkerSettings.addDuration(b, s.duration);
  Duc.SnapMarkerSettings.addStyles(b, styles);
  return Duc.SnapMarkerSettings.endSnapMarkerSettings(b);
}

function writeTrackingLineStyle(b: flatbuffers.Builder, t: TrackingLineStyle | undefined, usv: boolean): number | undefined {
  if (!t) return undefined;
  const color = b.createString(t.color);
  const dash = t.dashPattern ? Duc.TrackingLineStyle.createDashPatternVector(b, t.dashPattern) : undefined;
  Duc.TrackingLineStyle.startTrackingLineStyle(b);
  Duc.TrackingLineStyle.addColor(b, color);
  Duc.TrackingLineStyle.addOpacity(b, t.opacity);
  if (dash) Duc.TrackingLineStyle.addDashPattern(b, dash);
  return Duc.TrackingLineStyle.endTrackingLineStyle(b);
}

function writeDynamicSnapSettings(b: flatbuffers.Builder, d: DynamicSnapSettings, usv: boolean): number {
  Duc.DynamicSnapSettings.startDynamicSnapSettings(b);
  Duc.DynamicSnapSettings.addEnabledDuringDrag(b, d.enabledDuringDrag);
  Duc.DynamicSnapSettings.addEnabledDuringRotation(b, d.enabledDuringRotation);
  Duc.DynamicSnapSettings.addEnabledDuringScale(b, d.enabledDuringScale);
  return Duc.DynamicSnapSettings.endDynamicSnapSettings(b);
}

function writeSnapOverride(b: flatbuffers.Builder, o: SnapOverride, usv: boolean): number {
  const key = b.createString(o.key);
  Duc.SnapOverride.startSnapOverride(b);
  Duc.SnapOverride.addKey(b, key);
  Duc.SnapOverride.addBehavior(b, o.behavior);
  return Duc.SnapOverride.endSnapOverride(b);
}

function writePolarTrackingSettings(b: flatbuffers.Builder, p: PolarTrackingSettings, usv: boolean): number {
  const angles = Duc.PolarTrackingSettings.createAnglesVector(b, p.angles.map(a => a));
  Duc.PolarTrackingSettings.startPolarTrackingSettings(b);
  Duc.PolarTrackingSettings.addEnabled(b, p.enabled);
  Duc.PolarTrackingSettings.addAngles(b, angles);
  if (p.incrementAngle !== undefined) Duc.PolarTrackingSettings.addIncrementAngle(b, p.incrementAngle);
  Duc.PolarTrackingSettings.addTrackFromLastPoint(b, p.trackFromLastPoint);
  Duc.PolarTrackingSettings.addShowPolarCoordinates(b, p.showPolarCoordinates);
  return Duc.PolarTrackingSettings.endPolarTrackingSettings(b);
}

function writeLayerSnapFilters(b: flatbuffers.Builder, f: LayerSnapFilters | undefined, usv: boolean): number | undefined {
  if (!f) return undefined;
  const include = f.includeLayers ? Duc.LayerSnapFilters.createIncludeLayersVector(b, f.includeLayers.map(id => b.createString(id))) : undefined;
  const exclude = f.excludeLayers ? Duc.LayerSnapFilters.createExcludeLayersVector(b, f.excludeLayers.map(id => b.createString(id))) : undefined;
  Duc.LayerSnapFilters.startLayerSnapFilters(b);
  if (include) Duc.LayerSnapFilters.addIncludeLayers(b, include);
  if (exclude) Duc.LayerSnapFilters.addExcludeLayers(b, exclude);
  return Duc.LayerSnapFilters.endLayerSnapFilters(b);
}

function writeSnapSettings(b: flatbuffers.Builder, s: SnapSettings, usv: boolean): number {
  const overridesArray = s.temporaryOverrides ?? [];
  const overridesVec = overridesArray.length
    ? Duc.SnapSettings.createTemporaryOverridesVector(b, overridesArray.map(o => writeSnapOverride(b, o, usv)))
    : undefined;
  const tracking = writeTrackingLineStyle(b, s.trackingLineStyle, usv);
  const dynamic = writeDynamicSnapSettings(b, s.dynamicSnap, usv);
  // Always build PolarTrackingSettings (constructor ensures required fields); no defaults introduced.
  const polar = writePolarTrackingSettings(b, s.polarTracking as PolarTrackingSettings, usv);
  const layers = writeLayerSnapFilters(b, s.layerSnapFilters, usv);
  const markers = writeSnapMarkerSettings(b, s.snapMarkers, usv);
  const types = s.elementTypeFilters ? Duc.SnapSettings.createElementTypeFiltersVector(b, s.elementTypeFilters.map(t => {
    // element type enum is Duc.Element (wrapper), but here it's a string union.
    // The schema likely stores raw strings; we store as strings.
    return b.createString(t);
  })) : undefined;

  Duc.SnapSettings.startSnapSettings(b);
  Duc.SnapSettings.addReadonly(b, s.readonly);
  Duc.SnapSettings.addTwistAngle(b, s.twistAngle);
  Duc.SnapSettings.addSnapTolerance(b, s.snapTolerance);
  Duc.SnapSettings.addObjectSnapAperture(b, s.objectSnapAperture);
  Duc.SnapSettings.addIsOrthoModeOn(b, s.isOrthoModeOn);
  if (polar !== undefined) Duc.SnapSettings.addPolarTracking(b, polar);
  Duc.SnapSettings.addIsObjectSnapOn(b, s.isObjectSnapOn);
  Duc.SnapSettings.addActiveObjectSnapModes(b, Duc.SnapSettings.createActiveObjectSnapModesVector(b, s.activeObjectSnapModes));
  Duc.SnapSettings.addSnapPriority(b, Duc.SnapSettings.createSnapPriorityVector(b, s.snapPriority));
  Duc.SnapSettings.addShowTrackingLines(b, s.showTrackingLines);
  if (tracking) Duc.SnapSettings.addTrackingLineStyle(b, tracking);
  Duc.SnapSettings.addDynamicSnap(b, dynamic);
  if (overridesVec) Duc.SnapSettings.addTemporaryOverrides(b, overridesVec);
  if (s.incrementalDistance !== undefined) Duc.SnapSettings.addIncrementalDistance(b, s.incrementalDistance);
  if (s.magneticStrength !== undefined) Duc.SnapSettings.addMagneticStrength(b, s.magneticStrength);
  if (layers) Duc.SnapSettings.addLayerSnapFilters(b, layers);
  if (types) Duc.SnapSettings.addElementTypeFilters(b, types);
  Duc.SnapSettings.addSnapMode(b, s.snapMode);
  Duc.SnapSettings.addSnapMarkers(b, markers);
  Duc.SnapSettings.addConstructionSnapEnabled(b, s.constructionSnapEnabled);
  if (s.snapToGridIntersections !== undefined) Duc.SnapSettings.addSnapToGridIntersections(b, s.snapToGridIntersections);
  return Duc.SnapSettings.endSnapSettings(b);
}

function writeUcs(b: flatbuffers.Builder, u: DucUcs): number {
  const origin = Duc.GeometricPoint.createGeometricPoint(b, u.origin.x, u.origin.y);
  Duc.DucUcs.startDucUcs(b);
  Duc.DucUcs.addOrigin(b, origin);
  Duc.DucUcs.addAngle(b, u.angle);
  return Duc.DucUcs.endDucUcs(b);
}


/**
 * Standards
 */
import type { Standard, StandardOverrides, StandardStyles, StandardUnits, StandardValidation, StandardViewSettings } from "./technical/standards";

function serializeStandardOverrides(b: flatbuffers.Builder, o: StandardOverrides, usv: boolean): number {
  const activeGrid = o.activeGridSettingsId ? Duc.StandardOverrides.createActiveGridSettingsIdVector(b, o.activeGridSettingsId.map(id => b.createString(id))) : undefined;
  const dashOverride = o.dashLineOverride ? b.createString(o.dashLineOverride) : undefined;

  Duc.StandardOverrides.startStandardOverrides(b);
  if (o.mainScope) Duc.StandardOverrides.addMainScope(b, b.createString(o.mainScope));
  if (o.elementsStrokeWidthOverride) Duc.StandardOverrides.addElementsStrokeWidthOverride(b, getPrecisionValue(o.elementsStrokeWidthOverride, usv));
  if (o.commonStyleId) Duc.StandardOverrides.addCommonStyleId(b, b.createString(o.commonStyleId));
  if (o.stackLikeStyleId) Duc.StandardOverrides.addStackLikeStyleId(b, b.createString(o.stackLikeStyleId));
  if (o.textStyleId) Duc.StandardOverrides.addTextStyleId(b, b.createString(o.textStyleId));
  if (o.dimensionStyleId) Duc.StandardOverrides.addDimensionStyleId(b, b.createString(o.dimensionStyleId));
  if (o.leaderStyleId) Duc.StandardOverrides.addLeaderStyleId(b, b.createString(o.leaderStyleId));
  if (o.featureControlFrameStyleId) Duc.StandardOverrides.addFeatureControlFrameStyleId(b, b.createString(o.featureControlFrameStyleId));
  if (o.tableStyleId) Duc.StandardOverrides.addTableStyleId(b, b.createString(o.tableStyleId));
  if (o.docStyleId) Duc.StandardOverrides.addDocStyleId(b, b.createString(o.docStyleId));
  if (o.viewportStyleId) Duc.StandardOverrides.addViewportStyleId(b, b.createString(o.viewportStyleId));
  if (o.plotStyleId) Duc.StandardOverrides.addPlotStyleId(b, b.createString(o.plotStyleId));
  if (o.hatchStyleId) Duc.StandardOverrides.addHatchStyleId(b, b.createString(o.hatchStyleId));
  if (activeGrid) Duc.StandardOverrides.addActiveGridSettingsId(b, activeGrid);
  if (o.activeSnapSettingsId) Duc.StandardOverrides.addActiveSnapSettingsId(b, b.createString(o.activeSnapSettingsId));
  if (dashOverride) Duc.StandardOverrides.addDashLineOverride(b, dashOverride);
  if (o.unitPrecision) {
    Duc.UnitPrecision.startUnitPrecision(b);
    if (o.unitPrecision.linear !== undefined) Duc.UnitPrecision.addLinear(b, o.unitPrecision.linear);
    if (o.unitPrecision.angular !== undefined) Duc.UnitPrecision.addAngular(b, o.unitPrecision.angular);
    if (o.unitPrecision.area !== undefined) Duc.UnitPrecision.addArea(b, o.unitPrecision.area);
    if (o.unitPrecision.volume !== undefined) Duc.UnitPrecision.addVolume(b, o.unitPrecision.volume);
    const up = Duc.UnitPrecision.endUnitPrecision(b);
    Duc.StandardOverrides.addUnitPrecision(b, up);
  }
  return Duc.StandardOverrides.endStandardOverrides(b);
}

function serializeStandardUnits(b: flatbuffers.Builder, u: StandardUnits, usv: boolean): number {
  const primary = writePrimaryUnits(b, {
    linear: {
      system: u.primaryUnits.linear.system,
      precision: u.primaryUnits.linear.precision,
      suppressLeadingZeros: u.primaryUnits.linear.suppressLeadingZeros,
      suppressTrailingZeros: u.primaryUnits.linear.suppressTrailingZeros,
      format: u.primaryUnits.linear.format,
      decimalSeparator: u.primaryUnits.linear.decimalSeparator,
      suppressZeroFeet: u.primaryUnits.linear.suppressZeroFeet,
      suppressZeroInches: u.primaryUnits.linear.suppressZeroInches,
    },
    angular: {
      system: u.primaryUnits.angular.system,
      precision: u.primaryUnits.angular.precision,
      suppressLeadingZeros: u.primaryUnits.angular.suppressLeadingZeros,
      suppressTrailingZeros: u.primaryUnits.angular.suppressTrailingZeros,
      format: u.primaryUnits.angular.format,
    },
  } as any, usv);

  Duc.AlternateUnits.startAlternateUnits(b);
  Duc.AlternateUnits.addIsVisible(b, u.alternateUnits.isVisible);
  Duc.AlternateUnits.addMultiplier(b, u.alternateUnits.multiplier);
  Duc.AlternateUnits.addFormat(b, u.alternateUnits.format);
  // AlternateUnits in schema may not have these fields; only write those that exist
  if ("addSystem" in Duc.AlternateUnits) {
    // @ts-expect-error guarded by runtime check
    Duc.AlternateUnits.addSystem(b, u.alternateUnits.system);
  }
  if ("addPrecision" in Duc.AlternateUnits) {
    // @ts-expect-error guarded by runtime check
    Duc.AlternateUnits.addPrecision(b, u.alternateUnits.precision);
  }
  if ("addSuppressLeadingZeros" in Duc.AlternateUnits) {
    // @ts-expect-error guarded by runtime check
    Duc.AlternateUnits.addSuppressLeadingZeros(b, u.alternateUnits.suppressLeadingZeros);
  }
  if ("addSuppressTrailingZeros" in Duc.AlternateUnits) {
    // @ts-expect-error guarded by runtime check
    Duc.AlternateUnits.addSuppressTrailingZeros(b, u.alternateUnits.suppressTrailingZeros);
  }
  const alt = Duc.AlternateUnits.endAlternateUnits(b);

  Duc.StandardUnits.startStandardUnits(b);
  if (primary !== undefined) Duc.StandardUnits.addPrimaryUnits(b, primary);
  Duc.StandardUnits.addAlternateUnits(b, alt);
  return Duc.StandardUnits.endStandardUnits(b);
}

function writeIdentifiedCommonStyle(b: flatbuffers.Builder, entry: StandardStyles["commonStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const bg = writeElementBackground(b, entry.background, usv);
  const st = writeElementStroke(b, entry.stroke, usv);
  Duc.DucCommonStyle.startDucCommonStyle(b);
  if (bg) Duc.DucCommonStyle.addBackground(b, bg);
  if (st) Duc.DucCommonStyle.addStroke(b, st);
  const style = Duc.DucCommonStyle.endDucCommonStyle(b);

  Duc.IdentifiedCommonStyle.startIdentifiedCommonStyle(b);
  Duc.IdentifiedCommonStyle.addId(b, idOff);
  Duc.IdentifiedCommonStyle.addStyle(b, style);
  return Duc.IdentifiedCommonStyle.endIdentifiedCommonStyle(b);
}

function writeIdentifiedStackLikeStyle(b: flatbuffers.Builder, entry: StandardStyles["stackLikeStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const s = (() => {
    Duc.DucStackLikeStyles.startDucStackLikeStyles(b);
    Duc.DucStackLikeStyles.addOpacity(b, entry.opacity);
    Duc.DucStackLikeStyles.addLabelingColor(b, b.createString(entry.labelingColor));
    return Duc.DucStackLikeStyles.endDucStackLikeStyles(b);
  })();

  Duc.IdentifiedStackLikeStyle.startIdentifiedStackLikeStyle(b);
  Duc.IdentifiedStackLikeStyle.addId(b, idOff);
  Duc.IdentifiedStackLikeStyle.addStyle(b, s);
  return Duc.IdentifiedStackLikeStyle.endIdentifiedStackLikeStyle(b);
}

function writeIdentifiedTextStyle(b: flatbuffers.Builder, entry: StandardStyles["textStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeTextStyle(b, entry, usv);
  Duc.IdentifiedTextStyle.startIdentifiedTextStyle(b);
  Duc.IdentifiedTextStyle.addId(b, idOff);
  Duc.IdentifiedTextStyle.addStyle(b, style);
  return Duc.IdentifiedTextStyle.endIdentifiedTextStyle(b);
}

function writeIdentifiedDimensionStyle(b: flatbuffers.Builder, entry: StandardStyles["dimensionStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeDimStyle(b, entry, usv);
  Duc.IdentifiedDimensionStyle.startIdentifiedDimensionStyle(b);
  Duc.IdentifiedDimensionStyle.addId(b, idOff);
  Duc.IdentifiedDimensionStyle.addStyle(b, style);
  return Duc.IdentifiedDimensionStyle.endIdentifiedDimensionStyle(b);
}

function writeIdentifiedLeaderStyle(b: flatbuffers.Builder, entry: StandardStyles["leaderStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeLeaderStyle(b, entry, usv);
  Duc.IdentifiedLeaderStyle.startIdentifiedLeaderStyle(b);
  Duc.IdentifiedLeaderStyle.addId(b, idOff);
  Duc.IdentifiedLeaderStyle.addStyle(b, style);
  return Duc.IdentifiedLeaderStyle.endIdentifiedLeaderStyle(b);
}

function writeIdentifiedFCFStyle(b: flatbuffers.Builder, entry: StandardStyles["featureControlFrameStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeFcfStyle(b, entry, usv);
  Duc.IdentifiedFCFStyle.startIdentifiedFCFStyle(b);
  Duc.IdentifiedFCFStyle.addId(b, idOff);
  Duc.IdentifiedFCFStyle.addStyle(b, style);
  return Duc.IdentifiedFCFStyle.endIdentifiedFCFStyle(b);
}

function writeIdentifiedTableStyle(b: flatbuffers.Builder, entry: StandardStyles["tableStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeTableStyle(b, entry, usv);
  Duc.IdentifiedTableStyle.startIdentifiedTableStyle(b);
  Duc.IdentifiedTableStyle.addId(b, idOff);
  Duc.IdentifiedTableStyle.addStyle(b, style);
  return Duc.IdentifiedTableStyle.endIdentifiedTableStyle(b);
}

function writeIdentifiedDocStyle(b: flatbuffers.Builder, entry: StandardStyles["docStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeDocStyle(b, entry, usv);
  Duc.IdentifiedDocStyle.startIdentifiedDocStyle(b);
  Duc.IdentifiedDocStyle.addId(b, idOff);
  Duc.IdentifiedDocStyle.addStyle(b, style);
  return Duc.IdentifiedDocStyle.endIdentifiedDocStyle(b);
}

function writeIdentifiedViewportStyle(b: flatbuffers.Builder, entry: StandardStyles["viewportStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeViewportStyle(b, entry, usv);
  Duc.IdentifiedViewportStyle.startIdentifiedViewportStyle(b);
  Duc.IdentifiedViewportStyle.addId(b, idOff);
  Duc.IdentifiedViewportStyle.addStyle(b, style);
  return Duc.IdentifiedViewportStyle.endIdentifiedViewportStyle(b);
}

function writeIdentifiedHatchStyle(b: flatbuffers.Builder, entry: StandardStyles["hatchStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeHatchStyle(b, entry, usv);
  Duc.IdentifiedHatchStyle.startIdentifiedHatchStyle(b);
  Duc.IdentifiedHatchStyle.addId(b, idOff);
  if (style) Duc.IdentifiedHatchStyle.addStyle(b, style);
  return Duc.IdentifiedHatchStyle.endIdentifiedHatchStyle(b);
}

function writeIdentifiedXRayStyle(b: flatbuffers.Builder, entry: StandardStyles["xrayStyles"][number], usv: boolean): number {
  const idOff = writeIdentifier(b, entry);
  const style = writeXRayStyle(b, entry, usv);
  Duc.IdentifiedXRayStyle.startIdentifiedXRayStyle(b);
  Duc.IdentifiedXRayStyle.addId(b, idOff);
  Duc.IdentifiedXRayStyle.addStyle(b, style);
  return Duc.IdentifiedXRayStyle.endIdentifiedXRayStyle(b);
}

function serializeStandardStyles(b: flatbuffers.Builder, s: StandardStyles, usv: boolean): number {
  const commonVec = s.commonStyles.length
    ? Duc.StandardStyles.createCommonStylesVector(b, s.commonStyles.map(cs => writeIdentifiedCommonStyle(b, cs, usv)))
    : undefined;
  const stackLikeVec = s.stackLikeStyles.length
    ? Duc.StandardStyles.createStackLikeStylesVector(b, s.stackLikeStyles.map(st => writeIdentifiedStackLikeStyle(b, st, usv)))
    : undefined;
  const textVec = s.textStyles.length
    ? Duc.StandardStyles.createTextStylesVector(b, s.textStyles.map(ts => writeIdentifiedTextStyle(b, ts, usv)))
    : undefined;
  const dimVec = s.dimensionStyles.length
    ? Duc.StandardStyles.createDimensionStylesVector(b, s.dimensionStyles.map(ds => writeIdentifiedDimensionStyle(b, ds, usv)))
    : undefined;
  const leaderVec = s.leaderStyles.length
    ? Duc.StandardStyles.createLeaderStylesVector(b, s.leaderStyles.map(ls => writeIdentifiedLeaderStyle(b, ls, usv)))
    : undefined;
  const fcfVec = s.featureControlFrameStyles.length
    ? Duc.StandardStyles.createFeatureControlFrameStylesVector(b, s.featureControlFrameStyles.map(fs => writeIdentifiedFCFStyle(b, fs, usv)))
    : undefined;
  const tableVec = s.tableStyles.length
    ? Duc.StandardStyles.createTableStylesVector(b, s.tableStyles.map(ts => writeIdentifiedTableStyle(b, ts, usv)))
    : undefined;
  const docVec = s.docStyles.length
    ? Duc.StandardStyles.createDocStylesVector(b, s.docStyles.map(ds => writeIdentifiedDocStyle(b, ds, usv)))
    : undefined;
  const viewportVec = s.viewportStyles.length
    ? Duc.StandardStyles.createViewportStylesVector(b, s.viewportStyles.map(vs => writeIdentifiedViewportStyle(b, vs, usv)))
    : undefined;
  const hatchVec = s.hatchStyles.length
    ? Duc.StandardStyles.createHatchStylesVector(b, s.hatchStyles.map(hs => writeIdentifiedHatchStyle(b, hs, usv)))
    : undefined;
  const xrayVec = s.xrayStyles.length
    ? Duc.StandardStyles.createXrayStylesVector(b, s.xrayStyles.map(xs => writeIdentifiedXRayStyle(b, xs, usv)))
    : undefined;

  Duc.StandardStyles.startStandardStyles(b);
  if (commonVec) Duc.StandardStyles.addCommonStyles(b, commonVec);
  if (stackLikeVec) Duc.StandardStyles.addStackLikeStyles(b, stackLikeVec);
  if (textVec) Duc.StandardStyles.addTextStyles(b, textVec);
  if (dimVec) Duc.StandardStyles.addDimensionStyles(b, dimVec);
  if (leaderVec) Duc.StandardStyles.addLeaderStyles(b, leaderVec);
  if (fcfVec) Duc.StandardStyles.addFeatureControlFrameStyles(b, fcfVec);
  if (tableVec) Duc.StandardStyles.addTableStyles(b, tableVec);
  if (docVec) Duc.StandardStyles.addDocStyles(b, docVec);
  if (viewportVec) Duc.StandardStyles.addViewportStyles(b, viewportVec);
  if (hatchVec) Duc.StandardStyles.addHatchStyles(b, hatchVec);
  if (xrayVec) Duc.StandardStyles.addXrayStyles(b, xrayVec);
  return Duc.StandardStyles.endStandardStyles(b);
}

function serializeStandardViewSettings(b: flatbuffers.Builder, v: StandardViewSettings, usv: boolean): number {
  const viewsVec = v.views && v.views.length
    ? Duc.StandardViewSettings.createViewsVector(
      b,
      v.views.map((entry) => {
        const id = writeIdentifier(b, entry);
        const view = writeView(b, entry, usv);
        Duc.IdentifiedView.startIdentifiedView(b);
        Duc.IdentifiedView.addId(b, id);
        Duc.IdentifiedView.addView(b, view);
        return Duc.IdentifiedView.endIdentifiedView(b);
      }),
    )
    : undefined;

  const ucsVec = v.ucs && v.ucs.length
    ? Duc.StandardViewSettings.createUcsVector(
      b,
      v.ucs.map((entry) => {
        const id = writeIdentifier(b, entry);
        const ucs = writeUcs(b, entry);
        Duc.IdentifiedUcs.startIdentifiedUcs(b);
        Duc.IdentifiedUcs.addId(b, id);
        Duc.IdentifiedUcs.addUcs(b, ucs);
        return Duc.IdentifiedUcs.endIdentifiedUcs(b);
      }),
    )
    : undefined;

  const gridsVec = v.gridSettings && v.gridSettings.length
    ? Duc.StandardViewSettings.createGridSettingsVector(
      b,
      v.gridSettings.map((entry) => {
        const id = writeIdentifier(b, entry);
        const settings = writeGridSettings(b, entry, usv);
        Duc.IdentifiedGridSettings.startIdentifiedGridSettings(b);
        Duc.IdentifiedGridSettings.addId(b, id);
        Duc.IdentifiedGridSettings.addSettings(b, settings);
        return Duc.IdentifiedGridSettings.endIdentifiedGridSettings(b);
      }),
    )
    : undefined;

  const snapsVec = v.snapSettings && v.snapSettings.length
    ? Duc.StandardViewSettings.createSnapSettingsVector(
      b,
      v.snapSettings.map((entry) => {
        const id = writeIdentifier(b, entry);
        const settings = writeSnapSettings(b, entry, usv);
        Duc.IdentifiedSnapSettings.startIdentifiedSnapSettings(b);
        Duc.IdentifiedSnapSettings.addId(b, id);
        Duc.IdentifiedSnapSettings.addSettings(b, settings);
        return Duc.IdentifiedSnapSettings.endIdentifiedSnapSettings(b);
      }),
    )
    : undefined;

  Duc.StandardViewSettings.startStandardViewSettings(b);
  if (viewsVec) Duc.StandardViewSettings.addViews(b, viewsVec);
  if (ucsVec) Duc.StandardViewSettings.addUcs(b, ucsVec);
  if (gridsVec) Duc.StandardViewSettings.addGridSettings(b, gridsVec);
  if (snapsVec) Duc.StandardViewSettings.addSnapSettings(b, snapsVec);
  return Duc.StandardViewSettings.endStandardViewSettings(b);
}

function serializeStandardValidation(b: flatbuffers.Builder, val: StandardValidation, usv: boolean): number {
  Duc.StandardValidation.startStandardValidation(b);
  if (val.dimensionRules) {
    Duc.DimensionValidationRules.startDimensionValidationRules(b);
    if (val.dimensionRules.minTextHeight !== undefined) Duc.DimensionValidationRules.addMinTextHeight(b, getPrecisionValue(val.dimensionRules.minTextHeight, usv));
    if (val.dimensionRules.maxTextHeight !== undefined) Duc.DimensionValidationRules.addMaxTextHeight(b, getPrecisionValue(val.dimensionRules.maxTextHeight, usv));
    if (val.dimensionRules.allowedPrecisions) {
      Duc.DimensionValidationRules.addAllowedPrecisions(b, Duc.DimensionValidationRules.createAllowedPrecisionsVector(b, val.dimensionRules.allowedPrecisions));
    }
    const dr = Duc.DimensionValidationRules.endDimensionValidationRules(b);
    Duc.StandardValidation.addDimensionRules(b, dr);
  }
  if (val.layerRules) {
    const prohibited = val.layerRules.prohibitedLayerNames
      ? Duc.LayerValidationRules.createProhibitedLayerNamesVector(b, val.layerRules.prohibitedLayerNames.map(s => b.createString(s)))
      : undefined;
    Duc.LayerValidationRules.startLayerValidationRules(b);
    if (prohibited) Duc.LayerValidationRules.addProhibitedLayerNames(b, prohibited);
    const lr = Duc.LayerValidationRules.endLayerValidationRules(b);
    Duc.StandardValidation.addLayerRules(b, lr);
  }
  return Duc.StandardValidation.endStandardValidation(b);
}

function serializeStandard(b: flatbuffers.Builder, s: Standard, usv: boolean): number {
  const ident = writeIdentifier(b, s);
  const version = b.createString(s.version);
  const overrides = s.overrides ? serializeStandardOverrides(b, s.overrides, usv) : undefined;
  const styles = s.styles ? serializeStandardStyles(b, s.styles, usv) : undefined;
  const view = s.viewSettings ? serializeStandardViewSettings(b, s.viewSettings, usv) : undefined;
  const units = s.units ? serializeStandardUnits(b, s.units, usv) : undefined;
  const validation = s.validation ? serializeStandardValidation(b, s.validation, usv) : undefined;

  Duc.Standard.startStandard(b);
  Duc.Standard.addIdentifier(b, ident);
  Duc.Standard.addVersion(b, version);
  Duc.Standard.addReadonly(b, s.readonly);
  if (overrides) Duc.Standard.addOverrides(b, overrides);
  if (styles) Duc.Standard.addStyles(b, styles);
  if (view) Duc.Standard.addViewSettings(b, view);
  if (units) Duc.Standard.addUnits(b, units);
  if (validation) Duc.Standard.addValidation(b, validation);
  return Duc.Standard.endStandard(b);
}

/**
 * VersionGraph
 */
function serializeVersionBase(b: flatbuffers.Builder, v: VersionBase): number {
  const id = b.createString(v.id);
  const parent = v.parentId ? b.createString(v.parentId) : undefined;
  const desc = v.description ? b.createString(v.description) : undefined;
  const user = v.userId ? b.createString(v.userId) : undefined;

  Duc.VersionBase.startVersionBase(b);
  Duc.VersionBase.addId(b, id);
  if (parent) Duc.VersionBase.addParentId(b, parent);
  Duc.VersionBase.addTimestamp(b, BigInt(v.timestamp));
  if (desc) Duc.VersionBase.addDescription(b, desc);
  Duc.VersionBase.addIsManualSave(b, v.isManualSave);
  if (user) Duc.VersionBase.addUserId(b, user);
  return Duc.VersionBase.endVersionBase(b);
}

function serializeCheckpoint(b: flatbuffers.Builder, c: Checkpoint): number {
  const base = serializeVersionBase(b, c);
  const data = b.createByteVector(c.data);
  Duc.Checkpoint.startCheckpoint(b);
  Duc.Checkpoint.addBase(b, base);
  Duc.Checkpoint.addData(b, data);
  Duc.Checkpoint.addSizeBytes(b, BigInt(c.sizeBytes));
  return Duc.Checkpoint.endCheckpoint(b);
}

function writeJsonPatch(b: flatbuffers.Builder, p: JSONPatch): number {
  const ops = p.map((op) => {
    const opStr = b.createString(op.op);
    const pathStr = b.createString(op.path);
    const fromStr = op.from !== undefined ? b.createString(op.from) : undefined;
    const valueStr = op.value !== undefined ? b.createString(JSON.stringify(op.value)) : undefined;

    Duc.JSONPatchOperation.startJSONPatchOperation(b);
    Duc.JSONPatchOperation.addOp(b, opStr);
    Duc.JSONPatchOperation.addPath(b, pathStr);
    if (fromStr) Duc.JSONPatchOperation.addFrom(b, fromStr);
    if (valueStr) Duc.JSONPatchOperation.addValue(b, valueStr);
    return Duc.JSONPatchOperation.endJSONPatchOperation(b);
  });
  return Duc.Delta.createPatchVector(b, ops);
}

function serializeDelta(b: flatbuffers.Builder, d: Delta): number {
  const base = serializeVersionBase(b, d);
  const patch = writeJsonPatch(b, d.patch);
  Duc.Delta.startDelta(b);
  Duc.Delta.addBase(b, base);
  Duc.Delta.addPatch(b, patch);
  return Duc.Delta.endDelta(b);
}

function serializeDucVersionGraph(b: flatbuffers.Builder, vg: VersionGraph): number {
  const userCheckpoint = b.createString(vg.userCheckpointVersionId);
  const latest = b.createString(vg.latestVersionId);
  const checkpoints = Duc.VersionGraph.createCheckpointsVector(b, vg.checkpoints.map(c => serializeCheckpoint(b, c)));
  const deltas = Duc.VersionGraph.createDeltasVector(b, vg.deltas.map(d => serializeDelta(b, d)));
  Duc.VersionGraphMetadata.startVersionGraphMetadata(b);
  Duc.VersionGraphMetadata.addLastPruned(b, BigInt(vg.metadata.lastPruned));
  Duc.VersionGraphMetadata.addTotalSize(b, BigInt(vg.metadata.totalSize));
  const meta = Duc.VersionGraphMetadata.endVersionGraphMetadata(b);

  Duc.VersionGraph.startVersionGraph(b);
  Duc.VersionGraph.addUserCheckpointVersionId(b, userCheckpoint);
  Duc.VersionGraph.addLatestVersionId(b, latest);
  Duc.VersionGraph.addCheckpoints(b, checkpoints);
  Duc.VersionGraph.addDeltas(b, deltas);
  Duc.VersionGraph.addMetadata(b, meta);
  return Duc.VersionGraph.endVersionGraph(b);
}
// #endregion

// #region STATE SERIALIZERS
function serializeDucGlobalState(builder: flatbuffers.Builder, state: DucGlobalState, usv: boolean): number {
  const nameOffset = writeString(builder, state.name);
  const viewBackgroundColorOffset = writeString(builder, state.viewBackgroundColor);
  const mainScopeOffset = writeString(builder, state.mainScope);

  Duc.DucGlobalState.startDucGlobalState(builder);
  if (nameOffset) Duc.DucGlobalState.addName(builder, nameOffset);
  if (viewBackgroundColorOffset) Duc.DucGlobalState.addViewBackgroundColor(builder, viewBackgroundColorOffset);
  if (mainScopeOffset) Duc.DucGlobalState.addMainScope(builder, mainScopeOffset);
  Duc.DucGlobalState.addDashSpacingScale(builder, state.dashSpacingScale);
  Duc.DucGlobalState.addIsDashSpacingAffectedByViewportScale(builder, state.isDashSpacingAffectedByViewportScale);
  Duc.DucGlobalState.addScopeExponentThreshold(builder, state.scopeExponentThreshold);
  if (state.pruningLevel) Duc.DucGlobalState.addPruningLevel(builder, state.pruningLevel);
  Duc.DucGlobalState.addDimensionsAssociativeByDefault(builder, state.dimensionsAssociativeByDefault);
  Duc.DucGlobalState.addUseAnnotativeScaling(builder, state.useAnnotativeScaling);
  Duc.DucGlobalState.addDisplayPrecisionLinear(builder, state.displayPrecision.linear);
  Duc.DucGlobalState.addDisplayPrecisionAngular(builder, state.displayPrecision.angular);
  return Duc.DucGlobalState.endDucGlobalState(builder);
}

function serializeDucLocalState(builder: flatbuffers.Builder, state: DucLocalState, usv: boolean): number {
  const scopeOffset = writeString(builder, state.scope);
  const activeStandardIdOffset = writeString(builder, state.activeStandardId);
  const activeGridSettingsVector = writeStringVector(builder, state.activeGridSettings);
  const activeSnapSettingsOffset = writeString(builder, state.activeSnapSettings);
  const currentItemStrokeOffset = writeElementStroke(builder, state.currentItemStroke, usv);
  const currentItemBackgroundOffset = writeElementBackground(builder, state.currentItemBackground, usv);
  const currentItemFontFamilyOffset = state.currentItemFontFamily && writeString(builder, state.currentItemFontFamily.toString());

  Duc.DucLocalState.startDucLocalState(builder);
  if (scopeOffset) Duc.DucLocalState.addScope(builder, scopeOffset);
  if (activeStandardIdOffset) Duc.DucLocalState.addActiveStandardId(builder, activeStandardIdOffset);
  if (state.scrollX) Duc.DucLocalState.addScrollX(builder, getPrecisionValue(state.scrollX, usv));
  if (state.scrollY) Duc.DucLocalState.addScrollY(builder, getPrecisionValue(state.scrollY, usv));
  if (state.zoom) Duc.DucLocalState.addZoom(builder, state.zoom.value);
  if (activeGridSettingsVector) Duc.DucLocalState.addActiveGridSettings(builder, activeGridSettingsVector);
  if (activeSnapSettingsOffset) Duc.DucLocalState.addActiveSnapSettings(builder, activeSnapSettingsOffset);
  Duc.DucLocalState.addIsBindingEnabled(builder, state.isBindingEnabled);
  if (currentItemStrokeOffset) Duc.DucLocalState.addCurrentItemStroke(builder, currentItemStrokeOffset);
  if (currentItemBackgroundOffset) Duc.DucLocalState.addCurrentItemBackground(builder, currentItemBackgroundOffset);

  Duc.DucLocalState.addCurrentItemOpacity(builder, state.currentItemOpacity);
  if (currentItemFontFamilyOffset) Duc.DucLocalState.addCurrentItemFontFamily(builder, currentItemFontFamilyOffset);

  if (state.currentItemFontSize) Duc.DucLocalState.addCurrentItemFontSize(builder, getPrecisionValue(state.currentItemFontSize, usv));
  if (state.currentItemTextAlign) Duc.DucLocalState.addCurrentItemTextAlign(builder, state.currentItemTextAlign);

  if (state.currentItemRoundness) Duc.DucLocalState.addCurrentItemRoundness(builder, getPrecisionValue(state.currentItemRoundness, usv));
  Duc.DucLocalState.addPenMode(builder, state.penMode);
  Duc.DucLocalState.addViewModeEnabled(builder, state.viewModeEnabled);
  Duc.DucLocalState.addObjectsSnapModeEnabled(builder, state.objectsSnapModeEnabled);
  Duc.DucLocalState.addGridModeEnabled(builder, state.gridModeEnabled);
  Duc.DucLocalState.addOutlineModeEnabled(builder, state.outlineModeEnabled);
  Duc.DucLocalState.addManualSaveMode(builder, state.manualSaveMode);
  return Duc.DucLocalState.endDucLocalState(builder);
}

function serializeDictionary(builder: flatbuffers.Builder, dictionary: Dictionary | null | undefined): number | undefined {
  if (!dictionary) return undefined;
  const entries = Object.entries(dictionary).map(([key, value]) => {
    const keyOffset = builder.createString(key);
    const valueOffset = builder.createString(value);
    Duc.DictionaryEntry.startDictionaryEntry(builder);
    Duc.DictionaryEntry.addKey(builder, keyOffset);
    Duc.DictionaryEntry.addValue(builder, valueOffset);
    return Duc.DictionaryEntry.endDictionaryEntry(builder);
  });
  return Duc.ExportedDataState.createDictionaryVector(builder, entries);
}

// #endregion

function serializeDucGroup(builder: flatbuffers.Builder, g: DucGroup, usv: boolean): number {
  const id = builder.createString(g.id);
  const stack = writeStackBase(builder, g, usv);
  Duc.DucGroup.startDucGroup(builder);
  Duc.DucGroup.addId(builder, id);
  Duc.DucGroup.addStackBase(builder, stack);
  return Duc.DucGroup.endDucGroup(builder);
}

function serializeDucRegion(builder: flatbuffers.Builder, r: DucRegion, usv: boolean): number {
  const id = builder.createString(r.id);
  const stack = writeStackBase(builder, r, usv);
  Duc.DucRegion.startDucRegion(builder);
  Duc.DucRegion.addId(builder, id);
  Duc.DucRegion.addStackBase(builder, stack);
  Duc.DucRegion.addBooleanOperation(builder, r.booleanOperation);
  return Duc.DucRegion.endDucRegion(builder);
}

function serializeDucLayer(builder: flatbuffers.Builder, l: DucLayer, usv: boolean): number {
  const id = builder.createString(l.id);
  const stack = writeStackBase(builder, l, usv);
  const overrides = l.overrides ? (() => {
    const stroke = writeElementStroke(builder, l.overrides!.stroke, usv);
    const bg = writeElementBackground(builder, l.overrides!.background, usv);
    Duc.DucLayerOverrides.startDucLayerOverrides(builder);
    if (stroke) Duc.DucLayerOverrides.addStroke(builder, stroke);
    if (bg) Duc.DucLayerOverrides.addBackground(builder, bg);
    return Duc.DucLayerOverrides.endDucLayerOverrides(builder);
  })() : undefined;
  Duc.DucLayer.startDucLayer(builder);
  Duc.DucLayer.addId(builder, id);
  Duc.DucLayer.addStackBase(builder, stack);
  Duc.DucLayer.addReadonly(builder, l.readonly);
  if (overrides) Duc.DucLayer.addOverrides(builder, overrides);
  return Duc.DucLayer.endDucLayer(builder);
}

/**
 * External files map serializer: returns vector offset or undefined
 */
function serializeExternalFiles(builder: flatbuffers.Builder, files: DucExternalFiles | undefined, usv: boolean): number | undefined {
  if (!files) return undefined;

  const entries = Object.entries(files).map(([key, value]) => {
    const keyOff = builder.createString(key);
    const mt = builder.createString(value.mimeType);
    const idOff = builder.createString(value.id);
    
    let dataVectorOffset: number | undefined = undefined;
    if (value.data) {
      dataVectorOffset = Duc.DucExternalFileData.createDataVector(builder, value.data);
    }


    Duc.DucExternalFileData.startDucExternalFileData(builder);
    Duc.DucExternalFileData.addMimeType(builder, mt);
    Duc.DucExternalFileData.addId(builder, idOff);
    if (dataVectorOffset) Duc.DucExternalFileData.addData(builder, dataVectorOffset);
    Duc.DucExternalFileData.addCreated(builder, BigInt(value.created));
    if (value.lastRetrieved !== undefined) Duc.DucExternalFileData.addLastRetrieved(builder, BigInt(value.lastRetrieved));

    const dataOff = Duc.DucExternalFileData.endDucExternalFileData(builder);

    Duc.DucExternalFileEntry.startDucExternalFileEntry(builder);
    Duc.DucExternalFileEntry.addKey(builder, keyOff);
    Duc.DucExternalFileEntry.addValue(builder, dataOff);
    return Duc.DucExternalFileEntry.endDucExternalFileEntry(builder);
  });

  // Build vector of entries
  builder.startVector(4, entries.length, 4);
  for (let i = entries.length - 1; i >= 0; i--) builder.addOffset(entries[i]);
  return builder.endVector();
}


export const DUC_SCHEMA_VERSION =
  (typeof process !== "undefined" && (process as any).env && (process as any).env.DUC_SCHEMA_VERSION) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.DUC_SCHEMA_VERSION) ||
  "0.0.0";

export const serializeDuc = async (
  data: ImportedDataState,
  useScopedValues: boolean = false,
  passThroughElementIds: string[] = [],
): Promise<Uint8Array> => {
  const builder = new flatbuffers.Builder(1024);

  const sanitized = restore(
    data,
    {
      refreshDimensions: false,
      syncInvalidIndices: (elements) => elements as OrderedDucElement[],
      passThroughElementIds
    }
  );

  const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
  const sourceOffset = builder.createString(typeof window !== "undefined" ? window.location.origin : "unknown");

  const versionOffset = builder.createString(DUC_SCHEMA_VERSION);

  // Serialize elements
  const elementOffsets = sanitized.elements.map((element) => {
    return writeElementWrapper(builder, element, useScopedValues);
  });
  const elementsOffset = Duc.ExportedDataState.createElementsVector(builder, elementOffsets);

  // Serialize localState
  const localStateOffset = serializeDucLocalState(builder, sanitized.localState, useScopedValues);

  // Serialize files
  const externalFilesOffset = serializeExternalFiles(builder, sanitized.files, useScopedValues);

  // Serialize blocks
  const blocksOffset = Duc.ExportedDataState.createBlocksVector(builder, sanitized.blocks.map(block => writeBlock(builder, block, useScopedValues)));


  // Serialize groups
  const groupsOffset = sanitized.groups.length > 0
    ? Duc.ExportedDataState.createGroupsVector(builder, sanitized.groups.map(group => serializeDucGroup(builder, group, useScopedValues)))
    : null;

  // Serialize regions
  const regionsOffset = (sanitized.regions && sanitized.regions.length > 0)
    ? Duc.ExportedDataState.createRegionsVector(builder, sanitized.regions.map(region => serializeDucRegion(builder, region, useScopedValues)))
    : null;

  // Serialize layers
  const layersOffset = (sanitized.layers && sanitized.layers.length > 0)
    ? Duc.ExportedDataState.createLayersVector(builder, sanitized.layers.map(layer => serializeDucLayer(builder, layer, useScopedValues)))
    : null;

  // Serialize standards
  const standardsOffset = (sanitized.standards && sanitized.standards.length > 0)
    ? Duc.ExportedDataState.createStandardsVector(builder, sanitized.standards.map(standard => serializeStandard(builder, standard, useScopedValues)))
    : null;

  // Serialize dictionary
  const dictionaryOffset = (sanitized.dictionary && Object.keys(sanitized.dictionary).length > 0)
    ? serializeDictionary(builder, sanitized.dictionary)
    : null;

  // Serialize duc_global_state
  const ducGlobalStateOffset = sanitized.globalState
    ? serializeDucGlobalState(builder, sanitized.globalState, useScopedValues)
    : null;

  // Serialize version_graph
  const versionGraphOffset = sanitized.versionGraph
    ? serializeDucVersionGraph(builder, sanitized.versionGraph)
    : null;

  // Serialize thumbnail (as byte vector if present)
  const thumbnailOffset = sanitized.thumbnail
    ? builder.createByteVector(sanitized.thumbnail)
    : null;

  Duc.ExportedDataState.startExportedDataState(builder);
  Duc.ExportedDataState.addType(builder, typeOffset);
  Duc.ExportedDataState.addVersion(builder, versionOffset);
  Duc.ExportedDataState.addSource(builder, sourceOffset);
  Duc.ExportedDataState.addElements(builder, elementsOffset);
  Duc.ExportedDataState.addDucLocalState(builder, localStateOffset);

  if (externalFilesOffset) {
    Duc.ExportedDataState.addExternalFiles(builder, externalFilesOffset);
  }
  if (blocksOffset) {
    Duc.ExportedDataState.addBlocks(builder, blocksOffset);
  }
  if (groupsOffset) {
    Duc.ExportedDataState.addGroups(builder, groupsOffset);
  }
  if (regionsOffset) {
    Duc.ExportedDataState.addRegions(builder, regionsOffset);
  }
  if (layersOffset) {
    Duc.ExportedDataState.addLayers(builder, layersOffset);
  }
  if (standardsOffset) {
    Duc.ExportedDataState.addStandards(builder, standardsOffset);
  }
  if (dictionaryOffset) {
    Duc.ExportedDataState.addDictionary(builder, dictionaryOffset);
  }
  if (ducGlobalStateOffset) {
    Duc.ExportedDataState.addDucGlobalState(builder, ducGlobalStateOffset);
  }
  if (versionGraphOffset) {
    Duc.ExportedDataState.addVersionGraph(builder, versionGraphOffset);
  }
  if (thumbnailOffset) {
    Duc.ExportedDataState.addThumbnail(builder, thumbnailOffset);
  }
  const exportedDataStateOffset = Duc.ExportedDataState.endExportedDataState(builder);

  builder.finish(exportedDataStateOffset, "DUC_");

  return builder.asUint8Array();
};
// #endregion
