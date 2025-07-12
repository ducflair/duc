import { ElementBackground } from "./types";

export type DimensionUnitsFormat = ValueOf<typeof DIMENSION_UNITS_FORMAT>;
export type AngularUnitsFormat = ValueOf<typeof ANGULAR_UNITS_FORMAT>;
export type DecimalSeparator = ValueOf<typeof DECIMAL_SEPARATOR>;

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

  /** Human-readable name */
  name: string;

  /** Description of the standard */
  description?: string;

  /** Version of the standard */
  version?: string;

  /** Whether this is a built-in standard (read-only) */
  readonly: boolean;

  dashSpacingScale: ScaleFactor;
  isDashSpacingAffectedByViewportScale: boolean;

  /** Override stroke width for all elements projected to this standard */
  elementsStrokeWidthOverride: PrecisionValue;

  commonStyles: DucCommonStyle[];
  stackLikeStyles: DucStackLikeStyle[];
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