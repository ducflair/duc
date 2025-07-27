import {
  DucGroup as BinDucGroup,
} from 'ducjs/duc';
import { Scope } from 'ducjs/types';
import { DucGroup } from 'ducjs/types/elements';

export const parseGroupFromBinary = (
  group: BinDucGroup,
  currentScope: Scope
): Partial<DucGroup> | null => {
  if (!group) return null;

  const id = group.id() || undefined;


  return {
    id,
  };
}; 