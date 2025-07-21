from typing import List, Optional

from ..classes.DataStateClass import VersionBase, Checkpoint, JSONPatchOperation, Delta, VersionGraphMetadata, VersionGraph

from ..Duc.VersionBase import VersionBase as FBSVersionBase
from ..Duc.Checkpoint import Checkpoint as FBSCheckpoint
from ..Duc.JSONPatchOperation import JSONPatchOperation as FBSJSONPatchOperation
from ..Duc.Delta import Delta as FBSDelta
from ..Duc.VersionGraphMetadata import VersionGraphMetadata as FBSVersionGraphMetadata
from ..Duc.VersionGraph import VersionGraph as FBSVersionGraph
from ..Duc.PRUNING_LEVEL import PRUNING_LEVEL

def parse_fbs_version_base(fbs_version_base: FBSVersionBase) -> VersionBase:
    return VersionBase(
        id=fbs_version_base.Id().decode('utf-8'),
        parent_id=fbs_version_base.ParentId().decode('utf-8') if fbs_version_base.ParentId() else None,
        timestamp=fbs_version_base.Timestamp(),
        description=fbs_version_base.Description().decode('utf-8') if fbs_version_base.Description() else None,
        is_manual_save=bool(fbs_version_base.IsManualSave()),
        user_id=fbs_version_base.UserId().decode('utf-8') if fbs_version_base.UserId() else None
    )

def parse_fbs_json_patch_operation(fbs_json_patch_op: FBSJSONPatchOperation) -> JSONPatchOperation:
    return JSONPatchOperation(
        op=fbs_json_patch_op.Op().decode('utf-8'),
        path=fbs_json_patch_op.Path().decode('utf-8'),
        value=fbs_json_patch_op.Value().decode('utf-8')
    )

def parse_fbs_checkpoint(fbs_checkpoint: FBSCheckpoint) -> Checkpoint:
    return Checkpoint(
        base=parse_fbs_version_base(fbs_checkpoint.Base()),
        data=bytes(fbs_checkpoint.DataAsNumpy()) if fbs_checkpoint.DataLength() > 0 else b'',
        size_bytes=fbs_checkpoint.SizeBytes()
    )

def parse_fbs_delta(fbs_delta: FBSDelta) -> Delta:
    patch_list = [parse_fbs_json_patch_operation(fbs_delta.Patch(i)) for i in range(fbs_delta.PatchLength())]
    return Delta(
        base=parse_fbs_version_base(fbs_delta.Base()),
        patch=patch_list
    )

def parse_fbs_version_graph_metadata(fbs_metadata: FBSVersionGraphMetadata) -> VersionGraphMetadata:
    return VersionGraphMetadata(
        pruning_level=fbs_metadata.PruningLevel() if fbs_metadata.PruningLevel() is not None else None,
        last_pruned=fbs_metadata.LastPruned(),
        total_size=fbs_metadata.TotalSize()
    )

def parse_fbs_version_graph(fbs_version_graph: FBSVersionGraph) -> VersionGraph:
    checkpoints_list = [parse_fbs_checkpoint(fbs_version_graph.Checkpoints(i)) for i in range(fbs_version_graph.CheckpointsLength())]
    deltas_list = [parse_fbs_delta(fbs_version_graph.Deltas(i)) for i in range(fbs_version_graph.DeltasLength())]
    return VersionGraph(
        user_checkpoint_version_id=fbs_version_graph.UserCheckpointVersionId().decode('utf-8') if fbs_version_graph.UserCheckpointVersionId() else None,
        latest_version_id=fbs_version_graph.LatestVersionId().decode('utf-8') if fbs_version_graph.LatestVersionId() else None,
        checkpoints=checkpoints_list,
        deltas=deltas_list,
        metadata=parse_fbs_version_graph_metadata(fbs_version_graph.Metadata())
    ) 