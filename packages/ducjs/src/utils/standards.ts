import { ValueOf } from "ducjs/types/utility-types";

export const DESIGN_STANDARD = {
  DUC: 10,    // DUC (default)
  ABNT: 11,   // Brazilian Association of Technical Standards
  ANSI: 12,   // American National Standards Institute
  ISO: 13,    // International Organization for Standardization
  DIN: 14,    // German Institute for Standardization
  JIS: 15,    // Japanese Industrial Standards
  GB: 16,     // Chinese National Standards
  BSI: 17,    // British Standards Institution
} as const;


export type DesignStandard = ValueOf<typeof DESIGN_STANDARD>;