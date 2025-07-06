import { ElementBackground } from "./types";

export const STANDARD_TYPE = {
  ISO: "ISO",
  ANSI: "ANSI",
  DIN: "DIN",
  JIS: "JIS",
  BS: "BS", // British Standard
  ASME: "ASME",
  CUSTOM: "CUSTOM",
} as const;


export const DIMENSION_UNITS_FORMAT = {
  DECIMAL: 10,
  ENGINEERING: 11, // Feet and decimal inches
  ARCHITECTURAL: 12, // Feet and fractional inches
  FRACTIONAL: 13, // Fractional inches
  SCIENTIFIC: 14,
} as const;

export const ANGULAR_UNITS_FORMAT = {
  DECIMAL_DEGREES: 10,
  DEGREES_MINUTES_SECONDS: 11,
  GRADS: 12,
  RADIANS: 13,
  SURVEYOR: 14,
} as const;

export const DECIMAL_SEPARATOR = {
  DOT: ".",
  COMMA: ",",
} as const;


export type DimensionUnitsFormat = ValueOf<typeof DIMENSION_UNITS_FORMAT>;
export type AngularUnitsFormat = ValueOf<typeof ANGULAR_UNITS_FORMAT>;
export type DecimalSeparator = ValueOf<typeof DECIMAL_SEPARATOR>;
export type StandardType = ValueOf<typeof STANDARD_TYPE>;

export type DucCommonStyle = {
  id: string;
  name: string;
  description?: string;
  background: ElementBackground;
  stroke: ElementBackground;
}
export type _DucCommonStyleProps = Exclude<DucCommonStyle, "id" | "name" | "description">;

/**
 * A standard contains multiple styles and configuration presets
 */
export type DucStandard = {
  /** Unique identifier for this standard */
  id: string;

  /** Standard type */
  type: StandardType;

  /** Human-readable name */
  name: string;

  /** Description of the standard */
  description?: string;

  /** Version of the standard */
  version?: string;

  /** Whether this is a built-in standard (read-only) */
  readonly: boolean;

  commonStyles: DucCommonStyle[];
  textStyles: DucTextStyle[];
  dimensionStyles: DucDimensionStyles[];
  leaderStyles: DucLeaderStyle[];
  featureControlFrameStyles: DucFeatureControlFrameStyle[];
  tableStyles: DucTableStyle[];
  docStyles: DucDocStyle[];
  viewportStyles: DucViewportStyle[];
  plotStyles: DucPlotStyle[];
  hatchStyles: DucHatchStyle[];

  views: DucView[];
  ucs: DucUcs[];

  gridSettings: GridSettings[];
  /**
   * Global snap and object snap settings for the drawing.
   */
  snapSettings: SnapSettings;

  /** Default measurement units for this standard */
  defaultMainScope: Scope;

  primaryUnits: {
    /** Linear units */
    linear: {
      /** Unit format */
      format: DimensionUnitsFormat;
      /** Precision (decimal places) */
      precision: number;
      /** Decimal separator character */
      decimalSeparator: DecimalSeparator;
      /** Rounding value */
      rounding: number;
      /** Prefix text */
      prefix: string;
      /** Suffix text */
      suffix: string;
      /** Scale factor */
      scaleFactor: number;
      /** Suppress leading zeros */
      suppressLeadingZeros: boolean;
      /** Suppress trailing zeros */
      suppressTrailingZeros: boolean;
      /** Suppress zero feet */
      suppressZeroFeet: boolean;
      /** Suppress zero inches */
      suppressZeroInches: boolean;
    };

    /** Angular units */
    angular: {
      /** Angular unit format */
      format: AngularUnitsFormat;
      /** Precision */
      precision: number;
      /** Suppress leading zeros */
      suppressLeadingZeros: boolean;
      /** Suppress trailing zeros */
      suppressTrailingZeros: boolean;
    };
  };

  alternateUnits: {
    /** Whether to display alternate units */
    display: boolean;
    /** Unit format for alternate units */
    format: DimensionUnitsFormat;
    /** Precision for alternate units */
    precision: number;
    /** Multiplier for alternate units */
    multiplier: number;
    /** Rounding for alternate units */
    rounding: number;
    /** Prefix for alternate units */
    prefix: string;
    /** Suffix for alternate units */
    suffix: string;
    /** Suppress leading zeros in alternate units */
    suppressLeadingZeros: boolean;
    /** Suppress trailing zeros in alternate units */
    suppressTrailingZeros: boolean;
  };

  /** Default precision for various dimension types */
  defaultPrecision: {
    linear: number;
    angular: number;
    area: number;
    volume: number;
  };

  validation: {
    dimensionRules?: {
      minTextHeight?: number;
      maxTextHeight?: number;
      allowedPrecisions?: number[];
    };
    layerRules?: {
      requiredLayers?: string[];
      prohibitedLayerNames?: string[];
    };
  } | null; 

  /** Standard-specific configuration */
  configuration: {
    /** Whether dimensions are associative by default */
    associativeByDefault: boolean;
    /** Whether to use annotative scaling */
    useAnnotativeScaling: boolean;
    /** Fill mode for hatches and wide polylines */
    fillMode: boolean;
    /** Character encoding */
    codepage: string;
  };

  /** Creation and modification metadata */
  metadata: {
    /** When this standard was created */
    createdAt: number;
    /** When this standard was last modified */
    modifiedAt: number;
    /** Who created this standard */
    createdBy?: string;
    /** Who last modified this standard */
    modifiedBy?: string;
  };
};

/**
 * Collection of all available standards in the system
 */
export type DucStandardsLibrary = {
  /** All available standards by ID */
  standards: Record<string, DucStandard>;

  /** Currently active standard ID */
  activeStandardId: string;

  /** Recently used standards */
  recentStandardIds: string[];
};

// Example of predefined standards
export const PREDEFINED_STANDARDS = {
  ISO_25300: "iso-25300-2013",
  ANSI_Y14_5: "ansi-y14.5-2018",
  DIN_406: "din-406-2017",
  JIS_B0001: "jis-b0001-2019",
  BS_8888: "bs-8888-2020",
} as const;