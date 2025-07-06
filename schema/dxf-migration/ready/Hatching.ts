import {
  _DucElementBase,
  DucPoint,
  Percentage,
  PrecisionValue,
  Radian,
  ValueOf,
  ElementBackground,
  ElementStroke,
} from "./types";
import { DucLinearElement } from "./DucLinearElement";

export const HATCH_PATTERN_TYPE = {
  PREDEFINED: 10,
  USER_DEFINED: 11,
  CUSTOM: 12,
  SOLID: 13,
} as const;

export const HATCH_STYLE = {
  NORMAL: 10,    // Normal hatch
  OUTER: 11,     // Outermost boundary only
  IGNORE: 12,    // Ignore internal structures
} as const;

export const PREDEFINED_HATCH_PATTERNS = {
  // Solid Fill
  SOLID: "SOLID",

  // ANSI Patterns
  ANSI31: "ANSI31", // General crosshatch
  ANSI32: "ANSI32", // Steel
  ANSI33: "ANSI33", // Bronze, brass, copper
  ANSI34: "ANSI34", // Plastic, rubber
  ANSI35: "ANSI35", // Thermal insulation
  ANSI36: "ANSI36", // Steel, cast iron
  ANSI37: "ANSI37", // Aluminum
  ANSI38: "ANSI38", // Lead, zinc, magnesium

  // Architectural Patterns
  AR_B816: "AR-B816",   // Brick
  AR_B816C: "AR-B816C", // Brick common
  AR_CONC: "AR-CONC",   // Concrete
  AR_HBONE: "AR-HBONE", // Herringbone
  AR_SAND: "AR-SAND",   // Sand
  AR_RSHKE: "AR-RSHKE", // Roof shingles

  // ISO Patterns
  ACAD_ISO02W100: "ACAD_ISO02W100", // Insulation
  ACAD_ISO03W100: "ACAD_ISO03W100", // General crosshatch
  ACAD_ISO04W100: "ACAD_ISO04W100", // Concrete
  ACAD_ISO06W100: "ACAD_ISO06W100", // Cast iron
  ACAD_ISO08W100: "ACAD_ISO08W100", // Copper/brass
  ACAD_ISO11W100: "ACAD_ISO11W100", // Steel
  ACAD_ISO13W100: "ACAD_ISO13W100", // Plastic

  // Common Patterns
  BOX: "BOX",
  BRICK: "BRICK",
  CROSS: "CROSS",
  DASH: "DASH",
  DOTS: "DOTS",
  EARTH: "EARTH",
  GRASS: "GRASS",
  GRAVEL: "GRAVEL",
  HEX: "HEX",
  HONEY: "HONEY",
  INSUL: "INSUL",
  LINE: "LINE",
  NET: "NET",
  SQUARE: "SQUARE",
  STEEL: "STEEL",
  TRIANG: "TRIANG",
  ZIGZAG: "ZIGZAG",
} as const;

export type HatchPatternType = ValueOf<typeof HATCH_PATTERN_TYPE>;
export type HatchStyle = ValueOf<typeof HATCH_STYLE>;
export type PredefinedHatchPattern = ValueOf<typeof PREDEFINED_HATCH_PATTERNS>;

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

  patternType: HatchPatternType;
  
  /** Default hatch style */
  hatchStyle: HatchStyle;
  
  /** Default pattern properties */
  pattern: {
    /** Pattern name (for predefined) or reference to custom pattern */
    name: PredefinedHatchPattern | string;
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


/**
 * Default hatch styles
 */
export const DEFAULT_HATCH_STYLE: DucHatchStyle = {
  id: "default-hatch",
  name: "Default Hatch",
  background: {
    content: {
      preference: "color",
      src: "#000000",
      visible: true,
      opacity: 1,
    }
  },
  stroke: {
    content: {
      preference: "color", 
      src: "#000000",
      visible: true,
      opacity: 1,
    },
    width: { value: 1, scoped: 1 },
    style: {
      preference: "solid",
      scale: 1,
    },
    placement: "center",
  },
  patternType: HATCH_PATTERN_TYPE.PREDEFINED,
  hatchStyle: HATCH_STYLE.NORMAL,
  pattern: {
    name: "ANSI31",
    scale: 1,
    angle: 0,
    origin: { x: 0, y: 0 },
    double: false,
  },
};