import { ExportedDataState as BinExportedDataState } from "ducjs/duc";

/**
 * Parses a thumbnail from FlatBuffers binary data.
 * 
 * @param data - The ExportedDataState object containing the thumbnail data
 * @returns A Uint8Array representing the thumbnail data or undefined if not present
 */
export function parseThumbnailFromBinary(data: BinExportedDataState): Uint8Array | undefined {
  const thumbnailLength = data.thumbnailLength();
  if (thumbnailLength === 0) {
    return undefined;
  }
  
  const thumbnailArray = new Uint8Array(thumbnailLength);
  for (let i = 0; i < thumbnailLength; i++) {
    const byte = data.thumbnail(i);
    if (byte !== null) {
      thumbnailArray[i] = byte;
    }
  }
  
  return thumbnailArray;
}
