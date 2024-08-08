import * as flatbuffers from 'flatbuffers';
import { DucElement as BinDucElement } from '../duc';
import { DucElement } from '../../element/types';

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
  const strokePlacementOffset = builder.createString(element.strokePlacement);

  // Create group IDs vector
  const groupIdOffsets = element.groupIds.map(groupId => builder.createString(groupId));
  const groupIdsVector = BinDucElement.createGroupIdsVector(builder, groupIdOffsets);


  BinDucElement.startDucElement(builder);
  BinDucElement.addId(builder, idOffset);
  BinDucElement.addX(builder, element.x);
  BinDucElement.addY(builder, element.y);
  BinDucElement.addScope(builder, scopeOffset);
  BinDucElement.addWritingLayer(builder, writingLayerOffset);
  BinDucElement.addLabel(builder, labelOffset);
  BinDucElement.addRatioLocked(builder, element.ratioLocked);
  BinDucElement.addIsVisible(builder, element.isVisible);
  BinDucElement.addFillStyle(builder, fillStyleOffset);
  BinDucElement.addRoughness(builder, element.roughness);
  BinDucElement.addRoundnessType(builder, roundnessTypeOffset);
  if (element.roundness?.value) {
    BinDucElement.addRoundnessValue(builder, element.roundness.value);
  }
  BinDucElement.addBackgroundColor(builder, backgroundColorOffset);
  BinDucElement.addStrokeColor(builder, strokeColorOffset);
  BinDucElement.addStrokeWidth(builder, element.strokeWidth);
  BinDucElement.addStrokeStyle(builder, strokeStyleOffset);
  BinDucElement.addStrokePlacement(builder, strokePlacementOffset);
  BinDucElement.addOpacity(builder, element.opacity);
  BinDucElement.addWidth(builder, element.width);
  BinDucElement.addHeight(builder, element.height);
  BinDucElement.addAngle(builder, element.angle);
  BinDucElement.addSeed(builder, element.seed);
  BinDucElement.addVersion(builder, element.version);
  BinDucElement.addVersionNonce(builder, element.versionNonce);
  BinDucElement.addIsDeleted(builder, element.isDeleted);
  BinDucElement.addFrameId(builder, frameIdOffset);
  BinDucElement.addUpdated(builder, BigInt(element.updated));
  BinDucElement.addLink(builder, linkOffset);
  BinDucElement.addLocked(builder, element.locked);
  BinDucElement.addCustomData(builder, customDataOffset);
  BinDucElement.addGroupIds(builder, groupIdsVector);

  return BinDucElement.endDucElement(builder);
};
