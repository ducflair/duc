export * from "./parseBinaryFilesFromBinary";
export * from "./parseBlockFromBinary";
export * from "./parseElementFromBinary";
export * from "./parseGroupFromBinary";


import { FileSystemHandle } from 'browser-fs-access';
import {
  ExportedDataState
} from 'ducjs/duc';
import { parseDucFlatBuffers as parseDucFlatBuffersV1 } from 'ducjs/legacy/v1/parse';
import { parseBlockFromBinary } from 'ducjs/parse/parseBlockFromBinary';
import { parseElementFromBinary } from 'ducjs/parse/parseElementFromBinary';
import { parseGroupFromBinary } from 'ducjs/parse/parseGroupFromBinary';
import { DucExternalFiles, DucLocalState } from 'ducjs/types';
import { DucBlock, DucElement, DucGroup, OrderedDucElement } from 'ducjs/types/elements';
import { restore, RestoredDataState } from 'ducjs/utils/restore';
import * as flatbuffers from 'flatbuffers';

export const parseDuc = async (
  blob: Blob | File, 
  fileHandle: FileSystemHandle | null = null
): Promise<RestoredDataState> => {
  const arrayBuffer = await blob.arrayBuffer();
  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  const data = ExportedDataState.getRootAsExportedDataState(byteBuffer);
  
  // TODO: Remove on a late duc v2 version
  const legacyVersion = data.versionLegacy();
  if(legacyVersion) {
    return parseDucFlatBuffersV1(blob, fileHandle) as unknown as RestoredDataState;
  }

  const version = data.version() || "0.0.0";

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

  // Parse appState
  const localState = data.ducLocalState();
  const parsedLocalState: Partial<DucLocalState> = parseDucLocalStateFromBinary(localState, version);

  // Parse files
  const externalFiles = data.externalFiles();
  const parsedFiles: DucExternalFiles = parseExternalFilesFromBinary(externalFiles);

  // Parse blocks
  const blocks: DucBlock[] = [];
  for (let i = 0; i < data.blocksLength(); i++) {
    const block = data.blocks(i);
    if (block) {
      const parsedBlock = parseBlockFromBinary(block, version);
      if (parsedBlock) {
        blocks.push(parsedBlock as DucBlock);
      }
    }
  }

  // Parse groups
  const groups: DucGroup[] = [];  
  for (let i = 0; i < data.groupsLength(); i++) {
    const group = data.groups(i);
    if (group && parsedLocalState.scope) {
      const parsedGroup = parseGroupFromBinary(group, parsedLocalState.scope);
      if (parsedGroup) {
        groups.push(parsedGroup as DucGroup);
      }
    }
  }



  const sanitized = restore(
    {
      elements: elements as DucElement[],
      localState: parsedLocalState,
      files: parsedFiles,
      blocks,
      groups,
    },
    { 
      syncInvalidIndices: (elements) => elements as OrderedDucElement[],
      repairBindings: true, 
      refreshDimensions: false,
    },
  );

  return {
    elements: sanitized.elements,
    localState: sanitized.localState,
    globalState: sanitized.globalState,
    files: sanitized.files,
    blocks: sanitized.blocks,
    groups: sanitized.groups,
  };
};