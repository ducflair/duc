import type {
  Standard,
  StandardOverrides,
  StandardStyles,
  StandardUnits,
  StandardValidation,
  StandardViewSettings,
} from 'ducjs/technical/standards';
import type {
    DucCommonStyle,
    DucDimensionStyle,
    DucDocStyle,
    DucFeatureControlFrameStyle,
    DucHatchStyle,
    DucLeaderStyle,
    DucStackLikeStyles,
    DucTableStyle,
    DucTextStyle,
    DucUcs,
    DucView,
    DucViewportStyle,
    DucXRayStyle,
    GridSettings,
    Identifier,
    SnapSettings,
} from 'ducjs/types';
import {
  StandardOverrides as BinStandardOverrides,
  StandardStyles as BinStandardStyles,
  StandardUnits as BinStandardUnits,
  StandardValidation as BinStandardValidation,
  StandardViewSettings as BinStandardViewSettings,
  UnitPrecision as BinUnitPrecision,
  IdentifiedCommonStyle as BinIdentifiedCommonStyle,
  IdentifiedStackLikeStyle as BinIdentifiedStackLikeStyle,
  IdentifiedTextStyle as BinIdentifiedTextStyle,
  IdentifiedDimensionStyle as BinIdentifiedDimensionStyle,
  IdentifiedLeaderStyle as BinIdentifiedLeaderStyle,
  IdentifiedFCFStyle as BinIdentifiedFCFStyle,
  IdentifiedTableStyle as BinIdentifiedTableStyle,
  IdentifiedDocStyle as BinIdentifiedDocStyle,
  IdentifiedViewportStyle as BinIdentifiedViewportStyle,
  IdentifiedHatchStyle as BinIdentifiedHatchStyle,
  IdentifiedXRayStyle as BinIdentifiedXRayStyle,
  IdentifiedGridSettings as BinIdentifiedGridSettings,
  IdentifiedSnapSettings as BinIdentifiedSnapSettings,
  IdentifiedUcs as BinIdentifiedUcs,
  IdentifiedView as BinIdentifiedView,
  PrimaryUnits as BinPrimaryUnits,
  AlternateUnits as BinAlternateUnits,
  LinearUnitSystem as BinLinearUnitSystem,
  AngularUnitSystem as BinAngularUnitSystem,
  DimensionValidationRules as BinDimensionValidationRules,
  LayerValidationRules as BinLayerValidationRules,
  GridSettings as BinGridSettings,
  SnapSettings as BinSnapSettings,
  DucUcs as BinDucUcs,
  DucView as BinDucView,
  Identifier as BinIdentifier,
  DucCommonStyle as BinDucCommonStyle,
  DucStackLikeStyles as BinDucStackLikeStyles,
  DucTextStyle as BinDucTextStyle,
  DucPoint as BinPoint,
  GeometricPoint as BinSimplePoint,
} from 'ducjs/duc';
import * as flatbuffers from 'flatbuffers';
import { serializeElementBackground, serializeElementStroke } from './serializeElementFromDuc';
import { getPrecisionValueField } from './serializationUtils';

const serializeIdentifier = (builder: flatbuffers.Builder, id: Identifier): flatbuffers.Offset => {
    const idOffset = builder.createString(id.id);
    const nameOffset = builder.createString(id.name);
    const descriptionOffset = id.description ? builder.createString(id.description) : 0;
    
    BinIdentifier.startIdentifier(builder);
    BinIdentifier.addId(builder, idOffset);
    BinIdentifier.addName(builder, nameOffset);
    if(descriptionOffset) BinIdentifier.addDescription(builder, descriptionOffset);
    return BinIdentifier.endIdentifier(builder);
}

export const serializeStandardOverrides = (builder: flatbuffers.Builder, overrides: StandardOverrides): flatbuffers.Offset => {
    const mainScopeOffset = overrides.mainScope ? builder.createString(overrides.mainScope) : 0;
    const commonStyleIdOffset = overrides.commonStyleId ? builder.createString(overrides.commonStyleId) : 0;
    const stackLikeStyleIdOffset = overrides.stackLikeStyleId ? builder.createString(overrides.stackLikeStyleId) : 0;
    const textStyleIdOffset = overrides.textStyleId ? builder.createString(overrides.textStyleId) : 0;
    const dimensionStyleIdOffset = overrides.dimensionStyleId ? builder.createString(overrides.dimensionStyleId) : 0;
    const leaderStyleIdOffset = overrides.leaderStyleId ? builder.createString(overrides.leaderStyleId) : 0;
    const featureControlFrameStyleIdOffset = overrides.featureControlFrameStyleId ? builder.createString(overrides.featureControlFrameStyleId) : 0;
    const tableStyleIdOffset = overrides.tableStyleId ? builder.createString(overrides.tableStyleId) : 0;
    const docStyleIdOffset = overrides.docStyleId ? builder.createString(overrides.docStyleId) : 0;
    const viewportStyleIdOffset = overrides.viewportStyleId ? builder.createString(overrides.viewportStyleId) : 0;
    const plotStyleIdOffset = overrides.plotStyleId ? builder.createString(overrides.plotStyleId) : 0;
    const hatchStyleIdOffset = overrides.hatchStyleId ? builder.createString(overrides.hatchStyleId) : 0;
    const activeGridSettingsIdVector = overrides.activeGridSettingsId ? BinStandardOverrides.createActiveGridSettingsIdVector(builder, overrides.activeGridSettingsId.map(id => builder.createString(id))) : 0;
    const activeSnapSettingsIdOffset = overrides.activeSnapSettingsId ? builder.createString(overrides.activeSnapSettingsId) : 0;
    const dashLineOverrideOffset = overrides.dashLineOverride ? builder.createString(overrides.dashLineOverride) : 0;

    BinStandardOverrides.startStandardOverrides(builder);
    if (mainScopeOffset) BinStandardOverrides.addMainScope(builder, mainScopeOffset);
    if (overrides.elementsStrokeWidthOverride) BinStandardOverrides.addElementsStrokeWidthOverride(builder, overrides.elementsStrokeWidthOverride.value);
    if (commonStyleIdOffset) BinStandardOverrides.addCommonStyleId(builder, commonStyleIdOffset);
    if (stackLikeStyleIdOffset) BinStandardOverrides.addStackLikeStyleId(builder, stackLikeStyleIdOffset);
    if (textStyleIdOffset) BinStandardOverrides.addTextStyleId(builder, textStyleIdOffset);
    if (dimensionStyleIdOffset) BinStandardOverrides.addDimensionStyleId(builder, dimensionStyleIdOffset);
    if (leaderStyleIdOffset) BinStandardOverrides.addLeaderStyleId(builder, leaderStyleIdOffset);
    if (featureControlFrameStyleIdOffset) BinStandardOverrides.addFeatureControlFrameStyleId(builder, featureControlFrameStyleIdOffset);
    if (tableStyleIdOffset) BinStandardOverrides.addTableStyleId(builder, tableStyleIdOffset);
    if (docStyleIdOffset) BinStandardOverrides.addDocStyleId(builder, docStyleIdOffset);
    if (viewportStyleIdOffset) BinStandardOverrides.addViewportStyleId(builder, viewportStyleIdOffset);
    if (plotStyleIdOffset) BinStandardOverrides.addPlotStyleId(builder, plotStyleIdOffset);
    if (hatchStyleIdOffset) BinStandardOverrides.addHatchStyleId(builder, hatchStyleIdOffset);
    if (activeGridSettingsIdVector) BinStandardOverrides.addActiveGridSettingsId(builder, activeGridSettingsIdVector);
    if (activeSnapSettingsIdOffset) BinStandardOverrides.addActiveSnapSettingsId(builder, activeSnapSettingsIdOffset);
    if (dashLineOverrideOffset) BinStandardOverrides.addDashLineOverride(builder, dashLineOverrideOffset);
    
    if (overrides.unitPrecision) {
        BinUnitPrecision.startUnitPrecision(builder);
        if(overrides.unitPrecision.linear) BinUnitPrecision.addLinear(builder, overrides.unitPrecision.linear);
        if(overrides.unitPrecision.angular) BinUnitPrecision.addAngular(builder, overrides.unitPrecision.angular);
        if(overrides.unitPrecision.area) BinUnitPrecision.addArea(builder, overrides.unitPrecision.area);
        if(overrides.unitPrecision.volume) BinUnitPrecision.addVolume(builder, overrides.unitPrecision.volume);
        const unitPrecisionOffset = BinUnitPrecision.endUnitPrecision(builder);
        BinStandardOverrides.addUnitPrecision(builder, unitPrecisionOffset);
    }

    return BinStandardOverrides.endStandardOverrides(builder);
};

// Helper for common style serialization
const serializeDucCommonStyle = (builder: flatbuffers.Builder, style: DucCommonStyle): flatbuffers.Offset => {
    const backgroundOffset = style.background ? serializeElementBackground(builder, style.background) : 0;
    const strokeOffset = style.stroke ? serializeElementStroke(builder, style.stroke) : 0;

    BinDucCommonStyle.startDucCommonStyle(builder);
    if (backgroundOffset) BinDucCommonStyle.addBackground(builder, backgroundOffset);
    if (strokeOffset) BinDucCommonStyle.addStroke(builder, strokeOffset);
    return BinDucCommonStyle.endDucCommonStyle(builder);
};

const serializeIdentifiedCommonStyle = (builder: flatbuffers.Builder, style: Identifier & DucCommonStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucCommonStyle(builder, style);

    BinIdentifiedCommonStyle.startIdentifiedCommonStyle(builder);
    BinIdentifiedCommonStyle.addId(builder, idOffset);
    BinIdentifiedCommonStyle.addStyle(builder, styleOffset);
    return BinIdentifiedCommonStyle.endIdentifiedCommonStyle(builder);
};

// Helper for stack-like style serialization
const serializeDucStackLikeStyles = (builder: flatbuffers.Builder, style: DucStackLikeStyles): flatbuffers.Offset => {
    const labelingColorOffset = style.labelingColor ? builder.createString(style.labelingColor) : 0;

    BinDucStackLikeStyles.startDucStackLikeStyles(builder);
    if (style.opacity) BinDucStackLikeStyles.addOpacity(builder, style.opacity);
    if (labelingColorOffset) BinDucStackLikeStyles.addLabelingColor(builder, labelingColorOffset);
    return BinDucStackLikeStyles.endDucStackLikeStyles(builder);
};

const serializeIdentifiedStackLikeStyle = (builder: flatbuffers.Builder, style: Identifier & DucStackLikeStyles): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucStackLikeStyles(builder, style);

    BinIdentifiedStackLikeStyle.startIdentifiedStackLikeStyle(builder);
    BinIdentifiedStackLikeStyle.addId(builder, idOffset);
    BinIdentifiedStackLikeStyle.addStyle(builder, styleOffset);
    return BinIdentifiedStackLikeStyle.endIdentifiedStackLikeStyle(builder);
};

// Helper for text style serialization
const serializeDucTextStyle = (builder: flatbuffers.Builder, style: DucTextStyle): flatbuffers.Offset => {
    const fontFamilyOffset = style.fontFamily ? builder.createString(style.fontFamily.toString()) : 0; // FIXME: In the future when we handle better font families, this should be fixed.
    const bigFontFamilyOffset = style.bigFontFamily ? builder.createString(style.bigFontFamily) : 0;
    const lineSpacingOffset = style.lineSpacing ? serializeLineSpacing(builder, style.lineSpacing) : 0;

    BinDucTextStyle.startDucTextStyle(builder);
    if (style.isLtr) BinDucTextStyle.addIsLtr(builder, style.isLtr);
    if (fontFamilyOffset) BinDucTextStyle.addFontFamily(builder, fontFamilyOffset);
    if (bigFontFamilyOffset) BinDucTextStyle.addBigFontFamily(builder, bigFontFamilyOffset);
    if (style.textAlign) BinDucTextStyle.addTextAlign(builder, style.textAlign);
    if (style.verticalAlign) BinDucTextStyle.addVerticalAlign(builder, style.verticalAlign);
    if (style.lineHeight) BinDucTextStyle.addLineHeight(builder, style.lineHeight);
    if (lineSpacingOffset) BinDucTextStyle.addLineSpacing(builder, lineSpacingOffset);
    if (style.obliqueAngle) BinDucTextStyle.addObliqueAngle(builder, style.obliqueAngle);
    if (style.fontSize) BinDucTextStyle.addFontSize(builder, style.fontSize.value);
    if (style.paperTextHeight) BinDucTextStyle.addPaperTextHeight(builder, style.paperTextHeight.value);
    if (style.widthFactor) BinDucTextStyle.addWidthFactor(builder, style.widthFactor);
    if (style.isUpsideDown) BinDucTextStyle.addIsUpsideDown(builder, style.isUpsideDown);
    if (style.isBackwards) BinDucTextStyle.addIsBackwards(builder, style.isBackwards);
    return BinDucTextStyle.endDucTextStyle(builder);
};

const serializeIdentifiedTextStyle = (builder: flatbuffers.Builder, style: Identifier & DucTextStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucTextStyle(builder, style);

    BinIdentifiedTextStyle.startIdentifiedTextStyle(builder);
    BinIdentifiedTextStyle.addId(builder, idOffset);
    BinIdentifiedTextStyle.addStyle(builder, styleOffset);
    return BinIdentifiedTextStyle.endIdentifiedTextStyle(builder);
};

// Placeholder for LineSpacing, will be implemented later
const serializeLineSpacing = (builder: flatbuffers.Builder, lineSpacing: any): flatbuffers.Offset => {
    return 0;
};

// Placeholder for DimensionStyle, will be implemented later
const serializeDucDimensionStyle = (builder: flatbuffers.Builder, style: DucDimensionStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedDimensionStyle = (builder: flatbuffers.Builder, style: Identifier & DucDimensionStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucDimensionStyle(builder, style);

    BinIdentifiedDimensionStyle.startIdentifiedDimensionStyle(builder);
    BinIdentifiedDimensionStyle.addId(builder, idOffset);
    BinIdentifiedDimensionStyle.addStyle(builder, styleOffset);
    return BinIdentifiedDimensionStyle.endIdentifiedDimensionStyle(builder);
};

// Placeholder for LeaderStyle, will be implemented later
const serializeDucLeaderStyle = (builder: flatbuffers.Builder, style: DucLeaderStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedLeaderStyle = (builder: flatbuffers.Builder, style: Identifier & DucLeaderStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucLeaderStyle(builder, style);

    BinIdentifiedLeaderStyle.startIdentifiedLeaderStyle(builder);
    BinIdentifiedLeaderStyle.addId(builder, idOffset);
    BinIdentifiedLeaderStyle.addStyle(builder, styleOffset);
    return BinIdentifiedLeaderStyle.endIdentifiedLeaderStyle(builder);
};

// Placeholder for FeatureControlFrameStyle, will be implemented later
const serializeDucFeatureControlFrameStyle = (builder: flatbuffers.Builder, style: DucFeatureControlFrameStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedFCFStyle = (builder: flatbuffers.Builder, style: Identifier & DucFeatureControlFrameStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucFeatureControlFrameStyle(builder, style);

    BinIdentifiedFCFStyle.startIdentifiedFCFStyle(builder);
    BinIdentifiedFCFStyle.addId(builder, idOffset);
    BinIdentifiedFCFStyle.addStyle(builder, styleOffset);
    return BinIdentifiedFCFStyle.endIdentifiedFCFStyle(builder);
};

// Placeholder for TableStyle, will be implemented later
const serializeDucTableStyle = (builder: flatbuffers.Builder, style: DucTableStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedTableStyle = (builder: flatbuffers.Builder, style: Identifier & DucTableStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucTableStyle(builder, style);

    BinIdentifiedTableStyle.startIdentifiedTableStyle(builder);
    BinIdentifiedTableStyle.addId(builder, idOffset);
    BinIdentifiedTableStyle.addStyle(builder, styleOffset);
    return BinIdentifiedTableStyle.endIdentifiedTableStyle(builder);
};

// Placeholder for DocStyle, will be implemented later
const serializeDucDocStyle = (builder: flatbuffers.Builder, style: DucDocStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedDocStyle = (builder: flatbuffers.Builder, style: Identifier & DucDocStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucDocStyle(builder, style);

    BinIdentifiedDocStyle.startIdentifiedDocStyle(builder);
    BinIdentifiedDocStyle.addId(builder, idOffset);
    BinIdentifiedDocStyle.addStyle(builder, styleOffset);
    return BinIdentifiedDocStyle.endIdentifiedDocStyle(builder);
};

// Placeholder for ViewportStyle, will be implemented later
const serializeDucViewportStyle = (builder: flatbuffers.Builder, style: DucViewportStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedViewportStyle = (builder: flatbuffers.Builder, style: Identifier & DucViewportStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucViewportStyle(builder, style);

    BinIdentifiedViewportStyle.startIdentifiedViewportStyle(builder);
    BinIdentifiedViewportStyle.addId(builder, idOffset);
    BinIdentifiedViewportStyle.addStyle(builder, styleOffset);
    return BinIdentifiedViewportStyle.endIdentifiedViewportStyle(builder);
};

// Placeholder for HatchStyle, will be implemented later
const serializeDucHatchStyle = (builder: flatbuffers.Builder, style: DucHatchStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedHatchStyle = (builder: flatbuffers.Builder, style: Identifier & DucHatchStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucHatchStyle(builder, style);

    BinIdentifiedHatchStyle.startIdentifiedHatchStyle(builder);
    BinIdentifiedHatchStyle.addId(builder, idOffset);
    BinIdentifiedHatchStyle.addStyle(builder, styleOffset);
    return BinIdentifiedHatchStyle.endIdentifiedHatchStyle(builder);
};

// Placeholder for XRayStyle, will be implemented later
const serializeDucXRayStyle = (builder: flatbuffers.Builder, style: DucXRayStyle): flatbuffers.Offset => {
    return 0;
};

const serializeIdentifiedXRayStyle = (builder: flatbuffers.Builder, style: Identifier & DucXRayStyle): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, style);
    const styleOffset = serializeDucXRayStyle(builder, style);

    BinIdentifiedXRayStyle.startIdentifiedXRayStyle(builder);
    BinIdentifiedXRayStyle.addId(builder, idOffset);
    BinIdentifiedXRayStyle.addStyle(builder, styleOffset);
    return BinIdentifiedXRayStyle.endIdentifiedXRayStyle(builder);
};

export const serializeStandardStyles = (builder: flatbuffers.Builder, styles: StandardStyles): flatbuffers.Offset => {
    const commonStylesOffsets = styles.commonStyles.map(s => serializeIdentifiedCommonStyle(builder, s));
    const commonStylesVector = BinStandardStyles.createCommonStylesVector(builder, commonStylesOffsets);

    const stackLikeStylesOffsets = styles.stackLikeStyles.map(s => serializeIdentifiedStackLikeStyle(builder, s));
    const stackLikeStylesVector = BinStandardStyles.createStackLikeStylesVector(builder, stackLikeStylesOffsets);

    const textStylesOffsets = styles.textStyles.map(s => serializeIdentifiedTextStyle(builder, s));
    const textStylesVector = BinStandardStyles.createTextStylesVector(builder, textStylesOffsets);

    const dimensionStylesOffsets = styles.dimensionStyles.map(s => serializeIdentifiedDimensionStyle(builder, s));
    const dimensionStylesVector = BinStandardStyles.createDimensionStylesVector(builder, dimensionStylesOffsets);

    const leaderStylesOffsets = styles.leaderStyles.map(s => serializeIdentifiedLeaderStyle(builder, s));
    const leaderStylesVector = BinStandardStyles.createLeaderStylesVector(builder, leaderStylesOffsets);

    const fcfStylesOffsets = styles.featureControlFrameStyles.map(s => serializeIdentifiedFCFStyle(builder, s));
    const fcfStylesVector = BinStandardStyles.createFeatureControlFrameStylesVector(builder, fcfStylesOffsets);

    const tableStylesOffsets = styles.tableStyles.map(s => serializeIdentifiedTableStyle(builder, s));
    const tableStylesVector = BinStandardStyles.createTableStylesVector(builder, tableStylesOffsets);

    const docStylesOffsets = styles.docStyles.map(s => serializeIdentifiedDocStyle(builder, s));
    const docStylesVector = BinStandardStyles.createDocStylesVector(builder, docStylesOffsets);

    const viewportStylesOffsets = styles.viewportStyles.map(s => serializeIdentifiedViewportStyle(builder, s));
    const viewportStylesVector = BinStandardStyles.createViewportStylesVector(builder, viewportStylesOffsets);

    const hatchStylesOffsets = styles.hatchStyles.map(s => serializeIdentifiedHatchStyle(builder, s));
    const hatchStylesVector = BinStandardStyles.createHatchStylesVector(builder, hatchStylesOffsets);

    const xrayStylesOffsets = styles.xrayStyles.map(s => serializeIdentifiedXRayStyle(builder, s));
    const xrayStylesVector = BinStandardStyles.createXrayStylesVector(builder, xrayStylesOffsets);

    BinStandardStyles.startStandardStyles(builder);
    BinStandardStyles.addCommonStyles(builder, commonStylesVector);
    BinStandardStyles.addStackLikeStyles(builder, stackLikeStylesVector);
    BinStandardStyles.addTextStyles(builder, textStylesVector);
    BinStandardStyles.addDimensionStyles(builder, dimensionStylesVector);
    BinStandardStyles.addLeaderStyles(builder, leaderStylesVector);
    BinStandardStyles.addFeatureControlFrameStyles(builder, fcfStylesVector);
    BinStandardStyles.addTableStyles(builder, tableStylesVector);
    BinStandardStyles.addDocStyles(builder, docStylesVector);
    BinStandardStyles.addViewportStyles(builder, viewportStylesVector);
    BinStandardStyles.addHatchStyles(builder, hatchStylesVector);
    BinStandardStyles.addXrayStyles(builder, xrayStylesVector);
    return BinStandardStyles.endStandardStyles(builder);
};

const serializeDucView = (builder: flatbuffers.Builder, view: DucView): flatbuffers.Offset => {
    const centerPoint = view.centerPoint;
    // Provide mirroring as undefined/null for 2D points
    const centerXValue = getPrecisionValueField(centerPoint.x, false);
    const centerYValue = getPrecisionValueField(centerPoint.y, false);
    const centerPointOffset = BinPoint.createDucPoint(
        builder,
        centerXValue !== null ? centerXValue : 0,
        centerYValue !== null ? centerYValue : 0,
        null
    );
    const scopeOffset = builder.createString(view.scope);

    BinDucView.startDucView(builder);
    const scrollXValue = getPrecisionValueField(view.scrollX, false);
    if (scrollXValue !== null) BinDucView.addScrollX(builder, scrollXValue);
    const scrollYValue = getPrecisionValueField(view.scrollY, false);
    if (scrollYValue !== null) BinDucView.addScrollY(builder, scrollYValue);
    BinDucView.addZoom(builder, view.zoom.value);
    BinDucView.addTwistAngle(builder, view.twistAngle);
    BinDucView.addCenterPoint(builder, centerPointOffset);
    BinDucView.addScope(builder, scopeOffset);
    return BinDucView.endDucView(builder);
}

const serializeIdentifiedView = (builder: flatbuffers.Builder, view: Identifier & DucView): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, view);
    const viewOffset = serializeDucView(builder, view);

    BinIdentifiedView.startIdentifiedView(builder);
    BinIdentifiedView.addId(builder, idOffset);
    BinIdentifiedView.addView(builder, viewOffset);
    return BinIdentifiedView.endIdentifiedView(builder);
}

const serializeDucUcs = (builder: flatbuffers.Builder, ucs: DucUcs): flatbuffers.Offset => {
    let originOffset: flatbuffers.Offset | undefined;
    if (ucs.origin) {
        const xValue = typeof ucs.origin.x === 'number' ? ucs.origin.x : 0;
        const yValue = typeof ucs.origin.y === 'number' ? ucs.origin.y : 0;
        originOffset = BinSimplePoint.createGeometricPoint(builder, xValue, yValue);
    }

    BinDucUcs.startDucUcs(builder);
    if (originOffset) BinDucUcs.addOrigin(builder, originOffset);
    BinDucUcs.addAngle(builder, ucs.angle);
    return BinDucUcs.endDucUcs(builder);
}

const serializeIdentifiedUcs = (builder: flatbuffers.Builder, ucs: Identifier & DucUcs): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, ucs);
    const ucsOffset = serializeDucUcs(builder, ucs);

    BinIdentifiedUcs.startIdentifiedUcs(builder);
    BinIdentifiedUcs.addId(builder, idOffset);
    BinIdentifiedUcs.addUcs(builder, ucsOffset);
    return BinIdentifiedUcs.endIdentifiedUcs(builder);
}

const serializeGridSettings = (builder: flatbuffers.Builder, grid: GridSettings): flatbuffers.Offset => {
    // This is a complex object, for now we just serialize the basic fields
    BinGridSettings.startGridSettings(builder);
    BinGridSettings.addType(builder, grid.type);
    BinGridSettings.addReadonly(builder, grid.readonly);
    BinGridSettings.addDisplayType(builder, grid.displayType);
    BinGridSettings.addIsAdaptive(builder, grid.isAdaptive);
    const xSpacingValue = getPrecisionValueField(grid.xSpacing, false);
    if (xSpacingValue !== null) BinGridSettings.addXSpacing(builder, xSpacingValue);
    const ySpacingValue = getPrecisionValueField(grid.ySpacing, false);
    if (ySpacingValue !== null) BinGridSettings.addYSpacing(builder, ySpacingValue);
    BinGridSettings.addSubdivisions(builder, grid.subdivisions);
    // origin, rotation, majorStyle, minorStyle, polarSettings, isometricSettings are complex objects
    return BinGridSettings.endGridSettings(builder);
}

const serializeIdentifiedGridSettings = (builder: flatbuffers.Builder, grid: Identifier & GridSettings): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, grid);
    const gridOffset = serializeGridSettings(builder, grid);

    BinIdentifiedGridSettings.startIdentifiedGridSettings(builder);
    BinIdentifiedGridSettings.addId(builder, idOffset);
    BinIdentifiedGridSettings.addSettings(builder, gridOffset);
    return BinIdentifiedGridSettings.endIdentifiedGridSettings(builder);
}

const serializeSnapSettings = (builder: flatbuffers.Builder, snap: SnapSettings): flatbuffers.Offset => {
    // This is a complex object, for now we just serialize the basic fields
    BinSnapSettings.startSnapSettings(builder);
    BinSnapSettings.addReadonly(builder, snap.readonly);
    BinSnapSettings.addTwistAngle(builder, snap.twistAngle);
    BinSnapSettings.addSnapTolerance(builder, snap.snapTolerance);
    BinSnapSettings.addObjectSnapAperture(builder, snap.objectSnapAperture);
    BinSnapSettings.addIsOrthoModeOn(builder, snap.isOrthoModeOn);
    BinSnapSettings.addIsObjectSnapOn(builder, snap.isObjectSnapOn);
    // polarTracking, activeObjectSnapModes, snapPriority, trackingLineStyle, dynamicSnap, temporaryOverrides, layerSnapFilters, elementTypeFilters, snapMarkers are complex objects
    return BinSnapSettings.endSnapSettings(builder);
}

const serializeIdentifiedSnapSettings = (builder: flatbuffers.Builder, snap: Identifier & SnapSettings): flatbuffers.Offset => {
    const idOffset = serializeIdentifier(builder, snap);
    const snapOffset = serializeSnapSettings(builder, snap);

    BinIdentifiedSnapSettings.startIdentifiedSnapSettings(builder);
    BinIdentifiedSnapSettings.addId(builder, idOffset);
    BinIdentifiedSnapSettings.addSettings(builder, snapOffset);
    return BinIdentifiedSnapSettings.endIdentifiedSnapSettings(builder);
}

export const serializeStandardViewSettings = (builder: flatbuffers.Builder, viewSettings: StandardViewSettings): flatbuffers.Offset => {
    const viewsOffsets = viewSettings.views.map(v => serializeIdentifiedView(builder, v));
    const viewsVector = BinStandardViewSettings.createViewsVector(builder, viewsOffsets);

    const ucsOffsets = viewSettings.ucs.map(u => serializeIdentifiedUcs(builder, u));
    const ucsVector = BinStandardViewSettings.createUcsVector(builder, ucsOffsets);

    const gridSettingsOffsets = viewSettings.gridSettings.map(g => serializeIdentifiedGridSettings(builder, g));
    const gridSettingsVector = BinStandardViewSettings.createGridSettingsVector(builder, gridSettingsOffsets);

    const snapSettingsOffsets = viewSettings.snapSettings.map(s => serializeIdentifiedSnapSettings(builder, s));
    const snapSettingsVector = BinStandardViewSettings.createSnapSettingsVector(builder, snapSettingsOffsets);

    BinStandardViewSettings.startStandardViewSettings(builder);
    BinStandardViewSettings.addViews(builder, viewsVector);
    BinStandardViewSettings.addUcs(builder, ucsVector);
    BinStandardViewSettings.addGridSettings(builder, gridSettingsVector);
    BinStandardViewSettings.addSnapSettings(builder, snapSettingsVector);
    return BinStandardViewSettings.endStandardViewSettings(builder);
};

export const serializeStandardUnits = (builder: flatbuffers.Builder, units: StandardUnits): flatbuffers.Offset => {
    // These will require their own complex serialization functions.
    const primaryUnitsOffset = 0; // Placeholder
    const alternateUnitsOffset = 0; // Placeholder

    BinStandardUnits.startStandardUnits(builder);
    // BinStandardUnits.addPrimaryUnits(builder, primaryUnitsOffset);
    // BinStandardUnits.addAlternateUnits(builder, alternateUnitsOffset);
    return BinStandardUnits.endStandardUnits(builder);
};

export const serializeStandardValidation = (builder: flatbuffers.Builder, validation: StandardValidation): flatbuffers.Offset => {
    // These will require their own complex serialization functions.
    const dimensionRulesOffset = 0; // Placeholder
    const layerRulesOffset = 0; // Placeholder

    BinStandardValidation.startStandardValidation(builder);
    // BinStandardValidation.addDimensionRules(builder, dimensionRulesOffset);
    // BinStandardValidation.addLayerRules(builder, layerRulesOffset);
    return BinStandardValidation.endStandardValidation(builder);
};
