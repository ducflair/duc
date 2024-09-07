import * as flatbuffers from 'flatbuffers';
import { ExportedDataState, AppState as BinAppState } from '../ducfig';
import { AppState, BinaryFiles } from '../../../types';
import { parseAppStateFromBinary } from './parseAppStateFromBinary';

export const parseDucFlatBuffers = async (blob: Blob | File): Promise<{
  appState: Partial<AppState>;
}> => {
  const arrayBuffer = await blob.arrayBuffer();
  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  const data = ExportedDataState.getRootAsExportedDataState(byteBuffer);

  // Parse appState
  const appState: Partial<AppState> = parseAppStateFromBinary(data.appState());

  return { appState };
};
