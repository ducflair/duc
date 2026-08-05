import type { ElementsConfig, RestoreConfig, RestoredDataState } from "./restore";
import { restoreParsedData } from "./restore-parsed";
import type { ExportedDataState } from "./types";
import { ensureWasm, wasmParseDuc } from "./wasm";

export type { RestoredDataState };

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

  return restoreParsedData(raw, elementsConfig, restoreConfig);
}
