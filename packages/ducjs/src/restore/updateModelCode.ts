const PYTHON_IDENTIFIER_PATTERN = /^[A-Za-z_]\w*$/u;

export const getEncodedPythonModelModuleName = (elementId: string): string => {
  const encodedId = Array.from(new TextEncoder().encode(elementId))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `element_${encodedId || "00"}`;
};

export const getPythonModelModuleName = (elementId: string): string => (
  PYTHON_IDENTIFIER_PATTERN.test(elementId)
    ? elementId
    : getEncodedPythonModelModuleName(elementId)
);

const escapeRegex = (value: string): string => (
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);

/**
 * Updates Python code referencing model element IDs when IDs are restored or duplicated.
 * Replaces references in:
 * - `from duc_model.<id_or_module> import ...`
 * - `import duc_model.<id_or_module>`
 * - `duc_model.<id_or_module>`
 * - `from duc_model import <id_or_module>`
 */
export const updateModelCodeElementIds = (
  code: string,
  idMap: Map<string, string> | Record<string, string>,
): string => {
  if (!code || typeof code !== "string") {
    return code;
  }

  const entries: Array<{ targets: string[]; replacement: string }> = [];
  const entriesIterable = idMap instanceof Map ? idMap.entries() : Object.entries(idMap);

  for (const [oldId, newId] of entriesIterable) {
    if (!oldId || !newId || oldId === newId) {
      continue;
    }

    const oldModuleName = getPythonModelModuleName(oldId);
    const newModuleName = getPythonModelModuleName(newId);
    const oldEncoded = getEncodedPythonModelModuleName(oldId);

    const targets = new Set<string>();
    targets.add(oldId);
    targets.add(oldModuleName);
    targets.add(oldEncoded);

    entries.push({
      targets: Array.from(targets).sort((a, b) => b.length - a.length),
      replacement: newModuleName,
    });
  }

  if (entries.length === 0) {
    return code;
  }

  let updatedCode = code;

  for (const { targets, replacement } of entries) {
    for (const target of targets) {
      const escaped = escapeRegex(target);
      const boundary = /^\w+$/.test(target) ? "\\b" : "(?=[^A-Za-z0-9_-]|$)";

      // 1. Replace `duc_model.<target>`
      const ducModelRegex = new RegExp(`(duc_model\\.)(?:${escaped})${boundary}`, "g");
      updatedCode = updatedCode.replace(ducModelRegex, `$1${replacement}`);

      // 2. Replace `from duc_model import ...` items
      const fromImportRegex = /(from\s+duc_model\s+import\s+)([^#\n\r]+)/g;
      updatedCode = updatedCode.replace(fromImportRegex, (_full, prefix, importedList) => {
        const itemRegex = new RegExp(`(^|[,\\s])${escaped}(\\b|(?=[\\s,]|$))`, "g");
        const replacedList = (importedList as string).replace(itemRegex, `$1${replacement}$2`);
        return `${prefix}${replacedList}`;
      });
    }
  }

  return updatedCode;
};
