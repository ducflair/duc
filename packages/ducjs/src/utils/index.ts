import { THEME } from "ducjs/duc";
import { Theme } from "ducjs/types/elements";

export * from "./elements";
export * from "./math";
export * from "./state";
export * from "./constants";
export * from "./shape";
export * from "./restore";
export * from "./bounds";
export * from "./normalize";
export * from "./url";
export * from "./version";

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


const RS_LTR_CHARS =
  "A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF" +
  "\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF";
const RS_RTL_CHARS = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
const RE_RTL_CHECK = new RegExp(`^[^${RS_LTR_CHARS}]*[${RS_RTL_CHARS}]`);
/**
 * Checks whether first directional character is RTL. Meaning whether it starts
 *  with RTL characters, or indeterminate (numbers etc.) characters followed by
 *  RTL.
 * See https://github.com/excalidraw/excalidraw/pull/1722#discussion_r436340171
 */
export const isRTL = (text: string) => RE_RTL_CHECK.test(text);


export const themeToString = (theme: Theme) => {
  return theme === THEME.DARK ? "dark" : "light";
};