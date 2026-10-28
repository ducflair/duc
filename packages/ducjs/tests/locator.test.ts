import { describe, expect, it } from "bun:test";
import {
  createExternalFileLocator,
  getOwningDucDirectory,
  normalizeHostPath,
  normalizePathSegments,
  resolveExternalFileLocator,
  resolveExternalFileLocatorAsync,
  resolveExternalFileLocatorPath,
} from "../src/utils/locator";
import type { ExternalFileLocator } from "../src/types";

describe("ExternalFileLocator semantics in ducjs", () => {
  describe("normalizeHostPath", () => {
    it("handles POSIX file:// URIs", () => {
      expect(normalizeHostPath("file:///Users/jane/models/part.step")).toBe(
        "/Users/jane/models/part.step",
      );
      expect(normalizeHostPath("file://localhost/Users/jane/part.step")).toBe(
        "/Users/jane/part.step",
      );
    });

    it("handles Windows file:// URIs and drive letters", () => {
      expect(normalizeHostPath("file:///C:/Users/jane/models/part.step")).toBe(
        "C:/Users/jane/models/part.step",
      );
      expect(normalizeHostPath("file://C:/Users/jane/models/part.step")).toBe(
        "C:/Users/jane/models/part.step",
      );
      expect(normalizeHostPath("C:\\Users\\jane\\models\\part.step")).toBe(
        "C:/Users/jane/models/part.step",
      );
    });

    it("handles URL percent-encoded spaces and characters", () => {
      expect(
        normalizeHostPath("file:///Users/jane/My%20Documents/cad%20file.step"),
      ).toBe("/Users/jane/My Documents/cad file.step");
    });
  });

  describe("getOwningDucDirectory", () => {
    it("extracts directory from standard POSIX path", () => {
      expect(getOwningDucDirectory("/home/user/drawings/assembly.duc")).toBe(
        "/home/user/drawings",
      );
    });

    it("extracts directory from Windows path", () => {
      expect(getOwningDucDirectory("C:/CAD/Projects/main.duc")).toBe(
        "C:/CAD/Projects",
      );
    });

    it("extracts directory from file:// URI", () => {
      expect(
        getOwningDucDirectory("file:///Users/jane/projects/design.duc"),
      ).toBe("/Users/jane/projects");
    });
  });

  describe("normalizePathSegments", () => {
    it("normalizes dot and double-dot segments", () => {
      expect(
        normalizePathSegments("/home/user/drawings/../shared/part.step"),
      ).toBe("/home/user/shared/part.step");
      expect(
        normalizePathSegments("/home/user/drawings/./parts/part.step"),
      ).toBe("/home/user/drawings/parts/part.step");
    });
  });

  describe("resolveExternalFileLocatorPath", () => {
    it("resolves relative locators against owning .duc path", () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "cad/bracket.step",
      };
      const res = resolveExternalFileLocatorPath(
        locator,
        "/Users/jane/drawings/robot.duc",
      );
      expect(res.resolvedPath).toBe("/Users/jane/drawings/cad/bracket.step");
      expect(res.error).toBeUndefined();
    });

    it("resolves relative locators with parent traversal", () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "../shared/bearing.step",
      };
      const res = resolveExternalFileLocatorPath(
        locator,
        "/Users/jane/drawings/sub/robot.duc",
      );
      expect(res.resolvedPath).toBe("/Users/jane/drawings/shared/bearing.step");
    });

    it("fails with clear error if relative locator is missing owningDucPath", () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "bracket.step",
      };
      const res = resolveExternalFileLocatorPath(locator);
      expect(res.resolvedPath).toBeUndefined();
      expect(res.error).toContain("Owning .duc file location is required");
    });

    it("resolves absolute locators directly without requiring owningDucPath", () => {
      const locator: ExternalFileLocator = {
        kind: "absolute",
        path: "/opt/cad/parts/shaft.step",
      };
      const res = resolveExternalFileLocatorPath(locator);
      expect(res.resolvedPath).toBe("/opt/cad/parts/shaft.step");
    });

    it("resolves absolute file:// locators directly", () => {
      const locator: ExternalFileLocator = {
        kind: "absolute",
        path: "file:///var/cad/engine.step",
      };
      const res = resolveExternalFileLocatorPath(locator);
      expect(res.resolvedPath).toBe("/var/cad/engine.step");
    });
  });

  describe("resolveExternalFileLocator status behavior", () => {
    it("returns resolved status when file exists and preserves locator", () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "bracket.step",
        originalPath: "./bracket.step",
      };
      const result = resolveExternalFileLocator(locator, {
        owningDucPath: "/Users/jane/doc.duc",
        checkExists: () => true,
      });

      expect(result.status).toBe("resolved");
      expect(result.resolvedPath).toBe("/Users/jane/bracket.step");
      expect(result.locator).toBe(locator);
      expect(result.locator.originalPath).toBe("./bracket.step");
    });

    it("returns missing status when file does not exist, preserving original locator", () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "missing.step",
      };
      const result = resolveExternalFileLocator(locator, {
        owningDucPath: "/Users/jane/doc.duc",
        checkExists: () => false,
      });

      expect(result.status).toBe("missing");
      expect(result.resolvedPath).toBe("/Users/jane/missing.step");
      expect(result.error).toContain("External file not found");
      expect(result.locator).toBe(locator);
      expect(result.locator.kind).toBe("relative");
      expect(result.locator.path).toBe("missing.step");
    });

    it("returns inaccessible status when file cannot be read, preserving locator", () => {
      const locator: ExternalFileLocator = {
        kind: "absolute",
        path: "/root/secret.step",
      };
      const result = resolveExternalFileLocator(locator, {
        checkExists: () => true,
        checkReadable: () => false,
      });

      expect(result.status).toBe("inaccessible");
      expect(result.resolvedPath).toBe("/root/secret.step");
      expect(result.error).toContain("is not accessible");
      expect(result.locator).toBe(locator);
    });

    it("returns unresolved status when relative locator cannot find owning duc path", () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "part.step",
      };
      const result = resolveExternalFileLocator(locator);

      expect(result.status).toBe("unresolved");
      expect(result.error).toContain("Owning .duc file location is required");
      expect(result.locator).toBe(locator);
    });
  });

  describe("resolveExternalFileLocatorAsync", () => {
    it("supports async file existence checks", async () => {
      const locator: ExternalFileLocator = {
        kind: "relative",
        path: "models/gear.step",
      };
      const result = await resolveExternalFileLocatorAsync(locator, {
        owningDucPath: "/data/project/design.duc",
        checkExists: async (p) => p === "/data/project/models/gear.step",
      });

      expect(result.status).toBe("resolved");
      expect(result.resolvedPath).toBe("/data/project/models/gear.step");
      expect(result.locator).toBe(locator);
    });
  });
});

describe("explicit locator boundaries", () => {
  it("preserves native percent signs and UNC roots", () => {
    expect(normalizeHostPath("/CAD/part%20.ifc")).toBe("/CAD/part%20.ifc");
    expect(resolveExternalFileLocatorPath({ kind: "absolute", path: "//server/share/a/../part.ifc" }).resolvedPath).toBe("//server/share/part.ifc");
  });
  it("rejects paths whose explicit kind does not match", () => {
    expect(resolveExternalFileLocatorPath({ kind: "absolute", path: "parts/a.ifc" }).error).toBeDefined();
    expect(resolveExternalFileLocatorPath({ kind: "relative", path: "/private/a.ifc" }, "/CAD/main.duc").error).toBeDefined();
  });
});
