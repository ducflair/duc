import { ANTI_ALIASING, SHOW_HYPERLINK_POPUP, THEME } from "ducjs/duc";
import { PruningLevel } from "ducjs/types";
import { ValueOf } from "ducjs/types/utility-types";


export type ShowHyperlinkPopup = ValueOf<typeof SHOW_HYPERLINK_POPUP>;
export type AntiAliasing = ValueOf<typeof ANTI_ALIASING>;

export interface DucConfig { // User's Config of AppState
  theme: THEME;

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