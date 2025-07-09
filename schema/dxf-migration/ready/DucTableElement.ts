import { ElementStroke } from "./types";




export type TableCellAlignment = ValueOf<typeof TABLE_CELL_ALIGNMENT>;
export type TableFlowDirection = ValueOf<typeof TABLE_FLOW_DIRECTION>;
export type CellMargins = {
  top: PrecisionValue;
  right: PrecisionValue;
  bottom: PrecisionValue;
  left: PrecisionValue;
};

export type DucTableColumn = {
  id: string;
  width: PrecisionValue;
  /** Whether column width auto-adjusts to content */
  autoWidth: boolean;
  /** Minimum width for auto-sizing */
  minWidth?: PrecisionValue;
  /** Maximum width for auto-sizing */
  maxWidth?: PrecisionValue;
  /** Style overrides for this column */
  styleOverrides?: Partial<DucTableStyle>;
};

export type DucTableRow = {
  id: string;
  height: PrecisionValue;
  /** Whether row height auto-adjusts to content */
  autoHeight: boolean;
  /** Minimum height for auto-sizing */
  minHeight?: PrecisionValue;
  /** Style overrides for this row */
  styleOverrides?: Partial<DucTableStyle>;
};

export type DucTableCell = {
  rowId: string;
  columnId: string;
  
  data: string; // Markdown string with text styling and potential wildcards (@)
  
  /** 
   * Cell spanning 
   * Useful in case the user wants to merge cells
   * */
  span: {
    /** Number of columns this cell spans */
    columns: number;
    /** Number of rows this cell spans */
    rows: number;
  };
  
  /** Cell alignment */
  alignment: TableCellAlignment;
  
  /** Cell margins */
  margins: CellMargins;
  
  /** Whether cell is locked for editing */
  locked: boolean;
  
  /** Style overrides for this cell */
  styleOverrides?: Partial<DucTableStyle>;
};

export type DucTableStyle = {
  id: string;
  name: string;
  description?: string;
  
  background: ElementBackground;
  stroke: ElementStroke;
  textStyle: _DucTableStyleProps

 
  defaultRow?: {
    height: PrecisionValue;
    autoHeight: boolean;
    minHeight?: PrecisionValue;
    maxHeight?: PrecisionValue;
  }

  defaultColumn?: {
    width: PrecisionValue;
    autoWidth: boolean;
    minWidth?: PrecisionValue;
    maxWidth?: PrecisionValue;
  }
  
  /** Default cell properties */
  defaultCell?: {
    margins: CellMargins;
    alignment: TableCellAlignment;
    stroke: ElementStroke;
    background: ElementBackground;
  };
  
  /** Table-wide properties */
  table: {
    flowDirection: TableFlowDirection;
    horizontalMargin: PrecisionValue;
    verticalMargin: PrecisionValue;
  };
};

export type _DucTableStyleProps = Exclude<DucTableStyle, "id" | "name" | "description">;

export type DucTableElement = _DucElementBase & _DucTableStyleProps & {
  type: "table";
  
  columnOrder: string[];
  rowOrder: string[];
  columns: Record<string, DucTableColumn>;
  rows: Record<string, DucTableRow>;
  cells: Record<string, DucTableCell>; // "rowId:colId" format
  
  /** Whether table auto-sizes to content */
  autoSize: {
    columns: boolean;
    rows: boolean;
  };
};
