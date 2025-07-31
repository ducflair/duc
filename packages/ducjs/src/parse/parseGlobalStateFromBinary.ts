import { DucGlobalState as BinDucGlobalState } from "ducjs/duc";
import { DucGlobalState, ScaleFactor, Scope } from "ducjs/types";
import { NEUTRAL_SCOPE } from "ducjs/technical/scopes";

/**
 * Parses a DucGlobalState from FlatBuffers binary data.
 * 
 * @param globalState - The FlatBuffers DucGlobalState object to parse
 * @returns A partial DucGlobalState object with the parsed data
 */
export function parseGlobalStateFromBinary(globalState: BinDucGlobalState | null): DucGlobalState | null {
  if (!globalState) {
    return null;
  }
  
  const name = globalState.name();
  const viewBackgroundColor = globalState.viewBackgroundColor();
  const mainScope = globalState.mainScope();
  const dashSpacingScale = globalState.dashSpacingScale();
  const isDashSpacingAffectedByViewportScale = globalState.isDashSpacingAffectedByViewportScale();
  
  return {
    name: name ?? null,
    viewBackgroundColor: viewBackgroundColor!,
    mainScope: (mainScope as Scope) || NEUTRAL_SCOPE,
    dashSpacingScale: dashSpacingScale as ScaleFactor,
    isDashSpacingAffectedByViewportScale,
    
    scopeExponentThreshold: globalState.scopeExponentThreshold(),
    dimensionsAssociativeByDefault: globalState.dimensionsAssociativeByDefault(),
    useAnnotativeScaling: globalState.useAnnotativeScaling(),
    displayPrecision: {
      linear: globalState.displayPrecisionLinear(),
      angular: globalState.displayPrecisionAngular()
    }
  };
}
