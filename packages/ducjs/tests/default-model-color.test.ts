import { expect, test } from "bun:test";
import { applyDefaultModelColors } from "../src/thumbnails/lib/defaultModelColor";

test("missing CAD and IFC colors use blue while authored colors and shared buffers survive", () => {
  const geometry = { vertices: new Float32Array([0, 1, 2]) };
  const source = { instances: [{ vertices: geometry.vertices }], shapes: { parts: [{ shape: geometry }, { shape: geometry, color: "#ff0000" }] } };
  const result = applyDefaultModelColors(source) as typeof source;
  expect(result.shapes.parts[0].color).toBe("#2650fe");
  expect(result.shapes.parts[1].color).toBe("#ff0000");
  expect(result.shapes.parts[0].shape).toBe(geometry);
  expect(result.instances).toBe(source.instances);
  expect(source.shapes.parts[0].color).toBeUndefined();
  expect(applyDefaultModelColors(result)).toBe(result);
});
