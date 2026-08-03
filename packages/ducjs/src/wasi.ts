/**
 * Server-side WASI streaming helper.
 *
 * Uses the `ducjs_wasi.wasm` binary via Node.js `node:wasi` for streaming
 * .duc serialization. Unlike the browser WASM (limited by 32-bit address space),
 * WASI has direct file system access and can handle files of any size.
 *
 * The WASI binary reads a JSON manifest from stdin (or a file path as argv[2]),
 * streams files into a SQLite database, then gzip-compresses to produce a .duc file.
 */

import { WASI } from "node:wasi";
import { readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync, statSync, rmdirSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import type { ExportedDataState } from "./types";
import { prepareStateForSerialization } from "./serialize";

const _dirname = typeof import.meta !== "undefined"
  ? dirname(fileURLToPath(import.meta.url))
  : "";

const isBunRuntime = () => typeof process !== "undefined" && typeof process.versions?.bun === "string";

const getDefaultTempDir = () => isBunRuntime()
  ? join(process.cwd(), ".duc-wasi-tmp")
  : os.tmpdir();

const toBunWasiPath = (path: string) => isBunRuntime()
  ? relative(process.cwd(), path) || "."
  : path;

const isSuccessfulWasiExit = (error: unknown) => {
  const candidate = error as { code?: unknown; exitCode?: unknown; message?: unknown };
  return candidate?.code === 0
    || candidate?.exitCode === 0
    || candidate?.message === "Exited with status 0";
};

let wasiBinaryReady: Promise<Uint8Array> | null = null;

/**
 * Load the WASI binary from a local package/path or a remote URL.
 */
function loadWasiBinary(): Promise<Uint8Array> {
  if (wasiBinaryReady) return wasiBinaryReady;

  wasiBinaryReady = (async () => {
    const env = (globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }).process?.env;

    if (env?.DUCJS_WASI_PATH) {
      return readFileSync(env.DUCJS_WASI_PATH);
    }

    if (env?.DUCJS_WASI_URL) {
      const response = await fetch(env.DUCJS_WASI_URL);
      if (!response.ok) {
        throw new Error(`Failed to download ducjs WASI binary: ${response.status} ${response.statusText}`);
      }
      const binary = new Uint8Array(await response.arrayBuffer());
      if (binary.byteLength === 0) {
        throw new Error("Downloaded ducjs WASI binary is empty");
      }
      return binary;
    }

    const candidates = [
      resolve(_dirname, "..", "node_modules", "ducjs", "dist", "ducjs_wasi.wasm"),
      resolve(_dirname, "..", "ducjs", "dist", "ducjs_wasi.wasm"),
      resolve(_dirname, "ducjs_wasi.wasm"),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return readFileSync(candidate);
    }

    throw new Error(
      `ducjs WASI binary not found. Set DUCJS_WASI_PATH, set DUCJS_WASI_URL, or ensure ducjs/dist/ducjs_wasi.wasm exists. Tried: ${candidates.join(", ")}`,
    );
  })().catch((error) => {
    wasiBinaryReady = null;
    throw error;
  });

  return wasiBinaryReady;
}

export interface StreamFileEntry {
  fileId: string;
  revisionId: string;
  sourcePath: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Stream multiple files into a single .duc file using the WASI binary.
 *
 * @param entries - Files to stream (fileId, revisionId, local sourcePath, mimeType, sizeBytes)
 * @param outputPath - Where to write the resulting .duc file
 * @param tempDir - Directory for temporary files (defaults to os.tmpdir())
 * @returns The compressed .duc file size in bytes
 */
export async function streamToDucFile(
  entries: StreamFileEntry[],
  outputPath: string,
  tempDir?: string,
): Promise<number> {
  const tmpDir = tempDir ?? getDefaultTempDir();
  mkdirSync(tmpDir, { recursive: true });
  const manifestDir = mkdtempSync(join(tmpDir, "duc-wasi-"));

  // Write manifest
  const manifestPath = join(manifestDir, "manifest.jsonl");
  const manifestContent = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  writeFileSync(manifestPath, manifestContent);

  // Clean up old output
  if (existsSync(outputPath)) {
    unlinkSync(outputPath);
  }

  const outputDir = dirname(outputPath);

  try {
    await runWasi(["ducjs-wasi", isBunRuntime() ? toBunWasiPath(outputPath) : `/output/${outputPath.split("/").pop()!}`, isBunRuntime() ? toBunWasiPath(manifestPath) : "/tmp/manifest.jsonl"], {
      "/": "/",
      ".": process.cwd(),
      "/tmp": manifestDir,
      "/output": outputDir,
    });
  } catch (e: any) {
    if (!isSuccessfulWasiExit(e)) {
      // Clean up and rethrow
      try { unlinkSync(manifestPath); } catch {}
      try { unlinkSync(join(manifestDir, "manifest.jsonl")); } catch {}
      throw e;
    }
  }

  // Verify output
  if (!existsSync(outputPath)) {
    throw new Error(`WASI binary did not produce output file: ${outputPath}`);
  }

  const size = statSync(outputPath).size;

  // Clean up manifest
  try { unlinkSync(manifestPath); } catch {}
  try { rmdirSync(manifestDir); } catch {}

  return size;
}

const jsonReplacer = (key: string, value: unknown) => {
  if (value instanceof Uint8Array) {
    if (value.byteLength > 64 * 1024 * 1024) {
      throw new RangeError(
        `Binary field ${key || "<root>"} is too large for the WASI state JSON; external revisions must use filesData`,
      );
    }
    return Array.from(value);
  }
  return value;
};

const prepareStateForWasi = (state: Partial<ExportedDataState>) => {
  const prepared = prepareStateForSerialization({
    ...state,
    version: state.version ?? "0.0.0",
    source: state.source ?? "ducjs/wasi",
    filesData: undefined,
  }) as Record<string, unknown>;
  delete prepared.filesData;
  return prepared;
};

const writeExternalFileSidecars = (
  state: Partial<ExportedDataState>,
  manifestDir: string,
): string | undefined => {
  const filesData = state.filesData;
  if (!filesData || Object.keys(filesData).length === 0) return undefined;

  const revisions = new Map<string, {
    fileId: string;
    revisionId: string;
    mimeType: string;
    sizeBytes: number;
  }>();
  for (const file of Object.values(state.files ?? {})) {
    for (const revision of Object.values(file.revisions)) {
      revisions.set(revision.id, {
        fileId: file.id,
        revisionId: revision.id,
        mimeType: revision.mimeType,
        sizeBytes: revision.sizeBytes,
      });
    }
  }

  const entries: StreamFileEntry[] = [];
  let index = 0;
  for (const [revisionId, data] of Object.entries(filesData)) {
    const revision = revisions.get(revisionId);
    if (!revision) {
      throw new Error(`filesData contains unknown external revision ${revisionId}`);
    }
    if (!(data instanceof Uint8Array)) {
      throw new TypeError(`filesData revision ${revisionId} is not a Uint8Array`);
    }
    if (revision.sizeBytes > 0 && revision.sizeBytes !== data.byteLength) {
      throw new Error(
        `External revision ${revisionId} has ${data.byteLength} bytes, expected ${revision.sizeBytes}`,
      );
    }

    const filename = `external-${index}.bin`;
    const sourcePath = join(manifestDir, filename);
    writeFileSync(sourcePath, data);
    entries.push({
      ...revision,
      sourcePath: isBunRuntime() ? toBunWasiPath(sourcePath) : `/tmp/${filename}`,
      sizeBytes: revision.sizeBytes || data.byteLength,
    });
    index += 1;
  }

  const manifestPath = join(manifestDir, "external-files.jsonl");
  writeFileSync(
    manifestPath,
    entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n",
  );
  return manifestPath;
};

const runWasi = async (args: string[], preopens: Record<string, string>) => {
  const wasmBinary = await loadWasiBinary();
  const wasi = new WASI({
    version: "preview1",
    args,
    env: {} as Record<string, string>,
    preopens,
  });
  const imports = typeof (wasi as { getImportObject?: () => WebAssembly.Imports }).getImportObject === "function"
    ? (wasi as { getImportObject: () => WebAssembly.Imports }).getImportObject()
    : { wasi_snapshot_preview1: (wasi as unknown as { wasiImport: WebAssembly.ModuleImports }).wasiImport };
  const module = await WebAssembly.compile(wasmBinary);
  const instance = await WebAssembly.instantiate(module, imports as WebAssembly.Imports);

  try {
    wasi.start(instance);
  } catch (e: any) {
    if (!isSuccessfulWasiExit(e)) {
      throw e;
    }
  }
};

export async function serializeStateToDucFile(
  state: Partial<ExportedDataState>,
  outputPath: string,
  tempDir?: string,
): Promise<number> {
  const tmpDir = tempDir ?? getDefaultTempDir();
  mkdirSync(tmpDir, { recursive: true });
  const manifestDir = mkdtempSync(join(tmpDir, "duc-wasi-state-"));

  const statePath = join(manifestDir, "state.json");

  try {
    writeFileSync(statePath, JSON.stringify(prepareStateForWasi(state), jsonReplacer));
    const externalManifestPath = writeExternalFileSidecars(state, manifestDir);

    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }

    await runWasi(
      [
        "ducjs-wasi",
        "--state-json",
        isBunRuntime() ? toBunWasiPath(statePath) : "/tmp/state.json",
        isBunRuntime() ? toBunWasiPath(outputPath) : `/output/${outputPath.split("/").pop()!}`,
        ...(externalManifestPath
          ? [isBunRuntime() ? toBunWasiPath(externalManifestPath) : "/tmp/external-files.jsonl"]
          : []),
      ],
      {
        "/": "/",
        ".": process.cwd(),
        "/tmp": manifestDir,
        "/output": dirname(outputPath),
      },
    );

    if (!existsSync(outputPath)) {
      throw new Error(`WASI binary did not produce output file: ${outputPath}`);
    }

    return statSync(outputPath).size;
  } finally {
    try { rmSync(manifestDir, { recursive: true, force: true }); } catch {}
  }
}

export async function serializeStateToDucBytes(
  state: Partial<ExportedDataState>,
  tempDir?: string,
): Promise<Uint8Array> {
  const tmpDir = tempDir ?? getDefaultTempDir();
  mkdirSync(tmpDir, { recursive: true });
  const outputDir = mkdtempSync(join(tmpDir, "duc-wasi-output-"));
  const outputPath = join(outputDir, "state.duc");

  try {
    await serializeStateToDucFile(state, outputPath, tmpDir);
    return new Uint8Array(readFileSync(outputPath));
  } finally {
    try { unlinkSync(outputPath); } catch {}
    try { rmdirSync(outputDir); } catch {}
  }
}
