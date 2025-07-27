export * from "./newElement";
export * from "./freedrawElement";
export * from "./linearElement";
export * from "./textElement";

import { LINE_SPACING_TYPE, TABLE_CELL_ALIGNMENT, TABLE_FLOW_DIRECTION } from "ducjs/duc";
import { Scope, RawValue } from "ducjs/types";
import { _DucStackBase, DucElement, DucNonSelectionElement, DucTableElement, DucTextContainer, DucTextElement, DucTextStyle, ElementConstructorOpts, ElementsMap, NonDeleted } from "ducjs/types/elements";
import { isFreeDrawElement, isLinearElement } from "ducjs/types/elements/typeChecks";
import { GeometricPoint, Percentage, Radian, ScaleFactor, TuplePoint } from "ducjs/types/geometryTypes";
import { Mutable } from "ducjs/types/utility-types";
import { getUpdatedTimestamp } from "ducjs/utils";
import { getElementAbsoluteCoords, getResizedElementAbsoluteCoords } from "ducjs/utils/bounds";
import { DEFAULT_ELEMENT_PROPS, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_TEXT_ALIGN, DEFAULT_VERTICAL_ALIGN, FONT_FAMILY } from "ducjs/utils/constants";
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
    description: null,
    isCollapsed: false,
    locked: false,
    isVisible: true,
    isPlot: true,
    opacity: 1 as Percentage,
    labelingColor: "transparent",
  };
};

/**
 * Returns the data structures for a default table.
 * This does not include base element properties like x, y, width, etc.,
 * which are added during element creation.
 */
export const getDefaultTableData = (currentScope: Scope): {
  columnOrder: DucTableElement["columnOrder"];
  rowOrder: DucTableElement["rowOrder"];
  columns: DucTableElement["columns"];
  rows: DucTableElement["rows"];
  cells: DucTableElement["cells"];
  // Properties from DucTableStyle
  flowDirection: DucTableElement["flowDirection"];
  headerRowStyle: DucTableElement["headerRowStyle"];
  dataRowStyle: DucTableElement["dataRowStyle"];
  dataColumnStyle: DucTableElement["dataColumnStyle"];
  // Other table-specific properties
  headerRowCount: DucTableElement["headerRowCount"];
  autoSize: DucTableElement["autoSize"];
} => {
  // Generate default column and row IDs
  const columnIds = ["col1", "col2", "col3"];
  const rowIds = ["row1", "row2", "row3"];
  const defaultCellSize = getPrecisionValueFromRaw(100 as RawValue, currentScope, currentScope);

  // Default styling for cells
  const defaultCellStyle: DucTableElement["dataRowStyle"] = {
    ...DEFAULT_ELEMENT_PROPS,
    background: [DEFAULT_ELEMENT_PROPS.background],
    stroke: [DEFAULT_ELEMENT_PROPS.stroke],
    textStyle: {
      isLtr: true,
      fontFamily: FONT_FAMILY.Virgil,
      bigFontFamily: "sans-serif",
      textAlign: DEFAULT_TEXT_ALIGN,
      verticalAlign: DEFAULT_VERTICAL_ALIGN,
      lineHeight: 1.15 as DucTextStyle["lineHeight"],
      lineSpacing: { type: LINE_SPACING_TYPE.MULTIPLE, value: 1.15 as ScaleFactor },
      obliqueAngle: 0 as Radian,
      fontSize: getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, currentScope, currentScope),
      paperTextHeight: undefined,
      widthFactor: 1 as ScaleFactor,
      isUpsideDown: false,
      isBackwards: false,
      roundness: DEFAULT_ELEMENT_PROPS.roundness,
      background: [DEFAULT_ELEMENT_PROPS.background],
      stroke: [DEFAULT_ELEMENT_PROPS.stroke],
      opacity: DEFAULT_ELEMENT_PROPS.opacity,
    },
    margins: {
      top: getPrecisionValueFromRaw(5 as RawValue, currentScope, currentScope),
      right: getPrecisionValueFromRaw(5 as RawValue, currentScope, currentScope),
      bottom: getPrecisionValueFromRaw(5 as RawValue, currentScope, currentScope),
      left: getPrecisionValueFromRaw(5 as RawValue, currentScope, currentScope),
    },
    alignment: TABLE_CELL_ALIGNMENT.MIDDLE_CENTER,
  };

  // Create default columns
  const columns = Object.fromEntries(
    columnIds.map(id => [id, { id, width: defaultCellSize }])
  );

  // Create default rows
  const rows = Object.fromEntries(
    rowIds.map(id => [id, { id, height: defaultCellSize }])
  );

  // Create default cells
  const cells: Record<string, DucTableElement["cells"][string]> = Object.create(null);
  rowIds.forEach(rowId => {
    columnIds.forEach(colId => {
      const cellId = `${rowId}:${colId}`;
      cells[cellId] = { rowId, columnId: colId, data: "", locked: false };
    });
  });

  return {
    // Data Structure
    columnOrder: columnIds,
    rowOrder: rowIds,
    columns,
    rows,
    cells,
    // Style & Behavior
    flowDirection: TABLE_FLOW_DIRECTION.DOWN,
    headerRowStyle: defaultCellStyle,
    dataRowStyle: defaultCellStyle,
    dataColumnStyle: defaultCellStyle,
    headerRowCount: 1,
    autoSize: { columns: false, rows: false },
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
    isAnnotative: element.isAnnotative,
    layerId: element.layerId,
    regionIds: element.regionIds,
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
