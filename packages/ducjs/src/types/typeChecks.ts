import { PrecisionValue } from ".";

/**
 * Type guard to check if an object is a PrecisionValue
 */
export const isPrecisionValue = (obj: any): obj is PrecisionValue => {
  return obj !== null && 
         typeof obj === 'object' &&
         typeof obj.value === 'number' &&
         typeof obj.scoped === 'number' &&
         Object.keys(obj).length === 2;
}