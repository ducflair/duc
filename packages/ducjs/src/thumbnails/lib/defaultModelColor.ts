export const DEFAULT_MODEL_COLOR = "#2650fe";

/** Fill missing surface colors without changing authored colors or geometry buffers. */
export const applyDefaultModelColors = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const next = value.map(applyDefaultModelColors);
    return next.some((part, index) => part !== value[index]) ? next : value;
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  let result = record;
  for (const key of ["parts", "shapes"]) {
    if (!record[key]) continue;
    const next = applyDefaultModelColors(record[key]);
    if (next !== record[key]) result = { ...result, [key]: next };
  }
  if ("shape" in record && record.color == null) result = { ...result, color: DEFAULT_MODEL_COLOR };
  return result;
};
