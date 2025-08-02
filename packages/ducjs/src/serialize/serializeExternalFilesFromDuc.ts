import { DucExternalFileData, DucExternalFileEntry } from 'ducjs/duc';
import { DucExternalFiles } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

/**
 * Convert a data URL (base64) into a Uint8Array of bytes.
 * No defaults are introduced; invalid/missing payload yields an empty Uint8Array.
 */
const dataURLToUint8Array = (dataURL: string | undefined): Uint8Array => {
  if (!dataURL) return new Uint8Array(0);
  const commaIdx = dataURL.indexOf(',');
  if (commaIdx === -1) return new Uint8Array(0);
  const base64 = dataURL.slice(commaIdx + 1);
  if (!base64) return new Uint8Array(0);
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
};

/**
 * Serialize DucExternalFiles into a FlatBuffers vector of DucExternalFileEntry.
 * - Does not introduce defaults; only sets fields present in input.
 * - Maintains strict typing.
 */
const serializeExternalFiles = (
  builder: flatbuffers.Builder,
  files: DucExternalFiles | undefined
): flatbuffers.Offset => {
  if (!files || Object.keys(files).length === 0) {
    return 0; // omit field
  }

  const entryOffsets: number[] = [];

  for (const key of Object.keys(files)) {
    const f = files[key]!;
    // Required strings in schema; build only with provided values.
    const keyOffset = builder.createString(key);
    const mimeTypeOffset = builder.createString(f.mimeType);
    const idOffset = builder.createString(f.id);

    const dataBytes = dataURLToUint8Array(f.dataURL);
    const dataVec = DucExternalFileData.createDataVector(builder, dataBytes);

    DucExternalFileData.startDucExternalFileData(builder);
    DucExternalFileData.addMimeType(builder, mimeTypeOffset);
    DucExternalFileData.addId(builder, idOffset);
    DucExternalFileData.addData(builder, dataVec);
    // created is required in schema; write exactly as provided
    DucExternalFileData.addCreated(builder, BigInt(f.created));
    // last_retrieved is optional; write only if provided
    if (typeof f.lastRetrieved === 'number') {
      DucExternalFileData.addLastRetrieved(builder, BigInt(f.lastRetrieved));
    }
    const fileDataOffset = DucExternalFileData.endDucExternalFileData(builder);

    DucExternalFileEntry.startDucExternalFileEntry(builder);
    DucExternalFileEntry.addKey(builder, keyOffset);
    DucExternalFileEntry.addValue(builder, fileDataOffset);
    const entryOffset = DucExternalFileEntry.endDucExternalFileEntry(builder);

    entryOffsets.push(entryOffset);
  }

  // Build the vector of entries using generic vector creation (reverse order).
  builder.startVector(4, entryOffsets.length, 4);
  for (let i = entryOffsets.length - 1; i >= 0; i--) {
    builder.addOffset(entryOffsets[i]!);
  }
  return builder.endVector();
};

export { serializeExternalFiles };
