import { DucGroup as BinDucGroup, UserToFollow, ActiveTool, ExportedDataState } from '../duc';
import { SupportedMeasures } from '../../utils/measurements';
import { WritingLayers } from "../../utils/writingLayers";
import { AppState, NormalizedZoomValue } from '../../../types';
import { Arrowhead, DucGroup, FillStyle, PointerType, StrokeRoundness, StrokeStyle } from '../../../element/types';


export const parseGroupsToAppStateFromBinary = (d: ExportedDataState | null): Partial<AppState> => {
  if (!d) return {};

  // Parse groups
  let groups: DucGroup[] = [];
  for (let i = 0; i < d.groupsLength(); i++) {
    const group = d.groups(i);
    if (group) {
      groups.push({
        id: group.id() || '',
        label: group.label() || '',
        type: 'group',
        writingLayer: (group.writingLayer() || '') as WritingLayers,
        scope: (group.scope() || '') as SupportedMeasures,
        isCollapsed: group.isCollapsed(),
      });
    }
  }  

  return {
    groups: groups,
    viewBackgroundColor: d.backgroundColor() || '',
  };
};
