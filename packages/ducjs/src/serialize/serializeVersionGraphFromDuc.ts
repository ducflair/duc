import {
  VersionGraph as BinVersionGraph,
  Checkpoint as BinCheckpoint,
  Delta as BinDelta,
  VersionBase as BinVersionBase,
  VersionGraphMetadata as BinVersionGraphMetadata,
  JSONPatchOperation as BinJSONPatchOperation,
} from "ducjs/duc";
import type { VersionGraph, Checkpoint, Delta } from "ducjs/types";
import * as flatbuffers from "flatbuffers";

const serializeVersionBaseFromDuc = (
  builder: flatbuffers.Builder,
  versionBase: Checkpoint | Delta
): flatbuffers.Offset => {
  const idOffset = builder.createString(versionBase.id);
  const parentIdOffset = versionBase.parentId
    ? builder.createString(versionBase.parentId)
    : 0;
  const descriptionOffset = versionBase.description
    ? builder.createString(versionBase.description)
    : 0;
  const userIdOffset = versionBase.userId
    ? builder.createString(versionBase.userId)
    : 0;

  BinVersionBase.startVersionBase(builder);
  BinVersionBase.addId(builder, idOffset);
  if (parentIdOffset) BinVersionBase.addParentId(builder, parentIdOffset);
  BinVersionBase.addTimestamp(builder, BigInt(versionBase.timestamp));
  if (descriptionOffset) BinVersionBase.addDescription(builder, descriptionOffset);
  BinVersionBase.addIsManualSave(builder, versionBase.isManualSave);
  if (userIdOffset) BinVersionBase.addUserId(builder, userIdOffset);
  return BinVersionBase.endVersionBase(builder);
};

const serializeCheckpointFromDuc = (
  builder: flatbuffers.Builder,
  checkpoint: Checkpoint
): flatbuffers.Offset => {
  const baseOffset = serializeVersionBaseFromDuc(builder, checkpoint);
  const dataOffset = BinCheckpoint.createDataVector(builder, checkpoint.data);

  BinCheckpoint.startCheckpoint(builder);
  BinCheckpoint.addBase(builder, baseOffset);
  BinCheckpoint.addData(builder, dataOffset);
  BinCheckpoint.addSizeBytes(builder, BigInt(checkpoint.sizeBytes));
  return BinCheckpoint.endCheckpoint(builder);
};

const serializeDeltaFromDuc = (
  builder: flatbuffers.Builder,
  delta: Delta
): flatbuffers.Offset => {
  const baseOffset = serializeVersionBaseFromDuc(builder, delta);

  // Serialize JSONPatchOperation[] as schema requires (vector of table, not a single JSON string)
  const opOffsets = delta.patch.map((op) => {
    const opOffset = builder.createString(op.op);
    const pathOffset = builder.createString(op.path);
    const fromOffset = op.from ? builder.createString(op.from) : 0;
    // value is stored as serialized JSON string per schema
    const valueStr =
      "value" in op && op.value !== undefined ? JSON.stringify(op.value) : "";
    const valueOffset = builder.createString(valueStr);

    BinJSONPatchOperation.startJSONPatchOperation(builder);
    BinJSONPatchOperation.addOp(builder, opOffset);
    BinJSONPatchOperation.addPath(builder, pathOffset);
    if (fromOffset) BinJSONPatchOperation.addFrom(builder, fromOffset);
    BinJSONPatchOperation.addValue(builder, valueOffset);
    return BinJSONPatchOperation.endJSONPatchOperation(builder);
  });
  const patchVector =
    opOffsets.length > 0
      ? BinDelta.createPatchVector(builder, opOffsets)
      : 0;

  BinDelta.startDelta(builder);
  BinDelta.addBase(builder, baseOffset);
  if (patchVector) BinDelta.addPatch(builder, patchVector);
  return BinDelta.endDelta(builder);
};

export const serializeVersionGraphFromDuc = (
  builder: flatbuffers.Builder,
  versionGraph: VersionGraph
): flatbuffers.Offset => {
  const userCheckpointVersionIdOffset = builder.createString(
    versionGraph.userCheckpointVersionId
  );
  const latestVersionIdOffset = builder.createString(
    versionGraph.latestVersionId
  );

  // Serialize checkpoints
  const checkpointOffsets = versionGraph.checkpoints.map((checkpoint) =>
    serializeCheckpointFromDuc(builder, checkpoint)
  );
  const checkpointsVector = BinVersionGraph.createCheckpointsVector(
    builder,
    checkpointOffsets
  );

  // Serialize deltas
  const deltaOffsets = versionGraph.deltas.map((delta) =>
    serializeDeltaFromDuc(builder, delta)
  );
  const deltasVector = BinVersionGraph.createDeltasVector(
    builder,
    deltaOffsets
  );

  // Serialize metadata if present
  let metadataOffset: flatbuffers.Offset = 0;
  if (versionGraph.metadata) {
    BinVersionGraphMetadata.startVersionGraphMetadata(builder);
    if (versionGraph.metadata.pruningLevel !== undefined) {
      BinVersionGraphMetadata.addPruningLevel(
        builder,
        versionGraph.metadata.pruningLevel
      );
    }
    BinVersionGraphMetadata.addLastPruned(
      builder,
      BigInt(versionGraph.metadata.lastPruned ?? 0)
    );
    BinVersionGraphMetadata.addTotalSize(
      builder,
      BigInt(versionGraph.metadata.totalSize ?? 0)
    );
    metadataOffset = BinVersionGraphMetadata.endVersionGraphMetadata(builder);
  }

  BinVersionGraph.startVersionGraph(builder);
  BinVersionGraph.addUserCheckpointVersionId(
    builder,
    userCheckpointVersionIdOffset
  );
  BinVersionGraph.addLatestVersionId(builder, latestVersionIdOffset);
  BinVersionGraph.addCheckpoints(builder, checkpointsVector);
  BinVersionGraph.addDeltas(builder, deltasVector);
  if (metadataOffset) {
    BinVersionGraph.addMetadata(builder, metadataOffset);
  }
  return BinVersionGraph.endVersionGraph(builder);
};
