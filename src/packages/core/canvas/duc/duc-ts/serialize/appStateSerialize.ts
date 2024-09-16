import * as flatbuffers from 'flatbuffers';
import { AppState as BinAppState, UserToFollow, DucGroup } from '../duc';
import { AppState } from '../../../types';
import { serializeDucElement } from './ducElementSerialize';

const serializeAppState = (builder: flatbuffers.Builder, appState: Partial<AppState>): flatbuffers.Offset => {
  // Create string offsets and vectors
  const nameOffset = appState.name ? builder.createString(appState.name) : null;
  const fileHandleOffset = appState.fileHandle ? builder.createString(appState.fileHandle.toString()) : null;
  const pendingImageElementIdOffset = appState.pendingImageElementId ? builder.createString(appState.pendingImageElementId) : null;
  const showHyperlinkPopupOffset = appState.showHyperlinkPopup ? builder.createString(appState.showHyperlinkPopup) : null;

  // const collaboratorsOffsets = appState.collaborators ? Array.from(appState.collaborators.values()).map(collaborator => builder.createString(collaborator.username)) : [];
  // const collaboratorsVector = collaboratorsOffsets.length > 0 ? BinAppState.createCollaboratorsVector(builder, collaboratorsOffsets) : null;

  const lastPointerDownWithOffset = appState.lastPointerDownWith ? builder.createString(appState.lastPointerDownWith) : null;

  const selectedElementIdsOffsets = appState.selectedElementIds ? Object.keys(appState.selectedElementIds).map(id => builder.createString(id)) : [];
  const selectedElementIdsVector = selectedElementIdsOffsets.length > 0 ? BinAppState.createSelectedElementIdsVector(builder, selectedElementIdsOffsets) : null;

  const previousSelectedElementIdsOffsets = appState.previousSelectedElementIds ? Object.keys(appState.previousSelectedElementIds).map(id => builder.createString(id)) : [];
  const previousSelectedElementIdsVector = previousSelectedElementIdsOffsets.length > 0 ? BinAppState.createPreviousSelectedElementIdsVector(builder, previousSelectedElementIdsOffsets) : null;

  const selectedGroupIdsOffsets = appState.selectedGroupIds ? Object.keys(appState.selectedGroupIds).map(id => builder.createString(id)) : [];
  const selectedGroupIdsVector = selectedGroupIdsOffsets.length > 0 ? BinAppState.createSelectedGroupIdsVector(builder, selectedGroupIdsOffsets) : null;

  const editingGroupIdOffset = appState.editingGroupId ? builder.createString(appState.editingGroupId) : null;
  const cursorButtonOffset = appState.cursorButton ? builder.createString(appState.cursorButton) : null;

  const groupsOffsets = appState.groups ? appState.groups.map(group => {
    const idOffset = builder.createString(group.id);
    const labelOffset = builder.createString(group.label);
    const typeOffset = builder.createString(group.type);
    const writingLayerOffset = builder.createString(group.writingLayer);
    const scopeOffset = builder.createString(group.scope);
    const isCollapsed = group.isCollapsed || false;
    return DucGroup.createDucGroup(
      builder,
      idOffset,
      typeOffset,
      isCollapsed,
      labelOffset,
      scopeOffset,
      writingLayerOffset
    );
  }) : [];
  const groupsVector = groupsOffsets.length > 0 ? BinAppState.createGroupsVector(builder, groupsOffsets) : null;

  const scopeOffset = appState.scope ? builder.createString(appState.scope) : null;
  const writingLayerOffset = appState.writingLayer ? builder.createString(appState.writingLayer) : null;

  const currentItemStrokeColorOffset = appState.currentItemStrokeColor ? builder.createString(appState.currentItemStrokeColor) : null;
  const currentItemBackgroundColorOffset = appState.currentItemBackgroundColor ? builder.createString(appState.currentItemBackgroundColor) : null;
  const currentItemFillStyleOffset = appState.currentItemFillStyle ? builder.createString(appState.currentItemFillStyle) : null;
  const currentItemStrokeStyleOffset = appState.currentItemStrokeStyle ? builder.createString(appState.currentItemStrokeStyle) : null;
  const currentItemFontFamilyOffset = appState.currentItemFontFamily ? builder.createString(appState.currentItemFontFamily.toString()) : null;
  const currentItemTextAlignOffset = appState.currentItemTextAlign ? builder.createString(appState.currentItemTextAlign) : null;
  const currentItemStartArrowheadOffset = appState.currentItemStartArrowhead ? builder.createString(appState.currentItemStartArrowhead) : null;
  const currentItemEndArrowheadOffset = appState.currentItemEndArrowhead ? builder.createString(appState.currentItemEndArrowhead) : null;
  const currentItemRoundnessOffset = appState.currentItemRoundness ? builder.createString(appState.currentItemRoundness) : null;

  const viewBackgroundColorOffset = appState.viewBackgroundColor ? builder.createString(appState.viewBackgroundColor) : null;
  const editingFrameOffset = appState.editingFrame ? builder.createString(appState.editingFrame) : null;

  const elementsToHighlightOffsets = Array.isArray(appState.elementsToHighlight) ? appState.elementsToHighlight.map(element => serializeDucElement(builder, element)) : [];
  const elementsToHighlightVector = elementsToHighlightOffsets.length > 0 ? BinAppState.createElementsToHighlightVector(builder, elementsToHighlightOffsets) : null;

  const editingElementOffset = appState.editingElement ? serializeDucElement(builder, appState.editingElement) : null;


  // Serialize UserToFollow if it exists
  // const userToFollowOffset = appState.userToFollow ? UserToFollow.createUserToFollow(builder, builder.createString(appState.userToFollow.socketId), builder.createString(appState.userToFollow.username)) : null;

  // Serialize followedBy if it exists
  // const followedByOffsets = appState.followedBy ? Array.from(appState.followedBy).map(follower => builder.createString(follower)) : [];
  // const followedByVector = followedByOffsets.length > 0 ? BinAppState.createFollowedByVector(builder, followedByOffsets) : null;

  // Now start the AppState object
  BinAppState.startAppState(builder);

  BinAppState.addIsLoading(builder, appState.isLoading || false);
  if (nameOffset) BinAppState.addName(builder, nameOffset);
  BinAppState.addWidth(builder, appState.width || 0);
  BinAppState.addHeight(builder, appState.height || 0);
  BinAppState.addOffsetTop(builder, appState.offsetTop || 0);
  BinAppState.addOffsetLeft(builder, appState.offsetLeft || 0);
  // if (fileHandleOffset) BinAppState.addFileHandle(builder, fileHandleOffset);
  // if (collaboratorsVector) BinAppState.addCollaborators(builder, collaboratorsVector);
  if (pendingImageElementIdOffset) BinAppState.addPendingImageElementId(builder, pendingImageElementIdOffset);
  // if (showHyperlinkPopupOffset) BinAppState.addShowHyperlinkPopup(builder, showHyperlinkPopupOffset);
  BinAppState.addOriginSnapOffsetX(builder, appState.originSnapOffset?.x || 0.0);
  BinAppState.addOriginSnapOffsetY(builder, appState.originSnapOffset?.y || 0.0);
  // if (userToFollowOffset) BinAppState.addUserToFollow(builder, userToFollowOffset);
  // if (followedByVector) BinAppState.addFollowedBy(builder, followedByVector);
  BinAppState.addIsResizing(builder, appState.isResizing || false);
  BinAppState.addIsRotating(builder, appState.isRotating || false);
  BinAppState.addZoom(builder, appState.zoom?.value || 0.0);
  if (lastPointerDownWithOffset) BinAppState.addLastPointerDownWith(builder, lastPointerDownWithOffset);
  if (selectedElementIdsVector) BinAppState.addSelectedElementIds(builder, selectedElementIdsVector);
  if (previousSelectedElementIdsVector) BinAppState.addPreviousSelectedElementIds(builder, previousSelectedElementIdsVector);
  BinAppState.addSelectedElementsAreBeingDragged(builder, appState.selectedElementsAreBeingDragged || false);
  BinAppState.addShouldCacheIgnoreZoom(builder, appState.shouldCacheIgnoreZoom || false);
  BinAppState.addGridSize(builder, appState.gridSize || 0);
  if (selectedGroupIdsVector) BinAppState.addSelectedGroupIds(builder, selectedGroupIdsVector);
  if (editingGroupIdOffset) BinAppState.addEditingGroupId(builder, editingGroupIdOffset);
  BinAppState.addScrollX(builder, appState.scrollX || 0.0);
  BinAppState.addScrollY(builder, appState.scrollY || 0.0);
  if (cursorButtonOffset) BinAppState.addCursorButton(builder, cursorButtonOffset);
  BinAppState.addScrolledOutside(builder, appState.scrolledOutside || false);
  if (groupsVector) BinAppState.addGroups(builder, groupsVector);
  if (scopeOffset) BinAppState.addScope(builder, scopeOffset);
  if (writingLayerOffset) BinAppState.addWritingLayer(builder, writingLayerOffset);
  if (currentItemStrokeColorOffset) BinAppState.addCurrentItemStrokeColor(builder, currentItemStrokeColorOffset);
  if (currentItemBackgroundColorOffset) BinAppState.addCurrentItemBackgroundColor(builder, currentItemBackgroundColorOffset);
  if (currentItemFillStyleOffset) BinAppState.addCurrentItemFillStyle(builder, currentItemFillStyleOffset);
  BinAppState.addCurrentItemStrokeWidth(builder, appState.currentItemStrokeWidth || 0);
  if (currentItemStrokeStyleOffset) BinAppState.addCurrentItemStrokeStyle(builder, currentItemStrokeStyleOffset);
  BinAppState.addCurrentItemRoughness(builder, appState.currentItemRoughness || 0);
  BinAppState.addCurrentItemOpacity(builder, appState.currentItemOpacity || 0.0);
  if (currentItemFontFamilyOffset) BinAppState.addCurrentItemFontFamily(builder, currentItemFontFamilyOffset);
  BinAppState.addCurrentItemFontSize(builder, appState.currentItemFontSize || 0);
  if (currentItemTextAlignOffset) BinAppState.addCurrentItemTextAlign(builder, currentItemTextAlignOffset);
  if (currentItemStartArrowheadOffset) BinAppState.addCurrentItemStartArrowhead(builder, currentItemStartArrowheadOffset);
  if (currentItemEndArrowheadOffset) BinAppState.addCurrentItemEndArrowhead(builder, currentItemEndArrowheadOffset);
  if (currentItemRoundnessOffset) BinAppState.addCurrentItemRoundness(builder, currentItemRoundnessOffset);
  if (viewBackgroundColorOffset) BinAppState.addViewBackgroundColor(builder, viewBackgroundColorOffset);
  if (appState.frameRendering) {
    BinAppState.addFrameRenderingEnabled(builder, appState.frameRendering.enabled || false);
    BinAppState.addFrameRenderingName(builder, appState.frameRendering.name || false);
    BinAppState.addFrameRenderingOutline(builder, appState.frameRendering.outline || false);
    BinAppState.addFrameRenderingClip(builder, appState.frameRendering.clip || false);
  }
  if (editingFrameOffset) BinAppState.addEditingFrame(builder, editingFrameOffset);
  if (elementsToHighlightVector) BinAppState.addElementsToHighlight(builder, elementsToHighlightVector);
  if (editingElementOffset) BinAppState.addEditingElement(builder, editingElementOffset);
  
  BinAppState.addScaleRatioLocked(builder, appState.scaleRatioLocked || false);
  BinAppState.addDisplayAllPointDistances(builder, appState.displayAllPointDistances || false);
  BinAppState.addDisplayDistanceOnDrawing(builder, appState.displayDistanceOnDrawing || true);
  BinAppState.addEnableLineBendingOnEdit(builder, appState.enableLineBendingOnEdit || false);
  BinAppState.addAllowIndependentCurveHandles(builder, appState.allowIndependentCurveHandles || false);
  BinAppState.addCoordDecimalPlaces(builder, appState.coordDecimalPlaces || 3);
  

  return BinAppState.endAppState(builder);
};

export { serializeAppState };
