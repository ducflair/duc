export const GD_T_SYMBOL = {
  // Form tolerances
  STRAIGHTNESS: "⏤",
  FLATNESS: "⏥", 
  CIRCULARITY: "○",
  CYLINDRICITY: "⌭",
  
  // Orientation tolerances  
  PERPENDICULARITY: "⊥",
  ANGULARITY: "∠",
  PARALLELISM: "∥",
  
  // Location tolerances
  POSITION: "⌖",
  TRUE_POSITION: "⌖", // Alternative name
  CONCENTRICITY: "◎",
  COAXIALITY: "◯", // Different from concentricity in some standards
  SYMMETRY: "⌯",
  
  // Runout tolerances
  CIRCULAR_RUNOUT: "↗",
  TOTAL_RUNOUT: "↗↗",
  
  // Profile tolerances
  PROFILE_OF_LINE: "⌒",
  PROFILE_OF_SURFACE: "⌓",
  
  // Special symbols
  STATISTICAL: "◊",
  ALL_AROUND: "⭕",
  ALL_OVER: "🔄",
  BETWEEN: "↔",
} as const;

export const MATERIAL_CONDITION = {
  MAXIMUM: "Ⓜ", // MMC - Maximum Material Condition
  LEAST: "Ⓛ", // LMC - Least Material Condition
  REGARDLESS: "Ⓢ", // RFS - Regardless of Feature Size (often omitted)
} as const;

export const FEATURE_MODIFIER = {
  FREE_STATE: "Ⓕ",
  TANGENT_PLANE: "Ⓣ",
  PROJECTED_TOLERANCE_ZONE: "Ⓟ",
  DIAMETER: "⌀",
  SPHERICAL_DIAMETER: "S⌀",
  RADIUS: "R",
  SPHERICAL_RADIUS: "SR",
  CONTROLLED_RADIUS: "CR",
  SQUARE: "□",
  TRANSLATION: "⧗", // Translation modifier for position
  ALL_AROUND: "⭕", // Can be used as modifier too
  ALL_OVER: "🔄", // Can be used as modifier too
  STATISTICAL: "◊", // Can be used as modifier
  CONTINUOUS_FEATURE: "CF", // Continuous feature
  UNEQUALLY_DISPOSED: "UEQ", // Unequally disposed tolerance
} as const;

export const TOLERANCE_ZONE_TYPE = {
  CYLINDRICAL: "cylindrical",
  SPHERICAL: "spherical", 
  RECTANGULAR: "rectangular",
  LINEAR: "linear",
  CIRCULAR: "circular",
} as const;

export const DATUM_TARGET_TYPE = {
  POINT: "point",
  LINE: "line", 
  AREA: "area",
  MOVABLE: "movable",
} as const;

export const TOLERANCE_TYPE = {
  SINGLE: "single", // Single tolerance specification
  COMPOSITE: "composite", // Composite tolerance (multiple rows, related)
  MULTIPLE: "multiple", // Multiple single-segment tolerances (independent)
} as const;

export const DATUM_BRACKET_STYLE = {
  SQUARE: "square",
  ROUND: "round",
  NONE: "none",
} as const;

export type GDTSymbol = ValueOf<typeof GD_T_SYMBOL>;
export type MaterialCondition = ValueOf<typeof MATERIAL_CONDITION>;
export type FeatureModifier = ValueOf<typeof FEATURE_MODIFIER>;
export type ToleranceZoneType = ValueOf<typeof TOLERANCE_ZONE_TYPE>;
export type DatumTargetType = ValueOf<typeof DATUM_TARGET_TYPE>;
export type ToleranceType = ValueOf<typeof TOLERANCE_TYPE>;
export type DatumBracketStyle = ValueOf<typeof DATUM_BRACKET_STYLE>;

export type DatumTarget = {
  /** Target type */
  type: DatumTargetType;
  /** Target identifier (e.g., "A1", "B2") */
  identifier: string;
  /** Target size (for area targets) */
  size?: number;
  /** Target location specification */
  location?: string;
};

export type DatumReference = {
  /** Datum letter(s) - can be combined like "A-B" or "A|B" */
  letters: string;
  /** Material condition modifier */
  modifier?: MaterialCondition;
  /** Datum targets associated with this reference */
  targets?: DatumTarget[];
  /** Sequence/priority in datum reference frame (0-based) */
  sequence: number;
  /** Translation constraint for movable datums */
  translation?: {
    enabled: boolean;
    value?: string;
  };
};

export type ToleranceSpecification = {
  /** Primary tolerance value */
  value: string;
  
  /** Material condition modifier for the tolerance */
  materialCondition?: MaterialCondition;
  
  /** Feature modifiers that apply to this tolerance */
  featureModifiers: FeatureModifier[];
  
  /** Whether this is a statistical tolerance */
  statistical?: boolean;
  
  /** For unequally disposed tolerances */
  unequally?: {
    upper: string;
    lower: string;
  };
  
  /** Tolerance zone specification */
  zone?: {
    type: ToleranceZoneType;
    /** Additional zone specifications */
    specifications?: string[];
  };
  
  /** For composite tolerances - secondary tolerance value */
  compositeValue?: string;
  
  /** Custom tolerance text (for special cases) */
  customText?: string;
};

export type FeatureControlFrameSegment = {
  /** The geometric tolerance symbol */
  symbol: GDTSymbol;
  
  /** Tolerance specification */
  tolerance: ToleranceSpecification;
  
  /** Datum reference system */
  datumSystem: {
    /** Primary datum */
    primary?: DatumReference;
    /** Secondary datum */
    secondary?: DatumReference;
    /** Tertiary datum */
    tertiary?: DatumReference;
    /** Additional datum references beyond tertiary */
    additional?: DatumReference[];
  };
  
  /** Segment-level modifiers */
  modifiers?: {
    /** All around symbol */
    allAround?: boolean;
    /** All over symbol */
    allOver?: boolean;
    /** Between symbol */
    between?: boolean;
    /** Free state */
    freeState?: boolean;
    /** Tangent plane */
    tangentPlane?: boolean;
    /** Projected tolerance zone */
    projectedToleranceZone?: boolean;
  };
  
  /** Row index for composite tolerances */
  rowIndex?: number;
  
  /** Custom segment content for special cases */
  customContent?: string;
};

export type FeatureControlFrameRow = {
  /** Segments in this row */
  segments: FeatureControlFrameSegment[];
  
  /** Row-specific properties */
  rowProperties?: {
    /** Height multiplier for this row */
    heightMultiplier?: number;
    /** Vertical alignment within the row */
    verticalAlignment?: "top" | "center" | "bottom";
  };
};

export type DucFeatureControlFrameStyle = {
  id: string;
  name: string;
  description?: string;
  
  background: ElementBackground;
  stroke: ElementStroke;
  textStyle: _DucBaseTextStyle;
  
  /** Layout and spacing */
  layout: {
    /** Spacing between segments horizontally */
    segmentSpacing: PrecisionValue;
    /** Spacing between rows vertically */
    rowSpacing: PrecisionValue;
    /** Spacing between symbol and tolerance */
    symbolSpacing: PrecisionValue;
    /** Spacing between tolerance and datum */
    datumSpacing: PrecisionValue;
    /** Minimum segment width */
    minSegmentWidth: PrecisionValue;
    /** Minimum frame height */
    minFrameHeight: PrecisionValue;
    /** Internal padding */
    padding: PrecisionValue;
  };
  
  /** Symbol configuration */
  symbols: {
    /** Scale factor for GD&T symbols relative to text height */
    scale: number;
    /** Whether to use alternative symbol representations */
    useAlternativeSymbols: boolean;
    /** Symbol font family (if different from text) */
    symbolFontFamily?: string;
  };
  
  /** Datum reference styling */
  datumStyle: {
    /** Bracket style for datum letters */
    bracketStyle: DatumBracketStyle;
    /** Spacing around datum letters */
    letterSpacing: PrecisionValue;
  };
};

export type _DucFeatureControlFrameStyleProps = Exclude<DucFeatureControlFrameStyle, "id" | "name" | "description">;
export type DucFeatureControlFrameElement = _DucElementBase & _DucFeatureControlFrameStyleProps & {
  type: "featurecontrolframe";
  
  /** Type of tolerance frame */
  toleranceType: ToleranceType;
  
  /** Rows of tolerance specifications */
  rows: FeatureControlFrameRow[];
  
  /** Frame-level modifiers */
  frameModifiers?: {
    /** All around the entire frame */
    allAround?: boolean;
    /** All over the entire frame */
    allOver?: boolean;
    /** Continuous feature */
    continuousFeature?: boolean;
  };
  

  
  /** Integration with your existing Leader system */
  leader?: {
    /** Reference to the leader element that points to this FCF */
    leaderId: DucLeaderElement["id"];
    /** How this FCF relates to the leader */
    relationship: "content" | "target";
    /** 
     * If relationship is "content": this FCF is the content of the leader
     * If relationship is "target": this FCF is what the leader points to
     */
  };
  
  /** Direct binding to the feature being controlled (when not using leader) */
  featureBinding?: DucPointBinding;
  
  /** Associated datum features (for datum definition frames) */
  datumFeatures?: {
    /** Datum letter this frame defines */
    datumLetter: string;
    /** Associated feature elements */
    featureElementIds: string[];
  };
  
  /** Notes or annotations associated with this frame */
  notes?: string[];
  
  /** Inspection requirements */
  inspection?: {
    /** Inspection frequency */
    frequency?: string;
    /** Inspection method */
    method?: string;
    /** Special inspection notes */
    notes?: string[];
  };
};

// Helper types for common GD&T patterns
export type PositionTolerance = {
  value: string;
  materialCondition?: MaterialCondition;
  datumA: string;
  datumB?: string;
  datumC?: string;
  projectedZone?: boolean;
  translation?: boolean;
};

export type ProfileTolerance = {
  value: string;
  allAround?: boolean;
  allOver?: boolean;
  datumA?: string;
  datumB?: string;
  datumC?: string;
  between?: boolean;
};

export type RunoutTolerance = {
  value: string;
  datumA: string;
  datumB?: string;
  circular: boolean; // true for circular runout, false for total runout
};
