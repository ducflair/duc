export * from "./serializationUtils";
export * from "./serializeBinaryFilesFromDuc";
export * from "./serializeBlockFromDuc";
export * from "./serializeElementFromDuc";
export * from "./serializeGroupFromDuc";
export * from "./serializeStateFromDuc";

import {
  ExportedDataState,
} from 'ducjs/duc';
import { serializeAppState } from 'ducjs/serialize/serializeAppStateFromDuc';
import { serializeBinaryFiles } from 'ducjs/serialize/serializeBinaryFilesFromDuc';
import { serializeDucBlock } from 'ducjs/serialize/serializeBlockFromDuc';
import { serializeDucElement } from 'ducjs/serialize/serializeElementFromDuc';
import { serializeDucGroup } from 'ducjs/serialize/serializeGroupFromDuc';
import { serializeRendererState } from 'ducjs/serialize/serializeRendererStateFromDuc';
import { Standard } from "ducjs/technical";
import { Dictionary, DucExternalFiles, DucGlobalState, DucLocalState, ImportedDataState, VersionGraph } from 'ducjs/types';
import { DucBlock, DucElement, DucGroup, DucLayer, DucRegion, OrderedDucElement } from 'ducjs/types/elements';
import { EXPORT_DATA_TYPES } from 'ducjs/utils/constants';
import { restore } from 'ducjs/utils/restore';
import * as flatbuffers from 'flatbuffers';

export const DUC_SCHEMA_VERSION = process.env.DUC_SCHEMA_VERSION || "0.0.0";

export const serializeDuc = async (
  data: ImportedDataState,
): Promise<Uint8Array> => {
  const builder = new flatbuffers.Builder(1024);

  const sanitized = restore(
    {
      elements,
      files,
      blocks,
      groups,
    },
    null, // localExtendedAppState
    null, // localElements
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