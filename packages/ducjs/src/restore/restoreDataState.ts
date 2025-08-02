import {
  BEZIER_MIRRORING,
  BLENDING,
  BOOLEAN_OPERATION,
  ELEMENT_CONTENT_PREFERENCE,
  IMAGE_STATUS,
  LINE_HEAD,
  PRUNING_LEVEL,
  STROKE_CAP,
  STROKE_JOIN,
  STROKE_PLACEMENT,
  STROKE_PREFERENCE,
  STROKE_SIDE_PREFERENCE,
  TEXT_ALIGN,
  VERTICAL_ALIGN,
} from "ducjs/duc";
import { restoreElements } from "ducjs/restore/restoreElements";
import {
  isStandardIdPresent,
  restoreStandards,
} from "ducjs/restore/restoreStandards";
import { getPrecisionScope } from "ducjs/technical/measurements";
import {
  getPrecisionValueFromRaw,
  getPrecisionValueFromScoped,
  getScaledZoomValueForScope,
  getScopedZoomValue,
  NEUTRAL_SCOPE,
  ScaleFactors,
} from "ducjs/technical/scopes";
import { PREDEFINED_STANDARDS, Standard } from "ducjs/technical/standards";
import type {
  Checkpoint,
  Delta,
  Dictionary,
  DucExternalFiles,
  DucGlobalState,
  ImportedDataState,
  JSONPatch,
  LibraryItems,
  PrecisionValue,
  RawValue,
  Scope,
  ScopedValue,
  VersionGraph,
} from "ducjs/types";
import { DucLocalState } from "ducjs/types";
import type {
  _DucStackBase,
  BezierMirroring,
  DucBlock,
  DucElement,
  DucGroup,
  DucHead,
  DucLayer,
  DucRegion,
  DucBlockAttributeDefinition,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  FillStyle,
  ImageStatus,
  LineHead,
  OrderedDucElement,
  StrokeCap,
  StrokeJoin,
  StrokePreference,
  StrokeSidePreference,
  StrokeSides,
  StrokeStyle,
  TextAlign,
  VerticalAlign,
} from "ducjs/types/elements";
import { Percentage, Radian } from "ducjs/types/geometryTypes";
import type { ValueOf } from "ducjs/types/utility-types";
import {
  getDefaultGlobalState,
  getDefaultLocalState,
  getZoom,
  isFiniteNumber,
} from "ducjs/utils";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_POLYGON_SIDES,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  DEFAULT_ZOOM_STEP,
  MAX_ZOOM_STEP,
  MIN_ZOOM_STEP,
  VERSIONS,
} from "ducjs/utils/constants";
import { getDefaultStackProperties } from "ducjs/utils/elements";
import { getNormalizedZoom } from "ducjs/utils/normalize";
import tinycolor from "tinycolor2";

export type RestoredLocalState = Omit<
  DucLocalState,
  "offsetTop" | "offsetLeft" | "width" | "height"
>;

export type RestoredDataState = {
  thumbnail: Uint8Array | undefined;
  dictionary: Dictionary | undefined;

  elements: OrderedDucElement[];

  localState: RestoredLocalState;
  globalState: DucGlobalState;

  files: DucExternalFiles;

  blocks: DucBlock[];
  groups: DucGroup[];
  regions: DucRegion[];
  layers: DucLayer[];

  standards: Standard[];
  versionGraph: VersionGraph | undefined;
};

export interface ExportedLibraryData {
  type: string;
  version: typeof VERSIONS.excalidrawLibrary;
  source: string;
  libraryItems: LibraryItems;
}

export interface ImportedLibraryData extends Partial<ExportedLibraryData> {
  /** @deprecated v1 */
  library?: LibraryItems;
}

export type ElementsConfig = {
  syncInvalidIndices: (
    elements: readonly DucElement[],
    currentScope: Scope
  ) => OrderedDucElement[];
  refreshDimensions?: boolean;
  repairBindings?: boolean;
};

export const restore = (
  data: ImportedDataState | null,
  elementsConfig: ElementsConfig
): RestoredDataState => {
  const restoredStandards = restoreStandards(data?.standards);
  const restoredDictionary = restoreDictionary(data?.dictionary);
  const restoredGlobalState = restoreGlobalState(data?.ducGlobalState);
  const restoredLocalState = restoreLocalState(
    data?.ducLocalState,
    restoredGlobalState,
    restoredStandards
  );

  const restoredElementsConfig = {
    ...elementsConfig,
    localState: restoredLocalState,
  };

  const restoredBlocks = restoreBlocks(
    data?.blocks,
    restoredLocalState.scope,
    restoredElementsConfig
  );

  const restoredRegions = restoreRegions(data?.regions);
  const restoredGroups = restoreGroups(data?.groups);
  const restoredLayers = restoreLayers(data?.layers, restoredLocalState.scope);

  const restoredElements = restoreElements(
    data?.elements,
    restoredLocalState.scope,
    restoredBlocks,
    restoredElementsConfig
  );

  const restoredVersionGraph = restoreVersionGraph(data?.versionGraph);

  return {
    dictionary: restoredDictionary,
    thumbnail: data?.thumbnail,
    elements: restoredElements,
    blocks: restoredBlocks,
    groups: restoredGroups,
    regions: restoredRegions,
    layers: restoredLayers,

    standards: restoredStandards,
    versionGraph: restoredVersionGraph,

    localState: restoredLocalState,
    globalState: restoredGlobalState,
    files: data?.files || {},
  };
};

export const restoreDictionary = (importedDictionary: unknown): Dictionary => {
  if (!importedDictionary || typeof importedDictionary !== "object") {
    return {};
  }
  const restoredDictionary: Dictionary = {};
  const dict = importedDictionary as Record<string, unknown>;
  for (const key in dict) {
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      restoredDictionary[key] = typeof dict[key] === "string" ? dict[key] : String(dict[key]);
    }
  }
  return restoredDictionary;
};

/**
 * Restores the groups array from imported data, ensuring each item
 * conforms to the DucGroup type.
 *
 * This function iterates through the raw input, filters out any invalid entries,
 * and constructs a new array of clean, validated DucGroup objects.
 *
 * @param groups - The raw, untrusted array of group-like objects.
 * @returns A validated array of DucGroup objects, or an empty array if the input is invalid.
 */
export const restoreGroups = (
  groups: unknown,
): RestoredDataState["groups"] => {
  // 1. Guard against invalid input (e.g., null, undefined, not an array).
  if (!Array.isArray(groups)) {
    return [];
  }

  // 2. Filter for valid group candidates and map them to clean DucGroup objects.
  return groups
    .filter(
      (g) => {
        if (!g || typeof g !== "object") return false;
        const obj = g as Record<string, unknown>;
        return typeof obj.id === "string" && obj.type === "group";
      }
    )
    .map((g): DucGroup => {
      const obj = g as Record<string, unknown>;
      return {
        id: obj.id as string,
        ...restoreDucStackProperties(obj),
      };
    });
};

/**
 * Restores the layers array from imported data, ensuring each item
 * conforms to the DucLayer type.
 *
 * This function deeply validates each layer, including its nested 'overrides'
 * for default stroke and background styles. It provides safe defaults for any
 * missing or invalid properties.
 *
 * @param layers - The raw, untrusted array of layer-like objects.
 * @param currentScope - The current drawing scope, required for restoring
 *   scope-dependent properties like stroke width.
 * @returns A validated array of DucLayer objects, or an empty array if the input is invalid.
 */
export const restoreLayers = (
  layers: unknown,
  currentScope: Scope
): RestoredDataState["layers"] => {
  // 1. Guard against invalid input.
  if (!Array.isArray(layers)) {
    return [];
  }

  // 2. Filter for valid layer candidates and map them to clean DucLayer objects.
  return layers
    .filter(
      (l) => {
        if (!l || typeof l !== "object") return false;
        const obj = l as Record<string, unknown>;
        return typeof obj.id === "string" && obj.type === "layer";
      }
    )
    .map((l): DucLayer => {
      const obj = l as Record<string, unknown>;
      return {
        id: obj.id as string,
        ...restoreDucStackProperties(obj),
        readonly: isValidBoolean(obj.readonly, false),
        overrides: {
          stroke: validateStroke(
            obj.overrides && typeof obj.overrides === "object"
              ? (obj.overrides as Record<string, unknown>).stroke as ElementStroke | undefined
              : undefined,
            currentScope,
            currentScope
          ),
          background: validateBackground(
            obj.overrides && typeof obj.overrides === "object"
              ? (obj.overrides as Record<string, unknown>).background as ElementBackground | undefined
              : undefined
          ),
        },
      };
    });
};


/**
 * Restores the regions array, ensuring correct structure and types.
 */
export const restoreRegions = (regions: unknown): RestoredDataState["regions"] => {
  if (!Array.isArray(regions)) {
    return [];
  }

  return regions
    .filter(
      (r) => {
        if (!r || typeof r !== "object") return false;
        const obj = r as Record<string, unknown>;
        return typeof obj.id === "string" && obj.type === "region";
      }
    )
    .map((r) => {
      const obj = r as Record<string, unknown>;
      return {
        type: "region",
        id: obj.id as string,
        ...restoreDucStackProperties(obj),
        booleanOperation:
          Object.values(BOOLEAN_OPERATION).includes(obj.booleanOperation as BOOLEAN_OPERATION)
            ? (obj.booleanOperation as BOOLEAN_OPERATION)
            : BOOLEAN_OPERATION.UNION,
      };
    });
};

/**
 * Restores the blocks array using a two-pass approach to resolve circular dependencies.
 *
 * Pass 1: Creates a "shallow" version of each block with all top-level properties
 * but an empty `elements` array. This provides a complete reference list of all blocks.
 *
 * Pass 2: Iterates over the shallow blocks, calling `restoreElements` for each one,
 * providing the complete block list from Pass 1 as the necessary context.
 */
export const restoreBlocks = (
  blocks: unknown,
  currentScope: Scope,
  elementsConfig: ElementsConfig
): RestoredDataState["blocks"] => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  // --- PASS 1: SHALLOW RESTORATION ---
  // Create the basic structure of all blocks. This establishes their IDs and
  // top-level properties, creating the reference list that restoreElements needs.
  const partiallyRestoredBlocks: RestoredDataState["blocks"] = blocks
    .filter((b) => {
      if (!b || typeof b !== "object") return false;
      const obj = b as Record<string, unknown>;
      return typeof obj.id === "string";
    })
    .map((b) => {
      const obj = b as Record<string, unknown>;
      return {
        id: obj.id as string,
        label: typeof obj.label === "string" ? obj.label : "",
        description: typeof obj.description === "string" ? obj.description : undefined,
        version: typeof obj.version === "number" ? obj.version : 1,
        attributes: obj.attributes || undefined,
        attributeDefinitions:
          obj.attributeDefinitions && typeof obj.attributeDefinitions === "object"
            ? (obj.attributeDefinitions as Readonly<Record<string, DucBlockAttributeDefinition>>)
            : {},
        elements: [],
      };
    });

  // --- PASS 2: DEEP RESTORATION (Populating Elements) ---
  // Now, iterate through the original raw blocks again to get their element data.
  // For each one, we'll populate the corresponding shallow block from Pass 1.
  partiallyRestoredBlocks.forEach((restoredBlock) => {
    // Find the original raw block data corresponding to our shallow block.
    const originalBlockData = blocks.find((b) => b.id === restoredBlock.id);

    if (originalBlockData && originalBlockData.elements) {
      // Now, call restoreElements. It can be safely given the `partiallyRestoredBlocks`
      // array, because this array contains a complete (if shallow) representation of all blocks.
      const finalElements = restoreElements(
        originalBlockData.elements,
        currentScope,
        partiallyRestoredBlocks,
        elementsConfig
      );

      // Mutate the shallow block to add its fully restored elements.
      restoredBlock.elements = finalElements;
    }
  });

  // The `partiallyRestoredBlocks` array has now been fully populated and is the final result.
  return partiallyRestoredBlocks;
};

/**
 * Restores the global state of the document from imported data.
 * It validates and provides defaults for missing or invalid properties.
 *
 * @param importedState - The partially imported global state data.
 * @returns A complete and valid DucGlobalState object.
 */
export const restoreGlobalState = (
  importedState: Partial<DucGlobalState> = {}
): DucGlobalState => {
  // Assume you have a function that returns the default global state
  const defaults = getDefaultGlobalState();

  // The old 'coordDecimalPlaces' is mapped to the new 'displayPrecision.linear'.
  // We'll use the default for 'angular' as there's no corresponding old property.
  const linearPrecision = isValidFinitePositiveByteValue(
    (importedState as any).coordDecimalPlaces, // casting to any to check for the old property
    defaults.displayPrecision.linear
  );

  return {
    ...defaults, // Start with defaults to ensure all keys are present
    name: importedState.name ?? defaults.name,
    viewBackgroundColor:
      importedState.viewBackgroundColor ?? defaults.viewBackgroundColor,
    mainScope:
      isValidAppStateScopeValue(importedState.mainScope) ?? defaults.mainScope,
    scopeExponentThreshold: isValidAppStateScopeExponentThresholdValue(
      importedState.scopeExponentThreshold,
      defaults.scopeExponentThreshold
    ),
    // Properties from DucGlobalState that were not in the old function are set to default
    dashSpacingScale:
      importedState.dashSpacingScale ?? defaults.dashSpacingScale,
    isDashSpacingAffectedByViewportScale:
      importedState.isDashSpacingAffectedByViewportScale ??
      defaults.isDashSpacingAffectedByViewportScale,
    dimensionsAssociativeByDefault:
      importedState.dimensionsAssociativeByDefault ??
      defaults.dimensionsAssociativeByDefault,
    useAnnotativeScaling:
      importedState.useAnnotativeScaling ?? defaults.useAnnotativeScaling,
    displayPrecision: {
      linear: linearPrecision,
      angular:
        importedState.displayPrecision?.angular ??
        defaults.displayPrecision.angular,
    },
  };
};

/**
 * Restores the user's local session state from imported data.
 * It requires the already-restored global state to correctly calculate dependent values
 * like zoom and scope.
 *
 * @param importedState - The partially imported local state data.
 * @param restoredGlobalState - The complete and valid global state for the document.
 * @returns A complete and valid DucLocalState object.
 */
export const restoreLocalState = (
  importedState: Partial<DucLocalState> = {},
  restoredGlobalState: RestoredDataState["globalState"],
  restoredStandards: RestoredDataState["standards"]
): DucLocalState => {
  // Assume you have a function that returns the default local state
  const defaults = getDefaultLocalState();

  // The scope calculation now correctly depends on the GLOBAL state
  const zoom = getZoom(importedState.zoom?.value ?? defaults.zoom.value, restoredGlobalState.mainScope, restoredGlobalState.scopeExponentThreshold);
  const scope = isValidPrecisionScopeValue(
    zoom.value,
    restoredGlobalState.mainScope, // Use global state
    restoredGlobalState.scopeExponentThreshold // Use global state
  );

  return {
    ...defaults, // Start with defaults
    scope, // The newly calculated scope
    activeStandardId: isValidStandardId(
      importedState.activeStandardId,
      restoredStandards,
      defaults.activeStandardId
    ),
    isBindingEnabled: isValidBoolean(
      importedState.isBindingEnabled,
      defaults.isBindingEnabled
    ),
    penMode: isValidBoolean(importedState.penMode, defaults.penMode),
    scrollX: importedState.scrollX
      ? restorePrecisionValue(importedState.scrollX, NEUTRAL_SCOPE, scope)
      : getPrecisionValueFromRaw(defaults.scrollX.value, NEUTRAL_SCOPE, scope),
    scrollY: importedState.scrollY
      ? restorePrecisionValue(importedState.scrollY, NEUTRAL_SCOPE, scope)
      : getPrecisionValueFromRaw(defaults.scrollY.value, NEUTRAL_SCOPE, scope),
    zoom,
    activeGridSettings:
      importedState.activeGridSettings ?? defaults.activeGridSettings,
    activeSnapSettings:
      importedState.activeSnapSettings ?? defaults.activeSnapSettings,
    currentItemStroke:
      validateStroke(importedState.currentItemStroke, scope, scope) ??
      defaults.currentItemStroke,
    currentItemBackground:
      validateBackground(importedState.currentItemBackground) ??
      defaults.currentItemBackground,
    currentItemOpacity: isValidPercentageValue(
      importedState.currentItemOpacity,
      defaults.currentItemOpacity
    ),
    currentItemStartLineHead:
      isValidLineHeadValue(importedState.currentItemStartLineHead) ??
      defaults.currentItemStartLineHead,
    currentItemEndLineHead:
      isValidLineHeadValue(importedState.currentItemEndLineHead) ??
      defaults.currentItemEndLineHead,
    // Other local state props are set to their defaults
    currentItemFontFamily: defaults.currentItemFontFamily,
    currentItemFontSize: defaults.currentItemFontSize,
    currentItemTextAlign: defaults.currentItemTextAlign,
    currentItemRoundness: defaults.currentItemRoundness,
    viewModeEnabled: defaults.viewModeEnabled,
    objectsSnapModeEnabled: defaults.objectsSnapModeEnabled,
    gridModeEnabled: defaults.gridModeEnabled,
    outlineModeEnabled: defaults.outlineModeEnabled,
  };
};

export const restoreVersionGraph = (
  importedGraph: any
): RestoredDataState["versionGraph"] => {
  // 1. Basic validation: If the graph is not a valid object, we can't restore it.
  if (!importedGraph || typeof importedGraph !== "object") {
    return undefined;
  }

  // 2. Validate essential root properties. Without these, the graph is unusable.
  const userCheckpointVersionId = isValidString(
    importedGraph.userCheckpointVersionId
  );
  const latestVersionId = isValidString(importedGraph.latestVersionId);

  if (!userCheckpointVersionId || !latestVersionId) {
    return undefined;
  }

  // 3. Restore checkpoints array
  const checkpoints: Checkpoint[] = [];
  if (Array.isArray(importedGraph.checkpoints)) {
    for (const c of importedGraph.checkpoints) {
      if (!c || typeof c !== "object" || c.type !== "checkpoint") {
        continue;
      }

      const id = isValidString(c.id);
      if (!id) {
        continue;
      }

      // Restore VersionBase properties
      const parentId = typeof c.parentId === "string" ? c.parentId : null;
      const timestamp = isFiniteNumber(c.timestamp) ? c.timestamp : 0;
      const isManualSave = isValidBoolean(c.isManualSave, false);

      // Restore checkpoint-specific properties
      const sizeBytes =
        isFiniteNumber(c.sizeBytes) && c.sizeBytes >= 0 ? c.sizeBytes : 0;

      // Handle Uint8Array, which might be serialized from JSON
      let data: Uint8Array;
      if (c.data instanceof Uint8Array) {
        data = c.data;
      } else if (Array.isArray(c.data)) {
        data = new Uint8Array(c.data);
      } else if (c.data && typeof c.data === "object") {
        // Handle POJO that looks like an array, e.g., { "0": 1, "1": 2, ... }
        data = new Uint8Array(Object.values(c.data));
      } else {
        continue; // Skip if data format is unrecognized
      }

      checkpoints.push({
        type: "checkpoint",
        id,
        parentId,
        timestamp,
        isManualSave,
        sizeBytes,
        data,
        description: isValidString(c.description) || undefined,
        userId: isValidString(c.userId) || undefined,
      });
    }
  }

  // 4. Restore deltas array
  const deltas: Delta[] = [];
  if (Array.isArray(importedGraph.deltas)) {
    for (const d of importedGraph.deltas) {
      if (!d || typeof d !== "object" || d.type !== "delta") {
        continue;
      }

      const id = isValidString(d.id);
      if (!id) {
        continue;
      }

      // Restore VersionBase properties
      const parentId = typeof d.parentId === "string" ? d.parentId : null;
      const timestamp = isFiniteNumber(d.timestamp) ? d.timestamp : 0;
      const isManualSave = isValidBoolean(d.isManualSave, false);

      // Validate JSONPatch structure
      if (!Array.isArray(d.patch)) {
        continue;
      }
      const patch: JSONPatch = [];
      let isPatchValid = true;
      for (const op of d.patch) {
        if (
          !op ||
          typeof op !== "object" ||
          !isValidString(op.op) ||
          !isValidString(op.path)
        ) {
          isPatchValid = false;
          break;
        }
        patch.push({ op: op.op, path: op.path, value: op.value });
      }
      if (!isPatchValid) {
        continue;
      }

      deltas.push({
        type: "delta",
        id,
        parentId,
        timestamp,
        isManualSave,
        patch,
        description: isValidString(d.description) || undefined,
        userId: isValidString(d.userId) || undefined,
      });
    }
  }

  // 5. Restore metadata, providing defaults for missing/invalid values
  const importedMetadata = importedGraph.metadata;
  const metadata: VersionGraph["metadata"] = {
    pruningLevel:
      importedMetadata?.pruningLevel &&
      Object.values(PRUNING_LEVEL).includes(importedMetadata.pruningLevel)
        ? importedMetadata.pruningLevel
        : PRUNING_LEVEL.BALANCED, // Default to BALANCED if invalid
    lastPruned: isFiniteNumber(importedMetadata?.lastPruned)
      ? importedMetadata.lastPruned
      : 0,
    totalSize:
      isFiniteNumber(importedMetadata?.totalSize) &&
      importedMetadata.totalSize >= 0
        ? importedMetadata.totalSize
        : 0,
  };

  // 6. Assemble and return the fully restored VersionGraph
  return {
    userCheckpointVersionId,
    latestVersionId,
    checkpoints,
    deltas,
    metadata,
  };
};

/**
 * Restores common properties for elements leveraging _DucStackBase.
 */
export const restoreDucStackProperties = (
  stack: any
): Omit<_DucStackBase, "id" | "type"> => {
  const defaultStackProperties = getDefaultStackProperties();
  return {
    label: typeof stack.label === "string" ? stack.label : "",
    description:
      typeof stack.description === "string" ? stack.description : null,
    isCollapsed: isValidBoolean(
      stack.isCollapsed,
      defaultStackProperties.isCollapsed
    ),
    locked: isValidBoolean(stack.locked, defaultStackProperties.locked),
    isVisible: isValidBoolean(
      stack.isVisible,
      defaultStackProperties.isVisible
    ),
    isPlot: isValidBoolean(stack.isPlot, defaultStackProperties.isPlot),
    opacity: isValidPercentageValue(
      stack.opacity,
      defaultStackProperties.opacity
    ),
    labelingColor: isValidColor(
      stack.labelingColor,
      defaultStackProperties.labelingColor
    ),
  };
};

export const isValidAppStateScopeValue = (value: string | undefined): Scope => {
  // Only check if the provided value is valid
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as Scope;
  }
  return NEUTRAL_SCOPE;
};

export const isValidAppStateScopeExponentThresholdValue = (
  value: number | undefined,
  defaultValue: number
): number => {
  const finite = isValidFinitePositiveByteValue(value, defaultValue);
  if (finite >= 1 && finite <= 36) {
    return finite;
  }
  return defaultValue;
};

export const isValidPrecisionScopeValue = (
  zoom: number,
  mainScope: Scope,
  scopeExponentThreshold: number
): Scope => {
  return getPrecisionScope(zoom, mainScope, scopeExponentThreshold);
};

/**
 * Converts a plain number or legacy value to a PrecisionValue object
 * @param value - The value to convert (can be a raw number or legacy value)
 * @param elementScope - The scope to use for the precision value
 * @returns A properly formatted PrecisionValue object
 */
export const restorePrecisionValue = (
  value: number | PrecisionValue | undefined,
  elementScope: Scope,
  currentScope: Scope,
  defaultValue?: number,
  fromScoped: boolean = false
): PrecisionValue => {
  const fallbackValue = getPrecisionValueFromRaw(
    (defaultValue ?? 0) as RawValue,
    currentScope,
    currentScope
  );

  if (value === undefined || value === null) {
    // Return default value with given scope
    return fallbackValue;
  }

  if (typeof value === "number") {
    // If value is a number, check if it's finite. Otherwise, use fallback.
    if (!Number.isFinite(value)) {
      return fallbackValue;
    }
    // Legacy value (finite number), convert to PrecisionValue
    return fromScoped
      ? getPrecisionValueFromScoped(
          value as ScopedValue,
          elementScope,
          currentScope
        )
      : getPrecisionValueFromRaw(value as RawValue, elementScope, currentScope);
  }

  return getPrecisionValueFromRaw(value.value, elementScope, currentScope);
};

export const isValidFillStyleValue = (
  value: FillStyle | undefined
): FillStyle => {
  if (
    value === undefined ||
    !Object.values(ELEMENT_CONTENT_PREFERENCE).includes(value)
  )
    return ELEMENT_CONTENT_PREFERENCE.SOLID;
  return value;
};

export const isValidStrokePreferenceValue = (
  value: StrokePreference | undefined
): StrokePreference => {
  if (value === undefined || !Object.values(STROKE_PREFERENCE).includes(value))
    return STROKE_PREFERENCE.SOLID;
  return value;
};

export const isValidVerticalAlignValue = (
  value: VerticalAlign | undefined
): VerticalAlign => {
  if (value === undefined || !Object.values(VERTICAL_ALIGN).includes(value))
    return DEFAULT_VERTICAL_ALIGN;
  return value;
};

export const isValidTextAlignValue = (
  value: TextAlign | undefined
): TextAlign => {
  if (value === undefined || !Object.values(TEXT_ALIGN).includes(value))
    return DEFAULT_TEXT_ALIGN;
  return value;
};

export const isValidScopeValue = (
  value: string | undefined,
  localState?: Readonly<Partial<DucLocalState>> | null,
  mainScope?: Scope
): Scope => {
  // First check if the provided value is valid
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as Scope;
  }

  // Then check localState.mainScope if available
  if (mainScope && Object.keys(ScaleFactors).includes(mainScope)) {
    return mainScope;
  }

  // Then check localState.scope if available
  if (
    localState?.scope &&
    Object.keys(ScaleFactors).includes(localState.scope)
  ) {
    return localState.scope;
  }

  // Finally, use the default scope as last resort
  return NEUTRAL_SCOPE;
};

export const isValidImageStatusValue = (
  value: ImageStatus | undefined
): ImageStatus => {
  if (value === undefined || !Object.values(IMAGE_STATUS).includes(value))
    return IMAGE_STATUS.PENDING;
  return value;
};

export const isValidDucHead = (
  value: DucHead | null | undefined,
  blocks: RestoredDataState["blocks"],
  elementScope: Scope,
  currentScope: Scope
): DucHead | null => {
  if (value === undefined || value === null) return null;

  const type = isValidLineHeadValue(value.type);
  const blockId = isValidBlockId(value.blockId, blocks);
  if (type === null || blockId === null) return null;
  return {
    type,
    blockId,
    size: restorePrecisionValue(value.size, elementScope, currentScope),
  };
};

export const isValidLineHeadValue = (
  value: LineHead | null | undefined
): LineHead | null => {
  if (
    value === undefined ||
    value === null ||
    !Object.values(LINE_HEAD).includes(value)
  )
    return null;
  return value;
};

export const isValidZoomStepValue = (value: number | undefined): number => {
  if (value === undefined || value < MIN_ZOOM_STEP || value > MAX_ZOOM_STEP)
    return DEFAULT_ZOOM_STEP;
  return value;
};

export const isValidImageScaleValue = (
  value: [number, number] | undefined
): [number, number] => {
  if (value === undefined || value[0] === 0 || value[1] === 0) return [1, 1];
  return value;
};

export const isValidBezierMirroringValue = (
  value: BezierMirroring | undefined
): BezierMirroring | undefined => {
  if (value === undefined || !Object.values(BEZIER_MIRRORING).includes(value))
    return undefined;
  return value;
};

export const isValidStrokeSidePreferenceValue = (
  value: StrokeSidePreference | undefined
): StrokeSidePreference => {
  if (
    value === undefined ||
    !Object.values(STROKE_SIDE_PREFERENCE).includes(value)
  )
    return STROKE_SIDE_PREFERENCE.TOP;
  return value;
};

export const isValidStrokeCapValue = (
  value: StrokeCap | undefined
): StrokeCap => {
  if (value === undefined || !Object.values(STROKE_CAP).includes(value))
    return STROKE_CAP.BUTT;
  return value;
};

export const isValidStrokeJoinValue = (
  value: StrokeJoin | undefined
): StrokeJoin => {
  if (value === undefined || !Object.values(STROKE_JOIN).includes(value))
    return STROKE_JOIN.MITER;
  return value;
};

export const isValidStrokeDashValue = (
  value: number[] | undefined
): number[] => {
  if (!value || !Array.isArray(value)) return [];
  return value;
};

export const isValidStrokeMiterLimitValue = (
  value: number | undefined
): number => {
  if (value === undefined || value < 0 || value > 100) return 4;
  return value;
};

export const isValidBlendingValue = (
  value: ValueOf<typeof BLENDING> | undefined
): ValueOf<typeof BLENDING> | undefined => {
  if (value === undefined || !Object.values(BLENDING).includes(value))
    return undefined;
  return value;
};

export const validateElementContent = ({
  content,
  defaultContent,
}: {
  content: Partial<ElementContentBase> | undefined;
  defaultContent: ElementContentBase;
}): ElementContentBase => {
  return {
    preference: isValidFillStyleValue(content?.preference),
    src: content?.src ?? defaultContent.src,
    visible: isValidBoolean(content?.visible, defaultContent.visible),
    opacity: isValidPercentageValue(content?.opacity, defaultContent.opacity),
    tiling: content?.tiling || defaultContent.tiling,
  };
};

export const validateStrokeStyle = (
  style: Partial<StrokeStyle> | undefined
): StrokeStyle => {
  if (!style) {
    return {
      preference: STROKE_PREFERENCE.SOLID,
      cap: STROKE_CAP.BUTT,
      join: STROKE_JOIN.MITER,
      dash: [],
      miterLimit: 4,
    };
  }
  return {
    preference: isValidStrokePreferenceValue(
      style.preference as StrokePreference
    ),
    cap: isValidStrokeCapValue(style.cap as StrokeCap),
    join: isValidStrokeJoinValue(style.join as StrokeJoin),
    dash: isValidStrokeDashValue(style.dash),
    miterLimit: isValidStrokeMiterLimitValue(style.miterLimit),
  };
};

const validateStrokeSides = (
  sides: StrokeSides | undefined
): StrokeSides | undefined => {
  if (!sides) return undefined;

  return {
    preference: isValidStrokeSidePreferenceValue(sides.preference),
    values: sides.values || undefined,
  };
};

export const validateStroke = (
  stroke: ElementStroke | undefined,
  elementScope: Scope,
  currentScope: Scope
): ElementStroke => {
  return {
    content: validateElementContent({
      content: stroke?.content,
      defaultContent: DEFAULT_ELEMENT_PROPS.stroke.content,
    }),
    placement: stroke?.placement ?? STROKE_PLACEMENT.CENTER,
    width: restorePrecisionValue(
      stroke?.width,
      elementScope,
      currentScope,
      DEFAULT_ELEMENT_PROPS.stroke.width.value
    ),
    style: validateStrokeStyle(stroke?.style),
    strokeSides: validateStrokeSides(stroke?.strokeSides),
  };
};

export const validateBackground = (
  bg: ElementBackground | undefined
): ElementBackground => {
  return {
    content: validateElementContent({
      content: bg?.content,
      defaultContent: DEFAULT_ELEMENT_PROPS.background.content,
    }),
  };
};

export const isValidFinitePositiveByteValue = (
  value: number | undefined,
  defaultValue: number
): number => {
  // Return default if value is undefined or not a finite number
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }

  // Round the value to the nearest integer
  const roundedValue = Math.round(value);

  // Clamp the rounded value to the byte range [0, 255]
  return Math.max(0, Math.min(255, roundedValue));
};

// Utility to validate polygon sides
export const isValidPolygonSides = (sides: any): number => {
  // Validate sides: integer >= 3
  if (sides >= 3) {
    if (Number.isInteger(sides)) {
      return sides;
    } else {
      return Math.round(sides);
    }
  }
  return DEFAULT_POLYGON_SIDES;
};

export const isValidRadianValue = (
  value: number | Radian | undefined,
  defaultValue: Radian
): Radian => {
  if (value === undefined || !Number.isFinite(value as number)) {
    return defaultValue;
  }
  if (value > Math.PI * 2 || value < -Math.PI * 2) {
    return defaultValue;
  }
  return value as Radian;
};

/**
 * Validates a Percentage value.
 * Returns a clamped value within the <0,1> range or a provided default.
 */
export const isValidPercentageValue = (
  value: number | Percentage | undefined,
  defaultValue: Percentage,
  allowNegative: boolean = false
): Percentage => {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }
  // If the value is between 1 and 100, assume it's a percentage that needs to be divided by 100
  if (value > 1 && value <= 100) {
    value /= 100;
  }
  return Math.max(
    allowNegative ? -1 : 0,
    Math.min(1, value as number)
  ) as Percentage;
};

export const isValidBoolean = (
  value: any,
  defaultValue: boolean = false
): boolean => {
  return typeof value === "boolean" ? value : defaultValue;
};

export const isValidColor = (
  value: any,
  defaultValue: string = "#000000"
): string => {
  const color = tinycolor(value);
  return color.isValid() ? color.toHexString() : defaultValue;
};

/**
 * Validates a string value.
 * Returns the string if valid, otherwise returns the provided defaultValue or an empty string.
 */
export const isValidString = (
  value: any,
  defaultValue: string = ""
): string => {
  if (typeof value !== "string") return defaultValue;
  if (value.trim().length === 0) return defaultValue;
  return value;
};

/**
 * Validates a Standard id.
 * Returns the id if valid and present in standards, otherwise returns the default DUC standard id.
 */
export const isValidStandardId = (
  id: any,
  standards: Standard[],
  defaultId: string = PREDEFINED_STANDARDS.DUC
): string => {
  const validId = isValidString(id);
  if (isStandardIdPresent(validId, standards)) return validId;
  return defaultId;
};

/**
 * Validates a block id.
 * Returns the id if present in restored blocks, otherwise returns null.
 */
export const isValidBlockId = (
  blockId: any,
  blocks: RestoredDataState["blocks"]
): string | null => {
  const validId = isValidString(blockId);
  if (blocks.some((b) => b.id === validId)) return validId;
  return null;
};

/**
 * A generic helper to validate an enum value from a lookup object.
 * @param value The value to check.
 * @param enumObject The object containing valid enum values (e.g., VIEWPORT_SHADE_PLOT).
 * @param defaultValue The value to return if the input is invalid.
 */
export const isValidEnumValue = <T>(
  value: any,
  enumObject: object,
  defaultValue: T
): T => {
  if (value !== undefined && Object.values(enumObject).includes(value)) {
    return value as T;
  }
  return defaultValue;
};
