import { DucElement as BinDucElement, DucElementUnion } from '../duc';
import {
  DucElement,
  DucElementTypes,
  FillStyle,
  StrokeStyle,
  StrokePlacement,
  RoundnessType
} from '../../../element/types';
import { SupportedMeasures, WritingLayers } from '../../../element/measurements';

export const parseElementFromBinary = (e: BinDucElement): DucElement | null => {
  if (!e) return null;

  // Populate groupIds array
  let groupIds: string[] = [];
  for (let j = 0; j < e.groupIdsLength(); j++) {
    groupIds.push(e.groupIds(j) || '');
  }

  // Populate boundElements array
  let boundElements: {
    id: string;
    type: "arrow" | "text";
  }[] | null = [];
  for (let j = 0; j < e.boundElementsLength(); j++) {
    if (e.boundElements(j)) {
      boundElements.push({
        id: e.boundElements(j)?.id() || '',
        type: e.boundElements(j)?.type() as "arrow" | "text",
      });
    }
  }

  const elementType = e.type() as DucElementTypes;

  const baseElement = {
    id: e.id() || '',
    x: e.x(),
    y: e.y(),
    strokeColor: e.strokeColor() || '',
    backgroundColor: e.backgroundColor() || '',
    fillStyle: (e.fillStyle() || '') as FillStyle,
    strokeWidth: e.strokeWidth(),
    roughness: e.roughness(),
    ratioLocked: e.ratioLocked(),
    isVisible: e.isVisible(),
    roundness: {
      type: (Number(e.roundnessType() || '1')) as RoundnessType,
      value: e.roundnessValue(),
    },
    opacity: e.opacity(),
    width: e.width(),
    height: e.height(),
    angle: e.angle(),
    seed: e.seed(),
    version: e.version(),
    versionNonce: e.versionNonce(),
    isDeleted: e.isDeleted(),
    frameId: e.frameId() || '',
    updated: Number(e.updated()),
    link: e.link() || '',
    locked: e.locked(),
    customData: e.customData()?.length ? JSON.parse(e.customData()!) : '',
    groupIds: groupIds,
    scope: (e.scope() || '') as SupportedMeasures,
    writingLayer: (e.writingLayer() || '') as WritingLayers,
    label: e.label() || '',
    strokeStyle: (e.strokeStyle() || '') as StrokeStyle,
    boundElements: boundElements,
    strokePlacement: (e.strokePlacement() || '') as StrokePlacement,
  };

  switch (elementType) {
    case "text":
    case "arrow":
    case "selection":
    case "rectangle":
    case "diamond":
    case "ellipse":
    case "line":
    case "freedraw":
      return {
        ...baseElement,
        type: elementType,
        points: e.pointsArray() || [],
      } as DucElement;
    case "image":
    case "frame":
    case "group":
    case "magicframe":
    case "iframe":
      return {
        ...baseElement,
        type: elementType,
      } as DucElement;
    default:
      return null;
  }
};
