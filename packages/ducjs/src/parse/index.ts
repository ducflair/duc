export * from "./parseBlockFromBinary";
export * from "./parseDictionaryFromBinary";
export * from "./parseDucBlock";
export * from "./parseElementStyleFromBinary";
export * from "./parseElementFromBinary";
export * from "./parseExternalFilesFromBinary";
export * from "./parseGlobalStateFromBinary";
export * from "./parseGroupFromBinary";
export * from "./parseLayerFromBinary";
export * from "./parsePlotLayoutFromBinary";
export * from "./parseRegionFromBinary";
export * from "./parseStandardFromBinary";
export * from "./parseThumbnailFromBinary";
export * from "./parseVersionGraphFromBinary";

import { FileSystemHandle } from 'browser-fs-access';
import {
  ExportedDataState
} from 'ducjs/duc';
import { parseDucFlatBuffers as parseDucFlatBuffersV1 } from 'ducjs/legacy/v1/parse';
import { parseBlockFromBinary } from 'ducjs/parse/parseBlockFromBinary';
import { parseDictionaryFromBinary } from 'ducjs/parse/parseDictionaryFromBinary';
import { parseElementFromBinary } from 'ducjs/parse/parseElementFromBinary';
import { parseBinaryFilesFromBinary } from 'ducjs/parse/parseExternalFilesFromBinary';
import { parseGlobalStateFromBinary } from 'ducjs/parse/parseGlobalStateFromBinary';
import { parseGroupFromBinary } from 'ducjs/parse/parseGroupFromBinary';
import { parseLayerFromBinary } from 'ducjs/parse/parseLayerFromBinary';
import { parseLocalStateFromBinary } from 'ducjs/parse/parseLocalStateFromBinary';
import { parseRegionFromBinary } from 'ducjs/parse/parseRegionFromBinary';
import { parseStandardFromBinary } from 'ducjs/parse/parseStandardFromBinary';
import { parseThumbnailFromBinary } from 'ducjs/parse/parseThumbnailFromBinary';
import { parseVersionGraphFromBinary } from 'ducjs/parse/parseVersionGraphFromBinary';
import { restore, RestoredDataState } from 'ducjs/restore/restoreDataState';
import { Standard } from "ducjs/technical";
import { DucExternalFiles, DucGlobalState, DucLocalState } from 'ducjs/types';
import { DucBlock, DucElement, DucGroup, DucLayer, DucRegion, OrderedDucElement } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const parseDuc = async (
  blob: Blob | File, 
  fileHandle: FileSystemHandle | null = null
): Promise<RestoredDataState> => {
  const arrayBuffer = await blob.arrayBuffer();
  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  const data = ExportedDataState.getRootAsExportedDataState(byteBuffer);
  
  // TODO: For now don't touch, to be removed on a late duc v2 version
  const legacyVersion = data.versionLegacy();
  if(legacyVersion) {
    return parseDucFlatBuffersV1(blob, fileHandle) as unknown as RestoredDataState;
  }

  const version = data.version() || "0.0.0";

  const localState = data.ducLocalState();
  const parsedLocalState = localState && parseLocalStateFromBinary(localState, version ?? "");

  // Parse global state
  const globalState = data.ducGlobalState();
  const parsedGlobalState = parseGlobalStateFromBinary(globalState);

  // Parse elements
  const elements: Partial<DucElement>[] = [];
  for (let i = 0; i < data.elementsLength(); i++) {
    const e = data.elements(i);
    if(e) {
      const element = parseElementFromBinary(e, version);
      if (element) {
        elements.push(element);
      }
    }
  }

  // Parse files
  let parsedFiles: DucExternalFiles = {};
  for (let i = 0; i < data.externalFilesLength(); i++) {
    const externalFile = data.externalFiles(i);
    if (externalFile) {
      const parsedFile: DucExternalFiles = parseBinaryFilesFromBinary(externalFile);
      parsedFiles = { ...parsedFiles, ...parsedFile };
    }
  }

  // Parse blocks
  const blocks: DucBlock[] = [];
  for (let i = 0; i < data.blocksLength(); i++) {
    const block = data.blocks(i);
    if (block) {
      const parsedBlock = parseBlockFromBinary(block, version ?? "");
      if (parsedBlock) {
        blocks.push(parsedBlock as DucBlock);
      }
    }
  }

  // Parse groups
  const groups: DucGroup[] = [];  
  for (let i = 0; i < data.groupsLength(); i++) {
    const group = data.groups(i);
    if (group && parsedLocalState?.scope) {
      const parsedGroup = parseGroupFromBinary(group, parsedLocalState.scope);
      if (parsedGroup) {
        groups.push(parsedGroup as DucGroup);
      }
    }
  }

  // Parse dictionary
  const dictionary = parseDictionaryFromBinary(data);
  
  // Parse thumbnail
  const thumbnail = parseThumbnailFromBinary(data);
  
  // Parse version graph
  const versionGraphData = data.versionGraph();
  const versionGraph = parseVersionGraphFromBinary(versionGraphData);
  
  // Parse regions
  const regions: DucRegion[] = [];
  for (let i = 0; i < data.regionsLength(); i++) {
    const region = data.regions(i);
    if (region) {
      const parsedRegion = parseRegionFromBinary(region);
      if (parsedRegion) {
        regions.push(parsedRegion);
      }
    }
  }
  
  // Parse layers
  const layers: DucLayer[] = [];
  for (let i = 0; i < data.layersLength(); i++) {
    const layer = data.layers(i);
    if (layer && parsedLocalState?.scope) {
      const parsedLayer = parseLayerFromBinary(layer, parsedLocalState.scope);
      if (parsedLayer) {
        layers.push(parsedLayer);
      }
    }
  }
  
  // Parse standards
  const standards: Standard[] = [];
  for (let i = 0; i < data.standardsLength(); i++) {
    const standard = data.standards(i);
    if (standard) {
      const parsedStandard = parseStandardFromBinary(standard);
      if (parsedStandard) {
        standards.push(parsedStandard);
      }
    }
  }

  const sanitized = restore(
    {
      thumbnail,
      dictionary,
      elements: elements as DucElement[],
      ducLocalState: parsedLocalState!,
      ducGlobalState: parsedGlobalState!,
      blocks,
      groups,
      regions,
      layers,
      
      standards,
      files: parsedFiles,

      versionGraph: versionGraph ?? undefined,
    },
    { 
      syncInvalidIndices: (elements) => elements as OrderedDucElement[],
      repairBindings: true, 
      refreshDimensions: false,
    },
  );

  return {
    thumbnail: sanitized.thumbnail,
    dictionary: sanitized.dictionary,
    elements: sanitized.elements,
    localState: sanitized.localState,
    globalState: sanitized.globalState,
    files: sanitized.files,
    blocks: sanitized.blocks,
    groups: sanitized.groups,
    regions: sanitized.regions,
    layers: sanitized.layers,
    standards: sanitized.standards,
    versionGraph: sanitized.versionGraph,
  };
};
