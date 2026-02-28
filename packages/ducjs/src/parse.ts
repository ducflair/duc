import { restore, type ElementsConfig, type RestoreConfig, type RestoredDataState } from "./restore";
import { transformFromRust } from "./transform";
import type { DucExternalFiles, ExportedDataState } from "./types";
import { ensureWasm, wasmParseDuc, wasmParseDucLazy } from "./wasm";

export type { RestoredDataState };

export type LazyRestoredDataState = RestoredDataState & {
  lazyFileStore: LazyExternalFileStore;
};

// Re-export from lazy-files for backwards compatibility
import { LazyExternalFileStore } from "./lazy-files";
export { LazyExternalFileStore };

/**
 * Parse a `.duc` file (Blob/File) into a RestoredDataState.
 *
 * 1. Read file bytes
 * 2. WASM parse (SQLite → Rust → JS via serde-wasm-bindgen)
 * 3. Element fixups (stack element flattening)
 * 4. restore() for defaults & migrations
 */
export async function parseDuc(
  blob: Blob | File,
  _fileHandle?: FileSystemFileHandle | null,
  elementsConfig?: ElementsConfig,
  restoreConfig?: RestoreConfig,
): Promise<RestoredDataState> {
  await ensureWasm();

  const buffer = new Uint8Array(await blob.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new Error(`[parseDuc] buffer too small (${buffer.byteLength} bytes) — not a valid .duc file`);
  }

  const header = new TextDecoder().decode(buffer.slice(0, 15));

  let raw: ExportedDataState;
  try {
    raw = wasmParseDuc(buffer) as ExportedDataState;
  } catch (error) {
    const prefixHex = Array.from(buffer.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    throw new Error(
      `[parseDuc] wasm parse failed (size=${buffer.byteLength}, header="${header}", prefix=${prefixHex}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const data = transformFromRust(raw) as ExportedDataState;

  return restore(data, elementsConfig ?? { syncInvalidIndices: (els) => els as any }, restoreConfig);
}

/**
 * Parse a `.duc` file lazily — returns everything EXCEPT external file data blobs.
 * Use `LazyExternalFileStore` for on-demand file access.
 */
export async function parseDucLazy(
  buffer: Uint8Array,
  elementsConfig?: ElementsConfig,
  restoreConfig?: RestoreConfig,
): Promise<LazyRestoredDataState> {
  await ensureWasm();

  if (buffer.byteLength === 0) {
    throw new Error(`[parseDucLazy] buffer too small (${buffer.byteLength} bytes) — not a valid .duc file`);
  }

  const header = new TextDecoder().decode(buffer.slice(0, 15));

  let raw: ExportedDataState;
  try {
    raw = wasmParseDucLazy(buffer) as ExportedDataState;
  } catch (error) {
    const prefixHex = Array.from(buffer.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    throw new Error(
      `[parseDucLazy] wasm parse failed (size=${buffer.byteLength}, header="${header}", prefix=${prefixHex}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const data = transformFromRust(raw) as ExportedDataState;

  const lazyFileStore = new LazyExternalFileStore(buffer);
  const files: DucExternalFiles = {};

  const restored = restore(
    { ...data, files },
    elementsConfig ?? { syncInvalidIndices: (els) => els as any },
    restoreConfig,
  ) as LazyRestoredDataState;
  restored.lazyFileStore = lazyFileStore;

  return restored;
}
