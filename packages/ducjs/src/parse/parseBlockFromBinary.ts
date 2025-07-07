import {
  DucBlock as BinDucBlock,
  DucBlockAttribute as BinDucBlockAttribute,
  DucBlockAttributeDetails as BinDucBlockAttributeDetails,
} from 'ducjs/duc';
import { getPrecisionValueFromRaw, NEUTRAL_SCOPE } from 'ducjs/utils/scopes';
import { DucBlock, DucBlockAttributeDetailsType, DucElement } from 'ducjs/types/elements';
import { RawValue } from 'ducjs/types';
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

  // Parse attributes
  const attributes: Record<string, DucBlockAttributeDetailsType> = {};
  for (let i = 0; i < block.attributesLength(); i++) {
    const attribute = block.attributes(i);
    if (attribute) {
      const parsedAttribute = parseBlockAttributeFromBinary(attribute);
      if (parsedAttribute) {
        attributes[parsedAttribute.name] = parsedAttribute.details;
      }
    }
  }

  return {
    id,
    label,
    description,
    version: blockVersion,
    elements,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
  };
};

const parseBlockAttributeFromBinary = (
  attribute: BinDucBlockAttribute
): { name: string; details: DucBlockAttributeDetailsType } | null => {
  if (!attribute) return null;

  const name = attribute.name() || '';
  const details = parseBlockAttributeDetailsFromBinary(attribute.details());

  if (!details) return null;

  return {
    name,
    details,
  };
};

const parseBlockAttributeDetailsFromBinary = (
  details: BinDucBlockAttributeDetails | null
): DucBlockAttributeDetailsType | null => {
  if (!details) return null;

  const tag = details.tag() || '';
  const defaultValue = details.defaultValue() || '';
  const prompt = details.prompt() || undefined;

  const position = details.position();
  const positionParsed = position ? {
    x: getPrecisionValueFromRaw(position.x() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
    y: getPrecisionValueFromRaw(position.y() as RawValue, NEUTRAL_SCOPE, NEUTRAL_SCOPE),
  } : undefined;

  return {
    tag,
    defaultValue,
    prompt,
    position: positionParsed,
  };
}; 