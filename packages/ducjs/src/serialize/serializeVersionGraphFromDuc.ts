import { VersionGraph as BinVersionGraph, Checkpoint as BinCheckpoint, Delta as BinDelta, VersionBase as BinVersionBase } from 'ducjs/duc';
import type { VersionGraph, Checkpoint, Delta } from 'ducjs/types';
import * as flatbuffers from 'flatbuffers';

const serializeVersionBaseFromDuc = (
  builder: flatbuffers.Builder,
  versionBase: Checkpoint | Delta
): flatbuffers.Offset => {
  const idOffset = builder.createString(versionBase.id);
  const parentIdOffset = versionBase.parentId ? builder.createString(versionBase.parentId) : null;
  const descriptionOffset = versionBase.description ? builder.createString(versionBase.description) : null;
  const userIdOffset = versionBase.userId ? builder.createString(versionBase.userId) : null;

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
  const patchOffset = builder.createString(JSON.stringify(delta.patch));

  BinDelta.startDelta(builder);
  BinDelta.addBase(builder, baseOffset);
  BinDelta.addPatch(builder, patchOffset);
  return BinDelta.endDelta(builder);
};

export const serializeVersionGraphFromDuc = (
  builder: flatbuffers.Builder,
  versionGraph: VersionGraph
): flatbuffers.Offset => {
  const userCheckpointVersionIdOffset = builder.createString(versionGraph.userCheckpointVersionId);
  const latestVersionIdOffset = builder.createString(versionGraph.latestVersionId);

  // Serialize checkpoints
  const checkpointOffsets = versionGraph.checkpoints.map(checkpoint => 
    serializeCheckpointFromDuc(builder, checkpoint)
  );
  const checkpointsVector = BinVersionGraph.createCheckpointsVector(builder, checkpointOffsets);

  // Serialize deltas
  const deltaOffsets = versionGraph.deltas.map(delta => 
    serializeDeltaFromDuc(builder, delta)
  );
  const deltasVector = BinVersionGraph.createDeltasVector(builder, deltaOffsets);

  BinVersionGraph.startVersionGraph(builder);
  BinVersionGraph.addUserCheckpointVersionId(builder, userCheckpointVersionIdOffset);
  BinVersionGraph.addLatestVersionId(builder, latestVersionIdOffset);
  BinVersionGraph.addCheckpoints(builder, checkpointsVector);
  BinVersionGraph.addDeltas(builder, deltasVector);
  return BinVersionGraph.endVersionGraph(builder);
};
