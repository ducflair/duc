import { describe, expect, it } from "bun:test";
import { updateModelCodeElementIds, getPythonModelModuleName } from "../src/restore/updateModelCode";

describe("updateModelCodeElementIds", () => {
  it("rewrites dotted duc_model imports with new IDs", () => {
    const code = `
from duc_model.bracket_old import make_bracket
import duc_model.bracket_old
part = duc_model.bracket_old.build()
`;
    const idMap = new Map([["bracket_old", "bracket_new"]]);
    const updated = updateModelCodeElementIds(code, idMap);

    expect(updated).toContain("from duc_model.bracket_new import make_bracket");
    expect(updated).toContain("import duc_model.bracket_new");
    expect(updated).toContain("part = duc_model.bracket_new.build()");
    expect(updated).not.toContain("bracket_old");
  });

  it("rewrites from duc_model import <id> statements", () => {
    const code = `
from duc_model import bracket_old, gear_old as g
`;
    const idMap = new Map([
      ["bracket_old", "bracket_new"],
      ["gear_old", "gear_new"],
    ]);
    const updated = updateModelCodeElementIds(code, idMap);

    expect(updated).toContain("from duc_model import bracket_new, gear_new as g");
  });

  it("rewrites encoded module names when IDs have hyphens", () => {
    const oldId = "part-1";
    const newId = "part-2";
    const oldModuleName = getPythonModelModuleName(oldId);
    const newModuleName = getPythonModelModuleName(newId);

    const code = `
from duc_model.${oldModuleName} import subassembly
obj = duc_model.${oldModuleName}.create()
`;
    const idMap = new Map([[oldId, newId]]);
    const updated = updateModelCodeElementIds(code, idMap);

    expect(updated).toContain(`from duc_model.${newModuleName} import subassembly`);
    expect(updated).toContain(`obj = duc_model.${newModuleName}.create()`);
  });

  it("ignores unrelated variables and names", () => {
    const code = `
bracket_old = 123
def bracket_old_func(): pass
from other_module.bracket_old import test
`;
    const idMap = new Map([["bracket_old", "bracket_new"]]);
    const updated = updateModelCodeElementIds(code, idMap);

    expect(updated).toBe(code);
  });
});
