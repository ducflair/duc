export * from "./serializeAppStateFromDuc";
export * from "./serializeElementFromDuc";
export * from "./serializeBinaryFilesFromDuc";
export * from "./serializeRendererStateFromDuc";
export * from "./serializeGroupFromDuc";
export * from "./serializeBlockFromDuc";
export * from "./serializationUtils";

import * as flatbuffers from 'flatbuffers';
import {
  ExportedDataState,
} from 'ducjs/duc';
import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, MIME_TYPES } from 'ducjs/utils/constants';
import { DucBlock, DucElement, DucGroup, OrderedDucElement } from 'ducjs/types/elements';
import { BinaryFiles, RendererState, DucState } from 'ducjs/types';
import { serializeDucElement } from 'ducjs/serialize/serializeElementFromDuc';
import { serializeAppState } from 'ducjs/serialize/serializeAppStateFromDuc';
import { serializeBinaryFiles } from 'ducjs/serialize/serializeBinaryFilesFromDuc';
import { restore, ExtendedAppStateRestorer, noopExtendedAppStateRestorer } from 'ducjs/utils/restore';
import { serializeRendererState } from 'ducjs/serialize/serializeRendererStateFromDuc';
import { serializeDucBlock } from 'ducjs/serialize/serializeBlockFromDuc';
import { serializeDucGroup } from 'ducjs/serialize/serializeGroupFromDuc';

export const DUC_SCHEMA_VERSION = process.env.DUC_SCHEMA_VERSION || "0.0.0";

export const serializeAsFlatBuffers = async (
  elements: readonly DucElement[],
  ducState: Partial<DucState>,
  files: BinaryFiles,
  blocks: readonly DucBlock[],
  groups: readonly DucGroup[],
  rendererState?: RendererState,
  extendedAppStateRestorer: ExtendedAppStateRestorer<DucState> = noopExtendedAppStateRestorer,
): Promise<Uint8Array> => {
  const builder = new flatbuffers.Builder(1024);

  const sanitized = restore(
    {
      elements,
      appState: ducState,
      files,
      blocks,
      groups,
      rendererState,
    },
    null, // localExtendedAppState
    null, // localElements
    extendedAppStateRestorer,
    {
      refreshDimensions: false,
      syncInvalidIndices: (elements) => elements as OrderedDucElement[],
    }
  );

  const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
  const sourceOffset = builder.createString(window.location.origin ?? "Unknown");
  const versionOffset = builder.createString(DUC_SCHEMA_VERSION);
  
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
  ExportedDataState.addVersion(builder, versionOffset);
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