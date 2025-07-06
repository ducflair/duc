
export type DucXRayElement = _DucElementBase & {
  type: "xray"
  origin: DucPoint;
  direction: DucPoint;
  /**
   * If true, the x-ray will start from the origin.
   * If false, the x-ray will be a full infinite line.
   * @default false
   */
  startFromOrigin: boolean;
}