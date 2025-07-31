import { DucLayer as BinDucLayer, DucLayerOverrides as BinDucLayerOverrides } from 'ducjs/duc';
import { serializeDucStackBase } from 'ducjs/serialize/serializeDucStackBase';
import { serializeElementBackground, serializeElementStroke } from 'ducjs/serialize/serializeElementFromDuc';
import type { DucLayer } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

const serializeDucLayerOverrides = (
  builder: flatbuffers.Builder,
  overrides: DucLayer["overrides"]
): flatbuffers.Offset | null => {
  if (!overrides) return null;
  
  const strokeOffset = serializeElementStroke(builder, overrides.stroke);
  const backgroundOffset = serializeElementBackground(builder, overrides.background);

  BinDucLayerOverrides.startDucLayerOverrides(builder);
  BinDucLayerOverrides.addStroke(builder, strokeOffset);
  BinDucLayerOverrides.addBackground(builder, backgroundOffset);
  return BinDucLayerOverrides.endDucLayerOverrides(builder);
};

export const serializeLayerFromDuc = (
  builder: flatbuffers.Builder,
  layer: DucLayer
): flatbuffers.Offset => {
  const idOffset = builder.createString(layer.id);
  const stackBaseOffset = serializeDucStackBase(builder, layer);
  const overridesOffset = layer.overrides ? serializeDucLayerOverrides(builder, layer.overrides) : null;

  BinDucLayer.startDucLayer(builder);
  BinDucLayer.addId(builder, idOffset);
  BinDucLayer.addStackBase(builder, stackBaseOffset);
  if (layer.readonly !== undefined) BinDucLayer.addReadonly(builder, layer.readonly);
  if (overridesOffset) BinDucLayer.addOverrides(builder, overridesOffset);
  return BinDucLayer.endDucLayer(builder);
};
