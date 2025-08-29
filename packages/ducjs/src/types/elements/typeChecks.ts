import type { ElementOrToolType } from "..";
import type { MarkNonNullable } from "../utility-types";
import { assertNever } from "../../utils";
import { Bounds, LineSegment, TuplePoint } from "../geometryTypes";
import type {
  DucArrowElement,
  DucBindableElement,
  DucElbowArrowElement,
  DucElement,
  DucElementType,
  DucEmbeddableElement,
  DucFlowchartNodeElement,
  DucFrameElement,
  DucFrameLikeElement,
  DucFreeDrawElement,
  DucImageElement,
  DucLinearElement,
  DucTableElement,
  DucPointBinding,
  DucTextContainer,
  DucTextElement,
  DucTextElementWithContainer,
  FixedPointBinding,
  InitializedDucImageElement,
  DucNonSelectionElement,
  DucEllipseElement,
  DucPolygonElement,
  DucBlockInstanceElement,
  NonDeleted,
  DucIframeLikeElement
} from "./";

export const isInitializedImageElement = (
  element: DucElement | null,
): element is InitializedDucImageElement => {
  return !!element && element.type === "image" && !!element.fileId;
};

export const isImageElement = (
  element: DucElement | null,
): element is DucImageElement => {
  return !!element && element.type === "image";
};

export const isEmbeddableElement = (
  element: DucElement | null | undefined,
): element is DucEmbeddableElement => {
  return !!element && element.type === "embeddable";
};

export const isTableElement = (
  element: DucElement | null,
): element is DucTableElement => {
  return !!element && element.type === "table";
};

export const isIframeLikeElement = (
  element: DucElement | null,
): element is DucIframeLikeElement => {
  return (
    !!element && (
      element.type === "embeddable" ||
      element.type === "table" ||
      element.type === "doc"
    )
  );
};

export const isTextElement = (
  element: DucElement | null,
): element is DucTextElement => {
  return element != null && element.type === "text";
};

export const isFrameElement = (
  element: DucElement | null,
): element is DucFrameElement => {
  return element != null && element.type === "frame";
};

export const isFrameLikeElement = (
  element: DucElement | null,
): element is DucFrameLikeElement => {
  return (
    element != null &&
    (element.type === "frame")
  );
};

export const isFreeDrawElement = (
  element?: DucElement | null,
): element is DucFreeDrawElement => {
  return element != null && isFreeDrawElementType(element.type);
};

export const isEllipseElement = (
  element?: DucElement | null,
): element is DucEllipseElement => {
  return element != null && element.type === "ellipse";
};

export const isPolygonElement = (
  element?: DucElement | null,
): element is DucPolygonElement => {
  return element != null && element.type === "polygon";
};

export const isFreeDrawElementType = (
  elementType: DucElementType,
): boolean => {
  return elementType === "freedraw";
};

export const isLinearElement = (
  element?: DucElement | null,
): element is DucLinearElement => {
  return element != null && isLinearElementType(element.type);
};


export const isLinearElementType = (
  elementType: ElementOrToolType,
): boolean => {
  return (
    elementType === "arrow" || elementType === "line"
  );
};

export const isFlowchartNodeElement = (
  element: DucElement,
): element is DucFlowchartNodeElement => {
  return (
    element.type === "rectangle" ||
    element.type === "ellipse" ||
    element.type === "polygon"
  );
};

export const isShapeToLinearElementPossible = (
  element: DucElement,
): element is DucNonSelectionElement => {
  return (
    element.type === "rectangle" ||
    element.type === "ellipse" ||
    element.type === "polygon"
  );
};

export const isArrowElement = (
  element?: DucElement | null,
): element is DucArrowElement => {
  return element != null && element.type === "arrow";
};

export const isElbowArrow = (
  element?: DucElement,
): element is DucElbowArrowElement => {
  return isArrowElement(element) && element.elbowed;
};

export const isBindingElement = (
  element?: DucElement | null,
  includeLocked = true,
): element is DucLinearElement => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    isBindingElementType(element.type)
  );
};

export const isBindingElementType = (
  elementType: ElementOrToolType,
): boolean => {
  return elementType === "arrow";
};

export const isBindableElement = (
  element: DucElement | null | undefined,
  includeLocked = true,
): element is DucBindableElement => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    (element.type === "rectangle" ||
      element.type === "polygon" ||
      element.type === "ellipse" ||
      element.type === "image" ||
      element.type === "embeddable" ||
      element.type === "frame" ||
      element.type === "line" ||
      element.type === "arrow" ||
      (element.type === "text" && !element.containerId))
  );
};

export const isRectanguloidElement = (
  element?: DucElement | null,
): element is DucBindableElement => {
  return (
    element != null &&
    (element.type === "rectangle" ||
      element.type === "image" ||
      element.type === "embeddable" ||
      element.type === "frame" ||
      element.type === "table" ||
      (element.type === "text" && !element.containerId))
  );
};

export const isBlockInstanceElement = (
  element?: DucElement | null,
): element is DucBlockInstanceElement => {
  return element != null && element.type === "blockinstance";
};

// TODO: Remove this when proper distance calculation is introduced
// @see binding.ts:distanceToBindableElement()
export const isRectangularElement = (
  element?: DucElement | null,
): element is DucBindableElement => {
  return (
    element != null &&
    (element.type === "rectangle" ||
      element.type === "image" ||
      element.type === "text" ||
      element.type === "embeddable" ||
      element.type === "frame" ||
      element.type === "table")
  );
};

export const isTextBindableContainer = (
  element: DucElement | null,
  includeLocked = true,
): element is DucTextContainer => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    (element.type === "rectangle" ||
      element.type === "polygon" ||
      element.type === "ellipse" ||
      isArrowElement(element))
  );
};

export const isDucElement = (
  element: any,
): element is DucElement => {
  const type: DucElementType | undefined = element?.type;
  if (!type) {
    return false;
  }
  switch (type) {
    case "text":
    case "polygon":
    case "rectangle":
    case "embeddable":
    case "ellipse":
    case "arrow":
    case "freedraw":
    case "line":
    case "frame":
    case "image":
    case "table":
    case "dimension":
    case "leader":
    case "doc":
    case "blockinstance":
    case "selection":
    case "parametric":
    case "featurecontrolframe":
    case "viewport":
    case "plot":
    case "xray":
    case "pdf":
    case "mermaid": {
      return true;
    }
    default: {
      assertNever(type, null);
      return false;
    }
  }
};


export const hasBoundTextElement = (
  element: DucElement | null,
): element is MarkNonNullable<DucBindableElement, "boundElements"> => {
  return (
    isTextBindableContainer(element) &&
    !!element.boundElements?.some(({ type }) => type === "text")
  );
};

export const isBoundToContainer = (
  element: DucElement | null,
): element is DucTextElementWithContainer => {
  return (
    element !== null &&
    "containerId" in element &&
    element.containerId !== null &&
    isTextElement(element)
  );
};

export const isUsingAdaptiveRadius = (type: string) =>
  type === "rectangle" ||
  type === "embeddable" ||
  type === "image" ||
  type === "table";

export const isUsingProportionalRadius = (type: string) =>
  type === "line" || type === "arrow" || type === "diamond";


// TODO: Move this to @excalidraw/math
export const isPoint = (point: unknown): point is TuplePoint =>
  Array.isArray(point) && point.length === 2;

// TODO: Move this to @excalidraw/math
export const isBounds = (box: unknown): box is Bounds =>
  Array.isArray(box) &&
  box.length === 4 &&
  typeof box[0] === "number" &&
  typeof box[1] === "number" &&
  typeof box[2] === "number" &&
  typeof box[3] === "number";

// TODO: Move this to @excalidraw/math
export const isLineSegment = (segment: unknown): segment is LineSegment =>
  Array.isArray(segment) &&
  segment.length === 2 &&
  isPoint(segment[0]) &&
  isPoint(segment[0]);


export const isFixedPointBinding = (
  binding: DucPointBinding,
): binding is FixedPointBinding => {
  return binding.fixedPoint != null;
};

export const isTable = (
  element: DucElement | null,
): element is DucTableElement => {
  return element?.type === "table";
};


export const isNonDeletedElement = <T extends DucElement>(
  element: T,
): element is NonDeleted<T> => !element.isDeleted;