/**
 * LazyExternalFileStore — Zero-copy, on-demand access to external file data from a FlatBuffer.
 *
 * Instead of eagerly parsing and copying every external file's binary data into JS memory,
 * this store keeps a reference to the original FlatBuffer Uint8Array and reads file bytes
 * only when explicitly requested. FlatBuffer `dataArray()` returns a zero-copy view
 * (a Uint8Array pointing into the original buffer), so no allocation occurs until the
 * consumer actually needs the data.
 *
 * Memory lifecycle:
 *   1. On parse: only metadata (~200 bytes per file) enters JS heap.
 *   2. On demand: `getFileData(fileId)` reads the zero-copy slice from the buffer.
 *   3. The caller (renderer/worker) uses the data, then lets it GC naturally.
 *   4. If the store is released, the buffer reference is dropped, freeing everything.
 *
 * This is the key to supporting 1000s of external files without RAM bloat.
 */

import * as flatbuffers from "flatbuffers";
import { ExportedDataState as ExportedDataStateFb } from "./flatbuffers/duc";
import type { DucExternalFileData, DucExternalFileMetadata, DucExternalFiles } from "./types";
import type { ExternalFileId } from "./types/elements";

export type ExternalFileMetadataMap = Record<string, DucExternalFileMetadata>;

interface LazyFileEntry {
  metadata: DucExternalFileMetadata;
  /** Index into the ExportedDataState.externalFiles vector */
  vectorIndex: number;
}

export class LazyExternalFileStore {
  private _buffer: Uint8Array | null;
  private _byteBuffer: flatbuffers.ByteBuffer | null;
  private _dataState: ExportedDataStateFb | null;

  /** Map from file id → lazy entry */
  private _entries = new Map<string, LazyFileEntry>();
  /** Map from element key → file id (the external_files vector uses element id as key) */
  private _keyToFileId = new Map<string, string>();

  /**
   * Files that were added at runtime (e.g. user uploading a new image).
   * These aren't in the original FlatBuffer so we hold their data directly.
   */
  private _runtimeFiles = new Map<string, DucExternalFileData>();

  constructor(buffer: Uint8Array) {
    this._buffer = buffer;
    this._byteBuffer = new flatbuffers.ByteBuffer(buffer);
    this._dataState = ExportedDataStateFb.getRootAsExportedDataState(this._byteBuffer);
    this._indexMetadata();
    console.info(`[LazyExternalFileStore] indexed ${this._entries.size} files from ${buffer.byteLength} byte buffer, ids: [${[...this._entries.keys()].map(k => k.slice(0, 12)).join(', ')}]`);
  }

  private _indexMetadata(): void {
    if (!this._dataState) return;

    const count = this._dataState.externalFilesLength();
    for (let i = 0; i < count; i++) {
      const entry = this._dataState.externalFiles(i);
      if (!entry) continue;

      const key = entry.key();
      const fileData = entry.value();
      if (!key || !fileData) continue;

      const id = fileData.id() as ExternalFileId | null;
      if (!id) continue;

      const metadata: DucExternalFileMetadata = {
        id,
        mimeType: fileData.mimeType() || "application/octet-stream",
        created: Number(fileData.created()),
        lastRetrieved: Number(fileData.lastRetrieved()) || undefined,
      };

      const lazyEntry: LazyFileEntry = { metadata, vectorIndex: i };
      this._entries.set(id, lazyEntry);
      this._keyToFileId.set(key, id);
    }
  }

  /** Total number of external files */
  get size(): number {
    return this._entries.size + this._runtimeFiles.size;
  }

  /** Whether a file with the given id exists */
  has(fileId: string): boolean {
    return this._entries.has(fileId) || this._runtimeFiles.has(fileId);
  }

  /** Get metadata only (no binary data copied) — ~200 bytes per file */
  getMetadata(fileId: string): DucExternalFileMetadata | null {
    const runtime = this._runtimeFiles.get(fileId);
    if (runtime) {
      const { data: _, ...meta } = runtime;
      return meta;
    }
    return this._entries.get(fileId)?.metadata ?? null;
  }

  /** Get all metadata entries (for UI listing, etc.) */
  getAllMetadata(): ExternalFileMetadataMap {
    const result: ExternalFileMetadataMap = {};

    for (const [id, entry] of this._entries) {
      result[id] = entry.metadata;
    }
    for (const [id, file] of this._runtimeFiles) {
      const { data: _, ...meta } = file;
      result[id] = meta;
    }

    return result;
  }

  /**
   * Get full file data (metadata + binary bytes) ON DEMAND.
   *
   * For files from the original FlatBuffer, this returns a zero-copy Uint8Array
   * view into the original buffer — no allocation for the file bytes themselves.
   * The view is valid as long as this store hasn't been released.
   *
   * For runtime-added files, returns the data directly.
   */
  getFileData(fileId: string): DucExternalFileData | null {
    const runtime = this._runtimeFiles.get(fileId);
    if (runtime) return runtime;

    const entry = this._entries.get(fileId);
    if (!entry || !this._dataState) return null;

    const fbEntry = this._dataState.externalFiles(entry.vectorIndex);
    if (!fbEntry) return null;

    const fileData = fbEntry.value();
    if (!fileData) return null;

    const data = fileData.dataArray();
    if (!data) return null;

    return {
      ...entry.metadata,
      data,
    };
  }

  /**
   * Get a detached copy of the file data (allocates new ArrayBuffer).
   * Use this when you need to transfer data to a worker or keep it beyond store lifetime.
   */
  getFileDataCopy(fileId: string): DucExternalFileData | null {
    const fileDataRef = this.getFileData(fileId);
    if (!fileDataRef) return null;

    return {
      ...fileDataRef,
      data: new Uint8Array(fileDataRef.data),
    };
  }

  /**
   * Add a file at runtime (user upload, paste, etc.).
   * These files are held in memory since they aren't in the FlatBuffer.
   */
  addRuntimeFile(fileData: DucExternalFileData): void {
    this._runtimeFiles.set(fileData.id, fileData);
  }

  /** Remove a runtime-added file */
  removeRuntimeFile(fileId: string): void {
    this._runtimeFiles.delete(fileId);
  }

  /**
   * Export all files as a standard DucExternalFiles record.
   * This COPIES all file data eagerly — use only for serialization.
   */
  toExternalFiles(): DucExternalFiles {
    const result: DucExternalFiles = {};

    for (const [key, fileId] of this._keyToFileId) {
      const fileData = this.getFileData(fileId);
      if (fileData) {
        result[key] = fileData;
      }
    }

    for (const [id, file] of this._runtimeFiles) {
      result[id] = file;
    }

    return result;
  }

  /**
   * Merge runtime files from the given DucExternalFiles map.
   * Only adds files not already present in the store.
   */
  mergeFiles(files: DucExternalFiles): void {
    for (const [_key, fileData] of Object.entries(files)) {
      if (!this.has(fileData.id)) {
        this.addRuntimeFile(fileData);
      }
    }
  }

  /** Estimated RAM usage for metadata only (not counting the backing buffer) */
  get estimatedMetadataBytes(): number {
    let bytes = 0;
    for (const [, entry] of this._entries) {
      bytes += 200 + entry.metadata.id.length * 2 + entry.metadata.mimeType.length * 2;
    }
    for (const [, file] of this._runtimeFiles) {
      bytes += 200 + (file.data?.byteLength ?? 0);
    }
    return bytes;
  }

  /**
   * Release the FlatBuffer reference. After this, only runtime-added files remain accessible.
   * Call this when switching documents or when the store is no longer needed.
   */
  release(): void {
    this._buffer = null;
    this._byteBuffer = null;
    this._dataState = null;
    this._entries.clear();
    this._keyToFileId.clear();
  }

  /** Whether the store has been released */
  get isReleased(): boolean {
    return this._buffer === null;
  }
}
