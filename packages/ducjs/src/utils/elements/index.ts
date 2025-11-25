export * from "./newElement";
export * from "./freedrawElement";
export * from "./linearElement";
export * from "./textElement";
export * from "./frameElement";
export * from "./viewportElement";

import { LINE_SPACING_TYPE, TABLE_CELL_ALIGNMENT, TABLE_FLOW_DIRECTION } from "../../flatbuffers/duc";
import { Scope, RawValue } from "../../types";
import { _DucStackBase, _DucStackElementBase, DucElement, DucNonSelectionElement, DucStackLikeElement, DucTableColumn, DucTableElement, DucTableRow, DucTextContainer, DucTextElement, DucTextStyle, ElementConstructorOpts, ElementsMap, NonDeleted } from "../../types/elements";
import { isFreeDrawElement, isLinearElement } from "../../types/elements/typeChecks";
import { GeometricPoint, Percentage, Radian, ScaleFactor, TuplePoint } from "../../types/geometryTypes";
import { Mutable } from "../../types/utility-types";
import { getUpdatedTimestamp } from "..";
import { getElementAbsoluteCoords, getResizedElementAbsoluteCoords } from "../bounds";
import { DEFAULT_ELEMENT_PROPS, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_TEXT_ALIGN, DEFAULT_VERTICAL_ALIGN, FONT_FAMILY } from "../constants";
import { getBoundTextMaxWidth, getFontString, getTextElementPositionOffsets, measureText, wrapText } from "./textElement";
import { adjustXYWithRotation } from "../math";
import { randomInteger } from "../math/random";
import { normalizeText } from "../normalize";
import { getPrecisionValueFromRaw } from "../../technical/scopes";

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
    paperTextHeight: undefined,
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
  // Default structure
  const columnCount = 3;
  const headerRowCount = 1;
  const dataRowCount = 3; // header + 3 data rows
  const totalRows = headerRowCount + dataRowCount;

  const columnIds = Array.from({ length: columnCount }, (_, i) => `col${i + 1}`);
  const rowIds = Array.from({ length: totalRows }, (_, i) => `row${i + 1}`);

  // Spacing and sizing
  const hMargin = getPrecisionValueFromRaw(8 as RawValue, currentScope, currentScope);
  const vMargin = getPrecisionValueFromRaw(6 as RawValue, currentScope, currentScope);
  const defaultFontSize = getPrecisionValueFromRaw(
    DEFAULT_FONT_SIZE as RawValue,
    currentScope,
    currentScope
  );

  // Slightly taller header row for visual hierarchy
  const dataRowHeight = (defaultFontSize.value * 1.2) + (vMargin.value * 2);
  const headerRowHeight = (defaultFontSize.value * 1.4) + (vMargin.value * 2);

  // A practical starting column width
  const defaultColumnWidth = getPrecisionValueFromRaw(140 as RawValue, currentScope, currentScope);

  // Base/default styling for cells
  const baseCellStyle: DucTableElement["dataRowStyle"] = {
    stroke: [DEFAULT_ELEMENT_PROPS.stroke],
    background: [DEFAULT_ELEMENT_PROPS.background],
    roundness: DEFAULT_ELEMENT_PROPS.roundness,
    opacity: DEFAULT_ELEMENT_PROPS.opacity,
    textStyle: {
      isLtr: true,
      fontFamily: FONT_FAMILY.Virgil,
      bigFontFamily: "sans-serif",
      textAlign: DEFAULT_TEXT_ALIGN,
      verticalAlign: DEFAULT_VERTICAL_ALIGN,
      lineHeight: 1.2 as DucTextStyle["lineHeight"],
      lineSpacing: { type: LINE_SPACING_TYPE.MULTIPLE, value: 1.2 as ScaleFactor },
      obliqueAngle: 0 as Radian,
      fontSize: defaultFontSize,
      paperTextHeight: undefined,
      widthFactor: 1 as ScaleFactor,
      isUpsideDown: false,
      isBackwards: false,
    },
    margins: {
      top: vMargin,
      right: hMargin,
      bottom: vMargin,
      left: hMargin,
    },
    // Left + middle is a great general-purpose default for tables
    alignment: TABLE_CELL_ALIGNMENT.MIDDLE_LEFT,
  };

  // Create default columns
  const columns: Record<string, DucTableColumn> = Object.fromEntries(
    columnIds.map((id) => [id, { id, width: defaultColumnWidth }])
  );

  // Create default rows (taller header row)
  const rows: Record<string, DucTableRow> = Object.fromEntries(
    rowIds.map((id, idx) => [
      id,
      { 
        id, 
        height: idx < headerRowCount 
          ? getPrecisionValueFromRaw(headerRowHeight as RawValue, currentScope, currentScope)
          : getPrecisionValueFromRaw(dataRowHeight as RawValue, currentScope, currentScope)
      },
    ])
  );

  // Create default cells
  const cells: Record<string, DucTableElement["cells"][string]> = Object.create(null);

  // Friendly header labels via Markdown (bold)
  const headerLabels = ["Column A", "Column B", "Column C"];

  rowIds.forEach((rowId, rIdx) => {
    columnIds.forEach((colId, cIdx) => {
      const cellId = `${rowId}:${colId}`;
      const isHeaderRow = rIdx < headerRowCount;

      cells[cellId] = {
        rowId,
        columnId: colId,
        data: isHeaderRow ? `**${headerLabels[cIdx] ?? `Column ${cIdx + 1}` }**` : "",
        locked: false,
      };
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
    headerRowStyle: baseCellStyle,
    dataRowStyle: baseCellStyle,
    dataColumnStyle: baseCellStyle,
    headerRowCount,
    // Let rows grow to fit content; keep columns fixed unless user opts in
    autoSize: { columns: false, rows: true },
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
