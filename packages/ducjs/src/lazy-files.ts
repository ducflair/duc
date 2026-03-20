import type { DucExternalFile, DucExternalFiles, ExternalFileId, ExternalFileLoaded, ResolvedFileData, ExternalFilesData } from "./types";
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
  private runtimeFiles: Map<string, ExternalFileLoaded> = new Map();

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
  getFile(fileId: string): ExternalFileLoaded | null {
    const rt = this.runtimeFiles.get(fileId);
    if (rt) return rt;

    if (!this.buffer) return null;
    const result = wasmGetExternalFile(this.buffer, fileId);
    if (!result) return null;

    return result as ExternalFileLoaded;
  }

  /** Get the active revision data for a specific file. */
  getFileData(fileId: string): ResolvedFileData | null {
    const loaded = this.getFile(fileId);
    if (!loaded) return null;
    const meta = loaded.revisions[loaded.activeRevisionId];
    if (!meta) return null;
    const dataBlob = loaded.data[loaded.activeRevisionId];
    if (!dataBlob) return null;
    return { data: dataBlob, mimeType: meta.mimeType };
  }

  /** Fetch active revision data and return a copy of the data buffer (safe for transfer). */
  getFileDataCopy(fileId: string): ResolvedFileData | null {
    const data = this.getFileData(fileId);
    if (!data) return null;
    return {
      ...data,
      data: new Uint8Array(data.data),
    };
  }

  /** Add a file at runtime (not persisted in .duc until next serialize). */
  addRuntimeFile(fileId: string, file: DucExternalFile, data: Record<string, Uint8Array>): void {
    this.runtimeFiles.set(fileId, { ...file, data });
  }

  /** Remove a runtime file. */
  removeRuntimeFile(fileId: string): boolean {
    return this.runtimeFiles.delete(fileId);
  }

  /** Export all files metadata as a DucExternalFiles record. */
  toExternalFiles(): DucExternalFiles {
    const result: DucExternalFiles = {};

    if (this.buffer) {
      for (const [id] of this.getMetadataMap()) {
        const loaded = this.getFile(id);
        if (loaded) {
          const { data: _, ...file } = loaded;
          result[id as ExternalFileId] = file;
        }
      }
    }

    for (const [id, loaded] of this.runtimeFiles) {
      const { data: _, ...file } = loaded;
      result[id as ExternalFileId] = file;
    }

    return result;
  }

  /** Export all revision data blobs as an ExternalFilesData record. */
  toExternalFilesData(): ExternalFilesData {
    const result: ExternalFilesData = {};

    if (this.buffer) {
      for (const [id] of this.getMetadataMap()) {
        const loaded = this.getFile(id);
        if (loaded) {
          for (const [revId, blob] of Object.entries(loaded.data)) {
            result[revId] = blob;
          }
        }
      }
    }

    for (const [, loaded] of this.runtimeFiles) {
      for (const [revId, blob] of Object.entries(loaded.data)) {
        result[revId] = blob;
      }
    }

    return result;
  }

  /** Merge files from another source. Adds missing files and merges new revisions into existing ones. */
  mergeFiles(files: DucExternalFiles, filesData?: ExternalFilesData): void {
    for (const [id, file] of Object.entries(files)) {
      const existing = this.runtimeFiles.get(id) ?? this.getFile(id);

      if (!existing) {
        const dataMap: Record<string, Uint8Array> = {};
        if (filesData) {
          for (const revId of Object.keys(file.revisions)) {
            if (filesData[revId]) {
              dataMap[revId] = filesData[revId];
            }
          }
        }
        this.runtimeFiles.set(id, { ...file, data: dataMap });
        continue;
      }

      let merged = false;
      const mergedRevisions = { ...existing.revisions };
      const mergedData = { ...existing.data };
      for (const [revId, rev] of Object.entries(file.revisions)) {
        if (!mergedRevisions[revId]) {
          mergedRevisions[revId] = rev;
          if (filesData?.[revId]) {
            mergedData[revId] = filesData[revId];
          }
          merged = true;
          continue;
        }

        if (filesData?.[revId] && mergedData[revId] !== filesData[revId]) {
          mergedData[revId] = filesData[revId];
          merged = true;
        }

        if (
          rev.sizeBytes !== mergedRevisions[revId].sizeBytes ||
          rev.lastRetrieved !== mergedRevisions[revId].lastRetrieved ||
          rev.created !== mergedRevisions[revId].created ||
          rev.mimeType !== mergedRevisions[revId].mimeType ||
          rev.sourceName !== mergedRevisions[revId].sourceName ||
          rev.message !== mergedRevisions[revId].message
        ) {
          mergedRevisions[revId] = rev;
          merged = true;
        }
      }

      const activeRevisionChanged = file.activeRevisionId !== existing.activeRevisionId;
      if (merged || activeRevisionChanged || file.updated > existing.updated) {
        this.runtimeFiles.set(id, {
          ...existing,
          activeRevisionId: file.activeRevisionId,
          updated: Math.max(file.updated, existing.updated),
          version: Math.max(file.version ?? 0, existing.version ?? 0),
          revisions: mergedRevisions,
          data: mergedData,
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

