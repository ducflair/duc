import { SupportedMeasures, getPrecisionValueFromRaw } from "../technical";
import { isPrecisionValue } from "../types/typeChecks";

/**
 * Recursively traverses and updates all PrecisionValue fields in an object
 */
export const traverseAndUpdatePrecisionValues = (
  obj: any,
  providedScope: SupportedMeasures,
  targetScope: SupportedMeasures,
  visited = new WeakSet()
): any => {
  // Handle null/undefined
  if (obj == null) return obj;
  
  // Handle primitives
  if (typeof obj !== 'object') return obj;
  
  // Prevent circular references
  if (visited.has(obj)) return obj;
  visited.add(obj);
  
  // Check if this is a PrecisionValue
  if (isPrecisionValue(obj)) {
    return getPrecisionValueFromRaw(obj.value, providedScope, targetScope);
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const newArray = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      newArray[i] = traverseAndUpdatePrecisionValues(
        obj[i], 
        providedScope, 
        targetScope, 
        visited
      );
    }
    return newArray;
  }
  
  // Handle objects - create a new object with updated values
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip 'scope' field to avoid updating the element's scope property
      if (key === 'scope') {
        result[key] = obj[key];
      } else {
        result[key] = traverseAndUpdatePrecisionValues(
          obj[key], 
          providedScope, 
          targetScope, 
          visited
        );
      }
    }
  }
  
  return result;
};