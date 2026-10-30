import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { Database } from 'bun:sqlite';
import { gunzipSync } from 'fflate';
import { serializeStateToDucBytes } from '../src/wasi';
import { parseDuc } from '../src/parse';
import type { ExportedDataState } from '../src/types';

const wasiTest = existsSync(new URL('../dist/ducjs_wasi.wasm', import.meta.url)) ? test : test.skip;

wasiTest('WASI serializes current-schema models and revision sidecars under Bun', async () => {
  const state = { id: 'sandbox-model', version: '4.0.0', elements: [{ id: 'model', type: 'model', modelType: 'python', code: 'emit_output(1)', fileIds: ['source'], x: 0, y: 0, width: 100, height: 50 }],
    files: { source: { id: 'source', version: 1, updated: 1, activeRevisionId: 'revision', revisions: { revision: { id: 'revision', sizeBytes: 3, mimeType: 'model/step', created: 1 } } } }, filesData: { revision: new Uint8Array([1, 2, 3]) },
  } as unknown as ExportedDataState;
  const bytes = await serializeStateToDucBytes(state);
  const parsed = await parseDuc(new Blob([bytes]));
  expect(parsed.id).toBe('sandbox-model');
  expect(parsed.elements[0].type).toBe('model');
  expect(parsed.files?.source.activeRevisionId).toBe('revision');
  expect(parsed.files?.source.revisions.revision.sizeBytes).toBe(3);
  const sqlite = Database.deserialize(bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes, true);
  try {
    const chunks = sqlite.query('SELECT data FROM external_file_revision_chunks WHERE revision_id = ?1 ORDER BY chunk_index').all('revision') as { data: Uint8Array }[];
    expect(chunks.flatMap(chunk => Array.from(chunk.data))).toEqual([1, 2, 3]);
  } finally { sqlite.close(); }
}, 30_000);
