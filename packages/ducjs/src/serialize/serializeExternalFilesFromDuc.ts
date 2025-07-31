import { DucExternalFileData, DucExternalFileEntry } from 'ducjs/duc';
import { ensureFiniteNumber } from 'ducjs/serialize/serializationUtils';
import { DucExternalFiles } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

// Helper function to convert a DataURL (base64 string) to Uint8Array
const dataURLToUint8Array = (dataURL: string): Uint8Array => {
  if (!dataURL || dataURL.indexOf(',') === -1) {
    return new Uint8Array(0);
  }
  const base64 = dataURL.split(',')[1];
  if (!base64) return new Uint8Array(0); 
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Error decoding base64 string in dataURLToUint8Array:", e);
    return new Uint8Array(0); 
  }
};

const serializeExternalFiles = (
  builder: flatbuffers.Builder, 
  files: DucExternalFiles
): flatbuffers.Offset => {
  if (!files || Object.keys(files).length === 0) {
    // Return empty vector for empty files
    return builder.createString('{}'); // Placeholder for empty files
  }

  const fileEntriesOffsets = Object.keys(files).map(key => {
    const file = files[key];
    const keyOffset = builder.createString(key);
    const mimeTypeOffset = builder.createString(file.mimeType ?? null!); 
    const idOffset = builder.createString(file.id ?? null!); 
    const data = dataURLToUint8Array(file.dataURL ?? null!); 
    const dataOffset = DucExternalFileData.createDataVector(builder, data);
    
    // Use imported ensureFiniteNumber for timestamps
    const createdTimestamp = ensureFiniteNumber(file.created);
    const lastRetrievedTimestamp = ensureFiniteNumber(file.lastRetrieved);
    const createdValue = createdTimestamp !== null ? BigInt(createdTimestamp) : BigInt(Date.now());
    const lastRetrievedValue = lastRetrievedTimestamp !== null ? BigInt(lastRetrievedTimestamp) : BigInt(Date.now());

    // Create file data
    DucExternalFileData.startDucExternalFileData(builder);
    DucExternalFileData.addMimeType(builder, mimeTypeOffset);
    DucExternalFileData.addId(builder, idOffset);
    DucExternalFileData.addData(builder, dataOffset);
    DucExternalFileData.addCreated(builder, createdValue);
    DucExternalFileData.addLastRetrieved(builder, lastRetrievedValue);
    const fileDataOffset = DucExternalFileData.endDucExternalFileData(builder);

    // Create file entry
    DucExternalFileEntry.startDucExternalFileEntry(builder);
    DucExternalFileEntry.addKey(builder, keyOffset);
    DucExternalFileEntry.addValue(builder, fileDataOffset);
    return DucExternalFileEntry.endDucExternalFileEntry(builder);
  });

  // For now, return a simple placeholder - this needs to be implemented based on the actual schema
  return builder.createString('external-files-placeholder');
};

export { serializeExternalFiles };
