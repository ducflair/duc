export * from "./newElement";
export * from "./freedrawElement";
export * from "./frameElement";
export * from "./linearElement";
export * from "./textElement";

import { TEXT_ALIGN } from "ducjs/duc";
import { Scope, RawValue } from "ducjs/types";
import { _DucStackBase, DucElement, DucNonSelectionElement, DucTableElement, DucTextContainer, DucTextElement, ElementConstructorOpts, ElementsMap, NonDeleted } from "ducjs/types/elements";
import { isFreeDrawElement, isLinearElement } from "ducjs/types/elements/typeChecks";
import { GeometricPoint, Percentage, TuplePoint } from "ducjs/types/geometryTypes";
import { Mutable } from "ducjs/types/utility-types";
import { getUpdatedTimestamp } from "ducjs/utils";
import { getElementAbsoluteCoords, getResizedElementAbsoluteCoords } from "ducjs/utils/bounds";
import { DEFAULT_ELEMENT_PROPS, DEFAULT_FONT_SIZE } from "ducjs/utils/constants";
import { getBoundTextMaxWidth, getFontString, getTextElementPositionOffsets, measureText, wrapText } from "ducjs/utils/elements/textElement";
import { adjustXYWithRotation } from "ducjs/utils/math";
import { randomInteger } from "ducjs/utils/math/random";
import { normalizeText } from "ducjs/utils/normalize";
import { getPrecisionValueFromRaw } from "ducjs/technical/scopes";

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
    isCollapsed: false,
    locked: false,
    isVisible: true,
    isPlot: true,
    opacity: 1 as Percentage,
    labelingColor: "transparent",
    description: null,
  };
};

/**
 * Create a new table with default configuration
 */
export const getDefaultTable = (currentScope: Scope): {
  columnOrder: DucTableElement["columnOrder"];
  rowOrder: DucTableElement["rowOrder"];
  columns: DucTableElement["columns"];
  rows: DucTableElement["rows"];
  cells: DucTableElement["cells"];
  style: DucTableElement["style"];
} => {
  // Generate default column and row IDs
  const columnIds = ["col1", "col2", "col3"];
  const rowIds = ["row1", "row2", "row3"];
  const defaultCellSize = getPrecisionValueFromRaw(100 as RawValue, currentScope, currentScope);

  // Create default columns
  const columns: Record<string, DucTableElement["columns"][string]> = {};
  columnIds.forEach((id, index) => {
    columns[id] = {
      id,
      width: defaultCellSize,
    };
  });

  // Create default rows
  const rows: Record<string, DucTableElement["rows"][string]> = {};
  rowIds.forEach((id, index) => {
    rows[id] = {
      id,
      height: defaultCellSize,
    };
  });

  // Create default cells
  const cells: Record<string, DucTableElement["cells"][string]> = {};
  rowIds.forEach(rowId => {
    columnIds.forEach(colId => {
      const cellId = `${rowId}:${colId}`;
      cells[cellId] = {
        rowId,
        columnId: colId,
        data: "",
        style: {},
      };
    });
  });

  return {
    columnOrder: columnIds,
    rowOrder: rowIds,
    columns,
    rows,
    cells,
    style: {
      background: DEFAULT_ELEMENT_PROPS.background.content.src,
      border: {
        width: DEFAULT_ELEMENT_PROPS.stroke.width,
        color: DEFAULT_ELEMENT_PROPS.stroke.content.src,
      },
      text: {
        color: DEFAULT_ELEMENT_PROPS.stroke.content.src,
        size: getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, currentScope, currentScope),
        align: TEXT_ALIGN.LEFT,
      },
    },
  };
};

export const getBaseElementProps = (element: DucNonSelectionElement): ElementConstructorOpts => {
  return {
    x: element.x,
    y: element.y,
    scope: element.scope,
    label: element.label,
    isVisible: element.isVisible,
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