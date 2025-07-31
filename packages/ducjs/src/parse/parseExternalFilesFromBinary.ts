import { DucExternalFileEntry as BinDucExternalFileEntry } from 'ducjs/duc';
import { DucExternalFiles, DucExternalFileData } from 'ducjs/types';

// Helper function to convert Uint8Array to DataURL
export const uint8ArrayToDataURL = (uint8Array: Uint8Array, mimeType: string): string => {
  const binaryString = Array.from(uint8Array)
    .map(byte => String.fromCharCode(byte))
    .join('');
  const base64 = btoa(binaryString);
  return `data:${mimeType};base64,${base64}`;
};

export const parseBinaryFilesFromBinary = (externalFile: BinDucExternalFileEntry | null): DucExternalFiles => {
  if (!externalFile) return {};

  const files: DucExternalFiles = {};
  const key = externalFile.key();
  const fileData = externalFile.value();
  if (key && fileData) {
    const mimeType = fileData.mimeType() || 'application/octet-stream';
    const dataArray = fileData.dataArray() || new Uint8Array();
    files[key] = {
      mimeType,
      id: fileData.id() ?? null!,
      dataURL: uint8ArrayToDataURL(dataArray, mimeType), // Convert Uint8Array back to dataURL
      created: Number(fileData.created()),
      lastRetrieved: Number(fileData.lastRetrieved()),
    } as DucExternalFileData;
  }

  return files;
};
