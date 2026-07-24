import {
  restore,
  type ElementsConfig,
  type RestoreConfig,
  type RestoredDataState,
} from "./restore";
import { transformFromRust } from "./transform";
import type { ExportedDataState } from "./types";

/**
 * Normalize the Rust representation and apply the same restore semantics for
 * byte-buffer and OPFS-backed parsing.
 */
export function restoreParsedData(
  raw: ExportedDataState,
  elementsConfig?: ElementsConfig,
  restoreConfig?: RestoreConfig,
  overrides?: Partial<ExportedDataState>,
): RestoredDataState {
  const data = transformFromRust(raw) as ExportedDataState;
  const originalVersionGraph = data.versionGraph;
  const restored = restore(
    {
      ...data,
      ...overrides,
      // Rust already validated the graph. Avoid restore filtering entries.
      versionGraph: undefined,
    },
    elementsConfig ?? { syncInvalidIndices: (elements) => elements as any },
    restoreConfig,
  );

  if (originalVersionGraph) {
    restored.versionGraph = originalVersionGraph;
  }
  if (data.charter) {
    restored.charter = data.charter;
  }
  if (data.issues) {
    restored.issues = data.issues;
  }

  return restored;
}
