export * from "./serializationUtils";
export * from "./serializeBlockFromDuc";
export * from "./serializeElementFromDuc";
export * from "./serializeExternalFilesFromDuc";
export * from "./serializeGroupFromDuc";
export * from "./serializeStateFromDuc";
export * from "./serializeDucStackBase";
export * from "./serializeDucStackLikeStyles";
export * from "./serializeRegionFromDuc";
export * from "./serializeLayerFromDuc";
export * from "./serializeStandardFromDuc";
export * from "./serializeDictionaryFromDuc";
export * from "./serializeGlobalStateFromDuc";
export * from "./serializeVersionGraphFromDuc";

import {
  ExportedDataState,
} from 'ducjs/duc';
import { restore } from 'ducjs/restore/restoreDataState';
import { serializeDucBlock } from 'ducjs/serialize/serializeBlockFromDuc';
import { serializeDictionaryFromDuc } from 'ducjs/serialize/serializeDictionaryFromDuc';
import { serializeDucElement } from 'ducjs/serialize/serializeElementFromDuc';
import { serializeExternalFiles } from "ducjs/serialize/serializeExternalFilesFromDuc";
import { serializeGlobalStateFromDuc } from 'ducjs/serialize/serializeGlobalStateFromDuc';
import { serializeDucGroup } from 'ducjs/serialize/serializeGroupFromDuc';
import { serializeLayerFromDuc } from 'ducjs/serialize/serializeLayerFromDuc';
import { serializeRegionFromDuc } from 'ducjs/serialize/serializeRegionFromDuc';
import { serializeStandardFromDuc } from 'ducjs/serialize/serializeStandardFromDuc';
import { serializeLocalState } from 'ducjs/serialize/serializeStateFromDuc';
import { serializeVersionGraphFromDuc } from 'ducjs/serialize/serializeVersionGraphFromDuc';
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
  const sourceOffset = builder.createString(window.location.origin ?? null!);
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

  // Serialize regions
  const regionsOffset = (sanitized.regions && sanitized.regions.length > 0)
    ? ExportedDataState.createRegionsVector(builder, sanitized.regions.map(region => serializeRegionFromDuc(builder, region)))
    : null;

  // Serialize layers
  const layersOffset = (sanitized.layers && sanitized.layers.length > 0)
    ? ExportedDataState.createLayersVector(builder, sanitized.layers.map(layer => serializeLayerFromDuc(builder, layer)))
    : null;

  // Serialize standards
  const standardsOffset = (sanitized.standards && sanitized.standards.length > 0)
    ? ExportedDataState.createStandardsVector(builder, sanitized.standards.map(standard => serializeStandardFromDuc(builder, standard)))
    : null;

  // Serialize dictionary
  const dictionaryOffset = (sanitized.dictionary && Object.keys(sanitized.dictionary).length > 0)
    ? serializeDictionaryFromDuc(builder, sanitized.dictionary)
    : null;

  // Serialize duc_global_state
  const ducGlobalStateOffset = sanitized.globalState
    ? serializeGlobalStateFromDuc(builder, sanitized.globalState)
    : null;

  // Serialize version_graph
  const versionGraphOffset = sanitized.versionGraph
    ? serializeVersionGraphFromDuc(builder, sanitized.versionGraph)
    : null;

  // Serialize thumbnail (as byte vector if present)
  const thumbnailOffset = sanitized.thumbnail
    ? builder.createByteVector(sanitized.thumbnail)
    : null;

  ExportedDataState.startExportedDataState(builder);
  ExportedDataState.addType(builder, typeOffset);
  ExportedDataState.addVersion(builder, versionOffset);
  ExportedDataState.addSource(builder, sourceOffset);
  ExportedDataState.addElements(builder, elementsOffset);
  ExportedDataState.addDucLocalState(builder, localStateOffset);
  ExportedDataState.addExternalFiles(builder, externalFilesOffset);
  if (blocksOffset) {
    ExportedDataState.addBlocks(builder, blocksOffset);
  }
  if (groupsOffset) {
    ExportedDataState.addGroups(builder, groupsOffset);
  }
  if (regionsOffset) {
    ExportedDataState.addRegions(builder, regionsOffset);
  }
  if (layersOffset) {
    ExportedDataState.addLayers(builder, layersOffset);
  }
  if (standardsOffset) {
    ExportedDataState.addStandards(builder, standardsOffset);
  }
  if (dictionaryOffset) {
    ExportedDataState.addDictionary(builder, dictionaryOffset);
  }
  if (ducGlobalStateOffset) {
    ExportedDataState.addDucGlobalState(builder, ducGlobalStateOffset);
  }
  if (versionGraphOffset) {
    ExportedDataState.addVersionGraph(builder, versionGraphOffset);
  }
  if (thumbnailOffset) {
    ExportedDataState.addThumbnail(builder, thumbnailOffset);
  }
  const exportedDataStateOffset = ExportedDataState.endExportedDataState(builder);

  builder.finish(exportedDataStateOffset, "DUC_");

  return builder.asUint8Array();
};