import { DucRegion as BinDucRegion } from "ducjs/duc";
import { parseDucStackBaseFromBinary } from "ducjs/parse/parseElementFromBinary";
import { DucRegion } from "ducjs/types/elements";

/**
 * Parses a DucRegion from FlatBuffers binary data.
 *
 * @param region - The FlatBuffers DucRegion object to parse
 * @returns A partial DucRegion object with the parsed data
 */
export function parseRegionFromBinary(region: BinDucRegion): DucRegion | null {
  const id = region.id()!;
  const stackBase = parseDucStackBaseFromBinary(region.stackBase());
  const booleanOperation = region.booleanOperation()!;

  if (!stackBase) {
    return null;
  }

  return {
    id,
    ...stackBase,
    booleanOperation,
  };
}
