import * as flatbuffers from 'flatbuffers';
import { BinaryFiles as BinBinaryFiles, ExportedDataState, BinaryFilesEntry, BinaryFileData, UserToFollow, DucElement as BinDucElement } from '../duc';
import { fileSave } from '../../../data/filesystem';
import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, EXPORT_SOURCE, MIME_TYPES, VERSIONS } from '../../../constants';
import { cleanAppStateForExport } from '../../../appState';
import { DucElement } from '../../../element/types';
import { AppState, BinaryFiles } from '../../../types';
import { serializeDucElement } from './ducElementSerialize';
import { serializeBinaryFiles } from './binaryFilesSerialize';
import { serializeDucGroup } from './groupSerialize';

export const serializeAsFlatBuffers = (
  elements: readonly DucElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
  type: "local" | "database",
): Uint8Array => {
  const builder = new flatbuffers.Builder(1024);

  // Serialize elements
  const elementOffsets = elements.map((element) => {
    return serializeDucElement(builder, element);
  });
  const elementsOffset = ExportedDataState.createElementsVector(builder, elementOffsets);

  // Serialize groups
  const groupOffsets = appState.groups && appState.groups.map((group) => {
    return serializeDucGroup(builder, group);
  });
  const groupsOffsets = ExportedDataState.createGroupsVector(builder, groupOffsets || []);

  // Serialize backgroundColor
  const backgroundColorOffset = builder.createString(appState.viewBackgroundColor);

  // Serialize files
  const binaryFilesOffset = serializeBinaryFiles(builder, files);
  
  // Serialize ExportedDataState
  const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
  const sourceOffset = builder.createString(EXPORT_SOURCE);
  
  
  ExportedDataState.startExportedDataState(builder);
  ExportedDataState.addType(builder, typeOffset);
  ExportedDataState.addVersion(builder, VERSIONS.excalidraw);
  ExportedDataState.addSource(builder, sourceOffset);
  ExportedDataState.addElements(builder, elementsOffset);
  ExportedDataState.addGroups(builder, groupsOffsets);
  ExportedDataState.addBackgroundColor(builder, backgroundColorOffset);
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
  const serialized = serializeAsFlatBuffers(elements, appState, files, "local");
  const blob = new Blob([serialized], {
    type: MIME_TYPES.duc,
  });

  const fileHandle = await fileSave(blob, {
    name,
    extension: "duc",
    description: "Duc file",
  });
  return { fileHandle };
};