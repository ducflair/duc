import { PrecisionValue } from 'ducjs/types';

/**
 * Ensures that a given number is finite. If not, returns null to indicate
 * that the value should not be serialized (preserving "as-is" behavior).
 * This is primarily for internal use within serialization helpers like getPrecisionValueField,
 * or for values that are not expected to be pre-sanitized by the restore phase.
 */
const ensureFiniteNumber = (num: number | undefined): number | null => {
  if (typeof num === 'number' && Number.isFinite(num)) {
    return num;
  }
  return null;
};

/**
 * Safely extracts the .value or .scoped field from a PrecisionValue object,
 * ensuring the result is a finite number.
 * @param pv The PrecisionValue object.
 * @param scoped If true, uses pv.scoped; otherwise, uses pv.value.
 * @returns A finite number or null if the value should not be serialized.
 */
const getPrecisionValueField = (pv: PrecisionValue | undefined, scoped: boolean): number | null => {
  if (!pv) {
    return null;
  }
  const val = scoped ? pv.scoped : pv.value;
  return ensureFiniteNumber(val);
};

export { ensureFiniteNumber, getPrecisionValueField };
