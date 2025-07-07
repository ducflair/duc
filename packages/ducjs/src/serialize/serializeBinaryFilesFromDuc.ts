import * as flatbuffers from 'flatbuffers';
import { BinaryFileData, BinaryFilesEntry, BinaryFiles as BinBinaryFiles } from 'ducjs/duc';
import { BinaryFiles as BinaryFilesType } from 'ducjs/types';
import { ensureFiniteNumber } from 'ducjs/serialize/serializationUtils'; // Import shared helper

// Helper function to convert a DataURL (base64 string) to Uint8Array
const dataURLToUint8Array = (dataURL: string): Uint8Array => {
  if (!dataURL || dataURL.indexOf(',') === -1) { // Added check for valid dataURL format
    // console.error("Invalid dataURL format in dataURLToUint8Array");
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

const serializeBinaryFiles = (builder: flatbuffers.Builder, files: BinaryFilesType): flatbuffers.Offset => {
  const fileEntriesOffsets = Object.keys(files).map(key => {
    const file = files[key];
    const keyOffset = builder.createString(key);
    const mimeTypeOffset = builder.createString(file.mimeType || "application/octet-stream"); 
    const idOffset = builder.createString(file.id || key); 
    const data = dataURLToUint8Array(file.dataURL || ""); 
    const dataOffset = BinaryFileData.createDataVector(builder, data);
    
    // Use imported ensureFiniteNumber for timestamps
    const createdTimestamp = ensureFiniteNumber(file.created, Date.now());
    const lastRetrievedTimestamp = ensureFiniteNumber(file.lastRetrieved, Date.now());

    const binaryFileDataOffset = BinaryFileData.createBinaryFileData(
      builder,
      mimeTypeOffset,
      idOffset,
      dataOffset,
      BigInt(createdTimestamp),
      BigInt(lastRetrievedTimestamp)
    );

    BinaryFilesEntry.startBinaryFilesEntry(builder);
    BinaryFilesEntry.addKey(builder, keyOffset);
    BinaryFilesEntry.addValue(builder, binaryFileDataOffset);
    return BinaryFilesEntry.endBinaryFilesEntry(builder);
  });

  const filesVectorOffset = BinBinaryFiles.createEntriesVector(builder, fileEntriesOffsets);
  return BinBinaryFiles.createBinaryFiles(builder, filesVectorOffset);
};

export { serializeBinaryFiles };
