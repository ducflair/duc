import { LockedIcon, UnlockedIcon } from "../components/excalicons";
import { newElementWith } from "../element/mutateElement";
import { isFrameLikeElement } from "../element/typeChecks";
import type { DucElement } from "../element/types";
import { KEYS } from "../keys";
import { getSelectedElements } from "../scene";
import { StoreAction } from "../store";
import { arrayToMap } from "../utils";
import { register } from "./register";

const shouldLock = (elements: readonly DucElement[]) =>
  elements.every((el) => !el.locked);

const shouldHide = (elements: readonly DucElement[]) =>
  elements.every((el) => !el.isVisible);

export const actionToggleElementLock = register({
  name: "toggleElementLock",
  label: (elements, appState, app) => {
    const selected = app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: false,
    });
    if (selected.length === 1 && !isFrameLikeElement(selected[0])) {
      return selected[0].locked
        ? "labels.elementLock.unlock"
        : "labels.elementLock.lock";
    }

    return shouldLock(selected)
      ? "labels.elementLock.lockAll"
      : "labels.elementLock.unlockAll";
  },
  icon: (appState, elements) => {
    const selectedElements = getSelectedElements(elements, appState);
    return shouldLock(selectedElements) ? LockedIcon : UnlockedIcon;
  },
  trackEvent: { category: "element" },
  predicate: (elements, appState, _, app) => {
    const selectedElements = app.scene.getSelectedElements(appState);
    return (
      selectedElements.length > 0 &&
      !selectedElements.some((element) => element.locked && element.frameId)
    );
  },
  perform: (elements, appState, _, app) => {
    const selectedElements = app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    });

    if (!selectedElements.length) {
      return false;
    }

    const nextLockState = shouldLock(selectedElements);
    const selectedElementsMap = arrayToMap(selectedElements);
    return {
      elements: elements.map((element) => {
        if (!selectedElementsMap.has(element.id)) {
          return element;
        }

        return newElementWith(element, { locked: nextLockState });
      }),
      appState: {
        ...appState,
        selectedLinearElement: nextLockState
          ? null
          : appState.selectedLinearElement,
      },
      storeAction: StoreAction.CAPTURE,
    };
  },
  keyTest: (event, appState, elements, app) => {
    return (
      event.key.toLocaleLowerCase() === KEYS.L &&
      event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      app.scene.getSelectedElements({
        selectedElementIds: appState.selectedElementIds,
        includeBoundTextElement: false,
      }).length > 0
    );
  },
});

export const actionToggleElementVisibility = register({
  name: "toggleElementVisibility",
  label: "hide",
  // label: (elements, appState, app) => {
  //   const selected = app.scene.getSelectedElements({
  //     selectedElementIds: appState.selectedElementIds,
  //     includeBoundTextElement: false,
  //   });
  //   if (selected.length === 1 && !isFrameLikeElement(selected[0])) {
  //     return selected[0].isVisible
  //       ? "labels.elementLock.hide"
  //       : "labels.elementLock.show";
  //   }

  //   return shouldLock(selected)
  //     ? "labels.elementLock.hideAll"
  //     : "labels.elementLock.showAll";
  // },
  trackEvent: { category: "element" },
  predicate: (elements, appState, _, app) => {
    const selectedElements = app.scene.getSelectedElements(appState);
    return (
      selectedElements.length > 0 &&
      !selectedElements.some((element) => element.isVisible)
    );
  },
  perform: (elements, appState, _, app) => {
    const selectedElements = app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    });

    if (!selectedElements.length) {
      return false;
    }

    const nextHideState = shouldHide(selectedElements);
    const selectedElementsMap = arrayToMap(selectedElements);
    return {
      elements: elements.map((element) => {
        if (!selectedElementsMap.has(element.id)) {
          return element;
        }

        return newElementWith(element, { isVisible: nextHideState });
      }),
      appState: {
        ...appState,
        selectedLinearElement: nextHideState
          ? null
          : appState.selectedLinearElement,
      },
      storeAction: StoreAction.CAPTURE,
    };
  },
});

export const actionUnlockAllElements = register({
  name: "unlockAllElements",
  paletteName: "Unlock all elements",
  trackEvent: { category: "canvas" },
  viewMode: false,
  icon: UnlockedIcon,
  predicate: (elements, appState) => {
    const selectedElements = getSelectedElements(elements, appState);
    return (
      selectedElements.length === 0 &&
      elements.some((element) => element.locked)
    );
  },
  perform: (elements, appState) => {
    const lockedElements = elements.filter((el) => el.locked);

    return {
      elements: elements.map((element) => {
        if (element.locked) {
          return newElementWith(element, { locked: false });
        }
        return element;
      }),
      appState: {
        ...appState,
        selectedElementIds: Object.fromEntries(
          lockedElements.map((el) => [el.id, true]),
        ),
      },
      storeAction: StoreAction.CAPTURE,
    };
  },
  label: "labels.elementLock.unlockAll",
});
