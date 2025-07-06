import { FileSystemHandle } from 'browser-fs-access';
import * as flatbuffers from 'flatbuffers';
import { restore } from '@duc/canvas/data/restore';
import { DucElement, DucBlock, DucGroup } from '@duc/canvas/element/types';
import { AppState, BinaryFiles } from '@duc/canvas/types';
import {
  ExportedDataState
} from '@duc/canvas/duc/duc-ts/duc';
import { parseAppStateFromBinary } from '@duc/canvas/duc/duc-ts/src/parse/parseAppStateFromBinary';
import { parseBinaryFilesFromBinary } from '@duc/canvas/duc/duc-ts/src/parse/parseBinaryFilesFromBinary';
import { parseElementFromBinary } from '@duc/canvas/duc/duc-ts/src/parse/parseElementFromBinary';
import { parseRendererStateFromBinary } from '@duc/canvas/duc/duc-ts/src/parse/parseRendererStateFromBinary';
import { parseBlockFromBinary } from '@duc/canvas/duc/duc-ts/src/parse/parseBlockFromBinary';
import { parseGroupFromBinary } from '@duc/canvas/duc/duc-ts/src/parse/parseGroupFromBinary';

// Helper function to convert Uint8Array to DataURL (optional, depending on usage)
const uint8ArrayToDataURL = (uint8Array: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode.apply(null, uint8Array as any));
  return `data:application/octet-stream;base64,${base64}`;
};

export const parseDucFlatBuffers = async (
  blob: Blob | File, 
  fileHandle: FileSystemHandle | null = null
) => {
  const arrayBuffer = await blob.arrayBuffer();
  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  const data = ExportedDataState.getRootAsExportedDataState(byteBuffer);
  const version = data.version();

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
  const parsedAppState: Partial<AppState> = parseAppStateFromBinary(appState, version);

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

  const sanitized = restore(
    {
      elements: elements as DucElement[],
      appState: {
        fileHandle: fileHandle || blob.handle as unknown as FileSystemHandle || null,
        ...parsedAppState,
      },
      files: parsedFiles,
      blocks,
      groups,
      rendererState: parsedRendererState,
    },
    undefined,
    undefined,
    { repairBindings: true, refreshDimensions: false },
  );
  const { theme, ...cleanAppState } = sanitized.appState;

  return {
    elements: sanitized.elements,
    appState: cleanAppState,
    files: sanitized.files,
    blocks: sanitized.blocks,
    groups: sanitized.groups,
    rendererState: parsedRendererState,
  };
};