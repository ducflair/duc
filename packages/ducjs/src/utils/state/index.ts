import { isFiniteNumber } from "..";
import { PRUNING_LEVEL, TEXT_ALIGN } from "../../enums";
import { isValidPrecisionScopeValue } from "../../restore/restoreDataState";
import {
  getPrecisionValueFromRaw,
  getScaledZoomValueForScope,
  getScopedZoomValue,
  NEUTRAL_SCOPE,
} from "../../technical/scopes";
import {
  DucGlobalState,
  DucLocalState,
  RawValue,
  Scope,
  Zoom,
} from "../../types";
import {
  COLOR_PALETTE,
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
} from "../constants";
import { getNormalizedZoom } from "../normalize";

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
    viewBackgroundColor: typeof window !== "undefined" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? COLOR_PALETTE.night : COLOR_PALETTE.white) : COLOR_PALETTE.white,
    scopeExponentThreshold: 3,
    mainScope: NEUTRAL_SCOPE,
    pruningLevel: PRUNING_LEVEL.BALANCED,
  };
};

export const getDefaultLocalState = (): Omit<
  DucLocalState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => {
  const scrollX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const scrollY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  const zoom = getNormalizedZoom(1);
  const scope = NEUTRAL_SCOPE;
  const scopedZoom = getScopedZoomValue(zoom, scope);

  return {
    scope,
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

    penMode: false,
    viewModeEnabled: false,
    objectsSnapModeEnabled: true,
    gridModeEnabled: false,
    outlineModeEnabled: false,
    manualSaveMode: false,
    decimalPlaces: 2,
  };
};
