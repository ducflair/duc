export const CLIPPING_AXES = ["x", "y", "z"] as const;

export type ClippingAxis = (typeof CLIPPING_AXES)[number];

type SingleAxisIntersectionClippingLike = {
  intersection: boolean;
} & Record<ClippingAxis, { enabled: boolean }>;

export const getActiveClippingAxes = <T extends SingleAxisIntersectionClippingLike>(
  clipping: T,
): ClippingAxis[] => CLIPPING_AXES.filter((axis) => clipping[axis].enabled);

export const shouldMirrorSingleAxisIntersection = <T extends SingleAxisIntersectionClippingLike>(
  clipping: T,
): boolean => clipping.intersection && getActiveClippingAxes(clipping).length === 1;
