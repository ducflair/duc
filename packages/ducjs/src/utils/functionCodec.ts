// Utilities to encode functions as strings for safe structured cloning, and revive them later on main thread.

const FN_SENTINEL = "__DUCFN__:";

function b64EncodeUtf8(str: string): string {
  try {
    // Browser
    // eslint-disable-next-line no-undef
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    // Node
    return Buffer.from(str, "utf-8").toString("base64");
  }
}

function b64DecodeUtf8(b64: string): string {
  try {
    // Browser
    // eslint-disable-next-line no-undef
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    // Node
    return Buffer.from(b64, "base64").toString("utf-8");
  }
}

export function isEncodedFunctionString(val: unknown): val is string {
  return typeof val === "string" && val.startsWith(FN_SENTINEL);
}

export function encodeFunctionString(fn: Function): string {
  const code = fn.toString();
  return FN_SENTINEL + b64EncodeUtf8(code);
}

export function tryDecodeFunctionString(val: string): string | null {
  if (!isEncodedFunctionString(val)) return null;
  const b64 = val.slice(FN_SENTINEL.length);
  try {
    return b64DecodeUtf8(b64);
  } catch {
    return null;
  }
}

export function reviveEncodedFunction(val: unknown): unknown {
  if (!isEncodedFunctionString(val)) return val;
  const code = tryDecodeFunctionString(val);
  if (!code) return val;
  try {
    // Wrap in parentheses to handle arrow functions and function declarations uniformly
    // eslint-disable-next-line no-new-func
    const revived = new Function(`return (${code})`)();
    if (typeof revived === "function") return revived;
    return val;
  } catch {
    return val;
  }
}

export function reviveFunctionsDeep(obj: any, seen: WeakSet<object> = new WeakSet()): any {
  if (obj == null) return obj;
  if (typeof obj === "string") return reviveEncodedFunction(obj);
  if (typeof obj !== "object") return obj;

  if (seen.has(obj)) return obj;
  seen.add(obj);

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = reviveFunctionsDeep(obj[i], seen);
    }
    return obj;
  }

  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && isEncodedFunctionString(v)) {
      (obj as any)[k] = reviveEncodedFunction(v);
    } else {
      (obj as any)[k] = reviveFunctionsDeep(v, seen);
    }
  }
  return obj;
}
