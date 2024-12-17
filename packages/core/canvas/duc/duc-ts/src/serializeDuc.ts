import * as flatbuffers from 'flatbuffers';
import { AppState as BinAppState, BinaryFiles as BinBinaryFiles, ExportedDataState, BinaryFilesEntry, BinaryFileData, DucElement as BinDucElement } from '../duc';
import { fileSave } from '../../../data/filesystem';
import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, EXPORT_SOURCE, MIME_TYPES, VERSIONS } from '../../../constants';
import { DucElement } from '../../../element/types';
import { AppState, BinaryFiles } from '../../../types';
import { serializeDucElement } from './serialize/serializeElementFromDuc';
import { serializeAppState } from './serialize/serializeAppStateFromDuc';
import { serializeBinaryFiles } from './serialize/serializeBinaryFilesFromDuc';
import { restore } from '../../../data/restore';

export const serializeAsFlatBuffers = async (
  elements: readonly DucElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): Promise<Uint8Array> => {
  const builder = new flatbuffers.Builder(1024);

  const sanitized = restore(
    {
      elements,
      appState,
      files,
    }, null, null, {
      refreshDimensions: false,
    }
  );

  // Serialize elements
  const elementOffsets = sanitized.elements.map((element) => {
    return serializeDucElement(builder, element);
  });
  const elementsOffset = ExportedDataState.createElementsVector(builder, elementOffsets);

  // Serialize appState
  const appStateOffset = serializeAppState(builder, sanitized.appState);

  // Serialize files
  const binaryFilesOffset = serializeBinaryFiles(builder, sanitized.files);

  // Serialize ExportedDataState
  const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
  const sourceOffset = builder.createString(EXPORT_SOURCE);

  ExportedDataState.startExportedDataState(builder);
  ExportedDataState.addType(builder, typeOffset);
  ExportedDataState.addVersion(builder, VERSIONS.duc);
  ExportedDataState.addSource(builder, sourceOffset);
  ExportedDataState.addElements(builder, elementsOffset);
  ExportedDataState.addAppState(builder, appStateOffset);
  ExportedDataState.addFiles(builder, binaryFilesOffset);
  const exportedDataStateOffset = ExportedDataState.endExportedDataState(builder);

  builder.finish(exportedDataStateOffset);

  return builder.asUint8Array();
};


export const saveAsFlatBuffers = async (
  elements: readonly DucElement[],
  appState: AppState,
  files: BinaryFiles,
  name: string = DEFAULT_FILENAME,
) => {
  try {
    const serialized = await serializeAsFlatBuffers(elements, appState, files);
    const blob = new Blob([serialized], {
      type: MIME_TYPES.duc,
    });
  
    const fileHandle = await fileSave(blob, {
      name,
      extension: "duc",
      description: "Duc file",
    });
    return { fileHandle };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to save file");
  }
};