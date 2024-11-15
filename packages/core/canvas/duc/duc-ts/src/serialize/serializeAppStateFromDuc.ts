import * as flatbuffers from 'flatbuffers';
import { AppState as BinAppState, DucGroup } from '../../duc';
import { AppState } from '../../../../types';
import { serializeDucElement } from './serializeElementFromDuc';
import { getDefaultAppState } from '../../../../appState';

const serializeAppState = (builder: flatbuffers.Builder, appState: Partial<AppState>): flatbuffers.Offset => {
  // Create string offsets and vectors
  const nameOffset = appState.name ? builder.createString(appState.name) : null;

  const lastPointerDownWithOffset = appState.lastPointerDownWith ? builder.createString(appState.lastPointerDownWith) : null;

  const selectedElementIdsOffsets = appState.selectedElementIds ? Object.keys(appState.selectedElementIds).map(id => builder.createString(id)) : [];
  const selectedElementIdsVector = selectedElementIdsOffsets.length > 0 ? BinAppState.createSelectedElementIdsVector(builder, selectedElementIdsOffsets) : null;

  const editingGroupIdOffset = appState.editingGroupId ? builder.createString(appState.editingGroupId) : null;
  const cursorButtonOffset = appState.cursorButton ? builder.createString(appState.cursorButton) : null;

  const groupsOffsets = appState.groups ? appState.groups.map(group => {
    const idOffset = builder.createString(group.id);
    const labelOffset = builder.createString(group.label);
    const typeOffset = builder.createString(group.type);
    const scopeOffset = builder.createString(group.scope);
    const isCollapsed = group.isCollapsed || false;
    return DucGroup.createDucGroup(
      builder,
      idOffset,
      typeOffset,
      isCollapsed,
      labelOffset,
      scopeOffset,
    );
  }) : [];
  const groupsVector = groupsOffsets.length > 0 ? BinAppState.createGroupsVector(builder, groupsOffsets) : null;

  const scopeOffset = appState.scope ? builder.createString(appState.scope) : null;

  const currentItemStrokeColorOffset = appState.currentItemStrokeColor ? builder.createString(appState.currentItemStrokeColor) : null;
  const currentItemBackgroundColorOffset = appState.currentItemBackgroundColor ? builder.createString(appState.currentItemBackgroundColor) : null;
  const currentItemFontFamilyOffset = appState.currentItemFontFamily ? builder.createString(appState.currentItemFontFamily.toString()) : null;
  const currentItemStartArrowheadOffset = appState.currentItemStartArrowhead ? builder.createString(appState.currentItemStartArrowhead) : null;
  const currentItemEndArrowheadOffset = appState.currentItemEndArrowhead ? builder.createString(appState.currentItemEndArrowhead) : null;
  const currentItemRoundnessOffset = appState.currentItemRoundness ? builder.createString(appState.currentItemRoundness) : null;

  const viewBackgroundColorOffset = appState.viewBackgroundColor ? builder.createString(appState.viewBackgroundColor) : null;
  const editingFrameOffset = appState.editingFrame ? builder.createString(appState.editingFrame) : null;

  const elementsToHighlightOffsets = Array.isArray(appState.elementsToHighlight) ? appState.elementsToHighlight.map(element => serializeDucElement(builder, element)) : [];

  const editingElementOffset = appState.editingElement ? serializeDucElement(builder, appState.editingElement) : null;


  // Serialize UserToFollow if it exists
  // const userToFollowOffset = appState.userToFollow ? UserToFollow.createUserToFollow(builder, builder.createString(appState.userToFollow.socketId), builder.createString(appState.userToFollow.username)) : null;

  // Serialize followedBy if it exists
  // const followedByOffsets = appState.followedBy ? Array.from(appState.followedBy).map(follower => builder.createString(follower)) : [];
  // const followedByVector = followedByOffsets.length > 0 ? BinAppState.createFollowedByVector(builder, followedByOffsets) : null;

  // Now start the AppState object
  BinAppState.startAppState(builder);

  if (nameOffset) BinAppState.addName(builder, nameOffset);
  if (lastPointerDownWithOffset) BinAppState.addLastPointerDownWith(builder, lastPointerDownWithOffset);
  if (selectedElementIdsVector) BinAppState.addSelectedElementIds(builder, selectedElementIdsVector);
  if (cursorButtonOffset) BinAppState.addCursorButton(builder, cursorButtonOffset);
  if (groupsVector) BinAppState.addGroups(builder, groupsVector);
  if (scopeOffset) BinAppState.addScope(builder, scopeOffset);
  if (currentItemStrokeColorOffset) BinAppState.addCurrentItemStrokeColor(builder, currentItemStrokeColorOffset);
  if (currentItemBackgroundColorOffset) BinAppState.addCurrentItemBackgroundColor(builder, currentItemBackgroundColorOffset);
  if (currentItemFontFamilyOffset) BinAppState.addCurrentItemFontFamily(builder, currentItemFontFamilyOffset);
  if (currentItemStartArrowheadOffset) BinAppState.addCurrentItemStartArrowhead(builder, currentItemStartArrowheadOffset);
  if (currentItemEndArrowheadOffset) BinAppState.addCurrentItemEndArrowhead(builder, currentItemEndArrowheadOffset);
  if (viewBackgroundColorOffset) BinAppState.addViewBackgroundColor(builder, viewBackgroundColorOffset);
  
  appState.zoom && BinAppState.addZoom(builder, appState.zoom.value);
  appState.shouldCacheIgnoreZoom && BinAppState.addShouldCacheIgnoreZoom(builder, appState.shouldCacheIgnoreZoom);
  appState.gridSize && BinAppState.addGridSize(builder, appState.gridSize);
  appState.scrollX && BinAppState.addScrollX(builder, appState.scrollX);
  appState.scrollY && BinAppState.addScrollY(builder, appState.scrollY);
  appState.scrolledOutside && BinAppState.addScrolledOutside(builder, appState.scrolledOutside);
  appState.currentItemFillStyle && BinAppState.addCurrentItemFillStyleV3(builder, appState.currentItemFillStyle);
  appState.currentItemStrokePlacement && BinAppState.addCurrentItemStrokePlacementV3(builder, appState.currentItemStrokePlacement);
  appState.currentItemStrokeWidth && BinAppState.addCurrentItemStrokeWidthV3(builder, appState.currentItemStrokeWidth);
  appState.currentItemStrokeStyle && BinAppState.addCurrentItemStrokeStyleV3(builder, appState.currentItemStrokeStyle);
  appState.currentItemOpacity && BinAppState.addCurrentItemOpacity(builder, appState.currentItemOpacity);
  appState.currentItemFontSize && BinAppState.addCurrentItemFontSizeV3(builder, appState.currentItemFontSize);
  appState.currentItemTextAlign && BinAppState.addCurrentItemTextAlignV3(builder, appState.currentItemTextAlign);
  appState.scaleRatioLocked && BinAppState.addScaleRatioLocked(builder, appState.scaleRatioLocked);
  appState.displayAllPointDistances && BinAppState.addDisplayAllPointDistances(builder, appState.displayAllPointDistances);
  appState.displayDistanceOnDrawing && BinAppState.addDisplayDistanceOnDrawing(builder, appState.displayDistanceOnDrawing);
  appState.displayAllPointCoordinates && BinAppState.addDisplayAllPointCoordinates(builder, appState.displayAllPointCoordinates);
  appState.coordDecimalPlaces && BinAppState.addCoordDecimalPlacesV3(builder, appState.coordDecimalPlaces);
  appState.displayAllPointInfoSelected && BinAppState.addDisplayAllPointInfoSelected(builder, appState.displayAllPointInfoSelected);
  appState.displayRootAxis && BinAppState.addDisplayRootAxis(builder, appState.displayRootAxis);
  appState.lineBendingMode && BinAppState.addLineBendingMode(builder, appState.lineBendingMode);

  if (appState.frameRendering) {
    appState.frameRendering.enabled && BinAppState.addFrameRenderingEnabled(builder, appState.frameRendering.enabled);
    appState.frameRendering.name && BinAppState.addFrameRenderingName(builder, appState.frameRendering.name);
    appState.frameRendering.outline && BinAppState.addFrameRenderingOutline(builder, appState.frameRendering.outline);
    appState.frameRendering.clip && BinAppState.addFrameRenderingClip(builder, appState.frameRendering.clip);
  }
  
  

  return BinAppState.endAppState(builder);
};

export { serializeAppState };
