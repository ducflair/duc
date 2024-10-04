import { BinaryFiles as BinBinaryFiles, BinaryFilesEntry, BinaryFileData } from '../../duc';
import { BinaryFiles, BinaryFileData as AppBinaryFileData } from '../../../../types';

// Helper function to convert Uint8Array to DataURL
const uint8ArrayToDataURL = (uint8Array: Uint8Array, mimeType: string): string => {
  const binaryString = Array.from(uint8Array)
    .map(byte => String.fromCharCode(byte))
    .join('');
  const base64 = btoa(binaryString);
  return `data:${mimeType};base64,${base64}`;
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
      const mimeType = fileData.mimeType() || 'application/octet-stream';
      const dataArray = fileData.dataArray() || new Uint8Array();
      files[key] = {
        mimeType,
        id: fileData.id() || '',
        dataURL: uint8ArrayToDataURL(dataArray, mimeType), // Convert Uint8Array back to dataURL
        created: Number(fileData.created()),
        lastRetrieved: Number(fileData.lastRetrieved()),
      } as AppBinaryFileData;
    }
  }

  return files;
};
