import * as flatbuffers from 'flatbuffers';
import {
  DucGroup as BinDucGroup,
} from '@duc/canvas/duc/duc-ts/duc';
import { DucGroup } from '@duc/canvas/element/types';
import { serializeElementStroke, serializeElementBackground } from './serializeElementFromDuc';

export const serializeDucGroup = (
  builder: flatbuffers.Builder,
  group: DucGroup,
  forRenderer: boolean = false
): flatbuffers.Offset => {
  // Create string offsets
  const idOffset = builder.createString(group.id);
  const labelOffset = builder.createString(group.label);
  const descriptionOffset = group.description ? builder.createString(group.description) : null;
  const labelingColorOffset = builder.createString(group.labelingColor);

  // Serialize stroke and background overrides
  const strokeOverrideOffset = group.strokeOverride 
    ? serializeElementStroke(builder, group.strokeOverride, forRenderer)
    : null;
  const backgroundOverrideOffset = group.backgroundOverride 
    ? serializeElementBackground(builder, group.backgroundOverride)
    : null;

  // Create the group
  BinDucGroup.startDucGroup(builder);
  BinDucGroup.addId(builder, idOffset);
  BinDucGroup.addLabel(builder, labelOffset);
  if (descriptionOffset) {
    BinDucGroup.addDescription(builder, descriptionOffset);
  }
  BinDucGroup.addIsCollapsed(builder, group.isCollapsed);
  BinDucGroup.addNoPlot(builder, group.noPlot);
  BinDucGroup.addLocked(builder, group.locked);
  BinDucGroup.addIsVisible(builder, group.isVisible);
  BinDucGroup.addOpacity(builder, group.opacity);
  BinDucGroup.addLabelingColor(builder, labelingColorOffset);
  if (strokeOverrideOffset) {
    BinDucGroup.addStrokeOverride(builder, strokeOverrideOffset);
  }
  if (backgroundOverrideOffset) {
    BinDucGroup.addBackgroundOverride(builder, backgroundOverrideOffset);
  }
  BinDucGroup.addClip(builder, group.clip);

  return BinDucGroup.endDucGroup(builder);
}; 