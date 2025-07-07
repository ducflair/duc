import { RendererState } from 'ducjs/duc';

export const parseRendererStateFromBinary = (
  rendererState: RendererState | null,
) => {
  if (!rendererState) {
    return { deletedElementIds: [] };
  }

  const deletedElementIds: string[] = [];
  for (let i = 0; i < rendererState.deletedElementIdsLength(); i++) {
    const id = rendererState.deletedElementIds(i);
    if (id) {
      deletedElementIds.push(id);
    }
  }

  return {
    deletedElementIds,
  };
}; 