import {
  DucBlock as BinDucBlock
} from 'ducjs/duc';
import { DucBlock, DucElement } from 'ducjs/types/elements';
import { parseElementFromBinary } from 'ducjs/parse/parseElementFromBinary';

export const parseBlockFromBinary = (
  block: BinDucBlock,
  version: string
): DucBlock | null => {
  if (!block) return null;

  const id = block.id();
  const label = block.label();
  const description = block.description();
  const blockVersion = block.version();

  // Parse elements
  const elements: DucElement[] = [];
  for (let i = 0; i < block.elementsLength(); i++) {
    const element = block.elements(i);
    if (element) {
      const parsedElement = parseElementFromBinary(element, version);
      if (parsedElement) {
        elements.push(parsedElement as DucElement);
      }
    }
  }

  return {
    id: id!,
    label: label!,
    description: description!,
    version: blockVersion,
    elements,
    attributeDefinitions: {}, // TODO: Parse attribute definitions if available
  };
};
