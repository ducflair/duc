import {
  BindingPoint as BinBindingPoint,
  BoundElement as BinBoundElement,
  DucBlockInstanceElementOverride as BinDucBlockInstanceElementOverride,
  DucElement as BinDucElement,
  DucLine as BinDucLine,
  DucLineReference as BinDucLineReference,
  DucPath as BinDucPath,
  DucTableCell as BinDucTableCell,
  DucTableColumn as BinDucTableColumn,
  DucTableRow as BinDucTableRow,
  DucTableStyle as BinDucTableStyle,
  DucTableStyleProps as BinDucTableStyleProps,
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
import { isLinearElement } from 'ducjs/types/elements/typeChecks';
import type { DucLine, DucLineReference, DucPath, DucPoint } from 'ducjs/types/elements';
import {
  DucArrowElement,
  DucDocElement,
  DucElement,
  DucFrameElement,
  DucPointBinding,
  DucTableCell,
  DucTableColumn,
  DucTableElement,
  DucTableRow,
  DucTableStyleProps,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  ImageCrop,
  StrokeSides,
  StrokeStyle,
  TilingProperties
} from 'ducjs/types/elements';
import { ensureFiniteNumber, getPrecisionValueField } from 'ducjs/src/serialize/serializationUtils';
import * as flatbuffers from 'flatbuffers';

export const serializeDucElement = (
  builder: flatbuffers.Builder, 
  element: DucElement, 
  forRenderer: boolean = false
): flatbuffers.Offset => {
  const idOffset = builder.createString(element.id);
  const labelOffset = builder.createString(element.label);
  const scopeOffset = builder.createString(element.scope);
  const frameIdOffset = element.frameId ? builder.createString(element.frameId) : undefined;
  const linkOffset = element.link ? builder.createString(element.link) : undefined;
  const typeOffset = builder.createString(element.type);
  const descriptionOffset = element.description ? builder.createString(element.description) : undefined;

  let fontFamilyOffset: flatbuffers.Offset | undefined;
  let textOffset: flatbuffers.Offset | undefined;
  let containerIdOffset: flatbuffers.Offset | undefined;
  if (element.type === 'text') {
    fontFamilyOffset = element.fontFamily ? builder.createString(String(element.fontFamily)) : undefined;
    textOffset = builder.createString(element.text);
    containerIdOffset = element.containerId ? builder.createString(element.containerId) : undefined;
  }

  let fileIdOffset: flatbuffers.Offset | undefined;
  let statusOffset: flatbuffers.Offset | undefined;
  if (element.type === 'image') {
    fileIdOffset = element.fileId ? builder.createString(element.fileId) : undefined;
    statusOffset = element.status ? builder.createString(element.status) : undefined;
  }

  let docContentOffset: flatbuffers.Offset | undefined;
  if (element.type === 'doc') {
    docContentOffset = builder.createString((element as DucDocElement).content);
  }

  let freedrawEasingOffset: flatbuffers.Offset | undefined;
  let freedrawStartEasingOffset: flatbuffers.Offset | undefined;
  let freedrawEndEasingOffset: flatbuffers.Offset | undefined;
  let freedrawSvgPathOffset: flatbuffers.Offset | undefined;
  if (element.type === 'freedraw') {
    freedrawEasingOffset = element.easing ? builder.createString(element.easing.name) : undefined;
    freedrawStartEasingOffset = element.start?.easing ? builder.createString(element.start.easing.name) : undefined;
    freedrawEndEasingOffset = element.end?.easing ? builder.createString(element.end.easing.name) : undefined;
    freedrawSvgPathOffset = element.svgPath && forRenderer ? builder.createString(element.svgPath) : undefined;
  }

  // Pre-create frame/magicframe strings
  let labelingColorOffset: flatbuffers.Offset | undefined;
  if (element.type === 'frame') {
    const frameLikeElement = element as DucFrameElement;
    if (frameLikeElement.labelingColor) {
      labelingColorOffset = builder.createString(frameLikeElement.labelingColor);
    }
  }

  // Pre-create blockinstance strings
  let blockIdOffset: flatbuffers.Offset | undefined;
  let overrideOffsets: flatbuffers.Offset[] = [];
  let overridesVector: flatbuffers.Offset | undefined;
  if (element.type === 'blockinstance') {
    const blockInstanceElement = element;
    if (blockInstanceElement.blockId) {
      blockIdOffset = builder.createString(blockInstanceElement.blockId);
    }
    if (blockInstanceElement.blockElementOverrides) {
      // Create all override objects first
      overrideOffsets = Object.entries(blockInstanceElement.blockElementOverrides).map(([elementId, overrides]) => {
        const elementIdOffset = builder.createString(elementId);
        const overridesOffset = builder.createString(overrides as string);
        
        // Create DucBlockInstanceElementOverride
        BinDucBlockInstanceElementOverride.startDucBlockInstanceElementOverride(builder);
        BinDucBlockInstanceElementOverride.addElementId(builder, elementIdOffset);
        BinDucBlockInstanceElementOverride.addOverrides(builder, overridesOffset);
        return BinDucBlockInstanceElementOverride.endDucBlockInstanceElementOverride(builder);
      });
      
      if (overrideOffsets.length > 0) {
        overridesVector = BinDucElement.createBlockInstanceElementOverridesVector(builder, overrideOffsets);
      }
    }
  }

  // Pre-create all table-related strings and objects
  let columnOrderVector: flatbuffers.Offset | undefined;
  let rowOrderVector: flatbuffers.Offset | undefined;
  let columnsVector: flatbuffers.Offset | undefined;
  let rowsVector: flatbuffers.Offset | undefined;
  let cellsVector: flatbuffers.Offset | undefined;
  let tableStyleOffset: flatbuffers.Offset | undefined;
  if (element.type === 'table') {
    const tableElement = element as DucTableElement;
    columnOrderVector = BinDucElement.createTableColumnOrderVector(builder, tableElement.columnOrder.map(id => builder.createString(id)));
    rowOrderVector = BinDucElement.createTableRowOrderVector(builder, tableElement.rowOrder.map(id => builder.createString(id)));
    columnsVector = BinDucElement.createTableColumnsVector(builder, Object.values(tableElement.columns).map(col => serializeDucTableColumn(builder, col, forRenderer)));
    rowsVector = BinDucElement.createTableRowsVector(builder, Object.values(tableElement.rows).map(row => serializeDucTableRow(builder, row, forRenderer)));
    cellsVector = BinDucElement.createTableCellsVector(builder, Object.values(tableElement.cells).map(cell => serializeDucTableCell(builder, cell, forRenderer)));
    
    if (tableElement.style) {
      const stylePropsOffset = serializeDucTableStyleProps(builder, tableElement.style, forRenderer);
      BinDucTableStyle.startDucTableStyle(builder);
      BinDucTableStyle.addDefaultProps(builder, stylePropsOffset);
      tableStyleOffset = BinDucTableStyle.endDucTableStyle(builder);
    }
  }

  // Pre-create all vector offsets and child objects
  const groupIdOffsets = element.groupIds.map(groupId => builder.createString(groupId));
  const groupIdsVector = element.groupIds.length > 0 
    ? BinDucElement.createGroupIdsVector(builder, groupIdOffsets)
    : undefined;

  const boundElementOffsets = element.boundElements?.map(boundElement => {
    const boundIdOffset = builder.createString(boundElement.id);
    const boundTypeOffset = builder.createString(boundElement.type);
    return BinBoundElement.createBoundElement(builder, boundIdOffset, boundTypeOffset);
  }) ?? [];
  const boundElementsVector = boundElementOffsets.length > 0
    ? BinDucElement.createBoundElementsVector(builder, boundElementOffsets)
    : undefined;

  const strokeOffsets = element.stroke?.map(stroke => serializeElementStroke(builder, stroke, forRenderer)) ?? [];
  const strokeVector = strokeOffsets.length > 0
    ? BinDucElement.createStrokeVector(builder, strokeOffsets)
    : undefined;

  const backgroundOffsets = element.background?.map(bg => serializeElementBackground(builder, bg)) ?? [];
  const backgroundVector = backgroundOffsets.length > 0
    ? BinDucElement.createBackgroundVector(builder, backgroundOffsets)
    : undefined;

  let pointsVector: flatbuffers.Offset | undefined;
  let lastCommittedPointOffset: flatbuffers.Offset | undefined;
  let pressuresVector: flatbuffers.Offset | undefined;
  if ((element.type === 'freedraw' || element.type === 'arrow' || element.type === 'line') && element.points) {
    const points = element.points.map(p => serializeDucPoint(builder, p, forRenderer));
    pointsVector = BinDucElement.createLinearElementPointsVector(builder, points);
    lastCommittedPointOffset = element.lastCommittedPoint ? serializeDucPoint(builder, element.lastCommittedPoint, forRenderer) : undefined;
  }
  if (element.type === 'freedraw' && element.pressures) {
    pressuresVector = BinDucElement.createFreeDrawPressuresVector(builder, Array.from(element.pressures).map(p => ensureFiniteNumber(p)));
  }

  let linesVector: flatbuffers.Offset | undefined;
  let pathOverridesVector: flatbuffers.Offset | undefined;
  if (isLinearElement(element)) {
    const lines = element.lines.map(line => serializeDucLine(builder, line, forRenderer));
    linesVector = BinDucElement.createLinearElementLinesVector(builder, lines);
    
    if (element.pathOverrides && element.pathOverrides.length > 0) {
      const pathOverrides = element.pathOverrides.map(path => serializeDucPath(builder, path, forRenderer));
      pathOverridesVector = BinDucElement.createLinearElementPathOverridesVector(builder, pathOverrides);
    }
  }

  let startBindingOffset: flatbuffers.Offset | undefined;
  let endBindingOffset: flatbuffers.Offset | undefined;
  if (element.type === 'line' || element.type === 'arrow') {
    startBindingOffset = element.startBinding ? serializeDucPointBinding(builder, element.startBinding, forRenderer) : undefined;
    endBindingOffset = element.endBinding ? serializeDucPointBinding(builder, element.endBinding, forRenderer) : undefined;
  }

  let imageScaleOffset: flatbuffers.Offset | undefined;
  let imageCropOffset: flatbuffers.Offset | undefined;
  if (element.type === 'image') {
    imageScaleOffset = BinSimplePoint.createSimplePoint(builder, ensureFiniteNumber(element.scale?.[0], 1), ensureFiniteNumber(element.scale?.[1], 1));
    imageCropOffset = element.crop ? serializeImageCrop(builder, element.crop) : undefined;
  }

  // Pre-create frame/magicframe override objects
  let strokeOverrideOffset: flatbuffers.Offset | undefined;
  let backgroundOverrideOffset: flatbuffers.Offset | undefined;
  if (element.type === 'frame') {
    const frameLikeElement = element as DucFrameElement;
    if (frameLikeElement.strokeOverride) {
      strokeOverrideOffset = serializeElementStroke(builder, frameLikeElement.strokeOverride, forRenderer);
    }
    if (frameLikeElement.backgroundOverride) {
      backgroundOverrideOffset = serializeElementBackground(builder, frameLikeElement.backgroundOverride);
    }
  }

  BinDucElement.startDucElement(builder);
  BinDucElement.addId(builder, idOffset);
  BinDucElement.addType(builder, typeOffset);
  element.x && BinDucElement.addX(builder, getPrecisionValueField(element.x, forRenderer));
  element.y && BinDucElement.addY(builder, getPrecisionValueField(element.y, forRenderer));
  BinDucElement.addScope(builder, scopeOffset);
  labelOffset && BinDucElement.addLabel(builder, labelOffset);
  BinDucElement.addIsVisible(builder, element.isVisible !== undefined ? element.isVisible : true );
  BinDucElement.addOpacity(builder, element.opacity); 
  element.width && BinDucElement.addWidth(builder, getPrecisionValueField(element.width, forRenderer));
  element.height && BinDucElement.addHeight(builder, getPrecisionValueField(element.height, forRenderer));
  BinDucElement.addAngle(builder, element.angle); 
  BinDucElement.addIsDeleted(builder, element.isDeleted || false);
  frameIdOffset && BinDucElement.addFrameId(builder, frameIdOffset);
  linkOffset && BinDucElement.addLink(builder, linkOffset);
  BinDucElement.addLocked(builder, element.locked || false);
  groupIdsVector && BinDucElement.addGroupIds(builder, groupIdsVector);
  boundElementsVector && BinDucElement.addBoundElements(builder, boundElementsVector);
  strokeVector && BinDucElement.addStroke(builder, strokeVector);
  backgroundVector && BinDucElement.addBackground(builder, backgroundVector);
  element.blending !== undefined && BinDucElement.addBlending(builder, element.blending);
  element.zIndex !== undefined && BinDucElement.addZIndex(builder, element.zIndex);
  element.roundness && BinDucElement.addRoundness(builder, getPrecisionValueField(element.roundness, forRenderer));
  element.subset !== undefined && element.subset !== null && BinDucElement.addSubset(builder, element.subset);
  descriptionOffset && BinDucElement.addDescription(builder, descriptionOffset);
  element.noPlot !== undefined && BinDucElement.addNoPlot(builder, element.noPlot);

  if (element.type === 'polygon') {
    element.sides && BinDucElement.addPolygonSides(builder, element.sides);
  }

  if (element.type === 'text') {
    element.fontSize && BinDucElement.addTextFontSize(builder, getPrecisionValueField(element.fontSize, forRenderer));
    fontFamilyOffset && BinDucElement.addTextFontFamily(builder, fontFamilyOffset);
    textOffset && BinDucElement.addTextText(builder, textOffset);
    element.textAlign && BinDucElement.addTextTextAlign(builder, element.textAlign);
    element.verticalAlign && BinDucElement.addTextVerticalAlign(builder, element.verticalAlign);
    containerIdOffset && BinDucElement.addTextContainerId(builder, containerIdOffset);
    element.lineHeight !== undefined && BinDucElement.addTextLineHeight(builder, element.lineHeight); 
    element.autoResize !== undefined && BinDucElement.addTextAutoResize(builder, element.autoResize);
  }

  if (element.type === 'line' || element.type === 'arrow') {
    pointsVector && BinDucElement.addLinearElementPoints(builder, pointsVector);
    linesVector && BinDucElement.addLinearElementLines(builder, linesVector);
    pathOverridesVector && BinDucElement.addLinearElementPathOverrides(builder, pathOverridesVector);
    lastCommittedPointOffset && BinDucElement.addLinearElementLastCommittedPoint(builder, lastCommittedPointOffset);
    startBindingOffset && BinDucElement.addLinearElementStartBinding(builder, startBindingOffset);
    endBindingOffset && BinDucElement.addLinearElementEndBinding(builder, endBindingOffset);
    if (element.type === 'arrow' && (element as DucArrowElement).elbowed !== undefined) {
      BinDucElement.addArrowElbowed(builder, (element as DucArrowElement).elbowed);
    }
  }

  if (element.type === 'freedraw') {
    pressuresVector && BinDucElement.addFreeDrawPressures(builder, pressuresVector);
    element.simulatePressure !== undefined && BinDucElement.addFreeDrawSimulatePressure(builder, element.simulatePressure);
    lastCommittedPointOffset && BinDucElement.addLinearElementLastCommittedPoint(builder, lastCommittedPointOffset);
    pointsVector && BinDucElement.addLinearElementPoints(builder, pointsVector);
    element.size !== undefined && BinDucElement.addFreeDrawSize(builder, getPrecisionValueField(element.size, forRenderer));
    element.thinning !== undefined && BinDucElement.addFreeDrawThinning(builder, element.thinning);
    element.smoothing !== undefined && BinDucElement.addFreeDrawSmoothing(builder, element.smoothing);
    element.streamline !== undefined && BinDucElement.addFreeDrawStreamline(builder, element.streamline);
    freedrawEasingOffset && BinDucElement.addFreeDrawEasing(builder, freedrawEasingOffset);
    element.start?.cap !== undefined && BinDucElement.addFreeDrawStartCap(builder, element.start.cap);
    element.start?.taper !== undefined && BinDucElement.addFreeDrawStartTaper(builder, element.start.taper);
    freedrawStartEasingOffset && BinDucElement.addFreeDrawStartEasing(builder, freedrawStartEasingOffset);
    element.end?.cap !== undefined && BinDucElement.addFreeDrawEndCap(builder, element.end.cap);
    element.end?.taper !== undefined && BinDucElement.addFreeDrawEndTaper(builder, element.end.taper);
    freedrawEndEasingOffset && BinDucElement.addFreeDrawEndEasing(builder, freedrawEndEasingOffset);
    freedrawSvgPathOffset && BinDucElement.addFreeDrawSvgPath(builder, freedrawSvgPathOffset);
  }

  if (element.type === 'image') {
    fileIdOffset && BinDucElement.addFileId(builder, fileIdOffset);
    statusOffset && BinDucElement.addImageStatus(builder, statusOffset);
    imageScaleOffset && BinDucElement.addImageScale(builder, imageScaleOffset);
    imageCropOffset && BinDucElement.addImageCrop(builder, imageCropOffset);
  }

  if (element.type === 'frame') { 
    const frameLikeElement = element as DucFrameElement;
    frameLikeElement.isCollapsed !== undefined && BinDucElement.addStackLikeIsCollapsed(builder, frameLikeElement.isCollapsed);
    frameLikeElement.clip !== undefined && BinDucElement.addStackLikeClip(builder, frameLikeElement.clip);
    
    // Add pre-created stack-like fields
    labelingColorOffset && BinDucElement.addStackLikeLabelingColor(builder, labelingColorOffset);
    strokeOverrideOffset && BinDucElement.addStackLikeStrokeOverride(builder, strokeOverrideOffset);
    backgroundOverrideOffset && BinDucElement.addStackLikeBackgroundOverride(builder, backgroundOverrideOffset);
  }

  if (element.type === 'table') {
    columnOrderVector && BinDucElement.addTableColumnOrder(builder, columnOrderVector);
    rowOrderVector && BinDucElement.addTableRowOrder(builder, rowOrderVector);
    columnsVector && BinDucElement.addTableColumns(builder, columnsVector);
    rowsVector && BinDucElement.addTableRows(builder, rowsVector);
    cellsVector && BinDucElement.addTableCells(builder, cellsVector);
    tableStyleOffset && BinDucElement.addTableStyle(builder, tableStyleOffset);
  }

  if (element.type === 'doc') {
    docContentOffset && BinDucElement.addDocContent(builder, docContentOffset);
  }

  if (element.type === 'ellipse') {
    element.ratio !== undefined && BinDucElement.addEllipseRatio(builder, element.ratio);
    element.startAngle !== undefined && BinDucElement.addEllipseStartAngle(builder, element.startAngle);
    element.endAngle !== undefined && BinDucElement.addEllipseEndAngle(builder, element.endAngle);
    element.showAuxCrosshair !== undefined && BinDucElement.addEllipseShowAuxCrosshair(builder, element.showAuxCrosshair);
  }

  if (element.type === 'blockinstance') {
    blockIdOffset && BinDucElement.addBlockInstanceBlockId(builder, blockIdOffset);
    overridesVector && BinDucElement.addBlockInstanceElementOverrides(builder, overridesVector);
  }
  
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

const serializeDucTableStyleProps = (
  builder: flatbuffers.Builder, 
  styleProps: DucTableStyleProps, 
  forRenderer: boolean
): flatbuffers.Offset => {
  const backgroundColorOffset = styleProps.background ? builder.createString(styleProps.background) : undefined;
  const borderColorOffset = styleProps.border?.color ? builder.createString(styleProps.border.color) : undefined;
  const textColorOffset = styleProps.text?.color ? builder.createString(styleProps.text.color) : undefined;
  const textFontOffset = styleProps.text?.font ? builder.createString(styleProps.text.font) : undefined;
  const borderDashesVector = styleProps.border?.dashes && styleProps.border.dashes.length > 0
    ? BinDucTableStyleProps.createBorderDashesVector(builder, styleProps.border.dashes.map(d => ensureFiniteNumber(d)))
    : undefined;

  BinDucTableStyleProps.startDucTableStyleProps(builder);
  backgroundColorOffset && BinDucTableStyleProps.addBackgroundColor(builder, backgroundColorOffset);
  styleProps.border?.width && BinDucTableStyleProps.addBorderWidth(builder, getPrecisionValueField(styleProps.border.width, forRenderer));
  borderDashesVector && BinDucTableStyleProps.addBorderDashes(builder, borderDashesVector);
  borderColorOffset && BinDucTableStyleProps.addBorderColor(builder, borderColorOffset);
  textColorOffset && BinDucTableStyleProps.addTextColor(builder, textColorOffset);
  styleProps.text?.size && BinDucTableStyleProps.addTextSize(builder, getPrecisionValueField(styleProps.text.size, forRenderer));
  textFontOffset && BinDucTableStyleProps.addTextFont(builder, textFontOffset);
  styleProps.text?.align && BinDucTableStyleProps.addTextAlign(builder, styleProps.text.align);
  return BinDucTableStyleProps.endDucTableStyleProps(builder);
};

const serializeDucTableColumn = (
  builder: flatbuffers.Builder, 
  column: DucTableColumn, 
  forRenderer: boolean
): flatbuffers.Offset => {
  const idOffset = builder.createString(column.id);
  const styleOffset = column.style ? serializeDucTableStyleProps(builder, column.style, forRenderer) : undefined;

  BinDucTableColumn.startDucTableColumn(builder);
  BinDucTableColumn.addId(builder, idOffset);
  column.width && BinDucTableColumn.addWidth(builder, getPrecisionValueField(column.width, forRenderer));
  styleOffset && BinDucTableColumn.addStyle(builder, styleOffset);
  return BinDucTableColumn.endDucTableColumn(builder);
};

const serializeDucTableRow = (
  builder: flatbuffers.Builder, 
  row: DucTableRow, 
  forRenderer: boolean
): flatbuffers.Offset => {
  const idOffset = builder.createString(row.id);
  const styleOffset = row.style ? serializeDucTableStyleProps(builder, row.style, forRenderer) : undefined;

  BinDucTableRow.startDucTableRow(builder);
  BinDucTableRow.addId(builder, idOffset);
  row.height && BinDucTableRow.addHeight(builder, getPrecisionValueField(row.height, forRenderer));
  styleOffset && BinDucTableRow.addStyle(builder, styleOffset);
  return BinDucTableRow.endDucTableRow(builder);
};

const serializeDucTableCell = (
  builder: flatbuffers.Builder, 
  cell: DucTableCell, 
  forRenderer: boolean
): flatbuffers.Offset => {
  const rowIdOffset = builder.createString(cell.rowId);
  const columnIdOffset = builder.createString(cell.columnId);
  const dataOffset = builder.createString(cell.data);
  const styleOffset = cell.style ? serializeDucTableStyleProps(builder, cell.style, forRenderer) : undefined;

  BinDucTableCell.startDucTableCell(builder);
  BinDucTableCell.addRowId(builder, rowIdOffset);
  BinDucTableCell.addColumnId(builder, columnIdOffset);
  BinDucTableCell.addData(builder, dataOffset);
  styleOffset && BinDucTableCell.addStyle(builder, styleOffset);
  return BinDucTableCell.endDucTableCell(builder);
};