
/**
 * Enum for Object Snap modes.
 */
export enum ObjectSnapMode {
  Endpoint = "ENDPOINT",
  Midpoint = "MIDPOINT",
  Center = "CENTER",
  Quadrant = "QUADRANT",
  Intersection = "INTERSECTION",
  Extension = "EXTENSION",
  Perpendicular = "PERPENDICULAR",
  Tangent = "TANGENT",
  Nearest = "NEAREST",
  Node = "NODE", // For points
  Insert = "INSERT", // For block insertion points
  Parallel = "PARALLEL",
  Apparent = "APPARENT_INTERSECTION", 
  From = "FROM", // Reference point snap
  PointFilter = "POINT_FILTER", // X,Y,Z filtering
  Temporary = "TEMPORARY", // Temporary tracking points
  BetweenTwoPoints = "BETWEEN_2_POINTS",
  PointOnCurve = "POINT_ON_CURVE",
  Geometric = "GEOMETRIC_CENTER", // vs bounding box center
}

/**
 * Snap behavior modes
 */
export type SnapMode = "running" | "single";

/**
 * Snap override behaviors
 */
export type SnapOverrideBehavior = "disable" | "forceGrid" | "forceObject";

/**
 * Snap marker shapes
 */
export type SnapMarkerShape = "square" | "circle" | "triangle" | "x";

/**
 * Temporary snap override settings
 */
export type SnapOverride = {
  key: string; // keyboard key
  behavior: SnapOverrideBehavior;
};

/**
 * Dynamic snap behavior configuration
 */
export type DynamicSnapSettings = {
  enabledDuringDrag: boolean;
  enabledDuringRotation: boolean;
  enabledDuringScale: boolean;
};

/**
 * Polar tracking configuration
 */
export type PolarTrackingSettings = {
  enabled: boolean;
  angles: Radian[];
  /**
   * Additional increment angle for polar tracking
   */
  incrementAngle?: Radian;
  /**
   * Whether to track from last point or from base
   */
  trackFromLastPoint: boolean;
  /**
   * Display polar distance and angle
   */
  showPolarCoordinates: boolean;
};

/**
 * Tracking line display settings
 */
export type TrackingLineStyle = {
  color: string;
  opacity: number;
  dashPattern?: number[];
};

/**
 * Layer-specific snap filters
 */
export type LayerSnapFilters = {
  includeLayers?: string[];
  excludeLayers?: string[];
};

/**
 * Snap marker configuration for each snap mode
 */
export type SnapMarkerStyle = {
  shape: SnapMarkerShape;
  color: string;
};

/**
 * Visual feedback settings for snap markers
 */
export type SnapMarkerSettings = {
  enabled: boolean;
  size: number;
  duration?: number; // for temporary markers (ms)
  styles: Record<ObjectSnapMode, SnapMarkerStyle>;
};

/**
 * Defines the properties of the drawing snap mode.
 */
export type SnapSettings = {

  /**
   * The snap angle for rotated snap grids (e.g., for isometric snapping).
   * In radians. Default is 0.
   */
  twistAngle: Radian;

  /**
   * Snap tolerance in pixels - how close cursor must be to trigger snap
   */
  snapTolerance: number;

  /**
   * Aperture size for object snap detection (in pixels)
   */
  objectSnapAperture: number;

  /**
   * Whether orthogonal mode is enabled (constrains to 0/90 degrees)
   */
  isOrthoModeOn: boolean;

  /**
   * Polar tracking configuration
   */
  polarTracking: PolarTrackingSettings;

  /**
   * Whether object snap (Osnap) is enabled.
   * Osnap allows snapping to geometric points on existing objects.
   */
  isObjectSnapOn: boolean;

  /**
   * Set of active object snap modes
   */
  activeObjectSnapModes: ObjectSnapMode[];

  /**
   * Priority order when multiple snaps are available at cursor position
   */
  snapPriority: ObjectSnapMode[];

  /**
   * Whether to show tracking lines/vectors
   */
  showTrackingLines: boolean;

  /**
   * Tracking line display settings
   */
  trackingLineStyle?: TrackingLineStyle;

  /**
   * Snap behavior during element creation/modification
   */
  dynamicSnap: DynamicSnapSettings;

  /**
   * Temporary snap override settings (e.g., holding shift)
   */
  temporaryOverrides?: SnapOverride[];

  /**
   * Incremental snap distance (for relative movements)
   */
  incrementalDistance?: number;

  /**
   * Magnetic snap strength (0-100)
   */
  magneticStrength?: number;

  /**
   * Layer-specific snap settings
   */
  layerSnapFilters?: LayerSnapFilters;

  /**
   * Element type filters for object snap
   */
  elementTypeFilters?: DucElementType[];

  /**
   * Running object snap vs single pick mode
   */
  snapMode: SnapMode;

  /**
   * Visual feedback settings
   */
  snapMarkers: SnapMarkerSettings;

  /**
   * Construction/guide line snapping
   */
  constructionSnapEnabled: boolean;

  /**
   * Snap to grid intersections only
   */
  snapToGridIntersections?: boolean;
};

/**
 * Default snap settings configuration
 */
export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  twistAngle: 0,
  snapTolerance: 10,
  objectSnapAperture: 8,
  isOrthoModeOn: false,
  polarTracking: {
    enabled: false,
    angles: [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4],
    trackFromLastPoint: true,
    showPolarCoordinates: true,
  },
  isObjectSnapOn: true,
  activeObjectSnapModes: [
    ObjectSnapMode.Endpoint,
    ObjectSnapMode.Midpoint,
    ObjectSnapMode.Center,
    ObjectSnapMode.Intersection,
  ],
  snapPriority: [
    ObjectSnapMode.Endpoint,
    ObjectSnapMode.Intersection,
    ObjectSnapMode.Midpoint,
    ObjectSnapMode.Center,
    ObjectSnapMode.Quadrant,
    ObjectSnapMode.Tangent,
    ObjectSnapMode.Perpendicular,
    ObjectSnapMode.Nearest,
  ],
  showTrackingLines: true,
  trackingLineStyle: {
    color: "#00FF00",
    opacity: 0.7,
    dashPattern: [2, 2],
  },
  dynamicSnap: {
    enabledDuringDrag: true,
    enabledDuringRotation: true,
    enabledDuringScale: true,
  },
  temporaryOverrides: [
    { key: "Shift", behavior: "disable" },
    { key: "F9", behavior: "forceGrid" },
  ],
  magneticStrength: 50,
  snapMode: "running",
  snapMarkers: {
    enabled: true,
    size: 8,
    duration: 2000,
    styles: {
      [ObjectSnapMode.Endpoint]: { shape: "square", color: "#FF0000" },
      [ObjectSnapMode.Midpoint]: { shape: "triangle", color: "#00FF00" },
      [ObjectSnapMode.Center]: { shape: "circle", color: "#0000FF" },
      [ObjectSnapMode.Quadrant]: { shape: "square", color: "#FFFF00" },
      [ObjectSnapMode.Intersection]: { shape: "x", color: "#FF00FF" },
      [ObjectSnapMode.Extension]: { shape: "circle", color: "#FFA500" },
      [ObjectSnapMode.Perpendicular]: { shape: "square", color: "#800080" },
      [ObjectSnapMode.Tangent]: { shape: "circle", color: "#008080" },
      [ObjectSnapMode.Nearest]: { shape: "square", color: "#808080" },
      [ObjectSnapMode.Node]: { shape: "circle", color: "#FFB6C1" },
      [ObjectSnapMode.Insert]: { shape: "triangle", color: "#90EE90" },
      [ObjectSnapMode.Parallel]: { shape: "square", color: "#F0E68C" },
      [ObjectSnapMode.Apparent]: { shape: "x", color: "#DDA0DD" },
      [ObjectSnapMode.From]: { shape: "circle", color: "#20B2AA" },
      [ObjectSnapMode.PointFilter]: { shape: "square", color: "#F4A460" },
      [ObjectSnapMode.Temporary]: { shape: "circle", color: "#32CD32" },
      [ObjectSnapMode.BetweenTwoPoints]: { shape: "triangle", color: "#FF6347" },
      [ObjectSnapMode.PointOnCurve]: { shape: "circle", color: "#4169E1" },
      [ObjectSnapMode.Geometric]: { shape: "square", color: "#DC143C" },
    },
  },
  constructionSnapEnabled: true,
  snapToGridIntersections: false,
};