import { PruningLevel } from "ducjs/types";
import { ValueOf } from "ducjs/types/utility-types";

export interface DucConfig { // User's Config of AppState
  theme: Theme;

  showHyperlinkPopup: ShowHyperlinkPopup;

  antiAliasing: AntiAliasing;
  vSync: boolean;
  zoomStep: number;


  scaleRatioLocked: boolean;
  displayAllPointDistances: boolean;
  displayDistanceOnDrawing: boolean;
  displayAllPointCoordinates: boolean;
  displayAllPointInfoSelected: boolean;
  displayRootAxis: boolean;

  debugRendering: boolean;

  /**
   * Whether to disable the auto-save feature
   */
  manualSaveMode: boolean;

  defaultVersionGraphPruningLevel: PruningLevel;
}


export type ShowHyperlinkPopup = ValueOf<typeof SHOW_HYPERLINK_POPUP>;
export type AntiAliasing = ValueOf<typeof ANTI_ALIASING>;
export type Theme = ValueOf<typeof THEME>;

export const ANTI_ALIASING = {
  MSAA_8: 8,
  MSAA_16: 16,
  NONE: 10,
  ANALYTIC: 32,
} as const;
export const SHOW_HYPERLINK_POPUP = {
  NONE: 10,
  INFO: 11,
  EDITOR: 12,
} as const;
export const THEME = {
  LIGHT: "light",
  DARK: "dark",
} as const;