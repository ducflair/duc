import init, {
    applyDeltaChangeset as _applyDeltaChangeset,
    createDeltaChangeset as _createDeltaChangeset,
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

const DEFAULT_WASM_URL = new URL("../dist/ducjs_wasm_bg.wasm", import.meta.url);

const isNodeRuntime = () =>
  typeof process !== "undefined" && typeof process.versions?.node === "string";

type NodeFsPromisesModule = {
  readFile(path: string | URL): Promise<Uint8Array>;
};

const loadNodeFsPromises = async (): Promise<NodeFsPromisesModule> => {
  const dynamicImport = new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<NodeFsPromisesModule>;
  return dynamicImport(["node", "fs/promises"].join(":"));
};

const resolveDefaultWasmInput = async (): Promise<URL | Uint8Array> => {
  if (!isNodeRuntime()) {
    return DEFAULT_WASM_URL;
  }

  const { readFile } = await loadNodeFsPromises();
  const bytes = await readFile(DEFAULT_WASM_URL);
  return new Uint8Array(bytes);
};

export async function ensureWasm(wasmUrl?: string | URL | BufferSource): Promise<void> {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      const moduleOrPath = wasmUrl ?? await resolveDefaultWasmInput();
      await init({ module_or_path: moduleOrPath });
      initialized = true;
    })();
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
  if (isNodeRuntime()) {
    const { readFile } = await loadNodeFsPromises();
    const bytes = await readFile(DEFAULT_WASM_URL);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }

  const resp = await fetch(DEFAULT_WASM_URL);
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

export const wasmCreateDeltaChangeset = _createDeltaChangeset;
export const wasmApplyDeltaChangeset = _applyDeltaChangeset;
