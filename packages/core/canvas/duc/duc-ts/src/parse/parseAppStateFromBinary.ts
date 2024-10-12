import { AppState as BinAppState } from '../../duc';
import { SupportedMeasures } from '../../../utils/measurements';
import { WritingLayers } from "../../../utils/writingLayers";
import { AppState, NormalizedZoomValue } from '../../../../types';
import { Arrowhead, DucGroup, FillStyle, PointerType, StrokePlacement, StrokeRoundness, StrokeStyle } from '../../../../element/types';
import { getDefaultAppState } from '../../../../appState';


export const parseAppStateFromBinary = (appState: BinAppState | null): Partial<AppState> => {
  if (!appState) return {};

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
    name: appState.name() || getDefaultAppState().name,
    zoom: {
      value: (appState.zoom() || getDefaultAppState().zoom.value) as NormalizedZoomValue,
    },
    lastPointerDownWith: appState.lastPointerDownWith() as PointerType || getDefaultAppState().lastPointerDownWith,
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
    selectedElementsAreBeingDragged: appState.selectedElementsAreBeingDragged() || getDefaultAppState().selectedElementsAreBeingDragged,
    shouldCacheIgnoreZoom: appState.shouldCacheIgnoreZoom() || getDefaultAppState().shouldCacheIgnoreZoom,
    gridSize: appState.gridSize() || getDefaultAppState().gridSize,
    selectedGroupIds: Object.fromEntries(
      Array.from({ length: appState.selectedGroupIdsLength() }, (_, i) => [
        appState.selectedGroupIds(i),
        true,
      ])
    ),
    editingGroupId: appState.editingGroupId() || getDefaultAppState().editingGroupId,
    scrollX: appState.scrollX() || getDefaultAppState().scrollX,
    scrollY: appState.scrollY() || getDefaultAppState().scrollY,
    cursorButton: appState.cursorButton() as "up" | "down" | undefined || undefined,
    scrolledOutside: appState.scrolledOutside() || getDefaultAppState().scrolledOutside,
    groups: groups,
    scope: (appState.scope() || getDefaultAppState().scope) as SupportedMeasures,
    writingLayer: (appState.writingLayer() || getDefaultAppState().writingLayer) as WritingLayers,
    currentItemStrokeColor: appState.currentItemStrokeColor() || getDefaultAppState().currentItemStrokeColor,
    currentItemBackgroundColor: appState.currentItemBackgroundColor() || getDefaultAppState().currentItemBackgroundColor,
    currentItemFillStyle: (appState.currentItemFillStyle() || getDefaultAppState().currentItemFillStyle) as FillStyle,
    currentItemStrokeWidth: appState.currentItemStrokeWidth() || getDefaultAppState().currentItemStrokeWidth,
    currentItemStrokePlacement: appState.currentItemStrokePlacement() as StrokePlacement || getDefaultAppState().currentItemStrokePlacement,
    currentItemStrokeStyle: (appState.currentItemStrokeStyle() || getDefaultAppState().currentItemStrokeStyle) as StrokeStyle,
    currentItemRoughness: appState.currentItemRoughness() || getDefaultAppState().currentItemRoughness,
    currentItemOpacity: appState.currentItemOpacity() || getDefaultAppState().currentItemOpacity,
    currentItemFontFamily: Number(appState.currentItemFontFamily() || getDefaultAppState().currentItemFontFamily),
    currentItemFontSize: appState.currentItemFontSize() || getDefaultAppState().currentItemFontSize,
    currentItemTextAlign: appState.currentItemTextAlign() || getDefaultAppState().currentItemTextAlign,
    currentItemStartArrowhead: (appState.currentItemStartArrowhead() || getDefaultAppState().currentItemStartArrowhead) as Arrowhead,
    currentItemEndArrowhead: (appState.currentItemEndArrowhead() || getDefaultAppState().currentItemEndArrowhead) as Arrowhead,
    currentItemRoundness: (appState.currentItemRoundness() || getDefaultAppState().currentItemRoundness) as StrokeRoundness,
    viewBackgroundColor: appState.viewBackgroundColor() || getDefaultAppState().viewBackgroundColor,
    frameRendering: {
      enabled: appState.frameRenderingEnabled() || getDefaultAppState().frameRendering.enabled,
      name: appState.frameRenderingName() || getDefaultAppState().frameRendering.name,
      outline: appState.frameRenderingOutline() || getDefaultAppState().frameRendering.outline,
      clip: appState.frameRenderingClip() || getDefaultAppState().frameRendering.clip,
    },
    editingFrame: appState.editingFrame() || getDefaultAppState().editingFrame,
    scaleRatioLocked: appState.scaleRatioLocked() || getDefaultAppState().scaleRatioLocked,
    displayAllPointDistances: appState.displayAllPointDistances() || getDefaultAppState().displayAllPointDistances,
    displayDistanceOnDrawing: appState.displayDistanceOnDrawing() || getDefaultAppState().displayDistanceOnDrawing,
    displayAllPointCoordinates: appState.displayAllPointCoordinates() || getDefaultAppState().displayAllPointCoordinates,
    displayAllPointInfoSelected: appState.displayAllPointInfoSelected() || getDefaultAppState().displayAllPointInfoSelected,
    displayRootAxis: appState.displayRootAxis() || getDefaultAppState().displayRootAxis,

    enableLineBendingOnEdit: appState.enableLineBendingOnEdit() || getDefaultAppState().enableLineBendingOnEdit,
    allowIndependentCurveHandles: appState.allowIndependentCurveHandles() || getDefaultAppState().allowIndependentCurveHandles,
    coordDecimalPlaces: appState.coordDecimalPlaces() || getDefaultAppState().coordDecimalPlaces,
  };
};
