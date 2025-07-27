import {
  ANGULAR_UNITS_FORMAT,
  DECIMAL_SEPARATOR,
  DIMENSION_UNITS_FORMAT,
  GRID_DISPLAY_TYPE,
  GRID_TYPE,
  UNIT_SYSTEM,
} from "ducjs/duc";
import {
  isValidBoolean,
  isValidEnumValue,
  isValidRadianValue,
  isValidString,
  restorePrecisionValue
} from "ducjs/restore/restoreDataState";
import {
  NEUTRAL_SCOPE,
  ScaleFactors
} from "ducjs/technical";
import { PREDEFINED_STANDARDS, Standard, StandardOverrides, StandardStyles, StandardUnits, StandardValidation, StandardViewSettings } from "ducjs/technical/standards";
import {
  GridSettings,
  GridStyle,
  Identifier,
  Scope
} from "ducjs/types";



export const restoreStandards = (
  standards: any,
  // Pass current scope to resolve precision values if needed
  currentScope: Scope = NEUTRAL_SCOPE,
): Standard[] => {
  if (!Array.isArray(standards) || standards.length === 0) {
    // If no standards are provided, return a default set.
    return DEFAULT_STANDARDS;
  }

  const restoredStandards: Standard[] = [];
  const restoredIds = new Set<string>();

  for (const s of standards) {
    if (!s || typeof s !== 'object') continue;

    const identifier = restoreIdentifier(s);
    if (!identifier || restoredIds.has(identifier.id)) {
      continue; // Skip if no valid ID or if ID is a duplicate
    }
    
    restoredStandards.push({
      ...identifier,
      version: isValidString(s.version, "1.0.0"),
      readonly: isValidBoolean(s.readonly, false),
      overrides: restoreStandardOverrides(s.overrides, currentScope),
      styles: restoreStandardStyles(s.styles, currentScope),
      viewSettings: restoreStandardViewSettings(s.viewSettings, currentScope),
      units: restoreStandardUnits(s.units, currentScope),
      validation: restoreStandardValidation(s.validation, currentScope),
    });
    restoredIds.add(identifier.id);
  }
  
  // Ensure the default standard is always present if it was missed
  if (!restoredIds.has(PREDEFINED_STANDARDS.DUC)) {
      restoredStandards.unshift(getDefaultStandard());
  }

  return restoredStandards;
};

// This would typically be defined in a central place with other default objects
const getDefaultStandard = (): Standard => ({
  id: PREDEFINED_STANDARDS.DUC,
  name: "DUC",
  version: "1.0.0",
  readonly: true,
  overrides: null,
  styles: null,
  viewSettings: null,
  units: null,
  validation: null,
});

const DEFAULT_STANDARDS: Standard[] = [
  getDefaultStandard(),
  // Potentially add other predefined standards here if they should always be present
];


/**
 * Checks if a given id is present in the standards array.
 * @returns true if found, false otherwise.
 */
export const isStandardIdPresent = (id: string, standards: Standard[]): boolean => {
  if (!Array.isArray(standards) || typeof id !== "string") return false;
  return standards.some(s => typeof s.id === "string" && s.id === id);
};

// --- Helper Functions for Restoration ---

const restoreIdentifier = (ident: any): Identifier | null => {
  if (!ident || typeof ident !== 'object' || !isValidString(ident.id)) {
    return null;
  }
  return {
    id: ident.id,
    name: isValidString(ident.name, ident.id),
    description: isValidString(ident.description) || undefined,
  };
};

const restoreStandardUnits = (units: any, currentScope: Scope): StandardUnits | null => {
  if (!units || typeof units !== 'object') return null;

  const primary = units.primaryUnits;
  const alternate = units.alternateUnits;

  if (!primary || !alternate) return null;

  return {
    primaryUnits: {
      linear: {
        format: isValidEnumValue(primary.linear?.format, DIMENSION_UNITS_FORMAT, DIMENSION_UNITS_FORMAT.DECIMAL),
        system: isValidEnumValue(primary.linear?.system, UNIT_SYSTEM, UNIT_SYSTEM.METRIC),
        precision: primary.linear?.precision ?? 2,
        suppressLeadingZeros: isValidBoolean(primary.linear?.suppressLeadingZeros, false),
        suppressTrailingZeros: isValidBoolean(primary.linear?.suppressTrailingZeros, false),
        decimalSeparator: isValidEnumValue(primary.linear?.decimalSeparator, DECIMAL_SEPARATOR, DECIMAL_SEPARATOR.DOT),
        suppressZeroFeet: isValidBoolean(primary.linear?.suppressZeroFeet, false),
        suppressZeroInches: isValidBoolean(primary.linear?.suppressZeroInches, false),
      },
      angular: {
        format: isValidEnumValue(primary.angular?.format, ANGULAR_UNITS_FORMAT, ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES),
        system: isValidEnumValue(primary.angular?.system, UNIT_SYSTEM, UNIT_SYSTEM.METRIC),
        precision: primary.angular?.precision ?? 2,
        suppressLeadingZeros: isValidBoolean(primary.angular?.suppressLeadingZeros, false),
        suppressTrailingZeros: isValidBoolean(primary.angular?.suppressTrailingZeros, false),
      },
    },
    alternateUnits: {
      format: isValidEnumValue(alternate?.format, DIMENSION_UNITS_FORMAT, DIMENSION_UNITS_FORMAT.DECIMAL),
      system: isValidEnumValue(alternate?.system, UNIT_SYSTEM, UNIT_SYSTEM.METRIC),
      precision: alternate?.precision ?? 2,
      suppressLeadingZeros: isValidBoolean(alternate?.suppressLeadingZeros, false),
      suppressTrailingZeros: isValidBoolean(alternate?.suppressTrailingZeros, false),
      isVisible: isValidBoolean(alternate?.isVisible, false),
      multiplier: typeof alternate?.multiplier === 'number' ? alternate.multiplier : 1,
    }
  };
};

const restoreStandardOverrides = (overrides: any, currentScope: Scope): StandardOverrides | null => {
  if (!overrides || typeof overrides !== 'object') return null;

  return {
    mainScope: isValidEnumValue(overrides.mainScope, ScaleFactors, undefined),
    elementsStrokeWidthOverride: overrides.elementsStrokeWidthOverride ? restorePrecisionValue(overrides.elementsStrokeWidthOverride, NEUTRAL_SCOPE, currentScope) : undefined,
    commonStyleId: isValidString(overrides.commonStyleId) || undefined,
    stackLikeStyleId: isValidString(overrides.stackLikeStyleId) || undefined,
    textStyleId: isValidString(overrides.textStyleId) || undefined,
    dimensionStyleId: isValidString(overrides.dimensionStyleId) || undefined,
    leaderStyleId: isValidString(overrides.leaderStyleId) || undefined,
    featureControlFrameStyleId: isValidString(overrides.featureControlFrameStyleId) || undefined,
    tableStyleId: isValidString(overrides.tableStyleId) || undefined,
    docStyleId: isValidString(overrides.docStyleId) || undefined,
    viewportStyleId: isValidString(overrides.viewportStyleId) || undefined,
    plotStyleId: isValidString(overrides.plotStyleId) || undefined,
    hatchStyleId: isValidString(overrides.hatchStyleId) || undefined,
    activeGridSettingsId: Array.isArray(overrides.activeGridSettingsId) ? overrides.activeGridSettingsId.map(String) : undefined,
    activeSnapSettingsId: isValidString(overrides.activeSnapSettingsId) || undefined,
    dashLineOverride: isValidString(overrides.dashLineOverride) || undefined,
    unitPrecision: overrides.unitPrecision ? {
        linear: typeof overrides.unitPrecision.linear === 'number' ? overrides.unitPrecision.linear : undefined,
        angular: typeof overrides.unitPrecision.angular === 'number' ? overrides.unitPrecision.angular : undefined,
        area: typeof overrides.unitPrecision.area === 'number' ? overrides.unitPrecision.area : undefined,
        volume: typeof overrides.unitPrecision.volume === 'number' ? overrides.unitPrecision.volume : undefined,
    } : undefined,
  };
};

const restoreStandardStyles = (styles: any, currentScope: Scope): StandardStyles | null => {
  if (!styles || typeof styles !== 'object') return null;
  // This is a simplified restoration. A full implementation would deeply restore each style object.
  return {
    commonStyles: styles.commonStyles || [],
    stackLikeStyles: styles.stackLikeStyles || [],
    textStyles: styles.textStyles || [],
    dimensionStyles: styles.dimensionStyles || [],
    leaderStyles: styles.leaderStyles || [],
    featureControlFrameStyles: styles.featureControlFrameStyles || [],
    tableStyles: styles.tableStyles || [],
    docStyles: styles.docStyles || [],
    viewportStyles: styles.viewportStyles || [],
    hatchStyles: styles.hatchStyles || [],
    xrayStyles: styles.xrayStyles || [],
  };
};

const restoreGridSettings = (settings: any, currentScope: Scope): GridSettings | null => {
    if (!settings || typeof settings !== 'object') return null;
    const defaultGridStyle: GridStyle = { color: '#000000', opacity: 0.2 as any, dashPattern: [] };
    return {
        type: isValidEnumValue(settings.type, GRID_TYPE, GRID_TYPE.RECTANGULAR),
        readonly: isValidBoolean(settings.readonly, false),
        displayType: isValidEnumValue(settings.displayType, GRID_DISPLAY_TYPE, GRID_DISPLAY_TYPE.LINES),
        isAdaptive: isValidBoolean(settings.isAdaptive, true),
        xSpacing: restorePrecisionValue(settings.xSpacing, NEUTRAL_SCOPE, currentScope, 100),
        ySpacing: restorePrecisionValue(settings.ySpacing, NEUTRAL_SCOPE, currentScope, 100),
        subdivisions: typeof settings.subdivisions === 'number' ? settings.subdivisions : 10,
        origin: settings.origin || { x: 0, y: 0 },
        rotation: isValidRadianValue(settings.rotation, 0 as any),
        followUCS: isValidBoolean(settings.followUCS, false),
        majorStyle: settings.majorStyle || defaultGridStyle,
        minorStyle: settings.minorStyle || defaultGridStyle,
        showMinor: isValidBoolean(settings.showMinor, true),
        minZoom: typeof settings.minZoom === 'number' ? settings.minZoom : 0.1,
        maxZoom: typeof settings.maxZoom === 'number' ? settings.maxZoom : 100,
        autoHide: isValidBoolean(settings.autoHide, true),
        polarSettings: settings.polarSettings,
        isometricSettings: settings.isometricSettings,
        enableSnapping: isValidBoolean(settings.enableSnapping, true),
    };
};

const restoreStandardViewSettings = (viewSettings: any, currentScope: Scope): StandardViewSettings | null => {
  if (!viewSettings || typeof viewSettings !== 'object') return null;

  const restoredViews = (Array.isArray(viewSettings.views) ? viewSettings.views : [])
    .map((v: any) => {
        const identifier = restoreIdentifier(v);
        // ... deep restore of DucView ...
        return identifier ? { ...identifier, ...v } : null; // simplified for now
    }).filter(Boolean);

  const restoredUcs = (Array.isArray(viewSettings.ucs) ? viewSettings.ucs : [])
    .map((u: any) => {
        const identifier = restoreIdentifier(u);
        // ... deep restore of DucUcs ...
        return identifier ? { ...identifier, ...u } : null; // simplified for now
    }).filter(Boolean);
  
  const restoredGrids = (Array.isArray(viewSettings.gridSettings) ? viewSettings.gridSettings : [])
    .map((g: any) => {
        const identifier = restoreIdentifier(g);
        const settings = restoreGridSettings(g, currentScope);
        return (identifier && settings) ? { ...identifier, ...settings } : null;
    }).filter(Boolean);

  const restoredSnaps = (Array.isArray(viewSettings.snapSettings) ? viewSettings.snapSettings : [])
    .map((s: any) => {
        const identifier = restoreIdentifier(s);
        // ... deep restore of SnapSettings ...
        return identifier ? { ...identifier, ...s } : null; // simplified for now
    }).filter(Boolean);
  
  return {
    views: restoredViews,
    ucs: restoredUcs,
    gridSettings: restoredGrids as (Identifier & GridSettings)[],
    snapSettings: restoredSnaps,
  };
};

const restoreStandardValidation = (validation: any, currentScope: Scope): StandardValidation | null => {
  if (!validation || typeof validation !== 'object') return null;

  return {
    dimensionRules: validation.dimensionRules ? {
        minTextHeight: validation.dimensionRules.minTextHeight ? restorePrecisionValue(validation.dimensionRules.minTextHeight, NEUTRAL_SCOPE, currentScope) : undefined,
        maxTextHeight: validation.dimensionRules.maxTextHeight ? restorePrecisionValue(validation.dimensionRules.maxTextHeight, NEUTRAL_SCOPE, currentScope) : undefined,
        allowedPrecisions: Array.isArray(validation.dimensionRules.allowedPrecisions) ? validation.dimensionRules.allowedPrecisions.map(Number) : undefined,
    } : undefined,
    layerRules: validation.layerRules ? {
        prohibitedLayerNames: Array.isArray(validation.layerRules.prohibitedLayerNames) ? validation.layerRules.prohibitedLayerNames.map(String) : undefined,
    } : undefined,
  };
};
