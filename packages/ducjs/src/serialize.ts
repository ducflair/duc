import { restore, type ElementsConfig, type RestoreConfig } from "./restore";
import { transformToRust } from "./transform";
import type { ExportedDataState } from "./types";
import { ensureWasm, wasmGetCurrentSchemaVersion, wasmSerializeDuc } from "./wasm";

const getSchemaVersionFromEnv = (): string | undefined => {
  const maybeProcess = (globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }).process;

  return maybeProcess?.env?.DUC_SCHEMA_VERSION;
};

const decodeUserVersionToSemver = (userVersion: number): string => {
  const major = Math.floor(userVersion / 1_000_000);
  const minor = Math.floor((userVersion % 1_000_000) / 1_000);
  const patch = userVersion % 1_000;
  return `${major}.${minor}.${patch}`;
};

export const DUC_SCHEMA_VERSION = getSchemaVersionFromEnv();

/**
 * Serialize an ExportedDataState into `.duc` bytes (Uint8Array).
 *
 * 1. restore() for defaults & migrations
 * 2. Element fixups (re-wrap stack elements)
 * 3. WASM serialize (JS → Rust via serde-wasm-bindgen → SQLite → bytes)
 */
export async function serializeDuc(
  data: Partial<ExportedDataState>,
  elementsConfig?: ElementsConfig,
  restoreConfig?: RestoreConfig,
): Promise<Uint8Array> {
  await ensureWasm();

  const restored = restore(
    data as any,
    elementsConfig ?? { syncInvalidIndices: (els) => els as any },
    restoreConfig,
  );

  const shouldDropLegacyVersionGraph = hasLegacyVersionGraphShape(
    (data as any)?.versionGraph,
  );

  const payloadForRust = {
    type: data.type ?? "duc",
    version: data.version ?? DUC_SCHEMA_VERSION ?? decodeUserVersionToSemver(wasmGetCurrentSchemaVersion()),
    source: data.source ?? "ducjs",
    ...restored,
    versionGraph: shouldDropLegacyVersionGraph
      ? undefined
      : restored.versionGraph,
  };

  const prepared = transformToRust(payloadForRust);

  return wasmSerializeDuc(prepared);
}

function hasLegacyVersionGraphShape(versionGraph: any): boolean {
  if (!versionGraph || typeof versionGraph !== "object") {
    return false;
  }

  const metadata = versionGraph.metadata;
  if (!metadata || typeof metadata !== "object") {
    return true;
  }

  const hasModernMetadata =
    typeof metadata.currentVersion === "number" &&
    typeof metadata.currentSchemaVersion === "number" &&
    typeof metadata.chainCount === "number";

  if (!hasModernMetadata) {
    return true;
  }

  if (metadata.currentSchemaVersion < 1 || metadata.chainCount < 1) {
    return true;
  }

  const checkpoints = Array.isArray(versionGraph.checkpoints)
    ? versionGraph.checkpoints
    : [];
  const deltas = Array.isArray(versionGraph.deltas) ? versionGraph.deltas : [];

  const hasLegacyCheckpoint = checkpoints.some(
    (cp: any) =>
      typeof cp?.versionNumber !== "number" ||
      typeof cp?.schemaVersion !== "number",
  );
  if (hasLegacyCheckpoint) {
    return true;
  }

  const hasLegacyDelta = deltas.some(
    (d: any) =>
      typeof d?.versionNumber !== "number" ||
      typeof d?.schemaVersion !== "number" ||
      typeof d?.baseCheckpointId !== "string",
  );
  if (hasLegacyDelta) {
    return true;
  }

  return false;
}
