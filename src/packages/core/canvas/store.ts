


export type StoreActionType = "capture" | "update" | "none";

export const StoreAction: {
  [K in Uppercase<StoreActionType>]: StoreActionType;
} = {
  CAPTURE: "capture",
  UPDATE: "update",
  NONE: "none",
} as const;
