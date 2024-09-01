import { LinearElementEditor } from "../element/linearElementEditor";
import { isLinearElement } from "../element/typeChecks";
import { DucLinearElement } from "../element/types";
import { StoreAction } from "../store";
import { register } from "./register";

export const actionToggleLinearEditor = register({
  name: "toggleLinearEditor",
  trackEvent: {
    category: "element",
  },
  predicate: (elements, appState, _, app) => {
    const selectedElements = app.scene.getSelectedElements(appState);
    if (selectedElements.length === 1 && isLinearElement(selectedElements[0])) {
      return true;
    }
    return false;
  },
  perform(elements, appState, _, app) {
    const selectedElement = app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: true,
    })[0] as DucLinearElement;

    const editingLinearElement =
      appState.editingLinearElement?.elementId === selectedElement.id
        ? null
        : new LinearElementEditor(selectedElement);
    return {
      appState: {
        ...appState,
        editingLinearElement,
      },
      storeAction: StoreAction.NONE,
    };
  },
  contextItemLabel: (elements, appState, app) => {
    const selectedElement = app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: true,
    })[0] as DucLinearElement;
    return appState.editingLinearElement?.elementId === selectedElement.id
      ? "labels.lineEditor.exit"
      : "labels.lineEditor.edit";
  },
});
