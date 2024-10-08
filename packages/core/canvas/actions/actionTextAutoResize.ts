import { isTextElement } from "../element";
import { newElementWith } from "../element/mutateElement";
import { measureText } from "../element/textElement";
import { getSelectedElements } from "../scene";
import { StoreAction } from "../store";
import type { AppClassProperties } from "../types";
import { arrayToMap, getFontString } from "../utils";
import { register } from "./register";

export const actionTextAutoResize = register({
  name: "autoResize",
  label: "labels.autoResize",
  icon: null,
  trackEvent: { category: "element" },
  predicate: (elements, appState, _: unknown, app: AppClassProperties) => {
    const selectedElements = getSelectedElements(elements, appState);
    return (
      // if finds a text element in the selection with autoResize to false
      selectedElements.some((element) => isTextElement(element) && !element.autoResize)
    );
  },
  perform: (elements, appState, _, app) => {
    const selectedElements = getSelectedElements(elements, appState);
    const selectedElementsMap = arrayToMap(selectedElements);

    return {
      appState,
      elements: elements.map((element) => {
        if (!selectedElementsMap.has(element.id)) {
          return element;
        }

        if (isTextElement(element)) {
          const metrics = measureText(
            element.originalText,
            getFontString(element),
            element.lineHeight,
          );

          return newElementWith(element, {
            autoResize: true,
            width: metrics.width,
            height: metrics.height,
            text: element.originalText,
          });
        }

        return element;
      }),
      storeAction: StoreAction.CAPTURE,
    };
  },
});
