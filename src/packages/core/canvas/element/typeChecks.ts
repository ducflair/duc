import { ROUNDNESS } from "../constants";
import { ElementOrToolType } from "../types";
import { MarkNonNullable } from "../utility-types";
import { assertNever } from "../utils";
import {
  DucElement,
  DucTextElement,
  DucEmbeddableElement,
  DucLinearElement,
  DucBindableElement,
  DucFreeDrawElement,
  InitializedDucImageElement,
  DucImageElement,
  DucTextElementWithContainer,
  DucTextContainer,
  DucFrameElement,
  RoundnessType,
  DucFrameLikeElement,
  DucElementType,
  DucIframeElement,
  DucIframeLikeElement,
  DucMagicFrameElement,
} from "./types";

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

export const isIframeElement = (
  element: DucElement | null,
): element is DucIframeElement => {
  return !!element && element.type === "iframe";
};

export const isIframeLikeElement = (
  element: DucElement | null,
): element is DucIframeLikeElement => {
  return (
    !!element && (element.type === "iframe" || element.type === "embeddable")
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

export const isMagicFrameElement = (
  element: DucElement | null,
): element is DucMagicFrameElement => {
  return element != null && element.type === "magicframe";
};

export const isFrameLikeElement = (
  element: DucElement | null,
): element is DucFrameLikeElement => {
  return (
    element != null &&
    (element.type === "frame" || element.type === "magicframe")
  );
};

export const isFreeDrawElement = (
  element?: DucElement | null,
): element is DucFreeDrawElement => {
  return element != null && isFreeDrawElementType(element.type);
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

export const isArrowElement = (
  element?: DucElement | null,
): element is DucLinearElement => {
  return element != null && element.type === "arrow";
};

export const isLinearElementType = (
  elementType: ElementOrToolType,
): boolean => {
  return (
    elementType === "arrow" || elementType === "line" // || elementType === "freedraw"
  );
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
  element: DucElement | null,
  includeLocked = true,
): element is DucBindableElement => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    (element.type === "rectangle" ||
      element.type === "diamond" ||
      element.type === "ellipse" ||
      element.type === "image" ||
      element.type === "iframe" ||
      element.type === "embeddable" ||
      element.type === "frame" ||
      element.type === "magicframe" ||
      (element.type === "text" && !element.containerId))
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
      element.type === "diamond" ||
      element.type === "ellipse" ||
      isArrowElement(element))
  );
};

export const isExcalidrawElement = (
  element: any,
): element is DucElement => {
  const type: DucElementType | undefined = element?.type;
  if (!type) {
    return false;
  }
  switch (type) {
    case "text":
    case "diamond":
    case "rectangle":
    case "iframe":
    case "embeddable":
    case "ellipse":
    case "arrow":
    case "freedraw":
    case "line":
    case "frame":
    case "group":
    case "magicframe":
    case "image":
    case "selection": {
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
  type === "iframe" ||
  type === "image";

export const isUsingProportionalRadius = (type: string) =>
  type === "line" || type === "arrow" || type === "diamond";

export const canApplyRoundnessTypeToElement = (
  roundnessType: RoundnessType,
  element: DucElement,
) => {
  if (
    (roundnessType === ROUNDNESS.ADAPTIVE_RADIUS ||
      // if legacy roundness, it can be applied to elements that currently
      // use adaptive radius
      roundnessType === ROUNDNESS.LEGACY) &&
    isUsingAdaptiveRadius(element.type)
  ) {
    return true;
  }
  if (
    roundnessType === ROUNDNESS.PROPORTIONAL_RADIUS &&
    isUsingProportionalRadius(element.type)
  ) {
    return true;
  }

  return false;
};

export const getDefaultRoundnessTypeForElement = (
  element: DucElement,
) => {
  if (isUsingProportionalRadius(element.type)) {
    return {
      type: ROUNDNESS.PROPORTIONAL_RADIUS,
    };
  }

  if (isUsingAdaptiveRadius(element.type)) {
    return {
      type: ROUNDNESS.ADAPTIVE_RADIUS,
    };
  }

  return null;
};