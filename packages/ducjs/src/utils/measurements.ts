import { DucElement } from "ducjs/types/elements";
import {
  calculateScope,
  CombinedMeasure,
  getTranslationFactor,
  ImperialMeasure,
  imperialMeasures,
  MetricMeasure,
  metricMeasures,
  ScaleFactors,
  SupportedMeasures
} from "ducjs/utils/scopes";

export { imperialMeasures, metricMeasures, ScaleFactors };
export type { CombinedMeasure, ImperialMeasure, MetricMeasure, SupportedMeasures };

/**
 * Gets translation factor between current scope and element scope
 */
export function getElementTranslationFactor(
  currentScope: CombinedMeasure,
  elementScope: CombinedMeasure
): number {
  return getTranslationFactor(elementScope, currentScope);
}

/**
 * Gets the appropriate unit for the current zoom level
 * 
 * @param zoom - Current zoom level
 * @param mainMeasure - Main/base measurement unit
 * @param scopeExpThreshold - Controls the sensitivity of precision scope changes
 * @returns The most appropriate measurement unit for the current zoom
 */
export function getPrecisionScope(
  zoom: number,
  mainMeasure: SupportedMeasures,
  scopeExpThreshold: number,
): SupportedMeasures {
  return calculateScope(zoom, scopeExpThreshold, mainMeasure);
}

export const coordinateToRealMeasure = (
  coordinate: number,
  currentScope: CombinedMeasure,
  elementScope: CombinedMeasure
): number => {
  const translationFactor = getElementTranslationFactor(
    currentScope,
    elementScope
  );

  // 100 grid units is 1,00 real unit
  return coordinate * translationFactor / 100;
}

export const realMeasureToCoordinate = (
  realMeasure: number,
  gridUnit: number,
) => {
  // x grid units * 100 = 1,00 real unit
  return realMeasure * 10 * gridUnit;
}


export function filterElementsByScope<T extends DucElement>(
  elements: readonly T[],
  currentScope: CombinedMeasure,
): T[] {
  return elements.filter((element) => element.scope === currentScope);
}

/**
 * Calculates the approximate size of a single physical device pixel in millimeters.
 *
 * This calculation is based on the standard CSS definition of a reference pixel
 * (1/96th of an inch) and the current devicePixelRatio of the window.
 *
 * It reflects the effective size of the smallest addressable pixel by the browser,
 * considering screen density and browser/OS zoom levels.
 *
 * @returns {number} The approximate size of a physical pixel in millimeters.
 * Returns NaN if window or window.devicePixelRatio is not available (e.g., in a Node.js environment).
 */
export const getPhysicalDevicePixelSizeInMm = (): number => {
  // Check if running in a browser environment where window and devicePixelRatio are available
  if (typeof window === 'undefined' || typeof window.devicePixelRatio === 'undefined') {
    console.warn('window.devicePixelRatio is not available. This function should be run in a browser environment.');
    return NaN; // Not applicable or calculable outside a browser context
  }

  // Standard conversion: 1 inch = 25.4 millimeters
  const mmPerInch: number = 25.4;

  // Standard CSS pixels per inch (W3C reference pixel definition)
  const cssPixelsPerInch: number = 96;

  // Calculate the conceptual size of one CSS pixel in millimeters.
  // This is the physical size a CSS pixel would ideally occupy if devicePixelRatio were 1.
  const cssPixelSizeInMm: number = mmPerInch / cssPixelsPerInch;

  // Get the current device pixel ratio from the window.
  // This value accounts for the screen's native density and any browser or OS zoom applied.
  const currentDevicePixelRatio: number = window.devicePixelRatio;

  // The size of a single physical pixel is the conceptual size of a CSS pixel
  // divided by the devicePixelRatio. This is because devicePixelRatio indicates
  // how many physical pixels are used to render one CSS pixel in each dimension.
  const physicalPixelSizeInMm: number = cssPixelSizeInMm / currentDevicePixelRatio;

  return physicalPixelSizeInMm;
}