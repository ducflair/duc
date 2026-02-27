import { ensureWasm, wasmGetExternalFile, wasmListExternalFiles } from "./wasm";
import type { DucExternalFileData, DucExternalFiles } from "./types";

export type LazyFileMetadata = {
  id: string;
  mimeType: string;
  created: number;
  lastRetrieved?: number;
  version?: number;
};

/**
 * Provides lazy access to external files embedded inside a `.duc` buffer.
 *
 * Instead of loading all file blobs into memory at parse time, this store
 * keeps a reference to the raw `.duc` buffer and fetches individual files
 * on demand via WASM calls.
 */
export class LazyExternalFileStore {
  private buffer: Uint8Array | null;
  private metadataCache: Map<string, LazyFileMetadata> | null = null;
  private runtimeFiles: Map<string, DucExternalFileData> = new Map();

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
  }

  get isReleased(): boolean {
    return this.buffer === null;
  }

  get size(): number {
    return this.getMetadataMap().size + this.runtimeFiles.size;
  }

  /** Check if a file with this ID exists. */
  has(fileId: string): boolean {
    return this.runtimeFiles.has(fileId) || this.getMetadataMap().has(fileId);
  }

  /** Get metadata (without data blob) for a specific file. */
  getMetadata(fileId: string): LazyFileMetadata | undefined {
    const rt = this.runtimeFiles.get(fileId);
    if (rt) {
      return {
        id: rt.id,
        mimeType: rt.mimeType,
        created: rt.created,
        lastRetrieved: rt.lastRetrieved,
        version: rt.version,
      };
    }
    return this.getMetadataMap().get(fileId);
  }

  /** Get metadata for all files. */
  getAllMetadata(): LazyFileMetadata[] {
    const result: LazyFileMetadata[] = [];
    for (const meta of this.getMetadataMap().values()) {
      result.push(meta);
    }
    for (const [id, data] of this.runtimeFiles) {
      if (!this.getMetadataMap().has(id)) {
        result.push({
          id: data.id,
          mimeType: data.mimeType,
          created: data.created,
          lastRetrieved: data.lastRetrieved,
          version: data.version,
        });
      }
    }
    return result;
  }

  /** Fetch the full file data (including blob) for a specific file. */
  getFileData(fileId: string): DucExternalFileData | null {
    const rt = this.runtimeFiles.get(fileId);
    if (rt) return rt;

    if (!this.buffer) return null;
    const result = wasmGetExternalFile(this.buffer, fileId);
    if (!result) return null;
    return result as DucExternalFileData;
  }

  /** Fetch file data and return a copy of the data buffer (safe for transfer). */
  getFileDataCopy(fileId: string): DucExternalFileData | null {
    const data = this.getFileData(fileId);
    if (!data) return null;
    return {
      ...data,
      data: new Uint8Array(data.data),
    };
  }

  /** Add a file at runtime (not persisted in .duc until next serialize). */
  addRuntimeFile(fileId: string, data: DucExternalFileData): void {
    this.runtimeFiles.set(fileId, data);
  }

  /** Remove a runtime file. */
  removeRuntimeFile(fileId: string): boolean {
    return this.runtimeFiles.delete(fileId);
  }

  /** Export all files eagerly as a DucExternalFiles record. */
  toExternalFiles(): DucExternalFiles {
    const result: DucExternalFiles = {};

    if (this.buffer) {
      const metas = this.getMetadataMap();
      for (const [id] of metas) {
        const data = this.getFileData(id);
        if (data) {
          result[id] = data;
        }
      }
    }

    for (const [id, data] of this.runtimeFiles) {
      result[id] = data;
    }

    return result;
  }

  /** Merge files from another source (only adds missing). */
  mergeFiles(files: DucExternalFiles): void {
    for (const [id, data] of Object.entries(files)) {
      if (!this.has(id)) {
        this.runtimeFiles.set(id, data);
      }
    }
  }

  /** Release the underlying buffer to free memory. */
  release(): void {
    this.buffer = null;
    this.metadataCache = null;
  }

  private getMetadataMap(): Map<string, LazyFileMetadata> {
    if (!this.metadataCache) {
      this.metadataCache = new Map();
      if (this.buffer) {
        const metas = wasmListExternalFiles(this.buffer) as LazyFileMetadata[];
        if (metas) {
          for (const meta of metas) {
            this.metadataCache.set(meta.id, meta);
          }
        }
      }
    }
    return this.metadataCache;
  }
}
