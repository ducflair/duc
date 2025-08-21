import { ANGULAR_UNITS_FORMAT, DECIMAL_SEPARATOR, DIMENSION_UNITS_FORMAT } from "ducjs/flatbuffers/duc";
import { UnitSystem } from "ducjs/technical/scopes";
import { DucCommonStyle, DucDimensionStyle, DucDocStyle, DucFeatureControlFrameStyle, DucHatchStyle, DucLeaderStyle, DucPlotElement, DucStackLikeStyles, DucTableStyle, DucTextStyle, DucUcs, DucView, DucViewportStyle, DucXRayStyle, GridSettings, Identifier, PrecisionValue, ScaleFactor, Scope, SnapSettings, StrokeStyle } from "ducjs/types";
import { ValueOf } from "ducjs/types/utility-types";


export const PREDEFINED_STANDARDS = {
  DUC: "duc", // DUC (default)
  ISO_25300: "iso-25300-2013", // International Organization for Standardization
  ANSI_Y14_5: "ansi-y14.5-2018", // American National Standards Institute
  DIN_406: "din-406-2017", // German Institute for Standardization
  JIS_B0001: "jis-b0001-2019", // Japanese Industrial Standards
  BS_8888: "bs-8888-2020", // British Standards Institution
  ABNT: "abnt",   // Brazilian Association of Technical Standards
  GB: "gb",     // Chinese National Standards
} as const;

/**
 * The Standard for the given technical design
 * https://en.wikipedia.org/wiki/List_of_technical_standard_organizations
 */
export type Standard = Identifier & {
  /** Version of the standard */
  version: string;
  /** Whether this is a built-in standard (read-only) */
  readonly: boolean;

  /** Overrides for all elements projected to this standard */
  overrides: StandardOverrides | null;

  /** Styles */
  styles: StandardStyles | null;

  /** Views and canvas interaction settings */
  viewSettings: StandardViewSettings | null;

  /** Units */
  units: StandardUnits | null;

  /** Validation rules */
  validation: StandardValidation | null;
};


export type DimensionUnitsFormat = ValueOf<typeof DIMENSION_UNITS_FORMAT>;
export type AngularUnitsFormat = ValueOf<typeof ANGULAR_UNITS_FORMAT>;
export type DecimalSeparator = ValueOf<typeof DECIMAL_SEPARATOR>;

export type _UnitSystemBase<T extends AngularUnitsFormat | DimensionUnitsFormat> = {
  /** Unit format */
  format: T;
  /** Unit system */
  system: UnitSystem;
  /** Precision (decimal places) */
  precision: number;
  /** Suppress leading zeros */
  suppressLeadingZeros: boolean;
  /** Suppress trailing zeros */
  suppressTrailingZeros: boolean;
}


export type StandardUnits = {
  primaryUnits: {
    /** Linear units */
    linear: _UnitSystemBase<DimensionUnitsFormat> & {
      /** Decimal separator character */
      decimalSeparator: DecimalSeparator;
      /** Suppress zero feet */
      suppressZeroFeet: boolean;
      /** Suppress zero inches */
      suppressZeroInches: boolean;
    };

    /** Angular units */
    angular: _UnitSystemBase<AngularUnitsFormat>;
  };

  alternateUnits: _UnitSystemBase<DimensionUnitsFormat> & {
    /** Whether to display alternate units */
    isVisible: boolean;
    /** Multiplier for alternate units */
    multiplier: number;
  };
}


export type StandardOverrides = {
  mainScope?: Scope;
  elementsStrokeWidthOverride?: PrecisionValue;
  commonStyleId?: Identifier["id"];
  stackLikeStyleId?: Identifier["id"];
  textStyleId?: Identifier["id"];
  dimensionStyleId?: Identifier["id"];
  leaderStyleId?: Identifier["id"];
  featureControlFrameStyleId?: Identifier["id"];
  tableStyleId?: Identifier["id"];
  docStyleId?: Identifier["id"];
  viewportStyleId?: Identifier["id"];
  plotStyleId?: Identifier["id"];
  hatchStyleId?: Identifier["id"];
  activeGridSettingsId?: Identifier["id"][];
  activeSnapSettingsId?: Identifier["id"];
  dashLineOverride?: StrokeStyle["dashLineOverride"];
  /** Default precision for various dimension types */
  unitPrecision?: {
    linear?: number;
    angular?: number;
    area?: number;
    volume?: number;
  };
};

export type StandardStyles = {
  commonStyles: Array<Identifier & DucCommonStyle>;
  stackLikeStyles: Array<Identifier & DucStackLikeStyles>;
  textStyles: Array<Identifier & DucTextStyle>;
  dimensionStyles: Array<Identifier & DucDimensionStyle>;
  leaderStyles: Array<Identifier & DucLeaderStyle>;
  featureControlFrameStyles: Array<Identifier & DucFeatureControlFrameStyle>;
  tableStyles: Array<Identifier & DucTableStyle>;
  docStyles: Array<Identifier & DucDocStyle>;
  viewportStyles: Array<Identifier & DucViewportStyle>;
  hatchStyles: Array<Identifier & DucHatchStyle>;
  xrayStyles: Array<Identifier & DucXRayStyle>;
}

export type StandardViewSettings = {
  views: Array<Identifier & DucView>;
  ucs: Array<Identifier & DucUcs>;
  gridSettings: Array<Identifier & GridSettings>;
  snapSettings: Array<Identifier & SnapSettings>;
}


export type StandardValidation = {
  dimensionRules?: {
    minTextHeight?: PrecisionValue;
    maxTextHeight?: PrecisionValue;
    allowedPrecisions?: number[];
  };
  layerRules?: {
    prohibitedLayerNames?: string[];
  };
}