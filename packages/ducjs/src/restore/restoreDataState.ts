import { nanoid } from "nanoid";
import tinycolor from "tinycolor2";
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
} from "../flatbuffers/duc";
import { getPrecisionScope } from "../technical/measurements";
import {
  getPrecisionValueFromRaw,
  getPrecisionValueFromScoped,
  NEUTRAL_SCOPE,
  ScaleFactors
} from "../technical/scopes";
import { PREDEFINED_STANDARDS, Standard } from "../technical/standards";
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
} from "../types";
import { DucLocalState } from "../types";
import type {
  _DucStackBase,
  BezierMirroring,
  BlockLocalizationMap,
  DucBlock,
  DucBlockAttributeDefinition,
  DucBlockInstance,
  DucElement,
  DucGroup,
  DucHead,
  DucLayer,
  DucRegion,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  ExternalFileId,
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
} from "../types/elements";
import { Percentage, Radian } from "../types/geometryTypes";
import { ValueOf } from "../types/utility-types";
import {
  base64ToUint8Array,
  getDefaultGlobalState,
  getDefaultLocalState,
  getZoom,
  isEncodedFunctionString,
  isFiniteNumber,
  reviveEncodedFunction,
} from "../utils";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_POLYGON_SIDES,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  DEFAULT_ZOOM_STEP,
  MAX_ZOOM_STEP,
  MIN_ZOOM_STEP,
  VERSIONS,
} from "../utils/constants";
import { getDefaultStackProperties } from "../utils/elements";
import { restoreElements } from "./restoreElements";
import {
  isStandardIdPresent,
  restoreStandards,
} from "./restoreStandards";

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
  blockInstances: DucBlockInstance[];

  groups: DucGroup[];
  regions: DucRegion[];
  layers: DucLayer[];

  standards: Standard[];
  versionGraph: VersionGraph | undefined;
  id: string;
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
  /** 
   * Optional list of element ids that should bypass normal validation
   * during restore and be passed through as-is to `restoreElements`.
   */
  passThroughElementIds?: string[];
};

export type RestoreConfig = {
  forceScope?: Scope;
};

export const restore = (
  data: ImportedDataState | null,
  elementsConfig: ElementsConfig,
  restoreConfig: RestoreConfig = {},
): RestoredDataState => {
  const restoredStandards = restoreStandards(data?.standards);
  const restoredDictionary = restoreDictionary(data?.dictionary);
  const restoredGlobalState = restoreGlobalState(data?.globalState);
  const restoredLocalState = restoreLocalState(
    data?.localState,
    restoredGlobalState,
    restoredStandards,
    restoreConfig.forceScope
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
  const restoredBlockInstances = restoreBlockInstances(data?.blockInstances);

  const restoredElements = restoreElements(
    data?.elements,
    restoredLocalState.scope,
    restoredBlocks,
    restoredElementsConfig
  );

  const restoredVersionGraph = restoreVersionGraph(data?.versionGraph);

  // Generate a new ID if none exists or if it's empty
  const parsedId = data?.id;
  const restoredId = (parsedId && parsedId.trim().length > 0) ? parsedId : nanoid();

  return {
    dictionary: restoredDictionary,
    thumbnail: isValidUint8Array(data?.thumbnail),
    elements: restoredElements,
    blocks: restoredBlocks,
    blockInstances: restoredBlockInstances,
    groups: restoredGroups,
    regions: restoredRegions,
    layers: restoredLayers,

    standards: restoredStandards,
    versionGraph: restoredVersionGraph,

    localState: restoredLocalState,
    globalState: restoredGlobalState,
    files: restoreFiles(data?.files),
    id: restoredId,
  };
};

export const restoreFiles = (importedFiles: unknown): DucExternalFiles => {
  if (!importedFiles || typeof importedFiles !== "object") {
    return {};
  }

  const restoredFiles: DucExternalFiles = {};
  const files = importedFiles as Record<string, unknown>;

  for (const key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const fileData = files[key];
      if (!fileData || typeof fileData !== "object") {
        continue;
      }
      const id = isValidExternalFileId((fileData as any).id);
      const mimeType = isValidString((fileData as any).mimeType);
      const created = isFiniteNumber((fileData as any).created)
        ? (fileData as any).created
        : Date.now();

      // Check for data under 'data' or 'dataURL' to be more flexible.
      const dataSource = (fileData as any).data ?? (fileData as any).dataURL;
      const data = isValidUint8Array(dataSource);

      if (id && mimeType && data) {
        restoredFiles[id] = {
          id,
          mimeType,
          data,
          created,
          lastRetrieved: isFiniteNumber((fileData as any).lastRetrieved)
            ? (fileData as any).lastRetrieved
            : undefined,
          version: isFiniteNumber((fileData as any).version)
            ? (fileData as any).version
            : undefined,
        };
      }
    }
  }
  return restoredFiles;
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
  if (!Array.isArray(groups)) {
    return [];
  }
  return groups
    .filter(
      (g) => {
        if (!g || typeof g !== "object") return false;
        return typeof g.id === "string";
      }
    )
    .map((g): DucGroup => {
      return {
        id: g.id as string,
        ...restoreDucStackProperties(g),
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
  if (!Array.isArray(layers)) {
    return [];
  }
  return layers
    .filter(
      (g) => {
        if (!g || typeof g !== "object") return false;
        return typeof g.id === "string";
      }
    )
    .map((l): DucLayer => {
      return {
        id: l.id as string,
        ...restoreDucStackProperties(l),
        readonly: isValidBoolean(l.readonly, false),
        overrides: {
          stroke: validateStroke(l.overrides.stroke, currentScope, currentScope),
          background: validateBackground(l.overrides.background),
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
      (g) => {
        if (!g || typeof g !== "object") return false;
        return typeof g.id === "string";
      }
    )
    .map((r) => {
      return {
        type: "region",
        id: r.id as string,
        ...restoreDucStackProperties(r),
        booleanOperation:
          Object.values(BOOLEAN_OPERATION).includes(r.booleanOperation as BOOLEAN_OPERATION)
            ? (r.booleanOperation as BOOLEAN_OPERATION)
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
  const partiallyRestoredBlocks: RestoredDataState["blocks"] = blocks
    .filter((b) => {
      if (!b || typeof b !== "object") return false;
      const obj = b as Record<string, unknown>;
      return typeof obj.id === "string";
    })
    .map((b) => {
      const obj = b as Record<string, unknown>;

      // Restore metadata if present
      let metadata: DucBlock["metadata"] | undefined;
      if (obj.metadata && typeof obj.metadata === "object") {
        const metadataObj = obj.metadata as Record<string, unknown>;
        let localization: BlockLocalizationMap | undefined;
        const localizationValue = metadataObj.localization;
        
        // Handle localization - it can be an object directly or a JSON string
        if (localizationValue && typeof localizationValue === "object") {
          // Already an object, use it directly
          localization = localizationValue as BlockLocalizationMap;
        } else if (typeof localizationValue === "string") {
          // It's a string, try to parse it as JSON
          try {
            localization = JSON.parse(localizationValue);
          } catch {
            localization = undefined;
          }
        }

        metadata = {
          source: typeof metadataObj.source === "string" ? metadataObj.source : "",
          usageCount: typeof metadataObj.usageCount === "number" ? metadataObj.usageCount : 0,
          createdAt: typeof metadataObj.createdAt === "number" ? metadataObj.createdAt : Date.now(),
          updatedAt: typeof metadataObj.updatedAt === "number" ? metadataObj.updatedAt : Date.now(),
          localization,
        };
      }

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
        metadata,
        thumbnail: isValidUint8Array(obj.thumbnail),
      };
    });
  return partiallyRestoredBlocks;
};

/**
 * Restores the blockInstances array from imported data, ensuring each item
 * conforms to the DucBlockInstance type.
 */
export const restoreBlockInstances = (
  blockInstances: unknown,
): RestoredDataState["blockInstances"] => {
  if (!Array.isArray(blockInstances)) {
    return [];
  }
  return blockInstances
    .filter((bi) => {
      if (!bi || typeof bi !== "object") return false;
      const obj = bi as Record<string, unknown>;
      return typeof obj.blockId === "string";
    })
    .map((bi): DucBlockInstance => {
      const obj = bi as Record<string, unknown>;
      const dupArray = obj.duplicationArray as any;

      // Handle elementOverrides - it's already a Record<string, string> from parse.ts
      let elementOverrides: Record<string, string> | undefined;
      if (obj.elementOverrides && typeof obj.elementOverrides === "object") {
        if (Array.isArray(obj.elementOverrides)) {
          // Legacy format: array of {key, value} entries
          elementOverrides = Object.fromEntries(
            obj.elementOverrides.map((entry: any) => [
              typeof entry.key === "string" ? entry.key : "",
              typeof entry.value === "string" ? entry.value : "",
            ])
          );
        } else {
          // Current format: already a Record<string, string>
          elementOverrides = obj.elementOverrides as Record<string, string>;
        }
      }

      // Handle attributeValues - same logic
      let attributeValues: Record<string, string> | undefined;
      if (obj.attributeValues && typeof obj.attributeValues === "object") {
        if (Array.isArray(obj.attributeValues)) {
          // Legacy format: array of {key, value} entries
          attributeValues = Object.fromEntries(
            obj.attributeValues.map((entry: any) => [
              typeof entry.key === "string" ? entry.key : "",
              typeof entry.value === "string" ? entry.value : "",
            ])
          );
        } else {
          // Current format: already a Record<string, string>
          attributeValues = obj.attributeValues as Record<string, string>;
        }
      }

      return {
        id: isValidString(obj.id),
        blockId: isValidString(obj.blockId),
        version: isValidNumber(obj.version, 1),
        elementOverrides,
        attributeValues,
        duplicationArray: dupArray && typeof dupArray === "object"
          ? {
            rows: typeof dupArray.rows === "number" ? dupArray.rows : 1,
            cols: typeof dupArray.cols === "number" ? dupArray.cols : 1,
            rowSpacing: typeof dupArray.rowSpacing === "number" ? dupArray.rowSpacing : 0,
            colSpacing: typeof dupArray.colSpacing === "number" ? dupArray.colSpacing : 0,
          }
          : null,
      };
    });
};

/**
 * Restores instances from block instances data (alias for restoreBlockInstances)
 * This method provides a consistent naming convention for instance restoration.
 */
export const restoreInstances = (
  instances: unknown,
): RestoredDataState["blockInstances"] => {
  return restoreBlockInstances(instances);
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
  const defaults = getDefaultGlobalState();

  const linearPrecision = isValidFinitePositiveByteValue(
    importedState?.displayPrecision?.linear,
    defaults.displayPrecision.linear
  );
  return {
    ...defaults,
    name: importedState?.name ?? defaults.name,
    viewBackgroundColor:
      importedState?.viewBackgroundColor ?? defaults.viewBackgroundColor,
    mainScope:
      isValidAppStateScopeValue(importedState?.mainScope) ?? defaults.mainScope,
    scopeExponentThreshold: isValidAppStateScopeExponentThresholdValue(
      importedState?.scopeExponentThreshold,
      defaults.scopeExponentThreshold
    ),
    dashSpacingScale:
      importedState?.dashSpacingScale ?? defaults.dashSpacingScale,
    isDashSpacingAffectedByViewportScale:
      importedState?.isDashSpacingAffectedByViewportScale ??
      defaults.isDashSpacingAffectedByViewportScale,
    dimensionsAssociativeByDefault:
      importedState?.dimensionsAssociativeByDefault ??
      defaults.dimensionsAssociativeByDefault,
    useAnnotativeScaling:
      importedState?.useAnnotativeScaling ?? defaults.useAnnotativeScaling,
    displayPrecision: {
      linear: linearPrecision,
      angular:
        importedState?.displayPrecision?.angular ??
        defaults.displayPrecision.angular,
    },
    pruningLevel:
      importedState?.pruningLevel &&
        Object.values(PRUNING_LEVEL).includes(importedState.pruningLevel)
        ? importedState.pruningLevel
        : PRUNING_LEVEL.BALANCED,
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
  restoredStandards: RestoredDataState["standards"],
  forceScope?: Scope
): DucLocalState => {
  const defaults = getDefaultLocalState();
  const zoom = getZoom(importedState?.zoom?.value ?? defaults.zoom.value, restoredGlobalState.mainScope, restoredGlobalState.scopeExponentThreshold);
  const scope = forceScope
    ? isValidScopeValue(forceScope)
    : isValidPrecisionScopeValue(
      zoom.value,
      restoredGlobalState.mainScope,
      restoredGlobalState.scopeExponentThreshold
    );

  return {
    ...defaults,
    ...importedState,
    scope,
    activeStandardId: isValidStandardId(
      importedState?.activeStandardId,
      restoredStandards,
      defaults.activeStandardId
    ),
    isBindingEnabled: isValidBoolean(
      importedState?.isBindingEnabled,
      defaults.isBindingEnabled
    ),
    penMode: isValidBoolean(importedState?.penMode, defaults.penMode),
    scrollX: importedState?.scrollX
      ? restorePrecisionValue(importedState.scrollX, NEUTRAL_SCOPE, scope)
      : getPrecisionValueFromRaw(defaults.scrollX.value, NEUTRAL_SCOPE, scope),
    scrollY: importedState?.scrollY
      ? restorePrecisionValue(importedState.scrollY, NEUTRAL_SCOPE, scope)
      : getPrecisionValueFromRaw(defaults.scrollY.value, NEUTRAL_SCOPE, scope),
    zoom,
    activeGridSettings:
      importedState?.activeGridSettings ?? defaults.activeGridSettings,
    activeSnapSettings:
      importedState?.activeSnapSettings ?? defaults.activeSnapSettings,
    currentItemStroke:
      validateStroke(importedState?.currentItemStroke, scope, scope) ??
      defaults.currentItemStroke,
    currentItemBackground:
      validateBackground(importedState?.currentItemBackground) ??
      defaults.currentItemBackground,
    currentItemOpacity: isValidPercentageValue(
      importedState?.currentItemOpacity,
      defaults.currentItemOpacity
    ),
    currentItemStartLineHead:
      isValidLineHeadValue(importedState?.currentItemStartLineHead) ??
      defaults.currentItemStartLineHead,
    currentItemEndLineHead:
      isValidLineHeadValue(importedState?.currentItemEndLineHead) ??
      defaults.currentItemEndLineHead,
  };
};

export const restoreVersionGraph = (
  importedGraph: any
): RestoredDataState["versionGraph"] => {
  if (!importedGraph || typeof importedGraph !== "object") {
    return undefined;
  }
  const userCheckpointVersionId = isValidString(
    importedGraph.userCheckpointVersionId
  );
  const latestVersionId = isValidString(importedGraph.latestVersionId);
  if (!userCheckpointVersionId || !latestVersionId) {
    return undefined;
  }
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
      const parentId = typeof c.parentId === "string" ? c.parentId : null;
      const timestamp = isFiniteNumber(c.timestamp) ? c.timestamp : 0;
      const isManualSave = isValidBoolean(c.isManualSave, false);
      const sizeBytes =
        isFiniteNumber(c.sizeBytes) && c.sizeBytes >= 0 ? c.sizeBytes : 0;
      const data = isValidUint8Array(c.data);
      if (!data) {
        continue;
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
      const parentId = typeof d.parentId === "string" ? d.parentId : null;
      const timestamp = isFiniteNumber(d.timestamp) ? d.timestamp : 0;
      const isManualSave = isValidBoolean(d.isManualSave, false);
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
  const importedMetadata = importedGraph.metadata;
  const metadata: VersionGraph["metadata"] = {
    lastPruned: isFiniteNumber(importedMetadata?.lastPruned)
      ? importedMetadata.lastPruned
      : 0,
    totalSize:
      isFiniteNumber(importedMetadata?.totalSize) &&
        importedMetadata.totalSize >= 0
        ? importedMetadata.totalSize
        : 0,
  };
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
): Omit<_DucStackBase, "id"> => {
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
    return fallbackValue;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return fallbackValue;
    }
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
  if (value !== undefined && Object.keys(ScaleFactors).includes(value)) {
    return value as Scope;
  }
  if (mainScope && Object.keys(ScaleFactors).includes(mainScope)) {
    return mainScope;
  }
  if (
    localState?.scope &&
    Object.keys(ScaleFactors).includes(localState.scope)
  ) {
    return localState.scope;
  }
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
  // blockId can be null - only reject if type is invalid
  if (type === null) return null;
  const blockId = isValidBlockId(value.blockId, blocks);
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
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }
  const roundedValue = Math.round(value);
  return Math.max(0, Math.min(255, roundedValue));
};

export const isValidPolygonSides = (sides: any): number => {
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

/**
 * Ensures the supplied easing function is valid. Falls back to the default easing otherwise.
 */
export const isValidFunction = <T extends Function>(
  value: unknown,
  defaultFn: T
): T => {
  if (typeof value === "function") return value as T;
  if (typeof value === "string" && isEncodedFunctionString(value)) {
    const revived = reviveEncodedFunction(value);
    if (typeof revived === "function") return revived as T;
  }
  return defaultFn;
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
 * Validates a number value.
 * Returns the number if valid, otherwise returns the provided defaultValue or 0.
 * Optionally parses numeric strings.
 */
export const isValidNumber = (
  value: any,
  defaultValue: number = 0,
  parseStrings: boolean = true
): number => {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
    return value;
  }

  if (parseStrings && typeof value === "string") {
    const parsed = Number(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
};

export const isValidExternalFileId = (
  value: any,
  defaultValue: ExternalFileId = "" as ExternalFileId,
): ExternalFileId => {
  if (typeof value !== "string") return defaultValue;
  if (value.trim().length === 0) return defaultValue;
  return value as ExternalFileId;
};

/**
 * Validates a value to ensure it is or can be converted to a non-empty Uint8Array.
 *
 * This function handles three types of input:
 * 1. An existing `Uint8Array`.
 * 2. A Base64-encoded string.
 * 3. A full Data URL string (e.g., "data:image/png;base64,...").
 *
 * @param value The unknown value to validate.
 * @returns A valid, non-empty `Uint8Array` if the conversion is successful, otherwise `undefined`.
 */
export const isValidUint8Array = (value: unknown): Uint8Array | undefined => {
  if (value instanceof Uint8Array) {
    return value.byteLength > 0 ? value : undefined;
  }

  if (typeof value === "string") {
    let base64String = value;

    if (value.startsWith("data:")) {
      const commaIndex = value.indexOf(",");
      if (commaIndex === -1) {
        console.warn("Invalid Data URL format: missing comma.");
        return undefined; // Malformed Data URL
      }

      // Ensure it's a base64-encoded Data URL
      const header = value.substring(0, commaIndex);
      if (!header.includes(";base64")) {
        console.warn("Unsupported Data URL: only base64 encoding is supported.");
        return undefined;
      }

      // Extract the actual base64 payload
      base64String = value.substring(commaIndex + 1);
    }

    try {
      if (base64String.trim().length === 0) {
        return undefined;
      }
      const decodedData = base64ToUint8Array(base64String);
      return decodedData.byteLength > 0 ? decodedData : undefined;
    } catch (error) {
      console.warn("Failed to decode base64 string:", error);
      return undefined;
    }
  }

  return undefined;
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
