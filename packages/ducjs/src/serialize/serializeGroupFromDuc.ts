import {
  DucGroup as BinDucGroup,
} from 'ducjs/duc';
import { serializeDucStackBase } from 'ducjs/serialize/serializeDucStackBase';
import { DucGroup } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucGroup = (
  builder: flatbuffers.Builder,
  group: DucGroup,
): flatbuffers.Offset => {
  // Create string offsets
  const idOffset = builder.createString(group.id);

  // Serialize the stack base containing all the common properties
  const stackBaseOffset = serializeDucStackBase(builder, group);
  
  // Create the group
  BinDucGroup.startDucGroup(builder);
  BinDucGroup.addId(builder, idOffset);
  BinDucGroup.addStackBase(builder, stackBaseOffset);

  return BinDucGroup.endDucGroup(builder);
}; 