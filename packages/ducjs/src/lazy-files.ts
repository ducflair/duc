import type { DucExternalFile, DucExternalFiles, ExternalFileId, ExternalFileRevision } from "./types";
import { wasmGetExternalFile, wasmListExternalFiles } from "./wasm";

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
  private runtimeFiles: Map<string, DucExternalFile> = new Map();

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
      const active = rt.revisions[rt.activeRevisionId];
      if (!active) return undefined;
      return {
        id: rt.id,
        mimeType: active.mimeType,
        created: active.created,
        lastRetrieved: active.lastRetrieved,
        version: rt.version,
      };
    }
    return this.getMetadataMap().get(fileId);
  }

  /** Get metadata for all files. */
  getAllMetadata(): LazyFileMetadata[] {
    const result: LazyFileMetadata[] = [];
    const persisted = this.getMetadataMap();
    for (const meta of persisted.values()) {
      result.push(meta);
    }
    for (const [id, file] of this.runtimeFiles) {
      if (!persisted.has(id)) {
        const active = file.revisions[file.activeRevisionId];
        if (active) {
          result.push({
            id: file.id,
            mimeType: active.mimeType,
            created: active.created,
            lastRetrieved: active.lastRetrieved,
            version: file.version,
          });
        }
      }
    }
    return result;
  }

  /** Fetch the full file (including data blobs for all revisions) for a specific file. */
  getFile(fileId: string): DucExternalFile | null {
    const rt = this.runtimeFiles.get(fileId);
    if (rt) return rt;

    if (!this.buffer) return null;
    const result = wasmGetExternalFile(this.buffer, fileId);
    if (!result) return null;

    return result as DucExternalFile;
  }

  /** Get the active revision data for a specific file. */
  getFileData(fileId: string): ExternalFileRevision | null {
    const file = this.getFile(fileId);
    if (!file) return null;
    return file.revisions[file.activeRevisionId] ?? null;
  }

  /** Fetch active revision data and return a copy of the data buffer (safe for transfer). */
  getFileDataCopy(fileId: string): ExternalFileRevision | null {
    const data = this.getFileData(fileId);
    if (!data) return null;
    return {
      ...data,
      data: new Uint8Array(data.data),
    };
  }

  /** Add a file at runtime (not persisted in .duc until next serialize). */
  addRuntimeFile(fileId: string, file: DucExternalFile): void {
    this.runtimeFiles.set(fileId, file);
  }

  /** Remove a runtime file. */
  removeRuntimeFile(fileId: string): boolean {
    return this.runtimeFiles.delete(fileId);
  }

  /** Export all files eagerly as a DucExternalFiles record. */
  toExternalFiles(): DucExternalFiles {
    const result: DucExternalFiles = {};

    if (this.buffer) {
      for (const [id] of this.getMetadataMap()) {
        const file = this.getFile(id);
        if (file) {
          result[id as ExternalFileId] = file;
        }
      }
    }

    for (const [id, file] of this.runtimeFiles) {
      result[id as ExternalFileId] = file;
    }

    return result;
  }

  /** Merge files from another source. Adds missing files and merges new revisions into existing ones. */
  mergeFiles(files: DucExternalFiles): void {
    for (const [id, file] of Object.entries(files)) {
      if (!this.has(id)) {
        this.runtimeFiles.set(id, file);
        continue;
      }

      const existing = this.runtimeFiles.get(id) ?? this.getFile(id);
      if (!existing) {
        this.runtimeFiles.set(id, file);
        continue;
      }

      // Merge: add any new revisions that don't exist yet, and update metadata
      let merged = false;
      const mergedRevisions = { ...existing.revisions };
      for (const [revId, rev] of Object.entries(file.revisions)) {
        if (!mergedRevisions[revId]) {
          mergedRevisions[revId] = rev;
          merged = true;
        }
      }

      if (merged || file.updated > existing.updated) {
        this.runtimeFiles.set(id, {
          ...existing,
          activeRevisionId: file.activeRevisionId,
          updated: Math.max(file.updated, existing.updated),
          version: Math.max(file.version ?? 0, existing.version ?? 0),
          revisions: mergedRevisions,
        });
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

