import { UNIT_SYSTEM } from "ducjs/flatbuffers/duc";
import { PrecisionValue, RawValue, ScaledZoom, Scope, ScopedValue, ScopedZoomValue, ValueOf } from "ducjs/types";
import { DucPoint } from "ducjs/types/elements";
import { GeometricPoint } from "ducjs/types/geometryTypes";

export type UnitSystem = ValueOf<typeof UNIT_SYSTEM>;
export type ZoomDirection = 'up' | 'down' | 'neutral';

// Constants
export const MIN_ZOOM = 1e-32;
export const MAX_ZOOM = 1e32;
export const NEUTRAL_SCOPE: SupportedMeasures = "m";

// Define string-based measurement units
export const metricMeasures = [
  'qm', // Quectometer
  'rm', // Rontometer
  'ym', // Yoctometer
  'zm', // Zeptometer
  'am', // Attometer
  'fm', // Femtometer
  'pm', // Picometer
  'Å',  // Angstrom
  'nm', // Nanometer
  'µm', // Micrometer
  'mm', // Millimeter
  'cm', // Centimeter
  'dm', // Decimeter
  'm', // Meter
  'dam', // Decameter
  'hm', // Hectometer
  'km', // Kilometer
  'Mm', // Megameter
  'Gm', // Gigameter
  'Tm', // Terameter
  'Pm', // Petameter
  'Em', // Exameter
  'Zm', // Zettameter
  'Ym', // Yottameter
  'Rm', // Ronnameter
  'Qm', // Quettameter
] as const;
export type MetricMeasure = typeof metricMeasures[number];

export const imperialMeasures = [
  'µin', // Microinches
  'th', // Thou
  'mil', // Mils
  'ln', // Line
  'in-us', // US Survey Inch
  'in', // Inches
  'h',  // Hand
  'ft-us', // US Survey Feet
  'ft', // Feet
  'yd-us', // US Survey Yard
  'yd', // Yards
  'rd', // Rods
  'ch', // Chains
  'fur', // Furlongs
  'mi-us', // US Survey Mile
  'mi', // Miles
  'lea', // Leagues
  'au', // Astronomical Unit
  'ly', // Light Year
  'pc', // Parsec
] as const;
export type ImperialMeasure = typeof imperialMeasures[number];

export type SupportedMeasures = MetricMeasure | ImperialMeasure;
export type CombinedMeasure = SupportedMeasures;

export interface UnitDefinition {
  prefix: SupportedMeasures;
  unit: string;
  full: string;
  exponent: number;
}

// Define metric units - exponents represent powers of 10
export const metricUnits: UnitDefinition[] = [
  { prefix: 'qm', unit: 'quecto', full: 'quectometer', exponent: -30 },
  { prefix: 'rm', unit: 'ronto', full: 'rontometer', exponent: -27 },
  { prefix: 'ym', unit: 'yocto', full: 'yoctometer', exponent: -24 },
  { prefix: 'zm', unit: 'zepto', full: 'zeptometer', exponent: -21 },
  { prefix: 'am', unit: 'atto', full: 'attometer', exponent: -18 },
  { prefix: 'fm', unit: 'femto', full: 'femtometer', exponent: -15 },
  { prefix: 'pm', unit: 'pico', full: 'picometer', exponent: -12 },
  { prefix: 'Å', unit: 'angstrom', full: 'angstrom', exponent: -10 },
  { prefix: 'nm', unit: 'nano', full: 'nanometer', exponent: -9 },
  { prefix: 'µm', unit: 'micro', full: 'micrometer', exponent: -6 },
  { prefix: 'mm', unit: 'milli', full: 'millimeter', exponent: -3 },
  { prefix: 'cm', unit: 'centi', full: 'centimeter', exponent: -2 },
  { prefix: 'dm', unit: 'deci', full: 'decimeter', exponent: -1 },
  { prefix: 'm', unit: '', full: 'meter', exponent: 0 },
  { prefix: 'dam', unit: 'deca', full: 'decameter', exponent: 1 },
  { prefix: 'hm', unit: 'hecto', full: 'hectometer', exponent: 2 },
  { prefix: 'km', unit: 'kilo', full: 'kilometer', exponent: 3 },
  { prefix: 'Mm', unit: 'mega', full: 'megameter', exponent: 6 },
  { prefix: 'Gm', unit: 'giga', full: 'gigameter', exponent: 9 },
  { prefix: 'Tm', unit: 'tera', full: 'terameter', exponent: 12 },
  { prefix: 'Pm', unit: 'peta', full: 'petameter', exponent: 15 },
  { prefix: 'Em', unit: 'exa', full: 'exameter', exponent: 18 },
  { prefix: 'Zm', unit: 'zetta', full: 'zettameter', exponent: 21 },
  { prefix: 'Ym', unit: 'yotta', full: 'yottameter', exponent: 24 },
  { prefix: 'Rm', unit: 'ronna', full: 'ronnameter', exponent: 27 },
  { prefix: 'Qm', unit: 'quetta', full: 'quettameter', exponent: 30 }
];

// Define imperial units - exponents are now relative to meter as the base unit
// These values are log10 of their meter equivalents
export const imperialUnits: UnitDefinition[] = [
  { prefix: 'µin', unit: 'microinch', full: 'microinch', exponent: -7.595 }, // log10(2.54e-8)
  { prefix: 'th', unit: 'thou', full: 'thou', exponent: -4.595 },      // log10(0.0000254)
  { prefix: 'mil', unit: 'mil', full: 'mil', exponent: -4.595 },      // log10(0.0000254)
  { prefix: 'ln', unit: 'line', full: 'line', exponent: -2.674 },      // log10(0.00211667)
  { prefix: 'in-us', unit: 'us-inch', full: 'US Survey Inch', exponent: -1.5951 }, // log10(0.0254000508)
  { prefix: 'in', unit: 'inch', full: 'inch', exponent: -1.595 },      // log10(0.0254)
  { prefix: 'h', unit: 'hand', full: 'hand', exponent: -0.993 },       // log10(0.1016)
  { prefix: 'ft-us', unit: 'us-foot', full: 'US Survey Foot', exponent: -0.5159 }, // log10(0.3048006096)
  { prefix: 'ft', unit: 'foot', full: 'foot', exponent: -0.516 },      // log10(0.3048)
  { prefix: 'yd-us', unit: 'us-yard', full: 'US Survey Yard', exponent: -0.0388 }, // log10(0.9144018288)
  { prefix: 'yd', unit: 'yard', full: 'yard', exponent: -0.039 },      // log10(0.9144)
  { prefix: 'rd', unit: 'rod', full: 'rod', exponent: 0.701 },         // log10(5.0292)
  { prefix: 'ch', unit: 'chain', full: 'chain', exponent: 1.304 },     // log10(20.1168)
  { prefix: 'fur', unit: 'furlong', full: 'furlong', exponent: 2.304 }, // log10(201.168)
  { prefix: 'mi-us', unit: 'us-mile', full: 'US Survey Mile', exponent: 3.2066 }, // log10(1609.3472)
  { prefix: 'mi', unit: 'mile', full: 'mile', exponent: 3.207 },       // log10(1609.344)
  { prefix: 'lea', unit: 'league', full: 'league', exponent: 3.684 },   // log10(4828.032)
  { prefix: 'au', unit: 'au', full: 'Astronomical Unit', exponent: 11.175 }, // log10(1.496e11)
  { prefix: 'ly', unit: 'ly', full: 'Light Year', exponent: 15.976 }, // log10(9.461e15)
  { prefix: 'pc', unit: 'pc', full: 'Parsec', exponent: 16.489 }, // log10(3.086e16)
];

// Scale factors for unit conversions - using meter as the base unit
export const ScaleFactors: { [key in CombinedMeasure]: number } = {
  // Metric scales
  qm: 1e-30,
  rm: 1e-27,
  ym: 1e-24,
  zm: 1e-21,
  am: 1e-18,
  fm: 1e-15,
  pm: 1e-12,
  Å: 1e-10,
  nm: 1e-9,
  µm: 1e-6,
  mm: 1e-3,
  cm: 1e-2,
  dm: 1e-1,
  m: 1,
  dam: 1e1,
  hm: 1e2,
  km: 1e3,
  Mm: 1e6,
  Gm: 1e9,
  Tm: 1e12,
  Pm: 1e15,
  Em: 1e18,
  Zm: 1e21,
  Ym: 1e24,
  Rm: 1e27,
  Qm: 1e30,
  // Imperial scales
  'µin': 2.54e-8,       // Microinch
  th: 0.0000254,      // Thou (0.001 inch)
  mil: 0.0000254,     // Mil (same as Thou)
  ln: 0.00211667,     // 1/12 inch
  'in-us': 0.0254000508, // US Survey Inch
  in: 0.0254,
  h: 0.1016,          // 4 inches
  'ft-us': 0.3048006096, // US Survey Foot
  ft: 0.3048,
  'yd-us': 0.9144018288, // US Survey Yard
  yd: 0.9144,
  rd: 5.0292,
  ch: 20.1168,
  fur: 201.168,
  'mi-us': 1609.34721869, // US Survey Mile
  mi: 1609.344,
  lea: 4828.032,      // 3 miles
  au: 149597870700,    // Astronomical Unit
  ly: 9460730472580800, // Light Year
  pc: 30856775814913670, // Parsec
};

/**
 * Determines if a measure belongs to the metric system.
 * @param measure The measure to check.
 * @returns `true` if the measure is metric, `false` otherwise.
 */
export function isMetricMeasure(measure: SupportedMeasures): boolean {
  return (metricMeasures as readonly string[]).includes(measure);
}

/**
 * Gets the unit system ('metric' or 'imperial') for a given measure.
 * @param measure The measure to determine the system for.
 * @returns The unit system the measure belongs to.
 */
export function getUnitSystemForMeasure(measure: SupportedMeasures): UnitSystem {
  return isMetricMeasure(measure) ? UNIT_SYSTEM.METRIC : UNIT_SYSTEM.IMPERIAL;
}

/**
 * Clamps a zoom value between minimum and maximum allowed values
 */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Determines the zoom direction based on previous and current zoom values
 */
export function getZoomDirectionChange(prevZoom: number, currentZoom: number): ZoomDirection {
  if (currentZoom > prevZoom) {
    return 'up';
  } else if (currentZoom < prevZoom) {
    return 'down';
  }
  return 'neutral';
}

/**
 * Gets the unit definitions (prefix, name, exponent) for the specified unit system.
 * @param unitSystem The unit system ('metric' or 'imperial') to get definitions for.
 * @returns An array of unit definitions.
 */
export function getUnitDefinitions(unitSystem: UnitSystem): UnitDefinition[] {
  return unitSystem === UNIT_SYSTEM.METRIC ? metricUnits : imperialUnits;
}

/**
 * Gets the standard exponents associated with the units in a specified system.
 * These exponents represent the power of 10 (for metric) or log10 equivalent (for imperial) relative to the base unit (meter).
 * @param unitSystem The unit system ('metric' or 'imperial').
 * @returns An array of standard exponent numbers.
 */
export function getStandardExponents(unitSystem: UnitSystem): number[] {
  const definitions = getUnitDefinitions(unitSystem);
  return definitions.map(unit => unit.exponent);
}

/**
 * Gets the exponent value for a given measure.
 * @param measure The measure (e.g., 'mm', 'ft') to get the exponent for.
 * @returns The exponent value, defaulting to 0 (base unit) if not found.
 */
export function getExponentForMeasure(measure: SupportedMeasures): number {
  const unitSystem = getUnitSystemForMeasure(measure);
  const definitions = getUnitDefinitions(unitSystem);
  const unitDef = definitions.find(def => def.prefix === measure);
  return unitDef ? unitDef.exponent : 0; // Default to base unit (m or in) if not found
}

/**
 * Gets the measure (unit prefix) that is closest to a given exponent value within a unit system.
 * @param exponent The exponent value to find the closest measure for.
 * @param unitSystem The unit system ('metric' or 'imperial') to search within.
 * @returns The prefix of the closest measure.
 */
export function getMeasureForExponent(exponent: number, unitSystem: UnitSystem): SupportedMeasures {
  const definitions = getUnitDefinitions(unitSystem);
  let closestDef = definitions[0];
  let minDiff = Math.abs(definitions[0].exponent - exponent);

  for (const def of definitions) {
    const diff = Math.abs(def.exponent - exponent);
    if (diff < minDiff) {
      minDiff = diff;
      closestDef = def;
    }
  }

  return closestDef.prefix;
}

/**
 * Calculates how much influence the main scope should have based on zoom level.
 * This function now provides a simple normalized distance metric for UI animations.
 * 
 * Returns a value from 0 to 1 where:
 * - 1 means we're exactly at the main scope's exponent
 * - 0 means we're at or beyond the threshold from the main scope's exponent
 */
export function getMainScopeInfluence(zoomExponent: number, mainScopeExponent: number, scopeExpThreshold: number): number {
  // The relationship between zoom exponent and unit exponent is inverse
  const invertedZoomExponent = -zoomExponent;
  const absDiff = Math.abs(invertedZoomExponent - mainScopeExponent);

  // If we're outside the threshold, there's no influence
  if (absDiff >= scopeExpThreshold) {
    return 0;
  }

  // Within the threshold, calculate a linear falloff from 1 (at exact match) to 0 (at threshold)
  return 1 - (absDiff / scopeExpThreshold);
}

/**
 * Calculates the appropriate scope index based on zoom level with an improved gravity well effect
 */
export function calculateScopeIndex(
  zoom: number,
  unitSystem: UnitSystem,
  scopeExpThreshold: number,
  mainScopeExponent: number
): number {
  const zoomClamped = clampZoom(zoom);
  // Handle edge case where zoom is non-positive before taking log
  if (zoomClamped <= 0) {
    // Return index for the largest unit (smallest zoom)
    return getStandardExponents(unitSystem).length - 1;
  }

  // Calculate zoom exponent for the scope progression
  const zoomExponent = Math.log10(zoomClamped);

  // Calculate the inverted exponent (this determines the natural scope)
  const invertedZoomExponent = -zoomExponent;
  const standardExponents = getStandardExponents(unitSystem);

  // Find main scope index
  const mainScopeIndex = standardExponents.findIndex(exp => exp === mainScopeExponent);

  // If main scope index not found, fall back to natural scope selection
  if (mainScopeIndex === -1) {
    return findNaturalScopeIndex(invertedZoomExponent, standardExponents);
  }

  // Calculate distance from main scope in exponent space
  const distFromMainScope = Math.abs(invertedZoomExponent - mainScopeExponent);
  const effectiveThreshold = scopeExpThreshold - 0.95; // e.g., an input of 1 becomes an effective 0.05

  // CORE BEHAVIOR: If we're within the effective threshold, ALWAYS use the main scope
  // This ensures stable behavior with small threshold values
  if (distFromMainScope < effectiveThreshold) {
    return mainScopeIndex;
  }

  // Beyond the threshold, use natural scope selection
  return findNaturalScopeIndex(invertedZoomExponent, standardExponents);
}

/**
 * Helper function to find the natural scope index based solely on zoom exponent
 */
function findNaturalScopeIndex(invertedZoomExponent: number, standardExponents: number[]): number {
  // Find natural scope index
  let baseIndex = -1;
  for (let i = 0; i < standardExponents.length - 1; i++) {
    if (invertedZoomExponent >= standardExponents[i] && invertedZoomExponent < standardExponents[i + 1]) {
      baseIndex = i;
      break;
    }
  }

  // Handle edge cases
  if (baseIndex === -1) {
    if (invertedZoomExponent < standardExponents[0]) {
      baseIndex = 0;
    } else {
      baseIndex = standardExponents.length - 1;
    }
  }

  return baseIndex;
}

/**
 * Calculates the appropriate scope measure (unit prefix) based on the current zoom level,
 * considering the main scope and threshold settings.
 * @param zoom The current raw zoom level.
 * @param scopeExpThreshold The exponent difference threshold for main scope influence.
 * @param mainMeasure The designated main measure acting as a gravity well.
 * @returns The calculated scope measure (unit prefix).
 */
export function calculateScope(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): SupportedMeasures {
  const unitSystem = getUnitSystemForMeasure(mainMeasure);
  const mainScopeExponent = getExponentForMeasure(mainMeasure);
  const scopeIndex = calculateScopeIndex(zoom, unitSystem, scopeExpThreshold, mainScopeExponent);

  const unitDefinitions = getUnitDefinitions(unitSystem);
  // Ensure we don't exceed array bounds
  const safeIndex = Math.min(Math.max(0, scopeIndex), unitDefinitions.length - 1);

  return unitDefinitions[safeIndex].prefix;
}

/**
 * Gets the full unit definition object for the current scope based on zoom and main scope settings.
 * @param zoom The current raw zoom level.
 * @param scopeExpThreshold The exponent difference threshold for main scope influence.
 * @param mainMeasure The designated main measure.
 * @returns The full UnitDefinition object for the current scope.
 */
export function getCurrentUnitDefinition(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): UnitDefinition {
  const unitSystem = getUnitSystemForMeasure(mainMeasure);
  const mainScopeExponent = getExponentForMeasure(mainMeasure);
  const scopeIndex = calculateScopeIndex(zoom, unitSystem, scopeExpThreshold, mainScopeExponent);

  const unitDefinitions = getUnitDefinitions(unitSystem);
  const safeIndex = Math.min(Math.max(0, scopeIndex), unitDefinitions.length - 1);

  return unitDefinitions[safeIndex];
}

/**
 * Gets the lower bound of the current scope's *exponent* range.
 * This represents the minimum exponent value covered by the current scope.
 * @param zoom The current raw zoom level.
 * @param scopeExpThreshold The exponent difference threshold for main scope influence.
 * @param mainMeasure The designated main measure.
 * @returns The lower exponent bound of the current scope.
 */
export function getCurrentScopeExponentLowerBound(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): number {
  const unitSystem = getUnitSystemForMeasure(mainMeasure);
  const mainScopeExponent = getExponentForMeasure(mainMeasure);
  const scopeIndex = calculateScopeIndex(zoom, unitSystem, scopeExpThreshold, mainScopeExponent);

  const standardExponents = getStandardExponents(unitSystem);
  // Ensure index is valid before accessing
  const safeIndex = Math.max(0, Math.min(scopeIndex, standardExponents.length - 1));
  return standardExponents[safeIndex];
}

/**
 * Gets the upper bound of the current scope's *exponent* range.
 * This represents the maximum exponent value covered by the current scope (exclusive).
 * @param zoom The current raw zoom level.
 * @param scopeExpThreshold The exponent difference threshold for main scope influence.
 * @param mainMeasure The designated main measure.
 * @returns The upper exponent bound of the current scope.
 */
export function getCurrentScopeExponentUpperBound(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): number {
  const unitSystem = getUnitSystemForMeasure(mainMeasure);
  const mainScopeExponent = getExponentForMeasure(mainMeasure);
  const scopeIndex = calculateScopeIndex(zoom, unitSystem, scopeExpThreshold, mainScopeExponent);

  const standardExponents = getStandardExponents(unitSystem);
  const safeIndex = Math.max(0, Math.min(scopeIndex, standardExponents.length - 1));
  const nextIndex = Math.min(safeIndex + 1, standardExponents.length - 1);

  // If already at the last index, estimate the next exponent step
  if (nextIndex === safeIndex && standardExponents.length > 1) {
    return standardExponents[safeIndex] + (standardExponents[1] - standardExponents[0]);
  } else if (nextIndex === safeIndex) {
    return standardExponents[safeIndex]; // Only one exponent defined
  }

  return standardExponents[nextIndex];
}

/**
 * Gets the lower bound of the *zoom* range for the current scope.
 * Derived from the scope's upper exponent bound.
 * @param zoom The current raw zoom level.
 * @param scopeExpThreshold The exponent difference threshold for main scope influence.
 * @param mainMeasure The designated main measure.
 * @returns The minimum raw zoom value that falls within the current scope.
 */
export function getCurrentScopeLowerZoomBound(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): number {
  // Use the exponent bounds to derive zoom bounds based on the new logic
  const upperExp = getCurrentScopeExponentUpperBound(zoom, scopeExpThreshold, mainMeasure);

  // Scope 'i' applies when lowerExp <= -log10(zoom) < upperExp
  // Which means -upperExp < log10(zoom) <= -lowerExp
  // Lower zoom bound is 10^(-upperExp)
  return Math.pow(10, -upperExp);
}

/**
 * Gets the upper bound of the *zoom* range for the current scope.
 * Derived from the scope's lower exponent bound.
 * @param zoom The current raw zoom level.
 * @param scopeExpThreshold The exponent difference threshold for main scope influence.
 * @param mainMeasure The designated main measure.
 * @returns The maximum raw zoom value (exclusive) that falls within the current scope.
 */
export function getCurrentScopeUpperZoomBound(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): number {
  // Use the exponent bounds to derive zoom bounds based on the new logic
  const lowerExp = getCurrentScopeExponentLowerBound(zoom, scopeExpThreshold, mainMeasure);

  // Scope 'i' applies when lowerExp <= -log10(zoom) < upperExp
  // Which means -upperExp < log10(zoom) <= -lowerExp
  // Upper zoom bound is 10^(-lowerExp)
  return Math.pow(10, -lowerExp);
}


/**
 * Converts a numeric value from one scope (unit) to its equivalent in another scope,
 * preserving the actual physical magnitude.
 * This uses the underlying scale factors relative to the base unit (meter).
 * 
 * @param providedValue - The numeric value to convert.
 * @param providedScope - The scope (unit) of the provided value.
 * @param targetScope - The target scope (unit) to convert the value to.
 * @returns The equivalent value in the target scope.
 */
export function getPrecisionValueForScope(
  providedValue: number,
  providedScope: SupportedMeasures,
  targetScope: SupportedMeasures,
): number {
  // If scopes are the same, no conversion needed
  if (providedScope === targetScope) {
    return providedValue;
  }

  // Get the translation factor between the scopes
  const translationFactor = getTranslationFactor(providedScope, targetScope);

  // Convert the value using the translation factor
  // This maintains the relative scale between the scopes
  return (providedValue * translationFactor);
}

/**
 * Gets the percentage through the current scope's *exponent* range (0-100%)
 * Percentage 0% means at the boundary with the next *larger* unit scope
 * Percentage 100% means at the boundary with the next *smaller* unit scope
 */
export function getScopeThroughPercentage(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): number {
  const zoomClamped = clampZoom(zoom);
  const lowerZoom = getCurrentScopeLowerZoomBound(zoom, scopeExpThreshold, mainMeasure);
  const upperZoom = getCurrentScopeUpperZoomBound(zoom, scopeExpThreshold, mainMeasure);

  if (upperZoom <= lowerZoom) {
    return 0;
  }

  const fraction = (zoomClamped - lowerZoom) / (upperZoom - lowerZoom);
  return Math.min(100, Math.max(0, fraction * 100));
}

/**
 * Gets proximity to scope change (0-1, where 1 means about to change)
 * This determines animation of measurement indicators
 */
export function getProximityToScopeChange(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): number {
  const zoomClamped = clampZoom(zoom);
  const zoomExp = Math.log10(zoomClamped);

  // Get current scope's exponent bounds
  const lowerExp = getCurrentScopeExponentLowerBound(zoom, scopeExpThreshold, mainMeasure);
  const upperExp = getCurrentScopeExponentUpperBound(zoom, scopeExpThreshold, mainMeasure);

  // Calculate where we are in the current scope's range
  const scopeRange = upperExp - lowerExp;
  if (scopeRange <= 0) return 0;

  // Calculate position within scope (-log10(zoom) should be between lowerExp and upperExp)
  const position = -zoomExp;

  // Calculate relative position in the scope range (0 to 1)
  const relativePos = (position - lowerExp) / scopeRange;

  // We want the proximity to increase smoothly as we move away from the center of the scope
  // Center is at 0.5, edges are at 0 and 1
  const distanceFromCenter = Math.abs(relativePos - 0.5) * 2; // Will be 0 at center, 1 at edges

  // Apply a smooth easing function to make the transition more gradual
  // This creates a more continuous movement from center to edges
  return Math.pow(distanceFromCenter, 1.5); // The power of 1.5 makes it more gradual
}

/**
 * Determines direction of next scope change based on position within current scope
 * 'up' -> higher index (larger units)
 * 'down' -> lower index (smaller units)
 */
export function getNextScopeDirection(
  zoom: number,
  scopeExpThreshold: number,
  mainMeasure: SupportedMeasures
): 'up' | 'down' {
  const zoomClamped = clampZoom(zoom);
  const zoomExp = Math.log10(zoomClamped);

  // Get current scope's exponent bounds
  const lowerExp = getCurrentScopeExponentLowerBound(zoom, scopeExpThreshold, mainMeasure);
  const upperExp = getCurrentScopeExponentUpperBound(zoom, scopeExpThreshold, mainMeasure);

  // If we're dealing with an almost zero range, use zoom direction instead
  const scopeRange = upperExp - lowerExp;
  if (scopeRange < 0.001) {
    return zoomExp < 0 ? 'down' : 'up';
  }

  // Calculate position within scope (-log10(zoom) should be between lowerExp and upperExp)
  const position = -zoomExp;

  // Calculate relative position in the scope range (0 to 1)
  const relativePos = (position - lowerExp) / scopeRange;

  // Now use a stable approach - if in the lower 40% of the range, direction is up,
  // if in the upper 40%, direction is down. This prevents rapid switching.
  if (relativePos < 0.4) return 'up';
  if (relativePos > 0.6) return 'down';

  // In the middle zone (40-60%), maintain the previous direction to avoid oscillation
  // Use the relative position compared to exact center to decide
  return relativePos < 0.5 ? 'up' : 'down';
}

/**
 * Get translation factor between two measures (unit scopes).
 * Calculates the multiplicative factor needed to convert a value from `fromMeasure` to `toMeasure`.
 * @param fromMeasure The source measure unit.
 * @param toMeasure The target measure unit.
 * @returns The translation factor.
 */
export function getTranslationFactor(
  fromMeasure: SupportedMeasures,
  toMeasure: SupportedMeasures
): number {
  const fromFactor = ScaleFactors[fromMeasure];
  const toFactor = ScaleFactors[toMeasure];
  // Handle potential division by zero if a factor is missing or zero
  if (toFactor === 0) {
    console.error(`Attempted to divide by zero scale factor for unit: ${toMeasure}`);
    return 1; // Or throw an error, depending on desired behavior
  }
  return fromFactor / toFactor;
}

/**
 * Adjusts the raw zoom level when the main scope is changed, aiming to maintain 
 * the same visual center point or numeric value representation on screen.
 * @param currentZoom The current raw zoom level.
 * @param oldMainMeasure The previous main measure.
 * @param newMainMeasure The newly selected main measure.
 * @returns The adjusted raw zoom level.
 */
export function getAdjustedZoomForMainScopeChange(
  currentZoom: number,
  oldMainMeasure: SupportedMeasures,
  newMainMeasure: SupportedMeasures
): number {
  // Get the translation factor between the old and new units
  // Note the order: new to old, because zoom is inversely proportional to unit size
  const translationFactor = getTranslationFactor(newMainMeasure, oldMainMeasure);

  // Adjust the zoom to maintain the same numeric center value
  // Since zoom is inversely proportional to the unit size,
  // we multiply by the translation factor (in the inverse direction)
  return currentZoom * translationFactor;
}

/**
 * Converts a raw value, assumed to be in NEUTRAL_SCOPE (meters), into its equivalent in the `currentScope`.
 * This effectively gives the value as if it were measured in `currentScope` units while maintaining its physical magnitude relative to the neutral reference.
 *
 * @param value - The raw numeric value, assumed to be in NEUTRAL_SCOPE (e.g., meters).
 * @param currentScope - The target scope (unit) to express the value in.
 * @returns The value converted to `currentScope`, branded as `ScopedValue`.
 */
export const getNeutralScopedValue = (
  value: number,
  currentScope: Scope,
): ScopedValue => {
  return getPrecisionValueForScope(value, NEUTRAL_SCOPE, currentScope) as ScopedValue;
}

/**
 * Constructs a `PrecisionValue` object from a value that is already scoped.
 * A scoped value is typically expressed in `currentScope` units but is relative to `NEUTRAL_SCOPE`.
 * This function converts this `newScopedValue` back to its original `RawValue` in its `providedScope`.
 *
 * @param newScopedValue - The value already expressed in `currentScope` units, relative to `NEUTRAL_SCOPE`.
 * @param providedScope - The original scope (unit) the raw value should be in.
 * @param currentScope - The scope (unit) in which `newScopedValue` is currently expressed.
 * @returns A `PrecisionValue` object containing both the `scoped` (input) and calculated `value` (in `providedScope`).
 */
export const getPrecisionValueFromScoped = (
  newScopedValue: ScopedValue,
  providedScope: Scope,
  currentScope: Scope,
): PrecisionValue => {
  return {
    scoped: newScopedValue,
    value: getPrecisionValueForScope(newScopedValue, currentScope, providedScope) as RawValue
  }
}

/**
 * Constructs a `PrecisionValue` object from a `RawValue`.
 * It calculates the `scoped` representation of the `rawValue` (which is in `providedScope`)
 * by converting it to the `currentScope`.
 *
 * @param rawValue - The raw numeric value in its original `providedScope`.
 * @param providedScope - The original scope (unit) of the `rawValue`.
 * @param currentScope - The target scope (unit) to express the `scoped` value in.
 * @returns A `PrecisionValue` object containing the calculated `scoped` value and the original `value` (raw).
 */
export const getPrecisionValueFromRaw = (
  rawValue: RawValue,
  providedScope: Scope,
  currentScope: Scope,
): PrecisionValue => {
  return {
    scoped: getPrecisionValueForScope(rawValue, providedScope, currentScope) as ScopedValue,
    value: rawValue
  }
}

/**
 * Converts a raw zoom value into a `ScopedZoomValue`.
 * Due to the inverse perception of zoom (higher raw zoom means smaller represented units),
 * this conversion is from `currentScope` to `NEUTRAL_SCOPE`.
 * It essentially calculates how many `NEUTRAL_SCOPE` units are equivalent to one `currentScope` unit at the given raw zoom.
 *
 * @param rawZoomValue - The raw, dimensionless zoom factor.
 * @param currentScope - The current active measurement scope.
 * @returns The zoom value scoped relative to `NEUTRAL_SCOPE`, branded as `ScopedZoomValue`.
 */
export const getScopedZoomValue = (
  rawZoomValue: number,
  currentScope: SupportedMeasures,
): ScopedZoomValue => {
  return getPrecisionValueForScope(rawZoomValue, currentScope, NEUTRAL_SCOPE) as ScopedZoomValue;
}

/**
 * Calculates the real-world length a scale bar represents on the screen.
 * `scaledZoom` is the value representing how many units of the current drawing scope one physical pixel covers.
 * Multiplying this by the pixel width of the scale bar gives its total real-world length.
 *
 * @param scaleBarPxWidth - The width of the scale bar in physical pixels on the screen.
 * @param scaledZoom - The current scaled zoom value (units of current drawing scope per physical pixel).
 * @returns The real-world length the scale bar represents, in the units of the `currentScope` implied by `scaledZoom`.
 */
export const getScaledBarZoomValue = (
  scaleBarPxWidth: number,
  scaledZoom: ScaledZoom
): ScaledZoom => {
  // scaledZoom is (units of currentScope / 1 physical pixel)
  // scaleBarPxWidth is (physical pixels)
  // result is (units of currentScope)
  return scaleBarPxWidth * scaledZoom as ScaledZoom;
}

/**
 * Calculates the `ScaledZoom` value for a given `scopedZoom` in a `currentScope`.
 * `scopedZoom` is the Z-axis zoom value in `currentScope` units, already relative to `NEUTRAL_SCOPE` (higher means more zoomed in).
 * `ScaledZoom` (the return value) represents the distance in `currentScope` units
 * that a single logical screen pixel covers on the X/Y drawing plane.
 * This value is determined by the `scopedZoom` (which reflects the Z-axis viewing
 * depth relative to `NEUTRAL_SCOPE`) and the `currentScope`.
 *
 * @param scopedZoom - The Z-axis zoom value, effectively `rawZoom` expressed in `NEUTRAL_SCOPE` units relative to `currentScope`.
 * @param currentScope - The current active measurement scope.
 * @returns The calculated `ScaledZoom` (units of `currentScope` per logical screen pixel).
 */
export const getScaledZoomValueForScope = (
  scopedZoom: ScopedZoomValue,
  currentScope: SupportedMeasures,
): ScaledZoom => {
  // Step 1: Convert scopedZoom back to the equivalent rawZoom.
  // scopedZoom = rawZoom * SF[currentScope] / SF[NEUTRAL_SCOPE]
  // actualRawZoom = scopedZoom * SF[NEUTRAL_SCOPE] / SF[currentScope]
  const actualRawZoom = getPrecisionValueForScope(scopedZoom, NEUTRAL_SCOPE, currentScope);

  // Handle edge case: If actualRawZoom is 0 (or non-finite), it implies maximum zoom-out.
  // In this scenario, 1 pixel covers a very large distance. We represent this large
  // distance in NEUTRAL_SCOPE using MAX_ZOOM (since 1/MIN_ZOOM_raw = MAX_ZOOM_distance).
  if (actualRawZoom === 0 || !isFinite(actualRawZoom)) {
    return getPrecisionValueForScope(MAX_ZOOM, NEUTRAL_SCOPE, currentScope) as ScaledZoom;
  }

  // Step 2: Calculate distance 1 logical pixel covers in NEUTRAL_SCOPE units.
  // This is 1 / actualRawZoom.
  const distanceInNeutralScope = 1 / actualRawZoom;

  // Step 3: Convert this distance to currentScope units.
  // Clamp the distanceInNeutralScope to ensure it's within valid MIN/MAX zoom bounds
  // before converting, to prevent extreme values if actualRawZoom was very small/large.
  return getPrecisionValueForScope(clampZoom(distanceInNeutralScope), NEUTRAL_SCOPE, currentScope) as ScaledZoom;
}

/**
 * Calculates the raw, dimensionless zoom factor from a `ScaledZoom` value.
 * `ScaledZoom` represents the distance in `currentScope` units that a single
 * logical screen pixel covers on the drawing plane.
 * This function is the inverse of `getScaledZoomValueForScope`.
 *
 * @param scaledZoom - The scaled zoom value (units of `currentScope` per logical screen pixel on the drawing).
 * @param currentScope - The scope (unit) in which `scaledZoom` is expressed.
 * @returns The raw, dimensionless zoom factor, clamped within MIN_ZOOM and MAX_ZOOM.
 */
export const getRawZoomFromScaledZoom = (
  scaledZoom: ScaledZoom,
  currentScope: SupportedMeasures,
): RawValue => {
  // Handle edge case: If scaledZoom is 0, it means 1 pixel covers 0 distance.
  // This implies infinite zoom-in.
  if (scaledZoom === 0 || !isFinite(scaledZoom)) {
    return MAX_ZOOM as RawValue;
  }

  // Step 1: Convert scaledZoom (distance in currentScope) to its equivalent distance in NEUTRAL_SCOPE.
  // distanceInNeutralScope = scaledZoom * SF[currentScope] / SF[NEUTRAL_SCOPE]
  const distanceInNeutralScope = getPrecisionValueForScope(scaledZoom, currentScope, NEUTRAL_SCOPE);

  // Handle edge case: If the converted distance in neutral scope is 0.
  // This could happen if scaledZoom was extremely small and precision was lost,
  // or if currentScope is vastly different from NEUTRAL_SCOPE.
  // If 1 pixel covers 0 neutral distance, it implies infinite zoom-in.
  if (distanceInNeutralScope === 0 || !isFinite(distanceInNeutralScope)) {
    return MAX_ZOOM as RawValue;
  }

  // Step 2: Calculate rawZoom.
  // Since distanceInNeutralScope = 1 / rawZoom, then rawZoom = 1 / distanceInNeutralScope.
  const rawZoom = 1 / distanceInNeutralScope;

  // Step 3: Clamp the result to ensure it's a valid zoom value.
  return clampZoom(rawZoom) as RawValue;
}


export const getScopedBezierPointFromDucPoint = (point: DucPoint): GeometricPoint => {
  return {
    ...point,
    x: point.x.scoped,
    y: point.y.scoped,
  };
};

export const getPrecisionPointsFromScoped = (points: GeometricPoint[], targetScope: SupportedMeasures, currentScope: SupportedMeasures): DucPoint[] => {
  return points.map(point => ({
    x: getPrecisionValueFromScoped(point.x as ScopedValue, targetScope, currentScope),
    y: getPrecisionValueFromScoped(point.y as ScopedValue, targetScope, currentScope),
  }));
}