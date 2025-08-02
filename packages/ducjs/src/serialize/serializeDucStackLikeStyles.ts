import { DucStackLikeStyles } from 'ducjs/duc';
import { DucStackLikeStyles as AppDucStackLikeStyles } from 'ducjs/types/elements';
import * as flatbuffers from 'flatbuffers';

export const serializeDucStackLikeStyles = (
  builder: flatbuffers.Builder,
  styles: AppDucStackLikeStyles,
): flatbuffers.Offset => {
  DucStackLikeStyles.startDucStackLikeStyles(builder);

  if (typeof styles.opacity === 'number') {
    DucStackLikeStyles.addOpacity(builder, styles.opacity);
  }
  if (typeof styles.labelingColor === 'string') {
    const labelingColorOffset = builder.createString(styles.labelingColor);
    DucStackLikeStyles.addLabelingColor(builder, labelingColorOffset);
  }

  return DucStackLikeStyles.endDucStackLikeStyles(builder);
};
