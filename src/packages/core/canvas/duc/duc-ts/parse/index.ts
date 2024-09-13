import * as flatbuffers from 'flatbuffers';
import { ExportedDataState, DucElement as BinDucElement, AppState as BinAppState, BinaryFiles as BinBinaryFiles, BoundElement } from '../duc';
import { AppState, BinaryFiles } from '../../../types';
import { DucElement, DucElementTypes, DucLinearElement, FillStyle, RoundnessType, StrokePlacement, StrokeStyle } from '../../../element/types';
import { parseElementFromBinary } from './parseElementFromBinary';
import { parseAppStateFromBinary } from './parseAppStateFromBinary';
import { parseBinaryFilesFromBinary } from './parseBinaryFilesFromBinary';

// Helper function to convert Uint8Array to DataURL (optional, depending on usage)
const uint8ArrayToDataURL = (uint8Array: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode.apply(null, uint8Array as any));
  return `data:application/octet-stream;base64,${base64}`;
};

export const parseDucFlatBuffers = async (blob: Blob | File): Promise<{
  elements: DucElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}> => {
  const arrayBuffer = await blob.arrayBuffer();
  const byteBuffer = new flatbuffers.ByteBuffer(new Uint8Array(arrayBuffer));

  const data = ExportedDataState.getRootAsExportedDataState(byteBuffer);


  // Parse elements
  const elements: DucElement[] = [];
  for (let i = 0; i < data.elementsLength(); i++) {
    const e = data.elements(i);
    if(e) {
      const element = parseElementFromBinary(e);
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


  return { elements, appState: parsedAppState, files: parsedFiles };
};