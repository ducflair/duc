import { DucElement as BinDucElement } from '../duc';
import {
  DucElement,
  DucElementTypes,
  FillStyle,
  StrokeStyle,
  StrokePlacement,
  RoundnessType,
  FontFamilyValues,
  TextAlign,
  VerticalAlign,
  DucTextElement,
  DucLinearElement,
  Arrowhead,
  FileId,
  DucMagicFrameElement,
  DucFrameElement,
  DucImageElement,
  DucFreeDrawElement,
  DucGroupElement,
  DucArrowElement,
  DucSelectionElement,
  DucRectangleElement,
  DucDiamondElement,
  DucEllipseElement
} from '../../../element/types';
import { SupportedMeasures } from '../../utils/measurements';
import { WritingLayers } from '../../utils/writingLayers';

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

  let points: [number, number][] = [];
  if(e.type() === 'freedraw' || e.type() === 'line' || e.type() === 'arrow') {
    for (let j = 0; j < e.pointsLength(); j++) {
      const point = e.points(j);
      if (point) {
        points.push([point.x(), point.y()]);
      }
    }
  }

  let pressures: number[] = [];
  if(e.type() === 'freedraw') {
    for (let j = 0; j < e.pressuresLength(); j++) {
      const pressure = e.pressures(j);
      if (pressure) {
        pressures.push(pressure);
      }
    }
  }

  const elementType = e.type() as DucElementTypes;

  const baseElement = {
    id: e.id() || '',
    x: e.x(),
    y: e.y(),
    index: e.index(),
    strokeColor: e.strokeColor() || '',
    backgroundColor: e.backgroundColor() || '',
    fillStyle: (e.fillStyle() || '') as FillStyle,
    strokeWidth: e.strokeWidth(),
    roughness: e.roughness(),
    isVisible: e.isVisible(),
    roundness: null,
    // roundness: { FIXME: For now we won't be using roundness
    //   type: (Number(e.roundnessType() || '1')) as RoundnessType,
    //   value: e.roundnessValue(),
    // },
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
    shouldNotRender: false,
  };

  switch (elementType) {
    case "text":
      return {
        ...baseElement,
        type: elementType,
        fontSize: e.fontSize(),
        fontFamily: Number(e.fontFamily()) as FontFamilyValues,
        text: e.text(),
        textAlign: e.textAlign() as TextAlign,
        verticalAlign: e.verticalAlign() as VerticalAlign,
        containerId: e.containerId(),
        originalText: e.originalText(),
        lineHeight: e.lineHeight() as number & { _brand: "unitlessLineHeight" },
        autoResize: e.autoResize(),
      } as DucTextElement;
    case "arrow":
      return {
        ...baseElement,
        type: elementType,
        points: points,
        lastCommittedPoint: [e.lastCommittedPoint()?.x(), e.lastCommittedPoint()?.y()],
        startBinding: {
          elementId: e.startBinding()?.elementId(),
          focus: e.startBinding()?.focus(),
          gap: e.startBinding()?.gap(),
          fixedPoint: e.startBinding()?.fixedPoint()
        },
        endBinding: {
          elementId: e.endBinding()?.elementId(),
          focus: e.endBinding()?.focus(),
          gap: e.endBinding()?.gap(),
          fixedPoint: e.endBinding()?.fixedPoint()
        },
        startArrowhead: e.startArrowhead() as Arrowhead,
        endArrowhead: e.endArrowhead() as Arrowhead,
        elbowed: e.elbowed()
      } as DucArrowElement;
    case "line":
      return {
        ...baseElement,
        type: elementType,
        points: points,
        lastCommittedPoint: [e.lastCommittedPoint()?.x(), e.lastCommittedPoint()?.y()],
        startBinding: {
          elementId: e.startBinding()?.elementId(),
          focus: e.startBinding()?.focus(),
          gap: e.startBinding()?.gap(),
          fixedPoint: e.startBinding()?.fixedPoint()
        },
        endBinding: {
          elementId: e.endBinding()?.elementId(),
          focus: e.endBinding()?.focus(),
          gap: e.endBinding()?.gap(),
          fixedPoint: e.endBinding()?.fixedPoint()
        },
        startArrowhead: e.startArrowhead() as Arrowhead,
        endArrowhead: e.endArrowhead() as Arrowhead,
      } as DucLinearElement;
    case "freedraw":
      return {
        ...baseElement,
        type: elementType,
        points: points,
        pressures: pressures,
        simulatePressure: e.simulatePressure(),
        lastCommittedPoint: e.lastCommittedPoint(),
      } as DucFreeDrawElement;
    case "image":
      return {
        ...baseElement,
        type: elementType,
        fileId: e.fileId() as FileId | null,
        status: e.status() as "pending" | "saved" | "error",
        scale: [e.scale()?.x(), e.scale()?.y()],
      } as DucImageElement;
    case "frame":
      return {
        ...baseElement,
        type: elementType,
        isCollapsed: e.isCollapsed(),
        name: e.name(),
      } as DucFrameElement;
    case "group":
      return {
        ...baseElement,
        type: elementType,
        isCollapsed: e.isCollapsed(),
        groupIdRef: e.groupIdRef(),
      } as DucGroupElement;
    case "magicframe":
      return {
        ...baseElement,
        type: elementType,
        isCollapsed: e.isCollapsed(),
        name: e.name(),
      } as DucMagicFrameElement;
    case "selection":
      return {
        ...baseElement,
        type: elementType,
      } as DucSelectionElement;
    case "rectangle":
      return {
        ...baseElement,
        type: elementType,
      } as DucRectangleElement;
    case "diamond":
      return {
        ...baseElement,
        type: elementType,
      } as DucDiamondElement;
    case "ellipse":
      return {
        ...baseElement,
        type: elementType,
      } as DucEllipseElement;
    default:
      return null;
  }
};
