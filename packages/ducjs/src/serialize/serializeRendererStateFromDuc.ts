import * as flatbuffers from 'flatbuffers';
import { RendererState } from 'ducjs/duc';

export const serializeRendererState = (
  builder: flatbuffers.Builder,
  rendererState: { deletedElementIds: string[] },
) => {
  const deletedElementIdsOffset = RendererState.createDeletedElementIdsVector(
    builder,
    rendererState.deletedElementIds.map((id) => builder.createString(id)),
  );

  RendererState.startRendererState(builder);
  RendererState.addDeletedElementIds(builder, deletedElementIdsOffset);
  return RendererState.endRendererState(builder);
}; 