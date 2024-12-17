import { useEffect, useMemo, useRef, useState } from "react";
import type { AppClassProperties, AppState, Point, Primitive } from "../types";
import type { StoreActionType } from "../store";
import {
  DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE,
  DEFAULT_ELEMENT_BACKGROUND_PICKS,
  DEFAULT_ELEMENT_STROKE_COLOR_PALETTE,
  DEFAULT_ELEMENT_STROKE_PICKS,
} from "../colors";
import { trackEvent } from "../analytics";
import { ButtonIconSelect } from "../components/ButtonIconSelect";
import { ColorPicker } from "../components/ColorPicker/ColorPicker";
import { IconPicker } from "../components/IconPicker";
// import { FontPicker } from "../components/FontPicker/FontPicker";
// TODO barnabasmolnar/editor-redesign
// TextAlignTopIcon, TextAlignBottomIcon,TextAlignMiddleIcon,
// ArrowHead icons
import {
  ArrowheadArrowIcon,
  ArrowheadBarIcon,
  ArrowheadCircleIcon,
  ArrowheadTriangleIcon,
  ArrowheadNoneIcon,
  StrokeStyleDashedIcon,
  StrokeStyleDottedIcon,
  TextAlignTopIcon,
  TextAlignBottomIcon,
  TextAlignMiddleIcon,
  FillHachureIcon,
  FillCrossHatchIcon,
  FillSolidIcon,
  SloppinessArchitectIcon,
  SloppinessArtistIcon,
  SloppinessCartoonistIcon,
  StrokeWidthBaseIcon,
  StrokeWidthBoldIcon,
  StrokeWidthExtraBoldIcon,
  FontSizeSmallIcon,
  FontSizeMediumIcon,
  FontSizeLargeIcon,
  FontSizeExtraLargeIcon,
  EdgeSharpIcon,
  EdgeRoundIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  FillZigZagIcon,
  ArrowheadTriangleOutlineIcon,
  ArrowheadCircleOutlineIcon,
  ArrowheadDiamondIcon,
  ArrowheadDiamondOutlineIcon,
  // fontSizeIcon,
  // sharpArrowIcon,
  // roundArrowIcon,
  // elbowArrowIcon,
} from "../components/excalicons";
import {
  ARROW_TYPE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  FILL_STYLE,
  FONT_FAMILY,
  ROUNDNESS,
  STROKE_WIDTH,
  TEXT_ALIGN,
  VERTICAL_ALIGN,
} from "../constants";
import {
  getNonDeletedElements,
  isTextElement,
  redrawTextBoundingBox,
} from "../element";
import { mutateElement, newElementWith } from "../element/mutateElement";
import { getBoundTextElement } from "../element/textElement";
import {
  isArrowElement,
  isBoundToContainer,
  isElbowArrow,
  isLinearElement,
  isUsingAdaptiveRadius,
} from "../element/typeChecks";
import type {
  Arrowhead,
  DucBindableElement,
  DucElement,
  DucLinearElement,
  DucTextElement,
  FontFamilyValues,
  TextAlign,
  VerticalAlign,
} from "../element/types";
import { getLanguage, t } from "../i18n";
import { KEYS } from "../keys";
import { randomInteger } from "../random";
import {
  canHaveArrowheads,
  getCommonAttributeOfSelectedElements,
  getSelectedElements,
  getTargetElements,
  isSomeElementSelected,
} from "../scene";
import { hasStrokeColor } from "../scene/comparisons";
import {
  arrayToMap,
  getFontFamilyString,
  getShortcutKey,
  tupleToCoors,
} from "../utils";
import { register } from "./register";
import { StoreAction } from "../store";
import { Fonts, getLineHeight } from "../fonts";
import {
  bindLinearElement,
  bindPointToSnapToElementOutline,
  calculateFixedPointForElbowArrowBinding,
  getHoveredElementForBinding,
} from "../element/binding";
import { mutateElbowArrow } from "../element/routing";
import { LinearElementEditor } from "../element/linearElementEditor";

const FONT_SIZE_RELATIVE_INCREASE_STEP = 0.1;

export const changeProperty = (
  elements: readonly DucElement[],
  appState: AppState,
  callback: (element: DucElement) => DucElement,
  includeBoundText = false,
) => {
  const selectedElementIds = arrayToMap(
    getSelectedElements(elements, appState, {
      includeBoundTextElement: includeBoundText,
    }),
  );

  return elements.map((element) => {
    if (
      selectedElementIds.get(element.id) ||
      element.id === appState.editingTextElement?.id
    ) {
      return callback(element);
    }
    return element;
  });
};


const offsetElementAfterFontResize = (
  prevElement: DucTextElement,
  nextElement: DucTextElement,
) => {
  if (isBoundToContainer(nextElement) || !nextElement.autoResize) {
    return nextElement;
  }
  return mutateElement(
    nextElement,
    {
      x:
        prevElement.textAlign === TEXT_ALIGN.LEFT
          ? prevElement.x
          : prevElement.x +
            (prevElement.width - nextElement.width) /
              (prevElement.textAlign === TEXT_ALIGN.CENTER ? 2 : 1),
      // centering vertically is non-standard, but for Duc I think
      // it makes sense
      y: prevElement.y + (prevElement.height - nextElement.height) / 2,
    },
    false,
  );
};

const changeFontSize = (
  elements: readonly DucElement[],
  appState: AppState,
  app: AppClassProperties,
  getNewFontSize: (element: DucTextElement) => number,
  fallbackValue?: DucTextElement["fontSize"],
) => {
  const newFontSizes = new Set<number>();

  return {
    elements: changeProperty(
      elements,
      appState,
      (oldElement) => {
        if (isTextElement(oldElement)) {
          const newFontSize = getNewFontSize(oldElement);
          newFontSizes.add(newFontSize);

          let newElement: DucTextElement = newElementWith(oldElement, {
            fontSize: newFontSize,
          });
          redrawTextBoundingBox(
            newElement,
            app.scene.getContainerElement(oldElement),
            app.scene.getNonDeletedElementsMap(),
          );

          newElement = offsetElementAfterFontResize(oldElement, newElement);

          return newElement;
        }

        return oldElement;
      },
      true,
    ),
    appState: {
      ...appState,
      // update state only if we've set all select text elements to
      // the same font size
      currentItemFontSize:
        newFontSizes.size === 1
          ? [...newFontSizes][0]
          : fallbackValue ?? appState.currentItemFontSize,
    },
    storeAction: StoreAction.CAPTURE,
  };
};

// -----------------------------------------------------------------------------

export const actionChangeStrokeColor = register({
  name: "changeStrokeColor",
  label: "labels.stroke",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      ...(value.currentItemStrokeColor && {
        elements: changeProperty(
          elements,
          appState,
          (el) => {
            return hasStrokeColor(el.type)
              ? newElementWith(el, {
                  strokeColor: value.currentItemStrokeColor,
                })
              : el;
          },
          true,
        ),
      }),
      appState: {
        ...appState,
        ...value,
      },
      storeAction: !!value.currentItemStrokeColor
        ? StoreAction.CAPTURE
        : StoreAction.NONE,
    };
  }
});

export const actionChangeBackgroundColor = register({
  name: "changeBackgroundColor",
  label: "labels.changeBackground",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      ...(value.currentItemBackgroundColor && {
        elements: changeProperty(elements, appState, (el) =>
          newElementWith(el, {
            backgroundColor: value.currentItemBackgroundColor,
          }),
        ),
      }),
      appState: {
        ...appState,
        ...value,
      },
      storeAction: !!value.currentItemBackgroundColor
        ? StoreAction.CAPTURE
        : StoreAction.NONE,
    };
  }
});

export const actionChangeFillStyle = register({
  name: "changeFillStyle",
  label: "labels.fill",
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    trackEvent(
      "element",
      "changeFillStyle",
      `${value} (${app.device.editor.isMobile ? "mobile" : "desktop"})`,
    );
    return {
      elements: changeProperty(elements, appState, (el) =>
        newElementWith(el, {
          fillStyle: value,
        }),
      ),
      appState: { ...appState, currentItemFillStyle: value },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeStrokeWidth = register({
  name: "changeStrokeWidth",
  label: "labels.strokeWidth",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements: changeProperty(elements, appState, (el) =>
        newElementWith(el, {
          strokeWidth: value,
        }),
      ),
      appState: { ...appState, currentItemStrokeWidth: value },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeSloppiness = register({
  name: "changeSloppiness",
  label: "labels.sloppiness",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements: changeProperty(elements, appState, (el) =>
        newElementWith(el, {
          seed: randomInteger(),
          roughness: value,
        }),
      ),
      appState: { ...appState, currentItemRoughness: value },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeStrokeStyle = register({
  name: "changeStrokeStyle",
  label: "labels.strokeStyle",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements: changeProperty(elements, appState, (el) =>
        newElementWith(el, {
          strokeStyle: value,
        }),
      ),
      appState: { ...appState, currentItemStrokeStyle: value },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeOpacity = register({
  name: "changeOpacity",
  label: "labels.opacity",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements: changeProperty(
        elements,
        appState,
        (el) =>
          newElementWith(el, {
            opacity: value,
          }),
        true,
      ),
      appState: { ...appState, currentItemOpacity: value },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeFontSize = register({
  name: "changeFontSize",
  label: "labels.fontSize",
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    return changeFontSize(elements, appState, app, () => value, value);
  }
});

export const actionDecreaseFontSize = register({
  name: "decreaseFontSize",
  label: "labels.decreaseFontSize",
  // icon: fontSizeIcon,
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    return changeFontSize(elements, appState, app, (element) =>
      Math.round(
        // get previous value before relative increase (doesn't work fully
        // due to rounding and float precision issues)
        (1 / (1 + FONT_SIZE_RELATIVE_INCREASE_STEP)) * element.fontSize,
      ),
    );
  },
  keyTest: (event) => {
    return (
      event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      // KEYS.COMMA needed for MacOS
      (event.key === KEYS.CHEVRON_LEFT || event.key === KEYS.COMMA)
    );
  },
});

export const actionIncreaseFontSize = register({
  name: "increaseFontSize",
  label: "labels.increaseFontSize",
  // icon: fontSizeIcon,
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    return changeFontSize(elements, appState, app, (element) =>
      Math.round(element.fontSize * (1 + FONT_SIZE_RELATIVE_INCREASE_STEP)),
    );
  },
  keyTest: (event) => {
    return (
      event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      // KEYS.PERIOD needed for MacOS
      (event.key === KEYS.CHEVRON_RIGHT || event.key === KEYS.PERIOD)
    );
  },
});

type ChangeFontFamilyData = Partial<
  Pick<
    AppState,
    "openPopup" | "currentItemFontFamily" | "currentHoveredFontFamily"
  >
> & {
  /** cache of selected & editing elements populated on opened popup */
  cachedElements?: Map<string, DucElement>;
  /** flag to reset all elements to their cached versions  */
  resetAll?: true;
  /** flag to reset all containers to their cached versions */
  resetContainers?: true;
};

export const actionChangeFontFamily = register({
  name: "changeFontFamily",
  label: "labels.fontFamily",
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    const { cachedElements, resetAll, resetContainers, ...nextAppState } =
      value as ChangeFontFamilyData;

    if (resetAll) {
      const nextElements = changeProperty(
        elements,
        appState,
        (element) => {
          const cachedElement = cachedElements?.get(element.id);
          if (cachedElement) {
            const newElement = newElementWith(element, {
              ...cachedElement,
            });

            return newElement;
          }

          return element;
        },
        true,
      );

      return {
        elements: nextElements,
        appState: {
          ...appState,
          ...nextAppState,
        },
        storeAction: StoreAction.UPDATE,
      };
    }

    const { currentItemFontFamily, currentHoveredFontFamily } = value;

    let nexStoreAction: StoreActionType = StoreAction.NONE;
    let nextFontFamily: FontFamilyValues | undefined;
    let skipOnHoverRender = false;

    if (currentItemFontFamily) {
      nextFontFamily = currentItemFontFamily;
      nexStoreAction = StoreAction.CAPTURE;
    } else if (currentHoveredFontFamily) {
      nextFontFamily = currentHoveredFontFamily;
      nexStoreAction = StoreAction.NONE;

      const selectedTextElements = getSelectedElements(elements, appState, {
        includeBoundTextElement: true,
      }).filter((element) => isTextElement(element));

      // skip on hover re-render for more than 200 text elements or for text element with more than 5000 chars combined
      if (selectedTextElements.length > 200) {
        skipOnHoverRender = true;
      } else {
        let i = 0;
        let textLengthAccumulator = 0;

        while (
          i < selectedTextElements.length &&
          textLengthAccumulator < 5000
        ) {
          const textElement = selectedTextElements[i] as DucTextElement;
          textLengthAccumulator += textElement?.originalText.length || 0;
          i++;
        }

        if (textLengthAccumulator > 5000) {
          skipOnHoverRender = true;
        }
      }
    }

    const result = {
      appState: {
        ...appState,
        ...nextAppState,
      },
      storeAction: nexStoreAction,
    };

    if (nextFontFamily && !skipOnHoverRender) {
      const elementContainerMapping = new Map<
        DucTextElement,
        DucElement | null
      >();
      let uniqueGlyphs = new Set<string>();
      let skipFontFaceCheck = false;

      const fontsCache = Array.from(Fonts.loadedFontsCache.values());
      const fontFamily = Object.entries(FONT_FAMILY).find(
        ([_, value]) => value === nextFontFamily,
      )?.[0];

      // skip `document.font.check` check on hover, if at least one font family has loaded as it's super slow (could result in slightly different bbox, which is fine)
      if (
        currentHoveredFontFamily &&
        fontFamily &&
        fontsCache.some((sig) => sig.startsWith(fontFamily))
      ) {
        skipFontFaceCheck = true;
      }

      // following causes re-render so make sure we changed the family
      // otherwise it could cause unexpected issues, such as preventing opening the popover when in wysiwyg
      Object.assign(result, {
        elements: changeProperty(
          elements,
          appState,
          (oldElement) => {
            if (
              isTextElement(oldElement) &&
              (oldElement.fontFamily !== nextFontFamily ||
                currentItemFontFamily) // force update on selection
            ) {
              const newElement: DucTextElement = newElementWith(
                oldElement,
                {
                  fontFamily: nextFontFamily,
                  lineHeight: getLineHeight(nextFontFamily!),
                },
              );

              const cachedContainer =
                cachedElements?.get(oldElement.containerId || "") || {};

              const container = app.scene.getContainerElement(oldElement);

              if (resetContainers && container && cachedContainer) {
                // reset the container back to it's cached version
                mutateElement(container, { ...cachedContainer }, false);
              }

              if (!skipFontFaceCheck) {
                uniqueGlyphs = new Set([
                  ...uniqueGlyphs,
                  ...Array.from(newElement.originalText),
                ]);
              }

              elementContainerMapping.set(newElement, container);

              return newElement;
            }

            return oldElement;
          },
          true,
        ),
      });

      // size is irrelevant, but necessary
      const fontString = `10px ${getFontFamilyString({
        fontFamily: nextFontFamily,
      })}`;
      const glyphs = Array.from(uniqueGlyphs.values()).join();

      if (
        skipFontFaceCheck ||
        window.document.fonts.check(fontString, glyphs)
      ) {
        // we either skip the check (have at least one font face loaded) or do the check and find out all the font faces have loaded
        for (const [element, container] of elementContainerMapping) {
          // trigger synchronous redraw
          redrawTextBoundingBox(
            element,
            container,
            app.scene.getNonDeletedElementsMap(),
            false,
          );
        }
      } else {
        // otherwise try to load all font faces for the given glyphs and redraw elements once our font faces loaded
        window.document.fonts.load(fontString, glyphs).then((fontFaces) => {
          for (const [element, container] of elementContainerMapping) {
            // use latest element state to ensure we don't have closure over an old instance in order to avoid possible race conditions (i.e. font faces load out-of-order while rapidly switching fonts)
            const latestElement = app.scene.getElement(element.id);
            const latestContainer = container
              ? app.scene.getElement(container.id)
              : null;

            if (latestElement) {
              // trigger async redraw
              redrawTextBoundingBox(
                latestElement as DucTextElement,
                latestContainer,
                app.scene.getNonDeletedElementsMap(),
                false,
              );
            }
          }

          // trigger update once we've mutated all the elements, which also updates our cache
          app.fonts.onLoaded(fontFaces);
        });
      }
    }

    return result;
  },
  PanelComponent: ({ elements, appState, app, updateData }) => {
    return null;
  //   const cachedElementsRef = useRef<Map<string, DucElement>>(new Map());
  //   const prevSelectedFontFamilyRef = useRef<number | null>(null);
  //   // relying on state batching as multiple `FontPicker` handlers could be called in rapid succession and we want to combine them
  //   const [batchedData, setBatchedData] = useState<ChangeFontFamilyData>({});
  //   const isUnmounted = useRef(true);

  //   const selectedFontFamily = useMemo(() => {
  //     const getFontFamily = (
  //       elementsArray: readonly DucElement[],
  //       elementsMap: Map<string, DucElement>,
  //     ) =>
  //       getFormValue(
  //         elementsArray,
  //         appState,
  //         (element) => {
  //           if (isTextElement(element)) {
  //             return element.fontFamily;
  //           }
  //           const boundTextElement = getBoundTextElement(element, elementsMap);
  //           if (boundTextElement) {
  //             return boundTextElement.fontFamily;
  //           }
  //           return null;
  //         },
  //         (element) =>
  //           isTextElement(element) ||
  //           getBoundTextElement(element, elementsMap) !== null,
  //         (hasSelection) =>
  //           hasSelection
  //             ? null
  //             : appState.currentItemFontFamily || DEFAULT_FONT_FAMILY,
  //       );

  //     // popup opened, use cached elements
  //     if (
  //       batchedData.openPopup === "fontFamily" &&
  //       appState.openPopup === "fontFamily"
  //     ) {
  //       return getFontFamily(
  //         Array.from(cachedElementsRef.current?.values() ?? []),
  //         cachedElementsRef.current,
  //       );
  //     }

  //     // popup closed, use all elements
  //     if (!batchedData.openPopup && appState.openPopup !== "fontFamily") {
  //       return getFontFamily(elements, app.scene.getNonDeletedElementsMap());
  //     }

  //     // popup props are not in sync, hence we are in the middle of an update, so keeping the previous value we've had
  //     return prevSelectedFontFamilyRef.current;
  //   }, [batchedData.openPopup, appState, elements, app.scene]);

  //   useEffect(() => {
  //     prevSelectedFontFamilyRef.current = selectedFontFamily;
  //   }, [selectedFontFamily]);

  //   useEffect(() => {
  //     if (Object.keys(batchedData).length) {
  //       updateData(batchedData);
  //       // reset the data after we've used the data
  //       setBatchedData({});
  //     }
  //     // call update only on internal state changes
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [batchedData]);

  //   useEffect(() => {
  //     isUnmounted.current = false;

  //     return () => {
  //       isUnmounted.current = true;
  //     };
  //   }, []);

  //   return (
  //     <fieldset>
  //       <legend>{t("labels.fontFamily")}</legend>
  //       <FontPicker
  //         isOpened={appState.openPopup === "fontFamily"}
  //         selectedFontFamily={selectedFontFamily}
  //         hoveredFontFamily={appState.currentHoveredFontFamily}
  //         onSelect={(fontFamily) => {
  //           setBatchedData({
  //             openPopup: null,
  //             currentHoveredFontFamily: null,
  //             currentItemFontFamily: fontFamily,
  //           });

  //           // defensive clear so immediate close won't abuse the cached elements
  //           cachedElementsRef.current.clear();
  //         }}
  //         onHover={(fontFamily) => {
  //           setBatchedData({
  //             currentHoveredFontFamily: fontFamily,
  //             cachedElements: new Map(cachedElementsRef.current),
  //             resetContainers: true,
  //           });
  //         }}
  //         onLeave={() => {
  //           setBatchedData({
  //             currentHoveredFontFamily: null,
  //             cachedElements: new Map(cachedElementsRef.current),
  //             resetAll: true,
  //           });
  //         }}
  //         onPopupChange={(open) => {
  //           if (open) {
  //             // open, populate the cache from scratch
  //             cachedElementsRef.current.clear();

  //             const { editingTextElement } = appState;

  //             // still check type to be safe
  //             if (editingTextElement?.type === "text") {
  //               // retrieve the latest version from the scene, as `editingTextElement` isn't mutated
  //               const latesteditingTextElement = app.scene.getElement(
  //                 editingTextElement.id,
  //               );

  //               // inside the wysiwyg editor
  //               cachedElementsRef.current.set(
  //                 editingTextElement.id,
  //                 newElementWith(
  //                   latesteditingTextElement || editingTextElement,
  //                   {},
  //                   true,
  //                 ),
  //               );
  //             } else {
  //               const selectedElements = getSelectedElements(
  //                 elements,
  //                 appState,
  //                 {
  //                   includeBoundTextElement: true,
  //                 },
  //               );

  //               for (const element of selectedElements) {
  //                 cachedElementsRef.current.set(
  //                   element.id,
  //                   newElementWith(element, {}, true),
  //                 );
  //               }
  //             }

  //             setBatchedData({
  //               openPopup: "fontFamily",
  //             });
  //           } else {
  //             // close, use the cache and clear it afterwards
  //             const data = {
  //               openPopup: null,
  //               currentHoveredFontFamily: null,
  //               cachedElements: new Map(cachedElementsRef.current),
  //               resetAll: true,
  //             } as ChangeFontFamilyData;

  //             if (isUnmounted.current) {
  //               // in case the component was unmounted by the parent, trigger the update directly
  //               updateData({ ...batchedData, ...data });
  //             } else {
  //               setBatchedData(data);
  //             }

  //             cachedElementsRef.current.clear();
  //           }
  //         }}
  //       />
  //     </fieldset>
  //   );
  },
});

export const actionChangeTextAlign = register({
  name: "changeTextAlign",
  label: "Change text alignment",
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    return {
      elements: changeProperty(
        elements,
        appState,
        (oldElement) => {
          if (isTextElement(oldElement)) {
            const newElement: DucTextElement = newElementWith(
              oldElement,
              { textAlign: value },
            );
            redrawTextBoundingBox(
              newElement,
              app.scene.getContainerElement(oldElement),
              app.scene.getNonDeletedElementsMap(),
            );
            return newElement;
          }

          return oldElement;
        },
        true,
      ),
      appState: {
        ...appState,
        currentItemTextAlign: value,
      },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeVerticalAlign = register({
  name: "changeVerticalAlign",
  label: "Change vertical alignment",
  trackEvent: { category: "element" },
  perform: (elements, appState, value, app) => {
    return {
      elements: changeProperty(
        elements,
        appState,
        (oldElement) => {
          if (isTextElement(oldElement)) {
            const newElement: DucTextElement = newElementWith(
              oldElement,
              { verticalAlign: value },
            );

            redrawTextBoundingBox(
              newElement,
              app.scene.getContainerElement(oldElement),
              app.scene.getNonDeletedElementsMap(),
            );
            return newElement;
          }

          return oldElement;
        },
        true,
      ),
      appState: {
        ...appState,
      },
      storeAction: StoreAction.CAPTURE,
    };
  },
});

export const actionChangeRoundness = register({
  name: "changeRoundness",
  label: "Change edge roundness",
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements: changeProperty(elements, appState, (el) => {
        if (isElbowArrow(el)) {
          return el;
        }

        return newElementWith(el, {
          roundness:
            value === "round"
              ? {
                  type: isUsingAdaptiveRadius(el.type)
                    ? ROUNDNESS.ADAPTIVE_RADIUS
                    : ROUNDNESS.PROPORTIONAL_RADIUS,
                }
              : null,
        });
      }),
      appState: {
        ...appState,
        currentItemRoundness: value,
      },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

const getArrowheadOptions = (flip: boolean) => {
  return [
    {
      value: null,
      text: t("labels.arrowhead_none"),
      keyBinding: "q",
      icon: ArrowheadNoneIcon,
    },
    {
      value: "arrow",
      text: t("labels.arrowhead_arrow"),
      keyBinding: "w",
      icon: <ArrowheadArrowIcon flip={flip} />,
    },
    {
      value: "bar",
      text: t("labels.arrowhead_bar"),
      keyBinding: "e",
      icon: <ArrowheadBarIcon flip={flip} />,
    },
    {
      value: "dot",
      text: t("labels.arrowhead_circle"),
      keyBinding: null,
      icon: <ArrowheadCircleIcon flip={flip} />,
      showInPicker: false,
    },
    {
      value: "circle",
      text: t("labels.arrowhead_circle"),
      keyBinding: "r",
      icon: <ArrowheadCircleIcon flip={flip} />,
      showInPicker: false,
    },
    {
      value: "circle_outline",
      text: t("labels.arrowhead_circle_outline"),
      keyBinding: null,
      icon: <ArrowheadCircleOutlineIcon flip={flip} />,
      showInPicker: false,
    },
    {
      value: "triangle",
      text: t("labels.arrowhead_triangle"),
      icon: <ArrowheadTriangleIcon flip={flip} />,
      keyBinding: "t",
    },
    {
      value: "triangle_outline",
      text: t("labels.arrowhead_triangle_outline"),
      icon: <ArrowheadTriangleOutlineIcon flip={flip} />,
      keyBinding: null,
      showInPicker: false,
    },
    {
      value: "diamond",
      text: t("labels.arrowhead_diamond"),
      icon: <ArrowheadDiamondIcon flip={flip} />,
      keyBinding: null,
      showInPicker: false,
    },
    {
      value: "diamond_outline",
      text: t("labels.arrowhead_diamond_outline"),
      icon: <ArrowheadDiamondOutlineIcon flip={flip} />,
      keyBinding: null,
      showInPicker: false,
    },
  ] as const;
};

export const actionChangeArrowhead = register({
  name: "changeArrowhead",
  label: "Change arrowheads",
  trackEvent: false,
  perform: (
    elements,
    appState,
    value: { position: "start" | "end"; type: Arrowhead },
  ) => {
    return {
      elements: changeProperty(elements, appState, (el) => {
        if (isLinearElement(el)) {
          const { position, type } = value;

          if (position === "start") {
            const element: DucLinearElement = newElementWith(el, {
              startArrowhead: type,
            });
            return element;
          } else if (position === "end") {
            const element: DucLinearElement = newElementWith(el, {
              endArrowhead: type,
            });
            return element;
          }
        }

        return el;
      }),
      appState: {
        ...appState,
        [value.position === "start"
          ? "currentItemStartArrowhead"
          : "currentItemEndArrowhead"]: value.type,
      },
      storeAction: StoreAction.CAPTURE,
    };
  }
});

export const actionChangeArrowType = register({
  name: "changeArrowType",
  label: "Change arrow types",
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    return {
      elements: changeProperty(elements, appState, (el) => {
        if (!isArrowElement(el)) {
          return el;
        }
        const newElement = newElementWith(el, {
          roundness:
            value === ARROW_TYPE.round
              ? {
                  type: ROUNDNESS.PROPORTIONAL_RADIUS,
                }
              : null,
          elbowed: value === ARROW_TYPE.elbow,
          points:
            value === ARROW_TYPE.elbow || el.elbowed
              ? [el.points[0], el.points[el.points.length - 1]]
              : el.points,
        });

        if (isElbowArrow(newElement)) {
          const elementsMap = app.scene.getNonDeletedElementsMap();

          app.dismissLinearEditor();

          const startGlobalPoint =
            LinearElementEditor.getPointAtIndexGlobalCoordinates(
              newElement,
              0,
              elementsMap,
            );
          const endGlobalPoint =
            LinearElementEditor.getPointAtIndexGlobalCoordinates(
              newElement,
              -1,
              elementsMap,
            );
          const startHoveredElement =
            !newElement.startBinding &&
            getHoveredElementForBinding(
              startGlobalPoint,
              elements,
              elementsMap,
              true,
            );
          const endHoveredElement =
            !newElement.endBinding &&
            getHoveredElementForBinding(
              endGlobalPoint,
              elements,
              elementsMap,
              true,
            );
          const startElement = startHoveredElement
            ? startHoveredElement
            : newElement.startBinding &&
              (elementsMap.get(
                newElement.startBinding.elementId,
              ) as DucBindableElement);
          const endElement = endHoveredElement
            ? endHoveredElement
            : newElement.endBinding &&
              (elementsMap.get(
                newElement.endBinding.elementId,
              ) as DucBindableElement);

          const finalStartPoint = startHoveredElement
            ? bindPointToSnapToElementOutline(
                startGlobalPoint,
                endGlobalPoint,
                startHoveredElement,
                elementsMap,
              )
            : startGlobalPoint;
          const finalEndPoint = endHoveredElement
            ? bindPointToSnapToElementOutline(
                endGlobalPoint,
                startGlobalPoint,
                endHoveredElement,
                elementsMap,
              )
            : endGlobalPoint;

          startHoveredElement &&
            bindLinearElement(
              newElement,
              startHoveredElement,
              "start",
              elementsMap,
            );
          endHoveredElement &&
            bindLinearElement(
              newElement,
              endHoveredElement,
              "end",
              elementsMap,
            );

          mutateElbowArrow(
            newElement,
            elementsMap,
            [finalStartPoint, finalEndPoint].map(
              (point) =>
                ({x: point.x - newElement.x, y: point.y - newElement.y} as Point),
            ),
            {x: 0, y: 0},
            {
              ...(startElement && newElement.startBinding
                ? {
                    startBinding: {
                      // @ts-ignore TS cannot discern check above
                      ...newElement.startBinding!,
                      ...calculateFixedPointForElbowArrowBinding(
                        newElement,
                        startElement,
                        "start",
                        elementsMap,
                      ),
                    },
                  }
                : {}),
              ...(endElement && newElement.endBinding
                ? {
                    endBinding: {
                      // @ts-ignore TS cannot discern check above
                      ...newElement.endBinding,
                      ...calculateFixedPointForElbowArrowBinding(
                        newElement,
                        endElement,
                        "end",
                        elementsMap,
                      ),
                    },
                  }
                : {}),
            },
          );
        } else {
          mutateElement(
            newElement,
            {
              startBinding: newElement.startBinding
                ? { ...newElement.startBinding, fixedPoint: null }
                : null,
              endBinding: newElement.endBinding
                ? { ...newElement.endBinding, fixedPoint: null }
                : null,
            },
            false,
          );
        }

        return newElement;
      }),
      appState: {
        ...appState,
        currentItemArrowType: value,
      },
      storeAction: StoreAction.CAPTURE,
    };
  },
  // PanelComponent: ({ elements, appState, updateData }) => {
  //   return (
  //     <fieldset>
  //       <legend>{t("labels.arrowtypes")}</legend>
  //       <ButtonIconSelect
  //         group="arrowtypes"
  //         options={[
  //           {
  //             value: ARROW_TYPE.sharp,
  //             text: t("labels.arrowtype_sharp"),
  //             icon: sharpArrowIcon,
  //             testId: "sharp-arrow",
  //           },
  //           {
  //             value: ARROW_TYPE.round,
  //             text: t("labels.arrowtype_round"),
  //             icon: roundArrowIcon,
  //             testId: "round-arrow",
  //           },
  //           {
  //             value: ARROW_TYPE.elbow,
  //             text: t("labels.arrowtype_elbowed"),
  //             icon: elbowArrowIcon,
  //             testId: "elbow-arrow",
  //           },
  //         ]}
  //         value={getFormValue(
  //           elements,
  //           appState,
  //           (element) => {
  //             if (isArrowElement(element)) {
  //               return element.elbowed
  //                 ? ARROW_TYPE.elbow
  //                 : element.roundness
  //                 ? ARROW_TYPE.round
  //                 : ARROW_TYPE.sharp;
  //             }

  //             return null;
  //           },
  //           (element) => isArrowElement(element),
  //           (hasSelection) =>
  //             hasSelection ? null : appState.currentItemArrowType,
  //         )}
  //         onChange={(value) => updateData(value)}
  //       />
  //     </fieldset>
  //   );
  // },
});
