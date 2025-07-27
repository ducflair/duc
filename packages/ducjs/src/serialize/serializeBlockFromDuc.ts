import {
  DucBlock as BinDucBlock
} from 'ducjs/duc';
import { DucBlock } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucBlock = (
  builder: flatbuffers.Builder,
  block: DucBlock,
): flatbuffers.Offset => {


  return BinDucBlock.endDucBlock(builder);
};
