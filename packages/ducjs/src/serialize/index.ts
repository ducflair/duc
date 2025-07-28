export * from "./serializationUtils";
export * from "./serializeBlockFromDuc";
export * from "./serializeElementFromDuc";
export * from "./serializeExternalFilesFromDuc";
export * from "./serializeGroupFromDuc";
export * from "./serializeStateFromDuc";

import {
  ExportedDataState,
} from 'ducjs/duc';
import { restore } from 'ducjs/restore/restoreDataState';
import { serializeDucBlock } from 'ducjs/serialize/serializeBlockFromDuc';
import { serializeDucElement } from 'ducjs/serialize/serializeElementFromDuc';
import { serializeExternalFiles } from "ducjs/serialize/serializeExternalFilesFromDuc";
import { serializeDucGroup } from 'ducjs/serialize/serializeGroupFromDuc';
import { ImportedDataState } from 'ducjs/types';
import { OrderedDucElement } from 'ducjs/types/elements';
import { EXPORT_DATA_TYPES } from 'ducjs/utils/constants';
import * as flatbuffers from 'flatbuffers';

export const DUC_SCHEMA_VERSION = process.env.DUC_SCHEMA_VERSION || "0.0.0";

export const serializeDuc = async (
  data: ImportedDataState,
): Promise<Uint8Array> => {
  const builder = new flatbuffers.Builder(1024);

  const sanitized = restore(
    data,
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
    return serializeDucElement(builder, element);
  });
  const elementsOffset = ExportedDataState.createElementsVector(builder, elementOffsets);

  // Serialize localState
  const localStateOffset = serializeLocalState(builder, sanitized.localState);

  // Serialize files
  const externalFilesOffset = serializeExternalFiles(builder, sanitized.files);

  // Serialize blocks
  const blocksOffset = sanitized.blocks.length > 0 
    ? ExportedDataState.createBlocksVector(builder, sanitized.blocks.map(block => serializeDucBlock(builder, block)))
    : null;

  // Serialize groups
  const groupsOffset = sanitized.groups.length > 0
    ? ExportedDataState.createGroupsVector(builder, sanitized.groups.map(group => serializeDucGroup(builder, group)))
    : null;

  ExportedDataState.startExportedDataState(builder);
  ExportedDataState.addType(builder, typeOffset);
  ExportedDataState.addVersion(builder, versionOffset);
  ExportedDataState.addSource(builder, sourceOffset);
  ExportedDataState.addElements(builder, elementsOffset);
  ExportedDataState.addLocalState(builder, localStateOffset);
  ExportedDataState.addExternalFiles(builder, externalFilesOffset);
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