import { DucLayer as BinDucLayer, DucLayerOverrides as BinDucLayerOverrides } from "ducjs/duc";
import { parseDucStackBaseFromBinary } from "ducjs/parse/parseElementFromBinary";
import { parseElementBackgroundFromBinary, parseElementStrokeFromBinary } from "ducjs/parse/parseElementStyleFromBinary";
import { Scope } from "ducjs/types";
import { DucLayer } from "ducjs/types/elements";


/**
 * Parses a DucLayerOverrides from FlatBuffers binary data.
 * 
 * @param overrides - The FlatBuffers DucLayerOverrides object to parse
 * @returns A partial DucLayerOverrides object with the parsed data
 */
export function parseLayerOverridesFromBinary(overrides: BinDucLayerOverrides | null, scope: Scope): DucLayer["overrides"] | null {
  if (!overrides) {
    return null;
  }
  
  const stroke = overrides.stroke();
  const background = overrides.background();
  
  const parsedStroke = stroke !== null ? parseElementStrokeFromBinary(stroke, scope) : null;
  const parsedBackground = background !== null ? parseElementBackgroundFromBinary(background, scope) : null;
  
  // Both stroke and background are required for a valid overrides object
  if (parsedStroke !== null && parsedBackground !== null) {
    return {
      stroke: parsedStroke,
      background: parsedBackground,
    };
  }
  
  // If we can't create a complete overrides object, return null
  return null;
}

/**
 * Parses a DucLayer from FlatBuffers binary data.
 * 
 * @param layer - The FlatBuffers DucLayer object to parse
 * @returns A partial DucLayer object with the parsed data
 */
export function parseLayerFromBinary(layer: BinDucLayer, scope: Scope): DucLayer | null {
  const id = layer.id();
  const stackBase = layer.stackBase();
  const readonly = layer.readonly();
  const overrides = layer.overrides();
  
  const parsedStackBase = parseDucStackBaseFromBinary(stackBase);
  if (!parsedStackBase) {
    return null;
  }

  const parsedOverrides = overrides !== null ? parseLayerOverridesFromBinary(overrides, scope) : null;
  
  return {
    id: id!,
    ...parsedStackBase,
    readonly,
    overrides: parsedOverrides,
  };
}
