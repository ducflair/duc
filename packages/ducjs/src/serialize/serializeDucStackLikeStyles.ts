import { DucStackLikeStyles } from 'ducjs/duc';
import { DucStackLikeStyles as AppDucStackLikeStyles } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucStackLikeStyles = (
  builder: flatbuffers.Builder,
  styles: AppDucStackLikeStyles,
): flatbuffers.Offset => {
  // Create string offset for labeling color
  const labelingColorOffset = builder.createString(styles.labelingColor || '#000000');

  // Create the styles
  DucStackLikeStyles.startDucStackLikeStyles(builder);
  DucStackLikeStyles.addOpacity(builder, styles.opacity ?? null!);
  DucStackLikeStyles.addLabelingColor(builder, labelingColorOffset);

  return DucStackLikeStyles.endDucStackLikeStyles(builder);
};
