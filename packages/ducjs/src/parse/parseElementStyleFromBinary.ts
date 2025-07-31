import {
  DucHatchStyle as BinDucHatchStyle,
  DucImageFilter as BinDucImageFilter,
  ElementContentBase as BinElementContentBase,
  ElementStroke as BinElementStroke,
  TilingProperties as DucTilingProperties,
  _DucElementStylesBase as BinElementStyleBase,
  ELEMENT_CONTENT_PREFERENCE,
  HATCH_STYLE,
  STROKE_PLACEMENT,
} from "ducjs/duc";
import { parsePoint } from "ducjs/parse/parseElementFromBinary";
import {
  getPrecisionValueFromRaw,
  NEUTRAL_SCOPE,
} from "ducjs/technical/scopes";
import { PrecisionValue, RawValue, Scope } from "ducjs/types";
import {
  _DucElementStylesBase,
  DucHatchStyle,
  DucImageFilter,
  ElementContentBase,
  ElementStroke,
  StrokeStyle,
  TilingProperties,
} from "ducjs/types/elements";
import { Percentage, Radian } from "ducjs/types/geometryTypes";

import {
  ElementBackground as BinElementBackground,
  StrokeSides as BinStrokeSides,
  StrokeStyle as BinStrokeStyle,
  STROKE_CAP,
  STROKE_JOIN,
  STROKE_PREFERENCE,
  STROKE_SIDE_PREFERENCE,
} from "ducjs/duc";
import { ElementBackground, StrokeSides } from "ducjs/types/elements";

/**
 * Parses a StrokeStyle from FlatBuffers binary data.
 *
 * @param strokeStyle - The FlatBuffers StrokeStyle object to parse
 * @returns A partial StrokeStyle object with the parsed data
 */
export function parseStrokeStyleFromBinary(
  strokeStyle: BinStrokeStyle | null
): StrokeStyle | null {
  if (!strokeStyle) {
    return null;
  }

  const preference = strokeStyle.preference();
  const cap = strokeStyle.cap();
  const join = strokeStyle.join();

  // Parse dash array
  const dash: number[] = [];
  const dashLength = strokeStyle.dashLength();
  for (let i = 0; i < dashLength; i++) {
    const value = strokeStyle.dash(i);
    if (value !== null) {
      dash.push(value);
    }
  }

  const dashLineOverride = strokeStyle.dashLineOverride();

  return {
    preference: preference as STROKE_PREFERENCE,
    ...(cap !== null && { cap: cap as STROKE_CAP }),
    ...(join !== null && { join: join as STROKE_JOIN }),
    dash,
    ...(dashLineOverride !== null && { dashLineOverride }),
  };
}

/**
 * Parses an ElementBackground from FlatBuffers binary data.
 *
 * @param background - The FlatBuffers ElementBackground object to parse
 * @param scope - The scope for precision value conversions
 * @returns A partial ElementBackground object with the parsed data
 */
export function parseElementBackgroundFromBinary(
  background: BinElementBackground | null,
  scope: Scope
): ElementBackground | null {
  if (!background) {
    return null;
  }

  const content = background.content();

  // Check if we have all required properties for a complete ElementBackground
  if (content === null) {
    return null;
  }

  const parsedContent = parseElementContentBaseFromBinary(content, scope);
  if (parsedContent === null) {
    return null;
  }

  return {
    content: parsedContent,
  };
}

/**
 * Parses a StrokeSides from FlatBuffers binary data.
 *
 * @param strokeSides - The FlatBuffers StrokeSides object to parse
 * @returns A complete StrokeSides object with the parsed data, or null if required properties are missing
 */
export function parseStrokeSidesFromBinary(
  strokeSides: BinStrokeSides | null
): StrokeSides | null {
  if (!strokeSides) {
    return null;
  }

  const preference = strokeSides.preference();

  // Parse values array
  const values: number[] = [];
  const valuesLength = strokeSides.valuesLength();
  for (let i = 0; i < valuesLength; i++) {
    const value = strokeSides.values(i);
    if (value !== null) {
      values.push(value);
    }
  }

  // Check if we have the required preference property
  if (preference === null) {
    return null;
  }

  return {
    preference: preference as STROKE_SIDE_PREFERENCE,
    values,
  };
}

/**
 * Parses an ElementStroke from FlatBuffers binary data.
 *
 * @param stroke - The FlatBuffers ElementStroke object to parse
 * @returns A partial ElementStroke object with the parsed data
 */
export function parseElementStrokeFromBinary(
  stroke: BinElementStroke | null,
  elementScope: Scope
): ElementStroke | null {
  if (!stroke) {
    return null;
  }

  const content = stroke.content();
  const width = stroke.width();
  // Convert width number to PrecisionValue
  const precisionWidth = getPrecisionValueFromRaw(width as RawValue, elementScope, elementScope);
  const style = stroke.style();
  const placement = stroke.placement();
  const strokeSides = stroke.strokeSides();

  // Check if we have all required properties for a complete ElementStroke
  const parsedContent =
    content !== null ? parseElementContentBaseFromBinary(content, elementScope) : null;
  if (parsedContent === null) {
    return null;
  }

  // Parse stroke style, ensuring we have at least the required preference property
  let parsedStyle: StrokeStyle | undefined = undefined;
  if (style !== null) {
    const tempStyle = parseStrokeStyleFromBinary(style);
    if (tempStyle !== null && tempStyle.preference !== undefined) {
      parsedStyle = tempStyle as StrokeStyle;
    }
  }

  // If we don't have a valid style, return null since it's a required property
  if (parsedStyle === undefined) {
    return null;
  }

  return {
    content: parsedContent,
    width: precisionWidth,
    style: parsedStyle,
    placement: placement!,
    ...(strokeSides !== null && {
      strokeSides: parseStrokeSidesFromBinary(strokeSides) ?? undefined,
    }),
  };
}

/**
 * Parses a DucImageFilter from FlatBuffers binary data.
 *
 * @param imageFilter - The FlatBuffers DucImageFilter object to parse
 * @returns A partial DucImageFilter object with the parsed data
 */
export function parseDucImageFilterFromBinary(
  imageFilter: BinDucImageFilter | null
): DucImageFilter | null {
  if (!imageFilter) {
    return null;
  }

  const brightness = imageFilter.brightness();
  const contrast = imageFilter.contrast();

  return {
    brightness: brightness as Percentage,
    contrast: contrast as Percentage,
  };
}

/**
 * Parses a DucHatchStyle from FlatBuffers binary data.
 *
 * @param hatchStyle - The FlatBuffers DucHatchStyle object to parse
 * @returns A partial DucHatchStyle object with the parsed data
 */
export function parseDucHatchStyleFromBinary(
  hatchStyle: BinDucHatchStyle | null,
  scope: Scope
): DucHatchStyle | null {
  if (!hatchStyle) {
    return null;
  }

  const hatchStyleType = hatchStyle.hatchStyle();
  const patternName = hatchStyle.patternName();
  const patternScale = hatchStyle.patternScale();
  const patternAngle = hatchStyle.patternAngle();
  const patternOrigin = hatchStyle.patternOrigin();
  const patternDouble = hatchStyle.patternDouble();
  const customPattern = hatchStyle.customPattern();

  // Check if we have all required properties for a complete DucHatchStyle
  if (
    hatchStyleType === null ||
    patternName === null ||
    patternOrigin === null
  ) {
    return null;
  }

  const pattern = {
    name: patternName,
    scale: patternScale,
    angle: patternAngle as Radian,
    origin: parsePoint(patternOrigin, scope)!,
    double: patternDouble ?? null!,
  };

  // For now, only return the hatchStyle and pattern if we have all required properties
  return {
    hatchStyle: hatchStyleType as HATCH_STYLE,
    pattern,
  };
}

/**
 * Parses a TilingProperties from FlatBuffers binary data.
 *
 * @param tilingProperties - The FlatBuffers TilingProperties object to parse
 * @returns A partial TilingProperties object with the parsed data
 */
export function parseTilingPropertiesFromBinary(
  tilingProperties: DucTilingProperties | null
): TilingProperties | null {
  if (!tilingProperties) {
    return null;
  }

  const sizeInPercent = tilingProperties.sizeInPercent();
  const angle = tilingProperties.angle();
  const spacing = tilingProperties.spacing();
  const offsetX = tilingProperties.offsetX();
  const offsetY = tilingProperties.offsetY();

  return {
    sizeInPercent: sizeInPercent as Percentage,
    angle: angle as Radian,
    ...(spacing !== null && { spacing }),
    ...(offsetX !== null && { offsetX }),
    ...(offsetY !== null && { offsetY }),
  };
}

/**
 * Parses a _DucElementStylesBase from FlatBuffers binary data.
 *
 * @param baseStyle - The FlatBuffers _DucElementStylesBase object to parse
 * @param scope - The scope for precision value conversions
 * @returns A partial _DucElementStylesBase object with the parsed data
 */
export function parseElementStyleFromBinary(
  baseStyle: BinElementStyleBase,
  scope: Scope,
): _DucElementStylesBase | null {
  if (!baseStyle) {
    return null;
  }

  const roundness = baseStyle.roundness();
  const blending = baseStyle.blending();
  const opacity = baseStyle.opacity();

  // Parse background array
  const backgrounds: ElementBackground[] = [];
  const backgroundLength = baseStyle.backgroundLength();
  for (let i = 0; i < backgroundLength; i++) {
    const background = baseStyle.background(i);
    if (background) {
      const parsedBackground = parseElementBackgroundFromBinary(background, scope);
      parsedBackground && backgrounds.push(parsedBackground);
    }
  }

  // Parse stroke array
  const strokes: ElementStroke[] = [];
  const strokeLength = baseStyle.strokeLength();
  for (let i = 0; i < strokeLength; i++) {
    const stroke = baseStyle.stroke(i);
    if (stroke) {
      const parsedStroke = parseElementStrokeFromBinary(stroke, scope);
      parsedStroke && strokes.push(parsedStroke);
    }
  }

  return {
    roundness: getPrecisionValueFromRaw(roundness as RawValue, scope, scope),
    blending: blending ?? undefined,
    opacity: opacity as Percentage,
    background: backgrounds,
    stroke: strokes,
  };
}

/**
 * Parses an ElementContentBase from FlatBuffers binary data.
 *
 * @param contentBase - The FlatBuffers ElementContentBase object to parse
 * @param scope - The scope for precision value conversions
 * @returns A partial ElementContentBase object with the parsed data
 */
export function parseElementContentBaseFromBinary(
  contentBase: BinElementContentBase | null,
  scope: Scope
): ElementContentBase | null {
  if (!contentBase) {
    return null;
  }

  const preference = contentBase.preference();
  const src = contentBase.src();
  const visible = contentBase.visible();
  const opacity = contentBase.opacity();
  const tiling = contentBase.tiling();
  const hatch = contentBase.hatch();
  const imageFilter = contentBase.imageFilter();

  // Check if we have all required properties for a complete ElementContentBase
  if (preference === null || src === null) {
    return null;
  }

  return {
    preference: preference as ELEMENT_CONTENT_PREFERENCE,
    src,
    visible,
    opacity: opacity as Percentage,
    ...(tiling !== null && {
      tiling: parseTilingPropertiesFromBinary(tiling) ?? undefined,
    }),
    ...(hatch !== null && {
      hatch: parseDucHatchStyleFromBinary(hatch, scope) ?? undefined,
    }),
    ...(imageFilter !== null && {
      imageFilter: parseDucImageFilterFromBinary(imageFilter) ?? undefined,
    }),
  };
}
