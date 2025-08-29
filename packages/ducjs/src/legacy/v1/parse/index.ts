import { FileSystemHandle } from 'browser-fs-access';
import * as flatbuffers from 'flatbuffers';
import { restore, ExtendedAppStateRestorer } from '../utils/restore';
import { DucElement, DucBlock, DucGroup, OrderedDucElement } from '../types/elements';
import { BinaryFiles, DucState } from '../types';
import {
  ExportedDataState
} from '../duc';
import { parseAppStateFromBinary } from './parseAppStateFromBinary';
import { parseBinaryFilesFromBinary } from './parseBinaryFilesFromBinary';
import { parseElementFromBinary } from './parseElementFromBinary';
import { parseRendererStateFromBinary } from './parseRendererStateFromBinary';
import { parseBlockFromBinary } from './parseBlockFromBinary';
import { parseGroupFromBinary } from './parseGroupFromBinary';

export const parseDucFlatBuffers = async (
  blob: Blob | File, 
  fileHandle: FileSystemHandle | null = null
) => {
  const arrayBuffer = await blob.arrayBuffer();
  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  const data = ExportedDataState.getRootAsExportedDataState(byteBuffer);
  const version = data.versionLegacy();

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
  const appState = data.appState();
  const parsedAppState: Partial<DucState> = parseAppStateFromBinary(appState, version);

  // Parse files
  const binaryFiles = data.files();
  const parsedFiles: BinaryFiles = parseBinaryFilesFromBinary(binaryFiles);

  // Parse rendererState
  const rendererState = data.rendererState();
  const parsedRendererState = parseRendererStateFromBinary(rendererState);

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
    if (group && parsedAppState.scope) {
      const parsedGroup = parseGroupFromBinary(group, parsedAppState.scope);
      if (parsedGroup) {
        groups.push(parsedGroup as DucGroup);
      }
    }
  }

  const customExtendedAppStateRestorer: ExtendedAppStateRestorer<DucState> = (
    extendedAppState,
    localExtendedAppState,
    restoredDucState,
  ) => {
    return {
      ...restoredDucState,
      fileHandle: fileHandle || (blob && 'handle' in blob ? blob.handle as FileSystemHandle : null),
    };
  };

  const sanitized = restore(
    {
      elements: elements as DucElement[],
      appState: parsedAppState,
      files: parsedFiles,
      blocks,
      groups,
      rendererState: parsedRendererState,
    },
    undefined,
    undefined,
    customExtendedAppStateRestorer,
    { 
      repairBindings: true, 
      refreshDimensions: false,
      syncInvalidIndices: (elements) => elements as OrderedDucElement[],
    },
  );
  const { ...cleanAppState } = sanitized.appState;

  return {
    elements: sanitized.elements,
    appState: cleanAppState,
    files: sanitized.files,
    blocks: sanitized.blocks,
    groups: sanitized.groups,
    rendererState: parsedRendererState,
  };
};