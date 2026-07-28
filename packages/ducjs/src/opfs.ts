import { AsyncGzip } from "fflate";
import {
  importDucStreamToOpfs,
  type DucStreamImportOptions,
} from "./opfs-import";
import {
  type ElementsConfig,
  type RestoreConfig,
  type RestoredDataState,
} from "./restore";
import { restoreParsedData } from "./restore-parsed";
import { prepareStateForSerialization } from "./serialize";
import { transformFromRust } from "./transform";
import type { ExportedDataState } from "./types";
import { DucOpfsDocument, DucOpfsImporter, ensureWasm } from "./wasm";

const DEFAULT_CHUNK_SIZE = 1024 * 1024;
const MAX_EXTERNAL_CHUNK_BATCH = 4;
const MAX_EXTERNAL_RANGE_SIZE = 8 * 1024 * 1024;

export type BrowserDucDocumentOptions = {
  name?: string;
  /** Isolates OPFS SyncAccessHandles owned by independent workers. */
  poolName?: string;
  wasmUrl?: string | URL | BufferSource;
  chunkSize?: number;
};

type OpfsDocumentHandle = Awaited<ReturnType<typeof DucOpfsDocument.open>>;
type OpfsImporterHandle = Awaited<ReturnType<typeof DucOpfsImporter.begin>>;
type NamespacedOpfsDocumentConstructor = typeof DucOpfsDocument & {
  openInPool(name: string, poolName: string): Promise<OpfsDocumentHandle>;
  listOpfsDatabasesInPool(poolName: string): Promise<unknown>;
  deleteOpfsDatabaseInPool(name: string, poolName: string): Promise<boolean>;
};
type NamespacedOpfsImporterConstructor = typeof DucOpfsImporter & {
  beginInPool(name: string, poolName: string): Promise<OpfsImporterHandle>;
};

const openOpfsDocument = (name: string, poolName?: string) => (
  poolName
    ? (DucOpfsDocument as NamespacedOpfsDocumentConstructor).openInPool(name, poolName)
    : DucOpfsDocument.open(name)
);

const beginOpfsImport = (name: string, poolName?: string) => (
  poolName
    ? (DucOpfsImporter as NamespacedOpfsImporterConstructor).beginInPool(name, poolName)
    : DucOpfsImporter.begin(name)
);

export class BrowserDucDocument {
  private closed = false;

  private constructor(
    private readonly document: OpfsDocumentHandle,
    private readonly chunkSize: number,
  ) {}

  static async create(options: BrowserDucDocumentOptions = {}): Promise<BrowserDucDocument> {
    await ensureWasm(options.wasmUrl);
    const name = options.name ?? `duc-${crypto.randomUUID()}.sqlite`;
    const document = await openOpfsDocument(name, options.poolName);
    return new BrowserDucDocument(document, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  }

  static async openDucStream(
    stream: ReadableStream<Uint8Array>,
    options: BrowserDucDocumentOptions & DucStreamImportOptions = {},
  ): Promise<BrowserDucDocument> {
    await ensureWasm(options.wasmUrl);
    const name = options.name ?? `duc-import-${crypto.randomUUID()}.sqlite`;
    const importer = await beginOpfsImport(name, options.poolName) as OpfsImporterHandle;
    let finished = false;
    let importerReleased = false;

    try {
      const importedBytes = await importDucStreamToOpfs(stream, importer, options);
      const committedBytes = importer.finish();
      if (committedBytes !== importedBytes) {
        throw new Error(
          `OPFS importer wrote ${committedBytes} bytes, expected ${importedBytes}`,
        );
      }
      finished = true;
      importer.free();
      importerReleased = true;

      const document = await openOpfsDocument(name, options.poolName);
      return new BrowserDucDocument(
        document,
        options.chunkSize ?? DEFAULT_CHUNK_SIZE,
      );
    } catch (error) {
      if (!finished) {
        try {
          importer.abort();
        } catch {
          // Preserve the original stream/import error.
        }
      }
      throw error;
    } finally {
      if (!importerReleased) {
        importer.free();
      }
    }
  }

  static async listDatabases(
    wasmUrl?: string | URL | BufferSource,
    poolName?: string,
  ): Promise<string[]> {
    await ensureWasm(wasmUrl);
    if (poolName) {
      return await (DucOpfsDocument as NamespacedOpfsDocumentConstructor)
        .listOpfsDatabasesInPool(poolName) as string[];
    }
    return await DucOpfsDocument.listOpfsDatabases() as string[];
  }

  static async deleteDatabase(
    name: string,
    wasmUrl?: string | URL | BufferSource,
    poolName?: string,
  ): Promise<boolean> {
    await ensureWasm(wasmUrl);
    if (poolName) {
      return await (DucOpfsDocument as NamespacedOpfsDocumentConstructor)
        .deleteOpfsDatabaseInPool(name, poolName);
    }
    return await DucOpfsDocument.deleteOpfsDatabase(name);
  }

  getFilename(): string {
    return this.document.getFilename();
  }

  readState(): ExportedDataState {
    return transformFromRust(
      this.document.readDocumentState() as ExportedDataState,
    ) as ExportedDataState;
  }

  readRestoredState(
    elementsConfig?: ElementsConfig,
    restoreConfig?: RestoreConfig,
  ): RestoredDataState {
    const raw = this.document.readDocumentState() as ExportedDataState;
    return restoreParsedData(raw, elementsConfig, restoreConfig);
  }

  writeState(data: Partial<ExportedDataState>): void {
    this.document.writeDocumentState(prepareStateForSerialization(data));
  }

  listExternalFiles(): unknown {
    return this.document.listExternalFiles();
  }

  readCheckpointDataChunk(
    checkpointId: string,
    chunkIndex: number,
  ): Uint8Array | undefined {
    return this.document.readCheckpointDataChunk(
      checkpointId,
      chunkIndex,
    ) as Uint8Array | undefined;
  }

  readDeltaChangesetChunk(
    deltaId: string,
    chunkIndex: number,
  ): Uint8Array | undefined {
    return this.document.readDeltaChangesetChunk(
      deltaId,
      chunkIndex,
    ) as Uint8Array | undefined;
  }

  clearExternalFileRevisionChunks(revisionId: string): void {
    this.document.clearExternalFileRevisionChunks(revisionId);
  }

  writeExternalFileRevisionChunk(
    revisionId: string,
    chunkIndex: number,
    offsetBytes: number,
    data: Uint8Array,
  ): void {
    this.document.writeExternalFileRevisionChunk(revisionId, chunkIndex, offsetBytes, data);
  }

  readExternalFileRevisionChunk(revisionId: string, chunkIndex: number): Uint8Array | undefined {
    return this.document.readExternalFileRevisionChunk(revisionId, chunkIndex) as Uint8Array | undefined;
  }

  readExternalFileRevisionChunks(
    revisionId: string,
    startChunkIndex = 0,
    maxChunks = MAX_EXTERNAL_CHUNK_BATCH,
  ): Uint8Array[] {
    if (!Number.isSafeInteger(startChunkIndex) || startChunkIndex < 0) {
      throw new RangeError("startChunkIndex must be a non-negative safe integer");
    }
    if (
      !Number.isSafeInteger(maxChunks)
      || maxChunks < 1
      || maxChunks > MAX_EXTERNAL_CHUNK_BATCH
    ) {
      throw new RangeError(
        `maxChunks must be between 1 and ${MAX_EXTERNAL_CHUNK_BATCH}`,
      );
    }

    return this.document.readExternalFileRevisionChunks(
      revisionId,
      startChunkIndex,
      maxChunks,
    ) as Uint8Array[];
  }

  readExternalFileRevisionRange(
    revisionId: string,
    offsetBytes: number,
    lengthBytes: number,
  ): Uint8Array | undefined {
    if (!Number.isSafeInteger(offsetBytes) || offsetBytes < 0) {
      throw new RangeError("offsetBytes must be a non-negative safe integer");
    }
    if (
      !Number.isSafeInteger(lengthBytes)
      || lengthBytes < 1
      || lengthBytes > MAX_EXTERNAL_RANGE_SIZE
    ) {
      throw new RangeError(
        `lengthBytes must be between 1 and ${MAX_EXTERNAL_RANGE_SIZE}`,
      );
    }

    return this.document.readExternalFileRevisionRange(
      revisionId,
      offsetBytes,
      lengthBytes,
    ) as Uint8Array | undefined;
  }

  async createDucStream(): Promise<ReadableStream<Uint8Array>> {
    this.document.checkpointWal();
    const dbSize = this.document.getDbSizeBytes();
    const chunkSize = this.chunkSize;
    const document = this.document;

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const gzip = new AsyncGzip((error, chunk, final) => {
          if (error) {
            controller.error(error);
            return;
          }
          controller.enqueue(chunk);
          if (final) {
            controller.close();
          }
        });

        try {
          for (let offset = 0; offset < dbSize; offset += chunkSize) {
            const length = Math.min(chunkSize, dbSize - offset);
            const chunk = await document.exportDbChunk(offset, length);
            gzip.push(chunk, offset + length >= dbSize);
          }
          if (dbSize === 0) {
            gzip.push(new Uint8Array(), true);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  async exportDucBlob(): Promise<Blob> {
    const stream = await this.createDucStream();
    return new Response(stream, {
      headers: { "Content-Type": "application/octet-stream" },
    }).blob();
  }

  async exportDucBytes(): Promise<Uint8Array> {
    const buffer = await (await this.exportDucBlob()).arrayBuffer();
    return new Uint8Array(buffer);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    (this.document as { free?: () => void }).free?.();
  }
}

export async function serializeDucToStream(
  data: Partial<ExportedDataState>,
  options: BrowserDucDocumentOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const document = await BrowserDucDocument.create(options);
  document.writeState(data);
  return document.createDucStream();
}

export async function serializeDucToBlob(
  data: Partial<ExportedDataState>,
  options: BrowserDucDocumentOptions = {},
): Promise<Blob> {
  const stream = await serializeDucToStream(data, options);
  return new Response(stream, {
    headers: { "Content-Type": "application/octet-stream" },
  }).blob();
}
