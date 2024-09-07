import * as flatbuffers from 'flatbuffers';
import { AppState as BinAppState, ExportedDataState, ActiveTool } from '../ducfig';
import { fileSave } from '../../../data/filesystem';
import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, EXPORT_SOURCE, MIME_TYPES, VERSIONS } from '../../../constants';
import { cleanAppStateForExport } from '../../../appState';
import { DucElement } from '../../../element/types';
import { AppState, BinaryFiles } from '../../../types';
import { serializeAppState } from './appStateSerialize';

export const serializeAsFlatBuffers = (
  elements: readonly DucElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
  type: "local" | "database",
): Uint8Array => {
  const builder = new flatbuffers.Builder(1024);

  

  // Serialize appState
  const appStateOffset = serializeAppState(builder, appState);

  // Serialize ExportedDataState
  const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
  const sourceOffset = builder.createString(EXPORT_SOURCE);

  ExportedDataState.startExportedDataState(builder);
  ExportedDataState.addType(builder, typeOffset);
  ExportedDataState.addVersion(builder, VERSIONS.excalidraw);
  ExportedDataState.addSource(builder, sourceOffset);
  ExportedDataState.addAppState(builder, appStateOffset);
  const exportedDataStateOffset = ExportedDataState.endExportedDataState(builder);

  builder.finish(exportedDataStateOffset);

  return builder.asUint8Array();
};


export const saveAsDucfig = async (
  elements: readonly DucElement[],
  appState: AppState,
  files: BinaryFiles,
  name: string = DEFAULT_FILENAME,
) => {
  const serialized = serializeAsFlatBuffers(elements, appState, files, "local");
  const blob = new Blob([serialized], {
    type: MIME_TYPES.ducfig,
  });

  const fileHandle = await fileSave(blob, {
    name,
    extension: "ducfig",
    description: "Duc Config file",
  });
  return { fileHandle };
};
