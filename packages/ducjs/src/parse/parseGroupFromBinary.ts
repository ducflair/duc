import {
  DucGroup as BinDucGroup,
} from 'ducjs/duc';
import { Scope } from 'ducjs/types';
import { DucGroup } from 'ducjs/types/elements';
import { parseDucStackBaseFromBinary } from './parseElementFromBinary';

export const parseGroupFromBinary = (
  group: BinDucGroup,
  currentScope: Scope
): DucGroup | null => {
  if (!group) return null;

  const id = group.id();
  const stackBase = parseDucStackBaseFromBinary(group.stackBase())
  if (!stackBase) {
    return null;
  }

  return {
    id: id!,
    ...stackBase,
  };
}; 