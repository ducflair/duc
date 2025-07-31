import {
  Identifier as BinIdentifier,
  Standard as BinStandard,
  StandardOverrides as BinStandardOverrides,
  UnitPrecision as BinUnitPrecision,
  StandardStyles as BinStandardStyles,
  StandardViewSettings as BinStandardViewSettings,
  StandardUnits as BinStandardUnits,
  StandardValidation as BinStandardValidation,
  IdentifiedCommonStyle,
  IdentifiedStackLikeStyle,
  IdentifiedTextStyle,
  IdentifiedDimensionStyle,
  IdentifiedLeaderStyle,
  IdentifiedFCFStyle,
  IdentifiedTableStyle,
  IdentifiedDocStyle,
  IdentifiedViewportStyle,
  IdentifiedHatchStyle,
  IdentifiedXRayStyle,
  IdentifiedGridSettings,
  IdentifiedSnapSettings,
  IdentifiedUcs,
  IdentifiedView,
  GridSettings as BinGridSettings,
  SnapSettings as BinSnapSettings,
  DucUcs as BinDucUcs,
  DucView as BinDucView,
  _UnitSystemBase as BinUnitSystemBase,
  LinearUnitSystem as BinLinearUnitSystem,
  AngularUnitSystem as BinAngularUnitSystem,
  AlternateUnits as BinAlternateUnits,
} from "ducjs/duc";
import {
  getPrecisionValueFromRaw,
  NEUTRAL_SCOPE,
  SupportedMeasures,
} from "ducjs/technical/scopes";
import {
  Standard,
  StandardOverrides,
  StandardStyles,
  StandardViewSettings,
  StandardUnits,
  StandardValidation,
} from "ducjs/technical/standards";
import { Identifier, PrecisionValue, RawValue, Scope } from "ducjs/types";
import { Percentage, Radian, ScaleFactor } from "ducjs/types/geometryTypes";
import {
  DucCommonStyle,
  DucDimensionStyle,
  DucDocStyle,
  DucFeatureControlFrameStyle,
  DucHatchStyle,
  DucLeaderStyle,
  DucStackLikeStyles,
  DucTableStyle,
  DucTextStyle,
  DucViewportStyle,
  DucXRayStyle,
} from "ducjs/types/elements";
import {
  GridSettings,
  SnapSettings,
  DucUcs,
  DucView,
} from "ducjs/types";
import { parseElementBackgroundFromBinary, parseElementStrokeFromBinary } from "ducjs/parse/parseElementStyleFromBinary";

// Helper: Identifier
function parseIdentifierFromBinary(identifier: BinIdentifier): Identifier {
  return {
    id: identifier.id()!,
    name: identifier.name()!,
    description: identifier.description() ?? undefined,
  };
}

// Helper: UnitPrecision
function parseUnitPrecisionFromBinary(unitPrecision: BinUnitPrecision | null) {
  if (!unitPrecision) return undefined;
  return {
    linear: unitPrecision.linear() ?? undefined,
    angular: unitPrecision.angular() ?? undefined,
    area: unitPrecision.area() ?? undefined,
    volume: unitPrecision.volume() ?? undefined,
  };
}

// Helper: LinearUnitSystem  
function parseLinearUnitSystemFromBinary(unit: BinLinearUnitSystem | null) {
  if (!unit) return null;
  const base = unit.base();
  return {
    format: unit.format()!,
    system: base?.system()!,
    precision: base?.precision()!,
    suppressLeadingZeros: base?.suppressLeadingZeros()!,
    suppressTrailingZeros: base?.suppressTrailingZeros()!,
    decimalSeparator: unit.decimalSeparator()!,
    suppressZeroFeet: unit.suppressZeroFeet(),
    suppressZeroInches: unit.suppressZeroInches(),
  };
}

// Helper: AngularUnitSystem
function parseAngularUnitSystemFromBinary(unit: BinAngularUnitSystem | null) {
  if (!unit) return null;
  const base = unit.base();
  return {
    format: unit.format()!,
    system: base?.system()!,
    precision: base?.precision()!,
    suppressLeadingZeros: base?.suppressLeadingZeros()!,
    suppressTrailingZeros: base?.suppressTrailingZeros()!,
  };
}

// Helper: AlternateUnits
function parseAlternateUnitsFromBinary(unit: BinAlternateUnits | null) {
  if (!unit) return null;
  const base = unit.base();
  return {
    format: unit.format()!,
    system: base?.system()!,
    precision: base?.precision()!,
    suppressLeadingZeros: base?.suppressLeadingZeros()!,
    suppressTrailingZeros: base?.suppressTrailingZeros()!,
    isVisible: unit.isVisible()!,
    multiplier: unit.multiplier()!,
  };
}

// Helper: StandardUnits
function parseStandardUnitsFromBinary(units: BinStandardUnits | null): StandardUnits | null {
  if (!units) return null;
  const primary = units.primaryUnits();
  const alternate = units.alternateUnits();
  return {
    primaryUnits: {
      linear: parseLinearUnitSystemFromBinary(primary?.linear()!)!,
      angular: parseAngularUnitSystemFromBinary(primary?.angular()!)!,
    },
    alternateUnits: parseAlternateUnitsFromBinary(alternate!)!
  };
}

// Helper: StandardValidation
function parseStandardValidationFromBinary(validation: BinStandardValidation | null): StandardValidation | null {
  if (!validation) return null;
  const dimRules = validation.dimensionRules();
  const layerRules = validation.layerRules();
  return {
    dimensionRules: dimRules
      ? {
          minTextHeight: dimRules.minTextHeight() !== null ? getPrecisionValueFromRaw(dimRules.minTextHeight() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE) : undefined,
          maxTextHeight: dimRules.maxTextHeight() !== null ? getPrecisionValueFromRaw(dimRules.maxTextHeight() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE) : undefined,
          allowedPrecisions: (() => {
            const arr: number[] = [];
            for (let i = 0; i < dimRules.allowedPrecisionsLength(); i++) {
              const v = dimRules.allowedPrecisions(i);
              if (v !== null && v !== undefined) arr.push(v);
            }
            return arr.length ? arr : undefined;
          })(),
        }
      : undefined,
    layerRules: layerRules
      ? {
          prohibitedLayerNames: (() => {
            const arr: string[] = [];
            for (let i = 0; i < layerRules.prohibitedLayerNamesLength(); i++) {
              const v = layerRules.prohibitedLayerNames(i);
              if (v) arr.push(v);
            }
            return arr.length ? arr : undefined;
          })(),
        }
      : undefined,
  };
}

// Helper: StandardViewSettings
function parseStandardViewSettingsFromBinary(viewSettings: BinStandardViewSettings | null): StandardViewSettings | null {
  if (!viewSettings) return null;
  
  // Views
  const views: Array<Identifier & DucView> = [];
  for (let i = 0; i < viewSettings.viewsLength(); i++) {
    const v = viewSettings.views(i);
    if (v && v.id()) {
      const id = parseIdentifierFromBinary(v.id()!);
      const view = v.view();
      if (view) {
        const zoomValue = view.zoom();
        const normalizedZoom = Math.max(0.01, Math.min(100, zoomValue)) as any; // Normalize zoom to valid range
        const scopedZoom = normalizedZoom as any; // For now, use same value
        const scaledZoom = normalizedZoom as any; // For now, use same value
        
        views.push({
          ...id,
          scrollX: getPrecisionValueFromRaw(view.scrollX() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          scrollY: getPrecisionValueFromRaw(view.scrollY() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          zoom: {
            value: normalizedZoom,
            scoped: scopedZoom,
            scaled: scaledZoom,
          },
          twistAngle: view.twistAngle() as Radian,
          centerPoint: {
            x: getPrecisionValueFromRaw(view.centerPoint()!.x() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
            y: getPrecisionValueFromRaw(view.centerPoint()!.y() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          },
          scope: view.scope() as Scope,
        });
      }
    }
  }
  
  // UCS
  const ucs: Array<Identifier & DucUcs> = [];
  for (let i = 0; i < viewSettings.ucsLength(); i++) {
    const v = viewSettings.ucs(i);
    if (v && v.id()) {
      const id = parseIdentifierFromBinary(v.id()!);
      const u = v.ucs();
      if (u) {
        ucs.push({
          ...id,
          origin: {
            x: u.origin()!.x(),
            y: u.origin()!.y(),
          },
          angle: u.angle() as Radian,
        });
      }
    }
  }
  
  // GridSettings
  const gridSettings: Array<Identifier & GridSettings> = [];
  for (let i = 0; i < viewSettings.gridSettingsLength(); i++) {
    const v = viewSettings.gridSettings(i);
    if (v && v.id()) {
      const id = parseIdentifierFromBinary(v.id()!);
      const s = v.settings();
      if (s) {
        gridSettings.push({
          ...id,
          type: s.type()!,
          readonly: s.readonly(),
          displayType: s.displayType()!,
          isAdaptive: s.isAdaptive(),
          xSpacing: getPrecisionValueFromRaw(s.xSpacing() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          ySpacing: getPrecisionValueFromRaw(s.ySpacing() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          subdivisions: s.subdivisions(),
          origin: {
            x: s.origin()!.x(),
            y: s.origin()!.y(),
          },
          rotation: s.rotation() as Radian,
          followUCS: s.followUcs(),
          majorStyle: {
            color: s.majorStyle()!.color()!,
            opacity: s.majorStyle()!.opacity()! as any,
            dashPattern: [],
          },
          minorStyle: {
            color: s.minorStyle()!.color()!, 
            opacity: s.minorStyle()!.opacity()! as any,
            dashPattern: [],
          },
          showMinor: s.showMinor(),
          minZoom: s.minZoom(),
          maxZoom: s.maxZoom(),
          autoHide: s.autoHide(),
          enableSnapping: s.enableSnapping(),
        });
      }
    }
  }
  
  // SnapSettings
  const snapSettings: Array<Identifier & SnapSettings> = [];
  for (let i = 0; i < viewSettings.snapSettingsLength(); i++) {
    const v = viewSettings.snapSettings(i);
    if (v && v.id()) {
      const id = parseIdentifierFromBinary(v.id()!);
      const s = v.settings();
      if (s) {
        snapSettings.push({
          ...id,
          readonly: s.readonly(),
          twistAngle: s.twistAngle() as Radian,
          snapTolerance: s.snapTolerance(),
          objectSnapAperture: s.objectSnapAperture(),
          isOrthoModeOn: s.isOrthoModeOn(),
          polarTracking: {
            enabled: s.polarTracking()!.enabled(),
            angles: [],
            incrementAngle: s.polarTracking()!.incrementAngle() as any,
            trackFromLastPoint: s.polarTracking()!.trackFromLastPoint(),
            showPolarCoordinates: s.polarTracking()!.showPolarCoordinates(),
          },
          isObjectSnapOn: s.isObjectSnapOn(),
          activeObjectSnapModes: [],
          snapPriority: [],
          showTrackingLines: s.showTrackingLines(),
          dynamicSnap: {
            enabledDuringDrag: s.dynamicSnap()!.enabledDuringDrag(),
            enabledDuringRotation: s.dynamicSnap()!.enabledDuringRotation(),
            enabledDuringScale: s.dynamicSnap()!.enabledDuringScale(),
          },
          snapMode: s.snapMode() as any,
          snapMarkers: {
            enabled: s.snapMarkers()!.enabled(),
            size: s.snapMarkers()!.size(),
            duration: s.snapMarkers()!.duration(),
            styles: {} as any,
          },
          constructionSnapEnabled: s.constructionSnapEnabled(),
        });
      }
    }
  }
  
  return {
    views,
    ucs,
    gridSettings,
    snapSettings,
  };
}

// Helper: StandardStyles
function parseStandardStylesFromBinary(styles: BinStandardStyles | null): StandardStyles | null {
  if (!styles) return null;
  // Helper for each identified style type
  function parseIdentifiedStyles<T, B extends { id(): any; style(): any }>(
    length: number,
    getter: (i: number) => B | null,
    parseStyle: (id: Identifier, style: any) => T
  ): T[] {
    const arr: T[] = [];
    for (let i = 0; i < length; i++) {
      const entry = getter(i);
      if (entry) {
        const id = parseIdentifierFromBinary(entry.id()!);
        const style = entry.style();
        if (style) arr.push(parseStyle(id, style));
      }
    }
    return arr;
  }
  return {
    commonStyles: parseIdentifiedStyles(
      styles.commonStylesLength(),
      styles.commonStyles.bind(styles),
      (id, style): Identifier & DucCommonStyle => ({
        ...id,
        background: parseElementBackgroundFromBinary(style.background(), NEUTRAL_SCOPE)!,
        stroke: parseElementStrokeFromBinary(style.stroke(), NEUTRAL_SCOPE)!,
      })
    ),
    stackLikeStyles: parseIdentifiedStyles(
      styles.stackLikeStylesLength(),
      styles.stackLikeStyles.bind(styles),
      (id, style): Identifier & DucStackLikeStyles => ({
        ...id,
        opacity: style.opacity() as Percentage,
        labelingColor: style.labelingColor(),
      })
    ),
    textStyles: parseIdentifiedStyles(
      styles.textStylesLength(),
      styles.textStyles.bind(styles),
      (id, style): Identifier & DucTextStyle => ({
        ...id,
        // _DucElementStylesBase
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        // DucTextStyle
        isLtr: style.isLtr(),
        fontFamily: style.fontFamily(),
        bigFontFamily: style.bigFontFamily(),
        textAlign: style.textAlign(),
        verticalAlign: style.verticalAlign(),
        lineHeight: style.lineHeight(),
        lineSpacing: style.lineSpacing()
          ? {
              value: getPrecisionValueFromRaw(style.lineSpacing()!.value() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
              type: style.lineSpacing()!.type(),
            }
          : undefined!,
        obliqueAngle: style.obliqueAngle() as Radian,
        fontSize: getPrecisionValueFromRaw(style.fontSize() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        paperTextHeight: style.paperTextHeight() !== null ? getPrecisionValueFromRaw(style.paperTextHeight() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE) : undefined,
        widthFactor: style.widthFactor() as ScaleFactor,
        isUpsideDown: style.isUpsideDown(),
        isBackwards: style.isBackwards(),
      })
    ),
    dimensionStyles: parseIdentifiedStyles(
      styles.dimensionStylesLength(),
      styles.dimensionStyles.bind(styles),
      (id, style): Identifier & DucDimensionStyle => ({
        ...id,
        dimLine: {
          stroke: parseElementStrokeFromBinary(style.dimLine()!.stroke(), NEUTRAL_SCOPE)!,
          textGap: getPrecisionValueFromRaw(style.dimLine()!.textGap() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        },
        extLine: {
          stroke: parseElementStrokeFromBinary(style.extLine()!.stroke(), NEUTRAL_SCOPE)!,
          overshoot: getPrecisionValueFromRaw(style.extLine()!.overshoot() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          offset: getPrecisionValueFromRaw(style.extLine()!.offset() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        },
        textStyle: style.textStyle() ? {
          // Only parse required fields for now
          fontSize: getPrecisionValueFromRaw(style.textStyle()!.fontSize() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        } as any : undefined!,
        symbols: style.symbols() ? {
          headsOverride: (() => {
            const arr: any[] = [];
            for (let i = 0; i < style.symbols()!.headsOverrideLength(); i++) {
              const h = style.symbols()!.headsOverride(i);
              if (h) arr.push({
                type: h.type(),
                blockId: h.blockId(),
                size: getPrecisionValueFromRaw(h.size() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
              });
            }
            return arr.length ? arr as any : undefined;
          })(),
          centerMark: {
            type: style.symbols()!.centerMarkType(),
            size: getPrecisionValueFromRaw(style.symbols()!.centerMarkSize() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          },
        } : undefined!,
        tolerance: style.tolerance() ? {
          enabled: style.tolerance()!.enabled(),
          displayMethod: style.tolerance()!.displayMethod(),
          upperValue: style.tolerance()!.upperValue(),
          lowerValue: style.tolerance()!.lowerValue(),
          precision: style.tolerance()!.precision(),
          textStyle: {}, // TODO: parse partial textStyle
        } : undefined!,
        fit: style.fit() ? {
          rule: style.fit()!.rule(),
          textPlacement: style.fit()!.textPlacement(),
          forceTextInside: style.fit()!.forceTextInside(),
        } : undefined!,
      })
    ),
    leaderStyles: parseIdentifiedStyles(
      styles.leaderStylesLength(),
      styles.leaderStyles.bind(styles),
      (id, style): Identifier & DucLeaderStyle => ({
        ...id,
        // _DucElementStylesBase
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        // DucLeaderStyle
        headsOverride: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.headsOverrideLength(); i++) {
            const h = style.headsOverride(i);
            if (h) arr.push({
              type: h.type(),
              blockId: h.blockId(),
              size: getPrecisionValueFromRaw(h.size() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
            });
          }
          return arr.length ? arr as any : undefined;
        })(),
        dogleg: style.dogleg() !== null ? getPrecisionValueFromRaw(style.dogleg() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE) : undefined,
        textStyle: style.textStyle() ? {
          fontSize: getPrecisionValueFromRaw(style.textStyle()!.fontSize() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        } as any : undefined!,
        textAttachment: style.textAttachment(),
        blockAttachment: style.blockAttachment(),
      })
    ),
    featureControlFrameStyles: parseIdentifiedStyles(
      styles.featureControlFrameStylesLength(),
      styles.featureControlFrameStyles.bind(styles),
      (id, style): Identifier & DucFeatureControlFrameStyle => ({
        ...id,
        // _DucElementStylesBase
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        // DucFeatureControlFrameStyle
        textStyle: style.textStyle() ? {
          fontSize: getPrecisionValueFromRaw(style.textStyle()!.fontSize() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        } as any : undefined!,
        layout: style.layout() ? {
          padding: getPrecisionValueFromRaw(style.layout()!.padding() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          segmentSpacing: getPrecisionValueFromRaw(style.layout()!.segmentSpacing() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          rowSpacing: getPrecisionValueFromRaw(style.layout()!.rowSpacing() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        } : undefined!,
        symbols: style.symbols() ? {
          scale: style.symbols()!.scale(),
        } : undefined!,
        datumStyle: style.datumStyle() ? {
          bracketStyle: style.datumStyle()!.bracketStyle(),
        } : undefined!,
      })
    ),
    tableStyles: parseIdentifiedStyles(
      styles.tableStylesLength(),
      styles.tableStyles.bind(styles),
      (id, style): Identifier & DucTableStyle => ({
        ...id,
        // _DucElementStylesBase
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        // DucTableStyle
        flowDirection: style.flowDirection(),
        headerRowStyle: style.headerRowStyle() ? {} as any : undefined!,
        dataRowStyle: style.dataRowStyle() ? {} as any : undefined!,
        dataColumnStyle: style.dataColumnStyle() ? {} as any : undefined!,
      })
    ),
    docStyles: parseIdentifiedStyles(
      styles.docStylesLength(),
      styles.docStyles.bind(styles),
      (id, style): Identifier & DucDocStyle => ({
        ...id,
        // _DucElementStylesBase
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        // DucTextStyle
        isLtr: style.isLtr(),
        fontFamily: style.fontFamily(),
        bigFontFamily: style.bigFontFamily(),
        textAlign: style.textAlign(),
        verticalAlign: style.verticalAlign(),
        lineHeight: style.lineHeight(),
        lineSpacing: style.lineSpacing()
          ? {
              value: getPrecisionValueFromRaw(style.lineSpacing()!.value() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
              type: style.lineSpacing()!.type(),
            }
          : undefined!,
        obliqueAngle: style.obliqueAngle() as Radian,
        fontSize: getPrecisionValueFromRaw(style.fontSize() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        paperTextHeight: style.paperTextHeight() !== null ? getPrecisionValueFromRaw(style.paperTextHeight() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE) : undefined,
        widthFactor: style.widthFactor() as ScaleFactor,
        isUpsideDown: style.isUpsideDown(),
        isBackwards: style.isBackwards(),
        // DucDocStyle
        paragraph: style.paragraph() ? {
          firstLineIndent: getPrecisionValueFromRaw(style.paragraph()!.firstLineIndent() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          hangingIndent: getPrecisionValueFromRaw(style.paragraph()!.hangingIndent() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          leftIndent: getPrecisionValueFromRaw(style.paragraph()!.leftIndent() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          rightIndent: getPrecisionValueFromRaw(style.paragraph()!.rightIndent() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          spaceBefore: getPrecisionValueFromRaw(style.paragraph()!.spaceBefore() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          spaceAfter: getPrecisionValueFromRaw(style.paragraph()!.spaceAfter() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          tabStops: (() => {
            const arr: PrecisionValue[] = [];
            for (let i = 0; i < style.paragraph()!.tabStopsLength(); i++) {
              const v = style.paragraph()!.tabStops(i);
              if (v !== null && v !== undefined) arr.push(getPrecisionValueFromRaw(v as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE));
            }
            return arr;
          })(),
        } : undefined!,
        stackFormat: style.stackFormat() ? {
          autoStack: style.stackFormat()!.autoStack(),
          stackChars: (() => {
            const arr: string[] = [];
            for (let i = 0; i < style.stackFormat()!.stackCharsLength(); i++) {
              const v = style.stackFormat()!.stackChars(i);
              if (v) arr.push(v);
            }
            return arr;
          })(),
          properties: style.stackFormat()!.properties() ? {
            upperScale: style.stackFormat()!.properties()!.upperScale(),
            lowerScale: style.stackFormat()!.properties()!.lowerScale(),
            alignment: style.stackFormat()!.properties()!.alignment(),
          } : undefined!,
        } : undefined!,
      })
    ),
    viewportStyles: parseIdentifiedStyles(
      styles.viewportStylesLength(),
      styles.viewportStyles.bind(styles),
      (id, style): Identifier & DucViewportStyle => ({
        ...id,
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        scaleIndicatorVisible: style.scaleIndicatorVisible(),
      })
    ),
    hatchStyles: parseIdentifiedStyles(
      styles.hatchStylesLength(),
      styles.hatchStyles.bind(styles),
      (id, style): Identifier & DucHatchStyle => ({
        ...id,
        hatchStyle: style.hatchStyle(),
        pattern: {
          name: style.patternName(),
          scale: style.patternScale(),
          angle: style.patternAngle() as Radian,
          origin: {
            x: getPrecisionValueFromRaw(style.patternOrigin()!.x() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
            y: getPrecisionValueFromRaw(style.patternOrigin()!.y() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
          },
          double: style.patternDouble(),
        },
        customPattern: undefined, // TODO: parse customPattern if needed
      })
    ),
    xrayStyles: parseIdentifiedStyles(
      styles.xrayStylesLength(),
      styles.xrayStyles.bind(styles),
      (id, style): Identifier & DucXRayStyle => ({
        ...id,
        roundness: getPrecisionValueFromRaw(style.roundness() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
        blending: style.blending() ?? undefined,
        background: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.backgroundLength(); i++) {
            const b = style.background(i);
            if (b) arr.push(parseElementBackgroundFromBinary(b, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        stroke: (() => {
          const arr: any[] = [];
          for (let i = 0; i < style.strokeLength(); i++) {
            const s = style.stroke(i);
            if (s) arr.push(parseElementStrokeFromBinary(s, NEUTRAL_SCOPE)!);
          }
          return arr;
        })(),
        opacity: style.opacity() as Percentage,
        color: style.color(),
      })
    ),
  };
}

// Helper: StandardOverrides
function parseStandardOverridesFromBinary(
  overrides: BinStandardOverrides | null
): StandardOverrides | null {
  if (!overrides) return null;
  const activeGridSettingsId: string[] = [];
  for (let i = 0; i < overrides.activeGridSettingsIdLength(); i++) {
    const id = overrides.activeGridSettingsId(i);
    if (id !== null) activeGridSettingsId.push(id);
  }
  const unitPrecision = overrides.unitPrecision();
  return {
    mainScope: (overrides.mainScope() as SupportedMeasures) ?? undefined,
    elementsStrokeWidthOverride: overrides.elementsStrokeWidthOverride() !== null
      ? getPrecisionValueFromRaw(overrides.elementsStrokeWidthOverride() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE)
      : undefined,
    commonStyleId: overrides.commonStyleId() ?? undefined,
    stackLikeStyleId: overrides.stackLikeStyleId() ?? undefined,
    textStyleId: overrides.textStyleId() ?? undefined,
    dimensionStyleId: overrides.dimensionStyleId() ?? undefined,
    leaderStyleId: overrides.leaderStyleId() ?? undefined,
    featureControlFrameStyleId: overrides.featureControlFrameStyleId() ?? undefined,
    tableStyleId: overrides.tableStyleId() ?? undefined,
    docStyleId: overrides.docStyleId() ?? undefined,
    viewportStyleId: overrides.viewportStyleId() ?? undefined,
    plotStyleId: overrides.plotStyleId() ?? undefined,
    hatchStyleId: overrides.hatchStyleId() ?? undefined,
    activeGridSettingsId: activeGridSettingsId.length > 0 ? activeGridSettingsId : undefined,
    activeSnapSettingsId: overrides.activeSnapSettingsId() ?? undefined,
    dashLineOverride: overrides.dashLineOverride() ?? undefined,
    unitPrecision: unitPrecision ? parseUnitPrecisionFromBinary(unitPrecision) : undefined,
  };
}

// Main function
export function parseStandardFromBinary(standard: BinStandard): Standard {
  const identifier = standard.identifier()!;
  const version = standard.version()!;
  const readonly = standard.readonly();
  const overrides = standard.overrides();
  const styles = standard.styles();
  const viewSettings = standard.viewSettings();
  const units = standard.units();
  const validation = standard.validation();

  return {
    ...parseIdentifierFromBinary(identifier),
    version,
    readonly,
    overrides: overrides ? parseStandardOverridesFromBinary(overrides) : null,
    styles: styles ? parseStandardStylesFromBinary(styles) : null,
    viewSettings: viewSettings ? parseStandardViewSettingsFromBinary(viewSettings) : null,
    units: units ? parseStandardUnitsFromBinary(units) : null,
    validation: validation ? parseStandardValidationFromBinary(validation) : null,
  };
}
