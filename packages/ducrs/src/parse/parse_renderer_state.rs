use crate::generated::duc::RendererState;
use crate::types::RendererState as RendererStateT;

pub fn parse_renderer_state(renderer_state: &RendererState) -> RendererStateT {
    let mut deleted_element_ids = Vec::new();
    if let Some(ids) = renderer_state.deleted_element_ids() {
        for i in 0..ids.len() {
            deleted_element_ids.push(ids.get(i).to_string());
        }
    }
    RendererStateT {
        deleted_element_ids,
    }
} 