import type { VersionGraph } from "./types";
import {
    ensureWasm,
    wasmGetCurrentSchemaVersion,
    wasmListVersions,
    wasmReadVersionGraph,
    wasmRestoreCheckpoint,
    wasmRestoreVersion,
    wasmRevertToVersion,
} from "./wasm";

export interface RestoredVersion {
  versionNumber: number;
  schemaVersion: number;
  data: Uint8Array;
  fromCheckpoint: boolean;
}

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

/**
 * Restore the full document state at a specific version number.
 *
 * If the version corresponds to a checkpoint, the raw data is returned directly.
 * Otherwise, the nearest preceding checkpoint is loaded and deltas are replayed
 * on top of it to reconstruct the state.
 *
 * All heavy lifting (SQLite access, decompression, delta replay) happens in
 * Rust/WASM.
 */
export const restoreVersion = async (
  ducBuffer: Uint8Array,
  versionNumber: number,
): Promise<RestoredVersion> => {
  await ensureWasm();
  const result = wasmRestoreVersion(ducBuffer, versionNumber);
  if (!result) {
    throw new Error(`Failed to restore version ${versionNumber}`);
  }
  return result as RestoredVersion;
};

/**
 * Restore a specific checkpoint by its ID.
 */
export const restoreCheckpoint = async (
  ducBuffer: Uint8Array,
  checkpointId: string,
): Promise<RestoredVersion> => {
  await ensureWasm();
  const result = wasmRestoreCheckpoint(ducBuffer, checkpointId);
  if (!result) {
    throw new Error(`Failed to restore checkpoint ${checkpointId}`);
  }
  return result as RestoredVersion;
};

/**
 * List all versions (checkpoints and deltas) in the .duc file,
 * ordered by version number descending. Does not load data blobs.
 */
export const listVersions = async (
  ducBuffer: Uint8Array,
): Promise<VersionEntry[]> => {
  await ensureWasm();
  const result = wasmListVersions(ducBuffer);
  return (result ?? []) as VersionEntry[];
};

/**
 * Read the full version graph from the .duc file, including all
 * checkpoints, deltas, chains, and metadata.
 */
export const readVersionGraph = async (
  ducBuffer: Uint8Array,
): Promise<VersionGraph | undefined> => {
  await ensureWasm();
  return wasmReadVersionGraph(ducBuffer) as VersionGraph | undefined;
};

/**
 * Revert the document to a specific version, deleting all versions
 * newer than the target. Returns the restored state at that version.
 *
 * **Warning**: This mutates the .duc buffer in-place (via the WASM
 * SQLite connection). The returned `RestoredVersion.data` contains the
 * full document state at the target version.
 */
export const revertToVersion = async (
  ducBuffer: Uint8Array,
  targetVersion: number,
): Promise<RestoredVersion> => {
  await ensureWasm();
  const result = wasmRevertToVersion(ducBuffer, targetVersion);
  if (!result) {
    throw new Error(`Failed to revert to version ${targetVersion}`);
  }
  return result as RestoredVersion;
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
