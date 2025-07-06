import * as flatbuffers from 'flatbuffers';
import {
  ExportedDataState,
} from '@duc/canvas/duc/duc-ts/duc';
import { fileSave } from '@duc/canvas/data/filesystem';
import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, EXPORT_SOURCE, MIME_TYPES } from '@duc/canvas/utils/constants';
import { DucBlock, DucElement, DucGroup } from '@duc/canvas/element/types';
import { AppState, BinaryFiles, RendererState } from '@duc/canvas/types';
import { serializeDucElement } from '@duc/canvas/duc/duc-ts/src/serialize/serializeElementFromDuc';
import { serializeAppState } from '@duc/canvas/duc/duc-ts/src/serialize/serializeAppStateFromDuc';
import { serializeBinaryFiles } from '@duc/canvas/duc/duc-ts/src/serialize/serializeBinaryFilesFromDuc';
import { restore } from '@duc/canvas/data/restore';
import { serializeRendererState } from '@duc/canvas/duc/duc-ts/src/serialize/serializeRendererStateFromDuc';
import { serializeDucBlock } from '@duc/canvas/duc/duc-ts/src/serialize/serializeBlockFromDuc';
import { serializeDucGroup } from '@duc/canvas/duc/duc-ts/src/serialize/serializeGroupFromDuc';

export const DUC_SCHEMA_VERSION = process.env.DUC_SCHEMA_VERSION ? parseInt(process.env.DUC_SCHEMA_VERSION, 10) : 0;

export const serializeAsFlatBuffers = async (
  elements: readonly DucElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
  blocks: readonly DucBlock[],
  groups: readonly DucGroup[],
  rendererState?: RendererState,
): Promise<Uint8Array> => {
  const builder = new flatbuffers.Builder(1024);

  const sanitized = restore(
    {
      elements,
      appState,
      files,
      blocks,
      groups,
      rendererState,
    }, null, null, {
      refreshDimensions: false,
    }
  );

  const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
  const sourceOffset = builder.createString(EXPORT_SOURCE);
  
  // Serialize elements
  const elementOffsets = sanitized.elements.map((element) => {
    return serializeDucElement(builder, element, Boolean(rendererState));
  });
  const elementsOffset = ExportedDataState.createElementsVector(builder, elementOffsets);

  // Serialize appState
  const appStateOffset = serializeAppState(builder, sanitized.appState, Boolean(rendererState));

  // Serialize files
  const binaryFilesOffset = serializeBinaryFiles(builder, sanitized.files);

  // Serialize rendererState
  const rendererStateOffset = rendererState
    ? serializeRendererState(builder, rendererState)
    : null;

  // Serialize blocks
  const blocksOffset = sanitized.blocks.length > 0 
    ? ExportedDataState.createBlocksVector(builder, sanitized.blocks.map(block => serializeDucBlock(builder, block, Boolean(rendererState))))
    : null;

  // Serialize groups
  const groupsOffset = sanitized.groups.length > 0
    ? ExportedDataState.createGroupsVector(builder, sanitized.groups.map(group => serializeDucGroup(builder, group, Boolean(rendererState))))
    : null;

  ExportedDataState.startExportedDataState(builder);
  ExportedDataState.addType(builder, typeOffset);
  ExportedDataState.addVersion(builder, DUC_SCHEMA_VERSION);
  ExportedDataState.addSource(builder, sourceOffset);
  ExportedDataState.addElements(builder, elementsOffset);
  ExportedDataState.addAppState(builder, appStateOffset);
  ExportedDataState.addFiles(builder, binaryFilesOffset);
  if (rendererStateOffset) {
    ExportedDataState.addRendererState(builder, rendererStateOffset);
  }
  if (blocksOffset) {
    ExportedDataState.addBlocks(builder, blocksOffset);
  }
  if (groupsOffset) {
    ExportedDataState.addGroups(builder, groupsOffset);
  }
  const exportedDataStateOffset = ExportedDataState.endExportedDataState(builder);

  builder.finish(exportedDataStateOffset, "DUC_");

  return builder.asUint8Array();
};

export const saveAsFlatBuffers = async (
  elements: readonly DucElement[],
  appState: AppState,
  files: BinaryFiles,
  blocks: readonly DucBlock[],
  groups: readonly DucGroup[],
  name: string = DEFAULT_FILENAME,
  rendererState?: RendererState,
) => {
  try {
    const serialized = await serializeAsFlatBuffers(
      elements,
      appState,
      files,
      blocks,
      groups,
      rendererState,
    );
    const blob = new Blob([new Uint8Array(serialized)], {
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
    throw new Error("Failed to save file: " + (error instanceof Error ? error.message : String(error)));
  }
};