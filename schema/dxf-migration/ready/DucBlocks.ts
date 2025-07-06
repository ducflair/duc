

export type DucBlockDuplicationArray = {
  rows: number;
  cols: number;
  rowSpacing: PrecisionValue;
  colSpacing: PrecisionValue;
}

export type DucBlockAttributeDetailsType = {
  tag: string;
  defaultValue: string;
  prompt?: string;
  fieldLength: number;
};

export type DucBlock = {
  id: string;
  label: string;
  description?: string;
  version: number;
  readonly: boolean;

  elements: DucElement[];

  // Dynamic attributes
  // The attributes object defines the variable schema (what variables exist, their defaults, where they display), and the attributeValues in each instance provides the actual values for those variables.
  attributes?: { [attributeName: string]: DucBlockAttributeDetailsType };
};

export type DucBlockInstanceElement = _DucElementBase & { //Instance of a block definition
  type: "blockinstance";
  blockId: string;

  // Override properties of elements within this block instance
  blockElementOverrides?: {
    [elementId: string]: string; // JSON stringified object
  };
  duplicationArray: DucBlockDuplicationArray | null;
};