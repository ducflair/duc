import React, { useEffect, useRef } from "react";
import { isShallowEqual, sceneCoordsToViewportCoords } from "../../utils";
import { CURSOR_TYPE } from "../../constants";
import { t } from "../../i18n";
import type { DOMAttributes } from "react";
import type { AppState, Device, InteractiveCanvasAppState } from "../../types";
import type {
  InteractiveCanvasRenderConfig,
  RenderableElementsMap,
  RenderInteractiveSceneCallback,
} from "../../scene/types";
import type {
  NonDeletedDucElement,
  NonDeletedSceneElementsMap,
} from "../../element/types";
import { isRenderThrottlingEnabled } from "../../reactUtils";
import { renderInteractiveScene } from "../../renderer/interactiveScene";
import { adjustElementToCurrentScope } from "../../duc/utils/measurements";

type InteractiveCanvasProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  canvas: HTMLCanvasElement | null;
  elementsMap: RenderableElementsMap;
  visibleElements: readonly NonDeletedDucElement[];
  selectedElements: readonly NonDeletedDucElement[];
  allElementsMap: NonDeletedSceneElementsMap;
  sceneNonce: number | undefined;
  selectionNonce: number | undefined;
  scale: number;
  appState: InteractiveCanvasAppState;
  device: Device;
  renderInteractiveSceneCallback: (
    data: RenderInteractiveSceneCallback,
  ) => void;
  handleCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  onContextMenu: Exclude<
    DOMAttributes<HTMLCanvasElement | HTMLDivElement>["onContextMenu"],
    undefined
  >;
  onPointerMove: Exclude<
    DOMAttributes<HTMLCanvasElement>["onPointerMove"],
    undefined
  >;
  onPointerUp: Exclude<
    DOMAttributes<HTMLCanvasElement>["onPointerUp"],
    undefined
  >;
  onPointerCancel: Exclude<
    DOMAttributes<HTMLCanvasElement>["onPointerCancel"],
    undefined
  >;
  onTouchMove: Exclude<
    DOMAttributes<HTMLCanvasElement>["onTouchMove"],
    undefined
  >;
  onPointerDown: Exclude<
    DOMAttributes<HTMLCanvasElement>["onPointerDown"],
    undefined
  >;
  onDoubleClick: Exclude<
    DOMAttributes<HTMLCanvasElement>["onDoubleClick"],
    undefined
  >;
};

const InteractiveCanvas = (props: InteractiveCanvasProps) => {
  const isComponentMounted = useRef(false);

  useEffect(() => {
    if (!isComponentMounted.current) {
      isComponentMounted.current = true;
      return;
    }

    const remotePointerButton: InteractiveCanvasRenderConfig["remotePointerButton"] =
      new Map();
    const remotePointerViewportCoords: InteractiveCanvasRenderConfig["remotePointerViewportCoords"] =
      new Map();
    const remoteSelectedElementIds: InteractiveCanvasRenderConfig["remoteSelectedElementIds"] =
      new Map();
    const remotePointerUsernames: InteractiveCanvasRenderConfig["remotePointerUsernames"] =
      new Map();
    const remotePointerUserStates: InteractiveCanvasRenderConfig["remotePointerUserStates"] =
      new Map();

    props.appState.collaborators.forEach((user, socketId) => {
      if (user.selectedElementIds) {
        for (const id of Object.keys(user.selectedElementIds)) {
          if (!remoteSelectedElementIds.has(id)) {
            remoteSelectedElementIds.set(id, []);
          }
          remoteSelectedElementIds.get(id)!.push(socketId);
        }
      }
      if (!user.pointer || user.pointer.renderCursor === false) {
        return;
      }
      if (user.username) {
        remotePointerUsernames.set(socketId, user.username);
      }
      if (user.userState) {
        remotePointerUserStates.set(socketId, user.userState);
      }
      remotePointerViewportCoords.set(
        socketId,
        sceneCoordsToViewportCoords(
          {
            sceneX: user.pointer.x,
            sceneY: user.pointer.y,
          },
          props.appState,
        ),
      );
      remotePointerButton.set(socketId, user.button);
    });

    const selectionColor =
      (props.containerRef?.current &&
        getComputedStyle(props.containerRef.current).getPropertyValue(
          "--color-selection",
        )) ||
      "#6965db";

    const adjustedVisibleElements = props.visibleElements.map((element) =>
      adjustElementToCurrentScope(element, props.appState.scope),
    );
    const adjustedSelectedElements = props.selectedElements.map((element) =>
      adjustElementToCurrentScope(element, props.appState.scope),
    );
    const adjustedElementsMap = new Map<string, NonDeletedDucElement>();
    props.elementsMap.forEach((element) => {
      adjustedElementsMap.set(element.id, adjustElementToCurrentScope(element, props.appState.scope));
    });
    const adjustedAllElementsMap = new Map<string, NonDeletedDucElement>();
    props.allElementsMap.forEach((element) => {
      adjustedAllElementsMap.set(element.id, adjustElementToCurrentScope(element, props.appState.scope));
    });

    renderInteractiveScene(
      {
        canvas: props.canvas,
        // elementsMap: props.elementsMap,
        // visibleElements: props.visibleElements,
        // selectedElements: props.selectedElements,
        // allElementsMap: props.allElementsMap,
        elementsMap: adjustedElementsMap as RenderableElementsMap,
        selectedElements: adjustedSelectedElements,
        allElementsMap: adjustedAllElementsMap as NonDeletedSceneElementsMap,
        visibleElements: adjustedVisibleElements,
        scale: window.devicePixelRatio,
        appState: {
          ...props.appState,
          frameToHighlight: props.appState.frameToHighlight ? adjustElementToCurrentScope(props.appState.frameToHighlight, props.appState.scope) : null,
          elementsToHighlight: props.appState.elementsToHighlight ? props.appState.elementsToHighlight.map((element) => adjustElementToCurrentScope(element, props.appState.scope)) : null,
        },
        renderConfig: {
          remotePointerViewportCoords,
          remotePointerButton,
          remoteSelectedElementIds,
          remotePointerUsernames,
          remotePointerUserStates,
          selectionColor,
          renderScrollbars: false,
        },
        device: props.device,
        callback: props.renderInteractiveSceneCallback,
      },
      isRenderThrottlingEnabled(),
    );
  });

  return (
    <canvas
      className="excalidraw__canvas interactive"
      style={{
        width: props.appState.width,
        height: props.appState.height,
        cursor: props.appState.viewModeEnabled
          ? CURSOR_TYPE.GRAB
          : CURSOR_TYPE.AUTO,
      }}
      width={props.appState.width * props.scale}
      height={props.appState.height * props.scale}
      ref={props.handleCanvasRef}
      onContextMenu={props.onContextMenu}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onPointerCancel}
      onTouchMove={props.onTouchMove}
      onPointerDown={props.onPointerDown}
      onDoubleClick={
        props.appState.viewModeEnabled ? undefined : props.onDoubleClick
      }
    >
      {t("labels.drawingCanvas")}
    </canvas>
  );
};

const getRelevantAppStateProps = (
  appState: AppState,
): InteractiveCanvasAppState => ({
  zoom: appState.zoom,
  scrollX: appState.scrollX,
  scrollY: appState.scrollY,
  width: appState.width,
  height: appState.height,
  viewModeEnabled: appState.viewModeEnabled,
  editingGroupId: appState.editingGroupId,
  editingLinearElement: appState.editingLinearElement,
  selectedElementIds: appState.selectedElementIds,
  offsetLeft: appState.offsetLeft,
  offsetTop: appState.offsetTop,
  scope: appState.scope,
  theme: appState.theme,
  pendingImageElementId: appState.pendingImageElementId,
  selectionElement: appState.selectionElement,
  selectedGroupIds: appState.selectedGroupIds,
  selectedLinearElement: appState.selectedLinearElement,
  multiElement: appState.multiElement,
  isBindingEnabled: appState.isBindingEnabled,
  suggestedBindings: appState.suggestedBindings,
  isRotating: appState.isRotating,
  frameToHighlight: appState.frameToHighlight,
  elementsToHighlight: appState.elementsToHighlight,
  collaborators: appState.collaborators, // Necessary for collab. sessions
  activeEmbeddable: appState.activeEmbeddable,
  snapLines: appState.snapLines,
  zenModeEnabled: appState.zenModeEnabled,
  editingTextElement: appState.editingTextElement,
});

const areEqual = (
  prevProps: InteractiveCanvasProps,
  nextProps: InteractiveCanvasProps,
) => {
  // This could be further optimised if needed, as we don't have to render interactive canvas on each scene mutation
  if (
    prevProps.selectionNonce !== nextProps.selectionNonce ||
    prevProps.sceneNonce !== nextProps.sceneNonce ||
    prevProps.scale !== nextProps.scale ||
    // we need to memoize on elementsMap because they may have renewed
    // even if sceneNonce didn't change (e.g. we filter elements out based
    // on appState)
    prevProps.elementsMap !== nextProps.elementsMap ||
    prevProps.visibleElements !== nextProps.visibleElements ||
    prevProps.selectedElements !== nextProps.selectedElements
  ) {
    return false;
  }

  // Comparing the interactive appState for changes in case of some edge cases
  return isShallowEqual(
    // asserting AppState because we're being passed the whole AppState
    // but resolve to only the InteractiveCanvas-relevant props
    getRelevantAppStateProps(prevProps.appState as AppState),
    getRelevantAppStateProps(nextProps.appState as AppState),
  );
};

export default React.memo(InteractiveCanvas, areEqual);