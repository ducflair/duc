import { Standard as BinStandard, Identifier as BinIdentifier } from 'ducjs/duc';
import type { Standard } from 'ducjs/technical/standards';
import * as flatbuffers from 'flatbuffers';
import {
  serializeStandardOverrides,
  serializeStandardStyles,
  serializeStandardUnits,
  serializeStandardValidation,
  serializeStandardViewSettings,
} from './serializeStandardTypes';

const serializeIdentifierFromDuc = (
  builder: flatbuffers.Builder,
  standard: Standard
): flatbuffers.Offset => {
  const idOffset = builder.createString(standard.id);
  const nameOffset = builder.createString(standard.name);
  const descriptionOffset = standard.description ? builder.createString(standard.description) : 0;

  BinIdentifier.startIdentifier(builder);
  BinIdentifier.addId(builder, idOffset);
  BinIdentifier.addName(builder, nameOffset);
  if (descriptionOffset) BinIdentifier.addDescription(builder, descriptionOffset);
  return BinIdentifier.endIdentifier(builder);
};

export const serializeStandardFromDuc = (
  builder: flatbuffers.Builder,
  standard: Standard
): flatbuffers.Offset => {
  const identifierOffset = serializeIdentifierFromDuc(builder, standard);
  const versionOffset = builder.createString(standard.version);

  const overridesOffset = standard.overrides ? serializeStandardOverrides(builder, standard.overrides) : 0;
  const stylesOffset = standard.styles ? serializeStandardStyles(builder, standard.styles) : 0;
  const viewSettingsOffset = standard.viewSettings ? serializeStandardViewSettings(builder, standard.viewSettings) : 0;
  const unitsOffset = standard.units ? serializeStandardUnits(builder, standard.units) : 0;
  const validationOffset = standard.validation ? serializeStandardValidation(builder, standard.validation) : 0;

  BinStandard.startStandard(builder);
  BinStandard.addIdentifier(builder, identifierOffset);
  BinStandard.addVersion(builder, versionOffset);
  BinStandard.addReadonly(builder, standard.readonly);
  
  if (overridesOffset) BinStandard.addOverrides(builder, overridesOffset);
  if (stylesOffset) BinStandard.addStyles(builder, stylesOffset);
  if (viewSettingsOffset) BinStandard.addViewSettings(builder, viewSettingsOffset);
  if (unitsOffset) BinStandard.addUnits(builder, unitsOffset);
  if (validationOffset) BinStandard.addValidation(builder, validationOffset);
  
  return BinStandard.endStandard(builder);
};
