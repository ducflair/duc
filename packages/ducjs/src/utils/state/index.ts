import { ANTI_ALIASING, TEXT_ALIGN } from "ducjs/duc";
import { DucState, RawValue } from "ducjs/types";
import { COLOR_PALETTE, DEFAULT_ELEMENT_PROPS, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_GRID_SIZE, DEFAULT_GRID_STEP } from "ducjs/utils/constants";
import { getNormalizedZoom } from "ducjs/utils/normalize";
import { getPrecisionValueFromRaw, getScaledZoomValueForScope, getScopedZoomValue, NEUTRAL_SCOPE } from "ducjs/utils/scopes";
import { DESIGN_STANDARD } from "ducjs/utils/standards";


export const getDefaultDucState = (): Omit<
  DucState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => {
  const scrollX = window.innerWidth / 2;
  const scrollY = window.innerHeight / 2;
  const zoom = getNormalizedZoom(1);
  const scope = NEUTRAL_SCOPE;
  const scopedZoom = getScopedZoomValue(zoom, scope);

  return {
    scope,
    mainScope: scope,
    standard: DESIGN_STANDARD.DUC,
    editingLinearElement: null,
    elementHovered: null,
    gridSize: DEFAULT_GRID_SIZE,
    gridStep: DEFAULT_GRID_STEP,
    isBindingEnabled: true,
    name: null,
    scrolledOutside: false,
    scrollX: getPrecisionValueFromRaw(scrollX as RawValue, NEUTRAL_SCOPE, scope),
    scrollY: getPrecisionValueFromRaw(scrollY as RawValue, NEUTRAL_SCOPE, scope),
    selectedElementIds: {},
    selectedGroupIds: {},
    suggestedBindings: [],
    viewBackgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? COLOR_PALETTE.night : COLOR_PALETTE.white,
    zoom: {
      value: zoom,
      scoped: scopedZoom,
      scaled: getScaledZoomValueForScope(scopedZoom, scope),
    },

    displayAllPointDistances: false,
    displayDistanceOnDrawing: true,
    displayAllPointInfoSelected: false,
    displayAllPointCoordinates: false,

    coordDecimalPlaces: 2,
    scopeExponentThreshold: 2,

    displayRootAxis: false,
    lineBendingMode: false,

    debugRendering: false,
    elementsPendingErasure: new Set(),

    activeTool: {
      type: "selection",
      customType: null,
      locked: DEFAULT_ELEMENT_PROPS.locked,
      fromSelection: false,
      lastActiveTool: null,
    },

    currentItemBackground: DEFAULT_ELEMENT_PROPS.background,
    currentItemStroke: DEFAULT_ELEMENT_PROPS.stroke,
    currentItemStartLineHead: null,
    currentItemEndLineHead: null,
    currentItemFontFamily: DEFAULT_FONT_FAMILY,
    currentItemTextAlign: TEXT_ALIGN.LEFT,
    currentItemFontSize: getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, scope, scope),
    currentItemOpacity: DEFAULT_ELEMENT_PROPS.opacity,
    currentItemRoundness: getPrecisionValueFromRaw(0 as RawValue, scope, scope),


    activeGridSettings: [],
    activeSnapSettings: "",


    antiAliasing: ANTI_ALIASING.ANALYTIC,
    vSync: true,

    penMode: false,
    showHyperlinkPopup: false,

    zoomStep: 0,
    scaleRatioLocked: false,

  };
};