import {
  DucBlock as BinDucBlock
} from 'ducjs/duc';
import { DucBlock, DucElement } from 'ducjs/types/elements';
import { parseElementFromBinary } from './parseElementFromBinary';

export const parseBlockFromBinary = (
  block: BinDucBlock,
  version: string
): Partial<DucBlock> | null => {
  if (!block) return null;

  const id = block.id() || undefined;
  const label = block.label() || undefined;
  const description = block.description() || undefined;
  const blockVersion = block.version() || undefined;

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
    id,
    label,
    description,
    version: blockVersion,
    elements
  };
};
