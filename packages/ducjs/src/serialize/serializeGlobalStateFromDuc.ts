import { DucGlobalState as BinDucGlobalState } from 'ducjs/duc';
import type { DucGlobalState } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

export const serializeGlobalStateFromDuc = (
  builder: flatbuffers.Builder,
  globalState: DucGlobalState
): flatbuffers.Offset => {
  // Create string offsets for all string properties
  const nameOffset = globalState.name ? builder.createString(globalState.name) : null;
  const viewBackgroundColorOffset = builder.createString(globalState.viewBackgroundColor);
  const mainScopeOffset = builder.createString(globalState.mainScope);

  BinDucGlobalState.startDucGlobalState(builder);
  
  if (nameOffset) BinDucGlobalState.addName(builder, nameOffset);
  BinDucGlobalState.addViewBackgroundColor(builder, viewBackgroundColorOffset);
  BinDucGlobalState.addMainScope(builder, mainScopeOffset);
  BinDucGlobalState.addDashSpacingScale(builder, globalState.dashSpacingScale);
  BinDucGlobalState.addIsDashSpacingAffectedByViewportScale(builder, globalState.isDashSpacingAffectedByViewportScale);
  BinDucGlobalState.addScopeExponentThreshold(builder, globalState.scopeExponentThreshold);
  BinDucGlobalState.addDimensionsAssociativeByDefault(builder, globalState.dimensionsAssociativeByDefault);
  BinDucGlobalState.addUseAnnotativeScaling(builder, globalState.useAnnotativeScaling);
  BinDucGlobalState.addDisplayPrecisionLinear(builder, globalState.displayPrecision.linear);
  BinDucGlobalState.addDisplayPrecisionAngular(builder, globalState.displayPrecision.angular);

  return BinDucGlobalState.endDucGlobalState(builder);
};
