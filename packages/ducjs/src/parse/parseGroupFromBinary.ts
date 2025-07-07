import {
  DucGroup as BinDucGroup,
} from 'ducjs/duc';
import { DucGroup } from 'ducjs/types/elements';
import { Scope } from 'ducjs/types';
import { parseElementBinBackground, parseElementBinStroke } from './parseElementFromBinary';
import { Percentage } from 'ducjs/types/geometryTypes';

export const parseGroupFromBinary = (
  group: BinDucGroup,
  currentScope: Scope
): Partial<DucGroup> | null => {
  if (!group) return null;

  const id = group.id() || undefined;
  const label = group.label() || undefined;
  const description = group.description() || null;
  const isCollapsed = group.isCollapsed();
  const noPlot = group.noPlot() || undefined;
  const locked = group.locked();
  const isVisible = group.isVisible();
  const opacity = (group.opacity() as Percentage) || undefined;
  const labelingColor = group.labelingColor() || undefined;
  const clip = group.clip() || undefined;

  // Parse stroke and background overrides
  const strokeOverride = group.strokeOverride() 
    ? parseElementBinStroke(group.strokeOverride(), currentScope)
    : null;
  const backgroundOverride = group.backgroundOverride() 
    ? parseElementBinBackground(group.backgroundOverride())
    : null;

  return {
    id,
    label,
    description,
    isCollapsed,
    noPlot,
    locked,
    isVisible,
    opacity,
    labelingColor,
    strokeOverride,
    backgroundOverride,
    clip,
  };
}; 