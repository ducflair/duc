import type { VersionGraph } from "./types";
import {
    ensureWasm,
    wasmApplyDeltaChangeset,
    wasmCreateDeltaChangeset,
    wasmGetCurrentSchemaVersion,
} from "./wasm";

export interface VersionEntry {
  id: string;
  versionNumber: number;
  schemaVersion: number;
  timestamp: number;
  description?: string;
  isManualSave: boolean;
  userId?: string;
  versionType: "checkpoint" | "delta";
  sizeBytes: number;
}

export interface VersionControlDocument {
  listVersions(): VersionEntry[];
  readVersionGraph(): VersionGraph | undefined;
  readCheckpointDataChunk(checkpointId: string, chunkIndex: number): Uint8Array | undefined;
  readDeltaChangesetChunk(deltaId: string, chunkIndex: number): Uint8Array | undefined;
}

/**
 * List all versions (checkpoints and deltas) in the .duc file,
 * ordered by version number descending. Does not load data blobs.
 */
export const listVersions = async (
  document: VersionControlDocument,
): Promise<VersionEntry[]> => {
  const result = document.listVersions();
  return (result ?? []) as VersionEntry[];
};

/**
 * Read version graph metadata from the document. Checkpoint `data` and delta
 * `payload` arrays are intentionally empty; use the chunk readers below for
 * payload bytes.
 */
export const readVersionGraph = async (
  document: VersionControlDocument,
): Promise<VersionGraph | undefined> => {
  return document.readVersionGraph() as VersionGraph | undefined;
};

export const readCheckpointDataChunk = async (
  document: VersionControlDocument,
  checkpointId: string,
  chunkIndex: number,
): Promise<Uint8Array | undefined> => {
  return document.readCheckpointDataChunk(checkpointId, chunkIndex);
};

export const readDeltaChangesetChunk = async (
  document: VersionControlDocument,
  deltaId: string,
  chunkIndex: number,
): Promise<Uint8Array | undefined> => {
  return document.readDeltaChangesetChunk(deltaId, chunkIndex);
};

/**
 * Returns the current version-control schema version from Rust.
 *
 * This is the single source of truth for the schema version number,
 * generated from `schema/duc.sql` (`PRAGMA user_version`) at build time.
 * The version control system handles migration bookkeeping automatically
 * on the next checkpoint or delta creation.
 */
export const getCurrentSchemaVersion = async (): Promise<number> => {
  await ensureWasm();
  return wasmGetCurrentSchemaVersion();
};

/**
 * Compute a checkpoint-relative binary diff changeset using bsdiff.
 *
 * `baseState` is the checkpoint's full data blob (the snapshot at the
 * base checkpoint version). `currentState` is the full document state
 * at the new version being saved as a delta.
 *
 * Returns an encoded changeset (`Uint8Array`) suitable for use as
 * `Delta.payload`. bsdiff finds matching blocks even when they shift
 * offsets, which is critical for SQLite databases where internal page
 * reordering makes simple byte-level diffs ineffective.
 *
 * Use this when constructing `Delta` objects for the `VersionGraph` before
 * calling `writeDocumentState()` and streaming the resulting payload chunks.
 */
export const createDeltaChangeset = async (
  baseState: Uint8Array,
  currentState: Uint8Array,
): Promise<Uint8Array> => {
  await ensureWasm();
  return wasmCreateDeltaChangeset(baseState, currentState);
};

/**
 * Apply a changeset to reconstruct document state.
 *
 * `baseState` must be the exact checkpoint data used when the changeset
 * was created. Returns the full document state as `Uint8Array`.
 *
 * Handles all changeset formats transparently:
 *   - v3 (bsdiff), v2 (XOR diff), v1 (gzip full snapshot)
 */
export const applyDeltaChangeset = async (
  baseState: Uint8Array,
  changeset: Uint8Array,
): Promise<Uint8Array> => {
  await ensureWasm();
  return wasmApplyDeltaChangeset(baseState, changeset);
};
