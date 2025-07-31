import { DucRegion as BinDucRegion } from 'ducjs/duc';
import { serializeDucStackBase } from 'ducjs/serialize/serializeDucStackBase';
import type { DucRegion } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeRegionFromDuc = (
  builder: flatbuffers.Builder,
  region: DucRegion
): flatbuffers.Offset => {
  const idOffset = builder.createString(region.id);
  const stackBaseOffset = serializeDucStackBase(builder, region);

  BinDucRegion.startDucRegion(builder);
  BinDucRegion.addId(builder, idOffset);
  BinDucRegion.addStackBase(builder, stackBaseOffset);
  if (region.booleanOperation !== null && region.booleanOperation !== undefined) {
    BinDucRegion.addBooleanOperation(builder, region.booleanOperation);
  }
  return BinDucRegion.endDucRegion(builder);
};
