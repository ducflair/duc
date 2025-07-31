import { DucGlobalState as BinDucGlobalState, DucLocalState as BinDucLocalState } from 'ducjs/duc';
import { DucGlobalState, DucLocalState } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

const serializeLocalState = (
  builder: flatbuffers.Builder, 
  localState: Partial<DucLocalState>
): flatbuffers.Offset => {
  // Create basic string fields that exist in the schema
  const scopeOffset = localState.scope ? builder.createString(localState.scope) : null;

  // Start building the local state
  BinDucLocalState.startDucLocalState(builder);
  
  if (scopeOffset) BinDucLocalState.addScope(builder, scopeOffset);
  
  // Add numeric fields with defaults
  BinDucLocalState.addScrollX(builder, 0);
  BinDucLocalState.addScrollY(builder, 0);
  BinDucLocalState.addZoom(builder, 1.0);
  
  // Add boolean fields
  BinDucLocalState.addIsBindingEnabled(builder, false);
  BinDucLocalState.addCurrentItemOpacity(builder, 1.0);
  BinDucLocalState.addCurrentItemFontSize(builder, 12);
  BinDucLocalState.addCurrentItemRoundness(builder, 0);
  BinDucLocalState.addPenMode(builder, false);
  BinDucLocalState.addViewModeEnabled(builder, false);

  return BinDucLocalState.endDucLocalState(builder);
};

const serializeGlobalState = (
  builder: flatbuffers.Builder, 
  globalState: Partial<DucGlobalState>
): flatbuffers.Offset => {
  // For now, create a minimal global state implementation
  // TODO: Implement full global state serialization based on actual schema

  // Start building the global state
  BinDucGlobalState.startDucGlobalState(builder);

  return BinDucGlobalState.endDucGlobalState(builder);
};

export { serializeLocalState, serializeGlobalState };
