import { getPrecisionValueFromRaw } from "../technical";
import { Scope } from "../types";
import { isPrecisionValue } from "../types/typeChecks";

/**
 * Recursively traverses and updates all PrecisionValue fields in an object
 * If providedScope is not specified, it will be detected from the data:
 * - Uses 'scope' or 'mainScope' fields at the root level
 * - For elements in arrays with their own 'scope' field, uses that element's scope
 *
 * This function is particularly useful for converting DUC data between different
 * measurement scopes, such as when elements need to be converted from their
 * original scope to a target scope (e.g., 'mm' to 'in').
 *
 * When processing arrays of elements (e.g., an 'elements' array), each element
 * will be processed using its individual scope if available, falling back to
 * the provided or detected scope.
 *
 * @param obj - The object to traverse and update
 * @param targetScope - The target scope to convert PrecisionValues to
 * @param providedScope - Optional scope to use if none can be detected
 * @param visited - Internal WeakSet to prevent circular references
 * @param detectedScope - Internally tracked scope for the current level
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

      // Check if this array element has its own scope field (for DucElement types)
      // This handles arrays of elements where each element can have its own scope
      if (element && typeof element === 'object' && !Array.isArray(element)) {
        // Use the 'in' operator to safely check for the scope property
        if ('scope' in element && element.scope && typeof element.scope === 'string') {
          elementScope = element.scope as Scope;
        }
      }

      // If the element is a special object (not plain Object), return it as-is
      if (element && typeof element === 'object' && element.constructor !== Object && !Array.isArray(element)) {
        newArray[i] = element;
      } else {
        newArray[i] = traverseAndUpdatePrecisionValues(
          element,
          targetScope,
          elementScope,
          visited,
        );
      }
    }
    return newArray;
  }
  
  // Handle objects - create a new object with updated values
  if (obj.constructor !== Object) {
    return obj;
  }
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = traverseAndUpdatePrecisionValues(
        obj[key],
        targetScope,
        providedScope,
        visited,
        currentScope
      );
    }
  }
  
  return result;
};