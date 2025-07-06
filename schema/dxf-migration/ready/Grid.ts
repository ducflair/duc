import { GeometricPoint, Radian, PrecisionValue } from "./types";

/**
 * Grid display types
 */
export const GRID_DISPLAY_TYPE = {
  LINES: 10,
  DOTS: 11,
  CROSSES: 12,
  ADAPTIVE: 13, // Changes based on zoom level
} as const;

/**
 * Grid coordinate system types
 */
export const GRID_TYPE = {
  RECTANGULAR: 10,
  ISOMETRIC: 11,
  POLAR: 12,
  TRIANGULAR: 13,
  CUSTOM: 14,
} as const;

export type GridDisplayType = ValueOf<typeof GRID_DISPLAY_TYPE>;
export type GridType = ValueOf<typeof GRID_TYPE>;

/**
 * Unified grid styling (works for lines, dots, crosses)
 */
export type GridStyle = {
  color: string;
  opacity: number;
  dashPattern: number[]; // for dashed lines
};

/**
 * Polar grid specific settings
 */
export type PolarGridSettings = {
  /** Number of radial divisions (spokes) */
  radialDivisions: number;
  /** Radial spacing between concentric circles */
  radialSpacing: PrecisionValue;
  /** Whether to show angle labels */
  showLabels: boolean;
};

/**
 * Isometric grid specific settings
 */
export type IsometricGridSettings = {
  /** Left plane angle (typically 30 degrees) */
  leftAngle: Radian;
  /** Right plane angle (typically 30 degrees) */
  rightAngle: Radian;
  /** Active isometric plane */
  activePlane: "top" | "left" | "right";
};

/**
 * Grid settings configuration
 */
export type GridSettings = {
  /** Unique identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Whether this grid is enabled */
  enabled: boolean;
  
  /** Grid coordinate system type */
  type: GridType;
  
  /** How the grid is displayed */
  displayType: GridDisplayType;
  
  /**
   * Whether the grid spacing is adaptive (changes with zoom level) or fixed.
   */
  isAdaptive: boolean;
  
  /** Spacing between major grid lines along X-axis */
  xSpacing: PrecisionValue;
  
  /** Spacing between major grid lines along Y-axis */
  ySpacing: PrecisionValue;
  
  /** Number of minor divisions between major lines */
  subdivisions: number;
  
  // === POSITIONING ===
  
  /** Grid origin point */
  origin: GeometricPoint;
  
  /** Grid rotation angle */
  rotation: Radian;
  
  /** Whether grid follows the active UCS */
  followUCS: boolean;
  
  // === STYLING ===
  
  /** Major grid line/dot styling */
  majorStyle: GridStyle;
  
  /** Minor grid line/dot styling */
  minorStyle: GridStyle;
  
  // === VISIBILITY ===
  
  /** Show minor subdivisions */
  showMinor: boolean;
  
  /** Minimum zoom level where grid becomes visible */
  minZoom: number;
  
  /** Maximum zoom level where grid remains visible */
  maxZoom: number;
  
  /** Whether to auto-hide when too dense */
  autoHide: boolean;
  
  // === SPECIALIZED SETTINGS ===
  
  /** Polar grid settings (when type is POLAR) */
  polarSettings?: PolarGridSettings;
  
  /** Isometric grid settings (when type is ISOMETRIC) */
  isometricSettings?: IsometricGridSettings;
  
  // === BEHAVIOR ===
  
  /** Whether this grid affects snapping */
  enableSnapping: boolean;
  
  /** Grid render priority */
  zIndex: number;
};

/**
 * Default grid configurations
 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  id: "default-grid",
  name: "Default Grid",
  enabled: true,
  type: GRID_TYPE.RECTANGULAR,
  displayType: GRID_DISPLAY_TYPE.LINES,
  
  xSpacing: { value: 10, scoped: 10 },
  ySpacing: { value: 10, scoped: 10 },
  subdivisions: 5,
  
  origin: { x: 0, y: 0 },
  rotation: 0,
  followUCS: true,
  
  majorStyle: {
    color: "#CCCCCC",
    opacity: 0.5,
    dashPattern: [1, 1],
  },
  minorStyle: {
    color: "#EEEEEE",
    opacity: 0.3,
    dashPattern: [0.5, 0.5],
  },
  
  showMinor: true,
  minZoom: 0.1,
  maxZoom: 100,
  autoHide: true,
  
  enableSnapping: true,
  zIndex: 0,
};

/**
 * Predefined grid configurations
 */
export const PREDEFINED_GRIDS = {
  ARCHITECTURAL_IMPERIAL: "arch-imperial",
  ARCHITECTURAL_METRIC: "arch-metric", 
  ENGINEERING_IMPERIAL: "eng-imperial",
  ENGINEERING_METRIC: "eng-metric",
  ISOMETRIC_30: "iso-30",
  POLAR_DEGREES: "polar-deg",
  FINE_DETAIL: "fine-detail",
} as const;

/**
 * Factory functions for common grid types
 */
export const createRectangularGrid = (spacing: number, name: string): GridSettings => ({
  ...DEFAULT_GRID_SETTINGS,
  id: `rect-${spacing}`,
  name,
  xSpacing: { value: spacing, scoped: spacing },
  ySpacing: { value: spacing, scoped: spacing },
});

export const createIsometricGrid = (spacing: number, name: string): GridSettings => ({
  ...DEFAULT_GRID_SETTINGS,
  id: `iso-${spacing}`,
  name,
  type: GRID_TYPE.ISOMETRIC,
  xSpacing: { value: spacing, scoped: spacing },
  ySpacing: { value: spacing, scoped: spacing },
  isometricSettings: {
    leftAngle: Math.PI / 6, // 30 degrees
    rightAngle: Math.PI / 6, // 30 degrees
    activePlane: "top"
  }
});

export const createPolarGrid = (radialSpacing: number, divisions: number, name: string): GridSettings => ({
  ...DEFAULT_GRID_SETTINGS,
  id: `polar-${radialSpacing}-${divisions}`,
  name,
  type: GRID_TYPE.POLAR,
  displayType: GRID_DISPLAY_TYPE.LINES,
  xSpacing: { value: radialSpacing, scoped: radialSpacing }, // Used as radial spacing
  ySpacing: { value: radialSpacing, scoped: radialSpacing }, // Not used for polar
  polarSettings: {
    radialDivisions: divisions,
    radialSpacing: { value: radialSpacing, scoped: radialSpacing },
    showLabels: false
  }
});