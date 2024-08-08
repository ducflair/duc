import flatbuffers from 'flatbuffers';
import { BinaryFileData, BinaryFilesEntry, BinaryFiles as BinBinaryFiles } from '../duc';
import { BinaryFiles as BinaryFilesType } from '../../types';

const serializeBinaryFiles = (builder: flatbuffers.Builder, files: BinaryFilesType): flatbuffers.Offset => {
  const fileEntries = Object.keys(files).map(key => {
    const file = files[key];
    const keyOffset = builder.createString(key);
    const mimeTypeOffset = builder.createString(file.mimeType);
    const idOffset = builder.createString(file.id);
    const dataOffset = BinaryFileData.createDataVector(builder, new Uint8Array(file.dataURL));
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
