import { BinaryFiles as BinBinaryFiles, BinaryFilesEntry, BinaryFileData } from '../duc';
import { BinaryFiles, BinaryFileData as AppBinaryFileData } from '../../../types';

// Helper function to convert Uint8Array to DataURL (optional, depending on usage)
const uint8ArrayToDataURL = (uint8Array: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode.apply(null, uint8Array as any));
  return `data:application/octet-stream;base64,${base64}`;
};

export const parseBinaryFilesFromBinary = (binaryFiles: BinBinaryFiles | null): BinaryFiles => {
  if (!binaryFiles) return {};

  const files: BinaryFiles = {};
  for (let i = 0; i < binaryFiles.entriesLength(); i++) {
    const entry = binaryFiles.entries(i);
    if (entry === null) continue;
    const key = entry.key();
    const fileData = entry.value();
    if (key && fileData) {
      files[key] = {
        mimeType: fileData.mimeType() || '',
        id: fileData.id() || '',
        dataURL: uint8ArrayToDataURL(fileData.dataArray() || new Uint8Array()), // Convert Uint8Array back to dataURL if needed
        created: Number(fileData.created()),
        lastRetrieved: Number(fileData.lastRetrieved()),
      } as AppBinaryFileData;
    }
  }

  return files;
};
