import { DucElement as BinDucElement } from '../../duc';
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
  DucEllipseElement,
  FractionalIndex,
  BoundElement
} from '../../../../element/types';
import { SupportedMeasures } from '../../../utils/measurements';
import { BezierMirroring, Point } from '../../../../types';

export const parseElementFromBinary = (e: BinDucElement, v: number): Partial<DucElement> | null => {
  if (!e) return null;
  const elType = e.type();
  if(!elType) return null;

  // Populate groupIds array
  let groupIds: string[] = [];
  for (let j = 0; j < e.groupIdsLength(); j++) {
    groupIds.push(e.groupIds(j) || '');
  }

  // Populate boundElements array
  const boundElements = Array.from({ length: e.boundElementsLength() })
    .map((_, j) => e.boundElements(j))
    .filter((element): element is NonNullable<typeof element> => !!element)
    .map(boundElement => ({
      id: boundElement.id(),
      type: boundElement.type()
    }))
  .filter((element): element is BoundElement => 
    !!element.id && !!element.type
  );

  const points: Point[] = ['freedraw', 'line', 'arrow'].includes(elType)
    ? Array.from({ length: e.pointsLength() })
        .map((_, j) => e.points(j))
        .filter((point): point is NonNullable<typeof point> => !!point)
        .map(point => ({
          x: v>2 ? point.xV3() : point.xV2() || 0,
          y: v>2 ? point.yV3() : point.yV2() || 0,
          isCurve: point.isCurve() || undefined,
          mirroring: point.mirroring() as BezierMirroring | undefined,
          borderRadius: point.borderRadius() || undefined,
          handleIn: point.handleIn() ? { x: point.handleIn()!.x(), y: point.handleIn()!.y() } : undefined,
          handleOut: point.handleOut() ? { x: point.handleOut()!.x(), y: point.handleOut()!.y() } : undefined
        }))
    : [];

  const pressures = elType === 'freedraw'
    ? Array.from({ length: e.pressuresV3Length() })
        .map((_, j) => e.pressuresV3(j))
        .filter((pressure): pressure is number => pressure !== null && pressure !== undefined)
    : [];

  const baseElement: Partial<DucElement> = {
    id: e.id() || undefined,
    x: v>2 ? e.xV3() : e.xV2() || undefined,
    y: v>2 ? e.yV3() : e.yV2() || undefined,
    strokeColor: e.strokeColor() || undefined,
    backgroundColor: e.backgroundColor() || undefined,
    strokeWidth: v>2 ? e.strokeWidthV3() : e.strokeWidthV2() || undefined,
    isVisible: e.isVisible(),
    roundness: null,
    isStrokeDisabled: e.isStrokeDisabled(),
    isBackgroundDisabled: e.isBackgroundDisabled(),
    opacity: e.opacity(),
    width: v>2 ? e.widthV3() : e.widthV2() || undefined,
    height: v>2 ? e.heightV3() : e.heightV2() || undefined,
    angle: v>2 ? e.angleV3() : e.angleV2() || undefined,
    isDeleted: e.isDeleted(),
    frameId: e.frameId(),
    link: e.link() || undefined,
    locked: e.locked(),
    groupIds: groupIds,
    scope: (e.scope() || undefined) as SupportedMeasures,
    label: e.label() || undefined,
    strokeStyle: (e.strokeStyleV3() || undefined) as StrokeStyle,
    fillStyle: (e.fillStyleV3() || undefined) as FillStyle,
    boundElements: boundElements,
    strokePlacement: (e.strokePlacement() || undefined) as StrokePlacement,
  };

  switch (elType) {
    case "text":
      return {
        ...baseElement,
        type: elType,
        fontSize: v>2 ? e.fontSizeV3() : e.fontSizeV2() || undefined,
        fontFamily: Number(e.fontFamily()) as FontFamilyValues,
        text: e.text(),
        textAlign: e.textAlignV3() as TextAlign,
        verticalAlign: e.verticalAlignV3() as VerticalAlign,
        containerId: e.containerId(),
        originalText: e.text(),
        lineHeight: v>2 ? e.lineHeightV3() : e.lineHeightV2() || undefined,
        autoResize: e.autoResize(),
      } as DucTextElement;
    case "arrow":
      return {
        ...baseElement,
        type: elType,
        points: points,
        lastCommittedPoint: e.lastCommittedPoint(),
        startBinding: e.startBinding(),
        endBinding: e.endBinding(),
        startArrowhead: e.startArrowhead() as Arrowhead,
        endArrowhead: e.endArrowhead() as Arrowhead,
        elbowed: e.elbowed()
      } as DucArrowElement;
    case "line":
      return {
        ...baseElement,
        type: elType,
        points: points,
        lastCommittedPoint: e.lastCommittedPoint(),
        startBinding: e.startBinding(),
        endBinding: e.endBinding(),
        startArrowhead: e.startArrowhead() as Arrowhead,
        endArrowhead: e.endArrowhead() as Arrowhead,
      } as DucLinearElement;
    case "freedraw":
      return {
        ...baseElement,
        type: elType,
        points: points,
        pressures: pressures,
        simulatePressure: e.simulatePressure(),
        lastCommittedPoint: e.lastCommittedPoint(),
      } as DucFreeDrawElement;
    case "image":
      return {
        ...baseElement,
        type: elType,
        fileId: e.fileId() as FileId | null,
        status: e.status(),
        scale: (()=>{const s = e.scaleV3(); return s ? [s.x(), s.y()] : undefined; })(),
      } as DucImageElement;
    case "frame":
      return {
        ...baseElement,
        type: elType,
        isCollapsed: e.isCollapsed(),
        name: e.name(),
      } as DucFrameElement;
    case "group":
      return {
        ...baseElement,
        type: elType,
        isCollapsed: e.isCollapsed(),
        groupIdRef: e.groupIdRef(),
      } as DucGroupElement;
    case "magicframe":
      return {
        ...baseElement,
        type: elType,
        isCollapsed: e.isCollapsed(),
        name: e.name(),
      } as DucMagicFrameElement;
    case "selection":
      return {
        ...baseElement,
        type: elType,
      } as DucSelectionElement;
    case "rectangle":
      return {
        ...baseElement,
        type: elType,
      } as DucRectangleElement;
    case "diamond":
      return {
        ...baseElement,
        type: elType,
      } as DucDiamondElement;
    case "ellipse":
      return {
        ...baseElement,
        type: elType,
      } as DucEllipseElement;
    default:
      return null;
  }
};
