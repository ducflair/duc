import * as flatbuffers from 'flatbuffers';
import { BinaryFileData, BinaryFilesEntry, BinaryFiles as BinBinaryFiles } from '../duc';
import { BinaryFiles as BinaryFilesType } from '../../types';

// Helper function to convert a DataURL (base64 string) to Uint8Array
const dataURLToUint8Array = (dataURL: string): Uint8Array => {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const serializeBinaryFiles = (builder: flatbuffers.Builder, files: BinaryFilesType): flatbuffers.Offset => {
  const fileEntries = Object.keys(files).map(key => {
    const file = files[key];
    const keyOffset = builder.createString(key);
    const mimeTypeOffset = builder.createString(file.mimeType);
    const idOffset = builder.createString(file.id);
    const data = dataURLToUint8Array(file.dataURL);
    const dataOffset = BinaryFileData.createDataVector(builder, data);
    const binaryFileDataOffset = BinaryFileData.createBinaryFileData(
      builder,
      mimeTypeOffset,
      idOffset,
      dataOffset,
      BigInt(file.created),
      BigInt(file.lastRetrieved || 0)
    );

    BinaryFilesEntry.startBinaryFilesEntry(builder);
    BinaryFilesEntry.addKey(builder, keyOffset);
    BinaryFilesEntry.addValue(builder, binaryFileDataOffset);
    return BinaryFilesEntry.endBinaryFilesEntry(builder);
  });

  const filesOffset = BinBinaryFiles.createEntriesVector(builder, fileEntries);
  const binaryFilesOffset = BinBinaryFiles.createBinaryFiles(builder, filesOffset);
  return binaryFilesOffset;
};

export { serializeBinaryFiles };
