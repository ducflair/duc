import { isFiniteNumber } from "..";
import { TEXT_ALIGN } from "../../enums";
import {
  DucCharter,
  DucGlobalState,
  DucIssue,
  DucLocalState,
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
 * Returns the normalized zoom object using default fallback.
 */
export const getZoom = (
  value: number,
): Zoom => {
  const zoomValue = getNormalizedZoom(
    isFiniteNumber(value)
      ? value
      : 1
  );
  return {
    value: zoomValue,
    scaled: zoomValue === 0 || !isFinite(zoomValue) ? 1 : 1 / zoomValue,
  };
};

export const getDefaultGlobalState = (): DucGlobalState => {
  return {
    viewBackgroundColor: COLOR_PALETTE.white,
  };
};

export const getDefaultCharter = (): DucCharter => ({
  title: "",
  objective: "",
  phase: "intent",
  requirements: [],
  constraints: [],
  decisions: [],
  updatedAt: Date.now(),
});

export const getDefaultIssues = (): DucIssue[] => [];

export const getDefaultLocalState = (): Omit<
  DucLocalState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => {
  const scrollX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const scrollY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  const zoom = getNormalizedZoom(1);

  return {
    isBindingEnabled: true,

    scrollX,
    scrollY,
    zoom: getZoom(1),

    currentItemBackground: DEFAULT_ELEMENT_PROPS.background,
    currentItemStroke: DEFAULT_ELEMENT_PROPS.stroke,
    currentItemStartLineHead: null,
    currentItemEndLineHead: null,
    currentItemFontFamily: DEFAULT_FONT_FAMILY,
    currentItemTextAlign: TEXT_ALIGN.LEFT,
    currentItemFontSize: DEFAULT_FONT_SIZE,
    currentItemOpacity: DEFAULT_ELEMENT_PROPS.opacity,
    currentItemRoundness: 0,

    penMode: false,
    viewModeEnabled: false,
    objectsSnapModeEnabled: true,
    gridModeEnabled: false,
    outlineModeEnabled: false,
    manualSaveMode: false,
    decimalPlaces: 2,
  };
};
