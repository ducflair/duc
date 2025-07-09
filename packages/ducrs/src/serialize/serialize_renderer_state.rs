use flatbuffers::{FlatBufferBuilder, WIPOffset};

use crate::generated::duc::RendererState;
use crate::generated::duc::RendererStateBuilder;
use crate::types::RendererState as RendererStateT;

pub fn serialize_renderer_state<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    renderer_state: &RendererStateT,
) -> WIPOffset<RendererState<'a>> {
    let mut deleted_element_id_offsets = Vec::with_capacity(renderer_state.deleted_element_ids.len());
    for id in &renderer_state.deleted_element_ids {
        deleted_element_id_offsets.push(builder.create_string(id));
    }

    let deleted_element_ids_vec = builder.create_vector(&deleted_element_id_offsets);

    let mut renderer_state_builder = RendererStateBuilder::new(builder);
    renderer_state_builder.add_deleted_element_ids(deleted_element_ids_vec);
    renderer_state_builder.finish()
} 