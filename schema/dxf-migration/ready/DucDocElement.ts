export type TextFlowDirection = ValueOf<typeof TEXT_FLOW_DIRECTION>;
export type ColumnType = ValueOf<typeof COLUMN_TYPE>;

export type TextColumn = {
  /** Column width */
  width: PrecisionValue;
  /** Gap between this and next column */
  gutter: PrecisionValue;
  /** Column height (for static columns) */
  height?: PrecisionValue;
};



export type TextFormatSpan = {
  /** Start position in content string */
  start: number;
  /** End position in content string */
  end: number;
  /** Formatting properties */
  format: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    color?: string;
    font?: string;
    size?: PrecisionValue;
    backgroundHighlight?: string;
  };
};

export type TextHyperlink = {
  /** Start position in content string */
  start: number;
  /** End position in content string */
  end: number;
  /** URL or reference */
  url: string;
  /** Display text (if different from content) */
  displayText?: string;
  /** Tooltip text */
  tooltip?: string;
};

export type TextTable = {
  /** Position in content where table is inserted */
  position: number;
  /** Table structure */
  structure: {
    rows: number;
    columns: number;
    /** Cell content (markdown) */
    cells: string[][];
    /** Column widths */
    columnWidths: PrecisionValue[];
    /** Row heights */
    rowHeights: PrecisionValue[];
  };
  /** Table styling */
  style: {
    borderColor: string;
    borderWeight: PrecisionValue;
    cellPadding: PrecisionValue;
    headerStyle?: {
      backgroundColor: string;
      textColor: string;
      bold: boolean;
    };
  };
};

/**
 * Rich text/document style 
 */
export type DucDocStyle = _DucBaseTextStyle & {

  // === ADVANCED LINE SPACING ===
  lineSpacing: {
    /** Line spacing factor (extends base lineSpacingFactor) */
    factor: number;
    /** Spacing type */
    type: "at_least" | "exactly" | "multiple";
  };

  // === PARAGRAPH FORMATTING ===
  paragraph: {
    firstLineIndent: PrecisionValue;
    hangingIndent: PrecisionValue;
    leftIndent: PrecisionValue;
    rightIndent: PrecisionValue;
    spaceBefore: PrecisionValue;
    spaceAfter: PrecisionValue;
    tabStops: PrecisionValue[];
  };

  // === COLUMN SETTINGS ===
  columns: {
    defaultCount: number;
    defaultGutterWidth: PrecisionValue;
    autoHeight: boolean;
  };

  // === STACK/FRACTION FORMATTING ===
  stackFormat: {
    /** Enable automatic stacking */
    autoStack: boolean;
    /** Stack characters (e.g., "/", "#", "^") */
    stackChars: string[];
    /** Stack properties */
    properties: {
      /** Upper text scale */
      upperScale: number;
      /** Lower text scale */
      lowerScale: number;
      /** Stack text height */
      textHeight: number;
    };
  };
};

export type _DucDocStyleProps = Exclude<DucDocStyle, "id" | "name" | "description">;
export type DucDocElement = _DucElementBase & _DucDocStyleProps & {
  type: "doc";

  /** 
   * Enhanced markdown content with MTEXT formatting support
   * Supports: **bold**, *italic*, __underline__, ~~strikethrough~~
   * Colors: {color:red}text{/color}
   * Fonts: {font:Arial}text{/font}
   * Sizes: {size:12}text{/size}
   * Special chars: %%d (degree), %%p (plus/minus), etc.
   * Fields: {@fieldname} for dynamic content
   * Hyperlinks: [text](url)
   * Lists and tables via standard markdown
   */
  content: string;

  /** Text flow direction */
  flowDirection: TextFlowDirection;

  /** Reading order for bidirectional text */
  readingOrder: "ltr" | "rtl" | "context";

  /** Column configuration (structural only) */
  columns: {
    /** Column type */
    type: ColumnType;
    /** Number of columns (for static/dynamic) */
    count: number;
    /** Auto height for dynamic columns */
    autoHeight: boolean;
    /** Column definitions (structural) */
    definitions: TextColumn[];
  };

  /**
   * Text sizing behavior:
   * - `true`: Width adjusts to fit text content (single line or natural wrapping)
   * - `false`: Text wraps to fit within the element's fixed width
   * @default true
   */
  autoResize: boolean;

  /** Calculated properties (read-only, computed from content) */
  readonly calculated?: {
    /** Actual text bounds after formatting */
    textBounds: {
      width: PrecisionValue;
      height: PrecisionValue;
    };
    /** Number of lines */
    lineCount: number;
    /** Character count */
    characterCount: number;
    /** Word count */
    wordCount: number;
  };
};