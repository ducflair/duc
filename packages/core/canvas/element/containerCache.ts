import type { DucTextContainer } from "./types";

export const originalContainerCache: {
  [id: DucTextContainer["id"]]:
    | {
        height: DucTextContainer["height"];
      }
    | undefined;
} = {};

export const updateOriginalContainerCache = (
  id: DucTextContainer["id"],
  height: DucTextContainer["height"],
) => {
  const data =
    originalContainerCache[id] || (originalContainerCache[id] = { height });
  data.height = height;
  return data;
};

export const resetOriginalContainerCache = (
  id: DucTextContainer["id"],
) => {
  if (originalContainerCache[id]) {
    delete originalContainerCache[id];
  }
};

export const getOriginalContainerHeightFromCache = (
  id: DucTextContainer["id"],
) => {
  return originalContainerCache[id]?.height ?? null;
};
