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
  SimplePoint as BinSimplePoint,
  StrokeSides as BinStrokeSides,
  StrokeStyle as BinStrokeStyle,
  TilingProperties as BinTilingProperties
} from 'ducjs/duc';
import { ensureFiniteNumber, getPrecisionValueField } from 'ducjs/serialize/serializationUtils';
import type { DucLine, DucLineReference, DucPath, DucPoint } from 'ducjs/types/elements';
import {
  DucElement,
  DucPointBinding,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  ImageCrop,
  StrokeSides,
  StrokeStyle,
  TilingProperties
} from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucElement = (
  builder: flatbuffers.Builder, 
  element: DucElement, 
): flatbuffers.Offset => {


  return BinDucElement.endDucElement(builder);
};












export const serializeDucPoint = (builder: flatbuffers.Builder, point: DucPoint, forRenderer: boolean): flatbuffers.Offset => {
  BinPoint.startPoint(builder);
  point.x !== undefined && BinPoint.addXV3(builder, getPrecisionValueField(point.x, forRenderer));
  point.y !== undefined && BinPoint.addYV3(builder, getPrecisionValueField(point.y, forRenderer));
  point.mirroring !== undefined && BinPoint.addMirroring(builder, point.mirroring);
  return BinPoint.endPoint(builder);
};

const serializeDucLineReference = (builder: flatbuffers.Builder, lineRef: DucLineReference, forRenderer: boolean): flatbuffers.Offset => {
  const handleOffset = lineRef.handle ? BinSimplePoint.createSimplePoint(
    builder,
    getPrecisionValueField(lineRef.handle.x, forRenderer),
    getPrecisionValueField(lineRef.handle.y, forRenderer)
  ) : undefined;

  BinDucLineReference.startDucLineReference(builder);
  BinDucLineReference.addIndex(builder, lineRef.index);
  handleOffset && BinDucLineReference.addHandle(builder, handleOffset);
  return BinDucLineReference.endDucLineReference(builder);
};

const serializeDucLine = (builder: flatbuffers.Builder, line: DucLine, forRenderer: boolean): flatbuffers.Offset => {
  const startOffset = serializeDucLineReference(builder, line[0], forRenderer);
  const endOffset = serializeDucLineReference(builder, line[1], forRenderer);

  BinDucLine.startDucLine(builder);
  BinDucLine.addStart(builder, startOffset);
  BinDucLine.addEnd(builder, endOffset);
  return BinDucLine.endDucLine(builder);
};

const serializeDucPath = (builder: flatbuffers.Builder, path: DucPath, forRenderer: boolean): flatbuffers.Offset => {
  const lineIndicesVector = BinDucPath.createLineIndicesVector(builder, Array.from(path.lineIndices));
  
  const backgroundOffset = path.background ? serializeElementBackground(builder, path.background) : undefined;
  const strokeOffset = path.stroke ? serializeElementStroke(builder, path.stroke, forRenderer) : undefined;

  BinDucPath.startDucPath(builder);
  BinDucPath.addLineIndices(builder, lineIndicesVector);
  backgroundOffset && BinDucPath.addBackground(builder, backgroundOffset);
  strokeOffset && BinDucPath.addStroke(builder, strokeOffset);
  return BinDucPath.endDucPath(builder);
};

export const serializeDucPointBinding = (builder: flatbuffers.Builder, pointBinding: DucPointBinding, forRenderer: boolean): flatbuffers.Offset => {
  const elementIdOffset = builder.createString(pointBinding.elementId || '');
  const fixedPointOffset = pointBinding.fixedPoint ? 
    BinSimplePoint.createSimplePoint(
      builder, 
      ensureFiniteNumber(pointBinding.fixedPoint.x, 0.5), 
      ensureFiniteNumber(pointBinding.fixedPoint.y, 0.5)
    ) : undefined;
  
  let bindingPointOffset: flatbuffers.Offset | undefined;
  if (pointBinding.point) {
    BinBindingPoint.startBindingPoint(builder);
    BinBindingPoint.addIndex(builder, ensureFiniteNumber(pointBinding.point.index));
    BinBindingPoint.addOffset(builder, ensureFiniteNumber(pointBinding.point.offset));
    bindingPointOffset = BinBindingPoint.endBindingPoint(builder);
  }

  BinPointBinding.startPointBinding(builder);
  BinPointBinding.addElementId(builder, elementIdOffset);
  pointBinding.focus !== undefined && BinPointBinding.addFocus(builder, pointBinding.focus); 
  pointBinding.gap && BinPointBinding.addGap(builder, getPrecisionValueField(pointBinding.gap, forRenderer));
  fixedPointOffset && BinPointBinding.addFixedPoint(builder, fixedPointOffset);
  bindingPointOffset && BinPointBinding.addPoint(builder, bindingPointOffset);
  pointBinding.head !== undefined && pointBinding.head !== null && BinPointBinding.addHead(builder, pointBinding.head);
  return BinPointBinding.endPointBinding(builder);
};

const serializeTilingProperties = (builder: flatbuffers.Builder, tiling: TilingProperties): flatbuffers.Offset => {
  BinTilingProperties.startTilingProperties(builder);
  tiling.angle !== undefined && BinTilingProperties.addAngle(builder, tiling.angle); 
  tiling.offsetX !== undefined && BinTilingProperties.addOffsetX(builder, tiling.offsetX); 
  tiling.offsetY !== undefined && BinTilingProperties.addOffsetY(builder, tiling.offsetY); 
  return BinTilingProperties.endTilingProperties(builder);
};

const serializeElementContentBase = (builder: flatbuffers.Builder, content: ElementContentBase): flatbuffers.Offset => {
  const srcOffset = builder.createString(content.src || '');
  const tilingOffset = content.tiling ? serializeTilingProperties(builder, content.tiling) : undefined;

  BinElementContentBase.startElementContentBase(builder);
  BinElementContentBase.addPreference(builder, content.preference);
  BinElementContentBase.addSrc(builder, srcOffset);
  BinElementContentBase.addVisible(builder, content.visible !== undefined ? content.visible : true);
  content.opacity !== undefined && BinElementContentBase.addOpacity(builder, content.opacity); 
  tilingOffset && BinElementContentBase.addTiling(builder, tilingOffset);
  return BinElementContentBase.endElementContentBase(builder);
};

const serializeStrokeStyle = (builder: flatbuffers.Builder, style: StrokeStyle): flatbuffers.Offset => {
  const dashVector = style.dash && style.dash.length > 0 
    ? BinStrokeStyle.createDashVector(builder, style.dash.map(d => ensureFiniteNumber(d)))
    : undefined;

  BinStrokeStyle.startStrokeStyle(builder);
  style.preference !== undefined && BinStrokeStyle.addPreference(builder, style.preference);
  style.cap !== undefined && BinStrokeStyle.addCap(builder, style.cap);
  style.join !== undefined && BinStrokeStyle.addJoin(builder, style.join);
  dashVector && BinStrokeStyle.addDash(builder, dashVector);
  style.miterLimit !== undefined && BinStrokeStyle.addMiterLimit(builder, style.miterLimit); 
  return BinStrokeStyle.endStrokeStyle(builder);
};

const serializeStrokeSides = (builder: flatbuffers.Builder, sides: StrokeSides | undefined): flatbuffers.Offset | undefined => {
  if (!sides) return undefined;
  const valuesVector = sides.values && sides.values.length > 0
    ? BinStrokeSides.createValuesVector(builder, sides.values.map(v => ensureFiniteNumber(v)))
    : undefined;

  BinStrokeSides.startStrokeSides(builder);
  BinStrokeSides.addPreference(builder, sides.preference);
  valuesVector && BinStrokeSides.addValues(builder, valuesVector);
  return BinStrokeSides.endStrokeSides(builder);
};

export const serializeElementStroke = (builder: flatbuffers.Builder, stroke: ElementStroke, forRenderer: boolean): flatbuffers.Offset => {
  const contentOffset = serializeElementContentBase(builder, stroke.content);
  const styleOffset = serializeStrokeStyle(builder, stroke.style);
  const strokeSidesOffset = serializeStrokeSides(builder, stroke.strokeSides);

  BinElementStroke.startElementStroke(builder);
  BinElementStroke.addContent(builder, contentOffset);
  stroke.placement !== undefined && BinElementStroke.addPlacement(builder, stroke.placement);
  stroke.width && BinElementStroke.addWidth(builder, getPrecisionValueField(stroke.width, forRenderer));
  styleOffset && BinElementStroke.addStyle(builder, styleOffset);
  strokeSidesOffset && BinElementStroke.addStrokeSides(builder, strokeSidesOffset);
  return BinElementStroke.endElementStroke(builder);
};

export const serializeElementBackground = (builder: flatbuffers.Builder, background: ElementBackground): flatbuffers.Offset => {
  const contentOffset = serializeElementContentBase(builder, background.content);
  BinElementBackground.startElementBackground(builder);
  BinElementBackground.addContent(builder, contentOffset);
  return BinElementBackground.endElementBackground(builder);
};

const serializeImageCrop = (builder: flatbuffers.Builder, crop: ImageCrop): flatbuffers.Offset => {
  BinImageCrop.startImageCrop(builder);
  crop.x !== undefined && BinImageCrop.addX(builder, ensureFiniteNumber(crop.x));
  crop.y !== undefined && BinImageCrop.addY(builder, ensureFiniteNumber(crop.y));
  crop.width !== undefined && BinImageCrop.addWidth(builder, ensureFiniteNumber(crop.width, 1));
  crop.height !== undefined && BinImageCrop.addHeight(builder, ensureFiniteNumber(crop.height, 1));
  return BinImageCrop.endImageCrop(builder);
};

