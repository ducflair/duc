import { restore, type ElementsConfig, type RestoreConfig } from "./restore";
import { transformToRust } from "./transform";
import type { ExportedDataState } from "./types";
import { ensureWasm, wasmGetCurrentSchemaVersion, wasmParseDuc, wasmSerializeDuc } from "./wasm";

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

  const inputVG = (data as any)?.versionGraph;

  const restored = restore(
    {
      ...(data as any),
      // Version graph is preserved separately — bypass restore()'s VG processing.
      versionGraph: undefined,
    },
    elementsConfig ?? { syncInvalidIndices: (els) => els as any },
    restoreConfig,
  );

  const shouldDropLegacyVersionGraph = hasLegacyVersionGraphShape(
    inputVG,
  );

  // Use the ORIGINAL version graph data instead of the restored one.
  // The restore pipeline (restoreCheckpoint/restoreDelta) filters checkpoints
  // and deltas through isValidUint8Array which can reject valid in-memory 
  // Uint8Array data (e.g. empty remote placeholders or detached buffers),
  // silently dropping version history.
  // hasLegacyVersionGraphShape already validates structural integrity.
  const versionGraphForPayload = shouldDropLegacyVersionGraph
    ? undefined
    : prepareVersionGraphForSerialization(inputVG);

  const normalizedVersionGraphForPayload = versionGraphForPayload
    ? normalizeVersionGraphVersionNumbers(versionGraphForPayload)
    : undefined;

  const payloadForRust = {
    type: data.type ?? "duc",
    version: data.version ?? DUC_SCHEMA_VERSION ?? decodeUserVersionToSemver(wasmGetCurrentSchemaVersion()),
    source: data.source ?? "ducjs",
    ...restored,
    versionGraph: normalizedVersionGraphForPayload,
  };

  const prepared = transformToRust(payloadForRust);
  const serialized = wasmSerializeDuc(prepared);

  return serialized;
}

/**
 * Ensure version numbers are unique before persistence.
 * SQLite schema enforces UNIQUE(version_number) on both checkpoints and deltas.
 * Collisions would otherwise cause INSERT OR REPLACE to drop historical entries.
 */
function normalizeVersionGraphVersionNumbers(vg: any): any {
  const normalizeList = (items: any[]): any[] => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const sorted = [...items].sort((a, b) => {
      const aNum = Number.isFinite(a?.versionNumber) ? Number(a.versionNumber) : Number.MAX_SAFE_INTEGER;
      const bNum = Number.isFinite(b?.versionNumber) ? Number(b.versionNumber) : Number.MAX_SAFE_INTEGER;
      if (aNum !== bNum) return aNum - bNum;

      const aTs = Number.isFinite(a?.timestamp) ? Number(a.timestamp) : 0;
      const bTs = Number.isFinite(b?.timestamp) ? Number(b.timestamp) : 0;
      if (aTs !== bTs) return aTs - bTs;

      const aId = typeof a?.id === "string" ? a.id : "";
      const bId = typeof b?.id === "string" ? b.id : "";
      return aId.localeCompare(bId);
    });

    let nextVersion = 0;
    return sorted.map((item) => {
      const candidate = Number.isFinite(item?.versionNumber) ? Number(item.versionNumber) : nextVersion;
      const assigned = Math.max(candidate, nextVersion);
      nextVersion = assigned + 1;
      return {
        ...item,
        versionNumber: assigned,
      };
    });
  };

  const checkpoints = normalizeList(Array.isArray(vg?.checkpoints) ? vg.checkpoints : []);
  const deltas = normalizeList(Array.isArray(vg?.deltas) ? vg.deltas : []);

  const maxCheckpointVersion = checkpoints.length
    ? Math.max(...checkpoints.map((cp: any) => Number(cp.versionNumber) || 0))
    : 0;
  const maxDeltaVersion = deltas.length
    ? Math.max(...deltas.map((d: any) => Number(d.versionNumber) || 0))
    : 0;
  const maxVersion = Math.max(maxCheckpointVersion, maxDeltaVersion, 0);

  return {
    ...vg,
    checkpoints,
    deltas,
    metadata: {
      ...vg.metadata,
      currentVersion: Number.isFinite(vg?.metadata?.currentVersion)
        ? Math.max(Number(vg.metadata.currentVersion), maxVersion)
        : maxVersion,
    },
  };
}

/**
 * Prepares version graph for serialization by filtering out shell entries
 * (remote placeholders with empty data/payload) while preserving all entries
 * with actual binary data intact.
 */
function prepareVersionGraphForSerialization(vg: any): any {
  if (!vg || typeof vg !== "object") return undefined;

  const checkpoints = Array.isArray(vg.checkpoints)
    ? vg.checkpoints.filter((cp: any) => {
      const data = cp?.data;
      if (data instanceof Uint8Array) return data.byteLength > 0;
      if (data instanceof ArrayBuffer) return data.byteLength > 0;
      // Accept base64 strings (from JSON imports)
      if (typeof data === "string" && data.length > 0) return true;
      return false;
    })
    : [];

  const deltas = Array.isArray(vg.deltas)
    ? vg.deltas.filter((d: any) => {
      const payload = d?.payload;
      if (payload instanceof Uint8Array) return payload.byteLength > 0;
      if (payload instanceof ArrayBuffer) return payload.byteLength > 0;
      if (typeof payload === "string" && payload.length > 0) return true;
      return false;
    })
    : [];

  return {
    ...vg,
    checkpoints,
    deltas,
  };
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
