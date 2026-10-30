import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import type { DucModelElement, DucExternalFiles } from "../types";

export type ModelCacheKind =
  | "dwg-dxf"
  | "parametric-json"
  | "ifc-json"
  | "python-ifc"
  | "python-dxf"
  | "model-artifact";

export interface ModelCacheKeyInput {
  kind: ModelCacheKind;
  sourceFileId: string;
  sourceRevisionId: string;
  variant?: string;
}

export interface ModelCacheEntry {
  key: string;
  kind: ModelCacheKind;
  sourceFileId: string;
  sourceRevisionId: string;
  mimeType: string;
  sizeBytes: number;
  data: Uint8Array;
  created: number;
  outputKind?: ModelCacheKind;
  modelType?: string;
}

const DEFAULT_MODEL_CACHE_MIME_TYPES: Record<ModelCacheKind, string> = {
  "dwg-dxf": "application/dxf",
  "parametric-json": "application/json",
  "ifc-json": "application/json",
  "python-ifc": "application/x-ifc",
  "python-dxf": "application/dxf",
  "model-artifact": "application/json",
};

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Manages in-memory and local disk caching of tessellated model geometry.
 * Matches Scopture's ModelElementCacheManager key scheme:
 * SHA-256(kind:sourceFileId:sourceRevisionId:variant)
 */
export class ModelElementCacheManager {
  private memoryCache = new Map<string, ModelCacheEntry>();
  private diskCacheDir: string;
  private useDiskCache: boolean;

  constructor(options: { diskCacheDir?: string; useDiskCache?: boolean } = {}) {
    this.useDiskCache = options.useDiskCache ?? true;
    this.diskCacheDir =
      options.diskCacheDir ??
      path.join(os.tmpdir(), "duc-model-cache");

    if (this.useDiskCache) {
      try {
        fs.mkdirSync(this.diskCacheDir, { recursive: true });
      } catch {
        // Best-effort cache directory creation
      }
    }
  }

  /**
   * Generates canonical deterministic cache key for a model source and revision.
   */
  public createKey(input: ModelCacheKeyInput): string {
    const variant = input.variant ?? "v1";
    return sha256Hex(
      `${input.kind}:${input.sourceFileId}:${input.sourceRevisionId}:${variant}`,
    );
  }

  /**
   * Retrieves cached model payload by key input.
   */
  public async get(input: ModelCacheKeyInput): Promise<ModelCacheEntry | null> {
    const key = this.createKey(input);

    // 1. Check in-memory cache
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      return memEntry;
    }

    // 2. Check disk cache
    if (this.useDiskCache) {
      try {
        const filePath = path.join(this.diskCacheDir, `${key}.bin`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath);
          const entry: ModelCacheEntry = {
            key,
            kind: input.kind,
            sourceFileId: input.sourceFileId,
            sourceRevisionId: input.sourceRevisionId,
            mimeType: DEFAULT_MODEL_CACHE_MIME_TYPES[input.kind],
            sizeBytes: data.byteLength,
            data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
            created: Date.now(),
          };
          const metadataPath = path.join(this.diskCacheDir, `${key}.json`);
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
            if (metadata.key === key && metadata.sizeBytes === data.byteLength) {
              entry.outputKind = metadata.outputKind;
              entry.modelType = metadata.modelType;
            }
          }
          this.memoryCache.set(key, entry);
          return entry;
        }
      } catch {
        // Disk read error fallback
      }
    }

    return null;
  }

  /**
   * Stores a model entry in memory and on disk.
   */
  public async save(
    input: ModelCacheKeyInput & { mimeType?: string; outputKind?: ModelCacheKind; modelType?: string },
    data: Uint8Array,
  ): Promise<ModelCacheEntry> {
    const key = this.createKey(input);
    const entry: ModelCacheEntry = {
      key,
      kind: input.kind,
      sourceFileId: input.sourceFileId,
      sourceRevisionId: input.sourceRevisionId,
      mimeType: input.mimeType ?? DEFAULT_MODEL_CACHE_MIME_TYPES[input.kind],
      sizeBytes: data.byteLength,
      data,
      created: Date.now(),
      outputKind: input.outputKind,
      modelType: input.modelType,
    };

    this.memoryCache.set(key, entry);

    if (this.useDiskCache) {
      try {
        const filePath = path.join(this.diskCacheDir, `${key}.bin`);
        fs.writeFileSync(filePath, data);
        const { data: _data, ...metadata } = entry;
        fs.writeFileSync(path.join(this.diskCacheDir, `${key}.json`), JSON.stringify(metadata));
      } catch {
        // Best-effort disk write
      }
    }

    return entry;
  }

  /**
   * Clears in-memory cache.
   */
  public clearMemory(): void {
    this.memoryCache.clear();
  }
}

export const createModelElementCacheInput = (element: DucModelElement, files?: DucExternalFiles): ModelCacheKeyInput => {
  const modelType = (element.modelType || "python").toLowerCase();
  const kind: ModelCacheKind = modelType === "ifc" ? "ifc-json" : modelType === "dxf" || modelType === "dwg" ? "python-dxf" : "parametric-json";
  const inputs = (element.fileIds || []).filter(id => !id.startsWith("model_output_") && !id.startsWith("model_preview_") && !id.startsWith("dwg_dxf_cache_") && !(modelType === "python" && id.startsWith("model_python_")))
    .sort().map(id => [id, files?.[id]?.activeRevisionId || ""]);
  return { kind, sourceFileId: `model:${element.id}`, sourceRevisionId: sha256Hex(JSON.stringify(inputs)), variant: `v2:${modelType}:${kind}:${sha256Hex(element.code || "")}` };
};

let sharedCacheManager: ModelElementCacheManager | null = null;

export function getSharedModelCacheManager(): ModelElementCacheManager {
  if (!sharedCacheManager) {
    sharedCacheManager = new ModelElementCacheManager();
  }
  return sharedCacheManager;
}
