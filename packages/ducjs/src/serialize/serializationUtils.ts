import { PrecisionValue } from 'ducjs/types';

/**
 * Ensures that a given number is finite. If not, returns a default value.
 * This is primarily for internal use within serialization helpers like getPrecisionValueField,
 * or for values that are not expected to be pre-sanitized by the restore phase.
 */
const ensureFiniteNumber = (num: number | undefined, defaultValue: number = 0): number => {
  if (typeof num === 'number' && Number.isFinite(num)) {
    return num;
  }
  return defaultValue;
};

/**
 * Safely extracts the .value or .scoped field from a PrecisionValue object,
 * ensuring the result is a finite number.
 * @param pv The PrecisionValue object.
 * @param scoped If true, uses pv.scoped; otherwise, uses pv.value.
 * @param defaultValue The default value to return if pv is undefined or the extracted value is not finite.
 * @returns A finite number.
 */
export const getPrecisionValueField = (pv: PrecisionValue | undefined, scoped: boolean, defaultValue: number = 0): number => {
  if (!pv) {
    return defaultValue;
  }
  const val = scoped ? pv.scoped : pv.value;
  return ensureFiniteNumber(val, defaultValue);
};


export { ensureFiniteNumber }; 