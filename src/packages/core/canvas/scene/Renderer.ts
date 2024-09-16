import { adjustElementToCurrentScope } from "../duc/utils/measurements";
import { isElementInViewport } from "../element/sizeHelpers";
import { isImageElement } from "../element/typeChecks";
import {
  NonDeletedElementsMap,
  NonDeletedDucElement,
  DucElement,
} from "../element/types";
import { renderInteractiveSceneThrottled } from "../renderer/interactiveScene";
import { renderStaticSceneThrottled } from "../renderer/staticScene";

import { AppState } from "../types";
import { memoize, toBrandedType } from "../utils";
import Scene from "./Scene";
import { RenderableElementsMap } from "./types";

export class Renderer {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public getVisibleCanvasElements = ({
    elementsMap,
    zoom,
    offsetLeft,
    offsetTop,
    scrollX,
    scrollY,
    height,
    width,
  }: {
    elementsMap: NonDeletedElementsMap;
    zoom: AppState["zoom"];
    offsetLeft: AppState["offsetLeft"];
    offsetTop: AppState["offsetTop"];
    scrollX: AppState["scrollX"];
    scrollY: AppState["scrollY"];
    height: AppState["height"];
    width: AppState["width"];
  }): readonly NonDeletedDucElement[] => {
    const visibleElements: NonDeletedDucElement[] = [];
    for (const element of elementsMap.values()) {
      if (
        isElementInViewport(
          element,
          width,
          height,
          {
            zoom,
            offsetLeft,
            offsetTop,
            scrollX,
            scrollY,
          },
          elementsMap,
        )
      ) {
        visibleElements.push(element);
      }
    }
    return visibleElements;
  };

  public getRenderableElements = (() => {

    const getRenderableElements = ({
      elements,
      editingTextElement,
      newElementId,
      pendingImageElementId,
    }: {
      elements: readonly NonDeletedDucElement[];
      editingTextElement: AppState["editingTextElement"];
      newElementId: DucElement["id"] | undefined;
      pendingImageElementId: AppState["pendingImageElementId"];
    }) => {
      const elementsMap = toBrandedType<RenderableElementsMap>(new Map());

      for (const element of elements) {
        if (isImageElement(element)) {
          if (
            // => not placed on canvas yet (but in elements array)
            pendingImageElementId === element.id
          ) {
            continue;
          }
        }

        if (newElementId === element.id) {
          continue;
        }

        // we don't want to render text element that's being currently edited
        // (it's rendered on remote only)
        if (
          !editingTextElement ||
          editingTextElement.type !== "text" ||
          element.id !== editingTextElement.id
        ) {
          elementsMap.set(element.id, element);
        }
      }
      return elementsMap;
    };

    return memoize(
      ({
        zoom,
        offsetLeft,
        offsetTop,
        scrollX,
        scrollY,
        height,
        width,
        editingTextElement,
        newElementId,
        pendingImageElementId,
        // cache-invalidation nonce
        sceneNonce: _sceneNonce,
      }: {
        zoom: AppState["zoom"];
        offsetLeft: AppState["offsetLeft"];
        offsetTop: AppState["offsetTop"];
        scrollX: AppState["scrollX"];
        scrollY: AppState["scrollY"];
        height: AppState["height"];
        width: AppState["width"];
        editingTextElement: AppState["editingTextElement"];
        /** note: first render of newElement will always bust the cache
         * (we'd have to prefilter elements outside of this function) */
        newElementId: DucElement["id"] | undefined;
        pendingImageElementId: AppState["pendingImageElementId"];
        sceneNonce: ReturnType<InstanceType<typeof Scene>["getSceneNonce"]>;
      }) => {
        const elements = this.scene.getNonDeletedElements();
        // const elements = this.scene.getNonDeletedElements().map(
        //   (element) => adjustElementToCurrentScope(element, this.scene.getCurrentScope())
        // ).filter((el) => el !== null) as NonDeletedDucElement[];
        
        const elementsMap = getRenderableElements({
          elements,
          editingTextElement,
          newElementId,
          pendingImageElementId,
        });

        const visibleElements = this.getVisibleCanvasElements({
          elementsMap,
          zoom,
          offsetLeft,
          offsetTop,
          scrollX,
          scrollY,
          height,
          width,
        });

        return { elementsMap, visibleElements };
      },
    );
  })();

  // NOTE Doesn't destroy everything (scene, rc, etc.) because it may not be
  // safe to break TS contract here (for upstream cases)
  public destroy() {
    renderInteractiveSceneThrottled.cancel();
    renderStaticSceneThrottled.cancel();
    this.getRenderableElements.clear();
  }
}
