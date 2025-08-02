import {
  DucRectangleElement as BinDucRectangleElement,
  DucPolygonElement as BinDucPolygonElement,
  DucEllipseElement as BinDucEllipseElement,
  DucImageElement as BinDucImageElement,
  DucTextElement as BinDucTextElement,
  DucLinearElement as BinDucLinearElement,
  DucArrowElement as BinDucArrowElement,
  DucFreeDrawElement as BinDucFreeDrawElement,
  DucBlockInstanceElement as BinDucBlockInstanceElement,
  DucFrameElement as BinDucFrameElement,
  DucPlotElement as BinDucPlotElement,
  DucViewportElement as BinDucViewportElement,
  DucXRayElement as BinDucXRayElement,
  DucLeaderElement as BinDucLeaderElement,
  DucDimensionElement as BinDucDimensionElement,
  DucFeatureControlFrameElement as BinDucFeatureControlFrameElement,
  DucDocElement as BinDucDocElement,
  DucParametricElement as BinDucParametricElement,
  DucEmbeddableElement as BinDucEmbeddableElement,
  DucPdfElement as BinDucPdfElement,
  DucMermaidElement as BinDucMermaidElement,
  DucTableElement as BinDucTableElement,
  ImageCrop as BinImageCrop,
  DucImageFilter as BinDucImageFilter,
  _DucLinearElementBase as BinDucLinearElementBase,
  _DucStackElementBase as BinDucStackElementBase,
  _DucStackBase as BinDucStackBase,
  _DucElementStylesBase as BinDucElementStyles,
  DucPoint as BinDucPoint,
  DucPointBinding as BinDucPointBinding,
  DucLine as BinDucLine,
  DucPath as BinDucPath,
  DucHead as BinDucHead,
  DucFreeDrawEnds as BinDucFreeDrawEnds,
  DucBlockDuplicationArray as BinDucBlockDuplicationArray,
  DucBlockAttributeDefinition as BinDucBlockAttributeDefinition,
  DucBlockAttributeDefinitionEntry as BinDucBlockAttributeDefinitionEntry,
  StringValueEntry as BinStringValueEntry,
  DucBlock as BinDucBlock,
  PlotLayout as BinPlotLayout,
  DucView as BinDucView,
  GeometricPoint as BinGeometricPoint,
  DucTextDynamicPart as BinDucTextDynamicPart,
  DucTextDynamicSource as BinDucTextDynamicSource,
  DucTextDynamicElementSource as BinDucTextDynamicElementSource,
  DucTextDynamicDictionarySource as BinDucTextDynamicDictionarySource,
  PrimaryUnits as BinPrimaryUnits,
  LinearUnitSystem as BinLinearUnitSystem,
  AngularUnitSystem as BinAngularUnitSystem,
  _UnitSystemBase as BinUnitSystemBase,
  DucTableColumn as BinDucTableColumn,
  DucTableRow as BinDucTableRow,
  DucTableCellSpan as BinDucTableCellSpan,
  DucTableCell as BinDucTableCell,
  DucTableAutoSize as BinDucTableAutoSize,
  DucTableColumnEntry as BinDucTableColumnEntry,
  DucTableRowEntry as BinDucTableRowEntry,
  DucTableCellEntry as BinDucTableCellEntry,
  LeaderContent as BinLeaderContent,
  LeaderTextBlockContent as BinLeaderTextBlockContent,
  LeaderBlockContent as BinLeaderBlockContent,
  DimensionDefinitionPoints as BinDimensionDefinitionPoints,
  DimensionBindings as BinDimensionBindings,
  DimensionBaselineData as BinDimensionBaselineData,
  DimensionContinueData as BinDimensionContinueData,
  DimensionToleranceStyle as BinDimensionToleranceStyle,
  DimensionFitStyle as BinDimensionFitStyle,
  DimensionLineStyle as BinDimensionLineStyle,
  DimensionExtLineStyle as BinDimensionExtLineStyle,
  DimensionSymbolStyle as BinDimensionSymbolStyle,
  DatumReference as BinDatumReference,
  ToleranceClause as BinToleranceClause,
  FeatureControlFrameSegment as BinFeatureControlFrameSegment,
  FCFBetweenModifier as BinFCFBetweenModifier,
  FCFProjectedZoneModifier as BinFCFProjectedZoneModifier,
  FCFFrameModifiers as BinFCFFrameModifiers,
  FCFDatumDefinition as BinFCFDatumDefinition,
  FCFSegmentRow as BinFCFSegmentRow,
  TextColumn as BinTextColumn,
  ColumnLayout as BinColumnLayout,
  ParametricSource as BinParametricSource,
  LineSpacing as BinLineSpacing,
  TilingProperties as BinTilingProperties,
  HatchPatternLine as BinHatchPatternLine,
  CustomHatchPattern as BinCustomHatchPattern,
  DucHatchStyle as BinDucHatchStyle,
  ElementContentBase as BinElementContentBase,
  StrokeStyle as BinStrokeStyle,
  StrokeSides as BinStrokeSides,
  ElementStroke as BinElementStroke,
  ElementBackground as BinElementBackground,
  DucStackLikeStyles as BinDucStackLikeStyles,
  DucTextStyle as BinDucTextStyle,
  DucTableCellStyle as BinDucTableCellStyle,
  DucTableStyle as BinDucTableStyle,
  DucLeaderStyle as BinDucLeaderStyle,
  DucDimensionStyle as BinDucDimensionStyle,
  DucFeatureControlFrameStyle as BinDucFeatureControlFrameStyle,
  DucDocStyle as BinDucDocStyle,
  DucViewportStyle as BinDucViewportStyle,
  DucPlotStyle as BinDucPlotStyle,
  DucXRayStyle as BinDucXRayStyle,
  Margins as BinMargins,
  ParagraphFormatting as BinParagraphFormatting,
  StackFormatProperties as BinStackFormatProperties,
  StackFormat as BinStackFormat,
  FCFLayoutStyle as BinFCFLayoutStyle,
  FCFSymbolStyle as BinFCFSymbolStyle,
  FCFDatumStyle as BinFCFDatumStyle,
  TEXT_FIELD_SOURCE_TYPE as BinTEXT_FIELD_SOURCE_TYPE,
  TEXT_FIELD_SOURCE_PROPERTY as BinTEXT_FIELD_SOURCE_PROPERTY,
  LEADER_CONTENT_TYPE,
  PARAMETRIC_SOURCE_TYPE,
} from 'ducjs/duc';
import { StandardUnits, _UnitSystemBase, AngularUnitsFormat, DimensionUnitsFormat } from "ducjs/technical/standards";
import { DucTextDynamicSource as AppDucTextDynamicSource } from "ducjs/types/elements";
import { getPrecisionValueField } from 'ducjs/serialize/serializationUtils';
import type {
  DucRectangleElement,
  DucPolygonElement,
  DucEllipseElement,
  DucImageElement,
  DucTextElement,
  DucLinearElement,
  DucArrowElement,
  DucFreeDrawElement,
  DucBlockInstanceElement,
  DucFrameElement,
  DucPlotElement,
  DucViewportElement,
  DucXRayElement,
  DucLeaderElement,
  DucDimensionElement,
  DucFeatureControlFrameElement,
  DucDocElement,
  DucParametricElement,
  DucEmbeddableElement,
  DucPdfElement,
  DucMermaidElement,
  DucTableElement,
  ImageCrop,
  DucImageFilter,
  DucPoint,
  DucPointBinding,
  DucLineReference,
  DucPath,
  DucHead,
  DucFreeDrawEnds,
  DucBlockDuplicationArray,
  DucBlockAttributeDefinition,
  DucBlock,
  PlotLayout,
  ElementContentBase,
  StrokeStyle,
  StrokeSides,
  ElementStroke,
  ElementBackground,
  DucStackLikeStyles,
  DucTextStyle,
  TilingProperties,
  DucHatchStyle,
  HatchPatternLine,
  CustomHatchPattern,
  DucTextDynamicPart,
  DucTextDynamicSource,
  DucTableStyle,
  DucTableCellStyle,
  DucTableColumn,
  DucTableRow,
  DucTableCell,
  _DucElementStylesBase,
} from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';
import { serializeDucElementBase, serializeDucLinearElementBase, serializeDucPoint, serializeDucPointBinding } from './serializeElementFromDuc';
import { serializeElementBackground, serializeElementStroke } from './serializeElementFromDuc';

// Helper function to serialize DucHead
const serializeDucHead = (builder: flatbuffers.Builder, head: DucHead): flatbuffers.Offset => {
    const blockIdOffset = head.blockId ? builder.createString(head.blockId) : 0;
    const sizeValue = getPrecisionValueField(head.size, false) ?? null!;
    
    BinDucHead.startDucHead(builder);
    if (head.type !== undefined) BinDucHead.addType(builder, head.type);
    if (blockIdOffset) BinDucHead.addBlockId(builder, blockIdOffset);
    BinDucHead.addSize(builder, sizeValue);
    return BinDucHead.endDucHead(builder);
};

const serializeImageCrop = (builder: flatbuffers.Builder, crop: ImageCrop): flatbuffers.Offset => {
  BinImageCrop.startImageCrop(builder);
  if (crop.x !== undefined) BinImageCrop.addX(builder, crop.x);
  if (crop.y !== undefined) BinImageCrop.addY(builder, crop.y);
  if (crop.width !== undefined) BinImageCrop.addWidth(builder, crop.width);
  if (crop.height !== undefined) BinImageCrop.addHeight(builder, crop.height);
  if (crop.naturalWidth !== undefined) BinImageCrop.addNaturalWidth(builder, crop.naturalWidth);
  if (crop.naturalHeight !== undefined) BinImageCrop.addNaturalHeight(builder, crop.naturalHeight);
  return BinImageCrop.endImageCrop(builder);
};

const serializeDucImageFilter = (builder: flatbuffers.Builder, filter: DucImageFilter): flatbuffers.Offset => {
  BinDucImageFilter.startDucImageFilter(builder);
  if (filter.brightness !== undefined) BinDucImageFilter.addBrightness(builder, filter.brightness);
  if (filter.contrast !== undefined) BinDucImageFilter.addContrast(builder, filter.contrast);
  return BinDucImageFilter.endDucImageFilter(builder);
};

const serializeDucTextDynamicSource = (builder: flatbuffers.Builder, source: AppDucTextDynamicSource): flatbuffers.Offset => {
  let sourceDataOffset: flatbuffers.Offset = 0;
  let sourceType: BinTEXT_FIELD_SOURCE_TYPE = BinTEXT_FIELD_SOURCE_TYPE.ELEMENT;

  // Based on the schema, check the source type directly
  if (source.sourceType === BinTEXT_FIELD_SOURCE_TYPE.ELEMENT) {
    sourceType = BinTEXT_FIELD_SOURCE_TYPE.ELEMENT;
    // Type-safe handling for element source
    if ('elementId' in source && 'property' in source) {
      const elementIdOffset = builder.createString(source.elementId ?? null!);
      BinDucTextDynamicElementSource.startDucTextDynamicElementSource(builder);
      BinDucTextDynamicElementSource.addElementId(builder, elementIdOffset);
      if (source.property !== undefined) {
        BinDucTextDynamicElementSource.addProperty(builder, source.property);
      }
      sourceDataOffset = BinDucTextDynamicElementSource.endDucTextDynamicElementSource(builder);
    }
  } else if (source.sourceType === BinTEXT_FIELD_SOURCE_TYPE.DICTIONARY) {
    sourceType = BinTEXT_FIELD_SOURCE_TYPE.DICTIONARY;
    // Type-safe handling for dictionary source
    if ('key' in source) {
      const keyOffset = builder.createString(source.key ?? null!);
      BinDucTextDynamicDictionarySource.startDucTextDynamicDictionarySource(builder);
      BinDucTextDynamicDictionarySource.addKey(builder, keyOffset);
      sourceDataOffset = BinDucTextDynamicDictionarySource.endDucTextDynamicDictionarySource(builder);
    }
  }

  BinDucTextDynamicSource.startDucTextDynamicSource(builder);
  BinDucTextDynamicSource.addTextSourceType(builder, sourceType);
  BinDucTextDynamicSource.addSource(builder, sourceDataOffset);
  return BinDucTextDynamicSource.endDucTextDynamicSource(builder);
};

const serializeDucTextDynamicPart = (builder: flatbuffers.Builder, part: DucTextDynamicPart): flatbuffers.Offset => {
  const tagOffset = builder.createString(part.tag);
  const sourceOffset = serializeDucTextDynamicSource(builder, part.source);
  const cachedValueOffset = builder.createString(part.cachedValue ?? null!);

  // Serialize formatting if present
  let formattingOffset: flatbuffers.Offset | null = null;
  if (part.formatting) {
    formattingOffset = serializePrimaryUnits(builder, part.formatting);
  }

  BinDucTextDynamicPart.startDucTextDynamicPart(builder);
  BinDucTextDynamicPart.addTag(builder, tagOffset);
  BinDucTextDynamicPart.addSource(builder, sourceOffset);
  if (formattingOffset) {
    BinDucTextDynamicPart.addFormatting(builder, formattingOffset);
  }
  BinDucTextDynamicPart.addCachedValue(builder, cachedValueOffset);
  return BinDucTextDynamicPart.endDucTextDynamicPart(builder);
};

const serializeUnitSystemBase = (builder: flatbuffers.Builder, unitSystem: _UnitSystemBase<AngularUnitsFormat | DimensionUnitsFormat>): flatbuffers.Offset => {
  BinUnitSystemBase.start_UnitSystemBase(builder);
  if (unitSystem.system !== undefined) BinUnitSystemBase.addSystem(builder, unitSystem.system);
  if (unitSystem.precision !== undefined) BinUnitSystemBase.addPrecision(builder, unitSystem.precision);
  if (unitSystem.suppressLeadingZeros !== undefined) BinUnitSystemBase.addSuppressLeadingZeros(builder, unitSystem.suppressLeadingZeros);
  if (unitSystem.suppressTrailingZeros !== undefined) BinUnitSystemBase.addSuppressTrailingZeros(builder, unitSystem.suppressTrailingZeros);
  return BinUnitSystemBase.end_UnitSystemBase(builder);
};

const serializeLinearUnitSystem = (builder: flatbuffers.Builder, linearUnit: StandardUnits["primaryUnits"]["linear"]): flatbuffers.Offset => {
  const baseOffset = serializeUnitSystemBase(builder, linearUnit);
  BinLinearUnitSystem.startLinearUnitSystem(builder);
  BinLinearUnitSystem.addBase(builder, baseOffset);
  if (linearUnit.format !== undefined) BinLinearUnitSystem.addFormat(builder, linearUnit.format);
  if (linearUnit.decimalSeparator !== undefined) BinLinearUnitSystem.addDecimalSeparator(builder, linearUnit.decimalSeparator);
  if (linearUnit.suppressZeroFeet !== undefined) BinLinearUnitSystem.addSuppressZeroFeet(builder, linearUnit.suppressZeroFeet);
  if (linearUnit.suppressZeroInches !== undefined) BinLinearUnitSystem.addSuppressZeroInches(builder, linearUnit.suppressZeroInches);
  return BinLinearUnitSystem.endLinearUnitSystem(builder);
};

const serializeAngularUnitSystem = (builder: flatbuffers.Builder, angularUnit: StandardUnits["primaryUnits"]["angular"]): flatbuffers.Offset => {
  const baseOffset = serializeUnitSystemBase(builder, angularUnit);
  BinAngularUnitSystem.startAngularUnitSystem(builder);
  BinAngularUnitSystem.addBase(builder, baseOffset);
  if (angularUnit.format !== undefined) BinAngularUnitSystem.addFormat(builder, angularUnit.format);
  return BinAngularUnitSystem.endAngularUnitSystem(builder);
};

const serializePrimaryUnits = (builder: flatbuffers.Builder, primaryUnits: StandardUnits["primaryUnits"]): flatbuffers.Offset => {
  const linearOffset = serializeLinearUnitSystem(builder, primaryUnits.linear);
  const angularOffset = serializeAngularUnitSystem(builder, primaryUnits.angular);
  
  BinPrimaryUnits.startPrimaryUnits(builder);
  BinPrimaryUnits.addLinear(builder, linearOffset);
  BinPrimaryUnits.addAngular(builder, angularOffset);
  return BinPrimaryUnits.endPrimaryUnits(builder);
};

const serializeDucTextStyle = (builder: flatbuffers.Builder, element: DucTextStyle): flatbuffers.Offset => {
  // Serialize base style only if present via background on element
  let baseStyleOffset: flatbuffers.Offset | null = null;
  if (Array.isArray(element.background) && element.background.length > 0) {
    baseStyleOffset = serializeElementBackground(builder, element.background[0]);
  }
  
  const fontFamilyOffset = element.fontFamily !== undefined ? builder.createString(element.fontFamily.toString()) : 0;
  const bigFontFamilyOffset = element.bigFontFamily !== undefined ? builder.createString(element.bigFontFamily.toString()) : 0;

  BinDucTextStyle.startDucTextStyle(builder);
  if (baseStyleOffset) BinDucTextStyle.addBaseStyle(builder, baseStyleOffset);
  if (element.isLtr !== undefined) BinDucTextStyle.addIsLtr(builder, element.isLtr);
  if (fontFamilyOffset) BinDucTextStyle.addFontFamily(builder, fontFamilyOffset);
  if (bigFontFamilyOffset) BinDucTextStyle.addBigFontFamily(builder, bigFontFamilyOffset);
  if (element.textAlign !== undefined) BinDucTextStyle.addTextAlign(builder, element.textAlign);
  if (element.verticalAlign !== undefined) BinDucTextStyle.addVerticalAlign(builder, element.verticalAlign);
  if (element.lineHeight !== undefined) BinDucTextStyle.addLineHeight(builder, element.lineHeight as DucTextElement["lineHeight"]);
  
  // Serialize line spacing
  if (element.lineSpacing) {
    BinLineSpacing.startLineSpacing(builder);
    // Handle the union type PrecisionValue | ScaleFactor
    let lineSpacingValue: number | null = null;
    if (typeof element.lineSpacing.value === 'number') {
      lineSpacingValue = element.lineSpacing.value as number;
    } else {
      // It's a PrecisionValue-like object, extract the raw value
      lineSpacingValue = getPrecisionValueField(element.lineSpacing.value, false);
    }
    if (lineSpacingValue !== null) {
      BinLineSpacing.addValue(builder, lineSpacingValue);
    }
    if (element.lineSpacing.type !== undefined) BinLineSpacing.addType(builder, element.lineSpacing.type);
    const lineSpacingOffset = BinLineSpacing.endLineSpacing(builder);
    BinDucTextStyle.addLineSpacing(builder, lineSpacingOffset);
  }
  
  if (element.obliqueAngle !== undefined) BinDucTextStyle.addObliqueAngle(builder, element.obliqueAngle);
  if (element.fontSize !== undefined) {
    const fontSizeValue = getPrecisionValueField(element.fontSize, false);
    if (fontSizeValue !== null) BinDucTextStyle.addFontSize(builder, fontSizeValue);
  }
  if (element.paperTextHeight !== undefined) {
    const paperTextHeightValue = getPrecisionValueField(element.paperTextHeight, false);
    if (paperTextHeightValue !== null) BinDucTextStyle.addPaperTextHeight(builder, paperTextHeightValue);
  }
  if (element.widthFactor !== undefined) {
    BinDucTextStyle.addWidthFactor(builder, element.widthFactor);
  }
  if (element.isUpsideDown !== undefined) {
    BinDucTextStyle.addIsUpsideDown(builder, element.isUpsideDown);
  }
  if (element.isBackwards !== undefined) {
    BinDucTextStyle.addIsBackwards(builder, element.isBackwards);
  }
  return BinDucTextStyle.endDucTextStyle(builder);
};

export const serializeDucRectangleElement = (builder: flatbuffers.Builder, element: DucRectangleElement): flatbuffers.Offset => {
  const baseOffset = serializeDucElementBase(builder, element);
  BinDucRectangleElement.startDucRectangleElement(builder);
  BinDucRectangleElement.addBase(builder, baseOffset);
  return BinDucRectangleElement.endDucRectangleElement(builder);
}

export const serializeDucPolygonElement = (builder: flatbuffers.Builder, element: DucPolygonElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    BinDucPolygonElement.startDucPolygonElement(builder);
    BinDucPolygonElement.addBase(builder, baseOffset);
    if (element.sides) BinDucPolygonElement.addSides(builder, element.sides);
    return BinDucPolygonElement.endDucPolygonElement(builder);
}

export const serializeDucEllipseElement = (builder: flatbuffers.Builder, element: DucEllipseElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    BinDucEllipseElement.startDucEllipseElement(builder);
    BinDucEllipseElement.addBase(builder, baseOffset);
    if (element.ratio) BinDucEllipseElement.addRatio(builder, element.ratio);
    if (element.startAngle) BinDucEllipseElement.addStartAngle(builder, element.startAngle);
    if (element.endAngle) BinDucEllipseElement.addEndAngle(builder, element.endAngle);
    if (element.showAuxCrosshair) BinDucEllipseElement.addShowAuxCrosshair(builder, element.showAuxCrosshair);
    return BinDucEllipseElement.endDucEllipseElement(builder);
}

export const serializeDucImageElement = (builder: flatbuffers.Builder, element: DucImageElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    const fileIdOffset = builder.createString(element.fileId);
    const cropOffset = element.crop ? serializeImageCrop(builder, element.crop) : 0;
    const filterOffset = element.filter ? serializeDucImageFilter(builder, element.filter) : 0;

    BinDucImageElement.startDucImageElement(builder);
    BinDucImageElement.addBase(builder, baseOffset);
    BinDucImageElement.addFileId(builder, fileIdOffset);
    if (element.status) BinDucImageElement.addStatus(builder, element.status);
    if (element.scale) {
        const scaleVector = BinDucImageElement.createScaleVector(builder, element.scale);
        BinDucImageElement.addScale(builder, scaleVector);
    }
    if (cropOffset) BinDucImageElement.addCrop(builder, cropOffset);
    if (filterOffset) BinDucImageElement.addFilter(builder, filterOffset);
    return BinDucImageElement.endDucImageElement(builder);
}

export const serializeDucTextElement = (builder: flatbuffers.Builder, element: DucTextElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    const textOffset = builder.createString(element.text);
    
    // Serialize style
    const styleOffset = serializeDucTextStyle(builder, element);
    
    // Serialize dynamic parts
    let dynamicVectorOffset: flatbuffers.Offset | null = null;
    if (element.dynamic && element.dynamic.length > 0) {
        const dynamicOffsets = element.dynamic.map(part => serializeDucTextDynamicPart(builder, part));
        dynamicVectorOffset = BinDucTextElement.createDynamicVector(builder, dynamicOffsets);
    }
    
    // Serialize containerId
    const containerIdOffset = element.containerId ? builder.createString(element.containerId) : null;
    
    // Serialize originalText
    const originalTextOffset = element.originalText !== undefined ? builder.createString(element.originalText) : 0;
    
    BinDucTextElement.startDucTextElement(builder);
    BinDucTextElement.addBase(builder, baseOffset);
    BinDucTextElement.addStyle(builder, styleOffset);
    BinDucTextElement.addText(builder, textOffset);
    if (dynamicVectorOffset) {
        BinDucTextElement.addDynamic(builder, dynamicVectorOffset);
    }
    if (element.autoResize) BinDucTextElement.addAutoResize(builder, element.autoResize);
    if (containerIdOffset) BinDucTextElement.addContainerId(builder, containerIdOffset);
    BinDucTextElement.addOriginalText(builder, originalTextOffset);
    return BinDucTextElement.endDucTextElement(builder);
}

export const serializeDucLinearElement = (builder: flatbuffers.Builder, element: DucLinearElement): flatbuffers.Offset => {
    const linearBaseOffset = serializeDucLinearElementBase(builder, element);
    BinDucLinearElement.startDucLinearElement(builder);
    BinDucLinearElement.addLinearBase(builder, linearBaseOffset);
    if (element.wipeoutBelow) BinDucLinearElement.addWipeoutBelow(builder, element.wipeoutBelow);
    return BinDucLinearElement.endDucLinearElement(builder);
}

export const serializeDucArrowElement = (builder: flatbuffers.Builder, element: DucArrowElement): flatbuffers.Offset => {
    const linearBaseOffset = serializeDucLinearElementBase(builder, element);
    BinDucArrowElement.startDucArrowElement(builder);
    BinDucArrowElement.addLinearBase(builder, linearBaseOffset);
    if (element.elbowed) BinDucArrowElement.addElbowed(builder, element.elbowed);
    return BinDucArrowElement.endDucArrowElement(builder);
}

export const serializeDucFreeDrawElement = (builder: flatbuffers.Builder, element: DucFreeDrawElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Serialize points
    let pointsVector: flatbuffers.Offset | null = null;
    if (element.points && element.points.length > 0) {
        const pointOffsets = element.points.map((point: DucPoint) => serializeDucPoint(builder, point));
        pointsVector = BinDucFreeDrawElement.createPointsVector(builder, pointOffsets);
    }
    
    // Serialize start and end (these are DucFreeDrawEnds objects, not GeometricPoint)
    let startOffset: flatbuffers.Offset | null = null;
    if (element.start) {
        const easingOffset = builder.createString(element.start.easing.toString());
        BinDucFreeDrawEnds.startDucFreeDrawEnds(builder);
        BinDucFreeDrawEnds.addCap(builder, element.start.cap);
        BinDucFreeDrawEnds.addTaper(builder, element.start.taper);
        BinDucFreeDrawEnds.addEasing(builder, easingOffset);
        startOffset = BinDucFreeDrawEnds.endDucFreeDrawEnds(builder);
    }
    
    let endOffset: flatbuffers.Offset | null = null;
    if (element.end) {
        const easingOffset = builder.createString(element.end.easing.toString());
        BinDucFreeDrawEnds.startDucFreeDrawEnds(builder);
        BinDucFreeDrawEnds.addCap(builder, element.end.cap);
        BinDucFreeDrawEnds.addTaper(builder, element.end.taper);
        BinDucFreeDrawEnds.addEasing(builder, easingOffset);
        endOffset = BinDucFreeDrawEnds.endDucFreeDrawEnds(builder);
    }
    
    // Serialize pressures
    let pressuresVector: flatbuffers.Offset | null = null;
    if (element.pressures && element.pressures.length > 0) {
        // Convert readonly array to mutable array for flatbuffers
        const mutablePressures = [...element.pressures];
        pressuresVector = BinDucFreeDrawElement.createPressuresVector(builder, mutablePressures);
    }
    
    // Serialize last committed point
    let lastCommittedPointOffset: flatbuffers.Offset | null = null;
    if (element.lastCommittedPoint) {
        lastCommittedPointOffset = serializeDucPoint(builder, element.lastCommittedPoint);
    }
    
    // Serialize SVG path
    const svgPathOffset = element.svgPath ? builder.createString(element.svgPath) : null;

    BinDucFreeDrawElement.startDucFreeDrawElement(builder);
    BinDucFreeDrawElement.addBase(builder, baseOffset);
    
    if (pointsVector) BinDucFreeDrawElement.addPoints(builder, pointsVector);
    if (startOffset) BinDucFreeDrawElement.addStart(builder, startOffset);
    if (endOffset) BinDucFreeDrawElement.addEnd(builder, endOffset);
    if (pressuresVector) BinDucFreeDrawElement.addPressures(builder, pressuresVector);
    if (lastCommittedPointOffset) BinDucFreeDrawElement.addLastCommittedPoint(builder, lastCommittedPointOffset);
    if (svgPathOffset) BinDucFreeDrawElement.addSvgPath(builder, svgPathOffset);
    
    if (element.size) {
        const sizeValue = getPrecisionValueField(element.size, false);
        if (sizeValue !== null) BinDucFreeDrawElement.addSize(builder, sizeValue);
    }
    if (element.thinning) BinDucFreeDrawElement.addThinning(builder, element.thinning);
    if (element.smoothing) BinDucFreeDrawElement.addSmoothing(builder, element.smoothing);
    if (element.streamline) BinDucFreeDrawElement.addStreamline(builder, element.streamline);
    if (element.easing) {
        const easingOffset = builder.createString(element.easing.toString());
        BinDucFreeDrawElement.addEasing(builder, easingOffset);
    }
    if (element.simulatePressure) BinDucFreeDrawElement.addSimulatePressure(builder, element.simulatePressure);
    return BinDucFreeDrawElement.endDucFreeDrawElement(builder);
}

export const serializeDucBlockInstanceElement = (builder: flatbuffers.Builder, element: DucBlockInstanceElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    const blockIdOffset = builder.createString(element.blockId);

    // element_overrides
    let elementOverridesVector: flatbuffers.Offset | null = null;
    if (element.elementOverrides && Object.keys(element.elementOverrides).length > 0) {
        const overrides = Object.entries(element.elementOverrides).map(([key, value]) => {
            const keyOffset = builder.createString(key);
            const valueOffset = builder.createString(value);
            BinStringValueEntry.startStringValueEntry(builder);
            BinStringValueEntry.addKey(builder, keyOffset);
            BinStringValueEntry.addValue(builder, valueOffset);
            return BinStringValueEntry.endStringValueEntry(builder);
        });
        elementOverridesVector = BinDucBlockInstanceElement.createElementOverridesVector(builder, overrides);
    }

    // attribute_values
    let attributeValuesVector: flatbuffers.Offset | null = null;
    if (element.attributeValues && Object.keys(element.attributeValues).length > 0) {
        const attrs = Object.entries(element.attributeValues).map(([key, value]) => {
            const keyOffset = builder.createString(key);
            const valueOffset = builder.createString(value);
            BinStringValueEntry.startStringValueEntry(builder);
            BinStringValueEntry.addKey(builder, keyOffset);
            BinStringValueEntry.addValue(builder, valueOffset);
            return BinStringValueEntry.endStringValueEntry(builder);
        });
        attributeValuesVector = BinDucBlockInstanceElement.createAttributeValuesVector(builder, attrs);
    }

    // duplication_array
    let duplicationArrayOffset: flatbuffers.Offset = 0;
    if (element.duplicationArray) {
        BinDucBlockDuplicationArray.startDucBlockDuplicationArray(builder);
        BinDucBlockDuplicationArray.addRows(builder, element.duplicationArray.rows);
        BinDucBlockDuplicationArray.addCols(builder, element.duplicationArray.cols);
        const rowSpacingValue = getPrecisionValueField(element.duplicationArray.rowSpacing, false);
        if (rowSpacingValue !== null) {
            BinDucBlockDuplicationArray.addRowSpacing(builder, rowSpacingValue);
        }
        const colSpacingValue = getPrecisionValueField(element.duplicationArray.colSpacing, false);
        if (colSpacingValue !== null) {
            BinDucBlockDuplicationArray.addColSpacing(builder, colSpacingValue);
        }
        duplicationArrayOffset = BinDucBlockDuplicationArray.endDucBlockDuplicationArray(builder);
    }

    BinDucBlockInstanceElement.startDucBlockInstanceElement(builder);
    BinDucBlockInstanceElement.addBase(builder, baseOffset);
    BinDucBlockInstanceElement.addBlockId(builder, blockIdOffset);
    if (elementOverridesVector) BinDucBlockInstanceElement.addElementOverrides(builder, elementOverridesVector);
    if (attributeValuesVector) BinDucBlockInstanceElement.addAttributeValues(builder, attributeValuesVector);
    if (duplicationArrayOffset) BinDucBlockInstanceElement.addDuplicationArray(builder, duplicationArrayOffset);
    return BinDucBlockInstanceElement.endDucBlockInstanceElement(builder);
}

export const serializeDucFrameElement = (builder: flatbuffers.Builder, element: DucFrameElement): flatbuffers.Offset => {
    // Serialize the stack element base properties
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Create stack base
    const labelOffset = builder.createString(element.label);
    const descriptionOffset = element.description ? builder.createString(element.description) : null;
    const labelingColorOffset = builder.createString(element.labelingColor ?? null!);
    
    BinDucStackLikeStyles.startDucStackLikeStyles(builder);
    BinDucStackLikeStyles.addOpacity(builder, element.opacity ?? null!);
    BinDucStackLikeStyles.addLabelingColor(builder, labelingColorOffset);
    const stackStylesOffset = BinDucStackLikeStyles.endDucStackLikeStyles(builder);
    
    BinDucStackBase.start_DucStackBase(builder);
    BinDucStackBase.addLabel(builder, labelOffset);
    if (descriptionOffset) {
        BinDucStackBase.addDescription(builder, descriptionOffset);
    }
    if (element.isCollapsed !== undefined) {
        BinDucStackBase.addIsCollapsed(builder, element.isCollapsed);
    }
    if (element.isPlot !== undefined) {
        BinDucStackBase.addIsPlot(builder, element.isPlot);
    }
    if (element.isVisible !== undefined) {
        BinDucStackBase.addIsVisible(builder, element.isVisible);
    }
    if (element.locked !== undefined) {
        BinDucStackBase.addLocked(builder, element.locked);
    }
    BinDucStackBase.addStyles(builder, stackStylesOffset);
    const stackBaseOffset = BinDucStackBase.end_DucStackBase(builder);
    
    // Create stack element base
    BinDucStackElementBase.start_DucStackElementBase(builder);
    BinDucStackElementBase.addBase(builder, baseOffset);
    BinDucStackElementBase.addStackBase(builder, stackBaseOffset);
    if (element.clip !== undefined) {
        BinDucStackElementBase.addClip(builder, element.clip);
    }
    if (element.labelVisible !== undefined) {
        BinDucStackElementBase.addLabelVisible(builder, element.labelVisible);
    }
    if (element.standardOverride) {
        const standardOverrideOffset = builder.createString(element.standardOverride);
        BinDucStackElementBase.addStandardOverride(builder, standardOverrideOffset);
    }
    const stackElementBaseOffset = BinDucStackElementBase.end_DucStackElementBase(builder);
    
    BinDucFrameElement.startDucFrameElement(builder);
    BinDucFrameElement.addStackElementBase(builder, stackElementBaseOffset);
    return BinDucFrameElement.endDucFrameElement(builder);
}

export const serializeDucPlotElement = (builder: flatbuffers.Builder, element: DucPlotElement): flatbuffers.Offset => {
    // Serialize the stack element base properties
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Create stack base
    const labelOffset = builder.createString(element.label);
    const descriptionOffset = element.description ? builder.createString(element.description) : null;
    const labelingColorOffset = builder.createString(element.labelingColor);
    
    BinDucStackLikeStyles.startDucStackLikeStyles(builder);
    BinDucStackLikeStyles.addOpacity(builder, element.opacity ?? null!);
    BinDucStackLikeStyles.addLabelingColor(builder, labelingColorOffset);
    const stackStylesOffset = BinDucStackLikeStyles.endDucStackLikeStyles(builder);
    
    BinDucStackBase.start_DucStackBase(builder);
    BinDucStackBase.addLabel(builder, labelOffset);
    if (descriptionOffset) {
        BinDucStackBase.addDescription(builder, descriptionOffset);
    }
    if (element.isCollapsed !== undefined) {
        BinDucStackBase.addIsCollapsed(builder, element.isCollapsed);
    }
    if (element.isPlot !== undefined) {
        BinDucStackBase.addIsPlot(builder, element.isPlot);
    }
    if (element.isVisible !== undefined) {
        BinDucStackBase.addIsVisible(builder, element.isVisible);
    }
    if (element.locked !== undefined) {
        BinDucStackBase.addLocked(builder, element.locked);
    }
    BinDucStackBase.addStyles(builder, stackStylesOffset);
    const stackBaseOffset = BinDucStackBase.end_DucStackBase(builder);
    
    // Create stack element base
    BinDucStackElementBase.start_DucStackElementBase(builder);
    BinDucStackElementBase.addBase(builder, baseOffset);
    BinDucStackElementBase.addStackBase(builder, stackBaseOffset);
    if (element.clip !== undefined) {
        BinDucStackElementBase.addClip(builder, element.clip);
    }
    if (element.labelVisible !== undefined) {
        BinDucStackElementBase.addLabelVisible(builder, element.labelVisible);
    }
    if (element.standardOverride) {
        const standardOverrideOffset = builder.createString(element.standardOverride);
        BinDucStackElementBase.addStandardOverride(builder, standardOverrideOffset);
    }
    const stackElementBaseOffset = BinDucStackElementBase.end_DucStackElementBase(builder);
    
    // Create plot style
    let plotStyleBaseOffset: flatbuffers.Offset | null = null;
    if (Array.isArray(element.background) && element.background.length > 0) {
        plotStyleBaseOffset = serializeElementBackground(builder, element.background[0]);
    }
    BinDucPlotStyle.startDucPlotStyle(builder);
    if (plotStyleBaseOffset) BinDucPlotStyle.addBaseStyle(builder, plotStyleBaseOffset);
    const plotStyleOffset = BinDucPlotStyle.endDucPlotStyle(builder);
    
    // Create layout
    if (element.layout) {
        BinMargins.startMargins(builder);
        const top = getPrecisionValueField(element.layout.margins.top, false);
        const right = getPrecisionValueField(element.layout.margins.right, false);
        const bottom = getPrecisionValueField(element.layout.margins.bottom, false);
        const left = getPrecisionValueField(element.layout.margins.left, false);
        if (top !== null) BinMargins.addTop(builder, top);
        if (right !== null) BinMargins.addRight(builder, right);
        if (bottom !== null) BinMargins.addBottom(builder, bottom);
        if (left !== null) BinMargins.addLeft(builder, left);
        const marginsOffset = BinMargins.endMargins(builder);
        
        BinPlotLayout.startPlotLayout(builder);
        BinPlotLayout.addMargins(builder, marginsOffset);
        const layoutOffset = BinPlotLayout.endPlotLayout(builder);
        
        BinDucPlotElement.startDucPlotElement(builder);
        BinDucPlotElement.addStackElementBase(builder, stackElementBaseOffset);
        BinDucPlotElement.addStyle(builder, plotStyleOffset);
        BinDucPlotElement.addLayout(builder, layoutOffset);
    } else {
        BinDucPlotElement.startDucPlotElement(builder);
        BinDucPlotElement.addStackElementBase(builder, stackElementBaseOffset);
        BinDucPlotElement.addStyle(builder, plotStyleOffset);
    }
    
    return BinDucPlotElement.endDucPlotElement(builder);
}

export const serializeDucViewportElement = (builder: flatbuffers.Builder, element: DucViewportElement): flatbuffers.Offset => {
    // Serialize linear base (viewport extends linear element)
    const linearBaseOffset = serializeDucLinearElementBase(builder, element);
    
    // Create stack base
    const labelOffset = builder.createString(element.label);
    const descriptionOffset = element.description ? builder.createString(element.description) : null;
    const labelingColorOffset = builder.createString(element.labelingColor);

    BinDucStackLikeStyles.startDucStackLikeStyles(builder);
    BinDucStackLikeStyles.addOpacity(builder, element.opacity ?? null!);
    BinDucStackLikeStyles.addLabelingColor(builder, labelingColorOffset);
    const stackStylesOffset = BinDucStackLikeStyles.endDucStackLikeStyles(builder);
    
    BinDucStackBase.start_DucStackBase(builder);
    BinDucStackBase.addLabel(builder, labelOffset);
    if (descriptionOffset) {
        BinDucStackBase.addDescription(builder, descriptionOffset);
    }
    if (element.isCollapsed !== undefined) {
        BinDucStackBase.addIsCollapsed(builder, element.isCollapsed);
    }
    if (element.isPlot !== undefined) {
        BinDucStackBase.addIsPlot(builder, element.isPlot);
    }
    if (element.isVisible !== undefined) {
        BinDucStackBase.addIsVisible(builder, element.isVisible);
    }
    if (element.locked !== undefined) {
        BinDucStackBase.addLocked(builder, element.locked);
    }
    BinDucStackBase.addStyles(builder, stackStylesOffset);
    const stackBaseOffset = BinDucStackBase.end_DucStackBase(builder);
    
    // Create viewport style
    let viewportStyleBaseOffset: flatbuffers.Offset | null = null;
    if (Array.isArray(element.background) && element.background.length > 0) {
        viewportStyleBaseOffset = serializeElementBackground(builder, element.background[0]);
    }
    BinDucViewportStyle.startDucViewportStyle(builder);
    if (viewportStyleBaseOffset) BinDucViewportStyle.addBaseStyle(builder, viewportStyleBaseOffset);
    if (element.scaleIndicatorVisible !== undefined) BinDucViewportStyle.addScaleIndicatorVisible(builder, element.scaleIndicatorVisible);
    const viewportStyleOffset = BinDucViewportStyle.endDucViewportStyle(builder);
    
    // Create view
    let viewOffset: flatbuffers.Offset | null = null;
    if (element.view) {
        // Serialize DucView properties
        BinDucView.startDucView(builder);
        if (element.view.scrollX !== undefined) {
            const scrollXValue = getPrecisionValueField(element.view.scrollX, false);
            if (scrollXValue !== null) BinDucView.addScrollX(builder, scrollXValue);
        }
        if (element.view.scrollY !== undefined) {
            const scrollYValue = getPrecisionValueField(element.view.scrollY, false);
            if (scrollYValue !== null) BinDucView.addScrollY(builder, scrollYValue);
        }
        if (element.view.zoom !== undefined) {
            // Zoom type has a scoped property that can be used directly
            BinDucView.addZoom(builder, element.view.zoom.scoped);
        }
        if (element.view.twistAngle !== undefined) {
            // Radian is a branded number, pass it directly
            BinDucView.addTwistAngle(builder, element.view.twistAngle);
        }
        if (element.view.scope) {
            const scopeOffset = builder.createString(element.view.scope);
            BinDucView.addScope(builder, scopeOffset);
        }
        // center_point (optional)
        if (element.view.centerPoint) {
            const cx = getPrecisionValueField(element.view.centerPoint.x, false);
            const cy = getPrecisionValueField(element.view.centerPoint.y, false);
            if (cx !== null && cy !== null) {
                const cp = BinGeometricPoint.createGeometricPoint(builder, cx, cy);
                BinDucView.addCenterPoint(builder, cp);
            }
        }
        viewOffset = BinDucView.endDucView(builder);
    }
    
    // Create frozen group IDs vector
    let frozenGroupIdsVector: flatbuffers.Offset | null = null;
    if (element.frozenGroupIds && element.frozenGroupIds.length > 0) {
        const groupIdOffsets = element.frozenGroupIds.map(id => builder.createString(id));
        frozenGroupIdsVector = BinDucViewportElement.createFrozenGroupIdsVector(builder, groupIdOffsets);
    }
    
    BinDucViewportElement.startDucViewportElement(builder);
    BinDucViewportElement.addLinearBase(builder, linearBaseOffset);
    BinDucViewportElement.addStackBase(builder, stackBaseOffset);
    BinDucViewportElement.addStyle(builder, viewportStyleOffset);
    if (viewOffset) {
        BinDucViewportElement.addView(builder, viewOffset);
    }
    if (element.scale) BinDucViewportElement.addScale(builder, element.scale);
    if (element.shadePlot) BinDucViewportElement.addShadePlot(builder, element.shadePlot);
    if (frozenGroupIdsVector) {
        BinDucViewportElement.addFrozenGroupIds(builder, frozenGroupIdsVector);
    }
    if (element.standardOverride) {
        const standardOverrideOffset = builder.createString(element.standardOverride);
        BinDucViewportElement.addStandardOverride(builder, standardOverrideOffset);
    }
    return BinDucViewportElement.endDucViewportElement(builder);
}

export const serializeDucXRayElement = (builder: flatbuffers.Builder, element: DucXRayElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Serialize style
    let styleBaseOffset: flatbuffers.Offset | null = null;
    if (Array.isArray(element.background) && element.background.length > 0) {
        styleBaseOffset = serializeElementBackground(builder, element.background[0]);
    }
    const colorOffset = element.color !== undefined ? builder.createString(element.color) : 0;
    BinDucXRayStyle.startDucXRayStyle(builder);
    if (styleBaseOffset) BinDucXRayStyle.addBaseStyle(builder, styleBaseOffset);
    if (colorOffset) BinDucXRayStyle.addColor(builder, colorOffset);
    const styleOffset = BinDucXRayStyle.endDucXRayStyle(builder);
    
    // Serialize origin point
    let originOffset: flatbuffers.Offset | null = null;
    if (element.origin) {
        const originX = getPrecisionValueField(element.origin.x, false);
        const originY = getPrecisionValueField(element.origin.y, false);
        if (originX !== null && originY !== null) {
            originOffset = BinGeometricPoint.createGeometricPoint(
                builder,
                originX,
                originY
            );
        }
    }
    
    // Serialize direction point
    let directionOffset: flatbuffers.Offset | null = null;
    if (element.direction) {
        const directionX = getPrecisionValueField(element.direction.x, false);
        const directionY = getPrecisionValueField(element.direction.y, false);
        if (directionX !== null && directionY !== null) {
            directionOffset = BinGeometricPoint.createGeometricPoint(
                builder,
                directionX,
                directionY
            );
        }
    }
    
    BinDucXRayElement.startDucXRayElement(builder);
    BinDucXRayElement.addBase(builder, baseOffset);
    BinDucXRayElement.addStyle(builder, styleOffset);
    if (originOffset) BinDucXRayElement.addOrigin(builder, originOffset);
    if (directionOffset) BinDucXRayElement.addDirection(builder, directionOffset);
    if (element.startFromOrigin) BinDucXRayElement.addStartFromOrigin(builder, element.startFromOrigin);
    return BinDucXRayElement.endDucXRayElement(builder);
}

export const serializeDucLeaderElement = (builder: flatbuffers.Builder, element: DucLeaderElement): flatbuffers.Offset => {
    // Serialize linear base properties
    const linearBaseOffset = serializeDucLinearElementBase(builder, element);
    
    // Serialize content if present
    let contentOffset: flatbuffers.Offset | null = null;
    if (element.leaderContent) {
        let contentDataOffset: flatbuffers.Offset = 0;
        let contentType: LEADER_CONTENT_TYPE = LEADER_CONTENT_TYPE.TEXT; // Default to text type
        
        if (element.leaderContent.type === "text") {
            contentType = LEADER_CONTENT_TYPE.TEXT;
            const textOffset = element.leaderContent.text !== undefined ? builder.createString(element.leaderContent.text) : 0;
            BinLeaderTextBlockContent.startLeaderTextBlockContent(builder);
            BinLeaderTextBlockContent.addText(builder, textOffset);
            contentDataOffset = BinLeaderTextBlockContent.endLeaderTextBlockContent(builder);
        } else if (element.leaderContent.type === "block") {
            contentType = LEADER_CONTENT_TYPE.BLOCK
            const blockIdOffset = element.leaderContent.blockId !== undefined ? builder.createString(element.leaderContent.blockId) : 0;
            
            // Serialize attribute values if present
            let attributeValuesVector: flatbuffers.Offset | null = null;
            if (element.leaderContent.instanceData?.attributeValues) {
                const entries = Object.entries(element.leaderContent.instanceData.attributeValues);
                const valueOffsets = entries.map(([key, value]) => {
                    const keyOffset = builder.createString(key);
                    const valueOffset = builder.createString(value);
                    BinDucBlockAttributeDefinitionEntry.startDucBlockAttributeDefinitionEntry(builder);
                    BinDucBlockAttributeDefinitionEntry.addKey(builder, keyOffset);
                    BinDucBlockAttributeDefinitionEntry.addValue(builder, valueOffset);
                    return BinDucBlockAttributeDefinitionEntry.endDucBlockAttributeDefinitionEntry(builder);
                });
                attributeValuesVector = BinLeaderBlockContent.createAttributeValuesVector(builder, valueOffsets);
            }
            
            // Serialize element overrides if present
            let elementOverridesVector: flatbuffers.Offset | null = null;
            if (element.leaderContent.instanceData?.elementOverrides) {
                const entries = Object.entries(element.leaderContent.instanceData.elementOverrides);
                const overrideOffsets = entries.map(([key, value]) => {
                    const keyOffset = builder.createString(key);
                    const valueOffset = builder.createString(value);
                    BinStringValueEntry.startStringValueEntry(builder);
                    BinStringValueEntry.addKey(builder, keyOffset);
                    BinStringValueEntry.addValue(builder, valueOffset);
                    return BinStringValueEntry.endStringValueEntry(builder);
                });
                elementOverridesVector = BinLeaderBlockContent.createElementOverridesVector(builder, overrideOffsets);
            }
            
            BinLeaderBlockContent.startLeaderBlockContent(builder);
            BinLeaderBlockContent.addBlockId(builder, blockIdOffset);
            if (attributeValuesVector) {
                BinLeaderBlockContent.addAttributeValues(builder, attributeValuesVector);
            }
            if (elementOverridesVector) {
                BinLeaderBlockContent.addElementOverrides(builder, elementOverridesVector);
            }
            contentDataOffset = BinLeaderBlockContent.endLeaderBlockContent(builder);
        }
        
        BinLeaderContent.startLeaderContent(builder);
        BinLeaderContent.addLeaderContentType(builder, contentType);
        BinLeaderContent.addContent(builder, contentDataOffset);
        contentOffset = BinLeaderContent.endLeaderContent(builder);
    }
    
    // Serialize content anchor point
    let contentAnchorOffset: flatbuffers.Offset | null = null;
    if (element.contentAnchor) {
        contentAnchorOffset = BinGeometricPoint.createGeometricPoint(
            builder, 
            element.contentAnchor.x, 
            element.contentAnchor.y
        );
    }
    
    // Serialize style properties
    let baseStyleOffset: flatbuffers.Offset | null = null;
    if (Array.isArray(element.background) && element.background.length > 0) {
        baseStyleOffset = serializeElementBackground(builder, element.background[0]);
    }
    
    // Serialize text style
    const textStyleOffset = serializeDucTextStyle(builder, element.textStyle);
    
    // Serialize heads override if present
    let headsOverrideVector: flatbuffers.Offset | null = null;
    if (element.headsOverride && element.headsOverride.length >= 2) {
        const headOffsets = element.headsOverride.map(head => {
            const blockIdOffset = head.blockId ? builder.createString(head.blockId) : 0;
            const sizeValue = getPrecisionValueField(head.size, false) ?? null!;
            
            BinDucHead.startDucHead(builder);
            BinDucHead.addType(builder, head.type);
            if (blockIdOffset) BinDucHead.addBlockId(builder, blockIdOffset);
            BinDucHead.addSize(builder, sizeValue);
            return BinDucHead.endDucHead(builder);
        });
        headsOverrideVector = BinDucLeaderStyle.createHeadsOverrideVector(builder, headOffsets);
    }
    
    // Serialize dogleg if present
    let doglegValue: number | null = null;
    if (element.dogleg !== undefined) {
        doglegValue = getPrecisionValueField(element.dogleg, false);
    }
    
    BinDucLeaderStyle.startDucLeaderStyle(builder);
    if (baseStyleOffset) BinDucLeaderStyle.addBaseStyle(builder, baseStyleOffset);
    if (textStyleOffset) BinDucLeaderStyle.addTextStyle(builder, textStyleOffset);
    if (headsOverrideVector) BinDucLeaderStyle.addHeadsOverride(builder, headsOverrideVector);
    if (doglegValue !== null) BinDucLeaderStyle.addDogleg(builder, doglegValue);
    if (element.textAttachment !== undefined) BinDucLeaderStyle.addTextAttachment(builder, element.textAttachment);
    if (element.blockAttachment !== undefined) BinDucLeaderStyle.addBlockAttachment(builder, element.blockAttachment);
    const styleOffset = BinDucLeaderStyle.endDucLeaderStyle(builder);
    
    BinDucLeaderElement.startDucLeaderElement(builder);
    BinDucLeaderElement.addLinearBase(builder, linearBaseOffset);
    if (styleOffset) BinDucLeaderElement.addStyle(builder, styleOffset);
    if (contentOffset) BinDucLeaderElement.addContent(builder, contentOffset);
    if (contentAnchorOffset) BinDucLeaderElement.addContentAnchor(builder, contentAnchorOffset);
    return BinDucLeaderElement.endDucLeaderElement(builder);
}

// Helper function to serialize DimensionDefinitionPoints
const serializeDimensionDefinitionPoints = (builder: flatbuffers.Builder, definitionPoints: DucDimensionElement["definitionPoints"]): flatbuffers.Offset => {
    BinDimensionDefinitionPoints.startDimensionDefinitionPoints(builder);
    
    if (definitionPoints.origin1) {
        const origin1Offset = BinGeometricPoint.createGeometricPoint(builder, definitionPoints.origin1.x, definitionPoints.origin1.y);
        BinDimensionDefinitionPoints.addOrigin1(builder, origin1Offset);
    }
    
    if (definitionPoints.origin2) {
        const origin2Offset = BinGeometricPoint.createGeometricPoint(builder, definitionPoints.origin2.x, definitionPoints.origin2.y);
        BinDimensionDefinitionPoints.addOrigin2(builder, origin2Offset);
    }
    
    if (definitionPoints.location) {
        const locationOffset = BinGeometricPoint.createGeometricPoint(builder, definitionPoints.location.x, definitionPoints.location.y);
        BinDimensionDefinitionPoints.addLocation(builder, locationOffset);
    }
    
    if (definitionPoints.center) {
        const centerOffset = BinGeometricPoint.createGeometricPoint(builder, definitionPoints.center.x, definitionPoints.center.y);
        BinDimensionDefinitionPoints.addCenter(builder, centerOffset);
    }
    
    if (definitionPoints.jog) {
        const jogOffset = BinGeometricPoint.createGeometricPoint(builder, definitionPoints.jog.x, definitionPoints.jog.y);
        BinDimensionDefinitionPoints.addJog(builder, jogOffset);
    }
    
    return BinDimensionDefinitionPoints.endDimensionDefinitionPoints(builder);
};

// Helper function to serialize DimensionBindings
const serializeDimensionBindings = (builder: flatbuffers.Builder, bindings: DucDimensionElement["bindings"]): flatbuffers.Offset | null => {
    if (!bindings) return null;
    
    let origin1Offset: flatbuffers.Offset | undefined;
    let origin2Offset: flatbuffers.Offset | undefined;
    let centerOffset: flatbuffers.Offset | undefined;
    
    if (bindings.origin1) {
        origin1Offset = serializeDucPointBinding(builder, bindings.origin1);
    }
    
    if (bindings.origin2) {
        origin2Offset = serializeDucPointBinding(builder, bindings.origin2);
    }
    
    if (bindings.center) {
        centerOffset = serializeDucPointBinding(builder, bindings.center);
    }
    
    BinDimensionBindings.startDimensionBindings(builder);
    if (origin1Offset) BinDimensionBindings.addOrigin1(builder, origin1Offset);
    if (origin2Offset) BinDimensionBindings.addOrigin2(builder, origin2Offset);
    if (centerOffset) BinDimensionBindings.addCenter(builder, centerOffset);
    return BinDimensionBindings.endDimensionBindings(builder);
};

// Helper function to serialize DimensionBaselineData
const serializeDimensionBaselineData = (builder: flatbuffers.Builder, baselineData: DucDimensionElement["baselineData"]): flatbuffers.Offset | null => {
    if (!baselineData) return null;
    
    let baseDimensionIdOffset: flatbuffers.Offset | undefined;
    if (baselineData.baseDimensionId) {
        baseDimensionIdOffset = builder.createString(baselineData.baseDimensionId);
    }
    
    BinDimensionBaselineData.startDimensionBaselineData(builder);
    if (baseDimensionIdOffset) BinDimensionBaselineData.addBaseDimensionId(builder, baseDimensionIdOffset);
    return BinDimensionBaselineData.endDimensionBaselineData(builder);
};

// Helper function to serialize DimensionContinueData
const serializeDimensionContinueData = (builder: flatbuffers.Builder, continueData: DucDimensionElement["continueData"]): flatbuffers.Offset | null => {
    if (!continueData) return null;
    
    let continueFromDimensionIdOffset: flatbuffers.Offset | undefined;
    if (continueData.continueFromDimensionId) {
        continueFromDimensionIdOffset = builder.createString(continueData.continueFromDimensionId);
    }
    
    BinDimensionContinueData.startDimensionContinueData(builder);
    if (continueFromDimensionIdOffset) BinDimensionContinueData.addContinueFromDimensionId(builder, continueFromDimensionIdOffset);
    return BinDimensionContinueData.endDimensionContinueData(builder);
};

// Helper function to serialize DimensionToleranceStyle
const serializeDimensionToleranceStyle = (builder: flatbuffers.Builder, tolerance: DucDimensionElement["toleranceOverride"]): flatbuffers.Offset => {
    if (!tolerance) return 0;
    
    let textStyleOffset: flatbuffers.Offset | undefined;
    if (tolerance.textStyle) {
        // Since tolerance.textStyle is Partial<DucTextStyle>, we only serialize if it has required fields
        // In a real implementation, you'd ensure required fields are present or use defaults
        try {
            textStyleOffset = serializeDucTextStyle(builder, tolerance.textStyle as DucTextStyle);
        } catch (e) {
            // Skip serialization if the text style is incomplete
            textStyleOffset = undefined;
        }
    }
    
    BinDimensionToleranceStyle.startDimensionToleranceStyle(builder);
    if (tolerance.enabled !== undefined) BinDimensionToleranceStyle.addEnabled(builder, tolerance.enabled);
    if (tolerance.displayMethod) BinDimensionToleranceStyle.addDisplayMethod(builder, tolerance.displayMethod);
    if (tolerance.upperValue !== undefined) BinDimensionToleranceStyle.addUpperValue(builder, tolerance.upperValue);
    if (tolerance.lowerValue !== undefined) BinDimensionToleranceStyle.addLowerValue(builder, tolerance.lowerValue);
    if (tolerance.precision !== undefined) BinDimensionToleranceStyle.addPrecision(builder, tolerance.precision);
    if (textStyleOffset) BinDimensionToleranceStyle.addTextStyle(builder, textStyleOffset);
    return BinDimensionToleranceStyle.endDimensionToleranceStyle(builder);
};

// Helper function to serialize DimensionFitStyle
const serializeDimensionFitStyle = (builder: flatbuffers.Builder, fit: DucDimensionElement["fit"]): flatbuffers.Offset => {
    if (!fit) return 0;
    
    BinDimensionFitStyle.startDimensionFitStyle(builder);
    if (fit.rule) BinDimensionFitStyle.addRule(builder, fit.rule);
    if (fit.textPlacement) BinDimensionFitStyle.addTextPlacement(builder, fit.textPlacement);
    if (fit.forceTextInside !== undefined) BinDimensionFitStyle.addForceTextInside(builder, fit.forceTextInside);
    return BinDimensionFitStyle.endDimensionFitStyle(builder);
};

// Helper function to serialize DimensionLineStyle
const serializeDimensionLineStyle = (builder: flatbuffers.Builder, dimLine: DucDimensionElement["dimLine"]): flatbuffers.Offset => {
    if (!dimLine) return 0;
    
    let strokeOffset: flatbuffers.Offset | undefined;
    if (dimLine.stroke) {
        strokeOffset = serializeElementStroke(builder, dimLine.stroke);
    }
    
    BinDimensionLineStyle.startDimensionLineStyle(builder);
    if (strokeOffset) BinDimensionLineStyle.addStroke(builder, strokeOffset);
    if (dimLine.textGap !== undefined) {
        const textGapValue = getPrecisionValueField(dimLine.textGap, false);
        if (textGapValue !== null) BinDimensionLineStyle.addTextGap(builder, textGapValue);
    }
    return BinDimensionLineStyle.endDimensionLineStyle(builder);
};

// Helper function to serialize DimensionExtLineStyle
const serializeDimensionExtLineStyle = (builder: flatbuffers.Builder, extLine: DucDimensionElement["extLine"]): flatbuffers.Offset => {
    if (!extLine) return 0;
    
    let strokeOffset: flatbuffers.Offset | undefined;
    if (extLine.stroke) {
        strokeOffset = serializeElementStroke(builder, extLine.stroke);
    }
    
    BinDimensionExtLineStyle.startDimensionExtLineStyle(builder);
    if (strokeOffset) BinDimensionExtLineStyle.addStroke(builder, strokeOffset);
    if (extLine.overshoot !== undefined) {
        const overshootValue = getPrecisionValueField(extLine.overshoot, false);
        if (overshootValue !== null) BinDimensionExtLineStyle.addOvershoot(builder, overshootValue);
    }
    if (extLine.offset !== undefined) {
        const offsetValue = getPrecisionValueField(extLine.offset, false);
        if (offsetValue !== null) BinDimensionExtLineStyle.addOffset(builder, offsetValue);
    }
    return BinDimensionExtLineStyle.endDimensionExtLineStyle(builder);
};

// Helper function to serialize DimensionSymbolStyle
const serializeDimensionSymbolStyle = (builder: flatbuffers.Builder, symbols: DucDimensionElement["symbols"]): flatbuffers.Offset => {
    if (!symbols) return 0;
    
    let headsOverrideOffset: flatbuffers.Offset | undefined;
    if (symbols.headsOverride && symbols.headsOverride.length > 0) {
        const headsOverrideOffsets = symbols.headsOverride.map(head => serializeDucHead(builder, head));
        headsOverrideOffset = BinDimensionSymbolStyle.createHeadsOverrideVector(builder, headsOverrideOffsets);
    }
    
    BinDimensionSymbolStyle.startDimensionSymbolStyle(builder);
    if (headsOverrideOffset) BinDimensionSymbolStyle.addHeadsOverride(builder, headsOverrideOffset);
    if (symbols.centerMark?.type) BinDimensionSymbolStyle.addCenterMarkType(builder, symbols.centerMark.type);
    if (symbols.centerMark?.size !== undefined) {
        const centerMarkSizeValue = getPrecisionValueField(symbols.centerMark.size, false);
        if (centerMarkSizeValue !== null) BinDimensionSymbolStyle.addCenterMarkSize(builder, centerMarkSizeValue);
    }
    return BinDimensionSymbolStyle.endDimensionSymbolStyle(builder);
};

// Helper function to serialize complete DucDimensionStyle
const serializeDucDimensionStyle = (builder: flatbuffers.Builder, element: DucDimensionElement): flatbuffers.Offset => {
    const dimLineOffset = serializeDimensionLineStyle(builder, element.dimLine);
    const extLineOffset = serializeDimensionExtLineStyle(builder, element.extLine);
    const textStyleOffset = element.textStyle ? serializeDucTextStyle(builder, element.textStyle) : undefined;
    const symbolsOffset = serializeDimensionSymbolStyle(builder, element.symbols);
    const toleranceOffset = serializeDimensionToleranceStyle(builder, element.tolerance);
    const fitOffset = serializeDimensionFitStyle(builder, element.fit);
    
    BinDucDimensionStyle.startDucDimensionStyle(builder);
    if (dimLineOffset) BinDucDimensionStyle.addDimLine(builder, dimLineOffset);
    if (extLineOffset) BinDucDimensionStyle.addExtLine(builder, extLineOffset);
    if (textStyleOffset) BinDucDimensionStyle.addTextStyle(builder, textStyleOffset);
    if (symbolsOffset) BinDucDimensionStyle.addSymbols(builder, symbolsOffset);
    if (toleranceOffset) BinDucDimensionStyle.addTolerance(builder, toleranceOffset);
    if (fitOffset) BinDucDimensionStyle.addFit(builder, fitOffset);
    return BinDucDimensionStyle.endDucDimensionStyle(builder);
};

export const serializeDucDimensionElement = (builder: flatbuffers.Builder, element: DucDimensionElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Serialize style from flattened dimension style properties
    const styleOffset = serializeDucDimensionStyle(builder, element);
    
    // Serialize definition points
    const definitionPointsOffset = serializeDimensionDefinitionPoints(builder, element.definitionPoints);
    
    // Serialize bindings if present
    let bindingsOffset: flatbuffers.Offset | null = null;
    if (element.bindings) {
        bindingsOffset = serializeDimensionBindings(builder, element.bindings);
    }
    
    // Serialize text override if present
    let textOverrideOffset: flatbuffers.Offset | undefined;
    if (element.textOverride) {
        textOverrideOffset = builder.createString(element.textOverride);
    }
    
    // Serialize text position if present
    let textPositionOffset: flatbuffers.Offset | undefined;
    if (element.textPosition) {
        textPositionOffset = BinGeometricPoint.createGeometricPoint(builder, element.textPosition.x, element.textPosition.y);
    }
    
    // Serialize tolerance override if present
    let toleranceOverrideOffset: flatbuffers.Offset | undefined;
    if (element.toleranceOverride) {
        toleranceOverrideOffset = serializeDimensionToleranceStyle(builder, element.toleranceOverride);
    }
    
    // Serialize baseline data if present
    let baselineDataOffset: flatbuffers.Offset | null = null;
    if (element.baselineData) {
        baselineDataOffset = serializeDimensionBaselineData(builder, element.baselineData);
    }
    
    // Serialize continue data if present
    let continueDataOffset: flatbuffers.Offset | null = null;
    if (element.continueData) {
        continueDataOffset = serializeDimensionContinueData(builder, element.continueData);
    }
    
    BinDucDimensionElement.startDucDimensionElement(builder);
    BinDucDimensionElement.addBase(builder, baseOffset);
    if (styleOffset) BinDucDimensionElement.addStyle(builder, styleOffset);
    if (element.dimensionType) BinDucDimensionElement.addDimensionType(builder, element.dimensionType);
    BinDucDimensionElement.addDefinitionPoints(builder, definitionPointsOffset);
    if (element.obliqueAngle !== undefined) BinDucDimensionElement.addObliqueAngle(builder, element.obliqueAngle);
    if (element.ordinateAxis) BinDucDimensionElement.addOrdinateAxis(builder, element.ordinateAxis);
    if (bindingsOffset) BinDucDimensionElement.addBindings(builder, bindingsOffset);
    if (textOverrideOffset) BinDucDimensionElement.addTextOverride(builder, textOverrideOffset);
    if (textPositionOffset) BinDucDimensionElement.addTextPosition(builder, textPositionOffset);
    if (toleranceOverrideOffset) BinDucDimensionElement.addToleranceOverride(builder, toleranceOverrideOffset);
    if (baselineDataOffset) BinDucDimensionElement.addBaselineData(builder, baselineDataOffset);
    if (continueDataOffset) BinDucDimensionElement.addContinueData(builder, continueDataOffset);
    return BinDucDimensionElement.endDucDimensionElement(builder);
}

export const serializeDucFeatureControlFrameElement = (builder: flatbuffers.Builder, element: DucFeatureControlFrameElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    
    BinDucFeatureControlFrameElement.startDucFeatureControlFrameElement(builder);
    BinDucFeatureControlFrameElement.addBase(builder, baseOffset);
    return BinDucFeatureControlFrameElement.endDucFeatureControlFrameElement(builder);
}

export const serializeDucDocElement = (builder: flatbuffers.Builder, element: DucDocElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    const textOffset = builder.createString(element.text);
    
    // Serialize text style (inherited from DucDocStyle)
    let textStyleOffset: flatbuffers.Offset | null = null;
    textStyleOffset = serializeDucTextStyle(builder, element);
    
    // Serialize paragraph formatting
    let paragraphOffset: flatbuffers.Offset | null = null;
    if (element.paragraph) {
        const firstLineIndentValue = getPrecisionValueField(element.paragraph.firstLineIndent, false);
        const hangingIndentValue = getPrecisionValueField(element.paragraph.hangingIndent, false);
        const leftIndentValue = getPrecisionValueField(element.paragraph.leftIndent, false);
        const rightIndentValue = getPrecisionValueField(element.paragraph.rightIndent, false);
        const spaceBeforeValue = getPrecisionValueField(element.paragraph.spaceBefore, false);
        const spaceAfterValue = getPrecisionValueField(element.paragraph.spaceAfter, false);
        
        let tabStopsVector: flatbuffers.Offset | null = null;
        if (element.paragraph.tabStops && element.paragraph.tabStops.length > 0) {
            const tabStopsValues = element.paragraph.tabStops.map(ts => {
                const value = getPrecisionValueField(ts, false);
                return value;
            });
            tabStopsVector = BinParagraphFormatting.createTabStopsVector(builder, tabStopsValues.filter(v => v !== null));
        }
        
        BinParagraphFormatting.startParagraphFormatting(builder);
        if (firstLineIndentValue !== null) {
            BinParagraphFormatting.addFirstLineIndent(builder, firstLineIndentValue);
        }
        if (hangingIndentValue !== null) {
            BinParagraphFormatting.addHangingIndent(builder, hangingIndentValue);
        }
        if (leftIndentValue !== null) {
            BinParagraphFormatting.addLeftIndent(builder, leftIndentValue);
        }
        if (rightIndentValue !== null) {
            BinParagraphFormatting.addRightIndent(builder, rightIndentValue);
        }
        if (spaceBeforeValue !== null) {
            BinParagraphFormatting.addSpaceBefore(builder, spaceBeforeValue);
        }
        if (spaceAfterValue !== null) {
            BinParagraphFormatting.addSpaceAfter(builder, spaceAfterValue);
        }
        if (tabStopsVector) BinParagraphFormatting.addTabStops(builder, tabStopsVector);
        paragraphOffset = BinParagraphFormatting.endParagraphFormatting(builder);
    }
    
    // Serialize stack format
    let stackFormatOffset: flatbuffers.Offset | null = null;
    if (element.stackFormat) {
        let stackCharsVector: flatbuffers.Offset | null = null;
        if (element.stackFormat.stackChars && element.stackFormat.stackChars.length > 0) {
            const stackCharsOffsets = element.stackFormat.stackChars.map(char => builder.createString(char));
            stackCharsVector = BinStackFormat.createStackCharsVector(builder, stackCharsOffsets);
        }
        
        let stackPropertiesOffset: flatbuffers.Offset | null = null;
        if (element.stackFormat.properties) {
            BinStackFormatProperties.startStackFormatProperties(builder);
            BinStackFormatProperties.addUpperScale(builder, element.stackFormat.properties.upperScale);
            BinStackFormatProperties.addLowerScale(builder, element.stackFormat.properties.lowerScale);
            if (element.stackFormat.properties.alignment) BinStackFormatProperties.addAlignment(builder, element.stackFormat.properties.alignment);
            stackPropertiesOffset = BinStackFormatProperties.endStackFormatProperties(builder);
        }
        
        BinStackFormat.startStackFormat(builder);
        BinStackFormat.addAutoStack(builder, element.stackFormat.autoStack);
        if (stackCharsVector) BinStackFormat.addStackChars(builder, stackCharsVector);
        if (stackPropertiesOffset) BinStackFormat.addProperties(builder, stackPropertiesOffset);
        stackFormatOffset = BinStackFormat.endStackFormat(builder);
    }
    
    // Create DucDocStyle
    let docStyleOffset: flatbuffers.Offset | null = null;
    BinDucDocStyle.startDucDocStyle(builder);
    if (textStyleOffset) BinDucDocStyle.addTextStyle(builder, textStyleOffset);
    if (paragraphOffset) BinDucDocStyle.addParagraph(builder, paragraphOffset);
    if (stackFormatOffset) BinDucDocStyle.addStackFormat(builder, stackFormatOffset);
    docStyleOffset = BinDucDocStyle.endDucDocStyle(builder);
    
    // Serialize dynamic parts
    let dynamicVectorOffset: flatbuffers.Offset | null = null;
    if (element.dynamic && element.dynamic.length > 0) {
        const dynamicOffsets = element.dynamic.map(part => serializeDucTextDynamicPart(builder, part));
        dynamicVectorOffset = BinDucDocElement.createDynamicVector(builder, dynamicOffsets);
    }
    
    // Serialize columns
    let columnsOffset: flatbuffers.Offset | null = null;
    if (element.columns) {
        let definitionsVector: flatbuffers.Offset | null = null;
        if (element.columns.definitions && element.columns.definitions.length > 0) {
            const definitionOffsets = element.columns.definitions.map(def => {
                const widthValue = getPrecisionValueField(def.width, false) ?? null!;
                const gutterValue = getPrecisionValueField(def.gutter, false) ?? null!;
                BinTextColumn.startTextColumn(builder);
                BinTextColumn.addWidth(builder, widthValue);
                BinTextColumn.addGutter(builder, gutterValue);
                return BinTextColumn.endTextColumn(builder);
            });
            definitionsVector = BinColumnLayout.createDefinitionsVector(builder, definitionOffsets);
        }
        
        BinColumnLayout.startColumnLayout(builder);
        if (element.columns.type !== undefined) BinColumnLayout.addType(builder, element.columns.type);
        if (definitionsVector) BinColumnLayout.addDefinitions(builder, definitionsVector);
        if (element.columns.autoHeight !== undefined) BinColumnLayout.addAutoHeight(builder, element.columns.autoHeight);
        columnsOffset = BinColumnLayout.endColumnLayout(builder);
    }
    
    BinDucDocElement.startDucDocElement(builder);
    BinDucDocElement.addBase(builder, baseOffset);
    BinDucDocElement.addText(builder, textOffset);
    if (docStyleOffset) BinDucDocElement.addStyle(builder, docStyleOffset);
    if (dynamicVectorOffset) BinDucDocElement.addDynamic(builder, dynamicVectorOffset);
    if (element.flowDirection) BinDucDocElement.addFlowDirection(builder, element.flowDirection);
    if (columnsOffset) BinDucDocElement.addColumns(builder, columnsOffset);
    if (element.autoResize !== undefined) BinDucDocElement.addAutoResize(builder, element.autoResize);
    return BinDucDocElement.endDucDocElement(builder);
}

export const serializeDucParametricElement = (builder: flatbuffers.Builder, element: DucParametricElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Serialize source
    let sourceOffset: flatbuffers.Offset | null = null;
    if (element.source) {
        let codeOffset = 0;
        let fileIdOffset = 0;
        
        if (element.source.type === PARAMETRIC_SOURCE_TYPE.CODE && 'code' in element.source) {
            codeOffset = builder.createString(element.source.code);
        } else if (element.source.type === PARAMETRIC_SOURCE_TYPE.FILE && 'fileId' in element.source) {
            fileIdOffset = builder.createString(element.source.fileId);
        }
        
        BinParametricSource.startParametricSource(builder);
        if (element.source.type !== undefined) BinParametricSource.addType(builder, element.source.type);
        if (codeOffset) BinParametricSource.addCode(builder, codeOffset);
        if (fileIdOffset) BinParametricSource.addFileId(builder, fileIdOffset);
        sourceOffset = BinParametricSource.endParametricSource(builder);
    }
    
    BinDucParametricElement.startDucParametricElement(builder);
    BinDucParametricElement.addBase(builder, baseOffset);
    if (sourceOffset) BinDucParametricElement.addSource(builder, sourceOffset);
    return BinDucParametricElement.endDucParametricElement(builder);
}

export const serializeDucEmbeddableElement = (builder: flatbuffers.Builder, element: DucEmbeddableElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    BinDucEmbeddableElement.startDucEmbeddableElement(builder);
    BinDucEmbeddableElement.addBase(builder, baseOffset);
    return BinDucEmbeddableElement.endDucEmbeddableElement(builder);
}

export const serializeDucPdfElement = (builder: flatbuffers.Builder, element: DucPdfElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    const fileIdOffset = builder.createString(element.fileId);
    BinDucPdfElement.startDucPdfElement(builder);
    BinDucPdfElement.addBase(builder, baseOffset);
    BinDucPdfElement.addFileId(builder, fileIdOffset);
    return BinDucPdfElement.endDucPdfElement(builder);
}

export const serializeDucMermaidElement = (builder: flatbuffers.Builder, element: DucMermaidElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    const sourceOffset = builder.createString(element.source);
    const themeOffset = element.theme ? builder.createString(element.theme) : 0;
    const svgPathOffset = element.svgPath ? builder.createString(element.svgPath) : 0;
    BinDucMermaidElement.startDucMermaidElement(builder);
    BinDucMermaidElement.addBase(builder, baseOffset);
    BinDucMermaidElement.addSource(builder, sourceOffset);
    if (themeOffset) BinDucMermaidElement.addTheme(builder, themeOffset);
    if (svgPathOffset) BinDucMermaidElement.addSvgPath(builder, svgPathOffset);
    return BinDucMermaidElement.endDucMermaidElement(builder);
}

const serializeDucTableStyle = (builder: flatbuffers.Builder, element: DucTableElement): flatbuffers.Offset => {
    // Serialize base style (inherited from _DucElementStylesBase)
    let baseStyleOffset: flatbuffers.Offset | null = null;
    if (Array.isArray(element.background) && element.background.length > 0) {
        baseStyleOffset = serializeElementBackground(builder, element.background[0]);
    }
    
    // Serialize header row style
    let headerRowStyleOffset: flatbuffers.Offset | null = null;
    if (element.headerRowStyle) {
        headerRowStyleOffset = serializeDucTableCellStyle(builder, element.headerRowStyle);
    }
    
    // Serialize data row style
    let dataRowStyleOffset: flatbuffers.Offset | null = null;
    if (element.dataRowStyle) {
        dataRowStyleOffset = serializeDucTableCellStyle(builder, element.dataRowStyle);
    }
    
    // Serialize data column style
    let dataColumnStyleOffset: flatbuffers.Offset | null = null;
    if (element.dataColumnStyle) {
        dataColumnStyleOffset = serializeDucTableCellStyle(builder, element.dataColumnStyle);
    }
    
    BinDucTableStyle.startDucTableStyle(builder);
    if (baseStyleOffset) BinDucTableStyle.addBaseStyle(builder, baseStyleOffset);
    if (element.flowDirection) BinDucTableStyle.addFlowDirection(builder, element.flowDirection);
    if (headerRowStyleOffset) BinDucTableStyle.addHeaderRowStyle(builder, headerRowStyleOffset);
    if (dataRowStyleOffset) BinDucTableStyle.addDataRowStyle(builder, dataRowStyleOffset);
    if (dataColumnStyleOffset) BinDucTableStyle.addDataColumnStyle(builder, dataColumnStyleOffset);
    return BinDucTableStyle.endDucTableStyle(builder);
};

// Helper function to serialize _DucElementStylesBase
const serializeElementStylesBase = (builder: flatbuffers.Builder, element: Partial<_DucElementStylesBase>): flatbuffers.Offset => {
    // Serialize background vector
    let backgroundVectorOffset: flatbuffers.Offset | null = null;
    if (element.background && element.background.length > 0) {
        const backgroundOffsets = element.background.map((bg: ElementBackground) => serializeElementBackground(builder, bg));
        backgroundVectorOffset = BinDucElementStyles.createBackgroundVector(builder, backgroundOffsets);
    }

    // Serialize stroke vector
    let strokeVectorOffset: flatbuffers.Offset | null = null;
    if (element.stroke && element.stroke.length > 0) {
        const strokeOffsets = element.stroke.map((stroke: ElementStroke) => serializeElementStroke(builder, stroke));
        strokeVectorOffset = BinDucElementStyles.createStrokeVector(builder, strokeOffsets);
    }

    // Create styles object
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
    
    return BinDucElementStyles.end_DucElementStylesBase(builder);
};

export const serializeDucTableCellStyle = (builder: flatbuffers.Builder, cellStyle: Partial<DucTableCellStyle>): flatbuffers.Offset => {
    // Serialize base style (DucTableCellStyle extends _DucElementStylesBase)
    const baseStyleOffset = serializeElementStylesBase(builder, cellStyle);

    // Serialize text style
    const textStyleOffset = cellStyle.textStyle ? 
        serializeDucTextStyle(builder, cellStyle.textStyle) : null;

    // Serialize margins if present
    let marginsOffset: flatbuffers.Offset | null = null;
    if (cellStyle.margins) {
        BinMargins.startMargins(builder);
        BinMargins.addTop(builder, getPrecisionValueField(cellStyle.margins.top, false) ?? null!);
        BinMargins.addRight(builder, getPrecisionValueField(cellStyle.margins.right, false) ?? null!);
        BinMargins.addBottom(builder, getPrecisionValueField(cellStyle.margins.bottom, false) ?? null!);
        BinMargins.addLeft(builder, getPrecisionValueField(cellStyle.margins.left, false) ?? null!);
        marginsOffset = BinMargins.endMargins(builder);
    }

    // Create table cell style
    BinDucTableCellStyle.startDucTableCellStyle(builder);
    
    if (baseStyleOffset) {
        BinDucTableCellStyle.addBaseStyle(builder, baseStyleOffset);
    }
    
    if (textStyleOffset) {
        BinDucTableCellStyle.addTextStyle(builder, textStyleOffset);
    }
    
    if (marginsOffset) {
        BinDucTableCellStyle.addMargins(builder, marginsOffset);
    }
    
    if (cellStyle.alignment !== undefined) {
        BinDucTableCellStyle.addAlignment(builder, cellStyle.alignment);
    }

    return BinDucTableCellStyle.endDucTableCellStyle(builder);
};

const serializeDucTableColumn = (builder: flatbuffers.Builder, column: DucTableColumn): flatbuffers.Offset => {
    const idOffset = builder.createString(column.id);
    
    let styleOverridesOffset: flatbuffers.Offset | null = null;
    if (column.styleOverrides) {
        styleOverridesOffset = serializeDucTableCellStyle(builder, column.styleOverrides);
    }
    
    BinDucTableColumn.startDucTableColumn(builder);
    BinDucTableColumn.addId(builder, idOffset);
    if (column.width !== undefined) {
        const widthValue = getPrecisionValueField(column.width, false);
        if (widthValue !== null) {
            BinDucTableColumn.addWidth(builder, widthValue);
        }
    }
    if (styleOverridesOffset) BinDucTableColumn.addStyleOverrides(builder, styleOverridesOffset);
    return BinDucTableColumn.endDucTableColumn(builder);
};

const serializeDucTableRow = (builder: flatbuffers.Builder, row: DucTableRow): flatbuffers.Offset => {
    const idOffset = builder.createString(row.id);
    
    let styleOverridesOffset: flatbuffers.Offset | null = null;
    if (row.styleOverrides) {
        styleOverridesOffset = serializeDucTableCellStyle(builder, row.styleOverrides);
    }
    
    BinDucTableRow.startDucTableRow(builder);
    BinDucTableRow.addId(builder, idOffset);
    if (row.height !== undefined) {
        const heightValue = getPrecisionValueField(row.height, false);
        if (heightValue !== null) {
            BinDucTableRow.addHeight(builder, heightValue);
        }
    }
    if (styleOverridesOffset) BinDucTableRow.addStyleOverrides(builder, styleOverridesOffset);
    return BinDucTableRow.endDucTableRow(builder);
};

const serializeDucTableCell = (builder: flatbuffers.Builder, cell: DucTableCell): flatbuffers.Offset => {
    const rowIdOffset = builder.createString(cell.rowId);
    const columnIdOffset = builder.createString(cell.columnId);
    const dataOffset = builder.createString(cell.data);
    
    let spanOffset: flatbuffers.Offset | null = null;
    if (cell.span) {
        BinDucTableCellSpan.startDucTableCellSpan(builder);
        BinDucTableCellSpan.addColumns(builder, cell.span.columns);
        BinDucTableCellSpan.addRows(builder, cell.span.rows);
        spanOffset = BinDucTableCellSpan.endDucTableCellSpan(builder);
    }
    
    let styleOverridesOffset: flatbuffers.Offset | null = null;
    if (cell.styleOverrides) {
        styleOverridesOffset = serializeDucTableCellStyle(builder, cell.styleOverrides);
    }
    
    BinDucTableCell.startDucTableCell(builder);
    BinDucTableCell.addRowId(builder, rowIdOffset);
    BinDucTableCell.addColumnId(builder, columnIdOffset);
    BinDucTableCell.addData(builder, dataOffset);
    if (spanOffset) BinDucTableCell.addSpan(builder, spanOffset);
    if (cell.locked !== undefined) BinDucTableCell.addLocked(builder, cell.locked);
    if (styleOverridesOffset) BinDucTableCell.addStyleOverrides(builder, styleOverridesOffset);
    return BinDucTableCell.endDucTableCell(builder);
};

export const serializeDucTableElement = (builder: flatbuffers.Builder, element: DucTableElement): flatbuffers.Offset => {
    const baseOffset = serializeDucElementBase(builder, element);
    
    // Serialize table style (inherited from DucTableStyle)
    let tableStyleOffset: flatbuffers.Offset | null = null;
    tableStyleOffset = serializeDucTableStyle(builder, element);
    
    // Serialize column order
    let columnOrderVector: flatbuffers.Offset | null = null;
    if (element.columnOrder && element.columnOrder.length > 0) {
        const columnOrderOffsets = element.columnOrder.map(id => builder.createString(id));
        columnOrderVector = BinDucTableElement.createColumnOrderVector(builder, columnOrderOffsets);
    }
    
    // Serialize row order
    let rowOrderVector: flatbuffers.Offset | null = null;
    if (element.rowOrder && element.rowOrder.length > 0) {
        const rowOrderOffsets = element.rowOrder.map(id => builder.createString(id));
        rowOrderVector = BinDucTableElement.createRowOrderVector(builder, rowOrderOffsets);
    }
    
    // Serialize columns
    let columnsVector: flatbuffers.Offset | null = null;
    if (element.columns) {
        const columnEntries = Object.entries(element.columns).map(([id, column]) => {
            const idOffset = builder.createString(id);
            const columnOffset = serializeDucTableColumn(builder, column);
            BinDucTableColumnEntry.startDucTableColumnEntry(builder);
            BinDucTableColumnEntry.addKey(builder, idOffset);
            BinDucTableColumnEntry.addValue(builder, columnOffset);
            return BinDucTableColumnEntry.endDucTableColumnEntry(builder);
        });
        columnsVector = BinDucTableElement.createColumnsVector(builder, columnEntries);
    }
    
    // Serialize rows
    let rowsVector: flatbuffers.Offset | null = null;
    if (element.rows) {
        const rowEntries = Object.entries(element.rows).map(([id, row]) => {
            const idOffset = builder.createString(id);
            const rowOffset = serializeDucTableRow(builder, row);
            BinDucTableRowEntry.startDucTableRowEntry(builder);
            BinDucTableRowEntry.addKey(builder, idOffset);
            BinDucTableRowEntry.addValue(builder, rowOffset);
            return BinDucTableRowEntry.endDucTableRowEntry(builder);
        });
        rowsVector = BinDucTableElement.createRowsVector(builder, rowEntries);
    }
    
    // Serialize cells
    let cellsVector: flatbuffers.Offset | null = null;
    if (element.cells) {
        const cellEntries = Object.entries(element.cells).map(([id, cell]) => {
            const idOffset = builder.createString(id);
            const cellOffset = serializeDucTableCell(builder, cell);
            BinDucTableCellEntry.startDucTableCellEntry(builder);
            BinDucTableCellEntry.addKey(builder, idOffset);
            BinDucTableCellEntry.addValue(builder, cellOffset);
            return BinDucTableCellEntry.endDucTableCellEntry(builder);
        });
        cellsVector = BinDucTableElement.createCellsVector(builder, cellEntries);
    }
    
    // Serialize auto size
    let autoSizeOffset: flatbuffers.Offset | null = null;
    if (element.autoSize) {
        BinDucTableAutoSize.startDucTableAutoSize(builder);
        BinDucTableAutoSize.addColumns(builder, element.autoSize.columns);
        BinDucTableAutoSize.addRows(builder, element.autoSize.rows);
        autoSizeOffset = BinDucTableAutoSize.endDucTableAutoSize(builder);
    }
    
    BinDucTableElement.startDucTableElement(builder);
    BinDucTableElement.addBase(builder, baseOffset);
    if (tableStyleOffset) BinDucTableElement.addStyle(builder, tableStyleOffset);
    if (columnOrderVector) BinDucTableElement.addColumnOrder(builder, columnOrderVector);
    if (rowOrderVector) BinDucTableElement.addRowOrder(builder, rowOrderVector);
    if (columnsVector) BinDucTableElement.addColumns(builder, columnsVector);
    if (rowsVector) BinDucTableElement.addRows(builder, rowsVector);
    if (cellsVector) BinDucTableElement.addCells(builder, cellsVector);
    if (element.headerRowCount !== undefined) BinDucTableElement.addHeaderRowCount(builder, element.headerRowCount);
    if (autoSizeOffset) BinDucTableElement.addAutoSize(builder, autoSizeOffset);
    return BinDucTableElement.endDucTableElement(builder);
}
