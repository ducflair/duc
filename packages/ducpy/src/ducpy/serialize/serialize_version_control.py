"""
Version control serialization functions for duc.fbs schema.
This module provides comprehensive serialization for version control related structures.
"""

import flatbuffers
from typing import List, Optional

# Import dataclasses from comprehensive classes
from ..classes.DataStateClass import (
    VersionGraph, VersionGraphMetadata, Checkpoint, Delta, VersionBase, JSONPatchOperation
)

# Import FlatBuffers generated classes
from ..Duc.VersionGraph import (
    VersionGraphStart, VersionGraphEnd,
    VersionGraphAddUserCheckpointVersionId, VersionGraphAddLatestVersionId,
    VersionGraphAddCheckpoints, VersionGraphAddDeltas, VersionGraphAddMetadata,
    VersionGraphStartCheckpointsVector, VersionGraphStartDeltasVector
)
from ..Duc.VersionGraphMetadata import (
    VersionGraphMetadataStart, VersionGraphMetadataEnd,
    VersionGraphMetadataAddPruningLevel, VersionGraphMetadataAddLastPruned,
    VersionGraphMetadataAddTotalSize
)
from ..Duc.Checkpoint import (
    CheckpointStart, CheckpointEnd,
    CheckpointAddBase, CheckpointAddData, CheckpointAddSizeBytes,
    CheckpointStartDataVector
)
from ..Duc.Delta import (
    DeltaStart, DeltaEnd,
    DeltaAddBase, DeltaAddPatch, DeltaStartPatchVector
)
from ..Duc.VersionBase import (
    VersionBaseStart, VersionBaseEnd,
    VersionBaseAddId, VersionBaseAddParentId, VersionBaseAddTimestamp,
    VersionBaseAddDescription, VersionBaseAddIsManualSave, VersionBaseAddUserId
)
from ..Duc.JSONPatchOperation import (
    JSONPatchOperationStart, JSONPatchOperationEnd,
    JSONPatchOperationAddOp, JSONPatchOperationAddPath, JSONPatchOperationAddValue
)


def serialize_fbs_version_base(builder: flatbuffers.Builder, version_base: VersionBase) -> int:
    """Serialize VersionBase to FlatBuffers."""
    id_offset = builder.CreateString(version_base.id)
    parent_id_offset = builder.CreateString(version_base.parent_id)
    description_offset = builder.CreateString(version_base.description)
    user_id_offset = builder.CreateString(version_base.user_id)
    
    VersionBaseStart(builder)
    VersionBaseAddId(builder, id_offset)
    VersionBaseAddParentId(builder, parent_id_offset)
    VersionBaseAddTimestamp(builder, version_base.timestamp)
    VersionBaseAddDescription(builder, description_offset)
    VersionBaseAddIsManualSave(builder, version_base.is_manual_save)
    VersionBaseAddUserId(builder, user_id_offset)
    return VersionBaseEnd(builder)


def serialize_fbs_json_patch_operation(builder: flatbuffers.Builder, patch_op: JSONPatchOperation) -> int:
    """Serialize JSONPatchOperation to FlatBuffers."""
    op_offset = builder.CreateString(patch_op.op)
    path_offset = builder.CreateString(patch_op.path)
    value_offset = builder.CreateString(patch_op.value)
    
    JSONPatchOperationStart(builder)
    JSONPatchOperationAddOp(builder, op_offset)
    JSONPatchOperationAddPath(builder, path_offset)
    JSONPatchOperationAddValue(builder, value_offset)
    return JSONPatchOperationEnd(builder)


def serialize_fbs_checkpoint(builder: flatbuffers.Builder, checkpoint: Checkpoint) -> int:
    """Serialize Checkpoint to FlatBuffers."""
    base_offset = serialize_fbs_version_base(builder, checkpoint)
    
    # Serialize data bytes
    CheckpointStartDataVector(builder, len(checkpoint.data))
    for byte_val in reversed(checkpoint.data):
        builder.PrependByte(byte_val)
    data_vector = builder.EndVector()
    
    CheckpointStart(builder)
    CheckpointAddBase(builder, base_offset)
    CheckpointAddData(builder, data_vector)
    CheckpointAddSizeBytes(builder, checkpoint.size_bytes)
    return CheckpointEnd(builder)


def serialize_fbs_delta(builder: flatbuffers.Builder, delta: Delta) -> int:
    """Serialize Delta to FlatBuffers."""
    base_offset = serialize_fbs_version_base(builder, delta)
    
    # Serialize patch operations
    patch_offsets = []
    for patch_op in delta.patch:
        patch_offsets.append(serialize_fbs_json_patch_operation(builder, patch_op))
    
    DeltaStartPatchVector(builder, len(patch_offsets))
    for offset in reversed(patch_offsets):
        builder.PrependUOffsetTRelative(offset)
    patch_vector = builder.EndVector()
    
    DeltaStart(builder)
    DeltaAddBase(builder, base_offset)
    DeltaAddPatch(builder, patch_vector)
    return DeltaEnd(builder)


def serialize_fbs_version_graph_metadata(builder: flatbuffers.Builder, metadata: VersionGraphMetadata) -> int:
    """Serialize VersionGraphMetadata to FlatBuffers."""
    VersionGraphMetadataStart(builder)
    if metadata.pruning_level is not None:
        VersionGraphMetadataAddPruningLevel(builder, metadata.pruning_level)
    VersionGraphMetadataAddLastPruned(builder, metadata.last_pruned)
    VersionGraphMetadataAddTotalSize(builder, metadata.total_size)
    return VersionGraphMetadataEnd(builder)


def serialize_fbs_version_graph(builder: flatbuffers.Builder, version_graph: VersionGraph) -> int:
    """Serialize VersionGraph to FlatBuffers using comprehensive structures."""
    if version_graph is None:
        return 0
    user_checkpoint_version_id_offset = builder.CreateString(version_graph.user_checkpoint_version_id)
    latest_version_id_offset = builder.CreateString(version_graph.latest_version_id)
    
    # Serialize checkpoints
    checkpoints_offsets = []
    for checkpoint in version_graph.checkpoints:
        checkpoints_offsets.append(serialize_fbs_checkpoint(builder, checkpoint))
    
    VersionGraphStartCheckpointsVector(builder, len(checkpoints_offsets))
    for offset in reversed(checkpoints_offsets):
        builder.PrependUOffsetTRelative(offset)
    checkpoints_vector = builder.EndVector()
    
    # Serialize deltas
    deltas_offsets = []
    for delta in version_graph.deltas:
        deltas_offsets.append(serialize_fbs_delta(builder, delta))
    
    VersionGraphStartDeltasVector(builder, len(deltas_offsets))
    for offset in reversed(deltas_offsets):
        builder.PrependUOffsetTRelative(offset)
    deltas_vector = builder.EndVector()
    
    # Serialize metadata
    metadata_offset = serialize_fbs_version_graph_metadata(builder, version_graph.metadata)
    
    VersionGraphStart(builder)
    VersionGraphAddUserCheckpointVersionId(builder, user_checkpoint_version_id_offset)
    VersionGraphAddLatestVersionId(builder, latest_version_id_offset)
    VersionGraphAddCheckpoints(builder, checkpoints_vector)
    VersionGraphAddDeltas(builder, deltas_vector)
    VersionGraphAddMetadata(builder, metadata_offset)
    return VersionGraphEnd(builder)
