const maybeProcess = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

export const DUC_VERSION = maybeProcess.process?.env?.DUC_SCHEMA_VERSION ?? "0.0.0";
