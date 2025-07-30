import {
  Identifier as BinIdentifier,
  Standard as BinStandard,
  StandardOverrides as BinStandardOverrides,
  UnitPrecision as BinUnitPrecision,
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
} from "ducjs/technical/standards";
import { Identifier, PrecisionValue, RawValue } from "ducjs/types";
import { Percentage, Radian, ScaleFactor } from "ducjs/types/geometryTypes";
import { StandardStyles as BinStandardStyles } from "ducjs/duc";

// Import style types
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
import { parseElementBackgroundFromBinary, parseElementStrokeFromBinary } from "ducjs/parse/parseElementStyleFromBinary";

// Helper function to create a default PrecisionValue
const createDefaultPrecisionValue = (): PrecisionValue => {
  return getPrecisionValueFromRaw(0 as RawValue, "m", "m");
};

/**
 * Parses a Standard from FlatBuffers binary data.
 *
 * @param standard - The FlatBuffers Standard object to parse
 * @returns A partial Standard object with the parsed data
 */
/**
 * Parses an Identifier from FlatBuffers binary data.
 *
 * @param identifier - The FlatBuffers Identifier object to parse
 * @returns A complete Identifier object with the parsed data
 */
/**
 * Parses a UnitPrecision from FlatBuffers binary data.
 *
 * @param unitPrecision - The FlatBuffers UnitPrecision object to parse
 * @returns A partial unitPrecision object with the parsed data
 */
export function parseUnitPrecisionFromBinary(unitPrecision: BinUnitPrecision):
  | {
      linear?: number;
      angular?: number;
      area?: number;
      volume?: number;
    }
  | undefined {
  if (!unitPrecision) return undefined;

  return {
    linear: unitPrecision.linear() || undefined,
    angular: unitPrecision.angular() || undefined,
    area: unitPrecision.area() || undefined,
    volume: unitPrecision.volume() || undefined,
  };
}

/**
 * Parses StandardStyles from FlatBuffers binary data.
 *
 * @param styles - The FlatBuffers StandardStyles object to parse
 * @returns A StandardStyles object with the parsed data
 */
export function parseStandardStylesFromBinary(
  styles: BinStandardStyles
): StandardStyles | null {
  if (!styles) return null;

  return {
    commonStyles: parseIdentifiedCommonStyles(styles),
    stackLikeStyles: parseIdentifiedStackLikeStyles(styles),
    textStyles: parseIdentifiedTextStyles(styles),
    dimensionStyles: parseIdentifiedDimensionStyles(styles),
    leaderStyles: parseIdentifiedLeaderStyles(styles),
    featureControlFrameStyles: parseIdentifiedFCFStyles(styles),
    tableStyles: parseIdentifiedTableStyles(styles),
    docStyles: parseIdentifiedDocStyles(styles),
    viewportStyles: parseIdentifiedViewportStyles(styles),
    hatchStyles: parseIdentifiedHatchStyles(styles),
    xrayStyles: parseIdentifiedXRayStyles(styles),
  };
}

function parseIdentifiedCommonStyles(
  styles: BinStandardStyles,
): Array<Identifier & DucCommonStyle> {
  const result: Array<Identifier & DucCommonStyle> = [];
  const length = styles.commonStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.commonStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        const background = styleObj.background();
        const stroke = styleObj.stroke();

        if (id) {
          const parsedBackground = background
            ? parseElementBackgroundFromBinary(background)
            : null;
          const parsedStroke = stroke
            ? parseElementStrokeFromBinary(stroke, NEUTRAL_SCOPE)
            : null;

          if (parsedBackground && parsedStroke) {
            const commonStyle: Identifier & DucCommonStyle = {
              ...id,
              background: parsedBackground,
              stroke: parsedStroke,
            };

            result.push(commonStyle);
          }
        }
      }
    }
  }

  return result;
}

function parseIdentifiedStackLikeStyles(
  styles: BinStandardStyles
): Array<Identifier & DucStackLikeStyles> {
  const result: Array<Identifier & DucStackLikeStyles> = [];
  const length = styles.stackLikeStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.stackLikeStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for stack-like style properties
        if (id) {
          const stackLikeStyle: Identifier & DucStackLikeStyles = {
            ...id,
            // Add stack-like style properties here
            opacity: 1 as Percentage, // Default value
            labelingColor: "#000000",
          };

          result.push(stackLikeStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedTextStyles(
  styles: BinStandardStyles
): Array<Identifier & DucTextStyle> {
  const result: Array<Identifier & DucTextStyle> = [];
  const length = styles.textStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.textStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for text style properties
        if (id) {
          const backgroundArr = styleObj.background()
            ? [parseElementBackgroundFromBinary(styleObj.background())!]
            : [];
          const textStyleBase: Omit<Identifier & DucTextStyle, "background"> = {
            ...id,
            isLtr: true,
            fontFamily: 0,
            bigFontFamily: "",
            textAlign: "left" as any, // TODO: Fix branded type
            verticalAlign: "top" as any, // TODO: Fix branded type
            roundness: createDefaultPrecisionValue(),
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as Percentage, // Default value
            isBackwards: false,
            lineHeight: 1.2 as number & { _brand: "unitlessLineHeight" },
            lineSpacing: {
              value: createDefaultPrecisionValue(),
              type: "multiple" as any, // TODO: Fix branded type
            },
            obliqueAngle: 0 as Radian,
            fontSize: createDefaultPrecisionValue(),
            widthFactor: 0.7 as ScaleFactor,
            isUpsideDown: false,
          };
          const textStyle = { ...textStyleBase, background: backgroundArr } as Identifier & DucTextStyle;

          result.push(textStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedDimensionStyles(
  styles: BinStandardStyles
): Array<Identifier & DucDimensionStyle> {
  const result: Array<Identifier & DucDimensionStyle> = [];
  const length = styles.dimensionStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.dimensionStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for dimension style properties
        if (id) {
          const dimensionStyle: Identifier & DucDimensionStyle = {
            ...id,
            dimLine: undefined as any, // TODO: Fix type
            extLine: undefined as any, // TODO: Fix type
            textStyle: undefined as any, // TODO: Fix type
            symbols: undefined as any, // TODO: Fix type
            tolerance: undefined as any, // TODO: Fix type
            fit: undefined as any, // TODO: Fix type
          };

          result.push(dimensionStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedLeaderStyles(
  styles: BinStandardStyles
): Array<Identifier & DucLeaderStyle> {
  const result: Array<Identifier & DucLeaderStyle> = [];
  const length = styles.leaderStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.leaderStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for leader style properties
        if (id) {
          const leaderStyle: Identifier & DucLeaderStyle = {
            ...id,
            // Base properties
            roundness: createDefaultPrecisionValue(),
            background: [] as any, // TODO: Fix type
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as any, // TODO: Fix type
            // Leader-specific properties
            headsOverride: undefined as any, // TODO: Fix type
            dogleg: null as any, // TODO: Fix type
            textStyle: undefined as any, // TODO: Fix type
            textAttachment: undefined as any, // TODO: Fix type
            blockAttachment: undefined as any, // TODO: Fix type
          };

          result.push(leaderStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedFCFStyles(
  styles: BinStandardStyles
): Array<Identifier & DucFeatureControlFrameStyle> {
  const result: Array<Identifier & DucFeatureControlFrameStyle> = [];
  const length = styles.featureControlFrameStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.featureControlFrameStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for feature control frame style properties
        if (id) {
          const featureControlFrameStyle: Identifier &
            DucFeatureControlFrameStyle = {
            ...id,
            // Base properties
            roundness: createDefaultPrecisionValue(),
            background: [] as any, // TODO: Fix type
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as any, // TODO: Fix type
            // Feature control frame-specific properties
            textStyle: undefined as any, // TODO: Fix type
            layout: undefined as any, // TODO: Fix type
            symbols: undefined as any, // TODO: Fix type
            datumStyle: undefined as any, // TODO: Fix type
          };

          result.push(featureControlFrameStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedTableStyles(
  styles: BinStandardStyles
): Array<Identifier & DucTableStyle> {
  const result: Array<Identifier & DucTableStyle> = [];
  const length = styles.tableStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.tableStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for table style properties
        if (id) {
          const tableStyle: Identifier & DucTableStyle = {
            ...id,
            // Base properties
            roundness: createDefaultPrecisionValue(),
            background: [] as any, // TODO: Fix type
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as any, // TODO: Fix type
            // Table-specific properties
            flowDirection: undefined as any, // TODO: Fix type
            headerRowStyle: undefined as any, // TODO: Fix type
            dataRowStyle: undefined as any, // TODO: Fix type
            dataColumnStyle: undefined as any, // TODO: Fix type
          };

          result.push(tableStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedDocStyles(
  styles: BinStandardStyles
): Array<Identifier & DucDocStyle> {
  const result: Array<Identifier & DucDocStyle> = [];
  const length = styles.docStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.docStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for doc style properties
        if (id) {
          const docStyle: Identifier & DucDocStyle = {
            ...id,
            // Base properties
            roundness: createDefaultPrecisionValue(),
            background: [] as any, // TODO: Fix type
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as any, // TODO: Fix type
            // Doc-specific properties (DucTextStyle properties)
            isLtr: true,
            fontFamily: 0,
            bigFontFamily: "",
            textAlign: "left" as any, // TODO: Fix branded type
            verticalAlign: "top" as any, // TODO: Fix branded type
            isBackwards: false,
            // Required DucTextStyle properties
            lineHeight: 1.2 as number & { _brand: "unitlessLineHeight" },
            obliqueAngle: 0 as Radian,
            fontSize: createDefaultPrecisionValue(),
            widthFactor: 0.7 as ScaleFactor,
            isUpsideDown: false,
            lineSpacing: undefined as any, // TODO: Fix type
            // Required DucDocStyle properties
            paragraph: {
              firstLineIndent: createDefaultPrecisionValue(),
              hangingIndent: createDefaultPrecisionValue(),
              leftIndent: createDefaultPrecisionValue(),
              rightIndent: createDefaultPrecisionValue(),
              spaceBefore: createDefaultPrecisionValue(),
              spaceAfter: createDefaultPrecisionValue(),
              tabStops: [],
            },
            stackFormat: {
              autoStack: false,
              stackChars: [],
              properties: {
                upperScale: 0.7,
                lowerScale: 0.7,
                alignment: "center" as any, // TODO: Fix branded type
              },
            },
          };

          result.push(docStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedViewportStyles(
  styles: BinStandardStyles
): Array<Identifier & DucViewportStyle> {
  const result: Array<Identifier & DucViewportStyle> = [];
  const length = styles.viewportStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.viewportStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for viewport style properties
        if (id) {
          const viewportStyle: Identifier & DucViewportStyle = {
            ...id,
            // Base properties
            roundness: createDefaultPrecisionValue(),
            background: [] as any, // TODO: Fix type
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as any, // TODO: Fix type
            // Viewport-specific properties
            scaleIndicatorVisible: false, // Default value
          };

          result.push(viewportStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedHatchStyles(
  styles: BinStandardStyles
): Array<Identifier & DucHatchStyle> {
  const result: Array<Identifier & DucHatchStyle> = [];
  const length = styles.hatchStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.hatchStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for hatch style properties
        if (id) {
          const hatchStyle: Identifier & DucHatchStyle = {
            ...id,
            // Hatch-specific properties
            hatchStyle: undefined as any, // TODO: Fix type
            pattern: undefined as any, // TODO: Fix type
          };

          result.push(hatchStyle);
        }
      }
    }
  }

  return result;
}

function parseIdentifiedXRayStyles(
  styles: BinStandardStyles
): Array<Identifier & DucXRayStyle> {
  const result: Array<Identifier & DucXRayStyle> = [];
  const length = styles.xrayStylesLength();

  for (let i = 0; i < length; i++) {
    const identifiedStyle = styles.xrayStyles(i);
    if (identifiedStyle) {
      const idObj = identifiedStyle.id();
      const styleObj = identifiedStyle.style();

      if (idObj && styleObj) {
        const id = parseIdentifierFromBinary(idObj);
        // TODO: Implement parsing for XRay style properties
        if (id) {
          const xrayStyle: Identifier & DucXRayStyle = {
            ...id,
            // Base properties
            roundness: createDefaultPrecisionValue(),
            background: [] as any, // TODO: Fix type
            stroke: [] as any, // TODO: Fix type
            opacity: 1 as any, // TODO: Fix type
            // XRay-specific properties
            color: "#000000", // Default value
          };

          result.push(xrayStyle);
        }
      }
    }
  }

  return result;
}

/**
 * Parses an Identifier from FlatBuffers binary data.
 *
 * @param identifier - The FlatBuffers Identifier object to parse
 * @returns A complete Identifier object with the parsed data
 */
export function parseIdentifierFromBinary(
  identifier: BinIdentifier
): Identifier {
  return {
    id: identifier.id() || "",
    name: identifier.name() || "",
    description: identifier.description() || undefined,
  };
}

/**
 * Parses StandardOverrides from FlatBuffers binary data.
 *
 * @param overrides - The FlatBuffers StandardOverrides object to parse
 * @returns A partial StandardOverrides object with the parsed data
 */
export function parseStandardOverridesFromBinary(
  overrides: BinStandardOverrides
): StandardOverrides | null {
  if (!overrides) return null;

  // Parse activeGridSettingsId array
  const activeGridSettingsId: string[] = [];
  const activeGridSettingsIdLength = overrides.activeGridSettingsIdLength();
  for (let i = 0; i < activeGridSettingsIdLength; i++) {
    const id = overrides.activeGridSettingsId(i);
    if (id !== null) {
      activeGridSettingsId.push(id);
    }
  }

  const unitPrecision = overrides.unitPrecision();

  // For now, we'll use a neutral scope for parsing. In a real implementation,
  // this would need to be determined from context.
  const neutralScope: SupportedMeasures = "m";

  const elementsStrokeWidthOverrideValue =
    overrides.elementsStrokeWidthOverride();

  return {
    mainScope: (overrides.mainScope() as SupportedMeasures) || undefined,
    elementsStrokeWidthOverride: elementsStrokeWidthOverrideValue
      ? getPrecisionValueFromRaw(
          elementsStrokeWidthOverrideValue as RawValue,
          neutralScope,
          neutralScope
        )
      : undefined,
    commonStyleId: overrides.commonStyleId() || undefined,
    stackLikeStyleId: overrides.stackLikeStyleId() || undefined,
    textStyleId: overrides.textStyleId() || undefined,
    dimensionStyleId: overrides.dimensionStyleId() || undefined,
    leaderStyleId: overrides.leaderStyleId() || undefined,
    featureControlFrameStyleId:
      overrides.featureControlFrameStyleId() || undefined,
    tableStyleId: overrides.tableStyleId() || undefined,
    docStyleId: overrides.docStyleId() || undefined,
    viewportStyleId: overrides.viewportStyleId() || undefined,
    plotStyleId: overrides.plotStyleId() || undefined,
    hatchStyleId: overrides.hatchStyleId() || undefined,
    activeGridSettingsId:
      activeGridSettingsId.length > 0 ? activeGridSettingsId : undefined,
    activeSnapSettingsId: overrides.activeSnapSettingsId() || undefined,
    dashLineOverride: overrides.dashLineOverride() || undefined,
    unitPrecision: unitPrecision
      ? parseUnitPrecisionFromBinary(unitPrecision)
      : undefined,
  };
}

/**
 * Parses a Standard from FlatBuffers binary data.
 *
 * @param standard - The FlatBuffers Standard object to parse
 * @returns A partial Standard object with the parsed data
 */
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
    viewSettings: null, // TODO: Implement parseStandardViewSettingsFromBinary
    units: null, // TODO: Implement parseStandardUnitsFromBinary
    validation: null, // TODO: Implement parseStandardValidationFromBinary
  };
}
