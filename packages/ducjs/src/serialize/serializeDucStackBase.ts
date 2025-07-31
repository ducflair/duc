import { _DucStackBase } from 'ducjs/duc';
import { serializeDucStackLikeStyles } from 'ducjs/serialize/serializeDucStackLikeStyles';
import { DucGroup } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucStackBase = (
  builder: flatbuffers.Builder,
  group: DucGroup,
): flatbuffers.Offset => {
  // Create string offsets
  const labelOffset = builder.createString(group.label);
  const descriptionOffset = group.description ? builder.createString(group.description) : null;

  // Serialize stack-like styles (opacity, labelingColor)
  const stylesOffset = serializeDucStackLikeStyles(builder, {
    opacity: group.opacity,
    labelingColor: group.labelingColor,
  });

  // Create the stack base
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
  _DucStackBase.addIsVisible(builder, group.isVisible !== false);
  if (group.locked !== undefined) {
    _DucStackBase.addLocked(builder, group.locked);
  }
  _DucStackBase.addStyles(builder, stylesOffset);

  return _DucStackBase.end_DucStackBase(builder);
};
