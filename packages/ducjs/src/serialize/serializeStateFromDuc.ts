import { DucGlobalState, DucLocalState } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

const serializeLocalState = (
  builder: flatbuffers.Builder, 
  localState: Partial<DucLocalState>
): flatbuffers.Offset => {


  return BinDucLocalState.endDucLocalState(builder);
};

const serializeGlobalState = (
  builder: flatbuffers.Builder, 
  globalState: Partial<DucGlobalState>
): flatbuffers.Offset => {

  return BinDucGlobalState.endDucGlobalState(builder);
};

export { serializeLocalState, serializeGlobalState };
