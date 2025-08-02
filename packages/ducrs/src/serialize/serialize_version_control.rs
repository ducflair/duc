use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::generated::duc::{
    self as fb, CheckpointBuilder, DeltaBuilder, JSONPatchOperationBuilder, VersionBaseBuilder,
    VersionGraphBuilder, VersionGraphMetadataBuilder,
};
use crate::types;

pub fn serialize_version_graph<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    graph: &types::VersionGraph,
) -> WIPOffset<fb::VersionGraph<'a>> {
    let user_checkpoint_version_id =
        builder.create_string(&graph.user_checkpoint_version_id);
    let latest_version_id = builder.create_string(&graph.latest_version_id);
    let checkpoints = builder.create_vector(
        &graph
            .checkpoints
            .iter()
            .map(|c| serialize_checkpoint(builder, c))
            .collect::<Vec<_>>(),
    );
    let deltas = builder.create_vector(
        &graph
            .deltas
            .iter()
            .map(|d| serialize_delta(builder, d))
            .collect::<Vec<_>>(),
    );
    let metadata = serialize_version_graph_metadata(builder, &graph.metadata);

    let mut graph_builder = VersionGraphBuilder::new(builder);
    graph_builder.add_user_checkpoint_version_id(user_checkpoint_version_id);
    graph_builder.add_latest_version_id(latest_version_id);
    graph_builder.add_checkpoints(checkpoints);
    graph_builder.add_deltas(deltas);
    graph_builder.add_metadata(metadata);
    graph_builder.finish()
}

fn serialize_checkpoint<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    checkpoint: &types::Checkpoint,
) -> WIPOffset<fb::Checkpoint<'a>> {
    let base = serialize_version_base(builder, &checkpoint.base);
    let data = builder.create_vector(&checkpoint.data);

    let mut checkpoint_builder = CheckpointBuilder::new(builder);
    checkpoint_builder.add_base(base);
    checkpoint_builder.add_data(data);
    checkpoint_builder.add_size_bytes(checkpoint.size_bytes);
    checkpoint_builder.finish()
}

fn serialize_delta<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    delta: &types::Delta,
) -> WIPOffset<fb::Delta<'a>> {
    let base = serialize_version_base(builder, &delta.base);
    let patch = builder.create_vector(
        &delta
            .patch
            .iter()
            .map(|p| serialize_json_patch_operation(builder, p))
            .collect::<Vec<_>>(),
    );
    let mut delta_builder = DeltaBuilder::new(builder);
    delta_builder.add_base(base);
    delta_builder.add_patch(patch);
    delta_builder.finish()
}

fn serialize_version_base<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    base: &types::VersionBase,
) -> WIPOffset<fb::VersionBase<'a>> {
    let id = builder.create_string(&base.id);
    let parent_id = builder.create_string(&base.parent_id);
    let description = builder.create_string(&base.description);
    let user_id = builder.create_string(&base.user_id);

    let mut base_builder = VersionBaseBuilder::new(builder);
    base_builder.add_id(id);
    base_builder.add_parent_id(parent_id);
    base_builder.add_timestamp(base.timestamp);
    base_builder.add_description(description);
    base_builder.add_is_manual_save(base.is_manual_save);
    base_builder.add_user_id(user_id);
    base_builder.finish()
}

fn serialize_json_patch_operation<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    op: &types::JSONPatchOperation,
) -> WIPOffset<fb::JSONPatchOperation<'a>> {
    let op_str = builder.create_string(&op.op);
    let path = builder.create_string(&op.path);
    let value = builder.create_string(&op.value);

    let mut op_builder = JSONPatchOperationBuilder::new(builder);
    op_builder.add_op(op_str);
    op_builder.add_path(path);
    op_builder.add_value(value);
    op_builder.finish()
}

fn serialize_version_graph_metadata<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    metadata: &types::VersionGraphMetadata,
) -> WIPOffset<fb::VersionGraphMetadata<'a>> {
    let mut metadata_builder = VersionGraphMetadataBuilder::new(builder);
    if let Some(pruning_level) = metadata.pruning_level {
        metadata_builder.add_pruning_level(pruning_level);
    }
    metadata_builder.add_last_pruned(metadata.last_pruned);
    metadata_builder.add_total_size(metadata.total_size);
    metadata_builder.finish()
}
