import { expect, test } from "bun:test";
import { createModelElementCacheInput } from "../src/thumbnails/modelCache";
import type { DucModelElement, DucExternalFiles } from "../src/types";

test("model cache changes after code, parameters, or any input revision changes", () => {
  const element = { id: "m", modelType: "python", code: "size = 1", fileIds: ["a", "b"] } as unknown as DucModelElement;
  const files = { a: { activeRevisionId: "a1" }, b: { activeRevisionId: "b1" } } as unknown as DucExternalFiles;
  const original = createModelElementCacheInput(element, files);
  expect(createModelElementCacheInput({ ...element, code: "size = 2" }, files)).not.toEqual(original);
  expect(createModelElementCacheInput(element, { ...files, b: { ...files.b, activeRevisionId: "b2" } })).not.toEqual(original);
  expect(createModelElementCacheInput({ ...element, fileIds: [...element.fileIds, "model_output_m" as never, "model_preview_m" as never] }, files)).toEqual(original);
});
