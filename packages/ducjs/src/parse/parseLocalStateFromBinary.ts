import { DucLocalState as BinDucLocalState } from "ducjs/duc";
import { parseElementBackgroundFromBinary, parseElementStrokeFromBinary } from "ducjs/parse/parseElementStyleFromBinary";
import { getPrecisionValueFromRaw, NEUTRAL_SCOPE, SupportedMeasures } from "ducjs/technical/scopes";
import { DucLocalState, NormalizedZoomValue, Percentage, RawValue, Scope, Zoom } from "ducjs/types";

/**
 * Parses a DucLocalState from FlatBuffers binary data.
 * 
 * @param localState - The FlatBuffers DucLocalState object to parse
 * @param version - The version of the data format
 * @returns A complete DucLocalState object with parsed data and defaults
 */
export function parseLocalStateFromBinary(localState: BinDucLocalState | null, version: string): DucLocalState | null {
  // Default values for required properties
  if (!localState) { return null; }
      
  // Parse the scope, ensuring it's always defined
  const parsedScope: Scope = (localState.scope() as SupportedMeasures) || NEUTRAL_SCOPE;
  
  // In a full implementation, we would parse the local state details from the FlatBuffers object
  // For now, we'll return an object with default values
  return {
    scope: parsedScope,
    activeStandardId: localState.activeStandardId()!,
    scrollX: getPrecisionValueFromRaw(localState.scrollX() as RawValue, parsedScope, parsedScope),
    scrollY: getPrecisionValueFromRaw(localState.scrollY() as RawValue, parsedScope, parsedScope),
    zoom: {
      value: localState.zoom() as NormalizedZoomValue,
    } as Zoom,
    activeGridSettings: localState.activeGridSettingsLength() > 0 ? 
      Array.from({length: localState.activeGridSettingsLength()}, (_, i) => localState.activeGridSettings(i)) : null,
    activeSnapSettings: localState.activeSnapSettings() ? localState.activeSnapSettings() : null,
    isBindingEnabled: localState.isBindingEnabled() ? localState.isBindingEnabled() : true,
    currentItemStroke: parseElementStrokeFromBinary(localState.currentItemStroke(), parsedScope)!,
    currentItemBackground: parseElementBackgroundFromBinary(localState.currentItemBackground())!,
    currentItemOpacity: localState.currentItemOpacity() as Percentage,
    currentItemFontFamily: localState.currentItemFontFamily() as any, // FIXME: in the future when we handle fonts better, come back and fix this
    currentItemFontSize: getPrecisionValueFromRaw(localState.currentItemFontSize() as RawValue, parsedScope, parsedScope),
    currentItemTextAlign: localState.currentItemTextAlign()!,
    currentItemStartLineHead: localState.currentItemStartLineHead()!.type(),
    currentItemEndLineHead: localState.currentItemEndLineHead()!.type(),
    currentItemRoundness: getPrecisionValueFromRaw(localState.currentItemRoundness() as RawValue, parsedScope, parsedScope),
    
    // These properties don't exist in FlatBuffers schema (deprecated), using defaults
    gridSize: 0,
    gridStep: 0,
    
    penMode: localState.penMode(),
    viewModeEnabled: localState.viewModeEnabled(),
    objectsSnapModeEnabled: localState.objectsSnapModeEnabled(),
    gridModeEnabled: localState.gridModeEnabled(),
    outlineModeEnabled: localState.outlineModeEnabled()
  };
}
