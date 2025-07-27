import {
  DucGroup as BinDucGroup,
} from 'ducjs/duc';
import { DucGroup } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucGroup = (
  builder: flatbuffers.Builder,
  group: DucGroup,
): flatbuffers.Offset => {


  return BinDucGroup.endDucGroup(builder);
}; 