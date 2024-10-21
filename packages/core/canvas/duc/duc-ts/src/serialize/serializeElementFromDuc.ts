import * as flatbuffers from 'flatbuffers';
import { DucElement as BinDucElement, Point, PointBinding } from '../../duc';
import { DucElement } from '../../../../element/types';

export const serializeDucElement = (builder: flatbuffers.Builder, element: DucElement): flatbuffers.Offset => {
  const idOffset = builder.createString(element.id);
  const labelOffset = builder.createString(element.label);
  const scopeOffset = builder.createString(element.scope);
  const writingLayerOffset = builder.createString(element.writingLayer);
  const backgroundColorOffset = builder.createString(element.backgroundColor);
  const strokeColorOffset = builder.createString(element.strokeColor);
  const frameIdOffset = builder.createString(element.frameId);
  const linkOffset = builder.createString(element.link);
  const customDataOffset = builder.createString(JSON.stringify(element.customData));
  const fillStyleOffset = builder.createString(element.fillStyle);
  const roundnessTypeOffset = builder.createString(String(element.roundness?.type));
  const strokeStyleOffset = builder.createString(element.strokeStyle);
  const typeOffset = builder.createString(element.type);

  // Create group IDs vector
  const groupIdOffsets = element.groupIds.map(groupId => builder.createString(groupId));
  const groupIdsVector = BinDucElement.createGroupIdsVector(builder, groupIdOffsets);

  // TextElement specific fields
  let fontFamilyOffset: flatbuffers.Offset | undefined;
  let textOffset: flatbuffers.Offset | undefined;
  let textAlignOffset: flatbuffers.Offset | undefined;
  let verticalAlignOffset: flatbuffers.Offset | undefined;
  let containerIdOffset: flatbuffers.Offset | undefined;
  let originalTextOffset: flatbuffers.Offset | undefined;

  if (element.type === 'text') {
    fontFamilyOffset = builder.createString(String(element.fontFamily));
    textOffset = builder.createString(element.text);
    textAlignOffset = builder.createString(element.textAlign);
    verticalAlignOffset = builder.createString(element.verticalAlign);
    containerIdOffset = builder.createString(element.containerId);
    originalTextOffset = builder.createString(element.originalText);
  }

  // LinearElement specific fields
  let pointsOffset: flatbuffers.Offset | undefined;
  let lastCommittedPointOffset: flatbuffers.Offset | undefined;
  let startBindingOffset: flatbuffers.Offset | undefined;
  let endBindingOffset: flatbuffers.Offset | undefined;
  let startArrowheadOffset: flatbuffers.Offset | undefined;
  let endArrowheadOffset: flatbuffers.Offset | undefined;
  
  if (element.type === 'line' || element.type === 'arrow') {    
    if (element.startBinding && element.startBinding.fixedPoint) {
      const startBindingElementId = builder.createString(element.startBinding.elementId);
      const fixedPointBindingOffset = Point.createPoint(builder, element.startBinding.fixedPoint?.[0], element.startBinding.fixedPoint?.[1]);
      PointBinding.startPointBinding(builder);
      PointBinding.addElementId(builder, startBindingElementId);
      PointBinding.addFocus(builder, element.startBinding.focus);
      PointBinding.addGap(builder, element.startBinding.gap);
      PointBinding.addFixedPoint(builder, fixedPointBindingOffset);
      startBindingOffset = PointBinding.endPointBinding(builder);
    }

    if (element.endBinding && element.endBinding.fixedPoint) {
      const endBindingElementId = builder.createString(element.endBinding.elementId);
      const fixedPointBindingOffset = Point.createPoint(builder, element.endBinding.fixedPoint?.[0], element.endBinding.fixedPoint?.[1]);
      PointBinding.startPointBinding(builder);
      PointBinding.addElementId(builder, endBindingElementId);
      PointBinding.addFocus(builder, element.endBinding.focus);
      PointBinding.addGap(builder, element.endBinding.gap);
      PointBinding.addFixedPoint(builder, fixedPointBindingOffset);
      endBindingOffset = PointBinding.endPointBinding(builder);
    }

    startArrowheadOffset = builder.createString(element.startArrowhead);
    endArrowheadOffset = builder.createString(element.endArrowhead);
  }

  if (element.type === 'freedraw' || element.type === 'arrow' || element.type === 'line') {
    const points = element.points.map(p => Point.createPoint(builder, p[0], p[1]));
    pointsOffset = BinDucElement.createPointsVector(builder, points);
    
    if (element.lastCommittedPoint) {
      lastCommittedPointOffset = Point.createPoint(builder, element.lastCommittedPoint[0], element.lastCommittedPoint[1]);
    }
  }

  // FreeDrawElement specific fields
  let pressuresOffset: flatbuffers.Offset | undefined;
  if (element.type === 'freedraw') {
    // Convert readonly number[] to a mutable number[]
    const pressuresArray = Array.from(element.pressures);
    pressuresOffset = BinDucElement.createPressuresVector(builder, pressuresArray);
  }


  // ImageElement specific fields
  let fileIdOffset: flatbuffers.Offset | undefined;
  let statusOffset: flatbuffers.Offset | undefined;
  let scaleOffset: flatbuffers.Offset | undefined;

  if (element.type === 'image') {
    fileIdOffset = builder.createString(element.fileId);
    statusOffset = builder.createString(element.status);
    scaleOffset = Point.createPoint(builder, element.scale[0], element.scale[1]);
  }

  // FrameElement specific fields
  let nameOffset: flatbuffers.Offset | undefined;
  if (element.type === 'frame' || element.type === 'magicframe') {
    nameOffset = builder.createString(element.name);
  }

  // GroupElement specific fields
  let groupIdRefOffset: flatbuffers.Offset | undefined;
  if (element.type === 'group') {
    groupIdRefOffset = builder.createString(element.groupIdRef);
  }

  BinDucElement.startDucElement(builder);
  BinDucElement.addId(builder, idOffset);
  BinDucElement.addType(builder, typeOffset);
  BinDucElement.addX(builder, element.x);
  BinDucElement.addY(builder, element.y);
  BinDucElement.addScope(builder, scopeOffset);
  BinDucElement.addWritingLayer(builder, writingLayerOffset);
  BinDucElement.addLabel(builder, labelOffset);
  BinDucElement.addIsVisible(builder, element.isVisible);
  BinDucElement.addRoundnessType(builder, roundnessTypeOffset);
  if (element.roundness?.value) {
    BinDucElement.addRoundnessValue(builder, element.roundness.value);
  }
  BinDucElement.addBackgroundColor(builder, backgroundColorOffset);
  BinDucElement.addStrokeColor(builder, strokeColorOffset);
  BinDucElement.addStrokeWidth(builder, element.strokeWidth);
  BinDucElement.addStrokeStyle(builder, strokeStyleOffset);
  BinDucElement.addFillStyle(builder, fillStyleOffset);
  BinDucElement.addStrokePlacement(builder, element.strokePlacement);
  BinDucElement.addOpacity(builder, element.opacity);
  BinDucElement.addWidth(builder, element.width);
  BinDucElement.addHeight(builder, element.height);
  BinDucElement.addAngle(builder, element.angle);
  BinDucElement.addIsDeleted(builder, element.isDeleted);
  BinDucElement.addFrameId(builder, frameIdOffset);
  BinDucElement.addLink(builder, linkOffset);
  BinDucElement.addLocked(builder, element.locked);
  BinDucElement.addCustomData(builder, customDataOffset);
  BinDucElement.addGroupIds(builder, groupIdsVector);
  BinDucElement.addIsStrokeDisabled(builder, element.isStrokeDisabled);
  BinDucElement.addIsBackgroundDisabled(builder, element.isBackgroundDisabled);

  // TextElement specific fields
  if (element.type === 'text') {
    BinDucElement.addFontSize(builder, element.fontSize);
    fontFamilyOffset && BinDucElement.addFontFamily(builder, fontFamilyOffset);
    textOffset && BinDucElement.addText(builder, textOffset);
    textAlignOffset && BinDucElement.addTextAlign(builder, textAlignOffset);
    verticalAlignOffset && BinDucElement.addVerticalAlign(builder, verticalAlignOffset);
    containerIdOffset && BinDucElement.addContainerId(builder, containerIdOffset);
    originalTextOffset && BinDucElement.addOriginalText(builder, originalTextOffset);
    BinDucElement.addLineHeight(builder, element.lineHeight);
  }

  // LinearElement specific fields
  if (element.type === 'line' || element.type === 'arrow') {
    pointsOffset && BinDucElement.addPoints(builder, pointsOffset);
    lastCommittedPointOffset && BinDucElement.addLastCommittedPoint(builder, lastCommittedPointOffset);
    startBindingOffset && BinDucElement.addStartBinding(builder, startBindingOffset);
    endBindingOffset && BinDucElement.addEndBinding(builder, endBindingOffset);
    startArrowheadOffset && BinDucElement.addStartArrowhead(builder, startArrowheadOffset);
    endArrowheadOffset && BinDucElement.addEndArrowhead(builder, endArrowheadOffset);
  }

  // FreeDrawElement specific fields
  if (element.type === 'freedraw') {
    pressuresOffset && BinDucElement.addPressures(builder, pressuresOffset);
    BinDucElement.addSimulatePressure(builder, element.simulatePressure);
    lastCommittedPointOffset && BinDucElement.addLastCommittedPoint(builder, lastCommittedPointOffset);
    pointsOffset && BinDucElement.addPoints(builder, pointsOffset);
  }

  // ImageElement specific fields
  if (element.type === 'image') {
    fileIdOffset && BinDucElement.addFileId(builder, fileIdOffset);
    statusOffset && BinDucElement.addStatus(builder, statusOffset);
    scaleOffset && BinDucElement.addScale(builder, scaleOffset);
  }


  // FrameElement specific fields
  if (element.type === 'frame') {
    BinDucElement.addIsCollapsed(builder, element.isCollapsed);
    nameOffset && BinDucElement.addName(builder, nameOffset);
  }

  // GroupElement specific fields
  if (element.type === 'group') {
    BinDucElement.addIsCollapsed(builder, element.isCollapsed);
    groupIdRefOffset && BinDucElement.addGroupIdRef(builder, groupIdRefOffset);
  }

  // MagicFrameElement specific fields
  if (element.type === 'magicframe') {
    BinDucElement.addIsCollapsed(builder, element.isCollapsed);
    nameOffset && BinDucElement.addName(builder, nameOffset);
  }

  // IframeElement specific fields
  if (element.type === 'iframe') {
  }

  return BinDucElement.endDucElement(builder);
};
