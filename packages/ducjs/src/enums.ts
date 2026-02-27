/**
 * Native enum definitions for DUC types.
 * Source of truth: duc.sql
 */

export enum VERTICAL_ALIGN {
  TOP = 10,
  MIDDLE = 11,
  BOTTOM = 12,
}

export enum TEXT_ALIGN {
  LEFT = 10,
  CENTER = 11,
  RIGHT = 12,
}

export enum LINE_SPACING_TYPE {
  AT_LEAST = 10,
  EXACTLY = 11,
  MULTIPLE = 12,
}

export enum STROKE_PLACEMENT {
  INSIDE = 10,
  CENTER = 11,
  OUTSIDE = 12,
}

export enum STROKE_PREFERENCE {
  SOLID = 10,
  DASHED = 11,
  DOTTED = 12,
  CUSTOM = 13,
}

export enum STROKE_SIDE_PREFERENCE {
  TOP = 10,
  BOTTOM = 11,
  LEFT = 12,
  RIGHT = 13,
  CUSTOM = 14,
  ALL = 15,
}

export enum STROKE_CAP {
  BUTT = 10,
  ROUND = 11,
  SQUARE = 12,
}

export enum STROKE_JOIN {
  MITER = 10,
  ROUND = 11,
  BEVEL = 12,
}

export enum LINE_HEAD {
  ARROW = 10,
  BAR = 11,
  CIRCLE = 12,
  CIRCLE_OUTLINED = 13,
  TRIANGLE = 14,
  TRIANGLE_OUTLINED = 15,
  DIAMOND = 16,
  DIAMOND_OUTLINED = 17,
  CROSS = 18,
  OPEN_ARROW = 19,
  REVERSED_ARROW = 20,
  REVERSED_TRIANGLE = 21,
  REVERSED_TRIANGLE_OUTLINED = 22,
  CONE = 23,
  HALF_CONE = 24,
}

export enum BEZIER_MIRRORING {
  NONE = 10,
  ANGLE = 11,
  ANGLE_LENGTH = 12,
}

export enum BLENDING {
  MULTIPLY = 11,
  SCREEN = 12,
  OVERLAY = 13,
  DARKEN = 14,
  LIGHTEN = 15,
  DIFFERENCE = 16,
  EXCLUSION = 17,
}

export enum ELEMENT_CONTENT_PREFERENCE {
  SOLID = 12,
  FILL = 14,
  FIT = 15,
  TILE = 16,
  STRETCH = 17,
  HATCH = 18,
}

export enum HATCH_STYLE {
  NORMAL = 10,
  OUTER = 11,
  IGNORE = 12,
}

export enum IMAGE_STATUS {
  PENDING = 10,
  SAVED = 11,
  ERROR = 12,
}

export enum PRUNING_LEVEL {
  CONSERVATIVE = 10,
  BALANCED = 20,
  AGGRESSIVE = 30,
}

export enum BOOLEAN_OPERATION {
  UNION = 10,
  SUBTRACT = 11,
  INTERSECT = 12,
  EXCLUDE = 13,
}

export enum YOUTUBE_STATES {
  /** The YouTube player is unstarted. */
  UNSTARTED = -1,
  /** The YouTube player has ended. */
  ENDED = 0,
  /** The YouTube player is currently playing. */
  PLAYING = 1,
  /** The YouTube player is paused. */
  PAUSED = 2,
  /** The YouTube player is buffering. */
  BUFFERING = 3,
  /** The YouTube player is cued. */
  CUED = 5
}

export enum HANDLE_TYPE {
  HANDLE_IN = 10,
  HANDLE_OUT = 11,
}

export enum UNIT_SYSTEM {
  METRIC = 10,
  IMPERIAL = 11,
}

export enum AXIS {
  X = 10,
  Y = 20,
  Z = 30,
}
