import { ActiveTool, DucState, ToolType } from "ducjs/legacy/v1/types";

/**
 * supply `null` as message if non-never value is valid, you just need to
 * typecheck against it
 */
export const assertNever = (
  value: never,
  message: string | null,
  softAssert?: boolean,
): never => {
  if (!message) {
    return value;
  }
  if (softAssert) {
    console.error(message);
    return value;
  }

  throw new Error(message);
};

export const getUpdatedTimestamp = () => Date.now();



export const isFiniteNumber = (value: any): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

/**
 * Transforms array of objects containing `id` attribute,
 * or array of ids (strings), into a Map, keyd by `id`.
 */
export const arrayToMap = <T extends { id: string } | string>(
  items: readonly T[] | Map<string, T>,
) => {
  if (items instanceof Map) {
    return items;
  }
  return items.reduce((acc: Map<string, T>, element) => {
    acc.set(typeof element === "string" ? element : element.id, element);
    return acc;
  }, new Map());
};

export const updateActiveTool = (
  appState: Pick<DucState, "activeTool">,
  data: ((
    | {
        type: ToolType;
      }
    | { type: "custom"; customType: string }
  ) & { locked?: boolean; fromSelection?: boolean }) & {
    lastActiveToolBeforeEraser?: ActiveTool | null;
  },
): DucState["activeTool"] => {
  if (data.type === "custom") {
    return {
      ...appState.activeTool,
      type: "custom",
      customType: data.customType,
      locked: data.locked ?? appState.activeTool.locked,
    };
  }

  
  return {
    ...appState.activeTool,
    lastActiveTool:
      data.lastActiveToolBeforeEraser === undefined
        ? appState.activeTool.lastActiveTool
        : data.lastActiveToolBeforeEraser,
    type: data.type,
    customType: null,
    locked: data.locked ?? appState.activeTool.locked,
    fromSelection: data.fromSelection ?? false,
  };
};