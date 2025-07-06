import * as flatbuffers from 'flatbuffers';
import {
  DucBlock as BinDucBlock,
  DucBlockAttribute as BinDucBlockAttribute,
  DucBlockAttributeDetails as BinDucBlockAttributeDetails,
  SimplePoint,
} from '@duc/canvas/duc/duc-ts/duc';
import { DucBlock, DucBlockAttributeDetailsType } from '@duc/canvas/element/types';
import { serializeDucElement } from './serializeElementFromDuc';
import { getPrecisionValueField } from './serializationUtils';

export const serializeDucBlock = (
  builder: flatbuffers.Builder,
  block: DucBlock,
  forRenderer: boolean = false
): flatbuffers.Offset => {
  // Create string offsets
  const idOffset = builder.createString(block.id);
  const labelOffset = builder.createString(block.label);
  const descriptionOffset = block.description ? builder.createString(block.description) : null;

  // Serialize elements
  const elementOffsets = block.elements.map(element => 
    serializeDucElement(builder, element, forRenderer)
  );
  const elementsVector = BinDucBlock.createElementsVector(builder, elementOffsets);

  // Serialize attributes
  const attributeOffsets = block.attributes 
    ? Object.entries(block.attributes).map(([name, details]) => 
        serializeDucBlockAttribute(builder, { name, details: details as DucBlockAttributeDetailsType }, forRenderer)
      )
    : [];
  const attributesVector = attributeOffsets.length > 0 
    ? BinDucBlock.createAttributesVector(builder, attributeOffsets)
    : null;

  // Create the block
  BinDucBlock.startDucBlock(builder);
  BinDucBlock.addId(builder, idOffset);
  BinDucBlock.addLabel(builder, labelOffset);
  if (descriptionOffset) {
    BinDucBlock.addDescription(builder, descriptionOffset);
  }
  BinDucBlock.addVersion(builder, block.version);
  BinDucBlock.addElements(builder, elementsVector);
  if (attributesVector) {
    BinDucBlock.addAttributes(builder, attributesVector);
  }

  return BinDucBlock.endDucBlock(builder);
};

const serializeDucBlockAttribute = (
  builder: flatbuffers.Builder,
  attribute: { name: string; details: DucBlockAttributeDetailsType },
  forRenderer: boolean = false
): flatbuffers.Offset => {
  const nameOffset = builder.createString(attribute.name);
  const detailsOffset = serializeDucBlockAttributeDetails(builder, attribute.details, forRenderer);

  BinDucBlockAttribute.startDucBlockAttribute(builder);
  BinDucBlockAttribute.addName(builder, nameOffset);
  BinDucBlockAttribute.addDetails(builder, detailsOffset);

  return BinDucBlockAttribute.endDucBlockAttribute(builder);
};

const serializeDucBlockAttributeDetails = (
  builder: flatbuffers.Builder,
  details: DucBlockAttributeDetailsType,
  forRenderer: boolean = false
): flatbuffers.Offset => {
  const tagOffset = builder.createString(details.tag);
  const defaultValueOffset = builder.createString(details.defaultValue);
  const promptOffset = details.prompt ? builder.createString(details.prompt) : null;

  // Serialize position if present
  let positionOffset = null;
  if (details.position) {
    positionOffset = SimplePoint.createSimplePoint(
      builder,
      getPrecisionValueField(details.position.x, forRenderer),
      getPrecisionValueField(details.position.y, forRenderer)
    );
  }

  BinDucBlockAttributeDetails.startDucBlockAttributeDetails(builder);
  BinDucBlockAttributeDetails.addTag(builder, tagOffset);
  BinDucBlockAttributeDetails.addDefaultValue(builder, defaultValueOffset);
  if (promptOffset) {
    BinDucBlockAttributeDetails.addPrompt(builder, promptOffset);
  }
  if (positionOffset) {
    BinDucBlockAttributeDetails.addPosition(builder, positionOffset);
  }

  return BinDucBlockAttributeDetails.endDucBlockAttributeDetails(builder);
}; 