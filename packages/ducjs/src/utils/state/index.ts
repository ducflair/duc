export * from "./grid";



import { TEXT_ALIGN } from "ducjs/duc";
import { PREDEFINED_STANDARDS } from "ducjs/technical";
import {
  getPrecisionValueFromRaw,
  getScaledZoomValueForScope,
  getScopedZoomValue,
  NEUTRAL_SCOPE,
} from "ducjs/technical/scopes";
import {
  DucGlobalState,
  DucLocalState,
  RawValue,
  ScaleFactor,
  Scope,
  Zoom,
} from "ducjs/types";
import {
  COLOR_PALETTE,
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
} from "ducjs/utils/constants";
import { getNormalizedZoom } from "ducjs/utils/normalize";
import { isFiniteNumber } from "ducjs/utils";
import { isValidPrecisionScopeValue } from "ducjs/restore/restoreDataState";

// appState

// export const updateActiveTool = (
//   appState: Pick<DucLocalState, "activeTool">,
//   data: ((
//     | {
//       type: ToolType;
//     }
//     | { type: "custom"; customType: string }
//   ) & { locked?: boolean; fromSelection?: boolean }) & {
//     lastActiveToolBeforeEraser?: ActiveTool | null;
//   },
// ): DucLocalState["activeTool"] => {
//   if (data.type === "custom") {
//     return {
//       ...appState.activeTool,
//       type: "custom",
//       customType: data.customType,
//       locked: data.locked ?? appState.activeTool.locked,
//     };
//   }

//   return {
//     ...appState.activeTool,
//     lastActiveTool:
//       data.lastActiveToolBeforeEraser === undefined
//         ? appState.activeTool.lastActiveTool
//         : data.lastActiveToolBeforeEraser,
//     type: data.type,
//     customType: null,
//     locked: data.locked ?? appState.activeTool.locked,
//     fromSelection: data.fromSelection ?? false,
//   };
// };
// activeTool: {
//   type: "selection",
//   customType: null,
//   locked: DEFAULT_ELEMENT_PROPS.locked,
//   fromSelection: false,
//   lastActiveTool: null,
// },


// duconfig
// displayAllPointDistances: false,
// displayDistanceOnDrawing: true,
// displayAllPointInfoSelected: false,
// displayAllPointCoordinates: false,
// displayRootAxis: false,
// showHyperlinkPopup: false,
// antiAliasing: ANTI_ALIASING.ANALYTIC,
// vSync: true,
// zoomStep: 0,
// scaleRatioLocked: false,
// theme: THEME.LIGHT,
// debugRendering: false,

/**
 * Returns the zoom object with value, scoped, and scaled properties,
 * using importedState, restoredGlobalState, and defaults.
 */
export const getZoom = (
  value: number,
  mainScope: Scope, 
  scopeExponentThreshold: number,
): Zoom => {
  const zoomValue = getNormalizedZoom(
    isFiniteNumber(value)
      ? value
      : 1
  );
  const scope = isValidPrecisionScopeValue(
    value,
    mainScope,
    scopeExponentThreshold
  );
  const scopedZoom = getScopedZoomValue(value, scope);
  return {
    value: zoomValue,
    scoped: scopedZoom,
    scaled: getScaledZoomValueForScope(scopedZoom, scope),
  };
};

export const getDefaultGlobalState = (): DucGlobalState => {
  return {
    name: null,
    viewBackgroundColor: window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? COLOR_PALETTE.night
      : COLOR_PALETTE.white,
    scopeExponentThreshold: 2,
    mainScope: NEUTRAL_SCOPE,
    dashSpacingScale: 1 as ScaleFactor,
    isDashSpacingAffectedByViewportScale: false,
    dimensionsAssociativeByDefault: false,
    useAnnotativeScaling: false,
    displayPrecision: {
      linear: 2,
      angular: 1,
    },
  };
};

export const getDefaultLocalState = (): Omit<
  DucLocalState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => {
  const scrollX = window.innerWidth / 2;
  const scrollY = window.innerHeight / 2;
  const zoom = getNormalizedZoom(1);
  const scope = NEUTRAL_SCOPE;
  const scopedZoom = getScopedZoomValue(zoom, scope);

  return {
    scope,
    activeStandardId: PREDEFINED_STANDARDS.DUC,
    isBindingEnabled: true,

    scrollX: getPrecisionValueFromRaw(
      scrollX as RawValue,
      NEUTRAL_SCOPE,
      scope
    ),
    scrollY: getPrecisionValueFromRaw(
      scrollY as RawValue,
      NEUTRAL_SCOPE,
      scope
    ),
    zoom: {
      value: zoom,
      scoped: scopedZoom,
      scaled: getScaledZoomValueForScope(scopedZoom, scope),
    },

    currentItemBackground: DEFAULT_ELEMENT_PROPS.background,
    currentItemStroke: DEFAULT_ELEMENT_PROPS.stroke,
    currentItemStartLineHead: null,
    currentItemEndLineHead: null,
    currentItemFontFamily: DEFAULT_FONT_FAMILY,
    currentItemTextAlign: TEXT_ALIGN.LEFT,
    currentItemFontSize: getPrecisionValueFromRaw(
      DEFAULT_FONT_SIZE as RawValue,
      scope,
      scope
    ),
    currentItemOpacity: DEFAULT_ELEMENT_PROPS.opacity,
    currentItemRoundness: getPrecisionValueFromRaw(0 as RawValue, scope, scope),

    activeGridSettings: [],
    activeSnapSettings: "",

    penMode: false,
    viewModeEnabled: false,
    objectsSnapModeEnabled: true,
    gridModeEnabled: false,
    outlineModeEnabled: false,

    gridSize: 10,
    gridStep: 10,
  };
};
