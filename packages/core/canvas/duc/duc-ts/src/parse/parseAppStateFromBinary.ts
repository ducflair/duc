import { AppState as BinAppState } from '../../duc';
import { SupportedMeasures } from '../../../utils/measurements';
import { AppState, NormalizedZoomValue } from '../../../../types';
import { Arrowhead, DucGroup, FillStyle, PointerType, StrokePlacement, StrokeStyle, TextAlign } from '../../../../element/types';


export const parseAppStateFromBinary = (appState: BinAppState | null): Partial<AppState> => {
  if (!appState) return {};

  // Parse groups
  const groups: DucGroup[] = Array.from({ length: appState.groupsLength() })
    .map((_, i) => appState.groups(i))
    .filter((group): group is NonNullable<typeof group> => group !== null)
    .map(group => ({
      id: group.id()!,
      label: group.label()!,
      type: 'group',
      scope: group.scope() as SupportedMeasures,
      isCollapsed: group.isCollapsed(),
    }));
  
  return {
    name: appState.name(),
    zoom: {
      value: appState.zoom() as NormalizedZoomValue,
    },
    lastPointerDownWith: appState.lastPointerDownWith() as PointerType,
    selectedElementIds: Object.fromEntries(
      Array.from({ length: appState.selectedElementIdsLength() }, (_, i) => [
        appState.selectedElementIds(i),
        true,
      ])
    ),
    shouldCacheIgnoreZoom: appState.shouldCacheIgnoreZoom(),
    gridSize: appState.gridSize(),
    scrollX: appState.scrollX(),
    scrollY: appState.scrollY(),
    cursorButton: appState.cursorButton() as "up" | "down" | undefined,
    scrolledOutside: appState.scrolledOutside(),
    groups: groups,
    scope: appState.scope() as SupportedMeasures,
    currentItemStrokeColor: appState.currentItemStrokeColor() || undefined,
    currentItemBackgroundColor: appState.currentItemBackgroundColor() || undefined,
    currentItemFillStyle: appState.currentItemFillStyleV3() as FillStyle,
    currentItemStrokeWidth: appState.currentItemStrokeWidthV3(),
    currentItemStrokePlacement: appState.currentItemStrokePlacementV3() as StrokePlacement,
    currentItemStrokeStyle: appState.currentItemStrokeStyleV3() as StrokeStyle,
    currentItemOpacity: appState.currentItemOpacity(),
    currentItemFontFamily: appState.currentItemFontFamily(),
    currentItemFontSize: appState.currentItemFontSizeV3(),
    currentItemTextAlign: appState.currentItemTextAlignV3() as TextAlign,
    currentItemStartArrowhead: appState.currentItemStartArrowhead() as Arrowhead,
    currentItemEndArrowhead: appState.currentItemEndArrowhead() as Arrowhead,
    viewBackgroundColor: appState.viewBackgroundColor() || undefined,
    frameRendering: {
      enabled: appState.frameRenderingEnabled(),
      name: appState.frameRenderingName(),
      outline: appState.frameRenderingOutline(),
      clip: appState.frameRenderingClip(),
    },
    scaleRatioLocked: appState.scaleRatioLocked(),
    displayAllPointDistances: appState.displayAllPointDistances(),
    displayDistanceOnDrawing: appState.displayDistanceOnDrawing(),
    displayAllPointCoordinates: appState.displayAllPointCoordinates(),
    displayAllPointInfoSelected: appState.displayAllPointInfoSelected(),
    displayRootAxis: appState.displayRootAxis(),
    coordDecimalPlaces: appState.coordDecimalPlacesV3(),
    lineBendingMode: appState.lineBendingMode(),
  };
};
