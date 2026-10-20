import { describe, expect, test } from "bun:test";
import { readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { gunzipSync, gzipSync } from "fflate";

import * as ducjs from "../src";
import {
  importDucStreamToOpfs,
  type DucStreamImportProgress,
} from "../src/opfs-import";
import { parseDuc } from "../src/parse";

import { getDucFixturePath, ensureAllDucFixtures } from "./fixtures";

describe("DUC streaming API", () => {
  test("parses a standalone raw SQLite database exported with WAL header bytes", async () => {
    const fixture = await getDucFixturePath("universal.duc");
    const compressed = new Uint8Array(await Bun.file(fixture).arrayBuffer());
    const rawSqlite = gunzipSync(compressed);
    rawSqlite[18] = 2;
    rawSqlite[19] = 2;

    const parsed = await parseDuc(new Blob([rawSqlite]));

    expect(parsed.elements.length).toBeGreaterThan(0);
  });

  test("exports OPFS document streaming methods instead of byte parse/serialize helpers", () => {
    expect(typeof ducjs.DucOpfsDocument).toBe("function");
    expect(typeof ducjs.BrowserDucDocument.openDucStream).toBe("function");
    expect(typeof ducjs.DucOpfsDocument.openInPool).toBe("function");
    expect("parseDuc" in ducjs).toBe(false);
    expect("parseDucLazy" in ducjs).toBe(false);
    expect("serializeDuc" in ducjs).toBe(false);
    expect("LazyExternalFileStore" in ducjs).toBe(false);

    const methodNames = [
      "readDocumentState",
      "writeDocumentState",
      "listExternalFiles",
      "readExternalFileRevisionChunk",
      "readExternalFileRevisionChunks",
      "readExternalFileRevisionRange",
      "writeExternalFileRevisionChunk",
      "readCheckpointDataChunk",
      "writeCheckpointDataChunk",
      "readDeltaChangesetChunk",
      "writeDeltaChangesetChunk",
      "listVersions",
      "readVersionGraph",
    ];

    for (const methodName of methodNames) {
      expect(methodName in ducjs.DucOpfsDocument.prototype).toBe(true);
    }

    expect("readCheckpointDataChunk" in ducjs.BrowserDucDocument.prototype).toBe(true);
    expect("readDeltaChangesetChunk" in ducjs.BrowserDucDocument.prototype).toBe(true);
  });

  test("forwards version artifact chunk reads through BrowserDucDocument", () => {
    const checkpointChunk = new Uint8Array([1, 2, 3]);
    const deltaChunk = new Uint8Array([4, 5]);
    const handle = {
      readCheckpointDataChunk: (id: string, index: number) =>
        id === "checkpoint-1" && index === 0 ? checkpointChunk : undefined,
      readDeltaChangesetChunk: (id: string, index: number) =>
        id === "delta-1" && index === 0 ? deltaChunk : undefined,
    };
    const document = new (ducjs.BrowserDucDocument as unknown as new (
      handle: typeof handle,
      chunkSize: number,
    ) => ducjs.BrowserDucDocument)(handle, 1024);

    expect(document.readCheckpointDataChunk("checkpoint-1", 0)).toEqual(checkpointChunk);
    expect(document.readCheckpointDataChunk("missing", 0)).toBeUndefined();
    expect(document.readDeltaChangesetChunk("delta-1", 0)).toEqual(deltaChunk);
    expect(document.readDeltaChangesetChunk("missing", 0)).toBeUndefined();
  });

  test("streams version payload chunks through the document-facing helpers", async () => {
    const checkpointChunk = new Uint8Array([1, 2, 3, 4]);
    const deltaChunk = new Uint8Array([5, 6, 7]);
    const document = {
      listVersions: () => [
        {
          id: "checkpoint-1",
          versionNumber: 1,
          schemaVersion: 4000000,
          timestamp: 1000,
          isManualSave: true,
          versionType: "checkpoint" as const,
          sizeBytes: checkpointChunk.byteLength,
        },
      ],
      readVersionGraph: () => ({
        checkpoints: [
          {
            id: "checkpoint-1",
            parentId: null,
            data: new Uint8Array(),
            timestamp: 1000,
            description: "fixture checkpoint",
            isManualSave: true,
            userId: null,
            schemaVersion: 4000000,
            sizeBytes: checkpointChunk.byteLength,
          },
        ],
        deltas: [
          {
            id: "delta-1",
            parentId: "checkpoint-1",
            payload: new Uint8Array(),
            timestamp: 1001,
            description: "fixture delta",
            userId: null,
            schemaVersion: 4000000,
            sizeBytes: deltaChunk.byteLength,
          },
        ],
      }),
      readCheckpointDataChunk: (checkpointId: string, chunkIndex: number) =>
        checkpointId === "checkpoint-1" && chunkIndex === 0 ? checkpointChunk : undefined,
      readDeltaChangesetChunk: (deltaId: string, chunkIndex: number) =>
        deltaId === "delta-1" && chunkIndex === 0 ? deltaChunk : undefined,
    };

    const versions = await ducjs.vc.listVersions(document);
    const graph = await ducjs.vc.readVersionGraph(document);
    const readCheckpointChunk = await ducjs.vc.readCheckpointDataChunk(document, "checkpoint-1", 0);
    const readDeltaChunk = await ducjs.vc.readDeltaChangesetChunk(document, "delta-1", 0);

    expect(versions).toHaveLength(1);
    expect(graph?.checkpoints[0].data.byteLength).toBe(0);
    expect(graph?.deltas[0].payload.byteLength).toBe(0);
    expect(readCheckpointChunk).toEqual(checkpointChunk);
    expect(readDeltaChunk).toEqual(deltaChunk);
  });

  test("decompresses into bounded OPFS importer writes", async () => {
    const payload = new Uint8Array(16 + 257);
    payload.set(new TextEncoder().encode("SQLite format 3\0"));
    for (let index = 16; index < payload.length; index += 1) {
      payload[index] = index % 251;
    }
    const compressed = gzipSync(payload);
    const writes: Uint8Array[] = [];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < compressed.length; offset += 11) {
          controller.enqueue(compressed.subarray(offset, offset + 11));
        }
        controller.close();
      },
    });

    const written = await importDucStreamToOpfs(
      stream,
      {
        writeChunk(chunk) {
          writes.push(new Uint8Array(chunk));
        },
      },
      { compressedChunkSize: 7, writeBufferSize: 32 },
    );
    const restored = new Uint8Array(written);
    let offset = 0;
    for (const chunk of writes) {
      restored.set(chunk, offset);
      offset += chunk.byteLength;
    }

    expect(written).toBe(payload.byteLength);
    expect(Math.max(...writes.map((chunk) => chunk.byteLength))).toBeLessThanOrEqual(32);
    expect(restored).toEqual(payload);
  });

  test("reports cumulative stream wait and processing progress", async () => {
    const payload = new Uint8Array(16 + 257);
    payload.set(new TextEncoder().encode("SQLite format 3\0"));
    const compressed = gzipSync(payload);
    const progress: DucStreamImportProgress[] = [];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(compressed);
        controller.close();
      },
    });

    await importDucStreamToOpfs(
      stream,
      { writeChunk() {} },
      {
        writeBufferSize: 32,
        progressIntervalMs: Number.MAX_SAFE_INTEGER,
        onProgress: (event) => progress.push(event),
      },
    );

    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({
      phase: "complete",
      compressedBytes: compressed.byteLength,
      uncompressedBytes: payload.byteLength,
    });
    expect(progress[0].readWaitMs).toBeGreaterThanOrEqual(0);
    expect(progress[0].processingMs).toBeGreaterThanOrEqual(progress[0].opfsWriteMs);
  });

  test("copies raw SQLite into bounded OPFS importer writes", async () => {
    const payload = new Uint8Array(16 + 257);
    payload.set(new TextEncoder().encode("SQLite format 3\0"));
    for (let index = 16; index < payload.length; index += 1) {
      payload[index] = index % 251;
    }
    const writes: Uint8Array[] = [];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < payload.length; offset += 7) {
          controller.enqueue(payload.subarray(offset, offset + 7));
        }
        controller.close();
      },
    });

    const written = await importDucStreamToOpfs(
      stream,
      {
        writeChunk(chunk) {
          writes.push(new Uint8Array(chunk));
        },
      },
      { compressedChunkSize: 5, writeBufferSize: 32 },
    );
    const restored = new Uint8Array(written);
    let offset = 0;
    for (const chunk of writes) {
      restored.set(chunk, offset);
      offset += chunk.byteLength;
    }

    expect(written).toBe(payload.byteLength);
    expect(Math.max(...writes.map((chunk) => chunk.byteLength))).toBeLessThanOrEqual(32);
    expect(restored).toEqual(payload);
  });

  test("normalizes fixture-like exported state before Rust serialization", () => {
    const state = {
      type: "duc",
      version: 1,
      source: "ducjs-test",
      thumbnail: null,
      dictionary: null,
      elements: [
        {
          id: "rect-1",
          type: "rectangle",
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          angle: 0,
          stroke: [],
          background: [],
          opacity: 1,
          isDeleted: false,
          groupIds: [],
          boundElements: [],
          link: null,
          locked: false,
          customData: null,
          roundness: 0,
        },
      ],
      appState: null,
      files: {},
      localState: {
        zoom: 1,
      },
      globalState: {
        viewBackgroundColor: "#ffffff",
      },
    };

    const rustState = ducjs.transformToRust(state);

    expect(rustState.elements[0].x).toBe(10);
    expect(rustState.elements[0].width).toBe(100);
    expect(rustState.localState.zoom).toBe(1);
  });

  test("covers all checked-in .duc fixtures in the streaming recycle benchmark input set", async () => {
    const fixturePaths = await ensureAllDucFixtures();
    const fixtures = fixturePaths.map((filePath) => ({
      name: basename(filePath),
      size: statSync(filePath).size,
    }));

    expect(fixtures.length).toBeGreaterThan(0);
    expect(fixtures.every((fixture) => fixture.size > 0)).toBe(true);
  });
});
