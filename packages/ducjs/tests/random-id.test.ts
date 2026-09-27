import { describe, expect, test } from "bun:test";
import { randomId } from "../src/utils/math/random";

describe("randomId", () => {
  test("generates IDs of length 21", () => {
    for (let i = 0; i < 50; i++) {
      const id = randomId();
      expect(id).toHaveLength(21);
    }
  });

  test("generates IDs that start with an ASCII letter and contain only alphanumeric and underscores", () => {
    const pythonIdentifierRegex = /^[A-Za-z][A-Za-z0-9_]{20}$/;
    for (let i = 0; i < 100; i++) {
      const id = randomId();
      expect(pythonIdentifierRegex.test(id)).toBe(true);
      expect(id).not.toContain("-");
    }
  });
});
