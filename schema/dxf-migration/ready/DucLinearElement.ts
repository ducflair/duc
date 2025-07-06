
export const LINE_HEAD = {
  block: 5,
  arrow: 10,
  bar: 11,
  circle: 12,
  circle_outlined: 13,
  triangle: 14,
  triangle_outlined: 15,
  diamond: 16,
  diamond_outlined: 17,
  cross: 18,
  open_arrow: 19,
  reversed_arrow: 20,
  reversed_triangle: 21,
  reversed_triangle_outlined: 22,
  cone: 23,
  half_cone: 24,
} as const;

export type DucPointBinding = {
  elementId: DucBindableElement["id"];

  /** 
   * Determines where along the edge of the bound element the arrow endpoint should attach.
   * This value ranges from -1 to 1:
   * - -1 → Attaches to the far left (for horizontal edges) or top (for vertical edges).
   * -  0 → Attaches to the exact center of the edge.
   * -  1 → Attaches to the far right (for horizontal edges) or bottom (for vertical edges).
   * 
   * Focus ensures that the arrow dynamically adjusts as the bound element moves, resizes, or rotates.
  */
  focus: number;

  /** 
   * The gap distance between the bound element and the binding element.
   */
  gap: PrecisionValue;

  /** 
   * Represents a fixed point inside the bound element, defined as a normalized coordinate.
   * This value is an array [x, y], where:
   * - x (0.0 - 1.0) → The horizontal position inside the element (0 = left, 1 = right).
   * - y (0.0 - 1.0) → The vertical position inside the element (0 = top, 1 = bottom).
   * Unlike focus, fixedPoint ensures that the arrow stays pinned to a precise location
   * inside the element, regardless of resizing or movement.
   * 
   * - If fixedPoint is null, focus is used instead, meaning the arrow will attach dynamically to the edge.
   * - If fixedPoint is set, it overrides focus, keeping the arrow attached to the exact specified point inside the element.
   */
  fixedPoint: FixedPoint | null;

  /**
   * Represents a point within a DucLinearElement.
   *
   * The `offset` ranges from -1 to 1:
   * - `0` corresponds to the actual point.
   * - `-1` and `1` represent the percentage of the distance between the point at `index` and the previous or next point in the points array, respectively.
   *
   * @property {number} index - The index of the target point within the element.
   * @property {number} offset - The offset from the point.
   */
  point: {
    index: number;
    offset: number;
  } | null;

  /** 
   * The head of the line 
   * Reference: https://www.figma.com/design/5rYcUlscflBabQ9di2iFJ5/duc-Architecture?node-id=313-43&t=gNEFgevk9KZ3oAun-1
   */
  head: DucHead | null;
};

export type DucHead = {
  type: LineHead;
  blockId: string | null; // If the head is a block, this is the id of the block
  size: PrecisionValue;
}

export interface DucPointPosition {
  x: PrecisionValue;
  y: PrecisionValue;
}
export type BezierMirroring = ValueOf<typeof BEZIER_MIRRORING>;

export type DucPoint = DucPointPosition & {
  mirroring?: BezierMirroring; // Only meaningful if the point is referenced in exactly two lines
}
export type DucLine = [DucLineReference, DucLineReference];
export type DucLineReference = {
  index: number; // index of the point in the points array
  handle: DucPointPosition | null; // Bezier handle of the point on the line segment
}

export type DucPath = {
  lineIndices: readonly number[];
  // Override the background and stroke from the base in case is different than null
  background: ElementBackground | null;
  stroke: ElementStroke | null;
};

export type DucLinearElement = _DucElementBase &
  Readonly<{
    type: "line" | "arrow";
    points: readonly DucPoint[];
    lines: readonly DucLine[];
    pathOverrides: readonly DucPath[];
    lastCommittedPoint: DucPoint | null;
    startBinding: DucPointBinding | null;
    endBinding: DucPointBinding | null;
    /**
     * If true, the element's shape will wipe out the content below the element
     * @default false
     */
    wipeoutBelow: boolean;
  }>;