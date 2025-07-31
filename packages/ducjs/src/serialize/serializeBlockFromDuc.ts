import {
  DucBlock as BinDucBlock,
  DucBlockAttributeDefinition as BinDucBlockAttributeDefinition,
  DucBlockAttributeDefinitionEntry as BinDucBlockAttributeDefinitionEntry
} from 'ducjs/duc';
import { serializeDucElement } from 'ducjs/serialize/serializeElementFromDuc';
import { DucBlock } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucBlock = (
  builder: flatbuffers.Builder,
  block: DucBlock,
): flatbuffers.Offset => {
  // Create string offsets
  const idOffset = builder.createString(block.id);
  const labelOffset = builder.createString(block.label);
  const descriptionOffset = block.description ? builder.createString(block.description) : null;

  // Serialize elements
  const elementOffsets = block.elements.map(element => 
    serializeDucElement(builder, element)
  );
  const elementsVector = BinDucBlock.createElementsVector(builder, elementOffsets);

  // Serialize attribute definitions if present
  let attributeDefinitionsVector: flatbuffers.Offset | null = null;
  if (block.attributeDefinitions && Object.keys(block.attributeDefinitions).length > 0) {
    const attributeDefOffsets = Object.entries(block.attributeDefinitions).map(([name, definition]) => {
      const nameOffset = builder.createString(name);
      const tagOffset = builder.createString(definition.tag);
      const promptOffset = builder.createString(definition.prompt);
      const defaultValueOffset = builder.createString(definition.defaultValue);

      // Create attribute definition
      BinDucBlockAttributeDefinition.startDucBlockAttributeDefinition(builder);
      BinDucBlockAttributeDefinition.addTag(builder, tagOffset);
      BinDucBlockAttributeDefinition.addPrompt(builder, promptOffset);
      BinDucBlockAttributeDefinition.addDefaultValue(builder, defaultValueOffset);
      if (definition.isConstant !== undefined) {
        BinDucBlockAttributeDefinition.addIsConstant(builder, definition.isConstant);
      }
      const attributeDefOffset = BinDucBlockAttributeDefinition.endDucBlockAttributeDefinition(builder);

      // Create attribute definition entry
      BinDucBlockAttributeDefinitionEntry.startDucBlockAttributeDefinitionEntry(builder);
      BinDucBlockAttributeDefinitionEntry.addKey(builder, nameOffset);
      BinDucBlockAttributeDefinitionEntry.addValue(builder, attributeDefOffset);
      return BinDucBlockAttributeDefinitionEntry.endDucBlockAttributeDefinitionEntry(builder);
    });

    attributeDefinitionsVector = BinDucBlock.createAttributeDefinitionsVector(builder, attributeDefOffsets);
  }

  // Create the block
  BinDucBlock.startDucBlock(builder);
  BinDucBlock.addId(builder, idOffset);
  BinDucBlock.addLabel(builder, labelOffset);
  if (descriptionOffset) {
    BinDucBlock.addDescription(builder, descriptionOffset);
  }
  BinDucBlock.addVersion(builder, block.version || 1);
  BinDucBlock.addElements(builder, elementsVector);
  if (attributeDefinitionsVector) {
    BinDucBlock.addAttributeDefinitions(builder, attributeDefinitionsVector);
  }

  return BinDucBlock.endDucBlock(builder);
};
