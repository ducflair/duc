

export const TOLERANCE_DISPLAY = {
  NONE: 10,
  SYMMETRICAL: 11, // ±
  DEVIATION: 12, // +upper/-lower
  LIMITS: 13, // Upper/lower limits
  BASIC: 14, // Boxed dimension
} as const;

export const TEXT_PLACEMENT = {
  ABOVE_LINE: 10,
  CENTER_LINE: 11,
  BELOW_LINE: 12,
} as const;

export const TEXT_ALIGNMENT = {
  HORIZONTAL: 10,
  ALIGNED_WITH_DIMENSION: 11,
  ISO_STANDARD: 12,
} as const;

export const DIMENSION_TYPE = {
  LINEAR: 10,
  ALIGNED: 11,
  ANGULAR: 12,
  ARC_LENGTH: 13,
  RADIUS: 14,
  DIAMETER: 15,
  CENTER_MARK: 16,
  ROTATED: 17,
  SPACING: 18,
  CONTINUE: 19,
  BASELINE: 20,
  JOGGED_LINEAR: 21,
  ORDINATE: 22,
} as const;

export const DIMENSION_TEXT_POSITION = {
  ABOVE: 10,
  CENTERED: 11,
  BELOW: 12,
} as const;

export const DIMENSION_TEXT_ALIGNMENT = {
  HORIZONTAL: 10,
  ALIGNED: 11,
  ISO_STANDARD: 12,
} as const;

export const MARK_ELLIPSE_CENTER = {
  MARK: 10,
  LINE: 11,
} as const;

export type DimensionType = ValueOf<typeof DIMENSION_TYPE>;
export type DimensionTextPosition = ValueOf<typeof DIMENSION_TEXT_POSITION>;
export type DimensionTextAlignment = ValueOf<typeof DIMENSION_TEXT_ALIGNMENT>;
export type MarkEllipseCenter = ValueOf<typeof MARK_ELLIPSE_CENTER>;
export type ToleranceDisplay = ValueOf<typeof TOLERANCE_DISPLAY>;
export type TextPlacement = ValueOf<typeof TEXT_PLACEMENT>;
export type TextAlignment = ValueOf<typeof TEXT_ALIGNMENT>;

/**
 * Definition points vary by dimension type:
 * - LINEAR/ALIGNED: extLine1Origin, extLine2Origin, dimLineLocation
 * - ANGULAR: extLine1Origin (first leg), extLine2Origin (second leg), centerOrVertexPoint (vertex), dimLineLocation (point on dimension arc), arcOrLeaderPoint (another point on dimension arc if needed for complex angular dims)
 * - RADIUS/DIAMETER: centerOrVertexPoint (center), extLine1Origin (point on circle/arc), dimLineLocation (leader endpoint/jog), arcOrLeaderPoint (another point on leader/arc if needed)
 * - ARC_LENGTH: centerOrVertexPoint (center), extLine1Origin (start of arc), extLine2Origin (end of arc), dimLineLocation (point on dimension arc)
 * - ORDINATE: extLine1Origin (feature point), datumPoint (origin/datum)
 * - ROTATED: extLine1Origin, extLine2Origin, dimLineLocation (like LINEAR but at specific angle)
 */
export type DimensionDefinitionPoints = {
  /**
   * Origin point of the first extension line or primary feature point.
   * Required for: LINEAR, ALIGNED, ANGULAR, RADIUS, DIAMETER, ARC_LENGTH, ORDINATE, ROTATED
   */
  extLine1Origin?: GeometricPoint; // DXF DefPoint 1 (10)

  /**
   * Origin point of the second extension line or secondary feature point.
   * Required for: LINEAR, ALIGNED, ANGULAR, ARC_LENGTH, ORDINATE, ROTATED
   */
  extLine2Origin?: GeometricPoint; // DXF DefPoint 2 (11)

  /**
   * Point that defines the location of the dimension line itself.
   * For linear/aligned, this sets the offset of the dimension line.
   * For angular/radial/diameter, it often defines a point on the dimension arc/leader line,
   * determining its radius or curvature.
   * Required for: LINEAR, ALIGNED, ANGULAR, RADIUS, DIAMETER, ARC_LENGTH, ROTATED
   */
  dimLineLocation?: GeometricPoint; // DXF DefPoint 3 (12)

  /**
   * Center point (for radial/diameter/arc length dimensions) or vertex point (for angular dimensions).
   * Required for: ANGULAR, RADIUS, DIAMETER, ARC_LENGTH
   */
  centerOrVertexPoint?: GeometricPoint; // DXF DefPoint 4 (13)

  /**
   * Point on the dimension arc (for ANGULAR, RADIUS, DIAMETER, ARC_LENGTH)
   * that defines the arc's radius and placement, or a point through which the leader line passes.
   * Required for: ANGULAR, RADIUS, DIAMETER, ARC_LENGTH
   */
  arcOrLeaderPoint?: GeometricPoint; // DXF DefPoint 5 (14)

  /**
   * For ORDINATE dimensions: the datum/origin reference point.
   */
  datumPoint?: GeometricPoint;

  /**
   * For jogged dimensions: the jog vertex point.
   */
  jogPoint?: GeometricPoint;

  /**
   * Ellipse center marking configuration for definition points.
   * Each index corresponds to a definition point.
   */
  markEllipseCenter?: Array<MarkEllipseCenter | null>;
};


/**
 * Properties specific to baseline dimensions
 */
export type BaselineDimensionData = {
  /** ID of the base dimension this baselines from */
  baseDimensionId: string;
  /** Spacing between baseline dimensions */
  spacing: PrecisionValue;
  /** Index in the baseline chain (0 = first baseline) */
  baselineIndex: number;
};

/**
 * Properties specific to continued dimensions
 */
export type ContinueDimensionData = {
  /** ID of the dimension this continues from */
  continueDimensionId: string;
  /** Index in the continue chain (0 = first continue) */
  continueIndex: number;
};

/**
 * A dimension element composed of separate linear and text elements.
 * This provides maximum flexibility while reusing existing element types.
 */
export type _DucDimensionStyleProps = Exclude<DucDimensionStyle, "id" | "name" | "description">;
export type DucDimensionElement = _DucElementBase & _DucDimensionStyleProps & {
  type: "dimension";
  
  /** Type of dimension */
  dimensionType: DimensionType;

  /** The position where the dimension line should be placed */
  dimensionPosition: GeometricPoint;

  /** Core definition points that define what's being measured */
  definitionPoints: DimensionDefinitionPoints;

  /** References to the component elements that make up this dimension */
  components: {
    /** The dimension lines (arrows and dimension line) */
    dimensionLines: DucLinearElement[];
    
    /** The text element showing the measurement */
    dimensionText: DucTextElement;
    
    /** The extension lines */
    extensionLines: DucLinearElement[];
  };

  /** Visibility controls for dimension components */
  visibility: {
    dimensionLines: boolean;
    extensionLines: boolean;
    dimensionText: boolean;
    centerMarks: boolean;
  };

  /** Whether the text position has been manually overridden */
  textPositionOverridden: boolean;

  /** Whether the text content has been manually overridden */
  textContentOverride: boolean;

  /** Style overrides for this specific dimension */
  styleOverrides: DimensionStyleOverrides | null;

  /** Baseline dimension specific data */
  baselineData?: BaselineDimensionData;

  /** Continue dimension specific data */
  continueData?: ContinueDimensionData;

  /** Tolerance overrides for this specific dimension instance */
  tolerance?: {
    /** Override style default - disable tolerances */
    enabled?: boolean;
    
    /** Override display method */
    method?: ToleranceDisplay;
    
    /** Numeric tolerance values */
    values?: {
      upper: number;
      lower: number;
      precision?: number;
    };
    
    /** Custom text overrides (replaces calculated values) */
    customText?: string | {
      upper: string;
      lower: string;
    };
  };


  /** Calculated measurement value (read-only, computed from definition points) */
  readonly calculatedValue?: PrecisionValue;
};


export type DucDimensionStyles = {
  /** Default style for all dimensions */
  default: DucDimensionStyle;
  /** Style for linear dimensions */
  linear?: DucDimensionStyle;
  /** Style for angular dimensions */
  angular?: DucDimensionStyle;
  /** Style for radial dimensions */
  radial?: DucDimensionStyle;
  /** Style for diameter dimensions */
  diameter?: DucDimensionStyle;
  /** Style for ordinate dimensions */
  ordinate?: DucDimensionStyle;
  /** Style for leader dimensions */
  leader?: DucDimensionStyle;
};

/**
 * Comprehensive dimension style configuration
 * This represents all the properties that can be configured for dimension appearance
 */
export type DucDimensionStyle = {
  /** Unique identifier for this style */
  id: string;

  /** Human-readable name for the style */
  name: string;

  /** Description of the style */
  description?: string;

  symbols: {
    /** Arrowhead configuration */
    arrows: {
      /** Size of arrowheads */
      size: PrecisionValue;
      /** First arrowhead type */
      first: LineHead;
      /** Second arrowhead type */
      second: LineHead;
      /** Leader arrowhead type */
      leader: LineHead;
    };

    /** Center mark configuration for radial dimensions */
    centerMarks: {
      /** Type of center mark */
      type: MarkEllipseCenter;
      /** Size of center marks */
      size: PrecisionValue;
    };
  };

  dimensionLineStyle: _DucCommonStyleProps;
  extensionLineStyle: _DucCommonStyleProps;
  dimensionTextStyle: _DucTextStyleProps;

  /** Simple dimensional tolerances (not GD&T) */
  tolerancesStyle: {
    /** Whether to show tolerances by default */
    enabled: boolean;
    
    /** How to display the tolerance */
    method: ToleranceDisplay; // NONE, SYMMETRICAL, DEVIATION, LIMITS
    
    /** Default tolerance values */
    defaultUpper: number;
    defaultLower: number;
    
    /** Decimal places for tolerance display */
    precision: number;
    
    /** Text formatting - reference existing text style */
    textStyleId?: string; // Optional override for tolerance text style
  };

  fit: {
    /** How to handle text and arrows when space is limited */
    options: {
      /** What to move when text doesn't fit */
      textFit: "text_and_arrows" | "arrows_only" | "text_only" | "either" | "always_keep_text";
      /** Whether to place arrows inside extension lines when they fit */
      arrowsInside: boolean;
      /** Whether to place text inside extension lines when it fits */
      textInside: boolean;
      /** Suppress arrows when they don't fit */
      suppressArrows: boolean;
    };

    /** Text placement when it doesn't fit between extension lines */
    textMovement: {
      /** Where to place text when it doesn't fit */
      placement: "beside_dimension_line" | "over_dimension_line" | "over_dimension_line_with_leader";
      /** Use leader when text is moved */
      useLeader: boolean;
    };
  };
};