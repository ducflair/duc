import * as flatbuffers from 'flatbuffers';
import { ExportedDataState, DucElement as BinDucElement, AppState as BinAppState, BinaryFiles as BinBinaryFiles, BoundElement } from '../duc';
import { AppState, BinaryFiles } from '../../../types';
import { DucElement, DucElementTypes, DucLinearElement, FillStyle, RoundnessType, StrokePlacement, StrokeStyle } from '../../../element/types';
import { parseElementFromBinary } from './parse/parseElementFromBinary';
import { parseAppStateFromBinary } from './parse/parseAppStateFromBinary';
import { parseBinaryFilesFromBinary } from './parse/parseBinaryFilesFromBinary';
import { restore } from '../../../data/restore';

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
  const parsedAppState: Partial<AppState> = parseAppStateFromBinary(appState);

  // Parse files
  const binaryFiles = data.files();
  const parsedFiles: BinaryFiles = parseBinaryFilesFromBinary(binaryFiles);

  const sanitized = restore(
    {
      elements: elements as DucElement[],
      appState: {
        fileHandle: fileHandle || blob.handle || null,
        ...parsedAppState,
      },
      files: parsedFiles,
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
  };
};