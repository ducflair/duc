export type DucView = {
  id: string;
  name: string;
  
  scrollX: PrecisionValue;
  scrollY: PrecisionValue;
  zoom: Zoom;
  twistAngle: Radian;

  /** The specific spot on that plane that you want to be in the middle of your screen when this view is active */
  centerPoint: DucPoint;

  scope: Scope;
};
