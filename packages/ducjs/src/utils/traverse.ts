import { getPrecisionValueFromRaw } from "../technical";
import { Scope } from "../types";
import { isPrecisionValue } from "../types/typeChecks";

/**
 * Recursively traverses and updates all PrecisionValue fields in an object
 * If providedScope is not specified, it will be detected from the data:
 * - Uses 'scope' or 'mainScope' fields at the root level
 * - For elements in lists with their own 'scope' field, uses that element's scope
 */
export const traverseAndUpdatePrecisionValues = (
  obj: any,
  targetScope: Scope,
  providedScope?: Scope,
  visited = new WeakSet(),
  detectedScope?: Scope
): any => {
  // Handle null/undefined
  if (obj == null) return obj;
  
  // Handle primitives
  if (typeof obj !== 'object') return obj;
  
  // Prevent circular references
  if (visited.has(obj)) return obj;
  visited.add(obj);
  
  // Determine the scope to use for this level
  let currentScope = providedScope || detectedScope;
  
  // If no scope is determined yet, try to detect it from the current object
  if (!currentScope && !Array.isArray(obj)) {
    if (obj.scope && typeof obj.scope === 'string') {
      currentScope = obj.scope as Scope;
    } else if (obj.mainScope && typeof obj.mainScope === 'string') {
      currentScope = obj.mainScope as Scope;
    }
  }
  
  // Check if this is a PrecisionValue
  if (isPrecisionValue(obj)) {
    if (!currentScope) {
      throw new Error('No scope could be determined for PrecisionValue conversion');
    }
    return getPrecisionValueFromRaw(obj.value, currentScope, targetScope);
  }
  
  // Handle arrays - special case for elements with their own scope
  if (Array.isArray(obj)) {
    const newArray = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      const element = obj[i];
      let elementScope = currentScope;
      
      // Check if this array element has its own scope field
      if (element && typeof element === 'object' && !Array.isArray(element)) {
        if (element.scope && typeof element.scope === 'string') {
          elementScope = element.scope as Scope;
        }
      }
      
      newArray[i] = traverseAndUpdatePrecisionValues(
        element,
        targetScope,
        providedScope, // Pass the original providedScope
        visited,
        elementScope // Pass the detected/element scope
      );
    }
    return newArray;
  }
  
  // Handle objects - create a new object with updated values
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip 'scope' and 'mainScope' fields to avoid updating them
      if (key === 'scope' || key === 'mainScope') {
        result[key] = obj[key];
      } else {
        result[key] = traverseAndUpdatePrecisionValues(
          obj[key],
          targetScope,
          providedScope, // Pass the original providedScope
          visited,
          currentScope // Pass the current detected scope
        );
      }
    }
  }
  
  return result;
};