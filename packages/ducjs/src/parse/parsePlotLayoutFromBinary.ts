import {
  Margins as BinDucMargins,
  PlotLayout as BinPlotLayout,
} from "ducjs/duc";
import { getPrecisionValueFromRaw } from "ducjs/technical/scopes";
import { RawValue, Scope } from "ducjs/types";
import { PlotLayout } from "ducjs/types/elements";

/**
 * Parses a Margins from FlatBuffers binary data.
 *
 * @param margins - The FlatBuffers Margins object to parse
 * @returns A Margins object with the parsed data
 */
export function parseMarginsFromBinary(
  margins: BinDucMargins,
  currentScope: Scope
): PlotLayout["margins"] | null {
  if (!margins) {
    return null;
  }

  // Parse margin values, using default values for any missing properties
  const top = margins.top();
  const right = margins.right();
  const bottom = margins.bottom();
  const left = margins.left();

  return {
    top:
      top !== undefined
        ? getPrecisionValueFromRaw(top as RawValue, currentScope, currentScope)
        : (undefined as any),
    right:
      right !== undefined
        ? getPrecisionValueFromRaw(
            right as RawValue,
            currentScope,
            currentScope
          )
        : (undefined as any),
    bottom:
      bottom !== undefined
        ? getPrecisionValueFromRaw(
            bottom as RawValue,
            currentScope,
            currentScope
          )
        : (undefined as any),
    left:
      left !== undefined
        ? getPrecisionValueFromRaw(left as RawValue, currentScope, currentScope)
        : (undefined as any),
  };
}

/**
 * Parses a PlotLayout from FlatBuffers binary data.
 *
 * @param layout - The FlatBuffers PlotLayout object to parse
 * @returns A PlotLayout object with the parsed data
 */
export function parsePlotLayoutFromBinary(
  layout: BinPlotLayout,
  currentScope: Scope
): PlotLayout | null {
  if (!layout) {
    return null;
  }

  const marginsData = layout.margins();

  // Check if we have all required properties for a complete PlotLayout
  if (marginsData === null) {
    return null;
  }

  const margins = parseMarginsFromBinary(marginsData, currentScope);
  if (!margins) {
    return null;
  }

  return {
    margins,
  };
}
