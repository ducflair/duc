import * as flatbuffers from 'flatbuffers';
import { DucElement as BinDucElement, Point as BinPoint, SimplePoint as BinSimplePoint, PointBinding as BinPointBinding } from '../../duc';
import { DucElement, PointBinding } from '../../../../element/types';
import { Point } from '../../../../types';

export const serializeDucElement = (builder: flatbuffers.Builder, element: DucElement): flatbuffers.Offset => {
  const idOffset = builder.createString(element.id);
  const labelOffset = builder.createString(element.label);
  const scopeOffset = builder.createString(element.scope);
  const backgroundColorOffset = builder.createString(element.backgroundColor);
  const strokeColorOffset = builder.createString(element.strokeColor);
  const frameIdOffset = builder.createString(element.frameId);
  const linkOffset = builder.createString(element.link);
  const typeOffset = builder.createString(element.type);

  // Create group IDs vector only if there are group IDs
  const groupIdOffsets = element.groupIds.map(groupId => builder.createString(groupId));
  const groupIdsVector = element.groupIds.length > 0 
    ? BinDucElement.createGroupIdsVector(builder, groupIdOffsets)
    : undefined;

  // TextElement specific fields
  let fontFamilyOffset: flatbuffers.Offset | undefined;
  let textOffset: flatbuffers.Offset | undefined;
  let containerIdOffset: flatbuffers.Offset | undefined;

  if (element.type === 'text') {
    fontFamilyOffset = builder.createString(String(element.fontFamily));
    textOffset = builder.createString(element.text);
    containerIdOffset = builder.createString(element.containerId);
  }

  // LinearElement specific fields
  const getLinearElementOffsets = (element: DucElement) => {
    if (element.type !== 'line' && element.type !== 'arrow') {
      return {};
    }

    return {
      startBinding: element.startBinding?.fixedPoint 
        ? serializeDucPointBinding(builder, element.startBinding)
        : undefined,
      endBinding: element.endBinding?.fixedPoint
        ? serializeDucPointBinding(builder, element.endBinding)
        : undefined,
      startArrowhead: builder.createString(element.startArrowhead),
      endArrowhead: builder.createString(element.endArrowhead),
    };
  };

  const getPointsOffsets = (element: DucElement) => {
    if (element.type === 'freedraw' || element.type === 'arrow' || element.type === 'line') {
    return {
      points: BinDucElement.createPointsVector(
        builder, 
        element.points.map(p => serializeDucPoint(builder, p))
      ),
      lastCommittedPoint: element.lastCommittedPoint
        ? serializeDucPoint(builder, element.lastCommittedPoint)
        : undefined,
      };
    }
    return {};
  };

  // FreeDrawElement specific fields
  const getPressuresOffset = (element: DucElement) => 
    element.type === 'freedraw'
      ? BinDucElement.createPressuresV3Vector(builder, Array.from(element.pressures))
      : undefined;

  // ImageElement specific fields
  const getImageOffsets = (element: DucElement) => {
    if (element.type !== 'image') {
      return {};
    }

    return {
      fileId: builder.createString(element.fileId),
      status: builder.createString(element.status),
      scale: BinSimplePoint.createSimplePoint(builder, element.scale[0], element.scale[1]),
    };
  };

  // Frame and MagicFrame specific fields
  const getFrameOffset = (element: DucElement) =>
    element.type === 'frame' || element.type === 'magicframe'
      ? builder.createString(element.name)
      : undefined;

  // GroupElement specific fields
  const getGroupOffset = (element: DucElement) =>
    element.type === 'group'
      ? builder.createString(element.groupIdRef)
      : undefined;

  const linearOffsets = getLinearElementOffsets(element);
  const pointOffsets = getPointsOffsets(element);
  const imageOffsets = getImageOffsets(element);
  const pressuresOffset = getPressuresOffset(element);
  const nameOffset = getFrameOffset(element);
  const groupIdRefOffset = getGroupOffset(element);

  BinDucElement.startDucElement(builder);
  BinDucElement.addId(builder, idOffset);
  BinDucElement.addType(builder, typeOffset);
  BinDucElement.addXV3(builder, element.x);
  BinDucElement.addYV3(builder, element.y);
  BinDucElement.addScope(builder, scopeOffset);
  BinDucElement.addLabel(builder, labelOffset);
  BinDucElement.addIsVisible(builder, element.isVisible);
  BinDucElement.addBackgroundColor(builder, backgroundColorOffset);
  BinDucElement.addStrokeColor(builder, strokeColorOffset);
  BinDucElement.addStrokeWidthV3(builder, element.strokeWidth);
  BinDucElement.addStrokeStyleV3(builder, element.strokeStyle);
  BinDucElement.addFillStyleV3(builder, element.fillStyle);
  BinDucElement.addStrokePlacement(builder, element.strokePlacement);
  BinDucElement.addOpacity(builder, element.opacity);
  BinDucElement.addWidthV3(builder, element.width);
  BinDucElement.addHeightV3(builder, element.height);
  BinDucElement.addAngleV3(builder, element.angle);
  BinDucElement.addIsDeleted(builder, element.isDeleted);
  BinDucElement.addFrameId(builder, frameIdOffset);
  BinDucElement.addLink(builder, linkOffset);
  BinDucElement.addLocked(builder, element.locked);
  groupIdsVector && BinDucElement.addGroupIds(builder, groupIdsVector);
  BinDucElement.addIsStrokeDisabled(builder, element.isStrokeDisabled);
  BinDucElement.addIsBackgroundDisabled(builder, element.isBackgroundDisabled);

  // TextElement specific fields
  if (element.type === 'text') {
    BinDucElement.addFontSizeV3(builder, element.fontSize);
    fontFamilyOffset && BinDucElement.addFontFamily(builder, fontFamilyOffset);
    textOffset && BinDucElement.addText(builder, textOffset);
    BinDucElement.addTextAlignV3(builder, element.textAlign);
    BinDucElement.addVerticalAlignV3(builder, element.verticalAlign);
    containerIdOffset && BinDucElement.addContainerId(builder, containerIdOffset);
    BinDucElement.addLineHeightV3(builder, element.lineHeight);
  }

  // LinearElement specific fields
  if (element.type === 'line' || element.type === 'arrow') {
    pointOffsets.points && BinDucElement.addPoints(builder, pointOffsets.points);
    pointOffsets.lastCommittedPoint && BinDucElement.addLastCommittedPoint(builder, pointOffsets.lastCommittedPoint);
    linearOffsets.startBinding && BinDucElement.addStartBinding(builder, linearOffsets.startBinding);
    linearOffsets.endBinding && BinDucElement.addEndBinding(builder, linearOffsets.endBinding);
    linearOffsets.startArrowhead && BinDucElement.addStartArrowhead(builder, linearOffsets.startArrowhead);
    linearOffsets.endArrowhead && BinDucElement.addEndArrowhead(builder, linearOffsets.endArrowhead);
  }

  // FreeDrawElement specific fields
  if (element.type === 'freedraw') {
    pressuresOffset && BinDucElement.addPressuresV3(builder, pressuresOffset);
    BinDucElement.addSimulatePressure(builder, element.simulatePressure);
    pointOffsets.lastCommittedPoint && BinDucElement.addLastCommittedPoint(builder, pointOffsets.lastCommittedPoint);
    pointOffsets.points && BinDucElement.addPoints(builder, pointOffsets.points);
  }

  // ImageElement specific fields
  if (element.type === 'image') {
    imageOffsets.fileId && BinDucElement.addFileId(builder, imageOffsets.fileId);
    imageOffsets.status && BinDucElement.addStatus(builder, imageOffsets.status);
    imageOffsets.scale && BinDucElement.addScaleV3(builder, imageOffsets.scale);
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


export const serializeDucPoint = (builder: flatbuffers.Builder, point: Point): flatbuffers.Offset => {
  const handleInOffset = point.handleIn && BinSimplePoint.createSimplePoint(builder, point.handleIn.x, point.handleIn.y)
  const handleOutOffset = point.handleOut && BinSimplePoint.createSimplePoint(builder, point.handleOut.x, point.handleOut.y)
  BinPoint.startPoint(builder);
  BinPoint.addXV3(builder, point.x);
  BinPoint.addYV3(builder, point.y);
  point.isCurve && BinPoint.addIsCurve(builder, point.isCurve);
  point.mirroring !== undefined && BinPoint.addMirroring(builder, point.mirroring);
  point.borderRadius && BinPoint.addBorderRadius(builder, point.borderRadius);
  handleInOffset && BinPoint.addHandleIn(builder, handleInOffset);
  handleOutOffset && BinPoint.addHandleOut(builder, handleOutOffset);
  return BinPoint.endPoint(builder);
}

export const serializeDucPointBinding = (builder: flatbuffers.Builder, pointBinding: PointBinding): flatbuffers.Offset => {
  const elementIdOffset = builder.createString(pointBinding.elementId);
  const fixedPointOffset = pointBinding.fixedPoint ? serializeDucPoint(builder, pointBinding.fixedPoint) : undefined;
  BinPointBinding.startPointBinding(builder);
  BinPointBinding.addElementId(builder, elementIdOffset);
  BinPointBinding.addFocus(builder, pointBinding.focus);
  BinPointBinding.addGap(builder, pointBinding.gap);
  fixedPointOffset && BinPointBinding.addFixedPoint(builder, fixedPointOffset);
  return BinPointBinding.endPointBinding(builder);
}