import { GeometricPoint, Radian, PrecisionValue } from "./types";

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