export * from "./frameElement";
export * from "./freedrawElement";
export * from "./linearElement";
export * from "./newElement";
export * from "./textElement";

import { getUpdatedTimestamp } from "..";
import { LINE_SPACING_TYPE } from "../../enums";
import { getPrecisionValueFromRaw } from "../../technical/scopes";
import { RawValue, Scope } from "../../types";
import { _DucStackBase, DucElement, DucNonSelectionElement, DucTableElement, DucTextStyle, ElementConstructorOpts, NonDeleted } from "../../types/elements";
import { isFreeDrawElement, isLinearElement } from "../../types/elements/typeChecks";
import { GeometricPoint, Percentage, Radian, ScaleFactor, TuplePoint } from "../../types/geometryTypes";
import { Mutable } from "../../types/utility-types";
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_TEXT_ALIGN, DEFAULT_VERTICAL_ALIGN } from "../constants";
import { randomInteger } from "../math/random";

/**
 * Returns a default DucTextStyle object for the given scope.
 */
export function getDefaultTextStyle(currentScope: Scope): DucTextStyle {
  return {
    isLtr: true,
    fontFamily: DEFAULT_FONT_FAMILY,
    bigFontFamily: "sans-serif",
    textAlign: DEFAULT_TEXT_ALIGN,
    verticalAlign: DEFAULT_VERTICAL_ALIGN,
    lineHeight: 1.2 as any,
    lineSpacing: { type: LINE_SPACING_TYPE.MULTIPLE, value: 1.2 as any },
    obliqueAngle: 0 as Radian,
    fontSize: getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, currentScope, currentScope),
    widthFactor: 1 as ScaleFactor,
    isUpsideDown: false,
    isBackwards: false,
  };
}

/**
 * Mutates element, bumping `version`, `versionNonce`, and `updated`.
 *
 * NOTE: does not trigger re-render.
 */
export const bumpVersion = <T extends Mutable<DucElement>>(
  element: T,
  version?: DucElement["version"],
) => {
  element.version = (version ?? element.version) + 1;
  element.versionNonce = randomInteger();
  element.updated = getUpdatedTimestamp();
  return element;
};

export const getDefaultStackProperties = (): _DucStackBase => {
  return {
    label: "",
    description: null,
    isCollapsed: false,
    locked: false,
    isVisible: true,
    isPlot: true,
    opacity: 1 as Percentage,
  };
};

/**
 * Returns the data structures for a default table.
 * This does not include base element properties like x, y, width, etc.,
 * which are added during element creation.
 */
export const getDefaultTableData = (currentScope: Scope): {
  fileId: DucTableElement["fileId"];
} => {
  return {
    fileId: null,
  };
};

export const getBaseElementProps = (element: DucNonSelectionElement): ElementConstructorOpts => {
  return {
    x: element.x,
    y: element.y,
    scope: element.scope,
    label: element.label,
    isVisible: element.isVisible,
    isPlot: element.isPlot,
    layerId: element.layerId,
    regionIds: element.regionIds,
    blockIds: element.blockIds,
    roundness: element.roundness,
    blending: element.blending,
    background: element.background,
    stroke: element.stroke,
    opacity: element.opacity,
    width: element.width,
    height: element.height,
    angle: element.angle,
    groupIds: element.groupIds,
    frameId: element.frameId,
    boundElements: element.boundElements,
    link: element.link,
    locked: element.locked,
    customData: element.customData,
    description: element.description,
    zIndex: element.zIndex,
  };
};

export function convertPointToTuple(point: GeometricPoint): TuplePoint {
  return [point.x, point.y];
}

// Helper function to migrate legacy tuple points to new Point objects
export const migratePoints = (points: any[]): GeometricPoint[] => {
  return points.map(point => {
    if (Array.isArray(point)) {
      const [x, y] = point;
      return { x, y };
    }
    return point; // Assume already migrated
  });
};

export const getNonDeletedElements = <T extends DucElement>(
  elements: readonly T[],
) =>
  elements.filter((element) => !element.isDeleted) as readonly NonDeleted<T>[];

export const isInvisiblySmallElement = (
  element: DucElement,
): boolean => {
  if (isLinearElement(element) || isFreeDrawElement(element)) {
    return element.points.length < 2;
  }
  return element.width.scoped === 0 && element.height.scoped === 0;
};

/**
 * Sorts a list of DucElements by their z-index (lowest first).
 *
 * @param elements The list of elements to sort.
 * @returns A new array with elements sorted by z-index.
 */
export const getElementsSortedByZIndex = (elements: readonly DucElement[]): DucElement[] => {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
};
