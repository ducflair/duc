import React, { useEffect, useRef } from "react";
import type { RoughCanvas } from "roughjs/bin/canvas";
import { renderStaticScene } from "../../renderer/staticScene";
import { isShallowEqual } from "../../utils";
import type { AppState, StaticCanvasAppState } from "../../types";
import type {
  RenderableElementsMap,
  StaticCanvasRenderConfig,
} from "../../scene/types";
import type {
  NonDeletedDucElement,
  NonDeletedSceneElementsMap,
} from "../../element/types";
import { isRenderThrottlingEnabled } from "../../reactUtils";
import { adjustElementsMapToCurrentScope, adjustElementToCurrentScope } from "../../duc/utils/measurements";

type StaticCanvasProps = {
  canvas: HTMLCanvasElement;
  rc: RoughCanvas;
  elementsMap: RenderableElementsMap;
  allElementsMap: NonDeletedSceneElementsMap;
  visibleElements: readonly NonDeletedDucElement[];
  sceneNonce: number | undefined;
  selectionNonce: number | undefined;
  scale: number;
  appState: StaticCanvasAppState;
  renderConfig: StaticCanvasRenderConfig;
};

const StaticCanvas = (props: StaticCanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isComponentMounted = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const canvas = props.canvas;

    if (!isComponentMounted.current) {
      isComponentMounted.current = true;

      wrapper.replaceChildren(canvas);
      canvas.classList.add("excalidraw__canvas", "static");
    }

    const widthString = `${props.appState.width}px`;
    const heightString = `${props.appState.height}px`;
    if (canvas.style.width !== widthString) {
      canvas.style.width = widthString;
    }
    if (canvas.style.height !== heightString) {
      canvas.style.height = heightString;
    }

    const scaledWidth = props.appState.width * props.scale;
    const scaledHeight = props.appState.height * props.scale;
    // setting width/height resets the canvas even if dimensions not changed,
    // which would cause flicker when we skip frame (due to throttling)
    if (canvas.width !== scaledWidth) {
      canvas.width = scaledWidth;
    }
    if (canvas.height !== scaledHeight) {
      canvas.height = scaledHeight;
    }

    renderStaticScene(
      {
        canvas,
        rc: props.rc,
        scale: props.scale,
        // elementsMap: props.elementsMap,
        elementsMap: adjustElementsMapToCurrentScope(props.elementsMap, props.appState.scope) as RenderableElementsMap,
        // allElementsMap: props.allElementsMap,
        allElementsMap: adjustElementsMapToCurrentScope(props.allElementsMap, props.appState.scope) as NonDeletedSceneElementsMap,
        // visibleElements: props.visibleElements,
        visibleElements: props.visibleElements.map((el) => adjustElementToCurrentScope(el, props.appState.scope) as NonDeletedDucElement),
        appState: props.appState,
        renderConfig: props.renderConfig,
      },
      isRenderThrottlingEnabled(),
    );
  });

  return <div className="excalidraw__canvas-wrapper" ref={wrapperRef} />;
};

const getRelevantAppStateProps = (
  appState: AppState,
): StaticCanvasAppState => ({
  zoom: appState.zoom,
  scrollX: appState.scrollX,
  scrollY: appState.scrollY,
  width: appState.width,
  height: appState.height,
  viewModeEnabled: appState.viewModeEnabled,
  offsetLeft: appState.offsetLeft,
  offsetTop: appState.offsetTop,
  theme: appState.theme,
  scope: appState.scope,
  groups: appState.groups,
  writingLayer: appState.writingLayer,
  pendingImageElementId: appState.pendingImageElementId,
  shouldCacheIgnoreZoom: appState.shouldCacheIgnoreZoom,
  viewBackgroundColor: appState.viewBackgroundColor,
  exportScale: appState.exportScale,
  selectedElementsAreBeingDragged: appState.selectedElementsAreBeingDragged,
  gridSize: appState.gridSize,
  gridStep: appState.gridStep,
  frameRendering: appState.frameRendering,
  selectedElementIds: appState.selectedElementIds,
  frameToHighlight: appState.frameToHighlight,
  editingGroupId: appState.editingGroupId,
  currentHoveredFontFamily: appState.currentHoveredFontFamily,
  displayDistanceOnDrawing: appState.displayDistanceOnDrawing,
  displayAllPointDistances: appState.displayAllPointDistances,
  displayAllPointCoordinates: appState.displayAllPointCoordinates,
  displayAllPointInfoSelected: appState.displayAllPointInfoSelected,
  displayRootAxis: appState.displayRootAxis,
  coordDecimalPlaces: appState.coordDecimalPlaces,
  newElement: appState.newElement,
});

const areEqual = (
  prevProps: StaticCanvasProps,
  nextProps: StaticCanvasProps,
) => {
  if (
    prevProps.sceneNonce !== nextProps.sceneNonce ||
    prevProps.scale !== nextProps.scale ||
    // we need to memoize on elementsMap because they may have renewed
    // even if sceneNonce didn't change (e.g. we filter elements out based
    // on appState)
    prevProps.elementsMap !== nextProps.elementsMap ||
    prevProps.visibleElements !== nextProps.visibleElements
  ) {
    return false;
  }

  return (
    isShallowEqual(
      // asserting AppState because we're being passed the whole AppState
      // but resolve to only the StaticCanvas-relevant props
      getRelevantAppStateProps(prevProps.appState as AppState),
      getRelevantAppStateProps(nextProps.appState as AppState),
    ) && isShallowEqual(prevProps.renderConfig, nextProps.renderConfig)
  );
};

export default React.memo(StaticCanvas, areEqual);
