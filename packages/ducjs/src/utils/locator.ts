import * as paths from "../../dist/locator-runtime.js";
import type { ExternalFileLocator, ExternalFileLocatorKind } from "../types";

export type ExternalFileResolutionStatus =
  | "resolved"
  | "missing"
  | "inaccessible"
  | "unresolved";

export type ExternalFileResolutionResult = {
  status: ExternalFileResolutionStatus;
  resolvedPath?: string;
  error?: string;
  locator: ExternalFileLocator;
};

export type ResolveExternalFileOptions = {
  owningDucPath?: string;
  checkExists?: (resolvedPath: string) => boolean;
  checkReadable?: (resolvedPath: string) => boolean;
};

export type ResolveExternalFileAsyncOptions = {
  owningDucPath?: string;
  checkExists?: (resolvedPath: string) => Promise<boolean>;
  checkReadable?: (resolvedPath: string) => Promise<boolean>;
};

// Pure path rules run in the shared Rust module. Filesystem probes remain host callbacks.
export const normalizeHostPath = (path: string): string => paths.normalizeHostPath(path || "");
export const normalizePathSegments = (path: string): string => paths.normalizePathSegments(path);
export const getOwningDucDirectory = (path: string): string => paths.getOwningDucDirectory(path);

/**
 * Creates an ExternalFileLocator with explicit kind.
 */
export function createExternalFileLocator(
  kind: ExternalFileLocatorKind,
  path: string,
  originalPath?: string,
): ExternalFileLocator {
  const normalized = normalizeHostPath(path);
  return {
    kind,
    path: normalized,
    ...(originalPath !== undefined ? { originalPath } : path !== normalized ? { originalPath: path } : {}),
  };
}

/**
 * Resolves the target filesystem path for an ExternalFileLocator without performing I/O.
 */
export function resolveExternalFileLocatorPath(
  locator: ExternalFileLocator,
  owningDucPath?: string,
): { resolvedPath?: string; error?: string } {
  try {
    return { resolvedPath: paths.resolveLocatorPath(locator?.kind ?? "", locator?.path ?? "", owningDucPath) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Resolves an external file locator synchronously against the owning .duc path,
 * optionally verifying filesystem accessibility.
 * Preserves the original locator object intact regardless of whether resolution succeeds.
 */
export function resolveExternalFileLocator(
  locator: ExternalFileLocator,
  options?: ResolveExternalFileOptions,
): ExternalFileResolutionResult {
  const { resolvedPath, error } = resolveExternalFileLocatorPath(
    locator,
    options?.owningDucPath,
  );

  if (error || !resolvedPath) {
    return {
      status: "unresolved",
      error: error ?? "Unable to resolve locator path",
      locator,
    };
  }

  if (options?.checkExists && !options.checkExists(resolvedPath)) {
    return {
      status: "missing",
      resolvedPath,
      error: `External file not found at ${resolvedPath}`,
      locator,
    };
  }

  if (options?.checkReadable && !options.checkReadable(resolvedPath)) {
    return {
      status: "inaccessible",
      resolvedPath,
      error: `External file at ${resolvedPath} is not accessible`,
      locator,
    };
  }

  return {
    status: "resolved",
    resolvedPath,
    locator,
  };
}

/**
 * Resolves an external file locator asynchronously against the owning .duc path.
 * Preserves the original locator object intact regardless of resolution status.
 */
export async function resolveExternalFileLocatorAsync(
  locator: ExternalFileLocator,
  options?: ResolveExternalFileAsyncOptions,
): Promise<ExternalFileResolutionResult> {
  const { resolvedPath, error } = resolveExternalFileLocatorPath(
    locator,
    options?.owningDucPath,
  );

  if (error || !resolvedPath) {
    return {
      status: "unresolved",
      error: error ?? "Unable to resolve locator path",
      locator,
    };
  }

  if (options?.checkExists) {
    const exists = await options.checkExists(resolvedPath);
    if (!exists) {
      return {
        status: "missing",
        resolvedPath,
        error: `External file not found at ${resolvedPath}`,
        locator,
      };
    }
  }

  if (options?.checkReadable) {
    const readable = await options.checkReadable(resolvedPath);
    if (!readable) {
      return {
        status: "inaccessible",
        resolvedPath,
        error: `External file at ${resolvedPath} is not accessible`,
        locator,
      };
    }
  }

  return {
    status: "resolved",
    resolvedPath,
    locator,
  };
}
