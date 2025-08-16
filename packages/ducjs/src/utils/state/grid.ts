import { GRID_TYPE, GRID_DISPLAY_TYPE } from "ducjs/flatbuffers/duc";
import { getPrecisionValueFromRaw } from "ducjs/technical";
import { GridSettings, Radian, RawValue, Scope } from "ducjs/types";
import { DEFAULT_GRID_SETTINGS } from "ducjs/utils/constants";

/**
 * Factory functions for common grid types
 */
export const createRectangularGrid = (spacing: number, name: string, scope: Scope): GridSettings => ({
  ...DEFAULT_GRID_SETTINGS,
  // id: `rect-${spacing}`,
  // name,
  xSpacing: getPrecisionValueFromRaw(spacing as RawValue, scope, scope),
  ySpacing: getPrecisionValueFromRaw(spacing as RawValue, scope, scope),
});

export const createIsometricGrid = (spacing: number, name: string, scope: Scope): GridSettings => ({
  ...DEFAULT_GRID_SETTINGS,
  // id: `iso-${spacing}`,
  // name,
  type: GRID_TYPE.ISOMETRIC,
  xSpacing: getPrecisionValueFromRaw(spacing as RawValue, scope, scope),
  ySpacing: getPrecisionValueFromRaw(spacing as RawValue, scope, scope),
  isometricSettings: {
    leftAngle: Math.PI / 6 as Radian, // 30 degrees
    rightAngle: Math.PI / 6 as Radian, // 30 degrees
  }
});

export const createPolarGrid = (radialSpacing: number, divisions: number, name: string, scope: Scope): GridSettings => ({
  ...DEFAULT_GRID_SETTINGS,
  // id: `polar-${radialSpacing}-${divisions}`,
  // name,
  type: GRID_TYPE.POLAR,
  displayType: GRID_DISPLAY_TYPE.LINES,
  xSpacing: getPrecisionValueFromRaw(radialSpacing as RawValue, scope, scope), // Used as radial spacing
  ySpacing: getPrecisionValueFromRaw(radialSpacing as RawValue, scope, scope), // Not used for polar
  polarSettings: {
    radialDivisions: divisions,
    radialSpacing: getPrecisionValueFromRaw(radialSpacing as RawValue, scope, scope),
    showLabels: false
  }
});