import { AppState as BinAppState, UserToFollow, ActiveTool } from '../duc';
import { SupportedMeasures } from '../../utils/measurements';
import { WritingLayers } from "../../utils/writingLayers";
import { AppState, NormalizedZoomValue } from '../../../types';
import { Arrowhead, DucGroup, FillStyle, PointerType, StrokeRoundness, StrokeStyle } from '../../../element/types';


export const parseAppStateFromBinary = (appState: BinAppState | null): Partial<AppState> => {
  if (!appState) return {};

//   // Parse collaborators
//   let collaborators = [];
//   for (let i = 0; i < appState.collaboratorsLength(); i++) {
//     const collaborator = appState.collaborators(i);
//     if (collaborator) { collaborators.push(collaborator); }
//   }

//   // Parse userToFollow
//   const userToFollow = appState.userToFollow()
//     ? {
//         socketId: appState.userToFollow()?.socketId() || '',
//         username: appState.userToFollow()?.username() || '',
//       }
//     : null;

//   // Parse followedBy
//   let followedBy = new Set<string>();
//   for (let i = 0; i < appState.followedByLength(); i++) {
//     followedBy.add(appState.followedBy(i) || '');
//   }

  // Parse groups
  let groups: DucGroup[] = [];
  for (let i = 0; i < appState.groupsLength(); i++) {
    const group = appState.groups(i);
    if (group) {
      groups.push({
        id: group.id() || '',
        label: group.label() || '',
        type: 'group',
        writingLayer: (group.writingLayer() || '') as WritingLayers,
        scope: (group.scope() || '') as SupportedMeasures,
        isCollapsed: group.isCollapsed(),
      });
    }
  }

  return {
    isLoading: appState.isLoading() || false,
    name: appState.name() || '',
    width: appState.width() || 0,
    height: appState.height() || 0,
    offsetTop: appState.offsetTop() || 0,
    offsetLeft: appState.offsetLeft() || 0,
    // collaborators: collaborators,
    pendingImageElementId: appState.pendingImageElementId() || '',
    originSnapOffset: {
      x: appState.originSnapOffsetX() || 0,
      y: appState.originSnapOffsetY() || 0,
    },
    objectsSnapModeEnabled: appState.objectsSnapModeEnabled() || false,
    // userToFollow: userToFollow,
    // followedBy: followedBy,
    isResizing: appState.isResizing() || false,
    isRotating: appState.isRotating() || false,
    zoom: {
      value: (appState.zoom() || 0.0) as NormalizedZoomValue,
    },
    lastPointerDownWith: appState.lastPointerDownWith() as PointerType || undefined,
    selectedElementIds: Object.fromEntries(
      Array.from({ length: appState.selectedElementIdsLength() }, (_, i) => [
        appState.selectedElementIds(i),
        true,
      ])
    ),
    previousSelectedElementIds: Object.fromEntries(
      Array.from({ length: appState.previousSelectedElementIdsLength() }, (_, i) => [
        appState.previousSelectedElementIds(i),
        true,
      ])
    ),
    selectedElementsAreBeingDragged: appState.selectedElementsAreBeingDragged() || false,
    shouldCacheIgnoreZoom: appState.shouldCacheIgnoreZoom() || false,
    gridSize: appState.gridSize() || 0,
    viewModeEnabled: appState.viewModeEnabled() || false,
    selectedGroupIds: Object.fromEntries(
      Array.from({ length: appState.selectedGroupIdsLength() }, (_, i) => [
        appState.selectedGroupIds(i),
        true,
      ])
    ),
    editingGroupId: appState.editingGroupId() || '',
    scrollX: appState.scrollX() || 0.0,
    scrollY: appState.scrollY() || 0.0,
    cursorButton: appState.cursorButton() as "up" | "down" | undefined || undefined,
    scrolledOutside: appState.scrolledOutside() || false,
    groups: groups,
    scope: (appState.scope() || 'mm') as SupportedMeasures,
    writingLayer: (appState.writingLayer() || 'notes') as WritingLayers,
    exportBackground: appState.exportBackground() || false,
    exportEmbedScene: appState.exportEmbedScene() || false,
    exportWithDarkMode: appState.exportWithDarkMode() || false,
    exportScale: appState.exportScale() || 0.0,
    currentItemStrokeColor: appState.currentItemStrokeColor() || '',
    currentItemBackgroundColor: appState.currentItemBackgroundColor() || '',
    currentItemFillStyle: (appState.currentItemFillStyle() || '') as FillStyle,
    currentItemStrokeWidth: appState.currentItemStrokeWidth() || 0,
    currentItemStrokeStyle: (appState.currentItemStrokeStyle() || '') as StrokeStyle,
    currentItemRoughness: appState.currentItemRoughness() || 0,
    currentItemOpacity: appState.currentItemOpacity() || 0.0,
    currentItemFontFamily: Number(appState.currentItemFontFamily() || '1'),
    currentItemFontSize: appState.currentItemFontSize() || 0,
    currentItemTextAlign: appState.currentItemTextAlign() || '',
    currentItemStartArrowhead: (appState.currentItemStartArrowhead() || '') as Arrowhead,
    currentItemEndArrowhead: (appState.currentItemEndArrowhead() || '') as Arrowhead,
    currentItemRoundness: (appState.currentItemRoundness() || '') as StrokeRoundness,
    viewBackgroundColor: appState.viewBackgroundColor() || '',
    frameRendering: {
      enabled: appState.frameRenderingEnabled() || false,
      name: appState.frameRenderingName() || false,
      outline: appState.frameRenderingOutline() || false,
      clip: appState.frameRenderingClip() || false,
    },
    editingFrame: appState.editingFrame() || '',
  };
};
