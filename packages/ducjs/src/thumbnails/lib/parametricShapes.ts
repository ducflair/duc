import { applyDefaultModelColors } from "./defaultModelColor";
const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getSanitizedShapeToken = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

const sanitizeParametricShapeNode = (
  value: unknown,
  fallbackId: string,
  fallbackName: string,
): unknown | null => {
  if (Array.isArray(value)) {
    return {
      id: fallbackId,
      name: fallbackName,
      parts: value.map((part, index) => sanitizeParametricShapeNode(
        part,
        `${fallbackId}/part-${index + 1}`,
        `part-${index + 1}`,
      )).filter((part): part is Record<string, unknown> => part !== null),
    };
  }

  if (!isObjectRecord(value)) {
    return null;
  }

  const name = getSanitizedShapeToken(value.name, fallbackName);
  const id = getSanitizedShapeToken(value.id, fallbackId);
  const hasNestedParts = Array.isArray(value.parts) || isObjectRecord(value.parts);

  if (!hasNestedParts) {
    return {
      ...value,
      id,
      name,
    };
  }

  const rawParts = Array.isArray(value.parts)
    ? value.parts
    : isObjectRecord(value.parts)
      ? [value.parts]
      : [];
  const parts = rawParts.map((part, index) => sanitizeParametricShapeNode(
    part,
    `${id}/${getSanitizedShapeToken(isObjectRecord(part) ? part.name : null, `part-${index + 1}`)}`,
    `part-${index + 1}`,
  )).filter((part): part is Record<string, unknown> => part !== null);

  return {
    ...value,
    id,
    name,
    parts,
  };
};

const isInstancedFormat = (value: unknown): boolean => {
  if (!isObjectRecord(value)) return false;
  return Array.isArray(value.instances) && isObjectRecord(value.shapes);
};

const isWellFormedParametricNode = (value: unknown): boolean => {
  if (!isObjectRecord(value)) return false;
  if (typeof value.id !== "string" || !value.id) return false;
  if (typeof value.name !== "string" || !value.name) return false;
  if (Array.isArray(value.parts)) return true;
  if (isObjectRecord(value.shape)) return true;
  return false;
};

export const sanitizeParametricShapes = (value: unknown): unknown => {
  value = applyDefaultModelColors(value);
  if (isInstancedFormat(value)) {
    return value;
  }

  if (isWellFormedParametricNode(value)) {
    return value;
  }

  const sanitized = sanitizeParametricShapeNode(value, "model", "model") ?? {
    id: "model",
    name: "model",
    parts: [],
  };
  return sanitized;
};
