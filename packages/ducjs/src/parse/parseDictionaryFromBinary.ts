import { ExportedDataState as BinExportedDataState } from "ducjs/duc";
import { Dictionary } from "ducjs/types";

/**
 * Parses a dictionary from FlatBuffers binary data.
 * 
 * @param data - The ExportedDataState object containing the dictionary data
 * @returns A record of key-value pairs from the dictionary
 */
export function parseDictionaryFromBinary(data: BinExportedDataState): Dictionary {
  const dictionary: Dictionary = {};
  
  // Parse dictionary entries
  const dictionaryLength = data.dictionaryLength();
  for (let i = 0; i < dictionaryLength; i++) {
    const entry = data.dictionary(i);
    if (entry) {
      const key = entry.key();
      const value = entry.value();
      if (key !== null && value !== null) {
        dictionary[key] = value;
      }
    }
  }
  
  return dictionary;
}
