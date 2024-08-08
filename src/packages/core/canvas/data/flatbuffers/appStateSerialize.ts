import flatbuffers from 'flatbuffers';
import { AppState as BinAppState, UserToFollow, DucGroup, DucElement as BinDucElement, ActiveTool } from '../duc';
import { AppState } from '../../types';

const serializeAppState = (builder: flatbuffers.Builder, appState: Partial<AppState>): flatbuffers.Offset => {
  BinAppState.startAppState(builder);

  BinAppState.addIsLoading(builder, appState.isLoading || false);

  if (appState.name) {
    BinAppState.addName(builder, builder.createString(appState.name));
  }

  BinAppState.addWidth(builder, appState.width || 0);
  BinAppState.addHeight(builder, appState.height || 0);
  BinAppState.addOffsetTop(builder, appState.offsetTop || 0);
  BinAppState.addOffsetLeft(builder, appState.offsetLeft || 0);

  if (appState.fileHandle) {
    BinAppState.addFileHandle(builder, builder.createString(appState.fileHandle.toString()));
  }

  if (appState.collaborators) {
    const collaboratorsOffsets = Array.from(appState.collaborators.values()).map(collaborator => builder.createString(collaborator.username));
    const collaboratorsVector = BinAppState.createCollaboratorsVector(builder, collaboratorsOffsets);
    BinAppState.addCollaborators(builder, collaboratorsVector);
  }

  if (appState.pendingImageElementId) {
    BinAppState.addPendingImageElementId(builder, builder.createString(appState.pendingImageElementId));
  }

  if (appState.showHyperlinkPopup) {
    BinAppState.addShowHyperlinkPopup(builder, builder.createString(appState.showHyperlinkPopup));
  }

  BinAppState.addOriginSnapOffsetX(builder, appState.originSnapOffset?.x || 0.0);
  BinAppState.addOriginSnapOffsetY(builder, appState.originSnapOffset?.y || 0.0);
  BinAppState.addObjectsSnapModeEnabled(builder, appState.objectsSnapModeEnabled || false);

  if (appState.userToFollow) {
    const userToFollowOffset = UserToFollow.createUserToFollow(builder, appState.userToFollow);
    BinAppState.addUserToFollow(builder, userToFollowOffset);
  }

  if (appState.followedBy) {
    const followedByOffsets = Array.from(appState.followedBy).map(follower => builder.createString(follower));
    const followedByVector = BinAppState.createFollowedByVector(builder, followedByOffsets);
    BinAppState.addFollowedBy(builder, followedByVector);
  }

  BinAppState.addIsResizing(builder, appState.isResizing || false);
  BinAppState.addIsRotating(builder, appState.isRotating || false);
  BinAppState.addZoom(builder, appState.zoom?.value || 0.0);

  if (appState.lastPointerDownWith) {
    BinAppState.addLastPointerDownWith(builder, builder.createString(appState.lastPointerDownWith));
  }

  if (appState.selectedElementIds) {
    const selectedElementIdsOffsets = Object.keys(appState.selectedElementIds).map(id => builder.createString(id));
    const selectedElementIdsVector = BinAppState.createSelectedElementIdsVector(builder, selectedElementIdsOffsets);
    BinAppState.addSelectedElementIds(builder, selectedElementIdsVector);
  }

  if (appState.previousSelectedElementIds) {
    const previousSelectedElementIdsOffsets = Object.keys(appState.previousSelectedElementIds).map(id => builder.createString(id));
    const previousSelectedElementIdsVector = BinAppState.createPreviousSelectedElementIdsVector(builder, previousSelectedElementIdsOffsets);
    BinAppState.addPreviousSelectedElementIds(builder, previousSelectedElementIdsVector);
  }

  BinAppState.addSelectedElementsAreBeingDragged(builder, appState.selectedElementsAreBeingDragged || false);
  BinAppState.addShouldCacheIgnoreZoom(builder, appState.shouldCacheIgnoreZoom || false);
  BinAppState.addGridSize(builder, appState.gridSize || 0);
  BinAppState.addViewModeEnabled(builder, appState.viewModeEnabled || false);

  if (appState.selectedGroupIds) {
    const selectedGroupIdsOffsets = Object.keys(appState.selectedGroupIds).map(id => builder.createString(id));
    const selectedGroupIdsVector = BinAppState.createSelectedGroupIdsVector(builder, selectedGroupIdsOffsets);
    BinAppState.addSelectedGroupIds(builder, selectedGroupIdsVector);
  }

  if (appState.editingGroupId) {
    BinAppState.addEditingGroupId(builder, builder.createString(appState.editingGroupId));
  }

  BinAppState.addScrollX(builder, appState.scrollX || 0.0);
  BinAppState.addScrollY(builder, appState.scrollY || 0.0);

  if (appState.cursorButton) {
    BinAppState.addCursorButton(builder, builder.createString(appState.cursorButton));
  }

  BinAppState.addScrolledOutside(builder, appState.scrolledOutside || false);

  if (appState.groups) {
    const groupsOffsets = appState.groups.map(group => DucGroup.createDucGroup(builder, group));
    const groupsVector = BinAppState.createGroupsVector(builder, groupsOffsets);
    BinAppState.addGroups(builder, groupsVector);
  }

  if (appState.scope) {
    BinAppState.addScope(builder, builder.createString(appState.scope));
  }

  if (appState.writingLayer) {
    BinAppState.addWritingLayer(builder, builder.createString(appState.writingLayer));
  }

  BinAppState.addExportBackground(builder, appState.exportBackground || false);
  BinAppState.addExportEmbedScene(builder, appState.exportEmbedScene || false);
  BinAppState.addExportWithDarkMode(builder, appState.exportWithDarkMode || false);
  BinAppState.addExportScale(builder, appState.exportScale || 0.0);

  if (appState.currentItemStrokeColor) {
    BinAppState.addCurrentItemStrokeColor(builder, builder.createString(appState.currentItemStrokeColor));
  }

  if (appState.currentItemBackgroundColor) {
    BinAppState.addCurrentItemBackgroundColor(builder, builder.createString(appState.currentItemBackgroundColor));
  }

  if (appState.currentItemFillStyle) {
    BinAppState.addCurrentItemFillStyle(builder, builder.createString(appState.currentItemFillStyle));
  }

  BinAppState.addCurrentItemStrokeWidth(builder, appState.currentItemStrokeWidth || 0);

  if (appState.currentItemStrokeStyle) {
    BinAppState.addCurrentItemStrokeStyle(builder, builder.createString(appState.currentItemStrokeStyle));
  }

  BinAppState.addCurrentItemRoughness(builder, appState.currentItemRoughness || 0);
  BinAppState.addCurrentItemOpacity(builder, appState.currentItemOpacity || 0.0);

  if (appState.currentItemFontFamily) {
    BinAppState.addCurrentItemFontFamily(builder, builder.createString(appState.currentItemFontFamily));
  }

  BinAppState.addCurrentItemFontSize(builder, appState.currentItemFontSize || 0);

  if (appState.currentItemTextAlign) {
    BinAppState.addCurrentItemTextAlign(builder, builder.createString(appState.currentItemTextAlign));
  }

  if (appState.currentItemStartArrowhead) {
    BinAppState.addCurrentItemStartArrowhead(builder, builder.createString(appState.currentItemStartArrowhead));
  }

  if (appState.currentItemEndArrowhead) {
    BinAppState.addCurrentItemEndArrowhead(builder, builder.createString(appState.currentItemEndArrowhead));
  }

  if (appState.currentItemRoundness) {
    BinAppState.addCurrentItemRoundness(builder, builder.createString(appState.currentItemRoundness));
  }

  if (appState.viewBackgroundColor) {
    BinAppState.addViewBackgroundColor(builder, builder.createString(appState.viewBackgroundColor));
  }

  BinAppState.addFrameRenderingEnabled(builder, appState.frameRendering.enabled || false);
  BinAppState.addFrameRenderingName(builder, appState.frameRendering.name || false);
  BinAppState.addFrameRenderingOutline(builder, appState.frameRendering.outline || false);
  BinAppState.addFrameRenderingClip(builder, appState.frameRendering.clip || false);

  if (appState.editingFrame) {
    BinAppState.addEditingFrame(builder, builder.createString(appState.editingFrame));
  }

  if (Array.isArray(appState.elementsToHighlight)) {
    const elementsToHighlightOffsets = appState.elementsToHighlight.map(element => BinDucElement.createDucElement(builder, element, DucElementUnion.DucEmbeddableElement, false));
    const elementsToHighlightVector = BinAppState.createElementsToHighlightVector(builder, elementsToHighlightOffsets);
    BinAppState.addElementsToHighlight(builder, elementsToHighlightVector);
  }

  if (appState.editingElement) {
    const editingElementOffset = BinDucElement.createDucElement(builder, appState.editingElement);
    BinAppState.addEditingElement(builder, editingElementOffset);
  }

  if (appState.activeTool) {
    const activeToolOffset = ActiveTool.createActiveTool(builder, appState.activeTool);
    BinAppState.addActiveTool(builder, activeToolOffset);
  }

  BinAppState.addPenMode(builder, appState.penMode || false);
  BinAppState.addPenDetected(builder, appState.penDetected || false);

  return BinAppState.endAppState(builder);
};

export { serializeAppState };
