

export type HatchStyle = ValueOf<typeof HATCH_STYLE>;

/**
 * Pattern line definition for custom hatch patterns
 */
export type HatchPatternLine = {
  /** Line angle in radians */
  angle: Radian;
  /** Line origin point */
  origin: DucPoint;
  /** Offset between parallel lines [x, y] */
  offset: [PrecisionValue, PrecisionValue];
  /** Dash pattern (empty array = solid line) */
  dashPattern: PrecisionValue[];
};

/**
 * Custom hatch pattern definition
 */
export type CustomHatchPattern = {
  /** Pattern name */
  name: string;
  /** Pattern description */
  description?: string;
  /** Pattern line definitions */
  lines: HatchPatternLine[];
};

/**
 * Hatch style configuration
 */
export type DucHatchStyle = {
  id: string;
  name: string;
  description?: string;
  
  background: ElementBackground;
  stroke: ElementStroke;
  
  /** Default hatch style */
  hatchStyle: HatchStyle;
  
  /** Default pattern properties */
  pattern: {
    /** Pattern name (for predefined) or reference to custom pattern */
    name: string;
    /** Pattern scale factor */
    scale: number;
    /** Pattern rotation angle */
    angle: Radian;
    /** Pattern origin point */
    origin: DucPoint;
    /** Double pattern (second pattern at 90 degrees) */
    double: boolean;
  };

  customPattern?: CustomHatchPattern;
};

export type _DucHatchStyleProps = Exclude<DucHatchStyle, "id" | "name" | "description">;
/**
 * Hatch element
 */
export type DucHatchElement = _DucElementBase & _DucHatchStyleProps & {
  type: "hatch";
  
  /** Calculated hatch area (read-only) */
  readonly calculated?: {
    area: PrecisionValue;
    perimeter: PrecisionValue;
  };
};

