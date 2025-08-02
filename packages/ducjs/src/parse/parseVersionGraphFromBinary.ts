import {
  VersionGraph as DucVersionGraph,
  Checkpoint as BinCheckpoint,
  Delta as BinDelta,
  VersionBase as BinVersionBase,
  JSONPatchOperation as BinJSONPatchOperation,
  VersionGraphMetadata as BinVersionGraphMetadata,
} from "ducjs/duc";
import type {
  VersionGraph,
  Checkpoint,
  Delta,
  VersionBase,
  JSONPatch,
} from "ducjs/types";

/**
 * Parse common VersionBase fields from FlatBuffers
 */
function parseVersionBase(
  base: BinVersionBase | null
): Omit<VersionBase, "type"> {
  if (!base) {
    // FlatBuffers always provides the table when used, but guard for safety
  }
  return {
    id: base?.id() ?? "",
    parentId: base?.parentId() ?? null,
    timestamp: Number((base && base.timestamp && base.timestamp()) || 0),
    description: base?.description() ?? undefined,
    isManualSave: Boolean(base?.isManualSave()),
    userId: base?.userId() ?? undefined,
  };
}

/**
 * Parse a JSONPatch array out of JSONPatchOperation[] FlatBuffers vector.
 * The schema stores 'value' as a serialized JSON string.
 */
function parsePatchVector(delta: BinDelta): JSONPatch {
  const out: JSONPatch = [];
  const len = delta.patchLength();
  for (let i = 0; i < len; i++) {
    const opEntry: BinJSONPatchOperation | null = delta.patch(i);
    if (!opEntry) continue;
    const op = opEntry.op() ?? "";
    const path = opEntry.path() ?? "";
    const from = opEntry.from() ?? undefined;

    let value: unknown | undefined = undefined;
    const raw = opEntry.value();
    if (raw !== null && raw !== undefined) {
      try {
        value = JSON.parse(raw);
      } catch {
        // If malformed, keep as raw string to avoid data loss
        value = raw;
      }
    }

    // Build JSON Patch operation. 'from' and 'value' are optional by RFC6902.
    const entry: { op: string; path: string; from?: string; value?: unknown } =
      { op, path };
    if (from !== undefined) entry.from = from;
    if (value !== undefined) entry.value = value;
    out.push(entry as any);
  }
  return out as JSONPatch;
}

/**
 * Parse a Checkpoint table
 */
function parseCheckpoint(node: BinCheckpoint): Checkpoint {
  const base = parseVersionBase(node.base());
  const dataArr = node.dataArray() ?? new Uint8Array();
  return {
    type: "checkpoint",
    ...base,
    data: dataArr,
    sizeBytes: Number((node && node.sizeBytes && node.sizeBytes()) || 0),
  };
}

/**
 * Parse a Delta table
 */
function parseDelta(node: BinDelta): Delta {
  const base = parseVersionBase(node.base());
  const patch = parsePatchVector(node);
  return {
    type: "delta",
    ...base,
    patch,
  };
}

/**
 * Parses a version graph from FlatBuffers object into typed JS structure.
 */
export function parseVersionGraphFromBinary(
  versionGraph: DucVersionGraph | null
): VersionGraph | null {
  if (!versionGraph) return null;

  const userCheckpointVersionId = versionGraph.userCheckpointVersionId() ?? "";
  const latestVersionId = versionGraph.latestVersionId() ?? "";

  // checkpoints
  const checkpoints: Checkpoint[] = [];
  const ckLen = versionGraph.checkpointsLength();
  for (let i = 0; i < ckLen; i++) {
    const ck = versionGraph.checkpoints(i);
    if (!ck) continue;
    checkpoints.push(parseCheckpoint(ck));
  }

  // deltas
  const deltas: Delta[] = [];
  const dLen = versionGraph.deltasLength();
  for (let i = 0; i < dLen; i++) {
    const d = versionGraph.deltas(i);
    if (!d) continue;
    deltas.push(parseDelta(d));
  }

  // metadata (optional in our types; schema has the table)
  const meta: BinVersionGraphMetadata | null = versionGraph.metadata();
  return {
    userCheckpointVersionId,
    latestVersionId,
    checkpoints,
    deltas,
    metadata: {
      pruningLevel: meta!.pruningLevel()!, // enum ubyte
      lastPruned: Number((meta && meta.lastPruned && meta.lastPruned()) || 0),
      totalSize: Number((meta && meta.totalSize && meta.totalSize()) || 0),
    },
  };
}
