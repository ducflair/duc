import init, {
    getCurrentSchemaVersion as _getCurrentSchemaVersion,
    getExternalFile as _getExternalFile,
    listExternalFiles as _listExternalFiles,
    listVersions as _listVersions,
    parseDuc as _parseDuc,
    parseDucLazy as _parseDucLazy,
    readVersionGraph as _readVersionGraph,
    restoreCheckpoint as _restoreCheckpoint,
    restoreVersion as _restoreVersion,
    revertToVersion as _revertToVersion,
    serializeDuc as _serializeDuc,
} from "../dist/ducjs_wasm";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureWasm(wasmUrl?: string | URL | BufferSource): Promise<void> {
  if (initialized) return;
  if (!initPromise) {
    const arg = wasmUrl !== undefined ? { module_or_path: wasmUrl } : undefined;
    initPromise = init(arg).then(() => {
      initialized = true;
    });
  }
  return initPromise;
}

/**
 * Fetch the raw WASM binary as an ArrayBuffer.
 * Must be called from the main thread (where the bundler resolves `import.meta.url`).
 * Useful for transferring the binary to a web worker that needs to init WASM
 * without being able to resolve the file URL itself.
 */
export async function getWasmBinary(): Promise<ArrayBuffer> {
  const url = new URL('../dist/ducjs_wasm_bg.wasm', import.meta.url);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch WASM binary: ${resp.status} ${resp.statusText}`);
  }
  return resp.arrayBuffer();
}

export const wasmParseDuc = _parseDuc;
export const wasmParseDucLazy = _parseDucLazy;
export const wasmSerializeDuc = _serializeDuc;
export const wasmGetExternalFile = _getExternalFile;
export const wasmListExternalFiles = _listExternalFiles;

export const wasmRestoreVersion = _restoreVersion;
export const wasmRestoreCheckpoint = _restoreCheckpoint;
export const wasmListVersions = _listVersions;
export const wasmReadVersionGraph = _readVersionGraph;
export const wasmRevertToVersion = _revertToVersion;
export const wasmGetCurrentSchemaVersion = _getCurrentSchemaVersion;
