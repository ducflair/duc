import { DictionaryEntry as BinDictionaryEntry } from 'ducjs/duc';
import type { Dictionary } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

export const serializeDictionaryEntryFromDuc = (
  builder: flatbuffers.Builder,
  key: string, 
  value: string
): flatbuffers.Offset => {
  const keyOffset = builder.createString(key);
  const valueOffset = builder.createString(value);

  BinDictionaryEntry.startDictionaryEntry(builder);
  BinDictionaryEntry.addKey(builder, keyOffset);
  BinDictionaryEntry.addValue(builder, valueOffset);
  return BinDictionaryEntry.endDictionaryEntry(builder);
};

export const serializeDictionaryFromDuc = (
  builder: flatbuffers.Builder,
  dictionary: Dictionary
): flatbuffers.Offset => {
  const entries = Object.entries(dictionary).map(([key, value]) =>
    serializeDictionaryEntryFromDuc(builder, key, value)
  );

  builder.startVector(4, entries.length, 4);
  for (let i = entries.length - 1; i >= 0; i--) {
    builder.addOffset(entries[i]!);
  }
  return builder.endVector();
};
