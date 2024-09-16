import { DucElement, NonDeletedDucElement } from "../../element/types";
import { InteractiveSceneRenderConfig } from "../../scene/types";

export type SupportedMeasures = 
  MetricMeasure | 
  ImperialMeasure
;

export type MetricMeasure = 
  'ym' | // Yoctometer
  'zm' | // Zeptometer
  'am' | // Attometer
  'fm' | // Femtometer
  'pm' | // Picometer
  'nm' | // Nanometer
  'µm' | // Micrometer
  'mm' | // Millimeter
  'cm' | // Centimeter
  'dm' | // Decimeter
  'm' | // Meter
  'dam' | // Decameter
  'hm' | // Hectometer
  'km' | // Kilometer
  'Mm' | // Megameter
  'Gm' | // Gigameter
  'Tm' | // Terameter
  'Pm' | // Petameter
  'Em' | // Exameter
  'Zm' | // Zettameter
  'Ym'; // Yottameter

export type ImperialMeasure = 
  'in' | // Inches
  'ft' | // Feet
  'yd' | // Yards
  'mi' | // Miles
  'fur' | // Furlongs
  'ch' | // Chains
  'rd' | // Rods
  'ftm'; // Fathoms

export type CombinedMeasure = SupportedMeasures;

const ScaleFactors: { [key in CombinedMeasure]: number } = {
  // Metric scales
  ym: 1e-24,
  zm: 1e-21,
  am: 1e-18,
  fm: 1e-15,
  pm: 1e-12,
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
  // Imperial scales
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
  fur: 201.168,
  ch: 20.1168,
  rd: 5.0292,
  ftm: 1.8288,
};

export function getTranslationFactor(
  currentScope: CombinedMeasure,
  elementScope: CombinedMeasure
): number {
  const currentScale = ScaleFactors[currentScope];
  const elementScale = ScaleFactors[elementScope];

  return  elementScale / currentScale;
}

const MIN_SIZE = 0.01; // Minimum acceptable size
const MAX_SIZE = 10000; // Maximum acceptable size

export function adjustElementToCurrentScope<T extends DucElement>(
  element: T,
  currentScope: CombinedMeasure,
): T {
  if (element.scope === currentScope) {
    return element;
  }

  const translationFactor = getTranslationFactor(
    currentScope,
    element.scope,
  );

  let adjustedElement = {
    ...element,
    x: element.x * translationFactor,
    y: element.y * translationFactor,
    width: element.width * translationFactor,
    height: element.height * translationFactor,
    strokeWidth: element.strokeWidth * translationFactor,
  } as T;

  // Adjust points if the element has them
  if (
    element.type === "freedraw" ||
    element.type === "arrow" ||
    element.type === "line"
  ) {
    adjustedElement = {
      ...adjustedElement,
      points: element.points.map(([px, py]) => [
        px * translationFactor,
        py * translationFactor,
      ]),
    } as T;
  }

  // // Check if the adjusted element is too big or too small
  // const isTooSmall =
  //   Math.abs(adjustedElement.width) < MIN_SIZE ||
  //   Math.abs(adjustedElement.height) < MIN_SIZE;
  // const isTooBig =
  //   Math.abs(adjustedElement.width) > MAX_SIZE ||
  //   Math.abs(adjustedElement.height) > MAX_SIZE;

  // if (isTooSmall || isTooBig) {
  //   return null; // Exclude the element
  // }

  return adjustedElement;
}

export const coordinateToRealMeasure = (
  coordinate: number,
  currentScope: CombinedMeasure,
  elementScope: CombinedMeasure
): number => {
  const translationFactor = getTranslationFactor(
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




export const adjustElementsMapToCurrentScope = (
  elementsMap: Map<string, NonDeletedDucElement>, currentScope: CombinedMeasure
): Map<string, NonDeletedDucElement> => {
  const adjustedMap = new Map<string, NonDeletedDucElement>();

  elementsMap.forEach((element) => {
    const adjustedElement = adjustElementToCurrentScope(element, currentScope);
    if (adjustedElement && adjustedElement.id) {
      adjustedMap.set(adjustedElement.id, adjustedElement);
    }
  });

  return adjustedMap;
}

export function filterElementsByScope<T extends DucElement>(
  elements: readonly T[],
  currentScope: CombinedMeasure,
): T[] {
  return elements.filter((element) => element.scope === currentScope);
}
