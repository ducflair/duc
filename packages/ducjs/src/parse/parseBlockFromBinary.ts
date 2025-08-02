import {
  DucBlock as BinDucBlock,
  DucBlockAttributeDefinitionEntry as BinDucBlockAttributeDefinitionEntry,
  DucBlockAttributeDefinition as BinDucBlockAttributeDefinition,
} from "ducjs/duc";
import { DucBlock, DucElement, DucBlockAttributeDefinition } from "ducjs/types/elements";
import { parseElementFromBinary } from "ducjs/parse/parseElementFromBinary";

export const parseBlockFromBinary = (
  block: BinDucBlock | null,
  version: string
): DucBlock | null => {
  if (!block) return null;

  const id = block.id()!;
  const label = block.label() ?? undefined;
  const description = block.description() ?? undefined;
  const blockVersion = block.version() ?? undefined;

  // Parse elements
  const elements: DucElement[] = [];
  const elLen = block.elementsLength();
  for (let i = 0; i < elLen; i++) {
    const wrapper = block.elements(i);
    if (!wrapper) continue;
    const parsed = parseElementFromBinary(wrapper, version);
    if (parsed) elements.push(parsed);
  }

  // Parse attribute_definitions into a record keyed by tag
  const attributeDefinitions: Record<string, DucBlockAttributeDefinition> = {};
  const defLen = block.attributeDefinitionsLength?.() ?? 0;
  for (let i = 0; i < defLen; i++) {
    const entry: BinDucBlockAttributeDefinitionEntry | null = block.attributeDefinitions(i);
    if (!entry) continue;
    const key = entry.key();
    const value: BinDucBlockAttributeDefinition | null = entry.value();
    if (!key || !value) continue;

    const tag = value.tag();
    if (tag === null) continue;

    const prompt = value.prompt();
    const defaultValue = value.defaultValue();
    const isConstant = value.isConstant();

    // Build minimally required shape, adding optionals only if present
    const def: DucBlockAttributeDefinition = {
      tag,
      // Note: do NOT synthesize defaults; include only when present
      ...(prompt !== null ? { prompt } : {}),
      ...(defaultValue !== null ? { defaultValue } : {}),
      ...(isConstant !== null ? { isConstant } : {}),
    } as DucBlockAttributeDefinition;

    attributeDefinitions[key] = def;
  }

  const baseBlock = {
    id,
    elements,
    attributeDefinitions,
  } as Pick<DucBlock, "id" | "elements" | "attributeDefinitions">;

  const withLabel = label !== undefined ? { ...baseBlock, label } : baseBlock;
  const withDesc = description !== undefined ? { ...withLabel, description } : withLabel;
  const withVersion = blockVersion !== undefined ? { ...withDesc, version: blockVersion } : withDesc;

  return withVersion as DucBlock;
};
