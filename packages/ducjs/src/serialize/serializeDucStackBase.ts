import { _DucStackBase } from 'ducjs/duc';
import { serializeDucStackLikeStyles } from 'ducjs/serialize/serializeDucStackLikeStyles';
import { DucGroup } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucStackBase = (
  builder: flatbuffers.Builder,
  group: DucGroup,
): flatbuffers.Offset => {
  const labelOffset = builder.createString(group.label);
  const descriptionOffset = group.description ? builder.createString(group.description) : null;

  const stylesOffset = serializeDucStackLikeStyles(builder, {
    opacity: group.opacity,
    labelingColor: group.labelingColor,
  });

  _DucStackBase.start_DucStackBase(builder);
  _DucStackBase.addLabel(builder, labelOffset);
  if (descriptionOffset) {
    _DucStackBase.addDescription(builder, descriptionOffset);
  }
  if (group.isCollapsed !== undefined) {
    _DucStackBase.addIsCollapsed(builder, group.isCollapsed);
  }
  if (group.isPlot !== undefined) {
    _DucStackBase.addIsPlot(builder, group.isPlot);
  }
  if (group.isVisible !== undefined) {
    _DucStackBase.addIsVisible(builder, group.isVisible);
  }
  if (group.locked !== undefined) {
    _DucStackBase.addLocked(builder, group.locked);
  }
  if (stylesOffset) {
    _DucStackBase.addStyles(builder, stylesOffset);
  }

  return _DucStackBase.end_DucStackBase(builder);
};
