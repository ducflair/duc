import {
  PointBindingPoint as BinBindingPoint,
  _DucElementBase as BinDucElement,
  _DucElementStylesBase as BinDucElementStyles,
  DucLine as BinDucLine,
  DucLineReference as BinDucLineReference,
  DucPath as BinDucPath,
  ElementBackground as BinElementBackground,
  ElementContentBase as BinElementContentBase,
  ElementStroke as BinElementStroke,
  ImageCrop as BinImageCrop,
  DucPoint as BinPoint,
  DucPointBinding as BinPointBinding,
  GeometricPoint as BinSimplePoint,
  StrokeSides as BinStrokeSides,
  StrokeStyle as BinStrokeStyle,
  TilingProperties as BinTilingProperties,
  Element as BinElement,
  ElementWrapper as BinElementWrapper,
  _DucLinearElementBase as BinDucLinearElementBase,
  BoundElement as BinBoundElement,
} from 'ducjs/duc';
import { getPrecisionValueField } from 'ducjs/serialize/serializationUtils';
import type { DucLine, DucLineReference, DucPath, DucPoint, DucLinearElement } from 'ducjs/types/elements';
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
import {
  serializeDucRectangleElement,
  serializeDucPolygonElement,
  serializeDucEllipseElement,
  serializeDucImageElement,
  serializeDucTextElement,
  serializeDucLinearElement,
  serializeDucArrowElement,
  serializeDucFreeDrawElement,
  serializeDucBlockInstanceElement,
  serializeDucFrameElement,
  serializeDucPlotElement,
  serializeDucViewportElement,
  serializeDucXRayElement,
  serializeDucLeaderElement,
  serializeDucDimensionElement,
  serializeDucFeatureControlFrameElement,
  serializeDucDocElement,
  serializeDucParametricElement,
  serializeDucEmbeddableElement,
  serializeDucPdfElement,
  serializeDucMermaidElement,
  serializeDucTableElement,
} from './serializeElementTypes';
import { Element as BinDucElementType } from 'ducjs/duc';

export const serializeDucElement = (builder: flatbuffers.Builder, element: DucElement): flatbuffers.Offset => {
  let elementOffset: flatbuffers.Offset = 0;
  let elementType: BinDucElementType = BinDucElementType.NONE;

  switch (element.type) {
    case "rectangle":
      elementOffset = serializeDucRectangleElement(builder, element);
      elementType = BinDucElementType.DucRectangleElement;
      break;
    case "polygon":
      elementOffset = serializeDucPolygonElement(builder, element);
      elementType = BinDucElementType.DucPolygonElement;
      break;
    case "ellipse":
      elementOffset = serializeDucEllipseElement(builder, element);
      elementType = BinDucElementType.DucEllipseElement;
      break;
    case "image":
      elementOffset = serializeDucImageElement(builder, element);
      elementType = BinDucElementType.DucImageElement;
      break;
    case "text":
      elementOffset = serializeDucTextElement(builder, element);
      elementType = BinDucElementType.DucTextElement;
      break;
    case "line":
      elementOffset = serializeDucLinearElement(builder, element);
      elementType = BinDucElementType.DucLinearElement;
      break;
    case "arrow":
      elementOffset = serializeDucArrowElement(builder, element);
      elementType = BinDucElementType.DucArrowElement;
      break;
    case "freedraw":
      elementOffset = serializeDucFreeDrawElement(builder, element);
      elementType = BinDucElementType.DucFreeDrawElement;
      break;
    case "blockinstance":
      elementOffset = serializeDucBlockInstanceElement(builder, element);
      elementType = BinDucElementType.DucBlockInstanceElement;
      break;
    case "frame":
      elementOffset = serializeDucFrameElement(builder, element);
      elementType = BinDucElementType.DucFrameElement;
      break;
    case "plot":
      elementOffset = serializeDucPlotElement(builder, element);
      elementType = BinDucElementType.DucPlotElement;
      break;
    case "viewport":
      elementOffset = serializeDucViewportElement(builder, element);
      elementType = BinDucElementType.DucViewportElement;
      break;
    case "xray":
      elementOffset = serializeDucXRayElement(builder, element);
      elementType = BinDucElementType.DucXRayElement;
      break;
    case "leader":
      elementOffset = serializeDucLeaderElement(builder, element);
      elementType = BinDucElementType.DucLeaderElement;
      break;
    case "dimension":
      elementOffset = serializeDucDimensionElement(builder, element);
      elementType = BinDucElementType.DucDimensionElement;
      break;
    case "featurecontrolframe":
      elementOffset = serializeDucFeatureControlFrameElement(builder, element);
      elementType = BinDucElementType.DucFeatureControlFrameElement;
      break;
    case "doc":
      elementOffset = serializeDucDocElement(builder, element);
      elementType = BinDucElementType.DucDocElement;
      break;
    case "parametric":
      elementOffset = serializeDucParametricElement(builder, element);
      elementType = BinDucElementType.DucParametricElement;
      break;
    case "embeddable":
        elementOffset = serializeDucEmbeddableElement(builder, element);
        elementType = BinDucElementType.DucEmbeddableElement;
        break;
    case "pdf":
        elementOffset = serializeDucPdfElement(builder, element);
        elementType = BinDucElementType.DucPdfElement;
        break;
    case "mermaid":
        elementOffset = serializeDucMermaidElement(builder, element);
        elementType = BinDucElementType.DucMermaidElement;
        break;
    case "table":
        elementOffset = serializeDucTableElement(builder, element);
        elementType = BinDucElementType.DucTableElement;
        break;
  }

  BinElementWrapper.startElementWrapper(builder);
  BinElementWrapper.addElementType(builder, elementType);
  BinElementWrapper.addElement(builder, elementOffset);
  return BinElementWrapper.endElementWrapper(builder);
}

export const serializeDucElementBase = (
  builder: flatbuffers.Builder, 
  element: DucElement, 
): flatbuffers.Offset => {
  // Create basic string offsets
  const idOffset = builder.createString(element.id);
  const scopeOffset = builder.createString(element.scope);
  const labelOffset = element.label ? builder.createString(element.label) : null;
  const descriptionOffset = element.description ? builder.createString(element.description) : null;

  // Serialize background array if present
  let backgroundVectorOffset: flatbuffers.Offset | null = null;
  if (element.background && element.background.length > 0) {
    const backgroundOffsets = element.background.map(bg => serializeElementBackground(builder, bg));
    backgroundVectorOffset = BinDucElementStyles.createBackgroundVector(builder, backgroundOffsets);
  }

  // Serialize stroke array if present  
  let strokeVectorOffset: flatbuffers.Offset | null = null;
  if (element.stroke && element.stroke.length > 0) {
    const strokeOffsets = element.stroke.map(stroke => serializeElementStroke(builder, stroke));
    strokeVectorOffset = BinDucElementStyles.createStrokeVector(builder, strokeOffsets);
  }

  // Start building the element
  BinDucElement.start_DucElementBase(builder);
  
  // Add basic fields that all elements share
  BinDucElement.addId(builder, idOffset);
  
  // Add coordinates
  const xValue = getPrecisionValueField(element.x, false);
  if (xValue !== null) BinDucElement.addX(builder, xValue);
  const yValue = getPrecisionValueField(element.y, false);
  if (yValue !== null) BinDucElement.addY(builder, yValue);
  const widthValue = getPrecisionValueField(element.width, false);
  if (widthValue !== null) BinDucElement.addWidth(builder, widthValue);
  const heightValue = getPrecisionValueField(element.height, false);
  if (heightValue !== null) BinDucElement.addHeight(builder, heightValue);
  
  // Add other base properties
  if (element.angle !== undefined) {
    BinDucElement.addAngle(builder, element.angle);
  }
  BinDucElement.addScope(builder, scopeOffset);
  if (labelOffset) BinDucElement.addLabel(builder, labelOffset);
  if (descriptionOffset) BinDucElement.addDescription(builder, descriptionOffset);
  if (element.isVisible !== undefined) {
    BinDucElement.addIsVisible(builder, element.isVisible);
  }
  if (element.seed !== undefined) {
    BinDucElement.addSeed(builder, element.seed);
  }
  if (element.version !== undefined) {
    BinDucElement.addVersion(builder, element.version);
  }
  if (element.versionNonce !== undefined) {
    BinDucElement.addVersionNonce(builder, element.versionNonce);
  }
  if (element.updated !== undefined) {
    BinDucElement.addUpdated(builder, BigInt(element.updated));
  }
  
  // Add optional properties
  if (element.index !== undefined) {
    const indexOffset = builder.createString(element.index);
    BinDucElement.addIndex(builder, indexOffset);
  }
  if (element.isPlot !== undefined) {
    BinDucElement.addIsPlot(builder, element.isPlot);
  }
  if (element.isAnnotative !== undefined) {
    BinDucElement.addIsAnnotative(builder, element.isAnnotative);
  }
  if (element.isDeleted !== undefined) {
    BinDucElement.addIsDeleted(builder, element.isDeleted);
  }

  // Optional base relationships and metadata
  if (element.regionIds && element.regionIds.length > 0) {
    const regionIdOffsets = element.regionIds.map(id => builder.createString(id));
    const regionIdsVector = BinDucElement.createRegionIdsVector(builder, regionIdOffsets);
    BinDucElement.addRegionIds(builder, regionIdsVector);
  }
  if (element.layerId !== undefined) {
    const layerIdOffset = builder.createString(element.layerId);
    BinDucElement.addLayerId(builder, layerIdOffset);
  }
  if (element.frameId !== undefined) {
    const frameIdOffset = builder.createString(element.frameId);
    BinDucElement.addFrameId(builder, frameIdOffset);
  }
  if (element.boundElements && element.boundElements.length > 0) {
    const boundOffsets = element.boundElements.map(be => {
      const idOff = builder.createString(be.id);
      const typeOff = builder.createString(be.type);
      BinBoundElement.startBoundElement(builder);
      BinBoundElement.addId(builder, idOff);
      BinBoundElement.addType(builder, typeOff);
      return BinBoundElement.endBoundElement(builder);
    });
    const boundVector = BinDucElement.createBoundElementsVector(builder, boundOffsets);
    BinDucElement.addBoundElements(builder, boundVector);
  }
  if (element.zIndex !== undefined) {
    (BinDucElement as any).addZIndex?.(builder, element.zIndex);
  }
  if (element.link !== undefined) {
    const linkOffset = builder.createString(element.link);
    (BinDucElement as any).addLink?.(builder, linkOffset);
  }
  if (element.locked !== undefined) {
    (BinDucElement as any).addLocked?.(builder, element.locked);
  }
  if (element.customData) {
    const customOffset = builder.createString(JSON.stringify(element.customData));
    (BinDucElement as any).addCustomData?.(builder, customOffset);
  }
  
  // Create styles object first
  let stylesOffset: flatbuffers.Offset | null = null;
  if (backgroundVectorOffset || strokeVectorOffset || 
      element.roundness !== undefined || element.opacity !== undefined || element.blending !== undefined) {
    
    BinDucElementStyles.start_DucElementStylesBase(builder);
    
    if (element.roundness !== undefined) {
      const roundnessValue = getPrecisionValueField(element.roundness, false);
      if (roundnessValue !== null) BinDucElementStyles.addRoundness(builder, roundnessValue);
    }
    if (element.opacity !== undefined) {
      BinDucElementStyles.addOpacity(builder, element.opacity);
    }
    if (element.blending !== undefined) {
      BinDucElementStyles.addBlending(builder, element.blending);
    }
    if (backgroundVectorOffset) {
      BinDucElementStyles.addBackground(builder, backgroundVectorOffset);
    }
    if (strokeVectorOffset) {
      BinDucElementStyles.addStroke(builder, strokeVectorOffset);
    }
    
    stylesOffset = BinDucElementStyles.end_DucElementStylesBase(builder);
  }

  // Add styles to element if present
  if (stylesOffset) {
    BinDucElement.addStyles(builder, stylesOffset);
  }
  
  // Handle group IDs
  if (element.groupIds && element.groupIds.length > 0) {
    const groupIdOffsets = element.groupIds.map(id => builder.createString(id));
    const groupIdsVector = BinDucElement.createGroupIdsVector(builder, groupIdOffsets);
    BinDucElement.addGroupIds(builder, groupIdsVector);
  }

  return BinDucElement.end_DucElementBase(builder);
};

export const serializeDucPoint = (builder: flatbuffers.Builder, point: DucPoint): flatbuffers.Offset => {
  BinPoint.startDucPoint(builder);
  const xValue = getPrecisionValueField(point.x, false);
  if (xValue !== null) BinPoint.addX(builder, xValue);
  const yValue = getPrecisionValueField(point.y, false);
  if (yValue !== null) BinPoint.addY(builder, yValue);
  if (point.mirroring !== undefined) BinPoint.addMirroring(builder, point.mirroring);
  return BinPoint.endDucPoint(builder);
};

const serializeDucLineReference = (builder: flatbuffers.Builder, lineRef: DucLineReference): flatbuffers.Offset => {
  let handleOffset: flatbuffers.Offset | undefined;
  if (lineRef.handle) {
    const xValue = getPrecisionValueField(lineRef.handle.x, false);
    const yValue = getPrecisionValueField(lineRef.handle.y, false);
    if (xValue !== null && yValue !== null) {
      handleOffset = BinSimplePoint.createGeometricPoint(builder, xValue, yValue);
    }
  }

  BinDucLineReference.startDucLineReference(builder);
  BinDucLineReference.addIndex(builder, lineRef.index);
  if (handleOffset) BinDucLineReference.addHandle(builder, handleOffset);
  return BinDucLineReference.endDucLineReference(builder);
};

const serializeDucLine = (builder: flatbuffers.Builder, line: DucLine): flatbuffers.Offset => {
  const startOffset = serializeDucLineReference(builder, line[0]);
  const endOffset = serializeDucLineReference(builder, line[1]);

  BinDucLine.startDucLine(builder);
  BinDucLine.addStart(builder, startOffset);
  BinDucLine.addEnd(builder, endOffset);
  return BinDucLine.endDucLine(builder);
};

const serializeDucPath = (builder: flatbuffers.Builder, path: DucPath): flatbuffers.Offset => {
  const lineIndicesVector = BinDucPath.createLineIndicesVector(builder, Array.from(path.lineIndices));
  
  const backgroundOffset = path.background ? serializeElementBackground(builder, path.background) : undefined;
  const strokeOffset = path.stroke ? serializeElementStroke(builder, path.stroke) : undefined;

  BinDucPath.startDucPath(builder);
  BinDucPath.addLineIndices(builder, lineIndicesVector);
  if (backgroundOffset) BinDucPath.addBackground(builder, backgroundOffset);
  if (strokeOffset) BinDucPath.addStroke(builder, strokeOffset);
  return BinDucPath.endDucPath(builder);
};

export const serializeDucPointBinding = (builder: flatbuffers.Builder, pointBinding: DucPointBinding): flatbuffers.Offset => {
  const elementIdOffset = builder.createString(pointBinding.elementId);
  
  let fixedPointOffset: flatbuffers.Offset | undefined;
  if (pointBinding.fixedPoint) {
    const xValue = pointBinding.fixedPoint.x;
    const yValue = pointBinding.fixedPoint.y;
    if (typeof xValue === 'number' && typeof yValue === 'number') {
      fixedPointOffset = BinSimplePoint.createGeometricPoint(builder, xValue, yValue);
    }
  }
  
  let bindingPointOffset: flatbuffers.Offset | undefined;
  if (pointBinding.point) {
    BinBindingPoint.startPointBindingPoint(builder);
    BinBindingPoint.addIndex(builder, pointBinding.point.index);
    BinBindingPoint.addOffset(builder, pointBinding.point.offset);
    bindingPointOffset = BinBindingPoint.endPointBindingPoint(builder);
  }

  BinPointBinding.startDucPointBinding(builder);
  BinPointBinding.addElementId(builder, elementIdOffset);
  if (pointBinding.focus !== undefined) BinPointBinding.addFocus(builder, pointBinding.focus); 
  if (pointBinding.gap) {
    const gapValue = getPrecisionValueField(pointBinding.gap, false);
    if (gapValue !== null) BinPointBinding.addGap(builder, gapValue);
  }
  if (fixedPointOffset) BinPointBinding.addFixedPoint(builder, fixedPointOffset);
  if (bindingPointOffset) BinPointBinding.addPoint(builder, bindingPointOffset);
  if (pointBinding.head !== undefined && pointBinding.head !== null) {
    // Convert DucHead to number if needed
    const headValue = typeof pointBinding.head === 'object' ? pointBinding.head.type : pointBinding.head;
    BinPointBinding.addHead(builder, headValue);
  }
  return BinPointBinding.endDucPointBinding(builder);
};

const serializeTilingProperties = (builder: flatbuffers.Builder, tiling: TilingProperties): flatbuffers.Offset => {
  BinTilingProperties.startTilingProperties(builder);
  if (tiling.sizeInPercent !== undefined) BinTilingProperties.addSizeInPercent(builder, tiling.sizeInPercent);
  if (tiling.angle !== undefined) BinTilingProperties.addAngle(builder, tiling.angle);
  if (tiling.spacing !== undefined) BinTilingProperties.addSpacing(builder, tiling.spacing);
  if (tiling.offsetX !== undefined) BinTilingProperties.addOffsetX(builder, tiling.offsetX);
  if (tiling.offsetY !== undefined) BinTilingProperties.addOffsetY(builder, tiling.offsetY);
  return BinTilingProperties.endTilingProperties(builder);
};

const serializeElementContentBase = (builder: flatbuffers.Builder, content: ElementContentBase): flatbuffers.Offset => {
  const srcOffset = builder.createString(content.src);
  const tilingOffset = content.tiling ? serializeTilingProperties(builder, content.tiling) : undefined;

  BinElementContentBase.startElementContentBase(builder);
  if (content.preference !== undefined) BinElementContentBase.addPreference(builder, content.preference);
  BinElementContentBase.addSrc(builder, srcOffset);
  if (content.visible !== undefined) BinElementContentBase.addVisible(builder, content.visible);
  if (content.opacity !== undefined) BinElementContentBase.addOpacity(builder, content.opacity);
  if (tilingOffset) BinElementContentBase.addTiling(builder, tilingOffset);
  return BinElementContentBase.endElementContentBase(builder);
};

const serializeStrokeStyle = (builder: flatbuffers.Builder, style: StrokeStyle): flatbuffers.Offset => {
  const dashVector = style.dash && style.dash.length > 0 
    ? BinStrokeStyle.createDashVector(builder, style.dash)
    : undefined;

  BinStrokeStyle.startStrokeStyle(builder);
  if (style.preference !== undefined) BinStrokeStyle.addPreference(builder, style.preference);
  if (style.cap !== undefined) BinStrokeStyle.addCap(builder, style.cap);
  if (style.join !== undefined) BinStrokeStyle.addJoin(builder, style.join);
  if (dashVector) BinStrokeStyle.addDash(builder, dashVector);
  if (style.miterLimit !== undefined) BinStrokeStyle.addMiterLimit(builder, style.miterLimit); 
  return BinStrokeStyle.endStrokeStyle(builder);
};

const serializeStrokeSides = (builder: flatbuffers.Builder, sides: StrokeSides | undefined): flatbuffers.Offset | undefined => {
  if (!sides) return undefined;
  
  const valuesVector = sides.values && sides.values.length > 0
    ? BinStrokeSides.createValuesVector(builder, sides.values)
    : undefined;

  BinStrokeSides.startStrokeSides(builder);
  BinStrokeSides.addPreference(builder, sides.preference);
  if (valuesVector) BinStrokeSides.addValues(builder, valuesVector);
  return BinStrokeSides.endStrokeSides(builder);
};

export const serializeElementStroke = (builder: flatbuffers.Builder, stroke: ElementStroke): flatbuffers.Offset => {
  const contentOffset = serializeElementContentBase(builder, stroke.content);
  const styleOffset = serializeStrokeStyle(builder, stroke.style);
  const strokeSidesOffset = serializeStrokeSides(builder, stroke.strokeSides);

  BinElementStroke.startElementStroke(builder);
  BinElementStroke.addContent(builder, contentOffset);
  if (stroke.placement !== undefined) BinElementStroke.addPlacement(builder, stroke.placement);
  if (stroke.width) {
    const widthValue = getPrecisionValueField(stroke.width, false);
    if (widthValue !== null) BinElementStroke.addWidth(builder, widthValue);
  }
  if (styleOffset) BinElementStroke.addStyle(builder, styleOffset);
  if (strokeSidesOffset) BinElementStroke.addStrokeSides(builder, strokeSidesOffset);
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
  if (crop.x !== undefined) BinImageCrop.addX(builder, crop.x);
  if (crop.y !== undefined) BinImageCrop.addY(builder, crop.y);
  if (crop.width !== undefined) BinImageCrop.addWidth(builder, crop.width);
  if (crop.height !== undefined) BinImageCrop.addHeight(builder, crop.height);
  return BinImageCrop.endImageCrop(builder);
};

export const serializeDucLinearElementBase = (
  builder: flatbuffers.Builder,
  element: Pick<DucLinearElement, "points" | "lines" | "pathOverrides" | "lastCommittedPoint" | "startBinding" | "endBinding"> & DucElement,
): flatbuffers.Offset => {
  const baseOffset = serializeDucElementBase(builder, element as DucElement);
  
  // Serialize points
  let pointsVector: flatbuffers.Offset | null = null;
  if (element.points && element.points.length > 0) {
    const pointOffsets = element.points.map((point: DucPoint) => serializeDucPoint(builder, point));
    pointsVector = BinDucLinearElementBase.createPointsVector(builder, pointOffsets);
  }
  
  // Serialize lines
  let linesVector: flatbuffers.Offset | null = null;
  if (element.lines && element.lines.length > 0) {
    const lineOffsets = element.lines.map((line: DucLine) => {
      const startOffset = serializeDucLineReference(builder, line[0]);
      const endOffset = serializeDucLineReference(builder, line[1]);
      BinDucLine.startDucLine(builder);
      BinDucLine.addStart(builder, startOffset);
      BinDucLine.addEnd(builder, endOffset);
      return BinDucLine.endDucLine(builder);
    });
    linesVector = BinDucLinearElementBase.createLinesVector(builder, lineOffsets);
  }
  
  // Serialize path overrides
  let pathOverridesVector: flatbuffers.Offset | null = null;
  if (element.pathOverrides && element.pathOverrides.length > 0) {
    const pathOffsets = element.pathOverrides.map((path: DucPath) => {
      const lineIndicesVector = BinDucPath.createLineIndicesVector(builder, Array.from(path.lineIndices));
      
      const backgroundOffset = path.background ? serializeElementBackground(builder, path.background) : 0;
      const strokeOffset = path.stroke ? serializeElementStroke(builder, path.stroke) : 0;

      BinDucPath.startDucPath(builder);
      BinDucPath.addLineIndices(builder, lineIndicesVector);
      if (backgroundOffset) BinDucPath.addBackground(builder, backgroundOffset);
      if (strokeOffset) BinDucPath.addStroke(builder, strokeOffset);
      return BinDucPath.endDucPath(builder);
    });
    pathOverridesVector = BinDucLinearElementBase.createPathOverridesVector(builder, pathOffsets);
  }
  
  // Serialize last committed point
  let lastCommittedPointOffset: flatbuffers.Offset | null = null;
  if (element.lastCommittedPoint) {
    lastCommittedPointOffset = serializeDucPoint(builder, element.lastCommittedPoint);
  }
  
  // Serialize bindings
  let startBindingOffset: flatbuffers.Offset | null = null;
  if (element.startBinding) {
    startBindingOffset = serializeDucPointBinding(builder, element.startBinding);
  }
  
  let endBindingOffset: flatbuffers.Offset | null = null;
  if (element.endBinding) {
    endBindingOffset = serializeDucPointBinding(builder, element.endBinding);
  }

  BinDucLinearElementBase.start_DucLinearElementBase(builder);
  BinDucLinearElementBase.addBase(builder, baseOffset);
  
  if (pointsVector) BinDucLinearElementBase.addPoints(builder, pointsVector);
  if (linesVector) BinDucLinearElementBase.addLines(builder, linesVector);
  if (pathOverridesVector) BinDucLinearElementBase.addPathOverrides(builder, pathOverridesVector);
  if (lastCommittedPointOffset) BinDucLinearElementBase.addLastCommittedPoint(builder, lastCommittedPointOffset);
  if (startBindingOffset) BinDucLinearElementBase.addStartBinding(builder, startBindingOffset);
  if (endBindingOffset) BinDucLinearElementBase.addEndBinding(builder, endBindingOffset);
  
  return BinDucLinearElementBase.end_DucLinearElementBase(builder);
};
