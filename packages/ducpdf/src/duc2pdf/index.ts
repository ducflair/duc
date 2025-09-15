import { parseDuc, serializeDuc, traverseAndUpdatePrecisionValues } from 'ducjs';

export async function convertDucToPdf(ducData: Uint8Array): Promise<Uint8Array> {

  // Normalize incoming binary to ensure data
  const latestBlob = new Blob([new Uint8Array(ducData)]);
  const parsed = await parseDuc(latestBlob);
  const serialized = await serializeDuc(
    traverseAndUpdatePrecisionValues(parsed, 'mm') // we only support mm on PDF serialization
  );

  // Call the wasm function to convert the duc to pdf

  return new Uint8Array();
} 