import { DucBlockAttributeDefinition as BinDucBlockAttributeDefinition, DucBlockDuplicationArray as BinDucBlockDuplicationArray } from "ducjs/duc";
import { DucBlockAttributeDefinition, DucBlockDuplicationArray } from "ducjs/types/elements";
import { getPrecisionValueFromRaw, NEUTRAL_SCOPE } from "ducjs/technical/scopes";
import { RawValue } from "ducjs/types";

/**
 * Parses a DucBlockDuplicationArray from FlatBuffers binary data.
 * 
 * @param duplicationArray - The FlatBuffers DucBlockDuplicationArray object to parse
 * @returns A DucBlockDuplicationArray object with the parsed data
 */
export function parseDucBlockDuplicationArrayFromBinary(duplicationArray: BinDucBlockDuplicationArray | null): DucBlockDuplicationArray | null {
  if (!duplicationArray) {
    return null;
  }
  
  const rows = duplicationArray.rows();
  const cols = duplicationArray.cols();
  const rowSpacing = duplicationArray.rowSpacing();
  const colSpacing = duplicationArray.colSpacing();
  
  // Check if we have all required properties for a complete DucBlockDuplicationArray
  if (rows === null || cols === null || rowSpacing === null || colSpacing === null) {
    return null;
  }
  
  return {
    rows,
    cols,
    rowSpacing: getPrecisionValueFromRaw(rowSpacing as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
    colSpacing: getPrecisionValueFromRaw(colSpacing as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
  };
}

/**
 * Parses a DucBlockAttributeDefinition from FlatBuffers binary data.
 * 
 * @param attributeDefinition - The FlatBuffers DucBlockAttributeDefinition object to parse
 * @returns A DucBlockAttributeDefinition object with the parsed data
 */
export function parseDucBlockAttributeDefinitionFromBinary(attributeDefinition: BinDucBlockAttributeDefinition): DucBlockAttributeDefinition | null {
  if (!attributeDefinition) {
    return null;
  }
  
  const tag = attributeDefinition.tag();
  const prompt = attributeDefinition.prompt();
  const defaultValue = attributeDefinition.defaultValue();
  const isConstant = attributeDefinition.isConstant();
  
  // Check if we have all required properties for a complete DucBlockAttributeDefinition
  if (tag === null) {
    return null;
  }
  
  return {
    tag,
    ...(prompt !== null && { prompt }),
    defaultValue: defaultValue !== null ? defaultValue : "",
    isConstant: isConstant !== null ? isConstant : false,
  };
}

