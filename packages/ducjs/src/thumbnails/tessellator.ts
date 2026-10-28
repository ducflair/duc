import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "node:url";
import type { DucModelElement } from "../types/elements";
import type { DucExternalFiles, DucExternalFile, ExternalFilesData } from "../types";
import {
  getSharedModelCacheManager,
  createModelElementCacheInput,
  type ModelCacheKeyInput,
  type ModelCacheKind,
} from "./modelCache";

export interface TessellationResult {
  success: boolean;
  kind: ModelCacheKind;
  modelType: string;
  shapes?: unknown;
  dxf?: string;
  rawPayload: string;
  elementId?: string;
}

export interface TessellateOptions {
  ducPath?: string;
  files?: DucExternalFiles;
  filesData?: ExternalFilesData;
  ducpyDir?: string;
  timeoutMs?: number;
}

/**
 * Resolves the directory path of the ducpy Python package.
 */
function resolveDucpyDir(customDir?: string): string {
  if (customDir && fs.existsSync(customDir)) {
    return customDir;
  }

  const envDir = process.env.DUCPY_DIR;
  if (envDir && fs.existsSync(envDir)) {
    return envDir;
  }

  const baseDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(baseDir, "../../ducpy"),
    path.resolve(baseDir, "../../../ducpy"),
    path.resolve(process.cwd(), "packages/ducpy"),
    path.resolve(process.cwd(), "../ducpy"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "pyproject.toml"))) {
      return candidate;
    }
  }

  // Traverse parent directories to locate ducpy or packages/ducpy
  let curr = baseDir;
  while (curr && curr !== path.dirname(curr)) {
    const p1 = path.join(curr, "packages", "ducpy");
    if (fs.existsSync(path.join(p1, "pyproject.toml"))) return p1;
    const p2 = path.join(curr, "ducpy");
    if (fs.existsSync(path.join(p2, "pyproject.toml"))) return p2;
    curr = path.dirname(curr);
  }

  return candidates[0];
}

/**
 * Invokes the ducpy.tessellate CLI runner via uv in a child process.
 */
async function invokeDucpyTessellate(
  args: string[],
  ducpyDir: string,
  stdinData?: string,
  timeoutMs = 60000,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn("uv", ["run", "python", "-m", "ducpy.tessellate", ...args], {
      cwd: ducpyDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timer: NodeJS.Timeout | null = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`ducpy.tessellate timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 0 });
    });

    if (stdinData) {
      child.stdin.write(stdinData);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

/**
 * Tessellates a model element from a .duc file path.
 */
export async function tessellateDucFileElement(
  ducPath: string,
  elementId: string,
  options: TessellateOptions = {},
): Promise<TessellationResult> {
  const ducpyDir = resolveDucpyDir(options.ducpyDir);
  const cache = getSharedModelCacheManager();

  const ducStat = fs.statSync(ducPath);
  const mtimeStr = String(ducStat.mtimeMs);

  // Check cache before running Python sidecar
  for (const candidateKind of ["parametric-json", "ifc-json", "python-dxf", "model-artifact"] as const) {
    const candidateInput: ModelCacheKeyInput = {
      kind: candidateKind,
      sourceFileId: `duc:${path.basename(ducPath)}:${elementId}`,
      sourceRevisionId: mtimeStr,
      variant: candidateKind,
    };
    const cached = await cache.get(candidateInput);
    if (cached?.data?.byteLength) {
      const payloadRaw = Buffer.from(cached.data).toString("utf8");
      let shapes: unknown;
      let dxf: string | undefined;
      if (candidateKind === "parametric-json" || candidateKind === "ifc-json") {
        shapes = JSON.parse(payloadRaw);
      } else {
        dxf = payloadRaw;
      }
      return {
        success: true,
        kind: candidateKind,
        modelType: candidateKind === "ifc-json" ? "ifc" : candidateKind === "python-dxf" ? "dxf" : "step",
        shapes,
        dxf,
        rawPayload: payloadRaw,
        elementId,
      };
    }
  }

  // Create temporary output file to stream large payloads directly without CLI stdout limits
  const tempOutputFile = path.join(
    os.tmpdir(),
    `duc-tess-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );

  try {
    const { stdout, stderr, code } = await invokeDucpyTessellate(
      ["--duc", path.resolve(ducPath), `--element=${elementId}`, "--output", tempOutputFile],
      ducpyDir,
      undefined,
      options.timeoutMs ?? 120000,
    );

    if (code !== 0 || !fs.existsSync(tempOutputFile)) {
      throw new Error(
        `Failed to tessellate element '${elementId}' from '${ducPath}': ${stderr || stdout}`,
      );
    }

    const payloadRaw = fs.readFileSync(tempOutputFile, "utf8");
    const meta = JSON.parse(stdout.trim());
    const kind = meta.kind as ModelCacheKind;
    const modelType = meta.modelType || "python";

    let shapes: unknown;
    let dxf: string | undefined;

    if (kind === "parametric-json" || kind === "ifc-json") {
      shapes = JSON.parse(payloadRaw);
    } else if (kind === "python-dxf" || kind === "dwg-dxf") {
      dxf = payloadRaw;
    }

    // Cache the result
    const cacheInput: ModelCacheKeyInput = {
      kind,
      sourceFileId: `duc:${path.basename(ducPath)}:${elementId}`,
      sourceRevisionId: mtimeStr,
      variant: kind,
    };
    await cache.save(cacheInput, Buffer.from(payloadRaw, "utf8"));

    return {
      success: true,
      kind,
      modelType,
      shapes,
      dxf,
      rawPayload: payloadRaw,
      elementId,
    };
  } finally {
    try {
      if (fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Tessellates a standalone CAD or BIM file (.step, .stl, .ifc, .dxf).
 */
export async function tessellateCadFile(
  filePath: string,
  modelType?: string,
  options: TessellateOptions = {},
): Promise<TessellationResult> {
  const ducpyDir = resolveDucpyDir(options.ducpyDir);
  const cache = getSharedModelCacheManager();

  const tempOutputFile = path.join(
    os.tmpdir(),
    `duc-cad-tess-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );

  const args = ["--file", path.resolve(filePath), "--output", tempOutputFile];
  if (modelType) {
    args.push("--model-type", modelType);
  }

  try {
    const { stdout, stderr, code } = await invokeDucpyTessellate(
      args,
      ducpyDir,
      undefined,
      options.timeoutMs ?? 120000,
    );

    if (code !== 0 || !fs.existsSync(tempOutputFile)) {
      throw new Error(`Failed to tessellate file '${filePath}': ${stderr || stdout}`);
    }

    const payloadRaw = fs.readFileSync(tempOutputFile, "utf8");
    const meta = JSON.parse(stdout.trim());
    const kind = meta.kind as ModelCacheKind;

    let shapes: unknown;
    let dxf: string | undefined;

    if (kind === "parametric-json" || kind === "ifc-json") {
      shapes = JSON.parse(payloadRaw);
    } else if (kind === "python-dxf" || kind === "dwg-dxf") {
      dxf = payloadRaw;
    }

    const cacheInput: ModelCacheKeyInput = {
      kind,
      sourceFileId: path.basename(filePath),
      sourceRevisionId: String(fs.statSync(filePath).mtimeMs),
      variant: `${kind}`,
    };
    await cache.save(cacheInput, Buffer.from(payloadRaw, "utf8"));

    return {
      success: true,
      kind,
      modelType: meta.modelType || modelType || "step",
      shapes,
      dxf,
      rawPayload: payloadRaw,
    };
  } finally {
    try {
      if (fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Tessellates a DucModelElement into renderable shapes.
 * If the element is associated with a .duc file on disk, extracts and tessellates it via ducpy.
 * If external files data is provided in-memory, writes them to temporary paths and executes code.
 */
export async function tessellateModelElement(
  element: DucModelElement,
  options: TessellateOptions = {},
): Promise<TessellationResult> {
  const modelType = (element.modelType || "python").toLowerCase();
  const kind: ModelCacheKind =
    modelType === "ifc"
      ? "ifc-json"
      : modelType === "dxf" || modelType === "dwg"
        ? "python-dxf"
        : "parametric-json";

  const cache = getSharedModelCacheManager();
  const cacheInput = createModelElementCacheInput(element, options.files);

  const cached = await cache.get(cacheInput);
  if (cached?.data?.byteLength) {
    const rawPayload = Buffer.from(cached.data).toString("utf8");
    const cachedKind = cached.outputKind || kind;
    let shapes: unknown;
    let dxf: string | undefined;
    if (cachedKind === "parametric-json" || cachedKind === "ifc-json") {
      shapes = JSON.parse(rawPayload);
    } else if (cachedKind === "python-dxf" || cachedKind === "dwg-dxf") {
      dxf = rawPayload;
    }
    return {
      success: true,
      kind: cachedKind,
      modelType: cached.modelType || modelType,
      shapes,
      dxf,
      rawPayload,
      elementId: element.id,
    };
  }

  // If a .duc path is available, use fast native extraction
  if (options.ducPath && fs.existsSync(options.ducPath)) {
    return await tessellateDucFileElement(options.ducPath, element.id, options);
  }

  // Otherwise, handle in-memory external files and code
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "duc-elem-tess-"));
  const tempOutputFile = path.join(tempDir, "output.json");

  try {
    const externalFilesList: Array<{ id: string; localPath: string; name: string }> = [];

    if (element.fileIds && options.files && options.filesData) {
      for (const fid of element.fileIds.filter(id => !id.startsWith("model_output_") && !id.startsWith("model_preview_") && !id.startsWith("dwg_dxf_cache_") && !(modelType === "python" && id.startsWith("model_python_")))) {
        const fileEntry: DucExternalFile | undefined = options.files[fid];
        const revId = fileEntry?.activeRevisionId;
        if (revId && options.filesData[revId]) {
          const revMeta = fileEntry?.revisions?.[revId];
          const fileName = revMeta?.sourceName || `${fid}.bin`;
          const filePath = path.join(tempDir, fileName);
          fs.writeFileSync(filePath, options.filesData[revId]);
          externalFilesList.push({
            id: fid,
            localPath: filePath,
            name: fileName,
          });
        }
      }
    }

    const payloadJson = JSON.stringify({
      code: element.code || "",
      modelType,
      externalFiles: externalFilesList,
    });

    const ducpyDir = resolveDucpyDir(options.ducpyDir);
    const { stdout, stderr, code } = await invokeDucpyTessellate(
      ["--input-json", "-", "--output", tempOutputFile],
      ducpyDir,
      payloadJson,
      options.timeoutMs ?? 120000,
    );

    if (code !== 0 || !fs.existsSync(tempOutputFile)) {
      throw new Error(
        `Failed to tessellate element '${element.id}' via code: ${stderr || stdout}`,
      );
    }

    const rawPayload = fs.readFileSync(tempOutputFile, "utf8");
    const meta = JSON.parse(stdout.trim());
    const outputKind = (meta.kind || kind) as ModelCacheKind;
    let shapes: unknown;
    let dxf: string | undefined;

    if (outputKind === "parametric-json" || outputKind === "ifc-json") {
      shapes = JSON.parse(rawPayload);
    } else if (outputKind === "python-dxf" || outputKind === "dwg-dxf") {
      dxf = rawPayload;
    }

    await cache.save({ ...cacheInput, outputKind, modelType: meta.modelType || modelType }, Buffer.from(rawPayload, "utf8"));

    return {
      success: true,
      kind: outputKind,
      modelType: meta.modelType || modelType,
      shapes,
      dxf,
      rawPayload,
      elementId: element.id,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}
